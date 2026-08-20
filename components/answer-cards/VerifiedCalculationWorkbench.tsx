'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnswerCard } from '@/lib/answer-cards/types'
import type {
  PublicInputProperty,
  VerifiedToolCatalogEntry,
} from '@/lib/answer-cards/catalog'
import AnswerCardView from './AnswerCardView'
import SaveShareControls from './SaveShareControls'

interface VerifiedCalculationWorkbenchProps {
  tools: VerifiedToolCatalogEntry[]
}

const EXAMPLE_INPUTS: Record<string, Record<string, string>> = {
  calculate_molecular_mass: { formula: 'H2SO4' },
  calculate_percent_composition: { formula: 'H2O' },
  balance_equation: { equation: 'H2 + O2 -> H2O' },
  calculate_strong_acid_ph: { concentration: '0.1', formula: 'HCl', temperature_C: '25' },
  ideal_gas_law: { P: '1', V: '22.414', T: '273.15' },
  mass_to_moles: { mass: '18.015', formula: 'H2O' },
  calculate_empirical_formula: {
    composition: '[{"element":"C","percent":40},{"element":"H","percent":6.7},{"element":"O","percent":53.3}]',
  },
}

function parseInputValue(raw: string, property: PublicInputProperty): unknown {
  if (property.type === 'number' || property.type === 'integer') {
    const value = Number(raw)
    if (!Number.isFinite(value)) throw new Error('must be a finite number')
    if (property.type === 'integer' && !Number.isSafeInteger(value)) {
      throw new Error('must be a safe integer')
    }
    return value
  }
  if (property.type === 'boolean') {
    if (raw !== 'true' && raw !== 'false') throw new Error('must be true or false')
    return raw === 'true'
  }
  if (property.type === 'array' || property.type === 'object') {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw) as unknown
    } catch {
      throw new Error('must be valid JSON')
    }
    if (property.type === 'array' && !Array.isArray(parsed)) throw new Error('must be a JSON array')
    if (property.type === 'object' &&
      (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) {
      throw new Error('must be a JSON object')
    }
    return parsed
  }
  return raw
}

function fieldLabel(name: string): string {
  return name.replaceAll('_', ' ')
}

