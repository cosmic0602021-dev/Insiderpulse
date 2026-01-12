// Self-destructing Service Worker
// This SW immediately unregisters itself and does NOT intercept any requests
// Purpose: Replace the old SW that was causing CORS errors

const SW_VERSION = 'kill-v1';

// Install: Skip waiting to activate immediately
self.addEventListener('install', () => {
  console.log(`[SW ${SW_VERSION}] Installing self-destructing SW...`);
  self.skipWaiting();
});

// Activate: Unregister self and clear all caches
self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activating and self-destructing...`);

  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`[SW ${SW_VERSION}] Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }),
      // Unregister self
      self.registration.unregister().then(() => {
        console.log(`[SW ${SW_VERSION}] Successfully unregistered!`);
      })
    ])
  );
});

// IMPORTANT: Do NOT add any fetch event listener
// This ensures no requests are intercepted
