/**
 * VerChem - Soil Quality Calculations
 * Heavy Metals, pH, NPK, CEC, Organic Matter, Texture, Salinity
 *
 * References:
 * - Thai PCD: ประกาศกรมควบคุมมลพิษ เรื่อง เกณฑ์การปนเปื้อนในดิน (2547)
 * - USDA Soil Survey Manual
 * - FAO Guidelines for Soil Description (2006)
 */

import type {
  HeavyMetal,
  HeavyMetalInfo,
  ThaiLandUseType,
  ThaiSoilStandard,
  SoilContaminationResult,
  SoilpHClass,
  SoilpHClassInfo,
  SoilpHResult,
  NutrientLevel,
  NutrientResult,
  NPKAnalysisResult,
  NutrientAnalysisInput,
  CECClass,
  CECResult,
  BaseSaturationInput,
  OrganicMatterClass,
  OrganicMatterResult,
  OrganicMatterInput,
  SoilTextureClass,
  SoilTextureResult,
  ParticleSizeInput,
  SalinityClass,
  SodicityClass,
  SalinityResult,
  SalinitySodicityInput,
} from '@/lib/types/soil-quality'

// ============================================
// HEAVY METAL DATA
// ============================================

export const HEAVY_METAL_INFO: Record<HeavyMetal, HeavyMetalInfo> = {
  pb: {
    id: 'pb',
    name: 'Lead',
    nameThai: 'ตะกั่ว',
    symbol: 'Pb',
    atomicNumber: 82,
    commonSources: ['Old paint', 'Batteries', 'Mining', 'Industrial waste'],
    healthEffects: 'Neurotoxic, affects brain development, kidney damage',
    plantEffects: 'Stunted growth, chlorosis, reduced root development',
  },
  cd: {
    id: 'cd',
    name: 'Cadmium',
    nameThai: 'แคดเมียม',
    symbol: 'Cd',
    atomicNumber: 48,
    commonSources: ['Fertilizers', 'Batteries', 'Plating', 'Mining'],
    healthEffects: 'Kidney damage, bone disease, carcinogenic',
    plantEffects: 'Chlorosis, wilting, reduced seed germination',
  },
  cr: {
    id: 'cr',
    name: 'Chromium',
    nameThai: 'โครเมียม',
    symbol: 'Cr',
    atomicNumber: 24,
    commonSources: ['Leather tanning', 'Electroplating', 'Steel production'],
    healthEffects: 'Cr(VI) is carcinogenic, respiratory issues, skin ulcers',
    plantEffects: 'Leaf browning, reduced photosynthesis',
  },
  as: {
    id: 'as',
    name: 'Arsenic',
    nameThai: 'สารหนู',
    symbol: 'As',
    atomicNumber: 33,
    commonSources: ['Pesticides', 'Mining', 'Wood preservatives'],
    healthEffects: 'Carcinogenic, skin lesions, cardiovascular effects',
    plantEffects: 'Wilting, reduced growth, leaf necrosis',
  },
  hg: {
    id: 'hg',
    name: 'Mercury',
    nameThai: 'ปรอท',
    symbol: 'Hg',
    atomicNumber: 80,
    commonSources: ['Gold mining', 'Coal combustion', 'Chlor-alkali plants'],
    healthEffects: 'Neurotoxic, kidney damage, developmental effects',
    plantEffects: 'Inhibits photosynthesis, seed germination issues',
  },
  zn: {
    id: 'zn',
    name: 'Zinc',
    nameThai: 'สังกะสี',
    symbol: 'Zn',
    atomicNumber: 30,
    commonSources: ['Galvanizing', 'Mining', 'Fertilizers', 'Sludge'],
    healthEffects: 'GI distress at high levels, copper deficiency',
    plantEffects: 'Chlorosis, stunted growth (at excess levels)',
  },
  cu: {
    id: 'cu',
    name: 'Copper',
    nameThai: 'ทองแดง',
    symbol: 'Cu',
    atomicNumber: 29,
    commonSources: ['Mining', 'Fungicides', 'Industrial waste', 'Sludge'],
    healthEffects: 'Liver damage at high levels, GI issues',
    plantEffects: 'Root damage, chlorosis, reduced growth',
  },
  ni: {
    id: 'ni',
    name: 'Nickel',
    nameThai: 'นิกเกิล',
    symbol: 'Ni',
    atomicNumber: 28,
    commonSources: ['Stainless steel', 'Batteries', 'Electroplating'],
    healthEffects: 'Skin sensitization, respiratory issues, carcinogenic',
    plantEffects: 'Chlorosis, necrosis, reduced root growth',
  },
  mn: {
    id: 'mn',
    name: 'Manganese',
    nameThai: 'แมงกานีส',
    symbol: 'Mn',
    atomicNumber: 25,
    commonSources: ['Mining', 'Steel production', 'Fertilizers'],
    healthEffects: 'Neurological effects at high exposure',
    plantEffects: 'Toxicity in acidic soils, brown spotting',
  },
  co: {
    id: 'co',
    name: 'Cobalt',
    nameThai: 'โคบอลต์',
    symbol: 'Co',
    atomicNumber: 27,
    commonSources: ['Mining', 'Batteries', 'Pigments'],
    healthEffects: 'Cardiomyopathy, thyroid effects at high levels',
    plantEffects: 'Chlorosis, reduced growth at excess levels',
  },
}

// ============================================
// THAI SOIL STANDARDS (ประกาศกรมควบคุมมลพิษ พ.ศ. 2547)
// ============================================

