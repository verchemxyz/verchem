// VerChem - World-Class Chemistry & Environmental Engineering Platform
// Type Definitions for Spectroscopy Module (IR, NMR, Mass Spectrometry)

// =============================================================================
// Shared Types
// =============================================================================

/**
 * Supported spectroscopy techniques
 */
export type SpectroscopyType = 'ir' | 'nmr-1h' | 'nmr-13c' | 'mass-spec'

/**
 * Generic peak input from a user-provided spectrum.
 * The `value` field represents wavenumber (cm^-1) for IR,
 * chemical shift (ppm) for NMR, or m/z for mass spectrometry.
 */
export interface PeakInput {
  value: number
  intensity?: number // relative intensity 0-100 (or absorbance for IR)
  label?: string // optional user-supplied label
}

/**
 * Confidence level for a spectroscopic assignment
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * A single match returned by the analysis engine
 */
export interface AnalysisMatch {
  /** What was matched (functional group, fragment, environment, etc.) */
  assignment: string
  /** Confidence of the assignment */
  confidence: ConfidenceLevel
  /** The reference data that produced the match */
  referenceRange: [number, number] // [min, max] in the relevant unit
  /** Human-readable explanation of why this match was made */
  reasoning: string
}

/**
 * Complete result of analyzing one or more peaks
 */
export interface AnalysisResult {
  /** Which spectroscopy technique produced this result */
  type: SpectroscopyType
  /** Input peaks that were analyzed */
  inputPeaks: PeakInput[]
  /** All matches found across the input peaks */
  matches: AnalysisMatch[]
  /** Overall confidence across all matches */
  overallConfidence: ConfidenceLevel
  /** Structural suggestions based on the combined evidence */
  suggestions: StructuralSuggestion[]
  /** Peaks that could not be assigned */
  unassignedPeaks: PeakInput[]
}

/**
 * A structural suggestion inferred from the spectroscopic data
 */
export interface StructuralSuggestion {
  /** Proposed structural feature or functional group */
  feature: string
  /** Evidence supporting this suggestion */
  supportingEvidence: string[]
  /** How confident the suggestion is */
  confidence: ConfidenceLevel
}

// =============================================================================
// IR Spectroscopy
// =============================================================================

/**
 * IR absorption band intensity
 */
export type IRIntensity = 'strong' | 'medium' | 'weak' | 'variable'

/**
 * Visual appearance of an IR absorption band
 */
export type IRAppearance = 'broad' | 'sharp' | 'very-broad' | 'narrow' | 'medium-width' | 'shoulder'

/**
 * A single IR absorption band reference entry
 */
export interface IRAbsorption {
  /** Lower bound of the absorption range in cm^-1 */
  wavenumberMin: number
  /** Upper bound of the absorption range in cm^-1 */
  wavenumberMax: number
  /** Functional group responsible (e.g., "Hydroxyl", "Carbonyl") */
  functionalGroup: string
  /** Bond type (e.g., "O-H stretch", "C=O stretch", "N-H bend") */
  bondType: string
  /** Typical band intensity */
  intensity: IRIntensity
  /** Band shape / appearance */
  appearance: IRAppearance
  /** Additional notes (e.g., "hydrogen bonding broadens the band") */
  notes: string
}

/**
 * Functional group categories for organizing IR absorptions
 */
export type IRCategoryId =
  | 'o-h'
  | 'n-h'
  | 'c-h'
  | 'c=o'
  | 'c=c'
  | 'c-c'
  | 'c-o'
  | 'c-n'
  | 'c-x' // halogens (C-F, C-Cl, C-Br, C-I)
  | 'n-o'
  | 's=o'
  | 'p=o'
  | 'triple-bond' // C≡C, C≡N
  | 'aromatic'
  | 'other'

/**
 * A grouped category of IR absorptions
 */
export interface IRCategory {
  /** Machine-readable identifier */
  id: IRCategoryId
  /** Display name (e.g., "O-H Stretches") */
  name: string
  /** Wavenumber region description (e.g., "3200-3600 cm^-1") */
  regionDescription: string
  /** All absorptions within this category */
  absorptions: IRAbsorption[]
}

/**
 * Full IR spectrum reference data set
 */
export interface IRReferenceData {
  categories: IRCategory[]
}

/**
 * Result of analyzing an IR spectrum
 */
export interface IRAnalysisResult extends AnalysisResult {
  type: 'ir'
  /** Detected functional groups with their wavenumber ranges */
  functionalGroups: IRFunctionalGroupMatch[]
}

/**
 * A functional group identified in an IR spectrum
 */
