// VerChem - Scientific Reference Data for Validation
// All values from authoritative sources: NIST, CRC Handbook, IUPAC

/**
 * NIST Buffer Standards at 25°C
 * Source: NIST Special Publication 260-186 (2022)
 */
export const NIST_BUFFER_STANDARDS = [
  {
    name: 'Primary phosphate',
    composition: 'KH2PO4 + Na2HPO4',
    molality: { KH2PO4: 0.025, Na2HPO4: 0.025 },
    pH: 6.865,
    uncertainty: 0.005,
    temperature: 25,
    reference: 'NIST SP 260-186',
  },
  {
    name: 'Primary phthalate',
    composition: 'KHC8H4O4',
    molality: 0.05,
    pH: 4.008,
    uncertainty: 0.005,
    temperature: 25,
    reference: 'NIST SP 260-186',
  },
  {
    name: 'Primary borate',
    composition: 'Na2B4O7·10H2O',
    molality: 0.01,
    pH: 9.180,
    uncertainty: 0.005,
    temperature: 25,
    reference: 'NIST SP 260-186',
  },
  {
    name: 'Secondary carbonate',
    composition: 'NaHCO3 + Na2CO3',
    molality: { NaHCO3: 0.025, Na2CO3: 0.025 },
    pH: 10.012,
    uncertainty: 0.01,
    temperature: 25,
    reference: 'NIST SP 260-186',
  },
]

/**
 * CRC Handbook Thermodynamic Data (298.15 K, 1 atm)
 * Source: CRC Handbook of Chemistry and Physics, 104th Edition (2023)
 */
export const CRC_THERMODYNAMIC_DATA = [
  // Formation enthalpies (kJ/mol)
  { compound: 'H2O(l)', deltaHf: -285.83, uncertainty: 0.04, reference: 'CRC 104th Ed.' },
  { compound: 'CO2(g)', deltaHf: -393.51, uncertainty: 0.13, reference: 'CRC 104th Ed.' },
  { compound: 'O2(g)', deltaHf: 0.0, uncertainty: 0.0, reference: 'By definition' },
  { compound: 'H2(g)', deltaHf: 0.0, uncertainty: 0.0, reference: 'By definition' },
  { compound: 'NH3(g)', deltaHf: -45.94, uncertainty: 0.35, reference: 'CRC 104th Ed.' },
  { compound: 'HCl(g)', deltaHf: -92.31, uncertainty: 0.10, reference: 'CRC 104th Ed.' },
  { compound: 'NaCl(s)', deltaHf: -411.15, uncertainty: 0.12, reference: 'CRC 104th Ed.' },
  { compound: 'CH4(g)', deltaHf: -74.87, uncertainty: 0.30, reference: 'CRC 104th Ed.' },
  { compound: 'C2H6(g)', deltaHf: -83.82, uncertainty: 0.30, reference: 'CRC 104th Ed.' },
  { compound: 'C6H6(l)', deltaHf: 49.04, uncertainty: 0.94, reference: 'CRC 104th Ed.' },

  // Gibbs free energies (kJ/mol)
  { compound: 'H2O(l)', deltaGf: -237.13, uncertainty: 0.04, reference: 'CRC 104th Ed.' },
  { compound: 'CO2(g)', deltaGf: -394.36, uncertainty: 0.13, reference: 'CRC 104th Ed.' },
  { compound: 'NH3(g)', deltaGf: -16.37, uncertainty: 0.30, reference: 'CRC 104th Ed.' },
]

/**
 * IUPAC Atomic Masses (2021)
 * Source: Pure Appl. Chem. 2022; 94(5): 573-600
 */
