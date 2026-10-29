const CACHE = 'alibaug-fieldguide-v1';
const CORE = ['./', './index.html', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    const response = await fetch('./index.html');
    const html = await response.text();
    const appAssets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map(match => match[1]);
    const illustrations = ['looking', 'lessgoo', 'happy', 'kiss', 'driving', 'parked'].map(name => `./graphics/characters/${name}.png`);
    await Promise.all([...appAssets, ...illustrations].map(url => cache.add(url).catch(() => undefined)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
