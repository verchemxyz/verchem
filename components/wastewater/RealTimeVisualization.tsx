'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  WastewaterQuality,
  TreatmentSystem,
  UNIT_METADATA,
  ThaiEffluentType,
  THAI_EFFLUENT_STANDARDS,
} from '@/lib/types/wastewater-treatment'

// ============================================
// TYPES
// ============================================

interface TimePoint {
  hour: number
  flowRate: number
  bod: number
  cod: number
  tss: number
  effluentBOD: number
  effluentCOD: number
  effluentTSS: number
}

interface SimulationState {
  isRunning: boolean
  currentHour: number
  speed: number // 1x, 2x, 5x, 10x
  data: TimePoint[]
}

interface DiurnalPattern {
  name: string
  nameThai: string
  flowFactors: number[] // 24 values for each hour
  bodFactors: number[]
}

// ============================================
// DIURNAL PATTERNS
// ============================================

const DIURNAL_PATTERNS: Record<string, DiurnalPattern> = {
  domestic: {
    name: 'Domestic',
    nameThai: 'ชุมชน',
    flowFactors: [
      0.5, 0.4, 0.35, 0.3, 0.35, 0.5,   // 0-5 AM
      0.9, 1.3, 1.4, 1.2, 1.0, 1.1,     // 6-11 AM
      1.3, 1.2, 1.0, 0.9, 0.95, 1.1,    // 12-5 PM
      1.4, 1.5, 1.3, 1.1, 0.8, 0.6      // 6-11 PM
    ],
    bodFactors: [
      0.6, 0.5, 0.45, 0.4, 0.45, 0.6,
      1.0, 1.4, 1.5, 1.3, 1.1, 1.2,
      1.4, 1.3, 1.1, 1.0, 1.0, 1.2,
      1.5, 1.6, 1.4, 1.2, 0.9, 0.7
    ]
  },
  industrial: {
    name: 'Industrial',
    nameThai: 'อุตสาหกรรม',
    flowFactors: [
      0.3, 0.3, 0.3, 0.3, 0.3, 0.5,
      0.8, 1.2, 1.4, 1.4, 1.4, 1.3,
      1.2, 1.4, 1.4, 1.4, 1.3, 1.0,
      0.6, 0.4, 0.35, 0.3, 0.3, 0.3
    ],
    bodFactors: [
      0.4, 0.4, 0.4, 0.4, 0.4, 0.6,
      0.9, 1.3, 1.5, 1.5, 1.4, 1.4,
      1.3, 1.5, 1.5, 1.4, 1.3, 1.0,
      0.7, 0.5, 0.4, 0.4, 0.4, 0.4
    ]
  },
  combined: {
    name: 'Combined',
    nameThai: 'รวม',
    flowFactors: [
      0.4, 0.35, 0.32, 0.3, 0.32, 0.5,
      0.85, 1.25, 1.4, 1.3, 1.2, 1.2,
      1.25, 1.3, 1.2, 1.15, 1.1, 1.05,
      1.0, 0.95, 0.8, 0.7, 0.55, 0.45
    ],
    bodFactors: [
      0.5, 0.45, 0.42, 0.4, 0.42, 0.6,
      0.95, 1.35, 1.5, 1.4, 1.25, 1.3,
      1.35, 1.4, 1.3, 1.2, 1.15, 1.1,
      1.1, 1.05, 0.9, 0.8, 0.65, 0.55
    ]
  }
}

// ============================================
// ANIMATED GAUGE COMPONENT
// ============================================

interface GaugeProps {
  value: number
  max: number
  label: string
  unit: string
  threshold?: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

function AnimatedGauge({ value, max, label, unit, threshold, color = '#3B82F6', size = 'md' }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100)
  const isOverThreshold = threshold !== undefined && value > threshold
  const displayColor = isOverThreshold ? '#EF4444' : color

