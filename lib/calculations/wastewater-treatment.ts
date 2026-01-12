/**
 * VerChem - Wastewater Treatment System Calculations
 * Design calculations for treatment units
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 * Thai Standards: Pollution Control Department (PCD)
 */

import {
  WastewaterQuality,
  TreatmentUnit,
  TreatmentSystem,
  UnitStatus,
  DesignIssue,
  IssueSeverity,
  UnitType,
  UNIT_METADATA,
  THAI_EFFLUENT_STANDARDS,
  ThaiEffluentType,
  BarScreenUnit,
  GritChamberUnit,
  PrimaryClarifierUnit,
  AerationTankUnit,
  SecondaryClarifierUnit,
  ChlorinationUnit,
  UASBUnit,
  SBRUnit,
  OxidationPondUnit,
  OilSeparatorUnit,
  DAFUnit,
  CostEstimation,
  UNIT_COST_PARAMS,
  GENERAL_COST_PARAMS,
  FiltrationUnit,
  UVDisinfectionUnit,
  TricklingFilterUnit,
  MBRUnit,
} from '../types/wastewater-treatment'

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a design issue
 */
function createIssue(
  severity: IssueSeverity,
  parameter: string,
  message: string,
  currentValue: number,
  unit: string,
  suggestion: string,
  recommendedValue?: number
): DesignIssue {
  return {
    severity,
    parameter,
    message,
    currentValue,
    recommendedValue,
    unit,
    suggestion,
  }
}

/**
 * Calculate removal efficiency and output quality
 */
function applyRemoval(
  input: WastewaterQuality,
  bodRemoval: number,
  codRemoval: number,
  tssRemoval: number
): WastewaterQuality {
  return {
    ...input,
    bod: input.bod * (1 - bodRemoval / 100),
    cod: input.cod * (1 - codRemoval / 100),
    tss: input.tss * (1 - tssRemoval / 100),
    // Nutrients typically follow TSS removal partially
    tkn: input.tkn !== undefined ? input.tkn * (1 - tssRemoval * 0.3 / 100) : undefined,
    totalP: input.totalP !== undefined ? input.totalP * (1 - tssRemoval * 0.2 / 100) : undefined,
  }
}

const MIN_POSITIVE = 1e-6

function normalizePositive(
  value: number,
  parameter: string,
  unit: string,
  issues: DesignIssue[],
  fallback: number = MIN_POSITIVE
): number {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push(createIssue('critical', parameter, 'Invalid or non-positive value', Number.isFinite(value) ? value : fallback, unit, 'Enter a value greater than 0'))
    return fallback
  }
  return value
}

function normalizeNonNegative(
  value: number,
  parameter: string,
  unit: string,
  issues: DesignIssue[],
  fallback: number = 0
): number {
  if (!Number.isFinite(value) || value < 0) {
    issues.push(createIssue('critical', parameter, 'Invalid or negative value', Number.isFinite(value) ? value : fallback, unit, 'Enter a value of 0 or higher'))
    return fallback
  }
  return value
}

function normalizeFraction(
  value: number,
  parameter: string,
  issues: DesignIssue[],
  fallback: number = 0.5
): number {
  if (!Number.isFinite(value) || value <= 0 || value > 1) {
    issues.push(createIssue('warning', parameter, 'Value should be between 0 and 1', Number.isFinite(value) ? value : fallback, '', 'Use a value between 0 and 1'))
    return fallback
  }
  return value
}

function calculateRemovalPercent(influentValue: number, effluentValue: number): number {
  if (!Number.isFinite(influentValue) || influentValue <= 0 || !Number.isFinite(effluentValue)) {
    return 0
  }
  return ((influentValue - effluentValue) / influentValue) * 100
}

type UnitInputConfig<T> = Omit<T, 'inputQuality'>

/**
 * Determine status from issues
 */
function determineStatus(issues: DesignIssue[]): UnitStatus {
  if (issues.some(i => i.severity === 'critical')) return 'fail'
  if (issues.some(i => i.severity === 'warning')) return 'warning'
  return 'pass'
}

// ============================================
// BAR SCREEN CALCULATIONS
// ============================================

export interface BarScreenInput {
  inputQuality: WastewaterQuality
  barSpacing: number        // mm
  channelWidth: number      // m
  channelDepth: number      // m
  screenAngle: number       // degrees
  barWidth: number          // mm
  cleaningType: 'manual' | 'mechanical'
}

export function calculateBarScreen(input: BarScreenInput): BarScreenUnit {
  const { inputQuality, barSpacing, channelWidth, channelDepth, screenAngle, barWidth, cleaningType } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const Q_m3s = Q / 86400 // m³/s

  const safeBarSpacing = normalizePositive(barSpacing, 'Bar Spacing', 'mm', issues)
  const safeBarWidth = normalizePositive(barWidth, 'Bar Width', 'mm', issues)
  const safeChannelWidth = normalizePositive(channelWidth, 'Channel Width', 'm', issues)
  const safeChannelDepth = normalizePositive(channelDepth, 'Channel Depth', 'm', issues)
  const safeScreenAngle = normalizePositive(screenAngle, 'Screen Angle', 'degrees', issues, 1)

  // Calculate approach velocity
  const channelArea = safeChannelWidth * safeChannelDepth
  const approachVelocity = Q_m3s / channelArea // m/s

  // Calculate clear area ratio
  const clearRatio = safeBarSpacing / (safeBarSpacing + safeBarWidth)

  // Through velocity
  const throughVelocity = approachVelocity / clearRatio

  // Head loss (Kirschmer equation)
  const beta = safeBarWidth / safeBarSpacing
  const headloss = 1.43 * Math.pow(beta, 4/3) * Math.pow(throughVelocity, 2) / (2 * 9.81) * (1 / Math.sin(safeScreenAngle * Math.PI / 180))

  // Validate design criteria
  if (approachVelocity < 0.3) {
    issues.push(createIssue('warning', 'Approach Velocity', 'Too low - grit may settle', approachVelocity, 'm/s', 'Reduce channel width or depth', 0.45))
  }
  if (approachVelocity > 0.6) {
    issues.push(createIssue('critical', 'Approach Velocity', 'Too high - solids may pass through', approachVelocity, 'm/s', 'Increase channel width or depth', 0.45))
  }
  if (throughVelocity > 1.2) {
    issues.push(createIssue('warning', 'Through Velocity', 'Too high - may damage screens', throughVelocity, 'm/s', 'Increase bar spacing or channel size', 0.9))
  }
  if (barSpacing < 6 && cleaningType === 'manual') {
    issues.push(createIssue('warning', 'Bar Spacing', 'Fine spacing requires mechanical cleaning', barSpacing, 'mm', 'Use mechanical cleaning or increase spacing', 25))
  }

  // Typical removal for bar screen
  const bodRemoval = safeBarSpacing < 10 ? 10 : safeBarSpacing < 25 ? 7 : 5
  const codRemoval = bodRemoval
  const tssRemoval = safeBarSpacing < 10 ? 20 : safeBarSpacing < 25 ? 15 : 10

  return {
    id: `bar_screen_${Date.now()}`,
    type: 'bar_screen',
    category: 'preliminary',
    name: UNIT_METADATA.bar_screen.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      barSpacing: safeBarSpacing,
      barWidth: safeBarWidth,
      barDepth: 50,
      screenAngle: safeScreenAngle,
      channelWidth: safeChannelWidth,
      channelDepth: safeChannelDepth,
      approachVelocity,
      throughVelocity,
      headloss,
      cleaningType,
    },
  }
}

// ============================================
// GRIT CHAMBER CALCULATIONS
// ============================================

export interface GritChamberInput {
  inputQuality: WastewaterQuality
  chamberType: 'horizontal_flow' | 'aerated' | 'vortex'
  length: number           // m
  width: number            // m
  depth: number            // m
}

export function calculateGritChamber(input: GritChamberInput): GritChamberUnit {
  const { inputQuality, chamberType, length, width, depth } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const Q_m3s = Q / 86400

  const safeLength = normalizePositive(length, 'Length', 'm', issues)
  const safeWidth = normalizePositive(width, 'Width', 'm', issues)
  const safeDepth = normalizePositive(depth, 'Depth', 'm', issues)

  const volume = safeLength * safeWidth * safeDepth
  const hrt = (volume / Q_m3s) // seconds
  const horizontalVelocity = Q_m3s / (safeWidth * safeDepth) // m/s
  const surfaceLoading = chamberType === 'aerated' ? Q / (safeLength * safeWidth * 24) : 0 // m³/m²·h

  // Validation
  if (chamberType === 'horizontal_flow') {
    if (hrt < 45) {
      issues.push(createIssue('critical', 'HRT', 'Too short - grit will not settle', hrt, 'seconds', 'Increase chamber volume', 60))
    }
    if (hrt > 90) {
      issues.push(createIssue('warning', 'HRT', 'Unnecessarily long - organics may settle', hrt, 'seconds', 'Reduce volume or increase flow', 60))
    }
    if (horizontalVelocity < 0.15) {
      issues.push(createIssue('warning', 'Horizontal Velocity', 'Too low - organics may settle', horizontalVelocity, 'm/s', 'Reduce cross-sectional area', 0.3))
    }
    if (horizontalVelocity > 0.45) {
      issues.push(createIssue('critical', 'Horizontal Velocity', 'Too high - grit will not settle', horizontalVelocity, 'm/s', 'Increase chamber size', 0.3))
    }
  }

  if (chamberType === 'aerated') {
    if (hrt < 120) { // 2 minutes
      issues.push(createIssue('warning', 'HRT', 'Short for aerated grit chamber', hrt, 'seconds', 'Typical: 2-5 minutes', 180))
    }
    if (surfaceLoading > 30) {
      issues.push(createIssue('warning', 'Surface Loading', 'High for aerated chamber', surfaceLoading, 'm³/m²·h', 'Increase surface area', 15))
    }
  }

  // Estimate grit production (typical 4-200 mL/m³)
  const gritProduction = chamberType === 'vortex' ? 20 : 15 // L/1000 m³

  // Minimal organic removal
  const tssRemoval = chamberType === 'aerated' ? 15 : 10

  return {
    id: `grit_chamber_${Date.now()}`,
    type: 'grit_chamber',
    category: 'preliminary',
    name: UNIT_METADATA.grit_chamber.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, 2, 2, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: 2, cod: 2, tss: tssRemoval },
    design: {
      chamberType,
      length: safeLength,
      width: safeWidth,
      depth: safeDepth,
      volume,
      hrt,
      horizontalVelocity,
      surfaceLoading: chamberType === 'aerated' ? surfaceLoading : undefined,
      airSupply: chamberType === 'aerated' ? 0.3 : undefined, // m³/min per m length
      gritProduction,
    },
  }
}

