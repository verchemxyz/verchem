'use client'

import React, { useCallback, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  Search,
  ShieldCheck,
  Layers,
  Sparkles,
  FlaskConical,
  BookOpen,
} from 'lucide-react'
import MoleculeInput from '@/components/molecule-editor/MoleculeInput'
import { useRDKit } from '@/lib/rdkit/hook'
import {
  searchCompoundsBySubstructure,
  searchCompoundsBySimilarity,
  SEARCHABLE_COMPOUND_COUNT,
  type CompoundSubstructureHit,
  type CompoundSimilarityHit,
} from '@/lib/rdkit/substructure-search'

type SearchMode = 'substructure' | 'similarity'

// Example query patterns — every one is verified to parse + match against the
// corpus (SMARTS where a functional-group query is clearer than SMILES).
const EXAMPLE_QUERIES: { label: string; query: string; mode: SearchMode }[] = [
  { label: 'Benzene ring', query: 'c1ccccc1', mode: 'substructure' },
  { label: 'Hydroxyl –OH', query: '[OX2H]', mode: 'substructure' },
  { label: 'Carboxylic acid', query: '[CX3](=O)[OX2H1]', mode: 'substructure' },
  { label: 'Carbonyl C=O', query: '[CX3]=[OX1]', mode: 'substructure' },
  { label: 'Primary amine', query: '[NX3;H2]', mode: 'substructure' },
  { label: 'Aldehyde', query: '[CX3H1]=O', mode: 'substructure' },
]

const SMARTS_REFERENCE: { pattern: string; matches: string }[] = [
  { pattern: 'c1ccccc1', matches: 'Aromatic (benzene) ring' },
  { pattern: '[OX2H]', matches: 'Hydroxyl group (alcohols, phenols, acids)' },
  { pattern: '[CX3](=O)[OX2H1]', matches: 'Carboxylic acid' },
  { pattern: '[CX3]=[OX1]', matches: 'Carbonyl (aldehydes, ketones, acids)' },
  { pattern: '[NX3;H2]', matches: 'Primary amine' },
  { pattern: '[CX3H1]=O', matches: 'Aldehyde' },
  { pattern: 'C(=O)O', matches: 'Ester / carboxyl group' },
  { pattern: 'C#N', matches: 'Nitrile' },
]

function categoryLabel(category: string): string {
  return category.replace(/-/g, ' ')
}

