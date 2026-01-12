/**
 * VerChem - Wastewater Treatment Calculations Unit Tests
 * Lightweight test harness (no Jest required)
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 */

import assert from 'node:assert/strict'

import {
  calculateBarScreen,
  calculateGritChamber,
  calculatePrimaryClarifier,
  calculateAerationTank,
  calculateSecondaryClarifier,
  calculateChlorination,
  calculateUASB,
  calculateSBR,
  calculateOxidationPond,
  calculateTricklingFilter,
  calculateMBR,
  calculateDAF,
  calculateFiltration,
  calculateUVDisinfection,
  calculateTreatmentTrain,
  getDefaultDesignParams,
} from '@/lib/calculations/wastewater-treatment'
import type { WastewaterQuality, UnitType } from '@/lib/types/wastewater-treatment'

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
    toBeDefined() {
      assert.ok(actual !== undefined, `Expected value to be defined`)
    },
    toHaveLength(expected: number) {
      assert.equal((actual as unknown[]).length, expected)
    },
  }
}

// Standard test influent
const testInfluent: WastewaterQuality = {
  flowRate: 1000, // m³/day
  bod: 200,       // mg/L
  cod: 400,       // mg/L
  tss: 220,       // mg/L
  ph: 7.0,
  temperature: 25,
}

// ============================================
// BAR SCREEN TESTS
// ============================================

describe('Bar Screen Calculations', () => {
  test('calculates bar screen with valid parameters', () => {
    const result = calculateBarScreen({
      inputQuality: testInfluent,
      barSpacing: 25,
      channelWidth: 0.5,
      channelDepth: 1.0,
      screenAngle: 75,
      barWidth: 10,
      cleaningType: 'mechanical',
    })

    expect(result.type).toBe('bar_screen')
    expect(result.category).toBe('preliminary')
    expect(result.design.barSpacing).toBe(25)
    expect(result.design.approachVelocity).toBeGreaterThan(0)
    expect(result.design.throughVelocity).toBeGreaterThan(result.design.approachVelocity)
    expect(result.design.headloss).toBeGreaterThan(0)
    expect(result.removalEfficiency.tss).toBeGreaterThan(0)
  })

  test('flags high approach velocity', () => {
    const result = calculateBarScreen({
      inputQuality: testInfluent,
      barSpacing: 25,
      channelWidth: 0.05,  // Very narrow = very high velocity
      channelDepth: 0.05,
      screenAngle: 75,
      barWidth: 10,
      cleaningType: 'mechanical',
    })

    expect(result.status).toBe('fail')
    const hasVelocityIssue = result.issues.some(i => i.parameter === 'Approach Velocity')
    assert.ok(hasVelocityIssue, 'Should flag high approach velocity')
  })

  test('reduces output BOD and TSS', () => {
    const result = calculateBarScreen({
      inputQuality: testInfluent,
      barSpacing: 25,
      channelWidth: 0.5,
      channelDepth: 1.0,
      screenAngle: 75,
      barWidth: 10,
      cleaningType: 'mechanical',
    })

    expect(result.outputQuality.bod).toBeLessThan(testInfluent.bod)
    expect(result.outputQuality.tss).toBeLessThan(testInfluent.tss)
  })
})

// ============================================
// GRIT CHAMBER TESTS
// ============================================

describe('Grit Chamber Calculations', () => {
  test('calculates horizontal flow grit chamber', () => {
    const result = calculateGritChamber({
      inputQuality: testInfluent,
      chamberType: 'horizontal_flow',
      length: 10,
      width: 1,
      depth: 1,
    })

    expect(result.type).toBe('grit_chamber')
    expect(result.design.volume).toBe(10)
    expect(result.design.hrt).toBeGreaterThan(0)
    expect(result.design.horizontalVelocity).toBeGreaterThan(0)
  })

  test('flags short HRT', () => {
    const result = calculateGritChamber({
      inputQuality: testInfluent,
      chamberType: 'horizontal_flow',
      length: 1,
      width: 0.5,
      depth: 0.5,
    })

    const hasHRTIssue = result.issues.some(i => i.parameter === 'HRT')
    assert.ok(hasHRTIssue, 'Should flag short HRT')
  })
})

// ============================================
// PRIMARY CLARIFIER TESTS
// ============================================

