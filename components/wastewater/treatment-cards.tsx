'use client'

import {
  WastewaterQuality,
  TreatmentUnit,
  TreatmentSystem,
  UnitStatus,
  UNIT_METADATA,
  DEFAULT_INFLUENT,
  THAI_EFFLUENT_STANDARDS,
  ThaiEffluentType,
} from '@/lib/types/wastewater-treatment'

// ============================================
// STATUS BADGE COMPONENT
// ============================================

export function StatusBadge({ status }: { status: UnitStatus }) {
  const config = {
    pass: { bg: 'bg-emerald-500', text: 'text-white', label: 'PASS', icon: '✓' },
    warning: { bg: 'bg-amber-500', text: 'text-white', label: 'WARNING', icon: '!' },
    fail: { bg: 'bg-red-500', text: 'text-white', label: 'FAIL', icon: '✗' },
    not_configured: { bg: 'bg-gray-400', text: 'text-white', label: 'N/A', icon: '?' },
  }
  const c = config[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${c.bg} ${c.text}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  )
}

// ============================================
// FLOW ARROW COMPONENT
// ============================================

export function FlowArrow({ animated = true }: { animated?: boolean }) {
  return (
    <div className="flex items-center justify-center w-12 h-full" aria-hidden="true">
      <div className="relative">
        {/* Pipe */}
        <div className="w-12 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full relative overflow-hidden">
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-flow" />
          )}
        </div>
        {/* Arrow head */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1">
          <div className="w-0 h-0 border-l-[8px] border-l-blue-500 border-y-[6px] border-y-transparent" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// UNIT CARD COMPONENT
// ============================================

interface UnitCardProps {
  unit: TreatmentUnit
  onEdit: () => void
  onRemove: () => void
  isSelected: boolean
  onClick: () => void
}

export function UnitCard({ unit, onEdit, onRemove, isSelected, onClick }: UnitCardProps) {
  const metadata = UNIT_METADATA[unit.type]
  const statusColors = {
    pass: 'border-emerald-500 bg-emerald-50',
    warning: 'border-amber-500 bg-amber-50',
    fail: 'border-red-500 bg-red-50',
    not_configured: 'border-gray-300 bg-gray-50',
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${metadata.name} unit`}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${statusColors[unit.status]}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:shadow-lg'}
        min-w-[180px] max-w-[200px]
      `}
    >
      {/* Status indicator dot */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
        unit.status === 'pass' ? 'bg-emerald-500' :
        unit.status === 'warning' ? 'bg-amber-500 animate-pulse' :
        unit.status === 'fail' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
      }`} aria-hidden="true" />

      {/* Icon */}
      <div className="text-3xl mb-2">{metadata.icon}</div>

      {/* Name */}
      <h3 className="font-bold text-gray-900 text-sm mb-1">{metadata.name}</h3>
      <p className="text-xs text-gray-600 mb-2">{metadata.nameThai}</p>

      {/* Key metrics */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">BOD:</span>
          <span className="font-medium text-emerald-600">-{unit.removalEfficiency.bod.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">TSS:</span>
          <span className="font-medium text-emerald-600">-{unit.removalEfficiency.tss.toFixed(0)}%</span>
        </div>
      </div>

      {/* Issues indicator */}
      {unit.issues.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className={`text-xs font-medium ${
            unit.issues.some(i => i.severity === 'critical') ? 'text-red-600' : 'text-amber-600'
          }`}>
            {unit.issues.length} issue{unit.issues.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1 mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
          aria-label={`Edit ${metadata.name}`}
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="px-2 py-1 text-xs bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
          aria-label={`Remove ${metadata.name}`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ============================================
// INFLUENT CARD COMPONENT
// ============================================

interface InfluentCardProps {
  quality: WastewaterQuality
  onChange: (quality: WastewaterQuality) => void
  source: 'domestic' | 'industrial' | 'combined' | 'custom'
  onSourceChange: (source: 'domestic' | 'industrial' | 'combined' | 'custom') => void
}

export function InfluentCard({ quality, onChange, source, onSourceChange }: InfluentCardProps) {
  const idPrefix = 'influent'

  return (
    <div className="p-4 rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🚰</span>
        <div>
          <h3 className="font-bold text-gray-900">Influent</h3>
          <p className="text-xs text-gray-600">น้ำเสียเข้าระบบ</p>
        </div>
      </div>

      {/* Source selector */}
      <select
        value={source}
        onChange={(e) => {
          const newSource = e.target.value as typeof source
          onSourceChange(newSource)
          onChange({ ...DEFAULT_INFLUENT[newSource], flowRate: quality.flowRate } as WastewaterQuality)
        }}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-3"
        aria-label="Select influent source"
      >
        <option value="domestic">Domestic (ชุมชน)</option>
        <option value="industrial">Industrial (อุตสาหกรรม)</option>
        <option value="combined">Combined (รวม)</option>
        <option value="custom">Custom (กำหนดเอง)</option>
      </select>

      {/* Key parameters */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-flow`} className="w-16 text-gray-600">Flow:</label>
          <input
            id={`${idPrefix}-flow`}
            type="number"
            value={quality.flowRate}
            onChange={(e) => onChange({ ...quality, flowRate: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-right"
            min={0}
            step="any"
          />
          <span className="text-gray-500 w-16">m³/day</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-bod`} className="w-16 text-gray-600">BOD:</label>
          <input
            id={`${idPrefix}-bod`}
            type="number"
            value={quality.bod}
            onChange={(e) => onChange({ ...quality, bod: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-right"
            min={0}
            step="any"
          />
          <span className="text-gray-500 w-16">mg/L</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-cod`} className="w-16 text-gray-600">COD:</label>
          <input
            id={`${idPrefix}-cod`}
            type="number"
            value={quality.cod}
            onChange={(e) => onChange({ ...quality, cod: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-right"
            min={0}
            step="any"
          />
          <span className="text-gray-500 w-16">mg/L</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${idPrefix}-tss`} className="w-16 text-gray-600">TSS:</label>
          <input
            id={`${idPrefix}-tss`}
            type="number"
            value={quality.tss}
            onChange={(e) => onChange({ ...quality, tss: Math.max(0, parseFloat(e.target.value) || 0) })}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-right"
            min={0}
            step="any"
          />
          <span className="text-gray-500 w-16">mg/L</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// EFFLUENT CARD COMPONENT
// ============================================

interface EffluentCardProps {
  quality: WastewaterQuality
  targetStandard: ThaiEffluentType
  onStandardChange: (standard: ThaiEffluentType) => void
  compliance: TreatmentSystem['compliance'] | null
}

export function EffluentCard({ quality: _quality, targetStandard, onStandardChange, compliance }: EffluentCardProps) {
  const standard = THAI_EFFLUENT_STANDARDS[targetStandard]
  const formatValue = (value: number | null) => {
    if (value === null) return '—'
    if (Number.isNaN(value)) return '—'
    return value.toFixed(1)
  }

  const formatLimit = (limit: number | string) => {
    return typeof limit === 'number' ? limit.toString() : limit
  }

  const statusStyles = (status: 'pass' | 'fail' | 'unknown') => {
    if (status === 'pass') return { icon: '✓', text: 'text-emerald-700', iconColor: 'text-emerald-500' }
    if (status === 'fail') return { icon: '✗', text: 'text-red-700', iconColor: 'text-red-500' }
    return { icon: '?', text: 'text-gray-700', iconColor: 'text-gray-400' }
  }

  return (
    <div className={`p-4 rounded-xl border-2 min-w-[200px] ${
      compliance?.isCompliant
        ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50'
        : 'border-red-400 bg-gradient-to-br from-red-50 to-orange-50'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{compliance?.isCompliant ? '✅' : '❌'}</span>
        <div>
          <h3 className="font-bold text-gray-900">Effluent</h3>
          <p className="text-xs text-gray-600">น้ำทิ้งออกระบบ</p>
        </div>
      </div>

      {/* Standard selector */}
      <select
        value={targetStandard}
        onChange={(e) => onStandardChange(e.target.value as ThaiEffluentType)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-3"
        aria-label="Select Thai effluent standard"
      >
        <option value="type_a">Type A - Industrial Estate</option>
        <option value="type_b">Type B - General Industrial</option>
        <option value="type_c">Type C - Community</option>
      </select>

      {/* Compliance table */}
      <div className="space-y-1 text-xs">
        {compliance?.parameters.map((p) => {
          const style = statusStyles(p.status)
          return (
            <div key={p.name} className="flex items-center gap-2">
              <span className={`w-4 ${style.iconColor}`}>
                {style.icon}
              </span>
              <span className="w-10 text-gray-600">{p.name}:</span>
              <span className={`flex-1 font-medium ${style.text}`}>
                {formatValue(p.value)}
              </span>
              <span className="text-gray-400">/</span>
              <span className="w-12 text-gray-500">{formatLimit(p.limit)}</span>
              <span className="text-gray-400">{p.unit}</span>
            </div>
          )
        })}
      </div>

      {/* Standard info */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        {standard.nameThai}
      </div>
    </div>
  )
}

// ============================================
// SUMMARY PANEL COMPONENT
// ============================================

export function SummaryPanel({ system }: { system: TreatmentSystem }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
        <div className="text-2xl mb-1">💧</div>
        <div className="text-xs text-gray-500">Total BOD Removal</div>
        <div className="text-xl font-bold text-blue-700">{system.summary.totalBODRemoval.toFixed(1)}%</div>
      </div>
      <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
        <div className="text-2xl mb-1">🧪</div>
        <div className="text-xs text-gray-500">Total COD Removal</div>
        <div className="text-xl font-bold text-emerald-700">{system.summary.totalCODRemoval.toFixed(1)}%</div>
      </div>
      <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
        <div className="text-2xl mb-1">🔬</div>
        <div className="text-xs text-gray-500">Total TSS Removal</div>
        <div className="text-xl font-bold text-purple-700">{system.summary.totalTSSRemoval.toFixed(1)}%</div>
      </div>
      <div className={`p-4 rounded-xl ${
        system.compliance.isCompliant
          ? 'bg-gradient-to-br from-emerald-100 to-green-100'
          : 'bg-gradient-to-br from-red-100 to-orange-100'
      }`}>
        <div className="text-2xl mb-1">{system.compliance.isCompliant ? '✅' : '❌'}</div>
        <div className="text-xs text-gray-500">Thai Standard</div>
        <div className={`text-xl font-bold ${system.compliance.isCompliant ? 'text-emerald-700' : 'text-red-700'}`}>
          {system.compliance.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
        </div>
      </div>
    </div>
  )
}
