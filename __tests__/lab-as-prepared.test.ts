/**
 * Lab-QC as-prepared engine tests.
 *
 * Uncertainty fixture values and the water expansion coefficient are copied
 * verbatim from EURACHEM/CITAC QUAM:2012 Example A1 as transcribed in
 * .ai-memory/UNCERTAINTY_SOURCES_2026-08-26.md. Other values exercise the
 * unit equations mandated by the as-prepared engine contract.
 */

import assert from 'node:assert/strict'
import { calculateAsPrepared, type AsPreparedInput } from '@/lib/lab/as-prepared'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void): void {
  fn()
}

function test(name: string, fn: TestFn): void {
  tests.push({ name, fn })
}

function closeRelative(actual: number, expected: number, tolerance: number): void {
  assert.ok(
    Math.abs(actual - expected) / Math.abs(expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} relative of ${expected}`
  )
}

const QUAM_EQUIPMENT = {
  massStandardG: 0.00005,
  flaskToleranceMl: 0.1,
  flaskCalibrationTemperatureC: 20,
  fillRepeatabilitySdMl: 0.02,
  temperatureHalfWidthC: 4,
  volumeExpansionCoefficientPerC: null,
  assayToleranceHalfWidthPercent: 0.01,
} as const

const QUAM_INPUT: AsPreparedInput = {
  target: {
    targetConc: 1000,
    targetVolume: 0.1,
    unit: 'mg/L',
    reagentForm: 'Cd metal',
    solvent: 'water', // QUAM A1 is dilute HNO3 in water; its water α is used as specified.
    reagentPurityPercent: 99.99,
    reagentPurityBasis: 'mass',
    preparationTemperatureC: 20,
  },
  targetVolumeUnit: 'L',
  acceptanceRelativePercent: 0.5,
  actual: {
    weighedG: 0.10028,
    measuredMl: null,
    finalVolumeMl: 100,
    coaAssayPercent: 99.99,
    coaBasis: 'mass',
    temperatureC: 20,
    equipment: { ...QUAM_EQUIPMENT },
  },
}

function massInput(overrides: Partial<AsPreparedInput> = {}): AsPreparedInput {
  return {
    ...QUAM_INPUT,
    ...overrides,
    target: { ...QUAM_INPUT.target, ...overrides.target },
    actual: {
      ...QUAM_INPUT.actual,
      ...overrides.actual,
      equipment: {
        ...QUAM_INPUT.actual.equipment,
        ...overrides.actual?.equipment,
      },
    },
  }
}

describe('QUAM A1 golden result and uncertainty budget', () => {
  test('matches Cd 1000 mg/L as-prepared result and each independently declared term', () => {
    const result = calculateAsPrepared(QUAM_INPUT)
    const expectedAssay = (0.01 / 100) / Math.sqrt(3) / 0.9999
    const expectedMass = 0.00005 / 0.10028
    const expectedFlask = (0.1 / Math.sqrt(6)) / 100
    const expectedFill = 0.02 / 100
    const expectedTemperature = (100 * 4 * 2.1e-4 / Math.sqrt(3)) / 100
    const expectedCombined = Math.sqrt(
      expectedAssay ** 2 + expectedMass ** 2 + expectedFlask ** 2 + expectedFill ** 2 + expectedTemperature ** 2
    )

    closeRelative(result.asPrepared.value, 1002.69972, 1e-4)
    closeRelative(result.uncertainty.budget[0]!.standardRelative!, expectedAssay, 1e-3)
    closeRelative(result.uncertainty.budget[1]!.standardRelative!, expectedMass, 1e-3)
    closeRelative(result.uncertainty.budget[2]!.standardRelative!, expectedFlask, 1e-3)
    closeRelative(result.uncertainty.budget[3]!.standardRelative!, expectedFill, 1e-3)
    closeRelative(result.uncertainty.budget[4]!.standardRelative!, expectedTemperature, 1e-3)
    closeRelative(result.uncertainty.combinedRelative!, expectedCombined, 1e-3)
    closeRelative(result.uncertainty.standard!, result.asPrepared.value * expectedCombined, 1e-3)
    closeRelative(result.uncertainty.expandedK2!, 2 * result.uncertainty.standard!, 1e-12)
    assert.equal(result.withinAcceptance, true)
    assert.deepEqual(result.uncertainty.budget.map((term) => term.source), [
      'coa_assay', 'mass', 'flask_calibration', 'fill_repeatability', 'temperature_expansion',
    ])
    // QUAM combines volume terms first as u(V)=0.07 mL; summing their relative squares is identical.

    // Anchor to the PUBLISHED QUAM:2012 A1 results, not just to our own re-derivation:
    // c = 1002.7 mg/L, u_c = 0.9 mg/L, U(k=2) = 1.8 mg/L (Table A1.1, §A1.5).
    // QUAM rounds intermediates (u(V)=0.07 from 0.0671, u_c/c=0.0009 from 0.00086);
    // the unrounded chain gives ≈0.83 mg/L, so allow ±0.1 / ±0.2 around the published values.
    assert.ok(Math.abs(result.asPrepared.value - 1002.7) < 0.05, `c=${result.asPrepared.value}`)
    assert.ok(Math.abs(result.uncertainty.standard! - 0.9) < 0.1, `u_c=${result.uncertainty.standard}`)
    assert.ok(Math.abs(result.uncertainty.expandedK2! - 1.8) < 0.2, `U=${result.uncertainty.expandedK2}`)
    assert.ok(result.uncertainty.combinedRelative! > 0.0008 && result.uncertainty.combinedRelative! < 0.001)
    assert.ok(result.assumptions.some((line) => /No systematic volume correction/.test(line)))
  })
})

describe('target volume unit drives conversion (wide-scan #3)', () => {
  test('a template declared in mL yields the same record as the same target in L', () => {
    const inLitres = calculateAsPrepared(QUAM_INPUT)
    const inMillilitres = calculateAsPrepared({
      ...QUAM_INPUT,
      targetVolumeUnit: 'mL',
      target: { ...QUAM_INPUT.target, targetVolume: QUAM_INPUT.target.targetVolume * 1000 },
    })
    assert.equal(inMillilitres.targetAmount.value, inLitres.targetAmount.value)
    assert.equal(inMillilitres.asPrepared.value, inLitres.asPrepared.value)
    assert.equal(inMillilitres.deviationPercent, inLitres.deviationPercent)
    assert.ok(inMillilitres.assumptions.some((line) => /declared as 100 mL \(0\.1 L used/.test(line)))
  })
  test('a mL number can no longer be silently signed as litres', () => {
    // Target volume drives the amount to weigh; that is where unit confusion showed up.
    const asLitres = calculateAsPrepared({ ...QUAM_INPUT, targetVolumeUnit: 'L', target: { ...QUAM_INPUT.target, targetVolume: 100 } })
    const asMillilitres = calculateAsPrepared({ ...QUAM_INPUT, targetVolumeUnit: 'mL', target: { ...QUAM_INPUT.target, targetVolume: 100 } })
    closeRelative(asLitres.targetAmount.value / asMillilitres.targetAmount.value, 1000, 1e-9)
    closeRelative(asMillilitres.targetAmount.value, 0.1 * 1000 / 1000 / 0.9999, 1e-6) // 0.1 L × 1000 mg/L ÷ assay → 0.10001 g
  })
})

describe('concentration bases and acceptance', () => {
  test('uses the exact CuSO4·5H2O molar mass and reports deviation signs in both directions', () => {
    const target = {
      ...QUAM_INPUT.target,
      targetConc: 1,
      unit: 'mol/L' as const,
      molarMass: 249.69,
      reagentForm: 'CuSO4·5H2O',
      reagentPurityPercent: 100,
    }
    const high = calculateAsPrepared(massInput({
      target,
      actual: { ...QUAM_INPUT.actual, weighedG: 25, coaAssayPercent: 100 },
    }))
    const low = calculateAsPrepared(massInput({
      target,
      actual: { ...QUAM_INPUT.actual, weighedG: 24.9, coaAssayPercent: 100 },
    }))
    assert.ok(high.deviationPercent > 0)
    assert.ok(low.deviationPercent < 0)
  })

  test('flags out-of-acceptance values instead of rejecting the actual measurement', () => {
    const result = calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, weighedG: 0.099, coaAssayPercent: 99.99 },
    }))
    assert.equal(result.withinAcceptance, false)
    assert.ok(result.asPrepared.value > 0)
  })

  test('calculates normality with an explicit H2SO4 equivalents factor of two', () => {
    const result = calculateAsPrepared(massInput({
      target: {
        ...QUAM_INPUT.target,
        targetConc: 1,
        unit: 'N',
        molarMass: 98.072,
        equivalentsFactor: 2,
        reagentForm: 'H2SO4',
        reagentPurityPercent: 100,
      },
      actual: { ...QUAM_INPUT.actual, weighedG: 4.9036, coaAssayPercent: 100 },
    }))
    closeRelative(result.asPrepared.value, 1, 1e-12)
    assert.equal(result.asPrepared.unit, 'N')
  })

  test('calculates mass-fraction ppm from the declared solution density', () => {
    const result = calculateAsPrepared(massInput({
      target: {
        ...QUAM_INPUT.target,
        targetConc: 1000,
        unit: 'ppm',
        solutionDensity: 1.2,
        reagentPurityPercent: 100,
      },
      actual: { ...QUAM_INPUT.actual, weighedG: 0.12, coaAssayPercent: 100 },
    }))
    closeRelative(result.asPrepared.value, 1000, 1e-12)
    assert.equal(result.asPrepared.unit, 'ppm')
  })

  test('calculates %v/v from delivered volume but withholds U for unmodelled delivery uncertainty', () => {
    const result = calculateAsPrepared({
      ...QUAM_INPUT,
      target: {
        ...QUAM_INPUT.target,
        targetConc: 10,
        unit: 'pct_vv',
        reagentForm: 'ethanol',
        reagentPurityPercent: 100,
        reagentPurityBasis: 'volume',
      },
      actual: {
        ...QUAM_INPUT.actual,
        weighedG: null,
        measuredMl: 10,
        coaAssayPercent: 100,
        coaBasis: 'volume',
      },
    })
    closeRelative(result.asPrepared.value, 10, 1e-12)
    assert.equal(result.actualAmount.unit, 'mL')
    assert.equal(result.uncertainty.available, false)
    assert.equal(result.uncertainty.budget[1]!.status, 'not_included')
    assert.match(result.uncertainty.budget[1]!.basis, /pipette\/burette delivery uncertainty/i)
  })
})

describe('scope guards and declared omissions', () => {
  test('rejects a weighed mass on the %v/v volume path', () => {
    assert.throws(() => calculateAsPrepared({
      ...QUAM_INPUT,
      target: {
        ...QUAM_INPUT.target,
        targetConc: 10,
        unit: 'pct_vv',
        reagentPurityBasis: 'volume',
        reagentPurityPercent: 100,
      },
      actual: {
        ...QUAM_INPUT.actual,
        weighedG: 10,
        measuredMl: 10,
        coaAssayPercent: 100,
        coaBasis: 'volume',
      },
    }), /weighedG must be null/i)
  })

  test('rejects a delivered volume on a mass-measurement path', () => {
    assert.throws(() => calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, measuredMl: 10 },
    })), /measuredMl must be null/i)
  })

  test('rejects CoA-basis mismatch and invalid assay bounds', () => {
    assert.throws(() => calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, coaBasis: 'volume' },
    })), /must match/i)
    assert.throws(() => calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, coaAssayPercent: 0 },
    })), /range \(0, 100\]/i)
    assert.throws(() => calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, coaAssayPercent: 100.5 },
    })), /range \(0, 100\]/i)
  })

  test('leaves a non-water thermal term unmodelled when no coefficient is declared', () => {
    const result = calculateAsPrepared(massInput({
      target: { ...QUAM_INPUT.target, solvent: 'ethanol' },
    }))
    assert.equal(result.uncertainty.available, true)
    assert.equal(result.uncertainty.budget[4]!.status, 'not_included')
    assert.match(result.uncertainty.budget[4]!.basis, /ethanol/i)
  })

  test('withholds standard and expanded uncertainty if a required term is not stated', () => {
    const result = calculateAsPrepared(massInput({
      actual: {
        ...QUAM_INPUT.actual,
        equipment: { ...QUAM_EQUIPMENT, massStandardG: null },
      },
    }))
    assert.equal(result.uncertainty.available, false)
    assert.equal(result.uncertainty.combinedRelative, null)
    assert.equal(result.uncertainty.standard, null)
    assert.equal(result.uncertainty.expandedK2, null)
    assert.ok(result.asPrepared.value > 0)
  })

  test('rejects invalid physical inputs before they can produce a non-finite record', () => {
    assert.throws(() => calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, weighedG: 0 },
    })), /weighedG.*positive finite/i)
    assert.throws(() => calculateAsPrepared(massInput({
      actual: { ...QUAM_INPUT.actual, finalVolumeMl: Number.POSITIVE_INFINITY },
    })), /finalVolumeMl.*positive finite/i)
    assert.throws(() => calculateAsPrepared(massInput({ acceptanceRelativePercent: 0 })), /acceptanceRelativePercent/i)
  })

  test('is deterministic for the same fully declared input', () => {
    assert.deepEqual(calculateAsPrepared(QUAM_INPUT), calculateAsPrepared(QUAM_INPUT))
  })
})

async function runTests(): Promise<void> {
  console.log('🧪 Lab-QC as-prepared engine tests\n')
  let passed = 0
  const failures: string[] = []

  for (const testCase of tests) {
    try {
      await testCase.fn()
      passed++
      console.log('  ✓ ' + testCase.name)
    } catch (error) {
      failures.push(testCase.name)
      console.log('  ✗ ' + testCase.name)
      console.error(error)
    }
  }

  console.log(`\n${passed} passed, ${failures.length} failed`)
  if (failures.length > 0) process.exitCode = 1
}

void runTests()
