'use client'

import React, { useState, useCallback } from 'react'
import type { AnswerCard } from '@/lib/answer-cards/types'
import AskBox from '@/components/answer-cards/AskBox'
import AnswerCardView from '@/components/answer-cards/AnswerCardView'
import SaveShareControls from '@/components/answer-cards/SaveShareControls'

export default function VerifiedAnswerPage() {
  const [card, setCard] = useState<AnswerCard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (question: string) => {
    setIsLoading(true)
    setError(null)
    setCard(null)

    try {
      const response = await fetch('/api/answer-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (response.status === 401) {
        setError('Please log in to use the verified answer feature.')
        setIsLoading(false)
        return
      }

      if (response.status === 403) {
        setError('Invalid origin. Please refresh the page and try again.')
        setIsLoading(false)
        return
      }

      if (response.status === 503) {
        setError('AI verification service is temporarily unavailable.')
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      const data = (await response.json()) as AnswerCard
      setCard(data)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300 mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI Verified Answer Cards
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Verified Answer
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Ask any chemistry question. Deterministic engines calculate the numbers;
            AI explains around them. Every numeric claim is traceable and signed.
          </p>
        </div>
      </section>

      {/* Ask Box */}
      <section className="pb-12 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 to-blue-900/20 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
            <AskBox onSubmit={handleSubmit} isLoading={isLoading} error={error} />
          </div>
        </div>
      </section>

      {/* Card Result */}
      {card && (
        <section className="pb-20 px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6">
                Q: {card.question}
              </h2>
              <AnswerCardView card={card} />
              <SaveShareControls card={card} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
