'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import {
  CalculationResult,
  isBOD5Result,
  isBODuResult,
  isCODResult,
  isBODCODRatioResult,
  isBODLoadingResult,
  isRemovalEfficiencyResult,
  isKRateResult,
  isTempCorrectionResult,
  isComplianceResult,
} from './water-quality-config'

// ============================================
// RESULT DISPLAY COMPONENTS
// ============================================

export function WaterQualityResults({ result }: { result: CalculationResult | null }) {
  if (!result) return null

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
