/**
 * Compound SMILES verification — REAL RDKit WASM integration test.
 *
 * Purpose: guarantee every curated SMILES in `smiles-data.ts` actually
 * represents the molecule whose formula the compounds DB claims.
 *
 *   RDKit.get_mol(smiles) → element composition  ===  parseFormula(DB formula)
 *
 * Unlike rdkit-operations.test.ts (which mocks the WASM boundary), this test
 * loads the genuine RDKit module so a typo that yields a different formula
 * fails CI. This is the W2 "tests must exercise production code + real data"
 * lesson applied to data integrity, and doubles as the first real-WASM
 * integration test promised for Day 7.
 *
 * Run: node --import tsx __tests__/compound-smiles-verification.test.ts
 */

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { SMILES_BY_ID } from '@/lib/data/compounds/smiles-data'
import {
  COMPREHENSIVE_COMPOUNDS,
  COMPOUNDS_WITH_SMILES,
} from '@/lib/data/compounds'
import { parseFormula } from '@/lib/data/compounds/utils'
import { molJsonToComposition } from '@/lib/rdkit/formula'

// ---- Minimal RDKit typing (only what we use) ----
interface JSMol {
  is_valid: () => boolean
  get_json: () => string
  delete: () => void
}
interface RDKitMin {
  get_mol: (smiles: string) => JSMol | null
}

// ---- Load REAL RDKit WASM in Node ----
async function loadRealRDKit(): Promise<RDKitMin> {
  const require = createRequire(join(process.cwd(), 'package.json'))
  const mod = require('@rdkit/rdkit') as
    | { default?: (o: { locateFile: () => string }) => Promise<RDKitMin> }
    | ((o: { locateFile: () => string }) => Promise<RDKitMin>)
  const init = (typeof mod === 'function' ? mod : mod.default)!
  const wasmPath = require.resolve('@rdkit/rdkit/dist/RDKit_minimal.wasm')
  return init({ locateFile: () => wasmPath })
}

// ---- Compose an id → DB compound lookup (first match wins, like findCompoundById) ----
const compoundById = new Map<string, (typeof COMPREHENSIVE_COMPOUNDS)[number]>()
for (const c of COMPREHENSIVE_COMPOUNDS) {
  if (!compoundById.has(c.id)) compoundById.set(c.id, c)
}

function compositionsEqual(
  a: Record<string, number>,
  b: Record<string, number>
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if ((a[k] ?? 0) !== (b[k] ?? 0)) return false
  }
  return true
}

function fmt(comp: Record<string, number>): string {
  return Object.entries(comp)
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([el, n]) => `${el}${n}`)
    .join(' ')
}

