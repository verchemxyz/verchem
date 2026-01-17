/**
 * VerChem - ASM2d (Activated Sludge Model No. 2d) Core Calculations
 *
 * Complete implementation of IWA ASM2d with 21 biological processes
 * for biological phosphorus removal with denitrifying PAOs.
 *
 * Reference: Henze et al. (1999) IWA STR No. 9
 *
 * Architecture follows ASM1 pattern for consistency.
 */

import {
  ASM2dStateVariables,
  ASM2dKineticParameters,
  ASM2dStoichiometricParameters,
  ASM2dTemperatureCoefficients,
  ASM2dProcessRate,
  ASM2dProcessType,
  ASM2dReactorConfig,
  ASM2dReactorZone,
  ASM2dSimulationConfig,
  ASM2dSimulationResult,
  ASM2dTimePoint,
  ASM2dEffluentQuality,
  ASM2dPerformanceMetrics,
  ASM2dPAOMetrics,
  ASM2dSludgeProduction,
  ASM2dOxygenDemand,
  ASM2dPhosphorusBalance,
  ASM2dSteadyStateInfo,
  ASM2dConventionalInfluent,
  ASM2dCODFractionation,
  ASM2dNitrogenFractionation,
  ASM2dPhosphorusFractionation,
  ASM2dAllParameters,
  ASM2d_STATE_ORDER,
  ASM2d_COMPONENT_INDEX,
  ASM2d_PROCESS_INDEX,
  ASM2d_NUM_COMPONENTS,
  ASM2d_NUM_PROCESSES,
  DEFAULT_ASM2d_KINETIC_PARAMS,
  DEFAULT_ASM2d_STOICH_PARAMS,
  DEFAULT_ASM2d_TEMP_COEFFS,
  DEFAULT_ASM2d_INITIAL_STATE,
  DEFAULT_DOMESTIC_COD_FRACTIONATION,
  DEFAULT_N_FRACTIONATION,
  DEFAULT_P_FRACTIONATION,
} from '../types/asm2d-model'

import ODESolver from './ode-solver'

// ============================================
// TEMPERATURE CORRECTION
// ============================================

/**
 * Apply Arrhenius temperature correction to kinetic parameters
 * k(T) = k(20) × θ^(T-20)
 *
 * @param baseParams - Parameters at 20°C
 * @param temperature - Actual temperature [°C]
 * @param tempCoeffs - Arrhenius coefficients
 * @returns Temperature-corrected parameters
 */
export function correctTemperature(
  baseParams: ASM2dKineticParameters,
  temperature: number,
  tempCoeffs: ASM2dTemperatureCoefficients = DEFAULT_ASM2d_TEMP_COEFFS
): ASM2dKineticParameters {
  const dT = temperature - 20

  return {
    ...baseParams,

    // Heterotrophs
    muH: baseParams.muH * Math.pow(tempCoeffs.theta_muH, dT),
    bH: baseParams.bH * Math.pow(tempCoeffs.theta_bH, dT),

    // PAO
    qPHA: baseParams.qPHA * Math.pow(tempCoeffs.theta_qPHA, dT),
    qPP: baseParams.qPP * Math.pow(tempCoeffs.theta_qPP, dT),
    muPAO: baseParams.muPAO * Math.pow(tempCoeffs.theta_muPAO, dT),
    bPAO: baseParams.bPAO * Math.pow(tempCoeffs.theta_bPAO, dT),
    bPP: baseParams.bPP * Math.pow(tempCoeffs.theta_bPAO, dT),
    bPHA: baseParams.bPHA * Math.pow(tempCoeffs.theta_bPAO, dT),

    // Autotrophs
    muAUT: baseParams.muAUT * Math.pow(tempCoeffs.theta_muAUT, dT),
    bAUT: baseParams.bAUT * Math.pow(tempCoeffs.theta_bAUT, dT),

    // Hydrolysis
    kh: baseParams.kh * Math.pow(tempCoeffs.theta_kh, dT),

    // Fermentation
    qfe: baseParams.qfe * Math.pow(tempCoeffs.theta_qfe, dT),
  }
}

// ============================================
// SWITCHING FUNCTIONS
// ============================================

/**
 * Monod switching function
 * S / (K + S)
 */
export function monod(S: number, K: number): number {
  const s = Math.max(0, S)
  return s / (K + s + 1e-10)
}

/**
 * Inhibition switching function
 * K / (K + S)
 */
export function inhibition(S: number, K: number): number {
  const s = Math.max(0, S)
  return K / (K + s + 1e-10)
}

/**
 * Saturation inhibition for poly-P storage
 * (KMAX - ratio) / (KIPP + KMAX - ratio)
 * Prevents poly-P storage when already saturated
 */
export function saturationInhibition(
  ratio: number,
  KMAX: number,
  KIPP: number
): number {
  const available = Math.max(0, KMAX - ratio)
  return available / (KIPP + available + 1e-10)
}

/**
 * Check if conditions are anaerobic (no O2, no NO3)
 */
export function isAnaerobic(SO: number, SNO: number, KO: number, KNO: number): boolean {
  return SO < KO && SNO < KNO
}

/**
 * Check if conditions are anoxic (no O2, has NO3)
 */
export function isAnoxic(SO: number, SNO: number, KO: number, KNO: number): boolean {
  return SO < KO && SNO >= KNO
}

/**
 * Check if conditions are aerobic (has O2)
 */
export function isAerobic(SO: number, KO: number): boolean {
  return SO >= KO
}

// ============================================
// PROCESS RATE CALCULATIONS (21 processes)
// ============================================

/**
 * Calculate all 21 process rates
 *
 * @param state - Current state variables
 * @param kinetic - Kinetic parameters (temperature corrected)
 * @param stoich - Stoichiometric parameters
 * @returns Array of process rates with metadata
 */
