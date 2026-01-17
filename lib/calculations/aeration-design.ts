/**
 * VerChem - Aeration System Design Module
 * World-Class aeration system calculations
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 * Reference: WEF MOP 8 - Design of Municipal Wastewater Treatment Plants
 * Reference: ASCE Standard Guidelines for In-Process Oxygen Transfer Testing
 */

import {
  DiffuserType,
  BlowerType,
  DOProfilePoint,
  OxygenTransferParams,
  AerationSystemDesign,
  DesignIssue,
  DIFFUSER_SPECS,
} from '../types/wastewater-treatment'

// ============================================
// CONSTANTS
// ============================================

/**
 * DO saturation at various temperatures (mg/L) at sea level
 * Source: Standard Methods for Water and Wastewater
 */
const DO_SATURATION: Record<number, number> = {
  10: 11.29,
  12: 10.77,
  14: 10.29,
  15: 10.07,
  16: 9.86,
  18: 9.47,
  20: 9.09,
  22: 8.74,
  24: 8.42,
  25: 8.26,
  26: 8.11,
  28: 7.83,
  30: 7.56,
  32: 7.31,
  35: 6.95,
}

/**
 * Get DO saturation with interpolation
 */
export function getDOSaturation(temperature: number): number {
  const temps = Object.keys(DO_SATURATION)
    .map(Number)
    .sort((a, b) => a - b)

  if (temperature <= temps[0]) return DO_SATURATION[temps[0]]
  if (temperature >= temps[temps.length - 1]) return DO_SATURATION[temps[temps.length - 1]]

  // Linear interpolation
  for (let i = 0; i < temps.length - 1; i++) {
    if (temperature >= temps[i] && temperature <= temps[i + 1]) {
      const t1 = temps[i]
      const t2 = temps[i + 1]
      const c1 = DO_SATURATION[t1]
      const c2 = DO_SATURATION[t2]
      return c1 + ((c2 - c1) * (temperature - t1)) / (t2 - t1)
    }
  }

  return 8.0 // Default fallback
}

/**
 * Pressure correction for elevation
 */
function elevationPressureFactor(elevation: number): number {
  // Barometric pressure ratio at elevation
  return Math.pow(1 - 0.0000225577 * elevation, 5.2559)
}

/**
 * Air density at standard conditions
 */
const AIR_DENSITY_STD = 1.2 // kg/m³ at 20°C, 1 atm

/** Oxygen content in air (20.95%) */
const O2_FRACTION = 0.2095

/** Minimum positive value to prevent division by zero */
const MIN_POSITIVE = 1e-6

/** Minimum AOTE percentage to prevent negative values */
const MIN_AOTE_PERCENT = 0.5

/** Minimum DO deficit ratio (reserved for future use) */
const _MIN_DO_DEFICIT = 0.05

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
// OXYGEN TRANSFER CALCULATIONS
// ============================================

/**
 * Input for oxygen transfer calculations
 */
export interface OxygenTransferInput {
  // Oxygen demand
  bodRemoved: number // kg BOD/day
  nitrogenOxidized?: number // kg NH4-N/day
  biomassVolume: number // m³ × mg/L MLVSS (for endogenous respiration)

  // Environmental conditions
  temperature: number // °C
  elevation: number // m above sea level

  // Wastewater characteristics
  alpha: number // Process water/clean water (0.4-0.9)
  beta: number // Salinity factor (0.95-0.99)
  foulingFactor: number // F factor (0.65-0.9)

  // Operating conditions
  doSetpoint: number // mg/L operating DO

  // Diffuser properties
  diffuserType: DiffuserType
  submergence: number // m

  // Safety factors
  peakFactor: number // Peak/average ratio
}

/**
 * Calculate oxygen requirements
 */
