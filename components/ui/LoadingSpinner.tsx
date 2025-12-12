'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

/**
 * Loading Spinner Component
 *
 * WCAG 2.1 AA Compliant:
 * - aria-live for screen readers
 * - Visible loading text
 * - Semantic role="status"
 */
export function LoadingSpinner({
  size = 'md',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`
          ${sizeClasses[size]}
          border-primary-200 border-t-primary-600
          rounded-full animate-spin
        `}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Skeleton Loader for Calculator Results
 */
export function CalculatorSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading calculation...">
      <div className="premium-card p-6 space-y-4">
        {/* Result header skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />

        {/* Result value skeleton */}
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-3/4" />

        {/* Steps skeleton */}
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}

/**
 * Button Loading State
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  isLoading = false,
  loadingText = 'Calculating...',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`
        relative inline-flex items-center justify-center
        min-h-[44px] min-w-[44px]
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </span>
          <span className="opacity-0">{children}</span>
          <span className="sr-only">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default LoadingSpinner
