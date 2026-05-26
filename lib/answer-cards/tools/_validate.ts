/**
 * VerChem Answer Cards — Shared validation helpers
 *
 * Finding #4: Finite result validation
 * Finding #7: readFiniteNumber (prevents Number(null)→0, Number('')→0, etc.)
 */

import type { ToolResult } from '../types'

/** Smallest positive normal double. Values with 0 < |x| < this are subnormal:
 *  they carry no physical meaning and silently underflow to 0 in downstream
 *  math, which would otherwise be signed VERIFIED (e.g. "weigh 0 g"). */
const MIN_NORMAL_DOUBLE = 2.2250738585072014e-308

/**
 * Safely read a finite number from an unknown value.
 * Returns undefined for null, boolean, array, object, empty string, NaN, Infinity,
 * or non-numeric strings.
 */
export function readFiniteNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined
  if (typeof v === 'boolean') return undefined
  if (typeof v === 'object') return undefined
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return undefined
    const num = Number(trimmed)
    if (!Number.isFinite(num)) return undefined
    if (num === 0) {
      // Distinguish a true zero ("0", "0.0", "+0", ".0", "0e0") from a tiny value
      // that underflowed to 0 on parse ("1e-324") — the latter must not be signed.
      if (!/^[+-]?0*\.?0*(?:[eE][+-]?\d+)?$/.test(trimmed)) return undefined
      return 0
    }
    if (Math.abs(num) < MIN_NORMAL_DOUBLE) return undefined
    return num
  }
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return undefined
    if (v !== 0 && Math.abs(v) < MIN_NORMAL_DOUBLE) return undefined
    return v
  }
  return undefined
}

/**
 * Check if value is a plain object (not array, not null).
 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Finalize a tool result value: scan every numeric field recursively.
 * If any field is non-finite (NaN/Infinity), return an error ToolResult.
 * Otherwise return ok.
 */
export function finalizeResult(value: Record<string, unknown>): ToolResult {
  function hasNonFinite(obj: unknown): boolean {
    if (obj === null || obj === undefined) return false
    if (typeof obj === 'number') return !Number.isFinite(obj)
    if (Array.isArray(obj)) return obj.some(hasNonFinite)
    if (typeof obj === 'object') {
      return Object.values(obj as Record<string, unknown>).some(hasNonFinite)
    }
    return false
  }

  if (hasNonFinite(value)) {
    return {
      ok: false,
      value: {},
      error: 'Calculation produced a non-finite value (check for division by zero or out-of-range input)',
    }
  }

  return { ok: true, value }
}
