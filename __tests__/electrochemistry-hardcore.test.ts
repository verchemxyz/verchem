/**
 * VerChem Electrochemistry Calculator - Hardcore Test Suite
 * WCP Standard: Tests from EASY to EXTREME
 *
 * Tests: Cell Potential, Nernst Equation, Faraday's Laws, Redox
 * Data validated against standard electrochemistry references
 */

import {
  calculateCellPotential,
  calculateNernstEquation,
  calculateElectrolysis,
  getStandardPotential,
  getAllHalfReactions,
  STANDARD_REDUCTION_POTENTIALS,
  ROOM_TEMPERATURE,
  EXAMPLE_CELLS,
} from '../lib/calculations/electrochemistry'
import { FARADAY_CONSTANT, GAS_CONSTANT } from '../lib/constants/physical-constants'

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
    toBeCloseTo(expected: number, tolerance: number = 0.01) {
      if (typeof actual !== 'number') {
        throw new Error(`Expected number, got ${typeof actual}`)
      }
      const diff = Math.abs(actual - expected)
      if (diff > tolerance) {
        throw new Error(`Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(4)})`)
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`)
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number' || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`)
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`)
      }
    },
    toNotBeNull() {
      if (actual === null) {
        throw new Error(`Expected non-null value`)
      }
    },
  }
}

console.log('🧪 VerChem Electrochemistry - WCP Hardcore Tests')
console.log('='.repeat(55))
console.log('')

// =====================================================
// CONSTANTS VERIFICATION
// =====================================================
console.log('📗 CONSTANTS VERIFICATION (CODATA 2018)')
console.log('-'.repeat(45))

test('Faraday constant F = 96485.33212 C/mol', () => {
  expect(FARADAY_CONSTANT).toBeCloseTo(96485.33212, 0.001)
})

test('Gas constant R = 8.314462618 J/(mol·K)', () => {
  expect(GAS_CONSTANT.SI).toBeCloseTo(8.314462618, 0.0001)
})

test('Room temperature = 298.15 K (25°C)', () => {
  expect(ROOM_TEMPERATURE).toBe(298.15)
})

console.log('')

// =====================================================
// STANDARD REDUCTION POTENTIALS
// =====================================================
console.log('📘 STANDARD REDUCTION POTENTIALS (E°)')
console.log('-'.repeat(45))

const standardPotentials = [
  { cell: 'F2/F-', E0: 2.87, desc: 'Strongest oxidizer' },
  { cell: 'Cl2/Cl-', E0: 1.36 },
  { cell: 'Ag+/Ag', E0: 0.80 },
  { cell: 'Cu2+/Cu', E0: 0.34 },
  { cell: 'H+/H2', E0: 0.00, desc: 'Reference (SHE)' },
  { cell: 'Fe2+/Fe', E0: -0.44 },
  { cell: 'Zn2+/Zn', E0: -0.76 },
  { cell: 'Al3+/Al', E0: -1.66 },
  { cell: 'Mg2+/Mg', E0: -2.37 },
  { cell: 'Li+/Li', E0: -3.04, desc: 'Strongest reducer' },
]

standardPotentials.forEach(({ cell, E0, desc }) => {
  test(`E°(${cell}) = ${E0} V ${desc || ''}`, () => {
    expect(getStandardPotential(cell)).toBeCloseTo(E0, 0.01)
  })
})

test('Total 18+ half-reactions in database', () => {
  const count = Object.keys(STANDARD_REDUCTION_POTENTIALS).length
  expect(count).toBeGreaterThan(17)
})

test('Half-reactions sorted by E° (highest first)', () => {
  const sorted = getAllHalfReactions()
  // F2/F- should be first (highest E°)
  expect(sorted[0].E0).toBeCloseTo(2.87, 0.01)
  // Li+/Li should be last (lowest E°)
  expect(sorted[sorted.length - 1].E0).toBeCloseTo(-3.04, 0.01)
})

console.log('')

// =====================================================
// CELL POTENTIAL CALCULATIONS
// =====================================================
console.log('📙 CELL POTENTIAL (E°cell = E°cathode - E°anode)')
console.log('-'.repeat(45))

// Daniell Cell: Zn | Zn²⁺ || Cu²⁺ | Cu
// E°cell = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = 0.34 - (-0.76) = 1.10 V
test('Daniell Cell: Zn-Cu, E° = 1.10 V', () => {
  const result = calculateCellPotential(0.34, -0.76, 2)
  expect(result.cellPotential).toBeCloseTo(1.10, 0.01)
  expect(result.spontaneous).toBe(true)
})

// Hydrogen-Oxygen Fuel Cell
// E°cell = E°(O₂/H₂O) - E°(H⁺/H₂) = 1.23 - 0 = 1.23 V
test('Fuel Cell: H2-O2, E° = 1.23 V', () => {
  const result = calculateCellPotential(1.23, 0, 4)
  expect(result.cellPotential).toBeCloseTo(1.23, 0.01)
  expect(result.spontaneous).toBe(true)
})

// Silver-Zinc Cell
// E°cell = E°(Ag⁺/Ag) - E°(Zn²⁺/Zn) = 0.80 - (-0.76) = 1.56 V
test('Ag-Zn Cell: E° = 1.56 V', () => {
  const result = calculateCellPotential(0.80, -0.76, 2)
  expect(result.cellPotential).toBeCloseTo(1.56, 0.01)
  expect(result.spontaneous).toBe(true)
})

// Non-spontaneous: reverse Daniell
test('Reverse Daniell (non-spontaneous): E° = -1.10 V', () => {
  const result = calculateCellPotential(-0.76, 0.34, 2)
  expect(result.cellPotential).toBeCloseTo(-1.10, 0.01)
  expect(result.spontaneous).toBe(false)
})

// Lead-Acid Battery (single cell)
// E°cell = 1.69 - (-0.35) = 2.04 V
test('Lead-Acid Battery: E° = 2.04 V', () => {
  const result = calculateCellPotential(1.69, -0.35, 2)
  expect(result.cellPotential).toBeCloseTo(2.04, 0.01)
  expect(result.spontaneous).toBe(true)
})

console.log('')

// =====================================================
// GIBBS FREE ENERGY FROM CELL POTENTIAL
// =====================================================
console.log('🔥 ΔG° = -nFE° (Gibbs from Cell Potential)')
console.log('-'.repeat(45))

// Daniell Cell: ΔG° = -2 × 96485 × 1.10 = -212,267 J/mol = -212.3 kJ/mol
test('Daniell Cell: ΔG° = -212.3 kJ/mol', () => {
  const result = calculateCellPotential(0.34, -0.76, 2)
  const deltaG_kJ = result.deltaG / 1000
  expect(deltaG_kJ).toBeCloseTo(-212.3, 1)
})

// Fuel Cell: ΔG° = -4 × 96485 × 1.23 = -474,706 J/mol = -474.7 kJ/mol
test('Fuel Cell: ΔG° = -474.7 kJ/mol', () => {
  const result = calculateCellPotential(1.23, 0, 4)
  const deltaG_kJ = result.deltaG / 1000
  expect(deltaG_kJ).toBeCloseTo(-474.7, 1)
})

// Non-spontaneous has positive ΔG°
test('Non-spontaneous cell: ΔG° > 0', () => {
  const result = calculateCellPotential(-0.76, 0.34, 2)
  expect(result.deltaG).toBeGreaterThan(0)
})

console.log('')

// =====================================================
// NERNST EQUATION
// =====================================================
console.log('⚡ NERNST EQUATION: E = E° - (RT/nF)ln(Q)')
console.log('-'.repeat(45))

// At Q = 1: E = E° (standard conditions)
test('Q = 1: E = E° (standard conditions)', () => {
  const result = calculateNernstEquation(1.10, 2, 1, 298.15)
  expect(result.E).toBeCloseTo(1.10, 0.001)
})

// Q > 1: E < E° (products concentrated)
test('Q > 1: E decreases (Q = 100)', () => {
  const result = calculateNernstEquation(1.10, 2, 100, 298.15)
  // E = 1.10 - (0.0592/2) × log(100) = 1.10 - 0.0592 = 1.04 V
  expect(result.E).toBeLessThan(result.E0)
  expect(result.E).toBeCloseTo(1.041, 0.01)
})

// Q < 1: E > E° (reactants concentrated)
test('Q < 1: E increases (Q = 0.01)', () => {
  const result = calculateNernstEquation(1.10, 2, 0.01, 298.15)
  // E = 1.10 - (0.0592/2) × log(0.01) = 1.10 + 0.0592 = 1.16 V
  expect(result.E).toBeGreaterThan(result.E0)
  expect(result.E).toBeCloseTo(1.159, 0.01)
})

// Simplified Nernst at 25°C: E = E° - (0.0592/n)log(Q)
test('Nernst simplified: E = E° - (0.0592/n)log(Q) at 25°C', () => {
  const E0 = 0.80 // Ag+/Ag
  const n = 1
  const Q = 0.001 // [Ag+] = 0.001 M
  const result = calculateNernstEquation(E0, n, Q, 298.15)
  // E = 0.80 - 0.0592 × log(0.001) = 0.80 + 0.178 = 0.978 V
  expect(result.E).toBeCloseTo(0.978, 0.01)
})

// Temperature effect
test('Higher temperature increases Nernst correction', () => {
  const E0 = 1.10
  const n = 2
  const Q = 10
  const result298 = calculateNernstEquation(E0, n, Q, 298.15)
  const result400 = calculateNernstEquation(E0, n, Q, 400)
  // Higher T → larger (RT/nF)ln(Q) → lower E
  expect(result400.E).toBeLessThan(result298.E)
})

// n effect: more electrons → smaller correction
test('More electrons (n) → smaller Nernst correction', () => {
  const E0 = 1.0
  const Q = 100
  const result_n1 = calculateNernstEquation(E0, 1, Q, 298.15)
  const result_n2 = calculateNernstEquation(E0, 2, Q, 298.15)
  // E with n=1 drops more than n=2
  expect(result_n1.E).toBeLessThan(result_n2.E)
})

console.log('')

// =====================================================
// FARADAY'S LAWS (Electrolysis)
// =====================================================
console.log('🔋 FARADAY\'S LAWS OF ELECTROLYSIS')
console.log('-'.repeat(45))

// Q = It, n = Q/F, m = nM
// Example: Electroplating copper
// Cu²⁺ + 2e⁻ → Cu, n_electrons = 2
// 5 A for 1 hour = 5 × 3600 = 18000 C
// mol_e = 18000 / 96485 = 0.1866 mol
// mol_Cu = 0.1866 / 2 = 0.0933 mol
// mass_Cu = 0.0933 × 63.546 = 5.93 g
test('Copper plating: 5 A × 1 hr → 5.93 g Cu', () => {
  const result = calculateElectrolysis(5, 3600, 2, 63.546)
  expect(result.charge).toBeCloseTo(18000, 1)
  expect(result.mass).toBeCloseTo(5.93, 0.1)
})

// Aluminum production (Hall-Héroult)
// Al³⁺ + 3e⁻ → Al
// 100 A for 1 hour
test('Aluminum production: 100 A × 1 hr', () => {
  const result = calculateElectrolysis(100, 3600, 3, 26.982)
  // mol_e = 360000 / 96485 = 3.732 mol
  // mol_Al = 3.732 / 3 = 1.244 mol
  // mass = 1.244 × 26.982 = 33.6 g
  expect(result.mass).toBeCloseTo(33.6, 0.5)
})

// Hydrogen gas production
// 2H⁺ + 2e⁻ → H₂
// 2 A for 30 min = 2 × 1800 = 3600 C
test('H2 production: 2 A × 30 min → volume at STP', () => {
  const result = calculateElectrolysis(2, 1800, 2, 2.016, true)
  // mol_e = 3600 / 96485 = 0.0373 mol
  // mol_H2 = 0.0373 / 2 = 0.0187 mol
  // V = 0.0187 × 22.414 = 0.419 L
  expect(result.moles).toBeCloseTo(0.0187, 0.001)
  expect(result.volume).toBeCloseTo(0.419, 0.02)
})

// Silver plating (n = 1)
// Ag⁺ + e⁻ → Ag
test('Silver plating: 1 A × 10 min → 0.67 g Ag', () => {
  const result = calculateElectrolysis(1, 600, 1, 107.868)
  // Q = 600 C, mol_e = 0.00622, mass = 0.671 g
  expect(result.mass).toBeCloseTo(0.67, 0.02)
})

// Chlorine gas production
// 2Cl⁻ → Cl₂ + 2e⁻
test('Cl2 production: 10 A × 1 hr', () => {
  const result = calculateElectrolysis(10, 3600, 2, 70.906, true)
  // mol_e = 36000 / 96485 = 0.373 mol
  // mol_Cl2 = 0.1866 mol
  // V = 0.1866 × 22.414 = 4.18 L
  expect(result.volume).toBeCloseTo(4.18, 0.1)
})

console.log('')

// =====================================================
// REAL-WORLD ELECTROCHEMICAL CELLS
// =====================================================
console.log('🏭 REAL-WORLD CELLS')
console.log('-'.repeat(45))

test('Daniell Cell example data correct', () => {
  const cell = EXAMPLE_CELLS.find(c => c.name === 'Daniell Cell')
  expect(cell).toNotBeNull()
  expect(cell!.cellE0).toBeCloseTo(1.10, 0.01)
})

test('Lead-Acid Battery example correct', () => {
  const cell = EXAMPLE_CELLS.find(c => c.name === 'Lead-Acid Battery')
  expect(cell).toNotBeNull()
  expect(cell!.cellE0).toBeCloseTo(2.04, 0.01)
})

test('Fuel Cell example correct', () => {
  const cell = EXAMPLE_CELLS.find(c => c.name.includes('Fuel Cell'))
  expect(cell).toNotBeNull()
  expect(cell!.cellE0).toBeCloseTo(1.23, 0.01)
})

// Car battery = 6 cells × 2.04 V = 12.24 V
test('Car battery (6 cells): 6 × 2.04 = 12.24 V', () => {
  const singleCellE = 2.04
  const carBatteryVoltage = 6 * singleCellE
  expect(carBatteryVoltage).toBeCloseTo(12.24, 0.1)
})

console.log('')

// =====================================================
// OXIDATION STATE & REDOX
// =====================================================
console.log('⚗️ OXIDATION STATES')
console.log('-'.repeat(45))

import { identifyOxidationState, determineHalfReactionType } from '../lib/calculations/electrochemistry'

test('O in compounds = -2', () => {
  expect(identifyOxidationState('O', 'H2O')).toBe(-2)
  expect(identifyOxidationState('O', 'CO2')).toBe(-2)
})

test('H in compounds = +1', () => {
  expect(identifyOxidationState('H', 'H2O')).toBe(+1)
  expect(identifyOxidationState('H', 'HCl')).toBe(+1)
})

test('F is always -1', () => {
  expect(identifyOxidationState('F', 'NaF')).toBe(-1)
})

test('Group 1 metals = +1', () => {
  expect(identifyOxidationState('Na', 'NaCl')).toBe(+1)
  expect(identifyOxidationState('K', 'KBr')).toBe(+1)
})

test('Group 2 metals = +2', () => {
  expect(identifyOxidationState('Mg', 'MgO')).toBe(+2)
  expect(identifyOxidationState('Ca', 'CaCO3')).toBe(+2)
})

test('Al = +3', () => {
  expect(identifyOxidationState('Al', 'Al2O3')).toBe(+3)
})

test('Half-reaction type: electrons on right = oxidation', () => {
  expect(determineHalfReactionType('Zn', 'Zn²⁺ + 2e⁻')).toBe('oxidation')
})

test('Half-reaction type: electrons on left = reduction', () => {
  expect(determineHalfReactionType('Cu²⁺ + 2e⁻', 'Cu')).toBe('reduction')
})

console.log('')

// =====================================================
// EDGE CASES
// =====================================================
console.log('⚠️ EDGE CASES')
console.log('-'.repeat(45))

test('Q = 0.001 (very low): E increases significantly', () => {
  const result = calculateNernstEquation(0.34, 2, 0.001, 298.15)
  // E = 0.34 + (0.0592/2) × 3 = 0.34 + 0.089 = 0.43 V
  expect(result.E).toBeGreaterThan(result.E0)
})

test('Q = 1000 (very high): E decreases significantly', () => {
  const result = calculateNernstEquation(0.34, 2, 1000, 298.15)
  expect(result.E).toBeLessThan(result.E0)
})

test('Zero current electrolysis: no product', () => {
  const result = calculateElectrolysis(0, 3600, 2, 63.546)
  expect(result.mass).toBe(0)
  expect(result.moles).toBe(0)
})

test('Very high current: large mass produced', () => {
  const result = calculateElectrolysis(1000, 3600, 2, 63.546)
  expect(result.mass).toBeGreaterThan(1000) // > 1 kg
})

console.log('')

// =====================================================
// CONCENTRATION CELLS
// =====================================================
console.log('🧪 CONCENTRATION CELLS')
console.log('-'.repeat(45))

// Concentration cell: same electrodes, different concentrations
// E = (RT/nF) × ln([high]/[low]) = (0.0592/n) × log([high]/[low])
test('Concentration cell: [Cu²⁺] = 1.0 M vs 0.01 M', () => {
  // Q = [dilute]/[concentrated] = 0.01/1.0 = 0.01
  // E = 0 - (0.0592/2) × log(0.01) = 0.0592 V
  const result = calculateNernstEquation(0, 2, 0.01, 298.15)
  expect(result.E).toBeCloseTo(0.059, 0.005)
})

test('Concentration cell: 10-fold difference → 0.0296 V', () => {
  // Q = 0.1, E = (0.0592/2) × 1 = 0.0296 V
  const result = calculateNernstEquation(0, 2, 0.1, 298.15)
  expect(result.E).toBeCloseTo(0.0296, 0.002)
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(45))

test('1000 cell potential calculations < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateCellPotential(0.34 + i * 0.001, -0.76 - i * 0.001, 2)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 cell calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(20)
})

test('1000 Nernst calculations < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateNernstEquation(1.10, 2, 0.01 * (i + 1), 298.15)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 Nernst calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(20)
})

test('1000 electrolysis calculations < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateElectrolysis(5 + i * 0.01, 3600, 2, 63.546)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 electrolysis calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(20)
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
  console.log('🏆 ALL TESTS PASSED! VerChem Electrochemistry is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
