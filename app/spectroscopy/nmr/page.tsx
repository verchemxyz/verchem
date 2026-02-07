'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  PROTON_NMR_SHIFTS,
  CARBON_NMR_SHIFTS,
  NMR_SOLVENTS,
  identifyProtonShift,
  identifyCarbonShift,
  searchNMR,
} from '@/lib/data/spectroscopy/nmr-data'
import type { NMRShift, NMRSolvent } from '@/lib/data/spectroscopy/nmr-data'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type NMRTab = 'proton' | 'carbon'

const PROTON_REGIONS: { label: string; min: number; max: number; color: string }[] = [
  { label: 'Alkyl', min: 0, max: 2, color: '#059669' },
  { label: 'Allylic / \u03B1-CO', min: 2, max: 3, color: '#0891B2' },
  { label: 'C-O / C-N', min: 3, max: 5, color: '#2563EB' },
  { label: 'Vinyl', min: 5, max: 6.5, color: '#7C3AED' },
  { label: 'Aromatic', min: 6.5, max: 8.5, color: '#DC2626' },
  { label: 'CHO', min: 8.5, max: 10, color: '#D97706' },
  { label: 'COOH / Chelated', min: 10, max: 14, color: '#BE185D' },
]

const CARBON_REGIONS: { label: string; min: number; max: number; color: string }[] = [
  { label: 'Alkyl (sp3)', min: 0, max: 50, color: '#059669' },
  { label: 'C-N / C-O', min: 50, max: 100, color: '#2563EB' },
  { label: 'Alkene / Aromatic', min: 100, max: 160, color: '#7C3AED' },
  { label: 'C=O (ester/acid/amide)', min: 160, max: 190, color: '#D97706' },
  { label: 'C=O (aldehyde/ketone)', min: 190, max: 220, color: '#DC2626' },
]

const PROTON_QUICK_EXAMPLES = [
  { label: '7.26 (CDCl\u2083)', value: '7.26' },
  { label: '2.17 (acetone)', value: '2.17' },
  { label: '9.8 (aldehyde)', value: '9.8' },
  { label: '3.67 (methoxy)', value: '3.67' },
  { label: '11.5 (COOH)', value: '11.5' },
]

const CARBON_QUICK_EXAMPLES = [
  { label: '77 (CDCl\u2083)', value: '77' },
  { label: '206 (ketone C=O)', value: '206' },
  { label: '128 (benzene)', value: '128' },
  { label: '170 (ester C=O)', value: '170' },
  { label: '21 (methyl)', value: '21' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    'Shielded / Reference': '#6B7280',
    Alkyl: '#059669',
    Unsaturated: '#7C3AED',
    'Carbonyl-adjacent': '#D97706',
    'Aromatic-adjacent': '#0891B2',
    Exchangeable: '#BE185D',
    'Heteroatom-adjacent': '#2563EB',
    Aromatic: '#DC2626',
    Carbonyl: '#D97706',
  }
  return map[cat] ?? '#6B7280'
}

// ---------------------------------------------------------------------------
// Component: ShiftResults
// ---------------------------------------------------------------------------

