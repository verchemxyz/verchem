'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  calculateMolecularMass,
  massToMoles,
  molesToMass,
  molesToMolecules,
  calculatePercentComposition,
  calculateEmpiricalFormula,
  findLimitingReagent,
  calculateDilution,
  type PercentComposition,
  type LimitingReagentResult,
} from '@/lib/calculations/stoichiometry'

type CalculatorMode =
  | 'molecular-mass'
  | 'mass-to-moles'
  | 'moles-to-mass'
  | 'moles-to-molecules'
  | 'percent-composition'
  | 'empirical-formula'
  | 'limiting-reagent'
  | 'dilution'

export default function StoichiometryPage() {
  const [mode, setMode] = useState<CalculatorMode>('molecular-mass')

  // Molecular Mass
  const [formula, setFormula] = useState('H2O')

  // Mass/Moles conversions
  const [mass, setMass] = useState('18')
  const [moles, setMoles] = useState('1')

  // Percent Composition
  const [composition, setComposition] = useState<PercentComposition | null>(null)

  // Empirical Formula
  const [elementPercents, setElementPercents] = useState<{ [key: string]: number }>({
    C: 40.0,
    H: 6.7,
    O: 53.3,
  })

  // Limiting Reagent
  const [reactant1Formula, setReactant1Formula] = useState('H2')
  const [reactant1Moles, setReactant1Moles] = useState('2')
  const [reactant1Coeff, setReactant1Coeff] = useState('2')
  const [reactant2Formula, setReactant2Formula] = useState('O2')
  const [reactant2Moles, setReactant2Moles] = useState('0.5')
  const [reactant2Coeff, setReactant2Coeff] = useState('1')
  const [productFormula, setProductFormula] = useState('H2O')
  const [productCoeff, setProductCoeff] = useState('2')
  const [limitingResult, setLimitingResult] = useState<LimitingReagentResult | null>(null)

  // Dilution
  const [m1, setM1] = useState('2')
  const [v1, setV1] = useState('100')
  const [v2, setV2] = useState('500')

  const [result, setResult] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Common compound suggestions
  const suggestedCompounds = ['H2O', 'CO2', 'NaCl', 'H2SO4', 'NaOH', 'CH4', 'NH3', 'O2', 'N2', 'Cl2']

  // Compound data lookup - TODO: implement full compound database integration
  // const compoundData = null

  // Calculate based on mode
  const calculate = () => {
    setError(null)
    setResult(null)
    setSteps([])

    try {
      switch (mode) {
        case 'molecular-mass': {
          const mass = calculateMolecularMass(formula)
          setResult(`${mass.toFixed(3)} g/mol`)
          setSteps([
            `Formula: ${formula}`,
            `Breaking down to elements and counting atoms...`,
            `Looking up atomic masses from periodic table...`,
            `Summing: (atomic mass × count) for each element`,
            `Molecular Mass = ${mass.toFixed(3)} g/mol`,
          ])
          break
        }

        case 'mass-to-moles': {
          const massValue = parseFloat(mass)
          const mm = calculateMolecularMass(formula)
          const molesValue = massToMoles(massValue, mm)
          setResult(`${molesValue.toFixed(4)} mol`)
          setSteps([
            `Given: Mass = ${massValue} g`,
            `Formula: ${formula}`,
            `Molecular Mass = ${mm.toFixed(3)} g/mol`,
            ``,
            `Using: n = m / M`,
            `n = ${massValue} g / ${mm.toFixed(3)} g/mol`,
            `n = ${molesValue.toFixed(4)} mol`,
          ])
          break
        }

        case 'moles-to-mass': {
          const molesValue = parseFloat(moles)
          const mm = calculateMolecularMass(formula)
          const massValue = molesToMass(molesValue, mm)
          setResult(`${massValue.toFixed(3)} g`)
          setSteps([
            `Given: Moles = ${molesValue} mol`,
            `Formula: ${formula}`,
            `Molecular Mass = ${mm.toFixed(3)} g/mol`,
            ``,
            `Using: m = n × M`,
            `m = ${molesValue} mol × ${mm.toFixed(3)} g/mol`,
            `m = ${massValue.toFixed(3)} g`,
          ])
          break
        }

        case 'moles-to-molecules': {
          const molesValue = parseFloat(moles)
          const moleculesValue = molesToMolecules(molesValue)
          setResult(`${moleculesValue.toExponential(3)} molecules`)
          setSteps([
            `Given: Moles = ${molesValue} mol`,
            ``,
            `Using Avogadro's Number: Nₐ = 6.022 × 10²³ molecules/mol`,
            ``,
            `Number of molecules = n × Nₐ`,
            `= ${molesValue} mol × 6.022 × 10²³ molecules/mol`,
            `= ${moleculesValue.toExponential(3)} molecules`,
          ])
          break
        }

        case 'percent-composition': {
          const comp = calculatePercentComposition(formula)
          setComposition(comp)
          const total = Object.values(comp).reduce((sum, val) => sum + val, 0)
          setResult(`Total: ${total.toFixed(2)}%`)

          const stepsArray = [
            `Formula: ${formula}`,
            `Molecular Mass = ${calculateMolecularMass(formula).toFixed(3)} g/mol`,
            ``,
            `Percent Composition:`,
          ]

          for (const [element, percent] of Object.entries(comp)) {
            stepsArray.push(`  ${element}: ${percent.toFixed(2)}%`)
          }

          setSteps(stepsArray)
          break
        }

        case 'empirical-formula': {
          const empirical = calculateEmpiricalFormula(elementPercents)
          setResult(empirical)
          setSteps([
            `Given percent composition:`,
            ...Object.entries(elementPercents).map(([el, pct]) => `  ${el}: ${pct}%`),
            ``,
            `Step 1: Assume 100g sample`,
            `Step 2: Convert % to grams`,
            `Step 3: Convert grams to moles (divide by atomic mass)`,
            `Step 4: Divide by smallest moles to get ratio`,
            `Step 5: Multiply to get whole numbers if needed`,
            ``,
            `Empirical Formula: ${empirical}`,
          ])
          break
        }

        case 'limiting-reagent': {
          const r1Moles = parseFloat(reactant1Moles)
          const r1Coeff = parseFloat(reactant1Coeff)
          const r2Moles = parseFloat(reactant2Moles)
          const r2Coeff = parseFloat(reactant2Coeff)
          const pCoeff = parseFloat(productCoeff)

          const lr = findLimitingReagent(
            {
              reactants: [
                { formula: reactant1Formula, moles: r1Moles, coefficient: r1Coeff },
                { formula: reactant2Formula, moles: r2Moles, coefficient: r2Coeff },
              ],
            },
            [{ formula: productFormula, coefficient: pCoeff }]
          )

          setLimitingResult(lr)
          setResult(`Limiting Reagent: ${lr.limitingReagent}`)
          setSteps([
            `Balanced Equation:`,
            `${r1Coeff} ${reactant1Formula} + ${r2Coeff} ${reactant2Formula} → ${pCoeff} ${productFormula}`,
            ``,
            `Given:`,
            `  ${reactant1Formula}: ${r1Moles} mol`,
            `  ${reactant2Formula}: ${r2Moles} mol`,
            ``,
            `Calculate moles of product from each reactant:`,
            `  From ${reactant1Formula}: ${r1Moles} mol × (${pCoeff}/${r1Coeff}) = ${(r1Moles * pCoeff / r1Coeff).toFixed(4)} mol`,
            `  From ${reactant2Formula}: ${r2Moles} mol × (${pCoeff}/${r2Coeff}) = ${(r2Moles * pCoeff / r2Coeff).toFixed(4)} mol`,
            ``,
            `Limiting Reagent: ${lr.limitingReagent} (produces less product)`,
            `Product formed: ${lr.molesProductFormed[productFormula]?.toFixed(4)} mol ${productFormula}`,
          ])
          break
        }

        case 'dilution': {
          const M1 = parseFloat(m1)
          const V1 = parseFloat(v1)
          const V2 = parseFloat(v2)

          const dilution = calculateDilution(M1, V1, undefined, V2)
          setResult(`M₂ = ${dilution.M2.toFixed(4)} M`)
          setSteps([
            `Dilution Formula: M₁V₁ = M₂V₂`,
            ``,
            `Given:`,
            `  M₁ (initial concentration) = ${M1} M`,
            `  V₁ (initial volume) = ${V1} mL`,
            `  V₂ (final volume) = ${V2} mL`,
            ``,
            `Solving for M₂:`,
            `M₂ = (M₁ × V₁) / V₂`,
            `M₂ = (${M1} M × ${V1} mL) / ${V2} mL`,
            `M₂ = ${dilution.M2.toFixed(4)} M`,
            ``,
            `To prepare: Add ${(V2 - V1).toFixed(1)} mL solvent to ${V1} mL of ${M1} M solution`,
          ])
          break
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }

  // Example problems
  const loadExample = (exampleMode: CalculatorMode) => {
    setMode(exampleMode)

    switch (exampleMode) {
      case 'molecular-mass':
        setFormula('C6H12O6')
        break
      case 'mass-to-moles':
        setFormula('NaCl')
        setMass('58.5')
        break
      case 'limiting-reagent':
        setReactant1Formula('H2')
        setReactant1Moles('2')
        setReactant1Coeff('2')
        setReactant2Formula('O2')
        setReactant2Moles('0.5')
        setReactant2Coeff('1')
        setProductFormula('H2O')
        setProductCoeff('2')
        break
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
            <h1 className="text-2xl font-bold">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-primary-600 transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">⚗️ Professional Grade • 8 Calculation Modes</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Stoichiometry</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mole conversions, limiting reagents, and chemical calculations with step-by-step solutions
          </p>
        </div>

        {/* Mode Selector */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Select Calculator Mode</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'molecular-mass', label: 'Molecular Mass', icon: '⚗️' },
              { id: 'mass-to-moles', label: 'Mass → Moles', icon: '⚖️' },
              { id: 'moles-to-mass', label: 'Moles → Mass', icon: '🔢' },
              { id: 'moles-to-molecules', label: 'Moles → Molecules', icon: '🔬' },
              { id: 'percent-composition', label: '% Composition', icon: '📊' },
              { id: 'empirical-formula', label: 'Empirical Formula', icon: '🧪' },
              { id: 'limiting-reagent', label: 'Limiting Reagent', icon: '⚠️' },
              { id: 'dilution', label: 'Dilution (M₁V₁=M₂V₂)', icon: '💧' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as CalculatorMode)}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  mode === m.id
                    ? 'btn-premium glow-premium text-white shadow-xl scale-105'
                    : 'bg-surface hover:bg-surface-hover text-foreground hover:scale-102'
                }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="text-sm">{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Input */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Input Parameters</h2>

          {/* Molecular Mass */}
          {mode === 'molecular-mass' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chemical Formula
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g., H2O, C6H12O6, Ca(OH)2"
                className="input-premium w-full mb-4"
              />
              <div className="text-sm text-gray-600 mb-4">
                Examples: H₂O, C₆H₁₂O₆, Ca(OH)₂, Fe₂O₃
              </div>
              
              {/* Quick Compound Selection */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Quick Select:</div>
                <div className="flex flex-wrap gap-2">
                  {['H2O', 'NaCl', 'C6H12O6', 'CaCO3', 'H2SO4', 'NH3'].map(comp => (
                    <button
                      key={comp}
                      onClick={() => setFormula(comp)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mass to Moles */}
          {mode === 'mass-to-moles' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chemical Formula
                </label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mass (grams)
                </label>
                <input
                  type="number"
                  value={mass}
                  onChange={(e) => setMass(e.target.value)}
                  className="input-premium w-full"
                />
              </div>
            </div>
          )}

          {/* Moles to Mass */}
          {mode === 'moles-to-mass' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chemical Formula
                </label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moles (mol)
                </label>
                <input
                  type="number"
                  value={moles}
                  onChange={(e) => setMoles(e.target.value)}
                  className="input-premium w-full"
                />
              </div>
            </div>
          )}

          {/* Moles to Molecules */}
          {mode === 'moles-to-molecules' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moles (mol)
              </label>
              <input
                type="number"
                value={moles}
                onChange={(e) => setMoles(e.target.value)}
                className="input-premium w-full"
              />
              <div className="text-sm text-gray-600 mt-2">
                Using Avogadro&apos;s Number: 6.022 × 10²³ molecules/mol
              </div>
            </div>
          )}

          {/* Percent Composition */}
          {mode === 'percent-composition' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chemical Formula
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g., H2O, C6H12O6"
                className="input-premium w-full"
              />
            </div>
          )}

          {/* Empirical Formula */}
          {mode === 'empirical-formula' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Element Percent Composition
              </label>
              <div className="space-y-3">
                {Object.entries(elementPercents).map(([element, percent]) => (
                  <div key={element} className="flex items-center gap-3">
                    <span className="w-12 font-semibold">{element}:</span>
                    <input
                      type="number"
                      value={percent}
                      onChange={(e) =>
                        setElementPercents({
                          ...elementPercents,
                          [element]: parseFloat(e.target.value),
                        })
                      }
                      className="input-premium flex-1"
                    />
                    <span className="w-8">%</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-4">
                Example: C: 40%, H: 6.7%, O: 53.3% → Empirical formula: CH₂O
              </div>
            </div>
          )}

          {/* Limiting Reagent */}
          {mode === 'limiting-reagent' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Enter balanced equation coefficients and available moles
              </div>

              <div className="border-2 border-red-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Reactant 1</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coefficient</label>
                    <input
                      type="number"
                      value={reactant1Coeff}
                      onChange={(e) => setReactant1Coeff(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Formula</label>
                    <input
                      type="text"
                      value={reactant1Formula}
                      onChange={(e) => setReactant1Formula(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Moles Available</label>
                    <input
                      type="number"
                      value={reactant1Moles}
                      onChange={(e) => setReactant1Moles(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-red-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Reactant 2</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coefficient</label>
                    <input
                      type="number"
                      value={reactant2Coeff}
                      onChange={(e) => setReactant2Coeff(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Formula</label>
                    <input
                      type="text"
                      value={reactant2Formula}
                      onChange={(e) => setReactant2Formula(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Moles Available</label>
                    <input
                      type="number"
                      value={reactant2Moles}
                      onChange={(e) => setReactant2Moles(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Product</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Coefficient</label>
                    <input
                      type="number"
                      value={productCoeff}
                      onChange={(e) => setProductCoeff(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Formula</label>
                    <input
                      type="text"
                      value={productFormula}
                      onChange={(e) => setProductFormula(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Compound Suggestions */}
              {suggestedCompounds.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-blue-800">Suggested Compounds</h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCompounds.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!reactant1Formula) setReactant1Formula(suggestion)
                          else if (!reactant2Formula) setReactant2Formula(suggestion)
                          else setProductFormula(suggestion)
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dilution */}
          {mode === 'dilution' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-gray-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-red-600">M₁V₁ = M₂V₂</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M₁ (Initial Concentration, M)
                  </label>
                  <input
                    type="number"
                    value={m1}
                    onChange={(e) => setM1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    V₁ (Initial Volume, mL)
                  </label>
                  <input
                    type="number"
                    value={v1}
                    onChange={(e) => setV1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    V₂ (Final Volume, mL)
                  </label>
                  <input
                    type="number"
                    value={v2}
                    onChange={(e) => setV2(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    M₂ will be calculated
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={calculate}
            className="btn-premium glow-premium w-full mt-6 px-8 py-4 text-lg"
          >
            🚀 Calculate Results
          </button>

          {/* Quick Examples */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => loadExample('molecular-mass')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Example: Glucose
            </button>
            <button
              onClick={() => loadExample('mass-to-moles')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Example: NaCl
            </button>
            <button
              onClick={() => loadExample('limiting-reagent')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Example: H₂ + O₂
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="premium-card border-2 border-red-300 p-6 mb-6 bg-red-50/50">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <span className="text-2xl">⚠️</span>
              Error
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="premium-card p-8 mb-6 bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>✨</span> Result
            </h2>
            <div className="text-5xl md:text-6xl font-bold mb-6 animate-pulse-premium">{result}</div>

            {/* Percent Composition Table */}
            {composition && (
              <div className="bg-white/20 rounded-lg p-4 mt-4">
                <h3 className="font-semibold mb-2">Composition Breakdown:</h3>
                {Object.entries(composition).map(([element, percent]) => (
                  <div key={element} className="flex justify-between py-1">
                    <span>{element}:</span>
                    <span className="font-semibold">{percent.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Limiting Reagent Details */}
            {limitingResult && (
              <div className="bg-white/20 rounded-lg p-4 mt-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Limiting Reagent:</span>{' '}
                    {limitingResult.limitingReagent}
                  </div>
                  <div>
                    <span className="font-semibold">Product Formed:</span>{' '}
                    {Object.entries(limitingResult.molesProductFormed).map(([prod, moles]) => (
                      <span key={prod}>
                        {moles.toFixed(4)} mol {prod}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className="font-semibold">Excess Reagent:</span>{' '}
                    {limitingResult.excessReagents
                      .filter((r) => r.excessMoles > 0)
                      .map((r) => (
                        <span key={r.formula}>
                          {r.excessMoles.toFixed(4)} mol {r.formula}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Compound Database Information */}
            {/* TODO: Implement compound database integration
            {compoundData && (
              <div className="bg-white/20 rounded-lg p-4 mt-4">
                <h3 className="font-semibold mb-2">Compound Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {compoundData.name}</div>
                  <div><strong>IUPAC:</strong> {compoundData.iupacName || 'N/A'}</div>
                  <div><strong>Atoms:</strong> {compoundData.calculatedProperties.atomCount}</div>
                  <div><strong>Empirical:</strong> {compoundData.calculatedProperties.empiricalFormula}</div>
                  {compoundData.meltingPoint && <div><strong>MP:</strong> {compoundData.meltingPoint}°C</div>}
                  {compoundData.boilingPoint && <div><strong>BP:</strong> {compoundData.boilingPoint}°C</div>}
                  {compoundData.density && <div><strong>Density:</strong> {compoundData.density.toFixed(3)} g/cm³</div>}
                </div>
                {compoundData.uses && compoundData.uses.length > 0 && (
                  <div className="mt-2">
                    <strong>Uses:</strong> {compoundData.uses.join(', ')}
                  </div>
                )}
              </div>
            )}
            */}
          </div>
        )}

        {/* Compound Information Panel */}
        {/* TODO: Implement compound database integration
        {compoundData && !result && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Compound Information</h2>
            ...
          </div>
        )}
        */}

        {/* Step-by-Step Solution */}
        {steps.length > 0 && (
          <div className="premium-card p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
              <span className="text-2xl">📝</span>
              Step-by-Step Solution
            </h2>
            <div className="space-y-2 font-mono text-sm bg-surface/50 p-6 rounded-lg">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={step === '' ? 'h-2' : 'text-foreground'}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference Info */}
        <div className="premium-card p-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Quick Reference</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-primary-600 mb-3 text-lg">Important Constants</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Avogadro&apos;s Number: 6.022 × 10²³ particles/mol</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>Molar Volume (STP): 22.4 L/mol</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>STP: 0°C (273.15 K), 1 atm</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-primary-600 mb-3 text-lg">Key Formulas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>n = m / M (moles = mass / molar mass)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>m = n × M (mass = moles × molar mass)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>N = n × Nₐ (particles = moles × Avogadro)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>M₁V₁ = M₂V₂ (dilution)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/periodic-table"
              className="btn-premium inline-block px-8 py-4"
            >
              🔬 Open Periodic Table for Atomic Masses
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
