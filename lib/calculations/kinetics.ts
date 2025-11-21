// VerChem - Chemical Kinetics Calculator
// Rate Laws, Arrhenius Equation, Half-Life, Activation Energy

/**
 * Rate Law Types
 */
export type RateOrder = 'zero' | 'first' | 'second'

/**
 * Rate Law Result
 */
export interface RateLawResult {
  order: RateOrder
  k: number // Rate constant
  concentration: number // [A] at time t
  time: number
  halfLife: number
  steps: string[]
}

/**
 * Arrhenius Result
 */
export interface ArrheniusResult {
  k: number // Rate constant at temperature T
  A: number // Pre-exponential factor
  Ea: number // Activation energy (J/mol)
  temperature: number // K
  steps: string[]
}

/**
 * Activation Energy Result
 */
export interface ActivationEnergyResult {
  Ea: number // J/mol
  EaKJ: number // kJ/mol
  A: number // Pre-exponential factor
  steps: string[]
}

/**
 * Constants
 */
export const GAS_CONSTANT = 8.314 // J/(mol·K)
export const STANDARD_TEMPERATURE = 298.15 // K (25°C)

/**
 * Calculate concentration at time t using integrated rate laws
 */
export function calculateConcentration(
  order: RateOrder,
  initialConcentration: number, // [A]₀ (M)
  k: number, // Rate constant
  time: number // seconds
): RateLawResult {
  const steps: string[] = []
  steps.push(`=== ${order.charAt(0).toUpperCase() + order.slice(1)} Order Rate Law ===\n`)

  let concentration = 0
  let halfLife = 0

  if (order === 'zero') {
    // Zero order: [A] = [A]₀ - kt
    steps.push('Zero Order Integrated Rate Law:')
    steps.push('[A] = [A]₀ - kt\n')
    steps.push('Given:')
    steps.push(`  [A]₀ = ${initialConcentration.toFixed(4)} M`)
    steps.push(`  k = ${k.toExponential(4)} M/s`)
    steps.push(`  t = ${time.toFixed(2)} s\n`)

    concentration = initialConcentration - k * time

    steps.push('Calculation:')
    steps.push(`[A] = ${initialConcentration.toFixed(4)} - (${k.toExponential(4)} × ${time.toFixed(2)})`)
    steps.push(`[A] = ${concentration.toFixed(4)} M\n`)

    // Half-life: t₁/₂ = [A]₀/(2k)
    halfLife = initialConcentration / (2 * k)
    steps.push('Half-Life:')
    steps.push('t₁/₂ = [A]₀/(2k)')
    steps.push(`t₁/₂ = ${initialConcentration.toFixed(4)}/(2 × ${k.toExponential(4)})`)
    steps.push(`t₁/₂ = ${halfLife.toFixed(2)} s`)

    if (concentration < 0) {
      steps.push('\n⚠️ Warning: Concentration is negative! Reaction is complete.')
      concentration = 0
    }

  } else if (order === 'first') {
    // First order: ln[A] = ln[A]₀ - kt  →  [A] = [A]₀ × e^(-kt)
    steps.push('First Order Integrated Rate Law:')
    steps.push('ln[A] = ln[A]₀ - kt')
    steps.push('[A] = [A]₀ × e^(-kt)\n')
    steps.push('Given:')
    steps.push(`  [A]₀ = ${initialConcentration.toFixed(4)} M`)
    steps.push(`  k = ${k.toExponential(4)} s⁻¹`)
    steps.push(`  t = ${time.toFixed(2)} s\n`)

    concentration = initialConcentration * Math.exp(-k * time)

    steps.push('Calculation:')
    steps.push(`ln[A] = ln(${initialConcentration.toFixed(4)}) - (${k.toExponential(4)} × ${time.toFixed(2)})`)
    steps.push(`ln[A] = ${Math.log(initialConcentration).toFixed(4)} - ${(k * time).toFixed(4)}`)
    steps.push(`ln[A] = ${Math.log(concentration).toFixed(4)}`)
    steps.push(`[A] = ${concentration.toFixed(4)} M\n`)

    // Half-life: t₁/₂ = ln(2)/k = 0.693/k
    halfLife = Math.LN2 / k
    steps.push('Half-Life:')
    steps.push('t₁/₂ = ln(2)/k = 0.693/k')
    steps.push(`t₁/₂ = ${Math.LN2.toFixed(3)}/${k.toExponential(4)}`)
    steps.push(`t₁/₂ = ${halfLife.toFixed(2)} s`)
    steps.push('(Note: Half-life is CONSTANT for first-order reactions!)')

  } else if (order === 'second') {
    // Second order: 1/[A] = 1/[A]₀ + kt  →  [A] = 1/(1/[A]₀ + kt)
    steps.push('Second Order Integrated Rate Law:')
    steps.push('1/[A] = 1/[A]₀ + kt')
    steps.push('[A] = 1/(1/[A]₀ + kt)\n')
    steps.push('Given:')
    steps.push(`  [A]₀ = ${initialConcentration.toFixed(4)} M`)
    steps.push(`  k = ${k.toExponential(4)} M⁻¹s⁻¹`)
    steps.push(`  t = ${time.toFixed(2)} s\n`)

    concentration = 1 / (1 / initialConcentration + k * time)

    steps.push('Calculation:')
    steps.push(`1/[A] = 1/${initialConcentration.toFixed(4)} + (${k.toExponential(4)} × ${time.toFixed(2)})`)
    steps.push(`1/[A] = ${(1/initialConcentration).toFixed(4)} + ${(k * time).toFixed(4)}`)
    steps.push(`1/[A] = ${(1/concentration).toFixed(4)}`)
    steps.push(`[A] = ${concentration.toFixed(4)} M\n`)

    // Half-life: t₁/₂ = 1/(k[A]₀)
    halfLife = 1 / (k * initialConcentration)
    steps.push('Half-Life:')
    steps.push('t₁/₂ = 1/(k[A]₀)')
    steps.push(`t₁/₂ = 1/(${k.toExponential(4)} × ${initialConcentration.toFixed(4)})`)
    steps.push(`t₁/₂ = ${halfLife.toFixed(2)} s`)
    steps.push('(Note: Half-life DECREASES as reaction proceeds for second-order!)')
  }

  return {
    order,
    k,
    concentration,
    time,
    halfLife,
    steps,
  }
}

