import { calculateMolarMass } from './utils'

export type PhysicalState = 'solid' | 'liquid' | 'gas'

export type MolarMassBasis = 'formula' | 'repeat-unit' | 'mixture-average' | 'not-applicable'

/**
 * `curated-partial` never means a complete SDS. `not-curated` means VerChem
 * currently publishes no reviewed classification for this record; it must not
 * be interpreted as evidence that the substance is safe.
 */
export type SafetyDataStatus = 'curated-partial' | 'not-curated'

export type CompoundCategory =
  | 'acid'
  | 'base'
  | 'salt'
  | 'oxide'
  | 'hydrocarbon'
  | 'alcohol'
  | 'carboxylic-acid'
  | 'ketone'
  | 'aldehyde'
  | 'ester'
  | 'amine'
  | 'amide'
  | 'aromatic'
  | 'amino-acid'
  | 'sugar'
  | 'industrial'
  | 'pharmaceutical'
  | 'reagent'
  | 'polymer'
  | 'vitamin'
  | 'nucleotide'
  | 'pollutant'
  | 'semiconductor'
  | 'superconductor'
  | 'natural-product'
  | 'solvent'
  | 'water-treatment'
  | 'other'
  // Extended categories for comprehensive database
  | 'carbon'
  | 'metalloid'
  | 'metal'
  | 'alloy'
  | 'ceramic'
  | 'glass'
  | 'sulfide'
  | 'silicate'
  | 'hydroxide'
  | 'anhydride'
  | 'nitrile'
  | 'isocyanate'
  | 'halogenated-hydrocarbon'
  | 'ether'
  | 'phenol'
  | 'dye'
  | 'surfactant'
  | 'terpenoid'
  | 'glycoside'
  | 'complex'
  | 'quinone'
  | 'polysaccharide'

export interface Compound {
  id: string
  name: string
  nameThai?: string
  iupacName?: string
  formula: string
  /**
   * Canonical SMILES for molecular (covalent) compounds.
   * Populated from the curated, RDKit-verified library in `smiles-data.ts`
   * and merged in `index.ts`. Undefined for ionic / metallic / network
   * solids where a discrete SMILES is not chemically meaningful.
   * Every value is cross-checked against `formula` at test time
   * (see __tests__/compound-smiles-verification.test.ts).
   */
  smiles?: string
  /**
   * Molar mass in g/mol when this record represents a fixed formula, reviewed
   * repeat unit, or reviewed mixture average. `null` means that one molar mass
   * is not chemically defined for this variable-composition material.
   */
  molarMass: number | null
  molecularMass?: number | null // legacy alias
  /** How molarMass is defined for fixed formulae, polymers and mixtures. */
  molarMassBasis?: MolarMassBasis
  casNumber?: string
  cas?: string // legacy alias
  /** Component identifiers for mixtures that do not have one CAS RN. */
  componentCasNumbers?: string[]
  category: CompoundCategory
  subcategory?: string // finer classification
  physicalState: PhysicalState
  meltingPoint?: number
  boilingPoint?: number
  density?: number
  solubility?: string | { water?: string; ethanol?: string; other?: Record<string, string> }
  appearance?: string
  odor?: string
  pKa?: number
  pKb?: number
  hazards?: Array<string | { type?: string; ghsCode?: string; severity?: string }>
  ghs?: string[] // GHS pictogram codes (GHS01-GHS09)
  safetyDataStatus?: SafetyDataStatus
  uses?: string[]
}

export function getSafetyDataStatus(compound: Pick<Compound, 'hazards' | 'ghs'>): SafetyDataStatus {
  return (compound.hazards?.length ?? 0) > 0 || (compound.ghs?.length ?? 0) > 0
    ? 'curated-partial'
    : 'not-curated'
}

export function withMolarMass<T extends Omit<Compound, 'molarMass'>>(
  compound: T,
  fallbackFormula?: string
): Compound {
  const mass = calculateMolarMass(compound.formula) ?? (fallbackFormula ? calculateMolarMass(fallbackFormula) : undefined)
  return {
    ...compound,
    molarMass: mass ?? null,
    molecularMass: mass ?? null,
    cas: compound.cas ?? compound.casNumber,
    safetyDataStatus: getSafetyDataStatus(compound),
  }
}

export type CompoundWithApplicableMolarMass = Compound & {
  molarMass: number
  molecularMass: number
  molarMassBasis: Exclude<MolarMassBasis, 'not-applicable'>
}

/**
 * Single gate for every numerical molar-mass consumer. Checking the basis is
 * intentional: a historical `0` sentinel must never become a real mass again.
 */
export function hasApplicableMolarMass(
  compound: Compound
): compound is CompoundWithApplicableMolarMass {
  const hasReviewedBasis = compound.molarMassBasis === 'formula' ||
    compound.molarMassBasis === 'repeat-unit' ||
    compound.molarMassBasis === 'mixture-average'
  return hasReviewedBasis &&
    typeof compound.molarMass === 'number' &&
    Number.isFinite(compound.molarMass) &&
    compound.molarMass > 0 &&
    typeof compound.molecularMass === 'number' &&
    Number.isFinite(compound.molecularMass) &&
    compound.molecularMass > 0
}

export type CompoundWithFormulaMolarMass = CompoundWithApplicableMolarMass & {
  molarMassBasis: 'formula' | 'repeat-unit'
}

/** Formula calculators cannot interpret a reviewed mixture-average as one molecule. */
export function hasFormulaMolarMass(
  compound: Compound
): compound is CompoundWithFormulaMolarMass {
  return hasApplicableMolarMass(compound) &&
    (compound.molarMassBasis === 'formula' || compound.molarMassBasis === 'repeat-unit')
}
