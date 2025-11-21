// VerChem - Stoichiometry Calculations
// Mole conversions, limiting reagent, theoretical yield

import { getElementBySymbol } from '../data/periodic-table'
import { AVOGADRO_CONSTANT, STP } from '../constants'

/**
 * Calculate molecular mass from formula
 * Example: "H2O" -> 18.015 g/mol
 */
export function calculateMolecularMass(formula: string): number {
  let mass = 0

  // Handle parentheses: Ca(OH)2
  formula = expandParentheses(formula)

  // Match element and number: H2, C, O3
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match

  while ((match = regex.exec(formula)) !== null) {
    const symbol = match[1]
    const count = match[2] ? parseInt(match[2]) : 1

    const element = getElementBySymbol(symbol)
    if (element) {
      mass += element.atomicMass * count
    }
  }

  return Math.round(mass * 1000) / 1000 // 3 decimal places
}

/**
 * Expand parentheses in formula
 */
function expandParentheses(formula: string): string {
  const regex = /\(([^)]+)\)(\d*)/g

  while (regex.test(formula)) {
    formula = formula.replace(regex, (match, group, multiplier) => {
      const mult = multiplier ? parseInt(multiplier) : 1
      const expanded = group.replace(/([A-Z][a-z]?)(\d*)/g, (m: string, el: string, count: string) => {
        const c = count ? parseInt(count) : 1
        return el + (c * mult)
      })
      return expanded
    })
  }

  return formula
}

/**
 * Convert mass to moles
 */
export function massToMoles(mass: number, molarMass: number): number {
  return mass / molarMass
}

/**
 * Convert moles to mass
 */
export function molesToMass(moles: number, molarMass: number): number {
  return moles * molarMass
}

/**
 * Convert moles to molecules
 */
export function molesToMolecules(moles: number): number {
  return moles * AVOGADRO_CONSTANT
}

/**
 * Convert molecules to moles
 */
export function moleculesToMoles(molecules: number): number {
  return molecules / AVOGADRO_CONSTANT
}

/**
 * Convert moles of gas to volume at STP
 * STP: 273.15 K, 1 atm (101.325 kPa)
 * Using CODATA 2018 precise value
 */
export function molesToVolumeSTP(moles: number): number {
  return moles * STP.molarVolume
}

/**
 * Convert volume at STP to moles
 */
export function volumeSTPToMoles(volume: number): number {
  return volume / STP.molarVolume
}

/**
 * Calculate percent composition
 */
export function calculatePercentComposition(formula: string): Record<string, number> {
  const totalMass = calculateMolecularMass(formula)
  const composition: Record<string, number> = {}

  // Parse elements
  formula = expandParentheses(formula)
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match

  const elementCounts: Record<string, number> = {}

  while ((match = regex.exec(formula)) !== null) {
    const symbol = match[1]
    const count = match[2] ? parseInt(match[2]) : 1
    elementCounts[symbol] = (elementCounts[symbol] || 0) + count
  }

  // Calculate percentages
  Object.entries(elementCounts).forEach(([symbol, count]) => {
    const element = getElementBySymbol(symbol)
    if (element) {
      const elementMass = element.atomicMass * count
      composition[symbol] = Math.round((elementMass / totalMass * 100) * 100) / 100
    }
  })

  return composition
}

/**
 * Calculate empirical formula from percent composition
 */
export function calculateEmpiricalFormula(
  composition: Record<string, number>
): string {
  // Convert percentages to moles
  const moles: Record<string, number> = {}

  Object.entries(composition).forEach(([symbol, percent]) => {
    const element = getElementBySymbol(symbol)
    if (element) {
      moles[symbol] = percent / element.atomicMass
    }
  })

  // Find smallest mole value
  const smallest = Math.min(...Object.values(moles))

  // Divide all by smallest
  const ratios: Record<string, number> = {}
  Object.entries(moles).forEach(([symbol, mol]) => {
    ratios[symbol] = mol / smallest
  })

  // Find a multiplier (up to 6) that turns all ratios into whole numbers within tolerance
  const tolerance = 0.02
  let multiplier = 1
  const ratioValues = Object.values(ratios)
  for (let m = 1; m <= 6; m++) {
    const allIntegers = ratioValues.every(value =>
      Math.abs(value * m - Math.round(value * m)) < tolerance
    )
    if (allIntegers) {
      multiplier = m
      break
    }
  }

  const scaled: Record<string, number> = {}
  Object.entries(ratios).forEach(([symbol, ratio]) => {
    const scaledValue = ratio * multiplier
    scaled[symbol] = Math.max(1, Math.round(scaledValue))
  })

  // Reduce to simplest whole-number ratio
  const nonZeroValues = Object.values(scaled).filter(value => value > 0)
  const gcdValue =
    nonZeroValues.length > 0
      ? nonZeroValues.reduce((acc, value) => gcdIntegers(acc, value))
      : 1
  if (gcdValue > 1) {
    Object.keys(scaled).forEach(symbol => {
      scaled[symbol] = scaled[symbol] / gcdValue
    })
  }

  // Build formula string
  let formula = ''
  const sortedElements = Object.keys(scaled).sort()

  // Carbon first (if present), then Hydrogen, then alphabetical
  const order = ['C', 'H', ...sortedElements.filter(s => s !== 'C' && s !== 'H')]

  order.forEach(symbol => {
    const value = scaled[symbol]
    if (value) {
      formula += symbol + (value > 1 ? value : '')
    }
  })

  return formula
}

