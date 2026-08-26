'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { labFetch, type LabMemberView } from '@/lib/lab/client'

export default function MembersPage() {
  const { org } = useParams<{ org: string }>()
  const t = useLabTranslations()
  const [members, setMembers] = useState<LabMemberView[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void labFetch<{ members: LabMemberView[] }>(`/api/lab/orgs/${encodeURIComponent(org)}/members`, { fallbackMessage: t.unknownError }).then((response) => {
      if (active) setMembers(response.members)
    }).catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError) })
    return () => { active = false }
  }, [org, t.unknownError])
  const roleLabels = { owner: t.roleOwner, reviewer: t.roleReviewer, analyst: t.roleAnalyst, viewer: t.roleViewer }
  return <div className="space-y-6"><section className="border-b border-border pb-5"><p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.organizationAccess}</p><h1 className="lab-display mt-2 text-3xl font-semibold">{t.members}</h1></section>{error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}<section className="lab-document overflow-hidden">{members.length === 0 ? <p className="p-6 text-muted-foreground">{t.noMembers}</p> : <table className="min-w-full text-left text-sm"><thead className="border-b border-border bg-muted text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t.name}</th><th className="px-4 py-3 font-medium">{t.role}</th>{members.some((member) => member.invited_email !== undefined) && <th className="px-4 py-3 font-medium">{t.invitedEmail}</th>}</tr></thead><tbody className="divide-y divide-border">{members.map((member, index) => <tr key={`${member.display_name}-${index}`}><td className="px-4 py-3 text-foreground">{member.display_name}</td><td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">{roleLabels[member.role]}</td>{members.some((item) => item.invited_email !== undefined) && <td className="px-4 py-3 text-muted-foreground">{member.invited_email ?? '—'}</td>}</tr>)}</tbody></table>}</section></div>
}
