/**
 * Deep shape-validation for a SignablePayload reconstructed from storage.
 *
 * Pure (no server-only deps) so both the data layer and tests can use it.
 * A persisted signed_payload that has been tampered into valid-JSON-but-wrong-
 * shape (e.g. tool_calls:[null], status:"weird") must be rejected here so the
 * loader falls back to a safe empty card instead of letting the UI dereference
 * undefined fields and crash before the TAMPERED banner can render.
 */

import type { SignablePayload, CardStatus } from './types'

const STATUSES: readonly CardStatus[] = ['verified', 'partial', 'unverified', 'error']

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}
function isPlainObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isValidSignablePayload(p: unknown): p is SignablePayload {
  if (!isPlainObj(p)) return false
  if (!isStr(p.question)) return false
  if (!isStr(p.status) || !STATUSES.includes(p.status as CardStatus)) return false
  if (!isStr(p.explanation) || !isStr(p.model) || !isStr(p.version) || !isStr(p.issued_at)) return false

  if (!isPlainObj(p.audit) || typeof p.audit.clean !== 'boolean' || !Array.isArray(p.audit.unmatched)) {
    return false
  }
  if (!p.audit.unmatched.every(isStr)) return false

  if (!Array.isArray(p.tool_calls)) return false
  for (const tc of p.tool_calls) {
    if (!isPlainObj(tc)) return false
    if (!isStr(tc.name) || !isStr(tc.engine) || !isStr(tc.citation)) return false
    if (!isPlainObj(tc.input)) return false
    if (!isPlainObj(tc.result)) return false
    const r = tc.result
    if (typeof r.ok !== 'boolean') return false
    if (!isPlainObj(r.value)) return false
    if (r.error !== undefined && !isStr(r.error)) return false
  }
  return true
}
