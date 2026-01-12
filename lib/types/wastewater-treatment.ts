/**
 * VerChem - Wastewater Treatment System Types
 * Modular treatment unit design & simulation
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 * Thai Standards: Pollution Control Department (PCD)
 */

import { ThaiEffluentType } from './environmental'

// Re-export for convenience
export type { ThaiEffluentType }

// ============================================
// UNIT STATUS & VALIDATION
// ============================================

/**
 * Unit performance status
 */
export type UnitStatus = 'pass' | 'warning' | 'fail' | 'not_configured'

/**
 * Issue severity level
 */
export type IssueSeverity = 'critical' | 'warning' | 'info'

/**
 * Design issue/recommendation
 */
export interface DesignIssue {
  severity: IssueSeverity
  parameter: string
  message: string
  currentValue: number
  recommendedValue?: number
  unit: string
  suggestion: string
}

// ============================================
// WASTEWATER CHARACTERISTICS
// ============================================

/**
 * Wastewater quality parameters
 */
export interface WastewaterQuality {
  // Flow
  flowRate: number           // Q - m³/day

  // Organic Matter
  bod: number               // BOD5 - mg/L
  cod: number               // COD - mg/L

  // Solids
  tss: number               // Total Suspended Solids - mg/L
  vss?: number              // Volatile Suspended Solids - mg/L

  // Nutrients
  tkn?: number              // Total Kjeldahl Nitrogen - mg/L
  ammonia?: number          // NH3-N - mg/L
  totalP?: number           // Total Phosphorus - mg/L

  // Other
  ph?: number               // pH units
  temperature?: number      // °C
  alkalinity?: number       // mg/L as CaCO3
  oilGrease?: number        // mg/L
}

/**
 * Treatment system influent configuration
 */
export interface SystemInfluent {
  name: string
  source: 'domestic' | 'industrial' | 'combined' | 'custom'
  quality: WastewaterQuality
  peakFactor?: number       // Peak flow factor (default 2.5)
}

// ============================================
// TREATMENT UNIT BASE TYPES
// ============================================

/**
 * Treatment unit categories
 */
export type UnitCategory =
  | 'preliminary'    // Bar screens, grit chambers
  | 'primary'        // Primary clarifiers, oil separators
  | 'biological'     // Activated sludge, trickling filters, ponds
  | 'secondary'      // Secondary clarifiers
  | 'tertiary'       // Filtration, disinfection
  | 'sludge'         // Sludge treatment

/**
 * Treatment unit types
 */
export type UnitType =
  // Preliminary
  | 'bar_screen'
  | 'grit_chamber'
  // Primary
  | 'primary_clarifier'
  | 'oil_separator'
  // Biological
  | 'aeration_tank'
  | 'sbr'
  | 'uasb'
  | 'oxidation_pond'
  | 'trickling_filter'
  | 'mbr'
  // Secondary
  | 'secondary_clarifier'
  | 'daf'
  // Tertiary
  | 'filtration'
  | 'chlorination'
  | 'uv_disinfection'
  // Sludge
  | 'thickener'
  | 'digester'
  | 'dewatering'

/**
 * Base treatment unit interface
 */
export interface TreatmentUnitBase {
  id: string
  type: UnitType
  category: UnitCategory
  name: string
  enabled: boolean

  // Input quality (from previous unit or influent)
  inputQuality: WastewaterQuality

  // Output quality (calculated)
  outputQuality: WastewaterQuality

  // Performance
  status: UnitStatus
  issues: DesignIssue[]

  // Removal efficiencies achieved
  removalEfficiency: {
    bod: number      // %
    cod: number      // %
    tss: number      // %
    tkn?: number     // %
    totalP?: number  // %
  }
}

// ============================================
// PRELIMINARY TREATMENT UNITS
// ============================================

/**
 * Bar Screen Design Parameters
 */
export interface BarScreenDesign {
  barSpacing: number        // mm (6-150 typical)
  barWidth: number          // mm (5-15)
  barDepth: number          // mm (25-75)
  screenAngle: number       // degrees from horizontal (45-90)
  channelWidth: number      // m
  channelDepth: number      // m
  approachVelocity: number  // m/s (0.3-0.6)
  throughVelocity: number   // m/s (0.6-1.2)
  headloss: number          // m (calculated)
  cleaningType: 'manual' | 'mechanical'
}

export interface BarScreenUnit extends TreatmentUnitBase {
  type: 'bar_screen'
  category: 'preliminary'
  design: BarScreenDesign
  // Typical removal: TSS 5-20%, BOD 5-10%
}

/**
 * Grit Chamber Design Parameters
 */
export interface GritChamberDesign {
  chamberType: 'horizontal_flow' | 'aerated' | 'vortex'
  length: number            // m
  width: number             // m
  depth: number             // m
  volume: number            // m³
  hrt: number              // seconds (45-90 for horizontal)
  horizontalVelocity: number // m/s (0.15-0.45)
  surfaceLoading?: number   // m³/m²·h (for aerated)
  airSupply?: number        // m³/min per m length (for aerated)
  gritProduction: number    // L/1000 m³ (estimated)
}

export interface GritChamberUnit extends TreatmentUnitBase {
  type: 'grit_chamber'
  category: 'preliminary'
  design: GritChamberDesign
  // Removes grit >0.2mm, some TSS
}

