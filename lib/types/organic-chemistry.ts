/**
 * Organic Chemistry Types
 * Complete type definitions for functional groups, reactions, mechanisms
 */

// ============================================
// Functional Groups
// ============================================

export type FunctionalGroupCategory =
  | 'hydrocarbon'
  | 'oxygen-containing'
  | 'nitrogen-containing'
  | 'sulfur-containing'
  | 'halogen-containing'
  | 'phosphorus-containing'
  | 'carbonyl-derived'

export type Priority = 'high' | 'medium' | 'low'

export interface FunctionalGroup {
  id: string
  name: string
  category: FunctionalGroupCategory
  generalFormula: string
  /** SMARTS-like notation for the functional group */
  pattern: string
  /** Simple text representation */
  structure: string
  description: string
  properties: {
    polarity: 'nonpolar' | 'slightly polar' | 'polar' | 'very polar'
    hBondDonor: boolean
    hBondAcceptor: boolean
    typicalBoilingPoint: string
    solubility: string
    acidity: string
  }
  examples: Array<{
    name: string
    formula: string
    iupac: string
  }>
  /** Reactions this group typically undergoes */
  commonReactions: string[]
  /** How to identify in IR/NMR */
  spectroscopy: {
    ir?: string
    nmrH?: string
    nmrC?: string
  }
  /** Study priority for students */
  priority: Priority
  /** Related functional groups */
  relatedGroups: string[]
}

// ============================================
// Named Reactions
// ============================================

export type ReactionCategory =
  | 'addition'
  | 'elimination'
  | 'substitution'
  | 'oxidation'
  | 'reduction'
  | 'rearrangement'
  | 'condensation'
  | 'coupling'
  | 'cycloaddition'
  | 'protection'
  | 'pericyclic'
  | 'radical'
  | 'multicomponent'

export type DifficultyLevel = 'introductory' | 'intermediate' | 'advanced'

export interface MechanismStep {
  step: number
  description: string
  /** Arrow notation: "nucleophilic attack", "proton transfer", "elimination", etc. */
  arrowType: 'curved' | 'fishhook' | 'equilibrium' | 'retro'
  intermediateFormula?: string
  notes?: string
}

export interface NamedReaction {
  id: string
  name: string
  altNames?: string[]
  year?: number
  discoverer?: string
  category: ReactionCategory
  subcategory?: string
  difficulty: DifficultyLevel

  /** General reaction scheme */
  generalScheme: {
    reactants: string[]
    reagents: string[]
    conditions: string[]
    products: string[]
  }

  /** Equation as text: "R-X + Mg → R-MgX" */
  equation: string

  description: string
  /** Step-by-step mechanism */
  mechanism: MechanismStep[]
  /** Key points to remember */
  keyPoints: string[]

  /** Specific examples */
  examples: Array<{
    reactant: string
    product: string
    reagent: string
    yield?: string
  }>

  /** What this reaction is useful for */
  syntheticUtility: string
  /** Limitations and side reactions */
  limitations: string[]
  /** Functional groups involved */
  functionalGroups: string[]
  /** Tags for search */
  tags: string[]
  /** Related named reactions */
  relatedReactions: string[]
}

// ============================================
// Reagent Database
// ============================================

export interface Reagent {
  id: string
  name: string
  formula: string
  type: 'oxidizing' | 'reducing' | 'acid' | 'base' | 'catalyst' | 'other'
  description: string
  commonUses: string[]
  /** Safety notes */
  hazards?: string[]
}

// ============================================
// Reaction Prediction
// ============================================

export interface ReactionPrediction {
  inputGroup: string
  reagent: string
  conditions: string
  productGroup: string
  productDescription: string
  reactionName?: string
  mechanism: string
  confidence: 'definite' | 'likely' | 'possible'
}

export interface PredictionRule {
  /** Source functional group ID */
  fromGroup: string
  /** Reagent or conditions */
  reagent: string
  reagentLabel: string
  /** Result functional group ID */
  toGroup: string
  /** The named reaction if applicable */
  reactionName?: string
  /** Mechanism type */
  mechanismType: string
  /** Brief explanation */
  explanation: string
  /** Selectivity notes */
  selectivity?: string
}

// ============================================
// Nomenclature
// ============================================

export interface NomenclaturePrefix {
  carbon: number
  prefix: string
}

export interface NomenclatureSuffix {
  group: string
  suffix: string
  prefix: string
}