// ============================================
// PRIMARY CLARIFIER CALCULATIONS
// ============================================

export interface PrimaryClarifierInput {
  inputQuality: WastewaterQuality
  shape: 'circular' | 'rectangular'
  diameter?: number        // m (for circular)
  length?: number          // m (for rectangular)
  width?: number           // m (for rectangular)
  sidewaterDepth: number   // m
}

export function calculatePrimaryClarifier(input: PrimaryClarifierInput): PrimaryClarifierUnit {
  const { inputQuality, shape, diameter, length, width, sidewaterDepth } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeSidewaterDepth = normalizePositive(sidewaterDepth, 'Sidewater Depth', 'm', issues)

  let safeDiameter = diameter
  let safeLength = length
  let safeWidth = width

  // Calculate surface area
  let surfaceArea: number
  if (shape === 'circular' && diameter) {
    safeDiameter = normalizePositive(diameter, 'Diameter', 'm', issues)
    surfaceArea = Math.PI * Math.pow(safeDiameter / 2, 2)
  } else if (length && width) {
    safeLength = normalizePositive(length, 'Length', 'm', issues)
    safeWidth = normalizePositive(width, 'Width', 'm', issues)
    surfaceArea = safeLength * safeWidth
  } else {
    safeLength = normalizePositive(length || 0, 'Length', 'm', issues)
    safeWidth = normalizePositive(width || 0, 'Width', 'm', issues)
    surfaceArea = safeLength * safeWidth
  }

  const volume = surfaceArea * safeSidewaterDepth

  // Surface overflow rate
  const sor = Q / surfaceArea // m³/m²·day
  const hrt = volume / Q * 24 // hours

  // Weir loading (assume peripheral weir for circular)
  const weirLength = shape === 'circular' && safeDiameter ? Math.PI * safeDiameter : (safeWidth || 0) * 2
  const weirLoading = Q / weirLength // m³/m·day

  // Validation
  if (sor < 24) {
    issues.push(createIssue('info', 'Overflow Rate', 'Conservative design - good performance', sor, 'm³/m²·day', 'Typical range: 24-48', 36))
  }
  if (sor > 48) {
    issues.push(createIssue('warning', 'Overflow Rate', 'High - may reduce efficiency', sor, 'm³/m²·day', 'Increase surface area', 36))
  }
  if (sor > 60) {
    issues.push(createIssue('critical', 'Overflow Rate', 'Too high - poor settling expected', sor, 'm³/m²·day', 'Significantly increase surface area', 36))
  }

  if (hrt < 1.5) {
    issues.push(createIssue('critical', 'HRT', 'Too short for adequate settling', hrt, 'hours', 'Increase volume (depth or area)', 2.0))
  }
  if (hrt > 2.5) {
    issues.push(createIssue('info', 'HRT', 'Long detention time - may cause septicity', hrt, 'hours', 'Consider reducing volume', 2.0))
  }

  if (weirLoading > 250) {
    issues.push(createIssue('warning', 'Weir Loading', 'High - may cause turbulence', weirLoading, 'm³/m·day', 'Extend weir length', 186))
  }

  if (sidewaterDepth < 3) {
    issues.push(createIssue('warning', 'Sidewater Depth', 'Shallow - limited sludge storage', sidewaterDepth, 'm', 'Typical: 3-5 m', 3.5))
  }

  // Removal efficiency based on SOR and HRT
  let bodRemoval = 30
  let tssRemoval = 55

  if (sor <= 32 && hrt >= 2) {
    bodRemoval = 35
    tssRemoval = 65
  } else if (sor > 48 || hrt < 1.5) {
    bodRemoval = 25
    tssRemoval = 45
  }

  const codRemoval = bodRemoval * 0.85

  // Sludge production
  const sludgeProduction = inputQuality.tss * (tssRemoval / 100) * Q / 1000 // kg/day
  const sludgeConcentration = 4 // % typical

  return {
    id: `primary_clarifier_${Date.now()}`,
    type: 'primary_clarifier',
    category: 'primary',
    name: UNIT_METADATA.primary_clarifier.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      shape,
      diameter: safeDiameter,
      length: safeLength,
      width: safeWidth,
      sidewaterDepth: safeSidewaterDepth,
      surfaceArea,
      volume,
      surfaceOverflowRate: sor,
      peakOverflowRate: sor * 2.5,
      hrt,
      weirLoadingRate: weirLoading,
      sludgeProduction,
      sludgeConcentration,
    },
  }
}

// ============================================
// AERATION TANK CALCULATIONS
// ============================================

export interface AerationTankInput {
  inputQuality: WastewaterQuality
  processType: 'conventional' | 'extended_aeration' | 'contact_stabilization' | 'step_feed' | 'complete_mix'
  volume: number           // m³
  mlss: number             // mg/L
  srt: number              // days
  targetDO: number         // mg/L
  aerationType: 'fine_bubble' | 'coarse_bubble' | 'mechanical_surface' | 'jet'
  returnRatio: number      // Qr/Q
}

export function calculateAerationTank(input: AerationTankInput): AerationTankUnit {
  const { inputQuality, processType, volume, mlss, srt, targetDO, aerationType, returnRatio } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeVolume = normalizePositive(volume, 'Volume', 'm³', issues)
  const safeMlss = normalizePositive(mlss, 'MLSS', 'mg/L', issues)
  const safeSrt = normalizePositive(srt, 'SRT', 'days', issues)
  const safeTargetDO = normalizeNonNegative(targetDO, 'Target DO', 'mg/L', issues)
  const safeReturnRatio = normalizeNonNegative(returnRatio, 'Return Ratio', '', issues)
  const BODin = inputQuality.bod // mg/L

  // Calculate HRT
  const hrt = safeVolume / Q * 24 // hours

  // MLVSS (assume 75% of MLSS)
  const mlvss = safeMlss * 0.75

  // F/M Ratio
  const massFood = BODin * Q / 1000 // kg BOD/day
  const massMicroorganisms = mlvss * safeVolume / 1000 // kg MLVSS
  const fmRatio = massFood / massMicroorganisms // kg BOD/kg MLVSS·day

  // Volumetric loading
  const volumetricLoading = massFood / safeVolume // kg BOD/m³·day

  // Expected BOD removal based on F/M
  let bodRemoval = 90
  if (fmRatio < 0.1) bodRemoval = 95
  else if (fmRatio > 1.0) bodRemoval = 70
  else if (fmRatio > 0.6) bodRemoval = 80

  // Oxygen requirements
  // O2 = a'(BOD removed) + b'(MLVSS)
  const a_prime = 0.5 // kg O2/kg BOD removed (typical)
  const b_prime = 0.1 // kg O2/kg MLVSS·day (endogenous)
  const bodRemoved = BODin * (bodRemoval / 100) * Q / 1000 // kg BOD/day
  const oxygenRequired = a_prime * bodRemoved + b_prime * massMicroorganisms // kg O2/day

  // Aeration system sizing
  const oxygenTransferEfficiency = aerationType === 'fine_bubble' ? 0.30 : aerationType === 'coarse_bubble' ? 0.10 : 0.15
  const sotRequired = oxygenRequired / oxygenTransferEfficiency // kg O2/day from standard conditions

  // Air flow (assume 1.8 kg O2/kg air, 1.2 kg/m³ air)
  const airDensity = 1.2 // kg/m³
  const oxygenInAir = 0.21 // fraction
  const airFlowRate = sotRequired / (airDensity * oxygenInAir * oxygenTransferEfficiency) / 1440 // m³/min

  // Power estimation (0.018-0.040 kW/m³/h for fine bubble)
  const specificPower = aerationType === 'fine_bubble' ? 25 : aerationType === 'mechanical_surface' ? 30 : 20 // W/m³
  const aeratorPower = specificPower * safeVolume / 1000 // kW

  // Sludge production
  const sludgeYield = 0.5 // kg VSS/kg BOD removed (typical)
  const sludgeProduction = sludgeYield * bodRemoved // kg VSS/day

  // Waste sludge rate
  const wasteSludgeRate = safeVolume / safeSrt * (safeMlss / 1e6) // m³/day approximate

  // Process-specific validation
  const typicalFM: Record<typeof processType, [number, number]> = {
    conventional: [0.2, 0.6],
    extended_aeration: [0.05, 0.15],
    contact_stabilization: [0.2, 0.6],
    step_feed: [0.2, 0.5],
    complete_mix: [0.2, 0.6],
  }

  const typicalHRT: Record<typeof processType, [number, number]> = {
    conventional: [4, 8],
    extended_aeration: [18, 36],
    contact_stabilization: [3, 6],
    step_feed: [3, 5],
    complete_mix: [3, 5],
  }

  const typicalSRT: Record<typeof processType, [number, number]> = {
    conventional: [5, 15],
    extended_aeration: [20, 40],
    contact_stabilization: [5, 15],
    step_feed: [5, 15],
    complete_mix: [5, 15],
  }

  const [fmMin, fmMax] = typicalFM[processType]
  const [hrtMin, hrtMax] = typicalHRT[processType]
  const [srtMin, srtMax] = typicalSRT[processType]

  if (fmRatio < fmMin) {
    issues.push(createIssue('warning', 'F/M Ratio', `Low for ${processType} - overdesigned`, fmRatio, 'kg BOD/kg MLVSS·d', `Typical range: ${fmMin}-${fmMax}`, (fmMin + fmMax) / 2))
  }
  if (fmRatio > fmMax) {
    issues.push(createIssue('critical', 'F/M Ratio', `High for ${processType} - underloaded`, fmRatio, 'kg BOD/kg MLVSS·d', 'Increase volume or MLSS', (fmMin + fmMax) / 2))
  }

  if (hrt < hrtMin) {
    issues.push(createIssue('critical', 'HRT', `Too short for ${processType}`, hrt, 'hours', 'Increase tank volume', (hrtMin + hrtMax) / 2))
  }
  if (hrt > hrtMax * 1.5) {
    issues.push(createIssue('info', 'HRT', `Long for ${processType}`, hrt, 'hours', 'Consider reducing volume', (hrtMin + hrtMax) / 2))
  }

  if (safeSrt < srtMin) {
    issues.push(createIssue('critical', 'SRT', `Too short - sludge washout risk`, safeSrt, 'days', 'Reduce waste sludge rate', (srtMin + srtMax) / 2))
  }
  if (safeSrt > srtMax) {
    issues.push(createIssue('warning', 'SRT', `Long - old sludge may reduce activity`, safeSrt, 'days', 'Increase waste sludge rate', (srtMin + srtMax) / 2))
  }

  if (safeMlss < 2000) {
    issues.push(createIssue('warning', 'MLSS', 'Low biomass concentration', safeMlss, 'mg/L', 'Increase to 2500-4000', 3000))
  }
  if (safeMlss > 5000) {
    issues.push(createIssue('warning', 'MLSS', 'High - may cause settling issues', safeMlss, 'mg/L', 'Typical max: 4000-5000', 3500))
  }

  if (safeTargetDO < 1.5) {
    issues.push(createIssue('warning', 'Target DO', 'Low - may limit treatment', safeTargetDO, 'mg/L', 'Maintain 1.5-2.5 mg/L', 2.0))
  }

  if (volumetricLoading > 1.5) {
    issues.push(createIssue('warning', 'Volumetric Loading', 'High organic loading', volumetricLoading, 'kg BOD/m³·d', 'Typical: 0.3-1.0', 0.6))
  }

  const codRemoval = bodRemoval * 0.9
  const tssRemoval = bodRemoval * 0.95

  // Calculate tank dimensions (assume rectangular)
  const depth = 4.5 // m typical
  const area = safeVolume / depth
  const aspectRatio = 2 // L:W
  const tankWidth = Math.sqrt(area / aspectRatio)
  const tankLength = tankWidth * aspectRatio

  return {
    id: `aeration_tank_${Date.now()}`,
    type: 'aeration_tank',
    category: 'biological',
    name: UNIT_METADATA.aeration_tank.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      processType,
      length: tankLength,
      width: tankWidth,
      depth,
      volume: safeVolume,
      numberOfTanks: 1,
      hrt,
      srt: safeSrt,
      mlss: safeMlss,
      mlvss,
      fmRatio,
      volumetricLoading,
      oxygenRequired,
      oxygenTransferEfficiency: oxygenTransferEfficiency * 100,
      aerationType,
      airFlowRate,
      aeratorPower,
      specificPower: specificPower / 1000 * 1000, // kW/1000 m³
      targetDO: safeTargetDO,
      returnRatio: safeReturnRatio,
      wasteSludgeRate,
      sludgeYield,
      sludgeProduction,
    },
  }
}

