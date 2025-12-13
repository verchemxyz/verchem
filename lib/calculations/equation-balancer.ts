// VerChem - Chemical Equation Balancer
// Advanced algorithm for balancing chemical equations
// Updated: Nov 2025 - Improved algorithm with higher coefficient limits and redox support

import { BalancedEquation } from '../types/chemistry'

interface Fraction {
  num: number
  den: number
}

// Common oxidation states for redox balancing
const OXIDATION_STATES: Record<string, number[]> = {
  H: [1, -1],
  O: [-2, -1],
  F: [-1],
  Na: [1],
  K: [1],
  Ca: [2],
  Mg: [2],
  Al: [3],
  Fe: [2, 3],
  Cu: [1, 2],
  Zn: [2],
  Ag: [1],
  Cl: [-1, 1, 3, 5, 7],
  Br: [-1, 1, 3, 5],
  I: [-1, 1, 5, 7],
  S: [-2, 2, 4, 6],
  N: [-3, 3, 5],
  C: [-4, 2, 4],
  Mn: [2, 4, 7],
  Cr: [2, 3, 6],
  P: [-3, 3, 5],
}

// SECURITY: Max input length to prevent ReDoS attacks (Dec 2025 - 4-AI Audit)
const MAX_FORMULA_LENGTH = 500

/**
 * Parse chemical formula to extract element counts
 * Examples: "H2O" -> {H: 2, O: 1}, "Ca(OH)2" -> {Ca: 1, O: 2, H: 2}
 */
