import { createHash, sign as signEd25519 } from 'node:crypto'
import generatedManifest from './release-manifest.generated.json'
import { getArchivedReleaseManifest as getStaticallyArchivedReleaseManifest } from './release-manifests/index.generated'
import { canonicalJsonString } from './canonical-json'
import {
  isValidReleaseManifestArchive,
  isValidReleaseManifest,
  manifestContentHashMaterial,
  manifestWithoutTimestamp,
  type ReleaseManifest,
  type ReleaseManifestArchive,
  type ReleaseManifestDocument,
  type ReleaseManifestHashable,
  type Sha256Hash,
} from './release-manifest-shape'
import { getActiveSigningKey } from './signing-key'

const RELEASE_MANIFEST_JWS_TYPE = 'verchem-release-manifest+jws'

export class ReleaseManifestMissingError extends Error {
  constructor(message = 'The release manifest is unavailable or invalid.') {
    super(message)
    this.name = 'ReleaseManifestMissingError'
  }
}

/**
 * Hash immutable release material only. Raw source/data byte changes —
 * including whitespace-only formatting edits — intentionally change this hash.
 */
export function calculateManifestContentHash(
  manifestWithoutGeneratedAt: ReleaseManifestHashable
): Sha256Hash {
  const digest = createHash('sha256')
    .update(manifestContentHashMaterial(manifestWithoutGeneratedAt), 'utf8')
    .digest('hex')
  return `sha256:${digest}`
}

function requireReleaseManifest(): ReleaseManifest {
  if (!isValidReleaseManifest(generatedManifest)) {
    throw new ReleaseManifestMissingError()
  }

  const expectedHash = calculateManifestContentHash(manifestWithoutTimestamp(generatedManifest))
  if (generatedManifest.content_hash !== expectedHash) {
    throw new ReleaseManifestMissingError('The release manifest content hash is invalid.')
  }
  return generatedManifest
}

export function getReleaseManifest(): ReleaseManifest {
  return requireReleaseManifest()
}

export function getReleaseManifestHash(): Sha256Hash {
  return requireReleaseManifest().content_hash
}

/**
 * Resolve a committed historical manifest without runtime filesystem access.
 * The generated index statically imports every archive so Vercel bundles it.
 */
export function getArchivedReleaseManifest(hash: string): ReleaseManifestArchive | null {
  const archived = getStaticallyArchivedReleaseManifest(hash)
  if (!archived || !isValidReleaseManifestArchive(archived)) return null
  if (archived.content_hash !== `sha256:${hash}`) return null

  const expectedHash = calculateManifestContentHash(manifestWithoutTimestamp(archived))
  return archived.content_hash === expectedHash ? archived : null
}

function base64url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

const signedManifestJwsByHash = new Map<Sha256Hash, Map<string, string>>()

/** Sign a current or archived canonical manifest with the card trust kernel. */
export async function signReleaseManifest(
  manifest: ReleaseManifestDocument = getReleaseManifest()
): Promise<string> {
  const canonicalManifest = canonicalJsonString(manifest)
  const signaturesForHash = signedManifestJwsByHash.get(manifest.content_hash)
  const memoized = signaturesForHash?.get(canonicalManifest)
  if (memoized) return memoized

  const active = getActiveSigningKey()
  const protectedHeader = {
    alg: 'EdDSA',
    kid: active.kid,
    typ: RELEASE_MANIFEST_JWS_TYPE,
  } as const
  const protectedSegment = base64url(JSON.stringify(protectedHeader))
  const payloadSegment = base64url(canonicalManifest)
  const signingInput = `${protectedSegment}.${payloadSegment}`
  const signature = signEd25519(
    null,
    Buffer.from(signingInput, 'ascii'),
    active.privateKey
  ).toString('base64url')
  const compactJws = `${signingInput}.${signature}`
  const signatures = signaturesForHash ?? new Map<string, string>()
  signatures.set(canonicalManifest, compactJws)
  signedManifestJwsByHash.set(manifest.content_hash, signatures)
  return compactJws
}

export { RELEASE_MANIFEST_JWS_TYPE }
