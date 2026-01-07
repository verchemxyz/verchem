/**
 * VerChem Stoichiometry Calculator - Hardcore Test Suite
 * WCP Standard: Tests against textbook values and known calculations
 *
 * Tests cover:
 * - Molecular mass calculations
 * - Mole conversions (mass, molecules, volume)
 * - Percent composition
 * - Empirical formula from composition
 * - Limiting reagent
 * - Theoretical/percent yield
 * - Dilution calculations
 */

import {
  calculateMolecularMass,
  massToMoles,
  molesToMass,
  molesToMolecules,
  moleculesToMoles,
  molesToVolumeSTP,
  volumeSTPToMoles,
  calculatePercentComposition,
  calculateEmpiricalFormula,
  findLimitingReagent,
  calculateTheoreticalYield,
  calculatePercentYield,
  calculateDilution,
} from '../lib/calculations/stoichiometry'

import { AVOGADRO_CONSTANT, STP } from '../lib/constants'

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
  const relDiff = expected !== 0 ? diff / Math.abs(expected) : diff
  if (relDiff > tolerance && diff > tolerance) {
    throw new Error(`Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(6)}, rel: ${(relDiff * 100).toFixed(2)}%)`)
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
  }
}

console.log('🧪 VerChem Stoichiometry Calculator - WCP Hardcore Tests')
console.log('='.repeat(55))
console.log('')

// =====================================================
// MOLECULAR MASS CALCULATIONS
// =====================================================
console.log('📗 MOLECULAR MASS CALCULATIONS')
console.log('-'.repeat(45))

const molecularMassTests = [
  // Simple molecules
  { formula: 'H2', expected: 2.016, name: 'Hydrogen gas' },
  { formula: 'O2', expected: 31.998, name: 'Oxygen gas' },
  { formula: 'N2', expected: 28.014, name: 'Nitrogen gas' },
  { formula: 'H2O', expected: 18.015, name: 'Water' },
  { formula: 'CO2', expected: 44.009, name: 'Carbon dioxide' },
  { formula: 'NaCl', expected: 58.44, name: 'Sodium chloride' },
  { formula: 'HCl', expected: 36.46, name: 'Hydrochloric acid' },

  // More complex molecules
  { formula: 'H2SO4', expected: 98.079, name: 'Sulfuric acid' },
  { formula: 'NaOH', expected: 39.997, name: 'Sodium hydroxide' },
  { formula: 'CH4', expected: 16.043, name: 'Methane' },
  { formula: 'C2H5OH', expected: 46.069, name: 'Ethanol' },
  { formula: 'C6H12O6', expected: 180.156, name: 'Glucose' },
  { formula: 'C12H22O11', expected: 342.297, name: 'Sucrose' },

  // Molecules with parentheses
  { formula: 'Ca(OH)2', expected: 74.093, name: 'Calcium hydroxide' },
  { formula: 'Al2(SO4)3', expected: 342.151, name: 'Aluminum sulfate' },
  { formula: 'Ca3(PO4)2', expected: 310.177, name: 'Calcium phosphate' },
  { formula: 'Fe(NO3)3', expected: 241.857, name: 'Iron(III) nitrate' },
  { formula: '(NH4)2SO4', expected: 132.14, name: 'Ammonium sulfate' },

  // Heavy molecules
  { formula: 'C8H18', expected: 114.23, name: 'Octane' },
  { formula: 'C6H5COOH', expected: 122.123, name: 'Benzoic acid' },
]

molecularMassTests.forEach(({ formula, expected, name }) => {
  test(`${name} (${formula}): M = ${expected} g/mol`, () => {
    const result = calculateMolecularMass(formula)
    expect(result).toBeCloseTo(expected, 0.01) // 1% tolerance
  })
})

console.log('')

// =====================================================
// MOLE CONVERSIONS
// =====================================================
console.log('📘 MOLE CONVERSIONS')
console.log('-'.repeat(45))

