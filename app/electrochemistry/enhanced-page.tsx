'use client'

// VerChem - Enhanced Electrochemistry Page (Uncertainty)

import { useState } from 'react'
import Link from 'next/link'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-600">Ver</span>
              <span className="text-gray-900">Chem</span>
            </h1>
          </Link>
          <Link
            href="/electrochemistry"
            className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            ← Back to Electrochemistry
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
            Enhanced Electrochemistry
          </h2>
          <p className="text-gray-600">
            Cell potential, ΔG°, and Nernst equation with propagated uncertainties.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-gray-900">Standard Cell Potential (E°cell)</h3>
            <p className="text-sm text-gray-500">
              Enter standard electrode potentials and their uncertainties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cathode E° (V)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={cathodeE0}
                  onChange={(e) => setCathodeE0(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={cathodeUnc}
                  onChange={(e) => setCathodeUnc(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="σE°"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anode E° (V)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={anodeE0}
                  onChange={(e) => setAnodeE0(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={anodeUnc}
                  onChange={(e) => setAnodeUnc(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="σE°"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Electrons transferred (n)
              </label>
              <input
                type="number"
                min={1}
                value={electrons}
                onChange={(e) => setElectrons(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reaction quotient Q
              </label>
              <input
                type="number"
                value={nernstQ}
                onChange={(e) => setNernstQ(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
                Temperature (K) and σT
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={nernstTemp}
                  onChange={(e) => setNernstTemp(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  value={nernstTempUnc}
                  onChange={(e) => setNernstTempUnc(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="σT"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Calculate with Uncertainty
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
              {error}
            </div>
          )}

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
        </section>

        {steps.length > 0 && (
          <section className="bg-white rounded-xl shadow-md p-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Calculation Details</h3>
            <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {steps.join('\n')}
            </pre>
          </section>
        )}
      </main>
    </div>
  )
}