export const THAI_SOIL_STANDARDS: ThaiSoilStandard[] = [
  { metal: 'pb', residential: 400, industrial: 750, agricultural: 400, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'cd', residential: 37, industrial: 100, agricultural: 37, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'cr', residential: 300, industrial: 800, agricultural: 300, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'as', residential: 3.9, industrial: 27, agricultural: 3.9, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'hg', residential: 23, industrial: 100, agricultural: 23, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'zn', residential: 890, industrial: 3500, agricultural: 890, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'cu', residential: 150, industrial: 600, agricultural: 150, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'ni', residential: 140, industrial: 1600, agricultural: 140, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'mn', residential: 1800, industrial: 5000, agricultural: 1800, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
  { metal: 'co', residential: 20, industrial: 70, agricultural: 20, reference: 'ประกาศกรมควบคุมมลพิษ พ.ศ. 2547', year: 2004 },
]

// ============================================
// SOIL pH CLASSIFICATION
// ============================================

export const SOIL_PH_CLASSES: SoilpHClassInfo[] = [
  {
    class: 'ultra_acidic',
    name: 'Ultra Acidic',
    range: { min: 0, max: 3.5 },
    nutrientAvailability: 'Severe Al/Mn toxicity, most nutrients unavailable',
    suitableCrops: ['None - requires major remediation'],
    amendments: ['Heavy liming required', 'Add organic matter'],
  },
  {
    class: 'extremely_acidic',
    name: 'Extremely Acidic',
    range: { min: 3.5, max: 4.4 },
    nutrientAvailability: 'Al/Mn toxicity, P/Ca/Mg deficiency',
    suitableCrops: ['Blueberry', 'Cranberry'],
    amendments: ['Agricultural lime 4-6 tons/ha'],
  },
  {
    class: 'very_strongly_acidic',
    name: 'Very Strongly Acidic',
    range: { min: 4.5, max: 5.0 },
    nutrientAvailability: 'Low P, Ca, Mg availability; Al toxicity possible',
    suitableCrops: ['Potato', 'Blueberry', 'Azalea'],
    amendments: ['Agricultural lime 2-4 tons/ha'],
  },
  {
    class: 'strongly_acidic',
    name: 'Strongly Acidic',
    range: { min: 5.1, max: 5.5 },
    nutrientAvailability: 'Reduced P, Ca, Mg; good for acid-loving plants',
    suitableCrops: ['Tea', 'Rice', 'Pineapple', 'Sweet potato'],
    amendments: ['Agricultural lime 1-2 tons/ha'],
  },
  {
    class: 'moderately_acidic',
    name: 'Moderately Acidic',
    range: { min: 5.6, max: 6.0 },
    nutrientAvailability: 'Good nutrient availability, slight P limitation',
    suitableCrops: ['Most vegetables', 'Maize', 'Soybean', 'Cotton'],
    amendments: ['Light liming 0.5-1 ton/ha if needed'],
  },
  {
    class: 'slightly_acidic',
    name: 'Slightly Acidic',
    range: { min: 6.1, max: 6.5 },
    nutrientAvailability: 'Optimal for most nutrients',
    suitableCrops: ['Most crops', 'Vegetables', 'Fruits', 'Grains'],
    amendments: ['Usually not needed'],
  },
  {
    class: 'neutral',
    name: 'Neutral',
    range: { min: 6.6, max: 7.3 },
    nutrientAvailability: 'Excellent nutrient availability',
    suitableCrops: ['All crops', 'Most vegetables', 'Legumes'],
    amendments: ['Not needed'],
  },
  {
    class: 'slightly_alkaline',
    name: 'Slightly Alkaline',
    range: { min: 7.4, max: 7.8 },
    nutrientAvailability: 'Good, but Fe/Mn/Zn may be limited',
    suitableCrops: ['Asparagus', 'Beets', 'Cabbage', 'Cauliflower'],
    amendments: ['Sulfur if Fe deficiency observed'],
  },
  {
    class: 'moderately_alkaline',
    name: 'Moderately Alkaline',
    range: { min: 7.9, max: 8.4 },
    nutrientAvailability: 'Fe, Mn, Zn, Cu deficiency common',
    suitableCrops: ['Date palm', 'Olive', 'Some brassicas'],
    amendments: ['Elemental sulfur 200-500 kg/ha', 'Iron chelates'],
  },
  {
    class: 'strongly_alkaline',
    name: 'Strongly Alkaline',
    range: { min: 8.5, max: 9.0 },
    nutrientAvailability: 'Severe micronutrient deficiency, possible Na problems',
    suitableCrops: ['Very limited', 'Salt-tolerant species'],
    amendments: ['Gypsum + sulfur', 'Acidifying fertilizers'],
  },
  {
    class: 'very_strongly_alkaline',
    name: 'Very Strongly Alkaline',
    range: { min: 9.0, max: 14 },
    nutrientAvailability: 'Severely limited, sodic conditions likely',
    suitableCrops: ['None without major remediation'],
    amendments: ['Gypsum + sulfur + organic matter', 'Drainage improvement'],
  },
]

// ============================================
// NUTRIENT LEVEL THRESHOLDS
// ============================================

export const NITROGEN_THRESHOLDS = {
  very_low: 0.05,
  low: 0.10,
  medium: 0.20,
  high: 0.30,
}

export const PHOSPHORUS_THRESHOLDS = {
  very_low: 5,
  low: 10,
  medium: 20,
  high: 40,
}

export const POTASSIUM_THRESHOLDS = {
  very_low: 40,
  low: 80,
  medium: 150,
  high: 250,
}

// ============================================
// CEC CLASSIFICATION
// ============================================

export const CEC_THRESHOLDS = {
  very_low: 5,
  low: 10,
  medium: 20,
  high: 30,
}

// ============================================
// ORGANIC MATTER CLASSIFICATION
// ============================================

export const OM_THRESHOLDS = {
  very_low: 1.0,
  low: 2.0,
  medium: 4.0,
  high: 6.0,
}

// ============================================
// CONTAMINATION CHECK
// ============================================

/**
 * Check soil contamination against Thai PCD standards
 */
export function checkSoilContamination(
  metal: HeavyMetal,
  concentration: number,
  landUseType: ThaiLandUseType
): SoilContaminationResult {
  const steps: string[] = []
  steps.push('=== Soil Contamination Assessment ===\n')
  steps.push('Reference: ประกาศกรมควบคุมมลพิษ พ.ศ. 2547\n')

  const metalInfo = HEAVY_METAL_INFO[metal]
  const standard = THAI_SOIL_STANDARDS.find(s => s.metal === metal)

  if (!standard) {
    throw new Error(`No Thai standard found for ${metal}`)
  }

  // Get limit based on land use
  let limit: number
  switch (landUseType) {
    case 'residential':
      limit = standard.residential
      break
    case 'industrial':
      limit = standard.industrial
      break
    case 'agricultural':
      limit = standard.agricultural ?? standard.residential
      break
  }

  steps.push('Given:')
  steps.push(`  Heavy Metal: ${metalInfo.name} (${metalInfo.symbol})`)
  steps.push(`  Concentration: ${concentration} mg/kg`)
  steps.push(`  Land Use Type: ${landUseType}`)
  steps.push('')

  steps.push('Thai Standard:')
  steps.push(`  Limit: ${limit} mg/kg`)
  steps.push(`  Reference: ${standard.reference}`)
  steps.push('')

  const isCompliant = concentration <= limit
  const exceedancePercent = isCompliant ? undefined : ((concentration - limit) / limit) * 100

  steps.push('Compliance Check:')
  steps.push(`  ${concentration} ${isCompliant ? '≤' : '>'} ${limit} mg/kg`)

  if (isCompliant) {
    steps.push(`  Result: ✅ COMPLIANT (ผ่านมาตรฐาน)`)
  } else {
    steps.push(`  Result: ❌ EXCEEDS STANDARD (เกินมาตรฐาน)`)
    steps.push(`  Exceedance: ${exceedancePercent?.toFixed(1)}% above limit`)
  }

  // Determine risk level
  let riskLevel: 'safe' | 'caution' | 'hazardous' | 'critical'
  const ratio = concentration / limit

  if (ratio <= 0.5) {
    riskLevel = 'safe'
  } else if (ratio <= 1.0) {
    riskLevel = 'caution'
  } else if (ratio <= 2.0) {
    riskLevel = 'hazardous'
  } else {
    riskLevel = 'critical'
  }

  steps.push(`\nRisk Level: ${riskLevel.toUpperCase()}`)

  // Generate recommendations
  const recommendations: string[] = []
  if (riskLevel === 'safe') {
    recommendations.push('Soil is safe for intended use')
    recommendations.push('Continue regular monitoring')
  } else if (riskLevel === 'caution') {
    recommendations.push('Monitor soil regularly')
    recommendations.push('Identify and control pollution sources')
    recommendations.push('Consider phytoremediation for gradual cleanup')
  } else if (riskLevel === 'hazardous') {
    recommendations.push('Restrict access and activities')
    recommendations.push('Implement remediation measures')
    recommendations.push('Consider soil washing or stabilization')
    if (landUseType === 'agricultural') {
      recommendations.push('Do not grow food crops')
    }
  } else {
    recommendations.push('Immediate action required')
    recommendations.push('Restrict all access')
    recommendations.push('Professional remediation needed')
    recommendations.push('Consider soil excavation and disposal')
  }

  return {
    metal: metalInfo,
    concentration,
    unit: 'mg/kg',
    landUseType,
    standard,
    isCompliant,
    exceedancePercent,
    riskLevel,
    recommendations,
    steps,
  }
}

// ============================================
// SOIL pH CALCULATION
// ============================================

/**
 * Classify soil pH and provide recommendations
 */
export function classifySoilpH(ph: number): SoilpHResult {
  const steps: string[] = []
  steps.push('=== Soil pH Classification ===\n')

  if (ph < 0 || ph > 14) {
    throw new Error('pH must be between 0 and 14')
  }

  steps.push('Given:')
  steps.push(`  pH = ${ph.toFixed(2)}`)
  steps.push('')

  // Calculate hydrogen ion concentration
  const hydrogenConcentration = Math.pow(10, -ph)

  steps.push('Step 1: Calculate [H⁺] concentration')
  steps.push(`  [H⁺] = 10^(-pH) = 10^(-${ph.toFixed(2)})`)
  steps.push(`  [H⁺] = ${hydrogenConcentration.toExponential(2)} mol/L`)
  steps.push('')

  // Find classification
  let classification: SoilpHClassInfo | undefined

  for (const cls of SOIL_PH_CLASSES) {
    if (ph >= cls.range.min && ph < cls.range.max) {
      classification = cls
      break
    }
  }

  if (!classification) {
    classification = ph >= 9.0 ? SOIL_PH_CLASSES[SOIL_PH_CLASSES.length - 1] : SOIL_PH_CLASSES[0]
  }

  steps.push('Step 2: Classify pH')
  steps.push(`  Range: ${classification.range.min} - ${classification.range.max}`)
  steps.push(`  Classification: ${classification.name}`)
  steps.push('')

  steps.push('Step 3: Nutrient Availability')
  steps.push(`  ${classification.nutrientAvailability}`)
  steps.push('')

  steps.push('Step 4: Suitable Crops')
  classification.suitableCrops.forEach(crop => {
    steps.push(`  • ${crop}`)
  })
  steps.push('')

  // Calculate lime/sulfur requirement (simplified)
  let limeRequirement: number | undefined
  let sulfurRequirement: number | undefined

  if (ph < 6.0) {
    // Rough estimate: 1 ton lime per 0.5 pH unit increase (varies by soil type)
    const targetpH = 6.5
    limeRequirement = Math.max(0, (targetpH - ph) * 2)
    steps.push('Step 5: Lime Requirement (to reach pH 6.5)')
    steps.push(`  Estimated: ${limeRequirement.toFixed(1)} tons/ha agricultural lime`)
    steps.push('  Note: Actual rate depends on soil buffer capacity')
  } else if (ph > 7.5) {
    // Rough estimate: 100 kg sulfur per 0.3 pH unit decrease
    const targetpH = 7.0
    sulfurRequirement = Math.max(0, (ph - targetpH) * 333)
    steps.push('Step 5: Sulfur Requirement (to reach pH 7.0)')
    steps.push(`  Estimated: ${sulfurRequirement.toFixed(0)} kg/ha elemental sulfur`)
    steps.push('  Note: Actual rate depends on soil type')
  }

  return {
    ph,
    classification,
    hydrogenConcentration,
    limeRequirement,
    sulfurRequirement,
    steps,
  }
}

// ============================================
// NPK ANALYSIS
// ============================================

function classifyNutrientLevel(value: number, thresholds: Record<string, number>): NutrientLevel {
  if (value < thresholds.very_low) return 'very_low'
  if (value < thresholds.low) return 'low'
  if (value < thresholds.medium) return 'medium'
  if (value < thresholds.high) return 'high'
  return 'very_high'
}

/**
 * Analyze NPK nutrient levels
 */
export function analyzeNPK(input: NutrientAnalysisInput): NPKAnalysisResult {
  const steps: string[] = []
  steps.push('=== NPK Nutrient Analysis ===\n')

  const { nitrogen = 0, phosphorus = 0, potassium = 0 } = input

  steps.push('Given:')
  steps.push(`  Total Nitrogen (N): ${nitrogen}%`)
  steps.push(`  Available Phosphorus (P): ${phosphorus} mg/kg`)
  steps.push(`  Exchangeable Potassium (K): ${potassium} mg/kg`)
  steps.push('')

  // Analyze Nitrogen
  const nLevel = classifyNutrientLevel(nitrogen, NITROGEN_THRESHOLDS)
  const nResult: NutrientResult = {
    nutrient: 'nitrogen',
    value: nitrogen,
    unit: '%',
    level: nLevel,
    interpretation: getNitrogenInterpretation(nLevel),
    recommendation: getNitrogenRecommendation(nLevel),
  }

  steps.push('Step 1: Nitrogen Analysis')
  steps.push(`  Level: ${nLevel.replace('_', ' ').toUpperCase()}`)
  steps.push(`  ${nResult.interpretation}`)
  steps.push('')

  // Analyze Phosphorus
  const pLevel = classifyNutrientLevel(phosphorus, PHOSPHORUS_THRESHOLDS)
  const pResult: NutrientResult = {
    nutrient: 'phosphorus',
    value: phosphorus,
    unit: 'mg/kg',
    level: pLevel,
    interpretation: getPhosphorusInterpretation(pLevel),
    recommendation: getPhosphorusRecommendation(pLevel),
  }

  steps.push('Step 2: Phosphorus Analysis')
  steps.push(`  Level: ${pLevel.replace('_', ' ').toUpperCase()}`)
  steps.push(`  ${pResult.interpretation}`)
  steps.push('')

  // Analyze Potassium
  const kLevel = classifyNutrientLevel(potassium, POTASSIUM_THRESHOLDS)
  const kResult: NutrientResult = {
    nutrient: 'potassium',
    value: potassium,
    unit: 'mg/kg',
    level: kLevel,
    interpretation: getPotassiumInterpretation(kLevel),
    recommendation: getPotassiumRecommendation(kLevel),
  }

  steps.push('Step 3: Potassium Analysis')
  steps.push(`  Level: ${kLevel.replace('_', ' ').toUpperCase()}`)
  steps.push(`  ${kResult.interpretation}`)
  steps.push('')

  // Calculate NPK ratio
  const nRatio = nitrogen > 0 ? Math.round(nitrogen / Math.min(nitrogen, phosphorus / 100, potassium / 100)) : 0
  const pRatio = phosphorus > 0 ? Math.round((phosphorus / 100) / Math.min(nitrogen || 0.001, phosphorus / 100, potassium / 100)) : 0
  const kRatio = potassium > 0 ? Math.round((potassium / 100) / Math.min(nitrogen || 0.001, phosphorus / 100, potassium / 100)) : 0
  const npkRatio = `${nRatio || 1}:${pRatio || 1}:${kRatio || 1}`

  steps.push('Step 4: NPK Ratio')
  steps.push(`  Approximate ratio: ${npkRatio}`)
  steps.push('')

  // Overall fertility
  const levels = [nLevel, pLevel, kLevel]
  const levelScores = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 }
  const avgScore = levels.reduce((sum, l) => sum + levelScores[l], 0) / 3
  let overallFertility: NutrientLevel

  if (avgScore < 1.5) overallFertility = 'very_low'
  else if (avgScore < 2.5) overallFertility = 'low'
  else if (avgScore < 3.5) overallFertility = 'medium'
  else if (avgScore < 4.5) overallFertility = 'high'
  else overallFertility = 'very_high'

  steps.push('Step 5: Overall Fertility')
  steps.push(`  ${overallFertility.replace('_', ' ').toUpperCase()}`)

  // Fertilizer recommendations
  const fertilizerRecommendation = getFertilizerRecommendation(nLevel, pLevel, kLevel)

  return {
    nitrogen: nResult,
    phosphorus: pResult,
    potassium: kResult,
    npkRatio,
    overallFertility,
    fertilizerRecommendation,
    steps,
  }
}

