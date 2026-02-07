// VerChem - Nuclear & Quantum Chemistry Calculations
// Radioactive decay, binding energy, quantum numbers, hydrogen atom

import {
  PLANCK_CONSTANT,
  SPEED_OF_LIGHT,
  ELECTRON_MASS,
} from '@/lib/constants/physical-constants'

// ============================================================
// TYPES
// ============================================================

export type DecayType = 'alpha' | 'beta-minus' | 'beta-plus' | 'gamma' | 'electron-capture'

export type HalfLifeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'years'

export interface Isotope {
  symbol: string
  name: string
  massNumber: number
  atomicNumber: number
  halfLife: number
  halfLifeUnit: HalfLifeUnit
  decayMode: DecayType[]
  daughter?: string
  applications?: string[]
}

export interface DecayResult {
  remainingAmount: number
  decayedAmount: number
  numHalfLives: number
  activity: number // Bq (decays per second)
  decayConstant: number // s⁻¹
}

export interface DecayChainStep {
  isotope: string
  massNumber: number
  atomicNumber: number
  decayType: DecayType
  halfLife: string
}

export interface NuclearEquationResult {
  parent: { A: number; Z: number; symbol: string }
  daughter: { A: number; Z: number; symbol: string }
  emittedParticles: string[]
  equation: string
  decayType: DecayType
}

export interface BindingEnergyResult {
  totalBE: number       // MeV
  perNucleon: number    // MeV/nucleon
  massDefect: number    // amu
  steps: string[]
}

export interface QuantumNumberValidation {
  valid: boolean
  errors: string[]
  orbitalName?: string
}

export interface HydrogenTransition {
  nInitial: number
  nFinal: number
  energyEV: number
  energyJ: number
  wavelengthNm: number
  frequencyHz: number
  seriesName: string
  isVisible: boolean
}

export interface PhotonEnergyResult {
  energyEV: number
  energyJ: number
  energyKJmol: number
  frequencyHz: number
  wavelengthNm: number
  region: string
}

// ============================================================
// PHYSICAL CONSTANTS (Nuclear & Quantum)
// ============================================================

/** Proton mass in amu (hydrogen-1 atomic mass) */
const PROTON_MASS_AMU = 1.007825

/** Neutron mass in amu */
const NEUTRON_MASS_AMU = 1.008665

/** 1 amu = 931.494 MeV/c^2 */
const AMU_TO_MEV = 931.494

/** Bohr radius in pm */
const BOHR_RADIUS_PM = 52.9177

/** Avogadro's number */
const AVOGADRO = 6.02214076e23

/** Electron volt in joules */
const EV_TO_J = 1.602176634e-19

// h, c, m_e are imported from physical-constants
const h = PLANCK_CONSTANT       // 6.62607015e-34 J·s
const c = SPEED_OF_LIGHT        // 299792458 m/s
const m_e = ELECTRON_MASS       // 9.1093837015e-31 kg

// ============================================================
// ELEMENT SYMBOLS LOOKUP (Z -> symbol)
// ============================================================

const ELEMENT_SYMBOLS: Record<number, string> = {
  0: 'n', 1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O',
  9: 'F', 10: 'Ne', 11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S',
  17: 'Cl', 18: 'Ar', 19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr',
  25: 'Mn', 26: 'Fe', 27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn', 31: 'Ga', 32: 'Ge',
  33: 'As', 34: 'Se', 35: 'Br', 36: 'Kr', 37: 'Rb', 38: 'Sr', 39: 'Y', 40: 'Zr',
  41: 'Nb', 42: 'Mo', 43: 'Tc', 44: 'Ru', 45: 'Rh', 46: 'Pd', 47: 'Ag', 48: 'Cd',
  49: 'In', 50: 'Sn', 51: 'Sb', 52: 'Te', 53: 'I', 54: 'Xe', 55: 'Cs', 56: 'Ba',
  57: 'La', 58: 'Ce', 59: 'Pr', 60: 'Nd', 61: 'Pm', 62: 'Sm', 63: 'Eu', 64: 'Gd',
  65: 'Tb', 66: 'Dy', 67: 'Ho', 68: 'Er', 69: 'Tm', 70: 'Yb', 71: 'Lu', 72: 'Hf',
  73: 'Ta', 74: 'W', 75: 'Re', 76: 'Os', 77: 'Ir', 78: 'Pt', 79: 'Au', 80: 'Hg',
  81: 'Tl', 82: 'Pb', 83: 'Bi', 84: 'Po', 85: 'At', 86: 'Rn', 87: 'Fr', 88: 'Ra',
  89: 'Ac', 90: 'Th', 91: 'Pa', 92: 'U', 93: 'Np', 94: 'Pu', 95: 'Am', 96: 'Cm',
  97: 'Bk', 98: 'Cf', 99: 'Es', 100: 'Fm', 101: 'Md', 102: 'No', 103: 'Lr',
  104: 'Rf', 105: 'Db', 106: 'Sg', 107: 'Bh', 108: 'Hs', 109: 'Mt', 110: 'Ds',
  111: 'Rg', 112: 'Cn', 113: 'Nh', 114: 'Fl', 115: 'Mc', 116: 'Lv', 117: 'Ts', 118: 'Og',
}

