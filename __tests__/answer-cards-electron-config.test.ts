/**
 * VerChem Answer Card Tools — Electron Configuration Family Tests (W3 Day 2 Wave B)
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import { calculateElectronConfiguration } from '@/lib/calculations/electron-config'

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
    toBeUndefined() {
      assert.equal(actual, undefined)
    },
  }
}

describe('electron_configuration', () => {
  test('carbon configuration matches engine and returns compact payload', () => {
    const tool = TOOL_BY_NAME.get('electron_configuration')!
    const result = tool.execute({ atomicNumber: 6 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateElectronConfiguration(6, 'C')
    expect(result.value.atomicNumber).toBe(engineResult.atomicNumber)
    expect(result.value.element).toBe(engineResult.element)
    expect(result.value.fullConfig).toBe(engineResult.fullConfig)
    expect(result.value.nobleGasConfig).toBe(engineResult.nobleGasConfig)
    expect(result.value.condensedConfig).toBe(engineResult.condensedConfig)
    expect(result.value.valenceElectrons).toBe(engineResult.valenceElectrons)
    expect(result.value.subshells).toBeUndefined()
    expect(result.value.orbitalBoxDiagram).toBeUndefined()
    expect(result.value.quantumNumbers).toBeUndefined()
  })

  test('chromium applies exceptions by default', () => {
    const tool = TOOL_BY_NAME.get('electron_configuration')!
    const result = tool.execute({ atomicNumber: 24 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateElectronConfiguration(24, 'Cr')
    expect(result.value.condensedConfig).toBe(engineResult.condensedConfig)
  })

  test('can disable exceptions explicitly', () => {
    const tool = TOOL_BY_NAME.get('electron_configuration')!
    const result = tool.execute({ atomicNumber: 24, apply_exceptions: false })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = calculateElectronConfiguration(24, 'Cr', false)
    expect(result.value.condensedConfig).toBe(engineResult.condensedConfig)
  })

  test('rejects out-of-range and non-integer atomic numbers', () => {
    const tool = TOOL_BY_NAME.get('electron_configuration')!
    expect(tool.execute({ atomicNumber: 0 }).ok).toBe(false)
    expect(tool.execute({ atomicNumber: 119 }).ok).toBe(false)
    expect(tool.execute({ atomicNumber: 6.5 }).ok).toBe(false)
  })

  test('rejects invalid optional apply_exceptions value', () => {
    const tool = TOOL_BY_NAME.get('electron_configuration')!
    expect(tool.execute({ atomicNumber: 6, apply_exceptions: 'true' }).ok).toBe(false)
  })
})

async function runTests() {
  console.log('VerChem Answer Card Electron Configuration Tests (W3 Day 2 Wave B)')
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
