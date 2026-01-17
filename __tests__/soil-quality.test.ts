/**
 * VerChem - Soil Quality Calculator Tests
 * Lightweight test harness (no Jest required)
 */

import assert from 'node:assert/strict'

import {
  checkSoilContamination,
  classifySoilpH,
  analyzeNPK,
  calculateCEC,
  calculateOrganicMatter,
  classifySoilTexture,
  assessSalinity,
  HEAVY_METAL_INFO,
  THAI_SOIL_STANDARDS,
  SOIL_PH_CLASSES,
} from '@/lib/calculations/soil-quality'

import type {
  HeavyMetal,
} from '@/lib/types/soil-quality'

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
    toBeCloseTo(expected: number, tolerance: number = 0.01) {
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
    toThrow(message?: string) {
      try {
        (actual as () => void)()
        assert.fail('Expected function to throw')
      } catch (error) {
        if (message && error instanceof Error) {
          assert.ok(error.message.includes(message), `Expected error to include "${message}"`)
        }
      }
    },
    toContain(expected: unknown) {
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected), `Expected array to contain ${expected}`)
      }
    },
  }
}

// ============================================
// 1. CONTAMINATION TESTS
// ============================================

describe('Soil Contamination Check', () => {
  describe('Lead (Pb) Standards', () => {
    test('compliant: Pb below residential limit', () => {
      const result = checkSoilContamination('pb', 200, 'residential')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.residential).toBe(400)
      // ratio = 200/400 = 0.5, which is <= 0.5, so 'safe'
      expect(result.riskLevel).toBe('safe')
    })

    test('non-compliant: Pb exceeds residential limit', () => {
      const result = checkSoilContamination('pb', 500, 'residential')
      expect(result.isCompliant).toBe(false)
      expect(result.exceedancePercent).toBeGreaterThan(20)
      expect(result.riskLevel).toBe('hazardous')
    })

    test('compliant under industrial but not residential', () => {
      const resultRes = checkSoilContamination('pb', 500, 'residential')
      const resultInd = checkSoilContamination('pb', 500, 'industrial')

      expect(resultRes.isCompliant).toBe(false)
      expect(resultInd.isCompliant).toBe(true)
    })

    test('safe risk level for low concentration', () => {
      const result = checkSoilContamination('pb', 100, 'residential')
      expect(result.riskLevel).toBe('safe')
    })
  })

  describe('Cadmium (Cd) Standards', () => {
    test('compliant: Cd below agricultural limit', () => {
      const result = checkSoilContamination('cd', 20, 'agricultural')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.agricultural).toBe(37)
    })

    test('critical risk for very high contamination', () => {
      const result = checkSoilContamination('cd', 100, 'residential')
      expect(result.isCompliant).toBe(false)
      expect(result.riskLevel).toBe('critical')
    })
  })

  describe('Arsenic (As) Standards', () => {
    test('arsenic has strict residential limit', () => {
      const result = checkSoilContamination('as', 5, 'residential')
      expect(result.isCompliant).toBe(false)
      expect(result.standard.residential).toBe(3.9)
    })

    test('arsenic industrial limit is higher', () => {
      const result = checkSoilContamination('as', 20, 'industrial')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.industrial).toBe(27)
    })
  })

  describe('Other Metals', () => {
    test('zinc has higher limits', () => {
      const result = checkSoilContamination('zn', 500, 'residential')
      expect(result.isCompliant).toBe(true)
      expect(result.standard.residential).toBe(890)
    })

    test('copper compliance check', () => {
      const result = checkSoilContamination('cu', 100, 'residential')
      expect(result.isCompliant).toBe(true)
    })

    test('nickel compliance check', () => {
      const result = checkSoilContamination('ni', 200, 'industrial')
      expect(result.isCompliant).toBe(true)
    })
  })

  describe('Recommendations', () => {
    test('provides recommendations for hazardous levels', () => {
      const result = checkSoilContamination('pb', 600, 'residential')
      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })
})

// ============================================
// 2. SOIL pH TESTS
// ============================================

