/**
 * VerChem pH Calculator - Hardcore Test Suite
 * WCP Standard: Tests against textbook values and Wolfram Alpha
 *
 * Tests cover:
 * - Strong acids (including very dilute)
 * - Strong bases (including very dilute)
 * - Weak acids (various Ka values)
 * - Weak bases (various Kb values)
 * - Buffer solutions (Henderson-Hasselbalch)
 * - Edge cases and extreme values
 */

import {
  calculatePH,
  calculatePOH,
  calculateH_Concentration,
  calculatePHConversion,
  calculateStrongAcidPH,
  calculateStrongBasePH,
  calculateWeakAcidPH,
  calculateWeakBasePH,
  hendersonHasselbalch,
  calculateBufferCapacity,
  pHToPOH,
  pOHToPH,
  KW_25C,
  WEAK_ELECTROLYTE_MODEL_25C,
} from '../lib/calculations/solutions'

// Test counters
let passed = 0
let failed = 0
const failures: string[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`✅ ${name}`)
  } catch (error) {
    failed++
    const msg = error instanceof Error ? error.message : String(error)
    failures.push(`${name}: ${msg}`)
    console.log(`❌ ${name}`)
    console.log(`   Error: ${msg}`)
  }
}

function expectCloseTo(actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected)
  if (diff > tolerance) {
    throw new Error(`Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)}, tolerance: ${tolerance})`)
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
      }
    },
    toBeCloseTo(expected: number, tolerance: number = 0.01) {
      if (typeof actual !== 'number') {
        throw new Error(`Expected number, got ${typeof actual}`)
      }
      expectCloseTo(actual, expected, tolerance)
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`)
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`)
      }
    }
  }
}

function expectThrows(fn: () => unknown, messagePattern: RegExp) {
  try {
    fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!messagePattern.test(message)) {
      throw new Error(`Expected error matching ${messagePattern}, got: ${message}`)
    }
    return
  }
  throw new Error('Expected calculation to reject unsupported input')
}

console.log('🧪 VerChem pH Calculator - WCP Hardcore Tests')
console.log('='.repeat(50))
console.log('')

// =====================================================
// BASIC pH/pOH CONVERSIONS
// =====================================================
console.log('📗 BASIC pH/pOH CONVERSIONS')
console.log('-'.repeat(40))

test('pH from [H+] = 1e-7 (neutral) = 7', () => {
  expect(calculatePH(1e-7)).toBeCloseTo(7, 0.001)
})

test('pH from [H+] = 0.01 M = 2', () => {
  expect(calculatePH(0.01)).toBeCloseTo(2, 0.001)
})

test('pH from [H+] = 1e-12 M = 12', () => {
  expect(calculatePH(1e-12)).toBeCloseTo(12, 0.001)
})

test('[H+] from pH 3 = 0.001 M', () => {
  expect(calculateH_Concentration(3)).toBeCloseTo(0.001, 0.0001)
})

test('pOH from [OH-] = 1e-7 (neutral) = 7', () => {
  expect(calculatePOH(1e-7)).toBeCloseTo(7, 0.001)
})

test('pH + pOH = 14 at 25°C', () => {
  expect(pHToPOH(3)).toBeCloseTo(11, 0.001)
  expect(pOHToPH(5)).toBeCloseTo(9, 0.001)
})

test('all four conversion inputs resolve through one declared pH model', () => {
  const expected = {
    pH: 7,
    pOH: 7,
    H_concentration: 1e-7,
    OH_concentration: 1e-7,
  }
  for (const [source, value] of [
    ['ph', 7],
    ['poh', 7],
    ['h-concentration', 1e-7],
    ['oh-concentration', 1e-7],
  ] as const) {
    const result = calculatePHConversion(source, value)
    expect(result.pH).toBeCloseTo(expected.pH, 1e-12)
    expect(result.pOH).toBeCloseTo(expected.pOH, 1e-12)
    expect(result.H_concentration).toBeCloseTo(expected.H_concentration, 1e-12)
    expect(result.OH_concentration).toBeCloseTo(expected.OH_concentration, 1e-12)
  }
})

