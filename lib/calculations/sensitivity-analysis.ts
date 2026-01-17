/**
 * VerChem - Sensitivity Analysis Module
 * World-Class treatment system sensitivity analysis
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 * Best Practice: Monte Carlo simulation, Tornado diagrams
 */

import {
  WastewaterQuality,
  TreatmentUnit,
  UnitType,
  SensitivityParameter,
  SensitivityOutput,
  SensitivityRange,
  SensitivityDataPoint,
  SensitivityResult,
  SensitivityAnalysis,
  CostEstimation,
  EnergyConsumption,
  ThaiEffluentType,
  THAI_EFFLUENT_STANDARDS,
} from '../types/wastewater-treatment'

import {
  getDefaultDesignParams,
} from './wastewater-treatment'

// ============================================
// CONSTANTS
// ============================================

/** Minimum positive value to prevent division by zero */
const MIN_POSITIVE = 1e-6

/** Maximum Monte Carlo iterations to prevent DoS */
const MAX_MC_ITERATIONS = 5000

/** Minimum Monte Carlo iterations for statistical validity - reserved for validation */
const _MIN_MC_ITERATIONS = 10

/** Default electricity rate (THB/kWh) */
const DEFAULT_ELECTRICITY_RATE = 4.5

/** Default labor rate (THB/hour) */
const DEFAULT_LABOR_RATE = 500

/** Civil works cost per m³ (THB) */
const CIVIL_WORKS_COST_PER_M3 = 15000

/** Equipment cost per kW (THB) */
const EQUIPMENT_COST_PER_KW = 50000

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Ensures a value is non-negative and finite
 * @param value - The input value to check
 * @param fallback - Default value if input is invalid (default: 0)
 * @returns Non-negative finite number
 */
function safeNonNegative(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, value) : fallback
}

/**
 * Ensures a value is positive and finite
 * @param value - The input value to check
 * @param fallback - Default value if input is invalid (default: MIN_POSITIVE)
 * @returns Positive finite number
 */
function safePositive(value: number, fallback = MIN_POSITIVE): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/**
 * Safe division that prevents divide-by-zero errors
 * @param numerator - The dividend
 * @param denominator - The divisor
 * @param fallback - Default value if division is invalid (default: 0)
 * @returns Result of division or fallback
 */
function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  return Number.isFinite(denominator) && denominator > 0 ? numerator / denominator : fallback
}

// ============================================
// PARAMETER METADATA
// ============================================

interface ParameterMeta {
  name: string
  nameThai: string
  unit: string
  defaultRange: SensitivityRange
  category: 'influent' | 'design' | 'economic'
}

