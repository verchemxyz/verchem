'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  calculateElectronConfiguration,
  generateOrbitalFillingAnimation,
  getQuantumNumberExplanation,
  getAufbauPrincipleExplanation,
  getHundsRuleExplanation,
  getPauliExclusionExplanation,
  getOrbitalShape,
  getPeriodicBlock,
  predictIonCharge,
  ORBITAL_COLORS,
  type ElectronConfiguration,
  type AnimationStep,
} from '@/lib/calculations/electron-config'
import { getElementByAtomicNumber } from '@/lib/data/periodic-table'

export default function ElectronConfigPage() {
  const [atomicNumber, setAtomicNumber] = useState(6) // Start with Carbon
  const [config, setConfig] = useState<ElectronConfiguration | null>(null)
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showTheory, setShowTheory] = useState(false)

  // Quick element buttons (common elements)
  const quickElements = [
    { Z: 1, symbol: 'H' },
    { Z: 6, symbol: 'C' },
    { Z: 7, symbol: 'N' },
    { Z: 8, symbol: 'O' },
    { Z: 11, symbol: 'Na' },
    { Z: 17, symbol: 'Cl' },
    { Z: 24, symbol: 'Cr' }, // Exception!
    { Z: 26, symbol: 'Fe' },
    { Z: 29, symbol: 'Cu' }, // Exception!
    { Z: 47, symbol: 'Ag' },
  ]

  // Auto-calculate on mount and when atomicNumber changes
  useEffect(() => {
    if (atomicNumber < 1 || atomicNumber > 118) {
      return
    }
    const element = getElementByAtomicNumber(atomicNumber)
    const result = calculateElectronConfiguration(atomicNumber, element?.symbol || '')
    const animation = generateOrbitalFillingAnimation(atomicNumber)

    setConfig(result)
    setAnimationSteps(animation)
    setCurrentStep(0)
    setIsAnimating(false)
  }, [atomicNumber])

  // Start animation
  const startAnimation = () => {
    setIsAnimating(true)
    setCurrentStep(0)

    let step = 0
    const interval = setInterval(() => {
      step++
      if (step >= animationSteps.length) {
        clearInterval(interval)
        setIsAnimating(false)
        setCurrentStep(animationSteps.length - 1)
      } else {
        setCurrentStep(step)
      }
    }, 500) // 500ms per step
  }

  const element = getElementByAtomicNumber(atomicNumber)

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
              <p className="text-xs text-muted-foreground">Electron Configuration</p>
            </div>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Electron Configuration
          </h1>
          <p className="text-xl text-gray-600">
            Visualize electron orbitals, quantum numbers, and filling order
          </p>
        </div>

        {/* Element Selector */}
        <div className="premium-card p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Select Element</h2>

          {/* Atomic Number Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Atomic Number (Z = 1-118)
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                min="1"
                max="118"
                value={atomicNumber}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  if (value >= 1 && value <= 118) {
                    setAtomicNumber(value)
                  }
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:border-purple-500 focus:outline-none text-lg text-gray-900 dark:text-gray-100"
              />
              <button
                disabled
                className="px-6 py-2 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
                title="Auto-calculates when you change the atomic number"
              >
                Auto-Calculate
              </button>
            </div>
          </div>

          {/* Quick Element Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Select:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickElements.map((elem) => (
                <button
                  key={elem.Z}
                  onClick={() => {
                    setAtomicNumber(elem.Z)
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    atomicNumber === elem.Z
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {elem.symbol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {config && element && (
          <>
            {/* Element Info */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 shadow-lg mb-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl font-bold mb-2">{element.symbol}</div>
                  <div className="text-2xl font-semibold">{element.name}</div>
                  <div className="text-purple-100 mt-2">
                    Atomic Number: {atomicNumber} | Mass: {element.atomicMass.toFixed(2)} u
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-purple-100 mb-1">Category</div>
                  <div className="text-lg font-semibold capitalize">
                    {element.category.replace(/-/g, ' ')}
                  </div>
                  <div className="text-sm text-purple-100 mt-2">
                    {getPeriodicBlock(config)}
                  </div>
                </div>
              </div>
            </div>

            {/* Electron Configuration Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Full Configuration */}
              <div className="bg-white text-gray-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">⚛️</span>
                  Full Configuration
                </h3>
                <div className="text-2xl font-mono mb-4">{config.fullConfig}</div>

                <h4 className="font-semibold text-gray-700 mb-2">Noble Gas Notation:</h4>
                <div className="text-xl font-mono text-purple-600">
                  {config.nobleGasConfig}
                </div>

                {config.exceptions && (
                  <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <div className="text-sm font-semibold text-amber-700">
                      ⚠️ Exception:
                    </div>
                    <div className="text-sm text-amber-600">{config.exceptions}</div>
                  </div>
                )}
              </div>

              {/* Valence Electrons */}
              <div className="bg-white text-gray-900 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="text-2xl">🔵</span>
                  Valence Electrons
                </h3>
                <div className="text-4xl font-bold text-purple-600 mb-4">
                  {config.valenceElectrons}
                </div>
                <div className="text-gray-600 mb-4">{config.valenceConfig}</div>

                {/* Lewis Dot Structure */}
                <h4 className="font-semibold text-gray-700 mb-2">Lewis Dot Structure:</h4>
                <div className="flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    {/* Element symbol in center */}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                      {element.symbol}
                    </div>
                    {/* Electron dots */}
                    {config.electronDots.map((position, i) => {
                      const positions: { [key: string]: string } = {
                        top: 'top-0 left-1/2 -translate-x-1/2',
                        right: 'right-0 top-1/2 -translate-y-1/2',
                        bottom: 'bottom-0 left-1/2 -translate-x-1/2',
                        left: 'left-0 top-1/2 -translate-y-1/2',
                      }
                      return (
                        <div
                          key={i}
                          className={`absolute ${positions[position]} w-2 h-2 bg-purple-600 rounded-full`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Ion Charge Prediction */}
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">
                    Common Ion Charge:
                  </h4>
                  <div className="text-lg">
                    {predictIonCharge(atomicNumber, config.valenceElectrons)
                      .map((charge) => {
                        if (charge > 0) return `${element.symbol}${charge}⁺`
                        if (charge < 0) return `${element.symbol}${Math.abs(charge)}⁻`
                        return `${element.symbol} (neutral)`
                      })
                      .join(', ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Orbital Box Diagram */}
            <div className="premium-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Orbital Box Diagram
                </h3>
                <button
                  onClick={startAnimation}
                  disabled={isAnimating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                >
                  {isAnimating ? 'Animating...' : '▶ Animate Filling'}
                </button>
              </div>

              {/* Animation Progress */}
              {isAnimating && animationSteps[currentStep] && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="font-semibold text-purple-900">
                    {animationSteps[currentStep].description}
                  </div>
                  <div className="text-sm text-purple-700 mt-1">
                    Configuration: {animationSteps[currentStep].configSoFar}
                  </div>
                </div>
              )}

              {/* Orbital Boxes */}
              <div className="space-y-4">
                {config.orbitalBoxDiagram.map((subshell, idx) => {
                  const lSymbol = subshell.subshell.slice(-1)
                  const color = ORBITAL_COLORS[lSymbol] || '#6b7280'
                  const shape = getOrbitalShape(lSymbol)

                  return (
                    <div key={idx} className="flex items-center gap-4">
                      {/* Subshell label */}
                      <div
                        className="w-16 text-center font-bold text-lg"
                        style={{ color }}
                      >
                        {subshell.subshell}
                        <div className="text-xs text-gray-500">{shape.symbol}</div>
                      </div>

                      {/* Orbital boxes */}
                      <div className="flex gap-2">
                        {subshell.boxes.map((box, boxIdx) => (
                          <div
                            key={boxIdx}
                            className="w-16 h-16 border-2 rounded flex flex-col items-center justify-center gap-1"
                            style={{ borderColor: color }}
                          >
                            {box.electrons.map((spin, spinIdx) => (
                              <div
                                key={spinIdx}
                                className="text-2xl font-bold"
                                style={{ color: spin ? color : '#e5e7eb' }}
                              >
                                {spin || '○'}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Orbital type label */}
                      <div className="text-sm text-gray-500">{shape.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quantum Numbers Table */}
            <div className="premium-card p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔢</span>
                Quantum Numbers (First 10 Electrons)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-2">Electron #</th>
                      <th className="text-left p-2">n (Shell)</th>
                      <th className="text-left p-2">l (Subshell)</th>
                      <th className="text-left p-2">m (Orbital)</th>
                      <th className="text-left p-2">s (Spin)</th>
                      <th className="text-left p-2">Notation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.quantumNumbers.slice(0, 10).map((qn, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-semibold">{i + 1}</td>
                        <td className="p-2">{qn.n}</td>
                        <td className="p-2">{qn.l}</td>
                        <td className="p-2">{qn.m}</td>
                        <td className="p-2">{qn.s > 0 ? '+½' : '-½'}</td>
                        <td className="p-2 text-gray-600">
                          ({qn.n}, {qn.l}, {qn.m}, {qn.s > 0 ? '+½' : '-½'})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {config.quantumNumbers.length > 10 && (
                <div className="text-sm text-gray-500 mt-2">
                  Showing first 10 of {config.quantumNumbers.length} electrons
                </div>
              )}
            </div>

            {/* Theory Section */}
            <div className="bg-white text-gray-900 rounded-xl p-6 shadow-lg">
              <button
                onClick={() => setShowTheory(!showTheory)}
                className="w-full flex items-center justify-between text-xl font-bold mb-4"
              >
                <span className="flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  Theory & Principles
                </span>
                <span className="text-2xl">{showTheory ? '▼' : '▶'}</span>
              </button>

              {showTheory && (
                <div className="space-y-6">
                  {/* Quantum Numbers */}
                  <div>
                    <h4 className="font-bold text-purple-600 mb-2">Quantum Numbers</h4>
                    {Object.entries(getQuantumNumberExplanation()).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <span className="font-semibold">{key.toUpperCase()}:</span>{' '}
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Aufbau Principle */}
                  <div>
                    <h4 className="font-bold text-blue-600 mb-2">Aufbau Principle</h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {getAufbauPrincipleExplanation()}
                    </pre>
                  </div>

                  {/* Hund's Rule */}
                  <div>
                    <h4 className="font-bold text-green-600 mb-2">Hund&apos;s Rule</h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {getHundsRuleExplanation()}
                    </pre>
                  </div>

                  {/* Pauli Exclusion */}
                  <div>
                    <h4 className="font-bold text-amber-600 mb-2">
                      Pauli Exclusion Principle
                    </h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {getPauliExclusionExplanation()}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
