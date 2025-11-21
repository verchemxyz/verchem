// VerChem - Significant Figures Utilities
// Handle scientific precision and formatting

/**
 * Count significant figures in a number
 */
export function countSigFigs(value: number | string): number {
  const str = String(value).trim()

  // Remove scientific notation if present
  let cleanStr = str.replace(/e[+-]?\d+$/i, '')

  // Remove sign
  cleanStr = cleanStr.replace(/^[+-]/, '')

  // Count sig figs
  let sigFigs = 0
  let pastDecimal = false
  let nonZeroFound = false

  for (const char of cleanStr) {
    if (char === '.') {
      pastDecimal = true
      continue
    }

    if (char >= '0' && char <= '9') {
      if (char !== '0') {
        nonZeroFound = true
        sigFigs++
      } else if (nonZeroFound) {
        // Trailing zeros after non-zero digit count
        sigFigs++
      } else if (pastDecimal) {
        // Leading zeros after decimal don't count
        continue
      }
    }
  }

  return sigFigs || 1 // Minimum 1 sig fig
}

/**
 * Format number with specific significant figures
 */
export function formatWithSigFigs(value: number, sigFigs: number): string {
  if (!isFinite(value)) return String(value)
  if (value === 0) return '0'
  if (sigFigs < 1) sigFigs = 1

  const absValue = Math.abs(value)

  // Determine magnitude
  const magnitude = Math.floor(Math.log10(absValue))

  // Use scientific notation for very large or very small numbers
  if (magnitude >= 6 || magnitude < -3) {
    const mantissa = value / Math.pow(10, magnitude)
    const rounded = Number(mantissa.toPrecision(sigFigs))
    return `${rounded}e${magnitude >= 0 ? '+' : ''}${magnitude}`
  }

  // Use decimal notation
  if (magnitude >= 0) {
    // Number >= 1
    const decimals = Math.max(0, sigFigs - magnitude - 1)
    return value.toFixed(decimals)
  } else {
    // Number < 1
    const decimals = sigFigs + Math.abs(magnitude) - 1
    return value.toFixed(decimals)
  }
}

/**
 * Determine appropriate sig figs for calculation result
 * Based on the rule: result has same sig figs as least precise input
 */
export function determineSigFigs(...inputs: (number | string)[]): number {
  const sigFigCounts = inputs
    .filter(input => input !== undefined && input !== null && input !== '')
    .map(countSigFigs)

  if (sigFigCounts.length === 0) return 4 // Default

  return Math.min(...sigFigCounts)
}

/**
 * Format calculation result with appropriate precision
 */
export function formatResult(value: number, ...inputs: (number | string)[]): string {
  const sigFigs = determineSigFigs(...inputs)
  return formatWithSigFigs(value, sigFigs)
}

/**
 * Examples and tests
 */
export const SIGNIFICANT_FIGURES_EXAMPLES = {
  // countSigFigs examples
  counting: [
    { input: '123', output: 3 },
    { input: '1.23', output: 3 },
    { input: '0.123', output: 3 }, // Leading zeros don't count
    { input: '1.230', output: 4 }, // Trailing zeros count
    { input: '100', output: 1 }, // Ambiguous, assume 1
    { input: '1.00e2', output: 3 }, // Scientific notation
    { input: '0.00123', output: 3 },
  ],

  // formatWithSigFigs examples
  formatting: [
    { value: 123.456, sigFigs: 3, output: '123' },
    { value: 123.456, sigFigs: 4, output: '123.5' },
    { value: 0.0012345, sigFigs: 3, output: '0.00123' },
    { value: 1234567, sigFigs: 3, output: '1.23e+6' },
    { value: 0.0000012345, sigFigs: 3, output: '1.23e-6' },
  ],
}
