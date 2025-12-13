// VerChem - Gas Laws Calculations
// Ideal gas law, combined gas law, partial pressures

// Import CODATA 2018 precise constants
import { GAS_CONSTANT } from '@/lib/constants/physical-constants'

// SECURITY: Physical limits to prevent unrealistic calculations (Dec 2025 - 4-AI Audit)
const PHYSICAL_LIMITS = {
  // Temperature: 0K to 10^8 K (stellar interiors)
  MIN_TEMPERATURE: 0.001, // Just above absolute zero
  MAX_TEMPERATURE: 1e8, // Stellar temperatures
  // Pressure: vacuum to neutron star surface
  MIN_PRESSURE: 1e-15, // Near perfect vacuum
  MAX_PRESSURE: 1e15, // Neutron star surface
  // Volume: atomic to astronomical
  MIN_VOLUME: 1e-30, // Subatomic
  MAX_VOLUME: 1e30, // Astronomical
  // Moles: single molecules to massive amounts
  MIN_MOLES: 1e-24, // Single molecule
  MAX_MOLES: 1e15, // Industrial scale
}

/**
 * Validate gas law inputs are within physical limits
 */
function validateGasInput(name: string, value: number | undefined, min: number, max: number): void {
  if (value === undefined) return
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
  if (value < min || value > max) {
    throw new Error(`${name} (${value}) is outside physical limits [${min}, ${max}]`)
  }
}

/**
 * Convert temperature units
 */
export function celsiusToKelvin(celsius: number): number {
  return celsius + 273.15
}

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15
}

export function fahrenheitToKelvin(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9 + 273.15
}

export function kelvinToFahrenheit(kelvin: number): number {
  return (kelvin - 273.15) * 9/5 + 32
}

/**
 * Convert pressure units
 */
export function atmToKPa(atm: number): number {
  return atm * 101.325
}

export function kPaToAtm(kPa: number): number {
  return kPa / 101.325
}

export function atmToMmHg(atm: number): number {
  return atm * 760
}

export function mmHgToAtm(mmHg: number): number {
  return mmHg / 760
}

export function atmToBar(atm: number): number {
  return atm * 1.01325
}

export function barToAtm(bar: number): number {
  return bar / 1.01325
}

export function atmToPsi(atm: number): number {
  return atm * 14.696
}

export function psiToAtm(psi: number): number {
  return psi / 14.696
}

/**
 * Ideal Gas Law: PV = nRT
 */
export interface IdealGasInput {
  P?: number // Pressure (atm)
  V?: number // Volume (L)
  n?: number // Moles (mol)
  T?: number // Temperature (K)
  R?: number // Gas constant (default: 0.08206 L·atm/(mol·K))
}

export interface IdealGasResult {
  P: number
  V: number
  n: number
  T: number
  R: number
}

export function idealGasLaw(input: IdealGasInput): IdealGasResult {
  const R = input.R || GAS_CONSTANT.atm
  const { P, V, n, T } = input

  // SECURITY: Validate inputs are within physical limits
  validateGasInput('Pressure', P, PHYSICAL_LIMITS.MIN_PRESSURE, PHYSICAL_LIMITS.MAX_PRESSURE)
  validateGasInput('Volume', V, PHYSICAL_LIMITS.MIN_VOLUME, PHYSICAL_LIMITS.MAX_VOLUME)
  validateGasInput('Moles', n, PHYSICAL_LIMITS.MIN_MOLES, PHYSICAL_LIMITS.MAX_MOLES)
  validateGasInput('Temperature', T, PHYSICAL_LIMITS.MIN_TEMPERATURE, PHYSICAL_LIMITS.MAX_TEMPERATURE)

  // Solve for missing variable
  if (P === undefined && V !== undefined && n !== undefined && T !== undefined) {
    const result = (n * R * T) / V
    validateGasInput('Calculated Pressure', result, PHYSICAL_LIMITS.MIN_PRESSURE, PHYSICAL_LIMITS.MAX_PRESSURE)
    return { P: result, V, n, T, R }
  }

  if (P !== undefined && V === undefined && n !== undefined && T !== undefined) {
    const result = (n * R * T) / P
    validateGasInput('Calculated Volume', result, PHYSICAL_LIMITS.MIN_VOLUME, PHYSICAL_LIMITS.MAX_VOLUME)
    return { P, V: result, n, T, R }
  }

  if (P !== undefined && V !== undefined && n === undefined && T !== undefined) {
    const result = (P * V) / (R * T)
    validateGasInput('Calculated Moles', result, PHYSICAL_LIMITS.MIN_MOLES, PHYSICAL_LIMITS.MAX_MOLES)
    return { P, V, n: result, T, R }
  }

  if (P !== undefined && V !== undefined && n !== undefined && T === undefined) {
    const result = (P * V) / (n * R)
    validateGasInput('Calculated Temperature', result, PHYSICAL_LIMITS.MIN_TEMPERATURE, PHYSICAL_LIMITS.MAX_TEMPERATURE)
    return { P, V, n, T: result, R }
  }

  throw new Error('Need exactly 3 of 4 parameters (P, V, n, T)')
}

