/**
 * VerChem Answer Card Tools Tests
 *
 * Enforces the verification invariant: each tool execute() must route to
 * the REAL engine function in lib/calculations/*. Numbers must match.
 */

import assert from 'node:assert/strict'
import { ALL_TOOLS, TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import {
  calculateStrongAcidPH,
  calculateWeakAcidPH,
  calculateStrongBasePH,
  calculateWeakBasePH,
  hendersonHasselbalch,
  calculateDilution,
} from '@/lib/calculations/solutions'
import {
  idealGasLaw,
  combinedGasLaw,
  boylesLaw,
  charlesLaw,
  gayLussacsLaw,
  avogadrosLaw,
  vanDerWaalsEquation,
} from '@/lib/calculations/gas-laws'
import {
  balanceEquation,
  identifyReactionType,
} from '@/lib/calculations/equation-balancer'

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
    toBeGreaterThan(expected: number) {
      assert.equal(typeof actual, 'number')
      assert.ok((actual as number) > expected)
    },
    toBeCloseTo(expected: number, precision = 2) {
      assert.equal(typeof actual, 'number')
      const diff = Math.abs((actual as number) - expected)
      assert.ok(diff < Math.pow(10, -precision), `Expected ${actual} to be close to ${expected}`)
    },
    toContain(expected: unknown) {
      if (typeof actual === 'string') {
        assert.ok(actual.includes(String(expected)))
        return
      }
      if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected))
        return
      }
      throw new Error('toContain only supports string and array values')
    },
  }
}

describe('Tool registry', () => {
  test('ALL_TOOLS has expected Day 1 tools', () => {
    const names = ALL_TOOLS.map((t) => t.name)
    expect(names).toContain('calculate_strong_acid_ph')
    expect(names).toContain('calculate_weak_acid_ph')
    expect(names).toContain('calculate_strong_base_ph')
    expect(names).toContain('calculate_weak_base_ph')
    expect(names).toContain('calculate_buffer_ph')
    expect(names).toContain('calculate_dilution')
    expect(names).toContain('ideal_gas_law')
    expect(names).toContain('combined_gas_law')
    expect(names).toContain('boyles_law')
    expect(names).toContain('charles_law')
    expect(names).toContain('gay_lussac_law')
    expect(names).toContain('avogadro_law')
    expect(names).toContain('van_der_waals')
    expect(names).toContain('balance_equation')
  })

  test('TOOL_BY_NAME maps every tool', () => {
    for (const tool of ALL_TOOLS) {
      expect(TOOL_BY_NAME.get(tool.name)).toEqual(tool)
    }
  })
})

describe('pH tools route to real engines', () => {
  test('calculate_strong_acid_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: 0.01 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateStrongAcidPH(0.01)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.pOH).toBeCloseTo(engineResult.pOH, 10)
    expect(result.value.H_concentration).toBeCloseTo(engineResult.H_concentration as number, 10)
    expect(result.value.OH_concentration).toBeCloseTo(engineResult.OH_concentration as number, 10)
  })

  test('calculate_weak_acid_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1, Ka: 1.8e-5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakAcidPH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.H_concentration).toBeCloseTo(engineResult.H_concentration as number, 10)
    expect(result.value.percent_ionization).toBeCloseTo(engineResult.percentIonization as number, 10)
  })

  test('calculate_weak_acid_ph resolves known acid by name', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1, acid_name: 'CH3COOH' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakAcidPH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
  })

  test('calculate_strong_base_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_base_ph')!
    const result = tool.execute({ concentration: 0.01 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateStrongBasePH(0.01)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.pOH).toBeCloseTo(engineResult.pOH, 10)
  })

  test('calculate_weak_base_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_base_ph')!
    const result = tool.execute({ concentration: 0.1, Kb: 1.8e-5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateWeakBasePH(0.1, 1.8e-5)
    expect(result.value.pH).toBeCloseTo(engineResult.pH, 10)
    expect(result.value.pOH).toBeCloseTo(engineResult.pOH, 10)
  })

  test('calculate_buffer_ph matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_buffer_ph')!
    const result = tool.execute({ pKa: 4.76, acid_concentration: 0.1, base_concentration: 0.1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = hendersonHasselbalch(4.76, 0.1, 0.1)
    expect(result.value.pH).toBeCloseTo(engineResult, 10)
  })

  test('calculate_dilution matches engine', () => {
    const tool = TOOL_BY_NAME.get('calculate_dilution')!
    const result = tool.execute({ M1: 1.0, V1: 0.5, M2: 0.5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = calculateDilution({ M1: 1.0, V1: 0.5, M2: 0.5 })
    expect(result.value.V2).toBeCloseTo(engineResult.V2, 10)
    expect(result.value.dilution_factor).toBeCloseTo(engineResult.dilutionFactor, 10)
  })
})

