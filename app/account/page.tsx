'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id?: string
  aiverid?: string
  name?: string
  email?: string
  subscription_tier?: string
  registered_at?: string
  avatar_url?: string
}

interface SessionData {
  user: User
  expires_at: string
}

export default function AccountPage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/session')
        if (response.ok) {
          const data = await response.json()
          setSession(data)
        } else if (response.status === 401) {
          // Not authenticated - redirect to home
          router.push('/')
        } else {
          setError('Failed to load account information')
        }
      } catch (err) {
        console.error('Session fetch error:', err)
        setError('Failed to connect to server')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // Clear client-side cookies
      document.cookie = 'verchem-auth=; Max-Age=0; Path=/;'
      document.cookie = 'verchem-session=; Max-Age=0; Path=/;'
      document.cookie = 'verchem-session-sig=; Max-Age=0; Path=/;'
      router.push('/')
    } catch (err) {
      console.error('Logout error:', err)
      window.location.href = '/'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Not authenticated'}</p>
          <Link href="/" className="text-primary-400 hover:text-primary-300">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  const user = session.user
  const displayName = user.name || user.email?.split('@')[0] || 'User'
  const registeredDate = user.registered_at
    ? new Date(user.registered_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-400">Manage your VerChem account</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-8 mb-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              <p className="text-gray-400">{user.email || 'No email'}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid gap-4">
            {/* AIVerID */}
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">AIVerID</span>
              <span className="text-white font-mono text-sm">
                {user.aiverid?.substring(0, 12) || user.id?.substring(0, 12) || 'N/A'}...
              </span>
            </div>

            {/* Subscription */}
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Subscription</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.subscription_tier === 'free'
                  ? 'bg-gray-600 text-gray-200'
                  : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white'
              }`}>
                {user.subscription_tier?.toUpperCase() || 'FREE'}
              </span>
            </div>

            {/* Registration Date */}
            {registeredDate && (
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white">{registeredDate}</span>
              </div>
            )}

            {/* Session Expires */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Session Expires</span>
              <span className="text-gray-300 text-sm">
                {new Date(session.expires_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Early Bird Badge */}
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🎁</span>
            <h3 className="text-lg font-semibold text-green-400">Early Bird Member</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Thank you for being an early adopter! You have access to all VerChem features for FREE.
            When we launch premium tiers, you&apos;ll be eligible for special Early Bird pricing.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/calculators"
            className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl p-4 text-center transition-colors"
          >
            <span className="text-2xl mb-2 block">🧮</span>
            <span className="text-white font-medium">Calculators</span>
          </Link>
          <Link
            href="/periodic-table"
            className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl p-4 text-center transition-colors"
          >
            <span className="text-2xl mb-2 block">⚛️</span>
            <span className="text-white font-medium">Periodic Table</span>
          </Link>
          <Link
            href="/practice/ai"
            className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl p-4 text-center transition-colors"
          >
            <span className="text-2xl mb-2 block">🤖</span>
            <span className="text-white font-medium">AI Practice</span>
          </Link>
          <Link
            href="/support"
            className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-xl p-4 text-center transition-colors"
          >
            <span className="text-2xl mb-2 block">💚</span>
            <span className="text-white font-medium">Support Us</span>
          </Link>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-6 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 font-medium rounded-xl transition-colors"
        >
          Sign Out
        </button>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
