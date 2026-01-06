/**
 * Environment detection and configuration
 * Determines if running in Appintos WebView vs browser/dev
 */

// Build version for cache busting (updated on each deploy)
export const BUILD_VERSION = '2025.0106.0400';
export const BUILD_ID = 'v24-loading-animation-upgrade';
console.log('[BUILD] Version:', BUILD_VERSION, 'ID:', BUILD_ID);

// 환경 디버그 (앱 시작 시 바로 출력)
if (typeof window !== 'undefined') {
  console.log('[ENV DEBUG] Protocol:', window.location.protocol);
  console.log('[ENV DEBUG] Hostname:', window.location.hostname);
  console.log('[ENV DEBUG] URL:', window.location.href);
  console.log('[ENV DEBUG] ReactNativeWebView:', !!(window as any).ReactNativeWebView);
  console.log('[ENV DEBUG] __APPINTOS__:', !!(window as any).__APPINTOS__);
  console.log('[ENV DEBUG] UserAgent:', navigator.userAgent?.substring(0, 100));
  console.log('[ENV DEBUG] Referrer:', document.referrer);
}

export interface EnvironmentConfig {
  isAppintos: boolean;
  apiBaseUrl: string;
  wsBaseUrl: string;
  environment: 'production' | 'development';
}

/**
 * Detect if running in Appintos environment
 */
