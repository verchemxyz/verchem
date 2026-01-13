/**
 * VerChem - BNR (Biological Nutrient Removal) Designer Component
 * World-Class nitrogen and phosphorus removal system design
 *
 * Reference: Metcalf & Eddy - Wastewater Engineering (5th Edition)
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  BNRProcessType,
  BNRDesign,
  BNR_PROCESS_CONFIGS,
  WastewaterQuality,
} from '@/lib/types/wastewater-treatment'
import { designBNRSystem, BNRDesignInput } from '@/lib/calculations/bnr-design'

// ============================================
// TYPES
// ============================================

interface BNRDesignerProps {
  flowRate: number
  influent: WastewaterQuality
  temperature: number
  onDesignComplete?: (design: BNRDesign) => void
}

// ============================================
// PROCESS SELECTION COMPONENT
// ============================================

function ProcessSelector({
  selected,
  onSelect,
}: {
  selected: BNRProcessType
  onSelect: (type: BNRProcessType) => void
}) {
  const processTypes: BNRProcessType[] = [
    'mle',
    'a2o',
    'bardenpho_4stage',
    'bardenpho_5stage',
    'uct',
    'vip',
    'johannesburg',
    'step_feed',
    'sbr_bnr',
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {processTypes.map((type) => {
        const config = BNR_PROCESS_CONFIGS[type]
        const isSelected = selected === type

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            aria-pressed={isSelected}
            aria-label={`Select ${config.name} process`}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-semibold text-gray-900">{config.name}</div>
            <div className="text-xs text-gray-500 mb-2">{config.nameThai}</div>
            <div className="text-sm text-gray-600 mb-3">{config.description}</div>

            <div className="flex flex-wrap gap-1 mb-2">
              {config.nitrogenRemoval && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  N Removal
                </span>
              )}
              {config.phosphorusRemoval && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  P Removal
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  config.complexity === 'low'
                    ? 'bg-blue-100 text-blue-700'
                    : config.complexity === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {config.complexity} complexity
              </span>
            </div>

            <div className="text-xs text-gray-500">
              <div>TN: {config.typicalTNRemoval[0]}-{config.typicalTNRemoval[1]}% removal</div>
              <div>TP: {config.typicalTPRemoval[0]}-{config.typicalTPRemoval[1]}% removal</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// ZONE LAYOUT VISUALIZATION
// ============================================

function ZoneLayoutVisualization({ design }: { design: BNRDesign }) {
  const getZoneColor = (type: string) => {
    switch (type) {
      case 'anaerobic':
        return 'bg-purple-500'
      case 'anoxic':
        return 'bg-orange-500'
      case 'aerobic':
        return 'bg-blue-500'
      case 'reaeration':
        return 'bg-cyan-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'anaerobic':
        return '🔴' // No oxygen
      case 'anoxic':
        return '🟠' // Low oxygen
      case 'aerobic':
        return '💨' // Aeration
      case 'reaeration':
        return '🌊' // Polishing
      default:
        return '⬜'
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">Process Flow Diagram</h4>

      {/* Zone Layout */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {/* Influent */}
        <div className="flex flex-col items-center min-w-[60px]">
          <div className="w-12 h-12 bg-gray-400 rounded flex items-center justify-center text-white text-lg">
            🚰
          </div>
          <span className="text-xs text-gray-600 mt-1">Influent</span>
        </div>

        <div className="text-gray-400">→</div>

        {/* Process Zones */}
        {design.zones.map((zone, index) => (
          <div key={zone.name} className="flex items-center gap-2">
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={`relative w-16 h-16 ${getZoneColor(zone.type)} rounded-lg flex items-center justify-center text-white shadow-md`}
              >
                <span className="text-2xl">{getZoneIcon(zone.type)}</span>
                {zone.type === 'aerobic' && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 pb-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-700 mt-1 font-medium">{zone.name}</span>
              <span className="text-xs text-gray-500">
                {zone.volume.toFixed(0)} m³
              </span>
              <span className="text-xs text-gray-400">
                HRT: {zone.hrt.toFixed(1)}h
              </span>
            </div>
            {index < design.zones.length - 1 && (
              <div className="text-gray-400">→</div>
            )}
          </div>
        ))}

        <div className="text-gray-400">→</div>

        {/* Clarifier */}
        <div className="flex flex-col items-center min-w-[80px]">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl shadow-md">
            🔄
          </div>
          <span className="text-xs text-gray-700 mt-1 font-medium">Clarifier</span>
        </div>

        <div className="text-gray-400">→</div>

        {/* Effluent */}
        <div className="flex flex-col items-center min-w-[60px]">
          <div className="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white text-lg">
            ✅
          </div>
          <span className="text-xs text-gray-600 mt-1">Effluent</span>
        </div>
      </div>

      {/* Recycle Streams */}
      <div className="border-t pt-3">
        <h5 className="text-xs font-medium text-gray-600 mb-2">Recycle Streams</h5>
        <div className="flex flex-wrap gap-3">
          {design.recycles.map((recycle) => (
            <div
              key={recycle.name}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded border border-gray-200"
            >
              <span className="text-orange-500">↩</span>
              <div>
                <div className="text-xs font-medium">{recycle.name}</div>
                <div className="text-xs text-gray-500">
                  {recycle.from} → {recycle.to} ({recycle.ratio.toFixed(1)}Q)
                </div>
                <div className="text-xs text-gray-400">
                  {recycle.flowRate.toFixed(0)} m³/d
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t mt-3 pt-3">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span>Anaerobic (DO &lt; 0.2)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>Anoxic (DO &lt; 0.5)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Aerobic (DO 1.5-3.0)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-cyan-500 rounded" />
            <span>Reaeration</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PERFORMANCE SUMMARY
// ============================================

function PerformanceSummary({ design }: { design: BNRDesign }) {
  const performanceMetrics = [
    { label: 'BOD Removal', value: design.performance.bodRemoval, target: 90 },
    { label: 'COD Removal', value: design.performance.codRemoval, target: 85 },
    { label: 'TSS Removal', value: design.performance.tssRemoval, target: 90 },
    { label: 'Ammonia Removal', value: design.performance.ammoniaRemoval, target: 90 },
    { label: 'Total N Removal', value: design.performance.totalNRemoval, target: 70 },
    { label: 'Total P Removal', value: design.performance.totalPRemoval, target: 70 },
  ]

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Treatment Performance</h4>

      <div className="space-y-3">
        {performanceMetrics.map((metric) => {
          const achieved = metric.value >= metric.target
          const percentage = Math.min(100, metric.value)

          return (
            <div key={metric.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{metric.label}</span>
                <span className={achieved ? 'text-green-600' : 'text-amber-600'}>
                  {metric.value.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    achieved ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Effluent Quality */}
      <div className="mt-4 pt-4 border-t">
        <h5 className="text-xs font-medium text-gray-600 mb-2">Predicted Effluent Quality</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'BOD', value: design.effluent.bod, unit: 'mg/L', target: design.target.bod },
            { label: 'TSS', value: design.effluent.tss, unit: 'mg/L', target: design.target.tss },
            { label: 'NH₃-N', value: design.effluent.ammonia, unit: 'mg/L', target: design.target.ammonia },
            { label: 'NO₃-N', value: design.effluent.nitrate, unit: 'mg/L', target: null },
            { label: 'TN', value: design.effluent.totalN, unit: 'mg/L', target: design.target.totalN },
            { label: 'TP', value: design.effluent.totalP, unit: 'mg/L', target: design.target.totalP },
          ].map((item) => {
            const meets = item.target === null || item.value <= item.target
            return (
              <div
                key={item.label}
                className={`p-2 rounded text-center ${
                  meets ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className={`font-medium ${meets ? 'text-green-700' : 'text-red-700'}`}>
                  {item.value.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">{item.unit}</div>
                {item.target !== null && (
                  <div className="text-xs text-gray-400">
                    Target: ≤{item.target}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// NITROGEN REMOVAL DETAILS
// ============================================

function NitrogenRemovalDetails({ design }: { design: BNRDesign }) {
  const { nitrification, denitrification } = design

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Nitrogen Removal</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nitrification */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h5 className="text-sm font-medium text-blue-800 mb-2">Nitrification (NH₄ → NO₃)</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Influent NH₃-N:</span>
              <span>{nitrification.ammoniaInfluent.toFixed(1)} mg/L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Effluent NH₃-N:</span>
              <span className="text-green-600">{nitrification.effluentNH3.toFixed(1)} mg/L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Efficiency:</span>
              <span>{nitrification.nitrificationEfficiency.toFixed(1)}%</span>
            </div>
            <div className="border-t border-blue-200 mt-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">μmax (AOB):</span>
                <span>{nitrification.muMaxAOB.toFixed(3)} d⁻¹</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Min SRT:</span>
                <span>{nitrification.minSRT.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Design SRT:</span>
                <span className="font-medium">{nitrification.designSRT.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Safety Factor:</span>
                <span>{nitrification.safetyFactor.toFixed(1)}x</span>
              </div>
            </div>
            <div className="border-t border-blue-200 mt-2 pt-2">
              <div className="flex justify-between text-xs text-red-600">
                <span>O₂ Required:</span>
                <span>{nitrification.o2PerNH4.toFixed(2)} kg O₂/kg N</span>
              </div>
              <div className="flex justify-between text-xs text-amber-600">
                <span>Alk Consumed:</span>
                <span>{nitrification.alkalinityRequired.toFixed(0)} mg/L as CaCO₃</span>
              </div>
            </div>
          </div>
        </div>

        {/* Denitrification */}
        <div className="bg-orange-50 rounded-lg p-3">
          <h5 className="text-sm font-medium text-orange-800 mb-2">Denitrification (NO₃ → N₂)</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">NO₃ to Remove:</span>
              <span>{denitrification.nitrateToRemove.toFixed(1)} mg/L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Effluent NO₃-N:</span>
              <span className="text-green-600">{denitrification.effluentNO3.toFixed(1)} mg/L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Efficiency:</span>
              <span>{denitrification.denitrificationEfficiency.toFixed(1)}%</span>
            </div>
            <div className="border-t border-orange-200 mt-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">SDNR:</span>
                <span>{denitrification.sdnrCorrected.toFixed(3)} g/g·d</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Anoxic Volume:</span>
                <span>{denitrification.anoxicVolume.toFixed(0)} m³</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Anoxic HRT:</span>
                <span>{denitrification.anoxicHRT.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">IR Ratio:</span>
                <span>{denitrification.internalRecycleRatio.toFixed(1)}Q</span>
              </div>
            </div>
            <div className="border-t border-orange-200 mt-2 pt-2">
              <div className="flex justify-between text-xs text-green-600">
                <span>O₂ Credit:</span>
                <span>{denitrification.o2Savings.toFixed(1)} kg/day</span>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>Alk Recovered:</span>
                <span>{denitrification.alkalinityRecovered.toFixed(0)} mg/L as CaCO₃</span>
              </div>
              {denitrification.externalCarbonDose && (
                <div className="flex justify-between text-xs text-amber-600">
                  <span>External Carbon:</span>
                  <span>{denitrification.externalCarbonDose.toFixed(1)} mg/L</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PHOSPHORUS REMOVAL DETAILS
// ============================================

function PhosphorusRemovalDetails({ design }: { design: BNRDesign }) {
  const { phosphorusRemoval } = design

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Phosphorus Removal</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Biological P Removal */}
        <div className={`rounded-lg p-3 ${phosphorusRemoval.ebprEnabled ? 'bg-purple-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h5 className={`text-sm font-medium ${phosphorusRemoval.ebprEnabled ? 'text-purple-800' : 'text-gray-500'}`}>
              Biological P Removal (EBPR)
            </h5>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                phosphorusRemoval.ebprEnabled ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {phosphorusRemoval.ebprEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {phosphorusRemoval.ebprEnabled ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bio-P Removed:</span>
                <span>{phosphorusRemoval.bioP.removal.toFixed(2)} mg/L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Efficiency:</span>
                <span>{phosphorusRemoval.bioP.efficiency.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">P in Sludge:</span>
                <span>{phosphorusRemoval.bioP.sludgeP.toFixed(2)} kg/d</span>
              </div>
              <div className="border-t border-purple-200 mt-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Anaerobic HRT:</span>
                  <span>{phosphorusRemoval.anaerobicHRT.toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Anaerobic Vol:</span>
                  <span>{phosphorusRemoval.anaerobicVolume.toFixed(0)} m³</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">VFA Available:</span>
                  <span>{phosphorusRemoval.vfaAvailable.toFixed(0)} mg/L</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">VFA Required:</span>
                  <span>{phosphorusRemoval.vfaRequired.toFixed(1)} mg/mg P</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Biological phosphorus removal not applicable for this process configuration.
            </div>
          )}
        </div>

        {/* Chemical P Removal */}
        <div className={`rounded-lg p-3 ${phosphorusRemoval.chemPEnabled ? 'bg-cyan-50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h5 className={`text-sm font-medium ${phosphorusRemoval.chemPEnabled ? 'text-cyan-800' : 'text-gray-500'}`}>
              Chemical P Removal
            </h5>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                phosphorusRemoval.chemPEnabled ? 'bg-cyan-200 text-cyan-700' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {phosphorusRemoval.chemPEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {phosphorusRemoval.chemPEnabled ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Chemical:</span>
                <span className="capitalize">{phosphorusRemoval.chemical?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chem-P Removed:</span>
                <span>{phosphorusRemoval.chemPRecipitated.toFixed(2)} mg/L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chemical Dose:</span>
                <span>{phosphorusRemoval.chemicalDose.toFixed(1)} mg/L</span>
              </div>
              <div className="border-t border-cyan-200 mt-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Molar Ratio:</span>
                  <span>{phosphorusRemoval.molarRatio.toFixed(1)} mol/mol P</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Sludge Increase:</span>
                  <span>{(phosphorusRemoval.sludgeIncrease * 1000).toFixed(0)} kg/d</span>
                </div>
                <div className="flex justify-between text-xs text-amber-600">
                  <span>Alk Loss:</span>
                  <span>{Math.abs(phosphorusRemoval.alkalinityLoss).toFixed(0)} mg/L</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span>Daily Cost:</span>
                  <span>฿{phosphorusRemoval.chemicalCost.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Chemical phosphorus removal not enabled. Consider enabling if Bio-P is insufficient.
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Influent TP</div>
            <div className="font-medium">{phosphorusRemoval.totalPInfluent.toFixed(1)} mg/L</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Bio-P Removed</div>
            <div className="font-medium text-purple-600">{phosphorusRemoval.bioP.removal.toFixed(2)} mg/L</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Chem-P Removed</div>
            <div className="font-medium text-cyan-600">{phosphorusRemoval.chemPRecipitated.toFixed(2)} mg/L</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Effluent TP</div>
            <div className={`font-medium ${phosphorusRemoval.effluentTP <= design.target.totalP ? 'text-green-600' : 'text-red-600'}`}>
              {phosphorusRemoval.effluentTP.toFixed(2)} mg/L
            </div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm font-medium">
            Total P Removal: {phosphorusRemoval.totalPRemoval.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MASS BALANCE & ENERGY
// ============================================

function MassBalanceEnergy({ design }: { design: BNRDesign }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Oxygen Demand */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Oxygen Demand</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Carbonaceous:</span>
            <span>{design.oxygenDemand.carbonaceous.toFixed(1)} kg O₂/d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Nitrogenous:</span>
            <span>{design.oxygenDemand.nitrogenous.toFixed(1)} kg O₂/d</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Denitrification Credit:</span>
            <span>-{design.oxygenDemand.denitrificationCredit.toFixed(1)} kg O₂/d</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-medium">
              <span>Net O₂ Demand:</span>
              <span>{design.oxygenDemand.totalNet.toFixed(1)} kg O₂/d</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Peak Demand (1.5x):</span>
              <span>{design.oxygenDemand.peakDemand.toFixed(1)} kg O₂/d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alkalinity Balance */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Alkalinity Balance</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Influent:</span>
            <span>{design.alkalinityBalance.influent.toFixed(0)} mg/L</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Nitrification:</span>
            <span>-{design.alkalinityBalance.consumedNitrification.toFixed(0)} mg/L</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Denitrification:</span>
            <span>+{design.alkalinityBalance.recoveredDenitrification.toFixed(0)} mg/L</span>
          </div>
          {design.alkalinityBalance.consumedChemP > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Chemical P:</span>
              <span>-{design.alkalinityBalance.consumedChemP.toFixed(0)} mg/L</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between font-medium">
              <span>Net Balance:</span>
              <span className={design.alkalinityBalance.netBalance < 50 ? 'text-red-600' : 'text-green-600'}>
                {design.alkalinityBalance.netBalance.toFixed(0)} mg/L
              </span>
            </div>
            {design.alkalinityBalance.supplementRequired > 0 && (
              <div className="flex justify-between text-amber-600 mt-1">
                <span>Supplement Needed:</span>
                <span>{design.alkalinityBalance.supplementRequired.toFixed(0)} kg/d</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sludge Production */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Sludge Production</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Heterotrophic:</span>
            <span>{design.sludgeProduction.heterotrophic.toFixed(1)} kg/d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Autotrophic:</span>
            <span>{design.sludgeProduction.autotrophic.toFixed(1)} kg/d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PAO Sludge:</span>
            <span>{design.sludgeProduction.paoSludge.toFixed(1)} kg/d</span>
          </div>
          {design.sludgeProduction.chemicalSludge > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Chemical Sludge:</span>
              <span>{design.sludgeProduction.chemicalSludge.toFixed(1)} kg/d</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between font-medium">
              <span>Total TSS:</span>
              <span>{design.sludgeProduction.totalTSS.toFixed(1)} kg/d</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Observed Yield:</span>
              <span>{design.sludgeProduction.observedYield.toFixed(2)} kg TSS/kg BOD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Consumption */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Energy Consumption</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Aeration:</span>
            <span>{design.energy.aerationPower.toFixed(1)} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Mixing:</span>
            <span>{design.energy.mixingPower.toFixed(1)} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pumping:</span>
            <span>{design.energy.pumpingPower.toFixed(1)} kW</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-medium">
              <span>Total Power:</span>
              <span>{design.energy.totalPower.toFixed(1)} kW</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Energy:</span>
              <span>{design.energy.dailyEnergy.toFixed(0)} kWh/d</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>kWh/m³:</span>
              <span>{design.energy.kWhPerM3.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>kWh/kg N:</span>
              <span>{design.energy.kWhPerKgN.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COST SUMMARY
// ============================================

function CostSummary({ design }: { design: BNRDesign }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Estimate</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Capital Cost */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Capital Cost (CAPEX)</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tanks:</span>
              <span>฿{(design.cost.capital.tanks / 1e6).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Equipment:</span>
              <span>฿{(design.cost.capital.equipment / 1e6).toFixed(2)}M</span>
            </div>
            {design.cost.capital.chemical > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Chemical System:</span>
                <span>฿{(design.cost.capital.chemical / 1e6).toFixed(2)}M</span>
              </div>
            )}
            <div className="border-t pt-1 font-medium flex justify-between">
              <span>Total CAPEX:</span>
              <span>฿{(design.cost.capital.total / 1e6).toFixed(2)}M</span>
            </div>
          </div>
        </div>

        {/* Operating Cost */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Operating Cost (OPEX/year)</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Energy:</span>
              <span>฿{(design.cost.operating.energy / 1e6).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Chemicals:</span>
              <span>฿{(design.cost.operating.chemicals / 1e6).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sludge Disposal:</span>
              <span>฿{(design.cost.operating.sludgeDisposal / 1e6).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Labor:</span>
              <span>฿{(design.cost.operating.labor / 1e6).toFixed(2)}M</span>
            </div>
            <div className="border-t pt-1 font-medium flex justify-between">
              <span>Total OPEX:</span>
              <span>฿{(design.cost.operating.total / 1e6).toFixed(2)}M/yr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Costs */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-gray-500">Cost per m³</div>
          <div className="font-medium text-blue-700">฿{design.cost.costPerM3.toFixed(2)}</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-gray-500">Cost per kg N</div>
          <div className="font-medium text-green-700">฿{design.cost.costPerKgN.toFixed(0)}</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-xs text-gray-500">Cost per kg P</div>
          <div className="font-medium text-purple-700">฿{design.cost.costPerKgP.toFixed(0)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// VALIDATION ISSUES
// ============================================

function ValidationIssues({ design }: { design: BNRDesign }) {
  const { validation } = design

  if (validation.issues.length === 0 && validation.warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-xl">✅</span>
          <span className="font-medium text-green-700">Design validated - No issues found!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Issues */}
      {validation.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-3">Design Issues</h4>
          <div className="space-y-2">
            {validation.issues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    issue.severity === 'critical'
                      ? 'bg-red-200 text-red-800'
                      : issue.severity === 'warning'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {issue.severity}
                </span>
                <div>
                  <div className="text-sm text-gray-700">
                    <strong>{issue.parameter}:</strong> {issue.message}
                  </div>
                  <div className="text-xs text-gray-500">
                    Current: {issue.currentValue?.toFixed(2)} {issue.unit}{issue.recommendedValue !== undefined && ` | Recommended: ${issue.recommendedValue.toFixed(2)} ${issue.unit}`}
                  </div>
                  {issue.suggestion && (
                    <div className="text-xs text-blue-600 mt-1">{issue.suggestion}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Warnings</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
            {validation.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {validation.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            {validation.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BNRDesigner({
  flowRate,
  influent,
  temperature,
  onDesignComplete,
}: BNRDesignerProps) {
  // State
  const [processType, setProcessType] = useState<BNRProcessType>('a2o')
  const [targetAmmonia, setTargetAmmonia] = useState(2)
  const [targetTN, setTargetTN] = useState(10)
  const [targetTP, setTargetTP] = useState(1)
  const [mlss, setMlss] = useState(3500)
  const [enableChemP, setEnableChemP] = useState(false)
  const [chemPType, setChemPType] = useState<'alum' | 'ferric_chloride' | 'ferric_sulfate' | 'lime' | 'pac'>('ferric_chloride')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [srtOverride, setSrtOverride] = useState<number | undefined>(undefined)
  const [irRatioOverride, setIrRatioOverride] = useState<number | undefined>(undefined)

  // Calculate BNR design
  const design = useMemo((): BNRDesign | null => {
    if (!flowRate || flowRate <= 0) return null

    const input: BNRDesignInput = {
      processType,
      flowRate,
      temperature,
      influent: {
        bod: influent.bod,
        cod: influent.cod,
        tss: influent.tss,
        tkn: influent.tkn || 40,
        ammonia: influent.ammonia || 30,
        totalP: influent.totalP || 8,
        alkalinity: 200,
      },
      target: {
        ammonia: targetAmmonia,
        totalN: targetTN,
        totalP: targetTP,
      },
      mlss,
      srt: srtOverride,
      internalRecycleRatio: irRatioOverride,
      enableChemP,
      chemPType,
    }

    try {
      const result = designBNRSystem(input)
      onDesignComplete?.(result)
      return result
    } catch (error) {
      console.error('BNR design error:', error)
      return null
    }
  }, [
    processType,
    flowRate,
    temperature,
    influent,
    targetAmmonia,
    targetTN,
    targetTP,
    mlss,
    srtOverride,
    irRatioOverride,
    enableChemP,
    chemPType,
    onDesignComplete,
  ])

  if (!design) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Set flow rate and influent parameters to design BNR system.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Process Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Select BNR Process</h3>
        <ProcessSelector selected={processType} onSelect={setProcessType} />
      </div>

      {/* Target Effluent */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Target Effluent Quality</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="bnr-target-ammonia" className="block text-sm font-medium text-gray-700 mb-1">
              Target NH₃-N (mg/L)
            </label>
            <input
              id="bnr-target-ammonia"
              type="number"
              value={targetAmmonia}
              onChange={(e) => setTargetAmmonia(Math.max(0.1, Number(e.target.value) || 0.1))}
              min={0.1}
              max={10}
              step={0.5}
              aria-describedby="bnr-target-ammonia-hint"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span id="bnr-target-ammonia-hint" className="sr-only">Valid range: 0.1 to 10 mg/L</span>
          </div>
          <div>
            <label htmlFor="bnr-target-tn" className="block text-sm font-medium text-gray-700 mb-1">
              Target TN (mg/L)
            </label>
            <input
              id="bnr-target-tn"
              type="number"
              value={targetTN}
              onChange={(e) => setTargetTN(Math.max(3, Number(e.target.value) || 3))}
              min={3}
              max={30}
              step={1}
              aria-describedby="bnr-target-tn-hint"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span id="bnr-target-tn-hint" className="sr-only">Valid range: 3 to 30 mg/L</span>
          </div>
          <div>
            <label htmlFor="bnr-target-tp" className="block text-sm font-medium text-gray-700 mb-1">
              Target TP (mg/L)
            </label>
            <input
              id="bnr-target-tp"
              type="number"
              value={targetTP}
              onChange={(e) => setTargetTP(Math.max(0.1, Number(e.target.value) || 0.1))}
              min={0.1}
              max={5}
              step={0.1}
              aria-describedby="bnr-target-tp-hint"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span id="bnr-target-tp-hint" className="sr-only">Valid range: 0.1 to 5 mg/L</span>
          </div>
        </div>
      </div>

      {/* Design Parameters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">3. Design Parameters</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="bnr-mlss" className="block text-sm font-medium text-gray-700 mb-1">
              MLSS (mg/L)
            </label>
            <input
              id="bnr-mlss"
              type="number"
              value={mlss}
              onChange={(e) => setMlss(Math.max(2000, Number(e.target.value) || 2000))}
              min={2000}
              max={6000}
              step={100}
              aria-describedby="bnr-mlss-hint"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span id="bnr-mlss-hint" className="sr-only">Valid range: 2,000 to 6,000 mg/L</span>
          </div>

          <div className="flex items-center gap-3 col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableChemP}
                onChange={(e) => setEnableChemP(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable Chemical P Polishing</span>
            </label>

            {enableChemP && (
              <>
                <label htmlFor="bnr-chem-type" className="sr-only">Chemical type</label>
                <select
                  id="bnr-chem-type"
                  value={chemPType}
                  onChange={(e) => setChemPType(e.target.value as typeof chemPType)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ferric_chloride">Ferric Chloride</option>
                  <option value="alum">Alum</option>
                  <option value="ferric_sulfate">Ferric Sulfate</option>
                  <option value="pac">PAC</option>
                  <option value="lime">Lime</option>
                </select>
              </>
            )}
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <label htmlFor="bnr-srt-override" className="block text-sm font-medium text-gray-700 mb-1">
                SRT Override (days) - Optional
              </label>
              <input
                id="bnr-srt-override"
                type="number"
                value={srtOverride || ''}
                onChange={(e) => setSrtOverride(e.target.value ? Math.max(5, Math.min(40, Number(e.target.value))) : undefined)}
                min={5}
                max={40}
                step={1}
                placeholder="Auto"
                aria-describedby="bnr-srt-override-hint"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span id="bnr-srt-override-hint" className="sr-only">Valid range: 5 to 40 days, leave empty for auto</span>
            </div>
            <div>
              <label htmlFor="bnr-ir-override" className="block text-sm font-medium text-gray-700 mb-1">
                Internal Recycle Ratio (Q) - Optional
              </label>
              <input
                id="bnr-ir-override"
                type="number"
                value={irRatioOverride || ''}
                onChange={(e) => setIrRatioOverride(e.target.value ? Math.max(0.5, Math.min(6, Number(e.target.value))) : undefined)}
                min={0.5}
                max={6}
                step={0.5}
                placeholder="Auto"
                aria-describedby="bnr-ir-override-hint"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span id="bnr-ir-override-hint" className="sr-only">Valid range: 0.5 to 6Q, leave empty for auto</span>
            </div>
          </div>
        )}
      </div>

      {/* Design Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
        <h3 className="text-lg font-semibold mb-2">{design.processConfig.name}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <div className="text-blue-200">Total Volume</div>
            <div className="font-medium">{design.totalVolume.toFixed(0)} m³</div>
          </div>
          <div>
            <div className="text-blue-200">Total HRT</div>
            <div className="font-medium">{design.totalHRT.toFixed(1)} hours</div>
          </div>
          <div>
            <div className="text-blue-200">Design SRT</div>
            <div className="font-medium">{design.srt.toFixed(1)} days</div>
          </div>
          <div>
            <div className="text-blue-200">MLSS</div>
            <div className="font-medium">{design.mlss.toFixed(0)} mg/L</div>
          </div>
          <div>
            <div className="text-blue-200">Zones</div>
            <div className="font-medium">{design.zones.length}</div>
          </div>
        </div>
      </div>

      {/* Zone Layout */}
      <ZoneLayoutVisualization design={design} />

      {/* Performance & Effluent */}
      <PerformanceSummary design={design} />

      {/* Nitrogen Details */}
      <NitrogenRemovalDetails design={design} />

      {/* Phosphorus Details */}
      <PhosphorusRemovalDetails design={design} />

      {/* Mass Balance & Energy */}
      <MassBalanceEnergy design={design} />

      {/* Cost Summary */}
      <CostSummary design={design} />

      {/* Validation */}
      <ValidationIssues design={design} />
    </div>
  )
}
