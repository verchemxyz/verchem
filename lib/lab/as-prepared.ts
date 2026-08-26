/**
 * VerChem Lab-QC — as-prepared concentration and uncertainty engine.
 *
 * This module is intentionally pure and deterministic. It models the
 * concentration actually prepared at the bench; it never substitutes a target
 * amount for an observed measurement and never guesses an uncertainty input.
 */

import {
  calculateStockPrep,
  type ConcentrationUnit,
  type StockPrepInput,
} from '@/lib/calculations/solution-prep'
import { expandedUncertainty, relativeUncertainty } from '@/lib/calculations/uncertainty'

export interface EquipmentUncertainty {
  /** Standard uncertainty of the net mass, from a balance certificate/guidance. */
  massStandardG: number | null
  /** Flask tolerance half-width at its calibration temperature. */
  flaskToleranceMl: number | null
  flaskCalibrationTemperatureC: number
  /** Laboratory fill-repeatability standard deviation. */
  fillRepeatabilitySdMl: number | null
  /** Laboratory temperature-variation half-width around calibration temperature. */
  temperatureHalfWidthC: number | null
  /** Solution cubic-expansion coefficient in °C⁻¹. */
  volumeExpansionCoefficientPerC: number | null
  /** CoA assay-tolerance half-width expressed in percent. */
  assayToleranceHalfWidthPercent: number | null
}

export interface ActualMeasurements {
  weighedG: number | null
  measuredMl: number | null
  finalVolumeMl: number
  coaAssayPercent: number
  coaBasis: 'mass' | 'volume'
  temperatureC: number
  equipment: EquipmentUncertainty
}

export interface AsPreparedInput {
  target: StockPrepInput
  /**
   * Unit of `target.targetVolume` AS DECLARED BY THE TEMPLATE. The engine
   * converts to litres before delegating to calculateStockPrep, so a template
   * written in mL can never be silently signed as litres (wide-scan #3).
   */
  targetVolumeUnit: 'mL' | 'L'
  acceptanceRelativePercent: number
  actual: ActualMeasurements
}

export interface UncertaintyTerm {
  source:
    | 'coa_assay'
    | 'mass'
    | 'flask_calibration'
    | 'fill_repeatability'
    | 'temperature_expansion'
  status: 'included' | 'not_included'
  distribution: 'rectangular' | 'triangular' | 'normal' | null
  halfWidthOrSd: number | null
  unit: 'g' | 'mL' | '%' | null
  standardRelative: number | null
  basis: string
}

export interface AsPreparedResult {
  targetAmount: { value: number; unit: 'g' | 'mL' }
  actualAmount: { value: number; unit: 'g' | 'mL' }
  asPrepared: { value: number; unit: ConcentrationUnit }
  deviationPercent: number
  withinAcceptance: boolean
  uncertainty: {
    available: boolean
    combinedRelative: number | null
    standard: number | null
    expandedK2: number | null
    unit: ConcentrationUnit
    coverage: 'k=2, ≈95 % (JCGM 100:2008 §6.3.3)'
    budget: UncertaintyTerm[]
  }
  model: {
    propagation: 'JCGM 100:2008 eq.(12) relative, uncorrelated'
    purityCorrected: true
    buoyancyCorrected: false
    molarMassUncertaintyIncluded: false
  }
  assumptions: string[]
  applicability: string[]
}

const WATER_SOLVENT_NAMES = new Set(['water', 'h2o', 'deionized water', 'di water'])
const SQRT_THREE = Math.sqrt(3)
const SQRT_SIX = Math.sqrt(6)
const WATER_VOLUME_EXPANSION_PER_C = 2.1e-4

function includedTerm(
  source: UncertaintyTerm['source'],
  distribution: Exclude<UncertaintyTerm['distribution'], null>,
  halfWidthOrSd: number,
  unit: Exclude<UncertaintyTerm['unit'], null>,
  standardRelative: number,
  basis: string
): UncertaintyTerm {
  return { source, status: 'included', distribution, halfWidthOrSd, unit, standardRelative, basis }
}

function notIncludedTerm(
  source: UncertaintyTerm['source'],
  basis: string
): UncertaintyTerm {
  return {
    source,
    status: 'not_included',
    distribution: null,
    halfWidthOrSd: null,
    unit: null,
    standardRelative: null,
    basis,
  }
}

function assertFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`)
  }
}

function assertFiniteNonNegative(value: number | null, field: string): void {
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`${field} must be a non-negative finite number when stated.`)
  }
}

function isWaterSolvent(solvent: string): boolean {
  return WATER_SOLVENT_NAMES.has(solvent.trim().toLocaleLowerCase('en'))
}

function requireFinitePositive(value: number | null, field: string, unit: string): number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} is required and must be a positive finite number in ${unit}.`)
  }
  return value
}

