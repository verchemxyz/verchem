'use client'

/**
 * Save + Share controls for a freshly generated AnswerCard.
 *
 * Save → POST /api/answer-cards (server re-verifies the signature before storing).
 * Then the user can make it public and copy a /verified/[id] share link.
 * Login-gated: a 401 prompts the user to sign in.
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { AnswerCard } from '@/lib/answer-cards/types'

interface SaveShareControlsProps {
  card: AnswerCard
}

export default function SaveShareControls({ card }: SaveShareControlsProps) {
  const [savedId, setSavedId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needLogin, setNeedLogin] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    savedId && typeof window !== 'undefined' ? `${window.location.origin}/verified/${savedId}` : ''

  const save = useCallback(async () => {
    setBusy(true)
    setError(null)
    setNeedLogin(false)
    try {
      const res = await fetch('/api/answer-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card, is_public: false }),
      })
      if (res.status === 401) {
        setNeedLogin(true)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Could not save this card.')
        return
      }
      const data = (await res.json()) as { id: string }
      setSavedId(data.id)
    } catch {
      setError('Network error while saving.')
    } finally {
      setBusy(false)
    }
  }, [card])

  const toggleVisibility = useCallback(
    async (next: boolean) => {
      if (!savedId) return
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`/api/answer-cards/${savedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_public: next }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Could not update sharing.')
          return
        }
        setIsPublic(next)
      } catch {
        setError('Network error while updating sharing.')
      } finally {
        setBusy(false)
      }
    },
    [savedId]
  )

  const copyLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy. Select and copy the link manually.')
    }
  }, [shareUrl])

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      {!savedId ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Save this verified card to your library.</span>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h8.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v4h6V3M9 21v-6h6v6" />
            </svg>
            {busy ? 'Saving…' : 'Save to my cards'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
            <Link href="/account/cards" className="text-sm text-primary-600 underline-offset-2 hover:underline">
              View my cards
            </Link>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={busy}
              onChange={(e) => toggleVisibility(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-input"
            />
            Make this card public (anyone with the link can view it)
          </label>

          {isPublic && shareUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 truncate rounded-lg bg-muted px-3 py-2 text-xs text-foreground">
                {shareUrl}
              </code>
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}
        </div>
      )}

      {needLogin && (
        <p className="mt-3 text-sm text-warning-strong">
          Please{' '}
          <Link href="/" className="underline">
            log in
          </Link>{' '}
          to save and share verified cards.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  )
}