test('Mass to Moles: 18.015g H2O = 1 mol', () => {
  const molarMass = calculateMolecularMass('H2O')
  const moles = massToMoles(18.015, molarMass)
  expect(moles).toBeCloseTo(1, 0.001)
})

test('Mass to Moles: 58.44g NaCl = 1 mol', () => {
  const molarMass = calculateMolecularMass('NaCl')
  const moles = massToMoles(58.44, molarMass)
  expect(moles).toBeCloseTo(1, 0.001)
})

test('Mass to Moles: 98.079g H2SO4 = 1 mol', () => {
  const molarMass = calculateMolecularMass('H2SO4')
  const moles = massToMoles(98.079, molarMass)
  expect(moles).toBeCloseTo(1, 0.001)
})

test('Moles to Mass: 2 mol H2O = 36.03g', () => {
  const molarMass = calculateMolecularMass('H2O')
  const mass = molesToMass(2, molarMass)
  expect(mass).toBeCloseTo(36.03, 0.01)
})

test('Moles to Mass: 0.5 mol NaCl = 29.22g', () => {
  const molarMass = calculateMolecularMass('NaCl')
  const mass = molesToMass(0.5, molarMass)
  expect(mass).toBeCloseTo(29.22, 0.01)
})

console.log('')

// =====================================================
// AVOGADRO'S NUMBER CONVERSIONS
// =====================================================
console.log('📙 AVOGADRO\'S NUMBER CONVERSIONS')
console.log('-'.repeat(45))

test(`Avogadro constant = 6.02214076e23 (CODATA 2018)`, () => {
  expect(AVOGADRO_CONSTANT).toBe(6.02214076e23)
})

test('1 mol = 6.022e23 molecules', () => {
  const molecules = molesToMolecules(1)
  expect(molecules).toBeCloseTo(6.02214076e23, 0.001)
})

test('6.022e23 molecules = 1 mol', () => {
  const moles = moleculesToMoles(6.02214076e23)
  expect(moles).toBeCloseTo(1, 0.001)
})

test('2 mol = 1.204e24 molecules', () => {
  const molecules = molesToMolecules(2)
  expect(molecules).toBeCloseTo(1.204428152e24, 0.001)
})

test('3.011e23 molecules = 0.5 mol', () => {
  const moles = moleculesToMoles(3.01107038e23)
  expect(moles).toBeCloseTo(0.5, 0.001)
})

console.log('')

// =====================================================
// VOLUME AT STP
// =====================================================
console.log('📕 VOLUME AT STP (IUPAC Standard)')
console.log('-'.repeat(45))

test(`STP molar volume = 22.414 L/mol (CODATA)`, () => {
  expect(STP.molarVolume).toBeCloseTo(22.414, 0.001)
})

test('1 mol gas at STP = 22.414 L', () => {
  const volume = molesToVolumeSTP(1)
  expect(volume).toBeCloseTo(22.414, 0.01)
})

test('22.414 L gas at STP = 1 mol', () => {
  const moles = volumeSTPToMoles(22.414)
  expect(moles).toBeCloseTo(1, 0.01)
})

test('2 mol gas at STP = 44.83 L', () => {
  const volume = molesToVolumeSTP(2)
  expect(volume).toBeCloseTo(44.83, 0.01)
})

test('11.2 L gas at STP = 0.5 mol', () => {
  const moles = volumeSTPToMoles(11.207)
  expect(moles).toBeCloseTo(0.5, 0.01)
})

console.log('')

// =====================================================
// PERCENT COMPOSITION
// =====================================================
console.log('📗 PERCENT COMPOSITION')
console.log('-'.repeat(45))

test('H2O: H = 11.19%, O = 88.81%', () => {
  const composition = calculatePercentComposition('H2O')
  expect(composition.H).toBeCloseTo(11.19, 0.05)
  expect(composition.O).toBeCloseTo(88.81, 0.05)
})

