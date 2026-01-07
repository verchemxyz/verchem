'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Beaker,
  Calculator,
  CheckCircle,
  Droplets,
  Factory,
  FlaskConical,
  Gauge,
  Leaf,
  RefreshCw,
  Thermometer,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  calculateBOD5,
  calculateBODu,
  calculateCOD,
  calculateBODCODRatio,
  calculateBODLoadingRate,
  calculateRemovalEfficiency,
  calculateKRate,
  temperatureCorrection,
  checkThaiStandards,
  THAI_EFFLUENT_STANDARDS,
} from '@/lib/calculations/environmental'
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
  ThaiEffluentType,
  BODDataPoint,
} from '@/lib/types/environmental'

type CalculationResult =
  | BOD5Result
  | BODuResult
  | CODResult
  | BODCODRatioResult
  | BODLoadingResult
  | RemovalEfficiencyResult
  | KRateResult
  | TemperatureCorrectionResult
  | ComplianceResult

interface ModeConfig {
  id: WaterQualityMode
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const MODES: ModeConfig[] = [
  {
    id: 'bod5',
    name: 'BOD5 Calculator',
    description: 'Calculate BOD5 from dissolved oxygen readings',
    icon: <Droplets className="h-5 w-5" />,
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'bodu',
    name: 'Ultimate BOD',
    description: 'Calculate ultimate BOD from BOD5 and k-rate',
    icon: <Gauge className="h-5 w-5" />,
    color: 'from-cyan-600 to-teal-600',
  },
  {
    id: 'cod',
    name: 'COD Calculator',
    description: 'Calculate COD using dichromate method',
    icon: <FlaskConical className="h-5 w-5" />,
    color: 'from-orange-600 to-red-600',
  },
  {
    id: 'bod_cod_ratio',
    name: 'BOD/COD Ratio',
    description: 'Determine biodegradability index',
    icon: <Calculator className="h-5 w-5" />,
    color: 'from-green-600 to-emerald-600',
  },
  {
    id: 'loading_rate',
    name: 'BOD Loading',
    description: 'Calculate BOD loading rate (kg/day)',
    icon: <Factory className="h-5 w-5" />,
    color: 'from-purple-600 to-violet-600',
  },
  {
    id: 'removal_efficiency',
    name: 'Removal Efficiency',
    description: 'Calculate treatment removal percentage',
    icon: <RefreshCw className="h-5 w-5" />,
    color: 'from-emerald-600 to-green-600',
  },
  {
    id: 'k_rate',
    name: 'K-Rate (Thomas)',
    description: 'Determine k from BOD time series',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-yellow-600 to-amber-600',
  },
  {
    id: 'temperature_correction',
    name: 'Temp Correction',
    description: "van't Hoff temperature correction",
    icon: <Thermometer className="h-5 w-5" />,
    color: 'from-red-600 to-orange-600',
  },
  {
    id: 'compliance_check',
    name: 'Thai Standards',
    description: 'Check compliance with Thai effluent standards',
    icon: <Leaf className="h-5 w-5" />,
    color: 'from-teal-600 to-green-600',
  },
]

export default function WaterQualityPage() {
  const [mode, setMode] = useState<WaterQualityMode>('bod5')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  // BOD5 inputs
  const [initialDO, setInitialDO] = useState('')
  const [finalDO, setFinalDO] = useState('')
  const [sampleVolume, setSampleVolume] = useState('')
  const [bottleVolume, setBottleVolume] = useState('300')
  const [seedCorrection, setSeedCorrection] = useState('')

  // BODu inputs
  const [bod5Value, setBod5Value] = useState('')
  const [kRate, setKRate] = useState('0.23')

  // COD inputs
  const [fasBlank, setFasBlank] = useState('')
  const [fasSample, setFasSample] = useState('')
  const [fasNormality, setFasNormality] = useState('')
  const [codSampleVolume, setCodSampleVolume] = useState('')

  // BOD/COD ratio
  const [bodValue, setBodValue] = useState('')
  const [codValue, setCodValue] = useState('')

  // Loading rate
  const [bodConc, setBodConc] = useState('')
  const [flowRate, setFlowRate] = useState('')

  // Removal efficiency
  const [influentConc, setInfluentConc] = useState('')
  const [effluentConc, setEffluentConc] = useState('')

  // K-rate (Thomas method)
  const [kRateData, setKRateData] = useState('1,65\n2,109\n3,138\n4,158\n5,172')

  // Temperature correction
  const [k20, setK20] = useState('')
  const [targetTemp, setTargetTemp] = useState('')
  const [theta, setTheta] = useState('1.047')

  // Thai standards compliance
  const [standardType, setStandardType] = useState<ThaiEffluentType>('type_a')
  const [sampleBod, setSampleBod] = useState('')
  const [sampleCod, setSampleCod] = useState('')
  const [samplePh, setSamplePh] = useState('')
  const [sampleSs, setSampleSs] = useState('')
  const [sampleTds, setSampleTds] = useState('')
  const [sampleTemp, setSampleTemp] = useState('')

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    setError('')

    setTimeout(() => {
      try {
        let calcResult: CalculationResult

        switch (mode) {
          case 'bod5': {
            const d1 = parseFloat(initialDO)
            const d2 = parseFloat(finalDO)
            const sv = parseFloat(sampleVolume)
            const bv = parseFloat(bottleVolume)
            const sc = seedCorrection ? parseFloat(seedCorrection) : undefined

            if (isNaN(d1) || isNaN(d2) || isNaN(sv) || isNaN(bv)) {
              throw new Error('Please enter valid numbers for all required fields')
            }

            calcResult = calculateBOD5({
              initialDO: d1,
              finalDO: d2,
              sampleVolume: sv,
              bottleVolume: bv,
              seedCorrection: sc,
            })
            break
          }

          case 'bodu': {
            const bod5 = parseFloat(bod5Value)
            const k = parseFloat(kRate)

            if (isNaN(bod5) || isNaN(k)) {
              throw new Error('Please enter valid BOD5 and k-rate values')
            }

            calcResult = calculateBODu({ bod5, kRate: k })
            break
          }

          case 'cod': {
            const blank = parseFloat(fasBlank)
            const sample = parseFloat(fasSample)
            const normality = parseFloat(fasNormality)
            const volume = parseFloat(codSampleVolume)

            if (isNaN(blank) || isNaN(sample) || isNaN(normality) || isNaN(volume)) {
              throw new Error('Please enter valid numbers for all COD inputs')
            }

            calcResult = calculateCOD({
              fasTitrantBlank: blank,
              fasTitrantSample: sample,
              fasNormality: normality,
              sampleVolume: volume,
            })
            break
          }

          case 'bod_cod_ratio': {
            const bod = parseFloat(bodValue)
            const cod = parseFloat(codValue)

            if (isNaN(bod) || isNaN(cod)) {
              throw new Error('Please enter valid BOD and COD values')
            }

            calcResult = calculateBODCODRatio(bod, cod)
            break
          }

          case 'loading_rate': {
            const bod = parseFloat(bodConc)
            const flow = parseFloat(flowRate)

            if (isNaN(bod) || isNaN(flow)) {
              throw new Error('Please enter valid BOD concentration and flow rate')
            }

            calcResult = calculateBODLoadingRate({ bod, flowRate: flow })
            break
          }

          case 'removal_efficiency': {
            const influent = parseFloat(influentConc)
            const effluent = parseFloat(effluentConc)

            if (isNaN(influent) || isNaN(effluent)) {
              throw new Error('Please enter valid influent and effluent concentrations')
            }

            calcResult = calculateRemovalEfficiency({
              influentConc: influent,
              effluentConc: effluent,
            })
            break
          }

          case 'k_rate': {
            const lines = kRateData.trim().split('\n')
            const data: BODDataPoint[] = lines.map((line) => {
              const [day, bod] = line.split(',').map((s) => parseFloat(s.trim()))
              return { day, bod }
            })

            if (data.length < 3 || data.some((d) => isNaN(d.day) || isNaN(d.bod))) {
              throw new Error('Please enter at least 3 valid data points (day,BOD format)')
            }

            calcResult = calculateKRate(data)
            break
          }

          case 'temperature_correction': {
            const k = parseFloat(k20)
            const temp = parseFloat(targetTemp)
            const th = parseFloat(theta)

            if (isNaN(k) || isNaN(temp)) {
              throw new Error('Please enter valid k20 and target temperature')
            }

            calcResult = temperatureCorrection({
              k20: k,
              targetTemperature: temp,
              theta: isNaN(th) ? undefined : th,
            })
            break
          }

          case 'compliance_check': {
            const sample = {
              bod: sampleBod ? parseFloat(sampleBod) : undefined,
              cod: sampleCod ? parseFloat(sampleCod) : undefined,
              ph: samplePh ? parseFloat(samplePh) : undefined,
              ss: sampleSs ? parseFloat(sampleSs) : undefined,
              tds: sampleTds ? parseFloat(sampleTds) : undefined,
              temperature: sampleTemp ? parseFloat(sampleTemp) : undefined,
            }

            // Check if at least one parameter is provided
            if (
              Object.values(sample).every((v) => v === undefined || isNaN(v as number))
            ) {
              throw new Error('Please enter at least one water quality parameter')
            }

            calcResult = checkThaiStandards(sample, standardType)
            break
          }

          default:
            throw new Error('Invalid calculation mode')
        }

        setResult(calcResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation error')
        setResult(null)
      }
      setIsCalculating(false)
    }, 300)
  }, [
    mode,
    initialDO,
    finalDO,
    sampleVolume,
    bottleVolume,
    seedCorrection,
    bod5Value,
    kRate,
    fasBlank,
    fasSample,
    fasNormality,
    codSampleVolume,
    bodValue,
    codValue,
    bodConc,
    flowRate,
    influentConc,
    effluentConc,
    kRateData,
    k20,
    targetTemp,
    theta,
    standardType,
    sampleBod,
    sampleCod,
    samplePh,
    sampleSs,
    sampleTds,
    sampleTemp,
  ])

