'use client'

import { useState, useMemo } from 'react'
import {
  // ADM1StateVariables, // Reserved for custom state editing
  ADM1ReactorConfig,
  ADM1SimulationConfig,
  ADM1SimulationResult,
  ADM1ConventionalInfluent,
  // ADM1Fractionation, // Reserved for custom fractionation
  SubstrateType,
  SUBSTRATE_CHARACTERISTICS,
  DEFAULT_FRACTIONATIONS,
  DEFAULT_INITIAL_STATE,
  DEFAULT_INITIAL_GAS_PHASE,
} from '@/lib/types/adm1-model'

import {
  runADM1Simulation,
  fractionateInfluent,
  // calculateSteadyState, // Reserved for steady-state analysis
} from '@/lib/calculations/adm1-model'

// ============================================
// TYPES
// ============================================

type SimMode = 'steady_state' | 'dynamic'

interface FeedConfig {
  substrateType: SubstrateType
  Q: number          // Flow rate [m³/d]
  COD: number        // [gCOD/m³]
  VS: number         // [g/m³]
  TKN: number        // [gN/m³]
  NH4_N: number      // [gN/m³]
  alkalinity: number // [gCaCO3/m³]
  pH: number
  temperature: number
}

interface ReactorSettings {
  V_liq: number      // [m³]
  V_gas: number      // [m³]
  temperature: number // [°C]
  HRT: number        // [d]
}

// ============================================
// COMPONENT
// ============================================

