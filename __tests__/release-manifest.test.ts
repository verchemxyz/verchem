import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { GET as getArchivedReleaseManifestRoute } from '@/app/.well-known/verchem-release/[hash].json/route'
import { GET as getReleaseManifestRoute } from '@/app/.well-known/verchem-release.json/route'
import {
  verifyCardJwsInBrowser,
  verifyReleaseManifestJwsInBrowser,
} from '@/lib/answer-cards/browser-verifier'
import { createDeterministicAnswerCard } from '@/lib/answer-cards/deterministic-card'
import { getPublishedPublicKeys } from '@/lib/answer-cards/signing-key'
import { signCard, toSignablePayload } from '@/lib/answer-cards/signature'
import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import {
  calculateManifestContentHash,
  signReleaseManifest,
} from '@/lib/answer-cards/release-manifest'
import {
  manifestWithoutTimestamp,
  type ReleaseManifest,
  type ReleaseManifestArchive,
} from '@/lib/answer-cards/release-manifest-shape'
import { parseSubmittedCard } from '@/lib/answer-cards/validate-card'
import { generateReleaseManifest } from '@/scripts/build-release-manifest'

type TestCase = { name: string; run: () => void | Promise<void> }

const tests: TestCase[] = []

function test(name: string, run: TestCase['run']): void {
  tests.push({ name, run })
}

async function writeFixture(root: string, relativePath: string, content: string): Promise<void> {
  const destination = path.join(root, relativePath)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, content, 'utf8')
}

