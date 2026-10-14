// mobile/public/sw.js
const CACHE_NAME = 'kumsika-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/kumsika-symbol.png',
];

// ============================================================
// INSTALL — cache static assets
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS).catch(() => {
          // Non-fatal — some assets may 404 in dev
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================================
// ACTIVATE — clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH — cache-first with background update
// ============================================================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (!event.request.url.startsWith('http')) return;
  // Leave cross-origin requests (Cloudinary/Supabase images, fonts, APIs) to the
  // browser. Fetches made from the SW are checked against CSP connect-src, not
  // img-src, so proxying them here blocks image hosts that connect-src omits.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Page loads: network-first so a new deploy's index.html (with new hashed
  // asset names) is picked up; fall back to the cached shell when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone));
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) =>
            cached || new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      });
    }).catch(() => {
      return new Response('Offline - Please check your connection', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    })
  );
});

// ============================================================
// ✅ PUSH — handle incoming push notifications
// ============================================================
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: 'Kumsika', body: event.data?.text() || '' };
  }

  const title = data.title || 'Kumsika';
  const options = {
    body: data.body || '',
    icon: data.icon || '/kumsika-symbol.png',
    badge: data.badge || '/kumsika-symbol.png',
    tag: data.tag || 'kumsika-notification',
    renotify: true,
    data: {
      url: data.url || '/messages',
      ...(data.data || {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ============================================================
// ✅ NOTIFICATION CLICK — open/focus the target page
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/messages';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});