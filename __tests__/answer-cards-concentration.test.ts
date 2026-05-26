/**
 * VerChem Answer Card Tools — Concentration Family Tests (W3 Day 2 Wave A)
 *
 * Coverage:
 * - Happy path with textbook values
 * - Guard rejection (negative, zero, non-finite)
 * - NaN/Infinity guard
 * - Numerical verification against known values
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  calculateMolarity,
  calculateMolality,
  calculateMassPercent,
  calculatePPM,
  calculateOsmoticPressure,
  calculateBoilingPointElevation,
} from '@/lib/calculations/solutions'
import {
  calculateStockPrep,
  convertConcentration,
  calculateMixing,
} from '@/lib/calculations/solution-prep'

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

describe('calculate_molarity', () => {
  test('0.5 mol / 2 L = 0.25 M', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: 0.5, volume_L: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molarity).toBeCloseTo(0.25, 10)
    expect(result.value.unit).toBe('M')
  })

  test('mass path: 58.44 g NaCl / 1 L (M=58.44) = 1 M', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ mass_grams: 58.44, molar_mass: 58.44, volume_L: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molarity).toBeCloseTo(1, 10)
  })

  test('matches engine (moles path)', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: 0.5, volume_L: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateMolarity(0.5, 2)
    expect(result.value.molarity).toBeCloseTo(engineResult, 10)
  })
})

describe('calculate_molality', () => {
  test('1 mol / 1 kg = 1 m', () => {
    const tool = TOOL_BY_NAME.get('calculate_molality')!
    const result = tool.execute({ moles: 1, solvent_mass_kg: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molality).toBeCloseTo(1, 10)
  })

  test('matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_molality')!
    const result = tool.execute({ moles: 2, solvent_mass_kg: 0.5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molality).toBeCloseTo(calculateMolality(2, 0.5), 10)
  })
})

describe('calculate_mass_percent', () => {
  test('10 g / 100 g = 10%', () => {
    const tool = TOOL_BY_NAME.get('calculate_mass_percent')!
    const result = tool.execute({ solute_mass: 10, solution_mass: 100 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.mass_percent).toBeCloseTo(10, 10)
  })

  test('matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_mass_percent')!
    const result = tool.execute({ solute_mass: 5, solution_mass: 50 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.mass_percent).toBeCloseTo(calculateMassPercent(5, 50), 10)
  })
})

describe('calculate_ppm', () => {
  test('500 mg / 1 L = 500 ppm', () => {
    const tool = TOOL_BY_NAME.get('calculate_ppm')!
    const result = tool.execute({ solute_mass_mg: 500, solution_volume_L: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.ppm).toBeCloseTo(500, 10)
  })

  test('matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_ppm')!
    const result = tool.execute({ solute_mass_mg: 250, solution_volume_L: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.ppm).toBeCloseTo(calculatePPM(250, 2), 10)
  })
})

describe('calculate_osmotic_pressure', () => {
  test('1 M at 298 K = iMRT', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    const result = tool.execute({ molarity: 1, temperature_K: 298 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateOsmoticPressure(1, 298)
    expect(result.value.osmotic_pressure_atm).toBeCloseTo(engineResult, 10)
    expect(result.value.temperature_K).toBe(298)
  })

  test('with vant_hoff_factor = 2', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    const result = tool.execute({ molarity: 0.5, temperature_K: 298, vant_hoff_factor: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateOsmoticPressure(0.5, 298, 2)
    expect(result.value.osmotic_pressure_atm).toBeCloseTo(engineResult, 10)
  })
})

describe('calculate_boiling_point_elevation', () => {
  test('1 m water = 0.512°C', () => {
    const tool = TOOL_BY_NAME.get('calculate_boiling_point_elevation')!
    const result = tool.execute({ molality: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.delta_tb_C).toBeCloseTo(0.512, 10)
    expect(result.value.Kb).toBeCloseTo(0.512, 10)
  })

  test('custom Kb', () => {
    const tool = TOOL_BY_NAME.get('calculate_boiling_point_elevation')!
    const result = tool.execute({ molality: 1, Kb: 2.53 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateBoilingPointElevation(1, 2.53)
    expect(result.value.delta_tb_C).toBeCloseTo(engineResult, 10)
  })
})

describe('calculate_freezing_point_depression', () => {
  test('1 m water = 1.86°C', () => {
    const tool = TOOL_BY_NAME.get('calculate_freezing_point_depression')!
    const result = tool.execute({ molality: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.delta_tf_C).toBeCloseTo(1.86, 10)
    expect(result.value.Kf).toBeCloseTo(1.86, 10)
  })
})

describe('calculate_stock_prep', () => {
  test('1 M NaCl 0.5 L → 29.22 g', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 1, target_volume: 0.5, molar_mass: 58.44, unit: 'mol/L' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateStockPrep({ targetConc: 1, targetVolume: 0.5, molarMass: 58.44, unit: 'mol/L' })
    expect(result.value.mass_needed_g).toBeCloseTo(engineResult.massNeeded, 10)
  })

  test('pct_vv rejected (yields volume not mass — not verifiable)', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 10, target_volume: 1, molar_mass: 46.07, unit: 'pct_vv' })
    expect(result.ok).toBe(false)
  })
})

describe('convert_concentration', () => {
  test('1 mol/L → g/L for NaCl (58.44)', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    const result = tool.execute({ value: 1, from_unit: 'mol/L', to_unit: 'g/L', molar_mass: 58.44 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = convertConcentration({ value: 1, fromUnit: 'mol/L', toUnit: 'g/L', molarMass: 58.44 })
    expect(result.value.converted_value).toBeCloseTo(engineResult.convertedValue, 10)
  })
})

describe('calculate_mixing', () => {
  test('1M 1L + 0M 1L = 0.5M 2L', () => {
    const tool = TOOL_BY_NAME.get('calculate_mixing')!
    const result = tool.execute({ c1: 1, v1: 1, c2: 0, v2: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateMixing({ c1: 1, v1: 1, c2: 0, v2: 1 })
    expect(result.value.final_concentration).toBeCloseTo(engineResult.finalConc, 10)
    expect(result.value.final_volume).toBeCloseTo(engineResult.finalVolume, 10)
  })
})

// ──────────────────────────────────────────────────────────
// Guard rejection
// ──────────────────────────────────────────────────────────

describe('Concentration guard rejection', () => {
  test('calculate_molarity rejects negative moles', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: -1, volume_L: 1 })
    expect(result.ok).toBe(false)
  })

  test('calculate_molarity rejects zero volume', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: 1, volume_L: 0 })
    expect(result.ok).toBe(false)
  })

  test('calculate_molality rejects zero solvent mass', () => {
    const tool = TOOL_BY_NAME.get('calculate_molality')!
    const result = tool.execute({ moles: 1, solvent_mass_kg: 0 })
    expect(result.ok).toBe(false)
  })

  test('calculate_mass_percent rejects solute > solution', () => {
    const tool = TOOL_BY_NAME.get('calculate_mass_percent')!
    const result = tool.execute({ solute_mass: 100, solution_mass: 50 })
    expect(result.ok).toBe(false)
  })

  test('calculate_mass_percent rejects zero solution_mass', () => {
    const tool = TOOL_BY_NAME.get('calculate_mass_percent')!
    const result = tool.execute({ solute_mass: 10, solution_mass: 0 })
    expect(result.ok).toBe(false)
  })

  test('calculate_ppm rejects negative solute mass', () => {
    const tool = TOOL_BY_NAME.get('calculate_ppm')!
    const result = tool.execute({ solute_mass_mg: -1, solution_volume_L: 1 })
    expect(result.ok).toBe(false)
  })

  test('calculate_osmotic_pressure rejects zero molarity', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    const result = tool.execute({ molarity: 0, temperature_K: 298 })
    expect(result.ok).toBe(false)
  })

  test('calculate_osmotic_pressure rejects vant_hoff < 1', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    const result = tool.execute({ molarity: 1, temperature_K: 298, vant_hoff_factor: 0.5 })
    expect(result.ok).toBe(false)
  })

  test('calculate_boiling_point_elevation rejects negative Kb', () => {
    const tool = TOOL_BY_NAME.get('calculate_boiling_point_elevation')!
    const result = tool.execute({ molality: 1, Kb: -1 })
    expect(result.ok).toBe(false)
  })

  test('calculate_freezing_point_depression rejects negative Kf', () => {
    const tool = TOOL_BY_NAME.get('calculate_freezing_point_depression')!
    const result = tool.execute({ molality: 1, Kf: -1 })
    expect(result.ok).toBe(false)
  })

  test('calculate_stock_prep rejects unsupported unit', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 1, target_volume: 1, molar_mass: 58, unit: 'M' })
    expect(result.ok).toBe(false)
  })

  test('convert_concentration rejects unsupported from_unit', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    const result = tool.execute({ value: 1, from_unit: 'foo', to_unit: 'g/L' })
    expect(result.ok).toBe(false)
  })

  test('convert_concentration rejects missing molar_mass for mol/L', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    const result = tool.execute({ value: 1, from_unit: 'mol/L', to_unit: 'g/L' })
    expect(result.ok).toBe(false)
  })

  test('convert_concentration rejects missing density for pct_ww', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    const result = tool.execute({ value: 1, from_unit: 'pct_ww', to_unit: 'g/L', molar_mass: 58 })
    expect(result.ok).toBe(false)
  })

  test('calculate_mixing rejects zero total volume', () => {
    const tool = TOOL_BY_NAME.get('calculate_mixing')!
    const result = tool.execute({ c1: 1, v1: 0, c2: 0, v2: 0 })
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// NaN / Infinity guard
// ──────────────────────────────────────────────────────────

describe('Concentration NaN/Infinity guard', () => {
  test('rejects NaN moles for molarity', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: NaN, volume_L: 1 })
    expect(result.ok).toBe(false)
  })

  test('rejects Infinity temperature for osmotic pressure', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    const result = tool.execute({ molarity: 1, temperature_K: Infinity })
    expect(result.ok).toBe(false)
  })

  test('rejects null target_conc for stock prep', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: null, target_volume: 1, molar_mass: 58, unit: 'mol/L' })
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// Numerical verification
// ──────────────────────────────────────────────────────────

describe('Concentration numerical verification', () => {
  test('molarity 0.5 mol / 2 L = 0.25 M', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: 0.5, volume_L: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molarity).toBeCloseTo(0.25, 10)
  })

  test('molality 2 mol / 0.5 kg = 4 m', () => {
    const tool = TOOL_BY_NAME.get('calculate_molality')!
    const result = tool.execute({ moles: 2, solvent_mass_kg: 0.5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.molality).toBeCloseTo(4, 10)
  })

  test('osmotic pressure π = iMRT', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    const result = tool.execute({ molarity: 1, temperature_K: 273.15 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // π = 1 * 0.08206 * 273.15 ≈ 22.41 atm
    expect(result.value.osmotic_pressure_atm).toBeCloseTo(22.41, 1)
  })
})

// ──────────────────────────────────────────────────────────
// R1 review fixes (สมหมาย Wave A)
// ──────────────────────────────────────────────────────────

describe('Concentration R1 fixes', () => {
  test('stock_prep rejects pct_ww (density ≈1 assumption not verifiable)', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 10, target_volume: 1, molar_mass: 58.44, unit: 'pct_ww' })
    expect(result.ok).toBe(false)
  })

  test('stock_prep rejects N (equivalents factor assumption)', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 1, target_volume: 1, molar_mass: 98, unit: 'N' })
    expect(result.ok).toBe(false)
  })

  test('stock_prep g/L works without molar_mass (mass-based)', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 5, target_volume: 2, unit: 'g/L' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.mass_needed_g).toBeCloseTo(10, 6)
  })

  test('stock_prep mol/L requires molar_mass', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    const result = tool.execute({ target_conc: 1, target_volume: 1, unit: 'mol/L' })
    expect(result.ok).toBe(false)
  })

  test('molarity rejects both moles and mass paths (ambiguous)', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    const result = tool.execute({ moles: 2, mass_grams: 58.44, molar_mass: 58.44, volume_L: 1 })
    expect(result.ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// R3 review fixes (สมหมาย): subnormal magnitude guard
// ──────────────────────────────────────────────────────────

describe('Concentration R3 fixes', () => {
  test('osmotic_pressure rejects subnormal molarity (underflow → 0)', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    expect(tool.execute({ molarity: 5e-324, temperature_K: 298 }).ok).toBe(false)
  })

  test('stock_prep rejects subnormal target_conc (would weigh 0 g)', () => {
    const tool = TOOL_BY_NAME.get('calculate_stock_prep')!
    expect(tool.execute({ target_conc: 5e-324, target_volume: 1, unit: 'mg/L' }).ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// R5 review fixes (สมหมาย): string-underflow guard
// ──────────────────────────────────────────────────────────

describe('Concentration R5 fixes', () => {
  test('molarity rejects underflow string moles "1e-324"', () => {
    const tool = TOOL_BY_NAME.get('calculate_molarity')!
    expect(tool.execute({ moles: '1e-324', volume_L: 1 }).ok).toBe(false)
  })

  test('molality rejects underflow string "1e-324"', () => {
    const tool = TOOL_BY_NAME.get('calculate_molality')!
    expect(tool.execute({ moles: '1e-324', solvent_mass_kg: 1 }).ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// R7 review fixes (สมหมาย): convert_concentration domain guards
// ──────────────────────────────────────────────────────────

describe('Concentration R7 fixes', () => {
  test('convert rejects %v/v <-> %w/w (needs two densities)', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    expect(tool.execute({ value: 10, from_unit: 'pct_vv', to_unit: 'pct_ww', density: 0.789 }).ok).toBe(false)
  })

  test('convert rejects %v/v input > 100', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    expect(tool.execute({ value: 150, from_unit: 'pct_vv', to_unit: 'g/L', density: 0.789 }).ok).toBe(false)
  })

  test('convert rejects %w/w input > 100', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    expect(tool.execute({ value: 150, from_unit: 'pct_ww', to_unit: 'g/L', density: 1.0 }).ok).toBe(false)
  })

  test('convert %v/v -> g/L still works (value <= 100)', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    const r = tool.execute({ value: 10, from_unit: 'pct_vv', to_unit: 'g/L', density: 0.789 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.converted_value).toBeCloseTo(78.9, 1)
  })

  test('convert rejects result that overflows to > 100% (g/L -> %v/v)', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    expect(tool.execute({ value: 2000, from_unit: 'g/L', to_unit: 'pct_vv', density: 0.789 }).ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// R23 review fixes (สมหมาย): optional fields present-but-invalid must reject
// ──────────────────────────────────────────────────────────

describe('Concentration R23 fixes', () => {
  test('osmotic_pressure rejects present-but-invalid vant_hoff_factor (no silent default)', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    expect(tool.execute({ molarity: 1, temperature_K: 298.15, vant_hoff_factor: '1e-324' }).ok).toBe(false)
  })

  test('osmotic_pressure still defaults vant_hoff when key ABSENT', () => {
    const tool = TOOL_BY_NAME.get('calculate_osmotic_pressure')!
    expect(tool.execute({ molarity: 1, temperature_K: 273.15 }).ok).toBe(true)
  })

  test('bp_elevation rejects bogus Kb (no silent default to 0.512)', () => {
    const tool = TOOL_BY_NAME.get('calculate_boiling_point_elevation')!
    expect(tool.execute({ molality: 1, Kb: 'bogus' }).ok).toBe(false)
  })

  test('bp_elevation still defaults Kb to water when key ABSENT', () => {
    const tool = TOOL_BY_NAME.get('calculate_boiling_point_elevation')!
    const r = tool.execute({ molality: 1 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.delta_tb_C).toBeCloseTo(0.512, 10)
  })

  test('fp_depression rejects bogus Kf', () => {
    const tool = TOOL_BY_NAME.get('calculate_freezing_point_depression')!
    expect(tool.execute({ molality: 1, Kf: 'bogus' }).ok).toBe(false)
  })

  test('convert rejects present-but-invalid equivalents (subnormal)', () => {
    const tool = TOOL_BY_NAME.get('convert_concentration')!
    expect(tool.execute({ value: 1, from_unit: 'N', to_unit: 'mol/L', molar_mass: 58.44, equivalents: '1e-324' }).ok).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// Run all tests
// ──────────────────────────────────────────────────────────

async function runTests() {
  console.log('🧪 VerChem Answer Card Concentration Tests (W3 Day 2 Wave A)')
  console.log('==============================================================\n')

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

  console.log('\n✅ All concentration tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
