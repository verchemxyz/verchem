/**
 * VerChem - ADM1 (Anaerobic Digestion Model No. 1) Type Definitions
 *
 * IWA Anaerobic Digestion Model No. 1 - The industry standard for
 * modeling anaerobic digestion and biogas production processes.
 *
 * Reference: Batstone, D.J. et al. (2002)
 * "Anaerobic Digestion Model No. 1 (ADM1)" IWA Scientific and Technical Report No. 13
 *
 * This is research-grade implementation competing with GPS-X ($15,000) and BioWin ($5,000)
 * World's first FREE web-based ADM1 simulator!
 */

// ============================================
// ADM1 STATE VARIABLES (24 Components)
// ============================================

/**
 * ADM1 State Variables
 * All concentrations in gCOD/m³ unless otherwise specified
 */
export interface ADM1StateVariables {
  // Soluble Components (12)
  S_su: number   // Monosaccharides [gCOD/m³]
  S_aa: number   // Amino acids [gCOD/m³]
  S_fa: number   // Long-chain fatty acids (LCFA) [gCOD/m³]
  S_va: number   // Total valerate [gCOD/m³]
  S_bu: number   // Total butyrate [gCOD/m³]
  S_pro: number  // Total propionate [gCOD/m³]
  S_ac: number   // Total acetate [gCOD/m³]
  S_H2: number   // Hydrogen gas (dissolved) [gCOD/m³]
  S_ch4: number  // Methane gas (dissolved) [gCOD/m³]
  S_IC: number   // Inorganic carbon [kmole C/m³]
  S_IN: number   // Inorganic nitrogen [kmole N/m³]
  S_I: number    // Soluble inerts [gCOD/m³]

  // Particulate Components (12)
  X_c: number    // Composites [gCOD/m³]
  X_ch: number   // Carbohydrates [gCOD/m³]
  X_pr: number   // Proteins [gCOD/m³]
  X_li: number   // Lipids [gCOD/m³]
  X_su: number   // Sugar degraders [gCOD/m³]
  X_aa: number   // Amino acid degraders [gCOD/m³]
  X_fa: number   // LCFA degraders [gCOD/m³]
  X_c4: number   // Valerate and butyrate degraders [gCOD/m³]
  X_pro: number  // Propionate degraders [gCOD/m³]
  X_ac: number   // Acetate degraders (acetoclastic methanogens) [gCOD/m³]
  X_H2: number   // Hydrogen degraders (hydrogenotrophic methanogens) [gCOD/m³]
  X_I: number    // Particulate inerts [gCOD/m³]
}

/**
 * State variable array order (for matrix operations)
 */
export const ADM1_STATE_ORDER: (keyof ADM1StateVariables)[] = [
  // Soluble
  'S_su', 'S_aa', 'S_fa', 'S_va', 'S_bu', 'S_pro', 'S_ac', 'S_H2', 'S_ch4', 'S_IC', 'S_IN', 'S_I',
  // Particulate
  'X_c', 'X_ch', 'X_pr', 'X_li', 'X_su', 'X_aa', 'X_fa', 'X_c4', 'X_pro', 'X_ac', 'X_H2', 'X_I'
]

/**
 * Component indices for matrix operations
 */
export const ADM1_COMPONENT_INDEX = {
  // Soluble
  S_su: 0, S_aa: 1, S_fa: 2, S_va: 3, S_bu: 4, S_pro: 5, S_ac: 6,
  S_H2: 7, S_ch4: 8, S_IC: 9, S_IN: 10, S_I: 11,
  // Particulate
  X_c: 12, X_ch: 13, X_pr: 14, X_li: 15, X_su: 16, X_aa: 17,
  X_fa: 18, X_c4: 19, X_pro: 20, X_ac: 21, X_H2: 22, X_I: 23
} as const

// ============================================
// ADM1 KINETIC PARAMETERS
// ============================================

/**
 * ADM1 Kinetic Parameters at reference temperature (35°C mesophilic)
 */
export interface ADM1KineticParameters {
  // Disintegration rate [1/d]
  k_dis: number

  // Hydrolysis rates [1/d]
  k_hyd_ch: number   // Carbohydrates
  k_hyd_pr: number   // Proteins
  k_hyd_li: number   // Lipids

