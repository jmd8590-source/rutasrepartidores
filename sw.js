// Service Worker — Pollos Fuentes
const CACHE_NAME = 'pollosfuentes-v1';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/db.js',
  './js/utils.js',
  './js/auth.js',
  './js/audit.js',
  './js/notifications.js',
  './js/router.js',
  './js/app.js',
  './js/modules/superadmin.js',
  './js/modules/repartidor.js',
  './js/modules/cliente.js',
  './demo/seed.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for API calls, cache-first for static assets
  if (event.request.url.includes('fonts.googleapis') || event.request.url.includes('cdnjs')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
