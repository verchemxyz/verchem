// VerChem Search System Demo Page
'use client'

import React, { useState } from 'react'
import { SearchBar } from '../../components/search/SearchBar'
import { StructureSearch } from '../../components/search/StructureSearch'
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar'
import { useSearch } from '../../lib/search/context'
import {
  POPULAR_SEARCHES,
  SEARCH_EXAMPLES
} from '../../lib/search/config'
import { searchAnalytics } from '../../lib/search/analytics'
import type { SearchAnalytics } from '../../lib/search/types'

export default function SearchDemoPage() {
  const { results, isSearching, search, searchHistory, bookmarks } = useSearch()
  const [activeDemo, setActiveDemo] = useState<'basic' | 'advanced' | 'structure' | 'global' | 'analytics'>('basic')

  const handleStructureSearch = (smiles: string) => {
    search(`smiles:${smiles}`)
  }

  const handleQuickSearch = (query: string) => {
    search(query)
  }

  const analytics = searchAnalytics.getAnalytics()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                VerChem Search System Demo
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Explore the comprehensive search capabilities of VerChem
              </p>
              
              {/* Demo navigation */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {([
                  { id: 'basic', label: 'Basic Search', icon: '🔍' },
                  { id: 'advanced', label: 'Advanced Search', icon: '⚙️' },
                  { id: 'structure', label: 'Structure Search', icon: '🧪' },
                  { id: 'global', label: 'Global Search', icon: '🌍' },
                  { id: 'analytics', label: 'Analytics', icon: '📊' }
                ] as const).map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => setActiveDemo(demo.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeDemo === demo.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{demo.icon}</span>
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Demo area */}
          <div className="lg:col-span-2">
            {activeDemo === 'basic' && (
              <BasicSearchDemo onQuickSearch={handleQuickSearch} />
            )}
            
            {activeDemo === 'advanced' && (
              <AdvancedSearchDemo />
            )}
            
            {activeDemo === 'structure' && (
              <StructureSearchDemo onStructureSearch={handleStructureSearch} />
            )}
            
            {activeDemo === 'global' && (
              <GlobalSearchDemo />
            )}
            
            {activeDemo === 'analytics' && (
              <AnalyticsDemo analytics={analytics} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search Results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.slice(0, 5).map((result) => (
                    <div key={result.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{result.title}</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-2">{result.description}</p>
                    </div>
                  ))}
                  {results.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{results.length - 5} more results
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No search results yet</p>
                  <p className="text-sm mt-1">Try searching for something!</p>
                </div>
              )}
            </div>

            {/* Search History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h3>
              {searchHistory.length > 0 ? (
                <div className="space-y-2">
                  {searchHistory.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleQuickSearch(item.query)}
                      className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No search history yet</p>
              )}
            </div>

            {/* Bookmarks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookmarks</h3>
              {bookmarks.length > 0 ? (
                <div className="space-y-2">
                  {bookmarks.slice(0, 5).map((bookmark) => (
                    <button
                      key={bookmark.id}
                      onClick={() => handleQuickSearch(bookmark.query)}
                      className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      <div className="font-medium">{bookmark.name}</div>
                      <div className="text-xs text-gray-500 truncate">{bookmark.query}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No bookmarks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BasicSearchDemo({ onQuickSearch }: { onQuickSearch: (query: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Search</h3>
        <p className="text-gray-600 mb-6">
          Start with simple searches for compounds, elements, or calculators.
        </p>
        
        <div className="mb-6">
          <SearchBar 
            placeholder="Try: water, NaCl, periodic table..."
            showFilters={false}
            className="mb-4"
          />
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Popular Searches</h4>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.slice(0, 12).map((search) => (
              <button
                key={search}
                onClick={() => onQuickSearch(search)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Search Examples</h4>
        <div className="space-y-3">
          {SEARCH_EXAMPLES.basic.map((example, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <code className="text-sm font-mono bg-white px-2 py-1 rounded border">{example.query}</code>
                <p className="text-sm text-gray-600 mt-1">{example.description}</p>
              </div>
              <button
                onClick={() => onQuickSearch(example.query)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdvancedSearchDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Search</h3>
        <p className="text-gray-600 mb-6">
          Use advanced query syntax and filters for precise results.
        </p>
        
        <div className="mb-6">
          <SearchBar 
            placeholder='Try: "sodium chloride", acid NOT organic, MW:100-200...'
            showFilters={true}
            className="mb-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Advanced Examples</h4>
            <div className="space-y-2">
              {SEARCH_EXAMPLES.advanced.map((example, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border block mb-2">{example.query}</code>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Expert Examples</h4>
            <div className="space-y-2">
              {SEARCH_EXAMPLES.expert.map((example, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border block mb-2">{example.query}</code>
                  <p className="text-sm text-gray-600">{example.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Query Syntax Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium mb-2">Basic Operators</h5>
            <ul className="space-y-1 text-gray-600">
              <li>
                •{' '}
                <code>&quot;exact phrase&quot;</code>
                {' '}
                - Exact match
              </li>
              <li>• <code>word1 word2</code> - Both words</li>
              <li>• <code>word1 OR word2</code> - Either word</li>
              <li>• <code>NOT word</code> - Exclude word</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">Range & Field Queries</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• <code>MW:100-200</code> - Molecular weight range</li>
              <li>• <code>MP:0-100</code> - Melting point range</li>
              <li>• <code>BP:100-200</code> - Boiling point range</li>
              <li>• <code>AN:1-10</code> - Atomic number range</li>
              <li>• <code>type:compound</code> - Only compounds</li>
              <li>• <code>category:reactions</code> - Reaction-related tools</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StructureSearchDemo({ onStructureSearch }: { onStructureSearch: (smiles: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Structure Search</h3>
        <p className="text-gray-600 mb-6">
          Search for compounds by their chemical structure using SMILES notation.
        </p>
        
        <StructureSearch onSearch={onStructureSearch} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">SMILES Examples</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-2">Simple Molecules</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Water</span>
                <code className="bg-gray-100 px-2 py-1 rounded">O</code>
              </div>
              <div className="flex justify-between">
                <span>Methane</span>
                <code className="bg-gray-100 px-2 py-1 rounded">C</code>
              </div>
              <div className="flex justify-between">
                <span>Ethanol</span>
                <code className="bg-gray-100 px-2 py-1 rounded">CCO</code>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">Complex Molecules</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Benzene</span>
                <code className="bg-gray-100 px-2 py-1 rounded">c1ccccc1</code>
              </div>
              <div className="flex justify-between">
                <span>Aspirin</span>
                <code className="bg-gray-100 px-2 py-1 rounded">CC(=O)OC1=CC=CC=C1C(=O)O</code>
              </div>
              <div className="flex justify-between">
                <span>Caffeine</span>
                <code className="bg-gray-100 px-2 py-1 rounded">CN1C=NC2=C1C(=O)N(C(=O)N2C)C</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GlobalSearchDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Global Search Bar</h3>
        <p className="text-gray-600 mb-6">
          A compact search bar that can be placed anywhere on the site.
        </p>
        
        <div className="mb-6">
          <GlobalSearchBar 
            placeholder="Search from anywhere..."
            className="mb-4"
          />
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Compact Version</h4>
          <GlobalSearchBar 
            placeholder="Compact search..."
            compact={true}
            className="mb-4"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Integration Examples</h4>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Header Integration</h5>
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded"></div>
                <span className="font-semibold">VerChem</span>
              </div>
              <div className="w-64">
                <GlobalSearchBar compact={true} placeholder="Search..." />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Sidebar Integration</h5>
            <div className="flex">
              <div className="w-48 bg-white p-3 border-r">
                <div className="mb-3">
                  <GlobalSearchBar compact={true} placeholder="Search..." />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">Navigation</div>
                  <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">Tools</div>
                  <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">Settings</div>
                </div>
              </div>
              <div className="flex-1 bg-white p-3">
                <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                  Main Content Area
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsDemo({ analytics }: { analytics: SearchAnalytics }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Analytics</h3>
        <p className="text-gray-600 mb-6">
          Insights into search behavior and usage patterns.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Search Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Searches:</span>
                <span className="font-semibold">{analytics.totalSearches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Popular Queries:</span>
                <span className="font-semibold">{analytics.popularQueries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No Results:</span>
                <span className="font-semibold">{analytics.noResultsQueries.length}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Top Searches</h4>
            <div className="space-y-2">
              {analytics.popularQueries.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate">{item.query}</span>
                  <span className="text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Filter Usage</h4>
        <div className="space-y-2">
          {Object.entries(analytics.filterUsage).slice(0, 8).map(([filter, count]) => (
            <div key={filter} className="flex justify-between text-sm">
              <span className="capitalize">{filter.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-gray-500">{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-medium text-gray-900 mb-3">Search Type Distribution</h4>
        <div className="space-y-2">
          {Object.entries(analytics.searchTypes).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span className="capitalize">{type}</span>
              <span className="text-gray-500">{count as number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
