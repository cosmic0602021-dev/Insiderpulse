const CACHE_NAME = 'insiderpulse-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, NO CACHING for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER cache API requests - always go to network for fresh data
  if (url.pathname.startsWith('/api/')) {
    console.log('[SW] API request detected - bypassing cache:', url.pathname);
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails for API, return error (don't use stale cache)
          return new Response(JSON.stringify({ error: 'Network unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // For non-API requests, use network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification event - Enhanced for insider trade notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  // Default notification data
  const defaultData = {
    title: 'InsiderPulse',
    body: 'New insider trade notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'insider-trade',
    requireInteraction: true, // Stay visible until user interacts
    data: {
      url: '/trades',
      ticker: null,
      tradeId: null,
      tradeType: null
    }
  };

  let notificationData = defaultData;

  // Parse push payload
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Parsed push payload:', payload);

      // Create rich notification from trade data
      notificationData = {
        title: payload.title || `${payload.ticker} - Insider ${payload.tradeType || 'Trade'}`,
        body: payload.body || `${payload.traderTitle || 'Insider'} ${payload.tradeType} trade`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `trade-${payload.tradeId || 'default'}`,
        requireInteraction: true,
        data: {
          url: payload.url || `/trades?ticker=${payload.ticker}`,
          ticker: payload.ticker,
          tradeId: payload.tradeId,
          tradeType: payload.tradeType
        },
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'view',
            title: '자세히 보기',
            icon: '/icon-192x192.png'
          },
          {
            action: 'dismiss',
            title: '닫기'
          }
        ]
      };
    } catch (e) {
      console.error('[SW] Failed to parse push payload:', e);
      // Use text as body if JSON parsing fails
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    data: notificationData.data,
    vibrate: notificationData.vibrate,
    actions: notificationData.actions
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('[SW] ✅ Notification displayed successfully');
      })
      .catch((err) => {
        console.error('[SW] ❌ Failed to show notification:', err);
      })
  );
});

// Notification click event - Enhanced with deep linking
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  // Handle dismiss action - just close notification
  if (event.action === 'dismiss') {
    console.log('[SW] Notification dismissed by user');
    return;
  }

  // Get URL from notification data
  const urlToOpen = event.notification.data?.url || '/trades';
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      console.log('[SW] Found', clientList.length, 'open windows');

      // Try to focus existing window with same origin
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);

        // If same origin, navigate and focus
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          console.log('[SW] Focusing existing window and navigating');
          client.navigate(targetUrl.href);
          return client.focus();
        }
      }

      // No matching window found, open new one
      if (clients.openWindow) {
        console.log('[SW] Opening new window');
        return clients.openWindow(urlToOpen);
      }
    })
    .catch((err) => {
      console.error('[SW] Error handling notification click:', err);
    })
  );
});

// Background sync event (for future offline support)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);

  if (event.tag === 'sync-trades') {
    event.waitUntil(
      // Sync logic here
      Promise.resolve()
    );
  }
});