export interface IRFunctionalGroupMatch {
  /** The functional group detected */
  functionalGroup: string
  /** Bond type matched */
  bondType: string
  /** Observed wavenumber (cm^-1) */
  observedWavenumber: number
  /** Reference absorption that was matched */
  reference: IRAbsorption
  /** How confident the match is */
  confidence: ConfidenceLevel
}

// =============================================================================
// NMR Spectroscopy
// =============================================================================

/**
 * NMR nucleus type
 */
export type NMRNucleus = '1H' | '13C'

/**
 * Multiplicity patterns for 1H NMR (n+1 rule)
 */
export type NMRMultiplicity =
  | 'singlet'   // s
  | 'doublet'   // d
  | 'triplet'   // t
  | 'quartet'   // q
  | 'quintet'   // quint
  | 'sextet'    // sext
  | 'septet'    // sept
  | 'multiplet' // m
  | 'broad-singlet' // br s
  | 'doublet-of-doublets' // dd
  | 'doublet-of-triplets' // dt
  | 'triplet-of-doublets' // td

/**
 * Abbreviations for multiplicities (used in shorthand notation)
 */
export type NMRMultiplicityAbbr =
  | 's' | 'd' | 't' | 'q' | 'quint' | 'sext' | 'sept'
  | 'm' | 'br s' | 'dd' | 'dt' | 'td'

/**
 * A chemical shift range for a given chemical environment.
 * Used for both 1H and 13C reference tables.
 */
export interface NMRShift {
  /** Lower bound of the chemical shift range in ppm */
  chemicalShiftMin: number
  /** Upper bound of the chemical shift range in ppm */
  chemicalShiftMax: number
  /** Chemical environment description (e.g., "Alkyl CH3", "Aromatic H") */
  environment: string
  /** Typical multiplicity patterns (1H only; empty array for 13C) */
  multiplicity: NMRMultiplicity[]
  /** Concrete molecule examples showing this shift (e.g., "TMS (0.00 ppm)") */
  commonExamples: string[]
  /** Which nucleus this shift applies to */
  nucleus: NMRNucleus
}

/**
 * NMR solvent reference data
 */
export interface NMRSolvent {
  /** Common name (e.g., "Chloroform-d") */
  name: string
  /** Molecular formula (e.g., "CDCl3") */
  formula: string
  /** Residual 1H chemical shift in ppm */
  protonShift: number
  /** 13C chemical shift in ppm (of the solvent carbon) */
  carbonShift: number
  /** Number of 13C lines (e.g., CDCl3 = 1 triplet line at 77.16) */
  carbonMultiplicity: NMRMultiplicity
  /** Melting point in degrees Celsius */
  meltingPoint: number
  /** Boiling point in degrees Celsius */
  boilingPoint: number
  /** Additional notes */
  notes: string
}

/**
 * A single NMR peak as reported by the user or extracted from a spectrum
 */
export interface NMRPeakInput extends PeakInput {
  /** Chemical shift in ppm (same as `value`) */
  chemicalShift: number
  /** Observed multiplicity (1H only) */
  multiplicity?: NMRMultiplicity
  /** Integration value (relative number of equivalent protons, 1H only) */
  integration?: number
  /** Coupling constant J in Hz (1H only) */
  couplingConstant?: number
}

/**
 * Result of analyzing an NMR spectrum
 */
export interface NMRAnalysisResult extends AnalysisResult {
  type: 'nmr-1h' | 'nmr-13c'
  /** Nucleus analyzed */
  nucleus: NMRNucleus
  /** Solvent used (affects reference and residual peaks) */
  solvent?: NMRSolvent
  /** Matched chemical environments */
  environmentMatches: NMREnvironmentMatch[]
}

/**
 * A chemical environment identified from an NMR peak
 */
export interface NMREnvironmentMatch {
  /** The observed chemical shift in ppm */
  observedShift: number
  /** The reference shift entry that matched */
  reference: NMRShift
  /** Confidence of the assignment */
  confidence: ConfidenceLevel
  /** Whether this peak might be a solvent residual */
  isSolventPeak: boolean
}

/**
 * DEPT (Distortionless Enhancement by Polarization Transfer) classification
 * for 13C NMR peaks
 */
export type DEPTClassification = 'CH3' | 'CH2' | 'CH' | 'quaternary-C'

/**
 * 13C NMR peak with DEPT information
 */
export interface CarbonPeakWithDEPT extends NMRPeakInput {
  /** DEPT classification (if DEPT experiment was run) */
  deptClassification?: DEPTClassification
}

// =============================================================================
// Mass Spectrometry
// =============================================================================

/**
 * Ionization technique used in mass spectrometry
 */
export type IonizationMethod =
  | 'EI'    // Electron Ionization (70 eV, classic)
  | 'CI'    // Chemical Ionization
  | 'ESI'   // Electrospray Ionization
  | 'MALDI' // Matrix-Assisted Laser Desorption/Ionization
  | 'APCI'  // Atmospheric Pressure Chemical Ionization
  | 'FAB'   // Fast Atom Bombardment

