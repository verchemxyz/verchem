'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StatusChip } from '@/components/lab-qc'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import {
  formatLabDate,
  labFetch,
  type LabMemberView,
  type LabOrganization,
  type LabRecordDetail,
  type LabRecordListItem,
} from '@/lib/lab/client'
import type { PrepTemplate } from '@/lib/lab/types'

type NextAction = {
  title: string
  description: string
  href: string
  cta: string
}

function RecordList({ org, records }: { org: string; records: LabRecordListItem[] }) {
  const t = useLabTranslations()

  return (
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
  )
}

export default function LabDashboardPage() {
  const { org } = useParams<{ org: string }>()
  const t = useLabTranslations()
  const [records, setRecords] = useState<LabRecordListItem[]>([])
  const [templates, setTemplates] = useState<PrepTemplate[]>([])
  const [organization, setOrganization] = useState<LabOrganization | null>(null)
  const [members, setMembers] = useState<LabMemberView[]>([])
  const [recordDetails, setRecordDetails] = useState<Record<string, LabRecordDetail>>({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const [recordResponse, templateResponse, organizationResponse, memberResponse] = await Promise.all([
          labFetch<{ records: LabRecordListItem[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/records?limit=8`, { fallbackMessage: t.unknownError }),
          labFetch<{ templates: PrepTemplate[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/templates`, { fallbackMessage: t.unknownError }),
          labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError }),
          labFetch<{ members: LabMemberView[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/members`, { fallbackMessage: t.unknownError }),
        ])
        // The privacy-minimal list response intentionally omits `created_by`.
        // Hydrate only draft/submitted rows from this eight-record dashboard slice
        // so the UI can distinguish the caller's work without widening its contract.
        const ownershipDetails = await Promise.all(recordResponse.records
          .filter((record) => record.state === 'draft' || record.state === 'submitted')
          .map(async (record) => [
            record.id,
            await labFetch<LabRecordDetail>(`/api/lab/orgs/${encodeURIComponent(org)}/records/${encodeURIComponent(record.id)}`, { fallbackMessage: t.unknownError }),
          ] as const))
        if (!active) return
        setRecords(recordResponse.records)
        setTemplates(templateResponse.templates)
        setOrganization(organizationResponse.organizations.find((item) => item.id === org) ?? null)
        setMembers(memberResponse.members)
        setRecordDetails(Object.fromEntries(ownershipDetails))
      } catch (requestError: unknown) {
        if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError)
      } finally {
        if (active) setLoaded(true)
      }
    })()

    return () => { active = false }
  }, [org, t.unknownError])

  const mayManage = organization?.role === 'owner' || organization?.role === 'reviewer'
  const mayPrepare = mayManage || organization?.role === 'analyst'
  const isOwnedByCaller = (record: LabRecordListItem) => recordDetails[record.id]?.record.created_by === organization?.member_aiverid
  const myDrafts = records.filter((record) => record.state === 'draft' && isOwnedByCaller(record))
  const reviewQueue = records.filter((record) => record.state === 'submitted' && !isOwnedByCaller(record))
  const releasedEvidence = records.filter((record) => record.state === 'released')
  const approvedTemplate = templates.find((template) => template.status === 'approved')
  const draftTemplates = templates.filter((template) => template.status === 'draft')
  const independentlyApprovableTemplate = draftTemplates.find((template) => template.created_by !== organization?.member_aiverid)
  // Owners receive `joined_at` for each row. That lets the only role that can
  // invite distinguish a claimed colleague from a pending invitation.
  const activeReviewerCount = organization?.role === 'owner'
    ? members.filter((member) => (member.role === 'owner' || member.role === 'reviewer') && member.joined_at !== null).length
    : null
  const hasPendingReviewerInvite = organization?.role === 'owner' && members.some((member) =>
    (member.role === 'owner' || member.role === 'reviewer') && member.joined_at === null
  )

  let nextAction: NextAction | null = null
  if (loaded && organization) {
    if (templates.length === 0) {
      nextAction = mayManage
        ? { title: t.nextCreateFirstTemplate, description: t.nextCreateFirstTemplateHelp, href: `/lab/${org}/templates/new`, cta: t.newTemplate }
        : { title: t.nextRequestPreparation, description: t.nextRequestPreparationHelp, href: `/lab/${org}/templates`, cta: t.manageTemplates }
    } else if (draftTemplates.length > 0 && activeReviewerCount !== null && activeReviewerCount < 2) {
      nextAction = hasPendingReviewerInvite
        ? { title: t.nextPendingReviewerSignIn, description: t.nextPendingReviewerSignInHelp, href: `/lab/${org}/members`, cta: t.members }
        : { title: t.nextInviteColleague, description: t.nextInviteColleagueHelp, href: `/lab/${org}/members`, cta: t.inviteColleague }
    } else if (mayManage && independentlyApprovableTemplate) {
      nextAction = { title: t.nextApproveTemplate, description: t.nextApproveTemplateHelp, href: `/lab/${org}/templates/${independentlyApprovableTemplate.id}`, cta: t.approve }
    } else if (draftTemplates.some((template) => template.created_by === organization.member_aiverid)) {
      nextAction = { title: t.nextAwaitTemplateApproval, description: t.nextAwaitTemplateApprovalHelp, href: `/lab/${org}/members`, cta: t.members }
    } else if (mayManage && reviewQueue.length > 0) {
      nextAction = { title: t.waitingForYourReview, description: t.nextReviewSubmittedHelp, href: `/lab/${org}/records/${reviewQueue[0]!.id}`, cta: t.release }
    } else if (myDrafts.length > 0) {
      nextAction = { title: t.nextResumeDraft, description: t.nextResumeDraftHelp, href: `/lab/${org}/records/${myDrafts[0]!.id}`, cta: t.measurements }
    } else if (approvedTemplate && mayPrepare) {
      nextAction = { title: t.nextStartPreparation, description: t.nextStartPreparationHelp, href: `/lab/${org}/records/new`, cta: t.newPreparation }
    } else if (approvedTemplate) {
      nextAction = { title: t.nextRequestPreparation, description: t.nextRequestPreparationHelp, href: `/lab/${org}/records`, cta: t.records }
    }
  }

  return (
    <div className="space-y-7">
      <section className="border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.controlledPreparationLedger}</p>
        <h1 className="lab-display mt-2 text-3xl font-semibold">{t.labWorkspace}</h1>
      </section>
      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}

      {nextAction && (
        <section className="lab-document border-t-2 border-t-[var(--lab-accent)] p-5 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.whatToDoNext}</p>
          <h2 className="lab-display mt-3 text-2xl font-semibold text-foreground">{nextAction.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{nextAction.description}</p>
          <Link href={nextAction.href} className="mt-5 inline-flex min-h-[44px] items-center bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white">
            {nextAction.cta}
          </Link>
        </section>
      )}

      {mayManage && reviewQueue.length > 0 && (
        <section className="lab-document overflow-hidden">
          <div className="border-b border-border px-5 py-4"><h2 className="lab-display text-2xl font-semibold">{t.waitingForYourReview}</h2></div>
          <RecordList org={org} records={reviewQueue} />
        </section>
      )}

      {myDrafts.length > 0 && (
        <section className="lab-document overflow-hidden">
          <div className="border-b border-border px-5 py-4"><h2 className="lab-display text-2xl font-semibold">{t.myDrafts}</h2></div>
          <RecordList org={org} records={myDrafts} />
        </section>
      )}

      {releasedEvidence.length > 0 && (
        <section className="lab-document overflow-hidden">
          <div className="border-b border-border px-5 py-4"><h2 className="lab-display text-2xl font-semibold">{t.recentlyReleasedEvidence}</h2></div>
          <RecordList org={org} records={releasedEvidence} />
        </section>
      )}

      {loaded && <Link href={`/lab/${org}/records`} className="text-sm font-medium text-[var(--lab-accent)] hover:underline">{t.records} →</Link>}
    </div>
  )
}
