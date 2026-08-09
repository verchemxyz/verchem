import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const ORIGIN = 'https://verchem.xyz'

interface RequestLike {
  url: string
}

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

type EventHandler = (event: Record<string, unknown>) => void

async function run(): Promise<void> {
  const caches = new MemoryCacheStorage()
  const legacy = await caches.open('verchem-v1.0.0-dynamic')
  await legacy.put('/opened-before-upgrade', new Response('legacy-opened-page'))
  await legacy.put('/solutions', new Response('legacy-solutions'))
  await legacy.put('/offline.html', new Response('legacy-offline'))

  const handlers = new Map<string, EventHandler[]>()
  let skipWaitingCalls = 0
  let claimCalls = 0
  let networkOffline = false

  const clients = {
    claim: async () => { claimCalls += 1 },
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

  const fakeFetch = async (input: string | RequestLike): Promise<Response> => {
    const url = new URL(requestUrl(input))
    if (networkOffline || url.pathname === '/tools/ph-calculator') {
      throw new Error('offline')
    }
    return new Response(`network:${url.pathname}`, { status: 200 })
  }

  const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
  vm.runInNewContext(source, {
    self: workerGlobal,
    clients,
    caches,
    fetch: fakeFetch,
    Request,
    Response,
    URL,
    console: { log: () => undefined, error: () => undefined },
  }, { filename: 'public/sw.js' })

  async function dispatchExtendable(type: string, data?: unknown): Promise<void> {
    const pending: Promise<unknown>[] = []
    const event: Record<string, unknown> = {
      data,
      waitUntil: (promise: Promise<unknown>) => { pending.push(promise) },
    }
    for (const handler of handlers.get(type) ?? []) handler(event)
    await Promise.all(pending)
  }

  await dispatchExtendable('activate')
  assert.equal(claimCalls, 1)
  assert.ok((await caches.keys()).includes('verchem-v1.0.0-dynamic'))
  assert.equal(
    await (await caches.match('/opened-before-upgrade'))?.text(),
    'legacy-opened-page',
    'activation must preserve pages opened under the legacy worker'
  )

  const currentStatic = await caches.open('verchem-v2.0.1-static')
  assert.ok(await currentStatic.match('/solutions'))
  assert.ok(await currentStatic.match('/tools/ph-calculator'))

  // Exercise the actual navigation handler: if the alias entry is unavailable,
  // an offline legacy bookmark maps to the cached canonical /solutions page.
  await currentStatic.delete('/tools/ph-calculator')
  networkOffline = true
  const navigationResponses: Array<Promise<Response | undefined>> = []
  const navigationEvent: Record<string, unknown> = {
    request: {
      method: 'GET',
      mode: 'navigate',
      destination: 'document',
      url: `${ORIGIN}/tools/ph-calculator`,
    },
    respondWith: (response: Promise<Response | undefined>) => {
      navigationResponses.push(response)
    },
  }
  for (const handler of handlers.get('fetch') ?? []) handler(navigationEvent)
  const navigationResponse = navigationResponses[0]
  assert.ok(navigationResponse)
  assert.equal(await (await navigationResponse)?.text(), 'legacy-solutions')

  assert.equal(handlers.get('message')?.length, 1, 'only one message listener may own SKIP_WAITING')
  await dispatchExtendable('message', { type: 'SKIP_WAITING' })
  assert.equal(skipWaitingCalls, 1)

  console.log('Service-worker cache migration behavioral tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
