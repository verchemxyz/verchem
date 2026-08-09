'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  CalcShell,
  Card,
  Button,
  ModeGrid,
  ModeButton,
} from '@/components/lab'
import {
  solveDilution,
  calculateStockPrep,
  calculateSerialDilution,
  convertConcentration,
  calculateMixing,
  getConcentrationConversionRequirements,
  UNIT_LABELS,
  UNIT_SHORT_LABELS,
  type ConcentrationUnit,
  type DilutionInput,
  type DilutionResult,
  type StockPrepResult,
  type SerialDilutionResult,
  type UnitConversionResult,
  type MixingResult,
  type MixingConcentrationUnit,
  type MixingVolumeBasis,
  type MixingVolumeUnit,
} from '@/lib/calculations/solution-prep'

// ============================================
// TYPES
// ============================================

type CalculatorMode = 'dilution' | 'stock' | 'serial' | 'convert' | 'mixing'

interface ModeInfo {
  id: CalculatorMode
  label: string
  description: string
}

// ============================================
// CONSTANTS
// ============================================

const MODES: ModeInfo[] = [
  { id: 'dilution', label: 'Dilution', description: 'C\u2081V\u2081 = C\u2082V\u2082' },
  { id: 'stock', label: 'Stock Prep', description: 'Reagent amount needed' },
  { id: 'serial', label: 'Serial Dilution', description: 'Dilution series table' },
  { id: 'convert', label: 'Unit Converter', description: 'Between concentration units' },
  { id: 'mixing', label: 'Mixing', description: 'Mix two solutions' },
]

const ALL_UNITS: ConcentrationUnit[] = [
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L',
  'pct_wv', 'pct_ww', 'pct_vv', 'N', 'ppm', 'ppb',
]