// ============================================
// SECONDARY CLARIFIER CALCULATIONS
// ============================================

export interface SecondaryClarifierInput {
  inputQuality: WastewaterQuality
  shape: 'circular' | 'rectangular'
  diameter?: number        // m
  length?: number          // m
  width?: number           // m
  sidewaterDepth: number   // m
  mlss: number             // mg/L from aeration tank
  returnRatio: number      // Qr/Q
}

export function calculateSecondaryClarifier(input: SecondaryClarifierInput): SecondaryClarifierUnit {
  const { inputQuality, shape, diameter, length, width, sidewaterDepth, mlss, returnRatio } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeMlss = normalizePositive(mlss, 'MLSS', 'mg/L', issues)
  const safeReturnRatio = normalizePositive(returnRatio, 'Return Ratio', '', issues)
  const safeSidewaterDepth = normalizePositive(sidewaterDepth, 'Sidewater Depth', 'm', issues)
  const Qr = Q * safeReturnRatio // return sludge flow

  // Calculate surface area
  let safeDiameter = diameter
  let safeLength = length
  let safeWidth = width
  let surfaceArea: number
  if (shape === 'circular' && diameter) {
    safeDiameter = normalizePositive(diameter, 'Diameter', 'm', issues)
    surfaceArea = Math.PI * Math.pow(safeDiameter / 2, 2)
  } else if (length && width) {
    safeLength = normalizePositive(length, 'Length', 'm', issues)
    safeWidth = normalizePositive(width, 'Width', 'm', issues)
    surfaceArea = safeLength * safeWidth
  } else {
    safeLength = normalizePositive(length || 0, 'Length', 'm', issues)
    safeWidth = normalizePositive(width || 0, 'Width', 'm', issues)
    surfaceArea = safeLength * safeWidth
  }

  const volume = surfaceArea * safeSidewaterDepth

  // Surface overflow rate (based on Q, not Q+Qr for design)
  const sor = Q / surfaceArea // m³/m²·day
  const peakSor = Q * 2.5 / surfaceArea // peak factor 2.5
  const hrt = volume / (Q + Qr) * 24 // hours

  // Solids loading rate
  const solidsMass = safeMlss * (Q + Qr) / 1000 // kg/day
  const solidLoading = solidsMass / surfaceArea / 24 // kg/m²·h
  const peakSolidsLoading = solidLoading * 2.5

  // Weir loading
  const weirLength = shape === 'circular' && safeDiameter ? Math.PI * safeDiameter : (safeWidth || 0) * 2
  const weirLoading = Q / weirLength

  // RAS concentration
  // Mass balance: Qr * Xr = (Q + Qr) * mlss (simplified)
  const rasConcentration = safeMlss * (1 + safeReturnRatio) / safeReturnRatio // mg/L

  // Validation
  if (sor > 32) {
    issues.push(createIssue('warning', 'Overflow Rate', 'High - may reduce settling', sor, 'm³/m²·day', 'Increase surface area', 24))
  }
  if (sor > 48) {
    issues.push(createIssue('critical', 'Overflow Rate', 'Too high - sludge carryover likely', sor, 'm³/m²·day', 'Significantly increase area', 24))
  }

  if (peakSor > 48) {
    issues.push(createIssue('warning', 'Peak Overflow Rate', 'May exceed during peaks', peakSor, 'm³/m²·day', 'Design for peak flows', 40))
  }

  if (solidLoading > 6) {
    issues.push(createIssue('warning', 'Solids Loading', 'High - thickening limited', solidLoading, 'kg/m²·h', 'Increase area or reduce MLSS', 5))
  }
  if (solidLoading > 8) {
    issues.push(createIssue('critical', 'Solids Loading', 'Very high - blanket rise expected', solidLoading, 'kg/m²·h', 'Significantly increase area', 5))
  }

  if (peakSolidsLoading > 10) {
    issues.push(createIssue('warning', 'Peak Solids Loading', 'May exceed during peaks', peakSolidsLoading, 'kg/m²·h', 'Design for peak conditions', 8))
  }

  if (weirLoading > 186) {
    issues.push(createIssue('warning', 'Weir Loading', 'High - may cause turbulence', weirLoading, 'm³/m·day', 'Extend weir length', 150))
  }

  if (safeSidewaterDepth < 3.5) {
    issues.push(createIssue('warning', 'Sidewater Depth', 'Shallow for secondary', safeSidewaterDepth, 'm', 'Typical: 3.5-6 m', 4.5))
  }

  // Secondary clarifier primarily removes TSS (biomass)
  // BOD/COD removal is minimal (already treated)
  const tssRemoval = 90
  const bodRemoval = 5 // Residual BOD with biomass
  const codRemoval = 5

  return {
    id: `secondary_clarifier_${Date.now()}`,
    type: 'secondary_clarifier',
    category: 'secondary',
    name: UNIT_METADATA.secondary_clarifier.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      shape,
      diameter: safeDiameter,
      length: safeLength,
      width: safeWidth,
      sidewaterDepth: safeSidewaterDepth,
      surfaceArea,
      volume,
      surfaceOverflowRate: sor,
      peakOverflowRate: peakSor,
      solidsLoadingRate: solidLoading,
      peakSolidsLoading,
      hrt,
      weirLoadingRate: weirLoading,
      rasConcentration,
      sludgeBlanketDepth: 0.5, // typical steady state
    },
  }
}

// ============================================
// CHLORINATION CALCULATIONS
// ============================================

export interface ChlorinationInput {
  inputQuality: WastewaterQuality
  chlorineType: 'gas' | 'hypochlorite' | 'chlorine_dioxide'
  contactTime: number      // minutes
  chlorineDose: number     // mg/L
  tankLength: number       // m
  tankWidth: number        // m
  tankDepth: number        // m
  baffleEfficiency: number // 0.3-0.7
}

