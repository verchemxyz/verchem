// VerChem - Chemical Equation Balancer
// Advanced algorithm for balancing chemical equations

import { BalancedEquation } from '../types/chemistry'

interface Fraction {
  num: number
  den: number
}

/**
 * Parse chemical formula to extract element counts
 * Examples: "H2O" -> {H: 2, O: 1}, "Ca(OH)2" -> {Ca: 1, O: 2, H: 2}
 */
function parseFormula(formula: string): Record<string, number> {
  const elements: Record<string, number> = {}

  // Remove states (s), (l), (g), (aq)
  formula = formula.replace(/\([slgaq]+\)/g, '')

  // Handle parentheses: Ca(OH)2 -> expand to CaO2H2
  formula = expandParentheses(formula)

  // Match element and number pattern: H2, C, O3
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match

  while ((match = regex.exec(formula)) !== null) {
    const element = match[1]
    const count = match[2] ? parseInt(match[2]) : 1

    if (element) {
      elements[element] = (elements[element] || 0) + count
    }
  }

  return elements
}

/**
 * Expand parentheses in chemical formula
 * Ca(OH)2 -> CaO2H2
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

function sanitizeCompound(compound: string): string {
  let sanitized = compound.trim()

  // Remove leading coefficient if user provided one (e.g., 2H2O)
  sanitized = sanitized.replace(/^\d+\s*/, '')

  // Remove physical state annotations like (s), (l), (g), (aq)
  sanitized = sanitized.replace(/\s*\((?:aq|s|l|g)\)\s*/gi, '')

  return sanitized.trim()
}

/**
 * Parse chemical equation into reactants and products
 * "H2 + O2 -> H2O" -> { reactants: ['H2', 'O2'], products: ['H2O'] }
 */
function parseEquation(equation: string): { reactants: string[]; products: string[] } {
  // Split by arrow (support multiple arrow formats)
  const parts = equation.split(/->|→|=/)

  if (parts.length !== 2) {
    throw new Error('Invalid equation format. Use format: A + B -> C + D')
  }

  const reactants = parts[0]
    .split('+')
    .map(sanitizeCompound)
    .filter(s => s.length > 0)
  const products = parts[1]
    .split('+')
    .map(sanitizeCompound)
    .filter(s => s.length > 0)

  if (reactants.length === 0 || products.length === 0) {
    throw new Error('Invalid equation format. Must include reactants and products')
  }

  return { reactants, products }
}

/**
 * Get all elements in the equation
 */
function getAllElements(reactants: string[], products: string[]): string[] {
  const elements = new Set<string>()

  ;[...reactants, ...products].forEach(compound => {
    const parsed = parseFormula(compound)
    Object.keys(parsed).forEach(el => elements.add(el))
  })

  return Array.from(elements).sort()
}

/**
 * Build matrix for balancing algorithm
 * Uses linear algebra approach (Gaussian elimination)
 */
function buildMatrix(
  reactants: string[],
  products: string[],
  elements: string[]
): number[][] {
  const matrix: number[][] = []

  elements.forEach(element => {
    const row: number[] = []

    // Reactants (positive coefficients)
    reactants.forEach(compound => {
      const parsed = parseFormula(compound)
      row.push(parsed[element] || 0)
    })

    // Products (negative coefficients)
    products.forEach(compound => {
      const parsed = parseFormula(compound)
      row.push(-(parsed[element] || 0))
    })

    matrix.push(row)
  })

  return matrix
}

/**
 * Find GCD (Greatest Common Divisor) of array
 */
function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

function arrayGCD(arr: number[]): number {
  return arr.reduce((a, b) => gcd(a, b))
}

/**
 * Balance chemical equation using algebraic method
 */
export function balanceEquation(equation: string): BalancedEquation {
  try {
    const { reactants, products } = parseEquation(equation)
    const elements = getAllElements(reactants, products)

    // Total number of compounds
    const n = reactants.length + products.length

    // Try brute force for small equations (most efficient for simple cases)
    if (n <= 5) {
      const coeffs = balanceBruteForce(reactants, products, elements)
      if (coeffs) {
        return buildBalancedEquation(equation, reactants, products, coeffs, elements)
      }
    }

    // Fall back to Gaussian elimination for general cases
    const coeffs = balanceUsingGaussian(reactants, products, elements)
    if (coeffs) {
      return buildBalancedEquation(equation, reactants, products, coeffs, elements)
    }

    return createFailedBalancedEquation(equation, reactants, products)
  } catch {
    return createFailedBalancedEquation(equation, [], [])
  }
}