  // Maximum uptake rates (Monod) [gCOD_S/(gCOD_X·d)]
  k_m_su: number     // Sugars
  k_m_aa: number     // Amino acids
  k_m_fa: number     // LCFA
  k_m_c4: number     // Valerate & Butyrate
  k_m_pro: number    // Propionate
  k_m_ac: number     // Acetate
  k_m_H2: number     // Hydrogen

  // Half-saturation constants [gCOD/m³]
  K_S_su: number
  K_S_aa: number
  K_S_fa: number
  K_S_c4: number
  K_S_pro: number
  K_S_ac: number
  K_S_H2: number

  // Decay rate (same for all biomass groups) [1/d]
  k_dec: number

  // Hydrogen inhibition constants [gCOD/m³]
  K_I_H2_fa: number   // LCFA degraders
  K_I_H2_c4: number   // C4 degraders
  K_I_H2_pro: number  // Propionate degraders

  // Ammonia inhibition [kmole N/m³]
  K_I_NH3: number

  // pH inhibition parameters (lower limit type)
  pH_UL_aa: number    // Upper limit for acidogens
  pH_LL_aa: number    // Lower limit for acidogens

  // pH inhibition parameters (upper/lower type)
  pH_UL_ac: number    // Upper limit for acetogens
  pH_LL_ac: number    // Lower limit for acetogens
  pH_UL_H2: number    // Upper limit for H2 methanogens
  pH_LL_H2: number    // Lower limit for H2 methanogens

  // Nitrogen half-saturation [kmole N/m³]
  K_S_IN: number
}

// ============================================
// ADM1 STOICHIOMETRIC PARAMETERS
// ============================================

/**
 * ADM1 Stoichiometric Parameters (yield coefficients and fractions)
 */
export interface ADM1StoichiometricParameters {
  // Disintegration fractions (from composites)
  f_sI_xc: number    // Soluble inerts from composites
  f_xI_xc: number    // Particulate inerts from composites
  f_ch_xc: number    // Carbohydrates from composites
  f_pr_xc: number    // Proteins from composites
  f_li_xc: number    // Lipids from composites

  // Hydrolysis products
  f_fa_li: number    // LCFA from lipids

  // Yield coefficients [gCOD_X/gCOD_S]
  Y_su: number       // Sugar degraders
  Y_aa: number       // Amino acid degraders
  Y_fa: number       // LCFA degraders
  Y_c4: number       // C4 degraders
  Y_pro: number      // Propionate degraders
  Y_ac: number       // Acetate degraders
  Y_H2: number       // Hydrogen degraders

  // Carbon content coefficients [kmole C/gCOD]
  C_xc: number       // Composites
  C_sI: number       // Soluble inerts
  C_ch: number       // Carbohydrates
  C_pr: number       // Proteins
  C_li: number       // Lipids
  C_xI: number       // Particulate inerts
  C_su: number       // Sugars
  C_aa: number       // Amino acids
  C_fa: number       // LCFA
  C_bu: number       // Butyrate
  C_pro: number      // Propionate
  C_ac: number       // Acetate
  C_bac: number      // Biomass
  C_va: number       // Valerate
  C_ch4: number      // Methane

  // Nitrogen content coefficients [kmole N/gCOD]
  N_xc: number       // Composites
  N_I: number        // Inerts
  N_aa: number       // Amino acids
  N_bac: number      // Biomass

  // Stoichiometric parameters for amino acid degradation
  f_bu_aa: number    // Butyrate from amino acids
  f_pro_aa: number   // Propionate from amino acids
  f_ac_aa: number    // Acetate from amino acids
  f_H2_aa: number    // Hydrogen from amino acids
  f_va_aa: number    // Valerate from amino acids

  // Stoichiometric parameters for sugar degradation
  f_bu_su: number    // Butyrate from sugars
  f_pro_su: number   // Propionate from sugars
  f_ac_su: number    // Acetate from sugars
  f_H2_su: number    // Hydrogen from sugars
}

// ============================================
// PHYSICOCHEMICAL PARAMETERS
// ============================================

/**
 * Physicochemical parameters for acid-base equilibrium and gas transfer
 */
export interface ADM1PhysicoChemParameters {
  // Henry's law constants at 298K [kmole/(m³·bar)]
  K_H_H2: number
  K_H_ch4: number
  K_H_CO2: number

  // Acid dissociation constants (Ka) at reference temp [kmole/m³]
  K_a_va: number     // Valeric acid
  K_a_bu: number     // Butyric acid
  K_a_pro: number    // Propionic acid
  K_a_ac: number     // Acetic acid
  K_a_CO2: number    // Carbonic acid (CO2/HCO3-)
  K_a_IN: number     // Ammonium (NH4+/NH3)

