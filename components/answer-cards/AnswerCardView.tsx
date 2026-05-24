'use client'

import React from 'react'
import type { AnswerCard, CardStatus } from '@/lib/answer-cards/types'

interface AnswerCardViewProps {
  card: AnswerCard
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
        colorClass: 'text-green-400',
        borderClass: 'border-green-500/30',
        bgClass: 'bg-green-500/10',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
      }
    case 'partial':
      return {
        label: 'PARTIALLY VERIFIED',
        colorClass: 'text-orange-300',
        borderClass: 'border-orange-500/30',
        bgClass: 'bg-orange-500/10',
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
        colorClass: 'text-red-300',
        borderClass: 'border-red-500/30',
        bgClass: 'bg-red-500/10',
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
        colorClass: 'text-yellow-300',
        borderClass: 'border-yellow-500/30',
        bgClass: 'bg-yellow-500/10',
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        reason: 'No calculation engine was used. This is a conceptual answer.',
      }
  }
}

export default function AnswerCardView({ card }: AnswerCardViewProps) {
  const badge = statusBadge(card.status)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header: Verification badge */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${badge.borderClass} ${badge.bgClass} ${badge.colorClass}`}>
          {badge.icon}
          {badge.label}
        </span>
        <span className="text-xs text-slate-500">
          {card.model} · {card.version}
        </span>
      </div>

      {/* Downgrade reason (engine-driven only) */}
      {badge.reason && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-sm text-orange-200">
          {badge.reason}
        </div>
      )}

      {/* Verified Engine Results — the authoritative answer */}
      {card.tool_calls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wide flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified Engine Results
          </h3>
          {card.tool_calls.map((tc, idx) => (
            <div
              key={`${tc.name}-${idx}`}
              className={`rounded-xl border p-4 ${
                tc.result.ok
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{tc.engine}</span>
                <span className="text-xs text-slate-500">{tc.name}</span>
              </div>

              <div className="grid gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Inputs:</span>{' '}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">
                    {JSON.stringify(tc.input)}
                  </code>
                </div>
                {tc.result.ok ? (
                  <div>
                    <span className="text-slate-500">Result:</span>{' '}
                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-green-300">
                      {JSON.stringify(tc.result.value)}
                    </code>
                  </div>
                ) : (
                  <div className="text-red-300">
                    <span className="text-slate-500">Error:</span> {tc.result.error}
                  </div>
                )}
                {tc.citation && (
                  <div className="text-xs text-slate-500 mt-1">
                    Citation: {tc.citation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit informational warning (does NOT downgrade badge) */}
      {!card.audit.clean && card.audit.unmatched.length > 0 && (
        <div
          role="status"
          aria-label="Audit warning: unverified figures in explanation"
          className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-yellow-200"
        >
          <span className="font-medium">⚠ Audit notice:</span> The explanation references figure(s) not produced by the verified engines. The authoritative values are shown in the Verified Engine Results above.
        </div>
      )}

      {/* Explanation */}
      {card.explanation && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Explanation
          </h3>
          <div className="prose prose-invert max-w-none text-slate-200 whitespace-pre-wrap">
            {card.explanation}
          </div>
          <p className="mt-4 text-xs text-slate-500 italic">
            This explanation is AI-generated narrative. Only the values in the Verified Engine Results above are computed by deterministic, signed engines.
          </p>
        </div>
      )}

      {/* Signature */}
      {card.signature && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Tamper-proof Signature
            </span>
          </div>
          <code className="text-xs text-slate-400 break-all">{truncateSignature(card.signature)}</code>
        </div>
      )}

      {card.status === 'unverified' && card.tool_calls.length === 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-200">
          This answer is conceptual and was not verified by a deterministic calculation engine.
          Numerical claims should be independently checked.
        </div>
      )}
    </div>
  )
}
