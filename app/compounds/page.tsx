'use client'

// VerChem - Compound Database Page
// Comprehensive chemical compound database with 500+ compounds

import { useState } from 'react'
import Link from 'next/link'
import CompoundBrowser from '@/components/compound-browser'
import { Compound } from '@/lib/types/chemistry'

export default function CompoundsPage() {
  const [selectedCompounds, setSelectedCompounds] = useState<Compound[]>([])

  const handleCompoundSelect = (compound: Compound) => {
    // Toggle selection
    const isSelected = selectedCompounds.some(c => c.id === compound.id)
    if (isSelected) {
      setSelectedCompounds(selectedCompounds.filter(c => c.id !== compound.id))
    } else {
      setSelectedCompounds([...selectedCompounds, compound])
    }
  }

  const clearSelection = () => {
    setSelectedCompounds([])
  }

  const exportSelection = (format: 'json' | 'csv') => {
    const data = selectedCompounds.map(compound => ({
      id: compound.id,
      name: compound.name,
      formula: compound.formula,
      molecularMass: compound.molecularMass,
      cas: compound.cas,
      meltingPoint: compound.meltingPoint,
      boilingPoint: compound.boilingPoint,
      density: compound.density,
      uses: compound.uses
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selected-compounds.json'
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const headers = ['ID', 'Name', 'Formula', 'Molecular Mass', 'CAS', 'Melting Point', 'Boiling Point', 'Density', 'Uses']
      const rows = data.map(compound => [
        compound.id,
        compound.name,
        compound.formula,
        compound.molecularMass,
        compound.cas || '',
        compound.meltingPoint || '',
        compound.boilingPoint || '',
        compound.density || '',
        compound.uses?.join(';') || ''
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selected-compounds.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-600">Ver</span>
              <span className="text-gray-900">Chem</span>
            </h1>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            Chemical Compound Database
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Comprehensive database of 500+ chemical compounds with advanced search, filtering, and integration capabilities
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-sm text-gray-600">Total Compounds</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">20+</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Data Complete</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-gray-600">Applications</div>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        {selectedCompounds.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-700">
                <span className="font-semibold">{selectedCompounds.length}</span> compounds selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => exportSelection('json')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => exportSelection('csv')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
            
            {/* Selected Compounds Preview */}
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCompounds.slice(0, 10).map(compound => (
                <span key={compound.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {compound.name} ({compound.formula})
                </span>
              ))}
              {selectedCompounds.length > 10 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                  +{selectedCompounds.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Integration Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            href="/stoichiometry"
            className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow group"
          >
            <div className="text-2xl mb-2">⚖️</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Stoichiometry</h3>
            <p className="text-sm text-gray-600">Molecular mass calculations with compound data</p>
          </Link>
          
          <Link 
            href="/thermodynamics"
            className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow group"
          >
            <div className="text-2xl mb-2">🌡️</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Thermodynamics</h3>
            <p className="text-sm text-gray-600">Thermodynamic properties and calculations</p>
          </Link>
          
          <Link 
            href="/solutions"
            className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow group"
          >
            <div className="text-2xl mb-2">💧</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">Solutions</h3>
            <p className="text-sm text-gray-600">Solubility and solution chemistry</p>
          </Link>
          
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow group cursor-pointer">
            <div className="text-2xl mb-2">🔬</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">3D Viewer</h3>
            <p className="text-sm text-gray-600">Molecular structure visualization</p>
          </div>
        </div>

        {/* Compound Browser */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CompoundBrowser 
            onCompoundSelect={handleCompoundSelect}
            selectedCompounds={selectedCompounds}
            mode="select"
          />
        </div>

        {/* Database Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Advanced Search</h3>
            <p className="text-gray-600">
              Search by name, formula, properties, hazards, applications, and more. 
              Filter by molecular mass, physical properties, and functional groups.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Comprehensive Data</h3>
            <p className="text-gray-600">
              Each compound includes physical properties, safety data, thermodynamic properties, 
              solubility information, and common applications.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold mb-2">Calculator Integration</h3>
            <p className="text-gray-600">
              Seamlessly integrate with stoichiometry, thermodynamics, and solutions calculators. 
              Automatic property lookup and calculation suggestions.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">🧪</div>
            <h3 className="text-xl font-semibold mb-2">Diverse Categories</h3>
            <p className="text-gray-600">
              Organic compounds, inorganic compounds, biochemicals, pharmaceuticals, 
              industrial chemicals, environmental compounds, and materials science.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Safety Focus</h3>
            <p className="text-gray-600">
              Comprehensive hazard information with GHS codes, safety precautions, 
              first aid instructions, and storage recommendations.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Educational Resources</h3>
            <p className="text-gray-600">
              Curated compound sets for different educational levels, 
              from basic chemistry to advanced materials science.
            </p>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Data Sources</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• NIST Chemistry WebBook</li>
                <li>• PubChem Database</li>
                <li>• ChemSpider</li>
                <li>• CRC Handbook of Chemistry and Physics</li>
                <li>• Merck Index</li>
                <li>• IUPAC Standards</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Coverage</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Basic properties (name, formula, MW)</li>
                <li>• Physical properties (MP, BP, density)</li>
                <li>• Thermodynamic data (ΔH, ΔG, S, Cp)</li>
                <li>• Safety data (GHS, hazards, precautions)</li>
                <li>• Structure data (SMILES, InChI)</li>
                <li>• Applications and uses</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}