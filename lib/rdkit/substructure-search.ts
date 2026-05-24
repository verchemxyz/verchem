import 'client-only'

import { loadRDKit } from './client'
import {
  runSubstructureSearch,
  runSimilaritySearch,
  type CorpusEntry,
} from './substructure-core'
import { COMPOUNDS_WITH_SMILES } from '@/lib/data/compounds'
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
 * The compounds DB contains a few duplicate ids across category files
 * (e.g. `acetone` appears in both ketones and solvents). Dedupe by id so each
 * structure is searched once; map results back to the first compound carrying
 * that id (richest representative).
 */
const compoundById = new Map<string, Compound>()
for (const compound of COMPOUNDS_WITH_SMILES) {
  if (!compoundById.has(compound.id)) compoundById.set(compound.id, compound)
}

const CORPUS: CorpusEntry[] = [...compoundById.values()].map((c) => ({
  id: c.id,
  smiles: c.smiles as string,
}))

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
