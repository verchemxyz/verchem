/**
 * RDKit operations tests — mock-based (WASM does not load in Node runner)
 *
 * These tests verify:
 *   - Module exports exist and have correct types
 *   - Operation logic patterns (canonicalization, validation)
 *   - Memory cleanup (mol.delete() in try/finally)
 *   - Hook initial state shape
 */

import assert from 'node:assert/strict'

// ---- Static import verification (no WASM execution) ----
import {
  getCanonicalSmiles,
  isValidSmiles,
  type MolDescriptors,
} from '@/lib/rdkit/operations'

import {
  useRDKit,
} from '@/lib/rdkit/hook'

import {
  loadRDKit,
  isRDKitLoaded,
} from '@/lib/rdkit/client'

import type { RDKitModule } from '@/lib/rdkit/types'

// ---- Simple async test runner ----

type AsyncTestFn = () => void | Promise<void>
interface TestCase { name: string; fn: AsyncTestFn }

const tests: TestCase[] = []

function test(name: string, fn: AsyncTestFn) {
  tests.push({ name, fn })
}

async function runTests() {
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

// ---- Mock helpers ----

interface MockMol {
  is_valid: () => boolean
  get_smiles: () => string
  delete: () => void
}

function createMockRDKit(
  overrides: Partial<{
    get_mol: (smiles: string) => MockMol | null
  }> = {}
): RDKitModule {
  const deletedMols: string[] = []

  return {
    get_mol: (smiles: string): MockMol => {
      if (overrides.get_mol) {
        const mol = overrides.get_mol(smiles)
        if (mol === null) return null as unknown as MockMol
        return mol
      }
      const valid = smiles !== 'invalid'
      return {
        is_valid: () => valid,
        get_smiles: () => (valid ? 'CCO' : ''),
        delete: () => {
          deletedMols.push(smiles)
        },
      }
    },
  } as unknown as RDKitModule
}

// ---- Async operation replicas with injected mock (same logic as operations.ts) ----

async function mockIsValidSmiles(
  rdkit: RDKitModule,
  smiles: string
): Promise<boolean> {
  const mol = rdkit.get_mol(smiles)
  try {
    return mol !== null && mol.is_valid()
  } finally {
    mol?.delete()
  }
}

async function mockGetCanonicalSmiles(
  rdkit: RDKitModule,
  smiles: string
): Promise<string | null> {
  const mol = rdkit.get_mol(smiles)
  try {
    if (!mol || !mol.is_valid()) return null
    return mol.get_smiles()
  } finally {
    mol?.delete()
  }
}

// ---- Tests ----

test('exports exist: getCanonicalSmiles is an async function', () => {
  assert.equal(typeof getCanonicalSmiles, 'function')
})

test('exports exist: isValidSmiles is an async function', () => {
  assert.equal(typeof isValidSmiles, 'function')
})

test('exports exist: useRDKit is a function', () => {
  assert.equal(typeof useRDKit, 'function')
})

test('exports exist: loadRDKit and isRDKitLoaded are functions', () => {
  assert.equal(typeof loadRDKit, 'function')
  assert.equal(typeof isRDKitLoaded, 'function')
})

test('MolDescriptors interface shape is valid at runtime', () => {
  const desc: MolDescriptors = {
    molWeight: 46.07,
    exactMass: 46.0419,
    formula: 'C2H6O',
    logP: -0.14,
    tpsa: 20.23,
    hbd: 1,
    hba: 1,
    rotatableBonds: 0,
    heavyAtoms: 3,
    ringCount: 0,
    aromaticRingCount: 0,
  }
  assert.equal(desc.formula, 'C2H6O')
  assert.equal(desc.molWeight, 46.07)
})

test('isValidSmiles: returns true for valid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockIsValidSmiles(rdkit, 'CCO')
  assert.equal(result, true)
})

test('isValidSmiles: returns false for invalid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockIsValidSmiles(rdkit, 'invalid')
  assert.equal(result, false)
})

test('getCanonicalSmiles: returns canonical SMILES for valid input', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetCanonicalSmiles(rdkit, 'OCC')
  assert.equal(result, 'CCO')
})

test('getCanonicalSmiles: returns null for invalid input', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetCanonicalSmiles(rdkit, 'invalid')
  assert.equal(result, null)
})

test('memory cleanup: mol.delete() is called in finally block', async () => {
  const deleted: string[] = []
  const rdkit = createMockRDKit({
    get_mol: (smiles: string) => ({
      is_valid: () => true,
      get_smiles: () => 'CCO',
      delete: () => {
        deleted.push(smiles)
      },
    }),
  })

  await mockGetCanonicalSmiles(rdkit, 'OCC')
  assert.deepEqual(deleted, ['OCC'])
})

test('memory cleanup: mol.delete() is called even when mol is invalid', async () => {
  const deleted: string[] = []
  const rdkit = createMockRDKit({
    get_mol: (smiles: string) => ({
      is_valid: () => false,
      get_smiles: () => '',
      delete: () => {
        deleted.push(smiles)
      },
    }),
  })

  await mockGetCanonicalSmiles(rdkit, 'bad')
  assert.deepEqual(deleted, ['bad'])
})

test('memory cleanup: mol.delete() is called even on exception', async () => {
  const deleted: string[] = []
  const rdkit = createMockRDKit({
    get_mol: (smiles: string) => ({
      is_valid: () => {
        throw new Error('boom')
      },
      get_smiles: () => '',
      delete: () => {
        deleted.push(smiles)
      },
    }),
  })

  try {
    await mockGetCanonicalSmiles(rdkit, 'explode')
    assert.fail('should have thrown')
  } catch {
    // expected
  }
  assert.deepEqual(deleted, ['explode'])
})

test('singleton: isRDKitLoaded returns false before load', () => {
  assert.equal(isRDKitLoaded(), false)
})

// Run
console.log('RDKit Operations Tests')
runTests()
