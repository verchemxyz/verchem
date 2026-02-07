'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  icon: string
  description: string
}

// ============================================================
// TAB DEFINITIONS
// ============================================================

const TABS: TabInfo[] = [
  { id: 'quantum-numbers', label: 'Quantum Numbers', icon: '\uD83C\uDFB2', description: 'Validate n, l, m\u2097, m\u209B' },
  { id: 'orbitals', label: 'Orbital Explorer', icon: '\uD83C\uDF0A', description: 'Shells & subshells' },
  { id: 'hydrogen', label: 'Hydrogen Atom', icon: '\u269B', description: 'Energy levels & spectra' },
  { id: 'debroglie', label: 'de Broglie', icon: '\u03BB', description: 'Matter wave \u03BB' },
  { id: 'photon', label: 'Photon Energy', icon: '\uD83D\uDCA1', description: 'E = hc/\u03BB' },
  { id: 'bohr', label: 'Bohr Model', icon: '\uD83D\uDD35', description: 'Orbit radii' },
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
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={type || 'text'}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className="mt-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
      <h3 className="text-lg font-semibold text-violet-300 mb-4">{title}</h3>
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
          className="rounded-full bg-violet-500/40 border border-violet-400/60"
          style={{ width: s * 0.6, height: s * 0.6 }}
        />
      </div>
    )
  }

  if (l === 1) {
    // p orbital: figure-8 (two lobes)
    return (
      <div className="flex items-center justify-center" style={{ width: s, height: s }}>
        <div className="relative" style={{ width: s * 0.8, height: s * 0.8 }}>
          <div
            className="absolute rounded-full bg-violet-500/40 border border-violet-400/60"
            style={{
              width: s * 0.35,
              height: s * 0.35,
              top: s * 0.05,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <div
            className="absolute rounded-full bg-purple-500/40 border border-purple-400/60"
            style={{
              width: s * 0.35,
              height: s * 0.35,
              bottom: s * 0.05,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          <div
            className="absolute bg-white rounded-full"
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
              className="absolute rounded-full bg-violet-500/30 border border-violet-400/50"
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
            className="absolute bg-white rounded-full"
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
            className="absolute rounded-full bg-violet-500/25 border border-violet-400/40"
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
          className="absolute bg-white rounded-full"
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
    <div className="mt-4 rounded-xl bg-white/5 p-4">
      <p className="text-sm text-slate-300 mb-3">Electromagnetic Spectrum Position</p>
      <div className="relative h-6 rounded-full overflow-hidden">
        {/* Spectrum gradient */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #4b0082 0%, #000080 8%, #0000ff 15%, #00ff00 30%, #ffff00 40%, #ff8c00 48%, #ff0000 55%, #8b0000 65%, #3d0000 80%, #1a0000 100%)',
          }}
        />
        {/* Marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white shadow-lg shadow-white/50"
          style={{ left: `${clampedPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{'\u03B3'}-rays</span>
        <span>X-rays</span>
        <span>UV</span>
        <span>Visible</span>
        <span>IR</span>
        <span>Micro</span>
        <span>Radio</span>
      </div>
      <p className="text-center text-sm text-violet-300 mt-2 font-medium">{region}</p>
    </div>
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
      <h2 className="text-2xl font-bold text-white mb-2">Quantum Number Validator</h2>
      <p className="text-slate-400 mb-6">
        Verify if a set of quantum numbers (n, l, m{'\u2097'}, m{'\u209B'}) is valid for an electron in an atom.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <InputField label="n (principal)" value={n} onChange={setN} placeholder="e.g., 3" />
          <p className="text-xs text-slate-500 mt-1">Shell number (1, 2, 3, ...)</p>
        </div>
        <div>
          <InputField label="l (angular)" value={l} onChange={setL} placeholder="e.g., 2" />
          <p className="text-xs text-slate-500 mt-1">0 to n-1 (s, p, d, f)</p>
        </div>
        <div>
          <InputField label="m\u2097 (magnetic)" value={ml} onChange={setMl} placeholder="e.g., 0" />
          <p className="text-xs text-slate-500 mt-1">-l to +l</p>
        </div>
        <div>
          <InputField label="m\u209B (spin)" value={ms} onChange={setMs} placeholder="+0.5 or -0.5" />
          <p className="text-xs text-slate-500 mt-1">+1/2 or -1/2</p>
        </div>
      </div>

      <button
        onClick={validate}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 font-semibold text-white transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25"
      >
        Validate
      </button>

      {result && (
        <ResultCard title="Validation Result">
          <div className={`rounded-xl p-4 text-center ${
            result.valid
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <p className={`text-2xl font-bold ${result.valid ? 'text-green-300' : 'text-red-300'}`}>
              {result.valid ? 'VALID' : 'INVALID'}
            </p>
            {result.orbitalName && (
              <p className="text-lg text-violet-300 mt-2">
                Orbital: <span className="font-mono font-bold">{result.orbitalName}</span>
                {parseFloat(ms) === 0.5 ? ' (spin up \u2191)' : ' (spin down \u2193)'}
              </p>
            )}
          </div>

          {!result.valid && result.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.errors.map((err, i) => (
                <div key={i} className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Rules reminder */}
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-300 font-medium mb-2">Quantum Number Rules</p>
            <div className="grid gap-2 text-xs text-slate-400">
              <p><span className="text-violet-300 font-mono">n</span>: Principal quantum number. n = 1, 2, 3, ... (positive integer)</p>
              <p><span className="text-violet-300 font-mono">l</span>: Angular momentum. l = 0 to n-1 (0=s, 1=p, 2=d, 3=f)</p>
              <p><span className="text-violet-300 font-mono">m{'\u2097'}</span>: Magnetic. m{'\u2097'} = -l to +l (integer)</p>
              <p><span className="text-violet-300 font-mono">m{'\u209B'}</span>: Spin. m{'\u209B'} = +1/2 (\u2191) or -1/2 (\u2193)</p>
            </div>
          </div>
        </ResultCard>
      )}

      {/* Quick test examples */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Try These Examples</h4>
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
              className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
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
// TAB: ORBITAL EXPLORER
// ============================================================

function OrbitalsTab() {
  const [selectedN, setSelectedN] = useState(3)

  const subshells = useMemo(() => getSubshells(selectedN), [selectedN])
  const totalElectrons = maxElectronsInShell(selectedN)

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Orbital Explorer</h2>
      <p className="text-slate-400 mb-6">
        Explore electron shells, subshells, and orbital shapes.
      </p>

      {/* Shell selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">Select Shell (n)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setSelectedN(n)}
              className={`w-12 h-12 rounded-xl text-lg font-bold transition-all ${
                selectedN === n
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Shell info */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">Shell n = {selectedN}</h3>
          <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-sm text-violet-300">
            Max {totalElectrons} electrons
          </span>
        </div>
        <p className="text-sm text-slate-400">
          {subshells.length} subshell{subshells.length > 1 ? 's' : ''}: {subshells.map((s) => s.name).join(', ')}
        </p>
      </div>

      {/* Subshell cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {subshells.map((sub) => (
          <div
            key={sub.name}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-violet-500/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-violet-300 font-mono">{sub.name}</h4>
                <p className="text-sm text-slate-400">l = {sub.l}</p>
              </div>
              <OrbitalShape l={sub.l} size={64} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/5 p-2">
                <p className="text-xs text-slate-400">Orbitals</p>
                <p className="text-lg font-bold text-white">{2 * sub.l + 1}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <p className="text-xs text-slate-400">Max e{'\u207B'}</p>
                <p className="text-lg font-bold text-white">{sub.maxE}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                <p className="text-xs text-slate-400">m{'\u2097'} values</p>
                <p className="text-sm font-mono text-white">
                  {Array.from({ length: 2 * sub.l + 1 }, (_, i) => i - sub.l).join(', ')}
                </p>
              </div>
            </div>

            {/* Electron boxes */}
            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Orbital boxes (m{'\u2097'})</p>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 2 * sub.l + 1 }, (_, i) => i - sub.l).map((mlVal) => (
                  <div key={mlVal} className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-1.5 text-center min-w-[40px]">
                    <div className="flex justify-center gap-0.5 text-xs mb-0.5">
                      <span className="text-violet-300">{'\u2191'}</span>
                      <span className="text-purple-300">{'\u2193'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{mlVal >= 0 ? '+' : ''}{mlVal}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Energy level diagram */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Energy Level Summary (All Shells)</h4>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((shellN) => {
            const subs = getSubshells(shellN)
            const total = maxElectronsInShell(shellN)
            const isActive = shellN === selectedN
            return (
              <div
                key={shellN}
                className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                  isActive ? 'bg-violet-500/10 border border-violet-500/20' : ''
                }`}
              >
                <span className={`text-sm font-bold w-8 ${isActive ? 'text-violet-300' : 'text-slate-500'}`}>
                  n={shellN}
                </span>
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {subs.map((s) => (
                    <span
                      key={s.name}
                      className={`rounded-md px-2 py-0.5 text-xs font-mono ${
                        isActive ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {s.name} ({s.maxE})
                    </span>
                  ))}
                </div>
                <span className={`text-xs ${isActive ? 'text-violet-300' : 'text-slate-500'}`}>
                  {total}e{'\u207B'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
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
      <h2 className="text-2xl font-bold text-white mb-2">Hydrogen Atom Energy Levels</h2>
      <p className="text-slate-400 mb-6">
        Calculate electron transitions, emission wavelengths, and explore spectral series.
        E{'\u2099'} = -13.6/n{'\u00B2'} eV
      </p>

      {/* Energy level diagram */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Energy Level Diagram</h4>
        <div className="relative" style={{ height: '200px' }}>
          {energyLevels.map((level) => {
            const yPct = ((1 - (1 / (level.n * level.n))) / 1) * 100
            return (
              <div
                key={level.n}
                className="absolute left-0 right-0 flex items-center gap-3"
                style={{ top: `${100 - yPct - 5}%` }}
              >
                <span className="text-xs text-slate-500 w-8 text-right">n={level.n}</span>
                <div className="flex-1 h-px bg-violet-500/40 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-violet-300 font-mono">
                    {level.energy.toFixed(2)} eV
                  </div>
                </div>
              </div>
            )
          })}
          {/* n=infinity */}
          <div className="absolute left-0 right-0 flex items-center gap-3" style={{ top: '0%' }}>
            <span className="text-xs text-slate-500 w-8 text-right">n={'\u221E'}</span>
            <div className="flex-1 h-px bg-white/20 border-dashed relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                0.00 eV
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowSeries('single')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            showSeries === 'single' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Single Transition
        </button>
        <button
          onClick={() => calculateSeries('lyman')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            showSeries === 'lyman' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Lyman Series (UV)
        </button>
        <button
          onClick={() => calculateSeries('balmer')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            showSeries === 'balmer' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Balmer Series (Visible)
        </button>
        <button
          onClick={() => calculateSeries('paschen')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            showSeries === 'paschen' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
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
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 font-semibold text-white transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25"
          >
            Calculate Transition
          </button>

          {error && <ErrorBanner message={error} />}

          {singleResult && (
            <ResultCard title={`Transition: n=${singleResult.nInitial} \u2192 n=${singleResult.nFinal}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Energy</p>
                  <p className="text-2xl font-bold font-mono text-violet-300">{singleResult.energyEV.toFixed(4)} eV</p>
                  <p className="text-xs text-slate-500">{formatSci(singleResult.energyJ)} J</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Wavelength</p>
                  <p className="text-2xl font-bold font-mono text-violet-300">{singleResult.wavelengthNm.toFixed(2)} nm</p>
                  {singleResult.isVisible && (
                    <div
                      className="mt-1 h-3 w-full rounded-full"
                      style={{ backgroundColor: wavelengthToColor(singleResult.wavelengthNm) }}
                    />
                  )}
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Frequency</p>
                  <p className="text-xl font-bold font-mono text-white">{formatSci(singleResult.frequencyHz)} Hz</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Series</p>
                  <p className="text-xl font-bold text-white">{singleResult.seriesName}</p>
                  <p className="text-xs text-slate-500">{singleResult.isVisible ? 'Visible light' : 'Not visible'}</p>
                </div>
              </div>
            </ResultCard>
          )}
        </>
      )}

      {showSeries !== 'single' && transitions.length > 0 && (
        <ResultCard title={`${showSeries.charAt(0).toUpperCase() + showSeries.slice(1)} Series`}>
          {/* Emission lines visualization */}
          {showSeries === 'balmer' && (
            <div className="mb-4 rounded-xl bg-black p-3">
              <p className="text-xs text-slate-400 mb-2">Visible Emission Lines</p>
              <div className="relative h-8 rounded bg-gray-950">
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
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 px-2">Transition</th>
                  <th className="text-right py-2 px-2">Energy (eV)</th>
                  <th className="text-right py-2 px-2">{'\u03BB'} (nm)</th>
                  <th className="text-right py-2 px-2">Frequency (Hz)</th>
                  <th className="text-center py-2 px-2">Color</th>
                </tr>
              </thead>
              <tbody>
                {transitions.map((t, i) => (
                  <tr key={i} className="border-b border-white/5 text-slate-300">
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
                        <span className="text-xs text-slate-500">
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
      <h2 className="text-2xl font-bold text-white mb-2">de Broglie Wavelength</h2>
      <p className="text-slate-400 mb-6">
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
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 font-semibold text-white transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25"
      >
        Calculate Wavelength
      </button>

      {error && <ErrorBanner message={error} />}

      {result !== null && (
        <ResultCard title="de Broglie Wavelength">
          <div className="text-center mb-4">
            <p className="text-sm text-violet-300 mb-2">{'\u03BB'} = h / (m {'\u00D7'} v)</p>
            <p className="text-4xl font-bold text-white font-mono">
              {formatSci(result)} <span className="text-2xl text-violet-300">m</span>
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-400">In pm</p>
              <p className="text-lg font-mono text-white">{formatSci(result * 1e12)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-400">In nm</p>
              <p className="text-lg font-mono text-white">{formatSci(result * 1e9)}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-400">In {'\u00C5'} (angstrom)</p>
              <p className="text-lg font-mono text-white">{formatSci(result * 1e10)}</p>
            </div>
          </div>

          {/* Comparison */}
          <div className="mt-4 rounded-xl bg-white/5 p-4">
            <p className="text-sm text-slate-300 mb-2">Scale Comparison</p>
            <div className="space-y-2 text-xs text-slate-400">
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
              <div className="flex justify-between font-medium text-violet-300">
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
      <h2 className="text-2xl font-bold text-white mb-2">Photon Energy Calculator</h2>
      <p className="text-slate-400 mb-6">
        Calculate photon energy from wavelength using E = hc/{'\u03BB'}.
      </p>

      <InputField label="Wavelength (\u03BB)" value={wavelength} onChange={setWavelength} placeholder="e.g., 500" unit="nm" />

      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setWavelength(p.wl)}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/20 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 font-semibold text-white transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-lg hover:shadow-violet-500/25"
      >
        Calculate Energy
      </button>

      {error && <ErrorBanner message={error} />}

      {result && (
        <ResultCard title="Photon Energy">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Energy</p>
              <p className="text-2xl font-bold font-mono text-violet-300">{formatSci(result.energyEV)} eV</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Energy (per mole)</p>
              <p className="text-2xl font-bold font-mono text-violet-300">{formatSci(result.energyKJmol)} kJ/mol</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Frequency</p>
              <p className="text-xl font-bold font-mono text-white">{formatSci(result.frequencyHz)} Hz</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Energy (Joules)</p>
              <p className="text-xl font-bold font-mono text-white">{formatSci(result.energyJ)} J</p>
            </div>
          </div>

          {/* Visible color indicator */}
          {result.wavelengthNm >= 380 && result.wavelengthNm <= 750 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-4">
              <div
                className="w-12 h-12 rounded-xl shadow-lg"
                style={{
                  backgroundColor: wavelengthToColor(result.wavelengthNm),
                  boxShadow: `0 0 20px ${wavelengthToColor(result.wavelengthNm)}`,
                }}
              />
              <div>
                <p className="text-sm text-slate-300">Visible Color</p>
                <p className="text-lg font-bold text-white">{result.region}</p>
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
      <h2 className="text-2xl font-bold text-white mb-2">Bohr Model Calculator</h2>
      <p className="text-slate-400 mb-6">
        Calculate orbital radii for hydrogen-like atoms.
        r{'\u2099'} = n{'\u00B2'} {'\u00D7'} a{'\u2080'} / Z, where a{'\u2080'} = 52.9 pm.
      </p>

      {/* Atom selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">Select Atom/Ion</label>
        <div className="flex gap-2">
          {atoms.map((atom) => (
            <button
              key={atom.Z}
              onClick={() => setSelectedZ(atom.Z)}
              className={`rounded-xl px-4 py-3 text-center transition-all ${
                selectedZ === atom.Z
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              <p className="font-bold text-lg">{atom.name}</p>
              <p className="text-xs opacity-75">{atom.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Bohr model */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Bohr Model (not to scale)</h4>
        <div className="relative mx-auto" style={{ width: '280px', height: '280px' }}>
          {/* Orbits */}
          {levels.map((level) => {
            const size = 40 + (level.n / maxN) * 220
            return (
              <div
                key={level.n}
                className="absolute rounded-full border border-violet-500/30"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  top: `${140 - size / 2}px`,
                  left: `${140 - size / 2}px`,
                }}
              >
                {/* Electron dot */}
                <div
                  className="absolute w-2.5 h-2.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50"
                  style={{
                    top: '-5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
                {/* Label */}
                <span
                  className="absolute text-[10px] text-violet-300 font-mono"
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
            className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/50"
            style={{ top: '127px', left: '127px' }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
              {selectedZ > 1 ? `+${selectedZ}` : '+'}
            </span>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">
          Orbital Data for Z = {selectedZ} ({atoms.find((a) => a.Z === selectedZ)?.label})
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/10">
                <th className="text-left py-2 px-2">n</th>
                <th className="text-right py-2 px-2">Radius (pm)</th>
                <th className="text-right py-2 px-2">Radius ({'\u00C5'})</th>
                <th className="text-right py-2 px-2">Energy (eV)</th>
                <th className="text-right py-2 px-2">Radius / a{'\u2080'}</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => (
                <tr key={level.n} className="border-b border-white/5 text-slate-300">
                  <td className="py-2 px-2 font-mono font-bold text-violet-300">{level.n}</td>
                  <td className="text-right px-2 font-mono">{level.radius.toFixed(2)}</td>
                  <td className="text-right px-2 font-mono">{(level.radius / 100).toFixed(4)}</td>
                  <td className="text-right px-2 font-mono">{level.energy.toFixed(4)}</td>
                  <td className="text-right px-2 font-mono">{(level.radius / 52.9177).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulas reference */}
      <div className="mt-4 rounded-xl bg-white/5 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Key Formulas</h4>
        <div className="space-y-1 text-xs font-mono text-slate-400">
          <p>r{'\u2099'} = n{'\u00B2'} {'\u00D7'} a{'\u2080'} / Z = n{'\u00B2'} {'\u00D7'} 52.9 pm / {selectedZ}</p>
          <p>E{'\u2099'} = -13.6 {'\u00D7'} Z{'\u00B2'} / n{'\u00B2'} = -13.6 {'\u00D7'} {selectedZ}{'\u00B2'} / n{'\u00B2'} eV</p>
          <p>a{'\u2080'} = 52.9177 pm (Bohr radius)</p>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-violet-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">VerChem</span>
            </h1>
          </Link>
          <Link href="/tools" className="text-slate-400 hover:text-violet-400 transition-colors font-medium text-sm">
            {'\u2190'} All Tools
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 mb-6">
            {'\u269B'} Quantum Mechanics &amp; Atomic Structure
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Quantum Chemistry
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
              Calculator
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Quantum numbers, orbital explorer, hydrogen atom spectra,
            de Broglie wavelength, photon energy, and Bohr model.
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
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
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
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-900/90 to-purple-900/20 p-6 md:p-8 shadow-2xl shadow-violet-500/10 backdrop-blur-sm">
            {renderTab()}
          </div>
        </div>
      </section>

      {/* Educational Info */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Understanding Quantum Chemistry</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Key concepts in quantum mechanics and atomic structure
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '\uD83C\uDFB2',
                title: 'Quantum Numbers',
                description: 'Four quantum numbers (n, l, m\u2097, m\u209B) uniquely describe each electron in an atom. No two electrons can share all four (Pauli Exclusion Principle).'
              },
              {
                icon: '\uD83C\uDF0A',
                title: 'Wave-Particle Duality',
                description: 'All matter exhibits both wave and particle properties. The de Broglie wavelength \u03BB = h/mv is significant only for subatomic particles.'
              },
              {
                icon: '\u269B',
                title: 'Bohr Model',
                description: 'Electrons orbit the nucleus at quantized energy levels. E\u2099 = -13.6/n\u00B2 eV for hydrogen. Predicts spectral lines accurately.'
              },
              {
                icon: '\uD83D\uDCA1',
                title: 'Photon Energy',
                description: 'Light consists of photons with energy E = hf = hc/\u03BB. Higher frequency (shorter wavelength) means higher energy.'
              },
              {
                icon: '\uD83D\uDD2C',
                title: 'Atomic Orbitals',
                description: 'Orbitals are probability distributions for finding electrons. s(sphere), p(dumbbell), d(clover), f(complex) shapes.'
              },
              {
                icon: '\uD83C\uDF08',
                title: 'Emission Spectra',
                description: 'When electrons drop to lower energy levels, they emit photons. The Balmer series (n\u21922) produces visible hydrogen lines.'
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-violet-500/30 transition-colors">
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
            <Link href="/tools/nuclear" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 px-6 py-3 font-medium text-white hover:from-amber-500 hover:to-yellow-500 transition-colors">
              Nuclear Chemistry {'\u2192'}
            </Link>
            <Link href="/tools/equation-balancer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors">
              Equation Balancer {'\u2192'}
            </Link>
            <Link href="/tools/ph-calculator" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors">
              pH Calculator {'\u2192'}
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
