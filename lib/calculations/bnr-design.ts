/**
 * VerChem - Biological Nutrient Removal (BNR) Design Module
 * World-Class nitrogen and phosphorus removal calculations
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 * Reference: WEF MOP 8 - Design of Municipal Wastewater Treatment Plants
 * Reference: IWA Activated Sludge Models (ASM1, ASM2d, ASM3)
 */

import {
  WastewaterQuality,
  BNRProcessType,
  BNRProcessConfig,
  NitrificationParams,
  DenitrificationParams,
  PhosphorusRemovalParams,
  BNRDesign,
  DesignIssue,
  BNR_PROCESS_CONFIGS,
} from '../types/wastewater-treatment'

// ============================================
// KINETIC CONSTANTS (Default values at 20°C)
// ============================================

/**
 * Nitrifier kinetic constants (AOB - Ammonia Oxidizing Bacteria)
 */
const NITRIFIER_KINETICS = {
  muMaxAOB: 0.75, // day⁻¹ at 20°C
  muMaxNOB: 1.0, // day⁻¹ at 20°C
  ksNH4: 0.5, // mg/L half-saturation for NH4
  ksO2: 0.5, // mg/L half-saturation for O2
  kdAOB: 0.05, // day⁻¹ decay rate
  kdNOB: 0.05, // day⁻¹ decay rate
  thetaMu: 1.072, // Temperature coefficient for growth
  thetaKd: 1.029, // Temperature coefficient for decay
  yAOB: 0.12, // Yield coefficient (g VSS/g NH4-N)
}

/**
 * Denitrifier kinetic constants
 */
const DENITRIFIER_KINETICS = {
  sdnr20: 0.12, // g NO3-N/g MLVSS·day at 20°C
  theta: 1.026, // Temperature coefficient
  ksNO3: 0.1, // mg/L half-saturation for NO3
  ksCOD: 20, // mg/L half-saturation for COD
  etaAnoxic: 0.6, // Anoxic correction factor for heterotrophs
  carbonRatios: {
    wastewater: 5.0, // mg rbCOD/mg NO3-N
    methanol: 2.5, // mg methanol/mg NO3-N
    acetate: 3.5, // mg acetate/mg NO3-N
    glycerol: 4.0, // mg glycerol/mg NO3-N
  },
}

/**
 * Phosphorus removal constants
 */
const PHOSPHORUS_KINETICS = {
  paoYield: 0.4, // g VSS/g COD
  paoContent: 0.38, // g P/g PAO VSS (luxury uptake)
  paoContentMin: 0.02, // g P/g PAO VSS (minimum)
  vfaRatio: 7.5, // mg VFA/mg P removed
  rbCODToVFA: 0.7, // Fraction of rbCOD available as VFA
  chemicalMolarRatios: {
    alum: 1.5, // Moles Al/mole P
    ferric_chloride: 1.8, // Moles Fe/mole P
    ferric_sulfate: 1.8,
    lime: 1.5, // Moles Ca/mole P
    pac: 1.4, // Poly aluminum chloride
  },
  chemicalProperties: {
    alum: { molecularWeight: 594.14, metalContent: 0.091, costPerKg: 25, pHEffect: 0.05 },
    ferric_chloride: { molecularWeight: 162.2, metalContent: 0.344, costPerKg: 20, pHEffect: 0.03 },
    ferric_sulfate: { molecularWeight: 399.88, metalContent: 0.279, costPerKg: 22, pHEffect: 0.03 },
    lime: { molecularWeight: 74.09, metalContent: 0.541, costPerKg: 8, pHEffect: -0.02 },
    pac: { molecularWeight: 174.45, metalContent: 0.155, costPerKg: 35, pHEffect: 0.04 },
  },
}

// ============================================
// CONSTANTS
// ============================================

/** Minimum positive value to prevent division by zero */
const MIN_POSITIVE = 1e-6

/** Minimum bulk ammonia concentration for Monod kinetics (mg/L) */
const MIN_BULK_AMMONIA = 0.1

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
// NITRIFICATION CALCULATIONS
// ============================================

/**
 * Input for nitrification design
 */
export interface NitrificationInput {
  tknInfluent: number // mg/L
  ammoniaInfluent: number // mg/L
  targetAmmonia: number // mg/L effluent
  temperature: number // °C
  doOperating: number // mg/L
  safetyFactor?: number // Default 2.0
  phRange?: [number, number] // Default [7.0, 8.5]
}

