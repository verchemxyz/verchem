/**
 * VerChem - Air Quality Types
 * AQI, Pollutant Concentrations, Emission Calculations
 *
 * References:
 * - US EPA AQI Technical Assistance Document (2024)
 * - Thai PCD: ประกาศกรมควบคุมมลพิษ เรื่อง ค่ามาตรฐานคุณภาพอากาศในบรรยากาศทั่วไป
 */

// ============================================
// POLLUTANT TYPES
// ============================================

/**
 * Common air pollutants monitored worldwide
 */
export type Pollutant =
  | 'pm25'      // PM2.5 (Fine particulate matter)
  | 'pm10'      // PM10 (Coarse particulate matter)
  | 'o3'        // Ozone
  | 'co'        // Carbon Monoxide
  | 'no2'       // Nitrogen Dioxide
  | 'so2'       // Sulfur Dioxide
  | 'pb'        // Lead

/**
 * Pollutant properties for calculations
 */
export interface PollutantInfo {
  id: Pollutant
  name: string
  nameThai: string
  formula: string
  molecularWeight: number  // g/mol (for gas conversion)
  unit: 'µg/m³' | 'ppm' | 'mg/m³'
  isParticulate: boolean
  healthEffects: string
}

// ============================================
// AQI TYPES
// ============================================

/**
 * AQI Category levels
 */
export type AQICategory =
  | 'good'
  | 'moderate'
  | 'unhealthy_sensitive'
  | 'unhealthy'
  | 'very_unhealthy'
  | 'hazardous'

/**
 * AQI Category information
 */
export interface AQICategoryInfo {
  level: AQICategory
  name: string
  nameThai: string
  range: { min: number; max: number }
  color: string
  healthImplication: string
  healthImplicationThai: string
  cautionaryStatement: string
}

/**
 * AQI Breakpoint for calculation
 */
export interface AQIBreakpoint {
  pollutant: Pollutant
  concentration: { low: number; high: number }
  aqi: { low: number; high: number }
  averagingPeriod: string
}

/**
 * AQI Calculation Input
 */
export interface AQIInput {
  pollutant: Pollutant
  concentration: number
  averagingPeriod?: string  // e.g., "24-hour", "8-hour", "1-hour"
}

/**
 * AQI Calculation Result
 */
export interface AQIResult {
  aqi: number
  category: AQICategoryInfo
  pollutant: PollutantInfo
  concentration: number
  breakpoint: AQIBreakpoint
  steps: string[]
}

/**
 * Multi-pollutant AQI (overall AQI from multiple pollutants)
 */
export interface MultiPollutantAQIResult {
  overallAQI: number
  dominantPollutant: Pollutant
  category: AQICategoryInfo
  individualAQIs: { pollutant: Pollutant; aqi: number }[]
  steps: string[]
}

// ============================================
// CONCENTRATION CONVERSION TYPES
// ============================================

/**
 * Concentration conversion input
 */
export interface ConcentrationConversionInput {
  pollutant: Pollutant
  value: number
  fromUnit: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'
  toUnit: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'
  temperature?: number  // °C, default 25
  pressure?: number     // atm, default 1
}

/**
 * Concentration conversion result
 */
export interface ConcentrationConversionResult {
  inputValue: number
  inputUnit: string
  outputValue: number
  outputUnit: string
  pollutant: PollutantInfo
  temperature: number
  pressure: number
  molarVolume: number  // L/mol at given T and P
  steps: string[]
}

// ============================================
// THAI AIR QUALITY STANDARDS
// ============================================

/**
 * Thai PCD standard averaging periods
 */
export type ThaiAveragingPeriod = '1-hour' | '8-hour' | '24-hour' | 'annual' | '3-month'

/**
 * Thai Air Quality Standard
 */
export interface ThaiAirStandard {
  pollutant: Pollutant
  limit: number
  unit: string
  averagingPeriod: ThaiAveragingPeriod
  reference: string
  year: number
}

/**
 * Thai Air Quality compliance result
 */
export interface ThaiAirComplianceResult {
  pollutant: PollutantInfo
  concentration: number
  unit: string
  averagingPeriod: ThaiAveragingPeriod
  standard: ThaiAirStandard
  isCompliant: boolean
  exceedancePercent?: number
  healthRisk: string
  steps: string[]
}

/**
 * Multiple pollutant compliance check
 */
export interface MultiPollutantComplianceResult {
  overallCompliant: boolean
  results: ThaiAirComplianceResult[]
  criticalPollutants: Pollutant[]
  recommendations: string[]
}

