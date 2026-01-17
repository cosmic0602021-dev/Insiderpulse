/**
 * Toss Login API Routes for Apps-in-Toss
 *
 * Implements OAuth2 flow with Toss using mTLS authentication.
 * Reference: https://developers-apps-in-toss.toss.im/login/develop.html
 */

import express from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

const router = express.Router();

// Initialize database
const db = drizzle(process.env.DATABASE_URL!, { schema });

// Toss API Base URL (공식 문서: https://developers-apps-in-toss.toss.im/login/develop.html)
const TOSS_API_BASE = 'https://apps-in-toss-api.toss.im';

// mTLS Certificate paths
const CERT_PATH = path.join(process.cwd(), 'certs', 'mtls_public.crt');
const KEY_PATH = path.join(process.cwd(), 'certs', 'mtls_private.key');

// In-memory session storage (production에서는 Redis 등 사용 권장)
// 토큰 기반 인증: accessToken을 키로 사용 (쿠키 사용 불가 - 앱인토스 문서 참조)
const tossUserSessions = new Map<string, {
  accessToken: string;
  refreshToken: string;
  userKey: string;
  expiresAt: number;
}>();

// accessToken으로 세션 찾기
function findSessionByAccessToken(accessToken: string) {
  for (const [, session] of tossUserSessions.entries()) {
    if (session.accessToken === accessToken) {
      return session;
    }
  }
  return null;
}

/**
 * mTLS를 사용하여 Toss API 호출
 */
