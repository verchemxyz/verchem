'use client'

// VerChem - VSEPR Geometry Viewer Component
// Visual representation of molecular geometry

import React from 'react'
import type { VSEPRPrediction } from '@/lib/calculations/vsepr-geometry'

interface VSEPRViewerProps {
  prediction: VSEPRPrediction
  width?: number
  height?: number
}

export default function VSEPRViewer({
  prediction,
  width = 400,
  height = 400,
}: VSEPRViewerProps) {
  // Render simple 2D representation of geometry
  const renderGeometry = () => {
    const cx = width / 2
    const cy = height / 2
    const radius = 80

    const elements: React.JSX.Element[] = []

    // Central atom
    elements.push(
      <circle
        key="central"
        cx={cx}
        cy={cy}
        r={25}
        fill="#3B82F6"
        stroke="#1E40AF"
        strokeWidth={2}
      />
    )
    elements.push(
      <text
        key="central-text"
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-white font-bold text-lg"
      >
        {prediction.centralAtom}
      </text>
    )

    // Surrounding atoms based on geometry
    const positions: { x: number; y: number }[] = []

    switch (prediction.molecularGeometry) {
      case 'linear':
        positions.push(
          { x: cx - radius, y: cy },
          { x: cx + radius, y: cy }
        )
        break

      case 'bent':
        const angle = prediction.bondAngles[0] || 104.5
        const rad = (angle / 2) * (Math.PI / 180)
        positions.push(
          { x: cx - radius * Math.cos(rad), y: cy - radius * Math.sin(rad) },
          { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) }
        )
        break

      case 'trigonal-planar':
        for (let i = 0; i < 3; i++) {
          const a = (i * 120 - 90) * (Math.PI / 180)
          positions.push({
            x: cx + radius * Math.cos(a),
            y: cy + radius * Math.sin(a),
          })
        }
        break

      case 'trigonal-pyramidal':
        // Top atom
        positions.push({ x: cx, y: cy - radius })
        // Two bottom atoms
        positions.push(
          { x: cx - radius * 0.866, y: cy + radius * 0.5 },
          { x: cx + radius * 0.866, y: cy + radius * 0.5 }
        )
        break

      case 'tetrahedral':
        // Simplified 2D projection
        positions.push(
          { x: cx, y: cy - radius },
          { x: cx, y: cy + radius },
          { x: cx - radius, y: cy },
          { x: cx + radius, y: cy }
        )
        break

      case 'trigonal-bipyramidal':
        // Equatorial (3)
        for (let i = 0; i < 3; i++) {
          const a = (i * 120 - 90) * (Math.PI / 180)
          positions.push({
            x: cx + radius * Math.cos(a),
            y: cy + radius * Math.sin(a) * 0.5,
          })
        }
        // Axial (2)
        positions.push({ x: cx, y: cy - radius }, { x: cx, y: cy + radius })
        break

      case 'octahedral':
        positions.push(
          { x: cx, y: cy - radius },
          { x: cx, y: cy + radius },
          { x: cx - radius, y: cy },
          { x: cx + radius, y: cy },
          { x: cx - radius * 0.6, y: cy - radius * 0.6 },
          { x: cx + radius * 0.6, y: cy + radius * 0.6 }
        )
        break

      case 'seesaw':
        positions.push(
          { x: cx, y: cy - radius * 0.8 },
          { x: cx, y: cy + radius },
          { x: cx - radius, y: cy },
          { x: cx + radius, y: cy }
        )
        break

      case 'T-shaped':
        positions.push(
          { x: cx, y: cy - radius },
          { x: cx - radius, y: cy },
          { x: cx + radius, y: cy }
        )
        break

      case 'square-planar':
        positions.push(
          { x: cx, y: cy - radius },
          { x: cx, y: cy + radius },
          { x: cx - radius, y: cy },
          { x: cx + radius, y: cy }
        )
        break

      case 'square-pyramidal':
        // Base (4 atoms in square)
        positions.push(
          { x: cx, y: cy - radius * 0.7 },
          { x: cx, y: cy + radius * 0.7 },
          { x: cx - radius * 0.7, y: cy },
          { x: cx + radius * 0.7, y: cy }
        )
        // Top atom
        positions.push({ x: cx, y: cy - radius * 1.3 })
        break
    }

    // Draw bonds
    positions.forEach((pos, i) => {
      elements.push(
        <line
          key={`bond-${i}`}
          x1={cx}
          y1={cy}
          x2={pos.x}
          y2={pos.y}
          stroke="#6B7280"
          strokeWidth={3}
        />
      )
    })

    // Draw surrounding atoms
    positions.forEach((pos, i) => {
      elements.push(
        <circle
          key={`atom-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={20}
          fill="#EF4444"
          stroke="#991B1B"
          strokeWidth={2}
        />
      )
      elements.push(
        <text
          key={`atom-text-${i}`}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-white font-bold text-sm"
        >
          X
        </text>
      )
    })

    // Draw lone pairs
    if (prediction.lonePairs > 0) {
      const lpPositions: { x: number; y: number }[] = []

      // Position lone pairs opposite to bonds
      switch (prediction.molecularGeometry) {
        case 'bent':
          lpPositions.push({ x: cx, y: cy + radius * 0.7 })
          if (prediction.lonePairs === 2) {
            lpPositions.push({ x: cx, y: cy + radius * 1.1 })
          }
          break

        case 'trigonal-pyramidal':
          lpPositions.push({ x: cx, y: cy + radius * 1.2 })
          break

        case 'T-shaped':
          lpPositions.push(
            { x: cx, y: cy + radius * 0.7 },
            { x: cx, y: cy + radius * 1.1 }
          )
          break

        case 'seesaw':
          lpPositions.push({ x: cx + radius * 0.8, y: cy + radius * 0.6 })
          break

        case 'square-pyramidal':
          lpPositions.push({ x: cx, y: cy + radius * 1.5 })
          break

        default:
          // Generic positioning
          for (let i = 0; i < prediction.lonePairs; i++) {
            const a = (i * 60 + 180) * (Math.PI / 180)
            lpPositions.push({
              x: cx + radius * 0.5 * Math.cos(a),
              y: cy + radius * 0.5 * Math.sin(a),
            })
          }
      }

      // Draw lone pairs as dots
      lpPositions.forEach((pos, i) => {
        elements.push(
          <g key={`lp-${i}`}>
            <circle cx={pos.x - 4} cy={pos.y} r={3} fill="#FBBF24" />
            <circle cx={pos.x + 4} cy={pos.y} r={3} fill="#FBBF24" />
          </g>
        )
      })
    }

    return elements
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-4">
      <svg width={width} height={height} className="mx-auto">
        {renderGeometry()}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-800"></div>
          <span>Central Atom</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-800"></div>
          <span>Bonding Atoms</span>
        </div>
        {prediction.lonePairs > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            </div>
            <span>Lone Pairs</span>
          </div>
        )}
      </div>
    </div>
  )
}
