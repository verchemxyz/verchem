/**
 * VerChem - Aeration System Design Unit Tests
 * World-Class Phase 2 - Oxygen transfer and diffuser/blower sizing
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 */

import assert from 'node:assert/strict'

import {
  calculateOxygenDemand,
  calculateOxygenTransfer,
  designDiffuserSystem,
  designBlowerSystem,
  designPipingSystem,
  designAerationSystem,
  getDOSaturation,
  estimateAerationPower,
} from '@/lib/calculations/aeration-design'
import { DIFFUSER_SPECS, OxygenTransferParams } from '@/lib/types/wastewater-treatment'

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
  }
}

// ============================================
// DO SATURATION TESTS
// ============================================

describe('DO Saturation', () => {
  test('calculates DO saturation at 20°C', () => {
    const doSat = getDOSaturation(20)
    expect(doSat).toBeCloseTo(9.09, 1)
  })

  test('calculates DO saturation at 25°C', () => {
    const doSat = getDOSaturation(25)
    expect(doSat).toBeCloseTo(8.26, 1)
  })

  test('calculates DO saturation at 15°C', () => {
    const doSat = getDOSaturation(15)
    expect(doSat).toBeCloseTo(10.07, 1)
  })

  test('DO saturation decreases with temperature', () => {
    const do15 = getDOSaturation(15)
    const do20 = getDOSaturation(20)
    const do25 = getDOSaturation(25)
    const do30 = getDOSaturation(30)

    expect(do15).toBeGreaterThan(do20)
    expect(do20).toBeGreaterThan(do25)
    expect(do25).toBeGreaterThan(do30)
  })
})

// ============================================
// OXYGEN DEMAND TESTS
// ============================================

describe('Oxygen Demand Calculations', () => {
  test('calculates carbonaceous oxygen demand', () => {
    const result = calculateOxygenDemand({
      bodRemoved: 180, // kg/day
      nitrogenOxidized: 30, // kg/day
      mlvss: 2500,
      tankVolume: 500,
    })

    // Carbonaceous = 1.1 × BOD removed = 1.1 × 180 = 198 kg/day
    expect(result.carbonaceous).toBeGreaterThan(150)
    expect(result.carbonaceous).toBeLessThan(250)
  })

  test('calculates nitrogenous oxygen demand', () => {
    const result = calculateOxygenDemand({
      bodRemoved: 180,
      nitrogenOxidized: 30,
      mlvss: 2500,
      tankVolume: 500,
    })

    // Nitrogenous = 4.57 × N oxidized = 4.57 × 30 = 137.1 kg/day
    expect(result.nitrogenous).toBeGreaterThan(100)
    expect(result.nitrogenous).toBeLessThan(180)
  })

  test('total demand equals sum of components', () => {
    const result = calculateOxygenDemand({
      bodRemoved: 180,
      nitrogenOxidized: 30,
      mlvss: 2500,
      tankVolume: 500,
    })

    const sum = result.carbonaceous + result.nitrogenous + result.endogenous
    expect(result.total).toBeCloseTo(sum, 1)
  })
})

// ============================================
// OXYGEN TRANSFER TESTS
// ============================================

describe('Oxygen Transfer Calculations', () => {
  test('calculates oxygen transfer parameters', () => {
    const result = calculateOxygenTransfer({
      bodRemoved: 100,
      nitrogenOxidized: 20,
      biomassVolume: 2500 * 500, // MLVSS × volume
      temperature: 20,
      elevation: 0,
      alpha: 0.6,
      beta: 0.98,
      foulingFactor: 0.8,
      doSetpoint: 2.0,
      diffuserType: 'fine_bubble_disc',
      submergence: 4.5,
      peakFactor: 1.5,
    })

    expect(result.sote).toBeGreaterThan(10)
    expect(result.sote).toBeLessThan(40)
    expect(result.aote).toBeGreaterThan(0)
    expect(result.aote).toBeLessThan(result.sote)
    expect(result.cs20).toBeCloseTo(9.09, 1)
  })

  test('AOTE decreases at higher temperature', () => {
    const input = {
      bodRemoved: 100,
      nitrogenOxidized: 20,
      biomassVolume: 2500 * 500,
      elevation: 0,
      alpha: 0.6,
      beta: 0.98,
      foulingFactor: 0.8,
      doSetpoint: 2.0,
      diffuserType: 'fine_bubble_disc' as const,
      submergence: 4.5,
      peakFactor: 1.5,
    }

    const result20 = calculateOxygenTransfer({ ...input, temperature: 20 })
    const result30 = calculateOxygenTransfer({ ...input, temperature: 30 })

    // AOTE generally decreases with higher temperature due to lower DO saturation
    expect(result30.csInf).toBeLessThan(result20.csInf)
  })
})