async function callTossApi(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: object,
  accessToken?: string
): Promise<any> {
  console.log('[TossLogin] callTossApi called:', { method, endpoint });

  // Check if certificates exist (with detailed logging)
  const certExists = fs.existsSync(CERT_PATH);
  const keyExists = fs.existsSync(KEY_PATH);
  console.log('[TossLogin] Certificate check:', {
    certPath: CERT_PATH,
    certExists,
    keyPath: KEY_PATH,
    keyExists
  });

  if (!certExists || !keyExists) {
    console.error('[TossLogin] mTLS certificates not found!');
    throw new Error('mTLS certificates not configured');
  }

  const cert = fs.readFileSync(CERT_PATH);
  const key = fs.readFileSync(KEY_PATH);

  const url = new URL(endpoint, TOSS_API_BASE);

  const options: https.RequestOptions = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method,
    cert,
    key,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          // 상세 로깅: 토스 API 응답 전체 출력
          console.log('[TossLogin] Raw API response status:', res.statusCode);
          console.log('[TossLogin] Raw API response body:', data.substring(0, 500));

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            console.log('[TossLogin] Parsed response:', JSON.stringify(parsed, null, 2).substring(0, 500));
            resolve(parsed);
          } else {
            console.error('[TossLogin] API error:', res.statusCode, data);
            // 에러 응답도 파싱 시도
            try {
              const errorParsed = JSON.parse(data);
              reject(new Error(`Toss API error: ${res.statusCode} - ${JSON.stringify(errorParsed)}`));
            } catch {
              reject(new Error(`Toss API error: ${res.statusCode} - ${data}`));
            }
          }
        } catch (e) {
          console.error('[TossLogin] Response parse error:', e, 'raw data:', data.substring(0, 200));
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('[TossLogin] Request error:', e);
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * POST /api/toss-login/token
 * Exchange authorization code for access token
 *
 * 실제 Toss OAuth2 토큰 교환 구현
 * Reference: https://developers-apps-in-toss.toss.im/login/develop.html
 */
router.post('/token', async (req, res) => {
  try {
    const { authorizationCode, referrer } = req.body;

    console.log('[TossLogin] /token called:', {
      hasAuthCode: !!authorizationCode,
      codeLength: authorizationCode?.length,
      referrer
    });

    if (!authorizationCode) {
      return res.status(400).json({ error: 'Missing authorizationCode' });
    }

    // 실제 Toss API 호출하여 토큰 교환
    console.log('[TossLogin] Calling Toss API for token exchange...');

    let tokenResponse;
    try {
      tokenResponse = await callTossApi(
        'POST',
        '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
        { authorizationCode, referrer }
      );
      console.log('[TossLogin] Toss API response:', {
        hasAccessToken: !!tokenResponse?.success?.accessToken,
        hasUserKey: !!tokenResponse?.success?.userKey,
        resultType: tokenResponse?.resultType
      });
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      const errorStack = apiError instanceof Error ? apiError.stack : '';
      console.error('[TossLogin] Toss API call failed:', errorMessage);
      console.error('[TossLogin] Stack trace:', errorStack);
      return res.status(500).json({
        error: 'Toss API call failed',
        message: errorMessage,
        stack: errorStack,  // 디버깅용 스택 트레이스
      });
    }

    // Toss API 응답 검증 - 두 가지 형식 모두 지원
    // 1. { resultType: 'SUCCESS', success: { accessToken, ... } }
    // 2. { accessToken, refreshToken, ... } (직접 형태)
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    let userKey: string | undefined;
    let expiresIn: number | undefined;

    console.log('[TossLogin] Parsing token response, resultType:', tokenResponse?.resultType);

    if (tokenResponse?.resultType === 'SUCCESS' && tokenResponse?.success) {
      // 중첩 형태 (resultType + success 객체)
      console.log('[TossLogin] Using nested response format (resultType + success)');
      ({ accessToken, refreshToken, userKey, expiresIn } = tokenResponse.success);
    } else if (tokenResponse?.accessToken) {
      // 직접 형태 (accessToken이 루트에 있음)
      console.log('[TossLogin] Using direct response format');
      ({ accessToken, refreshToken, userKey, expiresIn } = tokenResponse);
    } else if (tokenResponse?.error || tokenResponse?.resultType === 'FAIL') {
      // 명시적 에러 응답
      console.error('[TossLogin] Toss API returned error:', tokenResponse?.error);
      return res.status(400).json({
        error: 'Toss token exchange failed',
        message: tokenResponse?.error?.reason || tokenResponse?.error?.message || 'Unknown Toss error',
        rawResponse: tokenResponse,
      });
    } else {
      // 알 수 없는 응답 형식
      console.error('[TossLogin] Unknown response format:', JSON.stringify(tokenResponse).substring(0, 300));
      return res.status(500).json({
        error: 'Unknown Toss API response format',
        rawResponse: tokenResponse,
      });
    }

    if (!accessToken || !userKey) {
      console.error('[TossLogin] Missing required fields - accessToken:', !!accessToken, 'userKey:', !!userKey);
      return res.status(500).json({
        error: 'Invalid Toss API response - missing accessToken or userKey',
        rawResponse: tokenResponse,
      });
    }

    console.log('[TossLogin] Token exchange successful, userKey:', userKey);

    // Store session with real Toss tokens (키는 userKey 사용)
    tossUserSessions.set(userKey, {
      accessToken,
      refreshToken: refreshToken || '',
      userKey,
      expiresAt: Date.now() + (expiresIn || 3600) * 1000,
    });

    // Check if user exists in our database, create if not
    let dbUser = await db.select().from(schema.users).where(eq(schema.users.id, `toss_${userKey}`)).limit(1);

    if (dbUser.length === 0) {
      // Create new user with Toss userKey
      console.log('[TossLogin] Creating new user for userKey:', userKey);
      await db.insert(schema.users).values({
        id: `toss_${userKey}`,
        email: `${userKey}@toss.user`,
        password: '', // No password for Toss login users
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        hasUsedTrial: false,
        createdAt: new Date(),
      });
    }

    // 쿠키 대신 accessToken을 직접 반환 (앱인토스에서 쿠키 기반 인증 불가)
    // 클라이언트는 이 토큰을 localStorage에 저장하고 Authorization 헤더로 전송
    console.log('[TossLogin] Returning accessToken to client for userKey:', userKey);

    return res.json({
      success: true,
      userId: `toss_${userKey}`,
      accessToken,  // 클라이언트가 저장해서 사용
      refreshToken: refreshToken || '',
      expiresIn: expiresIn || 3600,
    });

  } catch (error) {
    console.error('[TossLogin] Token exchange error:', error);
    return res.status(500).json({
      error: 'Token exchange failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/toss-login/me
 * Get current user info from session
 * Authorization 헤더에서 토큰을 받음 (쿠키 사용 불가 - 앱인토스 문서)
 */
router.get('/me', async (req, res) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[TossLogin] /me: No Authorization header');
      return res.status(401).json({ error: 'No authorization token' });
    }

    const accessToken = authHeader.substring(7); // "Bearer " 제거
    console.log('[TossLogin] /me: Checking token validity...');

    // accessToken으로 세션 찾기
    const session = findSessionByAccessToken(accessToken);
    if (!session) {
      console.log('[TossLogin] /me: Session not found for token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
      console.log('[TossLogin] /me: Session expired, trying to refresh...');
      // Try to refresh token
      try {
        const refreshResponse = await callTossApi(
          'POST',
          '/api-partner/v1/apps-in-toss/user/oauth2/refresh-token',
          { refreshToken: session.refreshToken }
        );

        if (refreshResponse?.success?.accessToken) {
          session.accessToken = refreshResponse.success.accessToken;
          session.expiresAt = Date.now() + (refreshResponse.success.expiresIn || 3600) * 1000;
          if (refreshResponse.success.refreshToken) {
            session.refreshToken = refreshResponse.success.refreshToken;
          }
          console.log('[TossLogin] /me: Token refreshed successfully');
        }
      } catch (refreshError) {
        console.error('[TossLogin] Token refresh failed:', refreshError);
        tossUserSessions.delete(session.userKey);
        return res.status(401).json({ error: 'Session expired' });
      }
    }

    // Get user from database
    const userId = `toss_${session.userKey}`;
    const dbUser = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

    if (dbUser.length === 0) {
      console.log('[TossLogin] /me: User not found in database:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[TossLogin] /me: User verified:', userId);
    return res.json({
      success: true,
      user: {
        id: dbUser[0].id,
        email: dbUser[0].email,
        tossUserId: session.userKey,
        subscriptionTier: dbUser[0].subscriptionTier,
        subscriptionStatus: dbUser[0].subscriptionStatus,
      },
      // 토큰이 갱신되었을 수 있으므로 현재 토큰 반환
      accessToken: session.accessToken,
    });

  } catch (error) {
    console.error('[TossLogin] Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/toss-login/refresh
 * Refresh access token
 * Authorization 헤더 또는 body에서 refreshToken을 받음
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Authorization 헤더에서 현재 accessToken 추출
    const authHeader = req.headers.authorization;
    let session = null;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      session = findSessionByAccessToken(accessToken);
    }

    const tokenToRefresh = refreshToken || session?.refreshToken;

    if (!tokenToRefresh) {
      return res.status(400).json({ error: 'No refresh token available' });
    }

    console.log('[TossLogin] Refreshing token...');
    const refreshResponse = await callTossApi(
      'POST',
      '/api-partner/v1/apps-in-toss/user/oauth2/refresh-token',
      { refreshToken: tokenToRefresh }
    );

    if (refreshResponse?.success) {
      const newAccessToken = refreshResponse.success.accessToken;
      const newRefreshToken = refreshResponse.success.refreshToken;
      const newExpiresIn = refreshResponse.success.expiresIn || 3600;

      if (session) {
        session.accessToken = newAccessToken;
        session.expiresAt = Date.now() + newExpiresIn * 1000;
        if (newRefreshToken) {
          session.refreshToken = newRefreshToken;
        }
      }

      console.log('[TossLogin] Token refreshed successfully');
      return res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || tokenToRefresh,
        expiresIn: newExpiresIn,
      });
    }

    return res.status(400).json({ error: 'Token refresh failed' });

  } catch (error) {
    console.error('[TossLogin] Refresh error:', error);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/toss-login/disconnect
 * Disconnect/logout user
 * Authorization 헤더에서 토큰을 받음
 */
router.post('/disconnect', async (req, res) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const session = findSessionByAccessToken(accessToken);

      if (session) {
        // Optionally call Toss API to revoke token
        try {
          await callTossApi(
            'POST',
            '/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token',
            { accessToken: session.accessToken }
          );
        } catch (e) {
          console.log('[TossLogin] Token revocation failed (ignoring):', e);
        }

        tossUserSessions.delete(session.userKey);
        console.log('[TossLogin] Session removed for userKey:', session.userKey);
      }
    }

    return res.json({ success: true });

  } catch (error) {
    console.error('[TossLogin] Disconnect error:', error);
    return res.status(500).json({ error: 'Disconnect failed' });
  }
});

/**
 * POST /api/toss-login/callback
 * Callback endpoint for Toss disconnect notifications
 */
router.post('/callback', async (req, res) => {
  try {
    const { userKey, referrer, reason } = req.body;

    console.log('[TossLogin] Disconnect callback received:', {
      userKey,
      referrer,
      reason, // UNLINK, WITHDRAWAL_TERMS, or WITHDRAWAL_TOSS
    });

    // Find and remove any sessions for this user
    for (const [sessionId, session] of tossUserSessions.entries()) {
      if (session.userKey === userKey) {
        tossUserSessions.delete(sessionId);
        console.log('[TossLogin] Removed session for disconnected user:', userKey);
      }
    }

    // Optionally update user status in database
    // await db.update(schema.users)
    //   .set({ subscriptionStatus: 'disconnected' })
    //   .where(eq(schema.users.id, `toss_${userKey}`));

    return res.json({ success: true });

  } catch (error) {
    console.error('[TossLogin] Callback error:', error);
    return res.status(500).json({ error: 'Callback processing failed' });
  }
});

export default router;
