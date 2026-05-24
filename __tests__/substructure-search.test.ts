/**
 * Substructure & similarity search — REAL RDKit WASM integration test.
 *
 * Exercises the production search core (substructure-core.ts) with the genuine
 * WASM module and a small corpus whose answers are known by inspection. This
 * verifies chemical correctness of matching semantics (aromaticity, carbonyl
 * patterns, Tanimoto ordering), not just code shape — the W2 R2 lesson.
 *
 * Run: node --import tsx __tests__/substructure-search.test.ts
 */

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import {
  runSubstructureSearch,
  runSimilaritySearch,
  tanimotoSimilarity,
  type SearchEngine,
  type CorpusEntry,
} from '@/lib/rdkit/substructure-core'

// ---- Load REAL RDKit WASM in Node ----
async function loadRealRDKit(): Promise<SearchEngine> {
  const require = createRequire(join(process.cwd(), 'package.json'))
  const mod = require('@rdkit/rdkit') as
    | { default?: (o: { locateFile: () => string }) => Promise<SearchEngine> }
    | ((o: { locateFile: () => string }) => Promise<SearchEngine>)
  const init = (typeof mod === 'function' ? mod : mod.default)!
  const wasmPath = require.resolve('@rdkit/rdkit/dist/RDKit_minimal.wasm')
  return init({ locateFile: () => wasmPath })
}

const CORPUS: CorpusEntry[] = [
  { id: 'benzene', smiles: 'c1ccccc1' },
  { id: 'toluene', smiles: 'Cc1ccccc1' },
  { id: 'phenol', smiles: 'Oc1ccccc1' },
  { id: 'aniline', smiles: 'Nc1ccccc1' },
  { id: 'benzoic-acid', smiles: 'O=C(O)c1ccccc1' },
  { id: 'methane', smiles: 'C' },
  { id: 'ethanol', smiles: 'CCO' },
  { id: 'propanol', smiles: 'CCCO' },
  { id: 'acetic-acid', smiles: 'CC(=O)O' },
  { id: 'acetone', smiles: 'CC(C)=O' },
]

// ---- runner ----
type AsyncTestFn = () => void | Promise<void>
const tests: Array<{ name: string; fn: AsyncTestFn }> = []
function test(name: string, fn: AsyncTestFn) {
  tests.push({ name, fn })
}

async function main() {
  console.log('Substructure & Similarity Search Tests (real RDKit WASM)\n')
  const rdkit = await loadRealRDKit()

  const ids = (r: { hits: Array<{ id: string }> }) => r.hits.map((h) => h.id).sort()

  // --- substructure: aromatic ring ---
  test('benzene ring query matches only aromatic compounds', () => {
    const res = runSubstructureSearch(rdkit, 'c1ccccc1', CORPUS)
    assert.equal(res.queryValid, true)
    assert.deepEqual(ids(res), ['aniline', 'benzene', 'benzoic-acid', 'phenol', 'toluene'])
  })

  test('aromatic matches carry non-empty atomIndices (for highlighting)', () => {
    const res = runSubstructureSearch(rdkit, 'c1ccccc1', CORPUS)
    for (const hit of res.hits) {
      assert.ok(hit.atomIndices.length >= 6, `${hit.id} should match >= 6 ring atoms`)
    }
  })

  // --- substructure: carboxylic acid ---
  test('carboxyl query C(=O)O matches only carboxylic acids', () => {
    const res = runSubstructureSearch(rdkit, 'C(=O)O', CORPUS)
    assert.equal(res.queryValid, true)
    assert.deepEqual(ids(res), ['acetic-acid', 'benzoic-acid'])
  })

  test('aldehyde/ketone is not matched by carboxyl pattern', () => {
    const res = runSubstructureSearch(rdkit, 'C(=O)O', CORPUS)
    assert.ok(!ids(res).includes('acetone'))
  })

  // --- substructure: limit + invalid ---
  test('limit caps the number of hits', () => {
    const res = runSubstructureSearch(rdkit, 'c1ccccc1', CORPUS, { limit: 2 })
    assert.equal(res.hits.length, 2)
  })

  test('empty query returns queryValid=false, no hits', () => {
    const res = runSubstructureSearch(rdkit, '   ', CORPUS)
    assert.equal(res.queryValid, false)
    assert.equal(res.hits.length, 0)
  })

  test('plain SMILES query also works as a substructure pattern', () => {
    // "aliphatic carbon bonded to a benzene ring" → toluene (methyl) AND
    // benzoic-acid (carboxyl carbon is also an sp2 carbon bonded to the ring).
    // Phenol/aniline attach O/N (not C) so they do not match. This subtlety
    // is exactly why substructure search needs real connectivity, not formula.
    const res = runSubstructureSearch(rdkit, 'Cc1ccccc1', CORPUS)
    assert.deepEqual(ids(res), ['benzoic-acid', 'toluene'])
  })

  // --- similarity ---
  test('similarity ranks propanol query: self first, ethanol > benzene', () => {
    const res = runSimilaritySearch(rdkit, 'CCCO', CORPUS, { threshold: 0 })
    assert.equal(res.queryValid, true)
    // most-similar first
    assert.equal(res.hits[0].id, 'propanol')
    assert.ok(Math.abs(res.hits[0].similarity - 1) < 1e-9)
    const sim = Object.fromEntries(res.hits.map((h) => [h.id, h.similarity]))
    assert.ok((sim['ethanol'] ?? 0) > (sim['benzene'] ?? 0), 'ethanol closer than benzene')
  })

  test('similarity threshold filters out dissimilar molecules', () => {
    const res = runSimilaritySearch(rdkit, 'CCCO', CORPUS, { threshold: 0.5 })
    // benzene/toluene/aniline should not pass a 0.5 cutoff vs propanol
    assert.ok(!ids(res).includes('benzene'))
  })

  test('similarity hits are sorted descending', () => {
    const res = runSimilaritySearch(rdkit, 'CCCO', CORPUS, { threshold: 0 })
    for (let i = 1; i < res.hits.length; i++) {
      assert.ok(res.hits[i - 1].similarity >= res.hits[i].similarity)
    }
  })

  test('empty similarity query returns queryValid=false', () => {
    const res = runSimilaritySearch(rdkit, '', CORPUS)
    assert.equal(res.queryValid, false)
  })

  // --- tanimoto pure fn re-exported here ---
  test('tanimotoSimilarity identical = 1, disjoint = 0', () => {
    assert.equal(tanimotoSimilarity('1100', '1100'), 1)
    assert.equal(tanimotoSimilarity('1100', '0011'), 0)
  })

  // run
  let passed = 0
  let failed = 0
  for (const { name, fn } of tests) {
    try {
      await fn()
      passed++
      console.log(`  ✅ ${name}`)
    } catch (err) {
      failed++
      console.error(`  ❌ ${name}`)
      console.error('    ', (err as Error).message)
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
