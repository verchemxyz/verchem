// VerChem - Lewis Structure Generator
// Automatic generation of Lewis structures for molecules

/**
 * Atom in Lewis structure (2D representation)
 */
export interface LewisAtom {
  element: string
  index: number
  x: number // 2D x position
  y: number // 2D y position
  lonePairs: number // Number of lone electron pairs
  formalCharge: number
  bonds: LewisBond[]
}

/**
 * Bond in Lewis structure
 */
export interface LewisBond {
  toAtomIndex: number
  order: 1 | 2 | 3 // Single, double, triple
}

/**
 * Complete Lewis structure
 */
export interface LewisStructure {
  formula: string
  atoms: LewisAtom[]
  totalValenceElectrons: number
  octetSatisfied: boolean
  hasResonance: boolean
  resonanceStructures?: LewisStructure[]
  steps: string[]
}

/**
 * Valence electrons for main group elements
 */
const VALENCE_ELECTRONS: Record<string, number> = {
  H: 1,
  He: 2,
  Li: 1,
  Be: 2,
  B: 3,
  C: 4,
  N: 5,
  O: 6,
  F: 7,
  Ne: 8,
  Na: 1,
  Mg: 2,
  Al: 3,
  Si: 4,
  P: 5,
  S: 6,
  Cl: 7,
  Ar: 8,
  K: 1,
  Ca: 2,
  Br: 7,
  I: 7,
}

/**
 * Get valence electrons for an element
 */
function getValenceElectrons(element: string): number {
  return VALENCE_ELECTRONS[element] || 0
}

/**
 * Parse molecular formula to get atom counts
 * Simple parser for basic formulas (e.g., H2O, CO2, NH3, C2H6)
 */
export function parseFormula(formula: string): Map<string, number> {
  const atoms = new Map<string, number>()
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match

  while ((match = regex.exec(formula)) !== null) {
    const element = match[1]
    const count = match[2] ? parseInt(match[2]) : 1
    atoms.set(element, (atoms.get(element) || 0) + count)
  }

  return atoms
}

/**
 * Calculate total valence electrons
 */
function calculateTotalValenceElectrons(
  atoms: Map<string, number>,
  charge: number = 0
): number {
  let total = 0
  atoms.forEach((count, element) => {
    total += getValenceElectrons(element) * count
  })
  return total - charge
}

/**
 * Determine central atom (usually the least electronegative, not H)
 */
function determineCentralAtom(atoms: Map<string, number>): string {
  // Remove H (never central)
  const candidates = Array.from(atoms.keys()).filter((el) => el !== 'H')

  if (candidates.length === 0) return 'H' // H2 molecule
  if (candidates.length === 1) return candidates[0]

  // Prefer C, Si, then least electronegative
  if (candidates.includes('C')) return 'C'
  if (candidates.includes('Si')) return 'Si'
  if (candidates.includes('P')) return 'P'
  if (candidates.includes('S')) return 'S'
  if (candidates.includes('N')) return 'N'

  return candidates[0]
}

/**
 * Calculate formal charge for an atom
 * FC = V - N - B/2
 * V = valence electrons
 * N = non-bonding electrons (lone pairs × 2)
 * B = bonding electrons (bonds × 2)
 */
function calculateFormalCharge(
  element: string,
  lonePairs: number,
  bondCount: number
): number {
  const V = getValenceElectrons(element)
  const N = lonePairs * 2
  const B = bondCount * 2
  return V - N - Math.floor(B / 2)
}

/**
 * Simple Lewis structure generator for common molecules
 * Works for: H2O, CO2, NH3, CH4, HCl, N2, O2, etc.
 */
