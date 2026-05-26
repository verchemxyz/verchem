/**
 * VerChem Verified Answer Cards — Thermodynamics Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/thermodynamics.ts
 * CRITICAL: execute() routes to engine functions directly — no formula reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, readOptionalFiniteNumber, finalizeResult, isPlainObject } from './_validate'
import { isValidStandaloneFormula } from './_formula'
import {
  calculateDeltaG,
  calculateEquilibriumConstant,
  analyzeReaction,
  THERMODYNAMIC_DATA,
  STANDARD_TEMPERATURE,
  type ThermodynamicData,
} from '@/lib/calculations/thermodynamics'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 19 (Chemical Thermodynamics); Atkins & de Paula, Physical Chemistry (11th ed.), Focus 3 (The Second and Third Laws)'

const MAX_COEFFICIENT = 1_000_000

type ThermoSpecies = { formula: string; coefficient: number }
type ThermoState = ThermodynamicData['state']

const STATE_MAP: Record<string, ThermoState> = {
  s: 'solid',
  l: 'liquid',
  g: 'gas',
  aq: 'aqueous',
}

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function requirePositiveInteger(name: string, value: unknown): number {
  const n = readFiniteNumber(value)
  if (n === undefined || !Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  if (n > MAX_COEFFICIENT) {
    throw new Error(`${name} is too large for a verified calculation`)
  }
  return n
}

function parseExplicitThermoFormula(raw: string): { formula: string; state: ThermoState } | null {
  const compact = raw.replace(/\s+/g, '')
  const match = compact.match(/^(.+)\((aq|s|l|g)\)$/i)
  if (!match) return null
  const formula = match[1]
  const state = STATE_MAP[match[2].toLowerCase()]
  if (!state || !isValidStandaloneFormula(formula)) return null
  return { formula, state }
}

function hasThermodynamicData(formula: string, state: ThermoState): boolean {
  return THERMODYNAMIC_DATA.filter((entry) => entry.formula === formula && entry.state === state).length === 1
}

function readSpeciesArray(value: unknown, name: string): ThermoSpecies[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must be a non-empty array`)
  }

  return value.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new Error(`${name}[${index}] must be an object`)
    }
    const rawFormula = typeof item.formula === 'string' ? item.formula.trim() : ''
    if (rawFormula.length === 0) {
      throw new Error(`${name}[${index}].formula is required`)
    }
    const parsed = parseExplicitThermoFormula(rawFormula)
    if (!parsed) {
      throw new Error(`${name}[${index}].formula must be a valid formula with explicit state, e.g. H2O(l)`)
    }
    if (!hasThermodynamicData(parsed.formula, parsed.state)) {
      throw new Error(`No verified thermodynamic data for ${rawFormula}`)
    }
    return {
      formula: rawFormula.replace(/\s+/g, ''),
      coefficient: requirePositiveInteger(`${name}[${index}].coefficient`, item.coefficient),
    }
  })
}

const calculate_delta_g: VerifiedTool = {
  name: 'calculate_delta_g',
  description: 'Calculate Gibbs free energy change from enthalpy, entropy, and temperature. Use when the user asks for delta G or spontaneity from delta H and delta S.',
  input_schema: {
    type: 'object',
    properties: {
      deltaH: { type: 'number', description: 'Enthalpy change in kJ/mol' },
      deltaS: { type: 'number', description: 'Entropy change in J/(mol*K)' },
      temperature_K: { type: 'number', description: 'Temperature in Kelvin (K). Default: 298.15 K' },
    },
    required: ['deltaH', 'deltaS'],
  },
  citation: CITATION,
  engine: 'thermodynamics-delta-g',
  execute: (input) => {
    const deltaH = readFiniteNumber(input.deltaH)
    const deltaS = readFiniteNumber(input.deltaS)
    const temperature = readOptionalFiniteNumber(input, 'temperature_K', STANDARD_TEMPERATURE)
    if (deltaH === undefined) return err('deltaH must be a finite number in kJ/mol')
    if (deltaS === undefined) return err('deltaS must be a finite number in J/(mol*K)')
    if (temperature === undefined) return err('temperature_K must be a finite number if provided')
    if (temperature <= 0) return err('temperature_K must be a positive finite number')

    try {
      const result = calculateDeltaG(deltaH, deltaS, temperature)
      return finalizeResult({ deltaG: result.deltaG, spontaneous: result.spontaneous })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Delta G calculation failed')
    }
  },
}

const calculate_equilibrium_constant: VerifiedTool = {
  name: 'calculate_equilibrium_constant',
  description: 'Calculate the equilibrium constant K from standard Gibbs free energy change. Use when the user asks for K from delta G.',
  input_schema: {
    type: 'object',
    properties: {
      deltaG: { type: 'number', description: 'Gibbs free energy change in kJ/mol' },
      temperature_K: { type: 'number', description: 'Temperature in Kelvin (K). Default: 298.15 K' },
    },
    required: ['deltaG'],
  },
  citation: CITATION,
  engine: 'thermodynamics-equilibrium-constant',
  execute: (input) => {
    const deltaG = readFiniteNumber(input.deltaG)
    const temperature = readOptionalFiniteNumber(input, 'temperature_K', STANDARD_TEMPERATURE)
    if (deltaG === undefined) return err('deltaG must be a finite number in kJ/mol')
    if (temperature === undefined) return err('temperature_K must be a finite number if provided')
    if (temperature <= 0) return err('temperature_K must be a positive finite number')

    try {
      const result = calculateEquilibriumConstant(deltaG, temperature)
      return finalizeResult({ K: result.K })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Equilibrium constant calculation failed')
    }
  },
}

const analyze_reaction_thermodynamics: VerifiedTool = {
  name: 'analyze_reaction_thermodynamics',
  description: 'Calculate delta H, delta S, delta G, K, and spontaneity for a reaction using verified thermodynamic data. Use only when each species has an explicit physical state.',
  input_schema: {
    type: 'object',
    properties: {
      reactants: {
        type: 'array',
        description: 'Reactants with formula including explicit state and integer coefficient, e.g. H2(g)',
        items: {
          type: 'object',
          properties: {
            formula: { type: 'string', description: 'Formula with state suffix: (s), (l), (g), or (aq)' },
            coefficient: { type: 'integer', description: 'Stoichiometric coefficient' },
          },
          required: ['formula', 'coefficient'],
        },
      },
      products: {
        type: 'array',
        description: 'Products with formula including explicit state and integer coefficient, e.g. H2O(l)',
        items: {
          type: 'object',
          properties: {
            formula: { type: 'string', description: 'Formula with state suffix: (s), (l), (g), or (aq)' },
            coefficient: { type: 'integer', description: 'Stoichiometric coefficient' },
          },
          required: ['formula', 'coefficient'],
        },
      },
      temperature_K: { type: 'number', description: 'Temperature in Kelvin (K). Default: 298.15 K' },
    },
    required: ['reactants', 'products'],
  },
  citation: CITATION,
  engine: 'thermodynamics-reaction-analysis',
  execute: (input) => {
    const temperature = readOptionalFiniteNumber(input, 'temperature_K', STANDARD_TEMPERATURE)
    if (temperature === undefined) return err('temperature_K must be a finite number if provided')
    if (temperature <= 0) return err('temperature_K must be a positive finite number')

    try {
      const reactants = readSpeciesArray(input.reactants, 'reactants')
      const products = readSpeciesArray(input.products, 'products')
      const result = analyzeReaction(products, reactants, temperature)
      if (!result) {
        return err('Thermodynamic data not available for one or more species')
      }
      return finalizeResult({
        deltaH: result.deltaH,
        deltaS: result.deltaS,
        deltaG: result.deltaG,
        K: result.K,
        spontaneous: result.spontaneous,
        temperature: result.temperature,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Reaction thermodynamics analysis failed')
    }
  },
}

export const thermodynamicsTools: VerifiedTool[] = [
  calculate_delta_g,
  calculate_equilibrium_constant,
  analyze_reaction_thermodynamics,
]