  // Water dissociation constant [kmole/m³]
  K_w: number

  // Gas-liquid mass transfer coefficient [1/d]
  k_L_a: number

  // Reference temperature for Ka values [K]
  T_ref: number

  // Activation energies for temperature correction [J/mol]
  E_a_H2: number
  E_a_ch4: number
  E_a_CO2: number
}

// ============================================
// GAS PHASE
// ============================================

/**
 * Gas phase state variables
 */
export interface ADM1GasPhase {
  S_gas_H2: number   // Hydrogen in gas phase [kmole/m³]
  S_gas_ch4: number  // Methane in gas phase [kmole/m³]
  S_gas_CO2: number  // CO2 in gas phase [kmole/m³]
}

/**
 * Gas production results
 */
export interface ADM1GasProduction {
  q_gas: number        // Total gas flow [m³/d]
  q_ch4: number        // Methane flow [m³/d]
  q_CO2: number        // CO2 flow [m³/d]
  q_H2: number         // Hydrogen flow [m³/d]
  p_gas_H2: number     // Partial pressure H2 [bar]
  p_gas_ch4: number    // Partial pressure CH4 [bar]
  p_gas_CO2: number    // Partial pressure CO2 [bar]
  p_gas_H2O: number    // Partial pressure H2O [bar]
  ch4_percentage: number // CH4 content [% v/v]
  CO2_percentage: number // CO2 content [% v/v]
  Q_ch4_STP: number    // CH4 at STP [Nm³/d]
  Q_CO2_STP: number    // CO2 at STP [Nm³/d]
  Q_total_STP: number  // Total biogas at STP [Nm³/d]
  energy_kWh: number   // Energy potential [kWh/d] (10 kWh/Nm³ CH4)
}

// ============================================
// TEMPERATURE COEFFICIENTS
// ============================================

/**
 * Temperature correction coefficients (Arrhenius)
 */
export interface ADM1TemperatureCoefficients {
  // Reference temperature [°C]
  T_ref: number

  // Activation energies [J/mol] for kinetic parameters
  E_a_k_dis: number
  E_a_k_hyd: number    // Same for all hydrolysis
  E_a_k_m_su: number
  E_a_k_m_aa: number
  E_a_k_m_fa: number
  E_a_k_m_c4: number
  E_a_k_m_pro: number
  E_a_k_m_ac: number
  E_a_k_m_H2: number
  E_a_k_dec: number
}

// ============================================
// DEFAULT PARAMETER VALUES
// ============================================

/**
 * Default ADM1 kinetic parameters at 35°C (mesophilic)
 * Source: Batstone et al. (2002) ADM1 Report
 */
export const DEFAULT_ADM1_KINETIC_PARAMS: ADM1KineticParameters = {
  // Disintegration
  k_dis: 0.5,

  // Hydrolysis rates
  k_hyd_ch: 10.0,
  k_hyd_pr: 10.0,
  k_hyd_li: 10.0,

  // Maximum uptake rates
  k_m_su: 30.0,
  k_m_aa: 50.0,
  k_m_fa: 6.0,
  k_m_c4: 20.0,
  k_m_pro: 13.0,
  k_m_ac: 8.0,
  k_m_H2: 35.0,

  // Half-saturation constants [gCOD/m³]
  K_S_su: 500.0,
  K_S_aa: 300.0,
  K_S_fa: 400.0,
  K_S_c4: 200.0,
  K_S_pro: 100.0,
  K_S_ac: 150.0,
  K_S_H2: 7.0e-6,  // Very low - H2 sensitive

  // Decay rate
  k_dec: 0.02,

  // Hydrogen inhibition [gCOD/m³]
  K_I_H2_fa: 5.0e-6,
  K_I_H2_c4: 1.0e-5,
  K_I_H2_pro: 3.5e-6,

  // Ammonia inhibition [kmole N/m³]
  K_I_NH3: 0.0018,

  // pH inhibition parameters
  pH_UL_aa: 5.5,
  pH_LL_aa: 4.0,
  pH_UL_ac: 7.0,
  pH_LL_ac: 6.0,
  pH_UL_H2: 6.0,
  pH_LL_H2: 5.0,

  // Nitrogen limitation
  K_S_IN: 1.0e-4,
}

/**
 * Default ADM1 stoichiometric parameters
 * Source: Batstone et al. (2002)
 */
