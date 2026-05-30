'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { CalcShell, Card } from '@/components/lab'
import {
  radioactiveDecay,
  halfLifeFromDecay,
  timeToDecay,
  balanceNuclearEquation,
  bindingEnergy,
  massEnergyEquivalence,
  generateDecayCurve,
  halfLifeToSeconds,
  COMMON_ISOTOPES,
  EXAMPLE_NUCLEI,
} from '@/lib/calculations/nuclear'
import type { DecayType, HalfLifeUnit, Isotope } from '@/lib/calculations/nuclear'

// ============================================================
// TYPES
// ============================================================

type NuclearTab = 'decay' | 'half-life' | 'equations' | 'binding' | 'mass-energy' | 'isotopes'

interface TabInfo {
  id: NuclearTab
  label: string
  description: string
}

// ============================================================
// TAB DEFINITIONS
// ============================================================

const TABS: TabInfo[] = [
  { id: 'decay', label: 'Radioactive Decay', description: 'N(t) = N\u2080 \u00D7 (1/2)^(t/t\u00BD)' },
  { id: 'half-life', label: 'Half-Life Calculator', description: 'Solve for any unknown' },
  { id: 'equations', label: 'Nuclear Equations', description: 'Balance nuclear reactions' },
  { id: 'binding', label: 'Binding Energy', description: 'Nuclear stability' },
  { id: 'mass-energy', label: 'Mass-Energy', description: 'E = mc\u00B2' },
  { id: 'isotopes', label: 'Isotope Database', description: 'Common radioisotopes' },
]

// Decay-mode is categorical data \u2014 each mode keeps a distinct token hue so the
// equation display, presets, isotope badges, and filters share one legend.
const DECAY_TYPE_LABELS: Record<DecayType, { label: string; color: string; bgColor: string }> = {
  'alpha': { label: '\u03B1 Alpha', color: 'text-destructive-strong', bgColor: 'bg-destructive/15 border-destructive/40' },
  'beta-minus': { label: '\u03B2\u207B Beta-minus', color: 'text-info-strong', bgColor: 'bg-info/15 border-info/40' },
  'beta-plus': { label: '\u03B2\u207A Beta-plus', color: 'text-secondary-strong', bgColor: 'bg-secondary-500/15 border-secondary-500/40' },
  'gamma': { label: '\u03B3 Gamma', color: 'text-success-strong', bgColor: 'bg-success/15 border-success/40' },
  'electron-capture': { label: 'EC Electron Capture', color: 'text-warning-strong', bgColor: 'bg-warning/15 border-warning/40' },
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function InputField({ label, value, onChange, placeholder, unit, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  unit?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{unit}</span>
        )}
      </div>
    </div>
  )
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mt-6 p-6 border-l-2 border-l-primary-500">
      <h3 className="text-xs uppercase tracking-wider text-primary-600 mb-4 font-medium">{title}</h3>
      {children}
    </Card>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive-strong">
      {message}
    </div>
  )
}

function formatSci(n: number, digits: number = 4): string {
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toExponential(digits)
  return n.toPrecision(digits + 1)
}

// ============================================================
// DECAY CURVE VISUALIZATION
// ============================================================

