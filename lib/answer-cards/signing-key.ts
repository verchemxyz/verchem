import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type JsonWebKey,
  type KeyObject,
} from 'node:crypto'

export interface VerchemPublicJwk {
  kty: 'OKP'
  crv: 'Ed25519'
  x: string
}

export interface PublishedVerchemJwk extends VerchemPublicJwk {
  kid: string
  status: 'active' | 'pending' | 'retired'
  not_after?: string
}

export interface PendingVerchemJwk extends VerchemPublicJwk {
  kid: string
  status: 'pending'
  not_after?: string
}

interface RetiredVerchemJwk extends VerchemPublicJwk {
  kid: string
  status: 'retired'
  not_after?: string
}

interface ActiveSigningKey {
  privateKey: KeyObject
  publicKey: KeyObject
  publicJwk: VerchemPublicJwk
  kid: string
}

interface CachedSigningKey extends ActiveSigningKey {
  sourceId: string
}

export class SigningKeyConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SigningKeyConfigurationError'
  }
}

/**
 * Two-phase key rotation (the JWKS cache TTL is one hour):
 *
 * 1. Append the new PUBLIC JWK to PENDING_PUBLIC_KEYS with status "pending",
 *    deploy, then wait at least the full cache TTL (>= 1 hour).
 * 2. Switch CARD_SIGNING_PRIVATE_KEY to the new private key, remove its public
 *    JWK from PENDING_PUBLIC_KEYS, and append the previous PUBLIC JWK to
 *    RETIRED_PUBLIC_KEYS with status "retired" in the same deploy.
 *
 * Never remove a retired key: historical cards must remain independently
 * verifiable forever. A pending entry contains public material only.
 */
export const PENDING_PUBLIC_KEYS: readonly PendingVerchemJwk[] = []
export const RETIRED_PUBLIC_KEYS: readonly RetiredVerchemJwk[] = []

const EPHEMERAL_SOURCE_ID = 'ephemeral-development-key'

let cachedSigningKey: CachedSigningKey | null = null
let warnedAboutEphemeralKey = false

function base64urlSha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('base64url')
}

/** RFC 7638 thumbprint for an Ed25519 public JWK. */
export function calculateJwkThumbprint(jwk: VerchemPublicJwk): string {
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })
  return base64urlSha256(canonical)
}

function publicJwkFromKey(publicKey: KeyObject): VerchemPublicJwk {
  const exported = publicKey.export({ format: 'jwk' })
  if (exported.kty !== 'OKP' || exported.crv !== 'Ed25519' || typeof exported.x !== 'string') {
    throw new SigningKeyConfigurationError(
      'CARD_SIGNING_PRIVATE_KEY must contain an Ed25519 PKCS8 private key'
    )
  }

  return Object.freeze({ kty: 'OKP', crv: 'Ed25519', x: exported.x })
}

function activeSigningKey(privateKey: KeyObject): ActiveSigningKey {
  if (privateKey.type !== 'private' || privateKey.asymmetricKeyType !== 'ed25519') {
    throw new SigningKeyConfigurationError(
      'CARD_SIGNING_PRIVATE_KEY must contain an Ed25519 PKCS8 private key'
    )
  }

  const publicKey = createPublicKey(privateKey)
  const publicJwk = publicJwkFromKey(publicKey)
  return {
    privateKey,
    publicKey,
    publicJwk,
    kid: calculateJwkThumbprint(publicJwk),
  }
}

function configuredPrivateKey(encodedPem: string): ActiveSigningKey {
  const encoded = encodedPem.trim()
  if (
    encoded.length === 0 ||
    encoded.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
  ) {
    throw new SigningKeyConfigurationError(
      'CARD_SIGNING_PRIVATE_KEY must be base64-encoded PKCS8 PEM'
    )
  }

  const pemBytes = Buffer.from(encoded, 'base64')
  const canonicalInput = encoded.replace(/=+$/u, '')
  const canonicalDecoded = pemBytes.toString('base64').replace(/=+$/u, '')
  const pem = pemBytes.toString('utf8')

  if (
    canonicalDecoded !== canonicalInput ||
    !pem.startsWith('-----BEGIN PRIVATE KEY-----') ||
    !pem.trimEnd().endsWith('-----END PRIVATE KEY-----')
  ) {
    throw new SigningKeyConfigurationError(
      'CARD_SIGNING_PRIVATE_KEY must be base64-encoded PKCS8 PEM'
    )
  }

  try {
    return activeSigningKey(createPrivateKey({ key: pem, format: 'pem' }))
  } catch (error: unknown) {
    if (error instanceof SigningKeyConfigurationError) throw error
    throw new SigningKeyConfigurationError(
      'CARD_SIGNING_PRIVATE_KEY must contain an Ed25519 PKCS8 private key'
    )
  }
}