  const sizes = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-xs' },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-sm' },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: 'text-base' }
  }
  const s = sizes[size]
  const radius = (s.width - s.strokeWidth) / 2 - 5
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (percentage / 100) * circumference * 0.75 // 270 degrees

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: s.width, height: s.height }}>
        <svg width={s.width} height={s.height} className="transform -rotate-135">
          {/* Background arc */}
          <circle
            cx={s.width / 2}
            cy={s.height / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={s.strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx={s.width / 2}
            cy={s.height / 2}
            r={radius}
            fill="none"
            stroke={displayColor}
            strokeWidth={s.strokeWidth}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${s.fontSize} ${isOverThreshold ? 'text-red-600' : 'text-gray-900'}`}>
            {value.toFixed(0)}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <span className="mt-1 text-xs font-medium text-gray-600">{label}</span>
      {threshold && (
        <span className={`text-xs ${isOverThreshold ? 'text-red-500' : 'text-gray-400'}`}>
          Limit: {threshold}
        </span>
      )}
    </div>
  )
}

// ============================================
// TIME-SERIES CHART COMPONENT
// ============================================

interface TimeSeriesChartProps {
  data: TimePoint[]
  currentHour: number
  metric: 'flow' | 'bod' | 'cod' | 'tss'
  showEffluent?: boolean
}

function TimeSeriesChart({ data, currentHour, metric, showEffluent = true }: TimeSeriesChartProps) {
  const width = 600
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const getValue = useCallback((point: TimePoint, isEffluent: boolean) => {
    switch (metric) {
      case 'flow': return point.flowRate
      case 'bod': return isEffluent ? point.effluentBOD : point.bod
      case 'cod': return isEffluent ? point.effluentCOD : point.cod
      case 'tss': return isEffluent ? point.effluentTSS : point.tss
    }
  }, [metric])

  const maxValue = useMemo(() => {
    const values = data.flatMap(d => [getValue(d, false), getValue(d, true)])
    return Math.max(...values) * 1.1
  }, [data, getValue])

  const xScale = (hour: number) => padding.left + (hour / 23) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight

  const generatePath = useCallback((isEffluent: boolean) => {
    return data.map((d, i) => {
      const x = xScale(d.hour)
      const y = yScale(getValue(d, isEffluent))
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }, [data, getValue])

  const colors = {
    flow: { influent: '#3B82F6', effluent: '#60A5FA', name: 'Flow Rate', unit: 'm³/h' },
    bod: { influent: '#EF4444', effluent: '#F87171', name: 'BOD₅', unit: 'mg/L' },
    cod: { influent: '#10B981', effluent: '#34D399', name: 'COD', unit: 'mg/L' },
    tss: { influent: '#8B5CF6', effluent: '#A78BFA', name: 'TSS', unit: 'mg/L' }
  }
  const c = colors[metric]

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-700">{c.name} ({c.unit})</h3>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5" style={{ background: c.influent }} />
            Influent
          </span>
          {showEffluent && metric !== 'flow' && (
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5" style={{ background: c.effluent }} />
              Effluent
            </span>
          )}
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={width - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="#E5E7EB"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 5}
              y={padding.top + chartHeight * (1 - ratio) + 4}
              textAnchor="end"
              className="text-xs fill-gray-400"
            >
              {Math.round(maxValue * ratio)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {[0, 6, 12, 18, 23].map(hour => (
          <text
            key={hour}
            x={xScale(hour)}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-400"
          >
            {hour.toString().padStart(2, '0')}:00
          </text>
        ))}

        {/* Influent line */}
        <path
          d={generatePath(false)}
          fill="none"
          stroke={c.influent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Effluent line */}
        {showEffluent && metric !== 'flow' && (
          <path
            d={generatePath(true)}
            fill="none"
            stroke={c.effluent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6,3"
          />
        )}

        {/* Current time indicator */}
        <line
          x1={xScale(currentHour)}
          y1={padding.top}
          x2={xScale(currentHour)}
          y2={padding.top + chartHeight}
          stroke="#F59E0B"
          strokeWidth={2}
          strokeDasharray="4,4"
        />
        <circle
          cx={xScale(currentHour)}
          cy={yScale(getValue(data[currentHour] || data[0], false))}
          r={5}
          fill={c.influent}
          stroke="white"
          strokeWidth={2}
        />
      </svg>
    </div>
  )
}

// ============================================
// PROCESS FLOW ANIMATION
// ============================================

interface ProcessFlowProps {
  system: TreatmentSystem
  currentValues: TimePoint | null
}

function ProcessFlowAnimation({ system, currentValues }: ProcessFlowProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; opacity: number }>>([])
  const animationRef = useRef<number>(0)

  useEffect(() => {
    let nextId = 0
    const interval = setInterval(() => {
      setParticles(prev => {
        // Add new particle
        const newParticles = [...prev, { id: nextId++, x: 0, opacity: 1 }]
        // Move existing particles and remove old ones
        return newParticles
          .map(p => ({ ...p, x: p.x + 3, opacity: p.x > 80 ? p.opacity - 0.1 : p.opacity }))
          .filter(p => p.opacity > 0)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center gap-2">
        {/* Influent */}
        <div className="flex flex-col items-center p-3 bg-blue-100 rounded-lg min-w-[80px]">
          <span className="text-xs font-medium text-blue-800">Influent</span>
          <span className="text-lg font-bold text-blue-900">
            {currentValues?.bod.toFixed(0) || '-'}
          </span>
          <span className="text-xs text-blue-600">mg/L BOD</span>
        </div>

        {/* Animated flow pipe */}
        <div className="relative flex-1 h-8 bg-blue-200 rounded-full overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
              style={{ left: `${p.x}%`, opacity: p.opacity }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700">
              {currentValues?.flowRate.toFixed(0) || '-'} m³/h
            </span>
          </div>
        </div>

        {/* Treatment units indicator */}
        <div className="flex items-center gap-1">
          {system.units.slice(0, 5).map((unit, i) => (
            <div
              key={unit.id}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs
                ${unit.status === 'pass' ? 'bg-emerald-100' :
                  unit.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'}`}
              title={UNIT_METADATA[unit.type].name}
            >
              {UNIT_METADATA[unit.type].icon}
            </div>
          ))}
          {system.units.length > 5 && (
            <span className="text-xs text-gray-500">+{system.units.length - 5}</span>
          )}
        </div>

        {/* Animated flow pipe */}
        <div className="relative flex-1 h-8 bg-green-200 rounded-full overflow-hidden">
          {particles.map(p => (
            <div
              key={`e-${p.id}`}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full"
              style={{ left: `${p.x}%`, opacity: p.opacity }}
            />
          ))}
        </div>

        {/* Effluent */}
        <div className="flex flex-col items-center p-3 bg-green-100 rounded-lg min-w-[80px]">
          <span className="text-xs font-medium text-green-800">Effluent</span>
          <span className="text-lg font-bold text-green-900">
            {currentValues?.effluentBOD.toFixed(0) || '-'}
          </span>
          <span className="text-xs text-green-600">mg/L BOD</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface RealTimeVisualizationProps {
  system: TreatmentSystem
  influent: WastewaterQuality
  targetStandard: ThaiEffluentType
}