/**
 * Calculate nitrification parameters
 */
export function calculateNitrification(input: NitrificationInput): NitrificationParams {
  const {
    tknInfluent,
    ammoniaInfluent,
    targetAmmonia,
    temperature,
    doOperating,
    safetyFactor = 2.0,
    phRange = [7.0, 8.5],
  } = input

  const organicN = Math.max(0, tknInfluent - ammoniaInfluent)
  const ammoniaBulk = Math.max((ammoniaInfluent + targetAmmonia) / 2, 0.1)
  const doOperatingSafe = safeNonNegative(doOperating, 0)

  // Temperature correction for growth rate
  const thetaMu = NITRIFIER_KINETICS.thetaMu
  const thetaKd = NITRIFIER_KINETICS.thetaKd

  const muMaxAOB_T =
    NITRIFIER_KINETICS.muMaxAOB * Math.pow(thetaMu, temperature - 20)
  const muMaxNOB_T =
    NITRIFIER_KINETICS.muMaxNOB * Math.pow(thetaMu, temperature - 20)
  const kdAOB_T = NITRIFIER_KINETICS.kdAOB * Math.pow(thetaKd, temperature - 20)
  const kdNOB_T = NITRIFIER_KINETICS.kdNOB * Math.pow(thetaKd, temperature - 20)

  // Monod kinetics for ammonia oxidation
  // μ_net = μ_max × (NH4/(Ks+NH4)) × (DO/(Ks_O2+DO)) - kd
  const monodNH4 =
    ammoniaBulk / (NITRIFIER_KINETICS.ksNH4 + ammoniaBulk)
  const monodO2 =
    doOperatingSafe / (NITRIFIER_KINETICS.ksO2 + doOperatingSafe)

  const muNetAOB = muMaxAOB_T * monodNH4 * monodO2 - kdAOB_T
  const muNetNOB = muMaxNOB_T * monodO2 - kdNOB_T

  // Minimum SRT for nitrification
  // SRT_min = 1/μ_net
  const minSRT = muNetAOB > 0 ? 1 / muNetAOB : 999

  // Design SRT with safety factor
  const designSRT = minSRT * safetyFactor

  // Oxygen requirement (4.57 kg O2/kg NH4-N oxidized)
  const o2PerNH4 = 4.57
  const ammoniaOxidized = Math.max(0, ammoniaInfluent - targetAmmonia)

  // Alkalinity consumption (7.14 mg CaCO3/mg NH4-N)
  const alkPerNH4 = 7.14
  const alkalinityRequired = alkPerNH4 * ammoniaOxidized

  // Nitrification efficiency
  const nitrificationEfficiency =
    ammoniaInfluent > 0
      ? ((ammoniaInfluent - targetAmmonia) / ammoniaInfluent) * 100
      : 0

  return {
    tknInfluent,
    ammoniaInfluent,
    organicN,
    muMaxAOB: muMaxAOB_T,
    muMaxNOB: muMaxNOB_T,
    ksNH4: NITRIFIER_KINETICS.ksNH4,
    ksO2: NITRIFIER_KINETICS.ksO2,
    kdAOB: kdAOB_T,
    kdNOB: kdNOB_T,
    temperature,
    thetaMu,
    thetaKd,
    muNetAOB,
    muNetNOB,
    minSRT,
    designSRT,
    safetyFactor,
    o2PerNH4,
    alkPerNH4,
    alkalinityRequired,
    effluentNH3: targetAmmonia,
    nitrificationEfficiency,
  }
}

// ============================================
// DENITRIFICATION CALCULATIONS
// ============================================

/**
 * Input for denitrification design
 */
export interface DenitrificationInput {
  nitrateInfluent: number // mg/L (from nitrification)
  targetNitrate: number // mg/L effluent
  temperature: number // °C
  mlvss: number // mg/L
  flowRate: number // m³/day
  rbCODInfluent: number // mg/L readily biodegradable COD
  carbonSource?: 'wastewater' | 'methanol' | 'acetate' | 'glycerol' | 'external'
  internalRecycleRatio?: number // IR ratio
}

/**
 * Calculate denitrification parameters
 */
