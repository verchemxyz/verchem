// VerChem - Error Analysis and Uncertainty Propagation
// Professional-grade uncertainty calculations for research use

/**
 * Measurement with uncertainty
 */
export interface MeasurementWithUncertainty {
  value: number
  uncertainty: number
  relative?: number // Relative uncertainty (fraction)
  unit?: string
  confidence?: number // Confidence level (default 95%)
}

/**
 * Calculate relative uncertainty
 */
export function calculateRelativeUncertainty(measurement: MeasurementWithUncertainty): number {
  if (measurement.relative) return measurement.relative
  if (measurement.value === 0) return 0
  return Math.abs(measurement.uncertainty / measurement.value)
}

/**
 * Propagate uncertainty for addition/subtraction
 * δ(A ± B) = √(δA² + δB²)
 */
export function propagateAdditionUncertainty(
  measurements: MeasurementWithUncertainty[]
): number {
  const sumOfSquares = measurements.reduce(
    (sum, m) => sum + Math.pow(m.uncertainty, 2),
    0
  )
  return Math.sqrt(sumOfSquares)
}

/**
 * Propagate uncertainty for multiplication/division
 * δ(A×B)/|A×B| = √((δA/A)² + (δB/B)²)
 */
export function propagateMultiplicationUncertainty(
  measurements: MeasurementWithUncertainty[],
  result: number
): number {
  const sumOfRelativeSquares = measurements.reduce(
    (sum, m) => sum + Math.pow(calculateRelativeUncertainty(m), 2),
    0
  )
  return Math.abs(result) * Math.sqrt(sumOfRelativeSquares)
}

/**
 * Propagate uncertainty for power functions
 * δ(A^n) = |n| × A^n × (δA/A)
 */
export function propagatePowerUncertainty(
  measurement: MeasurementWithUncertainty,
  power: number
): number {
  const relativeUncertainty = calculateRelativeUncertainty(measurement)
  const result = Math.pow(measurement.value, power)
  return Math.abs(power * result * relativeUncertainty)
}

/**
 * Propagate uncertainty for logarithmic functions
 * δ(ln(A)) = δA/A
 */
export function propagateLogUncertainty(
  measurement: MeasurementWithUncertainty
): number {
  return measurement.uncertainty / Math.abs(measurement.value)
}

/**
 * Propagate uncertainty for exponential functions
 * δ(e^A) = e^A × δA
 */
export function propagateExpUncertainty(
  measurement: MeasurementWithUncertainty
): number {
  const result = Math.exp(measurement.value)
  return result * measurement.uncertainty
}

/**
 * Calculate pH uncertainty from H+ concentration uncertainty
 */
export function calculatePHUncertainty(
  hConcentration: MeasurementWithUncertainty
): MeasurementWithUncertainty {
  const pH = -Math.log10(hConcentration.value)

  // δpH = 0.434 × (δ[H+]/[H+])
  const uncertainty = 0.434 * calculateRelativeUncertainty(hConcentration)

  return {
    value: pH,
    uncertainty,
    relative: uncertainty / Math.abs(pH),
  }
}

/**
 * Calculate ideal gas law uncertainty
 * PV = nRT
 */
