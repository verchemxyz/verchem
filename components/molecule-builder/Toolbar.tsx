'use client'

import { ATOM_COLORS } from '@/lib/data/molecules-3d'
import { Beaker, Zap } from 'lucide-react'

interface ToolbarProps {
  selectedElement: string
  onSelectElement: (element: string) => void
  bondType: 1 | 2 | 3
  onSelectBondType: (type: 1 | 2 | 3) => void
}

const COMMON_ELEMENTS = ['C', 'H', 'O', 'N', 'F', 'Cl', 'Br', 'S', 'P']

export default function Toolbar({
  selectedElement,
  onSelectElement,
  bondType,
  onSelectBondType
}: ToolbarProps) {

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm transition-all">

      {/* Section Header: Elements */}
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
        <Beaker className="w-3 h-3" /> Elements
      </div>

      {/* Element Grid */}
      <div className="grid grid-cols-3 gap-2">
        {COMMON_ELEMENTS.map((el) => (
          <button
            key={el}
            onClick={() => onSelectElement(el)}
            className={`
              relative group flex items-center justify-center w-10 h-10 rounded-xl border transition-colors duration-200
              ${selectedElement === el
                ? 'bg-primary-50 border-primary-500'
                : 'bg-muted border-border hover:border-primary-300 hover:bg-card'}
            `}
          >
            <span
              className={`font-bold text-sm ${selectedElement === el ? 'text-primary-700' : 'text-foreground'}`}
            >
              {el}
            </span>

            {/* Color indicator dot — CPK atom color (data) */}
            <div
              className="absolute bottom-1.5 w-1 h-1 rounded-full opacity-70"
              style={{ backgroundColor: ATOM_COLORS[el] }}
            />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border" />

      {/* Section Header: Bonds */}
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
        <Zap className="w-3 h-3" /> Bonds
      </div>

      {/* Bond Type Selection */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((type) => (
          <button
            key={type}
            onClick={() => onSelectBondType(type as 1 | 2 | 3)}
            className={`
              flex items-center justify-center h-10 rounded-xl border transition-colors duration-200
              ${bondType === type
                ? 'bg-secondary-50 border-secondary-500'
                : 'bg-muted border-border hover:border-secondary-300 hover:bg-card'}
            `}
          >
            <div className="flex flex-col gap-[3px]">
              {Array.from({ length: type }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-[2px] rounded-full ${bondType === type ? 'bg-secondary-600' : 'bg-muted-foreground'}`}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Info / Helper */}
      <div className="mt-2 p-3 rounded-lg bg-muted border border-border text-[10px] text-muted-foreground leading-relaxed space-y-1">
        <p><span className="text-primary-600 font-bold">Tip:</span> Drag between atoms to create bonds.</p>
        <p><span className="text-secondary-strong font-bold">Pro:</span> Click existing bond to cycle order (1-2-3).</p>
      </div>

      {/* Common Molecules Quick-Add */}
      <div className="mt-2">
        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Templates</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: 'H₂O', formula: 'Water' },
            { name: 'CO₂', formula: 'Carbon Dioxide' },
            { name: 'CH₄', formula: 'Methane' },
            { name: 'NH₃', formula: 'Ammonia' },
          ].map((mol) => (
            <button
              key={mol.name}
              className="px-2 py-1.5 text-[10px] rounded-lg bg-muted border border-border hover:border-primary-300 hover:bg-card transition-colors text-foreground"
              title={mol.formula}
            >
              {mol.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
