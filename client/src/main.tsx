import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getPlatformOS, getOperationalEnvironment, getSchemeUri } from '@apps-in-toss/web-framework';
import { isAppintosEnvironment } from './lib/environment';

console.log('🚀 main.tsx loading...');

// 🗑️ Service Worker 비블로킹 해제 (앱 로딩 속도 최적화)
// SW가 요청을 가로채서 CORS 에러 발생 가능 → 백그라운드에서 해제
if ('serviceWorker' in navigator) {
  // 비블로킹: 앱 렌더링 후 백그라운드에서 SW 정리
  setTimeout(() => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        console.log(`🗑️ [Background] Found ${registrations.length} Service Worker(s), unregistering...`);

        // 모든 SW 해제 (백그라운드)
        registrations.forEach(r => {
          console.log('🗑️ Unregistering:', r.scope);
          r.unregister();
        });

        // 캐시도 삭제 (백그라운드)
        if ('caches' in window) {
          caches.keys().then(keys => {
            keys.forEach(key => caches.delete(key));
          });
        }

        console.log('✅ [Background] SW cleanup initiated');
      }
    }).catch((error) => {
      console.warn('Failed to unregister Service Workers:', error);
    });
  }, 1000); // 1초 후 백그라운드에서 정리
}

// 앱인토스 브리지 초기화
function initializeAppintosBridge() {
  try {
    // ✅ 조건 체크 제거 - 앱인토스 함수를 먼저 시도
    console.log('🔗 Attempting Appintos bridge initialization...');

    // 앱인토스 환경 정보 가져오기 (브리지 활성화)
    const platform = getPlatformOS(); // 'ios' | 'android' | throws error
    const env = getOperationalEnvironment(); // 'production' | 'sandbox' | throws error
    const schemeUri = getSchemeUri();

    console.log('✅ Appintos bridge initialized:', { platform, env, schemeUri });

    // ✅ 성공했으면 앱인토스 환경
    // URL에서 signature 추출 및 저장
    const urlParams = new URLSearchParams(window.location.search);
    const signature = urlParams.get('signature');
    if (signature) {
      // localStorage에도 저장 (sessionStorage 대체재로)
      try {
        localStorage.setItem('appintos_signature', signature);
      } catch (e) {
        console.warn('localStorage unavailable, using sessionStorage only');
      }
      sessionStorage.setItem('appintos_signature', signature);
      console.log('🔑 Appintos signature stored');
    }

    // ✅ 전역 플래그 설정 (environment.ts가 사용)
    (window as any).__APPINTOS__ = { platform, env, schemeUri };

    return { success: true, mode: 'appintos', platform, env };
  } catch (error) {
    // ✅ 에러 발생 → 브라우저 환경
    console.log('📱 Not in Appintos environment (functions failed):', error);

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
