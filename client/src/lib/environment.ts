/**
 * Environment detection and configuration
 * Determines if running in Appintos WebView vs browser/dev
 */

// Build version for cache busting (updated on each deploy)
export const BUILD_VERSION = '2026.0117.0100';
export const BUILD_ID = 'v25-loading-optimization';
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

// 환경 감지 결과 캐싱 (성능 최적화)
let _isAppintosCached: boolean | null = null;
let _envConfigCached: EnvironmentConfig | null = null;

/**
 * 앱인토스 환경 감지 (내부 함수)
 * 실제 감지 로직을 수행하며, 결과는 외부에서 캐싱됨
 */
function _detectAppintosInternal(): boolean {
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
 * Detect if running in Appintos environment
 * 첫 호출 시 결과를 캐싱하여 중복 계산 방지 (성능 최적화)
 */
export function isAppintosEnvironment(): boolean {
  // 캐시된 결과가 있으면 즉시 반환 (O(1))
  if (_isAppintosCached !== null) {
    return _isAppintosCached;
  }

  // SSR 환경에서는 항상 false 반환 (캐싱 안함)
  if (typeof window === 'undefined') {
    return false;
  }

  // 첫 호출: 감지 수행
  const result = _detectAppintosInternal();

  // true일 때만 캐싱 (false는 다시 시도할 수 있게)
  if (result) {
    _isAppintosCached = result;
    console.log('🔍 [ENV] Environment detection cached as TRUE');
  }
  return result;
}

/**
 * Get environment configuration
 * 첫 호출 시 결과를 캐싱하여 중복 계산 방지 (성능 최적화)
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // 캐시된 결과가 있으면 즉시 반환
  if (_envConfigCached !== null) {
    return _envConfigCached;
  }

  const isAppintos = isAppintosEnvironment();
  const PRODUCTION_API_URL = 'https://insiderpulse.pro';

  let config: EnvironmentConfig;
  if (isAppintos) {
    console.log('🔗 [ENV] Running in Appintos environment');
    config = {
      isAppintos: true,
      apiBaseUrl: `${PRODUCTION_API_URL}/api`,
      wsBaseUrl: `wss://insiderpulse.pro/api/ws`,
      environment: 'production',
    };
  } else {
    console.log('🌐 [ENV] Running in browser environment');
    config = {
      isAppintos: false,
      apiBaseUrl: '/api',
      wsBaseUrl: getRelativeWebSocketUrl(),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    };
  }

  // 결과 캐싱 (SSR 환경이 아닌 경우만)
  if (typeof window !== 'undefined') {
    _envConfigCached = config;
  }
  return config;
}

/**
 * Construct WebSocket URL for same-origin connections
 */
function getRelativeWebSocketUrl(): string {
  // SSR 환경 체크
  if (typeof window === 'undefined') {
    return 'ws://localhost:5000/api/ws';
  }

  const hostname = window.location.hostname;

  // localhost가 아니면 항상 프로덕션 WebSocket URL 사용
  // (Replit 내부 URL로 연결되는 버그 수정)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'wss://insiderpulse.pro/api/ws';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:5000';
  return `${protocol}//${host}/api/ws`;
}

/**
 * 앱인토스 환경에서 저장된 사용자 ID 반환 (읽기 전용)
 * 실제 토스 로그인 후에만 ID가 존재합니다
 */
export function getAppintosUserId(): string | null {
  if (typeof window === 'undefined') return null;

  // 앱인토스 환경이 아니면 null
  if (!isAppintosEnvironment()) return null;

  // localStorage에서 읽기만 수행 (생성하지 않음)
  const userId = localStorage.getItem('appintos_user_id');
  console.log('[ENV] Getting Appintos user ID (read-only):', userId || 'none');
  return userId || null;
}

/**
 * 앱인토스 환경에서 세션 확인 후 사용자 ID 반환 (비동기 버전)
 * 1. localStorage 확인
 * 2. 서버 세션 쿠키 확인
 * 3. 세션 없으면 null 반환 (ID 생성하지 않음)
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

  // 3. 세션 없으면 null 반환 (임시 ID 생성하지 않음)
  console.log('[ENV] No valid session, user not logged in');
  return null;
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

// ❌ 삭제됨: 자동 ID 생성 제거 (토스 로그인 버그 수정)
// 이제 실제 토스 로그인 후에만 ID가 생성됩니다
