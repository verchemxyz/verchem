'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import MoleculeCanvasEnhanced from '@/components/molecule-builder/MoleculeCanvasEnhanced'
import AtomPalette from '@/components/molecule-builder/AtomPalette'
import StabilityPanel from '@/components/molecule-builder/StabilityPanel'
import ExportMenu from '@/components/molecule-builder/ExportMenu'
import PresetSelector from '@/components/molecule-builder/PresetSelector'
import TutorialOverlay from '@/components/molecule-builder/TutorialOverlay'
import { useToast } from '@/components/ui/toast'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MoleculeBuilderErrorBoundary } from '@/components/ui/error-boundary'
import {
  validateMolecule,
  recognizeMolecule,
  getValenceElectrons,
  molecule3DToBuilder,
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
import type { Molecule3D } from '@/lib/types/chemistry'

type MoleculeHistory = {
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
}

type PresetKey = 'water' | 'methane' | 'carbonDioxide' | 'ammonia' | 'benzene'

type PresetDefinition = {
  label: string
  description: string
  layout: Array<{ element: string; x: number; y: number }>
  bonds: Array<{ from: number; to: number; order: 1 | 2 | 3 }>
  focusElement?: string
}

const PRESETS: Record<PresetKey, PresetDefinition> = {
  water: {
    label: 'Water',
    description: 'Bent 104.5 deg',
    layout: [
      { element: 'O', x: 340, y: 320 },
      { element: 'H', x: 280, y: 360 },
      { element: 'H', x: 400, y: 360 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
    focusElement: 'O',
  },
  methane: {
    label: 'Methane',
    description: 'Tetrahedral projection',
    layout: [
      { element: 'C', x: 340, y: 320 },
      { element: 'H', x: 260, y: 320 },
      { element: 'H', x: 420, y: 320 },
      { element: 'H', x: 320, y: 240 },
      { element: 'H', x: 360, y: 400 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
    focusElement: 'C',
  },
  carbonDioxide: {
    label: 'Carbon Dioxide',
    description: 'Linear 180 deg',
    layout: [
      { element: 'O', x: 240, y: 320 },
      { element: 'C', x: 340, y: 320 },
      { element: 'O', x: 440, y: 320 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 2 },
    ],
    focusElement: 'O',
  },
  ammonia: {
    label: 'Ammonia',
    description: 'Trigonal pyramidal',
    layout: [
      { element: 'N', x: 340, y: 300 },
      { element: 'H', x: 270, y: 360 },
      { element: 'H', x: 410, y: 360 },
      { element: 'H', x: 340, y: 430 },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
    focusElement: 'N',
  },
  benzene: {
    label: 'Benzene',
    description: 'Planar ring (alternating pi)',
    layout: [
      { element: 'C', x: 320, y: 200 },
      { element: 'C', x: 404, y: 230 },
      { element: 'C', x: 444, y: 310 },
      { element: 'C', x: 404, y: 390 },
      { element: 'C', x: 320, y: 420 },
      { element: 'C', x: 236, y: 390 },
      { element: 'H', x: 320, y: 130 },
      { element: 'H', x: 470, y: 205 },
      { element: 'H', x: 520, y: 310 },
      { element: 'H', x: 470, y: 415 },
      { element: 'H', x: 320, y: 490 },
      { element: 'H', x: 170, y: 315 },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 1 },
      { from: 2, to: 3, order: 2 },
      { from: 3, to: 4, order: 1 },
      { from: 4, to: 5, order: 2 },
      { from: 5, to: 0, order: 1 },
      { from: 0, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
      { from: 2, to: 8, order: 1 },
      { from: 3, to: 9, order: 1 },
      { from: 4, to: 10, order: 1 },
      { from: 5, to: 11, order: 1 },
    ],
    focusElement: 'C',
  },
}

const QUICK_ELEMENTS = [
  { symbol: 'C', name: 'Carbon' },
  { symbol: 'H', name: 'Hydrogen' },
  { symbol: 'O', name: 'Oxygen' },
  { symbol: 'N', name: 'Nitrogen' },
  { symbol: 'Cl', name: 'Chlorine' },
  { symbol: 'Br', name: 'Bromine' },
  { symbol: 'I', name: 'Iodine' },
  { symbol: 'F', name: 'Fluorine' },
  { symbol: 'S', name: 'Sulfur' },
  { symbol: 'P', name: 'Phosphorus' },
  { symbol: 'B', name: 'Boron' },
  { symbol: 'Si', name: 'Silicon' },
]

const QUICK_BONDS: Array<{ mode: 'single' | 'double' | 'triple'; label: string; symbol: string }> = [
  { mode: 'single', label: 'Single', symbol: '-' },
  { mode: 'double', label: 'Double', symbol: '=' },
  { mode: 'triple', label: 'Triple', symbol: '≡' },
]

export default function MoleculeBuilderPage() {
  const [atoms, setAtoms] = useState<BuilderAtom[]>([])
  const [bonds, setBonds] = useState<BuilderBond[]>([])
  const [selectedElement, setSelectedElement] = useState<string>('C')
  const [bondMode, setBondMode] = useState<'single' | 'double' | 'triple'>('single')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [recognizedMolecule, setRecognizedMolecule] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [blinkingAtoms, setBlinkingAtoms] = useState<number[]>([])
  const [showTutorial, setShowTutorial] = useState(false)

  const [history, setHistory] = useState<MoleculeHistory[]>([{ atoms: [], bonds: [] }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const { toast } = useToast()

  // Check if user is new and should see tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('verchem-molecule-builder-tutorial-completed')
    if (!hasSeenTutorial) {
      // Show tutorial after a brief delay
      const timer = setTimeout(() => setShowTutorial(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    localStorage.setItem('verchem-molecule-builder-tutorial-completed', 'true')
    toast.success('Tutorial completed! Ready to build molecules 🧪')
  }

  const handleShowTutorial = () => {
    setShowTutorial(true)
  }

  const saveToHistory = (newAtoms: BuilderAtom[], newBonds: BuilderBond[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ atoms: newAtoms, bonds: newBonds })

    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }

    setHistory(newHistory)
  }

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setAtoms([...prevState.atoms])
      setBonds([...prevState.bonds])
      setHistoryIndex(historyIndex - 1)
    }
  }, [historyIndex, history])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setAtoms([...nextState.atoms])
      setBonds([...nextState.bonds])
      setHistoryIndex(historyIndex + 1)
    }
  }, [historyIndex, history])

  useEffect(() => {
    const allowedBonds = getAllowedBondTypes(selectedElement)
    if (!allowedBonds.includes(bondMode as BondType)) {
      if (allowedBonds.includes('triple')) {
        setBondMode('triple')
      } else if (allowedBonds.includes('double')) {
        setBondMode('double')
      } else {
        setBondMode('single')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
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

  useEffect(() => {
    if (atoms.length > 0) {
      const result = validateMolecule(atoms, bonds)
      setValidation(result)

      if (!result.isStable) {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      }

      const needsElectrons = atoms
        .filter((_, i) => result.atomStability[i]?.needsElectrons > 0)
        .map(a => a.id)
      setBlinkingAtoms(needsElectrons)

      const recognized = recognizeMolecule(atoms, bonds)
      setRecognizedMolecule(recognized)
    } else {
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
    const atom1 = atoms.find(a => a.id === atom1Id)
    const atom2 = atoms.find(a => a.id === atom2Id)
    if (!atom1 || !atom2) return false

    const existingBond = bonds.find(
      b => (b.atom1Id === atom1Id && b.atom2Id === atom2Id) ||
           (b.atom1Id === atom2Id && b.atom2Id === atom1Id)
    )

    if (existingBond) {
      const newOrder = (existingBond.order + 1) as 1 | 2 | 3
      if (newOrder <= 3) {
        const maxOrder = getMaxBondOrder(atom1.element, atom2.element)
        const deltaOrder = newOrder - existingBond.order

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
          return true
        } else {
          const reason = wouldExceedAtom1
            ? `${atom1.element} cannot support more bonds (max ${maxTotalAtom1})`
            : wouldExceedAtom2
            ? `${atom2.element} cannot support more bonds (max ${maxTotalAtom2})`
            : `${atom1.element}-${atom2.element} cannot form ${getBondTypeName(newOrder)} bond`
          toast.error(reason)
          return false
        }
      }
    } else {
      const bondOrder = bondMode === 'single' ? 1 : bondMode === 'double' ? 2 : 3

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
        return true
      } else {
        const reason = wouldExceedAtom1
          ? `${atom1.element} cannot support more bonds (max ${maxTotalAtom1})`
          : wouldExceedAtom2
          ? `${atom2.element} cannot support more bonds (max ${maxTotalAtom2})`
          : `${atom1.element} or ${atom2.element} cannot form ${bondMode} bonds`
        toast.error(reason)
        return false
      }
    }
    return false
  }

  const handleDeleteAtoms = (atomIds: number[]) => {
    const idSet = new Set(atomIds);
    const newAtoms = atoms.filter(a => !idSet.has(a.id))
    const newBonds = bonds.filter(b => !idSet.has(b.atom1Id) && !idSet.has(b.atom2Id))
    setAtoms(newAtoms)
    setBonds(newBonds)
    saveToHistory(newAtoms, newBonds)
  };

  const handleDeleteBonds = (bondIds: number[]) => {
    const idSet = new Set(bondIds);
    const newBonds = bonds.filter(b => !idSet.has(b.id));
    setBonds(newBonds);
    saveToHistory(atoms, newBonds);
  };

  const handleMoveAtoms = useCallback((movedAtoms: { id: number; x: number; y: number }[]) => {
    const movedIds = new Set(movedAtoms.map(m => m.id))
    const movedMap = new Map(movedAtoms.map(m => [m.id, { x: m.x, y: m.y }]))
    const newAtoms = atoms.map(atom => {
      if (movedIds.has(atom.id)) {
        const newPos = movedMap.get(atom.id)!
        return { ...atom, x: newPos.x, y: newPos.y }
      }
      return atom
    })
    setAtoms(newAtoms)
  }, [atoms])

  const handleDragEnd = () => {
    saveToHistory(atoms, bonds);
  }

  const handleClear = () => {
    setAtoms([])
    setBonds([])
    setValidation(null)
    setRecognizedMolecule(null)
    setHistory([{ atoms: [], bonds: [] }])
    setHistoryIndex(0)
  }

  const handleLoad3DPreset = (molecule: Molecule3D) => {
    const { atoms: newAtoms, bonds: newBonds } = molecule3DToBuilder(molecule, 600, 600)

    setAtoms(newAtoms)
    setBonds(newBonds)
    setValidation(null)
    setRecognizedMolecule(null)
    setHistory([{ atoms: newAtoms, bonds: newBonds }])
    setHistoryIndex(0)

    // Set first element from molecule as selected
    if (newAtoms.length > 0) {
      setSelectedElement(newAtoms[0].element)
    }

    toast.success(`Loaded ${molecule.name} (${molecule.formula})`)
  }

  const unstableAtoms = validation?.atomStability.filter(atom => !atom.isStable).length ?? 0
  const electronsNeeded = validation?.atomStability.reduce((sum, atom) => sum + atom.needsElectrons, 0) ?? 0
  const statusLabel = atoms.length === 0 ? 'Ready' : validation?.isStable ? 'Stable' : 'Needs fixes'
  const formulaDisplay = validation?.formula ?? (atoms.length === 0 ? '--' : '...')

  const handleQuickElement = (element: string) => {
    setSelectedElement(element)
    const allowed = getAllowedBondTypes(element)
    if (!allowed.includes(bondMode)) {
      if (allowed.includes('double')) setBondMode('double')
      else if (allowed.includes('single')) setBondMode('single')
    }
  }

  const legend = [
    'Click empty space to drop an atom',
    'Drag from one atom to another to create or upgrade a bond',
    'Shift+Click for multi-select; Delete to clear selection',
    'Ctrl/Cmd+Z undo; Ctrl/Cmd+Y redo',
  ]

  return (
    <MoleculeBuilderErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/50 bg-gradient-to-br from-cyan-500 to-emerald-500 text-xl font-bold text-slate-950 shadow-lg shadow-cyan-500/30">
              V
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Molecule Forge</p>
              <h1 className="text-xl font-semibold text-white">Valence-Safe Builder</h1>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-emerald-200">
              Real-time validation
            </span>
            <span className="rounded-full border border-cyan-400/40 px-3 py-1 text-cyan-200">
              Keyboard-first
            </span>
            <ThemeToggle />
            <Link href="/" className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white transition hover:bg-white/20">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">Structure-first workflow</p>
              <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
                Build molecules with a clear, physics-aware canvas
              </h2>
              <p className="mt-2 text-slate-300 max-w-2xl">
                Valence-safe interactions, instant stability feedback, and a teaching-friendly HUD for fast reviews.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-80">
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-emerald-200/80">Stability</p>
                <p className="text-xl font-bold text-emerald-100">
                  {statusLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-cyan-200/80">Formula</p>
                <p className="text-lg font-mono text-white">
                  {formulaDisplay}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-300/80">Atoms</p>
                <p className="text-lg font-semibold text-white">{atoms.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-300/80">Bonds</p>
                <p className="text-lg font-semibold text-white">{bonds.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-400/30 bg-slate-900/80 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.4)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Quick picks (no scrolling)</p>
              <p className="text-xs text-slate-300">Tap an element or bond type; invalid options are auto-blocked.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_BONDS.map(bond => {
                const allowed = getAllowedBondTypes(selectedElement).includes(bond.mode)
                const active = bondMode === bond.mode
                return (
                  <button
                    key={bond.mode}
                    onClick={() => allowed && setBondMode(bond.mode)}
                    disabled={!allowed}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-50'
                        : allowed
                          ? 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-500/5'
                          : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {bond.symbol} {bond.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_ELEMENTS.map(item => {
              const active = selectedElement === item.symbol
              const allowedBonds = getAllowedBondTypes(item.symbol)
              return (
                <button
                  key={item.symbol}
                  onClick={() => handleQuickElement(item.symbol)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-50'
                      : 'border-white/10 bg-white/5 text-slate-100 hover:border-emerald-300/40 hover:bg-emerald-500/5'
                  }`}
                  aria-pressed={active}
                >
                  <span className="rounded-md bg-white/10 px-2 py-1 text-base font-bold text-white">
                    {item.symbol}
                  </span>
                  <span className="text-xs text-slate-300">Allows {allowedBonds.join(', ')}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  {validation?.isStable ? 'Valence rules satisfied' : 'Checking valence rules'}
                </div>
                <div className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                  {recognizedMolecule ? `Recognized as ${recognizedMolecule}` : 'Recognition will appear here'}
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  Electrons needed: {electronsNeeded} e-
                </div>
                <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                  Unstable atoms: {unstableAtoms}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-950/60 shadow-[0_30px_80px_rgba(0,0,0,0.55)]" data-tutorial="builder-canvas">
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.2) 1px, transparent 0)',
                  backgroundSize: '34px 34px',
                }}
              />
              <div className="absolute inset-x-8 top-6 z-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/90">
                    Hold + drag to place or upgrade a bond
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/90">
                    Shift+Click to select multiple atoms
                  </span>
                </div>
                {validation?.formula && (
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm font-mono text-emerald-100">
                    {validation.formula}
                  </span>
                )}
              </div>

              <div className="relative z-10 px-4 pb-4 pt-14">
                <MoleculeCanvasEnhanced
                  atoms={atoms}
                  bonds={bonds}
                  onAddAtom={handleAddAtom}
                  onAddBond={handleAddBond}
                  onDeleteAtoms={handleDeleteAtoms}
                  onDeleteBonds={handleDeleteBonds}
                  onMoveAtoms={handleMoveAtoms}
                  onDragEnd={handleDragEnd}
                  isShaking={isShaking}
                  blinkingAtoms={blinkingAtoms}
                  validation={validation}
                />
                <div className="mt-4 grid gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-slate-200 sm:grid-cols-2">
                  {legend.map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Preset Selector with Categories & Search */}
            <div className="rounded-3xl border border-cyan-400/30 bg-slate-900/80 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.4)]" data-tutorial="preset-selector">
              <PresetSelector onLoadPreset={handleLoad3DPreset} />
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]" data-tutorial="atom-palette">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white">Element & Bond Console</h3>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  Step {historyIndex} / {history.length - 1}
                </div>
              </div>
              <div className="mt-4">
                <AtomPalette
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  bondMode={bondMode}
                  onBondModeChange={setBondMode}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    historyIndex > 0
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20'
                      : 'border-white/10 bg-white/5 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    historyIndex < history.length - 1
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20'
                      : 'border-white/10 bg-white/5 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  Redo
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={handleClear}
                  className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                >
                  Clear all
                </button>
                <div>
                  <ExportMenu atoms={atoms} bonds={bonds} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <h4 className="text-md font-semibold text-white">Core Rules</h4>
              <ul className="mt-3 space-y-2 text-sm text-emerald-50/90">
                <li>Valence guardrails block bonds beyond allowed totals</li>
                <li>Formal charge and missing-electron alerts are surfaced live</li>
                <li>Drag again to upgrade single to double to triple (when allowed)</li>
                <li>History keeps the last 50 steps so experiments stay reversible</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]" data-tutorial="stability-panel">
            <h3 className="text-xl font-semibold text-white">Stability & Charge Map</h3>
            <p className="mt-1 text-sm text-slate-300">
              Inspect formula, bonds, charge balance, and per-atom stability without leaving the canvas.
            </p>
            <div className="mt-4">
              <StabilityPanel
                validation={validation}
                atoms={atoms}
                bonds={bonds}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-md font-semibold text-white">Scenarios to explore</h4>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p>- Compare linear CO2 against bent H2O to see angle and charge differences</p>
                <p>- Add halogens and attempt bond upgrades to feel valence ceilings</p>
                <p>- Intentionally overbond to observe how formal charge warnings react</p>
              </div>
            </div>
            {validation && !validation.isStable && (
              <div className="rounded-3xl border border-amber-400/40 bg-amber-500/10 p-4">
                <h4 className="text-md font-semibold text-amber-100">Immediate suggestions</h4>
                <div className="mt-2 space-y-1 text-sm text-amber-50">
                  {validation.hints.map((hint, i) => (
                    <p key={i}>- {hint}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ARIA live regions for screen readers */}
      <div
        id="molecule-status-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {validation && (
          <>
            {validation.isStable
              ? `Molecule is stable. Formula: ${validation.formula}`
              : `Molecule needs fixes. ${validation.atomStability.filter(a => !a.isStable).length} atoms unstable.`
            }
          </>
        )}
      </div>

      <div
        id="molecule-error-live"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      <footer className="border-t border-white/10 bg-slate-950/90 py-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">
              <p>VerChem Molecule Forge | Valence, bonding, and formal-charge safety baked in</p>
              <p className="mt-1 text-xs">Keyboard-ready | Screen-reader friendly | Built for teaching and quick validation</p>
            </div>
            <button
              onClick={handleShowTutorial}
              className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              aria-label="Show tutorial"
            >
              📖 Show Tutorial
            </button>
          </div>
        </div>
      </footer>

      {/* Tutorial overlay */}
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}
    </div>
    </MoleculeBuilderErrorBoundary>
  )
}
