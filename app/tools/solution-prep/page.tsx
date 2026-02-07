'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  solveDilution,
  calculateStockPrep,
  calculateSerialDilution,
  convertConcentration,
  calculateMixing,
  UNIT_LABELS,
  UNIT_SHORT_LABELS,
  type ConcentrationUnit,
  type DilutionInput,
  type DilutionResult,
  type StockPrepResult,
  type SerialDilutionResult,
  type UnitConversionResult,
  type MixingResult,
} from '@/lib/calculations/solution-prep'

// ============================================
// TYPES
// ============================================

type CalculatorMode = 'dilution' | 'stock' | 'serial' | 'convert' | 'mixing'

interface ModeInfo {
  id: CalculatorMode
  label: string
  icon: string
  description: string
}

// ============================================
// CONSTANTS
// ============================================

const MODES: ModeInfo[] = [
  { id: 'dilution', label: 'Dilution', icon: '\uD83E\uDDEA', description: 'C\u2081V\u2081 = C\u2082V\u2082' },
  { id: 'stock', label: 'Stock Prep', icon: '\u2697\uFE0F', description: 'Mass of solute needed' },
  { id: 'serial', label: 'Serial Dilution', icon: '\uD83D\uDD2C', description: 'Dilution series table' },
  { id: 'convert', label: 'Unit Converter', icon: '\uD83D\uDD04', description: 'Between concentration units' },
  { id: 'mixing', label: 'Mixing', icon: '\uD83E\uDDEB', description: 'Mix two solutions' },
]

const ALL_UNITS: ConcentrationUnit[] = [
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L',
  'pct_wv', 'pct_ww', 'pct_vv', 'N', 'ppm', 'ppb',
]

// ============================================
// QUICK EXAMPLES
// ============================================

interface QuickExample {
  label: string
  description: string
}

const DILUTION_EXAMPLES: (QuickExample & { c1: string; v1: string; c2: string; v2: string })[] = [
  { label: '10x dilution', description: '1 M stock to 0.1 M', c1: '1', v1: '', c2: '0.1', v2: '100' },
  { label: 'Buffer prep', description: '5 M NaCl to 0.15 M', c1: '5', v1: '', c2: '0.15', v2: '500' },
  { label: 'Acid dilution', description: '12 M HCl to 1 M', c1: '12', v1: '', c2: '1', v2: '250' },
]

const STOCK_EXAMPLES: (QuickExample & { conc: string; vol: string; mm: string; unit: ConcentrationUnit })[] = [
  { label: '1 M NaCl (1 L)', description: 'Common salt solution', conc: '1', vol: '1', mm: '58.44', unit: 'mol/L' },
  { label: '0.1 M NaOH (500 mL)', description: 'Dilute base', conc: '0.1', vol: '0.5', mm: '40', unit: 'mol/L' },
  { label: '10 mg/L std (1 L)', description: 'Analytical standard', conc: '10', vol: '1', mm: '100', unit: 'mg/L' },
]

const SERIAL_EXAMPLES: (QuickExample & { conc: string; factor: string; num: string; transfer: string })[] = [
  { label: 'Standard curve (1:10)', description: '6 dilutions', conc: '1000', factor: '10', num: '6', transfer: '1' },
  { label: 'Microbiology (1:2)', description: '8 two-fold', conc: '100', factor: '2', num: '8', transfer: '0.5' },
  { label: 'ELISA plate (1:3)', description: '7 three-fold', conc: '500', factor: '3', num: '7', transfer: '0.1' },
]

const MIXING_EXAMPLES: (QuickExample & { c1: string; v1: string; c2: string; v2: string })[] = [
  { label: 'Equal volumes', description: '1 M + 0.5 M, 50 mL each', c1: '1', v1: '50', c2: '0.5', v2: '50' },
  { label: 'Acid + water', description: '2 M acid + pure water', c1: '2', v1: '25', c2: '0', v2: '75' },
  { label: 'Buffer mixing', description: '0.2 M + 0.05 M', c1: '0.2', v1: '100', c2: '0.05', v2: '200' },
]

// ============================================
// HELPERS
// ============================================