export function getElementSymbol(Z: number): string {
  return ELEMENT_SYMBOLS[Z] || `Z${Z}`
}

// ============================================================
// UNIT CONVERSIONS
// ============================================================

const HALF_LIFE_TO_SECONDS: Record<HalfLifeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  years: 3.156e7, // ~365.25 days
}

/**
 * Convert half-life to seconds
 */
export function halfLifeToSeconds(value: number, unit: HalfLifeUnit): number {
  return value * HALF_LIFE_TO_SECONDS[unit]
}

/**
 * Format a half-life value with appropriate unit
 */
export function formatHalfLife(seconds: number): string {
  if (seconds < 60) return `${seconds.toPrecision(4)} s`
  if (seconds < 3600) return `${(seconds / 60).toPrecision(4)} min`
  if (seconds < 86400) return `${(seconds / 3600).toPrecision(4)} h`
  if (seconds < 3.156e7) return `${(seconds / 86400).toPrecision(4)} days`
  return `${(seconds / 3.156e7).toPrecision(4)} years`
}

// ============================================================
// NUCLEAR CHEMISTRY CALCULATIONS
// ============================================================

/**
 * Calculate radioactive decay
 * N(t) = N₀ × (1/2)^(t/t½)
 */
export function radioactiveDecay(
  initialAmount: number,
  halfLife: number,
  elapsedTime: number
): DecayResult {
  if (initialAmount <= 0) throw new Error('Initial amount must be positive')
  if (halfLife <= 0) throw new Error('Half-life must be positive')
  if (elapsedTime < 0) throw new Error('Elapsed time cannot be negative')

  const numHalfLives = elapsedTime / halfLife
  const remainingAmount = initialAmount * Math.pow(0.5, numHalfLives)
  const decayedAmount = initialAmount - remainingAmount
  const lambda = Math.LN2 / halfLife
  const currentActivity = lambda * remainingAmount

  return {
    remainingAmount,
    decayedAmount,
    numHalfLives,
    activity: currentActivity,
    decayConstant: lambda,
  }
}

/**
 * Calculate half-life from initial/remaining amounts and elapsed time
 * t½ = t × ln(2) / ln(N₀/N)
 */
export function halfLifeFromDecay(
  initialAmount: number,
  remainingAmount: number,
  elapsedTime: number
): number {
  if (initialAmount <= 0) throw new Error('Initial amount must be positive')
  if (remainingAmount <= 0) throw new Error('Remaining amount must be positive')
  if (remainingAmount > initialAmount) throw new Error('Remaining amount cannot exceed initial amount')
  if (elapsedTime <= 0) throw new Error('Elapsed time must be positive')

  return (elapsedTime * Math.LN2) / Math.log(initialAmount / remainingAmount)
}

/**
 * Calculate time to decay to target amount
 * t = t½ × ln(N₀/N) / ln(2)
 */
