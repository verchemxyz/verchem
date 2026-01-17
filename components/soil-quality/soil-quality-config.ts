'use client'

import React from 'react'
import {
  Droplets,
  FlaskConical,
  Leaf,
  Mountain,
  Skull,
  Sprout,
  Zap,
} from 'lucide-react'
import type {
  SoilQualityMode,
  HeavyMetal,
  ThaiLandUseType,
  SoilContaminationResult,
  SoilpHResult,
  NPKAnalysisResult,
  CECResult,
  OrganicMatterResult,
  SoilTextureResult,
  SalinityResult,
} from '@/lib/types/soil-quality'

// ============================================
// TYPES
// ============================================

export type CalculationResult =
  | SoilContaminationResult
  | SoilpHResult
  | NPKAnalysisResult
  | CECResult
  | OrganicMatterResult
  | SoilTextureResult
  | SalinityResult

export interface ModeConfig {
  id: SoilQualityMode
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
    id: 'contamination',
    name: 'Heavy Metal Check',
    description: 'Check soil contamination against Thai PCD standards',
    icon: React.createElement(Skull, { className: 'h-5 w-5' }),
    color: 'from-red-600 to-orange-600',
  },
  {
    id: 'ph_classification',
    name: 'Soil pH',
    description: 'Classify soil pH and get amendment recommendations',
    icon: React.createElement(FlaskConical, { className: 'h-5 w-5' }),
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'npk_analysis',
    name: 'NPK Analysis',
    description: 'Analyze nitrogen, phosphorus, and potassium levels',
    icon: React.createElement(Sprout, { className: 'h-5 w-5' }),
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'cec',
    name: 'CEC Calculator',
    description: 'Calculate Cation Exchange Capacity and base saturation',
    icon: React.createElement(Zap, { className: 'h-5 w-5' }),
    color: 'from-yellow-600 to-amber-600',
  },
  {
    id: 'organic_matter',
    name: 'Organic Matter',
    description: 'Determine organic matter content and soil health',
    icon: React.createElement(Leaf, { className: 'h-5 w-5' }),
    color: 'from-lime-600 to-green-600',
  },
  {
    id: 'texture',
    name: 'Soil Texture',
    description: 'Classify soil texture using USDA texture triangle',
    icon: React.createElement(Mountain, { className: 'h-5 w-5' }),
    color: 'from-amber-600 to-yellow-600',
  },
  {
    id: 'salinity',
    name: 'Salinity/Sodicity',
    description: 'Assess soil salinity and sodicity status',
    icon: React.createElement(Droplets, { className: 'h-5 w-5' }),
    color: 'from-blue-600 to-cyan-600',
  },
]

// ============================================
// OPTIONS
// ============================================

export const METAL_OPTIONS: { value: HeavyMetal; label: string }[] = [
  { value: 'pb', label: 'Pb (Lead - ตะกั่ว)' },
  { value: 'cd', label: 'Cd (Cadmium - แคดเมียม)' },
  { value: 'cr', label: 'Cr (Chromium - โครเมียม)' },
  { value: 'as', label: 'As (Arsenic - สารหนู)' },
  { value: 'hg', label: 'Hg (Mercury - ปรอท)' },
  { value: 'zn', label: 'Zn (Zinc - สังกะสี)' },
  { value: 'cu', label: 'Cu (Copper - ทองแดง)' },
  { value: 'ni', label: 'Ni (Nickel - นิกเกิล)' },
  { value: 'mn', label: 'Mn (Manganese - แมงกานีส)' },
  { value: 'co', label: 'Co (Cobalt - โคบอลต์)' },
]

export const LAND_USE_OPTIONS: { value: ThaiLandUseType; label: string }[] = [
  { value: 'residential', label: 'Residential (ที่อยู่อาศัย)' },
  { value: 'industrial', label: 'Industrial (อุตสาหกรรม)' },
  { value: 'agricultural', label: 'Agricultural (เกษตรกรรม)' },
]

// ============================================
// TYPE GUARDS
// ============================================

export const isContaminationResult = (r: CalculationResult): r is SoilContaminationResult =>
  'metal' in r && 'isCompliant' in r

export const isPhResult = (r: CalculationResult): r is SoilpHResult =>
  'classification' in r && 'hydrogenConcentration' in r

export const isNpkResult = (r: CalculationResult): r is NPKAnalysisResult =>
  'npkRatio' in r

export const isCecResult = (r: CalculationResult): r is CECResult =>
  'cec' in r && 'classification' in r && 'interpretation' in r

export const isOrganicMatterResult = (r: CalculationResult): r is OrganicMatterResult =>
  'organicMatter' in r && 'organicCarbon' in r

export const isTextureResult = (r: CalculationResult): r is SoilTextureResult =>
  'textureClass' in r

export const isSalinityResult = (r: CalculationResult): r is SalinityResult =>
  'salinityClass' in r

// ============================================
// COLOR HELPERS
// ============================================

export const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'safe': return 'bg-green-500'
    case 'caution': return 'bg-yellow-500'
    case 'hazardous': return 'bg-orange-500'
    case 'critical': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export const getLevelColor = (level: string) => {
  switch (level) {
    case 'very_low': return 'bg-red-500'
    case 'low': return 'bg-orange-500'
    case 'medium': return 'bg-green-500'
    case 'high': return 'bg-blue-500'
    case 'very_high': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

export const getPhColor = (ph: number) => {
  if (ph < 5.5) return 'bg-red-500'
  if (ph < 6.5) return 'bg-orange-500'
  if (ph < 7.5) return 'bg-green-500'
  if (ph < 8.5) return 'bg-cyan-500'
  return 'bg-blue-500'
}

export const getSalinityColor = (salinityClass: string) => {
  switch (salinityClass) {
    case 'non_saline': return 'bg-green-500'
    case 'slightly_saline': return 'bg-yellow-500'
    case 'moderately_saline': return 'bg-orange-500'
    case 'strongly_saline': return 'bg-red-500'
    case 'very_strongly_saline': return 'bg-red-700'
    default: return 'bg-gray-500'
  }
}