/**
 * Combined Gas Law: (P1V1)/T1 = (P2V2)/T2
 */
export interface CombinedGasInput {
  P1?: number
  V1?: number
  T1?: number
  P2?: number
  V2?: number
  T2?: number
}

export interface CombinedGasResult {
  P1: number
  V1: number
  T1: number
  P2: number
  V2: number
  T2: number
}

export function combinedGasLaw(input: CombinedGasInput): CombinedGasResult {
  const { P1, V1, T1, P2, V2, T2 } = input

  // Count known variables
  const known = [P1, V1, T1, P2, V2, T2].filter(v => v !== undefined).length

  if (known !== 5) {
    throw new Error('Need exactly 5 of 6 parameters')
  }

  // Solve for missing variable
  if (P1 === undefined) {
    return { P1: (P2! * V2! * T1!) / (V1! * T2!), V1: V1!, T1: T1!, P2: P2!, V2: V2!, T2: T2! }
  }
  if (V1 === undefined) {
    return { P1: P1!, V1: (P2! * V2! * T1!) / (P1! * T2!), T1: T1!, P2: P2!, V2: V2!, T2: T2! }
  }
  if (T1 === undefined) {
    return { P1: P1!, V1: V1!, T1: (P1! * V1! * T2!) / (P2! * V2!), P2: P2!, V2: V2!, T2: T2! }
  }
  if (P2 === undefined) {
    return { P1: P1!, V1: V1!, T1: T1!, P2: (P1! * V1! * T2!) / (V2! * T1!), V2: V2!, T2: T2! }
  }
  if (V2 === undefined) {
    return { P1: P1!, V1: V1!, T1: T1!, P2: P2!, V2: (P1! * V1! * T2!) / (P2! * T1!), T2: T2! }
  }
  if (T2 === undefined) {
    return { P1: P1!, V1: V1!, T1: T1!, P2: P2!, V2: V2!, T2: (P2! * V2! * T1!) / (P1! * V1!) }
  }

  throw new Error('Invalid parameters')
}

/**
 * Boyle's Law: P1V1 = P2V2 (at constant T, n)
 */
export function boylesLaw(P1?: number, V1?: number, P2?: number, V2?: number) {
  if (P1 !== undefined && V1 !== undefined && P2 !== undefined && V2 === undefined) {
    return { P1, V1, P2, V2: (P1 * V1) / P2 }
  }
  if (P1 !== undefined && V1 !== undefined && P2 === undefined && V2 !== undefined) {
    return { P1, V1, P2: (P1 * V1) / V2, V2 }
  }
  if (P1 !== undefined && V1 === undefined && P2 !== undefined && V2 !== undefined) {
    return { P1, V1: (P2 * V2) / P1, P2, V2 }
  }
  if (P1 === undefined && V1 !== undefined && P2 !== undefined && V2 !== undefined) {
    return { P1: (P2 * V2) / V1, V1, P2, V2 }
  }

  throw new Error('Need exactly 3 of 4 parameters')
}

/**
 * Charles's Law: V1/T1 = V2/T2 (at constant P, n)
 */
export function charlesLaw(V1?: number, T1?: number, V2?: number, T2?: number) {
  if (V1 !== undefined && T1 !== undefined && V2 !== undefined && T2 === undefined) {
    return { V1, T1, V2, T2: (V2 * T1) / V1 }
  }
  if (V1 !== undefined && T1 !== undefined && V2 === undefined && T2 !== undefined) {
    return { V1, T1, V2: (V1 * T2) / T1, T2 }
  }
  if (V1 !== undefined && T1 === undefined && V2 !== undefined && T2 !== undefined) {
    return { V1, T1: (V1 * T2) / V2, V2, T2 }
  }
  if (V1 === undefined && T1 !== undefined && V2 !== undefined && T2 !== undefined) {
    return { V1: (V2 * T1) / T2, T1, V2, T2 }
  }

  throw new Error('Need exactly 3 of 4 parameters')
}

