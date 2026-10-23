// Streights: простой service worker.
// Нужен, чтобы сайт можно было установить как приложение, и чтобы оболочка открывалась без сети.
// Данные из Google Таблицы (другой домен) не кэшируются: они всегда берутся из сети.
const CACHE = 'streights-v1';
const SHELL = ['./', './index.html', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Сначала сеть (чтобы обновления сайта доходили сразу), при её отсутствии запасной вариант из кэша.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))
      )
  );
});
