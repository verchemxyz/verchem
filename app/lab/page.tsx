'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LabApiError, labFetch, type LabOrganization } from '@/lib/lab/client'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'

export default function LabEntryPage() {
  const router = useRouter()
  const t = useLabTranslations()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [accreditationRef, setAccreditationRef] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError })
      .then(({ organizations }) => {
        if (!active) return
        if (organizations.length > 0) {
          const last = localStorage.getItem('verchem.lab.last-org')
          const target = organizations.find((organization) => organization.id === last) ?? organizations[0]
          router.replace(`/lab/${target.id}`)
          return
        }
        setLoading(false)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setError(requestError instanceof Error ? requestError.message : t.unknownError)
        setLoading(false)
      })
    return () => { active = false }
  }, [router, t.unknownError])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const organization = await labFetch<LabOrganization>('/api/lab/orgs', {
        fallbackMessage: t.unknownError,
        method: 'POST',
        body: JSON.stringify({
          name,
          country: country.trim() || null,
          accreditation_ref: accreditationRef.trim() || null,
        }),
      })
      localStorage.setItem('verchem.lab.last-org', organization.id)
      router.replace(`/lab/${organization.id}`)
    } catch (requestError: unknown) {
      setError(requestError instanceof LabApiError ? requestError.message : t.unknownError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">{t.loadingLab}</p>

  return (
    <section className="mx-auto max-w-xl lab-document p-6 sm:p-8">
      <h1 className="lab-display text-3xl font-semibold text-foreground">{t.createLab}</h1>
      <p className="mt-3 text-muted-foreground">{t.createLabDescription}</p>
      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label className="block text-sm font-medium text-foreground">
          {t.labName}
          <input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 text-foreground focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block text-sm font-medium text-foreground">
          {t.country}
          <input maxLength={2} value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} placeholder="TH" className="mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 font-mono text-foreground focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block text-sm font-medium text-foreground">
          {t.accreditationRef}
          <input maxLength={120} value={accreditationRef} onChange={(event) => setAccreditationRef(event.target.value)} className="mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 text-foreground focus:ring-2 focus:ring-ring" />
        </label>
        {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
        <button disabled={saving} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-5 py-2.5 font-medium text-white disabled:opacity-50">{t.saveAndContinue}</button>
      </form>
    </section>
  )
}