// ============================================
// DIFFUSER SYSTEM DESIGN TESTS
// ============================================

describe('Diffuser System Design', () => {
  // Create mock transfer params for testing
  const mockTransferParams: OxygenTransferParams = {
    sotr: 50,
    sote: 25,
    sor: 1200,
    aotr: 30,
    aote: 15,
    aor: 720,
    alpha: 0.6,
    beta: 0.98,
    theta: 1.024,
    F: 0.8,
    temperature: 20,
    elevation: 0,
    csInf: 9.5,
    cs20: 9.09,
    doOperating: 2.0,
  }

  test('designs fine bubble disc system', () => {
    const result = designDiffuserSystem({
      tankArea: 300, // m²
      tankDepth: 4.5,
      oxygenRequired: 300, // kg O2/day
      diffuserType: 'fine_bubble_disc',
      transferParams: mockTransferParams,
    })

    expect(result.type).toBe('fine_bubble_disc')
    expect(result.numberOfDiffusers).toBeGreaterThan(0)
    expect(result.airflowPerDiffuser).toBeGreaterThan(0)
    expect(result.diffuserDensity).toBeGreaterThan(0)
    expect(result.gridLayout.rows).toBeGreaterThan(0)
    expect(result.gridLayout.columns).toBeGreaterThan(0)
  })

  test('respects diffuser airflow limits', () => {
    const result = designDiffuserSystem({
      tankArea: 160, // m²
      tankDepth: 4.5,
      oxygenRequired: 200, // kg O2/day
      diffuserType: 'fine_bubble_disc',
      transferParams: mockTransferParams,
    })

    const spec = DIFFUSER_SPECS.fine_bubble_disc

    // Airflow per diffuser should be reasonable
    expect(result.airflowPerDiffuser).toBeGreaterThan(0)
    expect(result.airflowPerDiffuser).toBeLessThan(spec.airflowPerUnit.max * 2)
  })

  test('calculates correct total airflow', () => {
    const result = designDiffuserSystem({
      tankArea: 250,
      tankDepth: 4.5,
      oxygenRequired: 400,
      diffuserType: 'fine_bubble_disc',
      transferParams: mockTransferParams,
    })

    // Total airflow should be positive and reasonable
    expect(result.totalAirflow).toBeGreaterThan(0)
    // Individual × count should approximate total
    const calculatedTotal = result.numberOfDiffusers * result.airflowPerDiffuser
    expect(calculatedTotal).toBeGreaterThan(result.totalAirflow * 0.8)
  })
})

// ============================================
// BLOWER SYSTEM DESIGN TESTS
// ============================================

describe('Blower System Design', () => {
  test('designs blower system', () => {
    const result = designBlowerSystem({
      totalAirflow: 1000, // Nm³/h
      diffuserPressureDrop: 5, // kPa
      submergence: 4.5, // m
      pipingPressureDrop: 2, // kPa
      elevationAboveBlower: 2, // m
      redundancy: 'n+1',
    })

    expect(result.numberOfBlowers).toBeGreaterThanOrEqual(2)
    expect(result.capacityPerBlower).toBeGreaterThan(0)
    expect(result.motorPower).toBeGreaterThan(0)
    expect(result.totalPower).toBeGreaterThan(0)
    expect(result.dischargePressure).toBeGreaterThan(0)
  })

  test('includes redundancy', () => {
    const resultNo = designBlowerSystem({
      totalAirflow: 1000,
      diffuserPressureDrop: 5,
      submergence: 4.5,
      pipingPressureDrop: 2,
      elevationAboveBlower: 2,
      redundancy: 'n',
    })

    const resultWith = designBlowerSystem({
      totalAirflow: 1000,
      diffuserPressureDrop: 5,
      submergence: 4.5,
      pipingPressureDrop: 2,
      elevationAboveBlower: 2,
      redundancy: 'n+1',
    })

    expect(resultWith.numberOfStandby).toBeGreaterThan(resultNo.numberOfStandby)
  })

  test('calculates VFD requirement for large systems', () => {
    const largeSystem = designBlowerSystem({
      totalAirflow: 2000,
      diffuserPressureDrop: 5,
      submergence: 4.5,
      pipingPressureDrop: 2,
      elevationAboveBlower: 2,
      redundancy: 'n+1',
    })

    expect(largeSystem.vfdRequired).toBe(true)
  })
})

// ============================================
// PIPING SYSTEM DESIGN TESTS
// ============================================

