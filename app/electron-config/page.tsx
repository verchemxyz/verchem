'use client'

import { useEffect, useState } from 'react'
import {
  CalcShell,
  Card,
  SectionTitle,
  Button,
  Field,
} from '@/components/lab'
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
    <CalcShell
      eyebrow="Atomic structure · orbitals & quantum numbers"
      title="Electron Configuration"
      subtitle="Visualize electron orbitals, quantum numbers, and filling order."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/* Element Selector */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Select element</SectionTitle>

        {/* Atomic Number Input */}
        <Field label="Atomic Number (Z = 1-118)" className="mb-4">
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
              className="input-premium flex-1 text-lg"
            />
            <button
              disabled
              className="px-6 py-2 border border-border bg-muted text-muted-foreground rounded-md font-medium cursor-not-allowed"
              title="Auto-calculates when you change the atomic number"
            >
              Auto-Calculate
            </button>
          </div>
        </Field>

        {/* Quick Element Buttons */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Quick Select:
          </label>
          <div className="flex flex-wrap gap-2">
            {quickElements.map((elem) => (
              <button
                key={elem.Z}
                onClick={() => {
                  setAtomicNumber(elem.Z)
                }}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  atomicNumber === elem.Z
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted hover:border-primary-500/40'
                }`}
              >
                {elem.symbol}
              </button>
            ))}
          </div>
        </div>
      </Card>

        {/* Results */}
        {config && element && (
          <>
            {/* Element Info */}
            <Card className="p-6 border-l-2 border-l-primary-500">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl font-bold mb-2 text-foreground">{element.symbol}</div>
                  <div className="text-2xl font-semibold text-foreground">{element.name}</div>
                  <div className="text-muted-foreground mt-2">
                    Atomic Number: {atomicNumber} | Mass: {element.atomicMass.toFixed(2)} u
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <div className="text-lg font-semibold capitalize text-foreground">
                    {element.category.replace(/-/g, ' ')}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {getPeriodicBlock(config)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Electron Configuration Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Configuration */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  Full Configuration
                </h3>
                <div className="text-2xl font-mono mb-4 text-foreground break-words">{config.fullConfig}</div>

                <h4 className="font-semibold text-foreground mb-2">Noble Gas Notation:</h4>
                <div className="text-xl font-mono text-primary-600 break-words">
                  {config.nobleGasConfig}
                </div>

                {config.exceptions && (
                  <div className="mt-4 p-3 bg-warning/10 border-l-2 border-warning rounded-md">
                    <div className="text-sm font-semibold text-warning-strong">
                      Exception:
                    </div>
                    <div className="text-sm text-muted-foreground">{config.exceptions}</div>
                  </div>
                )}
              </Card>

              {/* Valence Electrons */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground tracking-tight mb-3">
                  Valence Electrons
                </h3>
                <div className="text-4xl font-bold font-mono text-primary-600 mb-4">
                  {config.valenceElectrons}
                </div>
                <div className="text-muted-foreground mb-4">{config.valenceConfig}</div>

                {/* Lewis Dot Structure */}
                <h4 className="font-semibold text-foreground mb-2">Lewis Dot Structure:</h4>
                <div className="flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    {/* Element symbol in center */}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
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
                          className={`absolute ${positions[position]} w-2 h-2 bg-primary-500 rounded-full`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Ion Charge Prediction */}
                <div className="mt-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    Common Ion Charge:
                  </h4>
                  <div className="text-lg font-mono text-foreground">
                    {predictIonCharge(atomicNumber, config.valenceElectrons)
                      .map((charge) => {
                        if (charge > 0) return `${element.symbol}${charge}⁺`
                        if (charge < 0) return `${element.symbol}${Math.abs(charge)}⁻`
                        return `${element.symbol} (neutral)`
                      })
                      .join(', ')}
                  </div>
                </div>
              </Card>
            </div>

            {/* Orbital Box Diagram */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  Orbital Box Diagram
                </h3>
                <Button onClick={startAnimation} disabled={isAnimating}>
                  {isAnimating ? 'Animating...' : 'Animate Filling'}
                </Button>
              </div>

              {/* Animation Progress */}
              {isAnimating && animationSteps[currentStep] && (
                <div className="mb-4 p-4 bg-muted border-l-2 border-l-primary-500 rounded-md">
                  <div className="font-semibold text-foreground">
                    {animationSteps[currentStep].description}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-mono">
                    Configuration: {animationSteps[currentStep].configSoFar}
                  </div>
                </div>
              )}

              {/* Orbital Boxes — subshell colors encode s/p/d/f (data), kept as-is */}
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
                        <div className="text-xs text-muted-foreground">{shape.symbol}</div>
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
                                style={spin ? { color } : undefined}
                              >
                                {spin || <span className="text-muted-foreground/40">○</span>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Orbital type label */}
                      <div className="text-sm text-muted-foreground">{shape.description}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Quantum Numbers Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">
                Quantum Numbers (First 10 Electrons)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-foreground">Electron #</th>
                      <th className="text-left p-2 text-foreground">n (Shell)</th>
                      <th className="text-left p-2 text-foreground">l (Subshell)</th>
                      <th className="text-left p-2 text-foreground">m (Orbital)</th>
                      <th className="text-left p-2 text-foreground">s (Spin)</th>
                      <th className="text-left p-2 text-foreground">Notation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.quantumNumbers.slice(0, 10).map((qn, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted">
                        <td className="p-2 font-semibold text-foreground">{i + 1}</td>
                        <td className="p-2 text-foreground">{qn.n}</td>
                        <td className="p-2 text-foreground">{qn.l}</td>
                        <td className="p-2 text-foreground">{qn.m}</td>
                        <td className="p-2 text-foreground">{qn.s > 0 ? '+½' : '-½'}</td>
                        <td className="p-2 text-muted-foreground font-mono">
                          ({qn.n}, {qn.l}, {qn.m}, {qn.s > 0 ? '+½' : '-½'})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {config.quantumNumbers.length > 10 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Showing first 10 of {config.quantumNumbers.length} electrons
                </div>
              )}
            </Card>

            {/* Theory Section */}
            <Card className="p-6">
              <button
                onClick={() => setShowTheory(!showTheory)}
                className="w-full flex items-center justify-between text-lg font-semibold text-foreground tracking-tight"
              >
                <span>Theory &amp; Principles</span>
                <svg
                  className={`w-5 h-5 text-muted-foreground transition-transform ${showTheory ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {showTheory && (
                <div className="space-y-6 mt-4">
                  {/* Quantum Numbers */}
                  <div>
                    <h4 className="font-semibold text-primary-600 mb-2">Quantum Numbers</h4>
                    {Object.entries(getQuantumNumberExplanation()).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <span className="font-semibold text-foreground">{key.toUpperCase()}:</span>{' '}
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Aufbau Principle */}
                  <div>
                    <h4 className="font-semibold text-primary-600 mb-2">Aufbau Principle</h4>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                      {getAufbauPrincipleExplanation()}
                    </pre>
                  </div>

                  {/* Hund's Rule */}
                  <div>
                    <h4 className="font-semibold text-primary-600 mb-2">Hund&apos;s Rule</h4>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                      {getHundsRuleExplanation()}
                    </pre>
                  </div>

                  {/* Pauli Exclusion */}
                  <div>
                    <h4 className="font-semibold text-primary-600 mb-2">
                      Pauli Exclusion Principle
                    </h4>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                      {getPauliExclusionExplanation()}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
    </CalcShell>
  )
}