export function calculateOxygenDemand(input: {
  bodRemoved: number // kg BOD/day
  nitrogenOxidized?: number // kg NH4-N/day
  mlvss: number // mg/L
  tankVolume: number // m³
}): {
  carbonaceous: number
  nitrogenous: number
  endogenous: number
  total: number
} {
  const bodRemoved = safeNonNegative(input.bodRemoved, 0)
  const nitrogenOxidized = safeNonNegative(input.nitrogenOxidized || 0, 0)
  const mlvss = safeNonNegative(input.mlvss, 0)
  const tankVolume = safePositive(input.tankVolume, 1)

  // Carbonaceous demand: ~1.0-1.2 kg O2/kg BOD removed
  const carbonaceous = bodRemoved * 1.1

  // Nitrogenous demand: 4.57 kg O2/kg NH4-N oxidized
  const nitrogenous = nitrogenOxidized * 4.57

  // Endogenous respiration: ~0.06-0.1 kg O2/kg MLVSS/day
  const biomass = (mlvss * tankVolume) / 1000 // kg
  const endogenous = biomass * 0.08

  return {
    carbonaceous,
    nitrogenous,
    endogenous,
    total: carbonaceous + nitrogenous + endogenous,
  }
}

/**
 * Calculate oxygen transfer parameters
 */
export function calculateOxygenTransfer(input: OxygenTransferInput): OxygenTransferParams {
  const diffuserSpec = DIFFUSER_SPECS[input.diffuserType]

  // Standard conditions (20°C, clean water, DO = 0)
  const cs20 = getDOSaturation(20) // 9.09 mg/L
  const csT = getDOSaturation(input.temperature)

  // Elevation correction
  const pb = elevationPressureFactor(input.elevation)

  // Pressure correction for depth (mid-depth aeration)
  const depthPressure = 1 + input.submergence / 10.33 / 2 // Average pressure

  // Saturated DO at actual conditions
  const csInf = csT * pb * depthPressure

  // Temperature correction factor (theta)
  const theta = diffuserSpec.theta

  // Standard Oxygen Transfer Efficiency (SOTE)
  // Depth correction: typically 1-2% per ft, or ~4-6% per meter
  const soteBase = diffuserSpec.sote / 100
  const depthCorrection = 1 + (input.submergence - 4.5) * 0.02 // Reference at 4.5m
  const sote = Math.min(0.35, Math.max(0.08, soteBase * depthCorrection)) * 100

  // Actual Oxygen Transfer Efficiency (AOTE)
  // AOTE = SOTE × α × β × F × θ^(T-20) × (Cs∞ - CL)/(Cs20)
  const tempCorrection = Math.pow(theta, input.temperature - 20)
  const doDeficitRaw = (csInf - input.doSetpoint) / cs20
  const doDeficit = Math.max(0.05, doDeficitRaw)
  const aoteUnclamped = sote * input.alpha * input.beta * input.foulingFactor * tempCorrection * doDeficit
  const aote = Math.max(MIN_AOTE_PERCENT, aoteUnclamped)

  // Oxygen demands (from previous calculation or input)
  // For now, use typical values based on BOD removed
  const sor = input.bodRemoved * 1.3 // kg O2/day standard conditions

  // Actual Oxygen Requirement
  const aor = sor / (sote / 100) // kg O2/day actual

  // Transfer rates (assuming 24-hour operation)
  const sotr = sor / 24 // kg O2/h
  const aotr = aor / 24 // kg O2/h

  return {
    sotr,
    sote,
    sor,
    aotr,
    aote,
    aor,
    alpha: input.alpha,
    beta: input.beta,
    theta,
    F: input.foulingFactor,
    temperature: input.temperature,
    elevation: input.elevation,
    csInf,
    cs20,
    doOperating: input.doSetpoint,
  }
}

// ============================================
// DIFFUSER SYSTEM DESIGN
// ============================================

/**
 * Input for diffuser system design
 */
