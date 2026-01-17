/**
 * Toss Login SDK Wrapper for Apps-in-Toss
 *
 * This module provides a wrapper around the Toss appLogin SDK function
 * for authentication within the Apps-in-Toss environment.
 */

import { ENV_CONFIG } from './environment';
import { resolveApiUrl } from './queryClient';

// ✅ 정적 import 제거 - 동적 import로 변경하여 패키지 로드 실패 시에도 앱 작동
// import { appLogin } from '@apps-in-toss/web-framework';

// 동적으로 로드된 appLogin 함수 캐시
let appLoginApi: (() => Promise<{ authorizationCode: string; referrer: string }>) | undefined;

/**
 * appLogin API를 동적으로 로드
 */
async function ensureAppLoginAPI(): Promise<boolean> {
  if (appLoginApi) return true;

  try {
    console.log('[TossLogin] Loading appLogin API dynamically...');
    const framework = await import('@apps-in-toss/web-framework') as any;

    if (!framework.appLogin) {
      console.error('[TossLogin] appLogin function not found in framework');
      return false;
    }

    appLoginApi = framework.appLogin;
    console.log('[TossLogin] appLogin API loaded successfully');
    return true;
  } catch (error) {
    console.error('[TossLogin] Failed to load appLogin API:', error);
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`[TossLogin] API 로드 실패:\n${error instanceof Error ? error.message : String(error)}`);
    }
    return false;
  }
}

// Toss Login response types
export interface TossLoginResult {
  success: boolean;
  user?: TossUser;
  error?: string;
  authorizationCode?: string;
  referrer?: string;
}

export interface TossUser {
  id: string;
  email?: string;
  name?: string;
  tossUserId: string;
}

export interface TossTokenResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  success?: boolean;
  userId?: string; // 서버에서 생성/조회한 일관된 userId
  // 에러 정보 (실패 시)
  error?: string;
  message?: string;
  rawResponse?: any;
  stack?: string;
}

/**
 * Check if Toss appLogin is available
 */
export function isTossLoginAvailable(): boolean {
  return ENV_CONFIG.isAppintos;
}

/**
 * 앱 시작 시 기존 세션 확인 (자동 로그인)
 * 서버 API를 호출하여 실제 토스 토큰 유효성 검증
 */
export async function checkExistingTossSession(): Promise<TossUser | null> {
  if (!ENV_CONFIG.isAppintos) return null;

  try {
    // localStorage에서 토스 accessToken 확인
    const storedAccessToken = localStorage.getItem('toss_access_token');

    if (!storedAccessToken) {
      console.log('[TossLogin] No stored access token found');
      return null;
    }

    console.log('[TossLogin] Verifying stored token with server...');

    // 서버 API를 호출하여 토큰 유효성 검증
    const response = await fetch(resolveApiUrl('/api/toss-login/me'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${storedAccessToken}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      console.log('[TossLogin] Token validation failed, status:', response.status);
      // 토큰이 유효하지 않으면 localStorage 정리
      localStorage.removeItem('toss_access_token');
      localStorage.removeItem('toss_refresh_token');
      localStorage.removeItem('appintos_user_id');
      return null;
    }

    const data = await response.json();

    if (data.success && data.user) {
      console.log('[TossLogin] Token verified successfully, user:', data.user.id);

      // 토큰이 갱신되었을 수 있으므로 업데이트
      if (data.accessToken && data.accessToken !== storedAccessToken) {
        console.log('[TossLogin] Updating refreshed token');
        localStorage.setItem('toss_access_token', data.accessToken);
      }

      return {
        id: data.user.id,
        tossUserId: data.user.tossUserId,
        email: data.user.email,
      };
    }

    console.log('[TossLogin] Server returned invalid response');
    return null;
  } catch (error) {
    console.log('[TossLogin] Session check failed:', error);
    return null;
  }
}

/**
 * Request Toss Login using appLogin SDK from @apps-in-toss/web-framework
 * This initiates the Toss OAuth flow and returns an authorization code
 */
export async function requestTossLogin(): Promise<{ authorizationCode: string; referrer: string } | null> {
  if (!ENV_CONFIG.isAppintos) {
    console.warn('[TossLogin] Not in Apps-in-Toss environment');
    return null;
  }

  try {
    console.log('[TossLogin] Requesting Toss Login via SDK...');

    // ✅ 동적으로 appLogin API 로드
    const apiLoaded = await ensureAppLoginAPI();
    if (!apiLoaded || !appLoginApi) {
      console.error('[TossLogin] appLogin API not available');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('⚠️ [디버그] appLogin API 로드 실패\n\n@apps-in-toss/web-framework 패키지를 로드할 수 없습니다.\n\n가능한 원인:\n1. Granite 빌드 문제\n2. WebView 환경 아님\n3. 패키지 누락');
      }
      return null;
    }

    // Call the appLogin SDK function (동적 import 사용)
    const result = await appLoginApi();

    if (result && result.authorizationCode) {
      console.log('[TossLogin] Got authorization code, referrer:', result.referrer);
      return {
        authorizationCode: result.authorizationCode,
        referrer: result.referrer // 'sandbox' or 'DEFAULT'
      };
    }

    console.warn('[TossLogin] No authorization code received');
    return null;
  } catch (error: any) {
    // 상세 에러 로깅
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || 'NO_CODE';
    console.error('[TossLogin] appLogin failed:', {
      message: errorMessage,
      code: errorCode,
      error: error
    });

    // 에러 메시지를 alert로 표시 (디버깅용)
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`⚠️ [디버그] appLogin() 호출 실패\n\nCode: ${errorCode}\nMessage: ${errorMessage}`);
    }

    return null;
  }
}

