// VerChem - Molecule Builder Utilities
// Validation, stability checking, and molecule recognition

export interface BuilderAtom {
  id: number
  element: string
  x: number
  y: number
  z: number
  valenceElectrons: number
  formalCharge: number
}

export interface BuilderBond {
  id: number
  atom1Id: number
  atom2Id: number
  order: 1 | 2 | 3
}

export interface AtomStability {
  element: string
  currentElectrons: number
  targetElectrons: number
  needsElectrons: number
  formalCharge: number
  isStable: boolean
  octetSatisfied: boolean
}

export interface ValidationResult {
  isStable: boolean
  isValid: boolean
  totalCharge: number
  atomStability: AtomStability[]
  hints: string[]
  warnings: string[]
  formula: string
}

/**
 * Known molecules database for recognition
 */
const KNOWN_MOLECULES: Record<string, { name: string; common?: string }> = {
  // Water variants
  'H2O1': { name: 'Water', common: 'H₂O' },
  'H1O1H1': { name: 'Water', common: 'H₂O' },

  // Simple hydrocarbons
  'C1H4': { name: 'Methane', common: 'CH₄' },
  'C2H6': { name: 'Ethane', common: 'C₂H₆' },
  'C2H4': { name: 'Ethylene', common: 'C₂H₄' },
  'C2H2': { name: 'Acetylene', common: 'C₂H₂' },
  'C3H8': { name: 'Propane', common: 'C₃H₈' },
  'C6H6': { name: 'Benzene', common: 'C₆H₆' },

  // Oxygen compounds
  'C1O2': { name: 'Carbon Dioxide', common: 'CO₂' },
  'C1O1': { name: 'Carbon Monoxide', common: 'CO' },
  'H2O2': { name: 'Hydrogen Peroxide', common: 'H₂O₂' },

  // Nitrogen compounds
  'N1H3': { name: 'Ammonia', common: 'NH₃' },
  'N2': { name: 'Nitrogen Gas', common: 'N₂' },
  'N1O2': { name: 'Nitrogen Dioxide', common: 'NO₂' },

  // Acids
  'H1Cl1': { name: 'Hydrochloric Acid', common: 'HCl' },
  'H2S1O4': { name: 'Sulfuric Acid', common: 'H₂SO₄' },
  'H1N1O3': { name: 'Nitric Acid', common: 'HNO₃' },

  // Alcohols
  'C1H4O1': { name: 'Methanol', common: 'CH₃OH' },
  'C2H6O1': { name: 'Ethanol', common: 'C₂H₅OH' },

  // Halogens
  'F2': { name: 'Fluorine Gas', common: 'F₂' },
  'Cl2': { name: 'Chlorine Gas', common: 'Cl₂' },
  'Br2': { name: 'Bromine', common: 'Br₂' },
  'I2': { name: 'Iodine', common: 'I₂' },
}

/**
 * Get target electron count for octet rule
 */
function getTargetElectrons(element: string): number {
  // Hydrogen and Helium want 2 electrons (duet rule)
  if (element === 'H' || element === 'He') return 2

  // Boron can be stable with 6 electrons
  if (element === 'B') return 6

  // Most elements want 8 electrons (octet rule)
  return 8
}

/**
 * Get valence electrons for element
 * Complete table for all 118 elements based on IUPAC periodic table groups
 *
 * Valence electron rules:
 * - Group 1 (H, Li, Na, K, Rb, Cs, Fr): 1 electron
 * - Group 2 (Be, Mg, Ca, Sr, Ba, Ra): 2 electrons
 * - Group 13 (B, Al, Ga, In, Tl): 3 electrons
 * - Group 14 (C, Si, Ge, Sn, Pb): 4 electrons
 * - Group 15 (N, P, As, Sb, Bi): 5 electrons
 * - Group 16 (O, S, Se, Te, Po): 6 electrons
 * - Group 17 (F, Cl, Br, I, At): 7 electrons
 * - Group 18 (He, Ne, Ar, Kr, Xe, Rn): 8 electrons (noble gases)
 * - Transition metals: Use most common oxidation state
 * - Lanthanides/Actinides: Typically 3 electrons
 */