export function timeToDecay(
  initialAmount: number,
  targetAmount: number,
  halfLife: number
): number {
  if (initialAmount <= 0) throw new Error('Initial amount must be positive')
  if (targetAmount <= 0) throw new Error('Target amount must be positive')
  if (targetAmount > initialAmount) throw new Error('Target amount cannot exceed initial amount')
  if (halfLife <= 0) throw new Error('Half-life must be positive')

  return halfLife * Math.log(initialAmount / targetAmount) / Math.LN2
}

/**
 * Calculate decay constant
 * λ = ln(2) / t½
 */
export function decayConstant(halfLife: number): number {
  if (halfLife <= 0) throw new Error('Half-life must be positive')
  return Math.LN2 / halfLife
}

/**
 * Calculate activity in Becquerels (decays/second)
 * A = λ × N
 */
export function activity(numAtoms: number, halfLifeSeconds: number): number {
  if (numAtoms < 0) throw new Error('Number of atoms cannot be negative')
  if (halfLifeSeconds <= 0) throw new Error('Half-life must be positive')
  const lambda = Math.LN2 / halfLifeSeconds
  return lambda * numAtoms
}

/**
 * Calculate specific activity (Bq per gram)
 * SA = (λ × NA) / M = (ln(2) × NA) / (t½ × M)
 */
export function specificActivity(halfLifeSeconds: number, molarMass: number): number {
  if (halfLifeSeconds <= 0) throw new Error('Half-life must be positive')
  if (molarMass <= 0) throw new Error('Molar mass must be positive')
  return (Math.LN2 * AVOGADRO) / (halfLifeSeconds * molarMass)
}

/**
 * Balance a nuclear equation given parent nucleus and decay type
 */
export function balanceNuclearEquation(
  parent: { A: number; Z: number },
  decayType: DecayType
): NuclearEquationResult {
  if (parent.A < 1) throw new Error('Mass number must be at least 1')
  if (parent.Z < 0) throw new Error('Atomic number cannot be negative')
  if (parent.Z > parent.A) throw new Error('Atomic number cannot exceed mass number')

  let daughterA: number
  let daughterZ: number
  let emittedParticles: string[]
  const parentSymbol = getElementSymbol(parent.Z)

  switch (decayType) {
    case 'alpha':
      if (parent.A < 4 || parent.Z < 2) throw new Error('Nucleus too light for alpha decay')
      daughterA = parent.A - 4
      daughterZ = parent.Z - 2
      emittedParticles = ['\u2074\u2082He (\u03B1)']
      break
    case 'beta-minus':
      daughterA = parent.A
      daughterZ = parent.Z + 1
      emittedParticles = ['e\u207B (\u03B2\u207B)', '\u0305\u03BD (antineutrino)']
      break
    case 'beta-plus':
      if (parent.Z < 1) throw new Error('Cannot undergo beta-plus decay')
      daughterA = parent.A
      daughterZ = parent.Z - 1
      emittedParticles = ['e\u207A (\u03B2\u207A)', '\u03BD (neutrino)']
      break
    case 'gamma':
      daughterA = parent.A
      daughterZ = parent.Z
      emittedParticles = ['\u03B3 (gamma ray)']
      break
    case 'electron-capture':
      if (parent.Z < 1) throw new Error('Cannot undergo electron capture')
      daughterA = parent.A
      daughterZ = parent.Z - 1
      emittedParticles = ['\u03BD (neutrino)']
      break
    default:
      throw new Error(`Unknown decay type: ${decayType}`)
  }

  const daughterSymbol = getElementSymbol(daughterZ)

  // Build equation string
  const parentStr = `\u00B2${parent.A < 100 ? '' : ''}${parent.A}/${parent.Z}${parentSymbol}`
  const daughterStr = `\u00B2${daughterA < 100 ? '' : ''}${daughterA}/${daughterZ}${daughterSymbol}`
  const equation = `${parentStr} \u2192 ${daughterStr} + ${emittedParticles.join(' + ')}`

  return {
    parent: { A: parent.A, Z: parent.Z, symbol: parentSymbol },
    daughter: { A: daughterA, Z: daughterZ, symbol: daughterSymbol },
    emittedParticles,
    equation,
    decayType,
  }
}

/**
 * Mass-energy equivalence
 * E = Δm × 931.494 MeV/amu
 */
