/**
 * OAuth token confidentiality and session forwarding regressions.
 */

import assert from 'node:assert/strict'
import { NextRequest, NextResponse } from 'next/server'
import { GET as getAuthSession } from '@/app/api/auth/session/route'
import {
  SESSION_COOKIE,
  SESSION_COOKIE_SIZE_LIMIT_BYTES,
  SESSION_SIG_COOKIE,
  sessionWriteOptions,
} from '@/lib/auth/cookie-config'
import {
  prepareSessionCookie,
  sealOAuthTokens,
  unsealOAuthTokens,
} from '@/lib/auth/oauth-token-seal'

type TestFn = () => Promise<void>
interface TestCase { name: string; fn: TestFn }
interface FetchCall { url: string; init?: RequestInit }

const tests: TestCase[] = []
const TEST_SECRET = 'oauth-token-seal-test-secret-with-sufficient-entropy'
const ACCESS_TOKEN = 'raw-access-token-MUST-NOT-APPEAR'
const REFRESH_TOKEN = 'raw-refresh-token-MUST-NOT-APPEAR'
const baseSession = {
  user: {
    id: 'TH-SEAL-001',
    aiverid: 'TH-SEAL-001',
    name: 'Seal Test',
    subscription_tier: 'free',
  },
  expires_at: '2099-01-01T00:00:00.000Z',
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function sessionSetCookie(sessionString: string): string {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, sessionString, sessionWriteOptions())
  const header = response.headers.getSetCookie()
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
  assert.ok(header)
  return header
}

async function withoutWarnings<T>(fn: () => Promise<T>): Promise<T> {
  const originalWarn = console.warn
  console.warn = () => undefined
  try {
    return await fn()
  } finally {
    console.warn = originalWarn
  }
}

test('AES-256-GCM seal/unseal roundtrip returns both bearer tokens', async () => {
  const sealed = await sealOAuthTokens({
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
  })
  assert.equal(sealed.includes(ACCESS_TOKEN), false)
  assert.equal(sealed.includes(REFRESH_TOKEN), false)
  assert.deepEqual(await unsealOAuthTokens(sealed), {
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
  })
})

test('changing one byte of the authenticated blob returns no token', async () => {
  const sealed = await sealOAuthTokens({ access_token: ACCESS_TOKEN })
  const index = Math.floor(sealed.length / 2)
  const replacement = sealed[index] === 'A' ? 'B' : 'A'
  const tampered = `${sealed.slice(0, index)}${replacement}${sealed.slice(index + 1)}`
  assert.equal(await unsealOAuthTokens(tampered), null)
})

test('real Set-Cookie serialization contains neither raw access nor refresh token', async () => {
  const prepared = await prepareSessionCookie(baseSession, {
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
  })
  const parsed = JSON.parse(prepared.sessionString) as Record<string, unknown>
  assert.equal(typeof parsed.oauth_tokens, 'string')
  const setCookie = sessionSetCookie(prepared.sessionString)

  assert.equal(setCookie.includes(ACCESS_TOKEN), false)
  assert.equal(setCookie.includes(REFRESH_TOKEN), false)
  assert.ok(new TextEncoder().encode(setCookie).byteLength <= SESSION_COOKIE_SIZE_LIMIT_BYTES)
})

test('size guard first omits refresh token while retaining sealed access token', async () => {
  const prepared = await withoutWarnings(() => prepareSessionCookie(baseSession, {
    access_token: 'access-kept',
    refresh_token: 'r'.repeat(5_000),
  }))
  assert.equal(prepared.tokenStorage, 'access-only')
  const parsed = JSON.parse(prepared.sessionString) as Record<string, unknown>
  assert.equal(typeof parsed.oauth_tokens, 'string')
  assert.deepEqual(await unsealOAuthTokens(parsed.oauth_tokens as string), {
    access_token: 'access-kept',
  })
  assert.ok(
    new TextEncoder().encode(sessionSetCookie(prepared.sessionString)).byteLength
      <= SESSION_COOKIE_SIZE_LIMIT_BYTES
  )
})

test('size guard then omits all OAuth tokens without breaking the login session', async () => {
  const prepared = await withoutWarnings(() => prepareSessionCookie(baseSession, {
    access_token: 'a'.repeat(5_000),
    refresh_token: 'r'.repeat(5_000),
  }))
  assert.equal(prepared.tokenStorage, 'none')
  const parsed = JSON.parse(prepared.sessionString) as Record<string, unknown>
  assert.equal('oauth_tokens' in parsed, false)
  assert.deepEqual(parsed.user, baseSession.user)
  assert.equal(parsed.expires_at, baseSession.expires_at)
})

test('/api/auth/session forwards only the signed session cookies', async () => {
  const calls: FetchCall[] = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString()
    calls.push({ url, init })
    return Response.json({ user: baseSession.user, expires_at: baseSession.expires_at })
  }

  try {
    const request = new NextRequest('https://verchem.xyz/api/auth/session', {
      headers: {
        cookie: [
          `${SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(baseSession))}`,
          `${SESSION_SIG_COOKIE}=test-signature`,
          `unrelated=${ACCESS_TOKEN}`,
          `sibling-credential=${REFRESH_TOKEN}`,
        ].join('; '),
      },
    })
    const response = await getAuthSession(request)
    assert.equal(response.status, 200)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://verchem.xyz/api/session')

    const forwarded = new Headers(calls[0].init?.headers).get('cookie')
    assert.ok(forwarded)
    assert.deepEqual(
      forwarded.split('; ').map((part) => part.split('=')[0]),
      [SESSION_COOKIE, SESSION_SIG_COOKIE]
    )
    assert.equal(forwarded.includes(ACCESS_TOKEN), false)
    assert.equal(forwarded.includes(REFRESH_TOKEN), false)
    assert.equal(forwarded.includes('unrelated='), false)
    assert.equal(forwarded.includes('sibling-credential='), false)
  } finally {
    globalThis.fetch = originalFetch
  }
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

console.log('OAuth Token Seal Tests')
runTests().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
