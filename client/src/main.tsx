import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('🚀 main.tsx loading...');

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
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }
  console.log('✅ Root element found, rendering app...');
  createRoot(root).render(<App />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ App initialization error:', error);
  displayError(
    '❌ 앱 로딩 중 에러가 발생했습니다',
    error instanceof Error ? error.stack || error.message : String(error),
    '브라우저 콘솔(F12)을 확인해주세요.'
  );
}