export const DEFAULT_ADM1_STOICH_PARAMS: ADM1StoichiometricParameters = {
  // Disintegration fractions (must sum to 1.0)
  f_sI_xc: 0.1,
  f_xI_xc: 0.2,
  f_ch_xc: 0.2,
  f_pr_xc: 0.2,
  f_li_xc: 0.3,

  // Lipid hydrolysis
  f_fa_li: 0.95,

  // Yield coefficients
  Y_su: 0.10,
  Y_aa: 0.08,
  Y_fa: 0.06,
  Y_c4: 0.06,
  Y_pro: 0.04,
  Y_ac: 0.05,
  Y_H2: 0.06,

  // Carbon content [kmole C/gCOD]
  C_xc: 0.02786,
  C_sI: 0.03,
  C_ch: 0.0313,
  C_pr: 0.03,
  C_li: 0.022,
  C_xI: 0.03,
  C_su: 0.0313,
  C_aa: 0.03,
  C_fa: 0.0217,
  C_bu: 0.025,
  C_pro: 0.0268,
  C_ac: 0.0313,
  C_bac: 0.0313,
  C_va: 0.024,
  C_ch4: 0.0156,

  // Nitrogen content [kmole N/gCOD]
  N_xc: 0.00286,
  N_I: 0.00286,
  N_aa: 0.007,
  N_bac: 0.00571,

  // Amino acid degradation products
  f_bu_aa: 0.26,
  f_pro_aa: 0.05,
  f_ac_aa: 0.40,
  f_H2_aa: 0.06,
  f_va_aa: 0.23,

  // Sugar degradation products
  f_bu_su: 0.13,
  f_pro_su: 0.27,
  f_ac_su: 0.41,
  f_H2_su: 0.19,
}

/**
 * Default physicochemical parameters at 35°C
 * Source: ADM1 Report + thermodynamic data
 */
export const DEFAULT_ADM1_PHYSICHEM_PARAMS: ADM1PhysicoChemParameters = {
  // Henry's constants at 308K [kmole/(m³·bar)]
  K_H_H2: 7.38e-4,
  K_H_ch4: 1.16e-3,
  K_H_CO2: 2.71e-2,

  // Acid dissociation constants at 308K [kmole/m³]
  K_a_va: 1.38e-5,
  K_a_bu: 1.51e-5,
  K_a_pro: 1.32e-5,
  K_a_ac: 1.74e-5,
  K_a_CO2: 4.94e-7,  // First dissociation (CO2 + H2O ⇌ H+ + HCO3-)
  K_a_IN: 1.11e-9,   // NH4+ ⇌ H+ + NH3

  // Water dissociation
  K_w: 2.08e-14,

  // Gas-liquid transfer
  k_L_a: 200.0,

  // Reference temperature
  T_ref: 308.15,  // 35°C in Kelvin

  // Activation energies (for temperature adjustment of Ka)
  E_a_H2: 4180.0,
  E_a_ch4: 14240.0,
  E_a_CO2: 19410.0,
}

/**
 * Default temperature coefficients
 */
export const DEFAULT_ADM1_TEMP_COEFFS: ADM1TemperatureCoefficients = {
  T_ref: 35.0,  // °C

  // Activation energies [J/mol] - typical values
  E_a_k_dis: 20000,
  E_a_k_hyd: 20000,
  E_a_k_m_su: 30000,
  E_a_k_m_aa: 30000,
  E_a_k_m_fa: 30000,
  E_a_k_m_c4: 30000,
  E_a_k_m_pro: 30000,
  E_a_k_m_ac: 40000,  // Acetoclastic methanogens more sensitive
  E_a_k_m_H2: 40000,  // Hydrogenotrophic methanogens
  E_a_k_dec: 20000,
}

// ============================================
// ADM1 PROCESSES (19 Biochemical + 3 Gas Transfer)
// ============================================

/**
 * ADM1 Process types (19 biochemical processes)
 */
