'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

// Dynamically import OAuthLoginButton to avoid SSR issues
const OAuthLoginButton = dynamic(() => import('./oauth-login-button'), {
  ssr: false,
  loading: () => (
    <button disabled className="inline-flex min-h-11 items-center rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">
      AIVerID
    </button>
  ),
})

interface User {
  name?: string
  email?: string
  subscription_tier?: string
}

const AuthButton = () => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated by reading cookie
    const checkAuth = () => {
      // Read verchem-auth cookie (httpOnly: false, so readable from client)
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find((c) => c.trim().startsWith('verchem-auth='))

      if (authCookie) {
        setIsAuthenticated(true)
        // Try to get user info from session API
        fetchUserInfo()
      } else {
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/session')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // Clear client-side cookies
      document.cookie = 'verchem-auth=; Max-Age=0; Path=/;'
      document.cookie = 'verchem-session=; Max-Age=0; Path=/;'
      document.cookie = 'verchem-session-sig=; Max-Age=0; Path=/;'
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
      router.replace('/')
      router.refresh()
    }
  }

  if (isLoading) {
    return <div className="h-11 w-24 animate-pulse rounded-md border border-border bg-muted" aria-label="Checking sign-in status" />
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          title={user.name || user.email || 'My account'}
        >
          <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A10 10 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden 2xl:inline">{user.name || user.email?.split('@')[0] || 'My account'}</span>
          <span className="sr-only 2xl:hidden">My account</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sign out"
          aria-label="Sign out"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <OAuthLoginButton compact />
  )
}

export default AuthButton
