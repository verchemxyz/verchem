'use client'

import { THAI_EFFLUENT_STANDARDS } from '@/lib/calculations/environmental'
import type { ThaiEffluentType, WaterQualityMode } from '@/lib/types/environmental'

// ============================================
// INPUT PROPS INTERFACES
// ============================================

export interface BOD5InputProps {
  initialDO: string
  setInitialDO: (v: string) => void
  finalDO: string
  setFinalDO: (v: string) => void
  sampleVolume: string
  setSampleVolume: (v: string) => void
  bottleVolume: string
  setBottleVolume: (v: string) => void
  seedCorrection: string
  setSeedCorrection: (v: string) => void
}

export interface BODuInputProps {
  bod5Value: string
  setBod5Value: (v: string) => void
  kRate: string
  setKRate: (v: string) => void
}

export interface CODInputProps {
  fasBlank: string
  setFasBlank: (v: string) => void
  fasSample: string
  setFasSample: (v: string) => void
  fasNormality: string
  setFasNormality: (v: string) => void
  codSampleVolume: string
  setCodSampleVolume: (v: string) => void
}

export interface BODCODRatioInputProps {
  bodValue: string
  setBodValue: (v: string) => void
  codValue: string
  setCodValue: (v: string) => void
}

export interface LoadingRateInputProps {
  bodConc: string
  setBodConc: (v: string) => void
  flowRate: string
  setFlowRate: (v: string) => void
}

export interface RemovalEfficiencyInputProps {
  influentConc: string
  setInfluentConc: (v: string) => void
  effluentConc: string
  setEffluentConc: (v: string) => void
}

export interface KRateInputProps {
  kRateData: string
  setKRateData: (v: string) => void
}

export interface TempCorrectionInputProps {
  k20: string
  setK20: (v: string) => void
  targetTemp: string
  setTargetTemp: (v: string) => void
  theta: string
  setTheta: (v: string) => void
}

export interface ComplianceInputProps {
  standardType: ThaiEffluentType
  setStandardType: (v: ThaiEffluentType) => void
  sampleBod: string
  setSampleBod: (v: string) => void
  sampleCod: string
  setSampleCod: (v: string) => void
  samplePh: string
  setSamplePh: (v: string) => void
  sampleSs: string
  setSampleSs: (v: string) => void
  sampleTds: string
  setSampleTds: (v: string) => void
  sampleTemp: string
  setSampleTemp: (v: string) => void
}

// ============================================
// INPUT COMPONENTS
// ============================================

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none'

export function BOD5Inputs(props: BOD5InputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Initial DO (D1) mg/L
          </label>
          <input
            type="number"
            step="0.1"
            value={props.initialDO}
            onChange={(e) => props.setInitialDO(e.target.value)}
            placeholder="e.g., 8.0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Final DO (D2) mg/L
          </label>
          <input
            type="number"
            step="0.1"
            value={props.finalDO}
            onChange={(e) => props.setFinalDO(e.target.value)}
            placeholder="e.g., 3.0"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sample Volume (mL)
          </label>
          <input
            type="number"
            step="1"
            value={props.sampleVolume}
            onChange={(e) => props.setSampleVolume(e.target.value)}
            placeholder="e.g., 30"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            BOD Bottle Volume (mL)
          </label>
          <input
            type="number"
            step="1"
            value={props.bottleVolume}
            onChange={(e) => props.setBottleVolume(e.target.value)}
            placeholder="e.g., 300"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Seed Correction (mg/L) - Optional
        </label>
        <input
          type="number"
          step="0.1"
          value={props.seedCorrection}
          onChange={(e) => props.setSeedCorrection(e.target.value)}
          placeholder="Leave empty if not using seed"
          className={inputClass}
        />
      </div>
    </div>
  )
}

export function BODuInputs(props: BODuInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          BOD5 (mg/L)
        </label>
        <input
          type="number"
          step="0.1"
          value={props.bod5Value}
          onChange={(e) => props.setBod5Value(e.target.value)}
          placeholder="e.g., 200"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          k-rate (/day at 20C)
        </label>
        <input
          type="number"
          step="0.01"
          value={props.kRate}
          onChange={(e) => props.setKRate(e.target.value)}
          placeholder="e.g., 0.23"
          className={inputClass}
        />
        <p className="text-xs text-slate-500 mt-1">
          Typical range: 0.1-0.3 /day for domestic wastewater
        </p>
      </div>
    </div>
  )
}

