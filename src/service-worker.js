import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { openDB } from 'idb';

const BASE_URL = 'https://story-api.dicoding.dev/v1';
const SW_VERSION = '1.0.1'; // Increment version untuk update
const CACHE_NAME = `story-app-cache-${SW_VERSION}`;

// 1. Precaching file hasil build
precacheAndRoute(self.__WB_MANIFEST);

// 2. Install event - DIPERBAIKI: Tambah cache offline essentials
self.addEventListener('install', (event) => {
    console.log(`✅ Service Worker installing... Version: ${SW_VERSION}`);
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Pre-caching essential resources...');
            return cache.addAll([
                '/',
                '/index.html',
                '/offline.html', // Tambahkan halaman offline jika ada
                '/css/style.css', // Sesuaikan dengan file CSS Anda
                '/js/app.js', // Sesuaikan dengan file JS Anda
                '/images/icons/icon-x192.png',
                '/images/icons/icon-x512.png',
                // Tambahkan resource penting lainnya
            ]).catch(err => {
                console.warn('Some resources failed to precache:', err);
                // Jangan gagal install jika beberapa resource tidak ditemukan
            });
        }).then(() => {
            // Force aktivasi service worker baru
            return self.skipWaiting();
        })
    );
});

// 3. Activate event - DIPERBAIKI: Pembersihan cache yang lebih baik
self.addEventListener('activate', (event) => {
    console.log(`✅ Service Worker activating... Version: ${SW_VERSION}`);
    
    event.waitUntil(
        (async () => {
            try {
                const cacheNames = await caches.keys();
                
                // Daftar cache yang valid/terbaru
                const currentCacheVersions = [
                    'google-fonts-v1',
                    'fontawesome-v1',
                    'avatars-api-v1',
                    'story-app-api-v1',
                    'story-app-api-images-v1',
                    'openstreetmap-tiles-v1',
                    CACHE_NAME,
                ];
                
                // Hapus cache lama
                const cachesToDelete = cacheNames.filter(cacheName => {
                    // Jangan hapus cache workbox yang aktif
                    if (cacheName.includes('workbox-precache')) {
                        return false;
                    }
                    
                    // Hapus cache lama
                    return !currentCacheVersions.includes(cacheName) && 
                           !currentCacheVersions.some(validCache => 
                               cacheName.includes(validCache.replace('-v1', ''))
                           );
                });
                
                await Promise.all(
                    cachesToDelete.map(cacheName => {
                        console.log(`🗑️ Menghapus cache lama: ${cacheName}`);
                        return caches.delete(cacheName);
                    })
                );
                
                // Ambil kontrol semua clients
                await self.clients.claim();
                console.log('✅ Service Worker activated successfully');
                
            } catch (error) {
                console.error('❌ Error during activation:', error);
            }
        })()
    );
});

// 4. DIPERBAIKI: Fetch event untuk offline fallback
self.addEventListener('fetch', (event) => {
    // Skip jika bukan HTTP request
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    // Skip untuk extension requests
    if (event.request.url.includes('extension://')) {
        return;
    }
    
    // Skip untuk chrome-extension requests
    if (event.request.url.includes('chrome-extension://')) {
        return;
    }
    
    event.respondWith(
        handleFetch(event.request)
    );
});

// Helper function untuk handle fetch dengan fallback offline
async function handleFetch(request) {
    try {
        // Coba network first
        const networkResponse = await fetch(request);
        
        // Jika berhasil, simpan ke cache jika sesuai
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        
        // Network gagal, coba ambil dari cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Jika tidak ada di cache, berikan fallback
        if (request.destination === 'document') {
            // Untuk navigation request, berikan halaman offline
            const offlineResponse = await caches.match('/offline.html') || 
                                   await caches.match('/index.html');
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        
        // Untuk API request, berikan response offline
        if (request.url.includes('/v1/stories')) {
            return handleOfflineAPI(request);
        }
        
        // Untuk gambar, berikan placeholder
        if (request.destination === 'image') {
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="#999">Gambar tidak tersedia</text></svg>',
                {
                    headers: {
                        'Content-Type': 'image/svg+xml',
                    },
                }
            );
        }
        
        // Default fallback
        return new Response('Tidak dapat memuat resource ini saat offline', {
            status: 503,
            statusText: 'Service Unavailable',
        });
    }
}