export function calculateDenitrification(
  input: DenitrificationInput
): DenitrificationParams {
  const {
    nitrateInfluent,
    targetNitrate,
    temperature,
    mlvss,
    flowRate,
    rbCODInfluent,
    carbonSource = 'wastewater',
    internalRecycleRatio = 2.0,
  } = input

  const nitrateToRemove = Math.max(0, nitrateInfluent - targetNitrate)
  const safeFlowRate = safePositive(flowRate, 1)
  const safeRecycleRatio = safeNonNegative(internalRecycleRatio, 0)
  const safeRbCOD = safeNonNegative(rbCODInfluent, 0)

  // Temperature correction for SDNR
  const sdnrCorrected =
    DENITRIFIER_KINETICS.sdnr20 *
    Math.pow(DENITRIFIER_KINETICS.theta, temperature - 20)

  // Carbon requirement (handle 'external' separately)
  const carbonRatio = carbonSource === 'external'
    ? DENITRIFIER_KINETICS.carbonRatios.methanol // Default to methanol for external
    : DENITRIFIER_KINETICS.carbonRatios[carbonSource as keyof typeof DENITRIFIER_KINETICS.carbonRatios]
  const carbonRequired = carbonRatio

  // Check if wastewater has enough carbon
  const vfaAvailable = safeRbCOD * PHOSPHORUS_KINETICS.rbCODToVFA
  const carbonNeeded = nitrateToRemove * carbonRequired
  const externalCarbonDose =
    nitrateToRemove > 0 && carbonSource !== 'wastewater' && vfaAvailable < carbonNeeded
      ? carbonNeeded - vfaAvailable
      : undefined

  // Anoxic zone design
  // Mass balance: SDNR × MLVSS × V_anoxic = NO3 removed × Q
  const no3MassRemoved = (nitrateToRemove * safeFlowRate) / 1000 // kg/day
  const mlvssKg = Math.max(MIN_POSITIVE, mlvss / 1000)
  const anoxicVolume = nitrateToRemove > 0
    ? safeDivide(no3MassRemoved, sdnrCorrected * mlvssKg, 0)
    : 0
  const anoxicHRT = safeDivide(anoxicVolume, safeFlowRate, 0) * 24 // hours

  // Nitrate feedback calculation with internal recycle
  // N_eff = N_nitrified / (1 + IR + RAS)
  // Assuming RAS = 0.5
  const rasRatio = 0.5
  const recycleSum = 1 + safeRecycleRatio + rasRatio
  const nitrateFeedback = safeDivide(nitrateInfluent, recycleSum, 0)

  // Oxygen equivalent (2.86 kg O2-eq/kg NO3-N denitrified)
  const o2EquivalentPerNO3 = 2.86
  const o2Savings = no3MassRemoved * o2EquivalentPerNO3

  // Alkalinity recovery (3.57 mg CaCO3/mg NO3-N)
  const alkRecoveryPerNO3 = 3.57
  const alkalinityRecovered = alkRecoveryPerNO3 * nitrateToRemove

  // Denitrification efficiency
  const denitrificationEfficiency =
    nitrateInfluent > 0
      ? ((nitrateInfluent - targetNitrate) / nitrateInfluent) * 100
      : 0

  // Anoxic fraction (typical 20-40%)
  const totalHRT = 12 // Assume typical
  const anoxicFraction = (anoxicHRT / totalHRT) * 100

  return {
    nitrateInfluent,
    nitrateToRemove,
    carbonSource,
    rbCODInfluent,
    carbonRequired,
    externalCarbonDose,
    sdnr: DENITRIFIER_KINETICS.sdnr20,
    temperature,
    sdnrCorrected,
    anoxicVolume,
    anoxicHRT,
    anoxicFraction,
    internalRecycleRatio,
    nitrateFeedback,
    o2EquivalentPerNO3,
    o2Savings,
    alkRecoveryPerNO3,
    alkalinityRecovered,
    effluentNO3: targetNitrate,
    denitrificationEfficiency,
  }
}

// ============================================
// PHOSPHORUS REMOVAL CALCULATIONS
// ============================================

/**
 * Input for phosphorus removal design
 */
export interface PhosphorusRemovalInput {
  totalPInfluent: number // mg/L
  targetTP: number // mg/L effluent
  flowRate: number // m³/day
  rbCODInfluent: number // mg/L
  temperature: number // °C
  enableEBPR?: boolean // Enable biological P removal
  enableChemP?: boolean // Enable chemical P removal
  chemical?: 'alum' | 'ferric_chloride' | 'ferric_sulfate' | 'lime' | 'pac'
  anaerobicHRT?: number // hours (if EBPR)
}

/**
 * Calculate phosphorus removal parameters
 */
