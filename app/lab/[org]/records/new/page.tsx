'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { LabApiError, labFetch } from '@/lib/lab/client'
import type { PrepRecord, PrepTemplate } from '@/lib/lab/types'

export default function NewRecordPage() {
  const { org } = useParams<{ org: string }>()
  const router = useRouter()
  const t = useLabTranslations()
  const [templates, setTemplates] = useState<PrepTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let active = true
    void labFetch<{ templates: PrepTemplate[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/templates`, { fallbackMessage: t.unknownError }).then((response) => {
      if (!active) return
      const approved = response.templates.filter((template) => template.status === 'approved')
      setTemplates(approved)
      setTemplateId(approved[0]?.id ?? '')
    }).catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError) })
    return () => { active = false }
  }, [org, t.unknownError])
  const create = async () => {
    setError(null); setSaving(true)
    try {
      const record = await labFetch<PrepRecord>(`/api/lab/orgs/${encodeURIComponent(org)}/records`, { fallbackMessage: t.unknownError, method: 'POST', body: JSON.stringify({ template_id: templateId }) })
      router.replace(`/lab/${org}/records/${record.id}`)
    } catch (requestError: unknown) { setError(requestError instanceof LabApiError ? requestError.message : t.unknownError) } finally { setSaving(false) }
  }
  return <section className="mx-auto max-w-2xl lab-document p-6 sm:p-8"><h1 className="lab-display text-3xl font-semibold">{t.newPreparation}</h1><p className="mt-3 text-muted-foreground">{t.selectApprovedTemplate}</p><label className="mt-6 block text-sm font-medium text-foreground">{t.template}<select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 text-foreground"><option value="">{t.selectTemplate}</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.spec.name} · v{template.version}</option>)}</select></label>{templates.length === 0 && <p className="mt-3 text-sm text-warning-strong">{t.noApprovedTemplates}</p>}{error && <p role="alert" className="mt-4 text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}<button onClick={create} disabled={saving || !templateId} className="mt-6 min-h-[44px] rounded-md bg-[var(--lab-accent)] px-5 py-2.5 font-medium text-white disabled:opacity-50">{t.startPreparation}</button></section>
}
