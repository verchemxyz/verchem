'use client'

// VerChem - Thermodynamics Calculator Page

import { useState } from 'react'
import Link from 'next/link'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
  ErrorBanner,
} from '@/components/lab'
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
    <CalcShell
      eyebrow="Physical chemistry · ΔH, ΔS, ΔG, K"
      title="Thermodynamics"
      subtitle="Calculate ΔH°, ΔS°, ΔG°, and K for chemical reactions with step-by-step explanations."
      backHref="/"
      backLabel="Home"
      maxWidth="6xl"
      action={
        <Link
          href="/thermodynamics/enhanced-page"
          className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Enhanced (uncertainty)
        </Link>
      }
    >
      {/* Example Reactions */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Example reactions</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAMPLE_REACTIONS.map((example, index) => (
            <button
              key={index}
              onClick={() => loadExample(index)}
              className={`text-left p-4 rounded-md border transition-colors ${
                selectedExample === index
                  ? 'border-primary-500 bg-muted ring-1 ring-primary-500/40'
                  : 'border-border bg-card hover:border-primary-500/40 hover:bg-muted'
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
      </Card>

      {/* Input Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Reaction input</SectionTitle>
          <button
            onClick={() => {
              setSelectedExample(null)
              setReactants([{ formula: '', coefficient: 1 }])
              setProducts([{ formula: '', coefficient: 1 }])
              setError(null)
              setResult(null)
            }}
            className="px-4 py-2 border border-border bg-card hover:bg-muted rounded-md text-sm font-medium transition-colors"
          >
            Clear & Start Custom
          </button>
        </div>

        {/* Reactants */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Reactants</h3>
            <button
              onClick={addReactant}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
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
                aria-label="Reactant coefficient"
              />
              <input
                type="text"
                value={reactant.formula}
                onChange={(e) => updateReactant(index, 'formula', e.target.value)}
                className="input-premium flex-1 font-mono"
                placeholder="Formula (e.g., H2, O2, CH4)"
                aria-label="Reactant formula"
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
                  aria-label="Remove reactant"
                  className="text-destructive hover:bg-destructive/10 rounded-md p-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="text-center text-2xl text-muted-foreground mb-6">→</div>

        {/* Products */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Products</h3>
            <button
              onClick={addProduct}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
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
                className="input-premium w-20"
                placeholder="Coef"
                aria-label="Product coefficient"
              />
              <input
                type="text"
                value={product.formula}
                onChange={(e) => updateProduct(index, 'formula', e.target.value)}
                className="input-premium flex-1 font-mono"
                placeholder="Formula (e.g., H2O, CO2)"
                aria-label="Product formula"
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
                  aria-label="Remove product"
                  className="text-destructive hover:bg-destructive/10 rounded-md p-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Temperature */}
        <Field label="Temperature (K)" hint="Standard temperature = 298.15 K (25°C)" className="mb-6">
          <input
            type="number"
            min="0"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value) || 298.15)}
            className="input-premium w-full"
            placeholder="298.15"
          />
        </Field>

        {/* Calculate Button */}
        <Button onClick={calculate} className="w-full">
          Calculate Thermodynamics
        </Button>

        {/* Error */}
        {error && <ErrorBanner className="mt-4">{error}</ErrorBanner>}
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-6 border-l-2 border-l-primary-500">
            <div className="text-xs uppercase tracking-wider text-primary-600 mb-4 font-medium">Results summary</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted rounded-md p-4 border border-border">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Enthalpy Change</div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {result.deltaH.toFixed(2)} kJ
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {result.deltaH < 0 ? 'Exothermic' : result.deltaH > 0 ? 'Endothermic' : 'Thermoneutral'}
                </div>
              </div>

              <div className="bg-muted rounded-md p-4 border border-border">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Entropy Change</div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {result.deltaS.toFixed(2)} J/K
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {result.deltaS > 0 ? 'Increasing disorder' : result.deltaS < 0 ? 'Decreasing disorder' : 'No change'}
                </div>
              </div>

              <div className="bg-muted rounded-md p-4 border border-border">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Gibbs Free Energy</div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {result.deltaG.toFixed(2)} kJ
                </div>
                <div className={`text-xs mt-1 font-medium ${result.spontaneous ? 'text-success' : 'text-muted-foreground'}`}>
                  {result.spontaneous ? 'Spontaneous' : 'Non-spontaneous'}
                </div>
              </div>

              <div className="bg-muted rounded-md p-4 border border-border">
                <div className="text-sm font-medium mb-1 text-muted-foreground">Equilibrium Constant</div>
                <div className="text-xl font-bold font-mono text-foreground">
                  {result.K !== undefined ? result.K.toExponential(4) : 'N/A'}
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {result.K !== undefined && result.K > 1 ? 'Products favored' : 'Reactants favored'}
                </div>
              </div>
            </div>

            {/* Temperature */}
            <div className="mt-4 text-sm text-muted-foreground">
              Calculated at {result.temperature} K ({(result.temperature - 273.15).toFixed(2)}°C)
            </div>
          </Card>

          {/* Step-by-Step Solution */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Step-by-step solution</SectionTitle>
            <div className="bg-muted border border-border rounded-md p-4 font-mono text-sm space-y-2 overflow-x-auto">
              {result.steps.map((step, index) => (
                <div key={index} className={step.startsWith('===') ? 'font-bold text-base mt-4 text-foreground' : step.startsWith('✓') || step.startsWith('✗') ? 'text-success font-medium' : step.startsWith('❌') ? 'text-destructive font-medium' : 'text-foreground'}>
                  {step}
                </div>
              ))}
            </div>
          </Card>

          {/* Interpretation */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Interpretation</SectionTitle>
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
          </Card>
        </div>
      )}

      {/* Available Compounds */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Available compounds database</SectionTitle>
        <p className="text-sm text-muted-foreground mb-4">
          {THERMODYNAMIC_DATA.length} compounds available. Use exact formulas from this list:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {THERMODYNAMIC_DATA.map((compound) => (
            <div
              key={compound.formula}
              className="px-3 py-2 bg-muted hover:bg-card rounded-md border border-border text-center transition-colors"
              title={compound.compound}
            >
              <div className="font-mono text-sm font-bold text-foreground">{compound.formula}</div>
              <div className="text-xs text-muted-foreground truncate">{compound.compound}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Theory Section */}
      <Card className="p-6">
        <SectionTitle className="mb-3">Thermodynamics theory</SectionTitle>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong className="text-foreground">Enthalpy (ΔH°):</strong> Energy absorbed or released during a reaction. Calculated using Hess&apos;s Law: ΔH°rxn = Σ(ΔH°f products) - Σ(ΔH°f reactants)
          </div>
          <div>
            <strong className="text-foreground">Entropy (ΔS°):</strong> Measure of disorder or randomness. ΔS°rxn = Σ(S° products) - Σ(S° reactants)
          </div>
          <div>
            <strong className="text-foreground">Gibbs Free Energy (ΔG°):</strong> Determines spontaneity. ΔG° = ΔH° - TΔS°. If ΔG° &lt; 0, reaction is spontaneous.
          </div>
          <div>
            <strong className="text-foreground">Equilibrium Constant (K):</strong> Ratio of products to reactants at equilibrium. ΔG° = -RT ln(K), so K = e^(-ΔG°/RT)
          </div>
        </div>
      </Card>
    </CalcShell>
  )
}
