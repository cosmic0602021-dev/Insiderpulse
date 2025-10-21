import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

try {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  createRoot(root).render(<App />);
} catch (error) {
  console.error('App initialization error:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>앱 로딩 중 에러가 발생했습니다</h1>
      <p>브라우저 콘솔을 확인해주세요.</p>
      <p>Error: ${error}</p>
    </div>
  `;
}