  const currentMode = MODES.find((m) => m.id === mode)!

  const renderInputs = () => {
    switch (mode) {
      case 'bod5':
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
                  value={initialDO}
                  onChange={(e) => setInitialDO(e.target.value)}
                  placeholder="e.g., 8.0"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Final DO (D2) mg/L
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={finalDO}
                  onChange={(e) => setFinalDO(e.target.value)}
                  placeholder="e.g., 3.0"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
                  value={sampleVolume}
                  onChange={(e) => setSampleVolume(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  BOD Bottle Volume (mL)
                </label>
                <input
                  type="number"
                  step="1"
                  value={bottleVolume}
                  onChange={(e) => setBottleVolume(e.target.value)}
                  placeholder="e.g., 300"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
                value={seedCorrection}
                onChange={(e) => setSeedCorrection(e.target.value)}
                placeholder="Leave empty if not using seed"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )

      case 'bodu':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                BOD5 (mg/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={bod5Value}
                onChange={(e) => setBod5Value(e.target.value)}
                placeholder="e.g., 200"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                k-rate (/day at 20C)
              </label>
              <input
                type="number"
                step="0.01"
                value={kRate}
                onChange={(e) => setKRate(e.target.value)}
                placeholder="e.g., 0.23"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Typical range: 0.1-0.3 /day for domestic wastewater
              </p>
            </div>
          </div>
        )

      case 'cod':
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
                  value={fasBlank}
                  onChange={(e) => setFasBlank(e.target.value)}
                  placeholder="e.g., 25.0"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  FAS Titrant for Sample (B) mL
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fasSample}
                  onChange={(e) => setFasSample(e.target.value)}
                  placeholder="e.g., 10.0"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
                  value={fasNormality}
                  onChange={(e) => setFasNormality(e.target.value)}
                  placeholder="e.g., 0.25"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sample Volume (V) mL
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={codSampleVolume}
                  onChange={(e) => setCodSampleVolume(e.target.value)}
                  placeholder="e.g., 20"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      case 'bod_cod_ratio':
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
                  value={bodValue}
                  onChange={(e) => setBodValue(e.target.value)}
                  placeholder="e.g., 300"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  COD (mg/L)
                </label>
                <input
                  type="number"
                  step="1"
                  value={codValue}
                  onChange={(e) => setCodValue(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      case 'loading_rate':
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
                  value={bodConc}
                  onChange={(e) => setBodConc(e.target.value)}
                  placeholder="e.g., 200"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Flow Rate (m3/day)
                </label>
                <input
                  type="number"
                  step="1"
                  value={flowRate}
                  onChange={(e) => setFlowRate(e.target.value)}
                  placeholder="e.g., 1000"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      case 'removal_efficiency':
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
                  value={influentConc}
                  onChange={(e) => setInfluentConc(e.target.value)}
                  placeholder="e.g., 200"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Effluent Concentration (mg/L)
                </label>
                <input
                  type="number"
                  step="1"
                  value={effluentConc}
                  onChange={(e) => setEffluentConc(e.target.value)}
                  placeholder="e.g., 20"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      case 'k_rate':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                BOD Time Series Data (day,BOD format)
              </label>
              <textarea
                value={kRateData}
                onChange={(e) => setKRateData(e.target.value)}
                placeholder="1,65&#10;2,109&#10;3,138&#10;4,158&#10;5,172"
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter each data point on a new line: day,BOD (e.g., 1,65)
              </p>
            </div>
          </div>
        )

      case 'temperature_correction':
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
                  value={k20}
                  onChange={(e) => setK20(e.target.value)}
                  placeholder="e.g., 0.23"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Temperature (C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(e.target.value)}
                  placeholder="e.g., 25"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
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
                value={theta}
                onChange={(e) => setTheta(e.target.value)}
                placeholder="Default: 1.047"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Typical values: 1.024-1.083, default 1.047 for BOD
              </p>
            </div>
          </div>
        )

      case 'compliance_check':
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
                      onClick={() => setStandardType(type)}
                      className={`rounded-xl px-4 py-3 text-left transition-all ${
                        standardType === type
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
                Standard Limits ({THAI_EFFLUENT_STANDARDS[standardType].nameThai})
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                <div>BOD: {THAI_EFFLUENT_STANDARDS[standardType].limits.bod} mg/L</div>
                <div>COD: {THAI_EFFLUENT_STANDARDS[standardType].limits.cod} mg/L</div>
                <div>SS: {THAI_EFFLUENT_STANDARDS[standardType].limits.ss} mg/L</div>
                <div>TDS: {THAI_EFFLUENT_STANDARDS[standardType].limits.tds} mg/L</div>
                <div>
                  pH: {THAI_EFFLUENT_STANDARDS[standardType].limits.ph_min}-
                  {THAI_EFFLUENT_STANDARDS[standardType].limits.ph_max}
                </div>
                <div>Temp: {THAI_EFFLUENT_STANDARDS[standardType].limits.temperature}C</div>
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
                  value={sampleBod}
                  onChange={(e) => setSampleBod(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  COD (mg/L)
                </label>
                <input
                  type="number"
                  step="1"
                  value={sampleCod}
                  onChange={(e) => setSampleCod(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  pH
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={samplePh}
                  onChange={(e) => setSamplePh(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SS (mg/L)
                </label>
                <input
                  type="number"
                  step="1"
                  value={sampleSs}
                  onChange={(e) => setSampleSs(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  TDS (mg/L)
                </label>
                <input
                  type="number"
                  step="1"
                  value={sampleTds}
                  onChange={(e) => setSampleTds(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Temperature (C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sampleTemp}
                  onChange={(e) => setSampleTemp(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderResult = () => {
    if (!result) return null

    // Type guards
    const isBOD5Result = (r: CalculationResult): r is BOD5Result => 'bod5' in r && 'oxygenDepletion' in r
    const isBODuResult = (r: CalculationResult): r is BODuResult => 'bodu' in r && 'f_factor' in r
    const isCODResult = (r: CalculationResult): r is CODResult => 'cod' in r && 'oxygenEquivalent' in r
    const isBODCODRatioResult = (r: CalculationResult): r is BODCODRatioResult => 'ratio' in r && 'classification' in r
    const isBODLoadingResult = (r: CalculationResult): r is BODLoadingResult => 'loading' in r
    const isRemovalEfficiencyResult = (r: CalculationResult): r is RemovalEfficiencyResult => 'efficiency' in r && 'removalRate' in r
    const isKRateResult = (r: CalculationResult): r is KRateResult => 'k' in r && 'r2' in r
    const isTempCorrectionResult = (r: CalculationResult): r is TemperatureCorrectionResult => 'kT' in r && 'theta' in r
    const isComplianceResult = (r: CalculationResult): r is ComplianceResult => 'isCompliant' in r && 'exceedances' in r

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Result */}
        {isBOD5Result(result) && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
            <p className="text-sm text-blue-300 mb-1">BOD5</p>
            <p className="text-5xl font-bold text-blue-400">{result.bod5.toFixed(1)}</p>
            <p className="text-lg text-slate-300 mt-1">mg/L</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-slate-400">
                <span className="block text-slate-500">Dilution Factor</span>
                {result.dilutionFactor.toFixed(2)}
              </div>
              <div className="text-slate-400">
                <span className="block text-slate-500">DO Depletion</span>
                {result.oxygenDepletion.toFixed(2)} mg/L
              </div>
            </div>
          </div>
        )}

        {isBODuResult(result) && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-center">
            <p className="text-sm text-cyan-300 mb-1">Ultimate BOD (BODu)</p>
            <p className="text-5xl font-bold text-cyan-400">{result.bodu.toFixed(1)}</p>
            <p className="text-lg text-slate-300 mt-1">mg/L</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-slate-400">
                <span className="block text-slate-500">k-rate</span>
                {result.kRate.toFixed(3)} /day
              </div>
              <div className="text-slate-400">
                <span className="block text-slate-500">f-factor (BOD5/BODu)</span>
                {result.f_factor.toFixed(3)}
              </div>
            </div>
          </div>
        )}

        {isCODResult(result) && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-6 text-center">
            <p className="text-sm text-orange-300 mb-1">COD</p>
            <p className="text-5xl font-bold text-orange-400">{result.cod.toFixed(1)}</p>
            <p className="text-lg text-slate-300 mt-1">mg/L</p>
            <div className="mt-4 text-sm text-slate-400">
              <span className="block text-slate-500">Oxygen Equivalent</span>
              {result.oxygenEquivalent.toFixed(2)} mg O2
            </div>
          </div>
        )}

        {isBODCODRatioResult(result) && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
              <p className="text-sm text-green-300 mb-1">BOD/COD Ratio</p>
              <p className="text-5xl font-bold text-green-400">{result.ratio.toFixed(2)}</p>
            </div>
            <div
              className={`rounded-2xl p-6 text-center ${
                result.classification === 'easily_biodegradable'
                  ? 'border border-green-500/30 bg-green-500/10'
                  : result.classification === 'moderately_biodegradable'
                  ? 'border border-yellow-500/30 bg-yellow-500/10'
                  : 'border border-red-500/30 bg-red-500/10'
              }`}
            >
              <p className="text-lg font-semibold text-white">
                {result.classification === 'easily_biodegradable' && 'Easily Biodegradable'}
                {result.classification === 'moderately_biodegradable' && 'Moderately Biodegradable'}
                {result.classification === 'difficult_to_biodegrade' && 'Difficult to Biodegrade'}
              </p>
              <p className="text-sm text-slate-400 mt-2">{result.treatmentRecommendation}</p>
            </div>
          </div>
        )}

        {isBODLoadingResult(result) && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 text-center">
            <p className="text-sm text-purple-300 mb-1">BOD Loading Rate</p>
            <p className="text-5xl font-bold text-purple-400">{result.loading.toFixed(1)}</p>
            <p className="text-lg text-slate-300 mt-1">kg BOD/day</p>
          </div>
        )}

        {isRemovalEfficiencyResult(result) && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-sm text-emerald-300 mb-1">Removal Efficiency</p>
            <p className="text-5xl font-bold text-emerald-400">{result.efficiency.toFixed(1)}%</p>
            <div className="mt-4 text-sm text-slate-400">
              <span className="block text-slate-500">Removal Rate</span>
              {result.removalRate.toFixed(1)} mg/L removed
            </div>
          </div>
        )}

        {isKRateResult(result) && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
                <p className="text-sm text-yellow-300 mb-1">k-rate (20C)</p>
                <p className="text-4xl font-bold text-yellow-400">{result.k.toFixed(3)}</p>
                <p className="text-sm text-slate-300 mt-1">/day</p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                <p className="text-sm text-amber-300 mb-1">Ultimate BOD</p>
                <p className="text-4xl font-bold text-amber-400">{result.bodu.toFixed(1)}</p>
                <p className="text-sm text-slate-300 mt-1">mg/L</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm text-slate-400">
                Method: {result.method.toUpperCase()} | R = {result.r2.toFixed(4)}
              </p>
            </div>
          </div>
        )}

        {isTempCorrectionResult(result) && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-sm text-red-300 mb-1">k at Target Temperature</p>
            <p className="text-5xl font-bold text-red-400">{result.kT.toFixed(4)}</p>
            <p className="text-lg text-slate-300 mt-1">/day</p>
            <div className="mt-4 text-sm text-slate-400">
              <span className="block text-slate-500">Theta</span>
              {result.theta.toFixed(3)}
            </div>
          </div>
        )}

        {isComplianceResult(result) && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl p-8 text-center ${
                result.isCompliant
                  ? 'border border-green-500/30 bg-green-500/10'
                  : 'border border-red-500/30 bg-red-500/10'
              }`}
            >
              {result.isCompliant ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-green-400">PASS</p>
                  <p className="text-lg text-slate-300 mt-2">Compliant with {result.standard.nameThai}</p>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-red-400">FAIL</p>
                  <p className="text-lg text-slate-300 mt-2">
                    Non-compliant with {result.standard.nameThai}
                  </p>
                </>
              )}
            </div>

            {result.exceedances.length > 0 && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                <h4 className="text-lg font-semibold text-red-400 mb-4">Exceedances</h4>
                <div className="space-y-2">
                  {result.exceedances.map((exc, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm bg-red-500/10 rounded-lg px-4 py-2"
                    >
                      <span className="text-slate-300">{exc.parameter.toUpperCase()}</span>
                      <span className="text-red-300">
                        {exc.value} / {exc.limit} mg/L (+{exc.exceedancePercent.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.passedParameters.length > 0 && (
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                <h4 className="text-lg font-semibold text-green-400 mb-4">Passed Parameters</h4>
                <div className="flex flex-wrap gap-2">
                  {result.passedParameters.map((param, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300"
                    >
                      <CheckCircle className="h-3 w-3" />
                      {param.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Steps (for calculations that have them) */}
        {'steps' in result && result.steps && result.steps.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Calculation Steps</h4>
            <div className="space-y-2 font-mono text-sm text-slate-300">
              {result.steps.map((step, i) => (
                <p key={i} className="leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm text-teal-300 mb-6">
              <Droplets className="h-4 w-4" />
              Environmental Engineering Tools
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Water Quality
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
                Calculator
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              BOD, COD, and wastewater treatment calculations with Thai effluent standards compliance checking.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                9 Calculation Modes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Thai Standards (PCD)
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Step-by-Step Solutions
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                APHA Methods
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900/90 to-teal-900/20 p-8 shadow-2xl shadow-teal-500/10 backdrop-blur-sm">
            <div className="space-y-6">
              {/* Mode Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Calculation Mode
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMode(m.id)
                        setResult(null)
                        setError('')
                      }}
                      className={`rounded-xl px-3 py-3 font-medium transition-all text-sm ${
                        mode === m.id
                          ? `bg-gradient-to-r ${m.color} text-white`
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {m.icon}
                        <span className="text-xs">{m.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Description */}
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <p className="text-sm text-slate-400">{currentMode.description}</p>
              </div>

              {/* Dynamic Inputs */}
              {renderInputs()}

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className={`w-full rounded-xl bg-gradient-to-r ${currentMode.color} px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50`}
              >
                {isCalculating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Calculating...
                  </div>
                ) : (
                  'Calculate'
                )}
              </button>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                  {error}
                </div>
              )}

              {/* Results */}
              {renderResult()}
            </div>
          </div>
        </div>
      </section>

      {/* Thai Standards Reference */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Thai Effluent Standards
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Reference values from the Pollution Control Department (PCD)
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {(['type_a', 'type_b', 'type_c'] as ThaiEffluentType[]).map((type) => {
              const std = THAI_EFFLUENT_STANDARDS[type]
              return (
                <div
                  key={type}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-teal-500/30 transition-colors"
                >
                  <h3 className="text-xl font-bold text-white mb-1">{std.nameThai}</h3>
                  <p className="text-sm text-teal-400 mb-4">{std.name}</p>
                  <p className="text-xs text-slate-500 mb-4">{std.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">BOD</span>
                      <span className="text-white font-mono">{std.limits.bod} mg/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">COD</span>
                      <span className="text-white font-mono">{std.limits.cod} mg/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SS</span>
                      <span className="text-white font-mono">{std.limits.ss} mg/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TDS</span>
                      <span className="text-white font-mono">{std.limits.tds} mg/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">pH</span>
                      <span className="text-white font-mono">
                        {std.limits.ph_min}-{std.limits.ph_max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temp</span>
                      <span className="text-white font-mono">{std.limits.temperature}C</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Formulas */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Formulas
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Beaker className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">BOD5</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>BOD5 = (D1 - D2) x DF</p>
                <p className="text-xs text-slate-500">DF = Bottle Volume / Sample Volume</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Gauge className="h-8 w-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">Ultimate BOD</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>BODu = BOD5 / (1 - e^(-k*5))</p>
                <p className="text-xs text-slate-500">k = first-order rate constant</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <FlaskConical className="h-8 w-8 text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">COD (Dichromate)</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>COD = (A - B) x N x 8000 / V</p>
                <p className="text-xs text-slate-500">A=blank, B=sample, N=normality</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Calculator className="h-8 w-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">BOD/COD Ratio</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>&gt;0.5: Easily biodegradable</p>
                <p>0.3-0.5: Moderate</p>
                <p>&lt;0.3: Difficult</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Thermometer className="h-8 w-8 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">Temp Correction</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>kT = k20 x theta^(T-20)</p>
                <p className="text-xs text-slate-500">theta = 1.047 (typical)</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <RefreshCw className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-4">Removal Efficiency</h3>
              <div className="space-y-2 font-mono text-sm text-slate-300">
                <p>E = (Cin - Cout) / Cin x 100%</p>
                <p className="text-xs text-slate-500">Cin=influent, Cout=effluent</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Use This Calculator?
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Factory,
                title: 'Industrial Compliance',
                description: 'Check wastewater against Thai effluent standards instantly',
              },
              {
                icon: Leaf,
                title: 'Environmental Protection',
                description: 'Ensure proper treatment before discharge',
              },
              {
                icon: Calculator,
                title: '9 Calculation Modes',
                description: 'BOD5, COD, k-rate, loading, efficiency, and more',
              },
              {
                icon: Beaker,
                title: 'APHA Methods',
                description: 'Standard Methods for Water and Wastewater analysis',
              },
              {
                icon: Zap,
                title: 'Instant Results',
                description: 'Get calculations in milliseconds with step-by-step solutions',
              },
              {
                icon: CheckCircle,
                title: 'Visual Compliance',
                description: 'Clear pass/fail indicators with exceedance details',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-teal-500/30 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-teal-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'What is BOD (Biochemical Oxygen Demand)?',
                a: 'BOD measures the amount of oxygen consumed by microorganisms to decompose organic matter in water over 5 days at 20C. Higher BOD indicates more organic pollution. BOD5 is the standard 5-day test used worldwide.',
              },
              {
                q: 'What is COD (Chemical Oxygen Demand)?',
                a: 'COD measures the total quantity of oxygen required to oxidize all organic material in water using a strong chemical oxidant (dichromate). COD is always higher than BOD because it includes non-biodegradable organics.',
              },
              {
                q: 'What does the BOD/COD ratio tell us?',
                a: 'The BOD/COD ratio indicates how biodegradable the wastewater is. Ratio >0.5 means easily biodegradable (suitable for biological treatment). Ratio <0.3 means difficult to biodegrade (may need chemical/physical treatment first).',
              },
              {
                q: 'What are Thai effluent standards?',
                a: 'Thai effluent standards are set by the Pollution Control Department (PCD). Type A is strictest (industrial estates), Type B is general industry, and Type C is for community/municipal wastewater. All discharges must comply with these limits.',
              },
              {
                q: 'What is the k-rate in BOD calculations?',
                a: 'The k-rate (deoxygenation rate constant) describes how fast organic matter is decomposed. Typical values range from 0.1-0.3/day. Higher k means faster decomposition. It varies with temperature, waste type, and microbial activity.',
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Explore More Chemistry Tools
          </h2>
          <p className="text-slate-400 mb-8">
            VerChem offers a complete suite of chemistry calculators and tools
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/ph-calculator"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              pH Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/stoichiometry"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Stoichiometry
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools/gas-laws"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Gas Laws
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/periodic-table"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 font-medium text-white hover:from-teal-500 hover:to-cyan-500 transition-colors"
            >
              Interactive Periodic Table
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
