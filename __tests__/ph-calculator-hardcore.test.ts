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
  calculateStrongAcidPH,
  calculateStrongBasePH,
  calculateWeakAcidPH,
  calculateWeakBasePH,
  hendersonHasselbalch,
  calculateBufferCapacity,
  pHToPOH,
  pOHToPH,
  KW_25C,
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
  { name: '1 M Acetic acid', conc: 1, Ka: 1.8e-5, expectedPH: 2.37 },

  // Hydrofluoric acid HF, Ka = 6.8e-4
  { name: '0.1 M HF', conc: 0.1, Ka: 6.8e-4, expectedPH: 2.09 },

  // Formic acid HCOOH, Ka = 1.8e-4
  { name: '0.1 M Formic acid', conc: 0.1, Ka: 1.8e-4, expectedPH: 2.37 },

  // Benzoic acid, Ka = 6.3e-5
  { name: '0.05 M Benzoic acid', conc: 0.05, Ka: 6.3e-5, expectedPH: 2.75 },

  // Very weak acid (high ionization - tests quadratic formula)
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
  { name: '1 M Ammonia', conc: 1, Kb: 1.8e-5, expectedPH: 11.63 },

  // Methylamine CH3NH2, Kb = 4.4e-4
  { name: '0.1 M Methylamine', conc: 0.1, Kb: 4.4e-4, expectedPH: 11.82 },

  // Pyridine C5H5N, Kb = 1.7e-9
  { name: '0.1 M Pyridine', conc: 0.1, Kb: 1.7e-9, expectedPH: 8.61 },
]

weakBaseTests.forEach(({ name, conc, Kb, expectedPH }) => {
  test(`${name}: pH ≈ ${expectedPH}`, () => {
    const result = calculateWeakBasePH(conc, Kb)
    expect(result.pH).toBeCloseTo(expectedPH, 0.15)
    console.log(`   pH: ${result.pH.toFixed(2)}, ionization: ${result.percentIonization.toFixed(1)}%, method: ${result.method}`)
  })
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

test('Vinegar (~0.8 M acetic acid): pH ~2.4', () => {
  const result = calculateWeakAcidPH(0.8, 1.8e-5)
  expect(result.pH).toBeCloseTo(2.4, 0.2)
  console.log(`   Vinegar pH: ${result.pH.toFixed(2)}`)
})

test('Blood buffer (pH 7.4): HCO3-/H2CO3 system', () => {
  // Blood maintains pH ~7.4 using bicarbonate buffer (pKa = 6.1)
  // [HCO3-]/[H2CO3] ratio ≈ 20:1
  const pH = hendersonHasselbalch(6.1, 1, 20)
  expect(pH).toBeCloseTo(7.4, 0.1)
  console.log(`   Blood pH: ${pH.toFixed(2)}`)
})

test('Household ammonia (~1 M NH3): pH ~11.6', () => {
  const result = calculateWeakBasePH(1, 1.8e-5)
  expect(result.pH).toBeCloseTo(11.6, 0.2)
  console.log(`   Ammonia cleaner pH: ${result.pH.toFixed(2)}`)
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
