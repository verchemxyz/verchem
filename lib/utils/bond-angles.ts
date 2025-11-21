/**
 * Bond Angles Calculation Utilities
 * Calculate angles between atoms in molecules
 */

import type { BuilderAtom, BuilderBond } from '@/lib/utils/molecule-builder'

/**
 * Angle between three atoms (A-B-C where B is the vertex)
 */
export interface BondAngle {
  atom1Id: number
  atom2Id: number // Vertex atom
  atom3Id: number
  angle: number // In degrees
  position: { x: number; y: number } // Where to draw the label
}

/**
 * Calculate angle between three points (in degrees)
 * @param x1, y1 - First point
 * @param x2, y2 - Vertex point (center)
 * @param x3, y3 - Third point
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
): number {
  // Vectors from vertex to each point
  const v1x = x1 - x2
  const v1y = y1 - y2
  const v2x = x3 - x2
  const v2y = y3 - y2

  // Magnitudes
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y)
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y)

  if (mag1 === 0 || mag2 === 0) return 0

  // Dot product
  const dot = v1x * v2x + v1y * v2y

  // Angle in radians
  const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))))

  // Convert to degrees
  return (angleRad * 180) / Math.PI
}

/**
 * Find all bond angles in a molecule
 * Only returns significant angles (atoms with 2+ bonds)
 */
export function findBondAngles(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): BondAngle[] {
  const angles: BondAngle[] = []

  // For each atom, find all atoms bonded to it
  const bondMap = new Map<number, number[]>()

  bonds.forEach((bond) => {
    if (!bondMap.has(bond.atom1Id)) bondMap.set(bond.atom1Id, [])
    if (!bondMap.has(bond.atom2Id)) bondMap.set(bond.atom2Id, [])

    bondMap.get(bond.atom1Id)!.push(bond.atom2Id)
    bondMap.get(bond.atom2Id)!.push(bond.atom1Id)
  })

  // For each atom with 2+ bonds, calculate angles
  bondMap.forEach((neighbors, atomId) => {
    if (neighbors.length < 2) return // Need at least 2 bonds for an angle

    const centerAtom = atoms.find((a) => a.id === atomId)
    if (!centerAtom) return

    // Calculate all pairwise angles
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const atom1 = atoms.find((a) => a.id === neighbors[i])
        const atom3 = atoms.find((a) => a.id === neighbors[j])

        if (!atom1 || !atom3) continue

        const angle = calculateAngle(
          atom1.x,
          atom1.y,
          centerAtom.x,
          centerAtom.y,
          atom3.x,
          atom3.y
        )

        // Label position: slightly offset from center atom toward the midpoint
        const midAngle = Math.atan2(
          (atom1.y + atom3.y) / 2 - centerAtom.y,
          (atom1.x + atom3.x) / 2 - centerAtom.x
        )
        const labelDistance = 35 // Distance from center

        angles.push({
          atom1Id: atom1.id,
          atom2Id: centerAtom.id,
          atom3Id: atom3.id,
          angle: Math.round(angle * 10) / 10, // Round to 1 decimal
          position: {
            x: centerAtom.x + Math.cos(midAngle) * labelDistance,
            y: centerAtom.y + Math.sin(midAngle) * labelDistance,
          },
        })
      }
    }
  })

  return angles
}

/**
 * Draw an angle arc between three atoms
 * @param ctx - Canvas context
 * @param x1, y1 - First point
 * @param x2, y2 - Vertex point
 * @param x3, y3 - Third point
 * @param radius - Arc radius
 * @param color - Arc color
 */
export function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  radius: number = 25,
  color: string = '#00ffff'
): void {
  // Calculate start and end angles
  const angle1 = Math.atan2(y1 - y2, x1 - x2)
  const angle2 = Math.atan2(y3 - y2, x3 - x2)

  // Ensure we draw the smaller arc
  let startAngle = angle1
  let endAngle = angle2

  if (Math.abs(angle2 - angle1) > Math.PI) {
    if (angle1 < angle2) {
      startAngle = angle1 + 2 * Math.PI
    } else {
      endAngle = angle2 + 2 * Math.PI
    }
  }

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.arc(x2, y2, radius, startAngle, endAngle, false)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}
