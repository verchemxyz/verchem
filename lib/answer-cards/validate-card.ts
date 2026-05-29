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
const MAX_NAME = 120
const MAX_ENGINE = 120
const MAX_UNMATCHED_ITEMS = 64
const MAX_UNMATCHED_LEN = 128

// Bounds for the arbitrary engine input/result.value sub-trees.
const MAX_VALUE_DEPTH = 8
const MAX_VALUE_KEYS = 128
const MAX_VALUE_STRING = 4_000
const MAX_ARRAY = 512

// Keys that, if present, can poison object prototypes or defeat canonicalization.
// A real chemistry engine result never uses these.
const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}
function isPlainObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Validate an arbitrary engine input/value sub-tree: JSON-primitive leaves only,
 * bounded depth/breadth/string length, and NO prototype-poisoning keys. This is
 * both a DoS bound and a defense-in-depth layer behind the null-proto canonicalizer.
 */
function isBoundedSafeValue(value: unknown, depth = 0): boolean {
  if (depth > MAX_VALUE_DEPTH) return false
  if (value === null) return true
  const t = typeof value
  if (t === 'number') return Number.isFinite(value as number)
  if (t === 'string') return (value as string).length <= MAX_VALUE_STRING
  if (t === 'boolean') return true
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) return false
    return value.every((v) => isBoundedSafeValue(v, depth + 1))
  }
  if (t === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    if (keys.length > MAX_VALUE_KEYS) return false
    for (const k of keys) {
      if (POISON_KEYS.has(k)) return false
      if (!isBoundedSafeValue((value as Record<string, unknown>)[k], depth + 1)) return false
    }
    return true
  }
  return false // function / symbol / undefined / bigint — never valid JSON
}

function parseResult(v: unknown): ToolResult | null {
  if (!isPlainObj(v)) return null
  if (typeof v.ok !== 'boolean') return null
  if (!isPlainObj(v.value) || !isBoundedSafeValue(v.value)) return null
  if (v.error !== undefined && (!isStr(v.error) || v.error.length > MAX_VALUE_STRING)) return null
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
  if (audit.unmatched.length > MAX_UNMATCHED_ITEMS) return null
  if (!audit.unmatched.every((u) => isStr(u) && u.length <= MAX_UNMATCHED_LEN)) return null

  if (!Array.isArray(tool_calls) || tool_calls.length > MAX_TOOL_CALLS) return null

  const parsedToolCalls: ToolCall[] = []
  for (const tc of tool_calls) {
    if (!isPlainObj(tc)) return null
    if (!isStr(tc.name) || !isStr(tc.engine) || !isStr(tc.citation)) return null
    if (tc.name.length > MAX_NAME || tc.engine.length > MAX_ENGINE || tc.citation.length > MAX_CITATION) {
      return null
    }
    if (!isPlainObj(tc.input) || !isBoundedSafeValue(tc.input)) return null
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
