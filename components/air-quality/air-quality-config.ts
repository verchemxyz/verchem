'use client'

import React from 'react'
import {
  CheckCircle,
  Cloud,
  Factory,
  Gauge,
  RefreshCw,
  Wind,
} from 'lucide-react'
import type {
  AirQualityMode,
  Pollutant,
  AQIResult,
  ConcentrationConversionResult,
  ThaiAirComplianceResult,
  EmissionRateResult,
  StackDilutionResult,
  GaussianDispersionResult,
} from '@/lib/types/air-quality'

// ============================================
// TYPES
// ============================================

export type CalculationResult =
  | AQIResult
  | ConcentrationConversionResult
  | ThaiAirComplianceResult
  | EmissionRateResult
  | StackDilutionResult
  | GaussianDispersionResult

export interface ModeConfig {
  id: AirQualityMode
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

// ============================================
// MODES CONFIGURATION
// ============================================

export const MODES: ModeConfig[] = [
  {
    id: 'aqi',
    name: 'AQI Calculator',
    description: 'Calculate Air Quality Index from pollutant concentration',
    icon: React.createElement(Gauge, { className: 'h-5 w-5' }),
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'concentration_conversion',
    name: 'Unit Conversion',
    description: 'Convert between ppm, ppb, µg/m³, and mg/m³',
    icon: React.createElement(RefreshCw, { className: 'h-5 w-5' }),
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'thai_standards',
    name: 'Thai Standards',
    description: 'Check compliance with Thai PCD air quality standards',
    icon: React.createElement(CheckCircle, { className: 'h-5 w-5' }),
    color: 'from-teal-600 to-green-600',
  },
  {
    id: 'emission_rate',
    name: 'Emission Rate',
    description: 'Calculate pollutant emission rate (g/s, kg/hr, tons/year)',
    icon: React.createElement(Factory, { className: 'h-5 w-5' }),
    color: 'from-orange-600 to-red-600',
  },
  {
    id: 'plume_rise',
    name: 'Plume Rise',
    description: 'Calculate effective stack height (Briggs equations)',
    icon: React.createElement(Cloud, { className: 'h-5 w-5' }),
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'stack_dispersion',
    name: 'Dispersion Model',
    description: 'Simple Gaussian dispersion for ground-level concentration',
    icon: React.createElement(Wind, { className: 'h-5 w-5' }),
    color: 'from-indigo-600 to-blue-600',
  },
]

// ============================================
// OPTIONS
// ============================================

export const POLLUTANT_OPTIONS: { value: Pollutant; label: string }[] = [
  { value: 'pm25', label: 'PM2.5 (Fine Particulates)' },
  { value: 'pm10', label: 'PM10 (Coarse Particulates)' },
  { value: 'o3', label: 'O₃ (Ozone)' },
  { value: 'co', label: 'CO (Carbon Monoxide)' },
  { value: 'no2', label: 'NO₂ (Nitrogen Dioxide)' },
  { value: 'so2', label: 'SO₂ (Sulfur Dioxide)' },
  { value: 'pb', label: 'Pb (Lead)' },
]

export const GAS_POLLUTANT_OPTIONS = POLLUTANT_OPTIONS.filter(
  p => !['pm25', 'pm10', 'pb'].includes(p.value)
)

// ============================================
// TYPE GUARDS
// ============================================

export const isAQIResult = (r: CalculationResult): r is AQIResult =>
  'aqi' in r && 'category' in r

export const isConversionResult = (r: CalculationResult): r is ConcentrationConversionResult =>
  'inputValue' in r && 'outputValue' in r && 'molarVolume' in r

export const isThaiComplianceResult = (r: CalculationResult): r is ThaiAirComplianceResult =>
  'isCompliant' in r && 'standard' in r

export const isEmissionRateResult = (r: CalculationResult): r is EmissionRateResult =>
  'massFlowRate' in r && 'annualEmission' in r

export const isStackDilutionResult = (r: CalculationResult): r is StackDilutionResult =>
  'effectiveHeight' in r && 'plumeRise' in r

export const isGaussianDispersionResult = (r: CalculationResult): r is GaussianDispersionResult =>
  'concentration' in r && 'sigmaY' in r && 'sigmaZ' in r