export const IUPAC_ATOMIC_MASSES_2021 = [
  { symbol: 'H', mass: 1.00784, uncertainty: 0.00001, reference: 'IUPAC 2021' },
  { symbol: 'He', mass: 4.002602, uncertainty: 0.000002, reference: 'IUPAC 2021' },
  { symbol: 'Li', mass: 6.94, uncertainty: 0.06, reference: 'IUPAC 2021' },
  { symbol: 'Be', mass: 9.0121831, uncertainty: 0.0000005, reference: 'IUPAC 2021' },
  { symbol: 'B', mass: 10.81, uncertainty: 0.02, reference: 'IUPAC 2021' },
  { symbol: 'C', mass: 12.011, uncertainty: 0.002, reference: 'IUPAC 2021' },
  { symbol: 'N', mass: 14.007, uncertainty: 0.001, reference: 'IUPAC 2021' },
  { symbol: 'O', mass: 15.999, uncertainty: 0.001, reference: 'IUPAC 2021' },
  { symbol: 'F', mass: 18.998403163, uncertainty: 0.000000006, reference: 'IUPAC 2021' },
  { symbol: 'Ne', mass: 20.1797, uncertainty: 0.0006, reference: 'IUPAC 2021' },
  { symbol: 'Na', mass: 22.98976928, uncertainty: 0.00000002, reference: 'IUPAC 2021' },
  { symbol: 'Mg', mass: 24.305, uncertainty: 0.002, reference: 'IUPAC 2021' },
  { symbol: 'Al', mass: 26.9815384, uncertainty: 0.0000003, reference: 'IUPAC 2021' },
  { symbol: 'Si', mass: 28.085, uncertainty: 0.001, reference: 'IUPAC 2021' },
  { symbol: 'P', mass: 30.973761998, uncertainty: 0.000000005, reference: 'IUPAC 2021' },
  { symbol: 'S', mass: 32.06, uncertainty: 0.02, reference: 'IUPAC 2021' },
  { symbol: 'Cl', mass: 35.45, uncertainty: 0.01, reference: 'IUPAC 2021' },
  { symbol: 'Ar', mass: 39.95, uncertainty: 0.16, reference: 'IUPAC 2021' },
  { symbol: 'K', mass: 39.0983, uncertainty: 0.0001, reference: 'IUPAC 2021' },
  { symbol: 'Ca', mass: 40.078, uncertainty: 0.004, reference: 'IUPAC 2021' },
]

/**
 * Gas Law Validation Data
 * Experimental measurements at various conditions
 */
export const GAS_LAW_VALIDATION_DATA = [
  // Ideal gas law tests
  {
    description: 'N2 at STP',
    gas: 'N2',
    n: 1.0, // mol
    T: 273.15, // K
    P: 1.0, // atm
    V_experimental: 22.414, // L
    V_ideal: 22.414, // L
    error: 0.0, // %
    reference: 'CODATA 2018',
  },
  {
    description: 'CO2 at 25°C, 1 atm',
    gas: 'CO2',
    n: 1.0,
    T: 298.15,
    P: 1.0,
    V_experimental: 24.465, // L (real)
    V_ideal: 24.465, // L
    V_vanDerWaals: 24.421, // L
    error: 0.18, // %
    reference: 'NIST WebBook',
  },
  {
    description: 'NH3 at high pressure',
    gas: 'NH3',
    n: 1.0,
    T: 300.0,
    P: 10.0, // atm
    V_experimental: 2.35, // L
    V_ideal: 2.46, // L
    V_vanDerWaals: 2.36, // L (better match)
    error_ideal: 4.7, // %
    error_vdw: 0.4, // %
    reference: 'Perry\'s Chemical Engineers\' Handbook',
  },
]

/**
 * Electrochemistry Standard Potentials
 * Source: CRC Handbook, validated against multiple sources
 */
export const STANDARD_REDUCTION_POTENTIALS_VALIDATED = [
  { halfCell: 'F2/F-', E0: 2.87, uncertainty: 0.01, reference: 'CRC/IUPAC' },
  { halfCell: 'Ag+/Ag', E0: 0.7996, uncertainty: 0.0003, reference: 'IUPAC' },
  { halfCell: 'Cu2+/Cu', E0: 0.342, uncertainty: 0.002, reference: 'CRC' },
  { halfCell: 'H+/H2', E0: 0.000, uncertainty: 0.000, reference: 'Definition' },
  { halfCell: 'Pb2+/Pb', E0: -0.126, uncertainty: 0.002, reference: 'CRC' },
  { halfCell: 'Zn2+/Zn', E0: -0.7618, uncertainty: 0.0004, reference: 'IUPAC' },
  { halfCell: 'Al3+/Al', E0: -1.676, uncertainty: 0.003, reference: 'CRC' },
  { halfCell: 'Mg2+/Mg', E0: -2.372, uncertainty: 0.003, reference: 'CRC' },
  { halfCell: 'Na+/Na', E0: -2.71, uncertainty: 0.01, reference: 'CRC' },
  { halfCell: 'Li+/Li', E0: -3.040, uncertainty: 0.003, reference: 'IUPAC' },
]

/**
 * Acid Dissociation Constants (pKa) at 25°C
 * Source: CRC Handbook + IUPAC Critical Compilations
 */
