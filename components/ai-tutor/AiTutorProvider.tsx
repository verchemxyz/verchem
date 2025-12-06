'use client'

/**
 * AI Chemistry Tutor - Provider Context
 *
 * Provides global state for AI tutor across the app
 *
 * Last Updated: 2025-12-02
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type {
  AiTutorState,
  AiTutorAction,
  CalculatorContext,
  AiTutorMessage,
  UsageQuota,
  AiTutorChatResponse,
} from '@/lib/ai-tutor'

// Initial state
const initialState: AiTutorState = {
  isOpen: false,
  isLoading: false,
  session: null,
  quota: null,
  error: null,
}

// Reducer
function aiTutorReducer(state: AiTutorState, action: AiTutorAction): AiTutorState {
  switch (action.type) {
    case 'OPEN_CHAT':
      return {
        ...state,
        isOpen: true,
        session: state.session || {
          id: crypto.randomUUID(),
          messages: [],
          currentContext: action.context,
          createdAt: new Date(),
          lastMessageAt: new Date(),
        },
      }

    case 'CLOSE_CHAT':
      return { ...state, isOpen: false }

    case 'SEND_MESSAGE':
      if (!state.session) return state
      const userMessage: AiTutorMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: action.message,
        timestamp: new Date(),
      }
      return {
        ...state,
        session: {
          ...state.session,
          messages: [...state.session.messages, userMessage],
          lastMessageAt: new Date(),
        },
      }

    case 'RECEIVE_MESSAGE':
      if (!state.session) return state
      return {
        ...state,
        session: {
          ...state.session,
          messages: [...state.session.messages, action.message],
          lastMessageAt: new Date(),
        },
      }

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'SET_QUOTA':
      return { ...state, quota: action.quota }

    case 'UPDATE_CONTEXT':
      if (!state.session) return state
      return {
        ...state,
        session: { ...state.session, currentContext: action.context },
      }

    case 'CLEAR_SESSION':
      return { ...state, session: null }

    default:
      return state
  }
}

// Context types
interface AiTutorContextValue {
  state: AiTutorState
  openChat: (context?: CalculatorContext) => void
  closeChat: () => void
  sendMessage: (message: string) => Promise<void>
  updateContext: (context: CalculatorContext) => void
  clearSession: () => void
  refreshQuota: () => Promise<void>
}

// Create context
const AiTutorContext = createContext<AiTutorContextValue | null>(null)

// Provider component
export function AiTutorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(aiTutorReducer, initialState)

  // Fetch initial quota
  const refreshQuota = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-tutor/chat')
      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: 'SET_QUOTA',
          quota: {
            tier: data.tier,
            queriesUsed: data.queriesUsed,
            queriesLimit: data.queriesLimit,
            queriesRemaining: data.queriesRemaining,
            resetDate: new Date(data.resetDate),
            isOverLimit: data.queriesRemaining <= 0,
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error)
    }
  }, [])

  // Fetch quota on mount
  useEffect(() => {
    refreshQuota()
  }, [refreshQuota])

  // Open chat
  const openChat = useCallback((context?: CalculatorContext) => {
    dispatch({ type: 'OPEN_CHAT', context })
  }, [])

  // Close chat
  const closeChat = useCallback(() => {
    dispatch({ type: 'CLOSE_CHAT' })
  }, [])

  // Send message
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return

      dispatch({ type: 'SEND_MESSAGE', message })
      dispatch({ type: 'SET_LOADING', loading: true })
      dispatch({ type: 'SET_ERROR', error: null })

      try {
        // Build conversation history
        const conversationHistory = (state.session?.messages || [])
          .slice(-6)
          .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))

        const response = await fetch('/api/ai-tutor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            context: state.session?.currentContext,
            conversationHistory,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send message')
        }

        const data: AiTutorChatResponse = await response.json()

        // Add assistant message
        const assistantMessage: AiTutorMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          model: data.model,
          tokensUsed: data.tokensUsed?.output,
        }

        dispatch({ type: 'RECEIVE_MESSAGE', message: assistantMessage })

        // Update quota
        if (state.quota) {
          dispatch({
            type: 'SET_QUOTA',
            quota: {
              ...state.quota,
              queriesUsed: state.quota.queriesUsed + 1,
              queriesRemaining: data.remaining,
              isOverLimit: data.remaining <= 0,
            },
          })
        }
      } catch (error) {
        console.error('AI Tutor error:', error)
        dispatch({
          type: 'SET_ERROR',
          error: error instanceof Error ? error.message : 'Failed to get response',
        })
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false })
      }
    },
    [state.session, state.quota]
  )

  // Update context
  const updateContext = useCallback((context: CalculatorContext) => {
    dispatch({ type: 'UPDATE_CONTEXT', context })
  }, [])

  // Clear session
  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' })
  }, [])

  const value: AiTutorContextValue = {
    state,
    openChat,
    closeChat,
    sendMessage,
    updateContext,
    clearSession,
    refreshQuota,
  }

  return <AiTutorContext.Provider value={value}>{children}</AiTutorContext.Provider>
}

// Hook to use AI Tutor
export function useAiTutor() {
  const context = useContext(AiTutorContext)
  if (!context) {
    throw new Error('useAiTutor must be used within AiTutorProvider')
  }
  return context
}
