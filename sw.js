// offline copy of the app. The page itself is always fetched fresh when there is internet (so updates arrive at once).
const CACHE = 'learnspace-93ec65191a';
const CORE = ['./', 'firebase-bundle.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;           // Google sign-in / database traffic is never touched
  const scope = new URL(self.registration.scope);
  const isPage = r.mode === 'navigate' || u.pathname === scope.pathname || u.pathname === scope.pathname + 'index.html';
  if (isPage) {
    const key = u.pathname.endsWith('auth.html') ? r : './';
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok && !u.pathname.endsWith('auth.html')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./', cp)); } return res; })
      .catch(() => caches.match(key, { ignoreSearch: true }).then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => {
    const net = fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; });
    if (m) { e.waitUntil(net.catch(() => {})); return m; }
    return net;
  }));
});