test('generator archives immutable content locally, rejects missing CI archives, and changes on a data byte', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'verchem-release-manifest-'))
  const outputPath = 'lib/answer-cards/release-manifest.generated.json'
  try {
    await Promise.all([
      writeFixture(root, 'lib/calculations/example.ts', 'export const calculation = 1\n'),
      writeFixture(root, 'lib/lab/example.ts', 'export const lab = 1\n'),
      writeFixture(root, 'lib/answer-cards/tools/example.ts', 'export const tool = 1\n'),
      writeFixture(root, 'lib/answer-cards/engine-versions.ts', 'export {}\n'),
      writeFixture(root, 'lib/answer-cards/provenance.ts', 'export {}\n'),
      writeFixture(root, 'lib/answer-cards/canonical-json.ts', 'export {}\n'),
      writeFixture(root, 'lib/data/reference.txt', 'reference-v1\n'),
    ])

    // Without --archive, local generation must NOT write an archive file.
    const unarchived = await generateReleaseManifest({
      repositoryRoot: root,
      outputPath,
      generatedAt: '2026-08-26T00:00:00.000Z',
    })
    const unarchivedPath = path.join(
      root,
      'lib/answer-cards/release-manifests',
      `${unarchived.content_hash.slice('sha256:'.length)}.json`
    )
    await assert.rejects(readFile(unarchivedPath, 'utf8'), 'local runs must not auto-archive')

    const first = await generateReleaseManifest({
      repositoryRoot: root,
      outputPath,
      generatedAt: '2026-08-26T00:00:00.000Z',
      archiveMissing: true,
    })
    assert.equal(first.build.dirty, 'unknown', 'git-less builds must state that dirty status is unknown')
    const firstBytes = await readFile(path.join(root, outputPath), 'utf8')
    const firstArchivePath = path.join(
      root,
      'lib/answer-cards/release-manifests',
      `${first.content_hash.slice('sha256:'.length)}.json`
    )
    const firstArchive: unknown = JSON.parse(await readFile(firstArchivePath, 'utf8')) as unknown
    assert.ok(typeof firstArchive === 'object' && firstArchive !== null && !Array.isArray(firstArchive))
    assert.equal('build' in firstArchive, false)
    assert.equal('generated_at' in firstArchive, false)
    const second = await generateReleaseManifest({
      repositoryRoot: root,
      outputPath,
      generatedAt: '2026-08-26T01:00:00.000Z',
    })
    assert.equal(first.content_hash, second.content_hash)
    assert.notEqual(first.generated_at, second.generated_at)
    assert.notEqual(firstBytes, await readFile(path.join(root, outputPath), 'utf8'))
    const metadataOnlyRedeploy: ReleaseManifest = {
      ...first,
      build: {
        ...first.build,
        git_sha: 'f'.repeat(40),
      },
      generated_at: '2026-08-26T01:00:00.000Z',
    }
    assert.equal(
      calculateManifestContentHash(manifestWithoutTimestamp(first)),
      calculateManifestContentHash(manifestWithoutTimestamp(metadataOnlyRedeploy))
    )

    await writeFixture(root, 'lib/data/reference.txt', 'reference-v2\n')
    await assert.rejects(
      generateReleaseManifest({
        repositoryRoot: root,
        outputPath,
        generatedAt: '2026-08-26T02:00:00.000Z',
        environment: { CI: '1' },
      }),
      /new release manifest sha256:[a-f0-9]{64} is not archived — run npm run release:archive and commit/
    )
    const changed = await generateReleaseManifest({
      repositoryRoot: root,
      outputPath,
      generatedAt: '2026-08-26T03:00:00.000Z',
    })
    assert.notEqual(changed.content_hash, first.content_hash)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('release route returns a canonical manifest with an independently valid JWS', async () => {
  const response = await getReleaseManifestRoute()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600, must-revalidate')
  const document: unknown = await response.json()
  assert.ok(typeof document === 'object' && document !== null && !Array.isArray(document))
  const record = document as Record<string, unknown>
  assert.equal(typeof record.jws, 'string')
  const manifest = await verifyReleaseManifestJwsInBrowser(
    record.jws as string,
    { keys: getPublishedPublicKeys() }
  )
  assert.ok(manifest)
  assert.deepEqual(record.manifest, manifest)
})

test('archived release route serves a signed archive and rejects unknown or malformed hashes', async () => {
  const currentResponse = await getReleaseManifestRoute()
  const currentDocument: unknown = await currentResponse.json()
  assert.ok(typeof currentDocument === 'object' && currentDocument !== null && !Array.isArray(currentDocument))
  const currentManifest = (currentDocument as Record<string, unknown>).manifest as ReleaseManifest
  const hash = currentManifest.content_hash.slice('sha256:'.length)

  const archivedResponse = await getArchivedReleaseManifestRoute(
    new Request(`https://verchem.xyz/.well-known/verchem-release/${hash}.json`),
    { params: Promise.resolve({ hash }) }
  )
  assert.equal(archivedResponse.status, 200)
  const archivedDocument: unknown = await archivedResponse.json()
  assert.ok(typeof archivedDocument === 'object' && archivedDocument !== null && !Array.isArray(archivedDocument))
  const archivedRecord = archivedDocument as Record<string, unknown>
  assert.equal(typeof archivedRecord.jws, 'string')
  const archivedManifest = await verifyReleaseManifestJwsInBrowser(
    archivedRecord.jws as string,
    { keys: getPublishedPublicKeys() }
  )
  assert.ok(archivedManifest)
  assert.deepEqual(archivedRecord.manifest, archivedManifest)
  assert.equal('build' in archivedManifest, false)
  assert.equal('generated_at' in archivedManifest, false)

  const unknownResponse = await getArchivedReleaseManifestRoute(
    new Request('https://verchem.xyz/.well-known/verchem-release/ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff.json'),
    { params: Promise.resolve({ hash: 'f'.repeat(64) }) }
  )
  assert.equal(unknownResponse.status, 404)

  const malformedResponse = await getArchivedReleaseManifestRoute(
    new Request('https://verchem.xyz/.well-known/verchem-release/not-a-hash.json'),
    { params: Promise.resolve({ hash: 'not-a-hash' }) }
  )
  assert.equal(malformedResponse.status, 400)
})

test('w3-v4 requires release_manifest_hash while w3-v3 remains compatible', async () => {
  const card = await createDeterministicAnswerCard(
    'calculate_molecular_mass',
    { formula: 'H2SO4' },
    '2026-08-26T00:00:00.000Z'
  )
  const missingHash = structuredClone(toSignablePayload(card))
  assert.ok(missingHash.provenance)
  delete missingHash.provenance.release_manifest_hash
  assert.equal(isValidSignablePayload(missingHash), false)
  const invalidSignature = await signCard(missingHash)
  assert.equal(parseSubmittedCard({
    ...missingHash,
    verified: missingHash.status === 'verified',
    signature: invalidSignature,
  }), null)

  const historical = structuredClone(toSignablePayload(card))
  historical.version = 'w3-v3'
  assert.ok(historical.provenance)
  delete historical.provenance.release_manifest_hash
  const historicalSignature = await signCard(historical)
  assert.equal(isValidSignablePayload(historical), true)
  assert.ok(parseSubmittedCard({
    ...historical,
    verified: historical.status === 'verified',
    signature: historicalSignature,
  }))
})

test('browser release-manifest claim distinguishes current, superseded, mismatch, unavailable, and not_applicable', async () => {
  const card = await createDeterministicAnswerCard(
    'calculate_molecular_mass',
    { formula: 'H2SO4' },
    '2026-08-26T00:00:00.000Z'
  )
  const publishedJwks = { keys: getPublishedPublicKeys() }
  const routeResponse = await getReleaseManifestRoute()
  const routeDocument: unknown = await routeResponse.json()
  assert.ok(typeof routeDocument === 'object' && routeDocument !== null && !Array.isArray(routeDocument))
  const currentManifest = (routeDocument as Record<string, unknown>).manifest as ReleaseManifest
  const currentHash = currentManifest.content_hash.slice('sha256:'.length)
  const archiveResponse = await getArchivedReleaseManifestRoute(
    new Request(`https://verchem.xyz/.well-known/verchem-release/${currentHash}.json`),
    { params: Promise.resolve({ hash: currentHash }) }
  )
  const archiveDocument: unknown = await archiveResponse.json()

  const matched = await verifyCardJwsInBrowser(card.signature, publishedJwks, {
    fetch: async (input) => new Response(
      JSON.stringify(String(input).includes('/verchem-release/') ? archiveDocument : routeDocument),
      { status: 200 }
    ),
  })
  assert.equal(matched.releaseManifest, 'matched_current')

  const supersededContent = {
    ...manifestWithoutTimestamp(currentManifest),
    engine_versions: {
      ...currentManifest.engine_versions,
      'molecular-mass': '2.0.1',
    },
  }
  const supersededManifest: ReleaseManifestArchive = {
    ...supersededContent,
    content_hash: calculateManifestContentHash(supersededContent),
  }
  const supersededDocument = {
    manifest: supersededManifest,
    jws: await signReleaseManifest(supersededManifest),
  }
  const supersededPayload = structuredClone(toSignablePayload(card))
  assert.ok(supersededPayload.provenance)
  supersededPayload.provenance.release_manifest_hash = supersededManifest.content_hash
  const supersededCardJws = await signCard(supersededPayload)
  const superseded = await verifyCardJwsInBrowser(supersededCardJws, publishedJwks, {
    fetch: async (input) => new Response(
      JSON.stringify(String(input).includes('/verchem-release/') ? supersededDocument : routeDocument),
      { status: 200 }
    ),
  })
  assert.equal(superseded.releaseManifest, 'matched_superseded')

  const alteredDocument = structuredClone(routeDocument as Record<string, unknown>)
  assert.ok(typeof alteredDocument.manifest === 'object' && alteredDocument.manifest !== null)
  ;(alteredDocument.manifest as Record<string, unknown>).content_hash = `sha256:${'0'.repeat(64)}`
  const mismatch = await verifyCardJwsInBrowser(card.signature, publishedJwks, {
    fetch: async () => new Response(JSON.stringify(alteredDocument), { status: 200 }),
  })
  assert.equal(mismatch.releaseManifest, 'mismatch')

  const unavailable = await verifyCardJwsInBrowser(card.signature, publishedJwks, {
    fetch: async () => { throw new Error('network unavailable') },
  })
  assert.equal(unavailable.releaseManifest, 'unavailable')

  const historical = structuredClone(toSignablePayload(card))
  historical.version = 'w3-v3'
  assert.ok(historical.provenance)
  delete historical.provenance.release_manifest_hash
  const historicalJws = await signCard(historical)
  const notApplicable = await verifyCardJwsInBrowser(historicalJws, publishedJwks, {
    fetch: async () => new Response(JSON.stringify(routeDocument), { status: 200 }),
  })
  assert.equal(notApplicable.releaseManifest, 'not_applicable')
})

async function run(): Promise<void> {
  let failed = 0
  for (const current of tests) {
    try {
      await current.run()
      console.log('  ✓', current.name)
    } catch (error: unknown) {
      failed++
      console.error('  ✗', current.name)
      console.error('   ', error instanceof Error ? error.message : error)
    }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

void run()
