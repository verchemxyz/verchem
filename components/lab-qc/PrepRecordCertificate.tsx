'use client'

import { forwardRef, useEffect, useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import type { LabActor, PrepRecord, PrepTemplate } from '@/lib/lab/types'
import { formatLabDate, formatLabNumber } from '@/lib/lab/client'
import { StatusChip } from './StatusChip'
import { UncertaintyBudgetTable } from './UncertaintyBudgetTable'
import { VerificationLevelBadge } from './VerificationLevelBadge'
import type { SignedLabPackData } from './signed-pack'
import { useLabTranslations } from './use-lab-translations'

function DeclaredValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-mono text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

function Person({
  label,
  actor,
}: {
  label: string
  actor: LabActor
}) {
  return (
    <div className="min-w-0 border-t-2 border-[var(--lab-accent)] pt-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-3 font-semibold text-foreground">{actor.display_name}</div>
      <div className="mt-2"><VerificationLevelBadge level={actor.verification_level} /></div>
      <div className="mt-3 font-mono text-xs tabular-nums text-muted-foreground">{formatLabDate(actor.at)}</div>
    </div>
  )
}

export const PrepRecordCertificate = forwardRef<HTMLDivElement, {
  record: Pick<PrepRecord, 'record_no' | 'state' | 'outcome' | 'voided_at' | 'void_reason'>
  template: PrepTemplate
  pack: SignedLabPackData
  verifyUrl: string | null
  compactJws: string
}>(({ record, template, pack, verifyUrl, compactJws }, ref) => {
  const t = useLabTranslations()
  const [qr, setQr] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const envelope = pack.payload.lab_record

  useEffect(() => {
    let active = true
    if (!verifyUrl) {
      return () => { active = false }
    }
    void QRCode.toDataURL(verifyUrl, { width: 160, margin: 1, errorCorrectionLevel: 'M' })
      .then((value) => { if (active) setQr(value) })
      .catch(() => { if (active) setQr(null) })
    return () => { active = false }
  }, [verifyUrl])

  const measuredAmount = pack.actual.weighedG === null
    ? (pack.actual.measuredMl === null ? '—' : `${formatLabNumber(pack.actual.measuredMl)} mL`)
    : `${formatLabNumber(pack.actual.weighedG)} g`
  const result = pack.result
  const coaBasis = pack.actual.coaBasis === 'mass' ? t.basisMass : t.basisVolume

  if (!envelope) return null
  const shortHash = envelope.events_hash.slice(7, 23)
  const accreditationRef = envelope.org.accreditation_ref ?? null

  const copyJws = async () => {
    try {
      await navigator.clipboard.writeText(compactJws)
      setCopyStatus(t.jwsCopied)
    } catch {
      setCopyStatus(t.copyJwsFailed)
    }
  }

  return (
    <article ref={ref} className="lab-document mx-auto max-w-[794px] p-5 text-foreground sm:p-8" aria-label={`${t.evidenceRecord} ${record.record_no}`}>
      <header className="border-b-2 border-[var(--lab-accent)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{envelope.org.name}</p>
            <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{accreditationRef ? `${accreditationRef} · ` : ''}{template.key} · v{envelope.template.version}</p>
          </div>
          <div className="text-right">
            <StatusChip state={record.state} outcome={record.outcome} />
            <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">{record.record_no}</p>
          </div>
        </div>
        <h1 className="lab-display mt-6 text-3xl font-semibold leading-tight sm:text-4xl">{template.spec.name}</h1>
        {record.state === 'voided' && (
          <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-strong">
            {t.voided}: {record.void_reason ?? t.noReasonRecorded}
          </p>
        )}
      </header>

      <div className="grid gap-8 py-7 md:grid-cols-[0.9fr_1.1fr]">
        <section>
          <h2 className="lab-display text-xl font-semibold">{t.declaredBenchInputs}</h2>
          <dl className="mt-3">
            <DeclaredValue label={t.reagentLot} value={pack.actual.reagentLot ?? '—'} />
            <DeclaredValue label={t.coaAssay} value={pack.actual.coaAssayPercent === null ? '—' : `${formatLabNumber(pack.actual.coaAssayPercent)}% ${coaBasis}`.trim()} />
            <DeclaredValue label={t.expiry} value={pack.actual.expiry ?? '—'} />
            <DeclaredValue label={t.actualAmount} value={measuredAmount} />
            <DeclaredValue label={t.finalVolume} value={pack.actual.finalVolumeMl === null ? '—' : `${formatLabNumber(pack.actual.finalVolumeMl)} mL`} />
            <DeclaredValue label={t.balanceId} value={pack.actual.balanceId ?? '—'} />
            <DeclaredValue label={t.flaskId} value={pack.actual.flaskId ?? '—'} />
            <DeclaredValue label={t.temperature} value={pack.actual.temperatureC === null ? '—' : `${formatLabNumber(pack.actual.temperatureC)} °C`} />
          </dl>
        </section>

        <section>
          <h2 className="lab-display text-xl font-semibold">{t.asPreparedResult}</h2>
          <div className="mt-3 border-l-2 border-[var(--lab-accent)] bg-muted p-4">
            <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {formatLabNumber(result.asPrepared.value)} {result.asPrepared.unit}
            </div>
            <div className={result.withinAcceptance ? 'mt-3 text-sm text-[var(--lab-accent)]' : 'mt-3 text-sm text-warning-strong'}>
              {t.deviation} {result.deviationPercent >= 0 ? '+' : ''}{formatLabNumber(result.deviationPercent, 4)}% · {result.withinAcceptance ? t.withinAcceptance : t.outsideAcceptance}
            </div>
            <div className="mt-3 font-mono text-sm tabular-nums text-muted-foreground">
              U (k=2): {result.uncertainty.expandedK2 === null ? t.unavailable : `±${formatLabNumber(result.uncertainty.expandedK2)} ${result.uncertainty.unit}`}
            </div>
          </div>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.uncertaintyBudget}</h3>
          <div className="mt-3"><UncertaintyBudgetTable result={result} /></div>
        </section>
      </div>

      <section className="grid gap-6 border-t border-border py-6 sm:grid-cols-2">
        <Person label={t.prepared} actor={envelope.preparer} />
        <Person label={t.reviewedReleased} actor={envelope.reviewer} />
      </section>

      <section className="border-t border-border py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="lab-display text-xl font-semibold">{t.compactJwsTitle}</h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t.compactJwsHelp}</p>
          </div>
          <button
            type="button"
            data-pdf-exclude="true"
            onClick={() => { void copyJws() }}
            className="min-h-[44px] rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
          >
            {t.copyJws}
          </button>
        </div>
        {copyStatus && <p role="status" data-pdf-exclude="true" className="mt-2 text-xs text-muted-foreground">{copyStatus}</p>}
        <p data-pdf-jws-text="true" className="mt-4 select-text break-all border border-border bg-muted p-3 font-mono text-[8px] leading-relaxed text-foreground">
          {compactJws}
        </p>
      </section>

      <footer className="flex flex-col-reverse justify-between gap-5 border-t border-border pt-5 sm:flex-row sm:items-end">
        <div className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          <p>{t.legalSignature}</p>
          <p className="mt-3 font-mono tabular-nums">{t.eventHashPrefix}: {shortHash}</p>
        </div>
        <div className="shrink-0 text-right">
          {qr ? <Image src={qr} width={96} height={96} unoptimized alt={t.verificationQrCode} className="ml-auto border border-border bg-white p-1" /> : <div className="ml-auto flex h-24 w-24 items-center justify-center border border-dashed border-border p-2 text-center text-[10px] text-muted-foreground">{t.verifyLinkUnavailable}</div>}
          <p className="mt-2 font-mono text-[10px] tabular-nums text-muted-foreground">{record.record_no} · {shortHash}</p>
        </div>
      </footer>
    </article>
  )
})

PrepRecordCertificate.displayName = 'PrepRecordCertificate'
