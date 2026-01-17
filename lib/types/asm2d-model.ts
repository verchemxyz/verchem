/**
 * VerChem - ASM2d (Activated Sludge Model No. 2d) Type Definitions
 *
 * Complete implementation of IWA ASM2d for biological phosphorus removal
 * with denitrifying PAOs. Extends ASM1 with EBPR processes.
 *
 * Reference: Henze et al. (1999) "Activated Sludge Models ASM1, ASM2, ASM2d and ASM3"
 *            IWA Scientific and Technical Report No. 9
 *
 * Key additions from ASM1:
 * - Phosphorus Accumulating Organisms (PAOs)
 * - Denitrifying PAOs (dPAOs) - unique to ASM2d
 * - Fermentation process
 * - PHA/Poly-P storage dynamics
 *
 * State Variables: 19 (vs ASM1's 13)
 * Processes: 21 (vs ASM1's 8)
 */

// ============================================
// STATE VARIABLES (19 components)
// ============================================

/**
 * ASM2d State Variables
 * Units: mg COD/L for COD, mg N/L for nitrogen, mg P/L for phosphorus
 */
export interface ASM2dStateVariables {
  // ========== SOLUBLE COMPONENTS (10) ==========

  /** Inert soluble organic matter [mg COD/L] */
  SI: number

  /** Fermentable, readily biodegradable substrate [mg COD/L]
   * Note: In ASM1 this was SS. ASM2d splits SS into SF + SA */
  SF: number

  /** Fermentation products - acetate/VFA [mg COD/L]
   * Key substrate for PAO metabolism */
  SA: number

  /** Dissolved oxygen [mg O2/L] */
  SO: number

  /** Nitrate and nitrite nitrogen [mg N/L] */
  SNO: number

  /** Ammonium nitrogen [mg N/L] */
  SNH: number

  /** Soluble biodegradable organic nitrogen [mg N/L] */
  SND: number

  /** Soluble orthophosphate [mg P/L]
   * Key parameter for EBPR performance */
  SPO4: number

  /** Alkalinity [mole HCO3-/m³] */
  SALK: number

  // ========== PARTICULATE COMPONENTS (9) ==========

  /** Inert particulate organic matter [mg COD/L] */
  XI: number

  /** Slowly biodegradable substrate [mg COD/L] */
  XS: number

  /** Active heterotrophic biomass [mg COD/L]
   * Note: Renamed from XBH in ASM1 */
  XH: number

  /** Active autotrophic (nitrifying) biomass [mg COD/L]
   * Note: Renamed from XBA in ASM1 */
  XAUT: number

  /** Phosphorus accumulating organisms [mg COD/L]
   * Core of EBPR process */
  XPAO: number

  /** Poly-hydroxy-alkanoates stored in PAO [mg COD/L]
   * Internal carbon storage */
  XPHA: number

  /** Poly-phosphate stored in PAO [mg P/L]
   * Internal phosphorus storage */
  XPP: number

  /** Particulate products from biomass decay [mg COD/L] */
  XP: number

  /** Particulate biodegradable organic nitrogen [mg N/L] */
  XND: number
}

/**
 * Order of state variables for matrix operations
 * Must match the order used in stoichiometric matrix
 */
export const ASM2d_STATE_ORDER: (keyof ASM2dStateVariables)[] = [
  // Soluble (indices 0-8)
  'SI', 'SF', 'SA', 'SO', 'SNO', 'SNH', 'SND', 'SPO4', 'SALK',
  // Particulate (indices 9-17)
  'XI', 'XS', 'XH', 'XAUT', 'XPAO', 'XPHA', 'XPP', 'XP', 'XND'
]

// Component indices for quick access
export const ASM2d_COMPONENT_INDEX = {
  SI: 0, SF: 1, SA: 2, SO: 3, SNO: 4, SNH: 5, SND: 6, SPO4: 7, SALK: 8,
  XI: 9, XS: 10, XH: 11, XAUT: 12, XPAO: 13, XPHA: 14, XPP: 15, XP: 16, XND: 17
} as const

// ============================================
// KINETIC PARAMETERS (~30 parameters)
// ============================================

/**
 * ASM2d Kinetic Parameters
 * All rates at 20°C reference temperature
 */
export interface ASM2dKineticParameters {
  // ========== HETEROTROPH PARAMETERS ==========

  /** Maximum specific growth rate of heterotrophs [1/d] */
  muH: number

