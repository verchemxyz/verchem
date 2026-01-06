/**
 * VerChem - Uncertainty Propagation Module
 *
 * Pure functions for scientific error propagation following GUM
 * (Guide to the Expression of Uncertainty in Measurement)
 *
 * @see ISO/IEC Guide 98-3:2008
 */

/**
 * Calculate relative uncertainty (σ_rel = σ/x)
 */
export function relativeUncertainty(value: number, uncertainty: number): number {
  if (value === 0) return 0
  return Math.abs(uncertainty / value)
}

/**
 * Calculate absolute uncertainty from relative uncertainty
 */
export function absoluteUncertainty(value: number, relativeUnc: number): number {
  return Math.abs(relativeUnc * value)
}

/**
 * Propagate uncertainty for division: z = x / y
 * Formula: σ_z/z = sqrt((σ_x/x)² + (σ_y/y)²)
 *
 * @example
 * // n = m / M (moles = mass / molar mass)
 * const result = propagateDivision(180.16, 0.01, 180.16, 0.01)
 * // result.relativeUncertainty ≈ 0.000078
 */
export function propagateDivision(
  numerator: number,
  numeratorUnc: number,
  denominator: number,
  denominatorUnc: number
): { value: number; uncertainty: number; relativeUncertainty: number } {
  const value = numerator / denominator

  const relNumerator = relativeUncertainty(numerator, numeratorUnc)
  const relDenominator = relativeUncertainty(denominator, denominatorUnc)

  const relUnc = Math.sqrt(
    Math.pow(relNumerator, 2) + Math.pow(relDenominator, 2)
  )

  return {
    value,
    uncertainty: absoluteUncertainty(value, relUnc),
    relativeUncertainty: relUnc
  }
}

/**
 * Propagate uncertainty for multiplication: z = x × y
 * Formula: σ_z/z = sqrt((σ_x/x)² + (σ_y/y)²)
 *
 * @example
 * // m = n × M (mass = moles × molar mass)
 * const result = propagateMultiplication(1.0, 0.01, 180.16, 0.01)
 */
export function propagateMultiplication(
  factor1: number,
  factor1Unc: number,
  factor2: number,
  factor2Unc: number
): { value: number; uncertainty: number; relativeUncertainty: number } {
  const value = factor1 * factor2

  const relFactor1 = relativeUncertainty(factor1, factor1Unc)
  const relFactor2 = relativeUncertainty(factor2, factor2Unc)

  const relUnc = Math.sqrt(
    Math.pow(relFactor1, 2) + Math.pow(relFactor2, 2)
  )

  return {
    value,
    uncertainty: absoluteUncertainty(value, relUnc),
    relativeUncertainty: relUnc
  }
}

/**
 * Propagate uncertainty when multiplying by a constant (exact value)
 * Formula: σ_z = |k| × σ_x
 *
 * @example
 * // N = n × NA (molecules = moles × Avogadro's constant)
 * // NA is exact, so uncertainty only comes from n
 * const result = propagateConstantMultiplication(1.0, 0.01, 6.022e23)
 */
export function propagateConstantMultiplication(
  value: number,
  valueUnc: number,
  constant: number
): { value: number; uncertainty: number; relativeUncertainty: number } {
  const result = value * constant
  const relUnc = relativeUncertainty(value, valueUnc)

  return {
    value: result,
    uncertainty: absoluteUncertainty(result, relUnc),
    relativeUncertainty: relUnc
  }
}

/**
 * Propagate uncertainty when dividing by a constant (exact value)
 * Formula: σ_z = σ_x / |k|
 *
 * @example
 * // n = V / 22.414 (moles = volume / molar volume at STP)
 * const result = propagateConstantDivision(22.414, 0.01, 22.414)
 */
export function propagateConstantDivision(
  value: number,
  valueUnc: number,
  constant: number
): { value: number; uncertainty: number; relativeUncertainty: number } {
  const result = value / constant
  const relUnc = relativeUncertainty(value, valueUnc)

  return {
    value: result,
    uncertainty: absoluteUncertainty(result, relUnc),
    relativeUncertainty: relUnc
  }
}

/**
 * Propagate uncertainty for addition: z = x + y
 * Formula: σ_z = sqrt(σ_x² + σ_y²)
 */
export function propagateAddition(
  value1: number,
  unc1: number,
  value2: number,
  unc2: number
): { value: number; uncertainty: number } {
  const value = value1 + value2
  const uncertainty = Math.sqrt(Math.pow(unc1, 2) + Math.pow(unc2, 2))

  return { value, uncertainty }
}

/**
 * Propagate uncertainty for subtraction: z = x - y
 * Formula: σ_z = sqrt(σ_x² + σ_y²)
 */
export function propagateSubtraction(
  value1: number,
  unc1: number,
  value2: number,
  unc2: number
): { value: number; uncertainty: number } {
  const value = value1 - value2
  const uncertainty = Math.sqrt(Math.pow(unc1, 2) + Math.pow(unc2, 2))

  return { value, uncertainty }
}

/**
 * Calculate expanded uncertainty with coverage factor
 * For 95% confidence level, k ≈ 2
 * For 99% confidence level, k ≈ 2.576
 *
 * @param standardUncertainty - Standard uncertainty (1σ)
 * @param coverageFactor - Coverage factor k (default: 2 for 95% CI)
 */
export function expandedUncertainty(
  standardUncertainty: number,
  coverageFactor: number = 2
): number {
  return standardUncertainty * coverageFactor
}

/**
 * Format value with uncertainty in scientific notation
 *
 * @example
 * formatWithUncertainty(1.2345, 0.0067) // "1.235 ± 0.007"
 */
export function formatWithUncertainty(
  value: number,
  uncertainty: number,
  significantFigures: number = 3
): string {
  if (uncertainty === 0) {
    return value.toPrecision(significantFigures)
  }

  // Determine decimal places based on uncertainty magnitude
  const uncMagnitude = Math.floor(Math.log10(Math.abs(uncertainty)))
  const decimalPlaces = Math.max(0, -uncMagnitude + 1)

  return `${value.toFixed(decimalPlaces)} ± ${uncertainty.toFixed(decimalPlaces)}`
}

// Type for uncertainty result
export interface UncertaintyResult {
  value: number
  uncertainty: number
  relativeUncertainty: number
}

// Convenient aliases for stoichiometry calculations
export const uncertaintyForMassToMoles = propagateDivision
export const uncertaintyForMolesToMass = propagateMultiplication
export const uncertaintyForMolesToMolecules = propagateConstantMultiplication
export const uncertaintyForMoleculesToMoles = propagateConstantDivision
export const uncertaintyForMolesToVolume = propagateConstantMultiplication
export const uncertaintyForVolumeToMoles = propagateConstantDivision