export default function RealTimeVisualization({
  system,
  influent,
  targetStandard
}: RealTimeVisualizationProps) {
  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: false,
    currentHour: 0,
    speed: 1,
    data: []
  })
  const [selectedPattern, setSelectedPattern] = useState<string>('domestic')
  const [selectedMetric, setSelectedMetric] = useState<'flow' | 'bod' | 'cod' | 'tss'>('bod')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate overall system removal efficiency
  const systemEfficiency = useMemo(() => {
    if (system.units.length === 0) return { bod: 0, cod: 0, tss: 0 }
    const lastUnit = system.units[system.units.length - 1]
    return {
      bod: ((influent.bod - lastUnit.outputQuality.bod) / influent.bod) * 100,
      cod: ((influent.cod - lastUnit.outputQuality.cod) / influent.cod) * 100,
      tss: ((influent.tss - lastUnit.outputQuality.tss) / influent.tss) * 100,
    }
  }, [system, influent])

  // Generate simulation data
  const generateSimulationData = useCallback(() => {
    const pattern = DIURNAL_PATTERNS[selectedPattern]
    const baseFlow = influent.flowRate / 24 // Convert daily to hourly

    const data: TimePoint[] = []
    for (let hour = 0; hour < 24; hour++) {
      const flowFactor = pattern.flowFactors[hour]
      const bodFactor = pattern.bodFactors[hour]

      const hourlyFlow = baseFlow * flowFactor
      const hourlyBOD = influent.bod * bodFactor
      const hourlyCOD = influent.cod * bodFactor
      const hourlyTSS = influent.tss * (0.5 + flowFactor * 0.5) // TSS varies less

      data.push({
        hour,
        flowRate: hourlyFlow,
        bod: hourlyBOD,
        cod: hourlyCOD,
        tss: hourlyTSS,
        effluentBOD: hourlyBOD * (1 - systemEfficiency.bod / 100),
        effluentCOD: hourlyCOD * (1 - systemEfficiency.cod / 100),
        effluentTSS: hourlyTSS * (1 - systemEfficiency.tss / 100),
      })
    }

    return data
  }, [selectedPattern, influent, systemEfficiency])

  // Initialize simulation data
  useEffect(() => {
    setSimulation(prev => ({
      ...prev,
      data: generateSimulationData()
    }))
  }, [generateSimulationData])

  // Simulation control
  const startSimulation = useCallback(() => {
    setSimulation(prev => ({ ...prev, isRunning: true }))
  }, [])

  const pauseSimulation = useCallback(() => {
    setSimulation(prev => ({ ...prev, isRunning: false }))
  }, [])

  const resetSimulation = useCallback(() => {
    setSimulation(prev => ({
      ...prev,
      isRunning: false,
      currentHour: 0,
      data: generateSimulationData()
    }))
  }, [generateSimulationData])

  const setSpeed = useCallback((speed: number) => {
    setSimulation(prev => ({ ...prev, speed }))
  }, [])

  // Run simulation
  useEffect(() => {
    if (simulation.isRunning) {
      intervalRef.current = setInterval(() => {
        setSimulation(prev => ({
          ...prev,
          currentHour: (prev.currentHour + 1) % 24
        }))
      }, 1000 / simulation.speed)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [simulation.isRunning, simulation.speed])

  const currentValues = simulation.data[simulation.currentHour] || null
  const standards = THAI_EFFLUENT_STANDARDS[targetStandard]

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Real-Time Simulation</h2>
          <p className="text-sm text-gray-500">24-hour diurnal pattern visualization</p>
        </div>

        {/* Pattern Selector */}
        <div className="flex gap-2">
          {Object.entries(DIURNAL_PATTERNS).map(([key, pattern]) => (
            <button
              key={key}
              onClick={() => setSelectedPattern(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                selectedPattern === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {pattern.name}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
        {/* Time Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
          <span className="text-3xl font-mono font-bold text-gray-900">
            {simulation.currentHour.toString().padStart(2, '0')}:00
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {simulation.isRunning ? (
            <button
              onClick={pauseSimulation}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
            >
              ▶ Play
            </button>
          )}
          <button
            onClick={resetSimulation}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            ↻ Reset
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Speed:</span>
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 text-sm rounded-full transition ${
                simulation.speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Time Slider */}
        <div className="flex-1 px-4">
          <input
            type="range"
            min={0}
            max={23}
            value={simulation.currentHour}
            onChange={e => setSimulation(prev => ({
              ...prev,
              currentHour: parseInt(e.target.value),
              isRunning: false
            }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Process Flow Animation */}
      <ProcessFlowAnimation system={system} currentValues={currentValues} />

      {/* Live Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-white rounded-xl shadow-sm">
        <AnimatedGauge
          value={currentValues?.flowRate || 0}
          max={influent.flowRate / 24 * 2}
          label="Flow Rate"
          unit="m³/h"
          color="#3B82F6"
          size="md"
        />
        <AnimatedGauge
          value={currentValues?.bod || 0}
          max={influent.bod * 1.5}
          label="Influent BOD"
          unit="mg/L"
          color="#EF4444"
          size="md"
        />
        <AnimatedGauge
          value={currentValues?.effluentBOD || 0}
          max={100}
          label="Effluent BOD"
          unit="mg/L"
          threshold={standards.limits.bod}
          color="#10B981"
          size="md"
        />
        <AnimatedGauge
          value={currentValues?.cod || 0}
          max={influent.cod * 1.5}
          label="Influent COD"
          unit="mg/L"
          color="#F59E0B"
          size="md"
        />
        <AnimatedGauge
          value={currentValues?.effluentCOD || 0}
          max={200}
          label="Effluent COD"
          unit="mg/L"
          threshold={standards.limits.cod}
          color="#8B5CF6"
          size="md"
        />
        <AnimatedGauge
          value={currentValues?.effluentTSS || 0}
          max={100}
          label="Effluent TSS"
          unit="mg/L"
          threshold={standards.limits.tss}
          color="#06B6D4"
          size="md"
        />
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 justify-center">
        {(['flow', 'bod', 'cod', 'tss'] as const).map(m => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              selectedMetric === m
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
            }`}
          >
            {m === 'flow' ? 'Flow Rate' : m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Time-Series Chart */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TimeSeriesChart
          data={simulation.data}
          currentHour={simulation.currentHour}
          metric={selectedMetric}
          showEffluent={true}
        />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Peak Flow</h3>
          <div className="text-2xl font-bold text-blue-600">
            {Math.max(...simulation.data.map(d => d.flowRate)).toFixed(0)}
            <span className="text-sm font-normal text-gray-400 ml-1">m³/h</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            at {simulation.data.findIndex(d => d.flowRate === Math.max(...simulation.data.map(p => p.flowRate))).toString().padStart(2, '0')}:00
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Peak BOD Load</h3>
          <div className="text-2xl font-bold text-red-600">
            {Math.max(...simulation.data.map(d => d.bod * d.flowRate / 1000)).toFixed(1)}
            <span className="text-sm font-normal text-gray-400 ml-1">kg/h</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Max hourly mass loading
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Compliance Status</h3>
          <div className={`text-2xl font-bold ${
            (currentValues?.effluentBOD || 0) <= standards.limits.bod &&
            (currentValues?.effluentCOD || 0) <= standards.limits.cod &&
            (currentValues?.effluentTSS || 0) <= standards.limits.tss
              ? 'text-emerald-600'
              : 'text-red-600'
          }`}>
            {(currentValues?.effluentBOD || 0) <= standards.limits.bod &&
             (currentValues?.effluentCOD || 0) <= standards.limits.cod &&
             (currentValues?.effluentTSS || 0) <= standards.limits.tss
              ? '✓ PASS'
              : '✗ FAIL'
            }
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {targetStandard} Standard
          </div>
        </div>
      </div>
    </div>
  )
}
