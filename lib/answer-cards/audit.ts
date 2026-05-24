/**
 * VerChem Answer Cards — Numeric Audit (W3-R20)
 *
 * Trust boundary: allowlist = result values + input values ONLY.
 * No global constants — every verified number must trace to engine output or user input.
 * Precision-aware tolerance, thousands separator, standalone 10^n parsing.
 * Chemical formula subscripts stripped before number extraction.
 * Unicode digit defense: NFKC normalization + foreign-digit detection.
 */

import type { ToolCall } from './types'
import { ELEMENT_SYMBOLS } from './elements'

export interface AuditResult {
  clean: boolean
  unmatched: string[]
}

/**
 * Recursively collect all numeric values from an object/array.
 */
function collectNumbers(value: unknown, out: number[]): void {
  if (value === null || value === undefined) return
  if (typeof value === 'number' && Number.isFinite(value)) {
    out.push(value)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectNumbers(v, out))
    return
  }
  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) => collectNumbers(v, out))
  }
}

/**
 * Check if a token is a pure chemical formula (all symbols ∈ ELEMENT_SYMBOLS).
 * e.g. "H2O", "C6H12O6", "Fe2O3" → true
 * "pH7", "1.8e5", "hello" → false
 */
function isChemicalFormulaToken(token: string): boolean {
  if (!token || token.length === 0) return false
  // Must start with an uppercase letter (element symbol start)
  if (!/^[A-Z]/.test(token)) return false
  // Must match element-symbol + count pattern for the entire token
  if (!/^([A-Z][a-z]?\d*)+$/.test(token)) return false
  // Every element symbol must be recognized
  const regex = /([A-Z][a-z]?)(\d*)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(token)) !== null) {
    if (!ELEMENT_SYMBOLS.has(m[1])) return false
  }
  return true
}

/**
 * Strip subscript digits from chemical-formula tokens only.
 * Non-formula tokens (e.g., "pH7", "pOH7", "pKa", "1.8e5") are preserved.
 */
function stripFormulaSubscripts(text: string): string {
  const subscriptMap: Record<string, string> = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  }
  // First normalize Unicode subscripts to ascii so tokenization works consistently
  const ascii = text.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => subscriptMap[ch] ?? ch)

  // Split on word boundaries / punctuation, preserving structure
  return ascii.replace(/[A-Za-z][A-Za-z0-9]*/g, (token) => {
    if (isChemicalFormulaToken(token)) {
      // Strip all digits from this formula token
      return token.replace(/\d/g, '')
    }
    return token
  })
}

/**
 * Detect non-ASCII Unicode decimal digits (Thai, Arabic-Indic, Devanagari, etc.)
 * that NFKC normalization does NOT convert to ASCII.
 * These are always treated as suspicious unmatched numbers.
 */
function detectForeignDigits(text: string): string[] {
  const normalized = text.normalize('NFKC')
  const foreign: string[] = []
  const regex = /\p{Nd}/gu
  let match: RegExpExecArray | null
  while ((match = regex.exec(normalized)) !== null) {
    const cp = match[0].codePointAt(0) ?? 0
    // ASCII digits are 0x30-0x39; anything else is a foreign digit
    if (cp < 0x30 || cp > 0x39) {
      foreign.push(match[0])
    }
  }
  return foreign
}

/**
 * Extract result-like numbers from explanation text.
 * Returns each number with its raw string for precision-aware matching.
 */
