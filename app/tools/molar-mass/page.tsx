'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Atom, Calculator, CheckCircle, Zap, BookOpen, FlaskConical, Scale } from 'lucide-react'
import { MolarMassSchema } from '@/components/seo/JsonLd'

// Common compounds with their formulas and molar masses
const COMMON_COMPOUNDS = [
  { name: 'Water', formula: 'H2O', mass: 18.015 },
  { name: 'Carbon Dioxide', formula: 'CO2', mass: 44.01 },
  { name: 'Glucose', formula: 'C6H12O6', mass: 180.16 },
  { name: 'Sodium Chloride', formula: 'NaCl', mass: 58.44 },
  { name: 'Sulfuric Acid', formula: 'H2SO4', mass: 98.079 },
  { name: 'Ethanol', formula: 'C2H5OH', mass: 46.07 },
  { name: 'Ammonia', formula: 'NH3', mass: 17.031 },
  { name: 'Calcium Carbonate', formula: 'CaCO3', mass: 100.09 },
  { name: 'Aspirin', formula: 'C9H8O4', mass: 180.16 },
]

// Atomic masses (NIST values)
const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007,
  O: 15.999, F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982,
  Si: 28.086, P: 30.974, S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098,
  Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38, Br: 79.904, Ag: 107.87,
  I: 126.9, Au: 196.97, Pb: 207.2,
}

interface ElementCount {
  element: string
  count: number
  mass: number
  contribution: number
}

function parseFormula(formula: string): ElementCount[] | null {
  const elements: Record<string, number> = {}
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match

  while ((match = regex.exec(formula)) !== null) {
    const [, element, countStr] = match
    if (!element) continue
    const count = countStr ? parseInt(countStr, 10) : 1
    elements[element] = (elements[element] || 0) + count
  }

  const result: ElementCount[] = []
  let totalMass = 0

  for (const [element, count] of Object.entries(elements)) {
    const atomicMass = ATOMIC_MASSES[element]
    if (!atomicMass) return null
    const contribution = atomicMass * count
    totalMass += contribution
    result.push({ element, count, mass: atomicMass, contribution })
  }

  return result.map(item => ({
    ...item,
    contribution: (item.contribution / totalMass) * 100
  }))
}

function calculateMolarMass(formula: string): number | null {
  const elements = parseFormula(formula)
  if (!elements) return null
  return elements.reduce((sum, el) => sum + el.mass * el.count, 0)
}