export function massEnergyEquivalence(deltaMass_amu: number): number {
  return deltaMass_amu * AMU_TO_MEV
}

/**
 * Calculate binding energy of a nucleus
 * BE = [Z × m_p + N × m_n - M_atom] × 931.494 MeV/amu
 */
export function bindingEnergy(
  Z: number,
  N: number,
  atomicMass: number
): BindingEnergyResult {
  if (Z < 0) throw new Error('Atomic number cannot be negative')
  if (N < 0) throw new Error('Neutron number cannot be negative')
  if (atomicMass <= 0) throw new Error('Atomic mass must be positive')

  const A = Z + N
  const expectedMass = Z * PROTON_MASS_AMU + N * NEUTRON_MASS_AMU
  const massDefect = expectedMass - atomicMass
  const totalBE = massDefect * AMU_TO_MEV
  const perNucleon = A > 0 ? totalBE / A : 0

  const steps = [
    `Expected mass = Z \u00D7 m_p + N \u00D7 m_n`,
    `= ${Z} \u00D7 ${PROTON_MASS_AMU} + ${N} \u00D7 ${NEUTRON_MASS_AMU}`,
    `= ${expectedMass.toFixed(6)} amu`,
    `Mass defect \u0394m = ${expectedMass.toFixed(6)} - ${atomicMass.toFixed(6)} = ${massDefect.toFixed(6)} amu`,
    `Total BE = ${massDefect.toFixed(6)} \u00D7 931.494 = ${totalBE.toFixed(4)} MeV`,
    `BE per nucleon = ${totalBE.toFixed(4)} / ${A} = ${perNucleon.toFixed(4)} MeV/nucleon`,
  ]

  return { totalBE, perNucleon, massDefect, steps }
}

// ============================================================
// QUANTUM CHEMISTRY CALCULATIONS
// ============================================================

const ORBITAL_LETTERS = ['s', 'p', 'd', 'f', 'g', 'h', 'i']

/**
 * Validate quantum numbers (n, l, ml, ms)
 */
export function validateQuantumNumbers(
  n: number,
  l: number,
  ml: number,
  ms: number
): QuantumNumberValidation {
  const errors: string[] = []

  // n must be positive integer
  if (!Number.isInteger(n) || n < 1) {
    errors.push(`Principal quantum number n must be a positive integer (n \u2265 1). Got: ${n}`)
  }

  // l must be integer from 0 to n-1
  if (!Number.isInteger(l)) {
    errors.push(`Angular momentum quantum number l must be an integer. Got: ${l}`)
  } else if (l < 0) {
    errors.push(`Angular momentum quantum number l must be non-negative (l \u2265 0). Got: ${l}`)
  } else if (n >= 1 && l > n - 1) {
    errors.push(`Angular momentum quantum number l must be \u2264 n-1 = ${n - 1}. Got: ${l}`)
  }

  // ml must be integer from -l to l
  if (!Number.isInteger(ml)) {
    errors.push(`Magnetic quantum number m_l must be an integer. Got: ${ml}`)
  } else if (l >= 0 && (ml < -l || ml > l)) {
    errors.push(`Magnetic quantum number m_l must be between -l (${-l}) and +l (${l}). Got: ${ml}`)
  }

  // ms must be +1/2 or -1/2
  if (ms !== 0.5 && ms !== -0.5) {
    errors.push(`Spin quantum number m_s must be +1/2 or -1/2. Got: ${ms}`)
  }

  const valid = errors.length === 0
  let orbitalNameStr: string | undefined

  if (valid && n >= 1 && l >= 0 && l < ORBITAL_LETTERS.length) {
    orbitalNameStr = `${n}${ORBITAL_LETTERS[l]}`
  }

  return { valid, errors, orbitalName: orbitalNameStr }
}

/**
 * Get orbital name from n and l quantum numbers
 */
export function orbitalName(n: number, l: number): string {
  if (n < 1) throw new Error('n must be >= 1')
  if (l < 0 || l > n - 1) throw new Error(`l must be between 0 and ${n - 1}`)

  const letter = l < ORBITAL_LETTERS.length ? ORBITAL_LETTERS[l] : `l${l}`
  return `${n}${letter}`
}