/**
 * Gay-Lussac's Law: P1/T1 = P2/T2 (at constant V, n)
 */
export function gayLussacsLaw(P1?: number, T1?: number, P2?: number, T2?: number) {
  if (P1 !== undefined && T1 !== undefined && P2 !== undefined && T2 === undefined) {
    return { P1, T1, P2, T2: (P2 * T1) / P1 }
  }
  if (P1 !== undefined && T1 !== undefined && P2 === undefined && T2 !== undefined) {
    return { P1, T1, P2: (P1 * T2) / T1, T2 }
  }
  if (P1 !== undefined && T1 === undefined && P2 !== undefined && T2 !== undefined) {
    return { P1, T1: (P1 * T2) / P2, P2, T2 }
  }
  if (P1 === undefined && T1 !== undefined && P2 !== undefined && T2 !== undefined) {
    return { P1: (P2 * T1) / T2, T1, P2, T2 }
  }

  throw new Error('Need exactly 3 of 4 parameters')
}

/**
 * Avogadro's Law: V1/n1 = V2/n2 (at constant P, T)
 */
export function avogadrosLaw(V1?: number, n1?: number, V2?: number, n2?: number) {
  if (V1 !== undefined && n1 !== undefined && V2 !== undefined && n2 === undefined) {
    return { V1, n1, V2, n2: (V2 * n1) / V1 }
  }
  if (V1 !== undefined && n1 !== undefined && V2 === undefined && n2 !== undefined) {
    return { V1, n1, V2: (V1 * n2) / n1, n2 }
  }
  if (V1 !== undefined && n1 === undefined && V2 !== undefined && n2 !== undefined) {
    return { V1, n1: (V1 * n2) / V2, V2, n2 }
  }
  if (V1 === undefined && n1 !== undefined && V2 !== undefined && n2 !== undefined) {
    return { V1: (V2 * n1) / n2, n1, V2, n2 }
  }

  throw new Error('Need exactly 3 of 4 parameters')
}

/**
 * Dalton's Law of Partial Pressures
 */
export function daltonsLaw(partialPressures: number[]): number {
  // P_total = P1 + P2 + P3 + ...
  return partialPressures.reduce((sum, p) => sum + p, 0)
}

/**
 * Calculate partial pressure from mole fraction
 */
export function calculatePartialPressure(
  totalPressure: number,
  moleFraction: number
): number {
  return totalPressure * moleFraction
}

/**
 * Calculate mole fraction
 */
export function calculateMoleFraction(
  moles: number,
  totalMoles: number
): number {
  return moles / totalMoles
}

/**
 * Graham's Law of Effusion/Diffusion
 */
export function grahamsLaw(
  rate1: number,
  molarMass1: number,
  molarMass2: number
): number {
  // rate1/rate2 = √(M2/M1)
  return rate1 * Math.sqrt(molarMass1 / molarMass2)
}

/**
 * Van der Waals equation (real gas)
 */
export interface VanDerWaalsInput {
  n: number
  V: number
  T: number
  a: number // Van der Waals constant a
  b: number // Van der Waals constant b
}

export function vanDerWaalsEquation(input: VanDerWaalsInput): number {
  // [P + a(n/V)²](V - nb) = nRT
  const { n, V, T, a, b } = input
  const R = GAS_CONSTANT.atm

  // Validate inputs
  if (n <= 0) {
    throw new Error('Number of moles must be positive')
  }
  if (V <= 0) {
    throw new Error('Volume must be positive')
  }
  if (T <= 0) {
    throw new Error('Temperature must be positive (in Kelvin)')
  }

  // Check that volume is larger than molecular volume (V > nb)
  const molecularVolume = n * b
  if (V <= molecularVolume) {
    throw new Error(
      `Volume (${V.toFixed(3)} L) must be greater than molecular volume (${molecularVolume.toFixed(3)} L). ` +
      `Molecules have finite size - container too small for ${n} mol of gas.`
    )
  }

  // Calculate pressure
  const pressure = (n * R * T) / (V - n * b) - a * Math.pow(n / V, 2)

  // Validate result
  if (pressure < 0) {
    throw new Error(
      `Negative pressure calculated (${pressure.toFixed(3)} atm). ` +
      `This indicates invalid input parameters or extreme conditions beyond Van der Waals model validity.`
    )
  }

  return pressure
}

