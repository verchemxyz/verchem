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
        <label htmlFor="verified-question" className="block text-sm font-medium text-foreground mb-2">
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
          className="w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none disabled:opacity-50"
          aria-busy={isLoading}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Press Ctrl+Enter or Cmd+Enter to submit
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || question.trim().length === 0}
        className="rounded-xl bg-primary-500 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Verifying...
          </span>
        ) : (
          'Get Verified Answer'
        )}
      </button>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive-strong"
        >
          {error}
        </div>
      )}
    </form>
  )
}
