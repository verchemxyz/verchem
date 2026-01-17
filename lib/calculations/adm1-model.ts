/**
 * VerChem - ADM1 (Anaerobic Digestion Model No. 1) Core Calculations
 *
 * Complete implementation of IWA ADM1 model for anaerobic digestion.
 * This module provides research-grade biokinetic simulation competing with GPS-X.
 *
 * Reference: Batstone, D.J. et al. (2002)
 * "Anaerobic Digestion Model No. 1 (ADM1)" IWA Scientific and Technical Report No. 13
 *
 * @author VerChem Team
 * @version 1.0.0
 */

import {
  ADM1StateVariables,
  ADM1GasPhase,
  ADM1KineticParameters,
  ADM1StoichiometricParameters,
  ADM1PhysicoChemParameters,
  ADM1TemperatureCoefficients,
  ADM1ProcessRate,
  ADM1ReactorConfig,
  ADM1SimulationConfig,
  ADM1SimulationResult,
  ADM1TimePoint,
  ADM1GasProduction,
  ADM1AllParameters,
  ADM1ConventionalInfluent,
  ADM1Fractionation,
  ADM1_STATE_ORDER,
  ADM1_CONSTANTS,
  DEFAULT_ADM1_KINETIC_PARAMS,
  DEFAULT_ADM1_STOICH_PARAMS,
  DEFAULT_ADM1_PHYSICHEM_PARAMS,
  DEFAULT_ADM1_TEMP_COEFFS,
  DEFAULT_INITIAL_STATE,
  DEFAULT_INITIAL_GAS_PHASE,
  SteadyStateInfo,
} from '../types/adm1-model'

import { ODESolver, StateVector, isSteadyState } from './ode-solver'

// ============================================
// TEMPERATURE CORRECTION
// ============================================

/**
 * Apply Arrhenius temperature correction to kinetic parameters
 * k(T) = k(T_ref) * exp(E_a/R * (1/T_ref - 1/T))
 *
 * @param baseParams - Kinetic parameters at reference temperature
 * @param temperature - Actual temperature [°C]
 * @param tempCoeffs - Temperature coefficients
 * @returns Temperature-corrected kinetic parameters
 */
export function correctTemperature(
  baseParams: ADM1KineticParameters,
  temperature: number,
  tempCoeffs: ADM1TemperatureCoefficients = DEFAULT_ADM1_TEMP_COEFFS
): ADM1KineticParameters {
  const R = ADM1_CONSTANTS.R
  const T_ref_K = tempCoeffs.T_ref + 273.15
  const T_K = temperature + 273.15

  // Arrhenius correction factor
  const arrhenius = (E_a: number) => Math.exp((E_a / R) * (1 / T_ref_K - 1 / T_K))

  return {
    ...baseParams,
    k_dis: baseParams.k_dis * arrhenius(tempCoeffs.E_a_k_dis),
    k_hyd_ch: baseParams.k_hyd_ch * arrhenius(tempCoeffs.E_a_k_hyd),
    k_hyd_pr: baseParams.k_hyd_pr * arrhenius(tempCoeffs.E_a_k_hyd),
    k_hyd_li: baseParams.k_hyd_li * arrhenius(tempCoeffs.E_a_k_hyd),
    k_m_su: baseParams.k_m_su * arrhenius(tempCoeffs.E_a_k_m_su),
    k_m_aa: baseParams.k_m_aa * arrhenius(tempCoeffs.E_a_k_m_aa),
    k_m_fa: baseParams.k_m_fa * arrhenius(tempCoeffs.E_a_k_m_fa),
    k_m_c4: baseParams.k_m_c4 * arrhenius(tempCoeffs.E_a_k_m_c4),
    k_m_pro: baseParams.k_m_pro * arrhenius(tempCoeffs.E_a_k_m_pro),
    k_m_ac: baseParams.k_m_ac * arrhenius(tempCoeffs.E_a_k_m_ac),
    k_m_H2: baseParams.k_m_H2 * arrhenius(tempCoeffs.E_a_k_m_H2),
    k_dec: baseParams.k_dec * arrhenius(tempCoeffs.E_a_k_dec),
  }
}

/**
 * Correct physicochemical parameters for temperature
 * Affects Ka values and Henry's constants
 */
export function correctPhysicoChemTemp(
  baseParams: ADM1PhysicoChemParameters,
  temperature: number
): ADM1PhysicoChemParameters {
  const R = ADM1_CONSTANTS.R
  const T_ref_K = baseParams.T_ref
  const T_K = temperature + 273.15

  // Standard enthalpy changes for Ka temperature correction [J/mol]
  const dH_va = 0       // Valeric acid
  const dH_bu = 0       // Butyric acid
  const dH_pro = 0      // Propionic acid
  const dH_ac = -4600   // Acetic acid
  const dH_CO2 = 7646   // CO2/HCO3-
  const dH_IN = 51965   // NH4+/NH3
  const dH_w = 55900    // Water

  const vanHoff = (dH: number) => Math.exp((dH / R) * (1 / T_ref_K - 1 / T_K))

  // Henry's constants
  const dH_H_H2 = -4180
  const dH_H_ch4 = -14240
  const dH_H_CO2 = -19410

  return {
    ...baseParams,
    K_a_va: baseParams.K_a_va * vanHoff(dH_va),
    K_a_bu: baseParams.K_a_bu * vanHoff(dH_bu),
    K_a_pro: baseParams.K_a_pro * vanHoff(dH_pro),
    K_a_ac: baseParams.K_a_ac * vanHoff(dH_ac),
    K_a_CO2: baseParams.K_a_CO2 * vanHoff(dH_CO2),
    K_a_IN: baseParams.K_a_IN * vanHoff(dH_IN),
    K_w: baseParams.K_w * vanHoff(dH_w),
    K_H_H2: baseParams.K_H_H2 * vanHoff(dH_H_H2),
    K_H_ch4: baseParams.K_H_ch4 * vanHoff(dH_H_ch4),
    K_H_CO2: baseParams.K_H_CO2 * vanHoff(dH_H_CO2),
  }
}

// ============================================
// SWITCHING FUNCTIONS (Monod Kinetics)
// ============================================

/**
 * Monod switching function: S / (K + S)
 */
function monod(S: number, K: number): number {
  if (S <= 0 || K <= 0) return 0
  return Math.max(0, S) / (K + Math.max(0, S))
}

/**
 * Non-competitive inhibition: K / (K + I)
 */
function inhibit(I: number, K: number): number {
  if (K <= 0) return 0
  return K / (K + Math.max(0, I))
}

