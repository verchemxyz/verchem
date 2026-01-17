'use client'

import { ArrowRight, CheckCircle, Sprout, XCircle } from 'lucide-react'
import type {
  SoilContaminationResult,
  SoilpHResult,
  NPKAnalysisResult,
  CECResult,
  OrganicMatterResult,
  SoilTextureResult,
  SalinityResult,
} from '@/lib/types/soil-quality'
import {
  CalculationResult,
  isContaminationResult,
  isPhResult,
  isNpkResult,
  isCecResult,
  isOrganicMatterResult,
  isTextureResult,
  isSalinityResult,
  getRiskColor,
  getLevelColor,
  getPhColor,
  getSalinityColor,
} from './soil-quality-config'

// ============================================
// RESULT DISPLAY COMPONENTS
// ============================================

function ContaminationResultDisplay({ result }: { result: SoilContaminationResult }) {
  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getRiskColor(result.riskLevel)} text-white`}>
        <div className="flex items-center gap-3">
          {result.isCompliant ? (
            <CheckCircle className="h-8 w-8" />
          ) : (
            <XCircle className="h-8 w-8" />
          )}
          <div>
            <p className="text-xl font-bold">
              {result.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
            </p>
            <p className="text-sm opacity-90">
              Risk Level: {result.riskLevel.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Metal</p>
          <p className="text-2xl font-bold text-white">{result.metal.symbol}</p>
          <p className="text-sm text-gray-300">{result.metal.name} ({result.metal.nameThai})</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Concentration</p>
          <p className="text-2xl font-bold text-white">{result.concentration}</p>
          <p className="text-sm text-gray-300">{result.unit}</p>
        </div>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Thai PCD Standard ({result.landUseType})</p>
        <p className="text-lg text-white">
          Limit: <span className="font-bold">{result.standard[result.landUseType]}</span> mg/kg
        </p>
        {result.exceedancePercent !== undefined && (
          <p className="text-red-400 mt-1">
            Exceeds limit by {result.exceedancePercent.toFixed(1)}%
          </p>
        )}
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Recommendations</p>
        <ul className="space-y-1">
          {result.recommendations.map((rec, i) => (
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

function PhResultDisplay({ result }: { result: SoilpHResult }) {
  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getPhColor(result.ph)} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold">{result.ph.toFixed(2)}</p>
            <p className="text-lg">{result.classification.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">[H+] = {result.hydrogenConcentration.toExponential(2)} mol/L</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">pH Range</p>
        <p className="text-white">{result.classification.range.min} - {result.classification.range.max}</p>
        <p className="text-gray-300 mt-2">{result.classification.nutrientAvailability}</p>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Suitable Crops</p>
        <div className="flex flex-wrap gap-2">
          {result.classification.suitableCrops.map((crop, i) => (
            <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
              {crop}
            </span>
          ))}
        </div>
      </div>

      {result.classification.amendments.length > 0 && (
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm mb-2">Recommended Amendments</p>
          <ul className="space-y-1">
            {result.classification.amendments.map((amend, i) => (
              <li key={i} className="text-white flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-purple-400 flex-shrink-0" />
                {amend}
              </li>
            ))}
          </ul>
          {result.limeRequirement && (
            <p className="mt-2 text-amber-400">
              Lime requirement: ~{result.limeRequirement.toFixed(1)} tons/hectare
            </p>
          )}
          {result.sulfurRequirement && (
            <p className="mt-2 text-amber-400">
              Sulfur requirement: ~{result.sulfurRequirement.toFixed(0)} kg/hectare
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function NpkResultDisplay({ result }: { result: NPKAnalysisResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg text-white">
        <p className="text-sm opacity-90">NPK Ratio</p>
        <p className="text-3xl font-bold">{result.npkRatio}</p>
        <p className="mt-2">
          Overall Fertility: <span className="font-semibold capitalize">{result.overallFertility.replace('_', ' ')}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-green-400 font-bold text-2xl">N</p>
          <p className="text-white text-lg">{result.nitrogen.value}%</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${getLevelColor(result.nitrogen.level)}`}>
            {result.nitrogen.level.replace('_', ' ')}
          </span>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-orange-400 font-bold text-2xl">P</p>
          <p className="text-white text-lg">{result.phosphorus.value} ppm</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${getLevelColor(result.phosphorus.level)}`}>
            {result.phosphorus.level.replace('_', ' ')}
          </span>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg text-center">
          <p className="text-purple-400 font-bold text-2xl">K</p>
          <p className="text-white text-lg">{result.potassium.value} ppm</p>
          <span className={`inline-block px-2 py-0.5 rounded text-xs text-white mt-1 ${getLevelColor(result.potassium.level)}`}>
            {result.potassium.level.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Fertilizer Recommendations</p>
        <ul className="space-y-1">
          {result.fertilizerRecommendation.map((rec, i) => (
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

function CecResultDisplay({ result }: { result: CECResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-yellow-600 to-amber-600 p-4 rounded-lg text-white">
        <p className="text-sm opacity-90">Cation Exchange Capacity</p>
        <p className="text-4xl font-bold">{result.cec} <span className="text-lg">{result.unit}</span></p>
        <p className="mt-2 capitalize">{result.classification.replace('_', ' ')}</p>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Typical Soil Type</p>
        <p className="text-white text-lg">{result.soilType}</p>
        <p className="text-gray-300 mt-2">{result.interpretation}</p>
      </div>

      {result.baseSaturation !== undefined && (
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm mb-3">Base Saturation: {result.baseSaturation.toFixed(1)}%</p>
          <div className="space-y-2">
            {result.calciumSaturation !== undefined && (
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">Ca:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: `${Math.min(result.calciumSaturation, 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-white">{result.calciumSaturation.toFixed(1)}%</span>
              </div>
            )}
            {result.magnesiumSaturation !== undefined && (
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">Mg:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{ width: `${Math.min(result.magnesiumSaturation, 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-white">{result.magnesiumSaturation.toFixed(1)}%</span>
              </div>
            )}
            {result.potassiumSaturation !== undefined && (
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">K:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-purple-500 h-4 rounded-full"
                    style={{ width: `${Math.min(result.potassiumSaturation * 10, 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-white">{result.potassiumSaturation.toFixed(1)}%</span>
              </div>
            )}
            {result.sodiumSaturation !== undefined && (
              <div className="flex items-center gap-2">
                <span className="w-12 text-gray-300">Na:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-4">
                  <div
                    className="bg-red-500 h-4 rounded-full"
                    style={{ width: `${Math.min(result.sodiumSaturation * 5, 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-white">{result.sodiumSaturation.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OrganicMatterResultDisplay({ result }: { result: OrganicMatterResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-lime-600 to-green-600 p-4 rounded-lg text-white">
        <p className="text-sm opacity-90">Organic Matter Content</p>
        <p className="text-4xl font-bold">{result.organicMatter.toFixed(2)}%</p>
        <p className="mt-2 capitalize">{result.classification.replace('_', ' ')}</p>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Organic Carbon</p>
        <p className="text-white text-2xl">{result.organicCarbon.toFixed(2)}%</p>
        {result.carbonNitrogenRatio && (
          <p className="text-gray-300 mt-2">C:N Ratio: {result.carbonNitrogenRatio.toFixed(1)}</p>
        )}
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Soil Health Benefits</p>
        <ul className="space-y-1">
          {result.benefits.map((benefit, i) => (
            <li key={i} className="text-green-400 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Recommendations</p>
        <ul className="space-y-1">
          {result.recommendations.map((rec, i) => (
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

function TextureResultDisplay({ result }: { result: SoilTextureResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-4 rounded-lg text-white">
        <p className="text-sm opacity-90">Soil Texture Class</p>
        <p className="text-3xl font-bold capitalize">{result.textureClass.replace('_', ' ')}</p>
        <p className="text-sm mt-1 opacity-90">{result.textureTriangle}</p>
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-3">Particle Size Distribution</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-12 text-gray-300">Sand:</span>
            <div className="flex-1 bg-gray-600 rounded-full h-4">
              <div
                className="bg-yellow-500 h-4 rounded-full"
                style={{ width: `${result.sand}%` }}
              />
            </div>
            <span className="w-12 text-right text-white">{result.sand}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-gray-300">Silt:</span>
            <div className="flex-1 bg-gray-600 rounded-full h-4">
              <div
                className="bg-amber-500 h-4 rounded-full"
                style={{ width: `${result.silt}%` }}
              />
            </div>
            <span className="w-12 text-right text-white">{result.silt}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-gray-300">Clay:</span>
            <div className="flex-1 bg-gray-600 rounded-full h-4">
              <div
                className="bg-orange-600 h-4 rounded-full"
                style={{ width: `${result.clay}%` }}
              />
            </div>
            <span className="w-12 text-right text-white">{result.clay}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Water Holding Capacity</p>
          <p className="text-white">{result.waterHoldingCapacity}</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Drainage</p>
          <p className="text-white">{result.drainage}</p>
        </div>
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Workability</p>
          <p className="text-white">{result.workability}</p>
        </div>
      </div>
    </div>
  )
}

function SalinityResultDisplay({ result }: { result: SalinityResult }) {
  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getSalinityColor(result.salinityClass)} text-white`}>
        <p className="text-sm opacity-90">Soil Classification</p>
        <p className="text-3xl font-bold capitalize">{result.soilClassification.replace('_', ' ')}</p>
        <p className="mt-2">EC: {result.ec} dS/m</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Salinity Class</p>
          <p className="text-white capitalize">{result.salinityClass.replace(/_/g, ' ')}</p>
        </div>
        {result.sodicityClass && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Sodicity Class</p>
            <p className="text-white capitalize">{result.sodicityClass.replace(/_/g, ' ')}</p>
          </div>
        )}
        {result.sar !== undefined && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">SAR</p>
            <p className="text-white">{result.sar.toFixed(1)}</p>
          </div>
        )}
        {result.esp !== undefined && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">ESP</p>
            <p className="text-white">{result.esp.toFixed(1)}%</p>
          </div>
        )}
      </div>

      <div className="bg-gray-700/50 p-4 rounded-lg">
        <p className="text-gray-400 text-sm mb-2">Crop Tolerance</p>
        <div className="flex flex-wrap gap-2">
          {result.cropTolerance.map((crop, i) => (
            <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
              {crop}
            </span>
          ))}
        </div>
      </div>

      {result.remediation.length > 0 && (
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <p className="text-gray-400 text-sm mb-2">Remediation Strategies</p>
          <ul className="space-y-1">
            {result.remediation.map((rem, i) => (
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

// ============================================
// MAIN RESULT COMPONENT
// ============================================

export function SoilQualityResults({ result }: { result: CalculationResult | null }) {
  if (!result) return null

  if (isContaminationResult(result)) {
    return <ContaminationResultDisplay result={result} />
  }

  if (isPhResult(result)) {
    return <PhResultDisplay result={result} />
  }

  if (isNpkResult(result)) {
    return <NpkResultDisplay result={result} />
  }

  if (isCecResult(result)) {
    return <CecResultDisplay result={result} />
  }

  if (isOrganicMatterResult(result)) {
    return <OrganicMatterResultDisplay result={result} />
  }

  if (isTextureResult(result)) {
    return <TextureResultDisplay result={result} />
  }

  if (isSalinityResult(result)) {
    return <SalinityResultDisplay result={result} />
  }

  return null
}
