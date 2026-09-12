// sw.js — Service Worker untuk Warung Mbak Wiwin (PWA)
// Naikkan versi ini setiap kali file di-deploy ulang agar cache lama dibersihkan
const CACHE_VERSION = 'warung-cache-v1';

// File inti "app shell" yang wajib bisa dibuka walau offline / sinyal lemah
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// INSTALL: simpan app shell ke cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

// ACTIVATE: bersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH: network-first untuk halaman HTML (agar update terbaru selalu dicoba dulu),
// lalu fallback ke cache kalau offline. Untuk aset lain: coba cache dulu, baru network.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya tangani request GET (POST/PUT ke Supabase dll dibiarkan lewat apa adanya)
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Jangan cache response error / opaque yang besar (mis. CDN pihak ketiga tetap boleh, tapi aman-aman saja di-skip)
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