  /** Half-saturation coefficient for SF [mg COD/L] */
  KS: number

  /** Half-saturation coefficient for SA (heterotrophs) [mg COD/L] */
  KSA: number

  /** Half-saturation coefficient for oxygen (heterotrophs) [mg O2/L] */
  KO: number

  /** Half-saturation coefficient for nitrate [mg N/L] */
  KNO: number

  /** Decay rate of heterotrophs [1/d] */
  bH: number

  /** Anoxic growth reduction factor [-] */
  etaG: number

  /** Anoxic hydrolysis reduction factor [-] */
  etaH: number

  /** Anaerobic hydrolysis reduction factor [-] */
  etaFe: number

  // ========== FERMENTATION PARAMETERS ==========

  /** Maximum fermentation rate [1/d] */
  qfe: number

  /** Half-saturation for fermentation [mg COD/L] */
  KFe: number

  // ========== PAO PARAMETERS (EBPR) ==========

  /** Maximum rate of PHA storage [mg COD/mg COD PAO/d] */
  qPHA: number

  /** Maximum rate of poly-P storage [mg P/mg COD PAO/d] */
  qPP: number

  /** Maximum specific growth rate of PAO [1/d] */
  muPAO: number

  /** Decay rate of PAO [1/d] */
  bPAO: number

  /** Lysis rate of poly-P [1/d] */
  bPP: number

  /** Lysis rate of PHA [1/d] */
  bPHA: number

  /** Half-saturation coefficient for SA (PAO) [mg COD/L] */
  KA: number

  /** Half-saturation coefficient for phosphate [mg P/L] */
  KP: number

  /** Half-saturation coefficient for poly-P [mg P/mg COD PAO] */
  KPP: number

  /** Half-saturation coefficient for PHA [mg COD/mg COD PAO] */
  KPHA: number

  /** Maximum ratio of XPP/XPAO [mg P/mg COD] */
  KMAX: number

  /** Inhibition coefficient for poly-P storage [-] */
  KIPP: number

  /** Half-saturation coefficient for NH4 (PAO) [mg N/L] */
  KNH_PAO: number

  /** Half-saturation coefficient for oxygen (PAO) [mg O2/L] */
  KO_PAO: number

  /** Half-saturation coefficient for alkalinity [mole/m³] */
  KALK: number

  /** Anoxic reduction factor for PAO (dPAO activity) [-]
   * Key parameter distinguishing ASM2d from ASM2 */
  etaNO3_PAO: number

  // ========== AUTOTROPH PARAMETERS ==========

  /** Maximum specific growth rate of autotrophs [1/d] */
  muAUT: number

  /** Half-saturation coefficient for NH4 (autotrophs) [mg N/L] */
  KNH: number

  /** Half-saturation coefficient for oxygen (autotrophs) [mg O2/L] */
  KOA: number

  /** Decay rate of autotrophs [1/d] */
  bAUT: number

  // ========== HYDROLYSIS PARAMETERS ==========

  /** Maximum hydrolysis rate [1/d] */
  kh: number

  /** Half-saturation coefficient for hydrolysis [mg COD/mg COD] */
  KX: number

  // ========== CHEMICAL PRECIPITATION (Optional) ==========

  /** Precipitation rate constant [m³/(g Me·d)] */
  kPRE: number

  /** Redissolution rate constant [1/d] */
  kRED: number
}

// ============================================
// STOICHIOMETRIC PARAMETERS
// ============================================

/**
 * ASM2d Stoichiometric Parameters
 */
export interface ASM2dStoichiometricParameters {
  // ========== YIELD COEFFICIENTS ==========

  /** Yield of heterotrophs [g COD/g COD] */
  YH: number

  /** Yield of autotrophs [g COD/g N] */
  YAUT: number

  /** Yield of PAO [g COD/g COD] */
  YPAO: number

  /** P release per PHA stored (anaerobic) [g P/g COD] */
  YPO4: number

  /** PHA requirement for PP storage [g COD/g P] */
  YPHA: number

  // ========== BIOMASS COMPOSITION ==========

  /** Fraction of inert COD generated in lysis [-] */
  fXI: number

  /** N content of biomass [g N/g COD] */
  iXB: number

  /** N content of inerts from lysis [g N/g COD] */
  iXP: number

  /** P content of biomass [g P/g COD] */
  iPB: number