export function calculatePhosphorusRemoval(
  input: PhosphorusRemovalInput
): PhosphorusRemovalParams {
  const {
    totalPInfluent,
    targetTP,
    flowRate,
    rbCODInfluent,
    temperature,
    enableEBPR = true,
    enableChemP = false,
    chemical = 'ferric_chloride',
    anaerobicHRT = 1.5,
  } = input
  const safeFlowRate = safePositive(flowRate, 1)

  const pToRemove = Math.max(0, totalPInfluent - targetTP)
  const orthoPInfluent = totalPInfluent * 0.7 // Typical 70% ortho-P
  const particulateP = totalPInfluent * 0.3

  // Biological P removal (EBPR)
  const vfaAvailable = safeNonNegative(rbCODInfluent, 0) * PHOSPHORUS_KINETICS.rbCODToVFA
  const vfaRequired = PHOSPHORUS_KINETICS.vfaRatio

  // Calculate anaerobic volume
  const anaerobicVolume = (anaerobicHRT * safeFlowRate) / 24

  // Bio-P removal capacity
  const bioP = {
    removal: 0,
    efficiency: 0,
    sludgeP: 0,
  }

  if (enableEBPR) {
    // Maximum bio-P removal based on VFA availability
    const maxBioPRemoval = vfaAvailable / vfaRequired

    // Also limited by PAO biomass capacity
    // Assume PAO yield ~0.4 g VSS/g VFA
    const paoProduction = (vfaAvailable * PHOSPHORUS_KINETICS.paoYield * safeFlowRate) / 1000 // kg PAO/day
    const maxPInBiomass = paoProduction * PHOSPHORUS_KINETICS.paoContent * 1000 / safeFlowRate // mg/L

    bioP.removal = Math.min(maxBioPRemoval, maxPInBiomass, pToRemove * 0.8)
    bioP.removal = Math.max(0, bioP.removal)
    bioP.efficiency = totalPInfluent > 0 ? (bioP.removal / totalPInfluent) * 100 : 0
    bioP.sludgeP = (bioP.removal * safeFlowRate) / 1000 // kg P/day
  }

  // Chemical P removal
  const remainingP = Math.max(0, pToRemove - bioP.removal)
  let chemPRecipitated = 0
  let chemicalDose = 0
  let molarRatio = 0
  let sludgeIncrease = 0
  let chemicalCost = 0
  let alkalinityLoss = 0

  const chemProps = PHOSPHORUS_KINETICS.chemicalProperties[chemical]

  if (enableChemP && remainingP > 0) {
    // Molar ratio for precipitation
    molarRatio = PHOSPHORUS_KINETICS.chemicalMolarRatios[chemical]

    // Chemical dose (mg/L as metal)
    const pMolarMass = 31 // g/mol
    const metalMolarMass = chemical.includes('alum') ? 27 : chemical === 'lime' ? 40 : 56
    const metalRequired = (remainingP / pMolarMass) * molarRatio * metalMolarMass

    // Convert to chemical dose
    chemicalDose = metalRequired / chemProps.metalContent

    chemPRecipitated = remainingP
    sludgeIncrease = chemicalDose * 2.5 / 1000 // Approximate sludge increase

    // Cost
    const dailyChemical = (chemicalDose * safeFlowRate) / 1000 // kg/day
    chemicalCost = dailyChemical * chemProps.costPerKg

    // Alkalinity loss (approximate)
    alkalinityLoss = chemicalDose * chemProps.pHEffect * 50
  }

  const effluentTP = Math.max(0, totalPInfluent - bioP.removal - chemPRecipitated)
  const effluentOrthoP = Math.max(0, orthoPInfluent - bioP.removal - chemPRecipitated)
  const totalPRemoval = totalPInfluent > 0
    ? ((totalPInfluent - effluentTP) / totalPInfluent) * 100
    : 0

  return {
    totalPInfluent,
    orthoPInfluent,
    particulateP,
    ebprEnabled: enableEBPR,
    paoGrowthRate: 0.3, // Typical
    pContent: PHOSPHORUS_KINETICS.paoContent * 100,
    vfaRequired,
    vfaAvailable,
    anaerobicHRT,
    anaerobicVolume,
    bioP,
    chemPEnabled: enableChemP,
    chemical,
    chemicalDose,
    molarRatio,
    chemPRecipitated,
    sludgeIncrease,
    chemicalProperties: chemProps,
    effluentTP,
    effluentOrthoP,
    totalPRemoval,
    chemicalCost,
    alkalinityLoss,
  }
}

