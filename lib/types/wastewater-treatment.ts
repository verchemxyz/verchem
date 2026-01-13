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

// ============================================
// COST ESTIMATION CONSTANTS
// ============================================

/**
 * Cost estimation parameters for each treatment unit type
 * Costs are approximate and based on typical Thai construction costs (2024-2025)
 * Capital costs in THB, Operating costs in THB/month
 */
export interface UnitCostParams {
  // Capital cost factors
  baseCapitalCost: number           // Base installation cost (THB)
  capitalCostPerM3: number          // Cost per m³ of tank volume (THB)
  capitalCostPerM2?: number         // Cost per m² of surface area (THB)
  equipmentCostFactor: number       // Equipment as % of civil works (0-1)

  // Operating cost factors
  powerConsumption: number          // kWh per m³ treated
  chemicalCostPerM3: number         // Chemical cost per m³ (THB)
  maintenanceFactor: number         // Maintenance as % of capital/year
  laborHoursPerDay: number          // Labor hours needed per day

  // Land requirement
  landAreaPerM3Flow: number         // m² per m³/day capacity
}

export const UNIT_COST_PARAMS: Record<UnitType, UnitCostParams> = {
  // Preliminary Treatment
  bar_screen: {
    baseCapitalCost: 150000,
    capitalCostPerM3: 5000,
    equipmentCostFactor: 0.6,
    powerConsumption: 0.01,
    chemicalCostPerM3: 0,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 0.5,
    landAreaPerM3Flow: 0.01,
  },
  grit_chamber: {
    baseCapitalCost: 200000,
    capitalCostPerM3: 8000,
    equipmentCostFactor: 0.3,
    powerConsumption: 0.02,
    chemicalCostPerM3: 0,
    maintenanceFactor: 0.02,
    laborHoursPerDay: 0.5,
    landAreaPerM3Flow: 0.02,
  },

  // Primary Treatment
  primary_clarifier: {
    baseCapitalCost: 500000,
    capitalCostPerM3: 12000,
    capitalCostPerM2: 25000,
    equipmentCostFactor: 0.25,
    powerConsumption: 0.03,
    chemicalCostPerM3: 0.5,
    maintenanceFactor: 0.02,
    laborHoursPerDay: 1,
    landAreaPerM3Flow: 0.05,
  },
  oil_separator: {
    baseCapitalCost: 300000,
    capitalCostPerM3: 15000,
    equipmentCostFactor: 0.4,
    powerConsumption: 0.02,
    chemicalCostPerM3: 1,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 1,
    landAreaPerM3Flow: 0.03,
  },

  // Biological Treatment
  aeration_tank: {
    baseCapitalCost: 800000,
    capitalCostPerM3: 10000,
    equipmentCostFactor: 0.5,
    powerConsumption: 0.5,
    chemicalCostPerM3: 0.3,
    maintenanceFactor: 0.04,
    laborHoursPerDay: 2,
    landAreaPerM3Flow: 0.15,
  },
  sbr: {
    baseCapitalCost: 1200000,
    capitalCostPerM3: 12000,
    equipmentCostFactor: 0.6,
    powerConsumption: 0.4,
    chemicalCostPerM3: 0.5,
    maintenanceFactor: 0.04,
    laborHoursPerDay: 2,
    landAreaPerM3Flow: 0.12,
  },
  uasb: {
    baseCapitalCost: 1500000,
    capitalCostPerM3: 18000,
    equipmentCostFactor: 0.35,
    powerConsumption: 0.1,
    chemicalCostPerM3: 0.2,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 1.5,
    landAreaPerM3Flow: 0.08,
  },
  oxidation_pond: {
    baseCapitalCost: 300000,
    capitalCostPerM3: 3000,
    capitalCostPerM2: 800,
    equipmentCostFactor: 0.1,
    powerConsumption: 0.05,
    chemicalCostPerM3: 0,
    maintenanceFactor: 0.01,
    laborHoursPerDay: 0.5,
    landAreaPerM3Flow: 2.0,
  },
  trickling_filter: {
    baseCapitalCost: 600000,
    capitalCostPerM3: 8000,
    equipmentCostFactor: 0.4,
    powerConsumption: 0.15,
    chemicalCostPerM3: 0,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 1,
    landAreaPerM3Flow: 0.1,
  },
  mbr: {
    baseCapitalCost: 2000000,
    capitalCostPerM3: 25000,
    equipmentCostFactor: 0.7,
    powerConsumption: 0.8,
    chemicalCostPerM3: 2,
    maintenanceFactor: 0.06,
    laborHoursPerDay: 2,
    landAreaPerM3Flow: 0.05,
  },

  // Secondary Clarification
  secondary_clarifier: {
    baseCapitalCost: 600000,
    capitalCostPerM3: 12000,
    capitalCostPerM2: 25000,
    equipmentCostFactor: 0.3,
    powerConsumption: 0.03,
    chemicalCostPerM3: 0,
    maintenanceFactor: 0.02,
    laborHoursPerDay: 1,
    landAreaPerM3Flow: 0.06,
  },
  daf: {
    baseCapitalCost: 800000,
    capitalCostPerM3: 20000,
    equipmentCostFactor: 0.5,
    powerConsumption: 0.15,
    chemicalCostPerM3: 3,
    maintenanceFactor: 0.04,
    laborHoursPerDay: 1.5,
    landAreaPerM3Flow: 0.04,
  },

  // Tertiary Treatment
  filtration: {
    baseCapitalCost: 400000,
    capitalCostPerM3: 15000,
    capitalCostPerM2: 30000,
    equipmentCostFactor: 0.4,
    powerConsumption: 0.1,
    chemicalCostPerM3: 0.5,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 1,
    landAreaPerM3Flow: 0.02,
  },
  chlorination: {
    baseCapitalCost: 200000,
    capitalCostPerM3: 5000,
    equipmentCostFactor: 0.5,
    powerConsumption: 0.02,
    chemicalCostPerM3: 1.5,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 0.5,
    landAreaPerM3Flow: 0.01,
  },
  uv_disinfection: {
    baseCapitalCost: 500000,
    capitalCostPerM3: 8000,
    equipmentCostFactor: 0.8,
    powerConsumption: 0.08,
    chemicalCostPerM3: 0,
    maintenanceFactor: 0.05,
    laborHoursPerDay: 0.5,
    landAreaPerM3Flow: 0.005,
  },

  // Sludge Treatment
  thickener: {
    baseCapitalCost: 400000,
    capitalCostPerM3: 10000,
    capitalCostPerM2: 20000,
    equipmentCostFactor: 0.4,
    powerConsumption: 0.05,
    chemicalCostPerM3: 1,
    maintenanceFactor: 0.025,
    laborHoursPerDay: 1,
    landAreaPerM3Flow: 0.02,
  },
  digester: {
    baseCapitalCost: 1500000,
    capitalCostPerM3: 15000,
    equipmentCostFactor: 0.5,
    powerConsumption: 0.1,
    chemicalCostPerM3: 0.5,
    maintenanceFactor: 0.03,
    laborHoursPerDay: 2,
    landAreaPerM3Flow: 0.03,
  },
  dewatering: {
    baseCapitalCost: 800000,
    capitalCostPerM3: 12000,
    equipmentCostFactor: 0.6,
    powerConsumption: 0.15,
    chemicalCostPerM3: 3,
    maintenanceFactor: 0.04,
    laborHoursPerDay: 2,
    landAreaPerM3Flow: 0.01,
  },
}

