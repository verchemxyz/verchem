'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle,
  Droplets,
  FlaskConical,
  Leaf,
  Mountain,
  RefreshCw,
  Scan,
  Skull,
  Sprout,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  checkSoilContamination,
  classifySoilpH,
  analyzeNPK,
  calculateCEC,
  calculateOrganicMatter,
  classifySoilTexture,
  assessSalinity,
  HEAVY_METAL_INFO,
  THAI_SOIL_STANDARDS,
} from '@/lib/calculations/soil-quality'
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

type CalculationResult =
  | SoilContaminationResult
  | SoilpHResult
  | NPKAnalysisResult
  | CECResult
  | OrganicMatterResult
  | SoilTextureResult
  | SalinityResult

interface ModeConfig {
  id: SoilQualityMode
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const MODES: ModeConfig[] = [
  {
    id: 'contamination',
    name: 'Heavy Metal Check',
    description: 'Check soil contamination against Thai PCD standards',
    icon: <Skull className="h-5 w-5" />,
    color: 'from-red-600 to-orange-600',
  },
  {
    id: 'ph_classification',
    name: 'Soil pH',
    description: 'Classify soil pH and get amendment recommendations',
    icon: <FlaskConical className="h-5 w-5" />,
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'npk_analysis',
    name: 'NPK Analysis',
    description: 'Analyze nitrogen, phosphorus, and potassium levels',
    icon: <Sprout className="h-5 w-5" />,
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'cec',
    name: 'CEC Calculator',
    description: 'Calculate Cation Exchange Capacity and base saturation',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-yellow-600 to-amber-600',
  },
  {
    id: 'organic_matter',
    name: 'Organic Matter',
    description: 'Determine organic matter content and soil health',
    icon: <Leaf className="h-5 w-5" />,
    color: 'from-lime-600 to-green-600',
  },
  {
    id: 'texture',
    name: 'Soil Texture',
    description: 'Classify soil texture using USDA texture triangle',
    icon: <Mountain className="h-5 w-5" />,
    color: 'from-amber-600 to-yellow-600',
  },
  {
    id: 'salinity',
    name: 'Salinity/Sodicity',
    description: 'Assess soil salinity and sodicity status',
    icon: <Droplets className="h-5 w-5" />,
    color: 'from-blue-600 to-cyan-600',
  },
]

const METAL_OPTIONS: { value: HeavyMetal; label: string }[] = [
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

const LAND_USE_OPTIONS: { value: ThaiLandUseType; label: string }[] = [
  { value: 'residential', label: 'Residential (ที่อยู่อาศัย)' },
  { value: 'industrial', label: 'Industrial (อุตสาหกรรม)' },
  { value: 'agricultural', label: 'Agricultural (เกษตรกรรม)' },
]

export default function SoilQualityPage() {
  const [mode, setMode] = useState<SoilQualityMode>('contamination')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  // Contamination inputs
  const [contMetal, setContMetal] = useState<HeavyMetal>('pb')
  const [contConcentration, setContConcentration] = useState('')
  const [contLandUse, setContLandUse] = useState<ThaiLandUseType>('residential')

  // pH inputs
  const [phValue, setPhValue] = useState('')

  // NPK inputs
  const [npkNitrogen, setNpkNitrogen] = useState('')
  const [npkPhosphorus, setNpkPhosphorus] = useState('')
  const [npkPotassium, setNpkPotassium] = useState('')
  const [npkOm, setNpkOm] = useState('')

  // CEC inputs
  const [cecValue, setCecValue] = useState('')
  const [cecCalcium, setCecCalcium] = useState('')
  const [cecMagnesium, setCecMagnesium] = useState('')
  const [cecPotassium, setCecPotassium] = useState('')
  const [cecSodium, setCecSodium] = useState('')

  // Organic matter inputs
  const [omMethod, setOmMethod] = useState<'direct' | 'carbon' | 'loi'>('direct')
  const [omValue, setOmValue] = useState('')

  // Texture inputs
  const [texSand, setTexSand] = useState('')
  const [texSilt, setTexSilt] = useState('')
  const [texClay, setTexClay] = useState('')

  // Salinity inputs
  const [salEc, setSalEc] = useState('')
  const [salSar, setSalSar] = useState('')
  const [salEsp, setSalEsp] = useState('')

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    setError('')

    setTimeout(() => {
      try {
        let calcResult: CalculationResult

        switch (mode) {
          case 'contamination': {
            const concentration = parseFloat(contConcentration)
            if (isNaN(concentration)) {
              throw new Error('Please enter a valid concentration')
            }
            calcResult = checkSoilContamination(contMetal, concentration, contLandUse)
            break
          }

          case 'ph_classification': {
            const ph = parseFloat(phValue)
            if (isNaN(ph)) {
              throw new Error('Please enter a valid pH value')
            }
            calcResult = classifySoilpH(ph)
            break
          }

          case 'npk_analysis': {
            const n = npkNitrogen ? parseFloat(npkNitrogen) : undefined
            const p = npkPhosphorus ? parseFloat(npkPhosphorus) : undefined
            const k = npkPotassium ? parseFloat(npkPotassium) : undefined
            const om = npkOm ? parseFloat(npkOm) : undefined

            if (n === undefined && p === undefined && k === undefined) {
              throw new Error('Please enter at least one nutrient value')
            }
            calcResult = analyzeNPK({ nitrogen: n, phosphorus: p, potassium: k, organicMatter: om })
            break
          }

          case 'cec': {
            const cec = parseFloat(cecValue)
            if (isNaN(cec)) {
              throw new Error('Please enter a valid CEC value')
            }

            const ca = cecCalcium ? parseFloat(cecCalcium) : undefined
            const mg = cecMagnesium ? parseFloat(cecMagnesium) : undefined
            const k = cecPotassium ? parseFloat(cecPotassium) : undefined
            const na = cecSodium ? parseFloat(cecSodium) : undefined

            if (ca !== undefined && mg !== undefined && k !== undefined && na !== undefined) {
              calcResult = calculateCEC({ calcium: ca, magnesium: mg, potassium: k, sodium: na, cec })
            } else {
              calcResult = calculateCEC({ calcium: 0, magnesium: 0, potassium: 0, sodium: 0, cec })
            }
            break
          }

          case 'organic_matter': {
            const value = parseFloat(omValue)
            if (isNaN(value)) {
              throw new Error('Please enter a valid value')
            }

            const input = omMethod === 'direct'
              ? { organicMatter: value }
              : omMethod === 'carbon'
              ? { organicCarbon: value }
              : { lossOnIgnition: value }

            calcResult = calculateOrganicMatter(input)
            break
          }

          case 'texture': {
            const sand = parseFloat(texSand)
            const silt = parseFloat(texSilt)
            const clay = parseFloat(texClay)

            if (isNaN(sand) || isNaN(silt) || isNaN(clay)) {
              throw new Error('Please enter all particle size values')
            }
            calcResult = classifySoilTexture({ sand, silt, clay })
            break
          }

          case 'salinity': {
            const ec = parseFloat(salEc)
            if (isNaN(ec)) {
              throw new Error('Please enter a valid EC value')
            }

            const sar = salSar ? parseFloat(salSar) : undefined
            const esp = salEsp ? parseFloat(salEsp) : undefined

            calcResult = assessSalinity({ ec, sar, esp })
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
    contMetal, contConcentration, contLandUse,
    phValue,
    npkNitrogen, npkPhosphorus, npkPotassium, npkOm,
    cecValue, cecCalcium, cecMagnesium, cecPotassium, cecSodium,
    omMethod, omValue,
    texSand, texSilt, texClay,
    salEc, salSar, salEsp,
  ])

  const handleReset = useCallback(() => {
    setResult(null)
    setError('')
  }, [])

  const renderInputForm = () => {
    switch (mode) {
      case 'contamination':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Heavy Metal
              </label>
              <select
                value={contMetal}
                onChange={(e) => setContMetal(e.target.value as HeavyMetal)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {METAL_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concentration (mg/kg)
              </label>
              <input
                type="number"
                value={contConcentration}
                onChange={(e) => setContConcentration(e.target.value)}
                placeholder="Enter concentration in mg/kg"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                Thai PCD limit for {HEAVY_METAL_INFO[contMetal].name}: {
                  THAI_SOIL_STANDARDS.find(s => s.metal === contMetal)?.[contLandUse] ?? 'N/A'
                } mg/kg ({contLandUse})
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Land Use Type
              </label>
              <select
                value={contLandUse}
                onChange={(e) => setContLandUse(e.target.value as ThaiLandUseType)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {LAND_USE_OPTIONS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 'ph_classification':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Soil pH
              </label>
              <input
                type="number"
                step="0.1"
                value={phValue}
                onChange={(e) => setPhValue(e.target.value)}
                placeholder="Enter pH value (0-14)"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                Most crops grow best in pH 6.0-7.5
              </p>
            </div>
            {/* pH Scale Visual */}
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">pH Scale Reference:</p>
              <div className="flex rounded-lg overflow-hidden text-xs">
                <div className="flex-1 bg-red-600 p-1 text-center" title="Ultra acidic">0-3.5</div>
                <div className="flex-1 bg-orange-500 p-1 text-center" title="Strongly acidic">3.5-5.5</div>
                <div className="flex-1 bg-yellow-500 p-1 text-center text-black" title="Moderately acidic">5.5-6.5</div>
                <div className="flex-1 bg-green-500 p-1 text-center" title="Neutral">6.5-7.5</div>
                <div className="flex-1 bg-cyan-500 p-1 text-center" title="Slightly alkaline">7.5-8.5</div>
                <div className="flex-1 bg-blue-600 p-1 text-center" title="Strongly alkaline">8.5-14</div>
              </div>
              <div className="flex text-xs mt-1 text-gray-400">
                <span className="flex-1 text-center">Acidic</span>
                <span className="flex-1 text-center">Neutral</span>
                <span className="flex-1 text-center">Alkaline</span>
              </div>
            </div>
          </div>
        )

      case 'npk_analysis':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nitrogen (Total N, %)
              </label>
              <input
                type="number"
                step="0.01"
                value={npkNitrogen}
                onChange={(e) => setNpkNitrogen(e.target.value)}
                placeholder="e.g., 0.15"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phosphorus (Available P, mg/kg)
              </label>
              <input
                type="number"
                step="1"
                value={npkPhosphorus}
                onChange={(e) => setNpkPhosphorus(e.target.value)}
                placeholder="e.g., 25"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Potassium (Exchangeable K, mg/kg)
              </label>
              <input
                type="number"
                step="1"
                value={npkPotassium}
                onChange={(e) => setNpkPotassium(e.target.value)}
                placeholder="e.g., 150"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organic Matter (%, optional)
              </label>
              <input
                type="number"
                step="0.1"
                value={npkOm}
                onChange={(e) => setNpkOm(e.target.value)}
                placeholder="e.g., 2.5"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )

      case 'cec':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CEC (cmol/kg or meq/100g)
              </label>
              <input
                type="number"
                step="0.1"
                value={cecValue}
                onChange={(e) => setCecValue(e.target.value)}
                placeholder="Enter CEC value"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                Typical range: Sandy soil 3-10, Loam 10-20, Clay 20-50+
              </p>
            </div>
            <div className="border-t border-gray-600 pt-4">
              <p className="text-sm font-medium text-gray-300 mb-3">
                Base Cations (optional, for saturation calculation):
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ca2+ (cmol/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cecCalcium}
                    onChange={(e) => setCecCalcium(e.target.value)}
                    placeholder="Ca"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Mg2+ (cmol/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cecMagnesium}
                    onChange={(e) => setCecMagnesium(e.target.value)}
                    placeholder="Mg"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">K+ (cmol/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cecPotassium}
                    onChange={(e) => setCecPotassium(e.target.value)}
                    placeholder="K"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Na+ (cmol/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cecSodium}
                    onChange={(e) => setCecSodium(e.target.value)}
                    placeholder="Na"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'organic_matter':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Measurement Method
              </label>
              <select
                value={omMethod}
                onChange={(e) => setOmMethod(e.target.value as 'direct' | 'carbon' | 'loi')}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              >
                <option value="direct">Direct Organic Matter (%)</option>
                <option value="carbon">Organic Carbon (%) - Walkley-Black</option>
                <option value="loi">Loss on Ignition (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {omMethod === 'direct' ? 'Organic Matter (%)' :
                 omMethod === 'carbon' ? 'Organic Carbon (%)' : 'Loss on Ignition (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={omValue}
                onChange={(e) => setOmValue(e.target.value)}
                placeholder={omMethod === 'direct' ? 'e.g., 3.5' :
                             omMethod === 'carbon' ? 'e.g., 2.0' : 'e.g., 5.0'}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                {omMethod === 'carbon' && 'Will convert using Van Bemmelen factor (1.724)'}
                {omMethod === 'loi' && 'Will convert using standard factor (0.7)'}
              </p>
            </div>
          </div>
        )

      case 'texture':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Enter particle size distribution (must sum to 100%):
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sand (%) - 2.0 to 0.05 mm
              </label>
              <input
                type="number"
                step="1"
                value={texSand}
                onChange={(e) => setTexSand(e.target.value)}
                placeholder="e.g., 40"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Silt (%) - 0.05 to 0.002 mm
              </label>
              <input
                type="number"
                step="1"
                value={texSilt}
                onChange={(e) => setTexSilt(e.target.value)}
                placeholder="e.g., 40"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Clay (%) - less than 0.002 mm
              </label>
              <input
                type="number"
                step="1"
                value={texClay}
                onChange={(e) => setTexClay(e.target.value)}
                placeholder="e.g., 20"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            {texSand && texSilt && texClay && (
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  Total: {(parseFloat(texSand) || 0) + (parseFloat(texSilt) || 0) + (parseFloat(texClay) || 0)}%
                  {Math.abs((parseFloat(texSand) || 0) + (parseFloat(texSilt) || 0) + (parseFloat(texClay) || 0) - 100) < 0.1
                    ? <span className="text-green-400 ml-2">Valid</span>
                    : <span className="text-red-400 ml-2">Must equal 100%</span>
                  }
                </p>
              </div>
            )}
          </div>
        )

      case 'salinity':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Electrical Conductivity (EC, dS/m)
              </label>
              <input
                type="number"
                step="0.1"
                value={salEc}
                onChange={(e) => setSalEc(e.target.value)}
                placeholder="Enter EC value"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                Non-saline: &lt;2, Slightly: 2-4, Moderately: 4-8, Strongly: 8-16, Very strongly: &gt;16
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SAR - Sodium Adsorption Ratio (optional)
              </label>
              <input
                type="number"
                step="0.1"
                value={salSar}
                onChange={(e) => setSalSar(e.target.value)}
                placeholder="Enter SAR value"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ESP - Exchangeable Sodium Percentage (%, optional)
              </label>
              <input
                type="number"
                step="0.1"
                value={salEsp}
                onChange={(e) => setSalEsp(e.target.value)}
                placeholder="Enter ESP value"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                If SAR is provided, ESP will be calculated automatically
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'safe': return 'bg-green-500'
      case 'caution': return 'bg-yellow-500'
      case 'hazardous': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'very_low': return 'bg-red-500'
      case 'low': return 'bg-orange-500'
      case 'medium': return 'bg-green-500'
      case 'high': return 'bg-blue-500'
      case 'very_high': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const renderResult = () => {
    if (!result) return null

    if ('metal' in result && 'isCompliant' in result) {
      // Contamination result
      const contResult = result as SoilContaminationResult
      return (
        <div className="space-y-4">
          {/* Risk indicator */}
          <div className={`p-4 rounded-lg ${getRiskColor(contResult.riskLevel)} text-white`}>
            <div className="flex items-center gap-3">
              {contResult.isCompliant ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
              <div>
                <p className="text-xl font-bold">
                  {contResult.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </p>
                <p className="text-sm opacity-90">
                  Risk Level: {contResult.riskLevel.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Metal</p>
              <p className="text-2xl font-bold text-white">{contResult.metal.symbol}</p>
              <p className="text-sm text-gray-300">{contResult.metal.name} ({contResult.metal.nameThai})</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Concentration</p>
              <p className="text-2xl font-bold text-white">{contResult.concentration}</p>
              <p className="text-sm text-gray-300">{contResult.unit}</p>
            </div>
          </div>

          {/* Standard */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Thai PCD Standard ({contResult.landUseType})</p>
            <p className="text-lg text-white">
              Limit: <span className="font-bold">{contResult.standard[contResult.landUseType]}</span> mg/kg
            </p>
            {contResult.exceedancePercent !== undefined && (
              <p className="text-red-400 mt-1">
                Exceeds limit by {contResult.exceedancePercent.toFixed(1)}%
              </p>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Recommendations</p>
            <ul className="space-y-1">
              {contResult.recommendations.map((rec, i) => (
                <li key={i} className="text-white flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-1 text-amber-400 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    if ('classification' in result && 'hydrogenConcentration' in result) {
      // pH result
      const phResult = result as SoilpHResult
      const getPhColor = () => {
        if (phResult.ph < 5.5) return 'bg-red-500'
        if (phResult.ph < 6.5) return 'bg-orange-500'
        if (phResult.ph < 7.5) return 'bg-green-500'
        if (phResult.ph < 8.5) return 'bg-cyan-500'
        return 'bg-blue-500'
      }

      return (
        <div className="space-y-4">
          {/* pH indicator */}
          <div className={`p-4 rounded-lg ${getPhColor()} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{phResult.ph.toFixed(2)}</p>
                <p className="text-lg">{phResult.classification.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">[H+] = {phResult.hydrogenConcentration.toExponential(2)} mol/L</p>
              </div>
            </div>
          </div>

          {/* Classification info */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">pH Range</p>
            <p className="text-white">{phResult.classification.range.min} - {phResult.classification.range.max}</p>
            <p className="text-gray-300 mt-2">{phResult.classification.nutrientAvailability}</p>
          </div>

          {/* Suitable crops */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Suitable Crops</p>
            <div className="flex flex-wrap gap-2">
              {phResult.classification.suitableCrops.map((crop, i) => (
                <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                  {crop}
                </span>
              ))}
            </div>
          </div>

          {/* Amendments */}
          {phResult.classification.amendments.length > 0 && (
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Recommended Amendments</p>
              <ul className="space-y-1">
                {phResult.classification.amendments.map((amend, i) => (
                  <li key={i} className="text-white flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-purple-400 flex-shrink-0" />
                    {amend}
                  </li>
                ))}
              </ul>
              {phResult.limeRequirement && (
                <p className="mt-2 text-amber-400">
                  Lime requirement: ~{phResult.limeRequirement.toFixed(1)} tons/hectare
                </p>
              )}
              {phResult.sulfurRequirement && (
                <p className="mt-2 text-amber-400">
                  Sulfur requirement: ~{phResult.sulfurRequirement.toFixed(0)} kg/hectare
                </p>
              )}
            </div>
          )}
        </div>
      )
    }

    if ('npkRatio' in result) {
      // NPK result
      const npkResult = result as NPKAnalysisResult
      return (
        <div className="space-y-4">
          {/* NPK Overview */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">NPK Ratio</p>
            <p className="text-3xl font-bold">{npkResult.npkRatio}</p>
            <p className="mt-2">
              Overall Fertility: <span className="font-semibold capitalize">{npkResult.overallFertility.replace('_', ' ')}</span>
            </p>
          </div>

          {/* Individual nutrients */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-green-400 font-bold text-2xl">N</p>
              <p className="text-white text-lg">{npkResult.nitrogen.value}%</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${getLevelColor(npkResult.nitrogen.level)}`}>
                {npkResult.nitrogen.level.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-orange-400 font-bold text-2xl">P</p>
              <p className="text-white text-lg">{npkResult.phosphorus.value} ppm</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${getLevelColor(npkResult.phosphorus.level)}`}>
                {npkResult.phosphorus.level.replace('_', ' ')}
              </span>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-purple-400 font-bold text-2xl">K</p>
              <p className="text-white text-lg">{npkResult.potassium.value} ppm</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${getLevelColor(npkResult.potassium.level)}`}>
                {npkResult.potassium.level.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Fertilizer recommendations */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Fertilizer Recommendations</p>
            <ul className="space-y-1">
              {npkResult.fertilizerRecommendation.map((rec, i) => (
                <li key={i} className="text-white flex items-start gap-2">
                  <Sprout className="h-4 w-4 mt-1 text-green-400 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    if ('cec' in result && 'classification' in result && 'interpretation' in result) {
      // CEC result
      const cecResult = result as CECResult
      return (
        <div className="space-y-4">
          {/* CEC Value */}
          <div className="bg-gradient-to-r from-yellow-600 to-amber-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Cation Exchange Capacity</p>
            <p className="text-4xl font-bold">{cecResult.cec} <span className="text-lg">{cecResult.unit}</span></p>
            <p className="mt-2 capitalize">{cecResult.classification.replace('_', ' ')}</p>
          </div>

          {/* Soil type */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Typical Soil Type</p>
            <p className="text-white text-lg">{cecResult.soilType}</p>
            <p className="text-gray-300 mt-2">{cecResult.interpretation}</p>
          </div>

          {/* Base saturations */}
          {cecResult.baseSaturation !== undefined && (
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-3">Base Saturation: {cecResult.baseSaturation.toFixed(1)}%</p>
              <div className="space-y-2">
                {cecResult.calciumSaturation !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-gray-300">Ca:</span>
                    <div className="flex-1 bg-gray-600 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full"
                        style={{ width: `${Math.min(cecResult.calciumSaturation, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-white">{cecResult.calciumSaturation.toFixed(1)}%</span>
                  </div>
                )}
                {cecResult.magnesiumSaturation !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-gray-300">Mg:</span>
                    <div className="flex-1 bg-gray-600 rounded-full h-4">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${Math.min(cecResult.magnesiumSaturation, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-white">{cecResult.magnesiumSaturation.toFixed(1)}%</span>
                  </div>
                )}
                {cecResult.potassiumSaturation !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-gray-300">K:</span>
                    <div className="flex-1 bg-gray-600 rounded-full h-4">
                      <div
                        className="bg-purple-500 h-4 rounded-full"
                        style={{ width: `${Math.min(cecResult.potassiumSaturation * 10, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-white">{cecResult.potassiumSaturation.toFixed(1)}%</span>
                  </div>
                )}
                {cecResult.sodiumSaturation !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-gray-300">Na:</span>
                    <div className="flex-1 bg-gray-600 rounded-full h-4">
                      <div
                        className="bg-red-500 h-4 rounded-full"
                        style={{ width: `${Math.min(cecResult.sodiumSaturation * 5, 100)}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-white">{cecResult.sodiumSaturation.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    if ('organicMatter' in result && 'organicCarbon' in result) {
      // Organic matter result
      const omResult = result as OrganicMatterResult
      return (
        <div className="space-y-4">
          {/* OM Value */}
          <div className="bg-gradient-to-r from-lime-600 to-green-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Organic Matter Content</p>
            <p className="text-4xl font-bold">{omResult.organicMatter.toFixed(2)}%</p>
            <p className="mt-2 capitalize">{omResult.classification.replace('_', ' ')}</p>
          </div>

          {/* Carbon content */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Organic Carbon</p>
            <p className="text-white text-2xl">{omResult.organicCarbon.toFixed(2)}%</p>
            {omResult.carbonNitrogenRatio && (
              <p className="text-gray-300 mt-2">C:N Ratio: {omResult.carbonNitrogenRatio.toFixed(1)}</p>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Soil Health Benefits</p>
            <ul className="space-y-1">
              {omResult.benefits.map((benefit, i) => (
                <li key={i} className="text-green-400 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Recommendations</p>
            <ul className="space-y-1">
              {omResult.recommendations.map((rec, i) => (
                <li key={i} className="text-white flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 mt-1 text-lime-400 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    if ('textureClass' in result) {
      // Texture result
      const texResult = result as SoilTextureResult
      return (
        <div className="space-y-4">
          {/* Texture class */}
          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-4 rounded-lg text-white">
            <p className="text-sm opacity-90">Soil Texture Class</p>
            <p className="text-3xl font-bold capitalize">{texResult.textureClass.replace('_', ' ')}</p>
            <p className="text-sm mt-1 opacity-90">{texResult.textureTriangle}</p>
          </div>

          {/* Particle distribution */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-3">Particle Size Distribution</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">Sand:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-yellow-500 h-4 rounded-full"
                    style={{ width: `${texResult.sand}%` }}
                  />
                </div>
                <span className="w-12 text-right text-white">{texResult.sand}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">Silt:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-amber-500 h-4 rounded-full"
                    style={{ width: `${texResult.silt}%` }}
                  />
                </div>
                <span className="w-12 text-right text-white">{texResult.silt}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">Clay:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-orange-600 h-4 rounded-full"
                    style={{ width: `${texResult.clay}%` }}
                  />
                </div>
                <span className="w-12 text-right text-white">{texResult.clay}%</span>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Water Holding Capacity</p>
              <p className="text-white">{texResult.waterHoldingCapacity}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Drainage</p>
              <p className="text-white">{texResult.drainage}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Workability</p>
              <p className="text-white">{texResult.workability}</p>
            </div>
          </div>
        </div>
      )
    }

    if ('salinityClass' in result) {
      // Salinity result
      const salResult = result as SalinityResult
      const getSalinityColor = () => {
        switch (salResult.salinityClass) {
          case 'non_saline': return 'bg-green-500'
          case 'slightly_saline': return 'bg-yellow-500'
          case 'moderately_saline': return 'bg-orange-500'
          case 'strongly_saline': return 'bg-red-500'
          case 'very_strongly_saline': return 'bg-red-700'
          default: return 'bg-gray-500'
        }
      }

      return (
        <div className="space-y-4">
          {/* Salinity indicator */}
          <div className={`p-4 rounded-lg ${getSalinityColor()} text-white`}>
            <p className="text-sm opacity-90">Soil Classification</p>
            <p className="text-3xl font-bold capitalize">{salResult.soilClassification.replace('_', ' ')}</p>
            <p className="mt-2">EC: {salResult.ec} dS/m</p>
          </div>

          {/* Classification details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Salinity Class</p>
              <p className="text-white capitalize">{salResult.salinityClass.replace(/_/g, ' ')}</p>
            </div>
            {salResult.sodicityClass && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Sodicity Class</p>
                <p className="text-white capitalize">{salResult.sodicityClass.replace(/_/g, ' ')}</p>
              </div>
            )}
            {salResult.sar !== undefined && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">SAR</p>
                <p className="text-white">{salResult.sar.toFixed(1)}</p>
              </div>
            )}
            {salResult.esp !== undefined && (
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">ESP</p>
                <p className="text-white">{salResult.esp.toFixed(1)}%</p>
              </div>
            )}
          </div>

          {/* Crop tolerance */}
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Crop Tolerance</p>
            <div className="flex flex-wrap gap-2">
              {salResult.cropTolerance.map((crop, i) => (
                <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                  {crop}
                </span>
              ))}
            </div>
          </div>

          {/* Remediation */}
          {salResult.remediation.length > 0 && (
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Remediation Strategies</p>
              <ul className="space-y-1">
                {salResult.remediation.map((rem, i) => (
                  <li key={i} className="text-white flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-blue-400 flex-shrink-0" />
                    {rem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  const currentMode = MODES.find(m => m.id === mode)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800 to-yellow-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-amber-200 mb-4">
            <Link href="/tools" className="hover:text-white transition-colors">Tools</Link>
            <span>/</span>
            <span>Soil Quality</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Soil Quality Calculator</h1>
          <p className="text-xl text-amber-100 max-w-3xl">
            Comprehensive soil analysis tools including heavy metal contamination check (Thai PCD standards),
            pH classification, NPK analysis, CEC, organic matter, texture, and salinity assessment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mode selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id)
                handleReset()
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === m.id
                  ? `border-amber-500 bg-gradient-to-r ${m.color} text-white`
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {m.icon}
                <span className="mt-2 text-sm font-medium">{m.name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${currentMode?.color}`}>
                {currentMode?.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentMode?.name}</h2>
                <p className="text-sm text-gray-400">{currentMode?.description}</p>
              </div>
            </div>

            {renderInputForm()}

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCalculating ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Calculator className="h-5 w-5" />
                )}
                Calculate
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Result panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Scan className="h-5 w-5 text-amber-400" />
              Analysis Results
            </h2>

            {result ? (
              renderResult()
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Mountain className="h-16 w-16 mb-4" />
                <p>Enter values and click Calculate</p>
                <p className="text-sm mt-2">Results will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">About Thai PCD Standards</h3>
            <p className="text-gray-300 text-sm">
              The Pollution Control Department (กรมควบคุมมลพิษ) of Thailand has established soil contamination
              standards based on land use type. These standards help determine if soil is safe for residential,
              industrial, or agricultural use.
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Reference: ประกาศกรมควบคุมมลพิษ พ.ศ. 2547
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">USDA Soil Texture Triangle</h3>
            <p className="text-gray-300 text-sm">
              The soil texture triangle is a diagram used to classify soil based on the relative proportions
              of sand, silt, and clay particles. It helps determine water retention, drainage, and
              nutrient-holding capacity.
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Reference: USDA Soil Survey Manual
            </p>
          </div>
        </div>

        {/* Related tools */}
        <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Related Environmental Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/tools/water-quality"
              className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Droplets className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Water Quality</p>
                  <p className="text-sm text-gray-400">BOD, COD, Thai Standards</p>
                </div>
              </div>
            </Link>
            <Link
              href="/tools/air-quality"
              className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Scan className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Air Quality</p>
                  <p className="text-sm text-gray-400">AQI, Dispersion, Emissions</p>
                </div>
              </div>
            </Link>
            <Link
              href="/tools/ph-calculator"
              className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FlaskConical className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">pH Calculator</p>
                  <p className="text-sm text-gray-400">Solutions & Buffers</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