function ShiftResults({
  ppm,
  matches,
  type,
}: {
  ppm: number
  matches: NMRShift[]
  type: NMRTab
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-semibold text-card-foreground mb-2">
        {ppm.toFixed(2)} ppm ({type === 'proton' ? '\u00B9H' : '\u00B9\u00B3C'})
        &mdash;{' '}
        {matches.length === 0 ? (
          <span className="text-muted-foreground font-normal">
            No matches found
          </span>
        ) : (
          <span className="text-violet-600">
            {matches.length} possible environment
            {matches.length !== 1 ? 's' : ''}
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
                  {m.environment}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                  {m.category}
                </span>
                {m.multiplicity && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {m.multiplicity}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Range:</strong> {m.chemicalShiftMin.toFixed(1)}&ndash;
                {m.chemicalShiftMax.toFixed(1)} ppm
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {m.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Examples:</strong> {m.commonExamples.join('; ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component: ChemicalShiftScale
// ---------------------------------------------------------------------------

function ChemicalShiftScale({
  regions,
  maxPpm,
  inputPpm,
}: {
  regions: { label: string; min: number; max: number; color: string }[]
  maxPpm: number
  inputPpm: number | null
}) {
  const ticks = useMemo(() => {
    const arr: number[] = []
    const step = maxPpm <= 20 ? 2 : 20
    for (let i = 0; i <= maxPpm; i += step) arr.push(i)
    return arr
  }, [maxPpm])

  return (
    <div className="relative w-full">
      {/* Tick marks */}
      <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* Scale bar */}
      <div className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full relative overflow-hidden">
        {regions.map((r) => (
          <div
            key={r.label}
            className="absolute h-full"
            style={{
              left: `${(r.min / maxPpm) * 100}%`,
              width: `${((r.max - r.min) / maxPpm) * 100}%`,
              backgroundColor: r.color,
              opacity: 0.65,
            }}
            title={`${r.label}: ${r.min}-${r.max} ppm`}
          />
        ))}

        {/* Input marker */}
        {inputPpm !== null &&
          inputPpm >= 0 &&
          inputPpm <= maxPpm && (
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground z-10"
              style={{ left: `${(inputPpm / maxPpm) * 100}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground whitespace-nowrap bg-background px-1 rounded">
                {inputPpm.toFixed(1)}
              </div>
            </div>
          )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        {regions.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: r.color }}
            />
            <span className="text-muted-foreground">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component: SolventTable
// ---------------------------------------------------------------------------

function SolventTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-white/5 text-left">
            <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
              Solvent
            </th>
            <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
              Formula
            </th>
            <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
              \u00B9H (ppm)
            </th>
            <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
              \u00B9\u00B3C (ppm)
            </th>
            <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden md:table-cell">
              BP (\u00B0C)
            </th>
            <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden lg:table-cell">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {NMR_SOLVENTS.map((s: NMRSolvent) => (
            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
              <td className="px-4 py-2 font-medium text-card-foreground">
                {s.name}
              </td>
              <td className="px-4 py-2 font-mono text-muted-foreground">
                {s.formula}
              </td>
              <td className="px-4 py-2 font-mono text-violet-600 font-semibold">
                {s.protonShift !== null ? s.protonShift.toFixed(2) : '\u2014'}
              </td>
              <td className="px-4 py-2 font-mono text-violet-600 font-semibold">
                {s.carbonShift !== null ? s.carbonShift.toFixed(2) : '\u2014'}
              </td>
              <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">
                {s.boilingPoint !== null ? `${s.boilingPoint}` : '\u2014'}
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground hidden lg:table-cell max-w-xs">
                {s.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NMRSpectroscopyPage() {
  const [activeTab, setActiveTab] = useState<NMRTab>('proton')
  const [ppmInput, setPpmInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [shiftResults, setShiftResults] = useState<NMRShift[]>([])
  const [searchResults, setSearchResults] = useState<NMRShift[]>([])
  const [currentPpm, setCurrentPpm] = useState<number | null>(null)
  const [hasIdentified, setHasIdentified] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleIdentify = useCallback(() => {
    const val = parseFloat(ppmInput)
    if (isNaN(val)) {
      setShiftResults([])
      setCurrentPpm(null)
      setHasIdentified(false)
      return
    }
    const results =
      activeTab === 'proton'
        ? identifyProtonShift(val)
        : identifyCarbonShift(val)
    setShiftResults(results)
    setCurrentPpm(val)
    setHasIdentified(true)
  }, [ppmInput, activeTab])

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }
    setSearchResults(searchNMR(searchQuery))
    setHasSearched(true)
  }, [searchQuery])

  const handleQuickExample = useCallback(
    (value: string) => {
      setPpmInput(value)
      const val = parseFloat(value)
      if (isNaN(val)) return
      const results =
        activeTab === 'proton'
          ? identifyProtonShift(val)
          : identifyCarbonShift(val)
      setShiftResults(results)
      setCurrentPpm(val)
      setHasIdentified(true)
    },
    [activeTab]
  )

  const handleTabSwitch = useCallback((tab: NMRTab) => {
    setActiveTab(tab)
    setShiftResults([])
    setCurrentPpm(null)
    setHasIdentified(false)
    setPpmInput('')
  }, [])

  const quickExamples =
    activeTab === 'proton' ? PROTON_QUICK_EXAMPLES : CARBON_QUICK_EXAMPLES
  const scaleRegions =
    activeTab === 'proton' ? PROTON_REGIONS : CARBON_REGIONS
  const scaleMax = activeTab === 'proton' ? 14 : 220

  const allShifts = useMemo(
    () => (activeTab === 'proton' ? PROTON_NMR_SHIFTS : CARBON_NMR_SHIFTS),
    [activeTab]
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4">
            Nuclear Magnetic Resonance
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">
            NMR Chemical Shift Analyzer
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Look up proton and carbon chemical shifts to identify molecular
            environments. Includes visual scale and solvent reference table.
          </p>
        </section>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => handleTabSwitch('proton')}
              className={`px-6 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === 'proton'
                  ? 'bg-violet-600 text-white'
                  : 'bg-card text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              \u00B9H NMR (Proton)
            </button>
            <button
              onClick={() => handleTabSwitch('carbon')}
              className={`px-6 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === 'carbon'
                  ? 'bg-violet-600 text-white'
                  : 'bg-card text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              \u00B9\u00B3C NMR (Carbon)
            </button>
          </div>
        </div>

        {/* Visual Chemical Shift Scale */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-sm font-bold text-card-foreground mb-3">
            {activeTab === 'proton' ? '\u00B9H' : '\u00B9\u00B3C'} Chemical
            Shift Scale (ppm)
          </h3>
          <ChemicalShiftScale
            regions={scaleRegions}
            maxPpm={scaleMax}
            inputPpm={currentPpm}
          />
        </section>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Shift Identification */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-1">
              Chemical Shift Lookup
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a chemical shift value in ppm to identify possible
              environments.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={ppmInput}
                onChange={(e) => setPpmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleIdentify()
                }}
                placeholder={
                  activeTab === 'proton'
                    ? 'e.g. 7.26, 2.17, 9.8'
                    : 'e.g. 77, 128, 206'
                }
                className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <button
                onClick={handleIdentify}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium text-sm hover:bg-violet-700 transition-colors flex-shrink-0"
              >
                Identify
              </button>
            </div>

            {/* Quick examples */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-muted-foreground py-1">Try:</span>
              {quickExamples.map((ex) => (
                <button
                  key={ex.value}
                  onClick={() => handleQuickExample(ex.value)}
                  className="text-xs px-3 py-1 rounded-full border border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Results */}
            {hasIdentified && currentPpm !== null && (
              <div className="max-h-[500px] overflow-y-auto pr-1">
                <ShiftResults
                  ppm={currentPpm}
                  matches={shiftResults}
                  type={activeTab}
                />
              </div>
            )}
          </section>

          {/* Environment Search */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-card-foreground mb-1">
              Environment Search
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Search by environment name, description, or example compound
              across both \u00B9H and \u00B9\u00B3C data.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
                placeholder="e.g. aromatic, aldehyde, methoxy, benzene"
                className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <button
                onClick={handleSearch}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium text-sm hover:bg-violet-700 transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-muted-foreground py-1">
                Popular:
              </span>
              {['aromatic', 'carbonyl', 'methyl', 'aldehyde', 'alcohol', 'vinyl'].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchQuery(term)
                      setSearchResults(searchNMR(term))
                      setHasSearched(true)
                    }}
                    className="text-xs px-3 py-1 rounded-full border border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors"
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
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">
                    No matching environments found.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white/50 dark:bg-white/5 border border-border rounded-lg px-4 py-3"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 hidden sm:block"
                          style={{ backgroundColor: categoryColor(r.category) }}
                        />
                        <div className="flex-grow min-w-0">
                          <span className="font-semibold text-sm text-card-foreground">
                            {r.environment}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({r.category})
                          </span>
                        </div>
                        <span className="text-sm font-mono font-semibold text-violet-600 flex-shrink-0">
                          {r.chemicalShiftMin.toFixed(1)}&ndash;
                          {r.chemicalShiftMax.toFixed(1)} ppm
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Complete Shift Table */}
        <section className="bg-card border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-card-foreground mb-1">
            {activeTab === 'proton' ? '\u00B9H' : '\u00B9\u00B3C'} Chemical
            Shift Reference Table
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete list of{' '}
            {activeTab === 'proton' ? 'proton' : 'carbon-13'} chemical shift
            ranges and their assignments.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-left">
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Environment
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Range (ppm)
                  </th>
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground">
                    Category
                  </th>
                  {activeTab === 'proton' && (
                    <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden md:table-cell">
                      Multiplicity
                    </th>
                  )}
                  <th className="px-4 py-2 font-semibold text-xs text-muted-foreground hidden lg:table-cell">
                    Examples
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allShifts.map((s: NMRShift) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-2 font-medium text-card-foreground">
                      {s.environment}
                    </td>
                    <td className="px-4 py-2 font-mono text-violet-600 font-semibold">
                      {s.chemicalShiftMin.toFixed(1)}&ndash;
                      {s.chemicalShiftMax.toFixed(1)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: categoryColor(s.category) + '20',
                          color: categoryColor(s.category),
                        }}
                      >
                        {s.category}
                      </span>
                    </td>
                    {activeTab === 'proton' && (
                      <td className="px-4 py-2 text-muted-foreground text-xs hidden md:table-cell">
                        {s.multiplicity ?? '\u2014'}
                      </td>
                    )}
                    <td className="px-4 py-2 text-muted-foreground text-xs hidden lg:table-cell max-w-xs truncate">
                      {s.commonExamples.join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Solvent Table */}
        <section className="bg-card border border-border rounded-xl p-6 mb-10">
          <h3 className="text-lg font-bold text-card-foreground mb-1">
            Common NMR Solvents
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Residual solvent peaks for proton and carbon NMR. Knowing these
            helps avoid misassignment.
          </p>
          <SolventTable />
        </section>

        {/* Footer */}
        <section className="text-center">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/spectroscopy/ir"
              className="text-violet-600 hover:underline font-medium"
            >
              &larr; IR Interpreter
            </Link>
            {' '}&middot;{' '}
            <Link
              href="/spectroscopy"
              className="text-violet-600 hover:underline font-medium"
            >
              Spectroscopy Hub
            </Link>
            {' '}&middot;{' '}
            <Link
              href="/spectroscopy/mass-spec"
              className="text-violet-600 hover:underline font-medium"
            >
              Mass Spec Analyzer &rarr;
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