function getNitrogenInterpretation(level: NutrientLevel): string {
  const interpretations: Record<NutrientLevel, string> = {
    very_low: 'Severe N deficiency expected. Plants will show yellowing (chlorosis) of older leaves.',
    low: 'N deficiency likely. Reduced growth and pale green color expected.',
    medium: 'Adequate N for most crops. May need supplementation for heavy feeders.',
    high: 'Good N availability. May reduce fertilizer application.',
    very_high: 'Excess N. Risk of leaching and environmental pollution.',
  }
  return interpretations[level]
}

function getNitrogenRecommendation(level: NutrientLevel): string {
  const recommendations: Record<NutrientLevel, string> = {
    very_low: 'Apply 150-200 kg N/ha. Consider split applications.',
    low: 'Apply 100-150 kg N/ha based on crop requirements.',
    medium: 'Apply 50-100 kg N/ha for high-demand crops.',
    high: 'Reduce N application to 25-50 kg/ha.',
    very_high: 'No N fertilizer needed. Monitor for leaching.',
  }
  return recommendations[level]
}

function getPhosphorusInterpretation(level: NutrientLevel): string {
  const interpretations: Record<NutrientLevel, string> = {
    very_low: 'Severe P deficiency. Purple discoloration and stunted growth expected.',
    low: 'P deficiency likely. Poor root development and delayed maturity.',
    medium: 'Adequate P for most crops.',
    high: 'Good P availability. Minimal supplementation needed.',
    very_high: 'Excess P. Risk of runoff and eutrophication.',
  }
  return interpretations[level]
}

