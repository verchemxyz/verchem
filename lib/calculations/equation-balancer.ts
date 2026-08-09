// VerChem - Chemical Equation Balancer
// Advanced algorithm for balancing chemical equations
// Updated: Nov 2025 - Improved algorithm with higher coefficient limits and redox support

import { BalancedEquation } from '../types/chemistry'
import { PERIODIC_TABLE } from '../data/periodic-table'

/**
 * Real element symbols, so a made-up token like "Xx" cannot be balanced.
 * D and T are the conventional hydrogen-isotope symbols; they are conserved
 * separately from H, which is what isotope-labelled equations require.
 */
const KNOWN_ELEMENTS: ReadonlySet<string> = new Set([
  ...PERIODIC_TABLE.map((e) => e.symbol),
  'D',
  'T',
])

/**
 * Detects a species-level charge. A "+" that starts a new species is a
 * separator ("H2 + O2", "H2+O2"); a "+" hanging off a token is a charge
 * ("H+", "Fe3+"). Unicode superscripts and "^" are always charges.
 *
 * This must run BEFORE the equation is split on "+", otherwise the charge is
 * silently consumed as a separator and "H+ -> H" balances.
 */
function hasCharge(side: string): boolean {
  const cleaned = side.replace(/\((?:aq|s|l|g)\)/gi, '')
  if (/[⁺⁻^]/.test(cleaned)) return true
  if (/[A-Za-z0-9)]\+(?!\s*[A-Z(])/.test(cleaned)) return true
  if (/[A-Za-z0-9)]-(?!>)/.test(cleaned)) return true
  return false
}

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
  const original = formula

  // Physical states have already been removed by sanitizeCompound. Do not use
  // a broad character-class replacement here: it would mistake invalid groups
  // such as (qq), (gas), or (aqs) for state annotations and silently accept
  // the wrong formula.

  // Every digit sequence at this point is a subscript or group multiplier.
  // Validate it before expansion so H02 inside Ca(H02)2 cannot be normalized
  // into an apparently valid H4 token.
  for (const digitMatch of formula.matchAll(/\d+/g)) {
    if (!/^[1-9]\d*$/.test(digitMatch[0])) {
      throw new Error(`Invalid subscript "${digitMatch[0]}" in "${original}"`)
    }
  }

  if (/\(\s*\)/.test(formula)) {
    throw new Error(`Empty parenthesized group in "${original}"`)
  }

  // Defence in depth — parseChemicalEquation rejects charges before splitting, but a
  // direct caller must not get "Cr3+" read as three chromium atoms.
  if (/[+\-^⁺⁻]/.test(formula)) {
    throw new Error(
      `Ionic species with charges are not supported: "${original}". Write the equation in molecular form (e.g. KMnO4 + HCl instead of MnO4- + H+).`
    )
  }

  // Handle parentheses: Ca(OH)2 -> expand to CaO2H2
  formula = expandParentheses(formula)

  if (formula.length === 0) {
    throw new Error('Empty chemical formula')
  }

  // STRICT tokenisation. The previous global-regex scan skipped any character
  // it could not match, so "Ca(OH2" parsed as CaOH2 and "abc" parsed as the
  // empty set — both then "balanced". Every character must now be consumed by
  // an element+subscript token.
  const token = /([A-Z][a-z]?)(\d*)/y
  let pos = 0

  while (pos < formula.length) {
    token.lastIndex = pos
    const match = token.exec(formula)

    if (!match) {
      throw new Error(`Cannot parse formula: "${original}"`)
    }

    const element = match[1]
    if (!KNOWN_ELEMENTS.has(element)) {
      throw new Error(`Unknown element symbol: "${element}" in "${original}"`)
    }

    let count = 1
    if (match[2]) {
      if (!/^[1-9]\d*$/.test(match[2])) {
        throw new Error(`Invalid subscript "${match[2]}" in "${original}"`)
      }
      count = parseInt(match[2], 10)
      if (!Number.isSafeInteger(count) || count > MAX_SUBSCRIPT) {
        throw new Error(`Subscript out of range in "${original}"`)
      }
    }

    elements[element] = (elements[element] || 0) + count
    pos = token.lastIndex
  }

  return elements
}

/**
 * Expand parentheses in chemical formula
 * Ca(OH)2 -> CaO2H2
 */
/** Largest subscript we will produce; keeps multiplication in exact-integer range. */
const MAX_SUBSCRIPT = 1_000_000

/**
 * Expand parenthesised groups: Ca(OH)2 -> CaO2H2.
 *
 * Uses an explicit stack rather than repeated regex replacement, because the
 * regex form matched the INNERMOST group first and then re-matched the partly
 * expanded text, which multiplied nested atoms by the wrong factor —
 * K4(Fe(CN)6) came out as K4Fe6C6N6 instead of K4Fe1C6N6.
 *
 * Unbalanced input is returned unchanged; callers reject it via their
 * element-symbol validation rather than getting a silently mangled formula.
 */
export function expandParentheses(formula: string): string {
  const stack: string[] = ['']
  let i = 0

  while (i < formula.length) {
    const ch = formula[i]

    if (ch === '(') {
      stack.push('')
      i++
      continue
    }

    if (ch === ')') {
      // Closing without a matching opener — leave the input for the caller to reject.
      if (stack.length === 1) return formula

      const group = stack.pop() as string
      i++

      let digits = ''
      while (i < formula.length && formula[i] >= '0' && formula[i] <= '9') {
        digits += formula[i]
        i++
      }

      const multiplier = digits ? parseInt(digits, 10) : 1
      if (!Number.isSafeInteger(multiplier) || multiplier > MAX_SUBSCRIPT) return formula

      let overflowed = false
      const expanded = group.replace(/([A-Z][a-z]?)(\d*)/g, (_m, el: string, count: string) => {
        const c = count ? parseInt(count, 10) : 1
        const total = c * multiplier
        if (!Number.isSafeInteger(total) || total > MAX_SUBSCRIPT) overflowed = true
        return el + total
      })
      if (overflowed) return formula

      stack[stack.length - 1] += expanded
      continue
    }

    stack[stack.length - 1] += ch
    i++
  }

  // Unclosed group — again, hand the original back for validation to reject.
  if (stack.length !== 1) return formula

  return stack[0]
}

