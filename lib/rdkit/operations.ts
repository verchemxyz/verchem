import 'client-only'

import { loadRDKit } from './client'

export interface MolDescriptors {
  molWeight: number // Average molecular weight
  exactMass: number // Monoisotopic mass
  formula: string
  logP: number
  tpsa: number // Topological polar surface area
  hbd: number // H-bond donors
  hba: number // H-bond acceptors
  rotatableBonds: number
  heavyAtoms: number
  ringCount: number
  aromaticRingCount: number
}

export interface MolWeightResult {
  averageMw: number
  exactMass: number
}

export interface InchiResult {
  inchi: string
  inchiKey: string
}

export interface SubstructureMatchResult {
  matched: boolean
  atomIndices: number[]
}

/*
 * ========================================================================
 * CRITICAL PATTERN for every RDKit operation (copy this for Day 3-4 ops):
 *
 *   1. Guard empty / whitespace input early.
 *   2. Declare `let mol = null` BEFORE the try block.
 *   3. Assign `mol = rdkit.get_mol(...)` INSIDE the try block.
 *   4. Always call `mol?.delete()` in `finally`.
 *
 * Why: if get_mol throws, control jumps to finally; mol is still null
 * so delete() is a no-op.  If we declared mol inside try, finally
 * wouldn't clean up a partially-created object.
 * ========================================================================
 */

/**
 * Validate a SMILES string.
 * Returns true if RDKit can parse it into a valid molecule.
 */
export async function isValidSmiles(smiles: string): Promise<boolean> {
  if (!smiles || smiles.trim().length === 0) return false

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    return mol !== null && mol.is_valid()
  } finally {
    mol?.delete()
  }
}

/**
 * Convert any SMILES to its canonical form.
 * Returns null for invalid input.
 *
 * Example: getCanonicalSmiles('OCC') → 'CCO'
 */
export async function getCanonicalSmiles(smiles: string): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    return mol.get_smiles()
  } finally {
    mol?.delete()
  }
}

/**
 * Get molecular weight (average and exact monoisotopic).
 * Returns null for invalid input.
 */
export async function getMolWeight(smiles: string): Promise<MolWeightResult | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const descriptors = JSON.parse(mol.get_descriptors()) as Record<string, number>
    if (!validateDescriptorKeys(descriptors, ['amw', 'exactmw'])) return null
    return {
      averageMw: descriptors.amw,
      exactMass: descriptors.exactmw,
    }
  } finally {
    mol?.delete()
  }
}

/**
 * Get full molecular descriptors.
 * Returns null for invalid input.
 */
export async function getDescriptors(smiles: string): Promise<MolDescriptors | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    const d = JSON.parse(mol.get_descriptors()) as Record<string, number>
    const required = [
      'amw', 'exactmw', 'NumHeavyAtoms', 'NumRings', 'NumAromaticRings',
      'NumHBD', 'NumHBA', 'NumRotatableBonds', 'tpsa', 'CrippenClogP',
    ]
    if (!validateDescriptorKeys(d, required)) return null

    const formula = computeFormulaFromMolJson(mol)
    return {
      molWeight: d.amw,
      exactMass: d.exactmw,
      formula,
      logP: d.CrippenClogP,
      tpsa: d.tpsa,
      hbd: d.NumHBD,
      hba: d.NumHBA,
      rotatableBonds: d.NumRotatableBonds,
      heavyAtoms: d.NumHeavyAtoms,
      ringCount: d.NumRings,
      aromaticRingCount: d.NumAromaticRings,
    }
  } finally {
    mol?.delete()
  }
}

/**
 * Convert SMILES to molecular formula string.
 * Returns null for invalid/empty input.
 *
 * Uses mol.get_json() to read atom data (atomic number + implicit H
 * counts) so the formula includes implicit hydrogens correctly.
 */
export async function smilesToFormula(smiles: string): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    return computeFormulaFromMolJson(mol)
  } finally {
    mol?.delete()
  }
}

/**
 * Convert SMILES to InChI and InChIKey.
 * Returns null for invalid input.
 */
export async function smilesToInchi(smiles: string): Promise<InchiResult | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
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

/**
 * Get Morgan (ECFP) fingerprint as a binary bitstring.
 *
 * @param radius  Morgan fingerprint radius (default 2)
 * @param length  Number of bits (default 2048)
 */
