/* Market Brief service worker (P41) — network-first, offline fallback */
const CACHE = 'brief-p41-1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\.png$/.test(u.pathname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  const key = u.pathname.endsWith('data.json') ? new Request(u.origin + u.pathname) : e.request;
  e.respondWith(fetch(e.request, {cache: 'no-store'}).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(key, c)); }
    return r;
  }).catch(() => caches.match(key).then(r => r || caches.match('index.html'))));
});