function getPhosphorusRecommendation(level: NutrientLevel): string {
  const recommendations: Record<NutrientLevel, string> = {
    very_low: 'Apply 80-120 kg P₂O₅/ha. Consider rock phosphate for long-term.',
    low: 'Apply 50-80 kg P₂O₅/ha.',
    medium: 'Apply 30-50 kg P₂O₅/ha for maintenance.',
    high: 'Reduce P application to 20-30 kg P₂O₅/ha.',
    very_high: 'No P fertilizer needed. Avoid further P accumulation.',
  }
  return recommendations[level]
}

function getPotassiumInterpretation(level: NutrientLevel): string {
  const interpretations: Record<NutrientLevel, string> = {
    very_low: 'Severe K deficiency. Marginal leaf scorch and weak stalks.',
    low: 'K deficiency likely. Reduced disease resistance.',
    medium: 'Adequate K for most crops.',
    high: 'Good K availability.',
    very_high: 'Excess K. May interfere with Ca and Mg uptake.',
  }
  return interpretations[level]
}

function getPotassiumRecommendation(level: NutrientLevel): string {
  const recommendations: Record<NutrientLevel, string> = {
    very_low: 'Apply 150-200 kg K₂O/ha.',
    low: 'Apply 100-150 kg K₂O/ha.',
    medium: 'Apply 50-100 kg K₂O/ha for maintenance.',
    high: 'Reduce K application to 30-50 kg K₂O/ha.',
    very_high: 'No K fertilizer needed.',
  }
  return recommendations[level]
}

