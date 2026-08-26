import type { SignablePayload } from './types'
import { isValidSignablePayload } from './payload-shape'
import { canonicalJsonString } from './canonical-json'
import {
  isValidReleaseManifestArchive,
  isValidReleaseManifest,
  manifestContentHashMaterial,
  manifestWithoutTimestamp,
  type ReleaseManifestDocument,
  type Sha256Hash,
} from './release-manifest-shape'

const MAX_JWS_LENGTH = 256 * 1024
const MAX_RELEASE_MANIFEST_JWS_LENGTH = 512 * 1024
const MAX_PUBLISHED_KEYS = 64
const KID_PATTERN = /^[A-Za-z0-9_-]{43}$/
const RELEASE_MANIFEST_JWS_TYPE = 'verchem-release-manifest+jws'
const RELEASE_MANIFEST_HASH = /^sha256:([a-f0-9]{64})$/

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
  releaseManifest: BrowserReleaseManifestClaim
  error: string | null
}

export type BrowserReleaseManifestClaim =
  | 'matched_current'
  | 'matched_superseded'
  | 'mismatch'
  | 'unavailable'
  | 'not_applicable'

export interface BrowserVerifierOptions {
  fetch?: typeof fetch
  releaseManifestUrl?: string
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

async function sha256Prefixed(material: string): Promise<Sha256Hash> {
  const digest = new Uint8Array(await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(material)
  ))
  return `sha256:${byteHex(digest)}`
}

async function verifyArtifactHash(payload: SignablePayload): Promise<boolean | null> {
  if (!payload.provenance) return null
  return payload.provenance.artifact_hash === await sha256Prefixed(
    canonicalJsonString(payload.tool_calls)
  )
}

async function verifyJwsWithPublishedKey(
  compactJws: string,
  expectedType: string,
  publishedKeys: readonly BrowserPublishedJwk[],
  maxLength: number
): Promise<{ payloadText: string; kid: string } | null> {
  if (compactJws.length === 0 || compactJws.length > maxLength) return null
  const segments = compactJws.split('.')
  if (segments.length !== 3) return null
  const [protectedSegment, payloadSegment, signatureSegment] = segments
  if (!protectedSegment || !payloadSegment || !signatureSegment) return null

  const protectedBytes = decodeBase64Url(protectedSegment)
  const payloadBytes = decodeBase64Url(payloadSegment)
  const signatureBytes = decodeBase64Url(signatureSegment)
  if (!protectedBytes || !payloadBytes || !signatureBytes || signatureBytes.byteLength !== 64) return null

  const headerText = decodeUtf8(protectedBytes)
  if (!headerText) return null
  let headerValue: unknown
  try {
    headerValue = JSON.parse(headerText) as unknown
  } catch {
    return null
  }
  if (!isRecord(headerValue) ||
    Object.keys(headerValue).sort().join(',') !== 'alg,kid,typ' ||
    headerValue.alg !== 'EdDSA' ||
    headerValue.typ !== expectedType ||
    typeof headerValue.kid !== 'string' ||
    !KID_PATTERN.test(headerValue.kid)) return null

  const publishedKey = publishedKeys.find((key) => key.kid === headerValue.kid)
  if (!publishedKey || publishedKey.status === 'pending') return null

  const thumbprint = encodeBase64Url(
    new Uint8Array(await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(JSON.stringify({
        crv: publishedKey.crv,
        kty: publishedKey.kty,
        x: publishedKey.x,
      }))
    ))
  )
  if (thumbprint !== publishedKey.kid) return null

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
    return null
  }

  try {
    const authentic = await crypto.subtle.verify(
      { name: 'Ed25519' },
      cryptoKey,
      Uint8Array.from(signatureBytes),
      new TextEncoder().encode(`${protectedSegment}.${payloadSegment}`)
    )
    if (!authentic) return null
  } catch {
    return null
  }

  const payloadText = decodeUtf8(payloadBytes)
  return payloadText ? { payloadText, kid: headerValue.kid } : null
}

