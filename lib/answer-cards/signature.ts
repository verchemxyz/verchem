/**
 * VerChem Answer Card Signature — HMAC-SHA256 with canonical JSON
 *
 * SECURITY: Signs canonicalized payload so key order never affects signature.
 * Reference: lib/auth/session.ts (crypto.subtle + base64url pattern)
 *
 * W3-R2: Full signature coverage — signs every field visible on the card
 * except signature itself.
 */

import type { SignablePayload, AnswerCard } from './types'

/**
 * Reconstruct the exact signable payload from a card.
 *
 * SECURITY: signing (orchestrator) and verification (load / share) MUST build
 * the payload through this single function. If the two ever diverged, every
 * signature would fail to verify — or worse, verify a different shape than was
 * signed. The `signature` field and the deprecated `verified` flag are excluded
 * because they are not part of what is signed.
 */
export function toSignablePayload(card: Omit<AnswerCard, 'signature'>): SignablePayload {
  return {
    question: card.question,
    status: card.status,
    tool_calls: card.tool_calls.map((tc) => ({
      name: tc.name,
      engine: tc.engine,
      input: tc.input,
      result: tc.result,
      citation: tc.citation,
    })),
    explanation: card.explanation,
    audit: card.audit,
    model: card.model,
    version: card.version,
    issued_at: card.issued_at,
  }
}

/**
 * Recursively sort object keys for stable serialization.
 */
function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }

  const sorted: Record<string, unknown> = {}
  const keys = Object.keys(value as Record<string, unknown>).sort()
  for (const key of keys) {
    sorted[key] = canonicalize((value as Record<string, unknown>)[key])
  }
  return sorted
}

/**
 * Stable JSON stringify using canonicalization.
 */
function canonicalJSON(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

/**
 * Encode Uint8Array to base64url string.
 */
function base64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function getSecret(): string {
  const secret = process.env.ANSWER_CARD_SECRET || process.env.SESSION_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ANSWER_CARD_SECRET or SESSION_SECRET is required in production')
    }
    // Development fallback — still sign with a predictable string so tests work
    return 'dev-answer-card-secret-do-not-use-in-production'
  }

  return secret
}

/**
 * Sign a card payload with HMAC-SHA256.
 */
export async function signCard(payload: SignablePayload): Promise<string> {
  const secret = getSecret()
  const enc = new TextEncoder()

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const canonical = canonicalJSON(payload)
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(canonical))
  return base64urlEncode(new Uint8Array(sig))
}

/**
 * Verify a card signature against its payload.
 */
export async function verifyCardSignature(payload: SignablePayload, signature: string): Promise<boolean> {
  try {
    const expected = await signCard(payload)
    // Constant-time comparison to prevent timing attacks
    if (expected.length !== signature.length) {
      return false
    }
    let result = 0
    for (let i = 0; i < expected.length; i++) {
      result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    return result === 0
  } catch {
    return false
  }
}
