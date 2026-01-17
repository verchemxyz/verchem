'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Calculator,
  Gauge,
  RefreshCw,
  ThermometerSun,
  Wind,
} from 'lucide-react'
import {
  calculateAQI,
  convertConcentration,
  checkThaiAirStandard,
  calculateEmissionRate,
  calculatePlumeRise,
  calculateGaussianDispersion,
} from '@/lib/calculations/air-quality'
import type {
  AirQualityMode,
  Pollutant,
  ThaiAveragingPeriod,
  StabilityClass,
} from '@/lib/types/air-quality'
import {
  MODES,
  type CalculationResult,
} from '@/components/air-quality/air-quality-config'
import { AirQualityInputs } from '@/components/air-quality/air-quality-inputs'
import { AirQualityResults } from '@/components/air-quality/air-quality-results'

export default function AirQualityPage() {
  const [mode, setMode] = useState<AirQualityMode>('aqi')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  // AQI inputs
  const [aqiPollutant, setAqiPollutant] = useState<Pollutant>('pm25')
  const [aqiConcentration, setAqiConcentration] = useState('')

  // Conversion inputs
  const [convPollutant, setConvPollutant] = useState<Pollutant>('co')
  const [convValue, setConvValue] = useState('')
  const [convFromUnit, setConvFromUnit] = useState<'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'>('ppm')
  const [convToUnit, setConvToUnit] = useState<'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'>('µg/m³')
  const [convTemperature, setConvTemperature] = useState('25')
  const [convPressure] = useState('1')

  // Thai standards inputs
  const [thaiPollutant, setThaiPollutant] = useState<Pollutant>('pm25')
  const [thaiConcentration, setThaiConcentration] = useState('')
  const [thaiPeriod, setThaiPeriod] = useState<ThaiAveragingPeriod>('24-hour')

  // Emission rate inputs
  const [emPollutant, setEmPollutant] = useState<Pollutant>('pm25')
  const [emConcentration, setEmConcentration] = useState('')
  const [emConcUnit, setEmConcUnit] = useState<'µg/m³' | 'mg/m³' | 'g/m³'>('mg/m³')
  const [emFlowRate, setEmFlowRate] = useState('')
  const [emFlowUnit, setEmFlowUnit] = useState<'m³/s' | 'm³/hr' | 'L/min'>('m³/s')
  const [emOperatingHours, setEmOperatingHours] = useState('24')

  // Plume rise inputs
  const [stackHeight, setStackHeight] = useState('')
  const [stackDiameter, setStackDiameter] = useState('')
  const [exitVelocity, setExitVelocity] = useState('')
  const [exitTemp, setExitTemp] = useState('')
  const [ambientTemp, setAmbientTemp] = useState('298')
  const [plumeEmissionRate, setPlumeEmissionRate] = useState('')

  // Gaussian dispersion inputs
  const [gaussEmissionRate, setGaussEmissionRate] = useState('')
  const [gaussEffectiveHeight, setGaussEffectiveHeight] = useState('')
  const [gaussWindSpeed, setGaussWindSpeed] = useState('')
  const [gaussStability, setGaussStability] = useState<StabilityClass>('D')
  const [gaussDownwind, setGaussDownwind] = useState('')
  const [gaussCrosswind, setGaussCrosswind] = useState('0')
  const [gaussReceptorHeight, setGaussReceptorHeight] = useState('0')

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    setError('')

    setTimeout(() => {
      try {
        let calcResult: CalculationResult

        switch (mode) {
          case 'aqi': {
            const concentration = parseFloat(aqiConcentration)
            if (isNaN(concentration)) {
              throw new Error('Please enter a valid concentration')
            }
            calcResult = calculateAQI({
              pollutant: aqiPollutant,
              concentration,
            })
            break
          }

          case 'concentration_conversion': {
            const value = parseFloat(convValue)
            const temp = parseFloat(convTemperature)
            const pressure = parseFloat(convPressure)

            if (isNaN(value)) {
              throw new Error('Please enter a valid concentration value')
            }

            calcResult = convertConcentration({
              pollutant: convPollutant,
              value,
              fromUnit: convFromUnit,
              toUnit: convToUnit,
              temperature: temp,
              pressure: pressure,
            })
            break
          }

          case 'thai_standards': {
            const concentration = parseFloat(thaiConcentration)
            if (isNaN(concentration)) {
              throw new Error('Please enter a valid concentration')
            }
            calcResult = checkThaiAirStandard(thaiPollutant, concentration, thaiPeriod)
            break
          }

          case 'emission_rate': {
            const concentration = parseFloat(emConcentration)
            const flowRate = parseFloat(emFlowRate)
            const opHours = parseFloat(emOperatingHours)

            if (isNaN(concentration) || isNaN(flowRate)) {
              throw new Error('Please enter valid concentration and flow rate')
            }

            calcResult = calculateEmissionRate({
              pollutant: emPollutant,
              concentration,
              concentrationUnit: emConcUnit,
              flowRate,
              flowRateUnit: emFlowUnit,
              operatingHours: opHours,
            })
            break
          }

          case 'plume_rise': {
            const height = parseFloat(stackHeight)
            const diameter = parseFloat(stackDiameter)
            const velocity = parseFloat(exitVelocity)
            const exitT = parseFloat(exitTemp)
            const ambientT = parseFloat(ambientTemp)
            const emission = parseFloat(plumeEmissionRate)

            if (isNaN(height) || isNaN(diameter) || isNaN(velocity) ||
                isNaN(exitT) || isNaN(ambientT) || isNaN(emission)) {
              throw new Error('Please fill in all stack parameters')
            }

            calcResult = calculatePlumeRise({
              height,
              diameter,
              exitVelocity: velocity,
              exitTemperature: exitT,
              ambientTemperature: ambientT,
              emissionRate: emission,
            })
            break
          }

          case 'stack_dispersion': {
            const Q = parseFloat(gaussEmissionRate)
            const H = parseFloat(gaussEffectiveHeight)
            const u = parseFloat(gaussWindSpeed)
            const x = parseFloat(gaussDownwind)
            const y = parseFloat(gaussCrosswind)
            const z = parseFloat(gaussReceptorHeight)

            if (isNaN(Q) || isNaN(H) || isNaN(u) || isNaN(x)) {
              throw new Error('Please fill in required dispersion parameters')
            }

            calcResult = calculateGaussianDispersion({
              emissionRate: Q,
              effectiveHeight: H,
              windSpeed: u,
              stabilityClass: gaussStability,
              downwindDistance: x,
              crosswindDistance: y || 0,
              receptorHeight: z || 0,
            })
            break
          }

          default:
            throw new Error('Invalid calculation mode')
        }

        setResult(calcResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation error')
        setResult(null)
      } finally {
        setIsCalculating(false)
      }
    }, 100)
  }, [
    mode,
    aqiPollutant, aqiConcentration,
    convPollutant, convValue, convFromUnit, convToUnit, convTemperature, convPressure,
    thaiPollutant, thaiConcentration, thaiPeriod,
    emPollutant, emConcentration, emConcUnit, emFlowRate, emFlowUnit, emOperatingHours,
    stackHeight, stackDiameter, exitVelocity, exitTemp, ambientTemp, plumeEmissionRate,
    gaussEmissionRate, gaussEffectiveHeight, gaussWindSpeed, gaussStability,
    gaussDownwind, gaussCrosswind, gaussReceptorHeight,
  ])

  const handleReset = useCallback(() => {
    setResult(null)
    setError('')
  }, [])

  const currentMode = MODES.find(m => m.id === mode)!

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
            <span>/</span>
            <span className="text-white">Air Quality</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Wind className="h-4 w-4" />
            Environmental Engineering
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Air Quality Calculator
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Calculate AQI, convert concentrations, check Thai PCD standards compliance,
            and model pollutant dispersion
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id)
                setResult(null)
                setError('')
              }}
              className={`p-4 rounded-xl transition-all ${
                mode === m.id
                  ? `bg-gradient-to-br ${m.color} text-white shadow-lg`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {m.icon}
                <span className="text-sm font-medium text-center">{m.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${currentMode.color}`}>
                {currentMode.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentMode.name}</h2>
                <p className="text-sm text-gray-400">{currentMode.description}</p>
              </div>
            </div>

            <AirQualityInputs
              mode={mode}
              aqiPollutant={aqiPollutant}
              setAqiPollutant={setAqiPollutant}
              aqiConcentration={aqiConcentration}
              setAqiConcentration={setAqiConcentration}
              convPollutant={convPollutant}
              setConvPollutant={setConvPollutant}
              convValue={convValue}
              setConvValue={setConvValue}
              convFromUnit={convFromUnit}
              setConvFromUnit={setConvFromUnit}
              convToUnit={convToUnit}
              setConvToUnit={setConvToUnit}
              convTemperature={convTemperature}
              setConvTemperature={setConvTemperature}
              thaiPollutant={thaiPollutant}
              setThaiPollutant={setThaiPollutant}
              thaiConcentration={thaiConcentration}
              setThaiConcentration={setThaiConcentration}
              thaiPeriod={thaiPeriod}
              setThaiPeriod={setThaiPeriod}
              emPollutant={emPollutant}
              setEmPollutant={setEmPollutant}
              emConcentration={emConcentration}
              setEmConcentration={setEmConcentration}
              emConcUnit={emConcUnit}
              setEmConcUnit={setEmConcUnit}
              emFlowRate={emFlowRate}
              setEmFlowRate={setEmFlowRate}
              emFlowUnit={emFlowUnit}
              setEmFlowUnit={setEmFlowUnit}
              emOperatingHours={emOperatingHours}
              setEmOperatingHours={setEmOperatingHours}
              stackHeight={stackHeight}
              setStackHeight={setStackHeight}
              stackDiameter={stackDiameter}
              setStackDiameter={setStackDiameter}
              exitVelocity={exitVelocity}
              setExitVelocity={setExitVelocity}
              exitTemp={exitTemp}
              setExitTemp={setExitTemp}
              ambientTemp={ambientTemp}
              setAmbientTemp={setAmbientTemp}
              plumeEmissionRate={plumeEmissionRate}
              setPlumeEmissionRate={setPlumeEmissionRate}
              gaussEmissionRate={gaussEmissionRate}
              setGaussEmissionRate={setGaussEmissionRate}
              gaussEffectiveHeight={gaussEffectiveHeight}
              setGaussEffectiveHeight={setGaussEffectiveHeight}
              gaussWindSpeed={gaussWindSpeed}
              setGaussWindSpeed={setGaussWindSpeed}
              gaussStability={gaussStability}
              setGaussStability={setGaussStability}
              gaussDownwind={gaussDownwind}
              setGaussDownwind={setGaussDownwind}
              gaussCrosswind={gaussCrosswind}
              setGaussCrosswind={setGaussCrosswind}
              gaussReceptorHeight={gaussReceptorHeight}
              setGaussReceptorHeight={setGaussReceptorHeight}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isCalculating
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-r ${currentMode.color} text-white hover:opacity-90`
                }`}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5" />
                    Calculate
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-6 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ThermometerSun className="h-5 w-5 text-green-400" />
              Results
            </h2>

            {result ? (
              <>
                <AirQualityResults result={result} />

                {/* Calculation Steps */}
                {'steps' in result && result.steps && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        Show Calculation Steps
                      </summary>
                      <div className="mt-4 bg-gray-900/50 rounded-lg p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                        {result.steps.join('\n')}
                      </div>
                    </details>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Gauge className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Enter values and click Calculate to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* Reference Section */}
        <div className="mt-8 bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">References & Standards</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">AQI Calculation</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>US EPA AQI Technical Assistance Document (2024)</li>
                <li>EPA Breakpoints for PM2.5, PM10, O₃, CO, NO₂, SO₂</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Thai Standards</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>ประกาศกรมควบคุมมลพิษ พ.ศ. 2566 (PM2.5)</li>
                <li>ประกาศคณะกรรมการสิ่งแวดล้อมแห่งชาติ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Dispersion Models</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Briggs Plume Rise Equations (1969, 1971)</li>
                <li>Pasquill-Gifford Dispersion Coefficients</li>
                <li>Turner&apos;s Workbook of Atmospheric Dispersion</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Unit Conversion</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Ideal Gas Law (PV = nRT)</li>
                <li>Standard conditions: 25°C, 1 atm</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