export function calculateIdealGasUncertainty(
  pressure: MeasurementWithUncertainty,
  volume: MeasurementWithUncertainty,
  moles: MeasurementWithUncertainty,
  temperature: MeasurementWithUncertainty,
  gasConstant: MeasurementWithUncertainty
): {
  [key: string]: MeasurementWithUncertainty
} {
  // Calculate each variable with uncertainty

  // V = nRT/P
  const volumeCalc = (moles.value * gasConstant.value * temperature.value) / pressure.value
  const volumeUncertainty = propagateMultiplicationUncertainty(
    [
      moles,
      gasConstant,
      temperature,
      { value: 1/pressure.value, uncertainty: pressure.uncertainty/Math.pow(pressure.value, 2) }
    ],
    volumeCalc
  )

  // P = nRT/V
  const pressureCalc = (moles.value * gasConstant.value * temperature.value) / volume.value
  const pressureUncertainty = propagateMultiplicationUncertainty(
    [
      moles,
      gasConstant,
      temperature,
      { value: 1/volume.value, uncertainty: volume.uncertainty/Math.pow(volume.value, 2) }
    ],
    pressureCalc
  )

  // n = PV/RT
  const molesCalc = (pressure.value * volume.value) / (gasConstant.value * temperature.value)
  const molesUncertainty = propagateMultiplicationUncertainty(
    [
      pressure,
      volume,
      { value: 1/(gasConstant.value * temperature.value),
        uncertainty: propagateMultiplicationUncertainty([gasConstant, temperature], gasConstant.value * temperature.value) / Math.pow(gasConstant.value * temperature.value, 2) }
    ],
    molesCalc
  )

  // T = PV/nR
  const tempCalc = (pressure.value * volume.value) / (moles.value * gasConstant.value)
  const tempUncertainty = propagateMultiplicationUncertainty(
    [
      pressure,
      volume,
      { value: 1/(moles.value * gasConstant.value),
        uncertainty: propagateMultiplicationUncertainty([moles, gasConstant], moles.value * gasConstant.value) / Math.pow(moles.value * gasConstant.value, 2) }
    ],
    tempCalc
  )

  return {
    pressure: { value: pressureCalc, uncertainty: pressureUncertainty },
    volume: { value: volumeCalc, uncertainty: volumeUncertainty },
    moles: { value: molesCalc, uncertainty: molesUncertainty },
    temperature: { value: tempCalc, uncertainty: tempUncertainty },
  }
}

/**
 * Calculate cell potential uncertainty
 * E = E°cathode - E°anode
 */
export function calculateCellPotentialUncertainty(
  cathodePotential: MeasurementWithUncertainty,
  anodePotential: MeasurementWithUncertainty
): MeasurementWithUncertainty {
  const cellPotential = cathodePotential.value - anodePotential.value
  const uncertainty = propagateAdditionUncertainty([cathodePotential, anodePotential])

  return {
    value: cellPotential,
    uncertainty,
    relative: uncertainty / Math.abs(cellPotential),
    unit: 'V',
  }
}

/**
 * Calculate equilibrium constant uncertainty
 * K = e^(-ΔG°/RT)
 */
export function calculateEquilibriumConstantUncertainty(
  deltaG: MeasurementWithUncertainty, // J/mol
  temperature: MeasurementWithUncertainty, // K
  gasConstant: MeasurementWithUncertainty // J/(mol·K)
): MeasurementWithUncertainty {
  const RT = gasConstant.value * temperature.value
  const RTUncertainty = propagateMultiplicationUncertainty([gasConstant, temperature], RT)

  const exponent = -deltaG.value / RT
  const exponentUncertainty = propagateMultiplicationUncertainty(
    [
      deltaG,
      { value: 1/RT, uncertainty: RTUncertainty/Math.pow(RT, 2) }
    ],
    Math.abs(exponent)
  )

  const K = Math.exp(exponent)
  const KUncertainty = K * exponentUncertainty

  return {
    value: K,
    uncertainty: KUncertainty,
    relative: KUncertainty / K,
  }
}

/**
 * Format value with uncertainty using appropriate notation
 */