/**
 * Brute force method (try coefficients 1-10)
 * Works well for simple equations
 */
function balanceBruteForce(
  reactants: string[],
  products: string[],
  elements: string[],
  maxCoeff: number = 10
): number[] | null {
  const n = reactants.length + products.length

  // Generate all possible coefficient combinations
  function tryCoefficients(
    index: number,
    coeffs: number[],
    maxTries: number = 100000
  ): number[] | null {
    if (index === n) {
      // Check if this combination balances
      if (checkBalance(reactants, products, elements, coeffs)) {
        return coeffs
      }
      return null
    }

    for (let c = 1; c <= maxCoeff; c++) {
      coeffs[index] = c
      const result = tryCoefficients(index + 1, [...coeffs], maxTries - 1)
      if (result) {
        return result
      }
      if (maxTries <= 0) return null
    }

    return null
  }

  const result = tryCoefficients(0, [])

  if (result) {
    // Reduce to smallest integers
    const g = arrayGCD(result)
    return result.map(c => c / g)
  }

  return null
}

/**
 * Check if coefficients balance the equation
 */
function checkBalance(
  reactants: string[],
  products: string[],
  elements: string[],
  coefficients: number[]
): boolean {
  for (const element of elements) {
    let reactantCount = 0
    let productCount = 0

    reactants.forEach((compound, i) => {
      const parsed = parseFormula(compound)
      reactantCount += (parsed[element] || 0) * coefficients[i]
    })

    products.forEach((compound, i) => {
      const parsed = parseFormula(compound)
      productCount += (parsed[element] || 0) * coefficients[reactants.length + i]
    })

    if (reactantCount !== productCount) {
      return false
    }
  }

  return true
}

function balanceUsingGaussian(
  reactants: string[],
  products: string[],
  elements: string[]
): number[] | null {
  const matrix = buildMatrix(reactants, products, elements)
  if (matrix.length === 0) {
    return null
  }

  const solution = solveHomogeneousSystem(matrix)
  if (!solution) {
    return null
  }

  if (solution.some(coefficient => coefficient <= 0)) {
    return null
  }

  return solution
}

function solveHomogeneousSystem(matrix: number[][]): number[] | null {
  const cols = matrix[0]?.length ?? 0
  if (cols === 0) {
    return null
  }

  const { rref, pivotColumns } = toReducedRowEchelonForm(matrix)
  const pivotMap = new Map<number, number>()
  pivotColumns.forEach((col, rowIndex) => {
    if (col >= 0) {
      pivotMap.set(col, rowIndex)
    }
  })

  const freeColumns: number[] = []
  for (let c = 0; c < cols; c++) {
    if (!pivotMap.has(c)) {
      freeColumns.push(c)
    }
  }

  if (freeColumns.length === 0) {
    return null
  }

  for (let i = freeColumns.length - 1; i >= 0; i--) {
    const freeColumn = freeColumns[i]
    const fractions = buildSolutionFromRREF(rref, pivotMap, freeColumns, freeColumn)
    const integers = convertFractionsToIntegers(fractions)
    if (integers.length && integers.every(value => value > 0)) {
      return integers
    }
  }

  return null
}