  /** P content of inerts from lysis [g P/g COD] */
  iPP: number

  // ========== FRACTIONATION ==========

  /** Fraction of SI in XS hydrolysis [-] */
  fSI: number
}

// ============================================
// TEMPERATURE COEFFICIENTS
// ============================================

/**
 * Arrhenius temperature coefficients (θ values)
 * k(T) = k(20) × θ^(T-20)
 */
export interface ASM2dTemperatureCoefficients {
  // Heterotrophs
  theta_muH: number     // 1.072
  theta_bH: number      // 1.029

  // PAO
  theta_qPHA: number    // 1.041
  theta_qPP: number     // 1.041
  theta_muPAO: number   // 1.041
  theta_bPAO: number    // 1.029

  // Autotrophs
  theta_muAUT: number   // 1.103
  theta_bAUT: number    // 1.029

  // Hydrolysis
  theta_kh: number      // 1.041

  // Fermentation
  theta_qfe: number     // 1.029
}

// ============================================
// PROCESS DEFINITIONS (21 processes)
// ============================================

/**
 * ASM2d Process Types
 */
export type ASM2dProcessType =
  // Hydrolysis (1-3)
  | 'aerobic_hydrolysis'        // ρ1
  | 'anoxic_hydrolysis'         // ρ2
  | 'anaerobic_hydrolysis'      // ρ3

  // Heterotroph growth (4-7)
  | 'aerobic_growth_H_SF'       // ρ4: Growth on fermentable substrate
  | 'aerobic_growth_H_SA'       // ρ5: Growth on acetate
  | 'anoxic_growth_H_SF'        // ρ6: Denitrification on SF
  | 'anoxic_growth_H_SA'        // ρ7: Denitrification on SA

  // Fermentation (8)
  | 'fermentation'              // ρ8: SF → SA

  // Heterotroph lysis (9)
  | 'lysis_H'                   // ρ9

  // PAO processes (10-17)
  | 'storage_PHA'               // ρ10: Anaerobic PHA storage
  | 'aerobic_storage_PP'        // ρ11: Aerobic poly-P uptake
  | 'anoxic_storage_PP'         // ρ12: Anoxic poly-P uptake (dPAO)
  | 'aerobic_growth_PAO'        // ρ13: Aerobic PAO growth
  | 'anoxic_growth_PAO'         // ρ14: Anoxic PAO growth (dPAO)
  | 'lysis_PAO'                 // ρ15
  | 'lysis_PP'                  // ρ16
  | 'lysis_PHA'                 // ρ17

  // Autotroph processes (18-19)
  | 'aerobic_growth_AUT'        // ρ18: Nitrification
  | 'lysis_AUT'                 // ρ19

  // Chemical precipitation (20-21, optional)
  | 'precipitation'             // ρ20
  | 'redissolution'             // ρ21

/**
 * Process rate result
 */
export interface ASM2dProcessRate {
  process: ASM2dProcessType
  name: string
  rate: number              // [mg/L/d] or appropriate unit
  rateEquation: string      // Human-readable equation
  isActive: boolean         // Whether conditions allow this process
}

// ============================================
// REACTOR CONFIGURATION
// ============================================

/**
 * Reactor zone types for BNR
 */
export type ASM2dZoneType = 'anaerobic' | 'anoxic' | 'aerobic'

/**
 * Single reactor zone configuration
 */
export interface ASM2dReactorZone {
  /** Unique zone identifier */
  id: string

  /** Zone name for display */
  name: string

  /** Zone type determines switching functions */
  type: ASM2dZoneType

  /** Zone volume [m³] */
  volume: number

  /** Target dissolved oxygen [mg/L] (for aerobic zones) */
  targetDO?: number

  /** Mixing intensity (0-1) */
  mixingIntensity: number

  /** Hydraulic retention time [h] (calculated) */
  hrt?: number
}

/**
 * Complete reactor configuration
 */
export interface ASM2dReactorConfig {
  /** Reactor type */
  type: 'ao' | 'a2o' | 'bardenpho' | 'uct' | 'johannesburg' | 'custom'

  /** Reactor zones (in flow order) */
  zones: ASM2dReactorZone[]

  /** Total reactor volume [m³] */
  totalVolume: number

  /** Total hydraulic retention time [h] */
  totalHRT: number

  /** Sludge retention time [d] */
  srt: number

  /** Operating temperature [°C] */
  temperature: number

