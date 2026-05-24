import 'client-only'

import { loadRDKit } from './client'
import {
  runSubstructureSearch,
  runSimilaritySearch,
  type CorpusEntry,
} from './substructure-core'
import { COMPOUNDS_WITH_SMILES, type CompoundWithSmiles } from '@/lib/data/compounds'
import type { Compound } from '@/lib/data/compounds/types'

export interface CompoundSubstructureHit {
  compound: Compound
  /** Atom indices in the compound structure that matched the query. */
  atomIndices: number[]
}

export interface CompoundSimilarityHit {
  compound: Compound
  /** Tanimoto similarity in [0, 1]. */
  similarity: number
}

export interface SubstructureSearchResult {
  queryValid: boolean
  hits: CompoundSubstructureHit[]
}

export interface SimilaritySearchResult {
  queryValid: boolean
  hits: CompoundSimilarityHit[]
}

/*
 * Build the searchable corpus, deduping on two axes:
 *   - by id: a few ids repeat across category files (e.g. `acetone` in both
 *     ketones and solvents) — keep the first (richest) representative.
 *   - by SMILES string: the same molecule sometimes appears under different
 *     ids (e.g. `ethanol` and `ethanol-solvent`, both CCO). Collapse those so
 *     a search returns each distinct structure once.
 */
const compoundById = new Map<string, CompoundWithSmiles>()
const CORPUS: CorpusEntry[] = []
const seenSmiles = new Set<string>()
for (const compound of COMPOUNDS_WITH_SMILES) {
  if (!compoundById.has(compound.id)) compoundById.set(compound.id, compound)
  if (!seenSmiles.has(compound.smiles)) {
    seenSmiles.add(compound.smiles)
    CORPUS.push({ id: compound.id, smiles: compound.smiles })
  }
}

/** Number of verified structures available for searching. */
export const SEARCHABLE_COMPOUND_COUNT = CORPUS.length

/**
 * Find every verified compound whose structure contains the query
 * substructure (SMARTS or SMILES pattern).
 */
export async function searchCompoundsBySubstructure(
  query: string,
  options: { limit?: number } = {}
): Promise<SubstructureSearchResult> {
  const rdkit = await loadRDKit()
  const { queryValid, hits } = runSubstructureSearch(
    rdkit as unknown as Parameters<typeof runSubstructureSearch>[0],
    query,
    CORPUS,
    options
  )

  return {
    queryValid,
    hits: hits.flatMap((hit) => {
      const compound = compoundById.get(hit.id)
      return compound ? [{ compound, atomIndices: hit.atomIndices }] : []
    }),
  }
}

/**
 * Rank verified compounds by Morgan-fingerprint Tanimoto similarity to the
 * query molecule (SMILES). Results are sorted most-similar first.
 */
export async function searchCompoundsBySimilarity(
  query: string,
  options: { threshold?: number; limit?: number } = {}
): Promise<SimilaritySearchResult> {
  const rdkit = await loadRDKit()
  const { queryValid, hits } = runSimilaritySearch(
    rdkit as unknown as Parameters<typeof runSimilaritySearch>[0],
    query,
    CORPUS,
    options
  )

  return {
    queryValid,
    hits: hits.flatMap((hit) => {
      const compound = compoundById.get(hit.id)
      return compound ? [{ compound, similarity: hit.similarity }] : []
    }),
  }
}
