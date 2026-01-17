'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Calculator,
  Droplets,
  FlaskConical,
  Mountain,
  RefreshCw,
  Scan,
} from 'lucide-react'
import {
  checkSoilContamination,
  classifySoilpH,
  analyzeNPK,
  calculateCEC,
  calculateOrganicMatter,
  classifySoilTexture,
  assessSalinity,
} from '@/lib/calculations/soil-quality'
import type {
  SoilQualityMode,
  HeavyMetal,
  ThaiLandUseType,
} from '@/lib/types/soil-quality'
import {
  MODES,
  type CalculationResult,
} from '@/components/soil-quality/soil-quality-config'
import { SoilQualityInputs } from '@/components/soil-quality/soil-quality-inputs'
import { SoilQualityResults } from '@/components/soil-quality/soil-quality-results'

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

            <SoilQualityInputs
              mode={mode}
              contMetal={contMetal}
              setContMetal={setContMetal}
              contConcentration={contConcentration}
              setContConcentration={setContConcentration}
              contLandUse={contLandUse}
              setContLandUse={setContLandUse}
              phValue={phValue}
              setPhValue={setPhValue}
              npkNitrogen={npkNitrogen}
              setNpkNitrogen={setNpkNitrogen}
              npkPhosphorus={npkPhosphorus}
              setNpkPhosphorus={setNpkPhosphorus}
              npkPotassium={npkPotassium}
              setNpkPotassium={setNpkPotassium}
              npkOm={npkOm}
              setNpkOm={setNpkOm}
              cecValue={cecValue}
              setCecValue={setCecValue}
              cecCalcium={cecCalcium}
              setCecCalcium={setCecCalcium}
              cecMagnesium={cecMagnesium}
              setCecMagnesium={setCecMagnesium}
              cecPotassium={cecPotassium}
              setCecPotassium={setCecPotassium}
              cecSodium={cecSodium}
              setCecSodium={setCecSodium}
              omMethod={omMethod}
              setOmMethod={setOmMethod}
              omValue={omValue}
              setOmValue={setOmValue}
              texSand={texSand}
              setTexSand={setTexSand}
              texSilt={texSilt}
              setTexSilt={setTexSilt}
              texClay={texClay}
              setTexClay={setTexClay}
              salEc={salEc}
              setSalEc={setSalEc}
              salSar={salSar}
              setSalSar={setSalSar}
              salEsp={salEsp}
              setSalEsp={setSalEsp}
            />

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
              <SoilQualityResults result={result} />
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
