'use client'

// VerChem - 3D Molecular Viewer Component
// Interactive 3D visualization of molecules

import { useRef, useEffect, useState, useCallback, startTransition } from 'react'
import type { Molecule3D, ViewerState, Atom3D, DisplayStyle } from '@/lib/types/chemistry'
import {
  project3DTo2D,
  sortAtomsByDepth,
  getDefaultViewerState,
  calculateAutoZoom,
  centerMolecule,
  findAtomAtPosition,
  PRESET_VIEWS,
} from '@/lib/utils/3d-viewer'

interface MoleculeViewer3DProps {
  molecule: Molecule3D
  width?: number
  height?: number
  displayStyle?: DisplayStyle
  showLabels?: boolean
  autoRotate?: boolean
  backgroundColor?: string
  onAtomClick?: (atom: Atom3D) => void
}

export default function MoleculeViewer3D({
  molecule,
  width = 600,
  height = 600,
  displayStyle = 'ball-stick',
  showLabels = true,
  autoRotate = false,
  backgroundColor = '#000000',
  onAtomClick,
}: MoleculeViewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewerState, setViewerState] = useState<ViewerState>(getDefaultViewerState())
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [hoveredAtom, setHoveredAtom] = useState<Atom3D | null>(null)

  // Helper functions for color manipulation
  const lightenColor = (color: string, percent: number): string => {
    // Convert hex to RGB
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  const darkenColor = (color: string, percent: number): string => {
    // Convert hex to RGB
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)
  }

  // Center molecule and auto-zoom on mount
  useEffect(() => {
    const centered = centerMolecule(molecule)
    const autoZoom = calculateAutoZoom(centered, width, height)
    startTransition(() => {
      setViewerState((prev) => ({
        ...prev,
        zoom: autoZoom,
      }))
    })
  }, [molecule, width, height])

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return

    const interval = setInterval(() => {
      setViewerState((prev) => ({
        ...prev,
        rotation: {
          ...prev.rotation,
          y: (prev.rotation.y + 1) % 360,
        },
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [autoRotate])

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Center molecule
    const centered = centerMolecule(molecule)

    // Sort atoms by depth (back to front)
    const sortedAtoms = sortAtomsByDepth(centered.atoms, viewerState)

    // Draw bonds first (behind atoms)
    centered.bonds.forEach((bond) => {
      const atom1 = centered.atoms[bond.atom1Index]
      const atom2 = centered.atoms[bond.atom2Index]

      if (!atom1 || !atom2) return

      const pos1 = project3DTo2D(atom1.position, viewerState, width, height)
      const pos2 = project3DTo2D(atom2.position, viewerState, width, height)

      // Draw bond based on order
      if (displayStyle === 'wireframe' || displayStyle === 'stick') {
        // Thin bonds
        ctx.strokeStyle = '#888888'
        ctx.lineWidth = bond.order === 1 ? 4 : bond.order === 2 ? 6 : 8  // Increased bond widths even more for better visibility
        ctx.beginPath()
        ctx.moveTo(pos1.x, pos1.y)
        ctx.lineTo(pos2.x, pos2.y)
        ctx.stroke()
      } else {
        // Ball-stick: colored half-bonds
        const midX = (pos1.x + pos2.x) / 2
        const midY = (pos1.y + pos2.y) / 2

        // Offset for double/triple bonds
        const offset = bond.order > 1 ? 8 : 0  // Increased from 6 to 8 for better separation
        const perpX = -(pos2.y - pos1.y)
        const perpY = pos2.x - pos1.x
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY)
        const perpUnitX = perpLen > 0 ? perpX / perpLen : 0
        const perpUnitY = perpLen > 0 ? perpY / perpLen : 0

        for (let i = 0; i < bond.order; i++) {
          const offsetAmount = (i - (bond.order - 1) / 2) * offset

          // First half (atom1 color)
          ctx.strokeStyle = atom1.color || '#FFFFFF'
          ctx.lineWidth = 4  // Increased bond thickness even more for better visibility
          ctx.beginPath()
          ctx.moveTo(
            pos1.x + perpUnitX * offsetAmount,
            pos1.y + perpUnitY * offsetAmount
          )
          ctx.lineTo(midX + perpUnitX * offsetAmount, midY + perpUnitY * offsetAmount)
          ctx.stroke()

          // Second half (atom2 color)
          ctx.strokeStyle = atom2.color || '#FFFFFF'
          ctx.lineWidth = 4  // Increased bond thickness even more for better visibility
          ctx.beginPath()
          ctx.moveTo(midX + perpUnitX * offsetAmount, midY + perpUnitY * offsetAmount)
          ctx.lineTo(
            pos2.x + perpUnitX * offsetAmount,
            pos2.y + perpUnitY * offsetAmount
          )
          ctx.stroke()
        }
      }
    })

    // Draw atoms
    sortedAtoms.forEach((atom) => {
      const pos = project3DTo2D(atom.position, viewerState, width, height)

      // Calculate radius based on display style
      let radius: number
      if (displayStyle === 'space-filling') {
        radius = ((atom.radius || 150) / 60) * viewerState.zoom  // Increased from 80 to 60 for even larger atoms
      } else if (displayStyle === 'wireframe') {
        radius = 0 // No atoms in wireframe
      } else if (displayStyle === 'stick') {
        radius = 8  // Increased from 4 to 8 for much larger atoms
      } else {
        // ball-stick - DEFAULT STYLE
        radius = 18 * viewerState.zoom  // Increased from 12 to 18 for maximum size as requested
      }

      if (radius > 0) {
        // Highlight hovered atom
        const isHovered = hoveredAtom?.index === atom.index
        const baseColor = atom.color || '#FFFFFF'

        // === ใหม่! ทำให้ดูเท่แบบ 3D จริงๆ ===
        
        // 1. วาดเงาสะท้อนด้านล่างก่อน (ทำให้ดูลอย)
        const shadowOffset = radius * 0.3
        const shadowGradient = ctx.createRadialGradient(
          pos.x + shadowOffset,
          pos.y + shadowOffset,
          0,
          pos.x + shadowOffset,
          pos.y + shadowOffset,
          radius * 1.2
        )
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = shadowGradient
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        ctx.arc(pos.x + shadowOffset, pos.y + shadowOffset, radius * 1.1, 0, 2 * Math.PI)
        ctx.fill()
        ctx.globalAlpha = 1

        // 2. วาดอะตอมแบบ 3D มีมิติ
        // 2.1 วาดวงกลมใหญ่ด้านล่าง (ทำให้ดูหนา)
        ctx.fillStyle = darkenColor(baseColor, 25)
        ctx.beginPath()
        ctx.arc(pos.x + 2, pos.y + 2, radius * 0.9, 0, 2 * Math.PI)
        ctx.fill()

        // 2.2 วาดวงกลมหลักด้านบน
        const mainGradient = ctx.createRadialGradient(
          pos.x - radius * 0.4,  // แสงจากซ้ายบน
          pos.y - radius * 0.4,
          0,
          pos.x,
          pos.y,
          radius
        )
        mainGradient.addColorStop(0, lightenColor(baseColor, 60))  // ไฮไลท์สว่างมาก
        mainGradient.addColorStop(0.3, lightenColor(baseColor, 30))  // สว่าง
        mainGradient.addColorStop(0.7, baseColor)  // สีปกติ
        mainGradient.addColorStop(1, darkenColor(baseColor, 40))  // มืดด้านขวาล่าง

        ctx.fillStyle = mainGradient
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
        ctx.fill()

        // 2.3 เพิ่มความมันเงาแบบโลหะ
        const metallicHighlight = ctx.createRadialGradient(
          pos.x - radius * 0.5,
          pos.y - radius * 0.5,
          0,
          pos.x - radius * 0.5,
          pos.y - radius * 0.5,
          radius * 0.6
        )
        metallicHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
        metallicHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
        metallicHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.fillStyle = metallicHighlight
        ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.globalAlpha = 1

        // 2.4 จุดสะท้อนแสงสุดท้าย (ทำให้ดูแข็งแรง)
        const finalHighlight = ctx.createRadialGradient(
          pos.x - radius * 0.6,
          pos.y - radius * 0.6,
          0,
          pos.x - radius * 0.6,
          pos.y - radius * 0.6,
          radius * 0.2
        )
        finalHighlight.addColorStop(0, 'rgba(255, 255, 255, 1)')
        finalHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.fillStyle = finalHighlight
        ctx.beginPath()
        ctx.arc(pos.x - radius * 0.6, pos.y - radius * 0.6, radius * 0.15, 0, 2 * Math.PI)
        ctx.fill()

        // 3. ขอบอะตอมแบบมีมิติ
        const edgeGradient = ctx.createLinearGradient(
          pos.x - radius, pos.y - radius,
          pos.x + radius, pos.y + radius
        )
        edgeGradient.addColorStop(0, lightenColor(baseColor, 20))
        edgeGradient.addColorStop(0.5, baseColor)
        edgeGradient.addColorStop(1, darkenColor(baseColor, 30))

        ctx.strokeStyle = isHovered ? '#FFFF00' : edgeGradient
        ctx.lineWidth = isHovered ? 4 : 3
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()

        // Draw formal charge if any
        if (atom.formalCharge && atom.formalCharge !== 0) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const chargeText =
            atom.formalCharge > 0
              ? `+${atom.formalCharge}`
              : `${atom.formalCharge}`
          ctx.fillText(chargeText, pos.x + radius + 10, pos.y - radius - 10)
        }
      }

      // Draw labels - positioned above the atom for better visibility
      if (showLabels) {
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 16px Arial'  // Increased from 14px to 16px for better readability
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'  // Changed from 'middle' to 'bottom' for better positioning
        const labelOffset = radius + 12  // Increased from 8 to 12 for more spacing above atom
        ctx.fillText(atom.element, pos.x, pos.y - labelOffset)
      }
    })

    // Draw hovered atom info
    if (hoveredAtom) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(10, 10, 200, 60)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '14px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`Element: ${hoveredAtom.element}`, 20, 20)
      ctx.fillText(`Index: ${hoveredAtom.index}`, 20, 40)
    }
  }, [
    molecule,
    viewerState,
    width,
    height,
    displayStyle,
    showLabels,
    backgroundColor,
    hoveredAtom,
  ])

  // Render on state change
  useEffect(() => {
    render()
  }, [render])

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x
      const dy = e.clientY - lastMousePos.y

      setViewerState((prev) => ({
        ...prev,
        rotation: {
          x: prev.rotation.x + dy * 0.8,  // Increased sensitivity from 0.5 to 0.8
          y: prev.rotation.y + dx * 0.8,  // Increased sensitivity from 0.5 to 0.8
          z: prev.rotation.z,
        },
      }))

      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else {
      // Check for hovered atom
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const centered = centerMolecule(molecule)
      const atom = findAtomAtPosition(
        mouseX,
        mouseY,
        centered,
        viewerState,
        width,
        height
      )

      setHoveredAtom(atom)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredAtom(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onAtomClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const centered = centerMolecule(molecule)
    const atom = findAtomAtPosition(
      mouseX,
      mouseY,
      centered,
      viewerState,
      width,
      height
    )

    if (atom) {
      onAtomClick(atom)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1

    setViewerState((prev) => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(8, prev.zoom * zoomDelta)),  // Increased max zoom from 5 to 8
    }))
  }

  // Control buttons
  const resetView = () => {
    const centered = centerMolecule(molecule)
    const autoZoom = calculateAutoZoom(centered, width, height)
    setViewerState({
      ...getDefaultViewerState(),
      zoom: autoZoom,
    })
  }

  const setPresetView = (preset: keyof typeof PRESET_VIEWS) => {
    setViewerState((prev) => ({
      ...prev,
      rotation: PRESET_VIEWS[preset],
    }))
  }

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded-lg cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-black/80 rounded-lg p-2 space-y-1">
        <button
          onClick={resetView}
          className="w-full px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Reset View
        </button>
        <button
          onClick={() => setPresetView('front')}
          className="w-full px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          Front
        </button>
        <button
          onClick={() => setPresetView('side')}
          className="w-full px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          Side
        </button>
        <button
          onClick={() => setPresetView('top')}
          className="w-full px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
        >
          Top
        </button>
      </div>

      {/* Info */}
      <div className="absolute top-4 left-4 bg-black/80 rounded-lg p-3">
        <h3 className="text-white font-bold">{molecule.name}</h3>
        <p className="text-gray-300 text-sm">{molecule.formula}</p>
        {molecule.geometry && (
          <p className="text-gray-400 text-xs mt-1">
            Geometry: {molecule.geometry}
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/80 rounded-lg p-2 text-xs text-gray-300">
        <p>🖱️ Drag to rotate</p>
        <p>🔄 Scroll to zoom</p>
        <p>👆 Click atom for info</p>
      </div>
    </div>
  )
}
