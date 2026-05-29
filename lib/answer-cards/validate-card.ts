/**
 * Defensive parser for a client-submitted AnswerCard (the /save path).
 *
 * This does NOT establish trust — the HMAC signature does. Its job is to
 * (a) bound size so a hostile client can't store megabytes, and (b) guarantee
 * the shape is well-formed enough that toSignablePayload() / canonicalization
 * cannot throw. After parsing, the caller MUST verify card.signature; any
 * tampering with a signed field makes the HMAC fail and the save is rejected.
 */

import type { AnswerCard, CardStatus, ToolCall, ToolResult } from './types'

const STATUSES: readonly CardStatus[] = ['verified', 'partial', 'unverified', 'error']
const MAX_QUESTION = 1000
const MAX_EXPLANATION = 20_000
const MAX_TOOL_CALLS = 32
const MAX_CITATION = 1_000
const MAX_SIGNATURE = 256
const MAX_MODEL = 200
const MAX_VERSION = 50
const MAX_ISSUED_AT = 64

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}
function isPlainObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseResult(v: unknown): ToolResult | null {
  if (!isPlainObj(v)) return null
  if (typeof v.ok !== 'boolean') return null
  if (!isPlainObj(v.value)) return null
  if (v.error !== undefined && !isStr(v.error)) return null
  return v.error !== undefined
    ? { ok: v.ok, value: v.value, error: v.error }
    : { ok: v.ok, value: v.value }
}

export function parseSubmittedCard(body: unknown): AnswerCard | null {
  if (!isPlainObj(body)) return null

  const { question, status, tool_calls, explanation, audit, model, version, issued_at, signature } =
    body

  if (!isStr(question) || question.trim().length === 0 || question.length > MAX_QUESTION) return null
  if (!isStr(status) || !STATUSES.includes(status as CardStatus)) return null
  if (!isStr(explanation) || explanation.length > MAX_EXPLANATION) return null
  if (!isStr(model) || model.length === 0 || model.length > MAX_MODEL) return null
  if (!isStr(version) || version.length === 0 || version.length > MAX_VERSION) return null
  if (!isStr(issued_at) || issued_at.length === 0 || issued_at.length > MAX_ISSUED_AT) return null
  if (!isStr(signature) || signature.length === 0 || signature.length > MAX_SIGNATURE) return null
  // base64url charset only (the signature is the trust anchor — reject junk early)
  if (!/^[A-Za-z0-9_-]+$/.test(signature)) return null

  if (!isPlainObj(audit) || typeof audit.clean !== 'boolean' || !Array.isArray(audit.unmatched)) return null
  if (!audit.unmatched.every(isStr)) return null

  if (!Array.isArray(tool_calls) || tool_calls.length > MAX_TOOL_CALLS) return null

  const parsedToolCalls: ToolCall[] = []
  for (const tc of tool_calls) {
    if (!isPlainObj(tc)) return null
    if (!isStr(tc.name) || !isStr(tc.engine) || !isStr(tc.citation)) return null
    if (tc.citation.length > MAX_CITATION) return null
    if (!isPlainObj(tc.input)) return null
    const result = parseResult(tc.result)
    if (result === null) return null
    parsedToolCalls.push({
      name: tc.name,
      engine: tc.engine,
      input: tc.input,
      result,
      citation: tc.citation,
    })
  }

  return {
    question,
    status: status as CardStatus,
    verified: status === 'verified',
    tool_calls: parsedToolCalls,
    explanation,
    audit: { clean: audit.clean, unmatched: audit.unmatched as string[] },
    model,
    version,
    issued_at,
    signature,
  }
}
