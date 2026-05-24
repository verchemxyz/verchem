/**
 * VerChem Answer Card Tools Tests (W3-R8)
 *
 * Enforces the verification invariant: each tool execute() must route to
 * the REAL engine function in lib/calculations/*. Numbers must match.
 * Plus: readFiniteNumber, finalizeResult, equation validation, gas positive limits,
 * dilution positive, vdw positive a/b, proton/hydroxide count validation.
 */

import assert from 'node:assert/strict'
import { ALL_TOOLS, TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import { readFiniteNumber, finalizeResult } from '@/lib/answer-cards/tools/_validate'
import {
  calculateStrongAcidPH,
  calculateWeakAcidPH,
  calculateStrongBasePH,
  calculateWeakBasePH,
  hendersonHasselbalch,
  calculateDilution,
} from '@/lib/calculations/solutions'
import {
  idealGasLaw,
  combinedGasLaw,
  boylesLaw,
  charlesLaw,
  gayLussacsLaw,
  avogadrosLaw,
  vanDerWaalsEquation,
} from '@/lib/calculations/gas-laws'
import {
  balanceEquation,
  identifyReactionType,
} from '@/lib/calculations/equation-balancer'

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
    toBeGreaterThan(expected: number) {
      assert.equal(typeof actual, 'number')
      assert.ok((actual as number) > expected)
    },
    toBeCloseTo(expected: number, precision = 2) {
      assert.equal(typeof actual, 'number')
      const diff = Math.abs((actual as number) - expected)
      assert.ok(diff < Math.pow(10, -precision), `Expected ${actual} to be close to ${expected}`)
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
    toBeUndefined() {
      assert.equal(actual, undefined)
    },
  }
}

describe('Tool registry', () => {
  test('ALL_TOOLS has expected Day 1 tools', () => {
    const names = ALL_TOOLS.map((t) => t.name)
    expect(names).toContain('calculate_strong_acid_ph')
    expect(names).toContain('calculate_weak_acid_ph')
    expect(names).toContain('calculate_strong_base_ph')
    expect(names).toContain('calculate_weak_base_ph')
    expect(names).toContain('calculate_buffer_ph')
    expect(names).toContain('calculate_dilution')
    expect(names).toContain('ideal_gas_law')
    expect(names).toContain('combined_gas_law')
    expect(names).toContain('boyles_law')
    expect(names).toContain('charles_law')
    expect(names).toContain('gay_lussac_law')
    expect(names).toContain('avogadro_law')
    expect(names).toContain('van_der_waals')
    expect(names).toContain('balance_equation')
  })

  test('TOOL_BY_NAME maps every tool', () => {
    for (const tool of ALL_TOOLS) {
      expect(TOOL_BY_NAME.get(tool.name)).toEqual(tool)
    }
  })
})

describe('readFiniteNumber', () => {
  test('returns number for valid finite numbers', () => {
    expect(readFiniteNumber(5)).toBe(5)
    expect(readFiniteNumber(3.14)).toBe(3.14)
    expect(readFiniteNumber('2.5')).toBe(2.5)
    expect(readFiniteNumber('  1e-5  ')).toBe(1e-5)
  })

  test('returns undefined for null', () => {
    expect(readFiniteNumber(null)).toBeUndefined()
  })

  test('returns undefined for undefined', () => {
    expect(readFiniteNumber(undefined)).toBeUndefined()
  })

  test('returns undefined for boolean', () => {
    expect(readFiniteNumber(true)).toBeUndefined()
    expect(readFiniteNumber(false)).toBeUndefined()
  })

  test('returns undefined for empty string', () => {
    expect(readFiniteNumber('')).toBeUndefined()
    expect(readFiniteNumber('   ')).toBeUndefined()
  })

  test('returns undefined for object/array', () => {
    expect(readFiniteNumber({})).toBeUndefined()
    expect(readFiniteNumber([])).toBeUndefined()
  })

  test('returns undefined for NaN and Infinity', () => {
    expect(readFiniteNumber(NaN)).toBeUndefined()
    expect(readFiniteNumber(Infinity)).toBeUndefined()
    expect(readFiniteNumber(-Infinity)).toBeUndefined()
  })

  test('returns undefined for non-numeric string', () => {
    expect(readFiniteNumber('abc')).toBeUndefined()
    expect(readFiniteNumber('1.2.3')).toBeUndefined()
  })
})

