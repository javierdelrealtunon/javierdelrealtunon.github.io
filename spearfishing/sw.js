// Service Worker — Spots Depredadores del Cantábrico
const CACHE = 'sdc-v2'; // ← incrementar aquí con cada despliegue si es necesario

const PRECACHE = [
  '/spearfishing/',
  '/spearfishing/index.html',
  '/spearfishing/app.js',
  '/spearfishing/style.css',
  '/spearfishing/icon-192.png',
  '/spearfishing/icon-512.png',
  '/spearfishing/kml/sitios.kml',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Dominios externos de tiles/APIs: siempre desde red, sin cachear
const NETWORK_ONLY = [
  'ideihm.covam.es',
  'openseamap.org',
  'script.google.com',
  'cartocdn.com',
  'openstreetmap.org',
  'arcgisonline.com',
];

// Archivos propios de la app: red primero, caché como fallback
const OWN_PATHS = [
  '/spearfishing/',
  '/spearfishing/index.html',
  '/spearfishing/app.js',
  '/spearfishing/style.css',
  '/spearfishing/kml/sitios.kml',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Tiles del mapa y APIs externas: siempre red, sin pasar por caché
  if (NETWORK_ONLY.some(domain => url.includes(domain))) {
    return;
  }

  const isOwnFile = OWN_PATHS.some(path => url.includes(path));

  if (isOwnFile) {
    // Red primero → siempre coge la versión más reciente de GitHub
    // Si no hay red (offline), usa la caché
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Resto (iconos, leaflet, etc.): caché primero para rendimiento
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
      )
    );
  }
});
