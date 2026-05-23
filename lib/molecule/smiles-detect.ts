/**
 * Known two-letter element symbols (IUPAC). Single-letter symbols are
 * excluded because they would match inside SMILES strings (e.g. 'C'
 * appears in almost every SMILES).
 */
const TWO_LETTER_ELEMENTS = new Set([
  'He', 'Li', 'Be', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'Cl', 'Ar', 'Ca', 'Sc', 'Ti',
  'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd',
  'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir',
  'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf',
  'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
])

/**
 * Heuristic to distinguish SMILES strings from chemical formulas.
 *
 * This is intentionally conservative: it looks for unambiguous SMILES
 * features (brackets, bond symbols, etc.) and unambiguous formula
 * features (parenthetical subscripts like (OH)2, two-letter element
 * symbols like Na, Ca, Fe).
 *
 * Simple uppercase-only carbon chains (e.g. CCO) are treated as SMILES
 * because they are valid SMILES and would be mis-parsed as formulas.
 */
export function looksLikeSmiles(input: string): boolean {
  if (!input || input.trim().length === 0) return false
  const trimmed = input.trim()

  // Definite SMILES-only characters (never appear in formulas)
  if (/[=\[\]#@\/\\]/.test(trimmed)) return true

  // Definite formula indicator: subscript after closing paren, e.g. Ca(OH)2
  if (/\)\d/.test(trimmed)) return false

  // Simple carbon chains without subscripts, e.g. CCO, CCl, CBr
  // Require 3+ chars to avoid misclassifying "CO" (carbon monoxide formula)
  if (/^C[CONPSFIBrClIH]{2,}$/.test(trimmed)) return true

  // Parentheses without subscript → SMILES branch, e.g. C(C)C
  if (/[()]/.test(trimmed)) return true

  // Contains a two-letter element symbol → likely formula
  for (const elem of TWO_LETTER_ELEMENTS) {
    if (trimmed.includes(elem)) return false
  }

  // Lowercase letters that aren't part of two-letter element symbols
  // → aromatic atoms in SMILES, e.g. c1ccccc1
  if (/[a-z]/.test(trimmed)) return true

  return false
}
