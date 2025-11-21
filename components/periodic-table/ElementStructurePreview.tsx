'use client'

import Image from 'next/image'
import { useMemo, useId } from 'react'
import type { Element, ElementCategory } from '@/lib/types/chemistry'

type StructureType =
  | 'diatomic'
  | 'tetrahedral'
  | 'octahedral'
  | 'trigonal'
  | 'lattice'
  | 'noble'

interface StructureInfo {
  type: StructureType
  label: string
  description: string
  bondOrder?: 1 | 2 | 3
}

const DIATOMIC_SYMBOLS = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'At'])
const TRIGONAL_SYMBOLS = new Set(['B', 'Al', 'Ga', 'In', 'Tl'])
const TETRA_SYMBOLS = new Set(['C', 'Si', 'Ge', 'Sn', 'Pb'])
const OCTA_SYMBOLS = new Set(['S', 'Se', 'W', 'Mo', 'Re', 'Os', 'Ru'])

const BOND_ORDER_MAP: Record<string, 1 | 2 | 3> = {
  H: 1,
  F: 1,
  Cl: 1,
  Br: 1,
  I: 1,
  At: 1,
  O: 2,
  S: 2,
  Se: 2,
  Te: 2,
  N: 3,
}

const CATEGORY_BRUSHES: Record<ElementCategory | 'default', { stroke: string; fill: string }> = {
  'alkali-metal': { stroke: '#fb7185', fill: '#fecdd3' },
  'alkaline-earth-metal': { stroke: '#f97316', fill: '#fed7aa' },
  'transition-metal': { stroke: '#ca8a04', fill: '#fef3c7' },
  'post-transition-metal': { stroke: '#16a34a', fill: '#dcfce7' },
  metalloid: { stroke: '#0d9488', fill: '#ccfbf1' },
  nonmetal: { stroke: '#2563eb', fill: '#dbeafe' },
  halogen: { stroke: '#7c3aed', fill: '#ede9fe' },
  'noble-gas': { stroke: '#8b5cf6', fill: '#f5f3ff' },
  lanthanide: { stroke: '#be185d', fill: '#fce7f3' },
  actinide: { stroke: '#c026d3', fill: '#fdf2f8' },
  unknown: { stroke: '#4b5563', fill: '#e5e7eb' },
  default: { stroke: '#4b5563', fill: '#e5e7eb' },
}

const STRUCTURE_IMAGES: Record<StructureType, string> = {
  diatomic: '/element-visuals/diatomic.svg',
  tetrahedral: '/element-visuals/tetrahedral.svg',
  trigonal: '/element-visuals/trigonal.svg',
  octahedral: '/element-visuals/octahedral.svg',
  lattice: '/element-visuals/lattice.svg',
  noble: '/element-visuals/noble.svg',
}

function getStructureInfo(element: Element): StructureInfo {
  if (element.category === 'noble-gas') {
    return {
      type: 'noble',
      label: 'Monoatomic gas',
      description: `${element.name} almost always exists as individual atoms due to its filled valence shell.`,
    }
  }

  if (DIATOMIC_SYMBOLS.has(element.symbol) || element.category === 'halogen') {
    return {
      type: 'diatomic',
      label: `${element.symbol}₂ molecule`,
      description: `${element.name} naturally forms diatomic molecules with bond order ${BOND_ORDER_MAP[element.symbol] ?? 1}.`,
      bondOrder: BOND_ORDER_MAP[element.symbol] ?? 1,
    }
  }

  if (TETRA_SYMBOLS.has(element.symbol)) {
    return {
      type: 'tetrahedral',
      label: 'Tetrahedral network',
      description: `${element.name} favours sp³-like tetrahedral bonding, producing 3D networks (e.g., diamond lattice).`,
    }
  }

  if (TRIGONAL_SYMBOLS.has(element.symbol)) {
    return {
      type: 'trigonal',
      label: 'Trigonal planar motif',
      description: `${element.name} forms three σ-bonds in a planar arrangement typical for electron-deficient p-block elements.`,
    }
  }

  if (OCTA_SYMBOLS.has(element.symbol)) {
    return {
      type: 'octahedral',
      label: 'Octahedral coordination',
      description: `${element.name} often sits at the center of octahedral complexes with six ligands.`,
    }
  }

  if (
    element.category === 'alkali-metal' ||
    element.category === 'alkaline-earth-metal' ||
    element.category === 'transition-metal' ||
    element.category === 'post-transition-metal' ||
    element.category === 'lanthanide' ||
    element.category === 'actinide'
  ) {
    return {
      type: 'lattice',
      label: 'Metallic lattice',
      description: `${element.name} packs into a metallic lattice with delocalised electrons forming strong metallic bonds.`,
    }
  }

  return {
    type: 'tetrahedral',
    label: 'Covalent network',
    description: `${element.name} engages in directional covalent bonding that can be approximated with tetrahedral geometry.`,
  }
}

