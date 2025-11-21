'use client'

// VerChem - Lewis Structure Viewer Component
// 2D visualization of Lewis structures

import { useRef, useEffect } from 'react'
import type { LewisStructure } from '@/lib/calculations/lewis-structure'

interface LewisStructureViewerProps {
  structure: LewisStructure
  width?: number
  height?: number
  showFormalCharges?: boolean
  showLonePairs?: boolean
  backgroundColor?: string
}

export default function LewisStructureViewer({
  structure,
  width = 400,
  height = 400,
  showFormalCharges = true,
  showLonePairs = true,
  backgroundColor = '#FFFFFF',
}: LewisStructureViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Center coordinates
    const centerX = width / 2
    const centerY = height / 2

    // Draw bonds first (behind atoms)
    structure.atoms.forEach((atom) => {
      atom.bonds.forEach((bond) => {
        const toAtom = structure.atoms[bond.toAtomIndex]
        if (!toAtom) return

        const x1 = centerX + atom.x
        const y1 = centerY + atom.y
        const x2 = centerX + toAtom.x
        const y2 = centerY + toAtom.y

        // Only draw each bond once (from lower index to higher)
        if (atom.index > bond.toAtomIndex) return

        // Calculate perpendicular offset for multiple bonds
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const perpX = (-dy / len) * 8
        const perpY = (dx / len) * 8

        // Draw bonds based on order
        if (bond.order === 1) {
          // Single bond
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        } else if (bond.order === 2) {
          // Double bond
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2

          // First bond
          ctx.beginPath()
          ctx.moveTo(x1 + perpX / 2, y1 + perpY / 2)
          ctx.lineTo(x2 + perpX / 2, y2 + perpY / 2)
          ctx.stroke()

          // Second bond
          ctx.beginPath()
          ctx.moveTo(x1 - perpX / 2, y1 - perpY / 2)
          ctx.lineTo(x2 - perpX / 2, y2 - perpY / 2)
          ctx.stroke()
        } else if (bond.order === 3) {
          // Triple bond
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2

          // Center bond
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()

          // Top bond
          ctx.beginPath()
          ctx.moveTo(x1 + perpX, y1 + perpY)
          ctx.lineTo(x2 + perpX, y2 + perpY)
          ctx.stroke()

          // Bottom bond
          ctx.beginPath()
          ctx.moveTo(x1 - perpX, y1 - perpY)
          ctx.lineTo(x2 - perpX, y2 - perpY)
          ctx.stroke()
        }
      })
    })

    // Draw lone pairs
    if (showLonePairs) {
      structure.atoms.forEach((atom) => {
        if (atom.lonePairs === 0) return

        const x = centerX + atom.x
        const y = centerY + atom.y

        // Calculate angle to place lone pairs opposite to bonds
        let angle = 0
        if (atom.bonds.length > 0) {
          // Find average angle of bonds
          const bondAngles = atom.bonds.map((bond) => {
            const toAtom = structure.atoms[bond.toAtomIndex]
            if (!toAtom) return 0
            return Math.atan2(toAtom.y - atom.y, toAtom.x - atom.x)
          })
          const avgAngle = bondAngles.reduce((a, b) => a + b, 0) / bondAngles.length
          angle = avgAngle + Math.PI // Opposite direction
        }

        // Draw lone pairs as dots
        const pairRadius = 30
        const angleStep = Math.PI / (atom.lonePairs + 1)

        for (let i = 0; i < atom.lonePairs; i++) {
          const pairAngle = angle + (i - (atom.lonePairs - 1) / 2) * angleStep
          const pairX = x + pairRadius * Math.cos(pairAngle)
          const pairY = y + pairRadius * Math.sin(pairAngle)

          // Draw two dots for each pair
          const dotOffset = 3
          ctx.fillStyle = '#FF0000'

          // Dot 1
          ctx.beginPath()
          ctx.arc(
            pairX + dotOffset * Math.cos(pairAngle + Math.PI / 2),
            pairY + dotOffset * Math.sin(pairAngle + Math.PI / 2),
            2,
            0,
            2 * Math.PI
          )
          ctx.fill()

          // Dot 2
          ctx.beginPath()
          ctx.arc(
            pairX + dotOffset * Math.cos(pairAngle - Math.PI / 2),
            pairY + dotOffset * Math.sin(pairAngle - Math.PI / 2),
            2,
            0,
            2 * Math.PI
          )
          ctx.fill()
        }
      })
    }

    // Draw atoms
    structure.atoms.forEach((atom) => {
      const x = centerX + atom.x
      const y = centerY + atom.y

      // Draw element symbol
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(atom.element, x, y)

      // Draw formal charge
      if (showFormalCharges && atom.formalCharge !== 0) {
        const chargeText =
          atom.formalCharge > 0 ? `+${atom.formalCharge}` : `${atom.formalCharge}`
        ctx.fillStyle = '#0000FF'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(chargeText, x + 15, y - 15)
      }
    })

    // Draw info
    ctx.fillStyle = '#666666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Formula: ${structure.formula}`, 10, 20)
    ctx.fillText(`Valence electrons: ${structure.totalValenceElectrons}`, 10, 35)
    ctx.fillText(
      `Octet satisfied: ${structure.octetSatisfied ? 'Yes' : 'No'}`,
      10,
      50
    )
  }, [structure, width, height, showFormalCharges, showLonePairs, backgroundColor])

  return (
    <div className="inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg bg-white"
      />
    </div>
  )
}