/**
 * Ion polarity mode
 */
export type IonPolarity = 'positive' | 'negative'

/**
 * A common neutral loss observed in mass spectrometry fragmentation
 */
export interface FragmentLoss {
  /** Mass lost (Da) */
  massLost: number
  /** Fragment formula that was lost (e.g., "H2O", "CO", "CH3") */
  fragment: string
  /** What functional group or structural feature this loss indicates */
  interpretation: string
  /** Additional notes about this loss (e.g., "common in alcohols") */
  notes: string
}

/**
 * Isotope pattern data for a given element
 */
export interface IsotopePattern {
  /** Element symbol (e.g., "Cl", "Br", "S") */
  element: string
  /** Relative abundance of M+1 peak compared to M (as a percentage) */
  mPlusOneRatio: number
  /** Relative abundance of M+2 peak compared to M (as a percentage) */
  mPlusTwoRatio: number
  /** Why this pattern is significant for identification */
  significance: string
  /** Natural isotopes that cause this pattern */
  isotopes: IsotopeInfo[]
}

/**
 * Information about a single isotope
 */
export interface IsotopeInfo {
  /** Mass number (e.g., 35 for Cl-35) */
  massNumber: number
  /** Natural abundance as a percentage */
  naturalAbundance: number
  /** Exact mass in Da */
  exactMass: number
}

/**
 * A commonly observed ion in mass spectrometry
 */
export interface CommonIon {
  /** m/z value of the ion */
  mz: number
  /** Ionic formula (e.g., "C6H5+", "CHO+") */
  ionFormula: string
  /** Source or origin of this ion (e.g., "tropylium from toluene") */
  source: string
  /** Common name if any (e.g., "tropylium cation") */
  commonName?: string
}

/**
 * A single peak in a mass spectrum as reported by the user
 */
export interface MSPeakInput extends PeakInput {
  /** m/z value (same as `value`) */
  mz: number
  /** Relative intensity (base peak = 100) */
  relativeIntensity: number
  /** Whether this peak is flagged as the molecular ion */
  isMolecularIon?: boolean
  /** Whether this peak is flagged as the base peak */
  isBasePeak?: boolean
}

/**
 * Result of analyzing a mass spectrum
 */
export interface MSAnalysisResult extends AnalysisResult {
  type: 'mass-spec'
  /** Ionization method used */
  ionizationMethod?: IonizationMethod
  /** Ion polarity mode */
  polarity: IonPolarity
  /** Molecular ion peak (M+) if identified */
  molecularIon?: MSMolecularIon
  /** Base peak (most intense) */
  basePeak?: MSPeakInput
  /** Identified fragment losses from the molecular ion */
  fragmentLosses: MSFragmentLossMatch[]
  /** Isotope pattern analysis */
  isotopeAnalysis?: MSIsotopeAnalysis
  /** Nitrogen rule assessment */
  nitrogenRule?: NitrogenRuleResult
}

/**
 * Molecular ion identification
 */
export interface MSMolecularIon {
  /** m/z of the molecular ion */
  mz: number
  /** Type of molecular ion observed */
  ionType: MolecularIonType
  /** Relative intensity */
  relativeIntensity: number
  /** Suggested molecular formula(s) */
  possibleFormulas: MolecularFormulaCandidate[]
}

/**
 * Type of molecular ion peak
 */
export type MolecularIonType =
  | 'M+'       // Radical cation (EI)
  | '[M+H]+'   // Protonated (CI, ESI)
  | '[M+Na]+'  // Sodium adduct (ESI)
  | '[M+K]+'   // Potassium adduct (ESI)
  | '[M-H]-'   // Deprotonated (negative ESI)
  | '[M+NH4]+' // Ammonium adduct
  | '[2M+H]+'  // Dimer
  | '[2M+Na]+' // Dimer sodium adduct

/**
 * A candidate molecular formula for a given m/z
 */
export interface MolecularFormulaCandidate {
  /** Molecular formula (e.g., "C6H12O6") */
  formula: string
  /** Calculated exact mass */
  exactMass: number
  /** Mass error in ppm compared to observed m/z */
  errorPpm: number
  /** Degree of unsaturation (Double Bond Equivalents) */
  dbe: number
  /** Rings plus double bonds */
  ringsAndDoubleBonds: number
}

/**
 * A fragment loss identified in a mass spectrum
 */
export interface MSFragmentLossMatch {
  /** m/z of the precursor ion */
  precursorMz: number
  /** m/z of the product ion */
  productMz: number
  /** Mass difference (Da) */
  massLost: number
  /** Reference fragment loss that was matched */
  reference: FragmentLoss
  /** How confident the assignment is */
  confidence: ConfidenceLevel
}

