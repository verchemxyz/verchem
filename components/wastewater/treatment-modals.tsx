'use client'

import { useState, useEffect } from 'react'
import {
  TreatmentUnit,
  UnitType,
  UNIT_METADATA,
} from '@/lib/types/wastewater-treatment'

// ============================================
// ADD UNIT MODAL
// ============================================

interface AddUnitModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: UnitType) => void
  existingTypes: UnitType[]
}

export function AddUnitModal({ isOpen, onClose, onAdd, existingTypes }: AddUnitModalProps) {
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

export function EditUnitModal({ isOpen, onClose, unit, onSave }: EditUnitModalProps) {
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
  type FieldDef = {
    key: string
    label: string
    unit?: string
    type: 'number' | 'select'
    options?: string[]
    condition?: () => boolean
  }

  const getEditableFields = (): FieldDef[] => {
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
