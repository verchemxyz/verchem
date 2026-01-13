/**
 * VerChem - ASM1 (Activated Sludge Model No. 1) Type Definitions
 *
 * IWA Activated Sludge Model No. 1 - The industry standard for
 * modeling biological wastewater treatment processes.
 *
 * Reference: Henze, M., Grady, C.P.L., Gujer, W., Marais, G.v.R., Matsuo, T. (1987)
 * "Activated Sludge Model No. 1" IAWPRC Scientific and Technical Report No. 1
 *
 * This is research-grade implementation competing with GPS-X ($15,000)
 */

// ============================================
// ASM1 STATE VARIABLES (13 Components)
// ============================================

/**
 * ASM1 State Variables
 * All concentrations in mg/L (g/m³)
 */
export interface ASM1StateVariables {
  // Soluble Components
  SI: number   // Inert soluble organic matter [mg COD/L]
  SS: number   // Readily biodegradable substrate [mg COD/L]
  SO: number   // Dissolved oxygen [mg O2/L]
  SNO: number  // Nitrate and nitrite nitrogen [mg N/L]
  SNH: number  // Ammonium nitrogen [mg N/L]
  SND: number  // Soluble biodegradable organic nitrogen [mg N/L]
  SALK: number // Alkalinity [mole HCO3/m³]

  // Particulate Components
  XI: number   // Inert particulate organic matter [mg COD/L]
  XS: number   // Slowly biodegradable substrate [mg COD/L]
  XBH: number  // Active heterotrophic biomass [mg COD/L]
  XBA: number  // Active autotrophic biomass [mg COD/L]
  XP: number   // Particulate products from biomass decay [mg COD/L]
  XND: number  // Particulate biodegradable organic nitrogen [mg N/L]
}

/**
 * State variable array order (for matrix operations)
 */
export const ASM1_STATE_ORDER: (keyof ASM1StateVariables)[] = [
  'SI', 'SS', 'XI', 'XS', 'XBH', 'XBA', 'XP', 'SO', 'SNO', 'SNH', 'SND', 'XND', 'SALK'
]

// ============================================
// ASM1 KINETIC PARAMETERS
// ============================================

/**
 * ASM1 Kinetic Parameters at 20°C
 */
export interface ASM1KineticParameters {
  // Heterotrophic Parameters
  muH: number    // Max specific growth rate for heterotrophs [1/d]
  KS: number     // Half-saturation coefficient for SS [mg COD/L]
  KOH: number    // Half-saturation coefficient for oxygen (heterotrophs) [mg O2/L]
  KNO: number    // Half-saturation coefficient for nitrate [mg N/L]
  bH: number     // Decay coefficient for heterotrophs [1/d]
  etaG: number   // Correction factor for anoxic growth [-]
  etaH: number   // Correction factor for anoxic hydrolysis [-]

  // Autotrophic Parameters
  muA: number    // Max specific growth rate for autotrophs [1/d]
  KNH: number    // Half-saturation coefficient for ammonia [mg N/L]
  KOA: number    // Half-saturation coefficient for oxygen (autotrophs) [mg O2/L]
  bA: number     // Decay coefficient for autotrophs [1/d]

  // Hydrolysis Parameters
  kh: number     // Max specific hydrolysis rate [mg COD/(mg COD·d)]
  KX: number     // Half-saturation coefficient for hydrolysis [mg COD/mg COD]

  // Ammonification
  ka: number     // Ammonification rate [m³/(mg COD·d)]
}

/**
 * ASM1 Stoichiometric Parameters
 */
export interface ASM1StoichiometricParameters {
  YH: number     // Heterotrophic yield coefficient [mg COD/mg COD]
  YA: number     // Autotrophic yield coefficient [mg COD/mg N]
  fP: number     // Fraction of biomass to particulate products [-]
  iXB: number    // N content of biomass [mg N/mg COD]
  iXP: number    // N content of particulate products [mg N/mg COD]
}

/**
 * Temperature correction coefficients (Arrhenius)
 */