export function calculateProcessRates(
  state: ASM2dStateVariables,
  kinetic: ASM2dKineticParameters,
  stoich: ASM2dStoichiometricParameters
): { rates: number[]; processRates: ASM2dProcessRate[] } {
  const {
    SI, SF, SA, SO, SNO, SNH, SND, SPO4, SALK,
    XI, XS, XH, XAUT, XPAO, XPHA, XPP, XP, XND
  } = state

  const rates: number[] = new Array(ASM2d_NUM_PROCESSES).fill(0)
  const processRates: ASM2dProcessRate[] = []

  // Safe ratio calculations
  const XS_XH_ratio = XH > 0.1 ? XS / XH : 0
  const XPHA_XPAO_ratio = XPAO > 0.1 ? XPHA / XPAO : 0
  const XPP_XPAO_ratio = XPAO > 0.1 ? XPP / XPAO : 0

  // Common switching functions
  const M_SO = monod(SO, kinetic.KO)
  const I_SO = inhibition(SO, kinetic.KO)
  const M_SNO = monod(SNO, kinetic.KNO)
  const I_SNO = inhibition(SNO, kinetic.KNO)
  const M_SF = monod(SF, kinetic.KS)
  const M_SA_H = monod(SA, kinetic.KSA)
  const M_SNH = monod(SNH, kinetic.KNH)
  const M_SALK = monod(SALK, kinetic.KALK)

  // PAO switching functions
  const M_SA_PAO = monod(SA, kinetic.KA)
  const M_SPO4 = monod(SPO4, kinetic.KP)
  const M_SO_PAO = monod(SO, kinetic.KO_PAO)
  const I_SO_PAO = inhibition(SO, kinetic.KO_PAO)
  const M_SNH_PAO = monod(SNH, kinetic.KNH_PAO)
  const M_XPHA = monod(XPHA_XPAO_ratio, kinetic.KPHA)
  const M_XPP = monod(XPP_XPAO_ratio, kinetic.KPP)
  const I_XPP_sat = saturationInhibition(XPP_XPAO_ratio, kinetic.KMAX, kinetic.KIPP)

  // Hydrolysis switching
  const hydrolysis_base = kinetic.kh * (XS_XH_ratio / (kinetic.KX + XS_XH_ratio + 1e-10)) * XH

  // ========== HYDROLYSIS (ρ1-ρ3) ==========

  // ρ1: Aerobic hydrolysis
  rates[0] = hydrolysis_base * M_SO
  processRates.push({
    process: 'aerobic_hydrolysis',
    name: 'Aerobic Hydrolysis',
    rate: rates[0],
    rateEquation: 'kh × (XS/XH)/(KX+XS/XH) × SO/(KO+SO) × XH',
    isActive: rates[0] > 1e-10,
  })

  // ρ2: Anoxic hydrolysis
  rates[1] = hydrolysis_base * I_SO * M_SNO * kinetic.etaH
  processRates.push({
    process: 'anoxic_hydrolysis',
    name: 'Anoxic Hydrolysis',
    rate: rates[1],
    rateEquation: 'kh × ηH × (XS/XH)/(KX+XS/XH) × KO/(KO+SO) × SNO/(KNO+SNO) × XH',
    isActive: rates[1] > 1e-10,
  })

  // ρ3: Anaerobic hydrolysis
  rates[2] = hydrolysis_base * I_SO * I_SNO * kinetic.etaFe
  processRates.push({
    process: 'anaerobic_hydrolysis',
    name: 'Anaerobic Hydrolysis',
    rate: rates[2],
    rateEquation: 'kh × ηFe × (XS/XH)/(KX+XS/XH) × KO/(KO+SO) × KNO/(KNO+SNO) × XH',
    isActive: rates[2] > 1e-10,
  })

  // ========== HETEROTROPH GROWTH (ρ4-ρ7) ==========

  // ρ4: Aerobic growth on SF
  rates[3] = kinetic.muH * M_SF * M_SO * monod(SNH, kinetic.KNH) * M_SALK * XH
  processRates.push({
    process: 'aerobic_growth_H_SF',
    name: 'Aerobic Growth on SF',
    rate: rates[3],
    rateEquation: 'μH × SF/(KS+SF) × SO/(KO+SO) × SNH/(KNH+SNH) × SALK/(KALK+SALK) × XH',
    isActive: rates[3] > 1e-10,
  })

  // ρ5: Aerobic growth on SA
  rates[4] = kinetic.muH * M_SA_H * M_SO * monod(SNH, kinetic.KNH) * M_SALK * XH
  processRates.push({
    process: 'aerobic_growth_H_SA',
    name: 'Aerobic Growth on SA',
    rate: rates[4],
    rateEquation: 'μH × SA/(KSA+SA) × SO/(KO+SO) × SNH/(KNH+SNH) × SALK/(KALK+SALK) × XH',
    isActive: rates[4] > 1e-10,
  })

  // ρ6: Anoxic growth on SF (denitrification)
  rates[5] = kinetic.muH * kinetic.etaG * M_SF * I_SO * M_SNO * monod(SNH, kinetic.KNH) * M_SALK * XH
  processRates.push({
    process: 'anoxic_growth_H_SF',
    name: 'Anoxic Growth on SF (Denitrification)',
    rate: rates[5],
    rateEquation: 'μH × ηG × SF/(KS+SF) × KO/(KO+SO) × SNO/(KNO+SNO) × XH',
    isActive: rates[5] > 1e-10,
  })

  // ρ7: Anoxic growth on SA (denitrification)
  rates[6] = kinetic.muH * kinetic.etaG * M_SA_H * I_SO * M_SNO * monod(SNH, kinetic.KNH) * M_SALK * XH
  processRates.push({
    process: 'anoxic_growth_H_SA',
    name: 'Anoxic Growth on SA (Denitrification)',
    rate: rates[6],
    rateEquation: 'μH × ηG × SA/(KSA+SA) × KO/(KO+SO) × SNO/(KNO+SNO) × XH',
    isActive: rates[6] > 1e-10,
  })

  // ========== FERMENTATION (ρ8) ==========

  // ρ8: Fermentation (SF → SA under anaerobic conditions)
  rates[7] = kinetic.qfe * monod(SF, kinetic.KFe) * I_SO * I_SNO * M_SALK * XH
  processRates.push({
    process: 'fermentation',
    name: 'Fermentation',
    rate: rates[7],
    rateEquation: 'qfe × SF/(KFe+SF) × KO/(KO+SO) × KNO/(KNO+SNO) × XH',
    isActive: rates[7] > 1e-10,
  })

  // ========== HETEROTROPH LYSIS (ρ9) ==========

  // ρ9: Lysis of XH
  rates[8] = kinetic.bH * XH
  processRates.push({
    process: 'lysis_H',
    name: 'Heterotroph Lysis',
    rate: rates[8],
    rateEquation: 'bH × XH',
    isActive: rates[8] > 1e-10,
  })

  // ========== PAO PROCESSES (ρ10-ρ17) ==========

  // ρ10: Storage of PHA (anaerobic, consumes SA, releases P)
  rates[9] = kinetic.qPHA * M_SA_PAO * M_SALK * M_XPP * I_SO_PAO * I_SNO * XPAO
  processRates.push({
    process: 'storage_PHA',
    name: 'PHA Storage (Anaerobic)',
    rate: rates[9],
    rateEquation: 'qPHA × SA/(KA+SA) × (XPP/XPAO)/(KPP+XPP/XPAO) × I_anaerobic × XPAO',
    isActive: rates[9] > 1e-10,
  })

  // ρ11: Aerobic storage of poly-P (consumes PHA, takes up P)
  rates[10] = kinetic.qPP * M_SO_PAO * M_SPO4 * M_SALK * M_XPHA * I_XPP_sat * XPAO
  processRates.push({
    process: 'aerobic_storage_PP',
    name: 'Poly-P Storage (Aerobic)',
    rate: rates[10],
    rateEquation: 'qPP × SO/(KO+SO) × SPO4/(KP+SPO4) × (XPHA/XPAO)/(KPHA+XPHA/XPAO) × sat_inhib × XPAO',
    isActive: rates[10] > 1e-10,
  })

  // ρ12: Anoxic storage of poly-P (dPAO - key ASM2d feature!)
  rates[11] = kinetic.etaNO3_PAO * kinetic.qPP * I_SO_PAO * M_SNO * M_SPO4 * M_SALK * M_XPHA * I_XPP_sat * XPAO
  processRates.push({
    process: 'anoxic_storage_PP',
    name: 'Poly-P Storage (Anoxic dPAO)',
    rate: rates[11],
    rateEquation: 'ηNO3_PAO × qPP × KO/(KO+SO) × SNO/(KNO+SNO) × SPO4/(KP+SPO4) × ... × XPAO',
    isActive: rates[11] > 1e-10,
  })

  // ρ13: Aerobic growth of PAO (on PHA)
  rates[12] = kinetic.muPAO * M_SO_PAO * M_SNH_PAO * M_SPO4 * M_SALK * M_XPHA * XPAO
  processRates.push({
    process: 'aerobic_growth_PAO',
    name: 'PAO Aerobic Growth',
    rate: rates[12],
    rateEquation: 'μPAO × SO/(KO+SO) × SNH/(KNH+SNH) × SPO4/(KP+SPO4) × (XPHA/XPAO)/(KPHA+XPHA/XPAO) × XPAO',
    isActive: rates[12] > 1e-10,
  })

  // ρ14: Anoxic growth of PAO (dPAO - key ASM2d feature!)
  rates[13] = kinetic.etaNO3_PAO * kinetic.muPAO * I_SO_PAO * M_SNO * M_SNH_PAO * M_SPO4 * M_SALK * M_XPHA * XPAO
  processRates.push({
    process: 'anoxic_growth_PAO',
    name: 'PAO Anoxic Growth (dPAO)',
    rate: rates[13],
    rateEquation: 'ηNO3_PAO × μPAO × KO/(KO+SO) × SNO/(KNO+SNO) × ... × XPAO',
    isActive: rates[13] > 1e-10,
  })

  // ρ15: Lysis of PAO
  rates[14] = kinetic.bPAO * XPAO
  processRates.push({
    process: 'lysis_PAO',
    name: 'PAO Lysis',
    rate: rates[14],
    rateEquation: 'bPAO × XPAO',
    isActive: rates[14] > 1e-10,
  })

  // ρ16: Lysis of poly-P
  rates[15] = kinetic.bPP * XPP
  processRates.push({
    process: 'lysis_PP',
    name: 'Poly-P Lysis',
    rate: rates[15],
    rateEquation: 'bPP × XPP',
    isActive: rates[15] > 1e-10,
  })

  // ρ17: Lysis of PHA
  rates[16] = kinetic.bPHA * XPHA
  processRates.push({
    process: 'lysis_PHA',
    name: 'PHA Lysis',
    rate: rates[16],
    rateEquation: 'bPHA × XPHA',
    isActive: rates[16] > 1e-10,
  })

  // ========== AUTOTROPH PROCESSES (ρ18-ρ19) ==========

  // ρ18: Aerobic growth of autotrophs (nitrification)
  rates[17] = kinetic.muAUT * M_SNH * monod(SO, kinetic.KOA) * M_SALK * XAUT
  processRates.push({
    process: 'aerobic_growth_AUT',
    name: 'Nitrification',
    rate: rates[17],
    rateEquation: 'μAUT × SNH/(KNH+SNH) × SO/(KOA+SO) × SALK/(KALK+SALK) × XAUT',
    isActive: rates[17] > 1e-10,
  })

  // ρ19: Lysis of autotrophs
  rates[18] = kinetic.bAUT * XAUT
  processRates.push({
    process: 'lysis_AUT',
    name: 'Autotroph Lysis',
    rate: rates[18],
    rateEquation: 'bAUT × XAUT',
    isActive: rates[18] > 1e-10,
  })

  // ========== CHEMICAL PRECIPITATION (ρ20-ρ21, optional) ==========

  // ρ20: Precipitation (simplified)
  rates[19] = 0 // Disabled by default
  processRates.push({
    process: 'precipitation',
    name: 'P Precipitation',
    rate: rates[19],
    rateEquation: 'kPRE × SPO4 × XMeOH',
    isActive: false,
  })

  // ρ21: Redissolution (simplified)
  rates[20] = 0 // Disabled by default
  processRates.push({
    process: 'redissolution',
    name: 'P Redissolution',
    rate: rates[20],
    rateEquation: 'kRED × XMeP',
    isActive: false,
  })

  return { rates, processRates }
}

