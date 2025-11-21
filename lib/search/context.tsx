// VerChem Search Context and Provider
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { 
  SearchResult, 
  SearchQuery, 
  SearchFilters, 
  SearchOptions,
  SearchHistoryItem,
  SearchBookmark
} from './types'
import { VerChemSearchEngine } from './engine'
import { searchAnalytics } from './analytics'

interface RecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
}

interface RecognitionEvent {
  results: RecognitionResult[];
}

interface RecognitionErrorEvent {
  error: string;
}

interface WebkitSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SearchContextType {
  // Search state
  results: SearchResult[]
  isSearching: boolean
  error: string | null
  
  // Search functions
  search: (query: string, filters?: SearchFilters, options?: SearchOptions) => Promise<void>
  searchAdvanced: (query: SearchQuery) => Promise<void>
  
  // Suggestions
  suggestions: string[]
  getSuggestions: (query: string, type?: string) => void
  
  // History and bookmarks
  searchHistory: SearchHistoryItem[]
  bookmarks: SearchBookmark[]
  addToHistory: (query: string, resultCount: number) => void
  addBookmark: (name: string, query: string, filters?: SearchFilters) => void
  removeBookmark: (id: string) => void
  
  // Analytics
  popularSearches: string[]
  recentSearches: string[]
  
  // Voice search
  isVoiceSearchSupported: boolean
  isListening: boolean
  startVoiceSearch: () => void
  stopVoiceSearch: () => void
  
  // Filters and options
  activeFilters: SearchFilters
  setActiveFilters: (filters: SearchFilters) => void
  searchOptions: SearchOptions
  setSearchOptions: (options: SearchOptions) => void
  
