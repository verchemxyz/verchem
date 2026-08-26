'use client'

import type { PrepRecord, PrepTemplate } from '@/lib/lab/types'
import { useLabTranslations } from './use-lab-translations'

type Status = PrepRecord['state'] | 'released_with_deviation'

const statusClass: Record<Status, string> = {
  draft: 'lab-status-draft',
  submitted: 'lab-status-submitted',
  released: 'lab-status-released',
  released_with_deviation: 'lab-status-deviation',
  rejected: 'lab-status-rejected',
  voided: 'lab-status-voided',
}

export function StatusChip({ state, outcome }: { state: PrepRecord['state']; outcome?: PrepRecord['outcome'] }) {
  const t = useLabTranslations()
  const status: Status = state === 'voided'
    ? 'voided'
    : outcome === 'released_with_deviation'
      ? 'released_with_deviation'
      : state
  const labels: Record<Status, string> = {
    draft: t.draft,
    submitted: t.submitted,
    released: t.released,
    released_with_deviation: t.releasedWithDeviation,
    rejected: t.rejected,
    voided: t.voided,
  }
  return <span className={`lab-status-chip ${statusClass[status]}`}>{labels[status]}</span>
}

export function TemplateStatusChip({ status }: { status: PrepTemplate['status'] }) {
  const t = useLabTranslations()
  const presentation: Record<PrepTemplate['status'], { className: string; label: string }> = {
    approved: { className: 'lab-status-released', label: t.approved },
    retired: { className: 'lab-status-voided', label: t.retired },
    draft: { className: 'lab-status-draft', label: t.draft },
  }
  const current = presentation[status]
  return <span className={`lab-status-chip ${current.className}`}>{current.label}</span>
}
