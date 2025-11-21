// VerChem Search Bookmarks Component
'use client'

import React, { useState } from 'react'
import { BookmarkIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { SearchBookmark, SearchFilters } from '../../lib/search/types'

interface SearchBookmarksProps {
  bookmarks: SearchBookmark[]
  onSearchClick: (query: string, filters?: SearchFilters) => void
}

export function SearchBookmarks({ bookmarks, onSearchClick }: SearchBookmarksProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.query.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteBookmark = (id: string) => {
    // This would typically be handled by the parent component
    // TODO: Implement actual delete functionality
    void id // Unused parameter
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <BookmarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
        <p className="text-gray-500 mb-4">
          Save your favorite searches for quick access later.
        </p>
        <p className="text-sm text-gray-400">
          Click the bookmark icon next to any search result to save it here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Search Bookmarks</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Bookmarks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onSearchClick={onSearchClick}
            onDelete={handleDeleteBookmark}
          />
        ))}
      </div>

      {filteredBookmarks.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No bookmarks match your search.</p>
        </div>
      )}
    </div>
  )
}

function BookmarkCard({ 
  bookmark, 
  onSearchClick, 
  onDelete 
}: { 
  bookmark: SearchBookmark
  onSearchClick: (query: string, filters?: SearchFilters) => void
  onDelete: (id: string) => void
}) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const hasFilters = bookmark.filters && Object.keys(bookmark.filters).length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BookmarkIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium text-gray-900 truncate">{bookmark.name}</h3>
        </div>
        <button
          onClick={() => onDelete(bookmark.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete bookmark"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-2">Query:</p>
        <code className="block text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 font-mono">
          {bookmark.query}
        </code>
      </div>

      {hasFilters && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Filters:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(bookmark.filters || {}).map(([key, value]) => (
              <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Created: {formatDate(bookmark.createdAt)}</span>
        {bookmark.count && (
          <span>{bookmark.count} results</span>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onSearchClick(bookmark.query, bookmark.filters)}
          className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
          Search
        </button>
        <button
          onClick={() => {
            // Copy bookmark details to clipboard
            const details = `Name: ${bookmark.name}\nQuery: ${bookmark.query}\nFilters: ${JSON.stringify(bookmark.filters, null, 2)}`
            navigator.clipboard.writeText(details)
          }}
          className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Copy
        </button>
      </div>
    </div>
  )
}
