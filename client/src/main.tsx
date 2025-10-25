import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('🚀 main.tsx loading...');

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1 style="color: red;">⚠️ Global Error Detected</h1>
      <pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto;">${event.error?.stack || event.error}</pre>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1 style="color: red;">⚠️ Unhandled Promise Rejection</h1>
      <pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto;">${event.reason?.stack || event.reason}</pre>
    </div>
  `;
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
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  console.log('✅ Root element found, rendering app...');
  createRoot(root).render(<App />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ App initialization error:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h1 style="color: red;">❌ 앱 로딩 중 에러가 발생했습니다</h1>
      <p style="font-size: 18px;">브라우저 콘솔(F12)을 확인해주세요.</p>
      <pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto; max-width: 800px; margin: 20px auto;">${error instanceof Error ? error.stack : error}</pre>
      <p style="color: #666; margin-top: 20px;">If you see this message, please take a screenshot and share it.</p>
    </div>
  `;
}
