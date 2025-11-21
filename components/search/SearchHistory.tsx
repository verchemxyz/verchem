// VerChem Search History Component
'use client'

import React, { useState } from 'react'
import { ClockIcon, XMarkIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { SearchHistoryItem, SearchFilters } from '../../lib/search/types'

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  onSearchClick: (query: string, filters?: SearchFilters) => void
}

export function SearchHistory({ history, onSearchClick }: SearchHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filteredHistory = history.filter(item =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (date: Date) => {
    const now = new Date()
    const itemDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - itemDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return itemDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleClearHistory = () => {
    // This would typically be handled by the parent component
    // TODO: Implement actual clear functionality
    setShowClearConfirm(false)
  }

  const handleDeleteItem = (id: string) => {
    // This would typically be handled by the parent component
    // TODO: Implement actual delete functionality
    void id // Unused parameter
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No search history</h3>
        <p className="text-gray-500">
          Your search history will appear here once you start searching.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Search History</h2>
        <div className="flex items-center space-x-3">
          {/* Search within history */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-48 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Clear history button */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Clear All
          </button>
        </div>
      </div>

      {/* Clear confirmation dialog */}
      {showClearConfirm && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Clear search history?
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                This will permanently delete all search history items.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History items */}
      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onSearchClick={onSearchClick}
            onDelete={handleDeleteItem}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        ))}
      </div>

      {filteredHistory.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No history items match your search.</p>
        </div>
      )}
    </div>
  )
}

function HistoryItem({ 
  item, 
  onSearchClick, 
  onDelete, 
  formatDate, 
  formatTime 
}: { 
  item: SearchHistoryItem
  onSearchClick: (query: string, filters?: SearchFilters) => void
  onDelete: (id: string) => void
  formatDate: (date: Date) => string
  formatTime: (date: Date) => string
}) {
  const hasFilters = item.filters && Object.keys(item.filters).length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-1">Query:</p>
            <code className="block text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-700 font-mono">
              {item.query}
            </code>
          </div>

          {hasFilters && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">Filters:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(item.filters || {}).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onSearchClick(item.query, item.filters)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
            Search
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Remove from history"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Simple icon for no results
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