export default function ADM1Digester() {
  // Feed configuration
  const [feedConfig, setFeedConfig] = useState<FeedConfig>({
    substrateType: 'mixed_sludge',
    Q: 100,
    COD: 35000,
    VS: 23000,
    TKN: 2000,
    NH4_N: 400,
    alkalinity: 3000,
    pH: 7.0,
    temperature: 35,
  })

  // Reactor configuration
  const [reactorSettings, setReactorSettings] = useState<ReactorSettings>({
    V_liq: 2000,
    V_gas: 200,
    temperature: 35,
    HRT: 20,
  })

  // Simulation settings
  const [simMode, setSimMode] = useState<SimMode>('steady_state')
  const [simDays, setSimDays] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<ADM1SimulationResult | null>(null)
  // Reserved for advanced parameter panel
  const [_showAdvanced, _setShowAdvanced] = useState(false)
  void _showAdvanced; void _setShowAdvanced

  // Update feed when substrate type changes
  const handleSubstrateChange = (type: SubstrateType) => {
    const chars = SUBSTRATE_CHARACTERISTICS[type]
    setFeedConfig(prev => ({
      ...prev,
      substrateType: type,
      COD: chars.COD_typical,
      VS: chars.VS_typical,
      TKN: chars.TKN_typical,
      NH4_N: chars.TKN_typical * 0.2, // Approximate
    }))
    // Update HRT to typical
    setReactorSettings(prev => ({
      ...prev,
      HRT: (chars.HRT_typical[0] + chars.HRT_typical[1]) / 2,
    }))
  }

  // Calculated values
  const calculatedValues = useMemo(() => {
    const OLR = (feedConfig.COD * feedConfig.Q) / (reactorSettings.V_liq * 1000) // kg COD/(m³·d)
    const VSLoading = (feedConfig.VS * feedConfig.Q) / (reactorSettings.V_liq * 1000) // kg VS/(m³·d)
    const Q_calc = reactorSettings.V_liq / reactorSettings.HRT
    return { OLR, VSLoading, Q_calc }
  }, [feedConfig, reactorSettings])

  // Run simulation
  const runSimulation = async () => {
    setIsRunning(true)

    try {
      // Build influent state
      const conventional: ADM1ConventionalInfluent = {
        Q: feedConfig.Q,
        COD: feedConfig.COD,
        VS: feedConfig.VS,
        TS: feedConfig.VS * 1.2,
        TKN: feedConfig.TKN,
        NH4_N: feedConfig.NH4_N,
        alkalinity: feedConfig.alkalinity,
        pH: feedConfig.pH,
        temperature: feedConfig.temperature,
      }

      const fractionation = DEFAULT_FRACTIONATIONS[feedConfig.substrateType]
      const influentState = fractionateInfluent(conventional, fractionation)

      // Build reactor config
      const reactor: ADM1ReactorConfig = {
        type: 'cstr',
        V_liq: reactorSettings.V_liq,
        V_gas: reactorSettings.V_gas,
        temperature: reactorSettings.temperature,
        pressure: 1.0,
        Q_in: feedConfig.Q,
        HRT: reactorSettings.HRT,
      }

      // Build simulation config
      const config: ADM1SimulationConfig = {
        startTime: 0,
        endTime: simMode === 'steady_state' ? reactorSettings.HRT * 5 : simDays,
        timeStep: 0.1,
        outputInterval: simMode === 'steady_state' ? reactorSettings.HRT : 1,
        solver: 'rk4',
        initialState: { ...DEFAULT_INITIAL_STATE },
        initialGasPhase: { ...DEFAULT_INITIAL_GAS_PHASE },
      }

      // Run simulation
      const simResult = runADM1Simulation(config, reactor, influentState)
      setResult(simResult)
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ADM1 Anaerobic Digester Simulator
            </h1>
            <p className="text-green-100 mt-1">
              IWA Anaerobic Digestion Model No. 1 - Biogas Production & COD Removal
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs bg-white/20 px-3 py-1 rounded-full">
              Competing with GPS-X ($15,000)
            </div>
            <div className="text-xs text-green-200 mt-1">
              24 State Variables | 19 Processes
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          {/* Feed Characteristics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">1</span>
              Feed Characteristics
            </h2>

            {/* Substrate Type Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Substrate Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['primary_sludge', 'waste_activated_sludge', 'mixed_sludge', 'food_waste', 'cattle_manure', 'pig_manure'] as SubstrateType[]).map(type => {
                  const chars = SUBSTRATE_CHARACTERISTICS[type]
                  return (
                    <button
                      key={type}
                      onClick={() => handleSubstrateChange(type)}
                      className={`text-left p-3 rounded-lg border-2 transition ${
                        feedConfig.substrateType === type
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{chars.name}</div>
                      <div className="text-xs text-gray-500">{chars.nameThai}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        CH4: {chars.methane_potential} Nm³/kg VS
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Feed Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Flow Rate (m³/d)
                </label>
                <input
                  type="number"
                  value={feedConfig.Q}
                  onChange={e => setFeedConfig(p => ({ ...p, Q: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  COD (g/m³)
                </label>
                <input
                  type="number"
                  value={feedConfig.COD}
                  onChange={e => setFeedConfig(p => ({ ...p, COD: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  VS (g/m³)
                </label>
                <input
                  type="number"
                  value={feedConfig.VS}
                  onChange={e => setFeedConfig(p => ({ ...p, VS: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  TKN (gN/m³)
                </label>
                <input
                  type="number"
                  value={feedConfig.TKN}
                  onChange={e => setFeedConfig(p => ({ ...p, TKN: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Calculated OLR */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">Organic Loading Rate:</span>
                <span className="font-bold text-amber-900">
                  {calculatedValues.OLR.toFixed(2)} kg COD/(m³·d)
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-amber-700">VS Loading:</span>
                <span className="font-bold text-amber-900">
                  {calculatedValues.VSLoading.toFixed(2)} kg VS/(m³·d)
                </span>
              </div>
            </div>
          </div>

          {/* Reactor Configuration */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">2</span>
              Reactor Configuration
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Liquid Volume (m³)
                </label>
                <input
                  type="number"
                  value={reactorSettings.V_liq}
                  onChange={e => setReactorSettings(p => ({ ...p, V_liq: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Headspace Volume (m³)
                </label>
                <input
                  type="number"
                  value={reactorSettings.V_gas}
                  onChange={e => setReactorSettings(p => ({ ...p, V_gas: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={reactorSettings.temperature}
                  onChange={e => setReactorSettings(p => ({ ...p, temperature: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {reactorSettings.temperature < 30 ? 'Psychrophilic' :
                   reactorSettings.temperature < 45 ? 'Mesophilic (optimal)' : 'Thermophilic'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  HRT (days)
                </label>
                <input
                  type="number"
                  value={reactorSettings.HRT}
                  onChange={e => setReactorSettings(p => ({ ...p, HRT: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Typical: {SUBSTRATE_CHARACTERISTICS[feedConfig.substrateType].HRT_typical[0]}-
                  {SUBSTRATE_CHARACTERISTICS[feedConfig.substrateType].HRT_typical[1]} days
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Mode & Run */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">3</span>
              Simulation
            </h2>

            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={simMode === 'steady_state'}
                  onChange={() => setSimMode('steady_state')}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">Steady State</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={simMode === 'dynamic'}
                  onChange={() => setSimMode('dynamic')}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm">Dynamic</span>
              </label>
              {simMode === 'dynamic' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={simDays}
                    onChange={e => setSimDays(parseInt(e.target.value) || 30)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              )}
            </div>

            <button
              onClick={runSimulation}
              disabled={isRunning}
              className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running Simulation...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run ADM1 Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Biogas Production */}
              <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white">
                <h3 className="text-sm font-medium text-green-100 mb-3">Biogas Production</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {result.gasProduction.methane.toFixed(1)}
                    </div>
                    <div className="text-xs text-green-200">Nm³ CH4/d</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {result.gasProduction.methaneContent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-green-200">CH4 Content</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {result.gasProduction.energyPotential.toFixed(0)}
                    </div>
                    <div className="text-xs text-green-200">kWh/d</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-400/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-200">Total Biogas:</span>
                    <span className="font-medium">{result.gasProduction.totalBiogas.toFixed(1)} Nm³/d</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-200">Specific CH4 Yield:</span>
                    <span className="font-medium">{result.gasProduction.specificMethane.toFixed(3)} Nm³/kg COD</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.performance.CODRemoval.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-500">COD Removal</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.performance.VSDestruction.toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-500">VS Destruction</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {result.performance.organicLoadingRate.toFixed(2)}
                    </div>
                    <div className="text-xs text-amber-500">OLR (kg COD/m³·d)</div>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <div className="text-2xl font-bold text-teal-600">
                      {result.performance.volumetricGasRate.toFixed(2)}
                    </div>
                    <div className="text-xs text-teal-500">VGR (Nm³/m³·d)</div>
                  </div>
                </div>
              </div>

              {/* Effluent Quality */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Effluent Quality</h3>
                <div className="space-y-3">
                  {/* pH Indicator */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">pH</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        result.effluentQuality.pH >= 6.8 && result.effluentQuality.pH <= 7.4
                          ? 'text-green-600'
                          : result.effluentQuality.pH >= 6.5 && result.effluentQuality.pH <= 7.8
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}>
                        {result.effluentQuality.pH.toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        result.diagnostics.pHStability === 'stable'
                          ? 'bg-green-100 text-green-700'
                          : result.diagnostics.pHStability === 'marginal'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {result.diagnostics.pHStability}
                      </span>
                    </div>
                  </div>

                  {/* VFA */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total VFA</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {result.effluentQuality.VFA_total.toFixed(0)} mg/L
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        result.diagnostics.VFAAccumulation === 'low'
                          ? 'bg-green-100 text-green-700'
                          : result.diagnostics.VFAAccumulation === 'moderate'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {result.diagnostics.VFAAccumulation}
                      </span>
                    </div>
                  </div>

                  {/* Other parameters */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">COD</span>
                      <span className="font-medium">{result.effluentQuality.COD_total.toFixed(0)} mg/L</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">Acetate</span>
                      <span className="font-medium">{result.effluentQuality.VFA_acetate.toFixed(0)} mg/L</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">Propionate</span>
                      <span className="font-medium">{result.effluentQuality.VFA_propionate.toFixed(0)} mg/L</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-500">NH4-N</span>
                      <span className="font-medium">{result.effluentQuality.NH4_N.toFixed(0)} mg/L</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VFA Profile Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">VFA Profile</h3>
                <VFAChart
                  acetate={result.effluentQuality.VFA_acetate}
                  propionate={result.effluentQuality.VFA_propionate}
                  butyrate={result.effluentQuality.VFA_butyrate}
                  valerate={result.effluentQuality.VFA_valerate}
                />
              </div>

              {/* Process Rates (Top 5) */}
              {result.timeSeries.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Key Process Rates</h3>
                  <div className="space-y-2">
                    {result.timeSeries[result.timeSeries.length - 1].processRates
                      .filter(p => p.rate > 0.01)
                      .sort((a, b) => b.rate - a.rate)
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.nameThai}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900">
                              {p.rate.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">g/(m³·d)</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Computation Info */}
              <div className="text-xs text-gray-400 text-center">
                Simulation completed in {result.computation.executionTime.toFixed(0)} ms
                ({result.computation.totalSteps.toLocaleString()} steps)
              </div>
            </>
          ) : (
            /* Placeholder when no results */
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No Results Yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure your digester and click &quot;Run ADM1 Simulation&quot;
                to see biogas production and performance metrics.
              </p>
              <div className="text-xs text-gray-400">
                The ADM1 model simulates anaerobic digestion with 24 state variables
                and 19 biochemical processes.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm">About ADM1</h4>
            <p className="text-xs text-gray-600 mt-1">
              The IWA Anaerobic Digestion Model No. 1 (ADM1) is the international standard for modeling
              anaerobic digestion processes. It includes acidogenesis, acetogenesis, and methanogenesis
              pathways with inhibition by pH, hydrogen, and ammonia.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Reference: Batstone, D.J. et al. (2002) IWA Scientific and Technical Report No. 13
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function VFAChart({ acetate, propionate, butyrate, valerate }: {
  acetate: number
  propionate: number
  butyrate: number
  valerate: number
}) {
  const total = acetate + propionate + butyrate + valerate
  if (total === 0) return <div className="text-sm text-gray-400 text-center py-4">No VFA data</div>

  const data = [
    { name: 'Acetate', value: acetate, color: '#3B82F6' },
    { name: 'Propionate', value: propionate, color: '#F59E0B' },
    { name: 'Butyrate', value: butyrate, color: '#10B981' },
    { name: 'Valerate', value: valerate, color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.name} className="flex items-center gap-3">
          <div className="w-20 text-xs text-gray-600">{d.name}</div>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(d.value / total) * 100}%`,
                backgroundColor: d.color,
              }}
            />
          </div>
          <div className="w-20 text-right text-xs font-medium text-gray-700">
            {d.value.toFixed(0)} mg/L
          </div>
        </div>
      ))}
    </div>
  )
}
