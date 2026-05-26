/**
 * VerChem Answer Card — W3 Day 3 Tier Daily Rate-Limit Tests
 *
 * Coverage: per-tier daily quota, 429 block, unlimited tiers, remaining decrement,
 * per-user isolation, unknown-tier fallback.
 */
import assert from 'node:assert/strict'
import { checkRateLimit, answerCardDailyConfig, ANSWER_CARD_DAILY_LIMITS } from '@/lib/rate-limit'

type TestFn = () => void | Promise<void>
const tests: { name: string; fn: TestFn }[] = []
function describe(_n: string, fn: () => void) { fn() }
function test(name: string, fn: TestFn) { tests.push({ name, fn }) }
function expect(actual: unknown) {
  return {
    toBe(e: unknown) { assert.equal(actual, e) },
    toBeGreaterThan(e: number) { assert.ok(typeof actual === 'number' && actual > e, `expected ${actual} > ${e}`) },
  }
}

describe('Day 3 tier daily limits', () => {
  test('free = 20/day', () => { expect(ANSWER_CARD_DAILY_LIMITS.free).toBe(20) })
  test('student = 100/day', () => { expect(ANSWER_CARD_DAILY_LIMITS.student).toBe(100) })
  test('professional = unlimited', () => { expect(Number.isFinite(ANSWER_CARD_DAILY_LIMITS.professional)).toBe(false) })
  test('enterprise = unlimited', () => { expect(Number.isFinite(ANSWER_CARD_DAILY_LIMITS.enterprise)).toBe(false) })

  test('answerCardDailyConfig free → maxRequests 20, windowMs 24h', () => {
    const c = answerCardDailyConfig('free')
    expect(c.maxRequests).toBe(20)
    expect(c.windowMs).toBe(86400000)
  })

  test('unknown tier falls back to free (20)', () => {
    expect(answerCardDailyConfig('bogus' as never).maxRequests).toBe(20)
  })

  test('free: 20 succeed, 21st blocked (429 semantics)', () => {
    const key = 'test-free-' + Math.random()
    const cfg = answerCardDailyConfig('free')
    for (let i = 0; i < 20; i++) expect(checkRateLimit(key, cfg).success).toBe(true)
    const blocked = checkRateLimit(key, cfg)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfter ?? 0).toBeGreaterThan(0)
  })

  test('student: 100 succeed, 101st blocked', () => {
    const key = 'test-student-' + Math.random()
    const cfg = answerCardDailyConfig('student')
    for (let i = 0; i < 100; i++) checkRateLimit(key, cfg)
    expect(checkRateLimit(key, cfg).success).toBe(false)
  })

  test('professional: 500 requests all succeed (unlimited)', () => {
    const key = 'test-pro-' + Math.random()
    const cfg = answerCardDailyConfig('professional')
    for (let i = 0; i < 500; i++) expect(checkRateLimit(key, cfg).success).toBe(true)
  })

  test('unlimited never stored → remaining stays Infinity', () => {
    const key = 'test-pro2-' + Math.random()
    const cfg = answerCardDailyConfig('professional')
    expect(Number.isFinite(checkRateLimit(key, cfg).remaining)).toBe(false)
  })

  test('free: remaining decrements 19, 18', () => {
    const key = 'test-rem-' + Math.random()
    const cfg = answerCardDailyConfig('free')
    expect(checkRateLimit(key, cfg).remaining).toBe(19)
    expect(checkRateLimit(key, cfg).remaining).toBe(18)
  })

  test('per-user isolation: one user exhausting does not affect another', () => {
    const cfg = answerCardDailyConfig('free')
    const a = 'test-userA-' + Math.random()
    const b = 'test-userB-' + Math.random()
    for (let i = 0; i < 20; i++) checkRateLimit(a, cfg)
    expect(checkRateLimit(a, cfg).success).toBe(false)
    expect(checkRateLimit(b, cfg).success).toBe(true)
  })

  test('F17: prototype-pollution tier keys fall back to free (no unlimited bypass)', () => {
    for (const evil of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      expect(answerCardDailyConfig(evil as never).maxRequests).toBe(20)
    }
  })

  test('F17: polluted-key tier is actually rate-limited (21st blocked)', () => {
    const key = 'test-proto-' + Math.random()
    const cfg = answerCardDailyConfig('constructor' as never)
    for (let i = 0; i < 20; i++) expect(checkRateLimit(key, cfg).success).toBe(true)
    expect(checkRateLimit(key, cfg).success).toBe(false)
  })
})

async function runTests() {
  console.log('🧪 VerChem Answer Card Rate-Limit Tests (W3 Day 3)')
  console.log('==================================================\n')
  let passed = 0
  const failures: string[] = []
  for (const tc of tests) {
    try { await tc.fn(); passed++; console.log('✅ ' + tc.name) }
    catch (e) { failures.push(tc.name); console.log('❌ ' + tc.name); console.error(e) }
  }
  console.log('\nPassed: ' + passed)
  console.log('Failed: ' + failures.length)
  if (failures.length > 0) { failures.forEach((n) => console.log('  - ' + n)); process.exitCode = 1; return }
  console.log('\n✅ All rate-limit tests passed!')
}
runTests().catch((e) => { console.error(e); process.exitCode = 1 })
