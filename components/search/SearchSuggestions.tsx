// VerChem Search Suggestions Component
'use client'

import React from 'react'
import { ClockIcon, FireIcon, BookOpenIcon } from '@heroicons/react/24/outline'

interface SearchSuggestionsProps {
  suggestions: string[]
  query: string
  onSuggestionClick: (suggestion: string) => void
  popularSearches: string[]
  recentSearches: string[]
  className?: string
}

export function SearchSuggestions({
  suggestions,
  query,
  onSuggestionClick,
  popularSearches,
  recentSearches,
  className = ""
}: SearchSuggestionsProps) {
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-semibold text-blue-600 bg-blue-50">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  const SuggestionItem = ({ suggestion, icon: Icon, onClick }: {
    suggestion: string
    icon: React.ComponentType<{ className?: string }>
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
    >
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="text-gray-700 text-sm truncate">
        {highlightMatch(suggestion, query)}
      </span>
    </button>
  )

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto ${className}`}>
      {/* Current suggestions based on query */}
      {suggestions.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Suggestions
          </div>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={`suggestion-${index}`}
              suggestion={suggestion}
              icon={MagnifyingGlassIcon}
              onClick={() => onSuggestionClick(suggestion)}
            />
          ))}
        </div>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && !query.trim() && (
        <div className="py-2 border-t border-gray-100">
          <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            Recent
          </div>
          {recentSearches.slice(0, 5).map((search, index) => (
            <SuggestionItem
              key={`recent-${index}`}
              suggestion={search}
              icon={ClockIcon}
              onClick={() => onSuggestionClick(search)}
            />
          ))}
        </div>
      )}

      {/* Popular searches */}
      {popularSearches.length > 0 && !query.trim() && (
        <div className="py-2 border-t border-gray-100">
          <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center">
            <FireIcon className="h-3 w-3 mr-1" />
            Popular
          </div>
          {popularSearches.slice(0, 8).map((search, index) => (
            <SuggestionItem
              key={`popular-${index}`}
              suggestion={search}
              icon={FireIcon}
              onClick={() => onSuggestionClick(search)}
            />
          ))}
        </div>
      )}

      {/* Quick actions when no query */}
      {!query.trim() && (
        <div className="py-2 border-t border-gray-100">
          <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center">
            <BookOpenIcon className="h-3 w-3 mr-1" />
            Quick Access
          </div>
          <div className="grid grid-cols-2 gap-1 px-4 py-2">
            <button
              onClick={() => onSuggestionClick('periodic table')}
              className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Periodic Table
            </button>
            <button
              onClick={() => onSuggestionClick('molecular weight calculator')}
              className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Molecular Weight
            </button>
            <button
              onClick={() => onSuggestionClick('stoichiometry calculator')}
              className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Stoichiometry
            </button>
            <button
              onClick={() => onSuggestionClick('equation balancer')}
              className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Equation Balancer
            </button>
          </div>
        </div>
      )}

      {/* Advanced search tips */}
      {query.trim() && query.length > 2 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500">
            <span className="font-medium">Search tips:</span>
            <div className="mt-1 space-y-1">
              <div>
                • Use quotes for exact phrases: &quot;sodium chloride&quot;
              </div>
              <div>• Use NOT to exclude: acid NOT organic</div>
              <div>• Use ranges: MW:100-200</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple icon component for search suggestions
function MagnifyingGlassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