// ============================================
// STOICHIOMETRIC MATRIX (21 × 19)
// ============================================

/**
 * Build the complete stoichiometric matrix
 * Rows: 21 processes
 * Columns: 19 state variables
 *
 * @param stoich - Stoichiometric parameters
 * @returns 21×19 matrix of coefficients
 */
export function buildStoichiometricMatrix(
  stoich: ASM2dStoichiometricParameters
): number[][] {
  const { YH, YAUT, YPAO, YPO4, YPHA, fXI, iXB, iXP, iPB, iPP, fSI } = stoich

  // Initialize matrix with zeros
  const matrix: number[][] = Array.from({ length: ASM2d_NUM_PROCESSES }, () =>
    Array(ASM2d_NUM_COMPONENTS).fill(0)
  )

  // Component indices
  const { SI, SF, SA, SO, SNO, SNH, SND, SPO4, SALK, XI, XS, XH, XAUT, XPAO, XPHA, XPP, XP, XND } = ASM2d_COMPONENT_INDEX

  // ========== HYDROLYSIS (ρ1-ρ3) ==========
  // XS → SF (+ SND from XND)
  for (let p = 0; p <= 2; p++) {
    matrix[p][SI] = fSI
    matrix[p][SF] = 1 - fSI
    matrix[p][XS] = -1
    matrix[p][SND] = 1  // From XND proportionally
    matrix[p][XND] = -1
  }

  // ========== HETEROTROPH GROWTH (ρ4-ρ7) ==========

  // ρ4: Aerobic growth on SF
  matrix[3][SF] = -1 / YH
  matrix[3][SO] = -(1 - YH) / YH
  matrix[3][SNH] = -iXB
  matrix[3][SPO4] = -iPB
  matrix[3][SALK] = -iXB / 14
  matrix[3][XH] = 1

  // ρ5: Aerobic growth on SA
  matrix[4][SA] = -1 / YH
  matrix[4][SO] = -(1 - YH) / YH
  matrix[4][SNH] = -iXB
  matrix[4][SPO4] = -iPB
  matrix[4][SALK] = -iXB / 14
  matrix[4][XH] = 1

  // ρ6: Anoxic growth on SF
  matrix[5][SF] = -1 / YH
  matrix[5][SNO] = -(1 - YH) / (2.86 * YH)
  matrix[5][SNH] = -iXB
  matrix[5][SPO4] = -iPB
  matrix[5][SALK] = (1 - YH) / (14 * 2.86 * YH) - iXB / 14
  matrix[5][XH] = 1

  // ρ7: Anoxic growth on SA
  matrix[6][SA] = -1 / YH
  matrix[6][SNO] = -(1 - YH) / (2.86 * YH)
  matrix[6][SNH] = -iXB
  matrix[6][SPO4] = -iPB
  matrix[6][SALK] = (1 - YH) / (14 * 2.86 * YH) - iXB / 14
  matrix[6][XH] = 1

  // ========== FERMENTATION (ρ8) ==========
  // SF → SA
  matrix[7][SF] = -1
  matrix[7][SA] = 1
  matrix[7][SALK] = 1 / 64  // Alkalinity produced

  // ========== HETEROTROPH LYSIS (ρ9) ==========
  matrix[8][SF] = 1 - fXI
  matrix[8][SPO4] = iPB
  matrix[8][XI] = fXI
  matrix[8][XS] = 1 - fXI
  matrix[8][XH] = -1
  matrix[8][XND] = iXB - fXI * iXP

  // ========== PAO PROCESSES (ρ10-ρ17) ==========

  // ρ10: PHA storage (anaerobic)
  // SA consumed, PHA produced, poly-P consumed, P released
  matrix[9][SA] = -1
  matrix[9][SPO4] = YPO4
  matrix[9][SALK] = YPO4 / 31
  matrix[9][XPHA] = 1
  matrix[9][XPP] = -YPO4

  // ρ11: Aerobic poly-P storage
  // PHA consumed, P taken up, poly-P produced
  matrix[10][SO] = -YPHA
  matrix[10][SPO4] = -1
  matrix[10][SALK] = -1 / 31
  matrix[10][XPHA] = -YPHA
  matrix[10][XPP] = 1

  // ρ12: Anoxic poly-P storage (dPAO)
  matrix[11][SNO] = -YPHA / 2.86
  matrix[11][SPO4] = -1
  matrix[11][SALK] = YPHA / (14 * 2.86) - 1 / 31
  matrix[11][XPHA] = -YPHA
  matrix[11][XPP] = 1

  // ρ13: Aerobic PAO growth
  matrix[12][SO] = -(1 - YPAO) / YPAO
  matrix[12][SNH] = -iXB
  matrix[12][SPO4] = -iPB
  matrix[12][SALK] = -iXB / 14
  matrix[12][XPAO] = 1
  matrix[12][XPHA] = -1 / YPAO

  // ρ14: Anoxic PAO growth (dPAO)
  matrix[13][SNO] = -(1 - YPAO) / (2.86 * YPAO)
  matrix[13][SNH] = -iXB
  matrix[13][SPO4] = -iPB
  matrix[13][SALK] = (1 - YPAO) / (14 * 2.86 * YPAO) - iXB / 14
  matrix[13][XPAO] = 1
  matrix[13][XPHA] = -1 / YPAO

  // ρ15: PAO lysis
  matrix[14][SF] = 1 - fXI
  matrix[14][SPO4] = iPB
  matrix[14][XI] = fXI
  matrix[14][XS] = 1 - fXI
  matrix[14][XPAO] = -1
  matrix[14][XND] = iXB - fXI * iXP

  // ρ16: Poly-P lysis
  matrix[15][SPO4] = 1
  matrix[15][SALK] = 1 / 31
  matrix[15][XPP] = -1

  // ρ17: PHA lysis
  matrix[16][SA] = 1
  matrix[16][XPHA] = -1

  // ========== AUTOTROPH PROCESSES (ρ18-ρ19) ==========

  // ρ18: Nitrification
  matrix[17][SO] = -(4.57 - YAUT) / YAUT
  matrix[17][SNO] = 1 / YAUT
  matrix[17][SNH] = -iXB - 1 / YAUT
  matrix[17][SPO4] = -iPB
  matrix[17][SALK] = -iXB / 14 - 1 / (7 * YAUT)
  matrix[17][XAUT] = 1

  // ρ19: Autotroph lysis
  matrix[18][SF] = 1 - fXI
  matrix[18][SPO4] = iPB
  matrix[18][XI] = fXI
  matrix[18][XS] = 1 - fXI
  matrix[18][XAUT] = -1
  matrix[18][XND] = iXB - fXI * iXP

  // ρ20-21: Chemical precipitation (disabled)
  // matrix[19] and matrix[20] remain zeros

  return matrix
}