describe('finalizeResult', () => {
  test('returns ok for valid finite values', () => {
    const r = finalizeResult({ a: 1, b: 2.5 })
    expect(r.ok).toBe(true)
  })

  test('returns error for NaN value', () => {
    const r = finalizeResult({ a: NaN })
    expect(r.ok).toBe(false)
    expect(r.error?.toLowerCase().includes('non-finite')).toBe(true)
  })

  test('returns error for Infinity value', () => {
    const r = finalizeResult({ a: Infinity })
    expect(r.ok).toBe(false)
  })

  test('returns error for nested non-finite', () => {
    const r = finalizeResult({ a: { b: NaN } })
    expect(r.ok).toBe(false)
  })

  test('returns error for array with non-finite', () => {
    const r = finalizeResult({ a: [1, NaN] })
    expect(r.ok).toBe(false)
  })
})

describe('pH tools route to real engines', () => {
  test('calculate_strong_acid_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.01 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateStrongAcidPH(0.01)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.pOH).toBeCloseTo(engineResult.pOH, 10)
    expect(result.value.H_concentration).toBeCloseTo(engineResult.H_concentration as number, 10)
    expect(result.value.OH_concentration).toBeCloseTo(engineResult.OH_concentration as number, 10)
    expect(result.value.Kw).toBe(1e-14)
  })

  test('calculate_weak_acid_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1, Ka: 1.8e-5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakAcidPH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.H_concentration).toBeCloseTo(engineResult.H_concentration as number, 10)
    expect(result.value.percent_ionization).toBeCloseTo(engineResult.percentIonization as number, 10)
    expect(result.value.Kw).toBe(1e-14)
  })

  test('calculate_weak_acid_ph resolves known acid by formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1, acid_name: 'CH3COOH' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakAcidPH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
  })

  test('calculate_weak_acid_ph resolves alias acetic acid', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1, acid_name: 'acetic acid' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakAcidPH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
  })

  test('calculate_strong_base_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const result = tool.execute({ concentration: 0.01 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateStrongBasePH(0.01)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.pOH).toBeCloseTo(engineResult.pOH, 10)
    expect(result.value.Kw).toBe(1e-14)
  })

  test('calculate_weak_base_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_base_ph')!
    const result = tool.execute({ concentration: 0.1, Kb: 1.8e-5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakBasePH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.pOH).toBeCloseTo(engineResult.pOH, 10)
    expect(result.value.Kw).toBe(1e-14)
  })

  test('calculate_buffer_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_buffer_ph')!
    const result = tool.execute({ pKa: 4.76, acid_concentration: 0.1, base_concentration: 0.1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = hendersonHasselbalch(4.76, 0.1, 0.1)
    expect(result.value.pH).toBeCloseTo(engineResult, 10)
  })

  test('calculate_dilution matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_dilution')!
    const result = tool.execute({ M1: 1.0, V1: 0.5, M2: 0.5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateDilution({ M1: 1.0, V1: 0.5, M2: 0.5 })
    expect(result.value.V2).toBeCloseTo(engineResult.V2, 10)
    expect(result.value.dilution_factor).toBeCloseTo(engineResult.dilutionFactor, 10)
  })

  test('rejects null concentration (Number(null)→0 fixed)', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: null })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('concentration')).toBe(true)
  })
})

