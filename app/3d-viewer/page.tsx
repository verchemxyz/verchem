'use client'

// VerChem - 3D Molecular Viewer Demo Page
// Interactive 3D visualization demo

import { useState } from 'react'
import Link from 'next/link'
import MoleculeViewer3D from '@/components/3d-viewer/MoleculeViewer3D'
import MoleculeSelector from '@/components/3d-viewer/MoleculeSelector'
import type { Molecule3D, DisplayStyle, Atom3D } from '@/lib/types/chemistry'
import { WATER } from '@/lib/data/molecules-3d'

export default function Viewer3DPage() {
  const [selectedMolecule, setSelectedMolecule] = useState<Molecule3D>(WATER)
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('ball-stick')
  const [showLabels, setShowLabels] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [selectedAtom, setSelectedAtom] = useState<Atom3D | null>(null)

  const handleAtomClick = (atom: Atom3D) => {
    setSelectedAtom(atom)
  }

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
              <p className="text-xs text-muted-foreground">3D Viewer</p>
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
          <div className="badge-premium mb-4">🌐 Interactive 3D • 10 Molecules</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">3D Molecular</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Viewer
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Interactive 3D visualization with real-time rendering and intuitive controls
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3D Viewer */}
          <div className="lg:col-span-2">
            <div className="premium-card p-6 bg-gray-900">
              <h2 className="text-xl font-bold mb-4 text-white">3D Viewer</h2>

              <div className="flex justify-center">
                <MoleculeViewer3D
                  molecule={selectedMolecule}
                  width={600}
                  height={600}
                  displayStyle={displayStyle}
                  showLabels={showLabels}
                  autoRotate={autoRotate}
                  backgroundColor="#000000"
                  onAtomClick={handleAtomClick}
                />
              </div>

              {/* Selected Atom Info */}
              {selectedAtom && (
                <div className="mt-6 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-bold mb-2">Selected Atom</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Element:</span>
                      <span className="text-white ml-2 font-mono">
                        {selectedAtom.element}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Index:</span>
                      <span className="text-white ml-2 font-mono">
                        {selectedAtom.index}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">X:</span>
                      <span className="text-white ml-2 font-mono">
                        {selectedAtom.position.x.toFixed(3)} Å
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Y:</span>
                      <span className="text-white ml-2 font-mono">
                        {selectedAtom.position.y.toFixed(3)} Å
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Z:</span>
                      <span className="text-white ml-2 font-mono">
                        {selectedAtom.position.z.toFixed(3)} Å
                      </span>
                    </div>
                    {selectedAtom.formalCharge !== undefined &&
                      selectedAtom.formalCharge !== 0 && (
                        <div>
                          <span className="text-gray-400 text-sm">
                            Formal Charge:
                          </span>
                          <span className="text-white ml-2 font-mono">
                            {selectedAtom.formalCharge > 0 ? '+' : ''}
                            {selectedAtom.formalCharge}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="mt-6 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-bold mb-3">Features</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Interactive 3D rotation (drag to rotate)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Zoom control (scroll wheel)
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Multiple display styles
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Atom labels and info
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Auto-rotation mode
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    10 pre-built molecules
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    CPK color scheme
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Perspective projection
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <MoleculeSelector
              onSelectMolecule={setSelectedMolecule}
              onDisplayStyleChange={setDisplayStyle}
              onToggleLabels={setShowLabels}
              onToggleAutoRotate={setAutoRotate}
              currentMolecule={selectedMolecule}
              currentDisplayStyle={displayStyle}
              showLabels={showLabels}
              autoRotate={autoRotate}
            />

            {/* Stats */}
            <div className="mt-6 premium-card p-4">
              <h3 className="text-lg font-bold mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Molecules:</span>
                  <span className="text-white font-mono">10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Display Styles:</span>
                  <span className="text-white font-mono">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interactive:</span>
                  <span className="text-green-500 font-mono">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Free:</span>
                  <span className="text-green-500 font-mono">Yes</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-6 premium-card p-4">
              <h3 className="text-lg font-bold mb-3">About</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                VerChem 3D Molecular Viewer is a free, interactive tool for
                visualizing chemical molecules in 3D. Built with modern web
                technologies, it provides real-time rendering and intuitive
                controls.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-400">
                  Built in 60 minutes with AI assistance
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Part of the Ver* ecosystem
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem 3D Viewer • Built with ❤️ for chemistry visualization</p>
          <p className="mt-2 text-xs">
            Interactive 3D rendering with modern web technologies
          </p>
        </div>
      </footer>
    </div>
  )
}
