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
