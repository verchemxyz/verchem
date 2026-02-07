'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  NAMED_REACTIONS,
  REACTION_CATEGORIES,
  DIFFICULTY_LEVELS,
  searchReactions,
  getReactionsByCategory,
  getReactionsByDifficulty,
} from '@/lib/data/organic/named-reactions'
import type { ReactionCategory, DifficultyLevel } from '@/lib/types/organic-chemistry'

const ALL_CATEGORIES = Object.keys(REACTION_CATEGORIES) as ReactionCategory[]
const ALL_DIFFICULTIES: DifficultyLevel[] = ['introductory', 'intermediate', 'advanced']

export default function ReactionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ReactionCategory | 'all'>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all')

  const filteredReactions = useMemo(() => {
    let results = NAMED_REACTIONS

    if (searchQuery.trim()) {
      results = searchReactions(searchQuery)
    }

    if (selectedCategory !== 'all') {
      results = results.filter(r => r.category === selectedCategory)
    }

    if (selectedDifficulty !== 'all') {
      results = results.filter(r => r.difficulty === selectedDifficulty)
    }

    return results
  }, [searchQuery, selectedCategory, selectedDifficulty])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50">
      {/* Header */}
      <header className="border-b border-header-border bg-header-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="VerChem Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-premium">VerChem</span>
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/organic"
              className="text-secondary-600 hover:text-primary-600 transition-colors font-medium text-sm"
            >
              ← Organic Hub
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Named Reactions Database
          </h2>
          <p className="text-secondary-600 max-w-xl mx-auto">
            {NAMED_REACTIONS.length} organic chemistry reactions with mechanisms, conditions,
            examples, and study tips.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search reactions (e.g., Grignard, aldol, Nobel, coupling...)"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label="Search named reactions"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-muted-foreground flex items-center mr-2">Level:</span>
          <button
            onClick={() => setSelectedDifficulty('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedDifficulty === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-card border border-border text-secondary-600 hover:border-primary-400'
            }`}
          >
            All
          </button>
          {ALL_DIFFICULTIES.map(diff => {
            const meta = DIFFICULTY_LEVELS[diff]
            const count = getReactionsByDifficulty(diff).length
            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedDifficulty === diff
                    ? 'text-white shadow-md'
                    : 'bg-card border border-border text-secondary-600 hover:border-primary-400'
                }`}
                style={
                  selectedDifficulty === diff
                    ? { backgroundColor: meta.color }
                    : undefined
                }
              >
                {meta.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-muted-foreground flex items-center mr-2">Type:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-card border border-border text-secondary-600 hover:border-primary-400'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.filter(cat => getReactionsByCategory(cat).length > 0).map(cat => {
            const meta = REACTION_CATEGORIES[cat]
            const count = getReactionsByCategory(cat).length
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'text-white shadow-md'
                    : 'bg-card border border-border text-secondary-600 hover:border-primary-400'
                }`}
                style={
                  selectedCategory === cat
                    ? { backgroundColor: meta.color }
                    : undefined
                }
              >
                {meta.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredReactions.length} of {NAMED_REACTIONS.length} reactions
        </p>

        {/* Reactions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReactions.map(reaction => {
            const catMeta = REACTION_CATEGORIES[reaction.category]
            const diffMeta = DIFFICULTY_LEVELS[reaction.difficulty]
            return (
              <Link
                key={reaction.id}
                href={`/organic/reactions/${reaction.id}`}
                className="group rounded-xl border-2 border-border bg-card hover:border-primary-400 hover:shadow-lg transition-all p-5"
              >
                {/* Category + Difficulty Badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: catMeta.color }}
                  >
                    {catMeta.label}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: diffMeta.color }}
                  >
                    {diffMeta.label}
                  </span>
                  {reaction.tags.includes('Nobel') && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Nobel
                    </span>
                  )}
                </div>

                {/* Reaction Name */}
                <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary-600 transition-colors">
                  {reaction.name}
                </h3>
                {reaction.discoverer && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reaction.discoverer}
                    {reaction.year && ` (${reaction.year})`}
                  </p>
                )}

                {/* Equation */}
                <div className="mt-2 font-mono text-xs text-primary-700 bg-primary-50 rounded-lg px-3 py-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                  {reaction.equation}
                </div>

                {/* Description snippet */}
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {reaction.description}
                </p>

                {/* Mechanism steps count */}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{reaction.mechanism.length} mechanism steps</span>
                  <span className="text-primary-600 font-medium group-hover:translate-x-1 transition-transform">
                    View details →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {filteredReactions.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No reactions found</p>
            <p className="text-sm mt-1">Try a different search or filter combination</p>
          </div>
        )}
      </main>
    </div>
  )
}