export function CODInputs(props: CODInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            FAS Titrant for Blank (A) mL
          </label>
          <input
            type="number"
            step="0.01"
            value={props.fasBlank}
            onChange={(e) => props.setFasBlank(e.target.value)}
            placeholder="e.g., 25.0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            FAS Titrant for Sample (B) mL
          </label>
          <input
            type="number"
            step="0.01"
            value={props.fasSample}
            onChange={(e) => props.setFasSample(e.target.value)}
            placeholder="e.g., 10.0"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            FAS Normality (N)
          </label>
          <input
            type="number"
            step="0.001"
            value={props.fasNormality}
            onChange={(e) => props.setFasNormality(e.target.value)}
            placeholder="e.g., 0.25"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Sample Volume (V) mL
          </label>
          <input
            type="number"
            step="0.1"
            value={props.codSampleVolume}
            onChange={(e) => props.setCodSampleVolume(e.target.value)}
            placeholder="e.g., 20"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

export function BODCODRatioInputs(props: BODCODRatioInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            BOD (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.bodValue}
            onChange={(e) => props.setBodValue(e.target.value)}
            placeholder="e.g., 300"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            COD (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.codValue}
            onChange={(e) => props.setCodValue(e.target.value)}
            placeholder="e.g., 500"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

export function LoadingRateInputs(props: LoadingRateInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            BOD Concentration (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.bodConc}
            onChange={(e) => props.setBodConc(e.target.value)}
            placeholder="e.g., 200"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Flow Rate (m3/day)
          </label>
          <input
            type="number"
            step="1"
            value={props.flowRate}
            onChange={(e) => props.setFlowRate(e.target.value)}
            placeholder="e.g., 1000"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

export function RemovalEfficiencyInputs(props: RemovalEfficiencyInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Influent Concentration (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.influentConc}
            onChange={(e) => props.setInfluentConc(e.target.value)}
            placeholder="e.g., 200"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Effluent Concentration (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.effluentConc}
            onChange={(e) => props.setEffluentConc(e.target.value)}
            placeholder="e.g., 20"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

export function KRateInputs(props: KRateInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          BOD Time Series Data (day,BOD format)
        </label>
        <textarea
          value={props.kRateData}
          onChange={(e) => props.setKRateData(e.target.value)}
          placeholder="1,65&#10;2,109&#10;3,138&#10;4,158&#10;5,172"
          rows={6}
          className={`${inputClass} font-mono`}
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter each data point on a new line: day,BOD (e.g., 1,65)
        </p>
      </div>
    </div>
  )
}

export function TempCorrectionInputs(props: TempCorrectionInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            k at 20C (/day)
          </label>
          <input
            type="number"
            step="0.01"
            value={props.k20}
            onChange={(e) => props.setK20(e.target.value)}
            placeholder="e.g., 0.23"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target Temperature (C)
          </label>
          <input
            type="number"
            step="0.1"
            value={props.targetTemp}
            onChange={(e) => props.setTargetTemp(e.target.value)}
            placeholder="e.g., 25"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Theta (temperature coefficient)
        </label>
        <input
          type="number"
          step="0.001"
          value={props.theta}
          onChange={(e) => props.setTheta(e.target.value)}
          placeholder="Default: 1.047"
          className={inputClass}
        />
        <p className="text-xs text-slate-500 mt-1">
          Typical values: 1.024-1.083, default 1.047 for BOD
        </p>
      </div>
    </div>
  )
}

export function ComplianceInputs(props: ComplianceInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Thai Effluent Standard Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['type_a', 'type_b', 'type_c'] as ThaiEffluentType[]).map((type) => {
            const standard = THAI_EFFLUENT_STANDARDS[type]
            return (
              <button
                key={type}
                onClick={() => props.setStandardType(type)}
                className={`rounded-xl px-4 py-3 text-left transition-all ${
                  props.standardType === type
                    ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">{standard.nameThai}</div>
                <div className="text-xs opacity-75">{standard.name}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl bg-white/5 p-4 border border-white/10">
        <h4 className="text-sm font-medium text-slate-300 mb-2">
          Standard Limits ({THAI_EFFLUENT_STANDARDS[props.standardType].nameThai})
        </h4>
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
          <div>BOD: {THAI_EFFLUENT_STANDARDS[props.standardType].limits.bod} mg/L</div>
          <div>COD: {THAI_EFFLUENT_STANDARDS[props.standardType].limits.cod} mg/L</div>
          <div>SS: {THAI_EFFLUENT_STANDARDS[props.standardType].limits.ss} mg/L</div>
          <div>TDS: {THAI_EFFLUENT_STANDARDS[props.standardType].limits.tds} mg/L</div>
          <div>
            pH: {THAI_EFFLUENT_STANDARDS[props.standardType].limits.ph_min}-
            {THAI_EFFLUENT_STANDARDS[props.standardType].limits.ph_max}
          </div>
          <div>Temp: {THAI_EFFLUENT_STANDARDS[props.standardType].limits.temperature}C</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            BOD (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.sampleBod}
            onChange={(e) => props.setSampleBod(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            COD (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.sampleCod}
            onChange={(e) => props.setSampleCod(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            pH
          </label>
          <input
            type="number"
            step="0.1"
            value={props.samplePh}
            onChange={(e) => props.setSamplePh(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            SS (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.sampleSs}
            onChange={(e) => props.setSampleSs(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            TDS (mg/L)
          </label>
          <input
            type="number"
            step="1"
            value={props.sampleTds}
            onChange={(e) => props.setSampleTds(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Temperature (C)
          </label>
          <input
            type="number"
            step="0.1"
            value={props.sampleTemp}
            onChange={(e) => props.setSampleTemp(e.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================
// UNIFIED INPUTS RENDERER
// ============================================

export interface WaterQualityInputsProps {
  mode: WaterQualityMode
  // BOD5
  initialDO: string
  setInitialDO: (v: string) => void
  finalDO: string
  setFinalDO: (v: string) => void
  sampleVolume: string
  setSampleVolume: (v: string) => void
  bottleVolume: string
  setBottleVolume: (v: string) => void
  seedCorrection: string
  setSeedCorrection: (v: string) => void
  // BODu
  bod5Value: string
  setBod5Value: (v: string) => void
  kRate: string
  setKRate: (v: string) => void
  // COD
  fasBlank: string
  setFasBlank: (v: string) => void
  fasSample: string
  setFasSample: (v: string) => void
  fasNormality: string
  setFasNormality: (v: string) => void
  codSampleVolume: string
  setCodSampleVolume: (v: string) => void
  // BOD/COD ratio
  bodValue: string
  setBodValue: (v: string) => void
  codValue: string
  setCodValue: (v: string) => void
  // Loading rate
  bodConc: string
  setBodConc: (v: string) => void
  flowRate: string
  setFlowRate: (v: string) => void
  // Removal efficiency
  influentConc: string
  setInfluentConc: (v: string) => void
  effluentConc: string
  setEffluentConc: (v: string) => void
  // K-rate
  kRateData: string
  setKRateData: (v: string) => void
  // Temp correction
  k20: string
  setK20: (v: string) => void
  targetTemp: string
  setTargetTemp: (v: string) => void
  theta: string
  setTheta: (v: string) => void
  // Compliance
  standardType: ThaiEffluentType
  setStandardType: (v: ThaiEffluentType) => void
  sampleBod: string
  setSampleBod: (v: string) => void
  sampleCod: string
  setSampleCod: (v: string) => void
  samplePh: string
  setSamplePh: (v: string) => void
  sampleSs: string
  setSampleSs: (v: string) => void
  sampleTds: string
  setSampleTds: (v: string) => void
  sampleTemp: string
  setSampleTemp: (v: string) => void
}

export function WaterQualityInputs(props: WaterQualityInputsProps) {
  switch (props.mode) {
    case 'bod5':
      return <BOD5Inputs {...props} />
    case 'bodu':
      return <BODuInputs {...props} />
    case 'cod':
      return <CODInputs {...props} />
    case 'bod_cod_ratio':
      return <BODCODRatioInputs {...props} />
    case 'loading_rate':
      return <LoadingRateInputs {...props} />
    case 'removal_efficiency':
      return <RemovalEfficiencyInputs {...props} />
    case 'k_rate':
      return <KRateInputs {...props} />
    case 'temperature_correction':
      return <TempCorrectionInputs {...props} />
    case 'compliance_check':
      return <ComplianceInputs {...props} />
    default:
      return null
  }
}