/**
 * General cost parameters
 */
export const GENERAL_COST_PARAMS = {
  electricityRate: 4.5,           // THB/kWh (average industrial rate)
  laborRate: 500,                 // THB/hour (skilled operator)
  landCostPerM2: 5000,            // THB/m² (industrial area average)
  contingencyFactor: 0.15,        // 15% contingency for capital
  engineeringFactor: 0.10,        // 10% engineering & design
  installationFactor: 0.12,       // 12% installation
  inflationRate: 0.03,            // 3% annual inflation
}

/**
 * Cost estimation result interface
 */
export interface CostEstimation {
  // Capital costs
  civilWorks: number
  equipment: number
  engineering: number
  installation: number
  contingency: number
  landCost: number
  totalCapital: number

  // Operating costs (monthly)
  electricity: number
  chemicals: number
  labor: number
  maintenance: number
  sludgeDisposal: number
  totalOperating: number

  // Annual costs
  annualOperating: number
  annualDepreciation: number      // 20-year straight line
  totalAnnualCost: number

  // Cost per unit
  costPerM3: number               // THB per m³ treated

  // Breakdown by unit
  unitCosts: {
    unitType: UnitType
    unitName: string
    capitalCost: number
    operatingCost: number
  }[]
}

/**
 * Sludge production calculation result
 */
export interface SludgeProduction {
  // Primary sludge
  primarySludge: number           // kg dry solids/day
  primarySludgeVolume: number     // m³/day (at 4% solids)

  // Biological/secondary sludge
  biologicalSludge: number        // kg dry solids/day (WAS)
  biologicalSludgeVolume: number  // m³/day (at 1% solids)

  // Total
  totalSludge: number             // kg dry solids/day
  totalSludgeVolume: number       // m³/day (combined)

  // After thickening (if present)
  thickenedSludge?: number        // kg dry solids/day
  thickenedVolume?: number        // m³/day (at 5-6% solids)

  // After dewatering (if present)
  dewateredSludge?: number        // kg dry solids/day
  dewateredVolume?: number        // m³/day (at 20-25% solids)
  cakeMass?: number               // kg wet cake/day

  // Biogas (if digester present)
  biogasProduction?: number       // m³/day
  methaneContent?: number         // % CH4
  energyRecovery?: number         // kWh/day

  // Per-unit breakdown
  unitSludge: {
    unitType: UnitType
    unitName: string
    sludgeProduced: number        // kg DS/day
    sludgeType: 'primary' | 'biological' | 'chemical' | 'none'
  }[]
}

/**
 * Energy consumption breakdown
 */
export interface EnergyConsumption {
  // By category
  aeration: number                // kWh/day
  pumping: number                 // kWh/day
  mixing: number                  // kWh/day
  sludgeHandling: number          // kWh/day
  disinfection: number            // kWh/day
  lighting: number                // kWh/day
  other: number                   // kWh/day

  // Totals
  totalDaily: number              // kWh/day
  totalMonthly: number            // kWh/month
  totalAnnual: number             // kWh/year

  // Costs
  dailyCost: number               // THB/day
  monthlyCost: number             // THB/month
  annualCost: number              // THB/year

  // Efficiency metrics
  kWhPerM3: number                // kWh per m³ treated
  kWhPerKgBOD: number             // kWh per kg BOD removed

  // Per-unit breakdown
  unitEnergy: {
    unitType: UnitType
    unitName: string
    dailyConsumption: number      // kWh/day
    percentage: number            // % of total
    category: 'aeration' | 'pumping' | 'mixing' | 'disinfection' | 'other'
  }[]

  // Energy recovery (if applicable)
  biogasEnergy?: number           // kWh/day from biogas
  netEnergy?: number              // kWh/day (consumption - recovery)
}

/**
 * Saved scenario for comparison
 */
export interface SavedScenario {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date

  // Design parameters
  source: 'domestic' | 'industrial' | 'combined' | 'custom'
  influent: WastewaterQuality
  targetStandard: ThaiEffluentType
  unitConfigs: Array<{ type: UnitType; config: Record<string, unknown> }>

  // Results (cached)
  effluentQuality?: WastewaterQuality
  compliance?: {
    isCompliant: boolean
    parameters: Array<{ name: string; status: 'pass' | 'fail' | 'unknown' }>
  }
  totalCost?: number
  costPerM3?: number
}

// ============================================
// PHASE 2: SENSITIVITY ANALYSIS TYPES
// ============================================

/**
 * Parameters that can be varied in sensitivity analysis
 */
export type SensitivityParameter =
  | 'flowRate'           // Q - m³/day
  | 'bod'                // BOD5 - mg/L
  | 'cod'                // COD - mg/L
  | 'tss'                // TSS - mg/L
  | 'tkn'                // TKN - mg/L
  | 'ammonia'            // NH3-N - mg/L
  | 'totalP'             // Total P - mg/L
  | 'temperature'        // °C
  | 'mlss'               // MLSS - mg/L (for biological units)
  | 'srt'                // SRT - days
  | 'hrt'                // HRT - hours
  | 'returnRatio'        // RAS ratio
  | 'electricityRate'    // THB/kWh
  | 'laborRate'          // THB/hour

/**
 * Output metrics affected by sensitivity
 */