function DecayCurveChart({ initialAmount, halfLife }: { initialAmount: number; halfLife: number }) {
  const points = useMemo(
    () => generateDecayCurve(initialAmount, halfLife, 60, 5),
    [initialAmount, halfLife]
  )

  const maxTime = points[points.length - 1]?.time || 1
  const maxAmount = initialAmount

  // Generate SVG path
  const pathData = points.map((p, i) => {
    const x = (p.time / maxTime) * 100
    const y = 100 - (p.amount / maxAmount) * 100
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Half-life markers
  const markers = [1, 2, 3, 4, 5].map((n) => ({
    time: halfLife * n,
    amount: initialAmount * Math.pow(0.5, n),
    label: `${n}t\u00BD`,
  }))

  return (
    <Card className="mt-6 p-4">
      <h4 className="text-sm font-medium text-foreground mb-3">Decay Curve</h4>
      <div className="relative w-full" style={{ paddingBottom: '50%' }}>
        <svg
          viewBox="-8 -5 118 115"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="var(--border)" strokeWidth="0.3" />
          ))}
          {[0, 20, 40, 60, 80, 100].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="var(--border)" strokeWidth="0.3" />
          ))}

          {/* Axes */}
          <line x1="0" y1="100" x2="100" y2="100" stroke="var(--muted-foreground)" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="var(--muted-foreground)" strokeWidth="0.5" />

          {/* Decay curve */}
          <path d={pathData} fill="none" stroke="var(--primary-500)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Area under curve */}
          <path d={`${pathData} L 100 100 L 0 100 Z`} fill="url(#decay-gradient)" opacity="0.25" />

          <defs>
            <linearGradient id="decay-gradient" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="var(--primary-500)" />
              <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Half-life markers */}
          {markers.map((m, i) => {
            const x = (m.time / maxTime) * 100
            const y = 100 - (m.amount / maxAmount) * 100
            if (x > 100) return null
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2="100" stroke="var(--primary-500)" strokeWidth="0.3" strokeDasharray="2 1" />
                <circle cx={x} cy={y} r="1.5" fill="var(--primary-500)" />
                <text x={x} y="108" textAnchor="middle" fill="var(--muted-foreground)" fontSize="3.5">{m.label}</text>
              </g>
            )
          })}

          {/* Y-axis labels */}
          <text x="-3" y="3" textAnchor="end" fill="var(--muted-foreground)" fontSize="3.5">100%</text>
          <text x="-3" y="53" textAnchor="end" fill="var(--muted-foreground)" fontSize="3.5">50%</text>
          <text x="-3" y="103" textAnchor="end" fill="var(--muted-foreground)" fontSize="3.5">0%</text>

          {/* Axis labels */}
          <text x="50" y="113" textAnchor="middle" fill="var(--muted-foreground)" fontSize="3.5">Time (half-lives)</text>
        </svg>
      </div>
    </Card>
  )
}

// ============================================================
// NUCLEAR EQUATION DISPLAY
// ============================================================