/**
 * Exchange authorization code for tokens via our backend
 *
 * 서버의 /api/toss-login/token 엔드포인트를 호출하여 실제 토스 토큰 교환
 * 토큰을 localStorage에 저장 (쿠키 사용 불가 - 앱인토스 문서)
 */
export async function exchangeTossToken(authorizationCode: string, referrer: string): Promise<TossTokenResponse | null> {
  console.log('[TossLogin] Exchanging token via server API...');

  try {
    const response = await fetch(resolveApiUrl('/api/toss-login/token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorizationCode, referrer }),
      mode: 'cors',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[TossLogin] Server token exchange failed:', data);
      // alert 대신 에러 정보를 객체로 반환 (performTossLogin에서 처리)
      return {
        success: false,
        error: data.error || 'Unknown error',
        message: data.message,
        rawResponse: data.rawResponse,
        stack: data.stack,
      };
    }

    console.log('[TossLogin] Server token exchange successful:', {
      success: data.success,
      userId: data.userId,
      expiresIn: data.expiresIn
    });

    // 토큰을 localStorage에 저장 (쿠키 대신 사용)
    if (data.accessToken) {
      localStorage.setItem('toss_access_token', data.accessToken);
      console.log('[TossLogin] Access token saved to localStorage');
    }
    if (data.refreshToken) {
      localStorage.setItem('toss_refresh_token', data.refreshToken);
      console.log('[TossLogin] Refresh token saved to localStorage');
    }
    if (data.userId) {
      localStorage.setItem('appintos_user_id', data.userId);
    }

    return {
      success: data.success,
      userId: data.userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  } catch (error) {
    console.error('[TossLogin] Token exchange error:', error);
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`[TossLogin] 토큰 교환 오류\n\n${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
  }
}

/**
 * Get user info from Toss using stored token
 */
export async function getTossUserInfo(): Promise<TossUser | null> {
  try {
    const accessToken = localStorage.getItem('toss_access_token');
    if (!accessToken) {
      console.log('[TossLogin] No access token for getUserInfo');
      return null;
    }

    const response = await fetch(resolveApiUrl('/api/toss-login/me'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('[TossLogin] Get user info error:', error);
    return null;
  }
}

/**
 * Refresh Toss access token
 */
export async function refreshTossToken(refreshToken?: string): Promise<TossTokenResponse | null> {
  try {
    const storedRefreshToken = refreshToken || localStorage.getItem('toss_refresh_token');
    const accessToken = localStorage.getItem('toss_access_token');

    if (!storedRefreshToken && !accessToken) {
      console.log('[TossLogin] No tokens available for refresh');
      return null;
    }

    const response = await fetch(resolveApiUrl('/api/toss-login/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
      mode: 'cors',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // 새로운 토큰 저장
    if (data.accessToken) {
      localStorage.setItem('toss_access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('toss_refresh_token', data.refreshToken);
    }

    return data;
  } catch (error) {
    console.error('[TossLogin] Token refresh error:', error);
    return null;
  }
}

/**
 * Disconnect Toss Login (logout)
 */
export async function disconnectTossLogin(): Promise<boolean> {
  try {
    const accessToken = localStorage.getItem('toss_access_token');

    const response = await fetch(resolveApiUrl('/api/toss-login/disconnect'), {
      method: 'POST',
      headers: {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    // 로컬 토큰 정리
    localStorage.removeItem('toss_access_token');
    localStorage.removeItem('toss_refresh_token');
    localStorage.removeItem('appintos_user_id');

    return response.ok;
  } catch (error) {
    console.error('[TossLogin] Disconnect error:', error);
    // 오류가 나도 로컬 토큰은 정리
    localStorage.removeItem('toss_access_token');
    localStorage.removeItem('toss_refresh_token');
    localStorage.removeItem('appintos_user_id');
    return false;
  }
}

/**
 * Full Toss Login flow: Request auth code, exchange for tokens, get user info
 * 실제 토스 OAuth 플로우를 수행
 */
export async function performTossLogin(): Promise<TossLoginResult> {
  const debugLog = (step: string, data?: any) => {
    console.log(`[TossLogin] ${step}`, data);
  };

  try {
    // Step 0: 기존 세션 확인 (서버 검증)
    debugLog('Step 0: Checking existing session with server...');
    const existingUser = await checkExistingTossSession();
    if (existingUser) {
      debugLog('Step 0 SUCCESS: Server verified existing session', { userId: existingUser.id });
      return { success: true, user: existingUser };
    }

    debugLog('Step 1: Requesting authorization code from Toss SDK...');

    // Step 1: Request authorization code from Toss SDK (appLogin)
    const authResult = await requestTossLogin();

    if (!authResult) {
      debugLog('Step 1 FAILED: No auth result from appLogin');
      return { success: false, error: '토스 로그인을 취소했거나 SDK 호출에 실패했습니다.' };
    }

    debugLog('Step 1 SUCCESS: Got auth code', {
      codePrefix: authResult.authorizationCode.substring(0, 10) + '...',
      referrer: authResult.referrer
    });

    // Step 2: 서버에서 실제 토스 OAuth 토큰 교환
    debugLog('Step 2: Exchanging authorization code for tokens via server...');
    const tokenResult = await exchangeTossToken(authResult.authorizationCode, authResult.referrer);

    if (!tokenResult || !tokenResult.success || !tokenResult.userId) {
      debugLog('Step 2 FAILED: Token exchange failed', tokenResult);

      // 상세 에러 메시지 구성
      let errorMsg = '토스 서버와의 토큰 교환에 실패했습니다.';
      if (tokenResult?.error) {
        errorMsg += `\n\n[에러]: ${tokenResult.error}`;
      }
      if (tokenResult?.message) {
        errorMsg += `\n[원인]: ${tokenResult.message}`;
      }
      if (tokenResult?.rawResponse) {
        errorMsg += `\n\n[토스 API 응답]\n${JSON.stringify(tokenResult.rawResponse, null, 2).substring(0, 300)}`;
      }
      if (tokenResult?.stack) {
        // 스택 트레이스 첫 줄만 표시
        const firstLine = tokenResult.stack.split('\n').slice(0, 2).join('\n');
        errorMsg += `\n\n[스택]: ${firstLine}`;
      }

      return {
        success: false,
        error: errorMsg
      };
    }

    debugLog('Step 2 SUCCESS: Token exchange completed', {
      userId: tokenResult.userId,
      hasAccessToken: !!tokenResult.accessToken
    });

    // Step 3: 로그인 성공
    debugLog('Step 3: Login successful');
    return {
      success: true,
      user: {
        id: tokenResult.userId,
        tossUserId: tokenResult.userId,
        email: `${tokenResult.userId}@toss.user`,
      },
      authorizationCode: authResult.authorizationCode,
      referrer: authResult.referrer,
    };

  } catch (error) {
    debugLog('FATAL ERROR', { error: String(error) });
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
}
