// VerChem - 3D Viewer Utility Functions
// Mathematical functions for 3D molecular visualization

import type { Vector3D, ViewerState, Atom3D, Bond3D, Molecule3D } from '@/lib/types/chemistry'

/**
 * 3D Vector Operations
 */

export function vectorAdd(v1: Vector3D, v2: Vector3D): Vector3D {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
    z: v1.z + v2.z,
  }
}

export function vectorSubtract(v1: Vector3D, v2: Vector3D): Vector3D {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
    z: v1.z - v2.z,
  }
}

export function vectorScale(v: Vector3D, scale: number): Vector3D {
  return {
    x: v.x * scale,
    y: v.y * scale,
    z: v.z * scale,
  }
}

export function vectorLength(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export function vectorNormalize(v: Vector3D): Vector3D {
  const len = vectorLength(v)
  if (len === 0) return { x: 0, y: 0, z: 0 }
  return vectorScale(v, 1 / len)
}

export function vectorDot(v1: Vector3D, v2: Vector3D): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}

export function vectorCross(v1: Vector3D, v2: Vector3D): Vector3D {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  }
}

/**
 * Distance between two points
 */
export function distance3D(p1: Vector3D, p2: Vector3D): number {
  return vectorLength(vectorSubtract(p2, p1))
}

/**
 * Calculate angle between three points (in degrees)
 * B is the vertex
 */
export function calculateAngle(a: Vector3D, b: Vector3D, c: Vector3D): number {
  const ba = vectorSubtract(a, b)
  const bc = vectorSubtract(c, b)

  const dotProduct = vectorDot(ba, bc)
  const lengths = vectorLength(ba) * vectorLength(bc)

  if (lengths === 0) return 0

  const cosAngle = Math.max(-1, Math.min(1, dotProduct / lengths))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

/**
 * 3D Rotation Matrices
 */

// Rotate around X-axis
export function rotateX(point: Vector3D, degrees: number): Vector3D {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

// Rotate around Y-axis
export function rotateY(point: Vector3D, degrees: number): Vector3D {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  }
}

// Rotate around Z-axis
export function rotateZ(point: Vector3D, degrees: number): Vector3D {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  }
}

// Apply all rotations
export function applyRotation(point: Vector3D, rotation: ViewerState['rotation']): Vector3D {
  let result = point
  result = rotateX(result, rotation.x)
  result = rotateY(result, rotation.y)
  result = rotateZ(result, rotation.z)
  return result
}

/**
 * 3D to 2D Projection
 * Projects 3D coordinates onto 2D screen with perspective
 */
export function project3DTo2D(
  point: Vector3D,
  viewerState: ViewerState,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number; z: number } {
  // Apply rotation
  let rotated = applyRotation(point, viewerState.rotation)

  // Apply zoom with better scaling
  rotated = vectorScale(rotated, viewerState.zoom * 30)  // Add multiplier for better spacing

  // Perspective projection with improved settings
  const fov = 1000 // Wider field of view for less distortion
  const distance = 10 // Further camera distance
  const scale = fov / (fov + rotated.z * 5 + distance)  // Adjusted z-depth factor

  // Project to 2D
  const x2d = rotated.x * scale + screenWidth / 2 + viewerState.translation.x
  const y2d = rotated.y * scale + screenHeight / 2 + viewerState.translation.y

  return {
    x: x2d,
    y: y2d,
    z: rotated.z, // Keep z for depth sorting
  }
}

/**
 * Calculate molecule center (centroid)
 */
export function getMoleculeCenter(atoms: Atom3D[]): Vector3D {
  if (atoms.length === 0) return { x: 0, y: 0, z: 0 }

  const sum = atoms.reduce(
    (acc, atom) => vectorAdd(acc, atom.position),
    { x: 0, y: 0, z: 0 }
  )

  return vectorScale(sum, 1 / atoms.length)
}

/**
 * Center molecule at origin
 */
export function centerMolecule(molecule: Molecule3D): Molecule3D {
  const center = getMoleculeCenter(molecule.atoms)

  return {
    ...molecule,
    atoms: molecule.atoms.map((atom) => ({
      ...atom,
      position: vectorSubtract(atom.position, center),
    })),
  }
}

/**
 * Calculate bounding box
 */
export function getBoundingBox(atoms: Atom3D[]): {
  min: Vector3D
  max: Vector3D
  size: Vector3D
} {
  if (atoms.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      size: { x: 0, y: 0, z: 0 },
    }
  }

  const min: Vector3D = { x: Infinity, y: Infinity, z: Infinity }
  const max: Vector3D = { x: -Infinity, y: -Infinity, z: -Infinity }

  atoms.forEach((atom) => {
    const radius = (atom.radius || 150) / 100 // Convert pm to Angstroms
    min.x = Math.min(min.x, atom.position.x - radius)
    min.y = Math.min(min.y, atom.position.y - radius)
    min.z = Math.min(min.z, atom.position.z - radius)
    max.x = Math.max(max.x, atom.position.x + radius)
    max.y = Math.max(max.y, atom.position.y + radius)
    max.z = Math.max(max.z, atom.position.z + radius)
  })

  const size = vectorSubtract(max, min)

  return { min, max, size }
}

/**
 * Auto-zoom to fit molecule in viewport
 */