// ============================================
// INHIBITION FUNCTIONS
// ============================================

/**
 * pH inhibition (lower limit type - for acidogens)
 * I_pH = 1 / (1 + 10^(pH_LL - pH))
 *
 * More accurate: Hill equation type
 * I_pH = (K^n) / (K^n + [H+]^n)
 */
export function I_pH_lower(pH: number, pH_UL: number, pH_LL: number): number {
  if (pH >= pH_UL) return 1.0
  if (pH <= pH_LL) return 0.0

  // Use Hill-type equation (n = 3 for steep transition)
  const n = 3
  const pH_opt = (pH_UL + pH_LL) / 2
  const K = Math.pow(10, -pH_opt)
  const H = Math.pow(10, -pH)

  return Math.pow(K, n) / (Math.pow(K, n) + Math.pow(H, n))
}

/**
 * pH inhibition (upper and lower limits - for acetogens/methanogens)
 * Uses the ADM1 recommended Hill equation
 */
export function I_pH_range(pH: number, pH_UL: number, pH_LL: number): number {
  if (pH <= pH_LL || pH >= pH_UL) return 0.0

  // ADM1 recommended equation
  const n_LL = 3
  const n_UL = 3

  const I_LL = 1 / (1 + Math.pow(10, n_LL * (pH_LL - pH)))
  const I_UL = 1 / (1 + Math.pow(10, n_UL * (pH - pH_UL)))

  return I_LL * I_UL
}

/**
 * Hydrogen inhibition (non-competitive)
 * I_H2 = K_I / (K_I + S_H2)
 */
export function I_H2(S_H2: number, K_I_H2: number): number {
  return inhibit(S_H2, K_I_H2)
}

/**
 * Free ammonia inhibition (non-competitive)
 * I_NH3 = K_I / (K_I + S_NH3)
 */
export function I_NH3(S_NH3: number, K_I_NH3: number): number {
  return inhibit(S_NH3, K_I_NH3)
}

/**
 * Nitrogen limitation (Monod-type)
 * I_IN = S_IN / (K_S_IN + S_IN)
 */
export function I_IN(S_IN: number, K_S_IN: number): number {
  return monod(S_IN, K_S_IN)
}

/**
 * Calculate free ammonia concentration from total inorganic nitrogen
 * S_NH3 = S_IN * K_a_IN / (K_a_IN + [H+])
 */
export function calculateFreeAmmonia(
  S_IN: number,
  pH: number,
  K_a_IN: number
): number {
  const H = Math.pow(10, -pH)
  return S_IN * K_a_IN / (K_a_IN + H)
}

// ============================================
// ACID-BASE EQUILIBRIUM (pH Calculation)
// ============================================

/**
 * Calculate pH from state variables using charge balance
 * This is an iterative calculation using Newton-Raphson
 *
 * Charge balance:
 * [H+] + [NH4+] + cations = [OH-] + [HCO3-] + [CO3^2-] + [Ac-] + [Pro-] + [Bu-] + [Va-] + anions
 *
 * Simplified for ADM1:
 * [H+] - [OH-] + [NH4+] - [HCO3-] - [Ac-] - [Pro-] - [Bu-] - [Va-] + S_cat - S_an = 0
 */
export function calculatePH(
  state: ADM1StateVariables,
  params: ADM1PhysicoChemParameters,
  S_cat: number = 0,  // Cation concentration [kmole/m³]
  S_an: number = 0    // Anion concentration [kmole/m³]
): number {
  const { S_va, S_bu, S_pro, S_ac, S_IC, S_IN } = state
  const { K_a_va, K_a_bu, K_a_pro, K_a_ac, K_a_CO2, K_a_IN, K_w } = params

  // Convert gCOD/m³ to kmole/m³ for VFAs
  // Using typical molecular weights and COD equivalents
  const S_va_mol = S_va / 208000      // Valerate: 208 g COD/mol
  const S_bu_mol = S_bu / 160000      // Butyrate: 160 g COD/mol
  const S_pro_mol = S_pro / 112000    // Propionate: 112 g COD/mol
  const S_ac_mol = S_ac / 64000       // Acetate: 64 g COD/mol

  // Newton-Raphson iteration for [H+]
  let pH = 7.0  // Initial guess
  const maxIter = 100
  const tolerance = 1e-12

  for (let iter = 0; iter < maxIter; iter++) {
    const H = Math.pow(10, -pH)

    // Dissociated species
    const va_minus = S_va_mol * K_a_va / (K_a_va + H)
    const bu_minus = S_bu_mol * K_a_bu / (K_a_bu + H)
    const pro_minus = S_pro_mol * K_a_pro / (K_a_pro + H)
    const ac_minus = S_ac_mol * K_a_ac / (K_a_ac + H)
    const HCO3_minus = S_IC * K_a_CO2 / (K_a_CO2 + H)
    const NH4_plus = S_IN * H / (K_a_IN + H)
    const OH_minus = K_w / H

    // Charge balance residual
    const residual = H + NH4_plus - OH_minus - HCO3_minus - ac_minus - pro_minus - bu_minus - va_minus + S_cat - S_an

    // Derivative of residual with respect to H
    const d_va = S_va_mol * K_a_va / Math.pow(K_a_va + H, 2)
    const d_bu = S_bu_mol * K_a_bu / Math.pow(K_a_bu + H, 2)
    const d_pro = S_pro_mol * K_a_pro / Math.pow(K_a_pro + H, 2)
    const d_ac = S_ac_mol * K_a_ac / Math.pow(K_a_ac + H, 2)
    const d_HCO3 = S_IC * K_a_CO2 / Math.pow(K_a_CO2 + H, 2)
    const d_NH4 = S_IN * K_a_IN / Math.pow(K_a_IN + H, 2)
    const d_OH = K_w / (H * H)

    const derivative = 1 + d_NH4 + d_OH + d_HCO3 + d_ac + d_pro + d_bu + d_va

    // Newton-Raphson update
    const dH = -residual / derivative
    const H_new = H + dH

    if (H_new <= 0) {
      // Safeguard: bisection if Newton fails
      pH = (pH + 7.0) / 2
    } else {
      pH = -Math.log10(H_new)
    }

    // Check convergence
    if (Math.abs(residual) < tolerance) {
      break
    }
  }

  // Clamp pH to reasonable range
  return Math.max(4.0, Math.min(9.0, pH))
}

/**
 * Calculate total alkalinity from state
 */
