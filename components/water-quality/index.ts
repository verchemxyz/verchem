// Water Quality Components
// Barrel export for cleaner imports

export { MODES, type ModeConfig, type CalculationResult } from './water-quality-config'
export {
  isBOD5Result,
  isBODuResult,
  isCODResult,
  isBODCODRatioResult,
  isBODLoadingResult,
  isRemovalEfficiencyResult,
  isKRateResult,
  isTempCorrectionResult,
  isComplianceResult,
} from './water-quality-config'

export {
  WaterQualityInputs,
  BOD5Inputs,
  BODuInputs,
  CODInputs,
  BODCODRatioInputs,
  LoadingRateInputs,
  RemovalEfficiencyInputs,
  KRateInputs,
  TempCorrectionInputs,
  ComplianceInputs,
} from './water-quality-inputs'

export { WaterQualityResults } from './water-quality-results'

export {
  ThaiStandardsSection,
  FormulasSection,
  FeaturesSection,
  FAQSection,
  CTASection,
} from './water-quality-sections'