export const PKA_VALUES_VALIDATED = [
  // Strong acids (complete dissociation assumed)
  { acid: 'HCl', pKa: -7.0, uncertainty: 0.5, temperature: 25, reference: 'Estimated' },
  { acid: 'H2SO4', pKa1: -3.0, pKa2: 1.99, uncertainty: 0.05, temperature: 25, reference: 'CRC' },
  { acid: 'HNO3', pKa: -1.4, uncertainty: 0.2, temperature: 25, reference: 'CRC' },

  // Weak acids (precisely measured)
  { acid: 'CH3COOH', pKa: 4.756, uncertainty: 0.002, temperature: 25, reference: 'IUPAC' },
  { acid: 'H3PO4', pKa1: 2.148, pKa2: 7.198, pKa3: 12.375, uncertainty: 0.005, temperature: 25, reference: 'IUPAC' },
  { acid: 'H2CO3', pKa1: 6.352, pKa2: 10.329, uncertainty: 0.005, temperature: 25, reference: 'IUPAC' },
  { acid: 'HF', pKa: 3.17, uncertainty: 0.02, temperature: 25, reference: 'CRC' },
  { acid: 'HCN', pKa: 9.21, uncertainty: 0.02, temperature: 25, reference: 'CRC' },
  { acid: 'C6H5OH', pKa: 9.99, uncertainty: 0.02, temperature: 25, reference: 'CRC' },
]

/**
 * Solubility Product Constants (Ksp) at 25°C
 * Source: CRC Handbook
 */
export const KSP_VALUES_VALIDATED = [
  { compound: 'AgCl', Ksp: 1.77e-10, pKsp: 9.75, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'AgBr', Ksp: 5.35e-13, pKsp: 12.27, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'AgI', Ksp: 8.52e-17, pKsp: 16.07, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'BaSO4', Ksp: 1.08e-10, pKsp: 9.97, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'CaCO3', Ksp: 3.36e-9, pKsp: 8.47, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'Ca(OH)2', Ksp: 5.02e-6, pKsp: 5.30, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'Fe(OH)2', Ksp: 4.87e-17, pKsp: 16.31, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'Fe(OH)3', Ksp: 2.79e-39, pKsp: 38.55, uncertainty: 0.10, reference: 'CRC' },
  { compound: 'PbCl2', Ksp: 1.70e-5, pKsp: 4.77, uncertainty: 0.05, reference: 'CRC' },
  { compound: 'PbI2', Ksp: 9.8e-9, pKsp: 8.01, uncertainty: 0.05, reference: 'CRC' },
]

/**
 * Heat Capacity Data (Cp) at 298.15 K
 * Source: NIST Chemistry WebBook
 */
export const HEAT_CAPACITY_DATA = [
  { substance: 'H2O(l)', Cp: 75.327, uncertainty: 0.010, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'H2O(g)', Cp: 33.609, uncertainty: 0.030, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'CO2(g)', Cp: 37.135, uncertainty: 0.020, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'O2(g)', Cp: 29.378, uncertainty: 0.003, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'N2(g)', Cp: 29.125, uncertainty: 0.003, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'H2(g)', Cp: 28.836, uncertainty: 0.002, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'CH4(g)', Cp: 35.695, uncertainty: 0.030, unit: 'J/(mol·K)', reference: 'NIST' },
  { substance: 'C2H6(g)', Cp: 52.487, uncertainty: 0.050, unit: 'J/(mol·K)', reference: 'NIST' },
]

/**
 * Rate Constants for Common Reactions
 * For kinetics validation
 */
export const KINETICS_VALIDATION_DATA = [
  {
    reaction: '2NO2 → 2NO + O2',
    order: 2,
    k_value: 0.54,
    k_unit: 'L/(mol·s)',
    temperature: 300,
    Ea: 111000, // J/mol
    reference: 'Atkins Physical Chemistry',
  },
  {
    reaction: 'H2O2 → H2O + 1/2 O2',
    order: 1,
    k_value: 0.00081,
    k_unit: 's^-1',
    temperature: 298,
    Ea: 75300, // J/mol
    reference: 'Journal of Chemical Education',
  },
  {
    reaction: '2HI → H2 + I2',
    order: 2,
    k_value: 2.42e-6,
    k_unit: 'L/(mol·s)',
    temperature: 400,
    Ea: 184000, // J/mol
    reference: 'Physical Chemistry, Levine',
  },
]

