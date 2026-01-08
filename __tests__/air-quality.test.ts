/**
 * VerChem - Air Quality Calculator Tests
 * Lightweight test harness (no Jest required)
 */

import assert from 'node:assert/strict'

import {
  calculateAQI,
  getAQICategory,
  findBreakpoint,
  convertConcentration,
  calculateMolarVolume,
  checkThaiAirStandard,
  calculateEmissionRate,
  calculatePlumeRise,
  calculateGaussianDispersion,
  getDispersionCoefficients,
  POLLUTANT_INFO,
  AQI_CATEGORIES,
  THAI_AIR_STANDARDS,
  STABILITY_CLASSES,
  MOLAR_VOLUME_STP,
} from '@/lib/calculations/air-quality'

import type {
  Pollutant,
  StabilityClass,
} from '@/lib/types/air-quality'

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
    toBeNull() {
      assert.equal(actual, null)
    },
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected)
    },
    toBeCloseTo(expected: number, precision: number = 2) {
      const tolerance = Math.pow(10, -precision) / 2
      assert.ok(
        Math.abs((actual as number) - expected) < tolerance,
        `Expected ${actual} to be close to ${expected}`
      )
    },
    toBeGreaterThan(expected: number) {
      assert.ok((actual as number) > expected, `Expected ${actual} > ${expected}`)
    },
    toBeGreaterThanOrEqual(expected: number) {
      assert.ok((actual as number) >= expected, `Expected ${actual} >= ${expected}`)
    },
    toBeLessThan(expected: number) {
      assert.ok((actual as number) < expected, `Expected ${actual} < ${expected}`)
    },
    toBeLessThanOrEqual(expected: number) {
      assert.ok((actual as number) <= expected, `Expected ${actual} <= ${expected}`)
    },
    toBeDefined() {
      assert.ok(actual !== undefined, `Expected value to be defined`)
    },
    toBeTruthy() {
      assert.ok(actual, `Expected ${actual} to be truthy`)
    },
    not: {
      toBeNull() {
        assert.notEqual(actual, null)
      },
    },
    toThrow(message?: string) {
      try {
        (actual as () => void)()
        assert.fail('Expected function to throw')
      } catch (error) {
        if (message && error instanceof Error) {
          assert.ok(error.message.includes(message), `Expected error "${error.message}" to include "${message}"`)
        }
      }
    },
    toContain(expected: unknown) {
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected), `Expected array to contain ${expected}`)
      } else if (typeof actual === 'string') {
        assert.ok(actual.includes(String(expected)), `Expected string to contain ${expected}`)
      }
    },
  }
}

// ============================================
// 1. AQI CALCULATION TESTS
// ============================================

