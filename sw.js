// Service Worker - Report Ore Facchini - v4.3.5-force-reload
// Build: 20251119-1235
const CACHE_NAME = 'report-ore-facchini-v4.3.5-force-reload';
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

// Fetch - BYPASS CACHE FOR DEBUGGING
self.addEventListener('fetch', (event) => {
    // SEMPRE Network, MAI cache - solo per debug
    event.respondWith(fetch(event.request));
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
