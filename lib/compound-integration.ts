// VerChem - Compound Database Integration Utilities
// Integration between compound database and existing calculators

import { Compound } from './types/chemistry'
import { searchCompoundsAdvanced } from './compound-search'
import { calculateMolecularMass, calculatePercentComposition } from './calculations/stoichiometry'
import { COMPREHENSIVE_COMPOUNDS } from './data/compounds-expanded'

/**
 * Enhanced compound data with calculated properties
 */
export interface EnhancedCompound extends Compound {
  calculatedProperties: {
    molecularMass: number
    percentComposition: Record<string, number>
    elementCount: Record<string, number>
    atomCount: number
    empiricalFormula: string
  }
}

/**
 * Integration with stoichiometry calculator
 */
export function getCompoundForStoichiometry(formula: string): EnhancedCompound | null {
  const compound = COMPREHENSIVE_COMPOUNDS.find(c => 
    c.formula.toLowerCase() === formula.toLowerCase()
  )
  
  if (!compound) return null
  
  return enhanceCompoundData(compound)
}

/**
 * Get compounds for limiting reagent calculations
 */
export function getCompoundsForReaction(reactants: string[]): EnhancedCompound[] {
  return reactants
    .map(formula => getCompoundForStoichiometry(formula))
    .filter((compound): compound is EnhancedCompound => compound !== null)
}

/**
 * Suggest reaction partners based on compound database
 */
export function suggestReactionPartners(compoundFormula: string): string[] {
  const compound = getCompoundForStoichiometry(compoundFormula)
  if (!compound) return []
  
  const suggestions: string[] = []
  
  // Acid-base reactions
  if (compound.pKa !== undefined) {
    if (compound.pKa < 7) {
      // Acid - suggest bases
      suggestions.push('NaOH', 'KOH', 'NH3', 'Ca(OH)2')
    } else if (compound.pKb !== undefined) {
      // Base - suggest acids
      suggestions.push('HCl', 'H2SO4', 'HNO3', 'CH3COOH')
    }
  }
  
  // Redox reactions
  if (isOxidizingAgent(compound)) {
    suggestions.push('H2', 'C', 'CO', 'Fe')
  }
  if (isReducingAgent(compound)) {
    suggestions.push('O2', 'Cl2', 'H2O2', 'KMnO4')
  }
  
  // Precipitation reactions
  if (isIonicCompound(compound)) {
    const counterIons = getCounterIons(compound)
    suggestions.push(...counterIons)
  }
  
  return [...new Set(suggestions)] // Remove duplicates
}

/**
 * Get thermodynamic data for compounds
 */
export function getThermodynamicData(formula: string): {
  deltaHf: number | null
  deltaGf: number | null
  S: number | null
  Cp: number | null
  temperature: number
} {
  const compound = getCompoundForStoichiometry(formula)
  
  if (!compound) {
    return {
      deltaHf: null,
      deltaGf: null,
      S: null,
      Cp: null,
      temperature: 298.15
    }
  }
  
  return {
    deltaHf: null,
    deltaGf: null,
    S: null,
    Cp: null,
    temperature: 298.15
  }
}

/**
 * Get solution properties for compounds
 */