function gcdIntegers(a: number, b: number): number {
  const absA = Math.abs(a)
  const absB = Math.abs(b)
  if (absB === 0) return absA
  return gcdIntegers(absB, absA % absB)
}

/**
 * Find limiting reagent
 */
export interface LimitingReagentInput {
  reactants: Array<{
    formula: string
    moles: number
    coefficient: number
  }>
}

export interface LimitingReagentResult {
  limitingReagent: string
  limitingReagentMoles: number
  excessReagents: Array<{
    formula: string
    excessMoles: number
    excessMass: number
  }>
  molesProductFormed: Record<string, number>
}

export function findLimitingReagent(
  input: LimitingReagentInput,
  products: Array<{ formula: string; coefficient: number }>
): LimitingReagentResult {
  // Calculate moles of product each reactant can form
  let limitingReagent = ''
  let minProductMoles = Infinity

  input.reactants.forEach(reactant => {
    const molesProductPerMoleReactant = 1 / reactant.coefficient
    const productMoles = reactant.moles * molesProductPerMoleReactant

    if (productMoles < minProductMoles) {
      minProductMoles = productMoles
      limitingReagent = reactant.formula
    }
  })

  // Calculate excess reagents
  const limitingReagentData = input.reactants.find(r => r.formula === limitingReagent)!
  const excessReagents = input.reactants
    .filter(r => r.formula !== limitingReagent)
    .map(reactant => {
      const requiredMoles = (limitingReagentData.moles / limitingReagentData.coefficient) * reactant.coefficient
      const excessMoles = reactant.moles - requiredMoles
      const molarMass = calculateMolecularMass(reactant.formula)

      return {
        formula: reactant.formula,
        excessMoles: Math.max(0, excessMoles),
        excessMass: Math.max(0, excessMoles) * molarMass,
      }
    })

  // Calculate moles of each product formed
  const molesProductFormed: Record<string, number> = {}
  products.forEach(product => {
    const molesFormed = (limitingReagentData.moles / limitingReagentData.coefficient) * product.coefficient
    molesProductFormed[product.formula] = molesFormed
  })

  return {
    limitingReagent,
    limitingReagentMoles: limitingReagentData.moles,
    excessReagents,
    molesProductFormed,
  }
}

/**
 * Calculate theoretical yield
 */
export function calculateTheoreticalYield(
  limitingReagentMoles: number,
  limitingReagentCoeff: number,
  productCoeff: number,
  productFormula: string
): { moles: number; mass: number } {
  const productMoles = (limitingReagentMoles / limitingReagentCoeff) * productCoeff
  const productMolarMass = calculateMolecularMass(productFormula)
  const productMass = productMoles * productMolarMass

  return {
    moles: productMoles,
    mass: productMass,
  }
}

/**
 * Calculate percent yield
 */
export function calculatePercentYield(
  actualYield: number,
  theoreticalYield: number
): number {
  return (actualYield / theoreticalYield) * 100
}

/**
 * Convert between concentration units
 */
export interface ConcentrationConversion {
  molarity?: number // M (mol/L)
  molality?: number // m (mol/kg solvent)
  massPercent?: number // %
  ppm?: number // parts per million
  ppb?: number // parts per billion
}

/**
 * Calculate dilution (M1V1 = M2V2)
 */
export function calculateDilution(
  M1?: number, // initial molarity
  V1?: number, // initial volume
  M2?: number, // final molarity
  V2?: number  // final volume
): { M1: number; V1: number; M2: number; V2: number } {
  // Solve for missing variable
  if (M1 !== undefined && V1 !== undefined && M2 !== undefined && V2 === undefined) {
    return { M1, V1, M2, V2: (M1 * V1) / M2 }
  }
  if (M1 !== undefined && V1 !== undefined && M2 === undefined && V2 !== undefined) {
    return { M1, V1, M2: (M1 * V1) / V2, V2 }
  }
  if (M1 !== undefined && V1 === undefined && M2 !== undefined && V2 !== undefined) {
    return { M1, V1: (M2 * V2) / M1, M2, V2 }
  }
  if (M1 === undefined && V1 !== undefined && M2 !== undefined && V2 !== undefined) {
    return { M1: (M2 * V2) / V1, V1, M2, V2 }
  }

  throw new Error('Invalid dilution parameters')
}

/**
 * Common stoichiometry examples
 */
export const STOICHIOMETRY_EXAMPLES = [
  {
    name: 'Water formation',
    equation: '2H2 + O2 -> 2H2O',
    problem: 'How many grams of H2O form from 4g of H2?',
    solution: {
      given: { formula: 'H2', mass: 4 },
      find: { formula: 'H2O' },
      steps: [
        'Calculate molar mass of H2: 2.016 g/mol',
        'Convert mass to moles: 4g / 2.016 g/mol = 1.984 mol H2',
        'Use mole ratio: 2 mol H2 -> 2 mol H2O (1:1 ratio)',
        'Moles of H2O formed: 1.984 mol',
        'Calculate molar mass of H2O: 18.015 g/mol',
        'Convert to mass: 1.984 mol × 18.015 g/mol = 35.74 g H2O',
      ],
      answer: '35.74 g H2O',
    },
  },
]

/**
 * Type aliases for UI
 */
export type PercentComposition = Record<string, number>
export type DilutionResult = { M1: number; V1: number; M2: number; V2: number }
