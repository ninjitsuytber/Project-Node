const CACHE_NAME = 'project-node-shell-v17';

const STATIC_ASSETS = [
    './',
    './manifest.json',
    './favicon.svg',
    './apple-touch-icon.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png',
    './css/style.css?v=9.0',
    './css/GlassSurface.css?v=9.0',
    './css/navbar.css?v=9.0',
    './css/HoloCard.css?v=9.0',
    './css/Carousel.css?v=9.0',
    './css/ScrollStack.css?v=9.0',
    './js/GlassSurface.js?v=9.0',
    './js/HoloCard.js?v=9.0',
    './js/stack.js?v=9.0',
    './js/Carousel.js?v=9.0',
    './js/ScrollStack.js?v=9.0',
    './js/theme.js?v=9.0',
    './js/profile.js?v=9.0',
    './js/connect.js?v=9.0',
    './js/notifications.js?v=9.0',
    './js/communities.js?v=9.0',
    './js/app.js?v=9.0',
    './js/pwa.js?v=9.0'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        }).then(() => {
            return self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED' });
                });
            });
        })
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('./');
            })
        );
        return;
    }

    event.respondWith(
        fetch(event.request).then(networkResponse => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});