describe('Soil pH Classification', () => {
  test('ultra acidic (pH < 3.5)', () => {
    const result = classifySoilpH(3.0)
    expect(result.classification.class).toBe('ultra_acidic')
    expect(result.limeRequirement).toBeGreaterThan(0)
  })

  test('strongly acidic (5.1-5.5)', () => {
    const result = classifySoilpH(5.3)
    expect(result.classification.class).toBe('strongly_acidic')
  })

  test('slightly acidic (6.1-6.5)', () => {
    const result = classifySoilpH(6.3)
    expect(result.classification.class).toBe('slightly_acidic')
  })

  test('neutral (6.6-7.3)', () => {
    const result = classifySoilpH(7.0)
    expect(result.classification.class).toBe('neutral')
    expect(result.limeRequirement).toBe(undefined)
    expect(result.sulfurRequirement).toBe(undefined)
  })

  test('moderately alkaline (7.9-8.4)', () => {
    const result = classifySoilpH(8.2)
    expect(result.classification.class).toBe('moderately_alkaline')
    expect(result.sulfurRequirement).toBeGreaterThan(0)
  })

  test('very strongly alkaline (>9.0)', () => {
    const result = classifySoilpH(9.5)
    expect(result.classification.class).toBe('very_strongly_alkaline')
  })

  test('calculates hydrogen concentration', () => {
    const result = classifySoilpH(7.0)
    expect(result.hydrogenConcentration).toBeCloseTo(1e-7, 1e-8)
  })

  test('throws error for invalid pH', () => {
    expect(() => classifySoilpH(-1)).toThrow('pH must be between 0 and 14')
    expect(() => classifySoilpH(15)).toThrow('pH must be between 0 and 14')
  })
})

// ============================================
// 3. NPK ANALYSIS TESTS
// ============================================

describe('NPK Nutrient Analysis', () => {
  test('very low nitrogen', () => {
    const result = analyzeNPK({ nitrogen: 0.03, phosphorus: 15, potassium: 100 })
    expect(result.nitrogen.level).toBe('very_low')
  })

  test('medium nitrogen', () => {
    const result = analyzeNPK({ nitrogen: 0.15, phosphorus: 15, potassium: 100 })
    expect(result.nitrogen.level).toBe('medium')
  })

  test('high phosphorus', () => {
    const result = analyzeNPK({ nitrogen: 0.15, phosphorus: 50, potassium: 100 })
    expect(result.phosphorus.level).toBe('very_high')
  })

  test('low potassium', () => {
    const result = analyzeNPK({ nitrogen: 0.15, phosphorus: 15, potassium: 60 })
    expect(result.potassium.level).toBe('low')
  })

  test('calculates overall fertility', () => {
    const lowResult = analyzeNPK({ nitrogen: 0.03, phosphorus: 5, potassium: 30 })
    expect(lowResult.overallFertility).toBe('very_low')

    const highResult = analyzeNPK({ nitrogen: 0.35, phosphorus: 50, potassium: 300 })
    expect(highResult.overallFertility).toBe('very_high')
  })

  test('provides fertilizer recommendations', () => {
    const result = analyzeNPK({ nitrogen: 0.03, phosphorus: 5, potassium: 30 })
    expect(result.fertilizerRecommendation.length).toBeGreaterThan(0)
  })

  test('generates NPK ratio', () => {
    const result = analyzeNPK({ nitrogen: 0.15, phosphorus: 15, potassium: 100 })
    expect(result.npkRatio).toBeTruthy()
  })
})

// ============================================
// 4. CEC TESTS
// ============================================