export default function SubstructureSearchPage() {
  const [mode, setMode] = useState<SearchMode>('substructure')
  const [query, setQuery] = useState('')
  const [substructureHits, setSubstructureHits] = useState<CompoundSubstructureHit[] | null>(null)
  const [similarityHits, setSimilarityHits] = useState<CompoundSimilarityHit[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedQuery, setSearchedQuery] = useState('')

  const { isLoading: rdkitLoading, error: rdkitHookError } = useRDKit()

  const runSearch = useCallback(
    async (rawQuery: string, searchMode: SearchMode) => {
      const q = rawQuery.trim()
      if (!q) {
        setError('Enter or draw a structure to search.')
        return
      }

      setIsSearching(true)
      setError(null)
      setSubstructureHits(null)
      setSimilarityHits(null)

      // Yield once so the loading spinner paints before the (synchronous)
      // search loop over the corpus runs on the main thread.
      await new Promise((resolve) => setTimeout(resolve, 0))

      try {
        if (searchMode === 'substructure') {
          const { queryValid, hits } = await searchCompoundsBySubstructure(q, { limit: 100 })
          if (!queryValid) {
            setError('Could not parse that query. Try a SMILES (e.g. c1ccccc1) or SMARTS pattern.')
            return
          }
          setSubstructureHits(hits)
        } else {
          const { queryValid, hits } = await searchCompoundsBySimilarity(q, {
            threshold: 0.3,
            limit: 50,
          })
          if (!queryValid) {
            setError('Similarity search needs a valid SMILES molecule (e.g. CCO).')
            return
          }
          setSimilarityHits(hits)
        }
        setSearchedQuery(q)
      } catch {
        setError('Search failed. The chemistry engine may still be loading — try again.')
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  const handleSearch = () => void runSearch(query, mode)

  const handleExample = (example: (typeof EXAMPLE_QUERIES)[number]) => {
    setMode(example.mode)
    setQuery(example.query)
    void runSearch(example.query, example.mode)
  }

  const hits =
    mode === 'substructure' ? substructureHits : similarityHits
  const hasResults = hits !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm text-teal-300 mb-6">
            <ShieldCheck className="h-4 w-4" />
            {SEARCHABLE_COMPOUND_COUNT} verified structures
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Substructure
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              Search
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Draw or paste a fragment — find every compound that contains it.
            Powered by RDKit, matched on real molecular connectivity, not text.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-400" /> SMILES &amp; SMARTS
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-400" /> Formula-verified library
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-400" /> 100% Free
            </span>
          </div>
        </div>
      </section>

      {/* Search panel */}
      <section className="px-4 pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900/90 to-teal-900/20 p-6 sm:p-8 shadow-2xl shadow-teal-500/10 backdrop-blur-sm space-y-6">
            {/* Mode toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMode('substructure')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'substructure'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Layers className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                Substructure
              </button>
              <button
                onClick={() => setMode('similarity')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'similarity'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Sparkles className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                Similarity
              </button>
              {rdkitHookError && (
                <span className="text-xs text-amber-400 self-center ml-2">
                  Chemistry engine unavailable — reload the page
                </span>
              )}
            </div>

            <p className="text-sm text-slate-400">
              {mode === 'substructure'
                ? 'Find compounds that contain this fragment. Accepts SMILES or SMARTS.'
                : 'Rank compounds by Morgan-fingerprint similarity to this molecule (SMILES).'}
            </p>

            <MoleculeInput
              value={query}
              onChange={setQuery}
              label={mode === 'substructure' ? 'Query fragment' : 'Query molecule'}
              placeholder={mode === 'substructure' ? 'e.g. c1ccccc1 or [OX2H]' : 'e.g. CCO'}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSearch}
                disabled={isSearching || rdkitLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-3 font-semibold text-white transition-all hover:from-teal-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Search
                  </>
                )}
              </button>
              {rdkitLoading && (
                <span className="text-sm text-slate-400">Loading chemistry engine…</span>
              )}
            </div>

            {/* Example chips */}
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => handleExample(ex)}
                    disabled={isSearching || rdkitLoading}
                    className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs text-teal-200 hover:bg-teal-500/20 transition-colors disabled:opacity-50"
                    title={ex.query}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      {hasResults && (
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {hits.length} {hits.length === 1 ? 'match' : 'matches'}
              </h2>
              {searchedQuery && (
                <span className="text-sm text-slate-400 font-mono truncate max-w-[50%]">
                  {mode === 'substructure' ? 'contains' : 'similar to'} {searchedQuery}
                </span>
              )}
            </div>

            {hits.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No compounds in the verified library match this query.
                {mode === 'substructure'
                  ? ' Try a smaller fragment (e.g. just c1ccccc1).'
                  : ' Try lowering the bar with a closely related molecule.'}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mode === 'substructure'
                  ? (hits as CompoundSubstructureHit[]).map(({ compound, atomIndices }) => (
                      <Link
                        key={compound.id}
                        href={`/compounds/${compound.id}`}
                        className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-teal-500/50 hover:bg-teal-500/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-white group-hover:text-teal-300 transition-colors">
                            {compound.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        </div>
                        <p className="font-mono text-teal-400 text-sm mb-3">{compound.formula}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300 capitalize">
                            {categoryLabel(compound.category)}
                          </span>
                          <span className="text-teal-300">{atomIndices.length} atoms matched</span>
                        </div>
                      </Link>
                    ))
                  : (hits as CompoundSimilarityHit[]).map(({ compound, similarity }) => (
                      <Link
                        key={compound.id}
                        href={`/compounds/${compound.id}`}
                        className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-teal-500/50 hover:bg-teal-500/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-semibold text-white group-hover:text-teal-300 transition-colors">
                            {compound.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        </div>
                        <p className="font-mono text-teal-400 text-sm mb-3">{compound.formula}</p>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300 capitalize">
                            {categoryLabel(compound.category)}
                          </span>
                          <span className="text-teal-300">{(similarity * 100).toFixed(0)}% similar</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                            style={{ width: `${Math.round(similarity * 100)}%` }}
                          />
                        </div>
                      </Link>
                    ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How structure search works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Layers,
                title: 'Substructure match',
                description:
                  'Your fragment becomes a query graph. RDKit checks whether it embeds inside each compound’s real bond network — so c1ccccc1 finds every benzene ring, not every "C6H6".',
              },
              {
                icon: Sparkles,
                title: 'Similarity ranking',
                description:
                  'Each molecule is hashed into a Morgan (ECFP) fingerprint. Tanimoto similarity ranks the library by how many structural features it shares with your query.',
              },
              {
                icon: ShieldCheck,
                title: 'Verified corpus',
                description:
                  'Every structure’s SMILES is cross-checked against its NIST molecular formula by the calculation engine before it can be searched — no silent bad data.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <item.icon className="h-8 w-8 text-teal-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SMARTS reference */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Pattern reference</h2>
          <p className="text-slate-400 text-center mb-10">
            Common SMILES / SMARTS queries you can paste into the search box
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {SMARTS_REFERENCE.map((row, i) => (
              <div
                key={row.pattern}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i !== 0 ? 'border-t border-white/5' : ''
                }`}
              >
                <code className="text-teal-400 text-sm font-mono w-44 shrink-0">{row.pattern}</code>
                <span className="text-slate-300 text-sm">{row.matches}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'What is the difference between substructure and similarity search?',
                a: 'Substructure search returns compounds that strictly contain your fragment as a subgraph. Similarity search returns compounds that are structurally close overall, ranked by Tanimoto similarity of their fingerprints — useful when there is no exact fragment in common.',
              },
              {
                q: 'Why can’t I just search by molecular formula?',
                a: 'A formula like C6H6 tells you the atom counts, not how the atoms are bonded. Substructure matching needs connectivity, which is why this tool searches a curated library of verified SMILES structures rather than the full formula database.',
              },
              {
                q: 'Do I need to know SMARTS?',
                a: 'No. You can draw a structure or paste a plain SMILES (e.g. c1ccccc1 for benzene). SMARTS just gives you finer control over functional-group queries like [OX2H] for any hydroxyl group.',
              },
              {
                q: 'How is the library kept accurate?',
                a: 'Every SMILES in the searchable library is verified at build time: RDKit computes its element composition and it must match the compound’s independently-sourced molecular formula, or the test fails.',
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-6">More chemistry tools</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/draw"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              <FlaskConical className="h-4 w-4" /> Structure Editor
            </Link>
            <Link
              href="/tools/molar-mass"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              Molar Mass
            </Link>
            <Link
              href="/compounds"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white hover:bg-white/20 transition-colors"
            >
              <BookOpen className="h-4 w-4" /> Compounds Database
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 font-medium text-white hover:from-teal-500 hover:to-cyan-500 transition-colors"
            >
              All Tools <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
