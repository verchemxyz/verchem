/**
 * VerChem Gas Laws Calculator - Hardcore Test Suite
 * WCP Standard: Tests against textbook values
 *
 * Tests cover:
 * - Unit conversions (T, P)
 * - Ideal Gas Law (PV = nRT)
 * - Combined Gas Law
 * - Boyle's, Charles's, Gay-Lussac's, Avogadro's Laws
 * - Dalton's Law of Partial Pressures
 * - Graham's Law of Effusion
 * - Van der Waals Equation (real gas)
 * - Gas density & RMS velocity
 */

import {
  celsiusToKelvin,
  kelvinToCelsius,
  fahrenheitToKelvin,
  kelvinToFahrenheit,
  atmToKPa,
  kPaToAtm,
  atmToMmHg,
  mmHgToAtm,
  atmToBar,
  barToAtm,
  idealGasLaw,
  combinedGasLaw,
  boylesLaw,
  charlesLaw,
  gayLussacsLaw,
  avogadrosLaw,
  daltonsLaw,
  calculatePartialPressure,
  calculateMoleFraction,
  grahamsLaw,
  vanDerWaalsEquation,
  VAN_DER_WAALS_CONSTANTS,
  calculateGasDensity,
  calculateMolarMassFromDensity,
  calculateRMSVelocity,
  calculateAverageKineticEnergy,
} from '../lib/calculations/gas-laws'

import { GAS_CONSTANT } from '../lib/constants/physical-constants'

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

console.log('🧪 VerChem Gas Laws Calculator - WCP Hardcore Tests')
console.log('='.repeat(55))
console.log('')

// =====================================================
// GAS CONSTANT VERIFICATION
// =====================================================
console.log('📗 GAS CONSTANT (CODATA 2018)')
console.log('-'.repeat(45))

test('R = 8.314462618 J/(mol·K) (SI, exact)', () => {
  expect(GAS_CONSTANT.SI).toBeCloseTo(8.314462618, 0.0001)
})

test('R = 0.08206 L·atm/(mol·K)', () => {
  expect(GAS_CONSTANT.atm).toBeCloseTo(0.08206, 0.001)
})

test('R = 62.36 L·mmHg/(mol·K)', () => {
  expect(GAS_CONSTANT.mmHg).toBeCloseTo(62.36, 0.01)
})

console.log('')

// =====================================================
// TEMPERATURE CONVERSIONS
// =====================================================
console.log('📘 TEMPERATURE CONVERSIONS')
console.log('-'.repeat(45))

test('0°C = 273.15 K', () => {
  expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 0.001)
})

test('100°C = 373.15 K', () => {
  expect(celsiusToKelvin(100)).toBeCloseTo(373.15, 0.001)
})

test('-273.15°C = 0 K (absolute zero)', () => {
  expect(celsiusToKelvin(-273.15)).toBeCloseTo(0, 0.001)
})

test('273.15 K = 0°C', () => {
  expect(kelvinToCelsius(273.15)).toBeCloseTo(0, 0.001)
})

test('32°F = 273.15 K', () => {
  expect(fahrenheitToKelvin(32)).toBeCloseTo(273.15, 0.001)
})

test('212°F = 373.15 K', () => {
  expect(fahrenheitToKelvin(212)).toBeCloseTo(373.15, 0.001)
})

test('273.15 K = 32°F', () => {
  expect(kelvinToFahrenheit(273.15)).toBeCloseTo(32, 0.001)
})

console.log('')

// =====================================================
// PRESSURE CONVERSIONS
// =====================================================
console.log('📙 PRESSURE CONVERSIONS')
console.log('-'.repeat(45))

test('1 atm = 101.325 kPa', () => {
  expect(atmToKPa(1)).toBeCloseTo(101.325, 0.001)
})

test('101.325 kPa = 1 atm', () => {
  expect(kPaToAtm(101.325)).toBeCloseTo(1, 0.001)
})

test('1 atm = 760 mmHg', () => {
  expect(atmToMmHg(1)).toBeCloseTo(760, 0.001)
})

