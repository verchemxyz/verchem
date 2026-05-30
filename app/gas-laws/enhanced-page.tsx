'use client'

import { useState } from 'react'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
  ErrorBanner,
} from '@/components/lab'
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
    <CalcShell
      eyebrow="Physical chemistry · uncertainty & citations"
      title="Enhanced Ideal Gas Calculator"
      subtitle="Compute P, V, n, or T with propagated measurement uncertainty."
      backHref="/gas-laws"
      backLabel="Gas Laws"
      maxWidth="6xl"
    >
      <Card className="p-6">
        <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
          <div className="space-y-1">
            <SectionTitle>Inputs</SectionTitle>
            <p className="text-sm text-muted-foreground">
              Enter measured values and their standard uncertainties.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 bg-muted text-foreground border border-border rounded-full font-mono">
              R = {GAS_CONSTANT.atm} L·atm·mol⁻¹·K⁻¹
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Field label="Solve for">
              <div className="flex flex-wrap gap-2">
                {(['P', 'V', 'n', 'T'] as SolveFor[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSolveFor(key)}
                    aria-pressed={solveFor === key}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium border min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      solveFor === key
                        ? 'bg-primary-500 text-primary-foreground border-primary-500'
                        : 'bg-card text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Pressure P (atm)">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={pressure}
                    onChange={(e) => setPressure(e.target.value)}
                    disabled={solveFor === 'P'}
                    aria-label="Pressure value (atm)"
                    className="input-premium flex-1 disabled:opacity-60"
                  />
                  <input
                    type="number"
                    value={pressureUnc}
                    onChange={(e) => setPressureUnc(e.target.value)}
                    aria-label="Pressure uncertainty"
                    className="input-premium w-24"
                    placeholder="σP"
                  />
                </div>
              </Field>

              <Field label="Volume V (L)">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    disabled={solveFor === 'V'}
                    aria-label="Volume value (L)"
                    className="input-premium flex-1 disabled:opacity-60"
                  />
                  <input
                    type="number"
                    value={volumeUnc}
                    onChange={(e) => setVolumeUnc(e.target.value)}
                    aria-label="Volume uncertainty"
                    className="input-premium w-24"
                    placeholder="σV"
                  />
                </div>
              </Field>

              <Field label="Moles n (mol)">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={moles}
                    onChange={(e) => setMoles(e.target.value)}
                    disabled={solveFor === 'n'}
                    aria-label="Moles value (mol)"
                    className="input-premium flex-1 disabled:opacity-60"
                  />
                  <input
                    type="number"
                    value={molesUnc}
                    onChange={(e) => setMolesUnc(e.target.value)}
                    aria-label="Moles uncertainty"
                    className="input-premium w-24"
                    placeholder="σn"
                  />
                </div>
              </Field>

              <Field label="Temperature (°C)">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(e.target.value)}
                    disabled={solveFor === 'T'}
                    aria-label="Temperature value (°C)"
                    className="input-premium flex-1 disabled:opacity-60"
                  />
                  <input
                    type="number"
                    value={temperatureUncC}
                    onChange={(e) => setTemperatureUncC(e.target.value)}
                    aria-label="Temperature uncertainty (°C)"
                    className="input-premium w-24"
                    placeholder="σT (°C)"
                  />
                </div>
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={handleCalculate} className="w-full">
              Calculate with uncertainty
            </Button>

            {error && <ErrorBanner>{error}</ErrorBanner>}

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
      </Card>

      {steps.length > 0 && (
        <Card className="p-6">
          <SectionTitle className="mb-4">Calculation details</SectionTitle>
          <pre className="bg-muted border border-border rounded-md p-4 text-sm text-foreground whitespace-pre-wrap font-mono overflow-x-auto">
            {steps.join('\n')}
          </pre>
        </Card>
      )}
    </CalcShell>
  )
}

