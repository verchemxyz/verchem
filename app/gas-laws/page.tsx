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
  idealGasLaw,
  combinedGasLaw,
  boylesLaw,
  charlesLaw,
  gayLussacsLaw,
  avogadrosLaw,
  daltonsLaw,
  grahamsLaw,
  vanDerWaalsEquation,
  kelvinToCelsius,
  type GasProperties,
  type CombinedGasLawParams,
  type PartialPressure,
  VAN_DER_WAALS_CONSTANTS,
} from '@/lib/calculations/gas-laws'

type CalculatorMode =
  | 'ideal-gas'
  | 'combined-gas'
  | 'boyles-law'
  | 'charles-law'
  | 'gay-lussacs-law'
  | 'avogadros-law'
  | 'daltons-law'
  | 'grahams-law'
  | 'van-der-waals'

const MODES: { id: CalculatorMode; label: string }[] = [
  { id: 'ideal-gas', label: 'Ideal Gas Law (PV=nRT)' },
  { id: 'combined-gas', label: 'Combined Gas Law' },
  { id: 'boyles-law', label: "Boyle's Law (P↔V)" },
  { id: 'charles-law', label: "Charles's Law (V↔T)" },
  { id: 'gay-lussacs-law', label: "Gay-Lussac's (P↔T)" },
  { id: 'avogadros-law', label: "Avogadro's (V↔n)" },
  { id: 'daltons-law', label: "Dalton's (Partial P)" },
  { id: 'grahams-law', label: "Graham's (Effusion)" },
  { id: 'van-der-waals', label: 'Van der Waals (Real)' },
]

