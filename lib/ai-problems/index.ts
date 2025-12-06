/**
 * AI Problem Generator - Public API
 *
 * VerChem Premium Feature
 * Last Updated: 2025-12-02
 */

// Types
export type {
  ProblemCategory,
  DifficultyLevel,
  DifficultyConfig,
  GeneratedProblem,
  ProblemGenerationRequest,
  ProblemSubmission,
  ValidationResult,
  UserProgress,
  CategoryScore,
  ProblemTemplate,
  TemplateVariable,
} from './types'

// Constants
export { DIFFICULTY_CONFIGS } from './types'

// Templates
export {
  COMMON_ACIDS,
  WEAK_ACIDS,
  COMMON_BASES,
  COMMON_GASES,
  KA_VALUES,
  MOLAR_MASSES,
  BALANCING_EQUATIONS,
  ELECTRODE_POTENTIALS,
  PROBLEM_TEMPLATES,
} from './templates'

// Generator
export {
  generateProblem,
  generateProblems,
  validateAnswer,
} from './generator'
