const CACHE_NAME = 'warung-app-v1';

// File utama yang harus disimpan ke memori HP saat pertama kali buka web
const ASSETS_TO_CACHE = [
  '/',
  '/index.html', // Sesuaikan jika nama file html Anda bukan index.html
  '/manifest.json',
  '/icon-192.png'
];

// Event Install: Menyimpan file-file penting ke Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Langsung aktifkan service worker versi terbaru
});

// Event Activate: Membersihkan cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Event Fetch: Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
  // Hanya memproses request dengan metode GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika sukses terhubung internet, simpan/perbarui file ke cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Jika offline/gagal internet, ambil file dari cache
        return caches.match(event.request);
      })
  );
});