export function generateLewisStructure(
  formula: string,
  charge: number = 0
): LewisStructure {
  const steps: string[] = []
  steps.push(`Generating Lewis structure for ${formula}`)

  // Parse formula
  const atomCounts = parseFormula(formula)
  steps.push(
    `Atoms: ${Array.from(atomCounts.entries())
      .map(([el, count]) => `${el}×${count}`)
      .join(', ')}`
  )

  // Calculate valence electrons
  const totalValence = calculateTotalValenceElectrons(atomCounts, charge)
  steps.push(`Total valence electrons: ${totalValence}`)

  // Determine central atom
  const centralElement = determineCentralAtom(atomCounts)
  steps.push(`Central atom: ${centralElement}`)

  // Create atom list
  const atoms: LewisAtom[] = []
  const coords: { element: string; x: number; y: number }[] = []

  // Build peripheral atoms list
  const peripheralAtoms: string[] = []
  atomCounts.forEach((count, element) => {
    if (element === centralElement) {
      // Add central atom(s)
      for (let i = 0; i < count; i++) {
        if (i === 0) {
          coords.push({ element, x: 0, y: 0 })
        } else {
          // Multiple central atoms (e.g., C2H6)
          coords.push({ element, x: 50 * i, y: 0 })
        }
      }
    } else {
      // Add peripheral atoms
      for (let i = 0; i < count; i++) {
        peripheralAtoms.push(element)
      }
    }
  })

  // Generate coordinates for peripheral atoms
  const radius = 100
  const angleStep = (2 * Math.PI) / peripheralAtoms.length
  peripheralAtoms.forEach((element, i) => {
    const angle = i * angleStep - Math.PI / 2 // Start from top
    coords.push({
      element,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    })
  })

  // Create atoms with initial single bonds to central atom
  coords.forEach((coord, i) => {
    atoms.push({
      element: coord.element,
      index: i,
      x: coord.x,
      y: coord.y,
      lonePairs: 0,
      formalCharge: 0,
      bonds: [],
    })
  })

  // Connect peripheral atoms to central atom with single bonds
  const centralIndex = 0
  let electronsUsed = 0

  for (let i = 1; i < atoms.length; i++) {
    atoms[centralIndex].bonds.push({ toAtomIndex: i, order: 1 })
    atoms[i].bonds.push({ toAtomIndex: centralIndex, order: 1 })
    electronsUsed += 2
  }

  steps.push(`Initial single bonds: ${(atoms.length - 1)} bonds = ${electronsUsed} electrons`)

  // Distribute remaining electrons as lone pairs
  let remainingElectrons = totalValence - electronsUsed
  steps.push(`Remaining electrons: ${remainingElectrons}`)

  // Complete octets for peripheral atoms first (except H)
  for (let i = 1; i < atoms.length; i++) {
    const atom = atoms[i]
    if (atom.element === 'H') continue // H only needs 2 electrons

    const bondCount = atom.bonds.length
    const electronsNeeded = 8 - bondCount * 2

    const lonePairsNeeded = Math.floor(electronsNeeded / 2)
    const pairsToAdd = Math.min(lonePairsNeeded, Math.floor(remainingElectrons / 2))

    atom.lonePairs = pairsToAdd
    remainingElectrons -= pairsToAdd * 2
  }

  // Put remaining electrons on central atom
  if (remainingElectrons > 0) {
    atoms[centralIndex].lonePairs = Math.floor(remainingElectrons / 2)
    remainingElectrons -= atoms[centralIndex].lonePairs * 2
  }

  steps.push(`Distributed lone pairs to satisfy octets`)

  // Check if central atom needs double/triple bonds
  const centralAtom = atoms[centralIndex]
  const centralBondCount = centralAtom.bonds.length
  const centralElectrons = centralBondCount * 2 + centralAtom.lonePairs * 2

  if (centralElectrons < 8 && centralAtom.element !== 'H' && centralAtom.element !== 'B') {
    // Need multiple bonds
    const bondsNeeded = Math.floor((8 - centralElectrons) / 2)

    steps.push(`Central atom needs ${bondsNeeded} additional bonds`)

    // Convert single bonds to double/triple bonds
    let bondsAdded = 0
    for (let i = 1; i < atoms.length && bondsAdded < bondsNeeded; i++) {
      const atom = atoms[i]
      if (atom.element === 'H') continue

      // Find bond to central atom
      const bondIndex = atom.bonds.findIndex((b) => b.toAtomIndex === centralIndex)
      if (bondIndex !== -1 && atom.lonePairs > 0) {
        // Convert lone pair to bonding pair
        atom.bonds[bondIndex].order = (atom.bonds[bondIndex].order + 1) as 1 | 2 | 3
        atom.lonePairs -= 1

        // Update central atom's bond
        const centralBondIndex = centralAtom.bonds.findIndex(
          (b) => b.toAtomIndex === i
        )
        if (centralBondIndex !== -1) {
          centralAtom.bonds[centralBondIndex].order = atom.bonds[bondIndex].order
        }

        bondsAdded++
      }
    }

    steps.push(`Added ${bondsAdded} multiple bonds`)
  }

  // Calculate formal charges
  atoms.forEach((atom) => {
    const bondCount = atom.bonds.reduce((sum, bond) => sum + bond.order, 0)
    atom.formalCharge = calculateFormalCharge(
      atom.element,
      atom.lonePairs,
      bondCount
    )
  })

  steps.push(`Calculated formal charges`)

  // Check octet satisfaction
  let octetSatisfied = true
  atoms.forEach((atom) => {
    const bondCount = atom.bonds.reduce((sum, bond) => sum + bond.order, 0)
    const totalElectrons = bondCount * 2 + atom.lonePairs * 2

    if (atom.element === 'H' && totalElectrons !== 2) {
      octetSatisfied = false
    } else if (
      atom.element !== 'H' &&
      atom.element !== 'B' &&
      atom.element !== 'Be' &&
      totalElectrons !== 8
    ) {
      octetSatisfied = false
    }
  })

  return {
    formula,
    atoms,
    totalValenceElectrons: totalValence,
    octetSatisfied,
    hasResonance: false, // TODO: Resonance detection
    steps,
  }
}