describe('CEC Calculator', () => {
  test('calculates base saturation', () => {
    const result = calculateCEC({
      calcium: 8,
      magnesium: 2,
      potassium: 0.5,
      sodium: 0.2,
      cec: 15,
    })

    // Total bases = 10.7, BS = 10.7/15 * 100 = 71.3%
    expect(result.baseSaturation).toBeCloseTo(71.3, 1)
  })

  test('calculates individual saturations', () => {
    const result = calculateCEC({
      calcium: 10,
      magnesium: 3,
      potassium: 0.5,
      sodium: 0.3,
      cec: 20,
    })

    expect(result.calciumSaturation).toBeCloseTo(50, 1)
    expect(result.magnesiumSaturation).toBeCloseTo(15, 1)
  })

  test('classifies low CEC', () => {
    const result = calculateCEC({
      calcium: 2,
      magnesium: 0.5,
      potassium: 0.1,
      sodium: 0.1,
      cec: 4,
    })

    expect(result.classification).toBe('very_low')
  })

  test('classifies high CEC', () => {
    const result = calculateCEC({
      calcium: 20,
      magnesium: 5,
      potassium: 1,
      sodium: 0.5,
      cec: 35,
    })

    expect(result.classification).toBe('very_high')
  })

  test('throws error for zero CEC', () => {
    expect(() => calculateCEC({
      calcium: 5,
      magnesium: 1,
      potassium: 0.3,
      sodium: 0.1,
      cec: 0,
    })).toThrow('CEC must be positive')
  })
})

// ============================================
// 5. ORGANIC MATTER TESTS
// ============================================

