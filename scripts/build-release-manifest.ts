import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CURRENT_ENGINE_VERSIONS } from '../lib/answer-cards/engine-versions'
import {
  ENGINE_REGISTRY_EDITION,
  REFERENCE_CONSTANTS_EDITION,
  REFERENCE_DATASET_EDITION,
} from '../lib/answer-cards/release-manifest-editions'
import { canonicalJsonString } from '../lib/answer-cards/canonical-json'
import {
  RELEASE_MANIFEST_SCHEMA,
  manifestContentHashMaterial,
  type ReleaseManifest,
  type ReleaseManifestArchive,
  type ReleaseManifestFile,
  type ReleaseManifestHashable,
  type Sha256Hash,
} from '../lib/answer-cards/release-manifest-shape'

const ENGINE_DIRECTORIES = [
  'lib/calculations',
  'lib/lab',
  'lib/answer-cards/tools',
] as const
const ENGINE_FILES = [
  'lib/answer-cards/engine-versions.ts',
  'lib/answer-cards/provenance.ts',
  'lib/answer-cards/canonical-json.ts',
] as const
const DATA_DIRECTORY = 'lib/data'
const DEFAULT_OUTPUT = 'lib/answer-cards/release-manifest.generated.json'
const DEFAULT_ARCHIVE_DIRECTORY = 'lib/answer-cards/release-manifests'
const DEFAULT_ARCHIVE_INDEX = `${DEFAULT_ARCHIVE_DIRECTORY}/index.generated.ts`
const CONTENT_HASH_HEX = /^sha256:([a-f0-9]{64})$/

export interface GenerateReleaseManifestOptions {
  repositoryRoot?: string
  outputPath?: string
  generatedAt?: string
  archiveDirectory?: string
  archiveIndexPath?: string
  environment?: Partial<Pick<NodeJS.ProcessEnv, 'CI' | 'VERCEL'>>
  archiveMissing?: boolean
  log?: (message: string) => void
}

function sha256(bytes: Uint8Array): Sha256Hash {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

async function filesRecursively(root: string, relativeDirectory: string): Promise<string[]> {
  const directory = path.join(root, relativeDirectory)
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.posix.join(relativeDirectory, entry.name)
    if (entry.isDirectory()) return filesRecursively(root, relativePath)
    if (entry.isFile()) return [relativePath]
    return []
  }))
  return files.flat()
}

async function filesWithExtension(
  root: string,
  relativeDirectory: string,
  extension: string
): Promise<string[]> {
  return (await filesRecursively(root, relativeDirectory))
    .filter((file) => file.endsWith(extension))
}

async function hashesFor(root: string, paths: readonly string[]): Promise<ReleaseManifestFile[]> {
  const sortedPaths = [...new Set(paths)].sort()
  return Promise.all(sortedPaths.map(async (relativePath) => ({
    path: relativePath,
    sha256: sha256(await readFile(path.join(root, relativePath))),
  })))
}

