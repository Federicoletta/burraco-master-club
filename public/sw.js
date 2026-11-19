const CACHE_NAME = 'burraco-cache-v6';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/version.json'
];

// Install: precache app shell and essential assets, activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
});

// Activate: clean up older caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML/navigation (always falling back to /index.html),
// Network-First for /version.json, Stale-While-Revalidate for JS/CSS/SVG assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, heavy streaming audio, and internal screenshots
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/assets/aistudio/')) return;

  // Version check endpoint: Network-First, fallback only to its own cached JSON
  if (url.pathname.endsWith('/version.json') || url.pathname === '/version.json') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/version.json'))
    );
    return;
  }

  // HTML & SPA Navigation: Network-First, always fallback to cached /index.html (never /version.json)
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloneForReq = response.clone();
            const cloneForShell = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloneForReq);
              cache.put('/index.html', cloneForShell);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html')
            .then((shellRes) => shellRes || caches.match('/'))
            .then((fallbackRes) => fallbackRes || caches.match(request))
        )
    );
    return;
  }

  // Assets (JS, CSS, SVG, manifest): Cache First / Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});