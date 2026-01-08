'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle,
  Cloud,
  Factory,
  Gauge,
  RefreshCw,
  ThermometerSun,
  Wind,
  XCircle,
} from 'lucide-react'
import {
  calculateAQI,
  convertConcentration,
  checkThaiAirStandard,
  calculateEmissionRate,
  calculatePlumeRise,
  calculateGaussianDispersion,
  POLLUTANT_INFO,
  AQI_CATEGORIES,
  THAI_AIR_STANDARDS,
  STABILITY_CLASSES,
} from '@/lib/calculations/air-quality'
import type {
  AirQualityMode,
  Pollutant,
  AQIResult,
  ConcentrationConversionResult,
  ThaiAirComplianceResult,
  EmissionRateResult,
  StackDilutionResult,
  GaussianDispersionResult,
  ThaiAveragingPeriod,
  StabilityClass,
} from '@/lib/types/air-quality'

type CalculationResult =
  | AQIResult
  | ConcentrationConversionResult
  | ThaiAirComplianceResult
  | EmissionRateResult
  | StackDilutionResult
  | GaussianDispersionResult

interface ModeConfig {
  id: AirQualityMode
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const MODES: ModeConfig[] = [
  {
    id: 'aqi',
    name: 'AQI Calculator',
    description: 'Calculate Air Quality Index from pollutant concentration',
    icon: <Gauge className="h-5 w-5" />,
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'concentration_conversion',
    name: 'Unit Conversion',
    description: 'Convert between ppm, ppb, µg/m³, and mg/m³',
    icon: <RefreshCw className="h-5 w-5" />,
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'thai_standards',
    name: 'Thai Standards',
    description: 'Check compliance with Thai PCD air quality standards',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'from-teal-600 to-green-600',
  },
  {
    id: 'emission_rate',
    name: 'Emission Rate',
    description: 'Calculate pollutant emission rate (g/s, kg/hr, tons/year)',
    icon: <Factory className="h-5 w-5" />,
    color: 'from-orange-600 to-red-600',
  },
  {
    id: 'plume_rise',
    name: 'Plume Rise',
    description: 'Calculate effective stack height (Briggs equations)',
    icon: <Cloud className="h-5 w-5" />,
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'stack_dispersion',
    name: 'Dispersion Model',
    description: 'Simple Gaussian dispersion for ground-level concentration',
    icon: <Wind className="h-5 w-5" />,
    color: 'from-indigo-600 to-blue-600',
  },
]

const POLLUTANT_OPTIONS: { value: Pollutant; label: string }[] = [
  { value: 'pm25', label: 'PM2.5 (Fine Particulates)' },
  { value: 'pm10', label: 'PM10 (Coarse Particulates)' },
  { value: 'o3', label: 'O₃ (Ozone)' },
  { value: 'co', label: 'CO (Carbon Monoxide)' },
  { value: 'no2', label: 'NO₂ (Nitrogen Dioxide)' },
  { value: 'so2', label: 'SO₂ (Sulfur Dioxide)' },
  { value: 'pb', label: 'Pb (Lead)' },
]

const GAS_POLLUTANT_OPTIONS = POLLUTANT_OPTIONS.filter(
  p => !['pm25', 'pm10', 'pb'].includes(p.value)
)

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
  const [convPressure, setConvPressure] = useState('1')

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

  const getAvailablePeriods = (pollutant: Pollutant): ThaiAveragingPeriod[] => {
    return THAI_AIR_STANDARDS
      .filter(s => s.pollutant === pollutant)
      .map(s => s.averagingPeriod)
  }