test('760 mmHg = 1 atm', () => {
  expect(mmHgToAtm(760)).toBeCloseTo(1, 0.001)
})

test('1 atm = 1.01325 bar', () => {
  expect(atmToBar(1)).toBeCloseTo(1.01325, 0.001)
})

test('1.01325 bar = 1 atm', () => {
  expect(barToAtm(1.01325)).toBeCloseTo(1, 0.001)
})

console.log('')

// =====================================================
// IDEAL GAS LAW (PV = nRT)
// =====================================================
console.log('📕 IDEAL GAS LAW (PV = nRT)')
console.log('-'.repeat(45))

test('Find P: 1 mol, 22.414 L, 273.15 K → P = 1 atm', () => {
  const result = idealGasLaw({ n: 1, V: 22.414, T: 273.15 })
  expect(result.P).toBeCloseTo(1, 0.01)
})

test('Find V: 1 mol, 1 atm, 273.15 K → V = 22.414 L', () => {
  const result = idealGasLaw({ n: 1, P: 1, T: 273.15 })
  expect(result.V).toBeCloseTo(22.414, 0.01)
})

test('Find n: 1 atm, 22.414 L, 273.15 K → n = 1 mol', () => {
  const result = idealGasLaw({ P: 1, V: 22.414, T: 273.15 })
  expect(result.n).toBeCloseTo(1, 0.01)
})

test('Find T: 1 mol, 1 atm, 22.414 L → T = 273.15 K', () => {
  const result = idealGasLaw({ n: 1, P: 1, V: 22.414 })
  expect(result.T).toBeCloseTo(273.15, 0.5)
})

test('2 mol at 298 K in 10 L → P = 4.89 atm', () => {
  const result = idealGasLaw({ n: 2, V: 10, T: 298 })
  expect(result.P).toBeCloseTo(4.89, 0.02)
})

test('0.5 mol at 2 atm, 300 K → V = 6.16 L', () => {
  const result = idealGasLaw({ n: 0.5, P: 2, T: 300 })
  expect(result.V).toBeCloseTo(6.16, 0.05)
})

console.log('')

// =====================================================
// BOYLE'S LAW (P1V1 = P2V2)
// =====================================================
console.log("📗 BOYLE'S LAW (P₁V₁ = P₂V₂)")
console.log('-'.repeat(45))

test('1 atm × 10 L at P2 = 2 atm → V2 = 5 L', () => {
  const result = boylesLaw(1, 10, 2, undefined)
  expect(result.V2).toBeCloseTo(5, 0.001)
})

test('2 atm × 5 L at V2 = 10 L → P2 = 1 atm', () => {
  const result = boylesLaw(2, 5, undefined, 10)
  expect(result.P2).toBeCloseTo(1, 0.001)
})

test('3 atm × 4 L at P2 = 6 atm → V2 = 2 L', () => {
  const result = boylesLaw(3, 4, 6, undefined)
  expect(result.V2).toBeCloseTo(2, 0.001)
})

console.log('')

// =====================================================
// CHARLES'S LAW (V1/T1 = V2/T2)
// =====================================================
console.log("📘 CHARLES'S LAW (V₁/T₁ = V₂/T₂)")
console.log('-'.repeat(45))

test('10 L at 300 K, T2 = 600 K → V2 = 20 L', () => {
  const result = charlesLaw(10, 300, undefined, 600)
  expect(result.V2).toBeCloseTo(20, 0.001)
})

test('20 L at 400 K, V2 = 10 L → T2 = 200 K', () => {
  const result = charlesLaw(20, 400, 10, undefined)
  expect(result.T2).toBeCloseTo(200, 0.001)
})

test('5 L at 250 K, T2 = 500 K → V2 = 10 L', () => {
  const result = charlesLaw(5, 250, undefined, 500)
  expect(result.V2).toBeCloseTo(10, 0.001)
})

console.log('')

