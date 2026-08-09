/**
 * VerChem Service Worker
 * Provides offline support for chemistry calculations
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

const CACHE_VERSION = 'verchem-v2.0.2';
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

function isCurrentCache(cacheName) {
  return cacheName === STATIC_CACHE || cacheName === DYNAMIC_CACHE;
}

async function matchCaches(cacheNames, request) {
  for (const cacheName of cacheNames) {
    const response = await (await caches.open(cacheName)).match(request);
    if (response) return response;
  }
  return undefined;
}

async function legacyCacheNames() {
  return (await caches.keys()).filter((cacheName) =>
    cacheName.startsWith('verchem-') && !isCurrentCache(cacheName)
  );
}

/**
 * Remove only entries that the current worker can already serve. Other pages
 * opened under an older worker remain available as offline history.
 */
async function retireLegacyEntry(request) {
  const names = await legacyCacheNames();
  await Promise.all(names.map(async (cacheName) => {
    await (await caches.open(cacheName)).delete(request);
  }));
}

/**
 * CacheStorage.match() searches caches in creation order, which lets a v1
 * response beat a warmed v2 response forever. Always search the two current
 * caches explicitly before consulting legacy history.
 */
async function matchCurrentThenLegacy(request, preferDynamic = false) {
  const currentOrder = preferDynamic
    ? [DYNAMIC_CACHE, STATIC_CACHE]
    : [STATIC_CACHE, DYNAMIC_CACHE];
  const current = await matchCaches(currentOrder, request);
  if (current) {
    await retireLegacyEntry(request);
    return current;
  }

  return matchCaches(await legacyCacheNames(), request);
}

async function putInCurrentCache(cacheName, request, response) {
  await (await caches.open(cacheName)).put(request, response);
  await retireLegacyEntry(request);
}

/**
 * Populate the new cache before any legacy cache is removed. Network content
 * wins; an older cached response is used only as an offline migration fallback.
 * Throwing when neither exists keeps the current worker active and its cache
 * intact instead of activating a worker with incomplete offline coverage.
 */
async function warmStaticAssets() {
  const cache = await caches.open(STATIC_CACHE);

  const warmAsset = async (asset) => {
    const request = new Request(new URL(asset, self.location.origin).toString(), {
      cache: 'reload',
    });

    if (await cache.match(request)) {
      await retireLegacyEntry(request);
      return;
    }

    try {
      const response = await fetch(request);
      if (!response.ok) {
        throw new Error(`Failed to warm ${asset}: HTTP ${response.status}`);
      }
      await cache.put(request, response);
      await retireLegacyEntry(request);
      return;
    } catch (networkError) {
      const pathname = new URL(request.url).pathname;
      const alias = OFFLINE_ROUTE_ALIASES[pathname];
      const migrated = await matchCurrentThenLegacy(request) ||
        (alias
          ? await matchCurrentThenLegacy(new URL(alias, self.location.origin).toString(), true)
          : undefined);
      if (!migrated) throw networkError;
      await cache.put(request, migrated.clone());
      await retireLegacyEntry(request);
    }
  };

  // Warm canonical routes first so an offline alias migrates from the current
  // canonical response, never from an older cache racing the same install.
  const aliases = new Set(Object.keys(OFFLINE_ROUTE_ALIASES));
  await Promise.all(STATIC_ASSETS.filter((asset) => !aliases.has(asset)).map(warmAsset));
  await Promise.all(STATIC_ASSETS.filter((asset) => aliases.has(asset)).map(warmAsset));
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
            void putInCurrentCache(DYNAMIC_CACHE, request, responseClone);
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return matchCurrentThenLegacy(request, true).then(async (cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            const alias = OFFLINE_ROUTE_ALIASES[url.pathname];
            if (alias) {
              const aliasResponse = await matchCurrentThenLegacy(
                new URL(alias, self.location.origin).toString(),
                true
              );
              if (aliasResponse) return aliasResponse;
            }
            return matchCurrentThenLegacy(
              new URL('/offline.html', self.location.origin).toString()
            );
          });
        })
    );
    return;
  }

  // For static assets (CSS, JS, images)
  event.respondWith(
    matchCurrentThenLegacy(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, but also update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                void putInCurrentCache(STATIC_CACHE, request, responseClone);
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
              void putInCurrentCache(DYNAMIC_CACHE, request, responseClone);
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
