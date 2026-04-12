// Service Worker — Spots Depredadores del Cantábrico
const CACHE = 'sdc-v1';
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

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
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
  // Tiles del mapa siempre desde red (datos en tiempo real)
  const url = e.request.url;
  if (url.includes('ideihm.covam.es') ||
      url.includes('openseamap.org') ||
      url.includes('script.google.com') ||
      url.includes('cartocdn.com') ||
      url.includes('openstreetmap.org') ||
      url.includes('arcgisonline.com')) {
    return;
  }

  // Todo lo demás: cache primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
