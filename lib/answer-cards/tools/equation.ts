/**
 * VerChem Verified Answer Cards — Equation Balancer Tool Adapter
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/equation-balancer.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { finalizeResult } from './_validate'
import { isValidCompound } from './_formula'
import {
  balanceEquation,
  identifyReactionType,
} from '@/lib/calculations/equation-balancer'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 3; Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 7'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
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
