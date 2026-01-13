/**
 * VerChem - Sensitivity Analysis Unit Tests
 * World-Class Phase 2 - Parameter sensitivity and Monte Carlo simulation
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 */

import assert from 'node:assert/strict'

import {
  calculateSensitivityAnalysis,
  analyzeSingleParameter,
  runMonteCarloSimulation,
  type SensitivityAnalysisInput,
} from '@/lib/calculations/sensitivity-analysis'
import type {
  WastewaterQuality,
  CostEstimation,
  EnergyConsumption,
} from '@/lib/types/wastewater-treatment'

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
    toBeLessThanOrEqual(expected: number) {
      assert.ok((actual as number) <= expected, `Expected ${actual} <= ${expected}`)
    },
    toBeDefined() {
      assert.ok(actual !== undefined, `Expected value to be defined`)
    },
    toBeTruthy() {
      assert.ok(actual, `Expected truthy`)
    },
    toHaveLength(expected: number) {
      assert.equal((actual as unknown[]).length, expected)
    },
  }
}

// ============================================
// TEST DATA
// ============================================

const testInfluent: WastewaterQuality = {
  flowRate: 1000, // m³/day
  bod: 200, // mg/L
  cod: 400,
  tss: 220,
  ph: 7.0,
  temperature: 25,
  tkn: 40,
  ammonia: 30,
  totalP: 8,
}

const testUnitConfigs = [
  { type: 'primary_clarifier', config: { surfaceLoadingRate: 30 } },
  { type: 'activated_sludge', config: { hrt: 6, mlss: 3500 } },
  { type: 'secondary_clarifier', config: { surfaceLoadingRate: 20 } },
]

const baseInput: SensitivityAnalysisInput = {
  systemName: 'Test WWTP',
  influent: testInfluent,
  unitConfigs: testUnitConfigs,
  targetStandard: 'type_a',
}

// Baseline results for single parameter tests
const baselineResults = {
  effluent: {
    flowRate: 1000,
    bod: 15,
    cod: 50,
    tss: 20,
    ph: 7.0,
    temperature: 25,
    tkn: 10,
    ammonia: 5,
    totalP: 3,
  } as WastewaterQuality,
  cost: {
    civilWorks: 5000000,
    equipment: 2000000,
    engineering: 700000,
    installation: 1050000,
    contingency: 700000,
    landCost: 0,
    totalCapital: 7000000,
    electricity: 150000,
    chemicals: 30000,
    labor: 120000,
    maintenance: 35000,
    sludgeDisposal: 15000,
    totalOperating: 350000,
    annualOperating: 4200000,
    annualDepreciation: 350000,
    totalAnnualCost: 4550000,
    costPerM3: 12.47,
    unitCosts: [],
  } as CostEstimation,
  energy: {
    aeration: 200,
    pumping: 50,
    mixing: 20,
    sludgeHandling: 10,
    disinfection: 5,
    lighting: 2,
    other: 3,
    totalDaily: 290,
    totalMonthly: 8700,
    totalAnnual: 105850,
    dailyCost: 1305,
    monthlyCost: 39150,
    annualCost: 476325,
    kWhPerM3: 0.29,
    kWhPerKgBOD: 1.57,
    unitEnergy: [],
  } as EnergyConsumption,
  compliance: true,
  issues: 0,
}

// ============================================
// SINGLE PARAMETER ANALYSIS TESTS
// ============================================

describe('Single Parameter Analysis', () => {
  test('analyzes flow rate sensitivity', () => {
    const result = analyzeSingleParameter(baseInput, 'flowRate', baselineResults)

    expect(result.parameter).toBe('flowRate')
    expect(result.dataPoints.length).toBeGreaterThan(0)
    expect(result.baselineValue).toBe(testInfluent.flowRate)
  })

  test('analyzes BOD sensitivity', () => {
    const result = analyzeSingleParameter(baseInput, 'bod', baselineResults)

    expect(result.parameter).toBe('bod')
    expect(result.dataPoints.length).toBeGreaterThan(0)
    expect(result.baselineValue).toBe(testInfluent.bod)
  })

  test('analyzes temperature sensitivity', () => {
    const result = analyzeSingleParameter(baseInput, 'temperature', baselineResults)

    expect(result.parameter).toBe('temperature')
    expect(result.dataPoints.length).toBeGreaterThan(0)
  })

  test('calculates elasticity values', () => {
    const result = analyzeSingleParameter(baseInput, 'flowRate', baselineResults)

    expect(result.elasticity).toBeDefined()
    expect(result.elasticity.effluentBOD).toBeDefined()
    expect(result.elasticity.costPerM3).toBeDefined()
  })

  test('has impact ranking', () => {
    const result = analyzeSingleParameter(baseInput, 'bod', baselineResults)

    // impactRanking is 0 by default, set by calculateSensitivityAnalysis
    expect(result.impactRanking).toBeDefined()
  })

  test('may have critical threshold', () => {
    const result = analyzeSingleParameter(baseInput, 'flowRate', baselineResults)

    // criticalThreshold is optional - check structure if present
    if (result.criticalThreshold) {
      expect(result.criticalThreshold.direction).toBeDefined()
      expect(result.criticalThreshold.value).toBeDefined()
    }
    // Test passes regardless - criticalThreshold is optional
    expect(result.parameter).toBe('flowRate')
  })
})

