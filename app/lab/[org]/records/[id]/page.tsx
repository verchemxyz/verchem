'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  PrepRecordCertificate,
  RequiredFieldsForm,
  StatusChip,
  UncertaintyBudgetTable,
  createInitialMeasurements,
  type EditableMeasurements,
} from '@/components/lab-qc'
import { parseSignedLabPack } from '@/components/lab-qc/signed-pack'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import {
  LabApiError,
  formatLabDate,
  formatLabNumber,
  labFetch,
  type LabOrganization,
  type LabRecordDetail,
} from '@/lib/lab/client'
import type { PrepRecord } from '@/lib/lab/types'

function PreviewPanel({ preview, previewError }: { preview: LabRecordDetail['preview']; previewError: string | null }) {
  const t = useLabTranslations()
  if (!preview) return <div className="lab-document p-5 text-sm text-muted-foreground">{previewError ?? t.recordBenchMeasurements}</div>
  return <div className="space-y-5"><div className="lab-document border-l-2 border-l-[var(--warning)] p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.asPrepared}</p><p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">{formatLabNumber(preview.asPrepared.value)} {preview.asPrepared.unit}</p><p className="mt-3 text-sm text-warning-strong">{t.deviation}: {preview.deviationPercent >= 0 ? '+' : ''}{formatLabNumber(preview.deviationPercent, 4)}% · {preview.withinAcceptance ? t.withinAcceptance : t.outsideAcceptance}</p><p className="mt-3 font-mono text-sm tabular-nums text-muted-foreground">U (k=2): {preview.uncertainty.expandedK2 === null ? t.unavailable : `±${formatLabNumber(preview.uncertainty.expandedK2)} ${preview.uncertainty.unit}`}</p></div><section><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.uncertaintyBudget}</h3><UncertaintyBudgetTable result={preview} /></section></div>
}

