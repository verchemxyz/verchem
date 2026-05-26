/**
 * VerChem Verified Answer Cards — Chemical Kinetics Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/kinetics.ts
 * CRITICAL: execute() routes to engine functions directly — no formula reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult } from './_validate'
import {
  arrheniusEquation,
  calculateActivationEnergy,
  calculateRateConstant,
  calculateConcentration,
  type RateOrder,
} from '@/lib/calculations/kinetics'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 14 (Chemical Kinetics); Atkins & de Paula, Physical Chemistry (11th ed.), Focus 17 (Chemical Kinetics)'

const RATE_ORDERS = new Set<RateOrder>(['zero', 'first', 'second'])

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function readRateOrder(value: unknown): RateOrder | undefined {
  if (typeof value !== 'string') return undefined
  return RATE_ORDERS.has(value as RateOrder) ? (value as RateOrder) : undefined
}

const arrhenius_rate_constant: VerifiedTool = {
  name: 'arrhenius_rate_constant',
  description: 'Calculate a rate constant from the Arrhenius equation. Use when the user provides A, activation energy, and temperature.',
  input_schema: {
    type: 'object',
    properties: {
      A: { type: 'number', description: 'Pre-exponential factor, same units as k' },
      Ea: { type: 'number', description: 'Activation energy in J/mol' },
      temperature_K: { type: 'number', description: 'Temperature in Kelvin (K)' },
    },
    required: ['A', 'Ea', 'temperature_K'],
  },
  citation: CITATION,
  engine: 'kinetics-arrhenius',
  execute: (input) => {
    const A = readFiniteNumber(input.A)
    const Ea = readFiniteNumber(input.Ea)
    const temperature = readFiniteNumber(input.temperature_K)
    if (A === undefined || A <= 0) return err('A must be a positive finite number')
    if (Ea === undefined) return err('Ea must be a finite number in J/mol')
    if (temperature === undefined || temperature <= 0) return err('temperature_K must be a positive finite number')

    try {
      const result = arrheniusEquation(A, Ea, temperature)
      return finalizeResult({ k: result.k, A: result.A, Ea: result.Ea, temperature: result.temperature })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Arrhenius rate constant calculation failed')
    }
  },
}

const calculate_activation_energy: VerifiedTool = {
  name: 'calculate_activation_energy',
  description: 'Calculate activation energy from two rate constants at two temperatures. Use when the user provides k1, k2, T1, and T2.',
  input_schema: {
    type: 'object',
    properties: {
      k1: { type: 'number', description: 'Rate constant at T1' },
      k2: { type: 'number', description: 'Rate constant at T2' },
      T1: { type: 'number', description: 'Temperature 1 in Kelvin (K)' },
      T2: { type: 'number', description: 'Temperature 2 in Kelvin (K)' },
    },
    required: ['k1', 'k2', 'T1', 'T2'],
  },
  citation: CITATION,
  engine: 'kinetics-activation-energy',
  execute: (input) => {
    const k1 = readFiniteNumber(input.k1)
    const k2 = readFiniteNumber(input.k2)
    const T1 = readFiniteNumber(input.T1)
    const T2 = readFiniteNumber(input.T2)
    if (k1 === undefined || k1 <= 0) return err('k1 must be a positive finite number')
    if (k2 === undefined || k2 <= 0) return err('k2 must be a positive finite number')
    if (T1 === undefined || T1 <= 0) return err('T1 must be a positive finite number')
    if (T2 === undefined || T2 <= 0) return err('T2 must be a positive finite number')
    if (T1 === T2) return err('T1 and T2 must be different')

    try {
      const result = calculateActivationEnergy(k1, T1, k2, T2)
      if (!result) return err('Activation energy calculation failed for the provided values')
      return finalizeResult({ Ea: result.Ea, EaKJ: result.EaKJ, A: result.A })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Activation energy calculation failed')
    }
  },
}

const calculate_rate_constant_tool: VerifiedTool = {
  name: 'calculate_rate_constant',
  description: 'Calculate a rate constant from an integrated zero-, first-, or second-order rate law. Use when initial and final concentrations and time are known.',
  input_schema: {
    type: 'object',
    properties: {
      order: { type: 'string', enum: ['zero', 'first', 'second'], description: 'Reaction order' },
      initial_concentration: { type: 'number', description: 'Initial concentration in M' },
      final_concentration: { type: 'number', description: 'Final concentration in M' },
      time: { type: 'number', description: 'Elapsed time in seconds' },
    },
    required: ['order', 'initial_concentration', 'final_concentration', 'time'],
  },
  citation: CITATION,
  engine: 'kinetics-rate-constant',
  execute: (input) => {
    const order = readRateOrder(input.order)
    const initial = readFiniteNumber(input.initial_concentration)
    const final = readFiniteNumber(input.final_concentration)
    const time = readFiniteNumber(input.time)
    if (!order) return err('order must be one of zero, first, or second')
    if (initial === undefined || initial <= 0) return err('initial_concentration must be a positive finite number')
    if (final === undefined) return err('final_concentration must be a finite number')
    if (final < 0) return err('final_concentration must be non-negative')
    if (final > initial) return err('final_concentration cannot exceed initial_concentration')
    if ((order === 'first' || order === 'second') && final <= 0) {
      return err('final_concentration must be positive for first- and second-order reactions')
    }
    if (time === undefined || time <= 0) return err('time must be a positive finite number')

    try {
      const result = calculateRateConstant(order, initial, final, time)
      if (!result) return err('Rate constant calculation failed for the provided values')
      return finalizeResult({ k: result.k })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Rate constant calculation failed')
    }
  },
}

const calculate_concentration_at_time: VerifiedTool = {
  name: 'calculate_concentration_at_time',
  description: 'Calculate concentration at a later time using an integrated zero-, first-, or second-order rate law. Use when initial concentration, k, and time are known.',
  input_schema: {
    type: 'object',
    properties: {
      order: { type: 'string', enum: ['zero', 'first', 'second'], description: 'Reaction order' },
      initial_concentration: { type: 'number', description: 'Initial concentration in M' },
      k: { type: 'number', description: 'Rate constant with units appropriate for the order' },
      time: { type: 'number', description: 'Elapsed time in seconds' },
    },
    required: ['order', 'initial_concentration', 'k', 'time'],
  },
  citation: CITATION,
  engine: 'kinetics-concentration-at-time',
  execute: (input) => {
    const order = readRateOrder(input.order)
    const initial = readFiniteNumber(input.initial_concentration)
    const k = readFiniteNumber(input.k)
    const time = readFiniteNumber(input.time)
    if (!order) return err('order must be one of zero, first, or second')
    if (initial === undefined || initial <= 0) return err('initial_concentration must be a positive finite number')
    if (k === undefined || k <= 0) return err('k must be a positive finite number')
    if (time === undefined || time < 0) return err('time must be a non-negative finite number')

    try {
      const result = calculateConcentration(order, initial, k, time)
      return finalizeResult({
        order: result.order,
        k: result.k,
        concentration: result.concentration,
        time: result.time,
        halfLife: result.halfLife,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Concentration-at-time calculation failed')
    }
  },
}

export const kineticsTools: VerifiedTool[] = [
  arrhenius_rate_constant,
  calculate_activation_energy,
  calculate_rate_constant_tool,
  calculate_concentration_at_time,
]