export interface DiffuserSystemInput {
  tankArea: number // m²
  tankDepth: number // m
  oxygenRequired: number // kg O2/day
  diffuserType: DiffuserType
  transferParams: OxygenTransferParams
}

/**
 * Design diffuser system
 */
export function designDiffuserSystem(input: DiffuserSystemInput): AerationSystemDesign['diffuserSystem'] {
  const spec = DIFFUSER_SPECS[input.diffuserType]

  // Calculate total air flow required
  // Air flow = O2 required / (ρ_air × O2_fraction × AOTE)
  const aote = Math.max(MIN_AOTE_PERCENT, input.transferParams.aote) / 100
  const airDensityO2 = AIR_DENSITY_STD * O2_FRACTION // kg O2/m³ air

  // Daily air requirement (m³/day)
  const oxygenRequired = safeNonNegative(input.oxygenRequired, 0)
  const dailyAirRequired = safeDivide(oxygenRequired, airDensityO2 * aote, 0)

  // Hourly air flow (m³/h = Nm³/h at standard conditions)
  const totalAirflow = dailyAirRequired / 24

  // Number of diffusers based on area coverage
  const tankArea = safePositive(input.tankArea, 1)
  const diffusersByArea = Math.max(1, Math.ceil(tankArea / spec.coveragePerUnit))

  // Number of diffusers based on airflow capacity
  const airflowPerDiffuser = totalAirflow > 0
    ? Math.min(
      spec.airflowPerUnit.max,
      Math.max(spec.airflowPerUnit.min, totalAirflow / diffusersByArea)
    )
    : 0
  const diffusersByAirflow = totalAirflow > 0 && airflowPerDiffuser > 0
    ? Math.ceil(totalAirflow / airflowPerDiffuser)
    : diffusersByArea

  // Use the higher of the two
  const numberOfDiffusers = Math.max(1, Math.max(diffusersByArea, diffusersByAirflow))

  // Calculate actual airflow per diffuser
  const actualAirflowPerDiffuser = totalAirflow > 0 ? totalAirflow / numberOfDiffusers : 0

  // Grid layout (approximately square)
  const aspectRatio = 2 // Typical tank L:W ratio
  const columns = Math.ceil(Math.sqrt(numberOfDiffusers / aspectRatio))
  const rows = Math.ceil(numberOfDiffusers / columns)

  // Spacing
  const tankLength = Math.sqrt(tankArea * aspectRatio)
  const tankWidth = tankArea / tankLength
  const spacing = Math.min(tankLength / (rows + 1), tankWidth / (columns + 1))

  return {
    type: input.diffuserType,
    spec,
    numberOfDiffusers,
    diffuserDensity: numberOfDiffusers / input.tankArea,
    gridLayout: {
      rows,
      columns,
      spacing,
    },
    airflowPerDiffuser: actualAirflowPerDiffuser,
    totalAirflow,
  }
}

// ============================================
// BLOWER SYSTEM DESIGN
// ============================================

/**
 * Input for blower system design
 */
export interface BlowerSystemInput {
  totalAirflow: number // Nm³/h required
  diffuserPressureDrop: number // kPa
  submergence: number // m
  pipingPressureDrop: number // kPa (estimated)
  elevationAboveBlower: number // m
  redundancy: 'n' | 'n+1' | 'n+2' // Standby configuration
}

/**
 * Design blower system
 */
