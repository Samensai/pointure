/* ── Pointure · Service Worker ── */

const CACHE = 'pointure-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/ui/skeu.css',
  '/src/ui/components.js',
  '/src/app.js',
  '/src/modules/camera.js',
  '/src/modules/colorMixer.js',
  '/src/modules/library.js',
  '/src/data/pigments.json',
  '/public/manifest.json'
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
  if (e.request.url.includes('unsplash') || e.request.url.includes('picsum')) return;

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