// ============================================
// PRIMARY TREATMENT UNITS
// ============================================

/**
 * Primary Clarifier Design Parameters
 */
export interface PrimaryClarifierDesign {
  shape: 'circular' | 'rectangular'
  diameter?: number         // m (for circular)
  length?: number           // m (for rectangular)
  width?: number            // m (for rectangular)
  sidewaterDepth: number    // m (3-5)
  surfaceArea: number       // m² (calculated)
  volume: number            // m³ (calculated)

  // Loading rates
  surfaceOverflowRate: number    // m³/m²·day (24-48 typical)
  peakOverflowRate?: number      // m³/m²·day (<120)
  hrt: number                    // hours (1.5-2.5)
  weirLoadingRate: number        // m³/m·day (<250)

  // Sludge
  sludgeProduction: number       // kg/day dry solids
  sludgeConcentration: number    // % solids (2-6%)
}

export interface PrimaryClarifierUnit extends TreatmentUnitBase {
  type: 'primary_clarifier'
  category: 'primary'
  design: PrimaryClarifierDesign
  // Typical removal: TSS 50-70%, BOD 25-40%
}

/**
 * Oil Separator (API/CPI) Design Parameters
 */
export interface OilSeparatorDesign {
  separatorType: 'api' | 'cpi' | 'daf_pretreat'
  length: number            // m
  width: number             // m
  depth: number             // m
  volume: number            // m³
  hrt: number              // minutes (15-30)
  surfaceLoadingRate: number // m³/m²·h
  oilRemoval: number        // %
  skimmerType: 'belt' | 'rotating_drum' | 'tube'
}

export interface OilSeparatorUnit extends TreatmentUnitBase {
  type: 'oil_separator'
  category: 'primary'
  design: OilSeparatorDesign
}

// ============================================
// BIOLOGICAL TREATMENT UNITS
// ============================================

/**
 * Aeration Tank (Activated Sludge) Design Parameters
 */
export interface AerationTankDesign {
  processType: 'conventional' | 'extended_aeration' | 'contact_stabilization' | 'step_feed' | 'complete_mix'

  // Tank Geometry
  length: number            // m
  width: number             // m
  depth: number             // m (3-6)
  volume: number            // m³
  numberOfTanks: number     // Number of parallel tanks

  // Process Parameters
  hrt: number              // hours
  srt: number              // days (Solids Retention Time / Sludge Age)
  mlss: number             // mg/L (Mixed Liquor Suspended Solids)
  mlvss: number            // mg/L (Volatile portion, ~75-85% of MLSS)
  fmRatio: number          // kg BOD/kg MLVSS·day
  volumetricLoading: number // kg BOD/m³·day

  // Oxygen Requirements
  oxygenRequired: number    // kg O2/day
  oxygenTransferEfficiency: number // % (fine bubble: 25-35%)

  // Aeration System
  aerationType: 'fine_bubble' | 'coarse_bubble' | 'mechanical_surface' | 'jet'
  airFlowRate: number       // m³/min
  aeratorPower: number      // kW total
  specificPower: number     // kW/1000 m³

  // DO Control
  targetDO: number          // mg/L (1.5-2.0)

  // Return Sludge
  returnRatio: number       // Qr/Q (0.25-1.0)
  wasteSludgeRate: number   // m³/day

  // Sludge Production
  sludgeYield: number       // kg VSS/kg BOD removed
  sludgeProduction: number  // kg/day
}

export interface AerationTankUnit extends TreatmentUnitBase {
  type: 'aeration_tank'
  category: 'biological'
  design: AerationTankDesign
  // Typical removal: BOD 85-95%, TSS 85-95%
}

/**
 * SBR (Sequencing Batch Reactor) Design Parameters
 */
export interface SBRDesign {
  numberOfReactors: number
  volumePerReactor: number  // m³
  totalVolume: number       // m³
  depth: number             // m

  // Cycle Times
  fillTime: number          // hours
  reactTime: number         // hours
  settleTime: number        // hours
  decantTime: number        // hours
  idleTime: number          // hours
  totalCycleTime: number    // hours
  cyclesPerDay: number

  // Process Parameters
  hrt: number              // hours (based on total cycle)
  srt: number              // days
  mlss: number             // mg/L
  fmRatio: number          // kg BOD/kg MLVSS·day
  volumetricLoading: number // kg BOD/m³·day
  decantRatio: number       // Volume decanted/Total volume

  // Aeration
  aerationType: 'fine_bubble' | 'jet'
  airFlowRate: number       // m³/min (during react)
  targetDO: number          // mg/L
}

export interface SBRUnit extends TreatmentUnitBase {
  type: 'sbr'
  category: 'biological'
  design: SBRDesign
}

/**
 * UASB (Upflow Anaerobic Sludge Blanket) Design Parameters
 */
export interface UASBDesign {
  numberOfReactors: number
  height: number            // m (5-7)
  diameter?: number         // m (for circular)
  length?: number           // m (for rectangular)
  width?: number            // m
  volume: number            // m³

  // Loading Parameters
  hrt: number              // hours (4-12)
  volumetricLoading: number // kg COD/m³·day (2-20)
  upflowVelocity: number   // m/h (0.5-1.5)
  sludgeLoading: number    // kg COD/kg VSS·day

