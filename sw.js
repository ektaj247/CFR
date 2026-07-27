// Minimal Service Worker required by Chrome to pass PWA installation validation rules
const CACHE_NAME = 'expense-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through execution lets the offline engine inside index.html take care of local storage
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
