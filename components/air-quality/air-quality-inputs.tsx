'use client'

import React from 'react'
import type {
  AirQualityMode,
  Pollutant,
  ThaiAveragingPeriod,
  StabilityClass,
} from '@/lib/types/air-quality'
import {
  POLLUTANT_INFO,
  THAI_AIR_STANDARDS,
  STABILITY_CLASSES,
} from '@/lib/calculations/air-quality'
import { POLLUTANT_OPTIONS, GAS_POLLUTANT_OPTIONS } from './air-quality-config'

// ============================================
// SHARED PROPS INTERFACE
// ============================================

export interface AirQualityInputsProps {
  mode: AirQualityMode
  // AQI inputs
  aqiPollutant: Pollutant
  setAqiPollutant: (v: Pollutant) => void
  aqiConcentration: string
  setAqiConcentration: (v: string) => void
  // Conversion inputs
  convPollutant: Pollutant
  setConvPollutant: (v: Pollutant) => void
  convValue: string
  setConvValue: (v: string) => void
  convFromUnit: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'
  setConvFromUnit: (v: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³') => void
  convToUnit: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'
  setConvToUnit: (v: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³') => void
  convTemperature: string
  setConvTemperature: (v: string) => void
  // Thai standards inputs
  thaiPollutant: Pollutant
  setThaiPollutant: (v: Pollutant) => void
  thaiConcentration: string
  setThaiConcentration: (v: string) => void
  thaiPeriod: ThaiAveragingPeriod
  setThaiPeriod: (v: ThaiAveragingPeriod) => void
  // Emission rate inputs
  emPollutant: Pollutant
  setEmPollutant: (v: Pollutant) => void
  emConcentration: string
  setEmConcentration: (v: string) => void
  emConcUnit: 'µg/m³' | 'mg/m³' | 'g/m³'
  setEmConcUnit: (v: 'µg/m³' | 'mg/m³' | 'g/m³') => void
  emFlowRate: string
  setEmFlowRate: (v: string) => void
  emFlowUnit: 'm³/s' | 'm³/hr' | 'L/min'
  setEmFlowUnit: (v: 'm³/s' | 'm³/hr' | 'L/min') => void
  emOperatingHours: string
  setEmOperatingHours: (v: string) => void
  // Plume rise inputs
  stackHeight: string
  setStackHeight: (v: string) => void
  stackDiameter: string
  setStackDiameter: (v: string) => void
  exitVelocity: string
  setExitVelocity: (v: string) => void
  exitTemp: string
  setExitTemp: (v: string) => void
  ambientTemp: string
  setAmbientTemp: (v: string) => void
  plumeEmissionRate: string
  setPlumeEmissionRate: (v: string) => void
  // Gaussian dispersion inputs
  gaussEmissionRate: string
  setGaussEmissionRate: (v: string) => void
  gaussEffectiveHeight: string
  setGaussEffectiveHeight: (v: string) => void
  gaussWindSpeed: string
  setGaussWindSpeed: (v: string) => void
  gaussStability: StabilityClass
  setGaussStability: (v: StabilityClass) => void
  gaussDownwind: string
  setGaussDownwind: (v: string) => void
  gaussCrosswind: string
  setGaussCrosswind: (v: string) => void
  gaussReceptorHeight: string
  setGaussReceptorHeight: (v: string) => void
}

// ============================================
// INDIVIDUAL INPUT COMPONENTS
// ============================================

interface AQIInputsProps {
  aqiPollutant: Pollutant
  setAqiPollutant: (v: Pollutant) => void
  aqiConcentration: string
  setAqiConcentration: (v: string) => void
}

export function AQIInputs({
  aqiPollutant,
  setAqiPollutant,
  aqiConcentration,
  setAqiConcentration,
}: AQIInputsProps) {
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
}

interface ConversionInputsProps {
  convPollutant: Pollutant
  setConvPollutant: (v: Pollutant) => void
  convValue: string
  setConvValue: (v: string) => void
  convFromUnit: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'
  setConvFromUnit: (v: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³') => void
  convToUnit: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³'
  setConvToUnit: (v: 'ppm' | 'ppb' | 'µg/m³' | 'mg/m³') => void
  convTemperature: string
  setConvTemperature: (v: string) => void
}

export function ConversionInputs({
  convPollutant,
  setConvPollutant,
  convValue,
  setConvValue,
  convFromUnit,
  setConvFromUnit,
  convToUnit,
  setConvToUnit,
  convTemperature,
  setConvTemperature,
}: ConversionInputsProps) {
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
}

interface ThaiStandardsInputsProps {
  thaiPollutant: Pollutant
  setThaiPollutant: (v: Pollutant) => void
  thaiConcentration: string
  setThaiConcentration: (v: string) => void
  thaiPeriod: ThaiAveragingPeriod
  setThaiPeriod: (v: ThaiAveragingPeriod) => void
}

function getAvailablePeriods(pollutant: Pollutant): ThaiAveragingPeriod[] {
  return THAI_AIR_STANDARDS
    .filter(s => s.pollutant === pollutant)
    .map(s => s.averagingPeriod)
}

export function ThaiStandardsInputs({
  thaiPollutant,
  setThaiPollutant,
  thaiConcentration,
  setThaiConcentration,
  thaiPeriod,
  setThaiPeriod,
}: ThaiStandardsInputsProps) {
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
}

interface EmissionRateInputsProps {
  emPollutant: Pollutant
  setEmPollutant: (v: Pollutant) => void
  emConcentration: string
  setEmConcentration: (v: string) => void
  emConcUnit: 'µg/m³' | 'mg/m³' | 'g/m³'
  setEmConcUnit: (v: 'µg/m³' | 'mg/m³' | 'g/m³') => void
  emFlowRate: string
  setEmFlowRate: (v: string) => void
  emFlowUnit: 'm³/s' | 'm³/hr' | 'L/min'
  setEmFlowUnit: (v: 'm³/s' | 'm³/hr' | 'L/min') => void
  emOperatingHours: string
  setEmOperatingHours: (v: string) => void
}

export function EmissionRateInputs({
  emPollutant,
  setEmPollutant,
  emConcentration,
  setEmConcentration,
  emConcUnit,
  setEmConcUnit,
  emFlowRate,
  setEmFlowRate,
  emFlowUnit,
  setEmFlowUnit,
  emOperatingHours,
  setEmOperatingHours,
}: EmissionRateInputsProps) {
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
}

interface PlumeRiseInputsProps {
  stackHeight: string
  setStackHeight: (v: string) => void
  stackDiameter: string
  setStackDiameter: (v: string) => void
  exitVelocity: string
  setExitVelocity: (v: string) => void
  exitTemp: string
  setExitTemp: (v: string) => void
  ambientTemp: string
  setAmbientTemp: (v: string) => void
  plumeEmissionRate: string
  setPlumeEmissionRate: (v: string) => void
}

export function PlumeRiseInputs({
  stackHeight,
  setStackHeight,
  stackDiameter,
  setStackDiameter,
  exitVelocity,
  setExitVelocity,
  exitTemp,
  setExitTemp,
  ambientTemp,
  setAmbientTemp,
  plumeEmissionRate,
  setPlumeEmissionRate,
}: PlumeRiseInputsProps) {
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
}

interface GaussianDispersionInputsProps {
  gaussEmissionRate: string
  setGaussEmissionRate: (v: string) => void
  gaussEffectiveHeight: string
  setGaussEffectiveHeight: (v: string) => void
  gaussWindSpeed: string
  setGaussWindSpeed: (v: string) => void
  gaussStability: StabilityClass
  setGaussStability: (v: StabilityClass) => void
  gaussDownwind: string
  setGaussDownwind: (v: string) => void
  gaussCrosswind: string
  setGaussCrosswind: (v: string) => void
  gaussReceptorHeight: string
  setGaussReceptorHeight: (v: string) => void
}

export function GaussianDispersionInputs({
  gaussEmissionRate,
  setGaussEmissionRate,
  gaussEffectiveHeight,
  setGaussEffectiveHeight,
  gaussWindSpeed,
  setGaussWindSpeed,
  gaussStability,
  setGaussStability,
  gaussDownwind,
  setGaussDownwind,
  gaussCrosswind,
  setGaussCrosswind,
  gaussReceptorHeight,
  setGaussReceptorHeight,
}: GaussianDispersionInputsProps) {
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
}

// ============================================
// UNIFIED INPUT COMPONENT
// ============================================

export function AirQualityInputs(props: AirQualityInputsProps) {
  switch (props.mode) {
    case 'aqi':
      return (
        <AQIInputs
          aqiPollutant={props.aqiPollutant}
          setAqiPollutant={props.setAqiPollutant}
          aqiConcentration={props.aqiConcentration}
          setAqiConcentration={props.setAqiConcentration}
        />
      )
    case 'concentration_conversion':
      return (
        <ConversionInputs
          convPollutant={props.convPollutant}
          setConvPollutant={props.setConvPollutant}
          convValue={props.convValue}
          setConvValue={props.setConvValue}
          convFromUnit={props.convFromUnit}
          setConvFromUnit={props.setConvFromUnit}
          convToUnit={props.convToUnit}
          setConvToUnit={props.setConvToUnit}
          convTemperature={props.convTemperature}
          setConvTemperature={props.setConvTemperature}
        />
      )
    case 'thai_standards':
      return (
        <ThaiStandardsInputs
          thaiPollutant={props.thaiPollutant}
          setThaiPollutant={props.setThaiPollutant}
          thaiConcentration={props.thaiConcentration}
          setThaiConcentration={props.setThaiConcentration}
          thaiPeriod={props.thaiPeriod}
          setThaiPeriod={props.setThaiPeriod}
        />
      )
    case 'emission_rate':
      return (
        <EmissionRateInputs
          emPollutant={props.emPollutant}
          setEmPollutant={props.setEmPollutant}
          emConcentration={props.emConcentration}
          setEmConcentration={props.setEmConcentration}
          emConcUnit={props.emConcUnit}
          setEmConcUnit={props.setEmConcUnit}
          emFlowRate={props.emFlowRate}
          setEmFlowRate={props.setEmFlowRate}
          emFlowUnit={props.emFlowUnit}
          setEmFlowUnit={props.setEmFlowUnit}
          emOperatingHours={props.emOperatingHours}
          setEmOperatingHours={props.setEmOperatingHours}
        />
      )
    case 'plume_rise':
      return (
        <PlumeRiseInputs
          stackHeight={props.stackHeight}
          setStackHeight={props.setStackHeight}
          stackDiameter={props.stackDiameter}
          setStackDiameter={props.setStackDiameter}
          exitVelocity={props.exitVelocity}
          setExitVelocity={props.setExitVelocity}
          exitTemp={props.exitTemp}
          setExitTemp={props.setExitTemp}
          ambientTemp={props.ambientTemp}
          setAmbientTemp={props.setAmbientTemp}
          plumeEmissionRate={props.plumeEmissionRate}
          setPlumeEmissionRate={props.setPlumeEmissionRate}
        />
      )
    case 'stack_dispersion':
      return (
        <GaussianDispersionInputs
          gaussEmissionRate={props.gaussEmissionRate}
          setGaussEmissionRate={props.setGaussEmissionRate}
          gaussEffectiveHeight={props.gaussEffectiveHeight}
          setGaussEffectiveHeight={props.setGaussEffectiveHeight}
          gaussWindSpeed={props.gaussWindSpeed}
          setGaussWindSpeed={props.setGaussWindSpeed}
          gaussStability={props.gaussStability}
          setGaussStability={props.setGaussStability}
          gaussDownwind={props.gaussDownwind}
          setGaussDownwind={props.setGaussDownwind}
          gaussCrosswind={props.gaussCrosswind}
          setGaussCrosswind={props.setGaussCrosswind}
          gaussReceptorHeight={props.gaussReceptorHeight}
          setGaussReceptorHeight={props.setGaussReceptorHeight}
        />
      )
    default:
      return null
  }
}
