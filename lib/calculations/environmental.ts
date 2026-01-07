/**
 * VerChem - Environmental Chemistry Calculations
 * BOD, COD, Water Quality Parameters
 *
 * Reference: Standard Methods for the Examination of Water and Wastewater (APHA)
 * Thai Standards: Pollution Control Department (PCD)
 */

import type {
  BOD5Input,
  BOD5Result,
  BODuInput,
  BODuResult,
  BODDataPoint,
  KRateResult,
  CODInput,
  CODResult,
  BODCODRatioResult,
  BiodegradabilityClass,
  BODLoadingInput,
  BODLoadingResult,
  RemovalEfficiencyInput,
  RemovalEfficiencyResult,
  TemperatureCorrectionInput,
  TemperatureCorrectionResult,
  WaterQualitySample,
  ComplianceResult,
  EffluentStandard,
  ThaiEffluentType,
} from '@/lib/types/environmental'

// ============================================
// CONSTANTS
// ============================================

/** Standard BOD bottle volume (mL) */
export const STANDARD_BOD_BOTTLE_VOLUME = 300

/** Default k rate at 20C (/day) for domestic wastewater */
export const DEFAULT_K_RATE = 0.23

/** Temperature coefficient (theta) for van't Hoff equation */
export const DEFAULT_THETA = 1.047

/** Standard temperature for BOD test (C) */
export const STANDARD_BOD_TEMPERATURE = 20

/** Equivalent weight of oxygen for COD calculation */
export const OXYGEN_EQUIVALENT = 8000

// ============================================
// THAI EFFLUENT STANDARDS DATA
// ============================================

export const THAI_EFFLUENT_STANDARDS: Record<ThaiEffluentType, EffluentStandard> = {
  type_a: {
    type: 'type_a',
    name: 'Industrial Effluent Type A',
    nameThai: 'ประเภท ก (โรงงานอุตสาหกรรม)',
    description: 'Strictest standards for industrial facilities',
    limits: {
      bod: 20,
      cod: 120,
      ss: 50,
      tds: 3000,
      ph_min: 5.5,
      ph_max: 9.0,
      temperature: 40,
      sulfide: 1.0,
      fat_oil: 5.0,
    },
  },
  type_b: {
    type: 'type_b',
    name: 'Industrial Effluent Type B',
    nameThai: 'ประเภท ข (น้ำทิ้งทั่วไป)',
    description: 'General industrial effluent standards (relaxed)',
    limits: {
      bod: 60,
      cod: 400,
      ss: 150,
      tds: 5000,
      ph_min: 5.5,
      ph_max: 9.0,
      temperature: 40,
    },
  },
  type_c: {
    type: 'type_c',
    name: 'Community Wastewater',
    nameThai: 'ประเภท ค (น้ำทิ้งชุมชน)',
    description: 'Municipal/community wastewater treatment',
    limits: {
      bod: 40,
      cod: 200,
      ss: 70,
      tds: 3000,
      ph_min: 5.5,
      ph_max: 9.0,
      temperature: 40,
    },
  },
}

// ============================================
// BOD CALCULATIONS
// ============================================

/**
 * Calculate BOD5 from dissolved oxygen readings
 * Formula: BOD = (D1 - D2 - seed correction) x Dilution Factor
 */
