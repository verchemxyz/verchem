'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  IR_ABSORPTIONS,
  IR_CATEGORIES,
  identifyIRPeaks,
  searchIRByFunctionalGroup,
} from '@/lib/data/spectroscopy/ir-data'
import type { IRAbsorption, IRCategory } from '@/lib/data/spectroscopy/ir-data'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function intensityBadge(intensity: string): string {
  switch (intensity) {
    case 'strong':
      return 'bg-red-100 text-red-700'
    case 'medium':
      return 'bg-amber-100 text-amber-700'
    case 'weak':
      return 'bg-gray-100 text-gray-600'
    case 'variable':
      return 'bg-blue-100 text-blue-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function categoryColor(categoryKey: string): string {
  return IR_CATEGORIES[categoryKey]?.color ?? '#6B7280'
}

// ---------------------------------------------------------------------------
// Quick examples
// ---------------------------------------------------------------------------

const QUICK_EXAMPLES = [
  { label: 'Alcohol (3350, 1050)', value: '3350, 1050' },
  { label: 'Ketone (1715, 2950)', value: '1715, 2950' },
  { label: 'Amine (3400, 1600)', value: '3400, 1600' },
  { label: 'Nitrile (2230)', value: '2230' },
  { label: 'Carboxylic acid (2900, 1710)', value: '2900, 1710' },
]

// ---------------------------------------------------------------------------
// Component: PeakResults
// ---------------------------------------------------------------------------

function PeakResults({
  wavenumber,
  matches,
}: {
  wavenumber: number
  matches: IRAbsorption[]
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-semibold text-card-foreground mb-2">
        {wavenumber} cm&sup1;&nbsp;&mdash;{' '}
        {matches.length === 0 ? (
          <span className="text-muted-foreground font-normal">
            No matches found
          </span>
        ) : (
          <span className="text-teal-600">
            {matches.length} possible assignment{matches.length !== 1 ? 's' : ''}
          </span>
        )}
      </h4>

      {matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="pl-3 border-l-4 rounded-r-md bg-white/50 dark:bg-white/5 p-3"
              style={{ borderColor: categoryColor(m.category) }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-card-foreground">
                  {m.functionalGroup}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${intensityBadge(m.intensity)}`}
                >
                  {m.intensity}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {m.bandShape}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Range:</strong> {m.wavenumberMin}&ndash;{m.wavenumberMax}{' '}
                cm&sup1; &middot; <strong>Bond:</strong> {m.bond} &middot;{' '}
                <strong>Type:</strong> {m.vibrationType}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Examples:</strong> {m.examples.join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component: SearchResults
// ---------------------------------------------------------------------------

function SearchResults({ results }: { results: IRAbsorption[] }) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4">
        No matching functional groups found.
      </p>
    )
  }

  return (
    <div className="space-y-2 mt-3">
      {results.map((r) => (
        <div
          key={r.id}
          className="flex flex-col sm:flex-row sm:items-center gap-2 bg-card border border-border rounded-lg px-4 py-3"
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 hidden sm:block"
            style={{ backgroundColor: categoryColor(r.category) }}
          />
          <div className="flex-grow min-w-0">
            <span className="font-semibold text-sm text-card-foreground">
              {r.functionalGroup}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({r.bond}, {r.vibrationType})
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-mono font-semibold text-teal-600">
              {r.wavenumberMin}&ndash;{r.wavenumberMax} cm&sup1;
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${intensityBadge(r.intensity)}`}
            >
              {r.intensity}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component: Reference Table
// ---------------------------------------------------------------------------

function ReferenceTable() {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({})

  const categories = useMemo(() => Object.values(IR_CATEGORIES), [])

  const toggleCategory = useCallback((key: string) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const absorptionsByCategory = useMemo(() => {
    const map: Record<string, IRAbsorption[]> = {}
    for (const cat of categories) {
      map[cat.key] = IR_ABSORPTIONS.filter((a) => a.category === cat.key)
    }
    return map
  }, [categories])

  return (
    <div className="space-y-2">
      {categories.map((cat: IRCategory) => {
        const items = absorptionsByCategory[cat.key]
        const isOpen = expandedCategories[cat.key] ?? false

        return (
          <div
            key={cat.key}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(cat.key)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <span className="font-semibold text-sm text-card-foreground">
                    {cat.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({items.length} entries)
                  </span>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              <div className="border-t border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 text-left">
                        <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                          Functional Group
                        </th>
                        <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                          Bond
                        </th>
                        <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                          Range (cm&sup1;)
                        </th>
                        <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                          Intensity
                        </th>
                        <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden lg:table-cell">
                          Shape
                        </th>
                        <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden xl:table-cell">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-4 py-2 text-card-foreground font-medium">
                            {a.functionalGroup}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground font-mono">
                            {a.bond}
                          </td>
                          <td className="px-4 py-2 text-teal-600 font-mono font-semibold">
                            {a.wavenumberMin}&ndash;{a.wavenumberMax}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${intensityBadge(a.intensity)}`}
                            >
                              {a.intensity}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground text-xs hidden lg:table-cell">
                            {a.bandShape}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground text-xs hidden xl:table-cell max-w-xs truncate">
                            {a.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IRSpectroscopyPage() {
  const [peakInput, setPeakInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [peakResults, setPeakResults] = useState<
    { wavenumber: number; matches: IRAbsorption[] }[]
  >([])
  const [searchResults, setSearchResults] = useState<IRAbsorption[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [hasIdentified, setHasIdentified] = useState(false)

  const handleIdentify = useCallback(() => {
    const raw = peakInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0)

    if (raw.length === 0) {
      setPeakResults([])
      setHasIdentified(false)
      return
    }

    const results = raw.map((wn) => ({
      wavenumber: wn,
      matches: identifyIRPeaks(wn),
    }))

    setPeakResults(results)
    setHasIdentified(true)
  }, [peakInput])

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }
    setSearchResults(searchIRByFunctionalGroup(searchQuery))
    setHasSearched(true)
  }, [searchQuery])

  const handleQuickExample = useCallback(
    (value: string) => {
      setPeakInput(value)
      const raw = value
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0)

      const results = raw.map((wn) => ({
        wavenumber: wn,
        matches: identifyIRPeaks(wn),
      }))
      setPeakResults(results)
      setHasIdentified(true)
    },
    []
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="VerChem Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/spectroscopy"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              &larr; Spectroscopy Hub
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Title */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
            Infrared Spectroscopy
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            IR Spectrum Interpreter
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Enter observed wavenumber peaks to identify functional groups, or
            search by group name to find characteristic absorption ranges.
          </p>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Peak Identification */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-1">
              Peak Identification
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter one or more wavenumber values (cm&sup1;), comma-separated.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={peakInput}
                onChange={(e) => setPeakInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleIdentify()
                }}
                placeholder="e.g. 3350, 1715, 2950"
                className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={handleIdentify}
                className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors flex-shrink-0"
              >
                Identify
              </button>
            </div>

            {/* Quick examples */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-muted-foreground py-1">
                Try:
              </span>
              {QUICK_EXAMPLES.map((ex) => (
                <button
                  key={ex.value}
                  onClick={() => handleQuickExample(ex.value)}
                  className="text-xs px-3 py-1 rounded-full border border-teal-300 text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Results */}
            {hasIdentified && (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {peakResults.map((pr) => (
                  <PeakResults
                    key={pr.wavenumber}
                    wavenumber={pr.wavenumber}
                    matches={pr.matches}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Functional Group Search */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-1">
              Functional Group Search
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Type a functional group name, bond type, or keyword to find the
              expected IR absorption range.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
                placeholder="e.g. ketone, C=O, amine, aldehyde"
                className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={handleSearch}
                className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-muted-foreground py-1">
                Popular:
              </span>
              {['ketone', 'amine', 'alcohol', 'ester', 'nitrile', 'nitro'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term)
                      setSearchResults(searchIRByFunctionalGroup(term))
                      setHasSearched(true)
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-teal-300 text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    {term}
                  </button>
                )
              )}
            </div>

            {hasSearched && (
              <div className="max-h-[500px] overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground mb-2">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? 's' : ''} for &ldquo;
                  {searchQuery}&rdquo;
                </p>
                <SearchResults results={searchResults} />
              </div>
            )}
          </section>
        </div>

        {/* IR Quick Reference Chart */}
        <section className="mb-12">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-2">
              IR Absorption Regions Quick Reference
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visual overview of major absorption regions from 4000 to 400 cm&sup1;.
            </p>
            <div className="relative w-full h-auto">
              {/* Scale bar */}
              <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
                <span>4000</span>
                <span>3500</span>
                <span>3000</span>
                <span>2500</span>
                <span>2000</span>
                <span>1500</span>
                <span>1000</span>
                <span>500</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
                {/* O-H / N-H region */}
                <div
                  className="absolute h-full rounded-l"
                  style={{
                    left: `${((4000 - 3600) / 3600) * 100}%`,
                    width: `${(600 / 3600) * 100}%`,
                    backgroundColor: '#2563EB',
                    opacity: 0.7,
                  }}
                  title="O-H / N-H Stretch (3000-3600)"
                />
                {/* C-H stretch */}
                <div
                  className="absolute h-full"
                  style={{
                    left: `${((4000 - 3100) / 3600) * 100}%`,
                    width: `${(250 / 3600) * 100}%`,
                    backgroundColor: '#059669',
                    opacity: 0.7,
                  }}
                  title="C-H Stretch (2850-3100)"
                />
                {/* Triple bond */}
                <div
                  className="absolute h-full"
                  style={{
                    left: `${((4000 - 2260) / 3600) * 100}%`,
                    width: `${(160 / 3600) * 100}%`,
                    backgroundColor: '#DC2626',
                    opacity: 0.7,
                  }}
                  title="Triple Bonds (2100-2260)"
                />
                {/* Carbonyl */}
                <div
                  className="absolute h-full"
                  style={{
                    left: `${((4000 - 1830) / 3600) * 100}%`,
                    width: `${(200 / 3600) * 100}%`,
                    backgroundColor: '#D97706',
                    opacity: 0.7,
                  }}
                  title="C=O Stretch (1630-1830)"
                />
                {/* C=C */}
                <div
                  className="absolute h-full"
                  style={{
                    left: `${((4000 - 1680) / 3600) * 100}%`,
                    width: `${(230 / 3600) * 100}%`,
                    backgroundColor: '#0891B2',
                    opacity: 0.7,
                  }}
                  title="C=C / Aromatic (1450-1680)"
                />
                {/* Fingerprint */}
                <div
                  className="absolute h-full rounded-r"
                  style={{
                    left: `${((4000 - 1300) / 3600) * 100}%`,
                    width: `${(900 / 3600) * 100}%`,
                    backgroundColor: '#4B5563',
                    opacity: 0.4,
                  }}
                  title="Fingerprint Region (400-1300)"
                />
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                {[
                  { label: 'O-H / N-H', color: '#2563EB' },
                  { label: 'C-H', color: '#059669' },
                  { label: 'Triple bonds', color: '#DC2626' },
                  { label: 'C=O', color: '#D97706' },
                  { label: 'C=C / Ar', color: '#0891B2' },
                  { label: 'Fingerprint', color: '#4B5563' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Full Reference Table */}
        <section className="mb-10">
          <h3 className="text-xl font-bold text-foreground mb-4">
            Complete IR Correlation Table
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click a category to expand and view all entries. Data sourced from
            Silverstein, Pavia, and SDBS references.
          </p>
          <ReferenceTable />
        </section>

        {/* Footer */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/spectroscopy"
              className="text-teal-600 hover:underline font-medium"
            >
              &larr; Spectroscopy Hub
            </Link>
            {' '}&middot;{' '}
            <Link
              href="/spectroscopy/nmr"
              className="text-teal-600 hover:underline font-medium"
            >
              NMR Analyzer &rarr;
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