/**
 * Validation Tolerances
 * Acceptable error ranges for different calculation types
 */
type BasicTolerance = {
  excellent: number
  good: number
  acceptable: number
}

type GasTolerance = {
  ideal: BasicTolerance
  real: BasicTolerance
}

export const VALIDATION_TOLERANCES: Record<
  'pH' | 'thermodynamics' | 'gasLaws' | 'stoichiometry' | 'electrochemistry',
  BasicTolerance | GasTolerance
> = {
  pH: {
    excellent: 0.02, // ±0.02 pH units
    good: 0.05,      // ±0.05 pH units
    acceptable: 0.10, // ±0.10 pH units
  },
  thermodynamics: {
    excellent: 0.5,  // ±0.5%
    good: 1.0,       // ±1.0%
    acceptable: 2.0, // ±2.0%
  },
  gasLaws: {
    ideal: {
      excellent: 1.0,  // ±1.0%
      good: 2.0,       // ±2.0%
      acceptable: 5.0, // ±5.0%
    },
    real: {
      excellent: 0.5,  // ±0.5%
      good: 1.0,       // ±1.0%
      acceptable: 2.0, // ±2.0%
    },
  },
  stoichiometry: {
    excellent: 0.1,  // ±0.1%
    good: 0.5,       // ±0.5%
    acceptable: 1.0, // ±1.0%
  },
  electrochemistry: {
    excellent: 0.002, // ±2 mV
    good: 0.005,      // ±5 mV
    acceptable: 0.010, // ±10 mV
  },
}

/**
 * Function to validate a calculated value against reference
 */
export function validateAgainstReference(
  calculated: number,
  reference: number,
  uncertainty: number,
  type: keyof typeof VALIDATION_TOLERANCES
): {
  isValid: boolean
  error: number
  errorPercent: number
  quality: 'excellent' | 'good' | 'acceptable' | 'failed'
  message: string
} {
  const error = Math.abs(calculated - reference)
  const errorPercent = (error / Math.abs(reference)) * 100

  const toleranceEntry = VALIDATION_TOLERANCES[type]
  const tolerances: BasicTolerance =
    'excellent' in toleranceEntry ? toleranceEntry : toleranceEntry.ideal
  let quality: 'excellent' | 'good' | 'acceptable' | 'failed' = 'failed'

  // For pH, use absolute error
  if (type === 'pH') {
    if (error <= tolerances.excellent) quality = 'excellent'
    else if (error <= tolerances.good) quality = 'good'
    else if (error <= tolerances.acceptable) quality = 'acceptable'
  } else {
    // For others, use percentage error
    if (errorPercent <= tolerances.excellent) quality = 'excellent'
    else if (errorPercent <= tolerances.good) quality = 'good'
    else if (errorPercent <= tolerances.acceptable) quality = 'acceptable'
  }

  const isValid = quality !== 'failed'

  const message = isValid
    ? `✅ Validated (${quality}): Error = ${
        type === 'pH' ? error.toFixed(3) : errorPercent.toFixed(2) + '%'
      }`
    : `❌ Failed: Error = ${
        type === 'pH' ? error.toFixed(3) : errorPercent.toFixed(2) + '%'
      } exceeds tolerance`

  return {
    isValid,
    error,
    errorPercent,
    quality,
    message,
  }
}

/**
 * Data source citations
 */
export const DATA_SOURCES = {
  NIST: {
    name: 'NIST Chemistry WebBook',
    url: 'https://webbook.nist.gov',
    citation: 'NIST Chemistry WebBook, NIST Standard Reference Database Number 69',
    lastAccessed: '2025',
  },
  CRC: {
    name: 'CRC Handbook of Chemistry and Physics',
    edition: '104th Edition',
    year: 2023,
    publisher: 'CRC Press',
    citation: 'CRC Handbook of Chemistry and Physics, 104th Edition, CRC Press, 2023',
  },
  IUPAC: {
    name: 'IUPAC',
    publications: [
      'Pure Appl. Chem. 2022; 94(5): 573-600', // Atomic masses
      'Pure Appl. Chem. 2006; 78(11): 2051-2066', // pKa compilation
    ],
    citation: 'IUPAC Technical Reports and Recommendations',
  },
  CODATA: {
    name: 'CODATA',
    year: 2018,
    citation: 'CODATA 2018 Recommended Values of the Fundamental Physical Constants',
    url: 'https://physics.nist.gov/cuu/Constants/',
  },
}
