'use client'

import React from 'react'
import type { AnswerCard, CardStatus } from '@/lib/answer-cards/types'

interface AnswerCardViewProps {
  card: AnswerCard
  /**
   * Result of server-side signature re-verification when the card was LOADED
   * from storage / a share link. Omit for a freshly generated card (delivered
   * over TLS in the same response — no re-verification needed).
   * `false` → the stored bytes no longer match the signature: show TAMPERED and
   * never present a VERIFIED badge.
   */
  signatureValid?: boolean
}

function truncateSignature(sig: string): string {
  if (sig.length <= 16) return sig
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`
}

function statusBadge(status: CardStatus): {
  label: string
  colorClass: string
  borderClass: string
  bgClass: string
  icon: React.ReactNode
  reason?: string
} {
  switch (status) {
    case 'verified':
      return {
        label: 'VERIFIED',
        colorClass: 'text-success-strong',
        borderClass: 'border-success/30',
        bgClass: 'bg-success/10',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      }
    case 'partial':
      return {
        label: 'PARTIALLY VERIFIED',
        colorClass: 'text-warning-strong',
        borderClass: 'border-warning/30',
        bgClass: 'bg-warning/10',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        reason: 'Some calculations failed or the response may be incomplete.',
      }
    case 'error':
      return {
        label: 'CALCULATION ERROR',
        colorClass: 'text-destructive-strong',
        borderClass: 'border-destructive/30',
        bgClass: 'bg-destructive/10',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        reason: 'All calculations failed. The explanation is conceptual only.',
      }
    case 'unverified':
    default:
      return {
        label: 'UNVERIFIED',
        colorClass: 'text-warning-strong',
        borderClass: 'border-warning/30',
        bgClass: 'bg-warning/10',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        reason: 'No calculation engine was used. This is a conceptual answer.',
      }
  }
}

export default function AnswerCardView({ card, signatureValid }: AnswerCardViewProps) {
  const badge = statusBadge(card.status)
  const tampered = signatureValid === false

  // Defense in depth: a tampered/corrupt loaded card could carry malformed
  // tool_calls/audit. The data layer already falls back to a safe empty card,
  // but guard here too so this component can never throw mid-render.
  const toolCalls = Array.isArray(card.tool_calls)
    ? card.tool_calls.filter((tc) => !!tc && typeof tc === 'object')
    : []
  const audit = card.audit ?? { clean: true, unmatched: [] }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* TAMPERED banner — overrides everything when the loaded signature fails */}
      {tampered && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-strong"
        >
          <div className="flex items-center gap-2 font-semibold text-destructive-strong">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Signature invalid — this card may have been altered
          </div>
          <p className="mt-1 text-destructive-strong">
            The stored contents no longer match the cryptographic signature. Do not trust the values
            below as VerChem-verified.
          </p>
        </div>
      )}

      {/* Header: Verification badge */}
      <div className="flex flex-wrap items-center gap-3">
        {tampered ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive-strong">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            SIGNATURE INVALID
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${badge.borderClass} ${badge.bgClass} ${badge.colorClass}`}>
            {badge.icon}
            {badge.label}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {card.model} · {card.version}
        </span>
      </div>

      {/* Downgrade reason (engine-driven only) */}
      {badge.reason && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-warning-strong">
          {badge.reason}
        </div>
      )}

      {/* Verified Engine Results — the authoritative answer */}
      {toolCalls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-success-strong uppercase tracking-wide flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified Engine Results
          </h3>
          {toolCalls.map((tc, idx) => (
            <div
              key={`${tc.name}-${idx}`}
              className={`rounded-xl border p-4 ${
                tc.result?.ok
                  ? 'border-success/20 bg-success/5'
                  : 'border-destructive/20 bg-destructive/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{tc.engine}</span>
                <span className="text-xs text-muted-foreground">{tc.name}</span>
              </div>

              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Inputs:</span>{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                    {JSON.stringify(tc.input)}
                  </code>
                </div>
                {tc.result?.ok ? (
                  <div>
                    <span className="text-muted-foreground">Result:</span>{' '}
                    <code className="rounded bg-success/10 px-1.5 py-0.5 text-success-strong">
                      {JSON.stringify(tc.result.value)}
                    </code>
                  </div>
                ) : (
                  <div className="text-destructive-strong">
                    <span className="text-muted-foreground">Error:</span> {tc.result?.error}
                  </div>
                )}
                {tc.citation && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Citation: {tc.citation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit informational warning (does NOT downgrade badge) */}
      {!audit.clean && audit.unmatched.length > 0 && (
        <div
          role="status"
          aria-label="Audit warning: unverified figures in explanation"
          className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-warning-strong"
        >
          <span className="font-medium">Audit notice:</span> The explanation references figure(s) not produced by the verified engines. The authoritative values are shown in the Verified Engine Results above.
        </div>
      )}

      {/* Explanation */}
      {card.explanation && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Explanation
          </h3>
          <div className="prose max-w-none text-foreground whitespace-pre-wrap">
            {card.explanation}
          </div>
          <p className="mt-4 text-xs text-muted-foreground italic">
            This explanation is AI-generated narrative. Only the values in the Verified Engine Results above are computed by deterministic, signed engines.
          </p>
        </div>
      )}

      {/* Signature */}
      {card.signature && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tamper-proof Signature
            </span>
            {signatureValid === true && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success-strong">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                verified on load
              </span>
            )}
          </div>
          <code className="text-xs text-muted-foreground break-all">{truncateSignature(card.signature)}</code>
        </div>
      )}

      {card.status === 'unverified' && toolCalls.length === 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm text-warning-strong">
          This answer is conceptual and was not verified by a deterministic calculation engine.
          Numerical claims should be independently checked.
        </div>
      )}
    </div>
  )
}
