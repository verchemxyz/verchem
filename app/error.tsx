'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service (e.g., Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-destructive/10 p-4 rounded-full">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          Something went wrong
        </h1>

        <p className="text-muted-foreground text-center mb-6">
          We encountered an unexpected error. Don&apos;t worry, your data is safe.
        </p>

        {error.message && (
          <div className="bg-muted border border-border rounded-lg p-4 mb-6">
            <p className="text-sm font-mono text-foreground break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-md transition-colors min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-border bg-card hover:bg-muted text-foreground rounded-md transition-colors min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  )
}
