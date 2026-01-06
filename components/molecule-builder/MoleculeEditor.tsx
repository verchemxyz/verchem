'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { BuilderAtom, BuilderBond, ValidationResult } from '@/lib/utils/molecule-builder'
import { ATOM_COLORS } from '@/lib/data/molecules-3d'
import { Download, Maximize2, Minimize2, Grid, Trash2, Zap } from 'lucide-react'

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

interface MoleculeEditorProps {
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
  onAddAtom: (x: number, y: number) => void
  onAddBond: (atom1Id: number, atom2Id: number) => boolean
  onDeleteAtoms: (atomIds: number[]) => void
  onDeleteBonds: (bondIds: number[]) => void
  onMoveAtoms: (movedAtoms: Array<{ id: number; x: number; y: number }>) => void
  onDragEnd: () => void
  onClear: () => void
  isShaking: boolean
  blinkingAtoms: number[]
  validation: ValidationResult | null
}

export default function MoleculeEditor({
  atoms,
  bonds,
  onAddAtom,
  onAddBond,
  onDeleteAtoms,
  onDeleteBonds,
  onMoveAtoms,
  onDragEnd,
  onClear,
  isShaking,
  blinkingAtoms,
  validation,
}: MoleculeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggedAtom, setDraggedAtom] = useState<BuilderAtom | null>(null)
  const [hoveredAtom, setHoveredAtom] = useState<BuilderAtom | null>(null)
  const [selectedAtomIds, setSelectedAtomIds] = useState<number[]>([])
  const [selectedBondIds, setSelectedBondIds] = useState<number[]>([])
  const [connectionLine, setConnectionLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [clickStartPos, setClickStartPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [canvasScale, setCanvasScale] = useState(1)
  
  // Touch support states
  const [touchStartDistance, setTouchStartDistance] = useState<number | null>(null)
  
  const animationRef = useRef<number | undefined>(undefined)
  const blinkPhase = useRef(0)
  const isInteractingRef = useRef(false)
  const devicePixelRatioRef = useRef(1)
  
  // Constants
  const GRID_SIZE = 40
  
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

  // Snap coordinates to grid
  const snap = useCallback((value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / (GRID_SIZE / 2)) * (GRID_SIZE / 2)
  }, [snapToGrid])

  // Responsive canvas sizing
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      devicePixelRatioRef.current = dpr
      setCanvasSize({ width, height })
    }
  }, [])

  // Helper to darken colors for 3D effect
  const adjustColor = useCallback((color: string, amount: number) => {
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
  }, []);

  // Helper for text contrast
  const getContrastColor = useCallback((hexColor: string) => {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  }, []);

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
    
    // Draw Tech Grid Background
    if (showGrid) {
      ctx.fillStyle = '#020617' // Deep space background matches global theme
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Grid lines
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)' // Tech blue low opacity
      ctx.lineWidth = 1

      const step = GRID_SIZE * devicePixelRatioRef.current
      
      // Vertical lines
      for (let x = 0; x <= canvas.width; x += step) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
      }
      
      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += step) {
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
      }
      ctx.stroke()
      
      // Crosshairs at intersections
      ctx.beginPath()
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)' // Violet accents
      for (let x = 0; x <= canvas.width; x += step) {
        for (let y = 0; y <= canvas.height; y += step) {
          ctx.fillRect(x - 1, y - 1, 3, 3)
        }
      }
    }
    
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

      // Tech styling for bonds
      const gradient = ctx.createLinearGradient(atom1.x, atom1.y, atom2.x, atom2.y)
      if (isSelected) {
        gradient.addColorStop(0, '#22d3ee') // Cyan
        gradient.addColorStop(1, '#a78bfa') // Violet
      } else {
        gradient.addColorStop(0, '#64748b') // Slate 500
        gradient.addColorStop(1, '#64748b')
      }

      ctx.strokeStyle = gradient
      ctx.lineWidth = isSelected ? 4 : 2
      ctx.lineCap = 'round'

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
      ctx.strokeStyle = '#22d3ee' // Cyan
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
      if (isBlinking || isSelected) {
        ctx.globalAlpha = blinkOpacity
        const glowSize = isSelected ? 35 : 30 + Math.sin(blinkPhase.current) * 10
        const gradient = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, glowSize)
        
        if (isSelected) {
            gradient.addColorStop(0, 'rgba(34, 211, 238, 0.4)') // Cyan glow
        } else {
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)') // Amber glow for warning
        }
        
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(atom.x, atom.y, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw atom circle
      ctx.globalAlpha = blinkOpacity
      const baseColor = ATOM_COLORS[atom.element] || '#94a3b8'
      
      // Atom Gradient
      const atomGradient = ctx.createRadialGradient(atom.x - 5, atom.y - 5, 2, atom.x, atom.y, 25)
      atomGradient.addColorStop(0, '#ffffff') // Highlight
      atomGradient.addColorStop(0.3, baseColor)
      atomGradient.addColorStop(1, adjustColor(baseColor, -40)) // Shadow
      
      ctx.fillStyle = atomGradient
      ctx.beginPath()
      ctx.arc(atom.x, atom.y, isHovered || isSelected ? 24 : 20, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = isSelected ? '#22d3ee' : (isHovered ? '#cbd5e1' : 'rgba(0,0,0,0.2)')
      ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : 1)
      ctx.stroke()

      ctx.globalAlpha = 1

      // Draw element symbol
      ctx.fillStyle = getContrastColor(baseColor)
      ctx.font = 'bold 16px "Geist Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(atom.element, atom.x, atom.y)

      // Draw formal charge if non-zero
      if (stabilityInfo && stabilityInfo.formalCharge !== 0) {
        ctx.fillStyle = stabilityInfo.formalCharge > 0 ? '#f87171' : '#60a5fa'
        ctx.font = 'bold 12px "Geist Mono", monospace'
        const chargeText = stabilityInfo.formalCharge > 0
          ? `+${stabilityInfo.formalCharge}`
          : `${stabilityInfo.formalCharge}`
        ctx.fillText(chargeText, atom.x + 15, atom.y - 15)
      }

      // Draw electron need indicator
      if (stabilityInfo && stabilityInfo.needsElectrons > 0 && !isBlinking) {
        // Only show text if not actively blinking to avoid clutter
        ctx.fillStyle = '#fbbf24' // Amber 400
        ctx.font = '10px "Geist Mono", monospace'
        ctx.fillText(`${stabilityInfo.needsElectrons}e-`, atom.x, atom.y + 32)
      }
    })

    ctx.restore()
  }, [atoms, bonds, blinkingAtoms, hoveredAtom, connectionLine, isShaking, validation, selectedAtomIds, selectedBondIds, canvasScale, showGrid, adjustColor, getContrastColor])

  // Animation loop
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

  // Resize observer
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAtomIds.length > 0 || selectedBondIds.length > 0) {
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
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAtomIds, selectedBondIds, onDeleteAtoms, onDeleteBonds])

  // Get position from event
  const getEventPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) / canvasScale,
        y: (touch.clientY - rect.top) / canvasScale
      }
    } else {
      return {
        x: (e.clientX - rect.left) / canvasScale,
        y: (e.clientY - rect.top) / canvasScale
      }
    }
  }

  // Interaction Handlers
  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getEventPosition(e)
    // Don't snap on initial click to allow selecting existing atoms easily
    // Snap only when placing NEW atoms or dragging
    
    isInteractingRef.current = true
    setClickStartPos({ x: pos.x, y: pos.y })
    setIsDragging(false)

    // Check for atom click first
    const clickedAtom = atoms.find(atom => {
      const distance = Math.sqrt((atom.x - pos.x) ** 2 + (atom.y - pos.y) ** 2)
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
        dragStartPos: { x: pos.x, y: pos.y },
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
          const distance = getDistanceToLineSegment(pos.x, pos.y, atom1.x, atom1.y, atom2.x, atom2.y)
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
        // Click on empty space - add atom (snapped)
        setSelectedAtomIds([])
        setSelectedBondIds([])
        const snappedX = snap(pos.x)
        const snappedY = snap(pos.y)
        onAddAtom(snappedX, snappedY)
      }
    }
  }

  const handleMove = (x: number, y: number) => {
    // Snap coordinates for movement
    const snappedX = snap(x)
    const snappedY = snap(y)
    const rawX = x
    const rawY = y

    // Check for hovered atom (using raw coordinates for smoother hover detection)
    const hovered = atoms.find(atom => {
      const distance = Math.sqrt((atom.x - rawX) ** 2 + (atom.y - rawY) ** 2)
      return distance < 25
    })
    setHoveredAtom(hovered || null)

    // Detect dragging
    if (clickStartPos && (draggedAtom || draggedGroupDataRef.current)) {
      const dx = Math.abs(rawX - clickStartPos.x)
      const dy = Math.abs(rawY - clickStartPos.y)
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
      // Calculate delta based on snapped positions if snapping is enabled
      const dx = snappedX - snap(dragStartPos.x)
      const dy = snappedY - snap(dragStartPos.y)

      const movedAtoms = Array.from(initialAtomPositions.entries()).map(
        ([id, initialPos]) => {
          // Apply delta to initial position
          // Ensure we stay within canvas bounds
          const newX = initialPos.x + dx
          const newY = initialPos.y + dy
          const clamped = clampToCanvas(newX, newY)
          return { id, x: clamped.x, y: clamped.y }
        }
      )
      onMoveAtoms(movedAtoms)
      setConnectionLine(null)
    } else if (draggedAtom && !isDragging) {
      // Show connection line for bond creation (rubber banding)
      // Snap the target end for cleaner lines
      setConnectionLine({
        x1: draggedAtom.x,
        y1: draggedAtom.y,
        x2: hovered ? hovered.x : rawX,
        y2: hovered ? hovered.y : rawY,
      })
    }
  }

  const handleInteractionEnd = () => {
    // Handle bond creation
    if (isDragging && draggedAtom && hoveredAtom && draggedAtom.id !== hoveredAtom.id) {
      const isGroupDrag = draggedGroupDataRef.current && draggedGroupDataRef.current.initialAtomPositions.size > 1
      if (!isGroupDrag) {
        onAddBond(draggedAtom.id, hoveredAtom.id)
      }
    }
    // Handle selection
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
    if (isDragging) onDragEnd()
    setIsDragging(false)
    draggedGroupDataRef.current = null
  }

  // Pinch zoom handler
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom logic...
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
      const pos = getEventPosition(e)
      handleMove(pos.x, pos.y)
    }
  }

  // Export to PNG
  const exportAsPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Create a temporary canvas to draw without the grid
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tCtx = tempCanvas.getContext('2d')
    if (!tCtx) return

    // Fill background (dark mode compliant)
    tCtx.fillStyle = '#020617' 
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Draw the current state (we can reuse render logic if we refactor, but simpler to just grab the image data if we accept grid)
    // Ideally, we'd re-render without grid. For now, let's just dump the canvas.
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `verchem-molecule-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  // Toggle Fullscreen
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
    <div 
        ref={containerRef} 
        className={`relative w-full h-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950 shadow-2xl transition-all duration-300 ${isFullscreen ? 'rounded-none' : ''}`}
    >
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all ${showGrid ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
            title="Toggle Grid"
        >
            <Grid className="w-5 h-5" />
        </button>
        <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded-lg backdrop-blur-md border transition-all ${snapToGrid ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
            title="Snap to Grid"
        >
            <Zap className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <button
          onClick={onClear}
          className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
          title="Clear All"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button
          onClick={exportAsPNG}
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white hover:bg-slate-700 transition-colors backdrop-blur-md"
          title="Download PNG"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white hover:bg-slate-700 transition-colors backdrop-blur-md"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
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

      {/* Status Indicators */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-none">
          {/* Atom/Bond Count */}
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-cyan-400">
              <span className="text-slate-500">ATOMS:</span> {atoms.length}
            </span>
            <span className="text-violet-400">
              <span className="text-slate-500">BONDS:</span> {bonds.length}
            </span>
          </div>
          {/* Coordinates (Debug/Pro feel) */}
          <div className="text-[10px] font-mono text-slate-600">
              {canvasSize.width}×{canvasSize.height} | {Math.round(canvasScale * 100)}%
          </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="text-[9px] font-mono text-slate-600 text-right space-y-0.5">
          <div><kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Del</kbd> Delete selected</div>
          <div><kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Click</kbd> Add atom</div>
          <div><kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Drag</kbd> Create bond</div>
        </div>
      </div>
      
      {/* Stability Badge */}
      <div className="absolute top-4 left-4 pointer-events-none">
        {validation && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all ${
            validation.isStable
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${validation.isStable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-bold tracking-wider uppercase">
                {validation.isStable ? 'STABLE' : 'UNSTABLE'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
