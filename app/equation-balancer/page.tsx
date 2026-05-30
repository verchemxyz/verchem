'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
  ResultPanel,
  ErrorBanner,
} from '@/components/lab'
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

  // Get difficulty color (semantic: easy/medium/hard severity scale)
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success/10 text-success border-success/30'
      case 'medium':
        return 'bg-warning/10 text-warning-strong border-warning/30'
      case 'hard':
        return 'bg-destructive/10 text-destructive border-destructive/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <CalcShell
      eyebrow={`Inorganic chemistry · ${EXAMPLE_EQUATIONS.length} worked examples · redox support`}
      title="Chemical Equation Balancer"
      subtitle="Balance chemical equations automatically with atom-count verification and reaction typing."
      backHref="/"
      backLabel="Home"
    >
      {/* Input Section */}
      <Card className="p-6">
        <Field label="Chemical equation" htmlFor="equation-input">
          <input
            id="equation-input"
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleBalance()}
            placeholder="e.g., H2 + O2 -> H2O"
            className="input-premium w-full font-mono font-semibold"
          />
        </Field>
        <p className="mt-2 text-sm text-muted-foreground">
          Supported formats: A + B → C + D or A + B -&gt; C + D
        </p>

        {/* Error */}
        {error && (
          <div className="mt-6">
            <ErrorBanner>{error}</ErrorBanner>
          </div>
        )}

        {/* Balance Button */}
        <Button
          onClick={() => handleBalance()}
          disabled={isBalancing}
          className="w-full mt-6"
        >
          {isBalancing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></span>
              Balancing...
            </span>
          ) : (
            'Balance equation'
          )}
        </Button>
      </Card>

      {/* Result */}
      {result && (
        <>
          {/* Balanced Equation Result */}
          <ResultPanel label="Balanced equation">
            {result.balanced}
          </ResultPanel>

          <Card className="p-6">
            <SectionTitle className="mb-4">Details</SectionTitle>
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Original</div>
                <div className="font-mono text-foreground bg-muted border border-border rounded-md p-3 break-words">
                  {result.original}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Coefficients</div>
                <div className="font-mono text-foreground bg-muted border border-border rounded-md p-3">
                  [{result.coefficients.join(', ')}]
                </div>
              </div>
            </div>
          </Card>

          {/* Atom Count Verification */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Atom count verification</SectionTitle>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Element</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Reactants</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Products</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.atoms).map(([element, counts]) => (
                    <tr key={element} className="border-b border-border hover:bg-muted">
                      <td className="py-3 px-4 font-bold font-mono text-primary-600">{element}</td>
                      <td className="text-center py-3 px-4 font-mono text-foreground">{counts.reactants}</td>
                      <td className="text-center py-3 px-4 font-mono text-foreground">{counts.products}</td>
                      <td className="text-center py-3 px-4">
                        {counts.reactants === counts.products ? (
                          <span className="inline-flex items-center px-3 py-1 bg-success/10 text-success border border-success/30 rounded-full text-sm font-semibold">
                            Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-destructive/10 text-destructive border border-destructive/30 rounded-full text-sm font-semibold">
                            Unbalanced
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Reaction Type */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Reaction type</SectionTitle>
            {(() => {
              const reactionType = identifyReactionType(equation)
              const typeInfo = getReactionTypeLabel(reactionType)
              return (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-bold text-xl text-foreground">
                      {typeInfo.label}
                    </div>
                    <div className="text-muted-foreground text-sm mt-1">
                      {typeInfo.description}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary-500 text-primary-foreground rounded-full text-sm font-medium">
                    {reactionType.toUpperCase()}
                  </span>
                </div>
              )
            })()}
          </Card>

          {/* How It Works */}
          <Card className="p-6">
            <SectionTitle className="mb-4">How balancing works</SectionTitle>
            <div className="space-y-3 text-foreground">
              <div className="flex gap-3">
                <span className="font-bold font-mono text-primary-600">1.</span>
                <div>
                  <span className="font-semibold">Parse equation</span> - Identify reactants and products
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-bold font-mono text-primary-600">2.</span>
                <div>
                  <span className="font-semibold">Count atoms</span> - Extract element counts from each compound
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-bold font-mono text-primary-600">3.</span>
                <div>
                  <span className="font-semibold">Find coefficients</span> - Use algebraic method or brute force
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-bold font-mono text-primary-600">4.</span>
                <div>
                  <span className="font-semibold">Verify balance</span> - Ensure atom counts match on both sides
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-bold font-mono text-primary-600">5.</span>
                <div>
                  <span className="font-semibold">Simplify</span> - Reduce coefficients to smallest whole numbers
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Examples */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <SectionTitle>
            Quick examples ({filteredExamples.length})
          </SectionTitle>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDifficulty(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedDifficulty === null
                  ? 'bg-primary-500 text-primary-foreground border-primary-500'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedDifficulty('easy')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedDifficulty === 'easy'
                  ? 'bg-success text-success-foreground border-success'
                  : 'bg-success/10 text-success border-success/30 hover:bg-success/20'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setSelectedDifficulty('medium')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedDifficulty === 'medium'
                  ? 'bg-warning text-warning-foreground border-warning'
                  : 'bg-warning/10 text-warning-strong border-warning/30 hover:bg-warning/20'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSelectedDifficulty('hard')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                selectedDifficulty === 'hard'
                  ? 'bg-destructive text-destructive-foreground border-destructive'
                  : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
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
              className="text-left p-4 border border-border rounded-lg hover:border-primary-500 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-foreground">
                  {example.name}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(example.difficulty)}`}>
                  {example.difficulty}
                </span>
              </div>
              <div className="text-sm font-mono text-muted-foreground mt-2 break-all">
                {example.equation}
              </div>
              <div className="mt-2 flex gap-2">
                <span className="inline-block px-2 py-1 bg-muted text-muted-foreground border border-border rounded text-xs">
                  {example.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-6">
        <SectionTitle className="mb-3">Tips for using the balancer</SectionTitle>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Use capital letters for element symbols (e.g., H2O not h2o)</li>
          <li>• Separate compounds with + (e.g., H2 + O2)</li>
          <li>• Use -&gt; or → for the arrow</li>
          <li>• Include subscripts as numbers after elements (e.g., H2O, Ca(OH)2)</li>
          <li>• The balancer works with most common chemical equations</li>
          <li>• Complex equations may take a moment to process</li>
        </ul>
      </Card>

      {/* Reference */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Common reaction types</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors">
            <div className="font-bold text-foreground mb-2">Synthesis</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">A + B → AB</div>
            <div className="text-xs text-muted-foreground">
              Two or more substances combine to form one product
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors">
            <div className="font-bold text-foreground mb-2">Decomposition</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">AB → A + B</div>
            <div className="text-xs text-muted-foreground">
              One substance breaks down into two or more products
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors">
            <div className="font-bold text-foreground mb-2">Single replacement</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">A + BC → AC + B</div>
            <div className="text-xs text-muted-foreground">
              One element replaces another in a compound
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors">
            <div className="font-bold text-foreground mb-2">Double replacement</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">AB + CD → AD + CB</div>
            <div className="text-xs text-muted-foreground">
              Two compounds exchange ions or elements
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors">
            <div className="font-bold text-foreground mb-2">Combustion</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">
              CₓHᵧ + O₂ → CO₂ + H₂O
            </div>
            <div className="text-xs text-muted-foreground">
              Hydrocarbon reacts with oxygen producing heat
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors">
            <div className="font-bold text-foreground mb-2">Redox</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">
              Oxidation + Reduction
            </div>
            <div className="text-xs text-muted-foreground">
              Electron transfer between species
            </div>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary-500/40 hover:bg-muted transition-colors md:col-span-2 lg:col-span-1">
            <div className="font-bold text-foreground mb-2">Acid-base</div>
            <div className="text-sm text-muted-foreground font-mono mb-2">
              HX + MOH → MX + H₂O
            </div>
            <div className="text-xs text-muted-foreground">
              Neutralization forming salt and water
            </div>
          </div>
        </div>
      </Card>
    </CalcShell>
  )
}

export default function EquationBalancerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>}>
      <EquationBalancerContent />
    </Suspense>
  )
}
