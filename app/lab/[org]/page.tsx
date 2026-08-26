'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StatusChip } from '@/components/lab-qc'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { formatLabDate, labFetch, type LabRecordListItem } from '@/lib/lab/client'
import type { PrepTemplate } from '@/lib/lab/types'

export default function LabDashboardPage() {
  const { org } = useParams<{ org: string }>()
  const t = useLabTranslations()
  const [records, setRecords] = useState<LabRecordListItem[]>([])
  const [templates, setTemplates] = useState<PrepTemplate[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([
      labFetch<{ records: LabRecordListItem[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/records?limit=8`, { fallbackMessage: t.unknownError }),
      labFetch<{ templates: PrepTemplate[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/templates`, { fallbackMessage: t.unknownError }),
    ]).then(([recordResponse, templateResponse]) => {
      if (!active) return
      setRecords(recordResponse.records)
      setTemplates(templateResponse.templates)
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError)
    })
    return () => { active = false }
  }, [org, t.unknownError])

  const hasApprovedTemplate = templates.some((template) => template.status === 'approved')
  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.controlledPreparationLedger}</p>
          <h1 className="lab-display mt-2 text-3xl font-semibold">{t.recentRecords}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {hasApprovedTemplate ? <Link href={`/lab/${org}/records/new`} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white">{t.newPreparation}</Link> : <span className="min-h-[44px] rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground">{t.noApprovedTemplates}</span>}
          <Link href={`/lab/${org}/templates`} className="min-h-[44px] rounded-md border border-border bg-card px-4 py-2.5 font-medium text-foreground hover:bg-muted">{t.manageTemplates}</Link>
        </div>
      </section>
      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
      <section className="lab-document overflow-hidden">
        {records.length === 0 ? <p className="p-6 text-muted-foreground">{t.noRecords}</p> : (
          <ul className="divide-y divide-border">
            {records.map((record) => (
              <li key={record.id}>
                <Link href={`/lab/${org}/records/${record.id}`} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted">
                  <div>
                    <p className="font-mono text-sm font-medium tabular-nums text-foreground">{record.record_no}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{record.template_name ?? record.template_key ?? t.template} · {formatLabDate(record.created_at)}</p>
                  </div>
                  <StatusChip state={record.state} outcome={record.outcome} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Link href={`/lab/${org}/records`} className="text-sm font-medium text-[var(--lab-accent)] hover:underline">{t.records} →</Link>
    </div>
  )
}
