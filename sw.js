// Service Worker - v4.0 PWA con Offline Support
const CACHE_NAME = 'registro-ore-v4.0';
const urlsToCache = [
    '/Report_Ore_Facchini/',
    '/Report_Ore_Facchini/index.html',
    '/Report_Ore_Facchini/css/styles.css',
    '/Report_Ore_Facchini/manifest.json',
    '/Report_Ore_Facchini/icons/icon-192x192.png',
    '/Report_Ore_Facchini/icons/icon-512x512.png'
];

// Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('Cache error:', err))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-sheets') {
        event.waitUntil(syncSheets());
    }
});

async function syncSheets() {
    console.log('🔄 Syncing sheets...');
}
