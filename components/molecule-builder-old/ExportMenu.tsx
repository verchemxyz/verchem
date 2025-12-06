'use client'

import { useState } from 'react'
import type { BuilderAtom, BuilderBond } from '@/lib/utils/molecule-builder'
import {
  exportToSVG,
  exportToSMILES,
  exportToInChI,
  downloadSVG,
  downloadPNG,
  copyToClipboard,
  copyImageToClipboard,
  printMolecule,
} from '@/lib/utils/molecule-export'
import { hapticLight, hapticSuccess } from '@/lib/utils/haptics'

interface ExportMenuProps {
  atoms: BuilderAtom[]
  bonds: BuilderBond[]
}

export default function ExportMenu({ atoms, bonds }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState<'svg' | 'smiles' | 'inchi' | 'image' | null>(null)

  const handleExportSVG = () => {
    const svg = exportToSVG(atoms, bonds)
    downloadSVG(svg, 'molecule.svg')
    hapticSuccess()
    setIsOpen(false)
  }

  const handleExportPNG = () => {
    downloadPNG(atoms, bonds, 'molecule.png')
    hapticSuccess()
    setIsOpen(false)
  }

  const handleCopySMILES = async () => {
    const smiles = exportToSMILES(atoms, bonds)
    const success = await copyToClipboard(smiles)

    if (success) {
      hapticSuccess()
      setCopied('smiles')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleCopySVG = async () => {
    const svg = exportToSVG(atoms, bonds)
    const success = await copyToClipboard(svg)

    if (success) {
      hapticSuccess()
      setCopied('svg')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleCopyImage = async () => {
    const success = await copyImageToClipboard(atoms, bonds)

    if (success) {
      hapticSuccess()
      setCopied('image')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleCopyInChI = async () => {
    const inchi = exportToInChI(atoms, bonds)
    const success = await copyToClipboard(inchi)

    if (success) {
      hapticSuccess()
      setCopied('inchi')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handlePrint = () => {
    printMolecule(atoms, bonds)
    hapticSuccess()
    setIsOpen(false)
  }

  const smiles = exportToSMILES(atoms, bonds)
  const inchi = exportToInChI(atoms, bonds)

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${
          isOpen
            ? 'bg-cyan-500 text-black'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
        }`}
        onClick={() => {
          setIsOpen(!isOpen)
          hapticLight()
        }}
        disabled={atoms.length === 0}
        title="Export molecule"
      >
        💾 Export
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 z-50 bg-slate-900/95 backdrop-blur-sm border border-cyan-400/30 rounded-xl shadow-2xl min-w-[280px] animate-in fade-in zoom-in-95 duration-200">
            <div className="py-2">
              {/* Header */}
              <div className="px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-700">
                Export Molecule
              </div>

              {/* SVG options */}
              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center justify-between gap-3"
                onClick={handleExportSVG}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <div className="font-semibold">Download SVG</div>
                    <div className="text-xs text-slate-400">Vector graphics</div>
                  </div>
                </div>
              </button>

              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center justify-between gap-3"
                onClick={handleCopySVG}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-semibold">Copy SVG</div>
                    <div className="text-xs text-slate-400">To clipboard</div>
                  </div>
                </div>
                {copied === 'svg' && (
                  <span className="text-green-400 text-sm">✓ Copied!</span>
                )}
              </button>

              {/* PNG option */}
              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
                onClick={handleExportPNG}
              >
                <span className="text-xl">🖼️</span>
                <div>
                  <div className="font-semibold">Download PNG</div>
                  <div className="text-xs text-slate-400">Raster image</div>
                </div>
              </button>

              {/* Copy as Image */}
              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center justify-between gap-3"
                onClick={handleCopyImage}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎨</span>
                  <div>
                    <div className="font-semibold">Copy as Image</div>
                    <div className="text-xs text-slate-400">PNG to clipboard</div>
                  </div>
                </div>
                {copied === 'image' && (
                  <span className="text-green-400 text-sm">✓ Copied!</span>
                )}
              </button>

              {/* Print */}
              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
                onClick={handlePrint}
              >
                <span className="text-xl">🖨️</span>
                <div>
                  <div className="font-semibold">Print</div>
                  <div className="text-xs text-slate-400">Print molecule</div>
                </div>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-slate-700" />

              {/* SMILES section */}
              <div className="px-4 py-2 text-xs font-bold text-slate-400">
                SMILES Notation
              </div>

              <div className="px-4 py-2">
                <div className="bg-slate-950/50 rounded px-3 py-2 font-mono text-sm text-cyan-300 break-all">
                  {smiles || 'No molecule'}
                </div>
              </div>

              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center justify-between gap-3"
                onClick={handleCopySMILES}
                disabled={!smiles}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-semibold">Copy SMILES</div>
                    <div className="text-xs text-slate-400">Chemical notation</div>
                  </div>
                </div>
                {copied === 'smiles' && (
                  <span className="text-green-400 text-sm">✓ Copied!</span>
                )}
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-slate-700" />

              {/* InChI section */}
              <div className="px-4 py-2 text-xs font-bold text-slate-400">
                InChI Notation
              </div>

              <div className="px-4 py-2">
                <div className="bg-slate-950/50 rounded px-3 py-2 font-mono text-xs text-emerald-300 break-all max-h-20 overflow-y-auto">
                  {inchi || 'No molecule'}
                </div>
              </div>

              <button
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition-colors flex items-center justify-between gap-3"
                onClick={handleCopyInChI}
                disabled={!inchi}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-semibold">Copy InChI</div>
                    <div className="text-xs text-slate-400">Chemical identifier</div>
                  </div>
                </div>
                {copied === 'inchi' && (
                  <span className="text-green-400 text-sm">✓ Copied!</span>
                )}
              </button>

              {/* Info */}
              <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700 mt-2">
                <div className="flex items-start gap-2">
                  <span>ℹ️</span>
                  <div>
                    SMILES and InChI are simplified representations. Complex molecules
                    may need manual adjustment for stereochemistry.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
