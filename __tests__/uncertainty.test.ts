/**
 * VerChem Uncertainty Propagation - Unit Tests
 * Testing error propagation formulas following GUM standards
 */

import assert from 'node:assert/strict'

import {
  relativeUncertainty,
  absoluteUncertainty,
  propagateDivision,
  propagateMultiplication,
  propagateConstantMultiplication,
  propagateConstantDivision,
  propagateAddition,
  propagateSubtraction,
  expandedUncertainty,
  formatWithUncertainty
} from '@/lib/calculations/uncertainty'

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
    toBeCloseTo(expected: number, precision: number = 6) {
      const diff = Math.abs((actual as number) - expected)
      const tolerance = Math.pow(10, -precision)
      assert.ok(diff < tolerance, `Expected ${actual} to be close to ${expected}`)
    },
    toEqual(expected: unknown) {
      assert.deepEqual(actual, expected)
    },
  }
}

describe('Relative Uncertainty', () => {
  test('calculates relative uncertainty correctly', () => {
    expect(relativeUncertainty(100, 5)).toBeCloseTo(0.05)
    expect(relativeUncertainty(50, 2.5)).toBeCloseTo(0.05)
  })

  test('handles zero value', () => {
    expect(relativeUncertainty(0, 5)).toBe(0)
  })

  test('handles negative values', () => {
    expect(relativeUncertainty(-100, 5)).toBeCloseTo(0.05)
  })
})

describe('Absolute Uncertainty', () => {
  test('calculates absolute uncertainty correctly', () => {
    expect(absoluteUncertainty(100, 0.05)).toBeCloseTo(5)
    expect(absoluteUncertainty(50, 0.1)).toBeCloseTo(5)
  })
})

describe('Division Uncertainty Propagation', () => {
  test('propagates uncertainty for n = m/M', () => {
    // Example: mass = 180.16g ± 0.01g, M = 180.16 g/mol ± 0.01
    const result = propagateDivision(180.16, 0.01, 180.16, 0.01)

    expect(result.value).toBeCloseTo(1.0)
    // Relative uncertainty = sqrt((0.01/180.16)^2 + (0.01/180.16)^2)
    const expectedRelUnc = Math.sqrt(2) * (0.01 / 180.16)
    expect(result.relativeUncertainty).toBeCloseTo(expectedRelUnc)
  })

  test('handles different values correctly', () => {
    const result = propagateDivision(100, 5, 50, 2.5)
    expect(result.value).toBeCloseTo(2.0)
    // Relative uncertainty = sqrt((5/100)^2 + (2.5/50)^2) = sqrt(0.0025 + 0.0025) = sqrt(0.005)
    expect(result.relativeUncertainty).toBeCloseTo(Math.sqrt(0.005))
  })
})

describe('Multiplication Uncertainty Propagation', () => {
  test('propagates uncertainty for m = n × M', () => {
    // Example: n = 1.0 mol ± 0.01, M = 180.16 g/mol ± 0.01
    const result = propagateMultiplication(1.0, 0.01, 180.16, 0.01)

    expect(result.value).toBeCloseTo(180.16)
    // Relative uncertainty follows same formula as division
    const expectedRelUnc = Math.sqrt(
      Math.pow(0.01 / 1.0, 2) + Math.pow(0.01 / 180.16, 2)
    )
    expect(result.relativeUncertainty).toBeCloseTo(expectedRelUnc)
  })
})

describe('Constant Multiplication', () => {
  test('propagates uncertainty when multiplying by constant', () => {
    // N = n × NA (molecules = moles × Avogadro)
    const NA = 6.022e23
    const result = propagateConstantMultiplication(1.0, 0.01, NA)

    expect(result.value).toBeCloseTo(NA)
    // Relative uncertainty only from the variable, not the constant
    expect(result.relativeUncertainty).toBeCloseTo(0.01)
  })
})

describe('Constant Division', () => {
  test('propagates uncertainty when dividing by constant', () => {
    // n = V / 22.414 (moles = volume / molar volume)
    const result = propagateConstantDivision(22.414, 0.01, 22.414)

    expect(result.value).toBeCloseTo(1.0)
    expect(result.relativeUncertainty).toBeCloseTo(0.01 / 22.414)
  })
})

describe('Addition Uncertainty', () => {
  test('propagates uncertainty for addition', () => {
    const result = propagateAddition(10, 0.5, 20, 0.5)

    expect(result.value).toBe(30)
    // sqrt(0.5^2 + 0.5^2) = sqrt(0.5) ≈ 0.707
    expect(result.uncertainty).toBeCloseTo(Math.sqrt(0.5))
  })
})

describe('Subtraction Uncertainty', () => {
  test('propagates uncertainty for subtraction', () => {
    const result = propagateSubtraction(20, 0.5, 10, 0.5)

    expect(result.value).toBe(10)
    // Same formula as addition
    expect(result.uncertainty).toBeCloseTo(Math.sqrt(0.5))
  })
})

describe('Expanded Uncertainty', () => {
  test('calculates 95% confidence interval with k=2', () => {
    expect(expandedUncertainty(1.0, 2)).toBe(2.0)
  })

  test('calculates 99% confidence interval with k=2.576', () => {
    expect(expandedUncertainty(1.0, 2.576)).toBeCloseTo(2.576)
  })

  test('uses default k=2', () => {
    expect(expandedUncertainty(1.0)).toBe(2.0)
  })
})

describe('Format with Uncertainty', () => {
  test('formats value with uncertainty correctly', () => {
    const formatted = formatWithUncertainty(1.2345, 0.0067)
    // Expects decimal places based on uncertainty magnitude
    expect(formatted).toBe('1.2345 ± 0.0067')
  })

  test('handles zero uncertainty', () => {
    const formatted = formatWithUncertainty(1.2345, 0)
    expect(formatted).toBe('1.23')
  })

  test('handles large uncertainty', () => {
    const formatted = formatWithUncertainty(100, 5)
    // toFixed(1) for uncertainty ~5
    expect(formatted).toBe('100.0 ± 5.0')
  })
})

async function runTests() {
  console.log('🧪 VerChem Uncertainty Propagation Unit Tests')
  console.log('=============================================\n')

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
  console.log('--------------')
  console.log(`Total tests: ${tests.length}`)
  console.log(`Passed:      ${passed}`)
  console.log(`Failed:      ${failures.length}`)

  if (failures.length > 0) {
    console.log('\n❌ Failures:')
    failures.forEach((name) => console.log(`  - ${name}`))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All uncertainty tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