export function formatValueWithUncertainty(
  measurement: MeasurementWithUncertainty,
  sigFigs: number = 2
): string {
  const { value, uncertainty, unit } = measurement

  // Determine the order of magnitude of uncertainty
  if (uncertainty === 0) {
    return unit ? `${value} ${unit}` : String(value)
  }

  const uncertaintyMagnitude = Math.floor(Math.log10(Math.abs(uncertainty)))
  const valueMagnitude = Math.floor(Math.log10(Math.abs(value)))

  // Use scientific notation for very large or small numbers
  if (valueMagnitude >= 4 || valueMagnitude <= -3) {
    const scaledValue = value / Math.pow(10, valueMagnitude)
    const scaledUncertainty = uncertainty / Math.pow(10, valueMagnitude)

    const formattedValue = scaledValue.toFixed(sigFigs)
    const formattedUncertainty = scaledUncertainty.toFixed(sigFigs)

    const unitStr = unit ? ` ${unit}` : ''
    return `(${formattedValue} ± ${formattedUncertainty}) × 10^${valueMagnitude}${unitStr}`
  }

  // Regular notation
  const decimalPlaces = Math.max(0, -uncertaintyMagnitude + sigFigs - 1)
  const formattedValue = value.toFixed(decimalPlaces)
  const formattedUncertainty = uncertainty.toFixed(decimalPlaces)

  const unitStr = unit ? ` ${unit}` : ''
  return `${formattedValue} ± ${formattedUncertainty}${unitStr}`
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(
  measurement: MeasurementWithUncertainty,
  confidenceLevel: number = 0.95
): {
  lower: number
  upper: number
  confidence: number
} {
  // For normal distribution, use z-scores
  const zScores: { [key: number]: number } = {
    0.68: 1.0,   // 68% confidence
    0.90: 1.645, // 90% confidence
    0.95: 1.96,  // 95% confidence
    0.99: 2.576, // 99% confidence
    0.997: 3.0,  // 99.7% confidence
  }

  const z = zScores[confidenceLevel] || 1.96 // Default to 95%
  const margin = z * measurement.uncertainty

  return {
    lower: measurement.value - margin,
    upper: measurement.value + margin,
    confidence: confidenceLevel,
  }
}

/**
 * Combine multiple measurements (weighted average)
 */
export function combineMeasurements(
  measurements: MeasurementWithUncertainty[]
): MeasurementWithUncertainty {
  // Weighted average where weight = 1/uncertainty²
  let sumWeightedValues = 0
  let sumWeights = 0

  for (const m of measurements) {
    const weight = 1 / Math.pow(m.uncertainty, 2)
    sumWeightedValues += m.value * weight
    sumWeights += weight
  }

  const combinedValue = sumWeightedValues / sumWeights
  const combinedUncertainty = Math.sqrt(1 / sumWeights)

  return {
    value: combinedValue,
    uncertainty: combinedUncertainty,
    relative: combinedUncertainty / Math.abs(combinedValue),
  }
}

/**
 * Example error analysis for different calculation types
 */
export const ERROR_ANALYSIS_EXAMPLES = {
  pH: {
    description: 'pH calculation with uncertainty',
    example: () => {
      const hConcentration: MeasurementWithUncertainty = {
        value: 1.0e-4,
        uncertainty: 5.0e-6,
        unit: 'M',
      }

      const pH = calculatePHUncertainty(hConcentration)
      return formatValueWithUncertainty(pH)
    },
    expected: '4.00 ± 0.02',
  },

  idealGas: {
    description: 'Ideal gas law with uncertainties',
    example: () => {
      const pressure: MeasurementWithUncertainty = {
        value: 1.00,
        uncertainty: 0.01,
        unit: 'atm',
      }
      const temperature: MeasurementWithUncertainty = {
        value: 298.15,
        uncertainty: 0.1,
        unit: 'K',
      }
      const moles: MeasurementWithUncertainty = {
        value: 1.00,
        uncertainty: 0.01,
        unit: 'mol',
      }
      const gasConstant: MeasurementWithUncertainty = {
        value: 0.08206,
        uncertainty: 0.00001,
        unit: 'L·atm/(mol·K)',
      }

      const result = calculateIdealGasUncertainty(
        pressure,
        { value: 0, uncertainty: 0 }, // Volume unknown
        moles,
        temperature,
        gasConstant
      )

      return formatValueWithUncertainty({ ...result.volume, unit: 'L' })
    },
    expected: '24.47 ± 0.25 L',
  },

  cellPotential: {
    description: 'Cell potential with electrode uncertainties',
    example: () => {
      const cathode: MeasurementWithUncertainty = {
        value: 0.7996,
        uncertainty: 0.0003,
        unit: 'V',
      }
      const anode: MeasurementWithUncertainty = {
        value: -0.7618,
        uncertainty: 0.0004,
        unit: 'V',
      }

      const cellPotential = calculateCellPotentialUncertainty(cathode, anode)
      return formatValueWithUncertainty(cellPotential, 4)
    },
    expected: '1.5614 ± 0.0005 V',
  },
}

/**
 * Professional uncertainty statement for reports
 */
export function generateUncertaintyStatement(
  calculationType: string,
  measurement: MeasurementWithUncertainty,
  confidence: number = 0.95
): string {
  const interval = calculateConfidenceInterval(measurement, confidence)
  const percentUncertainty = (calculateRelativeUncertainty(measurement) * 100).toFixed(1)

  return `The ${calculationType} is ${formatValueWithUncertainty(measurement)} ` +
         `(${percentUncertainty}% relative uncertainty). ` +
         `With ${confidence * 100}% confidence, the true value lies between ` +
         `${interval.lower.toFixed(3)} and ${interval.upper.toFixed(3)}${measurement.unit ? ' ' + measurement.unit : ''}.`
}