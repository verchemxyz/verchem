/**
 * VerChem Service Worker
 * Provides offline support for chemistry calculations
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

const CACHE_VERSION = 'verchem-v2.0.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_ROUTE_ALIASES = {
  '/tools/ph-calculator': '/solutions',
};

// Static assets to cache immediately (app shell)
const STATIC_ASSETS = [
  '/',
  '/periodic-table',
  '/calculators',
  '/tools',
  '/compounds',
  '/solutions',
  '/tools/ph-calculator',
  '/manifest.json',
  '/logo.png',
  '/offline.html',
];

/**
 * Populate the new cache before any legacy cache is removed. Network content
 * wins; an older cached response is used only as an offline migration fallback.
 * Throwing when neither exists keeps the current worker active and its cache
 * intact instead of activating a worker with incomplete offline coverage.
 */
async function warmStaticAssets() {
  const cache = await caches.open(STATIC_CACHE);

  await Promise.all(STATIC_ASSETS.map(async (asset) => {
    const request = new Request(new URL(asset, self.location.origin).toString(), {
      cache: 'reload',
    });

    if (await cache.match(request)) return;

    try {
      const response = await fetch(request);
      if (!response.ok) {
        throw new Error(`Failed to warm ${asset}: HTTP ${response.status}`);
      }
      await cache.put(request, response);
      return;
    } catch (networkError) {
      const pathname = new URL(request.url).pathname;
      const alias = OFFLINE_ROUTE_ALIASES[pathname];
      const migrated = await caches.match(request) ||
        (alias ? await caches.match(new URL(alias, self.location.origin).toString()) : undefined);
      if (!migrated) throw networkError;
      await cache.put(request, migrated.clone());
    }
  }));
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    warmStaticAssets()
      .then(() => {
        console.log('[SW] Static assets cached successfully');
      })
  );
});

// Activate only after the replacement shell is warm. Legacy caches remain as
// offline history: dynamic pages cannot be reconstructed from a static list.
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    (async () => {
      // This also repairs an interrupted partial warm.
      await warmStaticAssets();
      console.log('[SW] Replacement shell ready; legacy offline caches preserved');
      await self.clients.claim();
    })()
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip API requests (always fetch from network)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - API unavailable' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Skip auth-related requests
  if (url.pathname.startsWith('/auth/') || url.pathname.includes('callback')) {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page loads
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(request).then(async (cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            const alias = OFFLINE_ROUTE_ALIASES[url.pathname];
            if (alias) {
              const aliasResponse = await caches.match(
                new URL(alias, self.location.origin).toString()
              );
              if (aliasResponse) return aliasResponse;
            }
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // For static assets (CSS, JS, images)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, but also update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse;
        }

        // Not in cache - fetch from network and cache
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return offline fallback for certain resource types
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/><text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            throw new Error('Network request failed');
          });
      })
  );
});

// Background sync for saving calculations
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-calculations') {
    event.waitUntil(syncCalculations());
  }
});

async function syncCalculations() {
  // Get pending calculations from IndexedDB
  // and sync them to the server when online
  console.log('[SW] Syncing calculations...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'VerChem', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Otherwise open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// One message listener owns both update activation and manual cache warming.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }

  if (event.data?.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});

console.log('[SW] Service Worker loaded - VerChem PWA ready!');
