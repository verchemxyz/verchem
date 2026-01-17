/**
 * VerChem - Air Quality Calculations
 * AQI, Concentration Conversion, Emission Rate, Dispersion
 *
 * References:
 * - US EPA AQI Technical Assistance Document (2024)
 * - Thai PCD: ประกาศกรมควบคุมมลพิษ เรื่อง ค่ามาตรฐานคุณภาพอากาศในบรรยากาศทั่วไป (พ.ศ. 2566)
 * - Briggs Plume Rise Equations (1969, 1971)
 * - Turner's Workbook of Atmospheric Dispersion Estimates (1970)
 */

import type {
  Pollutant,
  PollutantInfo,
  AQICategoryInfo,
  AQIBreakpoint,
  AQIInput,
  AQIResult,
  ConcentrationConversionInput,
  ConcentrationConversionResult,
  ThaiAirStandard,
  ThaiAveragingPeriod,
  ThaiAirComplianceResult,
  EmissionRateInput,
  EmissionRateResult,
  StackParameters,
  StackDilutionResult,
  StabilityClass,
  StabilityClassInfo,
  GaussianDispersionInput,
  GaussianDispersionResult,
} from '@/lib/types/air-quality'

// ============================================
// CONSTANTS
// ============================================

/** Standard temperature for gas calculations (K) */
export const STANDARD_TEMPERATURE_K = 298.15  // 25°C

/** Standard pressure (atm) */
export const STANDARD_PRESSURE_ATM = 1.0

/** Ideal gas constant (L·atm/(mol·K)) */
export const GAS_CONSTANT = 0.08206

/** Molar volume at STP (L/mol) at 25°C, 1 atm */
export const MOLAR_VOLUME_STP = 24.45

// ============================================
// POLLUTANT DATA
// ============================================

export const POLLUTANT_INFO: Record<Pollutant, PollutantInfo> = {
  pm25: {
    id: 'pm25',
    name: 'PM2.5',
    nameThai: 'ฝุ่นละอองขนาดเล็ก PM2.5',
    formula: 'PM₂.₅',
    molecularWeight: 0,  // Not applicable for particulates
    unit: 'µg/m³',
    isParticulate: true,
    healthEffects: 'Penetrates deep into lungs, causes respiratory and cardiovascular disease',
  },
  pm10: {
    id: 'pm10',
    name: 'PM10',
    nameThai: 'ฝุ่นละอองขนาดไม่เกิน 10 ไมครอน',
    formula: 'PM₁₀',
    molecularWeight: 0,
    unit: 'µg/m³',
    isParticulate: true,
    healthEffects: 'Causes respiratory irritation and aggravates asthma',
  },
  o3: {
    id: 'o3',
    name: 'Ozone',
    nameThai: 'โอโซน',
    formula: 'O₃',
    molecularWeight: 48.0,
    unit: 'ppm',
    isParticulate: false,
    healthEffects: 'Causes respiratory inflammation, reduces lung function',
  },
  co: {
    id: 'co',
    name: 'Carbon Monoxide',
    nameThai: 'คาร์บอนมอนอกไซด์',
    formula: 'CO',
    molecularWeight: 28.01,
    unit: 'ppm',
    isParticulate: false,
    healthEffects: 'Reduces oxygen delivery to organs, causes headaches and dizziness',
  },
  no2: {
    id: 'no2',
    name: 'Nitrogen Dioxide',
    nameThai: 'ไนโตรเจนไดออกไซด์',
    formula: 'NO₂',
    molecularWeight: 46.01,
    unit: 'ppm',
    isParticulate: false,
    healthEffects: 'Irritates airways, increases susceptibility to respiratory infections',
  },
  so2: {
    id: 'so2',
    name: 'Sulfur Dioxide',
    nameThai: 'ซัลเฟอร์ไดออกไซด์',
    formula: 'SO₂',
    molecularWeight: 64.07,
    unit: 'ppm',
    isParticulate: false,
    healthEffects: 'Causes bronchoconstriction, aggravates asthma',
  },
  pb: {
    id: 'pb',
    name: 'Lead',
    nameThai: 'ตะกั่ว',
    formula: 'Pb',
    molecularWeight: 207.2,
    unit: 'µg/m³',
    isParticulate: true,
    healthEffects: 'Neurotoxic, affects brain development in children',
  },
}

// ============================================
// AQI CATEGORIES (US EPA)
// ============================================

