// VerChem - VSEPR Geometry Predictor
// Predict molecular geometry using VSEPR theory

import type { VSEPRGeometry } from '@/lib/types/chemistry'

/**
 * VSEPR Geometry Prediction Result
 */
export interface VSEPRPrediction {
  centralAtom: string
  bondingPairs: number
  lonePairs: number
  totalPairs: number
  electronGeometry: string
  molecularGeometry: VSEPRGeometry
  bondAngles: number[]
  polarity: 'polar' | 'nonpolar'
  hybridization: string
  examples: string[]
  description: string
  steps: string[]
  doubleBonds: number
  tripleBonds: number
}

export interface VSEPROptions {
  doubleBonds?: number
  tripleBonds?: number
}

/**
 * VSEPR Geometry Data
 */
interface VSEPRData {
  electronGeometry: string
  molecularGeometry: VSEPRGeometry
  bondAngles: number[]
  hybridization: string
  examples: string[]
  description: string
}

/**
 * VSEPR Geometry Table
 * Key: "bondingPairs-lonePairs"
 */
const VSEPR_TABLE: Record<string, VSEPRData> = {
  // 2 total pairs
  '2-0': {
    electronGeometry: 'Linear',
    molecularGeometry: 'linear',
    bondAngles: [180],
    hybridization: 'sp',
    examples: ['CO₂', 'BeCl₂', 'HCN'],
    description: '2 bonding pairs, 0 lone pairs. Perfectly linear with 180° bond angle.',
  },

  // 3 total pairs
  '3-0': {
    electronGeometry: 'Trigonal Planar',
    molecularGeometry: 'trigonal-planar',
    bondAngles: [120],
    hybridization: 'sp²',
    examples: ['BF₃', 'SO₃', 'NO₃⁻'],
    description: '3 bonding pairs, 0 lone pairs. Planar triangle with 120° bond angles.',
  },
  '2-1': {
    electronGeometry: 'Trigonal Planar',
    molecularGeometry: 'bent',
    bondAngles: [118],
    hybridization: 'sp²',
    examples: ['SO₂', 'NO₂', 'O₃'],
    description:
      '2 bonding pairs, 1 lone pair. Bent shape with ~118° bond angle (slightly less than 120°).',
  },

  // 4 total pairs
  '4-0': {
    electronGeometry: 'Tetrahedral',
    molecularGeometry: 'tetrahedral',
    bondAngles: [109.5],
    hybridization: 'sp³',
    examples: ['CH₄', 'CCl₄', 'NH₄⁺'],
    description: '4 bonding pairs, 0 lone pairs. Perfect tetrahedron with 109.5° bond angles.',
  },
  '3-1': {
    electronGeometry: 'Tetrahedral',
    molecularGeometry: 'trigonal-pyramidal',
    bondAngles: [107],
    hybridization: 'sp³',
    examples: ['NH₃', 'PH₃', 'H₃O⁺'],
    description:
      '3 bonding pairs, 1 lone pair. Pyramidal shape with ~107° bond angle (slightly less than 109.5°).',
  },
  '2-2': {
    electronGeometry: 'Tetrahedral',
    molecularGeometry: 'bent',
    bondAngles: [104.5],
    hybridization: 'sp³',
    examples: ['H₂O', 'H₂S', 'OF₂'],
    description:
      '2 bonding pairs, 2 lone pairs. Bent shape with ~104.5° bond angle (less than 109.5°).',
  },

  // 5 total pairs
  '5-0': {
    electronGeometry: 'Trigonal Bipyramidal',
    molecularGeometry: 'trigonal-bipyramidal',
    bondAngles: [90, 120],
    hybridization: 'sp³d',
    examples: ['PCl₅', 'PF₅', 'AsF₅'],
    description:
      '5 bonding pairs, 0 lone pairs. Trigonal bipyramid with 90° and 120° bond angles.',
  },
  '4-1': {
    electronGeometry: 'Trigonal Bipyramidal',
    molecularGeometry: 'seesaw',
    bondAngles: [89, 117],
    hybridization: 'sp³d',
    examples: ['SF₄', 'XeO₂F₂'],
    description:
      '4 bonding pairs, 1 lone pair (equatorial). Seesaw shape with distorted angles.',
  },
  '3-2': {
    electronGeometry: 'Trigonal Bipyramidal',
    molecularGeometry: 'T-shaped',
    bondAngles: [87],
    hybridization: 'sp³d',
    examples: ['ClF₃', 'BrF₃'],
    description:
      '3 bonding pairs, 2 lone pairs (equatorial). T-shaped with ~87° bond angles.',
  },
  '2-3': {
    electronGeometry: 'Trigonal Bipyramidal',
    molecularGeometry: 'linear',
    bondAngles: [180],
    hybridization: 'sp³d',
    examples: ['XeF₂', 'I₃⁻'],
    description: '2 bonding pairs, 3 lone pairs (equatorial). Linear with 180° bond angle.',
  },

  // 6 total pairs
  '6-0': {
    electronGeometry: 'Octahedral',
    molecularGeometry: 'octahedral',
    bondAngles: [90],
    hybridization: 'sp³d²',
    examples: ['SF₆', 'PF₆⁻', 'Mo(CO)₆'],
    description: '6 bonding pairs, 0 lone pairs. Perfect octahedron with 90° bond angles.',
  },
  '5-1': {
    electronGeometry: 'Octahedral',
    molecularGeometry: 'square-pyramidal',
    bondAngles: [88],
    hybridization: 'sp³d²',
    examples: ['BrF₅', 'IF₅', 'XeOF₄'],
    description:
      '5 bonding pairs, 1 lone pair. Square pyramid with ~88° bond angles (slightly less than 90°).',
  },
  '4-2': {
    electronGeometry: 'Octahedral',
    molecularGeometry: 'square-planar',
    bondAngles: [90],
    hybridization: 'sp³d²',
    examples: ['XeF₄', 'ICl₄⁻', 'PtCl₄²⁻'],
    description: '4 bonding pairs, 2 lone pairs (opposite). Square planar with 90° bond angles.',
  },
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
  Br: 7,
  I: 7,
  Xe: 8,
}

