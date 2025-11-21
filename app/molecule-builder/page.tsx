'use client'

// VerChem - Interactive Molecule Builder
// Build your own molecules with real-time stability feedback!

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MoleculeCanvas from '@/components/molecule-builder/MoleculeCanvas'
import AtomPalette from '@/components/molecule-builder/AtomPalette'
import StabilityPanel from '@/components/molecule-builder/StabilityPanel'
import {
  validateMolecule,
  recognizeMolecule,
  getValenceElectrons,
  type BuilderAtom,
  type BuilderBond,
  type ValidationResult
} from '@/lib/utils/molecule-builder'
import {
  getAllowedBondTypes,
  isBondTypeAllowed,
  getMaxBondOrder,
  getMaxTotalBondOrder,
  getBondTypeName,
  type BondType
} from '@/lib/utils/bond-restrictions'

// History state for the molecule
type MoleculeHistory = {
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
}

export default function MoleculeBuilderPage() {
  const [atoms, setAtoms] = useState<BuilderAtom[]>([])
  const [bonds, setBonds] = useState<BuilderBond[]>([])
  const [selectedElement, setSelectedElement] = useState<string>('C')
  const [bondMode, setBondMode] = useState<'single' | 'double' | 'triple'>('single')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [recognizedMolecule, setRecognizedMolecule] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [blinkingAtoms, setBlinkingAtoms] = useState<number[]>([])

  // Undo/Redo system
  const [history, setHistory] = useState<MoleculeHistory[]>([{ atoms: [], bonds: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Save current state to history (call after every change)
  const saveToHistory = (newAtoms: BuilderAtom[], newBonds: BuilderBond[]) => {
    // Remove future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ atoms: newAtoms, bonds: newBonds })

    // Limit history to 50 steps to save memory
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }

    setHistory(newHistory)
  }

  // Undo: go back one step
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setAtoms([...prevState.atoms])
      setBonds([...prevState.bonds])
      setHistoryIndex(historyIndex - 1)
    }
  }, [historyIndex, history])

  // Redo: go forward one step
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setAtoms([...nextState.atoms])
      setBonds([...nextState.bonds])
      setHistoryIndex(historyIndex + 1)
    }
  }, [historyIndex, history])

  // Auto-switch bond mode when selecting element that doesn't support current mode
  useEffect(() => {
    const allowedBonds = getAllowedBondTypes(selectedElement)
    if (!allowedBonds.includes(bondMode as BondType)) {
      // Switch to highest allowed bond type
      if (allowedBonds.includes('triple')) {
        setBondMode('triple')
      } else if (allowedBonds.includes('double')) {
        setBondMode('double')
      } else {
        setBondMode('single')
      }
    }
    // Only run when element changes, not when bondMode changes (would cause infinite loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement])

  // Keyboard shortcuts (Ctrl+Z = Undo, Ctrl+Y = Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Validate molecule whenever atoms or bonds change
  useEffect(() => {
    if (atoms.length > 0) {
      const result = validateMolecule(atoms, bonds)
      setValidation(result)

      // Check if molecule is unstable
      if (!result.isStable) {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      }

      // Find atoms that need electrons (blink them)
      const needsElectrons = atoms
        .filter((_, i) => result.atomStability[i]?.needsElectrons > 0)
        .map(a => a.id)
      setBlinkingAtoms(needsElectrons)

      // Try to recognize the molecule
      const recognized = recognizeMolecule(atoms, bonds)
      setRecognizedMolecule(recognized)
    } else {
      // Reset validation when no atoms
      setValidation(null)
      setBlinkingAtoms([])
      setRecognizedMolecule(null)
      setIsShaking(false)
    }
  }, [atoms, bonds])

  const handleAddAtom = (x: number, y: number) => {
    const newAtom: BuilderAtom = {
      id: Date.now(),
      element: selectedElement,
      x,
      y,
      z: 0,
      valenceElectrons: getValenceElectrons(selectedElement),
      formalCharge: 0,
    }
    const newAtoms = [...atoms, newAtom]
    setAtoms(newAtoms)
    saveToHistory(newAtoms, bonds)
  }

  const handleAddBond = (atom1Id: number, atom2Id: number): boolean => {
    // Get the two atoms
    const atom1 = atoms.find(a => a.id === atom1Id)
    const atom2 = atoms.find(a => a.id === atom2Id)
    if (!atom1 || !atom2) return false

    // Check if bond already exists
    const existingBond = bonds.find(
      b => (b.atom1Id === atom1Id && b.atom2Id === atom2Id) ||
           (b.atom1Id === atom2Id && b.atom2Id === atom1Id)
    )

    if (existingBond) {
      // Upgrade bond order if possible
      const newOrder = (existingBond.order + 1) as 1 | 2 | 3
      if (newOrder <= 3) {
        // Check if new bond order is allowed for this pair
        const maxOrder = getMaxBondOrder(atom1.element, atom2.element)
        const deltaOrder = newOrder - existingBond.order

        // Check valence (total bond order) for both atoms
        const currentTotalAtom1 = bonds
          .filter(b => b.atom1Id === atom1Id || b.atom2Id === atom1Id)
          .reduce((sum, b) => sum + b.order, 0)
        const currentTotalAtom2 = bonds
          .filter(b => b.atom1Id === atom2Id || b.atom2Id === atom2Id)
          .reduce((sum, b) => sum + b.order, 0)

        const maxTotalAtom1 = getMaxTotalBondOrder(atom1.element)
        const maxTotalAtom2 = getMaxTotalBondOrder(atom2.element)

        const wouldExceedAtom1 = currentTotalAtom1 + deltaOrder > maxTotalAtom1
        const wouldExceedAtom2 = currentTotalAtom2 + deltaOrder > maxTotalAtom2

        if (newOrder <= maxOrder && !wouldExceedAtom1 && !wouldExceedAtom2) {
          const newBonds = bonds.map(b =>
            b === existingBond ? { ...b, order: newOrder } : b
          )
          setBonds(newBonds)
          saveToHistory(atoms, newBonds)
          return true // Success - bond upgraded
        } else {
          // Show user-friendly message
          const reason = wouldExceedAtom1 
            ? `${atom1.element} cannot support more bonds (max ${maxTotalAtom1})`
            : wouldExceedAtom2
            ? `${atom2.element} cannot support more bonds (max ${maxTotalAtom2})`
            : `${atom1.element}-${atom2.element} cannot form ${getBondTypeName(newOrder)} bond`
          alert(`Cannot upgrade bond: ${reason}`)
          return false // Failed
        }
      }
    } else {
      // Create new bond with current bond mode
      const bondOrder = bondMode === 'single' ? 1 : bondMode === 'double' ? 2 : 3

      // Check if bond type and valence are allowed
      const maxTotalAtom1 = getMaxTotalBondOrder(atom1.element)
      const maxTotalAtom2 = getMaxTotalBondOrder(atom2.element)

      const currentTotalAtom1 = bonds
        .filter(b => b.atom1Id === atom1Id || b.atom2Id === atom1Id)
        .reduce((sum, b) => sum + b.order, 0)
      const currentTotalAtom2 = bonds
        .filter(b => b.atom1Id === atom2Id || b.atom2Id === atom2Id)
        .reduce((sum, b) => sum + b.order, 0)

      const wouldExceedAtom1 = currentTotalAtom1 + bondOrder > maxTotalAtom1
      const wouldExceedAtom2 = currentTotalAtom2 + bondOrder > maxTotalAtom2

      // More lenient for common elements, strict for H and halogens
      const isVeryRestrictive = ['H', 'F', 'CL', 'BR', 'I'].includes(atom1.element.toUpperCase()) || 
                               ['H', 'F', 'CL', 'BR', 'I'].includes(atom2.element.toUpperCase())

      if (
        (isVeryRestrictive ? isBondTypeAllowed(atom1.element, atom2.element, bondMode) : true) &&
        !wouldExceedAtom1 &&
        !wouldExceedAtom2
      ) {
        const newBond: BuilderBond = {
          id: Date.now(),
          atom1Id,
          atom2Id,
          order: bondOrder,
        }
        const newBonds = [...bonds, newBond]
        setBonds(newBonds)
        saveToHistory(atoms, newBonds)
        return true // Success - bond created
      } else {
        // Show user-friendly message
        const reason = wouldExceedAtom1 
          ? `${atom1.element} cannot support more bonds (max ${maxTotalAtom1})`
          : wouldExceedAtom2
          ? `${atom2.element} cannot support more bonds (max ${maxTotalAtom2})`
          : `${atom1.element} or ${atom2.element} cannot form ${bondMode} bonds`
        alert(`Cannot create bond: ${reason}`)
        return false // Failed
      }
    }
    return false // No bond created or upgraded
  }

  const handleDeleteAtom = (atomId: number) => {
    const newAtoms = atoms.filter(a => a.id !== atomId)
    const newBonds = bonds.filter(b => b.atom1Id !== atomId && b.atom2Id !== atomId)
    setAtoms(newAtoms)
    setBonds(newBonds)
    saveToHistory(newAtoms, newBonds)
  }

  const handleClear = () => {
    setAtoms([])
    setBonds([])
    setValidation(null)
    setRecognizedMolecule(null)
    setHistory([{ atoms: [], bonds: [] }])
    setHistoryIndex(0)
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
              <p className="text-xs text-muted-foreground">Molecule Builder</p>
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
          <div className="badge-premium mb-4">⚗️ Drag & Drop Builder • Real-Time Validation</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Interactive Molecule</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Builder
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build molecules, check stability, and learn chemistry interactively!
          </p>

          {/* Recognized Molecule Display */}
          {recognizedMolecule && (
            <div className="mt-6 inline-block bg-green-500/20 border-2 border-green-500 rounded-lg px-6 py-3 animate-pulse-premium">
              <p className="text-green-600 font-bold text-lg">
                🎉 Recognized: <span className="text-2xl">{recognizedMolecule}</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Atom Palette (Left) */}
          <div className="lg:col-span-1">
            <AtomPalette
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              bondMode={bondMode}
              onBondModeChange={setBondMode}
            />

            {/* Controls */}
            <div className="mt-6 premium-card p-4">
              <h3 className="text-lg font-bold mb-3">Controls</h3>

              {/* Undo/Redo Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                  className={`
                    py-2 px-4 rounded-lg border-2 transition font-bold
                    ${historyIndex > 0
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/50 cursor-pointer'
                      : 'bg-gray-500/10 text-gray-500 border-gray-500/30 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  ↶ Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                  className={`
                    py-2 px-4 rounded-lg border-2 transition font-bold
                    ${historyIndex < history.length - 1
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/50 cursor-pointer'
                      : 'bg-gray-500/10 text-gray-500 border-gray-500/30 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  ↷ Redo
                </button>
              </div>

              {/* Clear All */}
              <button
                onClick={handleClear}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold py-2 px-4 rounded-lg border border-red-500/50 transition"
              >
                🗑️ Clear All
              </button>

              {/* History Info */}
              <div className="mt-3 text-xs text-gray-400 text-center">
                Step {historyIndex} / {history.length - 1}
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <p>• Click to add atoms</p>
                <p>• Drag atoms to connect</p>
                <p>• Right-click to delete</p>
                <p>• Double-click bond to upgrade</p>
              </div>
            </div>
          </div>

          {/* Molecule Canvas (Center) */}
          <div className="lg:col-span-2">
            <MoleculeCanvas
              atoms={atoms}
              bonds={bonds}
              onAddAtom={handleAddAtom}
              onAddBond={handleAddBond}
              onDeleteAtom={handleDeleteAtom}
              isShaking={isShaking}
              blinkingAtoms={blinkingAtoms}
              validation={validation}
            />
          </div>

          {/* Stability Panel (Right) */}
          <div className="lg:col-span-1">
            <StabilityPanel
              validation={validation}
              atoms={atoms}
              bonds={bonds}
            />

            {/* Educational Hints */}
            {validation && !validation.isStable && (
              <div className="mt-6 premium-card p-4 bg-yellow-50 border-2 border-yellow-400">
                <h3 className="text-lg font-bold text-yellow-700 mb-3">
                  💡 Hints
                </h3>
                <div className="space-y-2 text-sm text-yellow-800">
                  {validation.hints.map((hint, i) => (
                    <p key={i}>• {hint}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="mt-12 premium-card p-6">
          <h2 className="text-2xl font-bold mb-4">Try Building These!</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Water (H₂O)', atoms: 'H-O-H' },
              { name: 'Methane (CH₄)', atoms: 'C with 4 H' },
              { name: 'Carbon Dioxide (CO₂)', atoms: 'O=C=O' },
              { name: 'Ammonia (NH₃)', atoms: 'N with 3 H' },
            ].map((example) => (
              <div key={example.name} className="bg-surface hover:bg-surface-hover rounded-lg p-3 border border-gray-200 transition-all hover:scale-105">
                <p className="font-bold text-sm">{example.name}</p>
                <p className="text-muted-foreground text-xs mt-1">{example.atoms}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Molecule Builder • Built with ❤️ for interactive chemistry learning</p>
          <p className="mt-2 text-xs">
            Drag atoms, form bonds, and discover molecular stability in real-time
          </p>
        </div>
      </footer>
    </div>
  )
}