export function getValenceElectrons(element: string): number {
  const valence: Record<string, number> = {
    // Period 1
    H: 1, He: 2,

    // Period 2
    Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, Ne: 8,

    // Period 3
    Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7, Ar: 8,

    // Period 4
    K: 1, Ca: 2,
    // Transition metals (3d)
    Sc: 3, Ti: 4, V: 5, Cr: 6, Mn: 7, Fe: 2, Co: 2, Ni: 2, Cu: 1, Zn: 2,
    // Main group
    Ga: 3, Ge: 4, As: 5, Se: 6, Br: 7, Kr: 8,

    // Period 5
    Rb: 1, Sr: 2,
    // Transition metals (4d)
    Y: 3, Zr: 4, Nb: 5, Mo: 6, Tc: 7, Ru: 2, Rh: 2, Pd: 2, Ag: 1, Cd: 2,
    // Main group
    In: 3, Sn: 4, Sb: 5, Te: 6, I: 7, Xe: 8,

    // Period 6
    Cs: 1, Ba: 2,
    // Lanthanides (4f) - typically 3 valence electrons
    La: 3, Ce: 4, Pr: 3, Nd: 3, Pm: 3, Sm: 3, Eu: 3,
    Gd: 3, Tb: 3, Dy: 3, Ho: 3, Er: 3, Tm: 3, Yb: 3, Lu: 3,
    // Transition metals (5d)
    Hf: 4, Ta: 5, W: 6, Re: 7, Os: 2, Ir: 2, Pt: 2, Au: 1, Hg: 2,
    // Main group
    Tl: 3, Pb: 4, Bi: 5, Po: 6, At: 7, Rn: 8,

    // Period 7
    Fr: 1, Ra: 2,
    // Actinides (5f) - typically 3 valence electrons
    Ac: 3, Th: 4, Pa: 5, U: 6, Np: 6, Pu: 6, Am: 6,
    Cm: 3, Bk: 3, Cf: 3, Es: 3, Fm: 3, Md: 3, No: 3, Lr: 3,
    // Transition metals (6d)
    Rf: 4, Db: 5, Sg: 6, Bh: 7, Hs: 8, Mt: 9,
    // Main group (predicted)
    Ds: 2, Rg: 1, Cn: 2,
    Nh: 3, Fl: 4, Mc: 5, Lv: 6, Ts: 7, Og: 8,
  }

  // Validate element exists
  if (!valence[element]) {
    console.warn(`⚠️ Unknown element: ${element}. Please check element symbol.`)
    return 4 // Fallback to carbon-like behavior
  }

  return valence[element]
}

/**
 * Calculate formal charge for an atom
 *
 * Formula: FC = V - (L + B/2)
 * Where:
 *   V = valence electrons (from periodic table)
 *   L = lone pair electrons
 *   B = bonding electrons (electrons in bonds)
 *
 * IMPORTANT: This function is designed for NEUTRAL molecules.
 * For ions (e.g., NH₄⁺, H₃O⁺), formal charge calculation requires
 * explicit lone pair tracking, which is not currently supported in the UI.
 *
 * Current behavior:
 * - Infers lone electrons as: L = max(0, V - B/2)
 * - Works correctly for neutral molecules (H₂O, CH₄, NH₃, CO₂, etc.)
 * - May give incorrect results for charged species
 *
 * Example - Water (H₂O):
 *   Oxygen: V=6, 2 bonds (4 bonding electrons)
 *   L = max(0, 6 - 2) = 4 (2 lone pairs) ✅
 *   FC = 6 - (4 + 2) = 0 ✅
 *
 * Example - Ammonium ion (NH₄⁺) - LIMITATION:
 *   Nitrogen: V=5, 4 bonds (8 bonding electrons)
 *   L = max(0, 5 - 4) = 1 ❌ (should be 0 for NH₄⁺)
 *   FC = 5 - (1 + 4) = 0 ❌ (should be +1 for NH₄⁺)
 *
 * Future enhancement: Add explicit lone pair editing in UI
 *
 * @param atom The atom to calculate formal charge for
 * @param bonds All bonds involving this atom
 * @returns Formal charge (typically -1, 0, or +1 for stable molecules)
 */
