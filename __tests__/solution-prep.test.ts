/**
 * VerChem concentration-model tests.
 *
 * These tests pin physical-basis separation, explicit stock-preparation context,
 * neat-material handling, and measured-vs-approximated mixing volume.
 */

import assert from 'node:assert/strict'

import {
  calculateSerialDilution,
  calculateMixing,
  calculateStockPrep,
  convertConcentration,
  getConcentrationConversionRequirements,
  solveDilution,
  type MixingConcentrationUnit,
  type MixingVolumeUnit,
} from '@/lib/calculations/solution-prep'
import {
  parseOptionalFiniteNumber,
  parseRequiredFiniteNumber,
} from '@/lib/numeric-input'

type TestFn = () => void | Promise<void>
type TestCase = { name: string; fn: TestFn }

const tests: TestCase[] = []

function describe(_name: string, fn: () => void) {
  fn()
}

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function closeTo(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    'Expected ' + actual + ' to be within ' + tolerance + ' of ' + expected
  )
}

function weighSteps(steps: string[]): string[] {
  return steps.filter((step) => /^weigh\s/i.test(step))
}

const MASS_CONTEXT = {
  reagentPurityPercent: 100,
  reagentPurityBasis: 'mass' as const,
  reagentForm: 'NaCl (anhydrous)',
  solvent: 'water',
  preparationTemperatureC: 20,
}

const VOLUME_CONTEXT = {
  reagentPurityPercent: 100,
  reagentPurityBasis: 'volume' as const,
  reagentForm: 'ethanol (neat)',
  solvent: 'water',
  preparationTemperatureC: 20,
}

describe('stock preparation: explicit model inputs', () => {
  test('1 M NaCl in 1 L = 58.44 g of the exact reagent form', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 1,
      targetVolume: 1,
      molarMass: 58.44,
      unit: 'mol/L',
    })

    closeTo(result.amount, 58.44)
    assert.equal(result.amountUnit, 'g')
    assert.equal(result.measureBy, 'mass')
    assert.equal(result.model.molarMassBasis, 'exact-as-weighed-form')
    assert.equal(result.model.reagentForm, 'NaCl (anhydrous)')
    assert.equal(result.model.solvent, 'water')
    assert.equal(result.model.preparationTemperatureC, 20)
    assert.ok(result.assumptions.every((assumption) => /IUPAC|ISO|material balance/i.test(assumption)))
    assert.equal(weighSteps(result.steps).length, 1)
  })

  test('hydrate form uses the hydrate molar mass instead of an anhydrous default', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      reagentForm: 'CuSO4·5H2O',
      targetConc: 1,
      targetVolume: 1,
      molarMass: 249.685,
      unit: 'mol/L',
    })

    closeTo(result.amount, 249.685)
    assert.equal(result.model.reagentForm, 'CuSO4·5H2O')
    assert.ok(result.assumptions.some((assumption) => /hydrate\/solvate/i.test(assumption)))
  })

  test('99.5% mass assay increases the amount by the exact reciprocal assay', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      reagentPurityPercent: 99.5,
      targetConc: 10,
      targetVolume: 1,
      unit: 'g/L',
    })

    closeTo(result.amount, 10 / 0.995)
    assert.equal(result.model.reagentPurityPercent, 99.5)
    assert.equal(result.model.reagentPurityBasis, 'mass')
  })

  test('mass units do not require a dummy molar mass', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 5,
      targetVolume: 2,
      unit: 'g/L',
    })
    closeTo(result.amount, 10)
    assert.equal(result.model.molarMassBasis, null)
  })

  test('missing reagent form, solvent, temperature, or assay is rejected', () => {
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      reagentForm: '',
      targetConc: 1,
      targetVolume: 1,
      unit: 'g/L',
    }), /reagent form is required/i)

    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      solvent: '',
      targetConc: 1,
      targetVolume: 1,
      unit: 'g/L',
    }), /solvent identity is required/i)

    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      preparationTemperatureC: Number.NaN,
      targetConc: 1,
      targetVolume: 1,
      unit: 'g/L',
    }), /temperature/i)

    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      reagentPurityPercent: Number.NaN,
      targetConc: 1,
      targetVolume: 1,
      unit: 'g/L',
    }), /purity\/assay/i)
  })
})

