'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  balanceEquation,
  identifyReactionType,
  getReactionTypeLabel,
  EXAMPLE_EQUATIONS,
} from '@/lib/calculations/equation-balancer'
import type { BalancedEquation } from '@/lib/types/chemistry'

function EquationBalancerContent() {
  const searchParams = useSearchParams()
  const initialEquation = searchParams.get('equation')
  
  const [equation, setEquation] = useState(initialEquation || '')
  const [result, setResult] = useState<BalancedEquation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBalancing, setIsBalancing] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)

  // Balance equation - defined before useEffect that uses it
  const handleBalance = useCallback(async (equationToBalance?: string) => {
    const targetEquation = equationToBalance ?? equation

    // If we're balancing a new string (e.g. from examples), update state too
    if (equationToBalance && equationToBalance !== equation) {
      setEquation(equationToBalance)
    }

    setError(null)
    setResult(null)
    setIsBalancing(true)

    if (!targetEquation.trim()) {
      setError('Please enter a chemical equation')
      setIsBalancing(false)
      return
    }

    // Small delay for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const balanced = balanceEquation(targetEquation)

      if (!balanced.isBalanced) {
        setError(
          'Could not balance equation. This may be a complex redox equation or the equation may be invalid. Please check your input and try again.'
        )
        setIsBalancing(false)
        return
      }

      setResult(balanced)
    } catch {
      setError('Invalid equation format. Use format: A + B -> C + D')
    }

    setIsBalancing(false)
  }, [equation])

  // Auto-balance on load if equation is provided in URL
  useEffect(() => {
    if (initialEquation) {
      // Defer to avoid setState in effect warning
      const id = requestAnimationFrame(() => {
        handleBalance(initialEquation)
      })
      return () => cancelAnimationFrame(id)
    }
  }, [initialEquation, handleBalance])

  // Load example
  const loadExample = (exampleEquation: string) => {
    handleBalance(exampleEquation)
  }

  // Filter examples by difficulty
  const filteredExamples = selectedDifficulty
    ? EXAMPLE_EQUATIONS.filter((ex) => ex.difficulty === selectedDifficulty)
    : EXAMPLE_EQUATIONS

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'hard':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
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
          <div className="badge-premium mb-4">⚗️ Auto-Balance • {EXAMPLE_EQUATIONS.length} Examples • Redox Support</div>
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
            onClick={() => handleBalance()}
            disabled={isBalancing}
            className="btn-premium glow-premium w-full py-4 text-lg disabled:opacity-50"
          >
            {isBalancing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                Balancing...
              </span>
            ) : (
              '⚗️ Balance Equation'
            )}
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
              {(() => {
                const reactionType = identifyReactionType(equation)
                const typeInfo = getReactionTypeLabel(reactionType)
                return (
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${typeInfo.color} rounded-lg flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl text-white">🔬</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-xl text-foreground">
                        {typeInfo.label}
                      </div>
                      <div className="text-muted-foreground text-sm mt-1">
                        {typeInfo.description}
                      </div>
                    </div>
                    <span className={`px-3 py-1 ${typeInfo.color} rounded-full text-sm font-medium text-white`}>
                      {reactionType.toUpperCase()}
                    </span>
                  </div>
                )
              })()}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-primary-600">
              Quick Examples ({filteredExamples.length})
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedDifficulty(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedDifficulty === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedDifficulty === 'easy'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setSelectedDifficulty('medium')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedDifficulty === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setSelectedDifficulty('hard')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedDifficulty === 'hard'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Hard
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example.equation)}
                className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-surface-hover transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-gray-900">
                    {example.name}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(example.difficulty)}`}>
                    {example.difficulty}
                  </span>
                </div>
                <div className="text-sm font-mono text-gray-600 mt-2 break-all">
                  {example.equation}
                </div>
                <div className="mt-2 flex gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 hover:bg-green-50/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="font-bold text-foreground">Synthesis</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">A + B → AB</div>
              <div className="text-xs text-muted-foreground">
                Two or more substances combine to form one product
              </div>
            </div>
            <div className="border-2 border-orange-200 rounded-lg p-4 hover:border-orange-400 hover:bg-orange-50/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="font-bold text-foreground">Decomposition</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">AB → A + B</div>
              <div className="text-xs text-muted-foreground">
                One substance breaks down into two or more products
              </div>
            </div>
            <div className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="font-bold text-foreground">Single Replacement</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">A + BC → AC + B</div>
              <div className="text-xs text-muted-foreground">
                One element replaces another in a compound
              </div>
            </div>
            <div className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 hover:bg-purple-50/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="font-bold text-foreground">Double Replacement</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">AB + CD → AD + CB</div>
              <div className="text-xs text-muted-foreground">
                Two compounds exchange ions or elements
              </div>
            </div>
            <div className="border-2 border-red-200 rounded-lg p-4 hover:border-red-400 hover:bg-red-50/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="font-bold text-foreground">Combustion</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">
                CₓHᵧ + O₂ → CO₂ + H₂O
              </div>
              <div className="text-xs text-muted-foreground">
                Hydrocarbon reacts with oxygen producing heat
              </div>
            </div>
            <div className="border-2 border-yellow-200 rounded-lg p-4 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="font-bold text-foreground">Redox</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">
                Oxidation + Reduction
              </div>
              <div className="text-xs text-muted-foreground">
                Electron transfer between species
              </div>
            </div>
            <div className="border-2 border-cyan-200 rounded-lg p-4 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                <span className="font-bold text-foreground">Acid-Base</span>
              </div>
              <div className="text-sm text-muted-foreground font-mono mb-2">
                HX + MOH → MX + H₂O
              </div>
              <div className="text-xs text-muted-foreground">
                Neutralization forming salt and water
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

export default function EquationBalancerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-gradient-premium flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>}>
      <EquationBalancerContent />
    </Suspense>
  )
}