function parseFormula(formula: string): Record<string, number> {
  // SECURITY: Limit input size to prevent ReDoS
  if (formula.length > MAX_FORMULA_LENGTH) {
    throw new Error(`Formula too long (max ${MAX_FORMULA_LENGTH} characters)`)
  }

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
 * Optimized brute force with smart pruning
 * - Higher coefficient limit (up to 20)
 * - Early termination when partial balance impossible
 * - Prioritizes common coefficient patterns
 */
function balanceBruteForce(
  reactants: string[],
  products: string[],
  elements: string[],
  maxCoeff: number = 20
): number[] | null {
  const n = reactants.length + products.length
  const parsedReactants = reactants.map(parseFormula)
  const parsedProducts = products.map(parseFormula)

  // Pre-compute element counts for each compound
  const reactantCounts = parsedReactants.map(parsed =>
    elements.map(el => parsed[el] || 0)
  )
  const productCounts = parsedProducts.map(parsed =>
    elements.map(el => parsed[el] || 0)
  )

  // Try common coefficient patterns first (1, 2, 3, 4, 6, 8, 10)
  const priorityCoeffs = [1, 2, 3, 4, 6, 8, 10, 5, 7, 9, 12, 14, 16, 18, 20]

  function tryCoefficientsOptimized(
    index: number,
    coeffs: number[],
    iterationsLeft: number
  ): number[] | null {
    if (iterationsLeft <= 0) return null

    if (index === n) {
      // Fast balance check using pre-computed values
      for (let elIdx = 0; elIdx < elements.length; elIdx++) {
        let reactantSum = 0
        let productSum = 0

        for (let i = 0; i < reactants.length; i++) {
          reactantSum += reactantCounts[i][elIdx] * coeffs[i]
        }
        for (let i = 0; i < products.length; i++) {
          productSum += productCounts[i][elIdx] * coeffs[reactants.length + i]
        }

        if (reactantSum !== productSum) return null
      }
      return [...coeffs]
    }

    // For later compounds, try to constrain based on partial sums
    const coeffsToTry =
      index < 2 ? priorityCoeffs.filter(c => c <= maxCoeff) : getOrderedCoeffs(maxCoeff)

    for (const c of coeffsToTry) {
      coeffs[index] = c

      // Early pruning: check if partial balance is possible
      if (index >= reactants.length - 1 && index < n - 1) {
        // Can we still balance with remaining coefficients?
        let canBalance = true
        for (let elIdx = 0; elIdx < elements.length && canBalance; elIdx++) {
          let reactantSum = 0
          for (let i = 0; i < reactants.length; i++) {
            reactantSum += reactantCounts[i][elIdx] * coeffs[i]
          }

          let productSum = 0
          let maxPossibleProduct = 0
          for (let i = 0; i < products.length; i++) {
            if (i + reactants.length <= index) {
              productSum += productCounts[i][elIdx] * coeffs[reactants.length + i]
            } else {
              maxPossibleProduct += productCounts[i][elIdx] * maxCoeff
            }
          }

          // If reactant sum exceeds max possible product, prune this branch
          if (reactantSum > productSum + maxPossibleProduct) {
            canBalance = false
          }
        }
        if (!canBalance) continue
      }

      const result = tryCoefficientsOptimized(index + 1, coeffs, iterationsLeft - 1)
      if (result) return result
    }

    return null
  }

  // Try with increasingly higher limits
  for (const limit of [10, 15, 20]) {
    const result = tryCoefficientsOptimized(0, new Array(n).fill(0), 500000)
    if (result) {
      const g = arrayGCD(result)
      return result.map(c => c / g)
    }
    if (limit >= maxCoeff) break
  }

  return null
}

function getOrderedCoeffs(max: number): number[] {
  const result: number[] = []
  for (let i = 1; i <= max; i++) {
    result.push(i)
  }
  return result
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
 * Identify reaction type with enhanced detection
 */
export function identifyReactionType(equation: string): string {
  try {
    const { reactants, products } = parseEquation(equation)

    // Check for redox indicators
    const isRedox = detectRedoxReaction(reactants, products)
    if (isRedox) {
      // More specific redox types
      if (
        reactants.some(r => r.includes('O2')) &&
        products.some(p => p.includes('CO2')) &&
        products.some(p => p.includes('H2O'))
      ) {
        return 'combustion'
      }
      return 'redox'
    }

    // Combustion: hydrocarbon + O2 -> CO2 + H2O
    if (
      reactants.some(r => r.includes('O2')) &&
      products.some(p => p.includes('CO2')) &&
      products.some(p => p.includes('H2O'))
    ) {
      return 'combustion'
    }

    // Acid-base neutralization: acid + base -> salt + water
    if (
      (reactants.some(r => r.match(/^H[A-Z]/)) || reactants.some(r => r.includes('OH'))) &&
      products.some(p => p === 'H2O' || p === 'HOH')
    ) {
      return 'acid-base'
    }

    // Synthesis: A + B -> AB
    if (reactants.length === 2 && products.length === 1) {
      return 'synthesis'
    }

    // Decomposition: AB -> A + B
    if (reactants.length === 1 && products.length >= 2) {
      return 'decomposition'
    }

    // Single replacement: A + BC -> AC + B (check if one reactant is element)
    if (reactants.length === 2 && products.length === 2) {
      const r1Elements = Object.keys(parseFormula(reactants[0]))
      const r2Elements = Object.keys(parseFormula(reactants[1]))
      if (r1Elements.length === 1 || r2Elements.length === 1) {
        return 'single-replacement'
      }
      return 'double-replacement'
    }

    // Precipitation (double replacement forming solid)
    if (reactants.length === 2 && products.length === 2) {
      return 'double-replacement'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Detect if reaction involves oxidation-reduction
 */
function detectRedoxReaction(reactants: string[], products: string[]): boolean {
  // Common redox indicators
  const redoxIndicators = [
    'O2', 'H2', 'Cl2', 'F2', 'Br2', 'I2', // Diatomic elements
    'MnO4', 'Cr2O7', 'CrO4', // Common oxidizing agents
    'Fe', 'Cu', 'Zn', 'Al', 'Mg', 'Na', 'K', // Active metals
  ]

  const allCompounds = [...reactants, ...products]

  // Check for diatomic elements or common redox species
  for (const compound of allCompounds) {
    for (const indicator of redoxIndicators) {
      if (compound.includes(indicator)) {
        return true
      }
    }
  }

  // Check for change in oxidation state (simplified)
  // If same element appears in different compounds with different partners, likely redox
  const reactantElements = new Set<string>()
  const productElements = new Set<string>()

  reactants.forEach(r => {
    Object.keys(parseFormula(r)).forEach(el => reactantElements.add(el))
  })
  products.forEach(p => {
    Object.keys(parseFormula(p)).forEach(el => productElements.add(el))
  })

  // If element appears alone on one side but combined on other, likely redox
  for (const r of reactants) {
    const elements = Object.keys(parseFormula(r))
    if (elements.length === 1 && elements[0] !== 'H' && elements[0] !== 'O') {
      return true
    }
  }

  return false
}

/**
 * Get common chemistry equations for examples
 * Organized by difficulty and reaction type
 */
export const EXAMPLE_EQUATIONS = [
  // Simple equations (coefficients 1-4)
  {
    name: 'Water formation',
    equation: 'H2 + O2 -> H2O',
    type: 'synthesis',
    difficulty: 'easy',
  },
  {
    name: 'Ammonia synthesis (Haber process)',
    equation: 'N2 + H2 -> NH3',
    type: 'synthesis',
    difficulty: 'easy',
  },
  {
    name: 'Calcium carbonate decomposition',
    equation: 'CaCO3 -> CaO + CO2',
    type: 'decomposition',
    difficulty: 'easy',
  },
  {
    name: 'Hydrogen peroxide decomposition',
    equation: 'H2O2 -> H2O + O2',
    type: 'decomposition',
    difficulty: 'easy',
  },
  {
    name: 'Silver nitrate + Sodium chloride',
    equation: 'AgNO3 + NaCl -> AgCl + NaNO3',
    type: 'double-replacement',
    difficulty: 'easy',
  },

  // Medium equations (coefficients up to 8)
  {
    name: 'Methane combustion',
    equation: 'CH4 + O2 -> CO2 + H2O',
    type: 'combustion',
    difficulty: 'medium',
  },
  {
    name: 'Propane combustion',
    equation: 'C3H8 + O2 -> CO2 + H2O',
    type: 'combustion',
    difficulty: 'medium',
  },
  {
    name: 'Sodium + Water',
    equation: 'Na + H2O -> NaOH + H2',
    type: 'single-replacement',
    difficulty: 'medium',
  },
  {
    name: 'Rust formation',
    equation: 'Fe + O2 -> Fe2O3',
    type: 'redox',
    difficulty: 'medium',
  },
  {
    name: 'Photosynthesis',
    equation: 'CO2 + H2O -> C6H12O6 + O2',
    type: 'synthesis',
    difficulty: 'medium',
  },
  {
    name: 'Neutralization (HCl + NaOH)',
    equation: 'HCl + NaOH -> NaCl + H2O',
    type: 'acid-base',
    difficulty: 'medium',
  },
  {
    name: 'Sulfuric acid neutralization',
    equation: 'H2SO4 + NaOH -> Na2SO4 + H2O',
    type: 'acid-base',
    difficulty: 'medium',
  },

  // Complex equations (coefficients up to 15+)
  {
    name: 'Ethanol combustion',
    equation: 'C2H5OH + O2 -> CO2 + H2O',
    type: 'combustion',
    difficulty: 'hard',
  },
  {
    name: 'Glucose combustion',
    equation: 'C6H12O6 + O2 -> CO2 + H2O',
    type: 'combustion',
    difficulty: 'hard',
  },
  {
    name: 'Octane combustion',
    equation: 'C8H18 + O2 -> CO2 + H2O',
    type: 'combustion',
    difficulty: 'hard',
  },
  {
    name: 'Aluminum + Iron oxide (Thermite)',
    equation: 'Al + Fe2O3 -> Al2O3 + Fe',
    type: 'redox',
    difficulty: 'hard',
  },
  {
    name: 'Potassium permanganate + HCl',
    equation: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O',
    type: 'redox',
    difficulty: 'hard',
  },
  {
    name: 'Copper + Nitric acid (dilute)',
    equation: 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O',
    type: 'redox',
    difficulty: 'hard',
  },
  {
    name: 'Dichromate + Iron(II)',
    equation: 'K2Cr2O7 + FeSO4 + H2SO4 -> Cr2(SO4)3 + Fe2(SO4)3 + K2SO4 + H2O',
    type: 'redox',
    difficulty: 'hard',
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

/**
 * Get human-readable reaction type label
 */
export function getReactionTypeLabel(type: string): {
  label: string
  description: string
  color: string
} {
  const types: Record<string, { label: string; description: string; color: string }> = {
    synthesis: {
      label: 'Synthesis',
      description: 'Two or more substances combine to form a single product',
      color: 'bg-green-500',
    },
    decomposition: {
      label: 'Decomposition',
      description: 'A single compound breaks down into two or more simpler substances',
      color: 'bg-orange-500',
    },
    'single-replacement': {
      label: 'Single Replacement',
      description: 'One element replaces another in a compound',
      color: 'bg-blue-500',
    },
    'double-replacement': {
      label: 'Double Replacement',
      description: 'Two compounds exchange ions to form two new compounds',
      color: 'bg-purple-500',
    },
    combustion: {
      label: 'Combustion',
      description: 'A substance reacts rapidly with oxygen, releasing heat and light',
      color: 'bg-red-500',
    },
    redox: {
      label: 'Redox',
      description: 'Oxidation-reduction reaction involving electron transfer',
      color: 'bg-yellow-500',
    },
    'acid-base': {
      label: 'Acid-Base',
      description: 'Neutralization reaction between an acid and a base',
      color: 'bg-cyan-500',
    },
    unknown: {
      label: 'Unknown',
      description: 'Reaction type could not be determined',
      color: 'bg-gray-500',
    },
  }

  return types[type] || types.unknown
}

/**
 * Export oxidation states for use in other components
 */
export { OXIDATION_STATES }