export function calculateChlorination(input: ChlorinationInput): ChlorinationUnit {
  const { inputQuality, chlorineType, contactTime, chlorineDose, tankLength, tankWidth, tankDepth, baffleEfficiency } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const Q_m3min = Q / 1440 // m³/min

  const safeTankLength = normalizePositive(tankLength, 'Tank Length', 'm', issues)
  const safeTankWidth = normalizePositive(tankWidth, 'Tank Width', 'm', issues)
  const safeTankDepth = normalizePositive(tankDepth, 'Tank Depth', 'm', issues)
  const safeContactTime = normalizePositive(contactTime, 'Contact Time', 'minutes', issues)
  const safeChlorineDose = normalizeNonNegative(chlorineDose, 'Chlorine Dose', 'mg/L', issues)
  const safeBaffleEfficiency = normalizeFraction(baffleEfficiency, 'Baffle Efficiency', issues)

  const tankVolume = safeTankLength * safeTankWidth * safeTankDepth
  const actualHRT = tankVolume / Q_m3min // minutes
  const effectiveHRT = actualHRT * safeBaffleEfficiency // adjusted for short-circuiting

  // Chlorine demand (estimate based on water quality)
  const chlorineDemand = (inputQuality.bod * 0.05) + (inputQuality.tss * 0.02) // rough estimate

  // Residual
  const chlorineResidual = safeChlorineDose - chlorineDemand

  // CT value
  const ctValue = chlorineResidual * effectiveHRT // mg·min/L

  // Daily chlorine usage
  const dailyChlorineUsage = safeChlorineDose * Q / 1000 // kg/day

  // Log removal estimation based on CT
  // EPA guidance: Coliform 3-log at CT ~15, Virus 4-log at CT ~30 for free chlorine
  const logColiform = Math.min(6, ctValue / 5)
  const logVirus = Math.min(4, ctValue / 10)
  const logGiardia = Math.min(3, ctValue / 100) // Giardia more resistant

  // Validation
  if (effectiveHRT < 15) {
    issues.push(createIssue('critical', 'Contact Time', 'Too short for adequate disinfection', effectiveHRT, 'minutes', 'Increase volume or add baffles', 20))
  }
  if (effectiveHRT < 20) {
    issues.push(createIssue('warning', 'Contact Time', 'Short - monitor residual closely', effectiveHRT, 'minutes', 'Typical: 20-30 min', 25))
  }
  if (effectiveHRT < safeContactTime) {
    issues.push(createIssue('warning', 'Contact Time', 'Below target contact time', effectiveHRT, 'minutes', 'Increase volume or improve baffling', safeContactTime))
  }

  if (chlorineResidual < 0.5) {
    issues.push(createIssue('critical', 'Chlorine Residual', 'Too low - increase dose', chlorineResidual, 'mg/L', 'Maintain 0.5-2.0 mg/L', 1.0))
  }
  if (chlorineResidual > 2.0) {
    issues.push(createIssue('warning', 'Chlorine Residual', 'High - may need dechlorination', chlorineResidual, 'mg/L', 'Typical: 0.5-2.0 mg/L', 1.0))
  }

  if (ctValue < 15) {
    issues.push(createIssue('critical', 'CT Value', 'Below minimum for coliform', ctValue, 'mg·min/L', 'Increase dose or contact time', 30))
  }

  if (safeBaffleEfficiency < 0.3) {
    issues.push(createIssue('warning', 'Baffle Efficiency', 'Low - significant short-circuiting', safeBaffleEfficiency, '', 'Add baffles or improve design', 0.5))
  }

  return {
    id: `chlorination_${Date.now()}`,
    type: 'chlorination',
    category: 'tertiary',
    name: UNIT_METADATA.chlorination.name,
    enabled: true,
    inputQuality,
    outputQuality: { ...inputQuality }, // Disinfection doesn't change BOD/COD/TSS significantly
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: 0, cod: 0, tss: 0 },
    design: {
      chlorineType,
      contactTankVolume: tankVolume,
      contactTime: effectiveHRT,
      length: safeTankLength,
      width: safeTankWidth,
      depth: safeTankDepth,
      baffleEfficiency: safeBaffleEfficiency,
      chlorineDose: safeChlorineDose,
      chlorineResidual,
      chlorineDemand,
      dailyChlorineUsage,
      ctValue,
      logRemoval: {
        coliform: logColiform,
        virus: logVirus,
        giardia: logGiardia,
      },
    },
  }
}

// ============================================
// ADDITIONAL UNIT CALCULATIONS
// ============================================

// Oil Separator
export interface OilSeparatorInput {
  inputQuality: WastewaterQuality
  separatorType: 'api' | 'cpi' | 'daf_pretreat'
  length: number
  width: number
  depth: number
}

export function calculateOilSeparator(input: OilSeparatorInput): OilSeparatorUnit {
  const { inputQuality, separatorType, length, width, depth } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeLength = normalizePositive(length, 'Length', 'm', issues)
  const safeWidth = normalizePositive(width, 'Width', 'm', issues)
  const safeDepth = normalizePositive(depth, 'Depth', 'm', issues)
  const volume = safeLength * safeWidth * safeDepth
  const hrt = volume / Q * 24 * 60 // minutes
  const surfaceArea = safeLength * safeWidth
  const surfaceLoadingRate = Q / surfaceArea / 24 // m³/m²·h

  if (hrt < 15) {
    issues.push(createIssue('critical', 'HRT', 'Too short for oil separation', hrt, 'minutes', 'Increase volume', 20))
  }
  if (surfaceLoadingRate > 5) {
    issues.push(createIssue('warning', 'Surface Loading', 'High - reduced oil removal', surfaceLoadingRate, 'm³/m²·h', 'Increase surface area', 3))
  }

  const oilRemoval = hrt >= 20 && surfaceLoadingRate <= 3 ? 80 : 60
  const bodRemoval = oilRemoval * 0.2
  const tssRemoval = oilRemoval * 0.3

  return {
    id: `oil_separator_${Date.now()}`,
    type: 'oil_separator',
    category: 'primary',
    name: UNIT_METADATA.oil_separator.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, bodRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: bodRemoval, tss: tssRemoval },
    design: {
      separatorType,
      length: safeLength,
      width: safeWidth,
      depth: safeDepth,
      volume,
      hrt,
      surfaceLoadingRate,
      oilRemoval,
      skimmerType: 'belt',
    },
  }
}

// UASB
export interface UASBInput {
  inputQuality: WastewaterQuality
  volume: number
  height: number
  operatingTemp: number
}

export function calculateUASB(input: UASBInput): UASBUnit {
  const { inputQuality, volume, height, operatingTemp } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeVolume = normalizePositive(volume, 'Volume', 'm³', issues)
  const safeHeight = normalizePositive(height, 'Height', 'm', issues)
  const safeOperatingTemp = normalizeNonNegative(operatingTemp, 'Operating Temperature', '°C', issues)
  const CODin = inputQuality.cod

  const hrt = safeVolume / Q * 24 // hours
  const area = safeVolume / safeHeight
  const upflowVelocity = Q / area / 24 // m/h
  const volumetricLoading = CODin * Q / 1000 / safeVolume // kg COD/m³·d

  if (hrt < 4) {
    issues.push(createIssue('critical', 'HRT', 'Too short for UASB', hrt, 'hours', 'Increase volume', 8))
  }
  if (upflowVelocity > 1.5) {
    issues.push(createIssue('critical', 'Upflow Velocity', 'Too high - sludge washout', upflowVelocity, 'm/h', 'Increase cross-sectional area', 1.0))
  }
  if (volumetricLoading > 15) {
    issues.push(createIssue('warning', 'Volumetric Loading', 'High - may overload', volumetricLoading, 'kg COD/m³·d', 'Typical: 2-15', 10))
  }
  if (safeOperatingTemp < 25) {
    issues.push(createIssue('warning', 'Temperature', 'Low - reduced methane production', safeOperatingTemp, '°C', 'Optimal: 30-38°C', 35))
  }

  const codRemoval = hrt >= 6 && volumetricLoading <= 10 ? 80 : 65
  const bodRemoval = codRemoval
  const tssRemoval = codRemoval * 0.8

  // Biogas
  const codRemoved = CODin * (codRemoval / 100) * Q / 1000 // kg/day
  const methaneYield = 0.35 // m³ CH4/kg COD removed
  const biogasProduction = codRemoved * methaneYield / 0.65 // assuming 65% CH4

  return {
    id: `uasb_${Date.now()}`,
    type: 'uasb',
    category: 'biological',
    name: UNIT_METADATA.uasb.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      numberOfReactors: 1,
      height: safeHeight,
      volume: safeVolume,
      hrt,
      volumetricLoading,
      upflowVelocity,
      sludgeLoading: volumetricLoading * 0.3,
      methaneYield,
      biogasProduction,
      methaneContent: 65,
      codRemoval,
      operatingTemp: safeOperatingTemp,
    },
  }
}

// SBR
export interface SBRInput {
  inputQuality: WastewaterQuality
  volumePerReactor: number
  numberOfReactors: number
  cycleTime: number // hours
  mlss: number
}

export function calculateSBR(input: SBRInput): SBRUnit {
  const { inputQuality, volumePerReactor, numberOfReactors, cycleTime, mlss } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeVolumePerReactor = normalizePositive(volumePerReactor, 'Volume per Reactor', 'm³', issues)
  const safeNumberOfReactors = Math.max(1, Math.round(normalizePositive(numberOfReactors, 'Number of Reactors', '', issues, 1)))
  const safeCycleTime = normalizePositive(cycleTime, 'Cycle Time', 'hours', issues, 1)
  const safeMlss = normalizePositive(mlss, 'MLSS', 'mg/L', issues)
  const totalVolume = safeVolumePerReactor * safeNumberOfReactors
  const cyclesPerDay = 24 / safeCycleTime

  // Typical cycle breakdown
  const fillTime = safeCycleTime * 0.25
  const reactTime = safeCycleTime * 0.35
  const settleTime = safeCycleTime * 0.25
  const decantTime = safeCycleTime * 0.10
  const idleTime = safeCycleTime * 0.05

  const decantRatio = 0.3 // typical 25-50%
  const effectiveVolume = safeVolumePerReactor * decantRatio
  const dailyCapacity = effectiveVolume * cyclesPerDay * safeNumberOfReactors

  const hrt = totalVolume / Q * 24
  const srt = 15 // typical
  const mlvss = safeMlss * 0.75
  const fmRatio = (inputQuality.bod * Q / 1000) / (mlvss * totalVolume / 1000)
  const volumetricLoading = inputQuality.bod * Q / 1000 / totalVolume

  if (dailyCapacity < Q) {
    issues.push(createIssue('critical', 'Capacity', 'Insufficient treatment capacity', dailyCapacity, 'm³/day', 'Add reactors or increase cycle frequency', Q))
  }
  if (settleTime * 60 < 45) {
    issues.push(createIssue('warning', 'Settle Time', 'Short settling period', settleTime * 60, 'minutes', 'Typical: 45-90 min', 60))
  }
  if (fmRatio > 0.3) {
    issues.push(createIssue('warning', 'F/M Ratio', 'High for SBR', fmRatio, 'kg BOD/kg MLVSS·d', 'Increase MLSS or volume', 0.15))
  }

  const bodRemoval = 92
  const codRemoval = 88
  const tssRemoval = 94

  return {
    id: `sbr_${Date.now()}`,
    type: 'sbr',
    category: 'biological',
    name: UNIT_METADATA.sbr.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      numberOfReactors: safeNumberOfReactors,
      volumePerReactor: safeVolumePerReactor,
      totalVolume,
      depth: 5,
      fillTime,
      reactTime,
      settleTime,
      decantTime,
      idleTime,
      totalCycleTime: safeCycleTime,
      cyclesPerDay,
      hrt,
      srt,
      mlss: safeMlss,
      fmRatio,
      volumetricLoading,
      decantRatio,
      aerationType: 'fine_bubble',
      airFlowRate: totalVolume * 0.02, // rough estimate
      targetDO: 2.0,
    },
  }
}