// Handle offline API responses
async function handleOfflineAPI(request) {
    try {
        const db = await openDB('story-app-db', 1, {
            upgrade(db) {
                // Buat object store jika belum ada
                if (!db.objectStoreNames.contains('stories')) {
                    db.createObjectStore('stories', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('story-queue')) {
                    db.createObjectStore('story-queue', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('auth')) {
                    db.createObjectStore('auth', { keyPath: 'key' });
                }
            },
        });
        
        // Untuk GET request, ambil data dari IndexedDB
        if (request.method === 'GET') {
            const tx = db.transaction('stories', 'readonly');
            const store = tx.objectStore('stories');
            const stories = await store.getAll();
            
            return new Response(JSON.stringify({
                error: false,
                message: 'Stories fetched from offline storage',
                listStory: stories.map(story => ({
                    id: story.id,
                    name: story.name,
                    description: story.description,
                    photoUrl: story.photoUrl,
                    createdAt: story.createdAt,
                    lat: story.lat,
                    lon: story.lon
                }))
            }), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        
        // Untuk POST request (add story), simpan ke queue
        if (request.method === 'POST') {
            const formData = await request.formData();
            const description = formData.get('description');
            const photo = formData.get('photo');
            const lat = formData.get('lat');
            const lon = formData.get('lon');
            
            // Simpan ke queue untuk background sync
            const storyId = 'offline-' + Date.now();
            let photoDataUrl = null;
            
            if (photo) {
                photoDataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(photo);
                });
            }
            
            const tx = db.transaction('story-queue', 'readwrite');
            const store = tx.objectStore('story-queue');
            await store.add({
                id: storyId,
                data: { description, lat, lon },
                photo: photoDataUrl,
                timestamp: Date.now()
            });
            
            // Register background sync
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                try {
                    await self.registration.sync.register('sync-new-stories');
                } catch (err) {
                    console.log('Background sync registration failed:', err);
                }
            }
            
            return new Response(JSON.stringify({
                error: false,
                message: 'Story saved offline and will be synced when online'
            }), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
        
    } catch (error) {
        console.error('Offline API handler error:', error);
        return new Response(JSON.stringify({
            error: true,
            message: 'Offline storage error: ' + error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}

// 5. Fallback routing untuk SPA
registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
        allowlist: [/^(?!.*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|json)).*$/],
    })
);

// 6. Google Fonts caching
registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] })
        ],
    })
);

// 7. FontAwesome caching
registerRoute(
    ({ url }) => url.origin.includes('fontawesome') || url.origin === 'https://cdnjs.cloudflare.com',
    new CacheFirst({
        cacheName: 'fontawesome-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] })
        ],
    })
);

// 8. UI Avatar caching
registerRoute(
    ({ url }) => url.origin === 'https://ui-avatars.com',
    new CacheFirst({
        cacheName: 'avatars-api-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] })
        ],
    })
);

// 9. API JSON caching dengan offline fallback
registerRoute(
    ({ request, url }) => {
        const baseUrlOrigin = new URL(BASE_URL).origin;
        return url.origin === baseUrlOrigin && 
               request.destination !== 'image' && 
               url.pathname.startsWith('/v1/stories');
    },
    new NetworkFirst({
        cacheName: 'story-app-api-v1',
        networkTimeoutSeconds: 10,
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] })
        ],
    })
);

// 10. API Images caching
registerRoute(
    ({ request, url }) => {
        const baseUrlOrigin = new URL(BASE_URL).origin;
        return url.origin === baseUrlOrigin && 
               request.destination === 'image' && 
               url.pathname.includes('/stories/images/');
    },
    new StaleWhileRevalidate({
        cacheName: 'story-app-api-images-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] })
        ],
    })
);

// 11. OpenStreetMap Tiles caching
registerRoute(
    ({ url }) => url.origin.includes('openstreetmap.org') || url.origin.includes('tile.openstreetmap.org'),
    new CacheFirst({
        cacheName: 'openstreetmap-tiles-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] })
        ],
    })
);

// 12. Push Notification handler
self.addEventListener('push', (event) => {
    console.log('📢 Push event received:', event);
    
    const handlePush = async () => {
        try {
            let data = event.data ? event.data.json() : {};
            const title = data.title || 'Pemberitahuan StoryShare';
            const options = {
                body: data.body || 'Ada notifikasi baru atau update menarik!',
                icon: data.icon || '/images/icons/icon-x192.png',
                badge: data.badge || '/images/icons/maskable-icon-x144.png',
                data: {
                    url: data.url || '/',
                },
                actions: [
                    { action: 'view-story', title: 'Lihat Cerita', icon: '/images/icons/icon-x144.png' },
                    { action: 'close', title: 'Tutup', icon: '/images/icons/maskable-icon-x192.png' }
                ],
                tag: 'story-app-notification',
                renotify: true,
                ...data.options,
            };

            await self.registration.showNotification(title, options);
        } catch (err) {
            console.error('❌ Push error:', err);
            await self.registration.showNotification('StoryApp', {
                body: 'Ada notifikasi baru! (Error parsing data)',
                icon: '/images/icons/icon-x192.png',
            });
        }
    };

    event.waitUntil(handlePush());
});

