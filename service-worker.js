// تحديث إصدار الكاش
const CACHE_VERSION = 'v2';
const CACHE_NAME = `chat-app-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `chat-dynamic-${CACHE_VERSION}`;

// إضافة إدارة الحياة في الخلفية
let wakeLock = null;
let isCallActive = false;

// التأكد من بقاء التطبيق نشطاً في الخلفية
async function keepAlive() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.error('خطأ في تفعيل wakeLock:', err);
    }
}

// معالجة المكالمات في الخلفية
self.addEventListener('message', async (event) => {
    if (event.data.type === 'CALL_STATUS') {
        isCallActive = event.data.isActive;
        
        if (isCallActive) {
            await keepAlive();
            // إنشاء إشعار للمكالمة النشطة
            const notificationOptions = {
                tag: 'ongoing-call',
                body: 'مكالمة جارية',
                icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/profiles%2F%D8%AE%D9%84%D9%81%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%8A%D9%81%D9%88%D9%86%2014%20%D8%A8%D8%B1%D9%88%20%D9%85%D8%A7%D9%83%D8%B3%20%D8%A7%D8%B5%D9%84%D9%8A%D8%A9%20%D9%81%D8%AE%D9%85%D9%87%20%D8%A8%D8%AF%D9%82%D8%A9%20HD_1.jpg?alt=media&token=fa611f61-008d-4976-a6cf-f32833ae297c',
                badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/profiles%2F%D8%AE%D9%84%D9%81%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%8A%D9%81%D9%88%D9%86%2014%20%D8%A8%D8%B1%D9%88%20%D9%85%D8%A7%D9%83%D8%B3%20%D8%A7%D8%B5%D9%84%D9%8A%D8%A9%20%D9%81%D8%AE%D9%85%D9%87%20%D8%A8%D8%AF%D9%82%D8%A9%20HD_1.jpg?alt=media&token=fa611f61-008d-4976-a6cf-f32833ae297c',
                requireInteraction: true,
                actions: [
                    { action: 'endCall', title: 'إنهاء المكالمة' }
                ],
                silent: true
            };
            
            await self.registration.showNotification('مكالمة نشطة', notificationOptions);
        } else {
            if (wakeLock) {
                await wakeLock.release();
                wakeLock = null;
            }
            // إزالة إشعار المكالمة
            const notifications = await self.registration.getNotifications({
                tag: 'ongoing-call'
            });
            notifications.forEach(notification => notification.close());
        }
    }
});

// معالجة النقر على إشعارات المكالمات
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'endCall') {
        // إرسال رسالة لإنهاء المكالمة
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'END_CALL'
                });
            });
        });
    } else {
        // فتح التطبيق عند النقر على الإشعار
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                if (clients.length > 0) {
                    clients[0].focus();
                } else {
                    self.clients.openWindow('/');
                }
            })
        );
    }
});

// تحسين معالجة الإشعارات
self.addEventListener('push', async (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        
        // تخصيص الإشعارات حسب النوع
        let notificationOptions = {
            icon: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/profiles%2F%D8%AE%D9%84%D9%81%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%8A%D9%81%D9%88%D9%86%2014%20%D8%A8%D8%B1%D9%88%20%D9%85%D8%A7%D9%83%D8%B3%20%D8%A7%D8%B5%D9%84%D9%8A%D8%A9%20%D9%81%D8%AE%D9%85%D9%87%20%D8%A8%D8%AF%D9%82%D8%A9%20HD_1.jpg?alt=media&token=fa611f61-008d-4976-a6cf-f32833ae297c',
            badge: 'https://firebasestorage.googleapis.com/v0/b/messageemeapp.appspot.com/o/profiles%2F%D8%AE%D9%84%D9%81%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%8A%D9%81%D9%88%D9%86%2014%20%D8%A8%D8%B1%D9%88%20%D9%85%D8%A7%D9%83%D8%B3%20%D8%A7%D8%B5%D9%84%D9%8A%D8%A9%20%D9%81%D8%AE%D9%85%D9%87%20%D8%A8%D8%AF%D9%82%D8%A9%20HD_1.jpg?alt=media&token=fa611f61-008d-4976-a6cf-f32833ae297c',
            vibrate: [100, 50, 100],
            data: {
                url: '/',
                type: data.type
            }
        };

        switch (data.type) {
            case 'incoming_call':
                notificationOptions = {
                    ...notificationOptions,
                    tag: 'call-' + data.callId,
                    body: 'مكالمة واردة من ' + data.caller,
                    requireInteraction: true,
                    actions: [
                        { action: 'answer', title: 'رد' },
                        { action: 'reject', title: 'رفض' }
                    ],
                    renotify: true
                };
                break;
                
            case 'missed_call':
                notificationOptions = {
                    ...notificationOptions,
                    tag: 'missed-' + data.callId,
                    body: 'مكالمة فائتة من ' + data.caller,
                    timestamp: data.timestamp
                };
                break;
                
            case 'new_message':
                notificationOptions = {
                    ...notificationOptions,
                    tag: 'msg-' + data.senderId,
                    body: data.message,
                    renotify: true
                };
                break;
        }

        await self.registration.showNotification(data.title, notificationOptions);
    } catch (error) {
        console.error('خطأ في معالجة الإشعار:', error);
    }
});

// تحسين التخزين المؤقت للملفات الصوتية
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/sounds/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse.ok) {
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseToCache);
                                    });
                            }
                            return networkResponse;
                        });
                })
        );
        return;
    }
});

// إضافة دعم للمزامنة في الخلفية
self.addEventListener('sync', async (event) => {
    if (event.tag === 'send-messages') {
        event.waitUntil(
            // مزامنة الرسائل غير المرسلة
            syncMessages()
        );
    } else if (event.tag === 'sync-calls') {
        event.waitUntil(
            // مزامنة سجلات المكالمات
            syncCalls()
        );
    }
});

// دعم وضع عدم الاتصال
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse.ok) {
                            const responseToCache = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// تحديث Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('chat-') && 
                                   cacheName !== CACHE_NAME &&
                                   cacheName !== DYNAMIC_CACHE;
                        })
                        .map(cacheName => caches.delete(cacheName))
                );
            }),
            // تنشيط فوري
            self.clients.claim()
        ])
    );
});
