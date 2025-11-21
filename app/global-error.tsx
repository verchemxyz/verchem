'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error to monitoring service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error - VerChem</title>
      </head>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                backgroundColor: '#fee2e2',
                padding: '1rem',
                borderRadius: '9999px'
              }}>
                <AlertTriangle style={{ width: '3rem', height: '3rem', color: '#dc2626' }} />
              </div>
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center',
              marginBottom: '0.5rem'
            }}>
              Critical Error
            </h1>

            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              A critical error occurred. Please refresh the page to continue.
            </p>

            {error.message && (
              <div style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  color: '#374151',
                  wordBreak: 'break-word'
                }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    marginTop: '0.5rem'
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
