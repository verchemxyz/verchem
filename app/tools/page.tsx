import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'All Tools | VerChem',
  description:
    'Free chemistry and environmental engineering tools: calculators, periodic table, equation balancer, wastewater treatment, water/air/soil quality analysis.',
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
// ENVIRONMENTAL TOOLS
// ============================================

const ENVIRONMENTAL_TOOLS: Array<{
  href: string
  icon: string
  label: string
  description: string
  isHot?: boolean
}> = [
  {
    href: '/tools/wastewater-treatment',
    icon: '🏭',
    label: 'Wastewater Treatment Designer',
    description: 'Design complete treatment trains with 15+ units. Visual builder, cost estimation, Thai PCD compliance.',
    isHot: true,
  },
  {
    href: '/tools/water-quality',
    icon: '💧',
    label: 'Water Quality Calculator',
    description: 'BOD, COD, Thai effluent standards compliance — 9 calculation modes for environmental engineers.',
  },
  {
    href: '/tools/air-quality',
    icon: '🌬️',
    label: 'Air Quality Calculator',
    description: 'AQI, ppm/µg/m³ conversion, Thai PCD standards, Gaussian dispersion — 6 modes.',
  },
  {
    href: '/tools/soil-quality',
    icon: '🌱',
    label: 'Soil Quality Calculator',
    description: 'Heavy metal contamination (Thai PCD), pH classification, NPK analysis, CEC — 7 modes.',
  },
  {
    href: '/tools/asm1-simulator',
    icon: '🧬',
    label: 'ASM1 Biokinetic Simulator',
    description: 'IWA Activated Sludge Model No. 1. Research-grade simulation with 8 processes, 13 state variables.',
    isHot: true,
  },
  {
    href: '/tools/asm2d-simulator',
    icon: '🦠',
    label: 'ASM2d Phosphorus Removal',
    description: 'IWA Activated Sludge Model No. 2d. Biological phosphorus removal with PAO/dPAO, 21 processes.',
    isHot: true,
  },
  {
    href: '/tools/adm1-simulator',
    icon: '🔥',
    label: 'ADM1 Anaerobic Digester',
    description: 'IWA Anaerobic Digestion Model No. 1. Biogas production, 24 state variables, 19 processes.',
    isHot: true,
  },
]

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
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <a
            href="#chemistry"
            className="px-6 py-2 bg-primary-100 text-primary-700 rounded-full font-medium hover:bg-primary-200 transition-colors"
          >
            🧪 Chemistry ({CHEMISTRY_TOOLS.length})
          </a>
          <a
            href="#environmental"
            className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-medium hover:bg-emerald-200 transition-colors"
          >
            🌍 Environmental ({ENVIRONMENTAL_TOOLS.length})
          </a>
          <Link
            href="/environmental"
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
          >
            Environmental Hub →
          </Link>
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

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-16"></div>

        {/* Environmental Section */}
        <section id="environmental" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-xl">
                🌍
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Environmental Engineering</h3>
                <p className="text-sm text-muted-foreground">Professional tools with Thai PCD standards</p>
              </div>
            </div>
            <Link
              href="/environmental"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
            >
              View Hub
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ENVIRONMENTAL_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group relative rounded-xl border-2 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 hover:shadow-lg transition-all ${
                  tool.isHot
                    ? 'border-emerald-500 hover:border-emerald-400'
                    : 'border-emerald-200 hover:border-emerald-400'
                }`}
              >
                {tool.isHot && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-10">
                    🔥 HOT
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div>
                    <h4 className="font-semibold text-emerald-800 group-hover:text-emerald-600 transition-colors">
                      {tool.label}
                    </h4>
                    <p className="text-sm text-emerald-700/80 mt-1">{tool.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>

          {/* Environmental CTA */}
          <div className="mt-6 p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white text-center">
            <h4 className="text-lg font-bold mb-2">Looking for comprehensive environmental tools?</h4>
            <p className="text-emerald-100 mb-4">Visit our Environmental Engineering Hub for full features and documentation.</p>
            <Link
              href="/environmental"
              className="inline-block px-6 py-2 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Go to Environmental Hub →
            </Link>
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