/**
 * Get a specific stoichiometric coefficient
 */
export function getStoichiometricCoefficient(
  matrix: number[][],
  processIndex: number,
  componentIndex: number
): number {
  if (processIndex < 0 || processIndex >= ASM2d_NUM_PROCESSES) return 0
  if (componentIndex < 0 || componentIndex >= ASM2d_NUM_COMPONENTS) return 0
  return matrix[processIndex][componentIndex]
}

// ============================================
// STATE CONVERSION UTILITIES
// ============================================

/**
 * Convert state object to array
 */
export function stateToArray(state: ASM2dStateVariables): number[] {
  return ASM2d_STATE_ORDER.map(key => Math.max(0, state[key]))
}

/**
 * Convert array to state object
 */
export function arrayToState(array: number[]): ASM2dStateVariables {
  const state: Partial<ASM2dStateVariables> = {}
  ASM2d_STATE_ORDER.forEach((key, i) => {
    state[key] = Math.max(0, array[i] || 0)
  })
  return state as ASM2dStateVariables
}

// ============================================
// DERIVATIVE CALCULATIONS
// ============================================

/**
 * Calculate derivatives for all state variables
 * dCi/dt = Σ(νij × ρj)
 *
 * @param state - Current state
 * @param kinetic - Kinetic parameters
 * @param stoich - Stoichiometric parameters
 * @returns Array of derivatives (19 elements)
 */