export interface ASM1TemperatureCoefficients {
  theta_muH: number  // For muH
  theta_bH: number   // For bH
  theta_muA: number  // For muA
  theta_bA: number   // For bA
  theta_kh: number   // For kh
  theta_ka: number   // For ka
}

// ============================================
// DEFAULT PARAMETER VALUES
// ============================================

/**
 * Default ASM1 kinetic parameters at 20°C
 * Source: Henze et al. (1987) - Original ASM1 publication
 */
export const DEFAULT_ASM1_KINETIC_PARAMS: ASM1KineticParameters = {
  // Heterotrophic
  muH: 6.0,      // 1/d (range: 4-8)
  KS: 20.0,      // mg COD/L (range: 10-40)
  KOH: 0.2,      // mg O2/L (range: 0.1-0.5)
  KNO: 0.5,      // mg N/L (range: 0.2-1.0)
  bH: 0.62,      // 1/d (range: 0.3-1.0)
  etaG: 0.8,     // - (range: 0.6-1.0)
  etaH: 0.4,     // - (range: 0.2-0.6)

  // Autotrophic
  muA: 0.8,      // 1/d (range: 0.3-1.0)
  KNH: 1.0,      // mg N/L (range: 0.5-2.0)
  KOA: 0.4,      // mg O2/L (range: 0.2-0.8)
  bA: 0.15,      // 1/d (range: 0.05-0.2)

  // Hydrolysis
  kh: 3.0,       // mg COD/(mg COD·d) (range: 2-4)
  KX: 0.03,      // mg COD/mg COD (range: 0.01-0.05)

  // Ammonification
  ka: 0.08,      // m³/(mg COD·d) (range: 0.04-0.12)
}

/**
 * Default ASM1 stoichiometric parameters
 * Source: Henze et al. (1987)
 */
export const DEFAULT_ASM1_STOICH_PARAMS: ASM1StoichiometricParameters = {
  YH: 0.67,      // mg COD/mg COD (range: 0.60-0.70)
  YA: 0.24,      // mg COD/mg N (range: 0.20-0.28)
  fP: 0.08,      // - (range: 0.06-0.10)
  iXB: 0.086,    // mg N/mg COD (range: 0.07-0.10)
  iXP: 0.06,     // mg N/mg COD (range: 0.05-0.08)
}

/**
 * Temperature correction coefficients
 * Source: Metcalf & Eddy (2014)
 */
export const DEFAULT_TEMP_COEFFICIENTS: ASM1TemperatureCoefficients = {
  theta_muH: 1.072,
  theta_bH: 1.029,
  theta_muA: 1.103,
  theta_bA: 1.029,
  theta_kh: 1.041,
  theta_ka: 1.072,
}

// ============================================
// ASM1 PROCESSES (8 Biological Processes)
// ============================================

/**
 * ASM1 Process types
 */
export type ASM1ProcessType =
  | 'aerobic_growth_heterotrophs'    // Process 1
  | 'anoxic_growth_heterotrophs'     // Process 2
  | 'aerobic_growth_autotrophs'      // Process 3
  | 'decay_heterotrophs'             // Process 4
  | 'decay_autotrophs'               // Process 5
  | 'ammonification'                 // Process 6
  | 'hydrolysis_organics'            // Process 7
  | 'hydrolysis_nitrogen'            // Process 8

/**
 * Process rate information
 */
export interface ASM1ProcessRate {
  process: ASM1ProcessType
  name: string
  rate: number           // mg/(L·d) or 1/d depending on process
  rateEquation: string   // Human-readable rate equation
}

// ============================================
// REACTOR CONFIGURATION
// ============================================

/**
 * Reactor types for ASM1 simulation
 */
export type ReactorType =
  | 'cstr'           // Continuous Stirred Tank Reactor
  | 'plug_flow'      // Plug Flow Reactor (approximated with CSTRs in series)
  | 'sbr'            // Sequencing Batch Reactor
  | 'oxidation_ditch' // Oxidation Ditch (carrousel)

