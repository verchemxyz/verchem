/**
 * VerChem Answer Card Tools — Stoichiometry Family Tests (W3 Day 2 Wave A)
 *
 * Coverage:
 * - Happy path with textbook values
 * - Guard rejection (negative, zero, non-finite)
 * - Formula attack surface (unknown element, homoglyph, garbage, empty)
 * - NaN/Infinity guard
 * - Numerical verification against known values
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  calculateMolecularMass,
  calculatePercentComposition,
  calculateEmpiricalFormula,
  massToMoles,
  molesToMass,
  molesToMolecules,
  moleculesToMoles,
  molesToVolumeSTP,
  volumeSTPToMoles,
  findLimitingReagent,
  calculateTheoreticalYield,
  calculatePercentYield,
} from '@/lib/calculations/stoichiometry'
import { AVOGADRO_CONSTANT } from '@/lib/constants'

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

// ──────────────────────────────────────────────────────────
// Happy path — routes to real engines
// ──────────────────────────────────────────────────────────

describe('calculate_molecular_mass', () => {
  test('H2O molar mass ≈ 18.015', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateMolecularMass('H2O')
    expect(result.value.molar_mass).toBeCloseTo(engineResult, 10)
    expect(result.value.formula).toBe('H2O')
  })

  test('NaCl molar mass ≈ 58.44', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'NaCl' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molar_mass).toBeCloseTo(58.44, 1)
  })

  test('Ca(OH)2 molar mass', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'Ca(OH)2' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateMolecularMass('Ca(OH)2')
    expect(result.value.molar_mass).toBeCloseTo(engineResult, 10)
  })
})

describe('calculate_percent_composition', () => {
  test('H2O composition matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_composition')!
    const result = tool.execute({ formula: 'H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculatePercentComposition('H2O')
    expect(result.value.percent_composition).toEqual(engineResult)
  })

  test('CO2 composition', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_composition')!
    const result = tool.execute({ formula: 'CO2' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const comp = result.value.percent_composition as Record<string, number>
    expect(comp.C).toBeCloseTo(27.29, 1)
    expect(comp.O).toBeCloseTo(72.71, 1)
  })
})

describe('calculate_empirical_formula', () => {
  test('glucose composition → CH2O', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const result = tool.execute({ composition: [{ element: 'C', percent: 40 }, { element: 'H', percent: 6.7 }, { element: 'O', percent: 53.3 }] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateEmpiricalFormula({ C: 40, H: 6.7, O: 53.3 })
    expect(result.value.empirical_formula).toBe(engineResult)
  })

  test('accepts mass instead of percent', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const result = tool.execute({ composition: [{ element: 'C', mass: 12 }, { element: 'H', mass: 2 }, { element: 'O', mass: 16 }] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.empirical_formula).toBe('CH2O')
  })
})

describe('mass_to_moles', () => {
  test('18.015 g H2O = 1 mol', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const result = tool.execute({ mass: 18.015, molar_mass: 18.015 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.moles).toBeCloseTo(1, 3)
  })

  test('matches engine', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const result = tool.execute({ mass: 58.44, molar_mass: 58.44 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.moles).toBeCloseTo(massToMoles(58.44, 58.44), 10)
  })
})

describe('moles_to_mass', () => {
  test('2 mol H2O = 36.03 g', () => {
    const tool = TOOL_BY_NAME.get('moles_to_mass')!
    const result = tool.execute({ moles: 2, molar_mass: 18.015 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.mass).toBeCloseTo(36.03, 2)
  })
})

describe('moles_to_molecules', () => {
  test('1 mol = Avogadro molecules', () => {
    const tool = TOOL_BY_NAME.get('moles_to_molecules')!
    const result = tool.execute({ moles: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molecules).toBeCloseTo(molesToMolecules(1), 10)
    expect(result.value.avogadro).toBe(AVOGADRO_CONSTANT)
  })
})

describe('molecules_to_moles', () => {
  test('Avogadro molecules = 1 mol', () => {
    const tool = TOOL_BY_NAME.get('molecules_to_moles')!
    const result = tool.execute({ molecules: AVOGADRO_CONSTANT })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.moles).toBeCloseTo(1, 3)
  })
})

describe('moles_to_volume_stp', () => {
  test('1 mol = 22.414 L', () => {
    const tool = TOOL_BY_NAME.get('moles_to_volume_stp')!
    const result = tool.execute({ moles: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.volume_L).toBeCloseTo(molesToVolumeSTP(1), 10)
    expect(result.value.note).toContain('STP')
  })
})

describe('volume_stp_to_moles', () => {
  test('22.414 L = 1 mol', () => {
    const tool = TOOL_BY_NAME.get('volume_stp_to_moles')!
    const result = tool.execute({ volume_L: 22.414 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.moles).toBeCloseTo(volumeSTPToMoles(22.414), 2)
  })
})

describe('find_limiting_reagent', () => {
  test('2H2 + O2 → H2 limiting', () => {
    const tool = TOOL_BY_NAME.get('find_limiting_reagent')!
    const result = tool.execute({
      reactants: [
        { formula: 'H2', moles: 2, coefficient: 2 },
        { formula: 'O2', moles: 2, coefficient: 1 },
      ],
      products: [{ formula: 'H2O', coefficient: 2 }],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = findLimitingReagent(
      { reactants: [{ formula: 'H2', moles: 2, coefficient: 2 }, { formula: 'O2', moles: 2, coefficient: 1 }] },
      [{ formula: 'H2O', coefficient: 2 }]
    )
    expect(result.value.limiting_reagent).toBe(engineResult.limitingReagent)
    expect(result.value.limiting_reagent_moles).toBe(engineResult.limitingReagentMoles)
  })
})

describe('calculate_theoretical_yield', () => {
  test('2 mol H2 → 2 mol H2O = 36.03 g', () => {
    const tool = TOOL_BY_NAME.get('calculate_theoretical_yield')!
    const result = tool.execute({ limiting_reagent_moles: 2, limiting_reagent_coefficient: 2, product_coefficient: 2, product_formula: 'H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateTheoreticalYield(2, 2, 2, 'H2O')
    expect(result.value.moles).toBeCloseTo(engineResult.moles, 10)
    expect(result.value.mass).toBeCloseTo(engineResult.mass, 10)
  })
})

describe('calculate_percent_yield', () => {
  test('27 / 36 = 75%', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_yield')!
    const result = tool.execute({ actual_yield: 27, theoretical_yield: 36 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.percent_yield).toBeCloseTo(calculatePercentYield(27, 36), 10)
  })

  test('>100% includes note', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_yield')!
    const result = tool.execute({ actual_yield: 110, theoretical_yield: 100 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.percent_yield).toBeCloseTo(110, 10)
    expect(result.value.note).toContain('100%')
  })
})

// ──────────────────────────────────────────────────────────
// Guard rejection
// ──────────────────────────────────────────────────────────

describe('Stoichiometry guard rejection', () => {
  test('calculate_molecular_mass rejects empty formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: '' })
    expect(result.ok).toBe(false)
  })

  test('calculate_molecular_mass rejects whitespace formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: '   ' })
    expect(result.ok).toBe(false)
  })

  test('mass_to_moles rejects negative mass', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const result = tool.execute({ mass: -1, molar_mass: 18 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase()).toContain('mass')
  })

  test('mass_to_moles rejects zero molar_mass', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const result = tool.execute({ mass: 10, molar_mass: 0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase()).toContain('molar_mass')
  })

  test('moles_to_mass rejects negative moles', () => {
    const tool = TOOL_BY_NAME.get('moles_to_mass')!
    const result = tool.execute({ moles: -1, molar_mass: 18 })
    expect(result.ok).toBe(false)
  })

  test('moles_to_molecules rejects negative moles', () => {
    const tool = TOOL_BY_NAME.get('moles_to_molecules')!
    const result = tool.execute({ moles: -1 })
    expect(result.ok).toBe(false)
  })

  test('volume_stp_to_moles rejects negative volume', () => {
    const tool = TOOL_BY_NAME.get('volume_stp_to_moles')!
    const result = tool.execute({ volume_L: -1 })
    expect(result.ok).toBe(false)
  })

  test('find_limiting_reagent rejects empty reactants', () => {
    const tool = TOOL_BY_NAME.get('find_limiting_reagent')!
    const result = tool.execute({ reactants: [], products: [{ formula: 'H2O', coefficient: 1 }] })
    expect(result.ok).toBe(false)
  })

  test('find_limiting_reagent rejects zero coefficient', () => {
    const tool = TOOL_BY_NAME.get('find_limiting_reagent')!
    const result = tool.execute({
      reactants: [{ formula: 'H2', moles: 1, coefficient: 0 }],
      products: [{ formula: 'H2O', coefficient: 1 }],
    })
    expect(result.ok).toBe(false)
  })

  test('calculate_theoretical_yield rejects negative limiting moles', () => {
    const tool = TOOL_BY_NAME.get('calculate_theoretical_yield')!
    const result = tool.execute({ limiting_reagent_moles: -1, limiting_reagent_coefficient: 1, product_coefficient: 1, product_formula: 'H2O' })
    expect(result.ok).toBe(false)
  })

  test('calculate_percent_yield rejects zero theoretical', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_yield')!
    const result = tool.execute({ actual_yield: 10, theoretical_yield: 0 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase()).toContain('theoretical')
  })

  test('calculate_percent_yield rejects negative actual', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_yield')!
    const result = tool.execute({ actual_yield: -5, theoretical_yield: 10 })
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// Formula attack surface
// ──────────────────────────────────────────────────────────

describe('Stoichiometry formula attack', () => {
  test('rejects unknown element Xz2O', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'Xz2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase()).toContain('invalid')
  })

  test('rejects homoglyph Cyrillic Н2O', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: '\u041D2O' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase()).toContain('invalid')
  })

  test('rejects garbage H2O!!', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'H2O!!' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase()).toContain('invalid')
  })

  test('rejects empty formula', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: '' })
    expect(result.ok).toBe(false)
  })

  test('rejects unknown element in percent_composition', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_composition')!
    const result = tool.execute({ formula: 'Xx2O' })
    expect(result.ok).toBe(false)
  })

  test('rejects product formula with homoglyph in theoretical_yield', () => {
    const tool = TOOL_BY_NAME.get('calculate_theoretical_yield')!
    const result = tool.execute({ limiting_reagent_moles: 1, limiting_reagent_coefficient: 1, product_coefficient: 1, product_formula: 'H\u2082O' })
    // H₂O should be normalized by isValidCompound? Actually isValidCompound does NOT normalize.
    // The formula H₂O contains unicode subscript which is not in the ASCII regex.
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// NaN / Infinity guard
// ──────────────────────────────────────────────────────────

describe('Stoichiometry NaN/Infinity guard', () => {
  test('rejects NaN moles', () => {
    const tool = TOOL_BY_NAME.get('moles_to_mass')!
    const result = tool.execute({ moles: NaN, molar_mass: 18 })
    expect(result.ok).toBe(false)
  })

  test('rejects Infinity molar_mass', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const result = tool.execute({ mass: 10, molar_mass: Infinity })
    expect(result.ok).toBe(false)
  })

  test('rejects null mass (readFiniteNumber trap)', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const result = tool.execute({ mass: null, molar_mass: 18 })
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// Numerical verification
// ──────────────────────────────────────────────────────────

describe('Stoichiometry numerical verification', () => {
  test('molar mass H2O = 18.015', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molar_mass).toBeCloseTo(18.015, 2)
  })

  test('molar mass NaCl = 58.44', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: 'NaCl' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molar_mass).toBeCloseTo(58.44, 1)
  })

  test('0.5 mol NaCl mass = 29.22 g', () => {
    const tool = TOOL_BY_NAME.get('moles_to_mass')!
    const result = tool.execute({ moles: 0.5, molar_mass: 58.44 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.mass).toBeCloseTo(29.22, 2)
  })
})

// ──────────────────────────────────────────────────────────
// R1 review fixes (สมหมาย Wave A): standalone formula strictness + empirical postcondition
// ──────────────────────────────────────────────────────────

describe('Stoichiometry R1 fixes', () => {
  test('molecular_mass rejects state suffix (engine would read (s)→Os, (g)→Og)', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    for (const f of ['H2O(s)', 'H2O(g)', 'H2O(aq)', 'H2O(l)']) {
      const result = tool.execute({ formula: f })
      expect(result.ok).toBe(false)
    }
  })

  test('molecular_mass rejects leading coefficient 2H2O (engine ignores the 2)', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    const result = tool.execute({ formula: '2H2O' })
    expect(result.ok).toBe(false)
  })

  test('percent_composition rejects leading coefficient', () => {
    const tool = TOOL_BY_NAME.get('calculate_percent_composition')!
    const result = tool.execute({ formula: '3CO2' })
    expect(result.ok).toBe(false)
  })

  test('theoretical_yield rejects state-suffixed product', () => {
    const tool = TOOL_BY_NAME.get('calculate_theoretical_yield')!
    const result = tool.execute({ limiting_reagent_moles: 1, limiting_reagent_coefficient: 1, product_coefficient: 1, product_formula: 'H2O(g)' })
    expect(result.ok).toBe(false)
  })

  test('empirical_formula rejects subnormal underflow → empty', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const result = tool.execute({ composition: [{ element: 'H', percent: 5e-324 }, { element: 'O', percent: 5e-324 }] })
    expect(result.ok).toBe(false)
  })

  test('valid standalone formulas still pass (regression)', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    for (const f of ['H2O', 'NaCl', 'Ca(OH)2', 'C6H12O6', '(NH4)2SO4']) {
      const result = tool.execute({ formula: f })
      expect(result.ok).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────────────────
// R3 review fixes (สมหมาย): magnitude bounds + duplicate-element guard
// ──────────────────────────────────────────────────────────

describe('Stoichiometry R3 fixes', () => {
  test('molecular_mass rejects count beyond MAX_ELEMENT_COUNT', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    expect(tool.execute({ formula: 'H9007199254740993' }).ok).toBe(false)
    expect(tool.execute({ formula: 'H2000000' }).ok).toBe(false)
  })

  test('molecular_mass still allows reasonable large count (C1000)', () => {
    const tool = TOOL_BY_NAME.get('calculate_molecular_mass')!
    expect(tool.execute({ formula: 'C1000' }).ok).toBe(true)
  })

  test('mass_to_moles rejects subnormal mass (underflow → 0)', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    expect(tool.execute({ mass: 5e-324, molar_mass: 2 }).ok).toBe(false)
  })

  test('empirical_formula rejects duplicate element', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const result = tool.execute({ composition: [{ element: 'C', percent: 40 }, { element: 'C', percent: 60 }] })
    expect(result.ok).toBe(false)
  })

  test('empirical_formula rejects both percent and mass for same element', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const result = tool.execute({ composition: [{ element: 'C', percent: 40, mass: 12 }, { element: 'O', percent: 53 }] })
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// R5 review fixes (สมหมาย): string-underflow + empirical key-presence
// ──────────────────────────────────────────────────────────

describe('Stoichiometry R5 fixes', () => {
  test('mass_to_moles rejects underflow string "1e-324"', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    expect(tool.execute({ mass: '1e-324', molar_mass: 2 }).ok).toBe(false)
  })

  test('mass_to_moles still accepts true-zero string "0"', () => {
    const tool = TOOL_BY_NAME.get('mass_to_moles')!
    const r = tool.execute({ mass: '0', molar_mass: 2 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.moles).toBe(0)
  })

  test('empirical rejects both keys present even if one value is invalid', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const r = tool.execute({ composition: [{ element: 'C', percent: '5e-324', mass: 12 }, { element: 'H', mass: 2 }, { element: 'O', mass: 16 }] })
    expect(r.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// R9 review fixes (สมหมาย): empirical multiplier cap + percent-match postcondition
// ──────────────────────────────────────────────────────────

describe('Stoichiometry R9 fixes', () => {
  test('empirical handles multiplier > 6: toluene C84.077 H8.064 → C7H8', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const r = tool.execute({ composition: [{ element: 'C', mass: 84.077 }, { element: 'H', mass: 8.064 }] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.empirical_formula).toBe('C7H8')
  })

  test('R11: empirical multiplier 13 → C13H14 (was wrongly CH via percent postcondition)', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const r = tool.execute({ composition: [{ element: 'C', mass: 156.143 }, { element: 'H', mass: 14.112 }] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.empirical_formula).toBe('C13H14')
  })

  test('empirical glucose still CH2O (regression)', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const r = tool.execute({ composition: [{ element: 'C', percent: 40 }, { element: 'H', percent: 6.7 }, { element: 'O', percent: 53.3 }] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.empirical_formula).toBe('CH2O')
  })

  test('empirical water H2O from mass (regression)', () => {
    const tool = TOOL_BY_NAME.get('calculate_empirical_formula')!
    const r = tool.execute({ composition: [{ element: 'H', mass: 2.016 }, { element: 'O', mass: 16.0 }] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.empirical_formula).toBe('H2O')
  })
})

// ──────────────────────────────────────────────────────────
// Run all tests
// ──────────────────────────────────────────────────────────

async function runTests() {
  console.log('🧪 VerChem Answer Card Stoichiometry Tests (W3 Day 2 Wave A)')
  console.log('=============================================================\n')

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

  console.log('\n✅ All stoichiometry tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