export function calculateDerivatives(
  state: ASM2dStateVariables,
  kinetic: ASM2dKineticParameters,
  stoich: ASM2dStoichiometricParameters
): number[] {
  const { rates } = calculateProcessRates(state, kinetic, stoich)
  const matrix = buildStoichiometricMatrix(stoich)

  const derivatives = new Array(ASM2d_NUM_COMPONENTS).fill(0)

  for (let i = 0; i < ASM2d_NUM_COMPONENTS; i++) {
    for (let j = 0; j < ASM2d_NUM_PROCESSES; j++) {
      derivatives[i] += matrix[j][i] * rates[j]
    }
  }

  return derivatives
}

/**
 * Calculate derivatives for CSTR with flow
 * dCi/dt = (Cin - C)/HRT + Σ(νij × ρj)
 */
export function calculateCSTRDerivatives(
  state: ASM2dStateVariables,
  influent: ASM2dStateVariables,
  hrt: number,  // hours
  kinetic: ASM2dKineticParameters,
  stoich: ASM2dStoichiometricParameters,
  zoneType: 'anaerobic' | 'anoxic' | 'aerobic' = 'aerobic',
  targetDO: number = 2.0
): number[] {
  // Get biological reaction derivatives
  const bioDerivatives = calculateDerivatives(state, kinetic, stoich)

  // Get state arrays
  const stateArray = stateToArray(state)
  const influentArray = stateToArray(influent)

  // HRT in days for consistent units
  const hrtDays = hrt / 24

  // Combined derivatives
  const derivatives = new Array(ASM2d_NUM_COMPONENTS).fill(0)

  for (let i = 0; i < ASM2d_NUM_COMPONENTS; i++) {
    // Flow term + biological term
    derivatives[i] = (influentArray[i] - stateArray[i]) / hrtDays + bioDerivatives[i]
  }

  // Special handling for DO based on zone type
  const SO_index = ASM2d_COMPONENT_INDEX.SO
  if (zoneType === 'anaerobic' || zoneType === 'anoxic') {
    // Assume perfect mixing, DO approaches 0
    derivatives[SO_index] = (0 - state.SO) / hrtDays + bioDerivatives[SO_index]
  } else {
    // Aerobic: assume aeration maintains target DO
    derivatives[SO_index] = (targetDO - state.SO) / hrtDays + bioDerivatives[SO_index]
  }

  return derivatives
}

// ============================================
// INFLUENT FRACTIONATION
// ============================================

/**
 * Convert conventional influent parameters to ASM2d state variables
 */
export function fractionateInfluent(
  conventional: ASM2dConventionalInfluent,
  codFrac: ASM2dCODFractionation = DEFAULT_DOMESTIC_COD_FRACTIONATION,
  nFrac: ASM2dNitrogenFractionation = DEFAULT_N_FRACTIONATION,
  pFrac: ASM2dPhosphorusFractionation = DEFAULT_P_FRACTIONATION
): ASM2dStateVariables {
  const { COD, TKN, NH4N, TP, PO4P, VFA, alkalinity } = conventional

  // COD fractionation
  const SI = COD * codFrac.fSI
  const SF = VFA ? COD * codFrac.fSF : COD * (codFrac.fSF + codFrac.fSA)
  const SA = VFA || COD * codFrac.fSA
  const XI = COD * codFrac.fXI
  const XS = COD * codFrac.fXS

  // Nitrogen fractionation
  const organicN = TKN - NH4N
  const SNH = NH4N
  const SND = organicN * nFrac.fSND / (nFrac.fSND + nFrac.fXND)
  const XND = organicN * nFrac.fXND / (nFrac.fSND + nFrac.fXND)

  // Phosphorus fractionation
  const SPO4 = PO4P || TP * pFrac.fSPO4

  // Alkalinity (convert mg CaCO3/L to mole HCO3/m³)
  const SALK = alkalinity * 0.01

  return {
    SI,
    SF,
    SA,
    SO: 0,        // Influent typically has no DO
    SNO: 0,       // Assume no nitrate in influent
    SNH,
    SND,
    SPO4,
    SALK,
    XI,
    XS,
    XH: 0,        // No biomass in influent
    XAUT: 0,
    XPAO: 0,
    XPHA: 0,
    XPP: 0,
    XP: 0,
    XND,
  }
}