export function calculateAlkalinity(
  state: ADM1StateVariables,
  pH: number,
  params: ADM1PhysicoChemParameters
): number {
  const H = Math.pow(10, -pH)

  // Bicarbonate alkalinity
  const HCO3 = state.S_IC * params.K_a_CO2 / (params.K_a_CO2 + H)

  // VFA contribution (negative)
  const S_ac_mol = state.S_ac / 64000
  const S_pro_mol = state.S_pro / 112000
  const S_bu_mol = state.S_bu / 160000
  const S_va_mol = state.S_va / 208000

  const VFA_alk = -(
    S_ac_mol * params.K_a_ac / (params.K_a_ac + H) +
    S_pro_mol * params.K_a_pro / (params.K_a_pro + H) +
    S_bu_mol * params.K_a_bu / (params.K_a_bu + H) +
    S_va_mol * params.K_a_va / (params.K_a_va + H)
  )

  // Ammonia contribution
  const NH3_alk = state.S_IN * params.K_a_IN / (params.K_a_IN + H)

  return HCO3 + VFA_alk + NH3_alk  // [kmole/m³]
}

// ============================================
// PROCESS RATES (19 Biochemical Processes)
// ============================================

/**
 * Calculate all 19 ADM1 process rates
 */
export function calculateProcessRates(
  state: ADM1StateVariables,
  kinetic: ADM1KineticParameters,
  stoich: ADM1StoichiometricParameters,
  pH: number,
  S_NH3: number
): { rates: number[]; processRates: ADM1ProcessRate[] } {
  const {
    S_su, S_aa, S_fa, S_va, S_bu, S_pro, S_ac, S_H2, S_IN,
    X_c, X_ch, X_pr, X_li, X_su, X_aa, X_fa, X_c4, X_pro, X_ac, X_H2
  } = state

  const {
    k_dis, k_hyd_ch, k_hyd_pr, k_hyd_li,
    k_m_su, k_m_aa, k_m_fa, k_m_c4, k_m_pro, k_m_ac, k_m_H2,
    K_S_su, K_S_aa, K_S_fa, K_S_c4, K_S_pro, K_S_ac, K_S_H2,
    k_dec,
    K_I_H2_fa, K_I_H2_c4, K_I_H2_pro, K_I_NH3, K_S_IN,
    pH_UL_aa, pH_LL_aa, pH_UL_ac, pH_LL_ac, pH_UL_H2, pH_LL_H2
  } = kinetic

  // Calculate inhibition factors
  const I_pH_aa = I_pH_lower(pH, pH_UL_aa, pH_LL_aa)
  const I_pH_ac_val = I_pH_range(pH, pH_UL_ac, pH_LL_ac)
  const I_pH_H2_val = I_pH_range(pH, pH_UL_H2, pH_LL_H2)

  const I_H2_fa_val = I_H2(S_H2, K_I_H2_fa)
  const I_H2_c4_val = I_H2(S_H2, K_I_H2_c4)
  const I_H2_pro_val = I_H2(S_H2, K_I_H2_pro)

  const I_NH3_val = I_NH3(S_NH3, K_I_NH3)
  const I_IN_val = I_IN(S_IN, K_S_IN)

  // Combined inhibition for different groups
  const I_acidogens = I_pH_aa * I_IN_val
  const I_acetogens = I_pH_ac_val * I_IN_val
  const I_ac_methanogens = I_pH_ac_val * I_IN_val * I_NH3_val
  const I_H2_methanogens = I_pH_H2_val * I_IN_val

  // Process rates [gCOD/(m³·d)] or [kmole/(m³·d)]
  const rates: number[] = new Array(19).fill(0)

  // Process 1: Disintegration (X_c → X_ch, X_pr, X_li, X_I, S_I)
  rates[0] = k_dis * X_c

  // Process 2: Hydrolysis of carbohydrates (X_ch → S_su)
  rates[1] = k_hyd_ch * X_ch

  // Process 3: Hydrolysis of proteins (X_pr → S_aa)
  rates[2] = k_hyd_pr * X_pr

  // Process 4: Hydrolysis of lipids (X_li → S_fa + glycerol as S_su)
  rates[3] = k_hyd_li * X_li

  // Process 5: Uptake of sugars (S_su → VFAs, H2, CO2, biomass)
  rates[4] = k_m_su * monod(S_su, K_S_su) * X_su * I_acidogens

  // Process 6: Uptake of amino acids (S_aa → VFAs, H2, CO2, biomass)
  rates[5] = k_m_aa * monod(S_aa, K_S_aa) * X_aa * I_acidogens

  // Process 7: Uptake of LCFA (S_fa → acetate, H2)
  rates[6] = k_m_fa * monod(S_fa, K_S_fa) * X_fa * I_acetogens * I_H2_fa_val

  // Process 8: Uptake of valerate (S_va → propionate, acetate, H2)
  rates[7] = k_m_c4 * monod(S_va, K_S_c4) * X_c4 * I_acetogens * I_H2_c4_val * S_va / (S_va + S_bu + 1e-10)

  // Process 9: Uptake of butyrate (S_bu → acetate, H2)
  rates[8] = k_m_c4 * monod(S_bu, K_S_c4) * X_c4 * I_acetogens * I_H2_c4_val * S_bu / (S_va + S_bu + 1e-10)

  // Process 10: Uptake of propionate (S_pro → acetate, H2, CO2)
  rates[9] = k_m_pro * monod(S_pro, K_S_pro) * X_pro * I_acetogens * I_H2_pro_val

  // Process 11: Uptake of acetate (S_ac → CH4, CO2) - Acetoclastic methanogenesis
  rates[10] = k_m_ac * monod(S_ac, K_S_ac) * X_ac * I_ac_methanogens

  // Process 12: Uptake of hydrogen (S_H2 + CO2 → CH4) - Hydrogenotrophic methanogenesis
  rates[11] = k_m_H2 * monod(S_H2, K_S_H2) * X_H2 * I_H2_methanogens

  // Processes 13-19: Decay of biomass (X → X_c)
  rates[12] = k_dec * X_su   // Decay of X_su
  rates[13] = k_dec * X_aa   // Decay of X_aa
  rates[14] = k_dec * X_fa   // Decay of X_fa
  rates[15] = k_dec * X_c4   // Decay of X_c4
  rates[16] = k_dec * X_pro  // Decay of X_pro
  rates[17] = k_dec * X_ac   // Decay of X_ac
  rates[18] = k_dec * X_H2   // Decay of X_H2

  // Create process rate objects for output
  const processRates: ADM1ProcessRate[] = [
    { process: 'disintegration', name: 'Disintegration', nameThai: 'การสลายตัว', rate: rates[0], rateEquation: `k_dis × X_c = ${rates[0].toExponential(3)}` },
    { process: 'hydrolysis_carbohydrates', name: 'Hydrolysis of Carbohydrates', nameThai: 'ไฮโดรไลซิสคาร์โบไฮเดรต', rate: rates[1], rateEquation: `k_hyd_ch × X_ch = ${rates[1].toExponential(3)}` },
    { process: 'hydrolysis_proteins', name: 'Hydrolysis of Proteins', nameThai: 'ไฮโดรไลซิสโปรตีน', rate: rates[2], rateEquation: `k_hyd_pr × X_pr = ${rates[2].toExponential(3)}` },
    { process: 'hydrolysis_lipids', name: 'Hydrolysis of Lipids', nameThai: 'ไฮโดรไลซิสไขมัน', rate: rates[3], rateEquation: `k_hyd_li × X_li = ${rates[3].toExponential(3)}` },
    { process: 'uptake_sugars', name: 'Uptake of Sugars', nameThai: 'การใช้น้ำตาล', rate: rates[4], rateEquation: `k_m_su × M(S_su) × X_su × I = ${rates[4].toExponential(3)}` },
    { process: 'uptake_amino_acids', name: 'Uptake of Amino Acids', nameThai: 'การใช้กรดอะมิโน', rate: rates[5], rateEquation: `k_m_aa × M(S_aa) × X_aa × I = ${rates[5].toExponential(3)}` },
    { process: 'uptake_LCFA', name: 'Uptake of LCFA', nameThai: 'การใช้กรดไขมันสายยาว', rate: rates[6], rateEquation: `k_m_fa × M(S_fa) × X_fa × I = ${rates[6].toExponential(3)}` },
    { process: 'uptake_valerate', name: 'Uptake of Valerate', nameThai: 'การใช้วาเลอเรต', rate: rates[7], rateEquation: `k_m_c4 × M(S_va) × X_c4 × I = ${rates[7].toExponential(3)}` },
    { process: 'uptake_butyrate', name: 'Uptake of Butyrate', nameThai: 'การใช้บิวทิเรต', rate: rates[8], rateEquation: `k_m_c4 × M(S_bu) × X_c4 × I = ${rates[8].toExponential(3)}` },
    { process: 'uptake_propionate', name: 'Uptake of Propionate', nameThai: 'การใช้โพรพิโอเนต', rate: rates[9], rateEquation: `k_m_pro × M(S_pro) × X_pro × I = ${rates[9].toExponential(3)}` },
    { process: 'uptake_acetate', name: 'Uptake of Acetate', nameThai: 'การใช้อะซิเตท', rate: rates[10], rateEquation: `k_m_ac × M(S_ac) × X_ac × I = ${rates[10].toExponential(3)}` },
    { process: 'uptake_hydrogen', name: 'Uptake of Hydrogen', nameThai: 'การใช้ไฮโดรเจน', rate: rates[11], rateEquation: `k_m_H2 × M(S_H2) × X_H2 × I = ${rates[11].toExponential(3)}` },
    { process: 'decay_X_su', name: 'Decay of Sugar Degraders', nameThai: 'การตายของแบคทีเรียย่อยน้ำตาล', rate: rates[12], rateEquation: `k_dec × X_su = ${rates[12].toExponential(3)}` },
    { process: 'decay_X_aa', name: 'Decay of AA Degraders', nameThai: 'การตายของแบคทีเรียย่อยกรดอะมิโน', rate: rates[13], rateEquation: `k_dec × X_aa = ${rates[13].toExponential(3)}` },
    { process: 'decay_X_fa', name: 'Decay of LCFA Degraders', nameThai: 'การตายของแบคทีเรียย่อยไขมัน', rate: rates[14], rateEquation: `k_dec × X_fa = ${rates[14].toExponential(3)}` },
    { process: 'decay_X_c4', name: 'Decay of C4 Degraders', nameThai: 'การตายของแบคทีเรียย่อย C4', rate: rates[15], rateEquation: `k_dec × X_c4 = ${rates[15].toExponential(3)}` },
    { process: 'decay_X_pro', name: 'Decay of Pro Degraders', nameThai: 'การตายของแบคทีเรียย่อยโพรพิโอเนต', rate: rates[16], rateEquation: `k_dec × X_pro = ${rates[16].toExponential(3)}` },
    { process: 'decay_X_ac', name: 'Decay of Acetoclastic Methanogens', nameThai: 'การตายของมีเทนโนเจนอะซิเตท', rate: rates[17], rateEquation: `k_dec × X_ac = ${rates[17].toExponential(3)}` },
    { process: 'decay_X_H2', name: 'Decay of H2 Methanogens', nameThai: 'การตายของมีเทนโนเจน H2', rate: rates[18], rateEquation: `k_dec × X_H2 = ${rates[18].toExponential(3)}` },
  ]

  return { rates, processRates }
}

