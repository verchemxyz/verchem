'use client'

import { useState } from 'react'
import {
  WastewaterQuality,
  TreatmentSystem,
  UnitType,
  ThaiEffluentType,
  CostEstimation,
  SavedScenario,
} from '@/lib/types/wastewater-treatment'

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEY = 'verchem_wastewater_scenarios'

export function loadScenarios(): SavedScenario[] {
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

export function saveScenarios(scenarios: SavedScenario[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

// ============================================
// SCENARIO MANAGER COMPONENT
// ============================================

export interface ScenarioManagerProps {
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

export function ScenarioManager({ currentDesign, onLoadScenario, system, costEstimation }: ScenarioManagerProps) {
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