// ============================================
// EFFLUENT QUALITY
// ============================================

/**
 * Calculate effluent quality from final state
 */
export function calculateEffluentQuality(
  state: ASM2dStateVariables,
  clarifierEfficiency: number = 0.95
): ASM2dEffluentQuality {
  // Soluble components pass through
  const sCOD = state.SI + state.SF + state.SA

  // Particulate components partially removed by clarifier
  const pCOD = (state.XI + state.XS + state.XH + state.XAUT + state.XPAO + state.XPHA + state.XP) * (1 - clarifierEfficiency)

  // Total COD
  const COD = sCOD + pCOD

  // BOD5 (approximation)
  const BOD5 = state.SF + state.SA + 0.4 * state.XS * (1 - clarifierEfficiency)

  // Suspended solids
  const VSS = (state.XI + state.XS + state.XH + state.XAUT + state.XPAO + state.XPHA + state.XP) * (1 - clarifierEfficiency) / 1.42
  const TSS = VSS / 0.8

  // Nitrogen
  const NH4N = state.SNH
  const NO3N = state.SNO
  const organicN = state.SND + state.XND * (1 - clarifierEfficiency)
  const TKN = NH4N + organicN
  const TN = TKN + NO3N

  // Phosphorus
  const PO4P = state.SPO4
  const particulateP = (state.XPP + (state.XH + state.XAUT + state.XPAO) * 0.02) * (1 - clarifierEfficiency)
  const TP = PO4P + particulateP

  return {
    COD,
    sCOD,
    BOD5,
    TSS,
    VSS,
    TKN,
    NH4N,
    NO3N,
    TN,
    TP,
    PO4P,
  }
}

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Calculate treatment performance
 */
export function calculatePerformance(
  influent: ASM2dConventionalInfluent,
  effluent: ASM2dEffluentQuality
): ASM2dPerformanceMetrics {
  const bodRemoval = ((influent.BOD5 - effluent.BOD5) / influent.BOD5) * 100
  const codRemoval = ((influent.COD - effluent.COD) / influent.COD) * 100
  const tssRemoval = ((influent.TSS - effluent.TSS) / influent.TSS) * 100
  const nh4Removal = ((influent.NH4N - effluent.NH4N) / influent.NH4N) * 100
  const tnRemoval = ((influent.TKN - effluent.TN) / influent.TKN) * 100
  const tpRemoval = ((influent.TP - effluent.TP) / influent.TP) * 100

  // Estimate biological vs chemical P removal
  const bioPRemoval = tpRemoval // Simplified - all biological in default mode

  return {
    bodRemoval: Math.max(0, Math.min(100, bodRemoval)),
    codRemoval: Math.max(0, Math.min(100, codRemoval)),
    tssRemoval: Math.max(0, Math.min(100, tssRemoval)),
    nh4Removal: Math.max(0, Math.min(100, nh4Removal)),
    tnRemoval: Math.max(0, Math.min(100, tnRemoval)),
    tpRemoval: Math.max(0, Math.min(100, tpRemoval)),
    bioPRemoval: Math.max(0, Math.min(100, bioPRemoval)),
    chemPRemoval: 0,
  }
}

// ============================================
// PAO METRICS
// ============================================

/**
 * Calculate PAO population metrics
 */
export function calculatePAOMetrics(
  state: ASM2dStateVariables,
  processRates: ASM2dProcessRate[]
): ASM2dPAOMetrics {
  const activeBiomass = state.XH + state.XAUT + state.XPAO

  const phaRatio = state.XPAO > 0.1 ? state.XPHA / state.XPAO : 0
  const ppRatio = state.XPAO > 0.1 ? state.XPP / state.XPAO : 0

  // Estimate dPAO activity from anoxic process rates
  const anoxicPPStorage = processRates.find(p => p.process === 'anoxic_storage_PP')?.rate || 0
  const aerobicPPStorage = processRates.find(p => p.process === 'aerobic_storage_PP')?.rate || 0
  const totalPPStorage = anoxicPPStorage + aerobicPPStorage
  const dpaoActivity = totalPPStorage > 0 ? (anoxicPPStorage / totalPPStorage) * 100 : 0

  // P release/uptake rates
  const phaStorage = processRates.find(p => p.process === 'storage_PHA')?.rate || 0
  const pReleaseRate = state.XPAO > 0.1 ? phaStorage * 0.4 / state.XPAO : 0 // YPO4 = 0.4
  const pUptakeRate = state.XPAO > 0.1 ? (aerobicPPStorage + anoxicPPStorage) / state.XPAO : 0

  return {
    XPAO: state.XPAO,
    paoFraction: activeBiomass > 0 ? (state.XPAO / activeBiomass) * 100 : 0,
    phaRatio,
    ppRatio,
    dpaoActivity,
    pReleaseRate,
    pUptakeRate,
  }
}

// ============================================
// SLUDGE PRODUCTION
// ============================================

/**
 * Calculate sludge production metrics
 */
