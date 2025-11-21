/**
 * 3D Projection Utilities
 * Convert 3D coordinates to 2D for canvas rendering
 */

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Point2D {
  x: number
  y: number
}

export interface RotationAngles {
  x: number // Pitch (degrees)
  y: number // Yaw (degrees)
  z: number // Roll (degrees)
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Rotate a 3D point around X axis
 */
function rotateX(point: Point3D, angle: number): Point3D {
  const rad = toRadians(angle)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

/**
 * Rotate a 3D point around Y axis
 */
function rotateY(point: Point3D, angle: number): Point3D {
  const rad = toRadians(angle)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  }
}

/**
 * Rotate a 3D point around Z axis
 */
function rotateZ(point: Point3D, angle: number): Point3D {
  const rad = toRadians(angle)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  }
}

/**
 * Apply all rotations to a 3D point
 */
export function rotate3D(point: Point3D, rotation: RotationAngles): Point3D {
  let rotated = rotateX(point, rotation.x)
  rotated = rotateY(rotated, rotation.y)
  rotated = rotateZ(rotated, rotation.z)
  return rotated
}

/**
 * Perspective projection: 3D → 2D
 * Uses perspective division (simulates depth)
 *
 * @param point3D - 3D point
 * @param fov - Field of view (distance from camera to projection plane)
 * @param centerX - Center X of canvas
 * @param centerY - Center Y of canvas
 * @param scale - Scaling factor
 * @returns 2D point with depth
 */
export function project3DTo2D(
  point3D: Point3D,
  fov: number = 500,
  centerX: number = 300,
  centerY: number = 300,
  scale: number = 100
): Point2D & { depth: number } {
  // Perspective division
  const distance = fov / (fov + point3D.z)

  return {
    x: centerX + point3D.x * scale * distance,
    y: centerY + point3D.y * scale * distance,
    depth: point3D.z, // For depth sorting
  }
}

/**
 * Orthographic projection: 3D → 2D
 * No perspective (parallel projection)
 *
 * @param point3D - 3D point
 * @param centerX - Center X of canvas
 * @param centerY - Center Y of canvas
 * @param scale - Scaling factor
 * @returns 2D point with depth
 */
export function projectOrthographic(
  point3D: Point3D,
  centerX: number = 300,
  centerY: number = 300,
  scale: number = 100
): Point2D & { depth: number } {
  return {
    x: centerX + point3D.x * scale,
    y: centerY + point3D.y * scale,
    depth: point3D.z,
  }
}

/**
 * Convert 2D position back to 3D (for editing in 3D mode)
 * This is an approximation - assumes z=0 plane
 */
export function unproject2DTo3D(
  point2D: Point2D,
  centerX: number = 300,
  centerY: number = 300,
  scale: number = 100,
  z: number = 0
): Point3D {
  return {
    x: (point2D.x - centerX) / scale,
    y: (point2D.y - centerY) / scale,
    z,
  }
}

/**
 * Calculate depth-sorted indices for rendering
 * (far objects first, near objects last)
 */
export function depthSort<T extends { depth: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => a.depth - b.depth)
}

/**
 * Calculate scale based on atom radius and depth
 */
export function getDepthScale(depth: number, maxDepth: number = 2): number {
  // Atoms further away appear smaller
  const normalizedDepth = Math.max(-maxDepth, Math.min(maxDepth, depth))
  return 1 - normalizedDepth / (maxDepth * 2)
}

/**
 * Get brightness based on depth (lighting effect)
 */
export function getDepthBrightness(depth: number, maxDepth: number = 2): number {
  // Atoms further away are darker
  const normalizedDepth = Math.max(-maxDepth, Math.min(maxDepth, depth))
  return 1 - Math.abs(normalizedDepth) / maxDepth * 0.5
}

/**
 * Smooth rotation interpolation
 */
export function interpolateRotation(
  from: RotationAngles,
  to: RotationAngles,
  t: number // 0-1
): RotationAngles {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  }
}