/**
 * Maximum electrons in a subshell = 2(2l + 1)
 */
export function maxElectrons(n: number, l: number): number {
  if (n < 1) throw new Error('n must be >= 1')
  if (l < 0 || l > n - 1) throw new Error(`l must be between 0 and ${n - 1}`)
  return 2 * (2 * l + 1)
}

/**
 * Maximum electrons in a shell = 2n^2
 */
export function maxElectronsInShell(n: number): number {
  if (n < 1) throw new Error('n must be >= 1')
  return 2 * n * n
}

/**
 * Get all valid subshells for a given shell
 */
export function getSubshells(n: number): Array<{ l: number; name: string; maxE: number }> {
  if (n < 1) throw new Error('n must be >= 1')
  const subshells: Array<{ l: number; name: string; maxE: number }> = []
  for (let l = 0; l < n; l++) {
    subshells.push({
      l,
      name: orbitalName(n, l),
      maxE: maxElectrons(n, l),
    })
  }
  return subshells
}

/**
 * de Broglie wavelength
 * λ = h / (m × v)
 */
export function debroglieWavelength(mass_kg: number, velocity_ms: number): number {
  if (mass_kg <= 0) throw new Error('Mass must be positive')
  if (velocity_ms === 0) throw new Error('Velocity cannot be zero')
  const absV = Math.abs(velocity_ms)
  if (absV >= c) throw new Error('Velocity must be less than the speed of light')
  return h / (mass_kg * absV)
}

/**
 * Hydrogen atom energy level
 * E_n = -13.6 / n² eV
 */
export function hydrogenEnergy(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer')
  return -13.6 / (n * n)
}

/**
 * Energy of a hydrogen electron transition
 */
export function hydrogenTransition(nInitial: number, nFinal: number): HydrogenTransition {
  if (!Number.isInteger(nInitial) || nInitial < 1) throw new Error('nInitial must be a positive integer')
  if (!Number.isInteger(nFinal) || nFinal < 1) throw new Error('nFinal must be a positive integer')
  if (nInitial === nFinal) throw new Error('nInitial and nFinal must be different')

  const eInitial = hydrogenEnergy(nInitial)
  const eFinal = hydrogenEnergy(nFinal)
  const energyEV = Math.abs(eInitial - eFinal)
  const energyJ = energyEV * EV_TO_J
  const frequencyHz = energyJ / h
  const wavelengthM = c / frequencyHz
  const wavelengthNm = wavelengthM * 1e9

  // Determine series name (based on the lower level)
  const lowerN = Math.min(nInitial, nFinal)
  let seriesName: string
  switch (lowerN) {
    case 1: seriesName = 'Lyman'; break
    case 2: seriesName = 'Balmer'; break
    case 3: seriesName = 'Paschen'; break
    case 4: seriesName = 'Brackett'; break
    case 5: seriesName = 'Pfund'; break
    case 6: seriesName = 'Humphreys'; break
    default: seriesName = `n=${lowerN} series`
  }

  const isVisible = wavelengthNm >= 380 && wavelengthNm <= 750

  return {
    nInitial,
    nFinal,
    energyEV,
    energyJ,
    wavelengthNm,
    frequencyHz,
    seriesName,
    isVisible,
  }
}

/**
 * Calculate photon energy from wavelength
 * E = hc/λ
 */
export function photonEnergy(wavelength_nm: number): PhotonEnergyResult {
  if (wavelength_nm <= 0) throw new Error('Wavelength must be positive')

  const wavelengthM = wavelength_nm * 1e-9
  const energyJ = (h * c) / wavelengthM
  const energyEV = energyJ / EV_TO_J
  const energyKJmol = (energyJ * AVOGADRO) / 1000
  const frequencyHz = c / wavelengthM

  // Determine EM region
  let region: string
  if (wavelength_nm < 0.01) region = 'Gamma rays'
  else if (wavelength_nm < 10) region = 'X-rays'
  else if (wavelength_nm < 380) region = 'Ultraviolet'
  else if (wavelength_nm < 450) region = 'Violet'
  else if (wavelength_nm < 495) region = 'Blue'
  else if (wavelength_nm < 570) region = 'Green'
  else if (wavelength_nm < 590) region = 'Yellow'
  else if (wavelength_nm < 620) region = 'Orange'
  else if (wavelength_nm < 750) region = 'Red'
  else if (wavelength_nm < 1e6) region = 'Infrared'
  else if (wavelength_nm < 1e9) region = 'Microwave'
  else region = 'Radio waves'

  return { energyEV, energyJ, energyKJmol, frequencyHz, wavelengthNm: wavelength_nm, region }
}