test('conversion supports finite pH outside the conventional 0-14 teaching range', () => {
  const acidic = calculatePHConversion('ph', -1)
  const basic = calculatePHConversion('poh', -1)
  expect(acidic.H_concentration).toBeCloseTo(10, 1e-12)
  expect(acidic.pOH).toBeCloseTo(15, 1e-12)
  expect(basic.OH_concentration).toBeCloseTo(10, 1e-12)
  expect(basic.pH).toBeCloseTo(15, 1e-12)
})

console.log('')

// =====================================================
// STRONG ACIDS - STANDARD CONCENTRATIONS
// =====================================================
console.log('📘 STRONG ACIDS - STANDARD CONCENTRATIONS')
console.log('-'.repeat(40))

const strongAcidTests = [
  { name: '1 M HCl', conc: 1, formula: 'HCl', expectedPH: 0 },
  { name: '0.1 M HCl', conc: 0.1, formula: 'HCl', expectedPH: 1 },
  { name: '0.01 M HCl', conc: 0.01, formula: 'HCl', expectedPH: 2 },
  { name: '0.001 M HCl', conc: 0.001, formula: 'HCl', expectedPH: 3 },
  { name: '1 M HNO3', conc: 1, formula: 'HNO3', expectedPH: 0 },
  { name: '0.05 M HBr', conc: 0.05, formula: 'HBr', expectedPH: 1.30 },
]

strongAcidTests.forEach(({ name, conc, formula, expectedPH }) => {
  test(`${name}: pH ≈ ${expectedPH}`, () => {
    const result = calculateStrongAcidPH(conc, { formula })
    expect(result.pH).toBeCloseTo(expectedPH, 0.05)
  })
})

console.log('')

// =====================================================
// STRONG ACIDS - VERY DILUTE (Water autoionization matters!)
// =====================================================
console.log('📙 STRONG ACIDS - VERY DILUTE (Autoionization Test)')
console.log('-'.repeat(40))

// At very low concentrations, water autoionization affects pH
// Pure water: [H+] = 1e-7, pH = 7
// Very dilute acid should approach but not exceed pH 7

test('1e-7 M HCl: pH < 7 (not exactly 7 due to water)', () => {
  const result = calculateStrongAcidPH(1e-7, { formula: 'HCl' })
  // Expected: ~6.79 (considering water autoionization)
  expect(result.pH).toBeLessThan(7)
  expect(result.pH).toBeGreaterThan(6.5)
  console.log(`   Actual pH: ${result.pH.toFixed(4)} (expected ~6.79)`)
})

test('1e-8 M HCl: pH approaches 7 but still acidic', () => {
  const result = calculateStrongAcidPH(1e-8, { formula: 'HCl' })
  // Expected: ~6.98
  expect(result.pH).toBeLessThan(7)
  expect(result.pH).toBeGreaterThan(6.9)
  console.log(`   Actual pH: ${result.pH.toFixed(4)} (expected ~6.98)`)
})

test('1e-10 M HCl: pH ≈ 7 (essentially neutral)', () => {
  const result = calculateStrongAcidPH(1e-10, { formula: 'HCl' })
  // Water dominates, pH ≈ 7
  expect(result.pH).toBeCloseTo(7, 0.05)
  console.log(`   Actual pH: ${result.pH.toFixed(4)} (expected ~7.00)`)
})

console.log('')

// =====================================================
// DIPROTIC STRONG ACID: H2SO4
// =====================================================
console.log('📕 DIPROTIC ACID: H2SO4 (Ka2 consideration)')
console.log('-'.repeat(40))

test('0.1 M H2SO4: pH ≈ 0.96 (both protons)', () => {
  // H2SO4 is strong for first proton, Ka2 = 0.012 for second
  const result = calculateStrongAcidPH(0.1, { formula: 'H2SO4' })
  // Expected: ~0.96-1.0 (considering partial second dissociation)
  expect(result.pH).toBeCloseTo(0.96, 0.1)
  console.log(`   Actual pH: ${result.pH.toFixed(4)}`)
})

test('0.01 M H2SO4: pH ≈ 1.85', () => {
  const result = calculateStrongAcidPH(0.01, { formula: 'H2SO4' })
  // At lower concentration, second proton contributes more
  expect(result.pH).toBeCloseTo(1.85, 0.15)
  console.log(`   Actual pH: ${result.pH.toFixed(4)}`)
})

