'use client'

// VerChem - Scientific Result Display Component
// Shows results with proper sig figs, uncertainty, and citations

import { useState } from 'react'
import { formatResult } from '@/lib/utils/significant-figures'
import { formatValueWithUncertainty, type MeasurementWithUncertainty } from '@/lib/utils/error-analysis'
import { formatCitationACS, type Citation } from '@/lib/utils/citations'

interface ScientificResultProps {
  value: number
  uncertainty?: number
  unit?: string
  inputs?: (string | number)[]
  label?: string
  formula?: string
  citations?: Citation[]
  showDetails?: boolean
  confidenceLevel?: number
}

export function ScientificResult({
  value,
  uncertainty,
  unit,
  inputs = [],
  label,
  formula,
  citations = [],
  showDetails = false,
  confidenceLevel = 0.95
}: ScientificResultProps) {
  const [showCitations, setShowCitations] = useState(false)

  // Format the result based on whether we have uncertainty
  let formattedResult: string
  if (uncertainty !== undefined) {
    const measurement: MeasurementWithUncertainty = {
      value,
      uncertainty,
      unit
    }
    formattedResult = formatValueWithUncertainty(measurement)
  } else if (inputs.length > 0) {
    // Use sig figs from inputs
    formattedResult = formatResult(value, ...inputs.map(String))
    if (unit) formattedResult += ` ${unit}`
  } else {
    // Default formatting
    formattedResult = value.toFixed(4)
    if (unit) formattedResult += ` ${unit}`
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 theme-card">
      {/* Main Result */}
      <div className="flex items-baseline justify-between">
        <div>
          {label && (
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {label}
            </div>
          )}
          <div className="text-3xl font-bold text-card-foreground">
            {formattedResult}
          </div>
        </div>

        {/* Confidence Indicator */}
        {uncertainty && (
          <div className="text-xs text-muted-foreground">
            {(confidenceLevel * 100).toFixed(0)}% CI
          </div>
        )}
      </div>

      {/* Formula */}
      {formula && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="font-mono text-sm text-foreground">
            {formula}
          </div>
        </div>
      )}

      {/* Scientific Details */}
      {showDetails && uncertainty && (
        <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs text-muted-foreground">
          <div>
            Absolute uncertainty: ±{uncertainty.toFixed(6)} {unit}
          </div>
          <div>
            Relative uncertainty: ±{((uncertainty / Math.abs(value)) * 100).toFixed(2)}%
          </div>
          <div>
            Confidence interval ({(confidenceLevel * 100).toFixed(0)}%):
            [{(value - 1.96 * uncertainty).toFixed(4)}, {(value + 1.96 * uncertainty).toFixed(4)}] {unit}
          </div>
        </div>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{citations.length} reference{citations.length > 1 ? 's' : ''}</span>
            <svg
              className={`w-3 h-3 transform transition-transform ${showCitations ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCitations && (
            <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground space-y-1">
              {citations.map((citation, i) => (
                <div key={i} className="text-left">
                  [{i + 1}] {formatCitationACS(citation)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}