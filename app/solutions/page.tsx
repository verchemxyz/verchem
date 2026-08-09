'use client'

import { useState } from 'react'
import { PHCalculatorSchema } from '@/components/seo/JsonLd'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
  FormulaBlock,
  ModeGrid,
  ModeButton,
  ResultPanel,
  StepList,
  ErrorBanner,
} from '@/components/lab'
import {
  calculateMolarity,
  calculateStrongAcidPH,
  calculateStrongBasePH,
  calculateWeakAcidPH,
  calculateWeakBasePH,
  calculateBufferPH,
  calculatePHConversion,
  calculateDilution as calcDilution,
  STRONG_ACIDS,
  STRONG_BASES,
  PH_MODEL_25C,
  type MolarityResult,
  type PHResult,
  type PHConversionSource,
  type DilutionResult,
} from '@/lib/calculations/solutions'
import { parseRequiredFiniteNumber } from '@/lib/numeric-input'
import {
  SOLUTION_MODES,
  SOLUTIONS_MODE_COUNT,
  type CalculatorMode,
} from '@/lib/config/solutions'

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
  const [conversionInput, setConversionInput] = useState('7')

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
    if (ph < PH_MODEL_25C.neutralPH) return 'Acidic'
    if (Math.abs(ph - PH_MODEL_25C.neutralPH) < 1e-10) return 'Neutral'
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
          const n = parseRequiredFiniteNumber(moles, 'Moles', { minInclusive: 0 })
          const V = parseRequiredFiniteNumber(volumeL, 'Volume', { minExclusive: 0 })
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
          const conc = parseRequiredFiniteNumber(concentration, 'Concentration', { minInclusive: 0 })
          const result = calculateStrongAcidPH(conc, { formula: selectedAcid })
          setPhResult(result)
          const usesSecondDissociation = selectedAcid === 'H2SO4'
          setSteps([
            `Strong Acid: ${selectedAcid} (strong dissociation)`,
            ``,
            `Given:`,
            `  Concentration = ${conc} M`,
            ``,
            ...(usesSecondDissociation
              ? ['Second dissociation of HSO₄⁻ accounted (Ka₂ ≈ 1.2×10⁻²).', ``]
              : []),
            `Effective [H⁺] (including water autoionization):`,
            `[H⁺] = ${result.H_concentration.toExponential(3)} M`,
            ``,
            `pH Calculation:`,
            `pH = -log₁₀[H⁺]`,
            `pH = -log₁₀(${result.H_concentration.toExponential(3)})`,
            `pH = ${result.pH.toFixed(2)}`,
            ``,
            `[OH⁻] = Kw / [H⁺] = ${result.OH_concentration.toExponential(3)} M`,
            `pOH = -log₁₀[OH⁻] = ${result.pOH.toFixed(2)}`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'strong-base-ph': {
          const conc = parseRequiredFiniteNumber(concentration, 'Concentration', { minInclusive: 0 })
          const result = calculateStrongBasePH(conc, { formula: selectedBase })
          setPhResult(result)
          setSteps([
            `Strong Base: ${selectedBase} (strong dissociation)`,
            ``,
            `Given:`,
            `  Concentration = ${conc} M`,
            ``,
            `Effective [OH⁻] (including water autoionization):`,
            `[OH⁻] = ${result.OH_concentration.toExponential(3)} M`,
            ``,
            `pOH Calculation:`,
            `pOH = -log₁₀[OH⁻]`,
            `pOH = -log₁₀(${result.OH_concentration.toExponential(3)})`,
            `pOH = ${result.pOH.toFixed(2)}`,
            ``,
            `[H⁺] = Kw / [OH⁻] = ${result.H_concentration.toExponential(3)} M`,
            `pH = -log₁₀[H⁺] = ${result.pH.toFixed(2)}`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'weak-acid-ph': {
          const conc = parseRequiredFiniteNumber(concentration, 'Concentration', { minExclusive: 0 })
          const kaValue = parseRequiredFiniteNumber(ka, 'Ka', { minExclusive: 0 })
          const result = calculateWeakAcidPH(conc, kaValue)
          setPhResult(result)
          const equilibriumSteps = result.method === 'approximation'
            ? [
                `The estimated ionization is ${result.percentIonization.toFixed(2)}%, so the 5% approximation is used.`,
                `x ≈ √(Ka × C)`,
                `x = √(${kaValue.toExponential(2)} × ${conc})`,
              ]
            : [
                `The 5% approximation is not valid; solve x² + Kax - KaC = 0.`,
                `x = (-Ka + √(Ka² + 4KaC)) / 2`,
              ]
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
            ...equilibriumSteps,
            `x = [H⁺] = ${result.H_concentration.toExponential(3)} M`,
            ``,
            `pH = -log₁₀[H⁺] = ${result.pH.toFixed(2)}`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'weak-base-ph': {
          const conc = parseRequiredFiniteNumber(concentration, 'Concentration', { minExclusive: 0 })
          const kbValue = parseRequiredFiniteNumber(kb, 'Kb', { minExclusive: 0 })
          const result = calculateWeakBasePH(conc, kbValue)
          setPhResult(result)
          const equilibriumSteps = result.method === 'approximation'
            ? [
                `The estimated ionization is ${result.percentIonization.toFixed(2)}%, so the 5% approximation is used.`,
                `x ≈ √(Kb × C)`,
                `x = √(${kbValue.toExponential(2)} × ${conc})`,
              ]
            : [
                `The 5% approximation is not valid; solve x² + Kbx - KbC = 0.`,
                `x = (-Kb + √(Kb² + 4KbC)) / 2`,
              ]
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
            ...equilibriumSteps,
            `x = [OH⁻] = ${result.OH_concentration.toExponential(3)} M`,
            ``,
            `pOH = -log₁₀[OH⁻] = ${result.pOH.toFixed(2)}`,
            `pH = ${PH_MODEL_25C.pKw.toFixed(2)} - pOH = ${result.pH.toFixed(2)}`,
            ``,
            `Classification: ${getPhLabel(result.pH)}`,
          ])
          break
        }

        case 'buffer-ph': {
          const pkaValue = parseRequiredFiniteNumber(pka, 'pKa')
          const acid = parseRequiredFiniteNumber(acidConc, 'Weak-acid concentration', { minExclusive: 0 })
          const base = parseRequiredFiniteNumber(conjugateBaseConc, 'Conjugate-base concentration', { minExclusive: 0 })
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
          const M1 = parseRequiredFiniteNumber(m1, 'Initial molarity', { minExclusive: 0 })
          const V1 = parseRequiredFiniteNumber(v1, 'Initial volume', { minExclusive: 0 })
          const V2 = parseRequiredFiniteNumber(v2, 'Final volume', { minExclusive: 0 })
          if (V2 <= V1) throw new Error('Final volume must be greater than initial volume for a dilution')
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

        case 'convert-from-ph':
        case 'convert-from-poh':
        case 'convert-from-h':
        case 'convert-from-oh': {
          const isConcentration = mode === 'convert-from-h' || mode === 'convert-from-oh'
          const inputLabel = mode === 'convert-from-ph'
            ? 'pH'
            : mode === 'convert-from-poh'
              ? 'pOH'
              : mode === 'convert-from-h'
                ? '[H⁺] concentration'
                : '[OH⁻] concentration'
          const value = parseRequiredFiniteNumber(
            conversionInput,
            inputLabel,
            isConcentration ? { minExclusive: 0 } : undefined
          )
          const source: PHConversionSource = mode === 'convert-from-ph'
            ? 'ph'
            : mode === 'convert-from-poh'
              ? 'poh'
              : mode === 'convert-from-h'
                ? 'h-concentration'
                : 'oh-concentration'
          const result = calculatePHConversion(source, value)
          setPhResult(result)
          setSteps([
            `Declared model: ${PH_MODEL_25C.id}`,
            `Given ${inputLabel} = ${value}${isConcentration ? ' mol/L' : ''}`,
            `pH + pOH = pKw = ${PH_MODEL_25C.pKw.toFixed(2)}`,
            `pH = ${result.pH.toFixed(6)}`,
            `pOH = ${result.pOH.toFixed(6)}`,
            `[H⁺] = ${result.H_concentration.toExponential(6)} mol/L`,
            `[OH⁻] = ${result.OH_concentration.toExponential(6)} mol/L`,
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
    <>
      <PHCalculatorSchema />
      <CalcShell
        eyebrow={`Solutions & pH · ${SOLUTIONS_MODE_COUNT} calculation modes`}
        title="Solutions & pH"
        subtitle="Molarity, acid-base equilibria, dilution, and four-way pH conversion with one declared model."
        backHref="/"
        backLabel="Home"
      >
      {/* Mode Selector */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Select calculator mode</SectionTitle>
        <ModeGrid>
          {SOLUTION_MODES.map((m) => (
            <ModeButton
              key={m.id}
              active={mode === m.id}
              onClick={() => setMode(m.id)}
              title={m.label}
            />
          ))}
        </ModeGrid>
      </Card>

      {/* Calculator Input */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Input parameters</SectionTitle>

        {/* Molarity */}
        {mode === 'molarity' && (
          <div className="space-y-4">
            <Field label="Moles of solute (mol)">
              <input
                type="number"
                value={moles}
                onChange={(e) => setMoles(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
            <Field label="Volume of solution (L)">
              <input
                type="number"
                value={volumeL}
                onChange={(e) => setVolumeL(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Strong Acid pH */}
        {mode === 'strong-acid-ph' && (
          <div className="space-y-4">
            <Field label="Select strong acid">
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
            </Field>
            <Field label="Concentration (M)">
              <input
                type="number"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                step="0.001"
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Strong Base pH */}
        {mode === 'strong-base-ph' && (
          <div className="space-y-4">
            <Field label="Select strong base">
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
            </Field>
            <Field label="Concentration (M)">
              <input
                type="number"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                step="0.001"
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Weak Acid pH */}
        {mode === 'weak-acid-ph' && (
          <div className="space-y-4">
            <Field label="Concentration (M)">
              <input
                type="number"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                step="0.001"
                className="input-premium w-full"
              />
            </Field>
            <Field
              label="Ka (acid dissociation constant)"
              hint="Common weak acids: CH₃COOH (Ka = 1.74×10⁻⁵), HF (Ka = 6.8×10⁻⁴)"
            >
              <input
                type="text"
                value={ka}
                onChange={(e) => setKa(e.target.value)}
                placeholder="e.g., 1.74e-5"
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Weak Base pH */}
        {mode === 'weak-base-ph' && (
          <div className="space-y-4">
            <Field label="Concentration (M)">
              <input
                type="number"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                step="0.001"
                className="input-premium w-full"
              />
            </Field>
            <Field
              label="Kb (base dissociation constant)"
              hint="Common weak base: NH₃ (Kb = 1.8×10⁻⁵)"
            >
              <input
                type="text"
                value={kb}
                onChange={(e) => setKb(e.target.value)}
                placeholder="e.g., 1.8e-5"
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Buffer pH */}
        {mode === 'buffer-ph' && (
          <div className="space-y-4">
            <FormulaBlock label="Henderson-Hasselbalch equation">
              pH = pKa + log([A⁻]/[HA])
            </FormulaBlock>

            <Field label="pKa of weak acid">
              <input
                type="number"
                value={pka}
                onChange={(e) => setPka(e.target.value)}
                step="0.01"
                className="input-premium w-full"
              />
            </Field>
            <Field label="[Weak acid] (M)">
              <input
                type="number"
                value={acidConc}
                onChange={(e) => setAcidConc(e.target.value)}
                step="0.01"
                className="input-premium w-full"
              />
            </Field>
            <Field
              label="[Conjugate base] (M)"
              hint="Example: Acetate buffer (CH₃COOH/CH₃COO⁻, pKa = 4.76)"
            >
              <input
                type="number"
                value={conjugateBaseConc}
                onChange={(e) => setConjugateBaseConc(e.target.value)}
                step="0.01"
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Dilution */}
        {mode === 'dilution' && (
          <div className="space-y-4">
            <FormulaBlock>M₁V₁ = M₂V₂</FormulaBlock>

            <div className="grid grid-cols-2 gap-4">
              <Field label="M₁ (initial molarity, M)">
                <input
                  type="number"
                  value={m1}
                  onChange={(e) => setM1(e.target.value)}
                  className="input-premium w-full"
                />
              </Field>
              <Field label="V₁ (initial volume, mL)">
                <input
                  type="number"
                  value={v1}
                  onChange={(e) => setV1(e.target.value)}
                  className="input-premium w-full"
                />
              </Field>
              <Field label="V₂ (final volume, mL)">
                <input
                  type="number"
                  value={v2}
                  onChange={(e) => setV2(e.target.value)}
                  className="input-premium w-full"
                />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">M₂ will be calculated</p>
              </div>
            </div>
          </div>
        )}

        {(mode === 'convert-from-ph' ||
          mode === 'convert-from-poh' ||
          mode === 'convert-from-h' ||
          mode === 'convert-from-oh') && (
          <div className="space-y-4">
            <FormulaBlock label={`Model: ${PH_MODEL_25C.id}`}>
              pH + pOH = pKw = {PH_MODEL_25C.pKw.toFixed(2)} at {PH_MODEL_25C.temperatureC} °C
            </FormulaBlock>
            <Field
              label={mode === 'convert-from-ph'
                ? 'pH'
                : mode === 'convert-from-poh'
                  ? 'pOH'
                  : mode === 'convert-from-h'
                    ? '[H⁺] (mol/L)'
                    : '[OH⁻] (mol/L)'}
              hint="The result uses the declared ideal-dilute aqueous model; pH is not artificially restricted to the conventional 0–14 teaching range."
            >
              <input
                type="text"
                inputMode="decimal"
                value={conversionInput}
                onChange={(event) => setConversionInput(event.target.value)}
                placeholder={mode === 'convert-from-h' || mode === 'convert-from-oh' ? 'e.g., 1e-7' : 'e.g., 7'}
                className="input-premium w-full font-mono"
              />
            </Field>
          </div>
        )}

        {/* Calculate Button */}
        <Button onClick={calculate} className="w-full mt-6">
          Calculate
        </Button>

        {/* Quick Examples */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadExample('strong-acid-ph')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: 0.01 M HCl
          </button>
          <button
            type="button"
            onClick={() => loadExample('buffer-ph')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: Acetate Buffer
          </button>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* Result Display */}
      {(phResult || molarityResult || dilutionResult) && (
        <>
          {/* Molarity Result */}
          {molarityResult && (
            <ResultPanel label="Molarity">{molarityResult.toFixed(4)} M</ResultPanel>
          )}

          {/* pH Result with pH Scale */}
          {phResult && (
            <div className="space-y-4">
              {/* pH Scale Visualization (pH-scale colors encode data — preserved) */}
              <Card className="p-6">
                <SectionTitle className="mb-4 text-center">pH scale</SectionTitle>

                {/* pH Meter */}
                <div className="mb-8 pt-8">
                  {/* Gradient bar — pH-scale data encoding */}
                  <div
                    className="relative h-10 rounded-lg"
                    style={{
                      background:
                        'linear-gradient(to right, #dc2626, #f97316, #fbbf24, #10b981, #3b82f6, #8b5cf6, #6b21a8)',
                    }}
                  >
                    {/* Current pH indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-foreground"
                      style={{
                        left: `${(Math.min(14, Math.max(0, phResult.pH)) / 14) * 100}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1 rounded font-bold whitespace-nowrap text-sm">
                        pH {phResult.pH.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Numeric scale below the gradient (off the colored fill — AA) */}
                  <div className="flex justify-between px-1 mt-1.5 text-xs text-muted-foreground font-mono">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((ph) => (
                      <span key={ph}>{ph}</span>
                    ))}
                  </div>
                </div>

                {/* pH Category Labels — pH semantics */}
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-destructive-strong">ACIDIC</span>
                  <span className="text-success-strong">NEUTRAL</span>
                  <span className="text-foreground">BASIC</span>
                </div>
              </Card>

              {/* pH Values Card — colored by pH (data encoding, preserved) */}
              <div
                className="rounded-lg border border-border bg-card p-6 border-l-4"
                style={{ borderLeftColor: getPhColor(phResult.pH) }}
              >
                <h2 className="text-lg font-semibold mb-4 text-foreground">Result</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted border border-border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">pH</div>
                    <div className="text-3xl font-bold">{phResult.pH.toFixed(2)}</div>
                  </div>
                  {phResult.pOH !== undefined && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">pOH</div>
                      <div className="text-3xl font-bold">{phResult.pOH.toFixed(2)}</div>
                    </div>
                  )}
                  {phResult.H_concentration !== undefined && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">[H⁺]</div>
                      <div className="text-lg font-bold">
                        {phResult.H_concentration.toExponential(2)} M
                      </div>
                    </div>
                  )}
                  {phResult.OH_concentration !== undefined && (
                    <div className="bg-muted border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">[OH⁻]</div>
                      <div className="text-lg font-bold">
                        {phResult.OH_concentration.toExponential(2)} M
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-2xl font-bold">
                  {getPhLabel(phResult.pH).toUpperCase()} Solution
                </div>
                {phResult.resolved && (
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Resolved species: {phResult.resolved.identity}; stoichiometric factor {phResult.resolved.stoichiometricFactor} {phResult.resolved.ion} per formula unit.
                  </p>
                )}
                {phResult.method && (
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Equilibrium method: {phResult.method === 'quadratic' ? 'quadratic solution' : '5% approximation'}
                  </p>
                )}
                {phResult.warning && (
                  <p className="mt-2 text-center text-sm text-warning-strong">{phResult.warning}</p>
                )}
              </div>
            </div>
          )}

          {/* Dilution Result */}
          {dilutionResult && (
            <ResultPanel label="Final concentration">
              M₂ = {dilutionResult.M2.toFixed(4)} M
            </ResultPanel>
          )}
        </>
      )}

      {/* Step-by-Step Solution */}
      {steps.length > 0 && <StepList steps={steps} />}

      {/* Reference Info */}
      <Card className="p-6">
        <SectionTitle className="mb-3">Declared pH model</SectionTitle>
        <p className="text-sm text-foreground">
          Aqueous ideal-dilute model at {PH_MODEL_25C.temperatureC} °C; Kw = {PH_MODEL_25C.kw.toExponential(1)}, pKw = {PH_MODEL_25C.pKw.toFixed(2)}, and concentration is used as an activity approximation.
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {PH_MODEL_25C.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}
        </ul>
      </Card>

      <Card className="p-6">
        <SectionTitle className="mb-4">Quick reference</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-primary-600 mb-2">pH scale</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• pH &lt; {PH_MODEL_25C.neutralPH}: Acidic (more H⁺)</li>
              <li>• pH = {PH_MODEL_25C.neutralPH}: Neutral in this 25 °C aqueous model</li>
              <li>• pH &gt; {PH_MODEL_25C.neutralPH}: Basic/Alkaline (more OH⁻)</li>
              <li>• pH + pOH = {PH_MODEL_25C.pKw} (at {PH_MODEL_25C.temperatureC}°C)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-primary-600 mb-2">Key formulas</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• pH = -log[H⁺]</li>
              <li>• pOH = -log[OH⁻]</li>
              <li>• pH + pOH = pKw = {PH_MODEL_25C.pKw.toFixed(2)} in the declared model</li>
              <li>• pH = pKa + log([A⁻]/[HA]) (Henderson-Hasselbalch)</li>
              <li>• M₁V₁ = M₂V₂ (dilution)</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted border border-border rounded-md">
          <h3 className="font-semibold text-foreground mb-2">Tips</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Strong acids/bases: Complete dissociation</li>
            <li>• Weak acids/bases: Use Ka/Kb for equilibrium</li>
            <li>• Buffers: Most effective when pH ≈ pKa</li>
            <li>• Dilution: Never add water to acid (add acid to water!)</li>
          </ul>
        </div>
      </Card>
      </CalcShell>
    </>
  )
}