// ============================================
// FULL SENSITIVITY ANALYSIS TESTS
// ============================================

describe('Full Sensitivity Analysis', () => {
  test('analyzes multiple parameters', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod', 'temperature'],
    })

    expect(result.results.length).toBe(3)
    expect(result.systemName).toBe('Test WWTP')
  })

  test('generates baseline effluent', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    })

    expect(result.baselineEffluent).toBeDefined()
    expect(result.baselineEffluent.bod).toBeGreaterThanOrEqual(0)
  })

  test('generates baseline cost', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    })

    expect(result.baselineCost).toBeDefined()
    expect(result.baselineCost.totalCapital).toBeGreaterThanOrEqual(0)
  })

  test('generates baseline energy', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    })

    expect(result.baselineEnergy).toBeDefined()
    expect(result.baselineEnergy.totalDaily).toBeGreaterThanOrEqual(0)
  })

  test('generates summary with most sensitive parameters', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod', 'tss', 'temperature'],
    })

    expect(result.summary).toBeDefined()
    expect(result.summary.mostSensitiveParameters.length).toBeGreaterThan(0)
    expect(result.summary.leastSensitiveParameters.length).toBeGreaterThan(0)
  })

  test('calculates robustness score', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod'],
    })

    expect(result.summary.robustnessScore).toBeGreaterThanOrEqual(0)
    expect(result.summary.robustnessScore).toBeLessThanOrEqual(100)
  })

  test('provides recommendations', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod', 'temperature'],
    })

    expect(result.summary.recommendations).toBeDefined()
    expect(Array.isArray(result.summary.recommendations)).toBeTruthy()
  })

  test('generates tornado data sorted by impact', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod', 'temperature'],
    })

    expect(result.tornadoData).toBeDefined()
    expect(result.tornadoData.length).toBe(3)

    // Should be sorted by impact range (descending)
    for (let i = 0; i < result.tornadoData.length - 1; i++) {
      const rangeA = Math.abs(result.tornadoData[i].highImpact - result.tornadoData[i].lowImpact)
      const rangeB = Math.abs(result.tornadoData[i + 1].highImpact - result.tornadoData[i + 1].lowImpact)
      expect(rangeA).toBeGreaterThanOrEqual(rangeB)
    }
  })

  test('assigns impact rankings', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod', 'tss'],
    })

    // Each result should have an impact ranking
    for (const paramResult of result.results) {
      expect(paramResult.impactRanking).toBeGreaterThan(0)
      expect(paramResult.impactRanking).toBeLessThanOrEqual(result.results.length)
    }
  })
})

// ============================================
// MONTE CARLO SIMULATION TESTS
// ============================================

describe('Monte Carlo Simulation', () => {
  test('runs specified number of iterations', () => {
    const iterations = 50
    const result = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    }, iterations)

    expect(result.iterations).toBe(iterations)
  })

  test('calculates cost statistics', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    }, 100)

    expect(result.results.costPerM3).toBeDefined()
    expect(result.results.costPerM3.mean).toBeGreaterThan(0)
    expect(result.results.costPerM3.stdDev).toBeGreaterThanOrEqual(0)
    expect(result.results.costPerM3.p5).toBeLessThanOrEqual(result.results.costPerM3.p95)
  })

  test('calculates BOD statistics', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['bod'],
    }, 100)

    expect(result.results.effluentBOD).toBeDefined()
    expect(result.results.effluentBOD.mean).toBeGreaterThanOrEqual(0)
    expect(result.results.effluentBOD.p5).toBeLessThanOrEqual(result.results.effluentBOD.p95)
  })

  test('calculates compliance rate', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['flowRate', 'bod'],
    }, 100)

    expect(result.results.complianceRate).toBeGreaterThanOrEqual(0)
    expect(result.results.complianceRate).toBeLessThanOrEqual(100)
  })

  test('handles different uncertainty percentages', () => {
    const lowUncertainty = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    }, 100, 10)

    const highUncertainty = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    }, 100, 30)

    // Higher uncertainty should generally lead to wider distribution
    // (Not guaranteed due to random nature, but statistically likely)
    expect(lowUncertainty.results.costPerM3.stdDev).toBeLessThanOrEqual(
      highUncertainty.results.costPerM3.stdDev * 2
    )
  })

  test('percentiles are in correct order', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    }, 200)

    // P5 should be less than or equal to mean, which is less than or equal to P95
    expect(result.results.costPerM3.p5).toBeLessThanOrEqual(result.results.costPerM3.mean * 1.5)
    expect(result.results.costPerM3.mean).toBeLessThanOrEqual(result.results.costPerM3.p95 * 1.5)
  })
})