export type ADM1ProcessType =
  // Disintegration & Hydrolysis (4 processes)
  | 'disintegration'           // Process 1: Xc → Xch, Xpr, Xli, XI, SI
  | 'hydrolysis_carbohydrates' // Process 2: Xch → Ssu
  | 'hydrolysis_proteins'      // Process 3: Xpr → Saa
  | 'hydrolysis_lipids'        // Process 4: Xli → Sfa + Ssu (glycerol)

  // Acidogenesis (4 processes)
  | 'uptake_sugars'            // Process 5: Ssu → Sbu, Spro, Sac, SH2
  | 'uptake_amino_acids'       // Process 6: Saa → Sva, Sbu, Spro, Sac, SH2

  // Acetogenesis (3 processes)
  | 'uptake_LCFA'              // Process 7: Sfa → Sac, SH2
  | 'uptake_valerate'          // Process 8: Sva → Spro, Sac, SH2
  | 'uptake_butyrate'          // Process 9: Sbu → Sac, SH2
  | 'uptake_propionate'        // Process 10: Spro → Sac, SH2, SCO2

  // Methanogenesis (2 processes)
  | 'uptake_acetate'           // Process 11: Sac → Sch4, SCO2
  | 'uptake_hydrogen'          // Process 12: SH2 + SCO2 → Sch4

  // Decay (7 processes)
  | 'decay_X_su'               // Process 13
  | 'decay_X_aa'               // Process 14
  | 'decay_X_fa'               // Process 15
  | 'decay_X_c4'               // Process 16
  | 'decay_X_pro'              // Process 17
  | 'decay_X_ac'               // Process 18
  | 'decay_X_H2'               // Process 19

/**
 * Process rate information
 */
export interface ADM1ProcessRate {
  process: ADM1ProcessType
  name: string
  nameThai: string
  rate: number           // [gCOD/(m³·d)] or [kmole/(m³·d)]
  rateEquation: string   // Human-readable equation
}

// ============================================
// REACTOR CONFIGURATION
// ============================================

/**
 * Anaerobic reactor types
 */
export type ADM1ReactorType =
  | 'cstr'        // Continuous Stirred Tank Reactor (standard digester)
  | 'uasb'        // Upflow Anaerobic Sludge Blanket
  | 'batch'       // Batch reactor (BMP tests)
  | 'plug_flow'   // Plug flow (covered lagoon)

/**
 * Reactor configuration
 */
export interface ADM1ReactorConfig {
  type: ADM1ReactorType
  V_liq: number          // Liquid volume [m³]
  V_gas: number          // Headspace volume [m³]
  temperature: number    // Operating temperature [°C]
  pressure: number       // Operating pressure [bar] (usually 1.0)
  Q_in: number           // Influent flow rate [m³/d]
  HRT: number            // Hydraulic retention time [d]
  SRT?: number           // Solids retention time [d] (for UASB)
}

// ============================================
// SIMULATION CONFIGURATION & RESULTS
// ============================================

/**
 * ODE Solver methods (reuse from ASM1)
 */
export type ODESolverMethod =
  | 'euler'
  | 'rk2'
  | 'rk4'
  | 'rkf45'

/**
 * Simulation configuration
 */
export interface ADM1SimulationConfig {
  // Time settings
  startTime: number        // [d]
  endTime: number          // [d]
  timeStep: number         // [d]
  outputInterval: number   // [d]

  // Solver settings
  solver: ODESolverMethod
  tolerance?: number       // For adaptive solvers
  maxIterations?: number

  // Initial conditions
  initialState: ADM1StateVariables
  initialGasPhase?: ADM1GasPhase

  // Parameters (or use defaults)
  kineticParams?: Partial<ADM1KineticParameters>
  stoichParams?: Partial<ADM1StoichiometricParameters>
  physioChemParams?: Partial<ADM1PhysicoChemParameters>
  tempCoeffs?: Partial<ADM1TemperatureCoefficients>
}

/**
 * Single time point result
 */
export interface ADM1TimePoint {
  time: number
  state: ADM1StateVariables
  gasPhase: ADM1GasPhase
  processRates: ADM1ProcessRate[]
  pH: number
  alkalinity: number         // [kmole/m³]
  VFA_total: number          // [gCOD/m³]
  gasProduction: ADM1GasProduction
  inhibitionFactors: {
    I_pH_aa: number
    I_pH_ac: number
    I_pH_H2: number
    I_H2_fa: number
    I_H2_c4: number
    I_H2_pro: number
    I_NH3: number
    I_IN: number
  }
}

/**
 * Steady state detection info
 */
export interface SteadyStateInfo {
  reached: boolean
  timeToSteadyState?: number
  maxVariation: number
  convergenceMetric: number
}

/**
 * Complete simulation result
 */
export interface ADM1SimulationResult {
  // Configuration used
  config: ADM1SimulationConfig
  reactor: ADM1ReactorConfig

