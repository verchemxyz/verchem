/**
 * VerChem Calculator Configuration
 *
 * ⚠️ APP-SPECIFIC: This file is specific to VerChem
 * Other Ver* products (VerCivil, VerElect) will have their own version
 *
 * Defines which calculators are free vs paid
 *
 * Last Updated: 2025-11-21
 */

import type { Calculator, SubscriptionTier } from '@/lib/vercal/types'

/**
 * All VerChem Calculators
 * Each calculator specifies minimum required tier
 */
export const VERCHEM_CALCULATORS: Calculator[] = [
  // ==========================================
  // FREE TIER (3 calculators)
  // ==========================================
  {
    id: 'molecular-mass',
    name: 'Molecular Mass Calculator',
    description: 'Calculate molecular mass from chemical formula',
    tier: 'free',
    path: '/calculators/stoichiometry?mode=molecular-mass',
    icon: '⚖️',
  },
  {
    id: 'equation-balancer-basic',
    name: 'Basic Equation Balancer',
    description: 'Balance simple chemical equations (max 4 compounds)',
    tier: 'free',
    path: '/calculators/equation-balancer',
    icon: '⚗️',
  },
  {
    id: 'ideal-gas-law',
    name: 'Ideal Gas Law',
    description: 'Calculate using PV=nRT',
    tier: 'free',
    path: '/calculators/gas-laws?mode=ideal',
    icon: '💨',
  },

  // ==========================================
  // PAID TIER (Student+) - 10 more calculators
  // ==========================================

  // Stoichiometry
  {
    id: 'stoichiometry-full',
    name: 'Advanced Stoichiometry',
    description: '8 modes: Limiting reagent, theoretical yield, percent composition, etc.',
    tier: 'student',
    path: '/calculators/stoichiometry',
    icon: '🧬',
  },

  // Equation Balancer
  {
    id: 'equation-balancer-advanced',
    name: 'Advanced Equation Balancer',
    description: 'Balance complex equations with unlimited compounds',
    tier: 'student',
    path: '/calculators/equation-balancer',
    icon: '⚗️',
  },

  // Solutions & pH
  {
    id: 'solutions-ph',
    name: 'Solutions & pH Calculator',
    description: '7 modes: Molarity, pH, weak acid/base, buffers, dilution',
    tier: 'student',
    path: '/calculators/solutions',
    icon: '🧪',
  },

  // Gas Laws
  {
    id: 'gas-laws-full',
    name: 'Complete Gas Laws',
    description: '9 modes: Ideal, Combined, Boyle, Charles, Van der Waals, etc.',
    tier: 'student',
    path: '/calculators/gas-laws',
    icon: '💨',
  },

  // Thermodynamics
  {
    id: 'thermodynamics',
    name: 'Thermodynamics Calculator',
    description: 'Calculate ΔH, ΔS, ΔG, equilibrium constants',
    tier: 'student',
    path: '/calculators/thermodynamics',
    icon: '🔥',
  },

  // Kinetics
  {
    id: 'kinetics',
    name: 'Chemical Kinetics',
    description: 'Rate laws, half-life, Arrhenius equation',
    tier: 'student',
    path: '/calculators/kinetics',
    icon: '⏱️',
  },

  // Electrochemistry
  {
    id: 'electrochemistry',
    name: 'Electrochemistry Calculator',
    description: 'Redox reactions, galvanic cells, Nernst equation',
    tier: 'student',
    path: '/calculators/electrochemistry',
    icon: '⚡',
  },

  // Electron Configuration
  {
    id: 'electron-config',
    name: 'Electron Configuration',
    description: 'Full orbital diagrams, noble gas notation',
    tier: 'student',
    path: '/calculators/electron-configuration',
    icon: '⚛️',
  },

  // Interactive Tools
  {
    id: 'periodic-table',
    name: 'Interactive Periodic Table',
    description: 'All 118 elements with complete data',
    tier: 'student',
    path: '/periodic-table',
    icon: '🔬',
  },
  {
    id: 'molecular-viewer',
    name: '3D Molecular Viewer',
    description: 'Visualize molecular structures in 3D',
    tier: 'student',
    path: '/tools/molecular-viewer',
    icon: '🌐',
  },
  {
    id: 'lewis-structures',
    name: 'Lewis Structure Builder',
    description: 'Draw and validate Lewis structures',
    tier: 'student',
    path: '/tools/lewis-structures',
    icon: '📐',
  },
  {
    id: 'vsepr-geometry',
    name: 'VSEPR Geometry',
    description: 'Predict molecular shapes and bond angles',
    tier: 'student',
    path: '/tools/vsepr',
    icon: '🔺',
  },
]

/**
 * Get calculators by tier
 */
export function getCalculatorsByTier(tier: SubscriptionTier): Calculator[] {
  const tierValue = { free: 0, student: 1, professional: 2, enterprise: 3 }[tier]

  return VERCHEM_CALCULATORS.filter((calc) => {
    const calcTierValue = { free: 0, student: 1, professional: 2, enterprise: 3 }[calc.tier]
    return calcTierValue <= tierValue
  })
}

/**
 * Get free calculators
 */
export function getFreeCalculators(): Calculator[] {
  return VERCHEM_CALCULATORS.filter((calc) => calc.tier === 'free')
}

/**
 * Get paid calculators
 */
export function getPaidCalculators(): Calculator[] {
  return VERCHEM_CALCULATORS.filter((calc) => calc.tier !== 'free')
}

/**
 * Find calculator by ID
 */
export function getCalculatorById(id: string): Calculator | undefined {
  return VERCHEM_CALCULATORS.find((calc) => calc.id === id)
}

/**
 * Check if calculator requires payment
 */
export function isCalculatorPaid(calculatorId: string): boolean {
  const calculator = getCalculatorById(calculatorId)
  return calculator ? calculator.tier !== 'free' : false
}

/**
 * Count calculators by tier
 */
export const CALCULATOR_COUNTS = {
  free: getFreeCalculators().length,
  paid: getPaidCalculators().length,
  total: VERCHEM_CALCULATORS.length,
}
