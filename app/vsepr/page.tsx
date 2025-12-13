'use client'

// VerChem - VSEPR Geometry Predictor Page

import { useState } from 'react'
import Link from 'next/link'
import VSEPRViewer from '@/components/vsepr/VSEPRViewer'
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
              <p className="text-xs text-muted-foreground">VSEPR Geometry</p>
            </div>
          </Link>
          <Link href="/" className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">🔺 Molecular Shapes • VSEPR Theory</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">VSEPR Geometry</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Predictor
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Predict molecular geometry using VSEPR theory with interactive 3D visualization
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predictor */}
          <div className="lg:col-span-2">
            <div className="premium-card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Predict Geometry</h2>

              {/* Input */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Central Atom
                  </label>
                  <input
                    type="text"
                    value={centralAtom}
                    onChange={(e) => setCentralAtom(e.target.value.trim())}
                    placeholder="e.g., C, N, O"
                    className="input-premium w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Bonds
                  </label>
                  <input
                    type="number"
                    value={numBonds}
                    onChange={(e) => setNumBonds(parseInt(e.target.value) || 1)}
                    min={1}
                    max={6}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Double Bonds
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={numBonds}
                    value={doubleBonds}
                    onChange={(e) => setDoubleBonds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Triple Bonds
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={numBonds}
                    value={tripleBonds}
                    onChange={(e) => setTripleBonds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <button
                onClick={handlePredict}
                className="btn-premium glow-premium w-full py-3"
              >
                Predict Geometry
              </button>

              {error && (
                <div className="mt-4 text-sm text-red-600">{error}</div>
              )}
            </div>

            {/* Common Examples */}
            <div className="premium-card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Common Molecules</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {COMMON_VSEPR_EXAMPLES.map((example) => (
                  <button
                    key={example.formula}
                    onClick={() => handlePreset(example.formula)}
                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    <div className="font-mono font-bold">{example.formula}</div>
                    <div className="text-xs text-gray-600">{example.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            {prediction && (
              <div className="premium-card p-6">
                <h2 className="text-xl font-bold mb-4">Result</h2>

                <div className="mb-6">
                  <VSEPRViewer prediction={prediction} width={500} height={400} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Electron Geometry
                    </h3>
                    <p className="text-lg font-mono">
                      {prediction.electronGeometry}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Molecular Geometry
                    </h3>
                    <p className="text-lg font-mono capitalize">
                      {prediction.molecularGeometry.replace(/-/g, ' ')}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Bond Angle(s)
                    </h3>
                    <p className="text-lg font-mono">
                      {prediction.bondAngles.join('°, ')}°
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Multiple Bonds
                    </h3>
                    <p className="text-lg font-mono">
                      {prediction.doubleBonds} double / {prediction.tripleBonds} triple
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Polarity
                    </h3>
                    <p className="text-lg font-mono capitalize">
                      {prediction.polarity}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Hybridization
                    </h3>
                    <p className="text-lg font-mono">{prediction.hybridization}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Electron Pairs
                    </h3>
                    <p className="text-lg font-mono">
                      {prediction.bondingPairs} bonding + {prediction.lonePairs}{' '}
                      lone
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-blue-800">{prediction.description}</p>
                </div>

                {prediction.examples.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Examples
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {prediction.examples.map((ex, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {prediction.steps.length > 0 && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">
                      Prediction Steps
                    </h3>
                    <ol className="space-y-1 text-sm text-gray-600">
                      {prediction.steps.map((step, i) => (
                        <li key={i}>
                          {i + 1}. {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1">
            {/* About */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h3 className="text-lg font-bold mb-3">About VSEPR</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                <strong>VSEPR Theory</strong> (Valence Shell Electron Pair
                Repulsion) predicts molecular geometry based on the principle
                that electron pairs around a central atom repel each other and
                adopt positions that minimize repulsion.
              </p>

              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-bold mb-2">Key Concepts:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Electron pairs repel each other</li>
                  <li>• Lone pairs repel more than bonding pairs</li>
                  <li>• Geometry depends on total electron pairs</li>
                  <li>• Molecular shape differs from electron geometry</li>
                </ul>
              </div>
            </div>

            {/* All Geometries */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-3">All VSEPR Geometries</h3>
              <div className="space-y-2 text-xs">
                {allGeometries.map((item) => (
                  <div
                    key={item.key}
                    className="bg-gray-50 rounded p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setCentralAtom('X')
                      setNumBonds(item.bondingPairs)
                      setDoubleBonds(0)
                      setTripleBonds(0)
                      const surroundingAtoms = Array(item.bondingPairs).fill('X')
                      setPrediction(predictVSEPRGeometry('X', surroundingAtoms, item.lonePairs))
                    }}
                  >
                    <div className="font-bold capitalize">
                      {item.data.molecularGeometry.replace(/-/g, ' ')}
                    </div>
                    <div className="text-gray-600">
                      {item.bondingPairs} bonds + {item.lonePairs} lone pairs
                    </div>
                    <div className="text-gray-500">
                      {item.data.bondAngles.join('°, ')}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
