'use client'

// VerChem - Lewis Structure Generator Page

import { useState } from 'react'
import LewisStructureViewer from '@/components/lewis/LewisStructureViewer'
import { CalcShell, Card, SectionTitle, Button, ErrorBanner } from '@/components/lab'
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
    <CalcShell
      eyebrow="Electron dot structures · octet rule"
      title="Lewis Structure Generator"
      subtitle="Automatic generation of Lewis dot structures with formal charges and lone pairs."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <SectionTitle className="mb-4">Generate structure</SectionTitle>

            {/* Input */}
            <div className="mb-6">
              <label htmlFor="lewis-formula" className="block text-sm font-medium text-foreground mb-1.5">
                Molecular Formula
              </label>
              <div className="flex gap-2">
                <input
                  id="lewis-formula"
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g., H2O, CO2, NH3"
                  className="input-premium flex-1"
                />
                <Button onClick={handleGenerate} className="px-6 py-2">
                  Generate
                </Button>
              </div>

              {error && (
                <div className="mt-2">
                  <ErrorBanner>{error}</ErrorBanner>
                </div>
              )}
            </div>

            {/* Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
                    className={`px-3 py-2 text-sm rounded-md border transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      formula === mol.formula
                        ? 'border-primary-500 bg-muted text-foreground ring-1 ring-primary-500/40'
                        : 'border-border bg-card text-foreground hover:border-primary-500/40 hover:bg-muted'
                    }`}
                  >
                    <div className="font-mono font-bold">{mol.formula}</div>
                    <div className="text-xs text-muted-foreground">{mol.name}</div>
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
                  className="w-4 h-4 accent-primary-500 border-border rounded focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">
                  Show Formal Charges
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLonePairs}
                  onChange={(e) => setShowLonePairs(e.target.checked)}
                  className="w-4 h-4 accent-primary-500 border-border rounded focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">Show Lone Pairs</span>
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
              <div className="mt-6 bg-muted border border-border rounded-md p-4">
                <h3 className="text-sm font-bold text-foreground mb-2">
                  Generation Steps
                </h3>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  {structure.steps.map((step, i) => (
                    <li key={i}>
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Structure Info */}
          {structure && (
            <Card className="p-4">
              <h3 className="text-lg font-bold text-foreground mb-3">Structure Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formula:</span>
                  <span className="font-mono font-bold text-foreground">
                    {structure.formula}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valence e⁻:</span>
                  <span className="font-mono text-foreground">
                    {structure.totalValenceElectrons}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atoms:</span>
                  <span className="font-mono text-foreground">{structure.atoms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Octet:</span>
                  <span
                    className={`font-mono ${
                      structure.octetSatisfied
                        ? 'text-success'
                        : 'text-destructive'
                    }`}
                  >
                    {structure.octetSatisfied ? 'Satisfied' : 'Not satisfied'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resonance:</span>
                  <span className="font-mono text-foreground">
                    {structure.hasResonance ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* About */}
          <Card className="p-4">
            <h3 className="text-lg font-bold text-foreground mb-3">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lewis structures show the bonding between atoms and the lone
              electron pairs in a molecule. They help visualize molecular
              geometry and predict chemical behavior.
            </p>

            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-bold text-foreground mb-2">How it works:</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Count valence electrons</li>
                <li>Determine central atom</li>
                <li>Draw single bonds</li>
                <li>Complete octets with lone pairs</li>
                <li>Form multiple bonds if needed</li>
                <li>Calculate formal charges</li>
              </ol>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-bold text-foreground mb-2">Features:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Automatic generation
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Formal charge calculation
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Lone pair visualization
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Octet rule validation
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Step-by-step explanation
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-center text-xs text-muted-foreground">
        Automatic generation with formal charges and octet rule validation.
      </p>
    </CalcShell>
  )
}