function getFertilizerRecommendation(n: NutrientLevel, p: NutrientLevel, k: NutrientLevel): string[] {
  const recommendations: string[] = []

  if (n === 'very_low' || n === 'low') {
    recommendations.push('Apply nitrogen-rich fertilizer (urea, ammonium sulfate)')
  }
  if (p === 'very_low' || p === 'low') {
    recommendations.push('Apply phosphate fertilizer (TSP, DAP, rock phosphate)')
  }
  if (k === 'very_low' || k === 'low') {
    recommendations.push('Apply potash fertilizer (muriate of potash, sulfate of potash)')
  }

  if (recommendations.length === 0) {
    recommendations.push('Soil fertility is adequate. Apply maintenance fertilizer as needed.')
  }

  recommendations.push('Consider soil pH adjustment if necessary')
  recommendations.push('Add organic matter to improve nutrient retention')

  return recommendations
}

// ============================================
// CEC CALCULATION
// ============================================

/**
 * Calculate CEC and base saturation
 */
export function calculateCEC(input: BaseSaturationInput): CECResult {
  const { calcium, magnesium, potassium, sodium, cec } = input

  const steps: string[] = []
  steps.push('=== Cation Exchange Capacity (CEC) Analysis ===\n')

  if (cec <= 0) {
    throw new Error('CEC must be positive')
  }

  steps.push('Given:')
  steps.push(`  CEC: ${cec} cmol(+)/kg`)
  steps.push(`  Ca²⁺: ${calcium} cmol(+)/kg`)
  steps.push(`  Mg²⁺: ${magnesium} cmol(+)/kg`)
  steps.push(`  K⁺: ${potassium} cmol(+)/kg`)
  steps.push(`  Na⁺: ${sodium} cmol(+)/kg`)
  steps.push('')

  // Calculate base saturation
  const totalBases = calcium + magnesium + potassium + sodium
  const baseSaturation = (totalBases / cec) * 100

  steps.push('Step 1: Calculate Base Saturation')
  steps.push(`  Total Bases = ${calcium} + ${magnesium} + ${potassium} + ${sodium}`)
  steps.push(`  Total Bases = ${totalBases.toFixed(2)} cmol(+)/kg`)
  steps.push(`  Base Saturation = (${totalBases.toFixed(2)} / ${cec}) × 100`)
  steps.push(`  Base Saturation = ${baseSaturation.toFixed(1)}%`)
  steps.push('')

  // Individual saturations
  const calciumSaturation = (calcium / cec) * 100
  const magnesiumSaturation = (magnesium / cec) * 100
  const potassiumSaturation = (potassium / cec) * 100
  const sodiumSaturation = (sodium / cec) * 100

  steps.push('Step 2: Individual Base Saturations')
  steps.push(`  Ca Saturation: ${calciumSaturation.toFixed(1)}% (ideal: 65-80%)`)
  steps.push(`  Mg Saturation: ${magnesiumSaturation.toFixed(1)}% (ideal: 10-15%)`)
  steps.push(`  K Saturation: ${potassiumSaturation.toFixed(1)}% (ideal: 3-5%)`)
  steps.push(`  Na Saturation: ${sodiumSaturation.toFixed(1)}% (should be <5%)`)
  steps.push('')

  // Classify CEC
  let classification: CECClass
  if (cec < CEC_THRESHOLDS.very_low) {
    classification = 'very_low'
  } else if (cec < CEC_THRESHOLDS.low) {
    classification = 'low'
  } else if (cec < CEC_THRESHOLDS.medium) {
    classification = 'medium'
  } else if (cec < CEC_THRESHOLDS.high) {
    classification = 'high'
  } else {
    classification = 'very_high'
  }

  steps.push('Step 3: CEC Classification')
  steps.push(`  ${cec} cmol(+)/kg → ${classification.replace('_', ' ').toUpperCase()}`)
  steps.push('')

  // Interpret results
  let interpretation: string
  let soilType: string

  if (cec < 10) {
    interpretation = 'Low nutrient holding capacity. Requires frequent, light fertilization.'
    soilType = 'Sandy soil or highly weathered soil'
  } else if (cec < 20) {
    interpretation = 'Moderate nutrient holding capacity. Standard fertilization practices.'
    soilType = 'Loamy soil'
  } else if (cec < 30) {
    interpretation = 'Good nutrient holding capacity. Efficient fertilizer use.'
    soilType = 'Clay loam or organic-rich soil'
  } else {
    interpretation = 'High nutrient holding capacity. May retain excess nutrients.'
    soilType = 'Clay soil or high organic matter soil'
  }

  steps.push('Step 4: Interpretation')
  steps.push(`  Likely Soil Type: ${soilType}`)
  steps.push(`  ${interpretation}`)

  return {
    cec,
    unit: 'cmol(+)/kg',
    classification,
    baseSaturation,
    calciumSaturation,
    magnesiumSaturation,
    potassiumSaturation,
    sodiumSaturation,
    interpretation,
    soilType,
    steps,
  }
}

