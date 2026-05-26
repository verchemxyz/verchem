/**
 * VerChem Answer Card Tools — Nuclear Family Tests (W3 Day 2 Wave B)
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  radioactiveDecay,
  halfLifeFromDecay,
  timeToDecay,
  decayConstant,
  bindingEnergy,
  massEnergyEquivalence,
} from '@/lib/calculations/nuclear'

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

describe('radioactive_decay', () => {
  test('one half-life leaves half the sample and matches engine', () => {
    const tool = TOOL_BY_NAME.get('radioactive_decay')!
    const result = tool.execute({
      initial_amount: 100,
      half_life: 10,
      elapsed_time: 10,
      half_life_unit: 'seconds',
      elapsed_unit: 'seconds',
      amount_unit: 'atoms',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = radioactiveDecay(100, 10, 10)
    expect(result.value.remainingAmount).toBeCloseTo(engineResult.remainingAmount, 10)
    expect(result.value.decayedAmount).toBeCloseTo(engineResult.decayedAmount, 10)
    expect(result.value.numHalfLives).toBeCloseTo(1, 10)
    expect(result.value.activity).toBeCloseTo(engineResult.activity, 10)
    expect(result.value.activityUnit).toBe('Bq')
  })

  test('rejects mismatched time units', () => {
    const tool = TOOL_BY_NAME.get('radioactive_decay')!
    expect(tool.execute({ initial_amount: 100, half_life: 10, elapsed_time: 1, half_life_unit: 'days', elapsed_unit: 'hours' }).ok).toBe(false)
  })
})

describe('half_life_from_decay', () => {
  test('100 to 25 in 20 time units gives half-life 10', () => {
    const tool = TOOL_BY_NAME.get('half_life_from_decay')!
    const result = tool.execute({ initial_amount: 100, remaining_amount: 25, elapsed_time: 20 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = halfLifeFromDecay(100, 25, 20)
    expect(result.value.halfLife).toBeCloseTo(engineResult, 10)
    expect(result.value.halfLife).toBeCloseTo(10, 10)
  })

  test('rejects no-decay input that would divide by zero', () => {
    const tool = TOOL_BY_NAME.get('half_life_from_decay')!
    expect(tool.execute({ initial_amount: 100, remaining_amount: 100, elapsed_time: 20 }).ok).toBe(false)
  })
})

describe('time_to_decay', () => {
  test('100 to 25 with half-life 10 takes 20 time units', () => {
    const tool = TOOL_BY_NAME.get('time_to_decay')!
    const result = tool.execute({ initial_amount: 100, target_amount: 25, half_life: 10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = timeToDecay(100, 25, 10)
    expect(result.value.time).toBeCloseTo(engineResult, 10)
    expect(result.value.time).toBeCloseTo(20, 10)
  })

  test('rejects target above initial amount', () => {
    const tool = TOOL_BY_NAME.get('time_to_decay')!
    expect(tool.execute({ initial_amount: 100, target_amount: 101, half_life: 10 }).ok).toBe(false)
  })
})

describe('decay_constant', () => {
  test('decay constant equals ln(2)/half-life', () => {
    const tool = TOOL_BY_NAME.get('decay_constant')!
    const result = tool.execute({ half_life: 10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.decayConstant).toBeCloseTo(decayConstant(10), 10)
  })

  test('rejects zero half-life', () => {
    const tool = TOOL_BY_NAME.get('decay_constant')!
    expect(tool.execute({ half_life: 0 }).ok).toBe(false)
  })
})

describe('binding_energy', () => {
  test('helium-4 binding energy matches engine and textbook scale', () => {
    const tool = TOOL_BY_NAME.get('binding_energy')!
    const result = tool.execute({ Z: 2, N: 2, atomic_mass: 4.002603 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = bindingEnergy(2, 2, 4.002603)
    expect(result.value.totalBE).toBeCloseTo(engineResult.totalBE, 10)
    expect(result.value.perNucleon).toBeCloseTo(engineResult.perNucleon, 10)
    expect(result.value.totalBE).toBeCloseTo(28.3, 1)
  })

  test('rejects impossible atomic number', () => {
    const tool = TOOL_BY_NAME.get('binding_energy')!
    expect(tool.execute({ Z: 119, N: 1, atomic_mass: 120 }).ok).toBe(false)
  })
})

describe('mass_energy_equivalence', () => {
  test('0.1 amu equals 93.1494 MeV', () => {
    const tool = TOOL_BY_NAME.get('mass_energy_equivalence')!
    const result = tool.execute({ delta_mass_amu: 0.1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.energyMeV).toBeCloseTo(massEnergyEquivalence(0.1), 10)
    expect(result.value.energyMeV).toBeCloseTo(93.1494, 4)
  })

  test('rejects overflow through finalizeResult', () => {
    const tool = TOOL_BY_NAME.get('mass_energy_equivalence')!
    expect(tool.execute({ delta_mass_amu: 1e308 }).ok).toBe(false)
  })
})

async function runTests() {
  console.log('VerChem Answer Card Nuclear Tests (W3 Day 2 Wave B)')
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