describe('Primary Clarifier Calculations', () => {
  test('calculates circular clarifier', () => {
    const result = calculatePrimaryClarifier({
      inputQuality: testInfluent,
      shape: 'circular',
      diameter: 10,
      sidewaterDepth: 3.5,
    })

    expect(result.type).toBe('primary_clarifier')
    expect(result.design.surfaceArea).toBeCloseTo(Math.PI * 25, 1)
    expect(result.design.surfaceOverflowRate).toBeGreaterThan(0)
    expect(result.design.hrt).toBeGreaterThan(0)
    expect(result.removalEfficiency.bod).toBeGreaterThanOrEqual(25)
    expect(result.removalEfficiency.tss).toBeGreaterThanOrEqual(50)
  })

  test('calculates rectangular clarifier', () => {
    const result = calculatePrimaryClarifier({
      inputQuality: testInfluent,
      shape: 'rectangular',
      length: 15,
      width: 5,
      sidewaterDepth: 3.5,
    })

    expect(result.design.surfaceArea).toBe(75)
    expect(result.design.volume).toBe(75 * 3.5)
  })

  test('flags high overflow rate', () => {
    const result = calculatePrimaryClarifier({
      inputQuality: testInfluent,
      shape: 'circular',
      diameter: 3,
      sidewaterDepth: 3.5,
    })

    const hasOverflowIssue = result.issues.some(i => i.parameter === 'Overflow Rate')
    assert.ok(hasOverflowIssue, 'Should flag high overflow rate')
  })
})

// ============================================
// AERATION TANK TESTS
// ============================================

describe('Aeration Tank Calculations', () => {
  test('calculates conventional activated sludge', () => {
    const result = calculateAerationTank({
      inputQuality: testInfluent,
      processType: 'conventional',
      volume: 500,
      mlss: 3000,
      srt: 10,
      targetDO: 2.0,
      aerationType: 'fine_bubble',
      returnRatio: 0.5,
    })

    expect(result.type).toBe('aeration_tank')
    expect(result.design.hrt).toBeGreaterThan(0)
    expect(result.design.fmRatio).toBeGreaterThan(0)
    expect(result.design.oxygenRequired).toBeGreaterThan(0)
    expect(result.design.aeratorPower).toBeGreaterThan(0)
    expect(result.removalEfficiency.bod).toBeGreaterThanOrEqual(80)
  })

  test('calculates F/M ratio correctly', () => {
    const result = calculateAerationTank({
      inputQuality: testInfluent,
      processType: 'conventional',
      volume: 500,
      mlss: 3000,
      srt: 10,
      targetDO: 2.0,
      aerationType: 'fine_bubble',
      returnRatio: 0.5,
    })

    // F/M = (BOD * Q / 1000) / (MLVSS * V / 1000)
    // MLVSS = 3000 * 0.75 = 2250
    // F/M = (200 * 1000 / 1000) / (2250 * 500 / 1000)
    // F/M = 200 / 1125 = 0.178
    expect(result.design.fmRatio).toBeCloseTo(0.178, 2)
  })

  test('flags high F/M ratio', () => {
    const result = calculateAerationTank({
      inputQuality: testInfluent,
      processType: 'conventional',
      volume: 100,
      mlss: 2000,
      srt: 5,
      targetDO: 2.0,
      aerationType: 'fine_bubble',
      returnRatio: 0.5,
    })

    const hasFMIssue = result.issues.some(i => i.parameter === 'F/M Ratio')
    assert.ok(hasFMIssue, 'Should flag high F/M ratio')
  })
})

// ============================================
// SECONDARY CLARIFIER TESTS
// ============================================

describe('Secondary Clarifier Calculations', () => {
  test('calculates secondary clarifier', () => {
    const result = calculateSecondaryClarifier({
      inputQuality: testInfluent,
      shape: 'circular',
      diameter: 12,
      sidewaterDepth: 4.0,
      mlss: 3000,
      returnRatio: 0.5,
    })

    expect(result.type).toBe('secondary_clarifier')
    expect(result.design.surfaceOverflowRate).toBeGreaterThan(0)
    expect(result.design.solidsLoadingRate).toBeGreaterThan(0)
    expect(result.design.rasConcentration).toBeGreaterThan(3000)
  })
})

// ============================================
// CHLORINATION TESTS
// ============================================