export const AQI_CATEGORIES: AQICategoryInfo[] = [
  {
    level: 'good',
    name: 'Good',
    nameThai: 'ดีมาก',
    range: { min: 0, max: 50 },
    color: '#00E400',  // Green
    healthImplication: 'Air quality is satisfactory, poses little or no risk',
    healthImplicationThai: 'คุณภาพอากาศดี ไม่มีผลกระทบต่อสุขภาพ',
    cautionaryStatement: 'None',
  },
  {
    level: 'moderate',
    name: 'Moderate',
    nameThai: 'ปานกลาง',
    range: { min: 51, max: 100 },
    color: '#FFFF00',  // Yellow
    healthImplication: 'Acceptable quality, moderate health concern for sensitive groups',
    healthImplicationThai: 'คุณภาพอากาศพอใช้ ผู้ที่มีความไวอาจได้รับผลกระทบ',
    cautionaryStatement: 'Unusually sensitive people should consider reducing prolonged outdoor exertion',
  },
  {
    level: 'unhealthy_sensitive',
    name: 'Unhealthy for Sensitive Groups',
    nameThai: 'มีผลกระทบต่อกลุ่มเสี่ยง',
    range: { min: 101, max: 150 },
    color: '#FF7E00',  // Orange
    healthImplication: 'Members of sensitive groups may experience health effects',
    healthImplicationThai: 'เริ่มมีผลกระทบต่อสุขภาพ โดยเฉพาะกลุ่มเสี่ยง',
    cautionaryStatement: 'Active children and adults, and people with respiratory disease should limit prolonged outdoor exertion',
  },
  {
    level: 'unhealthy',
    name: 'Unhealthy',
    nameThai: 'มีผลกระทบต่อสุขภาพ',
    range: { min: 151, max: 200 },
    color: '#FF0000',  // Red
    healthImplication: 'Everyone may begin to experience health effects',
    healthImplicationThai: 'ทุกคนอาจได้รับผลกระทบต่อสุขภาพ',
    cautionaryStatement: 'Active children and adults, and people with respiratory disease should avoid prolonged outdoor exertion',
  },
  {
    level: 'very_unhealthy',
    name: 'Very Unhealthy',
    nameThai: 'มีผลกระทบต่อสุขภาพมาก',
    range: { min: 201, max: 300 },
    color: '#8F3F97',  // Purple
    healthImplication: 'Health alert: everyone may experience more serious health effects',
    healthImplicationThai: 'เตือนภัยสุขภาพ ทุกคนอาจได้รับผลกระทบรุนแรง',
    cautionaryStatement: 'Active children and adults, and people with respiratory disease should avoid all outdoor exertion',
  },
  {
    level: 'hazardous',
    name: 'Hazardous',
    nameThai: 'อันตราย',
    range: { min: 301, max: 500 },
    color: '#7E0023',  // Maroon
    healthImplication: 'Health emergency: everyone is more likely to be affected',
    healthImplicationThai: 'ฉุกเฉินด้านสุขภาพ ทุกคนมีความเสี่ยงสูง',
    cautionaryStatement: 'Everyone should avoid all outdoor exertion',
  },
]

// ============================================
// AQI BREAKPOINTS (US EPA 2024)
// ============================================