export function calculateFormalCharge(
  atom: BuilderAtom,
  bonds: BuilderBond[]
): number {
  const valence = getValenceElectrons(atom.element)

  // Count bonding electrons (each bond contributes 2 electrons)
  const bondingElectrons = bonds
    .filter(b => b.atom1Id === atom.id || b.atom2Id === atom.id)
    .reduce((sum, bond) => sum + bond.order * 2, 0)

  // Electrons this atom contributes to bonds (one per bond)
  const electronsContributedToBonds = bondingElectrons / 2

  // Infer lone electrons (assumes neutral molecule)
  // For ions, this may be incorrect - see function documentation
  const loneElectrons = Math.max(0, valence - electronsContributedToBonds)

  // Calculate formal charge: FC = V - (L + B/2)
  const formalCharge = valence - (loneElectrons + electronsContributedToBonds)

  // Warn if atom might be part of an ion (unusual formal charge)
  if (Math.abs(formalCharge) > 1) {
    console.warn(
      `⚠️ ${atom.element} has formal charge ${formalCharge}. ` +
      `This might indicate an ionic species, which requires explicit lone pair tracking.`
    )
  }

  return formalCharge
}

/**
 * Check if atom satisfies octet rule
 */
export function checkOctetRule(
  atom: BuilderAtom,
  bonds: BuilderBond[]
): AtomStability {
  const target = getTargetElectrons(atom.element)
  const valence = getValenceElectrons(atom.element)

  // Count electrons from bonds
  const bondElectrons = bonds
    .filter(b => b.atom1Id === atom.id || b.atom2Id === atom.id)
    .reduce((sum, bond) => sum + bond.order * 2, 0)

  // Electrons this atom contributed into bonds
  const electronsContributedToBonds = bondElectrons / 2

  // Lone electrons we can realistically place on the atom
  const maxLoneFromValence = Math.max(0, valence - electronsContributedToBonds)
  const inferredLoneElectrons = Math.min(
    Math.max(0, target - bondElectrons),
    maxLoneFromValence
  )

  // Total electrons around atom
  const currentElectrons = bondElectrons + inferredLoneElectrons
  const needsElectrons = Math.max(0, target - currentElectrons)
  const formalCharge = valence - (inferredLoneElectrons + electronsContributedToBonds)

  return {
    element: atom.element,
    currentElectrons,
    targetElectrons: target,
    needsElectrons,
    formalCharge,
    isStable: needsElectrons === 0 && currentElectrons <= target && Math.abs(formalCharge) <= 1,
    octetSatisfied: currentElectrons === target,
  }
}

/**
 * Generate molecular formula from atoms
 */
export function getMolecularFormula(atoms: BuilderAtom[]): string {
  const counts: Record<string, number> = {}

  // Count atoms
  atoms.forEach(atom => {
    counts[atom.element] = (counts[atom.element] || 0) + 1
  })

  // Build formula string (C first, H second, then alphabetical)
  let formula = ''

  if (counts['C']) {
    formula += `C${counts['C'] > 1 ? counts['C'] : ''}`
    delete counts['C']
  }

  if (counts['H']) {
    formula += `H${counts['H'] > 1 ? counts['H'] : ''}`
    delete counts['H']
  }

  // Add remaining elements alphabetically
  Object.keys(counts)
    .sort()
    .forEach(element => {
      formula += `${element}${counts[element] > 1 ? counts[element] : ''}`
    })

  return formula || 'Empty'
}

