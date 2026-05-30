'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { CalcShell, Card } from '@/components/lab'
import {
  validateQuantumNumbers,
  getSubshells,
  maxElectronsInShell,
  hydrogenEnergy,
  hydrogenTransition,
  debroglieWavelength,
  photonEnergy,
  bohrRadius,
  hydrogenLikeEnergy,
} from '@/lib/calculations/nuclear'
import type { HydrogenTransition, PhotonEnergyResult } from '@/lib/calculations/nuclear'
import { ELECTRON_MASS, PROTON_MASS } from '@/lib/constants/physical-constants'

// ============================================================
// TYPES
// ============================================================

type QuantumTab = 'quantum-numbers' | 'orbitals' | 'hydrogen' | 'debroglie' | 'photon' | 'bohr'

interface TabInfo {
  id: QuantumTab
  label: string
  description: string
}

// ============================================================
// TAB DEFINITIONS
// ============================================================

const TABS: TabInfo[] = [
  { id: 'quantum-numbers', label: 'Quantum Numbers', description: 'Validate n, l, m\u2097, m\u209B' },
  { id: 'orbitals', label: 'Orbital Explorer', description: 'Shells & subshells' },
  { id: 'hydrogen', label: 'Hydrogen Atom', description: 'Energy levels & spectra' },
  { id: 'debroglie', label: 'de Broglie', description: 'Matter wave \u03BB' },
  { id: 'photon', label: 'Photon Energy', description: 'E = hc/\u03BB' },
  { id: 'bohr', label: 'Bohr Model', description: 'Orbit radii' },
]

// ============================================================
// HELPER COMPONENTS
// ============================================================

function InputField({ label, value, onChange, placeholder, unit, disabled, type }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  unit?: string
  disabled?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="relative">
        <input
          type={type || 'text'}
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
    <div role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
      {message}
    </div>
  )
}

function formatSci(n: number, digits: number = 4): string {
  if (n === 0) return '0'
  if (Math.abs(n) < 1e-3 || Math.abs(n) >= 1e6) return n.toExponential(digits)
  return n.toPrecision(digits + 1)
}

// ============================================================
// ORBITAL SHAPE VISUALIZATIONS (CSS-based)
// ============================================================

