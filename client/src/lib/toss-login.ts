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
}

/**
 * Check if Toss appLogin is available
 */
export function isTossLoginAvailable(): boolean {
  return ENV_CONFIG.isAppintos;
}

/**
 * 앱 시작 시 기존 세션 확인 (자동 로그인)
 * 세션 쿠키가 유효하면 기존 사용자 정보 반환
 */
export async function checkExistingTossSession(): Promise<TossUser | null> {
  if (!ENV_CONFIG.isAppintos) return null;

  try {
    console.log('[TossLogin] Checking existing session...');
    const response = await fetch(resolveApiUrl('/api/toss-login/me'), {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
      mode: 'cors',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        console.log('[TossLogin] Found existing session, user:', data.user.id);
        // localStorage에도 저장 (캐시)
        localStorage.setItem('appintos_user_id', data.user.id);
        return data.user;
      }
    }
    console.log('[TossLogin] No existing session found');
  } catch (error) {
    console.log('[TossLogin] Session check failed:', error);
  }
  return null;
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
        window.alert('[TossLogin] appLogin API를 로드할 수 없습니다.\n앱인토스 환경에서 실행 중인지 확인해주세요.');
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
      window.alert(`[TossLogin Error]\nCode: ${errorCode}\nMessage: ${errorMessage}`);
    }

    return null;
  }
}

/**
 * Exchange authorization code for tokens via our backend
 */
export async function exchangeTossToken(authorizationCode: string, referrer: string): Promise<TossTokenResponse | null> {
  try {
    const response = await fetch(resolveApiUrl('/api/toss-login/token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorizationCode, referrer }),
      mode: 'cors',
      credentials: 'include',  // 쿠키 전송 필수
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[TossLogin] Token exchange failed:', error);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[TossLogin] Token exchange error:', error);
    return null;
  }
}

/**
 * Get user info from Toss using stored token
 */
export async function getTossUserInfo(): Promise<TossUser | null> {
  try {
    const response = await fetch(resolveApiUrl('/api/toss-login/me'), {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',  // 쿠키 전송 필수
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
export async function refreshTossToken(refreshToken: string): Promise<TossTokenResponse | null> {
  try {
    const response = await fetch(resolveApiUrl('/api/toss-login/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      mode: 'cors',
      credentials: 'include',  // 쿠키 전송 필수
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
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
    const response = await fetch(resolveApiUrl('/api/toss-login/disconnect'), {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',  // 쿠키 전송 필수
    });

    return response.ok;
  } catch (error) {
    console.error('[TossLogin] Disconnect error:', error);
    return false;
  }
}

/**
 * Full Toss Login flow: Request auth code, exchange for tokens, get user info
 * Falls back to local user ID if token exchange fails
 */
export async function performTossLogin(): Promise<TossLoginResult> {
  // 디버깅: 콘솔 로그만 (alert 제거됨)
  const debugLog = (step: string, data?: any) => {
    console.log(`[TossLogin] ${step}`, data);
  };

  try {
    // Step 0: 기존 세션 확인 (자동 로그인)
    debugLog('Step 0: Checking existing session...');
    const existingUser = await checkExistingTossSession();
    if (existingUser) {
      debugLog('Step 0 SUCCESS: Using existing session', { userId: existingUser.id });
      return { success: true, user: existingUser };
    }

    debugLog('Step 1: Requesting authorization code...');

    // Step 1: Request authorization code from Toss
    const authResult = await requestTossLogin();

    if (!authResult) {
      debugLog('Step 1 FAILED: No auth result');
      return { success: false, error: '토스 로그인을 취소했거나 실패했습니다.' };
    }

    debugLog('Step 1 SUCCESS: Got auth code', {
      codePrefix: authResult.authorizationCode.substring(0, 10) + '...',
      referrer: authResult.referrer
    });

    // Step 2: 토큰 교환 시도 - 서버에서 일관된 userId 받아옴
    debugLog('Step 2: Exchanging token...');
    try {
      const tokenResult = await exchangeTossToken(authResult.authorizationCode, authResult.referrer);
      if (tokenResult) {
        debugLog('Step 2 SUCCESS: Token exchanged', {
          success: tokenResult.success,
          userId: tokenResult.userId
        });

        // 서버에서 반환한 userId 사용 (DB에 저장된 일관된 ID)
        if (tokenResult.userId) {
          localStorage.setItem('appintos_user_id', tokenResult.userId);
          debugLog('Step 2 COMPLETE: Using server userId', { userId: tokenResult.userId });
          return {
            success: true,
            user: {
              id: tokenResult.userId,
              tossUserId: tokenResult.userId,
            }
          };
        }

        // 세션 쿠키가 설정되었으니 /me 호출해서 사용자 정보 가져오기
        const user = await getTossUserInfo();
        if (user) {
          debugLog('Step 2 COMPLETE: Got user info from /me', { userId: user.id });
          localStorage.setItem('appintos_user_id', user.id);
          return { success: true, user };
        }
      }
    } catch (e) {
      debugLog('Step 2 FAILED: Token exchange error', { error: String(e) });
    }

    // Step 3: 폴백 - localStorage에 기존 ID 있으면 사용, 없으면 새로 생성
    // 주의: authorizationCode는 매번 다르므로 해시해도 소용없음
    let userId = localStorage.getItem('appintos_user_id');
    if (!userId) {
      userId = `toss_anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('appintos_user_id', userId);
      debugLog('Step 3: Created new fallback ID', { userId });
    } else {
      debugLog('Step 3: Using existing localStorage ID', { userId });
    }

    return {
      success: true,
      user: {
        id: userId,
        tossUserId: userId,
      }
    };
  } catch (error) {
    debugLog('FATAL ERROR', { error: String(error) });
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
}