function toReducedRowEchelonForm(matrix: number[][]): {
  rref: Fraction[][]
  pivotColumns: number[]
} {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const rref: Fraction[][] = matrix.map(row => row.map(value => makeFraction(value)))

  let lead = 0
  for (let r = 0; r < rows; r++) {
    if (lead >= cols) {
      break
    }

    let pivotRow = r
    while (pivotRow < rows && fractionIsZero(rref[pivotRow][lead])) {
      pivotRow++
    }

    if (pivotRow === rows) {
      lead++
      r--
      continue
    }

    if (pivotRow !== r) {
      const temp = rref[r]
      rref[r] = rref[pivotRow]
      rref[pivotRow] = temp
    }

    const pivotValue = rref[r][lead]
    for (let c = 0; c < cols; c++) {
      rref[r][c] = fractionDivide(rref[r][c], pivotValue)
    }

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      if (rowIndex === r) continue
      const factor = rref[rowIndex][lead]
      if (fractionIsZero(factor)) continue
      for (let c = 0; c < cols; c++) {
        const subtractValue = fractionMultiply(factor, rref[r][c])
        rref[rowIndex][c] = fractionSubtract(rref[rowIndex][c], subtractValue)
      }
    }

    lead++
  }

  const pivotColumns = new Array(rows).fill(-1)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!fractionIsZero(rref[r][c])) {
        pivotColumns[r] = c
        break
      }
    }
  }

  return { rref, pivotColumns }
}

function buildSolutionFromRREF(
  rref: Fraction[][],
  pivotMap: Map<number, number>,
  freeColumns: number[],
  selectedFreeColumn: number
): Fraction[] {
  const cols = rref[0]?.length ?? 0
  const solution: Fraction[] = Array(cols)
    .fill(null)
    .map(() => makeFraction(0))

  solution[selectedFreeColumn] = makeFraction(1)

  pivotMap.forEach((rowIndex, pivotColumn) => {
    let sum = makeFraction(0)
    freeColumns.forEach(freeColumn => {
      if (freeColumn === pivotColumn) return
      if (fractionIsZero(solution[freeColumn])) return
      const coefficient = rref[rowIndex][freeColumn]
      if (fractionIsZero(coefficient)) return
      const product = fractionMultiply(coefficient, solution[freeColumn])
      sum = fractionAdd(sum, product)
    })
    solution[pivotColumn] = fractionNegate(sum)
  })

  return solution
}

function convertFractionsToIntegers(solution: Fraction[]): number[] {
  const denominators = solution.map(frac => frac.den)
  const lcmDenominator = denominators.reduce((acc, den) => lcm(acc, den), 1)

  const integers = solution.map(frac => frac.num * (lcmDenominator / frac.den))
  if (integers.every(value => value === 0)) {
    return []
  }

  const nonZeroValues = integers.filter(value => value !== 0).map(value => Math.abs(value))
  const divisor =
    nonZeroValues.length > 0 ? nonZeroValues.reduce((acc, value) => gcd(acc, value)) : 1
  const normalized = divisor ? integers.map(value => value / divisor) : integers

  const firstNonZero = normalized.find(value => value !== 0) ?? 0
  if (firstNonZero < 0) {
    return normalized.map(value => -value)
  }

  return normalized
}

function makeFraction(num: number, den: number = 1): Fraction {
  if (den === 0) {
    throw new Error('Zero denominator')
  }
  if (num === 0) {
    return { num: 0, den: 1 }
  }
  const divisor = gcd(num, den)
  let normalizedNum = num / divisor
  let normalizedDen = den / divisor
  if (normalizedDen < 0) {
    normalizedNum *= -1
    normalizedDen *= -1
  }
  return { num: normalizedNum, den: normalizedDen }
}

function fractionAdd(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.den + b.num * a.den, a.den * b.den)
}

function fractionSubtract(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.den - b.num * a.den, a.den * b.den)
}

function fractionMultiply(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.num, a.den * b.den)
}

function fractionDivide(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.den, a.den * b.num)
}

function fractionIsZero(value: Fraction): boolean {
  return value.num === 0
}

function fractionNegate(value: Fraction): Fraction {
  return makeFraction(-value.num, value.den)
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return Math.abs(a * b)
  }
  return Math.abs((a * b) / gcd(a, b))
}

function createFailedBalancedEquation(
  original: string,
  reactants: string[],
  products: string[]
): BalancedEquation {
  return {
    original,
    balanced: original,
    coefficients: [],
    reactants,
    products,
    isBalanced: false,
    atoms: {},
  }
}

/**
 * Build final balanced equation result
 */
