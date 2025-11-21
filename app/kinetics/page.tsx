'use client'

// VerChem - Chemical Kinetics Calculator Page

import { useState } from 'react'
import Link from 'next/link'
import {
  calculateConcentration,
  calculateRateConstant,
  arrheniusEquation,
  calculateActivationEnergy,
  determineReactionOrder,
  EXAMPLE_KINETICS,
  EXAMPLE_ARRHENIUS,
} from '@/lib/calculations/kinetics'
import type { RateOrder, RateLawResult, ArrheniusResult, ActivationEnergyResult } from '@/lib/calculations/kinetics'

type CalculatorMode = 'concentration' | 'rate-constant' | 'arrhenius' | 'activation' | 'order'

export default function KineticsPage() {
  const [mode, setMode] = useState<CalculatorMode>('concentration')
  const [result, setResult] = useState<RateLawResult | ArrheniusResult | ActivationEnergyResult | { order: RateOrder; k: number; r2: number; steps: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Concentration calculator state
  const [order, setOrder] = useState<RateOrder>('first')
  const [initialConc, setInitialConc] = useState(1.0)
  const [k, setK] = useState(0.001)
  const [time, setTime] = useState(100)

  // Rate constant calculator state
  const [finalConc, setFinalConc] = useState(0.5)

  // Arrhenius state
  const [A, setA] = useState(1.0e13)
  const [Ea, setEa] = useState(75000)
  const [temperature, setTemperature] = useState(298.15)

  // Activation energy state
  const [k1, setK1] = useState(0.001)
  const [T1, setT1] = useState(298)
  const [k2, setK2] = useState(0.01)
  const [T2, setT2] = useState(318)

  // Reaction order determination state
  const [dataPoints, setDataPoints] = useState<{ time: number; concentration: number }[]>([
    { time: 0, concentration: 1.0 },
    { time: 100, concentration: 0.5 },
    { time: 200, concentration: 0.25 },
  ])

  // Load example
  const loadExample = (index: number) => {
    const example = EXAMPLE_KINETICS[index]
    setOrder(example.order)
    setInitialConc(example.initialConcentration)
    setK(example.k)
    setTime(example.time)
    setMode('concentration')
    setResult(null)
    setError(null)
  }

  const loadArrheniusExample = (index: number) => {
    const example = EXAMPLE_ARRHENIUS[index]
    setA(example.A)
    setEa(example.Ea)
    setTemperature(example.temperature)
    setMode('arrhenius')
    setResult(null)
    setError(null)
  }

  // Calculate concentration
  const calculateConc = () => {
    setError(null)
    if (initialConc <= 0) {
      setError('Initial concentration must be positive')
      return
    }
    if (k <= 0) {
      setError('Rate constant must be positive')
      return
    }
    if (time < 0) {
      setError('Time cannot be negative')
      return
    }

    const result = calculateConcentration(order, initialConc, k, time)
    setResult(result)
  }

  // Calculate rate constant
  const calculateK = () => {
    setError(null)
    if (initialConc <= 0 || finalConc <= 0) {
      setError('Concentrations must be positive')
      return
    }
    if (finalConc > initialConc) {
      setError('Final concentration cannot exceed initial concentration')
      return
    }
    if (time <= 0) {
      setError('Time must be greater than 0')
      return
    }

    const result = calculateRateConstant(order, initialConc, finalConc, time)
    if (!result) {
      setError('Calculation failed. Check your inputs.')
      return
    }
    setResult({ ...result, order, concentration: finalConc, time, halfLife: 0 } as RateLawResult)
  }

  // Calculate Arrhenius
  const calculateArrhenius = () => {
    setError(null)
    if (A <= 0) {
      setError('Pre-exponential factor must be positive')
      return
    }
    if (Ea <= 0) {
      setError('Activation energy must be positive')
      return
    }
    if (temperature <= 0) {
      setError('Temperature must be positive (in Kelvin)')
      return
    }

    const result = arrheniusEquation(A, Ea, temperature)
    setResult(result)
  }

  // Calculate activation energy
  const calculateEa = () => {
    setError(null)
    if (k1 <= 0 || k2 <= 0) {
      setError('Rate constants must be positive')
      return
    }
    if (T1 <= 0 || T2 <= 0) {
      setError('Temperatures must be positive (in Kelvin)')
      return
    }

    const result = calculateActivationEnergy(k1, T1, k2, T2)
    if (!result) {
      setError('Calculation failed. Check your inputs.')
      return
    }
    setResult(result)
  }

  // Determine order
  const determineOrder = () => {
    setError(null)
    if (dataPoints.length < 3) {
      setError('Need at least 3 data points')
      return
    }

    const result = determineReactionOrder(dataPoints)
    if (!result) {
      setError('Calculation failed. Check your data.')
      return
    }
    setResult(result)
  }

  // Add/remove data points
  const addDataPoint = () => {
    setDataPoints([...dataPoints, { time: 0, concentration: 0 }])
  }

  const removeDataPoint = (index: number) => {
    if (dataPoints.length > 2) {
      setDataPoints(dataPoints.filter((_, i) => i !== index))
    }
  }

  const updateDataPoint = (index: number, field: 'time' | 'concentration', value: number) => {
    const updated = [...dataPoints]
    updated[index][field] = value
    setDataPoints(updated)
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
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Chemical Kinetics</p>
            </div>
          </Link>
          <Link href="/" className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">⏱️ Rate Laws • Arrhenius • Half-Life</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Chemical Kinetics</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Rate laws, Arrhenius equation, half-life, and activation energy calculations
          </p>
        </div>

        {/* Mode Selection */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-primary-600">Calculator Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => { setMode('concentration'); setResult(null); setError(null); }}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                mode === 'concentration'
                  ? 'border-primary-500 bg-primary-50 text-foreground scale-105'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
              }`}
            >
              <div className="font-bold mb-1">Concentration</div>
              <div className="text-xs text-gray-600">Find [A] at time t</div>
            </button>

            <button
              onClick={() => { setMode('rate-constant'); setResult(null); setError(null); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'rate-constant'
                  ? 'border-primary-500 bg-primary-50 text-foreground scale-105'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
              }`}
            >
              <div className="font-bold mb-1">Rate Constant</div>
              <div className="text-xs text-gray-600">Calculate k</div>
            </button>

            <button
              onClick={() => { setMode('arrhenius'); setResult(null); setError(null); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'arrhenius'
                  ? 'border-primary-500 bg-primary-50 text-foreground scale-105'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
              }`}
            >
              <div className="font-bold mb-1">Arrhenius</div>
              <div className="text-xs text-gray-600">k = A×e^(-Ea/RT)</div>
            </button>

            <button
              onClick={() => { setMode('activation'); setResult(null); setError(null); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'activation'
                  ? 'border-primary-500 bg-primary-50 text-foreground scale-105'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
              }`}
            >
              <div className="font-bold mb-1">Activation Energy</div>
              <div className="text-xs text-gray-600">Find Ea from 2 temps</div>
            </button>

            <button
              onClick={() => { setMode('order'); setResult(null); setError(null); }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'order'
                  ? 'border-primary-500 bg-primary-50 text-foreground scale-105'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
              }`}
            >
              <div className="font-bold mb-1">Reaction Order</div>
              <div className="text-xs text-gray-600">Determine order</div>
            </button>
          </div>
        </div>

        {/* Example Problems */}
        {(mode === 'concentration' || mode === 'rate-constant') && (
          <div className="premium-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Example Problems</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXAMPLE_KINETICS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(index)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all text-left"
                >
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {example.name}
                  </div>
                  <div className="text-xs text-gray-600">{example.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {example.order} order • k = {example.k.toExponential(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'arrhenius' && (
          <div className="premium-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Example Arrhenius Problems</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXAMPLE_ARRHENIUS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadArrheniusExample(index)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all text-left"
                >
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {example.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    Ea = {(example.Ea / 1000).toFixed(0)} kJ/mol
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    T = {example.temperature} K ({(example.temperature - 273.15).toFixed(0)}°C)
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Input Parameters</h2>

          {/* Concentration Calculator */}
          {mode === 'concentration' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction Order
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['zero', 'first', 'second'] as RateOrder[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOrder(o)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        order === o
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {o.charAt(0).toUpperCase() + o.slice(1)} Order
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Concentration [A]₀ (M)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={initialConc}
                    onChange={(e) => setInitialConc(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Constant k ({order === 'zero' ? 'M/s' : order === 'first' ? 's⁻¹' : 'M⁻¹s⁻¹'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={k}
                    onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time (s)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={time}
                    onChange={(e) => setTime(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <button
                onClick={calculateConc}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate Concentration
              </button>
            </div>
          )}

          {/* Rate Constant Calculator */}
          {mode === 'rate-constant' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction Order
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['zero', 'first', 'second'] as RateOrder[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOrder(o)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        order === o
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {o.charAt(0).toUpperCase() + o.slice(1)} Order
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial [A]₀ (M)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={initialConc}
                    onChange={(e) => setInitialConc(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final [A] (M)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={finalConc}
                    onChange={(e) => setFinalConc(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time (s)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={time}
                    onChange={(e) => setTime(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <button
                onClick={calculateK}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate Rate Constant
              </button>
            </div>
          )}

          {/* Arrhenius Calculator */}
          {mode === 'arrhenius' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pre-exponential Factor A
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={A}
                    onChange={(e) => setA(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Scientific notation: 1e13 = 1×10¹³</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activation Energy Ea (J/mol)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={Ea}
                    onChange={(e) => setEa(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">{(Ea / 1000).toFixed(2)} kJ/mol</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (K)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">{(temperature - 273.15).toFixed(2)}°C</p>
                </div>
              </div>

              <button
                onClick={calculateArrhenius}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate Rate Constant (k)
              </button>
            </div>
          )}

          {/* Activation Energy Calculator */}
          {mode === 'activation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Condition 1</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Constant k₁
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={k1}
                      onChange={(e) => setK1(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature T₁ (K)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={T1}
                      onChange={(e) => setT1(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">{(T1 - 273.15).toFixed(2)}°C</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Condition 2</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Constant k₂
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={k2}
                      onChange={(e) => setK2(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature T₂ (K)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={T2}
                      onChange={(e) => setT2(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">{(T2 - 273.15).toFixed(2)}°C</p>
                  </div>
                </div>
              </div>

              <button
                onClick={calculateEa}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate Activation Energy
              </button>
            </div>
          )}

          {/* Reaction Order Determination */}
          {mode === 'order' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">Concentration vs Time Data</h3>
                <button
                  onClick={addDataPoint}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Add Data Point
                </button>
              </div>

              <div className="space-y-2">
                {dataPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="any"
                        value={point.time}
                        onChange={(e) => updateDataPoint(index, 'time', parseFloat(e.target.value) || 0)}
                        className="input-premium w-full"
                        placeholder="Time (s)"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        step="any"
                        value={point.concentration}
                        onChange={(e) => updateDataPoint(index, 'concentration', parseFloat(e.target.value) || 0)}
                        className="input-premium w-full"
                        placeholder="[A] (M)"
                      />
                    </div>
                    {dataPoints.length > 2 && (
                      <button
                        onClick={() => removeDataPoint(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={determineOrder}
                className="btn-premium glow-premium w-full py-3"
              >
                Determine Reaction Order
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Results Card */}
            <div className="premium-card p-6">
              <h2 className="text-2xl font-bold mb-6">Results</h2>

              {(mode === 'concentration' || mode === 'rate-constant') && 'halfLife' in result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {'concentration' in result && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                      <div className="text-sm text-blue-700 font-medium mb-1">Concentration</div>
                      <div className="text-3xl font-bold text-blue-900">
                        {result.concentration.toFixed(6)} M
                      </div>
                      <div className="text-xs text-blue-600 mt-1">at time = {result.time.toFixed(2)} s</div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200">
                    <div className="text-sm text-purple-700 font-medium mb-1">Half-Life</div>
                    <div className="text-3xl font-bold text-purple-900">
                      {result.halfLife.toFixed(2)} s
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      {result.order === 'first' ? 'Constant' : result.order === 'zero' ? 'Decreases linearly' : 'Decreases with [A]'}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'arrhenius' && 'k' in result && 'A' in result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                    <div className="text-sm text-green-700 font-medium mb-1">Rate Constant</div>
                    <div className="text-2xl font-bold text-green-900">
                      {result.k.toExponential(4)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">at {result.temperature} K</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200">
                    <div className="text-sm text-orange-700 font-medium mb-1">Activation Energy</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {(result.Ea / 1000).toFixed(2)} kJ/mol
                    </div>
                    <div className="text-xs text-orange-600 mt-1">{result.Ea.toFixed(0)} J/mol</div>
                  </div>
                </div>
              )}

              {mode === 'activation' && 'Ea' in result && 'EaKJ' in result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                    <div className="text-sm text-red-700 font-medium mb-1">Activation Energy</div>
                    <div className="text-3xl font-bold text-red-900">
                      {result.EaKJ.toFixed(2)} kJ/mol
                    </div>
                    <div className="text-xs text-red-600 mt-1">{result.Ea.toFixed(0)} J/mol</div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-200">
                    <div className="text-sm text-yellow-700 font-medium mb-1">Pre-exponential Factor</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {result.A.toExponential(4)}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'order' && 'order' in result && 'r2' in result && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border-2 border-indigo-200">
                    <div className="text-sm text-indigo-700 font-medium mb-1">Reaction Order</div>
                    <div className="text-3xl font-bold text-indigo-900 uppercase">
                      {result.order}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border-2 border-pink-200">
                    <div className="text-sm text-pink-700 font-medium mb-1">Rate Constant</div>
                    <div className="text-2xl font-bold text-pink-900">
                      {result.k.toExponential(4)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border-2 border-teal-200">
                    <div className="text-sm text-teal-700 font-medium mb-1">R² (Fit Quality)</div>
                    <div className="text-3xl font-bold text-teal-900">
                      {result.r2.toFixed(4)}
                    </div>
                    <div className="text-xs text-teal-600 mt-1">
                      {result.r2 > 0.99 ? 'Excellent!' : result.r2 > 0.95 ? 'Good' : 'Moderate'}
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Solution */}
              <h3 className="text-xl font-bold mb-3">Step-by-Step Solution</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {result.steps.map((step, index) => (
                  <div
                    key={index}
                    className={
                      step.startsWith('===')
                        ? 'font-bold text-base mt-3'
                        : step.startsWith('✓')
                        ? 'text-green-700 font-medium'
                        : step.startsWith('⚠️')
                        ? 'text-orange-700 font-medium'
                        : step.startsWith('❌')
                        ? 'text-red-700 font-medium'
                        : ''
                    }
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Theory Section */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-900">
            Chemical Kinetics Theory
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Rate Laws:</strong> Describe how concentration affects reaction rate. Zero order: rate = k. First order: rate = k[A]. Second order: rate = k[A]².
            </div>
            <div>
              <strong>Half-Life:</strong> Time for [A] to decrease to half its value. Only constant for first-order reactions (t₁/₂ = 0.693/k).
            </div>
            <div>
              <strong>Arrhenius Equation:</strong> k = A×e^(-Ea/RT). Shows that rate constant increases exponentially with temperature.
            </div>
            <div>
              <strong>Activation Energy (Ea):</strong> Minimum energy needed for reaction. Higher Ea = slower reaction, more temperature sensitive.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>© 2025 VerChem. Chemical kinetics calculator with professional-grade accuracy.</p>
          <p className="mt-2">Educational tool for students and researchers</p>
        </div>
      </footer>
    </div>
  )
}