export function calculateBOD5(input: BOD5Input): BOD5Result {
  const {
    initialDO,
    finalDO,
    sampleVolume,
    bottleVolume = STANDARD_BOD_BOTTLE_VOLUME,
    seedCorrection = 0,
    dilutionFactor,
  } = input

  const steps: string[] = []
  steps.push('=== BOD5 Calculation ===\n')
  steps.push('Formula: BOD5 = (D1 - D2 - seed correction) x Dilution Factor\n')

  // Validation
  if (initialDO < 0 || finalDO < 0) {
    throw new Error('Dissolved oxygen values cannot be negative')
  }
  if (finalDO > initialDO) {
    throw new Error('Final DO cannot be greater than initial DO')
  }
  if (sampleVolume <= 0 || bottleVolume <= 0) {
    throw new Error('Volumes must be positive')
  }

  // Calculate dilution factor
  const calcDilutionFactor = dilutionFactor ?? (bottleVolume / sampleVolume)

  steps.push('Given:')
  steps.push(`  D1 (Initial DO) = ${initialDO.toFixed(2)} mg/L`)
  steps.push(`  D2 (Final DO) = ${finalDO.toFixed(2)} mg/L`)
  steps.push(`  Sample Volume = ${sampleVolume} mL`)
  steps.push(`  Bottle Volume = ${bottleVolume} mL`)
  if (seedCorrection > 0) {
    steps.push(`  Seed Correction = ${seedCorrection.toFixed(2)} mg/L`)
  }
  steps.push('')

  // Calculate oxygen depletion
  const oxygenDepletion = initialDO - finalDO - seedCorrection

  steps.push('Step 1: Calculate Dilution Factor')
  steps.push(`  DF = Bottle Volume / Sample Volume`)
  steps.push(`  DF = ${bottleVolume} / ${sampleVolume}`)
  steps.push(`  DF = ${calcDilutionFactor.toFixed(2)}\n`)

  steps.push('Step 2: Calculate Oxygen Depletion')
  steps.push(`  Delta DO = D1 - D2 - seed correction`)
  steps.push(`  Delta DO = ${initialDO.toFixed(2)} - ${finalDO.toFixed(2)} - ${seedCorrection.toFixed(2)}`)
  steps.push(`  Delta DO = ${oxygenDepletion.toFixed(2)} mg/L\n`)

  // Calculate BOD5
  const bod5 = oxygenDepletion * calcDilutionFactor

  steps.push('Step 3: Calculate BOD5')
  steps.push(`  BOD5 = Delta DO x DF`)
  steps.push(`  BOD5 = ${oxygenDepletion.toFixed(2)} x ${calcDilutionFactor.toFixed(2)}`)
  steps.push(`  BOD5 = ${bod5.toFixed(2)} mg/L`)

  // Quality check
  if (oxygenDepletion < 2) {
    steps.push('\nWarning: Oxygen depletion < 2 mg/L. Consider using less dilution.')
  }
  if (finalDO < 1) {
    steps.push('\nWarning: Final DO < 1 mg/L. Consider using more dilution.')
  }

  return {
    bod5,
    dilutionFactor: calcDilutionFactor,
    oxygenDepletion,
    steps,
  }
}

/**
 * Calculate Ultimate BOD from BOD5
 * Formula: BODu = BOD5 / (1 - e^(-k x t))
 */
export function calculateBODu(input: BODuInput): BODuResult {
  const {
    bod5,
    kRate,
    temperature = STANDARD_BOD_TEMPERATURE,
  } = input

  const steps: string[] = []
  steps.push('=== Ultimate BOD (BODu) Calculation ===\n')
  steps.push('Formula: BODu = BOD5 / (1 - e^(-k x 5))\n')

  if (bod5 < 0) {
    throw new Error('BOD5 cannot be negative')
  }
  if (kRate <= 0) {
    throw new Error('k rate must be positive')
  }

  steps.push('Given:')
  steps.push(`  BOD5 = ${bod5.toFixed(2)} mg/L`)
  steps.push(`  k = ${kRate.toFixed(4)} /day`)
  steps.push(`  Temperature = ${temperature}C\n`)

  // Calculate f factor (BOD5/BODu ratio)
  const f_factor = 1 - Math.exp(-kRate * 5)

  steps.push('Step 1: Calculate f factor (BOD5/BODu ratio)')
  steps.push(`  f = 1 - e^(-k x 5)`)
  steps.push(`  f = 1 - e^(-${kRate.toFixed(4)} x 5)`)
  steps.push(`  f = 1 - e^(${(-kRate * 5).toFixed(4)})`)
  steps.push(`  f = 1 - ${Math.exp(-kRate * 5).toFixed(4)}`)
  steps.push(`  f = ${f_factor.toFixed(4)}\n`)

  // Calculate BODu
  const bodu = bod5 / f_factor

  steps.push('Step 2: Calculate Ultimate BOD')
  steps.push(`  BODu = BOD5 / f`)
  steps.push(`  BODu = ${bod5.toFixed(2)} / ${f_factor.toFixed(4)}`)
  steps.push(`  BODu = ${bodu.toFixed(2)} mg/L`)

  // Typical range check
  if (f_factor < 0.5 || f_factor > 0.9) {
    steps.push(`\nNote: Typical f factor is 0.68-0.70 for k=0.23/day`)
  }

  return {
    bodu,
    kRate,
    f_factor,
    steps,
  }
}

/**
 * Calculate COD using dichromate method
 * Formula: COD = (A - B) x N x 8000 / V
 */