/**
 * Aeration mode
 */
export type AerationMode =
  | 'aerobic'        // Continuous aeration (DO > 2 mg/L)
  | 'anoxic'         // No aeration (DO ≈ 0, NO3 present)
  | 'anaerobic'      // No aeration, no NO3
  | 'intermittent'   // Cycling between aerobic/anoxic

/**
 * Reactor zone configuration
 */
export interface ReactorZone {
  id: string
  name: string
  volume: number           // m³
  aerationMode: AerationMode
  targetDO?: number        // mg/L (for aerobic zones)
  mixingIntensity: 'low' | 'medium' | 'high'
  hrt: number              // Hydraulic Retention Time [hours]
  srt?: number             // Solids Retention Time [days] (if applicable)
}

/**
 * Complete reactor configuration
 */
export interface ASM1ReactorConfig {
  type: ReactorType
  zones: ReactorZone[]
  totalVolume: number      // m³
  totalHRT: number         // hours
  srt: number              // Solids Retention Time [days]
  temperature: number      // °C
  recirculation: {
    internal?: number      // Internal recirculation ratio (Qr/Q)
    external: number       // External/RAS recirculation ratio (Qras/Q)
    wastage: number        // Sludge wastage flow [m³/d]
  }
}

// ============================================
// SIMULATION CONFIGURATION
// ============================================

/**
 * ODE Solver methods
 */
export type ODESolverMethod =
  | 'euler'          // Forward Euler (1st order)
  | 'rk2'            // Runge-Kutta 2nd order (Heun's)
  | 'rk4'            // Runge-Kutta 4th order (Classical)
  | 'rkf45'          // Runge-Kutta-Fehlberg (adaptive)

/**
 * Simulation configuration
 */
export interface ASM1SimulationConfig {
  // Time settings
  startTime: number        // Start time [d]
  endTime: number          // End time [d]
  timeStep: number         // Time step [d] (e.g., 0.001 = 1.44 min)
  outputInterval: number   // Output interval [d]

  // Solver settings
  solver: ODESolverMethod
  tolerance?: number       // For adaptive solvers
  maxIterations?: number   // Max iterations per step

  // Initial conditions
  initialState: ASM1StateVariables

  // Parameters (or use defaults)
  kineticParams?: Partial<ASM1KineticParameters>
  stoichParams?: Partial<ASM1StoichiometricParameters>
  tempCoeffs?: Partial<ASM1TemperatureCoefficients>
}

// ============================================
// SIMULATION RESULTS
// ============================================

/**
 * Single time point result
 */
export interface ASM1TimePoint {
  time: number             // [d]
  state: ASM1StateVariables
  processRates: ASM1ProcessRate[]
  oxygenDemand: number     // mg O2/(L·d)
  nitrogenBalance: {
    totalN: number         // mg N/L
    oxidized: number       // mg N/L (as NO3)
    reduced: number        // mg N/L (as NH4 + organic N)
  }
}

/**
 * Steady state detection
 */
export interface SteadyStateInfo {
  reached: boolean
  timeToSteadyState?: number  // [d]
  maxVariation: number        // Max % change in last 3 SRTs
  convergenceMetric: number   // Weighted sum of state variable changes
}

/**
 * Complete simulation result
 */
export interface ASM1SimulationResult {
  // Configuration used
  config: ASM1SimulationConfig
  reactor: ASM1ReactorConfig

  // Time series data
  timeSeries: ASM1TimePoint[]

  // Final state
  finalState: ASM1StateVariables

  // Effluent quality (after settling)
  effluentQuality: {
    COD: number            // mg/L
    BOD5: number           // mg/L (estimated from SS)
    TSS: number            // mg/L
    VSS: number            // mg/L
    TKN: number            // mg/L
    NH4N: number           // mg/L
    NO3N: number           // mg/L
    TN: number             // mg/L
    TP?: number            // mg/L (if P module included)
  }

  // Sludge production
  sludgeProduction: {
    totalVSS: number       // kg VSS/d
    totalTSS: number       // kg TSS/d
    yieldObserved: number  // kg VSS/kg BOD removed
  }

