'use client'

// VerChem - Molecule Selector Component
// Gallery/dropdown for selecting molecules

import { useState } from 'react'
import type { Molecule3D, DisplayStyle } from '@/lib/types/chemistry'
import { MOLECULES_3D } from '@/lib/data/molecules-3d'

interface MoleculeSelectorProps {
  onSelectMolecule: (molecule: Molecule3D) => void
  onDisplayStyleChange: (style: DisplayStyle) => void
  onToggleLabels: (show: boolean) => void
  onToggleAutoRotate: (auto: boolean) => void
  currentMolecule?: Molecule3D
  currentDisplayStyle?: DisplayStyle
  showLabels?: boolean
  autoRotate?: boolean
}

export default function MoleculeSelector({
  onSelectMolecule,
  onDisplayStyleChange,
  onToggleLabels,
  onToggleAutoRotate,
  currentMolecule,
  currentDisplayStyle = 'ball-stick',
  showLabels = true,
  autoRotate = false,
}: MoleculeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const molecules = Object.values(MOLECULES_3D)

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      {/* Molecule Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Molecule
        </label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-between hover:bg-gray-700"
          >
            <span>
              {currentMolecule
                ? `${currentMolecule.name} (${currentMolecule.formula})`
                : 'Select a molecule...'}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-2 w-full bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {molecules.map((mol) => (
                <button
                  key={mol.formula}
                  onClick={() => {
                    onSelectMolecule(mol)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 border-b border-gray-700 last:border-0 ${
                    currentMolecule?.formula === mol.formula
                      ? 'bg-blue-900'
                      : ''
                  }`}
                >
                  <div className="font-medium text-white">{mol.name}</div>
                  <div className="text-sm text-gray-400">{mol.formula}</div>
                  {mol.geometry && (
                    <div className="text-xs text-gray-500 mt-1">
                      {mol.geometry}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Display Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDisplayStyleChange('ball-stick')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              currentDisplayStyle === 'ball-stick'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Ball & Stick
          </button>
          <button
            onClick={() => onDisplayStyleChange('space-filling')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              currentDisplayStyle === 'space-filling'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Space Filling
          </button>
          <button
            onClick={() => onDisplayStyleChange('wireframe')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              currentDisplayStyle === 'wireframe'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Wireframe
          </button>
          <button
            onClick={() => onDisplayStyleChange('stick')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              currentDisplayStyle === 'stick'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Stick
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => onToggleLabels(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Show Atom Labels</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => onToggleAutoRotate(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-300">Auto Rotate</span>
        </label>
      </div>

      {/* Molecule Info */}
      {currentMolecule && (
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <h4 className="text-white font-bold text-sm">Molecule Info</h4>

          {currentMolecule.geometry && (
            <div>
              <span className="text-gray-400 text-xs">Geometry:</span>
              <span className="text-white text-sm ml-2">
                {currentMolecule.geometry}
              </span>
            </div>
          )}

          {currentMolecule.bondAngles && currentMolecule.bondAngles.length > 0 && (
            <div>
              <span className="text-gray-400 text-xs">Bond Angle:</span>
              <span className="text-white text-sm ml-2">
                {currentMolecule.bondAngles[0]}°
              </span>
            </div>
          )}

          {currentMolecule.dipoleMoment !== undefined && (
            <div>
              <span className="text-gray-400 text-xs">Dipole Moment:</span>
              <span className="text-white text-sm ml-2">
                {currentMolecule.dipoleMoment === 0
                  ? 'Nonpolar'
                  : `${currentMolecule.dipoleMoment} D (Polar)`}
              </span>
            </div>
          )}

          <div>
            <span className="text-gray-400 text-xs">Atoms:</span>
            <span className="text-white text-sm ml-2">
              {currentMolecule.atoms.length}
            </span>
          </div>

          <div>
            <span className="text-gray-400 text-xs">Bonds:</span>
            <span className="text-white text-sm ml-2">
              {currentMolecule.bonds.length}
            </span>
          </div>

          {currentMolecule.metadata?.description && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-300 text-xs">
                {currentMolecule.metadata.description}
              </p>
            </div>
          )}

          {currentMolecule.metadata?.uses &&
            currentMolecule.metadata.uses.length > 0 && (
              <div>
                <span className="text-gray-400 text-xs">Uses:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentMolecule.metadata.uses.map((use, i) => (
                    <span
                      key={i}
                      className="bg-blue-900/50 text-blue-200 text-xs px-2 py-0.5 rounded"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {currentMolecule.metadata?.hazards &&
            currentMolecule.metadata.hazards.length > 0 && (
              <div>
                <span className="text-red-400 text-xs">⚠️ Hazards:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentMolecule.metadata.hazards.map((hazard, i) => (
                    <span
                      key={i}
                      className="bg-red-900/50 text-red-200 text-xs px-2 py-0.5 rounded"
                    >
                      {hazard}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