describe('AQI Calculation', () => {
  describe('PM2.5 AQI', () => {
    test('Good air quality (AQI 0-50)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 5 })
      expect(result.aqi).toBeGreaterThanOrEqual(0)
      expect(result.aqi).toBeLessThanOrEqual(50)
      expect(result.category.level).toBe('good')
    })

    test('Moderate air quality (AQI 51-100)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 20 })
      expect(result.aqi).toBeGreaterThanOrEqual(51)
      expect(result.aqi).toBeLessThanOrEqual(100)
      expect(result.category.level).toBe('moderate')
    })

    test('Unhealthy for sensitive groups (AQI 101-150)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 45 })
      expect(result.aqi).toBeGreaterThanOrEqual(101)
      expect(result.aqi).toBeLessThanOrEqual(150)
      expect(result.category.level).toBe('unhealthy_sensitive')
    })

    test('Unhealthy (AQI 151-200)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 90 })
      expect(result.aqi).toBeGreaterThanOrEqual(151)
      expect(result.aqi).toBeLessThanOrEqual(200)
      expect(result.category.level).toBe('unhealthy')
    })

    test('Very Unhealthy (AQI 201-300)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 175 })
      expect(result.aqi).toBeGreaterThanOrEqual(201)
      expect(result.aqi).toBeLessThanOrEqual(300)
      expect(result.category.level).toBe('very_unhealthy')
    })

    test('Hazardous (AQI 301-500)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 275 })
      expect(result.aqi).toBeGreaterThanOrEqual(301)
      expect(result.aqi).toBeLessThanOrEqual(500)
      expect(result.category.level).toBe('hazardous')
    })

    test('Exact breakpoint boundary (9.0 µg/m³)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 9.0 })
      expect(result.aqi).toBe(50)
    })

    test('Exact breakpoint boundary (35.4 µg/m³)', () => {
      const result = calculateAQI({ pollutant: 'pm25', concentration: 35.4 })
      expect(result.aqi).toBe(100)
    })
  })

  describe('PM10 AQI', () => {
    test('Good PM10 (AQI 0-50)', () => {
      const result = calculateAQI({ pollutant: 'pm10', concentration: 30 })
      expect(result.aqi).toBeGreaterThanOrEqual(0)
      expect(result.aqi).toBeLessThanOrEqual(50)
    })

    test('Moderate PM10 (AQI 51-100)', () => {
      const result = calculateAQI({ pollutant: 'pm10', concentration: 100 })
      expect(result.aqi).toBeGreaterThanOrEqual(51)
      expect(result.aqi).toBeLessThanOrEqual(100)
    })
  })

  describe('Ozone AQI', () => {
    test('Good O3 (8-hour)', () => {
      const result = calculateAQI({ pollutant: 'o3', concentration: 0.04 })
      expect(result.aqi).toBeGreaterThanOrEqual(0)
      expect(result.aqi).toBeLessThanOrEqual(50)
    })

    test('Moderate O3 (8-hour)', () => {
      const result = calculateAQI({ pollutant: 'o3', concentration: 0.065 })
      expect(result.aqi).toBeGreaterThanOrEqual(51)
      expect(result.aqi).toBeLessThanOrEqual(100)
    })
  })

  describe('CO AQI', () => {
    test('Good CO (8-hour)', () => {
      const result = calculateAQI({ pollutant: 'co', concentration: 2 })
      expect(result.aqi).toBeGreaterThanOrEqual(0)
      expect(result.aqi).toBeLessThanOrEqual(50)
    })

    test('Moderate CO (8-hour)', () => {
      const result = calculateAQI({ pollutant: 'co', concentration: 7 })
      expect(result.aqi).toBeGreaterThanOrEqual(51)
      expect(result.aqi).toBeLessThanOrEqual(100)
    })
  })

  describe('NO2 AQI', () => {
    test('Good NO2 (1-hour)', () => {
      const result = calculateAQI({ pollutant: 'no2', concentration: 30 })
      expect(result.aqi).toBeGreaterThanOrEqual(0)
      expect(result.aqi).toBeLessThanOrEqual(50)
    })
  })

  describe('SO2 AQI', () => {
    test('Good SO2 (1-hour)', () => {
      const result = calculateAQI({ pollutant: 'so2', concentration: 20 })
      expect(result.aqi).toBeGreaterThanOrEqual(0)
      expect(result.aqi).toBeLessThanOrEqual(50)
    })
  })

  describe('AQI Helper Functions', () => {
    test('getAQICategory returns correct category', () => {
      expect(getAQICategory(25).level).toBe('good')
      expect(getAQICategory(75).level).toBe('moderate')
      expect(getAQICategory(125).level).toBe('unhealthy_sensitive')
      expect(getAQICategory(175).level).toBe('unhealthy')
      expect(getAQICategory(250).level).toBe('very_unhealthy')
      expect(getAQICategory(400).level).toBe('hazardous')
    })

    test('getAQICategory handles AQI > 500', () => {
      const category = getAQICategory(600)
      expect(category.level).toBe('hazardous')
    })

    test('findBreakpoint returns correct breakpoint', () => {
      const bp = findBreakpoint('pm25', 50)
      expect(bp).not.toBeNull()
      expect(bp?.aqi.low).toBe(101)
      expect(bp?.aqi.high).toBe(150)
    })

    test('findBreakpoint returns null for invalid pollutant/concentration', () => {
      const bp = findBreakpoint('pb' as Pollutant, 100)
      expect(bp).toBeNull()
    })
  })

  describe('AQI Validation', () => {
    test('throws error for negative concentration', () => {
      expect(() => calculateAQI({ pollutant: 'pm25', concentration: -10 }))
        .toThrow('Concentration cannot be negative')
    })
  })
})

// ============================================
// 2. CONCENTRATION CONVERSION TESTS
// ============================================

