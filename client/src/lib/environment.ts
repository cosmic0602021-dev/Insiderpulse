/**
 * Environment detection and configuration
 * Determines if running in Appintos WebView vs browser/dev
 */

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
    // React Native WebView 환경 감지 (가장 확실한 방법)
    if ((window as any).ReactNativeWebView) {
      console.log('🔍 [ENV] Detected ReactNativeWebView');
      return true;
    }

    // Appintos 특정 객체 감지
    if ((window as any).__APPINTOS__) {
      console.log('🔍 [ENV] Detected __APPINTOS__');
      return true;
    }

    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('signature') || urlParams.has('appintos')) {
      console.log('🔍 [ENV] Detected signature/appintos param');
      return true;
    }

    // 호스트네임 확인 (tossmini.com: 앱인토스 실제 서비스/QR테스트 도메인)
    const hostname = window.location.hostname;
    if (hostname.includes('apps-in-toss') || hostname.includes('.toss.im') || hostname.includes('tossmini.com')) {
      console.log('🔍 [ENV] Detected Appintos hostname:', hostname);
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
