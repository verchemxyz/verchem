'use client'

import React from 'react'
import { ATOM_COLORS } from '@/lib/data/molecules-3d'
import { getAllowedBondTypes, getMaxTotalBondOrder, type BondType } from '@/lib/utils/bond-restrictions'
import { getValenceElectrons } from '@/lib/utils/molecule-builder'
import { ELEMENT_GROUPS, BOND_OPTIONS } from '@/lib/constants/molecule-builder'

/**
 * Props for AtomPalette component
 */
interface AtomPaletteProps {
  /** Currently selected element symbol (e.g., 'C', 'H', 'O') */
  selectedElement: string
  /** Callback when element is selected */
  onSelectElement: (element: string) => void
  /** Currently selected bond mode */
  bondMode: 'single' | 'double' | 'triple'
  /** Callback when bond mode changes */
  onBondModeChange: (mode: 'single' | 'double' | 'triple') => void
}

/**
 * AtomPalette - Interactive element and bond type selector
 *
 * Displays available chemical elements organized by category (Backbone, Halogens, Expanded)
 * and bond types (Single, Double, Triple). Automatically disables bond types that are not
 * allowed for the currently selected element based on chemistry rules.
 *
 * @component
 * @example
 * ```tsx
 * <AtomPalette
 *   selectedElement="C"
 *   onSelectElement={(el) => setElement(el)}
 *   bondMode="single"
 *   onBondModeChange={(mode) => setBondMode(mode)}
 * />
 * ```
 */
function AtomPalette({
  selectedElement,
  onSelectElement,
  bondMode,
  onBondModeChange,
}: AtomPaletteProps) {
  // Memoize allowed bond types calculation
  const allowedBonds = React.useMemo(
    () => getAllowedBondTypes(selectedElement),
    [selectedElement]
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Atom & Bond Palette</h3>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          {selectedElement} | {bondMode}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {ELEMENT_GROUPS.map(group => (
          <div key={group.title} className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{group.title}</p>
                <p className="text-xs text-slate-300">{group.hint}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {group.items.map(item => {
                const isSelected = selectedElement === item.symbol
                const maxBonds = getMaxTotalBondOrder(item.symbol)
                const valence = getValenceElectrons(item.symbol)

                return (
                  <button
                    key={item.symbol}
                    onClick={() => onSelectElement(item.symbol)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      isSelected
                        ? 'border-cyan-400/50 bg-cyan-500/10 text-white shadow-[0_10px_30px_rgba(34,211,238,0.25)]'
                        : 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-500/5'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold text-slate-950"
                        style={{ backgroundColor: ATOM_COLORS[item.symbol] || '#e2e8f0' }}
                      >
                        {item.symbol}
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{item.name}</p>
                        <p className="text-[11px] text-slate-300">Valence {valence} | Max {maxBonds} bonds</p>
                      </div>
                    </div>
                    {isSelected && <span className="text-xs font-semibold text-cyan-200">Active</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Bond type</h4>
          <p className="text-[11px] text-slate-300">Auto-blocked if element disallows</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {BOND_OPTIONS.map(({ mode, label, symbol }) => {
            const isAllowed = allowedBonds.includes(mode as BondType)
            const isSelected = bondMode === mode

            return (
              <button
                key={mode}
                onClick={() => isAllowed && onBondModeChange(mode)}
                disabled={!isAllowed}
                className={`rounded-lg border px-3 py-2 text-center transition ${
                  isSelected
                    ? 'border-cyan-400/50 bg-cyan-500/10 text-white shadow-[0_10px_30px_rgba(34,211,238,0.25)]'
                    : isAllowed
                      ? 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-500/5'
                      : 'border-rose-300/40 bg-rose-500/10 text-rose-100/60 cursor-not-allowed'
                }`}
                title={
                  isAllowed
                    ? `${label} bond`
                    : `${selectedElement} cannot form ${label.toLowerCase()} bonds`
                }
              >
                <div className="text-lg font-bold">{symbol}</div>
                <div className="text-[11px]">{label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Memoized AtomPalette - Prevents unnecessary re-renders
 * Only re-renders when props change
 */
export default React.memo(AtomPalette)