describe('Organic Matter Analysis', () => {
  test('converts organic carbon to organic matter', () => {
    const result = calculateOrganicMatter({ organicCarbon: 2.0 })
    // OM = OC * 1.724 = 3.448
    expect(result.organicMatter).toBeCloseTo(3.448, 0.01)
  })

  test('converts loss on ignition to organic matter', () => {
    const result = calculateOrganicMatter({ lossOnIgnition: 5.0 })
    // OM = LOI * 0.7 = 3.5
    expect(result.organicMatter).toBeCloseTo(3.5, 0.01)
  })

  test('classifies very low organic matter', () => {
    const result = calculateOrganicMatter({ organicMatter: 0.5 })
    expect(result.classification).toBe('very_low')
  })

  test('classifies medium organic matter', () => {
    const result = calculateOrganicMatter({ organicMatter: 3.0 })
    expect(result.classification).toBe('medium')
  })

  test('classifies very high organic matter', () => {
    const result = calculateOrganicMatter({ organicMatter: 8.0 })
    expect(result.classification).toBe('very_high')
  })

  test('provides benefits and recommendations', () => {
    const result = calculateOrganicMatter({ organicMatter: 1.5 })
    expect(result.benefits.length).toBeGreaterThan(0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  test('throws error when no input provided', () => {
    expect(() => calculateOrganicMatter({})).toThrow('Please provide')
  })
})

// ============================================
// 6. SOIL TEXTURE TESTS
// ============================================

describe('Soil Texture Classification', () => {
  test('classifies sand', () => {
    const result = classifySoilTexture({ sand: 90, silt: 5, clay: 5 })
    expect(result.textureClass).toBe('sand')
  })

  test('classifies clay', () => {
    const result = classifySoilTexture({ sand: 20, silt: 30, clay: 50 })
    expect(result.textureClass).toBe('clay')
  })

  test('classifies loam', () => {
    const result = classifySoilTexture({ sand: 40, silt: 40, clay: 20 })
    expect(result.textureClass).toBe('loam')
  })

  test('classifies silt loam', () => {
    const result = classifySoilTexture({ sand: 20, silt: 60, clay: 20 })
    expect(result.textureClass).toBe('silt_loam')
  })

  test('classifies sandy loam', () => {
    const result = classifySoilTexture({ sand: 65, silt: 25, clay: 10 })
    expect(result.textureClass).toBe('sandy_loam')
  })

  test('provides soil properties', () => {
    const result = classifySoilTexture({ sand: 90, silt: 5, clay: 5 })
    expect(result.waterHoldingCapacity).toBe('Low')
    expect(result.drainage).toBe('Rapid (excessive)')
  })

  test('throws error when total is not 100', () => {
    expect(() => classifySoilTexture({ sand: 30, silt: 30, clay: 30 }))
      .toThrow('must equal 100%')
  })

  test('throws error for negative values', () => {
    expect(() => classifySoilTexture({ sand: -10, silt: 60, clay: 50 }))
      .toThrow('cannot be negative')
  })
})

// ============================================
// 7. SALINITY TESTS
// ============================================

describe('Salinity and Sodicity Assessment', () => {
  test('classifies non-saline soil', () => {
    const result = assessSalinity({ ec: 1.5 })
    expect(result.salinityClass).toBe('non_saline')
    expect(result.soilClassification).toBe('normal')
  })

  test('classifies slightly saline soil', () => {
    const result = assessSalinity({ ec: 3 })
    expect(result.salinityClass).toBe('slightly_saline')
  })

  test('classifies moderately saline soil', () => {
    const result = assessSalinity({ ec: 6 })
    expect(result.salinityClass).toBe('moderately_saline')
  })

  test('classifies strongly saline soil', () => {
    const result = assessSalinity({ ec: 12 })
    expect(result.salinityClass).toBe('strongly_saline')
  })

  test('classifies very strongly saline soil', () => {
    const result = assessSalinity({ ec: 20 })
    expect(result.salinityClass).toBe('very_strongly_saline')
  })

  test('calculates ESP from SAR', () => {
    const result = assessSalinity({ ec: 2, sar: 15 })
    expect(result.esp).toBeDefined()
    expect(result.esp).toBeGreaterThan(0)
  })

  test('classifies sodic soil', () => {
    const result = assessSalinity({ ec: 2, esp: 20 })
    expect(result.sodicityClass).toBe('strongly_sodic')
    expect(result.soilClassification).toBe('sodic')
  })

  test('classifies saline-sodic soil', () => {
    const result = assessSalinity({ ec: 8, esp: 20 })
    expect(result.soilClassification).toBe('saline_sodic')
  })

  test('provides crop tolerance info', () => {
    const result = assessSalinity({ ec: 6 })
    expect(result.cropTolerance.length).toBeGreaterThan(0)
  })

  test('provides remediation recommendations', () => {
    const result = assessSalinity({ ec: 8, esp: 20 })
    expect(result.remediation.length).toBeGreaterThan(0)
  })

  test('throws error for negative EC', () => {
    expect(() => assessSalinity({ ec: -1 })).toThrow('EC cannot be negative')
  })
})

// ============================================
// 8. DATA INTEGRITY TESTS
// ============================================

describe('Data Integrity', () => {
  test('all heavy metals have complete info', () => {
    const metals: HeavyMetal[] = ['pb', 'cd', 'cr', 'as', 'hg', 'zn', 'cu', 'ni', 'mn', 'co']

    for (const m of metals) {
      const info = HEAVY_METAL_INFO[m]
      expect(info.id).toBe(m)
      expect(info.name).toBeTruthy()
      expect(info.nameThai).toBeTruthy()
      expect(info.symbol).toBeTruthy()
      expect(info.atomicNumber).toBeGreaterThan(0)
      expect(info.healthEffects).toBeTruthy()
    }
  })

  test('all metals have Thai standards', () => {
    const metals: HeavyMetal[] = ['pb', 'cd', 'cr', 'as', 'hg', 'zn', 'cu', 'ni', 'mn', 'co']

    for (const m of metals) {
      const standard = THAI_SOIL_STANDARDS.find(s => s.metal === m)
      expect(standard).toBeDefined()
      expect(standard?.residential).toBeGreaterThan(0)
      expect(standard?.industrial).toBeGreaterThan(0)
    }
  })

  test('industrial limits are higher than residential', () => {
    for (const standard of THAI_SOIL_STANDARDS) {
      expect(standard.industrial).toBeGreaterThanOrEqual(standard.residential)
    }
  })

  test('pH classes cover full range', () => {
    expect(SOIL_PH_CLASSES[0].range.min).toBe(0)
    expect(SOIL_PH_CLASSES[SOIL_PH_CLASSES.length - 1].range.max).toBe(14)
  })
})

// ============================================
// RUN TESTS
// ============================================

async function runTests() {
  console.log('🌱 VerChem Soil Quality Calculator Unit Tests')
  console.log('=============================================\n')

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
    console.log('\n✅ All soil quality tests passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Some tests failed')
    process.exit(1)
  }
}

runTests()
