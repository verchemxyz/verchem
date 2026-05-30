// VerChem Structure Search Component
'use client'

import React, { useState } from 'react'
import { BeakerIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface StructureSearchProps {
  onSearch: (smiles: string) => void
  className?: string
}

export function StructureSearch({ onSearch, className = "" }: StructureSearchProps) {
  const [smiles, setSmiles] = useState('')
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [molecules] = useState([
    { name: 'Water', formula: 'H₂O', smiles: 'O' },
    { name: 'Methane', formula: 'CH₄', smiles: 'C' },
    { name: 'Ethanol', formula: 'C₂H₅OH', smiles: 'CCO' },
    { name: 'Benzene', formula: 'C₆H₆', smiles: 'c1ccccc1' },
    { name: 'Glucose', formula: 'C₆H₁₂O₆', smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O' },
    { name: 'Aspirin', formula: 'C₉H₈O₄', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' },
    { name: 'Caffeine', formula: 'C₈H₁₀N₄O₂', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' }
  ])

  const handleQuickSearch = (smilesString: string) => {
    setSmiles(smilesString)
    onSearch(smilesString)
  }

  const handleDrawStructure = () => {
    setIsDrawingMode(true)
  }

  const handleClear = () => {
    setSmiles('')
    setIsDrawingMode(false)
  }

  const handleSearch = () => {
    if (smiles.trim()) {
      onSearch(smiles.trim())
    }
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Structure Search</h3>
        <button
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Clear"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Quick molecule templates */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Common molecules:</p>
        <div className="flex flex-wrap gap-2">
          {molecules.map((molecule) => (
            <button
              key={molecule.name}
              onClick={() => handleQuickSearch(molecule.smiles)}
              className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
              title={`${molecule.name} - ${molecule.formula}`}
            >
              {molecule.name}
            </button>
          ))}
        </div>
      </div>

      {/* Drawing area */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Draw or paste structure:</p>
          <button
            onClick={handleDrawStructure}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isDrawingMode
                ? 'bg-primary-500 text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-border'
            }`}
          >
            {isDrawingMode ? 'Drawing...' : 'Draw'}
          </button>
        </div>

        {isDrawingMode ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <BeakerIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Click and drag to draw molecules</p>
            <p className="text-xs text-muted-foreground">Feature coming soon!</p>
            <button
              onClick={() => setIsDrawingMode(false)}
              className="mt-3 px-3 py-1 text-xs bg-muted text-foreground rounded hover:bg-border transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <textarea
            value={smiles}
            onChange={(e) => setSmiles(e.target.value)}
            placeholder="Enter SMILES notation or draw structure above..."
            className="w-full h-24 px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        )}
      </div>

      {/* SMILES examples */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">SMILES examples:</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Water: O</span>
            <span>Ethanol: CCO</span>
          </div>
          <div className="flex justify-between">
            <span>Benzene: c1ccccc1</span>
            <span>Aspirin: CC(=O)OC1=CC=CC=C1C(=O)O</span>
          </div>
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={!smiles.trim()}
        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        <BeakerIcon className="h-4 w-4 mr-2" />
        Search by Structure
      </button>

      {/* Substructure search option */}
      <div className="mt-3 flex items-center">
        <input
          type="checkbox"
          id="substructure"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border rounded"
        />
        <label htmlFor="substructure" className="ml-2 text-sm text-foreground">
          Include substructure matches
        </label>
      </div>
    </div>
  )
}
