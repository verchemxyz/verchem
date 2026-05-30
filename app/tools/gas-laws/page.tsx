'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Wind, Thermometer, Gauge, FlaskConical, Zap, Calculator, BookOpen } from 'lucide-react'
import { GasLawsSchema } from '@/components/seo/JsonLd'
import { CalcShell, Card, SectionTitle, Button, ResultPanel, ErrorBanner } from '@/components/lab'

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
          // Unreachable from the UI (no solve-for buttons render for these laws),
          // but stay graceful instead of throwing if it is ever reached.
          setError('This law is available in the full Gas Laws Calculator.')
          setIsCalculating(false)
          return
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
      <CalcShell
        eyebrow="Physical chemistry · gas laws"
        title="Gas Laws Calculator"
        subtitle="Calculate pressure, volume, temperature, and moles using Ideal Gas Law, Boyle's Law, Charles's Law, and more."
        backHref="/tools"
        backLabel="All tools"
        maxWidth="6xl"
      >
        {/* Capability strip */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> 6 Gas Laws
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Step-by-Step
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Unit Conversion
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> 100% Free
          </span>
        </div>

        {/* Law Selector */}
        <Card className="p-6">
          <SectionTitle className="mb-4">Select gas law</SectionTitle>
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
                className={`rounded-md p-4 text-center transition-colors ${
                  selectedLaw === law
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <p className="font-semibold text-sm">{GAS_LAWS[law].name}</p>
                <p className="text-xs mt-1 font-mono opacity-75">{GAS_LAWS[law].formula}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Calculator */}
        <Card className="p-6 sm:p-8">
          {/* Law Info */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">{currentLaw.name}</h2>
            <p className="text-3xl font-mono text-primary-600 mb-2">{currentLaw.formula}</p>
            <p className="text-muted-foreground">{currentLaw.description}</p>
            <p className="text-sm text-muted-foreground mt-2">Constant: {currentLaw.constant}</p>
          </div>

          {/* Persistent CTA to the full calculator */}
          <div className="mb-6 flex justify-center">
            <Link
              href="/gas-laws"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              Need all 9 laws + Van der Waals &amp; step-by-step? Open the full calculator
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick-calc for the implemented laws; CTA to the full calculator otherwise */}
          {getInputFields().length > 0 ? (
          <>
          {/* Solve For Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Solve For
            </label>
            <div className="flex flex-wrap gap-2">
              {getInputFields().map((field) => (
                <button
                  key={field.key}
                  onClick={() => setSolveFor(field.key)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    solveFor === field.key
                      ? 'bg-primary-500 text-primary-foreground'
                      : 'border border-border bg-card text-foreground hover:bg-muted'
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
                <label htmlFor={`gl-${field.key}`} className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    id={`gl-${field.key}`}
                    type="text"
                    value={inputs[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    disabled={solveFor === field.key}
                    placeholder={field.placeholder}
                    className="input-premium w-full font-mono disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || !solveFor}
            className="w-full"
          >
            {isCalculating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Calculating...
              </div>
            ) : (
              'Calculate'
            )}
          </Button>
          </>
          ) : (
            <div className="rounded-lg border border-border bg-muted p-6 text-center">
              <p className="text-muted-foreground mb-4">
                <span className="font-semibold text-foreground">{currentLaw.name}</span> — with full
                step-by-step solving, plus Van der Waals, Dalton&apos;s, Graham&apos;s and the
                Combined Gas Law — is available in the complete calculator.
              </p>
              <Link
                href="/gas-laws"
                className="inline-flex items-center justify-center gap-2 rounded-md font-medium px-6 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors"
              >
                Open the full Gas Laws Calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {error && <div className="mt-6"><ErrorBanner>{error}</ErrorBanner></div>}

          {result && (
            <div className="mt-6">
              <ResultPanel label={`Result for ${solveFor}`}>
                {result.value.toExponential(4)}
                <span className="text-xl text-muted-foreground ml-2">{result.unit}</span>
              </ResultPanel>
            </div>
          )}
        </Card>

        {/* Gas Laws Overview */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            Understanding Gas Laws
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            The fundamental laws that describe how gases behave under different conditions
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(GAS_LAWS) as [GasLaw, GasLawInfo][]).map(([key, law]) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-muted p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-md bg-primary-500 flex items-center justify-center">
                    <Wind className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{law.name}</h3>
                </div>
                <p className="text-2xl font-mono text-primary-600 mb-3">{law.formula}</p>
                <p className="text-muted-foreground text-sm mb-4">{law.description}</p>
                <div className="flex flex-wrap gap-2">
                  {law.variables.map((v) => (
                    <span key={v} className="rounded-full bg-card border border-border px-3 py-1 text-xs text-muted-foreground">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Why Use Our Gas Laws Calculator?
          </SectionTitle>

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
              href="/tools/ph-calculator"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              pH Calculator
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
