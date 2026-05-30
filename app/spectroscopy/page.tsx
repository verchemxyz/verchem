import Link from 'next/link'
import { CalcShell, Card, SectionTitle } from '@/components/lab'

const SPECTROSCOPY_TOOLS = [
  {
    href: '/spectroscopy/ir',
    title: 'IR Spectrum Interpreter',
    subtitle: 'Infrared Spectroscopy',
    description:
      'Enter wavenumber peaks to identify functional groups. Search by group name to find expected absorption ranges. Complete IR correlation table included.',
    highlights: [
      'Peak identification from wavenumber input',
      'Functional group search',
      '30+ absorption entries with examples',
      'Grouped by category for fast lookup',
    ],
    tag: '4000-400 cm\u207B\u00B9',
  },
  {
    href: '/spectroscopy/nmr',
    title: 'NMR Chemical Shift Analyzer',
    subtitle: 'Nuclear Magnetic Resonance',
    description:
      'Look up proton (\u00B9H) and carbon (\u00B9\u00B3C) chemical shifts. Identify environments from ppm values. Includes solvent reference table and visual shift scale.',
    highlights: [
      '\u00B9H and \u00B9\u00B3C shift identification',
      'Visual chemical shift scale',
      'NMR solvent reference table',
      'Environment search by keyword',
    ],
    tag: '\u00B9H & \u00B9\u00B3C',
  },
  {
    href: '/spectroscopy/mass-spec',
    title: 'Mass Spec Analyzer',
    subtitle: 'Mass Spectrometry',
    description:
      'Identify fragment losses, common ions, and isotope patterns. Predict M/M+1/M+2 ratios from molecular formula. Check the nitrogen rule and explore McLafferty rearrangement.',
    highlights: [
      'Fragment loss identifier',
      'Isotope pattern predictor',
      'Common ion database',
      'Nitrogen rule checker',
    ],
    tag: 'm/z Analysis',
  },
] as const

const TECHNIQUE_GUIDE = [
  {
    question: 'What functional groups are present?',
    technique: 'IR Spectroscopy',
    reason:
      'IR detects bond vibrations. Each functional group (O-H, C=O, N-H, etc.) absorbs at characteristic frequencies, making IR the first choice for identifying functional groups.',
    link: '/spectroscopy/ir',
  },
  {
    question: 'What is the molecular structure / connectivity?',
    technique: 'NMR Spectroscopy',
    reason:
      'NMR reveals how atoms are connected. Chemical shifts indicate electronic environment, splitting patterns show neighboring protons, and integration gives relative numbers of protons.',
    link: '/spectroscopy/nmr',
  },
  {
    question: 'What is the molecular weight / formula?',
    technique: 'Mass Spectrometry',
    reason:
      'MS measures molecular weight directly from the molecular ion peak. Fragmentation patterns reveal structural subunits, and isotope patterns identify elements like Cl, Br, and S.',
    link: '/spectroscopy/mass-spec',
  },
] as const

export default function SpectroscopyHubPage() {
  return (
    <CalcShell
      eyebrow="Spectroscopy · 3 analysis tools"
      title="Spectroscopy Tools"
      subtitle="Interpret IR, NMR, and Mass Spectra with interactive reference tools. Enter your experimental data and identify peaks, shifts, and fragments instantly."
      backHref="/tools"
      backLabel="All tools"
      maxWidth="7xl"
    >
      {/* Tool Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {SPECTROSCOPY_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-lg border border-border bg-card hover:border-primary-500/40 hover:bg-muted transition-colors p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 border border-border bg-muted rounded-md flex items-center justify-center text-primary-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-muted text-primary-600 border border-border">
                {tool.tag}
              </span>
            </div>

            <h3 className="text-xl font-bold text-card-foreground group-hover:text-primary-600 transition-colors mb-1">
              {tool.title}
            </h3>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {tool.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
              {tool.description}
            </p>

            <ul className="space-y-1.5 mb-4">
              {tool.highlights.map((h, i) => (
                <li
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary-600 mt-0.5">&#10003;</span>
                  {h}
                </li>
              ))}
            </ul>

            <div className="text-sm text-primary-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Open tool &rarr;
            </div>
          </Link>
        ))}
      </section>

      {/* How to Choose */}
      <section className="pt-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            How to Choose the Right Technique
          </h3>
          <p className="text-muted-foreground">
            Start with the question you need to answer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TECHNIQUE_GUIDE.map((item, i) => (
            <Link
              key={i}
              href={item.link}
              className="group bg-card border border-border rounded-lg p-6 hover:border-primary-500/40 hover:bg-muted transition-colors"
            >
              <p className="text-sm font-semibold text-primary-600 mb-2">
                &ldquo;{item.question}&rdquo;
              </p>
              <h4 className="text-lg font-bold text-card-foreground mb-2">
                {item.technique}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.reason}
              </p>
              <p className="mt-3 text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Try it &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Study Guide */}
      <Card className="p-8">
        <SectionTitle className="mb-4">Spectroscopy Study Guide</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h4 className="font-semibold text-card-foreground mb-2">
                General Workflow for Unknown Identification
              </h4>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  <strong>Mass Spec first</strong> &mdash; determine molecular
                  weight and molecular formula from the molecular ion peak and
                  isotope pattern.
                </li>
                <li>
                  <strong>Calculate degrees of unsaturation</strong> (DBE) from
                  the formula to assess rings and double bonds.
                </li>
                <li>
                  <strong>IR next</strong> &mdash; identify functional groups
                  (O-H, C=O, N-H, C-H, etc.) to narrow structural
                  possibilities.
                </li>
                <li>
                  <strong>NMR last</strong> &mdash; determine connectivity,
                  symmetry, and detailed structure from chemical shifts,
                  splitting, and integration.
                </li>
                <li>
                  <strong>Confirm</strong> &mdash; ensure all spectra are
                  consistent with the proposed structure.
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-card-foreground mb-2">
                Key Concepts
              </h4>
              <ul className="space-y-1.5">
                <li>
                  <strong>Degrees of Unsaturation</strong>: DBE = (2C + 2 + N -
                  H - X) / 2. A benzene ring contributes 4.
                </li>
                <li>
                  <strong>Nitrogen Rule</strong>: Odd molecular weight implies an
                  odd number of nitrogen atoms.
                </li>
                <li>
                  <strong>D&#8322;O Shake</strong>: Exchangeable protons (O-H,
                  N-H) disappear after adding D&#8322;O in NMR.
                </li>
                <li>
                  <strong>13 Rule</strong>: Divide (MW - nitrogen correction) by
                  13 to estimate number of carbons as a starting point.
                </li>
                <li>
                  <strong>Isotope Patterns</strong>: Cl gives M:M+2 = 3:1; Br
                  gives M:M+2 = 1:1; S gives a noticeable M+2.
                </li>
              </ul>
            </div>
          </div>
      </Card>

      {/* Footer link */}
      <section className="text-center">
        <p className="text-sm text-muted-foreground">
          Part of the{' '}
          <Link
            href="/tools"
            className="text-primary-600 hover:underline font-medium"
          >
            VerChem Tools
          </Link>{' '}
          collection.
        </p>
      </section>
    </CalcShell>
  )
}
