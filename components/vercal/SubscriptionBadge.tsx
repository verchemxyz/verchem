/**
 * VerCal Ecosystem - Subscription Badge Component
 *
 * ✅ UNIVERSAL: Copy this to ALL Ver* products
 * Shows user's current subscription tier
 *
 * Last Updated: 2025-11-21
 */

'use client'

import Link from 'next/link'
import type { Subscription, SubscriptionTier } from '@/lib/vercal/types'
import { getTierColor, getTierDisplayName, formatExpiry } from '@/lib/vercal/subscription'

interface SubscriptionBadgeProps {
  subscription: Subscription
  showExpiry?: boolean
  showUpgrade?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SubscriptionBadge({
  subscription,
  showExpiry = false,
  showUpgrade = true,
  size = 'md',
}: SubscriptionBadgeProps) {
  const tierColor = getTierColor(subscription.tier)
  const tierName = getTierDisplayName(subscription.tier)

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  // Color classes
  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    gold: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  }

  return (
    <div className="flex items-center gap-2">
      {/* Badge */}
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses[size]} ${
          colorClasses[tierColor as keyof typeof colorClasses]
        }`}
      >
        {/* Icon */}
        {subscription.tier === 'free' && <span>🆓</span>}
        {subscription.tier === 'student' && <span>🎓</span>}
        {subscription.tier === 'professional' && <span>💼</span>}
        {subscription.tier === 'enterprise' && <span>🏢</span>}

        {/* Tier name */}
        <span>{tierName}</span>
      </span>

      {/* Expiry */}
      {showExpiry && subscription.expires_at && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatExpiry(subscription.expires_at)}
        </span>
      )}

      {/* Upgrade link */}
      {showUpgrade && subscription.tier === 'free' && (
        <Link
          href="/pricing"
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Upgrade
        </Link>
      )}
    </div>
  )
}

/**
 * Full subscription card (for account/settings pages)
 */
export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const tierName = getTierDisplayName(subscription.tier)
  const tierColor = getTierColor(subscription.tier)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subscription</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your VerCal subscription</p>
        </div>
        <SubscriptionBadge subscription={subscription} size="lg" showUpgrade={false} />
      </div>

      {/* Details */}
      <div className="space-y-3">
        {/* Status */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Status</span>
          <span
            className={`font-medium ${
              subscription.status === 'active'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
        </div>

        {/* Expiry */}
        {subscription.expires_at && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {subscription.status === 'active' ? 'Renews' : 'Expired'}
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {new Date(subscription.expires_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Auto-renew */}
        {subscription.status === 'active' && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Auto-renew</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          {subscription.tier === 'free' ? (
            <Link
              href="/pricing"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center font-medium transition-colors"
            >
              Upgrade Now
            </Link>
          ) : (
            <>
              <Link
                href="/account/billing"
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-center font-medium transition-colors"
              >
                Manage Billing
              </Link>
              <Link
                href="/pricing"
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-center font-medium transition-colors"
              >
                Change Plan
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      {subscription.tier !== 'free' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            ✨ Your {tierName} subscription unlocks <strong>all calculators</strong> in{' '}
            <strong>all VerCal products</strong>: VerChem, VerCivil, VerElect, and more!
          </p>
        </div>
      )}
    </div>
  )
}
