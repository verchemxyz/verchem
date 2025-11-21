// VerChem - High-Precision Physical Constants
// All values from CODATA 2018 (internationally recommended values)

/**
 * Fundamental Physical Constants (CODATA 2018)
 */

// Avogadro constant
export const AVOGADRO_CONSTANT = 6.02214076e23 // mol⁻¹ (exact value as of 2019 SI redefinition)

// Gas constant
export const GAS_CONSTANT = {
  SI: 8.314462618, // J/(mol·K) (exact value)
  atm: 0.0820573660809596, // L·atm/(mol·K)
  mmHg: 62.36367516, // L·mmHg/(mol·K)
  kPa: 8.314462618, // L·kPa/(mol·K)
  cal: 1.98720425864083, // cal/(mol·K)
}

// Boltzmann constant
export const BOLTZMANN_CONSTANT = 1.380649e-23 // J/K (exact value as of 2019 SI)

// Planck constant
export const PLANCK_CONSTANT = 6.62607015e-34 // J·s (exact value as of 2019 SI)

// Speed of light in vacuum
export const SPEED_OF_LIGHT = 299792458 // m/s (exact value by definition)

// Elementary charge
export const ELEMENTARY_CHARGE = 1.602176634e-19 // C (exact value as of 2019 SI)

// Faraday constant
export const FARADAY_CONSTANT = 96485.33212 // C/mol (calculated from NA × e)

// Standard acceleration of gravity
export const STANDARD_GRAVITY = 9.80665 // m/s² (defined value)

// Atomic mass unit
export const ATOMIC_MASS_UNIT = 1.66053906660e-27 // kg

// Electron mass
export const ELECTRON_MASS = 9.1093837015e-31 // kg

// Proton mass
export const PROTON_MASS = 1.67262192369e-27 // kg

// Neutron mass
export const NEUTRON_MASS = 1.67492749804e-27 // kg

/**
 * Standard Conditions
 */

// STP (Standard Temperature and Pressure) - IUPAC definition
export const STP = {
  temperature: 273.15, // K (0°C)
  pressure: 101325, // Pa (1 atm)
  molarVolume: 22.413969545014137, // L/mol (calculated from ideal gas law)
}

// SATP (Standard Ambient Temperature and Pressure) - IUPAC 1982
export const SATP = {
  temperature: 298.15, // K (25°C)
  pressure: 100000, // Pa (1 bar)
  molarVolume: 24.789561909, // L/mol
}

// NTP (Normal Temperature and Pressure)
export const NTP = {
  temperature: 293.15, // K (20°C)
  pressure: 101325, // Pa (1 atm)
  molarVolume: 24.0548, // L/mol
}

/**
 * Water Properties
 */

// Ionic product of water (Kw) at various temperatures
export const WATER_ION_PRODUCT = {
  0: 1.139e-15,   // at 0°C
  10: 2.929e-15,  // at 10°C
  20: 6.809e-15,  // at 20°C
  25: 1.008e-14,  // at 25°C (standard)
  30: 1.471e-14,  // at 30°C
  40: 2.916e-14,  // at 40°C
  50: 5.476e-14,  // at 50°C
  60: 9.614e-14,  // at 60°C
  100: 5.13e-13,  // at 100°C
}

// Density of water at various temperatures (g/mL)
export const WATER_DENSITY = {
  0: 0.99984,   // at 0°C (ice point)
  4: 1.00000,   // at 4°C (maximum density)
  20: 0.99821,  // at 20°C
  25: 0.99705,  // at 25°C
  100: 0.95835, // at 100°C (boiling point)
}

/**
 * Conversion Factors (exact values)
 */

export const CONVERSIONS = {
  // Energy
  calToJoule: 4.184, // cal to J (thermochemical calorie)
  eVToJoule: 1.602176634e-19, // eV to J

  // Pressure
  atmToPa: 101325, // atm to Pa
  atmToMmHg: 760, // atm to mmHg (exact)
  atmToBar: 1.01325, // atm to bar
  atmToPsi: 14.695948775, // atm to psi

  // Temperature (formulas)
  celsiusToKelvin: (c: number) => c + 273.15,
  fahrenheitToKelvin: (f: number) => (f - 32) * 5/9 + 273.15,

  // Volume
  literToM3: 0.001, // L to m³
  mLToL: 0.001, // mL to L

  // Length
  angstromToMeter: 1e-10, // Å to m
  nanometerToMeter: 1e-9, // nm to m
}

/**
 * Mathematical Constants
 */
export const MATH = {
  PI: Math.PI,
  E: Math.E,
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG10E: Math.LOG10E,
  SQRT2: Math.SQRT2,
}

/**
 * Get precise value with correct significant figures
 */
export function formatWithSigFigs(value: number, sigFigs: number): string {
  if (value === 0) return '0'

  const magnitude = Math.floor(Math.log10(Math.abs(value)))
  const scaled = value / Math.pow(10, magnitude)
  const rounded = Math.round(scaled * Math.pow(10, sigFigs - 1)) / Math.pow(10, sigFigs - 1)

  if (magnitude >= sigFigs - 1 || magnitude < -3) {
    // Use scientific notation
    return `${rounded}e${magnitude}`
  } else {
    // Use decimal notation
    return (rounded * Math.pow(10, magnitude)).toFixed(Math.max(0, sigFigs - magnitude - 1))
  }
}