function gitOutput(root: string, arguments_: readonly string[]): string | null {
  try {
    return execFileSync('git', [...arguments_], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function buildMetadata(root: string, hashedPaths: readonly string[]) {
  const gitSha = gitOutput(root, ['rev-parse', 'HEAD'])
  const status = gitOutput(root, ['status', '--porcelain', '--', ...hashedPaths])
  return {
    git_sha: gitSha && /^[a-f0-9]{40}$/.test(gitSha) ? gitSha : 'unknown',
    dirty: status !== null && status.length > 0,
    node: process.version,
  }
}

function toArchive(manifest: ReleaseManifest): ReleaseManifestArchive {
  return {
    schema: manifest.schema,
    editions: manifest.editions,
    engine_versions: manifest.engine_versions,
    engines: manifest.engines,
    data: manifest.data,
    content_hash: manifest.content_hash,
  }
}

function contentHashHex(contentHash: Sha256Hash): string {
  const matched = CONTENT_HASH_HEX.exec(contentHash)
  if (!matched) throw new Error(`Invalid release manifest content hash: ${contentHash}`)
  return matched[1]
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath)
    return true
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

async function writeArchiveIndex(archiveDirectory: string, indexPath: string): Promise<void> {
  const entries = await readdir(archiveDirectory, { withFileTypes: true })
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort()
  for (const filename of filenames) {
    if (!/^[a-f0-9]{64}\.json$/.test(filename)) {
      throw new Error(`Invalid release manifest archive filename: ${filename}`)
    }
  }

  const hashes = filenames.map((filename) => filename.slice(0, -'.json'.length))
  const imports = hashes.map((hash) =>
    `import manifest_${hash} from './${hash}.json'`
  )
  const entriesSource = hashes.map((hash) =>
    `  '${hash}': manifest_${hash} as ReleaseManifestArchive,`
  )
  const source = [
    "import type { ReleaseManifestArchive } from '../release-manifest-shape'",
    '',
    '// Generated by scripts/build-release-manifest.ts. Do not edit manually.',
    ...imports,
    '',
    'const ARCHIVED_RELEASE_MANIFESTS: Readonly<Record<string, ReleaseManifestArchive>> = Object.freeze({',
    ...entriesSource,
    '})',
    '',
    'export function getArchivedReleaseManifest(hash: string): ReleaseManifestArchive | null {',
    '  return ARCHIVED_RELEASE_MANIFESTS[hash] ?? null',
    '}',
    '',
  ].join('\n')
  await writeFile(indexPath, source, 'utf8')
}

async function archiveManifest(
  manifest: ReleaseManifest,
  archiveDirectory: string,
  archiveIndexPath: string,
  options: GenerateReleaseManifestOptions
): Promise<void> {
  const archivePath = path.join(archiveDirectory, `${contentHashHex(manifest.content_hash)}.json`)
  const exists = await fileExists(archivePath)
  const environment = options.environment ?? process.env
  const protectedEnvironment = Boolean(environment.CI || environment.VERCEL)
  if (!exists && protectedEnvironment && !options.archiveMissing) {
    throw new Error(
      `new release manifest ${manifest.content_hash} is not archived — run npm run release:archive and commit`
    )
  }

  if (!exists && options.archiveMissing) {
    // Explicit `npm run release:archive` only. Local dev/test runs must not
    // litter the archive with one file per intermediate edit; only manifests
    // that are actually deployed get archived (and committed).
    await writeFile(archivePath, `${canonicalJsonString(toArchive(manifest))}\n`, 'utf8')
    options.log?.(`Archived release manifest ${manifest.content_hash}; commit the archive with this release.`)
  } else if (!exists) {
    options.log?.(
      `Release manifest ${manifest.content_hash} is not archived yet (fine for local work; ` +
      'run npm run release:archive before committing a release).'
    )
  }
  await writeArchiveIndex(archiveDirectory, archiveIndexPath)
}

export function calculateGeneratedManifestContentHash(
  manifestWithoutGeneratedAt: ReleaseManifestHashable
): Sha256Hash {
  return `sha256:${createHash('sha256')
    .update(manifestContentHashMaterial(manifestWithoutGeneratedAt), 'utf8')
    .digest('hex')}`
}

export async function generateReleaseManifest(
  options: GenerateReleaseManifestOptions = {}
): Promise<ReleaseManifest> {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd())
  const outputPath = path.resolve(repositoryRoot, options.outputPath ?? DEFAULT_OUTPUT)
  const archiveDirectory = path.resolve(repositoryRoot, options.archiveDirectory ?? DEFAULT_ARCHIVE_DIRECTORY)
  const archiveIndexPath = path.resolve(repositoryRoot, options.archiveIndexPath ?? DEFAULT_ARCHIVE_INDEX)
  const enginePaths = [
    ...(await Promise.all(ENGINE_DIRECTORIES.map((directory) =>
      filesWithExtension(repositoryRoot, directory, '.ts')
    ))).flat(),
    ...ENGINE_FILES,
  ].sort()
  const dataPaths = (await filesRecursively(repositoryRoot, DATA_DIRECTORY)).sort()
  const [engines, data] = await Promise.all([
    hashesFor(repositoryRoot, enginePaths),
    hashesFor(repositoryRoot, dataPaths),
  ])
  const manifestContent: ReleaseManifestHashable = {
    schema: RELEASE_MANIFEST_SCHEMA,
    editions: {
      engine_registry: ENGINE_REGISTRY_EDITION,
      reference_dataset: REFERENCE_DATASET_EDITION,
      reference_constants: REFERENCE_CONSTANTS_EDITION,
    },
    engine_versions: { ...CURRENT_ENGINE_VERSIONS },
    engines,
    data,
  }
  const manifest: ReleaseManifest = {
    ...manifestContent,
    build: buildMetadata(repositoryRoot, [...enginePaths, ...dataPaths]),
    generated_at: options.generatedAt ?? new Date().toISOString(),
    content_hash: calculateGeneratedManifestContentHash(manifestContent),
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${canonicalJsonString(manifest)}\n`, 'utf8')
  await mkdir(archiveDirectory, { recursive: true })
  await archiveManifest(manifest, archiveDirectory, archiveIndexPath, options)
  return manifest
}

async function main(): Promise<void> {
  const archiveMissing = process.argv.includes('--archive')
  const manifest = await generateReleaseManifest({
    archiveMissing,
    log: (message) => console.log(message),
  })
  console.log(`Generated release manifest ${manifest.content_hash}`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  void main().catch((error: unknown) => {
    console.error('Failed to generate release manifest:', error)
    process.exitCode = 1
  })
}
