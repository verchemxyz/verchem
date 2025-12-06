'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Beaker, Calculator, Scale, FlaskConical, Zap, BookOpen, ArrowRightLeft, Percent } from 'lucide-react'
import { StoichiometrySchema } from '@/components/seo/JsonLd'

type CalculationMode = 'mass-to-mole' | 'mole-to-mass' | 'mass-to-mass' | 'limiting-reagent' | 'percent-yield'

interface ModeInfo {
  name: string
  description: string
  icon: React.ElementType
}

const MODES: Record<CalculationMode, ModeInfo> = {
  'mass-to-mole': {
    name: 'Mass → Mole',
    description: 'Convert grams to moles',
    icon: Scale
  },
  'mole-to-mass': {
    name: 'Mole → Mass',
    description: 'Convert moles to grams',
    icon: Scale
  },
  'mass-to-mass': {
    name: 'Mass → Mass',
    description: 'Mass of reactant to mass of product',
    icon: ArrowRightLeft
  },
  'limiting-reagent': {
    name: 'Limiting Reagent',
    description: 'Find the limiting reactant',
    icon: FlaskConical
  },
  'percent-yield': {
    name: 'Percent Yield',
    description: 'Calculate reaction efficiency',
    icon: Percent
  }
}

// Molar masses for common compounds
const MOLAR_MASSES: Record<string, number> = {
  'H2O': 18.015, 'CO2': 44.01, 'NaCl': 58.44, 'H2SO4': 98.079,
  'HCl': 36.46, 'NaOH': 40.00, 'C6H12O6': 180.16, 'NH3': 17.031,
  'O2': 32.00, 'N2': 28.01, 'H2': 2.016, 'CH4': 16.04,
  'C2H5OH': 46.07, 'CaCO3': 100.09, 'Fe2O3': 159.69, 'Al2O3': 101.96
}

const EXAMPLE_PROBLEMS = [
  {
    title: 'Water Synthesis',
    equation: '2H₂ + O₂ → 2H₂O',
    problem: 'How many grams of H₂O are produced from 4g of H₂?',
    mode: 'mass-to-mass' as const
  },
  {
    title: 'Combustion',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    problem: 'How many moles of CO₂ from 32g of CH₄?',
    mode: 'mass-to-mole' as const
  },
  {
    title: 'Acid-Base',
    equation: 'NaOH + HCl → NaCl + H₂O',
    problem: 'Which is limiting: 5g NaOH or 4g HCl?',
    mode: 'limiting-reagent' as const
  },
  {
    title: 'Precipitation',
    equation: 'CaCl₂ + Na₂CO₃ → CaCO₃ + 2NaCl',
    problem: '80g CaCO₃ produced, 100g theoretical. Yield?',
    mode: 'percent-yield' as const
  }
]

