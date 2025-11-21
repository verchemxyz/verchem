// VerChem Command Palette Component
'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon, FireIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import { useSearch } from '../../lib/search/context'

interface CommandPaletteProps {
  onClose: () => void
  onSearch: (query: string) => void
}

export function CommandPalette({ onClose, onSearch }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { 
    popularSearches, 
    recentSearches, 
    bookmarks, 
  } = useSearch()

  // Focus input when palette opens
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const items = useMemo(() => {
    const commands: CommandItem[] = []

    // Recent searches
    if (!query.trim()) {
      commands.push(
        ...recentSearches.slice(0, 5).map(search => ({
          type: 'recent' as const,
          title: search,
          subtitle: 'Recent search',
          icon: ClockIcon,
          action: () => onSearch(search)
        }))
      )
    }

    // Popular searches
    if (!query.trim()) {
      commands.push(
        ...popularSearches.slice(0, 5).map(search => ({
          type: 'popular' as const,
          title: search,
          subtitle: 'Popular search',
          icon: FireIcon,
          action: () => onSearch(search)
        }))
      )
    }

    // Bookmarks
    if (!query.trim()) {
      commands.push(
        ...bookmarks.slice(0, 3).map(bookmark => ({
          type: 'bookmark' as const,
          title: bookmark.name,
          subtitle: bookmark.query,
          icon: BookmarkIcon,
          action: () => onSearch(bookmark.query)
        }))
      )
    }

    // Navigation commands
    const navCommands: CommandItem[] = [
      {
        type: 'command',
        title: 'Go to Periodic Table',
        subtitle: 'View the interactive periodic table',
        icon: CubeIcon,
        action: () => window.open('/periodic-table', '_self')
      },
      {
        type: 'command',
        title: 'Go to Compounds',
        subtitle: 'Browse chemical compounds database',
        icon: BeakerIcon,
        action: () => window.open('/compounds', '_self')
      },
      {
        type: 'command',
        title: 'Go to Calculators',
        subtitle: 'Access chemistry calculators',
        icon: CalculatorIcon,
        action: () => window.open('/stoichiometry', '_self')
      },
      {
        type: 'command',
        title: 'Go to Search Page',
        subtitle: 'Advanced search interface',
        icon: MagnifyingGlassIcon,
        action: () => window.open('/search', '_self')
      }
    ]

    commands.push(...navCommands)

    return commands
  }, [query, recentSearches, popularSearches, bookmarks, onSearch])

  const handleItemSelect = useCallback((item: CommandItem) => {
    item.action()
    onClose()
  }, [onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (items[selectedIndex]) {
            handleItemSelect(items[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedIndex, handleItemSelect, onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Search input */}
        <div className="relative border-b border-gray-200">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="block w-full pl-12 pr-12 py-4 text-lg border-0 rounded-t-lg focus:outline-none focus:ring-0 placeholder-gray-500"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {items.map((item, index) => (
                <CommandItem
                  key={`${item.type}-${index}`}
                  item={item}
                  isSelected={index === selectedIndex}
                  onClick={() => handleItemSelect(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>
            {items.length} result{items.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CommandItem {
  type: 'suggestion' | 'recent' | 'popular' | 'bookmark' | 'command'
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
}

function CommandItem({ 
  item, 
  isSelected, 
  onClick 
}: { 
  item: CommandItem
  isSelected: boolean
  onClick: () => void
}) {
  const getItemColor = () => {
    switch (item.type) {
      case 'suggestion':
        return 'text-blue-600'
      case 'recent':
        return 'text-green-600'
      case 'popular':
        return 'text-orange-600'
      case 'bookmark':
        return 'text-yellow-600'
      case 'command':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
        isSelected 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className={`flex-shrink-0 ${getItemColor()}`}>
        <item.icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {item.title}
        </div>
        <div className="text-sm text-gray-500 truncate">
          {item.subtitle}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          item.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
          item.type === 'recent' ? 'bg-green-100 text-green-800' :
          item.type === 'popular' ? 'bg-orange-100 text-orange-800' :
          item.type === 'bookmark' ? 'bg-yellow-100 text-yellow-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {item.type}
        </span>
      </div>
    </button>
  )
}

// Simple icon components
function CubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}