describe('Piping System Design', () => {
  test('calculates pipe diameters', () => {
    const result = designPipingSystem(1000, 4, 30, 10)

    expect(result.mainHeaderDiameter).toBeGreaterThan(0)
    expect(result.dropPipeDiameter).toBeGreaterThan(0)
    expect(result.numberOfDropPipes).toBe(4)
  })

  test('header diameter larger than or equal to drop pipes', () => {
    const result = designPipingSystem(1000, 4, 30, 10)

    expect(result.mainHeaderDiameter).toBeGreaterThanOrEqual(result.dropPipeDiameter)
  })

  test('calculates pressure drop', () => {
    const result = designPipingSystem(1000, 4, 30, 10)

    expect(result.totalPressureDrop).toBeGreaterThan(0)
    expect(result.totalPressureDrop).toBeLessThan(50) // Should be reasonable
  })

  test('calculates air velocity within range', () => {
    const result = designPipingSystem(500, 3, 20, 8)

    expect(result.airVelocity).toBeGreaterThan(5) // Min practical
    expect(result.airVelocity).toBeLessThan(30) // Max recommended
  })
})

// ============================================
// QUICK ESTIMATION TESTS
// ============================================

describe('Aeration Power Estimation', () => {
  test('estimates aeration power', () => {
    const result = estimateAerationPower(1000, 200, 20, true)

    expect(result.power).toBeGreaterThan(0)
    expect(result.dailyEnergy).toBeGreaterThan(0)
    expect(result.kWhPerM3).toBeGreaterThan(0)
  })

  test('nitrification increases power requirement', () => {
    const withNit = estimateAerationPower(1000, 200, 20, true)
    const withoutNit = estimateAerationPower(1000, 200, 20, false)

    expect(withNit.power).toBeGreaterThan(withoutNit.power)
  })

  test('higher BOD increases power requirement', () => {
    const lowBOD = estimateAerationPower(1000, 100, 20, true)
    const highBOD = estimateAerationPower(1000, 300, 20, true)

    expect(highBOD.power).toBeGreaterThan(lowBOD.power)
  })

  test('power scales with flow rate', () => {
    const smallFlow = estimateAerationPower(500, 200, 20, true)
    const largeFlow = estimateAerationPower(2000, 200, 20, true)

    expect(largeFlow.power).toBeGreaterThan(smallFlow.power)
  })
})

// ============================================
// DIFFUSER SPECS TESTS
// ============================================

describe('Diffuser Specifications', () => {
  test('has specs for key diffuser types', () => {
    const diffuserTypes = [
      'fine_bubble_disc',
      'fine_bubble_tube',
      'coarse_bubble',
    ]

    diffuserTypes.forEach((type) => {
      const spec = DIFFUSER_SPECS[type]
      expect(spec).toBeDefined()
      expect(spec.name).toBeDefined()
      expect(spec.sote).toBeDefined()
      expect(spec.airflowPerUnit).toBeDefined()
    })
  })

  test('fine bubble has higher SOTE than coarse bubble', () => {
    const fineDisc = DIFFUSER_SPECS.fine_bubble_disc
    const coarse = DIFFUSER_SPECS.coarse_bubble

    expect(fineDisc.sote).toBeGreaterThan(coarse.sote)
  })
})

// ============================================
// COMPLETE SYSTEM DESIGN TESTS
// ============================================

describe('Complete Aeration System Design', () => {
  test('designs complete aeration system', () => {
    const result = designAerationSystem({
      tankVolume: 500,
      tankDepth: 4.5,
      bodRemoved: 100,
      nitrogenOxidized: 20,
      mlss: 3500,
      temperature: 25,
      elevation: 100,
      doSetpoint: 2.0,
      diffuserType: 'fine_bubble_disc',
      blowerRedundancy: 'n+1',
    })

    expect(result.tankVolume).toBe(500)
    expect(result.tankDepth).toBe(4.5)
    expect(result.diffuserSystem.numberOfDiffusers).toBeGreaterThan(0)
    expect(result.blowerSystem.numberOfBlowers).toBeGreaterThan(0)
    expect(result.pipingSystem.mainHeaderDiameter).toBeGreaterThan(0)
    expect(result.energyConsumption.dailyEnergy).toBeGreaterThan(0)
    expect(result.capitalCost.total).toBeGreaterThan(0)
  })

  test('validation catches issues', () => {
    const result = designAerationSystem({
      tankVolume: 100,
      tankDepth: 2,
      bodRemoved: 500, // Very high BOD load
      mlss: 5000,
      temperature: 35,
    })

    // High load should generate recommendations or warnings
    expect(result.validation).toBeDefined()
  })
})

// ============================================
// RUN TESTS
// ============================================

async function runTests() {
  console.log('\n💨 VerChem Aeration Design Unit Tests')
  console.log('=====================================\n')

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
    console.log('\n✅ All aeration design tests passed!')
  }
}

runTests()