function OrbitalShape({ l, size }: { l: number; size?: number }) {
  const s = size || 60

  if (l === 0) {
    // s orbital: circle
    return (
      <div className="flex items-center justify-center" style={{ width: s, height: s }}>
        <div
          className="rounded-full bg-primary-500/40 border border-primary-500/60"
          style={{ width: s * 0.6, height: s * 0.6 }}
        />
      </div>
    )
  }

  if (l === 1) {
    // p orbital: figure-8 (two lobes — distinct hues mark the two wavefunction lobes)
    return (
      <div className="flex items-center justify-center" style={{ width: s, height: s }}>
        <div className="relative" style={{ width: s * 0.8, height: s * 0.8 }}>
          <div
            className="absolute rounded-full bg-primary-500/40 border border-primary-500/60"
            style={{
              width: s * 0.35,
              height: s * 0.35,
              top: s * 0.05,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <div
            className="absolute rounded-full bg-secondary-500/40 border border-secondary-500/60"
            style={{
              width: s * 0.35,
              height: s * 0.35,
              bottom: s * 0.05,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <div
            className="absolute bg-foreground rounded-full"
            style={{
              width: 4,
              height: 4,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>
    )
  }

  if (l === 2) {
    // d orbital: four-leaf clover
    return (
      <div className="flex items-center justify-center" style={{ width: s, height: s }}>
        <div className="relative" style={{ width: s * 0.9, height: s * 0.9 }}>
          {[0, 90, 180, 270].map((angle) => (
            <div
              key={angle}
              className="absolute rounded-full bg-primary-500/30 border border-primary-500/50"
              style={{
                width: s * 0.28,
                height: s * 0.28,
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle + 45}deg) translateY(-${s * 0.22}px)`,
              }}
            />
          ))}
          <div
            className="absolute bg-foreground rounded-full"
            style={{
              width: 4,
              height: 4,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>
    )
  }

  // f orbital: complex - represent as 6 lobes
  return (
    <div className="flex items-center justify-center" style={{ width: s, height: s }}>
      <div className="relative" style={{ width: s * 0.9, height: s * 0.9 }}>
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <div
            key={angle}
            className="absolute rounded-full bg-primary-500/25 border border-primary-500/40"
            style={{
              width: s * 0.22,
              height: s * 0.22,
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${s * 0.24}px)`,
            }}
          />
        ))}
        <div
          className="absolute bg-foreground rounded-full"
          style={{
            width: 4,
            height: 4,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  )
}

// ============================================================
// ELECTROMAGNETIC SPECTRUM BAR
// ============================================================

function SpectrumBar({ wavelengthNm, region }: { wavelengthNm: number; region: string }) {
  // Position on a log scale from 0.001 nm (gamma) to 1e9 nm (radio)
  const minLog = -3 // 0.001 nm
  const maxLog = 9  // 1e9 nm
  const logWl = Math.log10(wavelengthNm)
  const pct = ((logWl - minLog) / (maxLog - minLog)) * 100
  const clampedPct = Math.max(0, Math.min(100, pct))

  return (
    <Card className="mt-4 p-4">
      <p className="text-sm text-foreground mb-3">Electromagnetic Spectrum Position</p>
      <div className="relative h-6 rounded-full overflow-hidden border border-border">
        {/* Spectrum gradient \u2014 encodes real wavelength\u2192colour physics (kept) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #4b0082 0%, #000080 8%, #0000ff 15%, #00ff00 30%, #ffff00 40%, #ff8c00 48%, #ff0000 55%, #8b0000 65%, #3d0000 80%, #1a0000 100%)',
          }}
        />
        {/* Marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground"
          style={{ left: `${clampedPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{'\u03B3'}-rays</span>
        <span>X-rays</span>
        <span>UV</span>
        <span>Visible</span>
        <span>IR</span>
        <span>Micro</span>
        <span>Radio</span>
      </div>
      <p className="text-center text-sm text-primary-600 mt-2 font-medium">{region}</p>
    </Card>
  )
}

// ============================================================
// VISIBLE SPECTRUM LINE (for hydrogen emission)
// ============================================================

function wavelengthToColor(nm: number): string {
  if (nm < 380) return '#7700ff'
  if (nm < 440) {
    const t = (nm - 380) / (440 - 380)
    return `rgb(${Math.round((1 - t) * 120)}, 0, ${Math.round(255)})`
  }
  if (nm < 490) {
    const t = (nm - 440) / (490 - 440)
    return `rgb(0, ${Math.round(t * 255)}, 255)`
  }
  if (nm < 510) {
    const t = (nm - 490) / (510 - 490)
    return `rgb(0, 255, ${Math.round((1 - t) * 255)})`
  }
  if (nm < 580) {
    const t = (nm - 510) / (580 - 510)
    return `rgb(${Math.round(t * 255)}, 255, 0)`
  }
  if (nm < 645) {
    const t = (nm - 580) / (645 - 580)
    return `rgb(255, ${Math.round((1 - t) * 255)}, 0)`
  }
  if (nm <= 750) return 'rgb(255, 0, 0)'
  return '#880000'
}

// ============================================================
// TAB: QUANTUM NUMBER VALIDATOR
// ============================================================

function QuantumNumbersTab() {
  const [n, setN] = useState('3')
  const [l, setL] = useState('2')
  const [ml, setMl] = useState('0')
  const [ms, setMs] = useState('0.5')
  const [result, setResult] = useState<ReturnType<typeof validateQuantumNumbers> | null>(null)

  const validate = useCallback(() => {
    const nVal = parseInt(n)
    const lVal = parseInt(l)
    const mlVal = parseInt(ml)
    const msVal = parseFloat(ms)
    const r = validateQuantumNumbers(nVal, lVal, mlVal, msVal)
    setResult(r)
  }, [n, l, ml, ms])

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Quantum Number Validator</h2>
      <p className="text-muted-foreground mb-6">
        Verify if a set of quantum numbers (n, l, m{'\u2097'}, m{'\u209B'}) is valid for an electron in an atom.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <InputField label="n (principal)" value={n} onChange={setN} placeholder="e.g., 3" />
          <p className="text-xs text-muted-foreground mt-1">Shell number (1, 2, 3, ...)</p>
        </div>
        <div>
          <InputField label="l (angular)" value={l} onChange={setL} placeholder="e.g., 2" />
          <p className="text-xs text-muted-foreground mt-1">0 to n-1 (s, p, d, f)</p>
        </div>
        <div>
          <InputField label="m\u2097 (magnetic)" value={ml} onChange={setMl} placeholder="e.g., 0" />
          <p className="text-xs text-muted-foreground mt-1">-l to +l</p>
        </div>
        <div>
          <InputField label="m\u209B (spin)" value={ms} onChange={setMs} placeholder="+0.5 or -0.5" />
          <p className="text-xs text-muted-foreground mt-1">+1/2 or -1/2</p>
        </div>
      </div>

      <button
        onClick={validate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Validate
      </button>

      {result && (
        <ResultCard title="Validation Result">
          <div className={`rounded-md p-4 text-center ${
            result.valid
              ? 'bg-success/10 border border-success/40'
              : 'bg-destructive/10 border border-destructive/40'
          }`}>
            <p className={`text-2xl font-bold ${result.valid ? 'text-success' : 'text-destructive'}`}>
              {result.valid ? 'VALID' : 'INVALID'}
            </p>
            {result.orbitalName && (
              <p className="text-lg text-primary-600 mt-2">
                Orbital: <span className="font-mono font-bold">{result.orbitalName}</span>
                {parseFloat(ms) === 0.5 ? ' (spin up \u2191)' : ' (spin down \u2193)'}
              </p>
            )}
          </div>

          {!result.valid && result.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.errors.map((err, i) => (
                <div key={i} className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Rules reminder */}
          <div className="mt-4 rounded-md bg-muted border border-border p-4">
            <p className="text-sm text-foreground font-medium mb-2">Quantum Number Rules</p>
            <div className="grid gap-2 text-xs text-muted-foreground">
              <p><span className="text-primary-600 font-mono">n</span>: Principal quantum number. n = 1, 2, 3, ... (positive integer)</p>
              <p><span className="text-primary-600 font-mono">l</span>: Angular momentum. l = 0 to n-1 (0=s, 1=p, 2=d, 3=f)</p>
              <p><span className="text-primary-600 font-mono">m{'\u2097'}</span>: Magnetic. m{'\u2097'} = -l to +l (integer)</p>
              <p><span className="text-primary-600 font-mono">m{'\u209B'}</span>: Spin. m{'\u209B'} = +1/2 (\u2191) or -1/2 (\u2193)</p>
            </div>
          </div>
        </ResultCard>
      )}

      {/* Quick test examples */}
      <Card className="mt-6 p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Try These Examples</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '1s (valid)', n: '1', l: '0', ml: '0', ms: '0.5' },
            { label: '3d (valid)', n: '3', l: '2', ml: '-1', ms: '-0.5' },
            { label: '2d (INVALID)', n: '2', l: '2', ml: '0', ms: '0.5' },
            { label: '4f (valid)', n: '4', l: '3', ml: '3', ms: '0.5' },
            { label: 'n=0 (INVALID)', n: '0', l: '0', ml: '0', ms: '0.5' },
          ].map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setN(ex.n); setL(ex.l); setMl(ex.ml); setMs(ex.ms) }}
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
// TAB: ORBITAL EXPLORER
// ============================================================

function OrbitalsTab() {
  const [selectedN, setSelectedN] = useState(3)

  const subshells = useMemo(() => getSubshells(selectedN), [selectedN])
  const totalElectrons = maxElectronsInShell(selectedN)

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Orbital Explorer</h2>
      <p className="text-muted-foreground mb-6">
        Explore electron shells, subshells, and orbital shapes.
      </p>

      {/* Shell selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">Select Shell (n)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setSelectedN(n)}
              aria-pressed={selectedN === n}
              className={`w-12 h-12 rounded-md text-lg font-bold transition-colors border ${
                selectedN === n
                  ? 'border-primary-500 bg-muted text-primary-600 ring-1 ring-primary-500/40'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Shell info */}
      <div className="rounded-md bg-muted border border-border p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-foreground">Shell n = {selectedN}</h3>
          <span className="rounded-full bg-card border border-primary-500/40 px-3 py-1 text-sm text-primary-600">
            Max {totalElectrons} electrons
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {subshells.length} subshell{subshells.length > 1 ? 's' : ''}: {subshells.map((s) => s.name).join(', ')}
        </p>
      </div>

      {/* Subshell cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {subshells.map((sub) => (
          <Card
            key={sub.name}
            className="p-5 hover:border-primary-500/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-primary-600 font-mono">{sub.name}</h4>
                <p className="text-sm text-muted-foreground">l = {sub.l}</p>
              </div>
              <OrbitalShape l={sub.l} size={64} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted border border-border p-2">
                <p className="text-xs text-muted-foreground">Orbitals</p>
                <p className="text-lg font-bold text-foreground">{2 * sub.l + 1}</p>
              </div>
              <div className="rounded-md bg-muted border border-border p-2">
                <p className="text-xs text-muted-foreground">Max e{'\u207B'}</p>
                <p className="text-lg font-bold text-foreground">{sub.maxE}</p>
              </div>
              <div className="rounded-md bg-muted border border-border p-2">
                <p className="text-xs text-muted-foreground">m{'\u2097'} values</p>
                <p className="text-sm font-mono text-foreground">
                  {Array.from({ length: 2 * sub.l + 1 }, (_, i) => i - sub.l).join(', ')}
                </p>
              </div>
            </div>

            {/* Electron boxes */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Orbital boxes (m{'\u2097'})</p>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 2 * sub.l + 1 }, (_, i) => i - sub.l).map((mlVal) => (
                  <div key={mlVal} className="rounded-md border border-border bg-muted p-1.5 text-center min-w-[40px]">
                    <div className="flex justify-center gap-0.5 text-xs mb-0.5">
                      <span className="text-primary-600">{'\u2191'}</span>
                      <span className="text-secondary-600">{'\u2193'}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{mlVal >= 0 ? '+' : ''}{mlVal}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Energy level diagram */}
      <Card className="mt-6 p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Energy Level Summary (All Shells)</h4>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((shellN) => {
            const subs = getSubshells(shellN)
            const total = maxElectronsInShell(shellN)
            const isActive = shellN === selectedN
            return (
              <div
                key={shellN}
                className={`flex items-center gap-3 rounded-md p-2 transition-colors ${
                  isActive ? 'bg-muted border border-primary-500/30' : ''
                }`}
              >
                <span className={`text-sm font-bold w-8 ${isActive ? 'text-primary-600' : 'text-muted-foreground'}`}>
                  n={shellN}
                </span>
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {subs.map((s) => (
                    <span
                      key={s.name}
                      className={`rounded-md px-2 py-0.5 text-xs font-mono border ${
                        isActive ? 'bg-card border-primary-500/40 text-primary-600' : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      {s.name} ({s.maxE})
                    </span>
                  ))}
                </div>
                <span className={`text-xs ${isActive ? 'text-primary-600' : 'text-muted-foreground'}`}>
                  {total}e{'\u207B'}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// TAB: HYDROGEN ATOM
// ============================================================

function HydrogenTab() {
  const [nInitial, setNInitial] = useState('3')
  const [nFinal, setNFinal] = useState('2')
  const [transitions, setTransitions] = useState<HydrogenTransition[]>([])
  const [singleResult, setSingleResult] = useState<HydrogenTransition | null>(null)
  const [error, setError] = useState('')
  const [showSeries, setShowSeries] = useState<'single' | 'lyman' | 'balmer' | 'paschen'>('single')

  const calculateSingle = useCallback(() => {
    setError('')
    setSingleResult(null)
    try {
      const ni = parseInt(nInitial)
      const nf = parseInt(nFinal)
      if (isNaN(ni) || isNaN(nf)) throw new Error('Both n values must be integers')
      const r = hydrogenTransition(ni, nf)
      setSingleResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [nInitial, nFinal])

  const calculateSeries = useCallback((seriesType: 'lyman' | 'balmer' | 'paschen') => {
    setShowSeries(seriesType)
    setError('')
    const nLow = seriesType === 'lyman' ? 1 : seriesType === 'balmer' ? 2 : 3
    const results: HydrogenTransition[] = []
    for (let nHigh = nLow + 1; nHigh <= nLow + 6; nHigh++) {
      results.push(hydrogenTransition(nHigh, nLow))
    }
    setTransitions(results)
  }, [])

  // Energy level diagram data
  const energyLevels = [1, 2, 3, 4, 5, 6].map((n) => ({
    n,
    energy: hydrogenEnergy(n),
  }))

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Hydrogen Atom Energy Levels</h2>
      <p className="text-muted-foreground mb-6">
        Calculate electron transitions, emission wavelengths, and explore spectral series.
        E{'\u2099'} = -13.6/n{'\u00B2'} eV
      </p>

      {/* Energy level diagram */}
      <Card className="p-4 mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">Energy Level Diagram</h4>
        <div className="relative" style={{ height: '200px' }}>
          {energyLevels.map((level) => {
            const yPct = ((1 - (1 / (level.n * level.n))) / 1) * 100
            return (
              <div
                key={level.n}
                className="absolute left-0 right-0 flex items-center gap-3"
                style={{ top: `${100 - yPct - 5}%` }}
              >
                <span className="text-xs text-muted-foreground w-8 text-right">n={level.n}</span>
                <div className="flex-1 h-px bg-primary-500/50 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-primary-600 font-mono">
                    {level.energy.toFixed(2)} eV
                  </div>
                </div>
              </div>
            )
          })}
          {/* n=infinity */}
          <div className="absolute left-0 right-0 flex items-center gap-3" style={{ top: '0%' }}>
            <span className="text-xs text-muted-foreground w-8 text-right">n={'\u221E'}</span>
            <div className="flex-1 h-px bg-border border-dashed relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                0.00 eV
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowSeries('single')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
            showSeries === 'single' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Single Transition
        </button>
        <button
          onClick={() => calculateSeries('lyman')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
            showSeries === 'lyman' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Lyman Series (UV)
        </button>
        <button
          onClick={() => calculateSeries('balmer')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
            showSeries === 'balmer' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Balmer Series (Visible)
        </button>
        <button
          onClick={() => calculateSeries('paschen')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors border ${
            showSeries === 'paschen' ? 'border-primary-500 bg-muted text-primary-600' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Paschen Series (IR)
        </button>
      </div>

      {showSeries === 'single' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Initial level (n\u1d62)" value={nInitial} onChange={setNInitial} placeholder="e.g., 3" />
            <InputField label="Final level (n\u209f)" value={nFinal} onChange={setNFinal} placeholder="e.g., 2" />
          </div>

          <button
            onClick={calculateSingle}
            className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
          >
            Calculate Transition
          </button>

          {error && <ErrorBanner message={error} />}

          {singleResult && (
            <ResultCard title={`Transition: n=${singleResult.nInitial} \u2192 n=${singleResult.nFinal}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md bg-muted border border-border p-4">
                  <p className="text-sm text-muted-foreground">Energy</p>
                  <p className="text-2xl font-bold font-mono text-primary-600">{singleResult.energyEV.toFixed(4)} eV</p>
                  <p className="text-xs text-muted-foreground">{formatSci(singleResult.energyJ)} J</p>
                </div>
                <div className="rounded-md bg-muted border border-border p-4">
                  <p className="text-sm text-muted-foreground">Wavelength</p>
                  <p className="text-2xl font-bold font-mono text-primary-600">{singleResult.wavelengthNm.toFixed(2)} nm</p>
                  {singleResult.isVisible && (
                    <div
                      className="mt-1 h-3 w-full rounded-full"
                      style={{ backgroundColor: wavelengthToColor(singleResult.wavelengthNm) }}
                    />
                  )}
                </div>
                <div className="rounded-md bg-muted border border-border p-4">
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="text-xl font-bold font-mono text-foreground">{formatSci(singleResult.frequencyHz)} Hz</p>
                </div>
                <div className="rounded-md bg-muted border border-border p-4">
                  <p className="text-sm text-muted-foreground">Series</p>
                  <p className="text-xl font-bold text-foreground">{singleResult.seriesName}</p>
                  <p className="text-xs text-muted-foreground">{singleResult.isVisible ? 'Visible light' : 'Not visible'}</p>
                </div>
              </div>
            </ResultCard>
          )}
        </>
      )}

      {showSeries !== 'single' && transitions.length > 0 && (
        <ResultCard title={`${showSeries.charAt(0).toUpperCase() + showSeries.slice(1)} Series`}>
          {/* Emission lines visualization \u2014 spectroscope view (dark backdrop is intrinsic to reading emission lines) */}
          {showSeries === 'balmer' && (
            <div className="mb-4 rounded-md bg-[#0b0b10] border border-border p-3">
              <p className="text-xs text-slate-400 mb-2">Visible Emission Lines</p>
              <div className="relative h-8 rounded bg-[#05050a]">
                {transitions.filter((t) => t.isVisible).map((t, i) => {
                  const pos = ((t.wavelengthNm - 380) / (750 - 380)) * 100
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full w-1 rounded"
                      style={{
                        left: `${pos}%`,
                        backgroundColor: wavelengthToColor(t.wavelengthNm),
                        boxShadow: `0 0 8px ${wavelengthToColor(t.wavelengthNm)}`,
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>380 nm (violet)</span>
                <span>750 nm (red)</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-2">Transition</th>
                  <th className="text-right py-2 px-2">Energy (eV)</th>
                  <th className="text-right py-2 px-2">{'\u03BB'} (nm)</th>
                  <th className="text-right py-2 px-2">Frequency (Hz)</th>
                  <th className="text-center py-2 px-2">Color</th>
                </tr>
              </thead>
              <tbody>
                {transitions.map((t, i) => (
                  <tr key={i} className="border-b border-border text-foreground">
                    <td className="py-2 px-2 font-mono">{t.nInitial} {'\u2192'} {t.nFinal}</td>
                    <td className="text-right px-2 font-mono">{t.energyEV.toFixed(4)}</td>
                    <td className="text-right px-2 font-mono">{t.wavelengthNm.toFixed(2)}</td>
                    <td className="text-right px-2 font-mono">{t.frequencyHz.toExponential(3)}</td>
                    <td className="text-center px-2">
                      {t.isVisible ? (
                        <div
                          className="inline-block w-6 h-4 rounded"
                          style={{ backgroundColor: wavelengthToColor(t.wavelengthNm) }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t.wavelengthNm < 380 ? 'UV' : 'IR'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================================
// TAB: DE BROGLIE WAVELENGTH
// ============================================================

function DeBroglieTab() {
  const [mass, setMass] = useState('')
  const [velocity, setVelocity] = useState('')
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const m = parseFloat(mass)
      const v = parseFloat(velocity)
      if (isNaN(m) || isNaN(v)) throw new Error('Both mass and velocity must be valid numbers')
      const wavelength = debroglieWavelength(m, v)
      setResult(wavelength)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [mass, velocity])

  const examples = [
    { label: 'Electron at 1% c', mass: ELECTRON_MASS, velocity: 2997924.58, desc: 'Electron' },
    { label: 'Proton at 1000 m/s', mass: PROTON_MASS, velocity: 1000, desc: 'Proton' },
    { label: 'Baseball (145g) at 40 m/s', mass: 0.145, velocity: 40, desc: 'Baseball' },
    { label: 'Electron at 100 eV KE', mass: ELECTRON_MASS, velocity: Math.sqrt(2 * 100 * 1.602176634e-19 / ELECTRON_MASS), desc: '100 eV electron' },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">de Broglie Wavelength</h2>
      <p className="text-muted-foreground mb-6">
        Calculate the wavelength of matter waves: {'\u03BB'} = h / (m {'\u00D7'} v).
        All matter has wave-like properties, but only significant for subatomic particles.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Mass (m)" value={mass} onChange={setMass} placeholder="e.g., 9.109e-31" unit="kg" />
        <InputField label="Velocity (v)" value={velocity} onChange={setVelocity} placeholder="e.g., 2997924" unit="m/s" />
      </div>

      {/* Quick examples */}
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => { setMass(ex.mass.toExponential(6)); setVelocity(ex.velocity.toFixed(2)) }}
            className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Calculate Wavelength
      </button>

      {error && <ErrorBanner message={error} />}

      {result !== null && (
        <ResultCard title="de Broglie Wavelength">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground mb-2">{'\u03BB'} = h / (m {'\u00D7'} v)</p>
            <p className="text-4xl font-bold text-foreground font-mono">
              {formatSci(result)} <span className="text-2xl text-muted-foreground">m</span>
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-center">
            <div className="rounded-md bg-muted border border-border p-3">
              <p className="text-xs text-muted-foreground">In pm</p>
              <p className="text-lg font-mono text-foreground">{formatSci(result * 1e12)}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-3">
              <p className="text-xs text-muted-foreground">In nm</p>
              <p className="text-lg font-mono text-foreground">{formatSci(result * 1e9)}</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-3">
              <p className="text-xs text-muted-foreground">In {'\u00C5'} (angstrom)</p>
              <p className="text-lg font-mono text-foreground">{formatSci(result * 1e10)}</p>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-4 rounded-md bg-muted border border-border p-4">
            <p className="text-sm text-foreground mb-2">Scale Comparison</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Atom diameter</span>
                <span className="font-mono">~100 pm (1 {'\u00C5'})</span>
              </div>
              <div className="flex justify-between">
                <span>Chemical bond length</span>
                <span className="font-mono">~100-300 pm</span>
              </div>
              <div className="flex justify-between">
                <span>Visible light</span>
                <span className="font-mono">380-750 nm</span>
              </div>
              <div className="flex justify-between font-medium text-primary-600">
                <span>This wavelength</span>
                <span className="font-mono">{formatSci(result * 1e9)} nm</span>
              </div>
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================================
// TAB: PHOTON ENERGY
// ============================================================

function PhotonEnergyTab() {
  const [wavelength, setWavelength] = useState('500')
  const [result, setResult] = useState<PhotonEnergyResult | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    setResult(null)
    try {
      const wl = parseFloat(wavelength)
      if (isNaN(wl)) throw new Error('Wavelength must be a valid number')
      const r = photonEnergy(wl)
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [wavelength])

  const presets = [
    { label: 'UV-C (254 nm)', wl: '254' },
    { label: 'Blue (450 nm)', wl: '450' },
    { label: 'Green (530 nm)', wl: '530' },
    { label: 'Red (650 nm)', wl: '650' },
    { label: 'Near IR (1000 nm)', wl: '1000' },
    { label: 'X-ray (0.1 nm)', wl: '0.1' },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Photon Energy Calculator</h2>
      <p className="text-muted-foreground mb-6">
        Calculate photon energy from wavelength using E = hc/{'\u03BB'}.
      </p>

      <InputField label="Wavelength (\u03BB)" value={wavelength} onChange={setWavelength} placeholder="e.g., 500" unit="nm" />

      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setWavelength(p.wl)}
            className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-md bg-primary-500 py-4 font-semibold text-primary-foreground transition-colors hover:bg-primary-600 min-h-[44px]"
      >
        Calculate Energy
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Photon Energy">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Energy</p>
              <p className="text-2xl font-bold font-mono text-primary-600">{formatSci(result.energyEV)} eV</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Energy (per mole)</p>
              <p className="text-2xl font-bold font-mono text-primary-600">{formatSci(result.energyKJmol)} kJ/mol</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatSci(result.frequencyHz)} Hz</p>
            </div>
            <div className="rounded-md bg-muted border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Energy (Joules)</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatSci(result.energyJ)} J</p>
            </div>
          </div>

          {/* Visible color indicator — swatch colour is the real photon colour (kept) */}
          {result.wavelengthNm >= 380 && result.wavelengthNm <= 750 && (
            <div className="mt-4 flex items-center gap-3 rounded-md bg-muted border border-border p-4">
              <div
                className="w-12 h-12 rounded-md"
                style={{
                  backgroundColor: wavelengthToColor(result.wavelengthNm),
                  boxShadow: `0 0 20px ${wavelengthToColor(result.wavelengthNm)}`,
                }}
              />
              <div>
                <p className="text-sm text-muted-foreground">Visible Color</p>
                <p className="text-lg font-bold text-foreground">{result.region}</p>
              </div>
            </div>
          )}

          <SpectrumBar wavelengthNm={result.wavelengthNm} region={result.region} />
        </ResultCard>
      )}
    </div>
  )
}

// ============================================================
// TAB: BOHR MODEL
// ============================================================

function BohrModelTab() {
  const [selectedZ, setSelectedZ] = useState(1)
  const maxN = 6

  const levels = useMemo(() => {
    return Array.from({ length: maxN }, (_, i) => i + 1).map((n) => ({
      n,
      radius: bohrRadius(n, selectedZ),
      energy: hydrogenLikeEnergy(n, selectedZ),
    }))
  }, [selectedZ, maxN])

  const atoms = [
    { Z: 1, name: 'H', label: 'Hydrogen' },
    { Z: 2, name: 'He\u207A', label: 'Helium ion' },
    { Z: 3, name: 'Li\u00B2\u207A', label: 'Lithium ion' },
    { Z: 4, name: 'Be\u00B3\u207A', label: 'Beryllium ion' },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Bohr Model Calculator</h2>
      <p className="text-muted-foreground mb-6">
        Calculate orbital radii for hydrogen-like atoms.
        r{'\u2099'} = n{'\u00B2'} {'\u00D7'} a{'\u2080'} / Z, where a{'\u2080'} = 52.9 pm.
      </p>

      {/* Atom selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">Select Atom/Ion</label>
        <div className="flex gap-2">
          {atoms.map((atom) => (
            <button
              key={atom.Z}
              onClick={() => setSelectedZ(atom.Z)}
              aria-pressed={selectedZ === atom.Z}
              className={`rounded-md px-4 py-3 text-center transition-colors border ${
                selectedZ === atom.Z
                  ? 'border-primary-500 bg-muted text-primary-600 ring-1 ring-primary-500/40'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <p className="font-bold text-lg">{atom.name}</p>
              <p className="text-xs text-muted-foreground">{atom.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Bohr model */}
      <Card className="p-4 mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">Bohr Model (not to scale)</h4>
        <div className="relative mx-auto" style={{ width: '280px', height: '280px' }}>
          {/* Orbits */}
          {levels.map((level) => {
            const size = 40 + (level.n / maxN) * 220
            return (
              <div
                key={level.n}
                className="absolute rounded-full border border-primary-500/30"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  top: `${140 - size / 2}px`,
                  left: `${140 - size / 2}px`,
                }}
              >
                {/* Electron dot */}
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-primary-500"
                  style={{
                    top: '-5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
                {/* Label */}
                <span
                  className="absolute text-[10px] text-primary-600 font-mono"
                  style={{
                    top: '-16px',
                    right: '-8px',
                  }}
                >
                  n={level.n}
                </span>
              </div>
            )
          })}
          {/* Nucleus */}
          <div
            className="absolute w-6 h-6 rounded-full bg-primary-500"
            style={{ top: '127px', left: '127px' }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-primary-foreground">
              {selectedZ > 1 ? `+${selectedZ}` : '+'}
            </span>
          </div>
        </div>
      </Card>

      {/* Data table */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Orbital Data for Z = {selectedZ} ({atoms.find((a) => a.Z === selectedZ)?.label})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 px-2">n</th>
                <th className="text-right py-2 px-2">Radius (pm)</th>
                <th className="text-right py-2 px-2">Radius ({'\u00C5'})</th>
                <th className="text-right py-2 px-2">Energy (eV)</th>
                <th className="text-right py-2 px-2">Radius / a{'\u2080'}</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => (
                <tr key={level.n} className="border-b border-border text-foreground">
                  <td className="py-2 px-2 font-mono font-bold text-primary-600">{level.n}</td>
                  <td className="text-right px-2 font-mono">{level.radius.toFixed(2)}</td>
                  <td className="text-right px-2 font-mono">{(level.radius / 100).toFixed(4)}</td>
                  <td className="text-right px-2 font-mono">{level.energy.toFixed(4)}</td>
                  <td className="text-right px-2 font-mono">{(level.radius / 52.9177).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Formulas reference */}
      <Card className="mt-4 p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Key Formulas</h4>
        <div className="space-y-1 text-xs font-mono text-muted-foreground">
          <p>r{'\u2099'} = n{'\u00B2'} {'\u00D7'} a{'\u2080'} / Z = n{'\u00B2'} {'\u00D7'} 52.9 pm / {selectedZ}</p>
          <p>E{'\u2099'} = -13.6 {'\u00D7'} Z{'\u00B2'} / n{'\u00B2'} = -13.6 {'\u00D7'} {selectedZ}{'\u00B2'} / n{'\u00B2'} eV</p>
          <p>a{'\u2080'} = 52.9177 pm (Bohr radius)</p>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function QuantumChemistryPage() {
  const [activeTab, setActiveTab] = useState<QuantumTab>('quantum-numbers')

  const renderTab = () => {
    switch (activeTab) {
      case 'quantum-numbers': return <QuantumNumbersTab />
      case 'orbitals': return <OrbitalsTab />
      case 'hydrogen': return <HydrogenTab />
      case 'debroglie': return <DeBroglieTab />
      case 'photon': return <PhotonEnergyTab />
      case 'bohr': return <BohrModelTab />
    }
  }

  return (
    <CalcShell
      eyebrow="Advanced chemistry \u00B7 Quantum & atomic structure"
      title="Quantum Chemistry Calculator"
      subtitle="Quantum numbers, orbital explorer, hydrogen atom spectra, de Broglie wavelength, photon energy, and Bohr model."
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
        <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">Understanding Quantum Chemistry</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Key concepts in quantum mechanics and atomic structure.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Quantum Numbers',
              description: 'Four quantum numbers (n, l, m\u2097, m\u209B) uniquely describe each electron in an atom. No two electrons can share all four (Pauli Exclusion Principle).'
            },
            {
              title: 'Wave-Particle Duality',
              description: 'All matter exhibits both wave and particle properties. The de Broglie wavelength \u03BB = h/mv is significant only for subatomic particles.'
            },
            {
              title: 'Bohr Model',
              description: 'Electrons orbit the nucleus at quantized energy levels. E\u2099 = -13.6/n\u00B2 eV for hydrogen. Predicts spectral lines accurately.'
            },
            {
              title: 'Photon Energy',
              description: 'Light consists of photons with energy E = hf = hc/\u03BB. Higher frequency (shorter wavelength) means higher energy.'
            },
            {
              title: 'Atomic Orbitals',
              description: 'Orbitals are probability distributions for finding electrons. s(sphere), p(dumbbell), d(clover), f(complex) shapes.'
            },
            {
              title: 'Emission Spectra',
              description: 'When electrons drop to lower energy levels, they emit photons. The Balmer series (n\u21922) produces visible hydrogen lines.'
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
          <Link href="/tools/nuclear" className="inline-flex items-center gap-2 rounded-md bg-primary-500 text-primary-foreground px-5 py-2.5 font-medium hover:bg-primary-600 transition-colors min-h-[44px]">
            Nuclear Chemistry {'\u2192'}
          </Link>
          <Link href="/tools/equation-balancer" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]">
            Equation Balancer {'\u2192'}
          </Link>
          <Link href="/tools/ph-calculator" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]">
            pH Calculator {'\u2192'}
          </Link>
          <Link href="/tools/periodic-table" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]">
            Periodic Table {'\u2192'}
          </Link>
        </div>
      </Card>
    </CalcShell>
  )
}
