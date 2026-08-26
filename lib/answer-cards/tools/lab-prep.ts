/** VerChem Verified Answer Cards — Lab-QC as-prepared adapter. */

import type { AsPreparedInput, EquipmentUncertainty } from '@/lib/lab/as-prepared'
import { calculateAsPrepared } from '@/lib/lab/as-prepared'
import type { StockPrepInput } from '@/lib/calculations/solution-prep'
import type { ToolResult, VerifiedTool } from '../types'
import { finalizeResult, isPlainObject, readFiniteNumber } from './_validate'

const CITATION = 'EURACHEM/CITAC QUAM:2012, Example A1 (Preparation of a Calibration Standard); JCGM 100:2008 §§4–6 (GUM)'

const CONCENTRATION_UNITS = new Set([
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L',
  'pct_wv', 'pct_ww', 'pct_vv', 'N', 'ppm', 'ppb',
])

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string.`)
  const normalized = value.trim()
  if (normalized.length === 0 || normalized.length > 160 || /[\x00-\x1F\x7F]/.test(normalized)) {
    throw new Error(`${field} must be non-empty, at most 160 characters, and contain no control characters.`)
  }
  return normalized
}

function readRequiredFinite(value: unknown, field: string): number {
  const parsed = readFiniteNumber(value)
  if (parsed === undefined) throw new Error(`${field} must be a finite number.`)
  return parsed
}

function readOptionalFinite(
  raw: Record<string, unknown>,
  key: string,
  field: string
): number | undefined {
  if (!(key in raw)) return undefined
  return readRequiredFinite(raw[key], field)
}

function readNullableFinite(
  raw: Record<string, unknown>,
  key: string,
  field: string
): number | null {
  const value = raw[key]
  if (value === null) return null
  return readRequiredFinite(value, field)
}

function readObject(value: unknown, field: string): Record<string, unknown> {
  if (!isPlainObject(value)) throw new Error(`${field} must be an object.`)
  return value
}

function assertOnlyKeys(raw: Record<string, unknown>, allowed: readonly string[], field: string): void {
  const allowedKeys = new Set(allowed)
  const unknownKeys = Object.keys(raw).filter((key) => !allowedKeys.has(key))
  if (unknownKeys.length > 0) {
    throw new Error(`${field} contains unsupported field${unknownKeys.length === 1 ? '' : 's'}: ${unknownKeys.join(', ')}.`)
  }
}

function assertRequiredKeys(raw: Record<string, unknown>, required: readonly string[], field: string): void {
  const missing = required.filter((key) => !(key in raw))
  if (missing.length > 0) {
    throw new Error(`${field} is missing required field${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.`)
  }
}

function parseEquipment(raw: Record<string, unknown>): EquipmentUncertainty {
  const keys = [
    'mass_standard_g',
    'flask_tolerance_ml',
    'flask_calibration_temperature_C',
    'fill_repeatability_sd_ml',
    'temperature_half_width_C',
    'volume_expansion_coefficient_per_C',
    'assay_tolerance_half_width_percent',
  ] as const
  assertOnlyKeys(raw, keys, 'actual.equipment')
  assertRequiredKeys(raw, keys, 'actual.equipment')
  return {
    massStandardG: readNullableFinite(raw, 'mass_standard_g', 'actual.equipment.mass_standard_g'),
    flaskToleranceMl: readNullableFinite(raw, 'flask_tolerance_ml', 'actual.equipment.flask_tolerance_ml'),
    flaskCalibrationTemperatureC: readRequiredFinite(
      raw.flask_calibration_temperature_C,
      'actual.equipment.flask_calibration_temperature_C'
    ),
    fillRepeatabilitySdMl: readNullableFinite(raw, 'fill_repeatability_sd_ml', 'actual.equipment.fill_repeatability_sd_ml'),
    temperatureHalfWidthC: readNullableFinite(raw, 'temperature_half_width_C', 'actual.equipment.temperature_half_width_C'),
    volumeExpansionCoefficientPerC: readNullableFinite(
      raw,
      'volume_expansion_coefficient_per_C',
      'actual.equipment.volume_expansion_coefficient_per_C'
    ),
    assayToleranceHalfWidthPercent: readNullableFinite(
      raw,
      'assay_tolerance_half_width_percent',
      'actual.equipment.assay_tolerance_half_width_percent'
    ),
  }
}

function parseTarget(raw: Record<string, unknown>): StockPrepInput {
  const allowed = [
    'target_conc',
    'target_volume',
    'molar_mass',
    'unit',
    'solution_density',
    'equivalents_factor',
    'reagent_purity_percent',
    'reagent_purity_basis',
    'reagent_form',
    'solvent',
    'preparation_temperature_C',
  ] as const
  const required = [
    'target_conc',
    'target_volume',
    'unit',
    'reagent_purity_percent',
    'reagent_purity_basis',
    'reagent_form',
    'solvent',
    'preparation_temperature_C',
  ] as const
  assertOnlyKeys(raw, allowed, 'target')
  assertRequiredKeys(raw, required, 'target')

  const unit = readRequiredString(raw.unit, 'target.unit')
  if (!CONCENTRATION_UNITS.has(unit)) throw new Error(`target.unit is unsupported: "${unit}".`)
  const reagentPurityBasis = readRequiredString(raw.reagent_purity_basis, 'target.reagent_purity_basis')
  if (reagentPurityBasis !== 'mass' && reagentPurityBasis !== 'volume') {
    throw new Error('target.reagent_purity_basis must be "mass" or "volume".')
  }

  return {
    targetConc: readRequiredFinite(raw.target_conc, 'target.target_conc'),
    targetVolume: readRequiredFinite(raw.target_volume, 'target.target_volume'),
    molarMass: readOptionalFinite(raw, 'molar_mass', 'target.molar_mass'),
    unit: unit as StockPrepInput['unit'],
    solutionDensity: readOptionalFinite(raw, 'solution_density', 'target.solution_density'),
    equivalentsFactor: readOptionalFinite(raw, 'equivalents_factor', 'target.equivalents_factor'),
    reagentPurityPercent: readRequiredFinite(raw.reagent_purity_percent, 'target.reagent_purity_percent'),
    reagentPurityBasis,
    reagentForm: readRequiredString(raw.reagent_form, 'target.reagent_form'),
    solvent: readRequiredString(raw.solvent, 'target.solvent'),
    preparationTemperatureC: readRequiredFinite(raw.preparation_temperature_C, 'target.preparation_temperature_C'),
  }
}

function parseInput(input: Record<string, unknown>): AsPreparedInput {
  const rootKeys = ['target', 'target_volume_unit', 'acceptance_relative_percent', 'actual'] as const
  assertOnlyKeys(input, rootKeys, 'input')
  assertRequiredKeys(input, rootKeys, 'input')

  const target = parseTarget(readObject(input.target, 'target'))
  const targetVolumeUnit = readRequiredString(input.target_volume_unit, 'target_volume_unit')
  if (targetVolumeUnit !== 'mL' && targetVolumeUnit !== 'L') {
    throw new Error('target_volume_unit must be "mL" or "L".')
  }

  const actual = readObject(input.actual, 'actual')
  const actualKeys = [
    'weighed_g',
    'measured_ml',
    'final_volume_ml',
    'coa_assay_percent',
    'coa_basis',
    'temperature_C',
    'equipment',
  ] as const
  assertOnlyKeys(actual, actualKeys, 'actual')
  assertRequiredKeys(actual, actualKeys, 'actual')
  const coaBasis = readRequiredString(actual.coa_basis, 'actual.coa_basis')
  if (coaBasis !== 'mass' && coaBasis !== 'volume') {
    throw new Error('actual.coa_basis must be "mass" or "volume".')
  }

  return {
    target,
    targetVolumeUnit,
    acceptanceRelativePercent: readRequiredFinite(input.acceptance_relative_percent, 'acceptance_relative_percent'),
    actual: {
      weighedG: readNullableFinite(actual, 'weighed_g', 'actual.weighed_g'),
      measuredMl: readNullableFinite(actual, 'measured_ml', 'actual.measured_ml'),
      finalVolumeMl: readRequiredFinite(actual.final_volume_ml, 'actual.final_volume_ml'),
      coaAssayPercent: readRequiredFinite(actual.coa_assay_percent, 'actual.coa_assay_percent'),
      coaBasis,
      temperatureC: readRequiredFinite(actual.temperature_C, 'actual.temperature_C'),
      equipment: parseEquipment(readObject(actual.equipment, 'actual.equipment')),
    },
  }
}

const calculate_as_prepared: VerifiedTool = {
  name: 'calculate_as_prepared',
  description: 'Calculate concentration actually prepared from an approved stock target, actual bench measurements, CoA assay, and declared uncertainty inputs. Missing required uncertainty terms withhold expanded uncertainty without hiding the as-prepared result.',
  input_schema: {
    type: 'object',
    properties: {
      target: {
        type: 'object',
        description: 'Stock-preparation target using snake_case fields matching calculate_stock_prep.',
        properties: {
          target_conc: { type: 'number' }, target_volume: { type: 'number' }, molar_mass: { type: 'number' },
          unit: { type: 'string' }, solution_density: { type: 'number' }, equivalents_factor: { type: 'number' },
          reagent_purity_percent: { type: 'number' }, reagent_purity_basis: { type: 'string', enum: ['mass', 'volume'] },
          reagent_form: { type: 'string' }, solvent: { type: 'string' }, preparation_temperature_C: { type: 'number' },
        },
      },
      target_volume_unit: { type: 'string', enum: ['mL', 'L'], description: 'Explicit template display unit; StockPrepInput target_volume remains litres.' },
      acceptance_relative_percent: { type: 'number', description: 'Acceptance limit as an absolute relative percent, for example 0.5 for ±0.5%.' },
      actual: {
        type: 'object',
        description: 'Actual measurement fields in snake_case, including an equipment uncertainty object.',
        properties: {
          weighed_g: { type: 'number' }, measured_ml: { type: 'number' }, final_volume_ml: { type: 'number' },
          coa_assay_percent: { type: 'number' }, coa_basis: { type: 'string', enum: ['mass', 'volume'] },
          temperature_C: { type: 'number' }, equipment: { type: 'object' },
        },
      },
    },
    required: ['target', 'target_volume_unit', 'acceptance_relative_percent', 'actual'],
  },
  citation: CITATION,
  engine: 'as-prepared',
  execute: (input) => {
    try {
      const result = calculateAsPrepared(parseInput(input))
      return finalizeResult({ ...result })
    } catch (error) {
      return err(error instanceof Error ? error.message : 'As-prepared calculation failed.')
    }
  },
}

export const labPrepTools: VerifiedTool[] = [calculate_as_prepared]
