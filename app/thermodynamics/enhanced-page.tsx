'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  calculateDeltaG,
  calculateEquilibriumConstant,
  STANDARD_TEMPERATURE,
} from '@/lib/calculations/thermodynamics'
import {
  calculateEquilibriumConstantUncertainty,
  type MeasurementWithUncertainty,
  formatValueWithUncertainty,
} from '@/lib/utils/error-analysis'
import { GAS_CONSTANT } from '@/lib/constants/physical-constants'
import { getCitationForCalculation } from '@/lib/utils/citations'
import { ScientificResult } from '@/components/ScientificResult'

export default function EnhancedThermodynamicsPage() {
  const [deltaH, setDeltaH] = useState('-285.8') // kJ/mol
  const [deltaHUnc, setDeltaHUnc] = useState('0.5')
  const [deltaS, setDeltaS] = useState(' -163.3') // J/(mol·K)
  const [deltaSUnc, setDeltaSUnc] = useState('1.0')
  const [temperature, setTemperature] = useState(STANDARD_TEMPERATURE.toString()) // K
  const [temperatureUnc, setTemperatureUnc] = useState('1.0')

  const [deltaGResult, setDeltaGResult] = useState<MeasurementWithUncertainty | null>(null)
  const [KResult, setKResult] = useState<MeasurementWithUncertainty | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setDeltaGResult(null)
    setKResult(null)
    setSteps([])

    try {
      const dH = parseFloat(deltaH) // kJ/mol
      const dHUnc = parseFloat(deltaHUnc)
      const dS = parseFloat(deltaS) // J/(mol·K)
      const dSUnc = parseFloat(deltaSUnc)
      const T = parseFloat(temperature)
      const TUnc = parseFloat(temperatureUnc)

      // Convert ΔH to J/mol for consistent units
      const deltaH_J = dH * 1000
      const deltaHMeasurement: MeasurementWithUncertainty = {
        value: deltaH_J,
        uncertainty: dHUnc * 1000,
        unit: 'J/mol',
      }

      const deltaSMeasurement: MeasurementWithUncertainty = {
        value: dS,
        uncertainty: dSUnc,
        unit: 'J/(mol·K)',
      }

      const temperatureMeasurement: MeasurementWithUncertainty = {
        value: T,
        uncertainty: TUnc,
        unit: 'K',
      }

      const gasConstantMeasurement: MeasurementWithUncertainty = {
        value: GAS_CONSTANT.SI,
        uncertainty: 0,
        unit: 'J/(mol·K)',
      }

      // Deterministic calculations
      const deltaGResult = calculateDeltaG(dH, dS / 1000, T / 1000)
      const KResult = calculateEquilibriumConstant(deltaGResult.deltaG)

      // Uncertainty for ΔG° = ΔH° - TΔS°
      const deltaGValue = deltaGResult.deltaG * 1000 // back to J/mol
      const deltaGUncertainty = calculateEquilibriumConstantUncertainty(
        {
          value: deltaGValue,
          uncertainty: Math.abs(deltaHMeasurement.uncertainty) + Math.abs(deltaSMeasurement.uncertainty * T),
        },
        temperatureMeasurement,
        gasConstantMeasurement
      )

      const equilibriumUncertainty = calculateEquilibriumConstantUncertainty(
        deltaHMeasurement,
        temperatureMeasurement,
        gasConstantMeasurement
      )

      const citationDeltaG = getCitationForCalculation('gibbs_free_energy')
      const citationK = getCitationForCalculation('equilibrium_constant')

      setDeltaGResult({
        value: deltaGValue,
        uncertainty: deltaGUncertainty.uncertainty,
        unit: 'J/mol',
      })

      setKResult({
        value: KResult.K,
        uncertainty: equilibriumUncertainty.uncertainty,
      })

      setSteps([
        'Thermodynamic Uncertainty Analysis',
        '',
        'Inputs:',
        `  ΔH° = ${formatValueWithUncertainty(deltaHMeasurement)}`,
        `  ΔS° = ${formatValueWithUncertainty(deltaSMeasurement)}`,
        `  T = ${formatValueWithUncertainty(temperatureMeasurement)}`,
        '',
        'Calculations:',
        '  ΔG° = ΔH° - TΔS°',
        `  K = e^(−ΔG°/RT)`,
        '',
        `ΔG° (with uncertainty): ${formatValueWithUncertainty({
          value: deltaGValue,
          uncertainty: deltaGUncertainty.uncertainty,
          unit: 'J/mol',
        })}`,
        `K (with uncertainty): ${formatValueWithUncertainty({
          value: KResult.K,
          uncertainty: equilibriumUncertainty.uncertainty,
        })}`,
        '',
        `Sources:`,
        `  ${citationDeltaG.formula}`,
        `  ${citationK.formula}`,
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation error')
    }
  }

  return (
    <div className="min-h-screen hero-gradient-premium">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Enhanced Thermodynamics</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/thermodynamics"
              className="badge-premium"
            >
              ← Basic Calculator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="text-center mb-12">
          <div className="badge-premium mb-4">⚡ Uncertainty Analysis • Scientific Citations</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Enhanced Gibbs Energy</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              & Equilibrium
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyse ΔG° and K with propagated uncertainties for thermodynamic reactions
          </p>
        </section>

        <section className="premium-card p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-primary-600">Inputs</h2>
            <p className="text-sm text-muted-foreground">
              Enter standard enthalpy, entropy, and temperature with their uncertainties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ΔH° (kJ/mol)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={deltaH}
                  onChange={(e) => setDeltaH(e.target.value)}
                  className="input-premium flex-1"
                />
                <input
                  type="number"
                  value={deltaHUnc}
                  onChange={(e) => setDeltaHUnc(e.target.value)}
                  className="input-premium w-24"
                  placeholder="σΔH"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ΔS° (J/(mol·K))
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={deltaS}
                  onChange={(e) => setDeltaS(e.target.value)}
                  className="input-premium flex-1"
                />
                <input
                  type="number"
                  value={deltaSUnc}
                  onChange={(e) => setDeltaSUnc(e.target.value)}
                  className="input-premium w-24"
                  placeholder="σΔS"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (K)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="input-premium flex-1"
                />
                <input
                  type="number"
                  value={temperatureUnc}
                  onChange={(e) => setTemperatureUnc(e.target.value)}
                  className="input-premium w-24"
                  placeholder="σT"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <button
              onClick={handleCalculate}
              className="btn-premium glow-premium py-3 text-lg"
            >
              ⚡ Calculate ΔG° and K with Uncertainty
            </button>

            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-300 text-red-700 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-3">
              {deltaGResult && (
                <ScientificResult
                  label="ΔG°"
                  value={deltaGResult.value}
                  uncertainty={deltaGResult.uncertainty}
                  unit={deltaGResult.unit}
                />
              )}
              {KResult && (
                <ScientificResult
                  label="Equilibrium Constant K"
                  value={KResult.value}
                  uncertainty={KResult.uncertainty}
                />
              )}
            </div>
          </div>
        </section>

        {steps.length > 0 && (
          <section className="premium-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-primary-600">Calculation Details</h2>
            <pre className="bg-surface rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap font-mono">
              {steps.join('\n')}
            </pre>
          </section>
        )}
      </main>
    </div>
  )
}

