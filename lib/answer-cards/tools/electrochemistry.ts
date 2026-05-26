/**
 * VerChem Verified Answer Cards — Electrochemistry Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/electrochemistry.ts
 * CRITICAL: execute() routes to engine functions directly — no formula reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, readOptionalFiniteNumber, finalizeResult } from './_validate'
import {
  calculateCellPotential,
  calculateNernstEquation,
  calculateElectrolysis,
  ROOM_TEMPERATURE,
} from '@/lib/calculations/electrochemistry'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 20 (Electrochemistry); Atkins & de Paula, Physical Chemistry (11th ed.), Focus 6 (Chemical Equilibrium - electrochemical cells)'

const MAX_ELECTRONS = 1_000

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function requirePositiveInteger(name: string, value: unknown): number | undefined {
  const n = readFiniteNumber(value)
  if (n === undefined) return undefined
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  if (n > MAX_ELECTRONS) {
    throw new Error(`${name} is too large for a verified calculation`)
  }
  return n
}

const calculate_cell_potential: VerifiedTool = {
  name: 'calculate_cell_potential',
  description: 'Calculate standard cell potential and delta G from cathode and anode reduction potentials. Use when the user provides E cathode, E anode, and electron count.',
  input_schema: {
    type: 'object',
    properties: {
      cathode_potential: { type: 'number', description: 'Cathode reduction potential in volts (V)' },
      anode_potential: { type: 'number', description: 'Anode reduction potential in volts (V)' },
      n: { type: 'integer', description: 'Number of electrons transferred' },
    },
    required: ['cathode_potential', 'anode_potential', 'n'],
  },
  citation: CITATION,
  engine: 'electrochemistry-cell-potential',
  execute: (input) => {
    const cathode = readFiniteNumber(input.cathode_potential)
    const anode = readFiniteNumber(input.anode_potential)
    if (cathode === undefined) return err('cathode_potential must be a finite number')
    if (anode === undefined) return err('anode_potential must be a finite number')

    try {
      const n = requirePositiveInteger('n', input.n)
      if (n === undefined) return err('n must be a positive integer')
      const result = calculateCellPotential(cathode, anode, n)
      return finalizeResult({
        cellPotential: result.cellPotential,
        spontaneous: result.spontaneous,
        deltaG: result.deltaG,
        electrons: result.electrons,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Cell potential calculation failed')
    }
  },
}

const calculate_nernst: VerifiedTool = {
  name: 'calculate_nernst',
  description: 'Calculate non-standard cell potential using the Nernst equation. Use when the user provides E0, electron count, reaction quotient Q, and optional temperature.',
  input_schema: {
    type: 'object',
    properties: {
      E0: { type: 'number', description: 'Standard cell potential in volts (V)' },
      n: { type: 'integer', description: 'Number of electrons transferred' },
      Q: { type: 'number', description: 'Reaction quotient, positive and unitless' },
      temperature_K: { type: 'number', description: 'Temperature in Kelvin (K). Default: 298.15 K' },
    },
    required: ['E0', 'n', 'Q'],
  },
  citation: CITATION,
  engine: 'electrochemistry-nernst',
  execute: (input) => {
    const E0 = readFiniteNumber(input.E0)
    const Q = readFiniteNumber(input.Q)
    const temperature = readOptionalFiniteNumber(input, 'temperature_K', ROOM_TEMPERATURE)
    if (E0 === undefined) return err('E0 must be a finite number')
    if (Q === undefined || Q <= 0) return err('Q must be a positive finite number')
    if (temperature === undefined) return err('temperature_K must be a finite number if provided')
    if (temperature <= 0) return err('temperature_K must be a positive finite number')

    try {
      const n = requirePositiveInteger('n', input.n)
      if (n === undefined) return err('n must be a positive integer')
      const result = calculateNernstEquation(E0, n, Q, temperature)
      return finalizeResult({ E0: result.E0, E: result.E, n: result.n, Q: result.Q, temperature: result.temperature })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Nernst equation calculation failed')
    }
  },
}

const calculate_electrolysis: VerifiedTool = {
  name: 'calculate_electrolysis',
  description: 'Calculate charge, moles, mass, and optional gas volume from electrolysis using Faradays laws. Use when current, time, electron count, and molar mass are known.',
  input_schema: {
    type: 'object',
    properties: {
      current: { type: 'number', description: 'Current in amperes (A)' },
      time: { type: 'number', description: 'Time in seconds (s)' },
      n: { type: 'integer', description: 'Electrons per mole of substance' },
      molar_mass: { type: 'number', description: 'Molar mass in g/mol' },
      is_gas: { type: 'boolean', description: 'Whether to include gas volume at STP' },
    },
    required: ['current', 'time', 'n', 'molar_mass'],
  },
  citation: CITATION,
  engine: 'electrochemistry-electrolysis',
  execute: (input) => {
    const current = readFiniteNumber(input.current)
    const time = readFiniteNumber(input.time)
    const molarMass = readFiniteNumber(input.molar_mass)
    if (current === undefined || current <= 0) return err('current must be a positive finite number')
    if (time === undefined || time <= 0) return err('time must be a positive finite number')
    if (molarMass === undefined || molarMass <= 0) return err('molar_mass must be a positive finite number')
    if (input.is_gas !== undefined && typeof input.is_gas !== 'boolean') {
      return err('is_gas must be a boolean if provided')
    }

    try {
      const n = requirePositiveInteger('n', input.n)
      if (n === undefined) return err('n must be a positive integer')
      const result = calculateElectrolysis(current, time, n, molarMass, input.is_gas === true)
      return finalizeResult({
        charge: result.charge,
        moles: result.moles,
        mass: result.mass,
        volume: result.volume,
        time: result.time,
        current: result.current,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Electrolysis calculation failed')
    }
  },
}

export const electrochemistryTools: VerifiedTool[] = [
  calculate_cell_potential,
  calculate_nernst,
  calculate_electrolysis,
]