describe('Concentration Conversion', () => {
  describe('Molar Volume Calculation', () => {
    test('calculates molar volume at STP (25°C, 1 atm)', () => {
      const vm = calculateMolarVolume(25, 1)
      expect(Math.abs(vm - MOLAR_VOLUME_STP)).toBeLessThan(0.5)
    })

    test('molar volume increases with temperature', () => {
      const vm25 = calculateMolarVolume(25, 1)
      const vm35 = calculateMolarVolume(35, 1)
      expect(vm35).toBeGreaterThan(vm25)
    })
  })

  describe('ppm to µg/m³ Conversion', () => {
    test('converts CO ppm to µg/m³', () => {
      const result = convertConcentration({
        pollutant: 'co',
        value: 1,
        fromUnit: 'ppm',
        toUnit: 'µg/m³',
      })
      // 1 ppm CO ≈ 1145 µg/m³
      expect(Math.abs(result.outputValue - 1145)).toBeLessThan(50)
    })

    test('converts NO2 ppm to µg/m³', () => {
      const result = convertConcentration({
        pollutant: 'no2',
        value: 1,
        fromUnit: 'ppm',
        toUnit: 'µg/m³',
      })
      // 1 ppm NO2 ≈ 1882 µg/m³
      expect(Math.abs(result.outputValue - 1882)).toBeLessThan(50)
    })
  })

  describe('µg/m³ to ppm Conversion', () => {
    test('converts µg/m³ to ppm (reverse)', () => {
      const result = convertConcentration({
        pollutant: 'co',
        value: 1145,
        fromUnit: 'µg/m³',
        toUnit: 'ppm',
      })
      expect(Math.abs(result.outputValue - 1)).toBeLessThan(0.1)
    })
  })

  describe('Conversion Validation', () => {
    test('throws error for particulates with ppm', () => {
      expect(() => convertConcentration({
        pollutant: 'pm25',
        value: 10,
        fromUnit: 'ppm',
        toUnit: 'µg/m³',
      })).toThrow('Cannot use ppm/ppb for particulate matter')
    })

    test('throws error for negative concentration', () => {
      expect(() => convertConcentration({
        pollutant: 'co',
        value: -10,
        fromUnit: 'ppm',
        toUnit: 'µg/m³',
      })).toThrow('Concentration cannot be negative')
    })
  })
})

// ============================================
// 3. THAI STANDARDS COMPLIANCE TESTS
// ============================================

describe('Thai Air Quality Standards', () => {
  describe('PM2.5 Standards', () => {
    test('compliant: below 24-hour standard', () => {
      const result = checkThaiAirStandard('pm25', 25, '24-hour')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.limit).toBe(37.5)
    })

    test('non-compliant: exceeds 24-hour standard', () => {
      const result = checkThaiAirStandard('pm25', 50, '24-hour')
      expect(result.isCompliant).toBe(false)
      expect(result.exceedancePercent).toBeGreaterThan(30)
    })

    test('compliant: below annual standard', () => {
      const result = checkThaiAirStandard('pm25', 10, 'annual')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.limit).toBe(15)
    })
  })

  describe('PM10 Standards', () => {
    test('compliant: below 24-hour standard', () => {
      const result = checkThaiAirStandard('pm10', 100, '24-hour')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.limit).toBe(120)
    })
  })

  describe('Ozone Standards', () => {
    test('compliant: below 1-hour standard', () => {
      const result = checkThaiAirStandard('o3', 0.08, '1-hour')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.limit).toBe(0.10)
    })
  })

  describe('CO Standards', () => {
    test('compliant: below 8-hour standard', () => {
      const result = checkThaiAirStandard('co', 5, '8-hour')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.limit).toBe(9)
    })
  })

  describe('Standard Lookup Errors', () => {
    test('throws error for non-existent standard', () => {
      expect(() => checkThaiAirStandard('pb', 1, '24-hour'))
        .toThrow('No Thai standard found')
    })
  })
})

// ============================================
// 4. EMISSION RATE TESTS
// ============================================