describe('Chlorination Calculations', () => {
  test('calculates chlorination', () => {
    // Use post-treatment quality (low BOD/TSS after secondary treatment)
    const postTreatmentQuality: WastewaterQuality = {
      flowRate: 1000,
      bod: 20,    // After secondary treatment
      cod: 50,
      tss: 20,
      ph: 7.0,
      temperature: 25,
    }

    const result = calculateChlorination({
      inputQuality: postTreatmentQuality,
      chlorineType: 'hypochlorite',
      contactTime: 30,
      chlorineDose: 10,
      tankLength: 10,
      tankWidth: 3,
      tankDepth: 2,
      baffleEfficiency: 0.5,
    })

    expect(result.type).toBe('chlorination')
    expect(result.design.ctValue).toBeGreaterThan(0)
    expect(result.design.chlorineResidual).toBeGreaterThan(0)
    expect(result.design.logRemoval.coliform).toBeGreaterThan(0)
  })
})

// ============================================
// OTHER UNIT TESTS
// ============================================

describe('UASB Calculations', () => {
  test('calculates UASB reactor', () => {
    const result = calculateUASB({
      inputQuality: { ...testInfluent, cod: 1000 },
      volume: 500,
      height: 6,
      operatingTemp: 35,
    })

    expect(result.type).toBe('uasb')
    expect(result.design.upflowVelocity).toBeGreaterThan(0)
    expect(result.design.biogasProduction).toBeGreaterThan(0)
    expect(result.removalEfficiency.cod).toBeGreaterThan(60)
  })
})

describe('SBR Calculations', () => {
  test('calculates SBR system', () => {
    const result = calculateSBR({
      inputQuality: testInfluent,
      volumePerReactor: 300,
      numberOfReactors: 2,
      cycleTime: 6,
      mlss: 3500,
    })

    expect(result.type).toBe('sbr')
    expect(result.design.cyclesPerDay).toBe(4)
    expect(result.removalEfficiency.bod).toBeGreaterThan(85)
  })
})

describe('Oxidation Pond Calculations', () => {
  test('calculates facultative pond', () => {
    const result = calculateOxidationPond({
      inputQuality: testInfluent,
      pondType: 'facultative',
      surfaceArea: 10000,
      depth: 1.5,
    })

    expect(result.type).toBe('oxidation_pond')
    expect(result.design.hrt).toBeGreaterThan(0)
    expect(result.design.landArea).toBeGreaterThan(0)
  })
})

describe('Trickling Filter Calculations', () => {
  test('calculates trickling filter', () => {
    const result = calculateTricklingFilter({
      inputQuality: testInfluent,
      filterType: 'high_rate',
      diameter: 8,
      depth: 4,
      mediaType: 'plastic',
      recirculationRatio: 1.0,
    })

    expect(result.type).toBe('trickling_filter')
    expect(result.design.hydraulicLoading).toBeGreaterThan(0)
    expect(result.removalEfficiency.bod).toBeGreaterThan(40)
  })
})

describe('MBR Calculations', () => {
  test('calculates MBR unit', () => {
    const result = calculateMBR({
      inputQuality: testInfluent,
      membraneType: 'hollow_fiber',
      configuration: 'submerged',
      tankVolume: 250,
      membraneArea: 1200,
      mlss: 10000,
      srt: 25,
      flux: 20,
    })

    expect(result.type).toBe('mbr')
    expect(result.design.numberOfModules).toBeGreaterThan(0)
    expect(result.removalEfficiency.tss).toBeGreaterThan(95)
  })
})

describe('DAF Calculations', () => {
  test('calculates DAF unit', () => {
    const result = calculateDAF({
      inputQuality: testInfluent,
      length: 6,
      width: 3,
      depth: 2,
      recycleRatio: 10,
    })

    expect(result.type).toBe('daf')
    expect(result.removalEfficiency.tss).toBeGreaterThan(70)
  })
})

describe('Filtration Calculations', () => {
  test('calculates rapid sand filter', () => {
    const result = calculateFiltration({
      inputQuality: testInfluent,
      filterType: 'rapid_sand',
      totalArea: 50,
      mediaDepth: 0.8,
    })

    expect(result.type).toBe('filtration')
    expect(result.design.filtrationRate).toBeGreaterThan(0)
  })
})

describe('UV Disinfection Calculations', () => {
  test('calculates UV disinfection', () => {
    const result = calculateUVDisinfection({
      inputQuality: testInfluent,
      uvDose: 50,
      uvTransmittance: 65,
      channelLength: 3,
      channelWidth: 1,
      channelDepth: 0.5,
    })

    expect(result.type).toBe('uv_disinfection')
    expect(result.design.totalLamps).toBeGreaterThan(0)
    expect(result.design.logRemoval.coliform).toBeGreaterThan(0)
  })
})

