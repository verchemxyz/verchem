'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AnswerCard } from '@/lib/answer-cards/types'
import {
  verifyCardJwsInBrowser,
  type BrowserVerificationResult,
} from '@/lib/answer-cards/browser-verifier'
import {
  assessEngineReplay,
  isCurrentlyVerifiedAnswer,
  type EngineReplayAssessment,
} from '@/lib/answer-cards/replay'
import AnswerCardView from './AnswerCardView'

const MAX_FILE_BYTES = 256 * 1024

interface VerificationState {
  result: BrowserVerificationResult
  replay: EngineReplayAssessment | null
}

function CheckRow({ label, state, detail }: { label: string; state: 'pass' | 'warn' | 'fail'; detail: string }) {
  const colors = state === 'pass'
    ? 'border-success/30 bg-success/5 text-success-strong'
    : state === 'fail'
      ? 'border-destructive/30 bg-destructive/5 text-destructive-strong'
      : 'border-warning/30 bg-warning/5 text-warning-strong'
  return (
    <div className={`rounded-lg border p-4 ${colors}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="font-mono text-xs uppercase">{state}</span>
      </div>
      <p className="mt-1 text-sm">{detail}</p>
    </div>
  )
}

export default function VerifierWorkbench() {
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

  const verify = async () => {
    setBusy(true)
    setError(null)
    setVerification(null)
    try {
      const response = await fetch('/.well-known/verchem-keys.json', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Could not load VerChem’s published public keys.')
      const jwks = await response.json() as unknown
      const result = await verifyCardJwsInBrowser(jws, jwks)
      const replay = result.payload ? assessEngineReplay(result.payload.tool_calls) : null
      setVerification({ result, replay })
    } catch (verifyError: unknown) {
      setError(verifyError instanceof Error ? verifyError.message : 'Verification failed unexpectedly.')
    } finally {
      setBusy(false)
    }
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    if (file.size > MAX_FILE_BYTES) {
      setError('The selected artifact exceeds the 256 KiB verifier limit.')
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
      verified: isCurrentlyVerifiedAnswer(
        payload.status,
        verification.result.signatureAuthentic,
        verification.replay ?? assessEngineReplay([])
      ) && verification.result.artifactHashMatches !== false,
      signature: jws.trim(),
    }
  }, [jws, verification])

  const current = card?.verified === true

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <label htmlFor="compact-jws" className="block text-sm font-semibold text-foreground">
          Compact JWS artifact
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
            {busy ? 'Verifying in this browser…' : 'Verify in this browser'}
          </button>
          <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Load .jws file
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
            Inspect published JWKS
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Signature and provenance checks run locally with Web Crypto. The artifact is not uploaded. Current-engine replay runs from the calculation code bundled with this page.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive-strong">{error}</p>}
      </section>

      {verification && (
        <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className={`rounded-xl border p-5 ${current ? 'border-success/30 bg-success/10' : 'border-warning/30 bg-warning/10'}`}>
            <div className={`text-lg font-bold ${current ? 'text-success-strong' : 'text-warning-strong'}`}>
              {current ? 'CURRENT VERIFIED ARTIFACT' : 'NOT CURRENTLY VERIFIED'}
            </div>
            <p className="mt-1 text-sm text-foreground">
              {current
                ? 'The signature is authentic, provenance is internally consistent, and the current deterministic engine reproduces the signed result.'
                : verification.result.error ?? 'Review the independent checks below before relying on this artifact.'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <CheckRow
              label="Signature authenticity"
              state={verification.result.signatureAuthentic ? 'pass' : 'fail'}
              detail={verification.result.signatureAuthentic
                ? `Ed25519 signature matches published ${verification.result.keyStatus ?? 'known'} key ${verification.result.kid ?? ''}.`
                : verification.result.error ?? 'Signature verification failed.'}
            />
            <CheckRow
              label="Provenance integrity"
              state={verification.result.artifactHashMatches === true ? 'pass' : verification.result.artifactHashMatches === false ? 'fail' : 'warn'}
              detail={verification.result.artifactHashMatches === true
                ? 'The SHA-256 artifact hash matches the signed deterministic tool calls.'
                : verification.result.artifactHashMatches === false
                  ? 'The provenance hash does not match the signed tool calls.'
                  : 'This historical artifact predates the provenance envelope.'}
            />
            <CheckRow
              label="Release manifest"
              state={verification.result.releaseManifest === 'matched_current'
                ? 'pass'
                : verification.result.releaseManifest === 'matched_superseded'
                  ? 'warn'
                : verification.result.releaseManifest === 'mismatch'
                  ? 'fail'
                  : 'warn'}
              detail={verification.result.releaseManifest === 'matched_current'
                ? 'Engine and data content hashes at issue time match the published release manifest.'
                : verification.result.releaseManifest === 'matched_superseded'
                  ? 'Issued under an earlier published release (engine/data content verified); a newer release is now current.'
                : verification.result.releaseManifest === 'mismatch'
                  ? 'The signed card does not match a valid, published release manifest.'
                  : verification.result.releaseManifest === 'unavailable'
                    ? 'The published release manifest could not be fetched. This does not change signature authenticity.'
                    : 'This historical artifact predates release-manifest provenance.'}
            />
            <CheckRow
              label="Current engine replay"
              state={verification.replay?.status === 'current' && verification.replay.currentEngineAgrees ? 'pass' : verification.replay?.status === 'corrected' ? 'fail' : 'warn'}
              detail={verification.replay
                ? `${verification.replay.status}: ${verification.replay.checks.map((check) => check.reason).join(' ')}`
                : 'Replay was not attempted because no valid supported payload was decoded.'}
            />
            <CheckRow
              label="Applicability declaration"
              state={verification.result.payload?.provenance?.applicability.length ? 'pass' : 'warn'}
              detail={verification.result.payload?.provenance?.applicability.join(' ') ??
                'No machine-readable applicability declaration is present. Scientific applicability requires human review.'}
            />
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
              <summary className="cursor-pointer text-sm font-medium text-foreground">Decoded signed payload</summary>
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