export type SensitivityOutput =
  | 'effluentBOD'
  | 'effluentCOD'
  | 'effluentTSS'
  | 'effluentTKN'
  | 'effluentNH3'
  | 'effluentTP'
  | 'bodRemoval'
  | 'codRemoval'
  | 'tssRemoval'
  | 'nitrogenRemoval'
  | 'phosphorusRemoval'
  | 'totalCapitalCost'
  | 'totalOperatingCost'
  | 'costPerM3'
  | 'energyConsumption'
  | 'kWhPerM3'
  | 'sludgeProduction'
  | 'complianceStatus'

/**
 * Range specification for sensitivity analysis
 */
export interface SensitivityRange {
  min: number           // Minimum value (e.g., -30%)
  max: number           // Maximum value (e.g., +30%)
  steps: number         // Number of steps (e.g., 7 for -30, -20, -10, 0, +10, +20, +30)
  type: 'percentage' | 'absolute'
}

/**
 * Single sensitivity data point
 */
export interface SensitivityDataPoint {
  inputValue: number          // Actual input value
  inputVariation: number      // % variation from baseline
  outputs: Record<SensitivityOutput, number>
  compliance: boolean
  issues: number              // Count of design issues
}

/**
 * Result of sensitivity analysis for one parameter
 */
export interface SensitivityResult {
  parameter: SensitivityParameter
  parameterName: string
  parameterNameThai: string
  unit: string
  baselineValue: number
  dataPoints: SensitivityDataPoint[]

  // Impact assessment
  impactRanking: number        // 1 = highest impact
  criticalThreshold?: {
    direction: 'above' | 'below'
    value: number
    reason: string
  }

  // Statistical summary
  elasticity: Record<SensitivityOutput, number>  // % change in output per 1% change in input
}

/**
 * Complete sensitivity analysis
 */
export interface SensitivityAnalysis {
  timestamp: Date
  systemName: string

  // Baseline scenario
  baselineInfluent: WastewaterQuality
  baselineEffluent: WastewaterQuality
  baselineCost: CostEstimation
  baselineEnergy: EnergyConsumption
  baselineCompliance: boolean

  // Results by parameter
  results: SensitivityResult[]

  // Summary
  summary: {
    mostSensitiveParameters: SensitivityParameter[]
    leastSensitiveParameters: SensitivityParameter[]
    criticalRisks: {
      parameter: SensitivityParameter
      threshold: number
      consequence: string
    }[]
    robustnessScore: number     // 0-100, higher = more robust
    recommendations: string[]
  }

  // Tornado chart data (sorted by impact)
  tornadoData: {
    parameter: SensitivityParameter
    parameterName: string
    lowValue: number
    highValue: number
    lowImpact: number           // % change in cost/compliance at low value
    highImpact: number          // % change at high value
    baselineValue: number
  }[]
}

// ============================================
// PHASE 2: AERATION SYSTEM DESIGN TYPES
// ============================================

/**
 * Diffuser types with characteristics
 */
export type DiffuserType =
  | 'fine_bubble_disc'       // Most common, 2-5mm bubbles
  | 'fine_bubble_tube'       // Tube diffusers
  | 'fine_bubble_panel'      // Panel/strip diffusers
  | 'coarse_bubble'          // Large bubbles, mixing
  | 'jet_aerator'            // High velocity jets
  | 'mechanical_surface'     // Surface aerators
  | 'brush_aerator'          // Oxidation ditch

/**
 * Diffuser specifications
 */
export interface DiffuserSpec {
  type: DiffuserType
  name: string
  nameThai: string

  // Performance
  sote: number                // Standard Oxygen Transfer Efficiency (%)
  alpha: number               // Process water/clean water ratio (0.4-0.8)
  beta: number                // Salinity factor (0.95-0.99)
  theta: number               // Temperature coefficient (1.024 typical)

  // Physical
  airflowPerUnit: {
    min: number               // Nm³/h per diffuser
    max: number
    optimal: number
  }
  pressureDrop: number        // kPa at design airflow
  submergence: number         // Typical submergence (m)

  // Coverage
  coveragePerUnit: number     // m² per diffuser

  // Cost & maintenance
  unitCost: number            // THB per diffuser
  lifespan: number            // years
  maintenanceInterval: number // months
}

/**
 * Blower types
 */
export type BlowerType =
  | 'positive_displacement'   // PD blowers
  | 'multistage_centrifugal'  // Centrifugal blowers
  | 'single_stage_turbo'      // High-speed turbo
  | 'screw'                   // Screw compressors

/**
 * Blower specifications
 */
export interface BlowerSpec {
  type: BlowerType
  name: string

  // Capacity
  capacity: number            // Nm³/h
  dischargePressure: number   // kPa
  turndown: number            // % minimum flow

  // Power
  motorPower: number          // kW
  specificPower: number       // kW per 100 Nm³/h
  efficiency: number          // %

  // Cost
  capitalCost: number         // THB
  operatingCost: number       // THB/year (maintenance)
}

/**
 * DO (Dissolved Oxygen) profile point
 */
export interface DOProfilePoint {
  position: number            // Distance from inlet (m or %)
  depth: number               // Depth from surface (m)
  doConcentration: number     // mg/L
  oxygenUptakeRate: number    // mg/L·h
  isAnoxic: boolean           // DO < 0.5 mg/L
}

/**
 * Oxygen transfer calculation parameters
 */
export interface OxygenTransferParams {
  // Standard conditions
  sotr: number                // Standard Oxygen Transfer Rate (kg O₂/h)
  sote: number                // Standard Oxygen Transfer Efficiency (%)
  sor: number                 // Standard Oxygen Requirement (kg O₂/day)

  // Actual conditions
  aotr: number                // Actual Oxygen Transfer Rate (kg O₂/h)
  aote: number                // Actual Oxygen Transfer Efficiency (%)
  aor: number                 // Actual Oxygen Requirement (kg O₂/day)

  // Correction factors
  alpha: number               // Wastewater/clean water (0.4-0.9)
  beta: number                // Salinity (0.95-0.99)
  theta: number               // Temperature (1.024)
  F: number                   // Fouling factor (0.65-0.9)

  // Operating conditions
  temperature: number         // °C
  elevation: number           // m above sea level
  csInf: number               // Saturated DO at infinite time (mg/L)
  cs20: number                // Saturated DO at 20°C (mg/L)
  doOperating: number         // Operating DO (mg/L)
}

/**
 * Complete aeration system design
 */
export interface AerationSystemDesign {
  // Basic parameters
  tankVolume: number          // m³
  tankDepth: number           // m
  tankArea: number            // m²
  numberOfZones: number       // For step aeration

