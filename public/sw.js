const CACHE = 'pointure-v18';
const ASSETS = [
  '/pointure/',
  '/pointure/index.html',
  '/pointure/src/data/paintData.js',
  '/pointure/src/ui/neu.css',
  '/pointure/public/manifest.json',
  '/pointure/public/icons/icon-192.png',
  '/pointure/public/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('unpkg') || e.request.url.includes('fonts.googleapis')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
