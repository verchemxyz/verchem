'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import OAuthLoginButton to avoid SSR issues
const OAuthLoginButton = dynamic(() => import('./oauth-login-button'), {
  ssr: false,
  loading: () => (
    <button disabled className="btn-premium text-sm">
      Loading...
    </button>
  ),
})

interface User {
  name?: string
  email?: string
  subscription_tier?: string
}

const AuthButton = () => {
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
      // Reload page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
      // Force reload anyway
      window.location.href = '/'
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {user.name || user.email?.split('@')[0] || 'User'}
          </span>
          {user.subscription_tier && user.subscription_tier !== 'free' && (
            <span className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded-full">
              {user.subscription_tier}
            </span>
          )}
        </div>
        <Link
          href="/account"
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          My Account
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden md:block">
        <OAuthLoginButton />
      </div>
      <div className="md:hidden">
        <OAuthLoginButton />
      </div>
    </div>
  )
}

export default AuthButton
