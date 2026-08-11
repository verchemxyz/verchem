/**
 * AIVerID logout revocation contracts.
 *
 * Exercises the real route with a signed session cookie and a mocked hub: both
 * bearer tokens are revoked independently, no client secret leaves VerChem,
 * and local cookies are always cleared even when revocation fails.
 */

import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/logout/route'
import {
  AUTH_COOKIE,
  SESSION_COOKIE,
  SESSION_SIG_COOKIE,
} from '@/lib/auth/cookie-config'
import { sealOAuthTokens } from '@/lib/auth/oauth-token-seal'

type TestFn = () => Promise<void>
interface TestCase { name: string; fn: TestFn }
interface FetchCall {
  url: string
  init?: RequestInit
}

const tests: TestCase[] = []
const TEST_SECRET = 'logout-revoke-test-secret'
const REVOKE_URL = 'https://aiverid-backend-production.up.railway.app/oauth/revoke'
const CLIENT_ID = 'aiv_verchem_production_2025'

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

async function signSession(value: string): Promise<string> {
  const encoded = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoded.encode(TEST_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoded.encode(value))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function signedLogoutRequest(oauthTokens?: unknown) {
  const session = JSON.stringify({
    user: { id: 'TH-TEST-001', aiverid: 'TH-TEST-001' },
    ...(oauthTokens !== undefined ? { oauth_tokens: oauthTokens } : {}),
    expires_at: '2099-01-01T00:00:00.000Z',
  })
  const signature = await signSession(session)
  return new NextRequest('https://verchem.xyz/api/auth/logout', {
    method: 'POST',
    headers: {
      cookie: [
        `${SESSION_COOKIE}=${encodeURIComponent(session)}`,
        `${SESSION_SIG_COOKIE}=${signature}`,
      ].join('; '),
    },
  })
}

async function logoutRequest(tokens?: { access_token: string; refresh_token?: string }) {
  const sealedTokens = tokens ? await sealOAuthTokens(tokens) : undefined
  return signedLogoutRequest(sealedTokens)
}

function fetchUrl(input: string | URL | Request): string {
  return input instanceof Request ? input.url : input.toString()
}

function revokeBody(call: FetchCall): Record<string, unknown> {
  const body = call.init?.body
  assert.equal(typeof body, 'string')
  const parsed: unknown = JSON.parse(body as string)
  assert.ok(typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed))
  return parsed as Record<string, unknown>
}

function assertCookiesCleared(response: Response) {
  const headers = response.headers.getSetCookie()
  for (const name of [SESSION_COOKIE, SESSION_SIG_COOKIE, AUTH_COOKIE]) {
    assert.ok(
      headers.some((header) => header.startsWith(`${name}=`) && header.includes('Max-Age=0')),
      `${name} must be expired`
    )
  }
}

async function withMockFetch(
  implementation: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
  fn: () => Promise<void>
) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = implementation
  try {
    await fn()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('revokes access + refresh independently with the RFC payload and no client_secret', async () => {
  const calls: FetchCall[] = []
  await withMockFetch(async (input, init) => {
    calls.push({ url: fetchUrl(input), init })
    return Response.json({}, { status: 200 })
  }, async () => {
    const response = await POST(await logoutRequest({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    }))

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { success: true })
    assert.equal(calls.length, 2)
    assert.deepEqual(
      calls.map((call) => revokeBody(call).token),
      ['access-token', 'refresh-token']
    )

    for (const call of calls) {
      assert.equal(call.url, REVOKE_URL)
      assert.equal(call.init?.method, 'POST')
      assert.equal(new Headers(call.init?.headers).get('content-type'), 'application/json')
      assert.ok(call.init?.signal instanceof AbortSignal, 'each revoke must have a timeout signal')

      const body = revokeBody(call)
      assert.equal(body.client_id, CLIENT_ID)
      assert.deepEqual(Object.keys(body).sort(), ['client_id', 'token'])
      assert.equal('client_secret' in body, false)
    }
    assertCookiesCleared(response)
  })
})

test('clears local cookies and succeeds even when every hub revoke rejects', async () => {
  const calls: FetchCall[] = []
  const originalWarn = console.warn
  console.warn = () => undefined
  try {
    await withMockFetch(async (input, init) => {
      calls.push({ url: fetchUrl(input), init })
      throw new Error('hub unavailable')
    }, async () => {
      const response = await POST(await logoutRequest({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }))

      assert.equal(calls.length, 2, 'Promise.allSettled must attempt both tokens')
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { success: true })
      assertCookiesCleared(response)
    })
  } finally {
    console.warn = originalWarn
  }
})

test('revokes only the access token when no refresh token is stored', async () => {
  const calls: FetchCall[] = []
  await withMockFetch(async (input, init) => {
    calls.push({ url: fetchUrl(input), init })
    return Response.json({}, { status: 200 })
  }, async () => {
    const response = await POST(await logoutRequest({ access_token: 'access-only' }))
    assert.equal(calls.length, 1)
    assert.equal(revokeBody(calls[0]).token, 'access-only')
    assertCookiesCleared(response)
  })
})

test('legacy token-less sessions still clear locally without a hub call', async () => {
  const calls: FetchCall[] = []
  await withMockFetch(async (input, init) => {
    calls.push({ url: fetchUrl(input), init })
    return Response.json({}, { status: 200 })
  }, async () => {
    const response = await POST(await logoutRequest())
    assert.equal(calls.length, 0)
    assert.equal(response.status, 200)
    assertCookiesCleared(response)
  })
})

test('a tampered token seal is treated as token-less and cookies still clear', async () => {
  const calls: FetchCall[] = []
  await withMockFetch(async (input, init) => {
    calls.push({ url: fetchUrl(input), init })
    return Response.json({}, { status: 200 })
  }, async () => {
    const sealed = await sealOAuthTokens({ access_token: 'never-revoked-from-corrupt-blob' })
    const index = Math.floor(sealed.length / 2)
    const replacement = sealed[index] === 'A' ? 'B' : 'A'
    const tampered = `${sealed.slice(0, index)}${replacement}${sealed.slice(index + 1)}`
    const response = await POST(await signedLogoutRequest(tampered))

    assert.equal(calls.length, 0)
    assert.equal(response.status, 200)
    assertCookiesCleared(response)
  })
})

async function runTests() {
  const originalSecret = process.env.SESSION_SECRET
  process.env.SESSION_SECRET = TEST_SECRET
  let passed = 0
  let failed = 0

  try {
    for (const { name, fn } of tests) {
      try {
        await fn()
        passed++
        console.log(`  ✅ ${name}`)
      } catch (error) {
        failed++
        console.error(`  ❌ ${name}`)
        console.error('    ', error instanceof Error ? error.message : error)
      }
    }
  } finally {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET
    else process.env.SESSION_SECRET = originalSecret
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

console.log('Logout Revoke Tests')
runTests().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
