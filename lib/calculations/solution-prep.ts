// VerChem - Solution Preparation Calculator
// Dilution (C1V1=C2V2), Stock Preparation, Serial Dilution,
// Concentration Unit Conversion, Mixing Solutions

// ============================================
// TYPES
// ============================================

export type ConcentrationUnit =
  | 'mol/L'
  | 'mmol/L'
  | 'g/L'
  | 'mg/L'
  | 'ug/L'
  | 'pct_wv'
  | 'pct_ww'
  | 'pct_vv'
  | 'N'
  | 'ppm'
  | 'ppb'

export interface DilutionInput {
  c1?: number
  v1?: number
  c2?: number
  v2?: number
}

export interface DilutionResult {
  c1: number
  v1: number
  c2: number
  v2: number
  solvedFor: string
}

export interface StockPrepInput {
  targetConc: number
  targetVolume: number
  molarMass: number
  unit: ConcentrationUnit
}

export interface StockPrepResult {
  massNeeded: number
  steps: string[]
}

export interface SerialDilutionInput {
  initialConc: number
  dilutionFactor: number
  numDilutions: number
  transferVolume: number
}

export interface SerialDilutionStep {
  step: number
  concentration: number
  totalVolume: number
  transferVolume: number
  diluentVolume: number
}

export interface SerialDilutionResult {
  steps: SerialDilutionStep[]
}

export interface UnitConversionInput {
  value: number
  fromUnit: ConcentrationUnit
  toUnit: ConcentrationUnit
  molarMass?: number
  density?: number
  equivalents?: number
}

export interface UnitConversionResult {
  value: number
  fromUnit: ConcentrationUnit
  toUnit: ConcentrationUnit
  convertedValue: number
}

export interface MixingInput {
  c1: number
  v1: number
  c2: number
  v2: number
}

export interface MixingResult {
  finalConc: number
  finalVolume: number
}

// ============================================
// CONSTANTS
// ============================================

/** Human-readable labels for concentration units */
export const UNIT_LABELS: Record<ConcentrationUnit, string> = {
  'mol/L': 'mol/L (M)',
  'mmol/L': 'mmol/L (mM)',
  'g/L': 'g/L',
  'mg/L': 'mg/L',
  'ug/L': '\u00B5g/L',
  'pct_wv': '% w/v',
  'pct_ww': '% w/w',
  'pct_vv': '% v/v',
  'N': 'N (Normality)',
  'ppm': 'ppm',
  'ppb': 'ppb',
}

/** Short labels without parenthetical descriptions */
export const UNIT_SHORT_LABELS: Record<ConcentrationUnit, string> = {
  'mol/L': 'M',
  'mmol/L': 'mM',
  'g/L': 'g/L',
  'mg/L': 'mg/L',
  'ug/L': '\u00B5g/L',
  'pct_wv': '% w/v',
  'pct_ww': '% w/w',
  'pct_vv': '% v/v',
  'N': 'N',
  'ppm': 'ppm',
  'ppb': 'ppb',
}

// ============================================
// 1. DILUTION CALCULATOR (C1V1 = C2V2)
// ============================================

/**
 * Solve for the missing variable in C1V1 = C2V2.
 * Exactly one of the four values must be undefined.
 * All concentrations are in the same unit; all volumes are in the same unit.
 */
export function solveDilution(input: DilutionInput): DilutionResult {
  const { c1, v1, c2, v2 } = input
  const missing: string[] = []

  if (c1 === undefined) missing.push('c1')
  if (v1 === undefined) missing.push('v1')
  if (c2 === undefined) missing.push('c2')
  if (v2 === undefined) missing.push('v2')

  if (missing.length !== 1) {
    throw new Error('Exactly one value must be left blank to solve.')
  }

  // Validate provided values are positive
  if (c1 !== undefined && c1 < 0) throw new Error('C1 must be non-negative.')
  if (v1 !== undefined && v1 < 0) throw new Error('V1 must be non-negative.')
  if (c2 !== undefined && c2 < 0) throw new Error('C2 must be non-negative.')
  if (v2 !== undefined && v2 < 0) throw new Error('V2 must be non-negative.')

  const solvedFor = missing[0]

  switch (solvedFor) {
    case 'c1': {
      if (v1 === 0) throw new Error('V1 cannot be zero when solving for C1.')
      const result = (c2! * v2!) / v1!
      return { c1: result, v1: v1!, c2: c2!, v2: v2!, solvedFor }
    }
    case 'v1': {
      if (c1 === 0) throw new Error('C1 cannot be zero when solving for V1.')
      const result = (c2! * v2!) / c1!
      return { c1: c1!, v1: result, c2: c2!, v2: v2!, solvedFor }
    }
    case 'c2': {
      if (v2 === 0) throw new Error('V2 cannot be zero when solving for C2.')
      const result = (c1! * v1!) / v2!
      return { c1: c1!, v1: v1!, c2: result, v2: v2!, solvedFor }
    }
    case 'v2': {
      if (c2 === 0) throw new Error('C2 cannot be zero when solving for V2.')
      const result = (c1! * v1!) / c2!
      return { c1: c1!, v1: v1!, c2: c2!, v2: result, solvedFor }
    }
    default:
      throw new Error('Unexpected solve-for variable.')
  }
}