  // Oxygen requirements
  oxygenDemand: {
    carbonaceous: number      // kg O₂/day for BOD
    nitrogenous: number       // kg O₂/day for nitrification
    endogenous: number        // kg O₂/day for endogenous respiration
    total: number             // kg O₂/day
    peakFactor: number        // Peak/average ratio
    peakDemand: number        // kg O₂/day at peak
  }

  // Oxygen transfer
  transfer: OxygenTransferParams

  // Diffuser system
  diffuserSystem: {
    type: DiffuserType
    spec: DiffuserSpec
    numberOfDiffusers: number
    diffuserDensity: number   // diffusers/m²
    gridLayout: {
      rows: number
      columns: number
      spacing: number         // m between diffusers
    }
    airflowPerDiffuser: number // Nm³/h
    totalAirflow: number      // Nm³/h
  }

  // Blower system
  blowerSystem: {
    type: BlowerType
    numberOfBlowers: number
    numberOfStandby: number
    capacityPerBlower: number // Nm³/h
    totalCapacity: number     // Nm³/h
    dischargePressure: number // kPa
    motorPower: number        // kW per blower
    totalPower: number        // kW
    turndownRatio: number     // %
    vfdRequired: boolean
  }

  // Piping
  pipingSystem: {
    mainHeaderDiameter: number    // mm
    dropPipeDiameter: number      // mm
    mainHeaderLength: number      // m
    numberOfDropPipes: number
    totalPressureDrop: number     // kPa
    airVelocity: number           // m/s in header
  }

  // Control
  controlSystem: {
    doControl: 'manual' | 'on_off' | 'pid' | 'advanced'
    doSetpoint: number            // mg/L
    doSensors: number
    airflowControl: 'manual' | 'vfd' | 'valve'
  }

  // DO profile (optional)
  doProfile?: DOProfilePoint[]

  // Energy
  energyConsumption: {
    blowerPower: number           // kW
    dailyEnergy: number           // kWh/day
    annualEnergy: number          // kWh/year
    kWhPerKgO2: number            // Efficiency
    kWhPerM3: number              // Per volume treated
    annualCost: number            // THB/year
  }

  // Cost
  capitalCost: {
    diffusers: number             // THB
    blowers: number               // THB
    piping: number                // THB
    controls: number              // THB
    installation: number          // THB
    total: number                 // THB
  }

  // Design validation
  validation: {
    isValid: boolean
    issues: DesignIssue[]
    warnings: string[]
    recommendations: string[]
  }
}

// ============================================
// PHASE 2: BNR (BIOLOGICAL NUTRIENT REMOVAL) TYPES
// ============================================

/**
 * BNR process configurations
 */
export type BNRProcessType =
  | 'mle'                     // Modified Ludzack-Ettinger (N removal)
  | 'a2o'                     // Anaerobic-Anoxic-Oxic (N+P removal)
  | 'bardenpho_4stage'        // 4-stage Bardenpho (N removal)
  | 'bardenpho_5stage'        // 5-stage Bardenpho (N+P removal)
  | 'uct'                     // University of Cape Town (N+P)
  | 'vip'                     // Virginia Initiative Plant (N+P)
  | 'johannesburg'            // Johannesburg Process (N+P)
  | 'step_feed'               // Step-feed BNR
  | 'sbr_bnr'                 // SBR with nutrient removal

/**
 * BNR process configuration metadata
 */
export interface BNRProcessConfig {
  type: BNRProcessType
  name: string
  nameThai: string
  description: string

  // Process capabilities
  nitrogenRemoval: boolean
  phosphorusRemoval: boolean
  typicalTNRemoval: [number, number]     // % range
  typicalTPRemoval: [number, number]     // % range

  // Zone configuration
  zones: Array<{
    name: string
    type: 'anaerobic' | 'anoxic' | 'aerobic'
    hrtFraction: number          // Fraction of total HRT
    doRange: [number, number]    // mg/L
    purpose: string
  }>

  // Recycle streams
  recycles: Array<{
    name: string
    from: string
    to: string
    typicalRatio: number         // Q_recycle / Q_influent
  }>

  // Design criteria
  designCriteria: {
    totalHRT: [number, number]   // hours
    srt: [number, number]        // days
    mlss: [number, number]       // mg/L
    fmRatio: [number, number]    // kg BOD/kg MLVSS·d
  }

  // Suitability
  suitableFor: string[]
  complexity: 'low' | 'medium' | 'high'
  footprint: 'compact' | 'medium' | 'large'
  energyIntensity: 'low' | 'medium' | 'high'
}

/**
 * Nitrification design parameters
 */
export interface NitrificationParams {
  // Influent nitrogen
  tknInfluent: number           // mg/L
  ammoniaInfluent: number       // mg/L
  organicN: number              // mg/L (TKN - NH3)

  // Nitrifier kinetics (Monod)
  muMaxAOB: number              // Max specific growth rate AOB (day⁻¹)
  muMaxNOB: number              // Max specific growth rate NOB (day⁻¹)
  ksNH4: number                 // Half-saturation NH4 (mg/L)
  ksO2: number                  // Half-saturation O2 (mg/L)
  kdAOB: number                 // Decay rate AOB (day⁻¹)
  kdNOB: number                 // Decay rate NOB (day⁻¹)

  // Temperature correction
  temperature: number           // °C
  thetaMu: number               // Temperature coefficient for mu
  thetaKd: number               // Temperature coefficient for kd

  // Calculated rates
  muNetAOB: number              // Net growth rate at operating T
  muNetNOB: number              // Net growth rate at operating T
  minSRT: number                // Minimum SRT for nitrification (days)
  designSRT: number             // Design SRT with safety factor (days)
  safetyFactor: number          // Typically 1.5-2.5

  // Oxygen requirement
  o2PerNH4: number              // kg O2/kg NH4-N oxidized (4.57)

  // Alkalinity consumption
  alkPerNH4: number             // mg CaCO3/mg NH4-N (7.14)
  alkalinityRequired: number    // mg/L as CaCO3

  // Effluent quality
  effluentNH3: number           // mg/L
  nitrificationEfficiency: number // %
}

/**
 * Denitrification design parameters
 */
export interface DenitrificationParams {
  // Nitrate loading
  nitrateInfluent: number       // mg/L (from nitrification or external)
  nitrateToRemove: number       // mg/L