/**
 * Result of isotope pattern analysis
 */
export interface MSIsotopeAnalysis {
  /** Observed M+1 / M ratio (%) */
  observedMPlusOneRatio: number
  /** Observed M+2 / M ratio (%) */
  observedMPlusTwoRatio: number
  /** Elements likely present based on isotope patterns */
  elementsDetected: IsotopePatternMatch[]
  /** Estimated number of carbons from M+1 ratio (1.1% per C) */
  estimatedCarbonCount: number
}

/**
 * An isotope pattern matched to an element
 */
export interface IsotopePatternMatch {
  /** The reference isotope pattern */
  reference: IsotopePattern
  /** How many atoms of this element are estimated */
  estimatedCount: number
  /** Confidence of this estimation */
  confidence: ConfidenceLevel
}

/**
 * Nitrogen rule: odd molecular mass = odd number of nitrogen atoms
 */
export interface NitrogenRuleResult {
  /** Observed molecular ion m/z */
  molecularMass: number
  /** Whether the mass is odd or even */
  isOddMass: boolean
  /** Interpretation: likely contains odd/even number of nitrogen atoms */
  interpretation: string
  /** Whether nitrogen is likely present */
  nitrogenLikely: boolean
}

// =============================================================================
// Combined / Multi-technique Analysis
// =============================================================================

/**
 * Input data for a multi-technique spectroscopic analysis
 */
export interface CombinedSpectroscopyInput {
  /** IR peaks (wavenumber in cm^-1) */
  irPeaks?: PeakInput[]
  /** 1H NMR peaks */
  protonNMRPeaks?: NMRPeakInput[]
  /** 13C NMR peaks */
  carbonNMRPeaks?: CarbonPeakWithDEPT[]
  /** Mass spectrum peaks */
  msPeaks?: MSPeakInput[]
  /** Known molecular formula (if available) */
  knownFormula?: string
  /** Known molecular weight (if available) */
  knownMolecularWeight?: number
}

/**
 * Result of a combined multi-technique analysis
 */
export interface CombinedAnalysisResult {
  /** Individual analysis results for each technique provided */
  individualResults: {
    ir?: IRAnalysisResult
    nmr1H?: NMRAnalysisResult
    nmr13C?: NMRAnalysisResult
    massSpec?: MSAnalysisResult
  }
  /** Functional groups confirmed by multiple techniques */
  confirmedFunctionalGroups: ConfirmedFunctionalGroup[]
  /** Best structural candidates based on all available data */
  structuralCandidates: StructuralCandidate[]
  /** Overall confidence of the combined analysis */
  overallConfidence: ConfidenceLevel
}

/**
 * A functional group confirmed by evidence from multiple spectroscopic techniques
 */
export interface ConfirmedFunctionalGroup {
  /** Name of the functional group */
  name: string
  /** Which techniques provided evidence */
  supportedBy: SpectroscopyType[]
  /** Evidence from each technique */
  evidence: Record<SpectroscopyType, string>
  /** Combined confidence */
  confidence: ConfidenceLevel
}

/**
 * A structural candidate proposed from multi-technique analysis
 */
export interface StructuralCandidate {
  /** Proposed molecular formula */
  formula: string
  /** Degree of unsaturation (DBE) */
  dbe: number
  /** Functional groups present */
  functionalGroups: string[]
  /** Supporting evidence from each technique */
  evidence: string[]
  /** Overall confidence */
  confidence: ConfidenceLevel
  /** Ranking (1 = most likely) */
  rank: number
}

// =============================================================================
// Spectrum Display & Visualization
// =============================================================================

/**
 * Axis configuration for rendering a spectrum
 */
export interface SpectrumAxis {
  /** Axis label (e.g., "Wavenumber (cm^-1)", "Chemical Shift (ppm)") */
  label: string
  /** Unit of the axis */
  unit: string
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Whether the axis is inverted (e.g., IR wavenumber, NMR ppm) */
  inverted: boolean
}

/**
 * Configuration for rendering a spectrum chart
 */
export interface SpectrumDisplayConfig {
  /** Type of spectrum */
  type: SpectroscopyType
  /** X-axis configuration */
  xAxis: SpectrumAxis
  /** Y-axis configuration */
  yAxis: SpectrumAxis
  /** Display title */
  title: string
}

/**
 * Predefined display configurations for each spectroscopy type
 */
export interface SpectrumDisplayPresets {
  ir: SpectrumDisplayConfig
  'nmr-1h': SpectrumDisplayConfig
  'nmr-13c': SpectrumDisplayConfig
  'mass-spec': SpectrumDisplayConfig
}