async function run() {
  console.log('Compound SMILES Verification (real RDKit WASM)\n')
  const rdkit = await loadRealRDKit()

  let passed = 0
  const failures: string[] = []
  const ids = Object.keys(SMILES_BY_ID)

  // --- 1. No orphan ids: every mapped id must exist in the DB ---
  for (const id of ids) {
    if (!compoundById.has(id)) {
      failures.push(`orphan id "${id}" in SMILES_BY_ID has no matching compound`)
    }
  }

  // --- 2. Every SMILES parses AND matches the DB formula composition ---
  for (const id of ids) {
    const compound = compoundById.get(id)
    if (!compound) continue // already reported as orphan
    const smiles = SMILES_BY_ID[id]

    let mol: JSMol | null = null
    try {
      mol = rdkit.get_mol(smiles)
      if (!mol || !mol.is_valid()) {
        failures.push(`${id}: RDKit cannot parse SMILES "${smiles}"`)
        continue
      }

      const rdkitComp = molJsonToComposition(mol.get_json())
      const dbComp = parseFormula(compound.formula.replace(/[\s·]/g, ''))

      if (rdkitComp === null) {
        failures.push(`${id}: RDKit composition unavailable (unknown atomic number)`)
        continue
      }
      if (dbComp === null) {
        failures.push(`${id}: cannot parse DB formula "${compound.formula}"`)
        continue
      }
      if (!compositionsEqual(rdkitComp, dbComp)) {
        failures.push(
          `${id}: composition mismatch\n` +
            `      SMILES "${smiles}" → ${fmt(rdkitComp)}\n` +
            `      DB formula "${compound.formula}" → ${fmt(dbComp)}`
        )
        continue
      }
      passed++
    } finally {
      mol?.delete()
    }
  }

  // --- 3. Sanity: the search corpus is non-trivial and equals mapped count ---
  test('COMPOUNDS_WITH_SMILES is populated', () => {
    assert.ok(
      COMPOUNDS_WITH_SMILES.length >= 100,
      `expected >= 100 compounds with SMILES, got ${COMPOUNDS_WITH_SMILES.length}`
    )
  })

  test('every COMPOUNDS_WITH_SMILES entry has a valid id in the map', () => {
    for (const c of COMPOUNDS_WITH_SMILES) {
      assert.ok(SMILES_BY_ID[c.id], `compound ${c.id} has smiles but no map entry`)
    }
  })

  // Scope guard: the library encodes constitution, not stereochemistry, so
  // D-amino-acid enantiomers (which would duplicate their L-form SMILES) and
  // isomer mixtures must NOT be searchable. (สมหมาย R1 blocker)
  test('no D-amino-acid stereoisomer duplicates in the searchable corpus', () => {
    const dForms = COMPOUNDS_WITH_SMILES.filter((c) => /^D-/.test(c.name))
    assert.equal(
      dForms.length,
      0,
      `D-stereoisomers must be excluded: ${dForms.map((c) => c.id).join(', ')}`
    )
  })

  test('no isomer mixtures in the searchable corpus', () => {
    const mixtures = COMPOUNDS_WITH_SMILES.filter((c) => /mixed|mixture/i.test(c.name))
    assert.equal(
      mixtures.length,
      0,
      `mixtures must be excluded: ${mixtures.map((c) => c.id).join(', ')}`
    )
  })

  test('searchable corpus has a healthy count of distinct structures', () => {
    // The search wrapper dedupes by SMILES string, so the effective corpus is
    // the count of DISTINCT structures (same molecule under multiple ids —
    // e.g. ethanol / ethanol-solvent — collapses to one). This is a lower-bound
    // regression guard on that distinct count, not a uniqueness assertion
    // (cross-id aliases are expected and handled by the wrapper).
    const bySmiles = new Map<string, string[]>()
    for (const c of COMPOUNDS_WITH_SMILES) {
      const ids = bySmiles.get(c.smiles) ?? []
      ids.push(c.id)
      bySmiles.set(c.smiles, ids)
    }
    const aliased = [...bySmiles.values()].filter((ids) => ids.length > 1).length
    console.log(`  (${bySmiles.size} distinct structures; ${aliased} have cross-id aliases)`)
    assert.ok(
      bySmiles.size >= 150,
      `expected >= 150 distinct searchable structures, got ${bySmiles.size}`
    )
  })

  // ---- Report ----
  console.log(`  Verified ${passed}/${ids.length} SMILES against DB formula`)
  console.log(`  Search corpus (COMPOUNDS_WITH_SMILES): ${COMPOUNDS_WITH_SMILES.length}`)

  if (failures.length > 0) {
    console.error(`\n  ❌ ${failures.length} failure(s):`)
    for (const f of failures) console.error(`   - ${f}`)
    process.exit(1)
  }

  await runDeferred()

  console.log('\n✅ All SMILES verified — every structure matches its DB formula.')
}

// ---- tiny sync assert harness for the sanity checks ----
const deferred: Array<{ name: string; fn: () => void }> = []
function test(name: string, fn: () => void) {
  deferred.push({ name, fn })
}
async function runDeferred() {
  let failed = 0
  for (const { name, fn } of deferred) {
    try {
      fn()
      console.log(`  ✅ ${name}`)
    } catch (err) {
      failed++
      console.error(`  ❌ ${name}: ${(err as Error).message}`)
    }
  }
  if (failed > 0) process.exit(1)
}

run().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
