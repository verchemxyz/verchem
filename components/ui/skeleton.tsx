'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * Skeleton - Loading placeholder component
 *
 * Provides shimmer animation for content that's loading.
 * Supports multiple variants and sizes.
 *
 * @component
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-32" />
 * <Skeleton variant="circular" className="h-12 w-12" />
 * ```
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant of skeleton */
  variant?: 'rectangular' | 'circular' | 'text'
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/10 dark:bg-white/5',
        {
          // Variants
          'rounded-md': variant === 'rectangular',
          'rounded-full': variant === 'circular',
          'h-4 rounded': variant === 'text',

          // Animations
          'animate-pulse': animation === 'pulse',
          'animate-shimmer-premium': animation === 'wave',
        },
        className
      )}
      {...props}
    />
  )
}

/**
 * MoleculeBuilderSkeleton - Loading state for molecule builder
 *
 * Shows skeleton for canvas, palette, and stability panel
 */
export function MoleculeBuilderSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas skeleton (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>

        {/* Sidebar skeleton (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Palette skeleton */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stability skeleton */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * CalculatorSkeleton - Loading state for calculators
 */
export function CalculatorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-12 w-32" />
    </div>
  )
}

/**
 * PeriodicTableSkeleton - Loading state for periodic table
 */
export function PeriodicTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-18 gap-1">
        {Array.from({ length: 118 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" variant="rectangular" />
        ))}
      </div>
    </div>
  )
}

/**
 * PresetSelectorSkeleton - Loading state for molecule presets
 */
export function PresetSelectorSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading molecule presets">
      {/* Header with search skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-full sm:w-64" />
      </div>

      {/* Category tabs skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>

      {/* Results count skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Molecule grid skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Info footer skeleton */}
      <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
      </div>

      <span className="sr-only">Loading molecules, please wait...</span>
    </div>
  )
}

/**
 * LoadingSpinner - Animated spinner for loading states
 */
export function LoadingSpinner({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-blue-200 border-t-blue-600',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * PageLoading - Full page loading state
 */
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-400 animate-pulse">Loading...</p>
      </div>
    </div>
  )
}

/**
 * EmptyState - Placeholder when no data is available
 */
interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * ResultSkeleton - Loading state for calculation results
 */
export function ResultSkeleton() {
  return (
    <div className="space-y-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

/**
 * GraphSkeleton - Loading state for graph/chart
 */
export function GraphSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-[300px] w-full rounded-lg" />
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}
