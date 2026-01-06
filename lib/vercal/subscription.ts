/**
 * VerCal Ecosystem - Universal Subscription Logic
 *
 * ✅ UNIVERSAL: Copy this file to ALL Ver* products
 * Handles subscription checks, feature access, tier comparison
 *
 * Last Updated: 2025-11-21
 */

import type {
  Subscription,
  SubscriptionTier,
  FeatureAccess,
} from './types'
import { TIER_HIERARCHY, FEATURE_LIMITS } from './constants'

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(subscription: Subscription): boolean {
  // Check status
  if (subscription.status !== 'active') {
    return false
  }

  // Check expiry (if applicable)
  if (subscription.expires_at) {
    const expiryDate = new Date(subscription.expires_at)
    const now = new Date()
    if (expiryDate < now) {
      return false
    }
  }

  return true
}

/**
 * Check if user has access to a specific tier
 * Returns true if user's tier is equal or higher than required tier
 */
export function hasTierAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier]
}

/**
 * Get user's effective tier
 * Returns 'free' if subscription expired/cancelled
 */
export function getEffectiveTier(subscription: Subscription): SubscriptionTier {
  if (!hasActiveSubscription(subscription)) {
    return 'free'
  }
  return subscription.tier
}

/**
 * Check feature access
 */
export function checkFeatureAccess(
  subscription: Subscription,
  requiredTier: SubscriptionTier
): FeatureAccess {
  const effectiveTier = getEffectiveTier(subscription)

  const hasAccess = hasTierAccess(effectiveTier, requiredTier)

  if (hasAccess) {
    return { hasAccess: true }
  }

  // Determine reason for no access
  let reason = `This feature requires ${requiredTier} tier.`

  if (subscription.status === 'expired') {
    reason = 'Your subscription has expired. Please renew to continue.'
  } else if (subscription.status === 'cancelled') {
    reason = 'Your subscription was cancelled. Please resubscribe to access this feature.'
  } else if (subscription.status === 'past_due') {
    reason = 'Your payment is past due. Please update your payment method.'
  }

  return {
    hasAccess: false,
    reason,
    requiredTier,
  }
}

/**
 * Get feature limits for user's tier
 */
export function getFeatureLimits(tier: SubscriptionTier) {
  return FEATURE_LIMITS[tier]
}

/**
 * Check if user can save more calculations
 */
export function canSaveCalculation(
  tier: SubscriptionTier,
  currentCount: number
): boolean {
  const limits = getFeatureLimits(tier)
  return currentCount < limits.maxSavedCalculations
}

/**
 * Format subscription expiry
 */
export function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'Never expires'

  const date = new Date(expiresAt)
  const now = new Date()

  // Calculate days until expiry
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Expired'
  } else if (diffDays === 0) {
    return 'Expires today'
  } else if (diffDays === 1) {
    return 'Expires tomorrow'
  } else if (diffDays < 7) {
    return `Expires in ${diffDays} days`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Expires in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  } else {
    const months = Math.floor(diffDays / 30)
    return `Expires in ${months} ${months === 1 ? 'month' : 'months'}`
  }
}

/**
 * Get tier badge color
 */
export function getTierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free':
      return 'gray'
    case 'student':
      return 'blue'
    case 'professional':
      return 'purple'
    case 'enterprise':
      return 'gold'
    default:
      return 'gray'
  }
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free':
      return 'Free'
    case 'student':
      return 'Student'
    case 'professional':
      return 'Professional'
    case 'enterprise':
      return 'Enterprise'
    default:
      return 'Unknown'
  }
}

/**
 * Mock subscription for development
 * Remove in production!
 */
export function getMockSubscription(tier: SubscriptionTier = 'free'): Subscription {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Mock subscription only available in development')
  }

  return {
    tier,
    status: 'active',
    subscribed_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    auto_renew: true,
  }
}

/**
 * Parse subscription from JWT token
 */
export function parseSubscriptionFromToken(token: string): Subscription | null {
  try {
    // In production, verify JWT signature with AIVerID public key
    // For now, just decode (UNSAFE in production!)
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.subscription
  } catch (error) {
    console.error('Failed to parse subscription from token:', error)
    return null
  }
}

/**
 * Subscription status messages
 */
export function getStatusMessage(subscription: Subscription): {
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
} {
  if (!hasActiveSubscription(subscription)) {
    if (subscription.status === 'expired') {
      return {
        message: 'Your subscription has expired. Renew now to continue using premium features.',
        type: 'error',
      }
    }
    if (subscription.status === 'cancelled') {
      return {
        message: 'Your subscription was cancelled. Resubscribe to access premium features.',
        type: 'warning',
      }
    }
    if (subscription.status === 'past_due') {
      return {
        message: 'Payment failed. Please update your payment method to avoid service interruption.',
        type: 'error',
      }
    }
  }

  // Active subscription - check expiry
  if (subscription.expires_at) {
    const expiryDate = new Date(subscription.expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 7 && !subscription.auto_renew) {
      return {
        message: `Your subscription expires in ${daysUntilExpiry} days. Enable auto-renew to avoid interruption.`,
        type: 'warning',
      }
    }
  }

  return {
    message: `You have access to all ${getTierDisplayName(subscription.tier)} features.`,
    type: 'success',
  }
}

/**
 * Helper: Check if user is on free tier
 */
export function isFreeTier(subscription: Subscription): boolean {
  return getEffectiveTier(subscription) === 'free'
}

/**
 * Helper: Check if user is student
 */
export function isStudent(subscription: Subscription): boolean {
  const tier = getEffectiveTier(subscription)
  return tier === 'student' || tier === 'professional' || tier === 'enterprise'
}

/**
 * Helper: Check if user is professional
 */
export function isProfessional(subscription: Subscription): boolean {
  const tier = getEffectiveTier(subscription)
  return tier === 'professional' || tier === 'enterprise'
}