interface ElementStructurePreviewProps {
  element: Element
}

export default function ElementStructurePreview({ element }: ElementStructurePreviewProps) {
  const info = useMemo(() => getStructureInfo(element), [element])
  const palette =
    CATEGORY_BRUSHES[element.category as ElementCategory] ?? CATEGORY_BRUSHES.default
  const assetSrc = STRUCTURE_IMAGES[info.type]

  return (
    <div className="rounded-2xl bg-slate-900 text-white shadow-inner p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">Bond motif</p>
          <p className="text-base font-semibold text-white">{info.label}</p>
        </div>
        <span className="px-2 py-1 text-[10px] font-semibold bg-white/10 rounded-full">
          {element.category.replace(/-/g, ' ')}
        </span>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 shadow-inner">
        {assetSrc ? (
          <>
            <Image
              src={assetSrc}
              alt={`${element.name} bonding visual`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-90"
              priority={element.atomicNumber <= 5}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-slate-900/10" />
            <StructureCanvas
              info={info}
              palette={palette}
              className="absolute inset-0 w-full h-full opacity-80 mix-blend-screen pointer-events-none"
            />
          </>
        ) : (
          <StructureCanvas
            info={info}
            palette={palette}
            className="absolute inset-0 w-full h-full opacity-90"
          />
        )}
      </div>

      <p className="text-xs text-white/70 mt-3 leading-relaxed">{info.description}</p>
    </div>
  )
}

function StructureCanvas({
  info,
  palette,
  className = 'w-full h-full',
}: {
  info: StructureInfo
  palette: { stroke: string; fill: string }
  className?: string
}) {
  const commonProps = { stroke: palette.stroke, fill: palette.fill }
  const gradientId = useId()

  switch (info.type) {
    case 'diatomic':
      return renderDiatomic(commonProps, info.bondOrder ?? 1, className)
    case 'tetrahedral':
      return renderTetrahedral(commonProps, className)
    case 'trigonal':
      return renderTrigonal(commonProps, className)
    case 'octahedral':
      return renderOctahedral(commonProps, className)
    case 'lattice':
      return renderLattice(commonProps, className)
    case 'noble':
    default:
      return renderNoble(commonProps, gradientId, className)
  }
}

function renderDiatomic(
  palette: { stroke: string; fill: string },
  bondOrder: number,
  className: string
) {
  const offsets = bondOrder === 1 ? [0] : bondOrder === 2 ? [-4, 4] : [-6, 0, 6]

  return (
    <svg viewBox="0 0 220 160" className={className}>
      {offsets.map((offset, idx) => (
        <line
          key={idx}
          x1={70}
          y1={80 + offset}
          x2={150}
          y2={80 + offset}
          stroke="white"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.9}
        />
      ))}
      <circle cx={70} cy={80} r={38} strokeWidth={4} {...palette} />
      <circle cx={150} cy={80} r={38} strokeWidth={4} {...palette} />
    </svg>
  )
}

