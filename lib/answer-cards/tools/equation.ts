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

/** Valid physical state suffixes */
const STATE_PATTERN = /\((?:aq|s|l|g)\)$/i

/**
 * Expand parentheses in a compound string: Ca(OH)2 → CaO2H2
 * Rejects zero/invalid multipliers and empty groups.
 * Uses iterative first-match replacement (no /g state bug).
 */
function expandParentheses(formula: string): string | null {
  let result = formula
  for (let i = 0; i < 10; i++) {
    const match = result.match(/\(([^)]+)\)(\d*)/)
    if (!match) break
    const group = match[1]
    const multiplier = match[2]
    // Reject empty group (e.g., Ca()2)
    if (group.length === 0) return null
    // Reject zero/invalid multiplier (e.g., Ca(OH)0, Ca(OH)00)
    if (multiplier !== '' && !POSITIVE_INT.test(multiplier)) return null
    const mult = multiplier ? parseInt(multiplier, 10) : 1
    const expanded = group.replace(/([A-Z][a-z]?)(\d*)/g, (_m: string, el: string, count: string) => {
      const c = count ? parseInt(count, 10) : 1
      return el + (c * mult)
    })
    result = result.slice(0, match.index) + expanded + result.slice(match.index! + match[0].length)
  }
  return result
}

/**
 * Strict canonical compound validator.
 *
 * Grammar: [coefficient]? (element[count]? | '(' group ')' [count]?)+ [state]?
 *
 * 1. Trim
 * 2. Trailing state (optional, anchored at END only, exactly one): (aq)|(s)|(l)|(g)
 * 3. Leading coefficient (optional): must be POSITIVE_INT; reject 0/leading-zero
 * 4. Expand parentheses: multiplier must be POSITIVE_INT, group non-empty
 * 5. Tokenize remainder as (element)(count?):
 *    - element ∈ ELEMENT_SYMBOLS
 *    - count (if present) must be POSITIVE_INT
 *    - consumed === length (zero leftover)
 * 6. Return true only if ≥1 element, fully consumed, no garbage.
 *
 * Philosophy: strict allow-list. Anything not matching canonical pattern → reject.
 */
function isValidCompound(compound: string): boolean {
  let s = compound.trim()
  if (s.length === 0) return false

  // Step 1: trailing state (anchored at END only, exactly one)
  const stateMatch = s.match(STATE_PATTERN)
  if (stateMatch) {
    s = s.slice(0, stateMatch.index)
  }

  // Step 2: leading coefficient (optional)
  const coeffMatch = s.match(/^(\d+)/)
  if (coeffMatch) {
    if (!POSITIVE_INT.test(coeffMatch[1])) return false
    s = s.slice(coeffMatch[1].length)
  }

  // Step 3: expand parentheses
  const expanded = expandParentheses(s)
  if (expanded === null) return false
  s = expanded

  // Step 4: strict tokenization — no leftover characters allowed
  let pos = 0
  let elementCount = 0
  while (pos < s.length) {
    // Must start with an element symbol: uppercase + optional lowercase
    const elemMatch = s.slice(pos).match(/^([A-Z][a-z]?)/)
    if (!elemMatch) return false
    const element = elemMatch[1]
    if (!ELEMENT_SYMBOLS.has(element)) return false
    pos += element.length
    elementCount++

    // Optional count
    const countMatch = s.slice(pos).match(/^(\d+)/)
    if (countMatch) {
      if (!POSITIVE_INT.test(countMatch[1])) return false
      pos += countMatch[1].length
    }
  }

  return elementCount > 0 && pos === s.length
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