  // Gas Production
  methaneYield: number      // m³ CH4/kg COD removed
  biogasProduction: number  // m³/day
  methaneContent: number    // % (65-75)

  // Effluent Quality
  codRemoval: number        // % (60-90)

  // Temperature
  operatingTemp: number     // °C (30-38 optimal)
}

export interface UASBUnit extends TreatmentUnitBase {
  type: 'uasb'
  category: 'biological'
  design: UASBDesign
}

/**
 * Oxidation Pond Design Parameters
 */
export interface OxidationPondDesign {
  pondType: 'facultative' | 'aerobic' | 'anaerobic' | 'maturation'
  numberOfPonds: number
  length: number            // m
  width: number             // m
  depth: number             // m (1-2.5 facultative)
  surfaceArea: number       // m² (per pond)
  totalArea: number         // m² (all ponds)
  volume: number            // m³

  // Loading Parameters
  hrt: number              // days (5-30)
  organicLoading: number    // kg BOD/ha·day (100-400 facultative)
  surfaceLoading: number    // m³/ha·day

  // Environmental
  algaeProduction?: number  // mg/L
  evaporationLoss: number   // mm/day

  // Land Requirement
  landArea: number          // hectares (including buffer)
}

export interface OxidationPondUnit extends TreatmentUnitBase {
  type: 'oxidation_pond'
  category: 'biological'
  design: OxidationPondDesign
}

/**
 * Trickling Filter Design Parameters
 */
export interface TricklingFilterDesign {
  filterType: 'low_rate' | 'high_rate' | 'super_rate' | 'roughing'
  numberOfFilters: number
  diameter: number           // m
  depth: number              // m (1-3 rock, 4-12 plastic)
  surfaceArea: number        // m²
  volume: number             // m³
  mediaType: 'rock' | 'plastic' | 'random_plastic'
  mediaSpecificArea?: number // m²/m³ (for plastic media)

  // Loading Rates
  hydraulicLoading: number   // m³/m²·day (1-4 low, 4-40 high)
  organicLoading: number     // kg BOD/m³·day (0.08-0.4 low, 0.4-4.8 high)

  // Recirculation
  recirculationRatio: number // R/Q (0-4)
  totalFlow: number          // Q + Qr (m³/day)

  // Performance
  bodRemovalFactor: number   // From NRC or Velz equations
}

export interface TricklingFilterUnit extends TreatmentUnitBase {
  type: 'trickling_filter'
  category: 'biological'
  design: TricklingFilterDesign
}

/**
 * MBR (Membrane Bioreactor) Design Parameters
 */
export interface MBRDesign {
  membraneType: 'hollow_fiber' | 'flat_sheet'
  configuration: 'submerged' | 'external'
  numberOfModules: number
  membraneArea: number       // m² total

  // Tank Parameters
  tankVolume: number         // m³
  tankDepth: number          // m
  mlss: number               // mg/L (8,000-15,000)
  mlvss: number              // mg/L
  srt: number                // days (15-50)
  hrt: number                // hours (4-8)
  fmRatio: number            // kg BOD/kg MLVSS·d

  // Membrane Parameters
  flux: number               // L/m²·h (LMH) (10-30)
  tmp: number                // kPa (Trans-membrane pressure)
  permeability: number       // LMH/bar

  // Aeration
  membraneAeration: number   // m³/min (for scouring)
  processAeration: number    // m³/min (for biology)
  totalAirFlow: number       // m³/min
  aeratorPower: number       // kW

  // Cleaning
  backwashInterval: number   // minutes
  chemicalCleaningInterval: number // days
}

export interface MBRUnit extends TreatmentUnitBase {
  type: 'mbr'
  category: 'biological'
  design: MBRDesign
}

// ============================================
// SECONDARY TREATMENT UNITS
// ============================================

/**
 * Secondary Clarifier Design Parameters
 */
export interface SecondaryClarifierDesign {
  shape: 'circular' | 'rectangular'
  diameter?: number         // m
  length?: number           // m
  width?: number            // m
  sidewaterDepth: number    // m (3.5-6)
  surfaceArea: number       // m²
  volume: number            // m³

  // Loading Rates
  surfaceOverflowRate: number    // m³/m²·day (16-32 @ avg)
  peakOverflowRate: number       // m³/m²·day (<48)
  solidsLoadingRate: number      // kg/m²·h (4-6)
  peakSolidsLoading: number      // kg/m²·h (<10)
  hrt: number                    // hours
  weirLoadingRate: number        // m³/m·day (<186)

  // Sludge
  rasConcentration: number       // mg/L (8,000-12,000)
  sludgeBlanketDepth: number     // m
}

export interface SecondaryClarifierUnit extends TreatmentUnitBase {
  type: 'secondary_clarifier'
  category: 'secondary'
  design: SecondaryClarifierDesign
}

/**
 * DAF (Dissolved Air Flotation) Design Parameters
 */
export interface DAFDesign {
  length: number            // m
  width: number             // m
  depth: number             // m (1.5-3)
  surfaceArea: number       // m²
  volume: number            // m³

  // Loading Rates
  surfaceLoadingRate: number // m³/m²·h (5-15)
  solidsLoadingRate: number  // kg/m²·h
  hrt: number               // minutes (20-40)

