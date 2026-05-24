/**
 * VerChem Answer Card Numeric Audit Tests (W3-R2)
 *
 * - explanation with numbers from tool result → clean=true
 * - explanation with numbers NOT from tool result → clean=false
 * - explanation with small integers 0–20 → clean=true (skipped)
 * - empty explanation → clean=true
 */

import assert from 'node:assert/strict'
import { auditExplanation } from '@/lib/answer-cards/audit'
import type { ToolCall } from '@/lib/answer-cards/types'

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
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected)
    },
    toBeTruthy() {
      assert.ok(actual)
    },
    toBeFalsy() {
      assert.ok(!actual)
    },
    toContain(expected: unknown) {
      if (typeof actual === 'string') {
        assert.ok(actual.includes(String(expected)))
        return
      }
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected))
        return
      }
      throw new Error('toContain only supports string and array values')
    },
  }
}

function makeToolCalls(overrides?: Partial<ToolCall>): ToolCall[] {
  return [
    {
      name: 'calculate_weak_acid_ph',
      engine: 'weak-acid-pH',
      input: { concentration: 0.1, Ka: 1.8e-5 },
      result: { ok: true, value: { pH: 2.87, H_concentration: 1.34e-3, percent_ionization: 1.34 } },
      citation: 'Atkins Ch.6',
      ...overrides,
    },
  ]
}

describe('auditExplanation', () => {
  test('clean when explanation only uses result values', () => {
    const explanation = 'The pH is 2.87 and the percent ionization is 1.34%.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
    expect(audit.unmatched).toEqual([])
  })

  test('detects number not from any tool result', () => {
    const explanation = 'The pH is 2.87 but I think the real answer is 3.50.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(false)
    expect(audit.unmatched.length).toBe(1)
    expect(audit.unmatched[0]).toBe('3.5')
  })

  test('detects multiple unmatched numbers', () => {
    const explanation = 'Values: 99.9, 2.87, 42.0, and 1.34e-3.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('99.9')
    expect(audit.unmatched).toContain('42')
  })

  test('allows input values in explanation', () => {
    const explanation = 'Using Ka = 1.8e-5 and concentration 0.1 M, the pH is 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('skips small integers 0–20', () => {
    const explanation = 'Step 1: Add 2 molecules. Step 2: Wait 5 minutes. pH = 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('flags integer above 20 if unmatched', () => {
    const explanation = 'The temperature is 298 K and pH is 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('298')
  })

  test('handles scientific notation variants', () => {
    const explanation = 'Ka = 1.8×10⁻⁵ gives pH 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('handles x10^ notation', () => {
    const explanation = 'H+ concentration is 1.34 x 10^-3 M and pH is 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('empty explanation is clean', () => {
    const audit = auditExplanation('', makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('no tool calls is clean', () => {
    const audit = auditExplanation('Some conceptual text.', [])
    expect(audit.clean).toBe(true)
  })

  test('allows within 1% relative tolerance', () => {
    // Engine gives 2.8745, explanation rounds to 2.87
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 2.8745 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 2.87.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('flags error tool results but allows ok tool results', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'calculate_weak_acid_ph',
        engine: 'weak-acid-pH',
        input: { concentration: 0.1, Ka: 1.8e-5 },
        result: { ok: true, value: { pH: 2.87 } },
        citation: '',
      },
      {
        name: 'calculate_buffer_ph',
        engine: 'buffer-pH',
        input: { pKa: 4.76, acid_concentration: 0.1, base_concentration: 0.1 },
        result: { ok: false, value: {}, error: 'Invalid input' },
        citation: '',
      },
    ]
    const audit = auditExplanation('pH is 2.87.', toolCalls)
    expect(audit.clean).toBe(true)
  })
})

async function runTests() {
  console.log('🧪 VerChem Answer Card Audit Tests (W3-R2)')
  console.log('===========================================\n')

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

  console.log('\n✅ All audit tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