describe('stock preparation: volume and fraction bases', () => {
  test('%v/v returns a volume and never labels it as grams', () => {
    const result = calculateStockPrep({
      ...VOLUME_CONTEXT,
      targetConc: 5,
      targetVolume: 1,
      unit: 'pct_vv',
    })

    closeTo(result.amount, 50)
    assert.equal(result.amountUnit, 'mL')
    assert.equal(result.measureBy, 'volume')
    assert.equal(
      weighSteps(result.steps).filter((step) => !/must not be weighed|do not weigh/i.test(step)).length,
      0
    )
    assert.ok(!result.steps.some((step) => /50(?:\.0+)?\s*g\b/.test(step)))
  })

  test('%v/v requires a volume-basis assay', () => {
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 5,
      targetVolume: 1,
      unit: 'pct_vv',
    }), /purity on a volume basis/i)
  })

  test('%w/w requires measured solution density and uses it', () => {
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 10,
      targetVolume: 1,
      unit: 'pct_ww',
    }), /solution density.*required/i)

    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 10,
      targetVolume: 1,
      unit: 'pct_ww',
      solutionDensity: 1.84,
    })
    closeTo(result.amount, 184)
    assert.equal(result.model.solutionDensity, 1.84)
  })

  test('ppm stock preparation is mass fraction, not mg/L', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 1000,
      targetVolume: 1,
      unit: 'ppm',
      solutionDensity: 1.2,
    })
    closeTo(result.amount, 1.2)

    const mgPerL = calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 1000,
      targetVolume: 1,
      unit: 'mg/L',
    })
    closeTo(mgPerL.amount, 1)
    assert.notEqual(result.amount, mgPerL.amount)
  })

  test('normality requires the reaction-specific equivalents factor', () => {
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      reagentForm: 'H2SO4',
      targetConc: 1,
      targetVolume: 1,
      molarMass: 98.072,
      unit: 'N',
    }), /equivalents factor is required/i)

    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      reagentForm: 'H2SO4',
      targetConc: 1,
      targetVolume: 1,
      molarMass: 98.072,
      unit: 'N',
      equivalentsFactor: 2,
    })
    closeTo(result.amount, 49.036)
    assert.equal(result.model.equivalentsFactor, 2)
  })
})

describe('stock preparation: neat material and safety boundary', () => {
  test('100% v/v is a neat material with no dilution or generic acid SOP', () => {
    const result = calculateStockPrep({
      ...VOLUME_CONTEXT,
      solvent: 'none',
      targetConc: 100,
      targetVolume: 1,
      unit: 'pct_vv',
    })
    closeTo(result.amount, 1000)
    assert.equal(result.workflow, 'neat-material')
    assert.equal(result.model.solvent, null)
    assert.ok(result.steps.some((step) => /no solvent is added/i.test(step)))
    assert.ok(!result.steps.some((step) => /\badd acid\b|never the reverse|fill.*water/i.test(step)))
  })

  test('100% w/w is a neat material and does not tell the user to add water', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      reagentForm: 'neat reagent',
      solvent: 'none',
      targetConc: 100,
      targetVolume: 1,
      unit: 'pct_ww',
      solutionDensity: 0.789,
    })
    closeTo(result.amount, 789)
    assert.equal(result.workflow, 'neat-material')
    assert.ok(!result.steps.some((step) => /\badd\b.*water|fill.*water/i.test(step)))
  })

  test('100% target from sub-100% reagent is rejected', () => {
    assert.throws(() => calculateStockPrep({
      ...VOLUME_CONTEXT,
      solvent: 'none',
      reagentPurityPercent: 96,
      targetConc: 100,
      targetVolume: 1,
      unit: 'pct_vv',
    }), /100% target.*below 100%/i)
  })

  test('"none" is accepted only for neat material and a neat target must declare it', () => {
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      solvent: 'none',
      targetConc: 1,
      targetVolume: 1,
      unit: 'g/L',
    }), /actual solvent identity/i)

    assert.throws(() => calculateStockPrep({
      ...VOLUME_CONTEXT,
      solvent: 'water',
      targetConc: 100,
      targetVolume: 1,
      unit: 'pct_vv',
    }), /requires solvent.*"none"/i)
  })

  test('unknown chemistry never receives a generic acid order-of-addition instruction', () => {
    const result = calculateStockPrep({
      ...MASS_CONTEXT,
      reagentForm: 'unknown reagent',
      targetConc: 1,
      targetVolume: 1,
      unit: 'g/L',
    })
    assert.ok(result.steps.some((step) => /SDS and an approved protocol/i.test(step)))
    assert.ok(!result.steps.some((step) => /always add acid|never the reverse/i.test(step)))
  })
})

