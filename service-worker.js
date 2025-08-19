const CACHE = 'moe-cache-v1';
const CORE = [
  "/",
  "/index.html",
  "/oscillator.html",
  "/oscillator.js",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/assets/images/banner-1200x628.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith((async () => {
    try {
      const netRes = await fetch(req);
      if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, netRes.clone());
      }
      return netRes;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') return caches.match('/index.html');
      throw err;
    }
  })());
});
