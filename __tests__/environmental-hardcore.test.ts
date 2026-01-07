/**
 * VerChem Environmental Chemistry - Hardcore Test Suite
 * WCP Standard: BOD, COD, Water Quality Calculations
 *
 * Reference: Standard Methods for the Examination of Water and Wastewater (APHA)
 */

import {
  calculateBOD5,
  calculateBODu,
  calculateCOD,
  calculateBODCODRatio,
  calculateBODLoadingRate,
  calculateRemovalEfficiency,
  calculateKRate,
  temperatureCorrection,
  checkThaiStandards,
  DEFAULT_K_RATE,
  DEFAULT_THETA,
  THAI_EFFLUENT_STANDARDS,
} from '../lib/calculations/environmental'

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
    toThrow() {
      // This is a no-op, the function should have thrown
      throw new Error('Expected function to throw but it did not')
    },
  }
}

console.log('🧪 VerChem Environmental Chemistry - WCP Hardcore Tests')
console.log('='.repeat(55))
console.log('')

// =====================================================
// CONSTANTS VERIFICATION
// =====================================================
console.log('📗 CONSTANTS VERIFICATION')
console.log('-'.repeat(45))

test('Default k rate = 0.23 /day', () => {
  expect(DEFAULT_K_RATE).toBe(0.23)
})

test('Default theta = 1.047', () => {
  expect(DEFAULT_THETA).toBe(1.047)
})

test('Thai standards Type A: BOD <= 20', () => {
  expect(THAI_EFFLUENT_STANDARDS.type_a.limits.bod).toBe(20)
})

test('Thai standards Type A: COD <= 120', () => {
  expect(THAI_EFFLUENT_STANDARDS.type_a.limits.cod).toBe(120)
})

console.log('')

// =====================================================
// BOD5 CALCULATIONS
// =====================================================
console.log('📘 BOD5 CALCULATIONS')
console.log('-'.repeat(45))

test('BOD5: (8.0 - 3.0) x 10 = 50 mg/L', () => {
  const result = calculateBOD5({
    initialDO: 8.0,
    finalDO: 3.0,
    sampleVolume: 30,
    bottleVolume: 300,
  })
  expect(result.bod5).toBeCloseTo(50, 0.1)
  expect(result.dilutionFactor).toBeCloseTo(10, 0.1)
  expect(result.oxygenDepletion).toBeCloseTo(5.0, 0.1)
})

test('BOD5 with seed correction', () => {
  const result = calculateBOD5({
    initialDO: 8.0,
    finalDO: 3.0,
    sampleVolume: 30,
    bottleVolume: 300,
    seedCorrection: 0.5,
  })
  // (8.0 - 3.0 - 0.5) x 10 = 45 mg/L
  expect(result.bod5).toBeCloseTo(45, 0.1)
})

test('BOD5 with pre-calculated dilution factor', () => {
  const result = calculateBOD5({
    initialDO: 7.5,
    finalDO: 2.5,
    sampleVolume: 50,
    bottleVolume: 300,
    dilutionFactor: 5,
  })
  // (7.5 - 2.5) x 5 = 25 mg/L
  expect(result.bod5).toBeCloseTo(25, 0.1)
})

test('BOD5 validation: final DO > initial DO throws', () => {
  let threw = false
  try {
    calculateBOD5({
      initialDO: 3.0,
      finalDO: 8.0,
      sampleVolume: 30,
      bottleVolume: 300,
    })
  } catch {
    threw = true
  }
  expect(threw).toBe(true)
})

test('BOD5 low dilution (high BOD sample)', () => {
  const result = calculateBOD5({
    initialDO: 8.0,
    finalDO: 2.0,
    sampleVolume: 10,
    bottleVolume: 300,
  })
  // (8.0 - 2.0) x 30 = 180 mg/L
  expect(result.bod5).toBeCloseTo(180, 1)
})

console.log('')

// =====================================================
// ULTIMATE BOD CALCULATIONS
// =====================================================
console.log('📙 ULTIMATE BOD (BODu) CALCULATIONS')
console.log('-'.repeat(45))

test('BODu with default k=0.23: f=0.683', () => {
  const result = calculateBODu({
    bod5: 200,
    kRate: 0.23,
  })
  // f = 1 - e^(-0.23 x 5) = 1 - e^(-1.15) = 0.6833
  expect(result.f_factor).toBeCloseTo(0.683, 0.01)
  // BODu = 200 / 0.683 = 293 mg/L
  expect(result.bodu).toBeCloseTo(293, 5)
})

