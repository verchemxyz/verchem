'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  calculateMolecularMass,
  massToMoles,
  molesToMass,
  molesToMolecules,
  calculatePercentComposition,
  calculateEmpiricalFormula,
  findLimitingReagent,
  calculateDilution,
  type PercentComposition,
  type LimitingReagentResult,
} from '@/lib/calculations/stoichiometry'
import { looksLikeSmiles } from '@/lib/molecule/smiles-detect'
import { getMolWeight, smilesToFormula } from '@/lib/rdkit/operations'

type CalculatorMode =
  | 'molecular-mass'
  | 'mass-to-moles'
  | 'moles-to-mass'
  | 'moles-to-molecules'
  | 'percent-composition'
  | 'empirical-formula'
  | 'limiting-reagent'
  | 'dilution'

const MODES: { id: CalculatorMode; label: string }[] = [
  { id: 'molecular-mass', label: 'Molecular Mass' },
  { id: 'mass-to-moles', label: 'Mass → Moles' },
  { id: 'moles-to-mass', label: 'Moles → Mass' },
  { id: 'moles-to-molecules', label: 'Moles → Molecules' },
  { id: 'percent-composition', label: '% Composition' },
  { id: 'empirical-formula', label: 'Empirical Formula' },
  { id: 'limiting-reagent', label: 'Limiting Reagent' },
  { id: 'dilution', label: 'Dilution (M₁V₁=M₂V₂)' },
]

