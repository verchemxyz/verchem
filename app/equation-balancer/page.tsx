'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  balanceEquation,
  identifyReactionType,
  EXAMPLE_EQUATIONS,
} from '@/lib/calculations/equation-balancer'
import type { BalancedEquation } from '@/lib/types/chemistry'

export default function EquationBalancerPage() {
  const [equation, setEquation] = useState('')
  const [result, setResult] = useState<BalancedEquation | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Balance equation
  const handleBalance = () => {
    setError(null)
    setResult(null)

    if (!equation.trim()) {
      setError('Please enter a chemical equation')
      return
    }

    try {
      const balanced = balanceEquation(equation)

      if (!balanced.isBalanced) {
        setError('Could not balance equation. Please check your input.')
        return
      }

      setResult(balanced)
    } catch {
      setError('Invalid equation format. Use format: A + B -> C + D')
    }
  }

  // Load example
  const loadExample = (exampleEquation: string) => {
    setEquation(exampleEquation)
    setError(null)
    setResult(null)
  }

  // Get reaction type label
  const getReactionTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      synthesis: 'Synthesis (A + B → AB)',
      decomposition: 'Decomposition (AB → A + B)',
      'single-replacement': 'Single Replacement (A + BC → AC + B)',
      'double-replacement': 'Double Replacement (AB + CD → AD + CB)',
      combustion: 'Combustion (CₓHᵧ + O₂ → CO₂ + H₂O)',
      unknown: 'Unknown',
    }
    return labels[type] || 'Unknown'
  }

  return (
    <div className="min-h-screen hero-gradient-premium">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Equation Balancer</p>
            </div>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">⚗️ Auto-Balance • 10 Examples</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Chemical Equation</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Balancer
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Balance chemical equations automatically with step-by-step solutions and verification
          </p>
        </div>

        {/* Input Section */}
        <div className="premium-card p-8 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Chemical Equation
            </label>
            <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBalance()}
              placeholder="e.g., H2 + O2 -> H2O"
              className="input-premium w-full font-mono font-semibold"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Supported formats: A + B → C + D or A + B -&gt; C + D
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Balance Button */}
          <button
            onClick={handleBalance}
            className="btn-premium glow-premium w-full py-4 text-lg"
          >
            ⚗️ Balance Equation
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-6 mb-6">
            {/* Balanced Equation Result */}
            <div className="premium-card p-8 bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>✨</span> Balanced Equation
              </h2>

              {/* Original */}
              <div className="mb-6">
                <div className="text-sm opacity-90 mb-2">Original:</div>
                <div className="text-2xl font-mono bg-white/20 rounded-lg p-4">
                  {result.original}
                </div>
              </div>

              {/* Balanced */}
              <div>
                <div className="text-sm opacity-90 mb-2">Balanced:</div>
                <div className="text-3xl font-mono bg-white/20 rounded-lg p-4 font-bold animate-pulse-premium">
                  {result.balanced}
                </div>
              </div>

              {/* Coefficients */}
              <div className="mt-6 text-sm">
                <span className="opacity-90">Coefficients: </span>
                <span className="font-mono bg-white/20 px-3 py-1 rounded">
                  [{result.coefficients.join(', ')}]
                </span>
              </div>
            </div>

            {/* Atom Count Verification */}
            <div className="premium-card p-6">
              <h3 className="text-xl font-bold mb-4 text-primary-600">
                Atom Count Verification
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-purple-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Element</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Reactants</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Products</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.atoms).map(([element, counts]) => (
                      <tr key={element} className="border-b border-gray-100 hover:bg-purple-50">
                        <td className="py-3 px-4 font-bold text-purple-600">{element}</td>
                        <td className="text-center py-3 px-4 font-mono">{counts.reactants}</td>
                        <td className="text-center py-3 px-4 font-mono">{counts.products}</td>
                        <td className="text-center py-3 px-4">
                          {counts.reactants === counts.products ? (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              ✓ Balanced
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                              ✗ Unbalanced
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reaction Type */}
            <div className="premium-card p-6">
              <h3 className="text-xl font-bold mb-4 text-primary-600">
                Reaction Type
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔬</span>
                </div>
                <div>
                  <div className="font-bold text-lg text-foreground">
                    {identifyReactionType(equation)}
                  </div>
                  <div className="text-muted-foreground">
                    {getReactionTypeLabel(identifyReactionType(equation))}
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="premium-card p-6">
              <h3 className="text-xl font-bold mb-4 text-primary-600">
                How Balancing Works
              </h3>
              <div className="space-y-3 text-foreground">
                <div className="flex gap-3">
                  <span className="font-bold text-purple-600">1.</span>
                  <div>
                    <span className="font-semibold">Parse equation</span> - Identify reactants and products
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-purple-600">2.</span>
                  <div>
                    <span className="font-semibold">Count atoms</span> - Extract element counts from each compound
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-purple-600">3.</span>
                  <div>
                    <span className="font-semibold">Find coefficients</span> - Use algebraic method or brute force
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-purple-600">4.</span>
                  <div>
                    <span className="font-semibold">Verify balance</span> - Ensure atom counts match on both sides
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-purple-600">5.</span>
                  <div>
                    <span className="font-semibold">Simplify</span> - Reduce coefficients to smallest whole numbers
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="premium-card p-6">
          <h3 className="text-xl font-bold mb-4 text-primary-600">
            Quick Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLE_EQUATIONS.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example.equation)}
                className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-surface-hover transition-all"
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {example.name}
                </div>
                <div className="text-sm font-mono text-gray-600">
                  {example.equation}
                </div>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    {example.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 premium-card p-6 bg-primary-50/50 border-2 border-primary-200">
          <h3 className="font-bold text-primary-600 mb-3 flex items-center gap-2">
            <span>💡</span> Tips for Using the Balancer
          </h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li>• Use capital letters for element symbols (e.g., H2O not h2o)</li>
            <li>• Separate compounds with + (e.g., H2 + O2)</li>
            <li>• Use -&gt; or → for the arrow</li>
            <li>• Include subscripts as numbers after elements (e.g., H2O, Ca(OH)2)</li>
            <li>• The balancer works with most common chemical equations</li>
            <li>• Complex equations may take a moment to process</li>
          </ul>
        </div>

        {/* Reference */}
        <div className="mt-6 premium-card p-6">
          <h3 className="text-xl font-bold mb-4 text-primary-600">
            Common Reaction Types
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-primary-100 rounded-lg p-4 hover:border-primary-300 hover:bg-surface-hover transition-all">
              <div className="font-bold text-foreground mb-2">Synthesis</div>
              <div className="text-sm text-muted-foreground font-mono mb-2">A + B → AB</div>
              <div className="text-xs text-muted-foreground">
                Two or more substances combine to form one product
              </div>
            </div>
            <div className="border-2 border-primary-100 rounded-lg p-4 hover:border-primary-300 hover:bg-surface-hover transition-all">
              <div className="font-bold text-foreground mb-2">Decomposition</div>
              <div className="text-sm text-muted-foreground font-mono mb-2">AB → A + B</div>
              <div className="text-xs text-muted-foreground">
                One substance breaks down into two or more products
              </div>
            </div>
            <div className="border-2 border-primary-100 rounded-lg p-4 hover:border-primary-300 hover:bg-surface-hover transition-all">
              <div className="font-bold text-foreground mb-2">Single Replacement</div>
              <div className="text-sm text-muted-foreground font-mono mb-2">A + BC → AC + B</div>
              <div className="text-xs text-muted-foreground">
                One element replaces another in a compound
              </div>
            </div>
            <div className="border-2 border-primary-100 rounded-lg p-4 hover:border-primary-300 hover:bg-surface-hover transition-all">
              <div className="font-bold text-foreground mb-2">Double Replacement</div>
              <div className="text-sm text-muted-foreground font-mono mb-2">AB + CD → AD + CB</div>
              <div className="text-xs text-muted-foreground">
                Two compounds exchange ions or elements
              </div>
            </div>
            <div className="border-2 border-primary-100 rounded-lg p-4 hover:border-primary-300 hover:bg-surface-hover transition-all">
              <div className="font-bold text-foreground mb-2">Combustion</div>
              <div className="text-sm text-muted-foreground font-mono mb-2">
                CₓHᵧ + O₂ → CO₂ + H₂O
              </div>
              <div className="text-xs text-muted-foreground">
                Hydrocarbon reacts with oxygen to produce CO₂ and H₂O
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            VerChem Equation Balancer • Built with ❤️ for chemistry students
            worldwide
          </p>
        </div>
      </footer>
    </div>
  )
}
