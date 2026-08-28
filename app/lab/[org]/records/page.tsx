'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { StatusChip } from '@/components/lab-qc'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { formatLabDate, labFetch, type LabOrganization, type LabRecordListItem } from '@/lib/lab/client'
import { canCreatePreparation } from '@/lib/lab/prep-record'
import type { PrepRecord } from '@/lib/lab/types'

export default function RecordsPage() {
  const { org } = useParams<{ org: string }>()
  const t = useLabTranslations()
  const [records, setRecords] = useState<LabRecordListItem[]>([])
  const [organization, setOrganization] = useState<LabOrganization | null>(null)
  const [state, setState] = useState<'all' | PrepRecord['state']>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([
      labFetch<{ records: LabRecordListItem[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/records?limit=50`, { fallbackMessage: t.unknownError }),
      labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError }),
    ])
      .then(([recordResponse, organizationResponse]) => {
        if (!active) return
        setRecords(recordResponse.records)
        setOrganization(organizationResponse.organizations.find((item) => item.id === org) ?? null)
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError) })
    return () => { active = false }
  }, [org, t.unknownError])
  const shown = useMemo(() => state === 'all' ? records : records.filter((record) => record.state === state), [records, state])
  const mayPrepare = canCreatePreparation(organization?.role)

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.preparationLedger}</p><h1 className="lab-display mt-2 text-3xl font-semibold">{t.records}</h1></div>{mayPrepare ? <Link href={`/lab/${org}/records/new`} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white">{t.newPreparation}</Link> : organization?.role === 'viewer' ? <p className="max-w-sm text-sm text-muted-foreground">{t.viewerCannotStartPreparation}</p> : null}</section>
      <label className="inline-flex items-center gap-2 text-sm text-foreground">{t.allStates}<select value={state} onChange={(event) => setState(event.target.value as 'all' | PrepRecord['state'])} className="min-h-[40px] rounded-md border border-input-border bg-input px-2 text-foreground"><option value="all">{t.allStates}</option><option value="draft">{t.draft}</option><option value="submitted">{t.submitted}</option><option value="released">{t.released}</option><option value="rejected">{t.rejected}</option><option value="voided">{t.voided}</option></select></label>
      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
      <section className="lab-document overflow-hidden">
        {shown.length === 0 ? <p className="p-6 text-muted-foreground">{state === 'all' ? t.noRecords : t.noRecordsInSelectedState}</p> : <ul className="divide-y divide-border">{shown.map((record) => <li key={record.id}><Link href={`/lab/${org}/records/${record.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted"><div><p className="font-mono text-sm font-medium tabular-nums">{record.record_no}</p><p className="mt-1 text-sm text-muted-foreground">{record.template_name ?? record.template_key ?? t.template} · {formatLabDate(record.created_at)}</p></div><StatusChip state={record.state} outcome={record.outcome} /></Link></li>)}</ul>}
      </section>
    </div>
  )
}
