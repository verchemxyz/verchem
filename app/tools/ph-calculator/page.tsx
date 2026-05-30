'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Beaker, Calculator, CheckCircle, Droplets, FlaskConical, Sparkles, Zap } from 'lucide-react'
import { PHCalculatorSchema } from '@/components/seo/JsonLd'
import { CalcShell, Card, SectionTitle, Button, ErrorBanner } from '@/components/lab'

type CalculationType = 'ph' | 'poh' | 'h+' | 'oh-'

interface CalculationResult {
  pH: number
  pOH: number
  hConcentration: number
  ohConcentration: number
  acidBase: 'acidic' | 'neutral' | 'basic'
}

function calculateFrompH(pH: number): CalculationResult {
  const pOH = 14 - pH
  const hConcentration = Math.pow(10, -pH)
  const ohConcentration = Math.pow(10, -pOH)
  const acidBase = pH < 7 ? 'acidic' : pH > 7 ? 'basic' : 'neutral'
  return { pH, pOH, hConcentration, ohConcentration, acidBase }
}

function calculateFrompOH(pOH: number): CalculationResult {
  const pH = 14 - pOH
  return calculateFrompH(pH)
}

function calculateFromH(hConcentration: number): CalculationResult {
  const pH = -Math.log10(hConcentration)
  return calculateFrompH(pH)
}

function calculateFromOH(ohConcentration: number): CalculationResult {
  const pOH = -Math.log10(ohConcentration)
  return calculateFrompOH(pOH)
}

const pH_EXAMPLES = [
  { name: 'Battery Acid', pH: 0 },
  { name: 'Stomach Acid', pH: 1.5 },
  { name: 'Lemon Juice', pH: 2.4 },
  { name: 'Vinegar', pH: 2.9 },
  { name: 'Orange Juice', pH: 3.5 },
  { name: 'Coffee', pH: 5 },
  { name: 'Pure Water', pH: 7 },
  { name: 'Blood', pH: 7.4 },
  { name: 'Seawater', pH: 8.1 },
  { name: 'Baking Soda', pH: 9 },
  { name: 'Ammonia', pH: 11.5 },
  { name: 'Bleach', pH: 12.5 },
  { name: 'Drain Cleaner', pH: 14 },
]

