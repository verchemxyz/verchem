// VerChem - Solution Chemistry Calculations
// Molarity, pH, buffers, dilution

/**
 * Colligative property constants for water
 */
export const WATER_KB = 0.512 // °C/m - Boiling point elevation constant
export const WATER_KF = 1.86 // °C/m - Freezing point depression constant
export const WATER_NORMAL_BP = 100 // °C - Normal boiling point
export const WATER_NORMAL_FP = 0 // °C - Normal freezing point

/**
 * Calculate molarity (M = mol/L)
 */
export function calculateMolarity(
  moles?: number,
  volumeLiters?: number,
  massGrams?: number,
  molarMass?: number
): number {
  if (moles !== undefined && volumeLiters !== undefined) {
    return moles / volumeLiters
  }

  if (massGrams !== undefined && molarMass !== undefined && volumeLiters !== undefined) {
    const moles = massGrams / molarMass
    return moles / volumeLiters
  }

  throw new Error('Insufficient parameters to calculate molarity')
}

/**
 * Calculate molality (m = mol/kg solvent)
 */
export function calculateMolality(
  moles: number,
  solventMassKg: number
): number {
  return moles / solventMassKg
}

/**
 * Calculate mass percent
 */
export function calculateMassPercent(
  soluteMass: number,
  solutionMass: number
): number {
  return (soluteMass / solutionMass) * 100
}

/**
 * Calculate ppm (parts per million)
 */
export function calculatePPM(
  soluteMass: number, // mg
  solutionVolume: number // L
): number {
  return soluteMass / solutionVolume
}

/**
 * pH Calculations
 */

/**
 * Calculate pH from H+ concentration
 */
export function calculatePH(H_concentration: number): number {
  if (H_concentration <= 0) {
    throw new Error('H+ concentration must be positive')
  }
  return -Math.log10(H_concentration)
}

/**
 * Calculate H+ concentration from pH
 */
export function calculateH_Concentration(pH: number): number {
  return Math.pow(10, -pH)
}

/**
 * Calculate pOH from OH- concentration
 */
export function calculatePOH(OH_concentration: number): number {
  if (OH_concentration <= 0) {
    throw new Error('OH- concentration must be positive')
  }
  return -Math.log10(OH_concentration)
}

/**
 * Calculate OH- concentration from pOH
 */
export function calculateOH_Concentration(pOH: number): number {
  return Math.pow(10, -pOH)
}

/**
 * Convert between pH and pOH (at 25°C)
 */
export function pHToPOH(pH: number): number {
  return 14 - pH
}

export function pOHToPH(pOH: number): number {
  return 14 - pOH
}

export interface StrongAcidOptions {
  formula?: string
  protonCount?: number
}

export interface StrongBaseOptions {
  formula?: string
  hydroxideCount?: number
}

const STRONG_ACID_PROTON_COUNTS: Record<string, number> = {
  HCl: 1,
  HNO3: 1,
  HBr: 1,
  HI: 1,
  HClO4: 1,
  H2SO4: 2,
}

const STRONG_ACID_SECOND_DISSOCIATION_KA: Record<string, number> = {
  H2SO4: 1.2e-2,
}

const STRONG_BASE_HYDROXIDE_COUNTS: Record<string, number> = {
  NaOH: 1,
  KOH: 1,
  LiOH: 1,
  'Ca(OH)2': 2,
  'Ba(OH)2': 2,
}

function normalizeFormula(formula: string): string {
  const subscriptMap: Record<string, string> = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  }
  return formula
    .replace(/\s+/g, '')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (match) => subscriptMap[match] ?? match)
}

function solveWithWaterAutoIonization(addedConcentration: number, kw: number): number {
  const value = Math.max(addedConcentration, 0)
  return 0.5 * (value + Math.sqrt(value * value + 4 * kw))
}

function calculateStrongAcidHydrogen(
  concentration: number,
  options?: StrongAcidOptions
): number {
  if (concentration <= 0) return 0
  if (options?.protonCount !== undefined) {
    return concentration * Math.max(options.protonCount, 0)
  }

  const normalized = options?.formula ? normalizeFormula(options.formula) : ''
  if (normalized && STRONG_ACID_SECOND_DISSOCIATION_KA[normalized]) {
    const Ka2 = STRONG_ACID_SECOND_DISSOCIATION_KA[normalized]
    const b = concentration + Ka2
    const discriminant = b * b + 4 * Ka2 * concentration
    const x = (-b + Math.sqrt(discriminant)) / 2
    return concentration + Math.max(0, x)
  }

  const protonCount = normalized ? STRONG_ACID_PROTON_COUNTS[normalized] ?? 1 : 1
  return concentration * protonCount
}