  // Air System
  recycleRatio: number       // % (5-15)
  pressureVessel: number     // bar (4-6)
  airToSolidsRatio: number   // kg air/kg solids
  saturatorEfficiency: number // % (70-90)

  // Chemical Addition
  coagulantDose?: number     // mg/L
  flocculantDose?: number    // mg/L
}

export interface DAFUnit extends TreatmentUnitBase {
  type: 'daf'
  category: 'secondary'
  design: DAFDesign
}

// ============================================
// TERTIARY TREATMENT UNITS
// ============================================

/**
 * Filtration Design Parameters
 */
export interface FiltrationDesign {
  filterType: 'rapid_sand' | 'pressure' | 'multimedia' | 'membrane'
  numberOfFilters: number
  surfaceAreaPerFilter: number // m²
  totalArea: number           // m²
  mediaDepth: number          // m

  // Media (for granular filters)
  mediaType?: 'sand' | 'anthracite' | 'dual_media'
  effectiveSize?: number      // mm
  uniformityCoefficient?: number

  // Membrane (for membrane filters)
  membraneType?: 'mf' | 'uf' | 'nf' | 'ro'
  poreSize?: number           // micron
  flux?: number               // L/m²·h

  // Loading
  filtrationRate: number      // m³/m²·h (5-15 rapid sand)
  backwashRate: number        // m³/m²·h
  backwashDuration: number    // minutes
  runLength: number           // hours between backwash

  // Head Loss
  cleanHeadLoss: number       // m
  terminalHeadLoss: number    // m
}

export interface FiltrationUnit extends TreatmentUnitBase {
  type: 'filtration'
  category: 'tertiary'
  design: FiltrationDesign
}

/**
 * Chlorination Design Parameters
 */
export interface ChlorinationDesign {
  chlorineType: 'gas' | 'hypochlorite' | 'chlorine_dioxide'

  // Contact Tank
  contactTankVolume: number  // m³
  contactTime: number        // minutes (15-30)
  length: number             // m
  width: number              // m
  depth: number              // m
  baffleEfficiency: number   // (0.3-0.7)

  // Dosing
  chlorineDose: number       // mg/L (5-15 for disinfection)
  chlorineResidual: number   // mg/L (0.5-2.0)
  chlorineDemand: number     // mg/L
  dailyChlorineUsage: number // kg/day

  // Performance
  ctValue: number            // mg·min/L
  logRemoval: {
    coliform: number
    virus: number
    giardia: number
  }
}

export interface ChlorinationUnit extends TreatmentUnitBase {
  type: 'chlorination'
  category: 'tertiary'
  design: ChlorinationDesign
}

/**
 * UV Disinfection Design Parameters
 */
export interface UVDisinfectionDesign {
  reactorType: 'open_channel' | 'closed_vessel'
  numberOfBanks: number
  lampsPerBank: number
  totalLamps: number

  // UV Parameters
  uvDose: number            // mJ/cm² (40-100)
  uvTransmittance: number   // % (55-75)
  lampPower: number         // W per lamp
  totalPower: number        // kW

  // Hydraulics
  channelLength?: number    // m (for open channel)
  channelWidth?: number     // m
  channelDepth?: number     // m
  contactTime: number       // seconds

  // Performance
  logRemoval: {
    coliform: number
    ecoli: number
    virus: number
  }

  // Maintenance
  lampLife: number          // hours
  sleeveCleaning: 'manual' | 'automatic'
}

export interface UVDisinfectionUnit extends TreatmentUnitBase {
  type: 'uv_disinfection'
  category: 'tertiary'
  design: UVDisinfectionDesign
}

// ============================================
// UNION TYPES FOR ALL UNITS
// ============================================

export type TreatmentUnit =
  | BarScreenUnit
  | GritChamberUnit
  | PrimaryClarifierUnit
  | OilSeparatorUnit
  | AerationTankUnit
  | SBRUnit
  | UASBUnit
  | OxidationPondUnit
  | TricklingFilterUnit
  | MBRUnit
  | SecondaryClarifierUnit
  | DAFUnit
  | FiltrationUnit
  | ChlorinationUnit
  | UVDisinfectionUnit

// ============================================
// TREATMENT SYSTEM (TRAIN)
// ============================================

/**
 * Complete treatment train/system
 */
export interface TreatmentSystem {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date

  // Source
  influent: SystemInfluent

  // Treatment Units (ordered)
  units: TreatmentUnit[]

  // Target Standards
  targetStandard: ThaiEffluentType

  // Final Effluent Quality
  effluentQuality: WastewaterQuality

  // System Performance
  overallStatus: UnitStatus
  systemIssues: DesignIssue[]

  // Compliance
  compliance: {
    isCompliant: boolean
    parameters: {
      name: string
      value: number | null
      limit: number | string
      unit: string
      status: 'pass' | 'fail' | 'unknown'
    }[]
  }

  // Summary
  summary: {
    totalBODRemoval: number      // %
    totalCODRemoval: number      // %
    totalTSSRemoval: number      // %
    totalLandArea: number        // m²
    totalPower: number           // kW
    estimatedCost?: {
      capital: number            // Baht
      operating: number          // Baht/month
    }
  }
}

// ============================================
// PRESET TEMPLATES
// ============================================

/**
 * Treatment train preset templates
 */