/**
 * Validate entire molecule
 */
export function validateMolecule(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): ValidationResult {
  const atomStability = atoms.map(atom => checkOctetRule(atom, bonds))
  const totalCharge = atomStability.reduce((sum, s) => sum + s.formalCharge, 0)
  const formula = getMolecularFormula(atoms)

  const hints: string[] = []
  const warnings: string[] = []

  // Check each atom's stability
  atomStability.forEach((stability, i) => {
    const atom = atoms[i]

    if (stability.needsElectrons > 0) {
      hints.push(
        `${atom.element} needs ${stability.needsElectrons} more electrons. ` +
        `Try adding ${getNeedSuggestion(atom.element, stability.needsElectrons)}`
      )
    }

    if (Math.abs(stability.formalCharge) > 1) {
      warnings.push(
        `${atom.element} has high formal charge (${stability.formalCharge > 0 ? '+' : ''}${stability.formalCharge})`
      )
    }

    if (stability.currentElectrons > stability.targetElectrons) {
      warnings.push(
        `${atom.element} has too many electrons (${stability.currentElectrons}/${stability.targetElectrons})`
      )
    }
  })

  // Check if molecule is stable overall
  const isStable = atomStability.every(s => s.isStable)
  const isValid = atoms.length > 0 && atomStability.every(s => s.currentElectrons <= s.targetElectrons * 1.5)

  // Add general hints
  if (!isStable && hints.length === 0) {
    hints.push('Molecule is unstable. Check formal charges and octet rule.')
  }

  if (Math.abs(totalCharge) > 2) {
    warnings.push(`High total charge: ${totalCharge > 0 ? '+' : ''}${totalCharge}`)
  }

  return {
    isStable,
    isValid,
    totalCharge,
    atomStability,
    hints,
    warnings,
    formula,
  }
}

/**
 * Get suggestion for what to add based on needs
 */
function getNeedSuggestion(element: string, needsElectrons: number): string {
  if (element === 'C' && needsElectrons === 4) {
    return '4 H atoms or 2 double bonds'
  }
  if (element === 'C' && needsElectrons === 2) {
    return '2 H atoms or 1 double bond'
  }
  if (element === 'N' && needsElectrons === 3) {
    return '3 H atoms or bonds'
  }
  if (element === 'O' && needsElectrons === 2) {
    return '2 H atoms or 1 double bond'
  }
  if (element === 'H' && needsElectrons === 1) {
    return 'a bond to C, N, or O'
  }
  if (needsElectrons === 1) {
    return '1 more bond'
  }
  if (needsElectrons === 2) {
    return '2 more bonds or 1 double bond'
  }
  return `${needsElectrons} more bonds`
}

/**
 * Try to recognize molecule from formula
 */
export function recognizeMolecule(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): string | null {
  if (atoms.length === 0) return null

  // Get molecular formula
  const formula = getMolecularFormula(atoms)

  // Create alternative formula (with numbers)
  const counts: Record<string, number> = {}
  atoms.forEach(atom => {
    counts[atom.element] = (counts[atom.element] || 0) + 1
  })

  // Try different formula formats
  const formulas = [
    formula,
    // Add numbered format (e.g., C1H4 instead of CH4)
    Object.entries(counts)
      .map(([el, count]) => `${el}${count}`)
      .sort()
      .join(''),
  ]

  // Check all possible formulas
  for (const f of formulas) {
    if (KNOWN_MOLECULES[f]) {
      return KNOWN_MOLECULES[f].name + (KNOWN_MOLECULES[f].common ? ` (${KNOWN_MOLECULES[f].common})` : '')
    }
  }

  // Special checks for specific structures
  if (atoms.length === 3 && atoms.filter(a => a.element === 'H').length === 2 && atoms.some(a => a.element === 'O')) {
    return 'Water (H₂O)'
  }

  if (atoms.length === 5 && atoms.filter(a => a.element === 'H').length === 4 && atoms.some(a => a.element === 'C')) {
    return 'Methane (CH₄)'
  }

  if (atoms.length === 3 && atoms.filter(a => a.element === 'O').length === 2 && atoms.some(a => a.element === 'C')) {
    // Check if it's linear (CO2)
    const oxygens = atoms.filter(a => a.element === 'O')
    const carbon = atoms.find(a => a.element === 'C')
    if (carbon && oxygens.length === 2) {
      // Check for double bonds
      const doubleBonds = bonds.filter(b => b.order === 2).length
      if (doubleBonds === 2) {
        return 'Carbon Dioxide (CO₂)'
      }
    }
  }

  return null
}

