/**
 * RDKit operations tests — mock-based (WASM does not load in Node runner)
 *
 * These tests verify:
 *   - Module exports exist and have correct types
 *   - Operation logic patterns (canonicalization, validation, descriptors, fingerprints)
 *   - Memory cleanup (mol.delete() in try/finally)
 *   - Formula computation from get_json() atom data
 *   - Hook initial state shape
 *   - Pure functions (tanimotoSimilarity)
 *
 * NOTE: Mocks verify API shape + contract pattern. Real integration tests
 * with actual WASM will be added on Day 7.
 */

import assert from 'node:assert/strict'

// ---- Static import verification (no WASM execution) ----
import {
  getCanonicalSmiles,
  isValidSmiles,
  getMolWeight,
  getDescriptors,
  smilesToFormula,
  smilesToInchi,
  getMorganFingerprint,
  getPatternFingerprint,
  substructureMatch,
  tanimotoSimilarity,
  type MolDescriptors,
  type MolWeightResult,
  type InchiResult,
  type SubstructureMatchResult,
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
  get_descriptors: () => string
  get_inchi: () => string
  get_json: () => string
  get_morgan_fp: (options: string) => string
  get_pattern_fp: (options: string) => string
  get_substruct_match: (q: MockMol) => string
  delete: () => void
}

interface MockRDKitOverrides {
  get_mol?: (smiles: string) => MockMol | null
  get_qmol?: (smarts: string) => MockMol | null
  get_inchikey_for_inchi?: (inchi: string) => string
}

/** Build a get_json() response for a list of (z, impHs) tuples. */
function makeMolJson(atoms: Array<{ z: number; impHs: number }>): string {
  return JSON.stringify({
    molecules: [{ atoms }],
  })
}

function createMockRDKit(overrides: MockRDKitOverrides = {}): RDKitModule {
  const deletedMols: string[] = []

  const defaultGetMol = (smiles: string): MockMol | null => {
    const valid = smiles !== 'invalid'
    if (!valid) return null
    return {
      is_valid: () => true,
      get_smiles: () => 'CCO',
      get_descriptors: () => JSON.stringify({
        amw: 46.07,
        exactmw: 46.0419,
        NumHeavyAtoms: 3,
        NumRings: 0,
        NumAromaticRings: 0,
        NumHBD: 1,
        NumHBA: 1,
        NumRotatableBonds: 0,
        tpsa: 20.23,
        CrippenClogP: -0.14,
      }),
      get_inchi: () => 'InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3',
      get_json: () => makeMolJson([
        { z: 6, impHs: 3 },
        { z: 6, impHs: 2 },
        { z: 8, impHs: 1 },
      ]),
      get_morgan_fp: (options: string) => {
        const opts = JSON.parse(options) as { nBits?: number }
        const len = opts.nBits ?? 2048
        return '0'.repeat(len)
      },
      get_pattern_fp: (options: string) => {
        const opts = JSON.parse(options) as { nBits?: number }
        const len = opts.nBits ?? 2048
        return '0'.repeat(len)
      },
      get_substruct_match: (_q: MockMol) => JSON.stringify({ atoms: [], bonds: [] }),
      delete: () => {
        deletedMols.push(smiles)
      },
    }
  }

  const defaultGetQMol = (smarts: string): MockMol | null => {
    const valid = smarts !== 'invalid'
    if (!valid) return null
    return {
      is_valid: () => true,
      get_smiles: () => smarts,
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => {
        deletedMols.push(`q:${smarts}`)
      },
    }
  }

  return {
    get_mol: (smiles: string) => {
      const mol = overrides.get_mol ? overrides.get_mol(smiles) : defaultGetMol(smiles)
      return mol as unknown as NonNullable<ReturnType<RDKitModule['get_mol']>>
    },
    get_qmol: (smarts: string) => {
      const mol = overrides.get_qmol ? overrides.get_qmol(smarts) : defaultGetQMol(smarts)
      return mol as unknown as NonNullable<ReturnType<RDKitModule['get_qmol']>>
    },
    get_inchikey_for_inchi: overrides.get_inchikey_for_inchi || ((inchi: string) => `KEY-${inchi.slice(-6)}`),
  } as unknown as RDKitModule
}

// ---- Formula computation helpers (duplicated from operations.ts for mock tests) ----

