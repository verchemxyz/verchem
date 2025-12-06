/**
 * AI Chemistry Tutor - Type Definitions
 *
 * VerChem Premium Feature
 * Last Updated: 2025-12-02
 */

import type { SubscriptionTier } from '../vercal/types'

/**
 * Calculator Context - What the user is currently working on
 */
export interface CalculatorContext {
  calculatorId: CalculatorId
  calculatorName: string
  inputs: Record<string, number | string | boolean>
  result: unknown
  formula?: string
  relatedConcepts: string[]
}

export type CalculatorId =
  | 'equation-balancer'
  | 'stoichiometry'
  | 'solutions'
  | 'gas-laws'
  | 'thermodynamics'
  | 'kinetics'
  | 'electrochemistry'
  | 'electron-config'
  | 'lewis-structure'
  | 'vsepr'
  | 'titration'
  | 'practice'

/**
 * Chat Message
 */
export interface AiTutorMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context?: CalculatorContext
  model?: 'haiku' | 'sonnet'
  tokensUsed?: number
}

/**
 * Chat Session
 */
export interface AiTutorSession {
  id: string
  userId?: string
  messages: AiTutorMessage[]
  currentContext?: CalculatorContext
  createdAt: Date
  lastMessageAt: Date
}

/**
 * Usage Quota
 */
export interface UsageQuota {
  tier: SubscriptionTier
  queriesUsed: number
  queriesLimit: number
  queriesRemaining: number
  resetDate: Date
  isOverLimit: boolean
}

/**
 * API Request
 */
export interface AiTutorChatRequest {
  message: string
  context?: CalculatorContext
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

/**
 * API Response
 */
export interface AiTutorChatResponse {
  response: string
  remaining: number
  model: 'haiku' | 'sonnet'
  tokensUsed?: {
    input: number
    output: number
  }
}

/**
 * Error Response
 */
export interface AiTutorErrorResponse {
  error: string
  code: 'RATE_LIMIT' | 'AUTH_REQUIRED' | 'API_ERROR' | 'INVALID_REQUEST'
  remaining?: number
  resetDate?: Date
  upgradePrompt?: string
}

/**
 * Feature Scope - What the AI Tutor can help with
 */
export type TutorScope =
  | 'explain-result'      // Explain a calculation result
  | 'explain-concept'     // Explain a chemistry concept
  | 'solve-problem'       // Help solve a problem (hints only)
  | 'check-work'          // Check user's work
  | 'practice-hint'       // Hint for practice problems

/**
 * Explain Button Props
 */
export interface ExplainButtonProps {
  context: CalculatorContext
  className?: string
  variant?: 'default' | 'small' | 'inline'
}

/**
 * Provider State
 */
export interface AiTutorState {
  isOpen: boolean
  isLoading: boolean
  session: AiTutorSession | null
  quota: UsageQuota | null
  error: string | null
}

/**
 * Provider Actions
 */
export type AiTutorAction =
  | { type: 'OPEN_CHAT'; context?: CalculatorContext }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SEND_MESSAGE'; message: string }
  | { type: 'RECEIVE_MESSAGE'; message: AiTutorMessage }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_QUOTA'; quota: UsageQuota }
  | { type: 'UPDATE_CONTEXT'; context: CalculatorContext }
  | { type: 'CLEAR_SESSION' }
