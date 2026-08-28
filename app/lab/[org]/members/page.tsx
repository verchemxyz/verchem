'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { LabApiError, labFetch, type LabMemberView, type LabOrganization } from '@/lib/lab/client'

type InviteRole = 'reviewer' | 'analyst' | 'viewer'

const controlClass = 'mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 text-foreground focus:ring-2 focus:ring-ring'

export default function MembersPage() {
  const { org } = useParams<{ org: string }>()
  const t = useLabTranslations()
  const [members, setMembers] = useState<LabMemberView[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<InviteRole>('reviewer')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    const response = await labFetch<{ members: LabMemberView[] }>(
      `/api/lab/orgs/${encodeURIComponent(org)}/members`,
      { fallbackMessage: t.unknownError }
    )
    return response.members
  }, [org, t.unknownError])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const [rows, { organizations }] = await Promise.all([
          loadMembers(),
          labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError }),
        ])
        if (!active) return
        setMembers(rows)
        setIsOwner(organizations.find((organization) => organization.id === org)?.role === 'owner')
      } catch (requestError: unknown) {
        if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError)
      }
    })()
    return () => { active = false }
  }, [loadMembers, org, t.unknownError])

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await labFetch<LabMemberView>(`/api/lab/orgs/${encodeURIComponent(org)}/members`, {
        fallbackMessage: t.unknownError,
        method: 'POST',
        body: JSON.stringify({
          email,
          role,
          ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
        }),
      })
      setEmail('')
      setDisplayName('')
      setNotice(t.invitationSent)
      setMembers(await loadMembers())
    } catch (requestError: unknown) {
      setError(requestError instanceof LabApiError ? requestError.message : t.unknownError)
    } finally {
      setBusy(false)
    }
  }

  const roleLabels = { owner: t.roleOwner, reviewer: t.roleReviewer, analyst: t.roleAnalyst, viewer: t.roleViewer }
  const showOwnerColumns = members.some((member) => member.invited_email !== undefined)

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-5">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.organizationAccess}</p>
        <h1 className="lab-display mt-2 text-3xl font-semibold">{t.members}</h1>
      </section>

      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
      {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}

      <section className="lab-document overflow-hidden">
        {members.length === 0 ? <p className="p-6 text-muted-foreground">{t.noMembers}</p> : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t.name}</th>
                <th className="px-4 py-3 font-medium">{t.role}</th>
                {showOwnerColumns && <th className="px-4 py-3 font-medium">{t.invitedEmail}</th>}
                {showOwnerColumns && <th className="px-4 py-3 font-medium">{t.memberStatus}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member, index) => (
                <tr key={`${member.display_name}-${index}`}>
                  <td className="px-4 py-3 text-foreground">{member.display_name}</td>
                  <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">{roleLabels[member.role]}</td>
                  {showOwnerColumns && <td className="px-4 py-3 text-muted-foreground">{member.invited_email ?? '—'}</td>}
                  {showOwnerColumns && (
                    <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">
                      {member.joined_at ? t.statusActive : t.statusPending}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isOwner && (
        <section className="lab-document p-5 sm:p-7">
          <h2 className="lab-display text-2xl font-semibold text-foreground">{t.inviteColleague}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t.inviteColleagueHelp}</p>
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { void invite(event) }}>
            <label className="block text-sm font-medium text-foreground sm:col-span-2">
              {t.emailAddress}
              {/* `type="email"` alone accepts user@host; the server requires a
                  dotted domain, so the box asks for what will be accepted. */}
              <input
                required
                type="email"
                pattern="[^@\s]+@[^@\s]+\.[^@\s]+"
                title={t.emailFormatHint}
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={controlClass}
              />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">{t.emailFormatHint}</span>
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t.role}
              <select value={role} onChange={(event) => setRole(event.target.value as InviteRole)} className={controlClass}>
                <option value="reviewer">{t.roleReviewer}</option>
                <option value="analyst">{t.roleAnalyst}</option>
                <option value="viewer">{t.roleViewer}</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t.displayNameOptional}
              <input
                maxLength={120}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={controlClass}
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-4 py-2.5 font-medium text-white disabled:opacity-50"
              >
                {t.sendInvitation}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