function formatSci(n: number, decimals: number = 4): string {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 0.01 && abs < 1e6) {
    // Decide decimal places based on magnitude
    if (abs >= 100) return n.toFixed(2)
    if (abs >= 1) return n.toFixed(decimals)
    return n.toFixed(decimals + 2)
  }
  return n.toExponential(decimals)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SolutionPrepPage() {
  const [mode, setMode] = useState<CalculatorMode>('dilution')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <Link href="/tools" className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm">
            &larr; All Tools
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Solution Preparation Calculator
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dilutions, stock solutions, serial dilutions, unit conversions, and mixing calculations
            &mdash; all in one place.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl px-3 py-3 text-center transition-all border-2 ${
                mode === m.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
                  : 'border-border bg-card text-card-foreground hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <span className="text-xl block mb-1">{m.icon}</span>
              <span className="text-sm font-semibold block">{m.label}</span>
              <span className="text-xs text-muted-foreground block">{m.description}</span>
            </button>
          ))}
        </div>

        {/* Calculator Panel */}
        <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8 shadow-sm">
          {mode === 'dilution' && <DilutionCalculator />}
          {mode === 'stock' && <StockPrepCalculator />}
          {mode === 'serial' && <SerialDilutionCalculator />}
          {mode === 'convert' && <UnitConverterCalculator />}
          {mode === 'mixing' && <MixingCalculator />}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Explore more chemistry tools on VerChem
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/tools/ph-calculator"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 text-indigo-700 px-5 py-2.5 font-medium hover:bg-indigo-200 transition-colors text-sm"
            >
              pH Calculator &rarr;
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 text-indigo-700 px-5 py-2.5 font-medium hover:bg-indigo-200 transition-colors text-sm"
            >
              Stoichiometry &rarr;
            </Link>
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-100 text-indigo-700 px-5 py-2.5 font-medium hover:bg-indigo-200 transition-colors text-sm"
            >
              Molar Mass &rarr;
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-2.5 font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              All Tools &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================
// 1. DILUTION CALCULATOR
// ============================================