// ============================================
// ORGANIC MATTER
// ============================================

/**
 * Calculate organic matter content
 */
export function calculateOrganicMatter(input: OrganicMatterInput): OrganicMatterResult {
  const steps: string[] = []
  steps.push('=== Organic Matter Analysis ===\n')

  let organicMatter: number
  let organicCarbon: number

  // Van Bemmelen factor: OM = OC × 1.724 (traditionally)
  // Modern factor: OM = OC × 2.0 (for many soils)
  const conversionFactor = 1.724

  if (input.organicMatter !== undefined) {
    organicMatter = input.organicMatter
    organicCarbon = organicMatter / conversionFactor
    steps.push('Given: Organic Matter (direct measurement)')
    steps.push(`  OM = ${organicMatter}%`)
    steps.push(`  OC = OM / ${conversionFactor} = ${organicCarbon.toFixed(2)}%`)
  } else if (input.organicCarbon !== undefined) {
    organicCarbon = input.organicCarbon
    organicMatter = organicCarbon * conversionFactor
    steps.push('Given: Organic Carbon')
    steps.push(`  OC = ${organicCarbon}%`)
    steps.push(`  OM = OC × ${conversionFactor} = ${organicMatter.toFixed(2)}%`)
  } else if (input.lossOnIgnition !== undefined) {
    // LOI overestimates OM; use correction factor
    const loi = input.lossOnIgnition
    organicMatter = loi * 0.7  // Approximate correction
    organicCarbon = organicMatter / conversionFactor
    steps.push('Given: Loss on Ignition')
    steps.push(`  LOI = ${loi}%`)
    steps.push(`  OM ≈ LOI × 0.7 = ${organicMatter.toFixed(2)}% (corrected)`)
    steps.push(`  OC = ${organicCarbon.toFixed(2)}%`)
  } else {
    throw new Error('Please provide organic matter, organic carbon, or loss on ignition')
  }
  steps.push('')

  // Classify
  let classification: OrganicMatterClass
  if (organicMatter < OM_THRESHOLDS.very_low) {
    classification = 'very_low'
  } else if (organicMatter < OM_THRESHOLDS.low) {
    classification = 'low'
  } else if (organicMatter < OM_THRESHOLDS.medium) {
    classification = 'medium'
  } else if (organicMatter < OM_THRESHOLDS.high) {
    classification = 'high'
  } else {
    classification = 'very_high'
  }

  steps.push('Step 1: Classification')
  steps.push(`  ${organicMatter.toFixed(2)}% → ${classification.replace('_', ' ').toUpperCase()}`)
  steps.push('')

  // Benefits based on level
  const benefits: string[] = []
  const recommendations: string[] = []

  if (organicMatter >= 2) {
    benefits.push('Improved soil structure')
    benefits.push('Better water holding capacity')
  }
  if (organicMatter >= 3) {
    benefits.push('Good nutrient cycling')
    benefits.push('Enhanced microbial activity')
  }
  if (organicMatter >= 4) {
    benefits.push('Excellent soil fertility')
    benefits.push('Reduced erosion risk')
  }
  if (organicMatter < 2) {
    benefits.push('Limited water retention')
    benefits.push('Poor soil structure')
  }

  if (classification === 'very_low' || classification === 'low') {
    recommendations.push('Add compost or manure (5-10 tons/ha/year)')
    recommendations.push('Practice cover cropping')
    recommendations.push('Reduce tillage')
    recommendations.push('Retain crop residues')
  } else if (classification === 'medium') {
    recommendations.push('Maintain current practices')
    recommendations.push('Add organic amendments annually')
    recommendations.push('Consider green manures')
  } else {
    recommendations.push('Current levels are excellent')
    recommendations.push('Maintain organic inputs')
  }

  steps.push('Step 2: Benefits')
  benefits.forEach(b => steps.push(`  • ${b}`))
  steps.push('')

  steps.push('Step 3: Recommendations')
  recommendations.forEach(r => steps.push(`  • ${r}`))

  return {
    organicMatter,
    organicCarbon,
    classification,
    benefits,
    recommendations,
    steps,
  }
}