function calculateStrongBaseHydroxide(
  concentration: number,
  options?: StrongBaseOptions
): number {
  if (concentration <= 0) return 0
  if (options?.hydroxideCount !== undefined) {
    return concentration * Math.max(options.hydroxideCount, 0)
  }

  const normalized = options?.formula ? normalizeFormula(options.formula) : ''
  const hydroxideCount = normalized ? STRONG_BASE_HYDROXIDE_COUNTS[normalized] ?? 1 : 1
  return concentration * hydroxideCount
}

/**
 * Strong acid pH calculation
 */
export function calculateStrongAcidPH(
  concentration: number,
  options?: StrongAcidOptions
): {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
} {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new Error('Concentration must be a finite, non-negative number')
  }

  const strongHydrogen = calculateStrongAcidHydrogen(concentration, options)
  const H_concentration = solveWithWaterAutoIonization(strongHydrogen, KW_25C)
  const pH = calculatePH(H_concentration)
  const OH_concentration = KW_25C / H_concentration
  const pOH = calculatePOH(OH_concentration)

  return { pH, pOH, H_concentration, OH_concentration }
}

/**
 * Strong base pH calculation
 */
export function calculateStrongBasePH(
  concentration: number,
  options?: StrongBaseOptions
): {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
} {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new Error('Concentration must be a finite, non-negative number')
  }

  const strongHydroxide = calculateStrongBaseHydroxide(concentration, options)
  const OH_concentration = solveWithWaterAutoIonization(strongHydroxide, KW_25C)
  const pOH = calculatePOH(OH_concentration)
  const H_concentration = KW_25C / OH_concentration
  const pH = calculatePH(H_concentration)

  return { pH, pOH, H_concentration, OH_concentration }
}

/**
 * Weak acid pH calculation (using Ka)
 * Uses approximation for weak acids (Ka << C), or quadratic formula for stronger weak acids
 */
export function calculateWeakAcidPH(
  concentration: number,
  Ka: number
): {
  pH: number
  H_concentration: number
  percentIonization: number
  method?: 'approximation' | 'quadratic'
  warning?: string
} {
  // HA ⇌ H+ + A-
  // Ka = [H+][A-]/[HA]
  // Assuming x = [H+] = [A-]

  // First, try approximation: Ka ≈ x²/C (valid when ionization < 5%)
  const x_approx = Math.sqrt(Ka * concentration)
  const percentIonization_approx = (x_approx / concentration) * 100

  // Check if approximation is valid (5% rule)
  if (percentIonization_approx <= 5) {
    // Approximation is valid
    const pH = calculatePH(x_approx)
    return {
      pH,
      H_concentration: x_approx,
      percentIonization: percentIonization_approx,
      method: 'approximation'
    }
  }

  // Approximation invalid, use quadratic formula
  // Ka = x²/(C-x)
  // Ka(C-x) = x²
  // KaC - Kax = x²
  // x² + Kax - KaC = 0
  // Using quadratic formula: x = (-b ± √(b²-4ac)) / 2a
  // where a=1, b=Ka, c=-Ka*C

  const a = 1
  const b = Ka
  const c = -Ka * concentration

  const discriminant = b * b - 4 * a * c
  const x_accurate = (-b + Math.sqrt(discriminant)) / (2 * a)

  const pH = calculatePH(x_accurate)
  const percentIonization = (x_accurate / concentration) * 100

  return {
    pH,
    H_concentration: x_accurate,
    percentIonization,
    method: 'quadratic',
    warning: `Significant ionization (${percentIonization.toFixed(1)}%) - used quadratic formula for accuracy`
  }
}

/**
 * Weak base pH calculation (using Kb)
 * Uses approximation for weak bases (Kb << C), or quadratic formula for stronger weak bases
 */
export function calculateWeakBasePH(
  concentration: number,
  Kb: number
): {
  pH: number
  pOH: number
  OH_concentration: number
  percentIonization: number
  method?: 'approximation' | 'quadratic'
  warning?: string
} {
  // B + H2O ⇌ BH+ + OH-
  // Kb = [BH+][OH-]/[B]
  // Assuming x = [OH-] = [BH+]

  // First, try approximation: Kb ≈ x²/C (valid when ionization < 5%)
  const x_approx = Math.sqrt(Kb * concentration)
  const percentIonization_approx = (x_approx / concentration) * 100

  // Check if approximation is valid (5% rule)
  if (percentIonization_approx <= 5) {
    // Approximation is valid
    const pOH = calculatePOH(x_approx)
    const pH = 14 - pOH
    return {
      pH,
      pOH,
      OH_concentration: x_approx,
      percentIonization: percentIonization_approx,
      method: 'approximation'
    }
  }

  // Approximation invalid, use quadratic formula
  // Kb = x²/(C-x)
  // x² + Kbx - KbC = 0
  const a = 1
  const b = Kb
  const c = -Kb * concentration

  const discriminant = b * b - 4 * a * c
  const x_accurate = (-b + Math.sqrt(discriminant)) / (2 * a)

  const pOH = calculatePOH(x_accurate)
  const pH = 14 - pOH
  const percentIonization = (x_accurate / concentration) * 100

  return {
    pH,
    pOH,
    OH_concentration: x_accurate,
    percentIonization,
    method: 'quadratic',
    warning: `Significant ionization (${percentIonization.toFixed(1)}%) - used quadratic formula for accuracy`
  }
}

