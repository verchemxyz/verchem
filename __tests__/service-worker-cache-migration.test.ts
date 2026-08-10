import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const ORIGIN = 'https://verchem.xyz'
const CURRENT_VERSION = 'verchem-v2.0.3'
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
] as const

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
  onClaim?: () => void | Promise<void>
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

  vm.runInNewContext(workerSourceFor(cacheVersion), {
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
      const event: Record<string, unknown> = {
        request,
        respondWith: (response: Promise<Response | undefined>) => {
          responses.push(response)
        },
      }
      for (const handler of handlers.get('fetch') ?? []) handler(event)
      assert.equal(responses.length, 1, 'GET request must be owned by one fetch handler')
      return responses[0]
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
  })

  await worker.dispatchExtendable('activate')
  assert.equal(worker.claimCount(), 1)
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
    await (await (await caches.open(`${CURRENT_VERSION}-static`)).match('/logo.png'))?.text(),
    'waiting:/logo.png'
  )
  assert.equal(
    await (await (await caches.open(`${CURRENT_VERSION}-static`)).match('/solutions'))?.text(),
    'waiting:/solutions'
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

  const partial = await caches.open(`${CURRENT_VERSION}-static`)
  assert.ok(partial.entries.size > 0 && partial.entries.size < STATIC_ASSETS.length)

  failCalculators = false
  await worker.dispatchExtendable('install')
  assert.equal(partial.entries.size, STATIC_ASSETS.length)
  assert.deepEqual(await cacheSnapshot(activeStatic), staticBefore)
  assert.deepEqual(await cacheSnapshot(activeDynamic), dynamicBefore)
  assert.equal(worker.claimCount(), 0, 'a successful retry is still additive until activation')
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
  assert.match(serviceWorkerSource, /const CACHE_VERSION = 'verchem-v2\.0\.3';/)
  await verifyActivationRetiresOnlyAfterClaim()
  await verifyWaitingInstallIsAdditive()
  await verifyFailedInstallIsIdempotent()
  await verifyOlderWorkerCannotReadNewerCache()
  console.log('Service-worker cache migration behavioral tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
