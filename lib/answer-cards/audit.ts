/**
 * VerChem Answer Cards — Numeric Audit (W3-R6)
 *
 * Trust boundary: allowlist = result values + input values ONLY.
 * No global constants — every verified number must trace to engine output or user input.
 * Precision-aware tolerance, thousands separator, standalone 10^n parsing.
 * Chemical formula subscripts stripped before number extraction.
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
 * Extract result-like numbers from explanation text.
 * Returns each number with its raw string for precision-aware matching.
 */
function extractNumbersFromText(text: string): Array<{ value: number; raw: string }> {
  const numbers: Array<{ value: number; raw: string }> = []

  // Remove thousands separators: 1,000 → 1000
  let normalized = text.replace(/\d{1,3}(,\d{3})+/g, (match) => match.replace(/,/g, ''))

  // Strip chemical formula subscript digits BEFORE any sci-not normalization.
  // Only strip when the preceding symbol is a recognized element — this preserves
  // scientific notation (1.8e5, 1.8E5) while correctly stripping H2O, C6H12O6.
  normalized = normalized.replace(/([A-Z][a-z]?)\d+/g, (match, sym) =>
    ELEMENT_SYMBOLS.has(sym) ? sym : match
  )

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

  const { resultValues, inputValues } = buildAllowlists(toolCalls)
  const extracted = extractNumbersFromText(explanation)
  const unmatchedRaw: string[] = []

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
