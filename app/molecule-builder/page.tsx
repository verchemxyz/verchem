'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ============================================
// Types
// ============================================
interface Atom {
  id: number
  element: string
  x: number
  y: number
  color: string
}

interface Bond {
  id: number
  from: number
  to: number
  order: 1 | 2 | 3
}

interface PresetMolecule {
  name: string
  formula: string
  smiles: string
  atoms: Omit<Atom, 'id'>[]
  bonds: Omit<Bond, 'id'>[]
}

// ============================================
// Constants
// ============================================
const ATOM_COLORS: Record<string, string> = {
  C: '#333333',
  H: '#FFFFFF',
  O: '#FF0000',
  N: '#3050F8',
  S: '#FFFF30',
  P: '#FF8000',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
}

const ELEMENTS = [
  { symbol: 'C', name: 'Carbon', color: '#333333' },
  { symbol: 'H', name: 'Hydrogen', color: '#FFFFFF' },
  { symbol: 'O', name: 'Oxygen', color: '#FF0000' },
  { symbol: 'N', name: 'Nitrogen', color: '#3050F8' },
  { symbol: 'S', name: 'Sulfur', color: '#FFFF30' },
  { symbol: 'Cl', name: 'Chlorine', color: '#1FF01F' },
]

const PRESET_MOLECULES: PresetMolecule[] = [
  {
    name: 'Water',
    formula: 'H₂O',
    smiles: 'O',
    atoms: [
      { element: 'O', x: 300, y: 250, color: '#FF0000' },
      { element: 'H', x: 240, y: 310, color: '#FFFFFF' },
      { element: 'H', x: 360, y: 310, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },
  {
    name: 'Methane',
    formula: 'CH₄',
    smiles: 'C',
    atoms: [
      { element: 'C', x: 300, y: 250, color: '#333333' },
      { element: 'H', x: 220, y: 250, color: '#FFFFFF' },
      { element: 'H', x: 380, y: 250, color: '#FFFFFF' },
      { element: 'H', x: 300, y: 170, color: '#FFFFFF' },
      { element: 'H', x: 300, y: 330, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },
  {
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    smiles: 'O=C=O',
    atoms: [
      { element: 'O', x: 180, y: 250, color: '#FF0000' },
      { element: 'C', x: 300, y: 250, color: '#333333' },
      { element: 'O', x: 420, y: 250, color: '#FF0000' },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 1, to: 2, order: 2 },
    ],
  },
  {
    name: 'Ammonia',
    formula: 'NH₃',
    smiles: 'N',
    atoms: [
      { element: 'N', x: 300, y: 230, color: '#3050F8' },
      { element: 'H', x: 230, y: 300, color: '#FFFFFF' },
      { element: 'H', x: 370, y: 300, color: '#FFFFFF' },
      { element: 'H', x: 300, y: 350, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },
  {
    name: 'Ethane',
    formula: 'C₂H₆',
    smiles: 'CC',
    atoms: [
      { element: 'C', x: 230, y: 250, color: '#333333' },
      { element: 'C', x: 370, y: 250, color: '#333333' },
      { element: 'H', x: 160, y: 200, color: '#FFFFFF' },
      { element: 'H', x: 160, y: 300, color: '#FFFFFF' },
      { element: 'H', x: 230, y: 170, color: '#FFFFFF' },
      { element: 'H', x: 440, y: 200, color: '#FFFFFF' },
      { element: 'H', x: 440, y: 300, color: '#FFFFFF' },
      { element: 'H', x: 370, y: 330, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
      { from: 1, to: 6, order: 1 },
      { from: 1, to: 7, order: 1 },
    ],
  },
  {
    name: 'Ethylene',
    formula: 'C₂H₄',
    smiles: 'C=C',
    atoms: [
      { element: 'C', x: 230, y: 250, color: '#333333' },
      { element: 'C', x: 370, y: 250, color: '#333333' },
      { element: 'H', x: 160, y: 200, color: '#FFFFFF' },
      { element: 'H', x: 160, y: 300, color: '#FFFFFF' },
      { element: 'H', x: 440, y: 200, color: '#FFFFFF' },
      { element: 'H', x: 440, y: 300, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 1, to: 4, order: 1 },
      { from: 1, to: 5, order: 1 },
    ],
  },
  {
    name: 'Acetylene',
    formula: 'C₂H₂',
    smiles: 'C#C',
    atoms: [
      { element: 'C', x: 230, y: 250, color: '#333333' },
      { element: 'C', x: 370, y: 250, color: '#333333' },
      { element: 'H', x: 140, y: 250, color: '#FFFFFF' },
      { element: 'H', x: 460, y: 250, color: '#FFFFFF' },
    ],
    bonds: [
      { from: 0, to: 1, order: 3 },
      { from: 0, to: 2, order: 1 },
      { from: 1, to: 3, order: 1 },
    ],
  },
  {
    name: 'Benzene',
    formula: 'C₆H₆',
    smiles: 'c1ccccc1',
    atoms: [
      { element: 'C', x: 300, y: 160, color: '#333333' },
      { element: 'C', x: 378, y: 205, color: '#333333' },
      { element: 'C', x: 378, y: 295, color: '#333333' },
      { element: 'C', x: 300, y: 340, color: '#333333' },
      { element: 'C', x: 222, y: 295, color: '#333333' },
      { element: 'C', x: 222, y: 205, color: '#333333' },
      { element: 'H', x: 300, y: 90, color: '#FFFFFF' },
      { element: 'H', x: 438, y: 170, color: '#FFFFFF' },
      { element: 'H', x: 438, y: 330, color: '#FFFFFF' },
      { element: 'H', x: 300, y: 410, color: '#FFFFFF' },
      { element: 'H', x: 162, y: 330, color: '#FFFFFF' },
      { element: 'H', x: 162, y: 170, color: '#FFFFFF' },
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
  },
]

// ============================================
// Simple Molecule Builder Component
// ============================================
export default function MoleculeBuilderPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [atoms, setAtoms] = useState<Atom[]>([])
  const [bonds, setBonds] = useState<Bond[]>([])
  const [selectedElement, setSelectedElement] = useState('C')
  const [bondOrder, setBondOrder] = useState<1 | 2 | 3>(1)
  const [mode, setMode] = useState<'atom' | 'bond' | 'delete' | 'move'>('atom')
  const [selectedAtom, setSelectedAtom] = useState<number | null>(null)
  const [draggingAtom, setDraggingAtom] = useState<number | null>(null)
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null)
  const [nextId, setNextId] = useState(1)
  const [formula, setFormula] = useState('')

  // Calculate molecular formula
  useEffect(() => {
    if (atoms.length === 0) {
      setFormula('')
      return
    }

    const counts: Record<string, number> = {}
    atoms.forEach(atom => {
      counts[atom.element] = (counts[atom.element] || 0) + 1
    })

    // Hill system: C first, H second, then alphabetical
    let f = ''
    if (counts['C']) {
      f += `C${counts['C'] > 1 ? counts['C'] : ''}`
      delete counts['C']
    }
    if (counts['H']) {
      f += `H${counts['H'] > 1 ? counts['H'] : ''}`
      delete counts['H']
    }
    Object.keys(counts).sort().forEach(el => {
      f += `${el}${counts[el] > 1 ? counts[el] : ''}`
    })

    setFormula(f)
  }, [atoms])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Draw bonds
    bonds.forEach(bond => {
      const fromAtom = atoms.find(a => a.id === bond.from)
      const toAtom = atoms.find(a => a.id === bond.to)
      if (!fromAtom || !toAtom) return

      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 3

      const dx = toAtom.x - fromAtom.x
      const dy = toAtom.y - fromAtom.y
      const angle = Math.atan2(dy, dx)
      const perpX = Math.sin(angle) * 6
      const perpY = -Math.cos(angle) * 6

      if (bond.order === 1) {
        ctx.beginPath()
        ctx.moveTo(fromAtom.x, fromAtom.y)
        ctx.lineTo(toAtom.x, toAtom.y)
        ctx.stroke()
      } else if (bond.order === 2) {
        ctx.beginPath()
        ctx.moveTo(fromAtom.x + perpX, fromAtom.y + perpY)
        ctx.lineTo(toAtom.x + perpX, toAtom.y + perpY)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(fromAtom.x - perpX, fromAtom.y - perpY)
        ctx.lineTo(toAtom.x - perpX, toAtom.y - perpY)
        ctx.stroke()
      } else if (bond.order === 3) {
        ctx.beginPath()
        ctx.moveTo(fromAtom.x, fromAtom.y)
        ctx.lineTo(toAtom.x, toAtom.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(fromAtom.x + perpX * 1.5, fromAtom.y + perpY * 1.5)
        ctx.lineTo(toAtom.x + perpX * 1.5, toAtom.y + perpY * 1.5)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(fromAtom.x - perpX * 1.5, fromAtom.y - perpY * 1.5)
        ctx.lineTo(toAtom.x - perpX * 1.5, toAtom.y - perpY * 1.5)
        ctx.stroke()
      }
    })

    // Draw bond preview when in bond mode with selected atom
    if (mode === 'bond' && selectedAtom !== null && hoveredAtom !== null && selectedAtom !== hoveredAtom) {
      const fromAtom = atoms.find(a => a.id === selectedAtom)
      const toAtom = atoms.find(a => a.id === hoveredAtom)
      if (fromAtom && toAtom) {
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(fromAtom.x, fromAtom.y)
        ctx.lineTo(toAtom.x, toAtom.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Draw atoms
    atoms.forEach(atom => {
      const isSelected = atom.id === selectedAtom
      const isHovered = atom.id === hoveredAtom
      const radius = isSelected || isHovered ? 28 : 24

      // Glow effect
      if (isSelected) {
        const gradient = ctx.createRadialGradient(atom.x, atom.y, radius, atom.x, atom.y, radius + 15)
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(atom.x, atom.y, radius + 15, 0, Math.PI * 2)
        ctx.fill()
      }

      // Atom circle
      ctx.fillStyle = atom.color
      ctx.beginPath()
      ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Border
      ctx.strokeStyle = isSelected ? '#22c55e' : isHovered ? '#3b82f6' : '#475569'
      ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 2
      ctx.stroke()

      // Element symbol
      ctx.fillStyle = atom.element === 'C' || atom.element === 'S' ? '#ffffff' : '#000000'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(atom.element, atom.x, atom.y)
    })

    // Mode indicator
    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Mode: ${mode.toUpperCase()} | Atoms: ${atoms.length} | Bonds: ${bonds.length}`, 10, canvas.height - 10)

  }, [atoms, bonds, mode, selectedAtom, hoveredAtom])

  useEffect(() => {
    draw()
  }, [draw])

  // Get atom at position
  const getAtomAt = (x: number, y: number): Atom | undefined => {
    return atoms.find(atom => {
      const dx = atom.x - x
      const dy = atom.y - y
      return Math.sqrt(dx * dx + dy * dy) < 28
    })
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const clickedAtom = getAtomAt(x, y)

    if (mode === 'atom') {
      if (!clickedAtom) {
        // Add new atom
        const newAtom: Atom = {
          id: nextId,
          element: selectedElement,
          x,
          y,
          color: ATOM_COLORS[selectedElement] || '#999999',
        }
        setAtoms([...atoms, newAtom])
        setNextId(nextId + 1)
      }
    } else if (mode === 'bond') {
      if (clickedAtom) {
        if (selectedAtom === null) {
          // Select first atom
          setSelectedAtom(clickedAtom.id)
        } else if (selectedAtom !== clickedAtom.id) {
          // Create bond
          const existingBond = bonds.find(
            b => (b.from === selectedAtom && b.to === clickedAtom.id) ||
                 (b.from === clickedAtom.id && b.to === selectedAtom)
          )

          if (existingBond) {
            // Upgrade bond order
            const newOrder = (existingBond.order % 3 + 1) as 1 | 2 | 3
            setBonds(bonds.map(b => b.id === existingBond.id ? { ...b, order: newOrder } : b))
          } else {
            // Create new bond
            const newBond: Bond = {
              id: nextId,
              from: selectedAtom,
              to: clickedAtom.id,
              order: bondOrder,
            }
            setBonds([...bonds, newBond])
            setNextId(nextId + 1)
          }
          setSelectedAtom(null)
        }
      } else {
        setSelectedAtom(null)
      }
    } else if (mode === 'delete') {
      if (clickedAtom) {
        // Delete atom and connected bonds
        setAtoms(atoms.filter(a => a.id !== clickedAtom.id))
        setBonds(bonds.filter(b => b.from !== clickedAtom.id && b.to !== clickedAtom.id))
        setSelectedAtom(null)
      }
    }
  }

  // Handle mouse move for hover and drag
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const atomUnder = getAtomAt(x, y)
    setHoveredAtom(atomUnder?.id ?? null)

    if (mode === 'move' && draggingAtom !== null) {
      setAtoms(atoms.map(a =>
        a.id === draggingAtom ? { ...a, x, y } : a
      ))
    }
  }

  // Handle mouse down for drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'move') {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const atomUnder = getAtomAt(x, y)
      if (atomUnder) {
        setDraggingAtom(atomUnder.id)
      }
    }
  }

  // Handle mouse up for drag end
  const handleMouseUp = () => {
    if (mode === 'move') {
      setDraggingAtom(null)
    }
  }

  // Load preset molecule
  const loadPreset = (preset: PresetMolecule) => {
    const baseId = Date.now()
    const newAtoms: Atom[] = preset.atoms.map((a, i) => ({
      ...a,
      id: baseId + i,
    }))
    const newBonds: Bond[] = preset.bonds.map((b, i) => ({
      ...b,
      id: baseId + 1000 + i,
      from: baseId + b.from,
      to: baseId + b.to,
    }))

    setAtoms(newAtoms)
    setBonds(newBonds)
    setNextId(baseId + 2000)
    setSelectedAtom(null)
  }

  // Clear all
  const handleClear = () => {
    setAtoms([])
    setBonds([])
    setSelectedAtom(null)
    setNextId(1)
  }

  // Export as PNG
  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `molecule-${formula || 'unnamed'}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">VerChem</h1>
              <p className="text-xs text-slate-400">Molecule Builder</p>
            </div>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Simple Molecule Builder
          </h1>
          <p className="text-slate-400">
            Click to add atoms, connect with bonds, or choose a preset molecule
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Mode Selection */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Mode</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'atom', label: 'Add Atom', icon: '⚛️' },
                  { id: 'bond', label: 'Add Bond', icon: '🔗' },
                  { id: 'move', label: 'Move', icon: '✋' },
                  { id: 'delete', label: 'Delete', icon: '🗑️' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id as typeof mode)
                      setSelectedAtom(null)
                    }}
                    className={`p-3 rounded-lg text-center transition-all ${
                      mode === m.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-xl">{m.icon}</div>
                    <div className="text-xs mt-1">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Element Selection (visible in atom mode) */}
            {mode === 'atom' && (
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-semibold mb-3">Element</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ELEMENTS.map(el => (
                    <button
                      key={el.symbol}
                      onClick={() => setSelectedElement(el.symbol)}
                      className={`p-2 rounded-lg text-center transition-all ${
                        selectedElement === el.symbol
                          ? 'ring-2 ring-emerald-500 bg-slate-600'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: el.color,
                          color: el.symbol === 'C' || el.symbol === 'S' ? 'white' : 'black',
                        }}
                      >
                        {el.symbol}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{el.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bond Order (visible in bond mode) */}
            {mode === 'bond' && (
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-semibold mb-3">Bond Type</h3>
                <div className="space-y-2">
                  {[
                    { order: 1, label: 'Single (—)', symbol: '—' },
                    { order: 2, label: 'Double (=)', symbol: '=' },
                    { order: 3, label: 'Triple (≡)', symbol: '≡' },
                  ].map(b => (
                    <button
                      key={b.order}
                      onClick={() => setBondOrder(b.order as 1 | 2 | 3)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        bondOrder === b.order
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-lg mr-2">{b.symbol}</span>
                      {b.label}
                    </button>
                  ))}
                </div>
                {selectedAtom !== null && (
                  <p className="text-emerald-400 text-sm mt-3">
                    Click another atom to create bond
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleClear}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={exportPNG}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Export PNG
                </button>
              </div>
            </div>

            {/* Formula Display */}
            {formula && (
              <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl p-4">
                <h3 className="text-white/80 text-sm mb-1">Molecular Formula</h3>
                <div className="text-2xl font-bold text-white font-mono">{formula}</div>
              </div>
            )}
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <canvas
                ref={canvasRef}
                width={600}
                height={500}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full rounded-lg cursor-crosshair"
                style={{ aspectRatio: '6/5' }}
              />
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h4 className="text-white font-semibold mb-2">How to use:</h4>
              <ul className="text-slate-400 text-sm space-y-1">
                <li><strong>Atom Mode:</strong> Click on canvas to add atoms</li>
                <li><strong>Bond Mode:</strong> Click first atom, then second atom to create bond. Click existing bond to upgrade.</li>
                <li><strong>Move Mode:</strong> Drag atoms to reposition</li>
                <li><strong>Delete Mode:</strong> Click atom to delete it and its bonds</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Presets */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Preset Molecules</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {PRESET_MOLECULES.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{preset.name}</span>
                      <span className="text-slate-400 font-mono text-sm">{preset.formula}</span>
                    </div>
                    <div className="text-slate-500 text-xs mt-1 group-hover:text-slate-400">
                      Click to load
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/80 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          <p>VerChem Molecule Builder - Simple & Intuitive</p>
        </div>
      </footer>
    </div>
  )
}