describe('Gas law tools route to real engines', () => {
  test('ideal_gas_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('ideal_gas_law')!
    const result = tool.execute({ P: 1.0, V: 22.414, n: 1.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = idealGasLaw({ P: 1.0, V: 22.414, n: 1.0 })
    expect(result.value.T).toBeCloseTo(engineResult.T, 2)
  })

  test('combined_gas_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('combined_gas_law')!
    const result = tool.execute({ P1: 2.0, V1: 5.0, T1: 300, P2: 1.0, T2: 400 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = combinedGasLaw({ P1: 2.0, V1: 5.0, T1: 300, P2: 1.0, T2: 400 })
    expect(result.value.V2).toBeCloseTo(engineResult.V2, 10)
  })

  test('boyles_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('boyles_law')!
    const result = tool.execute({ P1: 2.0, V1: 3.0, P2: 1.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = boylesLaw(2.0, 3.0, 1.0)
    expect(result.value.V2).toBeCloseTo(engineResult.V2 as number, 10)
  })

  test('charles_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('charles_law')!
    const result = tool.execute({ V1: 2.0, T1: 300, V2: 4.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = charlesLaw(2.0, 300, 4.0)
    expect(result.value.T2).toBeCloseTo(engineResult.T2 as number, 10)
  })

  test('gay_lussac_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('gay_lussac_law')!
    const result = tool.execute({ P1: 1.0, T1: 300, P2: 2.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = gayLussacsLaw(1.0, 300, 2.0)
    expect(result.value.T2).toBeCloseTo(engineResult.T2 as number, 10)
  })

  test('avogadro_law matches engine', () => {
    const tool = TOOL_BY_NAME.get('avogadro_law')!
    const result = tool.execute({ V1: 2.0, n1: 1.0, V2: 4.0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = avogadrosLaw(2.0, 1.0, 4.0)
    expect(result.value.n2).toBeCloseTo(engineResult.n2 as number, 10)
  })

  test('van_der_waals matches engine', () => {
    const tool = TOOL_BY_NAME.get('van_der_waals')!
    const result = tool.execute({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: 0.0427 })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = vanDerWaalsEquation({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: 0.0427 })
    expect(result.value.pressure).toBeCloseTo(engineResult, 10)
  })

  test('van_der_waals resolves gas by name', () => {
    const tool = TOOL_BY_NAME.get('van_der_waals')!
    const result = tool.execute({ n: 1.0, V: 10.0, T: 298, gas_name: 'CO2' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = vanDerWaalsEquation({ n: 1.0, V: 10.0, T: 298, a: 3.592, b: 0.0427 })
    expect(result.value.pressure).toBeCloseTo(engineResult, 10)
  })
})

describe('Equation balancer tool routes to real engine', () => {
  test('balance_equation matches engine', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'H2 + O2 -> H2O' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const engineResult = balanceEquation('H2 + O2 -> H2O')
    expect(result.value.balanced).toBe(engineResult.balanced)
    expect(result.value.is_balanced).toBe(engineResult.isBalanced)
    expect(result.value.reaction_type).toBe(identifyReactionType('H2 + O2 -> H2O'))
  })
})

describe('Tool input validation', () => {
  test('rejects negative concentration', () => {
    const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')!
    const result = tool.execute({ concentration: -1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('concentration')).toBe(true)
  })

  test('rejects missing Ka for weak acid', () => {
    const tool = TOOL_BY_NAME.get('calculate_weak_acid_ph')!
    const result = tool.execute({ concentration: 0.1 })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error?.toLowerCase().includes('ka')).toBe(true)
  })

  test('rejects invalid equation', () => {
    const tool = TOOL_BY_NAME.get('balance_equation')!
    const result = tool.execute({ equation: 'not an equation' })
    expect(result.ok).toBe(false)
  })
})

async function runTests() {
  console.log('🧪 VerChem Answer Card Tools Tests')
  console.log('===================================\n')

  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log(`✅ ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.log(`❌ ${testCase.name}`)
      console.error(error)
    }
  }

  console.log('\n📊 Test Summary')
  console.log('---------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failures.length}`)

  if (failures.length > 0) {
    console.log('\n❌ Failures:')
    failures.forEach((name) => console.log(`  - ${name}`))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All tools tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
