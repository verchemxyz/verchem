'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  calculateMolarity,
  calculateStrongAcidPH,
  calculateStrongBasePH,
  calculateWeakAcidPH,
  calculateWeakBasePH,
  calculateBufferPH,
  calculateDilution as calcDilution,
  STRONG_ACIDS,
  STRONG_BASES,
  type MolarityResult,
  type PHResult,
  type DilutionResult,
} from '@/lib/calculations/solutions'

type CalculatorMode =
  | 'molarity'
  | 'strong-acid-ph'
  | 'strong-base-ph'
  | 'weak-acid-ph'
  | 'weak-base-ph'
  | 'buffer-ph'
  | 'dilution'

export default function SolutionsPage() {
  const [mode, setMode] = useState<CalculatorMode>('strong-acid-ph')

  // Molarity
  const [moles, setMoles] = useState('1')
  const [volumeL, setVolumeL] = useState('1')
  const [molarityResult, setMolarityResult] = useState<MolarityResult | null>(null)

  // pH Calculations
  const [concentration, setConcentration] = useState('0.01')
  const [selectedAcid, setSelectedAcid] = useState('HCl')
  const [selectedBase, setSelectedBase] = useState('NaOH')
  const [ka, setKa] = useState('1.74e-5')
  const [kb, setKb] = useState('1.8e-5')
  const [pka, setPka] = useState('4.76')
  const [acidConc, setAcidConc] = useState('0.1')
  const [conjugateBaseConc, setConjugateBaseConc] = useState('0.1')
  const [phResult, setPhResult] = useState<PHResult | null>(null)

  // Dilution
  const [m1, setM1] = useState('2')
  const [v1, setV1] = useState('100')
  const [v2, setV2] = useState('500')
  const [dilutionResult, setDilutionResult] = useState<DilutionResult | null>(null)

  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Get pH color
  const getPhColor = (ph: number): string => {
    if (ph < 3) return '#dc2626' // Deep red
    if (ph < 5) return '#f97316' // Orange
    if (ph < 6) return '#fbbf24' // Yellow
    if (ph < 8) return '#10b981' // Green
    if (ph < 10) return '#3b82f6' // Blue
    if (ph < 12) return '#8b5cf6' // Purple
    return '#6b21a8' // Deep purple
  }

  // Get pH label
  const getPhLabel = (ph: number): string => {
    if (ph < 7) return 'Acidic'
    if (ph === 7) return 'Neutral'
    return 'Basic'
  }

  // Calculate
  const calculate = () => {
    setError(null)
    setPhResult(null)
    setMolarityResult(null)
    setDilutionResult(null)
    setSteps([])

    try {
      switch (mode) {
        case 'molarity': {
          const n = parseFloat(moles)
          const V = parseFloat(volumeL)
          const result = calculateMolarity(n, V)
          setMolarityResult(result)
          setSteps([
            `Molarity Formula: M = n / V`,
            ``,
            `Given:`,
            `  n (moles of solute) = ${n} mol`,
            `  V (volume of solution) = ${V} L`,
            ``,
            `Calculation:`,
            `M = ${n} mol / ${V} L`,
            `M = ${result.toFixed(4)} M`,
          ])
          break
        }

        case 'strong-acid-ph': {
          const conc = parseFloat(concentration)
          const result = calculateStrongAcidPH(conc)
          setPhResult(result)
          setSteps([
            `Strong Acid: ${selectedAcid} (complete dissociation)`,
            ``,
            `Given:`,
            `  Concentration = ${conc} M`,
            ``,
            `For strong acids: [H⁺] = concentration`,
            `[H⁺] = ${result.H_concentration.toExponential(3)} M`,
            ``,
            `pH Calculation:`,
            `pH = -log₁₀[H⁺]`,
            `pH = -log₁₀(${result.H_concentration.toExponential(3)})`,
            `pH = ${result.pH.toFixed(2)}`,
            ``,
            `pOH = 14 - pH = ${result.pOH.toFixed(2)}`,
            `[OH⁻] = 10⁻ᵖᴼᴴ = ${result.OH_concentration.toExponential(3)} M`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'strong-base-ph': {
          const conc = parseFloat(concentration)
          const result = calculateStrongBasePH(conc)
          setPhResult(result)
          setSteps([
            `Strong Base: ${selectedBase} (complete dissociation)`,
            ``,
            `Given:`,
            `  Concentration = ${conc} M`,
            ``,
            `For strong bases: [OH⁻] = concentration`,
            `[OH⁻] = ${result.OH_concentration.toExponential(3)} M`,
            ``,
            `pOH Calculation:`,
            `pOH = -log₁₀[OH⁻]`,
            `pOH = -log₁₀(${result.OH_concentration.toExponential(3)})`,
            `pOH = ${result.pOH.toFixed(2)}`,
            ``,
            `pH = 14 - pOH`,
            `pH = 14 - ${result.pOH.toFixed(2)}`,
            `pH = ${result.pH.toFixed(2)}`,
            ``,
            `[H⁺] = 10⁻ᵖᴴ = ${result.H_concentration.toExponential(3)} M`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'weak-acid-ph': {
          const conc = parseFloat(concentration)
          const kaValue = parseFloat(ka)
          const result = calculateWeakAcidPH(conc, kaValue)
          setPhResult(result)
          setSteps([
            `Weak Acid: Ka = ${kaValue.toExponential(2)}`,
            ``,
            `Given:`,
            `  Concentration = ${conc} M`,
            `  Ka = ${kaValue.toExponential(2)}`,
            ``,
            `ICE Table: HA ⇌ H⁺ + A⁻`,
            `Initial:  ${conc}    0      0`,
            `Change:   -x        +x     +x`,
            `Equil:    ${conc}-x  x      x`,
            ``,
            `Ka = [H⁺][A⁻] / [HA]`,
            `Ka = x² / (${conc} - x)`,
            ``,
            `Assuming x << ${conc}:`,
            `x² ≈ Ka × ${conc}`,
            `x = √(Ka × C)`,
            `x = √(${kaValue.toExponential(2)} × ${conc})`,
            `x = [H⁺] = ${result.H_concentration.toExponential(3)} M`,
            ``,
            `pH = -log₁₀[H⁺] = ${result.pH.toFixed(2)}`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'weak-base-ph': {
          const conc = parseFloat(concentration)
          const kbValue = parseFloat(kb)
          const result = calculateWeakBasePH(conc, kbValue)
          setPhResult(result)
          setSteps([
            `Weak Base: Kb = ${kbValue.toExponential(2)}`,
            ``,
            `Given:`,
            `  Concentration = ${conc} M`,
            `  Kb = ${kbValue.toExponential(2)}`,
            ``,
            `ICE Table: B + H₂O ⇌ BH⁺ + OH⁻`,
            `Initial:  ${conc}              0      0`,
            `Change:   -x                   +x     +x`,
            `Equil:    ${conc}-x            x      x`,
            ``,
            `Kb = [BH⁺][OH⁻] / [B]`,
            `Kb = x² / (${conc} - x)`,
            ``,
            `Assuming x << ${conc}:`,
            `x² ≈ Kb × ${conc}`,
            `x = √(Kb × C)`,
            `x = [OH⁻] = ${result.OH_concentration.toExponential(3)} M`,
            ``,
            `pOH = -log₁₀[OH⁻] = ${result.pOH.toFixed(2)}`,
            `pH = 14 - pOH = ${result.pH.toFixed(2)}`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'buffer-ph': {
          const pkaValue = parseFloat(pka)
          const acid = parseFloat(acidConc)
          const base = parseFloat(conjugateBaseConc)
          const pH = calculateBufferPH(pkaValue, acid, base)
          setPhResult({ pH })
          setSteps([
            `Henderson-Hasselbalch Equation`,
            ``,
            `Given:`,
            `  pKa = ${pkaValue}`,
            `  [Acid] = ${acid} M`,
            `  [Conjugate Base] = ${base} M`,
            ``,
            `Henderson-Hasselbalch:`,
            `pH = pKa + log₁₀([A⁻] / [HA])`,
            ``,
            `Calculation:`,
            `pH = ${pkaValue} + log₁₀(${base} / ${acid})`,
            `pH = ${pkaValue} + log₁₀(${(base / acid).toFixed(4)})`,
            `pH = ${pkaValue} + ${Math.log10(base / acid).toFixed(4)}`,
            `pH = ${pH.toFixed(2)}`,
            ``,
            `Buffer capacity is highest when [A⁻] = [HA] (pH = pKa)`,
            ``,
            `Classification: ${getPhLabel(pH)}`,
          ])
          break
        }

        case 'dilution': {
          const M1 = parseFloat(m1)
          const V1 = parseFloat(v1)
          const V2 = parseFloat(v2)
          const result = calcDilution({ M1, V1, V2 })
          setDilutionResult(result)
          setSteps([
            `Dilution Formula: M₁V₁ = M₂V₂`,
            ``,
            `Given:`,
            `  M₁ = ${M1} M`,
            `  V₁ = ${V1} mL`,
            `  V₂ = ${V2} mL`,
            ``,
            `Solving for M₂:`,
            `M₂ = (M₁ × V₁) / V₂`,
            `M₂ = (${M1} × ${V1}) / ${V2}`,
            `M₂ = ${result.M2.toFixed(4)} M`,
            ``,
            `Preparation:`,
            `1. Measure ${V1} mL of ${M1} M solution`,
            `2. Add solvent to reach ${V2} mL total volume`,
            `3. Volume of solvent to add: ${(V2 - V1).toFixed(1)} mL`,
          ])
          break
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }

  // Load example
  const loadExample = (exampleMode: CalculatorMode) => {
    setMode(exampleMode)
    switch (exampleMode) {
      case 'strong-acid-ph':
        setConcentration('0.01')
        setSelectedAcid('HCl')
        break
      case 'buffer-ph':
        setPka('4.76')
        setAcidConc('0.1')
        setConjugateBaseConc('0.1')
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
          <div className="badge-premium mb-4">🧪 Scientific Precision • 7 Calculation Modes</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Solutions & pH</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Molarity, pH, buffers, and dilution calculations with visual pH scale
          </p>
        </div>

        {/* Mode Selector */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Select Calculator Mode</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'molarity', label: 'Molarity (M)', icon: '⚗️' },
              { id: 'strong-acid-ph', label: 'Strong Acid pH', icon: '🔴' },
              { id: 'strong-base-ph', label: 'Strong Base pH', icon: '🔵' },
              { id: 'weak-acid-ph', label: 'Weak Acid pH', icon: '🟠' },
              { id: 'weak-base-ph', label: 'Weak Base pH', icon: '🟣' },
              { id: 'buffer-ph', label: 'Buffer pH', icon: '💚' },
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

          {/* Molarity */}
          {mode === 'molarity' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moles of Solute (mol)
                </label>
                <input
                  type="number"
                  value={moles}
                  onChange={(e) => setMoles(e.target.value)}
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume of Solution (L)
                </label>
                <input
                  type="number"
                  value={volumeL}
                  onChange={(e) => setVolumeL(e.target.value)}
                  className="input-premium w-full"
                />
              </div>
            </div>
          )}

          {/* Strong Acid pH */}
          {mode === 'strong-acid-ph' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Strong Acid
                </label>
                <select
                  value={selectedAcid}
                  onChange={(e) => setSelectedAcid(e.target.value)}
                  className="input-premium w-full"
                >
                  {STRONG_ACIDS.map((formula) => (
                    <option key={formula} value={formula}>
                      {formula}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concentration (M)
                </label>
                <input
                  type="number"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  step="0.001"
                  className="input-premium w-full"
                />
              </div>
            </div>
          )}

          {/* Strong Base pH */}
          {mode === 'strong-base-ph' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Strong Base
                </label>
                <select
                  value={selectedBase}
                  onChange={(e) => setSelectedBase(e.target.value)}
                  className="input-premium w-full"
                >
                  {STRONG_BASES.map((formula) => (
                    <option key={formula} value={formula}>
                      {formula}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concentration (M)
                </label>
                <input
                  type="number"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  step="0.001"
                  className="input-premium w-full"
                />
              </div>
            </div>
          )}

          {/* Weak Acid pH */}
          {mode === 'weak-acid-ph' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concentration (M)
                </label>
                <input
                  type="number"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  step="0.001"
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ka (acid dissociation constant)
                </label>
                <input
                  type="text"
                  value={ka}
                  onChange={(e) => setKa(e.target.value)}
                  placeholder="e.g., 1.74e-5"
                  className="input-premium w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                Common weak acids: CH₃COOH (Ka = 1.74×10⁻⁵), HF (Ka = 6.8×10⁻⁴)
              </div>
            </div>
          )}

          {/* Weak Base pH */}
          {mode === 'weak-base-ph' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concentration (M)
                </label>
                <input
                  type="number"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  step="0.001"
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kb (base dissociation constant)
                </label>
                <input
                  type="text"
                  value={kb}
                  onChange={(e) => setKb(e.target.value)}
                  placeholder="e.g., 1.8e-5"
                  className="input-premium w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                Common weak base: NH₃ (Kb = 1.8×10⁻⁵)
              </div>
            </div>
          )}

          {/* Buffer pH */}
          {mode === 'buffer-ph' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-green-50 rounded-lg mb-4">
                <div className="text-xl font-bold text-green-700">
                  Henderson-Hasselbalch Equation
                </div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  pH = pKa + log([A⁻]/[HA])
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pKa of Weak Acid
                </label>
                <input
                  type="number"
                  value={pka}
                  onChange={(e) => setPka(e.target.value)}
                  step="0.01"
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  [Weak Acid] (M)
                </label>
                <input
                  type="number"
                  value={acidConc}
                  onChange={(e) => setAcidConc(e.target.value)}
                  step="0.01"
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  [Conjugate Base] (M)
                </label>
                <input
                  type="number"
                  value={conjugateBaseConc}
                  onChange={(e) => setConjugateBaseConc(e.target.value)}
                  step="0.01"
                  className="input-premium w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                Example: Acetate buffer (CH₃COOH/CH₃COO⁻, pKa = 4.76)
              </div>
            </div>
          )}

          {/* Dilution */}
          {mode === 'dilution' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-blue-600">M₁V₁ = M₂V₂</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M₁ (Initial Molarity, M)
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
              onClick={() => loadExample('strong-acid-ph')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Example: 0.01 M HCl
            </button>
            <button
              onClick={() => loadExample('buffer-ph')}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Example: Acetate Buffer
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
        {(phResult || molarityResult || dilutionResult) && (
          <div className="mb-6">
            {/* Molarity Result */}
            {molarityResult && (
              <div className="premium-card p-8 bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>✨</span> Result
                </h2>
                <div className="text-5xl md:text-6xl font-bold mb-2 animate-pulse-premium">
                  {molarityResult.toFixed(4)} M
                </div>
                <div className="text-xl opacity-90">Molarity</div>
              </div>
            )}

            {/* pH Result with pH Scale */}
            {phResult && (
              <div>
                {/* pH Scale Visualization */}
                <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
                  <h2 className="text-2xl font-bold mb-4 text-center">pH Scale</h2>

                  {/* pH Meter */}
                  <div className="relative h-16 mb-8">
                    {/* Gradient background */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background:
                          'linear-gradient(to right, #dc2626, #f97316, #fbbf24, #10b981, #3b82f6, #8b5cf6, #6b21a8)',
                      }}
                    />

                    {/* pH labels */}
                    <div className="absolute inset-0 flex justify-between items-center px-2 text-white font-bold text-sm">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((ph) => (
                        <div key={ph} className="text-center">
                          {ph}
                        </div>
                      ))}
                    </div>

                    {/* Current pH indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-black"
                      style={{
                        left: `${(phResult.pH / 14) * 100}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded font-bold whitespace-nowrap">
                        pH {phResult.pH.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* pH Category Labels */}
                  <div className="flex justify-between text-sm font-semibold mb-6">
                    <span className="text-red-600">ACIDIC</span>
                    <span className="text-green-600">NEUTRAL</span>
                    <span className="text-purple-600">BASIC</span>
                  </div>
                </div>

                {/* pH Values Card */}
                <div
                  className="rounded-xl p-6 shadow-lg text-white"
                  style={{
                    background: `linear-gradient(135deg, ${getPhColor(
                      phResult.pH
                    )}, ${getPhColor(phResult.pH)}dd)`,
                  }}
                >
                  <h2 className="text-2xl font-bold mb-4">Result</h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-sm opacity-90 mb-1">pH</div>
                      <div className="text-3xl font-bold">{phResult.pH.toFixed(2)}</div>
                    </div>
                    {phResult.pOH !== undefined && (
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="text-sm opacity-90 mb-1">pOH</div>
                        <div className="text-3xl font-bold">{phResult.pOH.toFixed(2)}</div>
                      </div>
                    )}
                    {phResult.H_concentration !== undefined && (
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="text-sm opacity-90 mb-1">[H⁺]</div>
                        <div className="text-lg font-bold">
                          {phResult.H_concentration.toExponential(2)} M
                        </div>
                      </div>
                    )}
                    {phResult.OH_concentration !== undefined && (
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="text-sm opacity-90 mb-1">[OH⁻]</div>
                        <div className="text-lg font-bold">
                          {phResult.OH_concentration.toExponential(2)} M
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-2xl font-bold">
                    {getPhLabel(phResult.pH).toUpperCase()} Solution
                  </div>
                </div>
              </div>
            )}

            {/* Dilution Result */}
            {dilutionResult && (
              <div className="premium-card p-8 bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span>✨</span> Result
                </h2>
                <div className="text-5xl md:text-6xl font-bold mb-2 animate-pulse-premium">
                  M₂ = {dilutionResult.M2.toFixed(4)} M
                </div>
                <div className="text-xl opacity-90">Final Concentration</div>
              </div>
            )}
          </div>
        )}

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
              <h3 className="font-semibold text-indigo-600 mb-2">pH Scale</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• pH &lt; 7: Acidic (more H⁺)</li>
                <li>• pH = 7: Neutral (pure water)</li>
                <li>• pH &gt; 7: Basic/Alkaline (more OH⁻)</li>
                <li>• pH + pOH = 14 (at 25°C)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-indigo-600 mb-2">Key Formulas</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• pH = -log[H⁺]</li>
                <li>• pOH = -log[OH⁻]</li>
                <li>• pH = pKa + log([A⁻]/[HA]) (Henderson-Hasselbalch)</li>
                <li>• M₁V₁ = M₂V₂ (dilution)</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-700 mb-2">💡 Tips</h3>
            <ul className="space-y-1 text-sm text-blue-600">
              <li>• Strong acids/bases: Complete dissociation</li>
              <li>• Weak acids/bases: Use Ka/Kb for equilibrium</li>
              <li>• Buffers: Most effective when pH ≈ pKa</li>
              <li>• Dilution: Never add water to acid (add acid to water!)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
