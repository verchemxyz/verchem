/**
 * VerChem Verified Answer Cards — Gas Laws Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/gas-laws.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 * W3-R4: Validates positive physical limits before calling engines (adapter layer only).
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult } from './_validate'
import {
  idealGasLaw,
  combinedGasLaw,
  boylesLaw,
  charlesLaw,
  gayLussacsLaw,
  avogadrosLaw,
  vanDerWaalsEquation,
  VAN_DER_WAALS_CONSTANTS,
} from '@/lib/calculations/gas-laws'

const CITATION = 'Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 1; Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 10'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function requirePositive(name: string, value: number | undefined): number {
  if (value === undefined || value <= 0) {
    throw new Error(`${name} must be a positive finite number`)
  }
  return value
}

const ideal_gas_law: VerifiedTool = {
  name: 'ideal_gas_law',
  description: 'Solve ideal gas law problems (PV = nRT). Use when the user asks to find pressure, volume, moles, or temperature of an ideal gas. Provide exactly 3 of the 4 variables (P, V, n, T).',
  input_schema: {
    type: 'object',
    properties: {
      P: { type: 'number', description: 'Pressure (atm)' },
      V: { type: 'number', description: 'Volume (L)' },
      n: { type: 'number', description: 'Moles (mol)' },
      T: { type: 'number', description: 'Temperature (K)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'ideal-gas',
  execute: (input) => {
    try {
      const args = {
        P: readFiniteNumber(input.P),
        V: readFiniteNumber(input.V),
        n: readFiniteNumber(input.n),
        T: readFiniteNumber(input.T),
      }
      // Validate known values are positive
      if (args.P !== undefined) requirePositive('Pressure', args.P)
      if (args.V !== undefined) requirePositive('Volume', args.V)
      if (args.n !== undefined) requirePositive('Moles', args.n)
      if (args.T !== undefined) requirePositive('Temperature', args.T)

      const result = idealGasLaw(args)
      return finalizeResult({
        P: result.P,
        V: result.V,
        n: result.n,
        T: result.T,
        R: result.R,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Ideal gas law calculation failed')
    }
  },
}

const combined_gas_law: VerifiedTool = {
  name: 'combined_gas_law',
  description: 'Solve combined gas law problems ((P1V1)/T1 = (P2V2)/T2). Use when a gas undergoes a change in conditions. Provide exactly 5 of the 6 variables.',
  input_schema: {
    type: 'object',
    properties: {
      P1: { type: 'number', description: 'Initial pressure (atm)' },
      V1: { type: 'number', description: 'Initial volume (L)' },
      T1: { type: 'number', description: 'Initial temperature (K)' },
      P2: { type: 'number', description: 'Final pressure (atm)' },
      V2: { type: 'number', description: 'Final volume (L)' },
      T2: { type: 'number', description: 'Final temperature (K)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'combined-gas',
  execute: (input) => {
    try {
      const args = {
        P1: readFiniteNumber(input.P1),
        V1: readFiniteNumber(input.V1),
        T1: readFiniteNumber(input.T1),
        P2: readFiniteNumber(input.P2),
        V2: readFiniteNumber(input.V2),
        T2: readFiniteNumber(input.T2),
      }
      if (args.P1 !== undefined) requirePositive('P1', args.P1)
      if (args.V1 !== undefined) requirePositive('V1', args.V1)
      if (args.T1 !== undefined) requirePositive('T1', args.T1)
      if (args.P2 !== undefined) requirePositive('P2', args.P2)
      if (args.V2 !== undefined) requirePositive('V2', args.V2)
      if (args.T2 !== undefined) requirePositive('T2', args.T2)

      const result = combinedGasLaw(args)
      return finalizeResult({
        P1: result.P1,
        V1: result.V1,
        T1: result.T1,
        P2: result.P2,
        V2: result.V2,
        T2: result.T2,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Combined gas law calculation failed')
    }
  },
}

const boyles_law: VerifiedTool = {
  name: 'boyles_law',
  description: "Solve Boyle's law problems (P1V1 = P2V2) at constant temperature and moles. Provide exactly 3 of the 4 variables.",
  input_schema: {
    type: 'object',
    properties: {
      P1: { type: 'number', description: 'Initial pressure (atm)' },
      V1: { type: 'number', description: 'Initial volume (L)' },
      P2: { type: 'number', description: 'Final pressure (atm)' },
      V2: { type: 'number', description: 'Final volume (L)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'boyles-law',
  execute: (input) => {
    try {
      const P1 = readFiniteNumber(input.P1)
      const V1 = readFiniteNumber(input.V1)
      const P2 = readFiniteNumber(input.P2)
      const V2 = readFiniteNumber(input.V2)
      if (P1 !== undefined) requirePositive('P1', P1)
      if (V1 !== undefined) requirePositive('V1', V1)
      if (P2 !== undefined) requirePositive('P2', P2)
      if (V2 !== undefined) requirePositive('V2', V2)

      const result = boylesLaw(P1, V1, P2, V2)
      return finalizeResult({ P1: result.P1, V1: result.V1, P2: result.P2, V2: result.V2 })
    } catch (e) {
      return err(e instanceof Error ? e.message : "Boyle's law calculation failed")
    }
  },
}

const charles_law: VerifiedTool = {
  name: 'charles_law',
  description: "Solve Charles's law problems (V1/T1 = V2/T2) at constant pressure and moles. Provide exactly 3 of the 4 variables.",
  input_schema: {
    type: 'object',
    properties: {
      V1: { type: 'number', description: 'Initial volume (L)' },
      T1: { type: 'number', description: 'Initial temperature (K)' },
      V2: { type: 'number', description: 'Final volume (L)' },
      T2: { type: 'number', description: 'Final temperature (K)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'charles-law',
  execute: (input) => {
    try {
      const V1 = readFiniteNumber(input.V1)
      const T1 = readFiniteNumber(input.T1)
      const V2 = readFiniteNumber(input.V2)
      const T2 = readFiniteNumber(input.T2)
      if (V1 !== undefined) requirePositive('V1', V1)
      if (T1 !== undefined) requirePositive('T1', T1)
      if (V2 !== undefined) requirePositive('V2', V2)
      if (T2 !== undefined) requirePositive('T2', T2)

      const result = charlesLaw(V1, T1, V2, T2)
      return finalizeResult({ V1: result.V1, T1: result.T1, V2: result.V2, T2: result.T2 })
    } catch (e) {
      return err(e instanceof Error ? e.message : "Charles's law calculation failed")
    }
  },
}

const gay_lussac_law: VerifiedTool = {
  name: 'gay_lussac_law',
  description: "Solve Gay-Lussac's law problems (P1/T1 = P2/T2) at constant volume and moles. Provide exactly 3 of the 4 variables.",
  input_schema: {
    type: 'object',
    properties: {
      P1: { type: 'number', description: 'Initial pressure (atm)' },
      T1: { type: 'number', description: 'Initial temperature (K)' },
      P2: { type: 'number', description: 'Final pressure (atm)' },
      T2: { type: 'number', description: 'Final temperature (K)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'gay-lussac-law',
  execute: (input) => {
    try {
      const P1 = readFiniteNumber(input.P1)
      const T1 = readFiniteNumber(input.T1)
      const P2 = readFiniteNumber(input.P2)
      const T2 = readFiniteNumber(input.T2)
      if (P1 !== undefined) requirePositive('P1', P1)
      if (T1 !== undefined) requirePositive('T1', T1)
      if (P2 !== undefined) requirePositive('P2', P2)
      if (T2 !== undefined) requirePositive('T2', T2)

      const result = gayLussacsLaw(P1, T1, P2, T2)
      return finalizeResult({ P1: result.P1, T1: result.T1, P2: result.P2, T2: result.T2 })
    } catch (e) {
      return err(e instanceof Error ? e.message : "Gay-Lussac's law calculation failed")
    }
  },
}

const avogadro_law: VerifiedTool = {
  name: 'avogadro_law',
  description: "Solve Avogadro's law problems (V1/n1 = V2/n2) at constant pressure and temperature. Provide exactly 3 of the 4 variables.",
  input_schema: {
    type: 'object',
    properties: {
      V1: { type: 'number', description: 'Initial volume (L)' },
      n1: { type: 'number', description: 'Initial moles (mol)' },
      V2: { type: 'number', description: 'Final volume (L)' },
      n2: { type: 'number', description: 'Final moles (mol)' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'avogadro-law',
  execute: (input) => {
    try {
      const V1 = readFiniteNumber(input.V1)
      const n1 = readFiniteNumber(input.n1)
      const V2 = readFiniteNumber(input.V2)
      const n2 = readFiniteNumber(input.n2)
      if (V1 !== undefined) requirePositive('V1', V1)
      if (n1 !== undefined) requirePositive('n1', n1)
      if (V2 !== undefined) requirePositive('V2', V2)
      if (n2 !== undefined) requirePositive('n2', n2)

      const result = avogadrosLaw(V1, n1, V2, n2)
      return finalizeResult({ V1: result.V1, n1: result.n1, V2: result.V2, n2: result.n2 })
    } catch (e) {
      return err(e instanceof Error ? e.message : "Avogadro's law calculation failed")
    }
  },
}

const van_der_waals: VerifiedTool = {
  name: 'van_der_waals',
  description: 'Calculate pressure of a real gas using the Van der Waals equation. Use when the user asks for pressure of a real gas given moles, volume, temperature, and Van der Waals constants (or gas name).',
  input_schema: {
    type: 'object',
    properties: {
      n: { type: 'number', description: 'Moles (mol)' },
      V: { type: 'number', description: 'Volume (L)' },
      T: { type: 'number', description: 'Temperature (K)' },
      a: { type: 'number', description: 'Van der Waals constant a (L²·atm/mol²)' },
      b: { type: 'number', description: 'Van der Waals constant b (L/mol)' },
      gas_name: { type: 'string', description: 'Optional gas name to lookup constants (e.g., CO2, N2, H2O)' },
    },
    required: ['n', 'V', 'T'],
  },
  citation: CITATION,
  engine: 'van-der-waals',
  execute: (input) => {
    const n = readFiniteNumber(input.n)
    const V = readFiniteNumber(input.V)
    const T = readFiniteNumber(input.T)
    if (n === undefined || n <= 0) return err('n must be a positive finite number')
    if (V === undefined || V <= 0) return err('V must be a positive finite number')
    if (T === undefined || T <= 0) return err('T must be a positive finite number (K)')

    let a: number | undefined
    let b: number | undefined
    if (typeof input.a === 'number' && Number.isFinite(input.a) && typeof input.b === 'number' && Number.isFinite(input.b)) {
      a = input.a
      b = input.b
    } else if (typeof input.gas_name === 'string') {
      const gasName = input.gas_name.trim()
      const key = Object.keys(VAN_DER_WAALS_CONSTANTS).find(
        (k) => k.toLowerCase() === gasName.toLowerCase()
      )
      if (key) {
        const constants = VAN_DER_WAALS_CONSTANTS[key as keyof typeof VAN_DER_WAALS_CONSTANTS]
        a = constants.a
        b = constants.b
      }
    }

    if (a === undefined || b === undefined) {
      return err('Van der Waals constants (a, b) are required, or provide a known gas_name')
    }
    if (a <= 0) return err('Van der Waals constant a must be positive')
    if (b <= 0) return err('Van der Waals constant b must be positive')

    try {
      const pressure = vanDerWaalsEquation({ n, V, T, a, b })
      return finalizeResult({ pressure, unit: 'atm', a, b })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Van der Waals calculation failed')
    }
  },
}

export const gasTools: VerifiedTool[] = [
  ideal_gas_law,
  combined_gas_law,
  boyles_law,
  charles_law,
  gay_lussac_law,
  avogadro_law,
  van_der_waals,
]
