'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Atom, Calculator, CheckCircle, Zap, BookOpen, FlaskConical, Scale } from 'lucide-react'
import { MolarMassSchema } from '@/components/seo/JsonLd'
import { CalcShell, Card, SectionTitle, Button, ResultPanel, ErrorBanner } from '@/components/lab'
import MoleculeInput from '@/components/molecule-editor/MoleculeInput'
import { useRDKit } from '@/lib/rdkit/hook'
import { getMolWeight, smilesToFormula } from '@/lib/rdkit/operations'

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



export default function MolarMassCalculatorPage() {
  const [inputMode, setInputMode] = useState<'formula' | 'smiles'>('formula')
  const [formula, setFormula] = useState('')
  const [smiles, setSmiles] = useState('')
  const [result, setResult] = useState<{
    mass: number
    elements: ElementCount[]
  } | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  // RDKit-derived results
  const [rdkitMw, setRdkitMw] = useState<{ average: number; exact: number } | null>(null)
  const [rdkitFormula, setRdkitFormula] = useState<string | null>(null)
  const [rdkitError, setRdkitError] = useState<string | null>(null)
  const [isRdkitComputing, setIsRdkitComputing] = useState(false)
  const { isLoading: rdkitLoading, error: rdkitHookError } = useRDKit()

  // Process SMILES through RDKit when in smiles mode
  useEffect(() => {
    if (inputMode !== 'smiles' || !smiles.trim()) {
      // Clear RDKit-derived state when switching away from SMILES mode or clearing input
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRdkitMw(null)
      setRdkitFormula(null)
      setRdkitError(null)
      return
    }

    let cancelled = false
    setIsRdkitComputing(true)
    setRdkitError(null)

    Promise.all([
      getMolWeight(smiles),
      smilesToFormula(smiles),
    ])
      .then(([mwResult, formulaResult]) => {
        if (cancelled) return
        if (mwResult) {
          setRdkitMw({ average: mwResult.averageMw, exact: mwResult.exactMass })
        } else {
          setRdkitMw(null)
        }
        setRdkitFormula(formulaResult)
        if (!mwResult && !formulaResult) {
          setRdkitError('Invalid SMILES. Please check your structure.')
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setRdkitError(err instanceof Error ? err.message : 'RDKit calculation failed')
        setRdkitMw(null)
        setRdkitFormula(null)
      })
      .finally(() => {
        if (!cancelled) setIsRdkitComputing(false)
      })

    return () => {
      cancelled = true
    }
  }, [smiles, inputMode])

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
    setInputMode('formula')
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
      <CalcShell
        eyebrow="NIST-validated atomic masses"
        title="Molar Mass Calculator"
        subtitle="Calculate molecular weight instantly with element-by-element breakdown. Perfect for stoichiometry, lab work, and chemistry homework."
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
            <CheckCircle className="h-4 w-4 text-success" /> NIST Data
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> Element Breakdown
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" /> No Sign-up
          </span>
        </div>

        {/* Calculator */}
        <Card className="p-6 sm:p-8">
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('formula')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'formula'
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                Formula
              </button>
              <button
                onClick={() => setInputMode('smiles')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'smiles'
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                SMILES
              </button>
              {rdkitHookError && (
                <span className="text-xs text-warning-strong self-center ml-2">
                  Advanced features unavailable
                </span>
              )}
            </div>

            {/* Formula Mode */}
            {inputMode === 'formula' && (
              <div>
                <label htmlFor="mm-formula" className="block text-sm font-medium text-foreground mb-2">
                  Enter Chemical Formula
                </label>
                <div className="flex gap-4">
                  <input
                    id="mm-formula"
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                    placeholder="e.g., H2O, NaCl, C6H12O6"
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
            )}

            {/* SMILES Mode */}
            {inputMode === 'smiles' && (
              <div className="space-y-4">
                <MoleculeInput
                  value={smiles}
                  onChange={setSmiles}
                  label="Enter or Draw SMILES"
                  placeholder="e.g., CCO, c1ccccc1"
                />

                {rdkitLoading && (
                  <div className="text-sm text-muted-foreground">Loading chemistry engine...</div>
                )}

                {isRdkitComputing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                    Computing...
                  </div>
                )}

                {rdkitError && <ErrorBanner>{rdkitError}</ErrorBanner>}

                {rdkitFormula && (
                  <div className="rounded-md border border-border bg-muted p-4">
                    <p className="text-sm text-muted-foreground mb-1">Formula</p>
                    <p className="text-2xl font-bold text-foreground font-mono">{rdkitFormula}</p>
                  </div>
                )}

                {rdkitMw && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md border border-border bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-1">Average Mass</p>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        {rdkitMw.average.toFixed(3)}
                        <span className="text-sm text-muted-foreground ml-1">g/mol</span>
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-muted p-4">
                      <p className="text-sm text-muted-foreground mb-1">Exact Mass</p>
                      <p className="text-2xl font-bold text-foreground font-mono">
                        {rdkitMw.exact.toFixed(4)}
                        <span className="text-sm text-muted-foreground ml-1">g/mol</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <ErrorBanner>{error}</ErrorBanner>}

            {result && inputMode === 'formula' && (
              <div className="space-y-6">
                <ResultPanel label="Molar Mass">
                  {result.mass.toFixed(3)}
                  <span className="text-xl text-muted-foreground ml-2">g/mol</span>
                </ResultPanel>

                <div className="rounded-lg border border-border bg-muted p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Element Breakdown</h3>
                  <div className="space-y-3">
                    {result.elements.map((el) => (
                      <div key={el.element} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-md bg-primary-500 flex items-center justify-center font-bold text-primary-foreground">
                          {el.element}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">
                              {el.element} × {el.count} = {(el.mass * el.count).toFixed(3)} g/mol
                            </span>
                            <span className="text-primary-600 font-mono">{el.contribution.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary-500 transition-all duration-500"
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
        </Card>

        {/* Quick Reference */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">Common Compounds</SectionTitle>
          <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
            Click any compound below to instantly calculate its molar mass
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_COMPOUNDS.map((compound) => (
              <button
                key={compound.formula}
                onClick={() => handleQuickSelect(compound)}
                className="group rounded-lg border border-border bg-card p-6 text-left transition-colors hover:border-primary-500 hover:bg-muted"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground">{compound.name}</span>
                  <ArrowRight className="h-5 w-5 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary-600">{compound.formula}</span>
                  <span className="text-muted-foreground">{compound.mass.toFixed(2)} g/mol</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            How to Calculate Molar Mass
          </SectionTitle>

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
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-primary-500 text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Formula Guide */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-2">
            Formula Writing Guide
          </SectionTitle>
          <p className="text-muted-foreground text-center mb-8">
            Tips for entering chemical formulas correctly
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted p-6">
              <FlaskConical className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Element Symbols</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Use capital letters for element symbols. Two-letter symbols use lowercase for the second letter.
              </p>
              <code className="text-primary-600 text-sm font-mono">Ca, Na, Fe, Cl, Mg</code>
            </div>

            <div className="rounded-lg border border-border bg-muted p-6">
              <Calculator className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Subscripts</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Write subscripts as regular numbers after the element symbol.
              </p>
              <code className="text-primary-600 text-sm font-mono">H2O, CO2, C6H12O6</code>
            </div>

            <div className="rounded-lg border border-border bg-muted p-6">
              <BookOpen className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Compounds</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Write all elements in sequence with their subscripts.
              </p>
              <code className="text-primary-600 text-sm font-mono">NaCl, H2SO4, Ca(OH)2</code>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="p-6 sm:p-8">
          <SectionTitle className="text-center text-2xl mb-8">
            Why Use Our Molar Mass Calculator?
          </SectionTitle>

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
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
            >
              Stoichiometry
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