export function calculateCOD(input: CODInput): CODResult {
  const {
    fasTitrantBlank,
    fasTitrantSample,
    fasNormality,
    sampleVolume,
  } = input

  const steps: string[] = []
  steps.push('=== COD Calculation (Dichromate Method) ===\n')
  steps.push('Formula: COD = (A - B) x N x 8000 / V\n')

  // Validation
  if (fasTitrantBlank < 0 || fasTitrantSample < 0) {
    throw new Error('Titrant volumes cannot be negative')
  }
  if (fasTitrantSample > fasTitrantBlank) {
    throw new Error('Sample titrant cannot exceed blank titrant')
  }
  if (fasNormality <= 0) {
    throw new Error('FAS normality must be positive')
  }
  if (sampleVolume <= 0) {
    throw new Error('Sample volume must be positive')
  }

  steps.push('Given:')
  steps.push(`  A (FAS for blank) = ${fasTitrantBlank.toFixed(2)} mL`)
  steps.push(`  B (FAS for sample) = ${fasTitrantSample.toFixed(2)} mL`)
  steps.push(`  N (FAS normality) = ${fasNormality.toFixed(4)} N`)
  steps.push(`  V (Sample volume) = ${sampleVolume.toFixed(1)} mL\n`)

  // Calculate titrant difference
  const titrantDiff = fasTitrantBlank - fasTitrantSample

  steps.push('Step 1: Calculate Titrant Difference')
  steps.push(`  A - B = ${fasTitrantBlank.toFixed(2)} - ${fasTitrantSample.toFixed(2)}`)
  steps.push(`  A - B = ${titrantDiff.toFixed(2)} mL\n`)

  // Calculate oxygen equivalent
  const oxygenEquivalent = titrantDiff * fasNormality * 8

  steps.push('Step 2: Calculate Oxygen Equivalent')
  steps.push(`  O2 = (A - B) x N x 8`)
  steps.push(`  O2 = ${titrantDiff.toFixed(2)} x ${fasNormality.toFixed(4)} x 8`)
  steps.push(`  O2 = ${oxygenEquivalent.toFixed(4)} mg\n`)

  // Calculate COD
  const cod = (titrantDiff * fasNormality * OXYGEN_EQUIVALENT) / sampleVolume

  steps.push('Step 3: Calculate COD')
  steps.push(`  COD = (A - B) x N x 8000 / V`)
  steps.push(`  COD = ${titrantDiff.toFixed(2)} x ${fasNormality.toFixed(4)} x 8000 / ${sampleVolume.toFixed(1)}`)
  steps.push(`  COD = ${cod.toFixed(2)} mg/L`)

  return {
    cod,
    oxygenEquivalent,
    steps,
  }
}

/**
 * Calculate BOD/COD ratio and determine biodegradability
 */
export function calculateBODCODRatio(bod: number, cod: number): BODCODRatioResult {
  const steps: string[] = []
  steps.push('=== BOD/COD Ratio (Biodegradability Index) ===\n')

  if (bod < 0 || cod < 0) {
    throw new Error('BOD and COD values cannot be negative')
  }
  if (cod === 0) {
    throw new Error('COD cannot be zero')
  }
  if (bod > cod) {
    throw new Error('BOD cannot exceed COD (theoretical maximum)')
  }

  steps.push('Given:')
  steps.push(`  BOD = ${bod.toFixed(2)} mg/L`)
  steps.push(`  COD = ${cod.toFixed(2)} mg/L\n`)

  const ratio = bod / cod

  steps.push('Step 1: Calculate BOD/COD Ratio')
  steps.push(`  Ratio = BOD / COD`)
  steps.push(`  Ratio = ${bod.toFixed(2)} / ${cod.toFixed(2)}`)
  steps.push(`  Ratio = ${ratio.toFixed(3)}\n`)

  // Determine biodegradability classification
  let classification: BiodegradabilityClass
  let treatmentRecommendation: string

  steps.push('Step 2: Classify Biodegradability')

  if (ratio > 0.5) {
    classification = 'easily_biodegradable'
    treatmentRecommendation = 'Biological treatment (activated sludge, trickling filter) is highly effective'
    steps.push(`  Ratio > 0.5: Easily Biodegradable`)
    steps.push(`  Biological treatment is recommended`)
  } else if (ratio >= 0.3) {
    classification = 'moderately_biodegradable'
    treatmentRecommendation = 'Biological treatment is effective with proper acclimation. Consider pre-treatment for refractory compounds.'
    steps.push(`  0.3 <= Ratio <= 0.5: Moderately Biodegradable`)
    steps.push(`  Biological treatment possible with acclimation`)
  } else {
    classification = 'difficult_to_biodegrade'
    treatmentRecommendation = 'Chemical/physical treatment (oxidation, adsorption) required before biological treatment.'
    steps.push(`  Ratio < 0.3: Difficult to Biodegrade`)
    steps.push(`  Chemical/physical pre-treatment required`)
  }

  steps.push(`\nRecommendation: ${treatmentRecommendation}`)

  return {
    ratio,
    classification,
    treatmentRecommendation,
    steps,
  }
}

