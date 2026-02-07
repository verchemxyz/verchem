import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

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
    icon: '⚖️',
    label: 'Molar Mass Calculator',
    description: 'Molecular weight with element-by-element breakdown (NIST-validated atomic masses).',
  },
  {
    href: '/tools/periodic-table',
    icon: '⚛️',
    label: 'Periodic Table',
    description: 'Interactive periodic table with essential data for all 118 elements.',
  },
  {
    href: '/tools/equation-balancer',
    icon: '⚗️',
    label: 'Equation Balancer',
    description: 'Balance chemical equations automatically and learn the stoichiometric ratios.',
  },
  {
    href: '/tools/stoichiometry',
    icon: '📐',
    label: 'Stoichiometry Tool',
    description: 'Moles, limiting reagent, and theoretical yield — fast and beginner-friendly.',
  },
  {
    href: '/tools/ph-calculator',
    icon: '🧪',
    label: 'pH Calculator',
    description: 'Calculate pH, pOH, and concentrations for common acid/base problems.',
  },
  {
    href: '/tools/gas-laws',
    icon: '💨',
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
    icon: '🔬',
    label: 'Functional Groups',
    description: 'Interactive guide to 22 functional groups with properties, spectroscopy, and reactions.',
  },
  {
    href: '/organic/reactions',
    icon: '⚗️',
    label: 'Named Reactions',
    description: '40 named reactions with step-by-step mechanisms, conditions, and examples.',
  },
  {
    href: '/organic/predict',
    icon: '🎯',
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
    icon: '📡',
    label: 'IR Spectrum Interpreter',
    description: 'Enter IR peaks (cm⁻¹) to identify functional groups with correlation table.',
  },
  {
    href: '/spectroscopy/nmr',
    icon: '🧲',
    label: 'NMR Analyzer',
    description: '¹H and ¹³C chemical shift lookup with environment identification.',
  },
  {
    href: '/spectroscopy/mass-spec',
    icon: '⚡',
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
    icon: '🧫',
    label: 'Solution Preparation',
    description: 'Dilution (C₁V₁=C₂V₂), stock solutions, serial dilutions, unit conversion, and mixing.',
  },
  {
    href: '/tools/lab-safety',
    icon: '🛡️',
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
    icon: '☢️',
    label: 'Nuclear Chemistry',
    description: 'Radioactive decay, half-life, binding energy, mass-energy (E=mc²), isotope database.',
  },
  {
    href: '/tools/quantum',
    icon: '🔮',
    label: 'Quantum Chemistry',
    description: 'Quantum numbers, orbitals, de Broglie wavelength, hydrogen energy levels, Bohr model.',
  },
] as const

// ============================================
// MAIN COMPONENT
// ============================================

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <Link href="/" className="text-secondary-600 hover:text-primary-600 transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Page Title */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3 text-foreground">All Tools</h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Professional tools for chemistry and environmental engineering. All free, all world-class quality.
          </p>
        </section>

        {/* Quick Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <a
            href="#chemistry"
            className="px-5 py-2 bg-primary-100 text-primary-700 rounded-full font-medium hover:bg-primary-200 transition-colors text-sm"
          >
            🧪 Chemistry ({CHEMISTRY_TOOLS.length})
          </a>
          <a
            href="#organic"
            className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full font-medium hover:bg-emerald-200 transition-colors text-sm"
          >
            🔬 Organic ({ORGANIC_TOOLS.length})
          </a>
          <a
            href="#spectroscopy"
            className="px-5 py-2 bg-violet-100 text-violet-700 rounded-full font-medium hover:bg-violet-200 transition-colors text-sm"
          >
            📡 Spectroscopy ({SPECTROSCOPY_TOOLS.length})
          </a>
          <a
            href="#lab"
            className="px-5 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium hover:bg-indigo-200 transition-colors text-sm"
          >
            🧫 Lab & Practical ({LAB_TOOLS.length})
          </a>
          <a
            href="#advanced"
            className="px-5 py-2 bg-amber-100 text-amber-700 rounded-full font-medium hover:bg-amber-200 transition-colors text-sm"
          >
            ☢️ Advanced ({ADVANCED_TOOLS.length})
          </a>
        </div>

        {/* Chemistry Section */}
        <section id="chemistry" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-xl">
              🧪
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Chemistry Tools</h3>
              <p className="text-sm text-muted-foreground">Calculators and reference tools for chemistry</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHEMISTRY_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border-2 border-border bg-card hover:border-primary-500 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h4 className="font-semibold text-card-foreground group-hover:text-primary-600 transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Organic Chemistry Section */}
        <section id="organic" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-xl">
              🔬
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Organic Chemistry</h3>
              <p className="text-sm text-muted-foreground">Functional groups, named reactions, and reaction prediction</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ORGANIC_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border-2 border-border bg-card hover:border-emerald-500 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h4 className="font-semibold text-card-foreground group-hover:text-emerald-600 transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Link href="/organic" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View Organic Chemistry Hub →
            </Link>
          </div>
        </section>

        {/* Spectroscopy Section */}
        <section id="spectroscopy" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-xl">
              📡
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Spectroscopy Tools</h3>
              <p className="text-sm text-muted-foreground">IR, NMR, and Mass Spectrometry interpretation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPECTROSCOPY_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border-2 border-border bg-card hover:border-violet-500 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h4 className="font-semibold text-card-foreground group-hover:text-violet-600 transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-violet-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Link href="/spectroscopy" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              View Spectroscopy Hub →
            </Link>
          </div>
        </section>

        {/* Lab & Practical Section */}
        <section id="lab" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-xl">
              🧫
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Lab & Practical</h3>
              <p className="text-sm text-muted-foreground">Solution preparation, safety data, and lab essentials</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAB_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border-2 border-border bg-card hover:border-indigo-500 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h4 className="font-semibold text-card-foreground group-hover:text-indigo-600 transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Advanced Chemistry Section */}
        <section id="advanced" className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-xl">
              ☢️
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Advanced Chemistry</h3>
              <p className="text-sm text-muted-foreground">Nuclear chemistry and quantum mechanics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANCED_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border-2 border-border bg-card hover:border-amber-500 hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h4 className="font-semibold text-card-foreground group-hover:text-amber-600 transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer Note */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground">
            Need the full experience? Browse the protected calculators hub at{' '}
            <Link href="/calculators" className="text-primary-600 hover:underline">
              /calculators
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  )
}
