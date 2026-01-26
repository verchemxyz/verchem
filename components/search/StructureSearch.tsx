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
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Structure Search</h3>
        <button
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          title="Clear"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Quick molecule templates */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Common molecules:</p>
        <div className="flex flex-wrap gap-2">
          {molecules.map((molecule) => (
            <button
              key={molecule.name}
              onClick={() => handleQuickSearch(molecule.smiles)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Draw or paste structure:</p>
          <button
            onClick={handleDrawStructure}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isDrawingMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {isDrawingMode ? 'Drawing...' : 'Draw'}
          </button>
        </div>
        
        {isDrawingMode ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <BeakerIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click and drag to draw molecules</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Feature coming soon!</p>
            <button
              onClick={() => setIsDrawingMode(false)}
              className="mt-3 px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <textarea
            value={smiles}
            onChange={(e) => setSmiles(e.target.value)}
            placeholder="Enter SMILES notation or draw structure above..."
            className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        )}
      </div>

      {/* SMILES examples */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">SMILES examples:</p>
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
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
        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <BeakerIcon className="h-4 w-4 mr-2" />
        Search by Structure
      </button>

      {/* Substructure search option */}
      <div className="mt-3 flex items-center">
        <input
          type="checkbox"
          id="substructure"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
        />
        <label htmlFor="substructure" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Include substructure matches
        </label>
      </div>
    </div>
  )
}
