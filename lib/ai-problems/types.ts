/**
 * AI Problem Generator - Type Definitions
 *
 * VerChem Premium Feature
 * Key differentiator: Problems validated by OUR calculators!
 *
 * Last Updated: 2025-12-02
 */

/**
 * Problem Categories (matches our calculators)
 */
export type ProblemCategory =
  | 'stoichiometry'
  | 'ph-solutions'
  | 'gas-laws'
  | 'thermodynamics'
  | 'kinetics'
  | 'electrochemistry'
  | 'equation-balancing'
  | 'molar-mass'

/**
 * Difficulty levels
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export interface DifficultyConfig {
  level: DifficultyLevel
  label: string
  description: string
  color: string
  points: number
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  1: { level: 1, label: 'Easy', description: 'Single concept, direct calculation', color: 'green', points: 100 },
  2: { level: 2, label: 'Medium', description: 'Two concepts combined', color: 'blue', points: 150 },
  3: { level: 3, label: 'Hard', description: 'Multiple steps required', color: 'yellow', points: 200 },
  4: { level: 4, label: 'Expert', description: 'Complex problem solving', color: 'orange', points: 300 },
  5: { level: 5, label: 'Master', description: 'Competition level', color: 'red', points: 500 },
}

/**
 * Generated Problem
 */
export interface GeneratedProblem {
  id: string
  category: ProblemCategory
  difficulty: DifficultyLevel

  // Problem content
  question: string
  context?: string // Real-world scenario
  givenData: Record<string, { value: number; unit: string }>

  // Answer (validated by our calculator!)
  expectedAnswer: {
    value: number
    unit: string
    tolerance: number // Acceptable error margin
    significantFigures?: number
  }

  // Educational content
  hints: [string, string, string] // 3 progressive hints
  solutionSteps: string[]
  formula: string
  conceptTags: string[]
  commonMistakes?: string[]

  // Validation
  calculatorVerified: boolean
  validationDetails?: {
    calculatorUsed: string
    calculatedValue: number
    matchesExpected: boolean
  }

  // Metadata
  generatedAt: Date
  timesServed?: number
  successRate?: number
}

/**
 * Problem Generation Request
 */
export interface ProblemGenerationRequest {
  category: ProblemCategory
  difficulty: DifficultyLevel
  count?: number // How many problems to generate (default 1)
  excludeIds?: string[] // Don't repeat these problems
  preferredTopics?: string[] // Focus on specific topics
}

/**
 * Problem Answer Submission
 */
export interface ProblemSubmission {
  problemId: string
  userAnswer: number
  unit: string
  timeTaken: number // seconds
}

/**
 * Answer Validation Result
 */
export interface ValidationResult {
  isCorrect: boolean
  userAnswer: number
  expectedAnswer: number
  tolerance: number
  percentError: number
  feedback: string
  hintsUsed: number
  pointsEarned: number
}

/**
 * User Progress State
 */
export interface UserProgress {
  userId: string
  categoryScores: Record<ProblemCategory, CategoryScore>
  totalProblemsAttempted: number
  totalCorrect: number
  currentStreak: number
  longestStreak: number
  lastPracticeDate: Date
}

export interface CategoryScore {
  attempted: number
  correct: number
  currentAbility: number // -3 to +3 (IRT scale)
  lastDifficulty: DifficultyLevel
  averageTime: number // seconds
}

/**
 * Problem Template (for structured generation)
 */
export interface ProblemTemplate {
  category: ProblemCategory
  type: string
  template: string
  variables: TemplateVariable[]
  formula: string
  calculatorFunction: string
}

export interface TemplateVariable {
  name: string
  min: number
  max: number
  unit: string
  decimalPlaces: number
  chemicallyMeaningful: boolean // Use realistic values
}
