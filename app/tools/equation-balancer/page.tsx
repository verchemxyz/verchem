'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  balanceEquation,
  identifyReactionType,
  getReactionTypeLabel,
  EXAMPLE_EQUATIONS,
} from '@/lib/calculations/equation-balancer'
import type { BalancedEquation } from '@/lib/types/chemistry'
import { EquationBalancerSchema } from '@/components/seo/JsonLd'
import { CalcShell, Card, SectionTitle, Button, ErrorBanner } from '@/components/lab'

// SEO-optimized landing page for "chemical equation balancer"
export default function EquationBalancerToolPage() {
  const [equation, setEquation] = useState('')
  const [result, setResult] = useState<BalancedEquation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBalancing, setIsBalancing] = useState(false)

  const handleBalance = async () => {
    setError(null)
    setResult(null)
    setIsBalancing(true)

    if (!equation.trim()) {
      setError('Please enter a chemical equation')
      setIsBalancing(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const balanced = balanceEquation(equation)
      if (!balanced.isBalanced) {
        setError('Could not balance equation. Please check your input.')
        setIsBalancing(false)
        return
      }
      setResult(balanced)
    } catch {
      setError('Invalid equation format. Use format: A + B -> C + D')
    }
    setIsBalancing(false)
  }

  return (
    <>
      <EquationBalancerSchema />
      <CalcShell
        eyebrow="Free online tool · no sign-up required"
        title="Chemical Equation Balancer"
        subtitle="Balance any chemical equation instantly. Perfect for students, teachers, and chemists. 100% free, unlimited use."
        backHref="/tools"
        backLabel="All tools"
        maxWidth="6xl"
      >
        {/* Main Calculator Card */}
        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <label htmlFor="equation" className="block text-lg font-semibold text-foreground mb-3">
              Enter Your Chemical Equation
            </label>
            <div className="relative">
              <input
                id="equation"
                type="text"
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBalance()}
                placeholder="e.g., H2 + O2 -> H2O"
                className="input-premium w-full text-xl font-mono pr-32"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                Press Enter ↵
              </div>
            </div>
          </div>

          {error && <div className="mb-6"><ErrorBanner>{error}</ErrorBanner></div>}

          <Button
            onClick={handleBalance}
            disabled={isBalancing}
            className="w-full text-lg"
          >
            {isBalancing ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Balancing...
              </span>
            ) : (
              'Balance Equation'
            )}
          </Button>
        </Card>

        {/* Result Display */}
        {result && (
          <Card className="p-6 sm:p-8 border-l-2 border-l-primary-500">
            <SectionTitle className="mb-6">Balanced Equation</SectionTitle>

            <div className="space-y-4">
              <div className="p-4 bg-muted border border-border rounded-md">
                <div className="text-sm text-muted-foreground mb-1">Original:</div>
                <div className="text-xl font-mono text-foreground">{result.original}</div>
              </div>

              <div className="p-6 bg-muted border border-border rounded-md">
                <div className="text-sm text-primary-600 mb-2 uppercase tracking-wider font-medium">Balanced:</div>
                <div className="text-3xl font-mono font-bold text-foreground break-words">{result.balanced}</div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-muted border border-border rounded-md">
                  <span className="text-muted-foreground text-sm">Coefficients: </span>
                  <span className="text-foreground font-mono">[{result.coefficients.join(', ')}]</span>
                </div>
                {(() => {
                  const type = identifyReactionType(equation)
                  const info = getReactionTypeLabel(type)
                  return (
                    <div className={`px-4 py-2 ${info.color} rounded-md`}>
                      <span className="text-white font-medium">{info.label}</span>
                    </div>
                  )
                })()}
              </div>

              {/* Atom Count Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground text-sm">
                      <th className="text-left py-2 px-4">Element</th>
                      <th className="text-center py-2 px-4">Reactants</th>
                      <th className="text-center py-2 px-4">Products</th>
                      <th className="text-center py-2 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.atoms).map(([element, counts]) => (
                      <tr key={element} className="border-t border-border">
                        <td className="py-3 px-4 font-bold text-primary-600">{element}</td>
                        <td className="text-center py-3 px-4 text-foreground font-mono">{counts.reactants}</td>
                        <td className="text-center py-3 px-4 text-foreground font-mono">{counts.products}</td>
                        <td className="text-center py-3 px-4">
                          {counts.reactants === counts.products ? (
                            <span className="text-success">✓ Balanced</span>
                          ) : (
                            <span className="text-destructive">✗ Unbalanced</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Examples Section */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            Try These Examples
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-8">
            Click any equation below to balance it instantly
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMPLE_EQUATIONS.slice(0, 9).map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  setEquation(example.equation)
                  setResult(null)
                  setError(null)
                }}
                className="text-left p-5 bg-card border border-border hover:border-primary-500 hover:bg-muted rounded-lg transition-colors group"
              >
                <div className="font-semibold text-foreground group-hover:text-primary-600 transition-colors mb-1">
                  {example.name}
                </div>
                <div className="font-mono text-muted-foreground text-sm mb-3">
                  {example.equation}
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-muted border border-border text-muted-foreground rounded text-xs">
                    {example.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs border ${
                    example.difficulty === 'easy' ? 'border-success/40 bg-success/10 text-success' :
                    example.difficulty === 'medium' ? 'border-warning/40 bg-warning/10 text-warning' :
                    'border-destructive/40 bg-destructive/10 text-destructive'
                  }`}>
                    {example.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* How It Works - SEO Content */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            How to Balance Chemical Equations
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Our advanced algorithm uses matrix algebra and Gaussian elimination to balance any chemical equation in milliseconds
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: 'Enter Equation', desc: 'Type your unbalanced chemical equation using standard notation (e.g., H2 + O2 -> H2O)' },
              { title: 'Parse & Analyze', desc: 'Our system identifies all elements and counts atoms on both sides of the equation' },
              { title: 'Calculate Coefficients', desc: 'Advanced algorithms find the smallest whole number coefficients that balance the equation' },
              { title: 'Verify & Display', desc: 'We verify atom counts match and show you the balanced equation with detailed breakdown' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-md flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                  {i + 1}
                </div>
                <div className="text-sm text-primary-600 font-semibold mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Reaction Types - SEO Content */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            Types of Chemical Reactions
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-8">
            Our balancer automatically identifies and labels reaction types
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'Synthesis', formula: 'A + B → AB', desc: 'Two substances combine to form one product' },
              { type: 'Decomposition', formula: 'AB → A + B', desc: 'One compound breaks into simpler substances' },
              { type: 'Combustion', formula: 'CₓHᵧ + O₂ → CO₂ + H₂O', desc: 'Rapid reaction with oxygen producing heat' },
              { type: 'Redox', formula: 'Oxidation + Reduction', desc: 'Electron transfer between species' },
            ].map((r, i) => (
              <div key={i} className="p-5 bg-muted border border-border rounded-lg">
                <h3 className="text-lg font-bold text-foreground mb-2">{r.type}</h3>
                <div className="font-mono text-sm text-foreground mb-3">{r.formula}</div>
                <p className="text-muted-foreground text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Features Grid */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Why Choose VerChem Equation Balancer?
          </SectionTitle>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Lightning Fast', desc: 'Balance equations in milliseconds using advanced algorithms' },
              { title: '100% Accurate', desc: 'Verified against IUPAC standards with atom count verification' },
              { title: 'Works Everywhere', desc: 'Use on any device - desktop, tablet, or mobile' },
              { title: 'Completely Free', desc: 'No sign-up, no limits, no hidden costs. Forever free!' },
              { title: 'All Reaction Types', desc: 'Handles synthesis, combustion, redox, and complex reactions' },
              { title: 'Educational', desc: 'Shows step-by-step breakdown for learning' },
            ].map((f, i) => (
              <div key={i} className="p-6 bg-muted border border-border rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ Section - SEO */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Frequently Asked Questions
          </SectionTitle>

          <div className="space-y-4">
            {[
              { q: 'How do I balance a chemical equation?', a: 'Simply enter your unbalanced equation using the format "Reactants -> Products" (e.g., H2 + O2 -> H2O). Use element symbols with subscripts as numbers (H2O, not H₂O). Our calculator will instantly provide the balanced equation with correct coefficients.' },
              { q: 'What is a balanced chemical equation?', a: 'A balanced chemical equation has equal numbers of each type of atom on both sides of the reaction arrow. This follows the Law of Conservation of Mass - matter cannot be created or destroyed in a chemical reaction.' },
              { q: 'Can this balance complex redox equations?', a: 'Yes! Our advanced algorithm can handle complex redox equations including those involving permanganate (MnO4⁻), dichromate (Cr2O7²⁻), and other challenging species. We support coefficients up to 20.' },
              { q: 'Is this calculator free to use?', a: 'Absolutely! VerChem Equation Balancer is 100% free with no usage limits. No sign-up required. Use it as many times as you need for homework, exams, or research.' },
              { q: 'How accurate is this equation balancer?', a: 'Our balancer uses matrix algebra (Gaussian elimination) combined with optimized search algorithms. Every result includes atom count verification to ensure 100% accuracy.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-muted rounded-lg border border-border overflow-hidden">
                <summary className="p-6 cursor-pointer text-foreground font-semibold hover:text-primary-600 transition-colors flex items-center justify-between">
                  {faq.q}
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="p-6 sm:p-8 text-center">
          <SectionTitle className="text-2xl mb-2">
            Ready to Balance More Equations?
          </SectionTitle>
          <p className="text-muted-foreground mb-8">
            Explore our complete suite of chemistry calculators
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/stoichiometry"
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium px-6 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors"
            >
              Stoichiometry Calculator →
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Periodic Table →
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <footer className="pt-2 text-center text-muted-foreground text-sm">
          <p>© 2025 VerChem - Free Chemistry Calculators for Students Worldwide</p>
          <p className="mt-2">
            <Link href="/tools/molar-mass" className="hover:text-primary-600 transition-colors">Molar Mass</Link>
            {' • '}
            <Link href="/tools/stoichiometry" className="hover:text-primary-600 transition-colors">Stoichiometry</Link>
            {' • '}
            <Link href="/tools/ph-calculator" className="hover:text-primary-600 transition-colors">pH Calculator</Link>
            {' • '}
            <Link href="/periodic-table" className="hover:text-primary-600 transition-colors">Periodic Table</Link>
          </p>
        </footer>
      </CalcShell>
    </>
  )
}