function calculateActualConcentration(
  target: StockPrepInput,
  actual: ActualMeasurements,
  measureBy: 'mass' | 'volume'
): number {
  const finalVolumeL = actual.finalVolumeMl / 1000
  const purityFraction = actual.coaAssayPercent / 100

  if (measureBy === 'volume') {
    const measuredMl = requireFinitePositive(actual.measuredMl, 'actual.measuredMl', 'mL')
    return (measuredMl * purityFraction / actual.finalVolumeMl) * 100
  }

  const weighedG = requireFinitePositive(actual.weighedG, 'actual.weighedG', 'g')
  const effectiveMassG = weighedG * purityFraction
  let concentration: number

  switch (target.unit) {
    case 'mol/L':
      concentration = (effectiveMassG / target.molarMass!) / finalVolumeL
      break
    case 'mmol/L':
      concentration = ((effectiveMassG / target.molarMass!) / finalVolumeL) * 1000
      break
    case 'N':
      concentration = ((effectiveMassG / target.molarMass!) * target.equivalentsFactor!) / finalVolumeL
      break
    case 'g/L':
      concentration = effectiveMassG / finalVolumeL
      break
    case 'mg/L':
      concentration = (effectiveMassG / finalVolumeL) * 1000
      break
    case 'ug/L':
      concentration = (effectiveMassG / finalVolumeL) * 1e6
      break
    case 'pct_wv':
      concentration = (effectiveMassG / actual.finalVolumeMl) * 100
      break
    case 'pct_ww':
      concentration = (effectiveMassG / (actual.finalVolumeMl * target.solutionDensity!)) * 100
      break
    case 'ppm':
      concentration = (effectiveMassG / (actual.finalVolumeMl * target.solutionDensity!)) * 1e6
      break
    case 'ppb':
      concentration = (effectiveMassG / (actual.finalVolumeMl * target.solutionDensity!)) * 1e9
      break
    case 'pct_vv':
      throw new Error('Internal path mismatch: pct_vv must use volume measurement.')
  }

  if (!Number.isFinite(concentration) || concentration <= 0) {
    throw new Error('As-prepared concentration is outside the positive finite representable range.')
  }
  return concentration
}

/**
 * Calculate the concentration and declared uncertainty budget for a solution as
 * actually prepared. Missing required uncertainty inputs withhold U, but do not
 * discard the independently useful as-prepared concentration.
 */
