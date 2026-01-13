import { calculateMolarMass } from './utils'

export type PhysicalState = 'solid' | 'liquid' | 'gas'

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
  molarMass: number
  molecularMass?: number // legacy alias
  casNumber?: string
  cas?: string // legacy alias
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
  hazards?: string[] | Array<{ type?: string; ghsCode?: string; severity?: string }>
  ghs?: string[] // GHS pictogram codes (GHS01-GHS09)
  uses?: string[]
}

export function withMolarMass<T extends Omit<Compound, 'molarMass'>>(
  compound: T,
  fallbackFormula?: string
): Compound {
  const mass = calculateMolarMass(compound.formula) ?? (fallbackFormula ? calculateMolarMass(fallbackFormula) : undefined)
  return {
    ...compound,
    molarMass: mass ?? 0,
    molecularMass: mass ?? 0,
    cas: compound.cas ?? compound.casNumber,
  }
}
