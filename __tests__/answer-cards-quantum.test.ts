/**
 * VerChem Answer Card Tools — Quantum Family Tests (W3 Day 2 Wave B)
 */

import assert from 'node:assert/strict'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  hydrogenEnergy,
  hydrogenTransition,
  photonEnergy,
  debroglieWavelength,
  bohrRadius,
  hydrogenLikeEnergy,
  heisenbergUncertainty,
  validateQuantumNumbers,
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

describe('hydrogen_energy_level', () => {
  test('n=1 hydrogen energy is -13.6 eV', () => {
    const tool = TOOL_BY_NAME.get('hydrogen_energy_level')!
    const result = tool.execute({ n: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.energyEV).toBeCloseTo(hydrogenEnergy(1), 10)
    expect(result.value.energyEV).toBeCloseTo(-13.6, 10)
  })

  test('rejects non-integer n', () => {
    const tool = TOOL_BY_NAME.get('hydrogen_energy_level')!
    expect(tool.execute({ n: 1.5 }).ok).toBe(false)
  })
})

describe('hydrogen_transition', () => {
  test('Balmer 3 to 2 transition matches engine', () => {
    const tool = TOOL_BY_NAME.get('hydrogen_transition')!
    const result = tool.execute({ nInitial: 3, nFinal: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = hydrogenTransition(3, 2)
    expect(result.value.energyEV).toBeCloseTo(engineResult.energyEV, 10)
    expect(result.value.wavelengthNm).toBeCloseTo(engineResult.wavelengthNm, 10)
    expect(result.value.seriesName).toBe('Balmer')
    expect(result.value.isVisible).toBe(true)
  })

  test('rejects same initial and final level', () => {
    const tool = TOOL_BY_NAME.get('hydrogen_transition')!
    expect(tool.execute({ nInitial: 2, nFinal: 2 }).ok).toBe(false)
  })
})

describe('photon_energy', () => {
  test('500 nm photon matches engine', () => {
    const tool = TOOL_BY_NAME.get('photon_energy')!
    const result = tool.execute({ wavelength_nm: 500 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = photonEnergy(500)
    expect(result.value.energyEV).toBeCloseTo(engineResult.energyEV, 10)
    expect(result.value.frequencyHz).toBeCloseTo(engineResult.frequencyHz, 1)
    expect(result.value.region).toBe(engineResult.region)
  })

  test('rejects zero wavelength', () => {
    const tool = TOOL_BY_NAME.get('photon_energy')!
    expect(tool.execute({ wavelength_nm: 0 }).ok).toBe(false)
  })
})

describe('de_broglie_wavelength', () => {
  test('electron-scale wavelength matches engine', () => {
    const tool = TOOL_BY_NAME.get('de_broglie_wavelength')!
    const result = tool.execute({ mass_kg: 9.1093837015e-31, velocity_ms: 1e6 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = debroglieWavelength(9.1093837015e-31, 1e6)
    expect(result.value.wavelengthM).toBeCloseTo(engineResult, 18)
  })

  test('rejects relativistic speed and overflow output', () => {
    const tool = TOOL_BY_NAME.get('de_broglie_wavelength')!
    expect(tool.execute({ mass_kg: 1, velocity_ms: 299_792_458 }).ok).toBe(false)
    expect(tool.execute({ mass_kg: 1e-200, velocity_ms: 1e-200 }).ok).toBe(false)
  })
})

describe('bohr_radius and hydrogen_like_energy', () => {
  test('Bohr radius n=1 Z=1 is 52.9177 pm', () => {
    const tool = TOOL_BY_NAME.get('bohr_radius')!
    const result = tool.execute({ n: 1, Z: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.radiusPm).toBeCloseTo(bohrRadius(1, 1), 10)
    expect(result.value.radiusPm).toBeCloseTo(52.9177, 4)
  })

  test('He+ n=2 energy matches engine', () => {
    const tool = TOOL_BY_NAME.get('hydrogen_like_energy')!
    const result = tool.execute({ n: 2, Z: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.energyEV).toBeCloseTo(hydrogenLikeEnergy(2, 2), 10)
    expect(result.value.energyEV).toBeCloseTo(-13.6, 10)
  })

  test('rejects atomic number above supported elements', () => {
    const tool = TOOL_BY_NAME.get('bohr_radius')!
    expect(tool.execute({ n: 1, Z: 119 }).ok).toBe(false)
  })
})

describe('heisenberg_uncertainty', () => {
  test('computes minimum momentum uncertainty from delta x', () => {
    const tool = TOOL_BY_NAME.get('heisenberg_uncertainty')!
    const result = tool.execute({ deltaX_m: 1e-10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = heisenbergUncertainty(1e-10, undefined)
    expect(result.value.deltaP).toBeCloseTo(engineResult.deltaP, 30)
  })

  test('rejects both inputs and rejects neither input', () => {
    const tool = TOOL_BY_NAME.get('heisenberg_uncertainty')!
    expect(tool.execute({ deltaX_m: 1e-10, deltaP_kgms: 1e-24 }).ok).toBe(false)
    expect(tool.execute({}).ok).toBe(false)
  })
})

describe('validate_quantum_numbers', () => {
  test('valid 2p electron set matches engine', () => {
    const tool = TOOL_BY_NAME.get('validate_quantum_numbers')!
    const result = tool.execute({ n: 2, l: 1, ml: 0, ms: 0.5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const engineResult = validateQuantumNumbers(2, 1, 0, 0.5)
    expect(result.value.valid).toBe(engineResult.valid)
    expect(result.value.orbitalName).toBe(engineResult.orbitalName)
  })

  test('rejects invalid spin before engine call', () => {
    const tool = TOOL_BY_NAME.get('validate_quantum_numbers')!
    expect(tool.execute({ n: 2, l: 1, ml: 0, ms: 0 }).ok).toBe(false)
  })
})

async function runTests() {
  console.log('VerChem Answer Card Quantum Tests (W3 Day 2 Wave B)')
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
