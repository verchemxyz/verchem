'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  idealGasLaw,
  celsiusToKelvin,
} from '@/lib/calculations/gas-laws'
import { GAS_CONSTANT } from '@/lib/constants/physical-constants'
import {
  calculateIdealGasUncertainty,
  formatValueWithUncertainty,
  type MeasurementWithUncertainty,
} from '@/lib/utils/error-analysis'
import { getCitationForCalculation } from '@/lib/utils/citations'
import { ScientificResult } from '@/components/ScientificResult'

type SolveFor = 'P' | 'V' | 'n' | 'T'

export default function EnhancedGasLawsPage() {
  const [solveFor, setSolveFor] = useState<SolveFor>('P')
  const [pressure, setPressure] = useState('1.00')
  const [pressureUnc, setPressureUnc] = useState('0.01')
  const [volume, setVolume] = useState('22.4')
  const [volumeUnc, setVolumeUnc] = useState('0.1')
  const [moles, setMoles] = useState('1.0')
  const [molesUnc, setMolesUnc] = useState('0.01')
  const [temperatureC, setTemperatureC] = useState('0.0')
  const [temperatureUncC, setTemperatureUncC] = useState('0.5')

  const [result, setResult] = useState<MeasurementWithUncertainty | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setResult(null)
    setSteps([])

    try {
      const P = parseFloat(pressure)
      const dP = parseFloat(pressureUnc)
      const V = parseFloat(volume)
      const dV = parseFloat(volumeUnc)
      const n = parseFloat(moles)
      const dn = parseFloat(molesUnc)
      const T_C = parseFloat(temperatureC)
      const dT_C = parseFloat(temperatureUncC)

      const T = celsiusToKelvin(T_C)
      const dT = dT_C

      const R: MeasurementWithUncertainty = {
        value: GAS_CONSTANT.atm,
        uncertainty: 0, // treat R as exact for now
        unit: 'L·atm/(mol·K)',
      }

      const Pm: MeasurementWithUncertainty = { value: P, uncertainty: dP, unit: 'atm' }
      const Vm: MeasurementWithUncertainty = { value: V, uncertainty: dV, unit: 'L' }
      const nm: MeasurementWithUncertainty = { value: n, uncertainty: dn, unit: 'mol' }
      const Tm: MeasurementWithUncertainty = { value: T, uncertainty: dT, unit: 'K' }

      const igInputs: { P?: number; V?: number; n?: number; T?: number } = {}
      if (solveFor !== 'P') igInputs.P = P
      if (solveFor !== 'V') igInputs.V = V
      if (solveFor !== 'n') igInputs.n = n
      if (solveFor !== 'T') igInputs.T = T

      const solved = idealGasLaw(igInputs)

      const uncertainties = calculateIdealGasUncertainty(Pm, Vm, nm, Tm, R)

      let measurement: MeasurementWithUncertainty
      let label = ''
      let unit = ''

      switch (solveFor) {
        case 'P':
          measurement = {
            value: solved.P,
            uncertainty: uncertainties.pressure.uncertainty,
            unit: 'atm',
          }
          label = 'Pressure (P)'
          unit = 'atm'
          break
        case 'V':
          measurement = {
            value: solved.V,
            uncertainty: uncertainties.volume.uncertainty,
            unit: 'L',
          }
          label = 'Volume (V)'
          unit = 'L'
          break
        case 'n':
          measurement = {
            value: solved.n,
            uncertainty: uncertainties.moles.uncertainty,
            unit: 'mol',
          }
          label = 'Amount (n)'
          unit = 'mol'
          break
        case 'T':
          measurement = {
            value: solved.T,
            uncertainty: uncertainties.temperature.uncertainty,
            unit: 'K',
          }
          label = 'Temperature (T)'
          unit = 'K'
          break
      }

      const citation = getCitationForCalculation('ideal_gas')

      setResult(measurement)

      setSteps([
        'Ideal Gas Law with Uncertainty: PV = nRT',
        '',
        'Inputs (with uncertainties):',
        `  P = ${formatValueWithUncertainty(Pm)}`,
        `  V = ${formatValueWithUncertainty(Vm)}`,
        `  n = ${formatValueWithUncertainty(nm)}`,
        `  T = ${formatValueWithUncertainty(Tm)}`,
        '',
        `Solving for ${label}:`,
        `  R = ${R.value} ${R.unit}`,
        '',
        `Result: ${formatValueWithUncertainty({ ...measurement, unit })}`,
        '',
        `Source: ${citation.formula}`,
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              ← Back to Home
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            Enhanced Gas Laws • Uncertainty & Citations
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 bg-clip-text text-transparent">
            Enhanced Ideal Gas Calculator
          </h1>
          <p className="text-gray-600">
            Compute P, V, n, or T with propagated measurement uncertainty.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">Inputs</h2>
              <p className="text-sm text-gray-500">
                Enter measured values and their standard uncertainties.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                R = {GAS_CONSTANT.atm} L·atm·mol⁻¹·K⁻¹
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solve for
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['P', 'V', 'n', 'T'] as SolveFor[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSolveFor(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                        solveFor === key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pressure P (atm)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={pressure}
                      onChange={(e) => setPressure(e.target.value)}
                      disabled={solveFor === 'P'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <input
                      type="number"
                      value={pressureUnc}
                      onChange={(e) => setPressureUnc(e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="σP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volume V (L)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      disabled={solveFor === 'V'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <input
                      type="number"
                      value={volumeUnc}
                      onChange={(e) => setVolumeUnc(e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="σV"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moles n (mol)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={moles}
                      onChange={(e) => setMoles(e.target.value)}
                      disabled={solveFor === 'n'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <input
                      type="number"
                      value={molesUnc}
                      onChange={(e) => setMolesUnc(e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="σn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°C)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={temperatureC}
                      onChange={(e) => setTemperatureC(e.target.value)}
                      disabled={solveFor === 'T'}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <input
                      type="number"
                      value={temperatureUncC}
                      onChange={(e) => setTemperatureUncC(e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="σT (°C)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCalculate}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Calculate with Uncertainty
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              {result && (
                <ScientificResult
                  label="Result"
                  value={result.value}
                  uncertainty={result.uncertainty}
                  unit={result.unit}
                />
              )}
            </div>
          </div>
        </section>

        {steps.length > 0 && (
          <section className="bg-white rounded-xl shadow-md p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Calculation Details</h2>
            <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {steps.join('\n')}
            </pre>
          </section>
        )}
      </main>
    </div>
  )
}

