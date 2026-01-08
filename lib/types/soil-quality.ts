/**
 * VerChem - Soil Quality Types
 * Heavy Metals, Nutrients, pH, CEC, Organic Matter
 *
 * References:
 * - Thai PCD: ประกาศกรมควบคุมมลพิษ เรื่อง เกณฑ์การปนเปื้อนในดิน
 * - USDA Soil Taxonomy
 * - FAO Guidelines for Soil Description
 */

// ============================================
// HEAVY METAL TYPES
// ============================================

/**
 * Common heavy metals in soil contamination
 */
export type HeavyMetal =
  | 'pb'   // Lead
  | 'cd'   // Cadmium
  | 'cr'   // Chromium
  | 'as'   // Arsenic
  | 'hg'   // Mercury
  | 'zn'   // Zinc
  | 'cu'   // Copper
  | 'ni'   // Nickel
  | 'mn'   // Manganese
  | 'co'   // Cobalt

/**
 * Heavy metal information
 */
export interface HeavyMetalInfo {
  id: HeavyMetal
  name: string
  nameThai: string
  symbol: string
  atomicNumber: number
  commonSources: string[]
  healthEffects: string
  plantEffects: string
}

// ============================================
// THAI SOIL STANDARDS
// ============================================

/**
 * Land use types for Thai standards
 */
export type ThaiLandUseType = 'residential' | 'industrial' | 'agricultural'

/**
 * Thai soil contamination standard
 */
export interface ThaiSoilStandard {
  metal: HeavyMetal
  residential: number    // mg/kg for residential
  industrial: number     // mg/kg for industrial
  agricultural?: number  // mg/kg for agricultural (if different)
  reference: string
  year: number
}

/**
 * Soil contamination result
 */
export interface SoilContaminationResult {
  metal: HeavyMetalInfo
  concentration: number
  unit: string
  landUseType: ThaiLandUseType
  standard: ThaiSoilStandard
  isCompliant: boolean
  exceedancePercent?: number
  riskLevel: 'safe' | 'caution' | 'hazardous' | 'critical'
  recommendations: string[]
  steps: string[]
}

/**
 * Multiple metal assessment
 */
export interface MultiMetalAssessmentResult {
  overallCompliant: boolean
  overallRisk: 'safe' | 'caution' | 'hazardous' | 'critical'
  results: SoilContaminationResult[]
  criticalMetals: HeavyMetal[]
  recommendations: string[]
}

// ============================================
// SOIL pH TYPES
// ============================================

/**
 * Soil pH classification
 */
export type SoilpHClass =
  | 'ultra_acidic'      // < 3.5
  | 'extremely_acidic'  // 3.5 - 4.4
  | 'very_strongly_acidic'  // 4.5 - 5.0
  | 'strongly_acidic'   // 5.1 - 5.5
  | 'moderately_acidic' // 5.6 - 6.0
  | 'slightly_acidic'   // 6.1 - 6.5
  | 'neutral'           // 6.6 - 7.3
  | 'slightly_alkaline' // 7.4 - 7.8
  | 'moderately_alkaline' // 7.9 - 8.4
  | 'strongly_alkaline' // 8.5 - 9.0
  | 'very_strongly_alkaline' // > 9.0

/**
 * pH classification info
 */
export interface SoilpHClassInfo {
  class: SoilpHClass
  name: string
  range: { min: number; max: number }
  nutrientAvailability: string
  suitableCrops: string[]
  amendments: string[]
}

/**
 * Soil pH result
 */
export interface SoilpHResult {
  ph: number
  classification: SoilpHClassInfo
  hydrogenConcentration: number  // mol/L
  bufferCapacity?: string
  limeRequirement?: number  // tons/hectare (if acidic)
  sulfurRequirement?: number  // kg/hectare (if alkaline)
  steps: string[]
}

// ============================================
// NUTRIENT ANALYSIS (N-P-K)
// ============================================

/**
 * Macronutrient types
 */
export type Macronutrient = 'nitrogen' | 'phosphorus' | 'potassium'

/**
 * Nutrient level classification
 */
export type NutrientLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

/**
 * Nutrient analysis input
 */
export interface NutrientAnalysisInput {
  nitrogen?: number      // Total N (%)
  phosphorus?: number    // Available P (mg/kg or ppm)
  potassium?: number     // Exchangeable K (mg/kg or ppm)
  organicMatter?: number // Organic matter (%)
}

/**
 * Individual nutrient result
 */
export interface NutrientResult {
  nutrient: Macronutrient
  value: number
  unit: string
  level: NutrientLevel
  interpretation: string
  recommendation: string
}

/**
 * Complete NPK analysis result
 */
export interface NPKAnalysisResult {
  nitrogen: NutrientResult
  phosphorus: NutrientResult
  potassium: NutrientResult
  npkRatio: string
  overallFertility: NutrientLevel
  fertilizerRecommendation: string[]
  steps: string[]
}

// ============================================
// CATION EXCHANGE CAPACITY (CEC)
// ============================================

/**
 * CEC classification
 */
export type CECClass = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

/**
 * Base saturation input
 */
