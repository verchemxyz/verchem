import { Loader2 } from 'lucide-react'

interface CalculatorLoadingProps {
  title?: string
  message?: string
}

/**
 * Reusable loading component for calculator pages
 */
export function CalculatorLoading({
  title = 'Loading Calculator',
  message = 'Preparing calculation tools...'
}: CalculatorLoadingProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {message}
          </p>

          {/* Skeleton form */}
          <div className="mt-8 space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-primary-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline loading spinner for calculator results
 */
export function CalculatorSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
    </div>
  )
}

/**
 * Card loading skeleton
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg p-6 animate-pulse"
        >
          <div className="h-6 bg-muted rounded mb-4 w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/5" />
          </div>
        </div>
      ))}
    </>
  )
}