export function calculateAsPrepared(input: AsPreparedInput): AsPreparedResult {
  // Keep the established target calculation as the first delegated operation so
  // its chemistry/unit guards are preserved unchanged.
  if (input.targetVolumeUnit !== 'mL' && input.targetVolumeUnit !== 'L') {
    throw new Error('targetVolumeUnit must be explicitly "mL" or "L".')
  }
  if (!Number.isFinite(input.target.targetVolume) || input.target.targetVolume <= 0) {
    throw new Error(`target.targetVolume must be a positive finite number in ${input.targetVolumeUnit}.`)
  }
  // Canonicalise the target to litres ONCE; every downstream number (target
  // amount, deviation, assumptions) is derived from this converted target.
  const target: StockPrepInput = input.targetVolumeUnit === 'mL'
    ? { ...input.target, targetVolume: input.target.targetVolume / 1000 }
    : input.target
  const targetResult = calculateStockPrep(target)
  const { actual } = input
  const { equipment } = actual
  if (!Number.isFinite(input.acceptanceRelativePercent) || input.acceptanceRelativePercent <= 0) {
    throw new Error('acceptanceRelativePercent must be a positive finite percentage.')
  }
  if (!Number.isFinite(actual.finalVolumeMl) || actual.finalVolumeMl <= 0) {
    throw new Error('actual.finalVolumeMl must be a positive finite number in mL.')
  }
  if (!Number.isFinite(actual.coaAssayPercent) || actual.coaAssayPercent <= 0 || actual.coaAssayPercent > 100) {
    throw new Error('actual.coaAssayPercent must be a finite percentage in the range (0, 100].')
  }
  if (actual.coaBasis !== target.reagentPurityBasis) {
    throw new Error(`actual.coaBasis (${actual.coaBasis}) must match target.reagentPurityBasis (${target.reagentPurityBasis}).`)
  }
  if (!Number.isFinite(actual.temperatureC) || actual.temperatureC <= -273.15) {
    throw new Error('actual.temperatureC must be a finite value above absolute zero.')
  }
  assertFinite(equipment.flaskCalibrationTemperatureC, 'actual.equipment.flaskCalibrationTemperatureC')
  assertFiniteNonNegative(equipment.massStandardG, 'actual.equipment.massStandardG')
  assertFiniteNonNegative(equipment.flaskToleranceMl, 'actual.equipment.flaskToleranceMl')
  assertFiniteNonNegative(equipment.fillRepeatabilitySdMl, 'actual.equipment.fillRepeatabilitySdMl')
  assertFiniteNonNegative(equipment.temperatureHalfWidthC, 'actual.equipment.temperatureHalfWidthC')
  assertFiniteNonNegative(equipment.volumeExpansionCoefficientPerC, 'actual.equipment.volumeExpansionCoefficientPerC')
  assertFiniteNonNegative(equipment.assayToleranceHalfWidthPercent, 'actual.equipment.assayToleranceHalfWidthPercent')

  const isMassPath = targetResult.measureBy === 'mass'
  if (isMassPath) {
    if (actual.measuredMl !== null) {
      throw new Error(`actual.measuredMl must be null because ${target.unit} is measured by mass, not volume.`)
    }
    requireFinitePositive(actual.weighedG, 'actual.weighedG', 'g')
  } else {
    if (actual.weighedG !== null) {
      throw new Error('actual.weighedG must be null because pct_vv is measured by volume, not mass.')
    }
    requireFinitePositive(actual.measuredMl, 'actual.measuredMl', 'mL')
  }

  const actualAmount = isMassPath
    ? { value: actual.weighedG!, unit: 'g' as const }
    : { value: actual.measuredMl!, unit: 'mL' as const }
  const asPreparedValue = calculateActualConcentration(input.target, actual, targetResult.measureBy)
  const deviationPercent = ((asPreparedValue - target.targetConc) / target.targetConc) * 100
  if (!Number.isFinite(deviationPercent)) {
    throw new Error('Deviation from target is outside the finite representable range.')
  }

  const purityFraction = actual.coaAssayPercent / 100
  const assayTerm = equipment.assayToleranceHalfWidthPercent === null
    ? notIncludedTerm(
      'coa_assay',
      'CoA assay tolerance was not declared; required for expanded uncertainty (QUAM:2012 A1).'
    )
    : includedTerm(
      'coa_assay',
      'rectangular',
      equipment.assayToleranceHalfWidthPercent,
      '%',
      relativeUncertainty(
        purityFraction,
        (equipment.assayToleranceHalfWidthPercent / 100) / SQRT_THREE
      ),
      `QUAM:2012 A1, rectangular CoA tolerance: ${equipment.assayToleranceHalfWidthPercent}%/√3 divided by assay fraction ${purityFraction}.`
    )

  const massTerm = !isMassPath
    ? notIncludedTerm(
      'mass',
      'v1 does not model pipette/burette delivery uncertainty for %v/v preparations.'
    )
    : equipment.massStandardG === null
      ? notIncludedTerm(
        'mass',
        'Balance standard uncertainty was not declared; required for expanded uncertainty (QUAM:2012 A1).'
      )
      : includedTerm(
        'mass',
        'normal',
        equipment.massStandardG,
        'g',
        relativeUncertainty(actual.weighedG!, equipment.massStandardG),
        `QUAM:2012 A1 balance standard uncertainty from certificate/manufacturer guidance: ${equipment.massStandardG} g divided by net mass ${actual.weighedG} g.`
      )

  const flaskTerm = equipment.flaskToleranceMl === null
    ? notIncludedTerm(
      'flask_calibration',
      'Flask calibration tolerance was not declared; required for expanded uncertainty (QUAM:2012 A1 §A1.4(i)).'
    )
    : includedTerm(
      'flask_calibration',
      'triangular',
      equipment.flaskToleranceMl,
      'mL',
      relativeUncertainty(actual.finalVolumeMl, equipment.flaskToleranceMl / SQRT_SIX),
      `QUAM:2012 A1 §A1.4(i), triangular flask tolerance: ${equipment.flaskToleranceMl} mL/√6 divided by final volume ${actual.finalVolumeMl} mL.`
    )

  const fillTerm = equipment.fillRepeatabilitySdMl === null
    ? notIncludedTerm(
      'fill_repeatability',
      'Laboratory fill-repeatability standard deviation was not declared (QUAM:2012 A1 §A1.4(ii)).'
    )
    : includedTerm(
      'fill_repeatability',
      'normal',
      equipment.fillRepeatabilitySdMl,
      'mL',
      relativeUncertainty(actual.finalVolumeMl, equipment.fillRepeatabilitySdMl),
      `QUAM:2012 A1 §A1.4(ii), fill-repeatability standard deviation used directly: ${equipment.fillRepeatabilitySdMl} mL divided by final volume ${actual.finalVolumeMl} mL.`
    )

  const normalizedSolvent = target.solvent.trim()
  const expansionCoefficient = equipment.volumeExpansionCoefficientPerC ??
    (isWaterSolvent(target.solvent) ? WATER_VOLUME_EXPANSION_PER_C : null)
  const temperatureTerm = equipment.temperatureHalfWidthC === null
    ? notIncludedTerm(
      'temperature_expansion',
      'Laboratory temperature variation half-width was not declared (QUAM:2012 A1 §A1.4(iii)).'
    )
    : expansionCoefficient === null
      ? notIncludedTerm(
        'temperature_expansion',
        `expansion coefficient not declared for solvent ${normalizedSolvent}`
      )
      : (() => {
        const volumeHalfWidthMl = actual.finalVolumeMl * equipment.temperatureHalfWidthC * expansionCoefficient
        return includedTerm(
          'temperature_expansion',
          'rectangular',
          volumeHalfWidthMl,
          'mL',
          relativeUncertainty(actual.finalVolumeMl, volumeHalfWidthMl / SQRT_THREE),
          `QUAM:2012 A1 §A1.4(iii), rectangular thermal expansion: ${actual.finalVolumeMl} mL × ${equipment.temperatureHalfWidthC} °C × ${expansionCoefficient} °C⁻¹ = ${volumeHalfWidthMl} mL; divide by √3.`
        )
      })()

  const budget = [assayTerm, massTerm, flaskTerm, fillTerm, temperatureTerm]
  const requiredTerms = [assayTerm, massTerm, flaskTerm]
  const uncertaintyAvailable = requiredTerms.every((term) => term.status === 'included')
  const combinedRelative = uncertaintyAvailable
    ? Math.sqrt(budget.reduce((sum, term) => sum + Math.pow(term.standardRelative ?? 0, 2), 0))
    : null
  const standard = combinedRelative === null ? null : combinedRelative * asPreparedValue
  const expandedK2 = standard === null ? null : expandedUncertainty(standard)

  if ((combinedRelative !== null && !Number.isFinite(combinedRelative)) ||
      (standard !== null && !Number.isFinite(standard)) ||
      (expandedK2 !== null && !Number.isFinite(expandedK2))) {
    throw new Error('Uncertainty calculation is outside the finite representable range.')
  }

  return {
    targetAmount: { value: targetResult.amount, unit: targetResult.amountUnit },
    actualAmount,
    asPrepared: { value: asPreparedValue, unit: target.unit },
    deviationPercent,
    withinAcceptance: Math.abs(deviationPercent) <= input.acceptanceRelativePercent,
    uncertainty: {
      available: uncertaintyAvailable,
      combinedRelative,
      standard,
      expandedK2,
      unit: target.unit,
      coverage: 'k=2, ≈95 % (JCGM 100:2008 §6.3.3)',
      budget,
    },
    model: {
      propagation: 'JCGM 100:2008 eq.(12) relative, uncorrelated',
      purityCorrected: true,
      buoyancyCorrected: false,
      molarMassUncertaintyIncluded: false,
    },
    assumptions: [
      ...targetResult.assumptions,
      `Target volume declared as ${input.target.targetVolume} ${input.targetVolumeUnit} (${target.targetVolume} L used for all calculations).`,
      `Actual concentration uses the recorded ${isMassPath ? 'net mass' : 'delivered solute volume'} and CoA assay ${actual.coaAssayPercent}% on its declared ${actual.coaBasis} basis.`,
      'Input uncertainty components are treated as uncorrelated and propagated by the relative product/quotient model (JCGM 100:2008 §5.1.6 eq.(12)).',
      `No systematic volume correction is applied for the ${Math.abs(actual.temperatureC - equipment.flaskCalibrationTemperatureC)} °C offset between preparation temperature (${actual.temperatureC} °C) and flask calibration temperature (${equipment.flaskCalibrationTemperatureC} °C); only the declared laboratory temperature variation enters the uncertainty budget.`,
    ],
    applicability: [
      'Expanded uncertainty is reported only when CoA assay, balance mass, and flask calibration terms are declared; missing optional terms remain explicitly listed in the budget.',
      'This v1 model does not include buoyancy correction or molar-mass uncertainty.',
      ...(isMassPath
        ? []
        : ['For %v/v, v1 does not model pipette/burette delivery uncertainty, so expanded uncertainty is unavailable.']),
    ],
  }
}
