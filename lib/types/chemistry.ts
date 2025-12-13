// VerChem - World-Class Chemistry Platform
// Type Definitions for Chemical Data

/**
 * Chemical Element (Periodic Table)
 */
export interface Element {
  atomicNumber: number
  symbol: string
  name: string
  atomicMass: number // amu
  category: ElementCategory
  group?: number // 1-18
  period: number // 1-7
  block: 's' | 'p' | 'd' | 'f'
  electronConfiguration: string
  electronegativity?: number // Pauling scale
  ionizationEnergy?: number // kJ/mol
  electronAffinity?: number // kJ/mol
  oxidationStates: number[]
  standardState: 'gas' | 'liquid' | 'solid' | 'unknown'
  meltingPoint?: number // K
  boilingPoint?: number // K
  density?: number // g/cm³
  atomicRadius?: number // pm
  covalentRadius?: number // pm
  vanDerWaalsRadius?: number // pm
  discoveryYear?: number
  discoverer?: string
  nameMeaning?: string
}

export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth-metal'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown'

/**
 * Chemical Compound
 */
export type Compound = import('../data/compounds/types').Compound

export interface Solubility {
  water?: string // e.g., "soluble", "insoluble", "25 g/100 mL"
  ethanol?: string
  ether?: string
  acetone?: string
  other?: Record<string, string>
}

export interface Hazard {
  type: 'flammable' | 'toxic' | 'corrosive' | 'oxidizer' | 'explosive' | 'carcinogen' | 'irritant' | 'environmental'
  severity: 'low' | 'moderate' | 'high' | 'extreme'
  description: string
  ghsCode?: string // e.g., "H225", "H301"
}

/**
 * Chemical Reaction
 */
export interface ChemicalReaction {
  reactants: ReactionComponent[]
  products: ReactionComponent[]
  reactionType: ReactionType
  conditions?: ReactionConditions
  mechanism?: string

  // Thermodynamics
  deltaH?: number // kJ/mol (enthalpy change)
  deltaS?: number // J/(mol·K) (entropy change)
  deltaG?: number // kJ/mol (Gibbs free energy)
  equilibriumConstant?: number // K or Kc

  // Kinetics
  rateConstant?: number
  activationEnergy?: number // kJ/mol
  rateEquation?: string
}

export interface ReactionComponent {
  compound: string // formula
  coefficient: number
  state?: 'solid' | 'liquid' | 'gas' | 'aqueous'
  moles?: number
  mass?: number // g
  volume?: number // L
}

export type ReactionType =
  | 'synthesis'
  | 'decomposition'
  | 'single-replacement'
  | 'double-replacement'
  | 'combustion'
  | 'acid-base'
  | 'redox'
  | 'precipitation'

export interface ReactionConditions {
  temperature?: number // °C
  pressure?: number // atm
  catalyst?: string
  solvent?: string
  pH?: number
  time?: number // minutes
}

/**
 * Solution Calculations
 */
export interface Solution {
  solute: string
  solvent: string
  concentration: Concentration
  volume: number // L
  temperature?: number // °C
  pH?: number
  density?: number // g/mL
}

export interface Concentration {
  molarity?: number // mol/L (M)
  molality?: number // mol/kg (m)
  massPercent?: number // %
  volumePercent?: number // %
  ppm?: number // parts per million
  ppb?: number // parts per billion
  normality?: number // eq/L (N)
  molarFraction?: number
}

/**
 * Gas Properties
 */
export interface GasProperties {
  substance: string
  pressure: number // atm
  volume: number // L
  temperature: number // K
  moles: number // mol
  mass?: number // g
  density?: number // g/L
  molarMass?: number // g/mol
}

/**
 * Stoichiometry Calculation
 */
export interface StoichiometryResult {
  reaction: ChemicalReaction
  limitingReagent?: string
  excessReagents?: Array<{
    compound: string
    excessAmount: number
    unit: string
  }>
  theoreticalYield?: {
    compound: string
    moles: number
    mass: number
    volume?: number
  }
  percentYield?: number
  heatReleased?: number // kJ
}

/**
 * Chemical Equation Balancing
 */
export interface BalancedEquation {
  original: string
  balanced: string
  coefficients: number[]
  reactants: string[]
  products: string[]
  isBalanced: boolean
  atoms: Record<string, { reactants: number; products: number }>
}

/**
 * Organic Chemistry
 */
export interface OrganicCompound extends Compound {
  functionalGroups: FunctionalGroup[]
  isomer?: 'structural' | 'geometric' | 'optical'
  chirality?: 'R' | 'S' | 'achiral'
  hybridization?: ('sp' | 'sp2' | 'sp3')[]
}

