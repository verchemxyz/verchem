'use client'

// VerChem - Interactive Periodic Table Page

import { useState, useRef } from 'react'
import PeriodicTableGrid from '@/components/periodic-table/PeriodicTableGrid'
import ElementModal from '@/components/periodic-table/ElementModal'
import type { Element } from '@/lib/types/chemistry'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import { CalcShell, Card, SectionTitle, Field } from '@/components/lab'
import { ExportButton, ExportDialog } from '@/components/export'

export default function PeriodicTablePage() {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null)
  const [highlightCategory, setHighlightCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const categories = [
    { value: 'alkali-metal', label: 'Alkali Metals' },
    { value: 'alkaline-earth-metal', label: 'Alkaline Earth Metals' },
    { value: 'transition-metal', label: 'Transition Metals' },
    { value: 'post-transition-metal', label: 'Post-Transition Metals' },
    { value: 'metalloid', label: 'Metalloids' },
    { value: 'nonmetal', label: 'Nonmetals' },
    { value: 'halogen', label: 'Halogens' },
    { value: 'noble-gas', label: 'Noble Gases' },
    { value: 'lanthanide', label: 'Lanthanides' },
    { value: 'actinide', label: 'Actinides' },
  ]

  // Stats
  const totalElements = PERIODIC_TABLE.length
  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: PERIODIC_TABLE.filter((el) => el.category === cat.value).length,
  }))

  return (
    <CalcShell
      eyebrow="Reference data · 118 elements · NIST/IUPAC"
      title="Interactive Periodic Table"
      subtitle="Click any element to explore its properties in detail. Search, filter, and export the full table."
      backHref="/"
      backLabel="Home"
      maxWidth="7xl"
    >
      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Search */}
          <Field label="Search elements" htmlFor="element-search">
            <input
              id="element-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, symbol, or atomic number..."
              className="input-premium w-full"
            />
          </Field>

          {/* Category Filter */}
          <Field label="Filter by category" htmlFor="element-category">
            <select
              id="element-category"
              value={highlightCategory || ''}
              onChange={(e) =>
                setHighlightCategory(e.target.value || null)
              }
              className="input-premium w-full"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total Elements:</span>
            <span className="px-2 py-1 bg-muted text-foreground border border-border rounded font-bold font-mono">
              {totalElements}
            </span>
          </div>
          {searchQuery && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Matching:</span>
              <span className="px-2 py-1 bg-primary-500/10 text-primary-600 border border-primary-500/30 rounded font-bold font-mono">
                {
                  PERIODIC_TABLE.filter(
                    (el) =>
                      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      el.atomicNumber.toString().includes(searchQuery)
                  ).length
                }
              </span>
            </div>
          )}
        </div>

        {/* Export Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Export Table:</span>
            <ExportButton
              elementRef={tableContainerRef as React.RefObject<HTMLElement>}
              filename="periodic_table"
              variant="dropdown"
              label="Export"
              size="sm"
              defaultFormat="png"
              defaultQuality="ultra"
            />
          </div>

          <button
            onClick={() => setShowExportDialog(true)}
            className="px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Advanced Export
          </button>
        </div>
      </Card>

      {/* Periodic Table Grid */}
      {/* Mobile-responsive: horizontal scroll with hint indicator */}
      <div className="relative">
        {/* Mobile scroll hint */}
        <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="bg-gradient-to-l from-background via-background/80 to-transparent w-12 h-full absolute right-0" />
          <span className="text-xs text-muted-foreground bg-card/90 border border-border px-2 py-1 rounded-full">
            Scroll →
          </span>
        </div>
        <div ref={tableContainerRef} className="border border-border rounded-lg bg-card p-4 md:p-6 overflow-x-auto">
          <PeriodicTableGrid
            onElementClick={setSelectedElement}
            highlightCategory={highlightCategory}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {/* Category Stats */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Elements by category</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categoryCounts.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setHighlightCategory(
                  highlightCategory === cat.value ? null : cat.value
                )
              }
              className={`p-4 rounded-lg border transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                highlightCategory === cat.value
                  ? 'border-primary-500 bg-muted ring-1 ring-primary-500/40'
                  : 'border-border bg-card hover:border-primary-500/40 hover:bg-muted'
              }`}
            >
              <div className="text-2xl font-bold font-mono text-foreground">
                {cat.count}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{cat.label}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-3xl font-bold font-mono text-primary-600 mb-2">118</div>
          <div className="text-foreground font-medium mb-2">Complete Elements</div>
          <div className="text-sm text-muted-foreground">
            All elements from Hydrogen to Oganesson with complete data
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-3xl font-bold font-mono text-primary-600 mb-2">15+</div>
          <div className="text-foreground font-medium mb-2">Properties Each</div>
          <div className="text-sm text-muted-foreground">
            Atomic mass, electron configuration, physical properties, and more
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-3xl font-bold font-mono text-primary-600 mb-2">100%</div>
          <div className="text-foreground font-medium mb-2">Interactive</div>
          <div className="text-sm text-muted-foreground">
            Click, search, filter, and explore elements in real-time
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-6">
        <SectionTitle className="mb-3">How to use</SectionTitle>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Click</strong> any element to see detailed properties
            </span>
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Search</strong> by name, symbol, or atomic number
            </span>
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Filter</strong> by category to highlight specific groups
            </span>
          </li>
          <li className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Hover</strong> over elements to see their names
            </span>
          </li>
        </ul>
      </Card>

      {/* Element Modal */}
      {selectedElement && (
        <ElementModal
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          elementRef={tableContainerRef as React.RefObject<HTMLElement>}
          title="Export Periodic Table"
          defaultFilename="periodic_table"
          availableFormats={['png', 'svg', 'pdf']}
          showPreview={true}
        />
      )}

      {/* Footnote */}
      <p className="text-center text-xs text-muted-foreground">
        Data validated against NIST and PubChem databases.
      </p>
    </CalcShell>
  )
}
