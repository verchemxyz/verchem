/**
 * AI Chemistry Tutor - Public API
 *
 * VerChem Premium Feature
 * Last Updated: 2025-12-02
 */

// Types
export type {
  CalculatorContext,
  CalculatorId,
  AiTutorMessage,
  AiTutorSession,
  UsageQuota,
  AiTutorChatRequest,
  AiTutorChatResponse,
  AiTutorErrorResponse,
  TutorScope,
  ExplainButtonProps,
  AiTutorState,
  AiTutorAction,
} from './types'

// Constants
export {
  AI_TUTOR_LIMITS,
  CALCULATOR_NAMES,
  CALCULATOR_CONCEPTS,
  CHEMISTRY_TUTOR_SYSTEM_PROMPT,
  COMPLEX_TOPICS,
  shouldUseSonnet,
  AI_TUTOR_ERRORS,
} from './constants'

// Context Builder
export {
  buildContextPrompt,
  createCalculatorContext,
  contextBuilders,
} from './context-builder'
