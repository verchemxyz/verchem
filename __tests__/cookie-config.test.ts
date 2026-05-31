/**
 * Session cookie config tests — guards the prod login-loop regression.
 *
 * The bug: the OAuth callback SET cookies with `domain: .verchem.xyz`, but
 * proxy.ts CLEARED them with `cookies.delete(name)` (no domain). A Set-Cookie
 * deletion only removes a cookie when name+domain+path match, so the stale
 * cookie survived → every protected click re-failed → inescapable redirect loop.
 *
 * Invariant under test: the domain/path used to SET == the domain/path used to
 * CLEAR, and clearSessionCookies actually expires all three cookies with the
 * matching domain.
 */

import assert from 'node:assert/strict'
import { NextResponse } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_SIG_COOKIE,
  AUTH_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieDomain,
  sessionWriteOptions,
  authIndicatorWriteOptions,
  sessionClearOptions,
  clearSessionCookies,
} from '@/lib/auth/cookie-config'

type TestFn = () => void
interface TestCase { name: string; fn: TestFn }
const tests: TestCase[] = []
function test(name: string, fn: TestFn) { tests.push({ name, fn }) }

// Run each test with a clean, restored process.env for the keys we touch.
function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const keys = ['NODE_ENV', 'SESSION_COOKIE_DOMAIN']
  const saved: Record<string, string | undefined> = {}
  for (const k of keys) saved[k] = process.env[k]
  try {
    for (const k of keys) {
      if (k in env) {
        if (env[k] === undefined) delete process.env[k]
        else process.env[k] = env[k]
      }
    }
    fn()
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  }
}

// Pull the value of `Attr` from a Set-Cookie header string, or null if absent.
function attr(setCookie: string, name: string): string | null {
  const re = new RegExp(`(?:^|; )${name}=([^;]*)`, 'i')
  const m = setCookie.match(re)
  return m ? m[1] : null
}
function hasFlag(setCookie: string, name: string): boolean {
  return new RegExp(`(?:^|; )${name}(?:;|=|$)`, 'i').test(setCookie)
}

function runTests() {
  let passed = 0, failed = 0
  for (const { name, fn } of tests) {
    try { fn(); passed++; console.log(`  ✅ ${name}`) }
    catch (err) { failed++; console.error(`  ❌ ${name}`); console.error('    ', (err as Error).message) }
  }
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

// --- domain resolution ---

test('dev (no NODE_ENV=production) → no cookie domain (host-only)', () => {
  withEnv({ NODE_ENV: 'development', SESSION_COOKIE_DOMAIN: undefined }, () => {
    assert.equal(sessionCookieDomain(), undefined)
  })
})

test('production default → .verchem.xyz (shares apex + www)', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: undefined }, () => {
    assert.equal(sessionCookieDomain(), '.verchem.xyz')
  })
})

test('SESSION_COOKIE_DOMAIN overrides the default', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: '.preview.example.com' }, () => {
    assert.equal(sessionCookieDomain(), '.preview.example.com')
  })
})

test('blank SESSION_COOKIE_DOMAIN is ignored (falls back to default)', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: '   ' }, () => {
    assert.equal(sessionCookieDomain(), '.verchem.xyz')
  })
})

// --- THE invariant: set domain/path === clear domain/path ---

test('REGRESSION: set options and clear options share domain + path (prod)', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: undefined }, () => {
    const set = sessionWriteOptions()
    const clear = sessionClearOptions()
    assert.equal(set.domain, clear.domain, 'set/clear domain MUST match or delete is a no-op')
    assert.equal(set.path, clear.path, 'set/clear path MUST match')
    assert.equal(set.domain, '.verchem.xyz')
    assert.equal(clear.maxAge, 0, 'clear must expire the cookie')
    assert.equal(set.maxAge, SESSION_TTL_SECONDS)
  })
})

test('set/clear share domain under env override too', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: '.verchem.app' }, () => {
    assert.equal(sessionWriteOptions().domain, sessionClearOptions().domain)
    assert.equal(sessionClearOptions().domain, '.verchem.app')
  })
})

test('auth indicator is readable by client JS (httpOnly false) but same scope', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: undefined }, () => {
    const auth = authIndicatorWriteOptions()
    assert.equal(auth.httpOnly, false)
    assert.equal(auth.domain, sessionWriteOptions().domain)
    assert.equal(auth.path, '/')
  })
})

// --- clearSessionCookies emits real, matching Set-Cookie deletions ---

test('clearSessionCookies expires all 3 cookies with matching domain (prod)', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: undefined }, () => {
    const res = NextResponse.json({ ok: true })
    clearSessionCookies(res)
    const headers = res.headers.getSetCookie()
    assert.equal(headers.length, 3, 'should clear exactly 3 cookies')

    for (const cookieName of [SESSION_COOKIE, SESSION_SIG_COOKIE, AUTH_COOKIE]) {
      const h = headers.find((x) => x.startsWith(`${cookieName}=`))
      assert.ok(h, `missing Set-Cookie for ${cookieName}`)
      assert.equal(attr(h!, 'Domain'), '.verchem.xyz', `${cookieName} must clear with the set domain`)
      assert.equal(attr(h!, 'Path'), '/', `${cookieName} path`)
      assert.equal(attr(h!, 'Max-Age'), '0', `${cookieName} must be expired`)
    }
  })
})

test('clearSessionCookies in dev has no Domain attr (host-only delete works)', () => {
  withEnv({ NODE_ENV: 'development', SESSION_COOKIE_DOMAIN: undefined }, () => {
    const res = NextResponse.json({ ok: true })
    clearSessionCookies(res)
    const headers = res.headers.getSetCookie()
    for (const h of headers) {
      assert.equal(attr(h, 'Domain'), null, 'dev deletions must be host-only (no Domain)')
      assert.equal(attr(h, 'Max-Age'), '0')
    }
  })
})

test('verchem-auth cleared without HttpOnly (client could have set it)', () => {
  withEnv({ NODE_ENV: 'production', SESSION_COOKIE_DOMAIN: undefined }, () => {
    const res = NextResponse.json({ ok: true })
    clearSessionCookies(res)
    const headers = res.headers.getSetCookie()
    const authHeader = headers.find((x) => x.startsWith(`${AUTH_COOKIE}=`))!
    assert.equal(hasFlag(authHeader, 'HttpOnly'), false, 'auth indicator clear must not be HttpOnly')
    const sessionHeader = headers.find((x) => x.startsWith(`${SESSION_COOKIE}=`))!
    assert.equal(hasFlag(sessionHeader, 'HttpOnly'), true, 'session clear should keep HttpOnly')
  })
})

console.log('Session Cookie Config Tests')
runTests()