  /** Recirculation configuration */
  recirculation: {
    /** Internal recirculation (aerobic → anoxic) [-] */
    internal: number

    /** Return activated sludge (RAS) ratio [-] */
    ras: number

    /** Sludge wastage rate [m³/d] */
    wastage: number
  }

  /** Enable denitrifying PAO activity */
  enableDPAO: boolean

  /** Enable chemical P precipitation */
  enableChemP?: boolean
}

// ============================================
// SIMULATION CONFIGURATION
// ============================================

/**
 * Simulation mode
 */
export type ASM2dSimulationMode = 'steady_state' | 'dynamic'

/**
 * ODE solver method
 */
export type ASM2dSolverMethod = 'euler' | 'rk2' | 'rk4' | 'rkf45'

/**
 * Simulation configuration
 */
export interface ASM2dSimulationConfig {
  /** Simulation mode */
  mode: ASM2dSimulationMode

  /** Start time [d] */
  startTime: number

  /** End time [d] */
  endTime: number

  /** Time step [d] */
  timeStep: number

  /** Output interval [d] */
  outputInterval: number

  /** ODE solver method */
  solver: ASM2dSolverMethod

  /** Solver tolerance for adaptive methods */
  tolerance: number

  /** Maximum iterations for steady state */
  maxIterations: number

  /** Initial state */
  initialState: ASM2dStateVariables
}

// ============================================
// INFLUENT FRACTIONATION
// ============================================

/**
 * Conventional influent parameters
 */
export interface ASM2dConventionalInfluent {
  /** Total flow rate [m³/d] */
  flowRate: number

  /** Total COD [mg/L] */
  COD: number

  /** BOD5 [mg/L] */
  BOD5: number

  /** Total suspended solids [mg/L] */
  TSS: number

  /** Volatile suspended solids [mg/L] */
  VSS: number

  /** Total Kjeldahl nitrogen [mg N/L] */
  TKN: number

  /** Ammonium nitrogen [mg N/L] */
  NH4N: number

  /** Total phosphorus [mg P/L] */
  TP: number

  /** Orthophosphate [mg P/L] */
  PO4P: number

  /** Volatile fatty acids / acetate [mg COD/L] */
  VFA?: number

  /** Alkalinity [mg CaCO3/L] */
  alkalinity: number
}

/**
 * COD fractionation for ASM2d
 */
export interface ASM2dCODFractionation {
  /** Soluble inert fraction [-] */
  fSI: number

  /** Fermentable fraction [-] */
  fSF: number

  /** Acetate/VFA fraction [-] */
  fSA: number

  /** Particulate inert fraction [-] */
  fXI: number

  /** Slowly biodegradable fraction [-] */
  fXS: number
}

/**
 * Nitrogen fractionation
 */
export interface ASM2dNitrogenFractionation {
  /** Fraction as NH4-N [-] */
  fSNH: number

  /** Soluble organic N fraction [-] */
  fSND: number

  /** Particulate organic N fraction [-] */
  fXND: number
}

/**
 * Phosphorus fractionation
 */
export interface ASM2dPhosphorusFractionation {
  /** Fraction as PO4-P [-] */
  fSPO4: number

  /** Particulate organic P fraction [-] */
  fXP: number
}

// ============================================
// SIMULATION RESULTS
// ============================================

/**
 * Time series data point
 */
export interface ASM2dTimePoint {
  /** Time [d] */
  time: number

  /** State at this time */
  state: ASM2dStateVariables

  /** Process rates at this time */
  processRates?: ASM2dProcessRate[]

  /** Zone-specific states (for multi-zone) */
  zoneStates?: Record<string, ASM2dStateVariables>
}

/**
 * Effluent quality results
 */
export interface ASM2dEffluentQuality {
  /** Total COD [mg/L] */
  COD: number

  /** Soluble COD [mg/L] */
  sCOD: number

  /** BOD5 [mg/L] */
  BOD5: number

  /** Total suspended solids [mg/L] */
  TSS: number

  /** Volatile suspended solids [mg/L] */
  VSS: number

  /** Total Kjeldahl nitrogen [mg N/L] */
  TKN: number

  /** Ammonium nitrogen [mg N/L] */
  NH4N: number

  /** Nitrate nitrogen [mg N/L] */
  NO3N: number

  /** Total nitrogen [mg N/L] */
  TN: number

  /** Total phosphorus [mg P/L] */
  TP: number

