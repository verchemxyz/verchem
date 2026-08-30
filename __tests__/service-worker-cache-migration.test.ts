import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const ORIGIN = 'https://verchem.xyz'
const CURRENT_VERSION = 'verchem-v2.0.4'
const STAGING_CACHE = `${CURRENT_VERSION}-staging`
const STAGING_URL_PATH = `/.verchem-sw-staging/${CURRENT_VERSION}`
const STATIC_ASSETS = [
  '/',
  '/periodic-table',
  '/calculators',
  '/tools',
  '/compounds',
  '/solutions',
  '/tools/ph-calculator',
  '/manifest.webmanifest',
  '/logo.png',
  '/offline.html',
] as const
const STATIC_HTML_ROUTES = [
  '/',
  '/periodic-table',
  '/calculators',
  '/tools',
  '/compounds',
  '/solutions',
  '/tools/ph-calculator',
  '/offline.html',
] as const
const SHARED_CHUNK = '/_next/static/chunks/app-shell-shared.js'
const SHARED_STYLESHEET = '/_next/static/css/app-shell.css'

interface RequestLike {
  url: string
  method?: string
  mode?: string
  destination?: string
}

type FetchImplementation = (input: string | RequestLike) => Promise<Response>
type EventHandler = (event: Record<string, unknown>) => void

function requestUrl(input: string | RequestLike): string {
  return new URL(typeof input === 'string' ? input : input.url, ORIGIN).toString()
}

class MemoryCache {
  readonly entries = new Map<string, Response>()

  async match(input: string | RequestLike): Promise<Response | undefined> {
    return this.entries.get(requestUrl(input))?.clone()
  }

  async put(input: string | RequestLike, response: Response): Promise<void> {
    this.entries.set(requestUrl(input), response.clone())
  }

  async delete(input: string | RequestLike): Promise<boolean> {
    return this.entries.delete(requestUrl(input))
  }

  async keys(): Promise<Request[]> {
    return [...this.entries.keys()].map((url) => new Request(url))
  }

  async addAll(urls: string[]): Promise<void> {
    for (const url of urls) {
      await this.put(url, new Response(`cached:${url}`, { status: 200 }))
    }
  }
}

class MemoryCacheStorage {
  readonly stores = new Map<string, MemoryCache>()

  async open(name: string): Promise<MemoryCache> {
    let cache = this.stores.get(name)
    if (!cache) {
      cache = new MemoryCache()
      this.stores.set(name, cache)
    }
    return cache
  }

  async keys(): Promise<string[]> {
    return [...this.stores.keys()]
  }

  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name)
  }

  async match(input: string | RequestLike): Promise<Response | undefined> {
    for (const cache of this.stores.values()) {
      const response = await cache.match(input)
      if (response) return response
    }
    return undefined
  }
}

interface CacheEntrySnapshot {
  url: string
  status: number
  headers: Array<[string, string]>
  body: string
}

async function cacheSnapshot(cache: MemoryCache): Promise<CacheEntrySnapshot[]> {
  const snapshots = await Promise.all([...cache.entries].map(async ([url, response]) => ({
    url,
    status: response.status,
    headers: [...response.headers.entries()].sort(([left], [right]) => left.localeCompare(right)),
    body: await response.clone().text(),
  })))
  return snapshots.sort((left, right) => left.url.localeCompare(right.url))
}

const serviceWorkerSource = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
// Byte-exact production worker captured from git SHA 22dbdfa (no provenance
// comment is added to the fixture itself because that would change its bytes).
const productionWorkerSource = readFileSync(
  resolve(process.cwd(), '__tests__/fixtures/service-worker-v1.0.0-22dbdfa.js'),
  'utf8'
)
const PRODUCTION_WORKER_SHA256 = '793557ec5e54b5bcfa4b49dd20722f67875eda08af698bfc0800fb0ff0701f53'

function workerSourceFor(cacheVersion: string): string {
  assert.match(
    serviceWorkerSource,
    /const CACHE_VERSION = 'verchem-v\d+\.\d+\.\d+';/,
    'test harness could not locate the worker cache version'
  )
  return serviceWorkerSource.replace(
    /const CACHE_VERSION = 'verchem-v\d+\.\d+\.\d+';/,
    `const CACHE_VERSION = '${cacheVersion}';`
  )
}

interface WorkerHarness {
  dispatchExtendable: (type: string, data?: unknown) => Promise<void>
  dispatchFetch: (request: RequestLike) => Promise<Response | undefined>
  claimCount: () => number
  skipWaitingCount: () => number
  handlerCount: (type: string) => number
}

