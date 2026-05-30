'use client'

// VerChem - 3D Molecular Viewer Demo Page
// Interactive 3D visualization demo

import { useState } from 'react'
import MoleculeViewer3D from '@/components/3d-viewer/MoleculeViewer3D'
import MoleculeSelector from '@/components/3d-viewer/MoleculeSelector'
import type { Molecule3D, DisplayStyle, Atom3D } from '@/lib/types/chemistry'
import { WATER } from '@/lib/data/molecules-3d'
import { CalcShell } from '@/components/lab'

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
    <CalcShell
      eyebrow="Interactive 3D · CPK · 10 molecules"
      title="3D Molecular Viewer"
      subtitle="Interactive 3D visualization with real-time rendering and intuitive controls."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/*
        The 3D viewport renders CPK atoms onto a fixed #000000 canvas, and the
        MoleculeSelector console is fixed-dark. We scope this region to `.dark`
        so the surrounding chrome uses the Lab Ledger "Instrument Console" dark
        tokens consistently (stable in either global theme) — CPK colors and the
        black canvas background are LEFT EXACTLY AS-IS.
      */}
      <div className="dark grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Viewer */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-lg bg-card p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">3D Viewer</h2>

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
              <div className="mt-6 bg-muted border border-border rounded-md p-4">
                <h3 className="text-lg font-bold mb-2 text-foreground">Selected Atom</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Element:</span>
                    <span className="text-foreground ml-2 font-mono">
                      {selectedAtom.element}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Index:</span>
                    <span className="text-foreground ml-2 font-mono">
                      {selectedAtom.index}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">X:</span>
                    <span className="text-foreground ml-2 font-mono">
                      {selectedAtom.position.x.toFixed(3)} Å
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Y:</span>
                    <span className="text-foreground ml-2 font-mono">
                      {selectedAtom.position.y.toFixed(3)} Å
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Z:</span>
                    <span className="text-foreground ml-2 font-mono">
                      {selectedAtom.position.z.toFixed(3)} Å
                    </span>
                  </div>
                  {selectedAtom.formalCharge !== undefined &&
                    selectedAtom.formalCharge !== 0 && (
                      <div>
                        <span className="text-muted-foreground text-sm">
                          Formal Charge:
                        </span>
                        <span className="text-foreground ml-2 font-mono">
                          {selectedAtom.formalCharge > 0 ? '+' : ''}
                          {selectedAtom.formalCharge}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Features List */}
            <div className="mt-6 bg-muted border border-border rounded-md p-4">
              <h3 className="text-lg font-bold mb-3 text-foreground">Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Interactive 3D rotation (drag to rotate)
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Zoom control (scroll wheel)
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Multiple display styles
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Atom labels and info
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  Auto-rotation mode
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  10 pre-built molecules
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
                  CPK color scheme
                </li>
                <li className="flex items-center">
                  <span className="text-success mr-2">✓</span>
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
          <div className="mt-6 border border-border rounded-lg bg-card p-4">
            <h3 className="text-lg font-bold mb-3 text-foreground">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Molecules:</span>
                <span className="text-foreground font-mono">10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Display Styles:</span>
                <span className="text-foreground font-mono">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interactive:</span>
                <span className="text-success font-mono">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free:</span>
                <span className="text-success font-mono">Yes</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="mt-6 border border-border rounded-lg bg-card p-4">
            <h3 className="text-lg font-bold mb-3 text-foreground">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              VerChem 3D Molecular Viewer is a free, interactive tool for
              visualizing chemical molecules in 3D. Built with modern web
              technologies, it provides real-time rendering and intuitive
              controls.
            </p>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Part of the Ver* ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-center text-xs text-muted-foreground">
        Interactive 3D rendering with the CPK color scheme.
      </p>
    </CalcShell>
  )
}