// ============================================
// COMPLETE BNR SYSTEM DESIGN
// ============================================

/**
 * Input for BNR system design
 */
export interface BNRDesignInput {
  // Process selection
  processType: BNRProcessType

  // Design basis
  flowRate: number // m³/day
  temperature: number // °C

  // Influent quality
  influent: {
    bod: number
    cod: number
    tss: number
    tkn: number
    ammonia: number
    totalP: number
    alkalinity?: number // mg/L as CaCO3
    rbCOD?: number // Readily biodegradable COD (default 20% of BOD)
    vfa?: number // VFA (default 50% of rbCOD)
  }

  // Target effluent
  target: {
    bod?: number // Default 20
    tss?: number // Default 20
    ammonia?: number // Default 2
    totalN?: number // Default 10
    totalP?: number // Default 1
  }

  // Design parameters (optional)
  mlss?: number // Default 3500
  srt?: number // Optional override
  totalHRT?: number // Optional override
  internalRecycleRatio?: number // Optional override

  // Options
  enableChemP?: boolean
  chemPType?: 'alum' | 'ferric_chloride' | 'ferric_sulfate' | 'lime' | 'pac'
}

/**
 * Design complete BNR system
 */
export function designBNRSystem(input: BNRDesignInput): BNRDesign {
  const processConfig = BNR_PROCESS_CONFIGS[input.processType]
  const issues: DesignIssue[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  const flowRate = safePositive(input.flowRate, 1)

  if (input.flowRate <= 0 || !Number.isFinite(input.flowRate)) {
    issues.push({
      severity: 'critical',
      parameter: 'Flow Rate',
      message: 'Flow rate must be greater than 0',
      currentValue: input.flowRate,
      recommendedValue: 1000,
      unit: 'm³/day',
      suggestion: 'Enter a valid flow rate',
    })
  }

  // Default target values
  const target = {
    bod: input.target.bod ?? 20,
    tss: input.target.tss ?? 20,
    ammonia: input.target.ammonia ?? 2,
    totalN: input.target.totalN ?? 10,
    totalP: input.target.totalP ?? 1,
  }

  // Influent with defaults
  const influent = {
    ...input.influent,
    alkalinity: input.influent.alkalinity ?? 200,
    rbCOD: input.influent.rbCOD ?? input.influent.bod * 0.2,
    vfa: input.influent.vfa ?? input.influent.bod * 0.1,
    codToN: safeDivide(input.influent.cod, input.influent.tkn, 0),
    codToP: safeDivide(input.influent.cod, input.influent.totalP, 0),
  }

  // Default design parameters
  const mlss = input.mlss ?? 3500
  const mlvss = mlss * 0.75

  // Get design criteria from process config
  const [minHRT, maxHRT] = processConfig.designCriteria.totalHRT
  const [minSRT, maxSRT] = processConfig.designCriteria.srt
  const [minMLSS, maxMLSS] = processConfig.designCriteria.mlss

  // Validate MLSS
  if (mlss < minMLSS || mlss > maxMLSS) {
    issues.push({
      severity: 'warning',
      parameter: 'MLSS',
      message: `Outside typical range for ${processConfig.name}`,
      currentValue: mlss,
      recommendedValue: (minMLSS + maxMLSS) / 2,
      unit: 'mg/L',
      suggestion: `Use ${minMLSS}-${maxMLSS} mg/L`,
    })
  }

  // Calculate nitrification parameters
  const nitrification = calculateNitrification({
    tknInfluent: influent.tkn,
    ammoniaInfluent: influent.ammonia,
    targetAmmonia: target.ammonia,
    temperature: input.temperature,
    doOperating: 2.0,
    safetyFactor: 2.0,
  })

  // Use design SRT from nitrification or process criteria
  const srt = input.srt ?? Math.max(nitrification.designSRT, minSRT)

  // Check COD:N ratio for denitrification
  if (influent.codToN < 8 && processConfig.nitrogenRemoval) {
    warnings.push(
      `COD:TKN ratio (${influent.codToN.toFixed(1)}) is low - may need external carbon`
    )
    recommendations.push('Consider adding methanol or other carbon source')
  }

  // Calculate denitrification parameters
  const nitrateProduced = influent.ammonia - target.ammonia
  const targetNitrate = Math.max(0, target.totalN - target.ammonia)

  const denitrification = calculateDenitrification({
    nitrateInfluent: Math.max(0, nitrateProduced),
    targetNitrate,
    temperature: input.temperature,
    mlvss,
    flowRate,
    rbCODInfluent: influent.rbCOD,
    internalRecycleRatio: input.internalRecycleRatio ?? processConfig.recycles.find(r => r.name === 'Internal Recycle')?.typicalRatio ?? 2,
  })

  // Calculate phosphorus removal parameters
  const phosphorusRemoval = calculatePhosphorusRemoval({
    totalPInfluent: influent.totalP,
    targetTP: target.totalP,
    flowRate,
    rbCODInfluent: influent.rbCOD,
    temperature: input.temperature,
    enableEBPR: processConfig.phosphorusRemoval,
    enableChemP: input.enableChemP ?? !processConfig.phosphorusRemoval,
    chemical: input.chemPType ?? 'ferric_chloride',
    anaerobicHRT: processConfig.zones.find(z => z.type === 'anaerobic')?.hrtFraction
      ? (processConfig.zones.find(z => z.type === 'anaerobic')!.hrtFraction * (input.totalHRT ?? (minHRT + maxHRT) / 2))
      : 1.5,
  })

  // Calculate total HRT and volumes
  const totalHRT = input.totalHRT ?? Math.max(minHRT, Math.max(
    denitrification.anoxicHRT / (processConfig.zones.filter(z => z.type === 'anoxic').reduce((sum, z) => sum + z.hrtFraction, 0) || 0.3),
    (minHRT + maxHRT) / 2
  ))

  const totalVolume = (totalHRT * flowRate) / 24

  // Calculate zone volumes and dimensions
  const zones = processConfig.zones.map((zoneConfig) => {
    const volume = totalVolume * zoneConfig.hrtFraction
    const hrt = totalHRT * zoneConfig.hrtFraction

    // Typical depth 4.5m
    const depth = 4.5
    const area = volume / depth
    const length = Math.sqrt(area * 2) // Assume L:W = 2:1
    const width = area / length

    return {
      name: zoneConfig.name,
      type: zoneConfig.type as 'anaerobic' | 'anoxic' | 'aerobic' | 'reaeration',
      volume,
      hrt,
      dimensions: { length, width, depth },
      mixerPower: zoneConfig.type !== 'aerobic' ? volume * 0.005 : undefined, // 5 W/m³ for mixing
      aerationCapacity: zoneConfig.type === 'aerobic' ? calculateAerobicOxygenDemand(
        influent.bod * (flowRate / 1000) * zoneConfig.hrtFraction / 24 * 0.9, // Approximate BOD removed
        nitrification.ammoniaInfluent * (flowRate / 1000) * zoneConfig.hrtFraction / 24 * 0.9
      ) : undefined,
      doSetpoint: (zoneConfig.doRange[0] + zoneConfig.doRange[1]) / 2,
    }
  })

  // Calculate recycle streams
  const recycles = processConfig.recycles.map((recycleConfig) => {
    const ratio = input.internalRecycleRatio ?? recycleConfig.typicalRatio
    const flowRateRecycle = flowRate * ratio
    const pumpCapacity = flowRateRecycle / 24 * 1.2 // m³/h with 20% margin
    const pumpHead = 3 // Typical head (m)
    const pumpPower = (pumpCapacity * pumpHead * 9.81) / (0.7 * 3600) // kW

    return {
      name: recycleConfig.name,
      from: recycleConfig.from,
      to: recycleConfig.to,
      flowRate: flowRateRecycle,
      ratio,
      pumpCapacity,
      pumpHead,
      pumpPower,
    }
  })

  // Calculate overall performance
  const effluentBOD = influent.bod * 0.05 // Typical 95% removal
  const effluentCOD = influent.cod * 0.1
  const effluentTSS = influent.tss * 0.05
  const effluentAmmonia = nitrification.effluentNH3
  const effluentNitrate = denitrification.effluentNO3
  const effluentTN = effluentAmmonia + effluentNitrate + influent.tkn * 0.05 // Some organic N
  const effluentTP = phosphorusRemoval.effluentTP

  const performance = {
    bodRemoval: safeDivide(influent.bod - effluentBOD, influent.bod, 0) * 100,
    codRemoval: safeDivide(influent.cod - effluentCOD, influent.cod, 0) * 100,
    tssRemoval: safeDivide(influent.tss - effluentTSS, influent.tss, 0) * 100,
    tknRemoval: nitrification.nitrificationEfficiency,
    ammoniaRemoval: nitrification.nitrificationEfficiency,
    totalNRemoval: safeDivide(influent.tkn - effluentTN, influent.tkn, 0) * 100,
    totalPRemoval: phosphorusRemoval.totalPRemoval,
  }

  // Calculate oxygen demands
  const bodRemoved = (influent.bod - effluentBOD) * flowRate / 1000
  const carbonaceousO2 = bodRemoved * 1.1
  const nitrogenousO2 = (influent.ammonia - effluentAmmonia) * flowRate / 1000 * 4.57
  const denitrificationCredit = denitrification.o2Savings

  const oxygenDemand = {
    carbonaceous: carbonaceousO2,
    nitrogenous: nitrogenousO2,
    denitrificationCredit,
    totalGross: carbonaceousO2 + nitrogenousO2,
    totalNet: carbonaceousO2 + nitrogenousO2 - denitrificationCredit,
    peakFactor: 1.5,
    peakDemand: (carbonaceousO2 + nitrogenousO2 - denitrificationCredit) * 1.5,
  }

  // Alkalinity balance
  const alkConsumedNit = nitrification.alkalinityRequired
  const alkRecoveredDenit = denitrification.alkalinityRecovered
  const alkConsumedChem = phosphorusRemoval.alkalinityLoss

  const netAlkalinity = influent.alkalinity - alkConsumedNit + alkRecoveredDenit - alkConsumedChem
  const supplementRequired = netAlkalinity < 50 ? (50 - netAlkalinity) * flowRate / 1000 : 0

  const alkalinityBalance = {
    influent: influent.alkalinity,
    consumedNitrification: alkConsumedNit,
    recoveredDenitrification: alkRecoveredDenit,
    consumedChemP: alkConsumedChem,
    netBalance: netAlkalinity,
    supplementRequired,
    chemicalType: 'soda_ash' as const,
    chemicalDose: supplementRequired * 1.06, // Soda ash to CaCO3 ratio
  }

  if (netAlkalinity < 50) {
    warnings.push(`Low alkalinity balance (${netAlkalinity.toFixed(0)} mg/L) - supplement required`)
    recommendations.push(`Add ~${supplementRequired.toFixed(0)} kg/day of alkalinity supplement`)
  }

  // Sludge production
  const heterotrophicYield = 0.5 // kg VSS/kg BOD
  const autotrophicYield = 0.1 // kg VSS/kg N
  const heterotrophic = bodRemoved * heterotrophicYield
  const autotrophic = (influent.ammonia - effluentAmmonia) * flowRate / 1000 * autotrophicYield
  const paoSludge = phosphorusRemoval.bioP.sludgeP / PHOSPHORUS_KINETICS.paoContent
  const chemicalSludge = phosphorusRemoval.sludgeIncrease * flowRate
  const totalVSS = heterotrophic + autotrophic + paoSludge
  const totalTSS = totalVSS / 0.75

  const sludgeProduction = {
    heterotrophic,
    autotrophic,
    paoSludge,
    chemicalSludge,
    totalVSS,
    totalTSS,
    observedYield: safeDivide(totalTSS, bodRemoved, 0),
  }

  // Energy calculations
  const aerobicZones = zones.filter(z => z.type === 'aerobic' || z.type === 'reaeration')
  const anoxicZones = zones.filter(z => z.type === 'anoxic' || z.type === 'anaerobic')

  const aerationPower = oxygenDemand.totalNet / 24 * 1.2 // Approximate kW
  const mixingPower = anoxicZones.reduce((sum, z) => sum + (z.mixerPower || 0), 0)
  const pumpingPower = recycles.reduce((sum, r) => sum + r.pumpPower, 0)
  const totalPower = aerationPower + mixingPower + pumpingPower

  const energy = {
    aerationPower,
    mixingPower,
    pumpingPower,
    totalPower,
    dailyEnergy: totalPower * 24,
    kWhPerM3: safeDivide(totalPower * 24, flowRate, 0),
    kWhPerKgN: safeDivide(totalPower * 24, ((influent.tkn - effluentTN) * flowRate) / 1000, 0),
    kWhPerKgP: safeDivide(totalPower * 24, ((influent.totalP - effluentTP) * flowRate) / 1000, 0),
  }

  // Cost calculations
  const tankCost = totalVolume * 15000 // THB/m³
  const equipmentCost = (aerationPower * 50000 + mixingPower * 30000 + pumpingPower * 40000)
  const chemicalEquipmentCost = phosphorusRemoval.chemPEnabled ? 500000 : 0

  const capitalCost = {
    tanks: tankCost,
    equipment: equipmentCost,
    chemical: chemicalEquipmentCost,
    total: tankCost + equipmentCost + chemicalEquipmentCost,
  }

  const electricityRate = 4.5 // THB/kWh
  const annualEnergy = energy.dailyEnergy * 365 * electricityRate
  const annualChemicals = phosphorusRemoval.chemicalCost * 365 + supplementRequired * 15 * 365
  const sludgeDisposalCost = totalTSS * 365 * 3 // THB/kg
  const laborCost = 12 * 500 * 30 * 12 // 12 hours/day

  const operatingCost = {
    energy: annualEnergy,
    chemicals: annualChemicals,
    sludgeDisposal: sludgeDisposalCost,
    labor: laborCost,
    total: annualEnergy + annualChemicals + sludgeDisposalCost + laborCost,
  }

  const cost = {
    capital: capitalCost,
    operating: operatingCost,
    costPerM3: safeDivide(operatingCost.total, flowRate * 365, 0),
    costPerKgN: safeDivide(operatingCost.total, ((influent.tkn - effluentTN) * flowRate) / 1000 * 365, 0),
    costPerKgP: safeDivide(operatingCost.total, ((influent.totalP - effluentTP) * flowRate) / 1000 * 365, 0),
  }

  // Validation
  const isValid = issues.filter(i => i.severity === 'critical').length === 0 &&
    effluentBOD <= target.bod &&
    effluentTSS <= target.tss &&
    effluentAmmonia <= target.ammonia

  if (effluentTN > target.totalN) {
    issues.push({
      severity: 'warning',
      parameter: 'Total N',
      message: 'Target not achieved',
      currentValue: effluentTN,
      recommendedValue: target.totalN,
      unit: 'mg/L',
      suggestion: 'Increase anoxic volume or internal recycle ratio',
    })
  }

  if (effluentTP > target.totalP) {
    issues.push({
      severity: 'warning',
      parameter: 'Total P',
      message: 'Target not achieved',
      currentValue: effluentTP,
      recommendedValue: target.totalP,
      unit: 'mg/L',
      suggestion: phosphorusRemoval.ebprEnabled
        ? 'Add chemical P precipitation'
        : 'Increase chemical dose',
    })
  }

  return {
    processType: input.processType,
    processConfig,
    flowRate,
    temperature: input.temperature,
    influent,
    target,
    zones,
    totalVolume,
    totalHRT,
    srt,
    mlss,
    mlvss,
    recycles,
    nitrification,
    denitrification,
    phosphorusRemoval,
    performance,
    effluent: {
      bod: effluentBOD,
      cod: effluentCOD,
      tss: effluentTSS,
      ammonia: effluentAmmonia,
      nitrate: effluentNitrate,
      totalN: effluentTN,
      totalP: effluentTP,
    },
    oxygenDemand,
    alkalinityBalance,
    sludgeProduction,
    energy,
    cost,
    validation: {
      isValid,
      issues,
      warnings,
      recommendations,
    },
  }
}

/**
 * Helper function to calculate aerobic oxygen demand
 */
function calculateAerobicOxygenDemand(bodRemoved: number, nOxidized: number): number {
  return bodRemoved * 1.1 + nOxidized * 4.57
}

/**
 * Quick estimation for BNR sizing
 */
export function estimateBNRSizing(
  flowRate: number, // m³/day
  tknInfluent: number, // mg/L
  totalPInfluent: number, // mg/L
  processType: BNRProcessType
): {
  totalVolume: number
  totalHRT: number
  estimatedSRT: number
  estimatedPower: number
} {
  const config = BNR_PROCESS_CONFIGS[processType]
  const avgHRT = (config.designCriteria.totalHRT[0] + config.designCriteria.totalHRT[1]) / 2
  const avgSRT = (config.designCriteria.srt[0] + config.designCriteria.srt[1]) / 2

  const totalVolume = (avgHRT * flowRate) / 24

  // Rough power estimate
  const o2Demand = (200 * 0.9 + tknInfluent * 0.8 * 4.57) * flowRate / 1000 // kg O2/day
  const estimatedPower = o2Demand / 24 * 1.2

  return {
    totalVolume,
    totalHRT: avgHRT,
    estimatedSRT: avgSRT,
    estimatedPower,
  }
}