export const AQI_BREAKPOINTS: AQIBreakpoint[] = [
  // PM2.5 (24-hour average, µg/m³)
  { pollutant: 'pm25', concentration: { low: 0.0, high: 9.0 }, aqi: { low: 0, high: 50 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm25', concentration: { low: 9.1, high: 35.4 }, aqi: { low: 51, high: 100 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm25', concentration: { low: 35.5, high: 55.4 }, aqi: { low: 101, high: 150 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm25', concentration: { low: 55.5, high: 125.4 }, aqi: { low: 151, high: 200 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm25', concentration: { low: 125.5, high: 225.4 }, aqi: { low: 201, high: 300 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm25', concentration: { low: 225.5, high: 325.4 }, aqi: { low: 301, high: 500 }, averagingPeriod: '24-hour' },

  // PM10 (24-hour average, µg/m³)
  { pollutant: 'pm10', concentration: { low: 0, high: 54 }, aqi: { low: 0, high: 50 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm10', concentration: { low: 55, high: 154 }, aqi: { low: 51, high: 100 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm10', concentration: { low: 155, high: 254 }, aqi: { low: 101, high: 150 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm10', concentration: { low: 255, high: 354 }, aqi: { low: 151, high: 200 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm10', concentration: { low: 355, high: 424 }, aqi: { low: 201, high: 300 }, averagingPeriod: '24-hour' },
  { pollutant: 'pm10', concentration: { low: 425, high: 604 }, aqi: { low: 301, high: 500 }, averagingPeriod: '24-hour' },

  // O3 (8-hour average, ppm)
  { pollutant: 'o3', concentration: { low: 0.000, high: 0.054 }, aqi: { low: 0, high: 50 }, averagingPeriod: '8-hour' },
  { pollutant: 'o3', concentration: { low: 0.055, high: 0.070 }, aqi: { low: 51, high: 100 }, averagingPeriod: '8-hour' },
  { pollutant: 'o3', concentration: { low: 0.071, high: 0.085 }, aqi: { low: 101, high: 150 }, averagingPeriod: '8-hour' },
  { pollutant: 'o3', concentration: { low: 0.086, high: 0.105 }, aqi: { low: 151, high: 200 }, averagingPeriod: '8-hour' },
  { pollutant: 'o3', concentration: { low: 0.106, high: 0.200 }, aqi: { low: 201, high: 300 }, averagingPeriod: '8-hour' },

  // CO (8-hour average, ppm)
  { pollutant: 'co', concentration: { low: 0.0, high: 4.4 }, aqi: { low: 0, high: 50 }, averagingPeriod: '8-hour' },
  { pollutant: 'co', concentration: { low: 4.5, high: 9.4 }, aqi: { low: 51, high: 100 }, averagingPeriod: '8-hour' },
  { pollutant: 'co', concentration: { low: 9.5, high: 12.4 }, aqi: { low: 101, high: 150 }, averagingPeriod: '8-hour' },
  { pollutant: 'co', concentration: { low: 12.5, high: 15.4 }, aqi: { low: 151, high: 200 }, averagingPeriod: '8-hour' },
  { pollutant: 'co', concentration: { low: 15.5, high: 30.4 }, aqi: { low: 201, high: 300 }, averagingPeriod: '8-hour' },
  { pollutant: 'co', concentration: { low: 30.5, high: 50.4 }, aqi: { low: 301, high: 500 }, averagingPeriod: '8-hour' },

  // NO2 (1-hour average, ppb)
  { pollutant: 'no2', concentration: { low: 0, high: 53 }, aqi: { low: 0, high: 50 }, averagingPeriod: '1-hour' },
  { pollutant: 'no2', concentration: { low: 54, high: 100 }, aqi: { low: 51, high: 100 }, averagingPeriod: '1-hour' },
  { pollutant: 'no2', concentration: { low: 101, high: 360 }, aqi: { low: 101, high: 150 }, averagingPeriod: '1-hour' },
  { pollutant: 'no2', concentration: { low: 361, high: 649 }, aqi: { low: 151, high: 200 }, averagingPeriod: '1-hour' },
  { pollutant: 'no2', concentration: { low: 650, high: 1249 }, aqi: { low: 201, high: 300 }, averagingPeriod: '1-hour' },
  { pollutant: 'no2', concentration: { low: 1250, high: 2049 }, aqi: { low: 301, high: 500 }, averagingPeriod: '1-hour' },

  // SO2 (1-hour average, ppb)
  { pollutant: 'so2', concentration: { low: 0, high: 35 }, aqi: { low: 0, high: 50 }, averagingPeriod: '1-hour' },
  { pollutant: 'so2', concentration: { low: 36, high: 75 }, aqi: { low: 51, high: 100 }, averagingPeriod: '1-hour' },
  { pollutant: 'so2', concentration: { low: 76, high: 185 }, aqi: { low: 101, high: 150 }, averagingPeriod: '1-hour' },
  { pollutant: 'so2', concentration: { low: 186, high: 304 }, aqi: { low: 151, high: 200 }, averagingPeriod: '1-hour' },
  { pollutant: 'so2', concentration: { low: 305, high: 604 }, aqi: { low: 201, high: 300 }, averagingPeriod: '1-hour' },
  { pollutant: 'so2', concentration: { low: 605, high: 1004 }, aqi: { low: 301, high: 500 }, averagingPeriod: '1-hour' },
]

// ============================================
// THAI AIR QUALITY STANDARDS (พ.ศ. 2566)
// ============================================

export const THAI_AIR_STANDARDS: ThaiAirStandard[] = [
  // PM2.5 - Updated 2023
  { pollutant: 'pm25', limit: 37.5, unit: 'µg/m³', averagingPeriod: '24-hour', reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2566', year: 2023 },
  { pollutant: 'pm25', limit: 15, unit: 'µg/m³', averagingPeriod: 'annual', reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2566', year: 2023 },

  // PM10
  { pollutant: 'pm10', limit: 120, unit: 'µg/m³', averagingPeriod: '24-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2010 },
  { pollutant: 'pm10', limit: 50, unit: 'µg/m³', averagingPeriod: 'annual', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2010 },

  // O3
  { pollutant: 'o3', limit: 0.10, unit: 'ppm', averagingPeriod: '1-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },
  { pollutant: 'o3', limit: 0.07, unit: 'ppm', averagingPeriod: '8-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },

  // CO
  { pollutant: 'co', limit: 30, unit: 'ppm', averagingPeriod: '1-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },
  { pollutant: 'co', limit: 9, unit: 'ppm', averagingPeriod: '8-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },

  // NO2
  { pollutant: 'no2', limit: 0.17, unit: 'ppm', averagingPeriod: '1-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },
  { pollutant: 'no2', limit: 0.03, unit: 'ppm', averagingPeriod: 'annual', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },

  // SO2
  { pollutant: 'so2', limit: 0.30, unit: 'ppm', averagingPeriod: '1-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },
  { pollutant: 'so2', limit: 0.12, unit: 'ppm', averagingPeriod: '24-hour', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },
  { pollutant: 'so2', limit: 0.04, unit: 'ppm', averagingPeriod: 'annual', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },

  // Lead
  { pollutant: 'pb', limit: 1.5, unit: 'µg/m³', averagingPeriod: '3-month', reference: 'ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ', year: 2004 },
]

// ============================================
// STABILITY CLASS DATA
// ============================================

export const STABILITY_CLASSES: StabilityClassInfo[] = [
  { class: 'A', name: 'Extremely Unstable', description: 'Strong convective mixing', windCondition: 'Light winds', solarRadiation: 'Strong solar' },
  { class: 'B', name: 'Moderately Unstable', description: 'Moderate convection', windCondition: 'Light-moderate winds', solarRadiation: 'Moderate solar' },
  { class: 'C', name: 'Slightly Unstable', description: 'Weak convection', windCondition: 'Moderate winds', solarRadiation: 'Slight solar' },
  { class: 'D', name: 'Neutral', description: 'Mechanical mixing only', windCondition: 'Moderate-strong winds', solarRadiation: 'Overcast or night' },
  { class: 'E', name: 'Slightly Stable', description: 'Weak inversion', windCondition: 'Light winds', solarRadiation: 'Night, partial clouds' },
  { class: 'F', name: 'Moderately Stable', description: 'Strong inversion', windCondition: 'Light winds', solarRadiation: 'Clear night' },
]

// ============================================
// AQI CALCULATIONS
// ============================================

/**
 * Get AQI category from AQI value
 */
export function getAQICategory(aqi: number): AQICategoryInfo {
  for (const category of AQI_CATEGORIES) {
    if (aqi >= category.range.min && aqi <= category.range.max) {
      return category
    }
  }
  // If AQI > 500, return hazardous
  return AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
}

/**
 * Find appropriate AQI breakpoint for pollutant and concentration
 */
export function findBreakpoint(pollutant: Pollutant, concentration: number): AQIBreakpoint | null {
  const breakpoints = AQI_BREAKPOINTS.filter(bp => bp.pollutant === pollutant)

  for (const bp of breakpoints) {
    if (concentration >= bp.concentration.low && concentration <= bp.concentration.high) {
      return bp
    }
  }

  // Return highest breakpoint if concentration exceeds all
  if (breakpoints.length > 0 && concentration > breakpoints[breakpoints.length - 1].concentration.high) {
    return breakpoints[breakpoints.length - 1]
  }

  return null
}

/**
 * Calculate AQI from pollutant concentration
 * Formula: AQI = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 */
export function calculateAQI(input: AQIInput): AQIResult {
  const { pollutant, concentration } = input

  const steps: string[] = []
  steps.push('=== AQI Calculation (US EPA Method) ===\n')
  steps.push('Formula: AQI = ((I_high - I_low) / (C_high - C_low)) × (C - C_low) + I_low\n')

  // Validation
  if (concentration < 0) {
    throw new Error('Concentration cannot be negative')
  }

  const pollutantInfo = POLLUTANT_INFO[pollutant]

  steps.push('Given:')
  steps.push(`  Pollutant: ${pollutantInfo.name} (${pollutantInfo.formula})`)
  steps.push(`  Concentration: ${concentration} ${pollutantInfo.unit}`)
  steps.push('')

  // Find breakpoint
  const breakpoint = findBreakpoint(pollutant, concentration)

  if (!breakpoint) {
    throw new Error(`No breakpoint found for ${pollutant} at ${concentration}`)
  }

  steps.push('Step 1: Find Breakpoint')
  steps.push(`  Averaging Period: ${breakpoint.averagingPeriod}`)
  steps.push(`  C_low = ${breakpoint.concentration.low}`)
  steps.push(`  C_high = ${breakpoint.concentration.high}`)
  steps.push(`  I_low = ${breakpoint.aqi.low}`)
  steps.push(`  I_high = ${breakpoint.aqi.high}`)
  steps.push('')

  // Calculate AQI
  const { low: cLow, high: cHigh } = breakpoint.concentration
  const { low: iLow, high: iHigh } = breakpoint.aqi

  const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow
  const roundedAQI = Math.round(aqi)

  steps.push('Step 2: Calculate AQI')
  steps.push(`  AQI = ((${iHigh} - ${iLow}) / (${cHigh} - ${cLow})) × (${concentration} - ${cLow}) + ${iLow}`)
  steps.push(`  AQI = (${iHigh - iLow} / ${cHigh - cLow}) × ${concentration - cLow} + ${iLow}`)
  steps.push(`  AQI = ${((iHigh - iLow) / (cHigh - cLow)).toFixed(4)} × ${concentration - cLow} + ${iLow}`)
  steps.push(`  AQI = ${aqi.toFixed(1)} ≈ ${roundedAQI}`)
  steps.push('')

  // Get category
  const category = getAQICategory(roundedAQI)

  steps.push('Step 3: Determine Category')
  steps.push(`  AQI ${roundedAQI} → ${category.name} (${category.nameThai})`)
  steps.push(`  Color: ${category.color}`)
  steps.push(`  Health: ${category.healthImplication}`)

  return {
    aqi: roundedAQI,
    category,
    pollutant: pollutantInfo,
    concentration,
    breakpoint,
    steps,
  }
}

// ============================================
// CONCENTRATION CONVERSION
// ============================================

/**
 * Calculate molar volume at given temperature and pressure
 * V = RT/P (ideal gas law)
 */
export function calculateMolarVolume(temperatureC: number, pressureAtm: number): number {
  const temperatureK = temperatureC + 273.15
  return (GAS_CONSTANT * temperatureK) / pressureAtm
}

/**
 * Convert concentration between units
 * ppm to µg/m³: C(µg/m³) = C(ppm) × MW × 1000 / Vm
 * µg/m³ to ppm: C(ppm) = C(µg/m³) × Vm / (MW × 1000)
 */
export function convertConcentration(input: ConcentrationConversionInput): ConcentrationConversionResult {
  const {
    pollutant,
    value,
    fromUnit,
    toUnit,
    temperature = 25,
    pressure = 1,
  } = input

  const steps: string[] = []
  steps.push('=== Concentration Unit Conversion ===\n')

  const pollutantInfo = POLLUTANT_INFO[pollutant]

  // Validate
  if (pollutantInfo.isParticulate && (fromUnit === 'ppm' || fromUnit === 'ppb' || toUnit === 'ppm' || toUnit === 'ppb')) {
    throw new Error(`Cannot use ppm/ppb for particulate matter (${pollutant}). Use µg/m³ or mg/m³.`)
  }

  if (value < 0) {
    throw new Error('Concentration cannot be negative')
  }

  steps.push('Given:')
  steps.push(`  Pollutant: ${pollutantInfo.name} (${pollutantInfo.formula})`)
  steps.push(`  Molecular Weight: ${pollutantInfo.molecularWeight} g/mol`)
  steps.push(`  Input: ${value} ${fromUnit}`)
  steps.push(`  Temperature: ${temperature}°C`)
  steps.push(`  Pressure: ${pressure} atm`)
  steps.push('')

  // Calculate molar volume
  const molarVolume = calculateMolarVolume(temperature, pressure)

  steps.push('Step 1: Calculate Molar Volume')
  steps.push(`  Vm = RT/P = 0.08206 × ${temperature + 273.15} / ${pressure}`)
  steps.push(`  Vm = ${molarVolume.toFixed(3)} L/mol`)
  steps.push('')

  // Normalize to base unit (µg/m³)
  let baseValue: number

  steps.push('Step 2: Convert to base unit (µg/m³)')

  switch (fromUnit) {
    case 'ppm':
      baseValue = (value * pollutantInfo.molecularWeight * 1000) / molarVolume
      steps.push(`  ${value} ppm × ${pollutantInfo.molecularWeight} × 1000 / ${molarVolume.toFixed(3)}`)
      steps.push(`  = ${baseValue.toFixed(4)} µg/m³`)
      break
    case 'ppb':
      baseValue = (value * pollutantInfo.molecularWeight) / molarVolume
      steps.push(`  ${value} ppb × ${pollutantInfo.molecularWeight} / ${molarVolume.toFixed(3)}`)
      steps.push(`  = ${baseValue.toFixed(4)} µg/m³`)
      break
    case 'mg/m³':
      baseValue = value * 1000
      steps.push(`  ${value} mg/m³ × 1000 = ${baseValue} µg/m³`)
      break
    case 'µg/m³':
      baseValue = value
      steps.push(`  Already in µg/m³: ${baseValue}`)
      break
    default:
      throw new Error(`Unknown unit: ${fromUnit}`)
  }
  steps.push('')

  // Convert from base to target
  let outputValue: number

  steps.push('Step 3: Convert to target unit')

  switch (toUnit) {
    case 'ppm':
      outputValue = (baseValue * molarVolume) / (pollutantInfo.molecularWeight * 1000)
      steps.push(`  ${baseValue.toFixed(4)} × ${molarVolume.toFixed(3)} / (${pollutantInfo.molecularWeight} × 1000)`)
      steps.push(`  = ${outputValue.toFixed(6)} ppm`)
      break
    case 'ppb':
      outputValue = (baseValue * molarVolume) / pollutantInfo.molecularWeight
      steps.push(`  ${baseValue.toFixed(4)} × ${molarVolume.toFixed(3)} / ${pollutantInfo.molecularWeight}`)
      steps.push(`  = ${outputValue.toFixed(4)} ppb`)
      break
    case 'mg/m³':
      outputValue = baseValue / 1000
      steps.push(`  ${baseValue.toFixed(4)} / 1000 = ${outputValue.toFixed(6)} mg/m³`)
      break
    case 'µg/m³':
      outputValue = baseValue
      steps.push(`  Already in µg/m³: ${outputValue.toFixed(4)}`)
      break
    default:
      throw new Error(`Unknown unit: ${toUnit}`)
  }

  return {
    inputValue: value,
    inputUnit: fromUnit,
    outputValue,
    outputUnit: toUnit,
    pollutant: pollutantInfo,
    temperature,
    pressure,
    molarVolume,
    steps,
  }
}

// ============================================
// THAI STANDARDS COMPLIANCE
// ============================================

/**
 * Check compliance against Thai PCD air quality standards
 */
export function checkThaiAirStandard(
  pollutant: Pollutant,
  concentration: number,
  averagingPeriod: ThaiAveragingPeriod
): ThaiAirComplianceResult {
  const steps: string[] = []
  steps.push('=== Thai Air Quality Standards Compliance Check ===\n')

  const pollutantInfo = POLLUTANT_INFO[pollutant]

  // Find applicable standard
  const standard = THAI_AIR_STANDARDS.find(
    s => s.pollutant === pollutant && s.averagingPeriod === averagingPeriod
  )

  if (!standard) {
    throw new Error(`No Thai standard found for ${pollutant} with ${averagingPeriod} averaging period`)
  }

  steps.push('Given:')
  steps.push(`  Pollutant: ${pollutantInfo.name} (${pollutantInfo.formula})`)
  steps.push(`  Concentration: ${concentration} ${standard.unit}`)
  steps.push(`  Averaging Period: ${averagingPeriod}`)
  steps.push('')

  steps.push('Thai Standard (กรมควบคุมมลพิษ):')
  steps.push(`  Limit: ${standard.limit} ${standard.unit}`)
  steps.push(`  Reference: ${standard.reference}`)
  steps.push(`  Year: ${standard.year}`)
  steps.push('')

  const isCompliant = concentration <= standard.limit
  const exceedancePercent = isCompliant ? undefined : ((concentration - standard.limit) / standard.limit) * 100

  steps.push('Compliance Check:')
  steps.push(`  ${concentration} ${isCompliant ? '≤' : '>'} ${standard.limit} ${standard.unit}`)

  if (isCompliant) {
    steps.push(`  Result: ✅ COMPLIANT (ผ่านมาตรฐาน)`)
  } else {
    steps.push(`  Result: ❌ EXCEEDS STANDARD (เกินมาตรฐาน)`)
    steps.push(`  Exceedance: ${exceedancePercent?.toFixed(1)}% above limit`)
  }

  // Health risk assessment
  let healthRisk: string

  if (isCompliant) {
    healthRisk = 'Within safe limits for general population'
  } else if (exceedancePercent && exceedancePercent < 50) {
    healthRisk = 'Moderate health concern, sensitive groups should limit exposure'
  } else if (exceedancePercent && exceedancePercent < 100) {
    healthRisk = 'Significant health risk, all groups should reduce outdoor activities'
  } else {
    healthRisk = 'Severe health emergency, avoid all outdoor exposure'
  }

  steps.push(`\nHealth Risk: ${healthRisk}`)

  return {
    pollutant: pollutantInfo,
    concentration,
    unit: standard.unit,
    averagingPeriod,
    standard,
    isCompliant,
    exceedancePercent,
    healthRisk,
    steps,
  }
}

// ============================================
// EMISSION RATE CALCULATIONS
// ============================================

/**
 * Calculate emission rate from concentration and flow
 */
export function calculateEmissionRate(input: EmissionRateInput): EmissionRateResult {
  const {
    pollutant,
    concentration,
    concentrationUnit,
    flowRate,
    flowRateUnit,
    operatingHours = 24,
  } = input

  const steps: string[] = []
  steps.push('=== Emission Rate Calculation ===\n')
  steps.push('Formula: Emission = Concentration × Flow Rate\n')

  const pollutantInfo = POLLUTANT_INFO[pollutant]

  steps.push('Given:')
  steps.push(`  Pollutant: ${pollutantInfo.name}`)
  steps.push(`  Concentration: ${concentration} ${concentrationUnit}`)
  steps.push(`  Flow Rate: ${flowRate} ${flowRateUnit}`)
  steps.push(`  Operating Hours: ${operatingHours} hr/day`)
  steps.push('')

  // Convert concentration to g/m³
  let concGM3: number
  steps.push('Step 1: Convert concentration to g/m³')

  switch (concentrationUnit) {
    case 'µg/m³':
      concGM3 = concentration / 1e6
      steps.push(`  ${concentration} µg/m³ ÷ 1,000,000 = ${concGM3.toExponential(4)} g/m³`)
      break
    case 'mg/m³':
      concGM3 = concentration / 1000
      steps.push(`  ${concentration} mg/m³ ÷ 1,000 = ${concGM3.toExponential(4)} g/m³`)
      break
    case 'g/m³':
      concGM3 = concentration
      steps.push(`  Already in g/m³: ${concGM3}`)
      break
    default:
      throw new Error(`Unknown concentration unit: ${concentrationUnit}`)
  }
  steps.push('')

  // Convert flow rate to m³/s
  let flowM3S: number
  steps.push('Step 2: Convert flow rate to m³/s')

  switch (flowRateUnit) {
    case 'm³/s':
      flowM3S = flowRate
      steps.push(`  Already in m³/s: ${flowM3S}`)
      break
    case 'm³/hr':
      flowM3S = flowRate / 3600
      steps.push(`  ${flowRate} m³/hr ÷ 3600 = ${flowM3S.toFixed(6)} m³/s`)
      break
    case 'L/min':
      flowM3S = flowRate / 1000 / 60
      steps.push(`  ${flowRate} L/min ÷ 1000 ÷ 60 = ${flowM3S.toFixed(6)} m³/s`)
      break
    default:
      throw new Error(`Unknown flow rate unit: ${flowRateUnit}`)
  }
  steps.push('')

  // Calculate mass flow rate (g/s)
  const massFlowRate = concGM3 * flowM3S

  steps.push('Step 3: Calculate Mass Flow Rate')
  steps.push(`  Mass Flow = ${concGM3.toExponential(4)} g/m³ × ${flowM3S.toFixed(6)} m³/s`)
  steps.push(`  Mass Flow = ${massFlowRate.toExponential(4)} g/s`)
  steps.push('')

  // Calculate hourly, daily, annual
  const hourlyEmission = massFlowRate * 3600 / 1000  // kg/hr
  const dailyEmission = hourlyEmission * operatingHours  // kg/day
  const annualEmission = dailyEmission * 365 / 1000  // tons/year

  steps.push('Step 4: Calculate Emission Rates')
  steps.push(`  Hourly: ${massFlowRate.toExponential(4)} g/s × 3600 s/hr ÷ 1000 = ${hourlyEmission.toFixed(4)} kg/hr`)
  steps.push(`  Daily: ${hourlyEmission.toFixed(4)} kg/hr × ${operatingHours} hr/day = ${dailyEmission.toFixed(2)} kg/day`)
  steps.push(`  Annual: ${dailyEmission.toFixed(2)} kg/day × 365 days ÷ 1000 = ${annualEmission.toFixed(2)} tons/year`)

  return {
    massFlowRate,
    hourlyEmission,
    dailyEmission,
    annualEmission,
    steps,
  }
}

// ============================================
// PLUME RISE (BRIGGS EQUATIONS)
// ============================================

/**
 * Calculate plume rise and effective stack height
 * Using Briggs (1969, 1971) equations
 */
export function calculatePlumeRise(params: StackParameters): StackDilutionResult {
  const {
    height,
    diameter,
    exitVelocity,
    exitTemperature,
    ambientTemperature,
    emissionRate,
  } = params

  const steps: string[] = []
  steps.push('=== Plume Rise Calculation (Briggs Equations) ===\n')

  // Validation
  if (height <= 0 || diameter <= 0 || exitVelocity <= 0) {
    throw new Error('Stack parameters must be positive')
  }
  if (exitTemperature <= ambientTemperature) {
    throw new Error('Exit temperature must be greater than ambient temperature')
  }

  steps.push('Given Stack Parameters:')
  steps.push(`  Stack Height (h): ${height} m`)
  steps.push(`  Stack Diameter (d): ${diameter} m`)
  steps.push(`  Exit Velocity (v): ${exitVelocity} m/s`)
  steps.push(`  Exit Temperature (Ts): ${exitTemperature} K`)
  steps.push(`  Ambient Temperature (Ta): ${ambientTemperature} K`)
  steps.push(`  Emission Rate (Q): ${emissionRate} g/s`)
  steps.push('')

  // Calculate stack area
  const stackArea = Math.PI * Math.pow(diameter / 2, 2)

  // Calculate volumetric flow rate
  const volumetricFlow = stackArea * exitVelocity

  steps.push('Step 1: Calculate Stack Area and Flow')
  steps.push(`  A = π × (d/2)² = π × (${diameter}/2)² = ${stackArea.toFixed(4)} m²`)
  steps.push(`  Volumetric Flow = A × v = ${stackArea.toFixed(4)} × ${exitVelocity} = ${volumetricFlow.toFixed(4)} m³/s`)
  steps.push('')

  // Calculate buoyancy flux (F)
  // F = g × V × (Ts - Ta) / Ts
  const g = 9.81
  const buoyancyFlux = g * volumetricFlow * (exitTemperature - ambientTemperature) / exitTemperature

  steps.push('Step 2: Calculate Buoyancy Flux (F)')
  steps.push(`  F = g × V × (Ts - Ta) / Ts`)
  steps.push(`  F = 9.81 × ${volumetricFlow.toFixed(4)} × (${exitTemperature} - ${ambientTemperature}) / ${exitTemperature}`)
  steps.push(`  F = ${buoyancyFlux.toFixed(4)} m⁴/s³`)
  steps.push('')

  // Calculate momentum flux (M)
  // M = V × v = A × v²
  const momentumFlux = volumetricFlow * exitVelocity

  steps.push('Step 3: Calculate Momentum Flux (M)')
  steps.push(`  M = V × v = ${volumetricFlow.toFixed(4)} × ${exitVelocity}`)
  steps.push(`  M = ${momentumFlux.toFixed(4)} m⁴/s²`)
  steps.push('')

  // Calculate plume rise (neutral/slightly unstable conditions)
  // Using Briggs equation for neutral conditions: Δh = 1.6 × F^(1/3) × x^(2/3) / u
  // For final rise (x → ∞): Δh = 2.6 × (F / (u × s))^(1/3)
  // Simplified for neutral: Δh = 1.6 × F^(1/3) × (3.5 × x*)^(2/3) / u
  // where x* = distance to final rise

  // For simplification, use empirical formula for neutral stability:
  // Δh_final = 21.4 × F^(0.75) / u (for F < 55)
  // Δh_final = 38.7 × F^(0.6) / u (for F ≥ 55)

  // Assume neutral conditions with u = 3 m/s for demonstration
  const windSpeed = 3  // m/s (typical)

  let plumeRise: number
  if (buoyancyFlux < 55) {
    plumeRise = 21.4 * Math.pow(buoyancyFlux, 0.75) / windSpeed
  } else {
    plumeRise = 38.7 * Math.pow(buoyancyFlux, 0.6) / windSpeed
  }

  steps.push('Step 4: Calculate Plume Rise (Neutral Stability, u = 3 m/s)')
  if (buoyancyFlux < 55) {
    steps.push(`  Δh = 21.4 × F^0.75 / u (for F < 55)`)
    steps.push(`  Δh = 21.4 × ${buoyancyFlux.toFixed(4)}^0.75 / 3`)
  } else {
    steps.push(`  Δh = 38.7 × F^0.6 / u (for F ≥ 55)`)
    steps.push(`  Δh = 38.7 × ${buoyancyFlux.toFixed(4)}^0.6 / 3`)
  }
  steps.push(`  Δh = ${plumeRise.toFixed(2)} m`)
  steps.push('')

  // Calculate effective height
  const effectiveHeight = height + plumeRise

  steps.push('Step 5: Calculate Effective Stack Height')
  steps.push(`  H = h + Δh = ${height} + ${plumeRise.toFixed(2)}`)
  steps.push(`  H = ${effectiveHeight.toFixed(2)} m`)

  return {
    effectiveHeight,
    plumeRise,
    buoyancyFlux,
    momentumFlux,
    steps,
  }
}

// ============================================
// GAUSSIAN DISPERSION MODEL
// ============================================

/**
 * Dispersion coefficients (Pasquill-Gifford)
 * Returns sigma_y and sigma_z for given distance and stability
 */
export function getDispersionCoefficients(
  distance: number,
  stabilityClass: StabilityClass
): { sigmaY: number; sigmaZ: number } {
  // Pasquill-Gifford dispersion parameters
  // σy = a × x^b (horizontal)
  // σz = c × x^d + f (vertical)

  const params: Record<StabilityClass, { ay: number; by: number; az: number; bz: number }> = {
    'A': { ay: 0.22, by: 0.894, az: 0.20, bz: 1.000 },
    'B': { ay: 0.16, by: 0.894, az: 0.12, bz: 0.920 },
    'C': { ay: 0.11, by: 0.894, az: 0.08, bz: 0.850 },
    'D': { ay: 0.08, by: 0.894, az: 0.06, bz: 0.800 },
    'E': { ay: 0.06, by: 0.894, az: 0.03, bz: 0.730 },
    'F': { ay: 0.04, by: 0.894, az: 0.016, bz: 0.670 },
  }

  const p = params[stabilityClass]
  // Note: distance is in meters, formula uses meters directly
  // const xKm = distance / 1000 // km conversion available if needed

  const sigmaY = p.ay * Math.pow(distance, p.by)
  const sigmaZ = p.az * Math.pow(distance, p.bz)

  return { sigmaY, sigmaZ }
}

/**
 * Calculate ground-level concentration using Gaussian dispersion
 * C = (Q / (2π × u × σy × σz)) × exp(-y² / (2σy²)) × exp(-H² / (2σz²)) × 2
 * (Factor of 2 for ground reflection)
 */
export function calculateGaussianDispersion(input: GaussianDispersionInput): GaussianDispersionResult {
  const {
    emissionRate,
    effectiveHeight,
    windSpeed,
    stabilityClass,
    downwindDistance,
    crosswindDistance = 0,
    receptorHeight = 0,
  } = input

  const steps: string[] = []
  steps.push('=== Gaussian Dispersion Model ===\n')
  steps.push('Formula: C = (Q / (π × u × σy × σz)) × exp(-y²/(2σy²)) × [exp(-(z-H)²/(2σz²)) + exp(-(z+H)²/(2σz²))]\n')

  // Validation
  if (emissionRate <= 0 || windSpeed <= 0 || downwindDistance <= 0) {
    throw new Error('Emission rate, wind speed, and distance must be positive')
  }
  if (effectiveHeight < 0 || receptorHeight < 0) {
    throw new Error('Heights cannot be negative')
  }

  const stabilityInfo = STABILITY_CLASSES.find(s => s.class === stabilityClass)!

  steps.push('Given:')
  steps.push(`  Emission Rate (Q): ${emissionRate} g/s`)
  steps.push(`  Effective Height (H): ${effectiveHeight} m`)
  steps.push(`  Wind Speed (u): ${windSpeed} m/s`)
  steps.push(`  Stability Class: ${stabilityClass} (${stabilityInfo.name})`)
  steps.push(`  Downwind Distance (x): ${downwindDistance} m`)
  steps.push(`  Crosswind Distance (y): ${crosswindDistance} m`)
  steps.push(`  Receptor Height (z): ${receptorHeight} m`)
  steps.push('')

  // Get dispersion coefficients
  const { sigmaY, sigmaZ } = getDispersionCoefficients(downwindDistance, stabilityClass)

  steps.push('Step 1: Calculate Dispersion Coefficients (Pasquill-Gifford)')
  steps.push(`  σy = ${sigmaY.toFixed(2)} m (horizontal dispersion)`)
  steps.push(`  σz = ${sigmaZ.toFixed(2)} m (vertical dispersion)`)
  steps.push('')

  // Calculate concentration
  const Q = emissionRate * 1e6  // Convert g/s to µg/s
  const H = effectiveHeight
  const z = receptorHeight
  const y = crosswindDistance
  const u = windSpeed

  // Lateral dispersion term
  const lateralTerm = Math.exp(-Math.pow(y, 2) / (2 * Math.pow(sigmaY, 2)))

  // Vertical dispersion terms (with ground reflection)
  const verticalTerm1 = Math.exp(-Math.pow(z - H, 2) / (2 * Math.pow(sigmaZ, 2)))
  const verticalTerm2 = Math.exp(-Math.pow(z + H, 2) / (2 * Math.pow(sigmaZ, 2)))

  // Full Gaussian equation
  const concentration = (Q / (Math.PI * u * sigmaY * sigmaZ)) * lateralTerm * (verticalTerm1 + verticalTerm2)

  steps.push('Step 2: Apply Gaussian Formula')
  steps.push(`  Lateral term: exp(-${y}²/(2×${sigmaY.toFixed(2)}²)) = ${lateralTerm.toFixed(6)}`)
  steps.push(`  Vertical term 1: exp(-(${z}-${H})²/(2×${sigmaZ.toFixed(2)}²)) = ${verticalTerm1.toExponential(4)}`)
  steps.push(`  Vertical term 2: exp(-(${z}+${H})²/(2×${sigmaZ.toFixed(2)}²)) = ${verticalTerm2.toExponential(4)}`)
  steps.push('')
  steps.push(`  C = (${Q.toExponential(2)} / (π × ${u} × ${sigmaY.toFixed(2)} × ${sigmaZ.toFixed(2)}))`)
  steps.push(`      × ${lateralTerm.toFixed(6)} × (${verticalTerm1.toExponential(4)} + ${verticalTerm2.toExponential(4)})`)
  steps.push(`  C = ${concentration.toFixed(4)} µg/m³`)
  steps.push('')

  // Calculate maximum ground-level concentration
  // Cmax occurs at x where σz = H / √2 (for z = y = 0)
  // For most stability classes, this is approximately:
  const xMax = effectiveHeight * 10  // Rough approximation
  const { sigmaY: sigmaYMax, sigmaZ: sigmaZMax } = getDispersionCoefficients(xMax, stabilityClass)
  const Cmax = (2 * Q) / (Math.PI * Math.E * windSpeed * sigmaYMax * sigmaZMax) *
               Math.exp(-Math.pow(effectiveHeight, 2) / (2 * Math.pow(sigmaZMax, 2)))

  steps.push('Step 3: Estimate Maximum Ground-Level Concentration')
  steps.push(`  Approximate distance to Cmax: ~${xMax.toFixed(0)} m`)
  steps.push(`  Estimated Cmax: ~${Cmax.toFixed(4)} µg/m³`)

  return {
    concentration,
    sigmaY,
    sigmaZ,
    maxGroundConcentration: Cmax,
    maxDistance: xMax,
    steps,
  }
}

// ============================================
// EXAMPLES DATA
// ============================================

export const AQI_EXAMPLES = [
  { pollutant: 'pm25' as Pollutant, concentration: 12, description: 'Good air quality day' },
  { pollutant: 'pm25' as Pollutant, concentration: 55, description: 'Bangkok typical haze season' },
  { pollutant: 'pm25' as Pollutant, concentration: 150, description: 'Severe pollution event' },
  { pollutant: 'o3' as Pollutant, concentration: 0.065, description: 'Moderate ozone level' },
  { pollutant: 'co' as Pollutant, concentration: 4, description: 'Normal urban CO level' },
]

export const CONVERSION_EXAMPLES = [
  { pollutant: 'co' as Pollutant, value: 9, fromUnit: 'ppm' as const, toUnit: 'mg/m³' as const, description: 'CO ppm to mg/m³' },
  { pollutant: 'no2' as Pollutant, value: 100, fromUnit: 'ppb' as const, toUnit: 'µg/m³' as const, description: 'NO2 ppb to µg/m³' },
  { pollutant: 'so2' as Pollutant, value: 200, fromUnit: 'µg/m³' as const, toUnit: 'ppb' as const, description: 'SO2 µg/m³ to ppb' },
]

export const THAI_STANDARD_EXAMPLES = [
  { pollutant: 'pm25' as Pollutant, concentration: 25, period: '24-hour' as ThaiAveragingPeriod, description: 'Bangkok daily average' },
  { pollutant: 'pm25' as Pollutant, concentration: 50, period: '24-hour' as ThaiAveragingPeriod, description: 'Chiang Mai burning season' },
  { pollutant: 'o3' as Pollutant, concentration: 0.08, period: '1-hour' as ThaiAveragingPeriod, description: 'Summer ozone peak' },
]