test('CO2: C = 27.29%, O = 72.71%', () => {
  const composition = calculatePercentComposition('CO2')
  expect(composition.C).toBeCloseTo(27.29, 0.05)
  expect(composition.O).toBeCloseTo(72.71, 0.05)
})

test('NaCl: Na = 39.34%, Cl = 60.66%', () => {
  const composition = calculatePercentComposition('NaCl')
  expect(composition.Na).toBeCloseTo(39.34, 0.1)
  expect(composition.Cl).toBeCloseTo(60.66, 0.1)
})

test('C6H12O6 (Glucose): C = 40%, H = 6.7%, O = 53.3%', () => {
  const composition = calculatePercentComposition('C6H12O6')
  expect(composition.C).toBeCloseTo(40, 0.5)
  expect(composition.H).toBeCloseTo(6.7, 0.5)
  expect(composition.O).toBeCloseTo(53.3, 0.5)
})

test('Ca(OH)2: Ca = 54.1%, O = 43.2%, H = 2.7%', () => {
  const composition = calculatePercentComposition('Ca(OH)2')
  expect(composition.Ca).toBeCloseTo(54.1, 0.5)
  expect(composition.O).toBeCloseTo(43.2, 0.5)
  expect(composition.H).toBeCloseTo(2.7, 0.5)
})

console.log('')

// =====================================================
// EMPIRICAL FORMULA FROM COMPOSITION
// =====================================================
console.log('📘 EMPIRICAL FORMULA FROM COMPOSITION')
console.log('-'.repeat(45))

test('40% C, 6.7% H, 53.3% O → CH2O (glucose empirical)', () => {
  const formula = calculateEmpiricalFormula({ C: 40, H: 6.7, O: 53.3 })
  expect(formula).toBe('CH2O')
})

test('27.3% C, 72.7% O → CO2', () => {
  const formula = calculateEmpiricalFormula({ C: 27.3, O: 72.7 })
  expect(formula).toBe('CO2')
})

test('11.2% H, 88.8% O → H2O', () => {
  const formula = calculateEmpiricalFormula({ H: 11.2, O: 88.8 })
  expect(formula).toBe('H2O')
})

test('75% C, 25% H → CH4 (methane)', () => {
  const formula = calculateEmpiricalFormula({ C: 75, H: 25 })
  expect(formula).toBe('CH4')
})

test('52.2% C, 13% H, 34.8% O → C2H6O (ethanol)', () => {
  const formula = calculateEmpiricalFormula({ C: 52.2, H: 13, O: 34.8 })
  expect(formula).toBe('C2H6O')
})

console.log('')

// =====================================================
// LIMITING REAGENT
// =====================================================
console.log('📙 LIMITING REAGENT')
console.log('-'.repeat(45))

test('2H2 + O2 → 2H2O: 2 mol H2 + 2 mol O2 → H2 is limiting', () => {
  const result = findLimitingReagent(
    {
      reactants: [
        { formula: 'H2', moles: 2, coefficient: 2 },
        { formula: 'O2', moles: 2, coefficient: 1 },
      ],
    },
    [{ formula: 'H2O', coefficient: 2 }]
  )
  expect(result.limitingReagent).toBe('H2')
  expect(result.molesProductFormed['H2O']).toBeCloseTo(2, 0.01)
})

test('2H2 + O2 → 2H2O: 4 mol H2 + 1 mol O2 → O2 is limiting', () => {
  const result = findLimitingReagent(
    {
      reactants: [
        { formula: 'H2', moles: 4, coefficient: 2 },
        { formula: 'O2', moles: 1, coefficient: 1 },
      ],
    },
    [{ formula: 'H2O', coefficient: 2 }]
  )
  expect(result.limitingReagent).toBe('O2')
  expect(result.molesProductFormed['H2O']).toBeCloseTo(2, 0.01)
})