  /** Orthophosphate [mg P/L] */
  PO4P: number
}

/**
 * Treatment performance metrics
 */
export interface ASM2dPerformanceMetrics {
  /** BOD removal efficiency [%] */
  bodRemoval: number

  /** COD removal efficiency [%] */
  codRemoval: number

  /** TSS removal efficiency [%] */
  tssRemoval: number

  /** NH4 removal efficiency [%] */
  nh4Removal: number

  /** Total N removal efficiency [%] */
  tnRemoval: number

  /** Total P removal efficiency [%] */
  tpRemoval: number

  /** Biological P removal [%] */
  bioPRemoval: number

  /** Chemical P removal [%] (if enabled) */
  chemPRemoval?: number
}

/**
 * PAO population metrics
 */
export interface ASM2dPAOMetrics {
  /** PAO concentration [mg COD/L] */
  XPAO: number

  /** PAO fraction of active biomass [%] */
  paoFraction: number

  /** PHA/PAO ratio [mg COD/mg COD] */
  phaRatio: number

  /** PP/PAO ratio [mg P/mg COD] */
  ppRatio: number

  /** Estimated dPAO activity [%] */
  dpaoActivity: number

  /** P release rate (anaerobic) [mg P/mg COD PAO/d] */
  pReleaseRate: number

  /** P uptake rate (aerobic) [mg P/mg COD PAO/d] */
  pUptakeRate: number
}

/**
 * Sludge production results
 */
export interface ASM2dSludgeProduction {
  /** Total VSS in reactor [mg/L] */
  totalVSS: number

  /** Total TSS in reactor [mg/L] */
  totalTSS: number

  /** Observed yield [g TSS/g COD removed] */
  yieldObserved: number

  /** Wastage rate [kg TSS/d] */
  wastageRate: number

  /** P content in sludge [%] */
  pContent: number

  /** Sludge production [kg TSS/d] */
  production: number
}

/**
 * Oxygen demand results
 */
export interface ASM2dOxygenDemand {
  /** Carbonaceous oxygen demand [kg O2/d] */
  carbonaceous: number

  /** Nitrogenous oxygen demand [kg O2/d] */
  nitrogenous: number

  /** Total oxygen demand [kg O2/d] */
  total: number

  /** Specific oxygen demand [kg O2/kg COD removed] */
  specific: number

  /** Alpha factor (process water/clean water) [-] */
  alpha?: number
}

/**
 * Phosphorus mass balance
 */
export interface ASM2dPhosphorusBalance {
  /** Influent P load [kg P/d] */
  influentLoad: number

  /** Effluent P load [kg P/d] */
  effluentLoad: number

  /** P removed in sludge [kg P/d] */
  sludgeP: number

  /** Biological P removal [kg P/d] */
  bioP: number

  /** Chemical P removal [kg P/d] (if enabled) */
  chemP?: number

  /** Balance closure [%] */
  closure: number
}

/**
 * Steady state detection info
 */
export interface ASM2dSteadyStateInfo {
  /** Whether steady state was reached */
  reached: boolean

  /** Time to reach steady state [d] */
  timeToSteadyState?: number

  /** Maximum variation in last period [%] */
  maxVariation: number

  /** Convergence metric */
  convergenceMetric: number
}

/**
 * Complete simulation result
 */
export interface ASM2dSimulationResult {
  /** Simulation configuration used */
  config: ASM2dSimulationConfig

  /** Reactor configuration used */
  reactor: ASM2dReactorConfig

  /** Time series data */
  timeSeries: ASM2dTimePoint[]

  /** Final state */
  finalState: ASM2dStateVariables

  /** Zone-specific final states */
  zoneStates?: Record<string, ASM2dStateVariables>

  /** Effluent quality */
  effluentQuality: ASM2dEffluentQuality

  /** Performance metrics */
  performance: ASM2dPerformanceMetrics

  /** PAO metrics */
  paoMetrics: ASM2dPAOMetrics

  /** Sludge production */
  sludgeProduction: ASM2dSludgeProduction

  /** Oxygen demand */
  oxygenDemand: ASM2dOxygenDemand

  /** Phosphorus balance */
  phosphorusBalance: ASM2dPhosphorusBalance

  /** Steady state info */
  steadyState: ASM2dSteadyStateInfo

  /** Computation metadata */
  computation: {
    totalSteps: number
    executionTime: number
    warnings: string[]
    errors: string[]
  }
}

