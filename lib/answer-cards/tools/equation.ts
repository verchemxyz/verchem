/**
 * VerChem Verified Answer Cards — Equation Balancer Tool Adapter
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/equation-balancer.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { finalizeResult } from './_validate'
import { ELEMENT_SYMBOLS } from '../elements'
import {
  balanceEquation,
  identifyReactionType,
} from '@/lib/calculations/equation-balancer'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 3; Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 7'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

/** Positive integer pattern for element counts and multipliers */
const POSITIVE_INT = /^[1-9]\d*$/

/**
 * Expand parentheses in a compound string: Ca(OH)2 → CaO2H2
 * Rejects zero or invalid multipliers.
 */
function expandParentheses(formula: string): string | null {
  const regex = /\(([^)]+)\)(\d*)/g
  let result = formula
  // Limit iterations to prevent runaway
  for (let i = 0; i < 10; i++) {
    if (!regex.test(result)) break
    result = result.replace(regex, (match, group, multiplier) => {
      // Reject zero/invalid multiplier (e.g., Ca(OH)0)
      if (multiplier !== '' && !POSITIVE_INT.test(multiplier)) {
        return '\x00' // inject sentinel that will fail later
      }
      const mult = multiplier ? parseInt(multiplier) : 1
      return group.replace(/([A-Z][a-z]?)(\d*)/g, (m: string, el: string, count: string) => {
        const c = count ? parseInt(count) : 1
        return el + (c * mult)
      })
    })
  }
  // Sentinel check: if any invalid multiplier was found, return null
  if (result.includes('\x00')) return null
  return result
}

/**
 * Strictly validate a single compound.
 * Every token must be a recognized element symbol; no unknown letters remain.
 * Rejects zero-count and leading-zero subscripts (e.g., H0, H00, C0H4).
 * Rejects non-positive leading coefficients (e.g., 0H2, 00H2).
 */
function isValidCompound(compound: string): boolean {
  // Remove physical state annotations like (aq), (s), (l), (g)
  let s = compound.replace(/\s*\([aqlsg]+\)\s*/gi, '')

  // Validate leading coefficient before stripping: must be positive int
  const leadingCoeffMatch = s.match(/^(\d+)/)
  if (leadingCoeffMatch && !POSITIVE_INT.test(leadingCoeffMatch[1])) {
    return false
  }

  // Expand parentheses (rejects zero/invalid multipliers)
  const expanded = expandParentheses(s)
  if (expanded === null) return false
  s = expanded

  // Remove leading coefficient if any (now validated as positive)
  s = s.replace(/^\d+/, '')

  // Match element symbols + optional counts
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match: RegExpExecArray | null
  let consumed = 0

  while ((match = regex.exec(s)) !== null) {
    const element = match[1]
    const count = match[2]
    if (!ELEMENT_SYMBOLS.has(element)) return false
    // Reject zero-count / leading-zero / non-positive subscripts
    if (count !== '' && !POSITIVE_INT.test(count)) return false
    consumed += element.length + count.length
  }

  return consumed === s.length && consumed > 0
}

const balance_equation: VerifiedTool = {
  name: 'balance_equation',
  description: 'Balance a chemical equation and identify its reaction type. Use when the user provides an unbalanced chemical equation and asks to balance it. Input must use -> or = as the arrow.',
  input_schema: {
    type: 'object',
    properties: {
      equation: { type: 'string', description: 'Chemical equation to balance, e.g., "H2 + O2 -> H2O"' },
    },
    required: ['equation'],
  },
  citation: CITATION,
  engine: 'equation-balancer',
  execute: (input) => {
    if (typeof input.equation !== 'string' || input.equation.trim().length === 0) {
      return err('equation is required and must be a non-empty string')
    }

    // Normalize "=>" to canonical "->" — the engine parser splits on
    // /->|→|=/, so a bare "=>" would split at "=" and leak ">" into the
    // product (e.g. "2H2 + O2 → 2> H2O"). Engine already handles -> → =.
    const equation = input.equation.trim().replace(/=>/g, '->')

    // Validate arrow presence
    const arrowMatch = equation.match(/->|→|=/)
    if (!arrowMatch) {
      return err('Equation must contain an arrow (->, =>, =, or →) separating reactants and products')
    }

    const parts = equation.split(/->|→|=>|=/)
    if (parts.length !== 2) {
      return err('Equation must have exactly one set of reactants and one set of products')
    }

    // Split into individual compounds and validate EACH one
    // Do NOT filter(Boolean) — empty terms from leading/trailing/double + must be caught
    const rawTerms = equation.split(/->|→|=>|=|\+/).map((s) => s.trim())
    if (rawTerms.some((t) => t === '')) {
      return err('Equation contains empty terms (check for leading, trailing, or double + signs)')
    }
    const compounds = rawTerms.filter(Boolean)
    if (compounds.length === 0) {
      return err('No compounds found in equation')
    }

    for (const compound of compounds) {
      if (!isValidCompound(compound)) {
        return err(`Invalid compound in equation: "${compound}"`)
      }
    }

    try {
      const result = balanceEquation(equation)
      if (!result.isBalanced) {
        return err('Could not balance the provided equation. Please check the formula and format.')
      }
      // Extra guard: balanced result must have atoms recorded
      if (Object.keys(result.atoms).length === 0) {
        return err('Not a valid chemical equation')
      }
      const reactionType = identifyReactionType(equation)

      return finalizeResult({
        original: result.original,
        balanced: result.balanced,
        coefficients: result.coefficients,
        reactants: result.reactants,
        products: result.products,
        is_balanced: result.isBalanced,
        atoms: result.atoms,
        reaction_type: reactionType,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Equation balancing failed')
    }
  },
}

export const equationTools: VerifiedTool[] = [balance_equation]