function ActionReason({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block text-sm font-medium text-foreground">{label}{required ? <span className="ml-1 text-destructive-strong">*</span> : null}<textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="mt-1.5 w-full rounded-md border border-input-border bg-input px-3 py-2 text-foreground focus:ring-2 focus:ring-ring" /></label>
}

export default function RecordDetailPage() {
  const { org, id } = useParams<{ org: string; id: string }>()
  const router = useRouter()
  const t = useLabTranslations()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [detail, setDetail] = useState<LabRecordDetail | null>(null)
  const [organization, setOrganization] = useState<LabOrganization | null>(null)
  const [measurements, setMeasurements] = useState<EditableMeasurements | null>(null)
  const [preview, setPreview] = useState<LabRecordDetail['preview']>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editStarted, setEditStarted] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [releaseReason, setReleaseReason] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  const load = useCallback(async () => {
    const response = await labFetch<LabRecordDetail>(`/api/lab/orgs/${encodeURIComponent(org)}/records/${encodeURIComponent(id)}`, { fallbackMessage: t.unknownError })
    setDetail(response)
    setPreview(response.preview)
    setPreviewError(response.preview_error)
    setMeasurements(response.record.draft?.measurements ?? createInitialMeasurements(response.template))
  }, [id, org, t.unknownError])

  useEffect(() => {
    let active = true
    void Promise.all([load(), labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError })])
      .then(([, orgResponse]) => { if (active) setOrganization(orgResponse.organizations.find((item) => item.id === org) ?? null) })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError) })
    setShareToken(sessionStorage.getItem(`verchem.lab.share-token:${id}`))
    setOrigin(window.location.origin)
    return () => { active = false }
  }, [id, load, org, t.unknownError])

  const savePreview = useCallback(async (): Promise<boolean> => {
    if (!measurements) return false
    setBusy(true); setError(null)
    try {
      const response = await labFetch<{ record: PrepRecord; preview: LabRecordDetail['preview'] }>(`/api/lab/orgs/${encodeURIComponent(org)}/records/${encodeURIComponent(id)}`, {
        fallbackMessage: t.unknownError,
        method: 'PATCH', body: JSON.stringify({ measurements }),
      })
      setDetail((current) => current ? { ...current, record: { ...response.record, share_token_hash: null } } : current)
      setPreview(response.preview)
      setPreviewError(null)
      return true
    } catch (requestError: unknown) {
      const message = requestError instanceof LabApiError ? requestError.message : t.unknownError
      setError(message); setPreviewError(message)
      return false
    } finally { setBusy(false) }
  }, [id, measurements, org, t.unknownError])

  useEffect(() => {
    if (!editStarted || detail?.record.state !== 'draft') return
    const timer = window.setTimeout(() => { void savePreview() }, 750)
    return () => window.clearTimeout(timer)
  }, [detail?.record.state, editStarted, measurements, savePreview])

  const transition = async (action: 'submit' | 'withdraw' | 'reject' | 'void' | 'release') => {
    if (!detail) return
    // The asterisk on the reason box has to mean something before the request
    // is sent: these buttons are not in a form, so nothing else enforces it.
    const requiredReason = action === 'reject' ? rejectReason
      : action === 'void' ? voidReason
      : action === 'release' && releaseNeedsReason ? releaseReason
      : null
    if (requiredReason !== null && requiredReason.trim().length < 3) {
      setError(t.reasonRequired)
      return
    }
    setBusy(true); setError(null)
    try {
      let body: Record<string, string> | undefined
      if (action === 'reject') body = { reason: rejectReason }
      if (action === 'void') body = { reason: voidReason }
      if (action === 'release' && releaseReason.trim()) body = { deviation_reason: releaseReason }
      const response = await labFetch<{ share_token?: string }>(`/api/lab/orgs/${encodeURIComponent(org)}/records/${encodeURIComponent(id)}/${action}`, {
        fallbackMessage: t.unknownError,
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      if (action === 'release' && response.share_token) {
        sessionStorage.setItem(`verchem.lab.share-token:${id}`, response.share_token)
        setShareToken(response.share_token)
      }
      if (action === 'reject') setRejectReason('')
      if (action === 'release') setReleaseReason('')
      if (action === 'void') setVoidReason('')
      await load()
      router.refresh()
    } catch (requestError: unknown) {
      setError(requestError instanceof LabApiError ? requestError.message : t.unknownError)
    } finally { setBusy(false) }
  }

  const submit = async () => {
    const saved = await savePreview()
    if (saved) await transition('submit')
  }

  const createAttempt = async () => {
    if (!detail) return
    setBusy(true); setError(null)
    try {
      const record = await labFetch<PrepRecord>(`/api/lab/orgs/${encodeURIComponent(org)}/records`, { fallbackMessage: t.unknownError, method: 'POST', body: JSON.stringify({ template_id: detail.template.id }) })
      router.replace(`/lab/${org}/records/${record.id}`)
    } catch (requestError: unknown) { setError(requestError instanceof LabApiError ? requestError.message : t.unknownError) } finally { setBusy(false) }
  }

  const signedPack = useMemo(() => detail ? parseSignedLabPack(detail.record.signed_payload) : null, [detail])
  const verifyUrl = signedPack && shareToken && origin ? `${origin}/verify?pack=${encodeURIComponent(signedPack.payload.lab_record!.record_id)}&token=${encodeURIComponent(shareToken)}` : null
  const isPreparer = detail !== null && organization?.member_aiverid === detail.record.created_by
  const mayReview = organization?.role === 'owner' || organization?.role === 'reviewer'
  const releaseNeedsReason = preview !== null && !preview.withinAcceptance
  const rejectedReason = detail?.events.find((event) => event.action === 'reject')?.reason ?? null

  const copyLink = async () => {
    if (!verifyUrl) return
    try { await navigator.clipboard.writeText(verifyUrl) } catch { setError(t.copyFailed) }
  }
  const downloadPdf = async () => {
    if (!certificateRef.current || !detail) return
    try {
      const { downloadLabEvidencePackPdf } = await import('@/lib/lab/pdf-export')
      await downloadLabEvidencePackPdf(certificateRef.current, detail.record.record_no)
    } catch (requestError: unknown) { setError(requestError instanceof Error ? requestError.message : t.unknownError) }
  }

  if (!detail || !measurements) return <p className={error ? 'text-destructive-strong' : 'text-muted-foreground'}>{error ? `${t.errorPrefix} ${error}` : t.loadingLab}</p>

  const state = detail.record.state
  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.recordNumber}</p><h1 className="lab-display mt-2 text-3xl font-semibold">{detail.record.record_no}</h1><p className="mt-2 text-sm text-muted-foreground">{detail.template.spec.name} · v{detail.template.version}</p></div><StatusChip state={state} outcome={detail.record.outcome} /></section>
      {error && <p role="alert" className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}

      {state === 'draft' && isPreparer && <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]"><div className="lab-document p-5 sm:p-7"><h2 className="lab-display text-2xl font-semibold">{t.measurements}</h2><div className="mt-5"><RequiredFieldsForm template={detail.template} measurements={measurements} onChange={(next) => { setMeasurements(next); setEditStarted(true) }} disabled={busy} /></div><div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} onClick={() => { void savePreview() }} className="min-h-[44px] rounded-md border border-border bg-card px-4 py-2.5 font-medium text-foreground disabled:opacity-50">{t.savePreview}</button><button disabled={busy} onClick={() => { void submit() }} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white disabled:opacity-50">{t.submitForReview}</button></div></div><aside className="space-y-4"><div className="border border-warning/50 bg-warning/10 p-3 font-mono text-xs uppercase tracking-[0.08em] text-warning-strong">{t.previewNotReleased}</div><PreviewPanel preview={preview} previewError={previewError} /></aside></section>}

      {state === 'draft' && !isPreparer && <section className="lab-document p-6"><p className="text-muted-foreground">{t.draftBelongsToAnotherPreparer}</p><div className="mt-5"><RequiredFieldsForm template={detail.template} measurements={measurements} onChange={() => undefined} disabled /></div></section>}

      {state === 'submitted' && <section className="space-y-6"><div className="border border-warning/50 bg-warning/10 p-3 font-mono text-xs uppercase tracking-[0.08em] text-warning-strong">{t.submitted}</div><div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]"><div className="lab-document p-5 sm:p-7"><h2 className="lab-display text-2xl font-semibold">{t.measurements}</h2><div className="mt-5"><RequiredFieldsForm template={detail.template} measurements={measurements} onChange={() => undefined} disabled /></div></div><PreviewPanel preview={preview} previewError={previewError} /></div>{isPreparer && <button disabled={busy} onClick={() => { void transition('withdraw') }} className="min-h-[44px] rounded-md border border-border px-4 py-2.5 font-medium text-foreground disabled:opacity-50">{t.withdraw}</button>}{mayReview && !isPreparer && <div className="grid gap-5 lab-document p-5 sm:grid-cols-2"><div><ActionReason label={t.reason} value={rejectReason} onChange={setRejectReason} required /><button disabled={busy} onClick={() => { void transition('reject') }} className="mt-3 min-h-[44px] rounded-md border border-destructive/50 px-4 py-2.5 font-medium text-destructive-strong disabled:opacity-50">{t.reject}</button></div><div><ActionReason label={releaseNeedsReason ? t.deviationReason : t.releaseApproval} value={releaseReason} onChange={setReleaseReason} required={releaseNeedsReason} /><button disabled={busy} onClick={() => { void transition('release') }} className="mt-3 min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white disabled:opacity-50">{t.release}</button></div></div>}</section>}

      {state === 'rejected' && <section className="lab-document p-6"><h2 className="lab-display text-2xl font-semibold">{t.rejected}</h2><p className="mt-3 text-foreground">{rejectedReason ?? t.noRejectionReason}</p>{isPreparer && <button disabled={busy} onClick={() => { void createAttempt() }} className="mt-6 min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white disabled:opacity-50">{t.createNewAttempt}</button>}</section>}

      {(state === 'released' || state === 'voided') && signedPack && <section className="space-y-5"><PrepRecordCertificate ref={certificateRef} record={detail.record} template={detail.template} pack={signedPack} verifyUrl={verifyUrl} accreditationRef={organization?.accreditation_ref} /><div className="flex flex-wrap items-center gap-3"><button onClick={() => { void downloadPdf() }} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white">{t.downloadPdf}</button>{verifyUrl ? <button onClick={() => { void copyLink() }} className="min-h-[44px] rounded-md border border-border bg-card px-4 py-2.5 font-medium text-foreground">{t.copyVerifyLink}</button> : <span className="text-sm text-warning-strong">{t.shareLinkUnavailable}</span>}{state === 'released' && mayReview && <div className="flex flex-wrap items-end gap-3"><ActionReason label={t.reason} value={voidReason} onChange={setVoidReason} required /><button disabled={busy} onClick={() => { void transition('void') }} className="min-h-[44px] rounded-md border border-destructive/50 px-4 py-2.5 font-medium text-destructive-strong disabled:opacity-50">{t.voidRecord}</button></div>}</div>{shareToken && verifyUrl && <div className="border border-warning/50 bg-warning/10 p-4 text-sm text-warning-strong"><p className="font-semibold">{t.saveShareLink}</p><p className="mt-2 break-all font-mono text-xs text-foreground">{verifyUrl}</p></div>}</section>}

      {(state === 'released' || state === 'voided') && !signedPack && <p role="alert" className="text-destructive-strong">{t.errorPrefix} {t.storedEvidencePackUnavailable}</p>}
      <section className="lab-document p-5"><h2 className="lab-display text-xl font-semibold">{t.eventHistory}</h2><ol className="mt-4 space-y-3 border-l border-border pl-4">{detail.events.map((event, index) => <li key={`${event.action}-${event.at}-${index}`}><p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{event.action} · {formatLabDate(event.at)}</p><p className="mt-1 text-sm text-foreground">{event.actor}</p></li>)}</ol></section>
    </div>
  )
}
