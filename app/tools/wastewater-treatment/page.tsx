'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  WastewaterQuality,
  TreatmentUnit,
  TreatmentSystem,
  UnitType,
  UnitStatus,
  UNIT_METADATA,
  PRESET_TEMPLATES,
  DEFAULT_INFLUENT,
  THAI_EFFLUENT_STANDARDS,
  PresetTemplate,
  ThaiEffluentType,
  DesignIssue,
  CostEstimation,
  SludgeProduction,
  EnergyConsumption,
  SavedScenario,
} from '@/lib/types/wastewater-treatment'
import {
  calculateTreatmentTrain,
  getDefaultDesignParams,
  calculateCostEstimation,
  calculateSludgeProduction,
  calculateEnergyConsumption,
} from '@/lib/calculations/wastewater-treatment'
import { WastewaterReportExporter } from '@/lib/export/wastewater-report'

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status }: { status: UnitStatus }) {
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

function FlowArrow({ animated = true }: { animated?: boolean }) {
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

function UnitCard({ unit, onEdit, onRemove, isSelected, onClick }: UnitCardProps) {
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

function InfluentCard({ quality, onChange, source, onSourceChange }: InfluentCardProps) {
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

function EffluentCard({ quality, targetStandard, onStandardChange, compliance }: EffluentCardProps) {
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
// ADD UNIT MODAL
// ============================================

interface AddUnitModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: UnitType) => void
  existingTypes: UnitType[]
}

function AddUnitModal({ isOpen, onClose, onAdd, existingTypes }: AddUnitModalProps) {
  if (!isOpen) return null

  const categories = [
    { id: 'preliminary', name: 'Preliminary', nameThai: 'บำบัดขั้นต้น', types: ['bar_screen', 'grit_chamber'] },
    { id: 'primary', name: 'Primary', nameThai: 'ขั้นปฐมภูมิ', types: ['primary_clarifier', 'oil_separator'] },
    { id: 'biological', name: 'Biological', nameThai: 'ชีวภาพ', types: ['aeration_tank', 'sbr', 'uasb', 'oxidation_pond', 'trickling_filter', 'mbr'] },
    { id: 'secondary', name: 'Secondary', nameThai: 'ขั้นทุติยภูมิ', types: ['secondary_clarifier', 'daf'] },
    { id: 'tertiary', name: 'Tertiary', nameThai: 'ขั้นตติยภูมิ', types: ['filtration', 'chlorination', 'uv_disinfection'] },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-unit-title"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="add-unit-title" className="text-xl font-bold">Add Treatment Unit</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label="Close add unit dialog">&times;</button>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h3 className="text-sm font-bold text-gray-700 mb-2">
                {cat.name} <span className="font-normal text-gray-500">({cat.nameThai})</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cat.types.map((type) => {
                  const meta = UNIT_METADATA[type as UnitType]
                  const isExisting = existingTypes.includes(type as UnitType)
                  return (
                    <button
                      key={type}
                      onClick={() => { onAdd(type as UnitType); onClose() }}
                      disabled={isExisting}
                      className={`
                        p-3 rounded-lg border-2 text-left transition
                        ${isExisting
                          ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                        }
                      `}
                    >
                      <div className="text-xl mb-1">{meta.icon}</div>
                      <div className="text-xs font-medium text-gray-900">{meta.name}</div>
                      <div className="text-xs text-gray-500">{meta.nameThai}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EDIT UNIT MODAL
// ============================================

interface EditUnitModalProps {
  isOpen: boolean
  onClose: () => void
  unit: TreatmentUnit | null
  onSave: (config: Record<string, unknown>) => void
}

function EditUnitModal({ isOpen, onClose, unit, onSave }: EditUnitModalProps) {
  // Initialize config from unit.design
  const [config, setConfig] = useState<Record<string, unknown>>(() =>
    unit ? (unit.design as unknown as Record<string, unknown>) : {}
  )

  // Reset config when unit changes - deferred to avoid cascade
  useEffect(() => {
    if (unit) {
      const timer = setTimeout(() => {
        setConfig(unit.design as unknown as Record<string, unknown>)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [unit])

  if (!isOpen || !unit) return null

  const meta = UNIT_METADATA[unit.type]
  const titleId = `edit-unit-${unit.type}-title`

  const handleChange = (key: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: typeof value === 'string' ? parseFloat(value) || value : value }))
  }

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  // Define editable fields per unit type
  const getEditableFields = () => {
    switch (unit.type) {
      case 'bar_screen':
        return [
          { key: 'barSpacing', label: 'Bar Spacing', unit: 'mm', type: 'number' },
          { key: 'channelWidth', label: 'Channel Width', unit: 'm', type: 'number' },
          { key: 'channelDepth', label: 'Channel Depth', unit: 'm', type: 'number' },
          { key: 'screenAngle', label: 'Screen Angle', unit: '°', type: 'number' },
          { key: 'cleaningType', label: 'Cleaning Type', type: 'select', options: ['manual', 'mechanical'] },
        ]
      case 'grit_chamber':
        return [
          { key: 'chamberType', label: 'Chamber Type', type: 'select', options: ['horizontal_flow', 'aerated', 'vortex'] },
          { key: 'length', label: 'Length', unit: 'm', type: 'number' },
          { key: 'width', label: 'Width', unit: 'm', type: 'number' },
          { key: 'depth', label: 'Depth', unit: 'm', type: 'number' },
        ]
      case 'primary_clarifier':
        return [
          { key: 'shape', label: 'Shape', type: 'select', options: ['circular', 'rectangular'] },
          { key: 'diameter', label: 'Diameter (circular)', unit: 'm', type: 'number', condition: () => config.shape === 'circular' },
          { key: 'length', label: 'Length (rectangular)', unit: 'm', type: 'number', condition: () => config.shape === 'rectangular' },
          { key: 'width', label: 'Width (rectangular)', unit: 'm', type: 'number', condition: () => config.shape === 'rectangular' },
          { key: 'sidewaterDepth', label: 'Sidewater Depth', unit: 'm', type: 'number' },
        ]
      case 'aeration_tank':
        return [
          { key: 'processType', label: 'Process Type', type: 'select', options: ['conventional', 'extended_aeration', 'complete_mix'] },
          { key: 'volume', label: 'Volume', unit: 'm³', type: 'number' },
          { key: 'mlss', label: 'MLSS', unit: 'mg/L', type: 'number' },
          { key: 'srt', label: 'SRT', unit: 'days', type: 'number' },
          { key: 'targetDO', label: 'Target DO', unit: 'mg/L', type: 'number' },
          { key: 'aerationType', label: 'Aeration Type', type: 'select', options: ['fine_bubble', 'coarse_bubble', 'mechanical_surface'] },
          { key: 'returnRatio', label: 'Return Ratio (Qr/Q)', unit: '', type: 'number' },
        ]
      case 'secondary_clarifier':
        return [
          { key: 'shape', label: 'Shape', type: 'select', options: ['circular', 'rectangular'] },
          { key: 'diameter', label: 'Diameter (circular)', unit: 'm', type: 'number', condition: () => config.shape === 'circular' },
          { key: 'length', label: 'Length (rectangular)', unit: 'm', type: 'number', condition: () => config.shape === 'rectangular' },
          { key: 'width', label: 'Width (rectangular)', unit: 'm', type: 'number', condition: () => config.shape === 'rectangular' },
          { key: 'sidewaterDepth', label: 'Sidewater Depth', unit: 'm', type: 'number' },
          { key: 'mlss', label: 'MLSS from Aeration', unit: 'mg/L', type: 'number' },
          { key: 'returnRatio', label: 'Return Ratio', unit: '', type: 'number' },
        ]
      case 'chlorination':
        return [
          { key: 'chlorineType', label: 'Chlorine Type', type: 'select', options: ['gas', 'hypochlorite', 'chlorine_dioxide'] },
          { key: 'tankLength', label: 'Tank Length', unit: 'm', type: 'number' },
          { key: 'tankWidth', label: 'Tank Width', unit: 'm', type: 'number' },
          { key: 'tankDepth', label: 'Tank Depth', unit: 'm', type: 'number' },
          { key: 'chlorineDose', label: 'Chlorine Dose', unit: 'mg/L', type: 'number' },
          { key: 'baffleEfficiency', label: 'Baffle Efficiency', unit: '', type: 'number' },
        ]
      default:
        return []
    }
  }

  const fields = getEditableFields()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <h2 id={titleId} className="text-xl font-bold">{meta.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl" aria-label="Close edit unit dialog">&times;</button>
        </div>

        {/* Issues display */}
        {unit.issues.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-bold text-amber-800 text-sm mb-2">Design Issues:</h4>
            <ul className="space-y-1">
              {unit.issues.map((issue, idx) => (
                <li key={idx} className={`text-xs ${
                  issue.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  <span className="font-medium">{issue.parameter}:</span> {issue.message}
                  <br />
                  <span className="text-gray-600">→ {issue.suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Edit form */}
        <div className="space-y-3">
          {fields.map((field) => {
            if (field.condition && !field.condition()) return null
            const fieldId = `${unit.type}-${field.key}`
            return (
              <div key={field.key} className="flex items-center gap-3">
                <label htmlFor={fieldId} className="w-40 text-sm text-gray-700">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    id={fieldId}
                    value={String(config[field.key] || '')}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      id={fieldId}
                      value={config[field.key] as number || ''}
                      onChange={(e) => handleChange(field.key, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                      step="any"
                      min={0}
                    />
                    {field.unit && <span className="text-gray-500 text-sm w-12">{field.unit}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COST PANEL COMPONENT
// ============================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} K`
  }
  return value.toLocaleString()
}

function CostPanel({ cost }: { cost: CostEstimation }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          💰 Cost Estimation
          <span className="text-xs font-normal text-gray-400">(Preliminary)</span>
        </h2>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showBreakdown ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Capital Cost</div>
          <div className="text-lg font-bold text-blue-700">฿{formatCurrency(cost.totalCapital)}</div>
          <div className="text-xs text-gray-400">Total Investment</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Monthly Operating</div>
          <div className="text-lg font-bold text-emerald-700">฿{formatCurrency(cost.totalOperating)}</div>
          <div className="text-xs text-gray-400">Per Month</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Annual Cost</div>
          <div className="text-lg font-bold text-purple-700">฿{formatCurrency(cost.totalAnnualCost)}</div>
          <div className="text-xs text-gray-400">Operating + Depreciation</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Cost per m³</div>
          <div className="text-lg font-bold text-amber-700">฿{cost.costPerM3.toFixed(2)}</div>
          <div className="text-xs text-gray-400">Treatment Cost</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {/* Capital Cost Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2">Capital Cost Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Civil Works</span>
                <span className="font-medium">฿{formatCurrency(cost.civilWorks)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Equipment</span>
                <span className="font-medium">฿{formatCurrency(cost.equipment)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Engineering</span>
                <span className="font-medium">฿{formatCurrency(cost.engineering)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Installation</span>
                <span className="font-medium">฿{formatCurrency(cost.installation)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Contingency</span>
                <span className="font-medium">฿{formatCurrency(cost.contingency)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">Land Cost</span>
                <span className="font-medium">฿{formatCurrency(cost.landCost)}</span>
              </div>
            </div>
          </div>

          {/* Operating Cost Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2">Monthly Operating Cost Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">⚡ Electricity</span>
                <span className="font-medium">฿{formatCurrency(cost.electricity)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">🧪 Chemicals</span>
                <span className="font-medium">฿{formatCurrency(cost.chemicals)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">👷 Labor</span>
                <span className="font-medium">฿{formatCurrency(cost.labor)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">🔧 Maintenance</span>
                <span className="font-medium">฿{formatCurrency(cost.maintenance)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">🚛 Sludge Disposal</span>
                <span className="font-medium">฿{formatCurrency(cost.sludgeDisposal)}</span>
              </div>
            </div>
          </div>

          {/* Unit Cost Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2">Cost by Treatment Unit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500">Unit</th>
                    <th className="text-right py-2 px-2 text-gray-500">Capital (฿)</th>
                    <th className="text-right py-2 px-2 text-gray-500">Monthly Op. (฿)</th>
                    <th className="text-right py-2 px-2 text-gray-500">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.unitCosts.map((unit, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2 font-medium">{unit.unitName}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(unit.capitalCost)}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(unit.operatingCost)}</td>
                      <td className="py-2 px-2 text-right text-gray-500">
                        {((unit.capitalCost / cost.totalCapital) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Disclaimer:</strong> These are preliminary estimates based on typical Thai construction costs (2024-2025).
              Actual costs may vary ±30% depending on site conditions, equipment brands, and market prices.
              Consult a professional engineer for detailed cost estimates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SLUDGE PANEL COMPONENT
// ============================================

function SludgePanel({ sludge }: { sludge: SludgeProduction }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          🪣 Sludge Production
          <span className="text-xs font-normal text-gray-400">(Mass Balance)</span>
        </h2>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showBreakdown ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Primary Sludge</div>
          <div className="text-lg font-bold text-amber-700">{sludge.primarySludge.toLocaleString()} kg/d</div>
          <div className="text-xs text-gray-400">{sludge.primarySludgeVolume.toFixed(1)} m³/d (4%)</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Biological Sludge</div>
          <div className="text-lg font-bold text-green-700">{sludge.biologicalSludge.toLocaleString()} kg/d</div>
          <div className="text-xs text-gray-400">{sludge.biologicalSludgeVolume.toFixed(1)} m³/d (1%)</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Total Sludge</div>
          <div className="text-lg font-bold text-blue-700">{sludge.totalSludge.toLocaleString()} kg DS/d</div>
          <div className="text-xs text-gray-400">{sludge.totalSludgeVolume.toFixed(1)} m³/d total</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Disposal</div>
          <div className="text-lg font-bold text-purple-700">
            {sludge.cakeMass ? `${(sludge.cakeMass/1000).toFixed(1)} ton/d` : `${sludge.totalSludgeVolume.toFixed(1)} m³/d`}
          </div>
          <div className="text-xs text-gray-400">
            {sludge.dewateredSludge ? 'Dewatered cake' : 'Liquid sludge'}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {/* Sludge by Unit */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2">Sludge Production by Unit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500">Unit</th>
                    <th className="text-right py-2 px-2 text-gray-500">Sludge (kg DS/d)</th>
                    <th className="text-left py-2 px-2 text-gray-500">Type</th>
                    <th className="text-right py-2 px-2 text-gray-500">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sludge.unitSludge.filter(u => u.sludgeProduced > 0).map((unit, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2 font-medium">{unit.unitName}</td>
                      <td className="py-2 px-2 text-right">{unit.sludgeProduced.toLocaleString()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          unit.sludgeType === 'primary' ? 'bg-amber-100 text-amber-700' :
                          unit.sludgeType === 'biological' ? 'bg-green-100 text-green-700' :
                          unit.sludgeType === 'chemical' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {unit.sludgeType}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-gray-500">
                        {sludge.totalSludge > 0 ? ((unit.sludgeProduced / sludge.totalSludge) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Biogas Recovery (if applicable) */}
          {sludge.biogasProduction && sludge.biogasProduction > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-xs font-bold text-green-800 mb-2">🔥 Biogas Recovery</h4>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Production:</span>
                  <span className="font-medium ml-1">{sludge.biogasProduction} m³/d</span>
                </div>
                <div>
                  <span className="text-gray-600">CH₄ Content:</span>
                  <span className="font-medium ml-1">{sludge.methaneContent}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Energy:</span>
                  <span className="font-medium ml-1">{sludge.energyRecovery} kWh/d</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// ENERGY PANEL COMPONENT
// ============================================

function EnergyPanel({ energy }: { energy: EnergyConsumption }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Create pie chart segments
  const categories = [
    { name: 'Aeration', value: energy.aeration, color: '#3B82F6' },
    { name: 'Pumping', value: energy.pumping, color: '#10B981' },
    { name: 'Mixing', value: energy.mixing, color: '#8B5CF6' },
    { name: 'Disinfection', value: energy.disinfection, color: '#F59E0B' },
    { name: 'Other', value: energy.other + energy.lighting, color: '#6B7280' },
  ].filter(c => c.value > 0)

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          ⚡ Energy Dashboard
          <span className="text-xs font-normal text-gray-400">(Power Analysis)</span>
        </h2>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showBreakdown ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Daily Usage</div>
          <div className="text-lg font-bold text-amber-700">{energy.totalDaily.toLocaleString()} kWh</div>
          <div className="text-xs text-gray-400">฿{energy.dailyCost.toLocaleString()}/day</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Monthly Usage</div>
          <div className="text-lg font-bold text-orange-700">{energy.totalMonthly.toLocaleString()} kWh</div>
          <div className="text-xs text-gray-400">฿{energy.monthlyCost.toLocaleString()}/mo</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <div className="text-xs text-gray-500 mb-1">Efficiency</div>
          <div className="text-lg font-bold text-blue-700">{energy.kWhPerM3} kWh/m³</div>
          <div className="text-xs text-gray-400">{energy.kWhPerKgBOD} kWh/kg BOD</div>
        </div>
        <div className={`p-4 rounded-xl ${
          energy.netEnergy !== undefined && energy.netEnergy < 0
            ? 'bg-gradient-to-br from-green-50 to-emerald-50'
            : 'bg-gradient-to-br from-gray-50 to-slate-50'
        }`}>
          <div className="text-xs text-gray-500 mb-1">
            {energy.biogasEnergy ? 'Net Energy' : 'Annual Cost'}
          </div>
          <div className={`text-lg font-bold ${
            energy.netEnergy !== undefined && energy.netEnergy < 0 ? 'text-green-700' : 'text-gray-700'
          }`}>
            {energy.biogasEnergy
              ? `${energy.netEnergy?.toLocaleString()} kWh/d`
              : `฿${(energy.annualCost / 1000000).toFixed(2)}M`
            }
          </div>
          <div className="text-xs text-gray-400">
            {energy.biogasEnergy ? `Biogas: ${energy.biogasEnergy} kWh/d` : 'Per year'}
          </div>
        </div>
      </div>

      {/* Energy Distribution Chart */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex-1">
          <div className="h-4 rounded-full overflow-hidden flex bg-gray-200">
            {categories.map((cat, i) => (
              <div
                key={i}
                style={{
                  width: `${(cat.value / energy.totalDaily) * 100}%`,
                  backgroundColor: cat.color
                }}
                className="h-full"
                title={`${cat.name}: ${cat.value.toFixed(1)} kWh/d`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                <span className="text-gray-600">{cat.name}</span>
                <span className="text-gray-400">({((cat.value / energy.totalDaily) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          {/* Energy by Unit */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2">Energy Consumption by Unit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500">Unit</th>
                    <th className="text-right py-2 px-2 text-gray-500">kWh/day</th>
                    <th className="text-left py-2 px-2 text-gray-500">Category</th>
                    <th className="text-right py-2 px-2 text-gray-500">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {energy.unitEnergy.map((unit, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2 font-medium">{unit.unitName}</td>
                      <td className="py-2 px-2 text-right">{unit.dailyConsumption.toLocaleString()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          unit.category === 'aeration' ? 'bg-blue-100 text-blue-700' :
                          unit.category === 'pumping' ? 'bg-green-100 text-green-700' :
                          unit.category === 'mixing' ? 'bg-purple-100 text-purple-700' :
                          unit.category === 'disinfection' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {unit.category}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-gray-500">{unit.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Efficiency Benchmarks */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-bold text-blue-800 mb-2">📊 Efficiency Benchmarks</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-600">Your System:</span>
                <span className="font-bold text-blue-700 ml-1">{energy.kWhPerM3} kWh/m³</span>
              </div>
              <div>
                <span className="text-gray-600">Typical AS:</span>
                <span className="text-gray-500 ml-1">0.3-0.6 kWh/m³</span>
              </div>
              <div>
                <span className="text-gray-600">MBR:</span>
                <span className="text-gray-500 ml-1">0.6-1.2 kWh/m³</span>
              </div>
              <div>
                <span className="text-gray-600">Pond:</span>
                <span className="text-gray-500 ml-1">0.05-0.15 kWh/m³</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SCENARIO MANAGER COMPONENT
// ============================================

const STORAGE_KEY = 'verchem_wastewater_scenarios'

function loadScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data).map((s: SavedScenario) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }))
  } catch {
    return []
  }
}

function saveScenarios(scenarios: SavedScenario[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

interface ScenarioManagerProps {
  currentDesign: {
    source: 'domestic' | 'industrial' | 'combined' | 'custom'
    influent: WastewaterQuality
    targetStandard: ThaiEffluentType
    unitConfigs: Array<{ type: UnitType; config: Record<string, unknown> }>
  }
  onLoadScenario: (scenario: SavedScenario) => void
  system: TreatmentSystem | null
  costEstimation: CostEstimation | null
}

function ScenarioManager({ currentDesign, onLoadScenario, system, costEstimation }: ScenarioManagerProps) {
  // Lazy initialization from localStorage
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => loadScenarios())
  const [showComparison, setShowComparison] = useState(false)
  const [newName, setNewName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleSave = () => {
    if (!newName.trim() || !system) return

    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: newName.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      source: currentDesign.source,
      influent: currentDesign.influent,
      targetStandard: currentDesign.targetStandard,
      unitConfigs: currentDesign.unitConfigs,
      effluentQuality: system.effluentQuality,
      compliance: {
        isCompliant: system.compliance.isCompliant,
        parameters: system.compliance.parameters.map(p => ({ name: p.name, status: p.status })),
      },
      totalCost: costEstimation?.totalCapital,
      costPerM3: costEstimation?.costPerM3,
    }

    const updated = [...scenarios, newScenario]
    setScenarios(updated)
    saveScenarios(updated)
    setNewName('')
    setShowSaveDialog(false)
  }

  const handleDelete = (id: string) => {
    const updated = scenarios.filter(s => s.id !== id)
    setScenarios(updated)
    saveScenarios(updated)
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          📁 Scenario Manager
          <span className="text-xs font-normal text-gray-400">({scenarios.length} saved)</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!system || currentDesign.unitConfigs.length === 0}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            💾 Save Current
          </button>
          {scenarios.length >= 2 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              📊 {showComparison ? 'Hide' : 'Compare'}
            </button>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter scenario name..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!newName.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Scenarios List */}
      {scenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`p-3 border rounded-lg ${
                scenario.compliance?.isCompliant
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{scenario.name}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(scenario.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  scenario.compliance?.isCompliant
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {scenario.compliance?.isCompliant ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mb-2">
                <div>Flow: {scenario.influent.flowRate.toLocaleString()} m³/d</div>
                <div>Units: {scenario.unitConfigs.length}</div>
                {scenario.costPerM3 && <div>Cost: ฿{scenario.costPerM3.toFixed(2)}/m³</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoadScenario(scenario)}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Load
                </button>
                <button
                  onClick={() => handleDelete(scenario.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved scenarios. Create a design and click &quot;Save Current&quot; to save it.
        </p>
      )}

      {/* Comparison Table */}
      {showComparison && scenarios.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📊 Scenario Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-500">Metric</th>
                  {scenarios.slice(0, 3).map((s) => (
                    <th key={s.id} className="text-right py-2 px-2 text-gray-700">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">Flow Rate</td>
                  {scenarios.slice(0, 3).map((s) => (
                    <td key={s.id} className="py-2 px-2 text-right">{s.influent.flowRate.toLocaleString()} m³/d</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">Treatment Units</td>
                  {scenarios.slice(0, 3).map((s) => (
                    <td key={s.id} className="py-2 px-2 text-right">{s.unitConfigs.length}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">Effluent BOD</td>
                  {scenarios.slice(0, 3).map((s) => (
                    <td key={s.id} className="py-2 px-2 text-right">{s.effluentQuality?.bod.toFixed(1) || '-'} mg/L</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">Capital Cost</td>
                  {scenarios.slice(0, 3).map((s) => (
                    <td key={s.id} className="py-2 px-2 text-right">
                      {s.totalCost ? `฿${(s.totalCost / 1000000).toFixed(1)}M` : '-'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-2 text-gray-600">Cost per m³</td>
                  {scenarios.slice(0, 3).map((s) => (
                    <td key={s.id} className="py-2 px-2 text-right">
                      {s.costPerM3 ? `฿${s.costPerM3.toFixed(2)}` : '-'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 px-2 text-gray-600">Compliance</td>
                  {scenarios.slice(0, 3).map((s) => (
                    <td key={s.id} className="py-2 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded ${
                        s.compliance?.isCompliant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {s.compliance?.isCompliant ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// ISSUES PANEL COMPONENT
// ============================================

function IssuesPanel({ issues }: { issues: DesignIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
        <span className="text-2xl">✅</span>
        <p className="text-emerald-700 font-medium mt-1">All design parameters within acceptable ranges</p>
      </div>
    )
  }

  const critical = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity === 'warning')

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="font-bold text-red-800 flex items-center gap-2 mb-2">
            <span>🚨</span> Critical Issues ({critical.length})
          </h4>
          <ul className="space-y-2">
            {critical.map((issue, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-red-700">{issue.parameter}:</span>
                <span className="text-red-600 ml-1">{issue.message}</span>
                <br />
                <span className="text-xs text-gray-600">
                  Current: {issue.currentValue.toFixed(2)} {issue.unit}
                  {issue.recommendedValue && ` → Recommended: ${issue.recommendedValue.toFixed(2)} ${issue.unit}`}
                </span>
                <br />
                <span className="text-xs text-blue-600">💡 {issue.suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
            <span>⚠️</span> Warnings ({warnings.length})
          </h4>
          <ul className="space-y-2">
            {warnings.map((issue, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-amber-700">{issue.parameter}:</span>
                <span className="text-amber-600 ml-1">{issue.message}</span>
                <br />
                <span className="text-xs text-gray-600">
                  Current: {issue.currentValue.toFixed(2)} {issue.unit}
                  {issue.recommendedValue && ` → Suggested: ${issue.recommendedValue.toFixed(2)} ${issue.unit}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================
// TREATMENT GRAPH COMPONENT
// ============================================

interface DataPoint {
  label: string
  labelThai: string
  bod: number
  cod: number
  tss: number
}

function TreatmentGraph({ system, influent }: { system: TreatmentSystem; influent: WastewaterQuality }) {
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

// ============================================
// SUMMARY PANEL COMPONENT
// ============================================

function SummaryPanel({ system }: { system: TreatmentSystem }) {
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

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function WastewaterTreatmentPage() {
  // State
  const [source, setSource] = useState<'domestic' | 'industrial' | 'combined' | 'custom'>('domestic')
  const [influent, setInfluent] = useState<WastewaterQuality>({
    ...DEFAULT_INFLUENT.domestic,
    flowRate: 1000,
  } as WastewaterQuality)
  const [targetStandard, setTargetStandard] = useState<ThaiEffluentType>('type_c')
  const [unitConfigs, setUnitConfigs] = useState<Array<{ type: UnitType; config: Record<string, unknown> }>>([])
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<TreatmentUnit | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Calculate treatment train
  const system = useMemo(() => {
    if (unitConfigs.length === 0) return null
    try {
      return calculateTreatmentTrain(influent, unitConfigs, targetStandard)
    } catch {
      return null
    }
  }, [influent, unitConfigs, targetStandard])

  // Calculate cost estimation
  const costEstimation = useMemo(() => {
    if (!system) return null
    try {
      return calculateCostEstimation(system, influent.flowRate)
    } catch {
      return null
    }
  }, [system, influent.flowRate])

  // Calculate sludge production
  const sludgeProduction = useMemo(() => {
    if (!system) return null
    try {
      return calculateSludgeProduction(system, influent)
    } catch {
      return null
    }
  }, [system, influent])

  // Calculate energy consumption
  const energyConsumption = useMemo(() => {
    if (!system) return null
    try {
      return calculateEnergyConsumption(system, influent)
    } catch {
      return null
    }
  }, [system, influent])

  // Add unit
  const handleAddUnit = useCallback((type: UnitType) => {
    const defaultConfig = getDefaultDesignParams(type, influent.flowRate)
    setUnitConfigs(prev => [...prev, { type, config: defaultConfig }])
  }, [influent.flowRate])

  // Remove unit
  const handleRemoveUnit = useCallback((index: number) => {
    setUnitConfigs(prev => prev.filter((_, i) => i !== index))
    setSelectedUnitIndex(null)
  }, [])

  // Edit unit
  const handleEditUnit = useCallback((index: number) => {
    if (system && system.units[index]) {
      setEditingUnit(system.units[index])
      setShowEditModal(true)
      setSelectedUnitIndex(index)
    }
  }, [system])

  // Save unit config
  const handleSaveUnit = useCallback((config: Record<string, unknown>) => {
    if (selectedUnitIndex !== null) {
      setUnitConfigs(prev => prev.map((item, i) =>
        i === selectedUnitIndex ? { ...item, config } : item
      ))
    }
    setEditingUnit(null)
  }, [selectedUnitIndex])

  // Export PDF report
  const handleExportPDF = useCallback(async () => {
    if (!system) return

    setIsExporting(true)
    try {
      // Transform compliance data to match export format
      const complianceData = {
        overall: system.compliance.isCompliant ? 'pass' as const : 'fail' as const,
        parameters: system.compliance.parameters.map(p => ({
          parameter: p.name,
          actual: p.value ?? undefined,
          limit: p.limit,
          unit: p.unit,
          status: p.status,
        })),
      }

      await WastewaterReportExporter.exportReport({
        projectName: 'Wastewater Treatment Plant',
        designFlow: influent.flowRate,
        influentQuality: influent,
        treatmentTrain: system.units,
        effluentStandard: targetStandard,
        compliance: complianceData,
        generatedDate: new Date(),
      })
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [system, influent, targetStandard])

  // Load preset
  const handleLoadPreset = useCallback((presetId: PresetTemplate) => {
    if (presetId === 'custom') {
      setUnitConfigs([])
      return
    }
    const preset = PRESET_TEMPLATES.find(p => p.id === presetId)
    if (preset) {
      const configs = preset.unitTypes.map(type => ({
        type,
        config: getDefaultDesignParams(type, influent.flowRate),
      }))
      setUnitConfigs(configs)
    }
  }, [influent.flowRate])

  // Load scenario from saved
  const handleLoadScenario = useCallback((scenario: SavedScenario) => {
    setSource(scenario.source)
    setInfluent(scenario.influent)
    setTargetStandard(scenario.targetStandard)
    setUnitConfigs(scenario.unitConfigs)
    setSelectedUnitIndex(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/tools" className="text-gray-500 hover:text-gray-700">
                ← Tools
              </Link>
              <span className="text-gray-300">|</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  🏭 Wastewater Treatment System Builder
                </h1>
                <p className="text-sm text-gray-500">ออกแบบระบบบำบัดน้ำเสีย | Design your treatment train</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={system?.overallStatus || 'not_configured'} />
              {system && (
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition shadow-sm"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Preset Templates */}
        <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Start Templates</h2>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleLoadPreset(preset.id)}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-gray-400 ml-1">({preset.nameThai})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Treatment Train Visualization */}
        <div className="mb-6 p-6 bg-white rounded-xl shadow-sm overflow-x-auto">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Treatment Train</h2>

          <div className="flex items-stretch gap-2 min-w-max pb-2">
            {/* Influent */}
            <InfluentCard
              quality={influent}
              onChange={setInfluent}
              source={source}
              onSourceChange={setSource}
            />

            {/* Flow arrow to first unit */}
            {unitConfigs.length > 0 && <FlowArrow />}

            {/* Treatment Units */}
            {system?.units.map((unit, index) => (
              <div key={unit.id} className="flex items-stretch">
                <UnitCard
                  unit={unit}
                  onEdit={() => handleEditUnit(index)}
                  onRemove={() => handleRemoveUnit(index)}
                  isSelected={selectedUnitIndex === index}
                  onClick={() => setSelectedUnitIndex(index)}
                />
                {index < system.units.length - 1 && <FlowArrow />}
              </div>
            ))}

            {/* Add unit button */}
            <div className="flex items-center">
              {unitConfigs.length > 0 && <FlowArrow animated={false} />}
              <button
                onClick={() => setShowAddModal(true)}
                className="w-[120px] h-[180px] border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500"
              >
                <span className="text-3xl">+</span>
                <span className="text-xs font-medium">Add Unit</span>
              </button>
            </div>

            {/* Flow arrow to effluent */}
            {unitConfigs.length > 0 && <FlowArrow />}

            {/* Effluent */}
            {unitConfigs.length > 0 && system && (
              <EffluentCard
                quality={system.effluentQuality}
                targetStandard={targetStandard}
                onStandardChange={setTargetStandard}
                compliance={system.compliance}
              />
            )}
          </div>
        </div>

        {/* Results Section */}
        {system && (
          <>
            {/* Summary Cards */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-700 mb-3">System Performance Summary</h2>
              <SummaryPanel system={system} />
            </div>

            {/* Treatment Performance Graph */}
            <div className="mb-6">
              <TreatmentGraph system={system} influent={influent} />
            </div>

            {/* Cost Estimation */}
            {costEstimation && (
              <div className="mb-6">
                <CostPanel cost={costEstimation} />
              </div>
            )}

            {/* Sludge Production */}
            {sludgeProduction && (
              <div className="mb-6">
                <SludgePanel sludge={sludgeProduction} />
              </div>
            )}

            {/* Energy Dashboard */}
            {energyConsumption && (
              <div className="mb-6">
                <EnergyPanel energy={energyConsumption} />
              </div>
            )}

            {/* Scenario Manager */}
            <div className="mb-6">
              <ScenarioManager
                currentDesign={{ source, influent, targetStandard, unitConfigs }}
                onLoadScenario={handleLoadScenario}
                system={system}
                costEstimation={costEstimation}
              />
            </div>

            {/* Issues Panel */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Design Issues & Recommendations</h2>
              <IssuesPanel issues={system.systemIssues} />
            </div>

            {/* Detailed Results Table */}
            <div className="p-6 bg-white rounded-xl shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Water Quality Through Treatment Train</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Stage</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Flow (m³/d)</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">BOD (mg/L)</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">COD (mg/L)</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">TSS (mg/L)</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Influent row */}
                    <tr className="border-b border-gray-100 bg-blue-50">
                      <td className="py-2 px-3 font-medium">🚰 Influent</td>
                      <td className="text-right py-2 px-3">{influent.flowRate.toLocaleString()}</td>
                      <td className="text-right py-2 px-3">{influent.bod.toFixed(1)}</td>
                      <td className="text-right py-2 px-3">{influent.cod.toFixed(1)}</td>
                      <td className="text-right py-2 px-3">{influent.tss.toFixed(1)}</td>
                      <td className="text-center py-2 px-3">-</td>
                    </tr>
                    {/* Unit rows */}
                    {system.units.map((unit) => (
                      <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">
                          {UNIT_METADATA[unit.type].icon} {UNIT_METADATA[unit.type].name}
                        </td>
                        <td className="text-right py-2 px-3">{unit.outputQuality.flowRate.toLocaleString()}</td>
                        <td className="text-right py-2 px-3">
                          {unit.outputQuality.bod.toFixed(1)}
                          <span className="text-emerald-600 text-xs ml-1">(-{unit.removalEfficiency.bod}%)</span>
                        </td>
                        <td className="text-right py-2 px-3">
                          {unit.outputQuality.cod.toFixed(1)}
                          <span className="text-emerald-600 text-xs ml-1">(-{unit.removalEfficiency.cod}%)</span>
                        </td>
                        <td className="text-right py-2 px-3">
                          {unit.outputQuality.tss.toFixed(1)}
                          <span className="text-emerald-600 text-xs ml-1">(-{unit.removalEfficiency.tss}%)</span>
                        </td>
                        <td className="text-center py-2 px-3">
                          <StatusBadge status={unit.status} />
                        </td>
                      </tr>
                    ))}
                    {/* Effluent row */}
                    <tr className={`${system.compliance.isCompliant ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <td className="py-2 px-3 font-bold">
                        {system.compliance.isCompliant ? '✅' : '❌'} Final Effluent
                      </td>
                      <td className="text-right py-2 px-3 font-bold">{system.effluentQuality.flowRate.toLocaleString()}</td>
                      <td className="text-right py-2 px-3 font-bold">{system.effluentQuality.bod.toFixed(1)}</td>
                      <td className="text-right py-2 px-3 font-bold">{system.effluentQuality.cod.toFixed(1)}</td>
                      <td className="text-right py-2 px-3 font-bold">{system.effluentQuality.tss.toFixed(1)}</td>
                      <td className="text-center py-2 px-3">
                        <StatusBadge status={system.overallStatus} />
                      </td>
                    </tr>
                    {/* Standard limits row */}
                    <tr className="bg-gray-100">
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        📋 Thai Standard ({THAI_EFFLUENT_STANDARDS[targetStandard].nameThai})
                      </td>
                      <td className="text-right py-2 px-3 text-gray-500">-</td>
                      <td className="text-right py-2 px-3 text-gray-500">≤ {THAI_EFFLUENT_STANDARDS[targetStandard].limits.bod}</td>
                      <td className="text-right py-2 px-3 text-gray-500">≤ {THAI_EFFLUENT_STANDARDS[targetStandard].limits.cod}</td>
                      <td className="text-right py-2 px-3 text-gray-500">≤ {THAI_EFFLUENT_STANDARDS[targetStandard].limits.tss}</td>
                      <td className="text-center py-2 px-3">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!system && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Start Building Your Treatment System</h3>
            <p className="text-gray-500 mb-6">
              Select a preset template or add units one by one to design your wastewater treatment train
            </p>
            <button
              onClick={() => handleLoadPreset('conventional_as')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start with Conventional AS System
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUnitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUnit}
        existingTypes={unitConfigs.map(u => u.type)}
      />

      <EditUnitModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        unit={editingUnit}
        onSave={handleSaveUnit}
      />

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes flow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-flow {
          animation: flow 1.5s linear infinite;
        }
      `}</style>
    </div>
  )
}
