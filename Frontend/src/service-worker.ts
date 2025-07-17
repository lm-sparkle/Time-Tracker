/// <reference lib="webworker" />
export {};

const CACHE_NAME = 'time-tracker-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/timer.svg',
  '/vite.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  const swEvent = event as ExtendableEvent;
  swEvent.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  const swEvent = event as ExtendableEvent;
  swEvent.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(response => {
      return response || fetch(fetchEvent.request);
    })
  );
}); 