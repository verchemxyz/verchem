/**
 * VerChem Verified Answer Cards — Nuclear Chemistry Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/nuclear.ts
 * CRITICAL: execute() routes to engine functions directly — no formula reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult } from './_validate'
import {
  radioactiveDecay,
  halfLifeFromDecay,
  timeToDecay,
  decayConstant,
  bindingEnergy,
  massEnergyEquivalence,
  type HalfLifeUnit,
} from '@/lib/calculations/nuclear'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 21 (Nuclear Chemistry)'

const HALF_LIFE_UNITS = new Set<HalfLifeUnit>(['seconds', 'minutes', 'hours', 'days', 'years'])
const MAX_ATOMIC_NUMBER = 118
const MAX_MASS_NUMBER = 300

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function readHalfLifeUnit(value: unknown): HalfLifeUnit | undefined {
  if (typeof value !== 'string') return undefined
  return HALF_LIFE_UNITS.has(value as HalfLifeUnit) ? (value as HalfLifeUnit) : undefined
}

function requireNonNegativeInteger(name: string, value: unknown): number {
  const n = readFiniteNumber(value)
  if (n === undefined || !Number.isInteger(n) || n < 0) {
    throw new Error(`${name} must be a non-negative integer`)
  }
  return n
}

const radioactive_decay: VerifiedTool = {
  name: 'radioactive_decay',
  description: 'Calculate radioactive decay from initial amount, half-life, and elapsed time. Use when the half-life unit and elapsed-time unit are the same.',
  input_schema: {
    type: 'object',
    properties: {
      initial_amount: { type: 'number', description: 'Initial amount; use atoms if activity should be interpreted as Bq' },
      half_life: { type: 'number', description: 'Half-life value' },
      elapsed_time: { type: 'number', description: 'Elapsed time value' },
      half_life_unit: { type: 'string', enum: ['seconds', 'minutes', 'hours', 'days', 'years'], description: 'Unit for half_life' },
      elapsed_unit: { type: 'string', enum: ['seconds', 'minutes', 'hours', 'days', 'years'], description: 'Unit for elapsed_time' },
      amount_unit: { type: 'string', enum: ['amount', 'atoms'], description: 'Use atoms only when initial_amount is a count of atoms' },
    },
    required: ['initial_amount', 'half_life', 'elapsed_time', 'half_life_unit', 'elapsed_unit'],
  },
  citation: CITATION,
  engine: 'nuclear-radioactive-decay',
  execute: (input) => {
    const initial = readFiniteNumber(input.initial_amount)
    const halfLife = readFiniteNumber(input.half_life)
    const elapsed = readFiniteNumber(input.elapsed_time)
    const halfLifeUnit = readHalfLifeUnit(input.half_life_unit)
    const elapsedUnit = readHalfLifeUnit(input.elapsed_unit)
    if (initial === undefined || initial <= 0) return err('initial_amount must be a positive finite number')
    if (halfLife === undefined || halfLife <= 0) return err('half_life must be a positive finite number')
    if (elapsed === undefined || elapsed < 0) return err('elapsed_time must be a non-negative finite number')
    if (!halfLifeUnit) return err('half_life_unit must be one of seconds, minutes, hours, days, or years')
    if (!elapsedUnit) return err('elapsed_unit must be one of seconds, minutes, hours, days, or years')
    if (halfLifeUnit !== elapsedUnit) return err('half_life_unit and elapsed_unit must match for verified decay calculations')
    if (input.amount_unit !== undefined && input.amount_unit !== 'amount' && input.amount_unit !== 'atoms') {
      return err('amount_unit must be amount or atoms if provided')
    }

    try {
      const result = radioactiveDecay(initial, halfLife, elapsed)
      const activityUnit = input.amount_unit === 'atoms' && halfLifeUnit === 'seconds' ? 'Bq' : `${input.amount_unit === 'atoms' ? 'atoms' : 'amount'}/${halfLifeUnit}`
      return finalizeResult({
        remainingAmount: result.remainingAmount,
        decayedAmount: result.decayedAmount,
        numHalfLives: result.numHalfLives,
        activity: result.activity,
        decayConstant: result.decayConstant,
        activityUnit,
        decayConstantUnit: `1/${halfLifeUnit}`,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Radioactive decay calculation failed')
    }
  },
}

const half_life_from_decay: VerifiedTool = {
  name: 'half_life_from_decay',
  description: 'Calculate half-life from initial amount, remaining amount, and elapsed time. Use when a sample decay fraction and elapsed time are known.',
  input_schema: {
    type: 'object',
    properties: {
      initial_amount: { type: 'number', description: 'Initial amount' },
      remaining_amount: { type: 'number', description: 'Remaining amount after elapsed time' },
      elapsed_time: { type: 'number', description: 'Elapsed time; output half-life has the same time unit' },
    },
    required: ['initial_amount', 'remaining_amount', 'elapsed_time'],
  },
  citation: CITATION,
  engine: 'nuclear-half-life-from-decay',
  execute: (input) => {
    const initial = readFiniteNumber(input.initial_amount)
    const remaining = readFiniteNumber(input.remaining_amount)
    const elapsed = readFiniteNumber(input.elapsed_time)
    if (initial === undefined || initial <= 0) return err('initial_amount must be a positive finite number')
    if (remaining === undefined || remaining <= 0) return err('remaining_amount must be a positive finite number')
    if (remaining >= initial) return err('remaining_amount must be less than initial_amount')
    if (elapsed === undefined || elapsed <= 0) return err('elapsed_time must be a positive finite number')

    try {
      const halfLife = halfLifeFromDecay(initial, remaining, elapsed)
      return finalizeResult({ halfLife })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Half-life calculation failed')
    }
  },
}

const time_to_decay: VerifiedTool = {
  name: 'time_to_decay',
  description: 'Calculate time required for a sample to decay to a target amount. Use when initial amount, target amount, and half-life are known.',
  input_schema: {
    type: 'object',
    properties: {
      initial_amount: { type: 'number', description: 'Initial amount' },
      target_amount: { type: 'number', description: 'Target remaining amount' },
      half_life: { type: 'number', description: 'Half-life; output time has the same time unit' },
    },
    required: ['initial_amount', 'target_amount', 'half_life'],
  },
  citation: CITATION,
  engine: 'nuclear-time-to-decay',
  execute: (input) => {
    const initial = readFiniteNumber(input.initial_amount)
    const target = readFiniteNumber(input.target_amount)
    const halfLife = readFiniteNumber(input.half_life)
    if (initial === undefined || initial <= 0) return err('initial_amount must be a positive finite number')
    if (target === undefined || target <= 0) return err('target_amount must be a positive finite number')
    if (target > initial) return err('target_amount cannot exceed initial_amount')
    if (halfLife === undefined || halfLife <= 0) return err('half_life must be a positive finite number')

    try {
      const time = timeToDecay(initial, target, halfLife)
      return finalizeResult({ time })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Time-to-decay calculation failed')
    }
  },
}

const decay_constant_tool: VerifiedTool = {
  name: 'decay_constant',
  description: 'Calculate the radioactive decay constant from half-life. Use when the user asks for lambda from a half-life.',
  input_schema: {
    type: 'object',
    properties: {
      half_life: { type: 'number', description: 'Half-life in any consistent time unit' },
    },
    required: ['half_life'],
  },
  citation: CITATION,
  engine: 'nuclear-decay-constant',
  execute: (input) => {
    const halfLife = readFiniteNumber(input.half_life)
    if (halfLife === undefined || halfLife <= 0) return err('half_life must be a positive finite number')

    try {
      return finalizeResult({ decayConstant: decayConstant(halfLife) })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Decay constant calculation failed')
    }
  },
}

const binding_energy: VerifiedTool = {
  name: 'binding_energy',
  description: 'Calculate nuclear binding energy from proton count, neutron count, and atomic mass. Use when Z, N, and atomic mass are known.',
  input_schema: {
    type: 'object',
    properties: {
      Z: { type: 'integer', description: 'Atomic number (protons), 0 to 118' },
      N: { type: 'integer', description: 'Neutron count, non-negative' },
      atomic_mass: { type: 'number', description: 'Atomic mass in amu' },
    },
    required: ['Z', 'N', 'atomic_mass'],
  },
  citation: CITATION,
  engine: 'nuclear-binding-energy',
  execute: (input) => {
    const atomicMass = readFiniteNumber(input.atomic_mass)
    if (atomicMass === undefined || atomicMass <= 0) return err('atomic_mass must be a positive finite number')

    try {
      const Z = requireNonNegativeInteger('Z', input.Z)
      const N = requireNonNegativeInteger('N', input.N)
      if (Z > MAX_ATOMIC_NUMBER) return err('Z must be between 0 and 118')
      if (Z + N <= 0) return err('Z + N must be greater than 0')
      if (Z + N > MAX_MASS_NUMBER) return err('Z + N is too large for a verified calculation')
      const result = bindingEnergy(Z, N, atomicMass)
      return finalizeResult({ totalBE: result.totalBE, perNucleon: result.perNucleon, massDefect: result.massDefect })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Binding energy calculation failed')
    }
  },
}

const mass_energy_equivalence: VerifiedTool = {
  name: 'mass_energy_equivalence',
  description: 'Convert mass defect in amu to energy in MeV using mass-energy equivalence. Use when delta mass in amu is known.',
  input_schema: {
    type: 'object',
    properties: {
      delta_mass_amu: { type: 'number', description: 'Mass difference in atomic mass units (amu)' },
    },
    required: ['delta_mass_amu'],
  },
  citation: CITATION,
  engine: 'nuclear-mass-energy-equivalence',
  execute: (input) => {
    const deltaMass = readFiniteNumber(input.delta_mass_amu)
    if (deltaMass === undefined) return err('delta_mass_amu must be a finite number')

    try {
      return finalizeResult({ energyMeV: massEnergyEquivalence(deltaMass) })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Mass-energy equivalence calculation failed')
    }
  },
}

export const nuclearTools: VerifiedTool[] = [
  radioactive_decay,
  half_life_from_decay,
  time_to_decay,
  decay_constant_tool,
  binding_energy,
  mass_energy_equivalence,
]