test('N2 + 3H2 → 2NH3: 1 mol N2 + 2 mol H2 → H2 is limiting', () => {
  const result = findLimitingReagent(
    {
      reactants: [
        { formula: 'N2', moles: 1, coefficient: 1 },
        { formula: 'H2', moles: 2, coefficient: 3 },
      ],
    },
    [{ formula: 'NH3', coefficient: 2 }]
  )
  expect(result.limitingReagent).toBe('H2')
  // H2 can only make 2/3 mol N2 worth of product = 2 * (2/3) = 1.33 mol NH3
  expect(result.molesProductFormed['NH3']).toBeCloseTo(1.333, 0.01)
})

test('Excess reagent calculation', () => {
  // 2H2 + O2 → 2H2O with 2 mol H2 and 3 mol O2
  const result = findLimitingReagent(
    {
      reactants: [
        { formula: 'H2', moles: 2, coefficient: 2 },
        { formula: 'O2', moles: 3, coefficient: 1 },
      ],
    },
    [{ formula: 'H2O', coefficient: 2 }]
  )
  expect(result.limitingReagent).toBe('H2')
  // O2 used = 2 mol H2 * (1/2) = 1 mol O2
  // Excess O2 = 3 - 1 = 2 mol
  expect(result.excessReagents[0].excessMoles).toBeCloseTo(2, 0.01)
})

console.log('')

// =====================================================
// THEORETICAL YIELD
// =====================================================
console.log('📕 THEORETICAL YIELD')
console.log('-'.repeat(45))

test('2H2 + O2 → 2H2O: 2 mol H2 yields 36.03g H2O', () => {
  const yield_ = calculateTheoreticalYield(2, 2, 2, 'H2O')
  expect(yield_.moles).toBeCloseTo(2, 0.01)
  expect(yield_.mass).toBeCloseTo(36.03, 0.1)
})

test('N2 + 3H2 → 2NH3: 3 mol H2 yields 34.06g NH3', () => {
  const yield_ = calculateTheoreticalYield(3, 3, 2, 'NH3')
  expect(yield_.moles).toBeCloseTo(2, 0.01)
  expect(yield_.mass).toBeCloseTo(34.06, 0.1)
})

test('4Fe + 3O2 → 2Fe2O3: 4 mol Fe yields 319.38g Fe2O3', () => {
  const yield_ = calculateTheoreticalYield(4, 4, 2, 'Fe2O3')
  expect(yield_.moles).toBeCloseTo(2, 0.01)
  expect(yield_.mass).toBeCloseTo(319.38, 1)
})

console.log('')

// =====================================================
// PERCENT YIELD
// =====================================================
console.log('📗 PERCENT YIELD')
console.log('-'.repeat(45))

test('Actual 27g, Theoretical 36g → 75% yield', () => {
  const percentYield = calculatePercentYield(27, 36)
  expect(percentYield).toBeCloseTo(75, 0.1)
})

test('Actual 45g, Theoretical 50g → 90% yield', () => {
  const percentYield = calculatePercentYield(45, 50)
  expect(percentYield).toBeCloseTo(90, 0.1)
})

test('Actual 17g, Theoretical 17.03g → 99.82% yield', () => {
  const percentYield = calculatePercentYield(17, 17.03)
  expect(percentYield).toBeCloseTo(99.82, 0.1)
})

test('Perfect yield: 100%', () => {
  const percentYield = calculatePercentYield(50, 50)
  expect(percentYield).toBeCloseTo(100, 0.001)
})

console.log('')

// =====================================================
// DILUTION (M1V1 = M2V2)
// =====================================================
console.log('📘 DILUTION (M1V1 = M2V2)')
console.log('-'.repeat(45))

test('Find V2: 2M × 100mL diluted to 0.5M → V2 = 400mL', () => {
  const result = calculateDilution(2, 100, 0.5, undefined)
  expect(result.V2).toBeCloseTo(400, 0.1)
})

