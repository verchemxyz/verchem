// VerChem Search Results Component
'use client'

import React, { useState } from 'react'
import { 
  BeakerIcon, 
  CubeIcon, 
  CalculatorIcon, 
  BookOpenIcon,
  ArrowDownTrayIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline'
import { SearchResult } from '../../lib/search/types'
import { useSearch } from '../../lib/search/context'

interface SearchResultsProps {
  results: SearchResult[]
  className?: string
  viewMode?: 'grid' | 'list' | 'compact'
  showExport?: boolean
  showSorting?: boolean
}

export function SearchResults({ 
  results, 
  className = "", 
  viewMode: initialViewMode = 'list',
  showExport = true,
  showSorting = true
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { exportResults } = useSearch()

  const handleExport = (format: 'json' | 'csv') => {
    exportResults(format)
  }

  // Sort results
  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.title.localeCompare(b.title)
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
      case 'relevance':
      default:
        comparison = b.relevance - a.relevance
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-muted-foreground mb-4">
          <NoResultsIcon className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search terms or filters to find what you&apos;re looking for.
        </p>
        <div className="text-sm text-muted-foreground">
          <p>Search tips:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your spelling</li>
            <li>• Try different keywords</li>
            <li>• Use fewer filters</li>
            <li>• Try the voice search feature</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </h2>

          {showSorting && (
            <div className="flex items-center space-x-2">
              <ArrowsUpDownIcon className="h-4 w-4 text-muted-foreground" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="text-sm bg-card text-foreground border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="relevance-desc">Most Relevant</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="type-asc">Type A-Z</option>
                <option value="type-desc">Type Z-A</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-muted border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-border'}`}
              title="List view"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-border'}`}
              title="Grid view"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1 rounded ${viewMode === 'compact' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-border'}`}
              title="Compact view"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>

          {/* Export button */}
          {showExport && (
            <div className="relative group">
              <button
                className="flex items-center space-x-1 px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                title="Export results"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export</span>
              </button>

              <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-t-lg"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted rounded-b-lg"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results grid/list/compact */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResults.map((result) => (
            <SearchResultCard key={result.id} result={result} />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedResults.map((result) => (
            <SearchResultItem key={result.id} result={result} />
          ))}
        </div>
      )}

      {viewMode === 'compact' && (
        <div className="space-y-1">
          {sortedResults.map((result) => (
            <CompactSearchResult key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const getIcon = (type: string) => {
    const iconClass = "h-8 w-8"
    switch (type) {
      case 'compound':
        return <BeakerIcon className={iconClass} />
      case 'element':
        return <CubeIcon className={iconClass} />
      case 'calculator':
        return <CalculatorIcon className={iconClass} />
      case 'help':
        return <BookOpenIcon className={iconClass} />
      default:
        return <BeakerIcon className={iconClass} />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'compound':
        return 'text-primary-600 bg-primary-50'
      case 'element':
        return 'text-success-strong bg-success/10'
      case 'calculator':
        return 'text-secondary-strong bg-secondary-50'
      case 'help':
        return 'text-warning-strong bg-warning/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${getIconColor(result.type)}`}>
          {getIcon(result.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {result.title}
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {result.category}
            </span>
          </div>

          {result.subtitle && (
            <p className="text-sm text-muted-foreground mb-2">{result.subtitle}</p>
          )}

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {result.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                  {tag}
                </span>
              ))}
              {result.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{result.tags.length - 3}</span>
              )}
            </div>

            <a
              href={result.url}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              View →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchResultItem({ result }: { result: SearchResult }) {
  const getIcon = (type: string) => {
    const iconClass = "h-6 w-6"
    switch (type) {
      case 'compound':
        return <BeakerIcon className={iconClass} />
      case 'element':
        return <CubeIcon className={iconClass} />
      case 'calculator':
        return <CalculatorIcon className={iconClass} />
      case 'help':
        return <BookOpenIcon className={iconClass} />
      default:
        return <BeakerIcon className={iconClass} />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'compound':
        return 'text-primary-600 bg-primary-50'
      case 'element':
        return 'text-success-strong bg-success/10'
      case 'calculator':
        return 'text-secondary-strong bg-secondary-50'
      case 'help':
        return 'text-warning-strong bg-warning/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 p-2 rounded-lg ${getIconColor(result.type)}`}>
          {getIcon(result.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-foreground">
              {result.title}
            </h3>
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              {result.category}
            </span>
          </div>

          {result.subtitle && (
            <p className="text-sm text-muted-foreground mb-2">{result.subtitle}</p>
          )}

          <p className="text-sm text-foreground mb-3">
            {result.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {result.tags.slice(0, 5).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                  {tag}
                </span>
              ))}
              {result.tags.length > 5 && (
                <span className="text-sm text-muted-foreground">+{result.tags.length - 5}</span>
              )}
            </div>

            <a
              href={result.url}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-foreground bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactSearchResult({ result }: { result: SearchResult }) {
  const getIconColor = (type: string) => {
    switch (type) {
      case 'compound':
        return 'text-primary-600'
      case 'element':
        return 'text-success-strong'
      case 'calculator':
        return 'text-secondary-strong'
      case 'help':
        return 'text-warning-strong'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md transition-colors">
      <div className={`flex-shrink-0 ${getIconColor(result.type)}`}>
        <BeakerIcon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground truncate">
            {result.title}
          </h3>
          <span className="text-xs text-muted-foreground">
            {result.category}
          </span>
        </div>

        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
      </div>

      <a
        href={result.url}
        className="text-xs text-primary-600 hover:text-primary-700"
      >
        View
      </a>
    </div>
  )
}

// Simple icon for no results
function NoResultsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