export function designBlowerSystem(
  input: BlowerSystemInput
): AerationSystemDesign['blowerSystem'] {
  // Calculate total discharge pressure
  // P = Static head + Diffuser pressure drop + Piping losses
  const submergence = safeNonNegative(input.submergence, 0)
  const diffuserPressureDrop = safeNonNegative(input.diffuserPressureDrop, 0)
  const pipingPressureDrop = safeNonNegative(input.pipingPressureDrop, 0)
  const elevationAboveBlower = safeNonNegative(input.elevationAboveBlower, 0)
  const totalAirflow = safePositive(input.totalAirflow, MIN_POSITIVE)

  const staticHead = submergence * 9.81 // kPa (water column)
  const elevation = elevationAboveBlower * 0.12 // kPa per meter elevation
  const totalPressure = staticHead + diffuserPressureDrop + pipingPressureDrop + elevation

  // Add 10% safety margin
  const designPressure = totalPressure * 1.1

  // Determine blower type based on pressure and flow
  let blowerType: BlowerType
  if (designPressure < 50 && totalAirflow < 500) {
    blowerType = 'positive_displacement'
  } else if (designPressure < 80) {
    blowerType = 'multistage_centrifugal'
  } else {
    blowerType = 'single_stage_turbo'
  }

  // Size individual blowers (typical sizing)
  let numberOfBlowers: number
  let capacityPerBlower: number

  if (totalAirflow < 200) {
    numberOfBlowers = 2
    capacityPerBlower = totalAirflow / 1 // One handles 100%
  } else if (totalAirflow < 1000) {
    numberOfBlowers = 3
    capacityPerBlower = totalAirflow / 2 // Each handles 50%
  } else {
    numberOfBlowers = Math.ceil(totalAirflow / 500) + 1
    capacityPerBlower = totalAirflow / (numberOfBlowers - 1)
  }

  // Standby configuration
  let numberOfStandby: number
  switch (input.redundancy) {
    case 'n+2':
      numberOfStandby = 2
      break
    case 'n+1':
      numberOfStandby = 1
      break
    default:
      numberOfStandby = 0
  }

  const totalBlowers = numberOfBlowers + numberOfStandby

  // Calculate power requirements
  // Adiabatic power: P = (Q × ΔP) / (η × 1000)
  // where Q = m³/s, ΔP = Pa, η = efficiency
  const efficiency = blowerType === 'single_stage_turbo' ? 0.75 : blowerType === 'multistage_centrifugal' ? 0.70 : 0.65

  const flowPerBlower = capacityPerBlower / 3600 // m³/s
  const pressurePa = designPressure * 1000 // Pa

  // Isothermal compression power
  const motorPower = (flowPerBlower * pressurePa) / (efficiency * 1000) // kW
  const totalPower = motorPower * numberOfBlowers // Only running blowers

  // VFD requirement
  const vfdRequired = totalAirflow > 300 // VFDs recommended for larger systems

  // Turndown ratio
  const turndownRatio = blowerType === 'positive_displacement' ? 50 : blowerType === 'single_stage_turbo' ? 40 : 60

  return {
    type: blowerType,
    numberOfBlowers: totalBlowers,
    numberOfStandby,
    capacityPerBlower,
    totalCapacity: capacityPerBlower * numberOfBlowers,
    dischargePressure: designPressure,
    motorPower,
    totalPower,
    turndownRatio,
    vfdRequired,
  }
}

// ============================================
// PIPING SYSTEM DESIGN
// ============================================

/**
 * Design air piping system
 */