/**
 * Pre-defined Lewis structures for common molecules
 */

// Water (H2O)
export const LEWIS_H2O: LewisStructure = {
  formula: 'H2O',
  totalValenceElectrons: 8,
  octetSatisfied: true,
  hasResonance: false,
  atoms: [
    {
      element: 'O',
      index: 0,
      x: 0,
      y: 0,
      lonePairs: 2,
      formalCharge: 0,
      bonds: [
        { toAtomIndex: 1, order: 1 },
        { toAtomIndex: 2, order: 1 },
      ],
    },
    { element: 'H', index: 1, x: -80, y: 60, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
    { element: 'H', index: 2, x: 80, y: 60, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
  ],
  steps: ['Pre-defined Lewis structure for water'],
}

// Carbon Dioxide (CO2)
export const LEWIS_CO2: LewisStructure = {
  formula: 'CO2',
  totalValenceElectrons: 16,
  octetSatisfied: true,
  hasResonance: true,
  atoms: [
    {
      element: 'C',
      index: 0,
      x: 0,
      y: 0,
      lonePairs: 0,
      formalCharge: 0,
      bonds: [
        { toAtomIndex: 1, order: 2 },
        { toAtomIndex: 2, order: 2 },
      ],
    },
    { element: 'O', index: 1, x: -100, y: 0, lonePairs: 2, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 2 }] },
    { element: 'O', index: 2, x: 100, y: 0, lonePairs: 2, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 2 }] },
  ],
  steps: ['Pre-defined Lewis structure for carbon dioxide'],
}

// Ammonia (NH3)
export const LEWIS_NH3: LewisStructure = {
  formula: 'NH3',
  totalValenceElectrons: 8,
  octetSatisfied: true,
  hasResonance: false,
  atoms: [
    {
      element: 'N',
      index: 0,
      x: 0,
      y: 0,
      lonePairs: 1,
      formalCharge: 0,
      bonds: [
        { toAtomIndex: 1, order: 1 },
        { toAtomIndex: 2, order: 1 },
        { toAtomIndex: 3, order: 1 },
      ],
    },
    { element: 'H', index: 1, x: 0, y: -100, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
    { element: 'H', index: 2, x: -87, y: 50, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
    { element: 'H', index: 3, x: 87, y: 50, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
  ],
  steps: ['Pre-defined Lewis structure for ammonia'],
}

// Methane (CH4)
export const LEWIS_CH4: LewisStructure = {
  formula: 'CH4',
  totalValenceElectrons: 8,
  octetSatisfied: true,
  hasResonance: false,
  atoms: [
    {
      element: 'C',
      index: 0,
      x: 0,
      y: 0,
      lonePairs: 0,
      formalCharge: 0,
      bonds: [
        { toAtomIndex: 1, order: 1 },
        { toAtomIndex: 2, order: 1 },
        { toAtomIndex: 3, order: 1 },
        { toAtomIndex: 4, order: 1 },
      ],
    },
    { element: 'H', index: 1, x: 0, y: -100, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
    { element: 'H', index: 2, x: 0, y: 100, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
    { element: 'H', index: 3, x: -100, y: 0, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
    { element: 'H', index: 4, x: 100, y: 0, lonePairs: 0, formalCharge: 0, bonds: [{ toAtomIndex: 0, order: 1 }] },
  ],
  steps: ['Pre-defined Lewis structure for methane'],
}

/**
 * Get pre-defined Lewis structure
 */
export function getPreDefinedLewisStructure(formula: string): LewisStructure | null {
  const structures: Record<string, LewisStructure> = {
    H2O: LEWIS_H2O,
    CO2: LEWIS_CO2,
    NH3: LEWIS_NH3,
    CH4: LEWIS_CH4,
  }

  return structures[formula] || null
}

/**
 * Validate Lewis structure (check octet rule, formal charges)
 */
export function validateLewisStructure(structure: LewisStructure): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // Check octet rule
  structure.atoms.forEach((atom) => {
    const bondCount = atom.bonds.reduce((sum, bond) => sum + bond.order, 0)
    const totalElectrons = bondCount * 2 + atom.lonePairs * 2

    if (atom.element === 'H' && totalElectrons !== 2) {
      warnings.push(`${atom.element} at index ${atom.index} does not have 2 electrons`)
    } else if (
      atom.element !== 'H' &&
      atom.element !== 'B' &&
      atom.element !== 'Be' &&
      totalElectrons !== 8
    ) {
      warnings.push(
        `${atom.element} at index ${atom.index} does not satisfy octet rule (${totalElectrons}/8 electrons)`
      )
    }
  })

  // Check formal charges
  const totalCharge = structure.atoms.reduce((sum, atom) => sum + atom.formalCharge, 0)
  if (totalCharge !== 0) {
    warnings.push(`Total formal charge is ${totalCharge}, should be 0 for neutral molecules`)
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}
