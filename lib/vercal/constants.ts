/**
 * VerCal Ecosystem - Universal Constants
 *
 * ✅ UNIVERSAL: Copy this file to ALL Ver* products
 * These constants are the same across the entire VerCal ecosystem.
 *
 * Last Updated: 2025-11-21
 */

import type { SubscriptionTier, PricingTier } from './types'

/**
 * AIVerID Configuration
 * Central authentication and subscription management
 */
export const AIVERID_CONFIG = {
  URL: process.env.NEXT_PUBLIC_AIVERID_URL || 'https://aiverid.com',
  API_URL: process.env.AIVERID_API_URL || 'https://aiverid.com/api',
  CLIENT_ID: process.env.AIVERID_CLIENT_ID || '',
  CLIENT_SECRET: process.env.AIVERID_CLIENT_SECRET || '',
  JWT_PUBLIC_KEY: process.env.AIVERID_JWT_PUBLIC_KEY || '',
} as const

/**
 * Unified Pricing (Same for ALL VerCal products)
 */
export const PRICING = {
  student: {
    monthly: 4.99,
    yearly: 49.99,
    yearlyDiscount: 17, // 17% off vs monthly
  },
  professional: {
    monthly: 14.99,
    yearly: 149.99,
    yearlyDiscount: 17,
  },
  enterprise: {
    yearly: 499,
    custom: true, // Custom pricing for 100+ users
  },
} as const

/**
 * Stripe Product IDs
 * Created in AIVerID's Stripe account
 */
export const STRIPE_PRODUCTS = {
  student_monthly: process.env.STRIPE_PRICE_STUDENT_MONTHLY || 'price_student_monthly',
  student_yearly: process.env.STRIPE_PRICE_STUDENT_YEARLY || 'price_student_yearly',
  professional_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  professional_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
} as const

/**
 * Pricing Tiers Configuration
 * Used in pricing page across all Ver* products
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Complete reference data',
      '3 basic calculators',
      'Save up to 5 calculations',
      'Basic text export',
      'Community support',
    ],
    cta: 'Get Started',
  },
  {
    id: 'student',
    name: 'Student',
    price: {
      monthly: PRICING.student.monthly,
      yearly: PRICING.student.yearly,
    },
    features: [
      '✨ ALL calculators in ALL VerCal products',
      '🎁 VerChem + VerCivil + VerElect + Future Ver*',
      'Unlimited saves (cloud-synced)',
      'Step-by-step solutions',
      'Export to PDF',
      'Calculation history',
      'Priority support',
      'Lifetime student price',
    ],
    cta: 'Upgrade to Student',
    popular: true, // Most popular tier
  },
  {
    id: 'professional',
    name: 'Professional',
    price: {
      monthly: PRICING.professional.monthly,
      yearly: PRICING.professional.yearly,
    },
    features: [
      'Everything in Student tier',
      'API Access (10K requests/month)',
      'Batch processing (100+ calculations)',
      'Custom formulas',
      'Export to Excel/CSV',
      '24/7 priority support',
      'Commercial license',
      'Team features (3 members)',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 0, // Not offered monthly
      yearly: PRICING.enterprise.yearly,
    },
    features: [
      'Everything in Professional',
      'Unlimited users (up to 100)',
      'API Access (1M requests/month)',
      'White label',
      'SSO integration',
      'Dedicated support',
      'SLA guarantee (99.9%)',
      'Custom features',
    ],
    cta: 'Contact Sales',
  },
]

/**
 * Tier Hierarchy (for access checks)
 * Higher number = more access
 */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  student: 1,
  professional: 2,
  enterprise: 3,
} as const

/**
 * Subscription URLs
 * All payments go through AIVerID
 */
export const getSubscriptionUrl = (
  tier: 'student' | 'professional',
  interval: 'monthly' | 'yearly',
  returnUrl: string
): string => {
  const params = new URLSearchParams({
    tier,
    interval,
    source: returnUrl,
  })
  return `${AIVERID_CONFIG.URL}/subscribe?${params.toString()}`
}

/**
 * Feature Limits by Tier
 */
export const FEATURE_LIMITS = {
  free: {
    maxSavedCalculations: 5,
    maxFavorites: 3,
    apiRequests: 0,
    batchSize: 0,
  },
  student: {
    maxSavedCalculations: Infinity,
    maxFavorites: Infinity,
    apiRequests: 0,
    batchSize: 0,
  },
  professional: {
    maxSavedCalculations: Infinity,
    maxFavorites: Infinity,
    apiRequests: 10000, // per month
    batchSize: 100,
  },
  enterprise: {
    maxSavedCalculations: Infinity,
    maxFavorites: Infinity,
    apiRequests: 1000000, // per month
    batchSize: 1000,
  },
} as const

/**
 * VerCal Product Names
 * For display in "unlocks" messaging
 */
export const VERCAL_PRODUCTS = [
  { id: 'verchem', name: 'VerChem', displayName: 'Chemistry' },
  { id: 'vercivil', name: 'VerCivil', displayName: 'Civil Engineering' },
  { id: 'verelect', name: 'VerElect', displayName: 'Electrical Engineering' },
  { id: 'vermech', name: 'VerMech', displayName: 'Mechanical Engineering', coming: true },
  { id: 'verphysics', name: 'VerPhysics', displayName: 'Physics', coming: true },
  { id: 'vermath', name: 'VerMath', displayName: 'Mathematics', coming: true },
] as const

/**
 * Cookie/Storage Keys
 */
export const STORAGE_KEYS = {
  SESSION: 'vercal_session',
  SUBSCRIPTION: 'vercal_subscription',
  LAST_CHECKED: 'vercal_last_checked',
  SAVED_CALCULATIONS: 'vercal_saved_calc',
} as const