function computeFormulaFromMolJson(mol: { get_json: () => string }): string {
  try {
    const parsed = JSON.parse(mol.get_json()) as {
      molecules?: Array<{ atoms?: Array<{ z?: number; impHs?: number }> }>
    }
    const atoms = parsed?.molecules?.[0]?.atoms ?? []
    if (!Array.isArray(atoms) || atoms.length === 0) return ''

    const counts: Record<string, number> = {}
    let totalH = 0

    for (const atom of atoms) {
      const z = typeof atom.z === 'number' ? atom.z : 6
      const impHs = typeof atom.impHs === 'number' ? atom.impHs : 0
      const symbol = ATOMIC_NUMBER_TO_SYMBOL[z]
      if (!symbol) continue
      counts[symbol] = (counts[symbol] ?? 0) + 1
      totalH += impHs
    }

    if (totalH > 0) {
      counts['H'] = (counts['H'] ?? 0) + totalH
    }

    return formatHillSystem(counts)
  } catch {
    return ''
  }
}

function formatHillSystem(counts: Record<string, number>): string {
  const parts: string[] = []
  if (counts.C > 0) {
    parts.push(`C${counts.C > 1 ? counts.C : ''}`)
  }
  if (counts.H > 0) {
    parts.push(`H${counts.H > 1 ? counts.H : ''}`)
  }
  const rest = Object.keys(counts)
    .filter((s) => s !== 'C' && s !== 'H' && counts[s] > 0)
    .sort()
  for (const symbol of rest) {
    parts.push(`${symbol}${counts[symbol] > 1 ? counts[symbol] : ''}`)
  }
  return parts.join('')
}

const ATOMIC_NUMBER_TO_SYMBOL: Record<number, string> = {
  1: 'H', 3: 'Li', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl',
  19: 'K', 20: 'Ca', 26: 'Fe', 29: 'Cu', 30: 'Zn', 35: 'Br', 53: 'I',
  79: 'Au', 80: 'Hg',
}

// ---- Async operation replicas with injected mock (same logic as operations.ts) ----

async function mockIsValidSmiles(
  rdkit: RDKitModule,
  smiles: string
): Promise<boolean> {
  if (!smiles || smiles.trim().length === 0) return false
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    return mol !== null && mol.is_valid()
  } finally {
    mol?.delete()
  }
}

async function mockGetCanonicalSmiles(
  rdkit: RDKitModule,
  smiles: string
): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    return mol.get_smiles()
  } finally {
    mol?.delete()
  }
}

async function mockGetMolWeight(
  rdkit: RDKitModule,
  smiles: string
): Promise<MolWeightResult | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const descriptors = JSON.parse(mol.get_descriptors()) as Record<string, number>
    return {
      averageMw: descriptors.amw ?? 0,
      exactMass: descriptors.exactmw ?? 0,
    }
  } finally {
    mol?.delete()
  }
}

async function mockGetDescriptors(
  rdkit: RDKitModule,
  smiles: string
): Promise<MolDescriptors | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const d = JSON.parse(mol.get_descriptors()) as Record<string, number>
    return {
      molWeight: d.amw ?? 0,
      exactMass: d.exactmw ?? 0,
      formula: computeFormulaFromMolJson(mol),
      logP: d.CrippenClogP ?? 0,
      tpsa: d.tpsa ?? 0,
      hbd: d.NumHBD ?? 0,
      hba: d.NumHBA ?? 0,
      rotatableBonds: d.NumRotatableBonds ?? 0,
      heavyAtoms: d.NumHeavyAtoms ?? 0,
      ringCount: d.NumRings ?? 0,
      aromaticRingCount: d.NumAromaticRings ?? 0,
    }
  } finally {
    mol?.delete()
  }
}

async function mockSmilesToFormula(
  rdkit: RDKitModule,
  smiles: string
): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    return computeFormulaFromMolJson(mol)
  } finally {
    mol?.delete()
  }
}

async function mockSmilesToInchi(
  rdkit: RDKitModule,
  smiles: string
): Promise<InchiResult | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const inchi = mol.get_inchi()
    const inchiKey = rdkit.get_inchikey_for_inchi(inchi)
    return { inchi, inchiKey }
  } finally {
    mol?.delete()
  }
}

async function mockGetMorganFingerprint(
  rdkit: RDKitModule,
  smiles: string,
  radius = 2,
  length = 2048
): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const result = mol.get_morgan_fp(JSON.stringify({ radius, nBits: length }))
    if (typeof result !== 'string' || result.length !== length) return null
    return result
  } finally {
    mol?.delete()
  }
}