// ============================================
// DEFAULT PARAMETER VALUES
// ============================================

/**
 * Default kinetic parameters at 20°C
 * Based on Henze et al. (1999) typical values
 */
export const DEFAULT_ASM2d_KINETIC_PARAMS: ASM2dKineticParameters = {
  // Heterotrophs
  muH: 6.0,         // [1/d]
  KS: 20.0,         // [mg COD/L]
  KSA: 20.0,        // [mg COD/L]
  KO: 0.2,          // [mg O2/L]
  KNO: 0.5,         // [mg N/L]
  bH: 0.4,          // [1/d]
  etaG: 0.8,        // [-]
  etaH: 0.4,        // [-]
  etaFe: 0.4,       // [-]

  // Fermentation
  qfe: 3.0,         // [1/d]
  KFe: 4.0,         // [mg COD/L]

  // PAO
  qPHA: 3.0,        // [mg COD/mg COD PAO/d]
  qPP: 1.5,         // [mg P/mg COD PAO/d]
  muPAO: 1.0,       // [1/d]
  bPAO: 0.2,        // [1/d]
  bPP: 0.2,         // [1/d]
  bPHA: 0.2,        // [1/d]
  KA: 4.0,          // [mg COD/L]
  KP: 0.2,          // [mg P/L]
  KPP: 0.01,        // [mg P/mg COD PAO]
  KPHA: 0.01,       // [mg COD/mg COD PAO]
  KMAX: 0.34,       // [mg P/mg COD]
  KIPP: 0.02,       // [-]
  KNH_PAO: 0.05,    // [mg N/L]
  KO_PAO: 0.2,      // [mg O2/L]
  KALK: 0.1,        // [mole/m³]
  etaNO3_PAO: 0.6,  // [-] dPAO reduction factor

  // Autotrophs
  muAUT: 0.8,       // [1/d]
  KNH: 1.0,         // [mg N/L]
  KOA: 0.4,         // [mg O2/L]
  bAUT: 0.15,       // [1/d]

  // Hydrolysis
  kh: 3.0,          // [1/d]
  KX: 0.1,          // [-]

  // Chemical precipitation (optional)
  kPRE: 1.0,        // [m³/(g Me·d)]
  kRED: 0.6,        // [1/d]
}

/**
 * Default stoichiometric parameters
 * Based on Henze et al. (1999) typical values
 */
export const DEFAULT_ASM2d_STOICH_PARAMS: ASM2dStoichiometricParameters = {
  // Yields
  YH: 0.625,        // [g COD/g COD]
  YAUT: 0.24,       // [g COD/g N]
  YPAO: 0.625,      // [g COD/g COD]
  YPO4: 0.4,        // [g P/g COD] P release per PHA stored
  YPHA: 0.2,        // [g COD/g P] PHA for PP storage

  // Biomass composition
  fXI: 0.1,         // [-]
  iXB: 0.086,       // [g N/g COD]
  iXP: 0.06,        // [g N/g COD]
  iPB: 0.02,        // [g P/g COD]
  iPP: 0.01,        // [g P/g COD]

  // Fractionation
  fSI: 0.0,         // [-]
}

/**
 * Default temperature coefficients
 */
export const DEFAULT_ASM2d_TEMP_COEFFS: ASM2dTemperatureCoefficients = {
  theta_muH: 1.072,
  theta_bH: 1.029,
  theta_qPHA: 1.041,
  theta_qPP: 1.041,
  theta_muPAO: 1.041,
  theta_bPAO: 1.029,
  theta_muAUT: 1.103,
  theta_bAUT: 1.029,
  theta_kh: 1.041,
  theta_qfe: 1.029,
}

/**
 * Default COD fractionation for domestic wastewater
 */
export const DEFAULT_DOMESTIC_COD_FRACTIONATION: ASM2dCODFractionation = {
  fSI: 0.05,        // 5% soluble inert
  fSF: 0.15,        // 15% fermentable
  fSA: 0.05,        // 5% acetate/VFA
  fXI: 0.13,        // 13% particulate inert
  fXS: 0.62,        // 62% slowly biodegradable
}

/**
 * Default nitrogen fractionation
 */
export const DEFAULT_N_FRACTIONATION: ASM2dNitrogenFractionation = {
  fSNH: 0.70,       // 70% as NH4
  fSND: 0.10,       // 10% soluble organic
  fXND: 0.20,       // 20% particulate organic
}

