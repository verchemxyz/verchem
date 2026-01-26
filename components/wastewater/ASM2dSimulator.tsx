'use client'

/**
 * VerChem - ASM2d Biokinetic Simulator Component
 *
 * Professional-grade activated sludge simulation using IWA ASM2d model.
 * Features biological phosphorus removal with denitrifying PAOs.
 *
 * This component competes directly with GPS-X ($15,000) and BioWin ($5,000).
 */

import { useState, useMemo, useCallback } from 'react'
import {
  ASM2dStateVariables,
  ASM2dSimulationResult,
  ASM2dConventionalInfluent,
  ASM2dReactorConfig,
  ASM2dSimulationConfig,
  DEFAULT_ASM2d_KINETIC_PARAMS,
  DEFAULT_ASM2d_STOICH_PARAMS,
  DEFAULT_ASM2d_TEMP_COEFFS,
  DEFAULT_ASM2d_INITIAL_STATE,
  // DEFAULT_A2O_REACTOR_CONFIG, // Reserved for preset reactor configs
  // DEFAULT_DOMESTIC_COD_FRACTIONATION, // Reserved for auto-fractionation
} from '@/lib/types/asm2d-model'
import {
  runASM2dSimulation,
  // fractionateInfluent, // Reserved for conventional influent conversion
} from '@/lib/calculations/asm2d-model'

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
  tp: number          // mg/L
  po4: number         // mg/L
  vfa: number         // mg/L
  alkalinity: number  // mg/L as CaCO3
}

interface ZoneConfig {
  anaerobic: { hrt: number; volume: number }
  anoxic: { hrt: number; volume: number }
  aerobic: { hrt: number; volume: number; targetDO: number }
}

interface ReactorConfig {
  totalVolume: number
  srt: number
  temperature: number
  internalRecycle: number
  ras: number
}

type SimMode = 'steady_state' | 'dynamic'

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_INFLUENT: InfluentConfig = {
  source: 'domestic',
  flowRate: 10000,
  cod: 400,
  bod: 200,
  tss: 200,
  tkn: 40,
  nh4: 25,
  tp: 8,
  po4: 6,
  vfa: 30,
  alkalinity: 250,
}

const DEFAULT_ZONES: ZoneConfig = {
  anaerobic: { hrt: 1.5, volume: 625 },
  anoxic: { hrt: 2.0, volume: 833 },
  aerobic: { hrt: 6.0, volume: 2500, targetDO: 2.0 },
}

