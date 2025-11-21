// Simple Search Test Page
'use client'

import React from 'react'
import { SearchBar } from '../../components/search/SearchBar'
import { SearchResults } from '../../components/search/SearchResults'
import { useSearch } from '../../lib/search/context'

export default function TestSearchPage() {
  const { results, isSearching } = useSearch()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          VerChem Search System Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Test</h2>
          <SearchBar 
            placeholder="Search compounds, elements, calculators..."
            showFilters={true}
            className="mb-6"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
          {isSearching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          ) : (
            <SearchResults results={results} />
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Test Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Basic Searches</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• water</li>
                <li>• NaCl</li>
                <li>• periodic table</li>
                <li>• molecular weight</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Advanced Searches</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• &quot;sodium chloride&quot;</li>
                <li>• acid NOT organic</li>
                <li>• MW:100-200</li>
                <li>• stoichiometry calculator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
