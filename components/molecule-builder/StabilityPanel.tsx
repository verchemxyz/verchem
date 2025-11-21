'use client'

import React from 'react'
import type { ValidationResult, BuilderAtom, BuilderBond } from '@/lib/utils/molecule-builder'

/**
 * Props for StabilityPanel component
 */
interface StabilityPanelProps {
  /** Validation result from molecule validation */
  validation: ValidationResult | null
  /** Array of atoms in the molecule */
  atoms: BuilderAtom[]
  /** Array of bonds in the molecule */
  bonds: BuilderBond[]
}

/**
 * StabilityPanel - Displays molecule stability analysis
 *
 * Shows overall stability status, molecular formula, total charge, bond count,
 * and per-atom stability details. Provides warnings and hints for unstable molecules.
 *
 * @component
 * @example
 * ```tsx
 * <StabilityPanel
 *   validation={validationResult}
 *   atoms={moleculeAtoms}
 *   bonds={moleculeBonds}
 * />
 * ```
 */
function StabilityPanel({
  validation,
  atoms,
  bonds,
}: StabilityPanelProps) {
  // Memoize expensive calculations
  const bondStats = React.useMemo(() => {
    return {
      doubleBonds: bonds.filter(b => b.order === 2).length,
      tripleBonds: bonds.filter(b => b.order === 3).length,
    }
  }, [bonds])

  const unstableAtoms = React.useMemo(() => {
    return validation?.atomStability.filter(atom => !atom.isStable).length ?? 0
  }, [validation])

  if (!validation) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <h3 className="text-lg font-semibold text-white">Stability Monitor</h3>
        <p className="mt-1 text-sm text-slate-300">Start building or load a preset to see per-atom checks.</p>
      </div>
    )
  }

  const totalCharge = validation.totalCharge
  const { doubleBonds, tripleBonds } = bondStats

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Overall stability</p>
            <p className="text-xs text-slate-300">Live validation against valence and charge rules</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              validation.isStable
                ? 'border border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                : 'border border-amber-300/50 bg-amber-500/10 text-amber-50'
            }`}
          >
            {validation.isStable ? 'Stable' : 'Needs fixes'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-200">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-300">Formula</p>
            <p className="font-mono text-lg text-white">{validation.formula}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-300">Total charge</p>
            <p
              className={`text-lg font-semibold ${
                totalCharge === 0
                  ? 'text-slate-100'
                  : totalCharge > 0
                    ? 'text-rose-200'
                    : 'text-blue-200'
              }`}
            >
              {totalCharge > 0 && '+'}
              {totalCharge}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-300">Bonds</p>
            <p className="font-semibold text-white">
              {bonds.length}
              {doubleBonds > 0 && ` (${doubleBonds} double)`}
              {tripleBonds > 0 && ` (${tripleBonds} triple)`}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-300">Atoms out of spec</p>
            <p className="font-semibold text-white">{unstableAtoms} / {atoms.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h4 className="text-md font-semibold text-white">Atom ledger</h4>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {validation.atomStability.map((stability, index) => {
            const atom = atoms[index]
            if (!atom) return null

            return (
              <div
                key={atom.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  stability.isStable
                    ? 'border-emerald-300/50 bg-emerald-500/10 text-emerald-50'
                    : 'border-amber-300/50 bg-amber-500/10 text-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-white">{atom.element}</span>
                  <div className="text-xs text-white">
                    <div>Electrons {stability.currentElectrons}/{stability.targetElectrons}</div>
                    <div>Charge {stability.formalCharge > 0 ? `+${stability.formalCharge}` : stability.formalCharge}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">{stability.isStable ? 'OK' : 'Adjust'}</p>
                  {stability.needsElectrons > 0 && (
                    <p>Needs {stability.needsElectrons} e-</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {validation.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4">
          <h4 className="text-md font-semibold text-amber-100">Warnings</h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-50">
            {validation.warnings.map((warning, i) => (
              <li key={i}>- {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.isStable && atoms.length >= 3 && (
        <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-center">
          <p className="text-lg font-semibold text-emerald-100">Stable structure</p>
          <p className="text-sm text-emerald-50">Valence satisfied across all atoms. Add substitutions or export.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Memoized StabilityPanel - Prevents unnecessary re-renders
 * Only re-renders when validation, atoms, or bonds change
 */
export default React.memo(StabilityPanel)