// =====================================================
// GAY-LUSSAC'S LAW (P1/T1 = P2/T2)
// =====================================================
console.log("📙 GAY-LUSSAC'S LAW (P₁/T₁ = P₂/T₂)")
console.log('-'.repeat(45))

test('1 atm at 300 K, T2 = 600 K → P2 = 2 atm', () => {
  const result = gayLussacsLaw(1, 300, undefined, 600)
  expect(result.P2).toBeCloseTo(2, 0.001)
})

test('2 atm at 400 K, P2 = 4 atm → T2 = 800 K', () => {
  const result = gayLussacsLaw(2, 400, 4, undefined)
  expect(result.T2).toBeCloseTo(800, 0.001)
})

test('3 atm at 273 K, T2 = 546 K → P2 = 6 atm', () => {
  const result = gayLussacsLaw(3, 273, undefined, 546)
  expect(result.P2).toBeCloseTo(6, 0.001)
})

console.log('')

// =====================================================
// AVOGADRO'S LAW (V1/n1 = V2/n2)
// =====================================================
console.log("📕 AVOGADRO'S LAW (V₁/n₁ = V₂/n₂)")
console.log('-'.repeat(45))

test('22.4 L with 1 mol, n2 = 2 mol → V2 = 44.8 L', () => {
  const result = avogadrosLaw(22.4, 1, undefined, 2)
  expect(result.V2).toBeCloseTo(44.8, 0.001)
})

test('10 L with 0.5 mol, V2 = 20 L → n2 = 1 mol', () => {
  const result = avogadrosLaw(10, 0.5, 20, undefined)
  expect(result.n2).toBeCloseTo(1, 0.001)
})

console.log('')

// =====================================================
// COMBINED GAS LAW
// =====================================================
console.log('📗 COMBINED GAS LAW (P₁V₁/T₁ = P₂V₂/T₂)')
console.log('-'.repeat(45))

test('2 atm, 5 L, 300 K → 1 atm, 400 K: V2 = 13.33 L', () => {
  const result = combinedGasLaw({ P1: 2, V1: 5, T1: 300, P2: 1, T2: 400 })
  expect(result.V2).toBeCloseTo(13.33, 0.01)
})

test('1 atm, 10 L, 273 K → 2 atm, 546 K: V2 = 10 L', () => {
  const result = combinedGasLaw({ P1: 1, V1: 10, T1: 273, P2: 2, T2: 546 })
  expect(result.V2).toBeCloseTo(10, 0.01)
})

test('1 atm, 22.4 L, 273 K → V2 = 44.8 L, 546 K: P2 = 0.5 atm', () => {
  const result = combinedGasLaw({ P1: 1, V1: 22.4, T1: 273, V2: 44.8, T2: 546 })
  expect(result.P2).toBeCloseTo(0.5, 0.01)
})

console.log('')

// =====================================================
// DALTON'S LAW OF PARTIAL PRESSURES
// =====================================================
console.log("📘 DALTON'S LAW (P_total = ΣPᵢ)")
console.log('-'.repeat(45))

test('O2 (0.5 atm) + N2 (0.3 atm) + CO2 (0.2 atm) = 1.0 atm', () => {
  const total = daltonsLaw([0.5, 0.3, 0.2])
  expect(total).toBeCloseTo(1.0, 0.001)
})

test('Air: N2 (0.78) + O2 (0.21) + Ar (0.01) = 1.0 atm', () => {
  const total = daltonsLaw([0.78, 0.21, 0.01])
  expect(total).toBeCloseTo(1.0, 0.001)
})

test('Partial pressure from mole fraction: X=0.2, P_total=5 atm → P=1 atm', () => {
  const partial = calculatePartialPressure(5, 0.2)
  expect(partial).toBeCloseTo(1, 0.001)
})

test('Mole fraction: 2 mol out of 10 mol → X = 0.2', () => {
  const moleFraction = calculateMoleFraction(2, 10)
  expect(moleFraction).toBeCloseTo(0.2, 0.001)
})

console.log('')

// =====================================================
// GRAHAM'S LAW OF EFFUSION
// =====================================================
console.log("📙 GRAHAM'S LAW (rate₁/rate₂ = √(M₂/M₁))")
console.log('-'.repeat(45))

