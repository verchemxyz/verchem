'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CardStatus } from '@/lib/answer-cards/types'
import { CalcShell, Card, ErrorBanner } from '@/components/lab'

interface CardSummary {
  id: string
  question: string
  status: CardStatus
  is_public: boolean
  created_at: string
  signatureValid: boolean
}

const STATUS_STYLE: Record<CardStatus, { label: string; cls: string }> = {
  verified: { label: 'Verified', cls: 'border-success/40 bg-success/10 text-success' },
  partial: { label: 'Partial', cls: 'border-warning/40 bg-warning/10 text-warning' },
  unverified: { label: 'Unverified', cls: 'border-warning/40 bg-warning/10 text-warning' },
  error: { label: 'Error', cls: 'border-destructive/40 bg-destructive/10 text-destructive' },
}

export default function CardsPage() {
  const router = useRouter()
  const [cards, setCards] = useState<CardSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const sessionRes = await fetch('/api/session')
        if (sessionRes.status === 401) {
          router.push('/')
          return
        }
        const res = await fetch('/api/answer-cards')
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          setError(payload.error || 'Failed to load your cards')
          return
        }
        setCards((await res.json()) as CardSummary[])
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to connect to server')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this verified card? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/answer-cards/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        alert(payload.error || 'Failed to delete card')
        return
      }
      setCards((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete card')
    } finally {
      setDeletingId(null)
    }
  }, [])

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-primary-500 rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your cards…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <ErrorBanner>{error}</ErrorBanner>
          <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-500 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CalcShell
      eyebrow="Account · Verified cards"
      title="My Verified Cards"
      subtitle="Signed answer cards you have saved. Each carries an HMAC signature that is re-verified on load."
      backHref="/account"
      backLabel="Account"
      maxWidth="4xl"
    >
      {cards.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">You haven&apos;t saved any verified answers yet.</p>
          <Link
            href="/tools/verified-answer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
          >
            Ask a verified question
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => {
            const s = STATUS_STYLE[c.status]
            return (
              <Card key={c.id} className="p-4 transition-colors hover:border-primary-500">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/account/cards/${c.id}`} className="min-w-0 flex-1 group">
                    <p className="truncate font-medium text-foreground group-hover:text-primary-600 transition-colors">
                      {c.question}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {c.signatureValid ? (
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
                          Tampered
                        </span>
                      )}
                      {c.is_public ? (
                        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-foreground">
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-muted-foreground">
                          Private
                        </span>
                      )}
                      <span className="text-muted-foreground">{formatDate(c.created_at)}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    aria-label="Delete card"
                    className="shrink-0 rounded-md border border-destructive/30 p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            )
          })}
        </ul>
      )}
    </CalcShell>
  )
}
