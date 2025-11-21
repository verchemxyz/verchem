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
 */
export function getValenceElectrons(element: string): number {
  const valence: Record<string, number> = {
    H: 1, He: 2,
    Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, Ne: 8,
    Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7, Ar: 8,
    K: 1, Ca: 2, Br: 7, I: 7,
  }
  return valence[element] || 4
}

/**
 * Calculate formal charge for an atom
 * FC = V - (L + B/2)
 * V = valence electrons
 * L = lone pair electrons
 * B = bonding electrons
 */
export function calculateFormalCharge(
  atom: BuilderAtom,
  bonds: BuilderBond[]
): number {
  const valence = getValenceElectrons(atom.element)

  // Count bonding electrons (each bond contributes)
  const bondingElectrons = bonds
    .filter(b => b.atom1Id === atom.id || b.atom2Id === atom.id)
    .reduce((sum, bond) => sum + bond.order * 2, 0)

  // Estimate lone pair electrons
  const loneElectrons = Math.max(0, valence - bondingElectrons)

  // FC = V - (L + B/2)
  return valence - (loneElectrons + bondingElectrons / 2)
}

/**
 * Check if atom satisfies octet rule
 */
export function checkOctetRule(
  atom: BuilderAtom,
  bonds: BuilderBond[]
): AtomStability {
  const target = getTargetElectrons(atom.element)

  // Count electrons from bonds
  const bondElectrons = bonds
    .filter(b => b.atom1Id === atom.id || b.atom2Id === atom.id)
    .reduce((sum, bond) => sum + bond.order * 2, 0)

  // Total electrons around atom
  const currentElectrons = bondElectrons
  const needsElectrons = Math.max(0, target - currentElectrons)
  const formalCharge = calculateFormalCharge(atom, bonds)

  return {
    element: atom.element,
    currentElectrons,
    targetElectrons: target,
    needsElectrons,
    formalCharge,
    isStable: needsElectrons === 0 && Math.abs(formalCharge) <= 1,
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
  const distance = getDistance(atom1, atom2)
  return distance < 100 // pixels
}