export function isAppintosEnvironment(): boolean {
  // SSR 환경에서는 항상 false 반환
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // 1. 프로토콜 확인 (intoss:// 또는 intoss-private://) - 최우선 감지
    const protocol = window.location.protocol;
    if (protocol.includes('intoss')) {
      console.log('🔍 [ENV] Detected intoss protocol:', protocol);
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 2. React Native WebView 환경 감지 (가장 확실한 방법)
    if ((window as any).ReactNativeWebView) {
      console.log('🔍 [ENV] Detected ReactNativeWebView');
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 3. Appintos 특정 객체 감지
    if ((window as any).__APPINTOS__) {
      console.log('🔍 [ENV] Detected __APPINTOS__');
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 4. @apps-in-toss/web-framework 로드 여부 확인 (빌드 시 주입됨)
    if ((window as any).__AIT_FRAMEWORK__ || (window as any).AppsInToss) {
      console.log('🔍 [ENV] Detected AIT Framework');
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 5. 세션/로컬 스토리지 플래그 확인 (이전에 감지된 경우)
    try {
      if (sessionStorage.getItem('appintos_mode') === 'true' ||
          sessionStorage.getItem('appintos_signature')) {
        console.log('🔍 [ENV] Detected appintos_mode/signature in storage');
        return true;
      }
    } catch (e) {
      // 스토리지 접근 실패 무시
    }

    // 6. URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);

    // _deploymentId 파라미터 확인 (앱인토스 테스트 환경)
    if (urlParams.has('_deploymentId')) {
      console.log('🔍 [ENV] Detected _deploymentId param');
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    if (urlParams.has('signature') || urlParams.has('appintos')) {
      console.log('🔍 [ENV] Detected signature/appintos param');
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 7. 호스트네임 확인 (tossmini.com: 앱인토스 실제 서비스/QR테스트 도메인)
    const hostname = window.location.hostname;
    if (hostname.includes('apps-in-toss') || hostname.includes('.toss.im') || hostname.includes('tossmini.com')) {
      console.log('🔍 [ENV] Detected Appintos hostname:', hostname);
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 8. User-Agent 기반 토스앱 감지
    const userAgent = navigator.userAgent || '';
    if (userAgent.includes('Toss') || userAgent.includes('toss') || userAgent.includes('AppsInToss')) {
      console.log('🔍 [ENV] Detected Toss in User-Agent:', userAgent.substring(0, 50));
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 9. 모바일 WebView 감지 (iOS/Android wv 플래그)
    const isMobileWebView = (userAgent.includes('wv') || userAgent.includes('WebView')) &&
                            (userAgent.includes('iPhone') || userAgent.includes('Android'));
    if (isMobileWebView) {
      console.log('🔍 [ENV] Detected Mobile WebView:', userAgent.substring(0, 50));
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 10. document.referrer 확인 (토스에서 열린 경우)
    const referrer = document.referrer || '';
    if (referrer.includes('toss') || referrer.includes('tossmini')) {
      console.log('🔍 [ENV] Detected Toss in referrer:', referrer);
      try { sessionStorage.setItem('appintos_mode', 'true'); } catch (e) {}
      return true;
    }

    // 11. 빌드 환경 변수 확인 (VITE_FORCE_APPINTOS로 강제 활성화 가능)
    if (import.meta.env.VITE_FORCE_APPINTOS === 'true') {
      console.log('🔍 [ENV] Forced Appintos mode via VITE_FORCE_APPINTOS');
      return true;
    }

    console.log('🔍 [ENV] No Appintos indicators found');
    return false;
  } catch (error) {
    console.error('🔍 [ENV] Error detecting environment:', error);
    return false;
  }
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isAppintos = isAppintosEnvironment();
  const PRODUCTION_API_URL = 'https://insiderpulse.pro';

  if (isAppintos) {
    console.log('🔗 [ENV] Running in Appintos environment');
    return {
      isAppintos: true,
      apiBaseUrl: `${PRODUCTION_API_URL}/api`,
      wsBaseUrl: `wss://insiderpulse.pro/api/ws`,
      environment: 'production',
    };
  }

  console.log('🌐 [ENV] Running in browser environment');
  return {
    isAppintos: false,
    apiBaseUrl: '/api',
    wsBaseUrl: getRelativeWebSocketUrl(),
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  };
}

/**
 * Construct WebSocket URL for same-origin connections
 */
function getRelativeWebSocketUrl(): string {
  // SSR 환경 체크
  if (typeof window === 'undefined') {
    // SSR에서는 기본값 반환 (클라이언트에서 재평가됨)
    return 'ws://localhost:5000/api/ws';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:5000';
  return `${protocol}//${host}/api/ws`;
}

/**
 * 앱인토스 환경에서 자동으로 익명 사용자 ID 생성/반환
 * appLogin SDK 없이도 사용자 식별 가능
 */
export function ensureAppintosUserId(): string | null {
  if (typeof window === 'undefined') return null;

  // 앱인토스 환경이 아니면 null
  if (!isAppintosEnvironment()) return null;

  // 이미 ID가 있으면 반환
  let userId = localStorage.getItem('appintos_user_id');
  if (userId) {
    console.log('[ENV] Existing Appintos user ID:', userId);
    return userId;
  }

  // 새 ID 생성 및 저장
  userId = `appintos_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('appintos_user_id', userId);
  console.log('[ENV] Created new Appintos user ID:', userId);
  return userId;
}

/**
 * 앱인토스 환경에서 세션 확인 후 사용자 ID 반환 (비동기 버전)
 * 1. localStorage 확인
 * 2. 서버 세션 쿠키 확인
 * 3. 새 ID 생성 (최후의 수단)
 */
export async function ensureAppintosUserIdAsync(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!isAppintosEnvironment()) return null;

  // 1. localStorage 확인
  let userId = localStorage.getItem('appintos_user_id');
  if (userId) {
    console.log('[ENV] Existing Appintos user ID:', userId);
    return userId;
  }

  // 2. 서버 세션 확인 (쿠키 기반)
  try {
    console.log('[ENV] Checking server session...');
    const { checkExistingTossSession } = await import('./toss-login');
    const user = await checkExistingTossSession();
    if (user?.id) {
      console.log('[ENV] Found session user ID:', user.id);
      localStorage.setItem('appintos_user_id', user.id);
      return user.id;
    }
  } catch (e) {
    console.log('[ENV] Session check failed:', e);
  }

  // 3. 세션 없으면 새 ID 생성 (최후의 수단)
  userId = `appintos_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('appintos_user_id', userId);
  console.log('[ENV] Created new Appintos user ID:', userId);
  return userId;
}

// ✅ Proxy 제거, 직접 getter 사용하여 매번 재평가
export const ENV_CONFIG = {
  get isAppintos() {
    return isAppintosEnvironment();
  },
  get apiBaseUrl() {
    return getEnvironmentConfig().apiBaseUrl;
  },
  get wsBaseUrl() {
    return getEnvironmentConfig().wsBaseUrl;
  },
  get environment() {
    return getEnvironmentConfig().environment;
  }
};

// 앱인토스 환경이면 앱 시작 시 자동으로 ID 생성
if (typeof window !== 'undefined') {
  ensureAppintosUserId();
}
