import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getPlatformOS, getOperationalEnvironment, getSchemeUri } from '@apps-in-toss/web-framework';

console.log('🚀 main.tsx loading...');

// 앱인토스 환경인지 확인
function isAppintosEnvironment() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('signature') ||
           urlParams.has('appintos') ||
           (typeof window !== 'undefined' && (window as any).__APPINTOS__);
  } catch {
    return false;
  }
}

// 앱인토스 브리지 초기화
function initializeAppintosBridge() {
  if (!isAppintosEnvironment()) {
    console.log('📱 Not in Appintos environment, skipping bridge initialization');
    return { success: true, mode: 'browser' };
  }

  try {
    console.log('🔗 Initializing Appintos bridge...');

    // 앱인토스 환경 정보 가져오기 (브리지 활성화)
    const platform = getPlatformOS(); // 'ios' | 'android'
    const env = getOperationalEnvironment(); // 'production' | 'sandbox'
    const schemeUri = getSchemeUri();

    console.log('✅ Appintos bridge initialized:', { platform, env, schemeUri });

    // URL에서 signature 추출 및 저장
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('signature')) {
      const signature = urlParams.get('signature');
      sessionStorage.setItem('appintos_signature', signature || '');
      console.log('🔑 Appintos signature stored');
    }

    return { success: true, mode: 'appintos', platform, env };
  } catch (error) {
    console.error('❌ Appintos bridge initialization failed:', error);

    // 서명 관련 에러인 경우 사용자에게 명확한 메시지 표시
    if (error instanceof Error && error.message.toLowerCase().includes('signature')) {
      displayError(
        '⚠️ Appintos 인증 실패',
        error.message,
        '토스 앱의 공식 QR 코드를 통해 접속해주세요.'
      );
      return { success: false, error: 'signature_missing' };
    }

    // 다른 에러는 브라우저 모드로 폴백
    console.warn('Falling back to browser mode due to error:', error);
    return { success: true, mode: 'browser', warning: error };
  }
}

// Helper function to safely display error messages
function displayError(title: string, errorContent: string, additionalMessage?: string) {
  // Clear body and create container
  document.body.textContent = '';
  
  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; text-align: center; font-family: sans-serif;';
  
  const heading = document.createElement('h1');
  heading.style.color = 'red';
  heading.textContent = title;
  container.appendChild(heading);
  
  if (additionalMessage) {
    const message = document.createElement('p');
    message.style.fontSize = '18px';
    message.textContent = additionalMessage;
    container.appendChild(message);
  }
  
  const pre = document.createElement('pre');
  pre.style.cssText = 'text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto; max-width: 800px; margin: 20px auto;';
  pre.textContent = errorContent;
  container.appendChild(pre);
  
  if (title.includes('앱 로딩')) {
    const footer = document.createElement('p');
    footer.style.cssText = 'color: #666; margin-top: 20px;';
    footer.textContent = 'If you see this message, please take a screenshot and share it.';
    container.appendChild(footer);
  }
  
  document.body.appendChild(container);
}

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  displayError(
    '⚠️ Global Error Detected',
    event.error?.stack || String(event.error)
  );
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  displayError(
    '⚠️ Unhandled Promise Rejection',
    event.reason?.stack || String(event.reason)
  );
});

// Register Service Worker for PWA (temporarily disabled)
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/sw.js')
//       .then((registration) => {
//         console.log('✅ Service Worker registered successfully:', registration.scope);
//
//         // Check for updates periodically
//         setInterval(() => {
//           registration.update();
//         }, 60000); // Check every minute
//       })
//       .catch((error) => {
//         console.error('❌ Service Worker registration failed:', error);
//       });
//   });
// }

console.log('🔍 Attempting to mount React app...');

try {
  // 앱인토스 브리지 초기화 (React 앱보다 먼저)
  const bridgeResult = initializeAppintosBridge();

  // 초기화 성공 시에만 앱 렌더링
  if (bridgeResult.success) {
    const root = document.getElementById("root");
    if (!root) {
      throw new Error("Root element not found");
    }
    console.log('✅ Root element found, rendering app...');
    createRoot(root).render(<App />);
    console.log('✅ App rendered successfully');
  } else {
    console.error('Cannot proceed without valid Appintos initialization');
    // displayError는 initializeAppintosBridge에서 이미 호출됨
  }
} catch (error) {
  console.error('❌ App initialization error:', error);
  displayError(
    '❌ 앱 로딩 중 에러가 발생했습니다',
    error instanceof Error ? error.stack || error.message : String(error),
    '브라우저 콘솔(F12)을 확인해주세요.'
  );
}
