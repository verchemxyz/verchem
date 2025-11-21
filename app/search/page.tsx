// VerChem Advanced Search Page
'use client'

import React, { useState, useEffect } from 'react'
import { SearchBar } from '../../components/search/SearchBar'
import { SearchResults } from '../../components/search/SearchResults'
import { SearchBookmarks } from '../../components/search/SearchBookmarks'
import { SearchHistory } from '../../components/search/SearchHistory'
import { useSearch } from '../../lib/search/context'
import { CommandPalette } from '../../components/search/CommandPalette'

interface SearchPageProps {
  searchParams?: {
    q?: string
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const { results, isSearching, searchHistory, bookmarks, search } = useSearch()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'bookmarks'>('search')

  const initialQuery = typeof searchParams?.q === 'string' ? searchParams.q : ''

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Advanced Search
              </h1>
              <p className="text-lg text-gray-600">
                Search across all VerChem content: compounds, elements, calculators, and help
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+K</kbd> for quick access
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
                <button
                  onClick={() => handleQuickSearch('periodic table')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  Periodic Table
                </button>
                <button
                  onClick={() => handleQuickSearch('molecular weight')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  Molecular Weight
                </button>
                <button
                  onClick={() => handleQuickSearch('stoichiometry')}
                  className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                >
                  Stoichiometry
                </button>
                <button
                  onClick={() => handleQuickSearch('equation balancer')}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
                >
                  Equation Balancer
                </button>
                <button
                  onClick={() => handleQuickSearch('gas laws')}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                >
                  Gas Laws
                </button>
                <button
                  onClick={() => handleQuickSearch('thermodynamics')}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                >
                  Thermodynamics
                </button>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* Navigation tabs */}
              <nav className="space-y-1 mb-6">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'search'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Search Results
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Search History
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'bookmarks'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Bookmarks
                </button>
              </nav>

              {/* Search tips */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Search Tips</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Exact phrases:</span> Use quotes
                    <br />
                    &quot;sodium chloride&quot;
                  </div>
                  <div>
                    <span className="font-medium">Exclude terms:</span> Use NOT
                    <br />acid NOT organic
                  </div>
                  <div>
                    <span className="font-medium">Ranges:</span> Use colons
                    <br />MW:100-200
                  </div>
                  <div>
                    <span className="font-medium">Voice search:</span> Click 🎤
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Searching...</p>
                  </div>
                ) : results.length > 0 ? (
                  <SearchResults 
                    results={results} 
                    showExport={true}
                    showSorting={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start your search
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Enter a search query above to find compounds, elements, calculators, and help content.
                    </p>
                    <div className="text-sm text-gray-400">
                      <p>Try searching for:</p>
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => handleQuickSearch('water')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          water
                        </button>
                        <button
                          onClick={() => handleQuickSearch('NaCl')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          NaCl
                        </button>
                        <button
                          onClick={() => handleQuickSearch('molecular weight')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          molecular weight
                        </button>
                        <button
                          onClick={() => handleQuickSearch('periodic table')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          periodic table
                        </button>
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