describe('proton_count / hydroxide_count validation', () => {
  test('rejects negative proton_count', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'H2SO4', proton_count: -1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('proton_count')).toBe(true)
  })

  test('rejects zero proton_count', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'H2SO4', proton_count: 0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('proton_count')).toBe(true)
  })

  test('rejects non-integer proton_count', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, proton_count: 1.5 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('proton_count')).toBe(true)
  })

  test('rejects proton_count mismatch with known formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'H2SO4', proton_count: 1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('proton_count')).toBe(true)
    expect(result.error?.toLowerCase().includes('expected 2')).toBe(true)
  })

  test('accepts proton_count matching known formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'H2SO4', proton_count: 2 })
    expect(result.ok).toBe(true)
  })

  test('accepts proton_count alone for unknown formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, proton_count: 3 })
    expect(result.ok).toBe(true)
  })

  test('rejects negative hydroxide_count', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const result = tool.execute({ concentration: 0.1, hydroxide_count: -1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('hydroxide_count')).toBe(true)
  })

  test('rejects zero hydroxide_count', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const result = tool.execute({ concentration: 0.1, hydroxide_count: 0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('hydroxide_count')).toBe(true)
  })

  test('rejects hydroxide_count mismatch with known formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'Ca(OH)2', hydroxide_count: 1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('hydroxide_count')).toBe(true)
    expect(result.error?.toLowerCase().includes('expected 2')).toBe(true)
  })

  test('accepts hydroxide_count matching known formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'Ca(OH)2', hydroxide_count: 2 })
    expect(result.ok).toBe(true)
  })
})

