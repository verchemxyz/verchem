'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CardStatus } from '@/lib/answer-cards/types'

interface CardSummary {
  id: string
  question: string
  status: CardStatus
  is_public: boolean
  created_at: string
}

const STATUS_STYLE: Record<CardStatus, { label: string; cls: string }> = {
  verified: { label: 'Verified', cls: 'border-green-500/30 bg-green-500/10 text-green-300' },
  partial: { label: 'Partial', cls: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
  unverified: { label: 'Unverified', cls: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
  error: { label: 'Error', cls: 'border-red-500/30 bg-red-500/10 text-red-300' },
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
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading your cards…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/account"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Account
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-2xl font-bold text-white">My Verified Cards</h1>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-gray-400 mb-4">You haven&apos;t saved any verified answers yet.</p>
            <Link
              href="/tools/verified-answer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/15 px-5 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-blue-500/25"
            >
              Ask a verified question
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {cards.map((c) => {
              const s = STATUS_STYLE[c.status]
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/account/cards/${c.id}`} className="min-w-0 flex-1 group">
                      <p className="truncate font-medium text-white group-hover:text-cyan-300 transition-colors">
                        {c.question}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                        {c.is_public ? (
                          <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-400">
                            Private
                          </span>
                        )}
                        <span className="text-slate-500">{formatDate(c.created_at)}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Delete card"
                      className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