export function designPipingSystem(
  totalAirflow: number, // Nm³/h
  numberOfDropPipes: number,
  tankLength: number, // m
  _tankWidth: number // m - reserved for future layout calculations
): AerationSystemDesign['pipingSystem'] {
  // Target velocity in main header: 10-20 m/s
  const targetVelocity = 15 // m/s

  // Flow in m³/s
  const safeTotalAirflow = safePositive(totalAirflow, MIN_POSITIVE)
  const flowRate = safeTotalAirflow / 3600

  // Header diameter (circular pipe)
  // A = Q/v, D = sqrt(4A/π)
  const headerArea = flowRate / targetVelocity
  const headerDiameterCalc = Math.sqrt((4 * headerArea) / Math.PI) * 1000 // mm

  // Round up to standard size
  const standardSizes = [50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500]
  const mainHeaderDiameter = standardSizes.find((d) => d >= headerDiameterCalc) || 500

  // Actual velocity
  const actualArea = (Math.PI * Math.pow(mainHeaderDiameter / 1000, 2)) / 4
  const airVelocity = flowRate / actualArea

  // Drop pipe sizing (typically 50-80mm)
  const safeDropPipes = Math.max(1, Math.floor(Number.isFinite(numberOfDropPipes) ? numberOfDropPipes : 1))
  const flowPerDrop = flowRate / safeDropPipes
  const dropArea = flowPerDrop / 15 // 15 m/s target
  const dropDiameterCalc = Math.sqrt((4 * dropArea) / Math.PI) * 1000
  const dropPipeDiameter = standardSizes.find((d) => d >= dropDiameterCalc) || 80

  // Main header length (assume runs along tank length)
  const safeTankLength = safePositive(tankLength, 1)
  const mainHeaderLength = safeTankLength * 1.2 // 20% extra for connections

  // Pressure drop calculation (Darcy-Weisbach simplified)
  // ΔP = f × (L/D) × (ρv²/2)
  const frictionFactor = 0.02 // Typical for steel pipe
  const headerPressureDrop =
    (frictionFactor * (mainHeaderLength / (mainHeaderDiameter / 1000)) * (AIR_DENSITY_STD * Math.pow(airVelocity, 2))) / 2 / 1000 // kPa

  // Add fittings (elbows, tees) - assume 50% of straight pipe loss
  const totalPressureDrop = headerPressureDrop * 1.5

  return {
    mainHeaderDiameter,
    dropPipeDiameter,
    mainHeaderLength,
    numberOfDropPipes: safeDropPipes,
    totalPressureDrop,
    airVelocity,
  }
}

// ============================================
// DO PROFILE CALCULATION
// ============================================

/**
 * Calculate DO profile along tank
 */
export function calculateDOProfile(
  tankLength: number,
  tankDepth: number,
  flowRate: number, // m³/day
  oxygenDemand: number, // kg O2/day
  aeration: {
    totalAirflow: number // Nm³/h
    diffuserDensity: number // diffusers/m²
    sote: number // %
  },
  doSetpoint: number,
  temperature: number
): DOProfilePoint[] {
  const points: DOProfilePoint[] = []
  const numPoints = 10 // Points along tank length

  const cs = getDOSaturation(temperature)
  const hrt = 6 // Assumed HRT in hours

  // Oxygen uptake rate (OUR) - kg O2/m³/day
  const safeFlowRate = safePositive(flowRate, 1)
  const tankVolume = (safeFlowRate * hrt) / 24
  const safeOxygenDemand = safeNonNegative(oxygenDemand, 0)
  const our = safeDivide(safeOxygenDemand, tankVolume, 0) // kg O2/m³/day

  // Convert to mg/L/h
  const ourMgLh = (our * 1000) / 24

  // Oxygen transfer rate at each point
  const otr = safeDivide(
    aeration.totalAirflow * AIR_DENSITY_STD * O2_FRACTION * aeration.sote,
    100 * tankVolume,
    0
  ) * 1000 / 24 // mg/L/h

  for (let i = 0; i <= numPoints; i++) {
    const position = (i / numPoints) * tankLength

    // Simple DO profile model
    // DO increases with aeration, decreases with uptake
    // Assume steady state: OTR = OUR at setpoint
    const localOur = ourMgLh * (1 - i / numPoints * 0.3) // OUR decreases along tank
    const doDelta = (otr - localOur) * 0.1 // Time factor

    const doConcentration = Math.max(0, Math.min(cs, doSetpoint + doDelta))

    points.push({
      position,
      depth: tankDepth / 2, // Mid-depth
      doConcentration,
      oxygenUptakeRate: localOur,
      isAnoxic: doConcentration < 0.5,
    })
  }

  return points
}

// ============================================
// COMPLETE AERATION SYSTEM DESIGN
// ============================================