export type PresetTemplate =
  | 'conventional_as'           // Screen → Grit → Primary → AS → Secondary → Chlorine
  | 'extended_aeration'         // Screen → Grit → Extended Aeration → Secondary → UV
  | 'sbr_system'                // Screen → Grit → SBR → Chlorine
  | 'anaerobic_aerobic'         // Screen → Grit → UASB → Aeration → Secondary → Chlorine
  | 'pond_system'               // Screen → Grit → Anaerobic → Facultative → Maturation
  | 'industrial_pretreat'       // Screen → Oil Sep → DAF → pH Adjustment
  | 'custom'                    // User builds from scratch

export interface PresetConfig {
  id: PresetTemplate
  name: string
  nameThai: string
  description: string
  descriptionThai: string
  suitableFor: string[]
  unitTypes: UnitType[]
  typicalCapacity: string       // e.g., "500-10,000 m³/day"
  landRequirement: 'low' | 'medium' | 'high'
  energyUse: 'low' | 'medium' | 'high'
  complexity: 'simple' | 'moderate' | 'complex'
}

// ============================================
// UNIT METADATA (for UI)
// ============================================

export interface UnitMetadata {
  type: UnitType
  category: UnitCategory
  name: string
  nameThai: string
  icon: string
  description: string
  descriptionThai: string
  typicalRemoval: {
    bod: [number, number]       // [min%, max%]
    cod: [number, number]
    tss: [number, number]
  }
  designCriteria: {
    parameter: string
    typical: string
    unit: string
  }[]
  color: string                 // For UI visualization
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Unit metadata for all treatment units
 */
export const UNIT_METADATA: Record<UnitType, UnitMetadata> = {
  // Preliminary
  bar_screen: {
    type: 'bar_screen',
    category: 'preliminary',
    name: 'Bar Screen',
    nameThai: 'ตะแกรงดักขยะ',
    icon: '🪤',
    description: 'Removes large solids and debris',
    descriptionThai: 'กำจัดขยะและของแข็งขนาดใหญ่',
    typicalRemoval: { bod: [5, 10], cod: [5, 10], tss: [5, 20] },
    designCriteria: [
      { parameter: 'Bar Spacing', typical: '25-50', unit: 'mm' },
      { parameter: 'Approach Velocity', typical: '0.3-0.6', unit: 'm/s' },
    ],
    color: '#6B7280', // gray
  },
  grit_chamber: {
    type: 'grit_chamber',
    category: 'preliminary',
    name: 'Grit Chamber',
    nameThai: 'บ่อดักทราย',
    icon: '⬛',
    description: 'Removes sand, grit, and heavy particles',
    descriptionThai: 'กำจัดทราย กรวด และอนุภาคหนัก',
    typicalRemoval: { bod: [0, 5], cod: [0, 5], tss: [5, 15] },
    designCriteria: [
      { parameter: 'HRT', typical: '45-90', unit: 'seconds' },
      { parameter: 'Velocity', typical: '0.15-0.45', unit: 'm/s' },
    ],
    color: '#78716C', // stone
  },

  // Primary
  primary_clarifier: {
    type: 'primary_clarifier',
    category: 'primary',
    name: 'Primary Clarifier',
    nameThai: 'ถังตกตะกอนขั้นต้น',
    icon: '🔵',
    description: 'Settles suspended solids by gravity',
    descriptionThai: 'ตกตะกอนของแข็งแขวนลอยด้วยแรงโน้มถ่วง',
    typicalRemoval: { bod: [25, 40], cod: [25, 35], tss: [50, 70] },
    designCriteria: [
      { parameter: 'Overflow Rate', typical: '24-48', unit: 'm³/m²·day' },
      { parameter: 'HRT', typical: '1.5-2.5', unit: 'hours' },
    ],
    color: '#3B82F6', // blue
  },
  oil_separator: {
    type: 'oil_separator',
    category: 'primary',
    name: 'Oil Separator',
    nameThai: 'บ่อดักไขมัน',
    icon: '🛢️',
    description: 'Removes oil and grease',
    descriptionThai: 'กำจัดน้ำมันและไขมัน',
    typicalRemoval: { bod: [10, 20], cod: [10, 20], tss: [10, 30] },
    designCriteria: [
      { parameter: 'HRT', typical: '15-30', unit: 'minutes' },
      { parameter: 'Surface Loading', typical: '2-5', unit: 'm³/m²·h' },
    ],
    color: '#F59E0B', // amber
  },

  // Biological
  aeration_tank: {
    type: 'aeration_tank',
    category: 'biological',
    name: 'Aeration Tank',
    nameThai: 'ถังเติมอากาศ',
    icon: '💨',
    description: 'Activated sludge biological treatment',
    descriptionThai: 'ระบบบำบัดทางชีวภาพแบบตะกอนเร่ง',
    typicalRemoval: { bod: [85, 95], cod: [80, 90], tss: [85, 95] },
    designCriteria: [
      { parameter: 'F/M Ratio', typical: '0.2-0.6', unit: 'kg BOD/kg MLVSS·d' },
      { parameter: 'MLSS', typical: '2000-4000', unit: 'mg/L' },
      { parameter: 'HRT', typical: '4-8', unit: 'hours' },
      { parameter: 'SRT', typical: '5-15', unit: 'days' },
    ],
    color: '#10B981', // emerald
  },
  sbr: {
    type: 'sbr',
    category: 'biological',
    name: 'SBR',
    nameThai: 'ถัง SBR',
    icon: '🔄',
    description: 'Sequencing Batch Reactor',
    descriptionThai: 'ระบบบำบัดแบบเติมอากาศเป็นรอบ',
    typicalRemoval: { bod: [85, 98], cod: [80, 95], tss: [85, 98] },
    designCriteria: [
      { parameter: 'Cycle Time', typical: '4-8', unit: 'hours' },
      { parameter: 'MLSS', typical: '2000-5000', unit: 'mg/L' },
    ],
    color: '#8B5CF6', // violet
  },
  uasb: {
    type: 'uasb',
    category: 'biological',
    name: 'UASB',
    nameThai: 'ถัง UASB',
    icon: '🔥',
    description: 'Upflow Anaerobic Sludge Blanket',
    descriptionThai: 'ระบบไร้อากาศแบบตะกอนลอย',
    typicalRemoval: { bod: [60, 85], cod: [60, 90], tss: [50, 80] },
    designCriteria: [
      { parameter: 'OLR', typical: '2-15', unit: 'kg COD/m³·d' },
      { parameter: 'Upflow Velocity', typical: '0.5-1.5', unit: 'm/h' },
      { parameter: 'HRT', typical: '4-12', unit: 'hours' },
    ],
    color: '#EF4444', // red
  },
  oxidation_pond: {
    type: 'oxidation_pond',
    category: 'biological',
    name: 'Oxidation Pond',
    nameThai: 'บ่อผึ่ง',
    icon: '🌿',
    description: 'Natural treatment lagoon',
    descriptionThai: 'บ่อบำบัดธรรมชาติ',
    typicalRemoval: { bod: [70, 90], cod: [60, 80], tss: [60, 85] },
    designCriteria: [
      { parameter: 'Organic Loading', typical: '100-400', unit: 'kg BOD/ha·d' },
      { parameter: 'HRT', typical: '5-30', unit: 'days' },
      { parameter: 'Depth', typical: '1-2.5', unit: 'm' },
    ],
    color: '#22C55E', // green
  },
  trickling_filter: {
    type: 'trickling_filter',
    category: 'biological',
    name: 'Trickling Filter',
    nameThai: 'หอกรองชีวภาพ',
    icon: '🗼',
    description: 'Fixed-film biological treatment',
    descriptionThai: 'ระบบบำบัดแบบฟิล์มชีวภาพ',
    typicalRemoval: { bod: [65, 85], cod: [60, 80], tss: [60, 85] },
    designCriteria: [
      { parameter: 'Hydraulic Loading', typical: '1-4', unit: 'm³/m²·d' },
      { parameter: 'Organic Loading', typical: '0.3-1.0', unit: 'kg BOD/m³·d' },
    ],
    color: '#14B8A6', // teal
  },
  mbr: {
    type: 'mbr',
    category: 'biological',
    name: 'MBR',
    nameThai: 'ถัง MBR',
    icon: '🔬',
    description: 'Membrane Bioreactor',
    descriptionThai: 'ระบบบำบัดแบบเมมเบรน',
    typicalRemoval: { bod: [95, 99], cod: [90, 98], tss: [99, 100] },
    designCriteria: [
      { parameter: 'MLSS', typical: '8000-15000', unit: 'mg/L' },
      { parameter: 'Flux', typical: '10-30', unit: 'LMH' },
      { parameter: 'SRT', typical: '15-50', unit: 'days' },
    ],
    color: '#6366F1', // indigo
  },

  // Secondary
  secondary_clarifier: {
    type: 'secondary_clarifier',
    category: 'secondary',
    name: 'Secondary Clarifier',
    nameThai: 'ถังตกตะกอนขั้นสอง',
    icon: '🔷',
    description: 'Settles biological solids',
    descriptionThai: 'ตกตะกอนสลัดจ์ชีวภาพ',
    typicalRemoval: { bod: [0, 10], cod: [0, 10], tss: [85, 95] },
    designCriteria: [
      { parameter: 'Overflow Rate', typical: '16-32', unit: 'm³/m²·day' },
      { parameter: 'Solids Loading', typical: '4-6', unit: 'kg/m²·h' },
    ],
    color: '#0EA5E9', // sky
  },
  daf: {
    type: 'daf',
    category: 'secondary',
    name: 'DAF',
    nameThai: 'ถัง DAF',
    icon: '🫧',
    description: 'Dissolved Air Flotation',
    descriptionThai: 'ระบบลอยตะกอนด้วยอากาศละลาย',
    typicalRemoval: { bod: [20, 50], cod: [20, 50], tss: [70, 95] },
    designCriteria: [
      { parameter: 'Surface Loading', typical: '5-15', unit: 'm³/m²·h' },
      { parameter: 'Recycle Ratio', typical: '5-15', unit: '%' },
    ],
    color: '#06B6D4', // cyan
  },

  // Tertiary
  filtration: {
    type: 'filtration',
    category: 'tertiary',
    name: 'Filtration',
    nameThai: 'ระบบกรอง',
    icon: '🔲',
    description: 'Removes remaining solids',
    descriptionThai: 'กำจัดของแข็งที่เหลือ',
    typicalRemoval: { bod: [20, 40], cod: [20, 40], tss: [50, 90] },
    designCriteria: [
      { parameter: 'Filtration Rate', typical: '5-15', unit: 'm³/m²·h' },
      { parameter: 'Media Depth', typical: '0.6-1.0', unit: 'm' },
    ],
    color: '#A855F7', // purple
  },
  chlorination: {
    type: 'chlorination',
    category: 'tertiary',
    name: 'Chlorination',
    nameThai: 'ฆ่าเชื้อด้วยคลอรีน',
    icon: '🧴',
    description: 'Chemical disinfection',
    descriptionThai: 'ฆ่าเชื้อโรคด้วยสารเคมี',
    typicalRemoval: { bod: [0, 5], cod: [0, 5], tss: [0, 0] },
    designCriteria: [
      { parameter: 'Contact Time', typical: '15-30', unit: 'minutes' },
      { parameter: 'Chlorine Dose', typical: '5-15', unit: 'mg/L' },
      { parameter: 'CT Value', typical: '≥15', unit: 'mg·min/L' },
    ],
    color: '#FBBF24', // yellow
  },
  uv_disinfection: {
    type: 'uv_disinfection',
    category: 'tertiary',
    name: 'UV Disinfection',
    nameThai: 'ฆ่าเชื้อด้วย UV',
    icon: '☀️',
    description: 'UV light disinfection',
    descriptionThai: 'ฆ่าเชื้อโรคด้วยแสง UV',
    typicalRemoval: { bod: [0, 0], cod: [0, 0], tss: [0, 0] },
    designCriteria: [
      { parameter: 'UV Dose', typical: '40-100', unit: 'mJ/cm²' },
      { parameter: 'UV Transmittance', typical: '55-75', unit: '%' },
    ],
    color: '#F472B6', // pink
  },

  // Sludge (placeholder for future)
  thickener: {
    type: 'thickener',
    category: 'sludge',
    name: 'Thickener',
    nameThai: 'ถังเพิ่มความเข้มข้น',
    icon: '🔘',
    description: 'Concentrates sludge',
    descriptionThai: 'เพิ่มความเข้มข้นตะกอน',
    typicalRemoval: { bod: [0, 0], cod: [0, 0], tss: [0, 0] },
    designCriteria: [
      { parameter: 'Solids Loading', typical: '20-50', unit: 'kg/m²·d' },
    ],
    color: '#64748B', // slate
  },
  digester: {
    type: 'digester',
    category: 'sludge',
    name: 'Digester',
    nameThai: 'ถังย่อยสลัดจ์',
    icon: '♨️',
    description: 'Stabilizes sludge',
    descriptionThai: 'ย่อยสลายตะกอน',
    typicalRemoval: { bod: [0, 0], cod: [0, 0], tss: [0, 0] },
    designCriteria: [
      { parameter: 'SRT', typical: '15-30', unit: 'days' },
    ],
    color: '#71717A', // zinc
  },
  dewatering: {
    type: 'dewatering',
    category: 'sludge',
    name: 'Dewatering',
    nameThai: 'เครื่องรีดน้ำ',
    icon: '🔸',
    description: 'Removes water from sludge',
    descriptionThai: 'ลดความชื้นตะกอน',
    typicalRemoval: { bod: [0, 0], cod: [0, 0], tss: [0, 0] },
    designCriteria: [
      { parameter: 'Cake Solids', typical: '15-35', unit: '%' },
    ],
    color: '#92400E', // amber dark
  },
}

/**
 * Preset template configurations
 */
export const PRESET_TEMPLATES: PresetConfig[] = [
  {
    id: 'conventional_as',
    name: 'Conventional Activated Sludge',
    nameThai: 'ระบบตะกอนเร่งแบบดั้งเดิม',
    description: 'Standard activated sludge process for municipal wastewater',
    descriptionThai: 'ระบบมาตรฐานสำหรับน้ำเสียชุมชน',
    suitableFor: ['Municipal', 'Domestic', 'Medium-strength industrial'],
    unitTypes: ['bar_screen', 'grit_chamber', 'primary_clarifier', 'aeration_tank', 'secondary_clarifier', 'chlorination'],
    typicalCapacity: '1,000-100,000 m³/day',
    landRequirement: 'medium',
    energyUse: 'medium',
    complexity: 'moderate',
  },
  {
    id: 'extended_aeration',
    name: 'Extended Aeration',
    nameThai: 'ระบบเติมอากาศแบบยืดเยื้อ',
    description: 'Low sludge production, suitable for smaller flows',
    descriptionThai: 'ผลิตตะกอนน้อย เหมาะกับระบบขนาดเล็ก',
    suitableFor: ['Small communities', 'Resorts', 'Schools', 'Housing'],
    unitTypes: ['bar_screen', 'grit_chamber', 'aeration_tank', 'secondary_clarifier', 'uv_disinfection'],
    typicalCapacity: '100-5,000 m³/day',
    landRequirement: 'low',
    energyUse: 'high',
    complexity: 'simple',
  },
  {
    id: 'sbr_system',
    name: 'SBR System',
    nameThai: 'ระบบ SBR',
    description: 'Batch treatment, flexible operation',
    descriptionThai: 'บำบัดเป็นรอบ ยืดหยุ่นในการเดินระบบ',
    suitableFor: ['Variable flows', 'Industrial', 'Small-medium municipal'],
    unitTypes: ['bar_screen', 'grit_chamber', 'sbr', 'chlorination'],
    typicalCapacity: '500-20,000 m³/day',
    landRequirement: 'low',
    energyUse: 'medium',
    complexity: 'moderate',
  },
  {
    id: 'anaerobic_aerobic',
    name: 'UASB + Aerobic Polishing',
    nameThai: 'ระบบ UASB + เติมอากาศ',
    description: 'Energy-efficient for high-strength wastewater',
    descriptionThai: 'ประหยัดพลังงาน สำหรับน้ำเสียความเข้มข้นสูง',
    suitableFor: ['Food industry', 'Beverage', 'Brewery', 'Distillery'],
    unitTypes: ['bar_screen', 'grit_chamber', 'uasb', 'aeration_tank', 'secondary_clarifier', 'chlorination'],
    typicalCapacity: '500-50,000 m³/day',
    landRequirement: 'low',
    energyUse: 'low',
    complexity: 'complex',
  },
  {
    id: 'pond_system',
    name: 'Oxidation Pond System',
    nameThai: 'ระบบบ่อผึ่ง',
    description: 'Natural treatment with minimal energy',
    descriptionThai: 'บำบัดธรรมชาติ ใช้พลังงานน้อย',
    suitableFor: ['Rural areas', 'Agricultural', 'Where land available'],
    unitTypes: ['bar_screen', 'grit_chamber', 'oxidation_pond'],
    typicalCapacity: '100-10,000 m³/day',
    landRequirement: 'high',
    energyUse: 'low',
    complexity: 'simple',
  },
  {
    id: 'industrial_pretreat',
    name: 'Industrial Pretreatment',
    nameThai: 'ระบบบำบัดเบื้องต้นโรงงาน',
    description: 'Pretreatment before discharge to municipal system',
    descriptionThai: 'บำบัดก่อนปล่อยเข้าระบบส่วนกลาง',
    suitableFor: ['Factories', 'Food processing', 'Manufacturing'],
    unitTypes: ['bar_screen', 'oil_separator', 'daf'],
    typicalCapacity: '50-5,000 m³/day',
    landRequirement: 'low',
    energyUse: 'low',
    complexity: 'simple',
  },
  {
    id: 'custom',
    name: 'Custom System',
    nameThai: 'ออกแบบเอง',
    description: 'Build your own treatment train',
    descriptionThai: 'ออกแบบระบบตามต้องการ',
    suitableFor: ['Any'],
    unitTypes: [],
    typicalCapacity: 'Any',
    landRequirement: 'medium',
    energyUse: 'medium',
    complexity: 'moderate',
  },
]

/**
 * Default influent characteristics by source type
 */
export const DEFAULT_INFLUENT: Record<SystemInfluent['source'], Partial<WastewaterQuality>> = {
  domestic: {
    flowRate: 1000,
    bod: 200,
    cod: 400,
    tss: 220,
    tkn: 40,
    ammonia: 25,
    totalP: 8,
    ph: 7.0,
    temperature: 25,
  },
  industrial: {
    flowRate: 500,
    bod: 500,
    cod: 1000,
    tss: 400,
    tkn: 50,
    ammonia: 30,
    totalP: 10,
    ph: 6.5,
    temperature: 30,
    oilGrease: 50,
  },
  combined: {
    flowRate: 2000,
    bod: 300,
    cod: 600,
    tss: 300,
    tkn: 45,
    ammonia: 28,
    totalP: 9,
    ph: 6.8,
    temperature: 27,
  },
  custom: {
    flowRate: 1000,
    bod: 200,
    cod: 400,
    tss: 200,
    ph: 7.0,
    temperature: 25,
  },
}

/**
 * Thai Effluent Standards
 */
export const THAI_EFFLUENT_STANDARDS: Record<ThaiEffluentType, {
  name: string
  nameThai: string
  source: string
  referenceNote?: string
  limits: {
    bod: number
    cod: number
    tss: number
    ph: [number, number]
    temperature: number
    oilGrease?: number
  }
}> = {
  type_a: {
    name: 'Type A - Industrial Estate',
    nameThai: 'ประเภท ก - นิคมอุตสาหกรรม',
    source: 'PCD (Pollution Control Department)',
    referenceNote: 'Verify values against the latest PCD notification',
    limits: {
      bod: 20,
      cod: 120,
      tss: 50,
      ph: [5.5, 9.0],
      temperature: 40,
      oilGrease: 5,
    },
  },
  type_b: {
    name: 'Type B - General Industrial',
    nameThai: 'ประเภท ข - โรงงานทั่วไป',
    source: 'PCD (Pollution Control Department)',
    referenceNote: 'Verify values against the latest PCD notification',
    limits: {
      bod: 60,
      cod: 400,
      tss: 150,
      ph: [5.5, 9.0],
      temperature: 40,
      oilGrease: 15,
    },
  },
  type_c: {
    name: 'Type C - Community',
    nameThai: 'ประเภท ค - ชุมชน',
    source: 'PCD (Pollution Control Department)',
    referenceNote: 'Verify values against the latest PCD notification',
    limits: {
      bod: 40,
      cod: 200,
      tss: 70,
      ph: [5.5, 9.0],
      temperature: 40,
    },
  },
}
