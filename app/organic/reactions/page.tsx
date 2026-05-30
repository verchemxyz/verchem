'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CalcShell } from '@/components/lab'
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
    <CalcShell
      eyebrow="Organic chemistry · reference"
      title="Named Reactions Database"
      subtitle={`${NAMED_REACTIONS.length} organic chemistry reactions with mechanisms, conditions, examples, and study tips.`}
      backHref="/organic"
      backLabel="Organic Hub"
      maxWidth="7xl"
    >
        {/* Search */}
        <div>
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
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground flex items-center mr-2">Level:</span>
          <button
            onClick={() => setSelectedDifficulty('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedDifficulty === 'all'
                ? 'bg-foreground text-background'
                : 'bg-card border border-border text-muted-foreground hover:border-primary-400'
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:border-primary-400'
                }`}
              >
                {meta.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground flex items-center mr-2">Type:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-foreground text-background'
                : 'bg-card border border-border text-muted-foreground hover:border-primary-400'
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:border-primary-400'
                }`}
              >
                {meta.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
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
                className="group rounded-lg border border-border bg-card hover:border-primary-400 transition-colors p-5"
              >
                {/* Category + Difficulty Badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-muted text-foreground font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catMeta.color }} aria-hidden="true" />
                    {catMeta.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-muted text-foreground font-medium">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: diffMeta.color }} aria-hidden="true" />
                    {diffMeta.label}
                  </span>
                  {reaction.tags.includes('Nobel') && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning-strong">
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
    </CalcShell>
  )
}