const PARAMETER_METADATA: Record<SensitivityParameter, ParameterMeta> = {
  flowRate: {
    name: 'Flow Rate',
    nameThai: 'อัตราการไหล',
    unit: 'm³/day',
    defaultRange: { min: -30, max: 30, steps: 7, type: 'percentage' },
    category: 'influent',
  },
  bod: {
    name: 'BOD₅',
    nameThai: 'บีโอดี',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'influent',
  },
  cod: {
    name: 'COD',
    nameThai: 'ซีโอดี',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'influent',
  },
  tss: {
    name: 'TSS',
    nameThai: 'ของแข็งแขวนลอย',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'influent',
  },
  tkn: {
    name: 'TKN',
    nameThai: 'ไนโตรเจนทั้งหมด',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'influent',
  },
  ammonia: {
    name: 'Ammonia-N',
    nameThai: 'แอมโมเนีย',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'influent',
  },
  totalP: {
    name: 'Total P',
    nameThai: 'ฟอสฟอรัสทั้งหมด',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'influent',
  },
  temperature: {
    name: 'Temperature',
    nameThai: 'อุณหภูมิ',
    unit: '°C',
    defaultRange: { min: -20, max: 20, steps: 5, type: 'percentage' },
    category: 'influent',
  },
  mlss: {
    name: 'MLSS',
    nameThai: 'ความเข้มข้นจุลินทรีย์',
    unit: 'mg/L',
    defaultRange: { min: -30, max: 30, steps: 7, type: 'percentage' },
    category: 'design',
  },
  srt: {
    name: 'SRT',
    nameThai: 'อายุสลัดจ์',
    unit: 'days',
    defaultRange: { min: -30, max: 50, steps: 9, type: 'percentage' },
    category: 'design',
  },
  hrt: {
    name: 'HRT',
    nameThai: 'ระยะเวลากักเก็บ',
    unit: 'hours',
    defaultRange: { min: -30, max: 30, steps: 7, type: 'percentage' },
    category: 'design',
  },
  returnRatio: {
    name: 'Return Sludge Ratio',
    nameThai: 'อัตราส่วนสลัดจ์หมุนเวียน',
    unit: '',
    defaultRange: { min: -50, max: 50, steps: 5, type: 'percentage' },
    category: 'design',
  },
  electricityRate: {
    name: 'Electricity Rate',
    nameThai: 'ค่าไฟฟ้า',
    unit: 'THB/kWh',
    defaultRange: { min: -20, max: 50, steps: 8, type: 'percentage' },
    category: 'economic',
  },
  laborRate: {
    name: 'Labor Rate',
    nameThai: 'ค่าแรงงาน',
    unit: 'THB/hour',
    defaultRange: { min: -10, max: 30, steps: 5, type: 'percentage' },
    category: 'economic',
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate variation values from range
 */
function generateVariations(
  baseValue: number,
  range: SensitivityRange
): { variation: number; value: number }[] {
  const results: { variation: number; value: number }[] = []
  const steps = Math.max(2, Math.floor(Number.isFinite(range.steps) ? range.steps : 2))
  const min = Number.isFinite(range.min) ? range.min : 0
  const max = Number.isFinite(range.max) ? range.max : min
  const stepSize = (max - min) / (steps - 1)

  for (let i = 0; i < steps; i++) {
    const variation = min + i * stepSize

    let value: number
    if (range.type === 'percentage') {
      value = baseValue * (1 + variation / 100)
    } else {
      value = baseValue + variation
    }

    // Ensure positive values for most parameters
    if (value <= 0) value = safePositive(baseValue, MIN_POSITIVE) * 0.01

    results.push({ variation, value })
  }

  return results
}

/**
 * Check compliance with Thai standards
 */
function checkCompliance(
  effluent: WastewaterQuality,
  standard: ThaiEffluentType
): boolean {
  const limits = THAI_EFFLUENT_STANDARDS[standard].limits
  return (
    effluent.bod <= limits.bod &&
    effluent.cod <= limits.cod &&
    effluent.tss <= limits.tss
  )
}

/**
 * Calculate elasticity (% change in output per % change in input)
 */
function calculateElasticity(
  dataPoints: SensitivityDataPoint[],
  outputKey: SensitivityOutput,
  baselineValue: number
): number {
  if (dataPoints.length < 2) return 0

  // Find two points on either side of baseline
  const baselineIdx = dataPoints.findIndex((p) => Math.abs(p.inputVariation) < 0.001)
  const leftIdx = baselineIdx > 0 ? baselineIdx - 1 : 0
  const rightIdx = baselineIdx < dataPoints.length - 1 ? baselineIdx + 1 : dataPoints.length - 1

  if (leftIdx === rightIdx) return 0

  const leftPoint = dataPoints[leftIdx]
  const rightPoint = dataPoints[rightIdx]

  const deltaInput = rightPoint.inputVariation - leftPoint.inputVariation
  const deltaOutput =
    ((rightPoint.outputs[outputKey] - leftPoint.outputs[outputKey]) / baselineValue) * 100

  if (Math.abs(deltaInput) < 0.001) return 0

  return deltaOutput / deltaInput
}

/**
 * Apply parameter variation to influent quality
 */
function applyInfluentVariation(
  baseInfluent: WastewaterQuality,
  parameter: SensitivityParameter,
  newValue: number
): WastewaterQuality {
  const modified = { ...baseInfluent }

  switch (parameter) {
    case 'flowRate':
      modified.flowRate = newValue
      break
    case 'bod':
      modified.bod = newValue
      break
    case 'cod':
      modified.cod = newValue
      break
    case 'tss':
      modified.tss = newValue
      break
    case 'tkn':
      modified.tkn = newValue
      break
    case 'ammonia':
      modified.ammonia = newValue
      break
    case 'totalP':
      modified.totalP = newValue
      break
    case 'temperature':
      modified.temperature = newValue
      break
    default:
      // Design/economic parameters don't modify influent
      break
  }

  return modified
}

// ============================================
// MAIN CALCULATION FUNCTIONS
// ============================================

/**
 * Input for sensitivity analysis
 */
export interface SensitivityAnalysisInput {
  systemName: string
  influent: WastewaterQuality
  unitConfigs: Array<{
    type: string
    config: Record<string, unknown>
  }>
  targetStandard: ThaiEffluentType
  parametersToAnalyze?: SensitivityParameter[]
  customRanges?: Partial<Record<SensitivityParameter, SensitivityRange>>
}

/**
 * Run sensitivity analysis for a single parameter
 */
export function analyzeSingleParameter(
  input: SensitivityAnalysisInput,
  parameter: SensitivityParameter,
  baselineResults: {
    effluent: WastewaterQuality
    cost: CostEstimation
    energy: EnergyConsumption
    compliance: boolean
    issues: number
  }
): SensitivityResult {
  const meta = PARAMETER_METADATA[parameter]
  const range = input.customRanges?.[parameter] || meta.defaultRange

  // Get baseline value
  let baselineValue: number
  switch (parameter) {
    case 'flowRate':
      baselineValue = input.influent.flowRate
      break
    case 'bod':
      baselineValue = input.influent.bod
      break
    case 'cod':
      baselineValue = input.influent.cod
      break
    case 'tss':
      baselineValue = input.influent.tss
      break
    case 'tkn':
      baselineValue = input.influent.tkn || 40
      break
    case 'ammonia':
      baselineValue = input.influent.ammonia || 25
      break
    case 'totalP':
      baselineValue = input.influent.totalP || 8
      break
    case 'temperature':
      baselineValue = input.influent.temperature || 25
      break
    case 'mlss':
      baselineValue = 3000 // Default
      break
    case 'srt':
      baselineValue = 10 // Default
      break
    case 'hrt':
      baselineValue = 6 // Default
      break
    case 'returnRatio':
      baselineValue = 0.5 // Default
      break
    case 'electricityRate':
      baselineValue = 4.5 // Default THB/kWh
      break
    case 'laborRate':
      baselineValue = 500 // Default THB/hour
      break
    default:
      baselineValue = 1
  }

  const baselineValueForCalc = safePositive(baselineValue, MIN_POSITIVE)
  const variations = generateVariations(baselineValueForCalc, range)
  const dataPoints: SensitivityDataPoint[] = []

  for (const { variation, value } of variations) {
    try {
      // Apply variation
      const modifiedInfluent = applyInfluentVariation(input.influent, parameter, value)

      // Recalculate treatment train
      const units: TreatmentUnit[] = []
      let currentQuality = modifiedInfluent

      for (const unitConfig of input.unitConfigs) {
        const defaultParams = getDefaultDesignParams(unitConfig.type as UnitType, currentQuality.flowRate)
        const params = { ...defaultParams, ...unitConfig.config, inputQuality: currentQuality }

        // Calculate unit (simplified - would call actual calculation functions)
        const unit = calculateUnitSimplified(unitConfig.type, params)
        if (unit) {
          units.push(unit)
          currentQuality = unit.outputQuality
        }
      }

      const effluent = currentQuality

      // Simplified cost estimation for sensitivity analysis
      // Uses approximate unit costs without full TreatmentSystem
      const totalVolume = units.reduce((sum, u) => {
        const design = u.design as unknown as Record<string, number | undefined>
        return sum + (design?.volume || 0)
      }, 0)

      const totalPower = units.reduce((sum, u) => {
        const design = u.design as unknown as Record<string, number | undefined>
        return sum + (design?.aeratorPower || 0)
      }, 0)

      // Simplified cost estimation
      const electricityRate = parameter === 'electricityRate' ? safeNonNegative(value, DEFAULT_ELECTRICITY_RATE) : DEFAULT_ELECTRICITY_RATE
      const laborRate = parameter === 'laborRate' ? safeNonNegative(value, DEFAULT_LABOR_RATE) : DEFAULT_LABOR_RATE
      const civilWorksCost = totalVolume * CIVIL_WORKS_COST_PER_M3
      const equipmentCost = totalPower * EQUIPMENT_COST_PER_KW
      const totalCapital = civilWorksCost + equipmentCost
      const monthlyElectricity = totalPower * 24 * 30 * electricityRate
      const monthlyLabor = laborRate * 8 * 30
      const totalOperating = monthlyElectricity + monthlyLabor
      const annualOperating = totalOperating * 12
      const costPerM3 = safeDivide(annualOperating, modifiedInfluent.flowRate * 365, 0)

      const cost: CostEstimation = {
        civilWorks: civilWorksCost,
        equipment: equipmentCost,
        engineering: totalCapital * 0.1,
        installation: totalCapital * 0.15,
        contingency: totalCapital * 0.1,
        landCost: 0,
        totalCapital,
        electricity: monthlyElectricity,
        chemicals: 0,
        labor: monthlyLabor,
        maintenance: totalCapital * 0.02 / 12,
        sludgeDisposal: 0,
        totalOperating,
        annualOperating,
        annualDepreciation: totalCapital / 20,
        totalAnnualCost: annualOperating + totalCapital / 20,
        costPerM3,
        unitCosts: [],
      }

      // Simplified energy calculation for sensitivity analysis
      const dailyEnergy = totalPower * 24
      const monthlyEnergy = dailyEnergy * 30
      const annualEnergy = dailyEnergy * 365
      const bodRemoved = Math.max(
        MIN_POSITIVE,
        ((modifiedInfluent.bod - effluent.bod) * modifiedInfluent.flowRate) / 1000
      )

      const energy: EnergyConsumption = {
        aeration: dailyEnergy * 0.7,
        pumping: dailyEnergy * 0.2,
        mixing: dailyEnergy * 0.05,
        sludgeHandling: dailyEnergy * 0.03,
        disinfection: dailyEnergy * 0.01,
        lighting: 2,
        other: dailyEnergy * 0.01,
        totalDaily: dailyEnergy,
        totalMonthly: monthlyEnergy,
        totalAnnual: annualEnergy,
        dailyCost: dailyEnergy * electricityRate,
        monthlyCost: monthlyEnergy * electricityRate,
        annualCost: annualEnergy * electricityRate,
        kWhPerM3: safeDivide(dailyEnergy, modifiedInfluent.flowRate, 0),
        kWhPerKgBOD: safeDivide(dailyEnergy, bodRemoved, 0),
        unitEnergy: [],
      }
      const compliance = checkCompliance(effluent, input.targetStandard)
      const issueCount = units.reduce((sum, u) => sum + u.issues.length, 0)

      // Calculate output values
      const outputs: Record<SensitivityOutput, number> = {
        effluentBOD: effluent.bod,
        effluentCOD: effluent.cod,
        effluentTSS: effluent.tss,
        effluentTKN: effluent.tkn || 0,
        effluentNH3: effluent.ammonia || 0,
        effluentTP: effluent.totalP || 0,
        bodRemoval: safeDivide(modifiedInfluent.bod - effluent.bod, modifiedInfluent.bod, 0) * 100,
        codRemoval: safeDivide(modifiedInfluent.cod - effluent.cod, modifiedInfluent.cod, 0) * 100,
        tssRemoval: safeDivide(modifiedInfluent.tss - effluent.tss, modifiedInfluent.tss, 0) * 100,
        nitrogenRemoval: modifiedInfluent.tkn
          ? safeDivide(modifiedInfluent.tkn - (effluent.tkn || 0), modifiedInfluent.tkn, 0) * 100
          : 0,
        phosphorusRemoval: modifiedInfluent.totalP
          ? safeDivide(modifiedInfluent.totalP - (effluent.totalP || 0), modifiedInfluent.totalP, 0) * 100
          : 0,
        totalCapitalCost: cost.totalCapital,
        totalOperatingCost: cost.totalOperating,
        costPerM3: cost.costPerM3,
        energyConsumption: energy.totalDaily,
        kWhPerM3: energy.kWhPerM3,
        sludgeProduction: 0, // Would need sludge calculation
        complianceStatus: compliance ? 1 : 0,
      }

      dataPoints.push({
        inputValue: value,
        inputVariation: variation,
        outputs,
        compliance,
        issues: issueCount,
      })
    } catch {
      // Skip failed variations
      continue
    }
  }

  // Calculate elasticities
  const baselineOutputs: Partial<Record<SensitivityOutput, number>> = {
    effluentBOD: baselineResults.effluent.bod,
    effluentCOD: baselineResults.effluent.cod,
    effluentTSS: baselineResults.effluent.tss,
    effluentTKN: baselineResults.effluent.tkn || 0,
    effluentNH3: baselineResults.effluent.ammonia || 0,
    effluentTP: baselineResults.effluent.totalP || 0,
    bodRemoval: input.influent.bod > 0
      ? safeDivide(input.influent.bod - baselineResults.effluent.bod, input.influent.bod, 0) * 100
      : 0,
    codRemoval: input.influent.cod > 0
      ? safeDivide(input.influent.cod - baselineResults.effluent.cod, input.influent.cod, 0) * 100
      : 0,
    tssRemoval: input.influent.tss > 0
      ? safeDivide(input.influent.tss - baselineResults.effluent.tss, input.influent.tss, 0) * 100
      : 0,
    nitrogenRemoval: input.influent.tkn
      ? safeDivide((input.influent.tkn || 0) - (baselineResults.effluent.tkn || 0), input.influent.tkn, 0) * 100
      : 0,
    phosphorusRemoval: input.influent.totalP
      ? safeDivide((input.influent.totalP || 0) - (baselineResults.effluent.totalP || 0), input.influent.totalP, 0) * 100
      : 0,
    totalCapitalCost: baselineResults.cost.totalCapital,
    totalOperatingCost: baselineResults.cost.totalOperating,
    costPerM3: baselineResults.cost.costPerM3,
    energyConsumption: baselineResults.energy.totalDaily,
    kWhPerM3: baselineResults.energy.kWhPerM3,
    complianceStatus: baselineResults.compliance ? 1 : 0,
    sludgeProduction: 0,
  }

  const outputKeys: SensitivityOutput[] = [
    'effluentBOD',
    'effluentCOD',
    'effluentTSS',
    'bodRemoval',
    'codRemoval',
    'tssRemoval',
    'totalCapitalCost',
    'totalOperatingCost',
    'costPerM3',
    'energyConsumption',
    'kWhPerM3',
    'complianceStatus',
    'nitrogenRemoval',
    'phosphorusRemoval',
    'effluentTKN',
    'effluentNH3',
    'effluentTP',
    'sludgeProduction',
  ]

  const elasticity = Object.fromEntries(outputKeys.map((key) => [key, 0])) as Record<SensitivityOutput, number>

  for (const key of outputKeys) {
    const baseValue =
      dataPoints.find((p) => Math.abs(p.inputVariation) < 0.001)?.outputs[key] ??
      baselineOutputs[key] ??
      1
    elasticity[key] = calculateElasticity(dataPoints, key, baseValue)
  }

  // Find critical threshold (where compliance changes)
  let criticalThreshold: SensitivityResult['criticalThreshold'] = undefined
  for (let i = 1; i < dataPoints.length; i++) {
    if (dataPoints[i].compliance !== dataPoints[i - 1].compliance) {
      criticalThreshold = {
        direction: dataPoints[i].compliance ? 'below' : 'above',
        value: dataPoints[i].inputValue,
        reason: `System ${dataPoints[i].compliance ? 'becomes' : 'loses'} compliance`,
      }
      break
    }
  }

  return {
    parameter,
    parameterName: meta.name,
    parameterNameThai: meta.nameThai,
    unit: meta.unit,
    baselineValue,
    dataPoints,
    impactRanking: 0, // Will be calculated in main function
    criticalThreshold,
    elasticity,
  }
}

/**
 * Simplified unit calculation for sensitivity analysis
 * (Wrapper around actual calculation functions)
 */
function calculateUnitSimplified(
  type: string,
  params: Record<string, unknown>
): TreatmentUnit | null {
  const inputQuality = params.inputQuality as WastewaterQuality

  // Simplified calculations based on unit type
  // In production, this would call actual calculation functions
  // Approximate removal rates for sensitivity analysis
  // Note: These are simplified estimates; actual rates depend on design and operation
  const removalRates: Record<string, { bod: number; cod: number; tss: number }> = {
    bar_screen: { bod: 5, cod: 5, tss: 10 },
    grit_chamber: { bod: 2, cod: 2, tss: 10 },
    primary_clarifier: { bod: 30, cod: 25, tss: 60 },
    aeration_tank: { bod: 90, cod: 85, tss: 90 },
    activated_sludge: { bod: 90, cod: 85, tss: 90 }, // Same as aeration_tank
    extended_aeration: { bod: 95, cod: 90, tss: 93 },
    secondary_clarifier: { bod: 5, cod: 5, tss: 90 },
    sbr: { bod: 92, cod: 88, tss: 94 },
    uasb: { bod: 75, cod: 80, tss: 70 },
    mbr: { bod: 97, cod: 95, tss: 99 },
    mbbr: { bod: 88, cod: 82, tss: 85 },
    oxidation_pond: { bod: 80, cod: 70, tss: 75 },
    aerated_lagoon: { bod: 85, cod: 75, tss: 80 },
    trickling_filter: { bod: 75, cod: 70, tss: 80 },
    rotating_biological_contactor: { bod: 80, cod: 75, tss: 82 },
    daf: { bod: 30, cod: 30, tss: 85 },
    filtration: { bod: 30, cod: 30, tss: 70 },
    sand_filter: { bod: 20, cod: 20, tss: 80 },
    chlorination: { bod: 2, cod: 2, tss: 0 },
    uv_disinfection: { bod: 0, cod: 0, tss: 0 },
    ozonation: { bod: 5, cod: 10, tss: 0 },
    oil_separator: { bod: 15, cod: 15, tss: 25 },
    equalization_tank: { bod: 0, cod: 0, tss: 5 },
    anaerobic_digester: { bod: 50, cod: 55, tss: 40 },
  }

  const rates = removalRates[type] || { bod: 0, cod: 0, tss: 0 }

  const outputQuality: WastewaterQuality = {
    ...inputQuality,
    bod: inputQuality.bod * (1 - rates.bod / 100),
    cod: inputQuality.cod * (1 - rates.cod / 100),
    tss: inputQuality.tss * (1 - rates.tss / 100),
  }

  return {
    id: `${type}_sens`,
    type: type,
    category: 'biological',
    name: type,
    enabled: true,
    inputQuality,
    outputQuality,
    status: 'pass',
    issues: [],
    removalEfficiency: {
      bod: rates.bod,
      cod: rates.cod,
      tss: rates.tss,
    },
    design: params,
  } as unknown as TreatmentUnit
}

/**
 * Run complete sensitivity analysis
 */
export function calculateSensitivityAnalysis(
  input: SensitivityAnalysisInput
): SensitivityAnalysis {
  const parametersToAnalyze = input.parametersToAnalyze || [
    'flowRate',
    'bod',
    'cod',
    'tss',
    'temperature',
    'electricityRate',
  ]

  // Calculate baseline
  const units: TreatmentUnit[] = []
  let currentQuality = input.influent

  for (const unitConfig of input.unitConfigs) {
    const defaultParams = getDefaultDesignParams(unitConfig.type as UnitType, currentQuality.flowRate)
    const params = { ...defaultParams, ...unitConfig.config, inputQuality: currentQuality }
    const unit = calculateUnitSimplified(unitConfig.type, params)
    if (unit) {
      units.push(unit)
      currentQuality = unit.outputQuality
    }
  }

  const baselineEffluent = currentQuality

  // Simplified baseline cost/energy calculations
  const baselineTotalVolume = units.reduce((sum, u) => {
    const design = u.design as unknown as Record<string, number | undefined>
    return sum + (design?.volume || 0)
  }, 0)
  const baselineTotalPower = units.reduce((sum, u) => {
    const design = u.design as unknown as Record<string, number | undefined>
    return sum + (design?.aeratorPower || 0)
  }, 0)
  const electricityRate = DEFAULT_ELECTRICITY_RATE
  const laborRate = DEFAULT_LABOR_RATE
  const civilWorks = baselineTotalVolume * CIVIL_WORKS_COST_PER_M3
  const equipment = baselineTotalPower * EQUIPMENT_COST_PER_KW
  const totalCapital = civilWorks + equipment
  const monthlyElectricity = baselineTotalPower * 24 * 30 * electricityRate
  const monthlyLabor = laborRate * 8 * 30
  const totalOperating = monthlyElectricity + monthlyLabor
  const baselineCost: CostEstimation = {
    civilWorks,
    equipment,
    engineering: 0,
    installation: 0,
    contingency: 0,
    landCost: 0,
    totalCapital,
    electricity: monthlyElectricity,
    chemicals: 0,
    labor: monthlyLabor,
    maintenance: 0,
    sludgeDisposal: 0,
    totalOperating,
    annualOperating: totalOperating * 12,
    annualDepreciation: 0,
    totalAnnualCost: totalOperating * 12,
    costPerM3: safeDivide(totalOperating * 12, input.influent.flowRate * 365, 0),
    unitCosts: [],
  }
  const baselineDailyEnergy = baselineTotalPower * 24
  const baselineBodRemoved = Math.max(1, (input.influent.bod - baselineEffluent.bod) * input.influent.flowRate / 1000)
  const baselineEnergy: EnergyConsumption = {
    aeration: baselineDailyEnergy * 0.7,
    pumping: baselineDailyEnergy * 0.2,
    mixing: baselineDailyEnergy * 0.05,
    sludgeHandling: baselineDailyEnergy * 0.03,
    disinfection: baselineDailyEnergy * 0.01,
    lighting: 2,
    other: baselineDailyEnergy * 0.01,
    totalDaily: baselineDailyEnergy,
    totalMonthly: baselineDailyEnergy * 30,
    totalAnnual: baselineDailyEnergy * 365,
    dailyCost: baselineDailyEnergy * electricityRate,
    monthlyCost: baselineDailyEnergy * 30 * electricityRate,
    annualCost: baselineDailyEnergy * 365 * electricityRate,
    kWhPerM3: safeDivide(baselineDailyEnergy, input.influent.flowRate, 0),
    kWhPerKgBOD: safeDivide(baselineDailyEnergy, baselineBodRemoved, 0),
    unitEnergy: [],
  }
  const baselineCompliance = checkCompliance(baselineEffluent, input.targetStandard)
  const baselineIssues = units.reduce((sum, u) => sum + u.issues.length, 0)

  const baselineResults = {
    effluent: baselineEffluent,
    cost: baselineCost,
    energy: baselineEnergy,
    compliance: baselineCompliance,
    issues: baselineIssues,
  }

  // Analyze each parameter
  const results: SensitivityResult[] = []
  for (const parameter of parametersToAnalyze) {
    const result = analyzeSingleParameter(input, parameter, baselineResults)
    results.push(result)
  }

  // Rank parameters by impact on cost
  const sortedByCostImpact = [...results].sort((a, b) => {
    const aImpact = Math.abs(a.elasticity.costPerM3 || 0)
    const bImpact = Math.abs(b.elasticity.costPerM3 || 0)
    return bImpact - aImpact
  })

  sortedByCostImpact.forEach((result, idx) => {
    const original = results.find((r) => r.parameter === result.parameter)
    if (original) original.impactRanking = idx + 1
  })

  // Generate tornado chart data
  const tornadoData = results.map((result) => {
    const lowPoint = result.dataPoints[0]
    const highPoint = result.dataPoints[result.dataPoints.length - 1]
    const baselinePoint = result.dataPoints.find((p) => Math.abs(p.inputVariation) < 0.001)
    const baselineCostPerM3 = baselinePoint?.outputs.costPerM3 || 1

    return {
      parameter: result.parameter,
      parameterName: result.parameterName,
      lowValue: lowPoint?.inputValue || 0,
      highValue: highPoint?.inputValue || 0,
      lowImpact: baselineCostPerM3
        ? ((lowPoint?.outputs.costPerM3 || 0) - baselineCostPerM3) / baselineCostPerM3 * 100
        : 0,
      highImpact: baselineCostPerM3
        ? ((highPoint?.outputs.costPerM3 || 0) - baselineCostPerM3) / baselineCostPerM3 * 100
        : 0,
      baselineValue: result.baselineValue,
    }
  }).sort((a, b) => {
    const aRange = Math.abs(a.highImpact - a.lowImpact)
    const bRange = Math.abs(b.highImpact - b.lowImpact)
    return bRange - aRange
  })

  // Generate summary
  const mostSensitive = sortedByCostImpact.slice(0, 3).map((r) => r.parameter)
  const leastSensitive = sortedByCostImpact.slice(-3).map((r) => r.parameter)

  const criticalRisks = results
    .filter((r) => r.criticalThreshold)
    .map((r) => ({
      parameter: r.parameter,
      threshold: r.criticalThreshold!.value,
      consequence: r.criticalThreshold!.reason,
    }))

  // Calculate robustness score (0-100)
  const complianceChanges = results.filter((r) => r.criticalThreshold).length
  const avgElasticity =
    results.reduce((sum, r) => sum + Math.abs(r.elasticity.costPerM3 || 0), 0) / results.length

  const robustnessScore = Math.max(0, Math.min(100, 100 - complianceChanges * 15 - avgElasticity * 10))

  const recommendations: string[] = []
  if (mostSensitive.includes('flowRate')) {
    recommendations.push('Install flow equalization to buffer peak flows')
  }
  if (mostSensitive.includes('bod') || mostSensitive.includes('cod')) {
    recommendations.push('Consider installing pretreatment for high-strength waste')
  }
  if (mostSensitive.includes('temperature')) {
    recommendations.push('Design for temperature extremes with safety factors')
  }
  if (criticalRisks.length > 0) {
    recommendations.push('Implement real-time monitoring for critical parameters')
  }
  if (robustnessScore < 50) {
    recommendations.push('Consider oversizing key units to improve system robustness')
  }

  return {
    timestamp: new Date(),
    systemName: input.systemName,
    baselineInfluent: input.influent,
    baselineEffluent,
    baselineCost,
    baselineEnergy,
    baselineCompliance,
    results,
    summary: {
      mostSensitiveParameters: mostSensitive,
      leastSensitiveParameters: leastSensitive,
      criticalRisks,
      robustnessScore,
      recommendations,
    },
    tornadoData,
  }
}

/**
 * Generate Monte Carlo simulation for uncertainty analysis
 */
export function runMonteCarloSimulation(
  input: SensitivityAnalysisInput,
  iterations: number = 1000,
  uncertaintyPercent: number = 20
): {
  results: {
    costPerM3: { mean: number; stdDev: number; p5: number; p95: number }
    complianceRate: number
    effluentBOD: { mean: number; stdDev: number; p5: number; p95: number }
  }
  iterations: number
} {
  const normalizedIterations = Number.isFinite(iterations) ? Math.floor(iterations) : 0
  const boundedIterations = Math.min(MAX_MC_ITERATIONS, Math.max(1, normalizedIterations))
  const boundedUncertainty = safeNonNegative(uncertaintyPercent, 20)
  const uncertainty = Math.min(100, boundedUncertainty)

  const costResults: number[] = []
  const bodResults: number[] = []
  let compliantCount = 0

  for (let i = 0; i < boundedIterations; i++) {
    // Generate random variations
    const variationFactor = 1 + ((Math.random() * 2 - 1) * uncertainty) / 100

    const modifiedInfluent: WastewaterQuality = {
      ...input.influent,
      flowRate: safePositive(input.influent.flowRate * variationFactor, MIN_POSITIVE),
      bod: safeNonNegative(input.influent.bod * (1 + ((Math.random() * 2 - 1) * uncertainty) / 100), 0),
      cod: safeNonNegative(input.influent.cod * (1 + ((Math.random() * 2 - 1) * uncertainty) / 100), 0),
      tss: safeNonNegative(input.influent.tss * (1 + ((Math.random() * 2 - 1) * uncertainty) / 100), 0),
    }

    // Calculate treatment
    const units: TreatmentUnit[] = []
    let currentQuality = modifiedInfluent

    for (const unitConfig of input.unitConfigs) {
      const defaultParams = getDefaultDesignParams(unitConfig.type as UnitType, currentQuality.flowRate)
      const params = { ...defaultParams, ...unitConfig.config, inputQuality: currentQuality }
      const unit = calculateUnitSimplified(unitConfig.type, params)
      if (unit) {
        units.push(unit)
        currentQuality = unit.outputQuality
      }
    }

    // Simplified cost calculation for Monte Carlo
    const mcTotalPower = units.reduce((sum, u) => {
      const design = u.design as unknown as Record<string, number | undefined>
      return sum + (design?.aeratorPower || 0)
    }, 0)
    const mcAnnualCost = (mcTotalPower * 24 * 30 * 4.5 + 500 * 8 * 30) * 12
    const mcCostPerM3 = safeDivide(mcAnnualCost, modifiedInfluent.flowRate * 365, 0)
    costResults.push(mcCostPerM3)
    bodResults.push(currentQuality.bod)

    if (checkCompliance(currentQuality, input.targetStandard)) {
      compliantCount++
    }
  }

  // Calculate statistics
  const calcStats = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b)
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
    return {
      mean,
      stdDev: Math.sqrt(variance),
      p5: sorted[Math.floor(arr.length * 0.05)],
      p95: sorted[Math.floor(arr.length * 0.95)],
    }
  }

  return {
    results: {
      costPerM3: calcStats(costResults),
      complianceRate: compliantCount / boundedIterations,
      effluentBOD: calcStats(bodResults),
    },
    iterations: boundedIterations,
  }
}
