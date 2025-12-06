'use client'

/**
 * AI Chemistry Tutor - Floating Action Button
 *
 * Shows in bottom-right corner, opens AI chat
 *
 * Last Updated: 2025-12-02
 */

import React from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import { useAiTutor } from './AiTutorProvider'

export function AiTutorButton() {
  const { state, openChat } = useAiTutor()

  // Don't show button if chat is already open
  if (state.isOpen) return null

  const remaining = state.quota?.queriesRemaining ?? 5

  return (
    <button
      onClick={() => openChat()}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      aria-label="Open AI Chemistry Tutor"
    >
      <div className="relative">
        <MessageCircle className="h-5 w-5" />
        <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-yellow-300" />
      </div>
      <span className="hidden font-medium sm:inline">AI Tutor</span>
      {remaining > 0 && (
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
          {remaining}
        </span>
      )}
    </button>
  )
}