// ============================================
// SOIL TEXTURE
// ============================================

/**
 * Classify soil texture using USDA texture triangle
 */
export function classifySoilTexture(input: ParticleSizeInput): SoilTextureResult {
  const { sand, silt, clay } = input

  const steps: string[] = []
  steps.push('=== Soil Texture Classification (USDA) ===\n')

  // Validate
  const total = sand + silt + clay
  if (Math.abs(total - 100) > 1) {
    throw new Error(`Sand + Silt + Clay must equal 100%. Got ${total.toFixed(1)}%`)
  }

  if (sand < 0 || silt < 0 || clay < 0) {
    throw new Error('Particle percentages cannot be negative')
  }

  steps.push('Given:')
  steps.push(`  Sand (2.0 - 0.05 mm): ${sand}%`)
  steps.push(`  Silt (0.05 - 0.002 mm): ${silt}%`)
  steps.push(`  Clay (< 0.002 mm): ${clay}%`)
  steps.push(`  Total: ${total.toFixed(1)}%`)
  steps.push('')

  // Determine texture class using USDA texture triangle logic
  let textureClass: SoilTextureClass

  if (clay >= 40 && silt < 40 && sand <= 45) {
    textureClass = 'clay'
  } else if (clay >= 40 && silt >= 40) {
    textureClass = 'silty_clay'
  } else if (clay >= 35 && sand > 45) {
    textureClass = 'sandy_clay'
  } else if (clay >= 27 && clay < 40 && sand > 20 && sand <= 45) {
    textureClass = 'clay_loam'
  } else if (clay >= 27 && clay < 40 && sand <= 20) {
    textureClass = 'silty_clay_loam'
  } else if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) {
    textureClass = 'sandy_clay_loam'
  } else if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) {
    textureClass = 'loam'
  } else if (silt >= 50 && clay >= 12 && clay < 27) {
    textureClass = 'silt_loam'
  } else if (silt >= 80 && clay < 12) {
    textureClass = 'silt'
  } else if (sand >= 43 && sand < 85 && silt < 50 && clay < 20) {
    textureClass = 'sandy_loam'
  } else if (sand >= 70 && sand < 90 && clay < 15) {
    textureClass = 'loamy_sand'
  } else if (sand >= 85) {
    textureClass = 'sand'
  } else if (clay < 7 && silt < 50 && sand >= 43) {
    textureClass = 'sandy_loam'
  } else if (silt >= 50 && silt < 80 && clay < 12) {
    textureClass = 'silt_loam'
  } else {
    textureClass = 'loam'  // Default fallback
  }

  steps.push('Step 1: Texture Classification')
  steps.push(`  Class: ${textureClass.replace(/_/g, ' ').toUpperCase()}`)
  steps.push('')

  // Determine properties
  let waterHoldingCapacity: string
  let drainage: string
  let workability: string

  if (textureClass.includes('sand')) {
    waterHoldingCapacity = 'Low'
    drainage = 'Rapid (excessive)'
    workability = 'Easy to work'
  } else if (textureClass.includes('clay')) {
    waterHoldingCapacity = 'High'
    drainage = 'Slow (may waterlog)'
    workability = 'Difficult when wet'
  } else if (textureClass.includes('silt')) {
    waterHoldingCapacity = 'Medium-High'
    drainage = 'Moderate'
    workability = 'Moderate'
  } else {
    waterHoldingCapacity = 'Medium'
    drainage = 'Good'
    workability = 'Good'
  }

  steps.push('Step 2: Soil Properties')
  steps.push(`  Water Holding: ${waterHoldingCapacity}`)
  steps.push(`  Drainage: ${drainage}`)
  steps.push(`  Workability: ${workability}`)

  const textureTriangle = 'USDA Soil Texture Triangle'

  return {
    sand,
    silt,
    clay,
    textureClass,
    textureTriangle,
    waterHoldingCapacity,
    drainage,
    workability,
    steps,
  }
}

