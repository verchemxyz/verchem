/**
 * VerChem Answer Card Numeric Audit Tests (W3-R10)
 *
 * Trust boundary: allowlist = result values + input values ONLY.
 * No global constants.
 * - tokenize-based formula strip: only pure chemical-formula tokens stripped
 * - precision-aware tolerance
 * - standalone 10^n parsed
 * - thousands separator handled
 * - integers exact-match only
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
      result: { ok: true, value: { pH: 2.87, H_concentration: 1.34e-3, percent_ionization: 1.34, Kw: 1e-14 } },
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
    expect(audit.unmatched[0]).toBe('3.50')
  })

  test('detects multiple unmatched numbers', () => {
    const explanation = 'Values: 99.9, 2.87, 42.0, and 1.34e-3.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('99.9')
    expect(audit.unmatched).toContain('42.0')
  })

  test('allows input values in explanation', () => {
    const explanation = 'Using Ka = 1.8e-5 and concentration 0.1 M, the pH is 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('does not blanket-skip small integers', () => {
    const explanation = 'Step 1: Add 2 molecules. Step 3: pH is 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('2')
    expect(audit.unmatched).toContain('3')
  })

  test('allows integers that ARE in result values', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'balance_equation',
        engine: 'equation-balancer',
        input: { equation: 'H2 + O2 -> H2O' },
        result: { ok: true, value: { coefficients: [2, 1, 2] } },
        citation: '',
      },
    ]
    const audit = auditExplanation('Coefficients are 2, 1, and 2.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('no global constants: 25 L is unmatched (downgrade)', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'ideal_gas_law',
        engine: 'ideal-gas',
        input: { P: 1.0, V: 22.414, n: 1.0 },
        result: { ok: true, value: { T: 273.15, R: 0.0821 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('At 25 °C, volume is 22.414 L.', toolCalls)
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('25')
  })

  test('formula subscripts stripped (H2O does not produce unmatched)', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'balance_equation',
        engine: 'equation-balancer',
        input: { equation: 'H2 + O2 -> H2O' },
        result: { ok: true, value: { coefficients: [2, 1, 2] } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The product is H2O.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('formula strip does not break scientific notation extraction (lowercase e)', () => {
    const explanation = 'Ka = 1.8e-5 gives pH 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('formula strip does not break scientific notation extraction (uppercase E)', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 180000 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 1.8E5.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('tokenize-based: pH7 preserved → 7 unmatched if not in results', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'calculate_weak_acid_ph',
        engine: 'weak-acid-pH',
        input: { concentration: 0.1, Ka: 1.8e-5 },
        result: { ok: true, value: { pH: 2.87 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The pH7 buffer is interesting.', toolCalls)
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('7')
  })

  test('tokenize-based: pOH7 preserved → 7 unmatched if not in results', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'calculate_weak_acid_ph',
        engine: 'weak-acid-pH',
        input: { concentration: 0.1, Ka: 1.8e-5 },
        result: { ok: true, value: { pH: 2.87 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The pOH7 value is noted.', toolCalls)
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('7')
  })

  test('tokenize-based: C6H12O6 stripped correctly', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'balance_equation',
        engine: 'equation-balancer',
        input: { equation: 'C6H12O6 + O2 -> CO2 + H2O' },
        result: { ok: true, value: { coefficients: [1, 6, 6, 6] } },
        citation: '',
      },
    ]
    const audit = auditExplanation('Glucose C6H12O6 reacts with oxygen.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('tokenize-based: pH is 2.87 still clean (2.87 in results)', () => {
    const audit = auditExplanation('The pH is 2.87.', makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('handles x10^ notation', () => {
    const explanation = 'H+ concentration is 1.34 x 10^-3 M and pH is 2.87.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('handles standalone 10^-14 parsed as 1e-14', () => {
    const explanation = 'Kw = 10^-14.'
    const audit = auditExplanation(explanation, makeToolCalls())
    expect(audit.clean).toBe(true)
  })

  test('handles thousands separator', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'ideal_gas_law',
        engine: 'ideal-gas',
        input: { P: 1.0, V: 22414, n: 1000 },
        result: { ok: true, value: { T: 273.15, R: 0.0821 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('Volume is 22,414 L for 1,000 mol.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('precision-aware: 2.87 matches 2.8745 (rounded to 2dp)', () => {
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

  test('precision-aware: 1.009 does NOT match 1.0 (rounded to 3dp)', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 1.0 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 1.009.', toolCalls)
    expect(audit.clean).toBe(false)
    expect(audit.unmatched).toContain('1.009')
  })

  test('precision-aware: 3 matches 3.0 (0dp rounding)', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 3.0 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 3.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('handles superscript plus (10⁺3)', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 1e3 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 1.0×10⁺3.', toolCalls)
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

  test('allows within 1% relative tolerance for sci-not', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 1.801e-5 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 1.8e-5.', toolCalls)
    expect(audit.clean).toBe(true)
  })

  test('rejects sci-not outside 1% tolerance', () => {
    const toolCalls: ToolCall[] = [
      {
        name: 'test',
        engine: 'test',
        input: {},
        result: { ok: true, value: { x: 1.84e-5 } },
        citation: '',
      },
    ]
    const audit = auditExplanation('The value is 1.8e-5.', toolCalls)
    expect(audit.clean).toBe(false)
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
  console.log('🧪 VerChem Answer Card Audit Tests (W3-R10)')
  console.log('=============================================\n')

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