/**
 * Calculate rate constant at time t using integrated rate laws
 */
export function calculateRateConstant(
  order: RateOrder,
  initialConcentration: number, // [A]₀ (M)
  finalConcentration: number, // [A] (M)
  time: number // seconds
): { k: number; steps: string[] } | null {
  const steps: string[] = []
  steps.push(`Calculating Rate Constant (k) for ${order} order reaction\n`)

  if (time <= 0) {
    steps.push('❌ Error: Time must be greater than 0')
    return null
  }

  if (finalConcentration > initialConcentration) {
    steps.push('❌ Error: Final concentration cannot exceed initial concentration')
    return null
  }

  let k = 0

  if (order === 'zero') {
    // [A] = [A]₀ - kt  →  k = ([A]₀ - [A])/t
    steps.push('Zero Order: k = ([A]₀ - [A])/t\n')
    steps.push('Given:')
    steps.push(`  [A]₀ = ${initialConcentration.toFixed(4)} M`)
    steps.push(`  [A] = ${finalConcentration.toFixed(4)} M`)
    steps.push(`  t = ${time.toFixed(2)} s\n`)

    k = (initialConcentration - finalConcentration) / time

    steps.push('Calculation:')
    steps.push(`k = (${initialConcentration.toFixed(4)} - ${finalConcentration.toFixed(4)})/${time.toFixed(2)}`)
    steps.push(`k = ${k.toExponential(4)} M/s`)

  } else if (order === 'first') {
    // ln[A] = ln[A]₀ - kt  →  k = (ln[A]₀ - ln[A])/t
    steps.push('First Order: k = (ln[A]₀ - ln[A])/t\n')
    steps.push('Given:')
    steps.push(`  [A]₀ = ${initialConcentration.toFixed(4)} M`)
    steps.push(`  [A] = ${finalConcentration.toFixed(4)} M`)
    steps.push(`  t = ${time.toFixed(2)} s\n`)

    if (finalConcentration <= 0) {
      steps.push('❌ Error: Final concentration must be greater than 0 for first order')
      return null
    }

    k = (Math.log(initialConcentration) - Math.log(finalConcentration)) / time

    steps.push('Calculation:')
    steps.push(`k = (ln(${initialConcentration.toFixed(4)}) - ln(${finalConcentration.toFixed(4)}))/${time.toFixed(2)}`)
    steps.push(`k = (${Math.log(initialConcentration).toFixed(4)} - ${Math.log(finalConcentration).toFixed(4)})/${time.toFixed(2)}`)
    steps.push(`k = ${k.toExponential(4)} s⁻¹`)

  } else if (order === 'second') {
    // 1/[A] = 1/[A]₀ + kt  →  k = (1/[A] - 1/[A]₀)/t
    steps.push('Second Order: k = (1/[A] - 1/[A]₀)/t\n')
    steps.push('Given:')
    steps.push(`  [A]₀ = ${initialConcentration.toFixed(4)} M`)
    steps.push(`  [A] = ${finalConcentration.toFixed(4)} M`)
    steps.push(`  t = ${time.toFixed(2)} s\n`)

    if (finalConcentration <= 0) {
      steps.push('❌ Error: Final concentration must be greater than 0 for second order')
      return null
    }

    k = (1/finalConcentration - 1/initialConcentration) / time

    steps.push('Calculation:')
    steps.push(`k = (1/${finalConcentration.toFixed(4)} - 1/${initialConcentration.toFixed(4)})/${time.toFixed(2)}`)
    steps.push(`k = (${(1/finalConcentration).toFixed(4)} - ${(1/initialConcentration).toFixed(4)})/${time.toFixed(2)}`)
    steps.push(`k = ${k.toExponential(4)} M⁻¹s⁻¹`)
  }

  return { k, steps }
}

