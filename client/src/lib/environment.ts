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
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('signature') || urlParams.has('appintos')) return true;
    if ((window as any).__APPINTOS__) return true;
    const hostname = window.location.hostname;
    if (hostname.includes('apps-in-toss') || hostname.includes('.toss.im')) return true;
    return false;
  } catch {
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

// Export singleton instance
export const ENV_CONFIG = getEnvironmentConfig();