function ephemeralSigningKey(): ActiveSigningKey {
  const { privateKey } = generateKeyPairSync('ed25519')
  return activeSigningKey(privateKey)
}

/**
 * Lazily load the active key. Production deliberately has no fallback: card
 * creation must fail closed when its signing key is unavailable.
 */
export function getActiveSigningKey(): ActiveSigningKey {
  const configured = process.env.CARD_SIGNING_PRIVATE_KEY

  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new SigningKeyConfigurationError(
        'CARD_SIGNING_PRIVATE_KEY is required in production'
      )
    }

    if (cachedSigningKey?.sourceId === EPHEMERAL_SOURCE_ID) {
      return cachedSigningKey
    }

    if (!warnedAboutEphemeralKey) {
      console.warn(
        'CARD_SIGNING_PRIVATE_KEY is not configured; using an ephemeral Ed25519 key for development/testing.'
      )
      warnedAboutEphemeralKey = true
    }

    cachedSigningKey = {
      ...ephemeralSigningKey(),
      sourceId: EPHEMERAL_SOURCE_ID,
    }
    return cachedSigningKey
  }

  // Cache by a one-way source identifier so the private environment value is
  // neither retained for comparison nor ever logged/serialized.
  const sourceId = `configured:${base64urlSha256(configured)}`
  if (cachedSigningKey?.sourceId === sourceId) {
    return cachedSigningKey
  }

  cachedSigningKey = {
    ...configuredPrivateKey(configured),
    sourceId,
  }
  return cachedSigningKey
}

function nodePublicJwk(jwk: VerchemPublicJwk): JsonWebKey {
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x }
}

type RotationVerchemJwk = PendingVerchemJwk | RetiredVerchemJwk

function validateRotationKey(jwk: RotationVerchemJwk): VerchemPublicJwk {
  const allowedMembers = new Set(['kty', 'crv', 'x', 'kid', 'status', 'not_after'])
  if (
    Object.keys(jwk).some((member) => !allowedMembers.has(member)) ||
    (jwk.status !== 'pending' && jwk.status !== 'retired') ||
    jwk.kty !== 'OKP' ||
    jwk.crv !== 'Ed25519' ||
    typeof jwk.x !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(jwk.x) ||
    calculateJwkThumbprint(jwk) !== jwk.kid
  ) {
    throw new SigningKeyConfigurationError(
      'Published rotation keys contain an invalid Ed25519 JWK'
    )
  }
  const publicJwk = { kty: jwk.kty, crv: jwk.crv, x: jwk.x } as const
  try {
    const publicKey = createPublicKey({ key: nodePublicJwk(publicJwk), format: 'jwk' })
    if (publicKey.asymmetricKeyType !== 'ed25519') throw new Error('Not Ed25519')
  } catch {
    throw new SigningKeyConfigurationError(
      'Published rotation keys contain an invalid Ed25519 JWK'
    )
  }
  return publicJwk
}

export function getPublishedPublicKeys(): PublishedVerchemJwk[] {
  const active = getActiveSigningKey()
  const rotationKeys: readonly RotationVerchemJwk[] = [
    ...PENDING_PUBLIC_KEYS,
    ...RETIRED_PUBLIC_KEYS,
  ]
  for (const key of rotationKeys) validateRotationKey(key)

  return [
    { ...active.publicJwk, kid: active.kid, status: 'active' },
    ...rotationKeys.map((key) => ({
      kty: key.kty,
      crv: key.crv,
      x: key.x,
      kid: key.kid,
      status: key.status,
      ...(key.not_after === undefined ? {} : { not_after: key.not_after }),
    })),
  ]
}

/** Resolve any currently published active/pending/retired key by its RFC 7638 kid. */
export function getVerificationKey(kid: string): KeyObject | null {
  const active = getActiveSigningKey()
  if (kid === active.kid) return active.publicKey

  const rotationKey =
    PENDING_PUBLIC_KEYS.find((candidate) => candidate.kid === kid) ??
    RETIRED_PUBLIC_KEYS.find((candidate) => candidate.kid === kid)
  if (!rotationKey) return null

  const publicJwk = validateRotationKey(rotationKey)
  try {
    return createPublicKey({ key: nodePublicJwk(publicJwk), format: 'jwk' })
  } catch {
    throw new SigningKeyConfigurationError(
      'Published rotation keys contain an invalid Ed25519 JWK'
    )
  }
}
