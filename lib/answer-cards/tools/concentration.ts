/**
 * VerChem Verified Answer Cards — Solutions / Concentration Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in:
 *   lib/calculations/solutions.ts
 *   lib/calculations/solution-prep.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult, readOptionalFiniteNumber } from './_validate'
import {
  calculateMolarity,
  calculateMolality,
  calculateMassPercent,
  calculatePPM,
  calculateOsmoticPressure,
  calculateBoilingPointElevation,
  calculateFreezingPointDepression,
  WATER_KB,
  WATER_KF,
} from '@/lib/calculations/solutions'
import {
  calculateStockPrep,
  convertConcentration,
  calculateMixing,
  getConcentrationConversionRequirements,
  isMixingConcentrationUnit,
  type ConcentrationUnit,
  type MixingVolumeBasis,
  type MixingVolumeUnit,
} from '@/lib/calculations/solution-prep'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 13 (Solutions); Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 5'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

const VALID_CONCENTRATION_UNITS = new Set([
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L',
  'pct_wv', 'pct_ww', 'pct_vv', 'N', 'ppm', 'ppb',
])

// Signed stock preparation reports grams, so %v/v remains outside this adapter:
// the engine correctly returns mL for that unit. Every assumption-bearing mass
// unit is allowed only when its required physical inputs are present and signed.
const STOCK_PREP_UNITS = new Set([
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L', 'ppm', 'ppb', 'pct_wv', 'pct_ww', 'N',
])

function needsMolarMass(unit: string): boolean {
  return unit === 'mol/L' || unit === 'mmol/L' || unit === 'N'
}

function readRequiredText(value: unknown, _label: string): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  if (normalized.length === 0 || normalized.length > 160 || /[\x00-\x1F\x7F]/.test(normalized)) {
    return undefined
  }
  return normalized
}

function hasInvalidOptionalNumber(
  input: Record<string, unknown>,
  key: string,
  parsed: number | undefined
): boolean {
  return input[key] !== undefined && parsed === undefined
}

const calculate_molarity: VerifiedTool = {
  name: 'calculate_molarity',
  description: 'Calculate molarity (M = mol/L). Use when the user asks for molar concentration. Provide moles and volume, or mass, molar mass, and volume.',
  input_schema: {
    type: 'object',
    properties: {
      moles: { type: 'number', description: 'Moles of solute (mol)' },
      volume_L: { type: 'number', description: 'Volume of solution in liters (L)' },
      mass_grams: { type: 'number', description: 'Mass of solute in grams (g)' },
      molar_mass: { type: 'number', description: 'Molar mass of solute in g/mol' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'molarity',
  execute: (input) => {
    const moles = readFiniteNumber(input.moles)
    const volumeL = readFiniteNumber(input.volume_L)
    const massGrams = readFiniteNumber(input.mass_grams)
    const molarMass = readFiniteNumber(input.molar_mass)

    // Reject ambiguous input: exactly one path (moles OR mass) must be provided.
    if (moles !== undefined && (massGrams !== undefined || molarMass !== undefined)) {
      return err('Provide either moles or (mass_grams + molar_mass), not both')
    }

    try {
      let result: number
      if (moles !== undefined && volumeL !== undefined) {
        if (moles < 0) return err('moles must be a non-negative finite number')
        if (volumeL <= 0) return err('volume_L must be a positive finite number')
        result = calculateMolarity(moles, volumeL)
      } else if (massGrams !== undefined && molarMass !== undefined && volumeL !== undefined) {
        if (massGrams < 0) return err('mass_grams must be a non-negative finite number')
        if (molarMass <= 0) return err('molar_mass must be a positive finite number')
        if (volumeL <= 0) return err('volume_L must be a positive finite number')
        result = calculateMolarity(undefined, volumeL, massGrams, molarMass)
      } else {
        return err('Provide either (moles + volume_L) or (mass_grams + molar_mass + volume_L)')
      }
      return finalizeResult({ molarity: result, unit: 'M' })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Molarity calculation failed')
    }
  },
}

const calculate_molality: VerifiedTool = {
  name: 'calculate_molality',
  description: 'Calculate molality (m = mol/kg solvent). Use when the user asks for molal concentration.',
  input_schema: {
    type: 'object',
    properties: {
      moles: { type: 'number', description: 'Moles of solute (mol)' },
      solvent_mass_kg: { type: 'number', description: 'Mass of solvent in kilograms (kg)' },
    },
    required: ['moles', 'solvent_mass_kg'],
  },
  citation: CITATION,
  engine: 'molality',
  execute: (input) => {
    const moles = readFiniteNumber(input.moles)
    const solventMassKg = readFiniteNumber(input.solvent_mass_kg)
    if (moles === undefined || moles < 0) return err('moles must be a non-negative finite number')
    if (solventMassKg === undefined || solventMassKg <= 0) return err('solvent_mass_kg must be a positive finite number')
    try {
      const result = calculateMolality(moles, solventMassKg)
      return finalizeResult({ molality: result, unit: 'm' })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Molality calculation failed')
    }
  },
}

const calculate_mass_percent: VerifiedTool = {
  name: 'calculate_mass_percent',
  description: 'Calculate mass percent of a solute in a solution. Use when the user asks for % w/w or mass percentage.',
  input_schema: {
    type: 'object',
    properties: {
      solute_mass: { type: 'number', description: 'Mass of solute (g)' },
      solution_mass: { type: 'number', description: 'Total mass of solution (g)' },
    },
    required: ['solute_mass', 'solution_mass'],
  },
  citation: CITATION,
  engine: 'mass-percent',
  execute: (input) => {
    const soluteMass = readFiniteNumber(input.solute_mass)
    const solutionMass = readFiniteNumber(input.solution_mass)
    if (soluteMass === undefined || soluteMass < 0) return err('solute_mass must be a non-negative finite number')
    if (solutionMass === undefined || solutionMass <= 0) return err('solution_mass must be a positive finite number')
    if (soluteMass > solutionMass) {
      return err('solute_mass cannot exceed solution_mass')
    }
    try {
      const result = calculateMassPercent(soluteMass, solutionMass)
      return finalizeResult({ mass_percent: result })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Mass percent calculation failed')
    }
  },
}

const calculate_ppm: VerifiedTool = {
  name: 'calculate_ppm',
  description: 'Calculate exact mass-fraction ppm from solute mass in mg and total solution mass in kg (1 ppm = 1 mg/kg). Do not use a volume denominator unless it has first been converted to solution mass with measured density.',
  input_schema: {
    type: 'object',
    properties: {
      solute_mass_mg: { type: 'number', description: 'Mass of solute in milligrams (mg)' },
      solution_mass_kg: { type: 'number', description: 'Total mass of solution in kilograms (kg)' },
    },
    required: ['solute_mass_mg', 'solution_mass_kg'],
  },
  citation: CITATION,
  engine: 'ppm',
  execute: (input) => {
    const soluteMass = readFiniteNumber(input.solute_mass_mg)
    const solutionMass = readFiniteNumber(input.solution_mass_kg)
    if (soluteMass === undefined || soluteMass < 0) return err('solute_mass_mg must be a non-negative finite number')
    if (solutionMass === undefined || solutionMass <= 0) return err('solution_mass_kg must be a positive finite number')
    try {
      const result = calculatePPM(soluteMass, solutionMass)
      return finalizeResult({
        ppm: result,
        basis: 'mass fraction (mg solute per kg solution)',
        assumptions: [
          'ppm is interpreted as a mass fraction scaled by 10⁶ (1 mg/kg); this result is valid only when both numerator and denominator are masses (IUPAC Gold Book, DOI 10.1351/goldbook, “parts per million”).',
        ],
        model: {
          basis: 'mass-fraction',
          scale: '1 ppm = 1 mg/kg',
        },
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'PPM calculation failed')
    }
  },
}

const calculate_osmotic_pressure: VerifiedTool = {
  name: 'calculate_osmotic_pressure',
  description: 'Calculate osmotic pressure using the van\'t Hoff equation (π = iMRT). Use when the user asks for osmotic pressure of a solution.',
  input_schema: {
    type: 'object',
    properties: {
      molarity: { type: 'number', description: 'Molar concentration (M)' },
      temperature_K: { type: 'number', description: 'Temperature in Kelvin (K)' },
      vant_hoff_factor: { type: 'number', description: 'van\'t Hoff factor (i) — default 1' },
    },
    required: ['molarity', 'temperature_K'],
  },
  citation: CITATION,
  engine: 'osmotic-pressure',
  execute: (input) => {
    const molarity = readFiniteNumber(input.molarity)
    const temperature = readFiniteNumber(input.temperature_K)
    const vantHoff = readOptionalFiniteNumber(input, 'vant_hoff_factor', 1)
    if (molarity === undefined || molarity <= 0) return err('molarity must be a positive finite number')
    if (temperature === undefined || temperature <= 0) return err('temperature_K must be a positive finite number')
    if (vantHoff === undefined) return err('vant_hoff_factor must be a finite number if provided')
    if (vantHoff < 1) return err('vant_hoff_factor must be at least 1')
    try {
      const result = calculateOsmoticPressure(molarity, temperature, vantHoff)
      return finalizeResult({ osmotic_pressure_atm: result, temperature_K: temperature, vant_hoff_factor: vantHoff })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Osmotic pressure calculation failed')
    }
  },
}

const calculate_boiling_point_elevation: VerifiedTool = {
  name: 'calculate_boiling_point_elevation',
  description: 'Calculate boiling point elevation (ΔTb = i·Kb·m). Use when the user asks how much a solute raises the boiling point. Defaults to water if Kb not provided.',
  input_schema: {
    type: 'object',
    properties: {
      molality: { type: 'number', description: 'Molality of solution (m)' },
      Kb: { type: 'number', description: 'Boiling point elevation constant (°C·kg/mol). Default: 0.512 for water' },
      vant_hoff_factor: { type: 'number', description: 'van\'t Hoff factor (i) — default 1' },
    },
    required: ['molality'],
  },
  citation: CITATION,
  engine: 'boiling-point-elevation',
  execute: (input) => {
    const molality = readFiniteNumber(input.molality)
    const Kb = readOptionalFiniteNumber(input, 'Kb', WATER_KB)
    const vantHoff = readOptionalFiniteNumber(input, 'vant_hoff_factor', 1)
    if (molality === undefined || molality < 0) return err('molality must be a non-negative finite number')
    if (Kb === undefined) return err('Kb must be a finite number if provided')
    if (Kb <= 0) return err('Kb must be a positive finite number')
    if (vantHoff === undefined) return err('vant_hoff_factor must be a finite number if provided')
    if (vantHoff < 1) return err('vant_hoff_factor must be at least 1')
    try {
      const result = calculateBoilingPointElevation(molality, Kb, vantHoff)
      return finalizeResult({ delta_tb_C: result, Kb, vant_hoff_factor: vantHoff })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Boiling point elevation calculation failed')
    }
  },
}

const calculate_freezing_point_depression: VerifiedTool = {
  name: 'calculate_freezing_point_depression',
  description: 'Calculate freezing point depression (ΔTf = i·Kf·m). Use when the user asks how much a solute lowers the freezing point. Defaults to water if Kf not provided.',
  input_schema: {
    type: 'object',
    properties: {
      molality: { type: 'number', description: 'Molality of solution (m)' },
      Kf: { type: 'number', description: 'Freezing point depression constant (°C·kg/mol). Default: 1.86 for water' },
      vant_hoff_factor: { type: 'number', description: 'van\'t Hoff factor (i) — default 1' },
    },
    required: ['molality'],
  },
  citation: CITATION,
  engine: 'freezing-point-depression',
  execute: (input) => {
    const molality = readFiniteNumber(input.molality)
    const Kf = readOptionalFiniteNumber(input, 'Kf', WATER_KF)
    const vantHoff = readOptionalFiniteNumber(input, 'vant_hoff_factor', 1)
    if (molality === undefined || molality < 0) return err('molality must be a non-negative finite number')
    if (Kf === undefined) return err('Kf must be a finite number if provided')
    if (Kf <= 0) return err('Kf must be a positive finite number')
    if (vantHoff === undefined) return err('vant_hoff_factor must be a finite number if provided')
    if (vantHoff < 1) return err('vant_hoff_factor must be at least 1')
    try {
      const result = calculateFreezingPointDepression(molality, Kf, vantHoff)
      return finalizeResult({ delta_tf_C: result, Kf, vant_hoff_factor: vantHoff })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Freezing point depression calculation failed')
    }
  },
}

const calculate_stock_prep: VerifiedTool = {
  name: 'calculate_stock_prep',
  description: 'Calculate a purity-corrected reagent mass for stock preparation under an explicit reagent-form, solvent, temperature, and concentration-basis model. This is a material balance, not a substance-specific safety SOP.',
  input_schema: {
    type: 'object',
    properties: {
      target_conc: { type: 'number', description: 'Target concentration (value depends on unit)' },
      target_volume: { type: 'number', description: 'Target volume in liters (L)' },
      molar_mass: { type: 'number', description: 'Molar mass in g/mol of the exact as-weighed reagent form, including hydrate/solvate; required for mol/L, mmol/L, and N' },
      unit: { type: 'string', description: 'Mass-output concentration unit: mol/L, mmol/L, g/L, mg/L, ug/L, pct_wv, pct_ww, N, ppm, ppb. pct_vv is intentionally unsupported because its preparation output is a volume, not a mass.' },
      solution_density: { type: 'number', description: 'Solution density in g/mL at preparation_temperature_C; required for pct_ww and mass-fraction ppm/ppb' },
      equivalents_factor: { type: 'number', description: 'Equivalents per mole for the stated normality context; required for N' },
      reagent_purity_percent: { type: 'number', description: 'Certificate-of-analysis assay/purity percent' },
      reagent_purity_basis: { type: 'string', enum: ['mass'], description: 'Assay basis. Signed mass-preparation units require mass basis.' },
      reagent_form: { type: 'string', description: 'Exact as-weighed reagent identity/form, e.g. CuSO4·5H2O' },
      solvent: { type: 'string', description: 'Solvent identity; use "none" only for a 100% neat-material target' },
      preparation_temperature_C: { type: 'number', description: 'Temperature in °C at which target volume and density apply' },
    },
    required: [
      'target_conc', 'target_volume', 'unit', 'reagent_purity_percent',
      'reagent_purity_basis', 'reagent_form', 'solvent', 'preparation_temperature_C',
    ],
  },
  citation: CITATION,
  engine: 'stock-prep',
  execute: (input) => {
    const targetConc = readFiniteNumber(input.target_conc)
    const targetVolume = readFiniteNumber(input.target_volume)
    const molarMass = readFiniteNumber(input.molar_mass)
    const solutionDensity = readFiniteNumber(input.solution_density)
    const equivalentsFactor = readFiniteNumber(input.equivalents_factor)
    const reagentPurityPercent = readFiniteNumber(input.reagent_purity_percent)
    const preparationTemperatureC = readFiniteNumber(input.preparation_temperature_C)
    const unit = typeof input.unit === 'string' ? input.unit.trim() : ''
    const reagentPurityBasis = typeof input.reagent_purity_basis === 'string'
      ? input.reagent_purity_basis.trim()
      : ''
    const reagentForm = readRequiredText(input.reagent_form, 'reagent_form')
    const solvent = readRequiredText(input.solvent, 'solvent')

    if (targetConc === undefined || targetConc <= 0) return err('target_conc must be a positive finite number')
    if (targetVolume === undefined || targetVolume <= 0) return err('target_volume must be a positive finite number')
    if (hasInvalidOptionalNumber(input, 'molar_mass', molarMass)) return err('molar_mass must be a finite number if provided')
    if (hasInvalidOptionalNumber(input, 'solution_density', solutionDensity)) return err('solution_density must be a finite number if provided')
    if (hasInvalidOptionalNumber(input, 'equivalents_factor', equivalentsFactor)) return err('equivalents_factor must be a finite number if provided')
    if (!STOCK_PREP_UNITS.has(unit)) {
      return err(`Unsupported signed stock-prep unit: "${unit}". Supported mass outputs: mol/L, mmol/L, g/L, mg/L, ug/L, pct_wv, pct_ww, N, ppm, ppb`)
    }
    if (needsMolarMass(unit) && (molarMass === undefined || molarMass <= 0)) {
      return err('molar_mass of the exact reagent form is required and must be positive for mol/L, mmol/L, or N')
    }
    if ((unit === 'pct_ww' || unit === 'ppm' || unit === 'ppb') &&
        (solutionDensity === undefined || solutionDensity <= 0)) {
      return err('solution_density is required and must be positive for pct_ww and mass-fraction ppm/ppb')
    }
    if (unit === 'N' && (equivalentsFactor === undefined || equivalentsFactor <= 0)) {
      return err('equivalents_factor is required and must be positive for normality')
    }
    if (reagentPurityPercent === undefined || reagentPurityPercent <= 0 || reagentPurityPercent > 100) {
      return err('reagent_purity_percent must be positive and no greater than 100')
    }
    if (reagentPurityBasis !== 'mass') return err('reagent_purity_basis must be "mass" for signed mass preparation')
    if (reagentForm === undefined) return err('reagent_form must identify the exact as-weighed form')
    if (solvent === undefined) return err('solvent must be an explicit identity (or "none" for a neat material)')
    if (preparationTemperatureC === undefined || preparationTemperatureC <= -273.15) {
      return err('preparation_temperature_C must be finite and above absolute zero')
    }

    try {
      const result = calculateStockPrep({
        targetConc,
        targetVolume,
        molarMass,
        unit: unit as ConcentrationUnit,
        solutionDensity,
        equivalentsFactor,
        reagentPurityPercent,
        reagentPurityBasis: 'mass',
        reagentForm,
        solvent,
        preparationTemperatureC,
      })
      // Never sign a volume under a gram-labelled field. Assumptions are allowed
      // only because they are returned inside the signed result payload.
      if (result.measureBy !== 'mass' || result.amountUnit !== 'g') {
        return err(`Unit "${unit}" does not yield a mass in grams — refusing to report it as one.`)
      }
      return finalizeResult({
        mass_needed_g: result.amount,
        unit,
        assumptions: result.assumptions,
        model: result.model,
        workflow: result.workflow,
        steps: result.steps,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Stock preparation calculation failed')
    }
  },
}

const convert_concentration: VerifiedTool = {
  name: 'convert_concentration',
  description: 'Convert concentration units with explicit physical bases. ppm/ppb mean mass fraction (mg/kg, µg/kg), not mg/L/µg/L. %v/v uses solute density; %w/w and ppm/ppb use solution density.',
  input_schema: {
    type: 'object',
    properties: {
      value: { type: 'number', description: 'Concentration value to convert' },
      from_unit: { type: 'string', description: 'Source concentration unit' },
      to_unit: { type: 'string', description: 'Target concentration unit' },
      molar_mass: { type: 'number', description: 'Molar mass in g/mol when bridging amount and mass bases' },
      solute_density: { type: 'number', description: 'Pure solute density in g/mL, required when %v/v crosses another basis' },
      solution_density: { type: 'number', description: 'Complete solution density in g/mL, required when %w/w or mass-fraction ppm/ppb crosses another basis' },
      density_temperature_C: { type: 'number', description: 'Temperature in °C at which supplied density values apply' },
      equivalents: { type: 'number', description: 'Equivalents per mole, required whenever normality is converted' },
    },
    required: ['value', 'from_unit', 'to_unit'],
  },
  citation: CITATION,
  engine: 'concentration-converter',
  execute: (input) => {
    const value = readFiniteNumber(input.value)
    const fromUnit = typeof input.from_unit === 'string' ? input.from_unit.trim() : ''
    const toUnit = typeof input.to_unit === 'string' ? input.to_unit.trim() : ''
    const molarMass = readFiniteNumber(input.molar_mass)
    const soluteDensity = readFiniteNumber(input.solute_density)
    const solutionDensity = readFiniteNumber(input.solution_density)
    const densityTemperatureC = readFiniteNumber(input.density_temperature_C)
    const equivalents = readFiniteNumber(input.equivalents)

    if (value === undefined || value < 0) return err('value must be a non-negative finite number')
    if (!VALID_CONCENTRATION_UNITS.has(fromUnit)) return err(`Unsupported from_unit: "${fromUnit}"`)
    if (!VALID_CONCENTRATION_UNITS.has(toUnit)) return err(`Unsupported to_unit: "${toUnit}"`)
    if (hasInvalidOptionalNumber(input, 'molar_mass', molarMass)) return err('molar_mass must be a finite number if provided')
    if (hasInvalidOptionalNumber(input, 'solute_density', soluteDensity)) return err('solute_density must be a finite number if provided')
    if (hasInvalidOptionalNumber(input, 'solution_density', solutionDensity)) return err('solution_density must be a finite number if provided')
    if (hasInvalidOptionalNumber(input, 'density_temperature_C', densityTemperatureC)) return err('density_temperature_C must be finite if provided')
    if (hasInvalidOptionalNumber(input, 'equivalents', equivalents)) return err('equivalents must be finite if provided')

    const requirements = getConcentrationConversionRequirements(
      fromUnit as ConcentrationUnit,
      toUnit as ConcentrationUnit
    )
    if (requirements.molarMass && (molarMass === undefined || molarMass <= 0)) {
      return err('molar_mass is required and must be positive to bridge amount and mass bases')
    }
    if (requirements.soluteDensity && (soluteDensity === undefined || soluteDensity <= 0)) {
      return err('solute_density is required and must be positive for %v/v conversion')
    }
    if (requirements.solutionDensity && (solutionDensity === undefined || solutionDensity <= 0)) {
      return err('solution_density is required and must be positive for mass-fraction conversion')
    }
    if (requirements.densityTemperature &&
        (densityTemperatureC === undefined || densityTemperatureC <= -273.15)) {
      return err('density_temperature_C is required and must be above absolute zero when density is used')
    }
    if (requirements.equivalents && (equivalents === undefined || equivalents <= 0)) {
      return err('equivalents is required and must be positive for normality conversion')
    }

    try {
      const result = convertConcentration({
        value,
        fromUnit: fromUnit as ConcentrationUnit,
        toUnit: toUnit as ConcentrationUnit,
        molarMass,
        soluteDensity,
        solutionDensity,
        densityTemperatureC,
        equivalents,
      })
      return finalizeResult({
        value: result.value,
        from_unit: result.fromUnit,
        to_unit: result.toUnit,
        converted_value: result.convertedValue,
        assumptions: result.assumptions,
        model: result.model,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Concentration conversion failed')
    }
  },
}

const calculate_mixing: VerifiedTool = {
  name: 'calculate_mixing',
  description: 'Calculate a material-balance concentration for two solutions of one named solute in one shared volume-based unit, with no reaction/loss. Requires either a measured final volume or an explicitly labelled additive-volume approximation.',
  input_schema: {
    type: 'object',
    properties: {
      c1: { type: 'number', description: 'Concentration of first solution' },
      v1: { type: 'number', description: 'Volume of first solution (L or mL, consistent with v2)' },
      c2: { type: 'number', description: 'Concentration of second solution' },
      v2: { type: 'number', description: 'Volume of second solution (L or mL, consistent with v1)' },
      solute_identity: { type: 'string', description: 'One shared solute/analyte identity for both solutions' },
      concentration_unit: { type: 'string', enum: ['mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L', 'pct_wv', 'N'], description: 'One shared, volume-based concentration unit for c1 and c2' },
      volume_unit: { type: 'string', enum: ['L', 'mL'], description: 'One explicit shared unit for v1, v2, and final_volume' },
      normality_context: { type: 'string', description: 'Required for N: the shared reaction or analytical equivalent-entity definition used by both inputs' },
      volume_basis: { type: 'string', enum: ['measured-final', 'additive-approximation'], description: 'Use measured-final when final volume is observed; additive-approximation explicitly assumes Vfinal = V1 + V2' },
      final_volume: { type: 'number', description: 'Measured final volume, required only for measured-final; same unit as v1/v2' },
      no_reaction_or_loss: { type: 'boolean', description: 'Must be true to confirm no reaction, precipitation, volatilization, or solute loss' },
    },
    required: [
      'c1', 'v1', 'c2', 'v2', 'solute_identity', 'concentration_unit',
      'volume_unit', 'volume_basis', 'no_reaction_or_loss',
    ],
  },
  citation: CITATION,
  engine: 'mixing',
  execute: (input) => {
    const c1 = readFiniteNumber(input.c1)
    const v1 = readFiniteNumber(input.v1)
    const c2 = readFiniteNumber(input.c2)
    const v2 = readFiniteNumber(input.v2)
    const finalVolume = readFiniteNumber(input.final_volume)
    const soluteIdentity = readRequiredText(input.solute_identity, 'solute_identity')
    const normalityContext = input.normality_context === undefined
      ? undefined
      : readRequiredText(input.normality_context, 'normality_context')
    const concentrationUnit = typeof input.concentration_unit === 'string'
      ? input.concentration_unit.trim()
      : ''
    const volumeUnit = typeof input.volume_unit === 'string'
      ? input.volume_unit.trim()
      : ''
    const volumeBasis = typeof input.volume_basis === 'string'
      ? input.volume_basis.trim()
      : ''
    if (c1 === undefined || c1 < 0) return err('c1 must be a non-negative finite number')
    if (v1 === undefined || v1 < 0) return err('v1 must be a non-negative finite number')
    if (c2 === undefined || c2 < 0) return err('c2 must be a non-negative finite number')
    if (v2 === undefined || v2 < 0) return err('v2 must be a non-negative finite number')
    if ((v1 + v2) === 0) return err('Total volume (v1 + v2) must be greater than zero')
    if (hasInvalidOptionalNumber(input, 'final_volume', finalVolume)) return err('final_volume must be finite if provided')
    if (soluteIdentity === undefined) return err('solute_identity must name the one shared solute/analyte')
    if (!isMixingConcentrationUnit(concentrationUnit)) {
      return err('concentration_unit must be one shared volume-based unit: mol/L, mmol/L, g/L, mg/L, ug/L, pct_wv, or N')
    }
    if (volumeUnit !== 'L' && volumeUnit !== 'mL') {
      return err('volume_unit must explicitly be L or mL')
    }
    if (concentrationUnit === 'N' && normalityContext === undefined) {
      return err('normality_context must define the shared reaction/equivalence context when concentration_unit is N')
    }
    if (concentrationUnit !== 'N' && input.normality_context !== undefined) {
      return err('normality_context must be omitted unless concentration_unit is N')
    }
    if (volumeBasis !== 'measured-final' && volumeBasis !== 'additive-approximation') {
      return err('volume_basis must be measured-final or additive-approximation')
    }
    if (input.no_reaction_or_loss !== true) {
      return err('no_reaction_or_loss must be explicitly true for this mixing model')
    }
    if (volumeBasis === 'measured-final' && (finalVolume === undefined || finalVolume <= 0)) {
      return err('final_volume is required and must be positive for measured-final')
    }
    if (volumeBasis === 'additive-approximation' && input.final_volume !== undefined) {
      return err('final_volume must be omitted for additive-approximation')
    }
    try {
      const result = calculateMixing({
        c1,
        v1,
        c2,
        v2,
        soluteIdentity,
        concentrationUnit,
        volumeUnit: volumeUnit as MixingVolumeUnit,
        normalityContext,
        volumeBasis: volumeBasis as MixingVolumeBasis,
        finalVolume,
        noReactionOrLoss: true,
      })
      return finalizeResult({
        final_concentration: result.finalConc,
        final_volume: result.finalVolume,
        final_volume_unit: result.model.volumeUnit,
        assumptions: result.assumptions,
        model: result.model,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Mixing calculation failed')
    }
  },
}

export const concentrationTools: VerifiedTool[] = [
  calculate_molarity,
  calculate_molality,
  calculate_mass_percent,
  calculate_ppm,
  calculate_osmotic_pressure,
  calculate_boiling_point_elevation,
  calculate_freezing_point_depression,
  calculate_stock_prep,
  convert_concentration,
  calculate_mixing,
]
