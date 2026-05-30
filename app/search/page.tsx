// VerChem Advanced Search Page
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '../../components/search/SearchBar'
import { SearchResults } from '../../components/search/SearchResults'
import { SearchBookmarks } from '../../components/search/SearchBookmarks'
import { SearchHistory } from '../../components/search/SearchHistory'
import { useSearch } from '../../lib/search/context'
import { CommandPalette } from '../../components/search/CommandPalette'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const { results, isSearching, searchHistory, bookmarks, search } = useSearch()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'bookmarks'>('search')

  const initialQuery = searchParams.get('q') ?? ''

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleQuickSearch = (query: string) => {
    search(query)
    setActiveTab('search')
  }

  // Run initial search when navigated from global search bar
  useEffect(() => {
    if (initialQuery) {
      requestAnimationFrame(() => {
        search(initialQuery)
        setActiveTab('search')
      })
    }
  }, [initialQuery, search])

  const QUICK_ACCESS = [
    'periodic table',
    'molecular weight',
    'stoichiometry',
    'equation balancer',
    'gas laws',
    'thermodynamics',
  ]

  const tabClass = (tab: typeof activeTab) =>
    `w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      activeTab === tab
        ? 'bg-primary-500/10 text-primary-700'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-500 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
            <div className="text-center mb-8">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Search · All content
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                Advanced Search
              </h1>
              <p className="text-lg text-muted-foreground">
                Search across all VerChem content: compounds, elements, calculators, and help
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono">Ctrl+K</kbd> for quick access
              </div>
            </div>

            {/* Main search bar */}
            <div className="max-w-4xl mx-auto">
              <SearchBar
                placeholder="Search compounds, elements, calculators, help..."
                showFilters={true}
                autoFocus={true}
                initialQuery={initialQuery}
                className="mb-4"
              />
            </div>

            {/* Quick access buttons */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {QUICK_ACCESS.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleQuickSearch(label)}
                    className="px-3 py-1 text-sm bg-muted border border-border text-muted-foreground rounded-full hover:bg-primary-500/10 hover:text-primary-700 hover:border-primary-500/40 transition-colors capitalize"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-lg border border-border p-4">
              {/* Navigation tabs */}
              <nav className="space-y-1 mb-6">
                <button onClick={() => setActiveTab('search')} className={tabClass('search')}>
                  Search Results
                </button>
                <button onClick={() => setActiveTab('history')} className={tabClass('history')}>
                  Search History
                </button>
                <button onClick={() => setActiveTab('bookmarks')} className={tabClass('bookmarks')}>
                  Bookmarks
                </button>
              </nav>

              {/* Search tips */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">Search Tips</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Exact phrases:</span> Use quotes
                    <br />
                    &quot;sodium chloride&quot;
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Exclude terms:</span> Use NOT
                    <br />acid NOT organic
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Ranges:</span> Use colons
                    <br />MW:100-200
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Voice search:</span> Use the microphone in the search bar
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            {activeTab === 'search' && (
              <div>
                {isSearching ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : results.length > 0 ? (
                  <SearchResults
                    results={results}
                    showExport={true}
                    showSorting={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground mb-4">
                      <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Start your search
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Enter a search query above to find compounds, elements, calculators, and help content.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>Try searching for:</p>
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {['water', 'NaCl', 'molecular weight', 'periodic table'].map((label) => (
                          <button
                            key={label}
                            onClick={() => handleQuickSearch(label)}
                            className="px-3 py-1 bg-muted border border-border text-muted-foreground rounded-full hover:bg-primary-500/10 hover:text-primary-700 hover:border-primary-500/40 transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <SearchHistory
                history={searchHistory}
                onSearchClick={(query) => {
                  handleQuickSearch(query)
                  setActiveTab('search')
                }}
              />
            )}

            {activeTab === 'bookmarks' && (
              <SearchBookmarks
                bookmarks={bookmarks}
                onSearchClick={(query, filters) => {
                  search(query, filters)
                  setActiveTab('search')
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onSearch={(query) => {
            handleQuickSearch(query)
            setShowCommandPalette(false)
          }}
        />
      )}
    </div>
  )
}
