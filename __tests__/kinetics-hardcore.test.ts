/**
 * VerChem Chemical Kinetics Calculator - Hardcore Test Suite
 * WCP Standard: Tests from EASY to EXTREME
 *
 * Tests: Rate Laws, Half-Life, Arrhenius, Activation Energy
 * Data validated against standard kinetics references
 */

import {
  calculateConcentration,
  calculateRateConstant,
  arrheniusEquation,
  calculateActivationEnergy,
  determineReactionOrder,
  GAS_CONSTANT,
  STANDARD_TEMPERATURE,
  EXAMPLE_KINETICS,
  EXAMPLE_ARRHENIUS,
} from '../lib/calculations/kinetics'

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
      const relDiff = expected !== 0 ? diff / Math.abs(expected) : diff
      if (diff > tolerance && relDiff > tolerance) {
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

console.log('🧪 VerChem Chemical Kinetics - WCP Hardcore Tests')
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

console.log('')

// =====================================================
// ZERO ORDER KINETICS
// =====================================================
console.log('📘 ZERO ORDER: [A] = [A]₀ - kt')
console.log('-'.repeat(45))

// Zero order: [A] = [A]₀ - kt
test('Zero order: [A]₀=1.0, k=0.01, t=50 → [A]=0.5', () => {
  const result = calculateConcentration('zero', 1.0, 0.01, 50)
  expect(result.concentration).toBeCloseTo(0.5, 0.001)
})

test('Zero order half-life: t½ = [A]₀/(2k)', () => {
  const result = calculateConcentration('zero', 1.0, 0.01, 0)
  // t½ = 1.0 / (2 × 0.01) = 50 s
  expect(result.halfLife).toBeCloseTo(50, 0.1)
})

test('Zero order: complete reaction ([A] = 0)', () => {
  const result = calculateConcentration('zero', 1.0, 0.01, 100)
  // [A] = 1.0 - 0.01 × 100 = 0 (or negative, clamped to 0)
  expect(result.concentration).toBe(0)
})

test('Zero order rate constant calculation', () => {
  const result = calculateRateConstant('zero', 1.0, 0.5, 50)
  // k = (1.0 - 0.5) / 50 = 0.01 M/s
  expect(result).toNotBeNull()
  expect(result!.k).toBeCloseTo(0.01, 0.0001)
})

console.log('')

// =====================================================
// FIRST ORDER KINETICS
// =====================================================
console.log('📙 FIRST ORDER: ln[A] = ln[A]₀ - kt')
console.log('-'.repeat(45))

// First order: [A] = [A]₀ × e^(-kt)
test('First order: [A]₀=1.0, k=0.01, t=100 → [A]=0.368', () => {
  const result = calculateConcentration('first', 1.0, 0.01, 100)
  // [A] = 1.0 × e^(-0.01 × 100) = e^(-1) = 0.368
  expect(result.concentration).toBeCloseTo(0.368, 0.001)
})

test('First order half-life: t½ = ln(2)/k = 0.693/k', () => {
  const result = calculateConcentration('first', 1.0, 0.01, 0)
  // t½ = 0.693 / 0.01 = 69.3 s
  expect(result.halfLife).toBeCloseTo(69.3, 0.1)
})

test('First order: half-life is CONSTANT (independent of [A]₀)', () => {
  const result1 = calculateConcentration('first', 1.0, 0.01, 0)
  const result2 = calculateConcentration('first', 2.0, 0.01, 0)
  expect(result1.halfLife).toBeCloseTo(result2.halfLife, 0.01)
})

test('First order: at t = t½, [A] = [A]₀/2', () => {
  const k = 0.01
  const halfLife = Math.LN2 / k // 69.3 s
  const result = calculateConcentration('first', 1.0, k, halfLife)
  expect(result.concentration).toBeCloseTo(0.5, 0.001)
})

test('First order rate constant calculation', () => {
  const result = calculateRateConstant('first', 1.0, 0.368, 100)
  // k = (ln(1.0) - ln(0.368)) / 100 = 1/100 = 0.01 s⁻¹
  expect(result).toNotBeNull()
  expect(result!.k).toBeCloseTo(0.01, 0.001)
})

// Radioactive decay of C-14 (real example)
test('C-14 decay: k = 1.21×10⁻⁴ yr⁻¹, t½ = 5730 years', () => {
  const k = 1.21e-4
  const result = calculateConcentration('first', 1.0, k, 0)
  // t½ = 0.693 / 1.21×10⁻⁴ = 5727 years
  expect(result.halfLife).toBeCloseTo(5730, 50)
})

console.log('')

// =====================================================
// SECOND ORDER KINETICS
// =====================================================
console.log('📕 SECOND ORDER: 1/[A] = 1/[A]₀ + kt')
console.log('-'.repeat(45))

// Second order: [A] = 1 / (1/[A]₀ + kt)
test('Second order: [A]₀=1.0, k=0.1, t=10 → [A]=0.5', () => {
  const result = calculateConcentration('second', 1.0, 0.1, 10)
  // [A] = 1 / (1/1.0 + 0.1 × 10) = 1 / 2 = 0.5
  expect(result.concentration).toBeCloseTo(0.5, 0.001)
})

test('Second order half-life: t½ = 1/(k[A]₀)', () => {
  const result = calculateConcentration('second', 1.0, 0.1, 0)
  // t½ = 1 / (0.1 × 1.0) = 10 s
  expect(result.halfLife).toBeCloseTo(10, 0.1)
})

test('Second order: half-life DEPENDS on [A]₀', () => {
  const result1 = calculateConcentration('second', 1.0, 0.1, 0)
  const result2 = calculateConcentration('second', 2.0, 0.1, 0)
  // t½₁ = 10 s, t½₂ = 5 s (higher conc → shorter half-life)
  expect(result1.halfLife).toBeCloseTo(10, 0.1)
  expect(result2.halfLife).toBeCloseTo(5, 0.1)
})

test('Second order rate constant calculation', () => {
  const result = calculateRateConstant('second', 1.0, 0.5, 10)
  // k = (1/0.5 - 1/1.0) / 10 = (2 - 1) / 10 = 0.1 M⁻¹s⁻¹
  expect(result).toNotBeNull()
  expect(result!.k).toBeCloseTo(0.1, 0.001)
})

// 2NO₂ → 2NO + O₂ (real example)
test('NO₂ decomposition: second order, k = 0.543 M⁻¹s⁻¹', () => {
  const result = calculateConcentration('second', 0.01, 0.543, 100)
  // [A] = 1 / (1/0.01 + 0.543 × 100) = 1 / (100 + 54.3) = 0.00648 M
  expect(result.concentration).toBeCloseTo(0.00648, 0.0001)
})

console.log('')

// =====================================================
// ARRHENIUS EQUATION
// =====================================================
console.log('🔥 ARRHENIUS: k = A × e^(-Ea/RT)')
console.log('-'.repeat(45))

// k = A × e^(-Ea/RT)
test('Arrhenius: A=1e13, Ea=75 kJ/mol, T=298 K', () => {
  const result = arrheniusEquation(1e13, 75000, 298.15)
  // k = 1e13 × e^(-75000/(8.314×298.15))
  // k = 1e13 × e^(-30.26) = 1e13 × 7.12×10⁻¹⁴ = 0.712
  expect(result.k).toBeCloseTo(0.712, 0.05)
})

test('Higher temperature → larger k', () => {
  const result298 = arrheniusEquation(1e13, 75000, 298)
  const result400 = arrheniusEquation(1e13, 75000, 400)
  expect(result400.k).toBeGreaterThan(result298.k)
})

test('Higher Ea → smaller k', () => {
  const resultLowEa = arrheniusEquation(1e13, 50000, 298)
  const resultHighEa = arrheniusEquation(1e13, 100000, 298)
  expect(resultHighEa.k).toBeLessThan(resultLowEa.k)
})

test('As T → ∞, k → A', () => {
  const result = arrheniusEquation(1e13, 75000, 10000) // Very high T
  // At very high T, e^(-Ea/RT) → 1, so k → A
  expect(result.k).toBeCloseTo(1e13, 1e12)
})

test('Enzyme catalysis: lower Ea (25 kJ/mol)', () => {
  const result = arrheniusEquation(1e8, 25000, 310.15) // 37°C
  // Lower Ea means faster reaction
  expect(result.k).toBeGreaterThan(1e4) // k should be large
})

console.log('')

// =====================================================
// ACTIVATION ENERGY FROM TWO TEMPERATURES
// =====================================================
console.log('⚡ ACTIVATION ENERGY: ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)')
console.log('-'.repeat(45))

// From two rate constants at different temperatures
test('Calculate Ea from k₁=0.01, T₁=300K, k₂=0.1, T₂=350K', () => {
  const result = calculateActivationEnergy(0.01, 300, 0.1, 350)
  expect(result).toNotBeNull()
  // ln(0.1/0.01) = Ea/R × (1/300 - 1/350)
  // ln(10) = Ea/8.314 × (0.00333 - 0.00286)
  // 2.303 = Ea/8.314 × 0.000476
  // Ea = 2.303 × 8.314 / 0.000476 = 40,200 J/mol
  expect(result!.Ea).toBeCloseTo(40200, 1000)
  expect(result!.EaKJ).toBeCloseTo(40.2, 1)
})

test('A (pre-exponential) is calculated correctly', () => {
  const result = calculateActivationEnergy(0.01, 300, 0.1, 350)
  expect(result).toNotBeNull()
  // Verify A by plugging back into Arrhenius
  const kVerify = result!.A * Math.exp(-result!.Ea / (8.314 * 300))
  expect(kVerify).toBeCloseTo(0.01, 0.001)
})

test('Ea negative warning for invalid data', () => {
  // k decreases with T → negative Ea (physically unrealistic)
  const result = calculateActivationEnergy(0.1, 300, 0.01, 350)
  expect(result).toNotBeNull()
  expect(result!.Ea).toBeLessThan(0)
})

test('Typical organic reaction: Ea ≈ 50-100 kJ/mol', () => {
  // k doubles for every 10°C rise (rule of thumb for Ea ≈ 50 kJ/mol)
  const result = calculateActivationEnergy(1, 298, 2, 308)
  expect(result).toNotBeNull()
  expect(result!.EaKJ).toBeCloseTo(52, 5) // ~50 kJ/mol
})

console.log('')

// =====================================================
// REACTION ORDER DETERMINATION
// =====================================================
console.log('📊 REACTION ORDER DETERMINATION')
console.log('-'.repeat(45))

// Generate first-order data: [A] = [A]₀ × e^(-kt)
test('Determine first order from data', () => {
  const k = 0.01
  const A0 = 1.0
  const data = [0, 50, 100, 150, 200].map(t => ({
    time: t,
    concentration: A0 * Math.exp(-k * t),
  }))

  const result = determineReactionOrder(data)
  expect(result).toNotBeNull()
  expect(result!.order).toBe('first')
  expect(result!.r2).toBeGreaterThan(0.99)
})

// Generate second-order data: [A] = 1/(1/[A]₀ + kt)
test('Determine second order from data', () => {
  const k = 0.1
  const A0 = 1.0
  const data = [0, 5, 10, 15, 20].map(t => ({
    time: t,
    concentration: 1 / (1/A0 + k * t),
  }))

  const result = determineReactionOrder(data)
  expect(result).toNotBeNull()
  expect(result!.order).toBe('second')
  expect(result!.r2).toBeGreaterThan(0.99)
})

// Generate zero-order data: [A] = [A]₀ - kt
test('Determine zero order from data', () => {
  const k = 0.01
  const A0 = 1.0
  const data = [0, 20, 40, 60, 80].map(t => ({
    time: t,
    concentration: Math.max(0, A0 - k * t),
  }))

  const result = determineReactionOrder(data)
  expect(result).toNotBeNull()
  expect(result!.order).toBe('zero')
  expect(result!.r2).toBeGreaterThan(0.99)
})

test('Need at least 3 data points', () => {
  const data = [
    { time: 0, concentration: 1.0 },
    { time: 50, concentration: 0.5 },
  ]
  const result = determineReactionOrder(data)
  expect(result).toBeNull()
})

console.log('')

// =====================================================
// HALF-LIFE COMPARISONS
// =====================================================
console.log('⏱️ HALF-LIFE FORMULAS')
console.log('-'.repeat(45))

test('Zero order t½ = [A]₀/(2k) - depends on [A]₀', () => {
  const k = 0.01
  const t1 = calculateConcentration('zero', 1.0, k, 0).halfLife
  const t2 = calculateConcentration('zero', 2.0, k, 0).halfLife
  // t½ = [A]₀/(2k), so doubling [A]₀ doubles t½
  expect(t2).toBeCloseTo(2 * t1, 0.1)
})

test('First order t½ = 0.693/k - CONSTANT', () => {
  const k = 0.01
  const t1 = calculateConcentration('first', 1.0, k, 0).halfLife
  const t2 = calculateConcentration('first', 2.0, k, 0).halfLife
  const t3 = calculateConcentration('first', 0.5, k, 0).halfLife
  expect(t1).toBeCloseTo(t2, 0.1)
  expect(t2).toBeCloseTo(t3, 0.1)
})

test('Second order t½ = 1/(k[A]₀) - inversely depends on [A]₀', () => {
  const k = 0.1
  const t1 = calculateConcentration('second', 1.0, k, 0).halfLife
  const t2 = calculateConcentration('second', 2.0, k, 0).halfLife
  // t½ = 1/(k[A]₀), so doubling [A]₀ halves t½
  expect(t2).toBeCloseTo(t1 / 2, 0.1)
})

console.log('')

// =====================================================
// REAL-WORLD EXAMPLES
// =====================================================
console.log('🌍 REAL-WORLD EXAMPLES')
console.log('-'.repeat(45))

test('Example: First Order Decay (C-14)', () => {
  const example = EXAMPLE_KINETICS.find(e => e.name === 'First Order Decay')
  expect(example).toNotBeNull()
  const result = calculateConcentration(
    example!.order,
    example!.initialConcentration,
    example!.k,
    example!.time
  )
  // After 1 half-life, [A] = [A]₀/2 = 0.5
  expect(result.concentration).toBeCloseTo(0.5, 0.01)
})

test('Example: Second Order (NO₂)', () => {
  const example = EXAMPLE_KINETICS.find(e => e.name === 'Second Order Reaction')
  expect(example).toNotBeNull()
  expect(example!.order).toBe('second')
})

test('Example: Zero Order (N₂O₅ on surface)', () => {
  const example = EXAMPLE_KINETICS.find(e => e.name === 'Zero Order Decomposition')
  expect(example).toNotBeNull()
  expect(example!.order).toBe('zero')
})

test('Arrhenius example: Organic reaction', () => {
  const example = EXAMPLE_ARRHENIUS.find(e => e.name === 'Typical Organic Reaction')
  expect(example).toNotBeNull()
  const result = arrheniusEquation(example!.A, example!.Ea, example!.temperature)
  expect(result.k).toBeGreaterThan(0)
})

test('Arrhenius example: Enzyme (low Ea)', () => {
  const example = EXAMPLE_ARRHENIUS.find(e => e.name === 'Enzyme Catalysis')
  expect(example).toNotBeNull()
  // Enzyme has low Ea (catalyzed)
  expect(example!.Ea).toBeLessThan(50000)
})

console.log('')

// =====================================================
// EDGE CASES
// =====================================================
console.log('⚠️ EDGE CASES')
console.log('-'.repeat(45))

test('Rate constant cannot be calculated with t=0', () => {
  const result = calculateRateConstant('first', 1.0, 0.5, 0)
  expect(result).toBeNull()
})

test('Final conc > initial conc is invalid', () => {
  const result = calculateRateConstant('first', 0.5, 1.0, 100)
  expect(result).toBeNull()
})

test('Zero concentration invalid for first/second order', () => {
  const result = calculateRateConstant('first', 1.0, 0, 100)
  expect(result).toBeNull()
})

test('Negative temperature invalid for Arrhenius', () => {
  const result = calculateActivationEnergy(0.01, -100, 0.1, 300)
  expect(result).toBeNull()
})

test('Very fast reaction: k = 1e10', () => {
  const result = calculateConcentration('first', 1.0, 1e10, 1e-9)
  // Extremely fast - concentration drops quickly
  expect(result.concentration).toBeLessThan(1.0)
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(45))

test('1000 concentration calculations < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateConcentration('first', 1.0, 0.01 * (i + 1) / 1000, 100)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 conc calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(20)
})

test('1000 Arrhenius calculations < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    arrheniusEquation(1e13, 75000 + i * 10, 298 + i * 0.1)
  }
  const elapsed = Date.now() - start
  console.log(`   1000 Arrhenius calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(20)
})

test('100 order determinations < 100ms', () => {
  const data = [0, 50, 100, 150, 200].map(t => ({
    time: t,
    concentration: Math.exp(-0.01 * t),
  }))

  const start = Date.now()
  for (let i = 0; i < 100; i++) {
    determineReactionOrder(data)
  }
  const elapsed = Date.now() - start
  console.log(`   100 order determinations: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(100)
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
  console.log('🏆 ALL TESTS PASSED! VerChem Chemical Kinetics is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