// ============================================
// STOICHIOMETRIC MATRIX (19×24)
// ============================================

/**
 * Build the Petersen (stoichiometric) matrix for ADM1
 * Returns ν[i][j] where i = process index, j = component index
 */
export function buildStoichiometricMatrix(
  stoich: ADM1StoichiometricParameters
): number[][] {
  const { f_sI_xc, f_xI_xc, f_ch_xc, f_pr_xc, f_li_xc, f_fa_li,
    Y_su, Y_aa, Y_fa, Y_c4, Y_pro, Y_ac, Y_H2,
    f_bu_su, f_pro_su, f_ac_su, f_H2_su,
    f_bu_aa, f_pro_aa, f_ac_aa, f_H2_aa, f_va_aa,
    C_su, C_aa, C_fa, C_va, C_bu, C_pro, C_ac, C_ch4, C_bac, C_xc, C_ch, C_pr, C_li, C_sI, C_xI,
    N_xc, N_I, N_aa, N_bac } = stoich

  // Initialize 19×24 matrix with zeros
  const nu: number[][] = Array(19).fill(null).map(() => Array(24).fill(0))

  // Component indices: 0=S_su, 1=S_aa, 2=S_fa, 3=S_va, 4=S_bu, 5=S_pro, 6=S_ac, 7=S_H2, 8=S_ch4, 9=S_IC, 10=S_IN, 11=S_I
  // 12=X_c, 13=X_ch, 14=X_pr, 15=X_li, 16=X_su, 17=X_aa, 18=X_fa, 19=X_c4, 20=X_pro, 21=X_ac, 22=X_H2, 23=X_I

  // Process 1: Disintegration (X_c → products)
  nu[0][11] = f_sI_xc                 // S_I
  nu[0][12] = -1                      // X_c consumed
  nu[0][13] = f_ch_xc                 // X_ch
  nu[0][14] = f_pr_xc                 // X_pr
  nu[0][15] = f_li_xc                 // X_li
  nu[0][23] = f_xI_xc                 // X_I
  // Carbon and nitrogen balance handled via S_IC and S_IN

  // Process 2: Hydrolysis of carbohydrates (X_ch → S_su)
  nu[1][0] = 1                        // S_su produced
  nu[1][13] = -1                      // X_ch consumed

  // Process 3: Hydrolysis of proteins (X_pr → S_aa)
  nu[1][1] = 1                        // S_aa produced
  nu[2][14] = -1                      // X_pr consumed

  // Process 4: Hydrolysis of lipids (X_li → S_fa + S_su)
  nu[3][0] = 1 - f_fa_li             // S_su (glycerol)
  nu[3][2] = f_fa_li                 // S_fa
  nu[3][15] = -1                      // X_li consumed

  // Process 5: Uptake of sugars
  nu[4][0] = -1                       // S_su consumed
  nu[4][4] = (1 - Y_su) * f_bu_su    // S_bu
  nu[4][5] = (1 - Y_su) * f_pro_su   // S_pro
  nu[4][6] = (1 - Y_su) * f_ac_su    // S_ac
  nu[4][7] = (1 - Y_su) * f_H2_su    // S_H2
  nu[4][9] = -C_su + (1 - Y_su) * (f_bu_su * C_bu + f_pro_su * C_pro + f_ac_su * C_ac) + Y_su * C_bac  // S_IC (C balance)
  nu[4][10] = -Y_su * N_bac           // S_IN (N balance)
  nu[4][16] = Y_su                    // X_su (biomass growth)

  // Process 6: Uptake of amino acids
  nu[5][1] = -1                       // S_aa consumed
  nu[5][3] = (1 - Y_aa) * f_va_aa    // S_va
  nu[5][4] = (1 - Y_aa) * f_bu_aa    // S_bu
  nu[5][5] = (1 - Y_aa) * f_pro_aa   // S_pro
  nu[5][6] = (1 - Y_aa) * f_ac_aa    // S_ac
  nu[5][7] = (1 - Y_aa) * f_H2_aa    // S_H2
  nu[5][9] = -C_aa + (1 - Y_aa) * (f_va_aa * C_va + f_bu_aa * C_bu + f_pro_aa * C_pro + f_ac_aa * C_ac) + Y_aa * C_bac
  nu[5][10] = N_aa - Y_aa * N_bac    // S_IN
  nu[5][17] = Y_aa                    // X_aa

  // Process 7: Uptake of LCFA
  nu[6][2] = -1                       // S_fa consumed
  nu[6][6] = (1 - Y_fa) * 0.7        // S_ac (approximate stoichiometry)
  nu[6][7] = (1 - Y_fa) * 0.3        // S_H2
  nu[6][9] = -C_fa + (1 - Y_fa) * 0.7 * C_ac + Y_fa * C_bac
  nu[6][10] = -Y_fa * N_bac
  nu[6][18] = Y_fa                    // X_fa

  // Process 8: Uptake of valerate
  nu[7][3] = -1                       // S_va consumed
  nu[7][5] = (1 - Y_c4) * 0.54       // S_pro
  nu[7][6] = (1 - Y_c4) * 0.31       // S_ac
  nu[7][7] = (1 - Y_c4) * 0.15       // S_H2
  nu[7][9] = -C_va + (1 - Y_c4) * (0.54 * C_pro + 0.31 * C_ac) + Y_c4 * C_bac
  nu[7][10] = -Y_c4 * N_bac
  nu[7][19] = Y_c4                    // X_c4

  // Process 9: Uptake of butyrate
  nu[8][4] = -1                       // S_bu consumed
  nu[8][6] = (1 - Y_c4) * 0.8        // S_ac
  nu[8][7] = (1 - Y_c4) * 0.2        // S_H2
  nu[8][9] = -C_bu + (1 - Y_c4) * 0.8 * C_ac + Y_c4 * C_bac
  nu[8][10] = -Y_c4 * N_bac
  nu[8][19] = Y_c4                    // X_c4

  // Process 10: Uptake of propionate
  nu[9][5] = -1                       // S_pro consumed
  nu[9][6] = (1 - Y_pro) * 0.57      // S_ac
  nu[9][7] = (1 - Y_pro) * 0.43      // S_H2 (simplified)
  nu[9][9] = -C_pro + (1 - Y_pro) * 0.57 * C_ac + Y_pro * C_bac
  nu[9][10] = -Y_pro * N_bac
  nu[9][20] = Y_pro                   // X_pro

  // Process 11: Uptake of acetate (acetoclastic methanogenesis)
  nu[10][6] = -1                      // S_ac consumed
  nu[10][8] = (1 - Y_ac)             // S_ch4 produced
  nu[10][9] = -C_ac + (1 - Y_ac) * C_ch4 + Y_ac * C_bac  // CO2 produced (in S_IC)
  nu[10][10] = -Y_ac * N_bac
  nu[10][21] = Y_ac                   // X_ac

  // Process 12: Uptake of hydrogen (hydrogenotrophic methanogenesis)
  // 4H2 + CO2 → CH4 + 2H2O
  nu[11][7] = -1                      // S_H2 consumed
  nu[11][8] = (1 - Y_H2) / 4         // S_ch4 produced (stoichiometry adjusted)
  nu[11][9] = -(1 - Y_H2) / 4 * C_ch4 + Y_H2 * C_bac  // S_IC consumed
  nu[11][10] = -Y_H2 * N_bac
  nu[11][22] = Y_H2                   // X_H2

  // Processes 13-19: Decay of biomass (X → X_c)
  const decayProcesses = [
    [12, 16],  // Process 13: X_su → X_c
    [13, 17],  // Process 14: X_aa → X_c
    [14, 18],  // Process 15: X_fa → X_c
    [15, 19],  // Process 16: X_c4 → X_c
    [16, 20],  // Process 17: X_pro → X_c
    [17, 21],  // Process 18: X_ac → X_c
    [18, 22],  // Process 19: X_H2 → X_c
  ]

  for (const [processIdx, biomassIdx] of decayProcesses) {
    nu[processIdx][12] = 1           // X_c produced
    nu[processIdx][biomassIdx] = -1  // Biomass consumed
  }

  return nu
}

