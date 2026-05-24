/**
 * VerChem Answer Cards — Numeric Audit
 *
 * Finding #1 (Blocker): Enforce that every number in the explanation
 * traces back to a verified tool result. Numbers not in the allowlist
 * cause downgrade (verified → partial).
 */

import type { ToolCall } from './types'

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
 * Matches decimals, scientific notation, and Unicode superscript/subscript variants.
 * Skips small integers 0–20 (likely coefficients / atom counts / step numbers).
 */
function extractNumbersFromText(text: string): number[] {
  const numbers: number[] = []

  // Convert Unicode superscript digits to regular digits
  const superscriptMap: Record<string, string> = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-', '−': '-',
  }
  let normalized = text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻−]/g, (ch) => superscriptMap[ch] ?? ch)

  // Normalize scientific notation variants: 1.8×10^-5, 1.8 x 10^-5, 1.8·10^5
  // Match the entire construct: multiplier ×/x/· 10 ^optional sign+digits
  normalized = normalized
    .replace(/[×·x]\s*10\s*\^?\s*([+-]?\d+)/gi, 'e$1')
    // Also handle standalone "10^5" (no multiplier)
    .replace(/10\s*\^\s*([+-]?\d+)/g, 'e$1')
    // Merge "1.34 e-3" → "1.34e-3" (spaces around e in normalized sci notation)
    .replace(/(\d(?:\.\d+)?)\s+e\s*([+-]?\d)/g, '$1e$2')

  // Match decimals and scientific notation
  const regex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(normalized)) !== null) {
    const num = Number(match[0])
    if (!Number.isFinite(num)) continue
    // Skip small integers 0–20 (coefficients, step numbers, atom counts)
    if (Number.isInteger(num) && num >= 0 && num <= 20) continue
    numbers.push(num)
  }

  return numbers
}

/**
 * Build the allowlist of numbers from tool inputs and successful tool results.
 */
function buildAllowlist(toolCalls: ToolCall[]): number[] {
  const allowlist: number[] = []
  for (const tc of toolCalls) {
    collectNumbers(tc.input, allowlist)
    if (tc.result.ok) {
      collectNumbers(tc.result.value, allowlist)
    }
  }
  return allowlist
}

/**
 * Check if a candidate number matches any allowlist entry within relative tolerance.
 */
function isInAllowlist(candidate: number, allowlist: number[], relTol = 0.01): boolean {
  for (const allowed of allowlist) {
    if (allowed === 0) {
      if (candidate === 0) return true
      continue
    }
    const relDiff = Math.abs(candidate - allowed) / Math.abs(allowed)
    if (relDiff <= relTol) return true
  }
  return false
}

/**
 * Audit an explanation against tool call results.
 *
 * Returns:
 * - clean: true if every extracted number matches the allowlist
 * - unmatched: list of numbers (as strings) that could not be traced
 */
export function auditExplanation(explanation: string, toolCalls: ToolCall[]): AuditResult {
  if (!explanation || toolCalls.length === 0) {
    return { clean: true, unmatched: [] }
  }

  const allowlist = buildAllowlist(toolCalls)
  const extracted = extractNumbersFromText(explanation)
  const unmatched: string[] = []

  for (const num of extracted) {
    if (!isInAllowlist(num, allowlist)) {
      unmatched.push(String(num))
    }
  }

  return {
    clean: unmatched.length === 0,
    unmatched: [...new Set(unmatched)], // dedupe
  }
}
