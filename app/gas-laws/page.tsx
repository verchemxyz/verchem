'use client'

import { useState } from 'react'
import Link from 'next/link'
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
    <div className="min-h-screen hero-gradient-premium">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/gas-laws/enhanced-page"
              className="badge-premium"
            >
              ⚡ Enhanced (uncertainty)
            </Link>
            <Link href="/" className="text-muted-foreground hover:text-primary-600 transition-colors font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">💨 Physical Chemistry • 9 Gas Laws</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Gas Laws</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ideal gas, combined gas law, and gas property calculations with step-by-step solutions
          </p>
        </div>

        {/* Mode Selector */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Select Gas Law</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: 'ideal-gas', label: 'Ideal Gas Law (PV=nRT)', icon: '⚛️' },
              { id: 'combined-gas', label: 'Combined Gas Law', icon: '🔄' },
              { id: 'boyles-law', label: "Boyle's Law (P↔V)", icon: '📉' },
              { id: 'charles-law', label: "Charles's Law (V↔T)", icon: '🌡️' },
              { id: 'gay-lussacs-law', label: "Gay-Lussac's (P↔T)", icon: '🔥' },
              { id: 'avogadros-law', label: "Avogadro's (V↔n)", icon: '🔢' },
              { id: 'daltons-law', label: "Dalton's (Partial P)", icon: '➕' },
              { id: 'grahams-law', label: "Graham's (Effusion)", icon: '💨' },
              { id: 'van-der-waals', label: 'Van der Waals (Real)', icon: '⚙️' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as CalculatorMode)}
                className={`p-4 rounded-xl font-semibold transition-all ${
                  mode === m.id
                    ? 'btn-premium glow-premium text-white shadow-xl scale-105'
                    : 'bg-surface hover:bg-surface-hover text-foreground hover:scale-102'
                }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className="text-sm">{m.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Input */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Input Parameters</h2>

          {/* Ideal Gas Law */}
          {mode === 'ideal-gas' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-3xl font-bold text-pink-600">PV = nRT</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solve For:
                </label>
                <select
                  value={solveFor}
                  onChange={(e) => setSolveFor(e.target.value as 'P' | 'V' | 'n' | 'T')}
                  className="input-premium w-full"
                >
                  <option value="P">Pressure (P)</option>
                  <option value="V">Volume (V)</option>
                  <option value="n">Moles (n)</option>
                  <option value="T">Temperature (T)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {solveFor !== 'P' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pressure (atm)
                    </label>
                    <input
                      type="number"
                      value={P}
                      onChange={(e) => setP(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                )}
                {solveFor !== 'V' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume (L)
                    </label>
                    <input
                      type="number"
                      value={V}
                      onChange={(e) => setV(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                )}
                {solveFor !== 'n' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moles (mol)
                    </label>
                    <input
                      type="number"
                      value={n}
                      onChange={(e) => setN(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                )}
                {solveFor !== 'T' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (K)
                    </label>
                    <input
                      type="number"
                      value={T}
                      onChange={(e) => setT(e.target.value)}
                      className="input-premium w-full"
                    />
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                R = 0.08206 L·atm/(mol·K) | STP: 273.15 K, 1 atm, 22.4 L/mol
              </div>
            </div>
          )}

          {/* Combined Gas Law */}
          {mode === 'combined-gas' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">
                  (P₁V₁)/T₁ = (P₂V₂)/T₂
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-pink-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Initial State</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        P₁ (atm)
                      </label>
                      <input
                        type="number"
                        value={P1}
                        onChange={(e) => setP1(e.target.value)}
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        V₁ (L)
                      </label>
                      <input
                        type="number"
                        value={V1}
                        onChange={(e) => setV1(e.target.value)}
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        T₁ (K)
                      </label>
                      <input
                        type="number"
                        value={T1}
                        onChange={(e) => setT1(e.target.value)}
                        className="input-premium w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-2 border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Final State (leave one blank)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        P₂ (atm)
                      </label>
                      <input
                        type="number"
                        value={P2}
                        onChange={(e) => setP2(e.target.value)}
                        placeholder="Leave blank to solve"
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        V₂ (L)
                      </label>
                      <input
                        type="number"
                        value={V2}
                        onChange={(e) => setV2(e.target.value)}
                        placeholder="Leave blank to solve"
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        T₂ (K)
                      </label>
                      <input
                        type="number"
                        value={T2}
                        onChange={(e) => setT2(e.target.value)}
                        placeholder="Leave blank to solve"
                        className="input-premium w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boyle's Law */}
          {mode === 'boyles-law' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">P₁V₁ = P₂V₂</div>
                <div className="text-sm text-gray-600 mt-1">
                  (constant T, n) - Pressure ∝ 1/Volume
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    P₁ (atm)
                  </label>
                  <input
                    type="number"
                    value={P1}
                    onChange={(e) => setP1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    V₁ (L)
                  </label>
                  <input
                    type="number"
                    value={V1}
                    onChange={(e) => setV1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    V₂ (L)
                  </label>
                  <input
                    type="number"
                    value={V2}
                    onChange={(e) => setV2(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">P₂ will be calculated</div>
                </div>
              </div>
            </div>
          )}

          {/* Charles's Law */}
          {mode === 'charles-law' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">V₁/T₁ = V₂/T₂</div>
                <div className="text-sm text-gray-600 mt-1">
                  (constant P, n) - Volume ∝ Temperature
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    V₁ (L)
                  </label>
                  <input
                    type="number"
                    value={V1}
                    onChange={(e) => setV1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    T₁ (K)
                  </label>
                  <input
                    type="number"
                    value={T1}
                    onChange={(e) => setT1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    T₂ (K)
                  </label>
                  <input
                    type="number"
                    value={T2}
                    onChange={(e) => setT2(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">V₂ will be calculated</div>
                </div>
              </div>
            </div>
          )}

          {/* Gay-Lussac's Law */}
          {mode === 'gay-lussacs-law' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">P₁/T₁ = P₂/T₂</div>
                <div className="text-sm text-gray-600 mt-1">
                  (constant V, n) - Pressure ∝ Temperature
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    P₁ (atm)
                  </label>
                  <input
                    type="number"
                    value={P1}
                    onChange={(e) => setP1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    T₁ (K)
                  </label>
                  <input
                    type="number"
                    value={T1}
                    onChange={(e) => setT1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    T₂ (K)
                  </label>
                  <input
                    type="number"
                    value={T2}
                    onChange={(e) => setT2(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">P₂ will be calculated</div>
                </div>
              </div>
            </div>
          )}

          {/* Avogadro's Law */}
          {mode === 'avogadros-law' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">V₁/n₁ = V₂/n₂</div>
                <div className="text-sm text-gray-600 mt-1">
                  (constant P, T) - Volume ∝ Moles
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    V₁ (L)
                  </label>
                  <input
                    type="number"
                    value={V1}
                    onChange={(e) => setV1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    n₁ (mol)
                  </label>
                  <input
                    type="number"
                    value={n}
                    onChange={(e) => setN(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    n₂ (mol)
                  </label>
                  <input
                    type="number"
                    value={T2}
                    onChange={(e) => setT2(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">V₂ will be calculated</div>
                </div>
              </div>
            </div>
          )}

          {/* Dalton's Law */}
          {mode === 'daltons-law' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">
                  P_total = P₁ + P₂ + P₃ + ...
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Law of Partial Pressures
                </div>
              </div>

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
                      className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none text-gray-900"
                    />
                    <input
                      type="number"
                      value={pp.pressure}
                      onChange={(e) => {
                        const newPP = [...partialPressures]
                        newPP[index].pressure = parseFloat(e.target.value)
                        setPartialPressures(newPP)
                      }}
                      className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                    <span className="w-12">atm</span>
                    <button
                      onClick={() => {
                        setPartialPressures(partialPressures.filter((_, i) => i !== index))
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setPartialPressures([
                    ...partialPressures,
                    { gas: 'Gas', pressure: 0.1, unit: 'atm' },
                  ])
                }}
                className="w-full px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-semibold hover:bg-pink-200 transition-colors"
              >
                + Add Gas
              </button>
            </div>
          )}

          {/* Graham's Law */}
          {mode === 'grahams-law' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-2xl font-bold text-pink-600">
                  rate₁/rate₂ = √(M₂/M₁)
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Lighter gases effuse/diffuse faster
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Molar Mass 1 (g/mol)
                  </label>
                  <input
                    type="number"
                    value={M1}
                    onChange={(e) => setM1(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Molar Mass 2 (g/mol)
                  </label>
                  <input
                    type="number"
                    value={M2}
                    onChange={(e) => setM2(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate 1 (optional, default=1)
                  </label>
                  <input
                    type="number"
                    value={rate1}
                    onChange={(e) => setRate1(e.target.value)}
                    placeholder="1.0"
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">rate₂ will be calculated</div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Example: H₂ (M=2) vs O₂ (M=32) → H₂ effuses 4x faster!
              </div>
            </div>
          )}

          {/* Van der Waals */}
          {mode === 'van-der-waals' && (
            <div className="space-y-4">
              <div className="text-center py-4 bg-pink-50 rounded-lg mb-4">
                <div className="text-xl font-bold text-pink-600">
                  [P + a(n/V)²](V - nb) = nRT
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Real Gas Equation (accounts for molecular size & interactions)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Gas
                </label>
                <select
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moles (mol)
                  </label>
                  <input
                    type="number"
                    value={vdwN}
                    onChange={(e) => setVdwN(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume (L)
                  </label>
                  <input
                    type="number"
                    value={vdwV}
                    onChange={(e) => setVdwV(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (K)
                  </label>
                  <input
                    type="number"
                    value={vdwT}
                    onChange={(e) => setVdwT(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">Pressure will be calculated</div>
                </div>
              </div>

              {VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS] && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  Constants: a = {VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS].a}{' '}
                  L²·atm/mol², b = {VAN_DER_WAALS_CONSTANTS[selectedGas as keyof typeof VAN_DER_WAALS_CONSTANTS].b}{' '}
                  L/mol
                </div>
              )}
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={calculate}
            className="btn-premium glow-premium w-full mt-6 px-8 py-4 text-lg"
          >
            🚀 Calculate Results
          </button>

          {/* Quick Examples */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => loadExample('ideal-gas')}
              className="px-3 py-1 text-sm bg-surface hover:bg-surface-hover text-foreground rounded transition-colors"
            >
              Example: STP Conditions
            </button>
            <button
              onClick={() => loadExample('daltons-law')}
              className="px-3 py-1 text-sm bg-surface hover:bg-surface-hover text-foreground rounded transition-colors"
            >
              Example: Air Composition
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="premium-card border-2 border-red-300 p-6 mb-6 bg-red-50/50">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <span className="text-2xl">⚠️</span>
              Error
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="premium-card p-8 mb-6 bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>✨</span> Result
            </h2>
            <div className="text-5xl md:text-6xl font-bold mb-2 animate-pulse-premium">{result}</div>
          </div>
        )}

        {/* Step-by-Step Solution */}
        {steps.length > 0 && (
          <div className="premium-card p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
              <span className="text-2xl">📝</span>
              Step-by-Step Solution
            </h2>
            <div className="space-y-2 font-mono text-sm bg-surface/50 p-6 rounded-lg">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={step === '' ? 'h-2' : 'text-foreground'}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference Info */}
        <div className="premium-card p-6">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Quick Reference</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-pink-600 mb-2">Gas Constants</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• R = 0.08206 L·atm/(mol·K)</li>
                <li>• R = 8.314 J/(mol·K)</li>
                <li>• R = 62.36 L·mmHg/(mol·K)</li>
                <li>• STP: 273.15 K, 1 atm, 22.4 L/mol</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-pink-600 mb-2">Temperature Conversions</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• K = °C + 273.15</li>
                <li>• °C = K - 273.15</li>
                <li>• °F = (9/5)°C + 32</li>
                <li>• Always use Kelvin in gas law calculations!</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-pink-50 rounded-lg">
            <h3 className="font-semibold text-pink-700 mb-2">💡 Key Relationships</h3>
            <ul className="space-y-1 text-sm text-pink-600">
              <li>• Boyle: P ↑ → V ↓ (inverse)</li>
              <li>• Charles: T ↑ → V ↑ (direct)</li>
              <li>• Gay-Lussac: T ↑ → P ↑ (direct)</li>
              <li>• Avogadro: n ↑ → V ↑ (direct)</li>
              <li>• Real gases deviate from ideal at high P, low T</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
