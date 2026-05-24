/*
 * Pure molecular-formula helpers shared by RDKit operations and tests.
 *
 * IMPORTANT: this module is intentionally NOT `client-only`.  The RDKit
 * operations layer (`operations.ts`) is browser-only because it loads the
 * WASM module, but the formula math below is pure and must be importable
 * from Node test runners so the curated SMILES library can be verified
 * against real RDKit output (see __tests__/compound-smiles-verification.test.ts).
 */

/** RDKit `get_json()` atom shape (only the fields we read). */
export interface MolJsonAtom {
  z?: number // atomic number (default 6 / carbon if omitted)
  impHs?: number // implicit H count (default 0 if omitted)
}

export interface MolJson {
  molecules?: Array<{ atoms?: MolJsonAtom[] }>
}

/**
 * Parse RDKit `get_json()` output into an element → count map, including
 * implicit hydrogens.
 *
 * Returns:
 *   - a count map on success
 *   - `{}` when there are no atoms (empty molecule)
 *   - `null` when an atom has an atomic number outside the known range
 *     (z = 1–80) — callers treat this as "cannot compute".
 */
export function molJsonToComposition(json: string): Record<string, number> | null {
  let parsed: MolJson
  try {
    parsed = JSON.parse(json) as MolJson
  } catch {
    return null
  }

  const atoms = parsed?.molecules?.[0]?.atoms ?? []
  if (!Array.isArray(atoms) || atoms.length === 0) return {}

  const counts: Record<string, number> = {}
  let totalH = 0

  for (const atom of atoms) {
    const z = typeof atom.z === 'number' ? atom.z : 6 // default carbon
    const impHs = typeof atom.impHs === 'number' ? atom.impHs : 0
    const symbol = ATOMIC_NUMBER_TO_SYMBOL[z]
    if (!symbol) return null
    counts[symbol] = (counts[symbol] ?? 0) + 1
    totalH += impHs
  }

  if (totalH > 0) {
    counts['H'] = (counts['H'] ?? 0) + totalH
  }

  return counts
}

/**
 * Format an element → count map as a Hill-system molecular formula.
 * Carbon first, hydrogen second, then the rest alphabetically.
 */
export function formatHillSystem(counts: Record<string, number>): string {
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

/**
 * Compute a Hill-system molecular formula from a JSMol via `get_json()`.
 * Returns `''` for an empty molecule and `null` for an unknown atomic number.
 */
export function computeFormulaFromMolJson(mol: { get_json: () => string }): string | null {
  const composition = molJsonToComposition(mol.get_json())
  if (composition === null) return null
  return formatHillSystem(composition)
}

/** Atomic number → element symbol (IUPAC, z = 1–80). */
export const ATOMIC_NUMBER_TO_SYMBOL: Record<number, string> = {
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
