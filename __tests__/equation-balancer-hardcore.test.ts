/**
 * VerChem Equation Balancer - Hardcore Test Suite
 * WCP Standard: Tests from EASY to IMPOSSIBLE
 *
 * Purpose: Verify if VerChem can compete with Wolfram Alpha
 */

import { balanceEquation, identifyReactionType } from '../lib/calculations/equation-balancer'

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

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
      }
    },
    toEqual(expected: unknown) {
      const actualStr = JSON.stringify(actual)
      const expectedStr = JSON.stringify(expected)
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${actualStr}`)
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`)
      }
    }
  }
}

console.log('🧪 VerChem Equation Balancer - WCP Hardcore Tests')
console.log('='.repeat(50))
console.log('')

// =====================================================
// LEVEL 1: EASY (High School Basic)
// =====================================================
console.log('📗 LEVEL 1: EASY (High School Basic)')
console.log('-'.repeat(40))

const easyTests = [
  { name: 'Water formation', input: 'H2 + O2 -> H2O', coefficients: [2, 1, 2] },
  { name: 'Ammonia synthesis', input: 'N2 + H2 -> NH3', coefficients: [1, 3, 2] },
  { name: 'Calcium carbonate decomposition', input: 'CaCO3 -> CaO + CO2', coefficients: [1, 1, 1] },
  { name: 'Rust formation', input: 'Fe + O2 -> Fe2O3', coefficients: [4, 3, 2] },
  { name: 'Simple neutralization', input: 'HCl + NaOH -> NaCl + H2O', coefficients: [1, 1, 1, 1] },
]

easyTests.forEach(({ name, input, coefficients }) => {
  test(`${name}: ${input}`, () => {
    const result = balanceEquation(input)
    expect(result.isBalanced).toBe(true)
    expect(result.coefficients).toEqual(coefficients)
  })
})

console.log('')

// =====================================================
// LEVEL 2: MEDIUM (High School Advanced)
// =====================================================
console.log('📘 LEVEL 2: MEDIUM (High School Advanced)')
console.log('-'.repeat(40))

const mediumTests = [
  { name: 'Methane combustion', input: 'CH4 + O2 -> CO2 + H2O', coefficients: [1, 2, 1, 2] },
  { name: 'Propane combustion', input: 'C3H8 + O2 -> CO2 + H2O', coefficients: [1, 5, 3, 4] },
  { name: 'Photosynthesis', input: 'CO2 + H2O -> C6H12O6 + O2', coefficients: [6, 6, 1, 6] },
  { name: 'Sulfuric acid neutralization', input: 'H2SO4 + NaOH -> Na2SO4 + H2O', coefficients: [1, 2, 1, 2] },
  { name: 'Aluminum oxide formation', input: 'Al + O2 -> Al2O3', coefficients: [4, 3, 2] },
  { name: 'H2O2 decomposition', input: 'H2O2 -> H2O + O2', coefficients: [2, 2, 1] },
  { name: 'Thermite reaction', input: 'Al + Fe2O3 -> Al2O3 + Fe', coefficients: [2, 1, 1, 2] },
  { name: 'Sodium + Water', input: 'Na + H2O -> NaOH + H2', coefficients: [2, 2, 2, 1] },
]

mediumTests.forEach(({ name, input, coefficients }) => {
  test(`${name}: ${input}`, () => {
    const result = balanceEquation(input)
    expect(result.isBalanced).toBe(true)
    expect(result.coefficients).toEqual(coefficients)
  })
})

console.log('')

// =====================================================
// LEVEL 3: HARD (University Level)
// =====================================================
console.log('📙 LEVEL 3: HARD (University Level)')
console.log('-'.repeat(40))

