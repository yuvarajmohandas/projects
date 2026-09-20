const CACHE_NAME = 'mitrakart-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx', // Vite entry point
  '/favicon.svg'
];

// 1. INSTALL EVENT: Pre-caches critical frontend shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE EVENT: Cleans out older cache versions automatically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH INTERCEPTOR: Implements Stale-While-Revalidate caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip intercepting POST/PUT/PATCH mutations (like placing orders or logging in)
  if (request.method !== 'GET') return;

  // Handle local application assets & pages
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // If network query succeeds, clone it into cache storage
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Graceful fallback if network fails completely and asset is missing from cache
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

        // Instantly return cache hit for immediate speed, fallback to network fetch
        return cachedResponse || fetchPromise;
      });
    })
  );
});
