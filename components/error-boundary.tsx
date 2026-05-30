'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Calculator Error Boundary
 * Catches errors in calculator components without crashing the entire app
 */
export class CalculatorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Calculator error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-destructive-strong mb-2">
                Calculator Error
              </h3>

              <p className="text-sm text-destructive-strong mb-4">
                This calculator encountered an error. Please try again or use a different calculator.
              </p>

              {this.state.error && (
                <details className="mb-4">
                  <summary className="text-sm font-medium text-destructive-strong cursor-pointer hover:underline">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-destructive-strong bg-destructive/10 p-3 rounded overflow-x-auto">
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>\n\n{this.state.error.stack}</>
                    )}
                  </pre>
                </details>
              )}

              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Convenience wrapper for calculator pages
 */
export function withCalculatorErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const Wrapped = (props: P) => (
    <CalculatorErrorBoundary>
      <Component {...props} />
    </CalculatorErrorBoundary>
  )

  Wrapped.displayName = `withCalculatorErrorBoundary(${displayName || Component.displayName || Component.name})`

  return Wrapped
}