// ============================================
// SALINITY / SODICITY
// ============================================

/**
 * Assess soil salinity and sodicity
 */
export function assessSalinity(input: SalinitySodicityInput): SalinityResult {
  const { ec, sar, esp } = input

  const steps: string[] = []
  steps.push('=== Salinity and Sodicity Assessment ===\n')

  if (ec < 0) {
    throw new Error('EC cannot be negative')
  }

  steps.push('Given:')
  steps.push(`  EC: ${ec} dS/m`)
  if (sar !== undefined) steps.push(`  SAR: ${sar}`)
  if (esp !== undefined) steps.push(`  ESP: ${esp}%`)
  steps.push('')

  // Classify salinity
  let salinityClass: SalinityClass
  if (ec < 2) {
    salinityClass = 'non_saline'
  } else if (ec < 4) {
    salinityClass = 'slightly_saline'
  } else if (ec < 8) {
    salinityClass = 'moderately_saline'
  } else if (ec < 16) {
    salinityClass = 'strongly_saline'
  } else {
    salinityClass = 'very_strongly_saline'
  }

  steps.push('Step 1: Salinity Classification')
  steps.push(`  EC ${ec} dS/m → ${salinityClass.replace(/_/g, ' ').toUpperCase()}`)
  steps.push('')

  // Classify sodicity
  let sodicityClass: SodicityClass | undefined
  const effectiveESP = esp ?? (sar !== undefined ? (100 * (-0.0126 + 0.01475 * sar)) / (1 + (-0.0126 + 0.01475 * sar)) : undefined)

  if (effectiveESP !== undefined) {
    if (effectiveESP < 6) {
      sodicityClass = 'non_sodic'
    } else if (effectiveESP < 10) {
      sodicityClass = 'slightly_sodic'
    } else if (effectiveESP < 15) {
      sodicityClass = 'moderately_sodic'
    } else {
      sodicityClass = 'strongly_sodic'
    }

    steps.push('Step 2: Sodicity Classification')
    steps.push(`  ESP ${effectiveESP.toFixed(1)}% → ${sodicityClass.replace(/_/g, ' ').toUpperCase()}`)
    steps.push('')
  }

  // Overall classification
  let soilClassification: 'normal' | 'saline' | 'sodic' | 'saline_sodic'
  const isSaline = ec >= 4
  const isSodic = effectiveESP !== undefined && effectiveESP >= 15

  if (!isSaline && !isSodic) {
    soilClassification = 'normal'
  } else if (isSaline && !isSodic) {
    soilClassification = 'saline'
  } else if (!isSaline && isSodic) {
    soilClassification = 'sodic'
  } else {
    soilClassification = 'saline_sodic'
  }

  steps.push('Step 3: Overall Classification')
  steps.push(`  ${soilClassification.replace(/_/g, '-').toUpperCase()} SOIL`)
  steps.push('')

  // Crop tolerance
  const cropTolerance: string[] = []
  if (ec < 2) {
    cropTolerance.push('All crops suitable')
  } else if (ec < 4) {
    cropTolerance.push('Most crops tolerate')
    cropTolerance.push('Sensitive crops may be affected')
  } else if (ec < 8) {
    cropTolerance.push('Moderately tolerant crops: wheat, sorghum, cotton')
    cropTolerance.push('Avoid sensitive crops')
  } else if (ec < 16) {
    cropTolerance.push('Only tolerant crops: barley, date palm')
    cropTolerance.push('Severe yield reduction expected')
  } else {
    cropTolerance.push('Only highly tolerant species survive')
    cropTolerance.push('Halophytes recommended')
  }

  // Remediation
  const remediation: string[] = []
  if (isSaline) {
    remediation.push('Improve drainage')
    remediation.push('Leach salts with good quality water')
    remediation.push('Use salt-tolerant varieties')
  }
  if (isSodic) {
    remediation.push('Apply gypsum (2-10 tons/ha)')
    remediation.push('Improve drainage')
    remediation.push('Add organic matter')
  }
  if (!isSaline && !isSodic) {
    remediation.push('No remediation needed')
  }

  steps.push('Step 4: Crop Tolerance')
  cropTolerance.forEach(c => steps.push(`  • ${c}`))
  steps.push('')

  steps.push('Step 5: Remediation')
  remediation.forEach(r => steps.push(`  • ${r}`))

  return {
    ec,
    salinityClass,
    sar,
    esp: effectiveESP,
    sodicityClass,
    soilClassification,
    cropTolerance,
    remediation,
    steps,
  }
}

// ============================================
// EXAMPLE DATA
// ============================================

export const CONTAMINATION_EXAMPLES = [
  { metal: 'pb' as HeavyMetal, concentration: 150, landUse: 'residential' as ThaiLandUseType, description: 'Urban garden soil' },
  { metal: 'cd' as HeavyMetal, concentration: 50, landUse: 'agricultural' as ThaiLandUseType, description: 'Rice paddy (Mae Sot)' },
  { metal: 'as' as HeavyMetal, concentration: 10, landUse: 'residential' as ThaiLandUseType, description: 'Near old mining site' },
]

export const NPK_EXAMPLES = [
  { nitrogen: 0.08, phosphorus: 15, potassium: 100, description: 'Typical upland soil' },
  { nitrogen: 0.25, phosphorus: 40, potassium: 200, description: 'Fertile garden soil' },
  { nitrogen: 0.03, phosphorus: 5, potassium: 40, description: 'Depleted sandy soil' },
]