/**
 * Calculate BOD loading rate
 * Formula: Loading = BOD x Flow Rate / 1000
 */
export function calculateBODLoadingRate(input: BODLoadingInput): BODLoadingResult {
  const { bod, flowRate } = input

  const steps: string[] = []
  steps.push('=== BOD Loading Rate ===\n')
  steps.push('Formula: Loading (kg/day) = BOD (mg/L) x Flow (m3/day) / 1000\n')

  if (bod < 0 || flowRate < 0) {
    throw new Error('Values cannot be negative')
  }

  steps.push('Given:')
  steps.push(`  BOD = ${bod.toFixed(2)} mg/L`)
  steps.push(`  Flow Rate = ${flowRate.toFixed(2)} m3/day\n`)

  const loading = (bod * flowRate) / 1000

  steps.push('Calculation:')
  steps.push(`  Loading = ${bod.toFixed(2)} x ${flowRate.toFixed(2)} / 1000`)
  steps.push(`  Loading = ${loading.toFixed(2)} kg BOD/day`)

  return {
    loading,
    steps,
  }
}

/**
 * Calculate treatment removal efficiency
 * Formula: Efficiency = (Influent - Effluent) / Influent x 100
 */
export function calculateRemovalEfficiency(input: RemovalEfficiencyInput): RemovalEfficiencyResult {
  const { influentConc, effluentConc } = input

  const steps: string[] = []
  steps.push('=== Removal Efficiency ===\n')
  steps.push('Formula: Efficiency (%) = (Influent - Effluent) / Influent x 100\n')

  if (influentConc < 0 || effluentConc < 0) {
    throw new Error('Concentrations cannot be negative')
  }
  if (effluentConc > influentConc) {
    throw new Error('Effluent concentration cannot exceed influent')
  }
  if (influentConc === 0) {
    throw new Error('Influent concentration cannot be zero')
  }

  steps.push('Given:')
  steps.push(`  Influent = ${influentConc.toFixed(2)} mg/L`)
  steps.push(`  Effluent = ${effluentConc.toFixed(2)} mg/L\n`)

  const removalRate = influentConc - effluentConc
  const efficiency = (removalRate / influentConc) * 100

  steps.push('Calculation:')
  steps.push(`  Removal = ${influentConc.toFixed(2)} - ${effluentConc.toFixed(2)} = ${removalRate.toFixed(2)} mg/L`)
  steps.push(`  Efficiency = ${removalRate.toFixed(2)} / ${influentConc.toFixed(2)} x 100`)
  steps.push(`  Efficiency = ${efficiency.toFixed(1)}%`)

  // Performance classification
  if (efficiency >= 90) {
    steps.push('\nExcellent treatment performance')
  } else if (efficiency >= 80) {
    steps.push('\nGood treatment performance')
  } else if (efficiency >= 70) {
    steps.push('\nModerate treatment performance')
  } else {
    steps.push('\nPoor treatment performance - review process')
  }

  return {
    efficiency,
    removalRate,
    steps,
  }
}

/**
 * Determine k rate from multiple BOD readings using Thomas Method
 */