  // Time series data
  timeSeries: ADM1TimePoint[]

  // Final state
  finalState: ADM1StateVariables
  finalGasPhase: ADM1GasPhase

  // Effluent quality
  effluentQuality: {
    COD_total: number      // [gCOD/m³]
    COD_soluble: number    // [gCOD/m³]
    VFA_total: number      // [gCOD/m³]
    VFA_acetate: number    // [gCOD/m³]
    VFA_propionate: number // [gCOD/m³]
    VFA_butyrate: number   // [gCOD/m³]
    VFA_valerate: number   // [gCOD/m³]
    pH: number
    alkalinity: number     // [kmole/m³]
    NH4_N: number          // [gN/m³]
    TKN: number            // [gN/m³]
  }

  // Gas production summary
  gasProduction: {
    totalBiogas: number    // [Nm³/d]
    methane: number        // [Nm³/d]
    CO2: number            // [Nm³/d]
    methaneContent: number // [%]
    specificMethane: number // [Nm³ CH4/kg COD removed]
    energyPotential: number // [kWh/d]
  }

  // Performance metrics
  performance: {
    CODRemoval: number     // [%]
    VSDestruction: number  // [%]
    specificGasYield: number // [Nm³/kg VS]
    organicLoadingRate: number // [kg COD/(m³·d)]
    volumetricGasRate: number  // [Nm³/(m³·d)]
  }

  // Steady state info
  steadyState: SteadyStateInfo

  // Warnings and diagnostics
  diagnostics: {
    warnings: string[]
    errors: string[]
    pHStability: 'stable' | 'marginal' | 'unstable'
    VFAAccumulation: 'low' | 'moderate' | 'high'
    inhibitionStatus: string
  }

  // Computational info
  computation: {
    totalSteps: number
    executionTime: number  // [ms]
  }
}

// ============================================
// FEED CHARACTERIZATION
// ============================================

/**
 * Substrate fractionation (convert conventional params to ADM1)
 */
export interface ADM1Fractionation {
  // From total COD
  f_S_su: number    // Sugars fraction
  f_S_aa: number    // Amino acids fraction
  f_S_fa: number    // LCFA fraction
  f_S_I: number     // Soluble inerts

  // From particulate COD
  f_X_c: number     // Composites
  f_X_ch: number    // Carbohydrates
  f_X_pr: number    // Proteins
  f_X_li: number    // Lipids
  f_X_I: number     // Particulate inerts

  // Nitrogen fractionation
  f_S_IN: number    // Inorganic N fraction
  f_S_Norg: number  // Organic soluble N
  f_X_Norg: number  // Organic particulate N
}

/**
 * Preset substrate types
 */
export type SubstrateType =
  | 'primary_sludge'
  | 'waste_activated_sludge'
  | 'mixed_sludge'
  | 'food_waste'
  | 'cattle_manure'
  | 'pig_manure'
  | 'chicken_manure'
  | 'energy_crops'
  | 'custom'

/**
 * Conventional influent parameters
 */
export interface ADM1ConventionalInfluent {
  Q: number          // Flow rate [m³/d]
  COD: number        // Total COD [gCOD/m³]
  VS: number         // Volatile solids [g/m³]
  TS: number         // Total solids [g/m³]
  TKN: number        // Total Kjeldahl Nitrogen [gN/m³]
  NH4_N: number      // Ammonia nitrogen [gN/m³]
  alkalinity: number // Alkalinity [gCaCO3/m³]
  pH: number
  temperature: number // [°C]
}

/**
 * Default fractionation for common substrates
 */
