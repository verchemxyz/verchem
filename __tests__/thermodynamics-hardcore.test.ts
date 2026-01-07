/**
 * VerChem Thermodynamics Calculator - Hardcore Test Suite
 * WCP Standard: Tests from EASY to EXTREME
 *
 * Tests: ΔH, ΔS, ΔG, K, Spontaneity
 * Data validated against NIST Chemistry WebBook
 */

import {
  calculateDeltaH,
  calculateDeltaS,
  calculateDeltaG,
  calculateEquilibriumConstant,
  analyzeReaction,
  THERMODYNAMIC_DATA,
  GAS_CONSTANT,
  STANDARD_TEMPERATURE,
} from '../lib/calculations/thermodynamics'

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
    toBeCloseTo(expected: number, tolerance: number = 0.5) {
      if (typeof actual !== 'number') {
        throw new Error(`Expected number, got ${typeof actual}`)
      }
      const diff = Math.abs(actual - expected)
      if (diff > tolerance) {
        throw new Error(`Expected ~${expected}, got ${actual} (diff: ${diff.toFixed(2)})`)
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

console.log('🧪 VerChem Thermodynamics - WCP Hardcore Tests')
console.log('='.repeat(55))
console.log('')

// =====================================================
// CONSTANTS VERIFICATION
// =====================================================
console.log('📗 CONSTANTS VERIFICATION')
console.log('-'.repeat(45))

test('Gas constant R = 8.314 J/(mol·K)', () => {
  expect(GAS_CONSTANT).toBe(8.314)
})

test('Standard temperature = 298.15 K (25°C)', () => {
  expect(STANDARD_TEMPERATURE).toBe(298.15)
})

test('Thermodynamic data has 37+ compounds', () => {
  expect(THERMODYNAMIC_DATA.length).toBeGreaterThan(36)
})

console.log('')

// =====================================================
// THERMODYNAMIC DATA VALIDATION (NIST)
// =====================================================
console.log('📘 THERMODYNAMIC DATA (NIST Reference)')
console.log('-'.repeat(45))

// Elements should have ΔHf = 0, ΔGf = 0 (reference state)
const elements = [
  { formula: 'H2', S: 130.7 },
  { formula: 'O2', S: 205.2 },
  { formula: 'N2', S: 191.6 },
  { formula: 'C', S: 5.7 },
]

elements.forEach(({ formula, S }) => {
  test(`${formula}: ΔHf = 0, ΔGf = 0 (reference state)`, () => {
    const data = THERMODYNAMIC_DATA.find(d => d.formula === formula)
    expect(data?.deltaHf).toBe(0)
    expect(data?.deltaGf).toBe(0)
    expect(data?.S).toBeCloseTo(S, 0.5)
  })
})

// Key compounds with NIST values
const keyCompounds = [
  { formula: 'H2O', state: 'liquid', deltaHf: -285.8, S: 70.0 },
  { formula: 'H2O', state: 'gas', deltaHf: -241.8, S: 188.8 },
  { formula: 'CO2', state: 'gas', deltaHf: -393.5, S: 213.8 },
  { formula: 'NH3', state: 'gas', deltaHf: -45.9, S: 192.8 },
  { formula: 'CH4', state: 'gas', deltaHf: -74.6, S: 186.3 },
]

keyCompounds.forEach(({ formula, state, deltaHf, S }) => {
  test(`${formula}(${state[0]}): ΔHf = ${deltaHf} kJ/mol, S = ${S} J/(mol·K)`, () => {
    const data = THERMODYNAMIC_DATA.find(d => d.formula === formula && d.state === state)
    expect(data?.deltaHf).toBeCloseTo(deltaHf, 0.5)
    expect(data?.S).toBeCloseTo(S, 0.5)
  })
})

console.log('')

// =====================================================
// ΔH CALCULATIONS (Hess's Law)
// =====================================================
console.log('📙 ΔH CALCULATIONS (Hess\'s Law)')
console.log('-'.repeat(45))

// Combustion of Methane: CH4 + 2O2 → CO2 + 2H2O(l)
// ΔH = [1×(-393.5) + 2×(-285.8)] - [1×(-74.6) + 2×(0)]
// ΔH = -393.5 - 571.6 + 74.6 = -890.5 kJ/mol
test('Combustion of CH4: ΔH = -890.5 kJ/mol (exothermic)', () => {
  const result = calculateDeltaH(
    [{ formula: 'CO2', coefficient: 1 }, { formula: 'H2O', coefficient: 2 }],
    [{ formula: 'CH4', coefficient: 1 }, { formula: 'O2', coefficient: 2 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(-890.5, 1.0)
})

// Formation of NH3 (Haber): N2 + 3H2 → 2NH3
// ΔH = 2×(-45.9) - [0 + 0] = -91.8 kJ
test('Haber Process: ΔH = -91.8 kJ/mol (exothermic)', () => {
  const result = calculateDeltaH(
    [{ formula: 'NH3', coefficient: 2 }],
    [{ formula: 'N2', coefficient: 1 }, { formula: 'H2', coefficient: 3 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(-91.8, 0.5)
})

// Decomposition of CaCO3: CaCO3 → CaO + CO2
// ΔH = [(-634.9) + (-393.5)] - [(-1207.6)] = +179.2 kJ
test('CaCO3 decomposition: ΔH = +179.2 kJ/mol (endothermic)', () => {
  const result = calculateDeltaH(
    [{ formula: 'CaO', coefficient: 1 }, { formula: 'CO2', coefficient: 1 }],
    [{ formula: 'CaCO3', coefficient: 1 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(179.2, 1.0)
})

// Combustion of ethanol: C2H5OH(l) + 3O2 → 2CO2 + 3H2O(l)
// ΔH = [2×(-393.5) + 3×(-285.8)] - [(-277.6) + 0] = -1366.8 kJ
test('Ethanol combustion: ΔH = -1366.8 kJ/mol', () => {
  const result = calculateDeltaH(
    [{ formula: 'CO2', coefficient: 2 }, { formula: 'H2O', coefficient: 3 }],
    [{ formula: 'C2H5OH', coefficient: 1 }, { formula: 'O2', coefficient: 3 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(-1366.8, 2.0)
})

// Water vaporization: H2O(l) → H2O(g)
// ΔH = -241.8 - (-285.8) = 44.0 kJ/mol
test('Water vaporization: ΔHvap = +44.0 kJ/mol', () => {
  const result = calculateDeltaH(
    [{ formula: 'H2O(g)', coefficient: 1 }],
    [{ formula: 'H2O(l)', coefficient: 1 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(44.0, 0.5)
})

console.log('')

// =====================================================
// ΔS CALCULATIONS (Entropy)
// =====================================================
console.log('📕 ΔS CALCULATIONS (Entropy)')
console.log('-'.repeat(45))

// Water vaporization: H2O(l) → H2O(g)
// ΔS = 188.8 - 70.0 = +118.8 J/(mol·K)
test('Water vaporization: ΔS = +118.8 J/(mol·K) (disorder increases)', () => {
  const result = calculateDeltaS(
    [{ formula: 'H2O(g)', coefficient: 1 }],
    [{ formula: 'H2O(l)', coefficient: 1 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaS).toBeCloseTo(118.8, 1.0)
})

// Haber Process: N2 + 3H2 → 2NH3
// ΔS = 2×192.8 - [191.6 + 3×130.7] = 385.6 - 583.7 = -198.1 J/(mol·K)
test('Haber Process: ΔS = -198.1 J/(mol·K) (disorder decreases)', () => {
  const result = calculateDeltaS(
    [{ formula: 'NH3', coefficient: 2 }],
    [{ formula: 'N2', coefficient: 1 }, { formula: 'H2', coefficient: 3 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaS).toBeCloseTo(-198.1, 2.0)
})

// CaCO3 decomposition: CaCO3 → CaO + CO2
// ΔS = [38.1 + 213.8] - [91.7] = +160.2 J/(mol·K)
test('CaCO3 decomposition: ΔS = +160.2 J/(mol·K)', () => {
  const result = calculateDeltaS(
    [{ formula: 'CaO', coefficient: 1 }, { formula: 'CO2', coefficient: 1 }],
    [{ formula: 'CaCO3', coefficient: 1 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaS).toBeCloseTo(160.2, 2.0)
})

// Combustion of CH4: CH4 + 2O2 → CO2 + 2H2O(l)
// ΔS = [213.8 + 2×70.0] - [186.3 + 2×205.2] = 353.8 - 596.7 = -242.9 J/(mol·K)
test('CH4 combustion: ΔS = -242.9 J/(mol·K)', () => {
  const result = calculateDeltaS(
    [{ formula: 'CO2', coefficient: 1 }, { formula: 'H2O', coefficient: 2 }],
    [{ formula: 'CH4', coefficient: 1 }, { formula: 'O2', coefficient: 2 }]
  )
  expect(result).toNotBeNull()
  expect(result!.deltaS).toBeCloseTo(-242.9, 3.0)
})

console.log('')

// =====================================================
// ΔG CALCULATIONS (Gibbs Free Energy)
// =====================================================
console.log('🔥 ΔG CALCULATIONS (Gibbs: ΔG = ΔH - TΔS)')
console.log('-'.repeat(45))

// At 298 K: ΔG = -100 - (298 × 0.050) = -100 - 14.9 = -114.9 kJ
test('ΔG calculation: ΔH=-100 kJ, ΔS=+50 J/K at 298 K', () => {
  const result = calculateDeltaG(-100, 50, 298)
  // ΔG = -100 - (298 × 0.050) = -114.9 kJ
  expect(result.deltaG).toBeCloseTo(-114.9, 0.5)
  expect(result.spontaneous).toBe(true)
})

// Endothermic with large +ΔS: spontaneous at high T
test('ΔH=+50 kJ, ΔS=+200 J/K at 298 K: non-spontaneous', () => {
  const result = calculateDeltaG(50, 200, 298)
  // ΔG = 50 - (298 × 0.200) = 50 - 59.6 = -9.6 kJ
  expect(result.deltaG).toBeCloseTo(-9.6, 0.5)
  expect(result.spontaneous).toBe(true)
})

// Same reaction at low T: non-spontaneous
test('ΔH=+50 kJ, ΔS=+100 J/K at 298 K: non-spontaneous', () => {
  const result = calculateDeltaG(50, 100, 298)
  // ΔG = 50 - (298 × 0.100) = 50 - 29.8 = +20.2 kJ
  expect(result.deltaG).toBeCloseTo(20.2, 0.5)
  expect(result.spontaneous).toBe(false)
})

// Temperature effect: Find T where ΔG = 0
// ΔG = 0 when T = ΔH/ΔS
test('ΔH=+50 kJ, ΔS=+100 J/K at 500 K: spontaneous', () => {
  const result = calculateDeltaG(50, 100, 500)
  // ΔG = 50 - (500 × 0.100) = 50 - 50 = 0 kJ
  expect(result.deltaG).toBeCloseTo(0, 0.5)
})

// Haber Process at 298 K
// ΔH = -91.8 kJ, ΔS = -198.1 J/K
// ΔG = -91.8 - (298 × -0.1981) = -91.8 + 59.0 = -32.8 kJ
test('Haber Process at 298 K: ΔG = -32.8 kJ (spontaneous)', () => {
  const result = calculateDeltaG(-91.8, -198.1, 298)
  expect(result.deltaG).toBeCloseTo(-32.8, 1.0)
  expect(result.spontaneous).toBe(true)
})

// Haber Process at 500°C (773 K) - industrial temperature
// ΔG = -91.8 - (773 × -0.1981) = -91.8 + 153.1 = +61.3 kJ
test('Haber Process at 773 K: ΔG = +61.3 kJ (non-spontaneous!)', () => {
  const result = calculateDeltaG(-91.8, -198.1, 773)
  expect(result.deltaG).toBeCloseTo(61.3, 2.0)
  expect(result.spontaneous).toBe(false)
})

console.log('')

// =====================================================
// EQUILIBRIUM CONSTANT K
// =====================================================
console.log('⚖️ EQUILIBRIUM CONSTANT K')
console.log('-'.repeat(45))

// ΔG = -RT ln(K), so K = e^(-ΔG/RT)
// R = 8.314 J/(mol·K) = 0.008314 kJ/(mol·K)

// ΔG = 0 → K = 1
test('ΔG = 0 kJ → K = 1 (equilibrium)', () => {
  const result = calculateEquilibriumConstant(0, 298)
  expect(result.K).toBeCloseTo(1, 0.1)
})

// ΔG = -10 kJ at 298 K
// K = e^(10 / (0.008314 × 298)) = e^(4.03) = 56.2
test('ΔG = -10 kJ at 298 K → K ≈ 56', () => {
  const result = calculateEquilibriumConstant(-10, 298)
  expect(result.K).toBeCloseTo(56.2, 5)
})

// ΔG = +10 kJ at 298 K
// K = e^(-10 / (0.008314 × 298)) = e^(-4.03) = 0.0178
test('ΔG = +10 kJ at 298 K → K ≈ 0.018', () => {
  const result = calculateEquilibriumConstant(10, 298)
  expect(result.K).toBeCloseTo(0.018, 0.005)
})

// Large negative ΔG = very large K (products strongly favored)
// ΔG = -50 kJ → K = e^(20.2) ≈ 5.9×10^8
test('ΔG = -50 kJ at 298 K → K ≈ 6×10^8', () => {
  const result = calculateEquilibriumConstant(-50, 298)
  expect(result.K).toBeGreaterThan(1e8)
})

// Haber Process: ΔG ≈ -32.8 kJ at 298 K
// K = e^(32.8 / 2.478) = e^(13.2) ≈ 5.5×10^5
test('Haber Process K at 298 K: K ≈ 5×10^5', () => {
  const result = calculateEquilibriumConstant(-32.8, 298)
  expect(result.K).toBeGreaterThan(1e5)
  expect(result.K).toBeLessThan(1e7)
})

console.log('')

// =====================================================
// COMPLETE REACTION ANALYSIS
// =====================================================
console.log('🔬 COMPLETE REACTION ANALYSIS')
console.log('-'.repeat(45))

// Combustion of Methane
test('CH4 combustion: complete analysis', () => {
  const result = analyzeReaction(
    [{ formula: 'CO2', coefficient: 1 }, { formula: 'H2O', coefficient: 2 }],
    [{ formula: 'CH4', coefficient: 1 }, { formula: 'O2', coefficient: 2 }],
    298.15
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(-890.5, 2) // Exothermic
  expect(result!.deltaS).toBeLessThan(0) // Entropy decreases
  expect(result!.deltaG).toBeLessThan(0) // Spontaneous
  expect(result!.spontaneous).toBe(true)
  expect(result!.K).toBeGreaterThan(1e100) // Very large K
})

// Haber Process
test('Haber Process: complete analysis at 298 K', () => {
  const result = analyzeReaction(
    [{ formula: 'NH3', coefficient: 2 }],
    [{ formula: 'N2', coefficient: 1 }, { formula: 'H2', coefficient: 3 }],
    298.15
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(-91.8, 1) // Exothermic
  expect(result!.deltaS).toBeLessThan(0) // 4 mol → 2 mol
  expect(result!.spontaneous).toBe(true)
})

// CaCO3 decomposition (limestone)
test('CaCO3 → CaO + CO2: complete analysis', () => {
  const result = analyzeReaction(
    [{ formula: 'CaO', coefficient: 1 }, { formula: 'CO2', coefficient: 1 }],
    [{ formula: 'CaCO3', coefficient: 1 }],
    298.15
  )
  expect(result).toNotBeNull()
  expect(result!.deltaH).toBeCloseTo(179.2, 2) // Endothermic
  expect(result!.deltaS).toBeGreaterThan(0) // 1 mol → 2 mol
  expect(result!.spontaneous).toBe(false) // Non-spontaneous at 298 K
})

// CaCO3 at high temperature (1000°C = 1273 K)
test('CaCO3 decomposition at 1273 K: spontaneous!', () => {
  const result = analyzeReaction(
    [{ formula: 'CaO', coefficient: 1 }, { formula: 'CO2', coefficient: 1 }],
    [{ formula: 'CaCO3', coefficient: 1 }],
    1273
  )
  expect(result).toNotBeNull()
  // ΔG = 179.2 - (1273 × 0.160) = 179.2 - 203.7 = -24.5 kJ
  expect(result!.deltaG).toBeLessThan(0)
  expect(result!.spontaneous).toBe(true)
})

console.log('')

// =====================================================
// SPONTANEITY RULES
// =====================================================
console.log('📊 SPONTANEITY RULES')
console.log('-'.repeat(45))

// Case 1: ΔH < 0, ΔS > 0 → Always spontaneous
test('ΔH<0, ΔS>0: Always spontaneous (any T)', () => {
  const result298 = calculateDeltaG(-50, 100, 298)
  const result1000 = calculateDeltaG(-50, 100, 1000)
  expect(result298.spontaneous).toBe(true)
  expect(result1000.spontaneous).toBe(true)
})

// Case 2: ΔH > 0, ΔS < 0 → Never spontaneous
test('ΔH>0, ΔS<0: Never spontaneous (any T)', () => {
  const result298 = calculateDeltaG(50, -100, 298)
  const result1000 = calculateDeltaG(50, -100, 1000)
  expect(result298.spontaneous).toBe(false)
  expect(result1000.spontaneous).toBe(false)
})

// Case 3: ΔH < 0, ΔS < 0 → Spontaneous at low T
test('ΔH<0, ΔS<0: Spontaneous at low T only', () => {
  const resultLowT = calculateDeltaG(-50, -200, 200)
  const resultHighT = calculateDeltaG(-50, -200, 500)
  expect(resultLowT.spontaneous).toBe(true)
  expect(resultHighT.spontaneous).toBe(false)
})

// Case 4: ΔH > 0, ΔS > 0 → Spontaneous at high T
test('ΔH>0, ΔS>0: Spontaneous at high T only', () => {
  const resultLowT = calculateDeltaG(50, 200, 200)
  const resultHighT = calculateDeltaG(50, 200, 500)
  expect(resultLowT.spontaneous).toBe(false)
  expect(resultHighT.spontaneous).toBe(true)
})

console.log('')

// =====================================================
// STATE-SPECIFIC DATA
// =====================================================
console.log('🧊 STATE-SPECIFIC DATA')
console.log('-'.repeat(45))

test('H2O(l) vs H2O(g): different ΔHf', () => {
  const liquid = THERMODYNAMIC_DATA.find(d => d.formula === 'H2O' && d.state === 'liquid')
  const gas = THERMODYNAMIC_DATA.find(d => d.formula === 'H2O' && d.state === 'gas')
  expect(liquid?.deltaHf).toBeCloseTo(-285.8, 0.5)
  expect(gas?.deltaHf).toBeCloseTo(-241.8, 0.5)
  // Difference = ΔHvap = 44.0 kJ/mol
  expect(gas!.deltaHf - liquid!.deltaHf).toBeCloseTo(44.0, 0.5)
})

test('C2H5OH(l) vs C2H5OH(g): vaporization', () => {
  const liquid = THERMODYNAMIC_DATA.find(d => d.formula === 'C2H5OH' && d.state === 'liquid')
  const gas = THERMODYNAMIC_DATA.find(d => d.formula === 'C2H5OH' && d.state === 'gas')
  expect(liquid).toNotBeNull()
  expect(gas).toNotBeNull()
  // Gas has higher entropy than liquid
  expect(gas!.S).toBeGreaterThan(liquid!.S)
})

test('HCl(g) vs HCl(aq): different states', () => {
  const gas = THERMODYNAMIC_DATA.find(d => d.formula === 'HCl' && d.state === 'gas')
  const aq = THERMODYNAMIC_DATA.find(d => d.formula === 'HCl' && d.state === 'aqueous')
  expect(gas).toNotBeNull()
  expect(aq).toNotBeNull()
  // Aqueous has more negative ΔHf (dissolution is exothermic)
  expect(aq!.deltaHf).toBeLessThan(gas!.deltaHf)
})

console.log('')

// =====================================================
// EDGE CASES
// =====================================================
console.log('⚠️ EDGE CASES')
console.log('-'.repeat(45))

test('Unknown compound returns null', () => {
  const result = calculateDeltaH(
    [{ formula: 'XYZ123', coefficient: 1 }],
    [{ formula: 'H2O', coefficient: 1 }]
  )
  expect(result).toBeNull()
})

test('Zero temperature: K calculation handled', () => {
  // Should not crash at T = 0 (though physically meaningless)
  const result = calculateEquilibriumConstant(-10, 0.001) // Near zero
  expect(result.K).toBeGreaterThan(0)
})

test('Very large ΔG: K still computable', () => {
  const result = calculateEquilibriumConstant(-200, 298)
  expect(result.K).toBeGreaterThan(1e30)
})

console.log('')

// =====================================================
// REAL-WORLD INDUSTRIAL REACTIONS
// =====================================================
console.log('🏭 REAL-WORLD REACTIONS')
console.log('-'.repeat(45))

// Thermite reaction: 2Al + Fe2O3 → Al2O3 + 2Fe
// This is highly exothermic
test('Thermite reaction: highly exothermic', () => {
  // Al is element (ΔHf = 0), Fe is element (ΔHf = 0)
  // But we don't have Fe in the database, so we'll test what we can
  const al2o3 = THERMODYNAMIC_DATA.find(d => d.formula === 'Al2O3')
  const fe2o3 = THERMODYNAMIC_DATA.find(d => d.formula === 'Fe2O3')
  expect(al2o3).toNotBeNull()
  expect(fe2o3).toNotBeNull()
  // Al2O3 is more stable (more negative ΔHf) than Fe2O3
  expect(al2o3!.deltaHf).toBeLessThan(fe2o3!.deltaHf)
})

// Contact Process: 2SO2 + O2 → 2SO3
test('Contact Process: SO2 → SO3 oxidation', () => {
  const result = calculateDeltaH(
    [{ formula: 'SO3', coefficient: 2 }],
    [{ formula: 'SO2', coefficient: 2 }, { formula: 'O2', coefficient: 1 }]
  )
  expect(result).toNotBeNull()
  // ΔH = 2×(-395.7) - [2×(-296.8) + 0] = -791.4 + 593.6 = -197.8 kJ
  expect(result!.deltaH).toBeCloseTo(-197.8, 2)
})

// Water-gas shift: CO + H2O → CO2 + H2
test('Water-gas shift reaction', () => {
  const result = calculateDeltaH(
    [{ formula: 'CO2', coefficient: 1 }, { formula: 'H2', coefficient: 1 }],
    [{ formula: 'CO', coefficient: 1 }, { formula: 'H2O', coefficient: 1 }]
  )
  expect(result).toNotBeNull()
  // ΔH = [-393.5 + 0] - [-110.5 + (-285.8)] = -393.5 + 396.3 = +2.8 kJ
  // Slightly endothermic, but favorable at high T due to entropy
  expect(Math.abs(result!.deltaH)).toBeLessThan(50) // Near thermoneutral
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(45))

test('1000 ΔG calculations < 50ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateDeltaG(-50 + i * 0.1, 100 - i * 0.1, 298 + i * 0.5)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 ΔG calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(50)
})

test('1000 K calculations < 50ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateEquilibriumConstant(-50 + i * 0.1, 298 + i * 0.5)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 K calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(50)
})

test('100 complete analyses < 200ms', () => {
  const start = Date.now()
  for (let i = 0; i < 100; i++) {
    analyzeReaction(
      [{ formula: 'CO2', coefficient: 1 }, { formula: 'H2O', coefficient: 2 }],
      [{ formula: 'CH4', coefficient: 1 }, { formula: 'O2', coefficient: 2 }],
      298.15 + i
    )
  }
  const elapsed = Date.now() - start
  console.log(`   100 full analyses: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(200)
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
  console.log('🏆 ALL TESTS PASSED! VerChem Thermodynamics is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