export function calculateSludgeProduction(
  state: ASM2dStateVariables,
  reactorVolume: number,
  srt: number,
  flowRate: number
): ASM2dSludgeProduction {
  // Total VSS in reactor (COD to VSS: 1.42 g COD/g VSS)
  const totalCOD = state.XI + state.XS + state.XH + state.XAUT + state.XPAO + state.XPHA + state.XP
  const totalVSS = totalCOD / 1.42

  // TSS (assuming 80% volatile)
  const totalTSS = totalVSS / 0.8

  // Wastage rate
  const wastageRate = reactorVolume / srt * totalTSS / 1000 // kg TSS/d

  // P content in sludge
  const pInBiomass = (state.XH + state.XAUT + state.XPAO) * 0.02 // iPB
  const pInPP = state.XPP
  const totalP = pInBiomass + pInPP
  const pContent = totalTSS > 0 ? (totalP / totalTSS) * 100 : 0

  // Sludge production
  const production = wastageRate

  // Observed yield (simplified)
  const yieldObserved = 0.4 // Typical value

  return {
    totalVSS,
    totalTSS,
    yieldObserved,
    wastageRate,
    pContent,
    production,
  }
}

// ============================================
// OXYGEN DEMAND
// ============================================

/**
 * Calculate oxygen demand
 */
export function calculateOxygenDemand(
  state: ASM2dStateVariables,
  processRates: ASM2dProcessRate[],
  stoich: ASM2dStoichiometricParameters,
  flowRate: number,
  volume: number
): ASM2dOxygenDemand {
  // Get process rates
  const rates: Record<string, number> = {}
  processRates.forEach(pr => {
    rates[pr.process] = pr.rate
  })

  // Carbonaceous oxygen demand
  const aerobicGrowthSF = rates['aerobic_growth_H_SF'] || 0
  const aerobicGrowthSA = rates['aerobic_growth_H_SA'] || 0
  const aerobicPAOGrowth = rates['aerobic_growth_PAO'] || 0
  const aerobicPPStorage = rates['aerobic_storage_PP'] || 0

  const ourC = ((1 - stoich.YH) / stoich.YH) * (aerobicGrowthSF + aerobicGrowthSA) +
               ((1 - stoich.YPAO) / stoich.YPAO) * aerobicPAOGrowth +
               stoich.YPHA * aerobicPPStorage

  // Nitrogenous oxygen demand
  const nitrification = rates['aerobic_growth_AUT'] || 0
  const ourN = ((4.57 - stoich.YAUT) / stoich.YAUT) * nitrification

  // Convert to kg O2/d
  const carbonaceous = ourC * volume / 1000
  const nitrogenous = ourN * volume / 1000
  const total = carbonaceous + nitrogenous

  // Specific oxygen demand
  const codRemoved = flowRate * 400 * 0.9 / 1000 // Approximate kg COD/d removed
  const specific = codRemoved > 0 ? total / codRemoved : 0

  return {
    carbonaceous,
    nitrogenous,
    total,
    specific,
    alpha: 0.8, // Typical value
  }
}

// ============================================
// PHOSPHORUS BALANCE
// ============================================

/**
 * Calculate phosphorus mass balance
 */
export function calculatePhosphorusBalance(
  influent: ASM2dConventionalInfluent,
  effluent: ASM2dEffluentQuality,
  sludge: ASM2dSludgeProduction
): ASM2dPhosphorusBalance {
  const influentLoad = influent.flowRate * influent.TP / 1000 // kg P/d
  const effluentLoad = influent.flowRate * effluent.TP / 1000 // kg P/d
  const sludgeP = sludge.wastageRate * (sludge.pContent / 100) // kg P/d

  const bioP = influentLoad - effluentLoad - sludgeP
  const closure = influentLoad > 0 ? ((influentLoad - effluentLoad - sludgeP) / influentLoad) * 100 : 100

  return {
    influentLoad,
    effluentLoad,
    sludgeP: Math.max(0, sludgeP),
    bioP: Math.max(0, bioP),
    chemP: 0,
    closure: Math.abs(closure),
  }
}

// ============================================
// STEADY STATE SOLVER
// ============================================

/**
 * Solve for steady state using iterative approach
 */
export function calculateSteadyState(
  influent: ASM2dStateVariables,
  hrt: number, // hours
  kinetic: ASM2dKineticParameters,
  stoich: ASM2dStoichiometricParameters,
  initialState: ASM2dStateVariables = DEFAULT_ASM2d_INITIAL_STATE,
  zoneType: 'anaerobic' | 'anoxic' | 'aerobic' = 'aerobic',
  targetDO: number = 2.0,
  maxIterations: number = 10000,
  tolerance: number = 1e-6
): { state: ASM2dStateVariables; converged: boolean; iterations: number } {
  let state = { ...initialState }
  let prevState = { ...state }
  let converged = false

  const dt = 0.01 // Time step in days

  for (let i = 0; i < maxIterations; i++) {
    const derivatives = calculateCSTRDerivatives(state, influent, hrt, kinetic, stoich, zoneType, targetDO)
    const stateArray = stateToArray(state)

    // Euler step
    const newArray = stateArray.map((val, idx) => Math.max(0, val + derivatives[idx] * dt))
    state = arrayToState(newArray)

    // Check convergence
    if (i % 100 === 0 && i > 0) {
      const maxChange = Math.max(...ASM2d_STATE_ORDER.map(key =>
        Math.abs(state[key] - prevState[key]) / (prevState[key] + 1e-10)
      ))

      if (maxChange < tolerance) {
        converged = true
        break
      }
      prevState = { ...state }
    }
  }

  return { state, converged, iterations: maxIterations }
}

// ============================================
// MULTI-ZONE SIMULATION
// ============================================

/**
 * Simulate multi-zone reactor (A2O, etc.)
 */