describe('Dilution positive validation', () => {
  test('rejects negative M1', () => {
    const tool = TOOL_BY_NAME.get('calculate_dilution')!
    const result = tool.execute({ M1: -1, V1: 1, M2: 0.5 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive')).toBe(true)
  })

  test('rejects zero V1', () => {
    const tool = TOOL_BY_NAME.get('calculate_dilution')!
    const result = tool.execute({ M1: 1, V1: 0, M2: 0.5 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive')).toBe(true)
  })
})

describe('Gas law tools route to real engines', () => {
  test('ideal_gas_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('ideal_gas_law')!
    const result = tool.execute({ P: 1.0, V: 22.414, n: 1.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = idealGasLaw({ P: 1.0, V: 22.414, n: 1.0 })
    expect(result.value.T).toBeCloseTo(engineResult.T, 2)
  })

  test('combined_gas_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('combined_gas_law')!
    const result = tool.execute({ P1: 2.0, V1: 5.0, T1: 300, P2: 1.0, T2: 400 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = combinedGasLaw({ P1: 2.0, V1: 5.0, T1: 300, P2: 1.0, T2: 400 })
    expect(result.value.V2).toBeCloseTo(engineResult.V2, 10)
  })

  test('boyles_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('boyles_law')!
    const result = tool.execute({ P1: 2.0, V1: 3.0, P2: 1.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = boylesLaw(2.0, 3.0, 1.0)
    expect(result.value.V2).toBeCloseTo(engineResult.V2 as number, 10)
  })

  test('boyles_law rejects zero pressure', () => {
    const tool = TOOL_BY_NAME.get('boyles_law')!
    const result = tool.execute({ P1: 1.0, V1: 1.0, P2: 0.0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive') || result.error?.toLowerCase().includes('boyle')).toBe(true)
  })

  test('boyles_law rejects negative pressure', () => {
    const tool = TOOL_BY_NAME.get('boyles_law')!
    const result = tool.execute({ P1: -2.0, V1: 3.0, P2: 1.0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive')).toBe(true)
  })

  test('charles_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('charles_law')!
    const result = tool.execute({ V1: 2.0, T1: 300, V2: 4.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = charlesLaw(2.0, 300, 4.0)
    expect(result.value.T2).toBeCloseTo(engineResult.T2 as number, 10)
  })

  test('charles_law rejects negative temperature', () => {
    const tool = TOOL_BY_NAME.get('charles_law')!
    const result = tool.execute({ V1: 1.0, T1: -300.0, T2: 200.0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive')).toBe(true)
  })

  test('gay_lussac_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('gay_lussac_law')!
    const result = tool.execute({ P1: 1.0, T1: 300, P2: 2.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = gayLussacsLaw(1.0, 300, 2.0)
    expect(result.value.T2).toBeCloseTo(engineResult.T2 as number, 10)
  })

  test('avogadro_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('avogadro_law')!
    const result = tool.execute({ V1: 2.0, n1: 1.0, V2: 4.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = avogadrosLaw(2.0, 1.0, 4.0)
    expect(result.value.n2).toBeCloseTo(engineResult.n2 as number, 10)
  })

  test('van_der_waals matches engine', () => {
    const tool = TOOL_BY_NAME.get('van_der_waals')!
    const result = tool.execute({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: 0.0427 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = vanDerWaalsEquation({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: 0.0427 })
    expect(result.value.pressure).toBeCloseTo(engineResult, 10)
  })

  test('van_der_waals resolves gas by name', () => {
    const tool = TOOL_BY_NAME.get('van_der_waals')!
    const result = tool.execute({ n: 1.0, V: 10.0, T: 298, gas_name: 'CO2' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = vanDerWaalsEquation({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: 0.0427 })
    expect(result.value.pressure).toBeCloseTo(engineResult, 10)
  })

  test('van_der_waals rejects negative a', () => {
    const tool = TOOL_BY_NAME.get('van_der_waals')!
    const result = tool.execute({ n: 1.0, V: 10.0, T: 298, a: -1.0, b: 0.0427 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive')).toBe(true)
  })

  test('van_der_waals rejects negative b', () => {
    const tool = TOOL_BY_NAME.get('van_der_waals')!
    const result = tool.execute({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: -0.1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('positive')).toBe(true)
  })
})

describe('Equation balancer tool routes to real engine', () => {
  test('balance_equation matches engine', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2 + O2 -> H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = balanceEquation('H2 + O2 -> H2O')
    expect(result.value.balanced).toBe(engineResult.balanced)
    expect(result.value.is_balanced).toBe(engineResult.isBalanced)
    expect(result.value.reaction_type).toBe(identifyReactionType('H2 + O2 -> H2O'))
  })

  test('rejects invalid equation (abc -> def)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'abc -> def' })
    expect(result.ok).toBe(false)
  })

  test('rejects equation without arrow', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2 O2 H2O' })
    expect(result.ok).toBe(false)
  })

  test('rejects foo + bar -> baz', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'foo + bar -> baz' })
    expect(result.ok).toBe(false)
  })

  test('rejects H2 + foo -> H2foo (per-compound validation)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2 + foo -> H2foo' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects Xx + H2 -> H2Xx (unknown element)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Xx + H2 -> H2Xx' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('accepts NaCl + AgNO3 -> AgCl + NaNO3', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'NaCl + AgNO3 -> AgCl + NaNO3' })
    expect(result.ok).toBe(true)
  })

  test('rejects H0 -> H0 (zero subscript)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H0 -> H0' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects C0H4 + O2 -> CO2 (zero subscript)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'C0H4 + O2 -> CO2' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects H00 -> H00 (leading-zero subscript)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H00 -> H00' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects C00 + O2 -> CO2 (leading-zero subscript)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'C00 + O2 -> CO2' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects Ca(OH)0 -> CaO (zero multiplier)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Ca(OH)0 -> CaO' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })
})

describe('Tool input validation', () => {
  test('rejects negative concentration', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: -1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('concentration')).toBe(true)
  })

  test('rejects missing Ka for weak acid', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('ka')).toBe(true)
  })
})

async function runTests() {
  console.log('🧪 VerChem Answer Card Tools Tests (W3-R8)')
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

  console.log('\n✅ All tools tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
