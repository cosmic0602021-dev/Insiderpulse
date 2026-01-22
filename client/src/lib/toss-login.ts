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

/**
 * Promise에 timeout을 추가하는 헬퍼 함수
 * @param promise 실행할 Promise
 * @param timeoutMs timeout 시간 (밀리초)
 * @param timeoutError timeout 시 발생시킬 에러 메시지
 * @returns Promise<T>
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    ),
  ]);
}

// 동적으로 로드된 appLogin 함수 캐시
let appLoginApi: (() => Promise<{ authorizationCode: string; referrer: string }>) | undefined;

// 중복 호출 방지 플래그
let isLoginInProgress = false;

/**
 * appLogin API를 동적으로 로드
 * @returns { success: true } 또는 { success: false, error: string }
 */
async function ensureAppLoginAPI(): Promise<{ success: boolean; error?: string }> {
  if (appLoginApi) {
    console.log('[TossLogin] ✅ SDK already loaded (cached)');
    return { success: true };
  }

  try {
    console.log('[TossLogin] Attempting to load @apps-in-toss/web-framework...');

    // 방법 1: 동적 import
    const framework = await import('@apps-in-toss/web-framework') as any;

    if (framework.appLogin) {
      appLoginApi = framework.appLogin;
      console.log('[TossLogin] ✅ SDK loaded via dynamic import');
      return { success: true };
    }

    // 방법 2: 전역 객체 확인 (토스앱이 주입하는 경우)
    if (typeof window !== 'undefined') {
      const globalFramework = (window as any).__AIT_FRAMEWORK__ || (window as any).AppsInToss;
      if (globalFramework?.appLogin) {
        appLoginApi = globalFramework.appLogin;
        console.log('[TossLogin] ✅ SDK loaded from global object');
        return { success: true };
      }
    }

    const error = 'appLogin function not found in framework';
    console.error('[TossLogin]', error);
    return { success: false, error };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[TossLogin] ❌ SDK dynamic import failed:', errorMsg);

    // 방법 3: 동적 import 실패 시 전역 객체 fallback
    if (typeof window !== 'undefined') {
      console.log('[TossLogin] Trying global object fallback...');
      const globalFramework = (window as any).__AIT_FRAMEWORK__ || (window as any).AppsInToss;
      if (globalFramework?.appLogin) {
        appLoginApi = globalFramework.appLogin;
        console.log('[TossLogin] ✅ SDK loaded from global object (fallback)');
        return { success: true };
      }
    }

    return { success: false, error: `SDK 로드 실패: ${errorMsg}` };
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
  // ENV_CONFIG.isAppintos 조건 제거 - 토큰 없으면 자연스럽게 null 반환

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
 *
 * @returns { authorizationCode, referrer } 또는 { error: string } 또는 null (사용자 취소)
 */
export async function requestTossLogin(): Promise<
  { authorizationCode: string; referrer: string } | { error: string } | null
> {
  console.log('[TossLogin] requestTossLogin() called');

  try {
    console.log('[TossLogin] Requesting Toss Login via SDK...');

    // 동적으로 appLogin API 로드 시도
    const loadResult = await ensureAppLoginAPI();
    if (!loadResult.success || !appLoginApi) {
      console.log('[TossLogin] appLogin API not available:', loadResult.error);
      // null 대신 에러 객체 반환
      return { error: loadResult.error || 'SDK 로드 실패' };
    }

    // Call the appLogin SDK function (동적 import 사용)
    console.log('[TossLogin] Calling appLogin() with 10s timeout...');
    const result = await withTimeout(
      appLoginApi(),
      10000,  // 10초 timeout
      'Toss login timeout (10s exceeded)'
    );

    if (result && result.authorizationCode) {
      console.log('[TossLogin] ✅ Got authorization code, referrer:', result.referrer);
      return {
        authorizationCode: result.authorizationCode,
        referrer: result.referrer // 'sandbox' or 'DEFAULT'
      };
    }

    console.warn('[TossLogin] No authorization code received (user may have cancelled)');
    return null;  // 사용자 취소
  } catch (error: any) {
    // 상세 에러 로깅
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || 'NO_CODE';
    console.error('[TossLogin] ❌ appLogin failed:', {
      message: errorMessage,
      code: errorCode,
      error: error
    });

    return { error: `appLogin 호출 실패: ${errorMessage} (코드: ${errorCode})` };
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
    const response = await withTimeout(
      fetch(resolveApiUrl('/api/toss-login/token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorizationCode, referrer }),
        mode: 'cors',
        // credentials 제거 - 토큰은 body로 받으므로 쿠키 불필요, CORS 단순화
      }),
      15000,  // 15초 timeout
      'Token exchange timeout (15s exceeded)'
    );

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
    const url = resolveApiUrl('/api/toss-login/token');
    const errorDetail = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);

    if (typeof window !== 'undefined' && window.alert) {
      window.alert(
        `[TossLogin] 토큰 교환 오류\n\n` +
        `URL: ${url}\n` +
        `Error: ${errorDetail}\n\n` +
        `Origin: ${window.location.origin}`
      );
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
  console.log('[TossLogin] 🔐 performTossLogin started');

  // 중복 호출 방지
  if (isLoginInProgress) {
    console.log('[TossLogin] ⚠️ Login already in progress, skipping');
    return { success: false, error: 'Login already in progress' };
  }

  isLoginInProgress = true;

  try {
    // Step 0: 기존 세션 확인 (강화)
    console.log('[TossLogin] Step 0: Checking existing session...');
    const existingSession = await checkExistingTossSession();

    if (existingSession) {
      console.log('[TossLogin] ✅ Valid existing session found:', existingSession);
      return {
        success: true,
        user: {
          id: existingSession.id,
          email: existingSession.email,
          tossUserId: existingSession.tossUserId,
        },
      };
    }

    console.log('[TossLogin] No valid session, proceeding with new login');

    // Step 1: SDK 로드 및 appLogin() 호출
    console.log('[TossLogin] Step 1: Loading SDK and calling appLogin...');
    const authResult = await requestTossLogin();

    // 에러 객체 처리
    if (authResult && 'error' in authResult) {
      console.log('[TossLogin] ⚠️ SDK error:', authResult.error);
      return {
        success: false,
        error: authResult.error
      };
    }

    // 사용자 취소 (null 반환)
    if (!authResult) {
      console.log('[TossLogin] ⚠️ No authorization code (user cancelled or error)');
      return { success: false, error: 'User cancelled or SDK error' };
    }

    console.log('[TossLogin] ✅ Authorization code obtained');

    // Step 2: 토큰 교환
    console.log('[TossLogin] Step 2: Exchanging token...');
    const tokenResult = await exchangeTossToken(authResult.authorizationCode, authResult.referrer);

    if (!tokenResult || !tokenResult.success || !tokenResult.userId) {
      console.log('[TossLogin] ❌ Token exchange failed');
      return { success: false, error: 'Token exchange failed' };
    }

    console.log('[TossLogin] ✅ Token exchange successful, userId:', tokenResult.userId);

    // Step 3: 성공
    return {
      success: true,
      user: {
        id: tokenResult.userId,
        tossUserId: tokenResult.userId,
        email: `${tokenResult.userId}@toss.user`,
      },
    };

  } catch (error) {
    console.error('[TossLogin] ❌ Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    isLoginInProgress = false;
  }
}
