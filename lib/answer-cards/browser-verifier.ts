import type { SignablePayload } from './types'
import { isValidSignablePayload } from './payload-shape'
import { canonicalJsonString } from './canonical-json'

const MAX_JWS_LENGTH = 256 * 1024
const MAX_PUBLISHED_KEYS = 64
const KID_PATTERN = /^[A-Za-z0-9_-]{43}$/

export interface BrowserPublishedJwk {
  kty: 'OKP'
  crv: 'Ed25519'
  x: string
  kid: string
  status: 'active' | 'pending' | 'retired'
  not_after?: string
}

export interface BrowserVerificationResult {
  signatureAuthentic: boolean
  payload: SignablePayload | null
  kid: string | null
  keyStatus: BrowserPublishedJwk['status'] | null
  artifactHashMatches: boolean | null
  error: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function decodeBase64Url(segment: string): Uint8Array | null {
  if (segment.length === 0 || segment.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(segment)) {
    return null
  }
  try {
    const base64 = segment.replaceAll('-', '+').replaceAll('_', '/')
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
    const decoded = atob(padded)
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function parsePublishedKeys(value: unknown): BrowserPublishedJwk[] | null {
  if (!isRecord(value) || !Array.isArray(value.keys) || value.keys.length > MAX_PUBLISHED_KEYS) {
    return null
  }
  const keys: BrowserPublishedJwk[] = []
  const seenKids = new Set<string>()
  for (const candidate of value.keys) {
    if (!isRecord(candidate) ||
      candidate.kty !== 'OKP' ||
      candidate.crv !== 'Ed25519' ||
      typeof candidate.x !== 'string' ||
      !KID_PATTERN.test(candidate.x) ||
      typeof candidate.kid !== 'string' ||
      !KID_PATTERN.test(candidate.kid) ||
      (candidate.status !== 'active' && candidate.status !== 'pending' && candidate.status !== 'retired') ||
      (candidate.not_after !== undefined &&
        (typeof candidate.not_after !== 'string' || candidate.not_after.length > 64))) {
      return null
    }
    if (seenKids.has(candidate.kid)) return null
    seenKids.add(candidate.kid)
    keys.push({
      kty: 'OKP',
      crv: 'Ed25519',
      x: candidate.x,
      kid: candidate.kid,
      status: candidate.status,
      ...(typeof candidate.not_after === 'string' ? { not_after: candidate.not_after } : {}),
    })
  }
  return keys
}

function byteHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyArtifactHash(payload: SignablePayload): Promise<boolean | null> {
  if (!payload.provenance) return null
  const material = new TextEncoder().encode(canonicalJsonString(payload.tool_calls))
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', material))
  return payload.provenance.artifact_hash === `sha256:${byteHex(digest)}`
}

export async function verifyCardJwsInBrowser(
  compactJws: string,
  publishedJwks: unknown
): Promise<BrowserVerificationResult> {
  const fail = (
    error: string,
    extras: Partial<BrowserVerificationResult> = {}
  ): BrowserVerificationResult => ({
    signatureAuthentic: false,
    payload: null,
    kid: null,
    keyStatus: null,
    artifactHashMatches: null,
    error,
    ...extras,
  })

  const trimmed = compactJws.trim()
  if (!globalThis.crypto?.subtle) {
    return fail('This browser does not provide the Web Crypto API required for verification.')
  }
  if (trimmed.length === 0 || trimmed.length > MAX_JWS_LENGTH) {
    return fail('The compact JWS is empty or exceeds the supported size limit.')
  }
  const segments = trimmed.split('.')
  if (segments.length !== 3) return fail('A compact JWS must contain exactly three segments.')
  const [protectedSegment, payloadSegment, signatureSegment] = segments
  if (!protectedSegment || !payloadSegment || !signatureSegment) {
    return fail('The compact JWS contains an empty segment.')
  }

  const protectedBytes = decodeBase64Url(protectedSegment)
  const payloadBytes = decodeBase64Url(payloadSegment)
  const signatureBytes = decodeBase64Url(signatureSegment)
  if (!protectedBytes || !payloadBytes || !signatureBytes || signatureBytes.byteLength !== 64) {
    return fail('The compact JWS contains malformed base64url or an invalid Ed25519 signature length.')
  }

  const headerText = decodeUtf8(protectedBytes)
  if (!headerText) return fail('The protected header is not valid UTF-8.')
  let headerValue: unknown
  try {
    headerValue = JSON.parse(headerText) as unknown
  } catch {
    return fail('The protected header is not valid JSON.')
  }
  if (!isRecord(headerValue) ||
    Object.keys(headerValue).sort().join(',') !== 'alg,kid,typ' ||
    headerValue.alg !== 'EdDSA' ||
    headerValue.typ !== 'verchem-card+jws' ||
    typeof headerValue.kid !== 'string' ||
    !KID_PATTERN.test(headerValue.kid)) {
    return fail('The protected header is not a supported VerChem EdDSA card header.')
  }
  const kid = headerValue.kid

  const publishedKeys = parsePublishedKeys(publishedJwks)
  if (!publishedKeys) return fail('The published VerChem key set is malformed.', { kid })
  const publishedKey = publishedKeys.find((key) => key.kid === kid)
  if (!publishedKey) return fail('The signing key is not present in the published VerChem key set.', { kid })

  const thumbprintMaterial = new TextEncoder().encode(
    JSON.stringify({ crv: publishedKey.crv, kty: publishedKey.kty, x: publishedKey.x })
  )
  const thumbprint = encodeBase64Url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', thumbprintMaterial))
  )
  if (thumbprint !== publishedKey.kid) {
    return fail('The published key identifier does not match its RFC 7638 thumbprint.', {
      kid,
      keyStatus: publishedKey.status,
    })
  }
  if (publishedKey.status === 'pending') {
    return fail('The matching key is published for rotation but is not authorized to issue artifacts yet.', {
      kid,
      keyStatus: publishedKey.status,
    })
  }

  let cryptoKey: CryptoKey
  try {
    cryptoKey = await crypto.subtle.importKey(
      'jwk',
      { kty: 'OKP', crv: 'Ed25519', x: publishedKey.x, ext: true },
      { name: 'Ed25519' },
      false,
      ['verify']
    )
  } catch {
    return fail('This browser cannot import the published Ed25519 verification key.', {
      kid,
      keyStatus: publishedKey.status,
    })
  }

  const signingInput = new TextEncoder().encode(`${protectedSegment}.${payloadSegment}`)
  let authentic: boolean
  try {
    authentic = await crypto.subtle.verify(
      { name: 'Ed25519' },
      cryptoKey,
      Uint8Array.from(signatureBytes),
      Uint8Array.from(signingInput)
    )
  } catch {
    return fail('This browser could not run Ed25519 verification.', {
      kid,
      keyStatus: publishedKey.status,
    })
  }
  if (!authentic) {
    return fail('Signature verification failed. The artifact may have been altered.', {
      kid,
      keyStatus: publishedKey.status,
    })
  }

  const payloadText = decodeUtf8(payloadBytes)
  if (!payloadText) {
    return fail('The signed payload is not valid UTF-8.', {
      signatureAuthentic: true,
      kid,
      keyStatus: publishedKey.status,
    })
  }
  let payloadValue: unknown
  try {
    payloadValue = JSON.parse(payloadText) as unknown
  } catch {
    return fail('The signed payload is not valid JSON.', {
      signatureAuthentic: true,
      kid,
      keyStatus: publishedKey.status,
    })
  }
  if (!isValidSignablePayload(payloadValue)) {
    return fail('The signature is authentic, but the payload does not match the supported Answer Card schema.', {
      signatureAuthentic: true,
      kid,
      keyStatus: publishedKey.status,
    })
  }

  const artifactHashMatches = await verifyArtifactHash(payloadValue)
  return {
    signatureAuthentic: true,
    payload: payloadValue,
    kid,
    keyStatus: publishedKey.status,
    artifactHashMatches,
    error: artifactHashMatches === false
      ? 'The signed provenance hash does not match the signed deterministic tool calls.'
      : null,
  }
}