export function calculateKRate(data: BODDataPoint[]): KRateResult {
  const steps: string[] = []
  steps.push('=== K-Rate Determination (Thomas Method) ===\n')

  if (data.length < 3) {
    throw new Error('Need at least 3 data points to determine k rate')
  }

  // Sort data by day
  const sortedData = [...data].sort((a, b) => a.day - b.day)

  steps.push('Given BOD Data:')
  sortedData.forEach(point => {
    steps.push(`  Day ${point.day}: ${point.bod.toFixed(2)} mg/L`)
  })
  steps.push('')

  // Thomas Method: Linear regression on (t/BOD_t)^(1/3) vs t
  const transformedData: { x: number; y: number }[] = []
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

  for (const point of sortedData) {
    if (point.day === 0 || point.bod <= 0) continue

    const x = point.day
    const y = Math.pow(x / point.bod, 1 / 3)

    transformedData.push({ x, y })
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  }

  const N = transformedData.length
  if (N < 2) {
    throw new Error('Insufficient valid data points after filtering')
  }

  // Linear regression
  const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / N

  steps.push('Thomas Method Transformation:')
  steps.push('  Transform: y = (t/BOD_t)^(1/3)')
  steps.push('  Linear fit: y = a + bt')
  steps.push(`  Intercept (a) = ${intercept.toFixed(6)}`)
  steps.push(`  Slope (b) = ${slope.toFixed(6)}\n`)

  // Calculate k and BODu from regression
  // Thomas Slope Method (APHA Standard Methods):
  //   k = 6b/a
  //   BODu = 1/(k × a³ × 2.3)
  // Note: Thomas method is an approximation; results may deviate from actual
  const k = (6 * slope) / intercept
  const bodu = 1 / (k * Math.pow(intercept, 3) * 2.3)

  steps.push('Calculate k and BODu:')
  steps.push(`  k = 6b/a = 6 x ${slope.toFixed(6)} / ${intercept.toFixed(6)}`)
  steps.push(`  k = ${k.toFixed(4)} /day`)
  steps.push('')
  steps.push(`  BODu = 1/(k x a^3 x 2.3)`)
  steps.push(`  BODu = ${bodu.toFixed(2)} mg/L`)

  // Calculate R2
  const meanY = sumY / N
  let ssRes = 0, ssTot = 0

  for (const point of transformedData) {
    const predicted = intercept + slope * point.x
    ssRes += Math.pow(point.y - predicted, 2)
    ssTot += Math.pow(point.y - meanY, 2)
  }

  const r2 = 1 - (ssRes / ssTot)

  steps.push(`\nRegression Quality:`)
  steps.push(`  R2 = ${r2.toFixed(4)}`)

  if (r2 < 0.95) {
    steps.push('  Note: R2 < 0.95 indicates data may not follow first-order kinetics')
  } else {
    steps.push('  Good fit to first-order model')
  }

  // Generate fitted curve
  const maxDay = Math.max(...sortedData.map(d => d.day))
  const dataFit: BODDataPoint[] = []

  for (let t = 0; t <= maxDay; t += 0.5) {
    const bodT = bodu * (1 - Math.exp(-k * t))
    dataFit.push({ day: t, bod: bodT })
  }

  return {
    k,
    bodu,
    r2,
    method: 'thomas',
    steps,
    dataFit,
  }
}

/**
 * Temperature correction using van't Hoff equation
 * Formula: k_T = k_20 x theta^(T-20)
 */
export function temperatureCorrection(input: TemperatureCorrectionInput): TemperatureCorrectionResult {
  const {
    k20,
    targetTemperature,
    theta = DEFAULT_THETA,
  } = input

  const steps: string[] = []
  steps.push('=== Temperature Correction (van\'t Hoff) ===\n')
  steps.push('Formula: k_T = k_20 x theta^(T-20)\n')

  if (k20 <= 0) {
    throw new Error('k at 20C must be positive')
  }
  if (targetTemperature < 0 || targetTemperature > 45) {
    throw new Error('Temperature must be between 0 and 45C')
  }

  steps.push('Given:')
  steps.push(`  k_20 = ${k20.toFixed(4)} /day`)
  steps.push(`  Target Temperature = ${targetTemperature}C`)
  steps.push(`  theta = ${theta.toFixed(3)}\n`)

  const tempDiff = targetTemperature - 20
  const kT = k20 * Math.pow(theta, tempDiff)

  steps.push('Calculation:')
  steps.push(`  T - 20 = ${targetTemperature} - 20 = ${tempDiff}C`)
  steps.push(`  theta^(T-20) = ${theta.toFixed(3)}^(${tempDiff}) = ${Math.pow(theta, tempDiff).toFixed(4)}`)
  steps.push(`  k_T = ${k20.toFixed(4)} x ${Math.pow(theta, tempDiff).toFixed(4)}`)
  steps.push(`  k_T = ${kT.toFixed(4)} /day`)

  // Interpret result
  if (tempDiff > 0) {
    steps.push(`\nHigher temperature: faster reaction rate`)
  } else if (tempDiff < 0) {
    steps.push(`\nLower temperature: slower reaction rate`)
  }

  return {
    kT,
    theta,
    steps,
  }
}