// ============================================
// EMISSION CALCULATION TYPES
// ============================================

/**
 * Emission rate input
 */
export interface EmissionRateInput {
  pollutant: Pollutant
  concentration: number          // mg/m³ or g/m³
  concentrationUnit: 'mg/m³' | 'g/m³' | 'µg/m³'
  flowRate: number               // m³/s or m³/hr
  flowRateUnit: 'm³/s' | 'm³/hr' | 'L/min'
  operatingHours?: number        // hours per day (for daily emission)
}

/**
 * Emission rate result
 */
export interface EmissionRateResult {
  massFlowRate: number           // g/s
  hourlyEmission: number         // kg/hr
  dailyEmission: number          // kg/day
  annualEmission: number         // tons/year
  steps: string[]
}

/**
 * Stack parameters for dispersion
 */
export interface StackParameters {
  height: number                 // Stack height (m)
  diameter: number               // Stack diameter (m)
  exitVelocity: number           // Exit velocity (m/s)
  exitTemperature: number        // Exit temperature (K)
  ambientTemperature: number     // Ambient temperature (K)
  emissionRate: number           // g/s
}

/**
 * Stack dilution result
 */
export interface StackDilutionResult {
  effectiveHeight: number        // Plume rise + stack height (m)
  plumeRise: number              // Δh (m)
  buoyancyFlux: number           // F (m⁴/s³)
  momentumFlux: number           // M (m⁴/s²)
  steps: string[]
}

// ============================================
// SIMPLE GAUSSIAN DISPERSION
// ============================================

/**
 * Atmospheric stability classes (Pasquill-Gifford)
 */
export type StabilityClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

/**
 * Stability class information
 */
export interface StabilityClassInfo {
  class: StabilityClass
  name: string
  description: string
  windCondition: string
  solarRadiation: string
}

/**
 * Gaussian dispersion input
 */
export interface GaussianDispersionInput {
  emissionRate: number           // Q (g/s)
  effectiveHeight: number        // H (m) - effective stack height
  windSpeed: number              // u (m/s)
  stabilityClass: StabilityClass
  downwindDistance: number       // x (m)
  crosswindDistance?: number     // y (m), default 0 (centerline)
  receptorHeight?: number        // z (m), default 0 (ground level)
}

/**
 * Gaussian dispersion result
 */
export interface GaussianDispersionResult {
  concentration: number          // µg/m³ at receptor
  sigmaY: number                 // Horizontal dispersion (m)
  sigmaZ: number                 // Vertical dispersion (m)
  maxGroundConcentration: number // Maximum ground-level concentration
  maxDistance: number            // Distance of maximum concentration (m)
  steps: string[]
}

// ============================================
// CALCULATOR MODE TYPES
// ============================================

/**
 * Air Quality Calculator Modes
 */
export type AirQualityMode =
  | 'aqi'                        // Calculate AQI from concentration
  | 'concentration_conversion'   // ppm ↔ µg/m³ conversion
  | 'thai_standards'             // Check Thai PCD compliance
  | 'emission_rate'              // Calculate emission rate
  | 'stack_dispersion'           // Basic Gaussian dispersion
  | 'plume_rise'                 // Calculate effective stack height

/**
 * Mode configuration for UI
 */
export interface AirQualityModeConfig {
  id: AirQualityMode
  name: string
  description: string
  icon: string
}

/**
 * All available air quality modes
 */
export const AIR_QUALITY_MODES: AirQualityModeConfig[] = [
  {
    id: 'aqi',
    name: 'AQI Calculator',
    description: 'Calculate Air Quality Index from pollutant concentration',
    icon: '🌡️',
  },
  {
    id: 'concentration_conversion',
    name: 'Unit Conversion',
    description: 'Convert between ppm, ppb, µg/m³, and mg/m³',
    icon: '🔄',
  },
  {
    id: 'thai_standards',
    name: 'Thai Standards',
    description: 'Check compliance with Thai PCD air quality standards',
    icon: '🇹🇭',
  },
  {
    id: 'emission_rate',
    name: 'Emission Rate',
    description: 'Calculate pollutant emission rate (g/s, kg/hr, tons/year)',
    icon: '🏭',
  },
  {
    id: 'plume_rise',
    name: 'Plume Rise',
    description: 'Calculate effective stack height (Briggs equations)',
    icon: '💨',
  },
  {
    id: 'stack_dispersion',
    name: 'Dispersion Model',
    description: 'Simple Gaussian dispersion for ground-level concentration',
    icon: '🌫️',
  },
]
