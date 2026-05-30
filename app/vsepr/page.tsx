'use client'

// VerChem - VSEPR Geometry Predictor Page

import { useState } from 'react'
import VSEPRViewer from '@/components/vsepr/VSEPRViewer'
import { CalcShell, Card, SectionTitle, Button, Field, ErrorBanner } from '@/components/lab'
import {
  predictVSEPRGeometry,
  getAllVSEPRGeometries,
  COMMON_VSEPR_EXAMPLES,
  predictFromFormula,
  type VSEPRPrediction,
} from '@/lib/calculations/vsepr-geometry'

export default function VSEPRPage() {
  const [centralAtom, setCentralAtom] = useState('C')
  const [numBonds, setNumBonds] = useState(4)
  const [doubleBonds, setDoubleBonds] = useState(0)
  const [tripleBonds, setTripleBonds] = useState(0)
  const [prediction, setPrediction] = useState<VSEPRPrediction | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePredict = () => {
    setError(null)

    if (!centralAtom.trim()) {
      setError('Please enter a central atom')
      return
    }

    if (numBonds < 1 || numBonds > 6) {
      setError('Number of bonds must be between 1 and 6')
      return
    }

    if (doubleBonds + tripleBonds > numBonds) {
      setError('Double and triple bonds combined cannot exceed the total number of bonds')
      return
    }

    try {
      const surroundingAtoms = Array(numBonds).fill('X')
      const result = predictVSEPRGeometry(centralAtom, surroundingAtoms, 0, {
        doubleBonds,
        tripleBonds,
      })
      setPrediction(result)
    } catch (err) {
      setError(`Error predicting geometry: ${err}`)
    }
  }

  const handlePreset = (formula: string) => {
    const parsed = predictFromFormula(formula)
    if (parsed) {
      setCentralAtom(parsed.centralAtom)
      setNumBonds(parsed.bondingPairs)
      setDoubleBonds(parsed.doubleBonds)
      setTripleBonds(parsed.tripleBonds)
      setPrediction(parsed)
      return
    }

    const defaultCentral = formula.replace(/\d+/g, '').slice(0, 1) || 'C'
    const matchCount = formula.match(/(\d+)/)
    const bonds = matchCount ? parseInt(matchCount[1], 10) : 1
    setCentralAtom(defaultCentral)
    setNumBonds(bonds)
    setDoubleBonds(0)
    setTripleBonds(0)
    const surroundingAtoms = Array(bonds).fill('X')
    setPrediction(predictVSEPRGeometry(defaultCentral, surroundingAtoms))
  }

  const allGeometries = getAllVSEPRGeometries()

  return (
    <CalcShell
      eyebrow="Molecular geometry · VSEPR theory"
      title="VSEPR Geometry Predictor"
      subtitle="Predict molecular geometry using VSEPR theory with interactive 3D visualization."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <SectionTitle className="mb-4">Predict geometry</SectionTitle>

            {/* Input */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Field label="Central atom" htmlFor="central-atom">
                <input
                  id="central-atom"
                  type="text"
                  value={centralAtom}
                  onChange={(e) => setCentralAtom(e.target.value.trim())}
                  placeholder="e.g., C, N, O"
                  className="input-premium w-full"
                />
              </Field>

              <Field label="Number of bonds" htmlFor="num-bonds">
                <input
                  id="num-bonds"
                  type="number"
                  value={numBonds}
                  onChange={(e) => setNumBonds(parseInt(e.target.value) || 1)}
                  min={1}
                  max={6}
                  className="input-premium w-full"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Field label="Double bonds" htmlFor="double-bonds">
                <input
                  id="double-bonds"
                  type="number"
                  min={0}
                  max={numBonds}
                  value={doubleBonds}
                  onChange={(e) => setDoubleBonds(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-premium w-full"
                />
              </Field>
              <Field label="Triple bonds" htmlFor="triple-bonds">
                <input
                  id="triple-bonds"
                  type="number"
                  min={0}
                  max={numBonds}
                  value={tripleBonds}
                  onChange={(e) => setTripleBonds(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-premium w-full"
                />
              </Field>
            </div>

            <Button onClick={handlePredict} className="w-full">
              Predict Geometry
            </Button>

            {error && (
              <div className="mt-4">
                <ErrorBanner>{error}</ErrorBanner>
              </div>
            )}
          </Card>

          {/* Common Examples */}
          <Card className="p-6">
            <SectionTitle className="mb-4">Common molecules</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {COMMON_VSEPR_EXAMPLES.map((example) => (
                <button
                  key={example.formula}
                  onClick={() => handlePreset(example.formula)}
                  className="px-3 py-2 text-sm rounded-md border border-border bg-card hover:bg-muted hover:border-primary-500/40 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div className="font-mono font-bold text-foreground">{example.formula}</div>
                  <div className="text-xs text-muted-foreground">{example.name}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Result */}
          {prediction && (
            <Card className="p-6">
              <SectionTitle className="mb-4">Result</SectionTitle>

              <div className="mb-6">
                <VSEPRViewer prediction={prediction} width={500} height={400} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Electron Geometry
                  </h3>
                  <p className="text-lg font-mono text-foreground">
                    {prediction.electronGeometry}
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Molecular Geometry
                  </h3>
                  <p className="text-lg font-mono capitalize text-foreground">
                    {prediction.molecularGeometry.replace(/-/g, ' ')}
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Bond Angle(s)
                  </h3>
                  <p className="text-lg font-mono text-foreground">
                    {prediction.bondAngles.join('°, ')}°
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Multiple Bonds
                  </h3>
                  <p className="text-lg font-mono text-foreground">
                    {prediction.doubleBonds} double / {prediction.tripleBonds} triple
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Polarity
                  </h3>
                  <p className="text-lg font-mono capitalize text-foreground">
                    {prediction.polarity}
                  </p>
                </div>

                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Hybridization
                  </h3>
                  <p className="text-lg font-mono text-foreground">{prediction.hybridization}</p>
                </div>

                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Electron Pairs
                  </h3>
                  <p className="text-lg font-mono text-foreground">
                    {prediction.bondingPairs} bonding + {prediction.lonePairs}{' '}
                    lone
                  </p>
                </div>
              </div>

              <div className="bg-primary-500/10 border border-primary-500/30 rounded-md p-4 mb-4">
                <h3 className="text-sm font-bold text-primary-700 mb-2">
                  Description
                </h3>
                <p className="text-sm text-foreground">{prediction.description}</p>
              </div>

              {prediction.examples.length > 0 && (
                <div className="bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Examples
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {prediction.examples.map((ex, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-card border border-border rounded-md text-sm font-mono text-foreground"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              {prediction.steps.length > 0 && (
                <div className="mt-6 bg-muted border border-border rounded-md p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">
                    Prediction Steps
                  </h3>
                  <ol className="space-y-1 text-sm text-muted-foreground">
                    {prediction.steps.map((step, i) => (
                      <li key={i}>
                        {i + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* About */}
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-3">About VSEPR</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              <strong className="text-foreground">VSEPR Theory</strong> (Valence Shell Electron Pair
              Repulsion) predicts molecular geometry based on the principle
              that electron pairs around a central atom repel each other and
              adopt positions that minimize repulsion.
            </p>

            <div className="pt-3 border-t border-border">
              <h4 className="text-sm font-bold text-foreground mb-2">Key Concepts:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Electron pairs repel each other</li>
                <li>• Lone pairs repel more than bonding pairs</li>
                <li>• Geometry depends on total electron pairs</li>
                <li>• Molecular shape differs from electron geometry</li>
              </ul>
            </div>
          </Card>

          {/* All Geometries */}
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-3">All VSEPR Geometries</h3>
            <div className="space-y-2 text-xs">
              {allGeometries.map((item) => (
                <div
                  key={item.key}
                  className="bg-muted border border-border rounded-md p-2 hover:bg-accent hover:border-primary-500/40 cursor-pointer transition-colors"
                  onClick={() => {
                    setCentralAtom('X')
                    setNumBonds(item.bondingPairs)
                    setDoubleBonds(0)
                    setTripleBonds(0)
                    const surroundingAtoms = Array(item.bondingPairs).fill('X')
                    setPrediction(predictVSEPRGeometry('X', surroundingAtoms, item.lonePairs))
                  }}
                >
                  <div className="font-bold capitalize text-foreground">
                    {item.data.molecularGeometry.replace(/-/g, ' ')}
                  </div>
                  <div className="text-muted-foreground">
                    {item.bondingPairs} bonds + {item.lonePairs} lone pairs
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {item.data.bondAngles.join('°, ')}°
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </CalcShell>
  )
}