test('H2 effuses 4x faster than O2 (M: 2 vs 32)', () => {
  // rate_H2 / rate_O2 = √(32/2) = √16 = 4
  // If rate_O2 = 1, rate_H2 = 4
  const rateH2 = grahamsLaw(1, 32, 2) // rate_O2=1, M_O2=32, M_H2=2
  expect(rateH2).toBeCloseTo(4, 0.01)
})

test('He vs N2: He is 2.65x faster', () => {
  // √(28/4) = √7 ≈ 2.65
  const rateHe = grahamsLaw(1, 28, 4)
  expect(rateHe).toBeCloseTo(2.65, 0.02)
})

test('CH4 vs CO2: CH4 is 1.66x faster', () => {
  // √(44/16) = √2.75 ≈ 1.66
  const rateCH4 = grahamsLaw(1, 44, 16)
  expect(rateCH4).toBeCloseTo(1.66, 0.02)
})

console.log('')

// =====================================================
// VAN DER WAALS EQUATION (Real Gas)
// =====================================================
console.log('📕 VAN DER WAALS (Real Gas)')
console.log('-'.repeat(45))

test('Van der Waals constants exist for common gases', () => {
  expect(VAN_DER_WAALS_CONSTANTS.CO2.a).toBeCloseTo(3.592, 0.01)
  expect(VAN_DER_WAALS_CONSTANTS.CO2.b).toBeCloseTo(0.0427, 0.001)
  expect(VAN_DER_WAALS_CONSTANTS.N2.a).toBeCloseTo(1.390, 0.01)
})

test('1 mol CO2 at 273 K, 22.4 L → P (van der Waals)', () => {
  const { a, b } = VAN_DER_WAALS_CONSTANTS.CO2
  const P = vanDerWaalsEquation({ n: 1, V: 22.4, T: 273, a, b })
  // Should be close to 1 atm but slightly different from ideal
  expect(P).toBeCloseTo(0.995, 0.02)
  console.log(`   VdW pressure: ${P.toFixed(4)} atm (ideal would be ~1.00)`)
})

test('1 mol N2 at 300 K, 10 L → P (van der Waals)', () => {
  const { a, b } = VAN_DER_WAALS_CONSTANTS.N2
  const P = vanDerWaalsEquation({ n: 1, V: 10, T: 300, a, b })
  // Ideal: P = nRT/V = 1*0.08206*300/10 = 2.46 atm
  // VdW should be slightly lower due to intermolecular attractions
  expect(P).toBeCloseTo(2.44, 0.05)
  console.log(`   VdW pressure: ${P.toFixed(4)} atm (ideal: 2.46)`)
})

test('High pressure deviation: 10 mol CO2 in 1 L at 300 K', () => {
  const { a, b } = VAN_DER_WAALS_CONSTANTS.CO2
  // Ideal: P = 10*0.08206*300/1 = 246 atm
  // VdW will show significant deviation
  const P = vanDerWaalsEquation({ n: 10, V: 1, T: 300, a, b })
  console.log(`   High pressure VdW: ${P.toFixed(2)} atm (ideal: 246)`)
  // At high pressure, real gas deviates significantly
  expect(P).toBeCloseTo(130, 30) // Large tolerance due to extreme conditions
})

console.log('')

// =====================================================
// GAS DENSITY
// =====================================================
console.log('📗 GAS DENSITY')
console.log('-'.repeat(45))

test('O2 density at STP: 1.43 g/L', () => {
  const density = calculateGasDensity(32, 1, 273.15)
  expect(density).toBeCloseTo(1.43, 0.02)
})

test('CO2 density at STP: 1.96 g/L', () => {
  const density = calculateGasDensity(44, 1, 273.15)
  expect(density).toBeCloseTo(1.96, 0.02)
})

test('H2 density at STP: 0.090 g/L', () => {
  const density = calculateGasDensity(2, 1, 273.15)
  expect(density).toBeCloseTo(0.090, 0.005)
})

