'use client'

// VerChem - Lewis Structure Generator Page

import { useState } from 'react'
import Link from 'next/link'
import LewisStructureViewer from '@/components/lewis/LewisStructureViewer'
import {
  generateLewisStructure,
  getPreDefinedLewisStructure,
  validateLewisStructure,
  type LewisStructure,
} from '@/lib/calculations/lewis-structure'

export default function LewisPage() {
  const [formula, setFormula] = useState('H2O')
  const [structure, setStructure] = useState<LewisStructure | null>(
    getPreDefinedLewisStructure('H2O')
  )
  const [showFormalCharges, setShowFormalCharges] = useState(true)
  const [showLonePairs, setShowLonePairs] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = () => {
    setError(null)

    if (!formula.trim()) {
      setError('Please enter a molecular formula')
      return
    }

    try {
      // Try pre-defined first
      const predefined = getPreDefinedLewisStructure(formula)
      if (predefined) {
        setStructure(predefined)
        return
      }

      // Generate new structure
      const newStructure = generateLewisStructure(formula)
      setStructure(newStructure)

      // Validate
      const validation = validateLewisStructure(newStructure)
      if (!validation.valid) {
        setError(`Warnings: ${validation.warnings.join(', ')}`)
      }
    } catch (err) {
      setError(`Error generating structure: ${err}`)
    }
  }

  const presetMolecules = [
    { formula: 'H2O', name: 'Water' },
    { formula: 'CO2', name: 'Carbon Dioxide' },
    { formula: 'NH3', name: 'Ammonia' },
    { formula: 'CH4', name: 'Methane' },
    { formula: 'HCl', name: 'Hydrochloric Acid' },
    { formula: 'O2', name: 'Oxygen' },
    { formula: 'N2', name: 'Nitrogen' },
    { formula: 'Cl2', name: 'Chlorine' },
  ]

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
              <p className="text-xs text-muted-foreground">Lewis Structures</p>
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
          <div className="badge-premium mb-4">⚛️ Electron Dot Structures • Octet Rule</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Lewis Structure</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Generator
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatic generation of Lewis dot structures with formal charges and lone pairs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator */}
          <div className="lg:col-span-2">
            <div className="premium-card p-6">
              <h2 className="text-xl font-bold mb-4">Generate Structure</h2>

              {/* Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Molecular Formula
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="e.g., H2O, CO2, NH3"
                    className="input-premium flex-1"
                  />
                  <button
                    onClick={handleGenerate}
                    className="btn-premium glow-premium px-6 py-2"
                  >
                    Generate
                  </button>
                </div>

                {error && (
                  <div className="mt-2 text-sm text-red-600">{error}</div>
                )}
              </div>

              {/* Presets */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presetMolecules.map((mol) => (
                    <button
                      key={mol.formula}
                      onClick={() => {
                        setFormula(mol.formula)
                        const predefined = getPreDefinedLewisStructure(mol.formula)
                        if (predefined) setStructure(predefined)
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all hover:scale-105 ${
                        formula === mol.formula
                          ? 'border-primary-500 bg-primary-50 text-foreground scale-105'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
                      }`}
                    >
                      <div className="font-mono font-bold">{mol.formula}</div>
                      <div className="text-xs">{mol.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="mb-6 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFormalCharges}
                    onChange={(e) => setShowFormalCharges(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show Formal Charges
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLonePairs}
                    onChange={(e) => setShowLonePairs(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Lone Pairs</span>
                </label>
              </div>

              {/* Viewer */}
              {structure && (
                <div className="flex justify-center">
                  <LewisStructureViewer
                    structure={structure}
                    width={500}
                    height={400}
                    showFormalCharges={showFormalCharges}
                    showLonePairs={showLonePairs}
                  />
                </div>
              )}

              {/* Steps */}
              {structure && structure.steps.length > 0 && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">
                    Generation Steps
                  </h3>
                  <ol className="space-y-1 text-sm text-gray-600">
                    {structure.steps.map((step, i) => (
                      <li key={i}>
                        {i + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1">
            {/* Structure Info */}
            {structure && (
              <div className="premium-card p-4 mb-6">
                <h3 className="text-lg font-bold mb-3">Structure Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formula:</span>
                    <span className="font-mono font-bold">
                      {structure.formula}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valence e⁻:</span>
                    <span className="font-mono">
                      {structure.totalValenceElectrons}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Atoms:</span>
                    <span className="font-mono">{structure.atoms.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Octet:</span>
                    <span
                      className={`font-mono ${
                        structure.octetSatisfied
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {structure.octetSatisfied ? 'Satisfied' : 'Not satisfied'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resonance:</span>
                    <span className="font-mono">
                      {structure.hasResonance ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* About */}
            <div className="premium-card p-4">
              <h3 className="text-lg font-bold mb-3">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Lewis structures show the bonding between atoms and the lone
                electron pairs in a molecule. They help visualize molecular
                geometry and predict chemical behavior.
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold mb-2">How it works:</h4>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Count valence electrons</li>
                  <li>Determine central atom</li>
                  <li>Draw single bonds</li>
                  <li>Complete octets with lone pairs</li>
                  <li>Form multiple bonds if needed</li>
                  <li>Calculate formal charges</li>
                </ol>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold mb-2">Features:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Automatic generation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Formal charge calculation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Lone pair visualization
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Octet rule validation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Step-by-step explanation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Lewis Structures • Built with ❤️ for chemistry education</p>
          <p className="mt-2 text-xs">
            Automatic generation with formal charges and octet rule validation
          </p>
        </div>
      </footer>
    </div>
  )
}
