// VerChem - Advanced Compound Search and Analysis Utilities
// Comprehensive search, filtering, and analysis functions for 500+ compounds

import { Compound } from './types/chemistry'
import { COMPREHENSIVE_COMPOUNDS, COMPOUND_STATISTICS } from './data/compounds'

/**
 * Advanced search options interface
 */
export interface SearchOptions {
  query?: string
  category?: string[]
  molecularMassRange?: [number, number]
  meltingPointRange?: [number, number]
  boilingPointRange?: [number, number]
  densityRange?: [number, number]
  solubility?: string
  hazardTypes?: string[]
  functionalGroups?: string[]
  hasThermodynamicData?: boolean
  limit?: number
  sortBy?: 'name' | 'molecularMass' | 'boilingPoint' | 'meltingPoint' | 'density'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Structure search options
 */
export interface StructureSearchOptions {
  smiles?: string
  inchi?: string
  substructure?: string
  similarityThreshold?: number // 0-1
  maxResults?: number
}

/**
 * Property filter options
 */
export interface PropertyFilter {
  property: 'molecularMass' | 'meltingPoint' | 'boilingPoint' | 'density' | 'pKa' | 'pKb'
  operator: '>' | '<' | '>=' | '<=' | '==' | 'between'
  value: number | [number, number]
}

/**
 * Search compounds with advanced filtering
 */
export function searchCompoundsAdvanced(options: SearchOptions): Compound[] {
  let results = [...COMPREHENSIVE_COMPOUNDS]

  // Text search
  if (options.query) {
    const query = options.query.toLowerCase()
    results = results.filter(compound => 
      compound.name.toLowerCase().includes(query) ||
      compound.formula.toLowerCase().includes(query) ||
      compound.iupacName?.toLowerCase().includes(query) ||
      compound.nameThai?.toLowerCase().includes(query) ||
      compound.uses?.some(use => use.toLowerCase().includes(query)) ||
      compound.cas?.includes(query) ||
      compound.casNumber?.includes(query)
    )
  }

  // Category filter
  if (options.category && options.category.length > 0) {
    results = results.filter(compound => {
      const compoundCategory = getCompoundCategory(compound)
      return options.category!.includes(compoundCategory)
    })
  }

  // Molecular mass range
  if (options.molecularMassRange) {
    const [min, max] = options.molecularMassRange
    results = results.filter(compound => 
      (compound.molecularMass ?? compound.molarMass) >= min && (compound.molecularMass ?? compound.molarMass) <= max
    )
  }

  // Physical property ranges
  if (options.meltingPointRange) {
    const [min, max] = options.meltingPointRange
    results = results.filter(compound => 
      compound.meltingPoint !== undefined && 
      compound.meltingPoint >= min && compound.meltingPoint <= max
    )
  }

  if (options.boilingPointRange) {
    const [min, max] = options.boilingPointRange
    results = results.filter(compound => 
      compound.boilingPoint !== undefined && 
      compound.boilingPoint >= min && compound.boilingPoint <= max
    )
  }

  if (options.densityRange) {
    const [min, max] = options.densityRange
    results = results.filter(compound => 
      compound.density !== undefined && 
      compound.density >= min && compound.density <= max
    )
  }

  // Solubility filter
  if (options.solubility) {
    results = results.filter(compound => {
      if (!compound.solubility) return false
      const solubilityValue =
        typeof compound.solubility === 'string'
          ? compound.solubility.toLowerCase()
          : compound.solubility.water?.toLowerCase() || ''
      return solubilityValue.includes(options.solubility!.toLowerCase())
    })
  }

  // Hazard filter
  if (options.hazardTypes && options.hazardTypes.length > 0) {
    results = results.filter(compound => {
      if (!compound.hazards) return false
      const hazardEntries = compound.hazards.map(h =>
        typeof h === 'string' ? h.toLowerCase() : (h.type || h.ghsCode || '').toLowerCase()
      )
      return hazardEntries.some(code => options.hazardTypes!.some(h => code.includes(h.toLowerCase())))
    })
  }

  // Sort results
  if (options.sortBy) {
    results.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (options.sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'molecularMass':
          aValue = a.molecularMass ?? a.molarMass
          bValue = b.molecularMass ?? b.molarMass
          break
        case 'boilingPoint':
          aValue = a.boilingPoint || 0
          bValue = b.boilingPoint || 0
          break
        case 'meltingPoint':
          aValue = a.meltingPoint || 0
          bValue = b.meltingPoint || 0
          break
        case 'density':
          aValue = a.density || 0
          bValue = b.density || 0
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return options.sortOrder === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue)
      } else {
        return options.sortOrder === 'desc' 
          ? (bValue as number) - (aValue as number)
          : (aValue as number) - (bValue as number)
      }
    })
  }

  // Apply limit
  if (options.limit) {
    results = results.slice(0, options.limit)
  }

  return results
}

