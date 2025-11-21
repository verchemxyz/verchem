 'use client'

// VerChem - Electrochemistry Calculator Page

import { useState } from 'react'
import Link from 'next/link'
import {
  calculateCellPotential,
  calculateNernstEquation,
  calculateElectrolysis,
  getAllHalfReactions,
  EXAMPLE_CELLS,
  type NernstResult,
  type ElectrolysisResult,
} from '@/lib/calculations/electrochemistry'
import { FARADAY_CONSTANT } from '@/lib/constants/physical-constants'

export default function ElectrochemistryPage() {
  // Cell Potential Calculator
  const [cathodePotential, setCathodePotential] = useState(0.34)
  const [anodePotential, setAnodePotential] = useState(-0.76)
  const [cellElectrons, setCellElectrons] = useState(2)
  const [cellResult, setCellResult] = useState<ReturnType<
    typeof calculateCellPotential
  > | null>(null)

  // Nernst Equation Calculator
  const [nernstE0, setNernstE0] = useState(1.1)
  const [nernstN, setNernstN] = useState(2)
  const [nernstQ, setNernstQ] = useState(0.1)
  const [nernstTemp, setNernstTemp] = useState(298.15)
  const [nernstResult, setNernstResult] = useState<NernstResult | null>(null)

  // Electrolysis Calculator
  const [current, setCurrent] = useState(10)
  const [time, setTime] = useState(3600)
  const [electronsPerMole, setElectronsPerMole] = useState(2)
  const [molarMass, setMolarMass] = useState(63.55)
  const [isGas, setIsGas] = useState(false)
  const [electrolysisResult, setElectrolysisResult] =
    useState<ElectrolysisResult | null>(null)

  const [activeTab, setActiveTab] = useState<
    'cell-potential' | 'nernst' | 'electrolysis' | 'potentials'
  >('cell-potential')

  const handleCalculateCellPotential = () => {
    const result = calculateCellPotential(
      cathodePotential,
      anodePotential,
      Math.max(1, cellElectrons)
    )
    setCellResult(result)
  }

  const handleCalculateNernst = () => {
    const result = calculateNernstEquation(nernstE0, nernstN, nernstQ, nernstTemp)
    setNernstResult(result)
  }

  const handleCalculateElectrolysis = () => {
    const result = calculateElectrolysis(
      current,
      time,
      electronsPerMole,
      molarMass,
      isGas
    )
    setElectrolysisResult(result)
  }

  const halfReactions = getAllHalfReactions()

  return (
    <div className="min-h-screen hero-gradient-premium">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Electrochemistry</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/electrochemistry/enhanced-page"
              className="badge-premium"
            >
              ⚡ Enhanced (uncertainty)
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">⚡ Redox • Nernst • Electrolysis</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Electrochemistry</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Calculator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cell potential, Nernst equation, and electrolysis calculations
          </p>
        </div>

        {/* Tabs */}
        <div className="premium-card p-0 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('cell-potential')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'cell-potential'
                  ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              Cell Potential
            </button>
            <button
              onClick={() => setActiveTab('nernst')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'nernst'
                  ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              Nernst Equation
            </button>
            <button
              onClick={() => setActiveTab('electrolysis')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'electrolysis'
                  ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              Electrolysis
            </button>
            <button
              onClick={() => setActiveTab('potentials')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'potentials'
                  ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              Standard Potentials
            </button>
          </div>

          {/* Cell Potential Calculator */}
          {activeTab === 'cell-potential' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Cell Potential Calculator</h2>
              <p className="text-sm text-gray-600 mb-6">
                Calculate E°cell = E°cathode - E°anode
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cathode E° (V)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cathodePotential}
                    onChange={(e) => setCathodePotential(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anode E° (V)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={anodePotential}
                    onChange={(e) => setAnodePotential(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อิเล็กตรอนถ่ายโอน (n)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cellElectrons}
                    onChange={(e) =>
                      setCellElectrons(
                        Number.isNaN(parseInt(e.target.value))
                          ? 1
                          : parseInt(e.target.value)
                      )
                    }
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateCellPotential}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate
              </button>

              {cellResult && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">E°cell:</span>
                      <p className="text-2xl font-bold">
                        {cellResult.cellPotential.toFixed(3)} V
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Spontaneous:</span>
                      <p
                        className={`text-2xl font-bold ${
                          cellResult.spontaneous ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {cellResult.spontaneous ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">ΔG°:</span>
                      <p className="text-2xl font-bold">
                        {(cellResult.deltaG / 1000).toFixed(2)} kJ/mol
                      </p>
                      <p className="text-xs text-gray-500">
                        ΔG° = -nF E° โดย n = {cellResult.electrons}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Example Cells */}
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3">Example Cells</h3>
                <div className="space-y-2">
                  {EXAMPLE_CELLS.map((cell, i) => (
                    <div
                      key={i}
                      className="bg-white border border-gray-300 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setCathodePotential(cell.cathodeE0)
                        setAnodePotential(cell.anodeE0)
                      }}
                    >
                      <div className="font-bold">{cell.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {cell.description}
                      </div>
                      <div className="text-xs font-mono mt-1">
                        E°cell = {cell.cellE0} V
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nernst Equation Calculator */}
          {activeTab === 'nernst' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Nernst Equation Calculator</h2>
              <p className="text-sm text-gray-600 mb-6">
                E = E° - (RT/nF)ln(Q) or E = E° - (0.0592/n)log₁₀(Q) at 25°C
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E° (V)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nernstE0}
                    onChange={(e) => setNernstE0(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electrons Transferred (n)
                  </label>
                  <input
                    type="number"
                    value={nernstN}
                    onChange={(e) => setNernstN(parseInt(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reaction Quotient (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nernstQ}
                    onChange={(e) => setNernstQ(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature (K)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nernstTemp}
                    onChange={(e) => setNernstTemp(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateNernst}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate
              </button>

              {nernstResult && (
                <div className="mt-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <span className="text-sm text-gray-600">Cell Potential (E):</span>
                    <p className="text-3xl font-bold">
                      {nernstResult.E.toFixed(4)} V
                    </p>
                  </div>

                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="text-sm font-bold mb-2">Steps:</h3>
                    <ol className="space-y-1 text-sm text-gray-600">
                      {nernstResult.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Electrolysis Calculator */}
          {activeTab === 'electrolysis' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Electrolysis Calculator</h2>
              <p className="text-sm text-gray-600 mb-6">
                Calculate mass, moles, and volume from current and time
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current (A)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={current}
                    onChange={(e) => setCurrent(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electrons per Mole (n)
                  </label>
                  <input
                    type="number"
                    value={electronsPerMole}
                    onChange={(e) => setElectronsPerMole(parseInt(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Molar Mass (g/mol)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={molarMass}
                    onChange={(e) => setMolarMass(parseFloat(e.target.value))}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGas}
                  onChange={(e) => setIsGas(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Calculate volume (for gases)</span>
              </label>

              <button
                onClick={handleCalculateElectrolysis}
                className="btn-premium glow-premium w-full py-3"
              >
                Calculate
              </button>

              {electrolysisResult && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Charge:</span>
                      <p className="text-xl font-bold">
                        {electrolysisResult.charge.toFixed(2)} C
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Moles:</span>
                      <p className="text-xl font-bold">
                        {electrolysisResult.moles.toFixed(6)} mol
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Mass:</span>
                      <p className="text-xl font-bold">
                        {electrolysisResult.mass.toFixed(4)} g
                      </p>
                    </div>
                    {electrolysisResult.volume && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <span className="text-sm text-gray-600">Volume (STP):</span>
                        <p className="text-xl font-bold">
                          {electrolysisResult.volume.toFixed(4)} L
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="text-sm font-bold mb-2">Steps:</h3>
                    <ol className="space-y-1 text-sm text-gray-600">
                      {electrolysisResult.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">
                  Faraday&apos;s Constant
                </h3>
                <p className="text-sm text-blue-800">
                  F = {FARADAY_CONSTANT.toLocaleString()} C/mol
                </p>
              </div>
            </div>
          )}

          {/* Standard Potentials Table */}
          {activeTab === 'potentials' && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                Standard Reduction Potentials
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                E° values at 25°C, 1 M concentration, 1 atm pressure
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Half-Reaction</th>
                      <th className="px-4 py-2 text-right">E° (V)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {halfReactions.map((hr, i) => (
                      <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">
                          {hr.reaction}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-mono font-bold ${
                            hr.E0 > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {hr.E0 > 0 ? '+' : ''}
                          {hr.E0.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 bg-surface rounded-lg p-4">
                <h3 className="text-sm font-bold mb-2 text-primary-600 flex items-center gap-2">
                  <span>💡</span> Legend:
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-600 font-bold mr-2">+</span>
                    Positive E°: Strong oxidizing agent (easily reduced)
                  </li>
                  <li className="flex items-center">
                    <span className="text-red-600 font-bold mr-2">-</span>
                    Negative E°: Strong reducing agent (easily oxidized)
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Electrochemistry • Built with ❤️ for chemistry students worldwide</p>
        </div>
      </footer>
    </div>
  )
}