// Oxidation Pond
export interface OxidationPondInput {
  inputQuality: WastewaterQuality
  pondType: 'facultative' | 'aerobic' | 'anaerobic' | 'maturation'
  surfaceArea: number // m²
  depth: number // m
}

export function calculateOxidationPond(input: OxidationPondInput): OxidationPondUnit {
  const { inputQuality, pondType, surfaceArea, depth } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeSurfaceArea = normalizePositive(surfaceArea, 'Surface Area', 'm²', issues)
  const safeDepth = normalizePositive(depth, 'Depth', 'm', issues)
  const volume = safeSurfaceArea * safeDepth
  const hrt = volume / Q // days
  const organicLoading = inputQuality.bod * Q / 1000 / (safeSurfaceArea / 10000) // kg BOD/ha·d

  const typicalDepth: Record<typeof pondType, [number, number]> = {
    facultative: [1.0, 2.5],
    aerobic: [0.2, 0.5],
    anaerobic: [2.5, 5.0],
    maturation: [1.0, 1.5],
  }

  const typicalLoading: Record<typeof pondType, [number, number]> = {
    facultative: [100, 400],
    aerobic: [200, 600],
    anaerobic: [100, 400], // kg COD/ha·d typically
    maturation: [50, 150],
  }

  const [depthMin, depthMax] = typicalDepth[pondType]
  const [loadMin, loadMax] = typicalLoading[pondType]

  if (safeDepth < depthMin || safeDepth > depthMax) {
    issues.push(createIssue('warning', 'Depth', `Outside typical range for ${pondType}`, safeDepth, 'm', `Typical: ${depthMin}-${depthMax} m`, (depthMin + depthMax) / 2))
  }
  if (organicLoading > loadMax) {
    issues.push(createIssue('warning', 'Organic Loading', 'High - may cause odors', organicLoading, 'kg BOD/ha·d', `Typical: ${loadMin}-${loadMax}`, (loadMin + loadMax) / 2))
  }
  if (hrt < 5) {
    issues.push(createIssue('critical', 'HRT', 'Too short for pond system', hrt, 'days', 'Increase pond volume', 15))
  }

  let bodRemoval = 75
  let codRemoval = 65
  let tssRemoval = 70

  if (pondType === 'facultative' && hrt >= 15) {
    bodRemoval = 85
    codRemoval = 75
    tssRemoval = 80
  }
  if (pondType === 'maturation') {
    bodRemoval = 50
    codRemoval = 40
    tssRemoval = 60
  }

  const landArea = safeSurfaceArea / 10000 * 1.3 // ha with 30% buffer

  return {
    id: `oxidation_pond_${Date.now()}`,
    type: 'oxidation_pond',
    category: 'biological',
    name: UNIT_METADATA.oxidation_pond.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      pondType,
      numberOfPonds: 1,
      length: Math.sqrt(safeSurfaceArea * 2),
      width: Math.sqrt(safeSurfaceArea / 2),
      depth: safeDepth,
      surfaceArea: safeSurfaceArea,
      totalArea: safeSurfaceArea,
      volume,
      hrt,
      organicLoading,
      surfaceLoading: Q / safeSurfaceArea * 10000,
      evaporationLoss: 5,
      landArea,
    },
  }
}

// Trickling Filter
export interface TricklingFilterInput {
  inputQuality: WastewaterQuality
  filterType: 'low_rate' | 'high_rate' | 'super_rate' | 'roughing'
  diameter: number        // m
  depth: number           // m
  mediaType: 'rock' | 'plastic' | 'random_plastic'
  recirculationRatio: number // R/Q
}

export function calculateTricklingFilter(input: TricklingFilterInput): TricklingFilterUnit {
  const { inputQuality, filterType, diameter, depth, mediaType, recirculationRatio } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeDiameter = normalizePositive(diameter, 'Diameter', 'm', issues)
  const safeDepth = normalizePositive(depth, 'Depth', 'm', issues)
  const safeRecirculationRatio = normalizeNonNegative(recirculationRatio, 'Recirculation Ratio', '', issues)
  const BODin = inputQuality.bod

  const surfaceArea = Math.PI * Math.pow(safeDiameter / 2, 2)
  const volume = surfaceArea * safeDepth
  const totalFlow = Q * (1 + safeRecirculationRatio)

  // Hydraulic loading
  const hydraulicLoading = totalFlow / surfaceArea // m³/m²·day

  // Organic loading
  const organicLoading = BODin * Q / 1000 / volume // kg BOD/m³·day

  // Media specific area
  const mediaSpecificArea = mediaType === 'rock' ? 50 : mediaType === 'plastic' ? 100 : 150 // m²/m³

  // Design criteria by filter type
  const typicalHydraulic: Record<typeof filterType, [number, number]> = {
    low_rate: [1, 4],
    high_rate: [10, 40],
    super_rate: [40, 200],
    roughing: [40, 200],
  }

  const typicalOrganic: Record<typeof filterType, [number, number]> = {
    low_rate: [0.08, 0.4],
    high_rate: [0.4, 1.6],
    super_rate: [0.8, 4.8],
    roughing: [0.8, 6.0],
  }

  const [hydMin, hydMax] = typicalHydraulic[filterType]
  const [orgMin, orgMax] = typicalOrganic[filterType]

  if (hydraulicLoading < hydMin || hydraulicLoading > hydMax) {
    issues.push(createIssue('warning', 'Hydraulic Loading', `Outside typical range for ${filterType}`, hydraulicLoading, 'm³/m²·d', `Typical: ${hydMin}-${hydMax}`, (hydMin + hydMax) / 2))
  }

  if (organicLoading > orgMax) {
    issues.push(createIssue('warning', 'Organic Loading', 'High - may cause ponding', organicLoading, 'kg BOD/m³·d', `Typical: ${orgMin}-${orgMax}`, (orgMin + orgMax) / 2))
  }

  // Typical depth validation
  if (mediaType === 'rock' && depth > 3) {
    issues.push(createIssue('warning', 'Depth', 'Deep for rock media', depth, 'm', 'Typical: 1-3 m for rock', 2))
  }
  if (mediaType !== 'rock' && depth < 4) {
    issues.push(createIssue('info', 'Depth', 'Shallow for plastic media', depth, 'm', 'Plastic can go 4-12 m', 6))
  }

  // BOD removal using NRC equation (simplified)
  // E = 100 / (1 + 0.443 * sqrt(W / V*F))
  // W = BOD load, V = volume, F = recirculation factor
  const recircFactor = (1 + safeRecirculationRatio) / Math.pow(1 + 0.1 * safeRecirculationRatio, 2)
  const bodRemovalFactor = 100 / (1 + 0.443 * Math.sqrt(BODin * Q / 1000 / (volume * recircFactor)))
  const bodRemoval = Math.min(85, Math.max(50, bodRemovalFactor))
  const codRemoval = bodRemoval * 0.9
  const tssRemoval = bodRemoval * 0.95

  return {
    id: `trickling_filter_${Date.now()}`,
    type: 'trickling_filter',
    category: 'biological',
    name: UNIT_METADATA.trickling_filter.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      filterType,
      numberOfFilters: 1,
      diameter: safeDiameter,
      depth: safeDepth,
      surfaceArea,
      volume,
      mediaType,
      mediaSpecificArea,
      hydraulicLoading,
      organicLoading,
      recirculationRatio: safeRecirculationRatio,
      totalFlow,
      bodRemovalFactor,
    },
  }
}

// MBR (Membrane Bioreactor)
export interface MBRInput {
  inputQuality: WastewaterQuality
  membraneType: 'hollow_fiber' | 'flat_sheet'
  configuration: 'submerged' | 'external'
  tankVolume: number      // m³
  membraneArea: number    // m² total
  mlss: number            // mg/L
  srt: number             // days
  flux: number            // LMH (L/m²·h)
}