/**
 * Filter compounds by specific properties
 */
export function filterByProperty(filters: PropertyFilter[]): Compound[] {
  let results = [...COMPREHENSIVE_COMPOUNDS]

  for (const filter of filters) {
    results = results.filter(compound => {
      const value = compound[filter.property]
      if (value === undefined) return false

      switch (filter.operator) {
        case '>':
          return typeof filter.value === 'number' && value > filter.value
        case '<':
          return typeof filter.value === 'number' && value < filter.value
        case '>=':
          return typeof filter.value === 'number' && value >= filter.value
        case '<=':
          return typeof filter.value === 'number' && value <= filter.value
        case '==':
          return value === filter.value
        case 'between':
          const [min, max] = Array.isArray(filter.value) ? filter.value : [filter.value, filter.value]
          return value >= min && value <= max
        default:
          return true
      }
    })
  }

  return results
}

/**
 * Find compounds by molecular formula (exact match or pattern)
 */
export function findByFormula(formula: string, exactMatch: boolean = true): Compound[] {
  const searchFormula = formula.toLowerCase()
  
  if (exactMatch) {
    return COMPREHENSIVE_COMPOUNDS.filter(compound => 
      compound.formula.toLowerCase() === searchFormula
    )
  } else {
    return COMPREHENSIVE_COMPOUNDS.filter(compound => 
      compound.formula.toLowerCase().includes(searchFormula)
    )
  }
}

/**
 * Find compounds by element composition
 */
export function findByElementComposition(elements: string[]): Compound[] {
  return COMPREHENSIVE_COMPOUNDS.filter(compound => {
    const formula = compound.formula.toLowerCase()
    return elements.every(element => 
      formula.includes(element.toLowerCase())
    )
  })
}

/**
 * Get compounds by hazard type
 */
export function getCompoundsByHazard(hazardType: string): Compound[] {
  const target = hazardType.toLowerCase()
  return COMPREHENSIVE_COMPOUNDS.filter(compound =>
    compound.hazards?.some(hazard => {
      const code = typeof hazard === 'string' ? hazard.toLowerCase() : (hazard.type || hazard.ghsCode || '').toLowerCase()
      return code.includes(target)
    })
  )
}

/**
 * Get compounds by functional group (for organic compounds)
 */
export function getCompoundsByFunctionalGroup(functionalGroup: string): Compound[] {
  return COMPREHENSIVE_COMPOUNDS.filter(compound => {
    // Simple heuristic based on formula patterns
    const formula = compound.formula.toLowerCase()
    
    switch (functionalGroup.toLowerCase()) {
      case 'alcohol':
        return formula.includes('oh') && !formula.includes('cooh')
      case 'aldehyde':
        return formula.includes('cho')
      case 'ketone':
        return formula.includes('co') && !formula.includes('cho') && !formula.includes('cooh')
      case 'carboxylic-acid':
        return formula.includes('cooh')
      case 'ester':
        return formula.includes('coo') && !formula.includes('cooh')
      case 'ether':
        return formula.includes('och') || formula.includes('oc')
      case 'amine':
        return formula.includes('nh') || formula.includes('n')
      case 'aromatic':
        return formula.includes('c6h') || compound.name.toLowerCase().includes('benz')
      case 'alkene':
        return formula.includes('c=c') || (formula.match(/c\d+h\d+/) && compound.name.toLowerCase().includes('ene'))
      case 'alkyne':
        return formula.includes('c≡c') || compound.name.toLowerCase().includes('yne')
      default:
        return false
    }
  })
}

/**
 * Get similar compounds based on molecular mass similarity
 */
export function findSimilarCompounds(compound: Compound, threshold: number = 0.1): Compound[] {
  const baseMass = compound.molecularMass ?? compound.molarMass
  const massRange = baseMass * threshold
  const minMass = baseMass - massRange
  const maxMass = baseMass + massRange

  return COMPREHENSIVE_COMPOUNDS.filter(c => 
    c.id !== compound.id &&
    (c.molecularMass ?? c.molarMass) >= minMass &&
    (c.molecularMass ?? c.molarMass) <= maxMass
  )
}