export type FunctionalGroup =
  | 'alkane'
  | 'alkene'
  | 'alkyne'
  | 'alcohol'
  | 'aldehyde'
  | 'ketone'
  | 'carboxylic-acid'
  | 'ester'
  | 'ether'
  | 'amine'
  | 'amide'
  | 'aromatic'
  | 'halide'

/**
 * Calculator Input/Output Types
 */
export interface MolarityCalculation {
  moles?: number
  volume?: number // L
  molarity?: number
  mass?: number // g
  molarMass?: number // g/mol
}

export interface DilutionCalculation {
  initialConcentration: number // M
  initialVolume?: number // mL
  finalConcentration?: number // M
  finalVolume?: number // mL
}

export interface pHCalculation {
  type: 'strong-acid' | 'strong-base' | 'weak-acid' | 'weak-base' | 'buffer'
  concentration: number // M
  Ka?: number
  Kb?: number
  pKa?: number
  pKb?: number
  pH?: number
  pOH?: number
  H_concentration?: number // M
  OH_concentration?: number // M
}

/**
 * Thermodynamic Calculations
 */
export interface ThermodynamicData {
  deltaH: number // kJ/mol
  deltaS: number // J/(mol·K)
  temperature: number // K
  deltaG?: number // kJ/mol
  equilibriumConstant?: number
  spontaneity?: 'spontaneous' | 'non-spontaneous' | 'at-equilibrium'
}

/**
 * Kinetics Calculations
 */
export interface KineticsData {
  order: 0 | 1 | 2
  rateConstant: number
  initialConcentration: number // M
  time?: number // s
  finalConcentration?: number // M
  halfLife?: number // s
}

/**
 * Redox Reaction
 */
export interface RedoxReaction {
  oxidation: HalfReaction
  reduction: HalfReaction
  overall: string
  cellPotential?: number // V
  spontaneous?: boolean
}

export interface HalfReaction {
  reactant: string
  product: string
  electrons: number
  standardPotential?: number // V
}

/**
 * Molecular Geometry (VSEPR)
 */
export interface MolecularGeometry {
  centralAtom: string
  bondingPairs: number
  lonePairs: number
  geometry: VSEPRGeometry
  bondAngle: number // degrees
  polarity: 'polar' | 'nonpolar'
  hybridization: string
}

export type VSEPRGeometry =
  | 'linear'
  | 'trigonal-planar'
  | 'tetrahedral'
  | 'trigonal-bipyramidal'
  | 'octahedral'
  | 'bent'
  | 'trigonal-pyramidal'
  | 'seesaw'
  | 'T-shaped'
  | 'square-planar'
  | 'square-pyramidal'

/**
 * API Response Types
 */
export interface CalculationResult<T> {
  success: boolean
  data?: T
  error?: string
  steps?: string[]
  formula?: string
  explanation?: string
}

/**
 * User Input Validation
 */
export interface ValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

/**
 * 3D Molecular Viewer Types
 */

// 3D Coordinates
export interface Vector3D {
  x: number
  y: number
  z: number
}

// Atom in 3D space
export interface Atom3D {
  element: string // Element symbol (e.g., 'C', 'H', 'O')
  position: Vector3D // 3D coordinates (Angstroms)
  index: number // Unique atom index
  formalCharge?: number // Formal charge
  color?: string // Display color
  radius?: number // Van der Waals radius for display
}

// Bond between two atoms
export interface Bond3D {
  atom1Index: number // Index of first atom
  atom2Index: number // Index of second atom
  order: 1 | 2 | 3 // Single, double, triple bond
  type: 'covalent' | 'ionic' | 'hydrogen' | 'coordinate'
}

// Complete 3D molecule structure
export interface Molecule3D {
  name: string
  formula: string
  atoms: Atom3D[]
  bonds: Bond3D[]
  geometry?: VSEPRGeometry
  bondAngles?: number[] // Key bond angles
  dipoleMoment?: number // Debye
  totalCharge: number
  metadata?: {
    description?: string
    uses?: string[]
    hazards?: string[]
  }
}

// 3D Viewer state
export interface ViewerState {
  rotation: {
    x: number // Rotation around x-axis (degrees)
    y: number // Rotation around y-axis (degrees)
    z: number // Rotation around z-axis (degrees)
  }
  zoom: number // Zoom level (1.0 = default)
  translation: {
    x: number // Pan x
    y: number // Pan y
  }
}

// Preset view angles
export type ViewAngle = 'front' | 'side' | 'top' | 'perspective'

// Display style
export type DisplayStyle = 'ball-stick' | 'space-filling' | 'wireframe' | 'stick'
