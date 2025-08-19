
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('oscillator-v1').then(cache => cache.addAll([
      './',
      './oscillator.html',
      './oscillator.js',
      './styles.css',
      './app.js',
      './manifest.json',
      './assets/images/hero.svg',
      './assets/images/mask.svg',
      './assets/images/knee.svg',
      './assets/images/belt.svg',
      './assets/images/athletic.svg',
      './assets/images/chart.svg',
      './assets/icons/icon-192.png',
      './assets/icons/icon-512.png',
      './payments.config.json'
    ]))
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
