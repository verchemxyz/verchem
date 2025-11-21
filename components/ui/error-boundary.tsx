'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // You could send this to Sentry, LogRocket, etc.
      console.log('Would report to error tracking service:', { error, errorInfo })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-rose-100 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-rose-200 hover:text-rose-100">
                    View error details
                  </summary>
                  <pre className="mt-2 text-xs text-rose-100 bg-black/20 p-3 rounded-lg overflow-auto max-h-48">
                    {this.state.error?.stack}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <button
                onClick={this.handleReset}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const resetError = () => setError(null)
  const throwError = (error: Error) => setError(error)

  return { throwError, resetError }
}

// Molecule Builder specific error boundary
export function MoleculeBuilderErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[600px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-8">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Molecule Builder Error
              </h2>
              <p className="text-amber-100 mb-6">
                The molecule builder encountered an issue. This might be due to an invalid molecule structure or a temporary problem.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full rounded-xl border border-amber-400/50 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/30 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log molecule builder specific errors
        console.error('Molecule Builder Error:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}