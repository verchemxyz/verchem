'use client'

// VerChem - Virtual Titration Lab

import { useState } from 'react'
import Link from 'next/link'
import {
  simulateTitration,
  EXAMPLE_TITRATIONS,
  getIndicatorColor,
  type Acid,
  type Base,
  type Indicator,
  type TitrationResult,
} from '@/lib/calculations/titration'

export default function TitrationLabPage() {
  // Lab state
  const [acid, setAcid] = useState<Acid>(EXAMPLE_TITRATIONS[0].acid)
  const [base, setBase] = useState<Base>(EXAMPLE_TITRATIONS[0].base)
  const [indicator, setIndicator] = useState<Indicator>(EXAMPLE_TITRATIONS[0].indicator)
  const [volumeAdded, setVolumeAdded] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<TitrationResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Current pH and color
  const [currentPH, setCurrentPH] = useState(0)
  const [currentColor, setCurrentColor] = useState('#ffffff')

  // Load example
  const loadExample = (index: number) => {
    const example = EXAMPLE_TITRATIONS[index]
    setAcid(example.acid)
    setBase(example.base)
    setIndicator(example.indicator)
    setVolumeAdded(0)
    setIsRunning(false)
    setResult(null)
    setShowResults(false)
  }

  // Start titration
  const startTitration = () => {
    const titrationResult = simulateTitration(acid, base, indicator, 0.1)
    setResult(titrationResult)
    setVolumeAdded(0)
    setIsRunning(true)
    setShowResults(false)
    setCurrentPH(titrationResult.initialPH)
    setCurrentColor(getIndicatorColor(indicator, titrationResult.initialPH))
  }

  // Add titrant (1 mL at a time)
  const addTitrant = (amount: number = 1.0) => {
    if (!result) return

    const newVolume = Math.min(volumeAdded + amount, result.equivalencePoint.volume * 2)
    setVolumeAdded(newVolume)

    // Find closest point
    const point = result.points.reduce((prev, curr) =>
      Math.abs(curr.volumeAdded - newVolume) < Math.abs(prev.volumeAdded - newVolume) ? curr : prev
    )

    setCurrentPH(point.pH)
    setCurrentColor(point.color)

    // Check if reached equivalence point
    if (Math.abs(newVolume - result.equivalencePoint.volume) < 0.5) {
      setShowResults(true)
    }
  }

  // Reset
  const reset = () => {
    setVolumeAdded(0)
    setIsRunning(false)
    setResult(null)
    setShowResults(false)
  }

  return (
    <div className="min-h-screen hero-gradient-premium">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/virtual-lab" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Titration Lab</p>
            </div>
          </Link>
          <Link href="/virtual-lab" className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium">
            ← Back to Virtual Lab
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">🧪 Real-Time pH • Color Changes • Interactive</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Acid-Base</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Titration Lab
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch pH changes in real-time as you add titrant drop by drop
          </p>
        </div>

        {/* Example Selection */}
        {!isRunning && (
          <div className="premium-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Quick Start Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXAMPLE_TITRATIONS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => loadExample(index)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:scale-105 transition-all text-left"
                >
                  <div className="font-bold mb-1">{example.name}</div>
                  <div className="text-sm text-gray-600">{example.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Lab Equipment & Visualization */}
          <div className="space-y-6">
            {/* Lab Equipment Visualization */}
            <div className="premium-card p-6">
              <h3 className="text-lg font-bold mb-4">Lab Equipment</h3>

              {/* Virtual Lab Setup */}
              <div className="relative h-96 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 flex items-end justify-center">
                {/* Burette (Titrant) */}
                <div className="absolute top-4 right-12">
                  <div className="text-center mb-2">
                    <div className="text-xs font-medium text-gray-600">Burette</div>
                    <div className="text-xs text-gray-500">{base.formula}</div>
                  </div>
                  <div className="w-12 bg-white border-2 border-gray-400 rounded-t-lg h-40 relative">
                    {/* Volume markings */}
                    <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
                      <div className="text-[8px] text-gray-500 text-right">0</div>
                      <div className="text-[8px] text-gray-500 text-right">10</div>
                      <div className="text-[8px] text-gray-500 text-right">20</div>
                      <div className="text-[8px] text-gray-500 text-right">30</div>
                    </div>
                    {/* Liquid level */}
                    {isRunning && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-200 transition-all duration-300"
                        style={{ height: `${Math.min((volumeAdded / 30) * 100, 100)}%` }}
                      />
                    )}
                  </div>
                  <div className="w-2 h-4 bg-gray-400 mx-auto"></div>
                </div>

                {/* Flask (Analyte) */}
                <div className="relative">
                  <div className="text-center mb-2">
                    <div className="text-xs font-medium text-gray-600">Erlenmeyer Flask</div>
                    <div className="text-xs text-gray-500">
                      {acid.formula} + {indicator.name}
                    </div>
                  </div>
                  <svg width="120" height="160" viewBox="0 0 120 160" className="drop-shadow-lg">
                    {/* Flask outline */}
                    <path
                      d="M 40 10 L 40 50 L 20 120 Q 20 140 30 145 L 90 145 Q 100 140 100 120 L 80 50 L 80 10 Z"
                      fill="none"
                      stroke="#333"
                      strokeWidth="2"
                    />
                    {/* Liquid */}
                    {isRunning && (
                      <path
                        d="M 25 110 L 22 125 Q 22 138 30 142 L 90 142 Q 98 138 98 125 L 95 110 Z"
                        fill={currentColor}
                        opacity="0.8"
                      />
                    )}
                    {/* Flask top */}
                    <rect x="38" y="5" width="44" height="5" fill="#e5e7eb" stroke="#333" strokeWidth="1" />
                  </svg>

                  {/* Volume label */}
                  {isRunning && (
                    <div className="text-center mt-2">
                      <div className="text-sm font-medium">
                        {acid.volume.toFixed(1)} mL + {volumeAdded.toFixed(1)} mL
                      </div>
                      <div className="text-xs text-gray-500">Total: {(acid.volume + volumeAdded).toFixed(1)} mL</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Status */}
              {isRunning && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Volume Added</div>
                    <div className="text-xl font-bold text-blue-900">{volumeAdded.toFixed(1)} mL</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Current pH</div>
                    <div className="text-xl font-bold text-purple-900">{currentPH.toFixed(2)}</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">Color</div>
                    <div
                      className="w-12 h-12 rounded-full mx-auto border-2 border-gray-300"
                      style={{ backgroundColor: currentColor }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="premium-card p-6">
              <h3 className="text-lg font-bold mb-4">Controls</h3>

              {!isRunning ? (
                <button
                  onClick={startTitration}
                  className="btn-premium glow-premium w-full px-6 py-3"
                >
                  Start Titration
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => addTitrant(0.1)}
                      className="btn-premium glow-premium px-4 py-2"
                    >
                      + 0.1 mL
                    </button>
                    <button
                      onClick={() => addTitrant(1.0)}
                      className="btn-premium glow-premium px-4 py-2"
                    >
                      + 1.0 mL
                    </button>
                    <button
                      onClick={() => addTitrant(5.0)}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
                    >
                      + 5.0 mL
                    </button>
                  </div>
                  <button
                    onClick={reset}
                    className="w-full px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: pH Curve & Data */}
          <div className="space-y-6">
            {/* pH Curve Graph */}
            {result && (
              <div className="premium-card p-6">
                <h3 className="text-lg font-bold mb-4">pH Curve</h3>

                {/* Simple ASCII-style graph */}
                <div className="bg-gray-50 rounded-lg p-4 h-64 relative">
                  <svg width="100%" height="100%" viewBox="0 0 400 200" className="border border-gray-300 bg-white">
                    {/* Axes */}
                    <line x1="40" y1="180" x2="380" y2="180" stroke="#333" strokeWidth="2" />
                    <line x1="40" y1="20" x2="40" y2="180" stroke="#333" strokeWidth="2" />

                    {/* Y-axis labels (pH) */}
                    <text x="10" y="25" fontSize="10" fill="#666">
                      14
                    </text>
                    <text x="15" y="105" fontSize="10" fill="#666">
                      7
                    </text>
                    <text x="15" y="185" fontSize="10" fill="#666">
                      0
                    </text>

                    {/* X-axis label */}
                    <text x="180" y="198" fontSize="10" fill="#666">
                      Volume (mL)
                    </text>

                    {/* pH curve */}
                    <polyline
                      points={result.points
                        .filter((_, i) => i % 5 === 0) // Sample every 5th point
                        .map((point) => {
                          const x = 40 + (point.volumeAdded / (result.equivalencePoint.volume * 2)) * 340
                          const y = 180 - (point.pH / 14) * 160
                          return `${x},${y}`
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />

                    {/* Equivalence point marker */}
                    {result.equivalencePoint && (
                      <>
                        <circle
                          cx={40 + (result.equivalencePoint.volume / (result.equivalencePoint.volume * 2)) * 340}
                          cy={180 - (result.equivalencePoint.pH / 14) * 160}
                          r="4"
                          fill="#ef4444"
                        />
                        <line
                          x1={40 + (result.equivalencePoint.volume / (result.equivalencePoint.volume * 2)) * 340}
                          y1="20"
                          x2={40 + (result.equivalencePoint.volume / (result.equivalencePoint.volume * 2)) * 340}
                          y2="180"
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeDasharray="4"
                        />
                      </>
                    )}

                    {/* Current position */}
                    {volumeAdded > 0 && (
                      <circle
                        cx={40 + (volumeAdded / (result.equivalencePoint.volume * 2)) * 340}
                        cy={180 - (currentPH / 14) * 160}
                        r="5"
                        fill="#10b981"
                      />
                    )}
                  </svg>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>pH Curve</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Equivalence Point</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Current Position</span>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {showResults && result && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold mb-4 text-green-900">Equivalence Point Reached! 🎉</h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">Equivalence Volume</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {result.equivalencePoint.volume.toFixed(2)} mL
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">pH at Equivalence</div>
                    <div className="text-2xl font-bold text-gray-900">{result.equivalencePoint.pH.toFixed(2)}</div>
                  </div>
                  {result.halfEquivalencePoint && (
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-600">Half-Equivalence pH (≈ pKa)</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {result.halfEquivalencePoint.pH.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Setup Info */}
            {!isRunning && (
              <div className="premium-card p-6">
                <h3 className="text-lg font-bold mb-4">Current Setup</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Analyte (in flask)</div>
                    <div className="font-medium">
                      {acid.name} ({acid.formula})
                    </div>
                    <div className="text-sm text-gray-500">
                      {acid.concentration} M, {acid.volume} mL
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Titrant (in burette)</div>
                    <div className="font-medium">
                      {base.name} ({base.formula})
                    </div>
                    <div className="text-sm text-gray-500">{base.concentration} M</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Indicator</div>
                    <div className="font-medium">{indicator.name}</div>
                    <div className="text-sm text-gray-500">
                      Transition: pH {indicator.transitionRange[0]}-{indicator.transitionRange[1]}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-900">How to Use</h3>
          <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
            <li>Select an example titration or set up your own</li>
            <li>Click &quot;Start Titration&quot; to begin</li>
            <li>Add titrant using the control buttons (0.1, 1.0, or 5.0 mL)</li>
            <li>Watch the flask color change and pH curve update in real-time</li>
            <li>Look for the equivalence point (marked in red on the graph)</li>
            <li>Try different indicators to see which works best!</li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Titration Lab • Built with ❤️ for chemistry education</p>
          <p className="mt-2 text-xs">
            Watch pH curves in real-time • Safe • Interactive • Free forever
          </p>
        </div>
      </footer>
    </div>
  )
}