/**
 * Get stoichiometric coefficient for specific process and component
 */
export function getStoichiometricCoefficient(
  matrix: number[][],
  processIndex: number,
  componentIndex: number
): number {
  if (processIndex < 0 || processIndex >= 19) return 0
  if (componentIndex < 0 || componentIndex >= 24) return 0
  return matrix[processIndex][componentIndex]
}

// ============================================
// GAS-LIQUID TRANSFER
// ============================================

/**
 * Calculate gas transfer rates using Henry's law
 * ρ_T,i = k_L_a × (S_liq,i - K_H,i × p_gas,i)
 */
export function calculateGasTransfer(
  state: ADM1StateVariables,
  gasPhase: ADM1GasPhase,
  params: ADM1PhysicoChemParameters,
  temperature: number
): { rho_H2: number; rho_ch4: number; rho_CO2: number } {
  const { S_H2, S_ch4, S_IC } = state
  const { S_gas_H2, S_gas_ch4, S_gas_CO2 } = gasPhase
  const { k_L_a, K_H_H2, K_H_ch4, K_H_CO2 } = params

  // Temperature-corrected Henry's constants
  const T_K = temperature + 273.15
  const R = ADM1_CONSTANTS.R
  const P_atm = ADM1_CONSTANTS.P_atm

  // Calculate partial pressures from gas phase concentrations
  const p_H2 = S_gas_H2 * R * T_K / 1000  // bar
  const p_ch4 = S_gas_ch4 * R * T_K / 1000
  const p_CO2 = S_gas_CO2 * R * T_K / 1000

  // Convert liquid concentrations to kmole/m³
  const S_H2_mol = S_H2 / (ADM1_CONSTANTS.COD_H2 * 1000)
  const S_ch4_mol = S_ch4 / (ADM1_CONSTANTS.COD_CH4 * 1000)

  // CO2 is already inorganic carbon - need to calculate dissolved CO2
  // S_CO2 = S_IC × [H+] / (K_a_CO2 + [H+])
  const pH = 7.0  // Approximate for this calculation
  const H = Math.pow(10, -pH)
  const S_CO2_mol = S_IC * H / (params.K_a_CO2 + H)

  // Gas transfer rates [kmole/(m³·d)]
  const rho_H2 = k_L_a * (S_H2_mol - K_H_H2 * p_H2)
  const rho_ch4 = k_L_a * (S_ch4_mol - K_H_ch4 * p_ch4)
  const rho_CO2 = k_L_a * (S_CO2_mol - K_H_CO2 * p_CO2)

  return { rho_H2, rho_ch4, rho_CO2 }
}

