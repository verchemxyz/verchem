// VerChem Global Search Bar Component
'use client'

import React, { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface GlobalSearchBarProps {
  className?: string
  placeholder?: string
  compact?: boolean
}

export function GlobalSearchBar({ 
  className = "", 
  placeholder = "Search compounds, elements, calculators...",
  compact = false
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`block w-full ${compact ? 'pl-9 pr-3 py-1.5' : 'pl-10 pr-3 py-2'} border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 text-gray-900`}
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        aria-label="Search"
      >
        <span className="sr-only">Search</span>
      </button>
    </form>
  )
}
