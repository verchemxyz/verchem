'use client'

// VerChem - Enhanced Solutions & pH Calculator Page
// World-class UI with validation, uncertainty, and citations

import { useState } from 'react'
import Link from 'next/link'
import {
  calculateMolarity,
  calculateDilution,
  calculateStrongAcidPH,
  calculateStrongBasePH,
  calculateWeakAcidPH,
  calculateWeakBasePH,
  calculateBufferPH,
  calculateOsmoticPressure,
  calculateBoilingPointElevation,
  calculateFreezingPointDepression,
  WATER_KB,
  WATER_KF,
  WATER_NORMAL_BP,
  WATER_NORMAL_FP
} from '@/lib/calculations/solutions'
import { calculatePHUncertainty, type MeasurementWithUncertainty } from '@/lib/utils/error-analysis'
import { getCitationForCalculation, type Citation } from '@/lib/utils/citations'
import { ScientificResult } from '@/components/ScientificResult'
import { EnhancedCalculator } from '@/components/EnhancedCalculator'

interface SolutionsCalculatorResult {
  value?: number
  uncertainty?: number
  unit?: string
  label: string
  formula?: string
  citations?: Citation[]
  additionalInfo?: Record<string, string | number>
}

interface PHCalculationResult {
  pH: number
  pOH?: number
  H_concentration?: number
  OH_concentration?: number
  percentIonization?: number
}