const DEFAULT_REACTOR: ReactorConfig = {
  totalVolume: 3958,
  srt: 15,
  temperature: 20,
  internalRecycle: 2.0,
  ras: 0.5,
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ASM2dSimulator() {
  // State
  const [influent, setInfluent] = useState<InfluentConfig>(DEFAULT_INFLUENT)
  const [zones, setZones] = useState<ZoneConfig>(DEFAULT_ZONES)
  const [reactor, setReactor] = useState<ReactorConfig>(DEFAULT_REACTOR)
  const [mode, setMode] = useState<SimMode>('steady_state')
  const [simDays, setSimDays] = useState(30)
  const [result, setResult] = useState<ASM2dSimulationResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPAOParams, setShowPAOParams] = useState(false)
  const [kineticParams, setKineticParams] = useState(DEFAULT_ASM2d_KINETIC_PARAMS)

  // Convert to ASM2d influent format
  const asm2dInfluent = useMemo((): ASM2dConventionalInfluent => ({
    flowRate: influent.flowRate,
    COD: influent.cod,
    BOD5: influent.bod,
    TSS: influent.tss,
    VSS: influent.tss * 0.8,
    TKN: influent.tkn,
    NH4N: influent.nh4,
    TP: influent.tp,
    PO4P: influent.po4,
    VFA: influent.vfa,
    alkalinity: influent.alkalinity,
  }), [influent])

  // Build reactor config
  const reactorConfig = useMemo((): ASM2dReactorConfig => ({
    type: 'a2o',
    zones: [
      {
        id: 'anaerobic',
        name: 'Anaerobic Zone',
        type: 'anaerobic',
        volume: zones.anaerobic.volume,
        hrt: zones.anaerobic.hrt,
        targetDO: 0,
        mixingIntensity: 0.5,  // Low mixing
      },
      {
        id: 'anoxic',
        name: 'Anoxic Zone',
        type: 'anoxic',
        volume: zones.anoxic.volume,
        hrt: zones.anoxic.hrt,
        targetDO: 0,
        mixingIntensity: 0.8,  // Medium mixing
      },
      {
        id: 'aerobic',
        name: 'Aerobic Zone',
        type: 'aerobic',
        volume: zones.aerobic.volume,
        hrt: zones.aerobic.hrt,
        targetDO: zones.aerobic.targetDO,
        mixingIntensity: 1.0,  // High mixing
      },
    ],
    totalVolume: zones.anaerobic.volume + zones.anoxic.volume + zones.aerobic.volume,
    totalHRT: zones.anaerobic.hrt + zones.anoxic.hrt + zones.aerobic.hrt,
    srt: reactor.srt,
    temperature: reactor.temperature,
    recirculation: {
      internal: reactor.internalRecycle,
      ras: reactor.ras,
      wastage: reactor.totalVolume / reactor.srt / 24,
    },
    enableDPAO: true,   // Enable denitrifying PAO activity
    enableChemP: false, // Disable chemical P precipitation
  }), [zones, reactor])

  // Run simulation
  const runSimulation = useCallback(() => {
    setIsRunning(true)

    setTimeout(() => {
      try {
        const simConfig: ASM2dSimulationConfig = {
          startTime: 0,
          endTime: mode === 'steady_state' ? 50 : simDays,
          timeStep: 0.01,
          outputInterval: mode === 'steady_state' ? 10 : 1,
          mode: mode,
          solver: 'rk4',
          tolerance: 1e-6,
          maxIterations: 1000,
          initialState: DEFAULT_ASM2d_INITIAL_STATE,
        }

        const simResult = runASM2dSimulation(
          simConfig,
          reactorConfig,
          asm2dInfluent,
          {
            kinetic: kineticParams,
            stoich: DEFAULT_ASM2d_STOICH_PARAMS,
            tempCoeffs: DEFAULT_ASM2d_TEMP_COEFFS,
          }
        )

        setResult(simResult)
      } catch (error) {
        console.error('Simulation error:', error)
      } finally {
        setIsRunning(false)
      }
    }, 100)
  }, [mode, asm2dInfluent, reactorConfig, simDays, kineticParams])

  // Update handlers
  const updateInfluent = useCallback((key: keyof InfluentConfig, value: number | string) => {
    setInfluent(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateZone = useCallback((zone: keyof ZoneConfig, key: string, value: number) => {
    setZones(prev => ({
      ...prev,
      [zone]: { ...prev[zone], [key]: value },
    }))
  }, [])

  const updateReactor = useCallback((key: keyof ReactorConfig, value: number) => {
    setReactor(prev => ({ ...prev, [key]: value }))
  }, [])

  // Calculate total HRT
  const totalHRT = zones.anaerobic.hrt + zones.anoxic.hrt + zones.aerobic.hrt

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🦠</span>
              ASM2d Biokinetic Simulator
            </h2>
            <p className="text-green-100 mt-1">
              IWA Activated Sludge Model No. 2d - Biological Phosphorus Removal with dPAOs
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-200">Competing with</div>
            <div className="text-lg font-bold">GPS-X ($15K) / BioWin ($5K)</div>
            <div className="text-xs text-green-200">VerChem: FREE</div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['EBPR', 'dPAO', '21 Processes', '18 Components', 'A2O Config'].map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
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
                      ? 'bg-green-600 text-white'
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
                min={100}
                max={1000000}
                step={1000}
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

            {/* Phosphorus Inputs - Key for ASM2d */}
            <div className="col-span-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                Phosphorus (Key for EBPR)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Total P (mg/L)</label>
                  <input
                    type="number"
                    value={influent.tp}
                    onChange={e => updateInfluent('tp', Number(e.target.value))}
                    min={1}
                    max={50}
                    step={0.5}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">PO₄-P (mg/L)</label>
                  <input
                    type="number"
                    value={influent.po4}
                    onChange={e => updateInfluent('po4', Number(e.target.value))}
                    min={1}
                    max={40}
                    step={0.5}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* VFA Input - Critical for PAO */}
            <div className="col-span-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                VFA (Critical for PAO Activity)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">VFA as Acetate (mg/L)</label>
                  <input
                    type="number"
                    value={influent.vfa}
                    onChange={e => updateInfluent('vfa', Number(e.target.value))}
                    min={0}
                    max={200}
                    step={5}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Alkalinity (mg/L CaCO₃)</label>
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
          </div>
        </div>

        {/* Reactor Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🏭</span>
            A2O Reactor Configuration
          </h3>

          {/* Zone Visual */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1">
                {/* Anaerobic */}
                <div className="flex-1 text-center">
                  <div className="h-16 bg-gradient-to-b from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    Anaerobic
                  </div>
                  <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {zones.anaerobic.hrt}h
                  </div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                {/* Anoxic */}
                <div className="flex-1 text-center">
                  <div className="h-16 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    Anoxic
                  </div>
                  <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {zones.anoxic.hrt}h
                  </div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                {/* Aerobic */}
                <div className="flex-1 text-center">
                  <div className="h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    Aerobic
                  </div>
                  <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {zones.aerobic.hrt}h
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-2 text-sm font-medium">
              Total HRT: {totalHRT.toFixed(1)} hours
            </div>
          </div>

          {/* Zone Parameters */}
          <div className="space-y-4">
            {/* Anaerobic Zone */}
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span className="font-medium text-sm">Anaerobic Zone</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">HRT (hours)</label>
                  <input
                    type="number"
                    value={zones.anaerobic.hrt}
                    onChange={e => updateZone('anaerobic', 'hrt', Number(e.target.value))}
                    min={0.5}
                    max={4}
                    step={0.5}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    value={zones.anaerobic.volume}
                    onChange={e => updateZone('anaerobic', 'volume', Number(e.target.value))}
                    min={100}
                    max={10000}
                    step={100}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Anoxic Zone */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-sm">Anoxic Zone</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">HRT (hours)</label>
                  <input
                    type="number"
                    value={zones.anoxic.hrt}
                    onChange={e => updateZone('anoxic', 'hrt', Number(e.target.value))}
                    min={0.5}
                    max={6}
                    step={0.5}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    value={zones.anoxic.volume}
                    onChange={e => updateZone('anoxic', 'volume', Number(e.target.value))}
                    min={100}
                    max={20000}
                    step={100}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Aerobic Zone */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-sm">Aerobic Zone</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1">HRT (hours)</label>
                  <input
                    type="number"
                    value={zones.aerobic.hrt}
                    onChange={e => updateZone('aerobic', 'hrt', Number(e.target.value))}
                    min={2}
                    max={12}
                    step={0.5}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    value={zones.aerobic.volume}
                    onChange={e => updateZone('aerobic', 'volume', Number(e.target.value))}
                    min={200}
                    max={50000}
                    step={100}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">DO (mg/L)</label>
                  <input
                    type="number"
                    value={zones.aerobic.targetDO}
                    onChange={e => updateZone('aerobic', 'targetDO', Number(e.target.value))}
                    min={0.5}
                    max={6}
                    step={0.5}
                    className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Parameters */}
          <div className="mt-6 pt-4 border-t dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-3">System Parameters</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SRT (days)</label>
                <input
                  type="number"
                  value={reactor.srt}
                  onChange={e => updateReactor('srt', Number(e.target.value))}
                  min={5}
                  max={40}
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
                <label className="block text-sm font-medium mb-1">Internal Recycle (Q)</label>
                <input
                  type="number"
                  value={reactor.internalRecycle}
                  onChange={e => updateReactor('internalRecycle', Number(e.target.value))}
                  min={0}
                  max={6}
                  step={0.5}
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
                <div className="text-xs opacity-75">Fast (~100ms)</div>
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

      {/* PAO Parameters (Collapsible) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowPAOParams(!showPAOParams)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🦠</span>
            <span className="font-semibold">PAO Kinetic Parameters</span>
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
              ASM2d Specific
            </span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${showPAOParams ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPAOParams && (
          <div className="px-6 pb-6 border-t dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4">
              PAO-specific parameters for biological phosphorus removal. Default values from Henze et al. (1999).
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">μPAO (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.muPAO}
                  onChange={e => setKineticParams(p => ({ ...p, muPAO: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">qPHA (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.qPHA}
                  onChange={e => setKineticParams(p => ({ ...p, qPHA: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">qPP (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.qPP}
                  onChange={e => setKineticParams(p => ({ ...p, qPP: Number(e.target.value) }))}
                  step={0.1}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">ηNO3,PAO (-)</label>
                <input
                  type="number"
                  value={kineticParams.etaNO3_PAO}
                  onChange={e => setKineticParams(p => ({ ...p, etaNO3_PAO: Number(e.target.value) }))}
                  step={0.05}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="text-xs text-gray-500 mt-1">dPAO factor</div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">KMAX (g P/g COD)</label>
                <input
                  type="number"
                  value={kineticParams.KMAX}
                  onChange={e => setKineticParams(p => ({ ...p, KMAX: Number(e.target.value) }))}
                  step={0.01}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">bPAO (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.bPAO}
                  onChange={e => setKineticParams(p => ({ ...p, bPAO: Number(e.target.value) }))}
                  step={0.01}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">bPP (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.bPP}
                  onChange={e => setKineticParams(p => ({ ...p, bPP: Number(e.target.value) }))}
                  step={0.01}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">bPHA (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.bPHA}
                  onChange={e => setKineticParams(p => ({ ...p, bPHA: Number(e.target.value) }))}
                  step={0.01}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <button
              onClick={() => setKineticParams(DEFAULT_ASM2d_KINETIC_PARAMS)}
              className="mt-4 text-sm text-green-600 hover:underline"
            >
              Reset to defaults
            </button>
          </div>
        )}
      </div>

      {/* Advanced Kinetic Parameters (Collapsible) */}
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
              Heterotroph and autotroph parameters. Default values from Henze et al. (1999).
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <label className="block text-xs font-medium mb-1">μAUT (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.muAUT}
                  onChange={e => setKineticParams(p => ({ ...p, muAUT: Number(e.target.value) }))}
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
                <label className="block text-xs font-medium mb-1">bAUT (1/d)</label>
                <input
                  type="number"
                  value={kineticParams.bAUT}
                  onChange={e => setKineticParams(p => ({ ...p, bAUT: Number(e.target.value) }))}
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
                <label className="block text-xs font-medium mb-1">ηG (-)</label>
                <input
                  type="number"
                  value={kineticParams.etaG}
                  onChange={e => setKineticParams(p => ({ ...p, etaG: Number(e.target.value) }))}
                  step={0.05}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
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
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
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
      {result && (
        <div className="space-y-6">
          {/* Effluent Quality */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Predicted Effluent Quality
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center border-2 border-emerald-300">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Total P</div>
                <div className="text-2xl font-bold text-emerald-600">{result.effluentQuality.TP.toFixed(2)}</div>
                <div className="text-xs text-gray-500">mg/L</div>
              </div>
            </div>

            {/* Performance */}
            <div className="mt-6 pt-4 border-t dark:border-gray-700">
              <h4 className="text-sm font-semibold mb-3">Removal Efficiency</h4>
              <div className="space-y-2">
                {[
                  { label: 'BOD', value: result.performance.bodRemoval, color: 'bg-green-500' },
                  { label: 'COD', value: result.performance.codRemoval, color: 'bg-blue-500' },
                  { label: 'NH₄-N', value: result.performance.nh4Removal, color: 'bg-purple-500' },
                  { label: 'TN', value: result.performance.tnRemoval, color: 'bg-orange-500' },
                  { label: 'TP (Bio)', value: result.performance.tpRemoval, color: 'bg-emerald-500' },
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
          </div>

          {/* PAO Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🦠</span>
              PAO Status (Phosphorus Accumulating Organisms)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">XPAO</div>
                <div className="text-2xl font-bold text-green-600">{result.paoMetrics.XPAO.toFixed(0)}</div>
                <div className="text-xs text-gray-500">mg COD/L</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">PAO Fraction</div>
                <div className="text-2xl font-bold text-purple-600">{result.paoMetrics.paoFraction.toFixed(1)}</div>
                <div className="text-xs text-gray-500">% of biomass</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">PHA/PAO Ratio</div>
                <div className="text-2xl font-bold text-blue-600">{result.paoMetrics.phaRatio.toFixed(3)}</div>
                <div className="text-xs text-gray-500">mg/mg</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">PP/PAO Ratio</div>
                <div className="text-2xl font-bold text-yellow-600">{result.paoMetrics.ppRatio.toFixed(3)}</div>
                <div className="text-xs text-gray-500">mg/mg (KMAX={kineticParams.KMAX})</div>
              </div>
            </div>

            {/* dPAO Activity */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">dPAO Activity</div>
                  <div className="text-lg font-bold">{result.paoMetrics.dpaoActivity.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Denitrifying PAO contribution</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">P Release Rate</div>
                  <div className="text-lg font-bold text-red-600">{result.paoMetrics.pReleaseRate.toFixed(3)} mg P/L/h</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">P Uptake Rate</div>
                  <div className="text-lg font-bold text-green-600">{result.paoMetrics.pUptakeRate.toFixed(3)} mg P/L/h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phosphorus Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🔄</span>
              Phosphorus Mass Balance
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Influent P</div>
                <div className="text-2xl font-bold text-blue-600">{result.phosphorusBalance.influentLoad.toFixed(1)}</div>
                <div className="text-xs text-gray-500">kg P/d</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Effluent P</div>
                <div className="text-2xl font-bold text-red-600">{result.phosphorusBalance.effluentLoad.toFixed(1)}</div>
                <div className="text-xs text-gray-500">kg P/d</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Sludge P</div>
                <div className="text-2xl font-bold text-yellow-600">{result.phosphorusBalance.sludgeP.toFixed(1)}</div>
                <div className="text-xs text-gray-500">kg P/d</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Bio-P Removal</div>
                <div className="text-2xl font-bold text-green-600">{result.phosphorusBalance.bioP.toFixed(1)}</div>
                <div className="text-xs text-gray-500">kg P/d</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">Closure</div>
                <div className={`text-2xl font-bold ${
                  Math.abs(result.phosphorusBalance.closure - 100) < 10 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {result.phosphorusBalance.closure.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Mass balance</div>
              </div>
            </div>
          </div>

          {/* Mixed Liquor Composition */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🧫</span>
              Mixed Liquor Composition (ASM2d State Variables)
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
                    { key: 'XH', name: 'Active Heterotrophs', unit: 'mg COD/L', color: 'text-blue-600' },
                    { key: 'XAUT', name: 'Active Autotrophs', unit: 'mg COD/L', color: 'text-blue-600' },
                    { key: 'XPAO', name: 'PAO Biomass', unit: 'mg COD/L', color: 'text-green-600' },
                    { key: 'XPHA', name: 'PHA Storage', unit: 'mg COD/L', color: 'text-purple-600' },
                    { key: 'XPP', name: 'Poly-Phosphate', unit: 'mg P/L', color: 'text-emerald-600' },
                    { key: 'XS', name: 'Slowly Biodegradable', unit: 'mg COD/L', color: 'text-gray-600' },
                    { key: 'SF', name: 'Fermentable COD', unit: 'mg COD/L', color: 'text-gray-600' },
                    { key: 'SA', name: 'VFA (Acetate)', unit: 'mg COD/L', color: 'text-orange-600' },
                    { key: 'SO', name: 'Dissolved Oxygen', unit: 'mg O₂/L', color: 'text-cyan-600' },
                    { key: 'SNH', name: 'Ammonia-N', unit: 'mg N/L', color: 'text-yellow-600' },
                    { key: 'SNO', name: 'Nitrate-N', unit: 'mg N/L', color: 'text-red-600' },
                    { key: 'SPO4', name: 'Orthophosphate', unit: 'mg P/L', color: 'text-emerald-600' },
                  ].map(item => (
                    <tr key={item.key} className="border-b dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className={`py-2 px-3 font-mono font-bold ${item.color}`}>{item.key}</td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{item.name}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {(result.finalState[item.key as keyof ASM2dStateVariables] || 0).toFixed(2)}
                      </td>
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
                    {((result.finalState.XH + result.finalState.XAUT + result.finalState.XPAO +
                      result.finalState.XPHA + result.finalState.XS + result.finalState.XI + result.finalState.XP) / 1.42).toFixed(0)} mg/L
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Estimated MLSS</div>
                  <div className="text-2xl font-bold">
                    {((result.finalState.XH + result.finalState.XAUT + result.finalState.XPAO +
                      result.finalState.XPHA + result.finalState.XS + result.finalState.XI + result.finalState.XP) / 1.42 / 0.8).toFixed(0)} mg/L
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">P in Sludge</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {result.sludgeProduction.pContent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Computation Metadata */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Time Steps:</span> {result.computation.totalSteps.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Execution Time:</span> {result.computation.executionTime}ms
              </div>
              <div>
                <span className="font-medium">Model:</span> IWA ASM2d (18 components, 21 processes)
              </div>
              <div>
                <span className="font-medium">Reference:</span> Henze et al. (1999)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-200">About ASM2d Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-green-700 dark:text-green-300">
          <div>
            <h4 className="font-semibold mb-2">Key Features</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>18 state variables (vs 13 in ASM1)</li>
              <li>21 biological processes (vs 8 in ASM1)</li>
              <li>PAO (Phosphorus Accumulating Organisms)</li>
              <li>dPAO (Denitrifying PAOs) - unique to ASM2d</li>
              <li>PHA and Poly-P storage dynamics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Applications</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>EBPR (Enhanced Biological Phosphorus Removal)</li>
              <li>A2O and Bardenpho process design</li>
              <li>Nutrient removal optimization</li>
              <li>Process troubleshooting</li>
              <li>Research and education</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
