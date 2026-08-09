/**
 * VerChem Verified Answer Cards — pH / Solution Chemistry Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/solutions.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, readOptionalFiniteNumber, finalizeResult } from './_validate'
import {
  calculateStrongAcidPH,
  calculateWeakAcidPH,
  calculateStrongBasePH,
  calculateWeakBasePH,
  hendersonHasselbalch,
  calculateDilution,
  ACID_KA_VALUES,
  PH_MODEL_25C,
  assertSupportedPHModelScope,
} from '@/lib/calculations/solutions'

const CITATION = 'Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 6; Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 16'

const PH_MODEL_INPUT_PROPERTIES = {
  temperature_C: {
    type: 'number',
    description: 'Optional model temperature. This engine supports exactly 25 °C and rejects other temperatures.',
  },
  activity_model: {
    type: 'string',
    enum: [PH_MODEL_25C.activityModel],
    description: 'Optional explicit activity model. Only concentration-as-activity (ideal dilute) is supported.',
  },
}

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function validatePHModelScope(input: Record<string, unknown>): ToolResult | null {
  const temperatureC = readOptionalFiniteNumber(
    input,
    'temperature_C',
    PH_MODEL_25C.temperatureC
  )
  if (temperatureC === undefined) return err('temperature_C must be finite if provided')

  const activityModel = input.activity_model === undefined
    ? PH_MODEL_25C.activityModel
    : typeof input.activity_model === 'string'
      ? input.activity_model.trim()
      : ''

  try {
    assertSupportedPHModelScope(temperatureC, activityModel)
    return null
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Unsupported pH model scope')
  }
}

function requirePositiveInteger(name: string, value: unknown): number | undefined {
  const n = readFiniteNumber(value)
  if (n === undefined) return undefined
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return n
}

/** Common English names → formula keys in ACID_KA_VALUES */
const ACID_NAME_ALIASES: Record<string, string> = {
  'acetic acid': 'CH3COOH',
  'ethanoic acid': 'CH3COOH',
  'hydrofluoric acid': 'HF',
  'nitrous acid': 'HNO2',
  'carbonic acid': 'H2CO3',
  'hydrogen sulfide': 'H2S',
  'ammonium': 'NH4+',
  'phosphoric acid': 'H3PO4',
  'sulfuric acid': 'H2SO4',
  'hydrochloric acid': 'HCl',
  'nitric acid': 'HNO3',
}

