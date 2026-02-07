'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  icon: string
  description: string
}

// ============================================================
// TAB DEFINITIONS
// ============================================================

const TABS: TabInfo[] = [
  { id: 'decay', label: 'Radioactive Decay', icon: '\u2622', description: 'N(t) = N\u2080 \u00D7 (1/2)^(t/t\u00BD)' },
  { id: 'half-life', label: 'Half-Life Calculator', icon: '\u231B', description: 'Solve for any unknown' },
  { id: 'equations', label: 'Nuclear Equations', icon: '\u269B', description: 'Balance nuclear reactions' },
  { id: 'binding', label: 'Binding Energy', icon: '\u26A1', description: 'Nuclear stability' },
  { id: 'mass-energy', label: 'Mass-Energy', icon: '\uD83D\uDCA5', description: 'E = mc\u00B2' },
  { id: 'isotopes', label: 'Isotope Database', icon: '\uD83D\uDCCA', description: 'Common radioisotopes' },
]

const DECAY_TYPE_LABELS: Record<DecayType, { label: string; color: string; bgColor: string }> = {
  'alpha': { label: '\u03B1 Alpha', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
  'beta-minus': { label: '\u03B2\u207B Beta-minus', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  'beta-plus': { label: '\u03B2\u207A Beta-plus', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/30' },
  'gamma': { label: '\u03B3 Gamma', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
  'electron-capture': { label: 'EC Electron Capture', color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
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
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{unit}</span>
        )}
      </div>
    </div>
  )
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
      <h3 className="text-lg font-semibold text-amber-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
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
    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
      <h4 className="text-sm font-medium text-slate-300 mb-3">Decay Curve</h4>
      <div className="relative w-full" style={{ paddingBottom: '50%' }}>
        <svg
          viewBox="-8 -5 118 115"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
          ))}
          {[0, 20, 40, 60, 80, 100].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
          ))}

          {/* Axes */}
          <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

          {/* Decay curve */}
          <path d={pathData} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

          {/* Area under curve */}
          <path d={`${pathData} L 100 100 L 0 100 Z`} fill="url(#decay-gradient)" opacity="0.3" />

          <defs>
            <linearGradient id="decay-gradient" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Half-life markers */}
          {markers.map((m, i) => {
            const x = (m.time / maxTime) * 100
            const y = 100 - (m.amount / maxAmount) * 100
            if (x > 100) return null
            return (
              <g key={i}>
                <line x1={x} y1={y} x2={x} y2="100" stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="2 1" />
                <circle cx={x} cy={y} r="1.5" fill="#f59e0b" />
                <text x={x} y="108" textAnchor="middle" fill="#94a3b8" fontSize="3.5">{m.label}</text>
              </g>
            )
          })}

          {/* Y-axis labels */}
          <text x="-3" y="3" textAnchor="end" fill="#94a3b8" fontSize="3.5">100%</text>
          <text x="-3" y="53" textAnchor="end" fill="#94a3b8" fontSize="3.5">50%</text>
          <text x="-3" y="103" textAnchor="end" fill="#94a3b8" fontSize="3.5">0%</text>

          {/* Axis labels */}
          <text x="50" y="113" textAnchor="middle" fill="#94a3b8" fontSize="3.5">Time (half-lives)</text>
        </svg>
      </div>
    </div>
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
      <h2 className="text-2xl font-bold text-white mb-2">Radioactive Decay Calculator</h2>
      <p className="text-slate-400 mb-6">
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
            <select
              value={halfLifeUnit}
              onChange={(e) => setHalfLifeUnit(e.target.value as HalfLifeUnit)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white focus:border-amber-500 focus:outline-none"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as HalfLifeUnit)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white focus:border-amber-500 focus:outline-none"
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
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-4 font-semibold text-white transition-all hover:from-amber-500 hover:to-yellow-500 hover:shadow-lg hover:shadow-amber-500/25"
      >
        Calculate Decay
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Decay Results">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Remaining Amount</p>
              <p className="text-2xl font-bold font-mono text-amber-300">{formatSci(result.remainingAmount)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Decayed Amount</p>
              <p className="text-2xl font-bold font-mono text-red-300">{formatSci(result.decayedAmount)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Number of Half-lives</p>
              <p className="text-2xl font-bold font-mono text-white">{result.numHalfLives.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Remaining %</p>
              <p className="text-2xl font-bold font-mono text-green-300">
                {((result.remainingAmount / parseFloat(initialAmount)) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Decay Constant ({'\u03BB'})</p>
              <p className="text-xl font-bold font-mono text-white">{formatSci(result.decayConstant)} s{'\u207B\u00B9'}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm text-slate-400">Current Activity</p>
              <p className="text-xl font-bold font-mono text-white">{formatSci(result.activity)} Bq</p>
            </div>
          </div>

          <DecayCurveChart
            initialAmount={parseFloat(initialAmount)}
            halfLife={halfLifeToSeconds(parseFloat(halfLife), halfLifeUnit)}
          />
        </ResultCard>
      )}

      {/* Quick examples */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Quick Examples</h4>
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
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
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
      <h2 className="text-2xl font-bold text-white mb-2">Half-Life Calculator</h2>
      <p className="text-slate-400 mb-6">Solve for any unknown in the radioactive decay equation.</p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">Solve For</label>
        <div className="flex flex-wrap gap-2">
          {targets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSolveFor(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                solveFor === t.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
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
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-4 font-semibold text-white transition-all hover:from-amber-500 hover:to-yellow-500 hover:shadow-lg hover:shadow-amber-500/25"
      >
        Calculate
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Result">
          <div className="text-center">
            <p className="text-sm text-amber-300 mb-2">{result.label}</p>
            <p className="text-4xl font-bold text-white font-mono">{formatSci(result.value)}</p>
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
      <h2 className="text-2xl font-bold text-white mb-2">Nuclear Equation Balancer</h2>
      <p className="text-slate-400 mb-6">Balance nuclear decay equations and identify daughter nuclei.</p>

      {/* Quick presets */}
      <div className="mb-6 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => { setMassNumber(p.A); setAtomicNumber(p.Z); setDecayType(p.type) }}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
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
        <label className="block text-sm font-medium text-slate-300 mb-3">Decay Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.entries(DECAY_TYPE_LABELS) as [DecayType, typeof DECAY_TYPE_LABELS[DecayType]][]).map(([type, info]) => (
            <button
              key={type}
              onClick={() => setDecayType(type)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                decayType === type
                  ? `${info.bgColor} ${info.color} border-current`
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border-white/10'
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-4 font-semibold text-white transition-all hover:from-amber-500 hover:to-yellow-500 hover:shadow-lg hover:shadow-amber-500/25"
      >
        Balance Equation
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Balanced Nuclear Equation">
          {/* Visual equation */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-white text-xl mb-6 py-4 px-2 rounded-xl bg-white/5">
            <NuclearNotation A={result.parent.A} Z={result.parent.Z} symbol={result.parent.symbol} className="text-amber-300" />
            <span className="text-2xl text-slate-400">{'\u2192'}</span>
            <NuclearNotation A={result.daughter.A} Z={result.daughter.Z} symbol={result.daughter.symbol} className="text-green-300" />
            <span className="text-slate-400">+</span>
            <span className={DECAY_TYPE_LABELS[result.decayType].color}>
              {result.emittedParticles.join(' + ')}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Parent</p>
              <p className="text-lg font-bold text-amber-300">{result.parent.symbol}-{result.parent.A}</p>
              <p className="text-xs text-slate-500">Z={result.parent.Z}, A={result.parent.A}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Decay Type</p>
              <p className={`text-lg font-bold ${DECAY_TYPE_LABELS[result.decayType].color}`}>
                {DECAY_TYPE_LABELS[result.decayType].label}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Daughter</p>
              <p className="text-lg font-bold text-green-300">{result.daughter.symbol}-{result.daughter.A}</p>
              <p className="text-xs text-slate-500">Z={result.daughter.Z}, A={result.daughter.A}</p>
            </div>
          </div>

          {/* Conservation check */}
          <div className="mt-4 rounded-xl bg-green-500/10 border border-green-500/30 p-3">
            <p className="text-sm text-green-300 font-medium">Conservation Check</p>
            <p className="text-xs text-green-200 mt-1">
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
      <h2 className="text-2xl font-bold text-white mb-2">Binding Energy Calculator</h2>
      <p className="text-slate-400 mb-6">
        Calculate nuclear binding energy and binding energy per nucleon. Higher BE/nucleon = more stable nucleus.
      </p>

      {/* Preset nuclei */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-2">Quick Select:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_NUCLEI.map((nuc) => (
            <button
              key={nuc.symbol}
              onClick={() => { setZ(String(nuc.Z)); setN(String(nuc.N)); setAtomicMass(String(nuc.atomicMass)) }}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
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
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-4 font-semibold text-white transition-all hover:from-amber-500 hover:to-yellow-500 hover:shadow-lg hover:shadow-amber-500/25"
      >
        Calculate Binding Energy
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Binding Energy Results">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Total Binding Energy</p>
              <p className="text-2xl font-bold font-mono text-amber-300">{result.totalBE.toFixed(4)}</p>
              <p className="text-xs text-slate-500">MeV</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">BE per Nucleon</p>
              <p className="text-2xl font-bold font-mono text-green-300">{result.perNucleon.toFixed(4)}</p>
              <p className="text-xs text-slate-500">MeV/nucleon</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Mass Defect</p>
              <p className="text-2xl font-bold font-mono text-white">{result.massDefect.toFixed(6)}</p>
              <p className="text-xs text-slate-500">amu</p>
            </div>
          </div>

          {/* Stability indicator */}
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-300 mb-2">Stability Assessment</p>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  result.perNucleon > 8.5 ? 'bg-green-500' :
                  result.perNucleon > 7 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((result.perNucleon / 8.8) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Less stable</span>
              <span>Fe-56 peak ({'\u2248'}8.79 MeV/nucleon)</span>
              <span>Most stable</span>
            </div>
          </div>

          {/* Calculation steps */}
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-300 mb-2">Calculation Steps</p>
            <div className="space-y-1">
              {result.steps.map((step, i) => (
                <p key={i} className="text-xs font-mono text-slate-400">{step}</p>
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
      <h2 className="text-2xl font-bold text-white mb-2">Mass-Energy Equivalence</h2>
      <p className="text-slate-400 mb-6">
        Convert between mass (amu) and energy (MeV) using Einstein&apos;s E = mc{'\u00B2'}.
        1 amu = 931.494 MeV/c{'\u00B2'}.
      </p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode('mass-to-energy')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            mode === 'mass-to-energy' ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Mass {'\u2192'} Energy
        </button>
        <button
          onClick={() => setMode('energy-to-mass')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            mode === 'energy-to-mass' ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
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
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 py-4 font-semibold text-white transition-all hover:from-amber-500 hover:to-yellow-500 hover:shadow-lg hover:shadow-amber-500/25"
      >
        Convert
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Result">
          <div className="text-center">
            {result.energy !== undefined && (
              <>
                <p className="text-sm text-amber-300 mb-2">Energy equivalent</p>
                <p className="text-4xl font-bold text-white font-mono">{formatSci(result.energy)} <span className="text-2xl text-amber-300">MeV</span></p>
                <p className="text-sm text-slate-400 mt-2">= {formatSci(result.energy * 1.602176634e-13)} J</p>
              </>
            )}
            {result.mass !== undefined && (
              <>
                <p className="text-sm text-amber-300 mb-2">Mass equivalent</p>
                <p className="text-4xl font-bold text-white font-mono">{formatSci(result.mass)} <span className="text-2xl text-amber-300">amu</span></p>
                <p className="text-sm text-slate-400 mt-2">= {formatSci(result.mass * 1.66053906660e-27)} kg</p>
              </>
            )}
          </div>
        </ResultCard>
      )}

      {/* Reference table */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Notable Mass-Energy Equivalences</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left py-2 px-2">Process</th>
                <th className="text-right py-2 px-2">{'\u0394'}m (amu)</th>
                <th className="text-right py-2 px-2">Energy (MeV)</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-white/5">
                <td className="py-2 px-2">Electron mass</td>
                <td className="text-right px-2 font-mono">0.000549</td>
                <td className="text-right px-2 font-mono">0.511</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 px-2">Proton mass</td>
                <td className="text-right px-2 font-mono">1.007276</td>
                <td className="text-right px-2 font-mono">938.272</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 px-2">Neutron mass</td>
                <td className="text-right px-2 font-mono">1.008665</td>
                <td className="text-right px-2 font-mono">939.565</td>
              </tr>
              <tr className="border-b border-white/5">
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
      </div>
    </div>
  )
}

// ============================================================
// TAB: ISOTOPE DATABASE
// ============================================================

function IsotopeCard({ isotope }: { isotope: Isotope }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-amber-500/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{isotope.symbol}</h3>
          <p className="text-sm text-slate-400">{isotope.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Z={isotope.atomicNumber}</p>
          <p className="text-xs text-slate-500">A={isotope.massNumber}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-slate-400 mb-1">Half-life</p>
        <p className="text-sm font-mono text-amber-300">
          {isotope.halfLife >= 1e6
            ? `${isotope.halfLife.toExponential(3)} ${isotope.halfLifeUnit}`
            : `${isotope.halfLife} ${isotope.halfLifeUnit}`
          }
        </p>
      </div>

      <div className="mb-3">
        <p className="text-xs text-slate-400 mb-1">Decay Mode</p>
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
          <p className="text-xs text-slate-400 mb-1">Daughter</p>
          <p className="text-sm text-green-300">{isotope.daughter}</p>
        </div>
      )}

      {isotope.applications && isotope.applications.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Applications</p>
          <div className="flex flex-wrap gap-1">
            {isotope.applications.map((app) => (
              <span key={app} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                {app}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
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
      <h2 className="text-2xl font-bold text-white mb-2">Isotope Database</h2>
      <p className="text-slate-400 mb-6">Browse {COMMON_ISOTOPES.length} important radioisotopes with properties, decay modes, and applications.</p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name, symbol, or application..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Decay Type</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDecayFilter('all')}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                decayFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            {(Object.entries(DECAY_TYPE_LABELS) as [DecayType, typeof DECAY_TYPE_LABELS[DecayType]][]).map(([type, info]) => (
              <button
                key={type}
                onClick={() => setDecayFilter(type)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  decayFilter === type ? `${info.bgColor} ${info.color}` : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {info.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">Showing {filtered.length} of {COMMON_ISOTOPES.length} isotopes</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((iso) => (
          <IsotopeCard key={iso.symbol} isotope={iso} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">VerChem</span>
            </h1>
          </Link>
          <Link href="/tools" className="text-slate-400 hover:text-amber-400 transition-colors font-medium text-sm">
            {'\u2190'} All Tools
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 mb-6">
            {'\u2622'} Nuclear &amp; Radiochemistry
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Nuclear Chemistry
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">
              Calculator
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Radioactive decay, nuclear equations, binding energy, mass-energy equivalence,
            and a comprehensive isotope database.
          </p>
        </div>
      </section>

      {/* Tab Selector */}
      <section className="py-4 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl p-3 text-center transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                <p className="text-lg mb-0.5">{tab.icon}</p>
                <p className="font-semibold text-xs">{tab.label}</p>
                <p className="text-[10px] mt-0.5 opacity-75">{tab.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Calculator Section */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900/90 to-amber-900/20 p-6 md:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-sm">
            {renderTab()}
          </div>
        </div>
      </section>

      {/* Educational Info */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Understanding Nuclear Chemistry</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Key concepts in nuclear chemistry and radioactivity
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '\u2622',
                title: 'Radioactive Decay',
                description: 'Unstable nuclei emit radiation to reach a more stable state. The rate follows first-order kinetics: N(t) = N\u2080e^(-\u03BBt).'
              },
              {
                icon: '\u03B1',
                title: 'Alpha Decay',
                description: 'Emission of a helium-4 nucleus (\u2074\u2082He). Reduces mass number by 4 and atomic number by 2. Common in heavy nuclei (Z > 82).'
              },
              {
                icon: '\u03B2',
                title: 'Beta Decay',
                description: '\u03B2\u207B: neutron converts to proton + electron + antineutrino. \u03B2\u207A: proton converts to neutron + positron + neutrino.'
              },
              {
                icon: '\u26A1',
                title: 'Binding Energy',
                description: 'Energy required to disassemble a nucleus. Fe-56 has the highest BE per nucleon (\u22488.79 MeV), making it the most stable nucleus.'
              },
              {
                icon: '\u231B',
                title: 'Half-Life',
                description: 'Time for half the radioactive atoms to decay. Ranges from nanoseconds (Po-214) to billions of years (U-238).'
              },
              {
                icon: '\uD83D\uDCA5',
                title: 'E = mc\u00B2',
                description: 'Mass and energy are equivalent. The mass defect in nuclear reactions converts to enormous energy: 1 amu = 931.494 MeV.'
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/30 transition-colors">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Explore More Chemistry Tools</h2>
          <p className="text-slate-400 mb-8">VerChem offers a complete suite of chemistry calculators and tools</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/tools/quantum" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 font-medium text-white hover:from-purple-500 hover:to-violet-500 transition-colors">
              Quantum Chemistry {'\u2192'}
            </Link>
            <Link href="/tools/equation-balancer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors">
              Equation Balancer {'\u2192'}
            </Link>
            <Link href="/tools/gas-laws" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors">
              Gas Laws {'\u2192'}
            </Link>
            <Link href="/tools/periodic-table" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors">
              Periodic Table {'\u2192'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
