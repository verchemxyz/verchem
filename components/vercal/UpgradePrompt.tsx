/**
 * VerCal Ecosystem - Upgrade Prompt Component
 *
 * ✅ UNIVERSAL: Copy this to ALL Ver* products
 * Shows when user tries to access paid features
 *
 * Last Updated: 2025-11-21
 */

'use client'

import Link from 'next/link'
import { PRICING, VERCAL_PRODUCTS, getSubscriptionUrl } from '@/lib/vercal/constants'
import { PRODUCT_CONFIG } from '@/lib/config/product'
import type { SubscriptionTier } from '@/lib/vercal/types'

interface UpgradePromptProps {
  /**
   * Feature name that requires upgrade
   */
  feature: string

  /**
   * Required tier to access this feature
   */
  requiredTier?: SubscriptionTier

  /**
   * Optional custom message
   */
  message?: string

  /**
   * Show compact version (for inline prompts)
   */
  compact?: boolean

  /**
   * Callback when user clicks upgrade
   */
  onUpgrade?: () => void
}

export function UpgradePrompt({
  feature,
  requiredTier = 'student',
  message,
  compact = false,
}: UpgradePromptProps) {
  const upgradeUrl = getSubscriptionUrl(
    requiredTier === 'professional' ? 'professional' : 'student',
    'yearly',
    PRODUCT_CONFIG.domain
  )

  const price = requiredTier === 'professional' ? PRICING.professional.yearly : PRICING.student.yearly

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <span className="text-2xl">🔒</span>
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>{feature}</strong> requires{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {requiredTier === 'professional' ? 'Professional' : 'Student'}
            </span>{' '}
            tier
          </p>
        </div>
        <Link
          href={upgradeUrl}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Upgrade - ${price}/year
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-lg">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-3xl">🔒</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-gray-100">
        Unlock {feature}
      </h3>

      {/* Message */}
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        {message ||
          `This feature requires a ${requiredTier === 'professional' ? 'Professional' : 'Student'} subscription. Upgrade now to access ALL calculators in ALL VerCal products!`}
      </p>

      {/* Benefits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          ✨ Your subscription unlocks:
        </p>
        <ul className="space-y-2">
          {VERCAL_PRODUCTS.filter((p) => !('coming' in p) || !p.coming).map((product) => (
            <li key={product.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500">✓</span>
              <span>
                <strong>{product.name}</strong> - {product.displayName}
              </span>
            </li>
          ))}
          <li className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>🚀</span>
            <span>Plus all future Ver* products automatically!</span>
          </li>
        </ul>
      </div>

      {/* Pricing */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">${price}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">per year</div>
          <div className="text-xs text-gray-500">Just ${(price / 12).toFixed(2)}/month!</div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={upgradeUrl}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center transition-colors"
        >
          Upgrade to {requiredTier === 'professional' ? 'Professional' : 'Student'}
        </Link>
        <Link
          href="/pricing"
          className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-center transition-colors"
        >
          Compare Plans
        </Link>
      </div>

      {/* Trust Signals */}
      <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>✓</span>
            <span>7-day money back</span>
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span>
            <span>Cancel anytime</span>
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span>
            <span>Lifetime student price</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline upgrade link (minimal)
 */
export function UpgradeLink({ className = '' }: { className?: string }) {
  const upgradeUrl = getSubscriptionUrl('student', 'yearly', PRODUCT_CONFIG.domain)

  return (
    <Link
      href={upgradeUrl}
      className={`text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline ${className}`}
    >
      Upgrade to unlock
    </Link>
  )
}

/**
 * Feature locked badge (small indicator)
 */
export function LockedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
      <span>🔒</span>
      <span>Locked</span>
    </span>
  )
}
