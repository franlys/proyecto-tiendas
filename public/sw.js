/**
 * Service Worker for Linko PWA
 * Handles push notifications and offline caching
 */

const CACHE_NAME = 'linko-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let data = {
        title: 'Linko',
        body: 'Nueva notificacion',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: 'linko-notification',
        data: {},
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            data = { ...data, ...payload };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/icon-72.png',
        tag: data.tag || 'linko-notification',
        data: data.data || {},
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [
            { action: 'view', title: 'Ver' },
            { action: 'close', title: 'Cerrar' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    const action = event.action;
    const notificationData = event.notification.data || {};

    // Determine URL to open
    let urlToOpen = '/admin';

    if (notificationData.url) {
        urlToOpen = notificationData.url;
    } else if (notificationData.type === 'new_order') {
        urlToOpen = '/admin/orders';
    } else if (notificationData.type === 'new_booking') {
        urlToOpen = '/admin/bookings';
    } else if (notificationData.type === 'low_stock') {
        urlToOpen = '/admin/inventory';
    }

    if (action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if already open
                for (const client of windowClients) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event);
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip non-http(s) requests
    if (!event.request.url.startsWith('http')) return;

    // Skip API requests
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Return cached version if available
                return caches.match(event.request);
            })
    );
});

console.log('[SW] Service Worker loaded');