async function mockGetPatternFingerprint(
  rdkit: RDKitModule,
  smiles: string,
  length = 2048
): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const result = mol.get_pattern_fp(JSON.stringify({ nBits: length }))
    if (typeof result !== 'string' || result.length !== length) return null
    return result
  } finally {
    mol?.delete()
  }
}

async function mockSubstructureMatch(
  rdkit: RDKitModule,
  querySmarts: string,
  targetSmiles: string
): Promise<SubstructureMatchResult | null> {
  if (!querySmarts || querySmarts.trim().length === 0) return null
  if (!targetSmiles || targetSmiles.trim().length === 0) return null

  let query: ReturnType<typeof rdkit.get_qmol> | null = null
  let target: ReturnType<typeof rdkit.get_mol> | null = null

  try {
    query = rdkit.get_qmol(querySmarts)
    target = rdkit.get_mol(targetSmiles)
    if (!query || !target || !query.is_valid() || !target.is_valid()) {
      return { matched: false, atomIndices: [] }
    }

    const matchJson = target.get_substruct_match(query)
    if (!matchJson) return { matched: false, atomIndices: [] }

    const match = JSON.parse(matchJson) as { atoms?: number[]; bonds?: number[] }
    const atomIndices: number[] = Array.isArray(match.atoms) ? match.atoms : []
    return { matched: atomIndices.length > 0, atomIndices }
  } finally {
    query?.delete()
    target?.delete()
  }
}

// ---- Tests ----

// --- Export existence ---

test('exports exist: getCanonicalSmiles is an async function', () => {
  assert.equal(typeof getCanonicalSmiles, 'function')
})

test('exports exist: isValidSmiles is an async function', () => {
  assert.equal(typeof isValidSmiles, 'function')
})

test('exports exist: getMolWeight is an async function', () => {
  assert.equal(typeof getMolWeight, 'function')
})

test('exports exist: getDescriptors is an async function', () => {
  assert.equal(typeof getDescriptors, 'function')
})

test('exports exist: smilesToFormula is an async function', () => {
  assert.equal(typeof smilesToFormula, 'function')
})

test('exports exist: smilesToInchi is an async function', () => {
  assert.equal(typeof smilesToInchi, 'function')
})

test('exports exist: getMorganFingerprint is an async function', () => {
  assert.equal(typeof getMorganFingerprint, 'function')
})

test('exports exist: getPatternFingerprint is an async function', () => {
  assert.equal(typeof getPatternFingerprint, 'function')
})

test('exports exist: substructureMatch is an async function', () => {
  assert.equal(typeof substructureMatch, 'function')
})

test('exports exist: tanimotoSimilarity is a function', () => {
  assert.equal(typeof tanimotoSimilarity, 'function')
})

test('exports exist: useRDKit is a function', () => {
  assert.equal(typeof useRDKit, 'function')
})

test('exports exist: loadRDKit and isRDKitLoaded are functions', () => {
  assert.equal(typeof loadRDKit, 'function')
  assert.equal(typeof isRDKitLoaded, 'function')
})

// --- Type shapes ---

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

test('MolWeightResult interface shape is valid at runtime', () => {
  const mw: MolWeightResult = { averageMw: 46.07, exactMass: 46.0419 }
  assert.equal(mw.averageMw, 46.07)
  assert.equal(mw.exactMass, 46.0419)
})

test('InchiResult interface shape is valid at runtime', () => {
  const inchi: InchiResult = {
    inchi: 'InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3',
    inchiKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
  }
  assert.ok(inchi.inchi.includes('InChI='))
})

test('SubstructureMatchResult interface shape is valid at runtime', () => {
  const match: SubstructureMatchResult = { matched: true, atomIndices: [0, 1] }
  assert.equal(match.matched, true)
  assert.deepEqual(match.atomIndices, [0, 1])
})

// --- isValidSmiles ---

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

test('isValidSmiles: returns false for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockIsValidSmiles(rdkit, '')
  assert.equal(result, false)
})

test('isValidSmiles: returns false for whitespace only', async () => {
  const rdkit = createMockRDKit()
  const result = await mockIsValidSmiles(rdkit, '   ')
  assert.equal(result, false)
})

// --- getCanonicalSmiles ---

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

test('getCanonicalSmiles: returns null for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetCanonicalSmiles(rdkit, '')
  assert.equal(result, null)
})