export default function PHCalculatorPage() {
  const [calcType, setCalcType] = useState<CalculationType>('ph')
  const [inputValue, setInputValue] = useState('')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = useCallback(() => {
    const value = parseFloat(inputValue)
    if (isNaN(value)) {
      setError('Please enter a valid number')
      return
    }

    setIsCalculating(true)
    setError('')

    setTimeout(() => {
      try {
        let calcResult: CalculationResult

        switch (calcType) {
          case 'ph':
            if (value < 0 || value > 14) {
              throw new Error('pH must be between 0 and 14')
            }
            calcResult = calculateFrompH(value)
            break
          case 'poh':
            if (value < 0 || value > 14) {
              throw new Error('pOH must be between 0 and 14')
            }
            calcResult = calculateFrompOH(value)
            break
          case 'h+':
            if (value <= 0) {
              throw new Error('[H+] must be positive')
            }
            calcResult = calculateFromH(value)
            break
          case 'oh-':
            if (value <= 0) {
              throw new Error('[OH-] must be positive')
            }
            calcResult = calculateFromOH(value)
            break
          default:
            throw new Error('Invalid calculation type')
        }

        setResult(calcResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation error')
        setResult(null)
      }
      setIsCalculating(false)
    }, 300)
  }, [calcType, inputValue])

  // pH scale spectrum — this gradient encodes acid→neutral→base data, not decoration.
  const getpHGradient = () => {
    return `linear-gradient(to right, #ef4444 0%, #f97316 14%, #eab308 28%, #22c55e 50%, #06b6d4 64%, #3b82f6 78%, #8b5cf6 100%)`
  }

  // Acidic / neutral / basic → semantic tokens (data meaning preserved).
  // Full literal class strings so Tailwind's content scanner picks them up.
  const ACID_BASE_STYLES: Record<CalculationResult['acidBase'], { box: string; text: string }> = {
    acidic: { box: 'border-destructive/40 bg-destructive/10', text: 'text-destructive' },
    neutral: { box: 'border-success/40 bg-success/10', text: 'text-success' },
    basic: { box: 'border-info/40 bg-info/10', text: 'text-info' },
  }

  return (
    <>
      <PHCalculatorSchema />
      <CalcShell
        eyebrow="Acid–base chemistry"
        title="pH Calculator"
        subtitle="Calculate pH, pOH, and ion concentrations instantly. Perfect for chemistry homework, lab work, and understanding acid-base reactions."
        backHref="/tools"
        backLabel="All tools"
        maxWidth="6xl"
      >
        {/* Capability strip */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> 100% Free
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Instant Results
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Visual pH Scale
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> No Sign-up
          </span>
        </div>

        {/* Calculator */}
        <Card className="p-6 sm:p-8">
          <div className="space-y-6">
            {/* Calculation Type Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Calculate From
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { type: 'ph' as const, label: 'pH' },
                  { type: 'poh' as const, label: 'pOH' },
                  { type: 'h+' as const, label: '[H⁺]' },
                  { type: 'oh-' as const, label: '[OH⁻]' },
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setCalcType(option.type)}
                    className={`rounded-md px-4 py-3 font-medium transition-colors ${
                      calcType === option.type
                        ? 'bg-primary-500 text-primary-foreground'
                        : 'border border-border bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div>
              <label htmlFor="ph-input" className="block text-sm font-medium text-foreground mb-2">
                Enter {calcType === 'ph' ? 'pH' : calcType === 'poh' ? 'pOH' : calcType === 'h+' ? '[H⁺] (M)' : '[OH⁻] (M)'}
              </label>
              <div className="flex gap-4">
                <input
                  id="ph-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                  placeholder={calcType === 'ph' || calcType === 'poh' ? 'e.g., 7' : 'e.g., 1e-7'}
                  className="input-premium flex-1 text-xl font-mono"
                />
                <Button onClick={handleCalculate} disabled={isCalculating}>
                  {isCalculating ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    'Calculate'
                  )}
                </Button>
              </div>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            {result && (
              <div className="space-y-6">
                {/* pH Scale Visualization (data gradient kept) */}
                <div className="rounded-lg border border-border bg-muted p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">pH Scale Position</h3>
                  <div className="relative h-12 rounded-full overflow-hidden"
                       style={{ background: getpHGradient() }}>
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                      style={{ left: `${(result.pH / 14) * 100}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-foreground font-bold text-lg">
                        {result.pH.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>Acidic (0)</span>
                    <span>Neutral (7)</span>
                    <span>Basic (14)</span>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-muted p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">pH</p>
                    <p className="text-4xl font-bold text-foreground font-mono">
                      {result.pH.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">pOH</p>
                    <p className="text-4xl font-bold text-foreground font-mono">
                      {result.pOH.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">[H⁺]</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {result.hConcentration.toExponential(2)} M
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">[OH⁻]</p>
                    <p className="text-2xl font-bold text-foreground font-mono">
                      {result.ohConcentration.toExponential(2)} M
                    </p>
                  </div>
                </div>

                {/* Solution Type (semantic token by acidity) */}
                <div className={`rounded-lg p-6 text-center border ${ACID_BASE_STYLES[result.acidBase].box}`}>
                  <p className="text-lg font-semibold text-foreground">
                    This solution is{' '}
                    <span className={ACID_BASE_STYLES[result.acidBase].text}>
                      {result.acidBase.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* pH Scale Examples */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            pH Scale Examples
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Common substances and their typical pH values
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pH_EXAMPLES.map((example) => (
              <button
                key={example.name}
                onClick={() => {
                  setCalcType('ph')
                  setInputValue(example.pH.toString())
                  setResult(calculateFrompH(example.pH))
                  setError('')
                }}
                className="group rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary-500 hover:bg-muted"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">{example.name}</span>
                  <ArrowRight className="h-4 w-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-muted-foreground font-mono text-sm">pH {example.pH}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Formulas */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            pH Formulas &amp; Relationships
          </SectionTitle>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted p-6">
              <Beaker className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-4">Basic Formulas</h3>
              <div className="space-y-3 font-mono text-foreground">
                <p>pH = -log₁₀[H⁺]</p>
                <p>pOH = -log₁₀[OH⁻]</p>
                <p>pH + pOH = 14</p>
                <p>[H⁺][OH⁻] = 10⁻¹⁴</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted p-6">
              <FlaskConical className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-4">Conversions</h3>
              <div className="space-y-3 font-mono text-foreground">
                <p>[H⁺] = 10⁻ᵖᴴ</p>
                <p>[OH⁻] = 10⁻ᵖᴼᴴ</p>
                <p>pOH = 14 - pH</p>
                <p>pH = 14 - pOH</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Why Use Our pH Calculator?
          </SectionTitle>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Calculations',
                description: 'Get pH, pOH, and ion concentrations in milliseconds'
              },
              {
                icon: Sparkles,
                title: 'Visual pH Scale',
                description: 'See exactly where your solution falls on the pH spectrum'
              },
              {
                icon: Calculator,
                title: 'Multiple Inputs',
                description: 'Calculate from pH, pOH, [H+], or [OH-] concentration'
              },
              {
                icon: Beaker,
                title: 'Lab Accuracy',
                description: 'Precise calculations suitable for laboratory work'
              },
              {
                icon: Droplets,
                title: 'Common Examples',
                description: 'Quick reference for everyday substances and their pH'
              },
              {
                icon: FlaskConical,
                title: 'Educational',
                description: 'Perfect for learning acid-base chemistry concepts'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-muted p-6"
              >
                <feature.icon className="h-8 w-8 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Frequently Asked Questions
          </SectionTitle>

          <div className="space-y-6">
            {[
              {
                q: 'What is pH?',
                a: 'pH is a measure of how acidic or basic a solution is, on a scale from 0 to 14. pH 7 is neutral, below 7 is acidic, and above 7 is basic (alkaline). It\'s defined as the negative logarithm of hydrogen ion concentration.'
              },
              {
                q: 'What\'s the relationship between pH and pOH?',
                a: 'pH and pOH are complementary measurements. At 25°C, pH + pOH = 14. If you know one value, you can easily calculate the other by subtracting from 14.'
              },
              {
                q: 'Why is pH important?',
                a: 'pH affects chemical reactions, biological processes, and material properties. It\'s crucial in medicine (blood pH), agriculture (soil pH), cooking, water treatment, and countless industrial processes.'
              },
              {
                q: 'What pH is safe for drinking water?',
                a: 'The EPA recommends drinking water have a pH between 6.5 and 8.5. Most tap water falls within this range. Very acidic or basic water can corrode pipes and may indicate contamination.'
              },
              {
                q: 'Can pH be negative or greater than 14?',
                a: 'Yes! While rare, concentrated strong acids can have negative pH values, and concentrated strong bases can exceed pH 14. However, the 0-14 scale covers most practical situations.'
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted p-6"
              >
                <h3 className="text-lg font-semibold text-foreground mb-3">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-6 sm:p-8 text-center">
          <SectionTitle className="text-2xl mb-6">
            Explore More Chemistry Tools
          </SectionTitle>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/equation-balancer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Equation Balancer
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Molar Mass
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Stoichiometry
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center justify-center gap-2 rounded-md font-medium px-6 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors"
            >
              Interactive Periodic Table
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </CalcShell>
    </>
  )
}
