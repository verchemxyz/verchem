'use client'

import React, { useState, useCallback } from 'react'

export interface AskBoxProps {
  onSubmit: (question: string) => void
  isLoading: boolean
  error: string | null
}

export default function AskBox({ onSubmit, isLoading, error }: AskBoxProps) {
  const [question, setQuestion] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = question.trim()
      if (trimmed.length === 0 || isLoading) return
      onSubmit(trimmed)
    },
    [question, isLoading, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="verified-question" className="block text-sm font-medium text-slate-300 mb-2">
          Ask a chemistry question
        </label>
        <textarea
          id="verified-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e)
            }
          }}
          placeholder="e.g., What is the pH of 0.1 M acetic acid (Ka = 1.8e-5)?"
          rows={3}
          disabled={isLoading}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none disabled:opacity-50"
          aria-busy={isLoading}
        />
        <p className="mt-1 text-xs text-slate-500">
          Press Ctrl+Enter or Cmd+Enter to submit
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || question.trim().length === 0}
        className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Verifying...
          </span>
        ) : (
          'Get Verified Answer'
        )}
      </button>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
        >
          {error}
        </div>
      )}
    </form>
  )
}