/**
 * Calculate pH using pKa
 */
export function calculatePHFromPKa(
  concentration: number,
  pKa: number
): number {
  const Ka = Math.pow(10, -pKa)
  const result = calculateWeakAcidPH(concentration, Ka)
  return result.pH
}

/**
 * Henderson-Hasselbalch equation (for buffers)
 */
export function hendersonHasselbalch(
  pKa: number,
  acidConcentration: number,
  baseConcentration: number
): number {
  // pH = pKa + log([A-]/[HA])
  return pKa + Math.log10(baseConcentration / acidConcentration)
}

/**
 * Calculate buffer capacity
 */
export function calculateBufferCapacity(
  totalConcentration: number,
  pH: number,
  pKa: number
): number {
  // β = 2.303 × C × Ka × [H+] / (Ka + [H+])²
  const Ka = Math.pow(10, -pKa)
  const H = Math.pow(10, -pH)

  return 2.303 * totalConcentration * Ka * H / Math.pow(Ka + H, 2)
}

/**
 * Dilution calculations (M1V1 = M2V2)
 */
export interface DilutionInput {
  M1?: number // initial molarity
  V1?: number // initial volume
  M2?: number // final molarity
  V2?: number // final volume
}

export interface DilutionResult {
  M1: number
  V1: number
  M2: number
  V2: number
  volumeToAdd: number
  dilutionFactor: number
}

export function calculateDilution(input: DilutionInput): DilutionResult {
  const { M1, V1, M2, V2 } = input

  // Solve for missing variable
  if (M1 !== undefined && V1 !== undefined && M2 !== undefined && V2 === undefined) {
    const finalV2 = (M1 * V1) / M2
    return {
      M1,
      V1,
      M2,
      V2: finalV2,
      volumeToAdd: finalV2 - V1,
      dilutionFactor: M1 / M2,
    }
  }

  if (M1 !== undefined && V1 !== undefined && M2 === undefined && V2 !== undefined) {
    const finalM2 = (M1 * V1) / V2
    return {
      M1,
      V1,
      M2: finalM2,
      V2,
      volumeToAdd: V2 - V1,
      dilutionFactor: M1 / finalM2,
    }
  }

  if (M1 !== undefined && V1 === undefined && M2 !== undefined && V2 !== undefined) {
    const finalV1 = (M2 * V2) / M1
    return {
      M1,
      V1: finalV1,
      M2,
      V2,
      volumeToAdd: V2 - finalV1,
      dilutionFactor: M1 / M2,
    }
  }

  if (M1 === undefined && V1 !== undefined && M2 !== undefined && V2 !== undefined) {
    const finalM1 = (M2 * V2) / V1
    return {
      M1: finalM1,
      V1,
      M2,
      V2,
      volumeToAdd: V2 - V1,
      dilutionFactor: finalM1 / M2,
    }
  }

  throw new Error('Need exactly 3 of 4 parameters (M1, V1, M2, V2)')
}

/**
 * Osmotic pressure calculation (van't Hoff equation)
 */
export function calculateOsmoticPressure(
  molarity: number,
  temperature: number, // Kelvin
  vanTHoffFactor: number = 1 // i (number of particles)
): number {
  // π = iMRT
  const R = 0.08206 // L·atm/(mol·K)
  return vanTHoffFactor * molarity * R * temperature
}

/**
 * Colligative properties
 */

/**
 * Boiling point elevation
 */
export function calculateBoilingPointElevation(
  molality: number,
  Kb: number, // boiling point elevation constant
  vanTHoffFactor: number = 1
): number {
  // ΔTb = i × Kb × m
  return vanTHoffFactor * Kb * molality
}

/**
 * Freezing point depression
 */
export function calculateFreezingPointDepression(
  molality: number,
  Kf: number, // freezing point depression constant
  vanTHoffFactor: number = 1
): number {
  // ΔTf = i × Kf × m
  return vanTHoffFactor * Kf * molality
}

/**
 * Common solution preparation examples
 */
