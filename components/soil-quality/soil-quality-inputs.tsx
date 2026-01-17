'use client'

import {
  HEAVY_METAL_INFO,
  THAI_SOIL_STANDARDS,
} from '@/lib/calculations/soil-quality'
import type {
  SoilQualityMode,
  HeavyMetal,
  ThaiLandUseType,
} from '@/lib/types/soil-quality'
import { METAL_OPTIONS, LAND_USE_OPTIONS } from './soil-quality-config'

const inputClass = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-300 mb-2'

// ============================================
// INPUT COMPONENTS
// ============================================

interface ContaminationInputsProps {
  contMetal: HeavyMetal
  setContMetal: (v: HeavyMetal) => void
  contConcentration: string
  setContConcentration: (v: string) => void
  contLandUse: ThaiLandUseType
  setContLandUse: (v: ThaiLandUseType) => void
}

export function ContaminationInputs(props: ContaminationInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Heavy Metal</label>
        <select
          value={props.contMetal}
          onChange={(e) => props.setContMetal(e.target.value as HeavyMetal)}
          className={inputClass}
        >
          {METAL_OPTIONS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Concentration (mg/kg)</label>
        <input
          type="number"
          value={props.contConcentration}
          onChange={(e) => props.setContConcentration(e.target.value)}
          placeholder="Enter concentration in mg/kg"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">
          Thai PCD limit for {HEAVY_METAL_INFO[props.contMetal].name}: {
            THAI_SOIL_STANDARDS.find(s => s.metal === props.contMetal)?.[props.contLandUse] ?? 'N/A'
          } mg/kg ({props.contLandUse})
        </p>
      </div>
      <div>
        <label className={labelClass}>Land Use Type</label>
        <select
          value={props.contLandUse}
          onChange={(e) => props.setContLandUse(e.target.value as ThaiLandUseType)}
          className={inputClass}
        >
          {LAND_USE_OPTIONS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

interface PhInputsProps {
  phValue: string
  setPhValue: (v: string) => void
}

export function PhInputs(props: PhInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Soil pH</label>
        <input
          type="number"
          step="0.1"
          value={props.phValue}
          onChange={(e) => props.setPhValue(e.target.value)}
          placeholder="Enter pH value (0-14)"
          className={`${inputClass} focus:ring-purple-500`}
        />
        <p className="mt-1 text-xs text-gray-400">Most crops grow best in pH 6.0-7.5</p>
      </div>
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
}

interface NpkInputsProps {
  npkNitrogen: string
  setNpkNitrogen: (v: string) => void
  npkPhosphorus: string
  setNpkPhosphorus: (v: string) => void
  npkPotassium: string
  setNpkPotassium: (v: string) => void
  npkOm: string
  setNpkOm: (v: string) => void
}

export function NpkInputs(props: NpkInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Nitrogen (Total N, %)</label>
        <input
          type="number"
          step="0.01"
          value={props.npkNitrogen}
          onChange={(e) => props.setNpkNitrogen(e.target.value)}
          placeholder="e.g., 0.15"
          className={`${inputClass} focus:ring-green-500`}
        />
      </div>
      <div>
        <label className={labelClass}>Phosphorus (Available P, mg/kg)</label>
        <input
          type="number"
          step="1"
          value={props.npkPhosphorus}
          onChange={(e) => props.setNpkPhosphorus(e.target.value)}
          placeholder="e.g., 25"
          className={`${inputClass} focus:ring-green-500`}
        />
      </div>
      <div>
        <label className={labelClass}>Potassium (Exchangeable K, mg/kg)</label>
        <input
          type="number"
          step="1"
          value={props.npkPotassium}
          onChange={(e) => props.setNpkPotassium(e.target.value)}
          placeholder="e.g., 150"
          className={`${inputClass} focus:ring-green-500`}
        />
      </div>
      <div>
        <label className={labelClass}>Organic Matter (%, optional)</label>
        <input
          type="number"
          step="0.1"
          value={props.npkOm}
          onChange={(e) => props.setNpkOm(e.target.value)}
          placeholder="e.g., 2.5"
          className={`${inputClass} focus:ring-green-500`}
        />
      </div>
    </div>
  )
}

interface CecInputsProps {
  cecValue: string
  setCecValue: (v: string) => void
  cecCalcium: string
  setCecCalcium: (v: string) => void
  cecMagnesium: string
  setCecMagnesium: (v: string) => void
  cecPotassium: string
  setCecPotassium: (v: string) => void
  cecSodium: string
  setCecSodium: (v: string) => void
}

export function CecInputs(props: CecInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>CEC (cmol/kg or meq/100g)</label>
        <input
          type="number"
          step="0.1"
          value={props.cecValue}
          onChange={(e) => props.setCecValue(e.target.value)}
          placeholder="Enter CEC value"
          className={`${inputClass} focus:ring-yellow-500`}
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
              value={props.cecCalcium}
              onChange={(e) => props.setCecCalcium(e.target.value)}
              placeholder="Ca"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mg2+ (cmol/kg)</label>
            <input
              type="number"
              step="0.1"
              value={props.cecMagnesium}
              onChange={(e) => props.setCecMagnesium(e.target.value)}
              placeholder="Mg"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">K+ (cmol/kg)</label>
            <input
              type="number"
              step="0.1"
              value={props.cecPotassium}
              onChange={(e) => props.setCecPotassium(e.target.value)}
              placeholder="K"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Na+ (cmol/kg)</label>
            <input
              type="number"
              step="0.1"
              value={props.cecSodium}
              onChange={(e) => props.setCecSodium(e.target.value)}
              placeholder="Na"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface OrganicMatterInputsProps {
  omMethod: 'direct' | 'carbon' | 'loi'
  setOmMethod: (v: 'direct' | 'carbon' | 'loi') => void
  omValue: string
  setOmValue: (v: string) => void
}

export function OrganicMatterInputs(props: OrganicMatterInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Measurement Method</label>
        <select
          value={props.omMethod}
          onChange={(e) => props.setOmMethod(e.target.value as 'direct' | 'carbon' | 'loi')}
          className={`${inputClass} focus:ring-lime-500`}
        >
          <option value="direct">Direct Organic Matter (%)</option>
          <option value="carbon">Organic Carbon (%) - Walkley-Black</option>
          <option value="loi">Loss on Ignition (%)</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>
          {props.omMethod === 'direct' ? 'Organic Matter (%)' :
           props.omMethod === 'carbon' ? 'Organic Carbon (%)' : 'Loss on Ignition (%)'}
        </label>
        <input
          type="number"
          step="0.1"
          value={props.omValue}
          onChange={(e) => props.setOmValue(e.target.value)}
          placeholder={props.omMethod === 'direct' ? 'e.g., 3.5' :
                       props.omMethod === 'carbon' ? 'e.g., 2.0' : 'e.g., 5.0'}
          className={`${inputClass} focus:ring-lime-500`}
        />
        <p className="mt-1 text-xs text-gray-400">
          {props.omMethod === 'carbon' && 'Will convert using Van Bemmelen factor (1.724)'}
          {props.omMethod === 'loi' && 'Will convert using standard factor (0.7)'}
        </p>
      </div>
    </div>
  )
}

interface TextureInputsProps {
  texSand: string
  setTexSand: (v: string) => void
  texSilt: string
  setTexSilt: (v: string) => void
  texClay: string
  setTexClay: (v: string) => void
}

export function TextureInputs(props: TextureInputsProps) {
  const total = (parseFloat(props.texSand) || 0) + (parseFloat(props.texSilt) || 0) + (parseFloat(props.texClay) || 0)
  const isValid = Math.abs(total - 100) < 0.1

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Enter particle size distribution (must sum to 100%):
      </p>
      <div>
        <label className={labelClass}>Sand (%) - 2.0 to 0.05 mm</label>
        <input
          type="number"
          step="1"
          value={props.texSand}
          onChange={(e) => props.setTexSand(e.target.value)}
          placeholder="e.g., 40"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Silt (%) - 0.05 to 0.002 mm</label>
        <input
          type="number"
          step="1"
          value={props.texSilt}
          onChange={(e) => props.setTexSilt(e.target.value)}
          placeholder="e.g., 40"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Clay (%) - less than 0.002 mm</label>
        <input
          type="number"
          step="1"
          value={props.texClay}
          onChange={(e) => props.setTexClay(e.target.value)}
          placeholder="e.g., 20"
          className={inputClass}
        />
      </div>
      {props.texSand && props.texSilt && props.texClay && (
        <div className="p-3 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-300">
            Total: {total}%
            {isValid
              ? <span className="text-green-400 ml-2">Valid</span>
              : <span className="text-red-400 ml-2">Must equal 100%</span>
            }
          </p>
        </div>
      )}
    </div>
  )
}

interface SalinityInputsProps {
  salEc: string
  setSalEc: (v: string) => void
  salSar: string
  setSalSar: (v: string) => void
  salEsp: string
  setSalEsp: (v: string) => void
}

export function SalinityInputs(props: SalinityInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Electrical Conductivity (EC, dS/m)</label>
        <input
          type="number"
          step="0.1"
          value={props.salEc}
          onChange={(e) => props.setSalEc(e.target.value)}
          placeholder="Enter EC value"
          className={`${inputClass} focus:ring-blue-500`}
        />
        <p className="mt-1 text-xs text-gray-400">
          Non-saline: &lt;2, Slightly: 2-4, Moderately: 4-8, Strongly: 8-16, Very strongly: &gt;16
        </p>
      </div>
      <div>
        <label className={labelClass}>SAR - Sodium Adsorption Ratio (optional)</label>
        <input
          type="number"
          step="0.1"
          value={props.salSar}
          onChange={(e) => props.setSalSar(e.target.value)}
          placeholder="Enter SAR value"
          className={`${inputClass} focus:ring-blue-500`}
        />
      </div>
      <div>
        <label className={labelClass}>ESP - Exchangeable Sodium Percentage (%, optional)</label>
        <input
          type="number"
          step="0.1"
          value={props.salEsp}
          onChange={(e) => props.setSalEsp(e.target.value)}
          placeholder="Enter ESP value"
          className={`${inputClass} focus:ring-blue-500`}
        />
        <p className="mt-1 text-xs text-gray-400">
          If SAR is provided, ESP will be calculated automatically
        </p>
      </div>
    </div>
  )
}

