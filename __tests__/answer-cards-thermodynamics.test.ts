/**
 * VerChem Answer Card Tools — Thermodynamics Family Tests (W3 Day 2 Wave B)
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  calculateDeltaG,
  calculateEquilibriumConstant,
  analyzeReaction,
} from '@/lib/calculations/thermodynamics'

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
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected)
    },
    toBeCloseTo(expected: number, precision = 2) {
      assert.equal(typeof actual, 'number')
      const diff = Math.abs((actual as number) - expected)
      assert.ok(diff < Math.pow(10, -precision), `Expected ${actual} to be close to ${expected}`)
    },
  }
}

describe('calculate_delta_g', () => {
  test('matches engine for delta G = delta H - T delta S', () => {
    const tool = TOOL_BY_NAME.get('calculate_delta_g')!
    const result = tool.execute({ deltaH: -92.2, deltaS: -198.75, temperature_K: 298.15 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateDeltaG(-92.2, -198.75, 298.15)
    expect(result.value.deltaG).toBeCloseTo(engineResult.deltaG, 10)
    expect(result.value.spontaneous).toBe(engineResult.spontaneous)
  })

  test('defaults temperature only when absent', () => {
    const tool = TOOL_BY_NAME.get('calculate_delta_g')!
    expect(tool.execute({ deltaH: -10, deltaS: 20 }).ok).toBe(true)
    expect(tool.execute({ deltaH: -10, deltaS: 20, temperature_K: '1e-324' }).ok).toBe(false)
  })

  test('rejects non-positive temperature', () => {
    const tool = TOOL_BY_NAME.get('calculate_delta_g')!
    expect(tool.execute({ deltaH: -10, deltaS: 20, temperature_K: 0 }).ok).toBe(false)
  })
})

describe('calculate_equilibrium_constant', () => {
  test('matches engine for K from delta G', () => {
    const tool = TOOL_BY_NAME.get('calculate_equilibrium_constant')!
    const result = tool.execute({ deltaG: -5.708, temperature_K: 298.15 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateEquilibriumConstant(-5.708, 298.15)
    expect(result.value.K).toBeCloseTo(engineResult.K, 10)
  })

  test('rejects overflow through finalizeResult', () => {
    const tool = TOOL_BY_NAME.get('calculate_equilibrium_constant')!
    expect(tool.execute({ deltaG: -1e308, temperature_K: 298.15 }).ok).toBe(false)
  })
})

describe('analyze_reaction_thermodynamics', () => {
  test('combustion to liquid water matches engine with explicit states', () => {
    const tool = TOOL_BY_NAME.get('analyze_reaction_thermodynamics')!
    const reactants = [
      { formula: 'H2(g)', coefficient: 2 },
      { formula: 'O2(g)', coefficient: 1 },
    ]
    const products = [{ formula: 'H2O(l)', coefficient: 2 }]
    const result = tool.execute({ reactants, products, temperature_K: 298.15 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = analyzeReaction(products, reactants, 298.15)!
    expect(result.value.deltaH).toBeCloseTo(engineResult.deltaH, 10)
    expect(result.value.deltaS).toBeCloseTo(engineResult.deltaS, 10)
    expect(result.value.deltaG).toBeCloseTo(engineResult.deltaG, 10)
    expect(result.value.K).toBeCloseTo(engineResult.K as number, 5)
  })

  test('rejects ambiguous formula without explicit state', () => {
    const tool = TOOL_BY_NAME.get('analyze_reaction_thermodynamics')!
    const result = tool.execute({
      reactants: [{ formula: 'H2', coefficient: 2 }, { formula: 'O2(g)', coefficient: 1 }],
      products: [{ formula: 'H2O(l)', coefficient: 2 }],
    })
    expect(result.ok).toBe(false)
  })

  test('rejects formula-state pair missing from data', () => {
    const tool = TOOL_BY_NAME.get('analyze_reaction_thermodynamics')!
    const result = tool.execute({
      reactants: [{ formula: 'NaCl(aq)', coefficient: 1 }],
      products: [{ formula: 'NaCl(s)', coefficient: 1 }],
    })
    expect(result.ok).toBe(false)
  })
})

async function runTests() {
  console.log('VerChem Answer Card Thermodynamics Tests (W3 Day 2 Wave B)')
  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log(`PASS ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.log(`FAIL ${testCase.name}`)
      console.error(error)
    }
  }

  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failures.length}`)

  if (failures.length > 0) {
    failures.forEach((name) => console.log(`- ${name}`))
    process.exitCode = 1
  }
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