  // Export
  exportResults: (format: 'json' | 'csv') => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchEngine] = useState(() => new VerChemSearchEngine())
  
  // Search state
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  // History and bookmarks
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [bookmarks, setBookmarks] = useState<SearchBookmark[]>([])
  
  // Analytics
  const [popularSearches] = useState(() => searchEngine.getPopularSearches())
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  // Voice search
  const [isVoiceSearchSupported, setIsVoiceSearchSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<WebkitSpeechRecognition | null>(null)
  
  // Filters and options
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({})
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    fuzzy: true,
    includeSynonyms: true,
    limit: 20,
    sortBy: 'relevance',
    sortOrder: 'desc'
  })

  // Initialize voice search support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsVoiceSearchSupported(true)
      const SpeechRecognitionConstructor = (window as Window & {
        webkitSpeechRecognition: new () => WebkitSpeechRecognition
      }).webkitSpeechRecognition

      const rec = new SpeechRecognitionConstructor()
      rec.continuous = false
      rec.interimResults = true
      rec.lang = 'en-US'
      
      rec.onresult = (event: RecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')

        if (event.results[0]?.isFinal) {
          // Perform search with voice input
          search(transcript.trim(), activeFilters, searchOptions)
          setIsListening(false)
        }
      }

      rec.onerror = (event: RecognitionErrorEvent) => {
        console.error('Voice search error:', event.error)
        setIsListening(false)
      }
      
      rec.onend = () => {
        setIsListening(false)
      }
      
      setRecognition(rec)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchEngine, activeFilters, searchOptions])
  // Note: 'search' is intentionally omitted to avoid temporal dead zone error
  // The search function is stable (wrapped in useCallback) and only called in callbacks

  // Load history and bookmarks from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('verchem-search-history')
        const savedBookmarks = localStorage.getItem('verchem-search-bookmarks')
        const savedRecent = localStorage.getItem('verchem-recent-searches')
        
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory))
        }
        
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks))
        }
        
        if (savedRecent) {
          setRecentSearches(JSON.parse(savedRecent))
        }
      } catch (error) {
        console.error('Error loading search data:', error)
      }
    }
  }, [])

  // Save history and bookmarks to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('verchem-search-history', JSON.stringify(searchHistory))
      } catch (error) {
        console.error('Error saving search history:', error)
      }
    }
  }, [searchHistory])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('verchem-search-bookmarks', JSON.stringify(bookmarks))
      } catch (error) {
        console.error('Error saving bookmarks:', error)
      }
    }
  }, [bookmarks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('verchem-recent-searches', JSON.stringify(recentSearches))
      } catch (error) {
        console.error('Error saving recent searches:', error)
      }
    }
  }, [recentSearches])

  const addToHistory = useCallback((query: string, resultCount: number) => {
    const historyItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      resultCount,
      filters: activeFilters
    }

    setSearchHistory(prev => {
      const updated = [historyItem, ...prev.filter(item => item.query !== query)]
      return updated.slice(0, 50) // Keep only 50 history items
    })
  }, [activeFilters])

  const search = useCallback(async (
    query: string, 
    filters: SearchFilters = activeFilters, 
    options: SearchOptions = searchOptions
  ) => {
    setIsSearching(true)
    setError(null)
    
    try {
      const searchQuery: SearchQuery = {
        query,
        filters,
        options
      }
      
      const searchResults = searchEngine.search(searchQuery)
      setResults(searchResults)
      
      // Add to history
      if (query.trim()) {
        addToHistory(query, searchResults.length)
        // Add to recent searches
        setRecentSearches(prev => {
          const updated = [query, ...prev.filter(q => q !== query)]
          return updated.slice(0, 10) // Keep only 10 recent searches
        })
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchEngine, activeFilters, searchOptions, addToHistory])

  const searchAdvanced = useCallback(async (query: SearchQuery) => {
    setIsSearching(true)
    setError(null)

    try {
      const searchResults = searchEngine.search(query)
      setResults(searchResults)

      // Add to history
      if (query.query.trim()) {
        addToHistory(query.query, searchResults.length)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [searchEngine, addToHistory])

  const getSuggestions = useCallback((query: string, type?: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    
    const suggestionResults = searchEngine.getSuggestions(query, type)
    setSuggestions(suggestionResults)
  }, [searchEngine])

  const addBookmark = useCallback((name: string, query: string, filters?: SearchFilters) => {
    const bookmark: SearchBookmark = {
      id: Date.now().toString(),
      name,
      query,
      filters: filters || activeFilters,
      createdAt: new Date()
    }
    
    setBookmarks(prev => [...prev, bookmark])
    searchAnalytics.trackBookmarkCreated(name, query)
  }, [activeFilters])

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id))
  }, [])

  const startVoiceSearch = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start()
        setIsListening(true)
      } catch (error) {
        console.error('Failed to start voice recognition:', error)
        setIsListening(false)
      }
    }
  }, [recognition, isListening])

  const stopVoiceSearch = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
    }
  }, [recognition, isListening])

  const exportResults = useCallback((format: 'json' | 'csv') => {
    const dataToExport = {
      query: 'VerChem Search Results',
      timestamp: new Date().toISOString(),
      results: results.map(result => ({
        type: result.type,
        title: result.title,
        subtitle: result.subtitle,
        description: result.description,
        category: result.category,
        relevance: result.relevance,
        url: result.url
      }))
    }

    if (format === 'json') {
      const jsonString = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `verchem-search-results-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const csvContent = [
        'Type,Title,Subtitle,Description,Category,Relevance,URL',
        ...results.map(result => 
          `"${result.type}","${result.title}","${result.subtitle || ''}","${result.description}","${result.category}","${result.relevance}","${result.url}"`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `verchem-search-results-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }

    searchAnalytics.trackExportUsed(format, results.length)
  }, [results])

  const value: SearchContextType = {
    // Search state
    results,
    isSearching,
    error,
    
    // Search functions
    search,
    searchAdvanced,
    
    // Suggestions
    suggestions,
    getSuggestions,
    
    // History and bookmarks
    searchHistory,
    bookmarks,
    addToHistory,
    addBookmark,
    removeBookmark,
    
    // Analytics
    popularSearches,
    recentSearches,
    
    // Voice search
    isVoiceSearchSupported,
    isListening,
    startVoiceSearch,
    stopVoiceSearch,
    
    // Filters and options
    activeFilters,
    setActiveFilters,
    searchOptions,
    setSearchOptions,
    
    // Export
    exportResults
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
