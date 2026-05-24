/*
 * Pure cheminformatics search core (VerChem Wedge W2 Day 6).
 *
 * NOT `client-only`: this module takes an injected RDKit-like engine so the
 * search logic can be exercised in Node with the REAL WASM module
 * (see __tests__/substructure-search.test.ts). The browser entry point
 * `substructure-search.ts` wraps these with `loadRDKit()` + the compound corpus.
 *
 * Mirrors the formula.ts pattern: keep the testable logic free of the
 * WASM-loading boundary so tests verify production code paths, not replicas
 * (the W2 R2 mock lesson).
 */

/** Minimal structural shape of an RDKit JSMol — satisfied by the real module and mocks. */
export interface SearchMol {
  is_valid: () => boolean
  get_substruct_match: (query: SearchMol) => string
  get_morgan_fp: (options: string) => string
  delete: () => void
}

/** Minimal structural shape of the RDKit module needed for searching. */
export interface SearchEngine {
  get_mol: (smiles: string) => SearchMol | null
  get_qmol: (smarts: string) => SearchMol | null
}

/** A corpus entry: any object carrying an id + canonical SMILES. */
export interface CorpusEntry {
  id: string
  smiles: string
}

export interface SubstructureHit {
  id: string
  /** Atom indices in the target that matched the query (for highlighting). */
  atomIndices: number[]
}

export interface SimilarityHit {
  id: string
  similarity: number
}

export interface SubstructureResult {
  /** False when the query string could not be parsed into a valid pattern. */
  queryValid: boolean
  hits: SubstructureHit[]
}

export interface SimilarityResult {
  queryValid: boolean
  hits: SimilarityHit[]
}

/**
 * Compute Tanimoto (Jaccard) similarity between two equal-length bitstrings.
 * Pure — no WASM. Canonical single source (re-exported by operations.ts).
 *
 * @throws Error if the fingerprint lengths differ.
 */
export function tanimotoSimilarity(fp1: string, fp2: string): number {
  if (fp1.length !== fp2.length) {
    throw new Error(`Fingerprint length mismatch: ${fp1.length} vs ${fp2.length}`)
  }
  let intersection = 0
  let union = 0
  for (let i = 0; i < fp1.length; i++) {
    const b1 = fp1[i] === '1'
    const b2 = fp2[i] === '1'
    if (b1 && b2) intersection++
    if (b1 || b2) union++
  }
  return union === 0 ? 0 : intersection / union
}

/**
 * Build a query molecule from a SMARTS/SMILES pattern.
 * Prefers `get_qmol` (SMARTS semantics, also accepts SMILES patterns); falls
 * back to `get_mol` so a plain valid SMILES still works as a query.
 * Caller owns deletion of the returned mol.
 */
function buildQueryMol(rdkit: SearchEngine, query: string): SearchMol | null {
  const trimmed = query.trim()
  if (trimmed.length === 0) return null

  let qmol: SearchMol | null = null
  try {
    qmol = rdkit.get_qmol(trimmed)
    if (qmol && qmol.is_valid()) return qmol
  } catch {
    // fall through to get_mol
  }
  qmol?.delete()

  let mol: SearchMol | null = null
  try {
    mol = rdkit.get_mol(trimmed)
    if (mol && mol.is_valid()) return mol
  } catch {
    // fall through
  }
  mol?.delete()
  return null
}

/**
 * Substructure search: return every corpus entry whose structure contains the
 * query pattern, with the matched atom indices for highlighting.
 *
 * The query molecule is parsed ONCE; each target is parsed, matched, deleted.
 */
export function runSubstructureSearch(
  rdkit: SearchEngine,
  query: string,
  corpus: readonly CorpusEntry[],
  options: { limit?: number } = {}
): SubstructureResult {
  const queryMol = buildQueryMol(rdkit, query)
  if (!queryMol) return { queryValid: false, hits: [] }

  const limit = options.limit ?? Infinity
  const hits: SubstructureHit[] = []

  try {
    for (const entry of corpus) {
      if (hits.length >= limit) break
      let target: SearchMol | null = null
      try {
        target = rdkit.get_mol(entry.smiles)
        if (!target || !target.is_valid()) continue

        const matchJson = target.get_substruct_match(queryMol)
        if (!matchJson) continue

        let atomIndices: number[] = []
        try {
          const parsed = JSON.parse(matchJson) as { atoms?: number[] }
          atomIndices = Array.isArray(parsed.atoms) ? parsed.atoms : []
        } catch {
          atomIndices = []
        }

        if (atomIndices.length > 0) {
          hits.push({ id: entry.id, atomIndices })
        }
      } finally {
        target?.delete()
      }
    }
  } finally {
    queryMol.delete()
  }

  return { queryValid: true, hits }
}

/**
 * Similarity search: rank corpus entries by Morgan-fingerprint Tanimoto
 * similarity to the query, keeping those at or above `threshold`.
 *
 * Computes the query fingerprint ONCE; each target fingerprint is computed,
 * compared, and its mol deleted.
 */
export function runSimilaritySearch(
  rdkit: SearchEngine,
  query: string,
  corpus: readonly CorpusEntry[],
  options: { threshold?: number; limit?: number; radius?: number; nBits?: number } = {}
): SimilarityResult {
  const threshold = options.threshold ?? 0.3
  const limit = options.limit ?? Infinity
  const radius = options.radius ?? 2
  const nBits = options.nBits ?? 2048
  const fpOptions = JSON.stringify({ radius, nBits })

  const trimmed = query.trim()
  if (trimmed.length === 0) return { queryValid: false, hits: [] }

  let queryFp: string | null = null
  let queryMol: SearchMol | null = null
  try {
    queryMol = rdkit.get_mol(trimmed)
    if (!queryMol || !queryMol.is_valid()) return { queryValid: false, hits: [] }
    const fp = queryMol.get_morgan_fp(fpOptions)
    if (typeof fp === 'string' && fp.length === nBits) queryFp = fp
  } catch {
    return { queryValid: false, hits: [] }
  } finally {
    queryMol?.delete()
  }

  if (!queryFp) return { queryValid: false, hits: [] }

  const hits: SimilarityHit[] = []
  for (const entry of corpus) {
    let target: SearchMol | null = null
    try {
      target = rdkit.get_mol(entry.smiles)
      if (!target || !target.is_valid()) continue
      const fp = target.get_morgan_fp(fpOptions)
      if (typeof fp !== 'string' || fp.length !== nBits) continue
      const similarity = tanimotoSimilarity(queryFp, fp)
      if (similarity >= threshold) {
        hits.push({ id: entry.id, similarity })
      }
    } catch {
      // skip entries RDKit cannot process
    } finally {
      target?.delete()
    }
  }

  hits.sort((a, b) => b.similarity - a.similarity)
  return { queryValid: true, hits: limit === Infinity ? hits : hits.slice(0, limit) }
}
