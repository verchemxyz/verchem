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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section - SEO Optimized */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center gap-2 text-gray-400">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li>/</li>
              <li><Link href="/calculators" className="hover:text-white transition">Calculators</Link></li>
              <li>/</li>
              <li className="text-purple-400">Equation Balancer</li>
            </ol>
          </nav>

          {/* Main Heading - H1 for SEO */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-6">
              <span className="animate-pulse">⚡</span>
              Free Online Tool • No Sign-up Required
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="text-white">Chemical Equation</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Balancer
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Balance any chemical equation <strong className="text-white">instantly</strong>.
              Perfect for students, teachers, and chemists.
              <span className="text-purple-400"> 100% free, unlimited use.</span>
            </p>
          </div>

          {/* Main Calculator Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <label htmlFor="equation" className="block text-lg font-semibold text-white mb-3">
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
                    className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-2xl text-white text-xl font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    Press Enter ↵
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
                  {error}
                </div>
              )}

              <button
                onClick={handleBalance}
                disabled={isBalancing}
                className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
              >
                {isBalancing ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                    Balancing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-2xl">⚗️</span>
                    Balance Equation
                  </span>
                )}
              </button>
            </div>

            {/* Result Display */}
            {result && (
              <div className="mt-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">✨</span>
                  <h2 className="text-2xl font-bold text-white">Balanced Equation</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-black/20 rounded-xl">
                    <div className="text-sm text-gray-400 mb-1">Original:</div>
                    <div className="text-xl font-mono text-gray-300">{result.original}</div>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-xl border border-green-500/30">
                    <div className="text-sm text-green-300 mb-2">Balanced:</div>
                    <div className="text-3xl font-mono font-bold text-white">{result.balanced}</div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-2 bg-purple-500/20 rounded-lg">
                      <span className="text-gray-400 text-sm">Coefficients: </span>
                      <span className="text-white font-mono">[{result.coefficients.join(', ')}]</span>
                    </div>
                    {(() => {
                      const type = identifyReactionType(equation)
                      const info = getReactionTypeLabel(type)
                      return (
                        <div className={`px-4 py-2 ${info.color} rounded-lg`}>
                          <span className="text-white font-medium">{info.label}</span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Atom Count Table */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-400 text-sm">
                          <th className="text-left py-2 px-4">Element</th>
                          <th className="text-center py-2 px-4">Reactants</th>
                          <th className="text-center py-2 px-4">Products</th>
                          <th className="text-center py-2 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(result.atoms).map(([element, counts]) => (
                          <tr key={element} className="border-t border-white/10">
                            <td className="py-3 px-4 font-bold text-purple-400">{element}</td>
                            <td className="text-center py-3 px-4 text-white font-mono">{counts.reactants}</td>
                            <td className="text-center py-3 px-4 text-white font-mono">{counts.products}</td>
                            <td className="text-center py-3 px-4">
                              {counts.reactants === counts.products ? (
                                <span className="text-green-400">✓ Balanced</span>
                              ) : (
                                <span className="text-red-400">✗ Unbalanced</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Examples Section */}
      <section className="py-16 bg-black/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Try These Examples
          </h2>
          <p className="text-gray-400 text-center mb-10">
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
                className="text-left p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl transition-all group"
              >
                <div className="font-semibold text-white group-hover:text-purple-400 transition mb-1">
                  {example.name}
                </div>
                <div className="font-mono text-gray-400 text-sm mb-3">
                  {example.equation}
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                    {example.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    example.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                    example.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {example.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - SEO Content */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How to Balance Chemical Equations
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Our advanced algorithm uses matrix algebra and Gaussian elimination to balance any chemical equation in milliseconds
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '📝', title: 'Enter Equation', desc: 'Type your unbalanced chemical equation using standard notation (e.g., H2 + O2 -> H2O)' },
              { icon: '🔍', title: 'Parse & Analyze', desc: 'Our system identifies all elements and counts atoms on both sides of the equation' },
              { icon: '⚡', title: 'Calculate Coefficients', desc: 'Advanced algorithms find the smallest whole number coefficients that balance the equation' },
              { icon: '✅', title: 'Verify & Display', desc: 'We verify atom counts match and show you the balanced equation with detailed breakdown' },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform border border-white/10">
                  {step.icon}
                </div>
                <div className="text-sm text-purple-400 font-semibold mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reaction Types - SEO Content */}
      <section className="py-16 bg-black/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Types of Chemical Reactions
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Our balancer automatically identifies and labels reaction types
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'Synthesis', formula: 'A + B → AB', color: 'from-green-500/20 to-green-600/20 border-green-500/30', desc: 'Two substances combine to form one product' },
              { type: 'Decomposition', formula: 'AB → A + B', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30', desc: 'One compound breaks into simpler substances' },
              { type: 'Combustion', formula: 'CₓHᵧ + O₂ → CO₂ + H₂O', color: 'from-red-500/20 to-red-600/20 border-red-500/30', desc: 'Rapid reaction with oxygen producing heat' },
              { type: 'Redox', formula: 'Oxidation + Reduction', color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30', desc: 'Electron transfer between species' },
            ].map((r, i) => (
              <div key={i} className={`p-5 bg-gradient-to-br ${r.color} rounded-xl border`}>
                <h3 className="text-lg font-bold text-white mb-2">{r.type}</h3>
                <div className="font-mono text-sm text-gray-300 mb-3">{r.formula}</div>
                <p className="text-gray-400 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose VerChem Equation Balancer?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🚀', title: 'Lightning Fast', desc: 'Balance equations in milliseconds using advanced algorithms' },
              { icon: '🎯', title: '100% Accurate', desc: 'Verified against IUPAC standards with atom count verification' },
              { icon: '📱', title: 'Works Everywhere', desc: 'Use on any device - desktop, tablet, or mobile' },
              { icon: '🆓', title: 'Completely Free', desc: 'No sign-up, no limits, no hidden costs. Forever free!' },
              { icon: '🧪', title: 'All Reaction Types', desc: 'Handles synthesis, combustion, redox, and complex reactions' },
              { icon: '📚', title: 'Educational', desc: 'Shows step-by-step breakdown for learning' },
            ].map((f, i) => (
              <div key={i} className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - SEO */}
      <section className="py-16 bg-black/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              { q: 'How do I balance a chemical equation?', a: 'Simply enter your unbalanced equation using the format "Reactants -> Products" (e.g., H2 + O2 -> H2O). Use element symbols with subscripts as numbers (H2O, not H₂O). Our calculator will instantly provide the balanced equation with correct coefficients.' },
              { q: 'What is a balanced chemical equation?', a: 'A balanced chemical equation has equal numbers of each type of atom on both sides of the reaction arrow. This follows the Law of Conservation of Mass - matter cannot be created or destroyed in a chemical reaction.' },
              { q: 'Can this balance complex redox equations?', a: 'Yes! Our advanced algorithm can handle complex redox equations including those involving permanganate (MnO4⁻), dichromate (Cr2O7²⁻), and other challenging species. We support coefficients up to 20.' },
              { q: 'Is this calculator free to use?', a: 'Absolutely! VerChem Equation Balancer is 100% free with no usage limits. No sign-up required. Use it as many times as you need for homework, exams, or research.' },
              { q: 'How accurate is this equation balancer?', a: 'Our balancer uses matrix algebra (Gaussian elimination) combined with optimized search algorithms. Every result includes atom count verification to ensure 100% accuracy.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <summary className="p-6 cursor-pointer text-white font-semibold hover:text-purple-400 transition flex items-center justify-between">
                  {faq.q}
                  <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-gray-400">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Balance More Equations?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Explore our complete suite of chemistry calculators
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/stoichiometry" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition">
              Stoichiometry Calculator →
            </Link>
            <Link href="/periodic-table" className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition border border-white/20">
              Periodic Table →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 VerChem - Free Chemistry Calculators for Students Worldwide</p>
          <p className="mt-2">
            <Link href="/tools/molar-mass" className="hover:text-white transition">Molar Mass</Link>
            {' • '}
            <Link href="/tools/stoichiometry" className="hover:text-white transition">Stoichiometry</Link>
            {' • '}
            <Link href="/tools/ph-calculator" className="hover:text-white transition">pH Calculator</Link>
            {' • '}
            <Link href="/periodic-table" className="hover:text-white transition">Periodic Table</Link>
          </p>
        </div>
      </footer>
    </div>
    </>
  )
}
