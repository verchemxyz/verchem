/**
 * VerChem Answer Card Tools Tests (W3-R10)
 *
 * Enforces the verification invariant: each tool execute() must route to
 * the REAL engine function in lib/calculations/*. Numbers must match.
 * Plus: readFiniteNumber, finalizeResult, equation validation, gas positive limits,
 * dilution positive, vdw positive a/b, proton/hydroxide count validation,
 * formula-as-source-of-truth, leading-coefficient reject, empty-term reject.
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
import { pickSchemaKeys, determineStatus } from '@/lib/answer-cards/orchestrator'

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

  test('rejects unicode formula + proton_count mismatch', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'H₂SO₄', proton_count: 1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('proton_count')).toBe(true)
    expect(result.error?.toLowerCase().includes('expected 2')).toBe(true)
  })

  test('known formula alone uses engine model (H2SO4 Ka2)', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.1, formula: 'H2SO4' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // H2SO4 with Ka2 model gives pH ~0.959 at 0.1M; simple 2*conc gives ~0.699
    expect(result.value.pH).toBeGreaterThan(0.8)
  })

  test('known formula + matching proton_count ignores count (formula is source of truth)', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const formulaOnly = tool.execute({ concentration: 0.1, formula: 'H2SO4' })
    const withCount = tool.execute({ concentration: 0.1, formula: 'H2SO4', proton_count: 2 })
    expect(formulaOnly.ok).toBe(true)
    expect(withCount.ok).toBe(true)
    if (!formulaOnly.ok || !withCount.ok) return
    // Both must use the same formula model → identical pH
    expect(formulaOnly.value.pH).toBeCloseTo(withCount.value.pH as number, 10)
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

  test('known base formula + matching hydroxide_count ignores count (formula is source of truth)', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const formulaOnly = tool.execute({ concentration: 0.1, formula: 'Ca(OH)2' })
    const withCount = tool.execute({ concentration: 0.1, formula: 'Ca(OH)2', hydroxide_count: 2 })
    expect(formulaOnly.ok).toBe(true)
    expect(withCount.ok).toBe(true)
    if (!formulaOnly.ok || !withCount.ok) return
    expect(formulaOnly.value.pH).toBeCloseTo(withCount.value.pH as number, 10)
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

  test('rejects negative volume_to_add (concentrating instead of diluting)', () => {
    const tool = TOOL_BY_NAME.get('calculate_dilution')!
    const result = tool.execute({ M1: 1, V1: 1, M2: 2 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('not a dilution')).toBe(true)
  })

  test('accepts valid dilution with positive volume_to_add', () => {
    const tool = TOOL_BY_NAME.get('calculate_dilution')!
    const result = tool.execute({ M1: 2, V1: 1, M2: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.volume_to_add).toBeGreaterThan(0)
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

  test('normalizes "=>" arrow to canonical "->" (no leaked ">")', () => {
    // Engine parseEquation only splits on ->|→|=, so a bare "=>" would split
    // at "=" and leak ">" into the product ("2H2 + O2 → 2> H2O"). The adapter
    // must normalize "=>" → "->" first.
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2 + O2 => H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.balanced).toBe(balanceEquation('H2 + O2 -> H2O').balanced)
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

  test('rejects H2(qq) + O2 -> H2O (invalid state annotation)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2(qq) + O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects H2(gas) + O2 -> H2O (invalid state annotation)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2(gas) + O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects Ca(OH)2(aqs) -> CaO (invalid state annotation)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Ca(OH)2(aqs) -> CaO' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('accepts H2(g) + O2(g) -> H2O(l) (valid states)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2(g) + O2(g) -> H2O(l)' })
    expect(result.ok).toBe(true)
  })

  test('rejects H2(aq)2 + O2 -> H2O (state not at end, digit after state)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2(aq)2 + O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects H2(s)O -> H2O (state in middle of formula)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2(s)O -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects H2(g)(aq) + O2 -> H2O (duplicate state)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2(g)(aq) + O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects NaCl(aq)(s) -> NaCl (duplicate state)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'NaCl(aq)(s) -> NaCl' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects 0H2 + O2 -> H2O (zero leading coefficient)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: '0H2 + O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects 00H2 + O2 -> H2O (leading-zero coefficient)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: '00H2 + O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects + H2 -> H2 (leading plus = empty term)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: '+ H2 -> H2' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('empty')).toBe(true)
  })

  test('rejects H2 ++ O2 -> H2O (double plus = empty term)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2 ++ O2 -> H2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('empty')).toBe(true)
  })

  test('accepts 2H2 + O2 -> 2H2O (positive leading coefficient)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: '2H2 + O2 -> 2H2O' })
    expect(result.ok).toBe(true)
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

describe('pickSchemaKeys — input key hygiene', () => {
  test('strips unused keys from input (LLM smuggle prevention)', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const stripped = pickSchemaKeys(
      { concentration: 0.1, unused_hallucination: 999, formula: 'HCl' },
      tool
    )
    expect(stripped).toEqual({ concentration: 0.1, formula: 'HCl' })
    expect('unused_hallucination' in stripped).toBe(false)
  })

  test('preserves valid optional keys', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const stripped = pickSchemaKeys(
      { concentration: 0.1, formula: 'H2SO4', proton_count: 2 },
      tool
    )
    expect(stripped).toEqual({ concentration: 0.1, formula: 'H2SO4', proton_count: 2 })
  })

  test('returns empty object when all keys are junk', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const stripped = pickSchemaKeys(
      { unused_hallucination: 999, fake_field: 123 },
      tool
    )
    expect(stripped).toEqual({})
  })

  test('passes through all keys when tool is undefined', () => {
    const stripped = pickSchemaKeys({ concentration: 0.1, extra: 2 }, undefined)
    expect(stripped).toEqual({ concentration: 0.1, extra: 2 })
  })

  test('equation tool strips junk keys too', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const stripped = pickSchemaKeys(
      { equation: 'H2 + O2 -> H2O', unused_coefficient: 42 },
      tool
    )
    expect(stripped).toEqual({ equation: 'H2 + O2 -> H2O' })
  })
})

describe('Equation group leading-zero reject', () => {
  test('rejects Ca(H02)2 (leading-zero count inside group)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Ca(H02)2 -> CaH4' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('rejects Fe2(SO04)3 (leading-zero count inside group)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Fe2(SO04)3 -> Fe2S3O12' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('invalid')).toBe(true)
  })

  test('accepts Ca(OH)2 (normal group)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Ca(OH)2 + HCl -> CaCl2 + H2O' })
    expect(result.ok).toBe(true)
  })

  test('accepts Fe2(SO4)3 (normal group)', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'Fe2(SO4)3 -> Fe2S3O12' })
    expect(result.ok).toBe(true)
  })
})

async function runTests() {
  console.log('🧪 VerChem Answer Card Tools Tests (W3-R10)')
  console.log('============================================\n')

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

// ──────────────────────────────────────────────────────────
// determineStatus — status is driven by engine results ONLY
// Audit on prose is informational and must NOT gate verified.
// ──────────────────────────────────────────────────────────

describe('determineStatus', () => {
  test('verified: at least one ok, no errors, not incomplete', () => {
    expect(determineStatus(true, false, false, false)).toBe('verified')
  })

  test('verified: ok present, error absent, incomplete false — even if audit dirty', () => {
    // audit dirtiness is irrelevant to status
    expect(determineStatus(true, false, false, false)).toBe('verified')
  })

  test('partial: ok present but has error', () => {
    expect(determineStatus(true, true, false, false)).toBe('partial')
  })

  test('partial: ok present but incomplete (truncation)', () => {
    expect(determineStatus(true, false, false, true)).toBe('partial')
  })

  test('partial: ok present with both error and incomplete', () => {
    expect(determineStatus(true, true, false, true)).toBe('partial')
  })

  test('unverified: no ok results', () => {
    expect(determineStatus(false, false, false, false)).toBe('unverified')
  })

  test('unverified: no ok results even with error', () => {
    expect(determineStatus(false, true, false, false)).toBe('unverified')
  })

  test('error: all failed', () => {
    expect(determineStatus(false, false, true, false)).toBe('error')
  })

  test('error: all failed trumps incomplete', () => {
    expect(determineStatus(false, false, true, true)).toBe('error')
  })

  test('error: all failed trumps hasError', () => {
    expect(determineStatus(false, true, true, false)).toBe('error')
  })
})