function createWorkerHarness(
  caches: MemoryCacheStorage,
  cacheVersion: string,
  fetchImplementation: FetchImplementation,
  onClaim?: () => void | Promise<void>,
  source = workerSourceFor(cacheVersion)
): WorkerHarness {
  const handlers = new Map<string, EventHandler[]>()
  let claims = 0
  let skipWaitingCalls = 0

  const clients = {
    claim: async () => {
      claims += 1
      await onClaim?.()
    },
    matchAll: async () => [],
    openWindow: async () => undefined,
  }
  const workerGlobal = {
    location: { origin: ORIGIN },
    clients,
    registration: { showNotification: async () => undefined },
    skipWaiting: async () => { skipWaitingCalls += 1 },
    addEventListener: (type: string, handler: EventHandler) => {
      const registered = handlers.get(type) ?? []
      registered.push(handler)
      handlers.set(type, registered)
    },
  }

  vm.runInNewContext(source, {
    self: workerGlobal,
    clients,
    caches,
    fetch: fetchImplementation,
    Request,
    Response,
    URL,
    console: { log: () => undefined, error: () => undefined },
  }, { filename: `public/sw.js (${cacheVersion})` })

  return {
    async dispatchExtendable(type, data) {
      const pending: Promise<unknown>[] = []
      const event: Record<string, unknown> = {
        data,
        waitUntil: (promise: Promise<unknown>) => { pending.push(promise) },
      }
      for (const handler of handlers.get(type) ?? []) handler(event)
      await Promise.all(pending)
    },
    async dispatchFetch(request) {
      const responses: Array<Promise<Response | undefined>> = []
      const pending: Promise<unknown>[] = []
      const event: Record<string, unknown> = {
        request,
        waitUntil: (promise: Promise<unknown>) => { pending.push(promise) },
        respondWith: (response: Promise<Response | undefined>) => {
          responses.push(response)
        },
      }
      for (const handler of handlers.get('fetch') ?? []) handler(event)
      assert.equal(responses.length, 1, 'GET request must be owned by one fetch handler')
      const response = await responses[0]
      await Promise.all(pending)
      return response
    },
    claimCount: () => claims,
    skipWaitingCount: () => skipWaitingCalls,
    handlerCount: (type) => handlers.get(type)?.length ?? 0,
  }
}

function assetRequest(pathname: string, destination = 'image'): RequestLike {
  return {
    method: 'GET',
    mode: 'same-origin',
    destination,
    url: `${ORIGIN}${pathname}`,
  }
}

function stagingKey(pathname: string): string {
  const stagingUrl = new URL(STAGING_URL_PATH, ORIGIN)
  stagingUrl.searchParams.set('source', new URL(pathname, ORIGIN).toString())
  return stagingUrl.toString()
}

function routeChunk(pathname: string): string {
  const routeName = pathname === '/'
    ? 'home'
    : pathname.slice(1).replace(/[^a-z0-9]+/gi, '-')
  return `/_next/static/chunks/${routeName}.js`
}

function routeHtml(pathname: string): string {
  return [
    '<!doctype html><html><head>',
    `<link rel="stylesheet" href="${SHARED_STYLESHEET}">`,
    `<link rel="modulepreload" href='${SHARED_CHUNK}'>`,
    '</head><body>',
    `<main data-route="${pathname}">offline-capable</main>`,
    `<script src="${routeChunk(pathname)}"></script>`,
    '</body></html>',
  ].join('')
}

