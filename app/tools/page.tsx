import type { Metadata } from 'next'
import Link from 'next/link'
import { CalcShell, SectionTitle } from '@/components/lab'

export const metadata: Metadata = {
  title: 'All Tools | VerChem',
  description:
    'Free chemistry tools: calculators, periodic table, organic chemistry, spectroscopy (IR/NMR/MS), lab safety, nuclear & quantum chemistry, solution prep, and more.',
}

// ============================================
// CHEMISTRY TOOLS
// ============================================

const CHEMISTRY_TOOLS = [
  {
    href: '/tools/molar-mass',
    label: 'Molar Mass Calculator',
    description: 'Molecular weight with element-by-element breakdown (NIST-validated atomic masses).',
  },
  {
    href: '/tools/substructure-search',
    label: 'Substructure Search',
    description: 'Draw a fragment, find every compound that contains it — substructure & similarity over a verified structure library (RDKit).',
  },
  {
    href: '/tools/periodic-table',
    label: 'Periodic Table',
    description: 'Interactive periodic table with essential data for all 118 elements.',
  },
  {
    href: '/tools/equation-balancer',
    label: 'Equation Balancer',
    description: 'Balance chemical equations automatically and learn the stoichiometric ratios.',
  },
  {
    href: '/tools/stoichiometry',
    label: 'Stoichiometry Tool',
    description: 'Moles, limiting reagent, and theoretical yield — fast and beginner-friendly.',
  },
  {
    href: '/tools/ph-calculator',
    label: 'pH Calculator',
    description: 'Calculate pH, pOH, and concentrations for common acid/base problems.',
  },
  {
    href: '/tools/gas-laws',
    label: 'Gas Laws Calculator',
    description: 'Ideal gas law and common gas relationships for quick checks.',
  },
] as const

// ============================================
// ORGANIC CHEMISTRY TOOLS
// ============================================

const ORGANIC_TOOLS = [
  {
    href: '/organic/functional-groups',
    label: 'Functional Groups',
    description: 'Interactive guide to 22 functional groups with properties, spectroscopy, and reactions.',
  },
  {
    href: '/organic/reactions',
    label: 'Named Reactions',
    description: '40 named reactions with step-by-step mechanisms, conditions, and examples.',
  },
  {
    href: '/organic/predict',
    label: 'Reaction Predictor',
    description: 'Select a functional group and reagent to predict the product with mechanism.',
  },
] as const

// ============================================
// SPECTROSCOPY TOOLS
// ============================================

const SPECTROSCOPY_TOOLS = [
  {
    href: '/spectroscopy/ir',
    label: 'IR Spectrum Interpreter',
    description: 'Enter IR peaks (cm⁻¹) to identify functional groups with correlation table.',
  },
  {
    href: '/spectroscopy/nmr',
    label: 'NMR Analyzer',
    description: '¹H and ¹³C chemical shift lookup with environment identification.',
  },
  {
    href: '/spectroscopy/mass-spec',
    label: 'Mass Spec Analyzer',
    description: 'Fragment loss ID, isotope patterns, nitrogen rule, and common ion lookup.',
  },
] as const

// ============================================
// LAB & PRACTICAL TOOLS
// ============================================

const LAB_TOOLS = [
  {
    href: '/tools/solution-prep',
    label: 'Solution Preparation',
    description: 'Dilution (C₁V₁=C₂V₂), stock solutions, serial dilutions, unit conversion, and mixing.',
  },
  {
    href: '/tools/lab-safety',
    label: 'Lab Safety & SDS',
    description: 'GHS pictograms, chemical compatibility, emergency procedures, H/P statements.',
  },
] as const

// ============================================
// ADVANCED CHEMISTRY TOOLS
// ============================================

const ADVANCED_TOOLS = [
  {
    href: '/tools/nuclear',
    label: 'Nuclear Chemistry',
    description: 'Radioactive decay, half-life, binding energy, mass-energy (E=mc²), isotope database.',
  },
  {
    href: '/tools/quantum',
    label: 'Quantum Chemistry',
    description: 'Quantum numbers, orbitals, de Broglie wavelength, hydrogen energy levels, Bohr model.',
  },
] as const

// ============================================
// SECTION DEFINITIONS
// ============================================

const SECTIONS = [
  {
    id: 'chemistry',
    title: 'Chemistry Tools',
    blurb: 'Calculators and reference tools for chemistry',
    tools: CHEMISTRY_TOOLS,
  },
  {
    id: 'organic',
    title: 'Organic Chemistry',
    blurb: 'Functional groups, named reactions, and reaction prediction',
    tools: ORGANIC_TOOLS,
    hubHref: '/organic',
    hubLabel: 'View Organic Chemistry Hub',
  },
  {
    id: 'spectroscopy',
    title: 'Spectroscopy Tools',
    blurb: 'IR, NMR, and Mass Spectrometry interpretation',
    tools: SPECTROSCOPY_TOOLS,
    hubHref: '/spectroscopy',
    hubLabel: 'View Spectroscopy Hub',
  },
  {
    id: 'lab',
    title: 'Lab & Practical',
    blurb: 'Solution preparation, safety data, and lab essentials',
    tools: LAB_TOOLS,
  },
  {
    id: 'advanced',
    title: 'Advanced Chemistry',
    blurb: 'Nuclear chemistry and quantum mechanics',
    tools: ADVANCED_TOOLS,
  },
] as const

// ============================================
// MAIN COMPONENT
// ============================================

export default function ToolsPage() {
  return (
    <CalcShell
      eyebrow="VerChem · free chemistry workbench"
      title="All Tools"
      subtitle="Professional tools for chemistry education. All free, all world-class quality."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-3">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="px-5 py-2 rounded-md border border-border bg-muted text-foreground font-medium hover:bg-card hover:border-primary-500 transition-colors text-sm"
          >
            {section.title} ({section.tools.length})
          </a>
        ))}
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <div className="mb-6">
            <SectionTitle className="text-2xl">{section.title}</SectionTitle>
            <p className="text-sm text-muted-foreground mt-1">{section.blurb}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-lg border border-border bg-card hover:border-primary-500 transition-colors p-5"
              >
                <h4 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                  {tool.label}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                <div className="mt-3 text-sm text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>

          {'hubHref' in section && section.hubHref && (
            <div className="mt-4">
              <Link href={section.hubHref} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                {section.hubLabel} →
              </Link>
            </div>
          )}
        </section>
      ))}

      {/* Footer Note */}
      <p className="text-sm text-muted-foreground text-center pt-2">
        Need the full experience? Browse the protected calculators hub at{' '}
        <Link href="/calculators" className="text-primary-600 hover:underline">
          /calculators
        </Link>
        .
      </p>
    </CalcShell>
  )
}
