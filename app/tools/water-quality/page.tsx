'use client'

import React, { useState, useCallback } from 'react'
import { CheckCircle, Droplets } from 'lucide-react'
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
} from '@/lib/calculations/environmental'
import type {
  WaterQualityMode,
  ThaiEffluentType,
  BODDataPoint,
} from '@/lib/types/environmental'
import {
  MODES,
  type CalculationResult,
} from '@/components/water-quality/water-quality-config'
import { WaterQualityInputs } from '@/components/water-quality/water-quality-inputs'
import { WaterQualityResults } from '@/components/water-quality/water-quality-results'
import {
  ThaiStandardsSection,
  FormulasSection,
  FeaturesSection,
  FAQSection,
  CTASection,
} from '@/components/water-quality/water-quality-sections'

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
              <WaterQualityInputs
                mode={mode}
                initialDO={initialDO}
                setInitialDO={setInitialDO}
                finalDO={finalDO}
                setFinalDO={setFinalDO}
                sampleVolume={sampleVolume}
                setSampleVolume={setSampleVolume}
                bottleVolume={bottleVolume}
                setBottleVolume={setBottleVolume}
                seedCorrection={seedCorrection}
                setSeedCorrection={setSeedCorrection}
                bod5Value={bod5Value}
                setBod5Value={setBod5Value}
                kRate={kRate}
                setKRate={setKRate}
                fasBlank={fasBlank}
                setFasBlank={setFasBlank}
                fasSample={fasSample}
                setFasSample={setFasSample}
                fasNormality={fasNormality}
                setFasNormality={setFasNormality}
                codSampleVolume={codSampleVolume}
                setCodSampleVolume={setCodSampleVolume}
                bodValue={bodValue}
                setBodValue={setBodValue}
                codValue={codValue}
                setCodValue={setCodValue}
                bodConc={bodConc}
                setBodConc={setBodConc}
                flowRate={flowRate}
                setFlowRate={setFlowRate}
                influentConc={influentConc}
                setInfluentConc={setInfluentConc}
                effluentConc={effluentConc}
                setEffluentConc={setEffluentConc}
                kRateData={kRateData}
                setKRateData={setKRateData}
                k20={k20}
                setK20={setK20}
                targetTemp={targetTemp}
                setTargetTemp={setTargetTemp}
                theta={theta}
                setTheta={setTheta}
                standardType={standardType}
                setStandardType={setStandardType}
                sampleBod={sampleBod}
                setSampleBod={setSampleBod}
                sampleCod={sampleCod}
                setSampleCod={setSampleCod}
                samplePh={samplePh}
                setSamplePh={setSamplePh}
                sampleSs={sampleSs}
                setSampleSs={setSampleSs}
                sampleTds={sampleTds}
                setSampleTds={setSampleTds}
                sampleTemp={sampleTemp}
                setSampleTemp={setSampleTemp}
              />

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
              <WaterQualityResults result={result} />
            </div>
          </div>
        </div>
      </section>

      {/* Static Sections */}
      <ThaiStandardsSection />
      <FormulasSection />
      <FeaturesSection />
      <FAQSection />
      <CTASection />
    </div>
  )
}