// ============================================
// UNIFIED INPUTS RENDERER
// ============================================

export interface SoilQualityInputsProps {
  mode: SoilQualityMode
  // Contamination
  contMetal: HeavyMetal
  setContMetal: (v: HeavyMetal) => void
  contConcentration: string
  setContConcentration: (v: string) => void
  contLandUse: ThaiLandUseType
  setContLandUse: (v: ThaiLandUseType) => void
  // pH
  phValue: string
  setPhValue: (v: string) => void
  // NPK
  npkNitrogen: string
  setNpkNitrogen: (v: string) => void
  npkPhosphorus: string
  setNpkPhosphorus: (v: string) => void
  npkPotassium: string
  setNpkPotassium: (v: string) => void
  npkOm: string
  setNpkOm: (v: string) => void
  // CEC
  cecValue: string
  setCecValue: (v: string) => void
  cecCalcium: string
  setCecCalcium: (v: string) => void
  cecMagnesium: string
  setCecMagnesium: (v: string) => void
  cecPotassium: string
  setCecPotassium: (v: string) => void
  cecSodium: string
  setCecSodium: (v: string) => void
  // Organic matter
  omMethod: 'direct' | 'carbon' | 'loi'
  setOmMethod: (v: 'direct' | 'carbon' | 'loi') => void
  omValue: string
  setOmValue: (v: string) => void
  // Texture
  texSand: string
  setTexSand: (v: string) => void
  texSilt: string
  setTexSilt: (v: string) => void
  texClay: string
  setTexClay: (v: string) => void
  // Salinity
  salEc: string
  setSalEc: (v: string) => void
  salSar: string
  setSalSar: (v: string) => void
  salEsp: string
  setSalEsp: (v: string) => void
}

export function SoilQualityInputs(props: SoilQualityInputsProps) {
  switch (props.mode) {
    case 'contamination':
      return <ContaminationInputs {...props} />
    case 'ph_classification':
      return <PhInputs {...props} />
    case 'npk_analysis':
      return <NpkInputs {...props} />
    case 'cec':
      return <CecInputs {...props} />
    case 'organic_matter':
      return <OrganicMatterInputs {...props} />
    case 'texture':
      return <TextureInputs {...props} />
    case 'salinity':
      return <SalinityInputs {...props} />
    default:
      return null
  }
}
