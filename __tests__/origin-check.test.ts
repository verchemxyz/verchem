/**
 * Origin/Referer validation tests
 *
 * Note: We inline the function here to avoid the `server-only` import
 * which is unavailable in the standalone Node test runner.
 */

import assert from 'node:assert/strict'

// --- Inline function under test ---

function isValidOrigin(
  request: {
    headers: { get: (name: string) => string | null }
    nextUrl: { origin: string }
  }
): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  if (!host) return false

  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  const expectedOrigin = `${protocol}://${host}`

  if (origin) return origin === expectedOrigin
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin
    } catch {
      return false
    }
  }
  return false
}

// --- Helpers ---

function makeRequest(
  headers: Record<string, string>
): Parameters<typeof isValidOrigin>[0] {
  return {
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    nextUrl: { origin: 'http://localhost:3000' },
  }
}

function makeRequestWithProto(
  headers: Record<string, string>
): Parameters<typeof isValidOrigin>[0] {
  return makeRequest({ 'x-forwarded-proto': 'http', ...headers })
}

type TestFn = () => void | Promise<void>
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function runTests() {
  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      const result = fn()
      if (result instanceof Promise) {
        throw new Error('Async tests not supported in this runner')
      }
      passed++
      console.log(`  ✅ ${name}`)
    } catch (err) {
      failed++
      console.error(`  ❌ ${name}`)
      console.error('    ', (err as Error).message)
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

// --- Tests ---

test('Accept request with matching Origin header', () => {
  const req = makeRequestWithProto({ origin: 'http://localhost:3000', host: 'localhost:3000' })
  assert.equal(isValidOrigin(req), true)
})

test('Reject request with mismatched Origin header', () => {
  const req = makeRequestWithProto({ origin: 'https://evil.com', host: 'localhost:3000' })
  assert.equal(isValidOrigin(req), false)
})

test('Fallback to Referer if Origin missing — accept if matches', () => {
  const req = makeRequestWithProto({ referer: 'http://localhost:3000/draw', host: 'localhost:3000' })
  assert.equal(isValidOrigin(req), true)
})

test('Reject if Referer host mismatches', () => {
  const req = makeRequestWithProto({ referer: 'https://evil.com/phishing', host: 'localhost:3000' })
  assert.equal(isValidOrigin(req), false)
})

test('Reject malformed Referer URL', () => {
  const req = makeRequestWithProto({ referer: 'not-a-url', host: 'localhost:3000' })
  assert.equal(isValidOrigin(req), false)
})

test('Reject if both Origin and Referer missing', () => {
  const req = makeRequestWithProto({ host: 'localhost:3000' })
  assert.equal(isValidOrigin(req), false)
})

test('Prefer Origin over Referer when both present', () => {
  const req = makeRequestWithProto({
    origin: 'http://localhost:3000',
    referer: 'https://evil.com',
    host: 'localhost:3000',
  })
  assert.equal(isValidOrigin(req), true)
})

test('Reject when Origin bad even with good Referer', () => {
  const req = makeRequestWithProto({
    origin: 'https://evil.com',
    referer: 'http://localhost:3000/draw',
    host: 'localhost:3000',
  })
  assert.equal(isValidOrigin(req), false)
})

// Run
console.log('Origin Check Tests')
runTests()