describe('Emission Rate Calculation', () => {
  test('calculates emission from mg/m³ and m³/s', () => {
    const result = calculateEmissionRate({
      pollutant: 'pm25',
      concentration: 100,
      concentrationUnit: 'mg/m³',
      flowRate: 10,
      flowRateUnit: 'm³/s',
    })

    // 100 mg/m³ × 10 m³/s = 1000 mg/s = 1 g/s
    expect(Math.abs(result.massFlowRate - 1)).toBeLessThan(0.1)
    expect(Math.abs(result.hourlyEmission - 3.6)).toBeLessThan(0.1)
  })

  test('calculates daily emission with operating hours', () => {
    const result = calculateEmissionRate({
      pollutant: 'co',
      concentration: 1,
      concentrationUnit: 'g/m³',
      flowRate: 1,
      flowRateUnit: 'm³/s',
      operatingHours: 8,
    })

    // 1 g/m³ × 1 m³/s = 1 g/s = 3.6 kg/hr
    // Daily = 3.6 kg/hr × 8 hr = 28.8 kg/day
    expect(Math.abs(result.dailyEmission - 28.8)).toBeLessThan(0.5)
  })
})

// ============================================
// 5. PLUME RISE TESTS
// ============================================

describe('Plume Rise Calculation', () => {
  test('calculates plume rise for typical industrial stack', () => {
    const result = calculatePlumeRise({
      height: 50,
      diameter: 2,
      exitVelocity: 15,
      exitTemperature: 423,  // 150°C
      ambientTemperature: 298,  // 25°C
      emissionRate: 100,
    })

    expect(result.effectiveHeight).toBeGreaterThan(50)
    expect(result.plumeRise).toBeGreaterThan(0)
    expect(result.buoyancyFlux).toBeGreaterThan(0)
    expect(result.momentumFlux).toBeGreaterThan(0)
  })

  test('higher exit temperature increases plume rise', () => {
    const result1 = calculatePlumeRise({
      height: 50,
      diameter: 2,
      exitVelocity: 15,
      exitTemperature: 373,  // 100°C
      ambientTemperature: 298,
      emissionRate: 100,
    })

    const result2 = calculatePlumeRise({
      height: 50,
      diameter: 2,
      exitVelocity: 15,
      exitTemperature: 473,  // 200°C
      ambientTemperature: 298,
      emissionRate: 100,
    })

    expect(result2.plumeRise).toBeGreaterThan(result1.plumeRise)
  })

  test('throws error for negative stack height', () => {
    expect(() => calculatePlumeRise({
      height: -10,
      diameter: 2,
      exitVelocity: 15,
      exitTemperature: 423,
      ambientTemperature: 298,
      emissionRate: 100,
    })).toThrow('Stack parameters must be positive')
  })

  test('throws error when exit temp <= ambient temp', () => {
    expect(() => calculatePlumeRise({
      height: 50,
      diameter: 2,
      exitVelocity: 15,
      exitTemperature: 298,
      ambientTemperature: 298,
      emissionRate: 100,
    })).toThrow('Exit temperature must be greater than ambient temperature')
  })
})

// ============================================
// 6. GAUSSIAN DISPERSION TESTS
// ============================================