function renderTetrahedral(palette: { stroke: string; fill: string }, className: string) {
  const positions = [
    { x: 110, y: 30 },
    { x: 40, y: 110 },
    { x: 180, y: 110 },
    { x: 110, y: 150 },
  ]
  return (
    <svg viewBox="0 0 220 200" className={className}>
      {positions.map((pos, idx) => (
        <line
          key={idx}
          x1={110}
          y1={100}
          x2={pos.x}
          y2={pos.y}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <circle cx={110} cy={100} r={25} strokeWidth={4} {...palette} />
      {positions.map((pos, idx) => (
        <circle key={`outer-${idx}`} cx={pos.x} cy={pos.y} r={18} strokeWidth={3} {...palette} />
      ))}
    </svg>
  )
}

function renderTrigonal(palette: { stroke: string; fill: string }, className: string) {
  const positions = [
    { x: 50, y: 150 },
    { x: 170, y: 150 },
    { x: 110, y: 40 },
  ]
  return (
    <svg viewBox="0 0 220 200" className={className}>
      {positions.map((pos, idx) => (
        <line
          key={idx}
          x1={110}
          y1={100}
          x2={pos.x}
          y2={pos.y}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <circle cx={110} cy={100} r={24} strokeWidth={4} {...palette} />
      {positions.map((pos, idx) => (
        <circle key={idx} cx={pos.x} cy={pos.y} r={16} strokeWidth={3} {...palette} />
      ))}
    </svg>
  )
}

function renderOctahedral(palette: { stroke: string; fill: string }, className: string) {
  const positions = [
    { x: 110, y: 20 },
    { x: 110, y: 180 },
    { x: 30, y: 100 },
    { x: 190, y: 100 },
    { x: 40, y: 40 },
    { x: 180, y: 160 },
  ]
  return (
    <svg viewBox="0 0 220 200" className={className}>
      {positions.map((pos, idx) => (
        <line
          key={idx}
          x1={110}
          y1={100}
          x2={pos.x}
          y2={pos.y}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
      <circle cx={110} cy={100} r={28} strokeWidth={4} {...palette} />
      {positions.map((pos, idx) => (
        <circle key={idx} cx={pos.x} cy={pos.y} r={14} strokeWidth={3} {...palette} />
      ))}
    </svg>
  )
}

function renderLattice(palette: { stroke: string; fill: string }, className: string) {
  const nodes: Array<{ x: number; y: number }> = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      nodes.push({ x: 40 + col * 45, y: 40 + row * 45 })
    }
  }
  const connections: Array<{ from: number; to: number }> = []
  nodes.forEach((node, idx) => {
    const col = idx % 4
    const row = Math.floor(idx / 4)
    if (col < 3) {
      connections.push({ from: idx, to: idx + 1 })
    }
    if (row < 2) {
      connections.push({ from: idx, to: idx + 4 })
    }
  })
  return (
    <svg viewBox="0 0 220 180" className={className}>
      {connections.map(({ from, to }, idx) => (
        <line
          key={idx}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="white"
          strokeWidth={2}
          opacity={0.45}
        />
      ))}
      {nodes.map((node, idx) => (
        <circle key={idx} cx={node.x} cy={node.y} r={10} strokeWidth={2} {...palette} />
      ))}
    </svg>
  )
}

function renderNoble(
  palette: { stroke: string; fill: string },
  gradientId: string,
  className: string
) {
  return (
    <svg viewBox="0 0 220 180" className={className}>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.fill} stopOpacity={1} />
          <stop offset="100%" stopColor={palette.stroke} stopOpacity={0.1} />
        </radialGradient>
      </defs>
      <circle cx={110} cy={90} r={60} fill={`url(#${gradientId})`} stroke={palette.stroke} strokeWidth={4} />
    </svg>
  )
}
