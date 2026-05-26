/**
 * VerChem Answer Card Tools — Electrochemistry Family Tests (W3 Day 2 Wave B)
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  calculateCellPotential,
  calculateNernstEquation,
  calculateElectrolysis,
} from '@/lib/calculations/electrochemistry'

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

describe('calculate_cell_potential', () => {
  test('Zn/Cu cell matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_cell_potential')!
    const result = tool.execute({ cathode_potential: 0.34, anode_potential: -0.76, n: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateCellPotential(0.34, -0.76, 2)
    expect(result.value.cellPotential).toBeCloseTo(engineResult.cellPotential, 10)
    expect(result.value.spontaneous).toBe(engineResult.spontaneous)
    expect(result.value.deltaG).toBeCloseTo(engineResult.deltaG, 5)
    expect(result.value.electrons).toBe(2)
  })

  test('rejects non-integer electron count', () => {
    const tool = TOOL_BY_NAME.get('calculate_cell_potential')!
    expect(tool.execute({ cathode_potential: 0.34, anode_potential: -0.76, n: 1.5 }).ok).toBe(false)
  })

  test('rejects overflow through finalizeResult', () => {
    const tool = TOOL_BY_NAME.get('calculate_cell_potential')!
    expect(tool.execute({ cathode_potential: 1e308, anode_potential: -1e308, n: 2 }).ok).toBe(false)
  })
})

describe('calculate_nernst', () => {
  test('Nernst equation matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_nernst')!
    const result = tool.execute({ E0: 1.1, n: 2, Q: 10, temperature_K: 298.15 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateNernstEquation(1.1, 2, 10, 298.15)
    expect(result.value.E).toBeCloseTo(engineResult.E, 10)
    expect(result.value.E0).toBe(1.1)
  })

  test('defaults temperature only when absent', () => {
    const tool = TOOL_BY_NAME.get('calculate_nernst')!
    expect(tool.execute({ E0: 1.1, n: 2, Q: 10 }).ok).toBe(true)
    expect(tool.execute({ E0: 1.1, n: 2, Q: 10, temperature_K: 'bogus' }).ok).toBe(false)
  })

  test('rejects non-positive Q', () => {
    const tool = TOOL_BY_NAME.get('calculate_nernst')!
    expect(tool.execute({ E0: 1.1, n: 2, Q: 0 }).ok).toBe(false)
  })
})

describe('calculate_electrolysis', () => {
  test('electrolysis mass matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_electrolysis')!
    const result = tool.execute({ current: 2, time: 96500, n: 2, molar_mass: 63.546 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateElectrolysis(2, 96500, 2, 63.546)
    expect(result.value.charge).toBeCloseTo(engineResult.charge, 10)
    expect(result.value.moles).toBeCloseTo(engineResult.moles, 10)
    expect(result.value.mass).toBeCloseTo(engineResult.mass, 10)
  })

  test('includes gas volume when requested', () => {
    const tool = TOOL_BY_NAME.get('calculate_electrolysis')!
    const result = tool.execute({ current: 1, time: 96500, n: 2, molar_mass: 2.016, is_gas: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    assert.equal(typeof result.value.volume, 'number')
  })

  test('rejects invalid gas flag and non-positive current', () => {
    const tool = TOOL_BY_NAME.get('calculate_electrolysis')!
    expect(tool.execute({ current: -1, time: 96500, n: 2, molar_mass: 63.546 }).ok).toBe(false)
    expect(tool.execute({ current: 1, time: 96500, n: 2, molar_mass: 63.546, is_gas: 'yes' }).ok).toBe(false)
  })
})

async function runTests() {
  console.log('VerChem Answer Card Electrochemistry Tests (W3 Day 2 Wave B)')
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