export const DEFAULT_FRACTIONATIONS: Record<SubstrateType, ADM1Fractionation> = {
  primary_sludge: {
    f_S_su: 0.05, f_S_aa: 0.03, f_S_fa: 0.02, f_S_I: 0.05,
    f_X_c: 0.40, f_X_ch: 0.10, f_X_pr: 0.15, f_X_li: 0.10, f_X_I: 0.10,
    f_S_IN: 0.20, f_S_Norg: 0.10, f_X_Norg: 0.70,
  },
  waste_activated_sludge: {
    f_S_su: 0.02, f_S_aa: 0.02, f_S_fa: 0.01, f_S_I: 0.05,
    f_X_c: 0.50, f_X_ch: 0.08, f_X_pr: 0.20, f_X_li: 0.07, f_X_I: 0.05,
    f_S_IN: 0.15, f_S_Norg: 0.05, f_X_Norg: 0.80,
  },
  mixed_sludge: {
    f_S_su: 0.04, f_S_aa: 0.03, f_S_fa: 0.02, f_S_I: 0.05,
    f_X_c: 0.45, f_X_ch: 0.09, f_X_pr: 0.17, f_X_li: 0.08, f_X_I: 0.07,
    f_S_IN: 0.18, f_S_Norg: 0.07, f_X_Norg: 0.75,
  },
  food_waste: {
    f_S_su: 0.15, f_S_aa: 0.10, f_S_fa: 0.05, f_S_I: 0.02,
    f_X_c: 0.20, f_X_ch: 0.20, f_X_pr: 0.15, f_X_li: 0.10, f_X_I: 0.03,
    f_S_IN: 0.10, f_S_Norg: 0.15, f_X_Norg: 0.75,
  },
  cattle_manure: {
    f_S_su: 0.03, f_S_aa: 0.02, f_S_fa: 0.02, f_S_I: 0.08,
    f_X_c: 0.30, f_X_ch: 0.25, f_X_pr: 0.10, f_X_li: 0.05, f_X_I: 0.15,
    f_S_IN: 0.25, f_S_Norg: 0.10, f_X_Norg: 0.65,
  },
  pig_manure: {
    f_S_su: 0.05, f_S_aa: 0.04, f_S_fa: 0.03, f_S_I: 0.05,
    f_X_c: 0.35, f_X_ch: 0.15, f_X_pr: 0.15, f_X_li: 0.08, f_X_I: 0.10,
    f_S_IN: 0.30, f_S_Norg: 0.10, f_X_Norg: 0.60,
  },
  chicken_manure: {
    f_S_su: 0.04, f_S_aa: 0.05, f_S_fa: 0.02, f_S_I: 0.04,
    f_X_c: 0.40, f_X_ch: 0.12, f_X_pr: 0.18, f_X_li: 0.05, f_X_I: 0.10,
    f_S_IN: 0.35, f_S_Norg: 0.10, f_X_Norg: 0.55,
  },
  energy_crops: {
    f_S_su: 0.08, f_S_aa: 0.02, f_S_fa: 0.01, f_S_I: 0.03,
    f_X_c: 0.30, f_X_ch: 0.35, f_X_pr: 0.08, f_X_li: 0.05, f_X_I: 0.08,
    f_S_IN: 0.05, f_S_Norg: 0.10, f_X_Norg: 0.85,
  },
  custom: {
    f_S_su: 0.05, f_S_aa: 0.03, f_S_fa: 0.02, f_S_I: 0.05,
    f_X_c: 0.35, f_X_ch: 0.15, f_X_pr: 0.15, f_X_li: 0.10, f_X_I: 0.10,
    f_S_IN: 0.20, f_S_Norg: 0.10, f_X_Norg: 0.70,
  },
}

/**
 * Typical substrate characteristics
 */
