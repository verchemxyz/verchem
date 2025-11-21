#!/usr/bin/env tsx

// VerChem - Search Engine Smoke Tests
// Lightweight checks to ensure core search queries behave as expected.

import { VerChemSearchEngine } from '../lib/search/engine'
import type { SearchFilters, SearchOptions, SearchQuery } from '../lib/search/types'

function createQuery(query: string, filters: SearchFilters = {}, options: SearchOptions = {}): SearchQuery {
  return {
    query,
    filters,
    options: {
      fuzzy: true,
      includeSynonyms: true,
      limit: 20,
      sortBy: 'relevance',
      sortOrder: 'desc',
      ...options,
    },
  }
}

async function run() {
  const engine = new VerChemSearchEngine()

  const cases: Array<{
    name: string
    query: string
    filters?: SearchFilters
  }> = [
    {
      name: 'Basic compound search',
      query: 'water',
    },
    {
      name: 'Exact phrase',
      query: '"sodium chloride"',
    },
    {
      name: 'NOT operator',
      query: 'acid NOT organic',
    },
    {
      name: 'Molecular weight range',
      query: 'MW:50-150',
    },
    {
      name: 'Atomic number range',
      query: 'AN:1-10',
    },
    {
      name: 'pKa range (acids)',
      query: 'pKa:0-5',
    },
    {
      name: 'pKb range (bases)',
      query: 'pKb:0-7',
    },
    {
      name: 'Field filter: compounds only',
      query: 'type:compound molecular weight',
    },
    {
      name: 'OR group',
      query: '(acid OR base)',
    },
    {
      name: 'Combined range + field',
      query: 'type:compound MW:50-150 pKa:0-7',
    },
  ]

  console.log('=== VerChem Search Smoke Tests ===')

  for (const testCase of cases) {
    const searchQuery = createQuery(testCase.query, testCase.filters)
    const results = engine.search(searchQuery)

    const summary = results.slice(0, 3).map(r => `${r.type}:${r.title}`).join(' | ')

    console.log(`\n[${testCase.name}]`)
    console.log(`Query: "${testCase.query}"`)
    console.log(`Results: ${results.length}`)
    if (summary) {
      console.log(`Top hits: ${summary}`)
    }
  }

  console.log('\nSearch smoke tests completed.')
}

run().catch(error => {
  console.error('Search smoke tests failed:', error)
  process.exitCode = 1
})