function nextStaticReferences(html: string): string[] {
  const matches = html.matchAll(/(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g)
  return [...matches].map((match) => new URL(match[1]!, ORIGIN).pathname)
}

function appShellNetworkResponse(input: string | RequestLike): Response {
  const url = new URL(requestUrl(input))
  if (STATIC_HTML_ROUTES.includes(url.pathname as typeof STATIC_HTML_ROUTES[number])) {
    return new Response(routeHtml(url.pathname), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  if (url.pathname.startsWith('/_next/static/')) {
    return new Response(`network-asset:${url.pathname}`, {
      status: 200,
      headers: {
        'Content-Type': url.pathname.endsWith('.css')
          ? 'text/css'
          : 'application/javascript',
      },
    })
  }
  return new Response(`network:${url.pathname}`, { status: 200 })
}

async function verifyActivationRetiresOnlyAfterClaim(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const legacy = await caches.open('verchem-v1.0.0-dynamic')
  await legacy.put('/opened-before-upgrade', new Response('legacy-opened-page'))
  await legacy.put('/solutions', new Response('legacy-solutions'))
  await legacy.put('/logo.png', new Response('legacy-logo'))
  await legacy.put('/offline.html', new Response('legacy-offline'))

  let networkOffline = false
  const fetchImplementation: FetchImplementation = async (input) => {
    const url = new URL(requestUrl(input))
    if (networkOffline || url.pathname === '/tools/ph-calculator') {
      throw new Error('offline')
    }
    return new Response(`network:${url.pathname}`, { status: 200 })
  }
  const worker = createWorkerHarness(caches, CURRENT_VERSION, fetchImplementation, async () => {
    assert.ok(
      await legacy.match('/solutions'),
      'legacy duplicates must remain intact until clients.claim()'
    )
    assert.ok(
      await (await caches.open(STAGING_CACHE)).match(stagingKey('/solutions')),
      'the complete synthetic snapshot must exist before takeover'
    )
    assert.equal(
      await (await caches.open(`${CURRENT_VERSION}-static`)).match('/solutions'),
      undefined,
      'canonical keys must not be published before clients.claim()'
    )
  })

  await worker.dispatchExtendable('activate')
  assert.equal(worker.claimCount(), 1)
  assert.equal((await caches.keys()).includes(STAGING_CACHE), false)
  assert.ok((await caches.keys()).includes('verchem-v1.0.0-dynamic'))
  assert.equal(
    await (await caches.match('/opened-before-upgrade'))?.text(),
    'legacy-opened-page',
    'activation must preserve pages opened under the legacy worker'
  )

  const currentStatic = await caches.open(`${CURRENT_VERSION}-static`)
  assert.equal(await (await currentStatic.match('/solutions'))?.text(), 'network:/solutions')
  assert.equal(await (await currentStatic.match('/logo.png'))?.text(), 'network:/logo.png')
  assert.ok(await currentStatic.match('/tools/ph-calculator'))
  assert.equal(await legacy.match('/solutions'), undefined)
  assert.equal(await legacy.match('/logo.png'), undefined)
  assert.equal(await legacy.match('/offline.html'), undefined)

  await legacy.put('/logo.png', new Response('stale-logo-reintroduced'))
  networkOffline = true
  assert.equal(
    await (await worker.dispatchFetch(assetRequest('/logo.png')))?.text(),
    'network:/logo.png'
  )
  assert.equal(await legacy.match('/logo.png'), undefined)

  await currentStatic.delete('/tools/ph-calculator')
  await legacy.put('/solutions', new Response('stale-solutions-reintroduced'))
  const aliasResponse = await worker.dispatchFetch({
    method: 'GET',
    mode: 'navigate',
    destination: 'document',
    url: `${ORIGIN}/tools/ph-calculator`,
  })
  assert.equal(await aliasResponse?.text(), 'network:/solutions')
  assert.equal(await legacy.match('/solutions'), undefined)

  assert.equal(worker.handlerCount('message'), 1)
  await worker.dispatchExtendable('message', { type: 'SKIP_WAITING' })
  assert.equal(worker.skipWaitingCount(), 1)
}

async function verifyWaitingInstallIsAdditive(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const activeStatic = await caches.open('verchem-v2.0.2-static')
  const activeDynamic = await caches.open('verchem-v2.0.2-dynamic')
  for (const asset of STATIC_ASSETS) {
    await activeStatic.put(asset, new Response(`active:${asset}`))
  }
  await activeDynamic.put('/opened-before-update', new Response('active:history'))
  const staticBefore = await cacheSnapshot(activeStatic)
  const dynamicBefore = await cacheSnapshot(activeDynamic)

  const activeWorker = createWorkerHarness(
    caches,
    'verchem-v2.0.2',
    async () => { throw new Error('active worker is offline') }
  )
  const waitingWorker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async (input) => new Response(`waiting:${new URL(requestUrl(input)).pathname}`)
  )

  await waitingWorker.dispatchExtendable('install')
  assert.equal(waitingWorker.claimCount(), 0, 'install must leave the new worker waiting')
  assert.deepEqual(await cacheSnapshot(activeStatic), staticBefore)
  assert.deepEqual(await cacheSnapshot(activeDynamic), dynamicBefore)
  assert.equal(
    await (await activeWorker.dispatchFetch({
      method: 'GET',
      mode: 'navigate',
      destination: 'document',
      url: `${ORIGIN}/solutions`,
    }))?.text(),
    'active:/solutions',
    'a page controlled by the old worker must keep the old shell while the update waits'
  )
  assert.equal(
    await (await activeWorker.dispatchFetch(assetRequest('/logo.png')))?.text(),
    'active:/logo.png',
    'the active worker must keep serving its own version while the update waits'
  )
  assert.equal(
    await (await (await caches.open(STAGING_CACHE)).match(stagingKey('/logo.png')))?.text(),
    'waiting:/logo.png'
  )
  assert.equal(
    await (await (await caches.open(STAGING_CACHE)).match(stagingKey('/solutions')))?.text(),
    'waiting:/solutions'
  )
  assert.equal(
    (await caches.open(`${CURRENT_VERSION}-static`)).entries.size,
    0,
    'install must not expose any canonical request key'
  )
}

async function verifyFailedInstallIsIdempotent(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const activeStatic = await caches.open('verchem-v2.0.2-static')
  const activeDynamic = await caches.open('verchem-v2.0.2-dynamic')
  for (const asset of STATIC_ASSETS.filter((asset) => asset !== '/calculators')) {
    await activeStatic.put(asset, new Response(`active:${asset}`))
  }
  await activeDynamic.put('/user-offline-page', new Response('active:user-history'))
  const staticBefore = await cacheSnapshot(activeStatic)
  const dynamicBefore = await cacheSnapshot(activeDynamic)

  let failCalculators = true
  const worker = createWorkerHarness(caches, CURRENT_VERSION, async (input) => {
    const pathname = new URL(requestUrl(input)).pathname
    if (failCalculators && pathname === '/calculators') throw new Error('mid-install failure')
    return new Response(`network:${pathname}`)
  })

  await assert.rejects(worker.dispatchExtendable('install'), /mid-install failure/)
  await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
  assert.deepEqual(
    await cacheSnapshot(activeStatic),
    staticBefore,
    'failed install must preserve every active static-cache entry'
  )
  assert.deepEqual(
    await cacheSnapshot(activeDynamic),
    dynamicBefore,
    'failed install must preserve every active dynamic-cache entry'
  )

  const partial = await caches.open(STAGING_CACHE)
  assert.ok(partial.entries.size > 0 && partial.entries.size < STATIC_ASSETS.length)
  assert.equal((await caches.open(`${CURRENT_VERSION}-static`)).entries.size, 0)

  failCalculators = false
  await worker.dispatchExtendable('install')
  assert.equal(partial.entries.size, STATIC_ASSETS.length)
  assert.deepEqual(await cacheSnapshot(activeStatic), staticBefore)
  assert.deepEqual(await cacheSnapshot(activeDynamic), dynamicBefore)
  assert.equal(worker.claimCount(), 0, 'a successful retry is still additive until activation')
}

async function stagedEntrySnapshots(staging: MemoryCache): Promise<Array<{
  sourceUrl: string
  body: string
}>> {
  return Promise.all((await staging.keys()).map(async (stagedRequest) => {
    const sourceUrl = new URL(stagedRequest.url).searchParams.get('source')
    assert.ok(sourceUrl, `staging key has no source URL: ${stagedRequest.url}`)
    const response = await staging.match(stagedRequest)
    assert.ok(response, `staging key has no response: ${stagedRequest.url}`)
    return { sourceUrl, body: await response.text() }
  }))
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timed out: ${label}`)), 2_000)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}

async function verifyRecoveryRetryCannotOverwriteFreshNetworkWrite(): Promise<void> {
  await withTimeout((async () => {
    const caches = new MemoryCacheStorage()
    const staging = await caches.open(STAGING_CACHE)
    await staging.put(stagingKey('/logo.png'), new Response('staged-old'))

    const currentStatic = await caches.open(`${CURRENT_VERSION}-static`)
    const originalPut = currentStatic.put.bind(currentStatic)
    let stagedPutAttempts = 0
    let freshPutAttempts = 0

    let markFirstRecoveryPutStarted: () => void = () => undefined
    const firstRecoveryPutStarted = new Promise<void>((resolvePromise) => {
      markFirstRecoveryPutStarted = resolvePromise
    })
    let rejectFirstRecovery: () => void = () => undefined
    const firstRecoveryFailureGate = new Promise<void>((resolvePromise) => {
      rejectFirstRecovery = resolvePromise
    })

    let markFreshPutStarted: () => void = () => undefined
    const freshPutStarted = new Promise<void>((resolvePromise) => {
      markFreshPutStarted = resolvePromise
    })
    let releaseFreshPut: () => void = () => undefined
    const freshPutGate = new Promise<void>((resolvePromise) => {
      releaseFreshPut = resolvePromise
    })
    let markFreshPutStored: () => void = () => undefined
    const freshPutStored = new Promise<void>((resolvePromise) => {
      markFreshPutStored = resolvePromise
    })

    let releaseRetryStagedPut: () => void = () => undefined
    const retryStagedPutGate = new Promise<void>((resolvePromise) => {
      releaseRetryStagedPut = resolvePromise
    })

    currentStatic.put = async (input, response) => {
      const body = await response.clone().text()
      if (body === 'staged-old') {
        stagedPutAttempts += 1
        if (stagedPutAttempts === 1) {
          markFirstRecoveryPutStarted()
          await firstRecoveryFailureGate
          throw new Error('transient CacheStorage failure')
        }

        // Without writer serialization, recovery P2 reaches this put while
        // fresh writer B is paused after its earlier missing-key check.
        await retryStagedPutGate
      } else if (body === 'network-fresh-B') {
        freshPutAttempts += 1
        markFreshPutStarted()
        await freshPutGate
      }

      await originalPut(input, response)
      if (body === 'network-fresh-B') markFreshPutStored()
    }

    let markNetworkRefreshStarted: () => void = () => undefined
    const networkRefreshStarted = new Promise<void>((resolvePromise) => {
      markNetworkRefreshStarted = resolvePromise
    })
    const worker = createWorkerHarness(caches, CURRENT_VERSION, async (input) => {
      const pathname = new URL(requestUrl(input)).pathname
      if (pathname === '/logo.png') {
        markNetworkRefreshStarted()
        return new Response('network-fresh-B')
      }
      return new Response('recovery-trigger')
    })

    // P1 starts publishing staged A. The cache failure is held until the
    // stale-while-revalidate fetch has started network writer B, so B observes
    // P1 as the active recovery exactly as it does in the production race.
    const firstFetchOutcome = worker.dispatchFetch(assetRequest('/logo.png')).then(
      () => undefined,
      (error: unknown) => error
    )
    await Promise.all([firstRecoveryPutStarted, networkRefreshStarted])
    await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
    rejectFirstRecovery()

    // B is now inside its canonical write. Trigger P2 with an API fetch so the
    // second recovery overlaps B without launching another canonical writer.
    await freshPutStarted
    let observeRetryStagingRead = true
    let markRetryStagingRead: () => void = () => undefined
    const retryStagingRead = new Promise<void>((resolvePromise) => {
      markRetryStagingRead = resolvePromise
    })
    const originalStagingMatch = staging.match.bind(staging)
    staging.match = async (input) => {
      const response = await originalStagingMatch(input)
      if (observeRetryStagingRead && requestUrl(input) === stagingKey('/logo.png')) {
        observeRetryStagingRead = false
        markRetryStagingRead()
      }
      return response
    }

    const retryFetch = worker.dispatchFetch(assetRequest('/api/recover', ''))
    await retryStagingRead
    await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
    assert.ok((await caches.keys()).includes(STAGING_CACHE), 'in-flight recovery must retain staging')

    // In the broken implementation P2 is already paused in its stale put. In
    // the serialized implementation P2 is queued behind B and cannot perform
    // the canonical match until B has stored the fresh response.
    releaseFreshPut()
    await freshPutStored
    releaseRetryStagedPut()

    const [firstFailure] = await Promise.all([firstFetchOutcome, retryFetch])
    assert.match(String(firstFailure), /transient CacheStorage failure/)
    assert.equal(freshPutAttempts, 1, 'the harness must execute network writer B exactly once')
    assert.equal(
      await (await currentStatic.match('/logo.png'))?.text(),
      'network-fresh-B',
      'fresh network writer B must win after an overlapping failed recovery and retry'
    )
    assert.equal(
      stagedPutAttempts,
      1,
      'P2 must observe B under the lock instead of attempting a stale canonical put'
    )
    assert.equal(
      (await caches.keys()).includes(STAGING_CACHE),
      false,
      'completed recovery must delete its staging journal'
    )
  })(), 'recovery retry / network writer serialization')
}

async function verifyFreshNetworkWriteWinsWhenRecoveryLocksFirst(): Promise<void> {
  await withTimeout((async () => {
    const caches = new MemoryCacheStorage()
    const staging = await caches.open(STAGING_CACHE)
    await staging.put(stagingKey('/logo.png'), new Response('staged-old'))

    const currentStatic = await caches.open(`${CURRENT_VERSION}-static`)
    const originalPut = currentStatic.put.bind(currentStatic)
    let stagedPutAttempts = 0
    let freshPutAttempts = 0

    let markRetryPutStarted: () => void = () => undefined
    const retryPutStarted = new Promise<void>((resolvePromise) => {
      markRetryPutStarted = resolvePromise
    })
    let releaseRetryPut: () => void = () => undefined
    const retryPutGate = new Promise<void>((resolvePromise) => {
      releaseRetryPut = resolvePromise
    })
    let markFreshPutStored: () => void = () => undefined
    const freshPutStored = new Promise<void>((resolvePromise) => {
      markFreshPutStored = resolvePromise
    })

    currentStatic.put = async (input, response) => {
      const body = await response.clone().text()
      if (body === 'staged-old') {
        stagedPutAttempts += 1
        if (stagedPutAttempts === 1) throw new Error('transient CacheStorage failure')
        markRetryPutStarted()
        await retryPutGate
      } else if (body === 'network-fresh-B') {
        freshPutAttempts += 1
      }

      await originalPut(input, response)
      if (body === 'network-fresh-B') markFreshPutStored()
    }

    let markNetworkRefreshStarted: () => void = () => undefined
    const networkRefreshStarted = new Promise<void>((resolvePromise) => {
      markNetworkRefreshStarted = resolvePromise
    })
    const worker = createWorkerHarness(caches, CURRENT_VERSION, async (input) => {
      const pathname = new URL(requestUrl(input)).pathname
      if (pathname === '/logo.png') {
        markNetworkRefreshStarted()
        return new Response('network-fresh-B')
      }
      return new Response('recovery-trigger')
    })

    // Leave staged A behind with the same transient P1 failure as the reported
    // race, then let P2 acquire the canonical lock before writer B is queued.
    await assert.rejects(
      worker.dispatchFetch(assetRequest('/api/first-recovery', '')),
      /transient CacheStorage failure/
    )
    assert.ok((await caches.keys()).includes(STAGING_CACHE), 'failed P1 must retain staging')

    const retryFetch = worker.dispatchFetch(assetRequest('/api/retry-recovery', ''))
    await retryPutStarted

    const refreshFetch = worker.dispatchFetch(assetRequest('/logo.png'))
    await networkRefreshStarted
    await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
    assert.ok((await caches.keys()).includes(STAGING_CACHE), 'blocked P2 must retain staging')

    // P2 publishes A and releases its per-key lock; queued writer B must then
    // overwrite A with fresh bytes before the test is allowed to finish.
    releaseRetryPut()
    await Promise.all([retryFetch, refreshFetch, freshPutStored])

    assert.equal(stagedPutAttempts, 2, 'the harness must execute failed P1 and successful P2')
    assert.equal(freshPutAttempts, 1, 'the harness must execute queued network writer B once')
    assert.equal(
      await (await currentStatic.match('/logo.png'))?.text(),
      'network-fresh-B',
      'a fresh writer queued behind recovery must overwrite staged bytes'
    )
    assert.equal(
      (await caches.keys()).includes(STAGING_CACHE),
      false,
      'successful P2 must delete its completed staging journal'
    )
  })(), 'recovery-first / network writer serialization')
}

async function verifyInterruptedPublishRecoversLazily(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const legacy = await caches.open('verchem-v1.0.0-dynamic')
  await legacy.put('/logo.png', new Response('legacy-logo'))
  await legacy.put('/unrelated-history', new Response('legacy-unrelated'))

  const currentStatic = await caches.open(`${CURRENT_VERSION}-static`)
  const originalPut = currentStatic.put.bind(currentStatic)
  const putCounts = new Map<string, number>()
  let putAttempts = 0
  let claimed = false
  currentStatic.put = async (input, response) => {
    assert.equal(claimed, true, 'canonical publication must start after clients.claim()')
    const url = requestUrl(input)
    putCounts.set(url, (putCounts.get(url) ?? 0) + 1)
    putAttempts += 1
    if (putAttempts === 2) throw new Error('simulated interrupted canonical publish')
    await originalPut(input, response)
  }

  const activatingWorker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async (input) => appShellNetworkResponse(input),
    () => { claimed = true }
  )
  await activatingWorker.dispatchExtendable('install')
  await assert.rejects(
    activatingWorker.dispatchExtendable('activate'),
    /simulated interrupted canonical publish/
  )
  assert.equal(activatingWorker.claimCount(), 1, 'publication must fail after clients.claim()')
  assert.ok((await caches.keys()).includes(STAGING_CACHE), 'failed publication must retain staging')

  const staging = await caches.open(STAGING_CACHE)
  const stagedEntries = await stagedEntrySnapshots(staging)
  let missingCanonical: { sourceUrl: string; body: string } | undefined
  for (const entry of stagedEntries) {
    if (!(await currentStatic.match(entry.sourceUrl))) {
      missingCanonical = entry
      break
    }
  }
  assert.ok(missingCanonical, 'interrupted publication must leave at least one canonical key missing')
  await legacy.put(missingCanonical.sourceUrl, new Response('legacy-missing-key'))

  const freshLogoUrl = new URL('/logo.png', ORIGIN).toString()
  await currentStatic.put(freshLogoUrl, new Response('background-refresh:newer-logo'))
  const logoPutsBeforeRecovery = putCounts.get(freshLogoUrl)

  // A restarted worker does not receive activate again. Its first owned fetch
  // must both prefer the fresh canonical response and resume the journal.
  const restartedWorker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async () => { throw new Error('network is offline after restart') }
  )
  const response = await restartedWorker.dispatchFetch(assetRequest('/logo.png'))
  assert.equal(restartedWorker.claimCount(), 0, 'lazy recovery must not depend on activate replay')
  assert.equal(await response?.text(), 'background-refresh:newer-logo')
  assert.equal(
    await (await currentStatic.match(freshLogoUrl))?.text(),
    'background-refresh:newer-logo',
    'recovery must not overwrite an existing canonical response'
  )
  assert.equal(
    putCounts.get(freshLogoUrl),
    logoPutsBeforeRecovery,
    'recovery must not issue a canonical put for an existing key'
  )
  assert.equal(
    await (await currentStatic.match(missingCanonical.sourceUrl))?.text(),
    missingCanonical.body,
    'the next fetch must repair a canonical key missing after interruption'
  )
  assert.equal((await caches.keys()).includes(STAGING_CACHE), false)
  assert.equal(await legacy.match(freshLogoUrl), undefined)
  assert.equal(await legacy.match(missingCanonical.sourceUrl), undefined)
  assert.equal(await (await legacy.match('/unrelated-history'))?.text(), 'legacy-unrelated')
}

async function verifyLazyRecoveryIsSingleFlight(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const legacy = await caches.open('verchem-v1.0.0-dynamic')
  await legacy.put('/logo.png', new Response('legacy-logo'))
  await legacy.put('/unrelated-history', new Response('legacy-unrelated'))

  const installingWorker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async (input) => appShellNetworkResponse(input)
  )
  await installingWorker.dispatchExtendable('install')
  const staging = await caches.open(STAGING_CACHE)
  const stagedEntries = await stagedEntrySnapshots(staging)

  const currentStatic = await caches.open(`${CURRENT_VERSION}-static`)
  const originalPut = currentStatic.put.bind(currentStatic)
  let canonicalPutAttempts = 0
  let releaseFirstPut: () => void = () => undefined
  const firstPutGate = new Promise<void>((resolvePromise) => {
    releaseFirstPut = resolvePromise
  })
  let markFirstPutStarted: () => void = () => undefined
  const firstPutStarted = new Promise<void>((resolvePromise) => {
    markFirstPutStarted = resolvePromise
  })
  currentStatic.put = async (input, response) => {
    canonicalPutAttempts += 1
    if (canonicalPutAttempts === 1) {
      markFirstPutStarted()
      await firstPutGate
    }
    await originalPut(input, response)
  }

  const restartedWorker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async () => { throw new Error('network is offline during recovery') }
  )
  const concurrentFetches = [
    restartedWorker.dispatchFetch(assetRequest('/logo.png')),
    restartedWorker.dispatchFetch(assetRequest('/manifest.webmanifest')),
    restartedWorker.dispatchFetch(assetRequest('/offline.html')),
  ]
  await firstPutStarted
  await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
  releaseFirstPut()
  await Promise.all(concurrentFetches)

  assert.equal(
    canonicalPutAttempts,
    stagedEntries.length,
    'concurrent fetches must share one recovery instead of copying staged keys repeatedly'
  )
  assert.equal((await caches.keys()).includes(STAGING_CACHE), false)
  for (const entry of stagedEntries) {
    assert.equal(
      await (await currentStatic.match(entry.sourceUrl))?.text(),
      entry.body,
      `single-flight recovery corrupted ${entry.sourceUrl}`
    )
  }
  assert.equal(await legacy.match('/logo.png'), undefined)
  assert.equal(await (await legacy.match('/unrelated-history'))?.text(), 'legacy-unrelated')
}

async function verifyProductionWorkerCannotReadStaging(): Promise<void> {
  assert.equal(
    createHash('sha256').update(productionWorkerSource).digest('hex'),
    PRODUCTION_WORKER_SHA256,
    'the production-worker fixture no longer matches git SHA 22dbdfa byte-for-byte'
  )

  const caches = new MemoryCacheStorage()
  const productionStatic = await caches.open('verchem-v1.0.0-static')
  await productionStatic.put('/offline.html', new Response('production-v1-offline'))

  const productionWorker = createWorkerHarness(
    caches,
    'verchem-v1.0.0',
    async () => { throw new Error('production worker is offline') },
    undefined,
    productionWorkerSource
  )

  let failCalculators = true
  const replacementWorker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async (input) => {
      const pathname = new URL(requestUrl(input)).pathname
      if (failCalculators && pathname === '/calculators') {
        throw new Error('replacement partial-install failure')
      }
      return appShellNetworkResponse(input)
    }
  )

  await assert.rejects(
    replacementWorker.dispatchExtendable('install'),
    /replacement partial-install failure/
  )
  await new Promise<void>((resolvePromise) => setImmediate(resolvePromise))
  assert.ok(
    await (await caches.open(STAGING_CACHE)).match(stagingKey('/solutions')),
    'partial install must reach the synthetic /solutions key for this regression test'
  )
  assert.equal(
    await (await caches.open(`${CURRENT_VERSION}-static`)).match('/solutions'),
    undefined
  )

  const partialNavigation = await productionWorker.dispatchFetch({
    method: 'GET',
    mode: 'navigate',
    destination: 'document',
    url: `${ORIGIN}/solutions`,
  })
  assert.equal(
    await partialNavigation?.text(),
    'production-v1-offline',
    'production v1 must not see a partially staged replacement route'
  )

  failCalculators = false
  await replacementWorker.dispatchExtendable('install')
  assert.equal(replacementWorker.claimCount(), 0)
  const stagedChunk = routeChunk('/solutions')
  assert.ok(await (await caches.open(STAGING_CACHE)).match(stagingKey(stagedChunk)))

  const waitingNavigation = await productionWorker.dispatchFetch({
    method: 'GET',
    mode: 'navigate',
    destination: 'document',
    url: `${ORIGIN}/solutions`,
  })
  assert.equal(
    await waitingNavigation?.text(),
    'production-v1-offline',
    'production v1 must not see a fully staged worker before takeover'
  )
  await assert.rejects(
    productionWorker.dispatchFetch(assetRequest(stagedChunk, 'script')),
    /Network request failed/,
    'production v1 must not serve a new chunk through its global caches.match()'
  )
}

async function verifyOfflineRoutesHydrateAfterInstall(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const fetchCounts = new Map<string, number>()
  let offline = false
  const worker = createWorkerHarness(
    caches,
    CURRENT_VERSION,
    async (input) => {
      const pathname = new URL(requestUrl(input)).pathname
      fetchCounts.set(pathname, (fetchCounts.get(pathname) ?? 0) + 1)
      if (offline) throw new Error('network is offline')
      return appShellNetworkResponse(input)
    },
    async () => {
      assert.equal((await caches.open(`${CURRENT_VERSION}-static`)).entries.size, 0)
      assert.ok((await caches.open(STAGING_CACHE)).entries.size > STATIC_ASSETS.length)
    }
  )

  await worker.dispatchExtendable('install')
  assert.equal(fetchCounts.get(SHARED_CHUNK), 1, 'modulepreload must be deduplicated across routes')
  assert.equal(fetchCounts.get(SHARED_STYLESHEET), 1, 'stylesheet must be deduplicated across routes')

  offline = true
  await worker.dispatchExtendable('activate')
  assert.equal(worker.claimCount(), 1)
  assert.equal((await caches.keys()).includes(STAGING_CACHE), false)

  const currentStatic = await caches.open(`${CURRENT_VERSION}-static`)
  for (const route of STATIC_HTML_ROUTES) {
    for (const reference of [SHARED_STYLESHEET, SHARED_CHUNK, routeChunk(route)]) {
      assert.ok(
        await currentStatic.match(reference),
        `${route} is missing its offline hydration asset ${reference}`
      )
    }
  }

  for (const route of ['/solutions', '/periodic-table']) {
    const navigation = await worker.dispatchFetch({
      method: 'GET',
      mode: 'navigate',
      destination: 'document',
      url: `${ORIGIN}${route}`,
    })
    assert.ok(navigation, `${route} offline navigation returned no response`)
    const references = nextStaticReferences(await navigation.text())
    assert.deepEqual(
      new Set(references),
      new Set([SHARED_STYLESHEET, SHARED_CHUNK, routeChunk(route)]),
      `${route} HTML fixture must contain real Next.js JS/CSS references`
    )

    for (const reference of references) {
      const response = await worker.dispatchFetch(
        assetRequest(reference, reference.endsWith('.css') ? 'style' : 'script')
      )
      assert.equal(
        await response?.text(),
        `network-asset:${reference}`,
        `${route} could not hydrate ${reference} from cache while offline`
      )
    }
  }
}

async function verifyOlderWorkerCannotReadNewerCache(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const oldest = await caches.open('verchem-v1.9.9-static')
  const newer = await caches.open('verchem-v2.0.3-static')
  const closestOlder = await caches.open('verchem-v2.0.1-dynamic')
  await caches.open('verchem-v2.0.2-static')
  await oldest.put('/history.js', new Response('oldest'))
  await newer.put('/history.js', new Response('newer-must-not-leak'))
  await closestOlder.put('/history.js', new Response('closest-older'))

  const oldWorker = createWorkerHarness(
    caches,
    'verchem-v2.0.2',
    async () => { throw new Error('offline') }
  )
  assert.equal(
    await (await oldWorker.dispatchFetch(assetRequest('/history.js', 'script')))?.text(),
    'closest-older',
    'legacy fallback must be semver-sorted and exclude caches newer than the worker'
  )
  assert.equal(await (await newer.match('/history.js'))?.text(), 'newer-must-not-leak')
}

async function run(): Promise<void> {
  assert.match(serviceWorkerSource, /const CACHE_VERSION = 'verchem-v2\.0\.4';/)
  await verifyActivationRetiresOnlyAfterClaim()
  await verifyWaitingInstallIsAdditive()
  await verifyFailedInstallIsIdempotent()
  await verifyRecoveryRetryCannotOverwriteFreshNetworkWrite()
  await verifyFreshNetworkWriteWinsWhenRecoveryLocksFirst()
  await verifyInterruptedPublishRecoversLazily()
  await verifyLazyRecoveryIsSingleFlight()
  await verifyProductionWorkerCannotReadStaging()
  await verifyOfflineRoutesHydrateAfterInstall()
  await verifyOlderWorkerCannotReadNewerCache()
  console.log('Service-worker cache migration behavioral tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