// ============================================
// TREATMENT TRAIN TESTS
// ============================================

describe('Treatment Train Calculations', () => {
  test('calculates complete treatment train', () => {
    const unitConfigs = [
      { type: 'bar_screen' as UnitType, config: getDefaultDesignParams('bar_screen', 1000) },
      { type: 'grit_chamber' as UnitType, config: getDefaultDesignParams('grit_chamber', 1000) },
      { type: 'primary_clarifier' as UnitType, config: getDefaultDesignParams('primary_clarifier', 1000) },
      { type: 'aeration_tank' as UnitType, config: getDefaultDesignParams('aeration_tank', 1000) },
      { type: 'secondary_clarifier' as UnitType, config: getDefaultDesignParams('secondary_clarifier', 1000) },
      { type: 'chlorination' as UnitType, config: getDefaultDesignParams('chlorination', 1000) },
    ]

    const result = calculateTreatmentTrain(testInfluent, unitConfigs, 'type_c')

    expect(result.units).toHaveLength(6)
    expect(result.summary.totalBODRemoval).toBeGreaterThan(90)
    expect(result.summary.totalTSSRemoval).toBeGreaterThan(90)
    expect(result.effluentQuality.bod).toBeLessThan(testInfluent.bod * 0.1)
  })

  test('checks Thai PCD compliance', () => {
    const unitConfigs = [
      { type: 'bar_screen' as UnitType, config: getDefaultDesignParams('bar_screen', 1000) },
      { type: 'aeration_tank' as UnitType, config: getDefaultDesignParams('aeration_tank', 1000) },
      { type: 'secondary_clarifier' as UnitType, config: getDefaultDesignParams('secondary_clarifier', 1000) },
      { type: 'chlorination' as UnitType, config: getDefaultDesignParams('chlorination', 1000) },
    ]

    const result = calculateTreatmentTrain(testInfluent, unitConfigs, 'type_c')

    expect(result.compliance).toBeDefined()
    expect(result.compliance.parameters).toHaveLength(5)
    expect(result.effluentQuality.bod).toBeLessThan(40)
  })

  test('maintains mass balance through train', () => {
    const unitConfigs = [
      { type: 'primary_clarifier' as UnitType, config: getDefaultDesignParams('primary_clarifier', 1000) },
      { type: 'aeration_tank' as UnitType, config: getDefaultDesignParams('aeration_tank', 1000) },
      { type: 'secondary_clarifier' as UnitType, config: getDefaultDesignParams('secondary_clarifier', 1000) },
    ]

    const result = calculateTreatmentTrain(testInfluent, unitConfigs, 'type_c')

    // Each unit output should equal next unit input
    for (let i = 0; i < result.units.length - 1; i++) {
      expect(result.units[i].outputQuality.bod).toBeCloseTo(result.units[i + 1].inputQuality.bod, 5)
    }
  })
})

// ============================================
// DEFAULT PARAMS TESTS
// ============================================

describe('Default Design Parameters', () => {
  test('generates default params for all unit types', () => {
    const unitTypes: UnitType[] = [
      'bar_screen', 'grit_chamber', 'primary_clarifier', 'aeration_tank',
      'secondary_clarifier', 'chlorination', 'oil_separator', 'uasb',
      'sbr', 'oxidation_pond', 'trickling_filter', 'mbr', 'daf', 'filtration', 'uv_disinfection',
    ]

    unitTypes.forEach(type => {
      const params = getDefaultDesignParams(type, 1000)
      expect(params).toBeDefined()
      assert.ok(Object.keys(params).length > 0, `${type} should have params`)
    })
  })

  test('scales params with flow rate', () => {
    const params1000 = getDefaultDesignParams('aeration_tank', 1000) as { volume: number }
    const params2000 = getDefaultDesignParams('aeration_tank', 2000) as { volume: number }

    expect(params2000.volume).toBeGreaterThan(params1000.volume)
  })
})

// ============================================
// RUN TESTS
// ============================================

async function runTests() {
  console.log('\n🏭 VerChem Wastewater Treatment Unit Tests')
  console.log('==========================================\n')

  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (err) {
      console.log(`❌ ${name}`)
      console.log(`   ${(err as Error).message}`)
      failed++
    }
  }

  console.log('\n📊 Test Summary')
  console.log('--------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failed}`)

  if (failed > 0) {
    console.log('\n❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('\n✅ All wastewater treatment tests passed!')
  }
}

runTests()
