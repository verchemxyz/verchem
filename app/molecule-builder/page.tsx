'use client'

import { useState, useCallback, useEffect } from 'react'
import MoleculeEditor from '@/components/molecule-builder/MoleculeEditor'
import Toolbar from '@/components/molecule-builder/Toolbar'
import { 
  BuilderAtom, 
  BuilderBond, 
  validateMolecule, 
  ValidationResult,
  checkOctetRule,
  recognizeMolecule
} from '@/lib/utils/molecule-builder'
import { 
  getAllowedBondTypes, 
  isBondTypeAllowed, 
  getMaxBondOrder 
} from '@/lib/utils/bond-restrictions'
import { hapticAtomAdd, hapticBondCreate, hapticError, hapticSuccess } from '@/lib/utils/haptics'

export default function MoleculeBuilderPage() {
  // State
  const [atoms, setAtoms] = useState<BuilderAtom[]>([])
  const [bonds, setBonds] = useState<BuilderBond[]>([])
  const [selectedElement, setSelectedElement] = useState('C')
  const [selectedBondType, setSelectedBondType] = useState<1 | 2 | 3>(1)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [moleculeName, setMoleculeName] = useState<string | null>(null)
  
  // UI Effects
  const [isShaking, setIsShaking] = useState(false)
  const [blinkingAtoms, setBlinkingAtoms] = useState<number[]>([])

  // Validation Effect
  useEffect(() => {
    const result = validateMolecule(atoms, bonds)
    setValidation(result)
    
    const name = recognizeMolecule(atoms, bonds)
    setMoleculeName(name)

    // Check for unstable atoms to blink
    const unstableIds = result.atomStability
      .filter(s => !s.isStable)
      .map((_, i) => atoms[i]?.id)
      .filter(id => id !== undefined)
    
    setBlinkingAtoms(unstableIds)
  }, [atoms, bonds])

  // Handlers
  const handleAddAtom = useCallback((x: number, y: number) => {
    const newAtom: BuilderAtom = {
      id: Date.now(),
      element: selectedElement,
      x,
      y,
      z: 0,
      valenceElectrons: 0, // Will be calculated by util
      formalCharge: 0
    }
    
    setAtoms(prev => [...prev, newAtom])
    hapticAtomAdd()
  }, [selectedElement])

  const handleAddBond = useCallback((atom1Id: number, atom2Id: number) => {
    const atom1 = atoms.find(a => a.id === atom1Id)
    const atom2 = atoms.find(a => a.id === atom2Id)
    
    if (!atom1 || !atom2) return false

    // Check if bond already exists
    const existingBond = bonds.find(
      b => (b.atom1Id === atom1Id && b.atom2Id === atom2Id) || 
           (b.atom1Id === atom2Id && b.atom2Id === atom1Id)
    )

    if (existingBond) {
      // Cycle bond order: 1 -> 2 -> 3 -> 1
      // But respect chemical limits
      const maxOrder = getMaxBondOrder(atom1.element, atom2.element)
      const nextOrder = (existingBond.order % maxOrder) + 1
      
      // Update bond
      setBonds(prev => prev.map(b => 
        b.id === existingBond.id 
          ? { ...b, order: nextOrder as 1 | 2 | 3 }
          : b
      ))
      hapticBondCreate()
      return true
    }

    // Create new bond
    // Check if allowed
    if (!isBondTypeAllowed(atom1.element, atom2.element, 'single')) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      hapticError()
      return false
    }

    const newBond: BuilderBond = {
      id: Date.now(),
      atom1Id,
      atom2Id,
      order: 1 // Start with single bond
    }

    setBonds(prev => [...prev, newBond])
    hapticBondCreate()
    return true
  }, [atoms, bonds])

  const handleDeleteAtoms = useCallback((atomIds: number[]) => {
    setAtoms(prev => prev.filter(a => !atomIds.includes(a.id)))
    setBonds(prev => prev.filter(b => !atomIds.includes(b.atom1Id) && !atomIds.includes(b.atom2Id)))
    hapticSuccess()
  }, [])

  const handleDeleteBonds = useCallback((bondIds: number[]) => {
    setBonds(prev => prev.filter(b => !bondIds.includes(b.id)))
    hapticSuccess()
  }, [])

  const handleMoveAtoms = useCallback((movedAtoms: Array<{ id: number; x: number; y: number }>) => {
    setAtoms(prev => prev.map(atom => {
      const move = movedAtoms.find(m => m.id === atom.id)
      return move ? { ...atom, x: move.x, y: move.y } : atom
    }))
  }, [])

  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setAtoms([])
      setBonds([])
      hapticSuccess()
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Main Canvas Area */}
      <main className="flex-1 relative order-2 md:order-1 h-[100vh] md:h-auto overflow-hidden">
        
        {/* Header / Title Overlay */}
        <div className="absolute top-6 left-8 z-10 pointer-events-none">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 filter drop-shadow-lg">
            Molecule Builder <span className="text-xs align-top opacity-50 font-mono border border-cyan-500/30 px-1 rounded">PRO</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mt-1 text-shadow-sm">
            Construct 2D molecules with intelligent validation.
          </p>
          
          {/* Dynamic Molecule Name */}
          <div className="mt-4 h-8 transition-all duration-300">
            {moleculeName && (
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/40 backdrop-blur-md animate-in fade-in slide-in-from-left-4">
                <span className="text-cyan-300 font-bold tracking-wide">{moleculeName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="w-full h-full p-4 pt-24 md:pt-4 md:p-0">
            <MoleculeEditor
            atoms={atoms}
            bonds={bonds}
            onAddAtom={handleAddAtom}
            onAddBond={handleAddBond}
            onDeleteAtoms={handleDeleteAtoms}
            onDeleteBonds={handleDeleteBonds}
            onMoveAtoms={handleMoveAtoms}
            onDragEnd={() => {}}
            onClear={handleClear}
            isShaking={isShaking}
            blinkingAtoms={blinkingAtoms}
            validation={validation}
            />
        </div>
      </main>

      {/* Sidebar / Toolbar */}
      <aside className="w-full md:w-80 p-4 md:p-6 bg-[#020617]/50 backdrop-blur-sm border-t md:border-t-0 md:border-l border-slate-800 flex flex-col gap-6 order-1 md:order-2 z-20 shadow-2xl">
        
        {/* Toolbar Component */}
        <Toolbar
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          bondType={selectedBondType}
          onSelectBondType={setSelectedBondType}
        />

        {/* Validation Hints Panel */}
        <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800/60 p-5 backdrop-blur-md overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
             Analysis Engine
             {validation?.isStable && <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>}
          </h3>
          
          {validation ? (
            <div className="space-y-3">
               {/* Formula */}
               <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="text-xs text-slate-500">Formula</span>
                  <span className="font-mono text-cyan-300 font-bold text-lg tracking-wider">
                    {validation.formula === 'Empty' ? '—' : validation.formula}
                  </span>
               </div>

               {/* Hints List */}
               {validation.hints.length > 0 && (
                 <div className="space-y-2">
                    {validation.hints.map((hint, i) => (
                      <div key={i} className="text-xs p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 leading-relaxed flex gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        {hint}
                      </div>
                    ))}
                 </div>
               )}

               {/* Warnings */}
               {validation.warnings.length > 0 && (
                 <div className="space-y-2">
                    {validation.warnings.map((warn, i) => (
                      <div key={i} className="text-xs p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300/90 leading-relaxed flex gap-2">
                        <span className="text-red-500 font-bold">⚠</span>
                        {warn}
                      </div>
                    ))}
                 </div>
               )}
               
               {validation.isValid && validation.hints.length === 0 && (
                   <div className="text-center p-8 text-slate-600 flex flex-col items-center gap-2">
                       <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                           <span className="text-2xl">✨</span>
                       </div>
                       <p className="text-sm font-medium text-green-400">Perfectly Stable</p>
                       <p className="text-xs">Ready for 3D simulation</p>
                   </div>
               )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
              <p className="text-sm">Start building to see analysis</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}