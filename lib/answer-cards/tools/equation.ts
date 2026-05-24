/**
 * VerChem Verified Answer Cards — Equation Balancer Tool Adapter
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/equation-balancer.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { finalizeResult } from './_validate'
import {
  balanceEquation,
  identifyReactionType,
} from '@/lib/calculations/equation-balancer'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 3; Atkins & de Paula, Physical Chemistry (11th ed.), Ch. 7'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

/** Recognized element symbols for strict validation */
const ELEMENT_SYMBOLS = new Set([
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
  'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds',
  'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
])

/**
 * Expand parentheses in a compound string: Ca(OH)2 → CaO2H2
 */
function expandParentheses(formula: string): string {
  const regex = /\(([^)]+)\)(\d*)/g
  let result = formula
  // Limit iterations to prevent runaway
  for (let i = 0; i < 10; i++) {
    if (!regex.test(result)) break
    result = result.replace(regex, (match, group, multiplier) => {
      const mult = multiplier ? parseInt(multiplier) : 1
      return group.replace(/([A-Z][a-z]?)(\d*)/g, (m: string, el: string, count: string) => {
        const c = count ? parseInt(count) : 1
        return el + (c * mult)
      })
    })
  }
  return result
}

/**
 * Strictly validate a single compound.
 * Every token must be a recognized element symbol; no unknown letters remain.
 */
function isValidCompound(compound: string): boolean {
  // Remove physical state annotations like (aq), (s), (l), (g)
  let s = compound.replace(/\s*\([aqlsg]+\)\s*/gi, '')

  // Expand parentheses
  s = expandParentheses(s)

  // Remove leading coefficient if any
  s = s.replace(/^\d+/, '')

  // Match element symbols + optional counts
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match: RegExpExecArray | null
  let consumed = 0

  while ((match = regex.exec(s)) !== null) {
    const element = match[1]
    const count = match[2]
    if (!ELEMENT_SYMBOLS.has(element)) return false
    // Reject zero-count subscripts (e.g., H0, C0H4)
    if (count === '0') return false
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

    const equation = input.equation.trim()

    // Validate arrow presence
    const arrowMatch = equation.match(/->|→|=>|=/)
    if (!arrowMatch) {
      return err('Equation must contain an arrow (->, =>, =, or →) separating reactants and products')
    }

    const parts = equation.split(/->|→|=>|=/)
    if (parts.length !== 2) {
      return err('Equation must have exactly one set of reactants and one set of products')
    }

    // Split into individual compounds and validate EACH one
    const compounds = equation.split(/->|→|=>|=|\+/).map((s) => s.trim()).filter(Boolean)
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