console.log('')

// =====================================================
// STRONG BASES
// =====================================================
console.log('📗 STRONG BASES')
console.log('-'.repeat(40))

const strongBaseTests = [
  { name: '1 M NaOH', conc: 1, formula: 'NaOH', expectedPH: 14 },
  { name: '0.1 M NaOH', conc: 0.1, formula: 'NaOH', expectedPH: 13 },
  { name: '0.01 M NaOH', conc: 0.01, formula: 'NaOH', expectedPH: 12 },
  { name: '0.001 M KOH', conc: 0.001, formula: 'KOH', expectedPH: 11 },
  { name: '0.1 M Ca(OH)2 (dibasic)', conc: 0.1, formula: 'Ca(OH)2', expectedPH: 13.30 },
]

strongBaseTests.forEach(({ name, conc, formula, expectedPH }) => {
  test(`${name}: pH ≈ ${expectedPH}`, () => {
    const result = calculateStrongBasePH(conc, { formula })
    expect(result.pH).toBeCloseTo(expectedPH, 0.1)
  })
})

test('strong-acid/base identity must be resolved instead of defaulting to factor 1', () => {
  let acidRejected = false
  let baseRejected = false
  try {
    calculateStrongAcidPH(0.1)
  } catch (error) {
    acidRejected = error instanceof Error && /formula|protonCount/i.test(error.message)
  }
  try {
    calculateStrongBasePH(0.1)
  } catch (error) {
    baseRejected = error instanceof Error && /formula|hydroxideCount/i.test(error.message)
  }
  expect(acidRejected).toBe(true)
  expect(baseRejected).toBe(true)
})

test('strong species result records resolved identity and stoichiometric factor', () => {
  const acid = calculateStrongAcidPH(0.1, { formula: 'H2SO4' })
  const base = calculateStrongBasePH(0.1, { formula: 'Ca(OH)2' })
  expect(acid.resolved.identity).toBe('H2SO4')
  expect(acid.resolved.stoichiometricFactor).toBe(2)
  expect(base.resolved.identity).toBe('Ca(OH)2')
  expect(base.resolved.stoichiometricFactor).toBe(2)
})

console.log('')

// =====================================================
// WEAK ACIDS - VARIOUS Ka VALUES
// =====================================================
console.log('📘 WEAK ACIDS - VARIOUS Ka VALUES')
console.log('-'.repeat(40))

const weakAcidTests = [
  // Acetic acid CH3COOH, Ka = 1.8e-5, pKa = 4.76
  { name: '0.1 M Acetic acid', conc: 0.1, Ka: 1.8e-5, expectedPH: 2.87 },
  { name: '0.01 M Acetic acid', conc: 0.01, Ka: 1.8e-5, expectedPH: 3.37 },

  // Hydrofluoric acid HF, Ka = 6.8e-4
  { name: '0.1 M HF', conc: 0.1, Ka: 6.8e-4, expectedPH: 2.09 },

  // Formic acid HCOOH, Ka = 1.8e-4
  { name: '0.1 M Formic acid', conc: 0.1, Ka: 1.8e-4, expectedPH: 2.37 },

  // Benzoic acid, Ka = 6.3e-5
  { name: '0.05 M Benzoic acid', conc: 0.05, Ka: 6.3e-5, expectedPH: 2.75 },

  // Dilute HF has high ionization and exercises the full-equilibrium solver.
  { name: '0.001 M HF (high ionization)', conc: 0.001, Ka: 6.8e-4, expectedPH: 3.26 },
]

weakAcidTests.forEach(({ name, conc, Ka, expectedPH }) => {
  test(`${name}: pH ≈ ${expectedPH}`, () => {
    const result = calculateWeakAcidPH(conc, Ka)
    expect(result.pH).toBeCloseTo(expectedPH, 0.15)
    console.log(`   pH: ${result.pH.toFixed(2)}, ionization: ${result.percentIonization.toFixed(1)}%, method: ${result.method}`)
  })
})

console.log('')

// =====================================================
// WEAK BASES - VARIOUS Kb VALUES
// =====================================================
console.log('📙 WEAK BASES - VARIOUS Kb VALUES')
console.log('-'.repeat(40))