/**
 * Get valence electrons
 */
function getValenceElectrons(element: string): number {
  return VALENCE_ELECTRONS[element] || 0
}

/**
 * Check if molecule is polar based on geometry and electronegativity
 */
function predictPolarity(
  geometry: VSEPRGeometry,
  lonePairs: number,
  bondingPairs: number
): 'polar' | 'nonpolar' {
  // Symmetric geometries with no lone pairs are nonpolar
  if (lonePairs === 0) {
    if (geometry === 'linear' && bondingPairs === 2) return 'nonpolar'
    if (geometry === 'trigonal-planar') return 'nonpolar'
    if (geometry === 'tetrahedral') return 'nonpolar'
    if (geometry === 'trigonal-bipyramidal') return 'nonpolar'
    if (geometry === 'octahedral') return 'nonpolar'
    if (geometry === 'square-planar') return 'nonpolar'
  }

  // Most other geometries with lone pairs are polar
  if (geometry === 'bent') return 'polar'
  if (geometry === 'trigonal-pyramidal') return 'polar'
  if (geometry === 'seesaw') return 'polar'
  if (geometry === 'T-shaped') return 'polar'
  if (geometry === 'square-pyramidal') return 'polar'

  // Linear with lone pairs (e.g., XeF2) is nonpolar
  if (geometry === 'linear' && lonePairs > 0) return 'nonpolar'

  return 'polar'
}

/**
 * Predict VSEPR geometry from central atom and surrounding atoms
 */