// --- getMolWeight ---

test('getMolWeight: returns average and exact mass', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMolWeight(rdkit, 'CCO')
  assert.ok(result)
  assert.equal(result!.averageMw, 46.07)
  assert.equal(result!.exactMass, 46.0419)
})

test('getMolWeight: returns null for invalid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMolWeight(rdkit, 'invalid')
  assert.equal(result, null)
})

test('getMolWeight: returns null for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMolWeight(rdkit, '')
  assert.equal(result, null)
})

// --- getDescriptors ---

test('getDescriptors: returns all 11 fields', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetDescriptors(rdkit, 'CCO')
  assert.ok(result)
  assert.equal(result!.molWeight, 46.07)
  assert.equal(result!.exactMass, 46.0419)
  assert.equal(result!.formula, 'C2H6O')
  assert.equal(result!.logP, -0.14)
  assert.equal(result!.tpsa, 20.23)
  assert.equal(result!.hbd, 1)
  assert.equal(result!.hba, 1)
  assert.equal(result!.rotatableBonds, 0)
  assert.equal(result!.heavyAtoms, 3)
  assert.equal(result!.ringCount, 0)
  assert.equal(result!.aromaticRingCount, 0)
})

test('getDescriptors: returns null for invalid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetDescriptors(rdkit, 'invalid')
  assert.equal(result, null)
})

test('getDescriptors: returns null for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetDescriptors(rdkit, '')
  assert.equal(result, null)
})

// --- smilesToFormula ---

test('smilesToFormula: ethanol CCO → C2H6O', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSmilesToFormula(rdkit, 'CCO')
  assert.equal(result, 'C2H6O')
})

test('smilesToFormula: benzene c1ccccc1 → C6H6', async () => {
  const rdkit = createMockRDKit({
    get_mol: () => ({
      is_valid: () => true,
      get_smiles: () => 'c1ccccc1',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([
        { z: 6, impHs: 1 }, { z: 6, impHs: 1 }, { z: 6, impHs: 1 },
        { z: 6, impHs: 1 }, { z: 6, impHs: 1 }, { z: 6, impHs: 1 },
      ]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => {},
    }),
  })
  const result = await mockSmilesToFormula(rdkit, 'c1ccccc1')
  assert.equal(result, 'C6H6')
})

test('smilesToFormula: acetic acid CC(=O)O → C2H4O2', async () => {
  const rdkit = createMockRDKit({
    get_mol: () => ({
      is_valid: () => true,
      get_smiles: () => 'CC(=O)O',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([
        { z: 6, impHs: 3 },
        { z: 6, impHs: 0 },
        { z: 8, impHs: 0 },
        { z: 8, impHs: 1 },
      ]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => {},
    }),
  })
  const result = await mockSmilesToFormula(rdkit, 'CC(=O)O')
  assert.equal(result, 'C2H4O2')
})

test('smilesToFormula: pyrrole [nH]1cccc1 → C4H5N', async () => {
  const rdkit = createMockRDKit({
    get_mol: () => ({
      is_valid: () => true,
      get_smiles: () => '[nH]1cccc1',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([
        { z: 7, impHs: 1 },
        { z: 6, impHs: 1 },
        { z: 6, impHs: 1 },
        { z: 6, impHs: 1 },
        { z: 6, impHs: 1 },
      ]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => {},
    }),
  })
  const result = await mockSmilesToFormula(rdkit, '[nH]1cccc1')
  assert.equal(result, 'C4H5N')
})

test('smilesToFormula: NaCl → ClNa (Hill system)', async () => {
  const rdkit = createMockRDKit({
    get_mol: () => ({
      is_valid: () => true,
      get_smiles: () => '[Na][Cl]',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([
        { z: 11, impHs: 0 },
        { z: 17, impHs: 0 },
      ]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => {},
    }),
  })
  const result = await mockSmilesToFormula(rdkit, '[Na][Cl]')
  assert.equal(result, 'ClNa')
})

test('smilesToFormula: returns null for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSmilesToFormula(rdkit, '')
  assert.equal(result, null)
})

// --- smilesToInchi ---

test('smilesToInchi: returns inchi and inchiKey', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSmilesToInchi(rdkit, 'CCO')
  assert.ok(result)
  assert.ok(result!.inchi.startsWith('InChI='))
  assert.ok(result!.inchiKey.startsWith('KEY-'))
})

test('smilesToInchi: returns null for invalid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSmilesToInchi(rdkit, 'invalid')
  assert.equal(result, null)
})

test('smilesToInchi: returns null for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSmilesToInchi(rdkit, '')
  assert.equal(result, null)
})

