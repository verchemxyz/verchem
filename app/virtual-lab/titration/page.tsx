'use client'

// VerChem - Virtual Titration Lab

import { useState } from 'react'
import { CalcShell, Card, SectionTitle, Button } from '@/components/lab'
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
    <CalcShell
      eyebrow="Interactive · Real-time pH and color changes"
      title="Acid-Base Titration Lab"
      subtitle="Watch pH changes in real-time as you add titrant drop by drop."
      backHref="/virtual-lab"
      backLabel="Virtual Lab"
      maxWidth="7xl"
    >
      {/* Example Selection */}
      {!isRunning && (
        <Card className="p-6">
          <SectionTitle className="mb-4">Quick start examples</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAMPLE_TITRATIONS.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(index)}
                className="p-4 rounded-md border border-border bg-card hover:border-primary-500 hover:bg-muted transition-colors text-left min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div className="font-bold mb-1 text-foreground">{example.name}</div>
                <div className="text-sm text-muted-foreground">{example.description}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Lab Equipment & Visualization */}
        <div className="space-y-6">
          {/* Lab Equipment Visualization */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Lab equipment</SectionTitle>

            {/* Virtual Lab Setup */}
            <div className="relative h-96 bg-muted border border-border rounded-md p-4 flex items-end justify-center">
              {/* Burette (Titrant) */}
              <div className="absolute top-4 right-12">
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-muted-foreground">Burette</div>
                  <div className="text-xs text-muted-foreground">{base.formula}</div>
                </div>
                <div className="w-12 bg-card border-2 border-border rounded-t-lg h-40 relative">
                  {/* Volume markings */}
                  <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
                    <div className="text-[8px] text-muted-foreground text-right">0</div>
                    <div className="text-[8px] text-muted-foreground text-right">10</div>
                    <div className="text-[8px] text-muted-foreground text-right">20</div>
                    <div className="text-[8px] text-muted-foreground text-right">30</div>
                  </div>
                  {/* Liquid level (titrant) */}
                  {isRunning && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-secondary-500/30 transition-all duration-300"
                      style={{ height: `${Math.min((volumeAdded / 30) * 100, 100)}%` }}
                    />
                  )}
                </div>
                <div className="w-2 h-4 bg-border mx-auto"></div>
              </div>

              {/* Flask (Analyte) */}
              <div className="relative">
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-muted-foreground">Erlenmeyer Flask</div>
                  <div className="text-xs text-muted-foreground">
                    {acid.formula} + {indicator.name}
                  </div>
                </div>
                <svg width="120" height="160" viewBox="0 0 120 160">
                  {/* Flask outline */}
                  <path
                    d="M 40 10 L 40 50 L 20 120 Q 20 140 30 145 L 90 145 Q 100 140 100 120 L 80 50 L 80 10 Z"
                    fill="none"
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="2"
                  />
                  {/* Liquid — indicator color (chemistry-semantic, keep) */}
                  {isRunning && (
                    <path
                      d="M 25 110 L 22 125 Q 22 138 30 142 L 90 142 Q 98 138 98 125 L 95 110 Z"
                      fill={currentColor}
                      opacity="0.8"
                    />
                  )}
                  {/* Flask top */}
                  <rect x="38" y="5" width="44" height="5" fill="currentColor" className="text-border" stroke="currentColor" strokeWidth="1" />
                </svg>

                {/* Volume label */}
                {isRunning && (
                  <div className="text-center mt-2">
                    <div className="text-sm font-medium text-foreground">
                      {acid.volume.toFixed(1)} mL + {volumeAdded.toFixed(1)} mL
                    </div>
                    <div className="text-xs text-muted-foreground">Total: {(acid.volume + volumeAdded).toFixed(1)} mL</div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Status */}
            {isRunning && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-muted border border-border rounded-md p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Volume Added</div>
                  <div className="text-xl font-bold font-mono text-foreground">{volumeAdded.toFixed(1)} mL</div>
                </div>
                <div className="bg-muted border border-border rounded-md p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Current pH</div>
                  <div className="text-xl font-bold font-mono text-foreground">{currentPH.toFixed(2)}</div>
                </div>
                <div className="bg-muted border border-border rounded-md p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Color</div>
                  <div
                    className="w-12 h-12 rounded-full mx-auto border-2 border-border"
                    style={{ backgroundColor: currentColor }}
                  ></div>
                </div>
              </div>
            )}
          </Card>

          {/* Controls */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Controls</SectionTitle>

            {!isRunning ? (
              <Button onClick={startTitration} className="w-full">
                Start Titration
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Button onClick={() => addTitrant(0.1)} className="px-4 py-2">
                    + 0.1 mL
                  </Button>
                  <Button onClick={() => addTitrant(1.0)} className="px-4 py-2">
                    + 1.0 mL
                  </Button>
                  <Button onClick={() => addTitrant(5.0)} className="px-4 py-2">
                    + 5.0 mL
                  </Button>
                </div>
                <Button variant="secondary" onClick={reset} className="w-full">
                  Reset
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right: pH Curve & Data */}
        <div className="space-y-6">
          {/* pH Curve Graph */}
          {result && (
            <Card className="p-6">
              <SectionTitle className="mb-4">pH curve</SectionTitle>

              {/* Plot — series colors encode data, kept */}
              <div className="bg-muted border border-border rounded-md p-4 h-64 relative">
                <svg width="100%" height="100%" viewBox="0 0 400 200" className="border border-border bg-card">
                  {/* Axes */}
                  <line x1="40" y1="180" x2="380" y2="180" stroke="currentColor" className="text-foreground" strokeWidth="2" />
                  <line x1="40" y1="20" x2="40" y2="180" stroke="currentColor" className="text-foreground" strokeWidth="2" />

                  {/* Y-axis labels (pH) */}
                  <text x="10" y="25" fontSize="10" fill="currentColor" className="text-muted-foreground">
                    14
                  </text>
                  <text x="15" y="105" fontSize="10" fill="currentColor" className="text-muted-foreground">
                    7
                  </text>
                  <text x="15" y="185" fontSize="10" fill="currentColor" className="text-muted-foreground">
                    0
                  </text>

                  {/* X-axis label */}
                  <text x="180" y="198" fontSize="10" fill="currentColor" className="text-muted-foreground">
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

              {/* Legend — matches plot series colors */}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>pH Curve</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Equivalence Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span>Current Position</span>
                </div>
              </div>
            </Card>
          )}

          {/* Results */}
          {showResults && result && (
            <Card className="p-6 border-l-2 border-l-success">
              <h3 className="text-xl font-bold mb-4 text-success-strong">Equivalence point reached</h3>
              <div className="space-y-3">
                <div className="bg-muted border border-border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">Equivalence Volume</div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {result.equivalencePoint.volume.toFixed(2)} mL
                  </div>
                </div>
                <div className="bg-muted border border-border rounded-md p-3">
                  <div className="text-sm text-muted-foreground">pH at Equivalence</div>
                  <div className="text-2xl font-bold font-mono text-foreground">{result.equivalencePoint.pH.toFixed(2)}</div>
                </div>
                {result.halfEquivalencePoint && (
                  <div className="bg-muted border border-border rounded-md p-3">
                    <div className="text-sm text-muted-foreground">Half-Equivalence pH (≈ pKa)</div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {result.halfEquivalencePoint.pH.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Setup Info */}
          {!isRunning && (
            <Card className="p-6">
              <SectionTitle className="mb-4">Current setup</SectionTitle>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Analyte (in flask)</div>
                  <div className="font-medium text-foreground">
                    {acid.name} ({acid.formula})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {acid.concentration} M, {acid.volume} mL
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Titrant (in burette)</div>
                  <div className="font-medium text-foreground">
                    {base.name} ({base.formula})
                  </div>
                  <div className="text-sm text-muted-foreground">{base.concentration} M</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Indicator</div>
                  <div className="font-medium text-foreground">{indicator.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Transition: pH {indicator.transitionRange[0]}-{indicator.transitionRange[1]}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="p-6">
        <SectionTitle className="mb-3">How to use</SectionTitle>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Select an example titration or set up your own</li>
          <li>Click &quot;Start Titration&quot; to begin</li>
          <li>Add titrant using the control buttons (0.1, 1.0, or 5.0 mL)</li>
          <li>Watch the flask color change and pH curve update in real-time</li>
          <li>Look for the equivalence point (marked in red on the graph)</li>
          <li>Try different indicators to see which works best</li>
        </ol>
      </Card>
    </CalcShell>
  )
}
