'use client'

import React from 'react'
import {
  Droplets,
  Gauge,
  FlaskConical,
  Calculator,
  Factory,
  RefreshCw,
  Zap,
  Thermometer,
  Leaf,
} from 'lucide-react'
import type {
  WaterQualityMode,
  BOD5Result,
  BODuResult,
  CODResult,
  BODCODRatioResult,
  BODLoadingResult,
  RemovalEfficiencyResult,
  KRateResult,
  TemperatureCorrectionResult,
  ComplianceResult,
} from '@/lib/types/environmental'

// ============================================
// TYPES
// ============================================

export type CalculationResult =
  | BOD5Result
  | BODuResult
  | CODResult
  | BODCODRatioResult
  | BODLoadingResult
  | RemovalEfficiencyResult
  | KRateResult
  | TemperatureCorrectionResult
  | ComplianceResult

export interface ModeConfig {
  id: WaterQualityMode
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
    id: 'bod5',
    name: 'BOD5 Calculator',
    description: 'Calculate BOD5 from dissolved oxygen readings',
    icon: React.createElement(Droplets, { className: 'h-5 w-5' }),
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'bodu',
    name: 'Ultimate BOD',
    description: 'Calculate ultimate BOD from BOD5 and k-rate',
    icon: React.createElement(Gauge, { className: 'h-5 w-5' }),
    color: 'from-cyan-600 to-teal-600',
  },
  {
    id: 'cod',
    name: 'COD Calculator',
    description: 'Calculate COD using dichromate method',
    icon: React.createElement(FlaskConical, { className: 'h-5 w-5' }),
    color: 'from-orange-600 to-red-600',
  },
  {
    id: 'bod_cod_ratio',
    name: 'BOD/COD Ratio',
    description: 'Determine biodegradability index',
    icon: React.createElement(Calculator, { className: 'h-5 w-5' }),
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'loading_rate',
    name: 'BOD Loading',
    description: 'Calculate BOD loading rate (kg/day)',
    icon: React.createElement(Factory, { className: 'h-5 w-5' }),
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'removal_efficiency',
    name: 'Removal Efficiency',
    description: 'Calculate treatment removal percentage',
    icon: React.createElement(RefreshCw, { className: 'h-5 w-5' }),
    color: 'from-emerald-600 to-green-600',
  },
  {
    id: 'k_rate',
    name: 'K-Rate (Thomas)',
    description: 'Determine k from BOD time series',
    icon: React.createElement(Zap, { className: 'h-5 w-5' }),
    color: 'from-yellow-600 to-amber-600',
  },
  {
    id: 'temperature_correction',
    name: 'Temp Correction',
    description: "van't Hoff temperature correction",
    icon: React.createElement(Thermometer, { className: 'h-5 w-5' }),
    color: 'from-red-600 to-orange-600',
  },
  {
    id: 'compliance_check',
    name: 'Thai Standards',
    description: 'Check compliance with Thai effluent standards',
    icon: React.createElement(Leaf, { className: 'h-5 w-5' }),
    color: 'from-teal-600 to-green-600',
  },
]

// ============================================
// TYPE GUARDS
// ============================================

export const isBOD5Result = (r: CalculationResult): r is BOD5Result =>
  'bod5' in r && 'oxygenDepletion' in r

export const isBODuResult = (r: CalculationResult): r is BODuResult =>
  'bodu' in r && 'f_factor' in r

export const isCODResult = (r: CalculationResult): r is CODResult =>
  'cod' in r && 'oxygenEquivalent' in r

export const isBODCODRatioResult = (r: CalculationResult): r is BODCODRatioResult =>
  'ratio' in r && 'classification' in r

export const isBODLoadingResult = (r: CalculationResult): r is BODLoadingResult =>
  'loading' in r

export const isRemovalEfficiencyResult = (r: CalculationResult): r is RemovalEfficiencyResult =>
  'efficiency' in r && 'removalRate' in r

export const isKRateResult = (r: CalculationResult): r is KRateResult =>
  'k' in r && 'r2' in r

export const isTempCorrectionResult = (r: CalculationResult): r is TemperatureCorrectionResult =>
  'kT' in r && 'theta' in r

export const isComplianceResult = (r: CalculationResult): r is ComplianceResult =>
  'isCompliant' in r && 'exceedances' in r
