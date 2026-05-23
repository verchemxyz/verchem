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

/**
 * Validate a SMILES string.
 * Returns true if RDKit can parse it into a valid molecule.
 */
export async function isValidSmiles(smiles: string): Promise<boolean> {
  const rdkit = await loadRDKit()
  const mol = rdkit.get_mol(smiles)
  try {
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
  const rdkit = await loadRDKit()
  const mol = rdkit.get_mol(smiles)
  try {
    if (!mol || !mol.is_valid()) return null
    return mol.get_smiles()
  } finally {
    mol?.delete()
  }
}
