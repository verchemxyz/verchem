'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { BuilderAtom, BuilderBond, ValidationResult } from '@/lib/utils/molecule-builder'
import { ATOM_COLORS } from '@/lib/data/molecules-3d'

interface MoleculeCanvasProps {
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
  onAddAtom: (x: number, y: number) => void
  onAddBond: (atom1Id: number, atom2Id: number) => boolean
  onDeleteAtom: (atomId: number) => void
  isShaking: boolean
  blinkingAtoms: number[]
  validation: ValidationResult | null
}

export default function MoleculeCanvas({
  atoms,
  bonds,
  onAddAtom,
  onAddBond,
  onDeleteAtom,
  isShaking,
  blinkingAtoms,
  validation,
}: MoleculeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draggedAtom, setDraggedAtom] = useState<BuilderAtom | null>(null)
  const [hoveredAtom, setHoveredAtom] = useState<BuilderAtom | null>(null)
  const [selectedAtomId, setSelectedAtomId] = useState<number | null>(null)
  const [connectionLine, setConnectionLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [clickStartPos, setClickStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const animationRef = useRef<number | undefined>(undefined)
  const blinkPhase = useRef(0)
  const isMouseDownRef = useRef(false)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply shake effect if unstable
    ctx.save()
    if (isShaking) {
      const shakeX = (Math.random() - 0.5) * 4
      const shakeY = (Math.random() - 0.5) * 4
      ctx.translate(shakeX, shakeY)
    }

    // Draw bonds
    bonds.forEach(bond => {
      const atom1 = atoms.find(a => a.id === bond.atom1Id)
      const atom2 = atoms.find(a => a.id === bond.atom2Id)

      if (!atom1 || !atom2) return

      // Draw bond line(s)
      const dx = atom2.x - atom1.x
      const dy = atom2.y - atom1.y
      const angle = Math.atan2(dy, dx)
      const perpX = Math.sin(angle) * 4
      const perpY = -Math.cos(angle) * 4

      ctx.strokeStyle = '#666666'
      ctx.lineWidth = 2

      for (let i = 0; i < bond.order; i++) {
        const offset = (i - (bond.order - 1) / 2) * 6

        ctx.beginPath()
        ctx.moveTo(atom1.x + perpX * offset, atom1.y + perpY * offset)
        ctx.lineTo(atom2.x + perpX * offset, atom2.y + perpY * offset)
        ctx.stroke()
      }
    })

    // Draw connection line (when dragging)
    if (connectionLine) {
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(connectionLine.x1, connectionLine.y1)
      ctx.lineTo(connectionLine.x2, connectionLine.y2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw atoms
    atoms.forEach(atom => {
      const isBlinking = blinkingAtoms.includes(atom.id)
      const isHovered = hoveredAtom?.id === atom.id
      const isSelected = selectedAtomId === atom.id

      // Calculate blink opacity
      const blinkOpacity = isBlinking
        ? 0.5 + Math.sin(blinkPhase.current) * 0.5
        : 1

      // Get stability info (guard against undefined atoms)
      const stabilityInfo = validation?.atomStability.find((_, i) => atoms[i]?.id === atom.id)

      // Draw atom circle
      ctx.fillStyle = ATOM_COLORS[atom.element] || '#999999'
      ctx.globalAlpha = blinkOpacity

      // Draw glow if needs electrons
      if (isBlinking) {
        const glowSize = 30 + Math.sin(blinkPhase.current) * 10
        const gradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, glowSize)
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)')
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(atom.x, atom.y, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw atom
      ctx.fillStyle = ATOM_COLORS[atom.element] || '#999999'
      ctx.beginPath()
      ctx.arc(atom.x, atom.y, isHovered || isSelected ? 25 : 20, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = isSelected ? '#00ffff' : isHovered ? '#ffff00' : '#000000'
      ctx.lineWidth = isHovered ? 3 : 1
      ctx.stroke()

      ctx.globalAlpha = 1

      // Draw element symbol
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(atom.element, atom.x, atom.y)

      // Draw formal charge if non-zero
      if (stabilityInfo && stabilityInfo.formalCharge !== 0) {
        ctx.fillStyle = stabilityInfo.formalCharge > 0 ? '#ff6666' : '#6666ff'
        ctx.font = 'bold 12px Arial'
        const chargeText = stabilityInfo.formalCharge > 0
          ? `+${stabilityInfo.formalCharge}`
          : `${stabilityInfo.formalCharge}`
        ctx.fillText(chargeText, atom.x + 15, atom.y - 15)
      }

      // Draw electron need indicator
      if (stabilityInfo && stabilityInfo.needsElectrons > 0) {
        ctx.fillStyle = '#ffaa00'
        ctx.font = '10px Arial'
        ctx.fillText(`needs ${stabilityInfo.needsElectrons}e⁻`, atom.x, atom.y + 30)
      }
    })

    ctx.restore()
  }, [atoms, bonds, blinkingAtoms, hoveredAtom, connectionLine, isShaking, validation, selectedAtomId])

  // Animation loop for blinking
  useEffect(() => {
    const animate = () => {
      blinkPhase.current = (blinkPhase.current + 0.1) % (Math.PI * 2)
      if (canvasRef.current) {
        render()
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render])

  // Global mouseup handler to ensure drag always ends properly
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        // Clean up all drag states
        isMouseDownRef.current = false
        setDraggedAtom(null)
        setConnectionLine(null)
        setIsDragging(false)
        setClickStartPos(null)
      }
    }

    const handleGlobalMouseLeave = (e: MouseEvent) => {
      // Only clean up if mouse leaves the window entirely
      if (!e.relatedTarget) {
        handleGlobalMouseUp()
      }
    }

    // Add global listeners
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mouseleave', handleGlobalMouseLeave)

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mouseleave', handleGlobalMouseLeave)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Mark mouse as down
    isMouseDownRef.current = true

    // Store click start position for drag detection
    setClickStartPos({ x, y })
    setIsDragging(false)

    // Check if clicking on an atom
    const clickedAtom = atoms.find(atom => {
      const distance = Math.sqrt((atom.x - x) ** 2 + (atom.y - y) ** 2)
      return distance < 25
    })

    if (clickedAtom) {
      if (e.button === 2) {
        e.preventDefault()
        onDeleteAtom(clickedAtom.id)
      } else if (e.button === 0) {
        // Left click: prepare for drag or selection
        setDraggedAtom(clickedAtom)
      }
    } else if (e.button === 0) {
      // Click on empty space: add new atom
      setSelectedAtomId(null)
      onAddAtom(x, y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check for hovered atom
    const hovered = atoms.find(atom => {
      const distance = Math.sqrt((atom.x - x) ** 2 + (atom.y - y) ** 2)
      return distance < 25
    })
    setHoveredAtom(hovered || null)

    // Detect dragging
    if (clickStartPos && draggedAtom) {
      const dx = Math.abs(x - clickStartPos.x)
      const dy = Math.abs(y - clickStartPos.y)
      if (dx > 5 || dy > 5) {
        setIsDragging(true)
      }
    }

    // Update connection line if dragging
    if (draggedAtom) {
      setConnectionLine({
        x1: draggedAtom.x,
        y1: draggedAtom.y,
        x2: x,
        y2: y,
      })

      // Change cursor if over another atom
      if (hovered && hovered.id !== draggedAtom.id) {
        canvas.style.cursor = 'crosshair'
      } else {
        canvas.style.cursor = 'grabbing'
      }
    } else {
      canvas.style.cursor = hovered ? 'pointer' : 'default'
    }
  }

  const handleMouseUp = () => {
    // Clear mouse down flag
    isMouseDownRef.current = false

    // Handle atom selection vs bond creation
    if (draggedAtom && !isDragging) {
      // This was a click, not a drag
      if (selectedAtomId !== null && selectedAtomId !== draggedAtom.id) {
        // Create bond between previously selected atom and clicked atom
        const success = onAddBond(selectedAtomId, draggedAtom.id)
        if (success) {
          setSelectedAtomId(null) // Only clear selection if bond was created successfully
        }
        // If bond creation failed, keep the selection so user can try again
      } else {
        // Select this atom (toggle selection if clicking same atom)
        setSelectedAtomId(selectedAtomId === draggedAtom.id ? null : draggedAtom.id)
      }
    } else if (draggedAtom && hoveredAtom && draggedAtom.id !== hoveredAtom.id) {
      // This was a drag to another atom - create bond
      const success = onAddBond(draggedAtom.id, hoveredAtom.id)
      if (success) {
        setSelectedAtomId(null) // Clear selection after successful bond creation
      }
    }

    setDraggedAtom(null)
    setConnectionLine(null)
    setClickStartPos(null)
    setIsDragging(false)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="bg-gray-900 rounded-xl border-2 border-purple-500/30 shadow-2xl cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          // Only clear hover state when leaving canvas
          // Drag state will be cleared by global handlers
          setHoveredAtom(null)
          if (!isMouseDownRef.current) {
            // If not dragging, clear everything
            setConnectionLine(null)
          }
        }}
        onContextMenu={handleContextMenu}
      />

      {/* Status indicator */}
      <div className="absolute top-4 left-4">
        {validation && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            validation.isStable
              ? 'bg-green-500/20 text-green-300 border border-green-500/50'
              : 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse'
          }`}>
            {validation.isStable ? '✅ Stable' : '⚠️ Unstable'}
          </div>
        )}
      </div>

      {/* Formula display */}
      {validation && (
        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-lg">
          <span className="text-white font-mono text-lg">{validation.formula}</span>
        </div>
      )}

      {/* Add shake animation styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-0.5deg); }
          75% { transform: translateX(2px) rotate(0.5deg); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
