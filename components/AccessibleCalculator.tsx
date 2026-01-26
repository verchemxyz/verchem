'use client'

// VerChem - AccessibleCalculator Wrapper Component
// WCAG 2.1 AA Compliance
// Created: November 17, 2025 - Road to 100/100 Sprint

import { ReactNode, useEffect, useRef, useState } from 'react'
import {
  ARIA_LABELS,
  ARIA_DESCRIPTIONS,
  announceResult,
  announceError,
  createFocusTrap,
} from '@/lib/utils/accessibility'

interface AccessibleCalculatorProps {
  children: ReactNode
  calculatorId: keyof typeof ARIA_LABELS
  title: string
  description?: string
  onCalculate?: () => void
  onClear?: () => void
  onReset?: () => void
  hasResult?: boolean
  resultMessage?: string
  errorMessage?: string
  shortcuts?: {
    calculate?: string // default: 'Enter'
    clear?: string // default: 'Escape'
    reset?: string // default: 'Ctrl+R'
  }
}

/**
 * AccessibleCalculator - Wrapper component that adds accessibility features
 * to all VerChem calculators
 *
 * Features:
 * - ARIA labels and descriptions
 * - Keyboard shortcuts
 * - Screen reader announcements
 * - Focus management
 * - Skip links
 * - Live regions
 */
export default function AccessibleCalculator({
  children,
  calculatorId,
  title,
  description,
  onCalculate,
  onClear,
  onReset,
  hasResult = false,
  resultMessage,
  errorMessage,
}: AccessibleCalculatorProps) {
  const mainRef = useRef<HTMLElement>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Announce results/errors to screen readers
  useEffect(() => {
    if (resultMessage && hasResult) {
      announceResult(resultMessage)
    }
  }, [resultMessage, hasResult])

  useEffect(() => {
    if (errorMessage) {
      announceError(errorMessage)
    }
  }, [errorMessage])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or ? to show shortcuts
      if ((e.ctrlKey && e.key === '/') || e.key === '?') {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
        return
      }

      // Calculate: Enter (when not in textarea)
      if (e.key === 'Enter' && onCalculate) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          onCalculate()
        }
      }

      // Clear: Escape
      if (e.key === 'Escape' && onClear) {
        e.preventDefault()
        onClear()
      }

      // Reset: Ctrl+R
      if (e.ctrlKey && e.key === 'r' && onReset) {
        e.preventDefault()
        onReset()
      }

      // Focus first input: Ctrl+I
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        const firstInput = mainRef.current?.querySelector<HTMLInputElement>(
          'input:not([type="hidden"]), select, textarea'
        )
        firstInput?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCalculate, onClear, onReset, showShortcuts])

  // Create focus trap when showing shortcuts modal
  useEffect(() => {
    if (showShortcuts && mainRef.current) {
      const modal = document.getElementById('shortcuts-modal')
      if (modal) {
        return createFocusTrap(modal)
      }
    }
  }, [showShortcuts])

  const ariaLabel = ARIA_LABELS[calculatorId] || title
  const ariaDescription = description || ARIA_DESCRIPTIONS[calculatorId as keyof typeof ARIA_DESCRIPTIONS]

  return (
    <>
      {/* Skip to main content */}
      <a
        href="#main-calculator"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to calculator
      </a>

      {/* Main calculator */}
      <main
        ref={mainRef}
        id="main-calculator"
        role="main"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? 'calculator-description' : undefined}
        className="relative"
      >
        {/* Description for screen readers */}
        {ariaDescription && (
          <div id="calculator-description" className="sr-only">
            {ariaDescription}
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="text-sm text-secondary-600 hover:text-primary-600 transition-colors flex items-center gap-2"
            aria-label="Show keyboard shortcuts"
            aria-expanded={showShortcuts}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Keyboard shortcuts (Ctrl+/)
          </button>
        </div>

        {/* Calculator content */}
        {children}

        {/* Live region for announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id={`${calculatorId}-status`}
        >
          {hasResult && resultMessage}
        </div>

        {/* Error live region */}
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          id={`${calculatorId}-error`}
        >
          {errorMessage}
        </div>
      </main>

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowShortcuts(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            id="shortcuts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="shortcuts-title" className="text-2xl font-bold text-foreground">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-secondary-600 hover:text-primary-600 transition-colors"
                aria-label="Close shortcuts"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {onCalculate && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Calculate</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    Enter
                  </kbd>
                </div>
              )}

              {onClear && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Clear</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    Escape
                  </kbd>
                </div>
              )}

              {onReset && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Reset</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                    Ctrl+R
                  </kbd>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Focus first input</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                  Ctrl+I
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Show/hide shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                  Ctrl+/
                </kbd>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Navigate elements</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                  Tab
                </kbd>
              </div>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  All VerChem calculators support keyboard navigation for accessibility.
                  Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Tab</kbd> to
                  navigate between fields.
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </>
  )
}

/**
 * AccessibleInput - Enhanced input with ARIA labels
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  required?: boolean
}

export function AccessibleInput({
  label,
  error,
  helperText,
  required,
  id,
  ...props
}: AccessibleInputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className={`block mb-2 font-medium ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
      >
        {label}
      </label>

      <input
        id={inputId}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
        className={`w-full px-4 py-2 border rounded-lg transition-colors text-foreground placeholder:text-muted-foreground ${
          error
            ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200'
            : 'border-border bg-background focus:border-primary-600 focus:ring-primary-200'
        } focus:outline-none focus:ring-2`}
        {...props}
      />

      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * AccessibleSelect - Enhanced select with ARIA labels
 */
interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  error?: string
  helperText?: string
  required?: boolean
}

export function AccessibleSelect({
  label,
  options,
  error,
  helperText,
  required,
  id,
  ...props
}: AccessibleSelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  const errorId = `${selectId}-error`
  const helperId = `${selectId}-helper`

  return (
    <div className="mb-4">
      <label
        htmlFor={selectId}
        className={`block mb-2 font-medium ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
      >
        {label}
      </label>

      <select
        id={selectId}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helperText ? helperId : ''}`.trim() || undefined}
        className={`w-full px-4 py-2 border rounded-lg transition-colors text-foreground ${
          error
            ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-200'
            : 'border-border bg-background focus:border-primary-600 focus:ring-primary-200'
        } focus:outline-none focus:ring-2`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * AccessibleButton - Enhanced button with ARIA labels
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${loading ? 'cursor-wait' : ''}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </>
        ) : icon ? (
          <>
            {icon}
            {children}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  )
}
