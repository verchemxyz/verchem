'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { requiredPrepFieldLabel } from '@/components/lab-qc'
import { useLabTranslations } from '@/components/lab-qc/use-lab-translations'
import { LabApiError, labFetch, type LabOrganization } from '@/lib/lab/client'
import { REQUIRED_PREP_FIELDS, type RequiredPrepField } from '@/lib/lab/required-fields'
import type { ConcentrationUnit, StockPrepInput } from '@/lib/calculations/solution-prep'
import type { PrepTemplate, PrepTemplateSpec } from '@/lib/lab/types'

const UNITS: ConcentrationUnit[] = ['mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L', 'pct_wv', 'pct_ww', 'pct_vv', 'N', 'ppm', 'ppb']
const inputClass = 'mt-1.5 min-h-[44px] w-full rounded-md border border-input-border bg-input px-3 text-foreground outline-none focus:ring-2 focus:ring-ring'

interface TemplateForm {
  name: string
  targetConc: string
  targetVolume: string
  targetVolumeUnit: 'mL' | 'L'
  unit: ConcentrationUnit
  molarMass: string
  solutionDensity: string
  equivalentsFactor: string
  reagentPurityPercent: string
  reagentPurityBasis: 'mass' | 'volume'
  reagentForm: string
  solvent: string
  preparationTemperatureC: string
  acceptance: string
  requiredFields: RequiredPrepField[]
  instructions: string[]
  citations: string[]
}

