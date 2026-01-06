'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { BuilderAtom, BuilderBond, ValidationResult } from '@/lib/utils/molecule-builder'
import { ATOM_COLORS } from '@/lib/data/molecules-3d'
import { Download, Share2, Maximize2, Minimize2 } from 'lucide-react'

// Helper function to calculate the distance from a point to a line segment
function getDistanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2
  if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
  t = Math.max(0, Math.min(1, t))
  const nearestX = x1 + t * (x2 - x1)
  const nearestY = y1 + t * (y2 - y1)
  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2)
}

interface MoleculeCanvasEnhancedProps {
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
  onAddAtom: (x: number, y: number) => void
  onAddBond: (atom1Id: number, atom2Id: number) => boolean
  onDeleteAtoms: (atomIds: number[]) => void
  onDeleteBonds: (bondIds: number[]) => void
  onMoveAtoms: (movedAtoms: Array<{ id: number; x: number; y: number }>) => void
  onDragEnd: () => void
  isShaking: boolean
  blinkingAtoms: number[]
  validation: ValidationResult | null
}

export default function MoleculeCanvasEnhanced({
  atoms,
  bonds,
  onAddAtom,
  onAddBond,
  onDeleteAtoms,
  onDeleteBonds,
  onMoveAtoms,
  onDragEnd,
  isShaking,
  blinkingAtoms,
  validation,
}: MoleculeCanvasEnhancedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggedAtom, setDraggedAtom] = useState<BuilderAtom | null>(null)
  const [hoveredAtom, setHoveredAtom] = useState<BuilderAtom | null>(null)
  const [selectedAtomIds, setSelectedAtomIds] = useState<number[]>([])
  const [selectedBondIds, setSelectedBondIds] = useState<number[]>([])
  const [connectionLine, setConnectionLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [clickStartPos, setClickStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [canvasScale, setCanvasScale] = useState(1)

  // Touch support states
  const [touchStartDistance, setTouchStartDistance] = useState<number | null>(null)

  const animationRef = useRef<number | undefined>(undefined)
  const blinkPhase = useRef(0)
  const isInteractingRef = useRef(false)
  const devicePixelRatioRef = useRef(1)

  // Ref to store data about the group of atoms being dragged
  const draggedGroupDataRef = useRef<{
    dragStartPos: { x: number; y: number }
    initialAtomPositions: Map<number, { x: number; y: number }>
  } | null>(null)

  const clampToCanvas = useCallback((x: number, y: number) => {
    const padding = 24
    return {
      x: Math.max(padding, Math.min(x, canvasSize.width - padding)),
      y: Math.max(padding, Math.min(y, canvasSize.height - padding)),
    }
  }, [canvasSize])

  // Responsive canvas sizing
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const availableWidth = rect.width || 600

    // Make canvas more responsive on mobile
    const isMobile = window.innerWidth < 768
    const maxSize = isMobile ? availableWidth - 32 : Math.min(availableWidth, 720)
    const size = maxSize

    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      devicePixelRatioRef.current = dpr
      setCanvasSize({ width: size, height: size })
    }
  }, [])

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Apply DPI scaling
    ctx.save()
    ctx.setTransform(
      devicePixelRatioRef.current * canvasScale,
      0, 0,
      devicePixelRatioRef.current * canvasScale,
      0, 0
    )

    // Apply shake effect if unstable
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

      const isSelected = selectedBondIds.includes(bond.id)

      // Draw bond line(s)
      const dx = atom2.x - atom1.x
      const dy = atom2.y - atom1.y
      const angle = Math.atan2(dy, dx)
      const perpX = Math.sin(angle) * 4
      const perpY = -Math.cos(angle) * 4

      ctx.strokeStyle = isSelected ? '#00ffff' : '#666666'
      ctx.lineWidth = isSelected ? 4 : 2

      for (let i = 0; i < bond.order; i++) {
        const offset = (i - (bond.order - 1) / 2) * 6
        ctx.beginPath()
        ctx.moveTo(atom1.x + perpX * offset, atom1.y + perpY * offset)
        ctx.lineTo(atom2.x + perpX * offset, atom2.y + perpY * offset)
        ctx.stroke()
      }
    })

    // Draw connection line (when dragging to create bond)
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
      const isSelected = selectedAtomIds.includes(atom.id)

      // Calculate blink opacity
      const blinkOpacity = isBlinking
        ? 0.5 + Math.sin(blinkPhase.current) * 0.5
        : 1

      // Get stability info
      const stabilityInfo = validation?.atomStability.find((_, i) => atoms[i]?.id === atom.id)

      // Draw glow if needs electrons
      if (isBlinking) {
        ctx.globalAlpha = blinkOpacity
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
      ctx.globalAlpha = blinkOpacity
      ctx.fillStyle = ATOM_COLORS[atom.element] || '#999999'
      ctx.beginPath()
      ctx.arc(atom.x, atom.y, isHovered || isSelected ? 25 : 20, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = isSelected ? '#00ffff' : isHovered ? '#ffff00' : '#000000'
      ctx.lineWidth = isSelected ? 4 : isHovered ? 3 : 1
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
        ctx.fillText(`needs ${stabilityInfo.needsElectrons}e-`, atom.x, atom.y + 30)
      }
    })

    ctx.restore()
  }, [atoms, bonds, blinkingAtoms, hoveredAtom, connectionLine, isShaking, validation, selectedAtomIds, selectedBondIds, canvasScale])

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

  // Responsive canvas sizing
  useEffect(() => {
    const frame = requestAnimationFrame(() => resizeCanvas())
    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    window.addEventListener('resize', resizeCanvas)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [resizeCanvas])

  // Keyboard shortcuts for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (selectedAtomIds.length > 0) {
          onDeleteAtoms(selectedAtomIds)
          setSelectedAtomIds([])
        }
        if (selectedBondIds.length > 0) {
          onDeleteBonds(selectedBondIds)
          setSelectedBondIds([])
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAtomIds, selectedBondIds, onDeleteAtoms, onDeleteBonds])

  // Get position from mouse or touch event
  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) / canvasScale,
        y: (touch.clientY - rect.top) / canvasScale
      }
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) / canvasScale,
        y: (e.clientY - rect.top) / canvasScale
      }
    }
  }

  // Handle pinch zoom
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (touchStartDistance) {
        const scale = distance / touchStartDistance
        setCanvasScale(prevScale => Math.max(0.5, Math.min(2, prevScale * (scale > 1 ? 1.01 : 0.99))))
      } else {
        setTouchStartDistance(distance)
      }
    } else if (e.touches.length === 1 && isInteractingRef.current) {
      // Single touch drag
      const pos = getEventPosition(e)
      handleMove(pos.x, pos.y)
    }
  }

  // Unified interaction start (mouse or touch)
  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getEventPosition(e)
    const clamped = clampToCanvas(pos.x, pos.y)

    isInteractingRef.current = true
    setClickStartPos({ x: clamped.x, y: clamped.y })
    setIsDragging(false)

    // Check for atom click first
    const clickedAtom = atoms.find(atom => {
      const distance = Math.sqrt((atom.x - clamped.x) ** 2 + (atom.y - clamped.y) ** 2)
      return distance < 25
    })

    if (clickedAtom) {
      setDraggedAtom(clickedAtom)
      setSelectedBondIds([])

      const isSelected = selectedAtomIds.includes(clickedAtom.id)
      const idsToDrag = isSelected ? selectedAtomIds : [clickedAtom.id]

      const initialPositions = new Map<number, { x: number; y: number }>()
      atoms.forEach(atom => {
        if (idsToDrag.includes(atom.id)) {
          initialPositions.set(atom.id, { x: atom.x, y: atom.y })
        }
      })

      draggedGroupDataRef.current = {
        dragStartPos: { x: clamped.x, y: clamped.y },
        initialAtomPositions: initialPositions,
      }
    } else {
      // Check for bond clicks
      const clickThreshold = 15
      let clickedBond: BuilderBond | null = null
      for (const bond of bonds) {
        const atom1 = atoms.find(a => a.id === bond.atom1Id)
        const atom2 = atoms.find(a => a.id === bond.atom2Id)
        if (atom1 && atom2) {
          const distance = getDistanceToLineSegment(clamped.x, clamped.y, atom1.x, atom1.y, atom2.x, atom2.y)
          if (distance < clickThreshold) {
            clickedBond = bond
            break
          }
        }
      }

      if (clickedBond) {
        setSelectedAtomIds([])
        const clickedId = clickedBond.id
        if ('shiftKey' in e && e.shiftKey) {
          setSelectedBondIds(prev =>
            prev.includes(clickedId)
              ? prev.filter(id => id !== clickedId)
              : [...prev, clickedId]
          )
        } else {
          setSelectedBondIds([clickedId])
        }
      } else {
        // Click on empty space - add atom
        setSelectedAtomIds([])
        setSelectedBondIds([])
        onAddAtom(clamped.x, clamped.y)
      }
    }
  }

  // Unified move handler
  const handleMove = (x: number, y: number) => {
    const clamped = clampToCanvas(x, y)

    // Check for hovered atom
    const hovered = atoms.find(atom => {
      const distance = Math.sqrt((atom.x - clamped.x) ** 2 + (atom.y - clamped.y) ** 2)
      return distance < 25
    })
    setHoveredAtom(hovered || null)

    // Detect dragging
    if (clickStartPos && (draggedAtom || draggedGroupDataRef.current)) {
      const dx = Math.abs(clamped.x - clickStartPos.x)
      const dy = Math.abs(clamped.y - clickStartPos.y)
      if (!isDragging && (dx > 5 || dy > 5)) {
        setIsDragging(true)
        if (draggedAtom && !selectedAtomIds.includes(draggedAtom.id)) {
          setSelectedAtomIds([draggedAtom.id])
        }
      }
    }

    // Handle group drag
    if (isDragging && draggedGroupDataRef.current) {
      const { dragStartPos, initialAtomPositions } = draggedGroupDataRef.current
      const dx = clamped.x - dragStartPos.x
      const dy = clamped.y - dragStartPos.y

      const movedAtoms = Array.from(initialAtomPositions.entries()).map(
        ([id, initialPos]) => {
          const newPos = clampToCanvas(initialPos.x + dx, initialPos.y + dy)
          return { id, x: newPos.x, y: newPos.y }
        }
      )
      onMoveAtoms(movedAtoms)
      setConnectionLine(null)
    } else if (draggedAtom && !isDragging) {
      // Show connection line for bond creation
      setConnectionLine({
        x1: draggedAtom.x,
        y1: draggedAtom.y,
        x2: clamped.x,
        y2: clamped.y,
      })
    }
  }

  // Unified interaction end
  const handleInteractionEnd = () => {
    // Handle bond creation on drag end
    if (isDragging && draggedAtom && hoveredAtom && draggedAtom.id !== hoveredAtom.id) {
      const isGroupDrag = draggedGroupDataRef.current && draggedGroupDataRef.current.initialAtomPositions.size > 1
      if (!isGroupDrag) {
        onAddBond(draggedAtom.id, hoveredAtom.id)
      }
    }
    // Handle selection on click
    else if (draggedAtom && !isDragging) {
      const clickedId = draggedAtom.id
      setSelectedAtomIds(prevSelected =>
        prevSelected.includes(clickedId)
          ? prevSelected.filter(id => id !== clickedId)
          : [...prevSelected, clickedId]
      )
    }

    // Cleanup
    isInteractingRef.current = false
    setDraggedAtom(null)
    setConnectionLine(null)
    setClickStartPos(null)
    setTouchStartDistance(null)
    if (isDragging) onDragEnd()
    setIsDragging(false)
    draggedGroupDataRef.current = null
  }

  // Export as PNG
  const exportAsPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `molecule-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  // Share molecule (create shareable URL)
  const shareMolecule = () => {
    const state = btoa(JSON.stringify({ atoms, bonds }))
    const url = `${window.location.origin}/molecule-builder?m=${state}`
    navigator.clipboard.writeText(url)

    // Show toast notification would be here
    console.log('Share URL copied to clipboard:', url)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${isShaking ? 'animate-shake' : ''}`}>
      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={exportAsPNG}
          className="rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="Export as PNG"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={shareMolecule}
          className="rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="Share molecule"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full rounded-2xl border border-cyan-400/20 bg-slate-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)] cursor-crosshair touch-none"
        aria-label="Interactive molecule canvas"
        onMouseDown={handleInteractionStart}
        onMouseMove={(e) => {
          const pos = getEventPosition(e)
          handleMove(pos.x, pos.y)
        }}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={() => {
          setHoveredAtom(null)
          if (!isInteractingRef.current) {
            setConnectionLine(null)
          }
        }}
        onTouchStart={handleInteractionStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Status indicator */}
      <div className="absolute top-4 left-4">
        {validation && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            validation.isStable
              ? 'bg-green-500/20 text-green-300 border border-green-500/50'
              : 'bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse'
          }`}>
            {validation.isStable ? 'Stable' : 'Unstable'}
          </div>
        )}
      </div>

      {/* Formula display */}
      {validation && validation.formula !== 'Empty' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-lg">
          <span className="text-white font-mono text-lg">{validation.formula}</span>
        </div>
      )}

      {/* Zoom indicator */}
      {canvasScale !== 1 && (
        <div className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded text-xs text-white">
          {Math.round(canvasScale * 100)}%
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