/** Verify the separately signed, published release manifest without trusting its route. */
export async function verifyReleaseManifestJwsInBrowser(
  compactJws: string,
  publishedJwks: unknown
): Promise<ReleaseManifestDocument | null> {
  if (!globalThis.crypto?.subtle) return null
  const publishedKeys = parsePublishedKeys(publishedJwks)
  if (!publishedKeys) return null
  const verified = await verifyJwsWithPublishedKey(
    compactJws.trim(),
    RELEASE_MANIFEST_JWS_TYPE,
    publishedKeys,
    MAX_RELEASE_MANIFEST_JWS_LENGTH
  )
  if (!verified) return null

  let manifestValue: unknown
  try {
    manifestValue = JSON.parse(verified.payloadText) as unknown
  } catch {
    return null
  }
  if (!isValidReleaseManifest(manifestValue) && !isValidReleaseManifestArchive(manifestValue)) return null
  if (canonicalJsonString(manifestValue) !== verified.payloadText) return null

  const calculatedHash = await sha256Prefixed(
    manifestContentHashMaterial(manifestWithoutTimestamp(manifestValue))
  )
  return calculatedHash === manifestValue.content_hash ? manifestValue : null
}

type PublishedReleaseManifestResult =
  | { status: 'ok'; manifest: ReleaseManifestDocument }
  | { status: 'not_found' | 'unavailable' | 'invalid' }

function isExpectedManifestKind(
  manifest: ReleaseManifestDocument,
  kind: 'current' | 'archive'
): boolean {
  return kind === 'current' ? isValidReleaseManifest(manifest) : isValidReleaseManifestArchive(manifest)
}

function archiveManifestUrl(expectedHash: Sha256Hash, currentUrl: string): string | null {
  const matched = RELEASE_MANIFEST_HASH.exec(expectedHash)
  if (!matched) return null
  const archivePath = `/.well-known/verchem-release/${matched[1]}.json`
  try {
    return new URL(archivePath, currentUrl).toString()
  } catch {
    return archivePath
  }
}

async function fetchPublishedReleaseManifest(
  url: string,
  kind: 'current' | 'archive',
  publishedJwks: unknown,
  fetcher: typeof fetch
): Promise<PublishedReleaseManifestResult> {
  let response: Response
  try {
    response = await fetcher(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
  } catch {
    return { status: 'unavailable' }
  }
  if (response.status === 404) return { status: 'not_found' }
  if (!response.ok) return { status: 'unavailable' }

  let documentValue: unknown
  try {
    documentValue = await response.json() as unknown
  } catch {
    return { status: 'invalid' }
  }
  if (!isRecord(documentValue) ||
    Object.keys(documentValue).sort().join(',') !== 'jws,manifest' ||
    typeof documentValue.jws !== 'string') return { status: 'invalid' }

  const signedManifest = await verifyReleaseManifestJwsInBrowser(documentValue.jws, publishedJwks)
  if (!signedManifest || !isExpectedManifestKind(signedManifest, kind)) return { status: 'invalid' }
  if (canonicalJsonString(documentValue.manifest) !== canonicalJsonString(signedManifest)) {
    return { status: 'invalid' }
  }
  return { status: 'ok', manifest: signedManifest }
}

async function verifyReleaseManifestClaim(
  payload: SignablePayload,
  publishedJwks: unknown,
  options: BrowserVerifierOptions
): Promise<BrowserReleaseManifestClaim> {
  if (payload.version !== 'w3-v4') return 'not_applicable'
  const expectedHash = payload.provenance?.release_manifest_hash
  if (!expectedHash) return 'mismatch'

  const fetcher = options.fetch ?? globalThis.fetch
  if (!fetcher) return 'unavailable'

  const currentUrl = options.releaseManifestUrl ?? '/.well-known/verchem-release.json'
  const archiveUrl = archiveManifestUrl(expectedHash, currentUrl)
  if (!archiveUrl) return 'mismatch'

  const archived = await fetchPublishedReleaseManifest(archiveUrl, 'archive', publishedJwks, fetcher)
  if (archived.status !== 'ok') {
    return archived.status === 'unavailable' ? 'unavailable' : 'mismatch'
  }
  if (archived.manifest.content_hash !== expectedHash) return 'mismatch'

  const current = await fetchPublishedReleaseManifest(currentUrl, 'current', publishedJwks, fetcher)
  if (current.status !== 'ok') {
    return current.status === 'invalid' ? 'mismatch' : 'unavailable'
  }
  return current.manifest.content_hash === expectedHash ? 'matched_current' : 'matched_superseded'
}

export async function verifyCardJwsInBrowser(
  compactJws: string,
  publishedJwks: unknown,
  options: BrowserVerifierOptions = {}
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
    releaseManifest: 'unavailable',
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
  const releaseManifest = await verifyReleaseManifestClaim(payloadValue, publishedJwks, options)
  return {
    signatureAuthentic: true,
    payload: payloadValue,
    kid,
    keyStatus: publishedKey.status,
    artifactHashMatches,
    releaseManifest,
    error: artifactHashMatches === false
      ? 'The signed provenance hash does not match the signed deterministic tool calls.'
      : null,
  }
}
