// ============================================================
//  Service Worker — Pollos Frescos
//  v3.1 — Compatible con Cloudflare Pages (HTTPS)
// ============================================================
const CACHE_NAME = 'PollosFrescos-v3.1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/db.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/audit.js',
  '/js/notifications.js',
  '/js/router.js',
  '/js/app.js',
  '/js/modules/superadmin.js',
  '/js/modules/repartidor.js',
  '/js/modules/cliente.js',
  '/demo/seed.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('[SW] Cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a otros dominios (fuentes externas, APIs)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Estrategia: Network-first con fallback a caché
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en caché solo respuestas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: devolver desde caché
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Para rutas SPA sin caché, devolver index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