const hardTests = [
  { name: 'Glucose combustion', input: 'C6H12O6 + O2 -> CO2 + H2O', coefficients: [1, 6, 6, 6] },
  { name: 'Ethanol combustion', input: 'C2H5OH + O2 -> CO2 + H2O', coefficients: [1, 3, 2, 3] },
  { name: 'Octane combustion', input: 'C8H18 + O2 -> CO2 + H2O', coefficients: [2, 25, 16, 18] },
  { name: 'Cu + Dilute HNO3', input: 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O', coefficients: [3, 8, 3, 2, 4] },
  { name: 'Cu + Conc HNO3', input: 'Cu + HNO3 -> Cu(NO3)2 + NO2 + H2O', coefficients: [1, 4, 1, 2, 2] },
  { name: 'Phosphoric acid neutralization', input: 'H3PO4 + NaOH -> Na3PO4 + H2O', coefficients: [1, 3, 1, 3] },
  { name: 'KClO3 decomposition', input: 'KClO3 -> KCl + O2', coefficients: [2, 2, 3] },
  { name: 'FeCl3 + NaOH', input: 'FeCl3 + NaOH -> Fe(OH)3 + NaCl', coefficients: [1, 3, 1, 3] },
]

hardTests.forEach(({ name, input, coefficients }) => {
  test(`${name}: ${input}`, () => {
    const result = balanceEquation(input)
    expect(result.isBalanced).toBe(true)
    expect(result.coefficients).toEqual(coefficients)
  })
})

console.log('')

// =====================================================
// LEVEL 4: VERY HARD (Competition Level)
// =====================================================
console.log('📕 LEVEL 4: VERY HARD (Competition Level)')
console.log('-'.repeat(40))

const veryHardTests = [
  { name: 'KMnO4 + HCl (Classic redox)', input: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', coefficients: [2, 16, 2, 2, 5, 8] },
  { name: 'K2Cr2O7 + FeSO4 + H2SO4', input: 'K2Cr2O7 + FeSO4 + H2SO4 -> Cr2(SO4)3 + Fe2(SO4)3 + K2SO4 + H2O', coefficients: [1, 6, 7, 1, 3, 1, 7] },
  { name: 'Benzene combustion', input: 'C6H6 + O2 -> CO2 + H2O', coefficients: [2, 15, 12, 6] },
  { name: 'Ca3(PO4)2 + H2SO4', input: 'Ca3(PO4)2 + H2SO4 -> CaSO4 + H3PO4', coefficients: [1, 3, 3, 2] },
  { name: '(NH4)2Cr2O7 decomposition', input: '(NH4)2Cr2O7 -> Cr2O3 + N2 + H2O', coefficients: [1, 1, 1, 4] },
  { name: 'Zn + HNO3 (very dilute)', input: 'Zn + HNO3 -> Zn(NO3)2 + NH4NO3 + H2O', coefficients: [4, 10, 4, 1, 3] },
]

veryHardTests.forEach(({ name, input, coefficients }) => {
  test(`${name}: ${input}`, () => {
    const result = balanceEquation(input)
    if (!result.isBalanced) {
      console.log(`   Got coefficients: ${JSON.stringify(result.coefficients)}`)
    }
    expect(result.isBalanced).toBe(true)
    expect(result.coefficients).toEqual(coefficients)
  })
})

console.log('')

// =====================================================
// LEVEL 5: EXTREME (Olympiad Level)
// =====================================================
console.log('🔥 LEVEL 5: EXTREME (Olympiad Level)')
console.log('-'.repeat(40))

const extremeTests = [
  { name: 'C12H22O11 + O2 (Sucrose)', input: 'C12H22O11 + O2 -> CO2 + H2O', coefficients: [1, 12, 12, 11] },
  { name: 'Nitroglycerin decomposition', input: 'C3H5N3O9 -> CO2 + H2O + N2 + O2', coefficients: [4, 12, 10, 6, 1] },
  { name: 'Pb(NO3)2 + K2CrO4', input: 'Pb(NO3)2 + K2CrO4 -> PbCrO4 + KNO3', coefficients: [1, 1, 1, 2] },
  { name: 'Al + CuSO4', input: 'Al + CuSO4 -> Al2(SO4)3 + Cu', coefficients: [2, 3, 1, 3] },
]

extremeTests.forEach(({ name, input, coefficients }) => {
  test(`${name}: ${input}`, () => {
    const result = balanceEquation(input)
    if (!result.isBalanced) {
      console.log(`   Got coefficients: ${JSON.stringify(result.coefficients)}`)
    }
    expect(result.isBalanced).toBe(true)
    expect(result.coefficients).toEqual(coefficients)
  })
})

console.log('')

// =====================================================
// SPECIAL CASES
// =====================================================
console.log('🔧 SPECIAL CASES')
console.log('-'.repeat(40))

test('Already balanced: H2O -> H2O', () => {
  const result = balanceEquation('H2O -> H2O')
  expect(result.isBalanced).toBe(true)
})

test('Parentheses: Ca(OH)2 + HCl -> CaCl2 + H2O', () => {
  const result = balanceEquation('Ca(OH)2 + HCl -> CaCl2 + H2O')
  expect(result.isBalanced).toBe(true)
  expect(result.coefficients).toEqual([1, 2, 1, 2])
})

test('Physical states: NaCl(aq) + AgNO3(aq) -> AgCl(s) + NaNO3(aq)', () => {
  const result = balanceEquation('NaCl(aq) + AgNO3(aq) -> AgCl(s) + NaNO3(aq)')
  expect(result.isBalanced).toBe(true)
})

test('Invalid equation should not balance', () => {
  const result = balanceEquation('This is not an equation')
  expect(result.isBalanced).toBe(false)
})

console.log('')

// =====================================================
// REACTION TYPE IDENTIFICATION
// =====================================================
console.log('🏷️ REACTION TYPE IDENTIFICATION')
console.log('-'.repeat(40))

test('Synthesis: H2 + O2 -> H2O', () => {
  expect(identifyReactionType('H2 + O2 -> H2O')).toBe('synthesis')
})

test('Decomposition: CaCO3 -> CaO + CO2', () => {
  expect(identifyReactionType('CaCO3 -> CaO + CO2')).toBe('decomposition')
})

test('Combustion: CH4 + O2 -> CO2 + H2O', () => {
  expect(identifyReactionType('CH4 + O2 -> CO2 + H2O')).toBe('combustion')
})

test('Acid-base: HCl + NaOH -> NaCl + H2O', () => {
  expect(identifyReactionType('HCl + NaOH -> NaCl + H2O')).toBe('acid-base')
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(40))

const perfTests = [
  'H2 + O2 -> H2O',
  'CH4 + O2 -> CO2 + H2O',
  'C6H12O6 + O2 -> CO2 + H2O',
  'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O',
]

perfTests.forEach(eq => {
  const start = Date.now()
  const result = balanceEquation(eq)
  const elapsed = Date.now() - start
  const status = elapsed < 1000 ? '✅' : '❌'
  console.log(`${status} ${eq}: ${elapsed}ms (balanced: ${result.isBalanced})`)
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
  console.log('🏆 ALL TESTS PASSED! VerChem Equation Balancer is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

// Exit with error code if tests failed
process.exit(failed > 0 ? 1 : 0)