function extractNumbersFromText(text: string): Array<{ value: number; raw: string }> {
  const numbers: Array<{ value: number; raw: string }> = []

  // Layer 1: NFKC normalize — converts fullwidth/compatibility digits to ASCII
  let normalized = text.normalize('NFKC')

  // Remove thousands separators: 1,000 → 1000
  normalized = normalized.replace(/\d{1,3}(,\d{3})+/g, (match) => match.replace(/,/g, ''))

  // Strip chemical formula subscript digits BEFORE any sci-not normalization.
  // Tokenize-based: only pure formula tokens (H2O, C6H12O6) get stripped.
  // Non-formula tokens (pH7, pOH7, 1.8e5, 1.8E5) are preserved.
  normalized = stripFormulaSubscripts(normalized)

  // Convert Unicode superscripts/subscripts to regular digits
  const superscriptMap: Record<string, string> = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-', '−': '-', '⁺': '+',
  }
  normalized = normalized.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻−⁺]/g, (ch) => superscriptMap[ch] ?? ch)

  // Normalize scientific notation variants
  normalized = normalized
    .replace(/[×·x]\s*10\s*\^?\s*([+-]?\d+)/gi, 'e$1') // 1.8×10^-5 → e-5
    .replace(/\b10\s*\^?\s*([+-]?\d+)\b/g, '1e$1')     // 10^-14 → 1e-14
    // Merge "1.34 e-3" → "1.34e-3"
    .replace(/(\d(?:\.\d+)?)\s+e\s*([+-]?\d)/g, '$1e$2')

  // Match decimals and scientific notation
  const regex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(normalized)) !== null) {
    const raw = match[0]
    const num = Number(raw)
    if (!Number.isFinite(num)) continue
    numbers.push({ value: num, raw })
  }

  return numbers
}

/**
 * Build allowlists from tool calls.
 * Trust boundary: only engine result values and user input values.
 */
function buildAllowlists(toolCalls: ToolCall[]): {
  resultValues: number[]
  inputValues: number[]
} {
  const resultValues: number[] = []
  const inputValues: number[] = []

  for (const tc of toolCalls) {
    collectNumbers(tc.input, inputValues)
    if (tc.result.ok) {
      collectNumbers(tc.result.value, resultValues)
    }
  }

  return { resultValues, inputValues }
}

/**
 * Precision-aware matching.
 * - Exact match first
 * - Scientific notation: 1% relative tolerance
 * - Decimal notation: round allowed to same decimal places as candidate, then exact compare
 * - Integers (0 dp): exact match only (prevent 1 from matching 1.34 via rounding)
 */
function isMatch(candidate: number, candidateRaw: string, allowed: number): boolean {
  if (candidate === allowed) return true

  // Scientific notation → use relative tolerance
  if (/[eE]/.test(candidateRaw)) {
    if (allowed === 0) return candidate === 0
    const relDiff = Math.abs(candidate - allowed) / Math.abs(allowed)
    return relDiff <= 0.01
  }

  // Decimal notation → precision-aware
  const decimalMatch = candidateRaw.match(/\.(\d+)/)
  const decimalPlaces = decimalMatch ? decimalMatch[1].length : 0

  if (decimalPlaces === 0) {
    // Integer: exact match only (tiny epsilon for floating point noise)
    return Math.abs(candidate - allowed) < 1e-9
  }

  const rounded = Math.round(allowed * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
  return candidate === rounded
}

/**
 * Check if a candidate number matches any entry in an allowlist.
 */
function inAllowlist(
  candidate: number,
  candidateRaw: string,
  allowlist: number[]
): boolean {
  for (const allowed of allowlist) {
    if (isMatch(candidate, candidateRaw, allowed)) return true
  }
  return false
}

/**
 * Audit an explanation against tool call results.
 *
 * Returns:
 * - clean: true if every extracted number matches at least one allowlist
 * - unmatched: list of raw number strings that could not be traced
 */
export function auditExplanation(explanation: string, toolCalls: ToolCall[]): AuditResult {
  if (!explanation || toolCalls.length === 0) {
    return { clean: true, unmatched: [] }
  }

  // Layer 2: detect non-ASCII Unicode decimal digits (Thai, Arabic-Indic, Devanagari, etc.)
  // Engine never outputs non-ASCII numerals → any foreign digit is automatically unmatched
  const foreignDigits = detectForeignDigits(explanation)

  const { resultValues, inputValues } = buildAllowlists(toolCalls)
  const extracted = extractNumbersFromText(explanation)
  const unmatchedRaw: string[] = [...foreignDigits]

  for (const { value, raw } of extracted) {
    const inResults = inAllowlist(value, raw, resultValues)
    const inInputs = inAllowlist(value, raw, inputValues)
    if (!inResults && !inInputs) {
      unmatchedRaw.push(raw)
    }
  }

  return {
    clean: unmatchedRaw.length === 0,
    unmatched: [...new Set(unmatchedRaw)], // dedupe
  }
}
