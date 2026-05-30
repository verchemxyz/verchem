'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalcShell } from '@/components/lab'
import {
  FUNCTIONAL_GROUPS,
  FUNCTIONAL_GROUP_CATEGORIES,
  getFunctionalGroupsByCategory,
  searchFunctionalGroups,
} from '@/lib/data/organic/functional-groups'
import type { FunctionalGroupCategory, FunctionalGroup } from '@/lib/types/organic-chemistry'

const ALL_CATEGORIES = Object.keys(FUNCTIONAL_GROUP_CATEGORIES).filter(
  k => getFunctionalGroupsByCategory(k as FunctionalGroupCategory).length > 0
) as FunctionalGroupCategory[]

export default function FunctionalGroupsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FunctionalGroupCategory | 'all'>('all')
  const [selectedGroup, setSelectedGroup] = useState<FunctionalGroup | null>(null)

  const filteredGroups = useMemo(() => {
    if (searchQuery.trim()) {
      return searchFunctionalGroups(searchQuery)
    }
    if (selectedCategory === 'all') {
      return FUNCTIONAL_GROUPS
    }
    return getFunctionalGroupsByCategory(selectedCategory)
  }, [searchQuery, selectedCategory])

  return (
    <CalcShell
      eyebrow="Organic chemistry · reference"
      title="Functional Groups Reference"
      subtitle={`${FUNCTIONAL_GROUPS.length} functional groups with structures, properties, spectroscopy, and common reactions.`}
      backHref="/organic"
      backLabel="Organic Hub"
      maxWidth="7xl"
    >
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setSelectedCategory('all')
              }}
              placeholder="Search functional groups (e.g., alcohol, carbonyl, amine...)"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label="Search functional groups"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedCategory('all')
              setSearchQuery('')
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all' && !searchQuery
                ? 'bg-primary-500 text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:border-primary-400'
            }`}
          >
            All ({FUNCTIONAL_GROUPS.length})
          </button>
          {ALL_CATEGORIES.map(cat => {
            const catData = FUNCTIONAL_GROUP_CATEGORIES[cat]
            const count = getFunctionalGroupsByCategory(cat).length
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setSearchQuery('')
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'text-white'
                    : 'bg-card border border-border text-muted-foreground hover:border-primary-400'
                }`}
                style={
                  selectedCategory === cat
                    ? { backgroundColor: catData.color }
                    : undefined
                }
              >
                {catData.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredGroups.length} of {FUNCTIONAL_GROUPS.length} functional groups
        </p>

        {/* Groups Grid + Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-2 space-y-3">
            {filteredGroups.map(group => {
              const catData = FUNCTIONAL_GROUP_CATEGORIES[group.category]
              const isSelected = selectedGroup?.id === group.id
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(isSelected ? null : group)}
                  className={`w-full text-left rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-muted'
                      : 'border-border bg-card hover:border-primary-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-card-foreground">{group.name}</h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: catData.color }}
                        >
                          {catData.label}
                        </span>
                        {group.priority === 'high' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            Must Know
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-mono text-sm text-muted-foreground">
                        {group.generalFormula} — <span className="text-primary-600">{group.structure}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                    <div className="text-primary-500 shrink-0">
                      {isSelected ? '▼' : '▶'}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isSelected && (
                    <div
                      className="mt-4 pt-4 border-t border-border space-y-4"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Properties */}
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">Properties</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-card border border-border rounded-lg p-2">
                            <span className="text-muted-foreground">Polarity:</span>{' '}
                            <span className="font-medium text-foreground">{group.properties.polarity}</span>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-2">
                            <span className="text-muted-foreground">H-Bond Donor:</span>{' '}
                            <span className="font-medium text-foreground">
                              {group.properties.hBondDonor ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-2">
                            <span className="text-muted-foreground">H-Bond Acceptor:</span>{' '}
                            <span className="font-medium text-foreground">
                              {group.properties.hBondAcceptor ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-2">
                            <span className="text-muted-foreground">Solubility:</span>{' '}
                            <span className="font-medium text-foreground">{group.properties.solubility}</span>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-2">
                            <span className="text-muted-foreground">Acidity:</span>{' '}
                            <span className="font-medium text-foreground">{group.properties.acidity}</span>
                          </div>
                          <div className="bg-card border border-border rounded-lg p-2">
                            <span className="text-muted-foreground">BP Range:</span>{' '}
                            <span className="font-medium text-foreground">
                              {group.properties.typicalBoilingPoint}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Examples */}
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">Examples</h4>
                        <div className="flex flex-wrap gap-2">
                          {group.examples.map(ex => (
                            <div
                              key={ex.name}
                              className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs"
                            >
                              <span className="font-semibold text-foreground">{ex.name}</span>
                              <span className="text-muted-foreground ml-1">({ex.formula})</span>
                              <span className="text-primary-600 ml-1">{ex.iupac}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Spectroscopy */}
                      {(group.spectroscopy.ir || group.spectroscopy.nmrH || group.spectroscopy.nmrC) && (
                        <div>
                          <h4 className="font-semibold text-foreground text-sm mb-2">
                            Spectroscopy Signatures
                          </h4>
                          <div className="space-y-1 text-xs">
                            {group.spectroscopy.ir && (
                              <div className="bg-card border border-border rounded-lg px-3 py-1.5">
                                <span className="font-medium text-foreground">IR:</span>{' '}
                                <span className="text-muted-foreground">{group.spectroscopy.ir}</span>
                              </div>
                            )}
                            {group.spectroscopy.nmrH && (
                              <div className="bg-card border border-border rounded-lg px-3 py-1.5">
                                <span className="font-medium text-foreground">¹H NMR:</span>{' '}
                                <span className="text-muted-foreground">{group.spectroscopy.nmrH}</span>
                              </div>
                            )}
                            {group.spectroscopy.nmrC && (
                              <div className="bg-card border border-border rounded-lg px-3 py-1.5">
                                <span className="font-medium text-foreground">¹³C NMR:</span>{' '}
                                <span className="text-muted-foreground">{group.spectroscopy.nmrC}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Common Reactions */}
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-2">
                          Common Reactions
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {group.commonReactions.map(r => (
                            <span
                              key={r}
                              className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Related Groups */}
                      {group.relatedGroups.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-foreground text-sm mb-2">
                            Related Groups
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {group.relatedGroups.map(rg => {
                              const related = FUNCTIONAL_GROUPS.find(g => g.id === rg)
                              return (
                                <button
                                  key={rg}
                                  onClick={() => {
                                    const found = FUNCTIONAL_GROUPS.find(g => g.id === rg)
                                    if (found) setSelectedGroup(found)
                                  }}
                                  className="text-xs px-2 py-1 bg-muted text-foreground border border-border rounded-full hover:bg-card transition-colors"
                                >
                                  {related?.name || rg}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}

            {filteredGroups.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No functional groups found</p>
                <p className="text-sm mt-1">Try a different search term or category</p>
              </div>
            )}
          </div>

          {/* Sidebar: Quick Reference */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Category Summary */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3">Categories</h3>
                <div className="space-y-2">
                  {ALL_CATEGORIES.map(cat => {
                    const catData = FUNCTIONAL_GROUP_CATEGORIES[cat]
                    const count = getFunctionalGroupsByCategory(cat).length
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat)
                          setSearchQuery('')
                        }}
                        className="w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: catData.color }}
                          />
                          <span className="text-foreground">{catData.label}</span>
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Priority Legend */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3">Priority Guide</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">
                      Must Know
                    </span>
                    <span className="text-muted-foreground">Exam essential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs">
                      Medium
                    </span>
                    <span className="text-muted-foreground">Important</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                      Low
                    </span>
                    <span className="text-muted-foreground">Advanced/Specialty</span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3">Next Steps</h3>
                <div className="space-y-2">
                  <Link
                    href="/organic/reactions"
                    className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    → Named Reactions Browser
                  </Link>
                  <Link
                    href="/organic/predict"
                    className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    → Reaction Predictor
                  </Link>
                  <Link
                    href="/organic"
                    className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    → Organic Chemistry Hub
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
    </CalcShell>
  )
}
