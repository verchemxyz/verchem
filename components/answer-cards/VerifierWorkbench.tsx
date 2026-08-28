'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AnswerCard } from '@/lib/answer-cards/types'
import {
  verifyCardJwsInBrowser,
  type BrowserVerificationResult,
} from '@/lib/answer-cards/browser-verifier'
import {
  assessEngineReplay,
  isCurrentlyVerifiedArtifact,
  type EngineReplayAssessment,
  type LiveLabRecordState,
} from '@/lib/answer-cards/replay'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import AnswerCardView from './AnswerCardView'

const MAX_FILE_BYTES = 256 * 1024

interface VerificationState {
  result: BrowserVerificationResult
  replay: EngineReplayAssessment | null
  liveLabRecord: {
    state: LiveLabRecordState
    voidedAt: string | null
  } | null
}

function CheckRow({ label, state, detail, stateLabel }: { label: string; state: 'pass' | 'warn' | 'fail'; detail: string; stateLabel: string }) {
  const colors = state === 'pass'
    ? 'border-success/30 bg-success/5 text-success-strong'
    : state === 'fail'
      ? 'border-destructive/30 bg-destructive/5 text-destructive-strong'
      : 'border-warning/30 bg-warning/5 text-warning-strong'
  return (
    <div className={`rounded-lg border p-4 ${colors}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="font-mono text-xs uppercase">{stateLabel}</span>
      </div>
      <p className="mt-1 text-sm">{detail}</p>
    </div>
  )
}

export default function VerifierWorkbench() {
  const searchParams = useSearchParams()
  const t = useLabTranslations()
  const [jws, setJws] = useState('')
  const [verification, setVerification] = useState<VerificationState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const pending = sessionStorage.getItem('verchem.verify.jws')
    if (pending) {
      sessionStorage.removeItem('verchem.verify.jws')
      setJws(pending)
    }
  }, [])

  useEffect(() => {
    const pack = searchParams.get('pack')
    const token = searchParams.get('token')
    if (!pack || !token) return
    if (!/^[A-Za-z0-9-]{1,128}$/.test(pack) || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      setError(t.verifierMalformedEvidenceLink)
      return
    }
    let active = true
    const loadPack = async () => {
      setBusy(true)
      setError(null)
      setVerification(null)
      try {
        const response = await fetch(`/api/lab/records/${encodeURIComponent(pack)}/pack.json?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        const value = await response.json() as unknown
        const signature = typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>).signature
          : null
        if (!response.ok || typeof signature !== 'string') {
          const message = typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as Record<string, unknown>).error === 'string'
            ? (value as Record<string, unknown>).error as string
            : t.verifierEvidencePackLoadFailed
          throw new Error(message)
        }
        if (active) setJws(signature)
      } catch (loadError: unknown) {
        if (active) setError(loadError instanceof Error ? loadError.message : t.verifierEvidencePackLoadFailed)
      } finally {
        if (active) setBusy(false)
      }
    }
    void loadPack()
    return () => { active = false }
  }, [searchParams, t.verifierEvidencePackLoadFailed, t.verifierMalformedEvidenceLink])

  const loadLiveLabRecord = async (recordId: string): Promise<VerificationState['liveLabRecord']> => {
    try {
      const response = await fetch(`/api/lab/records/${encodeURIComponent(recordId)}/status`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) return { state: 'unavailable', voidedAt: null }
      const value = await response.json() as unknown
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { state: 'unavailable', voidedAt: null }
      }
      const status = value as Record<string, unknown>
      if (status.state !== 'released' && status.state !== 'voided') {
        return { state: 'unavailable', voidedAt: null }
      }
      return {
        state: status.state,
        voidedAt: typeof status.voided_at === 'string' ? status.voided_at : null,
      }
    } catch {
      return { state: 'unavailable', voidedAt: null }
    }
  }

  const verify = async () => {
    setBusy(true)
    setError(null)
    setVerification(null)
    try {
      const response = await fetch('/.well-known/verchem-keys.json', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(t.verifierPublicKeysLoadFailed)
      const jwks = await response.json() as unknown
      // PDF viewers insert visual line breaks when selectable JWS text wraps.
      // Compact-JWS segments cannot contain whitespace, so removing it is
      // unambiguous and lets an auditor paste directly from the certificate.
      const compactJws = jws.replace(/\s/gu, '')
      const result = await verifyCardJwsInBrowser(compactJws, jwks)
      const replay = result.payload ? assessEngineReplay(result.payload.tool_calls) : null
      const liveLabRecord = result.payload?.lab_record
        ? await loadLiveLabRecord(result.payload.lab_record.record_id)
        : null
      setVerification({ result, replay, liveLabRecord })
    } catch (verifyError: unknown) {
      setError(verifyError instanceof Error ? verifyError.message : t.verifierUnexpectedFailure)
    } finally {
      setBusy(false)
    }
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (file.size > MAX_FILE_BYTES) {
      setError(t.verifierFileTooLarge)
      return
    }
    setJws((await file.text()).trim())
    setVerification(null)
  }

  const card = useMemo<AnswerCard | null>(() => {
    const payload = verification?.result.payload
    if (!payload) return null
    return {
      ...payload,
      verified: isCurrentlyVerifiedArtifact(
        payload.status,
        verification.result.signatureAuthentic,
        verification.replay ?? assessEngineReplay([]),
        verification.result.artifactHashMatches,
        verification.result.releaseManifest,
        payload.lab_record ? verification.liveLabRecord?.state ?? 'unavailable' : null
      ),
      signature: jws.replace(/\s/gu, ''),
    }
  }, [jws, verification])

  const current = card?.verified === true
  const voided = verification?.result.payload?.lab_record !== undefined && verification.liveLabRecord?.state === 'voided'
  const stateLabel = (state: 'pass' | 'warn' | 'fail') => state === 'pass'
    ? t.verifierStatePass
    : state === 'warn'
      ? t.verifierStateWarn
      : t.verifierStateFail

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <label htmlFor="compact-jws" className="block text-sm font-semibold text-foreground">
          {t.verifierCompactJwsArtifact}
        </label>
        <textarea
          id="compact-jws"
          value={jws}
          onChange={(event) => {
            setJws(event.target.value)
            setVerification(null)
          }}
          rows={8}
          spellCheck={false}
          placeholder="eyJhbGciOiJFZERTQSIsImtpZCI6Ii4uLiIsInR5cCI6InZlcmNoZW0tY2FyZCtqd3MifQ.ey..."
          className="mt-2 w-full rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={verify}
            disabled={busy || jws.trim().length === 0}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-500 px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t.verifierVerifying : t.verifierVerifyButton}
          </button>
          <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            {t.verifierLoadJws}
            <input
              type="file"
              accept=".jws,application/jose,text/plain"
              className="sr-only"
              onChange={(event) => loadFile(event.target.files?.[0])}
            />
          </label>
          <a
            href="/.well-known/verchem-keys.json"
            className="text-sm text-primary-600 underline-offset-2 hover:underline"
          >
            {t.verifierInspectJwks}
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t.verifierLocalChecksHelp}
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive-strong">{error}</p>}
      </section>

      {verification && (
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className={`rounded-xl border p-5 ${current ? 'border-success/30 bg-success/10' : voided ? 'border-destructive/30 bg-destructive/10' : 'border-warning/30 bg-warning/10'}`}>
            <div className={`text-lg font-bold ${current ? 'text-success-strong' : voided ? 'text-destructive-strong' : 'text-warning-strong'}`}>
              {current ? t.verifierCurrentHeadline : voided ? t.verifierVoidedHeadline : t.verifierNotCurrentHeadline}
            </div>
            <p className="mt-1 text-sm text-foreground">
              {current
                ? t.verifierCurrentDetail
                : voided
                  ? t.verifierVoidedDetail
                  : verification.result.error ?? t.verifierReviewDetail}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CheckRow
              label={t.verifierSignatureAuthenticity}
              state={verification.result.signatureAuthentic ? 'pass' : 'fail'}
              detail={verification.result.signatureAuthentic
                ? `${t.verifierSignaturePass} ${verification.result.keyStatus ?? ''} ${verification.result.kid ?? ''}.`
                : verification.result.error ?? t.verifierSignatureFail}
              stateLabel={stateLabel(verification.result.signatureAuthentic ? 'pass' : 'fail')}
            />
            <CheckRow
              label={t.verifierProvenanceIntegrity}
              state={verification.result.artifactHashMatches === true ? 'pass' : verification.result.artifactHashMatches === false ? 'fail' : 'warn'}
              detail={verification.result.artifactHashMatches === true
                ? t.verifierProvenancePass
                : verification.result.artifactHashMatches === false
                  ? t.verifierProvenanceFail
                  : t.verifierProvenanceHistorical}
              stateLabel={stateLabel(verification.result.artifactHashMatches === true ? 'pass' : verification.result.artifactHashMatches === false ? 'fail' : 'warn')}
            />
            <CheckRow
              label={t.verifierReleaseManifest}
              state={verification.result.releaseManifest === 'matched_current'
                ? 'pass'
                : verification.result.releaseManifest === 'matched_superseded'
                  ? 'warn'
                : verification.result.releaseManifest === 'mismatch'
                  ? 'fail'
                  : 'warn'}
              detail={verification.result.releaseManifest === 'matched_current'
                ? t.verifierManifestCurrent
                : verification.result.releaseManifest === 'matched_superseded'
                  ? t.verifierManifestSuperseded
                : verification.result.releaseManifest === 'mismatch'
                  ? t.verifierManifestMismatch
                  : verification.result.releaseManifest === 'unavailable'
                    ? t.verifierManifestUnavailable
                    : t.verifierManifestHistorical}
              stateLabel={stateLabel(verification.result.releaseManifest === 'matched_current'
                ? 'pass'
                : verification.result.releaseManifest === 'mismatch'
                  ? 'fail'
                  : 'warn')}
            />
            <CheckRow
              label={t.verifierCurrentEngineReplay}
              state={verification.replay?.status === 'current' && verification.replay.currentEngineAgrees ? 'pass' : verification.replay?.status === 'corrected' ? 'fail' : 'warn'}
              detail={verification.replay
                ? `${verification.replay.status}: ${verification.replay.checks.map((check) => check.reason).join(' ')}`
                : t.verifierReplayNotAttempted}
              stateLabel={stateLabel(verification.replay?.status === 'current' && verification.replay.currentEngineAgrees ? 'pass' : verification.replay?.status === 'corrected' ? 'fail' : 'warn')}
            />
            <CheckRow
              label={t.verifierApplicability}
              state={verification.result.payload?.provenance?.applicability.length ? 'pass' : 'warn'}
              detail={verification.result.payload?.provenance?.applicability.join(' ') ??
                t.verifierNoApplicability}
              stateLabel={stateLabel(verification.result.payload?.provenance?.applicability.length ? 'pass' : 'warn')}
            />
            {verification.result.payload?.lab_record && (
              <CheckRow
                label={t.verifierLiveStatus}
                state={verification.liveLabRecord?.state === 'released' ? 'pass' : verification.liveLabRecord?.state === 'voided' ? 'fail' : 'warn'}
                detail={verification.liveLabRecord?.state === 'released'
                  ? t.verifierLiveReleased
                  : verification.liveLabRecord?.state === 'voided'
                    ? t.verifierLiveVoided
                    : t.verifierLiveUnavailable}
                stateLabel={stateLabel(verification.liveLabRecord?.state === 'released' ? 'pass' : verification.liveLabRecord?.state === 'voided' ? 'fail' : 'warn')}
              />
            )}
          </div>

          {card && verification.replay && (
            <div className="border-t border-border pt-5">
              <AnswerCardView
                card={card}
                signatureValid={verification.result.signatureAuthentic && verification.result.artifactHashMatches !== false}
                engineReplay={verification.replay}
              />
            </div>
          )}

          {verification.result.payload && (
            <details className="rounded-lg border border-border bg-muted p-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground">{t.verifierDecodedPayload}</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                {JSON.stringify(verification.result.payload, null, 2)}
              </pre>
            </details>
          )}
        </section>
      )}
    </div>
  )
}
