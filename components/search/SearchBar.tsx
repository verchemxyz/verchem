// VerChem Global Search Bar Component
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, MicrophoneIcon } from '@heroicons/react/24/outline'
import { useSearch } from '../../lib/search/context'
import { SearchSuggestions } from './SearchSuggestions'
import { SearchFilters } from './SearchFilters'

interface SearchBarProps {
  placeholder?: string
  className?: string
  showFilters?: boolean
  autoFocus?: boolean
  onSearch?: (query: string) => void
  compact?: boolean
  initialQuery?: string
}

export function SearchBar({ 
  placeholder = "Search compounds, elements, calculators, help...", 
  className = "",
  showFilters = false,
  autoFocus = false,
  onSearch,
  compact = false,
  initialQuery = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    search,
    isSearching,
    getSuggestions,
    suggestions,
    isVoiceSearchSupported,
    isListening,
    startVoiceSearch,
    stopVoiceSearch,
    activeFilters,
    setActiveFilters,
    searchOptions,
    popularSearches,
    recentSearches
  } = useSearch()

  // Handle input changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        getSuggestions(query)
      } else {
        getSuggestions('')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, getSuggestions])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback(async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    await search(searchQuery, activeFilters, searchOptions)
    setShowSuggestions(false)
    onSearch?.(searchQuery)
  }, [query, search, activeFilters, searchOptions, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  const handleVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch()
    } else {
      startVoiceSearch()
    }
  }

  const clearQuery = () => {
    setQuery('')
    // setSuggestions([]) - not implemented
    inputRef.current?.focus()
  }

  const toggleFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 ${
            compact ? 'text-sm' : 'text-base'
          } ${
            isSearching ? 'opacity-75' : ''
          }`}
          autoFocus={autoFocus}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {/* Voice search button */}
          {isVoiceSearchSupported && (
            <button
              onClick={handleVoiceSearch}
              className={`p-2 rounded-md transition-colors ${
                isListening 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800'
              }`}
              title={isListening ? 'Stop voice search' : 'Start voice search'}
            >
              <MicrophoneIcon className={`h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
            </button>
          )}
          
          {/* Filters button */}
          {showFilters && (
            <button
              onClick={toggleFilters}
              className={`p-2 rounded-md transition-colors ${
                Object.keys(activeFilters).length > 0
                  ? 'text-blue-500 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800'
              }`}
              title="Advanced filters"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}
          
          {/* Clear button */}
          {query && (
            <button
              onClick={clearQuery}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          
          {/* Search button */}
          <button
            onClick={() => handleSearch()}
            disabled={isSearching || !query.trim()}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded-md transition-colors"
            title="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || query.trim()) && (
        <SearchSuggestions
          suggestions={suggestions}
          query={query}
          onSuggestionClick={handleSuggestionClick}
          popularSearches={popularSearches}
          recentSearches={recentSearches}
          className="absolute top-full left-0 right-0 mt-1 z-50"
        />
      )}

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40">
          <SearchFilters 
            filters={activeFilters}
            onFiltersChange={setActiveFilters}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
          />
        </div>
      )}

      {/* Voice search indicator */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 font-medium">Listening...</span>
            </div>
            <p className="text-red-600 text-sm mt-1">Speak your search query</p>
          </div>
        </div>
      )}
    </div>
  )
}