/**
 * Calculate distance between two atoms
 */
export function getDistance(atom1: BuilderAtom, atom2: BuilderAtom): number {
  const dx = atom2.x - atom1.x
  const dy = atom2.y - atom1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if two atoms are close enough to bond
 */
export function canBond(atom1: BuilderAtom, atom2: BuilderAtom): boolean {
  // Note: BOND constant not imported to avoid circular dependency
  // MAX_BOND_DISTANCE = 100 pixels (defined in /lib/constants/molecule-builder.ts)
  const MAX_BOND_DISTANCE = 100
  const distance = getDistance(atom1, atom2)
  return distance < MAX_BOND_DISTANCE
}

/**
 * Convert Molecule3D to builder atoms and bonds
 * Scales and positions the molecule for the canvas
 *
 * @param molecule - Molecule3D object from molecules-3d.ts
 * @param canvasWidth - Width of the canvas (default: 600)
 * @param canvasHeight - Height of the canvas (default: 600)
 * @returns Object containing builder-compatible atoms and bonds
 */
export function molecule3DToBuilder(
  molecule: {
    atoms: Array<{ element: string; position: { x: number; y: number; z: number }; index: number }>
    bonds: Array<{ atom1Index: number; atom2Index: number; order: number }>
  },
  canvasWidth = 600,
  canvasHeight = 600
): { atoms: BuilderAtom[]; bonds: BuilderBond[] } {
  const baseId = Date.now()

  // Find bounding box of molecule
  const positions = molecule.atoms.map(a => a.position)
  const minX = Math.min(...positions.map(p => p.x))
  const maxX = Math.max(...positions.map(p => p.x))
  const minY = Math.min(...positions.map(p => p.y))
  const maxY = Math.max(...positions.map(p => p.y))

  // Calculate scale to fit in canvas (with padding)
  const moleculeWidth = maxX - minX || 1
  const moleculeHeight = maxY - minY || 1
  const padding = 100
  const scaleX = (canvasWidth - padding * 2) / moleculeWidth
  const scaleY = (canvasHeight - padding * 2) / moleculeHeight
  const scale = Math.min(scaleX, scaleY, 50) // Max scale of 50 for very small molecules

  // Center point
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const moleculeCenterX = (minX + maxX) / 2
  const moleculeCenterY = (minY + maxY) / 2

  // Convert atoms
  const atoms: BuilderAtom[] = molecule.atoms.map((atom, idx) => ({
    id: baseId + idx,
    element: atom.element,
    x: centerX + (atom.position.x - moleculeCenterX) * scale,
    y: centerY + (atom.position.y - moleculeCenterY) * scale,
    z: atom.position.z * scale,
    valenceElectrons: getValenceElectrons(atom.element),
    formalCharge: 0,
  }))

  // Convert bonds (using index mapping)
  const bonds: BuilderBond[] = molecule.bonds.map((bond, idx) => ({
    id: baseId + 1000 + idx,
    atom1Id: atoms[bond.atom1Index].id,
    atom2Id: atoms[bond.atom2Index].id,
    order: bond.order as 1 | 2 | 3,
  }))

  return { atoms, bonds }
}
