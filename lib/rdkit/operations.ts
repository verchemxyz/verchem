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
    return {
      averageMw: descriptors.amw ?? 0,
      exactMass: descriptors.exactmw ?? 0,
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
    return {
      molWeight: d.amw ?? 0,
      exactMass: d.exactmw ?? 0,
      formula: smilesToFormulaString(smiles),
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

/**
 * Convert SMILES to molecular formula string.
 * Returns null for invalid/empty input.
 *
 * Uses a lightweight SMILES atom counter (fallback when RDKit MinimalLib
 * does not expose a direct get_formula method).
 */
export async function smilesToFormula(smiles: string): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) return null

  const rdkit = await loadRDKit()
  let mol: ReturnType<typeof rdkit.get_mol> | null = null
  try {
    mol = rdkit.get_mol(smiles)
    if (!mol || !mol.is_valid()) return null
    return smilesToFormulaString(smiles)
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
    return mol.get_morgan_fp_as_binary_text(radius, length)
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
    return mol.get_pattern_fp_as_binary_text(length)
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
// Helper: lightweight SMILES formula parser
// ---------------------------------------------------------------------------

/**
 * Parse a SMILES string into a molecular formula.
 *
 * Handles common organic notation: branches, ring closures, aromatic
 * atoms, multi-letter symbols (Cl, Br), and bracket atoms with explicit
 * H counts ([H], [CH3]).  Isotopes and charges inside brackets are
 * ignored for formula counting.
 */
function smilesToFormulaString(smiles: string): string {
  const counts: Record<string, number> = {}
  let i = 0

  while (i < smiles.length) {
    const ch = smiles[i]

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue }

    // Skip bond symbols and stereo markers
    if ('-=#$:\\/.,@'.includes(ch)) { i++; continue }

    // Skip branches
    if (ch === '(' || ch === ')') { i++; continue }

    // Skip ring closure digits and %NN notation
    if (/\d/.test(ch)) { i++; continue }
    if (ch === '%') {
      i++
      while (i < smiles.length && /\d/.test(smiles[i])) i++
      continue
    }

    // Bracket atom: [Na+], [H], [CH3], [2H], etc.
    if (ch === '[') {
      const close = smiles.indexOf(']', i)
      if (close === -1) { i++; continue }
      let content = smiles.slice(i + 1, close)
      i = close + 1

      // Skip isotope numbers at start
      while (content.length > 0 && /\d/.test(content[0])) {
        content = content.slice(1)
      }

      // Read element symbol
      if (content.length > 0 && /[A-Z]/.test(content[0])) {
        let elem = content[0]
        content = content.slice(1)
        if (content.length > 0 && /[a-z]/.test(content[0])) {
          elem += content[0]
          content = content.slice(1)
        }
        counts[elem] = (counts[elem] || 0) + 1

        // Explicit H count (e.g. H3 in [CH3])
        if (content.length > 0 && content[0] === 'H') {
          content = content.slice(1)
          let hNum = ''
          while (content.length > 0 && /\d/.test(content[0])) {
            hNum += content[0]
            content = content.slice(1)
          }
          counts['H'] = (counts['H'] || 0) + (hNum ? parseInt(hNum, 10) : 1)
        }
      }
      continue
    }

    // Standard element: uppercase + optional lowercase
    if (/[A-Z]/.test(ch)) {
      let elem = ch
      i++
      if (i < smiles.length && /[a-z]/.test(smiles[i])) {
        elem += smiles[i]
        i++
      }
      let num = ''
      while (i < smiles.length && /\d/.test(smiles[i])) {
        num += smiles[i]
        i++
      }
      counts[elem] = (counts[elem] || 0) + (num ? parseInt(num, 10) : 1)
      continue
    }

    // Aromatic atom: c, n, o, s, p, etc.
    if (/[a-z]/.test(ch)) {
      const elem = ch.toUpperCase()
      i++
      let num = ''
      while (i < smiles.length && /\d/.test(smiles[i])) {
        num += smiles[i]
        i++
      }
      counts[elem] = (counts[elem] || 0) + (num ? parseInt(num, 10) : 1)
      continue
    }

    // Unknown character — skip
    i++
  }

  // Format: C first, H second, then alphabetical
  const result: string[] = []
  if (counts.C) {
    result.push(`C${counts.C > 1 ? counts.C : ''}`)
    delete counts.C
  }
  if (counts.H) {
    result.push(`H${counts.H > 1 ? counts.H : ''}`)
    delete counts.H
  }
  for (const elem of Object.keys(counts).sort()) {
    result.push(`${elem}${counts[elem] > 1 ? counts[elem] : ''}`)
  }
  return result.join('') || ''
}
