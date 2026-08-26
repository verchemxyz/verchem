'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { labFetch, type LabOrganization } from '@/lib/lab/client'
import { useLabTranslations } from './use-lab-translations'

function orgParam(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function LabShell({ children }: { children: ReactNode }) {
  const params = useParams<{ org?: string }>()
  const pathname = usePathname()
  const t = useLabTranslations()
  const [organizations, setOrganizations] = useState<LabOrganization[]>([])
  const [error, setError] = useState<string | null>(null)
  const orgId = orgParam(params.org)

  useEffect(() => {
    let active = true
    void labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError })
      .then((value) => { if (active) setOrganizations(value.organizations) })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError)
      })
    return () => { active = false }
  }, [t.unknownError])

  const organization = useMemo(() => organizations.find((item) => item.id === orgId) ?? null, [orgId, organizations])

  useEffect(() => {
    if (organization) localStorage.setItem('verchem.lab.last-org', organization.id)
  }, [organization])
  const tabs = organization
    ? [
      { href: `/lab/${organization.id}`, label: t.records, exact: true },
      { href: `/lab/${organization.id}/templates`, label: t.templates, exact: false },
      ...(organization.role === 'owner' ? [{ href: `/lab/${organization.id}/members`, label: t.members, exact: false }] : []),
    ]
    : []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href="/lab" className="text-lg font-semibold text-foreground hover:text-[var(--lab-accent)]">VerChem Lab</Link>
              {organization ? (
                <div className="mt-2">
                  <p className="font-medium text-foreground">{organization.name}</p>
                  {organization.accreditation_ref && <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{organization.accreditation_ref}</p>}
                </div>
              ) : <p className="mt-1 text-sm text-muted-foreground">{t.title}</p>}
            </div>
            {organization && <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">{{ owner: t.roleOwner, reviewer: t.roleReviewer, analyst: t.roleAnalyst, viewer: t.roleViewer }[organization.role]}</span>}
          </div>
          {tabs.length > 0 && (
            <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-3" aria-label={t.laboratoryNavigation}>
              {tabs.map((tab) => {
                const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                return <Link key={tab.href} href={tab.href} className={`border-b-2 pb-1 text-sm font-medium ${active ? 'border-[var(--lab-accent)] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab.label}</Link>
              })}
            </nav>
          )}
        </div>
      </header>
      {error && <p role="alert" className="mx-auto max-w-7xl px-4 pt-4 text-sm text-destructive-strong sm:px-6 lg:px-8">{error}</p>}
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
