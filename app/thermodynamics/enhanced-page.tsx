'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  ErrorBanner,
} from '@/components/lab'
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
    <CalcShell
      eyebrow="Physical chemistry · uncertainty analysis"
      title="Enhanced Gibbs Energy & Equilibrium"
      subtitle="Analyse ΔG° and K with propagated uncertainties for thermodynamic reactions."
      backHref="/thermodynamics"
      backLabel="Basic calculator"
      maxWidth="6xl"
      action={
        <Link
          href="/thermodynamics"
          className="inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Basic calculator
        </Link>
      }
    >
      <Card className="p-6 space-y-6">
        <div className="space-y-1">
          <SectionTitle>Inputs</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Enter standard enthalpy, entropy, and temperature with their uncertainties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              ΔH° (kJ/mol)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={deltaH}
                onChange={(e) => setDeltaH(e.target.value)}
                className="input-premium flex-1"
                aria-label="ΔH° value (kJ/mol)"
              />
              <input
                type="number"
                value={deltaHUnc}
                onChange={(e) => setDeltaHUnc(e.target.value)}
                className="input-premium w-24"
                placeholder="σΔH"
                aria-label="ΔH° uncertainty"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              ΔS° (J/(mol·K))
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={deltaS}
                onChange={(e) => setDeltaS(e.target.value)}
                className="input-premium flex-1"
                aria-label="ΔS° value (J/(mol·K))"
              />
              <input
                type="number"
                value={deltaSUnc}
                onChange={(e) => setDeltaSUnc(e.target.value)}
                className="input-premium w-24"
                placeholder="σΔS"
                aria-label="ΔS° uncertainty"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Temperature (K)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="input-premium flex-1"
                aria-label="Temperature value (K)"
              />
              <input
                type="number"
                value={temperatureUnc}
                onChange={(e) => setTemperatureUnc(e.target.value)}
                className="input-premium w-24"
                placeholder="σT"
                aria-label="Temperature uncertainty"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Button onClick={handleCalculate}>
            Calculate ΔG° and K with Uncertainty
          </Button>

          {error && <ErrorBanner>{error}</ErrorBanner>}

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
      </Card>

      {steps.length > 0 && (
        <Card className="p-6 space-y-3">
          <SectionTitle>Calculation details</SectionTitle>
          <pre className="bg-muted border border-border rounded-md p-4 text-sm text-foreground whitespace-pre-wrap font-mono overflow-x-auto">
            {steps.join('\n')}
          </pre>
        </Card>
      )}
    </CalcShell>
  )
}

