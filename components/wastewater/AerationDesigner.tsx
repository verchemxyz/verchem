'use client'

import { useState, useMemo } from 'react'
import {
  WastewaterQuality,
  DiffuserType,
  AerationSystemDesign,
  DIFFUSER_SPECS,
  DesignIssue,
} from '@/lib/types/wastewater-treatment'
import {
  designAerationSystem,
  estimateAerationPower,
  AerationDesignInput,
} from '@/lib/calculations/aeration-design'

// ============================================
// DIFFUSER GRID VISUALIZATION
// ============================================

interface DiffuserGridProps {
  layout: AerationSystemDesign['diffuserSystem']['gridLayout']
  tankArea: number
}

function DiffuserGridVisualization({ layout, tankArea: _tankArea }: DiffuserGridProps) {
  const aspectRatio = 2 // L:W
  const width = 200
  const height = width / aspectRatio

  const cellWidth = width / layout.columns
  const cellHeight = height / layout.rows

  return (
    <div className="inline-block border-2 border-blue-300 rounded bg-blue-50 p-2">
      <svg width={width} height={height} className="block" role="img" aria-label="Diffuser grid layout">
        <title>Diffuser grid layout</title>
        {/* Tank outline */}
        <rect x={0} y={0} width={width} height={height} fill="none" stroke="#93c5fd" strokeWidth={2} />

        {/* Diffusers */}
        {Array.from({ length: layout.rows }).map((_, row) =>
          Array.from({ length: layout.columns }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={cellWidth / 2 + col * cellWidth}
              cy={cellHeight / 2 + row * cellHeight}
              r={4}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={1}
            />
          ))
        )}
      </svg>
      <div className="text-xs text-gray-500 text-center mt-1">
        {layout.rows} × {layout.columns} grid, {layout.spacing.toFixed(2)}m spacing
      </div>
    </div>
  )
}

// ============================================
// DO PROFILE CHART
// ============================================

interface DOProfileChartProps {
  profile: AerationSystemDesign['doProfile']
  setpoint: number
}

