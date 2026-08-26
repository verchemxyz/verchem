'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { TemplateStatusChip } from '@/components/lab-qc'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { labFetch, type LabOrganization } from '@/lib/lab/client'
import type { PrepTemplate } from '@/lib/lab/types'

export default function TemplatesPage() {
  const { org } = useParams<{ org: string }>()
  const t = useLabTranslations()
  const [templates, setTemplates] = useState<PrepTemplate[]>([])
  const [organization, setOrganization] = useState<LabOrganization | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([
      labFetch<{ templates: PrepTemplate[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/templates`, { fallbackMessage: t.unknownError }),
      labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError }),
    ]).then(([templateResponse, orgResponse]) => {
      if (!active) return
      setTemplates(templateResponse.templates)
      setOrganization(orgResponse.organizations.find((item) => item.id === org) ?? null)
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError)
    })
    return () => { active = false }
  }, [org, t.unknownError])

  const groups = useMemo(() => templates.reduce<Record<string, PrepTemplate[]>>((accumulator, template) => {
    ;(accumulator[template.key] ??= []).push(template)
    return accumulator
  }, {}), [templates])
  const mayManage = organization?.role === 'owner' || organization?.role === 'reviewer'

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.controlledSourceDocument}</p><h1 className="lab-display mt-2 text-3xl font-semibold">{t.templates}</h1></div>
        {mayManage && <Link href={`/lab/${org}/templates/new`} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white">{t.newTemplate}</Link>}
      </section>
      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
      <div className="space-y-5">
        {Object.entries(groups).map(([key, versions]) => (
          <section key={key} className="lab-document">
            <div className="border-b border-border bg-muted px-5 py-3"><p className="font-mono text-xs tabular-nums text-muted-foreground">{key}</p></div>
            <ul className="divide-y divide-border">
              {versions.map((template, index) => (
                <li key={template.id}>
                  <Link href={`/lab/${org}/templates/${template.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-muted">
                    <div><p className="font-medium text-foreground">{template.spec.name}</p><p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">{t.version} {template.version}{index === 0 ? ` · ${t.newestVersion}` : ''}</p></div>
                    <TemplateStatusChip status={template.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {templates.length === 0 && <p className="lab-document p-6 text-muted-foreground">{t.noApprovedTemplates}</p>}
      </div>
    </div>
  )
}