export function calculateMBR(input: MBRInput): MBRUnit {
  const { inputQuality, membraneType, configuration, tankVolume, membraneArea, mlss, srt, flux } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeTankVolume = normalizePositive(tankVolume, 'Tank Volume', 'm³', issues)
  const safeMembraneArea = normalizePositive(membraneArea, 'Membrane Area', 'm²', issues)
  const safeMlss = normalizePositive(mlss, 'MLSS', 'mg/L', issues)
  const safeSrt = normalizePositive(srt, 'SRT', 'days', issues)
  const safeFlux = normalizePositive(flux, 'Flux', 'LMH', issues)
  const BODin = inputQuality.bod

  // Calculate HRT
  const hrt = safeTankVolume / Q * 24 // hours

  // MLVSS (assume 80% of MLSS for MBR)
  const mlvss = safeMlss * 0.8

  // F/M Ratio
  const massFood = BODin * Q / 1000 // kg BOD/day
  const massMicroorganisms = mlvss * safeTankVolume / 1000 // kg MLVSS
  const fmRatio = massFood / massMicroorganisms

  // Check membrane capacity
  const membraneCapacity = safeMembraneArea * safeFlux * 24 / 1000 // m³/day
  const capacityRatio = Q / membraneCapacity

  // Trans-membrane pressure (estimate)
  const tmp = safeFlux / 20 * 10 // rough estimate, kPa

  // Permeability
  const permeability = safeFlux / (tmp / 100) // LMH/bar

  // Aeration requirements (MBR needs more)
  const processAeration = safeTankVolume * 0.02 // m³/min
  const membraneAeration = safeMembraneArea * 0.01 // m³/min for scouring
  const totalAirFlow = processAeration + membraneAeration
  const aeratorPower = totalAirFlow * 0.5 // rough kW estimate

  // Number of modules
  const moduleArea = membraneType === 'hollow_fiber' ? 35 : 15 // m² per module typical
  const numberOfModules = Math.ceil(safeMembraneArea / moduleArea)

  // Validation
  if (safeMlss < 8000) {
    issues.push(createIssue('warning', 'MLSS', 'Low for MBR', safeMlss, 'mg/L', 'Typical: 8000-15000 mg/L', 10000))
  }
  if (safeMlss > 15000) {
    issues.push(createIssue('warning', 'MLSS', 'High - may reduce flux', safeMlss, 'mg/L', 'Typical: 8000-15000 mg/L', 10000))
  }

  if (safeFlux > 30) {
    issues.push(createIssue('warning', 'Flux', 'High - membrane fouling risk', safeFlux, 'LMH', 'Typical: 10-30 LMH', 20))
  }
  if (safeFlux < 10) {
    issues.push(createIssue('info', 'Flux', 'Conservative - oversized membrane', safeFlux, 'LMH', 'Typical: 10-30 LMH', 20))
  }

  if (capacityRatio > 0.9) {
    issues.push(createIssue('critical', 'Membrane Capacity', 'Insufficient membrane area', capacityRatio * 100, '%', 'Add more membrane area', 75))
  }
  if (capacityRatio > 0.75) {
    issues.push(createIssue('warning', 'Membrane Capacity', 'High utilization', capacityRatio * 100, '%', 'Consider more membrane area', 75))
  }

  if (safeSrt < 15) {
    issues.push(createIssue('warning', 'SRT', 'Short for MBR', safeSrt, 'days', 'Typical: 15-50 days', 25))
  }

  if (hrt < 4) {
    issues.push(createIssue('warning', 'HRT', 'Short for MBR', hrt, 'hours', 'Typical: 4-8 hours', 6))
  }

  if (fmRatio > 0.2) {
    issues.push(createIssue('warning', 'F/M Ratio', 'High for MBR', fmRatio, 'kg BOD/kg MLVSS·d', 'Typical: 0.05-0.2', 0.1))
  }

  // MBR achieves very high removal
  const bodRemoval = 97
  const codRemoval = 95
  const tssRemoval = 99.5 // Near complete due to membrane

  return {
    id: `mbr_${Date.now()}`,
    type: 'mbr',
    category: 'biological',
    name: UNIT_METADATA.mbr.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      membraneType,
      configuration,
      numberOfModules,
      membraneArea: safeMembraneArea,
      tankVolume: safeTankVolume,
      tankDepth: 4.5, // typical
      mlss: safeMlss,
      mlvss,
      srt: safeSrt,
      hrt,
      fmRatio,
      flux: safeFlux,
      tmp,
      permeability,
      membraneAeration,
      processAeration,
      totalAirFlow,
      aeratorPower,
      backwashInterval: 10, // minutes
      chemicalCleaningInterval: 180, // days
    },
  }
}

// DAF
export interface DAFInput {
  inputQuality: WastewaterQuality
  length: number
  width: number
  depth: number
  recycleRatio: number // %
}

export function calculateDAF(input: DAFInput): DAFUnit {
  const { inputQuality, length, width, depth, recycleRatio } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeLength = normalizePositive(length, 'Length', 'm', issues)
  const safeWidth = normalizePositive(width, 'Width', 'm', issues)
  const safeDepth = normalizePositive(depth, 'Depth', 'm', issues)
  const safeRecycleRatio = normalizeNonNegative(recycleRatio, 'Recycle Ratio', '%', issues)
  const surfaceArea = safeLength * safeWidth
  const volume = surfaceArea * safeDepth

  const surfaceLoadingRate = Q / surfaceArea / 24 // m³/m²·h
  const hrt = volume / Q * 24 * 60 // minutes
  const solidsLoadingRate = inputQuality.tss * Q / 1000 / surfaceArea / 24 // kg/m²·h

  if (surfaceLoadingRate > 15) {
    issues.push(createIssue('warning', 'Surface Loading', 'High for DAF', surfaceLoadingRate, 'm³/m²·h', 'Typical: 5-15', 10))
  }
  if (hrt < 20) {
    issues.push(createIssue('warning', 'HRT', 'Short residence time', hrt, 'minutes', 'Typical: 20-40 min', 30))
  }
  if (safeRecycleRatio < 5) {
    issues.push(createIssue('warning', 'Recycle Ratio', 'Low - insufficient air', safeRecycleRatio, '%', 'Typical: 5-15%', 10))
  }

  const tssRemoval = 85
  const bodRemoval = 35
  const codRemoval = 30

  return {
    id: `daf_${Date.now()}`,
    type: 'daf',
    category: 'secondary',
    name: UNIT_METADATA.daf.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      length: safeLength,
      width: safeWidth,
      depth: safeDepth,
      surfaceArea,
      volume,
      surfaceLoadingRate,
      solidsLoadingRate,
      hrt,
      recycleRatio: safeRecycleRatio,
      pressureVessel: 5,
      airToSolidsRatio: 0.02,
      saturatorEfficiency: 80,
    },
  }
}

// Filtration
export interface FiltrationInput {
  inputQuality: WastewaterQuality
  filterType: 'rapid_sand' | 'pressure' | 'multimedia' | 'membrane'
  totalArea: number // m²
  mediaDepth: number // m
}

export function calculateFiltration(input: FiltrationInput): FiltrationUnit {
  const { inputQuality, filterType, totalArea, mediaDepth } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const safeTotalArea = normalizePositive(totalArea, 'Total Area', 'm²', issues)
  const safeMediaDepth = normalizePositive(mediaDepth, 'Media Depth', 'm', issues)
  const filtrationRate = Q / safeTotalArea / 24 // m³/m²·h

  const typicalRates: Record<typeof filterType, [number, number]> = {
    rapid_sand: [5, 15],
    pressure: [5, 20],
    multimedia: [10, 25],
    membrane: [20, 50], // for MF/UF
  }

  const [rateMin, rateMax] = typicalRates[filterType]

  if (filtrationRate > rateMax) {
    issues.push(createIssue('warning', 'Filtration Rate', 'High - reduced performance', filtrationRate, 'm³/m²·h', `Typical: ${rateMin}-${rateMax}`, (rateMin + rateMax) / 2))
  }
  if (safeMediaDepth < 0.5 && filterType !== 'membrane') {
    issues.push(createIssue('warning', 'Media Depth', 'Shallow - short filter runs', safeMediaDepth, 'm', 'Typical: 0.6-1.0 m', 0.8))
  }

  const tssRemoval = filterType === 'membrane' ? 99 : 70
  const bodRemoval = filterType === 'membrane' ? 50 : 30
  const codRemoval = filterType === 'membrane' ? 40 : 25

  return {
    id: `filtration_${Date.now()}`,
    type: 'filtration',
    category: 'tertiary',
    name: UNIT_METADATA.filtration.name,
    enabled: true,
    inputQuality,
    outputQuality: applyRemoval(inputQuality, bodRemoval, codRemoval, tssRemoval),
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: bodRemoval, cod: codRemoval, tss: tssRemoval },
    design: {
      filterType,
      numberOfFilters: Math.ceil(safeTotalArea / 50),
      surfaceAreaPerFilter: Math.min(50, safeTotalArea),
      totalArea: safeTotalArea,
      mediaDepth: safeMediaDepth,
      mediaType: filterType === 'multimedia' ? 'dual_media' : 'sand',
      effectiveSize: 0.5,
      uniformityCoefficient: 1.4,
      filtrationRate,
      backwashRate: 40,
      backwashDuration: 10,
      runLength: 24,
      cleanHeadLoss: 0.3,
      terminalHeadLoss: 2.5,
    },
  }
}

// UV Disinfection
export interface UVDisinfectionInput {
  inputQuality: WastewaterQuality
  uvDose: number // mJ/cm²
  uvTransmittance: number // %
  channelLength: number // m
  channelWidth: number // m
  channelDepth: number // m
}

export function calculateUVDisinfection(input: UVDisinfectionInput): UVDisinfectionUnit {
  const { inputQuality, uvDose, uvTransmittance, channelLength, channelWidth, channelDepth } = input
  const issues: DesignIssue[] = []

  const Q = normalizePositive(inputQuality.flowRate, 'Flow Rate', 'm³/day', issues, 1)
  const Q_m3s = Q / 86400
  const safeChannelLength = normalizePositive(channelLength, 'Channel Length', 'm', issues)
  const safeChannelWidth = normalizePositive(channelWidth, 'Channel Width', 'm', issues)
  const safeChannelDepth = normalizePositive(channelDepth, 'Channel Depth', 'm', issues)
  const safeUvDose = normalizeNonNegative(uvDose, 'UV Dose', 'mJ/cm²', issues)
  const safeUvTransmittance = normalizeNonNegative(uvTransmittance, 'UV Transmittance', '%', issues)
  const volume = safeChannelLength * safeChannelWidth * safeChannelDepth
  const contactTime = volume / Q_m3s // seconds

  // Estimate lamp requirements
  const lampsPerBank = Math.ceil(safeChannelWidth / 0.15) // ~15cm spacing
  const numberOfBanks = Math.ceil(safeUvDose / 20) // rough estimate
  const totalLamps = lampsPerBank * numberOfBanks
  const lampPower = 150 // W typical
  const totalPower = totalLamps * lampPower / 1000 // kW

  if (safeUvDose < 40) {
    issues.push(createIssue('warning', 'UV Dose', 'Low - may not achieve disinfection', safeUvDose, 'mJ/cm²', 'Minimum 40 mJ/cm²', 50))
  }
  if (safeUvTransmittance < 55) {
    issues.push(createIssue('critical', 'UV Transmittance', 'Low - need pretreatment', safeUvTransmittance, '%', 'Minimum 55%, prefer >65%', 65))
  }
  if (contactTime < 5) {
    issues.push(createIssue('warning', 'Contact Time', 'Short exposure', contactTime, 'seconds', 'Increase channel length', 10))
  }

  // Log removal based on dose
  const logColiform = Math.min(6, safeUvDose / 10)
  const logEcoli = Math.min(6, safeUvDose / 8)
  const logVirus = Math.min(4, safeUvDose / 30)

  return {
    id: `uv_disinfection_${Date.now()}`,
    type: 'uv_disinfection',
    category: 'tertiary',
    name: UNIT_METADATA.uv_disinfection.name,
    enabled: true,
    inputQuality,
    outputQuality: { ...inputQuality },
    status: determineStatus(issues),
    issues,
    removalEfficiency: { bod: 0, cod: 0, tss: 0 },
    design: {
      reactorType: 'open_channel',
      numberOfBanks,
      lampsPerBank,
      totalLamps,
      uvDose: safeUvDose,
      uvTransmittance: safeUvTransmittance,
      lampPower,
      totalPower,
      channelLength: safeChannelLength,
      channelWidth: safeChannelWidth,
      channelDepth: safeChannelDepth,
      contactTime,
      logRemoval: {
        coliform: logColiform,
        ecoli: logEcoli,
        virus: logVirus,
      },
      lampLife: 12000,
      sleeveCleaning: 'automatic',
    },
  }
}

