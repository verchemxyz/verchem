'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Wind, Thermometer, Gauge, FlaskConical, Zap, Calculator, BookOpen } from 'lucide-react'
import { GasLawsSchema } from '@/components/seo/JsonLd'

type GasLaw = 'ideal' | 'boyle' | 'charles' | 'gay-lussac' | 'combined' | 'avogadro'

interface GasLawInfo {
  name: string
  formula: string
  description: string
  variables: string[]
  constant: string
}

const GAS_LAWS: Record<GasLaw, GasLawInfo> = {
  ideal: {
    name: 'Ideal Gas Law',
    formula: 'PV = nRT',
    description: 'Relates pressure, volume, temperature, and amount of gas',
    variables: ['P (pressure)', 'V (volume)', 'n (moles)', 'T (temperature)'],
    constant: 'R = 8.314 J/(mol·K)'
  },
  boyle: {
    name: "Boyle's Law",
    formula: 'P₁V₁ = P₂V₂',
    description: 'Pressure and volume are inversely proportional at constant temperature',
    variables: ['P₁', 'V₁', 'P₂', 'V₂'],
    constant: 'T (constant)'
  },
  charles: {
    name: "Charles's Law",
    formula: 'V₁/T₁ = V₂/T₂',
    description: 'Volume and temperature are directly proportional at constant pressure',
    variables: ['V₁', 'T₁', 'V₂', 'T₂'],
    constant: 'P (constant)'
  },
  'gay-lussac': {
    name: "Gay-Lussac's Law",
    formula: 'P₁/T₁ = P₂/T₂',
    description: 'Pressure and temperature are directly proportional at constant volume',
    variables: ['P₁', 'T₁', 'P₂', 'T₂'],
    constant: 'V (constant)'
  },
  combined: {
    name: 'Combined Gas Law',
    formula: 'P₁V₁/T₁ = P₂V₂/T₂',
    description: 'Combines Boyle\'s, Charles\'s, and Gay-Lussac\'s laws',
    variables: ['P₁', 'V₁', 'T₁', 'P₂', 'V₂', 'T₂'],
    constant: 'n (constant)'
  },
  avogadro: {
    name: "Avogadro's Law",
    formula: 'V₁/n₁ = V₂/n₂',
    description: 'Volume and amount of gas are directly proportional at constant T and P',
    variables: ['V₁', 'n₁', 'V₂', 'n₂'],
    constant: 'T, P (constant)'
  }
}

const R = 8.314 // J/(mol·K)

