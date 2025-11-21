'use client'

import { useId, useMemo } from 'react'
import type { Element, ElementCategory } from '@/lib/types/chemistry'

const SHELL_CAPACITIES = [2, 8, 18, 32, 32, 18, 8]

const CATEGORY_GRADIENTS: Record<ElementCategory | 'default', { start: string; end: string }> = {
  'alkali-metal': { start: '#fed7aa', end: '#ea580c' },
  'alkaline-earth-metal': { start: '#ffe4e6', end: '#fb7185' },
  'transition-metal': { start: '#fef9c3', end: '#ca8a04' },
  'post-transition-metal': { start: '#dcfce7', end: '#16a34a' },
  metalloid: { start: '#ccfbf1', end: '#0d9488' },
  nonmetal: { start: '#dbeafe', end: '#2563eb' },
  halogen: { start: '#e0e7ff', end: '#4c1d95' },
  'noble-gas': { start: '#ede9fe', end: '#7c3aed' },
  lanthanide: { start: '#fce7f3', end: '#be185d' },
  actinide: { start: '#ffe4e6', end: '#c026d3' },
  unknown: { start: '#e2e8f0', end: '#475569' },
  default: { start: '#e2e8f0', end: '#475569' },
}

function getShellDistribution(atomicNumber: number) {
  let remaining = atomicNumber
  const shells: number[] = []

  for (const capacity of SHELL_CAPACITIES) {
    if (remaining <= 0) break
    const electrons = Math.min(capacity, remaining)
    shells.push(electrons)
    remaining -= electrons
  }

  return shells
}

interface ElementVisualProps {
  element: Element
}

export default function ElementVisual({ element }: ElementVisualProps) {
  const shells = useMemo(() => getShellDistribution(element.atomicNumber), [element.atomicNumber])
  const valence = shells[shells.length - 1] ?? 0
  const gradientId = useId()
  const gradient =
    CATEGORY_GRADIENTS[element.category as ElementCategory] ?? CATEGORY_GRADIENTS.default

  const center = 120
  const baseRadius = 26
  const radiusStep = 18

  return (
    <div className="rounded-2xl bg-slate-900 text-white shadow-inner p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">Atomic Visual</p>
          <p className="text-base font-semibold text-white">Electron shell sketch</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Valence electrons</p>
          <p className="text-lg font-bold">{valence}</p>
        </div>
      </div>

      <svg viewBox="0 0 240 240" role="img" aria-label={`Atomic visual for ${element.name}`}>
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={gradient.start} stopOpacity={0.95} />
            <stop offset="100%" stopColor={gradient.end} stopOpacity={0.95} />
          </radialGradient>
        </defs>

        {/* Orbitals */}
        {shells.map((electrons, index) => {
          const radius = baseRadius + index * radiusStep
          return (
            <circle
              key={`shell-${index}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1.5}
              strokeDasharray="4 6"
            />
          )
        })}

        {/* Electrons */}
        {shells.map((electrons, shellIndex) => {
          const radius = baseRadius + shellIndex * radiusStep

          return Array.from({ length: electrons }).map((_, electronIndex) => {
            const angle = (2 * Math.PI * electronIndex) / electrons
            const x = center + radius * Math.cos(angle)
            const y = center + radius * Math.sin(angle)
            return (
              <circle
                key={`electron-${shellIndex}-${electronIndex}`}
                cx={x}
                cy={y}
                r={4}
                fill="#ffffff"
                opacity={shellIndex === shells.length - 1 ? 1 : 0.75}
              />
            )
          })
        })}

        {/* Nucleus */}
        <circle cx={center} cy={center} r={24} fill={`url(#${gradientId})`} stroke="white" />
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="bold"
        >
          {element.symbol}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" fill="white" fontSize="10">
          Z = {element.atomicNumber}
        </text>
      </svg>

      <div className="mt-3 text-xs text-white/70 space-y-1">
        <p className="font-medium">
          Shell distribution:&nbsp;
          <span className="font-semibold">
            {shells.map((count, index) => `n${index + 1}:${String(count).padStart(2, ' ')}`).join(' · ')}
          </span>
        </p>
        <p>
          Category:&nbsp;
          <span className="capitalize">{element.category.replace(/-/g, ' ')}</span>
        </p>
      </div>
    </div>
  )
}
