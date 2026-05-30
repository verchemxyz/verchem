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
import type { Subscription } from '@/lib/vercal/types'
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

  // Color classes — tiers stay visually distinguishable via tokens
  const colorClasses = {
    gray: 'bg-muted text-muted-foreground',
    blue: 'bg-primary-100 text-primary-700',
    purple: 'bg-secondary-100 text-secondary-700',
    gold: 'bg-warning/10 text-warning',
  }

  return (
    <div className="flex items-center gap-2">
      {/* Badge */}
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses[size]} ${
          colorClasses[tierColor as keyof typeof colorClasses]
        }`}
      >
        {/* Tier name */}
        <span>{tierName}</span>
      </span>

      {/* Expiry */}
      {showExpiry && subscription.expires_at && (
        <span className="text-xs text-muted-foreground">
          {formatExpiry(subscription.expires_at)}
        </span>
      )}

      {/* Upgrade link */}
      {showUpgrade && subscription.tier === 'free' && (
        <Link
          href="/pricing"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
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

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Subscription</h3>
          <p className="text-sm text-muted-foreground">Manage your VerCal subscription</p>
        </div>
        <SubscriptionBadge subscription={subscription} size="lg" showUpgrade={false} />
      </div>

      {/* Details */}
      <div className="space-y-3">
        {/* Status */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Status</span>
          <span
            className={`font-medium ${
              subscription.status === 'active'
                ? 'text-success'
                : 'text-destructive'
            }`}
          >
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </span>
        </div>

        {/* Expiry */}
        {subscription.expires_at && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {subscription.status === 'active' ? 'Renews' : 'Expired'}
            </span>
            <span className="font-medium text-foreground">
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
            <span className="text-muted-foreground">Auto-renew</span>
            <span className="font-medium text-foreground">
              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex gap-3">
          {subscription.tier === 'free' ? (
            <Link
              href="/pricing"
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-primary-foreground rounded-lg text-center font-medium transition-colors"
            >
              Upgrade Now
            </Link>
          ) : (
            <>
              <Link
                href="/account/billing"
                className="flex-1 px-4 py-2 bg-muted hover:bg-border text-foreground rounded-lg text-center font-medium transition-colors"
              >
                Manage Billing
              </Link>
              <Link
                href="/pricing"
                className="flex-1 px-4 py-2 bg-muted hover:bg-border text-foreground rounded-lg text-center font-medium transition-colors"
              >
                Change Plan
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      {subscription.tier !== 'free' && (
        <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
          <p className="text-xs text-muted-foreground">
            Your {tierName} subscription unlocks <strong>all calculators</strong> in{' '}
            <strong>all VerCal products</strong>: VerChem, VerCivil, VerElect, and more!
          </p>
        </div>
      )}
    </div>
  )
}
