/**
 * VerChem Calculator Configuration
 *
 * ⚠️ APP-SPECIFIC: This file is specific to VerChem
 * Other Ver* products (VerCivil, VerElect) will have their own version
 *
 * 🎁 FREE STRATEGY (Dec 2025):
 * - ALL features FREE for AIVerID members
 * - Must login via AIVerID to access
 * - Early Bird members get discounted pricing when we monetize
 *
 * Last Updated: 2025-12-03
 */

import type { Calculator, SubscriptionTier } from '@/lib/vercal/types'
import { SOLUTIONS_MODE_COUNT } from '@/lib/config/solutions'

/**
 * All VerChem Calculators
 * 🎁 ALL calculators are FREE for AIVerID members!
 */
export const VERCHEM_CALCULATORS: Calculator[] = [
  // ==========================================
  // ALL FREE FOR AIVERID MEMBERS! 🎁
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
    name: 'Equation Balancer',
    description: 'Balance chemical equations automatically',
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
  {
    id: 'stoichiometry-full',
    name: 'Advanced Stoichiometry',
    description: '8 modes: Limiting reagent, theoretical yield, percent composition, etc.',
    tier: 'free',
    path: '/calculators/stoichiometry',
    icon: '🧬',
  },
  {
    id: 'equation-balancer-advanced',
    name: 'Advanced Equation Balancer',
    description: 'Balance complex equations with unlimited compounds',
    tier: 'free',
    path: '/calculators/equation-balancer',
    icon: '⚗️',
  },
  {
    id: 'solutions-ph',
    name: 'Solutions & pH Calculator',
    description: `${SOLUTIONS_MODE_COUNT} modes: molarity, strong/weak acid and base pH, buffers, dilution, and four-way pH conversion`,
    tier: 'free',
    path: '/calculators/solutions',
    icon: '🧪',
  },
  {
    id: 'gas-laws-full',
    name: 'Complete Gas Laws',
    description: '9 modes: Ideal, Combined, Boyle, Charles, Van der Waals, etc.',
    tier: 'free',
    path: '/calculators/gas-laws',
    icon: '💨',
  },
  {
    id: 'thermodynamics',
    name: 'Thermodynamics Calculator',
    description: 'Calculate ΔH, ΔS, ΔG, equilibrium constants',
    tier: 'free',
    path: '/calculators/thermodynamics',
    icon: '🔥',
  },
  {
    id: 'kinetics',
    name: 'Chemical Kinetics',
    description: 'Rate laws, half-life, Arrhenius equation',
    tier: 'free',
    path: '/calculators/kinetics',
    icon: '⏱️',
  },
  {
    id: 'electrochemistry',
    name: 'Electrochemistry Calculator',
    description: 'Redox reactions, galvanic cells, Nernst equation',
    tier: 'free',
    path: '/calculators/electrochemistry',
    icon: '⚡',
  },
  {
    id: 'electron-config',
    name: 'Electron Configuration',
    description: 'Full orbital diagrams, noble gas notation',
    tier: 'free',
    path: '/calculators/electron-configuration',
    icon: '⚛️',
  },
  {
    id: 'periodic-table',
    name: 'Interactive Periodic Table',
    description: 'All 118 elements with per-record property coverage',
    tier: 'free',
    path: '/periodic-table',
    icon: '🔬',
  },
  {
    id: 'molecular-viewer',
    name: '3D Molecular Viewer',
    description: 'Visualize molecular structures in 3D',
    tier: 'free',
    path: '/tools/molecular-viewer',
    icon: '🌐',
  },
  {
    id: 'lewis-structures',
    name: 'Lewis Structure Builder',
    description: 'Draw and validate Lewis structures',
    tier: 'free',
    path: '/tools/lewis-structures',
    icon: '📐',
  },
  {
    id: 'vsepr-geometry',
    name: 'VSEPR Geometry',
    description: 'Predict molecular shapes and bond angles',
    tier: 'free',
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
