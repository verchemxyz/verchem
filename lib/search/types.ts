// VerChem Advanced Search System - Type Definitions

export interface SearchResult {
  id: string
  type: 'compound' | 'element' | 'calculator' | 'help' | 'tool'
  title: string
  subtitle?: string
  description: string
  icon?: string
  category: string
  tags: string[]
  relevance: number
  data: unknown
  url: string
  thumbnail?: string
}

export interface SearchFilters {
  type?: string[]
  category?: string[]
  properties?: Record<string, unknown>
  safety?: string[]
  applications?: string[]
  difficulty?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  molecularWeightRange?: {
    min?: number
    max?: number
  }
  meltingPointRange?: {
    min?: number
    max?: number
  }
  boilingPointRange?: {
    min?: number
    max?: number
  }
  atomicNumberRange?: {
    min?: number
    max?: number
  }
  pKaRange?: {
    min?: number
    max?: number
  }
  pKbRange?: {
    min?: number
    max?: number
  }
  group?: number[]
  period?: number[]
  block?: string[]
  elementCategory?: string[]
  hazardLevel?: string[]
  ghsCodes?: string[]
}

export interface SearchQuery {
  query: string
  filters: SearchFilters
  options: SearchOptions
}

export interface SearchOptions {
  fuzzy?: boolean
  caseSensitive?: boolean
  includeSynonyms?: boolean
  includeRelated?: boolean
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'name' | 'date' | 'popularity' | 'molecularWeight' | 'atomicNumber'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: Date
  resultCount: number
  filters?: SearchFilters
}

export interface SearchBookmark {
  id: string
  name: string
  query: string
  filters?: SearchFilters
  createdAt: Date
  count?: number
}

export interface SearchAnalytics {
  totalSearches: number
  popularQueries: Array<{ query: string; count: number }>
  noResultsQueries: Array<{ query: string; count: number }>
  filterUsage: Record<string, number>
  searchTypes: Record<string, number>
}

export interface CompoundSearchData {
  id: string
  name: string
  formula: string
  molecularMass: number
  pKa?: number
  pKb?: number
  smiles?: string
  inchi?: string
  cas?: string
  meltingPoint?: number
  boilingPoint?: number
  density?: number
  solubility?: string
  appearance?: string
  hazards?: string[]
  ghsCodes?: string[]
  uses?: string[]
  category: string
  tags: string[]
  thaiName?: string
}

export interface ElementSearchData {
  atomicNumber: number
  symbol: string
  name: string
  atomicMass: number
  category: string
  group?: number
  period: number
  block: string
  electronConfiguration: string
  electronegativity?: number
  ionizationEnergy?: number
  meltingPoint?: number
  boilingPoint?: number
  density?: number
  discoveryYear?: number
  discoverer?: string
  applications?: string[]
  tags: string[]
}

export interface CalculatorSearchData {
  id: string
  name: string
  description: string
  category: string
  type: string
  formula?: string
  inputs: Array<{
    name: string
    type: string
    unit?: string
    description?: string
  }>
  outputs: Array<{
    name: string
    type: string
    unit?: string
    description?: string
  }>
  examples?: string[]
  difficulty: 'basic' | 'intermediate' | 'advanced'
  educationalLevel: string[]
  tags: string[]
  url: string
}

export interface HelpSearchData {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  relatedTopics?: string[]
  difficulty?: string
  url: string
}

export interface VoiceSearchConfig {
  enabled: boolean
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

export interface SearchIndexConfig {
  compoundFields: string[]
  elementFields: string[]
  calculatorFields: string[]
  helpFields: string[]
  weights: Record<string, number>
  threshold: number
  distance: number
}

export interface AdvancedQuerySyntax {
  mustInclude: string[]
  mustExclude: string[]
  exactPhrases: string[]
  ranges: Array<{
    field: string
    min?: number
    max?: number
  }>
  wildcards: string[]
  orGroups: string[][]
  fieldFilters: Array<{
    field: string
    value: string
  }>
}