export function getSolutionProperties(formula: string): {
  solubility: number | null
  Ksp: number | null // For sparingly soluble compounds
  Ka: number | null  // For acids
  Kb: number | null  // For bases
  pH: number | null  // For 0.1M solution
} {
  const compound = getCompoundForStoichiometry(formula)
  if (!compound) {
    return {
      solubility: null,
      Ksp: null,
      Ka: null,
      Kb: null,
      pH: null
    }
  }
  
  // Extract solubility data
  let solubility = null
  if (compound.solubility?.water) {
    const solText = compound.solubility.water
    const match = solText.match(/(\d+(?:\.\d+)?)\s*g\/L/)
    if (match) {
      solubility = parseFloat(match[1])
    }
  }
  
  // Calculate pH for 0.1M solution
  let pH = null
  if (compound.pKa !== undefined) {
    // Simple acid pH calculation
    const Ka = Math.pow(10, -compound.pKa)
    const concentration = 0.1
    const H_conc = Math.sqrt(Ka * concentration)
    pH = -Math.log10(H_conc)
  } else if (compound.pKb !== undefined) {
    // Simple base pH calculation
    const Kb = Math.pow(10, -compound.pKb)
    const Kw = 1e-14
    const Ka = Kw / Kb
    const concentration = 0.1
    const H_conc = Math.sqrt(Ka * concentration)
    pH = -Math.log10(H_conc)
  }
  
  return {
    solubility,
    Ksp: null, // Would need specific Ksp data
    Ka: compound.pKa ? Math.pow(10, -compound.pKa) : null,
    Kb: compound.pKb ? Math.pow(10, -compound.pKb) : null,
    pH
  }
}

/**
 * Get safety data for compounds
 */
export function getSafetyData(formula: string): {
  hazards: Array<{
    type: string
    severity: string
    description: string
    ghsCode?: string
  }>
  safetyPrecautions: string[]
  firstAid: string[]
  storage: string[]
} {
  const compound = getCompoundForStoichiometry(formula)
  if (!compound) {
    return {
      hazards: [],
      safetyPrecautions: [],
      firstAid: [],
      storage: []
    }
  }
  
  const hazards = compound.hazards || []
  
  // Generate safety recommendations based on hazards
  const safetyPrecautions = generateSafetyPrecautions(hazards)
  const firstAid = generateFirstAidInstructions(hazards)
  const storage = generateStorageInstructions(hazards, compound)
  
  return {
    hazards: hazards.map(h => ({
      type: h.type,
      severity: h.severity,
      description: h.description,
      ghsCode: h.ghsCode
    })),
    safetyPrecautions,
    firstAid,
    storage
  }
}

/**
 * Get compounds for specific applications
 */
export function getCompoundsByApplication(application: string): Compound[] {
  const appLower = application.toLowerCase()
  
  return COMPREHENSIVE_COMPOUNDS.filter(compound => 
    compound.uses?.some(use => 
      use.toLowerCase().includes(appLower)
    )
  )
}

/**
 * Get recommended compounds for educational demonstrations
 */
export function getEducationalCompounds(level: 'basic' | 'intermediate' | 'advanced'): Compound[] {
  const searchOptions = {
    hazardTypes: level === 'basic' ? ['flammable'] : undefined,
    limit: level === 'basic' ? 10 : level === 'intermediate' ? 15 : 20,
    sortBy: 'name' as const
  }
  
  // Filter by safety level
  let compounds = searchCompoundsAdvanced(searchOptions)
  
  if (level === 'basic') {
    // Only safe, common compounds
    compounds = compounds.filter(c => 
      !c.hazards?.some(h => 
        ['toxic', 'carcinogen', 'corrosive', 'explosive'].includes(h.type)
      )
    )
  } else if (level === 'intermediate') {
    // Allow some moderate hazards
    compounds = compounds.filter(c => 
      !c.hazards?.some(h => 
        ['toxic', 'carcinogen', 'explosive'].includes(h.type)
      )
    )
  }
  // Advanced level includes all compounds
  
  return compounds
}

/**
 * Batch process compounds for calculator integration
 */
export function batchProcessCompounds(formulas: string[]): {
  successful: EnhancedCompound[]
  failed: string[]
  errors: Record<string, string>
} {
  const successful: EnhancedCompound[] = []
  const failed: string[] = []
  const errors: Record<string, string> = {}
  
  formulas.forEach(formula => {
    try {
      const compound = getCompoundForStoichiometry(formula)
      if (compound) {
        successful.push(compound)
      } else {
        failed.push(formula)
        errors[formula] = 'Compound not found in database'
      }
    } catch (error) {
      failed.push(formula)
      errors[formula] = error instanceof Error ? error.message : 'Unknown error'
    }
  })
  
  return { successful, failed, errors }
}