export default function StoichiometryPage() {
  const [mode, setMode] = useState<CalculatorMode>('molecular-mass')

  // Molecular Mass
  const [formula, setFormula] = useState('H2O')

  // Mass/Moles conversions
  const [mass, setMass] = useState('18')
  const [moles, setMoles] = useState('1')

  // Percent Composition
  const [composition, setComposition] = useState<PercentComposition | null>(null)

  // Empirical Formula
  const [elementPercents, setElementPercents] = useState<{ [key: string]: number }>({
    C: 40.0,
    H: 6.7,
    O: 53.3,
  })

  // Limiting Reagent
  const [reactant1Formula, setReactant1Formula] = useState('H2')
  const [reactant1Moles, setReactant1Moles] = useState('2')
  const [reactant1Coeff, setReactant1Coeff] = useState('2')
  const [reactant2Formula, setReactant2Formula] = useState('O2')
  const [reactant2Moles, setReactant2Moles] = useState('0.5')
  const [reactant2Coeff, setReactant2Coeff] = useState('1')
  const [productFormula, setProductFormula] = useState('H2O')
  const [productCoeff, setProductCoeff] = useState('2')
  const [limitingResult, setLimitingResult] = useState<LimitingReagentResult | null>(null)

  // Dilution
  const [m1, setM1] = useState('2')
  const [v1, setV1] = useState('100')
  const [v2, setV2] = useState('500')

  const [result, setResult] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Common compound suggestions
  const suggestedCompounds = ['H2O', 'CO2', 'NaCl', 'H2SO4', 'NaOH', 'CH4', 'NH3', 'O2', 'N2', 'Cl2']

  // Compound data lookup - TODO: implement full compound database integration
  // const compoundData = null

  /**
   * Resolve an input string that might be SMILES to a formula + MW.
   * Returns null if not SMILES or if RDKit conversion fails.
   */
  const resolveSmilesIfNeeded = async (
    input: string
  ): Promise<{ formula: string; mw?: number } | null> => {
    if (!looksLikeSmiles(input)) return null
    try {
      const [mwResult, formulaResult] = await Promise.all([
        getMolWeight(input),
        smilesToFormula(input),
      ])
      if (!formulaResult) return null
      return {
        formula: formulaResult,
        mw: mwResult?.averageMw,
      }
    } catch {
      return null
    }
  }

  // Calculate based on mode
  const calculate = async () => {
    setError(null)
    setResult(null)
    setSteps([])

    try {
      // Pre-resolve the main formula if it looks like SMILES
      let resolvedFormula = formula
      let rdkitMw: number | undefined
      const resolved = await resolveSmilesIfNeeded(formula)
      if (resolved) {
        resolvedFormula = resolved.formula
        rdkitMw = resolved.mw
      }

      switch (mode) {
        case 'molecular-mass': {
          const mass = rdkitMw ?? calculateMolecularMass(resolvedFormula)
          setResult(`${mass.toFixed(3)} g/mol`)
          setSteps([
            resolved ? `Input detected as SMILES → Formula: ${resolvedFormula}` : `Formula: ${resolvedFormula}`,
            `Breaking down to elements and counting atoms...`,
            `Looking up atomic masses from periodic table...`,
            `Summing: (atomic mass × count) for each element`,
            `Molecular Mass = ${mass.toFixed(3)} g/mol`,
          ])
          break
        }

        case 'mass-to-moles': {
          const massValue = parseFloat(mass)
          const mm = rdkitMw ?? calculateMolecularMass(resolvedFormula)
          const molesValue = massToMoles(massValue, mm)
          setResult(`${molesValue.toFixed(4)} mol`)
          setSteps([
            `Given: Mass = ${massValue} g`,
            resolved ? `SMILES detected → Formula: ${resolvedFormula}` : `Formula: ${resolvedFormula}`,
            `Molecular Mass = ${mm.toFixed(3)} g/mol`,
            ``,
            `Using: n = m / M`,
            `n = ${massValue} g / ${mm.toFixed(3)} g/mol`,
            `n = ${molesValue.toFixed(4)} mol`,
          ])
          break
        }

        case 'moles-to-mass': {
          const molesValue = parseFloat(moles)
          const mm = rdkitMw ?? calculateMolecularMass(resolvedFormula)
          const massValue = molesToMass(molesValue, mm)
          setResult(`${massValue.toFixed(3)} g`)
          setSteps([
            `Given: Moles = ${molesValue} mol`,
            resolved ? `SMILES detected → Formula: ${resolvedFormula}` : `Formula: ${resolvedFormula}`,
            `Molecular Mass = ${mm.toFixed(3)} g/mol`,
            ``,
            `Using: m = n × M`,
            `m = ${molesValue} mol × ${mm.toFixed(3)} g/mol`,
            `m = ${massValue.toFixed(3)} g`,
          ])
          break
        }

        case 'moles-to-molecules': {
          const molesValue = parseFloat(moles)
          const moleculesValue = molesToMolecules(molesValue)
          setResult(`${moleculesValue.toExponential(3)} molecules`)
          setSteps([
            `Given: Moles = ${molesValue} mol`,
            ``,
            `Using Avogadro's Number: Nₐ = 6.022 × 10²³ molecules/mol`,
            ``,
            `Number of molecules = n × Nₐ`,
            `= ${molesValue} mol × 6.022 × 10²³ molecules/mol`,
            `= ${moleculesValue.toExponential(3)} molecules`,
          ])
          break
        }

        case 'percent-composition': {
          const comp = calculatePercentComposition(resolvedFormula)
          setComposition(comp)
          const total = Object.values(comp).reduce((sum, val) => sum + val, 0)
          setResult(`Total: ${total.toFixed(2)}%`)

          const stepsArray = [
            resolved ? `SMILES detected → Formula: ${resolvedFormula}` : `Formula: ${resolvedFormula}`,
            `Molecular Mass = ${calculateMolecularMass(resolvedFormula).toFixed(3)} g/mol`,
            ``,
            `Percent Composition:`,
          ]

          for (const [element, pct] of Object.entries(comp)) {
            stepsArray.push(`  ${element}: ${pct.toFixed(2)}%`)
          }

          setSteps(stepsArray)
          break
        }

        case 'empirical-formula': {
          const empirical = calculateEmpiricalFormula(elementPercents)
          setResult(empirical)
          setSteps([
            `Given percent composition:`,
            ...Object.entries(elementPercents).map(([el, pct]) => `  ${el}: ${pct}%`),
            ``,
            `Step 1: Assume 100g sample`,
            `Step 2: Convert % to grams`,
            `Step 3: Convert grams to moles (divide by atomic mass)`,
            `Step 4: Divide by smallest moles to get ratio`,
            `Step 5: Multiply to get whole numbers if needed`,
            ``,
            `Empirical Formula: ${empirical}`,
          ])
          break
        }

        case 'limiting-reagent': {
          // Resolve reactant/product formulas if they look like SMILES
          const r1Resolved = (await resolveSmilesIfNeeded(reactant1Formula)) ?? { formula: reactant1Formula }
          const r2Resolved = (await resolveSmilesIfNeeded(reactant2Formula)) ?? { formula: reactant2Formula }
          const pResolved = (await resolveSmilesIfNeeded(productFormula)) ?? { formula: productFormula }

          const r1Moles = parseFloat(reactant1Moles)
          const r1Coeff = parseFloat(reactant1Coeff)
          const r2Moles = parseFloat(reactant2Moles)
          const r2Coeff = parseFloat(reactant2Coeff)
          const pCoeff = parseFloat(productCoeff)

          const lr = findLimitingReagent(
            {
              reactants: [
                { formula: r1Resolved.formula, moles: r1Moles, coefficient: r1Coeff },
                { formula: r2Resolved.formula, moles: r2Moles, coefficient: r2Coeff },
              ],
            },
            [{ formula: pResolved.formula, coefficient: pCoeff }]
          )

          setLimitingResult(lr)
          setResult(`Limiting Reagent: ${lr.limitingReagent}`)
          const stepsArray = [
            `Balanced Equation:`,
            `${r1Coeff} ${r1Resolved.formula} + ${r2Coeff} ${r2Resolved.formula} → ${pCoeff} ${pResolved.formula}`,
            ``,
            `Given:`,
            `  ${r1Resolved.formula}: ${r1Moles} mol`,
            `  ${r2Resolved.formula}: ${r2Moles} mol`,
            ``,
            `Calculate moles of product from each reactant:`,
            `  From ${r1Resolved.formula}: ${r1Moles} mol × (${pCoeff}/${r1Coeff}) = ${(r1Moles * pCoeff / r1Coeff).toFixed(4)} mol`,
            `  From ${r2Resolved.formula}: ${r2Moles} mol × (${pCoeff}/${r2Coeff}) = ${(r2Moles * pCoeff / r2Coeff).toFixed(4)} mol`,
            ``,
            `Limiting Reagent: ${lr.limitingReagent} (produces less product)`,
            `Product formed: ${lr.molesProductFormed[pResolved.formula]?.toFixed(4)} mol ${pResolved.formula}`,
          ]
          setSteps(stepsArray)
          break
        }

        case 'dilution': {
          const M1 = parseFloat(m1)
          const V1 = parseFloat(v1)
          const V2 = parseFloat(v2)

          const dilution = calculateDilution(M1, V1, undefined, V2)
          setResult(`M₂ = ${dilution.M2.toFixed(4)} M`)
          setSteps([
            `Dilution Formula: M₁V₁ = M₂V₂`,
            ``,
            `Given:`,
            `  M₁ (initial concentration) = ${M1} M`,
            `  V₁ (initial volume) = ${V1} mL`,
            `  V₂ (final volume) = ${V2} mL`,
            ``,
            `Solving for M₂:`,
            `M₂ = (M₁ × V₁) / V₂`,
            `M₂ = (${M1} M × ${V1} mL) / ${V2} mL`,
            `M₂ = ${dilution.M2.toFixed(4)} M`,
            ``,
            `To prepare: Add ${(V2 - V1).toFixed(1)} mL solvent to ${V1} mL of ${M1} M solution`,
          ])
          break
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation error')
    }
  }

  // Example problems
  const loadExample = (exampleMode: CalculatorMode) => {
    setMode(exampleMode)

    switch (exampleMode) {
      case 'molecular-mass':
        setFormula('C6H12O6')
        break
      case 'mass-to-moles':
        setFormula('NaCl')
        setMass('58.5')
        break
      case 'limiting-reagent':
        setReactant1Formula('H2')
        setReactant1Moles('2')
        setReactant1Coeff('2')
        setReactant2Formula('O2')
        setReactant2Moles('0.5')
        setReactant2Coeff('1')
        setProductFormula('H2O')
        setProductCoeff('2')
        break
    }
  }

  return (
    <CalcShell
      eyebrow="Stoichiometry · 8 calculation modes"
      title="Stoichiometry"
      subtitle="Mole conversions, limiting reagents, and chemical calculations with step-by-step solutions."
      backHref="/"
      backLabel="Home"
    >
      {/* Mode Selector */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Select calculator mode</SectionTitle>
        <ModeGrid>
          {MODES.map((m) => (
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

        {/* Molecular Mass */}
        {mode === 'molecular-mass' && (
          <div className="space-y-4">
            <Field label="Chemical formula" hint="Examples: H₂O, C₆H₁₂O₆, Ca(OH)₂, Fe₂O₃">
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g., H2O, C6H12O6, Ca(OH)2"
                className="input-premium w-full"
              />
            </Field>

            {/* Quick Compound Selection */}
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Quick select</div>
              <div className="flex flex-wrap gap-2">
                {['H2O', 'NaCl', 'C6H12O6', 'CaCO3', 'H2SO4', 'NH3'].map(comp => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setFormula(comp)}
                    className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mass to Moles */}
        {mode === 'mass-to-moles' && (
          <div className="space-y-4">
            <Field label="Chemical formula">
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
            <Field label="Mass (grams)">
              <input
                type="number"
                value={mass}
                onChange={(e) => setMass(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Moles to Mass */}
        {mode === 'moles-to-mass' && (
          <div className="space-y-4">
            <Field label="Chemical formula">
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
            <Field label="Moles (mol)">
              <input
                type="number"
                value={moles}
                onChange={(e) => setMoles(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
          </div>
        )}

        {/* Moles to Molecules */}
        {mode === 'moles-to-molecules' && (
          <Field label="Moles (mol)" hint="Using Avogadro's Number: 6.022 × 10²³ molecules/mol">
            <input
              type="number"
              value={moles}
              onChange={(e) => setMoles(e.target.value)}
              className="input-premium w-full"
            />
          </Field>
        )}

        {/* Percent Composition */}
        {mode === 'percent-composition' && (
          <Field label="Chemical formula">
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g., H2O, C6H12O6"
              className="input-premium w-full"
            />
          </Field>
        )}

        {/* Empirical Formula */}
        {mode === 'empirical-formula' && (
          <div>
            <div className="text-sm font-medium text-foreground mb-2">Element percent composition</div>
            <div className="space-y-3">
              {Object.entries(elementPercents).map(([element, percent]) => (
                <div key={element} className="flex items-center gap-3">
                  <span className="w-12 font-semibold text-foreground">{element}:</span>
                  <input
                    type="number"
                    value={percent}
                    onChange={(e) =>
                      setElementPercents({
                        ...elementPercents,
                        [element]: parseFloat(e.target.value),
                      })
                    }
                    aria-label={`${element} percent`}
                    className="input-premium flex-1"
                  />
                  <span className="w-8 text-muted-foreground">%</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Example: C: 40%, H: 6.7%, O: 53.3% → Empirical formula: CH₂O
            </p>
          </div>
        )}

        {/* Limiting Reagent */}
        {mode === 'limiting-reagent' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter balanced equation coefficients and available moles.
            </p>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Reactant 1</h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Coefficient">
                  <input
                    type="number"
                    value={reactant1Coeff}
                    onChange={(e) => setReactant1Coeff(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
                <Field label="Formula">
                  <input
                    type="text"
                    value={reactant1Formula}
                    onChange={(e) => setReactant1Formula(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
                <Field label="Moles available">
                  <input
                    type="number"
                    value={reactant1Moles}
                    onChange={(e) => setReactant1Moles(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Reactant 2</h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Coefficient">
                  <input
                    type="number"
                    value={reactant2Coeff}
                    onChange={(e) => setReactant2Coeff(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
                <Field label="Formula">
                  <input
                    type="text"
                    value={reactant2Formula}
                    onChange={(e) => setReactant2Formula(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
                <Field label="Moles available">
                  <input
                    type="number"
                    value={reactant2Moles}
                    onChange={(e) => setReactant2Moles(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Product</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Coefficient">
                  <input
                    type="number"
                    value={productCoeff}
                    onChange={(e) => setProductCoeff(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
                <Field label="Formula">
                  <input
                    type="text"
                    value={productFormula}
                    onChange={(e) => setProductFormula(e.target.value)}
                    className="input-premium w-full"
                  />
                </Field>
              </div>
            </Card>

            {/* Compound Suggestions */}
            {suggestedCompounds.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-2">Suggested compounds</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedCompounds.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!reactant1Formula) setReactant1Formula(suggestion)
                        else if (!reactant2Formula) setReactant2Formula(suggestion)
                        else setProductFormula(suggestion)
                      }}
                      className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Dilution */}
        {mode === 'dilution' && (
          <div className="space-y-4">
            <FormulaBlock>M₁V₁ = M₂V₂</FormulaBlock>

            <div className="grid grid-cols-2 gap-4">
              <Field label="M₁ (initial concentration, M)">
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

        {/* Calculate Button */}
        <Button onClick={() => { calculate() }} className="w-full mt-6">
          Calculate
        </Button>

        {/* Quick Examples */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadExample('molecular-mass')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: Glucose
          </button>
          <button
            type="button"
            onClick={() => loadExample('mass-to-moles')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: NaCl
          </button>
          <button
            type="button"
            onClick={() => loadExample('limiting-reagent')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: H₂ + O₂
          </button>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* Result Display */}
      {result && (
        <ResultPanel>
          <div>{result}</div>

          {/* Percent Composition Table */}
          {composition && (
            <div className="mt-4 bg-muted border border-border rounded-md p-4 text-base font-normal">
              <h3 className="font-semibold text-foreground mb-2">Composition breakdown</h3>
              {Object.entries(composition).map(([element, percent]) => (
                <div key={element} className="flex justify-between py-1 text-foreground">
                  <span>{element}:</span>
                  <span className="font-semibold">{percent.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Limiting Reagent Details */}
          {limitingResult && (
            <div className="mt-4 bg-muted border border-border rounded-md p-4 text-base font-normal text-foreground">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Limiting reagent:</span>{' '}
                  {limitingResult.limitingReagent}
                </div>
                <div>
                  <span className="font-semibold">Product formed:</span>{' '}
                  {Object.entries(limitingResult.molesProductFormed).map(([prod, moles]) => (
                    <span key={prod}>
                      {moles.toFixed(4)} mol {prod}
                    </span>
                  ))}
                </div>
                <div>
                  <span className="font-semibold">Excess reagent:</span>{' '}
                  {limitingResult.excessReagents
                    .filter((r) => r.excessMoles > 0)
                    .map((r) => (
                      <span key={r.formula}>
                        {r.excessMoles.toFixed(4)} mol {r.formula}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Compound Database Information */}
          {/* TODO: Implement compound database integration
          {compoundData && (
            <div className="bg-white/20 rounded-lg p-4 mt-4">
              <h3 className="font-semibold mb-2">Compound Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {compoundData.name}</div>
                <div><strong>IUPAC:</strong> {compoundData.iupacName || 'N/A'}</div>
                <div><strong>Atoms:</strong> {compoundData.calculatedProperties.atomCount}</div>
                <div><strong>Empirical:</strong> {compoundData.calculatedProperties.empiricalFormula}</div>
                {compoundData.meltingPoint && <div><strong>MP:</strong> {compoundData.meltingPoint}°C</div>}
                {compoundData.boilingPoint && <div><strong>BP:</strong> {compoundData.boilingPoint}°C</div>}
                {compoundData.density && <div><strong>Density:</strong> {compoundData.density.toFixed(3)} g/cm³</div>}
              </div>
              {compoundData.uses && compoundData.uses.length > 0 && (
                <div className="mt-2">
                  <strong>Uses:</strong> {compoundData.uses.join(', ')}
                </div>
              )}
            </div>
          )}
          */}
        </ResultPanel>
      )}

      {/* Compound Information Panel */}
      {/* TODO: Implement compound database integration
      {compoundData && !result && (
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold mb-4 text-blue-800">Compound Information</h2>
          ...
        </div>
      )}
      */}

      {/* Step-by-Step Solution */}
      {steps.length > 0 && <StepList steps={steps} />}

      {/* Reference Info */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Quick reference</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-primary-600 mb-3">Important constants</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Avogadro&apos;s Number: 6.022 × 10²³ particles/mol</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>Molar Volume (STP): 22.4 L/mol</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>STP: 0°C (273.15 K), 1 atm</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-primary-600 mb-3">Key formulas</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>n = m / M (moles = mass / molar mass)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>m = n × M (mass = moles × molar mass)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>N = n × Nₐ (particles = moles × Avogadro)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <span>M₁V₁ = M₂V₂ (dilution)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/periodic-table"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
          >
            Open periodic table for atomic masses
          </Link>
        </div>
      </Card>
    </CalcShell>
  )
}
