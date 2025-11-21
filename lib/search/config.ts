// VerChem Search System Configuration

import { SearchIndexConfig } from './types'

export const SEARCH_CONFIG: SearchIndexConfig = {
  compoundFields: [
    'name',
    'formula',
    'iupacName',
    'cas',
    'uses',
    'thaiName',
    'appearance',
    'odor'
  ],
  elementFields: [
    'name',
    'symbol',
    'electronConfiguration',
    'discoverer',
    'nameMeaning'
  ],
  calculatorFields: [
    'name',
    'description',
    'category',
    'type',
    'formula',
    'examples'
  ],
  helpFields: [
    'title',
    'content',
    'tags',
    'relatedTopics'
  ],
  weights: {
    'name': 0.4,
    'title': 0.4,
    'symbol': 0.3,
    'description': 0.3,
    'content': 0.2,
    'tags': 0.2,
    'formula': 0.25,
    'category': 0.1,
    'type': 0.1,
    'uses': 0.15,
    'cas': 0.1,
    'iupacName': 0.2,
    'thaiName': 0.15,
    'electronConfiguration': 0.1,
    'discoverer': 0.1,
    'nameMeaning': 0.1,
    'examples': 0.15,
    'relatedTopics': 0.1
  },
  threshold: 0.3,
  distance: 100
}

export const SEARCH_CATEGORIES = {
  compound: {
    label: 'Chemical Compounds',
    icon: 'beaker',
    color: 'blue',
    fields: ['name', 'formula', 'molecularMass', 'cas', 'appearance', 'hazards', 'uses']
  },
  element: {
    label: 'Chemical Elements',
    icon: 'atom',
    color: 'green',
    fields: ['name', 'symbol', 'atomicNumber', 'atomicMass', 'category', 'electronConfiguration']
  },
  calculator: {
    label: 'Calculators & Tools',
    icon: 'calculator',
    color: 'purple',
    fields: ['name', 'description', 'category', 'difficulty', 'educationalLevel']
  },
  help: {
    label: 'Help & Documentation',
    icon: 'book',
    color: 'orange',
    fields: ['title', 'content', 'category', 'difficulty', 'tags']
  }
}

export const POPULAR_SEARCHES = [
  'water',
  'sodium chloride',
  'hydrochloric acid',
  'sulfuric acid',
  'methane',
  'ethanol',
  'benzene',
  'glucose',
  'aspirin',
  'caffeine',
  'periodic table',
  'molecular weight',
  'stoichiometry',
  'equation balancer',
  'gas laws',
  'thermodynamics',
  'kinetics',
  'titration',
  'electron configuration',
  'lewis structures',
  'vsepr theory',
  'acid base',
  'oxidation reduction',
  'organic chemistry'
]

export const SEARCH_EXAMPLES = {
  basic: [
    { query: 'water', description: 'Find information about water' },
    { query: 'NaCl', description: 'Search for sodium chloride' },
    { query: 'periodic table', description: 'Access the periodic table' }
  ],
  advanced: [
    { query: '"sodium chloride"', description: 'Exact phrase search' },
    { query: 'acid NOT organic', description: 'Exclude organic acids' },
    { query: 'MW:100-200', description: 'Molecular weight range' },
    { query: 'stoichiometry calculator', description: 'Find specific calculator' }
  ],
  expert: [
    { query: 'c1ccccc1', description: 'SMILES notation for benzene' },
    { query: 'CCO', description: 'SMILES for ethanol' },
    { query: 'group:1 period:1', description: 'Filter elements by group and period' }
  ]
}

export const VOICE_SEARCH_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'th-TH', name: 'Thai' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }
]

export const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'csv', label: 'CSV', description: 'Comma-Separated Values' },
  { value: 'txt', label: 'Plain Text', description: 'Simple text format' }
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', description: 'Most relevant results first' },
  { value: 'name', label: 'Name', description: 'Alphabetical by name' },
  { value: 'date', label: 'Date', description: 'Most recent first' },
  { value: 'popularity', label: 'Popularity', description: 'Most popular first' },
  { value: 'molecularWeight', label: 'Molecular Weight', description: 'By molecular weight' },
  { value: 'atomicNumber', label: 'Atomic Number', description: 'By atomic number' }
]

export const FILTER_OPTIONS = {
  compound: {
    molecularWeight: { min: 0, max: 10000, step: 1 },
    meltingPoint: { min: -300, max: 5000, step: 1 },
    boilingPoint: { min: -300, max: 5000, step: 1 },
    density: { min: 0, max: 25, step: 0.1 },
    hazards: ['flammable', 'toxic', 'corrosive', 'oxidizer', 'explosive', 'carcinogen', 'irritant', 'environmental'],
    ghsCodes: ['H225', 'H301', 'H314', 'H330', 'H400']
  },
  element: {
    atomicNumber: { min: 1, max: 118, step: 1 },
    group: { min: 1, max: 18, step: 1 },
    period: { min: 1, max: 7, step: 1 },
    electronegativity: { min: 0, max: 4, step: 0.1 },
    ionizationEnergy: { min: 0, max: 2500, step: 1 },
    category: ['alkali-metal', 'alkaline-earth-metal', 'transition-metal', 'post-transition-metal', 'metalloid', 'nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide']
  },
  calculator: {
    difficulty: ['basic', 'intermediate', 'advanced'],
    educationalLevel: ['middle-school', 'high-school', 'college', 'university'],
    category: ['reactions', 'properties', 'physical', 'thermodynamics', 'kinetics', 'analytical', 'atomic', 'molecular']
  }
}

export const SEARCH_ANALYTICS_EVENTS = {
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  RESULT_CLICKED: 'result_clicked',
  VOICE_SEARCH_USED: 'voice_search_used',
  BOOKMARK_CREATED: 'bookmark_created',
  HISTORY_CLEARED: 'history_cleared',
  EXPORT_USED: 'export_used'
} as const

export const SEARCH_CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100,
  KEY_PREFIX: 'verchem_search_'
}

export const SEARCH_LIMITS = {
  MAX_QUERY_LENGTH: 500,
  MAX_RESULTS: 1000,
  MAX_SUGGESTIONS: 20,
  MAX_HISTORY_ITEMS: 50,
  MAX_BOOKMARKS: 100
}