/**
 * Get compounds in specific physical state at given temperature
 */
export function getCompoundsByState(temperature: number = 25): {
  solids: Compound[]
  liquids: Compound[]
  gases: Compound[]
} {
  const solids: Compound[] = []
  const liquids: Compound[] = []
  const gases: Compound[] = []

  COMPREHENSIVE_COMPOUNDS.forEach(compound => {
    if (compound.meltingPoint === undefined || compound.boilingPoint === undefined) {
      return // Skip if data incomplete
    }

    if (temperature < compound.meltingPoint) {
      solids.push(compound)
    } else if (temperature > compound.boilingPoint) {
      gases.push(compound)
    } else {
      liquids.push(compound)
    }
  })

  return { solids, liquids, gases }
}

/**
 * Get compounds with specific solubility characteristics
 */
export function getCompoundsBySolubility(solubilityType: 'soluble' | 'insoluble' | 'miscible', solvent: string = 'water'): Compound[] {
  return COMPREHENSIVE_COMPOUNDS.filter(compound => {
    if (!compound.solubility) return false

    const solubilityValue =
      typeof compound.solubility === 'string'
        ? compound.solubility
        : compound.solubility[solvent as keyof typeof compound.solubility]
    if (!solubilityValue || typeof solubilityValue !== 'string') return false

    const solText = solubilityValue.toLowerCase()
    
    switch (solubilityType) {
      case 'miscible':
        return solText.includes('miscible')
      case 'soluble':
        return solText.includes('soluble') || solText.includes('miscible') || 
               (solText.includes('g/l') && !solText.includes('mg/l')) ||
               (solText.includes('g/100ml'))
      case 'insoluble':
        return solText.includes('insoluble') || 
               (solText.includes('mg/l') && parseFloat(solText) < 100) ||
               solText.includes('insoluble')
      default:
        return false
    }
  })
}

/**
 * Calculate molecular similarity using simple fingerprint approach
 */
export function calculateMolecularSimilarity(compound1: Compound, compound2: Compound): number {
  // Simple similarity based on element composition and molecular mass
  const formula1 = compound1.formula.toLowerCase()
  const formula2 = compound2.formula.toLowerCase()
  
  // Extract elements from formulas
  const elements1 = extractElements(formula1)
  const elements2 = extractElements(formula2)
  
  // Calculate element similarity
  const commonElements = elements1.filter(el => elements2.includes(el))
  const totalElements = [...new Set([...elements1, ...elements2])]
  const elementSimilarity = commonElements.length / totalElements.length
  
  // Calculate mass similarity
  const massA = compound1.molecularMass ?? compound1.molarMass
  const massB = compound2.molecularMass ?? compound2.molarMass
  const massDiff = Math.abs(massA - massB)
  const massSimilarity = 1 - (massDiff / Math.max(massA, massB))
  
  // Combined similarity (weighted average)
  return (elementSimilarity * 0.6 + massSimilarity * 0.4)
}

/**
 * Get database statistics
 */
export function getDatabaseStatistics() {
  return {
    ...COMPOUND_STATISTICS,
    hazardDistribution: getHazardDistribution(),
    solubilityDistribution: getSolubilityDistribution(),
    physicalStateDistribution: getPhysicalStateDistribution(),
    functionalGroupDistribution: getFunctionalGroupDistribution()
  }
}

/**
 * Get compound by ID
 */
export function getCompoundById(id: string): Compound | undefined {
  return COMPREHENSIVE_COMPOUNDS.find(compound => compound.id === id)
}

/**
 * Get random compounds for testing/demos
 */