const weakBaseTests = [
  // Ammonia NH3, Kb = 1.8e-5
  { name: '0.1 M Ammonia', conc: 0.1, Kb: 1.8e-5, expectedPH: 11.13 },
  { name: '0.01 M Ammonia', conc: 0.01, Kb: 1.8e-5, expectedPH: 10.63 },

  // Methylamine CH3NH2, Kb = 4.4e-4
  { name: '0.1 M Methylamine', conc: 0.1, Kb: 4.4e-4, expectedPH: 11.82 },

  // Pyridine C5H5N, Kb = 1.7e-9
  { name: '0.1 M Pyridine', conc: 0.1, Kb: 1.7e-9, expectedPH: 9.12 },
]

weakBaseTests.forEach(({ name, conc, Kb, expectedPH }) => {
  test(`${name}: pH ≈ ${expectedPH}`, () => {
    const result = calculateWeakBasePH(conc, Kb)
    expect(result.pH).toBeCloseTo(expectedPH, 0.15)
    console.log(`   pH: ${result.pH.toFixed(2)}, ionization: ${result.percentIonization.toFixed(1)}%, method: ${result.method}`)
  })
})

// Independent reference values (not generated by the production solver):
// Python Decimal, 80-digit arithmetic, 400-step bisection on the cubic from
// mass balance + electroneutrality + Kw. The equilibrium derivation follows
// Brown, LeMay & Bursten, Chemistry: The Central Science, 15th ed., Ch. 16.
const weakAcidFullEquilibriumReferences = [
  { concentration: 1e-2, pH: 3.3887826355805363 },
  { concentration: 1e-4, pH: 4.469658229473239 },
  { concentration: 1e-6, pH: 6.018526099152808 },
  { concentration: 1e-7, pH: 6.792796168395915 },
  { concentration: 1e-8, pH: 6.978424518170207 },
  { concentration: 1e-9, pH: 6.997841006380972 },
] as const

const weakBaseFullEquilibriumReferences = [
  { concentration: 1e-2, pH: 10.61842417902796 },
  { concentration: 1e-4, pH: 9.536188030240551 },
  { concentration: 1e-6, pH: 7.982179014176247 },
  { concentration: 1e-7, pH: 7.20726258493639 },
  { concentration: 1e-8, pH: 7.021579795578955 },
  { concentration: 1e-9, pH: 7.002159406957904 },
] as const

test('weak acid full equilibrium matches independent references from 1e-2 to 1e-9 M', () => {
  for (const reference of weakAcidFullEquilibriumReferences) {
    const result = calculateWeakAcidPH(reference.concentration, 1.74e-5)
    expect(result.pH).toBeCloseTo(reference.pH, 1e-10)
    expect(result.pH).toBeLessThan(7)
    expect(result.percentIonization).toBeLessThan(100.0000001)
    expect(result.method).toBe('full-equilibrium')
  }
})

test('weak base full equilibrium matches independent references from 1e-2 to 1e-9 M', () => {
  for (const reference of weakBaseFullEquilibriumReferences) {
    const result = calculateWeakBasePH(reference.concentration, 1.8e-5)
    expect(result.pH).toBeCloseTo(reference.pH, 1e-10)
    expect(result.pH).toBeGreaterThan(7)
    expect(result.percentIonization).toBeLessThan(100.0000001)
    expect(result.method).toBe('full-equilibrium')
  }
})

test('diluting a weak acid approaches pH 7 monotonically from below', () => {
  const values = weakAcidFullEquilibriumReferences.map(({ concentration }) =>
    calculateWeakAcidPH(concentration, 1.74e-5).pH
  )
  for (let index = 1; index < values.length; index += 1) {
    expect(values[index]).toBeGreaterThan(values[index - 1] as number)
    expect(values[index]).toBeLessThan(7)
  }
})

test('diluting a weak base approaches pH 7 monotonically from above', () => {
  const values = weakBaseFullEquilibriumReferences.map(({ concentration }) =>
    calculateWeakBasePH(concentration, 1.8e-5).pH
  )
  for (let index = 1; index < values.length; index += 1) {
    expect(values[index]).toBeLessThan(values[index - 1] as number)
    expect(values[index]).toBeGreaterThan(7)
  }
})

