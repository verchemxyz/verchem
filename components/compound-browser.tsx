'use client'

// VerChem - Comprehensive Compound Database Browser
// Advanced search, filtering, and visualization for 500+ compounds

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Compound } from '@/lib/types/chemistry'
import { 
  searchCompoundsAdvanced, 
  getRandomCompounds,
  getDatabaseStatistics
} from '@/lib/compound-search'
import { 
  getCompoundForStoichiometry,
  getSafetyData,
  getSolutionProperties,
  getThermodynamicData
} from '@/lib/compound-integration'

interface CompoundBrowserProps {
  onCompoundSelect?: (compound: Compound) => void
  selectedCompounds?: Compound[]
  mode?: 'browse' | 'select' | 'integration'
  calculatorType?: 'stoichiometry' | 'thermodynamics' | 'solutions' | 'safety'
}

export default function CompoundBrowser({ 
  onCompoundSelect, 
  selectedCompounds = [], 
  mode = 'browse',
  calculatorType = 'stoichiometry'
}: CompoundBrowserProps) {
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [selectedCompound, setSelectedCompound] = useState<Compound | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedHazard, setSelectedHazard] = useState<string>('all')
  const [molecularMassRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState<'name' | 'molecularMass' | 'boilingPoint'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showStats, setShowStats] = useState(false)
  const [loading, setLoading] = useState(false)

  const statistics = useMemo(() => getDatabaseStatistics(), [])

  // Categories for filtering
  const categories = [
    'all', 'alkanes', 'alkenes', 'alkynes', 'aromatics', 'alcohols', 
    'aldehydes', 'ketones', 'carboxylic-acids', 'esters', 'ethers', 
    'amines', 'amino-acids', 'sugars', 'pharmaceuticals', 'vitamins',
    'polymers', 'pollutants', 'semiconductors', 'inorganic'
  ]

  const hazardTypes = [
    'all', 'flammable', 'toxic', 'corrosive', 'oxidizer', 'explosive', 
    'carcinogen', 'irritant', 'environmental'
  ]

  const loadCompounds = useCallback(async () => {
    setLoading(true)
    try {
      const results = searchCompoundsAdvanced({
        limit: 50,
        sortBy,
        sortOrder
      })
      setCompounds(results)
    } catch (error) {
      console.error('Error loading compounds:', error)
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder])

  const filterCompounds = useCallback(async () => {
    setLoading(true)
    try {
      const options = {
        query: searchQuery,
        category: selectedCategory === 'all' ? undefined : [selectedCategory],
        hazardTypes: selectedHazard === 'all' ? undefined : [selectedHazard],
        molecularMassRange: molecularMassRange[1] > 0 ? molecularMassRange : undefined,
        sortBy,
        sortOrder,
        limit: 100
      }
      
      const results = searchCompoundsAdvanced(options)
      setCompounds(results)
    } catch (error) {
      console.error('Error filtering compounds:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedHazard, molecularMassRange, sortBy, sortOrder])

  // Load compounds on mount
  useEffect(() => {
    loadCompounds()
  }, [loadCompounds])

  // Filter compounds when search parameters change
  useEffect(() => {
    filterCompounds()
  }, [filterCompounds])

  const handleCompoundSelect = (compound: Compound) => {
    setSelectedCompound(compound)
    if (onCompoundSelect) {
      onCompoundSelect(compound)
    }
  }

  const getIntegrationData = (compound: Compound) => {
    switch (calculatorType) {
      case 'stoichiometry':
        return getCompoundForStoichiometry(compound.formula)
      case 'thermodynamics':
        return getThermodynamicData(compound.formula)
      case 'solutions':
        return getSolutionProperties(compound.formula)
      case 'safety':
        return getSafetyData(compound.formula)
      default:
        return null
    }
  }

  const CompoundCard = ({ compound }: { compound: Compound }) => {
    const isSelected = selectedCompounds.some(c => c.id === compound.id)
    const integrationData = mode === 'integration' ? getIntegrationData(compound) : null
    
    return (
      <div
        className={`bg-card border border-border rounded-lg shadow-sm p-4 cursor-pointer transition-shadow hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary-500' : ''
        } ${selectedCompound?.id === compound.id ? 'ring-2 ring-destructive' : ''}`}
        onClick={() => handleCompoundSelect(compound)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-foreground">{compound.name}</h3>
          <span className="text-sm text-muted-foreground">{compound.formula}</span>
        </div>

        <div className="text-sm text-muted-foreground mb-2">
          {compound.molecularMass && <div>MW: {compound.molecularMass.toFixed(2)} g/mol</div>}
          {compound.meltingPoint && <div>MP: {compound.meltingPoint}°C</div>}
          {compound.boilingPoint && <div>BP: {compound.boilingPoint}°C</div>}
        </div>
        
        {compound.hazards && compound.hazards.length > 0 && (
          <div className="mb-2">
            {compound.hazards.slice(0, 3).map((hazard, idx) => {
              // Handle both string (GHS code) and object format
              const hazardCode = typeof hazard === 'string' ? hazard : (hazard.ghsCode || hazard.type || '');
              const isCorrosive = hazardCode.includes('H314') || hazardCode.includes('H318');
              const isToxic = hazardCode.includes('H300') || hazardCode.includes('H310') || hazardCode.includes('H330');
              const isFlammable = hazardCode.includes('H220') || hazardCode.includes('H225') || hazardCode.includes('H226');

              return (
                <span
                  key={idx}
                  className={`inline-block px-2 py-1 rounded text-xs mr-1 mb-1 ${
                    isToxic ? 'bg-destructive/10 text-destructive' :
                    isCorrosive ? 'bg-info/10 text-info-strong' :
                    isFlammable ? 'bg-warning/10 text-warning-strong' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {hazardCode}
                </span>
              );
            })}
          </div>
        )}
        
        {compound.uses && compound.uses.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Uses: {compound.uses.slice(0, 2).join(', ')}
            {compound.uses.length > 2 && '...'}
          </div>
        )}

        {integrationData && (
          <div className="mt-2 p-2 bg-muted rounded text-xs">
            <div className="font-semibold">Integration Data:</div>
            {calculatorType === 'stoichiometry' && 'calculatedProperties' in integrationData && integrationData.calculatedProperties && (
              <div>
                Atoms: {integrationData.calculatedProperties.atomCount} |
                Empirical: {integrationData.calculatedProperties.empiricalFormula}
              </div>
            )}
            {calculatorType === 'solutions' && 'solubility' in integrationData && (
              <div>
                Solubility: {typeof integrationData.solubility === 'number' ? integrationData.solubility : 'N/A'} |
                pH: {'pH' in integrationData ? (integrationData.pH?.toFixed(1) || 'N/A') : 'N/A'}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const CompoundListItem = ({ compound }: { compound: Compound }) => {
    const isSelected = selectedCompounds.some(c => c.id === compound.id)
    
    return (
      <div
        className={`bg-card rounded-lg shadow-sm p-4 cursor-pointer transition-shadow hover:shadow-md border ${
          isSelected ? 'border-primary-500 bg-primary-50' : 'border-border'
        } ${selectedCompound?.id === compound.id ? 'border-destructive bg-destructive/10' : ''}`}
        onClick={() => handleCompoundSelect(compound)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-foreground">{compound.name}</h3>
              <span className="text-sm text-muted-foreground">{compound.formula}</span>
              {compound.molecularMass && <span className="text-sm text-muted-foreground">MW: {compound.molecularMass.toFixed(1)}</span>}
            </div>

            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {compound.meltingPoint && <span>MP: {compound.meltingPoint}°C</span>}
              {compound.boilingPoint && <span>BP: {compound.boilingPoint}°C</span>}
              {compound.density && <span>ρ: {compound.density.toFixed(3)} g/cm³</span>}
              {compound.cas && <span>CAS: {compound.cas}</span>}
            </div>

            {compound.uses && compound.uses.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Uses: {compound.uses.join(', ')}
              </div>
            )}
          </div>
          
          {compound.hazards && compound.hazards.length > 0 && (
            <div className="flex gap-1">
              {compound.hazards.slice(0, 3).map((hazard, idx) => {
                const hazardCode = typeof hazard === 'string' ? hazard : (hazard.ghsCode || hazard.type || '');
                const isCorrosive = hazardCode.includes('H314') || hazardCode.includes('H318');
                const isToxic = hazardCode.includes('H300') || hazardCode.includes('H310') || hazardCode.includes('H330');
                const isFlammable = hazardCode.includes('H220') || hazardCode.includes('H225') || hazardCode.includes('H226');

                return (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded text-xs ${
                      isToxic ? 'bg-destructive/10 text-destructive' :
                      isCorrosive ? 'bg-info/10 text-info-strong' :
                      isFlammable ? 'bg-warning/10 text-warning-strong' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {hazardCode}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          VerChem Compound Database
        </h1>
        <p className="text-muted-foreground">
          Comprehensive database of {statistics.totalCompounds} chemical compounds with advanced search and filtering
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, formula, CAS..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-card text-foreground"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-card text-foreground"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Hazard */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Hazard</label>
            <select
              value={selectedHazard}
              onChange={(e) => setSelectedHazard(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-card text-foreground"
            >
              {hazardTypes.map(hazard => (
                <option key={hazard} value={hazard}>
                  {hazard.charAt(0).toUpperCase() + hazard.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'molecularMass' | 'boilingPoint')}
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-card text-foreground"
              >
                <option value="name">Name</option>
                <option value="molecularMass">Molecular Mass</option>
                <option value="boilingPoint">Boiling Point</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-border rounded-md text-foreground hover:bg-muted"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">View:</label>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'grid' ? 'bg-primary-600 text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' ? 'bg-primary-600 text-primary-foreground' : 'bg-muted text-foreground'
              }`}
            >
              List
            </button>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-muted text-foreground border border-border rounded hover:bg-border text-sm"
          >
            {showStats ? 'Hide' : 'Show'} Statistics
          </button>

          <button
            onClick={() => setCompounds(getRandomCompounds(20))}
            className="px-4 py-2 bg-primary-600 text-primary-foreground rounded hover:bg-primary-700 text-sm"
          >
            Random Sample
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-foreground">Database Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{statistics.totalCompounds}</div>
              <div className="text-sm text-muted-foreground">Total Compounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{Object.keys(statistics.categories).length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-strong">
                {Object.values(statistics.categories).reduce((sum, count) => sum + count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Organic Compounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-600">
                {statistics.categories.inorganic || 0}
              </div>
              <div className="text-sm text-muted-foreground">Inorganic Compounds</div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="text-muted-foreground">
            Showing {compounds.length} compounds
          </div>
          {selectedCompound && (
            <div className="text-sm text-primary-600">
              Selected: {selectedCompound.name} ({selectedCompound.formula})
            </div>
          )}
        </div>
      </div>

      {/* Compound Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading compounds...</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-3'
        }>
          {compounds.map(compound => 
            viewMode === 'grid' ? (
              <CompoundCard key={compound.id} compound={compound} />
            ) : (
              <CompoundListItem key={compound.id} compound={compound} />
            )
          )}
        </div>
      )}

      {compounds.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No compounds found matching your criteria.
        </div>
      )}

      {/* Selected Compound Details */}
      {selectedCompound && mode === 'browse' && (
        <div className="mt-8 bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">{selectedCompound.name} Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Basic Properties</h3>
              <div className="space-y-1 text-sm text-foreground">
                <div><strong>Formula:</strong> {selectedCompound.formula}</div>
                {selectedCompound.molecularMass && <div><strong>Molecular Mass:</strong> {selectedCompound.molecularMass.toFixed(2)} g/mol</div>}
                {selectedCompound.cas && <div><strong>CAS:</strong> {selectedCompound.cas}</div>}
                {selectedCompound.meltingPoint && <div><strong>Melting Point:</strong> {selectedCompound.meltingPoint}°C</div>}
                {selectedCompound.boilingPoint && <div><strong>Boiling Point:</strong> {selectedCompound.boilingPoint}°C</div>}
                {selectedCompound.density && <div><strong>Density:</strong> {selectedCompound.density.toFixed(3)} g/cm³</div>}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Additional Information</h3>
              <div className="space-y-1 text-sm text-foreground">
                {selectedCompound.appearance && <div><strong>Appearance:</strong> {selectedCompound.appearance}</div>}
                {selectedCompound.odor && <div><strong>Odor:</strong> {selectedCompound.odor}</div>}
                {selectedCompound.solubility && (
                  <div><strong>Solubility:</strong> {
                    typeof selectedCompound.solubility === 'string'
                      ? selectedCompound.solubility
                      : selectedCompound.solubility.water || 'N/A'
                  }</div>
                )}
                {selectedCompound.pKa && <div><strong>pKa:</strong> {selectedCompound.pKa}</div>}
                {selectedCompound.pKb && <div><strong>pKb:</strong> {selectedCompound.pKb}</div>}
              </div>
            </div>
          </div>
          
          {selectedCompound.uses && selectedCompound.uses.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-foreground">Common Uses</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCompound.uses.map((use, idx) => (
                  <span key={idx} className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm">
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedCompound.hazards && selectedCompound.hazards.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-foreground">Hazards (GHS Codes)</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCompound.hazards.map((hazard, idx) => {
                  const hazardCode = typeof hazard === 'string' ? hazard : (hazard.ghsCode || hazard.type || '');
                  const isCorrosive = hazardCode.includes('H314') || hazardCode.includes('H318');
                  const isToxic = hazardCode.includes('H300') || hazardCode.includes('H310') || hazardCode.includes('H330');
                  const isFlammable = hazardCode.includes('H220') || hazardCode.includes('H225') || hazardCode.includes('H226');

                  return (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs ${
                        isToxic ? 'bg-destructive/10 text-destructive' :
                        isCorrosive ? 'bg-info/10 text-info-strong' :
                        isFlammable ? 'bg-warning/10 text-warning-strong' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {hazardCode}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
