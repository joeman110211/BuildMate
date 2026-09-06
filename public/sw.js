const CACHE_NAME = 'buildpair-static-v3';
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.png', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

async function fetchAndCache(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (!response.ok) return response;

  const cacheCopy = response.clone();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, cacheCopy);
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  const isStaticAsset = url.pathname.startsWith('/_expo/') || url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.png' || url.pathname === '/manifest.webmanifest';
  if (!isStaticAsset) return;

  event.respondWith(fetchAndCache(request));
});