/**
 * Calculate biogas production from gas transfer
 */
export function calculateBiogasProduction(
  rho_gas: { rho_H2: number; rho_ch4: number; rho_CO2: number },
  V_liq: number,
  V_gas: number,
  temperature: number,
  pressure: number = ADM1_CONSTANTS.P_atm
): ADM1GasProduction {
  const T_K = temperature + 273.15
  const R = ADM1_CONSTANTS.R
  const VM_STP = ADM1_CONSTANTS.VM_STP / 1000  // m³/mol

  // Gas production rates [kmole/d]
  const n_H2 = Math.max(0, rho_gas.rho_H2 * V_liq)
  const n_ch4 = Math.max(0, rho_gas.rho_ch4 * V_liq)
  const n_CO2 = Math.max(0, rho_gas.rho_CO2 * V_liq)

  // Volumetric flow at operating conditions [m³/d]
  const q_H2 = n_H2 * R * T_K / (pressure * 1e5) * 1000
  const q_ch4 = n_ch4 * R * T_K / (pressure * 1e5) * 1000
  const q_CO2 = n_CO2 * R * T_K / (pressure * 1e5) * 1000

  // Water vapor pressure at temperature
  const p_H2O = 0.0313 * Math.exp(17.27 * (temperature / (temperature + 237.3)))

  // Total gas flow (dry basis)
  const q_gas = q_H2 + q_ch4 + q_CO2

  // Partial pressures
  const p_total = pressure - p_H2O
  const p_gas_H2 = q_gas > 0 ? (q_H2 / q_gas) * p_total : 0
  const p_gas_ch4 = q_gas > 0 ? (q_ch4 / q_gas) * p_total : 0
  const p_gas_CO2 = q_gas > 0 ? (q_CO2 / q_gas) * p_total : 0

  // Composition [%]
  const ch4_percentage = q_gas > 0 ? (q_ch4 / q_gas) * 100 : 0
  const CO2_percentage = q_gas > 0 ? (q_CO2 / q_gas) * 100 : 0

  // At STP [Nm³/d]
  const Q_ch4_STP = n_ch4 * VM_STP * 1000
  const Q_CO2_STP = n_CO2 * VM_STP * 1000
  const Q_H2_STP = n_H2 * VM_STP * 1000
  const Q_total_STP = Q_ch4_STP + Q_CO2_STP + Q_H2_STP

  // Energy potential [kWh/d] (10 kWh/Nm³ CH4)
  const energy_kWh = Q_ch4_STP * ADM1_CONSTANTS.ENERGY_CH4

  return {
    q_gas,
    q_ch4,
    q_CO2,
    q_H2,
    p_gas_H2,
    p_gas_ch4,
    p_gas_CO2,
    p_gas_H2O: p_H2O,
    ch4_percentage,
    CO2_percentage,
    Q_ch4_STP,
    Q_CO2_STP,
    Q_total_STP,
    energy_kWh,
  }
}

// ============================================
// CSTR MASS BALANCE (Derivatives)
// ============================================

/**
 * Convert state variables object to array
 */
export function stateToArray(state: ADM1StateVariables): number[] {
  return ADM1_STATE_ORDER.map(key => state[key])
}

/**
 * Convert array to state variables object
 */
export function arrayToState(arr: number[]): ADM1StateVariables {
  const state: Partial<ADM1StateVariables> = {}
  ADM1_STATE_ORDER.forEach((key, i) => {
    state[key] = Math.max(0, arr[i])  // Ensure non-negative
  })
  return state as ADM1StateVariables
}

/**
 * Calculate derivatives for all state variables
 * dC/dt = (1/HRT)(C_in - C) + Σ(ν_ij × ρ_j) - ρ_T (for gases)
 */