/**
 * Export compound data for external use
 */
export function exportCompoundData(format: 'json' | 'csv' | 'tsv', compounds?: Compound[]): string {
  const data = compounds || COMPREHENSIVE_COMPOUNDS
  
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2)
    
    case 'csv':
      return convertToCSV(data)
    
    case 'tsv':
      return convertToTSV(data)
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Helper functions

function enhanceCompoundData(compound: Compound): EnhancedCompound {
  const molecularMass = calculateMolecularMass(compound.formula)
  const percentComposition = calculatePercentComposition(compound.formula)
  const elementCount = parseFormula(compound.formula)
  const atomCount = Object.values(elementCount).reduce((sum, count) => sum + count, 0)
  const empiricalFormula = generateEmpiricalFormula(elementCount)
  
  return {
    ...compound,
    calculatedProperties: {
      molecularMass,
      percentComposition,
      elementCount,
      atomCount,
      empiricalFormula
    }
  }
}

function parseFormula(formula: string): Record<string, number> {
  const elementCounts: Record<string, number> = {}
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match
  
  while ((match = regex.exec(formula)) !== null) {
    const element = match[1]
    const count = match[2] ? parseInt(match[2]) : 1
    elementCounts[element] = (elementCounts[element] || 0) + count
  }
  
  return elementCounts
}

function generateEmpiricalFormula(elementCount: Record<string, number>): string {
  // Find greatest common divisor
  const counts = Object.values(elementCount)
  const gcd = counts.reduce((a, b) => gcdTwoNumbers(a, b))
  
  // Generate empirical formula
  let formula = ''
  const elements = Object.keys(elementCount).sort()
  
  elements.forEach(element => {
    const count = elementCount[element] / gcd
    formula += element + (count > 1 ? count : '')
  })
  
  return formula
}

function gcdTwoNumbers(a: number, b: number): number {
  return b === 0 ? a : gcdTwoNumbers(b, a % b)
}

function isOxidizingAgent(compound: EnhancedCompound): boolean {
  const formula = compound.formula.toLowerCase()
  return formula.includes('o2') || formula.includes('cl2') || formula.includes('h2o2') || 
         formula.includes('mno4') || formula.includes('cro4') || formula.includes('no3')
}

function isReducingAgent(compound: EnhancedCompound): boolean {
  const formula = compound.formula.toLowerCase()
  return formula.includes('h2') || formula.includes('c') || formula.includes('co') || 
         formula.includes('fe') || formula.includes('sn')
}

function isIonicCompound(compound: EnhancedCompound): boolean {
  // Simple heuristic: contains common ions
  const formula = compound.formula.toLowerCase()
  const commonCations = ['na', 'k', 'ca', 'mg', 'fe', 'cu', 'zn', 'al', 'nh4']
  const commonAnions = ['cl', 'br', 'i', 'oh', 'no3', 'so4', 'co3', 'po4']
  
  return commonCations.some(cation => formula.includes(cation)) &&
         commonAnions.some(anion => formula.includes(anion))
}

function getCounterIons(compound: EnhancedCompound): string[] {
  const formula = compound.formula.toLowerCase()
  const counterIons: string[] = []
  
  if (formula.includes('na')) counterIons.push('Cl⁻', 'Br⁻', 'I⁻', 'OH⁻', 'NO₃⁻')
  if (formula.includes('k')) counterIons.push('Cl⁻', 'Br⁻', 'I⁻', 'OH⁻', 'NO₃⁻')
  if (formula.includes('ca')) counterIons.push('CO₃²⁻', 'SO₄²⁻', 'PO₄³⁻', 'OH⁻')
  if (formula.includes('cl')) counterIons.push('Na⁺', 'K⁺', 'Ca²⁺', 'Mg²⁺', 'Al³⁺')
  if (formula.includes('so4')) counterIons.push('Na⁺', 'K⁺', 'Ca²⁺', 'Mg²⁺', 'Al³⁺')
  
  return [...new Set(counterIons)]
}