export default function GasLawsPage() {
  const [mode, setMode] = useState<CalculatorMode>('ideal-gas')

  // Ideal Gas Law
  const [P, setP] = useState('1')
  const [V, setV] = useState('22.4')
  const [n, setN] = useState('1')
  const [T, setT] = useState('273')
  const [solveFor, setSolveFor] = useState<'P' | 'V' | 'n' | 'T'>('P')

  // Combined Gas Law
  const [P1, setP1] = useState('1')
  const [V1, setV1] = useState('1')
  const [T1, setT1] = useState('273')
  const [P2, setP2] = useState('')
  const [V2, setV2] = useState('2')
  const [T2, setT2] = useState('546')

  // Dalton's Law
  const [partialPressures, setPartialPressures] = useState<PartialPressure[]>([
    { gas: 'N2', pressure: 0.78, unit: 'atm' },
    { gas: 'O2', pressure: 0.21, unit: 'atm' },
    { gas: 'Ar', pressure: 0.01, unit: 'atm' },
  ])

  // Graham's Law
  const [M1, setM1] = useState('2')
  const [M2, setM2] = useState('32')
  const [rate1, setRate1] = useState('')

  // Van der Waals
  const [selectedGas, setSelectedGas] = useState('N2')
  const [vdwV, setVdwV] = useState('1')
  const [vdwN, setVdwN] = useState('1')
  const [vdwT, setVdwT] = useState('273')

  const [result, setResult] = useState<string | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Calculate
  const calculate = () => {
    setError(null)
    setResult(null)
    setSteps([])

    try {
      switch (mode) {
        case 'ideal-gas': {
          const props: Partial<GasProperties> = {}
          if (solveFor !== 'P') props.P = parseFloat(P)
          if (solveFor !== 'V') props.V = parseFloat(V)
          if (solveFor !== 'n') props.n = parseFloat(n)
          if (solveFor !== 'T') props.T = parseFloat(T)

          const gasResult = idealGasLaw(props)

          let resultValue: number
          switch (solveFor) {
            case 'P':
              resultValue = gasResult.P
              setResult(`P = ${resultValue.toFixed(4)} atm`)
              break
            case 'V':
              resultValue = gasResult.V
              setResult(`V = ${resultValue.toFixed(4)} L`)
              break
            case 'n':
              resultValue = gasResult.n
              setResult(`n = ${resultValue.toFixed(4)} mol`)
              break
            case 'T':
              resultValue = gasResult.T
              setResult(`T = ${resultValue.toFixed(2)} K (${kelvinToCelsius(resultValue).toFixed(2)}°C)`)
              break
          }

          setSteps([
            `Ideal Gas Law: PV = nRT`,
            ``,
            `Given:`,
            solveFor !== 'P' ? `  P = ${P} atm` : '',
            solveFor !== 'V' ? `  V = ${V} L` : '',
            solveFor !== 'n' ? `  n = ${n} mol` : '',
            solveFor !== 'T' ? `  T = ${T} K` : '',
            `  R = 0.08206 L·atm/(mol·K)`,
            ``,
            `Solving for ${solveFor}:`,
            solveFor === 'P'
              ? `P = nRT / V = (${n} × 0.08206 × ${T}) / ${V} = ${resultValue.toFixed(4)} atm`
              : solveFor === 'V'
              ? `V = nRT / P = (${n} × 0.08206 × ${T}) / ${P} = ${resultValue.toFixed(4)} L`
              : solveFor === 'n'
              ? `n = PV / RT = (${P} × ${V}) / (0.08206 × ${T}) = ${resultValue.toFixed(4)} mol`
              : `T = PV / nR = (${P} × ${V}) / (${n} × 0.08206) = ${resultValue.toFixed(2)} K`,
          ].filter((s) => s !== ''))
          break
        }

        case 'combined-gas': {
          const params: Partial<CombinedGasLawParams> = {}
          if (P1) params.P1 = parseFloat(P1)
          if (V1) params.V1 = parseFloat(V1)
          if (T1) params.T1 = parseFloat(T1)
          if (P2) params.P2 = parseFloat(P2)
          if (V2) params.V2 = parseFloat(V2)
          if (T2) params.T2 = parseFloat(T2)

          const gasResult = combinedGasLaw(params)

          const missingVar = !P2
            ? 'P2'
            : !V2
            ? 'V2'
            : !T2
            ? 'T2'
            : 'unknown'
          const value =
            missingVar === 'P2'
              ? gasResult.P2
              : missingVar === 'V2'
              ? gasResult.V2
              : gasResult.T2

          setResult(
            missingVar === 'P2'
              ? `P₂ = ${value.toFixed(4)} atm`
              : missingVar === 'V2'
              ? `V₂ = ${value.toFixed(4)} L`
              : `T₂ = ${value.toFixed(2)} K (${kelvinToCelsius(value).toFixed(2)}°C)`
          )

          setSteps([
            `Combined Gas Law: (P₁V₁)/T₁ = (P₂V₂)/T₂`,
            ``,
            `Initial State:`,
            `  P₁ = ${P1} atm`,
            `  V₁ = ${V1} L`,
            `  T₁ = ${T1} K`,
            ``,
            `Final State:`,
            P2 ? `  P₂ = ${P2} atm` : '',
            V2 ? `  V₂ = ${V2} L` : '',
            T2 ? `  T₂ = ${T2} K` : '',
            ``,
            `Solving for ${missingVar}:`,
            `${missingVar} = ${value.toFixed(4)}`,
          ].filter((s) => s !== ''))
          break
        }

        case 'boyles-law': {
          const p1 = parseFloat(P1)
          const v1 = parseFloat(V1)
          const v2 = parseFloat(V2)
          const gasResult = boylesLaw(p1, v1, undefined, v2)

          setResult(`P₂ = ${gasResult.P2.toFixed(4)} atm`)
          setSteps([
            `Boyle's Law: P₁V₁ = P₂V₂ (constant T, n)`,
            ``,
            `Given:`,
            `  P₁ = ${p1} atm`,
            `  V₁ = ${v1} L`,
            `  V₂ = ${v2} L`,
            ``,
            `Solving for P₂:`,
            `P₂ = (P₁ × V₁) / V₂`,
            `P₂ = (${p1} × ${v1}) / ${v2}`,
            `P₂ = ${gasResult.P2.toFixed(4)} atm`,
            ``,
            `Relationship: Pressure ∝ 1/Volume (inverse relationship)`,
          ])
          break
        }

        case 'charles-law': {
          const v1 = parseFloat(V1)
          const t1 = parseFloat(T1)
          const t2 = parseFloat(T2)
          const gasResult = charlesLaw(v1, t1, undefined, t2)

          setResult(`V₂ = ${gasResult.V2.toFixed(4)} L`)
          setSteps([
            `Charles's Law: V₁/T₁ = V₂/T₂ (constant P, n)`,
            ``,
            `Given:`,
            `  V₁ = ${v1} L`,
            `  T₁ = ${t1} K`,
            `  T₂ = ${t2} K`,
            ``,
            `Solving for V₂:`,
            `V₂ = (V₁ × T₂) / T₁`,
            `V₂ = (${v1} × ${t2}) / ${t1}`,
            `V₂ = ${gasResult.V2.toFixed(4)} L`,
            ``,
            `Relationship: Volume ∝ Temperature (direct relationship)`,
          ])
          break
        }

        case 'gay-lussacs-law': {
          const p1 = parseFloat(P1)
          const t1 = parseFloat(T1)
          const t2 = parseFloat(T2)
          const gasResult = gayLussacsLaw(p1, t1, undefined, t2)

          setResult(`P₂ = ${gasResult.P2.toFixed(4)} atm`)
          setSteps([
            `Gay-Lussac's Law: P₁/T₁ = P₂/T₂ (constant V, n)`,
            ``,
            `Given:`,
            `  P₁ = ${p1} atm`,
            `  T₁ = ${t1} K`,
            `  T₂ = ${t2} K`,
            ``,
            `Solving for P₂:`,
            `P₂ = (P₁ × T₂) / T₁`,
            `P₂ = (${p1} × ${t2}) / ${t1}`,
            `P₂ = ${gasResult.P2.toFixed(4)} atm`,
            ``,
            `Relationship: Pressure ∝ Temperature (direct relationship)`,
          ])
          break
        }

        case 'avogadros-law': {
          const v1 = parseFloat(V1)
          const n1 = parseFloat(n)
          const n2 = parseFloat(T2) // Using T2 input for n2
          const gasResult = avogadrosLaw(v1, n1, undefined, n2)

          setResult(`V₂ = ${gasResult.V2.toFixed(4)} L`)
          setSteps([
            `Avogadro's Law: V₁/n₁ = V₂/n₂ (constant P, T)`,
            ``,
            `Given:`,
            `  V₁ = ${v1} L`,
            `  n₁ = ${n1} mol`,
            `  n₂ = ${n2} mol`,
            ``,
            `Solving for V₂:`,
            `V₂ = (V₁ × n₂) / n₁`,
            `V₂ = (${v1} × ${n2}) / ${n1}`,
            `V₂ = ${gasResult.V2.toFixed(4)} L`,
            ``,
            `Relationship: Volume ∝ Moles (direct relationship)`,
          ])
          break
        }

        case 'daltons-law': {
          const total = daltonsLaw(partialPressures.map(pp => pp.pressure))
          setResult(`P_total = ${total.toFixed(4)} atm`)

          setSteps([
            `Dalton's Law of Partial Pressures`,
            `P_total = P₁ + P₂ + P₃ + ...`,
            ``,
            `Given partial pressures:`,
            ...partialPressures.map(
              (pp) => `  ${pp.gas}: ${pp.pressure} ${pp.unit}`
            ),
            ``,
            `Total Pressure:`,
            `P_total = ${partialPressures.map((pp) => pp.pressure).join(' + ')}`,
            `P_total = ${total.toFixed(4)} atm`,
          ])
          break
        }

        case 'grahams-law': {
          const m1 = parseFloat(M1)
          const m2 = parseFloat(M2)
          const r1 = parseFloat(rate1) || 1.0
          const r2 = grahamsLaw(r1, m1, m2)

          setResult(`rate₂ = ${r2.toFixed(4)}`)
          setSteps([
            `Graham's Law of Effusion/Diffusion`,
            `rate₁/rate₂ = √(M₂/M₁)`,
            ``,
            `Given:`,
            `  Molar mass 1 (M₁) = ${m1} g/mol`,
            `  Molar mass 2 (M₂) = ${m2} g/mol`,
            `  Rate 1 (rate₁) = ${r1}`,
            ``,
            `Solving for rate₂:`,
            `rate₂ = rate₁ × √(M₁/M₂)`,
            `rate₂ = ${r1} × √(${m1}/${m2})`,
            `rate₂ = ${r1} × ${Math.sqrt(m1 / m2).toFixed(4)}`,
            `rate₂ = ${r2.toFixed(4)}`,
            ``,
            `Lighter gases effuse/diffuse faster!`,
          ])
          break
        }

        case 'van-der-waals': {
          const constants = VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS]
          if (!constants) throw new Error('Gas not found')

          const gasN = parseFloat(vdwN)
          const gasV = parseFloat(vdwV)
          const gasT = parseFloat(vdwT)

          const pressureVdW = vanDerWaalsEquation({
            n: gasN,
            V: gasV,
            T: gasT,
            a: constants.a,
            b: constants.b,
          })

          setResult(`P = ${pressureVdW.toFixed(4)} atm`)
          setSteps([
            `Van der Waals Equation for Real Gases`,
            `[P + a(n/V)²](V - nb) = nRT`,
            ``,
            `Selected Gas: ${selectedGas}`,
            `  a = ${constants.a} L²·atm/mol²`,
            `  b = ${constants.b} L/mol`,
            ``,
            `Given:`,
            `  n = ${gasN} mol`,
            `  V = ${gasV} L`,
            `  T = ${gasT} K`,
            `  R = 0.08206 L·atm/(mol·K)`,
            ``,
            `Solving for P:`,
            `P = [nRT / (V - nb)] - a(n/V)²`,
            `P = ${pressureVdW.toFixed(4)} atm`,
            ``,
            `Ideal Gas (PV=nRT) would give:`,
            `P = ${((gasN * 0.08206 * gasT) / gasV).toFixed(4)} atm`,
            ``,
            `Difference shows deviation from ideal behavior!`,
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
      case 'ideal-gas':
        setP('1')
        setV('22.4')
        setN('1')
        setT('273')
        setSolveFor('P')
        break
      case 'daltons-law':
        setPartialPressures([
          { gas: 'N2', pressure: 0.78, unit: 'atm' },
          { gas: 'O2', pressure: 0.21, unit: 'atm' },
          { gas: 'Ar', pressure: 0.01, unit: 'atm' },
        ])
        break
    }
  }

  return (
    <CalcShell
      eyebrow="Physical chemistry · 9 gas laws"
      title="Gas Laws"
      subtitle="Ideal gas, combined gas law, and real-gas calculations with step-by-step solutions."
      backHref="/"
      backLabel="Home"
      action={
        <Link
          href="/gas-laws/enhanced-page"
          className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Enhanced (uncertainty)
        </Link>
      }
    >
      {/* Mode Selector */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Select gas law</SectionTitle>
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

        {/* Ideal Gas Law */}
        {mode === 'ideal-gas' && (
          <div className="space-y-4">
            <FormulaBlock>PV = nRT</FormulaBlock>

            <Field label="Solve for" htmlFor="solveFor">
              <select
                id="solveFor"
                value={solveFor}
                onChange={(e) => setSolveFor(e.target.value as 'P' | 'V' | 'n' | 'T')}
                className="input-premium w-full"
              >
                <option value="P">Pressure (P)</option>
                <option value="V">Volume (V)</option>
                <option value="n">Moles (n)</option>
                <option value="T">Temperature (T)</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {solveFor !== 'P' && (
                <Field label="Pressure (atm)">
                  <input type="number" value={P} onChange={(e) => setP(e.target.value)} className="input-premium w-full" />
                </Field>
              )}
              {solveFor !== 'V' && (
                <Field label="Volume (L)">
                  <input type="number" value={V} onChange={(e) => setV(e.target.value)} className="input-premium w-full" />
                </Field>
              )}
              {solveFor !== 'n' && (
                <Field label="Moles (mol)">
                  <input type="number" value={n} onChange={(e) => setN(e.target.value)} className="input-premium w-full" />
                </Field>
              )}
              {solveFor !== 'T' && (
                <Field label="Temperature (K)">
                  <input type="number" value={T} onChange={(e) => setT(e.target.value)} className="input-premium w-full" />
                </Field>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              R = 0.08206 L·atm/(mol·K) | STP: 273.15 K, 1 atm, 22.4 L/mol
            </p>
          </div>
        )}

        {/* Combined Gas Law */}
        {mode === 'combined-gas' && (
          <div className="space-y-4">
            <FormulaBlock>(P₁V₁)/T₁ = (P₂V₂)/T₂</FormulaBlock>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Initial state</h3>
                <div className="space-y-3">
                  <Field label="P₁ (atm)">
                    <input type="number" value={P1} onChange={(e) => setP1(e.target.value)} className="input-premium w-full" />
                  </Field>
                  <Field label="V₁ (L)">
                    <input type="number" value={V1} onChange={(e) => setV1(e.target.value)} className="input-premium w-full" />
                  </Field>
                  <Field label="T₁ (K)">
                    <input type="number" value={T1} onChange={(e) => setT1(e.target.value)} className="input-premium w-full" />
                  </Field>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Final state (leave one blank)</h3>
                <div className="space-y-3">
                  <Field label="P₂ (atm)">
                    <input type="number" value={P2} onChange={(e) => setP2(e.target.value)} placeholder="Leave blank to solve" className="input-premium w-full" />
                  </Field>
                  <Field label="V₂ (L)">
                    <input type="number" value={V2} onChange={(e) => setV2(e.target.value)} placeholder="Leave blank to solve" className="input-premium w-full" />
                  </Field>
                  <Field label="T₂ (K)">
                    <input type="number" value={T2} onChange={(e) => setT2(e.target.value)} placeholder="Leave blank to solve" className="input-premium w-full" />
                  </Field>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Boyle's Law */}
        {mode === 'boyles-law' && (
          <div className="space-y-4">
            <FormulaBlock label="constant T, n — Pressure ∝ 1/Volume">P₁V₁ = P₂V₂</FormulaBlock>
            <div className="grid grid-cols-2 gap-4">
              <Field label="P₁ (atm)">
                <input type="number" value={P1} onChange={(e) => setP1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="V₁ (L)">
                <input type="number" value={V1} onChange={(e) => setV1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="V₂ (L)">
                <input type="number" value={V2} onChange={(e) => setV2(e.target.value)} className="input-premium w-full" />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">P₂ will be calculated</p>
              </div>
            </div>
          </div>
        )}

        {/* Charles's Law */}
        {mode === 'charles-law' && (
          <div className="space-y-4">
            <FormulaBlock label="constant P, n — Volume ∝ Temperature">V₁/T₁ = V₂/T₂</FormulaBlock>
            <div className="grid grid-cols-2 gap-4">
              <Field label="V₁ (L)">
                <input type="number" value={V1} onChange={(e) => setV1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="T₁ (K)">
                <input type="number" value={T1} onChange={(e) => setT1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="T₂ (K)">
                <input type="number" value={T2} onChange={(e) => setT2(e.target.value)} className="input-premium w-full" />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">V₂ will be calculated</p>
              </div>
            </div>
          </div>
        )}

        {/* Gay-Lussac's Law */}
        {mode === 'gay-lussacs-law' && (
          <div className="space-y-4">
            <FormulaBlock label="constant V, n — Pressure ∝ Temperature">P₁/T₁ = P₂/T₂</FormulaBlock>
            <div className="grid grid-cols-2 gap-4">
              <Field label="P₁ (atm)">
                <input type="number" value={P1} onChange={(e) => setP1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="T₁ (K)">
                <input type="number" value={T1} onChange={(e) => setT1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="T₂ (K)">
                <input type="number" value={T2} onChange={(e) => setT2(e.target.value)} className="input-premium w-full" />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">P₂ will be calculated</p>
              </div>
            </div>
          </div>
        )}

        {/* Avogadro's Law */}
        {mode === 'avogadros-law' && (
          <div className="space-y-4">
            <FormulaBlock label="constant P, T — Volume ∝ Moles">V₁/n₁ = V₂/n₂</FormulaBlock>
            <div className="grid grid-cols-2 gap-4">
              <Field label="V₁ (L)">
                <input type="number" value={V1} onChange={(e) => setV1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="n₁ (mol)">
                <input type="number" value={n} onChange={(e) => setN(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="n₂ (mol)">
                <input type="number" value={T2} onChange={(e) => setT2(e.target.value)} className="input-premium w-full" />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">V₂ will be calculated</p>
              </div>
            </div>
          </div>
        )}

        {/* Dalton's Law */}
        {mode === 'daltons-law' && (
          <div className="space-y-4">
            <FormulaBlock label="Law of Partial Pressures">P_total = P₁ + P₂ + P₃ + ...</FormulaBlock>

            <div className="space-y-3">
              {partialPressures.map((pp, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={pp.gas}
                    onChange={(e) => {
                      const newPP = [...partialPressures]
                      newPP[index].gas = e.target.value
                      setPartialPressures(newPP)
                    }}
                    placeholder="Gas name"
                    aria-label="Gas name"
                    className="input-premium w-28"
                  />
                  <input
                    type="number"
                    value={pp.pressure}
                    onChange={(e) => {
                      const newPP = [...partialPressures]
                      newPP[index].pressure = parseFloat(e.target.value)
                      setPartialPressures(newPP)
                    }}
                    aria-label="Partial pressure (atm)"
                    className="input-premium flex-1"
                  />
                  <span className="w-12 text-muted-foreground text-sm">atm</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPartialPressures(partialPressures.filter((_, i) => i !== index))
                    }}
                    aria-label="Remove gas"
                    className="p-2 rounded-md text-destructive-strong hover:bg-destructive/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setPartialPressures([
                  ...partialPressures,
                  { gas: 'Gas', pressure: 0.1, unit: 'atm' },
                ])
              }}
            >
              Add gas
            </Button>
          </div>
        )}

        {/* Graham's Law */}
        {mode === 'grahams-law' && (
          <div className="space-y-4">
            <FormulaBlock label="Lighter gases effuse/diffuse faster">rate₁/rate₂ = √(M₂/M₁)</FormulaBlock>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Molar mass 1 (g/mol)">
                <input type="number" value={M1} onChange={(e) => setM1(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="Molar mass 2 (g/mol)">
                <input type="number" value={M2} onChange={(e) => setM2(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="Rate 1 (optional, default = 1)">
                <input type="number" value={rate1} onChange={(e) => setRate1(e.target.value)} placeholder="1.0" className="input-premium w-full" />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">rate₂ will be calculated</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Example: H₂ (M=2) vs O₂ (M=32) → H₂ effuses 4× faster.
            </p>
          </div>
        )}

        {/* Van der Waals */}
        {mode === 'van-der-waals' && (
          <div className="space-y-4">
            <FormulaBlock label="Real gas — accounts for molecular size & interactions">
              [P + a(n/V)²](V - nb) = nRT
            </FormulaBlock>

            <Field label="Select gas" htmlFor="vdwGas">
              <select
                id="vdwGas"
                value={selectedGas}
                onChange={(e) => setSelectedGas(e.target.value)}
                className="input-premium w-full"
              >
                {Object.keys(VAN_DER_WAALS_CONSTANTS).map((gas) => (
                  <option key={gas} value={gas}>
                    {gas}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Moles (mol)">
                <input type="number" value={vdwN} onChange={(e) => setVdwN(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="Volume (L)">
                <input type="number" value={vdwV} onChange={(e) => setVdwV(e.target.value)} className="input-premium w-full" />
              </Field>
              <Field label="Temperature (K)">
                <input type="number" value={vdwT} onChange={(e) => setVdwT(e.target.value)} className="input-premium w-full" />
              </Field>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">Pressure will be calculated</p>
              </div>
            </div>

            {VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS] && (
              <p className="text-sm text-muted-foreground font-mono bg-muted border border-border p-3 rounded-md">
                Constants: a = {VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS].a}{' '}
                L²·atm/mol², b = {VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS].b}{' '}
                L/mol
              </p>
            )}
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
            onClick={() => loadExample('ideal-gas')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: STP conditions
          </button>
          <button
            type="button"
            onClick={() => loadExample('daltons-law')}
            className="text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Example: Air composition
          </button>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* Result Display */}
      {result && <ResultPanel>{result}</ResultPanel>}

      {/* Step-by-Step Solution */}
      {steps.length > 0 && <StepList steps={steps} />}

      {/* Reference Info */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Quick reference</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-primary-600 mb-2">Gas constants</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>R = 0.08206 L·atm/(mol·K)</li>
              <li>R = 8.314 J/(mol·K)</li>
              <li>R = 62.36 L·mmHg/(mol·K)</li>
              <li>STP: 273.15 K, 1 atm, 22.4 L/mol</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-primary-600 mb-2">Temperature conversions</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>K = °C + 273.15</li>
              <li>°C = K - 273.15</li>
              <li>°F = (9/5)°C + 32</li>
              <li>Always use Kelvin in gas law calculations.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted border border-border rounded-md">
          <h3 className="font-semibold text-foreground mb-2">Key relationships</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Boyle: P ↑ → V ↓ (inverse)</li>
            <li>Charles: T ↑ → V ↑ (direct)</li>
            <li>Gay-Lussac: T ↑ → P ↑ (direct)</li>
            <li>Avogadro: n ↑ → V ↑ (direct)</li>
            <li>Real gases deviate from ideal at high P, low T</li>
          </ul>
        </div>
      </Card>
    </CalcShell>
  )
}