/**
 * Default phosphorus fractionation
 */
export const DEFAULT_P_FRACTIONATION: ASM2dPhosphorusFractionation = {
  fSPO4: 0.75,      // 75% as PO4
  fXP: 0.25,        // 25% particulate
}

/**
 * Default initial state for simulation
 */
export const DEFAULT_ASM2d_INITIAL_STATE: ASM2dStateVariables = {
  // Soluble
  SI: 30,           // [mg COD/L]
  SF: 5,            // [mg COD/L]
  SA: 5,            // [mg COD/L]
  SO: 2.0,          // [mg O2/L]
  SNO: 5,           // [mg N/L]
  SNH: 2,           // [mg N/L]
  SND: 1,           // [mg N/L]
  SPO4: 2,          // [mg P/L]
  SALK: 5,          // [mole/m³]

  // Particulate
  XI: 1000,         // [mg COD/L]
  XS: 100,          // [mg COD/L]
  XH: 2000,         // [mg COD/L]
  XAUT: 200,        // [mg COD/L]
  XPAO: 500,        // [mg COD/L]
  XPHA: 50,         // [mg COD/L]
  XPP: 100,         // [mg P/L]
  XP: 500,          // [mg COD/L]
  XND: 10,          // [mg N/L]
}

/**
 * Default reactor configuration for A2O process
 */
export const DEFAULT_A2O_REACTOR_CONFIG: ASM2dReactorConfig = {
  type: 'a2o',
  zones: [
    {
      id: 'anaerobic',
      name: 'Anaerobic Zone',
      type: 'anaerobic',
      volume: 500,
      mixingIntensity: 0.8,
    },
    {
      id: 'anoxic',
      name: 'Anoxic Zone',
      type: 'anoxic',
      volume: 1000,
      mixingIntensity: 0.8,
    },
    {
      id: 'aerobic',
      name: 'Aerobic Zone',
      type: 'aerobic',
      volume: 3000,
      targetDO: 2.0,
      mixingIntensity: 1.0,
    },
  ],
  totalVolume: 4500,
  totalHRT: 12,
  srt: 15,
  temperature: 20,
  recirculation: {
    internal: 2.0,
    ras: 1.0,
    wastage: 50,
  },
  enableDPAO: true,
  enableChemP: false,
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * All ASM2d parameters bundled together
 */
export interface ASM2dAllParameters {
  kinetic: ASM2dKineticParameters
  stoich: ASM2dStoichiometricParameters
  tempCoeffs: ASM2dTemperatureCoefficients
}

/**
 * Influent with fractionation
 */
export interface ASM2dInfluentWithFractionation {
  conventional: ASM2dConventionalInfluent
  codFractionation: ASM2dCODFractionation
  nFractionation: ASM2dNitrogenFractionation
  pFractionation: ASM2dPhosphorusFractionation
}

/**
 * Preset reactor configurations
 */
export type ASM2dReactorPreset =
  | 'a2o'           // Anaerobic-Anoxic-Oxic
  | 'bardenpho_5'   // 5-stage Bardenpho
  | 'uct'           // University of Cape Town
  | 'johannesburg'  // Johannesburg process
  | 'ao'            // Anaerobic-Oxic (no N removal)
  | 'custom'

/**
 * Process type to index mapping
 */
export const ASM2d_PROCESS_INDEX: Record<ASM2dProcessType, number> = {
  'aerobic_hydrolysis': 0,
  'anoxic_hydrolysis': 1,
  'anaerobic_hydrolysis': 2,
  'aerobic_growth_H_SF': 3,
  'aerobic_growth_H_SA': 4,
  'anoxic_growth_H_SF': 5,
  'anoxic_growth_H_SA': 6,
  'fermentation': 7,
  'lysis_H': 8,
  'storage_PHA': 9,
  'aerobic_storage_PP': 10,
  'anoxic_storage_PP': 11,
  'aerobic_growth_PAO': 12,
  'anoxic_growth_PAO': 13,
  'lysis_PAO': 14,
  'lysis_PP': 15,
  'lysis_PHA': 16,
  'aerobic_growth_AUT': 17,
  'lysis_AUT': 18,
  'precipitation': 19,
  'redissolution': 20,
}

/**
 * Number of components and processes
 */
export const ASM2d_NUM_COMPONENTS = 18
export const ASM2d_NUM_PROCESSES = 21