test('weak-electrolyte result declares ideal-dilute 25 C Kw applicability', () => {
  const result = calculateWeakAcidPH(1e-8, 1.74e-5)
  expect(result.applicability).toBe(WEAK_ELECTROLYTE_MODEL_25C)
  expect(result.applicability.regime).toBe('ideal-dilute')
  expect(result.applicability.temperatureC).toBe(25)
  expect(result.applicability.kw).toBe(1e-14)
  expect(result.pH).toBeCloseTo(6.978424518170207, 1e-12)
})

test('weak-electrolyte solver rejects non-positive or non-ideal-range inputs', () => {
  expectThrows(() => calculateWeakAcidPH(0, 1.74e-5), /positive/i)
  expectThrows(() => calculateWeakBasePH(-1e-8, 1.8e-5), /positive/i)
  expectThrows(() => calculateWeakAcidPH(0.1000001, 1.74e-5), /ideal-dilute/i)
  expectThrows(() => calculateWeakBasePH(1, 1.8e-5), /activity-corrected/i)
  expectThrows(() => calculateWeakAcidPH(0.1, 2), /weak-electrolyte/i)
})

console.log('')

// =====================================================
// BUFFER SOLUTIONS (Henderson-Hasselbalch)
// =====================================================
console.log('📕 BUFFER SOLUTIONS (Henderson-Hasselbalch)')
console.log('-'.repeat(40))

const bufferTests = [
  // Acetate buffer at equal concentrations
  { name: 'Acetate buffer 1:1 ratio', pKa: 4.76, acid: 0.1, base: 0.1, expectedPH: 4.76 },

  // Acetate buffer with more base
  { name: 'Acetate buffer 1:2 ratio', pKa: 4.76, acid: 0.1, base: 0.2, expectedPH: 5.06 },

  // Acetate buffer with more acid
  { name: 'Acetate buffer 2:1 ratio', pKa: 4.76, acid: 0.2, base: 0.1, expectedPH: 4.46 },

  // Phosphate buffer (first pKa)
  { name: 'Phosphate buffer 1:1', pKa: 7.20, acid: 0.1, base: 0.1, expectedPH: 7.20 },

  // Ammonia buffer
  { name: 'Ammonia buffer 1:1 (pKa=9.25)', pKa: 9.25, acid: 0.1, base: 0.1, expectedPH: 9.25 },

  // Buffer with 10:1 ratio
  { name: 'Acetate buffer 1:10 ratio', pKa: 4.76, acid: 0.01, base: 0.1, expectedPH: 5.76 },
]

bufferTests.forEach(({ name, pKa, acid, base, expectedPH }) => {
  test(`${name}: pH ≈ ${expectedPH}`, () => {
    const pH = hendersonHasselbalch(pKa, acid, base)
    expect(pH).toBeCloseTo(expectedPH, 0.05)
  })
})

console.log('')

// =====================================================
// BUFFER CAPACITY
// =====================================================
console.log('📗 BUFFER CAPACITY')
console.log('-'.repeat(40))

test('Buffer capacity is maximum at pH = pKa', () => {
  const pKa = 4.76
  const totalConc = 0.1

  const capacityAtPKa = calculateBufferCapacity(totalConc, pKa, pKa)
  const capacityOff1 = calculateBufferCapacity(totalConc, pKa + 1, pKa)
  const capacityOff2 = calculateBufferCapacity(totalConc, pKa + 2, pKa)

  expect(capacityAtPKa).toBeGreaterThan(capacityOff1)
  expect(capacityOff1).toBeGreaterThan(capacityOff2)
  console.log(`   At pKa: ${capacityAtPKa.toFixed(4)}`)
  console.log(`   At pKa+1: ${capacityOff1.toFixed(4)}`)
  console.log(`   At pKa+2: ${capacityOff2.toFixed(4)}`)
})

test('Higher concentration = higher buffer capacity', () => {
  const pKa = 4.76
  const pH = pKa

  const capacity01 = calculateBufferCapacity(0.1, pH, pKa)
  const capacity1 = calculateBufferCapacity(1, pH, pKa)

  expect(capacity1).toBeGreaterThan(capacity01)
  console.log(`   0.1 M: ${capacity01.toFixed(4)}`)
  console.log(`   1.0 M: ${capacity1.toFixed(4)}`)
})

