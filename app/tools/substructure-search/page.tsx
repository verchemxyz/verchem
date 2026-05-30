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
import { CalcShell, Card, SectionTitle, Button, ErrorBanner } from '@/components/lab'
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
        setSubstructureHits(null)
        setSimilarityHits(null)
        setSearchedQuery('')
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
          // No limit: the corpus is small (~209) and substructure match is a
          // boolean contains-or-not, so the displayed count must be the TRUE
          // total — not a silently-capped subset.
          const { queryValid, hits } = await searchCompoundsBySubstructure(q)
          if (!queryValid) {
            setError('Could not parse that query. Try a SMILES (e.g. c1ccccc1) or SMARTS pattern.')
            return
          }
          setSubstructureHits(hits)
        } else {
          const { queryValid, hits } = await searchCompoundsBySimilarity(q, {
            threshold: 0.3,
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
    <CalcShell
      eyebrow={`${SEARCHABLE_COMPOUND_COUNT} verified structures`}
      title="Substructure Search"
      subtitle="Draw or paste a fragment — find every compound that contains it. Powered by RDKit, matched on real molecular connectivity, not text."
      backHref="/tools"
      backLabel="All tools"
      maxWidth="6xl"
    >
      {/* Capability strip */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" /> SMILES &amp; SMARTS
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" /> Formula-verified library
        </span>
        <span className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" /> 100% Free
        </span>
      </div>

      {/* Search panel */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Mode toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMode('substructure')}
            aria-pressed={mode === 'substructure'}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'substructure'
                ? 'bg-primary-500 text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            <Layers className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Substructure
          </button>
          <button
            onClick={() => setMode('similarity')}
            aria-pressed={mode === 'similarity'}
            className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'similarity'
                ? 'bg-primary-500 text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            <Sparkles className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Similarity
          </button>
          {rdkitHookError && (
            <span className="text-xs text-warning-strong self-center ml-2">
              Chemistry engine unavailable — reload the page
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
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
          <Button
            onClick={handleSearch}
            disabled={isSearching || rdkitLoading}
          >
            {isSearching ? (
              <>
                <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
          {rdkitLoading && (
            <span className="text-sm text-muted-foreground">Loading chemistry engine…</span>
          )}
        </div>

        {/* Example chips */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExample(ex)}
                disabled={isSearching || rdkitLoading}
                className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-foreground hover:bg-card hover:border-primary-500 transition-colors disabled:opacity-50"
                title={ex.query}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}
      </Card>

      {/* Results */}
      {hasResults && (
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {hits.length} {hits.length === 1 ? 'match' : 'matches'}
            </h2>
            {searchedQuery && (
              <span className="text-sm text-muted-foreground font-mono truncate max-w-[50%]">
                {mode === 'substructure' ? 'contains' : 'similar to'} {searchedQuery}
              </span>
            )}
          </div>

          {hits.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No compounds in the verified library match this query.
              {mode === 'substructure'
                ? ' Try a smaller fragment (e.g. just c1ccccc1).'
                : ' Try lowering the bar with a closely related molecule.'}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mode === 'substructure'
                ? (hits as CompoundSubstructureHit[]).map(({ compound, atomIndices }) => (
                    <Link
                      key={compound.id}
                      href={`/compounds/${compound.id}`}
                      className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary-500 hover:bg-muted"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                          {compound.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </div>
                      <p className="font-mono text-primary-600 text-sm mb-3">{compound.formula}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-muted-foreground capitalize">
                          {categoryLabel(compound.category)}
                        </span>
                        <span className="text-primary-600">{atomIndices.length} atoms matched</span>
                      </div>
                    </Link>
                  ))
                : (hits as CompoundSimilarityHit[]).map(({ compound, similarity }) => (
                    <Link
                      key={compound.id}
                      href={`/compounds/${compound.id}`}
                      className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary-500 hover:bg-muted"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                          {compound.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                      </div>
                      <p className="font-mono text-primary-600 text-sm mb-3">{compound.formula}</p>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-muted-foreground capitalize">
                          {categoryLabel(compound.category)}
                        </span>
                        <span className="text-primary-600">{(similarity * 100).toFixed(0)}% similar</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${Math.round(similarity * 100)}%` }}
                        />
                      </div>
                    </Link>
                  ))}
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <Card className="p-6 sm:p-8">
        <SectionTitle className="mb-6 text-center">How structure search works</SectionTitle>
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
            <div key={item.title} className="rounded-lg border border-border bg-muted p-6">
              <item.icon className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* SMARTS reference */}
      <Card className="p-6 sm:p-8">
        <SectionTitle className="mb-2 text-center">Pattern reference</SectionTitle>
        <p className="text-muted-foreground text-center mb-8">
          Common SMILES / SMARTS queries you can paste into the search box
        </p>
        <div className="rounded-lg border border-border overflow-hidden">
          {SMARTS_REFERENCE.map((row, i) => (
            <div
              key={row.pattern}
              className={`flex items-center gap-4 px-6 py-4 ${
                i !== 0 ? 'border-t border-border' : ''
              }`}
            >
              <code className="text-primary-600 text-sm font-mono w-44 shrink-0">{row.pattern}</code>
              <span className="text-foreground text-sm">{row.matches}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6 sm:p-8">
        <SectionTitle className="mb-8 text-center">Frequently asked questions</SectionTitle>
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
            <div key={i} className="rounded-lg border border-border bg-muted p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">{faq.q}</h3>
              <p className="text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-6 sm:p-8 text-center">
        <SectionTitle className="mb-6">More chemistry tools</SectionTitle>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/draw"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          >
            <FlaskConical className="h-4 w-4" /> Structure Editor
          </Link>
          <Link
            href="/tools/molar-mass"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          >
            Molar Mass
          </Link>
          <Link
            href="/compounds"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors min-h-[44px]"
          >
            <BookOpen className="h-4 w-4" /> Compounds Database
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 rounded-md font-medium px-6 py-3 min-h-[44px] bg-primary-500 text-primary-foreground hover:bg-primary-600 transition-colors"
          >
            All Tools <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </CalcShell>
  )
}