// ============================================
// TREATMENT TRAIN CALCULATIONS
// ============================================

/**
 * Calculate an entire treatment train
 */
export function calculateTreatmentTrain(
  influent: WastewaterQuality,
  unitConfigs: Array<{
    type: UnitType
    config: Record<string, unknown>
  }>,
  targetStandard: ThaiEffluentType
): TreatmentSystem {
  const units: TreatmentUnit[] = []
  const systemIssues: DesignIssue[] = []
  const safeInfluent: WastewaterQuality = {
    ...influent,
    flowRate: normalizePositive(influent.flowRate, 'Influent Flow Rate', 'm³/day', systemIssues, 1),
    bod: normalizeNonNegative(influent.bod, 'Influent BOD', 'mg/L', systemIssues),
    cod: normalizeNonNegative(influent.cod, 'Influent COD', 'mg/L', systemIssues),
    tss: normalizeNonNegative(influent.tss, 'Influent TSS', 'mg/L', systemIssues),
    tkn: influent.tkn !== undefined ? normalizeNonNegative(influent.tkn, 'Influent TKN', 'mg/L', systemIssues) : undefined,
    ammonia: influent.ammonia !== undefined ? normalizeNonNegative(influent.ammonia, 'Influent Ammonia', 'mg/L', systemIssues) : undefined,
    totalP: influent.totalP !== undefined ? normalizeNonNegative(influent.totalP, 'Influent Total P', 'mg/L', systemIssues) : undefined,
    oilGrease: influent.oilGrease !== undefined ? normalizeNonNegative(influent.oilGrease, 'Influent Oil & Grease', 'mg/L', systemIssues) : undefined,
  }
  let currentQuality = { ...safeInfluent }

  // Calculate each unit sequentially
  for (const unitConfig of unitConfigs) {
    const { type, config } = unitConfig
    let unit: TreatmentUnit

    switch (type) {
      case 'bar_screen':
        unit = calculateBarScreen({ ...(config as UnitInputConfig<BarScreenInput>), inputQuality: currentQuality })
        break
      case 'grit_chamber':
        unit = calculateGritChamber({ ...(config as UnitInputConfig<GritChamberInput>), inputQuality: currentQuality })
        break
      case 'primary_clarifier':
        unit = calculatePrimaryClarifier({ ...(config as UnitInputConfig<PrimaryClarifierInput>), inputQuality: currentQuality })
        break
      case 'oil_separator':
        unit = calculateOilSeparator({ ...(config as UnitInputConfig<OilSeparatorInput>), inputQuality: currentQuality })
        break
      case 'aeration_tank':
        unit = calculateAerationTank({ ...(config as UnitInputConfig<AerationTankInput>), inputQuality: currentQuality })
        break
      case 'sbr':
        unit = calculateSBR({ ...(config as UnitInputConfig<SBRInput>), inputQuality: currentQuality })
        break
      case 'uasb':
        unit = calculateUASB({ ...(config as UnitInputConfig<UASBInput>), inputQuality: currentQuality })
        break
      case 'oxidation_pond':
        unit = calculateOxidationPond({ ...(config as UnitInputConfig<OxidationPondInput>), inputQuality: currentQuality })
        break
      case 'trickling_filter':
        unit = calculateTricklingFilter({ ...(config as UnitInputConfig<TricklingFilterInput>), inputQuality: currentQuality })
        break
      case 'mbr':
        unit = calculateMBR({ ...(config as UnitInputConfig<MBRInput>), inputQuality: currentQuality })
        break
      case 'secondary_clarifier':
        unit = calculateSecondaryClarifier({ ...(config as UnitInputConfig<SecondaryClarifierInput>), inputQuality: currentQuality })
        break
      case 'daf':
        unit = calculateDAF({ ...(config as UnitInputConfig<DAFInput>), inputQuality: currentQuality })
        break
      case 'filtration':
        unit = calculateFiltration({ ...(config as UnitInputConfig<FiltrationInput>), inputQuality: currentQuality })
        break
      case 'chlorination':
        unit = calculateChlorination({ ...(config as UnitInputConfig<ChlorinationInput>), inputQuality: currentQuality })
        break
      case 'uv_disinfection':
        unit = calculateUVDisinfection({ ...(config as UnitInputConfig<UVDisinfectionInput>), inputQuality: currentQuality })
        break
      default:
        continue
    }

    units.push(unit)
    currentQuality = unit.outputQuality
  }

  // Check compliance with target standard
  const standard = THAI_EFFLUENT_STANDARDS[targetStandard]
  const compliance = {
    isCompliant: true,
    parameters: [
      {
        name: 'BOD',
        value: currentQuality.bod,
        limit: standard.limits.bod,
        unit: 'mg/L',
        status: currentQuality.bod <= standard.limits.bod ? 'pass' as const : 'fail' as const,
      },
      {
        name: 'COD',
        value: currentQuality.cod,
        limit: standard.limits.cod,
        unit: 'mg/L',
        status: currentQuality.cod <= standard.limits.cod ? 'pass' as const : 'fail' as const,
      },
      {
        name: 'TSS',
        value: currentQuality.tss,
        limit: standard.limits.tss,
        unit: 'mg/L',
        status: currentQuality.tss <= standard.limits.tss ? 'pass' as const : 'fail' as const,
      },
      {
        name: 'pH',
        value: typeof currentQuality.ph === 'number' && Number.isFinite(currentQuality.ph) ? currentQuality.ph : null,
        limit: `${standard.limits.ph[0]}-${standard.limits.ph[1]}`,
        unit: '',
        status: typeof currentQuality.ph === 'number' && Number.isFinite(currentQuality.ph)
          ? currentQuality.ph >= standard.limits.ph[0] && currentQuality.ph <= standard.limits.ph[1]
            ? 'pass' as const
            : 'fail' as const
          : 'unknown' as const,
      },
      {
        name: 'Temperature',
        value: typeof currentQuality.temperature === 'number' && Number.isFinite(currentQuality.temperature) ? currentQuality.temperature : null,
        limit: standard.limits.temperature,
        unit: '°C',
        status: typeof currentQuality.temperature === 'number' && Number.isFinite(currentQuality.temperature)
          ? currentQuality.temperature <= standard.limits.temperature
            ? 'pass' as const
            : 'fail' as const
          : 'unknown' as const,
      },
    ],
  }

  if (standard.limits.oilGrease !== undefined) {
    const oilValue = currentQuality.oilGrease
    compliance.parameters.push({
      name: 'Oil & Grease',
      value: typeof oilValue === 'number' && Number.isFinite(oilValue) ? oilValue : null,
      limit: standard.limits.oilGrease,
      unit: 'mg/L',
      status: typeof oilValue === 'number' && Number.isFinite(oilValue)
        ? oilValue <= standard.limits.oilGrease
          ? 'pass' as const
          : 'fail' as const
        : 'unknown' as const,
    })
  }

  compliance.isCompliant = compliance.parameters.every(p => p.status === 'pass')

  // Calculate overall status
  const allIssues = [...systemIssues, ...units.flatMap(u => u.issues)]
  const overallStatus: UnitStatus = units.some(u => u.status === 'fail')
    ? 'fail'
    : units.some(u => u.status === 'warning')
    ? 'warning'
    : 'pass'

  // Calculate summary
  const totalBODRemoval = calculateRemovalPercent(safeInfluent.bod, currentQuality.bod)
  const totalCODRemoval = calculateRemovalPercent(safeInfluent.cod, currentQuality.cod)
  const totalTSSRemoval = calculateRemovalPercent(safeInfluent.tss, currentQuality.tss)

  return {
    id: `system_${Date.now()}`,
    name: 'Treatment System',
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    influent: {
      name: 'Influent',
      source: 'custom',
      quality: safeInfluent,
    },
    units,
    targetStandard,
    effluentQuality: currentQuality,
    overallStatus,
    systemIssues: allIssues,
    compliance,
    summary: {
      totalBODRemoval,
      totalCODRemoval,
      totalTSSRemoval,
      totalLandArea: 0, // Calculate from units
      totalPower: 0, // Calculate from units
    },
  }
}

/**
 * Get default design parameters for a unit type
 */