console.log('')

// =====================================================
// EDGE CASES & SPECIAL VALUES
// =====================================================
console.log('🔧 EDGE CASES & SPECIAL VALUES')
console.log('-'.repeat(40))

test('Very concentrated acid: 10 M HCl → pH ≈ -1', () => {
  const result = calculateStrongAcidPH(10, { formula: 'HCl' })
  expect(result.pH).toBeCloseTo(-1, 0.1)
})

test('Kw at 25°C = 1e-14', () => {
  expect(KW_25C).toBe(1e-14)
})

test('Neutral water: pH = 7, pOH = 7', () => {
  // pH of pure water
  const pH = calculatePH(1e-7)
  const pOH = calculatePOH(1e-7)
  expect(pH).toBeCloseTo(7, 0.001)
  expect(pOH).toBeCloseTo(7, 0.001)
})

test('Very weak acid approaches neutral pH', () => {
  // Very weak acid with Ka = 1e-10 at 0.1 M
  const result = calculateWeakAcidPH(0.1, 1e-10)
  expect(result.pH).toBeGreaterThan(5) // Should not be very acidic
  console.log(`   pH: ${result.pH.toFixed(2)} (very weak acid)`)
})

console.log('')

// =====================================================
// REAL-WORLD EXAMPLES
// =====================================================
console.log('🌍 REAL-WORLD EXAMPLES')
console.log('-'.repeat(40))

test('Stomach acid (~0.01-0.1 M HCl): pH 1-2', () => {
  const result = calculateStrongAcidPH(0.05, { formula: 'HCl' })
  expect(result.pH).toBeGreaterThan(1)
  expect(result.pH).toBeLessThan(2)
  console.log(`   Stomach acid pH: ${result.pH.toFixed(2)}`)
})

test('Vinegar (~0.8 M acetic acid) requires an activity-corrected model', () => {
  expectThrows(() => calculateWeakAcidPH(0.8, 1.8e-5), /activity-corrected/i)
})

test('Blood buffer (pH 7.4): HCO3-/H2CO3 system', () => {
  // Blood maintains pH ~7.4 using bicarbonate buffer (pKa = 6.1)
  // [HCO3-]/[H2CO3] ratio ≈ 20:1
  const pH = hendersonHasselbalch(6.1, 1, 20)
  expect(pH).toBeCloseTo(7.4, 0.1)
  console.log(`   Blood pH: ${pH.toFixed(2)}`)
})

test('Household ammonia (~1 M NH3) requires an activity-corrected model', () => {
  expectThrows(() => calculateWeakBasePH(1, 1.8e-5), /activity-corrected/i)
})

test('Drain cleaner (~1 M NaOH): pH ~14', () => {
  const result = calculateStrongBasePH(1, { formula: 'NaOH' })
  expect(result.pH).toBeCloseTo(14, 0.1)
  console.log(`   Drain cleaner pH: ${result.pH.toFixed(2)}`)
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(40))

const perfTests = [
  () => calculateStrongAcidPH(0.01, { formula: 'HCl' }),
  () => calculateWeakAcidPH(0.1, 1.8e-5),
  () => calculateWeakBasePH(0.1, 1.8e-5),
  () => hendersonHasselbalch(4.76, 0.1, 0.1),
]

perfTests.forEach((fn, i) => {
  const start = Date.now()
  for (let j = 0; j < 10000; j++) fn()
  const elapsed = Date.now() - start
  console.log(`✅ Test ${i + 1}: 10,000 calculations in ${elapsed}ms (${(elapsed / 10000 * 1000).toFixed(2)}µs each)`)
})

console.log('')

// =====================================================
// SUMMARY
// =====================================================
console.log('='.repeat(50))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(50))
console.log(`Total: ${passed + failed}`)
console.log(`Passed: ${passed} ✅`)
console.log(`Failed: ${failed} ❌`)
console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

if (failures.length > 0) {
  console.log('')
  console.log('❌ FAILURES:')
  failures.forEach(f => console.log(`  - ${f}`))
}

console.log('')
if (failed === 0) {
  console.log('🏆 ALL TESTS PASSED! VerChem pH Calculator is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