function generateSafetyPrecautions(hazards: Array<{type: string, severity: string}>): string[] {
  const precautions: string[] = []
  
  if (hazards.some(h => h.type === 'flammable')) {
    precautions.push('Keep away from heat, sparks, and open flames')
    precautions.push('Use in well-ventilated area')
  }
  
  if (hazards.some(h => h.type === 'corrosive')) {
    precautions.push('Wear protective gloves and eye protection')
    precautions.push('Use in fume hood')
  }
  
  if (hazards.some(h => h.type === 'toxic')) {
    precautions.push('Avoid breathing vapors')
    precautions.push('Use only in chemical fume hood')
    precautions.push('Wear appropriate respiratory protection')
  }
  
  if (hazards.some(h => h.type === 'oxidizer')) {
    precautions.push('Keep away from combustible materials')
    precautions.push('Store separately from reducing agents')
  }
  
  return precautions
}

function generateFirstAidInstructions(hazards: Array<{type: string, severity: string}>): string[] {
  const instructions: string[] = []
  
  instructions.push('IF INHALED: Remove to fresh air and keep at rest')
  instructions.push('IF ON SKIN: Wash with plenty of soap and water')
  instructions.push('IF IN EYES: Rinse cautiously with water for several minutes')
  instructions.push('IF SWALLOWED: Rinse mouth, do NOT induce vomiting')
  
  if (hazards.some(h => h.severity === 'extreme')) {
    instructions.push('Get immediate medical attention')
  } else {
    instructions.push('Seek medical advice if symptoms persist')
  }
  
  return instructions
}

function generateStorageInstructions(hazards: Array<{type: string, severity: string}>, compound: Compound): string[] {
  const instructions: string[] = []
  
  instructions.push('Store in tightly closed container')
  instructions.push('Store in cool, dry, well-ventilated place')
  
  if (hazards.some(h => h.type === 'flammable')) {
    instructions.push('Store away from ignition sources')
    instructions.push('Keep container tightly closed and away from heat')
  }
  
  if (hazards.some(h => h.type === 'oxidizer')) {
    instructions.push('Store separately from reducing agents and organic materials')
  }
  
  if (compound.meltingPoint !== undefined && compound.meltingPoint < 0) {
    instructions.push('Protect from freezing')
  }
  
  if (compound.boilingPoint !== undefined && compound.boilingPoint < 50) {
    instructions.push('Store in refrigerator or cool place')
  }
  
  return instructions
}

function convertToCSV(compounds: Compound[]): string {
  const headers = ['ID', 'Name', 'Formula', 'Molecular Mass', 'CAS', 'Melting Point', 'Boiling Point', 'Density', 'Solubility', 'Uses']
  const rows = compounds.map(compound => [
    compound.id,
    compound.name,
    compound.formula,
    compound.molecularMass,
    compound.cas || '',
    compound.meltingPoint || '',
    compound.boilingPoint || '',
    compound.density || '',
    compound.solubility?.water || '',
    compound.uses?.join(';') || ''
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

function convertToTSV(compounds: Compound[]): string {
  const headers = ['ID', 'Name', 'Formula', 'Molecular Mass', 'CAS', 'Melting Point', 'Boiling Point', 'Density', 'Solubility', 'Uses']
  const rows = compounds.map(compound => [
    compound.id,
    compound.name,
    compound.formula,
    compound.molecularMass,
    compound.cas || '',
    compound.meltingPoint || '',
    compound.boilingPoint || '',
    compound.density || '',
    compound.solubility?.water || '',
    compound.uses?.join(';') || ''
  ])
  
  return [headers, ...rows].map(row => row.join('\t')).join('\n')
}
