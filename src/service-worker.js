// src/service-worker.js
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Cache API responses with proper fallback
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'story-api',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Tambahkan kode ini di service-worker.js setelah bagian cache images

// Cache OpenStreetMap tiles untuk offline maps
registerRoute(
  ({ url }) => 
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('openstreetmap'),
  new CacheFirst({
    cacheName: 'maps-tiles-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache Leaflet library assets
registerRoute(
  ({ url }) => 
    url.hostname.includes('unpkg.com') && 
    url.pathname.includes('leaflet'),
  new CacheFirst({
    cacheName: 'leaflet-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache marker icons
registerRoute(
  ({ request }) => 
    request.url.includes('marker-icon') || 
    request.url.includes('marker-shadow'),
  new CacheFirst({
    cacheName: 'map-markers',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache other assets
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// ========== TAMBAHKAN KODE UNTUK MAPS CACHING ==========

// Cache OpenStreetMap tiles untuk offline maps
registerRoute(
  ({ url }) => 
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('openstreetmap') ||
    url.pathname.includes('.png') && url.hostname.includes('tile'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache Leaflet CSS dan JS dari CDN
registerRoute(
  ({ url }) => 
    url.hostname.includes('unpkg.com') && 
    (url.pathname.includes('leaflet') || url.pathname.includes('map')),
  new StaleWhileRevalidate({
    cacheName: 'map-libraries',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Custom fetch handler untuk maps dengan fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle navigation requests (existing code)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || caches.match('/index.html');
      })
    );
    return;
  }
  
  // Handle map tile requests dengan fallback khusus
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('openstreetmap')) {
    event.respondWith(
      caches.open('map-tiles').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Return placeholder tile untuk offline
            return new Response(
              createPlaceholderTile(),
              { 
                headers: { 
                  'Content-Type': 'image/svg+xml',
                  'Cache-Control': 'no-cache'
                } 
              }
            );
          });
        });
      })
    );
  }
});

// Function untuk membuat placeholder tile
function createPlaceholderTile() {
  return `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#f0f0f0" stroke="#ddd" stroke-width="1"/>
      <text x="128" y="120" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="14">
        Offline
      </text>
      <text x="128" y="140" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="12">
        Map Tile
      </text>
      <circle cx="128" cy="160" r="8" fill="#999"/>
    </svg>
  `;
}

// Function untuk pre-cache map tiles berdasarkan story locations
async function preCacheMapTiles(stories) {
  const cache = await caches.open('map-tiles');
  const zoom = 13;
  
  for (const story of stories) {
    if (story.lat && story.lon) {
      const tiles = generateTileUrls(story.lat, story.lon, zoom);
      
      const promises = tiles.map(async (tileUrl) => {
        try {
          const response = await fetch(tileUrl);
          if (response.ok) {
            await cache.put(tileUrl, response.clone());
          }
        } catch (error) {
          console.log(`Failed to cache tile: ${tileUrl}`);
        }
      });
      
      await Promise.allSettled(promises);
    }
  }
}

// Function untuk generate tile URLs
function generateTileUrls(lat, lon, zoom) {
  const tiles = [];
  const tileX = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  
  // Cache 3x3 grid around location
  for (let x = tileX - 1; x <= tileX + 1; x++) {
    for (let y = tileY - 1; y <= tileY + 1; y++) {
      if (x >= 0 && y >= 0) {
        tiles.push(`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
      }
    }
  }
  
  return tiles;
}

// Listen for messages from main thread untuk pre-cache tiles
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_TILES') {
    const { stories } = event.data;
    preCacheMapTiles(stories);
  }
});

// ========== END MAPS CACHING CODE ==========

// Handle push notifications (existing code)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    notificationData = {
      title: 'Story App',
      body: 'You have a new notification',
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-512x512.png',
    };
  }

  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/images/icons/icon-192x192.png',
    badge: notificationData.badge || '/images/icons/icon-512x512.png',
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Story App',
      options
    )
  );
});

// Handle notification clicks (existing code)
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const hadWindowToFocus = clientsArr.some((windowClient) => {
        if (windowClient.url === urlToOpen) {
          windowClient.focus();
          return true;
        }
        return false;
      });

      if (!hadWindowToFocus) {
        clients.openWindow(urlToOpen).then((windowClient) => {
          if (windowClient) {
            windowClient.focus();
          }
        });
      }
    })
  );
});

// Handle background sync (existing code)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Add your background sync logic here
      Promise.resolve()
    );
  }
});