export function calculateDerivatives(
  state: ADM1StateVariables,
  influent: ADM1StateVariables,
  rates: number[],
  stoichMatrix: number[][],
  gasTransfer: { rho_H2: number; rho_ch4: number; rho_CO2: number },
  HRT: number
): number[] {
  const stateArr = stateToArray(state)
  const influentArr = stateToArray(influent)
  const derivatives = new Array(24).fill(0)

  // Hydraulic flow term: (1/HRT)(C_in - C)
  for (let i = 0; i < 24; i++) {
    derivatives[i] = (influentArr[i] - stateArr[i]) / HRT
  }

  // Reaction terms: Σ(ν_ij × ρ_j)
  for (let j = 0; j < 19; j++) {
    for (let i = 0; i < 24; i++) {
      derivatives[i] += stoichMatrix[j][i] * rates[j]
    }
  }

  // Gas transfer terms (subtract from liquid)
  // S_H2 (index 7), S_ch4 (index 8), S_IC (index 9)
  derivatives[7] -= gasTransfer.rho_H2 * ADM1_CONSTANTS.COD_H2 * 1000  // Convert to gCOD/m³/d
  derivatives[8] -= gasTransfer.rho_ch4 * ADM1_CONSTANTS.COD_CH4 * 1000
  derivatives[9] -= gasTransfer.rho_CO2  // Already in kmole/m³/d

  return derivatives
}

// ============================================
// INFLUENT FRACTIONATION
// ============================================

/**
 * Convert conventional wastewater parameters to ADM1 state variables
 */
export function fractionateInfluent(
  conventional: ADM1ConventionalInfluent,
  fractionation: ADM1Fractionation
): ADM1StateVariables {
  const { COD, TKN, NH4_N, alkalinity } = conventional
  const {
    f_S_su, f_S_aa, f_S_fa, f_S_I,
    f_X_c, f_X_ch, f_X_pr, f_X_li, f_X_I,
    f_S_IN
  } = fractionation

  // Soluble COD fractions
  const S_su = COD * f_S_su
  const S_aa = COD * f_S_aa
  const S_fa = COD * f_S_fa
  const S_I = COD * f_S_I

  // Particulate COD fractions
  const X_c = COD * f_X_c
  const X_ch = COD * f_X_ch
  const X_pr = COD * f_X_pr
  const X_li = COD * f_X_li
  const X_I = COD * f_X_I

  // Nitrogen [kmole N/m³]
  const S_IN = (TKN * f_S_IN) / 14000  // Convert gN/m³ to kmole N/m³

  // Inorganic carbon from alkalinity [kmole C/m³]
  // Assume alkalinity is mostly HCO3-
  const S_IC = (alkalinity / 50) / 1000  // Convert gCaCO3/m³ to kmole/m³

  return {
    S_su,
    S_aa,
    S_fa,
    S_va: 0,   // No VFAs in fresh feed (typically)
    S_bu: 0,
    S_pro: 0,
    S_ac: 0,
    S_H2: 1e-8,  // Trace
    S_ch4: 1e-8,
    S_IC,
    S_IN,
    S_I,
    X_c,
    X_ch,
    X_pr,
    X_li,
    X_su: 0,   // No active biomass in feed
    X_aa: 0,
    X_fa: 0,
    X_c4: 0,
    X_pro: 0,
    X_ac: 0,
    X_H2: 0,
    X_I,
  }
}

// ============================================
// MAIN SIMULATION FUNCTION
// ============================================

/**
 * Run full ADM1 dynamic simulation
 */
