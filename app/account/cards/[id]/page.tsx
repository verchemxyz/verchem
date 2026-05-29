'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { AnswerCard } from '@/lib/answer-cards/types'
import AnswerCardView from '@/components/answer-cards/AnswerCardView'

interface LoadedCard {
  id: string
  card: AnswerCard
  is_public: boolean
  created_at: string
  signatureValid: boolean
}

export default function CardDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [loaded, setLoaded] = useState<LoadedCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const res = await fetch(`/api/answer-cards/${id}`)
        if (res.status === 404) {
          setError('Card not found.')
          return
        }
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          setError(payload.error || 'Failed to load card')
          return
        }
        setLoaded((await res.json()) as LoadedCard)
      } catch {
        setError('Failed to connect to server')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  const shareUrl =
    loaded && typeof window !== 'undefined' ? `${window.location.origin}/verified/${loaded.id}` : ''

  const toggleVisibility = useCallback(
    async (next: boolean) => {
      if (!loaded) return
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`/api/answer-cards/${loaded.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_public: next }),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          setError(payload.error || 'Could not update sharing')
          return
        }
        setLoaded((prev) => (prev ? { ...prev, is_public: next } : prev))
      } catch {
        setError('Network error while updating sharing')
      } finally {
        setBusy(false)
      }
    },
    [loaded]
  )

  const handleDelete = useCallback(async () => {
    if (!loaded || !confirm('Delete this verified card? This cannot be undone.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/answer-cards/${loaded.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        alert(payload.error || 'Failed to delete card')
        return
      }
      router.push('/account/cards')
    } catch {
      alert('Failed to delete card')
    } finally {
      setBusy(false)
    }
  }, [loaded, router])

  const copyLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — select the link manually.')
    }
  }, [shareUrl])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-300 mb-4">{error || 'Card not found.'}</p>
          <Link href="/account/cards" className="text-cyan-300 hover:underline">
            Back to my cards
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/account/cards"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          My Verified Cards
        </Link>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="text-xl md:text-2xl font-semibold text-white mb-6">Q: {loaded.card.question}</h1>
          <AnswerCardView card={loaded.card} signatureValid={loaded.signatureValid} />
        </div>

        {/* Manage */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={loaded.is_public}
              disabled={busy}
              onChange={(e) => toggleVisibility(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10"
            />
            Public — anyone with the link can view this card
          </label>

          {loaded.is_public && shareUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded-lg bg-black/30 px-3 py-2 text-xs text-slate-300">
                {shareUrl}
              </code>
              <button
                onClick={copyLink}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <Link
                href={`/verified/${loaded.id}`}
                target="_blank"
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20"
              >
                Open public page
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete card
            </button>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  )
}
