// Only explicit same-origin shell files may enter this cache. APIs always use network.
const CACHE='spearfishing-shell-v3';
const ROOT=new URL('./',self.location).pathname;
const FILES=['','index.html','app.js','photo-patch.js','style.css','marine/marine.css','marine/ui.js','marine/core.js','marine/providers.js','marine/regional.js','marine/exposure.js','marine/conditions.js','config.js','manifest.json','icon-192.png','icon-512.png','kml/sitios.kml','data/spots.json','data/coast.geojson'].map(p=>ROOT+p);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith('sdc-')||k.startsWith('spearfishing-shell-'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||!FILES.includes(u.pathname))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(u.pathname,r.clone()));return r;}).catch(async()=>await caches.match(u.pathname)||new Response('Sin conexión',{status:503})));
});
