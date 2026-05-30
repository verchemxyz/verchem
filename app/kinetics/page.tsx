'use client'

// VerChem - Chemical Kinetics Calculator Page

import { useState } from 'react'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
  ModeButton,
  ErrorBanner,
} from '@/components/lab'
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
import dynamic from 'next/dynamic'

// Dynamic import for graph component (client-side only)
const KineticsGraph = dynamic(() => import('@/components/charts/KineticsGraph'), {
  ssr: false,
  loading: () => (
    <div className="bg-muted rounded-md h-[350px] flex items-center justify-center text-muted-foreground">
      Loading graph...
    </div>
  ),
})

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
    <CalcShell
      eyebrow="Physical chemistry · rate laws"
      title="Chemical Kinetics"
      subtitle="Rate laws, Arrhenius equation, half-life, and activation energy calculations."
      backHref="/"
      backLabel="Home"
      maxWidth="6xl"
    >
      {/* Mode Selection */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Calculator mode</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <ModeButton
            active={mode === 'concentration'}
            onClick={() => { setMode('concentration'); setResult(null); setError(null); }}
            title="Concentration"
            description="Find [A] at time t"
          />
          <ModeButton
            active={mode === 'rate-constant'}
            onClick={() => { setMode('rate-constant'); setResult(null); setError(null); }}
            title="Rate Constant"
            description="Calculate k"
          />
          <ModeButton
            active={mode === 'arrhenius'}
            onClick={() => { setMode('arrhenius'); setResult(null); setError(null); }}
            title="Arrhenius"
            description="k = A×e^(-Ea/RT)"
          />
          <ModeButton
            active={mode === 'activation'}
            onClick={() => { setMode('activation'); setResult(null); setError(null); }}
            title="Activation Energy"
            description="Find Ea from 2 temps"
          />
          <ModeButton
            active={mode === 'order'}
            onClick={() => { setMode('order'); setResult(null); setError(null); }}
            title="Reaction Order"
            description="Determine order"
          />
        </div>
      </Card>

        {/* Example Problems */}
        {(mode === 'concentration' || mode === 'rate-constant') && (
          <Card className="p-6">
            <SectionTitle className="mb-4">Example problems</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXAMPLE_KINETICS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(index)}
                  className="p-4 rounded-md border border-border bg-card hover:border-primary-500/40 hover:bg-muted transition-colors text-left"
                >
                  <div className="text-sm font-medium text-foreground mb-2">
                    {example.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{example.description}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {example.order} order • k = {example.k.toExponential(2)}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {mode === 'arrhenius' && (
          <Card className="p-6">
            <SectionTitle className="mb-4">Example Arrhenius problems</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXAMPLE_ARRHENIUS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadArrheniusExample(index)}
                  className="p-4 rounded-md border border-border bg-card hover:border-primary-500/40 hover:bg-muted transition-colors text-left"
                >
                  <div className="text-sm font-medium text-foreground mb-2">
                    {example.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ea = {(example.Ea / 1000).toFixed(0)} kJ/mol
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    T = {example.temperature} K ({(example.temperature - 273.15).toFixed(0)}°C)
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Input Section */}
        <Card className="p-6">
          <SectionTitle className="mb-4">Input parameters</SectionTitle>

          {/* Concentration Calculator */}
          {mode === 'concentration' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reaction Order
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['zero', 'first', 'second'] as RateOrder[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOrder(o)}
                      className={`p-3 rounded-md border transition-colors ${
                        order === o
                          ? 'border-primary-500 bg-muted text-primary-600 ring-1 ring-primary-500/40'
                          : 'border-border bg-card text-foreground hover:border-primary-500/40 hover:bg-muted'
                      }`}
                    >
                      {o.charAt(0).toUpperCase() + o.slice(1)} Order
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Initial Concentration [A]₀ (M)">
                  <input
                    type="number"
                    step="any"
                    value={initialConc}
                    onChange={(e) => setInitialConc(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label={`Rate Constant k (${order === 'zero' ? 'M/s' : order === 'first' ? 's⁻¹' : 'M⁻¹s⁻¹'})`}>
                  <input
                    type="number"
                    step="any"
                    value={k}
                    onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Time (s)">
                  <input
                    type="number"
                    step="any"
                    value={time}
                    onChange={(e) => setTime(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>
              </div>

              <Button onClick={calculateConc} className="w-full">
                Calculate Concentration
              </Button>
            </div>
          )}

          {/* Rate Constant Calculator */}
          {mode === 'rate-constant' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reaction Order
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['zero', 'first', 'second'] as RateOrder[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setOrder(o)}
                      className={`p-3 rounded-md border transition-colors ${
                        order === o
                          ? 'border-primary-500 bg-muted text-primary-600 ring-1 ring-primary-500/40'
                          : 'border-border bg-card text-foreground hover:border-primary-500/40 hover:bg-muted'
                      }`}
                    >
                      {o.charAt(0).toUpperCase() + o.slice(1)} Order
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Initial [A]₀ (M)">
                  <input
                    type="number"
                    step="any"
                    value={initialConc}
                    onChange={(e) => setInitialConc(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Final [A] (M)">
                  <input
                    type="number"
                    step="any"
                    value={finalConc}
                    onChange={(e) => setFinalConc(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Time (s)">
                  <input
                    type="number"
                    step="any"
                    value={time}
                    onChange={(e) => setTime(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>
              </div>

              <Button onClick={calculateK} className="w-full">
                Calculate Rate Constant
              </Button>
            </div>
          )}

          {/* Arrhenius Calculator */}
          {mode === 'arrhenius' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Pre-exponential Factor A" hint="Scientific notation: 1e13 = 1×10¹³">
                  <input
                    type="number"
                    step="any"
                    value={A}
                    onChange={(e) => setA(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Activation Energy Ea (J/mol)" hint={`${(Ea / 1000).toFixed(2)} kJ/mol`}>
                  <input
                    type="number"
                    step="any"
                    value={Ea}
                    onChange={(e) => setEa(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>

                <Field label="Temperature (K)" hint={`${(temperature - 273.15).toFixed(2)}°C`}>
                  <input
                    type="number"
                    step="any"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                    className="input-premium w-full"
                  />
                </Field>
              </div>

              <Button onClick={calculateArrhenius} className="w-full">
                Calculate Rate Constant (k)
              </Button>
            </div>
          )}

          {/* Activation Energy Calculator */}
          {mode === 'activation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Condition 1</h3>
                  <Field label="Rate Constant k₁">
                    <input
                      type="number"
                      step="any"
                      value={k1}
                      onChange={(e) => setK1(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                  </Field>
                  <Field label="Temperature T₁ (K)" hint={`${(T1 - 273.15).toFixed(2)}°C`}>
                    <input
                      type="number"
                      step="any"
                      value={T1}
                      onChange={(e) => setT1(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                  </Field>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Condition 2</h3>
                  <Field label="Rate Constant k₂">
                    <input
                      type="number"
                      step="any"
                      value={k2}
                      onChange={(e) => setK2(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                  </Field>
                  <Field label="Temperature T₂ (K)" hint={`${(T2 - 273.15).toFixed(2)}°C`}>
                    <input
                      type="number"
                      step="any"
                      value={T2}
                      onChange={(e) => setT2(parseFloat(e.target.value) || 0)}
                      className="input-premium w-full"
                    />
                  </Field>
                </div>
              </div>

              <Button onClick={calculateEa} className="w-full">
                Calculate Activation Energy
              </Button>
            </div>
          )}

          {/* Reaction Order Determination */}
          {mode === 'order' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">Concentration vs Time Data</h3>
                <button
                  onClick={addDataPoint}
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
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
                        aria-label="Remove data point"
                        className="text-destructive hover:bg-destructive/10 rounded-md p-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={determineOrder} className="w-full">
                Determine Reaction Order
              </Button>
            </div>
          )}

          {/* Error */}
          {error && <ErrorBanner className="mt-4">{error}</ErrorBanner>}
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Graph Visualization - Show for concentration and rate-constant modes */}
            {(mode === 'concentration' || mode === 'rate-constant') && (
              <Card className="p-6">
                <SectionTitle className="mb-4">Concentration vs time graph</SectionTitle>
                <KineticsGraph
                  order={order}
                  initialConc={initialConc}
                  k={k}
                  maxTime={Math.max(time * 2, 100)}
                  highlightTime={time}
                  width={600}
                  height={350}
                />
              </Card>
            )}

            {/* Results Card */}
            <Card className="p-6">
              <SectionTitle className="mb-6">Results</SectionTitle>

              {(mode === 'concentration' || mode === 'rate-constant') && 'halfLife' in result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {'concentration' in result && (
                    <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                      <div className="text-sm text-primary-600 font-medium mb-1">Concentration</div>
                      <div className="text-3xl font-bold font-mono text-foreground">
                        {result.concentration.toFixed(6)} M
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">at time = {result.time.toFixed(2)} s</div>
                    </div>
                  )}

                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Half-Life</div>
                    <div className="text-3xl font-bold font-mono text-foreground">
                      {result.halfLife.toFixed(2)} s
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.order === 'first' ? 'Constant' : result.order === 'zero' ? 'Decreases linearly' : 'Decreases with [A]'}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'arrhenius' && 'k' in result && 'A' in result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Rate Constant</div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {result.k.toExponential(4)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">at {result.temperature} K</div>
                  </div>

                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Activation Energy</div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {(result.Ea / 1000).toFixed(2)} kJ/mol
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{result.Ea.toFixed(0)} J/mol</div>
                  </div>
                </div>
              )}

              {mode === 'activation' && 'Ea' in result && 'EaKJ' in result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Activation Energy</div>
                    <div className="text-3xl font-bold font-mono text-foreground">
                      {result.EaKJ.toFixed(2)} kJ/mol
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{result.Ea.toFixed(0)} J/mol</div>
                  </div>

                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Pre-exponential Factor</div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {result.A.toExponential(4)}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'order' && 'order' in result && 'r2' in result && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Reaction Order</div>
                    <div className="text-3xl font-bold font-mono text-foreground uppercase">
                      {result.order}
                    </div>
                  </div>

                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">Rate Constant</div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {result.k.toExponential(4)}
                    </div>
                  </div>

                  <div className="bg-muted rounded-md p-4 border-l-2 border-l-primary-500">
                    <div className="text-sm text-primary-600 font-medium mb-1">R² (Fit Quality)</div>
                    <div className="text-3xl font-bold font-mono text-foreground">
                      {result.r2.toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.r2 > 0.99 ? 'Excellent!' : result.r2 > 0.95 ? 'Good' : 'Moderate'}
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Solution */}
              <h3 className="text-lg font-semibold text-foreground tracking-tight mb-3">Step-by-step solution</h3>
              <div className="bg-muted border border-border rounded-md p-4 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
                {result.steps.map((step, index) => (
                  <div
                    key={index}
                    className={
                      step.startsWith('===')
                        ? 'font-bold text-base mt-3 text-foreground'
                        : step.startsWith('✓')
                        ? 'text-success font-medium'
                        : step.startsWith('⚠️')
                        ? 'text-warning font-medium'
                        : step.startsWith('❌')
                        ? 'text-destructive font-medium'
                        : 'text-foreground'
                    }
                  >
                    {step}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Theory Section */}
        <Card className="p-6">
          <SectionTitle className="mb-3">Chemical kinetics theory</SectionTitle>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Rate Laws:</strong> Describe how concentration affects reaction rate. Zero order: rate = k. First order: rate = k[A]. Second order: rate = k[A]².
            </div>
            <div>
              <strong className="text-foreground">Half-Life:</strong> Time for [A] to decrease to half its value. Only constant for first-order reactions (t₁/₂ = 0.693/k).
            </div>
            <div>
              <strong className="text-foreground">Arrhenius Equation:</strong> k = A×e^(-Ea/RT). Shows that rate constant increases exponentially with temperature.
            </div>
            <div>
              <strong className="text-foreground">Activation Energy (Ea):</strong> Minimum energy needed for reaction. Higher Ea = slower reaction, more temperature sensitive.
            </div>
          </div>
        </Card>
    </CalcShell>
  )
}
