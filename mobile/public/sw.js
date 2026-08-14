// mobile/public/sw.js
const CACHE_NAME = 'kumsika-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          fetch(event.request)
            .then(response => {
              if (response && response.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, response));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          });
      })
      .catch(() => {
        return new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});