/**
 * VerCal Ecosystem - Universal Types
 *
 * ✅ UNIVERSAL: Copy this file to ALL Ver* products (VerChem, VerCivil, VerElect, etc.)
 * These types are shared across the entire VerCal ecosystem.
 *
 * Last Updated: 2025-11-21
 */

/**
 * Subscription Tiers
 */
export type SubscriptionTier = 'free' | 'student' | 'professional' | 'enterprise'

/**
 * Subscription Status
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due'

/**
 * Subscription Data (from AIVerID)
 */
export interface Subscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  subscribed_at: string | null
  expires_at: string | null
  auto_renew: boolean
  stripe_customer_id?: string
  stripe_subscription_id?: string
}

/**
 * User Session (from AIVerID OAuth)
 * Includes subscription data in JWT token
 */
export interface UserSession {
  user_id: string
  email: string
  name: string
  subscription: Subscription
  iat: number
  exp: number
}

/**
 * Feature Access Check Result
 */
export interface FeatureAccess {
  hasAccess: boolean
  reason?: string
  requiredTier?: SubscriptionTier
}

/**
 * Pricing Configuration
 */
export interface PricingTier {
  id: SubscriptionTier
  name: string
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
  cta: string
  popular?: boolean
}

/**
 * Product Configuration (App-specific)
 * Each Ver* product defines its own calculators
 */
export interface ProductConfig {
  name: string // "VerChem", "VerCivil", etc.
  displayName: string // "Chemistry Calculator"
  domain: string // "verchem.xyz"
  primaryColor: string // "#3B82F6"
  freeCalculators: string[] // List of calculator IDs that are free
  paidCalculators: string[] // List of calculator IDs that require payment
}

/**
 * Calculator Definition
 */
export interface Calculator {
  id: string
  name: string
  description: string
  tier: SubscriptionTier // Minimum tier required
  path: string // URL path
  icon?: string
}
