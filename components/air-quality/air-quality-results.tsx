'use client'

import React from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type {
  AQIResult,
  ConcentrationConversionResult,
  ThaiAirComplianceResult,
  EmissionRateResult,
  StackDilutionResult,
  GaussianDispersionResult,
} from '@/lib/types/air-quality'
import { AQI_CATEGORIES } from '@/lib/calculations/air-quality'
import {
  type CalculationResult,
  isAQIResult,
  isConversionResult,
  isThaiComplianceResult,
  isEmissionRateResult,
  isStackDilutionResult,
  isGaussianDispersionResult,
} from './air-quality-config'

// ============================================
// INDIVIDUAL RESULT COMPONENTS
// ============================================

function AQIResultDisplay({ result }: { result: AQIResult }) {
  return (
    <div className="space-y-4">
      <div
        className="text-center p-6 rounded-xl"
        style={{ backgroundColor: result.category.color + '20' }}
      >
        <div className="text-6xl font-bold mb-2" style={{ color: result.category.color }}>
          {result.aqi}
        </div>
        <div className="text-xl font-semibold" style={{ color: result.category.color }}>
          {result.category.name}
        </div>
        <div className="text-sm text-gray-300 mt-1">
          {result.category.nameThai}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pollutant</p>
          <p className="text-lg font-semibold text-white">
            {result.pollutant.formula}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Concentration</p>
          <p className="text-lg font-semibold text-white">
            {result.concentration} {result.pollutant.unit}
          </p>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Health Implication</p>
        <p className="text-white">{result.category.healthImplication}</p>
        <p className="text-gray-300 mt-2 text-sm">{result.category.healthImplicationThai}</p>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Precaution</p>
        <p className="text-white text-sm">{result.category.cautionaryStatement}</p>
      </div>

      {/* AQI Scale */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-3">AQI Scale</p>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {AQI_CATEGORIES.map((cat) => (
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

function ConversionResultDisplay({ result }: { result: ConcentrationConversionResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl p-6 text-center">
        <div className="text-3xl font-bold text-white mb-2">
          {result.inputValue} {result.inputUnit}
        </div>
        <ArrowRight className="h-8 w-8 mx-auto text-blue-400 my-2" />
        <div className="text-4xl font-bold text-blue-400">
          {result.outputValue.toPrecision(4)} {result.outputUnit}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pollutant</p>
          <p className="text-lg font-semibold text-white">
            {result.pollutant.formula}
          </p>
          <p className="text-xs text-gray-400">
            MW: {result.pollutant.molecularWeight} g/mol
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Molar Volume</p>
          <p className="text-lg font-semibold text-white">
            {result.molarVolume.toFixed(2)} L/mol
          </p>
          <p className="text-xs text-gray-400">
            at {result.temperature}°C, {result.pressure} atm
          </p>
        </div>
      </div>
    </div>
  )
}

function ThaiComplianceResultDisplay({ result }: { result: ThaiAirComplianceResult }) {
  return (
    <div className="space-y-4">
      <div className={`text-center p-6 rounded-xl ${
        result.isCompliant
          ? 'bg-green-600/20 border border-green-600/30'
          : 'bg-red-600/20 border border-red-600/30'
      }`}>
        {result.isCompliant ? (
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
            {result.exceedancePercent && (
              <div className="text-sm text-red-300 mt-1">
                +{result.exceedancePercent.toFixed(1)}% above limit
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Measured</p>
          <p className="text-2xl font-bold text-white">
            {result.concentration} {result.unit}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Standard Limit</p>
          <p className="text-2xl font-bold text-white">
            {result.standard.limit} {result.unit}
          </p>
        </div>
      </div>

      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">Reference</p>
        <p className="text-white text-sm">{result.standard.reference}</p>
        <p className="text-gray-400 text-xs mt-1">Year: {result.standard.year}</p>
      </div>

      <div className={`rounded-lg p-4 ${
        result.isCompliant ? 'bg-green-600/10' : 'bg-yellow-600/10'
      }`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
            result.isCompliant ? 'text-green-500' : 'text-yellow-500'
          }`} />
          <div>
            <p className="text-sm font-medium text-gray-200">Health Risk Assessment</p>
            <p className="text-sm text-gray-400 mt-1">{result.healthRisk}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmissionRateResultDisplay({ result }: { result: EmissionRateResult }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl p-4">
          <p className="text-sm text-gray-400">Mass Flow Rate</p>
          <p className="text-2xl font-bold text-orange-400">
            {result.massFlowRate.toExponential(3)}
          </p>
          <p className="text-sm text-gray-400">g/s</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-xl p-4">
          <p className="text-sm text-gray-400">Hourly Emission</p>
          <p className="text-2xl font-bold text-orange-400">
            {result.hourlyEmission.toFixed(4)}
          </p>
          <p className="text-sm text-gray-400">kg/hr</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Daily Emission</p>
          <p className="text-xl font-bold text-white">
            {result.dailyEmission.toFixed(2)} kg/day
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Annual Emission</p>
          <p className="text-xl font-bold text-white">
            {result.annualEmission.toFixed(2)} tons/year
          </p>
        </div>
      </div>
    </div>
  )
}

function StackDilutionResultDisplay({ result }: { result: StackDilutionResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-400">Effective Stack Height</p>
        <p className="text-5xl font-bold text-purple-400">
          {result.effectiveHeight.toFixed(1)} m
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Plume Rise (Δh)</p>
          <p className="text-xl font-bold text-white">
            {result.plumeRise.toFixed(2)} m
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">Buoyancy Flux (F)</p>
          <p className="text-xl font-bold text-white">
            {result.buoyancyFlux.toFixed(2)} m⁴/s³
          </p>
        </div>
      </div>
      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm text-gray-400">Momentum Flux (M)</p>
        <p className="text-xl font-bold text-white">
          {result.momentumFlux.toFixed(2)} m⁴/s²
        </p>
      </div>
    </div>
  )
}

function GaussianDispersionResultDisplay({ result }: { result: GaussianDispersionResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-400">Ground-Level Concentration</p>
        <p className="text-4xl font-bold text-indigo-400">
          {result.concentration.toFixed(4)} µg/m³
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">σy (Horizontal)</p>
          <p className="text-xl font-bold text-white">
            {result.sigmaY.toFixed(2)} m
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-400">σz (Vertical)</p>
          <p className="text-xl font-bold text-white">
            {result.sigmaZ.toFixed(2)} m
          </p>
        </div>
      </div>
      <div className="bg-gray-700/50 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-2">Maximum Ground-Level Concentration</p>
        <p className="text-white">
          ~{result.maxGroundConcentration.toFixed(4)} µg/m³ at ~{result.maxDistance.toFixed(0)} m
        </p>
      </div>
    </div>
  )
}

// ============================================
// UNIFIED RESULT COMPONENT
// ============================================

interface AirQualityResultsProps {
  result: CalculationResult
}

export function AirQualityResults({ result }: AirQualityResultsProps) {
  if (isAQIResult(result)) {
    return <AQIResultDisplay result={result} />
  }
  if (isConversionResult(result)) {
    return <ConversionResultDisplay result={result} />
  }
  if (isThaiComplianceResult(result)) {
    return <ThaiComplianceResultDisplay result={result} />
  }
  if (isEmissionRateResult(result)) {
    return <EmissionRateResultDisplay result={result} />
  }
  if (isStackDilutionResult(result)) {
    return <StackDilutionResultDisplay result={result} />
  }
  if (isGaussianDispersionResult(result)) {
    return <GaussianDispersionResultDisplay result={result} />
  }
  return null
}