const calculate_strong_acid_ph: VerifiedTool = {
  name: 'calculate_strong_acid_ph',
  description: 'Calculate model pH, pOH, and ion concentrations for a strong acid in an ideal-dilute aqueous solution at exactly 25 °C. Reject other temperatures or activity-corrected questions.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the acid (M)' },
      formula: { type: 'string', description: 'Recognized strong-acid formula (e.g., HCl, H2SO4). Required unless proton_count is supplied.' },
      proton_count: { type: 'integer', description: 'Explicit positive number of protons donated per formula unit. Required unless formula is supplied.' },
      ...PH_MODEL_INPUT_PROPERTIES,
    },
    required: ['concentration'],
  },
  citation: CITATION,
  engine: 'strong-acid-pH',
  execute: (input) => {
    const concentration = readFiniteNumber(input.concentration)
    if (concentration === undefined || concentration < 0) {
      return err('Concentration must be a non-negative finite number')
    }
    const scopeError = validatePHModelScope(input)
    if (scopeError) return scopeError
    try {
      let protonCount: number | undefined
      if (input.proton_count !== undefined) {
        protonCount = requirePositiveInteger('proton_count', input.proton_count)
      }
      const formula = typeof input.formula === 'string' ? input.formula : undefined
      const result = calculateStrongAcidPH(concentration, { formula, protonCount })
      return finalizeResult({
        pH: result.pH,
        pOH: result.pOH,
        H_concentration: result.H_concentration,
        OH_concentration: result.OH_concentration,
        Kw: PH_MODEL_25C.kw,
        model: PH_MODEL_25C,
        resolved_species: result.resolved,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Strong acid pH calculation failed')
    }
  },
}

const calculate_weak_acid_ph: VerifiedTool = {
  name: 'calculate_weak_acid_ph',
  description: 'Calculate model pH and percent ionization for a weak acid in an ideal-dilute aqueous solution at exactly 25 °C. Ka must apply to that temperature; reject non-ideal or other-temperature questions.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the weak acid (M)' },
      Ka: { type: 'number', description: 'Acid dissociation constant' },
      acid_name: { type: 'string', description: 'Optional common name (e.g., acetic acid, CH3COOH)' },
      ...PH_MODEL_INPUT_PROPERTIES,
    },
    required: ['concentration'],
  },
  citation: CITATION,
  engine: 'weak-acid-pH',
  execute: (input) => {
    const concentration = readFiniteNumber(input.concentration)
    if (concentration === undefined || concentration < 0) {
      return err('Concentration must be a non-negative finite number')
    }
    const scopeError = validatePHModelScope(input)
    if (scopeError) return scopeError

    let Ka: number | undefined
    if (typeof input.Ka === 'number' && Number.isFinite(input.Ka) && input.Ka > 0) {
      Ka = input.Ka
    } else if (typeof input.acid_name === 'string') {
      const acidName = input.acid_name.toLowerCase().trim()
      // Try alias map first
      const aliasKey = ACID_NAME_ALIASES[acidName]
      if (aliasKey) {
        Ka = ACID_KA_VALUES[aliasKey as keyof typeof ACID_KA_VALUES]
      } else {
        // Try direct formula match (case-insensitive)
        const directKey = Object.keys(ACID_KA_VALUES).find(
          (k) => k.toLowerCase() === acidName
        )
        if (directKey) {
          Ka = ACID_KA_VALUES[directKey as keyof typeof ACID_KA_VALUES]
        }
      }
    }

    if (Ka === undefined || Ka <= 0) {
      return err('Ka is required and must be a positive number, or provide a known acid_name')
    }

    try {
      const result = calculateWeakAcidPH(concentration, Ka)
      return finalizeResult({
        pH: result.pH,
        H_concentration: result.H_concentration,
        percent_ionization: result.percentIonization,
        method: result.method,
        warning: result.warning,
        Kw: PH_MODEL_25C.kw,
        model: PH_MODEL_25C,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Weak acid pH calculation failed')
    }
  },
}

const calculate_strong_base_ph: VerifiedTool = {
  name: 'calculate_strong_base_ph',
  description: 'Calculate model pH, pOH, and ion concentrations for a strong base in an ideal-dilute aqueous solution at exactly 25 °C. Reject other temperatures or activity-corrected questions.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the base (M)' },
      formula: { type: 'string', description: 'Recognized strong-base formula (e.g., NaOH, Ca(OH)2). Required unless hydroxide_count is supplied.' },
      hydroxide_count: { type: 'integer', description: 'Explicit positive number of OH- ions per formula unit. Required unless formula is supplied.' },
      ...PH_MODEL_INPUT_PROPERTIES,
    },
    required: ['concentration'],
  },
  citation: CITATION,
  engine: 'strong-base-pH',
  execute: (input) => {
    const concentration = readFiniteNumber(input.concentration)
    if (concentration === undefined || concentration < 0) {
      return err('Concentration must be a non-negative finite number')
    }
    const scopeError = validatePHModelScope(input)
    if (scopeError) return scopeError
    try {
      let hydroxideCount: number | undefined
      if (input.hydroxide_count !== undefined) {
        hydroxideCount = requirePositiveInteger('hydroxide_count', input.hydroxide_count)
      }
      const formula = typeof input.formula === 'string' ? input.formula : undefined
      const result = calculateStrongBasePH(concentration, { formula, hydroxideCount })
      return finalizeResult({
        pH: result.pH,
        pOH: result.pOH,
        H_concentration: result.H_concentration,
        OH_concentration: result.OH_concentration,
        Kw: PH_MODEL_25C.kw,
        model: PH_MODEL_25C,
        resolved_species: result.resolved,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Strong base pH calculation failed')
    }
  },
}

const calculate_weak_base_ph: VerifiedTool = {
  name: 'calculate_weak_base_ph',
  description: 'Calculate model pH and percent ionization for a weak base in an ideal-dilute aqueous solution at exactly 25 °C. Kb must apply to that temperature; reject non-ideal or other-temperature questions.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the weak base (M)' },
      Kb: { type: 'number', description: 'Base dissociation constant' },
      ...PH_MODEL_INPUT_PROPERTIES,
    },
    required: ['concentration', 'Kb'],
  },
  citation: CITATION,
  engine: 'weak-base-pH',
  execute: (input) => {
    const concentration = readFiniteNumber(input.concentration)
    const Kb = readFiniteNumber(input.Kb)
    if (concentration === undefined || concentration < 0) {
      return err('Concentration must be a non-negative finite number')
    }
    if (Kb === undefined || Kb <= 0) {
      return err('Kb must be a positive finite number')
    }
    const scopeError = validatePHModelScope(input)
    if (scopeError) return scopeError
    try {
      const result = calculateWeakBasePH(concentration, Kb)
      return finalizeResult({
        pH: result.pH,
        pOH: result.pOH,
        OH_concentration: result.OH_concentration,
        percent_ionization: result.percentIonization,
        method: result.method,
        warning: result.warning,
        Kw: PH_MODEL_25C.kw,
        model: PH_MODEL_25C,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Weak base pH calculation failed')
    }
  },
}

const calculate_buffer_ph: VerifiedTool = {
  name: 'calculate_buffer_ph',
  description: 'Calculate model pH of a buffer with Henderson-Hasselbalch using concentration ratios as activity ratios in an ideal-dilute aqueous solution at exactly 25 °C.',
  input_schema: {
    type: 'object',
    properties: {
      pKa: { type: 'number', description: 'pKa of the weak acid' },
      acid_concentration: { type: 'number', description: 'Concentration of the weak acid [HA] (M)' },
      base_concentration: { type: 'number', description: 'Concentration of the conjugate base [A-] (M)' },
      ...PH_MODEL_INPUT_PROPERTIES,
    },
    required: ['pKa', 'acid_concentration', 'base_concentration'],
  },
  citation: CITATION,
  engine: 'buffer-pH',
  execute: (input) => {
    const pKa = readFiniteNumber(input.pKa)
    const acidConcentration = readFiniteNumber(input.acid_concentration)
    const baseConcentration = readFiniteNumber(input.base_concentration)
    if (pKa === undefined) return err('pKa must be a finite number')
    if (acidConcentration === undefined || acidConcentration <= 0) return err('acid_concentration must be positive')
    if (baseConcentration === undefined || baseConcentration <= 0) return err('base_concentration must be positive')
    const scopeError = validatePHModelScope(input)
    if (scopeError) return scopeError
    try {
      const pH = hendersonHasselbalch(pKa, acidConcentration, baseConcentration)
      return finalizeResult({
        pH,
        ratio: baseConcentration / acidConcentration,
        model: PH_MODEL_25C,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Buffer pH calculation failed')
    }
  },
}

const calculate_dilution: VerifiedTool = {
  name: 'calculate_dilution',
  description: 'Solve dilution problems using M1V1 = M2V2. Use when the user asks to dilute a solution, find final concentration, or find initial/final volume. Provide exactly 3 of the 4 variables.',
  input_schema: {
    type: 'object',
    properties: {
      M1: { type: 'number', description: 'Initial molarity (M)' },
      V1: { type: 'number', description: 'Initial volume (L)' },
      M2: { type: 'number', description: 'Final molarity (M)' },
      V2: { type: 'number', description: 'Final volume (L)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'dilution',
  execute: (input) => {
    const args = {
      M1: readFiniteNumber(input.M1),
      V1: readFiniteNumber(input.V1),
      M2: readFiniteNumber(input.M2),
      V2: readFiniteNumber(input.V2),
    }
    // All provided values must be positive finite
    if (args.M1 !== undefined && args.M1 <= 0) return err('M1 must be a positive finite number')
    if (args.V1 !== undefined && args.V1 <= 0) return err('V1 must be a positive finite number')
    if (args.M2 !== undefined && args.M2 <= 0) return err('M2 must be a positive finite number')
    if (args.V2 !== undefined && args.V2 <= 0) return err('V2 must be a positive finite number')
    try {
      const result = calculateDilution(args)
      if (result.volumeToAdd < 0) {
        return err('Not a dilution: target concentration must be lower than initial (volume to add would be negative)')
      }
      return finalizeResult({
        M1: result.M1,
        V1: result.V1,
        M2: result.M2,
        V2: result.V2,
        volume_to_add: result.volumeToAdd,
        dilution_factor: result.dilutionFactor,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Dilution calculation failed')
    }
  },
}

export const phTools: VerifiedTool[] = [
  calculate_strong_acid_ph,
  calculate_weak_acid_ph,
  calculate_strong_base_ph,
  calculate_weak_base_ph,
  calculate_buffer_ph,
  calculate_dilution,
]
