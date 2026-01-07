/**
 * VerChem - Environmental Chemistry Types
 * BOD, COD, Water Quality Parameters
 *
 * Reference: Standard Methods for the Examination of Water and Wastewater (APHA)
 * Thai Standards: Pollution Control Department (PCD)
 */

// ============================================
// EFFLUENT STANDARD TYPES
// ============================================

/**
 * Thai Industrial Effluent Types
 */
export type ThaiEffluentType = 'type_a' | 'type_b' | 'type_c'

/**
 * Effluent Standard Parameters
 */
export interface EffluentStandard {
  type: ThaiEffluentType
  name: string
  nameThai: string
  description: string
  limits: {
    bod: number       // mg/L
    cod: number       // mg/L
    ss: number        // Suspended Solids mg/L
    tds: number       // Total Dissolved Solids mg/L
    ph_min: number
    ph_max: number
    temperature: number // max discharge temp
    sulfide?: number  // mg/L
    fat_oil?: number  // mg/L
  }
}

// ============================================
// BOD CALCULATION TYPES
// ============================================

/**
 * BOD Test Input Parameters
 */
export interface BOD5Input {
  initialDO: number           // D1 - Initial dissolved oxygen (mg/L)
  finalDO: number             // D2 - Final dissolved oxygen after 5 days (mg/L)
  sampleVolume: number        // Volume of sample (mL)
  bottleVolume: number        // BOD bottle volume (mL), typically 300
  seedCorrection?: number     // Seed blank correction (mg/L)
  dilutionFactor?: number     // If using pre-calculated dilution factor
}

/**
 * BOD5 Calculation Result
 */
export interface BOD5Result {
  bod5: number                // BOD5 value (mg/L)
  dilutionFactor: number
  oxygenDepletion: number     // D1 - D2 (mg/L)
  steps: string[]
  compliance?: ComplianceResult
}

/**
 * Ultimate BOD Input
 */
export interface BODuInput {
  bod5: number                // 5-day BOD (mg/L)
  kRate: number               // First-order decay rate (/day)
  temperature?: number        // Temperature, default 20
}

/**
 * Ultimate BOD Result
 */
export interface BODuResult {
  bodu: number                // Ultimate BOD (mg/L)
  kRate: number               // k value used (/day)
  f_factor: number            // BOD5/BODu ratio
  steps: string[]
}

/**
 * BOD Time Series Data Point
 */
export interface BODDataPoint {
  day: number                 // Time (days)
  bod: number                 // BOD at that time (mg/L)
}

/**
 * K-Rate Determination Result
 */
export interface KRateResult {
  k: number                   // First-order rate constant (/day at 20)
  bodu: number                // Estimated ultimate BOD
  r2: number                  // R-squared correlation
  method: 'thomas' | 'fujimoto' | 'least_squares'
  steps: string[]
  dataFit: BODDataPoint[]     // Fitted curve points
}

// ============================================
// COD CALCULATION TYPES
// ============================================

/**
 * COD Dichromate Method Input
 */
export interface CODInput {
  fasTitrantBlank: number     // A - mL FAS for blank
  fasTitrantSample: number    // B - mL FAS for sample
  fasNormality: number        // N - Normality of FAS
  sampleVolume: number        // V - Sample volume (mL)
}

/**
 * COD Result
 */
export interface CODResult {
  cod: number                 // COD value (mg/L)
  oxygenEquivalent: number    // mg O2 consumed
  steps: string[]
  compliance?: ComplianceResult
}

// ============================================
// BOD/COD RATIO & BIODEGRADABILITY
// ============================================

/**
 * Biodegradability Classification
 */
export type BiodegradabilityClass =
  | 'easily_biodegradable'      // > 0.5
  | 'moderately_biodegradable'  // 0.3 - 0.5
  | 'difficult_to_biodegrade'   // < 0.3

/**
 * BOD/COD Ratio Result
 */
export interface BODCODRatioResult {
  ratio: number
  classification: BiodegradabilityClass
  treatmentRecommendation: string
  steps: string[]
}

// ============================================
// PROCESS CALCULATIONS
// ============================================

/**
 * BOD Loading Rate Input
 */