  // Carbon source
  carbonSource: 'wastewater' | 'methanol' | 'acetate' | 'glycerol' | 'external'
  rbCODInfluent: number         // Readily biodegradable COD (mg/L)
  carbonRequired: number        // mg COD/mg NO3-N
  externalCarbonDose?: number   // mg/L (if external)

  // Denitrifier kinetics
  sdnr: number                  // Specific Denitrification Rate (g NO3-N/g MLVSS·d)
  temperature: number           // °C
  sdnrCorrected: number         // Temperature-corrected SDNR

  // Zone design
  anoxicVolume: number          // m³
  anoxicHRT: number             // hours
  anoxicFraction: number        // % of total volume

  // Recycle
  internalRecycleRatio: number  // IR ratio (Q_recycle/Q)
  nitrateFeedback: number       // mg/L NO3-N in return

  // Oxygen equivalent
  o2EquivalentPerNO3: number    // kg O2-eq/kg NO3-N (2.86)
  o2Savings: number             // kg O2/day saved

  // Alkalinity recovery
  alkRecoveryPerNO3: number     // mg CaCO3/mg NO3-N (3.57)
  alkalinityRecovered: number   // mg/L as CaCO3

  // Effluent quality
  effluentNO3: number           // mg/L
  denitrificationEfficiency: number // %
}

/**
 * Phosphorus removal parameters
 */
export interface PhosphorusRemovalParams {
  // Influent phosphorus
  totalPInfluent: number        // mg/L
  orthoPInfluent: number        // mg/L (soluble reactive P)
  particulateP: number          // mg/L

  // Biological P removal (EBPR)
  ebprEnabled: boolean
  paoGrowthRate: number         // day⁻¹
  pContent: number              // P content in PAO biomass (%)
  vfaRequired: number           // mg VFA/mg P removed
  vfaAvailable: number          // mg/L in wastewater
  anaerobicHRT: number          // hours (typically 1-2h)
  anaerobicVolume: number       // m³

  // Biological P removal capacity
  bioP: {
    removal: number             // mg/L P removed biologically
    efficiency: number          // %
    sludgeP: number             // kg P/day in WAS
  }

  // Chemical P removal (supplemental or primary)
  chemPEnabled: boolean
  chemical: 'alum' | 'ferric_chloride' | 'ferric_sulfate' | 'lime' | 'pac'
  chemicalDose: number          // mg/L as metal or chemical
  molarRatio: number            // Moles metal / moles P
  chemPRecipitated: number      // mg/L P removed chemically
  sludgeIncrease: number        // % increase in sludge from chemical

  // Chemical properties
  chemicalProperties: {
    molecularWeight: number
    metalContent: number        // % (for Fe or Al compounds)
    costPerKg: number           // THB/kg
    pHEffect: number            // Approximate pH drop per mg/L
  }

  // Effluent quality
  effluentTP: number            // mg/L
  effluentOrthoP: number        // mg/L
  totalPRemoval: number         // %

  // Operating costs
  chemicalCost: number          // THB/day
  alkalinityLoss: number        // mg/L as CaCO3
}

/**
 * Complete BNR design
 */
export interface BNRDesign {
  // Process selection
  processType: BNRProcessType
  processConfig: BNRProcessConfig

  // Design basis
  flowRate: number              // m³/day
  temperature: number           // °C design temperature

  // Influent characteristics
  influent: {
    bod: number
    cod: number
    tss: number
    tkn: number
    ammonia: number
    totalP: number
    alkalinity: number
    rbCOD: number               // Readily biodegradable COD
    vfa: number                 // Volatile Fatty Acids
    codToN: number              // COD:TKN ratio
    codToP: number              // COD:TP ratio
  }

  // Target effluent
  target: {
    bod: number
    tss: number
    ammonia: number
    totalN: number
    totalP: number
  }

  // Zone volumes and HRTs
  zones: Array<{
    name: string
    type: 'anaerobic' | 'anoxic' | 'aerobic' | 'reaeration'
    volume: number              // m³
    hrt: number                 // hours
    dimensions: {
      length: number
      width: number
      depth: number
    }
    mixerPower?: number         // kW (for anoxic/anaerobic)
    aerationCapacity?: number   // kg O2/day (for aerobic)
    doSetpoint?: number         // mg/L
  }>

  // Total system
  totalVolume: number           // m³
  totalHRT: number              // hours
  srt: number                   // days
  mlss: number                  // mg/L
  mlvss: number                 // mg/L

  // Recycle streams
  recycles: Array<{
    name: string
    from: string
    to: string
    flowRate: number            // m³/day
    ratio: number               // Multiple of Q
    pumpCapacity: number        // m³/h
    pumpHead: number            // m
    pumpPower: number           // kW
  }>

  // Nitrification design
  nitrification: NitrificationParams

  // Denitrification design
  denitrification: DenitrificationParams

  // P removal design
  phosphorusRemoval: PhosphorusRemovalParams

  // Overall performance
  performance: {
    bodRemoval: number          // %
    codRemoval: number          // %
    tssRemoval: number          // %
    tknRemoval: number          // %
    ammoniaRemoval: number      // %
    totalNRemoval: number       // %
    totalPRemoval: number       // %
  }

  // Effluent quality
  effluent: {
    bod: number
    cod: number
    tss: number
    ammonia: number
    nitrate: number
    totalN: number
    totalP: number
  }

  // Oxygen requirements
  oxygenDemand: {
    carbonaceous: number        // kg O2/day
    nitrogenous: number         // kg O2/day
    denitrificationCredit: number // kg O2/day saved
    totalGross: number          // kg O2/day before credit
    totalNet: number            // kg O2/day after credit
    peakFactor: number
    peakDemand: number
  }

  // Alkalinity balance
  alkalinityBalance: {
    influent: number            // mg/L as CaCO3
    consumedNitrification: number // mg/L
    recoveredDenitrification: number // mg/L
    consumedChemP: number       // mg/L
    netBalance: number          // mg/L
    supplementRequired: number  // kg/day of alkalinity
    chemicalType: 'lime' | 'soda_ash' | 'sodium_bicarbonate'
    chemicalDose: number        // kg/day
  }

  // Sludge production
  sludgeProduction: {
    heterotrophic: number       // kg VSS/day
    autotrophic: number         // kg VSS/day (nitrifiers)
    paoSludge: number           // kg VSS/day
    chemicalSludge: number      // kg SS/day
    totalVSS: number            // kg VSS/day
    totalTSS: number            // kg TSS/day
    observedYield: number       // kg TSS/kg BOD removed
  }

