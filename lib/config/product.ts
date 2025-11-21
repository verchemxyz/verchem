/**
 * VerChem Product Configuration
 *
 * ⚠️ APP-SPECIFIC: This file is specific to VerChem
 * Other Ver* products will have their own version
 *
 * Last Updated: 2025-11-21
 */

import type { ProductConfig } from '@/lib/vercal/types'

/**
 * VerChem Product Configuration
 * Used throughout the app for branding, URLs, etc.
 */
export const PRODUCT_CONFIG: ProductConfig = {
  name: 'VerChem',
  displayName: 'Chemistry Calculator',
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'verchem.xyz',
  primaryColor: '#3B82F6', // Blue
  freeCalculators: [
    'molecular-mass',
    'equation-balancer-basic',
    'ideal-gas-law',
  ],
  paidCalculators: [
    'stoichiometry-full',
    'equation-balancer-advanced',
    'solutions-ph',
    'gas-laws-full',
    'thermodynamics',
    'kinetics',
    'electrochemistry',
    'electron-config',
    'periodic-table',
    'molecular-viewer',
    'lewis-structures',
    'vsepr-geometry',
  ],
}

/**
 * Get full product URL
 */
export function getProductUrl(path: string = ''): string {
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const domain = PRODUCT_CONFIG.domain
  return `${protocol}://${domain}${path}`
}

/**
 * Get return URL for subscription flow
 */
export function getReturnUrl(): string {
  return getProductUrl('/subscription/success')
}

/**
 * Product metadata
 */
export const PRODUCT_METADATA = {
  title: 'VerChem - Professional Chemistry Calculator',
  description:
    'World-class chemistry calculators for students and professionals. Equation balancer, stoichiometry, pH calculator, gas laws, and more.',
  keywords: [
    'chemistry calculator',
    'equation balancer',
    'stoichiometry',
    'pH calculator',
    'gas laws',
    'molecular mass',
    'periodic table',
    'chemical equations',
  ],
  ogImage: '/og-image.png',
  twitterHandle: '@verchem',
}

/**
 * Navigation links
 */
export const NAV_LINKS = [
  { label: 'Calculators', href: '/calculators' },
  { label: 'Periodic Table', href: '/periodic-table' },
  { label: 'Compounds', href: '/compounds' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
]

/**
 * Footer links
 */
export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Roadmap', href: '/roadmap' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Examples', href: '/examples' },
    { label: 'API', href: '/api' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}
