'use client'

/**
 * VerChem - ASM1 Biokinetic Simulator Component
 *
 * Professional-grade activated sludge simulation using IWA ASM1 model.
 * Features dynamic simulation, process rate visualization, and effluent prediction.
 *
 * This component competes directly with GPS-X ($15,000) software.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  ASM1StateVariables,
  ASM1ReactorConfig,
  ASM1SimulationResult,
  DEFAULT_ASM1_KINETIC_PARAMS,
  DEFAULT_DOMESTIC_FRACTIONATION,
  DEFAULT_INDUSTRIAL_FRACTIONATION,
} from '@/lib/types/asm1-model'
import {
  runASM1Simulation,
  fractionateInfluent,
  calculateSteadyState,
} from '@/lib/calculations/asm1-model'

// ============================================
// TYPES
// ============================================

interface InfluentConfig {
  source: 'domestic' | 'industrial' | 'custom'
  flowRate: number    // m³/d
  cod: number         // mg/L
  bod: number         // mg/L
  tss: number         // mg/L
  tkn: number         // mg/L
  nh4: number         // mg/L
  alkalinity: number  // mg/L as CaCO3
}

interface ReactorConfig {
  volume: number      // m³
  hrt: number         // hours
  srt: number         // days
  temperature: number // °C
  targetDO: number    // mg/L
  ras: number         // Return activated sludge ratio
}

type SimMode = 'steady_state' | 'dynamic'

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_INFLUENT: InfluentConfig = {
  source: 'domestic',
  flowRate: 1000,
  cod: 500,
  bod: 250,
  tss: 250,
  tkn: 50,
  nh4: 35,
  alkalinity: 250,
}

const DEFAULT_REACTOR: ReactorConfig = {
  volume: 500,
  hrt: 8,
  srt: 15,
  temperature: 25,
  targetDO: 2.0,
  ras: 0.5,
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ASM1Simulator() {
  // State
  const [influent, setInfluent] = useState<InfluentConfig>(DEFAULT_INFLUENT)
  const [reactor, setReactor] = useState<ReactorConfig>(DEFAULT_REACTOR)
  const [mode, setMode] = useState<SimMode>('steady_state')
  const [simDays, setSimDays] = useState(30)
  const [result, setResult] = useState<ASM1SimulationResult | null>(null)
  const [steadyState, setSteadyState] = useState<ASM1StateVariables | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [kineticParams, setKineticParams] = useState(DEFAULT_ASM1_KINETIC_PARAMS)

  // Get fractionation based on source
  const fractionation = useMemo(() => {
    return influent.source === 'industrial'
      ? DEFAULT_INDUSTRIAL_FRACTIONATION
      : DEFAULT_DOMESTIC_FRACTIONATION
  }, [influent.source])

  // Convert to ASM1 influent
  const asm1Influent = useMemo(() => {
    return fractionateInfluent(
      influent.cod,
      influent.tkn,
      influent.nh4,
      influent.alkalinity,
      fractionation
    )
  }, [influent, fractionation])

  // Run simulation
  const runSimulation = useCallback(() => {
    setIsRunning(true)

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        if (mode === 'steady_state') {
          // Quick steady state calculation
          const ss = calculateSteadyState(
            asm1Influent,
            reactor.hrt / 24, // Convert hours to days
            reactor.srt,
            reactor.temperature,
            reactor.targetDO
          )
          setSteadyState(ss)
          setResult(null)
        } else {
          // Full dynamic simulation
          const reactorConfig: ASM1ReactorConfig = {
            type: 'cstr',
            zones: [{
              id: 'main',
              name: 'Aeration Tank',
              volume: reactor.volume,
              aerationMode: 'aerobic',
              targetDO: reactor.targetDO,
              mixingIntensity: 'high',
              hrt: reactor.hrt,
            }],
            totalVolume: reactor.volume,
            totalHRT: reactor.hrt,
            srt: reactor.srt,
            temperature: reactor.temperature,
            recirculation: {
              external: reactor.ras,
              wastage: reactor.volume / reactor.srt,
            },
          }

          const initialState: ASM1StateVariables = {
            ...asm1Influent,
            XBH: 100,  // Start with some seed biomass
            XBA: 10,
            SO: reactor.targetDO,
          }

          const simResult = runASM1Simulation(
            {
              startTime: 0,
              endTime: simDays,
              timeStep: 0.01,
              outputInterval: 1,
              solver: 'rk4',
              initialState,
              kineticParams,
            },
            reactorConfig,
            asm1Influent
          )

          setResult(simResult)
          setSteadyState(simResult.finalState)
        }
      } catch (error) {
        console.error('Simulation error:', error)
      } finally {
        setIsRunning(false)
      }
    }, 100)
  }, [mode, asm1Influent, reactor, simDays, kineticParams])

  // Update influent handler
  const updateInfluent = useCallback((key: keyof InfluentConfig, value: number | string) => {
    setInfluent(prev => ({ ...prev, [key]: value }))
  }, [])

  // Update reactor handler
  const updateReactor = useCallback((key: keyof ReactorConfig, value: number) => {
    setReactor(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🧬</span>
              ASM1 Biokinetic Simulator
            </h2>
            <p className="text-blue-100 mt-1">
              IWA Activated Sludge Model No. 1 - Research-grade simulation
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Competing with</div>
            <div className="text-lg font-bold">GPS-X ($15,000)</div>
            <div className="text-xs text-blue-200">VerChem: FREE</div>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Influent Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">📥</span>
            Influent Characteristics
          </h3>

          {/* Source Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Wastewater Source</label>
            <div className="flex gap-2">
              {(['domestic', 'industrial', 'custom'] as const).map(source => (
                <button
                  key={source}
                  onClick={() => updateInfluent('source', source)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    influent.source === source
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Influent Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Flow Rate (m³/d)</label>
              <input
                type="number"
                value={influent.flowRate}
                onChange={e => updateInfluent('flowRate', Number(e.target.value))}
                min={1}
                max={100000}
                step={100}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">COD (mg/L)</label>
              <input
                type="number"
                value={influent.cod}
                onChange={e => updateInfluent('cod', Number(e.target.value))}
                min={50}
                max={5000}
                step={50}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">BOD₅ (mg/L)</label>
              <input
                type="number"
                value={influent.bod}
                onChange={e => updateInfluent('bod', Number(e.target.value))}
                min={20}
                max={2000}
                step={20}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TSS (mg/L)</label>
              <input
                type="number"
                value={influent.tss}
                onChange={e => updateInfluent('tss', Number(e.target.value))}
                min={20}
                max={2000}
                step={20}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TKN (mg/L)</label>
              <input
                type="number"
                value={influent.tkn}
                onChange={e => updateInfluent('tkn', Number(e.target.value))}
                min={5}
                max={200}
                step={5}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NH₄-N (mg/L)</label>
              <input
                type="number"
                value={influent.nh4}
                onChange={e => updateInfluent('nh4', Number(e.target.value))}
                min={1}
                max={100}
                step={1}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Alkalinity (mg/L as CaCO₃)</label>
              <input
                type="number"
                value={influent.alkalinity}
                onChange={e => updateInfluent('alkalinity', Number(e.target.value))}
                min={50}
                max={500}
                step={10}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Reactor Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🏭</span>
            Reactor Configuration
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Volume (m³)</label>
              <input
                type="number"
                value={reactor.volume}
                onChange={e => updateReactor('volume', Number(e.target.value))}
                min={10}
                max={50000}
                step={50}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">HRT (hours)</label>
              <input
                type="number"
                value={reactor.hrt}
                onChange={e => updateReactor('hrt', Number(e.target.value))}
                min={2}
                max={48}
                step={0.5}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SRT (days)</label>
              <input
                type="number"
                value={reactor.srt}
                onChange={e => updateReactor('srt', Number(e.target.value))}
                min={3}
                max={30}
                step={1}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
              <input
                type="number"
                value={reactor.temperature}
                onChange={e => updateReactor('temperature', Number(e.target.value))}
                min={10}
                max={35}
                step={1}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target DO (mg/L)</label>
              <input
                type="number"
                value={reactor.targetDO}
                onChange={e => updateReactor('targetDO', Number(e.target.value))}
                min={0.5}
                max={6}
                step={0.1}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RAS Ratio</label>
              <input
                type="number"
                value={reactor.ras}
                onChange={e => updateReactor('ras', Number(e.target.value))}
                min={0.2}
                max={2}
                step={0.1}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Simulation Mode */}
          <div className="mt-6 pt-4 border-t dark:border-gray-700">
            <label className="block text-sm font-medium mb-2">Simulation Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('steady_state')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  mode === 'steady_state'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">Steady State</div>
                <div className="text-xs opacity-75">Fast (~50ms)</div>
              </button>
              <button
                onClick={() => setMode('dynamic')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  mode === 'dynamic'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">Dynamic</div>
                <div className="text-xs opacity-75">Time series</div>
              </button>
            </div>

            {mode === 'dynamic' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Simulation Duration (days)</label>
                <input
                  type="number"
                  value={simDays}
                  onChange={e => setSimDays(Number(e.target.value))}
                  min={5}
                  max={365}
                  step={5}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Parameters (Collapsible) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <span className="font-semibold">Advanced Kinetic Parameters</span>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
              Expert
            </span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="px-6 pb-6 border-t dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4">
              Modify ASM1 kinetic parameters. Default values from Henze et al. (1987).
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Heterotrophic Parameters */}
              <div>
                <label className="block text-xs font-medium mb-1">μH (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.muH}
                  onChange={e => setKineticParams(p => ({ ...p, muH: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">KS (mg/L)</label>
                <input
                  type="number"
                  value={kineticParams.KS}
                  onChange={e => setKineticParams(p => ({ ...p, KS: Number(e.target.value) }))}
                  step={1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">bH (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.bH}
                  onChange={e => setKineticParams(p => ({ ...p, bH: Number(e.target.value) }))}
                  step={0.01}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">μA (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.muA}
                  onChange={e => setKineticParams(p => ({ ...p, muA: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">KNH (mg N/L)</label>
                <input
                  type="number"
                  value={kineticParams.KNH}
                  onChange={e => setKineticParams(p => ({ ...p, KNH: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">bA (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.bA}
                  onChange={e => setKineticParams(p => ({ ...p, bA: Number(e.target.value) }))}
                  step={0.01}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">kh (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.kh}
                  onChange={e => setKineticParams(p => ({ ...p, kh: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ηg (-)</label>
                <input
                  type="number"
                  value={kineticParams.etaG}
                  onChange={e => setKineticParams(p => ({ ...p, etaG: Number(e.target.value) }))}
                  step={0.05}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <button
              onClick={() => setKineticParams(DEFAULT_ASM1_KINETIC_PARAMS)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Run Button */}
      <div className="flex justify-center">
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running Simulation...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              Run {mode === 'steady_state' ? 'Steady State' : 'Dynamic'} Simulation
            </span>
          )}
        </button>
      </div>

      {/* Results */}
      {(steadyState || result) && (
        <div className="space-y-6">
          {/* Effluent Quality */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Predicted Effluent Quality
            </h3>

            {result?.effluentQuality && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">COD</div>
                  <div className="text-2xl font-bold text-blue-600">{result.effluentQuality.COD.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">mg/L</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">BOD₅</div>
                  <div className="text-2xl font-bold text-green-600">{result.effluentQuality.BOD5.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">mg/L</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">TSS</div>
                  <div className="text-2xl font-bold text-yellow-600">{result.effluentQuality.TSS.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">mg/L</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">NH₄-N</div>
                  <div className="text-2xl font-bold text-purple-600">{result.effluentQuality.NH4N.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">mg/L</div>
                </div>
              </div>
            )}

            {/* Performance */}
            {result?.performance && (
              <div className="mt-6 pt-4 border-t dark:border-gray-700">
                <h4 className="text-sm font-semibold mb-3">Removal Efficiency</h4>
                <div className="space-y-2">
                  {[
                    { label: 'BOD', value: result.performance.bodRemoval, color: 'bg-green-500' },
                    { label: 'COD', value: result.performance.codRemoval, color: 'bg-blue-500' },
                    { label: 'NH₄-N', value: result.performance.nh4Removal, color: 'bg-purple-500' },
                    { label: 'TN', value: result.performance.tnRemoval, color: 'bg-orange-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">{item.label}</div>
                      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm font-bold text-right">{item.value.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mixed Liquor Composition */}
          {steadyState && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🧫</span>
                Mixed Liquor Composition (ASM1 State Variables)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-3">Variable</th>
                      <th className="text-left py-2 px-3">Description</th>
                      <th className="text-right py-2 px-3">Value</th>
                      <th className="text-left py-2 px-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'XBH', name: 'Active Heterotrophs', unit: 'mg COD/L' },
                      { key: 'XBA', name: 'Active Autotrophs', unit: 'mg COD/L' },
                      { key: 'XP', name: 'Particulate Products', unit: 'mg COD/L' },
                      { key: 'XS', name: 'Slowly Biodegradable', unit: 'mg COD/L' },
                      { key: 'SS', name: 'Readily Biodegradable', unit: 'mg COD/L' },
                      { key: 'SO', name: 'Dissolved Oxygen', unit: 'mg O₂/L' },
                      { key: 'SNH', name: 'Ammonia-N', unit: 'mg N/L' },
                      { key: 'SNO', name: 'Nitrate-N', unit: 'mg N/L' },
                      { key: 'SALK', name: 'Alkalinity', unit: 'mol/m³' },
                    ].map(item => (
                      <tr key={item.key} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">{item.key}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{item.name}</td>
                        <td className="py-2 px-3 text-right font-mono">{(steadyState[item.key as keyof ASM1StateVariables] || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-gray-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MLSS Calculation */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Estimated MLVSS</div>
                    <div className="text-2xl font-bold">
                      {((steadyState.XBH + steadyState.XBA + steadyState.XP + steadyState.XS + steadyState.XI) / 1.42).toFixed(0)} mg/L
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Estimated MLSS</div>
                    <div className="text-2xl font-bold">
                      {((steadyState.XBH + steadyState.XBA + steadyState.XP + steadyState.XS + steadyState.XI) / 1.42 / 0.8).toFixed(0)} mg/L
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Results */}
          {result && mode === 'dynamic' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📈</span>
                Dynamic Simulation Results
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time Steps</div>
                  <div className="text-xl font-bold">{result.computation.totalSteps.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Execution Time</div>
                  <div className="text-xl font-bold">{result.computation.executionTime.toFixed(0)} ms</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Steady State</div>
                  <div className={`text-xl font-bold ${result.steadyState.reached ? 'text-green-600' : 'text-yellow-600'}`}>
                    {result.steadyState.reached ? 'Reached' : 'Not Reached'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Solver</div>
                  <div className="text-xl font-bold uppercase">{result.config.solver}</div>
                </div>
              </div>

              {/* Simple Time Series Chart (ASCII-style for now) */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Biomass Development (XBH)</h4>
                <div className="flex items-end h-32 gap-1">
                  {result.timeSeries.map((point, i) => {
                    const maxXBH = Math.max(...result.timeSeries.map(p => p.state.XBH))
                    const height = (point.state.XBH / maxXBH) * 100
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                        title={`Day ${point.time}: ${point.state.XBH.toFixed(0)} mg/L`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Day 0</span>
                  <span>Day {simDays}</span>
                </div>
              </div>
            </div>
          )}

          {/* Oxygen & Sludge */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">💨</span>
                  Oxygen Demand
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Carbonaceous</span>
                    <span className="font-bold">{result.oxygenDemand.carbonaceous.toFixed(1)} kg O₂/d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Nitrogenous</span>
                    <span className="font-bold">{result.oxygenDemand.nitrogenous.toFixed(1)} kg O₂/d</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-blue-600">{result.oxygenDemand.total.toFixed(1)} kg O₂/d</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-xl">🔶</span>
                  Sludge Production
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">VSS</span>
                    <span className="font-bold">{result.sludgeProduction.totalVSS.toFixed(1)} kg/d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">TSS</span>
                    <span className="font-bold">{result.sludgeProduction.totalTSS.toFixed(1)} kg/d</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                    <span className="font-semibold">Observed Yield</span>
                    <span className="font-bold text-orange-600">{result.sludgeProduction.yieldObserved.toFixed(2)} kg VSS/kg BOD</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Based on IWA Activated Sludge Model No. 1 (Henze et al., 1987).
          Parameters at 20°C with Arrhenius temperature correction.
        </p>
        <p className="mt-1">
          8 biological processes • 13 state variables • Runge-Kutta 4th order solver
        </p>
      </div>
    </div>
  )
}
