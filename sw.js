// Service Worker dla PWA - konsystentne wersjonowanie i względne ścieżki
const VERSION = '2.1.0';
const CACHE_NAME = `noname-${VERSION}`;
const urlsToCache = [
    './',
    './index.html',
    './footer.html',
    './styles.min.css',
    './assets/js/app.js',
    './assets/js/components.js',
    './assets/js/animations-bundle.js',
    './assets/images/hero.webp',
    './assets/images/amelia.webp',
    './assets/images/ola.webp',
    './assets/images/kontakt.webp',
    './manifest.json',
    './pages/realizacje.html',
    './pages/poznaj-nas.html',
    './pages/oferta.html',
    './pages/kontakt.html'
];

// Install event - cache resources
self.addEventListener('install', event => {
    // Service Worker installing...
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                    // Cache opened
                return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                    // All resources cached successfully
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache install failed:', error);
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        (async () => {
            try {
                const cached = await caches.match(event.request, { ignoreSearch: true });
                if (cached) {
                    return cached;
                }
                const networkResponse = await fetch(event.request);
                try {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                } catch (e) {
                    // silent cache write failure
                }
                return networkResponse;
            } catch (error) {
                // Navigation fallback for SPA
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            }
        })()
    );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
    // Service Worker activating...
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                            // Deleting old cache
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Service Worker activated
            return self.clients.claim();
        })
    );
});