export function calculateAutoZoom(
  molecule: Molecule3D,
  screenWidth: number,
  screenHeight: number
): number {
  const bbox = getBoundingBox(molecule.atoms)
  const maxDimension = Math.max(bbox.size.x, bbox.size.y, bbox.size.z)

  if (maxDimension === 0) return 1.0

  const targetSize = Math.min(screenWidth, screenHeight) * 0.45  // Increased from 0.25 to 0.45 for larger molecules
  return targetSize / (maxDimension * 80)  // Increased to 80 for even less zoom
}

/**
 * Sort atoms by depth (for proper rendering order)
 * Atoms further away should be drawn first
 */
export function sortAtomsByDepth(
  atoms: Atom3D[],
  viewerState: ViewerState
): Atom3D[] {
  return [...atoms].sort((a, b) => {
    const aRotated = applyRotation(a.position, viewerState.rotation)
    const bRotated = applyRotation(b.position, viewerState.rotation)
    return aRotated.z - bRotated.z // Front to back
  })
}

/**
 * Check if bond is visible (both atoms are visible)
 */
export function isBondVisible(
  bond: Bond3D,
  atoms: Atom3D[],
  viewerState: ViewerState
): boolean {
  const atom1 = atoms[bond.atom1Index]
  const atom2 = atoms[bond.atom2Index]

  if (!atom1 || !atom2) return false

  // Simple visibility check based on Z-coordinate after rotation
  const pos1 = applyRotation(atom1.position, viewerState.rotation)
  const pos2 = applyRotation(atom2.position, viewerState.rotation)

  // If both atoms are behind camera, don't show bond
  return pos1.z > -10 || pos2.z > -10
}

/**
 * Calculate bond midpoint
 */
export function getBondMidpoint(bond: Bond3D, atoms: Atom3D[]): Vector3D {
  const atom1 = atoms[bond.atom1Index]
  const atom2 = atoms[bond.atom2Index]

  if (!atom1 || !atom2) return { x: 0, y: 0, z: 0 }

  return {
    x: (atom1.position.x + atom2.position.x) / 2,
    y: (atom1.position.y + atom2.position.y) / 2,
    z: (atom1.position.z + atom2.position.z) / 2,
  }
}

/**
 * Calculate bond length (in Angstroms)
 */
export function getBondLength(bond: Bond3D, atoms: Atom3D[]): number {
  const atom1 = atoms[bond.atom1Index]
  const atom2 = atoms[bond.atom2Index]

  if (!atom1 || !atom2) return 0

  return distance3D(atom1.position, atom2.position)
}

/**
 * Default viewer state
 */
export function getDefaultViewerState(): ViewerState {
  return {
    rotation: { x: 20, y: 30, z: 0 },
    zoom: 1.0,
    translation: { x: 0, y: 0 },
  }
}

/**
 * Preset view angles
 */
export const PRESET_VIEWS: Record<string, ViewerState['rotation']> = {
  front: { x: 0, y: 0, z: 0 },
  side: { x: 0, y: 90, z: 0 },
  top: { x: 90, y: 0, z: 0 },
  perspective: { x: 20, y: 30, z: 0 },
}

/**
 * Interpolate between two viewer states (for smooth animations)
 */
export function interpolateViewerState(
  from: ViewerState,
  to: ViewerState,
  t: number
): ViewerState {
  t = Math.max(0, Math.min(1, t)) // Clamp t to [0, 1]

  return {
    rotation: {
      x: from.rotation.x + (to.rotation.x - from.rotation.x) * t,
      y: from.rotation.y + (to.rotation.y - from.rotation.y) * t,
      z: from.rotation.z + (to.rotation.z - from.rotation.z) * t,
    },
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    translation: {
      x: from.translation.x + (to.translation.x - from.translation.x) * t,
      y: from.translation.y + (to.translation.y - from.translation.y) * t,
    },
  }
}

/**
 * Convert screen coordinates to world coordinates (for mouse interaction)
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewerState: ViewerState,
  screenWidth: number,
  screenHeight: number
): Vector3D {
  const x = (screenX - screenWidth / 2 - viewerState.translation.x) / viewerState.zoom
  const y = (screenY - screenHeight / 2 - viewerState.translation.y) / viewerState.zoom

  return { x, y, z: 0 }
}

/**
 * Find atom at screen position (for click detection)
 */
export function findAtomAtPosition(
  screenX: number,
  screenY: number,
  molecule: Molecule3D,
  viewerState: ViewerState,
  screenWidth: number,
  screenHeight: number,
  threshold: number = 20
): Atom3D | null {
  let closestAtom: Atom3D | null = null
  let closestDistance = threshold

  molecule.atoms.forEach((atom) => {
    const projected = project3DTo2D(atom.position, viewerState, screenWidth, screenHeight)
    const distance = Math.sqrt(
      Math.pow(projected.x - screenX, 2) + Math.pow(projected.y - screenY, 2)
    )

    if (distance < closestDistance) {
      closestDistance = distance
      closestAtom = atom
    }
  })

  return closestAtom
}

/**
 * Calculate dihedral angle (for organic chemistry)
 * Angle between two planes defined by 4 atoms
 */
export function calculateDihedralAngle(
  p1: Vector3D,
  p2: Vector3D,
  p3: Vector3D,
  p4: Vector3D
): number {
  const b1 = vectorSubtract(p2, p1)
  const b2 = vectorSubtract(p3, p2)
  const b3 = vectorSubtract(p4, p3)

  const n1 = vectorCross(b1, b2)
  const n2 = vectorCross(b2, b3)

  const angle = Math.atan2(
    vectorDot(vectorCross(n1, n2), vectorNormalize(b2)),
    vectorDot(n1, n2)
  )

  return (angle * 180) / Math.PI
}