describe('stock preparation: numerical and domain guards', () => {
  test('non-positive and non-finite primary inputs are rejected', () => {
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 0,
      targetVolume: 1,
      unit: 'g/L',
    }))
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 1,
      targetVolume: Number.POSITIVE_INFINITY,
      unit: 'g/L',
    }), /finite/i)
  })

  test('percentage and mass-fraction values above 100% are rejected', () => {
    assert.throws(() => calculateStockPrep({
      ...VOLUME_CONTEXT,
      targetConc: 120,
      targetVolume: 1,
      unit: 'pct_vv',
    }), /cannot exceed 100%/i)
    assert.throws(() => calculateStockPrep({
      ...MASS_CONTEXT,
      targetConc: 1_000_001,
      targetVolume: 1,
      unit: 'ppm',
      solutionDensity: 1,
    }), /cannot exceed/i)
  })
})

describe('strict calculator input and dilution guards', () => {
  test('text fields reject blanks, partial numeric tokens, and non-finite values', () => {
    assert.throws(() => parseRequiredFiniteNumber('', 'Value'), /required/i)
    assert.throws(() => parseRequiredFiniteNumber('2abc', 'Value'), /finite/i)
    assert.throws(() => parseRequiredFiniteNumber('Infinity', 'Value'), /finite/i)
    assert.equal(parseOptionalFiniteNumber('  ', 'Value'), undefined)
    assert.equal(parseRequiredFiniteNumber('2.5', 'Value'), 2.5)
  })

  test('dilution rejects non-finite inputs and non-finite derived results', () => {
    assert.throws(() => solveDilution({
      c1: Number.POSITIVE_INFINITY,
      v1: 1,
      c2: 1,
    }), /finite/i)
    assert.throws(() => solveDilution({
      c1: Number.MAX_VALUE,
      v1: Number.MAX_VALUE,
      c2: 1,
    }), /finite representable range/i)
  })

  test('serial dilution requires a finite whole count and finite derived values', () => {
    const base = {
      initialConc: 1,
      dilutionFactor: 10,
      transferVolume: 1,
    }
    assert.throws(() => calculateSerialDilution({ ...base, numDilutions: 2.5 }), /whole integer/i)
    assert.throws(() => calculateSerialDilution({ ...base, numDilutions: Number.POSITIVE_INFINITY }), /whole integer/i)
    assert.throws(() => calculateSerialDilution({
      ...base,
      dilutionFactor: Number.MAX_VALUE,
      transferVolume: Number.MAX_VALUE,
      numDilutions: 2,
    }), /finite representable range/i)
  })
})

describe('concentration conversion: correct physical bases', () => {
  test('10% v/v ethanol uses solute density: 78.9 g/L', () => {
    const result = convertConcentration({
      value: 10,
      fromUnit: 'pct_vv',
      toUnit: 'g/L',
      soluteDensity: 0.789,
      densityTemperatureC: 20,
    })
    closeTo(result.convertedValue, 78.9)
    assert.equal(result.model.soluteDensity, 0.789)
    assert.equal(result.model.solutionDensity, null)
  })

  test('10% w/w solution uses solution density: 98.4 g/L', () => {
    const result = convertConcentration({
      value: 10,
      fromUnit: 'pct_ww',
      toUnit: 'g/L',
      solutionDensity: 0.984,
      densityTemperatureC: 20,
    })
    closeTo(result.convertedValue, 98.4)
    assert.equal(result.model.solutionDensity, 0.984)
    assert.equal(result.model.soluteDensity, null)
  })

  test('%v/v to %w/w requires and uses both densities', () => {
    assert.throws(() => convertConcentration({
      value: 10,
      fromUnit: 'pct_vv',
      toUnit: 'pct_ww',
      soluteDensity: 0.789,
      densityTemperatureC: 20,
    }), /solution density is required/i)

    const result = convertConcentration({
      value: 10,
      fromUnit: 'pct_vv',
      toUnit: 'pct_ww',
      soluteDensity: 0.789,
      solutionDensity: 0.984,
      densityTemperatureC: 20,
    })
    closeTo(result.convertedValue, (10 * 0.789) / 0.984)
  })

  test('mass-fraction ppm is separated from mg/L by solution density', () => {
    assert.throws(() => convertConcentration({
      value: 1000,
      fromUnit: 'ppm',
      toUnit: 'g/L',
    }), /solution density is required/i)

    const result = convertConcentration({
      value: 1000,
      fromUnit: 'ppm',
      toUnit: 'g/L',
      solutionDensity: 1.2,
      densityTemperatureC: 20,
    })
    closeTo(result.convertedValue, 1.2)
  })

  test('ppm to ppb is an exact same-basis scale and needs no density', () => {
    const requirements = getConcentrationConversionRequirements('ppm', 'ppb')
    assert.deepEqual(requirements, {
      molarMass: false,
      soluteDensity: false,
      solutionDensity: false,
      densityTemperature: false,
      equivalents: false,
    })
    closeTo(convertConcentration({
      value: 1000,
      fromUnit: 'ppm',
      toUnit: 'ppb',
    }).convertedValue, 1_000_000)
  })

  test('normality conversion requires explicit equivalents and returns 0.5 M for 1 N H2SO4 factor 2', () => {
    assert.throws(() => convertConcentration({
      value: 1,
      fromUnit: 'N',
      toUnit: 'mol/L',
    }), /equivalents factor is required/i)

    closeTo(convertConcentration({
      value: 1,
      fromUnit: 'N',
      toUnit: 'mol/L',
      equivalents: 2,
    }).convertedValue, 0.5)
  })

  test('even an N-to-N identity conversion requires and records the reaction-specific factor', () => {
    assert.throws(() => convertConcentration({
      value: 1,
      fromUnit: 'N',
      toUnit: 'N',
    }), /equivalents factor is required/i)

    const result = convertConcentration({
      value: 1,
      fromUnit: 'N',
      toUnit: 'N',
      equivalents: 2,
    })
    closeTo(result.convertedValue, 1)
    assert.equal(result.model.equivalents, 2)
  })

  test('fraction inputs and outputs cannot exceed 100%', () => {
    assert.throws(() => convertConcentration({
      value: 101,
      fromUnit: 'pct_vv',
      toUnit: 'g/L',
      soluteDensity: 0.789,
      densityTemperatureC: 20,
    }), /exceeds 100%/i)

    assert.throws(() => convertConcentration({
      value: 2000,
      fromUnit: 'g/L',
      toUnit: 'pct_vv',
      soluteDensity: 0.789,
      densityTemperatureC: 20,
    }), /exceeds 100%/i)
  })
})

