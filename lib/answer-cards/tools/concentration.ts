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
  type ConcentrationUnit,
} from '@/lib/calculations/solution-prep'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 13 (Solutions); Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 5'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

const VALID_CONCENTRATION_UNITS = new Set([
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L',
  'pct_wv', 'pct_ww', 'pct_vv', 'N', 'ppm', 'ppb',
])

// Subset usable for stock prep: mass must be a DETERMINISTIC function of inputs.
// Excludes pct_ww (needs solution density), pct_vv (yields volume not mass),
// and N (needs equivalents factor) — all carry a hidden assumption that must
// never be signed VERIFIED.
const STOCK_PREP_UNITS = new Set([
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L', 'ppm', 'ppb', 'pct_wv',
])

// Fraction units are bounded 0..100%. %v/v uses solute density while %w/w uses
// solution density — converting directly between them needs BOTH densities, but
// the engine takes only one, so that pair is not verifiable.
const FRACTION_UNITS = new Set(['pct_vv', 'pct_ww'])

function needsMolarMass(unit: string): boolean {
  return unit === 'mol/L' || unit === 'mmol/L' || unit === 'N'
}

function needsDensity(unit: string): boolean {
  return unit === 'pct_ww' || unit === 'pct_vv'
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
  description: 'Calculate parts per million (ppm) concentration. Use when the user asks for ppm. Note: solute mass in mg, solution volume in L.',
  input_schema: {
    type: 'object',
    properties: {
      solute_mass_mg: { type: 'number', description: 'Mass of solute in milligrams (mg)' },
      solution_volume_L: { type: 'number', description: 'Volume of solution in liters (L)' },
    },
    required: ['solute_mass_mg', 'solution_volume_L'],
  },
  citation: CITATION,
  engine: 'ppm',
  execute: (input) => {
    const soluteMass = readFiniteNumber(input.solute_mass_mg)
    const solutionVolume = readFiniteNumber(input.solution_volume_L)
    if (soluteMass === undefined || soluteMass < 0) return err('solute_mass_mg must be a non-negative finite number')
    if (solutionVolume === undefined || solutionVolume <= 0) return err('solution_volume_L must be a positive finite number')
    try {
      const result = calculatePPM(soluteMass, solutionVolume)
      return finalizeResult({ ppm: result, note: 'solute mass in mg, solution volume in L' })
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
  description: 'Calculate the mass (or volume) of solute needed to prepare a stock solution of a given concentration and volume. Use when the user asks how to make a solution.',
  input_schema: {
    type: 'object',
    properties: {
      target_conc: { type: 'number', description: 'Target concentration (value depends on unit)' },
      target_volume: { type: 'number', description: 'Target volume in liters (L)' },
      molar_mass: { type: 'number', description: 'Molar mass of solute in g/mol' },
      unit: { type: 'string', description: 'Concentration unit: mol/L, mmol/L, g/L, mg/L, ug/L, pct_wv, pct_ww, pct_vv, N, ppm, ppb' },
    },
    required: ['target_conc', 'target_volume', 'molar_mass', 'unit'],
  },
  citation: CITATION,
  engine: 'stock-prep',
  execute: (input) => {
    const targetConc = readFiniteNumber(input.target_conc)
    const targetVolume = readFiniteNumber(input.target_volume)
    const molarMass = readFiniteNumber(input.molar_mass)
    const unit = typeof input.unit === 'string' ? input.unit.trim() : ''

    if (targetConc === undefined || targetConc <= 0) return err('target_conc must be a positive finite number')
    if (targetVolume === undefined || targetVolume <= 0) return err('target_volume must be a positive finite number')
    if (!STOCK_PREP_UNITS.has(unit)) {
      return err(`Unsupported stock-prep unit: "${unit}". Supported (deterministic mass): mol/L, mmol/L, g/L, mg/L, ug/L, ppm, ppb, pct_wv`)
    }
    // molar_mass is used (and required) only for amount-based units
    if (needsMolarMass(unit) && (molarMass === undefined || molarMass <= 0)) {
      return err('molar_mass is required and must be positive for mol/L or mmol/L')
    }

    try {
      // Engine requires molarMass > 0 even for mass-based units that ignore it.
      const safeMolarMass = molarMass !== undefined && molarMass > 0 ? molarMass : 1
      const result = calculateStockPrep({ targetConc, targetVolume, molarMass: safeMolarMass, unit: unit as ConcentrationUnit })
      return finalizeResult({
        mass_needed_g: result.massNeeded,
        unit,
        steps: result.steps,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Stock preparation calculation failed')
    }
  },
}

const convert_concentration: VerifiedTool = {
  name: 'convert_concentration',
  description: 'Convert a concentration value between supported units (mol/L, g/L, %, ppm, etc.). Use when the user asks to convert concentration units.',
  input_schema: {
    type: 'object',
    properties: {
      value: { type: 'number', description: 'Concentration value to convert' },
      from_unit: { type: 'string', description: 'Source concentration unit' },
      to_unit: { type: 'string', description: 'Target concentration unit' },
      molar_mass: { type: 'number', description: 'Molar mass in g/mol (required for mol/L, mmol/L, N conversions)' },
      density: { type: 'number', description: 'Density in g/mL (required for %w/w and %v/v conversions)' },
      equivalents: { type: 'number', description: 'Equivalents factor (required for normality conversions). Default: 1' },
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
    const density = readFiniteNumber(input.density)
    const equivalents = readOptionalFiniteNumber(input, 'equivalents', 1)

    if (value === undefined || value < 0) return err('value must be a non-negative finite number')
    if (equivalents === undefined) return err('equivalents must be a finite number if provided')
    if (!VALID_CONCENTRATION_UNITS.has(fromUnit)) return err(`Unsupported from_unit: "${fromUnit}"`)
    if (!VALID_CONCENTRATION_UNITS.has(toUnit)) return err(`Unsupported to_unit: "${toUnit}"`)

    // Fraction units (% v/v, % w/w) are physically bounded to 0..100%
    if (FRACTION_UNITS.has(fromUnit) && value > 100) {
      return err(`${fromUnit} concentration cannot exceed 100%`)
    }
    // %v/v <-> %w/w needs both solute and solution densities (engine takes one) — not verifiable
    if (FRACTION_UNITS.has(fromUnit) && FRACTION_UNITS.has(toUnit) && fromUnit !== toUnit) {
      return err('Direct %v/v <-> %w/w conversion needs both solute and solution densities; not supported')
    }

    if (needsMolarMass(fromUnit) || needsMolarMass(toUnit)) {
      if (molarMass === undefined || molarMass <= 0) {
        return err('molar_mass is required and must be positive for this conversion')
      }
    }
    if (needsDensity(fromUnit) || needsDensity(toUnit)) {
      if (density === undefined || density <= 0) {
        return err('density is required and must be positive for %w/w or %v/v conversions')
      }
    }
    if ((fromUnit === 'N' || toUnit === 'N') && equivalents <= 0) {
      return err('equivalents must be a positive finite number for normality conversions')
    }

    try {
      const result = convertConcentration({
        value,
        fromUnit: fromUnit as ConcentrationUnit,
        toUnit: toUnit as ConcentrationUnit,
        molarMass,
        density,
        equivalents,
      })
      // A fraction-unit result cannot exceed 100%
      if (FRACTION_UNITS.has(toUnit) && result.convertedValue > 100) {
        return err(`Conversion produced an impossible ${toUnit} value (exceeds 100%)`)
      }
      return finalizeResult({
        value: result.value,
        from_unit: result.fromUnit,
        to_unit: result.toUnit,
        converted_value: result.convertedValue,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Concentration conversion failed')
    }
  },
}

const calculate_mixing: VerifiedTool = {
  name: 'calculate_mixing',
  description: 'Calculate the final concentration when two solutions are mixed. Use when the user asks what happens when two solutions are combined.',
  input_schema: {
    type: 'object',
    properties: {
      c1: { type: 'number', description: 'Concentration of first solution' },
      v1: { type: 'number', description: 'Volume of first solution (L or mL, consistent with v2)' },
      c2: { type: 'number', description: 'Concentration of second solution' },
      v2: { type: 'number', description: 'Volume of second solution (L or mL, consistent with v1)' },
    },
    required: ['c1', 'v1', 'c2', 'v2'],
  },
  citation: CITATION,
  engine: 'mixing',
  execute: (input) => {
    const c1 = readFiniteNumber(input.c1)
    const v1 = readFiniteNumber(input.v1)
    const c2 = readFiniteNumber(input.c2)
    const v2 = readFiniteNumber(input.v2)
    if (c1 === undefined || c1 < 0) return err('c1 must be a non-negative finite number')
    if (v1 === undefined || v1 < 0) return err('v1 must be a non-negative finite number')
    if (c2 === undefined || c2 < 0) return err('c2 must be a non-negative finite number')
    if (v2 === undefined || v2 < 0) return err('v2 must be a non-negative finite number')
    if ((v1 + v2) === 0) return err('Total volume (v1 + v2) must be greater than zero')
    try {
      const result = calculateMixing({ c1, v1, c2, v2 })
      return finalizeResult({
        final_concentration: result.finalConc,
        final_volume: result.finalVolume,
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
