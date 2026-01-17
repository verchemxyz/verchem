// Air Quality Components
// Barrel export for cleaner imports

export {
  MODES,
  POLLUTANT_OPTIONS,
  GAS_POLLUTANT_OPTIONS,
  type ModeConfig,
  type CalculationResult,
  isAQIResult,
  isConversionResult,
  isThaiComplianceResult,
  isEmissionRateResult,
  isStackDilutionResult,
  isGaussianDispersionResult,
} from './air-quality-config'

export {
  AirQualityInputs,
  AQIInputs,
  ConversionInputs,
  ThaiStandardsInputs,
  EmissionRateInputs,
  PlumeRiseInputs,
  GaussianDispersionInputs,
} from './air-quality-inputs'

export { AirQualityResults } from './air-quality-results'
