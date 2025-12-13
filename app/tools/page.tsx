import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Free chemistry tools: molar mass, periodic table, equation balancer, stoichiometry, pH calculator, and gas laws.',
}

const TOOL_LINKS = [
  {
    href: '/tools/molar-mass',
    label: 'Molar Mass Calculator',
    description: 'Molecular weight with element-by-element breakdown (NIST-validated atomic masses).',
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

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      <header className="border-b border-header-border bg-header-bg backdrop-blur-sm sticky top-0 z-40">
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
        <section className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3 text-foreground">Chemistry Tools</h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Fast, free, and SEO-friendly tools for common chemistry tasks — built with the same VerChem quality standards.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOL_LINKS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-xl border-2 border-border bg-card hover:border-primary-500 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground group-hover:text-primary-600">
                  {tool.label}
                </h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
              <div className="mt-4 text-sm text-primary-600 font-medium">Open tool →</div>
            </Link>
          ))}
        </section>

        <section className="mt-10 text-center">
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