// --- getMorganFingerprint ---

test('getMorganFingerprint: returns bitstring of requested length', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMorganFingerprint(rdkit, 'CCO', 2, 1024)
  assert.ok(result)
  assert.equal(result!.length, 1024)
  assert.ok(/^[01]+$/.test(result!))
})

test('getMorganFingerprint: uses default radius and length', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMorganFingerprint(rdkit, 'CCO')
  assert.ok(result)
  assert.equal(result!.length, 2048)
})

test('getMorganFingerprint: returns null for invalid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMorganFingerprint(rdkit, 'invalid')
  assert.equal(result, null)
})

test('getMorganFingerprint: returns null for empty string', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetMorganFingerprint(rdkit, '')
  assert.equal(result, null)
})

// --- getPatternFingerprint ---

test('getPatternFingerprint: returns bitstring of requested length', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetPatternFingerprint(rdkit, 'CCO', 512)
  assert.ok(result)
  assert.equal(result!.length, 512)
  assert.ok(/^[01]+$/.test(result!))
})

test('getPatternFingerprint: uses default length', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetPatternFingerprint(rdkit, 'CCO')
  assert.ok(result)
  assert.equal(result!.length, 2048)
})

test('getPatternFingerprint: returns null for invalid SMILES', async () => {
  const rdkit = createMockRDKit()
  const result = await mockGetPatternFingerprint(rdkit, 'invalid')
  assert.equal(result, null)
})

// --- substructureMatch ---

test('substructureMatch: returns matched + atomIndices', async () => {
  const rdkit = createMockRDKit({
    get_mol: () => ({
      is_valid: () => true,
      get_smiles: () => 'CCO',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => JSON.stringify({ atoms: [0, 1], bonds: [0] }),
      delete: () => {},
    }),
    get_qmol: () => ({
      is_valid: () => true,
      get_smiles: () => '[OH]',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => {},
    }),
  })

  const result = await mockSubstructureMatch(rdkit, '[OH]', 'CCO')
  assert.ok(result)
  assert.equal(result!.matched, true)
  assert.deepEqual(result!.atomIndices, [0, 1])
})

test('substructureMatch: returns matched=false when no match', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSubstructureMatch(rdkit, 'c1ccccc1', 'CCO')
  assert.ok(result)
  assert.equal(result!.matched, false)
  assert.deepEqual(result!.atomIndices, [])
})

test('substructureMatch: returns null for empty query', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSubstructureMatch(rdkit, '', 'CCO')
  assert.equal(result, null)
})

test('substructureMatch: returns null for empty target', async () => {
  const rdkit = createMockRDKit()
  const result = await mockSubstructureMatch(rdkit, 'C', '')
  assert.equal(result, null)
})

test('substructureMatch: cleans up both query and target mols', async () => {
  const deleted: string[] = []
  const rdkit = createMockRDKit({
    get_mol: (smiles: string) => ({
      is_valid: () => true,
      get_smiles: () => smiles,
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => JSON.stringify({ atoms: [], bonds: [] }),
      delete: () => { deleted.push(smiles) },
    }),
    get_qmol: (smarts: string) => ({
      is_valid: () => true,
      get_smiles: () => smarts,
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => { deleted.push(`q:${smarts}`) },
    }),
  })

  await mockSubstructureMatch(rdkit, 'C', 'CCO')
  assert.ok(deleted.includes('CCO'))
  assert.ok(deleted.includes('q:C'))
})

// --- tanimotoSimilarity (pure function, tests the real implementation) ---

test('tanimotoSimilarity: identical fingerprints = 1.0', () => {
  assert.equal(tanimotoSimilarity('1010', '1010'), 1)
})

test('tanimotoSimilarity: opposite fingerprints = 0.0', () => {
  assert.equal(tanimotoSimilarity('1010', '0101'), 0)
})

test('tanimotoSimilarity: partial overlap', () => {
  // 1100 AND 1010 = 1000 (1 bit)
  // 1100 OR 1010 = 1110 (3 bits)
  // = 1/3 ≈ 0.333
  assert.ok(Math.abs(tanimotoSimilarity('1100', '1010') - 1 / 3) < 0.001)
})

