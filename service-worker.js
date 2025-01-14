 الجديدconst CACHE_NAME = 'chat-app-v1';
const DYNAMIC_CACHE = 'chat-dynamic-v1';

const urlsToCache = [
    './index.html',
    './manifest.json',
    './service-worker.js',
    './offline.html',
    '.https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    '.https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    '.https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    '.https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/driver-images%2F7605a607-6cf8-4b32-aee1-fa7558c98452.png?alt=media&token=5cf9e67c-ba6e-4431-a6a0-79dede15b527',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.rtl.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// التثبيت والتخزين المؤقت
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => {
                console.log('تم فتح التخزين المؤقت');
                return cache.addAll(urlsToCache);
            }),
            self.skipWaiting()
        ])
    );
});

// التنشيط وتحديث التخزين المؤقت
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // حذف التخزين المؤقت القديم
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => {
                        return cacheName.startsWith('chat-') && cacheName !== CACHE_NAME;
                    }).map(cacheName => {
                        console.log('حذف التخزين المؤقت القديم:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }),
            // تنشيط العامل فوراً
            self.clients.claim()
        ])
    );
});

// استراتيجية التخزين المؤقت والشبكة
self.addEventListener('fetch', event => {
    // تجاهل طلبات Firebase وAnalytics
    if (event.request.url.includes('firebase') || 
        event.request.url.includes('google-analytics') ||
        event.request.url.includes('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(async response => {
                // إرجاع النسخة المخزنة إذا وجدت
                if (response) {
                    // تحديث التخزين المؤقت في الخلفية
                    fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, networkResponse));
                            }
                        });
                    return response;
                }

                try {
                    const networkResponse = await fetch(event.request);
                    // تخزين النسخة الجديدة في التخزين المؤقت
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(DYNAMIC_CACHE);
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    // إرجاع صفحة عدم الاتصال في حالة الفشل
                    if (event.request.mode === 'navigate') {
                        return caches.match('./offline.html');
                    }
                    
                    // إرجاع صورة احتياطية للصور الفاشلة
                    if (event.request.destination === 'image') {
                        return caches.match('./icons/placeholder.png');
                    }

                    throw error;
                }
            })
    );
});

// التعامل مع الإشعارات
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: './icons/icon-192.png',
        badge: './icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'فتح التطبيق',
                icon: './icons/icon-96.png'
            },
            {
                action: 'close',
                title: 'إغلاق',
                icon: './icons/icon-96.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('تطبيق المحادثة', options)
    );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('https://alqasimmall.github.io/Chat.com/')
        );
    }
});

// تحديث Service Worker
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// تهيئة Firebase Messaging
if ('firebase' in self) {
    const firebaseConfig = {
        apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
        authDomain: "messageemeapp.firebaseapp.com",
        databaseURL: "https://messageemeapp-default-rtdb.firebaseio.com",
        projectId: "messageemeapp",
        storageBucket: "messageemeapp.appspot.com",
        messagingSenderId: "255034474844",
        appId: "1:255034474844:web:5e3b7a6bc4b2fb94cc4199"
    };

    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();

    messaging.setBackgroundMessageHandler(payload => {
        const title = 'تطبيق المحادثة';
        const options = {
            body: payload.data.message,
            icon: './icons/icon-192.png',
            badge: './icons/icon-72.png',
            vibrate: [100, 50, 100]
        };

        return self.registration.showNotification(title, options);
    });
}