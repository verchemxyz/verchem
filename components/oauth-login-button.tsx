'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function sanitizeRedirectPath(value: string): string {
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  if (value.includes('://')) return '/'
  if (value.includes('\\')) return '/'
  return value
}

interface OAuthLoginButtonProps {
  compact?: boolean
}

export default function OAuthLoginButton({ compact = false }: OAuthLoginButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted on client-side
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)

    try {
      const currentUrl = new URL(window.location.href)
      const redirectFromParam = currentUrl.searchParams.get('redirect')

      let redirectPath: string
      if (redirectFromParam) {
        redirectPath = sanitizeRedirectPath(redirectFromParam)
      } else {
        currentUrl.searchParams.delete('login_required')
        currentUrl.searchParams.delete('redirect')
        redirectPath = currentUrl.pathname + currentUrl.search
      }

      router.push(`/oauth/start?redirect=${encodeURIComponent(redirectPath)}`)
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      setIsLoading(false)
    }
  }

  const button = (
    <button
      type="button"
      onClick={isMounted ? handleLogin : undefined}
      disabled={!isMounted || isLoading}
      aria-busy={isLoading}
      className={`${compact ? 'inline-flex min-h-11 w-auto shrink-0 px-3 py-2' : 'flex w-full px-4 py-3'} items-center justify-center gap-2 whitespace-nowrap border rounded-md transition-colors duration-150 ${
          !isLoading
            ? 'bg-primary-500 text-primary-foreground border-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring'
            : 'bg-muted text-muted-foreground border-border cursor-not-allowed'
      }`}
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{compact ? 'Connecting…' : 'Signing in…'}</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {compact ? (
            <span className="text-sm font-semibold">
              <span className="hidden 2xl:inline">Sign in with </span>AIVerID
            </span>
          ) : (
            <span>Sign in with AIVerID</span>
          )}
        </>
      )}
    </button>
  )

  if (compact) return button

  return (
    <div className="space-y-3">
      {button}
      <p className="text-xs text-center text-muted-foreground">
        One account for all Ver* apps
      </p>
    </div>
  )
}