  // Oxygen demand
  oxygenDemand: {
    carbonaceous: number   // kg O2/d
    nitrogenous: number    // kg O2/d
    total: number          // kg O2/d
    specific: number       // kg O2/kg BOD removed
  }

  // Steady state info
  steadyState: SteadyStateInfo

  // Performance metrics
  performance: {
    bodRemoval: number     // %
    codRemoval: number     // %
    tssRemoval: number     // %
    nh4Removal: number     // %
    tnRemoval: number      // %
  }

  // Computational info
  computation: {
    totalSteps: number
    executionTime: number  // ms
    warnings: string[]
    errors: string[]
  }
}

// ============================================
// FRACTIONATION (Influent Characterization)
// ============================================

/**
 * COD Fractionation for ASM1
 * Converts conventional wastewater parameters to ASM1 state variables
 */
export interface CODFractionation {
  // Fraction of total COD
  fSI: number   // Inert soluble fraction (0.05-0.10)
  fSS: number   // Readily biodegradable fraction (0.10-0.25)
  fXI: number   // Inert particulate fraction (0.10-0.20)
  fXS: number   // Slowly biodegradable fraction (0.35-0.55)

  // Calculated (fXBH + fXBA typically small in influent)
  fXBH?: number // Heterotrophs in influent (usually ~0.01)
  fXBA?: number // Autotrophs in influent (usually ~0)
}

/**
 * Nitrogen Fractionation
 */
export interface NitrogenFractionation {
  fSNH: number  // Ammonia fraction of TKN (0.60-0.80)
  fSND: number  // Soluble organic N fraction (0.05-0.15)
  fXND: number  // Particulate organic N fraction (0.15-0.30)
  // Note: fSNO typically 0 in raw wastewater
}

/**
 * Default fractionation for domestic wastewater
 */
export const DEFAULT_DOMESTIC_FRACTIONATION: CODFractionation & NitrogenFractionation = {
  fSI: 0.07,
  fSS: 0.20,
  fXI: 0.13,
  fXS: 0.60,
  fSNH: 0.70,
  fSND: 0.10,
  fXND: 0.20,
}

/**
 * Industrial wastewater fractionation (typically more soluble)
 */
export const DEFAULT_INDUSTRIAL_FRACTIONATION: CODFractionation & NitrogenFractionation = {
  fSI: 0.10,
  fSS: 0.35,
  fXI: 0.15,
  fXS: 0.40,
  fSNH: 0.60,
  fSND: 0.15,
  fXND: 0.25,
}

// ============================================
// INFLUENT CONVERSION
// ============================================

/**
 * Convert conventional wastewater quality to ASM1 state variables
 */
export interface ConventionalToASM1Input {
  // Conventional parameters (from lab)
  COD: number          // mg/L
  BOD5: number         // mg/L
  TSS: number          // mg/L
  VSS: number          // mg/L
  TKN: number          // mg/L
  NH4N: number         // mg/L
  NO3N?: number        // mg/L (usually 0 in raw wastewater)
  alkalinity: number   // mg/L as CaCO3

  // Fractionation to use
  fractionation: CODFractionation & NitrogenFractionation
}

// ============================================
// SETTLING MODEL (Secondary Clarifier)
// ============================================

/**
 * Settling velocity parameters (Vesilind model)
 */
export interface SettlingParameters {
  V0: number    // Max settling velocity [m/h] (4-10 typical)
  rh: number    // Hindered settling parameter [L/g] (0.3-0.7)
  rp: number    // Compaction parameter [L/g] (0.001-0.005)
  Xmin: number  // Min concentration for settling [mg/L] (50-100)
}

/**
 * Default settling parameters
 */
export const DEFAULT_SETTLING_PARAMS: SettlingParameters = {
  V0: 6.0,
  rh: 0.45,
  rp: 0.002,
  Xmin: 100,
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type ASM1Parameters = ASM1KineticParameters & ASM1StoichiometricParameters