/**
 * Bohr model radius for hydrogen-like atoms
 * r_n = n² × a₀ / Z  (in pm)
 */
export function bohrRadius(n: number, Z: number = 1): number {
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer')
  if (Z < 1) throw new Error('Z must be at least 1')
  return (n * n * BOHR_RADIUS_PM) / Z
}

/**
 * Hydrogen-like atom energy level
 * E_n = -13.6 × Z² / n²  eV
 */
export function hydrogenLikeEnergy(n: number, Z: number): number {
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer')
  if (Z < 1) throw new Error('Z must be at least 1')
  return -13.6 * Z * Z / (n * n)
}

/**
 * Heisenberg uncertainty principle minimum uncertainty
 * Δx × Δp ≥ ℏ/2
 * Given Δx, returns minimum Δp (or vice versa)
 */
export function heisenbergUncertainty(
  deltaX_m?: number,
  deltaP_kgms?: number
): { deltaX: number; deltaP: number } {
  const hbar = h / (2 * Math.PI)
  const minProduct = hbar / 2

  if (deltaX_m !== undefined && deltaX_m > 0) {
    return { deltaX: deltaX_m, deltaP: minProduct / deltaX_m }
  }
  if (deltaP_kgms !== undefined && deltaP_kgms > 0) {
    return { deltaX: minProduct / deltaP_kgms, deltaP: deltaP_kgms }
  }
  throw new Error('Provide either deltaX or deltaP (positive value)')
}

/**
 * de Broglie wavelength for an electron given kinetic energy in eV
 * λ = h / sqrt(2 × m_e × KE)
 */
export function electronWavelengthFromKE(kineticEnergy_eV: number): number {
  if (kineticEnergy_eV <= 0) throw new Error('Kinetic energy must be positive')
  const keJ = kineticEnergy_eV * EV_TO_J
  return h / Math.sqrt(2 * m_e * keJ)
}

// ============================================================
// COMMON ISOTOPES DATABASE (~30 important isotopes)
// ============================================================

