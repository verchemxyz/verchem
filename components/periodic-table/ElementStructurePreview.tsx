'use client'

import { CheckCircle2, FlaskConical } from 'lucide-react'
import { useMemo } from 'react'
import {
  parseElectronStructure,
  type OrbitalKind,
  type SubshellOccupancy,
} from '@/lib/chemistry/electron-configuration'
import type { Element } from '@/lib/types/chemistry'

const ORBITAL_STYLES: Record<OrbitalKind, { label: string; color: string; bar: string }> = {
  s: { label: 's', color: 'border-sky-400/45 bg-sky-400/10 text-sky-200', bar: 'bg-sky-400' },
  p: { label: 'p', color: 'border-emerald-400/45 bg-emerald-400/10 text-emerald-200', bar: 'bg-emerald-400' },
  d: { label: 'd', color: 'border-amber-400/45 bg-amber-400/10 text-amber-100', bar: 'bg-amber-400' },
  f: { label: 'f', color: 'border-fuchsia-400/45 bg-fuchsia-400/10 text-fuchsia-200', bar: 'bg-fuchsia-400' },
}

const ORBITAL_ORDER: OrbitalKind[] = ['s', 'p', 'd', 'f']
const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

function toSuperscript(value: number) {
  return [...String(value)].map((digit) => SUPERSCRIPT_DIGITS[digit]).join('')
}

function formatSubshell(subshell: SubshellOccupancy) {
  return `${subshell.name}${toSuperscript(subshell.electrons)}`
}

function isValidSubshell(shell: number, orbital: OrbitalKind) {
  return ORBITAL_ORDER.indexOf(orbital) < shell
}

interface ElementStructurePreviewProps {
  element: Element
}

export default function ElementStructurePreview({ element }: ElementStructurePreviewProps) {
  const structure = useMemo(() => parseElectronStructure(element), [element])
  const subshellMap = useMemo(
    () => new Map(structure.subshells.map((subshell) => [subshell.name, subshell])),
    [structure.subshells]
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1118] text-white shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Electron structure audit
          </p>
          <p className="mt-1 text-base font-semibold text-white">Subshell occupancy</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            structure.isPredicted
              ? 'border-amber-300/30 bg-amber-300/10 text-amber-100'
              : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100'
          }`}
        >
          {structure.isPredicted ? 'Predicted ground state' : 'Reference ground state'}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-[28px_repeat(4,minmax(0,1fr))] gap-1.5" aria-label="Occupied atomic subshells">
          <div />
          {ORBITAL_ORDER.map((orbital) => (
            <div key={orbital} className="text-center text-[10px] font-bold uppercase tracking-wider text-white/40">
              {ORBITAL_STYLES[orbital].label}
            </div>
          ))}

          {Array.from({ length: structure.shells.length }, (_, index) => index + 1).map((shell) => (
            <SubshellRow key={shell} shell={shell} subshellMap={subshellMap} />
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Ground-state configuration
            </span>
            {structure.nobleGasCore && (
              <span className="text-[10px] text-white/35">core [{structure.nobleGasCore}]</span>
            )}
          </div>
          <code className="break-words font-mono text-sm font-semibold leading-relaxed text-cyan-100">
            {element.electronConfiguration}
          </code>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/65">
              <CheckCircle2 className="h-3.5 w-3.5" /> Electron audit
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-emerald-100">
              {structure.totalElectrons} = Z
            </p>
          </div>
          <div className="rounded-xl border border-violet-300/20 bg-violet-300/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100/65">
              <FlaskConical className="h-3.5 w-3.5" /> Outer shell
            </div>
            <p className="mt-1.5 font-mono text-lg font-bold text-violet-100">
              {structure.outerShellElectrons} e⁻
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Shell population
          </p>
          <p className="font-mono text-xs leading-relaxed text-white/70">
            {structure.shells.map((electrons, index) => `n${index + 1}:${electrons}`).join(' · ')}
          </p>
        </div>

        <p className="text-[10px] leading-relaxed text-white/45">
          {structure.isPredicted
            ? 'For elements beyond hassium (Z > 108), the neutral-atom configuration shown is a theoretical prediction; an experimentally established exact ground state is not available.'
            : 'Occupancy is expanded from the listed ground-state electron configuration. Colored cells show s, p, d and f subshell filling; dim cells are allowed but unoccupied.'}
        </p>
      </div>
    </div>
  )
}

function SubshellRow({
  shell,
  subshellMap,
}: {
  shell: number
  subshellMap: ReadonlyMap<string, SubshellOccupancy>
}) {
  return (
    <>
      <div className="flex items-center justify-center font-mono text-[10px] font-semibold text-white/45">
        n{shell}
      </div>
      {ORBITAL_ORDER.map((orbital) => {
        const valid = isValidSubshell(shell, orbital)
        const subshell = subshellMap.get(`${shell}${orbital}`)

        if (!valid) {
          return <div key={`${shell}${orbital}`} className="min-h-12 rounded-lg border border-transparent" />
        }

        if (!subshell) {
          return (
            <div
              key={`${shell}${orbital}`}
              className="flex min-h-12 items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.018] text-[9px] text-white/15"
              aria-label={`${shell}${orbital} unoccupied`}
            >
              {shell}{orbital}
            </div>
          )
        }

        const style = ORBITAL_STYLES[orbital]
        const occupancy = (subshell.electrons / subshell.capacity) * 100
        return (
          <div
            key={subshell.name}
            className={`relative flex min-h-12 flex-col justify-between overflow-hidden rounded-lg border px-2 py-1.5 ${style.color}`}
            aria-label={`${subshell.name}, ${subshell.electrons} of ${subshell.capacity} electrons${subshell.fromNobleGasCore ? ', noble-gas core' : ''}`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="font-mono text-[11px] font-bold">{formatSubshell(subshell)}</span>
              {subshell.fromNobleGasCore && <span className="text-[7px] uppercase opacity-50">core</span>}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-black/25">
              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${occupancy}%` }} />
            </div>
          </div>
        )
      })}
    </>
  )
}