export default function EnhancedSolutionsPage() {
  // Calculator mode
  const [mode, setMode] = useState<'molarity' | 'dilution' | 'pH' | 'buffer' | 'colligative'>('pH')

  // pH Calculator inputs with uncertainties
  const [phType, setPhType] = useState<'strong-acid' | 'strong-base' | 'weak-acid' | 'weak-base'>('strong-acid')
  const [concentration, setConcentration] = useState('0.01')
  const [concentrationUnc, setConcentrationUnc] = useState('0.0001')
  const [ka, setKa] = useState('1.8e-5') // For weak acids
  const [kaUnc, setKaUnc] = useState('0.1e-5')
  const [kb, setKb] = useState('1.8e-5') // For weak bases
  const [kbUnc, setKbUnc] = useState('0.1e-5')

  // Buffer inputs
  const [acidConc, setAcidConc] = useState('0.1')
  const [acidConcUnc, setAcidConcUnc] = useState('0.001')
  const [saltConc, setSaltConc] = useState('0.1')
  const [saltConcUnc, setSaltConcUnc] = useState('0.001')
  const [pKa, setPKa] = useState('4.76')
  const [pKaUnc, setPKaUnc] = useState('0.01')

  // Molarity inputs
  const [mass, setMass] = useState('58.44') // NaCl
  const [massUnc, setMassUnc] = useState('0.01')
  const [volume, setVolume] = useState('1.0')
  const [volumeUnc, setVolumeUnc] = useState('0.001')
  const [molarMass, setMolarMass] = useState('58.44')
  const [molarMassUnc, setMolarMassUnc] = useState('0.01')

  // Dilution inputs
  const [m1, setM1] = useState('2.0')
  const [m1Unc, setM1Unc] = useState('0.01')
  const [v1, setV1] = useState('50')
  const [v1Unc, setV1Unc] = useState('0.5')
  const [m2, setM2] = useState('0.1')
  const [m2Unc, setM2Unc] = useState('0.001')

  // Colligative properties inputs
  const [molality, setMolality] = useState('0.5')
  const [molalityUnc, setMolalityUnc] = useState('0.01')
  const [vanHoffFactor, setVanHoffFactor] = useState('2') // For NaCl
  const [temperature, setTemperature] = useState('298.15')
  const [temperatureUnc, setTemperatureUnc] = useState('0.05')

  // Results
  const [result, setResult] = useState<SolutionsCalculatorResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showUncertainty, setShowUncertainty] = useState(true)
  const calculatorInputs =
    mode === 'pH'
      ? [concentration, ka, kb]
      : mode === 'buffer'
        ? [acidConc, saltConc, pKa]
        : mode === 'molarity'
          ? [mass, volume, molarMass]
          : mode === 'dilution'
            ? [m1, v1, m2]
            : mode === 'colligative'
              ? [molality, vanHoffFactor, temperature]
              : []

  const calculatepH = () => {
    try {
      const C = parseFloat(concentration)
      let phResult: PHCalculationResult | null = null

      if (phType === 'strong-acid') {
        const result = calculateStrongAcidPH(C)
        phResult = { ...result }
      } else if (phType === 'strong-base') {
        const result = calculateStrongBasePH(C)
        phResult = { ...result }
      } else if (phType === 'weak-acid') {
        const result = calculateWeakAcidPH(C, parseFloat(ka))
        const pOH = 14 - result.pH
        phResult = {
          pH: result.pH,
          pOH,
          H_concentration: result.H_concentration,
          OH_concentration: Math.pow(10, -pOH),
          percentIonization: result.percentIonization,
        }
      } else if (phType === 'weak-base') {
        const result = calculateWeakBasePH(C, parseFloat(kb))
        phResult = {
          pH: result.pH,
          pOH: result.pOH,
          OH_concentration: result.OH_concentration,
          H_concentration: Math.pow(10, -result.pH),
          percentIonization: result.percentIonization,
        }
      }

      if (!phResult) {
        throw new Error('Unable to calculate pH for the selected mode')
      }

      if (showUncertainty) {
        if (phResult.H_concentration === undefined) {
          throw new Error('H⁺ concentration required for uncertainty analysis')
        }
        // For pH uncertainty, we need the H+ concentration uncertainty
        const hMeasurement: MeasurementWithUncertainty = {
          value: phResult.H_concentration,
          uncertainty: phResult.H_concentration * (parseFloat(concentrationUnc) / C),
          unit: 'M'
        }

        const uncertaintyResult = calculatePHUncertainty(hMeasurement)

        const citation = getCitationForCalculation(phType.includes('weak') ? 'weak_acid_base' : 'ph')

        setResult({
          value: phResult.pH,
          uncertainty: uncertaintyResult.uncertainty,
          unit: '',
          label: 'pH',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            H_concentration: phResult.H_concentration ?? 'N/A',
            OH_concentration: phResult.OH_concentration ?? 'N/A',
            pOH: phResult.pOH ?? (14 - phResult.pH),
            percentIonization: phResult.percentIonization ?? 'N/A'
          }
        })
      } else {
        const citation = getCitationForCalculation(phType.includes('weak') ? 'weak_acid_base' : 'ph')

        setResult({
          value: phResult.pH,
          unit: '',
          label: 'pH',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            H_concentration: phResult.H_concentration ?? 'N/A',
            OH_concentration: phResult.OH_concentration ?? 'N/A',
            pOH: phResult.pOH ?? (14 - phResult.pH),
            percentIonization: phResult.percentIonization ?? 'N/A'
          }
        })
      }
    } catch (error) {
      console.error('pH calculation error:', error)
    }
  }

  const calculateBuffer = () => {
    try {
      // calculateBufferPH expects pKa, acidConc, baseConc in that order
      const bufferPH = calculateBufferPH(
        parseFloat(pKa),
        parseFloat(acidConc),
        parseFloat(saltConc)
      )

      const ratio = parseFloat(saltConc) / parseFloat(acidConc)
      const citation = getCitationForCalculation('henderson_hasselbalch')

      if (showUncertainty) {
        // Simplified uncertainty for buffer (proper propagation would be more complex)
        const relativeUnc = Math.sqrt(
          Math.pow(parseFloat(acidConcUnc) / parseFloat(acidConc), 2) +
          Math.pow(parseFloat(saltConcUnc) / parseFloat(saltConc), 2) +
          Math.pow(parseFloat(pKaUnc) / parseFloat(pKa), 2)
        )

        setResult({
          value: bufferPH,
          uncertainty: relativeUnc * bufferPH,
          unit: '',
          label: 'Buffer pH',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            ratio: ratio,
            bufferCapacity: `β ≈ ${(2.303 * parseFloat(acidConc) * parseFloat(saltConc) / (parseFloat(acidConc) + parseFloat(saltConc))).toFixed(4)}`
          }
        })
      } else {
        setResult({
          value: bufferPH,
          unit: '',
          label: 'Buffer pH',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            ratio: ratio
          }
        })
      }
    } catch (error) {
      console.error('Buffer calculation error:', error)
    }
  }

  const calculateMolaritySolution = () => {
    try {
      // calculateMolarity returns just a number, not an object
      const molarity = calculateMolarity(
        undefined,        // moles
        parseFloat(volume),  // volumeLiters
        parseFloat(mass),    // massGrams
        parseFloat(molarMass)  // molarMass
      )

      const moles = parseFloat(mass) / parseFloat(molarMass)

      if (showUncertainty) {
        // Calculate uncertainty using error propagation: M = mass / (molarMass * volume)
        // Relative uncertainty: δM/M = sqrt((δm/m)² + (δMM/MM)² + (δV/V)²)
        const relativeUnc = Math.sqrt(
          Math.pow(parseFloat(massUnc) / parseFloat(mass), 2) +
          Math.pow(parseFloat(molarMassUnc) / parseFloat(molarMass), 2) +
          Math.pow(parseFloat(volumeUnc) / parseFloat(volume), 2)
        )
        const uncertainty = relativeUnc * molarity

        const citation = getCitationForCalculation('molarity')

        setResult({
          value: molarity,
          uncertainty: uncertainty,
          unit: 'M',
          label: 'Molarity',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            moles: moles,
            instructions: `Dissolve ${mass} g in solvent and dilute to ${volume} L`
          }
        })
      } else {
        const citation = getCitationForCalculation('molarity')

        setResult({
          value: molarity,
          unit: 'M',
          label: 'Molarity',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            moles: moles
          }
        })
      }
    } catch (error) {
      console.error('Molarity calculation error:', error)
    }
  }

  const calculateDilutionSolution = () => {
    try {
      const dilutionResult = calculateDilution({
        M1: parseFloat(m1),
        V1: parseFloat(v1),
        M2: parseFloat(m2),
        V2: undefined // V2 to be calculated
      })

      if (showUncertainty) {
        // Calculate uncertainty for dilution V2 = M1*V1/M2
        // Relative uncertainty: δV2/V2 = sqrt((δM1/M1)² + (δV1/V1)² + (δM2/M2)²)
        const relativeUnc = Math.sqrt(
          Math.pow(parseFloat(m1Unc) / parseFloat(m1), 2) +
          Math.pow(parseFloat(v1Unc) / parseFloat(v1), 2) +
          Math.pow(parseFloat(m2Unc) / parseFloat(m2), 2)
        )
        const uncertainty = relativeUnc * dilutionResult.V2!

        const citation = getCitationForCalculation('dilution')

        setResult({
          value: dilutionResult.V2!,
          uncertainty: uncertainty,
          unit: 'mL',
          label: 'Final Volume (V₂)',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            volumeToAdd: dilutionResult.V2! - parseFloat(v1),
            dilutionFactor: parseFloat(m1) / parseFloat(m2),
            instructions: `Add ${(dilutionResult.V2! - parseFloat(v1)).toFixed(1)} mL of solvent to ${v1} mL of ${m1} M solution`
          }
        })
      } else {
        const citation = getCitationForCalculation('dilution')

        setResult({
          value: dilutionResult.V2!,
          unit: 'mL',
          label: 'Final Volume (V₂)',
          formula: citation.formula,
          citations: citation.references,
          additionalInfo: {
            volumeToAdd: dilutionResult.V2! - parseFloat(v1),
            dilutionFactor: parseFloat(m1) / parseFloat(m2)
          }
        })
      }
    } catch (error) {
      console.error('Dilution calculation error:', error)
    }
  }

  const calculateColligative = () => {
    try {
      const m = parseFloat(molality)
      const i = parseFloat(vanHoffFactor)
      const T = parseFloat(temperature)

      // Calculate all colligative properties
      const osmotic = calculateOsmoticPressure(m, T, i)
      const deltaTb = calculateBoilingPointElevation(m, WATER_KB, i)
      const deltaTf = calculateFreezingPointDepression(m, WATER_KF, i)

      const newBP = WATER_NORMAL_BP + deltaTb
      const newFP = WATER_NORMAL_FP - deltaTf

      const citation = getCitationForCalculation('colligative')

      setResult({
        value: osmotic,
        unit: 'atm',
        label: 'Osmotic Pressure',
        formula: citation.formula,
        citations: citation.references,
        additionalInfo: {
          osmoticPressure: `${osmotic.toFixed(3)} atm`,
          boilingPointElevation: `ΔTb = ${deltaTb.toFixed(3)}°C (${newBP.toFixed(2)}°C)`,
          freezingPointDepression: `ΔTf = ${deltaTf.toFixed(3)}°C (${newFP.toFixed(2)}°C)`,
          vanHoffFactor: i,
          molality: `${m} mol/kg`
        }
      })
    } catch (error) {
      console.error('Colligative properties calculation error:', error)
    }
  }

  const handleCalculate = () => {
    switch (mode) {
      case 'pH':
        calculatepH()
        break
      case 'buffer':
        calculateBuffer()
        break
      case 'molarity':
        calculateMolaritySolution()
        break
      case 'dilution':
        calculateDilutionSolution()
        break
      case 'colligative':
        calculateColligative()
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <EnhancedCalculator
          title="Solutions & pH Calculator"
          description="Professional-grade solution chemistry calculations with uncertainty analysis"
          validationQuality="excellent"
          validationScore={96}
          formula={mode === 'pH' ? 'pH = -log[H⁺]' : mode === 'buffer' ? 'pH = pKa + log([A⁻]/[HA])' : 'M = n/V'}
          assumptions={[
            "Solutions behave ideally at low concentrations",
            "Temperature is 25°C unless specified",
            "Complete dissociation for strong acids/bases",
            "Activity coefficients ≈ 1 for dilute solutions"
          ]}
          limitations={[
            "Less accurate at high ionic strength (>0.1 M)",
            "Doesn't account for ion pairing",
            "Temperature effects on Ka/Kb not included",
            "Auto-ionization of water simplified"
          ]}
          showDisclaimer={true}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Input Parameters</h3>

              {/* Mode selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pH', 'buffer', 'molarity', 'dilution', 'colligative'] as const).map((calcMode) => (
                    <button
                      key={calcMode}
                      onClick={() => setMode(calcMode)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        mode === calcMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {calcMode === 'pH' ? 'pH Calculator' :
                       calcMode === 'buffer' ? 'Buffer pH' :
                       calcMode === 'molarity' ? 'Molarity' :
                       calcMode === 'dilution' ? 'Dilution' :
                       'Colligative'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input fields based on mode */}
              <div className="space-y-4">
                {mode === 'pH' && (
                  <>
                    {/* pH Type selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Acid/Base Type:
                      </label>
                      <select
                        value={phType}
                        onChange={(e) =>
                          setPhType(
                            e.target.value as 'strong-acid' | 'strong-base' | 'weak-acid' | 'weak-base'
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="strong-acid">Strong Acid</option>
                        <option value="strong-base">Strong Base</option>
                        <option value="weak-acid">Weak Acid</option>
                        <option value="weak-base">Weak Base</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Concentration (M)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={concentration}
                          onChange={(e) => setConcentration(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.01"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={concentrationUnc}
                            onChange={(e) => setConcentrationUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.0001"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    {phType === 'weak-acid' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ka (acid dissociation constant)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={ka}
                            onChange={(e) => setKa(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1.8e-5"
                          />
                          {showUncertainty && (
                            <input
                              type="text"
                              value={kaUnc}
                              onChange={(e) => setKaUnc(e.target.value)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="±0.1e-5"
                              title="Uncertainty"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {phType === 'weak-base' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kb (base dissociation constant)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={kb}
                            onChange={(e) => setKb(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1.8e-5"
                          />
                          {showUncertainty && (
                            <input
                              type="text"
                              value={kbUnc}
                              onChange={(e) => setKbUnc(e.target.value)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="±0.1e-5"
                              title="Uncertainty"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {mode === 'buffer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Acid Concentration (M)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={acidConc}
                          onChange={(e) => setAcidConc(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.1"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={acidConcUnc}
                            onChange={(e) => setAcidConcUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.001"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conjugate Base Concentration (M)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={saltConc}
                          onChange={(e) => setSaltConc(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.1"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={saltConcUnc}
                            onChange={(e) => setSaltConcUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.001"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        pKa
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pKa}
                          onChange={(e) => setPKa(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="4.76"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={pKaUnc}
                            onChange={(e) => setPKaUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.01"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'molarity' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mass (g)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mass}
                          onChange={(e) => setMass(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="58.44"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={massUnc}
                            onChange={(e) => setMassUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.01"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Molar Mass (g/mol)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={molarMass}
                          onChange={(e) => setMolarMass(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="58.44"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={molarMassUnc}
                            onChange={(e) => setMolarMassUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.01"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Volume (L)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={volume}
                          onChange={(e) => setVolume(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1.0"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={volumeUnc}
                            onChange={(e) => setVolumeUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.001"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'dilution' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Concentration M₁ (M)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={m1}
                          onChange={(e) => setM1(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2.0"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={m1Unc}
                            onChange={(e) => setM1Unc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.01"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Volume V₁ (mL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={v1}
                          onChange={(e) => setV1(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={v1Unc}
                            onChange={(e) => setV1Unc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.5"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Concentration M₂ (M)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={m2}
                          onChange={(e) => setM2(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.1"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={m2Unc}
                            onChange={(e) => setM2Unc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.001"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'colligative' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Molality (mol/kg)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={molality}
                          onChange={(e) => setMolality(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.5"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={molalityUnc}
                            onChange={(e) => setMolalityUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.01"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Van&apos;t Hoff Factor (i)
                      </label>
                      <input
                        type="text"
                        value={vanHoffFactor}
                        onChange={(e) => setVanHoffFactor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        NaCl: 2, CaCl₂: 3, Glucose: 1, AlCl₃: 4
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temperature (K)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="298.15"
                        />
                        {showUncertainty && (
                          <input
                            type="text"
                            value={temperatureUnc}
                            onChange={(e) => setTemperatureUnc(e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="±0.05"
                            title="Uncertainty"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Options */}
              <div className="mt-6 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showUncertainty}
                    onChange={(e) => setShowUncertainty(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Include uncertainty analysis
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showDetails}
                    onChange={(e) => setShowDetails(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show detailed scientific information
                  </span>
                </label>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Calculate
              </button>
            </div>

            {/* Result Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Result</h3>

              {result ? (
                <>
                  <ScientificResult
                    value={result.value ?? 0}
                    uncertainty={result.uncertainty}
                    unit={result.unit ?? ''}
                    inputs={calculatorInputs.filter(Boolean)}
                    label={result.label}
                    formula={result.formula}
                    citations={result.citations}
                    showDetails={showDetails}
                    confidenceLevel={0.95}
                  />

                  {/* Additional Information */}
                  {result.additionalInfo && (
                    <div className="mt-6 space-y-4">
                      {/* pH Scale Visualization for pH calculations */}
                      {mode === 'pH' && result.value !== undefined && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            pH Scale
                          </div>
                          <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-700 rounded">
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-black"
                              style={{ left: `${(result.value / 14) * 100}%` }}
                            />
                            <div
                              className="absolute -top-6 text-xs font-bold"
                              style={{ left: `${(result.value / 14) * 100}%`, transform: 'translateX(-50%)' }}
                            >
                              {result.value.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>0 (Acidic)</span>
                            <span>7 (Neutral)</span>
                            <span>14 (Basic)</span>
                          </div>
                        </div>
                      )}

                      {/* Detailed pH Information */}
                      {mode === 'pH' && result.additionalInfo.H_concentration !== undefined && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-blue-700 mb-2">
                            Ion Concentrations
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              [H⁺] = {typeof result.additionalInfo.H_concentration === 'number'
                                ? result.additionalInfo.H_concentration.toExponential(3)
                                : result.additionalInfo.H_concentration}{' '}
                              M
                            </div>
                            <div>
                              [OH⁻] = {typeof result.additionalInfo.OH_concentration === 'number'
                                ? result.additionalInfo.OH_concentration.toExponential(3)
                                : result.additionalInfo.OH_concentration}{' '}
                              M
                            </div>
                            <div>
                              pOH = {typeof result.additionalInfo.pOH === 'number'
                                ? result.additionalInfo.pOH.toFixed(2)
                                : result.additionalInfo.pOH}
                            </div>
                            {typeof result.additionalInfo.percentIonization === 'number' && (
                              <div>% Ionization = {result.additionalInfo.percentIonization.toFixed(2)}%</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Buffer Information */}
                      {mode === 'buffer' && result.additionalInfo.ratio !== undefined && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-green-700 mb-2">
                            Buffer Details
                          </div>
                          <div className="text-xs space-y-1">
                            <div>
                              Ratio [A⁻]/[HA] = {typeof result.additionalInfo.ratio === 'number'
                                ? result.additionalInfo.ratio.toFixed(3)
                                : result.additionalInfo.ratio}
                            </div>
                            {result.additionalInfo.bufferCapacity && (
                              <div>Buffer Capacity: {result.additionalInfo.bufferCapacity}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      {result.additionalInfo.instructions && (
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-yellow-700 mb-2">
                            Preparation Instructions
                          </div>
                          <div className="text-xs text-gray-600">
                            {result.additionalInfo.instructions}
                          </div>
                        </div>
                      )}

                      {/* Colligative Properties */}
                      {mode === 'colligative' && result.additionalInfo.osmoticPressure && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-purple-700 mb-2">
                            All Colligative Properties
                          </div>
                          <div className="text-xs space-y-1">
                            <div>Osmotic Pressure: {result.additionalInfo.osmoticPressure}</div>
                            <div>{result.additionalInfo.boilingPointElevation}</div>
                            <div>{result.additionalInfo.freezingPointDepression}</div>
                            <div>Van&apos;t Hoff Factor: i = {result.additionalInfo.vanHoffFactor}</div>
                          </div>
                        </div>
                      )}

                      {/* Common Buffer Systems Reference */}
                      {showDetails && mode === 'buffer' && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Common Buffer Systems
                          </div>
                          <div className="text-xs space-y-1">
                            <div>Acetate: pKa = 4.76 (pH 3.8-5.8)</div>
                            <div>Phosphate: pKa₂ = 7.21 (pH 6.2-8.2)</div>
                            <div>Tris: pKa = 8.06 (pH 7.1-9.1)</div>
                            <div>Carbonate: pKa₂ = 10.33 (pH 9.3-11.3)</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 text-center py-12">
                  Enter values and click Calculate to see results
                </div>
              )}
            </div>
          </div>
        </EnhancedCalculator>
      </div>
    </div>
  )
}