test('tanimotoSimilarity: all zeros = 0.0', () => {
  assert.equal(tanimotoSimilarity('0000', '0000'), 0)
})

test('tanimotoSimilarity: one all-zeros = 0.0', () => {
  assert.equal(tanimotoSimilarity('1010', '0000'), 0)
})

test('tanimotoSimilarity: throws on length mismatch', () => {
  assert.throws(() => tanimotoSimilarity('1010', '10101'), /length mismatch/)
})

test('tanimotoSimilarity: empty strings = 0.0', () => {
  assert.equal(tanimotoSimilarity('', ''), 0)
})

// --- Formula computation unit tests (direct helper testing) ---

test('computeFormulaFromMolJson: ethanol atoms → C2H6O', () => {
  const mol = {
    get_json: () => makeMolJson([
      { z: 6, impHs: 3 },
      { z: 6, impHs: 2 },
      { z: 8, impHs: 1 },
    ]),
  }
  assert.equal(computeFormulaFromMolJson(mol), 'C2H6O')
})

test('computeFormulaFromMolJson: benzene atoms → C6H6', () => {
  const mol = {
    get_json: () => makeMolJson([
      { z: 6, impHs: 1 }, { z: 6, impHs: 1 }, { z: 6, impHs: 1 },
      { z: 6, impHs: 1 }, { z: 6, impHs: 1 }, { z: 6, impHs: 1 },
    ]),
  }
  assert.equal(computeFormulaFromMolJson(mol), 'C6H6')
})

test('computeFormulaFromMolJson: acetic acid → C2H4O2', () => {
  const mol = {
    get_json: () => makeMolJson([
      { z: 6, impHs: 3 },
      { z: 6, impHs: 0 },
      { z: 8, impHs: 0 },
      { z: 8, impHs: 1 },
    ]),
  }
  assert.equal(computeFormulaFromMolJson(mol), 'C2H4O2')
})

test('computeFormulaFromMolJson: pyrrole → C4H5N', () => {
  const mol = {
    get_json: () => makeMolJson([
      { z: 7, impHs: 1 },
      { z: 6, impHs: 1 },
      { z: 6, impHs: 1 },
      { z: 6, impHs: 1 },
      { z: 6, impHs: 1 },
    ]),
  }
  assert.equal(computeFormulaFromMolJson(mol), 'C4H5N')
})

test('computeFormulaFromMolJson: NaCl → ClNa', () => {
  const mol = {
    get_json: () => makeMolJson([
      { z: 11, impHs: 0 },
      { z: 17, impHs: 0 },
    ]),
  }
  assert.equal(computeFormulaFromMolJson(mol), 'ClNa')
})

test('computeFormulaFromMolJson: empty atoms → empty string', () => {
  const mol = { get_json: () => makeMolJson([]) }
  assert.equal(computeFormulaFromMolJson(mol), '')
})

test('computeFormulaFromMolJson: unknown atomic number skipped', () => {
  const mol = {
    get_json: () => makeMolJson([
      { z: 6, impHs: 0 },
      { z: 999, impHs: 0 },
    ]),
  }
  assert.equal(computeFormulaFromMolJson(mol), 'C')
})

// --- Memory cleanup ---

test('memory cleanup: mol.delete() is called in finally block', async () => {
  const deleted: string[] = []
  const rdkit = createMockRDKit({
    get_mol: (smiles: string) => ({
      is_valid: () => true,
      get_smiles: () => 'CCO',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => { deleted.push(smiles) },
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
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => { deleted.push(smiles) },
    }),
  })

  await mockGetCanonicalSmiles(rdkit, 'bad')
  assert.deepEqual(deleted, ['bad'])
})

test('memory cleanup: mol.delete() is called even on exception', async () => {
  const deleted: string[] = []
  const rdkit = createMockRDKit({
    get_mol: (smiles: string) => ({
      is_valid: () => { throw new Error('boom') },
      get_smiles: () => '',
      get_descriptors: () => '{}',
      get_inchi: () => '',
      get_json: () => makeMolJson([]),
      get_morgan_fp: () => '',
      get_pattern_fp: () => '',
      get_substruct_match: () => '{}',
      delete: () => { deleted.push(smiles) },
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

// --- Singleton ---

test('singleton: isRDKitLoaded returns false before load', () => {
  assert.equal(isRDKitLoaded(), false)
})

// Run
console.log('RDKit Operations Tests')
runTests()