export function simulateMultiZone(
  influent: ASM2dStateVariables,
  zones: ASM2dReactorZone[],
  kinetic: ASM2dKineticParameters,
  stoich: ASM2dStoichiometricParameters,
  recirculation: { internal: number; ras: number },
  initialStates?: Record<string, ASM2dStateVariables>
): Record<string, ASM2dStateVariables> {
  const zoneStates: Record<string, ASM2dStateVariables> = {}

  // Initialize zone states
  zones.forEach(zone => {
    zoneStates[zone.id] = initialStates?.[zone.id] || { ...DEFAULT_ASM2d_INITIAL_STATE }
  })

  // Iterative solution with recycles
  for (let iter = 0; iter < 100; iter++) {
    let currentInfluent = { ...influent }

    // Mix with RAS from last aerobic zone
    const lastZone = zones[zones.length - 1]
    const rasState = zoneStates[lastZone.id]
    const rasFactor = recirculation.ras / (1 + recirculation.ras)

    ASM2d_STATE_ORDER.forEach(key => {
      currentInfluent[key] = currentInfluent[key] * (1 - rasFactor) + rasState[key] * rasFactor
    })

    // Process each zone
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i]
      const hrt = zone.hrt || (zone.volume / (1000 / 24)) // Approximate HRT

      // Add internal recycle to anoxic zone (from aerobic)
      if (zone.type === 'anoxic' && recirculation.internal > 0) {
        const aerobicZone = zones.find(z => z.type === 'aerobic')
        if (aerobicZone) {
          const irState = zoneStates[aerobicZone.id]
          const irFactor = recirculation.internal / (1 + recirculation.internal)
          ASM2d_STATE_ORDER.forEach(key => {
            currentInfluent[key] = currentInfluent[key] * (1 - irFactor) + irState[key] * irFactor
          })
        }
      }

      // Solve zone
      const result = calculateSteadyState(
        currentInfluent,
        hrt,
        kinetic,
        stoich,
        zoneStates[zone.id],
        zone.type,
        zone.targetDO || 0,
        1000,
        1e-5
      )

      zoneStates[zone.id] = result.state
      currentInfluent = result.state
    }
  }

  return zoneStates
}

// ============================================
// MAIN SIMULATION FUNCTION
// ============================================

/**
 * Run complete ASM2d simulation
 */
export function runASM2dSimulation(
  config: ASM2dSimulationConfig,
  reactor: ASM2dReactorConfig,
  conventional: ASM2dConventionalInfluent,
  params: ASM2dAllParameters = {
    kinetic: DEFAULT_ASM2d_KINETIC_PARAMS,
    stoich: DEFAULT_ASM2d_STOICH_PARAMS,
    tempCoeffs: DEFAULT_ASM2d_TEMP_COEFFS,
  }
): ASM2dSimulationResult {
  const startTime = Date.now()
  const warnings: string[] = []
  const errors: string[] = []

  // Temperature correct kinetic parameters
  const kinetic = correctTemperature(params.kinetic, reactor.temperature, params.tempCoeffs)
  const stoich = params.stoich

  // Fractionate influent
  const influent = fractionateInfluent(conventional)

  // Initialize result
  const timeSeries: ASM2dTimePoint[] = []
  let finalState: ASM2dStateVariables
  let zoneStates: Record<string, ASM2dStateVariables> | undefined

  if (config.mode === 'steady_state') {
    // Multi-zone steady state
    zoneStates = simulateMultiZone(
      influent,
      reactor.zones,
      kinetic,
      stoich,
      reactor.recirculation
    )

    // Final state is last zone
    const lastZone = reactor.zones[reactor.zones.length - 1]
    finalState = zoneStates[lastZone.id]

    // Single time point
    const { processRates } = calculateProcessRates(finalState, kinetic, stoich)
    timeSeries.push({
      time: 0,
      state: finalState,
      processRates,
      zoneStates,
    })
  } else {
    // Dynamic simulation
    const state = config.initialState

    const derivativeFunc = (t: number, y: number[]): number[] => {
      const currentState = arrayToState(y)
      // Simplified: use single zone (aerobic) for dynamic
      return calculateCSTRDerivatives(
        currentState,
        influent,
        reactor.totalHRT,
        kinetic,
        stoich,
        'aerobic',
        2.0
      )
    }

    // Create and run ODE solver
    const solver = new ODESolver(derivativeFunc, {
      method: config.solver,
      tolerance: config.tolerance,
    })

    const solution = solver.solve(
      stateToArray(state),
      config.startTime,
      config.endTime,
      config.timeStep
    )

    // Build time series
    const outputStep = Math.max(1, Math.floor(config.outputInterval / config.timeStep))
    for (let i = 0; i < solution.states.length; i += outputStep) {
      const stateArray = solution.states[i]
      const time = solution.times[i]
      if (stateArray && time !== undefined) {
        const currentState = arrayToState(stateArray)
        const { processRates } = calculateProcessRates(currentState, kinetic, stoich)
        timeSeries.push({
          time,
          state: currentState,
          processRates,
        })
      }
    }

    const lastState = solution.states[solution.states.length - 1]
    finalState = lastState ? arrayToState(lastState) : config.initialState
  }

  // Calculate metrics
  const { processRates } = calculateProcessRates(finalState, kinetic, stoich)
  const effluentQuality = calculateEffluentQuality(finalState)
  const performance = calculatePerformance(conventional, effluentQuality)
  const paoMetrics = calculatePAOMetrics(finalState, processRates)
  const sludgeProduction = calculateSludgeProduction(
    finalState,
    reactor.totalVolume,
    reactor.srt,
    conventional.flowRate
  )
  const oxygenDemand = calculateOxygenDemand(
    finalState,
    processRates,
    stoich,
    conventional.flowRate,
    reactor.totalVolume
  )
  const phosphorusBalance = calculatePhosphorusBalance(conventional, effluentQuality, sludgeProduction)

  // Steady state detection
  const steadyState: ASM2dSteadyStateInfo = {
    reached: config.mode === 'steady_state',
    timeToSteadyState: config.mode === 'steady_state' ? 0 : undefined,
    maxVariation: 0,
    convergenceMetric: 0,
  }

  const executionTime = Date.now() - startTime

  return {
    config,
    reactor,
    timeSeries,
    finalState,
    zoneStates,
    effluentQuality,
    performance,
    paoMetrics,
    sludgeProduction,
    oxygenDemand,
    phosphorusBalance,
    steadyState,
    computation: {
      totalSteps: timeSeries.length,
      executionTime,
      warnings,
      errors,
    },
  }
}

// ============================================
// RE-EXPORTS (Types from types file)
// ============================================

export type {
  ASM2dStateVariables,
  ASM2dKineticParameters,
  ASM2dStoichiometricParameters,
  ASM2dProcessRate,
  ASM2dSimulationResult,
} from '../types/asm2d-model'
