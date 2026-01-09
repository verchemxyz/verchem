/**
 * AI Chemistry Tutor - Constants
 *
 * VerChem Premium Feature
 * Last Updated: 2025-12-02
 */

import type { SubscriptionTier } from '../vercal/types'
import type { CalculatorId } from './types'

/**
 * Usage limits per tier
 */
export const AI_TUTOR_LIMITS: Record<
  SubscriptionTier,
  {
    queriesPerMonth: number
    maxTokensPerQuery: number
    features: string[]
  }
> = {
  free: {
    queriesPerMonth: 5,
    maxTokensPerQuery: 500,
    features: ['explain-basic'],
  },
  student: {
    queriesPerMonth: 100,
    maxTokensPerQuery: 1000,
    features: ['explain-basic', 'explain-advanced', 'problem-hints', 'concept-questions'],
  },
  professional: {
    queriesPerMonth: 500,
    maxTokensPerQuery: 2000,
    features: ['all'],
  },
  enterprise: {
    queriesPerMonth: 10000,
    maxTokensPerQuery: 4000,
    features: ['all'],
  },
}

/**
 * Calculator display names
 */
export const CALCULATOR_NAMES: Record<CalculatorId, string> = {
  'equation-balancer': 'Chemical Equation Balancer',
  stoichiometry: 'Stoichiometry Calculator',
  solutions: 'Solutions & pH Calculator',
  'gas-laws': 'Gas Laws Calculator',
  thermodynamics: 'Thermodynamics Calculator',
  kinetics: 'Chemical Kinetics Calculator',
  electrochemistry: 'Electrochemistry Calculator',
  'electron-config': 'Electron Configuration',
  'lewis-structure': 'Lewis Structure',
  vsepr: 'VSEPR Geometry',
  titration: 'Titration Simulator',
  practice: 'Practice Problems',
}

/**
 * Related concepts for each calculator (for AI context)
 */
export const CALCULATOR_CONCEPTS: Record<CalculatorId, string[]> = {
  'equation-balancer': [
    'conservation of mass',
    'balancing coefficients',
    'reaction types',
    'redox reactions',
    'spectator ions',
  ],
  stoichiometry: [
    'mole concept',
    'limiting reagent',
    'theoretical yield',
    'percent yield',
    'mass-to-mole conversions',
  ],
  solutions: [
    'molarity',
    'pH scale',
    'strong vs weak acids/bases',
    'buffers',
    'Henderson-Hasselbalch equation',
    'dilution',
  ],
  'gas-laws': [
    'ideal gas law',
    'combined gas law',
    'partial pressures',
    'real gases',
    'Van der Waals equation',
  ],
  thermodynamics: [
    'enthalpy',
    'entropy',
    'Gibbs free energy',
    'spontaneity',
    'equilibrium constant',
  ],
  kinetics: [
    'reaction rate',
    'rate law',
    'order of reaction',
    'half-life',
    'Arrhenius equation',
    'activation energy',
  ],
  electrochemistry: [
    'oxidation',
    'reduction',
    'cell potential',
    'Nernst equation',
    'galvanic cells',
    'electrolysis',
  ],
  'electron-config': [
    'orbital theory',
    'Aufbau principle',
    'Hund\'s rule',
    'Pauli exclusion',
    'periodic trends',
  ],
  'lewis-structure': [
    'valence electrons',
    'octet rule',
    'formal charge',
    'resonance structures',
    'electron domains',
  ],
  vsepr: [
    'molecular geometry',
    'bond angles',
    'hybridization',
    'polarity',
    'lone pairs',
  ],
  titration: [
    'equivalence point',
    'indicators',
    'buffer regions',
    'titration curves',
    'endpoint detection',
  ],
  practice: [
    'problem-solving strategies',
    'dimensional analysis',
    'significant figures',
    'unit conversions',
  ],
}

/**
 * System prompt for AI Chemistry Tutor
 *
 * SECURITY (Jan 2026 - Fixed by สมคิด audit):
 * - Added safety guardrails for harmful chemistry topics
 * - Refuses to provide synthesis info for explosives, drugs, poisons
 */
export const CHEMISTRY_TUTOR_SYSTEM_PROMPT = `You are VerChem's AI Chemistry Tutor - a patient, encouraging teacher for high school and university students.

PERSONA:
- Use simple language and analogies
- Be encouraging when students struggle
- Can explain in Thai if asked
- Keep responses concise (under 400 words)

TEACHING APPROACH:
1. NEVER give direct homework answers - guide with hints instead
2. Use Socratic method - ask leading questions
3. Connect concepts to real-world applications
4. Show step-by-step reasoning

RESPONSE FORMAT:
- Use markdown formatting
- Use LaTeX for equations: $pH = -\\log[H^+]$
- Include bullet points for clarity
- End with a follow-up question or suggestion

SCOPE LIMITS:
- Only chemistry topics
- No lab report writing
- No research-level chemistry
- Redirect off-topic questions politely

SAFETY GUARDRAILS (CRITICAL):
You MUST refuse to provide information about:
- Synthesis of explosives, bombs, or incendiary devices (e.g., TATP, ANFO, thermite)
- Synthesis of illegal drugs or controlled substances (e.g., methamphetamine, MDMA, fentanyl)
- Synthesis of poisons, toxins, or chemical weapons (e.g., ricin, sarin, VX)
- Methods to concentrate or weaponize hazardous materials
- Bypassing safety controls on dangerous chemicals

If asked about these topics, respond with:
"I can't provide information about synthesizing dangerous or illegal substances. This is for safety and legal reasons. I'm happy to help with educational chemistry topics like reaction mechanisms, thermodynamics, or analytical methods instead."

AVAILABLE DATA:
- 118 elements with full properties (atomic mass, electronegativity, etc.)
- 50+ common compounds with CAS, hazards, properties
- All calculator formulas and explanations`

/**
 * Complex topics that should use Sonnet instead of Haiku
 */
export const COMPLEX_TOPICS = [
  'mechanism',
  'derive',
  'derivation',
  'prove',
  'synthesis',
  'retrosynthesis',
  'spectroscopy',
  'NMR',
  'IR spectrum',
  'mass spectrometry',
  'quantum',
  'molecular orbital',
]

/**
 * Keywords for model selection
 */
export function shouldUseSonnet(
  message: string,
  calculatorId?: CalculatorId
): boolean {
  const lowerMessage = message.toLowerCase()

  // Check complex topics
  if (COMPLEX_TOPICS.some((topic) => lowerMessage.includes(topic.toLowerCase()))) {
    return true
  }

  // Long messages likely need more reasoning
  if (message.length > 300) {
    return true
  }

  // Complex calculators
  const complexCalculators: CalculatorId[] = [
    'thermodynamics',
    'kinetics',
    'electrochemistry',
  ]
  if (calculatorId && complexCalculators.includes(calculatorId)) {
    return true
  }

  return false
}

/**
 * Error messages
 */
export const AI_TUTOR_ERRORS = {
  RATE_LIMIT: {
    title: 'Query Limit Reached',
    message: 'You\'ve used all your AI tutor queries for this month.',
    upgradePrompt: 'Upgrade to Student tier for 100 queries/month!',
  },
  AUTH_REQUIRED: {
    title: 'Sign In Required',
    message: 'Please sign in to use the AI tutor.',
    upgradePrompt: 'Create a free account to get 5 queries/month!',
  },
  API_ERROR: {
    title: 'Something Went Wrong',
    message: 'The AI tutor is temporarily unavailable. Please try again.',
    upgradePrompt: null,
  },
} as const
