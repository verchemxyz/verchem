'use client'

import React, { useState, useMemo } from 'react'
import {
  MOLECULES_3D,
  MOLECULE_CATEGORIES,
  searchMolecules3D,
  getMoleculeCategory,
} from '@/lib/data/molecules-3d'
import type { Molecule3D } from '@/lib/types/chemistry'

interface PresetSelectorProps {
  onLoadPreset: (molecule: Molecule3D) => void
}

export default function PresetSelector({ onLoadPreset }: PresetSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MOLECULE_CATEGORIES | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter molecules based on category and search
  const filteredMolecules = useMemo(() => {
    let molecules = Object.values(MOLECULES_3D)

    // Filter by category
    if (selectedCategory !== 'All') {
      const categoryFormulas = MOLECULE_CATEGORIES[selectedCategory] as readonly string[]
      molecules = molecules.filter(mol => (categoryFormulas as string[]).includes(mol.formula))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      molecules = searchMolecules3D(searchQuery)
      if (selectedCategory !== 'All') {
        const categoryFormulas = MOLECULE_CATEGORIES[selectedCategory] as readonly string[]
        molecules = molecules.filter(mol => (categoryFormulas as string[]).includes(mol.formula))
      }
    }

    return molecules
  }, [selectedCategory, searchQuery])

  const categories: Array<keyof typeof MOLECULE_CATEGORIES | 'All'> = ['All', ...Object.keys(MOLECULE_CATEGORIES) as Array<keyof typeof MOLECULE_CATEGORIES>]

  return (
    <div className="space-y-4" role="region" aria-labelledby="preset-heading">
      {/* Header with search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 id="preset-heading" className="text-lg font-semibold text-white">Molecule Presets</h3>
        <div className="relative">
          <label htmlFor="molecule-search" className="sr-only">
            Search molecules by name, formula, or use
          </label>
          <input
            id="molecule-search"
            type="text"
            placeholder="Search molecules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
            aria-label="Search molecules by name, formula, or use"
            aria-describedby="search-instructions"
            aria-controls="molecule-results"
          />
          <span id="search-instructions" className="sr-only">
            Type to filter molecules. Use categories below to narrow results.
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1 text-xs text-white hover:bg-white/20"
              aria-label="Clear search query"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Molecule categories"
      >
        {categories.map((category) => {
          const isActive = selectedCategory === category
          const count = category === 'All'
            ? Object.keys(MOLECULES_3D).length
            : MOLECULE_CATEGORIES[category as keyof typeof MOLECULE_CATEGORIES]?.length || 0

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_4px_12px_rgba(34,211,238,0.2)]'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-500/5 hover:text-white'
              }`}
              role="tab"
              aria-selected={isActive}
              aria-controls="molecule-results"
              aria-label={`${category} category, ${count} molecules`}
            >
              {category}
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]" aria-hidden="true">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Results count - ARIA live region */}
      <div
        className="flex items-center justify-between text-xs text-slate-400"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>
          {filteredMolecules.length} molecule{filteredMolecules.length !== 1 ? 's' : ''} found
        </span>
        {searchQuery && (
          <span>
            Searching for &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {/* Molecule grid */}
      <div
        id="molecule-results"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="tabpanel"
        aria-label="Molecule search results"
      >
        {filteredMolecules.length > 0 ? (
          filteredMolecules.map((molecule) => {
            const category = getMoleculeCategory(molecule.formula)
            const hazardCount = molecule.metadata?.hazards?.length || 0
            const hasHazards = hazardCount > 0

            return (
              <button
                key={molecule.formula}
                onClick={() => onLoadPreset(molecule)}
                className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-left transition hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_20px_40px_rgba(34,211,238,0.2)]"
                aria-label={`Load ${molecule.name}, formula ${molecule.formula}, ${molecule.atoms.length} atoms, ${molecule.bonds.length} bonds${hasHazards ? `, warning: ${hazardCount} hazard${hazardCount !== 1 ? 's' : ''}` : ''}`}
              >
                {/* Category badge */}
                {category && (
                  <div className="absolute right-2 top-2 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                    {category}
                  </div>
                )}

                {/* Molecule info */}
                <div className="pr-16">
                  <h4 className="text-sm font-semibold text-white">{molecule.name}</h4>
                  <p className="mt-0.5 font-mono text-xs text-cyan-300">{molecule.formula}</p>
                </div>

                {/* Description */}
                <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                  {molecule.metadata?.description || molecule.geometry}
                </p>

                {/* Stats */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    {molecule.atoms.length} atoms
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    {molecule.bonds.length} bonds
                  </span>
                  {molecule.geometry && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                      {molecule.geometry}
                    </span>
                  )}
                  {hasHazards && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                      ⚠️ {hazardCount} hazard{hazardCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Load button (appears on hover) */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Click to load
                  </span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100 opacity-0 transition group-hover:opacity-100">
                    Load →
                  </span>
                </div>
              </button>
            )
          })
        ) : (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-slate-400">
              No molecules found matching &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
              className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Info footer */}
      <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 text-xs text-cyan-100">
        <p className="font-semibold">💡 Tip:</p>
        <p className="mt-1 text-slate-300">
          Click any molecule to load it instantly. All coordinates are pre-calculated for perfect 3D visualization.
          Try searching by name, formula, or use (e.g., &ldquo;fuel&rdquo;, &ldquo;medicine&rdquo;, &ldquo;solvent&rdquo;).
        </p>
      </div>
    </div>
  )
}