export const SUBSTRATE_CHARACTERISTICS: Record<SubstrateType, {
  name: string
  nameThai: string
  COD_typical: number      // [gCOD/m³]
  VS_typical: number       // [g/m³]
  TKN_typical: number      // [gN/m³]
  C_N_ratio: number        // C:N ratio
  methane_potential: number // [Nm³ CH4/kg VS]
  HRT_typical: [number, number] // [min, max] days
}> = {
  primary_sludge: {
    name: 'Primary Sludge',
    nameThai: 'ตะกอนปฐมภูมิ',
    COD_typical: 40000,
    VS_typical: 25000,
    TKN_typical: 1500,
    C_N_ratio: 15,
    methane_potential: 0.35,
    HRT_typical: [15, 20],
  },
  waste_activated_sludge: {
    name: 'Waste Activated Sludge',
    nameThai: 'ตะกอนส่วนเกิน',
    COD_typical: 30000,
    VS_typical: 22000,
    TKN_typical: 2500,
    C_N_ratio: 8,
    methane_potential: 0.25,
    HRT_typical: [20, 25],
  },
  mixed_sludge: {
    name: 'Mixed Sludge',
    nameThai: 'ตะกอนผสม',
    COD_typical: 35000,
    VS_typical: 23000,
    TKN_typical: 2000,
    C_N_ratio: 12,
    methane_potential: 0.30,
    HRT_typical: [15, 22],
  },
  food_waste: {
    name: 'Food Waste',
    nameThai: 'ขยะอาหาร',
    COD_typical: 120000,
    VS_typical: 100000,
    TKN_typical: 5000,
    C_N_ratio: 18,
    methane_potential: 0.45,
    HRT_typical: [20, 30],
  },
  cattle_manure: {
    name: 'Cattle Manure',
    nameThai: 'มูลวัว',
    COD_typical: 60000,
    VS_typical: 45000,
    TKN_typical: 2800,
    C_N_ratio: 20,
    methane_potential: 0.25,
    HRT_typical: [20, 30],
  },
  pig_manure: {
    name: 'Pig Manure',
    nameThai: 'มูลสุกร',
    COD_typical: 50000,
    VS_typical: 35000,
    TKN_typical: 4500,
    C_N_ratio: 12,
    methane_potential: 0.30,
    HRT_typical: [15, 25],
  },
  chicken_manure: {
    name: 'Chicken Manure',
    nameThai: 'มูลไก่',
    COD_typical: 80000,
    VS_typical: 55000,
    TKN_typical: 8000,
    C_N_ratio: 8,
    methane_potential: 0.35,
    HRT_typical: [20, 30],
  },
  energy_crops: {
    name: 'Energy Crops (Maize)',
    nameThai: 'พืชพลังงาน (ข้าวโพด)',
    COD_typical: 150000,
    VS_typical: 120000,
    TKN_typical: 3000,
    C_N_ratio: 40,
    methane_potential: 0.40,
    HRT_typical: [25, 40],
  },
  custom: {
    name: 'Custom Substrate',
    nameThai: 'กำหนดเอง',
    COD_typical: 50000,
    VS_typical: 35000,
    TKN_typical: 2000,
    C_N_ratio: 15,
    methane_potential: 0.30,
    HRT_typical: [15, 30],
  },
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * All ADM1 parameters combined
 */
export interface ADM1AllParameters {
  kinetic: ADM1KineticParameters
  stoich: ADM1StoichiometricParameters
  physioChem: ADM1PhysicoChemParameters
  tempCoeffs: ADM1TemperatureCoefficients
}

/**
 * Initial state for typical mesophilic digester
 */
export const DEFAULT_INITIAL_STATE: ADM1StateVariables = {
  // Soluble - low values for startup
  S_su: 10,
  S_aa: 5,
  S_fa: 5,
  S_va: 5,
  S_bu: 5,
  S_pro: 5,
  S_ac: 20,
  S_H2: 1e-8,
  S_ch4: 5e-5,
  S_IC: 0.04,     // ~40 mM
  S_IN: 0.04,     // ~560 mg NH4-N/L
  S_I: 50,

  // Particulate - typical biomass concentrations
  X_c: 100,
  X_ch: 50,
  X_pr: 50,
  X_li: 50,
  X_su: 400,     // Sugar degraders
  X_aa: 200,     // AA degraders
  X_fa: 100,     // LCFA degraders (slow growers)
  X_c4: 200,     // C4 degraders
  X_pro: 100,    // Propionate degraders (slow)
  X_ac: 300,     // Acetoclastic methanogens
  X_H2: 200,     // Hydrogenotrophic methanogens
  X_I: 100,
}

/**
 * Default gas phase initial state
 */
export const DEFAULT_INITIAL_GAS_PHASE: ADM1GasPhase = {
  S_gas_H2: 1e-5,
  S_gas_ch4: 0.4,      // ~0.65 bar partial pressure
  S_gas_CO2: 0.15,     // ~0.35 bar partial pressure
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Physical constants used in ADM1
 */
export const ADM1_CONSTANTS = {
  R: 8.314,            // Universal gas constant [J/(mol·K)]
  P_atm: 1.01325,      // Atmospheric pressure [bar]
  COD_CH4: 64,         // COD equivalent of CH4 [gCOD/mol]
  COD_H2: 16,          // COD equivalent of H2 [gCOD/mol]
  MW_CH4: 16.04,       // Molecular weight CH4 [g/mol]
  MW_CO2: 44.01,       // Molecular weight CO2 [g/mol]
  MW_H2: 2.016,        // Molecular weight H2 [g/mol]
  MW_N: 14.007,        // Molecular weight N [g/mol]
  VM_STP: 22.414,      // Molar volume at STP [L/mol]
  ENERGY_CH4: 10,      // Energy content of CH4 [kWh/Nm³]
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type ADM1Parameters = ADM1KineticParameters & ADM1StoichiometricParameters
