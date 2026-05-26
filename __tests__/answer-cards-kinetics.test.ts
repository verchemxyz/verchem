/**
 * VerChem Answer Card Tools — Kinetics Family Tests (W3 Day 2 Wave B)
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  arrheniusEquation,
  calculateActivationEnergy,
  calculateRateConstant,
  calculateConcentration,
} from '@/lib/calculations/kinetics'

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
    toBeCloseTo(expected: number, precision = 2) {
      assert.equal(typeof actual, 'number')
      const diff = Math.abs((actual as number) - expected)
      assert.ok(diff < Math.pow(10, -precision), `Expected ${actual} to be close to ${expected}`)
    },
  }
}

describe('arrhenius_rate_constant', () => {
  test('matches Arrhenius engine', () => {
    const tool = TOOL_BY_NAME.get('arrhenius_rate_constant')!
    const result = tool.execute({ A: 1e13, Ea: 50_000, temperature_K: 300 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = arrheniusEquation(1e13, 50_000, 300)
    expect(result.value.k).toBeCloseTo(engineResult.k, 10)
    expect(result.value.A).toBe(1e13)
  })

  test('rejects non-positive A and temperature', () => {
    const tool = TOOL_BY_NAME.get('arrhenius_rate_constant')!
    expect(tool.execute({ A: 0, Ea: 50_000, temperature_K: 300 }).ok).toBe(false)
    expect(tool.execute({ A: 1e13, Ea: 50_000, temperature_K: 0 }).ok).toBe(false)
  })

  test('rejects overflow through finalizeResult', () => {
    const tool = TOOL_BY_NAME.get('arrhenius_rate_constant')!
    expect(tool.execute({ A: 1e308, Ea: -1_000_000, temperature_K: 1 }).ok).toBe(false)
  })
})

describe('calculate_activation_energy', () => {
  test('matches activation energy engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_activation_energy')!
    const result = tool.execute({ k1: 1e-3, k2: 2e-3, T1: 300, T2: 310 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateActivationEnergy(1e-3, 300, 2e-3, 310)!
    expect(result.value.Ea).toBeCloseTo(engineResult.Ea, 10)
    expect(result.value.EaKJ).toBeCloseTo(engineResult.EaKJ, 10)
    expect(result.value.A).toBeCloseTo(engineResult.A, 10)
  })

  test('rejects equal temperatures', () => {
    const tool = TOOL_BY_NAME.get('calculate_activation_energy')!
    expect(tool.execute({ k1: 1e-3, k2: 2e-3, T1: 300, T2: 300 }).ok).toBe(false)
  })
})

describe('calculate_rate_constant', () => {
  test('first-order rate constant equals ln(2)/time for half remaining', () => {
    const tool = TOOL_BY_NAME.get('calculate_rate_constant')!
    const result = tool.execute({ order: 'first', initial_concentration: 1, final_concentration: 0.5, time: 10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateRateConstant('first', 1, 0.5, 10)!
    expect(result.value.k).toBeCloseTo(engineResult.k, 10)
    expect(result.value.k).toBeCloseTo(Math.LN2 / 10, 10)
  })

  test('rejects zero final concentration for first order', () => {
    const tool = TOOL_BY_NAME.get('calculate_rate_constant')!
    expect(tool.execute({ order: 'first', initial_concentration: 1, final_concentration: 0, time: 10 }).ok).toBe(false)
  })

  test('rejects unsupported order', () => {
    const tool = TOOL_BY_NAME.get('calculate_rate_constant')!
    expect(tool.execute({ order: 'third', initial_concentration: 1, final_concentration: 0.5, time: 10 }).ok).toBe(false)
  })
})

describe('calculate_concentration_at_time', () => {
  test('first-order concentration matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_concentration_at_time')!
    const result = tool.execute({ order: 'first', initial_concentration: 1, k: 0.1, time: 10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateConcentration('first', 1, 0.1, 10)
    expect(result.value.concentration).toBeCloseTo(engineResult.concentration, 10)
    expect(result.value.halfLife).toBeCloseTo(engineResult.halfLife, 10)
  })

  test('allows zero elapsed time', () => {
    const tool = TOOL_BY_NAME.get('calculate_concentration_at_time')!
    const result = tool.execute({ order: 'second', initial_concentration: 1, k: 0.1, time: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.concentration).toBeCloseTo(1, 10)
  })

  test('rejects negative elapsed time', () => {
    const tool = TOOL_BY_NAME.get('calculate_concentration_at_time')!
    expect(tool.execute({ order: 'zero', initial_concentration: 1, k: 0.1, time: -1 }).ok).toBe(false)
  })
})

async function runTests() {
  console.log('VerChem Answer Card Kinetics Tests (W3 Day 2 Wave B)')
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