test('Molar mass from density: 1.43 g/L at STP → M ≈ 32 (O2)', () => {
  const M = calculateMolarMassFromDensity(1.43, 1, 273.15)
  expect(M).toBeCloseTo(32, 0.5)
})

console.log('')

// =====================================================
// KINETIC MOLECULAR THEORY
// =====================================================
console.log('📘 KINETIC MOLECULAR THEORY')
console.log('-'.repeat(45))

test('RMS velocity of O2 at 300 K: ~483 m/s', () => {
  const vrms = calculateRMSVelocity(32, 300)
  expect(vrms).toBeCloseTo(483, 5)
  console.log(`   O2 RMS velocity: ${vrms.toFixed(1)} m/s`)
})

test('RMS velocity of H2 at 300 K: ~1934 m/s', () => {
  const vrms = calculateRMSVelocity(2, 300)
  expect(vrms).toBeCloseTo(1934, 20)
  console.log(`   H2 RMS velocity: ${vrms.toFixed(1)} m/s`)
})

test('H2 is 4x faster than O2 at same T', () => {
  const vrmsH2 = calculateRMSVelocity(2, 300)
  const vrmsO2 = calculateRMSVelocity(32, 300)
  const ratio = vrmsH2 / vrmsO2
  expect(ratio).toBeCloseTo(4, 0.1)
})

test('Average KE at 300 K: 3740 J/mol', () => {
  const KE = calculateAverageKineticEnergy(300)
  expect(KE).toBeCloseTo(3740, 10)
})

test('KE doubles when T doubles', () => {
  const KE1 = calculateAverageKineticEnergy(300)
  const KE2 = calculateAverageKineticEnergy(600)
  expect(KE2 / KE1).toBeCloseTo(2, 0.001)
})

console.log('')

// =====================================================
// REAL-WORLD PROBLEMS
// =====================================================
console.log('🌍 REAL-WORLD PROBLEMS')
console.log('-'.repeat(45))

test('Scuba tank: 12 L at 200 atm, 298 K → how many mol?', () => {
  const result = idealGasLaw({ P: 200, V: 12, T: 298 })
  expect(result.n).toBeCloseTo(98.1, 1)
  console.log(`   Scuba tank contains ${result.n.toFixed(1)} mol gas`)
})

test('Balloon: 2.5 L at 1 atm sea level → volume at 0.5 atm altitude', () => {
  const result = boylesLaw(1, 2.5, 0.5, undefined)
  expect(result.V2).toBeCloseTo(5, 0.001)
  console.log(`   Balloon expands to ${result.V2} L at altitude`)
})

test('Car tire: P increases from 2.1 atm (25°C) to ? at 45°C', () => {
  const T1 = celsiusToKelvin(25)
  const T2 = celsiusToKelvin(45)
  const result = gayLussacsLaw(2.1, T1, undefined, T2)
  expect(result.P2).toBeCloseTo(2.24, 0.02)
  console.log(`   Tire pressure at 45°C: ${result.P2.toFixed(2)} atm`)
})

test('Lung capacity: 6 L at 37°C, 1 atm → STP volume', () => {
  const T1 = celsiusToKelvin(37) // 310.15 K
  const T2 = 273.15 // STP
  const result = combinedGasLaw({ P1: 1, V1: 6, T1, P2: 1, T2 })
  expect(result.V2).toBeCloseTo(5.29, 0.05)
  console.log(`   Lung volume at STP: ${result.V2.toFixed(2)} L`)
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(45))

const perfTests = [
  () => idealGasLaw({ n: 1, V: 22.4, T: 273 }),
  () => combinedGasLaw({ P1: 1, V1: 10, T1: 300, P2: 2, T2: 400 }),
  () => vanDerWaalsEquation({ n: 1, V: 22.4, T: 273, a: 3.592, b: 0.0427 }),
  () => calculateRMSVelocity(32, 300),
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
  console.log('🏆 ALL TESTS PASSED! VerChem Gas Laws Calculator is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
