'use client'

import { useEffect, useState } from 'react'

function sanitizeRedirectPath(value: string): string {
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  if (value.includes('://')) return '/'
  if (value.includes('\\')) return '/'
  return value
}

export default function OAuthLoginButton() {
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

      window.location.href = `/oauth/start?redirect=${encodeURIComponent(redirectPath)}`
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      setIsLoading(false)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700"
        >
          <span>Sign in with AIVerID</span>
        </button>
        <p className="text-xs text-center text-gray-500">
          One account for all Ver* apps
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* AIVerID Login Button */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-white rounded-xl transition-all duration-200 ${
          !isLoading
            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Sign in with AIVerID</span>
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        One account for all Ver* apps
      </p>
    </div>
  )
}