export function predictVSEPRGeometry(
  centralAtom: string,
  surroundingAtoms: string[],
  charge: number = 0,
  options: VSEPROptions = {}
): VSEPRPrediction {
  const steps: string[] = []
  steps.push(`Predicting VSEPR geometry for ${centralAtom} with ${surroundingAtoms.length} atoms`)

  // Count bonding pairs (number of surrounding atoms)
  const bondingPairs = surroundingAtoms.length
  steps.push(`Bonding pairs: ${bondingPairs}`)

  const rawDoubleBonds = Math.max(0, options.doubleBonds ?? 0)
  const rawTripleBonds = Math.max(0, options.tripleBonds ?? 0)
  const adjustedDoubleBonds = Math.min(rawDoubleBonds, bondingPairs)
  const adjustedTripleBonds = Math.min(rawTripleBonds, Math.max(0, bondingPairs - adjustedDoubleBonds))
  steps.push(`Double bonds: ${adjustedDoubleBonds}, Triple bonds: ${adjustedTripleBonds}`)

  // Calculate valence electrons for central atom
  const centralValence = getValenceElectrons(centralAtom)
  steps.push(`${centralAtom} valence electrons: ${centralValence}`)

  // Estimate remaining electrons for lone pairs (sigma + extra pairs for multiple bonds)
  const effectiveValence = centralValence - charge
  const extraBondPairs = adjustedDoubleBonds + adjustedTripleBonds * 2
  const electronsUsedForBonding = bondingPairs + extraBondPairs
  const remainingElectrons = Math.max(0, effectiveValence - electronsUsedForBonding)
  const lonePairs = Math.max(0, Math.floor(remainingElectrons / 2))
  steps.push(`Estimated lone pairs on ${centralAtom}: ${lonePairs}`)

  // Total electron pairs (steric number)
  const totalPairs = bondingPairs + lonePairs
  steps.push(`Total electron pairs: ${totalPairs} (${bondingPairs} bonding + ${lonePairs} lone)`)

  // Look up geometry
  const key = `${bondingPairs}-${lonePairs}`
  const vseprData = VSEPR_TABLE[key]

  if (!vseprData) {
    return {
      centralAtom,
      bondingPairs,
      lonePairs,
      doubleBonds: 0,
      tripleBonds: 0,
      totalPairs,
      electronGeometry: 'Unknown',
      molecularGeometry: 'linear',
      bondAngles: [],
      polarity: 'polar',
      hybridization: 'Unknown',
      examples: [],
      description: `Geometry not found for ${bondingPairs} bonding pairs and ${lonePairs} lone pairs`,
      steps,
    }
  }

  // Predict polarity
  const polarity = predictPolarity(vseprData.molecularGeometry, lonePairs, bondingPairs)
  steps.push(`Molecular polarity: ${polarity}`)

  return {
    centralAtom,
    bondingPairs,
    lonePairs,
    totalPairs,
    electronGeometry: vseprData.electronGeometry,
    molecularGeometry: vseprData.molecularGeometry,
    bondAngles: vseprData.bondAngles,
    polarity,
    hybridization: vseprData.hybridization,
    examples: vseprData.examples,
    description: vseprData.description,
    steps,
    doubleBonds: adjustedDoubleBonds,
    tripleBonds: adjustedTripleBonds,
  }
}

/**
 * Predict geometry from molecular formula (simple parser)
 */
export function predictFromFormula(formula: string): VSEPRPrediction | null {
  // Try pattern 1: AB_n format (e.g., CH4, NH3, BF3)
  const match1 = formula.match(/^([A-Z][a-z]?)([A-Z][a-z]?)(\d*)$/)
  if (match1) {
    const centralAtom = match1[1]
    const surroundingAtom = match1[2] || 'H'
    const count = match1[3] ? parseInt(match1[3]) : 1
    const surroundingAtoms = Array(count).fill(surroundingAtom)
    return predictVSEPRGeometry(centralAtom, surroundingAtoms)
  }

  // Try pattern 2: A_nB format (e.g., H2O, H2S) - surrounding atom first
  const match2 = formula.match(/^([A-Z][a-z]?)(\d+)([A-Z][a-z]?)$/)
  if (match2) {
    const surroundingAtom = match2[1]
    const count = parseInt(match2[2])
    const centralAtom = match2[3]
    const surroundingAtoms = Array(count).fill(surroundingAtom)
    return predictVSEPRGeometry(centralAtom, surroundingAtoms)
  }

  return null
}

/**
 * Get all VSEPR geometries
 */
export function getAllVSEPRGeometries(): Array<{
  key: string
  bondingPairs: number
  lonePairs: number
  data: VSEPRData
}> {
  return Object.entries(VSEPR_TABLE).map(([key, data]) => {
    const [bp, lp] = key.split('-').map(Number)
    return {
      key,
      bondingPairs: bp,
      lonePairs: lp,
      data,
    }
  })
}

/**
 * Common molecules with pre-calculated VSEPR
 */
export const COMMON_VSEPR_EXAMPLES = [
  { formula: 'CH4', name: 'Methane', geometry: 'tetrahedral' },
  { formula: 'NH3', name: 'Ammonia', geometry: 'trigonal-pyramidal' },
  { formula: 'H2O', name: 'Water', geometry: 'bent' },
  { formula: 'CO2', name: 'Carbon Dioxide', geometry: 'linear' },
  { formula: 'BF3', name: 'Boron Trifluoride', geometry: 'trigonal-planar' },
  { formula: 'PCl5', name: 'Phosphorus Pentachloride', geometry: 'trigonal-bipyramidal' },
  { formula: 'SF6', name: 'Sulfur Hexafluoride', geometry: 'octahedral' },
  { formula: 'SF4', name: 'Sulfur Tetrafluoride', geometry: 'seesaw' },
  { formula: 'ClF3', name: 'Chlorine Trifluoride', geometry: 'T-shaped' },
  { formula: 'XeF2', name: 'Xenon Difluoride', geometry: 'linear' },
  { formula: 'XeF4', name: 'Xenon Tetrafluoride', geometry: 'square-planar' },
  { formula: 'BrF5', name: 'Bromine Pentafluoride', geometry: 'square-pyramidal' },
]
