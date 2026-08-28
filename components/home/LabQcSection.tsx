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
    <section className="border-t-2 border-[var(--lab-accent)] border-b border-border" aria-labelledby="lab-qc-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <article className="lab-document p-5 sm:p-8 lg:p-10">
          <header className="border-b-2 border-[var(--lab-accent)] pb-7">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {copy('eyebrow')}
            </p>
            <h2 id="lab-qc-heading" className="lab-display mt-4 max-w-4xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {copy('headline')}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy('subhead')}
            </p>
            <p className="mt-5 border-l-2 border-[var(--lab-accent)] pl-4 text-sm leading-relaxed text-foreground">
              {copy('context')}
            </p>
          </header>

          <ol className="mt-8 grid gap-x-8 gap-y-7 md:grid-cols-2" aria-label={copy('workflowLabel')}>
            {WORKFLOW_STEPS.map((step) => (
              <li key={step.number} className="border-t-2 border-[var(--lab-accent)] pt-4">
                <div className="font-mono text-xs font-semibold tracking-[0.14em] text-[var(--lab-accent)]">{step.number}</div>
                <h3 className="lab-display mt-3 text-xl font-semibold text-foreground">
                  {copy(step.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {copy(step.descriptionKey)}
                </p>
              </li>
            ))}
          </ol>

          <footer className="mt-10 border-t border-border pt-6">
            <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">
              {copy('limitation')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/lab"
                className="inline-flex min-h-[44px] items-center justify-center bg-[var(--lab-accent)] px-5 py-2.5 font-medium text-white transition-colors hover:opacity-90"
              >
                {copy('openLab')}
              </Link>
              <Link
                href="/verify"
                className="inline-flex min-h-[44px] items-center justify-center border border-border bg-card px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-muted"
              >
                {copy('verifyPack')}
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </section>
  )
}
