/**
 * VerChem Verified Answer Cards — pH / Solution Chemistry Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/solutions.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import {
  calculateStrongAcidPH,
  calculateWeakAcidPH,
  calculateStrongBasePH,
  calculateWeakBasePH,
  hendersonHasselbalch,
  calculateDilution,
  ACID_KA_VALUES,
} from '@/lib/calculations/solutions'

const CITATION = 'Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 6; Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 16'

function ok(value: Record<string, unknown>): ToolResult {
  return { ok: true, value }
}

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

const calculate_strong_acid_ph: VerifiedTool = {
  name: 'calculate_strong_acid_ph',
  description: 'Calculate pH, pOH, and ion concentrations for a strong acid solution. Use when the user asks for pH of a strong acid (e.g., HCl, HNO3, H2SO4) given its concentration.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the acid (M)' },
      formula: { type: 'string', description: 'Optional chemical formula (e.g., HCl, H2SO4)' },
      proton_count: { type: 'integer', description: 'Optional number of protons donated per molecule' },
    },
    required: ['concentration'],
  },
  citation: CITATION,
  engine: 'strong-acid-pH',
  execute: (input) => {
    const concentration = Number(input.concentration)
    if (!Number.isFinite(concentration) || concentration < 0) {
      return err('Concentration must be a non-negative number')
    }
    try {
      const options = input.formula || input.proton_count
        ? { formula: typeof input.formula === 'string' ? input.formula : undefined, protonCount: typeof input.proton_count === 'number' ? input.proton_count : undefined }
        : undefined
      const result = calculateStrongAcidPH(concentration, options)
      return ok({
        pH: result.pH,
        pOH: result.pOH,
        H_concentration: result.H_concentration,
        OH_concentration: result.OH_concentration,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Strong acid pH calculation failed')
    }
  },
}

const calculate_weak_acid_ph: VerifiedTool = {
  name: 'calculate_weak_acid_ph',
  description: 'Calculate pH and percent ionization for a weak acid solution. Use when the user asks for pH of a weak acid given concentration and Ka (or a known acid name).',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the weak acid (M)' },
      Ka: { type: 'number', description: 'Acid dissociation constant' },
      acid_name: { type: 'string', description: 'Optional common name (e.g., acetic acid, CH3COOH)' },
    },
    required: ['concentration'],
  },
  citation: CITATION,
  engine: 'weak-acid-pH',
  execute: (input) => {
    const concentration = Number(input.concentration)
    if (!Number.isFinite(concentration) || concentration < 0) {
      return err('Concentration must be a non-negative number')
    }

    let Ka: number | undefined
    if (typeof input.Ka === 'number' && Number.isFinite(input.Ka)) {
      Ka = input.Ka
    } else if (typeof input.acid_name === 'string') {
      const acidName = input.acid_name
      const key = Object.keys(ACID_KA_VALUES).find(
        (k) => k.toLowerCase() === acidName.toLowerCase()
      )
      if (key) {
        Ka = ACID_KA_VALUES[key as keyof typeof ACID_KA_VALUES]
      }
    }

    if (Ka === undefined || Ka <= 0) {
      return err('Ka is required and must be a positive number, or provide a known acid_name')
    }

    try {
      const result = calculateWeakAcidPH(concentration, Ka)
      return ok({
        pH: result.pH,
        H_concentration: result.H_concentration,
        percent_ionization: result.percentIonization,
        method: result.method,
        warning: result.warning,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Weak acid pH calculation failed')
    }
  },
}

const calculate_strong_base_ph: VerifiedTool = {
  name: 'calculate_strong_base_ph',
  description: 'Calculate pH, pOH, and ion concentrations for a strong base solution. Use when the user asks for pH of a strong base (e.g., NaOH, KOH, Ca(OH)2) given its concentration.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the base (M)' },
      formula: { type: 'string', description: 'Optional chemical formula (e.g., NaOH, Ca(OH)2)' },
      hydroxide_count: { type: 'integer', description: 'Optional number of OH- per formula unit' },
    },
    required: ['concentration'],
  },
  citation: CITATION,
  engine: 'strong-base-pH',
  execute: (input) => {
    const concentration = Number(input.concentration)
    if (!Number.isFinite(concentration) || concentration < 0) {
      return err('Concentration must be a non-negative number')
    }
    try {
      const options = input.formula || input.hydroxide_count
        ? { formula: typeof input.formula === 'string' ? input.formula : undefined, hydroxideCount: typeof input.hydroxide_count === 'number' ? input.hydroxide_count : undefined }
        : undefined
      const result = calculateStrongBasePH(concentration, options)
      return ok({
        pH: result.pH,
        pOH: result.pOH,
        H_concentration: result.H_concentration,
        OH_concentration: result.OH_concentration,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Strong base pH calculation failed')
    }
  },
}

const calculate_weak_base_ph: VerifiedTool = {
  name: 'calculate_weak_base_ph',
  description: 'Calculate pH and percent ionization for a weak base solution. Use when the user asks for pH of a weak base given concentration and Kb.',
  input_schema: {
    type: 'object',
    properties: {
      concentration: { type: 'number', description: 'Molar concentration of the weak base (M)' },
      Kb: { type: 'number', description: 'Base dissociation constant' },
    },
    required: ['concentration', 'Kb'],
  },
  citation: CITATION,
  engine: 'weak-base-pH',
  execute: (input) => {
    const concentration = Number(input.concentration)
    const Kb = Number(input.Kb)
    if (!Number.isFinite(concentration) || concentration < 0) {
      return err('Concentration must be a non-negative number')
    }
    if (!Number.isFinite(Kb) || Kb <= 0) {
      return err('Kb must be a positive number')
    }
    try {
      const result = calculateWeakBasePH(concentration, Kb)
      return ok({
        pH: result.pH,
        pOH: result.pOH,
        OH_concentration: result.OH_concentration,
        percent_ionization: result.percentIonization,
        method: result.method,
        warning: result.warning,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Weak base pH calculation failed')
    }
  },
}

const calculate_buffer_ph: VerifiedTool = {
  name: 'calculate_buffer_ph',
  description: 'Calculate pH of a buffer solution using the Henderson-Hasselbalch equation. Use when the user asks for pH of a buffer given pKa and the ratio (or concentrations) of conjugate base to weak acid.',
  input_schema: {
    type: 'object',
    properties: {
      pKa: { type: 'number', description: 'pKa of the weak acid' },
      acid_concentration: { type: 'number', description: 'Concentration of the weak acid [HA] (M)' },
      base_concentration: { type: 'number', description: 'Concentration of the conjugate base [A-] (M)' },
    },
    required: ['pKa', 'acid_concentration', 'base_concentration'],
  },
  citation: CITATION,
  engine: 'buffer-pH',
  execute: (input) => {
    const pKa = Number(input.pKa)
    const acidConcentration = Number(input.acid_concentration)
    const baseConcentration = Number(input.base_concentration)
    if (!Number.isFinite(pKa)) return err('pKa must be a finite number')
    if (!Number.isFinite(acidConcentration) || acidConcentration <= 0) return err('acid_concentration must be positive')
    if (!Number.isFinite(baseConcentration) || baseConcentration <= 0) return err('base_concentration must be positive')
    try {
      const pH = hendersonHasselbalch(pKa, acidConcentration, baseConcentration)
      return ok({ pH, ratio: baseConcentration / acidConcentration })
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
      M1: input.M1 !== undefined ? Number(input.M1) : undefined,
      V1: input.V1 !== undefined ? Number(input.V1) : undefined,
      M2: input.M2 !== undefined ? Number(input.M2) : undefined,
      V2: input.V2 !== undefined ? Number(input.V2) : undefined,
    }
    try {
      const result = calculateDilution(args)
      return ok({
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
