/**
 * AI Chemistry Tutor - Context Builder
 *
 * Builds rich context from calculator results for AI explanations
 * This is the KEY differentiator from ChatGPT!
 *
 * Last Updated: 2025-12-02
 */

import type { CalculatorContext, CalculatorId } from './types'
import { CALCULATOR_NAMES, CALCULATOR_CONCEPTS } from './constants'

/**
 * Build context string for AI from calculator state
 */
export function buildContextPrompt(context: CalculatorContext): string {
  const parts: string[] = []

  // Calculator identification
  parts.push(`CALCULATOR CONTEXT:`)
  parts.push(`Tool: ${context.calculatorName}`)

  // Input values
  if (Object.keys(context.inputs).length > 0) {
    parts.push(`\nUSER INPUTS:`)
    for (const [key, value] of Object.entries(context.inputs)) {
      parts.push(`- ${formatKey(key)}: ${formatValue(value)}`)
    }
  }

  // Result
  if (context.result !== undefined && context.result !== null) {
    parts.push(`\nCALCULATION RESULT:`)
    parts.push(formatResult(context.result))
  }

  // Formula used
  if (context.formula) {
    parts.push(`\nFORMULA APPLIED: ${context.formula}`)
  }

  // Related concepts
  if (context.relatedConcepts.length > 0) {
    parts.push(`\nRELATED CONCEPTS: ${context.relatedConcepts.join(', ')}`)
  }

  return parts.join('\n')
}

/**
 * Create calculator context from page state
 */
export function createCalculatorContext(
  calculatorId: CalculatorId,
  inputs: Record<string, unknown>,
  result: unknown,
  formula?: string
): CalculatorContext {
  return {
    calculatorId,
    calculatorName: CALCULATOR_NAMES[calculatorId],
    inputs: sanitizeInputs(inputs),
    result,
    formula,
    relatedConcepts: CALCULATOR_CONCEPTS[calculatorId] || [],
  }
}

/**
 * Specific context builders for each calculator type
 */
export const contextBuilders = {
  'equation-balancer': (data: {
    equation: string
    balanced?: string
    coefficients?: number[]
    reactionType?: string
  }): CalculatorContext => ({
    calculatorId: 'equation-balancer',
    calculatorName: CALCULATOR_NAMES['equation-balancer'],
    inputs: { equation: data.equation },
    result: {
      balanced: data.balanced,
      coefficients: data.coefficients,
      reactionType: data.reactionType,
    },
    formula: 'Conservation of Mass: atoms(reactants) = atoms(products)',
    relatedConcepts: CALCULATOR_CONCEPTS['equation-balancer'],
  }),

  stoichiometry: (data: {
    mode: string
    reactant?: string
    product?: string
    mass?: number
    moles?: number
    result?: unknown
  }): CalculatorContext => ({
    calculatorId: 'stoichiometry',
    calculatorName: CALCULATOR_NAMES.stoichiometry,
    inputs: {
      mode: data.mode,
      reactant: data.reactant || '',
      product: data.product || '',
      mass: data.mass || 0,
      moles: data.moles || 0,
    },
    result: data.result,
    formula: 'n = m/M (moles = mass/molar mass)',
    relatedConcepts: CALCULATOR_CONCEPTS.stoichiometry,
  }),

  solutions: (data: {
    mode: string
    concentration?: number
    volume?: number
    pH?: number
    Ka?: number
    result?: unknown
  }): CalculatorContext => ({
    calculatorId: 'solutions',
    calculatorName: CALCULATOR_NAMES.solutions,
    inputs: {
      mode: data.mode,
      concentration: data.concentration || 0,
      volume: data.volume || 0,
      Ka: data.Ka || 0,
    },
    result: data.result,
    formula: getPHFormula(data.mode),
    relatedConcepts: CALCULATOR_CONCEPTS.solutions,
  }),

  'gas-laws': (data: {
    mode: string
    P?: number
    V?: number
    T?: number
    n?: number
    result?: unknown
  }): CalculatorContext => ({
    calculatorId: 'gas-laws',
    calculatorName: CALCULATOR_NAMES['gas-laws'],
    inputs: {
      mode: data.mode,
      P: data.P || 0,
      V: data.V || 0,
      T: data.T || 0,
      n: data.n || 0,
    },
    result: data.result,
    formula: getGasLawFormula(data.mode),
    relatedConcepts: CALCULATOR_CONCEPTS['gas-laws'],
  }),

  thermodynamics: (data: {
    deltaH?: number
    deltaS?: number
    T?: number
    deltaG?: number
    result?: unknown
  }): CalculatorContext => ({
    calculatorId: 'thermodynamics',
    calculatorName: CALCULATOR_NAMES.thermodynamics,
    inputs: {
      deltaH: data.deltaH || 0,
      deltaS: data.deltaS || 0,
      T: data.T || 298,
    },
    result: data.result,
    formula: 'ΔG = ΔH - TΔS',
    relatedConcepts: CALCULATOR_CONCEPTS.thermodynamics,
  }),

  kinetics: (data: {
    order?: number
    k?: number
    initialConc?: number
    time?: number
    result?: unknown
  }): CalculatorContext => ({
    calculatorId: 'kinetics',
    calculatorName: CALCULATOR_NAMES.kinetics,
    inputs: {
      order: data.order || 1,
      k: data.k || 0,
      initialConc: data.initialConc || 0,
      time: data.time || 0,
    },
    result: data.result,
    formula: getKineticsFormula(data.order || 1),
    relatedConcepts: CALCULATOR_CONCEPTS.kinetics,
  }),

  electrochemistry: (data: {
    mode: string
    E1?: number
    E2?: number
    n?: number
    Q?: number
    result?: unknown
  }): CalculatorContext => ({
    calculatorId: 'electrochemistry',
    calculatorName: CALCULATOR_NAMES.electrochemistry,
    inputs: {
      mode: data.mode,
      E1: data.E1 || 0,
      E2: data.E2 || 0,
      n: data.n || 0,
      Q: data.Q || 0,
    },
    result: data.result,
    formula: 'E°cell = E°cathode - E°anode',
    relatedConcepts: CALCULATOR_CONCEPTS.electrochemistry,
  }),

  'electron-config': (data: {
    element?: string
    atomicNumber?: number
    config?: string
  }): CalculatorContext => ({
    calculatorId: 'electron-config',
    calculatorName: CALCULATOR_NAMES['electron-config'],
    inputs: {
      element: data.element || '',
      atomicNumber: data.atomicNumber || 0,
    },
    result: { configuration: data.config },
    formula: 'Aufbau: 1s → 2s → 2p → 3s → 3p → 4s → 3d → ...',
    relatedConcepts: CALCULATOR_CONCEPTS['electron-config'],
  }),
}

