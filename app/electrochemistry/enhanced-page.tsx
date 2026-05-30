'use client'

// VerChem - Enhanced Electrochemistry Page (Uncertainty)

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
  calculateCellPotential,
  calculateNernstEquation,
} from '@/lib/calculations/electrochemistry'
import {
  calculateCellPotentialUncertainty,
  type MeasurementWithUncertainty,
  formatValueWithUncertainty,
} from '@/lib/utils/error-analysis'
import { getCitationForCalculation } from '@/lib/utils/citations'
import { ScientificResult } from '@/components/ScientificResult'

export default function EnhancedElectrochemistryPage() {
  const [cathodeE0, setCathodeE0] = useState('0.80')
  const [cathodeUnc, setCathodeUnc] = useState('0.01')
  const [anodeE0, setAnodeE0] = useState('-0.76')
  const [anodeUnc, setAnodeUnc] = useState('0.01')
  const [electrons, setElectrons] = useState('2')

  const [nernstQ, setNernstQ] = useState('1.0')
  const [nernstTemp, setNernstTemp] = useState('298.15')
  const [nernstTempUnc, setNernstTempUnc] = useState('1.0')

  const [cellResult, setCellResult] = useState<MeasurementWithUncertainty | null>(null)
  const [deltaGResult, setDeltaGResult] = useState<MeasurementWithUncertainty | null>(null)
  const [nernstResult, setNernstResult] = useState<MeasurementWithUncertainty | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setCellResult(null)
    setDeltaGResult(null)
    setNernstResult(null)
    setSteps([])

    try {
      const Ec = parseFloat(cathodeE0)
      const dEc = parseFloat(cathodeUnc)
      const Ea = parseFloat(anodeE0)
      const dEa = parseFloat(anodeUnc)
      const n = parseInt(electrons, 10) || 1
      const Q = parseFloat(nernstQ)
      const T = parseFloat(nernstTemp)
      const dT = parseFloat(nernstTempUnc)

      const cathode: MeasurementWithUncertainty = { value: Ec, uncertainty: dEc, unit: 'V' }
      const anode: MeasurementWithUncertainty = { value: Ea, uncertainty: dEa, unit: 'V' }

      const cell = calculateCellPotential(Ec, Ea, n)
      const cellUncertainty = calculateCellPotentialUncertainty(cathode, anode)

      const cellMeasurement: MeasurementWithUncertainty = {
        value: cell.cellPotential,
        uncertainty: cellUncertainty.uncertainty,
        unit: 'V',
      }

      const deltaGMeasurement: MeasurementWithUncertainty = {
        value: cell.deltaG,
        uncertainty: Math.abs(cellUncertainty.uncertainty * n), // simplified
        unit: 'J/mol',
      }

      const nernst = calculateNernstEquation(
        cell.cellPotential, // E0
        n, // electrons transferred
        Q, // reaction quotient
        T // temperature
      )

      const nernstMeasurement: MeasurementWithUncertainty = {
        value: nernst.E,
        uncertainty: cellMeasurement.uncertainty,
        unit: 'V',
      }

      const cellCitation = getCitationForCalculation('cell_potential')
      const nernstCitation = getCitationForCalculation('nernst')

      setCellResult(cellMeasurement)
      setDeltaGResult(deltaGMeasurement)
      setNernstResult(nernstMeasurement)

      setSteps([
        'Electrochemistry Uncertainty Analysis',
        '',
        'Inputs:',
        `  Cathode E° = ${formatValueWithUncertainty(cathode)}`,
        `  Anode E°   = ${formatValueWithUncertainty(anode)}`,
        `  n (electrons) = ${n}`,
        `  Q (reaction quotient) = ${Q}`,
        `  T = ${T} K (σT = ${dT})`,
        '',
        'Calculations:',
        '  E°cell = E°cathode − E°anode',
        `  ΔG° = −nFE°`,
        '  E = E° − (RT/nF) ln(Q)',
        '',
        `E°cell (with uncertainty): ${formatValueWithUncertainty(cellMeasurement)}`,
        `ΔG°   (approx. uncertainty): ${formatValueWithUncertainty(deltaGMeasurement)}`,
        `E (Nernst, with uncertainty): ${formatValueWithUncertainty(nernstMeasurement)}`,
        '',
        `Sources:`,
        `  ${cellCitation.formula}`,
        `  ${nernstCitation.formula}`,
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation error')
    }
  }

  return (
    <CalcShell
      eyebrow="Physical chemistry · uncertainty"
      title="Enhanced Electrochemistry"
      subtitle="Cell potential, ΔG°, and Nernst equation with propagated uncertainties."
      backHref="/electrochemistry"
      backLabel="Electrochemistry"
      maxWidth="7xl"
    >
      <Card className="p-6 space-y-6">
        <div className="space-y-1">
          <SectionTitle>Standard Cell Potential (E°cell)</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Enter standard electrode potentials and their uncertainties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cathode E° (V)">
            <div className="flex gap-2">
              <input
                type="number"
                value={cathodeE0}
                onChange={(e) => setCathodeE0(e.target.value)}
                className="input-premium flex-1"
              />
              <input
                type="number"
                value={cathodeUnc}
                onChange={(e) => setCathodeUnc(e.target.value)}
                className="input-premium w-24"
                placeholder="σE°"
                aria-label="Cathode E° uncertainty"
              />
            </div>
          </Field>

          <Field label="Anode E° (V)">
            <div className="flex gap-2">
              <input
                type="number"
                value={anodeE0}
                onChange={(e) => setAnodeE0(e.target.value)}
                className="input-premium flex-1"
              />
              <input
                type="number"
                value={anodeUnc}
                onChange={(e) => setAnodeUnc(e.target.value)}
                className="input-premium w-24"
                placeholder="σE°"
                aria-label="Anode E° uncertainty"
              />
            </div>
          </Field>

          <Field label="Electrons transferred (n)">
            <input
              type="number"
              min={1}
              value={electrons}
              onChange={(e) => setElectrons(e.target.value)}
              className="input-premium w-full"
            />
          </Field>

          <div>
            <Field label="Reaction quotient Q">
              <input
                type="number"
                value={nernstQ}
                onChange={(e) => setNernstQ(e.target.value)}
                className="input-premium w-full"
              />
            </Field>
            <label className="block text-sm font-medium text-foreground mt-3 mb-1.5">
              Temperature (K) and σT
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={nernstTemp}
                onChange={(e) => setNernstTemp(e.target.value)}
                className="input-premium flex-1"
              />
              <input
                type="number"
                value={nernstTempUnc}
                onChange={(e) => setNernstTempUnc(e.target.value)}
                className="input-premium w-24"
                placeholder="σT"
                aria-label="Temperature uncertainty"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleCalculate}>
          Calculate with Uncertainty
        </Button>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {cellResult && (
            <ScientificResult
              label="E°cell"
              value={cellResult.value}
              uncertainty={cellResult.uncertainty}
              unit={cellResult.unit}
            />
          )}
          {deltaGResult && (
            <ScientificResult
              label="ΔG°"
              value={deltaGResult.value}
              uncertainty={deltaGResult.uncertainty}
              unit={deltaGResult.unit}
            />
          )}
          {nernstResult && (
            <ScientificResult
              label="E (Nernst)"
              value={nernstResult.value}
              uncertainty={nernstResult.uncertainty}
              unit={nernstResult.unit}
            />
          )}
        </div>
      </Card>

      {steps.length > 0 && (
        <Card className="p-6 space-y-3">
          <SectionTitle>Calculation Details</SectionTitle>
          <pre className="bg-muted border border-border rounded-md p-4 text-sm text-foreground whitespace-pre-wrap font-mono overflow-x-auto">
            {steps.join('\n')}
          </pre>
        </Card>
      )}
    </CalcShell>
  )
}