export const COMMON_ISOTOPES: Isotope[] = [
  {
    symbol: 'H-3',
    name: 'Tritium',
    massNumber: 3,
    atomicNumber: 1,
    halfLife: 12.32,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus'],
    daughter: 'He-3',
    applications: ['Fusion research', 'Radioluminescence', 'Nuclear weapons'],
  },
  {
    symbol: 'C-14',
    name: 'Carbon-14',
    massNumber: 14,
    atomicNumber: 6,
    halfLife: 5730,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus'],
    daughter: 'N-14',
    applications: ['Radiocarbon dating', 'Biological tracer'],
  },
  {
    symbol: 'P-32',
    name: 'Phosphorus-32',
    massNumber: 32,
    atomicNumber: 15,
    halfLife: 14.28,
    halfLifeUnit: 'days',
    decayMode: ['beta-minus'],
    daughter: 'S-32',
    applications: ['DNA labeling', 'Molecular biology', 'Cancer treatment'],
  },
  {
    symbol: 'K-40',
    name: 'Potassium-40',
    massNumber: 40,
    atomicNumber: 19,
    halfLife: 1.248e9,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus', 'electron-capture'],
    daughter: 'Ca-40 / Ar-40',
    applications: ['Geological dating', 'Natural radioactivity in food'],
  },
  {
    symbol: 'Cr-51',
    name: 'Chromium-51',
    massNumber: 51,
    atomicNumber: 24,
    halfLife: 27.7,
    halfLifeUnit: 'days',
    decayMode: ['electron-capture'],
    daughter: 'V-51',
    applications: ['Red blood cell labeling', 'Medical diagnostics'],
  },
  {
    symbol: 'Fe-55',
    name: 'Iron-55',
    massNumber: 55,
    atomicNumber: 26,
    halfLife: 2.737,
    halfLifeUnit: 'years',
    decayMode: ['electron-capture'],
    daughter: 'Mn-55',
    applications: ['X-ray fluorescence', 'Thickness gauging'],
  },
  {
    symbol: 'Fe-59',
    name: 'Iron-59',
    massNumber: 59,
    atomicNumber: 26,
    halfLife: 44.5,
    halfLifeUnit: 'days',
    decayMode: ['beta-minus'],
    daughter: 'Co-59',
    applications: ['Iron metabolism studies', 'Wear analysis'],
  },
  {
    symbol: 'Co-60',
    name: 'Cobalt-60',
    massNumber: 60,
    atomicNumber: 27,
    halfLife: 5.2714,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus'],
    daughter: 'Ni-60',
    applications: ['Radiation therapy', 'Food irradiation', 'Industrial radiography'],
  },
  {
    symbol: 'Ni-63',
    name: 'Nickel-63',
    massNumber: 63,
    atomicNumber: 28,
    halfLife: 101.2,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus'],
    daughter: 'Cu-63',
    applications: ['Betavoltaic batteries', 'Electron capture detectors'],
  },
  {
    symbol: 'Sr-90',
    name: 'Strontium-90',
    massNumber: 90,
    atomicNumber: 38,
    halfLife: 28.8,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus'],
    daughter: 'Y-90',
    applications: ['RTG power sources', 'Fission product monitoring'],
  },
  {
    symbol: 'Tc-99m',
    name: 'Technetium-99m',
    massNumber: 99,
    atomicNumber: 43,
    halfLife: 6.01,
    halfLifeUnit: 'hours',
    decayMode: ['gamma'],
    daughter: 'Tc-99',
    applications: ['Medical imaging (SPECT)', 'Most used medical radioisotope'],
  },
  {
    symbol: 'I-125',
    name: 'Iodine-125',
    massNumber: 125,
    atomicNumber: 53,
    halfLife: 59.4,
    halfLifeUnit: 'days',
    decayMode: ['electron-capture'],
    daughter: 'Te-125',
    applications: ['Brachytherapy', 'Radioimmunoassay', 'Protein labeling'],
  },
  {
    symbol: 'I-131',
    name: 'Iodine-131',
    massNumber: 131,
    atomicNumber: 53,
    halfLife: 8.02,
    halfLifeUnit: 'days',
    decayMode: ['beta-minus'],
    daughter: 'Xe-131',
    applications: ['Thyroid cancer treatment', 'Thyroid imaging', 'Nuclear fallout indicator'],
  },
  {
    symbol: 'Cs-137',
    name: 'Cesium-137',
    massNumber: 137,
    atomicNumber: 55,
    halfLife: 30.17,
    halfLifeUnit: 'years',
    decayMode: ['beta-minus'],
    daughter: 'Ba-137m',
    applications: ['Industrial gauging', 'Radiation therapy', 'Environmental monitoring'],
  },
  {
    symbol: 'Po-210',
    name: 'Polonium-210',
    massNumber: 210,
    atomicNumber: 84,
    halfLife: 138.4,
    halfLifeUnit: 'days',
    decayMode: ['alpha'],
    daughter: 'Pb-206',
    applications: ['Static eliminators', 'Heat source', 'Neutron trigger'],
  },
  {
    symbol: 'Rn-222',
    name: 'Radon-222',
    massNumber: 222,
    atomicNumber: 86,
    halfLife: 3.82,
    halfLifeUnit: 'days',
    decayMode: ['alpha'],
    daughter: 'Po-218',
    applications: ['Geological tracing', 'Earthquake prediction', 'Indoor air quality hazard'],
  },
  {
    symbol: 'Ra-226',
    name: 'Radium-226',
    massNumber: 226,
    atomicNumber: 88,
    halfLife: 1600,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'Rn-222',
    applications: ['Historical cancer therapy', 'Luminescent paint (historical)', 'Neutron source'],
  },
  {
    symbol: 'Th-232',
    name: 'Thorium-232',
    massNumber: 232,
    atomicNumber: 90,
    halfLife: 1.405e10,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'Ra-228',
    applications: ['Nuclear fuel (thorium cycle)', 'Gas mantle', 'Geological dating'],
  },
  {
    symbol: 'U-235',
    name: 'Uranium-235',
    massNumber: 235,
    atomicNumber: 92,
    halfLife: 7.04e8,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'Th-231',
    applications: ['Nuclear fuel (fission)', 'Nuclear weapons', 'Geological dating'],
  },
  {
    symbol: 'U-238',
    name: 'Uranium-238',
    massNumber: 238,
    atomicNumber: 92,
    halfLife: 4.468e9,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'Th-234',
    applications: ['Nuclear fuel (breeder)', 'Depleted uranium armor', 'Geological dating'],
  },
  {
    symbol: 'Pu-239',
    name: 'Plutonium-239',
    massNumber: 239,
    atomicNumber: 94,
    halfLife: 24110,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'U-235',
    applications: ['Nuclear fuel', 'Nuclear weapons', 'RTG power'],
  },
  {
    symbol: 'Am-241',
    name: 'Americium-241',
    massNumber: 241,
    atomicNumber: 95,
    halfLife: 432.2,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'Np-237',
    applications: ['Smoke detectors', 'Neutron source', 'Industrial gauging'],
  },
  {
    symbol: 'Cf-252',
    name: 'Californium-252',
    massNumber: 252,
    atomicNumber: 98,
    halfLife: 2.645,
    halfLifeUnit: 'years',
    decayMode: ['alpha'],
    daughter: 'Cm-248',
    applications: ['Neutron source', 'Nuclear reactor startup', 'Cancer treatment'],
  },
]

