'use client'

import { useState, useMemo } from 'react'
import {
  WastewaterQuality,
  TreatmentSystem,
  UNIT_METADATA,
} from '@/lib/types/wastewater-treatment'

// ============================================
// TYPES
// ============================================

interface DataPoint {
  label: string
  labelThai: string
  bod: number
  cod: number
  tss: number
}

// ============================================
// TREATMENT GRAPH COMPONENT
// ============================================

interface TreatmentGraphProps {
  system: TreatmentSystem
  influent: WastewaterQuality
}

export function TreatmentGraph({ system, influent }: TreatmentGraphProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'bod' | 'cod' | 'tss'>('all')

  // Build data points
  const dataPoints: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [
      { label: 'Influent', labelThai: 'น้ำเข้า', bod: influent.bod, cod: influent.cod, tss: influent.tss }
    ]

    system.units.forEach(unit => {
      const meta = UNIT_METADATA[unit.type]
      points.push({
        label: meta.name,
        labelThai: meta.nameThai,
        bod: unit.outputQuality.bod,
        cod: unit.outputQuality.cod,
        tss: unit.outputQuality.tss
      })
    })

    return points
  }, [system, influent])

  // Chart dimensions
  const width = 700
  const height = 300
  const padding = { top: 40, right: 30, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Scales
  const maxValue = Math.max(
    ...dataPoints.map(d => Math.max(d.bod, d.cod, d.tss))
  ) * 1.1

  const xScale = (index: number) => padding.left + (index / (dataPoints.length - 1)) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight

  // Line generator
  const generatePath = (metric: 'bod' | 'cod' | 'tss') => {
    return dataPoints.map((d, i) => {
      const x = xScale(i)
      const y = yScale(d[metric])
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  // Area generator (for gradient fill)
  const generateArea = (metric: 'bod' | 'cod' | 'tss') => {
    const linePath = dataPoints.map((d, i) => {
      const x = xScale(i)
      const y = yScale(d[metric])
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    return `${linePath} L ${xScale(dataPoints.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`
  }

  const metrics = {
    bod: { color: '#3B82F6', name: 'BOD₅', gradient: 'bodGradient' },
    cod: { color: '#10B981', name: 'COD', gradient: 'codGradient' },
    tss: { color: '#8B5CF6', name: 'TSS', gradient: 'tssGradient' }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700">Treatment Performance Graph</h2>
        <div className="flex gap-2">
          {(['all', 'bod', 'cod', 'tss'] as const).map(m => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                selectedMetric === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m === 'all' ? 'All' : metrics[m].name}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          <defs>
            <linearGradient id="bodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="codGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="tssGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={padding.top + chartHeight * (1 - ratio)}
                x2={width - padding.right}
                y2={padding.top + chartHeight * (1 - ratio)}
                stroke="#E5E7EB"
                strokeDasharray={ratio === 0 ? "none" : "4,4"}
              />
              <text
                x={padding.left - 10}
                y={padding.top + chartHeight * (1 - ratio) + 4}
                textAnchor="end"
                className="text-xs fill-gray-400"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={15}
            y={height / 2}
            transform={`rotate(-90, 15, ${height / 2})`}
            textAnchor="middle"
            className="text-xs fill-gray-500 font-medium"
          >
            Concentration (mg/L)
          </text>

          {/* Area fills */}
          {(selectedMetric === 'all' || selectedMetric === 'bod') && (
            <path d={generateArea('bod')} fill="url(#bodGradient)" />
          )}
          {(selectedMetric === 'all' || selectedMetric === 'cod') && (
            <path d={generateArea('cod')} fill="url(#codGradient)" />
          )}
          {(selectedMetric === 'all' || selectedMetric === 'tss') && (
            <path d={generateArea('tss')} fill="url(#tssGradient)" />
          )}

          {/* Lines */}
          {(selectedMetric === 'all' || selectedMetric === 'bod') && (
            <path d={generatePath('bod')} fill="none" stroke={metrics.bod.color} strokeWidth="2.5" />
          )}
          {(selectedMetric === 'all' || selectedMetric === 'cod') && (
            <path d={generatePath('cod')} fill="none" stroke={metrics.cod.color} strokeWidth="2.5" />
          )}
          {(selectedMetric === 'all' || selectedMetric === 'tss') && (
            <path d={generatePath('tss')} fill="none" stroke={metrics.tss.color} strokeWidth="2.5" />
          )}

          {/* Data points */}
          {dataPoints.map((d, i) => (
            <g key={i}>
              {(selectedMetric === 'all' || selectedMetric === 'bod') && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.bod)}
                  r={hoveredPoint === i ? 6 : 4}
                  fill={metrics.bod.color}
                  className="transition-all duration-150"
                />
              )}
              {(selectedMetric === 'all' || selectedMetric === 'cod') && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.cod)}
                  r={hoveredPoint === i ? 6 : 4}
                  fill={metrics.cod.color}
                  className="transition-all duration-150"
                />
              )}
              {(selectedMetric === 'all' || selectedMetric === 'tss') && (
                <circle
                  cx={xScale(i)}
                  cy={yScale(d.tss)}
                  r={hoveredPoint === i ? 6 : 4}
                  fill={metrics.tss.color}
                  className="transition-all duration-150"
                />
              )}

              {/* Hover area */}
              <rect
                x={xScale(i) - 30}
                y={padding.top}
                width={60}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              />

              {/* X-axis labels */}
              <text
                x={xScale(i)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-medium"
              >
                {d.label.length > 10 ? d.label.substring(0, 10) + '...' : d.label}
              </text>
              <text
                x={xScale(i)}
                y={height - padding.bottom + 35}
                textAnchor="middle"
                className="text-[10px] fill-gray-400"
              >
                {d.labelThai}
              </text>

              {/* Vertical indicator line on hover */}
              {hoveredPoint === i && (
                <line
                  x1={xScale(i)}
                  y1={padding.top}
                  x2={xScale(i)}
                  y2={padding.top + chartHeight}
                  stroke="#9CA3AF"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              )}
            </g>
          ))}

          {/* Tooltip */}
          {hoveredPoint !== null && (
            <g transform={`translate(${Math.min(xScale(hoveredPoint), width - 140)}, ${padding.top - 5})`}>
              <rect
                x={-5}
                y={-35}
                width={130}
                height={75}
                rx={6}
                fill="white"
                stroke="#E5E7EB"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
              />
              <text x={5} y={-15} className="text-xs fill-gray-700 font-bold">
                {dataPoints[hoveredPoint].label}
              </text>
              <text x={5} y={5} className="text-xs fill-blue-600">
                BOD: {dataPoints[hoveredPoint].bod.toFixed(1)} mg/L
              </text>
              <text x={5} y={20} className="text-xs fill-emerald-600">
                COD: {dataPoints[hoveredPoint].cod.toFixed(1)} mg/L
              </text>
              <text x={5} y={35} className="text-xs fill-purple-600">
                TSS: {dataPoints[hoveredPoint].tss.toFixed(1)} mg/L
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {Object.entries(metrics).map(([key, { color, name }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
