/**
 * Selection Utilities for Molecule Builder
 * Provides lasso selection, select all, and invert selection functionality
 */

import type { BuilderAtom, BuilderBond } from './molecule-builder'

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
  pointX: number,
  pointY: number,
  rectX1: number,
  rectY1: number,
  rectX2: number,
  rectY2: number
): boolean {
  const minX = Math.min(rectX1, rectX2)
  const maxX = Math.max(rectX1, rectX2)
  const minY = Math.min(rectY1, rectY2)
  const maxY = Math.max(rectY1, rectY2)

  return pointX >= minX && pointX <= maxX && pointY >= minY && pointY <= maxY
}

/**
 * Get atoms within a lasso selection rectangle
 *
 * @param atoms - All atoms
 * @param startX - Rectangle start X
 * @param startY - Rectangle start Y
 * @param endX - Rectangle end X
 * @param endY - Rectangle end Y
 * @returns Array of atom IDs within rectangle
 */
export function getAtomsInLasso(
  atoms: BuilderAtom[],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): number[] {
  return atoms
    .filter(atom => isPointInRect(atom.x, atom.y, startX, startY, endX, endY))
    .map(atom => atom.id)
}

/**
 * Get bonds where both atoms are selected
 *
 * @param bonds - All bonds
 * @param selectedAtomIds - Selected atom IDs
 * @returns Array of bond IDs where both endpoints are selected
 */
export function getBondsWithBothAtomsSelected(
  bonds: BuilderBond[],
  selectedAtomIds: number[]
): number[] {
  return bonds
    .filter(bond =>
      selectedAtomIds.includes(bond.atom1Id) && selectedAtomIds.includes(bond.atom2Id)
    )
    .map(bond => bond.id)
}

/**
 * Select all atoms and bonds
 *
 * @param atoms - All atoms
 * @param bonds - All bonds
 * @returns Object with all atom IDs and bond IDs
 */
export function selectAll(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): { atomIds: number[]; bondIds: number[] } {
  return {
    atomIds: atoms.map(a => a.id),
    bondIds: bonds.map(b => b.id),
  }
}

/**
 * Invert selection - select what's not selected, deselect what is selected
 *
 * @param atoms - All atoms
 * @param bonds - All bonds
 * @param currentAtomIds - Currently selected atom IDs
 * @param currentBondIds - Currently selected bond IDs
 * @returns Object with inverted selection
 */
export function invertSelection(
  atoms: BuilderAtom[],
  bonds: BuilderBond[],
  currentAtomIds: number[],
  currentBondIds: number[]
): { atomIds: number[]; bondIds: number[] } {
  const allAtomIds = atoms.map(a => a.id)
  const allBondIds = bonds.map(b => b.id)

  return {
    atomIds: allAtomIds.filter(id => !currentAtomIds.includes(id)),
    bondIds: allBondIds.filter(id => !currentBondIds.includes(id)),
  }
}

/**
 * Draw lasso selection rectangle on canvas
 *
 * @param ctx - Canvas 2D context
 * @param startX - Rectangle start X
 * @param startY - Rectangle start Y
 * @param endX - Rectangle end X
 * @param endY - Rectangle end Y
 */
export function drawLassoRect(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void {
  const width = endX - startX
  const height = endY - startY

  // Draw filled rectangle with transparency
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
  ctx.fillRect(startX, startY, width, height)

  // Draw border
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(startX, startY, width, height)
  ctx.setLineDash([])
}

/**
 * Announce selection to screen readers
 *
 * @param atomCount - Number of atoms selected
 * @param bondCount - Number of bonds selected
 */
export function announceSelection(atomCount: number, bondCount: number): void {
  const message = atomCount > 0 || bondCount > 0
    ? `Selected ${atomCount} atom${atomCount !== 1 ? 's' : ''} and ${bondCount} bond${bondCount !== 1 ? 's' : ''}`
    : 'Selection cleared'

  // Find or create announcement element
  let announcer = document.getElementById('selection-announcer')

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'selection-announcer'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  }

  // Announce message
  announcer.textContent = message

  // Clear after announcement
  setTimeout(() => {
    if (announcer) announcer.textContent = ''
  }, 1000)
}

/**
 * Point-in-polygon test (ray casting algorithm)
 * @param point - Point to test
 * @param polygon - Array of points forming the polygon
 * @returns true if point is inside polygon
 */
export function isPointInPolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>
): boolean {
  if (polygon.length < 3) return false

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Lasso selection - find atoms/bonds inside polygon
 * @param atoms - All atoms
 * @param bonds - All bonds
 * @param lassoPoints - Polygon points
 * @returns Selected atom and bond IDs
 */
export function selectByLasso(
  atoms: BuilderAtom[],
  bonds: BuilderBond[],
  lassoPoints: Array<{ x: number; y: number }>
): { atomIds: number[]; bondIds: number[] } {
  // Find atoms inside lasso
  const atomIds = atoms
    .filter((atom) => isPointInPolygon({ x: atom.x, y: atom.y }, lassoPoints))
    .map((atom) => atom.id)

  // Find bonds where BOTH atoms are selected
  const atomIdSet = new Set(atomIds)
  const bondIds = bonds
    .filter(
      (bond) =>
        atomIdSet.has(bond.atom1Id) && atomIdSet.has(bond.atom2Id)
    )
    .map((bond) => bond.id)

  return { atomIds, bondIds }
}

/**
 * Draw lasso polygon on canvas
 * @param ctx - Canvas 2D context
 * @param points - Lasso points
 */
export function drawLassoPolygon(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>
): void {
  if (points.length < 2) return

  // Draw filled polygon
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.fill()

  // Draw border
  ctx.strokeStyle = '#00ffff'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])
}