export const SOLUTION_EXAMPLES = [
  {
    name: 'Prepare 1 M NaCl solution',
    problem: 'How to prepare 500 mL of 1 M NaCl solution?',
    solution: {
      formula: 'NaCl',
      targetMolarity: 1,
      targetVolume: 0.5, // L
      steps: [
        'Calculate molar mass of NaCl: 58.44 g/mol',
        'Calculate moles needed: 1 M × 0.5 L = 0.5 mol',
        'Calculate mass needed: 0.5 mol × 58.44 g/mol = 29.22 g',
        'Procedure:',
        '1. Weigh 29.22 g of NaCl',
        '2. Add to volumetric flask',
        '3. Add water to dissolve',
        '4. Add water to 500 mL mark',
      ],
      answer: '29.22 g NaCl in 500 mL water',
    },
  },
  {
    name: 'pH of strong acid',
    problem: 'What is the pH of 0.01 M HCl?',
    solution: {
      type: 'strong-acid',
      concentration: 0.01,
      steps: [
        'HCl is a strong acid → complete dissociation',
        '[H+] = 0.01 M',
        'pH = -log[H+] = -log(0.01) = 2',
      ],
      answer: 'pH = 2',
    },
  },
  {
    name: 'Buffer preparation',
    problem: 'Prepare acetate buffer at pH 4.76',
    solution: {
      type: 'buffer',
      pKa: 4.76,
      targetPH: 4.76,
      steps: [
        'Use acetic acid (CH3COOH) and sodium acetate (CH3COONa)',
        'pKa of acetic acid = 4.76',
        'Henderson-Hasselbalch: pH = pKa + log([A-]/[HA])',
        '4.76 = 4.76 + log([A-]/[HA])',
        'log([A-]/[HA]) = 0',
        '[A-]/[HA] = 1 (equal concentrations)',
        'Mix equal molar amounts of acid and conjugate base',
      ],
      answer: 'Mix equal volumes of 0.1 M acetic acid and 0.1 M sodium acetate',
    },
  },
]

/**
 * Common Ka and Kb values
 */
export const ACID_KA_VALUES = {
  'H2SO4': 1e3, // Strong (first proton)
  'HCl': 1e7, // Strong
  'HNO3': 2.4e1, // Strong
  'H3PO4': 7.5e-3, // Weak (first proton)
  'CH3COOH': 1.8e-5, // Acetic acid
  'HF': 6.8e-4, // Hydrofluoric acid
  'HNO2': 4.0e-4, // Nitrous acid
  'H2CO3': 4.3e-7, // Carbonic acid (first proton)
  'H2S': 1.0e-7, // Hydrogen sulfide (first proton)
  'NH4+': 5.6e-10, // Ammonium
}

export const BASE_KB_VALUES = {
  'NH3': 1.8e-5, // Ammonia
  'CH3NH2': 4.4e-4, // Methylamine
  'C5H5N': 1.7e-9, // Pyridine
  'NaOH': 1e14, // Strong
  'KOH': 1e14, // Strong
  'Ca(OH)2': 1e14, // Strong
}

/**
 * Common PKa values
 */
export const PKA_VALUES = {
  'CH3COOH': 4.76, // Acetic acid
  'H3PO4': 2.12, // Phosphoric acid (first)
  'HF': 3.17, // Hydrofluoric acid
  'HNO2': 3.40, // Nitrous acid
  'H2CO3': 6.37, // Carbonic acid (first)
  'NH4+': 9.25, // Ammonium
  'H2O': 15.74, // Water (as acid)
}

/**
 * Water constants
 */
export const KW_25C = 1.0e-14 // Water autoionization at 25°C
export const NEUTRAL_PH = 7.0 // Neutral pH at 25°C

/**
 * Type aliases for UI
 */
export type MolarityResult = number

export type PHResult = {
  pH: number
  pOH?: number
  H_concentration?: number
  OH_concentration?: number
  percentIonization?: number
}

/**
 * Helper arrays for UI dropdowns
 */
export const STRONG_ACIDS = Object.keys(ACID_KA_VALUES).filter(
  (acid) => ACID_KA_VALUES[acid as keyof typeof ACID_KA_VALUES] > 1
)

export const STRONG_BASES = Object.keys(BASE_KB_VALUES).filter(
  (base) => BASE_KB_VALUES[base as keyof typeof BASE_KB_VALUES] > 1e10
)

export const WEAK_ACIDS = Object.keys(ACID_KA_VALUES).filter(
  (acid) => ACID_KA_VALUES[acid as keyof typeof ACID_KA_VALUES] <= 1
)

/**
 * Alias for buffer pH calculation
 */
export const calculateBufferPH = hendersonHasselbalch
