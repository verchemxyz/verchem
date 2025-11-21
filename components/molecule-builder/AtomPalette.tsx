'use client'

import { ATOM_COLORS } from '@/lib/data/molecules-3d'
import { getAllowedBondTypes, type BondType } from '@/lib/utils/bond-restrictions'

interface AtomPaletteProps {
  selectedElement: string
  onSelectElement: (element: string) => void
  bondMode: 'single' | 'double' | 'triple'
  onBondModeChange: (mode: 'single' | 'double' | 'triple') => void
}

const AVAILABLE_ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen', group: 'nonmetal' },
  { symbol: 'C', name: 'Carbon', group: 'nonmetal' },
  { symbol: 'N', name: 'Nitrogen', group: 'nonmetal' },
  { symbol: 'O', name: 'Oxygen', group: 'nonmetal' },
  { symbol: 'F', name: 'Fluorine', group: 'halogen' },
  { symbol: 'S', name: 'Sulfur', group: 'nonmetal' },
  { symbol: 'P', name: 'Phosphorus', group: 'nonmetal' },
  { symbol: 'Cl', name: 'Chlorine', group: 'halogen' },
  { symbol: 'Br', name: 'Bromine', group: 'halogen' },
  { symbol: 'I', name: 'Iodine', group: 'halogen' },
  { symbol: 'B', name: 'Boron', group: 'metalloid' },
  { symbol: 'Si', name: 'Silicon', group: 'metalloid' },
]

export default function AtomPalette({
  selectedElement,
  onSelectElement,
  bondMode,
  onBondModeChange,
}: AtomPaletteProps) {
  // Get allowed bond types for current element
  const allowedBonds = getAllowedBondTypes(selectedElement)

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-3">🧪 Atom Palette</h3>

      {/* Element Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {AVAILABLE_ELEMENTS.map(element => (
          <button
            key={element.symbol}
            onClick={() => onSelectElement(element.symbol)}
            className={`
              relative p-3 rounded-lg border-2 transition-all transform hover:scale-105
              ${selectedElement === element.symbol
                ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
              }
            `}
            title={element.name}
          >
            <div
              className="w-6 h-6 rounded-full mx-auto mb-1"
              style={{ backgroundColor: ATOM_COLORS[element.symbol] || '#999' }}
            />
            <span className="text-white font-bold text-sm">{element.symbol}</span>
            {selectedElement === element.symbol && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Bond Mode Selector */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-sm font-bold text-gray-300 mb-2">Bond Type</h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { mode: 'single' as const, label: 'Single', symbol: '─' },
            { mode: 'double' as const, label: 'Double', symbol: '═' },
            { mode: 'triple' as const, label: 'Triple', symbol: '≡' },
          ].map(({ mode, label, symbol }) => {
            const isAllowed = allowedBonds.includes(mode as BondType)
            const isSelected = bondMode === mode

            return (
              <button
                key={mode}
                onClick={() => isAllowed && onBondModeChange(mode)}
                disabled={!isAllowed}
                title={
                  isAllowed
                    ? `${label} bond`
                    : `${selectedElement} cannot form ${label.toLowerCase()} bonds`
                }
                className={`
                  py-2 px-3 rounded-lg border-2 transition
                  ${isSelected
                    ? 'border-purple-400 bg-purple-500/20 text-purple-300'
                    : isAllowed
                      ? 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 cursor-pointer'
                      : 'border-red-500/30 bg-red-500/10 text-red-400/50 cursor-not-allowed opacity-50'
                  }
                `}
              >
                <div className="text-xl">{symbol}</div>
                <div className="text-xs">{label}</div>
                {!isAllowed && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl text-red-500/70">⊘</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <p className="text-blue-300 text-xs font-bold mb-1">Selected:</p>
        <p className="text-white font-bold">
          {selectedElement} • {bondMode} bond
        </p>
      </div>
    </div>
  )
}