/**
 * Calculate rate constant using Arrhenius equation
 * k = A × e^(-Ea/RT)
 */
export function arrheniusEquation(
  A: number, // Pre-exponential factor (same units as k)
  Ea: number, // Activation energy (J/mol)
  temperature: number // K
): ArrheniusResult {
  const steps: string[] = []
  steps.push('=== Arrhenius Equation ===\n')
  steps.push('k = A × e^(-Ea/RT)\n')
  steps.push('Given:')
  steps.push(`  A = ${A.toExponential(4)} (pre-exponential factor)`)
  steps.push(`  Ea = ${Ea.toFixed(2)} J/mol = ${(Ea/1000).toFixed(2)} kJ/mol`)
  steps.push(`  T = ${temperature.toFixed(2)} K = ${(temperature - 273.15).toFixed(2)}°C`)
  steps.push(`  R = ${GAS_CONSTANT} J/(mol·K)\n`)

  const exponent = -Ea / (GAS_CONSTANT * temperature)
  const k = A * Math.exp(exponent)

  steps.push('Calculation:')
  steps.push(`k = ${A.toExponential(4)} × e^(-${Ea.toFixed(2)} / (${GAS_CONSTANT} × ${temperature.toFixed(2)}))`)
  steps.push(`k = ${A.toExponential(4)} × e^(${exponent.toFixed(4)})`)
  steps.push(`k = ${A.toExponential(4)} × ${Math.exp(exponent).toExponential(4)}`)
  steps.push(`k = ${k.toExponential(4)}`)

  if (k < A * 0.01) {
    steps.push('\n✓ Low temperature: Reaction is slow (k << A)')
  } else if (k > A * 0.9) {
    steps.push('\n✓ High temperature: Reaction is fast (k ≈ A)')
  }

  return { k, A, Ea, temperature, steps }
}

/**
 * Calculate activation energy from two temperatures
 * ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)
 */
