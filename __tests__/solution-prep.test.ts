/**
 * VerChem Stock Solution Preparation — Unit Tests
 *
 * Guards the bench-safety invariant behind `calculateStockPrep`: the returned
 * amount is only ever presented as a mass when it IS a mass. %v/v yields a
 * volume of liquid solute, and telling someone to weigh it is a real-world
 * measurement error (ethanol at 0.789 g/mL is off by >20%).
 *
 * Also pins the assumption reporting for %w/w (solution density) and normality
 * (equivalents factor), since a silently assumed value is the same class of
 * defect: a number that looks exact but isn't.
 */

import assert from 'node:assert/strict'

import { calculateStockPrep } from '@/lib/calculations/solution-prep'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void) {
  fn()
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function closeTo(actual: number, expected: number, precision = 6) {
  const diff = Math.abs(actual - expected)
  assert.ok(diff < Math.pow(10, -precision), `Expected ${actual} to be close to ${expected}`)
}

/** Every step that instructs weighing, lowercased for matching. */
function weighSteps(steps: string[]): string[] {
  return steps.filter((s) => /weigh/i.test(s))
}

describe('mass-based units report a mass', () => {
  test('mol/L: 1 M NaCl in 1 L = 58.44 g, measured by mass', () => {
    const r = calculateStockPrep({ targetConc: 1, targetVolume: 1, molarMass: 58.44, unit: 'mol/L' })
    closeTo(r.amount, 58.44, 4)
    assert.equal(r.amountUnit, 'g')
    assert.equal(r.measureBy, 'mass')
    assert.deepEqual(r.assumptions, [])
    assert.ok(weighSteps(r.steps).length === 1, 'a mass result should instruct weighing exactly once')
  })

  test('mmol/L converts to mol/L before massing', () => {
    const r = calculateStockPrep({ targetConc: 500, targetVolume: 2, molarMass: 40, unit: 'mmol/L' })
    closeTo(r.amount, 0.5 * 2 * 40, 6) // 0.5 mol/L x 2 L x 40 g/mol
    assert.equal(r.amountUnit, 'g')
  })

  test('g/L is a direct mass', () => {
    const r = calculateStockPrep({ targetConc: 10, targetVolume: 0.5, molarMass: 1, unit: 'g/L' })
    closeTo(r.amount, 5, 6)
    assert.equal(r.measureBy, 'mass')
  })

  test('%w/v is g per 100 mL', () => {
    const r = calculateStockPrep({ targetConc: 5, targetVolume: 1, molarMass: 1, unit: 'pct_wv' })
    closeTo(r.amount, 50, 6) // 5 g/100 mL over 1000 mL
    assert.equal(r.measureBy, 'mass')
    assert.deepEqual(r.assumptions, [])
  })
})

describe('%v/v yields a VOLUME — never a mass', () => {
  test('returns mL measured by volume, not grams', () => {
    const r = calculateStockPrep({ targetConc: 5, targetVolume: 1, molarMass: 46.07, unit: 'pct_vv' })
    closeTo(r.amount, 50, 6) // 5 mL per 100 mL over 1000 mL
    assert.equal(r.amountUnit, 'mL')
    assert.equal(r.measureBy, 'volume')
  })

  test('REGRESSION: preparation steps must never say to weigh a %v/v amount', () => {
    const r = calculateStockPrep({ targetConc: 5, targetVolume: 1, molarMass: 46.07, unit: 'pct_vv' })
    assert.equal(
      weighSteps(r.steps).filter((s) => !/do NOT weigh|not weigh/i.test(s)).length,
      0,
      'a volume result must not produce a "weigh N g" instruction'
    )
    assert.ok(
      r.steps.some((s) => /measure/i.test(s) && s.includes('mL')),
      'a volume result must instruct measuring in mL'
    )
  })

  test('the amount never appears followed by a gram unit in the steps', () => {
    const r = calculateStockPrep({ targetConc: 10, targetVolume: 2, molarMass: 46.07, unit: 'pct_vv' })
    const amountAsGrams = new RegExp(`${r.amount}\\s*g\\b`)
    assert.ok(
      !r.steps.some((s) => amountAsGrams.test(s)),
      'the volume figure must never be labelled with grams'
    )
  })
})

describe('%w/w declares its density assumption', () => {
  test('without a density it assumes 1 g/mL and says so', () => {
    const r = calculateStockPrep({ targetConc: 10, targetVolume: 1, molarMass: 1, unit: 'pct_ww' })
    closeTo(r.amount, 100, 6) // 10% of 1000 g
    assert.equal(r.assumptions.length, 1)
    assert.ok(/density/i.test(r.assumptions[0]))
  })

  test('with a measured density the assumption disappears and the mass scales', () => {
    const r = calculateStockPrep({
      targetConc: 10, targetVolume: 1, molarMass: 1, unit: 'pct_ww', solutionDensity: 1.84,
    })
    closeTo(r.amount, 184, 6) // 10% of (1000 mL x 1.84 g/mL)
    assert.deepEqual(r.assumptions, [])
  })

  test('a non-positive density is rejected rather than silently ignored', () => {
    assert.throws(
      () => calculateStockPrep({
        targetConc: 10, targetVolume: 1, molarMass: 1, unit: 'pct_ww', solutionDensity: 0,
      }),
      /density must be positive/i
    )
  })
})

describe('normality declares its equivalents assumption', () => {
  test('without a factor it assumes 1 and says so', () => {
    const r = calculateStockPrep({ targetConc: 1, targetVolume: 1, molarMass: 98.08, unit: 'N' })
    closeTo(r.amount, 98.08, 4)
    assert.equal(r.assumptions.length, 1)
    assert.ok(/equivalents/i.test(r.assumptions[0]))
  })

  test('H2SO4 with factor 2 needs half the mass', () => {
    const r = calculateStockPrep({
      targetConc: 1, targetVolume: 1, molarMass: 98.08, unit: 'N', equivalentsFactor: 2,
    })
    closeTo(r.amount, 49.04, 4)
    assert.deepEqual(r.assumptions, [])
  })

  test('a non-positive equivalents factor is rejected', () => {
    assert.throws(
      () => calculateStockPrep({
        targetConc: 1, targetVolume: 1, molarMass: 98.08, unit: 'N', equivalentsFactor: -1,
      }),
      /equivalents factor must be positive/i
    )
  })
})

describe('input guards', () => {
  test('rejects non-positive concentration, volume and molar mass', () => {
    assert.throws(() => calculateStockPrep({ targetConc: 0, targetVolume: 1, molarMass: 1, unit: 'g/L' }))
    assert.throws(() => calculateStockPrep({ targetConc: 1, targetVolume: 0, molarMass: 1, unit: 'g/L' }))
    assert.throws(() => calculateStockPrep({ targetConc: 1, targetVolume: 1, molarMass: 0, unit: 'g/L' }))
  })
})

async function runTests() {
  console.log('🧪 Solution Preparation Tests\n')

  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log(`  ✓ ${testCase.name}`)
    } catch (error) {
      failures.push(testCase.name)
      console.log(`  ✗ ${testCase.name}`)
      console.error(error)
    }
  }

  console.log(`\n${passed} passed, ${failures.length} failed`)

  if (failures.length > 0) {
    failures.forEach((name) => console.log(`  - ${name}`))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All solution-prep tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