test('BODu with low k=0.1: lower f factor', () => {
  const result = calculateBODu({
    bod5: 200,
    kRate: 0.1,
  })
  // f = 1 - e^(-0.5) = 0.3935
  expect(result.f_factor).toBeCloseTo(0.394, 0.01)
  // BODu = 200 / 0.394 = 508 mg/L
  expect(result.bodu).toBeCloseTo(508, 10)
})

test('BODu with high k=0.35: higher f factor', () => {
  const result = calculateBODu({
    bod5: 200,
    kRate: 0.35,
  })
  // f = 1 - e^(-1.75) = 0.826
  expect(result.f_factor).toBeCloseTo(0.826, 0.01)
  // BODu = 200 / 0.826 = 242 mg/L
  expect(result.bodu).toBeCloseTo(242, 5)
})

console.log('')

// =====================================================
// COD CALCULATIONS
// =====================================================
console.log('📕 COD CALCULATIONS (Dichromate Method)')
console.log('-'.repeat(45))

test('COD: (25-20) x 0.25 x 8000 / 50 = 200 mg/L', () => {
  const result = calculateCOD({
    fasTitrantBlank: 25,
    fasTitrantSample: 20,
    fasNormality: 0.25,
    sampleVolume: 50,
  })
  expect(result.cod).toBeCloseTo(200, 1)
})

test('COD: (30-15) x 0.1 x 8000 / 25 = 480 mg/L', () => {
  const result = calculateCOD({
    fasTitrantBlank: 30,
    fasTitrantSample: 15,
    fasNormality: 0.1,
    sampleVolume: 25,
  })
  expect(result.cod).toBeCloseTo(480, 1)
})

test('COD validation: sample > blank throws', () => {
  let threw = false
  try {
    calculateCOD({
      fasTitrantBlank: 20,
      fasTitrantSample: 25,
      fasNormality: 0.25,
      sampleVolume: 50,
    })
  } catch {
    threw = true
  }
  expect(threw).toBe(true)
})

console.log('')

// =====================================================
// BOD/COD RATIO
// =====================================================
console.log('📊 BOD/COD RATIO (Biodegradability)')
console.log('-'.repeat(45))

test('Ratio > 0.5: easily biodegradable', () => {
  const result = calculateBODCODRatio(300, 500)
  expect(result.ratio).toBeCloseTo(0.6, 0.01)
  expect(result.classification).toBe('easily_biodegradable')
})

test('Ratio 0.3-0.5: moderately biodegradable', () => {
  const result = calculateBODCODRatio(200, 500)
  expect(result.ratio).toBeCloseTo(0.4, 0.01)
  expect(result.classification).toBe('moderately_biodegradable')
})

test('Ratio < 0.3: difficult to biodegrade', () => {
  const result = calculateBODCODRatio(100, 500)
  expect(result.ratio).toBeCloseTo(0.2, 0.01)
  expect(result.classification).toBe('difficult_to_biodegrade')
})

test('Domestic wastewater: BOD/COD ~ 0.5', () => {
  const result = calculateBODCODRatio(200, 400)
  expect(result.ratio).toBeCloseTo(0.5, 0.01)
})

test('Textile industry: BOD/COD ~ 0.1 (refractory)', () => {
  const result = calculateBODCODRatio(100, 1000)
  expect(result.ratio).toBeCloseTo(0.1, 0.01)
  expect(result.classification).toBe('difficult_to_biodegrade')
})

console.log('')

// =====================================================
// BOD LOADING RATE
// =====================================================
console.log('📦 BOD LOADING RATE')
console.log('-'.repeat(45))

test('Loading: 200 mg/L x 1000 m3/day = 200 kg/day', () => {
  const result = calculateBODLoadingRate({
    bod: 200,
    flowRate: 1000,
  })
  expect(result.loading).toBeCloseTo(200, 1)
})

test('Loading: 500 mg/L x 500 m3/day = 250 kg/day', () => {
  const result = calculateBODLoadingRate({
    bod: 500,
    flowRate: 500,
  })
  expect(result.loading).toBeCloseTo(250, 1)
})

console.log('')

// =====================================================
// REMOVAL EFFICIENCY
// =====================================================
console.log('✅ REMOVAL EFFICIENCY')
console.log('-'.repeat(45))