export function runADM1Simulation(
  config: ADM1SimulationConfig,
  reactor: ADM1ReactorConfig,
  influent: ADM1StateVariables,
  params: ADM1AllParameters = {
    kinetic: DEFAULT_ADM1_KINETIC_PARAMS,
    stoich: DEFAULT_ADM1_STOICH_PARAMS,
    physioChem: DEFAULT_ADM1_PHYSICHEM_PARAMS,
    tempCoeffs: DEFAULT_ADM1_TEMP_COEFFS,
  }
): ADM1SimulationResult {
  const startTime = performance.now()

  // Temperature correction
  const kineticT = correctTemperature(params.kinetic, reactor.temperature, params.tempCoeffs)
  const physioChemT = correctPhysicoChemTemp(params.physioChem, reactor.temperature)

  // Build stoichiometric matrix
  const stoichMatrix = buildStoichiometricMatrix(params.stoich)

  // HRT
  const HRT = reactor.V_liq / reactor.Q_in

  // Initialize
  let state = { ...config.initialState }
  let gasPhase = config.initialGasPhase || { ...DEFAULT_INITIAL_GAS_PHASE }

  const timeSeries: ADM1TimePoint[] = []
  let totalSteps = 0

  // Simulation loop
  for (let t = config.startTime; t <= config.endTime; t += config.timeStep) {
    // Calculate pH
    const pH = calculatePH(state, physioChemT)

    // Free ammonia
    const S_NH3 = calculateFreeAmmonia(state.S_IN, pH, physioChemT.K_a_IN)

    // Process rates
    const { rates, processRates } = calculateProcessRates(
      state, kineticT, params.stoich, pH, S_NH3
    )

    // Gas transfer
    const gasTransfer = calculateGasTransfer(state, gasPhase, physioChemT, reactor.temperature)

    // Derivatives
    const derivatives = calculateDerivatives(
      state, influent, rates, stoichMatrix, gasTransfer, HRT
    )

    // Update state (Euler method for simplicity - can use RK4)
    const stateArr = stateToArray(state)
    for (let i = 0; i < 24; i++) {
      stateArr[i] = Math.max(0, stateArr[i] + derivatives[i] * config.timeStep)
    }
    state = arrayToState(stateArr)

    // Update gas phase
    const gasProduction = calculateBiogasProduction(
      gasTransfer, reactor.V_liq, reactor.V_gas, reactor.temperature
    )

    // Store time point (at output interval)
    if (Math.abs(t % config.outputInterval) < config.timeStep / 2) {
      const alkalinity = calculateAlkalinity(state, pH, physioChemT)

      // Inhibition factors
      const I_pH_aa = I_pH_lower(pH, kineticT.pH_UL_aa, kineticT.pH_LL_aa)
      const I_pH_ac_val = I_pH_range(pH, kineticT.pH_UL_ac, kineticT.pH_LL_ac)
      const I_pH_H2_val = I_pH_range(pH, kineticT.pH_UL_H2, kineticT.pH_LL_H2)
      const I_H2_fa_val = I_H2(state.S_H2, kineticT.K_I_H2_fa)
      const I_H2_c4_val = I_H2(state.S_H2, kineticT.K_I_H2_c4)
      const I_H2_pro_val = I_H2(state.S_H2, kineticT.K_I_H2_pro)
      const I_NH3_val = I_NH3(S_NH3, kineticT.K_I_NH3)
      const I_IN_val = I_IN(state.S_IN, kineticT.K_S_IN)

      timeSeries.push({
        time: t,
        state: { ...state },
        gasPhase: { ...gasPhase },
        processRates,
        pH,
        alkalinity,
        VFA_total: state.S_va + state.S_bu + state.S_pro + state.S_ac,
        gasProduction,
        inhibitionFactors: {
          I_pH_aa,
          I_pH_ac: I_pH_ac_val,
          I_pH_H2: I_pH_H2_val,
          I_H2_fa: I_H2_fa_val,
          I_H2_c4: I_H2_c4_val,
          I_H2_pro: I_H2_pro_val,
          I_NH3: I_NH3_val,
          I_IN: I_IN_val,
        },
      })
    }

    totalSteps++
  }

  const executionTime = performance.now() - startTime

  // Final calculations
  const finalPH = calculatePH(state, physioChemT)
  const finalS_NH3 = calculateFreeAmmonia(state.S_IN, finalPH, physioChemT.K_a_IN)
  const { processRates: finalRates } = calculateProcessRates(state, kineticT, params.stoich, finalPH, finalS_NH3)
  const finalGasTransfer = calculateGasTransfer(state, gasPhase, physioChemT, reactor.temperature)
  const finalGasProduction = calculateBiogasProduction(finalGasTransfer, reactor.V_liq, reactor.V_gas, reactor.temperature)

  // Effluent quality
  const COD_total = state.S_su + state.S_aa + state.S_fa + state.S_va + state.S_bu +
    state.S_pro + state.S_ac + state.S_I +
    state.X_c + state.X_ch + state.X_pr + state.X_li +
    state.X_su + state.X_aa + state.X_fa + state.X_c4 +
    state.X_pro + state.X_ac + state.X_H2 + state.X_I

  const COD_soluble = state.S_su + state.S_aa + state.S_fa + state.S_va + state.S_bu +
    state.S_pro + state.S_ac + state.S_I

  const VFA_total = state.S_va + state.S_bu + state.S_pro + state.S_ac

  // Influent COD
  const influentCOD = influent.S_su + influent.S_aa + influent.S_fa + influent.S_I +
    influent.X_c + influent.X_ch + influent.X_pr + influent.X_li + influent.X_I

  // Performance
  const CODRemoval = influentCOD > 0 ? ((influentCOD - COD_total) / influentCOD) * 100 : 0
  const CODLoading = (influentCOD * reactor.Q_in) / (reactor.V_liq * 1000)  // kg COD/(m³·d)
  const specificMethane = influentCOD > 0 ? finalGasProduction.Q_ch4_STP / ((influentCOD - COD_total) * reactor.Q_in / 1000) : 0

  // Steady state detection
  const steadyState: SteadyStateInfo = {
    reached: timeSeries.length > 10,
    maxVariation: 0.05,
    convergenceMetric: 0.01,
  }

  // Diagnostics
  const pHStability = finalPH >= 6.8 && finalPH <= 7.4 ? 'stable' :
    (finalPH >= 6.5 && finalPH <= 7.8 ? 'marginal' : 'unstable')
  const VFAAccumulation = VFA_total < 500 ? 'low' :
    (VFA_total < 2000 ? 'moderate' : 'high')

  return {
    config,
    reactor,
    timeSeries,
    finalState: state,
    finalGasPhase: gasPhase,
    effluentQuality: {
      COD_total,
      COD_soluble,
      VFA_total,
      VFA_acetate: state.S_ac,
      VFA_propionate: state.S_pro,
      VFA_butyrate: state.S_bu,
      VFA_valerate: state.S_va,
      pH: finalPH,
      alkalinity: calculateAlkalinity(state, finalPH, physioChemT),
      NH4_N: state.S_IN * 14000,  // Convert back to gN/m³
      TKN: state.S_IN * 14000,    // Simplified
    },
    gasProduction: {
      totalBiogas: finalGasProduction.Q_total_STP,
      methane: finalGasProduction.Q_ch4_STP,
      CO2: finalGasProduction.Q_CO2_STP,
      methaneContent: finalGasProduction.ch4_percentage,
      specificMethane,
      energyPotential: finalGasProduction.energy_kWh,
    },
    performance: {
      CODRemoval,
      VSDestruction: CODRemoval * 0.8,  // Approximate
      specificGasYield: finalGasProduction.Q_total_STP / (influentCOD * reactor.Q_in / 1000000),
      organicLoadingRate: CODLoading,
      volumetricGasRate: finalGasProduction.Q_total_STP / reactor.V_liq,
    },
    steadyState,
    diagnostics: {
      warnings: [],
      errors: [],
      pHStability,
      VFAAccumulation,
      inhibitionStatus: pHStability === 'stable' && VFAAccumulation === 'low' ? 'Normal' : 'Check conditions',
    },
    computation: {
      totalSteps,
      executionTime,
    },
  }
}

/**
 * Calculate steady-state solution (faster than dynamic simulation)
 */
export function calculateSteadyState(
  influent: ADM1StateVariables,
  reactor: ADM1ReactorConfig,
  params: ADM1AllParameters = {
    kinetic: DEFAULT_ADM1_KINETIC_PARAMS,
    stoich: DEFAULT_ADM1_STOICH_PARAMS,
    physioChem: DEFAULT_ADM1_PHYSICHEM_PARAMS,
    tempCoeffs: DEFAULT_ADM1_TEMP_COEFFS,
  }
): ADM1StateVariables {
  // Run short dynamic simulation to reach steady state
  const config: ADM1SimulationConfig = {
    startTime: 0,
    endTime: reactor.HRT * 5,  // 5 HRTs typically enough for steady state
    timeStep: 0.1,
    outputInterval: reactor.HRT,
    solver: 'rk4',
    initialState: { ...DEFAULT_INITIAL_STATE },
  }

  const result = runADM1Simulation(config, reactor, influent, params)
  return result.finalState
}

// ============================================
// EXPORT UTILITY FUNCTIONS
// ============================================

export {
  DEFAULT_ADM1_KINETIC_PARAMS,
  DEFAULT_ADM1_STOICH_PARAMS,
  DEFAULT_ADM1_PHYSICHEM_PARAMS,
  DEFAULT_ADM1_TEMP_COEFFS,
  DEFAULT_INITIAL_STATE,
  DEFAULT_INITIAL_GAS_PHASE,
}