// ============================================
// 2. STOCK SOLUTION PREPARATION
// ============================================

/**
 * Calculate the mass of solute needed to prepare a solution of the
 * desired concentration and volume.
 *
 * Supports mol/L (molarity) and several mass-based units.
 * For molarity: mass = C (mol/L) * V (L) * M (g/mol)
 * For g/L: mass = C (g/L) * V (L)
 * For mg/L: mass = C (mg/L) * V (L) / 1000  (result in grams)
 * For % w/v: mass = C (g/100mL) * V (L) * 10
 */
export function calculateStockPrep(input: StockPrepInput): StockPrepResult {
  const { targetConc, targetVolume, molarMass, unit } = input

  if (targetConc <= 0) throw new Error('Target concentration must be positive.')
  if (targetVolume <= 0) throw new Error('Target volume must be positive.')
  if (molarMass <= 0) throw new Error('Molar mass must be positive.')

  let massNeeded: number // grams
  const steps: string[] = []

  switch (unit) {
    case 'mol/L': {
      // mass = M * C * V
      const moles = targetConc * targetVolume
      massNeeded = moles * molarMass
      steps.push(
        `Calculate moles needed: ${targetConc} mol/L \u00D7 ${targetVolume} L = ${formatNum(moles)} mol`
      )
      steps.push(
        `Calculate mass: ${formatNum(moles)} mol \u00D7 ${molarMass} g/mol = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'mmol/L': {
      const molesPerL = targetConc / 1000
      const moles = molesPerL * targetVolume
      massNeeded = moles * molarMass
      steps.push(
        `Convert to mol/L: ${targetConc} mmol/L = ${formatNum(molesPerL)} mol/L`
      )
      steps.push(
        `Calculate moles: ${formatNum(molesPerL)} mol/L \u00D7 ${targetVolume} L = ${formatNum(moles)} mol`
      )
      steps.push(
        `Calculate mass: ${formatNum(moles)} mol \u00D7 ${molarMass} g/mol = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'g/L': {
      massNeeded = targetConc * targetVolume
      steps.push(
        `Calculate mass: ${targetConc} g/L \u00D7 ${targetVolume} L = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'mg/L':
    case 'ppm': {
      massNeeded = (targetConc * targetVolume) / 1000
      steps.push(
        `Calculate mass: ${targetConc} mg/L \u00D7 ${targetVolume} L = ${formatNum(targetConc * targetVolume)} mg = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'ug/L':
    case 'ppb': {
      massNeeded = (targetConc * targetVolume) / 1e6
      steps.push(
        `Calculate mass: ${targetConc} \u00B5g/L \u00D7 ${targetVolume} L = ${formatNum(targetConc * targetVolume)} \u00B5g = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'pct_wv': {
      // % w/v = g per 100 mL = g per 0.1 L => g = (%w/v) * V(L) * 10
      massNeeded = targetConc * targetVolume * 10
      steps.push(
        `% w/v means ${targetConc} g per 100 mL`
      )
      steps.push(
        `Calculate mass: ${targetConc} g/100mL \u00D7 ${targetVolume} L \u00D7 1000 mL/L \u00D7 (1/100) = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'pct_ww': {
      // % w/w requires density to get solution mass; approximate with water density = 1 g/mL
      massNeeded = targetConc * targetVolume * 10 // approximate: 1 L ~ 1000 g solution
      steps.push(
        `% w/w means ${targetConc} g per 100 g of solution`
      )
      steps.push(
        `Approximation (density \u2248 1 g/mL): ${targetConc} g/100g \u00D7 ${targetVolume} L \u00D7 1000 g/L \u00D7 (1/100) = ${formatNum(massNeeded)} g`
      )
      break
    }
    case 'pct_vv': {
      // % v/v = mL per 100 mL; mass depends on density of solute
      // Return the volume needed instead, note in steps
      const volumeNeeded = targetConc * targetVolume * 10 // mL
      massNeeded = volumeNeeded // placeholder: mL of liquid solute
      steps.push(
        `% v/v means ${targetConc} mL per 100 mL of solution`
      )
      steps.push(
        `Volume of solute needed: ${targetConc} mL/100mL \u00D7 ${targetVolume * 1000} mL = ${formatNum(volumeNeeded)} mL`
      )
      steps.push(
        `Note: Result is in mL of liquid solute, not grams (multiply by solute density to get mass).`
      )
      break
    }
    case 'N': {
      // Normality = Molarity * equivalents; mass = N * V / eq * M
      // Without equivalents factor, assume 1
      const moles = targetConc * targetVolume // eq * L; assume eq factor = 1
      massNeeded = moles * molarMass
      steps.push(
        `Normality = Molarity \u00D7 equivalents factor`
      )
      steps.push(
        `Assuming equivalents factor = 1: moles = ${targetConc} N \u00D7 ${targetVolume} L = ${formatNum(moles)} mol`
      )
      steps.push(
        `Mass = ${formatNum(moles)} mol \u00D7 ${molarMass} g/mol = ${formatNum(massNeeded)} g`
      )
      steps.push(
        `Adjust if your compound has a different equivalents factor (e.g., H\u2082SO\u2084 = 2, H\u2083PO\u2084 = 3).`
      )
      break
    }
    default:
      throw new Error(`Unsupported unit: ${unit}`)
  }

  // Add preparation instructions
  steps.push('')
  steps.push('Preparation steps:')
  steps.push(`1. Weigh ${formatNum(massNeeded)} g of solute on an analytical balance.`)
  steps.push(`2. Transfer the solute to a ${formatVolume(targetVolume)} volumetric flask.`)
  steps.push(`3. Add distilled water to about 75% of the target volume and dissolve completely.`)
  steps.push(`4. Fill to the ${formatVolume(targetVolume)} mark with distilled water.`)
  steps.push(`5. Mix thoroughly by inverting several times.`)

  return { massNeeded, steps }
}

// ============================================
// 3. SERIAL DILUTION CALCULATOR
// ============================================

/**
 * Calculate a serial dilution series.
 *
 * @param input.initialConc - Starting concentration (any unit)
 * @param input.dilutionFactor - Factor for each dilution (e.g., 10 for 1:10)
 * @param input.numDilutions - Number of serial dilution steps
 * @param input.transferVolume - Volume transferred to the next tube (mL)
 */
export function calculateSerialDilution(input: SerialDilutionInput): SerialDilutionResult {
  const { initialConc, dilutionFactor, numDilutions, transferVolume } = input

  if (initialConc <= 0) throw new Error('Initial concentration must be positive.')
  if (dilutionFactor <= 1) throw new Error('Dilution factor must be greater than 1.')
  if (numDilutions < 1 || numDilutions > 50) throw new Error('Number of dilutions must be between 1 and 50.')
  if (transferVolume <= 0) throw new Error('Transfer volume must be positive.')

  const diluentVolume = transferVolume * (dilutionFactor - 1)
  const totalVolume = transferVolume + diluentVolume

  const steps: SerialDilutionStep[] = []

  // Step 0: the stock
  steps.push({
    step: 0,
    concentration: initialConc,
    totalVolume: 0, // stock, no mixing
    transferVolume: transferVolume,
    diluentVolume: 0,
  })

  let currentConc = initialConc

  for (let i = 1; i <= numDilutions; i++) {
    currentConc = currentConc / dilutionFactor
    steps.push({
      step: i,
      concentration: currentConc,
      totalVolume: totalVolume,
      transferVolume: i < numDilutions ? transferVolume : 0,
      diluentVolume: diluentVolume,
    })
  }

  return { steps }
}

// ============================================
// 4. CONCENTRATION UNIT CONVERTER
// ============================================

/**
 * Convert a concentration value between supported units.
 *
 * Conversion strategy: convert fromUnit -> mol/L (intermediate) -> toUnit.
 * Some conversions require molarMass and/or density.
 *
 * For ppm/ppb in dilute aqueous solutions:
 *   ppm ~ mg/L, ppb ~ ug/L (when solution density ~ 1 g/mL)
 *
 * For Normality: N = M * equivalents factor
 */
export function convertConcentration(input: UnitConversionInput): UnitConversionResult {
  const { value, fromUnit, toUnit, molarMass, density = 1.0, equivalents = 1 } = input

  if (value < 0) throw new Error('Concentration value must be non-negative.')

  if (fromUnit === toUnit) {
    return { value, fromUnit, toUnit, convertedValue: value }
  }

  // Check if molar mass is needed
  const needsMolarMass = unitNeedsMolarMass(fromUnit) || unitNeedsMolarMass(toUnit)
  if (needsMolarMass && (!molarMass || molarMass <= 0)) {
    throw new Error('Molar mass is required for this conversion.')
  }

  const needsDensity =
    fromUnit === 'pct_ww' || toUnit === 'pct_ww' ||
    fromUnit === 'pct_vv' || toUnit === 'pct_vv'
  if (needsDensity && (!density || density <= 0)) {
    throw new Error('Solution density is required for this conversion.')
  }

  // Step 1: Convert to g/L as an intermediate (more practical than mol/L for mass-based units)
  const gPerL = toGPerL(value, fromUnit, molarMass ?? 1, density, equivalents)

  // Step 2: Convert from g/L to target unit
  const convertedValue = fromGPerL(gPerL, toUnit, molarMass ?? 1, density, equivalents)

  return { value, fromUnit, toUnit, convertedValue }
}

/** Check whether a unit requires molar mass for conversion */
function unitNeedsMolarMass(unit: ConcentrationUnit): boolean {
  return unit === 'mol/L' || unit === 'mmol/L' || unit === 'N'
}

/**
 * Convert from any unit to g/L (intermediate).
 */
function toGPerL(
  value: number,
  unit: ConcentrationUnit,
  molarMass: number,
  density: number,
  equivalents: number
): number {
  switch (unit) {
    case 'mol/L':
      return value * molarMass
    case 'mmol/L':
      return (value / 1000) * molarMass
    case 'g/L':
      return value
    case 'mg/L':
    case 'ppm':
      return value / 1000
    case 'ug/L':
    case 'ppb':
      return value / 1e6
    case 'pct_wv':
      // % w/v = g per 100 mL = g per 0.1 L => g/L = %wv * 10
      return value * 10
    case 'pct_ww':
      // % w/w = g per 100 g solution; g/L = (%ww / 100) * density(g/mL) * 1000
      return (value / 100) * density * 1000
    case 'pct_vv':
      // % v/v = mL per 100 mL; g/L = (%vv / 100) * density(g/mL) * 1000
      // Here density refers to the solute density
      return (value / 100) * density * 1000
    case 'N':
      // N = M * eq; M = N / eq; g/L = M * molarMass
      return (value / equivalents) * molarMass
    default:
      throw new Error(`Unsupported unit: ${unit}`)
  }
}

/**
 * Convert from g/L (intermediate) to any target unit.
 */
function fromGPerL(
  gPerL: number,
  unit: ConcentrationUnit,
  molarMass: number,
  density: number,
  equivalents: number
): number {
  switch (unit) {
    case 'mol/L':
      return gPerL / molarMass
    case 'mmol/L':
      return (gPerL / molarMass) * 1000
    case 'g/L':
      return gPerL
    case 'mg/L':
    case 'ppm':
      return gPerL * 1000
    case 'ug/L':
    case 'ppb':
      return gPerL * 1e6
    case 'pct_wv':
      return gPerL / 10
    case 'pct_ww':
      // g/L = (%ww / 100) * density * 1000 => %ww = (g/L * 100) / (density * 1000)
      return (gPerL * 100) / (density * 1000)
    case 'pct_vv':
      return (gPerL * 100) / (density * 1000)
    case 'N':
      // g/L = (N / eq) * molarMass => N = (g/L / molarMass) * eq
      return (gPerL / molarMass) * equivalents
    default:
      throw new Error(`Unsupported unit: ${unit}`)
  }
}

// ============================================
// 5. MIXING SOLUTIONS
// ============================================

/**
 * Calculate the final concentration when two solutions are mixed.
 * Assumes the same solute and the same concentration unit.
 *
 * C_final = (C1*V1 + C2*V2) / (V1 + V2)
 */
export function calculateMixing(input: MixingInput): MixingResult {
  const { c1, v1, c2, v2 } = input

  if (v1 < 0) throw new Error('V1 must be non-negative.')
  if (v2 < 0) throw new Error('V2 must be non-negative.')
  if (c1 < 0) throw new Error('C1 must be non-negative.')
  if (c2 < 0) throw new Error('C2 must be non-negative.')

  const finalVolume = v1 + v2
  if (finalVolume === 0) throw new Error('Total volume cannot be zero.')

  const finalConc = (c1 * v1 + c2 * v2) / finalVolume

  return { finalConc, finalVolume }
}

// ============================================
// HELPERS
// ============================================

/** Format a number to a reasonable number of significant figures */
function formatNum(n: number): string {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 100) return n.toFixed(2)
  if (abs >= 1) return n.toFixed(4)
  if (abs >= 0.001) return n.toFixed(6)
  return n.toExponential(4)
}

/** Format volume in liters to a human-readable string */
function formatVolume(liters: number): string {
  if (liters >= 1) return `${liters} L`
  return `${liters * 1000} mL`
}