describe('mixing model: measured volume or declared approximation', () => {
  const MIXING_SCOPE = {
    soluteIdentity: 'NaCl',
    concentrationUnit: 'mol/L' as const,
    volumeUnit: 'L' as const,
    noReactionOrLoss: true,
  }

  test('measured final volume is used instead of V1 + V2', () => {
    const result = calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0,
      v2: 1,
      volumeBasis: 'measured-final',
      finalVolume: 1.8,
    })
    closeTo(result.finalConc, 1 / 1.8)
    closeTo(result.finalVolume, 1.8)
    assert.equal(result.model.volumeBasis, 'measured-final')
    assert.equal(result.model.volumeUnit, 'L')
    assert.ok(!result.assumptions.some((assumption) => /V1 \+ V2/i.test(assumption)))
  })

  test('additive volume is allowed only as an explicitly signed approximation', () => {
    const result = calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0,
      v2: 1,
      volumeBasis: 'additive-approximation',
    })
    closeTo(result.finalConc, 0.5)
    closeTo(result.finalVolume, 2)
    assert.ok(result.assumptions.some((assumption) => /approximated as V1 \+ V2/i.test(assumption)))
  })

  test('missing measured volume, volume unit, conservation, and unsupported fraction basis are rejected', () => {
    assert.throws(() => calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0,
      v2: 1,
      volumeBasis: 'measured-final',
    }), /measured final volume is required/i)

    assert.throws(() => calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0,
      v2: 1,
      volumeBasis: 'additive-approximation',
      noReactionOrLoss: false,
    }), /explicit confirmation/i)

    assert.throws(() => calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0,
      v2: 1,
      volumeUnit: 'm3' as MixingVolumeUnit,
      volumeBasis: 'additive-approximation',
    }), /explicitly declared as L or mL/i)

    assert.throws(() => calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0,
      v2: 1,
      concentrationUnit: 'pct_ww' as MixingConcentrationUnit,
      volumeBasis: 'additive-approximation',
    }), /volume-based concentration unit/i)
  })

  test('normality mixing requires one signed reaction/equivalence context', () => {
    assert.throws(() => calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0.5,
      v2: 1,
      concentrationUnit: 'N',
      volumeBasis: 'additive-approximation',
    }), /normality reaction\/equivalence context is required/i)

    const result = calculateMixing({
      ...MIXING_SCOPE,
      c1: 1,
      v1: 1,
      c2: 0.5,
      v2: 1,
      concentrationUnit: 'N',
      normalityContext: 'acid-base neutralization (H+ equivalents)',
      volumeBasis: 'additive-approximation',
    })
    closeTo(result.finalConc, 0.75)
    assert.equal(result.model.normalityContext, 'acid-base neutralization (H+ equivalents)')
  })
})

async function runTests() {
  console.log('🧪 Solution Preparation and Concentration Model Tests\n')

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

  console.log('\n' + passed + ' passed, ' + failures.length + ' failed')

  if (failures.length > 0) {
    failures.forEach((name) => console.log('  - ' + name))
    process.exitCode = 1
    return
  }

  console.log('\n✅ All concentration-model tests passed!')
}

runTests().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
