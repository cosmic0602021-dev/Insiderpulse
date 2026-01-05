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
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

const router = express.Router();

// Initialize database
const db = drizzle(process.env.DATABASE_URL!, { schema });

// Toss API Base URL
const TOSS_API_BASE = 'https://api-partner.toss.im';

// mTLS Certificate paths
const CERT_PATH = path.join(process.cwd(), 'certs', 'mtls_public.crt');
const KEY_PATH = path.join(process.cwd(), 'certs', 'mtls_private.key');

// In-memory session storage (production에서는 Redis 등 사용 권장)
const tossUserSessions = new Map<string, {
  accessToken: string;
  refreshToken: string;
  userKey: string;
  expiresAt: number;
}>();

/**
 * mTLS를 사용하여 Toss API 호출
 */
async function callTossApi(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: object,
  accessToken?: string
): Promise<any> {
  // Check if certificates exist
  if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
    console.error('[TossLogin] mTLS certificates not found');
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
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            console.error('[TossLogin] API error:', res.statusCode, data);
            reject(new Error(`Toss API error: ${res.statusCode} - ${data}`));
          }
        } catch (e) {
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
 */
router.post('/token', async (req, res) => {
  try {
    const { authorizationCode, referrer } = req.body;

    if (!authorizationCode) {
      return res.status(400).json({ error: 'Missing authorizationCode' });
    }

    console.log('[TossLogin] Exchanging token, referrer:', referrer);

    // Call Toss API to exchange authorization code for token
    const tokenResponse = await callTossApi(
      'POST',
      '/api-partner/v1/apps-in-toss/user/oauth2/generate-token',
      {
        authorizationCode,
        referrer: referrer || 'DEFAULT',
      }
    );

    console.log('[TossLogin] Token response received:', {
      hasAccessToken: !!tokenResponse.accessToken,
      hasRefreshToken: !!tokenResponse.refreshToken,
      userKey: tokenResponse.userKey,
    });

    if (!tokenResponse.accessToken) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // userKey is the stable Toss user identifier
    const userKey = tokenResponse.userKey;

    // Store session
    const sessionId = `toss_${userKey}_${Date.now()}`;
    tossUserSessions.set(sessionId, {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      userKey,
      expiresAt: Date.now() + (tokenResponse.expiresIn || 3600) * 1000,
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

    // Set session cookie
    res.cookie('toss_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days (refresh token lifetime)
    });

    return res.json({
      success: true,
      userId: `toss_${userKey}`,
      expiresIn: tokenResponse.expiresIn,
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
 */
router.get('/me', async (req, res) => {
  try {
    const sessionId = req.cookies?.toss_session;

    if (!sessionId) {
      return res.status(401).json({ error: 'No session' });
    }

    const session = tossUserSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
      // Try to refresh token
      try {
        const refreshResponse = await callTossApi(
          'POST',
          '/api-partner/v1/apps-in-toss/user/oauth2/refresh-token',
          { refreshToken: session.refreshToken }
        );

        if (refreshResponse.accessToken) {
          session.accessToken = refreshResponse.accessToken;
          session.expiresAt = Date.now() + (refreshResponse.expiresIn || 3600) * 1000;
          if (refreshResponse.refreshToken) {
            session.refreshToken = refreshResponse.refreshToken;
          }
        }
      } catch (refreshError) {
        console.error('[TossLogin] Token refresh failed:', refreshError);
        tossUserSessions.delete(sessionId);
        return res.status(401).json({ error: 'Session expired' });
      }
    }

    // Get user from database
    const userId = `toss_${session.userKey}`;
    const dbUser = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

    if (dbUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: dbUser[0].id,
        email: dbUser[0].email,
        tossUserId: session.userKey,
        subscriptionTier: dbUser[0].subscriptionTier,
        subscriptionStatus: dbUser[0].subscriptionStatus,
      }
    });

  } catch (error) {
    console.error('[TossLogin] Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/toss-login/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const sessionId = req.cookies?.toss_session;

    if (!refreshToken && !sessionId) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const session = sessionId ? tossUserSessions.get(sessionId) : null;
    const tokenToRefresh = refreshToken || session?.refreshToken;

    if (!tokenToRefresh) {
      return res.status(400).json({ error: 'No refresh token available' });
    }

    const refreshResponse = await callTossApi(
      'POST',
      '/api-partner/v1/apps-in-toss/user/oauth2/refresh-token',
      { refreshToken: tokenToRefresh }
    );

    if (session) {
      session.accessToken = refreshResponse.accessToken;
      session.expiresAt = Date.now() + (refreshResponse.expiresIn || 3600) * 1000;
      if (refreshResponse.refreshToken) {
        session.refreshToken = refreshResponse.refreshToken;
      }
    }

    return res.json({
      success: true,
      expiresIn: refreshResponse.expiresIn,
    });

  } catch (error) {
    console.error('[TossLogin] Refresh error:', error);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/toss-login/disconnect
 * Disconnect/logout user
 */
router.post('/disconnect', async (req, res) => {
  try {
    const sessionId = req.cookies?.toss_session;

    if (sessionId) {
      const session = tossUserSessions.get(sessionId);

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

        tossUserSessions.delete(sessionId);
      }
    }

    // Clear cookie
    res.clearCookie('toss_session');

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
