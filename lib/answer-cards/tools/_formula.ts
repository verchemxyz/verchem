/**
 * VerChem Answer Cards — Shared formula validators
 *
 * Extracted from ph.ts + equation.ts as single source of truth.
 * CRITICAL: any change must keep behavior identical to avoid regressions
 * in equation/homoglyph tests.
 */

import { ELEMENT_SYMBOLS } from '../elements'

/** Positive integer pattern for element counts and multipliers */
const POSITIVE_INT = /^[1-9]\d*$/

/** Max element count / parenthesis multiplier. Beyond this the resulting mass
 *  loses precision (exceeds safe-integer range) and is chemically meaningless. */
const MAX_ELEMENT_COUNT = 1_000_000

/** Valid physical state suffixes */
const STATE_PATTERN = /\((?:aq|s|l|g)\)$/i

const subscriptMap: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}

/** Normalize Unicode subscripts to ASCII digits and strip whitespace. */
export function normalizeFormula(formula: string): string {
  return formula
    .replace(/\s+/g, '')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (match) => subscriptMap[match] ?? match)
}

/** Reject formulas containing homoglyphs (Cyrillic/Greek look-alikes) or other non-ASCII characters.
 *  Element symbols are ASCII-only; anything else is either an attack or a typo.
 */
export function isAsciiFormula(formula: string): boolean {
  return /^[A-Za-z0-9()·\[\]]+$/.test(formula)
}

/**
 * Expand parentheses in a compound string: Ca(OH)2 → CaO2H2
 * Rejects zero/invalid multipliers, empty groups, and leading-zero counts inside groups.
 * Uses iterative first-match replacement (no /g state bug).
 */
export function expandParentheses(formula: string): string | null {
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
    if (mult > MAX_ELEMENT_COUNT) return null

    // Validate group element counts BEFORE expansion (reject leading-zero like H02)
    let gv: RegExpExecArray | null
    const gvRegex = /([A-Z][a-z]?)(\d*)/g
    while ((gv = gvRegex.exec(group)) !== null) {
      if (gv[2] !== '' && !POSITIVE_INT.test(gv[2])) return null
    }

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
export function isValidCompound(compound: string): boolean {
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
      if (Number(countMatch[1]) > MAX_ELEMENT_COUNT) return false
      pos += countMatch[1].length
    }
  }

  return elementCount > 0 && pos === s.length
}

/**
 * Strict standalone-compound validator for stoichiometry contexts.
 *
 * Unlike isValidCompound (built for EQUATION terms, which tolerates a leading
 * coefficient + trailing physical-state suffix because the equation engine
 * parses them), this REJECTS both — the stoichiometry engines
 * (calculateMolecularMass, etc.) do not parse them and would silently misread
 * the leftovers: "H2O(s)" → adds Os (osmium), "H2O(g)" → adds Og (oganesson),
 * "2H2O" → ignores the 2. Those wrong masses would then be signed VERIFIED.
 */
export function isValidStandaloneFormula(compound: string): boolean {
  const s = compound.trim()
  if (s.length === 0) return false
  // Reject any leading coefficient (e.g., "2H2O")
  if (/^\d/.test(s)) return false
  // Reject physical-state notation anywhere. CRITICAL: after parenthesis
  // expansion "(s)"→"s" merges with a preceding O into "Os" (osmium) and
  // "(g)"→"Og" (oganesson) — real element symbols that would otherwise pass
  // tokenization and be signed VERIFIED with a wildly wrong mass.
  if (/\((?:aq|s|l|g)\)/i.test(s)) return false
  const expanded = expandParentheses(s)
  if (expanded === null) return false
  let pos = 0
  let elementCount = 0
  while (pos < expanded.length) {
    const elemMatch = expanded.slice(pos).match(/^([A-Z][a-z]?)/)
    if (!elemMatch) return false
    if (!ELEMENT_SYMBOLS.has(elemMatch[1])) return false
    pos += elemMatch[1].length
    elementCount++
    const countMatch = expanded.slice(pos).match(/^(\d+)/)
    if (countMatch) {
      if (!POSITIVE_INT.test(countMatch[1])) return false
      if (Number(countMatch[1]) > MAX_ELEMENT_COUNT) return false
      pos += countMatch[1].length
    }
  }
  return elementCount > 0 && pos === expanded.length
}
