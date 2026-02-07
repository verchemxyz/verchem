'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Flame,
  Skull,
  Droplets,
  Wind,
  Eye,
  Pill,
  Thermometer,
  BookOpen,
} from 'lucide-react'
import {
  GHS_PICTOGRAMS,
  COMPATIBILITY_GROUPS,
  EMERGENCY_PROCEDURES,
  SAFETY_RULES,
  SIGNAL_WORDS,
  H_STATEMENTS,
  P_STATEMENTS,
  checkCompatibility,
  searchSafety,
  getSafetyCategoryLabel,
  getPStatementCategoryLabel,
} from '@/lib/data/lab-safety'
import type {
  GHSPictogram,
  EmergencyProcedure,
  SafetyRule,
  HStatement,
  PStatement,
  CompatibilityResult,
} from '@/lib/data/lab-safety'

// =============================================================================
// Tab Type
// =============================================================================

type TabId = 'pictograms' | 'compatibility' | 'emergency' | 'rules' | 'statements'

interface Tab {
  id: TabId
  label: string
  shortLabel: string
  icon: React.ReactNode
}

const TABS: Tab[] = [
  { id: 'pictograms', label: 'GHS Pictograms', shortLabel: 'GHS', icon: <AlertTriangle className="h-4 w-4" /> },
  { id: 'compatibility', label: 'Chemical Compatibility', shortLabel: 'Compat', icon: <Shield className="h-4 w-4" /> },
  { id: 'emergency', label: 'Emergency Procedures', shortLabel: 'Emergency', icon: <Flame className="h-4 w-4" /> },
  { id: 'rules', label: 'Safety Rules', shortLabel: 'Rules', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'statements', label: 'H/P Statements', shortLabel: 'H/P', icon: <Info className="h-4 w-4" /> },
]

// =============================================================================
// GHS Pictogram SVG Symbols
// =============================================================================