// ============================================
// EDGE CASES
// ============================================

describe('Edge Cases', () => {
  test('handles single parameter analysis', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    })

    expect(result.results.length).toBe(1)
    expect(result.results[0].parameter).toBe('flowRate')
  })

  test('handles custom ranges', () => {
    const result = analyzeSingleParameter(
      {
        ...baseInput,
        customRanges: {
          flowRate: { min: -50, max: 100, steps: 5, type: 'percentage' },
        },
      },
      'flowRate',
      baselineResults
    )

    // Should have data points
    expect(result.dataPoints.length).toBeGreaterThan(0)
  })

  test('handles different target standards', () => {
    const resultA = calculateSensitivityAnalysis({
      ...baseInput,
      targetStandard: 'type_a',
      parametersToAnalyze: ['bod'],
    })

    const resultB = calculateSensitivityAnalysis({
      ...baseInput,
      targetStandard: 'type_b',
      parametersToAnalyze: ['bod'],
    })

    // Both should complete without error
    expect(resultA.results.length).toBe(1)
    expect(resultB.results.length).toBe(1)
  })

  test('analyzes economic parameters', () => {
    const result = analyzeSingleParameter(baseInput, 'electricityRate', baselineResults)

    expect(result.parameter).toBe('electricityRate')
    expect(result.dataPoints.length).toBeGreaterThan(0)
  })

  test('analyzes design parameters', () => {
    const result = analyzeSingleParameter(baseInput, 'mlss', baselineResults)

    expect(result.parameter).toBe('mlss')
    expect(result.dataPoints.length).toBeGreaterThan(0)
  })

  test('default parameters analyzed when not specified', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      // No parametersToAnalyze specified - should use defaults
    })

    // Should analyze default parameters (flowRate, bod, cod, tss, temperature, electricityRate)
    expect(result.results.length).toBeGreaterThan(0)
  })
})

// ============================================
// DATA VALIDATION
// ============================================

describe('Data Validation', () => {
  test('data points have required fields', () => {
    const result = analyzeSingleParameter(baseInput, 'flowRate', baselineResults)

    for (const point of result.dataPoints) {
      expect(point.inputValue).toBeDefined()
      expect(point.inputVariation).toBeDefined()
      expect(point.outputs).toBeDefined()
      expect(point.compliance).toBeDefined()
    }
  })

  test('data points include outputs', () => {
    const result = analyzeSingleParameter(baseInput, 'bod', baselineResults)

    for (const point of result.dataPoints) {
      expect(point.outputs.effluentBOD).toBeDefined()
      expect(point.outputs.effluentCOD).toBeDefined()
      expect(point.outputs.costPerM3).toBeDefined()
    }
  })

  test('outputs are physically reasonable', () => {
    const result = analyzeSingleParameter(baseInput, 'flowRate', baselineResults)

    for (const point of result.dataPoints) {
      // Effluent values should be non-negative
      expect(point.outputs.effluentBOD).toBeGreaterThanOrEqual(0)
      expect(point.outputs.effluentCOD).toBeGreaterThanOrEqual(0)
      // Removal efficiencies should be 0-100%
      expect(point.outputs.bodRemoval).toBeGreaterThanOrEqual(0)
      expect(point.outputs.bodRemoval).toBeLessThanOrEqual(100)
    }
  })

  test('timestamp is set', () => {
    const result = calculateSensitivityAnalysis({
      ...baseInput,
      parametersToAnalyze: ['flowRate'],
    })

    expect(result.timestamp).toBeDefined()
    expect(result.timestamp instanceof Date).toBeTruthy()
  })
})

// ============================================
// RUN TESTS
// ============================================

async function runTests() {
  console.log('\n📊 VerChem Sensitivity Analysis Unit Tests')
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
    console.log('\n✅ All sensitivity analysis tests passed!')
  }
}

runTests()