export default function StoichiometryCalculatorPage() {
  const [mode, setMode] = useState<CalculationMode>('mass-to-mole')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{
    value: number
    unit: string
    steps: string[]
  } | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    setError('')
    setResult(null)

    setTimeout(() => {
      try {
        let value: number
        let unit: string
        const steps: string[] = []

        if (mode === 'mass-to-mole') {
          const mass = parseFloat(inputs.mass || '0')
          const molarMass = parseFloat(inputs.molarMass || '0')

          if (!mass || !molarMass) throw new Error('Enter mass and molar mass')

          value = mass / molarMass
          unit = 'mol'
          steps.push(`Given: Mass = ${mass} g, Molar Mass = ${molarMass} g/mol`)
          steps.push(`Formula: n = mass / molar mass`)
          steps.push(`n = ${mass} g ÷ ${molarMass} g/mol`)
          steps.push(`n = ${value.toFixed(4)} mol`)
        } else if (mode === 'mole-to-mass') {
          const moles = parseFloat(inputs.moles || '0')
          const molarMass = parseFloat(inputs.molarMass || '0')

          if (!moles || !molarMass) throw new Error('Enter moles and molar mass')

          value = moles * molarMass
          unit = 'g'
          steps.push(`Given: n = ${moles} mol, Molar Mass = ${molarMass} g/mol`)
          steps.push(`Formula: mass = n × molar mass`)
          steps.push(`mass = ${moles} mol × ${molarMass} g/mol`)
          steps.push(`mass = ${value.toFixed(4)} g`)
        } else if (mode === 'mass-to-mass') {
          const massA = parseFloat(inputs.massA || '0')
          const molarMassA = parseFloat(inputs.molarMassA || '0')
          const molarMassB = parseFloat(inputs.molarMassB || '0')
          const coeffA = parseFloat(inputs.coeffA || '1')
          const coeffB = parseFloat(inputs.coeffB || '1')

          if (!massA || !molarMassA || !molarMassB) throw new Error('Enter all values')

          const molesA = massA / molarMassA
          const molesB = molesA * (coeffB / coeffA)
          value = molesB * molarMassB
          unit = 'g'

          steps.push(`Step 1: Convert mass A to moles`)
          steps.push(`n(A) = ${massA} g ÷ ${molarMassA} g/mol = ${molesA.toFixed(4)} mol`)
          steps.push(`Step 2: Use mole ratio (${coeffA}:${coeffB})`)
          steps.push(`n(B) = ${molesA.toFixed(4)} × (${coeffB}/${coeffA}) = ${molesB.toFixed(4)} mol`)
          steps.push(`Step 3: Convert moles B to mass`)
          steps.push(`mass(B) = ${molesB.toFixed(4)} × ${molarMassB} = ${value.toFixed(4)} g`)
        } else if (mode === 'percent-yield') {
          const actual = parseFloat(inputs.actual || '0')
          const theoretical = parseFloat(inputs.theoretical || '0')

          if (!actual || !theoretical) throw new Error('Enter actual and theoretical yield')

          value = (actual / theoretical) * 100
          unit = '%'
          steps.push(`Given: Actual Yield = ${actual} g, Theoretical Yield = ${theoretical} g`)
          steps.push(`Formula: % Yield = (Actual / Theoretical) × 100`)
          steps.push(`% Yield = (${actual} / ${theoretical}) × 100`)
          steps.push(`% Yield = ${value.toFixed(2)}%`)
        } else {
          throw new Error('Mode not implemented')
        }

        setResult({ value, unit, steps })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation error')
      }
      setIsCalculating(false)
    }, 300)
  }, [mode, inputs])

  const getInputFields = () => {
    switch (mode) {
      case 'mass-to-mole':
        return [
          { key: 'mass', label: 'Mass', unit: 'g', placeholder: 'e.g., 18' },
          { key: 'molarMass', label: 'Molar Mass', unit: 'g/mol', placeholder: 'e.g., 18.015 (H₂O)' },
        ]
      case 'mole-to-mass':
        return [
          { key: 'moles', label: 'Amount', unit: 'mol', placeholder: 'e.g., 2' },
          { key: 'molarMass', label: 'Molar Mass', unit: 'g/mol', placeholder: 'e.g., 18.015 (H₂O)' },
        ]
      case 'mass-to-mass':
        return [
          { key: 'massA', label: 'Mass of Reactant A', unit: 'g', placeholder: 'e.g., 10' },
          { key: 'molarMassA', label: 'Molar Mass of A', unit: 'g/mol', placeholder: 'e.g., 2.016 (H₂)' },
          { key: 'coeffA', label: 'Coefficient of A', unit: '', placeholder: 'e.g., 2' },
          { key: 'coeffB', label: 'Coefficient of B', unit: '', placeholder: 'e.g., 2' },
          { key: 'molarMassB', label: 'Molar Mass of B', unit: 'g/mol', placeholder: 'e.g., 18.015 (H₂O)' },
        ]
      case 'percent-yield':
        return [
          { key: 'actual', label: 'Actual Yield', unit: 'g', placeholder: 'e.g., 85' },
          { key: 'theoretical', label: 'Theoretical Yield', unit: 'g', placeholder: 'e.g., 100' },
        ]
      default:
        return []
    }
  }

  const currentMode = MODES[mode]

  return (
    <>
      <StoichiometrySchema />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-300 mb-6">
              <Beaker className="h-4 w-4" />
              Step-by-Step Solutions
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Stoichiometry
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                Calculator
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Solve stoichiometry problems with step-by-step solutions.
              Mass-mole conversions, limiting reagent, percent yield, and more.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                5 Calculation Modes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Step-by-Step
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                NIST Data
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                100% Free
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Selector */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(MODES) as CalculationMode[]).map((m) => {
              const info = MODES[m]
              return (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m)
                    setInputs({})
                    setResult(null)
                    setError('')
                  }}
                  className={`rounded-xl p-4 text-center transition-all ${
                    mode === m
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <info.icon className="h-5 w-5 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{info.name}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-slate-900/90 to-orange-900/20 p-8 shadow-2xl shadow-orange-500/10 backdrop-blur-sm">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{currentMode.name}</h2>
              <p className="text-slate-400">{currentMode.description}</p>
            </div>

            {/* Input Fields */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {getInputFields().map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputs[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono"
                    />
                    {field.unit && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                        {field.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Molar Mass Reference */}
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-slate-400 mb-2">Quick Reference - Common Molar Masses:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MOLAR_MASSES).slice(0, 8).map(([formula, mass]) => (
                  <button
                    key={formula}
                    onClick={() => {
                      if (mode === 'mass-to-mole' || mode === 'mole-to-mass') {
                        setInputs(prev => ({ ...prev, molarMass: mass.toString() }))
                      }
                    }}
                    className="rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-orange-500/20 transition-colors"
                  >
                    {formula}: {mass}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-4 font-semibold text-white transition-all hover:from-orange-500 hover:to-amber-500 hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50"
            >
              {isCalculating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Calculating...
                </div>
              ) : (
                'Calculate'
              )}
            </button>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6 text-center">
                  <p className="text-sm text-orange-300 mb-2">Result</p>
                  <p className="text-4xl font-bold text-white font-mono">
                    {result.value.toFixed(4)}
                    <span className="text-2xl text-orange-300 ml-2">{result.unit}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-400" />
                    Step-by-Step Solution
                  </h3>
                  <div className="space-y-2">
                    {result.steps.map((step, i) => (
                      <p key={i} className="text-slate-300 font-mono text-sm">
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Example Problems */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Example Problems
          </h2>
          <p className="text-slate-400 text-center mb-12">
            Click any example to practice with our calculator
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {EXAMPLE_PROBLEMS.map((example, i) => (
              <button
                key={i}
                onClick={() => setMode(example.mode)}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-orange-500/50 hover:bg-orange-500/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-white">{example.title}</span>
                  <ArrowRight className="h-5 w-5 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-mono text-orange-400 mb-2">{example.equation}</p>
                <p className="text-slate-400 text-sm">{example.problem}</p>
                <span className="inline-block mt-3 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                  {MODES[example.mode].name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Key Concepts */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Stoichiometry Formulas
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Scale className="h-8 w-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">Mass-Mole Conversion</h3>
              <div className="space-y-2 font-mono text-slate-300 text-sm">
                <p>n = mass / M</p>
                <p>mass = n × M</p>
                <p className="text-slate-500 text-xs">n = moles, M = molar mass</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <ArrowRightLeft className="h-8 w-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">Mole Ratio</h3>
              <div className="space-y-2 font-mono text-slate-300 text-sm">
                <p>n₂/n₁ = coeff₂/coeff₁</p>
                <p className="text-slate-500 text-xs">From balanced equation coefficients</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Percent className="h-8 w-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">Percent Yield</h3>
              <div className="space-y-2 font-mono text-slate-300 text-sm">
                <p>% Yield = (actual/theoretical) × 100</p>
                <p className="text-slate-500 text-xs">Measures reaction efficiency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Use Our Stoichiometry Calculator?
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Results',
                description: 'Get answers in milliseconds with step-by-step solutions'
              },
              {
                icon: BookOpen,
                title: 'Step-by-Step',
                description: 'See the complete solution process to learn as you calculate'
              },
              {
                icon: Calculator,
                title: '5 Calculation Modes',
                description: 'Mass-mole, mole-mass, mass-mass, limiting reagent, yield'
              },
              {
                icon: Scale,
                title: 'NIST Molar Masses',
                description: 'Built-in reference for accurate atomic masses'
              },
              {
                icon: FlaskConical,
                title: 'Lab Ready',
                description: 'Precise calculations for laboratory work'
              },
              {
                icon: Beaker,
                title: 'Educational',
                description: 'Perfect for homework and exam preparation'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-orange-500/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-orange-400 mb-4" />
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
                q: 'What is stoichiometry?',
                a: 'Stoichiometry is the calculation of quantities of reactants and products in chemical reactions. It uses mole ratios from balanced equations to convert between masses, moles, and numbers of particles.'
              },
              {
                q: 'How do I convert mass to moles?',
                a: 'Divide the mass (in grams) by the molar mass (in g/mol). For example, 18g of water (H₂O, molar mass 18.015 g/mol) = 18/18.015 = 0.999 mol.'
              },
              {
                q: 'What is a limiting reagent?',
                a: 'The limiting reagent is the reactant that gets completely consumed first in a reaction, determining the maximum amount of product that can form. The other reactants are "in excess."'
              },
              {
                q: 'How do I calculate percent yield?',
                a: 'Percent yield = (actual yield / theoretical yield) × 100. Actual yield is what you measured; theoretical yield is calculated from stoichiometry. A yield over 100% suggests impurities or measurement error.'
              },
              {
                q: 'Why is my equation not balancing correctly?',
                a: 'Make sure you\'re using the correct coefficients from your balanced equation. The mole ratio comes directly from these coefficients. If unsure, use our Equation Balancer tool first.'
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
            VerChem offers a complete suite of chemistry calculators
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
              href="/tools/ph-calculator"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              pH Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-3 font-medium text-white hover:from-orange-500 hover:to-amber-500 transition-colors"
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
