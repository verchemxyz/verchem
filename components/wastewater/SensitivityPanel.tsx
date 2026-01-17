'use client'

import { useState, useMemo } from 'react'
import {
  SensitivityAnalysis,
  SensitivityResult,
  SensitivityOutput,
} from '@/lib/types/wastewater-treatment'

// ============================================
// TORNADO CHART COMPONENT
// ============================================

interface TornadoChartProps {
  data: SensitivityAnalysis['tornadoData']
}

function TornadoChart({ data }: TornadoChartProps) {
  // Find max impact for scaling
  const maxImpact = Math.max(
    ...data.map(d => Math.max(Math.abs(d.lowImpact), Math.abs(d.highImpact))),
    1 // Minimum scale
  )

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700 text-sm">Tornado Chart - Cost Impact</h4>
      <p className="text-xs text-gray-500 mb-4">Shows how ±20% change in each parameter affects annual operating cost</p>

      <div className="space-y-2">
        {data.slice(0, 6).map((item) => {
          const lowWidth = Math.abs(item.lowImpact) / maxImpact * 100
          const highWidth = Math.abs(item.highImpact) / maxImpact * 100

          return (
            <div key={item.parameter} className="flex items-center gap-2">
              {/* Parameter name */}
              <div className="w-28 text-xs text-gray-600 text-right truncate" title={item.parameterName}>
                {item.parameterName}
              </div>

              {/* Bar container */}
              <div className="flex-1 flex items-center h-6">
                {/* Left side (low impact) */}
                <div className="flex-1 flex justify-end">
                  <div
                    className={`h-5 rounded-l ${item.lowImpact < 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${lowWidth}%`, minWidth: lowWidth > 0 ? '2px' : '0' }}
                    title={`-20%: ${item.lowImpact.toFixed(1)}%`}
                  />
                </div>

                {/* Center line */}
                <div className="w-px h-6 bg-gray-400" />

                {/* Right side (high impact) */}
                <div className="flex-1">
                  <div
                    className={`h-5 rounded-r ${item.highImpact > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${highWidth}%`, minWidth: highWidth > 0 ? '2px' : '0' }}
                    title={`+20%: ${item.highImpact.toFixed(1)}%`}
                  />
                </div>
              </div>

              {/* Impact values */}
              <div className="w-24 text-xs text-gray-500 text-right">
                {item.lowImpact.toFixed(1)}% / +{item.highImpact.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Cost Decrease</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Cost Increase</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PARAMETER DETAIL COMPONENT
// ============================================

interface ParameterDetailProps {
  result: SensitivityResult
  selectedOutput: SensitivityOutput
}

function ParameterDetail({ result, selectedOutput }: ParameterDetailProps) {
  const outputLabels: Record<SensitivityOutput, string> = {
    effluentBOD: 'Effluent BOD',
    effluentCOD: 'Effluent COD',
    effluentTSS: 'Effluent TSS',
    effluentTKN: 'Effluent TKN',
    effluentNH3: 'Effluent NH₃-N',
    effluentTP: 'Effluent TP',
    bodRemoval: 'BOD Removal %',
    codRemoval: 'COD Removal %',
    tssRemoval: 'TSS Removal %',
    nitrogenRemoval: 'N Removal %',
    phosphorusRemoval: 'P Removal %',
    totalCapitalCost: 'Capital Cost',
    totalOperatingCost: 'Operating Cost',
    costPerM3: 'Cost/m³',
    energyConsumption: 'Energy',
    kWhPerM3: 'kWh/m³',
    sludgeProduction: 'Sludge',
    complianceStatus: 'Compliance',
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700">
          {result.parameterName} ({result.parameterNameThai})
        </h4>
        <span className="text-sm text-gray-500">
          Baseline: {result.baselineValue.toLocaleString()} {result.unit}
        </span>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-left text-gray-500">Variation</th>
              <th className="py-2 text-right text-gray-500">Value</th>
              <th className="py-2 text-right text-gray-500">{outputLabels[selectedOutput]}</th>
              <th className="py-2 text-center text-gray-500">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {result.dataPoints.map((point) => (
              <tr
                key={point.inputVariation}
                className={`border-b border-gray-100 ${point.inputVariation === 0 ? 'bg-blue-50 font-medium' : ''}`}
              >
                <td className="py-1.5">
                  {point.inputVariation > 0 ? '+' : ''}{point.inputVariation}%
                </td>
                <td className="py-1.5 text-right">
                  {point.inputValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="py-1.5 text-right">
                  {point.outputs[selectedOutput].toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 text-center">
                  {point.compliance ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Elasticity */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Elasticity:</strong> {result.elasticity[selectedOutput].toFixed(2)}
          <span className="ml-2 text-gray-400">
            (1% change in {result.parameterName} causes {result.elasticity[selectedOutput].toFixed(2)}% change in {outputLabels[selectedOutput]})
          </span>
        </p>
      </div>

      {/* Critical threshold warning */}
      {result.criticalThreshold && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <strong>Warning:</strong> {result.criticalThreshold.reason}
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN SENSITIVITY PANEL COMPONENT
// ============================================

interface SensitivityPanelProps {
  analysis: SensitivityAnalysis
}

export default function SensitivityPanel({ analysis }: SensitivityPanelProps) {
  const [selectedParam, setSelectedParam] = useState<string>(
    analysis.results[0]?.parameter || ''
  )
  const [selectedOutput, setSelectedOutput] = useState<SensitivityOutput>('totalOperatingCost')

  const selectedResult = useMemo(
    () => analysis.results.find(r => r.parameter === selectedParam),
    [analysis.results, selectedParam]
  )

  const outputOptions: { value: SensitivityOutput; label: string }[] = [
    { value: 'totalOperatingCost', label: 'Operating Cost (Annual)' },
    { value: 'totalCapitalCost', label: 'Capital Cost' },
    { value: 'costPerM3', label: 'Cost per m³' },
    { value: 'effluentBOD', label: 'Effluent BOD' },
    { value: 'effluentCOD', label: 'Effluent COD' },
    { value: 'effluentTSS', label: 'Effluent TSS' },
    { value: 'bodRemoval', label: 'BOD Removal %' },
    { value: 'energyConsumption', label: 'Energy Consumption' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📊 Sensitivity Analysis
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            What-If Analysis: How input variations affect system performance
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          analysis.summary.robustnessScore >= 70
            ? 'bg-emerald-100 text-emerald-700'
            : analysis.summary.robustnessScore >= 40
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }`}>
          Robustness: {analysis.summary.robustnessScore}/100
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">Most Sensitive</div>
          <div className="text-sm font-bold text-blue-900 mt-1">
            {analysis.results.find(r => r.impactRanking === 1)?.parameterName || '-'}
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-xs text-emerald-600 font-medium">Least Sensitive</div>
          <div className="text-sm font-bold text-emerald-900 mt-1">
            {analysis.results.sort((a, b) => b.impactRanking - a.impactRanking)[0]?.parameterName || '-'}
          </div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-xs text-amber-600 font-medium">Critical Risks</div>
          <div className="text-sm font-bold text-amber-900 mt-1">
            {analysis.summary.criticalRisks.length} parameter(s)
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium">Baseline Status</div>
          <div className="text-sm font-bold text-purple-900 mt-1">
            {analysis.baselineCompliance ? '✓ Compliant' : '✗ Non-compliant'}
          </div>
        </div>
      </div>

      {/* Tornado Chart */}
      {analysis.tornadoData.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <TornadoChart data={analysis.tornadoData} />
        </div>
      )}

      {/* Recommendations */}
      {analysis.summary.recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {analysis.summary.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-700">{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Parameter Detail Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Select Parameter</label>
            <select
              value={selectedParam}
              onChange={(e) => setSelectedParam(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {analysis.results.map((r) => (
                <option key={r.parameter} value={r.parameter}>
                  {r.parameterName} (Rank #{r.impactRanking})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Output Metric</label>
            <select
              value={selectedOutput}
              onChange={(e) => setSelectedOutput(e.target.value as SensitivityOutput)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {outputOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedResult && (
          <ParameterDetail result={selectedResult} selectedOutput={selectedOutput} />
        )}
      </div>
    </div>
  )
}