/**
 * Check compliance against Thai effluent standards
 */
export function checkThaiStandards(
  sample: WaterQualitySample,
  standardType: ThaiEffluentType
): ComplianceResult {
  const standard = THAI_EFFLUENT_STANDARDS[standardType]
  const exceedances: ComplianceResult['exceedances'] = []
  const passedParameters: string[] = []

  // Check BOD
  if (sample.bod !== undefined) {
    if (sample.bod > standard.limits.bod) {
      exceedances.push({
        parameter: 'BOD',
        value: sample.bod,
        limit: standard.limits.bod,
        exceedancePercent: ((sample.bod - standard.limits.bod) / standard.limits.bod) * 100,
      })
    } else {
      passedParameters.push('BOD')
    }
  }

  // Check COD
  if (sample.cod !== undefined) {
    if (sample.cod > standard.limits.cod) {
      exceedances.push({
        parameter: 'COD',
        value: sample.cod,
        limit: standard.limits.cod,
        exceedancePercent: ((sample.cod - standard.limits.cod) / standard.limits.cod) * 100,
      })
    } else {
      passedParameters.push('COD')
    }
  }

  // Check SS
  if (sample.ss !== undefined) {
    if (sample.ss > standard.limits.ss) {
      exceedances.push({
        parameter: 'SS',
        value: sample.ss,
        limit: standard.limits.ss,
        exceedancePercent: ((sample.ss - standard.limits.ss) / standard.limits.ss) * 100,
      })
    } else {
      passedParameters.push('SS')
    }
  }

  // Check TDS
  if (sample.tds !== undefined) {
    if (sample.tds > standard.limits.tds) {
      exceedances.push({
        parameter: 'TDS',
        value: sample.tds,
        limit: standard.limits.tds,
        exceedancePercent: ((sample.tds - standard.limits.tds) / standard.limits.tds) * 100,
      })
    } else {
      passedParameters.push('TDS')
    }
  }

  // Check pH
  if (sample.ph !== undefined) {
    if (sample.ph < standard.limits.ph_min || sample.ph > standard.limits.ph_max) {
      exceedances.push({
        parameter: 'pH',
        value: sample.ph,
        limit: sample.ph < standard.limits.ph_min ? standard.limits.ph_min : standard.limits.ph_max,
        exceedancePercent: 0,
      })
    } else {
      passedParameters.push('pH')
    }
  }

  // Check Temperature
  if (sample.temperature !== undefined) {
    if (sample.temperature > standard.limits.temperature) {
      exceedances.push({
        parameter: 'Temperature',
        value: sample.temperature,
        limit: standard.limits.temperature,
        exceedancePercent: ((sample.temperature - standard.limits.temperature) / standard.limits.temperature) * 100,
      })
    } else {
      passedParameters.push('Temperature')
    }
  }

  return {
    isCompliant: exceedances.length === 0,
    standard,
    exceedances,
    passedParameters,
  }
}

// ============================================
// EXAMPLES DATA
// ============================================

export const BOD_COD_EXAMPLES = [
  {
    name: 'Domestic Wastewater',
    bod: 200,
    cod: 400,
    description: 'Typical municipal sewage',
  },
  {
    name: 'Food Processing',
    bod: 500,
    cod: 800,
    description: 'High organic load from food industry',
  },
  {
    name: 'Paper Mill',
    bod: 150,
    cod: 600,
    description: 'Contains refractory organics',
  },
  {
    name: 'Textile Industry',
    bod: 100,
    cod: 1000,
    description: 'Dyes and chemicals present',
  },
  {
    name: 'Treated Effluent',
    bod: 15,
    cod: 80,
    description: 'After secondary treatment',
  },
]

export const TYPICAL_K_VALUES = [
  { source: 'Raw domestic wastewater', k: 0.15, range: '0.12-0.23' },
  { source: 'Treated domestic wastewater', k: 0.10, range: '0.06-0.15' },
  { source: 'Polluted river water', k: 0.12, range: '0.10-0.18' },
  { source: 'Clean river water', k: 0.08, range: '0.04-0.12' },
]