function DOProfileChart({ profile, setpoint }: DOProfileChartProps) {
  if (!profile || profile.length === 0) return null

  const width = 300
  const height = 120
  const padding = 25

  const maxDO = Math.max(...profile.map(p => p.doConcentration), setpoint)
  const maxPos = Math.max(...profile.map(p => p.position))

  const points = profile.map(p => ({
    x: padding + (p.position / maxPos) * (width - 2 * padding),
    y: height - padding - (p.doConcentration / maxDO) * (height - 2 * padding),
    isAnoxic: p.isAnoxic,
  }))

  const setpointY = height - padding - (setpoint / maxDO) * (height - 2 * padding)
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible" role="img" aria-label="Dissolved oxygen profile along tank">
      <title>Dissolved oxygen profile along tank</title>
      {/* Axes */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" />

      {/* Setpoint line */}
      <line
        x1={padding}
        y1={setpointY}
        x2={width - padding}
        y2={setpointY}
        stroke="#10b981"
        strokeDasharray="4"
        strokeWidth={1.5}
      />
      <text x={width - padding + 5} y={setpointY + 4} className="text-xs fill-emerald-600">
        SP
      </text>

      {/* DO curve */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />

      {/* Points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={p.isAnoxic ? '#ef4444' : '#3b82f6'}
        >
          <title>{p.isAnoxic ? 'Anoxic' : 'Aerobic'}</title>
        </circle>
      ))}

      {/* Labels */}
      <text x={padding - 5} y={padding} textAnchor="end" className="text-xs fill-gray-500">
        {maxDO.toFixed(1)}
      </text>
      <text x={padding - 5} y={height - padding} textAnchor="end" className="text-xs fill-gray-500">
        0
      </text>
      <text x={padding} y={height - 5} textAnchor="start" className="text-xs fill-gray-500">
        Inlet
      </text>
      <text x={width - padding} y={height - 5} textAnchor="end" className="text-xs fill-gray-500">
        Outlet
      </text>
    </svg>
  )
}

// ============================================
// ISSUE BADGE
// ============================================

function IssueBadge({ issue }: { issue: DesignIssue }) {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  return (
    <div className={`p-3 rounded-lg border ${colors[issue.severity]}`}>
      <div className="flex items-center gap-2 font-medium">
        <span>{issue.severity === 'critical' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
        {issue.parameter}
      </div>
      <p className="text-sm mt-1">{issue.message}</p>
      <div className="text-xs mt-2 flex items-center gap-2">
        <span>Current: {issue.currentValue.toFixed(2)} {issue.unit}</span>
        {issue.recommendedValue && (
          <span className="text-emerald-700">→ Recommended: {issue.recommendedValue.toFixed(2)}</span>
        )}
      </div>
      <p className="text-xs mt-1 italic">{issue.suggestion}</p>
    </div>
  )
}

// ============================================
// MAIN AERATION DESIGNER
// ============================================

interface AerationDesignerProps {
  influent: WastewaterQuality
  bodRemoved?: number
  nitrogenOxidized?: number
}

export default function AerationDesigner({
  influent,
  bodRemoved: initialBodRemoved,
  nitrogenOxidized: initialNOxidized,
}: AerationDesignerProps) {
  // Input state
  const [tankVolume, setTankVolume] = useState(500)
  const [tankDepth, setTankDepth] = useState(4.5)
  const [mlss, setMlss] = useState(3000)
  const [bodRemoved, setBodRemoved] = useState(initialBodRemoved || influent.bod * 0.9 * influent.flowRate / 1000)
  const [nitrogenOxidized, setNitrogenOxidized] = useState(initialNOxidized || (influent.ammonia || 25) * 0.8 * influent.flowRate / 1000)
  const [temperature, setTemperature] = useState(influent.temperature || 25)
  const [elevation, setElevation] = useState(0)
  const [diffuserType, setDiffuserType] = useState<DiffuserType>('fine_bubble_disc')
  const [doSetpoint, setDoSetpoint] = useState(2.0)
  const [alpha, setAlpha] = useState(0.6)
  const [beta, setBeta] = useState(0.98)
  const [foulingFactor, setFoulingFactor] = useState(0.8)
  const [peakFactor, setPeakFactor] = useState(1.5)
  const [blowerRedundancy, setBlowerRedundancy] = useState<'n' | 'n+1' | 'n+2'>('n+1')

  // Design result
  const [design, setDesign] = useState<AerationSystemDesign | null>(null)
  const [isDesigning, setIsDesigning] = useState(false)

  const runDesign = () => {
    setIsDesigning(true)
    try {
      const input: AerationDesignInput = {
        tankVolume,
        tankDepth,
        bodRemoved,
        nitrogenOxidized,
        mlss,
        temperature,
        elevation,
        alpha,
        beta,
        foulingFactor,
        doSetpoint,
        diffuserType,
        blowerRedundancy,
        peakFactor,
      }

      const result = designAerationSystem(input)
      setDesign(result)
    } catch (error) {
      console.error('Aeration design failed:', error)
    }
    setIsDesigning(false)
  }

  // Quick estimate
  const quickEstimate = useMemo(() => {
    return estimateAerationPower(
      influent.flowRate,
      influent.bod,
      influent.bod * 0.05,
      nitrogenOxidized > 0
    )
  }, [influent.flowRate, influent.bod, nitrogenOxidized])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">💨</span>
          Aeration System Design
        </h2>
        <p className="text-gray-600 mt-1">
          Design diffuser system, blower sizing, and oxygen transfer calculations.
        </p>
      </div>

      {/* Quick Estimate */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h3 className="font-medium text-cyan-900 mb-2">Quick Power Estimate</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-cyan-700">Power</div>
            <div className="text-xl font-bold text-cyan-900">{quickEstimate.power.toFixed(1)} kW</div>
          </div>
          <div>
            <div className="text-cyan-700">Daily Energy</div>
            <div className="text-xl font-bold text-cyan-900">{quickEstimate.dailyEnergy.toFixed(0)} kWh</div>
          </div>
          <div>
            <div className="text-cyan-700">Specific Energy</div>
            <div className="text-xl font-bold text-cyan-900">{quickEstimate.kWhPerM3.toFixed(3)} kWh/m³</div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Design Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tank */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Tank Parameters</h4>
            <div>
              <label htmlFor="aeration-tank-volume" className="block text-xs text-gray-600">Volume (m³)</label>
              <input
                id="aeration-tank-volume"
                type="number"
                value={tankVolume}
                onChange={(e) => setTankVolume(Math.max(1, Number(e.target.value) || 0))}
                min={1}
                max={100000}
                step={10}
                aria-describedby="aeration-tank-volume-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-tank-volume-hint" className="sr-only">Valid range: 1 to 100,000 m³</span>
            </div>
            <div>
              <label htmlFor="aeration-tank-depth" className="block text-xs text-gray-600">Depth (m)</label>
              <input
                id="aeration-tank-depth"
                type="number"
                value={tankDepth}
                onChange={(e) => setTankDepth(Math.max(0.5, Number(e.target.value) || 0))}
                min={0.5}
                max={10}
                step={0.5}
                aria-describedby="aeration-tank-depth-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-tank-depth-hint" className="sr-only">Valid range: 0.5 to 10 m</span>
            </div>
            <div>
              <label htmlFor="aeration-mlss" className="block text-xs text-gray-600">MLSS (mg/L)</label>
              <input
                id="aeration-mlss"
                type="number"
                value={mlss}
                onChange={(e) => setMlss(Math.max(500, Number(e.target.value) || 0))}
                min={500}
                max={10000}
                step={100}
                aria-describedby="aeration-mlss-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-mlss-hint" className="sr-only">Valid range: 500 to 10,000 mg/L</span>
            </div>
          </div>

          {/* Oxygen Demand */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Oxygen Demand</h4>
            <div>
              <label htmlFor="aeration-bod-removed" className="block text-xs text-gray-600">BOD Removed (kg/day)</label>
              <input
                id="aeration-bod-removed"
                type="number"
                value={bodRemoved.toFixed(1)}
                onChange={(e) => setBodRemoved(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={100000}
                step={10}
                aria-describedby="aeration-bod-removed-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-bod-removed-hint" className="sr-only">Valid range: 0 to 100,000 kg/day</span>
            </div>
            <div>
              <label htmlFor="aeration-n-oxidized" className="block text-xs text-gray-600">N Oxidized (kg/day)</label>
              <input
                id="aeration-n-oxidized"
                type="number"
                value={nitrogenOxidized.toFixed(1)}
                onChange={(e) => setNitrogenOxidized(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={50000}
                step={1}
                aria-describedby="aeration-n-oxidized-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-n-oxidized-hint" className="sr-only">Valid range: 0 to 50,000 kg/day</span>
            </div>
            <div>
              <label htmlFor="aeration-peak-factor" className="block text-xs text-gray-600">Peak Factor</label>
              <input
                id="aeration-peak-factor"
                type="number"
                value={peakFactor}
                onChange={(e) => setPeakFactor(Math.max(1, Number(e.target.value) || 1))}
                min={1}
                max={3}
                step={0.1}
                aria-describedby="aeration-peak-factor-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-peak-factor-hint" className="sr-only">Valid range: 1 to 3</span>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 border-b pb-1">Conditions</h4>
            <div>
              <label htmlFor="aeration-temperature" className="block text-xs text-gray-600">Temperature (°C)</label>
              <input
                id="aeration-temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={45}
                step={1}
                aria-describedby="aeration-temperature-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-temperature-hint" className="sr-only">Valid range: 0 to 45 °C</span>
            </div>
            <div>
              <label htmlFor="aeration-elevation" className="block text-xs text-gray-600">Elevation (m)</label>
              <input
                id="aeration-elevation"
                type="number"
                value={elevation}
                onChange={(e) => setElevation(Math.max(0, Number(e.target.value) || 0))}
                min={0}
                max={5000}
                step={50}
                aria-describedby="aeration-elevation-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-elevation-hint" className="sr-only">Valid range: 0 to 5,000 m above sea level</span>
            </div>
            <div>
              <label htmlFor="aeration-do-setpoint" className="block text-xs text-gray-600">DO Setpoint (mg/L)</label>
              <input
                id="aeration-do-setpoint"
                type="number"
                value={doSetpoint}
                onChange={(e) => setDoSetpoint(Math.max(0.5, Number(e.target.value) || 0.5))}
                min={0.5}
                max={8}
                step={0.5}
                aria-describedby="aeration-do-setpoint-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-do-setpoint-hint" className="sr-only">Valid range: 0.5 to 8 mg/L</span>
            </div>
          </div>
        </div>

        {/* Equipment Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label htmlFor="aeration-diffuser-type" className="block text-sm font-medium text-gray-700 mb-2">Diffuser Type</label>
            <select
              id="aeration-diffuser-type"
              value={diffuserType}
              onChange={(e) => setDiffuserType(e.target.value as DiffuserType)}
              className="w-full px-3 py-2 border rounded"
            >
              {Object.entries(DIFFUSER_SPECS).map(([key, spec]) => (
                <option key={key} value={key}>
                  {spec.name} (SOTE: {spec.sote}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="aeration-blower-redundancy" className="block text-sm font-medium text-gray-700 mb-2">Blower Redundancy</label>
            <select
              id="aeration-blower-redundancy"
              value={blowerRedundancy}
              onChange={(e) => setBlowerRedundancy(e.target.value as 'n' | 'n+1' | 'n+2')}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="n">N (No standby)</option>
              <option value="n+1">N+1 (One standby)</option>
              <option value="n+2">N+2 (Two standby)</option>
            </select>
          </div>
        </div>

        {/* Correction Factors */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Oxygen Transfer Correction Factors</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="aeration-alpha" className="block text-xs text-gray-600">Alpha (α)</label>
              <input
                id="aeration-alpha"
                type="number"
                value={alpha}
                onChange={(e) => setAlpha(Math.max(0.3, Math.min(0.9, Number(e.target.value) || 0.6)))}
                step={0.05}
                min={0.3}
                max={0.9}
                aria-describedby="aeration-alpha-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-alpha-hint" className="text-xs text-gray-500">Wastewater/clean water (0.4-0.9)</span>
            </div>
            <div>
              <label htmlFor="aeration-beta" className="block text-xs text-gray-600">Beta (β)</label>
              <input
                id="aeration-beta"
                type="number"
                value={beta}
                onChange={(e) => setBeta(Math.max(0.9, Math.min(1.0, Number(e.target.value) || 0.98)))}
                step={0.01}
                min={0.9}
                max={1.0}
                aria-describedby="aeration-beta-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-beta-hint" className="text-xs text-gray-500">Salinity factor (0.95-0.99)</span>
            </div>
            <div>
              <label htmlFor="aeration-fouling" className="block text-xs text-gray-600">Fouling (F)</label>
              <input
                id="aeration-fouling"
                type="number"
                value={foulingFactor}
                onChange={(e) => setFoulingFactor(Math.max(0.5, Math.min(1.0, Number(e.target.value) || 0.8)))}
                step={0.05}
                min={0.5}
                max={1.0}
                aria-describedby="aeration-fouling-hint"
                className="w-full px-3 py-1.5 border rounded text-sm"
              />
              <span id="aeration-fouling-hint" className="text-xs text-gray-500">Membrane fouling (0.65-0.9)</span>
            </div>
          </div>
        </div>

        <button
          onClick={runDesign}
          disabled={isDesigning}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {isDesigning ? 'Designing...' : 'Design Aeration System'}
        </button>
      </div>

      {/* Results */}
      {design && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Total Airflow</div>
              <div className="text-2xl font-bold text-blue-600">
                {design.diffuserSystem.totalAirflow.toFixed(0)} Nm³/h
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Blower Power</div>
              <div className="text-2xl font-bold text-amber-600">
                {design.blowerSystem.totalPower.toFixed(1)} kW
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Diffusers</div>
              <div className="text-2xl font-bold text-emerald-600">
                {design.diffuserSystem.numberOfDiffusers}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500">Capital Cost</div>
              <div className="text-2xl font-bold text-purple-600">
                {(design.capitalCost.total / 1000000).toFixed(2)}M THB
              </div>
            </div>
          </div>

          {/* Oxygen Transfer */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Oxygen Requirements & Transfer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Oxygen Demand</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Carbonaceous</td>
                      <td className="text-right font-medium">{design.oxygenDemand.carbonaceous.toFixed(1)} kg O₂/day</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Nitrogenous</td>
                      <td className="text-right font-medium">{design.oxygenDemand.nitrogenous.toFixed(1)} kg O₂/day</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Endogenous</td>
                      <td className="text-right font-medium">{design.oxygenDemand.endogenous.toFixed(1)} kg O₂/day</td>
                    </tr>
                    <tr className="border-b bg-blue-50">
                      <td className="py-2 font-medium">Total</td>
                      <td className="text-right font-bold">{design.oxygenDemand.total.toFixed(1)} kg O₂/day</td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td className="py-2 font-medium">Peak (×{design.oxygenDemand.peakFactor})</td>
                      <td className="text-right font-bold">{design.oxygenDemand.peakDemand.toFixed(1)} kg O₂/day</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Transfer Efficiency</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">SOTE (Standard)</td>
                      <td className="text-right font-medium">{design.transfer.sote.toFixed(1)}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">AOTE (Actual)</td>
                      <td className="text-right font-medium">{design.transfer.aote.toFixed(1)}%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Alpha (α)</td>
                      <td className="text-right font-medium">{design.transfer.alpha.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Beta (β)</td>
                      <td className="text-right font-medium">{design.transfer.beta.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">DO Saturation</td>
                      <td className="text-right font-medium">{design.transfer.csInf.toFixed(2)} mg/L</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Diffuser System */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Diffuser System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Type</td>
                      <td className="text-right font-medium">{design.diffuserSystem.spec.name}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Number of Diffusers</td>
                      <td className="text-right font-medium">{design.diffuserSystem.numberOfDiffusers}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Diffuser Density</td>
                      <td className="text-right font-medium">{design.diffuserSystem.diffuserDensity.toFixed(2)} /m²</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Airflow per Diffuser</td>
                      <td className="text-right font-medium">{design.diffuserSystem.airflowPerDiffuser.toFixed(1)} Nm³/h</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Total Airflow</td>
                      <td className="text-right font-medium">{design.diffuserSystem.totalAirflow.toFixed(0)} Nm³/h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-center justify-center">
                <DiffuserGridVisualization layout={design.diffuserSystem.gridLayout} tankArea={design.tankArea} />
              </div>
            </div>
          </div>

          {/* Blower System */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Blower System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Type</td>
                      <td className="text-right font-medium capitalize">{design.blowerSystem.type.replace(/_/g, ' ')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Operating Blowers</td>
                      <td className="text-right font-medium">{design.blowerSystem.numberOfBlowers - design.blowerSystem.numberOfStandby}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Standby Blowers</td>
                      <td className="text-right font-medium">{design.blowerSystem.numberOfStandby}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Capacity Each</td>
                      <td className="text-right font-medium">{design.blowerSystem.capacityPerBlower.toFixed(0)} Nm³/h</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Discharge Pressure</td>
                      <td className="text-right font-medium">{design.blowerSystem.dischargePressure.toFixed(1)} kPa</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Motor Power Each</td>
                      <td className="text-right font-medium">{design.blowerSystem.motorPower.toFixed(1)} kW</td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td className="py-2 font-medium">Total Power</td>
                      <td className="text-right font-bold">{design.blowerSystem.totalPower.toFixed(1)} kW</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Piping System</h4>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Main Header</td>
                      <td className="text-right font-medium">{design.pipingSystem.mainHeaderDiameter} mm</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Drop Pipes</td>
                      <td className="text-right font-medium">{design.pipingSystem.dropPipeDiameter} mm × {design.pipingSystem.numberOfDropPipes}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Air Velocity</td>
                      <td className="text-right font-medium">{design.pipingSystem.airVelocity.toFixed(1)} m/s</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Pressure Drop</td>
                      <td className="text-right font-medium">{design.pipingSystem.totalPressureDrop.toFixed(2)} kPa</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DO Profile */}
          {design.doProfile && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">DO Profile Along Tank</h3>
              <DOProfileChart profile={design.doProfile} setpoint={design.controlSystem.doSetpoint} />
            </div>
          )}

          {/* Energy & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Energy Consumption</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Daily Energy</td>
                    <td className="text-right font-medium">{design.energyConsumption.dailyEnergy.toFixed(0)} kWh</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Annual Energy</td>
                    <td className="text-right font-medium">{(design.energyConsumption.annualEnergy / 1000).toFixed(0)} MWh</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Specific Energy</td>
                    <td className="text-right font-medium">{design.energyConsumption.kWhPerM3.toFixed(3)} kWh/m³</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Efficiency</td>
                    <td className="text-right font-medium">{design.energyConsumption.kWhPerKgO2.toFixed(2)} kWh/kg O₂</td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="py-2 font-medium">Annual Cost</td>
                    <td className="text-right font-bold">{(design.energyConsumption.annualCost / 1000).toFixed(0)}K THB</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Capital Cost</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Diffusers</td>
                    <td className="text-right font-medium">{(design.capitalCost.diffusers / 1000).toFixed(0)}K THB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Blowers</td>
                    <td className="text-right font-medium">{(design.capitalCost.blowers / 1000).toFixed(0)}K THB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Piping</td>
                    <td className="text-right font-medium">{(design.capitalCost.piping / 1000).toFixed(0)}K THB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Controls</td>
                    <td className="text-right font-medium">{(design.capitalCost.controls / 1000).toFixed(0)}K THB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Installation</td>
                    <td className="text-right font-medium">{(design.capitalCost.installation / 1000).toFixed(0)}K THB</td>
                  </tr>
                  <tr className="bg-purple-50">
                    <td className="py-2 font-medium">Total</td>
                    <td className="text-right font-bold">{(design.capitalCost.total / 1000000).toFixed(2)}M THB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Issues */}
          {(design.validation.issues.length > 0 || design.validation.warnings.length > 0) && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Design Validation</h3>
              <div className="space-y-3">
                {design.validation.issues.map((issue, idx) => (
                  <IssueBadge key={idx} issue={issue} />
                ))}
                {design.validation.warnings.map((warning, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {design.validation.recommendations.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="font-semibold text-emerald-900 mb-3">💡 Recommendations</h3>
              <ul className="space-y-2">
                {design.validation.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-emerald-800">
                    <span className="text-emerald-600">•</span>
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