function DilutionCalculator() {
  const [c1, setC1] = useState('')
  const [v1, setV1] = useState('')
  const [c2, setC2] = useState('')
  const [v2, setV2] = useState('')
  const [result, setResult] = useState<DilutionResult | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const input: DilutionInput = {
      c1: c1.trim() !== '' ? parseFloat(c1) : undefined,
      v1: v1.trim() !== '' ? parseFloat(v1) : undefined,
      c2: c2.trim() !== '' ? parseFloat(c2) : undefined,
      v2: v2.trim() !== '' ? parseFloat(v2) : undefined,
    }

    // Check for NaN in provided values
    if (c1.trim() !== '' && isNaN(input.c1!)) { setError('C\u2081 is not a valid number.'); return }
    if (v1.trim() !== '' && isNaN(input.v1!)) { setError('V\u2081 is not a valid number.'); return }
    if (c2.trim() !== '' && isNaN(input.c2!)) { setError('C\u2082 is not a valid number.'); return }
    if (v2.trim() !== '' && isNaN(input.v2!)) { setError('V\u2082 is not a valid number.'); return }

    try {
      const res = solveDilution(input)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [c1, v1, c2, v2])

  const loadExample = useCallback((ex: typeof DILUTION_EXAMPLES[0]) => {
    setC1(ex.c1)
    setV1(ex.v1)
    setC2(ex.c2)
    setV2(ex.v2)
    setResult(null)
    setError('')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Dilution Calculator</h3>
        <p className="text-sm text-muted-foreground">
          C&#x2081;V&#x2081; = C&#x2082;V&#x2082; &mdash; leave one field blank to solve for it.
        </p>
      </div>

      {/* Quick Examples */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {DILUTION_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputField label="C\u2081 (conc.)" value={c1} onChange={setC1} placeholder="e.g. 1" highlight={result?.solvedFor === 'c1'} />
        <InputField label="V\u2081 (vol.)" value={v1} onChange={setV1} placeholder="e.g. 10" highlight={result?.solvedFor === 'v1'} />
        <InputField label="C\u2082 (conc.)" value={c2} onChange={setC2} placeholder="e.g. 0.1" highlight={result?.solvedFor === 'c2'} />
        <InputField label="V\u2082 (vol.)" value={v2} onChange={setV2} placeholder="e.g. 100" highlight={result?.solvedFor === 'v2'} />
      </div>

      <button onClick={handleCalculate} className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors">
        Calculate
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          <p className="text-sm text-muted-foreground mb-3">
            Solved for <span className="font-bold text-indigo-600">{formatSolvedLabel(result.solvedFor)}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ResultValue label="C\u2081" value={formatSci(result.c1)} highlight={result.solvedFor === 'c1'} />
            <ResultValue label="V\u2081" value={formatSci(result.v1)} highlight={result.solvedFor === 'v1'} />
            <ResultValue label="C\u2082" value={formatSci(result.c2)} highlight={result.solvedFor === 'c2'} />
            <ResultValue label="V\u2082" value={formatSci(result.v2)} highlight={result.solvedFor === 'v2'} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Verification: {formatSci(result.c1)} &times; {formatSci(result.v1)} = {formatSci(result.c1 * result.v1)} &nbsp;|&nbsp;
            {formatSci(result.c2)} &times; {formatSci(result.v2)} = {formatSci(result.c2 * result.v2)}
          </p>
        </ResultCard>
      )}
    </div>
  )
}

function formatSolvedLabel(key: string): string {
  switch (key) {
    case 'c1': return 'C\u2081 (initial concentration)'
    case 'v1': return 'V\u2081 (initial volume)'
    case 'c2': return 'C\u2082 (final concentration)'
    case 'v2': return 'V\u2082 (final volume)'
    default: return key
  }
}

// ============================================
// 2. STOCK PREPARATION CALCULATOR
// ============================================

function StockPrepCalculator() {
  const [conc, setConc] = useState('')
  const [vol, setVol] = useState('')
  const [mm, setMm] = useState('')
  const [unit, setUnit] = useState<ConcentrationUnit>('mol/L')
  const [result, setResult] = useState<StockPrepResult | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const cVal = parseFloat(conc)
    const vVal = parseFloat(vol)
    const mVal = parseFloat(mm)

    if (isNaN(cVal)) { setError('Concentration is not a valid number.'); return }
    if (isNaN(vVal)) { setError('Volume is not a valid number.'); return }
    if (isNaN(mVal)) { setError('Molar mass is not a valid number.'); return }

    try {
      const res = calculateStockPrep({
        targetConc: cVal,
        targetVolume: vVal,
        molarMass: mVal,
        unit,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [conc, vol, mm, unit])

  const loadExample = useCallback((ex: typeof STOCK_EXAMPLES[0]) => {
    setConc(ex.conc)
    setVol(ex.vol)
    setMm(ex.mm)
    setUnit(ex.unit)
    setResult(null)
    setError('')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Stock Solution Preparation</h3>
        <p className="text-sm text-muted-foreground">
          Calculate how much solute to weigh for a desired solution.
        </p>
      </div>

      {/* Quick Examples */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {STOCK_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Target Concentration
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={conc}
              onChange={(e) => setConc(e.target.value)}
              placeholder="e.g. 1"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono text-sm"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ConcentrationUnit)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {ALL_UNITS.map((u) => (
                <option key={u} value={u}>{UNIT_LABELS[u]}</option>
              ))}
            </select>
          </div>
        </div>
        <InputField label="Target Volume (L)" value={vol} onChange={setVol} placeholder="e.g. 1" />
        <InputField label="Molar Mass (g/mol)" value={mm} onChange={setMm} placeholder="e.g. 58.44" />
      </div>

      <button onClick={handleCalculate} className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors">
        Calculate
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Mass of solute needed</p>
            <p className="text-4xl font-bold text-indigo-600 font-mono">
              {formatSci(result.massNeeded)}
              <span className="text-lg text-muted-foreground ml-2">
                {unit === 'pct_vv' ? 'mL' : 'g'}
              </span>
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-2">Step-by-step</p>
            <div className="space-y-1">
              {result.steps.map((step, i) => (
                <p key={i} className={`text-sm ${step === '' ? 'h-2' : step.startsWith('Preparation') || step.startsWith('Note:') ? 'text-indigo-600 font-medium' : 'text-muted-foreground'}`}>
                  {step}
                </p>
              ))}
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================
// 3. SERIAL DILUTION CALCULATOR
// ============================================

function SerialDilutionCalculator() {
  const [conc, setConc] = useState('')
  const [factor, setFactor] = useState('')
  const [num, setNum] = useState('')
  const [transfer, setTransfer] = useState('')
  const [result, setResult] = useState<SerialDilutionResult | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const cVal = parseFloat(conc)
    const fVal = parseFloat(factor)
    const nVal = parseInt(num, 10)
    const tVal = parseFloat(transfer)

    if (isNaN(cVal)) { setError('Initial concentration is not a valid number.'); return }
    if (isNaN(fVal)) { setError('Dilution factor is not a valid number.'); return }
    if (isNaN(nVal)) { setError('Number of dilutions is not a valid number.'); return }
    if (isNaN(tVal)) { setError('Transfer volume is not a valid number.'); return }

    try {
      const res = calculateSerialDilution({
        initialConc: cVal,
        dilutionFactor: fVal,
        numDilutions: nVal,
        transferVolume: tVal,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [conc, factor, num, transfer])

  const loadExample = useCallback((ex: typeof SERIAL_EXAMPLES[0]) => {
    setConc(ex.conc)
    setFactor(ex.factor)
    setNum(ex.num)
    setTransfer(ex.transfer)
    setResult(null)
    setError('')
  }, [])

  // For the visual bar chart
  const maxConc = result ? result.steps[0].concentration : 1

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Serial Dilution Calculator</h3>
        <p className="text-sm text-muted-foreground">
          Generate a dilution series with volumes for each step.
        </p>
      </div>

      {/* Quick Examples */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {SERIAL_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InputField label="Initial Conc." value={conc} onChange={setConc} placeholder="e.g. 1000" />
        <InputField label="Dilution Factor" value={factor} onChange={setFactor} placeholder="e.g. 10" />
        <InputField label="# of Dilutions" value={num} onChange={setNum} placeholder="e.g. 6" />
        <InputField label="Transfer Vol. (mL)" value={transfer} onChange={setTransfer} placeholder="e.g. 1" />
      </div>

      <button onClick={handleCalculate} className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors">
        Calculate
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          {/* Visual bar chart */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-foreground mb-3">Concentration Gradient</p>
            <div className="flex items-end gap-1 h-24">
              {result.steps.map((s) => {
                const pct = maxConc > 0 ? (s.concentration / maxConc) * 100 : 0
                return (
                  <div key={s.step} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{s.step === 0 ? 'Stock' : `D${s.step}`}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Data table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Step</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">Concentration</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">Transfer (mL)</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">Diluent (mL)</th>
                  <th className="text-right py-2 px-2 font-semibold text-foreground">Total (mL)</th>
                </tr>
              </thead>
              <tbody>
                {result.steps.map((s) => (
                  <tr key={s.step} className="border-b border-border/50 hover:bg-indigo-50/50 transition-colors">
                    <td className="py-2 px-2 font-medium text-foreground">
                      {s.step === 0 ? 'Stock' : `Dilution ${s.step}`}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-indigo-600">
                      {formatSci(s.concentration)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                      {s.step === 0 ? '\u2014' : formatSci(result.steps[s.step - 1]?.transferVolume ?? 0, 2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                      {s.step === 0 ? '\u2014' : formatSci(s.diluentVolume, 2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                      {s.step === 0 ? '\u2014' : formatSci(s.totalVolume, 2)}
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

// ============================================
// 4. UNIT CONVERTER CALCULATOR
// ============================================

function UnitConverterCalculator() {
  const [value, setValue] = useState('')
  const [fromUnit, setFromUnit] = useState<ConcentrationUnit>('mol/L')
  const [toUnit, setToUnit] = useState<ConcentrationUnit>('g/L')
  const [molarMass, setMolarMass] = useState('')
  const [density, setDensity] = useState('1.0')
  const [equivalents, setEquivalents] = useState('1')
  const [result, setResult] = useState<UnitConversionResult | null>(null)
  const [error, setError] = useState('')

  const needsMM = useMemo(() => {
    const mmUnits: ConcentrationUnit[] = ['mol/L', 'mmol/L', 'N']
    return mmUnits.includes(fromUnit) || mmUnits.includes(toUnit)
  }, [fromUnit, toUnit])

  const needsDensity = useMemo(() => {
    const dUnits: ConcentrationUnit[] = ['pct_ww', 'pct_vv']
    return dUnits.includes(fromUnit) || dUnits.includes(toUnit)
  }, [fromUnit, toUnit])

  const needsEquivalents = useMemo(() => {
    return fromUnit === 'N' || toUnit === 'N'
  }, [fromUnit, toUnit])

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const vVal = parseFloat(value)
    if (isNaN(vVal)) { setError('Value is not a valid number.'); return }

    const mmVal = parseFloat(molarMass)
    const dVal = parseFloat(density)
    const eqVal = parseFloat(equivalents)

    if (needsMM && (isNaN(mmVal) || mmVal <= 0)) { setError('Molar mass is required and must be positive for this conversion.'); return }
    if (needsDensity && (isNaN(dVal) || dVal <= 0)) { setError('Density is required and must be positive for this conversion.'); return }

    try {
      const res = convertConcentration({
        value: vVal,
        fromUnit,
        toUnit,
        molarMass: isNaN(mmVal) ? undefined : mmVal,
        density: isNaN(dVal) ? undefined : dVal,
        equivalents: isNaN(eqVal) ? 1 : eqVal,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion error')
    }
  }, [value, fromUnit, toUnit, molarMass, density, equivalents, needsMM, needsDensity])

  const handleSwap = useCallback(() => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
    setResult(null)
  }, [fromUnit, toUnit])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Concentration Unit Converter</h3>
        <p className="text-sm text-muted-foreground">
          Convert between 11 concentration units. Some conversions require molar mass or density.
        </p>
      </div>

      {/* From / To row */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Value</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 1"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono text-sm"
            />
            <select
              value={fromUnit}
              onChange={(e) => { setFromUnit(e.target.value as ConcentrationUnit); setResult(null) }}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {ALL_UNITS.map((u) => (
                <option key={u} value={u}>{UNIT_LABELS[u]}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSwap}
          className="self-end mb-1 rounded-lg border border-border bg-background p-2.5 text-muted-foreground hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          title="Swap units"
        >
          &#x21C4;
        </button>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Convert to</label>
          <select
            value={toUnit}
            onChange={(e) => { setToUnit(e.target.value as ConcentrationUnit); setResult(null) }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {ALL_UNITS.map((u) => (
              <option key={u} value={u}>{UNIT_LABELS[u]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional extra fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {needsMM && (
          <InputField label="Molar Mass (g/mol)" value={molarMass} onChange={setMolarMass} placeholder="e.g. 58.44" />
        )}
        {needsDensity && (
          <InputField label="Solution Density (g/mL)" value={density} onChange={setDensity} placeholder="e.g. 1.0" />
        )}
        {needsEquivalents && (
          <InputField label="Equivalents Factor" value={equivalents} onChange={setEquivalents} placeholder="e.g. 1" />
        )}
      </div>

      <button onClick={handleCalculate} className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors">
        Convert
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">From</p>
              <p className="text-2xl font-bold text-foreground font-mono">{formatSci(result.value)}</p>
              <p className="text-sm font-medium text-indigo-600">{UNIT_SHORT_LABELS[result.fromUnit]}</p>
            </div>
            <div className="text-2xl text-muted-foreground">=</div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">To</p>
              <p className="text-2xl font-bold text-indigo-600 font-mono">{formatSci(result.convertedValue)}</p>
              <p className="text-sm font-medium text-indigo-600">{UNIT_SHORT_LABELS[result.toUnit]}</p>
            </div>
          </div>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================
// 5. MIXING CALCULATOR
// ============================================

function MixingCalculator() {
  const [c1, setC1] = useState('')
  const [v1, setV1] = useState('')
  const [c2, setC2] = useState('')
  const [v2, setV2] = useState('')
  const [result, setResult] = useState<MixingResult | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const c1Val = parseFloat(c1)
    const v1Val = parseFloat(v1)
    const c2Val = parseFloat(c2)
    const v2Val = parseFloat(v2)

    if (isNaN(c1Val)) { setError('C\u2081 is not a valid number.'); return }
    if (isNaN(v1Val)) { setError('V\u2081 is not a valid number.'); return }
    if (isNaN(c2Val)) { setError('C\u2082 is not a valid number.'); return }
    if (isNaN(v2Val)) { setError('V\u2082 is not a valid number.'); return }

    try {
      const res = calculateMixing({ c1: c1Val, v1: v1Val, c2: c2Val, v2: v2Val })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [c1, v1, c2, v2])

  const loadExample = useCallback((ex: typeof MIXING_EXAMPLES[0]) => {
    setC1(ex.c1)
    setV1(ex.v1)
    setC2(ex.c2)
    setV2(ex.v2)
    setResult(null)
    setError('')
  }, [])

  // Visualization data
  const c1Val = parseFloat(c1) || 0
  const v1Val = parseFloat(v1) || 0
  const c2Val = parseFloat(c2) || 0
  const v2Val = parseFloat(v2) || 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Mixing Solutions</h3>
        <p className="text-sm text-muted-foreground">
          Calculate the final concentration when two solutions of the same solute are mixed.
        </p>
      </div>

      {/* Quick Examples */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {MIXING_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => loadExample(ex)}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs in two groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
          <p className="text-sm font-semibold text-indigo-700">Solution 1</p>
          <InputField label="Concentration (C\u2081)" value={c1} onChange={setC1} placeholder="e.g. 1" />
          <InputField label="Volume (V\u2081)" value={v1} onChange={setV1} placeholder="e.g. 50" />
        </div>
        <div className="space-y-3 p-4 rounded-xl border border-violet-200 bg-violet-50/50">
          <p className="text-sm font-semibold text-violet-700">Solution 2</p>
          <InputField label="Concentration (C\u2082)" value={c2} onChange={setC2} placeholder="e.g. 0.5" />
          <InputField label="Volume (V\u2082)" value={v2} onChange={setV2} placeholder="e.g. 50" />
        </div>
      </div>

      <button onClick={handleCalculate} className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors">
        Calculate
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          {/* Before / After visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4">
            {/* Before */}
            <div className="flex gap-3 justify-center">
              <BeakerVis label="Sol. 1" conc={c1Val} vol={v1Val} color="bg-indigo-400" maxConc={Math.max(c1Val, c2Val, result.finalConc)} maxVol={result.finalVolume} />
              <div className="self-center text-muted-foreground text-xl">+</div>
              <BeakerVis label="Sol. 2" conc={c2Val} vol={v2Val} color="bg-violet-400" maxConc={Math.max(c1Val, c2Val, result.finalConc)} maxVol={result.finalVolume} />
            </div>

            <div className="text-2xl text-muted-foreground text-center">&rarr;</div>

            {/* After */}
            <div className="flex justify-center">
              <BeakerVis label="Mixed" conc={result.finalConc} vol={result.finalVolume} color="bg-emerald-400" maxConc={Math.max(c1Val, c2Val, result.finalConc)} maxVol={result.finalVolume} />
            </div>
          </div>

          {/* Numeric result */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Final Concentration</p>
              <p className="text-3xl font-bold text-indigo-600 font-mono">{formatSci(result.finalConc)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Final Volume</p>
              <p className="text-3xl font-bold text-foreground font-mono">{formatSci(result.finalVolume, 2)}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            C<sub>f</sub> = (C&#x2081; &times; V&#x2081; + C&#x2082; &times; V&#x2082;) / (V&#x2081; + V&#x2082;)
            = ({formatSci(c1Val)} &times; {formatSci(v1Val, 2)} + {formatSci(c2Val)} &times; {formatSci(v2Val, 2)}) / {formatSci(result.finalVolume, 2)}
            = {formatSci(result.finalConc)}
          </p>
        </ResultCard>
      )}
    </div>
  )
}

// ============================================
// SHARED UI COMPONENTS
// ============================================

function InputField({
  label,
  value,
  onChange,
  placeholder,
  highlight = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  highlight?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
          highlight
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
            : 'border-border bg-background text-foreground focus:border-indigo-500 focus:ring-indigo-200'
        }`}
      />
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-5">
      {children}
    </div>
  )
}

function ResultValue({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div className={`text-center rounded-lg p-3 ${highlight ? 'bg-indigo-100 border border-indigo-300' : 'bg-background border border-border'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${highlight ? 'text-indigo-600' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function BeakerVis({
  label,
  conc,
  vol,
  color,
  maxConc,
  maxVol,
}: {
  label: string
  conc: number
  vol: number
  color: string
  maxConc: number
  maxVol: number
}) {
  const fillHeight = maxVol > 0 ? Math.max((vol / maxVol) * 100, 5) : 10
  const opacity = maxConc > 0 ? Math.max(conc / maxConc, 0.15) : 0.3

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative w-14 h-20 border-2 border-slate-300 rounded-b-lg overflow-hidden bg-white">
        <div
          className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${color}`}
          style={{ height: `${fillHeight}%`, opacity }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground font-mono">{formatSci(conc, 2)}</span>
      <span className="text-[10px] text-muted-foreground">{formatSci(vol, 1)} vol</span>
    </div>
  )
}