describe('Gaussian Dispersion Model', () => {
  describe('Dispersion Coefficients', () => {
    test('unstable conditions give larger dispersion', () => {
      const unstable = getDispersionCoefficients(1000, 'A')
      const stable = getDispersionCoefficients(1000, 'F')

      expect(unstable.sigmaY).toBeGreaterThan(stable.sigmaY)
      expect(unstable.sigmaZ).toBeGreaterThan(stable.sigmaZ)
    })

    test('dispersion increases with distance', () => {
      const near = getDispersionCoefficients(500, 'D')
      const far = getDispersionCoefficients(2000, 'D')

      expect(far.sigmaY).toBeGreaterThan(near.sigmaY)
      expect(far.sigmaZ).toBeGreaterThan(near.sigmaZ)
    })

    test('all stability classes return positive values', () => {
      const classes: StabilityClass[] = ['A', 'B', 'C', 'D', 'E', 'F']

      for (const cls of classes) {
        const { sigmaY, sigmaZ } = getDispersionCoefficients(1000, cls)
        expect(sigmaY).toBeGreaterThan(0)
        expect(sigmaZ).toBeGreaterThan(0)
      }
    })
  })

  describe('Ground-Level Concentration', () => {
    test('calculates concentration at ground level', () => {
      const result = calculateGaussianDispersion({
        emissionRate: 100,
        effectiveHeight: 100,
        windSpeed: 5,
        stabilityClass: 'D',
        downwindDistance: 1000,
        crosswindDistance: 0,
        receptorHeight: 0,
      })

      expect(result.concentration).toBeGreaterThan(0)
      expect(result.sigmaY).toBeGreaterThan(0)
      expect(result.sigmaZ).toBeGreaterThan(0)
    })

    test('concentration decreases off-centerline', () => {
      const centerline = calculateGaussianDispersion({
        emissionRate: 100,
        effectiveHeight: 100,
        windSpeed: 5,
        stabilityClass: 'D',
        downwindDistance: 1000,
        crosswindDistance: 0,
      })

      const offCenter = calculateGaussianDispersion({
        emissionRate: 100,
        effectiveHeight: 100,
        windSpeed: 5,
        stabilityClass: 'D',
        downwindDistance: 1000,
        crosswindDistance: 200,
      })

      expect(centerline.concentration).toBeGreaterThan(offCenter.concentration)
    })

    test('higher wind speed reduces concentration', () => {
      const lowWind = calculateGaussianDispersion({
        emissionRate: 100,
        effectiveHeight: 100,
        windSpeed: 2,
        stabilityClass: 'D',
        downwindDistance: 1000,
      })

      const highWind = calculateGaussianDispersion({
        emissionRate: 100,
        effectiveHeight: 100,
        windSpeed: 10,
        stabilityClass: 'D',
        downwindDistance: 1000,
      })

      expect(lowWind.concentration).toBeGreaterThan(highWind.concentration)
    })
  })

  describe('Validation', () => {
    test('throws error for negative emission rate', () => {
      expect(() => calculateGaussianDispersion({
        emissionRate: -100,
        effectiveHeight: 100,
        windSpeed: 5,
        stabilityClass: 'D',
        downwindDistance: 1000,
      })).toThrow('must be positive')
    })

    test('throws error for zero wind speed', () => {
      expect(() => calculateGaussianDispersion({
        emissionRate: 100,
        effectiveHeight: 100,
        windSpeed: 0,
        stabilityClass: 'D',
        downwindDistance: 1000,
      })).toThrow('must be positive')
    })
  })
})

// ============================================
// 7. DATA INTEGRITY TESTS
// ============================================

describe('Data Integrity', () => {
  test('all pollutants have complete info', () => {
    const pollutants: Pollutant[] = ['pm25', 'pm10', 'o3', 'co', 'no2', 'so2', 'pb']

    for (const p of pollutants) {
      const info = POLLUTANT_INFO[p]
      expect(info.id).toBe(p)
      expect(info.name).toBeTruthy()
      expect(info.nameThai).toBeTruthy()
      expect(info.formula).toBeTruthy()
      expect(info.healthEffects).toBeTruthy()
    }
  })

  test('AQI categories cover 0-500', () => {
    expect(AQI_CATEGORIES[0].range.min).toBe(0)
    expect(AQI_CATEGORIES[AQI_CATEGORIES.length - 1].range.max).toBe(500)
  })

  test('Thai standards have valid pollutants', () => {
    const validPollutants: Pollutant[] = ['pm25', 'pm10', 'o3', 'co', 'no2', 'so2', 'pb']

    for (const standard of THAI_AIR_STANDARDS) {
      expect(validPollutants).toContain(standard.pollutant)
      expect(standard.limit).toBeGreaterThan(0)
      expect(standard.year).toBeGreaterThanOrEqual(2004)
    }
  })

  test('stability classes are complete', () => {
    const classes: StabilityClass[] = ['A', 'B', 'C', 'D', 'E', 'F']

    for (const cls of classes) {
      const info = STABILITY_CLASSES.find(s => s.class === cls)
      expect(info).toBeDefined()
      expect(info?.name).toBeTruthy()
      expect(info?.description).toBeTruthy()
    }
  })
})

// ============================================
// RUN TESTS
// ============================================

async function runTests() {
  console.log('🌬️ VerChem Air Quality Calculator Unit Tests')
  console.log('============================================\n')

  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}`)
      if (error instanceof Error) {
        console.log(`   Error: ${error.message}`)
      }
      failed++
    }
  }

  console.log('\n📊 Test Summary')
  console.log('--------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failed}`)

  if (failed === 0) {
    console.log('\n✅ All air quality tests passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Some tests failed')
    process.exit(1)
  }
}

runTests()
