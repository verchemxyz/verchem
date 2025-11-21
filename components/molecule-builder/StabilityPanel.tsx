'use client'

import type { ValidationResult, BuilderAtom, BuilderBond } from '@/lib/utils/molecule-builder'

interface StabilityPanelProps {
  validation: ValidationResult | null
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
}

export default function StabilityPanel({
  validation,
  atoms,
  bonds,
}: StabilityPanelProps) {
  if (!validation) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">📊 Stability Analysis</h3>
        <p className="text-gray-400 text-sm">Start building a molecule to see analysis...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`
        bg-black/30 backdrop-blur-md rounded-xl p-4 border
        ${validation.isStable
          ? 'border-green-500/30'
          : 'border-red-500/30 animate-pulse'
        }
      `}>
        <h3 className="text-lg font-bold text-white mb-3">📊 Stability Analysis</h3>

        <div className="space-y-3">
          {/* Stability Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Overall Stability:</span>
            <span className={`font-bold ${
              validation.isStable ? 'text-green-400' : 'text-red-400'
            }`}>
              {validation.isStable ? '✅ Stable' : '❌ Unstable'}
            </span>
          </div>

          {/* Molecular Formula */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Formula:</span>
            <span className="text-white font-mono text-lg">{validation.formula}</span>
          </div>

          {/* Total Charge */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Total Charge:</span>
            <span className={`font-bold ${
              validation.totalCharge === 0
                ? 'text-gray-300'
                : validation.totalCharge > 0
                  ? 'text-red-400'
                  : 'text-blue-400'
            }`}>
              {validation.totalCharge > 0 && '+'}
              {validation.totalCharge}
            </span>
          </div>

          {/* Bond Count */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Bonds:</span>
            <span className="text-white">
              {bonds.length}
              {bonds.filter(b => b.order === 2).length > 0 &&
                ` (${bonds.filter(b => b.order === 2).length} double)`
              }
              {bonds.filter(b => b.order === 3).length > 0 &&
                ` (${bonds.filter(b => b.order === 3).length} triple)`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Atom Details */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <h4 className="text-md font-bold text-white mb-3">⚛️ Atom Status</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {validation.atomStability.map((stability, index) => {
            const atom = atoms[index]
            if (!atom) return null

            return (
              <div
                key={atom.id}
                className={`
                  p-2 rounded-lg border
                  ${stability.isStable
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold">{atom.element}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stability.isStable
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {stability.isStable ? 'OK' : 'Unstable'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-gray-400">
                    e⁻: {stability.currentElectrons}/{stability.targetElectrons}
                  </div>
                  <div className="text-gray-400">
                    FC: {stability.formalCharge > 0 && '+'}{stability.formalCharge}
                  </div>
                </div>

                {stability.needsElectrons > 0 && (
                  <div className="mt-1 text-yellow-300 text-xs animate-pulse">
                    Needs {stability.needsElectrons} more e⁻
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-orange-500/10 backdrop-blur-md rounded-xl p-4 border border-orange-500/30">
          <h4 className="text-md font-bold text-orange-300 mb-2">⚠️ Warnings</h4>
          <ul className="space-y-1">
            {validation.warnings.map((warning, i) => (
              <li key={i} className="text-orange-200 text-xs">• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievement Badge */}
      {validation.isStable && atoms.length >= 3 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl p-4 border border-purple-500/30">
          <div className="text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-white font-bold">Stable Molecule!</p>
            <p className="text-gray-300 text-xs mt-1">Great job creating a stable structure!</p>
          </div>
        </div>
      )}
    </div>
  )
}