export default function VerifiedCalculationWorkbench({ tools }: VerifiedCalculationWorkbenchProps) {
  const router = useRouter()
  const defaultTool = tools.find((tool) => tool.name === 'calculate_molecular_mass') ?? tools[0]
  const [selectedName, setSelectedName] = useState(defaultTool?.name ?? '')
  const [values, setValues] = useState<Record<string, string>>(
    defaultTool ? (EXAMPLE_INPUTS[defaultTool.name] ?? {}) : {}
  )
  const [card, setCard] = useState<AnswerCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const selected = useMemo(
    () => tools.find((tool) => tool.name === selectedName) ?? null,
    [selectedName, tools]
  )

  const categories = useMemo(
    () => [...new Set(tools.map((tool) => tool.category))],
    [tools]
  )

  const changeTool = (name: string) => {
    setSelectedName(name)
    setValues(EXAMPLE_INPUTS[name] ?? {})
    setCard(null)
    setError(null)
  }

  const buildInput = (): Record<string, unknown> => {
    if (!selected) throw new Error('Select a deterministic engine')
    const input: Record<string, unknown> = {}

    for (const [name, property] of Object.entries(selected.properties)) {
      const raw = values[name]?.trim() ?? ''
      if (raw.length === 0) {
        if (selected.required.includes(name)) throw new Error(`${fieldLabel(name)} is required`)
        continue
      }
      try {
        input[name] = parseInputValue(raw, property)
      } catch (parseError: unknown) {
        const message = parseError instanceof Error ? parseError.message : 'is invalid'
        throw new Error(`${fieldLabel(name)} ${message}`)
      }
    }
    return input
  }

  const createArtifact = async () => {
    if (!selected) return
    setBusy(true)
    setError(null)
    setCard(null)
    try {
      const input = buildInput()
      const response = await fetch('/api/verified-calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: selected.name, input }),
      })
      const data = await response.json().catch(() => ({})) as Record<string, unknown>
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Could not create the signed artifact')
      }
      setCard(data as unknown as AnswerCard)
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : 'Could not create the signed artifact')
    } finally {
      setBusy(false)
    }
  }

  const copyJws = async () => {
    if (!card) return
    try {
      await navigator.clipboard.writeText(card.signature)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the compact JWS. Select it manually below.')
    }
  }

  const downloadJws = () => {
    if (!card) return
    const blob = new Blob([card.signature], { type: 'application/jose' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `verchem-${card.tool_calls[0]?.name ?? 'artifact'}-${Date.now()}.jws`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const verifyArtifact = () => {
    if (!card) return
    sessionStorage.setItem('verchem.verify.jws', card.signature)
    router.push('/verify')
  }

  if (!selected) {
    return <p className="text-destructive-strong">No deterministic engines are available.</p>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <label htmlFor="verified-tool" className="mb-2 block text-sm font-semibold text-foreground">
              Deterministic engine
            </label>
            <select
              id="verified-tool"
              value={selectedName}
              onChange={(event) => changeTool(event.target.value)}
              className="min-h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map((category) => (
                <optgroup key={category} label={category}>
                  {tools.filter((tool) => tool.category === category).map((tool) => (
                    <option key={tool.name} value={tool.name}>{tool.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <div className="mt-4 rounded-lg border border-border bg-muted p-4 text-sm">
              <div className="font-mono text-xs text-primary-600">
                {selected.engine}@{selected.engineVersion}
              </div>
              <p className="mt-2 text-muted-foreground">{selected.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">Source: {selected.citation}</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(selected.properties).map(([name, property]) => {
              const required = selected.required.includes(name)
              const fieldId = `verified-input-${name}`
              const commonClass = 'min-h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              return (
                <div key={name}>
                  <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium capitalize text-foreground">
                    {fieldLabel(name)} {required ? <span className="text-destructive-strong">*</span> : <span className="text-muted-foreground">(optional)</span>}
                  </label>
                  {property.enum ? (
                    <select
                      id={fieldId}
                      value={values[name] ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                      className={commonClass}
                    >
                      <option value="">Select a value</option>
                      {property.enum.map((option) => (
                        <option key={String(option)} value={String(option)}>{String(option)}</option>
                      ))}
                    </select>
                  ) : property.type === 'array' || property.type === 'object' ? (
                    <textarea
                      id={fieldId}
                      value={values[name] ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                      rows={4}
                      spellCheck={false}
                      placeholder={property.type === 'array' ? '[...]' : '{...}'}
                      className={`${commonClass} font-mono text-sm`}
                    />
                  ) : property.type === 'boolean' ? (
                    <select
                      id={fieldId}
                      value={values[name] ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                      className={commonClass}
                    >
                      <option value="">Select a value</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      id={fieldId}
                      type={property.type === 'number' || property.type === 'integer' ? 'number' : 'text'}
                      inputMode={property.type === 'number' || property.type === 'integer' ? 'decimal' : undefined}
                      step={property.type === 'integer' ? '1' : property.type === 'number' ? 'any' : undefined}
                      value={values[name] ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                      className={commonClass}
                    />
                  )}
                  {property.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{property.description}</p>
                  )}
                </div>
              )
            })}

            <button
              type="button"
              onClick={createArtifact}
              disabled={busy}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-primary-500 px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Computing and signing…' : 'Compute and sign artifact'}
            </button>
            <p className="text-xs text-muted-foreground">
              No AI is used. Inputs go only to the signing endpoint and are not saved unless you explicitly choose Save.
            </p>
            {error && <p role="alert" className="text-sm text-destructive-strong">{error}</p>}
          </div>
        </div>
      </section>

      {card && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-mono text-xs uppercase tracking-wider text-success-strong">Signed artifact ready</div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Deterministic evidence</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyJws} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                {copied ? 'Copied' : 'Copy JWS'}
              </button>
              <button type="button" onClick={downloadJws} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Download
              </button>
              <button type="button" onClick={verifyArtifact} className="rounded-md bg-primary-500 px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-600">
                Verify independently
              </button>
            </div>
          </div>
          <AnswerCardView card={card} />
          <details className="mt-5 rounded-lg border border-border bg-muted p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">Compact JWS</summary>
            <code className="mt-3 block max-h-36 overflow-auto break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
              {card.signature}
            </code>
          </details>
          <SaveShareControls card={card} />
        </section>
      )}
    </div>
  )
}
