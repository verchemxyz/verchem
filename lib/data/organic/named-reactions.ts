import { NamedReaction, ReactionCategory, DifficultyLevel } from '@/lib/types/organic-chemistry'
import { INTRODUCTORY_REACTIONS } from './reactions-introductory'
import { INTERMEDIATE_REACTIONS } from './reactions-intermediate'
import { ADVANCED_REACTIONS } from './reactions-advanced'

// ============================================
// Combined Named Reactions Database
// ============================================

export const NAMED_REACTIONS: NamedReaction[] = [
  ...INTRODUCTORY_REACTIONS,
  ...INTERMEDIATE_REACTIONS,
  ...ADVANCED_REACTIONS,
]

// ============================================
// Helper Functions
// ============================================

export function getReactionById(id: string): NamedReaction | undefined {
  return NAMED_REACTIONS.find(r => r.id === id)
}

export function getReactionsByCategory(category: ReactionCategory): NamedReaction[] {
  return NAMED_REACTIONS.filter(r => r.category === category)
}

export function getReactionsByDifficulty(difficulty: DifficultyLevel): NamedReaction[] {
  return NAMED_REACTIONS.filter(r => r.difficulty === difficulty)
}

export function searchReactions(query: string): NamedReaction[] {
  const lower = query.toLowerCase()
  return NAMED_REACTIONS.filter(
    r =>
      r.name.toLowerCase().includes(lower) ||
      r.altNames?.some(n => n.toLowerCase().includes(lower)) ||
      r.description.toLowerCase().includes(lower) ||
      r.tags.some(t => t.toLowerCase().includes(lower)) ||
      r.functionalGroups.some(fg => fg.toLowerCase().includes(lower)) ||
      r.discoverer?.toLowerCase().includes(lower)
  )
}

export function getReactionsByFunctionalGroup(groupId: string): NamedReaction[] {
  return NAMED_REACTIONS.filter(r => r.functionalGroups.includes(groupId))
}

export function getRelatedReactions(reactionId: string): NamedReaction[] {
  const reaction = getReactionById(reactionId)
  if (!reaction) return []
  return reaction.relatedReactions
    .map(id => getReactionById(id))
    .filter((r): r is NamedReaction => r !== undefined)
}

// ============================================
// Category Metadata
// ============================================

export const REACTION_CATEGORIES: Record<
  ReactionCategory,
  { label: string; description: string; color: string }
> = {
  addition: {
    label: 'Addition',
    description: 'Adding atoms across a multiple bond (C=C or C=O)',
    color: '#3b82f6',
  },
  elimination: {
    label: 'Elimination',
    description: 'Removing atoms to form a new multiple bond',
    color: '#ef4444',
  },
  substitution: {
    label: 'Substitution',
    description: 'Replacing one atom or group with another',
    color: '#22c55e',
  },
  oxidation: {
    label: 'Oxidation',
    description: 'Increasing the oxidation state of carbon',
    color: '#f97316',
  },
  reduction: {
    label: 'Reduction',
    description: 'Decreasing the oxidation state of carbon',
    color: '#06b6d4',
  },
  rearrangement: {
    label: 'Rearrangement',
    description: 'Reorganizing the carbon skeleton',
    color: '#a855f7',
  },
  condensation: {
    label: 'Condensation',
    description: 'Combining molecules with loss of small molecule (H₂O)',
    color: '#eab308',
  },
  coupling: {
    label: 'Cross-Coupling',
    description: 'Metal-catalyzed formation of C-C bonds',
    color: '#ec4899',
  },
  cycloaddition: {
    label: 'Cycloaddition',
    description: 'Ring-forming reactions from multiple bonds',
    color: '#14b8a6',
  },
  protection: {
    label: 'Protection',
    description: 'Temporarily blocking reactive functional groups',
    color: '#64748b',
  },
  pericyclic: {
    label: 'Pericyclic',
    description: 'Concerted reactions through cyclic transition states',
    color: '#8b5cf6',
  },
  radical: {
    label: 'Radical',
    description: 'Reactions involving single-electron (radical) intermediates',
    color: '#f43f5e',
  },
  multicomponent: {
    label: 'Multicomponent',
    description: 'Three or more reactants combine in one pot',
    color: '#0ea5e9',
  },
}

export const DIFFICULTY_LEVELS: Record<
  DifficultyLevel,
  { label: string; description: string; color: string }
> = {
  introductory: {
    label: 'Introductory',
    description: 'Organic Chemistry I — Foundation reactions',
    color: '#22c55e',
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Organic Chemistry II — Named reactions and synthesis',
    color: '#f59e0b',
  },
  advanced: {
    label: 'Advanced',
    description: 'Graduate level — Modern synthesis and catalysis',
    color: '#ef4444',
  },
}

// ============================================
// Statistics
// ============================================

export const REACTION_STATISTICS = {
  total: NAMED_REACTIONS.length,
  byDifficulty: {
    introductory: INTRODUCTORY_REACTIONS.length,
    intermediate: INTERMEDIATE_REACTIONS.length,
    advanced: ADVANCED_REACTIONS.length,
  },
  byCategory: Object.fromEntries(
    (Object.keys(REACTION_CATEGORIES) as ReactionCategory[]).map(cat => [
      cat,
      NAMED_REACTIONS.filter(r => r.category === cat).length,
    ])
  ),
  nobelPrizeReactions: NAMED_REACTIONS.filter(r =>
    r.tags.includes('Nobel')
  ).length,
}