function sanitizeCompound(compound: string): string {
  let sanitized = compound.trim()

  // Remove a valid positive leading coefficient if the user supplied one.
  // Zero and leading-zero coefficients are not chemical coefficients and must
  // not be silently stripped into an otherwise valid formula.
  const coefficientMatch = /^(\d+)\s*/.exec(sanitized)
  if (coefficientMatch) {
    const coefficientText = coefficientMatch[1]
    const coefficient = Number(coefficientText)
    if (!/^[1-9]\d*$/.test(coefficientText) || !Number.isSafeInteger(coefficient)) {
      throw new Error(`Invalid leading coefficient in "${compound.trim()}"`)
    }
    sanitized = sanitized.slice(coefficientMatch[0].length)
  }

  // A physical-state annotation is valid only once and only at the end.
  sanitized = sanitized.replace(/\s*\((?:aq|s|l|g)\)\s*$/i, '')
  if (/\((?:aq|s|l|g)\)/i.test(sanitized)) {
    throw new Error(`Invalid physical-state annotation in "${compound.trim()}"`)
  }

  return sanitized.trim()
}

/**
 * Parse chemical equation into reactants and products
 * "H2 + O2 -> H2O" -> { reactants: ['H2', 'O2'], products: ['H2O'] }
 */
export function parseChemicalEquation(equation: string): { reactants: string[]; products: string[] } {
  if (typeof equation !== 'string' || equation.trim().length === 0) {
    throw new Error('Equation is required')
  }

  // Split by arrow (support multiple arrow formats)
  const parts = equation.split(/->|=>|→|=/)

  if (parts.length !== 2) {
    throw new Error('Invalid equation format. Use format: A + B -> C + D')
  }

  // Charges must be caught here: splitting on "+" would otherwise turn
  // "H+ -> H" into "H -> H" and balance it.
  for (const side of parts) {
    if (hasCharge(side)) {
      throw new Error(
        'Ionic species with charges are not supported. Write the equation in molecular form (e.g. KMnO4 + HCl instead of MnO4- + H+).'
      )
    }
  }

  const rawReactants = parts[0].split('+')
  const rawProducts = parts[1].split('+')

  // Empty terms are malformed input, not optional separators. Reject before
  // sanitizing so leading, trailing and doubled plus signs cannot disappear.
  if (
    rawReactants.length === 0 ||
    rawProducts.length === 0 ||
    [...rawReactants, ...rawProducts].some(term => term.trim().length === 0)
  ) {
    throw new Error('Equation contains empty terms (check for leading, trailing, or double + signs)')
  }

  const reactants = rawReactants.map(sanitizeCompound)
  const products = rawProducts.map(sanitizeCompound)

  // This is the canonical validation path used by balancing, classification
  // and Answer Cards. Every sanitized term must parse completely.
  for (const compound of [...reactants, ...products]) parseFormula(compound)

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
    const { reactants, products } = parseChemicalEquation(equation)
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
    const { reactants, products } = parseChemicalEquation(equation)

    // Structural pattern first, electron-transfer last. Many reactions are
    // legitimately both (H2 + O2 -> H2O is a synthesis AND a redox); textbooks
    // name them by the pattern, so the more specific structural label wins and
    // 'redox' is the fallback for reactions with no clearer pattern.

    // Combustion: fuel + O2 -> CO2 + H2O. Compare whole species, not
    // substrings — "CO2".includes("O2") was matching the oxygen test.
    if (
      reactants.some(r => r === 'O2') &&
      products.some(p => p === 'CO2') &&
      products.some(p => p === 'H2O')
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

    // Electron transfer must be checked before the generic 2 -> 2 structural
    // bucket. Otherwise reactions such as Fe2O3 + CO -> Fe + CO2 can never be
    // classified as redox.
    if (detectRedoxReaction(reactants, products)) {
      return 'redox'
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

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Detect if reaction involves oxidation-reduction
 */
function detectRedoxReaction(reactants: string[], products: string[]): boolean {
  // The old version substring-matched a list of "indicators", so NaOH counted
  // as sodium metal and CO2 counted as O2 — nearly everything came back redox.
  //
  // Use the one signal that is unambiguous without computing full oxidation
  // states: a species made of a single element is in its elemental form
  // (oxidation state 0). If that element is bound in a compound on the other
  // side, its oxidation state must have changed.
  const isFreeElement = (species: string): string | null => {
    const elements = Object.keys(parseFormula(species))
    return elements.length === 1 ? elements[0] : null
  }

  const boundElements = (side: string[]): Set<string> => {
    const bound = new Set<string>()
    for (const species of side) {
      const elements = Object.keys(parseFormula(species))
      if (elements.length > 1) elements.forEach((el) => bound.add(el))
    }
    return bound
  }

  const boundInProducts = boundElements(products)
  const boundInReactants = boundElements(reactants)

  for (const species of reactants) {
    const element = isFreeElement(species)
    if (element && boundInProducts.has(element)) return true
  }

  for (const species of products) {
    const element = isFreeElement(species)
    if (element && boundInReactants.has(element)) return true
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