/**
 * Common Van der Waals constants (a in L²·atm/mol², b in L/mol)
 */
export const VAN_DER_WAALS_CONSTANTS = {
  H2: { a: 0.244, b: 0.0266 },
  He: { a: 0.034, b: 0.0237 },
  N2: { a: 1.390, b: 0.0391 },
  O2: { a: 1.360, b: 0.0318 },
  CO2: { a: 3.592, b: 0.0427 },
  H2O: { a: 5.464, b: 0.0305 },
  NH3: { a: 4.170, b: 0.0371 },
  CH4: { a: 2.253, b: 0.0428 },
  Ar: { a: 1.345, b: 0.0322 },
  Ne: { a: 0.211, b: 0.0171 },
}

/**
 * Calculate density of gas
 */
export function calculateGasDensity(
  molarMass: number, // g/mol
  pressure: number, // atm
  temperature: number // K
): number {
  // d = (P × M) / (R × T)
  const R = GAS_CONSTANT.atm
  return (pressure * molarMass) / (R * temperature)
}

/**
 * Calculate molar mass from gas density
 */
export function calculateMolarMassFromDensity(
  density: number, // g/L
  pressure: number, // atm
  temperature: number // K
): number {
  // M = (d × R × T) / P
  const R = GAS_CONSTANT.atm
  return (density * R * temperature) / pressure
}

/**
 * Root Mean Square velocity (kinetic molecular theory)
 */
export function calculateRMSVelocity(
  molarMass: number, // g/mol
  temperature: number // K
): number {
  // v_rms = √(3RT/M)
  // Convert molar mass to kg/mol for SI units
  const M = molarMass / 1000 // kg/mol
  const R = GAS_CONSTANT.SI // J/(mol·K)

  return Math.sqrt((3 * R * temperature) / M)
}

/**
 * Average kinetic energy
 */
export function calculateAverageKineticEnergy(temperature: number): number {
  // KE_avg = (3/2)RT
  const R = GAS_CONSTANT.SI
  return (3/2) * R * temperature
}

/**
 * Gas law examples
 */
export const GAS_LAW_EXAMPLES = [
  {
    name: 'Ideal Gas Law',
    problem: 'Calculate pressure of 2.0 mol gas at 298 K in 10.0 L container',
    solution: {
      given: { n: 2.0, T: 298, V: 10.0 },
      find: 'P',
      steps: [
        'Use PV = nRT',
        'P = nRT/V',
        'P = (2.0 mol)(0.08206 L·atm/(mol·K))(298 K) / 10.0 L',
        'P = 48.9 / 10.0',
        'P = 4.89 atm',
      ],
      answer: '4.89 atm',
    },
  },
  {
    name: 'Combined Gas Law',
    problem: 'Gas at 2.0 atm, 300 K, 5.0 L. Find new volume at 1.0 atm, 400 K',
    solution: {
      given: { P1: 2.0, T1: 300, V1: 5.0, P2: 1.0, T2: 400 },
      find: 'V2',
      steps: [
        'Use (P1V1)/T1 = (P2V2)/T2',
        'V2 = (P1V1T2)/(P2T1)',
        'V2 = (2.0 × 5.0 × 400) / (1.0 × 300)',
        'V2 = 4000 / 300',
        'V2 = 13.3 L',
      ],
      answer: '13.3 L',
    },
  },
  {
    name: 'Dalton\'s Law',
    problem: 'Container has O2 (0.5 atm), N2 (0.3 atm), CO2 (0.2 atm). Find total pressure',
    solution: {
      given: { PO2: 0.5, PN2: 0.3, PCO2: 0.2 },
      find: 'P_total',
      steps: [
        'Use P_total = P1 + P2 + P3 + ...',
        'P_total = 0.5 + 0.3 + 0.2',
        'P_total = 1.0 atm',
      ],
      answer: '1.0 atm',
    },
  },
]

/**
 * Type aliases for UI
 */
export type GasProperties = IdealGasInput
export type CombinedGasLawParams = CombinedGasInput

export interface PartialPressure {
  gas: string
  pressure: number
  unit: string
}