  const renderInputForm = () => {
    switch (mode) {
      case 'aqi':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pollutant
              </label>
              <select
                value={aqiPollutant}
                onChange={(e) => setAqiPollutant(e.target.value as Pollutant)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {POLLUTANT_OPTIONS.filter(p => p.value !== 'pb').map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concentration ({POLLUTANT_INFO[aqiPollutant].unit})
              </label>
              <input
                type="number"
                value={aqiConcentration}
                onChange={(e) => setAqiConcentration(e.target.value)}
                placeholder={`Enter concentration in ${POLLUTANT_INFO[aqiPollutant].unit}`}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                {aqiPollutant === 'pm25' && '24-hour average'}
                {aqiPollutant === 'pm10' && '24-hour average'}
                {aqiPollutant === 'o3' && '8-hour average (in ppm)'}
                {aqiPollutant === 'co' && '8-hour average (in ppm)'}
                {aqiPollutant === 'no2' && '1-hour average (in ppb)'}
                {aqiPollutant === 'so2' && '1-hour average (in ppb)'}
              </p>
            </div>
          </div>
        )

      case 'concentration_conversion':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pollutant (Gas only)
              </label>
              <select
                value={convPollutant}
                onChange={(e) => setConvPollutant(e.target.value as Pollutant)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {GAS_POLLUTANT_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Value
                </label>
                <input
                  type="number"
                  value={convValue}
                  onChange={(e) => setConvValue(e.target.value)}
                  placeholder="Enter value"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Unit
                </label>
                <select
                  value={convFromUnit}
                  onChange={(e) => setConvFromUnit(e.target.value as 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                  <option value="µg/m³">µg/m³</option>
                  <option value="mg/m³">mg/m³</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  To Unit
                </label>
                <select
                  value={convToUnit}
                  onChange={(e) => setConvToUnit(e.target.value as 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                  <option value="µg/m³">µg/m³</option>
                  <option value="mg/m³">mg/m³</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={convTemperature}
                  onChange={(e) => setConvTemperature(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )

      case 'thai_standards':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pollutant
              </label>
              <select
                value={thaiPollutant}
                onChange={(e) => {
                  const newPollutant = e.target.value as Pollutant
                  setThaiPollutant(newPollutant)
                  const periods = getAvailablePeriods(newPollutant)
                  if (periods.length > 0 && !periods.includes(thaiPeriod)) {
                    setThaiPeriod(periods[0])
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {POLLUTANT_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Concentration
                </label>
                <input
                  type="number"
                  value={thaiConcentration}
                  onChange={(e) => setThaiConcentration(e.target.value)}
                  placeholder="Enter value"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Averaging Period
                </label>
                <select
                  value={thaiPeriod}
                  onChange={(e) => setThaiPeriod(e.target.value as ThaiAveragingPeriod)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {getAvailablePeriods(thaiPollutant).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Thai Standard Reference</h4>
              <p className="text-xs text-gray-400">
                ประกาศกรมควบคุมมลพิษ เรื่อง ค่ามาตรฐานคุณภาพอากาศในบรรยากาศทั่วไป
              </p>
            </div>
          </div>
        )

      case 'emission_rate':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pollutant
              </label>
              <select
                value={emPollutant}
                onChange={(e) => setEmPollutant(e.target.value as Pollutant)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {POLLUTANT_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Concentration
                </label>
                <input
                  type="number"
                  value={emConcentration}
                  onChange={(e) => setEmConcentration(e.target.value)}
                  placeholder="Enter concentration"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unit
                </label>
                <select
                  value={emConcUnit}
                  onChange={(e) => setEmConcUnit(e.target.value as 'µg/m³' | 'mg/m³' | 'g/m³')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="µg/m³">µg/m³</option>
                  <option value="mg/m³">mg/m³</option>
                  <option value="g/m³">g/m³</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Flow Rate
                </label>
                <input
                  type="number"
                  value={emFlowRate}
                  onChange={(e) => setEmFlowRate(e.target.value)}
                  placeholder="Enter flow rate"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unit
                </label>
                <select
                  value={emFlowUnit}
                  onChange={(e) => setEmFlowUnit(e.target.value as 'm³/s' | 'm³/hr' | 'L/min')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="m³/s">m³/s</option>
                  <option value="m³/hr">m³/hr</option>
                  <option value="L/min">L/min</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Operating Hours per Day
              </label>
              <input
                type="number"
                value={emOperatingHours}
                onChange={(e) => setEmOperatingHours(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        )

      case 'plume_rise':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stack Height (m)
                </label>
                <input
                  type="number"
                  value={stackHeight}
                  onChange={(e) => setStackHeight(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stack Diameter (m)
                </label>
                <input
                  type="number"
                  value={stackDiameter}
                  onChange={(e) => setStackDiameter(e.target.value)}
                  placeholder="e.g., 2"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exit Velocity (m/s)
                </label>
                <input
                  type="number"
                  value={exitVelocity}
                  onChange={(e) => setExitVelocity(e.target.value)}
                  placeholder="e.g., 15"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Exit Temperature (K)
                </label>
                <input
                  type="number"
                  value={exitTemp}
                  onChange={(e) => setExitTemp(e.target.value)}
                  placeholder="e.g., 423 (150°C)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ambient Temp (K)
                </label>
                <input
                  type="number"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(e.target.value)}
                  placeholder="e.g., 298 (25°C)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emission Rate (g/s)
                </label>
                <input
                  type="number"
                  value={plumeEmissionRate}
                  onChange={(e) => setPlumeEmissionRate(e.target.value)}
                  placeholder="e.g., 100"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )

      case 'stack_dispersion':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emission Rate Q (g/s)
                </label>
                <input
                  type="number"
                  value={gaussEmissionRate}
                  onChange={(e) => setGaussEmissionRate(e.target.value)}
                  placeholder="e.g., 100"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Effective Height H (m)
                </label>
                <input
                  type="number"
                  value={gaussEffectiveHeight}
                  onChange={(e) => setGaussEffectiveHeight(e.target.value)}
                  placeholder="e.g., 100"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wind Speed u (m/s)
                </label>
                <input
                  type="number"
                  value={gaussWindSpeed}
                  onChange={(e) => setGaussWindSpeed(e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stability Class
                </label>
                <select
                  value={gaussStability}
                  onChange={(e) => setGaussStability(e.target.value as StabilityClass)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {STABILITY_CLASSES.map(s => (
                    <option key={s.class} value={s.class}>
                      {s.class} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Downwind x (m)
                </label>
                <input
                  type="number"
                  value={gaussDownwind}
                  onChange={(e) => setGaussDownwind(e.target.value)}
                  placeholder="e.g., 1000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Crosswind y (m)
                </label>
                <input
                  type="number"
                  value={gaussCrosswind}
                  onChange={(e) => setGaussCrosswind(e.target.value)}
                  placeholder="0 = centerline"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Receptor z (m)
                </label>
                <input
                  type="number"
                  value={gaussReceptorHeight}
                  onChange={(e) => setGaussReceptorHeight(e.target.value)}
                  placeholder="0 = ground"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderResult = () => {
    if (!result) return null

    switch (mode) {
      case 'aqi': {
        const aqiResult = result as AQIResult
        return (
          <div className="space-y-4">
            <div
              className="text-center p-6 rounded-xl"
              style={{ backgroundColor: aqiResult.category.color + '20' }}
            >
              <div className="text-6xl font-bold mb-2\" style={{ color: aqiResult.category.color }}>
                {aqiResult.aqi}
              </div>
              <div className="text-xl font-semibold" style={{ color: aqiResult.category.color }}>
                {aqiResult.category.name}
              </div>
              <div className="text-sm text-gray-300 mt-1">
                {aqiResult.category.nameThai}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Pollutant</p>
                <p className="text-lg font-semibold text-white">
                  {aqiResult.pollutant.formula}
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Concentration</p>
                <p className="text-lg font-semibold text-white">
                  {aqiResult.concentration} {aqiResult.pollutant.unit}
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Health Implication</p>
              <p className="text-white">{aqiResult.category.healthImplication}</p>
              <p className="text-gray-300 mt-2 text-sm">{aqiResult.category.healthImplicationThai}</p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Precaution</p>
              <p className="text-white text-sm">{aqiResult.category.cautionaryStatement}</p>
            </div>

            {/* AQI Scale */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-3">AQI Scale</p>
              <div className="flex h-8 rounded-lg overflow-hidden">
                {AQI_CATEGORIES.map((cat, i) => (
                  <div
                    key={cat.level}
                    className="flex-1 flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.range.min}-{cat.range.max}
                  </div>
                ))}
              </div>
              <div className="flex mt-1">
                {AQI_CATEGORIES.map((cat) => (
                  <div key={cat.level} className="flex-1 text-center text-xs text-gray-400">
                    {cat.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      case 'concentration_conversion': {
        const convResult = result as ConcentrationConversionResult
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {convResult.inputValue} {convResult.inputUnit}
              </div>
              <ArrowRight className="h-8 w-8 mx-auto text-blue-400 my-2" />
              <div className="text-4xl font-bold text-blue-400">
                {convResult.outputValue.toPrecision(4)} {convResult.outputUnit}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Pollutant</p>
                <p className="text-lg font-semibold text-white">
                  {convResult.pollutant.formula}
                </p>
                <p className="text-xs text-gray-400">
                  MW: {convResult.pollutant.molecularWeight} g/mol
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Molar Volume</p>
                <p className="text-lg font-semibold text-white">
                  {convResult.molarVolume.toFixed(2)} L/mol
                </p>
                <p className="text-xs text-gray-400">
                  at {convResult.temperature}°C, {convResult.pressure} atm
                </p>
              </div>
            </div>
          </div>
        )
      }

      case 'thai_standards': {
        const thaiResult = result as ThaiAirComplianceResult
        return (
          <div className="space-y-4">
            <div className={`text-center p-6 rounded-xl ${
              thaiResult.isCompliant
                ? 'bg-green-600/20 border border-green-600/30'
                : 'bg-red-600/20 border border-red-600/30'
            }`}>
              {thaiResult.isCompliant ? (
                <>
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold text-green-500">COMPLIANT</div>
                  <div className="text-lg text-green-400">ผ่านมาตรฐาน</div>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 mx-auto text-red-500 mb-2" />
                  <div className="text-2xl font-bold text-red-500">EXCEEDS STANDARD</div>
                  <div className="text-lg text-red-400">เกินมาตรฐาน</div>
                  {thaiResult.exceedancePercent && (
                    <div className="text-sm text-red-300 mt-1">
                      +{thaiResult.exceedancePercent.toFixed(1)}% above limit
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Measured</p>
                <p className="text-2xl font-bold text-white">
                  {thaiResult.concentration} {thaiResult.unit}
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Standard Limit</p>
                <p className="text-2xl font-bold text-white">
                  {thaiResult.standard.limit} {thaiResult.unit}
                </p>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Reference</p>
              <p className="text-white text-sm">{thaiResult.standard.reference}</p>
              <p className="text-gray-400 text-xs mt-1">Year: {thaiResult.standard.year}</p>
            </div>

            <div className={`rounded-lg p-4 ${
              thaiResult.isCompliant ? 'bg-green-600/10' : 'bg-yellow-600/10'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                  thaiResult.isCompliant ? 'text-green-500' : 'text-yellow-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-200">Health Risk Assessment</p>
                  <p className="text-sm text-gray-400 mt-1">{thaiResult.healthRisk}</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      case 'emission_rate': {
        const emResult = result as EmissionRateResult
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl p-4">
                <p className="text-sm text-gray-400">Mass Flow Rate</p>
                <p className="text-2xl font-bold text-orange-400">
                  {emResult.massFlowRate.toExponential(3)}
                </p>
                <p className="text-sm text-gray-400">g/s</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl p-4">
                <p className="text-sm text-gray-400">Hourly Emission</p>
                <p className="text-2xl font-bold text-orange-400">
                  {emResult.hourlyEmission.toFixed(4)}
                </p>
                <p className="text-sm text-gray-400">kg/hr</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Daily Emission</p>
                <p className="text-xl font-bold text-white">
                  {emResult.dailyEmission.toFixed(2)} kg/day
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Annual Emission</p>
                <p className="text-xl font-bold text-white">
                  {emResult.annualEmission.toFixed(2)} tons/year
                </p>
              </div>
            </div>
          </div>
        )
      }

      case 'plume_rise': {
        const plumeResult = result as StackDilutionResult
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Effective Stack Height</p>
              <p className="text-5xl font-bold text-purple-400">
                {plumeResult.effectiveHeight.toFixed(1)} m
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Plume Rise (Δh)</p>
                <p className="text-xl font-bold text-white">
                  {plumeResult.plumeRise.toFixed(2)} m
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Buoyancy Flux (F)</p>
                <p className="text-xl font-bold text-white">
                  {plumeResult.buoyancyFlux.toFixed(2)} m⁴/s³
                </p>
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">Momentum Flux (M)</p>
              <p className="text-xl font-bold text-white">
                {plumeResult.momentumFlux.toFixed(2)} m⁴/s²
              </p>
            </div>
          </div>
        )
      }

      case 'stack_dispersion': {
        const gaussResult = result as GaussianDispersionResult
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Ground-Level Concentration</p>
              <p className="text-4xl font-bold text-indigo-400">
                {gaussResult.concentration.toFixed(4)} µg/m³
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">σy (Horizontal)</p>
                <p className="text-xl font-bold text-white">
                  {gaussResult.sigmaY.toFixed(2)} m
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">σz (Vertical)</p>
                <p className="text-xl font-bold text-white">
                  {gaussResult.sigmaZ.toFixed(2)} m
                </p>
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Maximum Ground-Level Concentration</p>
              <p className="text-white">
                ~{gaussResult.maxGroundConcentration.toFixed(4)} µg/m³ at ~{gaussResult.maxDistance.toFixed(0)} m
              </p>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

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

            {renderInputForm()}

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
              renderResult()
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Gauge className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Enter values and click Calculate to see results</p>
              </div>
            )}

            {/* Calculation Steps */}
            {result && 'steps' in result && result.steps && (
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
