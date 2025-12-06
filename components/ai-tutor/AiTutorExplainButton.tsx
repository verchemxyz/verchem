'use client'

/**
 * AI Chemistry Tutor - Explain Button
 *
 * Inline button to explain calculator results
 * This is the KEY feature that differentiates from ChatGPT!
 *
 * Last Updated: 2025-12-02
 */

import React from 'react'
import { Sparkles, MessageCircle } from 'lucide-react'
import { useAiTutor } from './AiTutorProvider'
import type { CalculatorContext, ExplainButtonProps } from '@/lib/ai-tutor'

export function AiTutorExplainButton({
  context,
  className = '',
  variant = 'default',
}: ExplainButtonProps) {
  const { openChat, sendMessage, state } = useAiTutor()

  const handleClick = async () => {
    // Open chat with context
    openChat(context)

    // Send initial explain message
    setTimeout(() => {
      sendMessage('Please explain this calculation result and how it was calculated.')
    }, 100)
  }

  const isDisabled = state.isLoading || (state.quota?.isOverLimit ?? false)

  if (variant === 'small') {
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 ${className}`}
        title="Ask AI to explain this"
      >
        <Sparkles className="h-3 w-3" />
        Explain
      </button>
    )
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50 dark:text-purple-400 dark:hover:text-purple-300 ${className}`}
        title="Ask AI to explain this"
      >
        <Sparkles className="h-3 w-3" />
        Explain with AI
      </button>
    )
  }

  // Default variant
  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 ${className}`}
    >
      <div className="relative">
        <MessageCircle className="h-4 w-4" />
        <Sparkles className="absolute -right-1 -top-1 h-2.5 w-2.5 text-yellow-500" />
      </div>
      Explain with AI
    </button>
  )
}

/**
 * Helper hook to create calculator context easily
 */
export function useExplainContext() {
  const { openChat, sendMessage } = useAiTutor()

  const explainResult = (context: CalculatorContext, customPrompt?: string) => {
    openChat(context)
    setTimeout(() => {
      sendMessage(
        customPrompt || 'Please explain this calculation result and how it was calculated.'
      )
    }, 100)
  }

  return { explainResult }
}