test('Find M2: 1M × 50mL diluted to 200mL → M2 = 0.25M', () => {
  const result = calculateDilution(1, 50, undefined, 200)
  expect(result.M2).toBeCloseTo(0.25, 0.001)
})

test('Find V1: 6M diluted to 0.5M in 240mL → V1 = 20mL', () => {
  const result = calculateDilution(6, undefined, 0.5, 240)
  expect(result.V1).toBeCloseTo(20, 0.1)
})

test('Find M1: Unknown stock to 0.1M with V1=10mL, V2=100mL → M1 = 1M', () => {
  const result = calculateDilution(undefined, 10, 0.1, 100)
  expect(result.M1).toBeCloseTo(1, 0.001)
})

console.log('')

// =====================================================
// REAL-WORLD STOICHIOMETRY PROBLEMS
// =====================================================
console.log('🌍 REAL-WORLD PROBLEMS')
console.log('-'.repeat(45))

test('Combustion: How much CO2 from 16g CH4?', () => {
  // CH4 + 2O2 → CO2 + 2H2O
  // 16g CH4 = 1 mol → 1 mol CO2 → 44g CO2
  const molarMassCH4 = calculateMolecularMass('CH4')
  const molesCH4 = massToMoles(16, molarMassCH4)
  const yield_ = calculateTheoreticalYield(molesCH4, 1, 1, 'CO2')
  expect(yield_.mass).toBeCloseTo(44, 0.5)
  console.log(`   16g CH4 → ${yield_.mass.toFixed(2)}g CO2`)
})

test('Haber process: NH3 from 28g N2 with excess H2', () => {
  // N2 + 3H2 → 2NH3
  // 28g N2 = 1 mol → 2 mol NH3 → 34g NH3
  const molarMassN2 = calculateMolecularMass('N2')
  const molesN2 = massToMoles(28, molarMassN2)
  const yield_ = calculateTheoreticalYield(molesN2, 1, 2, 'NH3')
  expect(yield_.mass).toBeCloseTo(34.06, 0.5)
  console.log(`   28g N2 → ${yield_.mass.toFixed(2)}g NH3`)
})

test('Aspirin synthesis yield calculation', () => {
  // C7H6O3 + C4H6O3 → C9H8O4 + CH3COOH
  // If theoretical = 10g, actual = 8.5g → 85% yield
  const percentYield = calculatePercentYield(8.5, 10)
  expect(percentYield).toBeCloseTo(85, 0.1)
  console.log(`   Aspirin yield: ${percentYield.toFixed(1)}%`)
})

test('Lab preparation: Make 500mL of 0.5M NaCl', () => {
  // Need: n = M × V = 0.5 × 0.5 = 0.25 mol
  // Mass = 0.25 mol × 58.44 g/mol = 14.61g
  const molarMass = calculateMolecularMass('NaCl')
  const molesNeeded = 0.5 * 0.5 // M × V(L)
  const massNeeded = molesToMass(molesNeeded, molarMass)
  expect(massNeeded).toBeCloseTo(14.61, 0.1)
  console.log(`   Need ${massNeeded.toFixed(2)}g NaCl for 500mL of 0.5M solution`)
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(45))

const perfTests = [
  () => calculateMolecularMass('C12H22O11'),
  () => calculatePercentComposition('Al2(SO4)3'),
  () => calculateEmpiricalFormula({ C: 40, H: 6.7, O: 53.3 }),
  () => findLimitingReagent(
    { reactants: [{ formula: 'H2', moles: 2, coefficient: 2 }, { formula: 'O2', moles: 1, coefficient: 1 }] },
    [{ formula: 'H2O', coefficient: 2 }]
  ),
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
console.log('='.repeat(55))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(55))
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
  console.log('🏆 ALL TESTS PASSED! VerChem Stoichiometry Calculator is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