// 13. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const clickedNotification = event.notification;
    const action = event.action;
    const urlToOpen = clickedNotification.data.url || '/';

    console.log('Notifikasi diklik:', clickedNotification.title);
    console.log('Aksi yang dilakukan:', action);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// 14. Background Sync dengan error handling yang lebih baik
self.addEventListener('sync', (event) => {
    console.log('🔄 Sync event:', event.tag);
    if (event.tag === 'sync-new-stories') {
        event.waitUntil(syncNewStories());
    }
});

async function syncNewStories() {
    console.log('🔄 Syncing stories...');
    
    try {
        const db = await openDB('story-app-db', 1);
        const tx = db.transaction('story-queue', 'readwrite');
        const store = tx.objectStore('story-queue');
        const allStories = await store.getAll();

        if (allStories.length === 0) {
            console.log('No stories to sync');
            return;
        }

        for (const storyItem of allStories) {
            try {
                let token = localStorage.getItem('token');

                if (!token) {
                    try {
                        const authDb = await openDB('story-app-db', 1);
                        const authTx = authDb.transaction('auth', 'readonly');
                        const authStore = authTx.objectStore('auth');
                        const authEntry = await authStore.get('current_user_token');
                        token = authEntry?.token;
                    } catch (dbError) {
                        console.warn('Could not retrieve token from IndexedDB:', dbError);
                    }
                }

                if (!token) {
                    console.warn('⚠️ No token found for sync. Skipping story:', storyItem.id);
                    continue;
                }

                const storyDataToSend = new FormData();
                storyDataToSend.append('description', storyItem.data.description);
                
                if (storyItem.photo && typeof storyItem.photo === 'string' && storyItem.photo.startsWith('data:image')) {
                    const response = await fetch(storyItem.photo);
                    const blob = await response.blob();
                    storyDataToSend.append('photo', blob, `story-photo-${storyItem.id}.jpeg`);
                }
                
                if (storyItem.data.lat) storyDataToSend.append('lat', storyItem.data.lat);
                if (storyItem.data.lon) storyDataToSend.append('lon', storyItem.data.lon);

                console.log(`Uploading story ${storyItem.id} via background sync...`);

                const res = await fetch(`${BASE_URL}/stories`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: storyDataToSend,
                });

                if (!res.ok) {
                    const errorBody = await res.json().catch(() => ({ message: 'No error message' }));
                    console.error('❌ Sync failed for story:', storyItem.id, 'Status:', res.status, 'Error:', errorBody.message);
                    
                    if (res.status === 401 || res.status === 403) {
                        console.error('Unauthorized during sync. Removing invalid token.');
                        localStorage.removeItem('token');
                    }
                    continue;
                }

                // Sukses - hapus dari queue
                await store.delete(storyItem.id);
                console.log('✅ Story synced and deleted from queue:', storyItem.id);

                // Notifikasi sukses
                self.registration.showNotification('Story Sync Berhasil', {
                    body: `Cerita "${storyItem.data.description.substring(0, 30)}..." berhasil diunggah!`,
                    icon: '/images/icons/icon-x192.png',
                    tag: 'story-sync-success',
                });

            } catch (err) {
                console.error('❌ Story sync error for:', storyItem.id, err);
                
                // Notifikasi error
                self.registration.showNotification('Story Sync Gagal', {
                    body: `Gagal mengunggah cerita: ${err.message}`,
                    icon: '/images/icons/icon-x192.png',
                    tag: 'story-sync-failure',
                });
            }
        }
        
        console.log('✅ Background sync completed');
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// 15. Error handlers
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
    event.preventDefault();
});

// 16. TAMBAHAN: Online/Offline status handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'STORE_STORY_OFFLINE') {
        // Handle pesan dari main app untuk menyimpan story offline
        storeStoryOffline(event.data.story);
    }
});

async function storeStoryOffline(storyData) {
    try {
        const db = await openDB('story-app-db', 1);
        const tx = db.transaction('stories', 'readwrite');
        const store = tx.objectStore('stories');
        await store.put(storyData);
        console.log('✅ Story stored offline:', storyData.id);
    } catch (error) {
        console.error('❌ Failed to store story offline:', error);
    }
}