export default function GasLawsCalculatorPage() {
  const [selectedLaw, setSelectedLaw] = useState<GasLaw>('ideal')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [solveFor, setSolveFor] = useState<string>('')
  const [result, setResult] = useState<{ value: number; unit: string } | null>(null)
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
        let calculatedValue: number
        let unit: string

        if (selectedLaw === 'ideal') {
          const P = parseFloat(inputs.P || '0')
          const V = parseFloat(inputs.V || '0')
          const n = parseFloat(inputs.n || '0')
          const T = parseFloat(inputs.T || '0')

          switch (solveFor) {
            case 'P':
              if (!n || !T || !V) throw new Error('Need n, R, T, and V')
              calculatedValue = (n * R * T) / V
              unit = 'Pa'
              break
            case 'V':
              if (!n || !T || !P) throw new Error('Need n, R, T, and P')
              calculatedValue = (n * R * T) / P
              unit = 'm³'
              break
            case 'n':
              if (!P || !V || !T) throw new Error('Need P, V, and T')
              calculatedValue = (P * V) / (R * T)
              unit = 'mol'
              break
            case 'T':
              if (!P || !V || !n) throw new Error('Need P, V, and n')
              calculatedValue = (P * V) / (n * R)
              unit = 'K'
              break
            default:
              throw new Error('Select what to solve for')
          }
        } else if (selectedLaw === 'boyle') {
          const P1 = parseFloat(inputs.P1 || '0')
          const V1 = parseFloat(inputs.V1 || '0')
          const P2 = parseFloat(inputs.P2 || '0')
          const V2 = parseFloat(inputs.V2 || '0')

          switch (solveFor) {
            case 'P2':
              if (!P1 || !V1 || !V2) throw new Error('Need P₁, V₁, and V₂')
              calculatedValue = (P1 * V1) / V2
              unit = 'atm'
              break
            case 'V2':
              if (!P1 || !V1 || !P2) throw new Error('Need P₁, V₁, and P₂')
              calculatedValue = (P1 * V1) / P2
              unit = 'L'
              break
            case 'P1':
              if (!P2 || !V1 || !V2) throw new Error('Need P₂, V₁, and V₂')
              calculatedValue = (P2 * V2) / V1
              unit = 'atm'
              break
            case 'V1':
              if (!P1 || !P2 || !V2) throw new Error('Need P₁, P₂, and V₂')
              calculatedValue = (P2 * V2) / P1
              unit = 'L'
              break
            default:
              throw new Error('Select what to solve for')
          }
        } else if (selectedLaw === 'charles') {
          const V1 = parseFloat(inputs.V1 || '0')
          const T1 = parseFloat(inputs.T1 || '0')
          const V2 = parseFloat(inputs.V2 || '0')
          const T2 = parseFloat(inputs.T2 || '0')

          switch (solveFor) {
            case 'V2':
              if (!V1 || !T1 || !T2) throw new Error('Need V₁, T₁, and T₂')
              calculatedValue = (V1 * T2) / T1
              unit = 'L'
              break
            case 'T2':
              if (!V1 || !T1 || !V2) throw new Error('Need V₁, T₁, and V₂')
              calculatedValue = (T1 * V2) / V1
              unit = 'K'
              break
            case 'V1':
              if (!V2 || !T1 || !T2) throw new Error('Need V₂, T₁, and T₂')
              calculatedValue = (V2 * T1) / T2
              unit = 'L'
              break
            case 'T1':
              if (!V1 || !V2 || !T2) throw new Error('Need V₁, V₂, and T₂')
              calculatedValue = (V1 * T2) / V2
              unit = 'K'
              break
            default:
              throw new Error('Select what to solve for')
          }
        } else {
          throw new Error('Law not implemented yet')
        }

        setResult({ value: calculatedValue, unit })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation error')
      }
      setIsCalculating(false)
    }, 300)
  }, [selectedLaw, inputs, solveFor])

  const currentLaw = GAS_LAWS[selectedLaw]

  const getInputFields = () => {
    switch (selectedLaw) {
      case 'ideal':
        return [
          { key: 'P', label: 'Pressure (P)', unit: 'Pa', placeholder: 'e.g., 101325' },
          { key: 'V', label: 'Volume (V)', unit: 'm³', placeholder: 'e.g., 0.0224' },
          { key: 'n', label: 'Moles (n)', unit: 'mol', placeholder: 'e.g., 1' },
          { key: 'T', label: 'Temperature (T)', unit: 'K', placeholder: 'e.g., 273.15' },
        ]
      case 'boyle':
        return [
          { key: 'P1', label: 'Initial Pressure (P₁)', unit: 'atm', placeholder: 'e.g., 1' },
          { key: 'V1', label: 'Initial Volume (V₁)', unit: 'L', placeholder: 'e.g., 10' },
          { key: 'P2', label: 'Final Pressure (P₂)', unit: 'atm', placeholder: 'e.g., 2' },
          { key: 'V2', label: 'Final Volume (V₂)', unit: 'L', placeholder: 'e.g., 5' },
        ]
      case 'charles':
        return [
          { key: 'V1', label: 'Initial Volume (V₁)', unit: 'L', placeholder: 'e.g., 10' },
          { key: 'T1', label: 'Initial Temperature (T₁)', unit: 'K', placeholder: 'e.g., 300' },
          { key: 'V2', label: 'Final Volume (V₂)', unit: 'L', placeholder: 'e.g., 20' },
          { key: 'T2', label: 'Final Temperature (T₂)', unit: 'K', placeholder: 'e.g., 600' },
        ]
      default:
        return []
    }
  }

  return (
    <>
      <GasLawsSchema />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 mb-6">
              <Wind className="h-4 w-4" />
              All Major Gas Laws in One Place
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Gas Laws
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Calculator
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Calculate pressure, volume, temperature, and moles using Ideal Gas Law,
              Boyle&apos;s Law, Charles&apos;s Law, and more.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                6 Gas Laws
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Step-by-Step
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Unit Conversion
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                100% Free
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Law Selector */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.keys(GAS_LAWS) as GasLaw[]).map((law) => (
              <button
                key={law}
                onClick={() => {
                  setSelectedLaw(law)
                  setInputs({})
                  setSolveFor('')
                  setResult(null)
                  setError('')
                }}
                className={`rounded-xl p-4 text-center transition-all ${
                  selectedLaw === law
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <p className="font-semibold text-sm">{GAS_LAWS[law].name}</p>
                <p className="text-xs mt-1 font-mono opacity-75">{GAS_LAWS[law].formula}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 to-emerald-900/20 p-8 shadow-2xl shadow-emerald-500/10 backdrop-blur-sm">
            {/* Law Info */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{currentLaw.name}</h2>
              <p className="text-3xl font-mono text-emerald-400 mb-2">{currentLaw.formula}</p>
              <p className="text-slate-400">{currentLaw.description}</p>
              <p className="text-sm text-emerald-300 mt-2">Constant: {currentLaw.constant}</p>
            </div>

            {/* Solve For Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Solve For
              </label>
              <div className="flex flex-wrap gap-2">
                {getInputFields().map((field) => (
                  <button
                    key={field.key}
                    onClick={() => setSolveFor(field.key)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      solveFor === field.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {field.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {getInputFields().map((field) => (
                <div
                  key={field.key}
                  className={solveFor === field.key ? 'opacity-50' : ''}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputs[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      disabled={solveFor === field.key}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      {field.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={isCalculating || !solveFor}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 font-semibold text-white transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
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
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <p className="text-sm text-emerald-300 mb-2">Result for {solveFor}</p>
                  <p className="text-4xl font-bold text-white font-mono">
                    {result.value.toExponential(4)}
                    <span className="text-2xl text-emerald-300 ml-2">{result.unit}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gas Laws Overview */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Understanding Gas Laws
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            The fundamental laws that describe how gases behave under different conditions
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(GAS_LAWS) as [GasLaw, GasLawInfo][]).map(([key, law]) => (
              <div
                key={key}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                    <Wind className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{law.name}</h3>
                </div>
                <p className="text-2xl font-mono text-emerald-400 mb-3">{law.formula}</p>
                <p className="text-slate-400 text-sm mb-4">{law.description}</p>
                <div className="flex flex-wrap gap-2">
                  {law.variables.map((v) => (
                    <span key={v} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Use Our Gas Laws Calculator?
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Results',
                description: 'Get accurate calculations in milliseconds'
              },
              {
                icon: Calculator,
                title: 'All Major Laws',
                description: 'Ideal, Boyle\'s, Charles\'s, Combined, and more'
              },
              {
                icon: Thermometer,
                title: 'Unit Flexibility',
                description: 'Works with various pressure and volume units'
              },
              {
                icon: Gauge,
                title: 'Solve for Any Variable',
                description: 'Calculate any unknown from the known values'
              },
              {
                icon: BookOpen,
                title: 'Educational',
                description: 'Perfect for learning gas behavior concepts'
              },
              {
                icon: FlaskConical,
                title: 'Lab Ready',
                description: 'Precise enough for laboratory calculations'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'What is the Ideal Gas Law?',
                a: 'The Ideal Gas Law (PV = nRT) relates the pressure (P), volume (V), amount of gas in moles (n), and temperature (T) of an ideal gas. R is the universal gas constant (8.314 J/mol·K).'
              },
              {
                q: 'When should I use Boyle\'s Law?',
                a: "Use Boyle's Law (P₁V₁ = P₂V₂) when temperature is constant and you need to find how pressure and volume change relative to each other."
              },
              {
                q: 'What temperature units should I use?',
                a: 'Always use Kelvin (K) for gas law calculations. Convert Celsius to Kelvin by adding 273.15. Using Celsius or Fahrenheit will give incorrect results.'
              },
              {
                q: 'What is an ideal gas?',
                a: 'An ideal gas is a theoretical gas composed of randomly moving particles that don\'t interact except during elastic collisions. Real gases approximate ideal behavior at low pressure and high temperature.'
              },
              {
                q: 'How do I convert pressure units?',
                a: '1 atm = 101,325 Pa = 760 mmHg = 14.7 psi = 1.01325 bar. Make sure all your values are in consistent units before calculating.'
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
              href="/tools/ph-calculator"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              pH Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-medium text-white hover:from-emerald-500 hover:to-teal-500 transition-colors"
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