export function calculateActivationEnergy(
  k1: number, // Rate constant at T₁
  T1: number, // Temperature 1 (K)
  k2: number, // Rate constant at T₂
  T2: number // Temperature 2 (K)
): ActivationEnergyResult | null {
  const steps: string[] = []
  steps.push('=== Calculate Activation Energy ===\n')
  steps.push('Using two-temperature Arrhenius equation:')
  steps.push('ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂)\n')

  if (k1 <= 0 || k2 <= 0) {
    steps.push('❌ Error: Rate constants must be positive')
    return null
  }

  if (T1 <= 0 || T2 <= 0) {
    steps.push('❌ Error: Temperatures must be positive (in Kelvin)')
    return null
  }

  steps.push('Given:')
  steps.push(`  k₁ = ${k1.toExponential(4)} at T₁ = ${T1.toFixed(2)} K (${(T1 - 273.15).toFixed(2)}°C)`)
  steps.push(`  k₂ = ${k2.toExponential(4)} at T₂ = ${T2.toFixed(2)} K (${(T2 - 273.15).toFixed(2)}°C)`)
  steps.push(`  R = ${GAS_CONSTANT} J/(mol·K)\n`)

  const lnRatio = Math.log(k2 / k1)
  const tempTerm = 1/T1 - 1/T2
  const Ea = (lnRatio * GAS_CONSTANT) / tempTerm
  const EaKJ = Ea / 1000

  steps.push('Calculation:')
  steps.push(`ln(k₂/k₁) = ln(${k2.toExponential(4)}/${k1.toExponential(4)})`)
  steps.push(`ln(k₂/k₁) = ${lnRatio.toFixed(4)}\n`)

  steps.push(`1/T₁ - 1/T₂ = 1/${T1.toFixed(2)} - 1/${T2.toFixed(2)}`)
  steps.push(`1/T₁ - 1/T₂ = ${(1/T1).toExponential(4)} - ${(1/T2).toExponential(4)}`)
  steps.push(`1/T₁ - 1/T₂ = ${tempTerm.toExponential(4)}\n`)

  steps.push(`Ea = ln(k₂/k₁) × R / (1/T₁ - 1/T₂)`)
  steps.push(`Ea = ${lnRatio.toFixed(4)} × ${GAS_CONSTANT} / ${tempTerm.toExponential(4)}`)
  steps.push(`Ea = ${Ea.toFixed(2)} J/mol`)
  steps.push(`Ea = ${EaKJ.toFixed(2)} kJ/mol\n`)

  // Calculate A (pre-exponential factor) using k₁
  const A = k1 / Math.exp(-Ea / (GAS_CONSTANT * T1))
  steps.push('Pre-exponential factor (A):')
  steps.push(`Using k₁ = A × e^(-Ea/RT₁)`)
  steps.push(`A = k₁ / e^(-Ea/RT₁)`)
  steps.push(`A = ${A.toExponential(4)}`)

  if (Ea < 0) {
    steps.push('\n⚠️ Warning: Negative activation energy! Check your data.')
  } else if (Ea < 10000) {
    steps.push('\n✓ Low activation energy: Fast reaction')
  } else if (Ea > 200000) {
    steps.push('\n✓ High activation energy: Slow reaction, very temperature sensitive')
  }

  return { Ea, EaKJ, A, steps }
}

/**
 * Determine reaction order from concentration-time data
 */
