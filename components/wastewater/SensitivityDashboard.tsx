'use client'

import { useState, useMemo } from 'react'
import {
  WastewaterQuality,
  UnitType,
  ThaiEffluentType,
  SensitivityAnalysis,
  SensitivityParameter,
  SensitivityResult,
} from '@/lib/types/wastewater-treatment'
import {
  calculateSensitivityAnalysis,
  runMonteCarloSimulation,
  SensitivityAnalysisInput,
} from '@/lib/calculations/sensitivity-analysis'

// ============================================
// TORNADO CHART COMPONENT
// ============================================

interface TornadoChartProps {
  data: SensitivityAnalysis['tornadoData']
  selectedParameter?: SensitivityParameter
  onSelectParameter: (param: SensitivityParameter) => void
}

function TornadoChart({ data, selectedParameter, onSelectParameter }: TornadoChartProps) {
  const maxImpact = Math.max(...data.flatMap(d => [Math.abs(d.lowImpact), Math.abs(d.highImpact)]))
  const scale = maxImpact > 0 ? 100 / maxImpact : 1

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const isSelected = selectedParameter === item.parameter
        const lowWidth = Math.abs(item.lowImpact) * scale
        const highWidth = Math.abs(item.highImpact) * scale
        const isLowNegative = item.lowImpact < 0
        const isHighNegative = item.highImpact < 0

        return (
          <button
            key={item.parameter}
            onClick={() => onSelectParameter(item.parameter)}
            className={`w-full text-left transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-center gap-2 py-1">
              <div className="w-32 text-xs font-medium text-gray-700 truncate">
                {item.parameterName}
              </div>
              <div className="flex-1 flex items-center h-6">
                {/* Negative side (left) */}
                <div className="flex-1 flex justify-end">
                  {isLowNegative && (
                    <div
                      className="h-4 bg-red-400 rounded-l"
                      style={{ width: `${lowWidth}%` }}
                      title={`${item.lowImpact.toFixed(1)}%`}
                    />
                  )}
                  {isHighNegative && !isLowNegative && (
                    <div
                      className="h-4 bg-red-400 rounded-l"
                      style={{ width: `${highWidth}%` }}
                      title={`${item.highImpact.toFixed(1)}%`}
                    />
                  )}
                </div>
                {/* Center line */}
                <div className="w-px h-6 bg-gray-400" />
                {/* Positive side (right) */}
                <div className="flex-1 flex justify-start">
                  {!isLowNegative && (
                    <div
                      className="h-4 bg-emerald-400 rounded-r"
                      style={{ width: `${lowWidth}%` }}
                      title={`${item.lowImpact.toFixed(1)}%`}
                    />
                  )}
                  {!isHighNegative && (
                    <div
                      className="h-4 bg-emerald-400 rounded-r"
                      style={{ width: `${highWidth}%` }}
                      title={`${item.highImpact.toFixed(1)}%`}
                    />
                  )}
                </div>
              </div>
              <div className="w-16 text-xs text-gray-500 text-right">
                {Math.abs(item.highImpact - item.lowImpact).toFixed(1)}%
              </div>
            </div>
          </button>
        )
      })}
      {/* Scale */}
      <div className="flex items-center gap-2 pt-2 border-t text-xs text-gray-500">
        <div className="w-32" />
        <div className="flex-1 flex justify-between">
          <span>-{maxImpact.toFixed(0)}%</span>
          <span>0%</span>
          <span>+{maxImpact.toFixed(0)}%</span>
        </div>
        <div className="w-16 text-right">Range</div>
      </div>
    </div>
  )
}

// ============================================
// SENSITIVITY LINE CHART
// ============================================

interface SensitivityLineChartProps {
  result: SensitivityResult
  outputMetric: 'costPerM3' | 'bodRemoval' | 'complianceStatus'
}

function SensitivityLineChart({ result, outputMetric }: SensitivityLineChartProps) {
  const data = result.dataPoints.map(dp => ({
    x: dp.inputVariation,
    y: dp.outputs[outputMetric],
    compliance: dp.compliance,
  }))

  const minY = Math.min(...data.map(d => d.y))
  const maxY = Math.max(...data.map(d => d.y))
  const rangeY = maxY - minY || 1

  const width = 300
  const height = 150
  const padding = 30

  const points = data.map((d, i) => ({
    x: padding + ((d.x - data[0].x) / (data[data.length - 1].x - data[0].x)) * (width - 2 * padding),
    y: height - padding - ((d.y - minY) / rangeY) * (height - 2 * padding),
    compliance: d.compliance,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid lines */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />

      {/* Baseline (0%) vertical line */}
      <line
        x1={width / 2}
        y1={padding}
        x2={width / 2}
        y2={height - padding}
        stroke="#9ca3af"
        strokeDasharray="4"
      />

      {/* Data line */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill={p.compliance ? '#10b981' : '#ef4444'}
          stroke="white"
          strokeWidth={2}
        />
      ))}

      {/* Y-axis labels */}
      <text x={padding - 5} y={padding} textAnchor="end" className="text-xs fill-gray-500">
        {maxY.toFixed(1)}
      </text>
      <text x={padding - 5} y={height - padding} textAnchor="end" className="text-xs fill-gray-500">
        {minY.toFixed(1)}
      </text>

      {/* X-axis labels */}
      <text x={padding} y={height - 5} textAnchor="middle" className="text-xs fill-gray-500">
        {data[0].x.toFixed(0)}%
      </text>
      <text x={width / 2} y={height - 5} textAnchor="middle" className="text-xs fill-gray-500">
        0%
      </text>
      <text x={width - padding} y={height - 5} textAnchor="middle" className="text-xs fill-gray-500">
        {data[data.length - 1].x.toFixed(0)}%
      </text>
    </svg>
  )
}

// ============================================
// MAIN SENSITIVITY DASHBOARD
// ============================================

interface SensitivityDashboardProps {
  influent: WastewaterQuality
  unitConfigs: Array<{ type: UnitType; config: Record<string, unknown> }>
  targetStandard: ThaiEffluentType
  systemName?: string
}

export default function SensitivityDashboard({
  influent,
  unitConfigs,
  targetStandard,
  systemName = 'Treatment System',
}: SensitivityDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SensitivityAnalysis | null>(null)
  const [selectedParameter, setSelectedParameter] = useState<SensitivityParameter | null>(null)
  const [monteCarloResult, setMonteCarloResult] = useState<ReturnType<typeof runMonteCarloSimulation> | null>(null)
  const [parametersToAnalyze, setParametersToAnalyze] = useState<SensitivityParameter[]>([
    'flowRate',
    'bod',
    'cod',
    'tss',
    'temperature',
    'electricityRate',
  ])

  const availableParameters: { param: SensitivityParameter; label: string }[] = [
    { param: 'flowRate', label: 'Flow Rate' },
    { param: 'bod', label: 'BOD' },
    { param: 'cod', label: 'COD' },
    { param: 'tss', label: 'TSS' },
    { param: 'tkn', label: 'TKN' },
    { param: 'ammonia', label: 'Ammonia' },
    { param: 'totalP', label: 'Total P' },
    { param: 'temperature', label: 'Temperature' },
    { param: 'electricityRate', label: 'Electricity Rate' },
    { param: 'laborRate', label: 'Labor Rate' },
  ]

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const input: SensitivityAnalysisInput = {
        systemName,
        influent,
        unitConfigs: unitConfigs.map(uc => ({ type: uc.type, config: uc.config })),
        targetStandard,
        parametersToAnalyze,
      }

      const result = calculateSensitivityAnalysis(input)
      setAnalysis(result)

      if (result.results.length > 0) {
        setSelectedParameter(result.results[0].parameter)
      }

      // Run Monte Carlo simulation
      const mc = runMonteCarloSimulation(input, 500, 25)
      setMonteCarloResult(mc)
    } catch (error) {
      console.error('Sensitivity analysis failed:', error)
    }
    setIsAnalyzing(false)
  }

  const selectedResult = useMemo(() => {
    if (!analysis || !selectedParameter) return null
    return analysis.results.find(r => r.parameter === selectedParameter)
  }, [analysis, selectedParameter])

  if (unitConfigs.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <p className="text-amber-800">
          Add treatment units to the system first before running sensitivity analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Sensitivity Analysis
        </h2>
        <p className="text-gray-600 mt-1">
          Analyze how changes in input parameters affect system performance, cost, and compliance.
        </p>
      </div>

      {/* Parameter Selection */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Parameters to Analyze</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {availableParameters.map(({ param, label }) => (
            <label
              key={param}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition ${
                parametersToAnalyze.includes(param)
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={parametersToAnalyze.includes(param)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setParametersToAnalyze([...parametersToAnalyze, param])
                  } else {
                    setParametersToAnalyze(parametersToAnalyze.filter(p => p !== param))
                  }
                }}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing || parametersToAnalyze.length === 0}
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Sensitivity Analysis'}
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Robustness Score</div>
              <div className={`text-3xl font-bold ${
                analysis.summary.robustnessScore >= 70 ? 'text-emerald-600' :
                analysis.summary.robustnessScore >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {analysis.summary.robustnessScore.toFixed(0)}/100
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {analysis.summary.robustnessScore >= 70 ? 'Robust Design' :
                 analysis.summary.robustnessScore >= 40 ? 'Moderate Risk' : 'High Risk'}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Baseline Compliance</div>
              <div className={`text-2xl font-bold ${
                analysis.baselineCompliance ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {analysis.baselineCompliance ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Cost: {analysis.baselineCost.costPerM3.toFixed(2)} THB/m³
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Most Sensitive</div>
              <div className="text-lg font-bold text-gray-900">
                {analysis.summary.mostSensitiveParameters[0]?.replace(/([A-Z])/g, ' $1').trim() || '-'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Highest impact on cost
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Critical Risks</div>
              <div className={`text-2xl font-bold ${
                analysis.summary.criticalRisks.length === 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {analysis.summary.criticalRisks.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Parameters causing compliance loss
              </div>
            </div>
          </div>

          {/* Tornado Chart */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tornado Diagram - Impact on Cost</h3>
            <TornadoChart
              data={analysis.tornadoData}
              selectedParameter={selectedParameter || undefined}
              onSelectParameter={setSelectedParameter}
            />
          </div>

          {/* Selected Parameter Detail */}
          {selectedResult && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Parameter Detail: {selectedResult.parameterName}
                <span className="text-gray-500 font-normal ml-2">({selectedResult.parameterNameThai})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Impact</h4>
                  <SensitivityLineChart result={selectedResult} outputMetric="costPerM3" />
                </div>

                {/* Data Table */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Data Points</h4>
                  <div className="max-h-48 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Variation</th>
                          <th className="px-2 py-1 text-left">Value</th>
                          <th className="px-2 py-1 text-left">Cost</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.dataPoints.map((dp, idx) => (
                          <tr key={idx} className={dp.inputVariation === 0 ? 'bg-blue-50' : ''}>
                            <td className="px-2 py-1">{dp.inputVariation.toFixed(0)}%</td>
                            <td className="px-2 py-1">{dp.inputValue.toFixed(1)} {selectedResult.unit}</td>
                            <td className="px-2 py-1">{dp.outputs.costPerM3.toFixed(2)} THB/m³</td>
                            <td className="px-2 py-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                dp.compliance ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {dp.compliance ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Elasticity */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Elasticity (% change in output per 1% change in input)</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    Cost: {selectedResult.elasticity.costPerM3?.toFixed(2) || '0.00'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    BOD: {selectedResult.elasticity.effluentBOD?.toFixed(2) || '0.00'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    Energy: {selectedResult.elasticity.kWhPerM3?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Critical Threshold */}
              {selectedResult.criticalThreshold && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">Critical Threshold</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    System {selectedResult.criticalThreshold.direction === 'above' ? 'above' : 'below'}{' '}
                    <strong>{selectedResult.criticalThreshold.value.toFixed(1)} {selectedResult.unit}</strong>:{' '}
                    {selectedResult.criticalThreshold.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Monte Carlo Results */}
          {monteCarloResult && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Monte Carlo Simulation
                <span className="text-gray-500 font-normal ml-2">({monteCarloResult.iterations} iterations)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-700">Cost per m³</div>
                  <div className="text-xl font-bold text-blue-900">
                    {monteCarloResult.results.costPerM3.mean.toFixed(2)} ± {monteCarloResult.results.costPerM3.stdDev.toFixed(2)} THB
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    95% CI: {monteCarloResult.results.costPerM3.p5.toFixed(2)} - {monteCarloResult.results.costPerM3.p95.toFixed(2)}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <div className="text-sm text-emerald-700">Compliance Rate</div>
                  <div className={`text-xl font-bold ${
                    monteCarloResult.results.complianceRate >= 0.95 ? 'text-emerald-900' :
                    monteCarloResult.results.complianceRate >= 0.80 ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {(monteCarloResult.results.complianceRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    Under uncertainty (±25% variation)
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-700">Effluent BOD</div>
                  <div className="text-xl font-bold text-purple-900">
                    {monteCarloResult.results.effluentBOD.mean.toFixed(1)} ± {monteCarloResult.results.effluentBOD.stdDev.toFixed(1)} mg/L
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    95% CI: {monteCarloResult.results.effluentBOD.p5.toFixed(1)} - {monteCarloResult.results.effluentBOD.p95.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.summary.recommendations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-3">📋 Recommendations</h3>
              <ul className="space-y-2">
                {analysis.summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-amber-800">
                    <span className="text-amber-600">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