// ============================================================
// DECAY CURVE DATA GENERATOR
// ============================================================

/**
 * Generate data points for a decay curve visualization
 */
export function generateDecayCurve(
  initialAmount: number,
  halfLife: number,
  numPoints: number = 50,
  numHalfLives: number = 5
): Array<{ time: number; amount: number; fraction: number }> {
  const totalTime = halfLife * numHalfLives
  const points: Array<{ time: number; amount: number; fraction: number }> = []

  for (let i = 0; i <= numPoints; i++) {
    const time = (i / numPoints) * totalTime
    const amount = initialAmount * Math.pow(0.5, time / halfLife)
    points.push({
      time,
      amount,
      fraction: amount / initialAmount,
    })
  }

  return points
}

// ============================================================
// EXAMPLE BINDING ENERGY DATA
// ============================================================

export const EXAMPLE_NUCLEI: Array<{
  name: string
  symbol: string
  Z: number
  N: number
  atomicMass: number
}> = [
  { name: 'Deuterium', symbol: 'H-2', Z: 1, N: 1, atomicMass: 2.014102 },
  { name: 'Helium-4', symbol: 'He-4', Z: 2, N: 2, atomicMass: 4.002603 },
  { name: 'Carbon-12', symbol: 'C-12', Z: 6, N: 6, atomicMass: 12.000000 },
  { name: 'Nitrogen-14', symbol: 'N-14', Z: 7, N: 7, atomicMass: 14.003074 },
  { name: 'Oxygen-16', symbol: 'O-16', Z: 8, N: 8, atomicMass: 15.994915 },
  { name: 'Iron-56', symbol: 'Fe-56', Z: 26, N: 30, atomicMass: 55.934937 },
  { name: 'Nickel-62', symbol: 'Ni-62', Z: 28, N: 34, atomicMass: 61.928345 },
  { name: 'Silver-107', symbol: 'Ag-107', Z: 47, N: 60, atomicMass: 106.905097 },
  { name: 'Lead-208', symbol: 'Pb-208', Z: 82, N: 126, atomicMass: 207.976652 },
  { name: 'Uranium-235', symbol: 'U-235', Z: 92, N: 143, atomicMass: 235.043930 },
  { name: 'Uranium-238', symbol: 'U-238', Z: 92, N: 146, atomicMass: 238.050788 },
]