export function determineReactionOrder(
  data: { time: number; concentration: number }[]
): { order: RateOrder; k: number; r2: number; steps: string[] } | null {
  const steps: string[] = []
  steps.push('=== Determine Reaction Order ===\n')

  if (data.length < 3) {
    steps.push('❌ Error: Need at least 3 data points')
    return null
  }

  steps.push('Testing three integrated rate law plots:\n')

  // Test zero order: [A] vs t (should be linear)
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  const n = data.length

  for (const point of data) {
    sumX += point.time
    sumY += point.concentration
    sumXY += point.time * point.concentration
    sumX2 += point.time * point.time
  }

  const slopeZero = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const interceptZero = (sumY - slopeZero * sumX) / n

  // Calculate R² for zero order
  let ssResZero = 0, ssTotZero = 0
  const meanY = sumY / n
  for (const point of data) {
    const predicted = slopeZero * point.time + interceptZero
    ssResZero += Math.pow(point.concentration - predicted, 2)
    ssTotZero += Math.pow(point.concentration - meanY, 2)
  }
  const r2Zero = 1 - (ssResZero / ssTotZero)

  steps.push(`1. Zero Order ([A] vs t):`)
  steps.push(`   R² = ${r2Zero.toFixed(4)}`)
  steps.push(`   k = -slope = ${Math.abs(slopeZero).toExponential(4)} M/s\n`)

  // Test first order: ln[A] vs t (should be linear)
  sumX = 0; sumY = 0; sumXY = 0; sumX2 = 0
  const lnData: number[] = []

  for (const point of data) {
    if (point.concentration <= 0) {
      steps.push('❌ Error: Cannot take ln of zero or negative concentration')
      return null
    }
    const lnConc = Math.log(point.concentration)
    lnData.push(lnConc)
    sumX += point.time
    sumY += lnConc
    sumXY += point.time * lnConc
    sumX2 += point.time * point.time
  }

  const slopeFirst = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const interceptFirst = (sumY - slopeFirst * sumX) / n

  // Calculate R² for first order
  let ssResFirst = 0, ssTotFirst = 0
  const meanLn = sumY / n
  for (let i = 0; i < data.length; i++) {
    const predicted = slopeFirst * data[i].time + interceptFirst
    ssResFirst += Math.pow(lnData[i] - predicted, 2)
    ssTotFirst += Math.pow(lnData[i] - meanLn, 2)
  }
  const r2First = 1 - (ssResFirst / ssTotFirst)

  steps.push(`2. First Order (ln[A] vs t):`)
  steps.push(`   R² = ${r2First.toFixed(4)}`)
  steps.push(`   k = -slope = ${Math.abs(slopeFirst).toExponential(4)} s⁻¹\n`)

  // Test second order: 1/[A] vs t (should be linear)
  sumX = 0; sumY = 0; sumXY = 0; sumX2 = 0
  const invData: number[] = []

  for (const point of data) {
    if (point.concentration <= 0) {
      steps.push('❌ Error: Cannot take 1/[A] of zero concentration')
      return null
    }
    const invConc = 1 / point.concentration
    invData.push(invConc)
    sumX += point.time
    sumY += invConc
    sumXY += point.time * invConc
    sumX2 += point.time * point.time
  }

  const slopeSecond = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const interceptSecond = (sumY - slopeSecond * sumX) / n

  // Calculate R² for second order
  let ssResSecond = 0, ssTotSecond = 0
  const meanInv = sumY / n
  for (let i = 0; i < data.length; i++) {
    const predicted = slopeSecond * data[i].time + interceptSecond
    ssResSecond += Math.pow(invData[i] - predicted, 2)
    ssTotSecond += Math.pow(invData[i] - meanInv, 2)
  }
  const r2Second = 1 - (ssResSecond / ssTotSecond)

  steps.push(`3. Second Order (1/[A] vs t):`)
  steps.push(`   R² = ${r2Second.toFixed(4)}`)
  steps.push(`   k = slope = ${slopeSecond.toExponential(4)} M⁻¹s⁻¹\n`)

  // Determine best fit
  const orders = [
    { order: 'zero' as RateOrder, r2: r2Zero, k: Math.abs(slopeZero) },
    { order: 'first' as RateOrder, r2: r2First, k: Math.abs(slopeFirst) },
    { order: 'second' as RateOrder, r2: r2Second, k: slopeSecond },
  ]

  orders.sort((a, b) => b.r2 - a.r2)
  const best = orders[0]

  steps.push('Conclusion:')
  steps.push(`Best fit: ${best.order.toUpperCase()} ORDER (R² = ${best.r2.toFixed(4)})`)
  steps.push(`Rate constant k = ${best.k.toExponential(4)}`)

  if (best.r2 > 0.99) {
    steps.push('✓ Excellent fit!')
  } else if (best.r2 > 0.95) {
    steps.push('✓ Good fit')
  } else if (best.r2 > 0.90) {
    steps.push('⚠️ Moderate fit - check data quality')
  } else {
    steps.push('⚠️ Poor fit - reaction may be complex/multi-step')
  }

  return {
    order: best.order,
    k: best.k,
    r2: best.r2,
    steps,
  }
}

/**
 * Example kinetics problems
 */
export const EXAMPLE_KINETICS = [
  {
    name: 'First Order Decay',
    description: 'Radioactive decay of C-14',
    order: 'first' as RateOrder,
    initialConcentration: 1.0,
    k: 1.21e-4, // yr⁻¹ (half-life = 5730 years)
    time: 5730,
  },
  {
    name: 'Second Order Reaction',
    description: '2NO₂ → 2NO + O₂',
    order: 'second' as RateOrder,
    initialConcentration: 0.01,
    k: 0.543, // M⁻¹s⁻¹
    time: 100,
  },
  {
    name: 'Zero Order Decomposition',
    description: '2N₂O₅ → 4NO₂ + O₂ (on surface)',
    order: 'zero' as RateOrder,
    initialConcentration: 0.1,
    k: 1.0e-5, // M/s
    time: 3600,
  },
]

/**
 * Example Arrhenius problems
 */
export const EXAMPLE_ARRHENIUS = [
  {
    name: 'Typical Organic Reaction',
    A: 1.0e13,
    Ea: 75000, // J/mol = 75 kJ/mol
    temperature: 298.15,
  },
  {
    name: 'Enzyme Catalysis',
    A: 1.0e8,
    Ea: 25000, // J/mol = 25 kJ/mol (low Ea due to catalyst)
    temperature: 310.15, // 37°C (body temperature)
  },
  {
    name: 'High-Temperature Combustion',
    A: 1.0e14,
    Ea: 150000, // J/mol = 150 kJ/mol
    temperature: 1000, // 1000 K
  },
]
