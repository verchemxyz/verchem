/**
 * VerChem Answer Card Signature — Ed25519 compact JWS over canonical JSON
 *
 * SECURITY: Signs canonicalized payload so key order never affects signature.
 * The JWS payload bytes are the existing canonical payload string verbatim.
 */

import { sign as signEd25519, verify as verifyEd25519 } from 'node:crypto'
import type { SignablePayload, AnswerCard } from './types'
import { getActiveSigningKey, getVerificationKey } from './signing-key'
import { canonicalJsonString } from './canonical-json'

const CARD_JWS_TYPE = 'verchem-card+jws'
const MAX_CARD_JWS_LENGTH = 256 * 1024
const MAX_PROTECTED_HEADER_SEGMENT_LENGTH = 1024
const SHA256_THUMBPRINT_LENGTH = 43

interface CardJwsHeader {
  alg: 'EdDSA'
  kid: string
  typ: typeof CARD_JWS_TYPE
}

interface ParsedCardJws {
  header: CardJwsHeader
  protectedSegment: string
  payloadSegment: string
  payloadBytes: Buffer
  signatureBytes: Buffer
}

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
      ...(tc.engine_version === undefined ? {} : { engine_version: tc.engine_version }),
      input: tc.input,
      result: tc.result,
      citation: tc.citation,
    })),
    explanation: card.explanation,
    audit: card.audit,
    model: card.model,
    version: card.version,
    issued_at: card.issued_at,
    ...(card.provenance === undefined ? {} : { provenance: card.provenance }),
    ...(card.lab_record === undefined ? {} : { lab_record: card.lab_record }),
  }
}

function base64urlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function base64urlDecode(segment: string): Buffer | null {
  if (
    segment.length === 0 ||
    segment.length % 4 === 1 ||
    !/^[A-Za-z0-9_-]+$/.test(segment)
  ) return null

  try {
    const decoded = Buffer.from(segment, 'base64url')
    return decoded.toString('base64url') === segment ? decoded : null
  } catch {
    return null
  }
}

function parseCardJws(compactJws: string): ParsedCardJws | null {
  if (compactJws.length === 0 || compactJws.length > MAX_CARD_JWS_LENGTH) return null

  const segments = compactJws.split('.')
  if (segments.length !== 3) return null
  const [protectedSegment, payloadSegment, signatureSegment] = segments
  if (
    protectedSegment.length > MAX_PROTECTED_HEADER_SEGMENT_LENGTH ||
    protectedSegment.length === 0 ||
    payloadSegment.length === 0 ||
    signatureSegment.length === 0
  ) return null

  const protectedBytes = base64urlDecode(protectedSegment)
  const payloadBytes = base64urlDecode(payloadSegment)
  const signatureBytes = base64urlDecode(signatureSegment)
  if (!protectedBytes || !payloadBytes || !signatureBytes || signatureBytes.byteLength !== 64) {
    return null
  }

  let headerValue: unknown
  try {
    const headerJson = new TextDecoder('utf-8', { fatal: true }).decode(protectedBytes)
    headerValue = JSON.parse(headerJson) as unknown
  } catch {
    return null
  }

  if (typeof headerValue !== 'object' || headerValue === null || Array.isArray(headerValue)) {
    return null
  }
  const header = headerValue as Record<string, unknown>
  const headerKeys = Object.keys(header).sort()
  if (
    headerKeys.length !== 3 ||
    headerKeys[0] !== 'alg' ||
    headerKeys[1] !== 'kid' ||
    headerKeys[2] !== 'typ' ||
    header.alg !== 'EdDSA' ||
    header.typ !== CARD_JWS_TYPE ||
    typeof header.kid !== 'string' ||
    !new RegExp(`^[A-Za-z0-9_-]{${SHA256_THUMBPRINT_LENGTH}}$`).test(header.kid)
  ) return null

  return {
    header: { alg: 'EdDSA', kid: header.kid, typ: CARD_JWS_TYPE },
    protectedSegment,
    payloadSegment,
    payloadBytes,
    signatureBytes,
  }
}

/** Cheap syntax/header validation for hostile client submissions before crypto. */
export function isStructurallyValidCardJws(compactJws: string): boolean {
  return parseCardJws(compactJws) !== null
}

/**
 * The exact canonical string that gets signed for a payload.
 *
 * PERSISTENCE: store THIS string verbatim (as TEXT) alongside the signature.
 * Re-deriving it from typed DB columns is fragile — a TIMESTAMPTZ round-trip
 * or JSONB key/number normalization would change the bytes and break the JWS.
 * Storing the canonical string makes verification a pure string operation.
 */
export function canonicalPayloadString(payload: SignablePayload): string {
  return canonicalJsonString(payload)
}

/**
 * Sign the canonical payload string as an Ed25519 compact JWS.
 */
export async function signCard(payload: SignablePayload): Promise<string> {
  const canonical = canonicalJsonString(payload)
  const active = getActiveSigningKey()
  const protectedHeader: CardJwsHeader = {
    alg: 'EdDSA',
    kid: active.kid,
    typ: CARD_JWS_TYPE,
  }
  const protectedSegment = base64urlEncode(JSON.stringify(protectedHeader))
  const payloadSegment = base64urlEncode(canonical)
  const signingInput = `${protectedSegment}.${payloadSegment}`
  const signatureSegment = signEd25519(
    null,
    Buffer.from(signingInput, 'ascii'),
    active.privateKey
  ).toString('base64url')
  const compactJws = `${signingInput}.${signatureSegment}`

  if (compactJws.length > MAX_CARD_JWS_LENGTH) {
    throw new Error('Answer card payload exceeds the compact JWS size limit')
  }
  return compactJws
}

/**
 * Verify a card signature against its payload (re-canonicalizes).
 */
export async function verifyCardSignature(
  payload: SignablePayload,
  signature: string
): Promise<boolean> {
  return verifyCanonicalSignature(canonicalJsonString(payload), signature)
}

/**
 * Verify a signature against a pre-canonicalized string (the DB round-trip path).
 * Use with the stored `canonicalPayloadString` value — no re-serialization,
 * so byte-level fidelity is guaranteed.
 */
export async function verifyCanonicalSignature(
  canonical: string,
  signature: string
): Promise<boolean> {
  try {
    const parsed = parseCardJws(signature)
    if (!parsed) return false

    const publicKey = getVerificationKey(parsed.header.kid)
    if (!publicKey) return false

    const signingInput = `${parsed.protectedSegment}.${parsed.payloadSegment}`
    const authentic = verifyEd25519(
      null,
      Buffer.from(signingInput, 'ascii'),
      publicKey,
      parsed.signatureBytes
    )
    if (!authentic) return false

    // A valid JWS for a different payload must never verify against the card
    // supplied by the caller (payload-substitution defense).
    return parsed.payloadBytes.equals(Buffer.from(canonical, 'utf8'))
  } catch {
    return false
  }
}
