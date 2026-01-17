// Soil Quality Components
// Barrel export for cleaner imports

export {
  MODES,
  METAL_OPTIONS,
  LAND_USE_OPTIONS,
  type ModeConfig,
  type CalculationResult,
  isContaminationResult,
  isPhResult,
  isNpkResult,
  isCecResult,
  isOrganicMatterResult,
  isTextureResult,
  isSalinityResult,
  getRiskColor,
  getLevelColor,
  getPhColor,
  getSalinityColor,
} from './soil-quality-config'

export {
  SoilQualityInputs,
  ContaminationInputs,
  PhInputs,
  NpkInputs,
  CecInputs,
  OrganicMatterInputs,
  TextureInputs,
  SalinityInputs,
} from './soil-quality-inputs'

export { SoilQualityResults } from './soil-quality-results'