export function getRandomCompounds(count: number = 5): Compound[] {
  const shuffled = [...COMPREHENSIVE_COMPOUNDS].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Validate compound data
 */
export function validateCompoundData(compound: Partial<Compound>): string[] {
  const errors: string[] = []

  if (!compound.id) errors.push('ID is required')
  if (!compound.name) errors.push('Name is required')
  if (!compound.formula) errors.push('Formula is required')
  const massValue = compound.molecularMass ?? compound.molarMass
  if (massValue === undefined || Number(massValue) <= 0) {
    errors.push('Valid molecular mass is required')
  }

  // Validate formula format (basic check)
  if (compound.formula && !isValidFormula(compound.formula)) {
    errors.push('Invalid formula format')
  }

  return errors
}

// Helper functions

function getCompoundCategory(compound: Compound): string {
  // Determine category based on formula and name patterns
  const formula = compound.formula.toLowerCase()
  const name = compound.name.toLowerCase()
  
  if (formula.includes('c') && formula.includes('h')) {
    if (name.includes('methane') || name.includes('ethane') || name.includes('propane')) return 'alkanes'
    if (name.includes('ethylene') || name.includes('propylene') || name.includes('butene')) return 'alkenes'
    if (name.includes('acetylene') || name.includes('ethyne') || name.includes('propyne')) return 'alkynes'
    if (name.includes('benzene') || name.includes('toluene') || name.includes('xylene')) return 'aromatics'
    if (formula.includes('oh') && !formula.includes('cooh')) return 'alcohols'
    if (formula.includes('cho')) return 'aldehydes'
    if (formula.includes('coo') && !formula.includes('cooh')) return 'esters'
    if (formula.includes('cooh')) return 'carboxylic-acids'
    if (formula.includes('co') && !formula.includes('cho')) return 'ketones'
    if (formula.includes('och') || formula.includes('oc')) return 'ethers'
    if (formula.includes('nh')) return 'amines'
    return 'organic-other'
  } else {
    if (formula.includes('h') && (formula.includes('cl') || formula.includes('br') || formula.includes('i'))) return 'hydrohalic-acids'
    if (formula.includes('oh')) return 'hydroxides'
    if (formula.includes('co3')) return 'carbonates'
    if (formula.includes('so4') || formula.includes('so3')) return 'sulfates'
    if (formula.includes('no3') || formula.includes('no2')) return 'nitrates'
    if (formula.includes('po4')) return 'phosphates'
    return 'inorganic-other'
  }
}

function extractElements(formula: string): string[] {
  const elementPattern = /([A-Z][a-z]?)(\d*)/g
  const elements: string[] = []
  let match
  
  while ((match = elementPattern.exec(formula)) !== null) {
    elements.push(match[1])
  }
  
  return [...new Set(elements)] // Remove duplicates
}

function isValidFormula(formula: string): boolean {
  // Basic formula validation
  const formulaPattern = /^([A-Z][a-z]?\d*)+$/
  return formulaPattern.test(formula.replace(/[()]/g, ''))
}

function getHazardDistribution() {
  const distribution: Record<string, number> = {}
  
  COMPREHENSIVE_COMPOUNDS.forEach(compound => {
    if (compound.hazards) {
      compound.hazards.forEach(hazard => {
        const key = typeof hazard === 'string' ? hazard : hazard.type || hazard.ghsCode || 'other'
        distribution[key] = (distribution[key] || 0) + 1
      })
    }
  })
  
  return distribution
}

function getSolubilityDistribution() {
  const distribution = {
    miscible: 0,
    soluble: 0,
    sparingly: 0,
    insoluble: 0,
    unknown: 0
  }
  
  COMPREHENSIVE_COMPOUNDS.forEach(compound => {
    if (!compound.solubility) {
      distribution.unknown++
      return
    }

    const solString =
      typeof compound.solubility === 'string'
        ? compound.solubility.toLowerCase()
        : compound.solubility.water?.toLowerCase()

    if (!solString) {
      distribution.unknown++
      return
    }

    const sol = solString
    if (sol.includes('miscible')) {
      distribution.miscible++
    } else if (sol.includes('insoluble')) {
      distribution.insoluble++
    } else if (sol.includes('mg/l') || sol.includes('μg/l')) {
      distribution.sparingly++
    } else {
      distribution.soluble++
    }
  })
  
  return distribution
}

function getPhysicalStateDistribution() {
  const { solids, liquids, gases } = getCompoundsByState(25)
  
  return {
    solids: solids.length,
    liquids: liquids.length,
    gases: gases.length,
    unknown: COMPREHENSIVE_COMPOUNDS.length - solids.length - liquids.length - gases.length
  }
}

function getFunctionalGroupDistribution() {
  const groups = ['alcohol', 'aldehyde', 'ketone', 'carboxylic-acid', 'ester', 'ether', 'amine', 'aromatic', 'alkene', 'alkyne']
  const distribution: Record<string, number> = {}
  
  groups.forEach(group => {
    distribution[group] = getCompoundsByFunctionalGroup(group).length
  })
  
  return distribution
}
