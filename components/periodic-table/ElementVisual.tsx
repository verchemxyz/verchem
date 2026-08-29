'use client'

import { Pause, Play, RotateCcw } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { parseElectronStructure } from '@/lib/chemistry/electron-configuration'
import type { Element, ElementCategory } from '@/lib/types/chemistry'

interface Point3D {
  x: number
  y: number
  z: number
}

interface ElectronPoint {
  id: string
  shellIndex: number
  position: Point3D
}

interface ProjectedPoint extends Point3D {
  screenX: number
  screenY: number
  perspective: number
}

interface ProjectedElectron extends ElectronPoint {
  projected: ProjectedPoint
}

const CATEGORY_GRADIENTS: Record<ElementCategory | 'default', { start: string; end: string }> = {
  'alkali-metal': { start: '#fb7185', end: '#be123c' },
  'alkaline-earth-metal': { start: '#fb923c', end: '#c2410c' },
  'transition-metal': { start: '#facc15', end: '#a16207' },
  'post-transition-metal': { start: '#4ade80', end: '#15803d' },
  metalloid: { start: '#2dd4bf', end: '#0f766e' },
  nonmetal: { start: '#60a5fa', end: '#1d4ed8' },
  halogen: { start: '#a78bfa', end: '#6d28d9' },
  'noble-gas': { start: '#c084fc', end: '#7e22ce' },
  lanthanide: { start: '#f472b6', end: '#be185d' },
  actinide: { start: '#e879f9', end: '#a21caf' },
  unknown: { start: '#94a3b8', end: '#475569' },
  default: { start: '#94a3b8', end: '#475569' },
}

const SHELL_COLORS = ['#67e8f9', '#5eead4', '#86efac', '#fde047', '#fb923c', '#f472b6', '#c084fc']
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const INITIAL_ROTATION = { x: -16, y: 24 }
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function getReducedMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function rotatePoint(point: Point3D, rotation: { x: number; y: number }): Point3D {
  const xRadians = (rotation.x * Math.PI) / 180
  const yRadians = (rotation.y * Math.PI) / 180
  const cosX = Math.cos(xRadians)
  const sinX = Math.sin(xRadians)
  const cosY = Math.cos(yRadians)
  const sinY = Math.sin(yRadians)

  const afterX = {
    x: point.x,
    y: point.y * cosX - point.z * sinX,
    z: point.y * sinX + point.z * cosX,
  }

  return {
    x: afterX.x * cosY + afterX.z * sinY,
    y: afterX.y,
    z: -afterX.x * sinY + afterX.z * cosY,
  }
}

function projectPoint(point: Point3D, rotation: { x: number; y: number }): ProjectedPoint {
  const rotated = rotatePoint(point, rotation)
  const perspective = 7 / (7 - rotated.z)

  return {
    ...rotated,
    screenX: 210 + rotated.x * 53 * perspective,
    screenY: 157 + rotated.y * 53 * perspective,
    perspective,
  }
}

function getShellRadius(shellIndex: number) {
  // Keep n=1 visibly outside the nucleus while preserving the same outer
  // envelope for seven-shell atoms.
  return 1.05 + shellIndex * 0.36
}

function createElectronPoints(shells: number[], atomicNumber: number): ElectronPoint[] {
  return shells.flatMap((electronCount, shellIndex) => {
    const radius = getShellRadius(shellIndex)
    const phase = atomicNumber * 0.173 + shellIndex * 0.61

    return Array.from({ length: electronCount }, (_, electronIndex) => {
      const normalizedY = 1 - (2 * (electronIndex + 0.5)) / electronCount
      const horizontalRadius = Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY))
      const angle = electronIndex * GOLDEN_ANGLE + phase

      return {
        id: `electron-${shellIndex}-${electronIndex}`,
        shellIndex,
        position: {
          x: Math.cos(angle) * horizontalRadius * radius,
          y: normalizedY * radius,
          z: Math.sin(angle) * horizontalRadius * radius,
        },
      }
    })
  })
}

function createGreatCircle(radius: number, plane: 'xy' | 'xz' | 'yz'): Point3D[] {
  return Array.from({ length: 65 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2
    const cosine = Math.cos(angle) * radius
    const sine = Math.sin(angle) * radius

    if (plane === 'xy') return { x: cosine, y: sine, z: 0 }
    if (plane === 'xz') return { x: cosine, y: 0, z: sine }
    return { x: 0, y: cosine, z: sine }
  })
}

function pointsToPath(points: Point3D[], rotation: { x: number; y: number }) {
  return points
    .map((point, index) => {
      const projected = projectPoint(point, rotation)
      return `${index === 0 ? 'M' : 'L'}${projected.screenX.toFixed(2)} ${projected.screenY.toFixed(2)}`
    })
    .join(' ')
}