export interface BODLoadingInput {
  bod: number                 // BOD concentration (mg/L)
  flowRate: number            // Flow rate (m3/day)
}

/**
 * BOD Loading Result
 */
export interface BODLoadingResult {
  loading: number             // kg BOD/day
  steps: string[]
}

/**
 * Removal Efficiency Input
 */
export interface RemovalEfficiencyInput {
  influentConc: number        // Influent concentration (mg/L)
  effluentConc: number        // Effluent concentration (mg/L)
}

/**
 * Removal Efficiency Result
 */
export interface RemovalEfficiencyResult {
  efficiency: number          // Percentage (%)
  removalRate: number         // mg/L removed
  steps: string[]
}

/**
 * Temperature Correction Input
 */
export interface TemperatureCorrectionInput {
  k20: number                 // k at 20 (/day)
  targetTemperature: number   // Target temperature
  theta?: number              // Temperature coefficient (default 1.047)
}

/**
 * Temperature Correction Result
 */
export interface TemperatureCorrectionResult {
  kT: number                  // k at target temperature
  theta: number               // Temperature coefficient used
  steps: string[]
}

// ============================================
// COMPLIANCE CHECKING
// ============================================

/**
 * Compliance Check Result
 */
export interface ComplianceResult {
  isCompliant: boolean
  standard: EffluentStandard
  exceedances: {
    parameter: string
    value: number
    limit: number
    exceedancePercent: number
  }[]
  passedParameters: string[]
}

/**
 * Water Quality Sample
 */
export interface WaterQualitySample {
  bod?: number
  cod?: number
  ph?: number
  temperature?: number
  ss?: number
  tds?: number
  do?: number
  ammonia?: number
  nitrate?: number
  phosphate?: number
}

// ============================================
// CALCULATOR MODE TYPES
// ============================================

/**
 * Calculator Modes for UI
 */
export type WaterQualityMode =
  | 'bod5'                    // Calculate BOD5 from DO readings
  | 'bodu'                    // Calculate Ultimate BOD
  | 'cod'                     // Calculate COD
  | 'bod_cod_ratio'           // BOD/COD biodegradability
  | 'loading_rate'            // BOD loading rate
  | 'removal_efficiency'      // Treatment efficiency
  | 'k_rate'                  // Determine k from data
  | 'temperature_correction'  // Temperature correction
  | 'compliance_check'        // Thai standards compliance

/**
 * Mode Configuration for UI
 */
export interface WaterQualityModeConfig {
  id: WaterQualityMode
  name: string
  description: string
  icon: string
}

/**
 * All available modes
 */
export const WATER_QUALITY_MODES: WaterQualityModeConfig[] = [
  {
    id: 'bod5',
    name: 'BOD5 Calculator',
    description: 'Calculate BOD5 from dissolved oxygen readings',
    icon: '🧪',
  },
  {
    id: 'bodu',
    name: 'Ultimate BOD',
    description: 'Calculate ultimate BOD from BOD5 and k-rate',
    icon: '📈',
  },
  {
    id: 'cod',
    name: 'COD Calculator',
    description: 'Calculate COD using dichromate method',
    icon: '⚗️',
  },
  {
    id: 'bod_cod_ratio',
    name: 'BOD/COD Ratio',
    description: 'Determine biodegradability index',
    icon: '📊',
  },
  {
    id: 'loading_rate',
    name: 'BOD Loading',
    description: 'Calculate BOD loading rate (kg/day)',
    icon: '📦',
  },
  {
    id: 'removal_efficiency',
    name: 'Removal Efficiency',
    description: 'Calculate treatment removal percentage',
    icon: '✅',
  },
  {
    id: 'k_rate',
    name: 'K-Rate (Thomas)',
    description: 'Determine k from BOD time series',
    icon: '📉',
  },
  {
    id: 'temperature_correction',
    name: 'Temp Correction',
    description: 'van\'t Hoff temperature correction',
    icon: '🌡️',
  },
  {
    id: 'compliance_check',
    name: 'Thai Standards',
    description: 'Check compliance with Thai effluent standards',
    icon: '🇹🇭',
  },
]
