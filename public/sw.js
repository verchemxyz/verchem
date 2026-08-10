/**
 * VerChem Service Worker
 * Provides offline support for chemistry calculations
 *
 * Created: 2026-01-29
 * Author: สมนึก (Claude Opus 4.5)
 */

const CACHE_VERSION = 'verchem-v2.0.3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const STAGING_CACHE = `${CACHE_VERSION}-staging`;
const STAGING_URL_PATH = `/.verchem-sw-staging/${CACHE_VERSION}`;
const VERSIONED_CACHE_NAME = /^verchem-v(\d+)\.(\d+)\.(\d+)-(static|dynamic)$/;
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

const STATIC_HTML_ROUTES = new Set([
  '/',
  '/periodic-table',
  '/calculators',
  '/tools',
  '/compounds',
  '/solutions',
  '/tools/ph-calculator',
  '/offline.html',
]);

function cacheDescriptor(cacheName) {
  const match = VERSIONED_CACHE_NAME.exec(cacheName);
  if (!match) return null;

  const release = match.slice(1, 4).map(Number);
  if (!release.every(Number.isSafeInteger)) return null;

  return { cacheName, release, kind: match[4] };
}

function compareReleases(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

const CURRENT_CACHE_DESCRIPTOR = cacheDescriptor(STATIC_CACHE);
if (!CURRENT_CACHE_DESCRIPTOR) throw new Error(`Invalid cache version: ${CACHE_VERSION}`);

async function matchCaches(cacheNames, request) {
  for (const cacheName of cacheNames) {
    const response = await (await caches.open(cacheName)).match(request);
    if (response) return response;
  }
  return undefined;
}

async function legacyCacheNames() {
  return (await caches.keys())
    .map(cacheDescriptor)
    .filter((candidate) =>
      candidate && compareReleases(candidate.release, CURRENT_CACHE_DESCRIPTOR.release) < 0
    )
    .sort((left, right) => {
      const releaseOrder = compareReleases(right.release, left.release);
      if (releaseOrder !== 0) return releaseOrder;

      // Within one release, prefer runtime content over its original shell.
      if (left.kind !== right.kind) return left.kind === 'dynamic' ? -1 : 1;
      return left.cacheName.localeCompare(right.cacheName);
    })
    .map((candidate) => candidate.cacheName);
}

function absoluteRequestUrl(request) {
  return new URL(
    typeof request === 'string' ? request : request.url,
    self.location.origin
  ).toString();
}

/**
 * Staging keys are deliberately unrelated to the URL a page will request.
 * Production v1.0.0 uses global caches.match(request), so changing only the
 * cache namespace would still expose a partially warmed replacement shell.
 */
function stagingRequestFor(request) {
  const stagingUrl = new URL(STAGING_URL_PATH, self.location.origin);
  stagingUrl.searchParams.set('source', absoluteRequestUrl(request));
  return new Request(stagingUrl.toString());
}

function sourceRequestFromStaging(stagingRequest) {
  const stagingUrl = new URL(stagingRequest.url);
  if (stagingUrl.origin !== self.location.origin || stagingUrl.pathname !== STAGING_URL_PATH) {
    return null;
  }

  const source = stagingUrl.searchParams.get('source');
  if (!source) return null;

  const sourceUrl = new URL(source);
  if (sourceUrl.origin !== self.location.origin) return null;
  return new Request(sourceUrl.toString());
}

async function matchStaged(request) {
  if (!(await caches.keys()).includes(STAGING_CACHE)) return undefined;
  return (await caches.open(STAGING_CACHE)).match(stagingRequestFor(request));
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

function currentCacheOrder(preferDynamic) {
  return preferDynamic
    ? [DYNAMIC_CACHE, STATIC_CACHE]
    : [STATIC_CACHE, DYNAMIC_CACHE];
}

async function matchCurrentCaches(request, preferDynamic = false) {
  // While activation publishes canonical keys, the complete staging snapshot
  // must beat any partial/stale canonical cache from an interrupted attempt.
  return await matchStaged(request) || matchCaches(currentCacheOrder(preferDynamic), request);
}

/** Read migration history without mutating it (safe while installing/waiting). */
async function matchCurrentThenLegacyReadOnly(request, preferDynamic = false) {
  return await matchCurrentCaches(request, preferDynamic) ||
    matchCaches(await legacyCacheNames(), request);
}

/**
 * CacheStorage.match() searches caches in creation order, which lets a v1
 * response beat a warmed v2 response forever. Always search the two current
 * caches explicitly before consulting legacy history.
 */
async function matchCurrentThenLegacy(request, preferDynamic = false) {
  const current = await matchCurrentCaches(request, preferDynamic);
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
 * Extract only same-origin Next.js build assets from script/link tags. The
 * restricted prefix keeps arbitrary document links out of the app shell.
 */
function nextStaticAssetUrls(html) {
  const assets = new Set();
  const tags = html.match(/<(?:script|link)\b[^>]*>/gi) || [];

  for (const tag of tags) {
    const attribute = /\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(tag);
    const reference = attribute?.[1] || attribute?.[2] || attribute?.[3];
    if (!reference) continue;

    try {
      const url = new URL(reference.replace(/&amp;/g, '&'), self.location.origin);
      if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
        assets.add(url.toString());
      }
    } catch {
      // Ignore malformed HTML attributes; the route itself remains cacheable.
    }
  }

  return assets;
}

/**
 * Install/repair is strictly additive and writes only synthetic staging keys.
 * Network content wins; an older cached response is a read-only offline
 * migration fallback. Throwing when neither exists keeps the previous worker
 * active without exposing a partial replacement through global caches.match().
 */
async function warmStaticAssets() {
  const cache = await caches.open(STAGING_CACHE);

  const warmAsset = async (asset) => {
    const request = new Request(new URL(asset, self.location.origin).toString(), {
      cache: 'reload',
    });
    const stagingRequest = stagingRequestFor(request);

    const cached = await cache.match(stagingRequest);
    if (cached) return cached;

    let response;
    try {
      response = await fetch(request);
      if (!response.ok) {
        throw new Error(`Failed to warm ${asset}: HTTP ${response.status}`);
      }
    } catch (networkError) {
      const pathname = new URL(request.url).pathname;
      const alias = OFFLINE_ROUTE_ALIASES[pathname];
      const migrated = await matchCurrentThenLegacyReadOnly(request) ||
        (alias
          ? await matchStaged(new URL(alias, self.location.origin).toString()) ||
            await matchCurrentThenLegacyReadOnly(
              new URL(alias, self.location.origin).toString(), true
            )
          : undefined);
      if (!migrated) throw networkError;
      response = migrated;
    }

    await cache.put(stagingRequest, response.clone());
    return response;
  };

  // Warm canonical routes first so an offline alias migrates from the current
  // canonical response, never from an older cache racing the same install.
  const aliases = new Set(Object.keys(OFFLINE_ROUTE_ALIASES));
  const canonicalAssets = STATIC_ASSETS.filter((asset) => !aliases.has(asset));
  const aliasAssets = STATIC_ASSETS.filter((asset) => aliases.has(asset));
  const canonicalResponses = await Promise.all(canonicalAssets.map(warmAsset));
  const aliasResponses = await Promise.all(aliasAssets.map(warmAsset));

  const nextStaticAssets = new Set();
  for (const [asset, response] of [
    ...canonicalAssets.map((asset, index) => [asset, canonicalResponses[index]]),
    ...aliasAssets.map((asset, index) => [asset, aliasResponses[index]]),
  ]) {
    if (!STATIC_HTML_ROUTES.has(asset)) continue;
    const html = await response.clone().text();
    for (const reference of nextStaticAssetUrls(html)) nextStaticAssets.add(reference);
  }

  // A successful install means every precached route has the exact JS/CSS
  // graph referenced by its HTML, deduplicated across the whole app shell.
  await Promise.all([...nextStaticAssets].map(warmAsset));
}

/** Publish a complete staging snapshot under request-visible canonical keys. */
async function publishStagedAssets() {
  const staging = await caches.open(STAGING_CACHE);
  const current = await caches.open(STATIC_CACHE);
  const stagedRequests = await staging.keys();

  const publishedRequests = await Promise.all(stagedRequests.map(async (stagedRequest) => {
    const sourceRequest = sourceRequestFromStaging(stagedRequest);
    if (!sourceRequest) throw new Error(`Invalid staging key: ${stagedRequest.url}`);

    const response = await staging.match(stagedRequest);
    if (!response) throw new Error(`Missing staged response: ${stagedRequest.url}`);
    await current.put(sourceRequest, response);
    return sourceRequest;
  }));

  // Delete only after every canonical put succeeds. A failed publication keeps
  // the synthetic snapshot intact so activation can retry idempotently.
  await caches.delete(STAGING_CACHE);
  return publishedRequests;
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    warmStaticAssets()
      .then(() => {
        console.log('[SW] Static assets staged successfully');
      })
  );
});

// Claim before exposing canonical keys: production v1.0.0 searches every cache
// globally. Once claimed, this worker can serve the complete synthetic snapshot
// while publication runs. Only then retire duplicate legacy entries; unrelated
// offline history remains available.
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    (async () => {
      // This also repairs an interrupted partial warm.
      await warmStaticAssets();
      console.log('[SW] Replacement shell staged; legacy offline caches preserved');
      await self.clients.claim();
      const publishedRequests = await publishStagedAssets();
      await Promise.all(publishedRequests.map(retireLegacyEntry));
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
