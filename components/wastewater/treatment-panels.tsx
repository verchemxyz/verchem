'use client'

import { useState } from 'react'
import {
  CostEstimation,
  SludgeProduction,
  EnergyConsumption,
  DesignIssue,
} from '@/lib/types/wastewater-treatment'

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} K`
  }
  return value.toLocaleString()
}

// ============================================
// COST PANEL COMPONENT
// ============================================

export function CostPanel({ cost }: { cost: CostEstimation }) {
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

export function SludgePanel({ sludge }: { sludge: SludgeProduction }) {
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

export function EnergyPanel({ energy }: { energy: EnergyConsumption }) {
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
// ISSUES PANEL COMPONENT
// ============================================

export function IssuesPanel({ issues }: { issues: DesignIssue[] }) {
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
