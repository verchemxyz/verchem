'use client'

import React, { useId } from 'react'

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  unit?: string
  error?: string
  helperText?: string
}

/**
 * Accessible Input Component
 *
 * WCAG 2.1 AA Compliant:
 * - Proper <label> association via htmlFor/id
 * - aria-describedby for error/helper text
 * - aria-invalid for error state
 * - High contrast placeholder (4.5:1 ratio)
 * - Min touch target 44px
 */
export function AccessibleInput({
  label,
  unit,
  error,
  helperText,
  className = '',
  ...props
}: AccessibleInputProps) {
  const id = useId()
  const errorId = `${id}-error`
  const helperId = `${id}-helper`

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-2"
      >
        {label}
        {unit && <span className="text-muted-foreground ml-1">({unit})</span>}
      </label>

      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className={`
          input-premium w-full
          min-h-[44px]
          placeholder:text-gray-500 dark:placeholder:text-gray-400
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  helperText?: string
  options: Array<{ value: string; label: string }>
}

/**
 * Accessible Select Component
 *
 * WCAG 2.1 AA Compliant
 */
export function AccessibleSelect({
  label,
  error,
  helperText,
  options,
  className = '',
  ...props
}: AccessibleSelectProps) {
  const id = useId()
  const errorId = `${id}-error`
  const helperId = `${id}-helper`

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-2"
      >
        {label}
      </label>

      <select
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className={`
          input-premium w-full
          min-h-[44px]
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default AccessibleInput
