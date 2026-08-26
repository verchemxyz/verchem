import { canonicalJsonString } from './canonical-json'

export const RELEASE_MANIFEST_SCHEMA = 'verchem-release-manifest/v1'

export type Sha256Hash = `sha256:${string}`

export interface ReleaseManifestFile {
  path: string
  sha256: Sha256Hash
}

export interface ReleaseManifestBuild {
  git_sha: string
  dirty: boolean
  node: string
}

export interface ReleaseManifestEditions {
  engine_registry: string
  reference_dataset: string
  reference_constants: string
}

/**
 * Immutable engine/data identity material. This, and only this, is addressed
 * by content_hash so operational build metadata cannot invalidate a release.
 */
export interface ReleaseManifestHashable {
  schema: typeof RELEASE_MANIFEST_SCHEMA
  editions: ReleaseManifestEditions
  engine_versions: Record<string, string>
  engines: ReleaseManifestFile[]
  data: ReleaseManifestFile[]
}

export interface ReleaseManifest extends ReleaseManifestHashable {
  /** Operational metadata for the current published manifest only. */
  build: ReleaseManifestBuild
  generated_at: string
  content_hash: Sha256Hash
}

/** Immutable historical manifest stored in the committed archive. */
export interface ReleaseManifestArchive extends ReleaseManifestHashable {
  content_hash: Sha256Hash
}

export type ReleaseManifestDocument = ReleaseManifest | ReleaseManifestArchive

const SHA256_HEX = /^sha256:[a-f0-9]{64}$/
const GIT_SHA = /^(?:[a-f0-9]{40}|unknown)$/
const ENGINE_SEMVER = /^\d+\.\d+\.\d+$/
const MAX_FILES_PER_SECTION = 10_000
const MAX_PATH_LENGTH = 1_024
const MAX_TEXT_LENGTH = 4_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBoundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_TEXT_LENGTH
}

function isReleaseManifestFile(value: unknown): value is ReleaseManifestFile {
  if (!isRecord(value)) return false
  if (Object.keys(value).sort().join(',') !== 'path,sha256') return false
  return typeof value.path === 'string' &&
    value.path.length > 0 &&
    value.path.length <= MAX_PATH_LENGTH &&
    !value.path.startsWith('/') &&
    !value.path.split('/').includes('..') &&
    typeof value.sha256 === 'string' &&
    SHA256_HEX.test(value.sha256)
}

function hasSortedUniquePaths(files: readonly ReleaseManifestFile[]): boolean {
  return files.every((file, index) => index === 0 || files[index - 1]!.path < file.path)
}

function isReleaseManifestFileList(value: unknown): value is ReleaseManifestFile[] {
  return Array.isArray(value) &&
    value.length <= MAX_FILES_PER_SECTION &&
    value.every(isReleaseManifestFile) &&
    hasSortedUniquePaths(value)
}

function isEngineVersions(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false
  return Object.entries(value).every(([engine, version]) =>
    engine.length > 0 && engine.length <= MAX_TEXT_LENGTH &&
    typeof version === 'string' && ENGINE_SEMVER.test(version)
  )
}

function isEditions(value: unknown): value is ReleaseManifestEditions {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !==
    'engine_registry,reference_constants,reference_dataset') return false
  return isBoundedString(value.engine_registry) &&
    isBoundedString(value.reference_dataset) &&
    isBoundedString(value.reference_constants)
}

function isBuild(value: unknown): value is ReleaseManifestBuild {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'dirty,git_sha,node') return false
  return typeof value.git_sha === 'string' && GIT_SHA.test(value.git_sha) &&
    typeof value.dirty === 'boolean' &&
    isBoundedString(value.node)
}

export function isValidReleaseManifest(value: unknown): value is ReleaseManifest {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !==
    'build,content_hash,data,editions,engine_versions,engines,generated_at,schema') return false
  return value.schema === RELEASE_MANIFEST_SCHEMA &&
    isBuild(value.build) &&
    isEditions(value.editions) &&
    isEngineVersions(value.engine_versions) &&
    isReleaseManifestFileList(value.engines) &&
    isReleaseManifestFileList(value.data) &&
    isBoundedString(value.generated_at) &&
    typeof value.content_hash === 'string' &&
    SHA256_HEX.test(value.content_hash)
}

export function isValidReleaseManifestArchive(value: unknown): value is ReleaseManifestArchive {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !==
    'content_hash,data,editions,engine_versions,engines,schema') return false
  return value.schema === RELEASE_MANIFEST_SCHEMA &&
    isEditions(value.editions) &&
    isEngineVersions(value.engine_versions) &&
    isReleaseManifestFileList(value.engines) &&
    isReleaseManifestFileList(value.data) &&
    typeof value.content_hash === 'string' &&
    SHA256_HEX.test(value.content_hash)
}

/**
 * Extract the immutable material addressed by content_hash. build and
 * generated_at are operational metadata, and content_hash itself is excluded
 * to avoid a circular hash.
 */
export function manifestWithoutTimestamp(manifest: ReleaseManifestDocument): ReleaseManifestHashable {
  return {
    schema: manifest.schema,
    editions: manifest.editions,
    engine_versions: manifest.engine_versions,
    engines: manifest.engines,
    data: manifest.data,
  }
}

/** Browser-safe canonical bytes shared by the Node generator and Web Crypto verifier. */
export function manifestContentHashMaterial(manifest: ReleaseManifestHashable): string {
  return canonicalJsonString(manifest)
}