function ElectronMarker({
  electron,
  selectedShell,
  glowId,
}: {
  electron: ProjectedElectron
  selectedShell: number | null
  glowId: string
}) {
  const isDimmed = selectedShell !== null && selectedShell !== electron.shellIndex
  const depthOpacity = Math.min(1, Math.max(0.42, 0.66 + electron.projected.z * 0.13))
  const radius = Math.max(2.5, 3.4 * electron.projected.perspective)

  return (
    <g
      opacity={isDimmed ? 0.08 : depthOpacity}
      filter={!isDimmed ? `url(#${glowId})` : undefined}
    >
      <circle
        cx={electron.projected.screenX}
        cy={electron.projected.screenY}
        r={radius * 1.9}
        fill={SHELL_COLORS[electron.shellIndex]}
        opacity={0.15}
      />
      <circle
        cx={electron.projected.screenX}
        cy={electron.projected.screenY}
        r={radius}
        fill={SHELL_COLORS[electron.shellIndex]}
        stroke="white"
        strokeWidth={0.7}
      />
    </g>
  )
}

interface ElementVisualProps {
  element: Element
}

export default function ElementVisual({ element }: ElementVisualProps) {
  const structure = useMemo(() => parseElectronStructure(element), [element])
  const electrons = useMemo(
    () => createElectronPoints(structure.shells, element.atomicNumber),
    [element.atomicNumber, structure.shells]
  )
  const shellCircles = useMemo(
    () =>
      structure.shells.map((_, shellIndex) => {
        const radius = getShellRadius(shellIndex)
        return {
          xy: createGreatCircle(radius, 'xy'),
          xz: createGreatCircle(radius, 'xz'),
          yz: createGreatCircle(radius, 'yz'),
        }
      }),
    [structure.shells]
  )
  const [rotation, setRotation] = useState(INITIAL_ROTATION)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedShell, setSelectedShell] = useState<number | null>(null)
  const dragPosition = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    () => true
  )
  const nucleusGradientId = `${useId()}-nucleus`
  const electronGlowId = `${useId()}-electron-glow`
  const noteId = useId()
  const gradient = CATEGORY_GRADIENTS[element.category] ?? CATEGORY_GRADIENTS.default

  useEffect(() => {
    if (!isAutoRotating || isDragging || prefersReducedMotion) return

    let animationFrame = 0
    let previousTime: number | undefined

    const animate = (time: number) => {
      if (previousTime === undefined || time - previousTime >= 32) {
        const elapsedSeconds = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, 0.08)
        setRotation((current) => ({
          ...current,
          y: (current.y + elapsedSeconds * 8) % 360,
        }))
        previousTime = time
      }
      animationFrame = window.requestAnimationFrame(animate)
    }

    animationFrame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [isAutoRotating, isDragging, prefersReducedMotion])

  const projectedElectrons = electrons
    .map((electron) => ({
      ...electron,
      projected: projectPoint(electron.position, rotation),
    }))
    .sort((a, b) => a.projected.z - b.projected.z)

  const startDragging = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragPosition.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setIsDragging(true)
  }

  const drag = (event: PointerEvent<SVGSVGElement>) => {
    const previous = dragPosition.current
    if (!previous || previous.pointerId !== event.pointerId) return

    const deltaX = event.clientX - previous.x
    const deltaY = event.clientY - previous.y
    dragPosition.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setRotation((current) => ({
      x: current.x + deltaY * 0.38,
      y: current.y + deltaX * 0.38,
    }))
  }

  const stopDragging = (event: PointerEvent<SVGSVGElement>) => {
    if (dragPosition.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragPosition.current = null
    setIsDragging(false)
  }

  const resetView = () => {
    setRotation(INITIAL_ROTATION)
    setSelectedShell(null)
  }

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const movement = 6
    const keyboardRotations: Partial<Record<string, { x: number; y: number }>> = {
      ArrowUp: { x: -movement, y: 0 },
      ArrowDown: { x: movement, y: 0 },
      ArrowLeft: { x: 0, y: -movement },
      ArrowRight: { x: 0, y: movement },
    }

    if (event.key === ' ' || event.key.toLowerCase() === 'p') {
      event.preventDefault()
      setIsAutoRotating((current) => !current)
      return
    }

    if (event.key === 'Home' || event.key.toLowerCase() === 'r') {
      event.preventDefault()
      resetView()
      return
    }

    const change = keyboardRotations[event.key]
    if (!change) return
    event.preventDefault()
    setRotation((current) => ({ x: current.x + change.x, y: current.y + change.y }))
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080C14] text-white shadow-2xl">
      <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/65">
            Interactive 3D atom
          </p>
          <p className="mt-1 text-base font-semibold text-white">Ground-state shell model</p>
        </div>
        <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
          {structure.totalElectrons} e⁻ = Z {element.atomicNumber}
        </div>
      </div>

      <div className="relative mt-1">
        <svg
          viewBox="0 0 420 315"
          className={`block w-full touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          role="img"
          aria-label={`Interactive 3D shell model for ${element.name}, with ${structure.totalElectrons} electrons across ${structure.shells.length} shells`}
          aria-describedby={noteId}
          tabIndex={0}
          onPointerDown={startDragging}
          onPointerMove={drag}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onKeyDown={handleKeyDown}
        >
          <defs>
            <radialGradient id={nucleusGradientId} cx="30%" cy="24%" r="76%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="18%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </radialGradient>
            <filter id={electronGlowId} x="-180%" y="-180%" width="460%" height="460%">
              <feGaussianBlur stdDeviation="2.6" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Array.from({ length: 38 }, (_, index) => {
            const x = 12 + ((index * 73 + element.atomicNumber * 11) % 396)
            const y = 8 + ((index * 47 + element.atomicNumber * 17) % 286)
            const opacity = 0.1 + (index % 4) * 0.04
            return <circle key={`star-${index}`} cx={x} cy={y} r={index % 7 === 0 ? 1.2 : 0.65} fill="white" opacity={opacity} />
          })}

          {shellCircles.map((circles, shellIndex) => {
            const isDimmed = selectedShell !== null && selectedShell !== shellIndex
            const color = SHELL_COLORS[shellIndex]
            return (['xy', 'xz', 'yz'] as const).map((plane, planeIndex) => (
              <path
                key={`shell-${shellIndex}-${plane}`}
                d={`${pointsToPath(circles[plane], rotation)} Z`}
                fill="none"
                stroke={color}
                strokeWidth={selectedShell === shellIndex ? 1.8 : 1.05}
                strokeDasharray={planeIndex === 0 ? undefined : '3 5'}
                opacity={isDimmed ? 0.035 : planeIndex === 0 ? 0.34 : 0.2}
              />
            ))
          })}

          {projectedElectrons
            .filter((electron) => electron.projected.z < 0)
            .map((electron) => (
              <ElectronMarker
                key={electron.id}
                electron={electron}
                selectedShell={selectedShell}
                glowId={electronGlowId}
              />
            ))}

          <circle cx="213" cy="162" r="34" fill="#000" opacity="0.32" />
          <circle cx="210" cy="157" r="33" fill={`url(#${nucleusGradientId})`} stroke="white" strokeOpacity="0.72" strokeWidth="1.5" />
          <circle cx="201" cy="147" r="7" fill="white" opacity="0.48" />
          <text x="210" y="155" textAnchor="middle" fill="white" fontSize="21" fontWeight="800">
            {element.symbol}
          </text>
          <text x="210" y="174" textAnchor="middle" fill="white" fillOpacity="0.82" fontSize="9.5" fontWeight="600">
            {element.atomicNumber} p⁺
          </text>

          {projectedElectrons
            .filter((electron) => electron.projected.z >= 0)
            .map((electron) => (
              <ElectronMarker
                key={electron.id}
                electron={electron}
                selectedShell={selectedShell}
                glowId={electronGlowId}
              />
            ))}
        </svg>

        <div className="absolute bottom-2 left-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setIsAutoRotating((current) => !current)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 text-[11px] font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label={isAutoRotating ? 'Pause atom rotation' : 'Resume atom rotation'}
          >
            {isAutoRotating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isAutoRotating ? 'Pause' : 'Rotate'}
          </button>
          <button
            type="button"
            onClick={resetView}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 text-[11px] font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
        <p className="pointer-events-none absolute bottom-3 right-3 text-[9px] uppercase tracking-[0.16em] text-white/35">
          Drag to explore
        </p>
      </div>

      <div className="relative border-t border-white/10 bg-white/[0.035] px-4 py-3">
        <div className="flex flex-wrap gap-1.5" aria-label="Electron shells">
          {structure.shells.map((electronCount, shellIndex) => {
            const isSelected = selectedShell === shellIndex
            return (
              <button
                key={`shell-control-${shellIndex}`}
                type="button"
                onClick={() => setSelectedShell(isSelected ? null : shellIndex)}
                aria-pressed={isSelected}
                className="min-h-8 rounded-full border px-2.5 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{
                  borderColor: `${SHELL_COLORS[shellIndex]}66`,
                  backgroundColor: isSelected ? `${SHELL_COLORS[shellIndex]}30` : 'rgba(255,255,255,0.035)',
                  color: SHELL_COLORS[shellIndex],
                }}
              >
                n={shellIndex + 1} · {electronCount}e⁻
              </button>
            )
          })}
        </div>
        <p id={noteId} className="mt-2.5 text-[10px] leading-relaxed text-white/50">
          Pedagogical 3D shell model — electron markers show shell occupancy from the ground-state configuration; positions, paths, nucleus and distances are symbolic and not to scale.
        </p>
      </div>
    </div>
  )
}