function NuclearNotation({ A, Z, symbol, className }: { A: number; Z: number; symbol: string; className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-mono ${className || ''}`}>
      <span className="flex flex-col items-end text-xs leading-tight mr-0.5">
        <span>{A}</span>
        <span>{Z}</span>
      </span>
      <span className="text-lg font-bold">{symbol}</span>
    </span>
  )
}

// ============================================================
// TAB: RADIOACTIVE DECAY
// ============================================================

function DecayTab() {
  const [initialAmount, setInitialAmount] = useState('1000')
  const [halfLife, setHalfLife] = useState('5730')
  const [halfLifeUnit, setHalfLifeUnit] = useState<HalfLifeUnit>('years')
  const [elapsedTime, setElapsedTime] = useState('11460')
  const [timeUnit, setTimeUnit] = useState<HalfLifeUnit>('years')
  const [result, setResult] = useState<ReturnType<typeof radioactiveDecay> | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const n0 = parseFloat(initialAmount)
      const hl = parseFloat(halfLife)
      const t = parseFloat(elapsedTime)
      if (isNaN(n0) || isNaN(hl) || isNaN(t)) throw new Error('All values must be valid numbers')

      const hlSec = halfLifeToSeconds(hl, halfLifeUnit)
      const tSec = halfLifeToSeconds(t, timeUnit)
      const r = radioactiveDecay(n0, hlSec, tSec)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [initialAmount, halfLife, halfLifeUnit, elapsedTime, timeUnit])

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Radioactive Decay Calculator</h2>
      <p className="text-muted-foreground mb-6">
        Calculate the remaining amount of a radioactive substance after a given time using
        N(t) = N{'\u2080'} {'\u00D7'} (1/2)<sup>t/t{'\u00BD'}</sup>
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Initial Amount (N\u2080)" value={initialAmount} onChange={setInitialAmount} placeholder="e.g., 1000" unit="atoms/g/mol" />
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <InputField label="Half-life (t\u00BD)" value={halfLife} onChange={setHalfLife} placeholder="e.g., 5730" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Unit</label>
            <select
              value={halfLifeUnit}
              onChange={(e) => setHalfLifeUnit(e.target.value as HalfLifeUnit)}
              className="w-full rounded-md border border-border bg-background px-3 py-3 text-foreground focus:border-primary-500 focus:outline-none"
            >
              <option value="seconds">sec</option>
              <option value="minutes">min</option>
              <option value="hours">hr</option>
              <option value="days">days</option>
              <option value="years">years</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <InputField label="Elapsed Time (t)" value={elapsedTime} onChange={setElapsedTime} placeholder="e.g., 11460" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Unit</label>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as HalfLifeUnit)}
              className="w-full rounded-md border border-border bg-background px-3 py-3 text-foreground focus:border-primary-500 focus:outline-none"
            >
              <option value="seconds">sec</option>
              <option value="minutes">min</option>
              <option value="hours">hr</option>
              <option value="days">days</option>
              <option value="years">years</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Calculate Decay
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Decay Results">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-muted border border-border p-4">
              <p className="text-sm text-muted-foreground">Remaining Amount</p>
              <p className="text-2xl font-bold font-mono text-primary-600">{formatSci(result.remainingAmount)}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4">
              <p className="text-sm text-muted-foreground">Decayed Amount</p>
              <p className="text-2xl font-bold font-mono text-foreground">{formatSci(result.decayedAmount)}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4">
              <p className="text-sm text-muted-foreground">Number of Half-lives</p>
              <p className="text-2xl font-bold font-mono text-foreground">{result.numHalfLives.toFixed(2)}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4">
              <p className="text-sm text-muted-foreground">Remaining %</p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {((result.remainingAmount / parseFloat(initialAmount)) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4">
              <p className="text-sm text-muted-foreground">Decay Constant ({'\u03BB'})</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatSci(result.decayConstant)} s{'\u207B\u00B9'}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4">
              <p className="text-sm text-muted-foreground">Current Activity</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatSci(result.activity)} Bq</p>
            </div>
          </div>

          <DecayCurveChart
            initialAmount={parseFloat(initialAmount)}
            halfLife={halfLifeToSeconds(parseFloat(halfLife), halfLifeUnit)}
          />
        </ResultCard>
      )}

      {/* Quick examples */}
      <Card className="mt-6 p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Quick Examples</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'C-14 Dating (2 half-lives)', n0: '1000', hl: '5730', hlu: 'years' as HalfLifeUnit, t: '11460', tu: 'years' as HalfLifeUnit },
            { label: 'I-131 Therapy (30 days)', n0: '100', hl: '8.02', hlu: 'days' as HalfLifeUnit, t: '30', tu: 'days' as HalfLifeUnit },
            { label: 'Tc-99m Imaging (24h)', n0: '500', hl: '6.01', hlu: 'hours' as HalfLifeUnit, t: '24', tu: 'hours' as HalfLifeUnit },
          ].map((ex) => (
            <button
              key={ex.label}
              onClick={() => {
                setInitialAmount(ex.n0)
                setHalfLife(ex.hl)
                setHalfLifeUnit(ex.hlu)
                setElapsedTime(ex.t)
                setTimeUnit(ex.tu)
              }}
              className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// TAB: HALF-LIFE CALCULATOR
// ============================================================

function HalfLifeTab() {
  type SolveTarget = 'halfLife' | 'time' | 'initial' | 'remaining'
  const [solveFor, setSolveFor] = useState<SolveTarget>('halfLife')
  const [n0, setN0] = useState('1000')
  const [nRemaining, setNRemaining] = useState('250')
  const [halfLife, setHalfLife] = useState('')
  const [time, setTime] = useState('11460')
  const [result, setResult] = useState<{ value: number; label: string } | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const n0Val = parseFloat(n0)
      const nrVal = parseFloat(nRemaining)
      const hlVal = parseFloat(halfLife)
      const tVal = parseFloat(time)

      switch (solveFor) {
        case 'halfLife': {
          if (isNaN(n0Val) || isNaN(nrVal) || isNaN(tVal)) throw new Error('Need N\u2080, N, and time')
          const hl = halfLifeFromDecay(n0Val, nrVal, tVal)
          setResult({ value: hl, label: 'Half-life (t\u00BD)' })
          break
        }
        case 'time': {
          if (isNaN(n0Val) || isNaN(nrVal) || isNaN(hlVal)) throw new Error('Need N\u2080, N, and half-life')
          const t = timeToDecay(n0Val, nrVal, hlVal)
          setResult({ value: t, label: 'Time elapsed' })
          break
        }
        case 'initial': {
          if (isNaN(nrVal) || isNaN(hlVal) || isNaN(tVal)) throw new Error('Need N, half-life, and time')
          const numHL = tVal / hlVal
          const initial = nrVal / Math.pow(0.5, numHL)
          setResult({ value: initial, label: 'Initial amount (N\u2080)' })
          break
        }
        case 'remaining': {
          if (isNaN(n0Val) || isNaN(hlVal) || isNaN(tVal)) throw new Error('Need N\u2080, half-life, and time')
          const r = radioactiveDecay(n0Val, hlVal, tVal)
          setResult({ value: r.remainingAmount, label: 'Remaining amount (N)' })
          break
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [solveFor, n0, nRemaining, halfLife, time])

  const targets: Array<{ id: SolveTarget; label: string }> = [
    { id: 'halfLife', label: 'Half-life' },
    { id: 'time', label: 'Time' },
    { id: 'initial', label: 'Initial Amount' },
    { id: 'remaining', label: 'Remaining Amount' },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Half-Life Calculator</h2>
      <p className="text-muted-foreground mb-6">Solve for any unknown in the radioactive decay equation.</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">Solve For</label>
        <div className="flex flex-wrap gap-2">
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSolveFor(t.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
                solveFor === t.id
                  ? 'border-primary-500 bg-muted text-primary-600'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Initial Amount (N\u2080)" value={n0} onChange={setN0} placeholder="e.g., 1000" disabled={solveFor === 'initial'} />
        <InputField label="Remaining Amount (N)" value={nRemaining} onChange={setNRemaining} placeholder="e.g., 250" disabled={solveFor === 'remaining'} />
        <InputField label="Half-life (t\u00BD)" value={halfLife} onChange={setHalfLife} placeholder="e.g., 5730" disabled={solveFor === 'halfLife'} />
        <InputField label="Time (t)" value={time} onChange={setTime} placeholder="e.g., 11460" disabled={solveFor === 'time'} />
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Calculate
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Result">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">{result.label}</p>
            <p className="text-4xl font-bold text-foreground font-mono">{formatSci(result.value)}</p>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================================
// TAB: NUCLEAR EQUATIONS
// ============================================================

function EquationsTab() {
  const [massNumber, setMassNumber] = useState('238')
  const [atomicNumber, setAtomicNumber] = useState('92')
  const [decayType, setDecayType] = useState<DecayType>('alpha')
  const [result, setResult] = useState<ReturnType<typeof balanceNuclearEquation> | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const A = parseInt(massNumber)
      const Z = parseInt(atomicNumber)
      if (isNaN(A) || isNaN(Z)) throw new Error('Mass number and atomic number must be integers')
      const r = balanceNuclearEquation({ A, Z }, decayType)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [massNumber, atomicNumber, decayType])

  // Presets for common decays
  const presets = [
    { label: 'U-238 \u03B1', A: '238', Z: '92', type: 'alpha' as DecayType },
    { label: 'C-14 \u03B2\u207B', A: '14', Z: '6', type: 'beta-minus' as DecayType },
    { label: 'Na-22 \u03B2\u207A', A: '22', Z: '11', type: 'beta-plus' as DecayType },
    { label: 'Tc-99m \u03B3', A: '99', Z: '43', type: 'gamma' as DecayType },
    { label: 'Be-7 EC', A: '7', Z: '4', type: 'electron-capture' as DecayType },
    { label: 'Ra-226 \u03B1', A: '226', Z: '88', type: 'alpha' as DecayType },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Nuclear Equation Balancer</h2>
      <p className="text-muted-foreground mb-6">Balance nuclear decay equations and identify daughter nuclei.</p>

      {/* Quick presets */}
      <div className="mb-6 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => { setMassNumber(p.A); setAtomicNumber(p.Z); setDecayType(p.type) }}
            className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Mass Number (A)" value={massNumber} onChange={setMassNumber} placeholder="e.g., 238" />
        <InputField label="Atomic Number (Z)" value={atomicNumber} onChange={setAtomicNumber} placeholder="e.g., 92" />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground mb-3">Decay Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.entries(DECAY_TYPE_LABELS) as [DecayType, typeof DECAY_TYPE_LABELS[DecayType]][]).map(([type, info]) => (
            <button
              key={type}
              onClick={() => setDecayType(type)}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                decayType === type
                  ? `${info.bgColor} ${info.color} border-current`
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border-border'
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Balance Equation
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Balanced Nuclear Equation">
          {/* Visual equation */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-foreground text-xl mb-6 py-4 px-2 rounded-md bg-muted border border-border">
            <NuclearNotation A={result.parent.A} Z={result.parent.Z} symbol={result.parent.symbol} className="text-primary-600" />
            <span className="text-2xl text-muted-foreground">{'\u2192'}</span>
            <NuclearNotation A={result.daughter.A} Z={result.daughter.Z} symbol={result.daughter.symbol} className="text-foreground" />
            <span className="text-muted-foreground">+</span>
            <span className={DECAY_TYPE_LABELS[result.decayType].color}>
              {result.emittedParticles.join(' + ')}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md bg-muted border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Parent</p>
              <p className="text-lg font-bold text-primary-600">{result.parent.symbol}-{result.parent.A}</p>
              <p className="text-xs text-muted-foreground">Z={result.parent.Z}, A={result.parent.A}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Decay Type</p>
              <p className={`text-lg font-bold ${DECAY_TYPE_LABELS[result.decayType].color}`}>
                {DECAY_TYPE_LABELS[result.decayType].label}
              </p>
            </div>
            <div className="rounded-md bg-muted border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Daughter</p>
              <p className="text-lg font-bold text-foreground">{result.daughter.symbol}-{result.daughter.A}</p>
              <p className="text-xs text-muted-foreground">Z={result.daughter.Z}, A={result.daughter.A}</p>
            </div>
          </div>

          {/* Conservation check */}
          <div className="mt-4 rounded-md bg-success/10 border border-success/40 p-3">
            <p className="text-sm text-success-strong font-medium">Conservation Check</p>
            <p className="text-xs text-success-strong mt-1">
              Mass number: {result.parent.A} = {result.daughter.A} + {result.parent.A - result.daughter.A} {'\u2713'} |
              Atomic number: {result.parent.Z} = {result.daughter.Z} + {result.parent.Z - result.daughter.Z} {'\u2713'}
            </p>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================================
// TAB: BINDING ENERGY
// ============================================================

function BindingEnergyTab() {
  const [Z, setZ] = useState('26')
  const [N, setN] = useState('30')
  const [atomicMass, setAtomicMass] = useState('55.934937')
  const [result, setResult] = useState<ReturnType<typeof bindingEnergy> | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const zVal = parseInt(Z)
      const nVal = parseInt(N)
      const mVal = parseFloat(atomicMass)
      if (isNaN(zVal) || isNaN(nVal) || isNaN(mVal)) throw new Error('All values must be valid numbers')
      const r = bindingEnergy(zVal, nVal, mVal)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [Z, N, atomicMass])

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Binding Energy Calculator</h2>
      <p className="text-muted-foreground mb-6">
        Calculate nuclear binding energy and binding energy per nucleon. Higher BE/nucleon = more stable nucleus.
      </p>

      {/* Preset nuclei */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">Quick Select:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_NUCLEI.map((nuc) => (
            <button
              key={nuc.symbol}
              onClick={() => { setZ(String(nuc.Z)); setN(String(nuc.N)); setAtomicMass(String(nuc.atomicMass)) }}
              className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
            >
              {nuc.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InputField label="Protons (Z)" value={Z} onChange={setZ} placeholder="e.g., 26" />
        <InputField label="Neutrons (N)" value={N} onChange={setN} placeholder="e.g., 30" />
        <InputField label="Atomic Mass" value={atomicMass} onChange={setAtomicMass} placeholder="e.g., 55.934937" unit="amu" />
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Calculate Binding Energy
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Binding Energy Results">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Binding Energy</p>
              <p className="text-2xl font-bold font-mono text-primary-600">{result.totalBE.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">MeV</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">BE per Nucleon</p>
              <p className="text-2xl font-bold font-mono text-foreground">{result.perNucleon.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">MeV/nucleon</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Mass Defect</p>
              <p className="text-2xl font-bold font-mono text-foreground">{result.massDefect.toFixed(6)}</p>
              <p className="text-xs text-muted-foreground">amu</p>
            </div>
          </div>

          {/* Stability indicator */}
          <div className="mt-4 rounded-md bg-muted border border-border p-4">
            <p className="text-sm text-foreground mb-2">Stability Assessment</p>
            <div className="w-full bg-card border border-border rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  result.perNucleon > 8.5 ? 'bg-success' :
                  result.perNucleon > 7 ? 'bg-warning' : 'bg-destructive'
                }`}
                style={{ width: `${Math.min((result.perNucleon / 8.8) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Less stable</span>
              <span>Fe-56 peak ({'\u2248'}8.79 MeV/nucleon)</span>
              <span>Most stable</span>
            </div>
          </div>

          {/* Calculation steps */}
          <div className="mt-4 rounded-md bg-muted border border-border p-4">
            <p className="text-sm text-foreground mb-2">Calculation Steps</p>
            <div className="space-y-1">
              {result.steps.map((step, i) => (
                <p key={i} className="text-xs font-mono text-muted-foreground">{step}</p>
              ))}
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================================
// TAB: MASS-ENERGY
// ============================================================

function MassEnergyTab() {
  const [mode, setMode] = useState<'mass-to-energy' | 'energy-to-mass'>('mass-to-energy')
  const [value, setValue] = useState('1')
  const [result, setResult] = useState<{ energy?: number; mass?: number } | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const v = parseFloat(value)
      if (isNaN(v)) throw new Error('Value must be a valid number')
      if (mode === 'mass-to-energy') {
        setResult({ energy: massEnergyEquivalence(v) })
      } else {
        setResult({ mass: v / 931.494 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [mode, value])

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Mass-Energy Equivalence</h2>
      <p className="text-muted-foreground mb-6">
        Convert between mass (amu) and energy (MeV) using Einstein&apos;s E = mc{'\u00B2'}.
        1 amu = 931.494 MeV/c{'\u00B2'}.
      </p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode('mass-to-energy')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
            mode === 'mass-to-energy' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Mass {'\u2192'} Energy
        </button>
        <button
          onClick={() => setMode('energy-to-mass')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
            mode === 'energy-to-mass' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Energy {'\u2192'} Mass
        </button>
      </div>

      <InputField
        label={mode === 'mass-to-energy' ? 'Mass (\u0394m)' : 'Energy'}
        value={value}
        onChange={setValue}
        placeholder="e.g., 1"
        unit={mode === 'mass-to-energy' ? 'amu' : 'MeV'}
      />

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Convert
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Result">
          <div className="text-center">
            {result.energy !== undefined && (
              <>
                <p className="text-sm text-muted-foreground mb-2">Energy equivalent</p>
                <p className="text-4xl font-bold text-foreground font-mono">{formatSci(result.energy)} <span className="text-2xl text-muted-foreground">MeV</span></p>
                <p className="text-sm text-muted-foreground mt-2">= {formatSci(result.energy * 1.602176634e-13)} J</p>
              </>
            )}
            {result.mass !== undefined && (
              <>
                <p className="text-sm text-muted-foreground mb-2">Mass equivalent</p>
                <p className="text-4xl font-bold text-foreground font-mono">{formatSci(result.mass)} <span className="text-2xl text-muted-foreground">amu</span></p>
                <p className="text-sm text-muted-foreground mt-2">= {formatSci(result.mass * 1.66053906660e-27)} kg</p>
              </>
            )}
          </div>
        </ResultCard>
      )}

      {/* Reference table */}
      <Card className="mt-6 p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Notable Mass-Energy Equivalences</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 px-2">Process</th>
                <th className="text-right py-2 px-2">{'\u0394'}m (amu)</th>
                <th className="text-right py-2 px-2">Energy (MeV)</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border">
                <td className="py-2 px-2">Electron mass</td>
                <td className="text-right px-2 font-mono">0.000549</td>
                <td className="text-right px-2 font-mono">0.511</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-2">Proton mass</td>
                <td className="text-right px-2 font-mono">1.007276</td>
                <td className="text-right px-2 font-mono">938.272</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-2">Neutron mass</td>
                <td className="text-right px-2 font-mono">1.008665</td>
                <td className="text-right px-2 font-mono">939.565</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 px-2">D-T fusion</td>
                <td className="text-right px-2 font-mono">0.01888</td>
                <td className="text-right px-2 font-mono">17.59</td>
              </tr>
              <tr>
                <td className="py-2 px-2">U-235 fission</td>
                <td className="text-right px-2 font-mono">0.215</td>
                <td className="text-right px-2 font-mono">200</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// TAB: ISOTOPE DATABASE
// ============================================================

function IsotopeCard({ isotope }: { isotope: Isotope }) {
  return (
    <Card className="p-4 hover:border-primary-500/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">{isotope.symbol}</h3>
          <p className="text-sm text-muted-foreground">{isotope.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Z={isotope.atomicNumber}</p>
          <p className="text-xs text-muted-foreground">A={isotope.massNumber}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">Half-life</p>
        <p className="text-sm font-mono text-foreground">
          {isotope.halfLife >= 1e6
            ? `${isotope.halfLife.toExponential(3)} ${isotope.halfLifeUnit}`
            : `${isotope.halfLife} ${isotope.halfLifeUnit}`
          }
        </p>
      </div>

      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1">Decay Mode</p>
        <div className="flex flex-wrap gap-1">
          {isotope.decayMode.map((dm) => (
            <span key={dm} className={`rounded-full border px-2 py-0.5 text-xs ${DECAY_TYPE_LABELS[dm].bgColor} ${DECAY_TYPE_LABELS[dm].color}`}>
              {DECAY_TYPE_LABELS[dm].label.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {isotope.daughter && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Daughter</p>
          <p className="text-sm text-foreground">{isotope.daughter}</p>
        </div>
      )}

      {isotope.applications && isotope.applications.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Applications</p>
          <div className="flex flex-wrap gap-1">
            {isotope.applications.map((app) => (
              <span key={app} className="rounded-full bg-muted border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {app}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function IsotopesTab() {
  const [filter, setFilter] = useState('')
  const [decayFilter, setDecayFilter] = useState<DecayType | 'all'>('all')

  const filtered = useMemo(() => {
    return COMMON_ISOTOPES.filter((iso) => {
      const matchText = !filter ||
        iso.name.toLowerCase().includes(filter.toLowerCase()) ||
        iso.symbol.toLowerCase().includes(filter.toLowerCase()) ||
        (iso.applications || []).some((a) => a.toLowerCase().includes(filter.toLowerCase()))
      const matchDecay = decayFilter === 'all' || iso.decayMode.includes(decayFilter)
      return matchText && matchDecay
    })
  }, [filter, decayFilter])

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Isotope Database</h2>
      <p className="text-muted-foreground mb-6">Browse {COMMON_ISOTOPES.length} important radioisotopes with properties, decay modes, and applications.</p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Search</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name, symbol, or application..."
            className="w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Decay Type</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDecayFilter('all')}
              className={`rounded-md px-3 py-2 text-xs font-medium transition-colors border ${
                decayFilter === 'all' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All
            </button>
            {(Object.entries(DECAY_TYPE_LABELS) as [DecayType, typeof DECAY_TYPE_LABELS[DecayType]][]).map(([type, info]) => (
              <button
                key={type}
                onClick={() => setDecayFilter(type)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition-colors border ${
                  decayFilter === type ? `${info.bgColor} ${info.color} border-current` : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {info.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">Showing {filtered.length} of {COMMON_ISOTOPES.length} isotopes</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((iso) => (
          <IsotopeCard key={iso.symbol} isotope={iso} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No isotopes match your search criteria.
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function NuclearChemistryPage() {
  const [activeTab, setActiveTab] = useState<NuclearTab>('decay')

  const renderTab = () => {
    switch (activeTab) {
      case 'decay': return <DecayTab />
      case 'half-life': return <HalfLifeTab />
      case 'equations': return <EquationsTab />
      case 'binding': return <BindingEnergyTab />
      case 'mass-energy': return <MassEnergyTab />
      case 'isotopes': return <IsotopesTab />
    }
  }

  return (
    <CalcShell
      eyebrow="Advanced chemistry \u00B7 Nuclear & radiochemistry"
      title="Nuclear Chemistry Calculator"
      subtitle="Radioactive decay, nuclear equations, binding energy, mass-energy equivalence, and a comprehensive isotope database."
      backHref="/tools"
      backLabel="All tools"
      maxWidth="6xl"
    >
      {/* Tab Selector */}
      <Card className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`rounded-md p-3 text-left border transition-colors min-h-[44px] ${
                activeTab === tab.id
                  ? 'border-primary-500 bg-muted ring-1 ring-primary-500/40'
                  : 'border-border bg-card hover:bg-muted hover:border-primary-500/40'
              }`}
            >
              <p className={`font-semibold text-xs ${activeTab === tab.id ? 'text-primary-600' : 'text-foreground'}`}>{tab.label}</p>
              <p className="text-[10px] mt-0.5 text-muted-foreground">{tab.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Main Calculator Section */}
      <Card className="p-6 md:p-8">
        {renderTab()}
      </Card>

      {/* Educational Info */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Understanding Nuclear Chemistry</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Key concepts in nuclear chemistry and radioactivity.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Radioactive Decay',
              description: 'Unstable nuclei emit radiation to reach a more stable state. The rate follows first-order kinetics: N(t) = N\u2080e^(-\u03BBt).'
            },
            {
              title: 'Alpha Decay',
              description: 'Emission of a helium-4 nucleus (\u2074\u2082He). Reduces mass number by 4 and atomic number by 2. Common in heavy nuclei (Z > 82).'
            },
            {
              title: 'Beta Decay',
              description: '\u03B2\u207B: neutron converts to proton + electron + antineutrino. \u03B2\u207A: proton converts to neutron + positron + neutrino.'
            },
            {
              title: 'Binding Energy',
              description: 'Energy required to disassemble a nucleus. Fe-56 has the highest BE per nucleon (\u22488.79 MeV), making it the most stable nucleus.'
            },
            {
              title: 'Half-Life',
              description: 'Time for half the radioactive atoms to decay. Ranges from nanoseconds (Po-214) to billions of years (U-238).'
            },
            {
              title: 'E = mc\u00B2',
              description: 'Mass and energy are equivalent. The mass defect in nuclear reactions converts to enormous energy: 1 amu = 931.494 MeV.'
            },
          ].map((item) => (
            <Card key={item.title} className="p-6 hover:border-primary-500/40 transition-colors">
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Explore more chemistry tools</h2>
        <p className="text-muted-foreground mb-6">VerChem offers a complete suite of chemistry calculators and tools.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/tools/quantum" className="inline-flex items-center gap-2 rounded-md bg-primary-500 text-primary-foreground px-5 py-2.5 font-medium hover:bg-primary-600 transition-colors min-h-[44px]">
            Quantum Chemistry {'\u2192'}
          </Link>
          <Link href="/tools/equation-balancer" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]">
            Equation Balancer {'\u2192'}
          </Link>
          <Link href="/tools/gas-laws" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]">
            Gas Laws {'\u2192'}
          </Link>
          <Link href="/tools/periodic-table" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]">
            Periodic Table {'\u2192'}
          </Link>
        </div>
      </Card>
    </CalcShell>
  )
}
