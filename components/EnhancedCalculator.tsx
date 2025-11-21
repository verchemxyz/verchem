'use client'

// VerChem - Enhanced Calculator Wrapper
// Adds validation, citations, and professional features to any calculator

import { ReactNode } from 'react'
import { ValidationBadge } from './ValidationBadge'
import { PROFESSIONAL_DISCLAIMER } from '@/lib/utils/citations'

interface EnhancedCalculatorProps {
  title: string
  description?: string
  validationQuality?: 'excellent' | 'good' | 'acceptable' | 'unvalidated'
  validationScore?: number
  children: ReactNode
  formula?: string
  assumptions?: string[]
  limitations?: string[]
  dataSource?: string
  showDisclaimer?: boolean
}

export function EnhancedCalculator({
  title,
  description,
  validationQuality = 'good',
  validationScore,
  children,
  formula,
  assumptions,
  limitations,
  dataSource = 'CODATA 2018, NIST Chemistry WebBook',
  showDisclaimer = false
}: EnhancedCalculatorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-950/20 dark:to-secondary-950/20 rounded-lg p-6 theme-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="mt-2 text-muted-foreground">{description}</p>
            )}
            {formula && (
              <div className="mt-3 font-mono text-sm bg-background px-3 py-1.5 rounded inline-block border border-border">
                {formula}
              </div>
            )}
          </div>
          <ValidationBadge
            quality={validationQuality}
            score={validationScore}
          />
        </div>

        {/* Assumptions & Limitations */}
        {(assumptions || limitations) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {assumptions && (
              <div className="bg-background/60 rounded p-3 border border-border">
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Assumptions
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {assumptions.map((assumption, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {limitations && (
              <div className="bg-background/60 rounded p-3 border border-border">
                <h3 className="font-semibold text-sm text-foreground mb-2">
                  Limitations
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calculator Content */}
      <div>{children}</div>

      {/* Data Sources */}
      <div className="bg-muted rounded-lg p-4 border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="font-medium text-foreground">Data Sources:</span>
          <span>{dataSource}</span>
        </div>
      </div>

      {/* Professional Disclaimer */}
      {showDisclaimer && (
        <details className="bg-warning-50 dark:bg-warning-950/20 border border-warning-200 dark:border-warning-800 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-warning-800 dark:text-warning-200 hover:bg-warning-100 dark:hover:bg-warning-900/30">
            Professional Use Disclaimer
          </summary>
          <div className="px-4 pb-4 prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: PROFESSIONAL_DISCLAIMER.replace(/\n/g, '<br/>') }} />
          </div>
        </details>
      )}
    </div>
  )
}