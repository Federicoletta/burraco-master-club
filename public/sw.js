const CACHE_VERSION = '__BURRACO_CACHE_VERSION__';
const CACHE_NAME = `burraco-cache-${CACHE_VERSION}`;
const FONTS_CACHE_NAME = 'burraco-fonts-v1';

// Asset di build iniettati automaticamente da vite.config.js (mai /audio/, mai /version.json)
const BUILD_PRECACHE_ASSETS = /*__PRECACHE_ASSETS__*/[];

const APP_SHELL_ASSETS = Array.from(new Set([
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  ...BUILD_PRECACHE_ASSETS,
]));

// Install: precache app shell + build assets; NON chiama skipWaiting automaticamente
// per non interrompere una mano in corso. Attende comando esplicito SKIP_WAITING dall'utente.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
});

// Messaggio dal client quando l'utente clicca "Aggiorna ora"
self.addEventListener('message', (event) => {
  if (event?.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate: rimuove le vecchie cache dell'app preservando la cache font condivisa
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== FONTS_CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategies:
// - /audio/* e richieste non-GET: bypass diretto (mai in precache)
// - Google Fonts: Cache-First in cache dedicata per tipografia offline
// - /version.json: Network-Only (mai in cache app shell, mai servito per navigazioni)
// - Navigazione HTML: Network-First con fallback garantito a /index.html
// - Asset statici (JS/CSS/PNG/SVG/manifest): Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!request || request.method !== 'GET') return;

  const url = new URL(request.url);

  // Google Fonts: Cache-First cross-origin
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS_CACHE_NAME).then((fontCache) =>
        fontCache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              fontCache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
      )
    );
    return;
  }

  // Ignora altre richieste cross-origin (Firebase, Firestore, Google Auth, ecc.)
  if (url.origin !== self.location.origin) return;

  // Mai intercettare/cachare le tracce MP3 pesanti
  if (url.pathname.startsWith('/audio/')) return;

  // Endpoint di controllo versione: sempre Network-Only per garantire check affidabile
  if (url.pathname === '/version.json' || url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Navigazione SPA e documenti HTML: Network-First con fallback SEMPRE a /index.html
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

  // Asset statici same-origin (JS, CSS, PNG, SVG, manifest): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});