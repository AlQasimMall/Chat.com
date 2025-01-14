// service-worker.js
const CACHE_NAME = 'chat-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/profiles%2Fchat.jpg?alt=media&token=7c762f98-fb0f-43d8-83c3-996b6373ff7d',
    'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/profiles%2Fchat.jpg?alt=media&token=7c762f98-fb0f-43d8-83c3-996b6373ff7d',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.rtl.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// استراتيجية الشبكة أولاً ثم الذاكرة المؤقتة
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});