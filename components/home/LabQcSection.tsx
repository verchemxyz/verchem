'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import enCommon from '@/public/locales/en/common.json'

type LabQcCopyKey = keyof typeof enCommon.home.labQc

const WORKFLOW_STEPS = [
  { number: '01', titleKey: 'step1Title', descriptionKey: 'step1Description' },
  { number: '02', titleKey: 'step2Title', descriptionKey: 'step2Description' },
  { number: '03', titleKey: 'step3Title', descriptionKey: 'step3Description' },
  { number: '04', titleKey: 'step4Title', descriptionKey: 'step4Description' },
] as const satisfies ReadonlyArray<{ number: string; titleKey: LabQcCopyKey; descriptionKey: LabQcCopyKey }>

const EVIDENCE_BARS = [42, 78, 55, 92, 66, 34, 84, 58, 96, 48, 72, 38, 88, 62, 100, 52, 76, 44, 90, 68, 36, 82, 56, 94] as const

type Copy = (key: LabQcCopyKey) => string

function EvidenceFlowVisual({ copy }: { copy: Copy }) {
  return (
    <div
      className="relative overflow-hidden border border-border bg-card p-4 shadow-[0_24px_80px_rgba(0,0,0,0.12)] sm:p-5"
      role="img"
      aria-label={copy('exampleLabel')}
    >
      <div className="pointer-events-none absolute inset-0 bg-calibration-grid opacity-30" />
      <div className="lab-evidence-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--lab-accent)] opacity-70" />

      <div className="relative flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="lab-evidence-signal h-2 w-2 rounded-full bg-[var(--lab-accent)]" />
          {copy('exampleLabel')}
        </div>
        <span className="border border-border bg-background px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {copy('exampleRecord')}
        </span>
      </div>

      <div className="relative mt-4 border-l-2 border-[var(--lab-accent)] bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--lab-accent)]">
              {copy('templateLocked')}
            </p>
            <p className="lab-display mt-2 text-xl font-semibold text-foreground">H₂SO₄ standard</p>
          </div>
          <svg className="h-5 w-5 shrink-0 text-[var(--lab-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 15v2m-5 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2zm8-10V7a3 3 0 00-6 0v4h6z" />
          </svg>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{copy('target')}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">0.1000 mol/L</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{copy('asPrepared')}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">0.1002 mol/L</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
          <span>Δ +0.20%</span>
          <span>U(k=2) ±0.0003 mol/L</span>
        </div>
      </div>

      <div className="relative my-2 ml-5 h-5 border-l border-dashed border-[var(--lab-accent)]" aria-hidden="true">
        <span className="absolute -bottom-0.5 -left-1 h-2 w-2 rotate-45 border-b border-r border-[var(--lab-accent)]" />
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        <div className="border border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--lab-accent)] text-[var(--lab-accent)]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-xs font-semibold text-foreground">{copy('withinAcceptance')}</p>
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            LOT VC-0829 · CoA linked
          </p>
        </div>
        <div className="border border-border bg-background p-3">
          <p className="text-xs font-semibold text-foreground">{copy('released')}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {copy('reviewer')}
          </p>
        </div>
      </div>

      <div className="relative mt-3 border border-[var(--lab-accent)] bg-background p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--lab-accent)]">
              {copy('signedEvidence')}
            </p>
            <p className="mt-1 text-xs text-foreground">{copy('browserVerified')}</p>
          </div>
          <span className="lab-status-chip lab-status-released">Verified</span>
        </div>
        <div className="mt-3 flex h-9 items-end gap-1" aria-hidden="true">
          {EVIDENCE_BARS.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="lab-evidence-bar min-w-0 flex-1 bg-[var(--lab-accent)]"
              style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          <span>EdDSA / Ed25519</span>
          <span>{copy('publicKey')}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Public Lab-QC front door. The destination remains the authenticated `/lab`
 * workspace; this component intentionally has no data dependency or server call.
 */
export function LabQcSection() {
  const { t } = useTranslation('common')
  const copy = (key: LabQcCopyKey): string => {
    const path = `home.labQc.${key}`
    const translated = t(path)
    return translated === path ? enCommon.home.labQc[key] : translated
  }

  return (
    <section className="relative overflow-hidden border-b border-border bg-calibration-grid" aria-labelledby="lab-qc-heading">
      <div className="pointer-events-none absolute inset-0 bg-background opacity-[0.86]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--lab-accent)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(27rem,0.96fr)] lg:gap-16">
          <div className="animate-reveal">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lab-accent)]">
                {copy('eyebrow')}
              </p>
              <span className="border border-[var(--lab-accent)] px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--lab-accent)]">
                {copy('freeAccess')}
              </span>
            </div>

            <h1 id="lab-qc-heading" className="lab-display mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
              {copy('headline')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy('subhead')}
            </p>
            <p className="mt-6 max-w-2xl border-l-2 border-[var(--lab-accent)] pl-4 text-sm leading-relaxed text-foreground">
              {copy('context')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/lab"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--lab-accent)] px-6 py-3 font-semibold text-white transition-[opacity,transform] hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copy('openLab')}
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/verify"
                className="inline-flex min-h-12 items-center justify-center border border-border bg-card px-6 py-3 font-semibold text-foreground transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copy('verifyPack')}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground" aria-label="VerChem Lab trust properties">
              {[copy('proofTemplate'), copy('proofRelease'), copy('proofSigned')].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lab-accent)]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-reveal animate-reveal-delay-2">
            <EvidenceFlowVisual copy={copy} />
          </div>
        </div>

        <div className="mt-14 border-t border-[var(--lab-accent)] pt-7 lg:mt-16">
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label={copy('workflowLabel')}>
            {WORKFLOW_STEPS.map((step) => (
              <li key={step.number} className="border-l border-border pl-4">
                <div className="font-mono text-xs font-semibold tracking-[0.14em] text-[var(--lab-accent)]">{step.number}</div>
                <h2 className="lab-display mt-3 text-lg font-semibold text-foreground">
                  {copy(step.titleKey)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {copy(step.descriptionKey)}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-7 max-w-5xl border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
            {copy('limitation')}
          </p>
        </div>
      </div>
    </section>
  )
}