const MIXING_UNITS: MixingConcentrationUnit[] = [
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L', 'pct_wv', 'N',
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

const STOCK_EXAMPLES: (QuickExample & {
  conc: string
  vol: string
  mm: string
  unit: ConcentrationUnit
  reagentForm: string
})[] = [
  { label: '1 M NaCl (1 L)', description: 'Anhydrous reagent', conc: '1', vol: '1', mm: '58.44', unit: 'mol/L', reagentForm: 'NaCl (anhydrous)' },
  { label: '0.1 M NaOH (500 mL)', description: 'Declared reagent form', conc: '0.1', vol: '0.5', mm: '40', unit: 'mol/L', reagentForm: 'NaOH (anhydrous)' },
  { label: '10 mg/L std (1 L)', description: 'Mass concentration', conc: '10', vol: '1', mm: '', unit: 'mg/L', reagentForm: 'Certified analyte standard' },
]

const SERIAL_EXAMPLES: (QuickExample & { conc: string; factor: string; num: string; transfer: string })[] = [
  { label: 'Standard curve (1:10)', description: '6 dilutions', conc: '1000', factor: '10', num: '6', transfer: '1' },
  { label: 'Microbiology (1:2)', description: '8 two-fold', conc: '100', factor: '2', num: '8', transfer: '0.5' },
  { label: 'ELISA plate (1:3)', description: '7 three-fold', conc: '500', factor: '3', num: '7', transfer: '0.1' },
]

const MIXING_EXAMPLES: (QuickExample & {
  c1: string
  v1: string
  c2: string
  v2: string
  finalVolume: string
  soluteIdentity: string
  concentrationUnit: MixingConcentrationUnit
  volumeUnit: MixingVolumeUnit
})[] = [
  { label: 'Measured equal volumes', description: 'NaCl, final volume measured', c1: '1', v1: '50', c2: '0.5', v2: '50', finalVolume: '100', soluteIdentity: 'NaCl', concentrationUnit: 'mol/L', volumeUnit: 'mL' },
  { label: 'Measured dilution', description: 'Same NaCl analyte, 100 mL final', c1: '2', v1: '25', c2: '0', v2: '75', finalVolume: '100', soluteIdentity: 'NaCl', concentrationUnit: 'mol/L', volumeUnit: 'mL' },
  { label: 'Observed contraction', description: 'Uses measured 299.7 mL final', c1: '0.2', v1: '100', c2: '0.05', v2: '200', finalVolume: '299.7', soluteIdentity: 'Analyte A', concentrationUnit: 'mol/L', volumeUnit: 'mL' },
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
    <CalcShell
      eyebrow="Lab & practical · 5 calculators"
      title="Solution Preparation Calculator"
      subtitle="Dilutions, stock solutions, serial dilutions, unit conversions, and mixing calculations — all in one place."
      backHref="/tools"
      backLabel="All tools"
    >
      {/* Mode Selector */}
      <Card className="p-6">
        <ModeGrid>
          {MODES.map((m) => (
            <ModeButton
              key={m.id}
              active={mode === m.id}
              onClick={() => setMode(m.id)}
              title={m.label}
              description={m.description}
            />
          ))}
        </ModeGrid>
      </Card>

      {/* Calculator Panel */}
      <Card className="p-6 sm:p-8">
        {mode === 'dilution' && <DilutionCalculator />}
        {mode === 'stock' && <StockPrepCalculator />}
        {mode === 'serial' && <SerialDilutionCalculator />}
        {mode === 'convert' && <UnitConverterCalculator />}
        {mode === 'mixing' && <MixingCalculator />}
      </Card>
    </CalcShell>
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
              className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
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

      <Button onClick={handleCalculate} className="w-full sm:w-auto">
        Calculate
      </Button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          <p className="text-sm text-muted-foreground mb-3">
            Solved for <span className="font-bold text-primary-600">{formatSolvedLabel(result.solvedFor)}</span>
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
  const [solutionDensityInput, setSolutionDensityInput] = useState('')
  const [eqFactor, setEqFactor] = useState('')
  const [reagentPurity, setReagentPurity] = useState('100')
  const [reagentForm, setReagentForm] = useState('')
  const [solvent, setSolvent] = useState('water')
  const [temperatureC, setTemperatureC] = useState('20')
  const [result, setResult] = useState<StockPrepResult | null>(null)
  const [error, setError] = useState('')

  const needsMolarMass = unit === 'mol/L' || unit === 'mmol/L' || unit === 'N'
  const needsDensity = unit === 'pct_ww' || unit === 'ppm' || unit === 'ppb'
  const needsEqFactor = unit === 'N'
  const purityBasis = unit === 'pct_vv' ? 'volume' : 'mass'
  const isNeatMaterial =
    (unit === 'pct_vv' && Number(conc) === 100) ||
    (unit === 'pct_ww' && Number(conc) === 100) ||
    (unit === 'ppm' && Number(conc) === 1e6) ||
    (unit === 'ppb' && Number(conc) === 1e9)

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const cVal = Number(conc)
    const vVal = Number(vol)
    const mVal = mm.trim() === '' ? undefined : Number(mm)
    const purityVal = Number(reagentPurity)
    const temperatureVal = Number(temperatureC)

    if (!Number.isFinite(cVal)) { setError('Concentration is not a valid finite number.'); return }
    if (!Number.isFinite(vVal)) { setError('Volume is not a valid finite number.'); return }
    if (needsMolarMass && (mVal === undefined || !Number.isFinite(mVal) || mVal <= 0)) { setError('Molar mass of the exact reagent form is required and must be positive.'); return }
    if (!Number.isFinite(purityVal) || purityVal <= 0 || purityVal > 100) { setError('Reagent assay/purity must be greater than 0% and no more than 100%.'); return }
    if (reagentForm.trim() === '') { setError('Enter the exact reagent form, including hydrate or solvate state.'); return }
    if (!isNeatMaterial && solvent.trim() === '') { setError('Enter the solvent identity; it is not assumed to be water.'); return }
    if (!Number.isFinite(temperatureVal) || temperatureVal <= -273.15) { setError('Preparation temperature must be finite and above absolute zero.'); return }

    let solutionDensity: number | undefined
    if (needsDensity) {
      const dVal = Number(solutionDensityInput)
      if (!Number.isFinite(dVal) || dVal <= 0) { setError('Measured solution density is required and must be positive for this mass-fraction calculation.'); return }
      solutionDensity = dVal
    }

    let equivalentsFactor: number | undefined
    if (needsEqFactor) {
      const eVal = Number(eqFactor)
      if (!Number.isFinite(eVal) || eVal <= 0) { setError('Equivalents factor is required and must be positive for normality.'); return }
      equivalentsFactor = eVal
    }

    try {
      const res = calculateStockPrep({
        targetConc: cVal,
        targetVolume: vVal,
        molarMass: mVal,
        unit,
        solutionDensity,
        equivalentsFactor,
        reagentPurityPercent: purityVal,
        reagentPurityBasis: purityBasis,
        reagentForm,
        solvent: isNeatMaterial ? 'none' : solvent,
        preparationTemperatureC: temperatureVal,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [
    conc, vol, mm, unit, solutionDensityInput, eqFactor, reagentPurity, reagentForm,
    solvent, temperatureC, needsMolarMass, needsDensity, needsEqFactor,
    purityBasis, isNeatMaterial,
  ])

  const loadExample = useCallback((ex: typeof STOCK_EXAMPLES[0]) => {
    setConc(ex.conc)
    setVol(ex.vol)
    setMm(ex.mm)
    setUnit(ex.unit)
    setReagentForm(ex.reagentForm)
    setReagentPurity('100')
    setSolvent('water')
    setTemperatureC('20')
    setSolutionDensityInput('')
    setEqFactor('')
    setResult(null)
    setError('')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-1">Stock Solution Preparation</h3>
        <p className="text-sm text-muted-foreground">
          Calculate how much declared reagent to take for a desired solution — as a mass to weigh, or a volume to measure.
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
              className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
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
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-mono text-sm"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ConcentrationUnit)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {ALL_UNITS.map((u) => (
                <option key={u} value={u}>{UNIT_LABELS[u]}</option>
              ))}
            </select>
          </div>
        </div>
        <InputField label="Target Volume (L)" value={vol} onChange={setVol} placeholder="e.g. 1" />
        <InputField
          label="Exact Reagent Form"
          value={reagentForm}
          onChange={setReagentForm}
          placeholder="e.g. CuSO₄·5H₂O"
        />
        {needsMolarMass && (
          <InputField
            label="Molar Mass of Exact Form (g/mol)"
            value={mm}
            onChange={setMm}
            placeholder="Include hydrate/solvate mass"
          />
        )}
        <InputField
          label={`Reagent Assay/Purity (% by ${purityBasis})`}
          value={reagentPurity}
          onChange={setReagentPurity}
          placeholder="e.g. 99.5"
        />
        {!isNeatMaterial && (
          <InputField
            label="Solvent Identity"
            value={solvent}
            onChange={setSolvent}
            placeholder="e.g. water, ethanol"
          />
        )}
        <InputField
          label="Preparation / Density Temperature (°C)"
          value={temperatureC}
          onChange={setTemperatureC}
          placeholder="Use the glassware/density reference temperature"
        />
        {needsDensity && (
          <div>
            <InputField
              label="Measured Solution Density (g/mL)"
              value={solutionDensityInput}
              onChange={setSolutionDensityInput}
              placeholder="Required at the stated temperature"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Required because {UNIT_SHORT_LABELS[unit]} is a mass fraction while the target amount is entered as a volume.
            </p>
          </div>
        )}
        {needsEqFactor && (
          <div>
            <InputField
              label="Equivalents Factor (eq/mol)"
              value={eqFactor}
              onChange={setEqFactor}
              placeholder="Required for the stated reaction/context"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Normality depends on the reaction. The engine never defaults this factor to 1.
            </p>
          </div>
        )}
      </div>

      <Button onClick={handleCalculate} className="w-full sm:w-auto">
        Calculate
      </Button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              {result.measureBy === 'mass' ? 'Mass of reagent to weigh' : 'Volume of liquid reagent to measure'}
            </p>
            <p className="text-4xl font-bold text-primary-600 font-mono">
              {formatSci(result.amount)}
              <span className="text-lg text-muted-foreground ml-2">{result.amountUnit}</span>
            </p>
            {result.measureBy === 'volume' && (
              <p className="mt-2 text-xs font-semibold text-warning-strong">
                Measure this volume — do not weigh it.
              </p>
            )}
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-2">Step-by-step</p>
            <div className="space-y-1">
              {result.steps.map((step, i) => (
                <p
                  key={i}
                  className={`text-sm ${
                    step === ''
                      ? 'h-2'
                      : step.startsWith('Model scope') || step.startsWith('•')
                        ? 'text-warning-strong font-medium'
                        : step.startsWith('Preparation') || step.startsWith('Note:')
                          ? 'text-primary-600 font-medium'
                          : 'text-muted-foreground'
                  }`}
                >
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
              className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
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

      <Button onClick={handleCalculate} className="w-full sm:w-auto">
        Calculate
      </Button>

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
                      className="w-full rounded-t bg-primary-500 transition-all"
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
                  <tr key={s.step} className="border-b border-border/50 hover:bg-muted transition-colors">
                    <td className="py-2 px-2 font-medium text-foreground">
                      {s.step === 0 ? 'Stock' : `Dilution ${s.step}`}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-primary-600">
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
  const [soluteDensity, setSoluteDensity] = useState('')
  const [solutionDensity, setSolutionDensity] = useState('')
  const [densityTemperatureC, setDensityTemperatureC] = useState('20')
  const [equivalents, setEquivalents] = useState('')
  const [result, setResult] = useState<UnitConversionResult | null>(null)
  const [error, setError] = useState('')

  const requirements = useMemo(() => {
    return getConcentrationConversionRequirements(fromUnit, toUnit)
  }, [fromUnit, toUnit])

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const vVal = Number(value)
    if (!Number.isFinite(vVal)) { setError('Value is not a valid finite number.'); return }

    const mmVal = molarMass.trim() === '' ? undefined : Number(molarMass)
    const soluteDensityVal = soluteDensity.trim() === '' ? undefined : Number(soluteDensity)
    const solutionDensityVal = solutionDensity.trim() === '' ? undefined : Number(solutionDensity)
    const densityTemperatureVal = densityTemperatureC.trim() === '' ? undefined : Number(densityTemperatureC)
    const eqVal = equivalents.trim() === '' ? undefined : Number(equivalents)

    if (requirements.molarMass && (mmVal === undefined || !Number.isFinite(mmVal) || mmVal <= 0)) { setError('Molar mass is required and must be positive to bridge amount and mass bases.'); return }
    if (requirements.soluteDensity && (soluteDensityVal === undefined || !Number.isFinite(soluteDensityVal) || soluteDensityVal <= 0)) { setError('Pure solute density is required and must be positive for % v/v.'); return }
    if (requirements.solutionDensity && (solutionDensityVal === undefined || !Number.isFinite(solutionDensityVal) || solutionDensityVal <= 0)) { setError('Complete solution density is required and must be positive for mass fraction.'); return }
    if (requirements.densityTemperature && (densityTemperatureVal === undefined || !Number.isFinite(densityTemperatureVal) || densityTemperatureVal <= -273.15)) { setError('Density temperature is required and must be above absolute zero.'); return }
    if (requirements.equivalents && (eqVal === undefined || !Number.isFinite(eqVal) || eqVal <= 0)) { setError('Equivalents factor is required and must be positive for normality.'); return }

    try {
      const res = convertConcentration({
        value: vVal,
        fromUnit,
        toUnit,
        molarMass: mmVal,
        soluteDensity: soluteDensityVal,
        solutionDensity: solutionDensityVal,
        densityTemperatureC: densityTemperatureVal,
        equivalents: eqVal,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion error')
    }
  }, [
    value, fromUnit, toUnit, molarMass, soluteDensity, solutionDensity,
    densityTemperatureC, equivalents, requirements,
  ])

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
          Convert between 11 units without silently treating mass-fraction ppm/ppb as mg/L/µg/L.
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
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-mono text-sm"
            />
            <select
              value={fromUnit}
              onChange={(e) => { setFromUnit(e.target.value as ConcentrationUnit); setResult(null) }}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {ALL_UNITS.map((u) => (
                <option key={u} value={u}>{UNIT_LABELS[u]}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSwap}
          className="self-end mb-1 rounded-lg border border-border bg-background p-2.5 text-muted-foreground hover:text-primary-600 hover:border-primary-500/40 transition-colors"
          title="Swap units"
        >
          &#x21C4;
        </button>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Convert to</label>
          <select
            value={toUnit}
            onChange={(e) => { setToUnit(e.target.value as ConcentrationUnit); setResult(null) }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {ALL_UNITS.map((u) => (
              <option key={u} value={u}>{UNIT_LABELS[u]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional extra fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {requirements.molarMass && (
          <InputField label="Molar Mass (g/mol)" value={molarMass} onChange={setMolarMass} placeholder="e.g. 58.44" />
        )}
        {requirements.soluteDensity && (
          <div>
            <InputField label="Pure Solute Density (g/mL)" value={soluteDensity} onChange={setSoluteDensity} placeholder="e.g. ethanol 0.789" />
            <p className="mt-1 text-xs text-muted-foreground">% v/v measures solute volume, so this converts that volume to solute mass.</p>
          </div>
        )}
        {requirements.solutionDensity && (
          <div>
            <InputField label="Complete Solution Density (g/mL)" value={solutionDensity} onChange={setSolutionDensity} placeholder="e.g. 0.984" />
            <p className="mt-1 text-xs text-muted-foreground">% w/w and ppm/ppb are mass fractions, so this converts total solution volume to mass.</p>
          </div>
        )}
        {requirements.densityTemperature && (
          <InputField label="Density Temperature (°C)" value={densityTemperatureC} onChange={setDensityTemperatureC} placeholder="e.g. 20" />
        )}
        {requirements.equivalents && (
          <InputField label="Equivalents Factor (eq/mol)" value={equivalents} onChange={setEquivalents} placeholder="Required for the reaction/context" />
        )}
      </div>

      <Button onClick={handleCalculate} className="w-full sm:w-auto">
        Convert
      </Button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">From</p>
              <p className="text-2xl font-bold text-foreground font-mono">{formatSci(result.value)}</p>
              <p className="text-sm font-medium text-primary-600">{UNIT_SHORT_LABELS[result.fromUnit]}</p>
            </div>
            <div className="text-2xl text-muted-foreground">=</div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">To</p>
              <p className="text-2xl font-bold text-primary-600 font-mono">{formatSci(result.convertedValue)}</p>
              <p className="text-sm font-medium text-primary-600">{UNIT_SHORT_LABELS[result.toUnit]}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground space-y-1">
            <p>
              Basis: {result.model.fromBasis} → {result.model.toBasis}. ppm/ppb are exact mass fractions (mg/kg and µg/kg).
            </p>
            {result.assumptions.map((assumption) => (
              <p key={assumption} className="text-warning-strong">{assumption}</p>
            ))}
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
  const [soluteIdentity, setSoluteIdentity] = useState('')
  const [concentrationUnit, setConcentrationUnit] = useState<MixingConcentrationUnit>('mol/L')
  const [volumeUnit, setVolumeUnit] = useState<MixingVolumeUnit>('mL')
  const [normalityContext, setNormalityContext] = useState('')
  const [volumeBasis, setVolumeBasis] = useState<MixingVolumeBasis>('measured-final')
  const [finalVolume, setFinalVolume] = useState('')
  const [noReactionOrLoss, setNoReactionOrLoss] = useState(false)
  const [result, setResult] = useState<MixingResult | null>(null)
  const [error, setError] = useState('')

  const handleCalculate = useCallback(() => {
    setError('')
    setResult(null)

    const c1Val = Number(c1)
    const v1Val = Number(v1)
    const c2Val = Number(c2)
    const v2Val = Number(v2)
    const finalVolumeVal = finalVolume.trim() === '' ? undefined : Number(finalVolume)

    if (!Number.isFinite(c1Val)) { setError('C\u2081 is not a valid finite number.'); return }
    if (!Number.isFinite(v1Val)) { setError('V\u2081 is not a valid finite number.'); return }
    if (!Number.isFinite(c2Val)) { setError('C\u2082 is not a valid finite number.'); return }
    if (!Number.isFinite(v2Val)) { setError('V\u2082 is not a valid finite number.'); return }
    if (soluteIdentity.trim() === '') { setError('Enter the one shared solute/analyte identity.'); return }
    if (concentrationUnit === 'N' && normalityContext.trim() === '') { setError('Enter the shared reaction/equivalence context for both normality values.'); return }
    if (!noReactionOrLoss) { setError('Confirm that the same solute is conserved with no reaction or loss.'); return }
    if (volumeBasis === 'measured-final' &&
        (finalVolumeVal === undefined || !Number.isFinite(finalVolumeVal) || finalVolumeVal <= 0)) {
      setError('Enter a positive measured final volume.'); return
    }

    try {
      const res = calculateMixing({
        c1: c1Val,
        v1: v1Val,
        c2: c2Val,
        v2: v2Val,
        soluteIdentity,
        concentrationUnit,
        volumeUnit,
        normalityContext: concentrationUnit === 'N' ? normalityContext : undefined,
        volumeBasis,
        finalVolume: volumeBasis === 'measured-final' ? finalVolumeVal : undefined,
        noReactionOrLoss,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }, [
    c1, v1, c2, v2, soluteIdentity, concentrationUnit, volumeUnit,
    normalityContext, volumeBasis, finalVolume, noReactionOrLoss,
  ])

  const loadExample = useCallback((ex: typeof MIXING_EXAMPLES[0]) => {
    setC1(ex.c1)
    setV1(ex.v1)
    setC2(ex.c2)
    setV2(ex.v2)
    setFinalVolume(ex.finalVolume)
    setSoluteIdentity(ex.soluteIdentity)
    setConcentrationUnit(ex.concentrationUnit)
    setVolumeUnit(ex.volumeUnit)
    setNormalityContext('')
    setVolumeBasis('measured-final')
    setNoReactionOrLoss(true)
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
          Material balance for one conserved solute in one shared volume-based concentration unit.
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
              className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground hover:border-primary-500/40 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputField
          label="Shared Solute / Analyte Identity"
          value={soluteIdentity}
          onChange={setSoluteIdentity}
          placeholder="e.g. NaCl"
        />
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Shared Concentration Unit</label>
          <select
            value={concentrationUnit}
            onChange={(event) => {
              setConcentrationUnit(event.target.value as MixingConcentrationUnit)
              setResult(null)
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {MIXING_UNITS.map((mixingUnit) => (
              <option key={mixingUnit} value={mixingUnit}>{UNIT_LABELS[mixingUnit]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Shared Volume Unit</label>
          <select
            value={volumeUnit}
            onChange={(event) => {
              setVolumeUnit(event.target.value as MixingVolumeUnit)
              setResult(null)
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="mL">mL</option>
            <option value="L">L</option>
          </select>
        </div>
      </div>

      {concentrationUnit === 'N' && (
        <InputField
          label="Shared Normality Reaction / Equivalence Context"
          value={normalityContext}
          onChange={setNormalityContext}
          placeholder="e.g. acid-base neutralization (H⁺ equivalents)"
        />
      )}

      {/* Inputs in two groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3 p-4 rounded-lg border border-primary-500/30 bg-muted">
          <p className="text-sm font-semibold text-primary-600">Solution 1</p>
          <InputField label="Concentration (C\u2081)" value={c1} onChange={setC1} placeholder="e.g. 1" />
          <InputField label={`Volume (V₁, ${volumeUnit})`} value={v1} onChange={setV1} placeholder="e.g. 50" />
        </div>
        <div className="space-y-3 p-4 rounded-lg border border-secondary-500/40 bg-muted">
          <p className="text-sm font-semibold text-secondary-strong">Solution 2</p>
          <InputField label="Concentration (C\u2082)" value={c2} onChange={setC2} placeholder="e.g. 0.5" />
          <InputField label={`Volume (V₂, ${volumeUnit})`} value={v2} onChange={setV2} placeholder="e.g. 50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border bg-muted p-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Final Volume Basis</label>
          <select
            value={volumeBasis}
            onChange={(event) => {
              setVolumeBasis(event.target.value as MixingVolumeBasis)
              setResult(null)
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="measured-final">Measured final volume</option>
            <option value="additive-approximation">Approximate Vfinal = V₁ + V₂</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Measured final volume captures contraction or expansion on mixing.
          </p>
        </div>
        {volumeBasis === 'measured-final' ? (
          <InputField
            label={`Measured Final Volume (${volumeUnit})`}
            value={finalVolume}
            onChange={setFinalVolume}
            placeholder="e.g. 99.7"
          />
        ) : (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning-strong">
            Approximation only: valid when contraction or expansion is negligible. The result will carry this assumption.
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border p-4 text-sm text-foreground">
        <input
          type="checkbox"
          checked={noReactionOrLoss}
          onChange={(event) => setNoReactionOrLoss(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span>
          I confirm both inputs describe the same solute, concentration basis, and volume unit, with no reaction, precipitation, volatilization, or solute loss.
        </span>
      </label>

      <Button onClick={handleCalculate} className="w-full sm:w-auto">
        Calculate
      </Button>

      {error && <ErrorBox message={error} />}

      {result && (
        <ResultCard>
          {/* Before / After visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4">
            {/* Before */}
            <div className="flex gap-3 justify-center">
              <BeakerVis label="Sol. 1" conc={c1Val} vol={v1Val} color="bg-primary-500" maxConc={Math.max(c1Val, c2Val, result.finalConc)} maxVol={result.finalVolume} />
              <div className="self-center text-muted-foreground text-xl">+</div>
              <BeakerVis label="Sol. 2" conc={c2Val} vol={v2Val} color="bg-secondary-500" maxConc={Math.max(c1Val, c2Val, result.finalConc)} maxVol={result.finalVolume} />
            </div>

            <div className="text-2xl text-muted-foreground text-center">&rarr;</div>

            {/* After */}
            <div className="flex justify-center">
              <BeakerVis label="Mixed" conc={result.finalConc} vol={result.finalVolume} color="bg-success" maxConc={Math.max(c1Val, c2Val, result.finalConc)} maxVol={result.finalVolume} />
            </div>
          </div>

          {/* Numeric result */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Final Concentration</p>
              <p className="text-3xl font-bold text-primary-600 font-mono">{formatSci(result.finalConc)}</p>
              <p className="text-xs text-muted-foreground">{UNIT_SHORT_LABELS[result.model.concentrationUnit]}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Final Volume</p>
              <p className="text-3xl font-bold text-foreground font-mono">{formatSci(result.finalVolume, 2)}</p>
              <p className="text-xs text-muted-foreground">{result.model.volumeUnit}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            C<sub>f</sub> = (C&#x2081; &times; V&#x2081; + C&#x2082; &times; V&#x2082;) / V<sub>final</sub>
            = ({formatSci(c1Val)} &times; {formatSci(v1Val, 2)} + {formatSci(c2Val)} &times; {formatSci(v2Val, 2)}) / {formatSci(result.finalVolume, 2)}
            = {formatSci(result.finalConc)}
          </p>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-xs">
            <p className="font-semibold text-foreground">
              Volume basis: {result.model.volumeBasis === 'measured-final' ? 'measured final volume' : 'additive-volume approximation'} ({result.model.volumeUnit})
            </p>
            {result.model.normalityContext && (
              <p className="font-semibold text-foreground">Normality context: {result.model.normalityContext}</p>
            )}
            {result.assumptions.map((assumption) => (
              <p key={assumption} className="text-warning-strong">{assumption}</p>
            ))}
          </div>
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
            ? 'border-primary-500 bg-muted text-primary-600 ring-2 ring-primary-500/30'
            : 'border-border bg-background text-foreground focus:border-primary-500 focus:ring-primary-500/30'
        }`}
      />
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-strong">
      {message}
    </div>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-5 border-l-2 border-l-primary-500">
      {children}
    </Card>
  )
}

function ResultValue({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div className={`text-center rounded-lg p-3 ${highlight ? 'bg-muted border border-primary-500' : 'bg-background border border-border'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${highlight ? 'text-primary-600' : 'text-foreground'}`}>{value}</p>
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
      <div className="relative w-14 h-20 border-2 border-border rounded-b-lg overflow-hidden bg-card">
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