test('Efficiency: (200-20)/200 = 90%', () => {
  const result = calculateRemovalEfficiency({
    influentConc: 200,
    effluentConc: 20,
  })
  expect(result.efficiency).toBeCloseTo(90, 0.1)
  expect(result.removalRate).toBeCloseTo(180, 0.1)
})

test('Efficiency: (100-15)/100 = 85%', () => {
  const result = calculateRemovalEfficiency({
    influentConc: 100,
    effluentConc: 15,
  })
  expect(result.efficiency).toBeCloseTo(85, 0.1)
})

test('Efficiency: 100% removal', () => {
  const result = calculateRemovalEfficiency({
    influentConc: 200,
    effluentConc: 0,
  })
  expect(result.efficiency).toBeCloseTo(100, 0.1)
})

console.log('')

// =====================================================
// TEMPERATURE CORRECTION
// =====================================================
console.log('🌡️ TEMPERATURE CORRECTION (van\'t Hoff)')
console.log('-'.repeat(45))

test('k at 25C: k_25 = 0.23 x 1.047^5 = 0.29', () => {
  const result = temperatureCorrection({
    k20: 0.23,
    targetTemperature: 25,
  })
  // 0.23 x 1.047^5 = 0.23 x 1.258 = 0.289
  expect(result.kT).toBeCloseTo(0.289, 0.01)
})

test('k at 15C: k_15 = 0.23 x 1.047^(-5) = 0.18', () => {
  const result = temperatureCorrection({
    k20: 0.23,
    targetTemperature: 15,
  })
  // 0.23 x 1.047^(-5) = 0.23 x 0.795 = 0.183
  expect(result.kT).toBeCloseTo(0.183, 0.01)
})

test('k at 30C increases further', () => {
  const result = temperatureCorrection({
    k20: 0.23,
    targetTemperature: 30,
  })
  expect(result.kT).toBeGreaterThan(0.23)
  expect(result.kT).toBeGreaterThan(0.35)
})

test('k at 10C decreases significantly', () => {
  const result = temperatureCorrection({
    k20: 0.23,
    targetTemperature: 10,
  })
  expect(result.kT).toBeLessThan(0.23)
  expect(result.kT).toBeLessThan(0.15)
})

console.log('')

// =====================================================
// K-RATE DETERMINATION (Thomas Method)
// =====================================================
console.log('📉 K-RATE DETERMINATION (Thomas Method)')
console.log('-'.repeat(45))

test('K-rate from BOD time series (Thomas method approximation)', () => {
  // Simulated data for BODu~200, k~0.23
  // Note: Thomas method is an approximation, results may differ from theoretical
  // BOD_t = 200 x (1 - e^(-0.23 x t))
  const data = [
    { day: 1, bod: 41 },   // 200 x (1 - e^-0.23) = 41.1
    { day: 2, bod: 74 },   // 200 x (1 - e^-0.46) = 73.6
    { day: 3, bod: 100 },  // 200 x (1 - e^-0.69) = 99.7
    { day: 5, bod: 137 },  // 200 x (1 - e^-1.15) = 136.6
    { day: 7, bod: 160 },  // 200 x (1 - e^-1.61) = 160.0
  ]
  const result = calculateKRate(data)
  // Thomas method gives approximate values
  expect(result.k).toBeGreaterThan(0.1)
  expect(result.k).toBeLessThan(0.5)
  expect(result.bodu).toBeGreaterThan(50)
  expect(result.bodu).toBeLessThan(300)
  expect(result.r2).toBeGreaterThan(0.95) // Good linear fit
  expect(result.method).toBe('thomas')
})

test('K-rate needs at least 3 data points', () => {
  let threw = false
  try {
    calculateKRate([
      { day: 1, bod: 50 },
      { day: 5, bod: 130 },
    ])
  } catch {
    threw = true
  }
  expect(threw).toBe(true)
})

console.log('')

// =====================================================
// THAI STANDARDS COMPLIANCE
// =====================================================
console.log('🇹🇭 THAI STANDARDS COMPLIANCE')
console.log('-'.repeat(45))

test('Type A: BOD=15, COD=100 passes', () => {
  const result = checkThaiStandards(
    { bod: 15, cod: 100, ph: 7.0 },
    'type_a'
  )
  expect(result.isCompliant).toBe(true)
  expect(result.exceedances.length).toBe(0)
})

