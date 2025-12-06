'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Beaker, Calculator, CheckCircle, Droplets, FlaskConical, Sparkles, Zap } from 'lucide-react'
import { PHCalculatorSchema } from '@/components/seo/JsonLd'

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
  { name: 'Battery Acid', pH: 0, color: 'from-red-600 to-red-500' },
  { name: 'Stomach Acid', pH: 1.5, color: 'from-red-500 to-orange-500' },
  { name: 'Lemon Juice', pH: 2.4, color: 'from-orange-500 to-orange-400' },
  { name: 'Vinegar', pH: 2.9, color: 'from-orange-400 to-yellow-500' },
  { name: 'Orange Juice', pH: 3.5, color: 'from-yellow-500 to-yellow-400' },
  { name: 'Coffee', pH: 5, color: 'from-yellow-400 to-green-400' },
  { name: 'Pure Water', pH: 7, color: 'from-green-400 to-green-500' },
  { name: 'Blood', pH: 7.4, color: 'from-green-500 to-teal-400' },
  { name: 'Seawater', pH: 8.1, color: 'from-teal-400 to-cyan-400' },
  { name: 'Baking Soda', pH: 9, color: 'from-cyan-400 to-blue-400' },
  { name: 'Ammonia', pH: 11.5, color: 'from-blue-400 to-blue-500' },
  { name: 'Bleach', pH: 12.5, color: 'from-blue-500 to-purple-500' },
  { name: 'Drain Cleaner', pH: 14, color: 'from-purple-500 to-purple-600' },
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

  const getpHColor = (pH: number) => {
    if (pH <= 2) return 'text-red-500'
    if (pH <= 4) return 'text-orange-500'
    if (pH <= 6) return 'text-yellow-500'
    if (pH <= 8) return 'text-green-500'
    if (pH <= 10) return 'text-cyan-500'
    if (pH <= 12) return 'text-blue-500'
    return 'text-purple-500'
  }

  const getpHGradient = (pH: number) => {
    const position = (pH / 14) * 100
    return `linear-gradient(to right, #ef4444 0%, #f97316 14%, #eab308 28%, #22c55e 50%, #06b6d4 64%, #3b82f6 78%, #8b5cf6 100%)`
  }

  return (
    <>
      <PHCalculatorSchema />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 mb-6">
              <Droplets className="h-4 w-4" />
              Acid-Base Chemistry Made Easy
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              pH
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-green-400 to-blue-400">
                Calculator
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Calculate pH, pOH, and ion concentrations instantly.
              Perfect for chemistry homework, lab work, and understanding acid-base reactions.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                100% Free
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Instant Results
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Visual pH Scale
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                No Sign-up
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900/90 to-blue-900/20 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
            <div className="space-y-6">
              {/* Calculation Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
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
                      className={`rounded-xl px-4 py-3 font-medium transition-all ${
                        calcType === option.type
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter {calcType === 'ph' ? 'pH' : calcType === 'poh' ? 'pOH' : calcType === 'h+' ? '[H⁺] (M)' : '[OH⁻] (M)'}
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                    placeholder={calcType === 'ph' || calcType === 'poh' ? 'e.g., 7' : 'e.g., 1e-7'}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-xl text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                  <button
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 font-semibold text-white transition-all hover:from-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {isCalculating ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Calculate'
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* pH Scale Visualization */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">pH Scale Position</h3>
                    <div className="relative h-12 rounded-full overflow-hidden"
                         style={{ background: getpHGradient(result.pH) }}>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                        style={{ left: `${(result.pH / 14) * 100}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white font-bold text-lg">
                          {result.pH.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-red-400">Acidic (0)</span>
                      <span className="text-green-400">Neutral (7)</span>
                      <span className="text-blue-400">Basic (14)</span>
                    </div>
                  </div>

                  {/* Results Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
                      <p className="text-sm text-blue-300 mb-1">pH</p>
                      <p className={`text-4xl font-bold ${getpHColor(result.pH)}`}>
                        {result.pH.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-center">
                      <p className="text-sm text-cyan-300 mb-1">pOH</p>
                      <p className="text-4xl font-bold text-cyan-400">
                        {result.pOH.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="text-sm text-slate-300 mb-1">[H⁺]</p>
                      <p className="text-2xl font-bold text-white font-mono">
                        {result.hConcentration.toExponential(2)} M
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="text-sm text-slate-300 mb-1">[OH⁻]</p>
                      <p className="text-2xl font-bold text-white font-mono">
                        {result.ohConcentration.toExponential(2)} M
                      </p>
                    </div>
                  </div>

                  {/* Solution Type */}
                  <div className={`rounded-2xl p-6 text-center ${
                    result.acidBase === 'acidic' ? 'border border-red-500/30 bg-red-500/10' :
                    result.acidBase === 'basic' ? 'border border-blue-500/30 bg-blue-500/10' :
                    'border border-green-500/30 bg-green-500/10'
                  }`}>
                    <p className="text-lg font-semibold text-white">
                      This solution is{' '}
                      <span className={
                        result.acidBase === 'acidic' ? 'text-red-400' :
                        result.acidBase === 'basic' ? 'text-blue-400' :
                        'text-green-400'
                      }>
                        {result.acidBase.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* pH Scale Examples */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            pH Scale Examples
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
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
                className="group rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{example.name}</span>
                  <ArrowRight className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${example.color}`} />
                  <span className="text-slate-400">pH {example.pH}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Formulas */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            pH Formulas & Relationships
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Beaker className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">Basic Formulas</h3>
              <div className="space-y-3 font-mono text-slate-300">
                <p>pH = -log₁₀[H⁺]</p>
                <p>pOH = -log₁₀[OH⁻]</p>
                <p>pH + pOH = 14</p>
                <p>[H⁺][OH⁻] = 10⁻¹⁴</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <FlaskConical className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">Conversions</h3>
              <div className="space-y-3 font-mono text-slate-300">
                <p>[H⁺] = 10⁻ᵖᴴ</p>
                <p>[OH⁻] = 10⁻ᵖᴼᴴ</p>
                <p>pOH = 14 - pH</p>
                <p>pH = 14 - pOH</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Use Our pH Calculator?
          </h2>

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
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-blue-500/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

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
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Explore More Chemistry Tools
          </h2>
          <p className="text-slate-400 mb-8">
            VerChem offers a complete suite of chemistry calculators and tools
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/equation-balancer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Equation Balancer
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Molar Mass
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Stoichiometry
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-medium text-white hover:from-blue-500 hover:to-cyan-500 transition-colors"
            >
              Interactive Periodic Table
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
