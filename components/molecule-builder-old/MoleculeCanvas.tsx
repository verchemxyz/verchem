'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { BuilderAtom, BuilderBond, ValidationResult } from '@/lib/utils/molecule-builder'
import { ATOM_COLORS } from '@/lib/data/molecules-3d'
import {
  selectAll,
  invertSelection,
  announceSelection,
  drawLassoPolygon,
} from '@/lib/utils/selection'
import {
  hapticAtomAdd,
  hapticBondCreate,
  hapticDelete,
  hapticSelect,
  hapticLight,
  hapticMedium,
} from '@/lib/utils/haptics'
import { findBondAngles, drawAngleArc } from '@/lib/utils/bond-angles'
import {
  rotate3D,
  project3DTo2D,
  depthSort,
  getDepthScale,
  getDepthBrightness,
  type RotationAngles,
} from '@/lib/utils/3d-projection'

// Helper function to calculate the distance from a point to a line segment
function getDistanceToLineSegment(px: number, py: number, x1: number, y1:number, x2: number, y2: number): number {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const nearestX = x1 + t * (x2 - x1);
  const nearestY = y1 + t * (y2 - y1);
  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

interface MoleculeCanvasProps {

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



export default function MoleculeCanvas({

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

}: MoleculeCanvasProps) {

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

  const animationRef = useRef<number | undefined>(undefined)

  const blinkPhase = useRef(0)

  const isMouseDownRef = useRef(false)

  const devicePixelRatioRef = useRef(1)

  // Touch gesture states
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [canvasRotation, setCanvasRotation] = useState(0)
  const [touchMenuVisible, setTouchMenuVisible] = useState(false)
  const [touchMenuPosition, setTouchMenuPosition] = useState({ x: 0, y: 0 })
  const [touchMenuTarget, setTouchMenuTarget] = useState<BuilderAtom | null>(null)
  const [showBondAngles, setShowBondAngles] = useState(false)
  const [lassoPoints, setLassoPoints] = useState<Array<{ x: number; y: number }>>([])
  const [isLassoMode, setIsLassoMode] = useState(false)
  const [is3DMode, setIs3DMode] = useState(false)
  const [rotation3D, setRotation3D] = useState({ x: 20, y: 30, z: 0 })

  const touchStartRef = useRef<{ touches: React.Touch[]; time: number } | null>(null)
  const touchHoldTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTouchDistanceRef = useRef<number | null>(null)
  const lastTouchAngleRef = useRef<number | null>(null)
  const isPanningRef = useRef(false)



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



  const resizeCanvas = useCallback(() => {

    const canvas = canvasRef.current

    const container = containerRef.current

    if (!canvas || !container) return



    const rect = container.getBoundingClientRect()

    const availableWidth = rect.width || 600

    const size = Math.min(availableWidth, 720)

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



  const render = useCallback(() => {

    const canvas = canvasRef.current

    if (!canvas) return



    const ctx = canvas.getContext('2d')

    if (!ctx) return



    // Clear canvas at device pixel resolution

    ctx.save()

    ctx.setTransform(1, 0, 0, 1, 0, 0)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.restore()



    // Apply DPI scaling

    ctx.save()

    ctx.setTransform(devicePixelRatioRef.current, 0, 0, devicePixelRatioRef.current, 0, 0)

    // Apply canvas transformations (pan and rotation)
    ctx.translate(canvasSize.width / 2, canvasSize.height / 2)
    ctx.rotate(canvasRotation)
    ctx.translate(-canvasSize.width / 2 + canvasOffset.x, -canvasSize.height / 2 + canvasOffset.y)

    // Apply shake effect if unstable

    if (isShaking) {

      const shakeX = (Math.random() - 0.5) * 4

      const shakeY = (Math.random() - 0.5) * 4

      ctx.translate(shakeX, shakeY)

    }



    // Prepare atoms with 3D coordinates
    const atoms3D = atoms.map(atom => ({
      ...atom,
      z: atom.z ?? 0, // Use z if available, otherwise 0
    }))

    // Convert to display coordinates (2D or projected 3D)
    const displayAtoms = atoms3D.map(atom => {
      if (is3DMode) {
        // Apply 3D rotation
        const rotated = rotate3D({ x: atom.x / 50 - 6, y: atom.y / 50 - 6, z: atom.z }, rotation3D as RotationAngles)
        // Project to 2D
        const projected = project3DTo2D(rotated, 500, canvasSize.width / 2, canvasSize.height / 2, 50)
        return {
          ...atom,
          displayX: projected.x,
          displayY: projected.y,
          depth: projected.depth,
          scale: getDepthScale(projected.depth),
          brightness: getDepthBrightness(projected.depth),
        }
      } else {
        return {
          ...atom,
          displayX: atom.x,
          displayY: atom.y,
          depth: 0,
          scale: 1,
          brightness: 1,
        }
      }
    })

    // Depth sort (draw far atoms first)
    const sortedAtoms = is3DMode ? depthSort(displayAtoms) : displayAtoms

    // Draw bonds
    bonds.forEach(bond => {
      const atom1 = displayAtoms.find(a => a.id === bond.atom1Id)
      const atom2 = displayAtoms.find(a => a.id === bond.atom2Id)

      if (!atom1 || !atom2) return

      const isSelected = selectedBondIds.includes(bond.id);

      // Draw bond line(s)
      const dx = atom2.displayX - atom1.displayX
      const dy = atom2.displayY - atom1.displayY
      const angle = Math.atan2(dy, dx)
      const perpX = Math.sin(angle) * 4
      const perpY = -Math.cos(angle) * 4

      // Brightness based on average depth
      const avgBrightness = (atom1.brightness + atom2.brightness) / 2
      const bondColor = isSelected ? '#00ffff' : `rgba(102, 102, 102, ${avgBrightness})`

      ctx.strokeStyle = bondColor
      ctx.lineWidth = isSelected ? 4 : 2

      for (let i = 0; i < bond.order; i++) {
        const offset = (i - (bond.order - 1) / 2) * 6

        ctx.beginPath()
        ctx.moveTo(atom1.displayX + perpX * offset, atom1.displayY + perpY * offset)
        ctx.lineTo(atom2.displayX + perpX * offset, atom2.displayY + perpY * offset)
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



    // Draw atoms (depth sorted)
    sortedAtoms.forEach(atom => {
      const isBlinking = blinkingAtoms.includes(atom.id)
      const isHovered = hoveredAtom?.id === atom.id
      const isSelected = selectedAtomIds.includes(atom.id)



      // Calculate blink opacity

      const blinkOpacity = isBlinking

        ? 0.5 + Math.sin(blinkPhase.current) * 0.5

        : 1



      // Get stability info (guard against undefined atoms)

      const stabilityInfo = validation?.atomStability.find((_, i) => atoms[i]?.id === atom.id)



      // Calculate size based on depth
      const baseRadius = isHovered || isSelected ? 25 : 20
      const radius = baseRadius * atom.scale

      // Apply brightness to color
      const baseColor = ATOM_COLORS[atom.element] || '#999999'
      const r = parseInt(baseColor.slice(1, 3), 16)
      const g = parseInt(baseColor.slice(3, 5), 16)
      const b = parseInt(baseColor.slice(5, 7), 16)
      const adjustedColor = `rgb(${Math.floor(r * atom.brightness)}, ${Math.floor(g * atom.brightness)}, ${Math.floor(b * atom.brightness)})`

      // Draw atom circle
      ctx.fillStyle = adjustedColor
      ctx.globalAlpha = blinkOpacity

      // Draw glow if needs electrons
      if (isBlinking) {
        const glowSize = (30 + Math.sin(blinkPhase.current) * 10) * atom.scale
        const gradient = ctx.createRadialGradient(atom.displayX, atom.displayY, 0, atom.displayX, atom.displayY, glowSize)
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)')
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(atom.displayX, atom.displayY, glowSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw atom
      ctx.fillStyle = adjustedColor
      ctx.beginPath()
      ctx.arc(atom.displayX, atom.displayY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = isSelected ? '#00ffff' : isHovered ? '#ffff00' : '#000000'
      ctx.lineWidth = (isSelected ? 4 : isHovered ? 3 : 1) * atom.scale
      ctx.stroke()

      ctx.globalAlpha = 1

      // Draw element symbol
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.floor(16 * atom.scale)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(atom.element, atom.displayX, atom.displayY)



      // Draw formal charge if non-zero
      if (stabilityInfo && stabilityInfo.formalCharge !== 0) {
        ctx.fillStyle = stabilityInfo.formalCharge > 0 ? '#ff6666' : '#6666ff'
        ctx.font = `bold ${Math.floor(12 * atom.scale)}px Arial`
        const chargeText = stabilityInfo.formalCharge > 0
          ? `+${stabilityInfo.formalCharge}`
          : `${stabilityInfo.formalCharge}`
        ctx.fillText(chargeText, atom.displayX + 15 * atom.scale, atom.displayY - 15 * atom.scale)
      }

      // Draw electron need indicator
      if (stabilityInfo && stabilityInfo.needsElectrons > 0) {
        ctx.fillStyle = '#ffaa00'
        ctx.font = `${Math.floor(10 * atom.scale)}px Arial`
        ctx.fillText(`needs ${stabilityInfo.needsElectrons}e-`, atom.displayX, atom.displayY + 30 * atom.scale)
      }
    })

    // Draw bond angles if enabled
    if (showBondAngles && atoms.length >= 3) {
      const bondAngles = findBondAngles(atoms, bonds)

      bondAngles.forEach((angle) => {
        const atom1 = atoms.find((a) => a.id === angle.atom1Id)
        const atom2 = atoms.find((a) => a.id === angle.atom2Id) // Vertex
        const atom3 = atoms.find((a) => a.id === angle.atom3Id)

        if (!atom1 || !atom2 || !atom3) return

        // Draw arc
        drawAngleArc(ctx, atom1.x, atom1.y, atom2.x, atom2.y, atom3.x, atom3.y, 25, '#00ffff')

        // Draw angle label
        ctx.fillStyle = '#00ffff'
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${angle.angle}°`, angle.position.x, angle.position.y)
      })
    }

    // Draw lasso selection polygon
    if (lassoPoints.length > 0) {
      drawLassoPolygon(ctx, lassoPoints)
    }

    ctx.restore()

  }, [atoms, bonds, blinkingAtoms, hoveredAtom, connectionLine, isShaking, validation, selectedAtomIds, selectedBondIds, canvasOffset, canvasRotation, canvasSize, showBondAngles, lassoPoints, is3DMode, rotation3D])



  // Responsive canvas sizing for different viewports/DPI

  useEffect(() => {
    const frame = requestAnimationFrame(() => resizeCanvas())

    const observer = new ResizeObserver(() => resizeCanvas())
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }

  }, [resizeCanvas])



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



  // Keyboard shortcuts for deletion, selection

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      // Select All (Ctrl+A or Cmd+A)

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {

        e.preventDefault()

        const { atomIds, bondIds } = selectAll(atoms, bonds)

        setSelectedAtomIds(atomIds)

        setSelectedBondIds(bondIds)

        announceSelection(atomIds.length, bondIds.length)

        return

      }



      // Invert Selection (Ctrl+Shift+I or Cmd+Shift+I)

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i') {

        e.preventDefault()

        const { atomIds, bondIds } = invertSelection(atoms, bonds, selectedAtomIds, selectedBondIds)

        setSelectedAtomIds(atomIds)

        setSelectedBondIds(bondIds)

        announceSelection(atomIds.length, bondIds.length)

        return

      }



      // Delete/Backspace

      if (e.key === 'Delete' || e.key === 'Backspace') {

        e.preventDefault();

        if (selectedAtomIds.length > 0) {

          onDeleteAtoms(selectedAtomIds);

          setSelectedAtomIds([]);

        }

        if (selectedBondIds.length > 0) {

          onDeleteBonds(selectedBondIds);

          setSelectedBondIds([]);

        }

      }

    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [selectedAtomIds, selectedBondIds, atoms, bonds, onDeleteAtoms, onDeleteBonds]);



  // Global mouseup handler to ensure drag always ends properly

  useEffect(() => {

    const handleGlobalMouseUp = () => {

      if (isMouseDownRef.current) {

        if (isDragging) {

          onDragEnd()

        }

        // Clean up all drag states

        isMouseDownRef.current = false

        setDraggedAtom(null)

        setConnectionLine(null)

        setIsDragging(false)

        setClickStartPos(null)

        draggedGroupDataRef.current = null

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

  }, [isDragging, onDragEnd])



  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {

    const canvas = canvasRef.current

    if (!canvas) return



    const rect = canvas.getBoundingClientRect()

    const x = e.clientX - rect.left

    const y = e.clientY - rect.top

    const clamped = clampToCanvas(x, y)



    // Mark mouse as down and set up for drag detection

    isMouseDownRef.current = true

    setClickStartPos({ x: clamped.x, y: clamped.y })

    setIsDragging(false)



    // Check for atom click first (priority)

    const clickedAtom = atoms.find(atom => {

      const distance = Math.sqrt((atom.x - clamped.x) ** 2 + (atom.y - clamped.y) ** 2)

      return distance < 20 // Use a smaller radius to avoid accidental clicks

    })



    if (clickedAtom) {

      if (e.button === 2) { // Right-click on atom

        e.preventDefault()

        hapticDelete()

        onDeleteAtoms([clickedAtom.id])

      } else if (e.button === 0) { // Left-click on atom

        hapticSelect()

        setDraggedAtom(clickedAtom)

        setSelectedBondIds([]) // Deselect bonds when interacting with atoms



        const isSelected = selectedAtomIds.includes(clickedAtom.id)

        const idsToDrag = (isSelected ? selectedAtomIds : [clickedAtom.id]);

        

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

      }

    } else {

      // If no atom was clicked, check for bond clicks

      const clickThreshold = 10;

      let clickedBond: BuilderBond | null = null;

      for (const bond of bonds) {

        const atom1 = atoms.find(a => a.id === bond.atom1Id);

        const atom2 = atoms.find(a => a.id === bond.atom2Id);

        if (atom1 && atom2) {

          const distance = getDistanceToLineSegment(clamped.x, clamped.y, atom1.x, atom1.y, atom2.x, atom2.y);

          if (distance < clickThreshold) {

            clickedBond = bond;

            break;

          }

        }

      }



      if (clickedBond) {

        if (e.button === 2) { // Right-click on bond

          e.preventDefault();

          hapticDelete()

          onDeleteBonds([clickedBond.id]);

        } else if (e.button === 0) { // Left-click on bond

          hapticSelect()

          setSelectedAtomIds([]); // Deselect atoms

          const clickedId = clickedBond.id;

          if (e.shiftKey) {

            setSelectedBondIds(prev => prev.includes(clickedId) ? prev.filter(id => id !== clickedId) : [...prev, clickedId]);

          } else {

            setSelectedBondIds([clickedId]);

          }

        }

      } else {

        // If nothing was clicked, it's a click on empty space

        if (e.button === 0) {

          hapticAtomAdd()

          setSelectedAtomIds([])

          setSelectedBondIds([])

          onAddAtom(clamped.x, clamped.y)

        }

      }

    }

  }



  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {

    const canvas = canvasRef.current

    if (!canvas) return



    const rect = canvas.getBoundingClientRect()

    const x = e.clientX - rect.left

    const y = e.clientY - rect.top

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

        if (draggedAtom && !selectedAtomIds.includes(draggedAtom!.id) && !e.shiftKey) {

             setSelectedAtomIds([draggedAtom!.id]);

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

      setConnectionLine(null) // No connection line during group drag

      canvas.style.cursor = 'grabbing'

    } else if (draggedAtom) {

      // This case handles dragging for bond creation when not in a group drag

      setConnectionLine({

        x1: draggedAtom.x,

        y1: draggedAtom.y,

        x2: clamped.x,

        y2: clamped.y,

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



  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {

    // Handle bond creation on drag end

    if (isDragging && draggedAtom && hoveredAtom && draggedAtom.id !== hoveredAtom.id) {

       // Check if we are dragging a group. If so, don't create a bond.

       const isGroupDrag = draggedGroupDataRef.current && draggedGroupDataRef.current.initialAtomPositions.size > 1;

       if (!isGroupDrag) {

          hapticBondCreate()

          onAddBond(draggedAtom.id, hoveredAtom.id)

       }

    }

    // Handle selection on click

    else if (draggedAtom && !isDragging) {

      const clickedId = draggedAtom.id

      if (e.shiftKey) {

        // Shift-click: toggle selection

        setSelectedAtomIds(prevSelected =>

          prevSelected.includes(clickedId)

            ? prevSelected.filter(id => id !== clickedId)

            : [...prevSelected, clickedId]

        )

      } else {

        // Normal click: select only this atom

        setSelectedAtomIds([clickedId])

      }

    }



    // General cleanup

    isMouseDownRef.current = false

    setDraggedAtom(null)

    setConnectionLine(null)

    setClickStartPos(null)

    if(isDragging) onDragEnd();

    setIsDragging(false)

    draggedGroupDataRef.current = null

  }



  const handleContextMenu = (e: React.MouseEvent) => {

    e.preventDefault()

  }

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const touches = Array.from(e.touches)
    touchStartRef.current = { touches, time: Date.now() }

    // Clear any existing hold timer
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current)
      touchHoldTimerRef.current = null
    }

    if (touches.length === 1) {
      // Single touch - check for long press
      const touch = touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const clamped = clampToCanvas(x, y)

      // Check if touching an atom
      const touchedAtom = atoms.find(atom => {
        const distance = Math.sqrt((atom.x - clamped.x) ** 2 + (atom.y - clamped.y) ** 2)
        return distance < 25
      })

      // Start long press timer for context menu
      touchHoldTimerRef.current = setTimeout(() => {
        hapticMedium()
        setTouchMenuVisible(true)
        setTouchMenuPosition({ x: touch.clientX, y: touch.clientY })
        setTouchMenuTarget(touchedAtom || null)
      }, 500) // 500ms long press

    } else if (touches.length === 2) {
      // Two-finger gesture - calculate initial distance and angle
      const dx = touches[1].clientX - touches[0].clientX
      const dy = touches[1].clientY - touches[0].clientY
      lastTouchDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
      lastTouchAngleRef.current = Math.atan2(dy, dx)
      isPanningRef.current = true
      hapticLight()
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !touchStartRef.current) return

    // Cancel long press if moving
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current)
      touchHoldTimerRef.current = null
    }

    const touches = Array.from(e.touches)

    if (touches.length === 2 && isPanningRef.current) {
      e.preventDefault()

      // Calculate current distance and angle
      const dx = touches[1].clientX - touches[0].clientX
      const dy = touches[1].clientY - touches[0].clientY
      const currentDistance = Math.sqrt(dx * dx + dy * dy)
      const currentAngle = Math.atan2(dy, dx)

      // Pan: move canvas based on center point movement
      const currentCenterX = (touches[0].clientX + touches[1].clientX) / 2
      const currentCenterY = (touches[0].clientY + touches[1].clientY) / 2
      const startCenterX = (touchStartRef.current.touches[0].clientX + touchStartRef.current.touches[1].clientX) / 2
      const startCenterY = (touchStartRef.current.touches[0].clientY + touchStartRef.current.touches[1].clientY) / 2

      const panDx = currentCenterX - startCenterX
      const panDy = currentCenterY - startCenterY

      setCanvasOffset(prev => ({
        x: prev.x + panDx * 0.5,
        y: prev.y + panDy * 0.5,
      }))

      // Rotate: detect rotation gesture
      if (lastTouchAngleRef.current !== null) {
        let angleDiff = currentAngle - lastTouchAngleRef.current
        // Normalize to -π to π
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

        // Only rotate if significant (> 0.05 radians ≈ 3 degrees)
        if (Math.abs(angleDiff) > 0.05) {
          setCanvasRotation(prev => prev + angleDiff)
          lastTouchAngleRef.current = currentAngle
          hapticLight()
        }
      }

      // Update touch start for next move
      touchStartRef.current = { touches, time: Date.now() }
      lastTouchDistanceRef.current = currentDistance
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Clear long press timer
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current)
      touchHoldTimerRef.current = null
    }

    if (e.touches.length === 0) {
      // All touches ended
      touchStartRef.current = null
      lastTouchDistanceRef.current = null
      lastTouchAngleRef.current = null
      isPanningRef.current = false
    } else if (e.touches.length === 1) {
      // One finger remaining - reset two-finger gesture
      lastTouchDistanceRef.current = null
      lastTouchAngleRef.current = null
      isPanningRef.current = false
    }
  }

  const closeTouchMenu = () => {
    setTouchMenuVisible(false)
    setTouchMenuTarget(null)
  }



  return (

    <div ref={containerRef} className={`relative w-full ${isShaking ? 'animate-shake' : ''}`}>

      {/* Canvas description for screen readers */}

      <div id="canvas-instructions" className="sr-only">

        Interactive molecule canvas.

        Click empty space to add an atom.

        Click an atom or bond to select.

        Use Shift+Click to select multiple items.

        Drag selected atoms to move them.

        Drag between atoms to create a bond.

        Right-click an item to delete it.

        Press Delete or Backspace to delete all selected items.

        Press Ctrl+A to select all.

        Press Ctrl+Shift+I to invert selection.

        Use Ctrl+Z to undo and Ctrl+Y to redo.

      </div>



      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="w-full rounded-2xl border border-cyan-400/20 bg-slate-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)] cursor-crosshair touch-none"
        aria-label="Interactive molecule canvas"
        aria-describedby="canvas-instructions"
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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

      {validation && (

        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-lg">

          <span className="text-white font-mono text-lg">{validation.formula}</span>

        </div>

      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          className={`px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${
            is3DMode
              ? 'bg-purple-500 text-black hover:bg-purple-400'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-600'
          }`}
          onClick={() => {
            setIs3DMode(!is3DMode)
            hapticMedium()
          }}
          title={is3DMode ? 'Switch to 2D view' : 'Switch to 3D view'}
        >
          🎲 {is3DMode ? '2D' : '3D'}
        </button>
        <button
          className={`px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${
            showBondAngles
              ? 'bg-cyan-500 text-black hover:bg-cyan-400'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-600'
          }`}
          onClick={() => {
            setShowBondAngles(!showBondAngles)
            hapticLight()
          }}
          title={showBondAngles ? 'Hide bond angles' : 'Show bond angles'}
        >
          📐 {showBondAngles ? 'Hide' : 'Show'} Angles
        </button>
        <button
          className={`px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${
            isLassoMode
              ? 'bg-green-500 text-black hover:bg-green-400'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-600'
          }`}
          onClick={() => {
            setIsLassoMode(!isLassoMode)
            setLassoPoints([])
            hapticLight()
          }}
          title={isLassoMode ? 'Exit lasso mode (or press Alt)' : 'Enter lasso mode (or hold Alt)'}
        >
          ✏️ {isLassoMode ? 'Exit' : 'Lasso'}
        </button>
      </div>

      {/* 3D Rotation Controls */}
      {is3DMode && (
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-sm border border-purple-400/30 rounded-xl px-4 py-3 shadow-2xl">
          <div className="text-xs font-bold text-purple-300 mb-2">3D Rotation</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-8">X:</span>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation3D.x}
                onChange={(e) => {
                  setRotation3D(prev => ({ ...prev, x: Number(e.target.value) }))
                  hapticLight()
                }}
                className="w-32 h-1"
              />
              <span className="text-xs text-purple-300 w-10">{Math.round(rotation3D.x)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-8">Y:</span>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation3D.y}
                onChange={(e) => {
                  setRotation3D(prev => ({ ...prev, y: Number(e.target.value) }))
                  hapticLight()
                }}
                className="w-32 h-1"
              />
              <span className="text-xs text-purple-300 w-10">{Math.round(rotation3D.y)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-8">Z:</span>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation3D.z}
                onChange={(e) => {
                  setRotation3D(prev => ({ ...prev, z: Number(e.target.value) }))
                  hapticLight()
                }}
                className="w-32 h-1"
              />
              <span className="text-xs text-purple-300 w-10">{Math.round(rotation3D.z)}°</span>
            </div>
            <button
              className="w-full mt-2 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs rounded transition"
              onClick={() => {
                setRotation3D({ x: 20, y: 30, z: 0 })
                hapticLight()
              }}
            >
              Reset View
            </button>
          </div>
        </div>
      )}

      {/* Touch Hold Menu */}
      {touchMenuVisible && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={closeTouchMenu}
            onTouchEnd={closeTouchMenu}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-slate-900/95 backdrop-blur-sm border border-cyan-400/30 rounded-xl shadow-2xl min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: `${touchMenuPosition.x}px`,
              top: `${touchMenuPosition.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="py-2">
              {touchMenuTarget ? (
                // Menu for atom
                <>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-700">
                    {touchMenuTarget.element} Atom
                  </div>
                  <button
                    className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
                    onClick={() => {
                      hapticSelect()
                      setSelectedAtomIds([touchMenuTarget.id])
                      closeTouchMenu()
                    }}
                  >
                    <span className="text-cyan-400">✓</span>
                    <span>Select</span>
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-3"
                    onClick={() => {
                      hapticDelete()
                      onDeleteAtoms([touchMenuTarget.id])
                      closeTouchMenu()
                    }}
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                // Menu for canvas
                <>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-700">
                    Canvas Actions
                  </div>
                  <button
                    className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
                    onClick={() => {
                      hapticLight()
                      setCanvasOffset({ x: 0, y: 0 })
                      setCanvasRotation(0)
                      closeTouchMenu()
                    }}
                  >
                    <span className="text-cyan-400">↺</span>
                    <span>Reset View</span>
                  </button>
                  <button
                    className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
                    onClick={() => {
                      hapticLight()
                      const { atomIds, bondIds } = selectAll(atoms, bonds)
                      setSelectedAtomIds(atomIds)
                      setSelectedBondIds(bondIds)
                      closeTouchMenu()
                    }}
                  >
                    <span className="text-cyan-400">✓</span>
                    <span>Select All</span>
                  </button>
                  {selectedAtomIds.length > 0 && (
                    <button
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-3"
                      onClick={() => {
                        hapticDelete()
                        onDeleteAtoms(selectedAtomIds)
                        setSelectedAtomIds([])
                        closeTouchMenu()
                      }}
                    >
                      <span>🗑️</span>
                      <span>Delete Selected</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
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
