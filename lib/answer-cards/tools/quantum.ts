/**
 * VerChem Verified Answer Cards — Quantum Chemistry Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/nuclear.ts
 * CRITICAL: execute() routes to engine functions directly — no formula reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult } from './_validate'
import {
  hydrogenEnergy,
  hydrogenTransition,
  photonEnergy,
  debroglieWavelength,
  bohrRadius,
  hydrogenLikeEnergy,
  heisenbergUncertainty,
  validateQuantumNumbers,
} from '@/lib/calculations/nuclear'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 6 (Electronic Structure of Atoms); McQuarrie & Simon, Physical Chemistry: A Molecular Approach, Ch. 1'

const MAX_QUANTUM_N = 1_000
const MAX_ATOMIC_NUMBER = 118
const SPEED_OF_LIGHT_MS = 299_792_458

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function requirePositiveInteger(name: string, value: unknown, max: number): number {
  const n = readFiniteNumber(value)
  if (n === undefined || !Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  if (n > max) {
    throw new Error(`${name} is too large for a verified calculation`)
  }
  return n
}

function requireInteger(name: string, value: unknown, maxAbs: number): number {
  const n = readFiniteNumber(value)
  if (n === undefined || !Number.isInteger(n)) {
    throw new Error(`${name} must be an integer`)
  }
  if (Math.abs(n) > maxAbs) {
    throw new Error(`${name} is too large for a verified calculation`)
  }
  return n
}

const hydrogen_energy_level: VerifiedTool = {
  name: 'hydrogen_energy_level',
  description: 'Calculate the hydrogen atom energy level in eV. Use when the user provides principal quantum number n.',
  input_schema: {
    type: 'object',
    properties: {
      n: { type: 'integer', description: 'Principal quantum number, positive integer' },
    },
    required: ['n'],
  },
  citation: CITATION,
  engine: 'quantum-hydrogen-energy',
  execute: (input) => {
    try {
      const n = requirePositiveInteger('n', input.n, MAX_QUANTUM_N)
      return finalizeResult({ energyEV: hydrogenEnergy(n) })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Hydrogen energy calculation failed')
    }
  },
}

const hydrogen_transition_tool: VerifiedTool = {
  name: 'hydrogen_transition',
  description: 'Calculate energy, wavelength, frequency, spectral series, and visibility for a hydrogen electron transition.',
  input_schema: {
    type: 'object',
    properties: {
      nInitial: { type: 'integer', description: 'Initial principal quantum number' },
      nFinal: { type: 'integer', description: 'Final principal quantum number' },
    },
    required: ['nInitial', 'nFinal'],
  },
  citation: CITATION,
  engine: 'quantum-hydrogen-transition',
  execute: (input) => {
    try {
      const nInitial = requirePositiveInteger('nInitial', input.nInitial, MAX_QUANTUM_N)
      const nFinal = requirePositiveInteger('nFinal', input.nFinal, MAX_QUANTUM_N)
      if (nInitial === nFinal) return err('nInitial and nFinal must be different')
      const result = hydrogenTransition(nInitial, nFinal)
      return finalizeResult({
        nInitial: result.nInitial,
        nFinal: result.nFinal,
        energyEV: result.energyEV,
        energyJ: result.energyJ,
        wavelengthNm: result.wavelengthNm,
        frequencyHz: result.frequencyHz,
        seriesName: result.seriesName,
        isVisible: result.isVisible,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Hydrogen transition calculation failed')
    }
  },
}

const photon_energy: VerifiedTool = {
  name: 'photon_energy',
  description: 'Calculate photon energy from wavelength. Use when the user provides wavelength in nanometers.',
  input_schema: {
    type: 'object',
    properties: {
      wavelength_nm: { type: 'number', description: 'Wavelength in nanometers (nm)' },
    },
    required: ['wavelength_nm'],
  },
  citation: CITATION,
  engine: 'quantum-photon-energy',
  execute: (input) => {
    const wavelength = readFiniteNumber(input.wavelength_nm)
    if (wavelength === undefined || wavelength <= 0) return err('wavelength_nm must be a positive finite number')

    try {
      const result = photonEnergy(wavelength)
      return finalizeResult({
        energyEV: result.energyEV,
        energyJ: result.energyJ,
        energyKJmol: result.energyKJmol,
        frequencyHz: result.frequencyHz,
        wavelengthNm: result.wavelengthNm,
        region: result.region,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Photon energy calculation failed')
    }
  },
}

const de_broglie_wavelength: VerifiedTool = {
  name: 'de_broglie_wavelength',
  description: 'Calculate de Broglie wavelength from mass and velocity. Use only for non-relativistic speeds below the speed of light.',
  input_schema: {
    type: 'object',
    properties: {
      mass_kg: { type: 'number', description: 'Particle mass in kilograms (kg)' },
      velocity_ms: { type: 'number', description: 'Velocity in meters per second (m/s), magnitude below c' },
    },
    required: ['mass_kg', 'velocity_ms'],
  },
  citation: CITATION,
  engine: 'quantum-de-broglie-wavelength',
  execute: (input) => {
    const mass = readFiniteNumber(input.mass_kg)
    const velocity = readFiniteNumber(input.velocity_ms)
    if (mass === undefined || mass <= 0) return err('mass_kg must be a positive finite number')
    if (velocity === undefined || velocity === 0) return err('velocity_ms must be a non-zero finite number')
    if (Math.abs(velocity) >= SPEED_OF_LIGHT_MS) return err('velocity_ms magnitude must be less than the speed of light')

    try {
      return finalizeResult({ wavelengthM: debroglieWavelength(mass, velocity) })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'de Broglie wavelength calculation failed')
    }
  },
}

const bohr_radius_tool: VerifiedTool = {
  name: 'bohr_radius',
  description: 'Calculate Bohr radius for a hydrogen-like atom or ion. Use when n and nuclear charge Z are known.',
  input_schema: {
    type: 'object',
    properties: {
      n: { type: 'integer', description: 'Principal quantum number' },
      Z: { type: 'integer', description: 'Nuclear charge, 1 to 118' },
    },
    required: ['n', 'Z'],
  },
  citation: CITATION,
  engine: 'quantum-bohr-radius',
  execute: (input) => {
    try {
      const n = requirePositiveInteger('n', input.n, MAX_QUANTUM_N)
      const Z = requirePositiveInteger('Z', input.Z, MAX_ATOMIC_NUMBER)
      return finalizeResult({ radiusPm: bohrRadius(n, Z) })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Bohr radius calculation failed')
    }
  },
}

const hydrogen_like_energy: VerifiedTool = {
  name: 'hydrogen_like_energy',
  description: 'Calculate energy level for a hydrogen-like atom or ion. Use when n and nuclear charge Z are known.',
  input_schema: {
    type: 'object',
    properties: {
      n: { type: 'integer', description: 'Principal quantum number' },
      Z: { type: 'integer', description: 'Nuclear charge, 1 to 118' },
    },
    required: ['n', 'Z'],
  },
  citation: CITATION,
  engine: 'quantum-hydrogen-like-energy',
  execute: (input) => {
    try {
      const n = requirePositiveInteger('n', input.n, MAX_QUANTUM_N)
      const Z = requirePositiveInteger('Z', input.Z, MAX_ATOMIC_NUMBER)
      return finalizeResult({ energyEV: hydrogenLikeEnergy(n, Z) })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Hydrogen-like energy calculation failed')
    }
  },
}

const heisenberg_uncertainty: VerifiedTool = {
  name: 'heisenberg_uncertainty',
  description: 'Calculate the minimum position or momentum uncertainty from the Heisenberg uncertainty principle. Provide exactly one of deltaX_m or deltaP_kgms.',
  input_schema: {
    type: 'object',
    properties: {
      deltaX_m: { type: 'number', description: 'Position uncertainty in meters (m)' },
      deltaP_kgms: { type: 'number', description: 'Momentum uncertainty in kg*m/s' },
    },
    required: [],
  },
  citation: CITATION,
  engine: 'quantum-heisenberg-uncertainty',
  execute: (input) => {
    const hasDeltaX = input.deltaX_m !== undefined
    const hasDeltaP = input.deltaP_kgms !== undefined
    const deltaX = hasDeltaX ? readFiniteNumber(input.deltaX_m) : undefined
    const deltaP = hasDeltaP ? readFiniteNumber(input.deltaP_kgms) : undefined
    if (hasDeltaX && (deltaX === undefined || deltaX <= 0)) return err('deltaX_m must be a positive finite number if provided')
    if (hasDeltaP && (deltaP === undefined || deltaP <= 0)) return err('deltaP_kgms must be a positive finite number if provided')
    if (deltaX !== undefined && deltaP !== undefined) return err('Provide exactly one of deltaX_m or deltaP_kgms, not both')
    if (deltaX === undefined && deltaP === undefined) return err('Provide exactly one of deltaX_m or deltaP_kgms')

    try {
      const result = heisenbergUncertainty(deltaX, deltaP)
      return finalizeResult({ deltaX: result.deltaX, deltaP: result.deltaP })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Heisenberg uncertainty calculation failed')
    }
  },
}

const validate_quantum_numbers: VerifiedTool = {
  name: 'validate_quantum_numbers',
  description: 'Validate a set of quantum numbers n, l, ml, and ms. Use when the user asks whether quantum numbers are allowed.',
  input_schema: {
    type: 'object',
    properties: {
      n: { type: 'integer', description: 'Principal quantum number, positive integer' },
      l: { type: 'integer', description: 'Angular momentum quantum number' },
      ml: { type: 'integer', description: 'Magnetic quantum number' },
      ms: { type: 'number', enum: [-0.5, 0.5], description: 'Spin quantum number' },
    },
    required: ['n', 'l', 'ml', 'ms'],
  },
  citation: CITATION,
  engine: 'quantum-number-validation',
  execute: (input) => {
    const ms = readFiniteNumber(input.ms)
    if (ms !== 0.5 && ms !== -0.5) return err('ms must be +0.5 or -0.5')

    try {
      const n = requirePositiveInteger('n', input.n, MAX_QUANTUM_N)
      const l = requireInteger('l', input.l, MAX_QUANTUM_N)
      const ml = requireInteger('ml', input.ml, MAX_QUANTUM_N)
      const result = validateQuantumNumbers(n, l, ml, ms)
      return finalizeResult({ valid: result.valid, errors: result.errors, orbitalName: result.orbitalName })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Quantum number validation failed')
    }
  },
}

export const quantumTools: VerifiedTool[] = [
  hydrogen_energy_level,
  hydrogen_transition_tool,
  photon_energy,
  de_broglie_wavelength,
  bohr_radius_tool,
  hydrogen_like_energy,
  heisenberg_uncertainty,
  validate_quantum_numbers,
]
