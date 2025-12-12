'use client'

// VerChem - Interactive Periodic Table Page

import { useState, useRef } from 'react'
import PeriodicTableGrid from '@/components/periodic-table/PeriodicTableGrid'
import ElementModal from '@/components/periodic-table/ElementModal'
import type { Element } from '@/lib/types/chemistry'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'
import Link from 'next/link'
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
    <div className="min-h-screen hero-gradient-premium">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center animate-float-premium shadow-lg">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-premium">VerChem</span>
              </h1>
              <p className="text-xs text-muted-foreground">Periodic Table</p>
            </div>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-muted-foreground hover:text-primary-600 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="badge-premium mb-4">⚛️ 118 Elements • Complete Data</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-premium">Interactive</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-secondary-600 to-pink-600 bg-clip-text text-transparent">
              Periodic Table
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Click any element to explore its properties in detail
          </p>
        </div>

        {/* Search and Filters */}
        <div className="premium-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Elements
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, symbol, or atomic number..."
                className="input-premium w-full"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
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
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Total Elements:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">
                {totalElements}
              </span>
            </div>
            {searchQuery && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Matching:</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
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
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Export Table:</span>
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
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Advanced Export
            </button>
          </div>
        </div>

        {/* Periodic Table Grid */}
        {/* Mobile-responsive: horizontal scroll with hint indicator */}
        <div className="relative">
          {/* Mobile scroll hint */}
          <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="bg-gradient-to-l from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 w-12 h-full absolute right-0" />
            <span className="text-xs text-muted-foreground bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-full animate-pulse">
              Scroll →
            </span>
          </div>
          <div ref={tableContainerRef} className="premium-card p-4 md:p-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <PeriodicTableGrid
              onElementClick={setSelectedElement}
              highlightCategory={highlightCategory}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Category Stats */}
        <div className="mt-6 premium-card p-6">
          <h2 className="text-xl font-bold mb-4">Elements by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categoryCounts.map((cat) => (
              <button
                key={cat.value}
                onClick={() =>
                  setHighlightCategory(
                    highlightCategory === cat.value ? null : cat.value
                  )
                }
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105 ${
                  highlightCategory === cat.value
                    ? 'border-primary-500 bg-primary-50 scale-105'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-surface-hover'
                }`}
              >
                <div className="text-2xl font-bold text-gray-900">
                  {cat.count}
                </div>
                <div className="text-sm text-gray-600 mt-1">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">118</div>
            <div className="text-blue-100 mb-2">Complete Elements</div>
            <div className="text-sm text-blue-100">
              All elements from Hydrogen to Oganesson with complete data
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">15+</div>
            <div className="text-purple-100 mb-2">Properties Each</div>
            <div className="text-sm text-purple-100">
              Atomic mass, electron configuration, physical properties, and more
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-6">
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-pink-100 mb-2">Interactive</div>
            <div className="text-sm text-pink-100">
              Click, search, filter, and explore elements in real-time
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 premium-card p-6 bg-primary-50/50 border-2 border-primary-200">
          <h3 className="text-lg font-bold mb-3 text-primary-600 flex items-center gap-2">
            <span>💡</span> How to Use
          </h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
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
                className="w-5 h-5 text-blue-600"
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
                className="w-5 h-5 text-blue-600"
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
                className="w-5 h-5 text-blue-600"
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
        </div>
      </main>

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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 backdrop-blur-md mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>VerChem Periodic Table • Built with ❤️ for chemistry students worldwide</p>
          <p className="mt-2 text-xs">
            Data validated against NIST and PubChem databases
          </p>
        </div>
      </footer>
    </div>
  )
}