function buildBalancedEquation(
  original: string,
  reactants: string[],
  products: string[],
  coefficients: number[],
  elements: string[]
): BalancedEquation {
  // Build balanced equation string
  const reactantStr = reactants
    .map((r, i) => (coefficients[i] > 1 ? `${coefficients[i]}${r}` : r))
    .join(' + ')

  const productStr = products
    .map((p, i) => {
      const coeff = coefficients[reactants.length + i]
      return coeff > 1 ? `${coeff}${p}` : p
    })
    .join(' + ')

  const balanced = `${reactantStr} → ${productStr}`

  // Count atoms on each side
  const atomCounts: Record<string, { reactants: number; products: number }> = {}

  elements.forEach(element => {
    let reactantCount = 0
    let productCount = 0

    reactants.forEach((compound, i) => {
      const parsed = parseFormula(compound)
      reactantCount += (parsed[element] || 0) * coefficients[i]
    })

    products.forEach((compound, i) => {
      const parsed = parseFormula(compound)
      productCount += (parsed[element] || 0) * coefficients[reactants.length + i]
    })

    atomCounts[element] = { reactants: reactantCount, products: productCount }
  })

  const isBalanced = elements.every(
    el => atomCounts[el].reactants === atomCounts[el].products
  )

  return {
    original,
    balanced,
    coefficients,
    reactants,
    products,
    isBalanced,
    atoms: atomCounts,
  }
}

/**
 * Identify reaction type
 */
export function identifyReactionType(equation: string): string {
  const { reactants, products } = parseEquation(equation)

  // Combustion: hydrocarbon + O2 -> CO2 + H2O
  if (
    reactants.some(r => r.includes('O2')) &&
    products.some(p => p.includes('CO2')) &&
    products.some(p => p.includes('H2O'))
  ) {
    return 'combustion'
  }

  // Synthesis: A + B -> AB
  if (reactants.length === 2 && products.length === 1) {
    return 'synthesis'
  }

  // Decomposition: AB -> A + B
  if (reactants.length === 1 && products.length >= 2) {
    return 'decomposition'
  }

  // Single replacement: A + BC -> AC + B
  if (reactants.length === 2 && products.length === 2) {
    return 'single-replacement'
  }

  // Double replacement: AB + CD -> AD + CB
  if (reactants.length === 2 && products.length === 2) {
    return 'double-replacement'
  }

  return 'unknown'
}

/**
 * Get common chemistry equations for examples
 */
export const EXAMPLE_EQUATIONS = [
  {
    name: 'Water formation',
    equation: 'H2 + O2 -> H2O',
    type: 'synthesis',
  },
  {
    name: 'Methane combustion',
    equation: 'CH4 + O2 -> CO2 + H2O',
    type: 'combustion',
  },
  {
    name: 'Ammonia synthesis (Haber process)',
    equation: 'N2 + H2 -> NH3',
    type: 'synthesis',
  },
  {
    name: 'Photosynthesis',
    equation: 'CO2 + H2O -> C6H12O6 + O2',
    type: 'synthesis',
  },
  {
    name: 'Sodium + Water',
    equation: 'Na + H2O -> NaOH + H2',
    type: 'single-replacement',
  },
  {
    name: 'Silver nitrate + Sodium chloride',
    equation: 'AgNO3 + NaCl -> AgCl + NaNO3',
    type: 'double-replacement',
  },
  {
    name: 'Hydrogen peroxide decomposition',
    equation: 'H2O2 -> H2O + O2',
    type: 'decomposition',
  },
  {
    name: 'Propane combustion',
    equation: 'C3H8 + O2 -> CO2 + H2O',
    type: 'combustion',
  },
  {
    name: 'Rust formation',
    equation: 'Fe + O2 -> Fe2O3',
    type: 'synthesis',
  },
  {
    name: 'Calcium carbonate decomposition',
    equation: 'CaCO3 -> CaO + CO2',
    type: 'decomposition',
  },
]

/**
 * Validate chemical formula format
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  try {
    const sanitized = sanitizeCompound(formula)
    if (!sanitized) {
      return { valid: false, error: 'Formula cannot be empty' }
    }

    parseFormula(sanitized)
    return { valid: true }
  } catch {
    return { valid: false, error: 'Cannot parse formula' }
  }
}
