/**
 * Early Bird Pricing Logic
 *
 * Users who registered before the cutoff date get discounted pricing
 * when premium features are enabled.
 *
 * Strategy:
 * - Phase 1 (Now): Everything FREE for AIVerID members
 * - Phase 2 (Future): Premium features with Early Bird discount
 *
 * Last Updated: 2025-12-03
 */

// Early Bird cutoff date - users registered before this get discount
// Set to 3 months from now (adjust as needed)
export const EARLY_BIRD_CUTOFF = new Date('2025-03-01T00:00:00Z')

// Pricing tiers
export const PRICING = {
  earlyBird: {
    student: {
      monthly: 1.99,
      yearly: 19.99, // Save 17%
    },
    professional: {
      monthly: 4.99,
      yearly: 49.99, // Save 17%
    },
  },
  regular: {
    student: {
      monthly: 4.99,
      yearly: 49.99, // Save 17%
    },
    professional: {
      monthly: 14.99,
      yearly: 149.99, // Save 17%
    },
  },
} as const

/**
 * Check if user qualifies for Early Bird pricing
 */
export function isEarlyBird(registeredAt: string | Date | null | undefined): boolean {
  if (!registeredAt) return false

  const registrationDate = new Date(registeredAt)

  // Invalid date
  if (isNaN(registrationDate.getTime())) return false

  return registrationDate < EARLY_BIRD_CUTOFF
}

/**
 * Get appropriate pricing for user
 */
export function getPricingForUser(registeredAt: string | Date | null | undefined) {
  return isEarlyBird(registeredAt) ? PRICING.earlyBird : PRICING.regular
}

/**
 * Get discount percentage for Early Bird
 */
export function getEarlyBirdDiscount(): number {
  // Calculate discount: (regular - earlyBird) / regular * 100
  const regularYearly = PRICING.regular.student.yearly
  const earlyBirdYearly = PRICING.earlyBird.student.yearly
  return Math.round(((regularYearly - earlyBirdYearly) / regularYearly) * 100)
}

/**
 * Format registration date for display
 */
export function formatRegistrationDate(registeredAt: string | Date | null | undefined): string {
  if (!registeredAt) return 'Unknown'

  const date = new Date(registeredAt)
  if (isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get days until Early Bird cutoff
 */
export function getDaysUntilCutoff(): number {
  const now = new Date()
  const diff = EARLY_BIRD_CUTOFF.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Check if Early Bird period is still active
 */
export function isEarlyBirdPeriodActive(): boolean {
  return new Date() < EARLY_BIRD_CUTOFF
}
