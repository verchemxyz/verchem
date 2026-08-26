'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TemplateStatusChip, requiredPrepFieldLabel } from '@/components/lab-qc'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { LabApiError, labFetch, type LabOrganization } from '@/lib/lab/client'
import type { PrepTemplate } from '@/lib/lab/types'

export default function TemplateDetailPage() {
  const { org, id } = useParams<{ org: string; id: string }>()
  const router = useRouter()
  const t = useLabTranslations()
  const [template, setTemplate] = useState<PrepTemplate | null>(null)
  const [organization, setOrganization] = useState<LabOrganization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void Promise.all([
      labFetch<{ template: PrepTemplate }>(`/api/lab/orgs/${encodeURIComponent(org)}/templates/${encodeURIComponent(id)}`, { fallbackMessage: t.unknownError }),
      labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError }),
    ]).then(([templateResponse, orgResponse]) => {
      if (!active) return
      setTemplate(templateResponse.template)
      setOrganization(orgResponse.organizations.find((item) => item.id === org) ?? null)
    }).catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError) })
    return () => { active = false }
  }, [id, org, t.unknownError])

  const mutate = async (action: 'approve' | 'retire') => {
    if (!template) return
    setError(null); setBusy(true)
    try {
      const updated = await labFetch<PrepTemplate>(`/api/lab/orgs/${encodeURIComponent(org)}/templates/${encodeURIComponent(id)}/${action}`, { fallbackMessage: t.unknownError, method: 'POST' })
      setTemplate(updated)
      router.refresh()
    } catch (requestError: unknown) { setError(requestError instanceof LabApiError ? requestError.message : t.unknownError) } finally { setBusy(false) }
  }

  if (!template) return <p className={error ? 'text-destructive-strong' : 'text-muted-foreground'}>{error ? `${t.errorPrefix} ${error}` : t.loadingLab}</p>
  const mayManage = organization?.role === 'owner' || organization?.role === 'reviewer'
  const mayApprove = mayManage && template.status === 'draft' && organization?.member_aiverid !== template.created_by
  const mayRetire = mayManage && template.status === 'approved'
  const target = template.spec.target

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{template.key} · v{template.version}</p><h1 className="lab-display mt-2 text-3xl font-semibold">{template.spec.name}</h1></div><TemplateStatusChip status={template.status} /></section>
      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
      <section className="lab-document p-5 sm:p-7"><h2 className="lab-display text-2xl font-semibold">{t.target}</h2><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">{t.targetConcentration}</dt><dd className="mt-1 font-mono tabular-nums">{target.targetConc} {target.unit}</dd></div><div><dt className="text-muted-foreground">{t.targetVolume}</dt><dd className="mt-1 font-mono tabular-nums">{target.targetVolume} {template.spec.targetVolumeUnit}</dd></div><div><dt className="text-muted-foreground">{t.reagentForm}</dt><dd className="mt-1 font-mono">{target.reagentForm}</dd></div><div><dt className="text-muted-foreground">{t.solvent}</dt><dd className="mt-1 font-mono">{target.solvent}</dd></div><div><dt className="text-muted-foreground">{t.acceptanceLimit}</dt><dd className="mt-1 font-mono tabular-nums">±{template.spec.acceptance.relativePercent}%</dd></div><div><dt className="text-muted-foreground">{t.preparationTemperature}</dt><dd className="mt-1 font-mono tabular-nums">{target.preparationTemperatureC} °C</dd></div></dl></section>
      <section className="grid gap-6 md:grid-cols-2"><div className="lab-document p-5"><h2 className="lab-display text-xl font-semibold">{t.requiredFields}</h2><ul className="mt-4 space-y-2 font-mono text-sm text-foreground">{template.spec.requiredFields.map((field) => <li key={field}>{requiredPrepFieldLabel(t, field)}</li>)}</ul></div><div className="lab-document p-5"><h2 className="lab-display text-xl font-semibold">{t.instructions}</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground">{template.spec.instructions.map((instruction, index) => <li key={`${instruction}-${index}`}>{instruction}</li>)}</ol></div></section>
      <section className="lab-document p-5"><h2 className="lab-display text-xl font-semibold">{t.citations}</h2><ul className="mt-4 space-y-2 text-sm text-muted-foreground">{template.spec.citations.map((citation, index) => <li key={`${citation}-${index}`}>{citation}</li>)}</ul></section>
      <div className="flex flex-wrap gap-3">{mayApprove && <button disabled={busy} onClick={() => mutate('approve')} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-5 py-2.5 font-medium text-white disabled:opacity-50">{t.approve}</button>}{mayRetire && <button disabled={busy} onClick={() => mutate('retire')} className="min-h-[44px] rounded-md border border-warning/50 px-5 py-2.5 font-medium text-warning-strong disabled:opacity-50">{t.retire}</button>}</div>
    </div>
  )
}
