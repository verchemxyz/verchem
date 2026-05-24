/**
 * VerChem Answer Card Signature Tests
 *
 * - sign → verify ✓
 * - tamper payload → verify ✗
 * - key order does not affect signature
 */

import assert from 'node:assert/strict'
import { signCard, verifyCardSignature } from '@/lib/answer-cards/signature'
import type { SignablePayload } from '@/lib/answer-cards/types'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void) {
  fn()
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected)
    },
    toBeTruthy() {
      assert.ok(actual)
    },
    toBeFalsy() {
      assert.ok(!actual)
    },
  }
}

function makePayload(overrides?: Partial<SignablePayload>): SignablePayload {
  return {
    question: 'What is the pH of 0.1 M HCl?',
    tool_calls: [
      {
        name: 'calculate_strong_acid_ph',
        input: { concentration: 0.1 },
        result: { pH: 1.0 },
      },
    ],
    model: 'claude-haiku-4-5-20251001',
    version: 'w3-v1',
    issued_at: '2026-05-24T00:00:00.000Z',
    ...overrides,
  }
}

describe('signCard + verifyCardSignature', () => {
  test('signs and verifies a valid payload', async () => {
    const payload = makePayload()
    const sig = await signCard(payload)
    expect(typeof sig === 'string' && sig.length > 0).toBeTruthy()
    const valid = await verifyCardSignature(payload, sig)
    expect(valid).toBeTruthy()
  })

  test('tampered payload fails verification', async () => {
    const payload = makePayload()
    const sig = await signCard(payload)

    const tampered = makePayload({ question: 'Tampered question' })
    const valid = await verifyCardSignature(tampered, sig)
    expect(valid).toBeFalsy()
  })

  test('tampered tool result fails verification', async () => {
    const payload = makePayload()
    const sig = await signCard(payload)

    const tampered = makePayload({
      tool_calls: [
        {
          name: 'calculate_strong_acid_ph',
          input: { concentration: 0.1 },
          result: { pH: 99.9 },
        },
      ],
    })
    const valid = await verifyCardSignature(tampered, sig)
    expect(valid).toBeFalsy()
  })

  test('different key order produces identical signature', async () => {
    const payloadA: SignablePayload = {
      question: 'What is the pH?',
      tool_calls: [
        {
          name: 'calculate_weak_acid_ph',
          input: { concentration: 0.1, Ka: 1.8e-5 },
          result: { pH: 2.87, method: 'approximation' },
        },
      ],
      model: 'claude-haiku-4-5-20251001',
      version: 'w3-v1',
      issued_at: '2026-05-24T00:00:00.000Z',
    }

    const payloadB: SignablePayload = {
      version: 'w3-v1',
      model: 'claude-haiku-4-5-20251001',
      issued_at: '2026-05-24T00:00:00.000Z',
      question: 'What is the pH?',
      tool_calls: [
        {
          result: { method: 'approximation', pH: 2.87 },
          input: { Ka: 1.8e-5, concentration: 0.1 },
          name: 'calculate_weak_acid_ph',
        },
      ],
    }

    const sigA = await signCard(payloadA)
    const sigB = await signCard(payloadB)
    expect(sigA).toBe(sigB)

    // Verify cross
    expect(await verifyCardSignature(payloadA, sigB)).toBeTruthy()
    expect(await verifyCardSignature(payloadB, sigA)).toBeTruthy()
  })

  test('empty tool_calls still signs and verifies', async () => {
    const payload = makePayload({ tool_calls: [] })
    const sig = await signCard(payload)
    expect(await verifyCardSignature(payload, sig)).toBeTruthy()
  })
})

async function runTests() {
  console.log('🧪 VerChem Answer Card Signature Tests')
  console.log('=======================================\n')

  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log(`✅ ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.log(`❌ ${testCase.name}`)
      console.error(error)
    }
  }

  console.log('\n📊 Test Summary')
  console.log('---------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failures.length}`)

  if (failures.length > 0) {
    console.log('\n❌ Failures:')
    failures.forEach((name) => console.log(`  - ${name}`))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All signature tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