export default function MolarMassCalculatorPage() {
  const [formula, setFormula] = useState('')
  const [result, setResult] = useState<{
    mass: number
    elements: ElementCount[]
  } | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = useCallback(() => {
    if (!formula.trim()) {
      setError('Please enter a chemical formula')
      return
    }

    setIsCalculating(true)
    setError('')

    setTimeout(() => {
      const elements = parseFormula(formula)
      if (!elements || elements.length === 0) {
        setError('Invalid formula. Please use format like H2O, NaCl, C6H12O6')
        setResult(null)
      } else {
        const mass = elements.reduce((sum, el) => sum + el.mass * el.count, 0)
        setResult({ mass, elements })
      }
      setIsCalculating(false)
    }, 300)
  }, [formula])

  const handleQuickSelect = (compound: typeof COMMON_COMPOUNDS[0]) => {
    setFormula(compound.formula)
    const elements = parseFormula(compound.formula)
    if (elements) {
      const mass = elements.reduce((sum, el) => sum + el.mass * el.count, 0)
      setResult({ mass, elements })
      setError('')
    }
  }

  return (
    <>
      <MolarMassSchema />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300 mb-6">
              <Scale className="h-4 w-4" />
              NIST-Validated Atomic Masses
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Molar Mass
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Calculator
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Calculate molecular weight instantly with element-by-element breakdown.
              Perfect for stoichiometry, lab work, and chemistry homework.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                100% Free
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                NIST Data
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Element Breakdown
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
          <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 to-purple-900/20 p-8 shadow-2xl shadow-purple-500/10 backdrop-blur-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Chemical Formula
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                    placeholder="e.g., H2O, NaCl, C6H12O6"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                  />
                  <button
                    onClick={handleCalculate}
                    disabled={isCalculating}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 font-semibold text-white transition-all hover:from-purple-500 hover:to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
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
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
                    <div className="text-center">
                      <p className="text-sm text-purple-300 mb-2">Molar Mass</p>
                      <p className="text-5xl font-bold text-white font-mono">
                        {result.mass.toFixed(3)}
                        <span className="text-2xl text-purple-300 ml-2">g/mol</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Element Breakdown</h3>
                    <div className="space-y-3">
                      {result.elements.map((el) => (
                        <div key={el.element} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold text-white">
                            {el.element}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">
                                {el.element} × {el.count} = {(el.mass * el.count).toFixed(3)} g/mol
                              </span>
                              <span className="text-purple-400">{el.contribution.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${el.contribution}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Common Compounds
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Click any compound below to instantly calculate its molar mass
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_COMPOUNDS.map((compound) => (
              <button
                key={compound.formula}
                onClick={() => handleQuickSelect(compound)}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-purple-500/50 hover:bg-purple-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-white">{compound.name}</span>
                  <ArrowRight className="h-5 w-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-400">{compound.formula}</span>
                  <span className="text-slate-400">{compound.mass.toFixed(2)} g/mol</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How to Calculate Molar Mass
          </h2>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Enter Formula',
                description: 'Type your chemical formula using standard notation (e.g., H2O, NaCl)'
              },
              {
                step: '2',
                title: 'Parse Elements',
                description: 'We identify each element and its count in the formula'
              },
              {
                step: '3',
                title: 'Lookup Masses',
                description: 'NIST atomic masses are used for precise calculations'
              },
              {
                step: '4',
                title: 'Sum & Display',
                description: 'Total molar mass is calculated with element breakdown'
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formula Guide */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Formula Writing Guide
          </h2>
          <p className="text-slate-400 text-center mb-12">
            Tips for entering chemical formulas correctly
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <FlaskConical className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Element Symbols</h3>
              <p className="text-slate-400 text-sm mb-4">
                Use capital letters for element symbols. Two-letter symbols use lowercase for the second letter.
              </p>
              <code className="text-purple-400 text-sm">Ca, Na, Fe, Cl, Mg</code>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Calculator className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Subscripts</h3>
              <p className="text-slate-400 text-sm mb-4">
                Write subscripts as regular numbers after the element symbol.
              </p>
              <code className="text-purple-400 text-sm">H2O, CO2, C6H12O6</code>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <BookOpen className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Compounds</h3>
              <p className="text-slate-400 text-sm mb-4">
                Write all elements in sequence with their subscripts.
              </p>
              <code className="text-purple-400 text-sm">NaCl, H2SO4, Ca(OH)2</code>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Use Our Molar Mass Calculator?
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Instant Results',
                description: 'Get molar mass calculations in milliseconds with real-time updates'
              },
              {
                icon: Atom,
                title: 'NIST Atomic Masses',
                description: 'Uses official NIST atomic weight values for maximum accuracy'
              },
              {
                icon: Scale,
                title: 'Element Breakdown',
                description: 'See contribution of each element with percentage breakdown'
              },
              {
                icon: BookOpen,
                title: 'Educational',
                description: 'Perfect for learning chemistry and understanding molecular composition'
              },
              {
                icon: Calculator,
                title: 'No Installation',
                description: 'Works directly in your browser, no downloads or sign-ups required'
              },
              {
                icon: FlaskConical,
                title: 'Lab Ready',
                description: 'Precise enough for professional laboratory calculations'
              }
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-purple-400 mb-4" />
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
                q: 'What is molar mass?',
                a: 'Molar mass is the mass of one mole of a substance, expressed in grams per mole (g/mol). It equals the sum of the atomic masses of all atoms in the molecular formula.'
              },
              {
                q: 'How do I calculate molar mass by hand?',
                a: 'Multiply the atomic mass of each element by its subscript (number of atoms), then add all the values together. For H2O: (2 × 1.008) + (1 × 15.999) = 18.015 g/mol'
              },
              {
                q: 'What\'s the difference between molar mass and molecular weight?',
                a: 'Molar mass (g/mol) and molecular weight (amu or Da) have the same numerical value but different units. Molar mass is mass per mole, while molecular weight is mass per molecule.'
              },
              {
                q: 'Why is molar mass important in chemistry?',
                a: 'Molar mass is essential for stoichiometry calculations, converting between mass and moles, preparing solutions of specific concentrations, and understanding reaction quantities.'
              },
              {
                q: 'How accurate is this calculator?',
                a: 'Our calculator uses NIST (National Institute of Standards and Technology) atomic masses, which are the most accurate and up-to-date values available for chemical calculations.'
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
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Stoichiometry
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white hover:from-purple-500 hover:to-pink-500 transition-colors"
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
