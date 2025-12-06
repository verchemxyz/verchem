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
    <div className="flex flex-col gap-4 p-4 bg-slate-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all">
      
      {/* Section Header: Elements */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        <Beaker className="w-3 h-3" /> Elements
      </div>

      {/* Element Grid */}
      <div className="grid grid-cols-3 gap-2">
        {COMMON_ELEMENTS.map((el) => (
          <button
            key={el}
            onClick={() => onSelectElement(el)}
            className={`
              relative group flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200
              ${selectedElement === el 
                ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
            `}
          >
            <span 
              className={`font-bold text-sm ${selectedElement === el ? 'text-cyan-300' : 'text-slate-300'}`}
              style={{ textShadow: selectedElement === el ? '0 0 8px rgba(6,182,212,0.5)' : 'none' }}
            >
              {el}
            </span>
            
            {/* Color indicator dot */}
            <div 
              className="absolute bottom-1.5 w-1 h-1 rounded-full opacity-70"
              style={{ backgroundColor: ATOM_COLORS[el] }}
            />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-800/50" />

      {/* Section Header: Bonds */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        <Zap className="w-3 h-3" /> Bonds
      </div>

      {/* Bond Type Selection */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((type) => (
          <button
            key={type}
            onClick={() => onSelectBondType(type as 1 | 2 | 3)}
            className={`
              flex items-center justify-center h-10 rounded-xl border transition-all duration-200
              ${bondType === type
                ? 'bg-violet-500/20 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
            `}
          >
            <div className="flex flex-col gap-[3px]">
              {Array.from({ length: type }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-[2px] rounded-full ${bondType === type ? 'bg-violet-300 shadow-[0_0_5px_rgba(139,92,246,0.8)]' : 'bg-slate-500'}`} 
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Info / Helper */}
      <div className="mt-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 leading-relaxed space-y-1">
        <p><span className="text-cyan-400 font-bold">Tip:</span> Drag between atoms to create bonds.</p>
        <p><span className="text-violet-400 font-bold">Pro:</span> Click existing bond to cycle order (1→2→3).</p>
      </div>

      {/* Common Molecules Quick-Add */}
      <div className="mt-2">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Templates</div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: 'H₂O', formula: 'Water' },
            { name: 'CO₂', formula: 'Carbon Dioxide' },
            { name: 'CH₄', formula: 'Methane' },
            { name: 'NH₃', formula: 'Ammonia' },
          ].map((mol) => (
            <button
              key={mol.name}
              className="px-2 py-1.5 text-[10px] rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-slate-300"
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