  // Energy
  energy: {
    aerationPower: number       // kW
    mixingPower: number         // kW
    pumpingPower: number        // kW
    totalPower: number          // kW
    dailyEnergy: number         // kWh/day
    kWhPerM3: number
    kWhPerKgN: number           // Per kg N removed
    kWhPerKgP: number           // Per kg P removed
  }

  // Cost
  cost: {
    capital: {
      tanks: number
      equipment: number
      chemical: number
      total: number
    }
    operating: {
      energy: number            // THB/year
      chemicals: number         // THB/year
      sludgeDisposal: number    // THB/year
      labor: number             // THB/year
      total: number             // THB/year
    }
    costPerM3: number           // THB/m³
    costPerKgN: number          // THB/kg N removed
    costPerKgP: number          // THB/kg P removed
  }

  // Validation
  validation: {
    isValid: boolean
    issues: DesignIssue[]
    warnings: string[]
    recommendations: string[]
  }
}

/**
 * BNR process metadata constant
 */
export const BNR_PROCESS_CONFIGS: Record<BNRProcessType, BNRProcessConfig> = {
  mle: {
    type: 'mle',
    name: 'Modified Ludzack-Ettinger (MLE)',
    nameThai: 'ระบบ MLE',
    description: 'Basic nitrogen removal with anoxic zone before aerobic',
    nitrogenRemoval: true,
    phosphorusRemoval: false,
    typicalTNRemoval: [60, 80],
    typicalTPRemoval: [15, 30],
    zones: [
      { name: 'Anoxic', type: 'anoxic', hrtFraction: 0.3, doRange: [0, 0.5], purpose: 'Denitrification' },
      { name: 'Aerobic', type: 'aerobic', hrtFraction: 0.7, doRange: [1.5, 3.0], purpose: 'BOD removal + Nitrification' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Aerobic', to: 'Anoxic', typicalRatio: 2.0 },
      { name: 'RAS', from: 'Clarifier', to: 'Anoxic', typicalRatio: 0.5 },
    ],
    designCriteria: { totalHRT: [8, 16], srt: [10, 20], mlss: [2500, 4000], fmRatio: [0.1, 0.25] },
    suitableFor: ['Municipal with TN limits', 'Industrial with high nitrogen'],
    complexity: 'low',
    footprint: 'medium',
    energyIntensity: 'medium',
  },
  a2o: {
    type: 'a2o',
    name: 'A²/O (Anaerobic-Anoxic-Oxic)',
    nameThai: 'ระบบ A2O',
    description: 'Combined nitrogen and phosphorus removal',
    nitrogenRemoval: true,
    phosphorusRemoval: true,
    typicalTNRemoval: [60, 80],
    typicalTPRemoval: [70, 90],
    zones: [
      { name: 'Anaerobic', type: 'anaerobic', hrtFraction: 0.15, doRange: [0, 0.2], purpose: 'VFA uptake by PAOs' },
      { name: 'Anoxic', type: 'anoxic', hrtFraction: 0.25, doRange: [0, 0.5], purpose: 'Denitrification' },
      { name: 'Aerobic', type: 'aerobic', hrtFraction: 0.6, doRange: [1.5, 3.0], purpose: 'BOD, NH4, P uptake' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Aerobic', to: 'Anoxic', typicalRatio: 2.0 },
      { name: 'RAS', from: 'Clarifier', to: 'Anaerobic', typicalRatio: 0.5 },
    ],
    designCriteria: { totalHRT: [10, 20], srt: [12, 25], mlss: [3000, 5000], fmRatio: [0.08, 0.2] },
    suitableFor: ['Municipal with N&P limits', 'Sensitive receiving waters'],
    complexity: 'medium',
    footprint: 'medium',
    energyIntensity: 'medium',
  },
  bardenpho_4stage: {
    type: 'bardenpho_4stage',
    name: '4-Stage Bardenpho',
    nameThai: 'บาร์เดนโฟ 4 ขั้นตอน',
    description: 'High nitrogen removal with secondary anoxic zone',
    nitrogenRemoval: true,
    phosphorusRemoval: false,
    typicalTNRemoval: [80, 95],
    typicalTPRemoval: [20, 40],
    zones: [
      { name: 'Primary Anoxic', type: 'anoxic', hrtFraction: 0.25, doRange: [0, 0.5], purpose: 'Primary denitrification' },
      { name: 'Primary Aerobic', type: 'aerobic', hrtFraction: 0.45, doRange: [1.5, 3.0], purpose: 'BOD + Nitrification' },
      { name: 'Secondary Anoxic', type: 'anoxic', hrtFraction: 0.2, doRange: [0, 0.5], purpose: 'Secondary denitrification' },
      { name: 'Reaeration', type: 'aerobic', hrtFraction: 0.1, doRange: [2.0, 4.0], purpose: 'Strip N2, final polish' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Primary Aerobic', to: 'Primary Anoxic', typicalRatio: 4.0 },
      { name: 'RAS', from: 'Clarifier', to: 'Primary Anoxic', typicalRatio: 0.5 },
    ],
    designCriteria: { totalHRT: [12, 24], srt: [15, 30], mlss: [3000, 4500], fmRatio: [0.05, 0.15] },
    suitableFor: ['Stringent TN limits (<5 mg/L)', 'Reuse applications'],
    complexity: 'high',
    footprint: 'large',
    energyIntensity: 'medium',
  },
  bardenpho_5stage: {
    type: 'bardenpho_5stage',
    name: '5-Stage Bardenpho',
    nameThai: 'บาร์เดนโฟ 5 ขั้นตอน',
    description: 'Maximum N&P removal with anaerobic zone',
    nitrogenRemoval: true,
    phosphorusRemoval: true,
    typicalTNRemoval: [85, 95],
    typicalTPRemoval: [80, 95],
    zones: [
      { name: 'Anaerobic', type: 'anaerobic', hrtFraction: 0.1, doRange: [0, 0.2], purpose: 'VFA for PAOs' },
      { name: 'Primary Anoxic', type: 'anoxic', hrtFraction: 0.2, doRange: [0, 0.5], purpose: 'Primary denit' },
      { name: 'Primary Aerobic', type: 'aerobic', hrtFraction: 0.4, doRange: [1.5, 3.0], purpose: 'BOD + Nitrif + P' },
      { name: 'Secondary Anoxic', type: 'anoxic', hrtFraction: 0.2, doRange: [0, 0.5], purpose: 'Secondary denit' },
      { name: 'Reaeration', type: 'aerobic', hrtFraction: 0.1, doRange: [2.0, 4.0], purpose: 'Final polish' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Primary Aerobic', to: 'Primary Anoxic', typicalRatio: 4.0 },
      { name: 'RAS', from: 'Clarifier', to: 'Anaerobic', typicalRatio: 0.5 },
    ],
    designCriteria: { totalHRT: [14, 28], srt: [15, 30], mlss: [3000, 5000], fmRatio: [0.05, 0.12] },
    suitableFor: ['Most stringent N&P limits', 'Sensitive ecosystems'],
    complexity: 'high',
    footprint: 'large',
    energyIntensity: 'high',
  },
  uct: {
    type: 'uct',
    name: 'UCT (University of Cape Town)',
    nameThai: 'ระบบ UCT',
    description: 'Optimized P removal with separate anoxic RAS return',
    nitrogenRemoval: true,
    phosphorusRemoval: true,
    typicalTNRemoval: [60, 80],
    typicalTPRemoval: [85, 95],
    zones: [
      { name: 'Anaerobic', type: 'anaerobic', hrtFraction: 0.15, doRange: [0, 0.2], purpose: 'VFA for PAOs (no NO3)' },
      { name: 'Anoxic', type: 'anoxic', hrtFraction: 0.25, doRange: [0, 0.5], purpose: 'Denitrification' },
      { name: 'Aerobic', type: 'aerobic', hrtFraction: 0.6, doRange: [1.5, 3.0], purpose: 'BOD + N + P' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Aerobic', to: 'Anoxic', typicalRatio: 2.0 },
      { name: 'RAS', from: 'Clarifier', to: 'Anoxic', typicalRatio: 1.0 },
      { name: 'Anoxic Recycle', from: 'Anoxic', to: 'Anaerobic', typicalRatio: 1.0 },
    ],
    designCriteria: { totalHRT: [10, 20], srt: [12, 25], mlss: [3000, 5000], fmRatio: [0.08, 0.18] },
    suitableFor: ['High P removal priority', 'Low rbCOD wastewaters'],
    complexity: 'high',
    footprint: 'medium',
    energyIntensity: 'medium',
  },
  vip: {
    type: 'vip',
    name: 'VIP (Virginia Initiative Plant)',
    nameThai: 'ระบบ VIP',
    description: 'Similar to UCT with enhanced N removal',
    nitrogenRemoval: true,
    phosphorusRemoval: true,
    typicalTNRemoval: [70, 85],
    typicalTPRemoval: [80, 95],
    zones: [
      { name: 'Anaerobic', type: 'anaerobic', hrtFraction: 0.12, doRange: [0, 0.2], purpose: 'VFA uptake' },
      { name: 'Primary Anoxic', type: 'anoxic', hrtFraction: 0.25, doRange: [0, 0.5], purpose: 'Denitrification' },
      { name: 'Aerobic', type: 'aerobic', hrtFraction: 0.5, doRange: [1.5, 3.0], purpose: 'BOD + N + P' },
      { name: 'Secondary Anoxic', type: 'anoxic', hrtFraction: 0.13, doRange: [0, 0.5], purpose: 'Polishing denit' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Aerobic', to: 'Primary Anoxic', typicalRatio: 2.0 },
      { name: 'RAS', from: 'Clarifier', to: 'Primary Anoxic', typicalRatio: 0.5 },
      { name: 'Anoxic Recycle', from: 'Primary Anoxic', to: 'Anaerobic', typicalRatio: 1.5 },
    ],
    designCriteria: { totalHRT: [12, 24], srt: [15, 30], mlss: [3000, 5000], fmRatio: [0.06, 0.15] },
    suitableFor: ['Balanced N&P removal', 'Retrofit existing plants'],
    complexity: 'high',
    footprint: 'medium',
    energyIntensity: 'medium',
  },
  johannesburg: {
    type: 'johannesburg',
    name: 'Johannesburg Process',
    nameThai: 'กระบวนการโจฮันเนสเบิร์ก',
    description: 'Simplified A2O with sidestream fermentation option',
    nitrogenRemoval: true,
    phosphorusRemoval: true,
    typicalTNRemoval: [55, 75],
    typicalTPRemoval: [70, 90],
    zones: [
      { name: 'Anaerobic', type: 'anaerobic', hrtFraction: 0.1, doRange: [0, 0.2], purpose: 'VFA from sidestream' },
      { name: 'Anoxic', type: 'anoxic', hrtFraction: 0.3, doRange: [0, 0.5], purpose: 'Denitrification' },
      { name: 'Aerobic', type: 'aerobic', hrtFraction: 0.6, doRange: [1.5, 3.0], purpose: 'BOD + N + P' },
    ],
    recycles: [
      { name: 'Internal Recycle', from: 'Aerobic', to: 'Anoxic', typicalRatio: 1.5 },
      { name: 'RAS', from: 'Clarifier', to: 'Anoxic', typicalRatio: 0.75 },
    ],
    designCriteria: { totalHRT: [8, 18], srt: [10, 25], mlss: [2500, 4500], fmRatio: [0.08, 0.2] },
    suitableFor: ['Low rbCOD influent', 'Primary sludge fermentation available'],
    complexity: 'medium',
    footprint: 'medium',
    energyIntensity: 'medium',
  },
  step_feed: {
    type: 'step_feed',
    name: 'Step-Feed BNR',
    nameThai: 'ระบบป้อนแบบขั้นบันได',
    description: 'Multiple feed points for carbon distribution',
    nitrogenRemoval: true,
    phosphorusRemoval: false,
    typicalTNRemoval: [70, 90],
    typicalTPRemoval: [20, 40],
    zones: [
      { name: 'Stage 1 Anoxic', type: 'anoxic', hrtFraction: 0.15, doRange: [0, 0.5], purpose: 'Denit with feed 1' },
      { name: 'Stage 1 Aerobic', type: 'aerobic', hrtFraction: 0.25, doRange: [1.5, 3.0], purpose: 'Nitrification' },
      { name: 'Stage 2 Anoxic', type: 'anoxic', hrtFraction: 0.15, doRange: [0, 0.5], purpose: 'Denit with feed 2' },
      { name: 'Stage 2 Aerobic', type: 'aerobic', hrtFraction: 0.25, doRange: [1.5, 3.0], purpose: 'Nitrification' },
      { name: 'Stage 3 Anoxic', type: 'anoxic', hrtFraction: 0.1, doRange: [0, 0.5], purpose: 'Denit with RAS' },
      { name: 'Stage 3 Aerobic', type: 'aerobic', hrtFraction: 0.1, doRange: [2.0, 4.0], purpose: 'Polish' },
    ],
    recycles: [
      { name: 'RAS', from: 'Clarifier', to: 'Stage 3 Anoxic', typicalRatio: 0.5 },
    ],
    designCriteria: { totalHRT: [10, 20], srt: [12, 25], mlss: [2500, 4000], fmRatio: [0.08, 0.2] },
    suitableFor: ['Existing plug-flow tanks', 'Good carbon utilization'],
    complexity: 'medium',
    footprint: 'medium',
    energyIntensity: 'medium',
  },
  sbr_bnr: {
    type: 'sbr_bnr',
    name: 'SBR with BNR',
    nameThai: 'ระบบ SBR แบบ BNR',
    description: 'Sequencing batch reactor with nutrient removal',
    nitrogenRemoval: true,
    phosphorusRemoval: true,
    typicalTNRemoval: [70, 90],
    typicalTPRemoval: [70, 90],
    zones: [
      { name: 'Fill/Anaerobic', type: 'anaerobic', hrtFraction: 0.2, doRange: [0, 0.2], purpose: 'VFA uptake' },
      { name: 'React/Anoxic', type: 'anoxic', hrtFraction: 0.2, doRange: [0, 0.5], purpose: 'Denitrification' },
      { name: 'React/Aerobic', type: 'aerobic', hrtFraction: 0.35, doRange: [1.5, 3.0], purpose: 'BOD + N + P' },
      { name: 'Settle', type: 'anoxic', hrtFraction: 0.15, doRange: [0, 0.5], purpose: 'Clarification' },
      { name: 'Decant/Idle', type: 'anoxic', hrtFraction: 0.1, doRange: [0, 0.5], purpose: 'Discharge' },
    ],
    recycles: [],
    designCriteria: { totalHRT: [12, 24], srt: [15, 30], mlss: [3000, 5000], fmRatio: [0.05, 0.15] },
    suitableFor: ['Small-medium flows', 'Variable loads', 'Space constraints'],
    complexity: 'medium',
    footprint: 'compact',
    energyIntensity: 'medium',
  },
}

/**
 * Diffuser specifications constant
 */
export const DIFFUSER_SPECS: Record<DiffuserType, DiffuserSpec> = {
  fine_bubble_disc: {
    type: 'fine_bubble_disc',
    name: 'Fine Bubble Disc Diffuser',
    nameThai: 'ดิฟฟิวเซอร์แผ่นกลมฟองละเอียด',
    sote: 25,
    alpha: 0.6,
    beta: 0.98,
    theta: 1.024,
    airflowPerUnit: { min: 1.5, max: 8, optimal: 4 },
    pressureDrop: 3.5,
    submergence: 4.5,
    coveragePerUnit: 0.8,
    unitCost: 2500,
    lifespan: 8,
    maintenanceInterval: 24,
  },
  fine_bubble_tube: {
    type: 'fine_bubble_tube',
    name: 'Fine Bubble Tube Diffuser',
    nameThai: 'ดิฟฟิวเซอร์ท่อฟองละเอียด',
    sote: 23,
    alpha: 0.6,
    beta: 0.98,
    theta: 1.024,
    airflowPerUnit: { min: 3, max: 15, optimal: 8 },
    pressureDrop: 3.0,
    submergence: 4.5,
    coveragePerUnit: 1.2,
    unitCost: 4000,
    lifespan: 10,
    maintenanceInterval: 24,
  },
  fine_bubble_panel: {
    type: 'fine_bubble_panel',
    name: 'Fine Bubble Panel Diffuser',
    nameThai: 'ดิฟฟิวเซอร์แผงฟองละเอียด',
    sote: 28,
    alpha: 0.55,
    beta: 0.98,
    theta: 1.024,
    airflowPerUnit: { min: 5, max: 25, optimal: 12 },
    pressureDrop: 4.0,
    submergence: 4.5,
    coveragePerUnit: 2.0,
    unitCost: 8000,
    lifespan: 10,
    maintenanceInterval: 36,
  },
  coarse_bubble: {
    type: 'coarse_bubble',
    name: 'Coarse Bubble Diffuser',
    nameThai: 'ดิฟฟิวเซอร์ฟองหยาบ',
    sote: 8,
    alpha: 0.8,
    beta: 0.99,
    theta: 1.024,
    airflowPerUnit: { min: 10, max: 50, optimal: 25 },
    pressureDrop: 1.5,
    submergence: 3.0,
    coveragePerUnit: 3.0,
    unitCost: 1500,
    lifespan: 15,
    maintenanceInterval: 12,
  },
  jet_aerator: {
    type: 'jet_aerator',
    name: 'Jet Aerator',
    nameThai: 'เครื่องเติมอากาศแบบเจ็ท',
    sote: 20,
    alpha: 0.7,
    beta: 0.98,
    theta: 1.024,
    airflowPerUnit: { min: 50, max: 300, optimal: 150 },
    pressureDrop: 15,
    submergence: 3.5,
    coveragePerUnit: 25,
    unitCost: 150000,
    lifespan: 15,
    maintenanceInterval: 12,
  },
  mechanical_surface: {
    type: 'mechanical_surface',
    name: 'Mechanical Surface Aerator',
    nameThai: 'เครื่องเติมอากาศผิวน้ำ',
    sote: 15,
    alpha: 0.85,
    beta: 0.99,
    theta: 1.024,
    airflowPerUnit: { min: 0, max: 0, optimal: 0 },
    pressureDrop: 0,
    submergence: 0.3,
    coveragePerUnit: 100,
    unitCost: 250000,
    lifespan: 15,
    maintenanceInterval: 6,
  },
  brush_aerator: {
    type: 'brush_aerator',
    name: 'Brush Aerator',
    nameThai: 'เครื่องเติมอากาศแบบแปรง',
    sote: 12,
    alpha: 0.85,
    beta: 0.99,
    theta: 1.024,
    airflowPerUnit: { min: 0, max: 0, optimal: 0 },
    pressureDrop: 0,
    submergence: 0.5,
    coveragePerUnit: 50,
    unitCost: 350000,
    lifespan: 20,
    maintenanceInterval: 6,
  },
}
