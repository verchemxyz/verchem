'use client'

// VerChem - Thermodynamics Calculator Page

import { useState } from 'react'
import Link from 'next/link'
import { analyzeReaction, EXAMPLE_REACTIONS, THERMODYNAMIC_DATA } from '@/lib/calculations/thermodynamics'
import type { ThermodynamicResult } from '@/lib/calculations/thermodynamics'

export default function ThermodynamicsPage() {
  const [selectedExample, setSelectedExample] = useState<number | null>(null)
  const [temperature, setTemperature] = useState(298.15)
  const [result, setResult] = useState<ThermodynamicResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reactants and products state
  const [reactants, setReactants] = useState<{ formula: string; coefficient: number }[]>([
    { formula: '', coefficient: 1 },
  ])
  const [products, setProducts] = useState<{ formula: string; coefficient: number }[]>([
    { formula: '', coefficient: 1 },
  ])

  // Load example reaction
  const loadExample = (index: number) => {
    const example = EXAMPLE_REACTIONS[index]
    setSelectedExample(index)
    setReactants(example.reactants)
    setProducts(example.products)
    setTemperature(298.15)
    setError(null)
    setResult(null)
  }

  // Add reactant/product
  const addReactant = () => {
    setReactants([...reactants, { formula: '', coefficient: 1 }])
  }

  const addProduct = () => {
    setProducts([...products, { formula: '', coefficient: 1 }])
  }

  // Remove reactant/product
  const removeReactant = (index: number) => {
    if (reactants.length > 1) {
      setReactants(reactants.filter((_, i) => i !== index))
    }
  }

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index))
    }
  }

  // Update reactant/product
  const updateReactant = (index: number, field: 'formula' | 'coefficient', value: string | number) => {
    const updated = [...reactants]
    if (field === 'formula') {
      updated[index].formula = value as string
    } else {
      updated[index].coefficient = typeof value === 'string' ? parseFloat(value) || 0 : value
    }
    setReactants(updated)
  }

  const updateProduct = (index: number, field: 'formula' | 'coefficient', value: string | number) => {
    const updated = [...products]
    if (field === 'formula') {
      updated[index].formula = value as string
    } else {
      updated[index].coefficient = typeof value === 'string' ? parseFloat(value) || 0 : value
    }
    setProducts(updated)
  }

  // Calculate thermodynamics
  const calculate = () => {
    setError(null)
    setResult(null)

    // Validate inputs
    const validReactants = reactants.filter(r => r.formula.trim() !== '' && r.coefficient > 0)
    const validProducts = products.filter(p => p.formula.trim() !== '' && p.coefficient > 0)

    if (validReactants.length === 0) {
      setError('Please add at least one reactant')
      return
    }

    if (validProducts.length === 0) {
      setError('Please add at least one product')
      return
    }

    if (temperature <= 0) {
      setError('Temperature must be greater than 0 K')
      return
    }

    // Calculate
    const calculationResult = analyzeReaction(validProducts, validReactants, temperature)

    if (!calculationResult) {
      setError('Calculation failed. Please check that all compounds are in the database.')
      return
    }

    setResult(calculationResult)
  }

  // Get available formulas from database
  const availableFormulas = THERMODYNAMIC_DATA.map(d => d.formula)

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
              <p className="text-xs text-muted-foreground">Thermodynamics</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/thermodynamics/enhanced-page"
              className="badge-premium"
            >
              ⚡ Enhanced (uncertainty)
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">🔥 ΔH, ΔS, ΔG, K • Step-by-Step</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Thermodynamics</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Calculate ΔH°, ΔS°, ΔG°, and K for chemical reactions with detailed explanations
          </p>
        </div>

        {/* Example Reactions */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-primary-600">Example Reactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAMPLE_REACTIONS.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(index)}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                  selectedExample === index
                    ? 'border-primary-500 bg-primary-50 scale-105'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
                }`}
              >
                <div className="text-sm font-medium text-foreground mb-2">
                  {example.name}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {example.equation}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="premium-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary-600">Reaction Input</h2>
            <button
              onClick={() => {
                setSelectedExample(null)
                setReactants([{ formula: '', coefficient: 1 }])
                setProducts([{ formula: '', coefficient: 1 }])
                setError(null)
                setResult(null)
              }}
              className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg text-sm font-medium transition-colors"
            >
              Clear & Start Custom
            </button>
          </div>

          {/* Reactants */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700">Reactants</h3>
              <button
                onClick={addReactant}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Reactant
              </button>
            </div>
            {reactants.map((reactant, index) => (
              <div key={index} className="flex items-center gap-3 mb-3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={reactant.coefficient}
                  onChange={(e) => updateReactant(index, 'coefficient', e.target.value)}
                  className="input-premium w-20"
                  placeholder="Coef"
                />
                <input
                  type="text"
                  value={reactant.formula}
                  onChange={(e) => updateReactant(index, 'formula', e.target.value)}
                  className="input-premium flex-1 font-mono"
                  placeholder="Formula (e.g., H2, O2, CH4)"
                  list={`reactant-formulas-${index}`}
                />
                <datalist id={`reactant-formulas-${index}`}>
                  {availableFormulas.map((formula) => (
                    <option key={formula} value={formula} />
                  ))}
                </datalist>
                {reactants.length > 1 && (
                  <button
                    onClick={() => removeReactant(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="text-center text-2xl text-gray-400 mb-6">→</div>

          {/* Products */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700">Products</h3>
              <button
                onClick={addProduct}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Product
              </button>
            </div>
            {products.map((product, index) => (
              <div key={index} className="flex items-center gap-3 mb-3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={product.coefficient}
                  onChange={(e) => updateProduct(index, 'coefficient', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Coef"
                />
                <input
                  type="text"
                  value={product.formula}
                  onChange={(e) => updateProduct(index, 'formula', e.target.value)}
                  className="input-premium flex-1 font-mono"
                  placeholder="Formula (e.g., H2O, CO2)"
                  list={`product-formulas-${index}`}
                />
                <datalist id={`product-formulas-${index}`}>
                  {availableFormulas.map((formula) => (
                    <option key={formula} value={formula} />
                  ))}
                </datalist>
                {products.length > 1 && (
                  <button
                    onClick={() => removeProduct(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Temperature */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (K)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value) || 298.15)}
              className="input-premium w-full"
              placeholder="298.15"
            />
            <p className="text-xs text-gray-500 mt-1">
              Standard temperature = 298.15 K (25°C)
            </p>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculate}
            className="btn-premium glow-premium w-full py-4 text-lg"
          >
            🔥 Calculate Thermodynamics
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="premium-card p-8 bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>✨</span> Results Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:bg-white/30 transition-all">
                  <div className="text-sm font-medium mb-1 opacity-90">Enthalpy Change</div>
                  <div className="text-2xl font-bold animate-pulse-premium">
                    {result.deltaH.toFixed(2)} kJ
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {result.deltaH < 0 ? 'Exothermic' : result.deltaH > 0 ? 'Endothermic' : 'Thermoneutral'}
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:bg-white/30 transition-all">
                  <div className="text-sm font-medium mb-1 opacity-90">Entropy Change</div>
                  <div className="text-2xl font-bold animate-pulse-premium">
                    {result.deltaS.toFixed(2)} J/K
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {result.deltaS > 0 ? 'Increasing disorder' : result.deltaS < 0 ? 'Decreasing disorder' : 'No change'}
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:bg-white/30 transition-all">
                  <div className="text-sm font-medium mb-1 opacity-90">Gibbs Free Energy</div>
                  <div className="text-2xl font-bold animate-pulse-premium">
                    {result.deltaG.toFixed(2)} kJ
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {result.spontaneous ? 'Spontaneous ✓' : 'Non-spontaneous ✗'}
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 hover:bg-white/30 transition-all">
                  <div className="text-sm font-medium mb-1 opacity-90">Equilibrium Constant</div>
                  <div className="text-xl font-bold animate-pulse-premium">
                    {result.K !== undefined ? result.K.toExponential(4) : 'N/A'}
                  </div>
                  <div className="text-xs mt-1 opacity-80">
                    {result.K !== undefined && result.K > 1 ? 'Products favored' : 'Reactants favored'}
                  </div>
                </div>
              </div>

              {/* Temperature */}
              <div className="mt-4 text-sm opacity-90">
                Calculated at {result.temperature} K ({(result.temperature - 273.15).toFixed(2)}°C)
              </div>
            </div>

            {/* Step-by-Step Solution */}
            <div className="premium-card p-6">
              <h2 className="text-2xl font-bold mb-4 text-primary-600">Step-by-Step Solution</h2>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
                {result.steps.map((step, index) => (
                  <div key={index} className={step.startsWith('===') ? 'font-bold text-lg mt-4' : step.startsWith('✓') || step.startsWith('✗') ? 'text-green-700 font-medium' : step.startsWith('❌') ? 'text-red-700 font-medium' : ''}>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Interpretation */}
            <div className="premium-card p-6 bg-primary-50/50 border-2 border-primary-200">
              <h2 className="text-2xl font-bold mb-4 text-primary-600">Interpretation</h2>
              <div className="space-y-3 text-foreground">
                <div>
                  <strong>Energy:</strong> This reaction {result.deltaH < 0 ? 'releases' : 'absorbs'} {Math.abs(result.deltaH).toFixed(2)} kJ of heat {result.deltaH < 0 ? '(exothermic)' : '(endothermic)'}.
                </div>
                <div>
                  <strong>Disorder:</strong> The system&apos;s entropy {result.deltaS > 0 ? 'increases' : 'decreases'} by {Math.abs(result.deltaS).toFixed(2)} J/K, meaning the products are {result.deltaS > 0 ? 'more disordered' : 'more ordered'} than the reactants.
                </div>
                <div>
                  <strong>Spontaneity:</strong> At {result.temperature} K, this reaction is {result.spontaneous ? 'spontaneous (ΔG < 0)' : 'non-spontaneous (ΔG > 0)'}. {result.spontaneous ? 'It can proceed on its own without external energy input.' : 'It requires energy input to proceed.'}
                </div>
                {result.K !== undefined && (
                  <div>
                    <strong>Equilibrium:</strong> K = {result.K.toExponential(4)}. {result.K > 1 ? 'At equilibrium, products are heavily favored (K >> 1).' : result.K < 1e-3 ? 'At equilibrium, reactants are heavily favored (K << 1).' : 'At equilibrium, reactants and products are present in comparable amounts.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Compounds */}
        <div className="mt-8 premium-card p-6">
          <h2 className="text-xl font-bold mb-4 text-primary-600">Available Compounds Database</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {THERMODYNAMIC_DATA.length} compounds available. Use exact formulas from this list:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {THERMODYNAMIC_DATA.map((compound) => (
              <div
                key={compound.formula}
                className="px-3 py-2 bg-surface hover:bg-surface-hover rounded border border-gray-200 text-center transition-all"
                title={compound.compound}
              >
                <div className="font-mono text-sm font-bold text-foreground">{compound.formula}</div>
                <div className="text-xs text-muted-foreground truncate">{compound.compound}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Theory Section */}
        <div className="mt-8 premium-card p-6 bg-primary-50/50 border-2 border-primary-200">
          <h3 className="text-lg font-bold mb-3 text-primary-600 flex items-center gap-2">
            <span>💡</span> Thermodynamics Theory
          </h3>
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <strong>Enthalpy (ΔH°):</strong> Energy absorbed or released during a reaction. Calculated using Hess&apos;s Law: ΔH°rxn = Σ(ΔH°f products) - Σ(ΔH°f reactants)
            </div>
            <div>
              <strong>Entropy (ΔS°):</strong> Measure of disorder or randomness. ΔS°rxn = Σ(S° products) - Σ(S° reactants)
            </div>
            <div>
              <strong>Gibbs Free Energy (ΔG°):</strong> Determines spontaneity. ΔG° = ΔH° - TΔS°. If ΔG° &lt; 0, reaction is spontaneous.
            </div>
            <div>
              <strong>Equilibrium Constant (K):</strong> Ratio of products to reactants at equilibrium. ΔG° = -RT ln(K), so K = e^(-ΔG°/RT)
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Thermodynamics • Built with ❤️ for chemistry students worldwide</p>
          <p className="mt-2 text-xs">
            Data from NIST and standard thermodynamic tables
          </p>
        </div>
      </footer>
    </div>
  )
}