/**
 * Complete aeration system design input
 */
export interface AerationDesignInput {
  // Tank parameters
  tankVolume: number // m³
  tankDepth: number // m
  numberOfZones?: number // For step aeration

  // Oxygen demand
  bodRemoved: number // kg BOD/day
  nitrogenOxidized?: number // kg NH4-N/day
  mlss: number // mg/L

  // Environmental conditions
  temperature: number // °C
  elevation?: number // m above sea level (default 0)

  // Wastewater characteristics
  alpha?: number // Default 0.6
  beta?: number // Default 0.98
  foulingFactor?: number // Default 0.8

  // Operating conditions
  doSetpoint?: number // mg/L (default 2.0)

  // Equipment selection
  diffuserType?: DiffuserType // Default fine_bubble_disc
  blowerRedundancy?: 'n' | 'n+1' | 'n+2' // Default n+1

  // Safety factors
  peakFactor?: number // Default 1.5
}

/**
 * Design complete aeration system
 */
export function designAerationSystem(input: AerationDesignInput): AerationSystemDesign {
  const issues: DesignIssue[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  // Default values
  const alpha = input.alpha ?? 0.6
  const beta = input.beta ?? 0.98
  const foulingFactor = input.foulingFactor ?? 0.8
  const doSetpoint = input.doSetpoint ?? 2.0
  const diffuserType = input.diffuserType ?? 'fine_bubble_disc'
  const elevation = input.elevation ?? 0
  const peakFactor = input.peakFactor ?? 1.5
  const redundancy = input.blowerRedundancy ?? 'n+1'
  const numberOfZones = input.numberOfZones ?? 1

  const tankVolume = safePositive(input.tankVolume, 1)
  const tankDepth = safePositive(input.tankDepth, 1)
  if (input.tankVolume <= 0 || !Number.isFinite(input.tankVolume)) {
    issues.push({
      severity: 'critical',
      parameter: 'Tank Volume',
      message: 'Tank volume must be greater than 0',
      currentValue: input.tankVolume,
      recommendedValue: 500,
      unit: 'm³',
      suggestion: 'Enter a valid tank volume',
    })
  }
  if (input.tankDepth <= 0 || !Number.isFinite(input.tankDepth)) {
    issues.push({
      severity: 'critical',
      parameter: 'Tank Depth',
      message: 'Tank depth must be greater than 0',
      currentValue: input.tankDepth,
      recommendedValue: 4.5,
      unit: 'm',
      suggestion: 'Enter a valid tank depth',
    })
  }

  // Calculate tank geometry
  const tankArea = tankVolume / tankDepth
  const tankLength = Math.sqrt(tankArea * 2) // Assume L:W = 2:1
  const tankWidth = tankArea / tankLength

  // Calculate oxygen demand (convert MLSS to MLVSS)
  const mlvss = input.mlss * 0.75
  const oxygenDemand = calculateOxygenDemand({
    bodRemoved: input.bodRemoved,
    nitrogenOxidized: input.nitrogenOxidized,
    mlvss,
    tankVolume,
  })

  const peakDemand = oxygenDemand.total * peakFactor

  // Calculate oxygen transfer parameters
  const diffuserSpec = DIFFUSER_SPECS[diffuserType]
  const transferParams = calculateOxygenTransfer({
    bodRemoved: input.bodRemoved,
    nitrogenOxidized: input.nitrogenOxidized,
    biomassVolume: input.mlss * tankVolume,
    temperature: input.temperature,
    elevation,
    alpha,
    beta,
    foulingFactor,
    doSetpoint,
    diffuserType,
    submergence: diffuserSpec.submergence,
    peakFactor,
  })

  // Design diffuser system
  const diffuserSystem = designDiffuserSystem({
    tankArea,
    tankDepth,
    oxygenRequired: peakDemand,
    diffuserType,
    transferParams,
  })

  // Design piping system
  const pipingSystem = designPipingSystem(
    diffuserSystem.totalAirflow,
    diffuserSystem.gridLayout.columns,
    tankLength,
    tankWidth
  )

  // Design blower system
  const blowerSystem = designBlowerSystem({
    totalAirflow: diffuserSystem.totalAirflow,
    diffuserPressureDrop: diffuserSpec.pressureDrop,
    submergence: diffuserSpec.submergence,
    pipingPressureDrop: pipingSystem.totalPressureDrop,
    elevationAboveBlower: 2, // Assume 2m elevation
    redundancy,
  })

  // Calculate DO profile
  const doProfile = calculateDOProfile(
    tankLength,
    tankDepth,
    tankVolume * 24 / 6, // Approximate flow from HRT
    oxygenDemand.total,
    {
      totalAirflow: diffuserSystem.totalAirflow,
      diffuserDensity: diffuserSystem.diffuserDensity,
      sote: transferParams.sote,
    },
    doSetpoint,
    input.temperature
  )

  // Calculate energy consumption
  const blowerPower = blowerSystem.totalPower
  const dailyEnergy = blowerPower * 24
  const annualEnergy = dailyEnergy * 365
  const kWhPerKgO2 = safeDivide(dailyEnergy, oxygenDemand.total, 0)
  const kWhPerM3 = safeDivide(dailyEnergy, tankVolume * 24 / 6, 0) // Based on flow
  const electricityRate = 4.5 // THB/kWh
  const annualEnergyCost = annualEnergy * electricityRate

  // Calculate capital costs
  const diffuserCost = diffuserSystem.numberOfDiffusers * diffuserSpec.unitCost
  const blowerCostPerUnit = blowerSystem.capacityPerBlower < 100 ? 200000 :
    blowerSystem.capacityPerBlower < 500 ? 500000 : 1000000
  const blowerCost = blowerSystem.numberOfBlowers * blowerCostPerUnit
  const pipingCost = pipingSystem.mainHeaderLength * 5000 + pipingSystem.numberOfDropPipes * 3000
  const controlsCost = blowerSystem.vfdRequired ? blowerSystem.numberOfBlowers * 100000 : 50000
  const installationCost = (diffuserCost + blowerCost + pipingCost) * 0.2
  const totalCapitalCost = diffuserCost + blowerCost + pipingCost + controlsCost + installationCost

  // Control system
  const controlSystem: AerationSystemDesign['controlSystem'] = {
    doControl: blowerSystem.vfdRequired ? 'pid' : 'on_off',
    doSetpoint,
    doSensors: Math.max(2, numberOfZones),
    airflowControl: blowerSystem.vfdRequired ? 'vfd' : 'valve',
  }

  // Validation
  if (diffuserSystem.airflowPerDiffuser > diffuserSpec.airflowPerUnit.max) {
    issues.push({
      severity: 'warning',
      parameter: 'Airflow per Diffuser',
      message: 'Exceeds maximum recommended',
      currentValue: diffuserSystem.airflowPerDiffuser,
      recommendedValue: diffuserSpec.airflowPerUnit.optimal,
      unit: 'Nm³/h',
      suggestion: 'Add more diffusers or use larger type',
    })
  }

  if (diffuserSystem.airflowPerDiffuser > 0 && diffuserSystem.airflowPerDiffuser < diffuserSpec.airflowPerUnit.min) {
    issues.push({
      severity: 'info',
      parameter: 'Airflow per Diffuser',
      message: 'Below minimum - may cause uneven distribution',
      currentValue: diffuserSystem.airflowPerDiffuser,
      recommendedValue: diffuserSpec.airflowPerUnit.optimal,
      unit: 'Nm³/h',
      suggestion: 'Consider fewer diffusers or smaller type',
    })
  }

  if (pipingSystem.airVelocity > 25) {
    issues.push({
      severity: 'warning',
      parameter: 'Air Velocity',
      message: 'High velocity may cause noise and erosion',
      currentValue: pipingSystem.airVelocity,
      recommendedValue: 15,
      unit: 'm/s',
      suggestion: 'Increase header pipe diameter',
    })
  }

  if (doSetpoint >= transferParams.csInf) {
    issues.push({
      severity: 'critical',
      parameter: 'DO Setpoint',
      message: 'DO setpoint exceeds saturation at operating conditions',
      currentValue: doSetpoint,
      recommendedValue: transferParams.csInf * 0.9,
      unit: 'mg/L',
      suggestion: 'Lower the setpoint or reassess temperature/elevation',
    })
  }

  if (transferParams.aote < 10) {
    warnings.push('Low oxygen transfer efficiency - consider process optimization')
  }

  if (kWhPerKgO2 > 1.5) {
    warnings.push('Energy consumption above typical range - verify design')
    recommendations.push('Consider fine bubble diffusers for better efficiency')
  }

  if (blowerSystem.vfdRequired && controlSystem.doControl === 'on_off') {
    recommendations.push('Upgrade to PID control for energy optimization')
  }

  if (numberOfZones === 1 && tankVolume > 500) {
    recommendations.push('Consider multiple aeration zones for better DO control')
  }

  const isValid = issues.filter((i) => i.severity === 'critical').length === 0

  return {
    tankVolume,
    tankDepth,
    tankArea,
    numberOfZones,
    oxygenDemand: {
      carbonaceous: oxygenDemand.carbonaceous,
      nitrogenous: oxygenDemand.nitrogenous,
      endogenous: oxygenDemand.endogenous,
      total: oxygenDemand.total,
      peakFactor,
      peakDemand,
    },
    transfer: transferParams,
    diffuserSystem,
    blowerSystem,
    pipingSystem,
    controlSystem,
    doProfile,
    energyConsumption: {
      blowerPower,
      dailyEnergy,
      annualEnergy,
      kWhPerKgO2,
      kWhPerM3,
      annualCost: annualEnergyCost,
    },
    capitalCost: {
      diffusers: diffuserCost,
      blowers: blowerCost,
      piping: pipingCost,
      controls: controlsCost,
      installation: installationCost,
      total: totalCapitalCost,
    },
    validation: {
      isValid,
      issues,
      warnings,
      recommendations,
    },
  }
}

/**
 * Quick estimation for aeration power
 */
export function estimateAerationPower(
  flowRate: number, // m³/day
  bodInfluent: number, // mg/L
  bodEffluent: number, // mg/L
  nitrification: boolean = false
): {
  power: number // kW
  dailyEnergy: number // kWh/day
  kWhPerM3: number
} {
  // BOD removed
  const safeFlowRate = safePositive(flowRate, 1)
  const bodRemoved = ((bodInfluent - bodEffluent) * safeFlowRate) / 1000 // kg/day

  // Oxygen demand
  let o2Demand = bodRemoved * 1.2 // kg O2/day for carbonaceous
  if (nitrification) {
    // Assume 80% of TKN (estimate 40 mg/L) is nitrified
    const nOxidized = (40 * 0.8 * safeFlowRate) / 1000 // kg N/day
    o2Demand += nOxidized * 4.57
  }

  // Assume 25% SOTE, 0.6 alpha, 0.85 overall efficiency
  const airRequired = o2Demand / (0.25 * 0.6 * 0.21 * 1.2) // Nm³/day
  const airFlowRate = airRequired / 24 / 3600 // m³/s

  // Typical pressure: 50 kPa
  const pressure = 50000 // Pa
  const efficiency = 0.7

  const power = (airFlowRate * pressure) / (efficiency * 1000)
  const dailyEnergy = power * 24
  const kWhPerM3 = safeDivide(dailyEnergy, safeFlowRate, 0)

  return {
    power,
    dailyEnergy,
    kWhPerM3,
  }
}
