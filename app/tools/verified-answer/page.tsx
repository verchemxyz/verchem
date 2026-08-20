'use client'

import React, { useState, useCallback } from 'react'
import type { AnswerCard } from '@/lib/answer-cards/types'
import { CalcShell, Card } from '@/components/lab'
import AskBox from '@/components/answer-cards/AskBox'
import AnswerCardView from '@/components/answer-cards/AnswerCardView'
import SaveShareControls from '@/components/answer-cards/SaveShareControls'
import Link from 'next/link'

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
        setError('AI-assisted answers require sign-in. Signed deterministic calculations remain available without sign-in.')
        setIsLoading(false)
        return
      }

      if (response.status === 403) {
        setError('Invalid origin. Please refresh the page and try again.')
        setIsLoading(false)
        return
      }

      if (response.status === 503) {
        setError('The optional AI narrative service is unavailable. The deterministic signing workflow remains available.')
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
    <CalcShell
      eyebrow="AI Verified Answer Cards"
      title="Verified Answer"
      subtitle="Ask any chemistry question. Deterministic engines calculate the numbers; AI explains around them. Every numeric claim is traceable and signed."
      backHref="/tools"
      backLabel="All tools"
      maxWidth="4xl"
    >
      <Card className="border-primary-500/30 bg-primary-500/5 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-foreground">Need a signed calculation, not an AI explanation?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compute and sign directly with a deterministic engine—no AI or sign-in required.
            </p>
          </div>
          <Link
            href="/tools/verified-calculation"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-600"
          >
            Open signed calculation
          </Link>
        </div>
      </Card>

      {/* Ask Box */}
      <Card className="p-6 sm:p-8">
        <AskBox onSubmit={handleSubmit} isLoading={isLoading} error={error} />
      </Card>

      {/* Card Result */}
      {card && (
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Q: {card.question}
          </h2>
          <AnswerCardView card={card} />
          <SaveShareControls card={card} />
        </Card>
      )}
    </CalcShell>
  )
}