export function getDefaultDesignParams(type: UnitType, flowRate: number): Record<string, unknown> {
  const Q = flowRate

  switch (type) {
    case 'bar_screen':
      return {
        barSpacing: 25,
        channelWidth: Math.max(0.5, Math.sqrt(Q / 86400 / 0.45)),
        channelDepth: 1.0,
        screenAngle: 75,
        barWidth: 10,
        cleaningType: Q > 500 ? 'mechanical' : 'manual',
      }
    case 'grit_chamber':
      return {
        chamberType: 'horizontal_flow',
        length: Math.max(3, Q / 86400 * 60 / 0.3 / 1.0), // 60s HRT, 0.3m/s, 1m depth
        width: 1.0,
        depth: 1.0,
      }
    case 'primary_clarifier':
      return {
        shape: Q > 2000 ? 'circular' : 'rectangular',
        diameter: Q > 2000 ? Math.sqrt(Q / 36 / Math.PI) * 2 : undefined, // SOR = 36
        length: Q <= 2000 ? Math.sqrt(Q / 36 * 2) : undefined,
        width: Q <= 2000 ? Math.sqrt(Q / 36 / 2) : undefined,
        sidewaterDepth: 3.5,
      }
    case 'aeration_tank':
      return {
        processType: 'conventional',
        volume: Q * 6 / 24, // 6h HRT
        mlss: 3000,
        srt: 10,
        targetDO: 2.0,
        aerationType: 'fine_bubble',
        returnRatio: 0.5,
      }
    case 'secondary_clarifier':
      return {
        shape: Q > 2000 ? 'circular' : 'rectangular',
        diameter: Q > 2000 ? Math.sqrt(Q / 24 / Math.PI) * 2 : undefined, // SOR = 24
        length: Q <= 2000 ? Math.sqrt(Q / 24 * 2) : undefined,
        width: Q <= 2000 ? Math.sqrt(Q / 24 / 2) : undefined,
        sidewaterDepth: 4.0,
        mlss: 3000,
        returnRatio: 0.5,
      }
    case 'chlorination':
      return {
        chlorineType: 'hypochlorite',
        contactTime: 30,
        chlorineDose: 10,
        tankLength: Math.sqrt(Q / 1440 * 30 * 3),
        tankWidth: Math.sqrt(Q / 1440 * 30 / 3),
        tankDepth: 2.0,
        baffleEfficiency: 0.5,
      }
    case 'oil_separator':
      return {
        separatorType: 'api',
        length: 6,
        width: 2,
        depth: 1.5,
      }
    case 'uasb':
      return {
        volume: Q * 8 / 24, // 8h HRT
        height: 6,
        operatingTemp: 30,
      }
    case 'sbr':
      return {
        volumePerReactor: Q * 0.3, // 30% of daily flow
        numberOfReactors: 2,
        cycleTime: 6,
        mlss: 3500,
      }
    case 'oxidation_pond':
      return {
        pondType: 'facultative',
        surfaceArea: Q * 15 / 1.5, // 15 days HRT, 1.5m depth
        depth: 1.5,
      }
    case 'trickling_filter':
      return {
        filterType: 'high_rate',
        diameter: Math.sqrt(Q / 20 / Math.PI) * 2, // ~20 m³/m²·d hydraulic loading
        depth: 2.5,
        mediaType: 'plastic',
        recirculationRatio: 1.0,
      }
    case 'mbr':
      return {
        membraneType: 'hollow_fiber',
        configuration: 'submerged',
        tankVolume: Q * 6 / 24, // 6h HRT
        membraneArea: Q / 20 * 1000 / 24, // ~20 LMH flux
        mlss: 10000,
        srt: 25,
        flux: 20,
      }
    case 'daf':
      return {
        length: 6,
        width: 3,
        depth: 2,
        recycleRatio: 10,
      }
    case 'filtration':
      return {
        filterType: 'rapid_sand',
        totalArea: Q / 24 / 10, // 10 m³/m²·h
        mediaDepth: 0.8,
      }
    case 'uv_disinfection':
      return {
        uvDose: 50,
        uvTransmittance: 65,
        channelLength: 3,
        channelWidth: 1,
        channelDepth: 0.5,
      }
    default:
      return {}
  }
}

// ============================================
// COST ESTIMATION
// ============================================

/**
 * Get estimated volume for a treatment unit based on its design
 */
function getUnitVolume(unit: TreatmentUnit): number {
  const design = unit.design as unknown as Record<string, unknown>

  // Check for explicit volume
  if (typeof design.tankVolume === 'number') return design.tankVolume
  if (typeof design.volume === 'number') return design.volume

  // Calculate from dimensions
  if (typeof design.length === 'number' && typeof design.width === 'number' && typeof design.depth === 'number') {
    return (design.length as number) * (design.width as number) * (design.depth as number)
  }

  // Circular tanks
  if (typeof design.diameter === 'number' && typeof design.depth === 'number') {
    const radius = (design.diameter as number) / 2
    return Math.PI * radius * radius * (design.depth as number)
  }

  // Surface area based
  if (typeof design.surfaceArea === 'number' && typeof design.depth === 'number') {
    return (design.surfaceArea as number) * (design.depth as number)
  }

  // Default estimate based on flow
  return unit.inputQuality.flowRate * 0.1 // Rough estimate
}

/**
 * Get estimated surface area for a treatment unit
 */
function getUnitArea(unit: TreatmentUnit): number {
  const design = unit.design as unknown as Record<string, unknown>

  // Explicit area
  if (typeof design.surfaceArea === 'number') return design.surfaceArea
  if (typeof design.totalArea === 'number') return design.totalArea

  // Calculate from dimensions
  if (typeof design.length === 'number' && typeof design.width === 'number') {
    return (design.length as number) * (design.width as number)
  }

  // Circular
  if (typeof design.diameter === 'number') {
    const radius = (design.diameter as number) / 2
    return Math.PI * radius * radius
  }

  // From volume
  const volume = getUnitVolume(unit)
  return volume / 3 // Assume 3m average depth
}

/**
 * Calculate cost estimation for a treatment system
 */
export function calculateCostEstimation(
  system: TreatmentSystem,
  flowRate: number
): CostEstimation {
  const { electricityRate, laborRate, landCostPerM2, contingencyFactor, engineeringFactor, installationFactor } = GENERAL_COST_PARAMS

  let totalCivilWorks = 0
  let totalEquipment = 0
  let totalLandArea = 0
  let totalPowerConsumption = 0
  let totalChemicalCost = 0
  let totalLaborHours = 0
  let totalMaintenanceCost = 0

  const unitCosts: CostEstimation['unitCosts'] = []

  // Calculate costs for each unit
  for (const unit of system.units) {
    const costParams = UNIT_COST_PARAMS[unit.type]
    const meta = UNIT_METADATA[unit.type]
    const volume = getUnitVolume(unit)
    const area = getUnitArea(unit)

    // Capital cost calculation
    let civilWorks = costParams.baseCapitalCost
    civilWorks += volume * costParams.capitalCostPerM3
    if (costParams.capitalCostPerM2) {
      civilWorks += area * costParams.capitalCostPerM2
    }

    const equipment = civilWorks * costParams.equipmentCostFactor
    const unitCapital = civilWorks + equipment

    // Operating cost calculation (monthly)
    const dailyFlow = flowRate
    const monthlyFlow = dailyFlow * 30

    const powerCost = (costParams.powerConsumption * dailyFlow * 30) * electricityRate
    const chemicalCost = costParams.chemicalCostPerM3 * monthlyFlow
    const laborCost = costParams.laborHoursPerDay * 30 * laborRate
    const maintenanceCost = (unitCapital * costParams.maintenanceFactor) / 12

    const unitOperating = powerCost + chemicalCost + laborCost + maintenanceCost

    // Land area
    const landArea = costParams.landAreaPerM3Flow * dailyFlow

    // Accumulate totals
    totalCivilWorks += civilWorks
    totalEquipment += equipment
    totalLandArea += landArea
    totalPowerConsumption += costParams.powerConsumption * dailyFlow
    totalChemicalCost += chemicalCost
    totalLaborHours += costParams.laborHoursPerDay
    totalMaintenanceCost += maintenanceCost

    unitCosts.push({
      unitType: unit.type,
      unitName: meta.name,
      capitalCost: unitCapital,
      operatingCost: unitOperating,
    })
  }

  // Calculate totals
  const subtotalCapital = totalCivilWorks + totalEquipment
  const engineering = subtotalCapital * engineeringFactor
  const installation = subtotalCapital * installationFactor
  const contingency = (subtotalCapital + engineering + installation) * contingencyFactor
  const landCost = totalLandArea * landCostPerM2
  const totalCapital = subtotalCapital + engineering + installation + contingency + landCost

  // Monthly operating costs
  const electricity = totalPowerConsumption * 30 * electricityRate
  const chemicals = totalChemicalCost
  const labor = totalLaborHours * 30 * laborRate
  const maintenance = totalMaintenanceCost
  const sludgeDisposal = flowRate * 0.5 * 30 // Estimate 0.5 THB/m³ for sludge

  const totalOperating = electricity + chemicals + labor + maintenance + sludgeDisposal

  // Annual costs
  const annualOperating = totalOperating * 12
  const annualDepreciation = totalCapital / 20 // 20-year depreciation
  const totalAnnualCost = annualOperating + annualDepreciation

  // Cost per m³
  const annualFlow = flowRate * 365
  const costPerM3 = annualFlow > 0 ? totalAnnualCost / annualFlow : 0

  return {
    // Capital costs
    civilWorks: Math.round(totalCivilWorks),
    equipment: Math.round(totalEquipment),
    engineering: Math.round(engineering),
    installation: Math.round(installation),
    contingency: Math.round(contingency),
    landCost: Math.round(landCost),
    totalCapital: Math.round(totalCapital),

    // Operating costs (monthly)
    electricity: Math.round(electricity),
    chemicals: Math.round(chemicals),
    labor: Math.round(labor),
    maintenance: Math.round(maintenance),
    sludgeDisposal: Math.round(sludgeDisposal),
    totalOperating: Math.round(totalOperating),

    // Annual costs
    annualOperating: Math.round(annualOperating),
    annualDepreciation: Math.round(annualDepreciation),
    totalAnnualCost: Math.round(totalAnnualCost),

    // Cost per unit
    costPerM3: Math.round(costPerM3 * 100) / 100,

    // Breakdown
    unitCosts,
  }
}