test('Type A: BOD=30 fails (limit=20)', () => {
  const result = checkThaiStandards(
    { bod: 30, cod: 100 },
    'type_a'
  )
  expect(result.isCompliant).toBe(false)
  expect(result.exceedances.length).toBe(1)
  expect(result.exceedances[0].parameter).toBe('BOD')
})

test('Type A: COD=150 fails (limit=120)', () => {
  const result = checkThaiStandards(
    { bod: 15, cod: 150 },
    'type_a'
  )
  expect(result.isCompliant).toBe(false)
  expect(result.exceedances[0].parameter).toBe('COD')
})

test('Type B: BOD=50 passes (limit=60)', () => {
  const result = checkThaiStandards(
    { bod: 50, cod: 300 },
    'type_b'
  )
  expect(result.isCompliant).toBe(true)
})

test('Type C: BOD=35, COD=180 passes', () => {
  const result = checkThaiStandards(
    { bod: 35, cod: 180 },
    'type_c'
  )
  expect(result.isCompliant).toBe(true)
})

test('pH out of range fails', () => {
  const result = checkThaiStandards(
    { ph: 4.0 },
    'type_a'
  )
  expect(result.isCompliant).toBe(false)
  expect(result.exceedances[0].parameter).toBe('pH')
})

test('Multiple exceedances detected', () => {
  const result = checkThaiStandards(
    { bod: 30, cod: 150, ss: 100 },
    'type_a'
  )
  expect(result.isCompliant).toBe(false)
  expect(result.exceedances.length).toBe(3)
})

console.log('')

// =====================================================
// REAL-WORLD SCENARIOS
// =====================================================
console.log('🏭 REAL-WORLD SCENARIOS')
console.log('-'.repeat(45))

test('Domestic wastewater treatment plant', () => {
  // Influent: BOD=200, COD=400
  // Effluent: BOD=15, COD=80
  const efficiency = calculateRemovalEfficiency({
    influentConc: 200,
    effluentConc: 15,
  })
  expect(efficiency.efficiency).toBeCloseTo(92.5, 1)

  const compliance = checkThaiStandards(
    { bod: 15, cod: 80 },
    'type_a'
  )
  expect(compliance.isCompliant).toBe(true)
})

test('Food processing industry', () => {
  const ratio = calculateBODCODRatio(500, 800)
  expect(ratio.ratio).toBeCloseTo(0.625, 0.01)
  expect(ratio.classification).toBe('easily_biodegradable')
})

test('Textile industry (refractory)', () => {
  const ratio = calculateBODCODRatio(100, 1000)
  expect(ratio.ratio).toBeCloseTo(0.1, 0.01)
  expect(ratio.classification).toBe('difficult_to_biodegrade')
})

test('Daily BOD loading calculation', () => {
  const loading = calculateBODLoadingRate({
    bod: 200,
    flowRate: 5000, // 5000 m3/day
  })
  expect(loading.loading).toBeCloseTo(1000, 1) // 1000 kg BOD/day
})

console.log('')

// =====================================================
// PERFORMANCE TESTS
// =====================================================
console.log('⏱️ PERFORMANCE TESTS')
console.log('-'.repeat(45))

test('1000 BOD5 calculations < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    calculateBOD5({
      initialDO: 8.0,
      finalDO: 3.0 + (i % 3),
      sampleVolume: 30,
      bottleVolume: 300,
    })
  }
  const elapsed = Date.now() - start
  console.log(`   1000 BOD5 calcs: ${elapsed}ms`)
  expect(elapsed).toBeLessThan(20)
})

test('1000 compliance checks < 20ms', () => {
  const start = Date.now()
  for (let i = 0; i < 1000; i++) {
    checkThaiStandards(
      { bod: 15 + (i % 20), cod: 80 + (i % 50) },
      'type_a'
    )
  }
  const elapsed = Date.now() - start
  console.log(`   1000 compliance checks: ${elapsed}ms`)
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
  console.log('🏆 ALL TESTS PASSED! VerChem Environmental is WORLD-CLASS!')
} else if (failed <= 3) {
  console.log('⚠️ ALMOST THERE! A few edge cases to fix.')
} else {
  console.log('🔧 NEEDS WORK. Multiple failures detected.')
}

process.exit(failed > 0 ? 1 : 0)