export interface BaseSaturationInput {
  calcium: number     // Ca²⁺ (cmol/kg)
  magnesium: number   // Mg²⁺ (cmol/kg)
  potassium: number   // K⁺ (cmol/kg)
  sodium: number      // Na⁺ (cmol/kg)
  cec: number         // Total CEC (cmol/kg)
}

/**
 * CEC result
 */
export interface CECResult {
  cec: number
  unit: string
  classification: CECClass
  baseSaturation?: number  // %
  calciumSaturation?: number
  magnesiumSaturation?: number
  potassiumSaturation?: number
  sodiumSaturation?: number
  interpretation: string
  soilType: string
  steps: string[]
}

// ============================================
// ORGANIC MATTER
// ============================================

/**
 * Organic matter classification
 */
export type OrganicMatterClass = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'

/**
 * Organic matter input
 */
export interface OrganicMatterInput {
  organicMatter?: number       // % (if measured directly)
  organicCarbon?: number       // % (if measured as carbon)
  lossOnIgnition?: number      // % (if measured by LOI)
}

/**
 * Organic matter result
 */
export interface OrganicMatterResult {
  organicMatter: number        // %
  organicCarbon: number        // %
  classification: OrganicMatterClass
  carbonNitrogenRatio?: number
  benefits: string[]
  recommendations: string[]
  steps: string[]
}

// ============================================
// SOIL TEXTURE
// ============================================

/**
 * Soil texture class (USDA)
 */
export type SoilTextureClass =
  | 'sand'
  | 'loamy_sand'
  | 'sandy_loam'
  | 'loam'
  | 'silt_loam'
  | 'silt'
  | 'sandy_clay_loam'
  | 'clay_loam'
  | 'silty_clay_loam'
  | 'sandy_clay'
  | 'silty_clay'
  | 'clay'

/**
 * Particle size input
 */
export interface ParticleSizeInput {
  sand: number     // % (2.0 - 0.05 mm)
  silt: number     // % (0.05 - 0.002 mm)
  clay: number     // % (< 0.002 mm)
}

/**
 * Soil texture result
 */
export interface SoilTextureResult {
  sand: number
  silt: number
  clay: number
  textureClass: SoilTextureClass
  textureTriangle: string
  waterHoldingCapacity: string
  drainage: string
  workability: string
  steps: string[]
}

// ============================================
// SALINITY / SODICITY
// ============================================

/**
 * Soil salinity class
 */
export type SalinityClass = 'non_saline' | 'slightly_saline' | 'moderately_saline' | 'strongly_saline' | 'very_strongly_saline'

/**
 * Sodicity class
 */
export type SodicityClass = 'non_sodic' | 'slightly_sodic' | 'moderately_sodic' | 'strongly_sodic'

/**
 * Salinity/Sodicity input
 */
export interface SalinitySodicityInput {
  ec: number        // Electrical Conductivity (dS/m)
  sar?: number      // Sodium Adsorption Ratio
  esp?: number      // Exchangeable Sodium Percentage (%)
}

/**
 * Salinity result
 */
export interface SalinityResult {
  ec: number
  salinityClass: SalinityClass
  sar?: number
  esp?: number
  sodicityClass?: SodicityClass
  soilClassification: 'normal' | 'saline' | 'sodic' | 'saline_sodic'
  cropTolerance: string[]
  remediation: string[]
  steps: string[]
}

// ============================================
// CALCULATOR MODE TYPES
// ============================================

/**
 * Soil Quality Calculator Modes
 */
export type SoilQualityMode =
  | 'contamination'      // Heavy metal contamination check
  | 'ph_classification'  // Soil pH classification
  | 'npk_analysis'       // Nutrient analysis (N-P-K)
  | 'cec'                // Cation Exchange Capacity
  | 'organic_matter'     // Organic matter content
  | 'texture'            // Soil texture classification
  | 'salinity'           // Salinity and sodicity

/**
 * Mode configuration for UI
 */
export interface SoilQualityModeConfig {
  id: SoilQualityMode
  name: string
  description: string
  icon: string
}

/**
 * All available soil quality modes
 */
export const SOIL_QUALITY_MODES: SoilQualityModeConfig[] = [
  {
    id: 'contamination',
    name: 'Heavy Metal Check',
    description: 'Check soil contamination against Thai PCD standards',
    icon: '☢️',
  },
  {
    id: 'ph_classification',
    name: 'Soil pH',
    description: 'Classify soil pH and get amendment recommendations',
    icon: '🧪',
  },
  {
    id: 'npk_analysis',
    name: 'NPK Analysis',
    description: 'Analyze nitrogen, phosphorus, and potassium levels',
    icon: '🌱',
  },
  {
    id: 'cec',
    name: 'CEC Calculator',
    description: 'Calculate Cation Exchange Capacity and base saturation',
    icon: '⚡',
  },
  {
    id: 'organic_matter',
    name: 'Organic Matter',
    description: 'Determine organic matter content and soil health',
    icon: '🍂',
  },
  {
    id: 'texture',
    name: 'Soil Texture',
    description: 'Classify soil texture using USDA texture triangle',
    icon: '🔺',
  },
  {
    id: 'salinity',
    name: 'Salinity/Sodicity',
    description: 'Assess soil salinity and sodicity status',
    icon: '🧂',
  },
]
