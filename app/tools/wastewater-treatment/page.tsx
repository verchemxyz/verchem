'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  WastewaterQuality,
  TreatmentUnit,
  TreatmentSystem,
  UnitType,
  UNIT_METADATA,
  PRESET_TEMPLATES,
  DEFAULT_INFLUENT,
  THAI_EFFLUENT_STANDARDS,
  PresetTemplate,
  ThaiEffluentType,
  CostEstimation,
  SludgeProduction,
  EnergyConsumption,
  SavedScenario,
  SensitivityAnalysis,
} from '@/lib/types/wastewater-treatment'
import {
  calculateTreatmentTrain,
  getDefaultDesignParams,
  calculateCostEstimation,
  calculateSludgeProduction,
  calculateEnergyConsumption,
  performSensitivityAnalysis,
} from '@/lib/calculations/wastewater-treatment'
import { WastewaterReportExporter } from '@/lib/export/wastewater-report'

// Import all components from extracted files
import {
  StatusBadge,
  FlowArrow,
  UnitCard,
  InfluentCard,
  EffluentCard,
  SummaryPanel,
  AddUnitModal,
  EditUnitModal,
  CostPanel,
  SludgePanel,
  EnergyPanel,
  IssuesPanel,
  TreatmentGraph,
  ScenarioManager,
  RealTimeVisualization,
  SensitivityPanel,
} from '@/components/wastewater'

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
  const costEstimation = useMemo((): CostEstimation | null => {
    if (!system) return null
    try {
      return calculateCostEstimation(system, influent.flowRate)
    } catch {
      return null
    }
  }, [system, influent.flowRate])

  // Calculate sludge production
  const sludgeProduction = useMemo((): SludgeProduction | null => {
    if (!system) return null
    try {
      return calculateSludgeProduction(system, influent)
    } catch {
      return null
    }
  }, [system, influent])

  // Calculate energy consumption
  const energyConsumption = useMemo((): EnergyConsumption | null => {
    if (!system) return null
    try {
      return calculateEnergyConsumption(system, influent)
    } catch {
      return null
    }
  }, [system, influent])

  // Sensitivity analysis state
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState<SensitivityAnalysis | null>(null)
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)

  // Run sensitivity analysis
  const handleRunSensitivityAnalysis = useCallback(() => {
    if (!system || unitConfigs.length === 0) return

    setIsRunningAnalysis(true)
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const analysis = performSensitivityAnalysis(
          influent,
          unitConfigs,
          targetStandard,
          'Treatment System'
        )
        setSensitivityAnalysis(analysis)
      } catch (error) {
        console.error('Sensitivity analysis failed:', error)
      } finally {
        setIsRunningAnalysis(false)
      }
    }, 100)
  }, [system, influent, unitConfigs, targetStandard])

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

            {/* Real-Time Simulation */}
            <div className="mb-6">
              <RealTimeVisualization
                system={system}
                influent={influent}
                targetStandard={targetStandard}
              />
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

            {/* Sensitivity Analysis */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700">Sensitivity Analysis (What-If)</h2>
                <button
                  onClick={handleRunSensitivityAnalysis}
                  disabled={isRunningAnalysis || unitConfigs.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg transition shadow-sm"
                >
                  {isRunningAnalysis ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      📊 Run Sensitivity Analysis
                    </>
                  )}
                </button>
              </div>
              {sensitivityAnalysis ? (
                <SensitivityPanel analysis={sensitivityAnalysis} />
              ) : (
                <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-gray-500 text-sm">
                    Click &quot;Run Sensitivity Analysis&quot; to see how input variations affect your system
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Analyzes ±20% variation in flow rate, BOD, COD, TSS and other parameters
                  </p>
                </div>
              )}
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