const initialForm: TemplateForm = {
  name: '', targetConc: '', targetVolume: '', targetVolumeUnit: 'mL', unit: 'mg/L', molarMass: '', solutionDensity: '', equivalentsFactor: '', reagentPurityPercent: '100', reagentPurityBasis: 'mass', reagentForm: '', solvent: 'water', preparationTemperatureC: '20', acceptance: '0.5', requiredFields: ['lot', 'coa_assay', 'balance_id', 'flask_id', 'temperature'], instructions: [''], citations: [''],
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

function TextList({ values, onChange, label, addLabel, removeLabel }: { values: string[]; onChange: (next: string[]) => void; label: string; addLabel: string; removeLabel: string }) {
  return <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-medium text-foreground">{label}</label><button type="button" onClick={() => onChange([...values, ''])} className="text-sm font-medium text-[var(--lab-accent)] hover:underline">{addLabel}</button></div><div className="mt-2 space-y-2">{values.map((value, index) => <div key={`${label}-${index}`} className="flex gap-2"><input value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className={inputClass} /><button type="button" disabled={values.length === 1} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} className="min-h-[44px] rounded-md border border-border px-3 text-sm text-muted-foreground disabled:opacity-40">{removeLabel}</button></div>)}</div></div>
}

export default function NewTemplatePage() {
  const { org } = useParams<{ org: string }>()
  const router = useRouter()
  const t = useLabTranslations()
  const [form, setForm] = useState<TemplateForm>(initialForm)
  const [organization, setOrganization] = useState<LabOrganization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void labFetch<{ organizations: LabOrganization[] }>('/api/lab/orgs', { fallbackMessage: t.unknownError }).then((response) => {
      if (active) setOrganization(response.organizations.find((item) => item.id === org) ?? null)
    }).catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : t.unknownError) })
    return () => { active = false }
  }, [org, t.unknownError])

  const mayManage = organization?.role === 'owner' || organization?.role === 'reviewer'
  const set = <Key extends keyof TemplateForm>(key: Key, value: TemplateForm[Key]) => setForm((current) => ({ ...current, [key]: value }))
  const toggleRequired = (field: RequiredPrepField) => set('requiredFields', form.requiredFields.includes(field) ? form.requiredFields.filter((value) => value !== field) : [...form.requiredFields, field])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null); setSaving(true)
    const target: StockPrepInput = {
      targetConc: Number(form.targetConc),
      targetVolume: Number(form.targetVolume),
      unit: form.unit,
      ...(optionalNumber(form.molarMass) === undefined ? {} : { molarMass: optionalNumber(form.molarMass) }),
      ...(optionalNumber(form.solutionDensity) === undefined ? {} : { solutionDensity: optionalNumber(form.solutionDensity) }),
      ...(optionalNumber(form.equivalentsFactor) === undefined ? {} : { equivalentsFactor: optionalNumber(form.equivalentsFactor) }),
      reagentPurityPercent: Number(form.reagentPurityPercent),
      reagentPurityBasis: form.reagentPurityBasis,
      reagentForm: form.reagentForm,
      solvent: form.solvent,
      preparationTemperatureC: Number(form.preparationTemperatureC),
    }
    const spec: PrepTemplateSpec = {
      schema: 'verchem-prep-template/v1',
      name: form.name,
      target,
      targetVolumeUnit: form.targetVolumeUnit,
      acceptance: { relativePercent: Number(form.acceptance) },
      requiredFields: form.requiredFields,
      instructions: form.instructions.map((value) => value.trim()).filter(Boolean),
      citations: form.citations.map((value) => value.trim()).filter(Boolean),
    }
    try {
      const template = await labFetch<PrepTemplate>(`/api/lab/orgs/${encodeURIComponent(org)}/templates`, { fallbackMessage: t.unknownError, method: 'POST', body: JSON.stringify({ spec }) })
      router.replace(`/lab/${org}/templates/${template.id}`)
    } catch (requestError: unknown) {
      setError(requestError instanceof LabApiError ? requestError.message : t.unknownError)
    } finally { setSaving(false) }
  }

  if (organization && !mayManage) return <section className="lab-document mx-auto max-w-2xl p-6"><p className="text-destructive-strong">{t.errorPrefix} {t.roleRequired}</p><Link href={`/lab/${org}/templates`} className="mt-4 inline-flex min-h-[44px] items-center border border-border bg-card px-4 py-2.5 font-medium text-foreground hover:bg-muted">{t.manageTemplates}</Link></section>

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-7">
      <section className="border-b border-border pb-5"><p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{t.versionedControlledSourceDocument}</p><h1 className="lab-display mt-2 text-3xl font-semibold">{t.createTemplate}</h1></section>
      <section className="lab-document p-5 sm:p-7"><h2 className="lab-display text-2xl font-semibold">{t.template}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-foreground sm:col-span-2">{t.templateName}<input required maxLength={200} value={form.name} onChange={(event) => set('name', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.targetConcentration}<input required type="number" step="any" value={form.targetConc} onChange={(event) => set('targetConc', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.concentrationUnit}<select value={form.unit} onChange={(event) => set('unit', event.target.value as ConcentrationUnit)} className={inputClass}>{UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label><label className="block text-sm font-medium text-foreground">{t.targetVolume}<input required type="number" step="any" value={form.targetVolume} onChange={(event) => set('targetVolume', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.targetVolumeUnit}<select value={form.targetVolumeUnit} onChange={(event) => set('targetVolumeUnit', event.target.value as 'mL' | 'L')} className={inputClass}><option value="mL">mL</option><option value="L">L</option></select></label><label className="block text-sm font-medium text-foreground">{t.reagentForm}<input required value={form.reagentForm} onChange={(event) => set('reagentForm', event.target.value)} placeholder="e.g. CuSO4·5H2O" className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.solvent}<input required value={form.solvent} onChange={(event) => set('solvent', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.reagentPurity}<input required type="number" step="any" value={form.reagentPurityPercent} onChange={(event) => set('reagentPurityPercent', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.purityBasis}<select value={form.reagentPurityBasis} onChange={(event) => set('reagentPurityBasis', event.target.value as 'mass' | 'volume')} className={inputClass}><option value="mass">{t.basisMass}</option><option value="volume">{t.basisVolume}</option></select></label><label className="block text-sm font-medium text-foreground">{t.preparationTemperature}<input required type="number" step="any" value={form.preparationTemperatureC} onChange={(event) => set('preparationTemperatureC', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.acceptanceLimit}<input required type="number" step="any" value={form.acceptance} onChange={(event) => set('acceptance', event.target.value)} className={inputClass} /></label><label className="block text-sm font-medium text-foreground">{t.molarMass}<input type="number" step="any" value={form.molarMass} onChange={(event) => set('molarMass', event.target.value)} className={inputClass} /><span className="mt-1 block text-xs font-normal text-muted-foreground">{t.molarMassHelp}</span></label><label className="block text-sm font-medium text-foreground">{t.solutionDensity}<input type="number" step="any" value={form.solutionDensity} onChange={(event) => set('solutionDensity', event.target.value)} className={inputClass} /><span className="mt-1 block text-xs font-normal text-muted-foreground">{t.solutionDensityHelp}</span></label><label className="block text-sm font-medium text-foreground">{t.equivalentsFactor}<input type="number" step="any" value={form.equivalentsFactor} onChange={(event) => set('equivalentsFactor', event.target.value)} className={inputClass} /><span className="mt-1 block text-xs font-normal text-muted-foreground">{t.equivalentsFactorHelp}</span></label></div></section>
      <section className="lab-document p-5 sm:p-7"><h2 className="lab-display text-2xl font-semibold">{t.requiredFields}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{REQUIRED_PREP_FIELDS.map((field) => <label key={field} className="flex min-h-[44px] items-center gap-3 border border-border bg-card px-3 text-sm text-foreground"><input type="checkbox" checked={form.requiredFields.includes(field)} onChange={() => toggleRequired(field)} />{requiredPrepFieldLabel(t, field)}</label>)}</div></section>
      <section className="lab-document space-y-6 p-5 sm:p-7"><TextList label={t.instructions} values={form.instructions} onChange={(value) => set('instructions', value)} addLabel={t.addItem} removeLabel={t.removeItem} /><TextList label={t.citations} values={form.citations} onChange={(value) => set('citations', value)} addLabel={t.addItem} removeLabel={t.removeItem} /></section>
      {error && <p role="alert" className="text-sm text-destructive-strong">{t.errorPrefix} {error}</p>}
      <button disabled={saving || !mayManage} className="min-h-[44px] rounded-md bg-[var(--lab-accent)] px-5 py-2.5 font-medium text-white disabled:opacity-50">{t.create}</button>
    </form>
  )
}