// Helper functions

function formatKey(key: string): string {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    // Format numbers nicely
    if (Number.isInteger(value)) return value.toString()
    return value.toFixed(4).replace(/\.?0+$/, '')
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

function formatResult(result: unknown): string {
  if (result === null || result === undefined) return 'No result'

  if (typeof result === 'object') {
    const lines: string[] = []
    for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
      if (value !== undefined && value !== null) {
        lines.push(`- ${formatKey(key)}: ${formatValue(value)}`)
      }
    }
    return lines.join('\n')
  }

  return formatValue(result)
}

function sanitizeInputs(inputs: Record<string, unknown>): Record<string, number | string | boolean> {
  const sanitized: Record<string, number | string | boolean> = {}
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      sanitized[key] = value
    } else if (value !== null && value !== undefined) {
      sanitized[key] = String(value)
    }
  }
  return sanitized
}

function getPHFormula(mode: string): string {
  switch (mode) {
    case 'strong-acid':
      return 'pH = -log[H+] (for strong acids, [H+] = concentration)'
    case 'strong-base':
      return 'pOH = -log[OH-], pH = 14 - pOH'
    case 'weak-acid':
      return 'Ka = [H+][A-]/[HA], pH = -log[H+]'
    case 'weak-base':
      return 'Kb = [BH+][OH-]/[B], pOH = -log[OH-]'
    case 'buffer':
      return 'pH = pKa + log([A-]/[HA]) (Henderson-Hasselbalch)'
    default:
      return 'pH = -log[H+]'
  }
}

function getGasLawFormula(mode: string): string {
  switch (mode) {
    case 'ideal':
      return 'PV = nRT'
    case 'combined':
      return 'P₁V₁/T₁ = P₂V₂/T₂'
    case 'boyle':
      return 'P₁V₁ = P₂V₂ (constant T, n)'
    case 'charles':
      return 'V₁/T₁ = V₂/T₂ (constant P, n)'
    case 'dalton':
      return 'P_total = P₁ + P₂ + P₃ + ...'
    case 'van-der-waals':
      return '(P + an²/V²)(V - nb) = nRT'
    default:
      return 'PV = nRT'
  }
}

function getKineticsFormula(order: number): string {
  switch (order) {
    case 0:
      return '[A] = [A]₀ - kt, t½ = [A]₀/2k'
    case 1:
      return 'ln[A] = ln[A]₀ - kt, t½ = 0.693/k'
    case 2:
      return '1/[A] = 1/[A]₀ + kt, t½ = 1/(k[A]₀)'
    default:
      return 'Rate = k[A]ⁿ'
  }
}