export async function getMorganFingerprint(
  smiles: string,
  radius = 2,
  length = 2048
): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    // RDKit MinimalLib real API: JSON options parameter
    const result = mol.get_morgan_fp(JSON.stringify({ radius, nBits: length }))
    if (typeof result !== 'string' || result.length !== length) return null
    return result
  } finally {
    mol?.delete()
  }
}

/**
 * Get Pattern fingerprint as a binary bitstring.
 *
 * @param length  Number of bits (default 2048)
 */
export async function getPatternFingerprint(
  smiles: string,
  length = 2048
): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    // RDKit MinimalLib real API: JSON options parameter
    const result = mol.get_pattern_fp(JSON.stringify({ nBits: length }))
    if (typeof result !== 'string' || result.length !== length) return null
    return result
  } finally {
    mol?.delete()
  }
}

/**
 * Perform a SMARTS substructure match against a target SMILES.
 *
 * @param querySmarts  SMARTS query pattern
 * @param targetSmiles Target molecule SMILES
 * @returns matched boolean + atom indices in target, or null on empty input
 */
export async function substructureMatch(
  querySmarts: string,
  targetSmiles: string
): Promise<SubstructureMatchResult | null> {
  if (!querySmarts || querySmarts.trim().length === 0) return null
  if (!targetSmiles || targetSmiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
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

/**
 * Compute Tanimoto similarity between two fingerprint bitstrings.
 *
 * Pure function — no WASM call required.
 *
 * @throws Error if fingerprint lengths differ
 */
export function tanimotoSimilarity(fp1: string, fp2: string): number {
  if (fp1.length !== fp2.length) {
    throw new Error(`Fingerprint length mismatch: ${fp1.length} vs ${fp2.length}`)
  }
  let intersection = 0
  let union = 0
  for (let i = 0; i < fp1.length; i++) {
    const b1 = fp1[i] === '1'
    const b2 = fp2[i] === '1'
    if (b1 && b2) intersection++
    if (b1 || b2) union++
  }
  return union === 0 ? 0 : intersection / union
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that all required descriptor keys are present and numeric.
 */
function validateDescriptorKeys(
  descriptors: Record<string, unknown>,
  required: string[]
): boolean {
  for (const key of required) {
    if (typeof descriptors[key] !== 'number') return false
  }
  return true
}

/**
 * Compute molecular formula from a JSMol using get_json().
 *
 * RDKit get_json() returns:
 *   { molecules: [ { atoms: [ { z: 6, impHs: 3 }, ... ] } ] }
 *
 * z     = atomic number (default 6 / carbon if omitted)
 * impHs = implicit H count (default 0 if omitted)
 */
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
      const z = typeof atom.z === 'number' ? atom.z : 6 // default carbon
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

/**
 * Format atom counts as Hill-system molecular formula.
 * C first, H second, then alphabetical.
 */
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

/** Atomic number → element symbol (IUPAC, z = 1–80). */
const ATOMIC_NUMBER_TO_SYMBOL: Record<number, string> = {
  1: 'H', 2: 'He',
  3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
  11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
  19: 'K', 20: 'Ca',
  21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr', 25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn',
  31: 'Ga', 32: 'Ge', 33: 'As', 34: 'Se', 35: 'Br', 36: 'Kr',
  37: 'Rb', 38: 'Sr',
  39: 'Y', 40: 'Zr', 41: 'Nb', 42: 'Mo', 43: 'Tc', 44: 'Ru', 45: 'Rh', 46: 'Pd', 47: 'Ag', 48: 'Cd',
  49: 'In', 50: 'Sn', 51: 'Sb', 52: 'Te', 53: 'I', 54: 'Xe',
  55: 'Cs', 56: 'Ba',
  57: 'La', 58: 'Ce', 59: 'Pr', 60: 'Nd', 61: 'Pm', 62: 'Sm', 63: 'Eu', 64: 'Gd', 65: 'Tb', 66: 'Dy',
  67: 'Ho', 68: 'Er', 69: 'Tm', 70: 'Yb', 71: 'Lu',
  72: 'Hf', 73: 'Ta', 74: 'W', 75: 'Re', 76: 'Os', 77: 'Ir', 78: 'Pt', 79: 'Au', 80: 'Hg',
}
