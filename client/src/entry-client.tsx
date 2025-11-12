import { hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 entry-client.tsx loading (hydration mode)...');

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

// Add error handling - only crash on critical errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);

  // Check if it's a critical error that should crash the app
  const errorMessage = String(event.error?.message || event.error || '');
  const isCritical =
    errorMessage.includes('ChunkLoadError') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Script error') ||
    event.error?.name === 'ChunkLoadError';

  if (isCritical) {
    // Critical error - show error page
    displayError(
      '⚠️ Critical Error Detected',
      event.error?.stack || String(event.error)
    );
  } else {
    // Non-critical error - log but don't crash
    console.warn('Non-critical error (app continues):', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Check if it's a critical promise rejection
  const reasonMessage = String(event.reason?.message || event.reason || '');
  const isCritical =
    reasonMessage.includes('ChunkLoadError') ||
    reasonMessage.includes('Failed to fetch dynamically imported module') ||
    reasonMessage.includes('Script error');

  if (isCritical) {
    // Critical rejection - show error page
    displayError(
      '⚠️ Critical Promise Rejection',
      event.reason?.stack || String(event.reason)
    );
  } else {
    // Non-critical rejection - log but don't crash
    console.warn('Non-critical promise rejection (app continues):', event.reason);
  }
});

console.log('🔍 Attempting to hydrate React app...');

try {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }
  console.log('✅ Root element found, hydrating app...');

  // Use hydrateRoot instead of createRoot for SSR
  hydrateRoot(root, <App />);

  console.log('✅ App hydrated successfully');
} catch (error) {
  console.error('❌ App hydration error:', error);
  displayError(
    '❌ 앱 로딩 중 에러가 발생했습니다',
    error instanceof Error ? error.stack || error.message : String(error),
    '브라우저 콘솔(F12)을 확인해주세요.'
  );
}