function GHSSymbol({ code, size = 64 }: { code: string; size?: number }) {
  const s = size
  const half = s / 2
  const pad = s * 0.12
  const inner = s - pad * 2

  // Red diamond border
  const diamondPoints = `${half},${pad} ${s - pad},${half} ${half},${s - pad} ${pad},${half}`

  const symbolContent: Record<string, React.ReactNode> = {
    GHS01: (
      // Exploding bomb
      <g>
        <circle cx={half} cy={half * 0.85} r={s * 0.13} fill="#1a1a1a" />
        <line x1={half} y1={half * 0.72} x2={half + s * 0.06} y2={half * 0.5} stroke="#1a1a1a" strokeWidth={s * 0.03} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const cx = half + Math.cos(rad) * s * 0.28
          const cy = half * 0.85 + Math.sin(rad) * s * 0.28
          const ex = half + Math.cos(rad) * s * 0.38
          const ey = half * 0.85 + Math.sin(rad) * s * 0.38
          return <line key={angle} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#1a1a1a" strokeWidth={s * 0.025} />
        })}
      </g>
    ),
    GHS02: (
      // Flame
      <path
        d={`M${half},${half * 0.45} C${half - s * 0.08},${half * 0.7} ${half - s * 0.22},${half * 0.85} ${half - s * 0.22},${half * 1.15} C${half - s * 0.22},${half * 1.45} ${half - s * 0.08},${half * 1.55} ${half},${half * 1.55} C${half + s * 0.08},${half * 1.55} ${half + s * 0.22},${half * 1.45} ${half + s * 0.22},${half * 1.15} C${half + s * 0.22},${half * 0.85} ${half + s * 0.08},${half * 0.7} ${half},${half * 0.45}Z`}
        fill="#1a1a1a"
      />
    ),
    GHS03: (
      // Flame over circle
      <g>
        <circle cx={half} cy={half * 1.2} r={s * 0.16} fill="none" stroke="#1a1a1a" strokeWidth={s * 0.035} />
        <path
          d={`M${half},${half * 0.5} C${half - s * 0.06},${half * 0.65} ${half - s * 0.15},${half * 0.75} ${half - s * 0.15},${half * 0.95} C${half - s * 0.15},${half * 1.1} ${half - s * 0.06},${half * 1.15} ${half},${half * 1.15} C${half + s * 0.06},${half * 1.15} ${half + s * 0.15},${half * 1.1} ${half + s * 0.15},${half * 0.95} C${half + s * 0.15},${half * 0.75} ${half + s * 0.06},${half * 0.65} ${half},${half * 0.5}Z`}
          fill="#1a1a1a"
        />
      </g>
    ),
    GHS04: (
      // Gas cylinder
      <rect x={half - s * 0.1} y={half * 0.55} width={s * 0.2} height={s * 0.5} rx={s * 0.06} fill="#1a1a1a" />
    ),
    GHS05: (
      // Corrosion - dripping on hand/metal
      <g>
        <path d={`M${half - s * 0.12},${half * 0.55} L${half + s * 0.06},${half * 0.55} L${half + s * 0.06},${half * 0.75} L${half - s * 0.02},${half * 1.1} L${half - s * 0.12},${half * 0.75}Z`} fill="#1a1a1a" />
        <path d={`M${half - s * 0.02},${half * 1.15} Q${half + s * 0.03},${half * 1.3} ${half - s * 0.05},${half * 1.45} L${half + s * 0.08},${half * 1.45} Q${half + s * 0.12},${half * 1.2} ${half + s * 0.02},${half * 1.1}Z`} fill="#1a1a1a" />
      </g>
    ),
    GHS06: (
      // Skull and crossbones
      <g>
        <circle cx={half} cy={half * 0.82} r={s * 0.15} fill="none" stroke="#1a1a1a" strokeWidth={s * 0.03} />
        <circle cx={half - s * 0.06} cy={half * 0.78} r={s * 0.035} fill="#1a1a1a" />
        <circle cx={half + s * 0.06} cy={half * 0.78} r={s * 0.035} fill="#1a1a1a" />
        <path d={`M${half - s * 0.04},${half * 0.92} Q${half},${half * 0.98} ${half + s * 0.04},${half * 0.92}`} fill="none" stroke="#1a1a1a" strokeWidth={s * 0.02} />
        <line x1={half - s * 0.18} y1={half * 1.2} x2={half + s * 0.18} y2={half * 1.35} stroke="#1a1a1a" strokeWidth={s * 0.04} strokeLinecap="round" />
        <line x1={half + s * 0.18} y1={half * 1.2} x2={half - s * 0.18} y2={half * 1.35} stroke="#1a1a1a" strokeWidth={s * 0.04} strokeLinecap="round" />
      </g>
    ),
    GHS07: (
      // Exclamation mark
      <g>
        <rect x={half - s * 0.035} y={half * 0.55} width={s * 0.07} height={s * 0.38} rx={s * 0.02} fill="#1a1a1a" />
        <circle cx={half} cy={half * 1.35} r={s * 0.045} fill="#1a1a1a" />
      </g>
    ),
    GHS08: (
      // Health hazard (person silhouette with star)
      <g>
        <circle cx={half} cy={half * 0.62} r={s * 0.08} fill="#1a1a1a" />
        <path d={`M${half - s * 0.12},${half * 0.8} L${half + s * 0.12},${half * 0.8} L${half + s * 0.14},${half * 1.5} L${half + s * 0.04},${half * 1.5} L${half},${half * 1.25} L${half - s * 0.04},${half * 1.5} L${half - s * 0.14},${half * 1.5}Z`} fill="#1a1a1a" />
        {/* Star/damage symbol on chest */}
        <polygon points={`${half},${half * 0.85} ${half + s * 0.025},${half * 0.95} ${half + s * 0.06},${half * 0.95} ${half + s * 0.03},${half * 1.02} ${half + s * 0.04},${half * 1.1} ${half},${half * 1.05} ${half - s * 0.04},${half * 1.1} ${half - s * 0.03},${half * 1.02} ${half - s * 0.06},${half * 0.95} ${half - s * 0.025},${half * 0.95}`} fill="white" />
      </g>
    ),
    GHS09: (
      // Environment - dead tree and fish
      <g>
        <line x1={half - s * 0.05} y1={half * 0.5} x2={half - s * 0.05} y2={half * 1.15} stroke="#1a1a1a" strokeWidth={s * 0.03} />
        <line x1={half - s * 0.05} y1={half * 0.65} x2={half - s * 0.16} y2={half * 0.5} stroke="#1a1a1a" strokeWidth={s * 0.02} />
        <line x1={half - s * 0.05} y1={half * 0.8} x2={half + s * 0.06} y2={half * 0.62} stroke="#1a1a1a" strokeWidth={s * 0.02} />
        <ellipse cx={half + s * 0.05} cy={half * 1.3} rx={s * 0.14} ry={s * 0.06} fill="#1a1a1a" />
        <circle cx={half + s * 0.13} cy={half * 1.27} r={s * 0.02} fill="white" />
      </g>
    ),
  }

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} xmlns="http://www.w3.org/2000/svg" aria-label={`GHS pictogram: ${code}`}>
      {/* White diamond background */}
      <polygon points={diamondPoints} fill="white" stroke="#dc2626" strokeWidth={s * 0.035} />
      {/* Inner red border */}
      <polygon
        points={`${half},${pad + inner * 0.06} ${s - pad - inner * 0.06},${half} ${half},${s - pad - inner * 0.06} ${pad + inner * 0.06},${half}`}
        fill="white"
        stroke="#dc2626"
        strokeWidth={s * 0.015}
      />
      {symbolContent[code] || null}
    </svg>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function GHSPictogramsSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">GHS Hazard Pictograms</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          The Globally Harmonized System (GHS) uses 9 standardized pictograms to communicate chemical hazards worldwide.
          Click any pictogram to learn more about the hazards it represents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GHS_PICTOGRAMS.map((pictogram) => {
          const isExpanded = expandedId === pictogram.id
          return (
            <div key={pictogram.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-red-500/30">
              <button
                onClick={() => toggle(pictogram.id)}
                className="w-full p-5 text-left flex items-center gap-4"
                aria-expanded={isExpanded}
                aria-controls={`ghs-detail-${pictogram.id}`}
              >
                <div className="flex-shrink-0">
                  <GHSSymbol code={pictogram.code} size={56} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">{pictogram.code}</span>
                  </div>
                  <h3 className="text-white font-semibold truncate">{pictogram.name}</h3>
                  <p className="text-sm text-slate-400 truncate">{pictogram.hazards[0]}</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div id={`ghs-detail-${pictogram.id}`} className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wider">Hazards</h4>
                    <ul className="space-y-1">
                      {pictogram.hazards.map((h, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-wider">Examples</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {pictogram.examples.map((ex, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wider">Precautions</h4>
                    <ul className="space-y-1">
                      {pictogram.precautions.map((p, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CompatibilitySection() {
  const [selectedGroup1, setSelectedGroup1] = useState<string>('')
  const [selectedGroup2, setSelectedGroup2] = useState<string>('')
  const [showMatrix, setShowMatrix] = useState(true)

  const pairResult: CompatibilityResult | null = useMemo(() => {
    if (!selectedGroup1 || !selectedGroup2) return null
    return checkCompatibility(selectedGroup1, selectedGroup2)
  }, [selectedGroup1, selectedGroup2])

  const groupName = useCallback((id: string) => {
    return COMPATIBILITY_GROUPS.find((g) => g.id === id)?.name ?? id
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Chemical Compatibility</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Incompatible chemicals must never be stored together. Use this interactive chart to check which chemical groups are safe to co-locate.
        </p>
      </div>

      {/* Pair checker */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Compatibility Check</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Chemical Group 1</label>
            <select
              value={selectedGroup1}
              onChange={(e) => setSelectedGroup1(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white appearance-none cursor-pointer focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="" className="bg-slate-900">Select a group...</option>
              {COMPATIBILITY_GROUPS.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Chemical Group 2</label>
            <select
              value={selectedGroup2}
              onChange={(e) => setSelectedGroup2(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white appearance-none cursor-pointer focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="" className="bg-slate-900">Select a group...</option>
              {COMPATIBILITY_GROUPS.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {pairResult && (
          <div className={`mt-4 rounded-xl p-4 border ${
            pairResult.severity === 'safe'
              ? 'border-green-500/30 bg-green-500/10'
              : pairResult.severity === 'caution'
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-red-500/30 bg-red-500/10'
          } animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="flex items-center gap-3 mb-2">
              {pairResult.severity === 'safe' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : pairResult.severity === 'caution' ? (
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span className={`font-semibold ${
                pairResult.severity === 'safe' ? 'text-green-300' : pairResult.severity === 'caution' ? 'text-amber-300' : 'text-red-300'
              }`}>
                {pairResult.severity === 'safe' ? 'Compatible' : pairResult.severity === 'caution' ? 'Use Caution' : 'INCOMPATIBLE - Do Not Store Together'}
              </span>
            </div>
            <p className="text-sm text-slate-300">{pairResult.reason}</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowMatrix((prev) => !prev)}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          {showMatrix ? 'Hide' : 'Show'} Full Compatibility Matrix
          <ChevronDown className={`h-4 w-4 transition-transform ${showMatrix ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Matrix */}
      {showMatrix && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-400 font-medium sticky left-0 bg-slate-900/90 z-10 min-w-[130px]">Group</th>
                {COMPATIBILITY_GROUPS.map((g) => (
                  <th key={g.id} className="p-1 text-center">
                    <div
                      className="writing-mode-vertical text-slate-400 font-medium transform -rotate-45 origin-bottom-left whitespace-nowrap translate-x-2"
                      style={{ writingMode: 'initial' }}
                      title={g.name}
                    >
                      {g.name.length > 14 ? g.name.substring(0, 12) + '..' : g.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPATIBILITY_GROUPS.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="p-2 text-slate-300 font-medium sticky left-0 bg-slate-900/90 z-10 whitespace-nowrap">{row.name}</td>
                  {COMPATIBILITY_GROUPS.map((col) => {
                    const result = checkCompatibility(row.id, col.id)
                    const bgColor =
                      row.id === col.id
                        ? 'bg-slate-700/50'
                        : result.severity === 'safe'
                          ? 'bg-green-500/20'
                          : result.severity === 'caution'
                            ? 'bg-amber-500/20'
                            : 'bg-red-500/30'
                    const label =
                      row.id === col.id
                        ? '-'
                        : result.severity === 'safe'
                          ? 'OK'
                          : result.severity === 'caution'
                            ? '?'
                            : 'X'
                    const textColor =
                      row.id === col.id
                        ? 'text-slate-500'
                        : result.severity === 'safe'
                          ? 'text-green-400'
                          : result.severity === 'caution'
                            ? 'text-amber-400'
                            : 'text-red-400'
                    return (
                      <td
                        key={col.id}
                        className={`p-1.5 text-center font-bold ${bgColor} ${textColor} cursor-default`}
                        title={row.id === col.id ? 'Same group' : `${groupName(row.id)} + ${groupName(col.id)}: ${result.reason}`}
                      >
                        {label}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-6 mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
              OK = Compatible
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30" />
              ? = Use Caution
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500/30 border border-red-500/30" />
              X = Incompatible
            </span>
          </div>
        </div>
      )}

      {/* Group details */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPATIBILITY_GROUPS.map((group) => (
          <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
              <h4 className="text-sm font-semibold text-white">{group.name}</h4>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {group.examples.slice(0, 3).map((ex, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{ex}</span>
              ))}
              {group.examples.length > 3 && (
                <span className="text-xs px-1.5 py-0.5 text-slate-500">+{group.examples.length - 3} more</span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{group.reason}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function getEmergencyIcon(procedure: EmergencyProcedure): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    spill: <Droplets className="h-5 w-5" />,
    fire: <Flame className="h-5 w-5" />,
    exposure: <Shield className="h-5 w-5" />,
    eye_contact: <Eye className="h-5 w-5" />,
    ingestion: <Pill className="h-5 w-5" />,
    inhalation: <Wind className="h-5 w-5" />,
    thermal_burn: <Thermometer className="h-5 w-5" />,
  }
  return iconMap[procedure.type] || <AlertTriangle className="h-5 w-5" />
}

function EmergencySection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Emergency Procedures</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Know these procedures before you need them. In an emergency, seconds count. Review these steps regularly.
        </p>
      </div>

      {/* Emergency banner */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-red-300 font-semibold">Emergency Numbers</h3>
          <p className="text-sm text-slate-300">
            <span className="font-mono text-red-300">911</span> (US Emergency) &bull;{' '}
            <span className="font-mono text-red-300">1-800-222-1222</span> (US Poison Control) &bull;{' '}
            <span className="font-mono text-red-300">1669</span> (Thailand Emergency)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {EMERGENCY_PROCEDURES.map((procedure) => {
          const isExpanded = expandedId === procedure.id
          return (
            <div key={procedure.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-orange-500/30">
              <button
                onClick={() => toggle(procedure.id)}
                className="w-full p-5 text-left flex items-center gap-4"
                aria-expanded={isExpanded}
                aria-controls={`emergency-detail-${procedure.id}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  procedure.callEmergency ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {getEmergencyIcon(procedure)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-semibold">{procedure.title}</h3>
                    {procedure.callEmergency && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 whitespace-nowrap">
                        Call 911
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {procedure.steps.length} steps &bull; {procedure.doNot.length} warnings
                  </p>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div id={`emergency-detail-${procedure.id}`} className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Steps to Follow
                    </h4>
                    <ol className="space-y-2">
                      {procedure.steps.map((step, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Do NOT
                    </h4>
                    <ul className="space-y-2">
                      {procedure.doNot.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SafetyRulesSection() {
  const [selectedCategory, setSelectedCategory] = useState<SafetyRule['category'] | 'all'>('all')

  const categories: Array<{ id: SafetyRule['category'] | 'all'; label: string }> = [
    { id: 'all', label: 'All Rules' },
    { id: 'ppe', label: 'PPE' },
    { id: 'chemical_handling', label: 'Chemical Handling' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'waste_disposal', label: 'Waste Disposal' },
    { id: 'general', label: 'General' },
  ]

  const filteredRules = useMemo(() => {
    if (selectedCategory === 'all') return SAFETY_RULES
    return SAFETY_RULES.filter((r) => r.category === selectedCategory)
  }, [selectedCategory])

  const [expandedRule, setExpandedRule] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Lab Safety Rules</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Essential rules every laboratory worker must know and follow. These rules save lives and prevent injuries.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRule === rule.id
          return (
            <div key={rule.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                className="w-full p-4 text-left flex items-start gap-3"
                aria-expanded={isExpanded}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{rule.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 capitalize">
                      {getSafetyCategoryLabel(rule.category)}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm leading-relaxed">{rule.rule}</p>
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-500 mt-1 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pl-14 animate-in fade-in duration-200">
                  <p className="text-sm text-slate-400 leading-relaxed">{rule.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatementsSection() {
  const [stmtTab, setStmtTab] = useState<'h' | 'p'>('h')
  const [searchQuery, setSearchQuery] = useState('')
  const [hCategoryFilter, setHCategoryFilter] = useState<HStatement['category'] | 'all'>('all')
  const [pCategoryFilter, setPCategoryFilter] = useState<PStatement['category'] | 'all'>('all')

  const filteredH = useMemo(() => {
    let items = H_STATEMENTS
    if (hCategoryFilter !== 'all') {
      items = items.filter((h) => h.category === hCategoryFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter((h) => h.code.toLowerCase().includes(q) || h.text.toLowerCase().includes(q))
    }
    return items
  }, [hCategoryFilter, searchQuery])

  const filteredP = useMemo(() => {
    let items = P_STATEMENTS
    if (pCategoryFilter !== 'all') {
      items = items.filter((p) => p.category === pCategoryFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter((p) => p.code.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
    }
    return items
  }, [pCategoryFilter, searchQuery])

  const hCategories: Array<{ id: HStatement['category'] | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'physical', label: 'Physical (H200s)' },
    { id: 'health', label: 'Health (H300s)' },
    { id: 'environmental', label: 'Environmental (H400s)' },
  ]

  const pCategories: Array<{ id: PStatement['category'] | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General (P100s)' },
    { id: 'prevention', label: 'Prevention (P200s)' },
    { id: 'response', label: 'Response (P300s)' },
    { id: 'storage', label: 'Storage (P400s)' },
    { id: 'disposal', label: 'Disposal (P500s)' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Hazard & Precautionary Statements</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          H-statements describe the nature and severity of a hazard. P-statements recommend measures to minimize exposure and risk.
        </p>
      </div>

      {/* Signal Words */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-black text-red-400 uppercase tracking-widest">DANGER</span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{SIGNAL_WORDS.Danger.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {SIGNAL_WORDS.Danger.examples.map((ex, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-200">{ex}</span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-black text-amber-400 uppercase tracking-widest">WARNING</span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{SIGNAL_WORDS.Warning.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {SIGNAL_WORDS.Warning.examples.map((ex, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">{ex}</span>
            ))}
          </div>
        </div>
      </div>

      {/* H / P tab toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => { setStmtTab('h'); setSearchQuery('') }}
          className={`rounded-xl px-6 py-2.5 font-medium transition-all ${
            stmtTab === 'h' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          H-Statements ({H_STATEMENTS.length})
        </button>
        <button
          onClick={() => { setStmtTab('p'); setSearchQuery('') }}
          className={`rounded-xl px-6 py-2.5 font-medium transition-all ${
            stmtTab === 'p' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          P-Statements ({P_STATEMENTS.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${stmtTab === 'h' ? 'H' : 'P'}-statements (e.g., "${stmtTab === 'h' ? 'H225' : 'P210'}" or "flammable")`}
          className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
      </div>

      {/* H-Statements */}
      {stmtTab === 'h' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {hCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setHCategoryFilter(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  hCategoryFilter === cat.id
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-slate-400 font-medium w-20">Code</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Statement</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium w-24">Signal</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium w-28 hidden sm:table-cell">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredH.map((h) => (
                    <tr key={h.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-amber-300 font-semibold">{h.code}</td>
                      <td className="px-4 py-3 text-slate-300">{h.text}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          h.signalWord === 'Danger' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {h.signalWord}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs capitalize px-2 py-0.5 rounded ${
                          h.category === 'physical' ? 'bg-orange-500/10 text-orange-300' :
                          h.category === 'health' ? 'bg-purple-500/10 text-purple-300' :
                          'bg-green-500/10 text-green-300'
                        }`}>
                          {h.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredH.length === 0 && (
                <div className="p-8 text-center text-slate-500">No matching H-statements found.</div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Showing {filteredH.length} of {H_STATEMENTS.length} H-statements</p>
        </div>
      )}

      {/* P-Statements */}
      {stmtTab === 'p' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {pCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setPCategoryFilter(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  pCategoryFilter === cat.id
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-slate-400 font-medium w-20">Code</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium">Statement</th>
                    <th className="px-4 py-3 text-left text-slate-400 font-medium w-28 hidden sm:table-cell">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredP.map((p) => (
                    <tr key={p.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-300 font-semibold">{p.code}</td>
                      <td className="px-4 py-3 text-slate-300">{p.text}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs capitalize px-2 py-0.5 rounded ${
                          p.category === 'general' ? 'bg-slate-500/10 text-slate-300' :
                          p.category === 'prevention' ? 'bg-blue-500/10 text-blue-300' :
                          p.category === 'response' ? 'bg-orange-500/10 text-orange-300' :
                          p.category === 'storage' ? 'bg-purple-500/10 text-purple-300' :
                          'bg-green-500/10 text-green-300'
                        }`}>
                          {getPStatementCategoryLabel(p.category)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredP.length === 0 && (
                <div className="p-8 text-center text-slate-500">No matching P-statements found.</div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Showing {filteredP.length} of {P_STATEMENTS.length} P-statements</p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function LabSafetyPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pictograms')
  const [globalSearch, setGlobalSearch] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return null
    return searchSafety(globalSearch)
  }, [globalSearch])

  const totalResults = useMemo(() => {
    if (!searchResults) return 0
    return (
      searchResults.pictograms.length +
      searchResults.compatibilityGroups.length +
      searchResults.emergencyProcedures.length +
      searchResults.safetyRules.length +
      searchResults.hStatements.length +
      searchResults.pStatements.length
    )
  }, [searchResults])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/10 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">VerChem</span>
            </h1>
          </Link>
          <Link href="/tools" className="text-slate-400 hover:text-red-400 transition-colors font-medium text-sm">
            &larr; All Tools
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 mb-6">
              <Shield className="h-4 w-4" />
              Comprehensive Lab Safety Reference
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Lab Safety
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-400">
                & SDS Reference
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              GHS pictograms, chemical compatibility, emergency procedures, safety rules, and H/P statement lookup &mdash; everything you need in one place.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                9 GHS Pictograms
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                11 Compatibility Groups
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                8 Emergency Procedures
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                {H_STATEMENTS.length + P_STATEMENTS.length}+ H/P Statements
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Global Search */}
      <section className="px-4 pb-6">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value)
              setShowSearchResults(e.target.value.trim().length > 0)
            }}
            placeholder="Search all safety data (e.g., &quot;flammable&quot;, &quot;H225&quot;, &quot;eye contact&quot;, &quot;NaOH&quot;)..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-lg"
          />
          {globalSearch && (
            <button
              onClick={() => { setGlobalSearch(''); setShowSearchResults(false) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      {/* Search Results */}
      {showSearchResults && searchResults && (
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{globalSearch}&rdquo;
              </h3>

              {totalResults === 0 && (
                <p className="text-slate-400">No results found. Try a different search term.</p>
              )}

              {searchResults.pictograms.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wider">GHS Pictograms ({searchResults.pictograms.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.pictograms.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setActiveTab('pictograms'); setShowSearchResults(false); setGlobalSearch('') }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 text-sm hover:bg-red-500/20 transition-colors"
                      >
                        <span className="font-mono text-xs">{p.code}</span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.emergencyProcedures.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2 uppercase tracking-wider">Emergency Procedures ({searchResults.emergencyProcedures.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.emergencyProcedures.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setActiveTab('emergency'); setShowSearchResults(false); setGlobalSearch('') }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-300 text-sm hover:bg-orange-500/20 transition-colors"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.safetyRules.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Safety Rules ({searchResults.safetyRules.length})</h4>
                  <ul className="space-y-1">
                    {searchResults.safetyRules.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => { setActiveTab('rules'); setShowSearchResults(false); setGlobalSearch('') }}
                          className="text-sm text-slate-300 hover:text-white text-left transition-colors"
                        >
                          <span className="mr-2">{r.icon}</span>
                          {r.rule}
                        </button>
                      </li>
                    ))}
                    {searchResults.safetyRules.length > 5 && (
                      <li className="text-sm text-slate-500">+{searchResults.safetyRules.length - 5} more...</li>
                    )}
                  </ul>
                </div>
              )}

              {searchResults.hStatements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2 uppercase tracking-wider">H-Statements ({searchResults.hStatements.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResults.hStatements.slice(0, 10).map((h) => (
                      <button
                        key={h.code}
                        onClick={() => { setActiveTab('statements'); setShowSearchResults(false); setGlobalSearch('') }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
                      >
                        <span className="font-mono font-semibold">{h.code}</span>
                        <span className="text-slate-400">{h.text.length > 40 ? h.text.substring(0, 37) + '...' : h.text}</span>
                      </button>
                    ))}
                    {searchResults.hStatements.length > 10 && (
                      <span className="text-xs text-slate-500 self-center">+{searchResults.hStatements.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {searchResults.pStatements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">P-Statements ({searchResults.pStatements.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResults.pStatements.slice(0, 10).map((p) => (
                      <button
                        key={p.code}
                        onClick={() => { setActiveTab('statements'); setShowSearchResults(false); setGlobalSearch('') }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-xs hover:bg-blue-500/20 transition-colors"
                      >
                        <span className="font-mono font-semibold">{p.code}</span>
                        <span className="text-slate-400">{p.text.length > 40 ? p.text.substring(0, 37) + '...' : p.text}</span>
                      </button>
                    ))}
                    {searchResults.pStatements.length > 10 && (
                      <span className="text-xs text-slate-500 self-center">+{searchResults.pStatements.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {searchResults.compatibilityGroups.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wider">Compatibility Groups ({searchResults.compatibilityGroups.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.compatibilityGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => { setActiveTab('compatibility'); setShowSearchResults(false); setGlobalSearch('') }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-300 text-sm hover:bg-green-500/20 transition-colors"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      {!showSearchResults && (
        <>
          <section className="px-4 pb-4 sticky top-[73px] z-30 bg-gradient-to-b from-slate-950 to-transparent pt-2">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/20'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Tab Content */}
          <section className="px-4 pb-16">
            <div className="max-w-6xl mx-auto">
              {activeTab === 'pictograms' && <GHSPictogramsSection />}
              {activeTab === 'compatibility' && <CompatibilitySection />}
              {activeTab === 'emergency' && <EmergencySection />}
              {activeTab === 'rules' && <SafetyRulesSection />}
              {activeTab === 'statements' && <StatementsSection />}
            </div>
          </section>
        </>
      )}

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Explore More Chemistry Tools
          </h2>
          <p className="text-slate-400 mb-8">
            VerChem offers a complete suite of chemistry calculators, environmental tools, and educational resources.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/tools/equation-balancer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Equation Balancer
              <ArrowRight className="h-4 w-4" />
            </Link>
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
              href="/periodic-table"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 font-medium text-white hover:from-red-500 hover:to-orange-500 transition-colors"
            >
              Interactive Periodic Table
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            This safety reference is for educational purposes. Always consult official Safety Data Sheets (SDS) and your institution&apos;s
            safety protocols before handling chemicals. GHS classifications follow the United Nations&apos; Globally Harmonized System of
            Classification and Labelling of Chemicals (Rev. 10, 2023).
          </p>
        </div>
      </footer>
    </div>
  )
}
