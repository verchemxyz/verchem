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
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{error || 'Not authenticated'}</p>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  const user = session.user
  const displayName = user.name || user.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const registeredDate = user.registered_at
    ? new Date(user.registered_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'January 2026'

  // Calculate days as member
  const memberDays = user.registered_at
    ? Math.floor((Date.now() - new Date(user.registered_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Profile Hero Card */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-800 overflow-hidden">
            {/* Top Banner */}
            <div className="h-32 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
              {/* Chemistry decoration */}
              <div className="absolute right-8 top-4 text-white/20 text-6xl font-mono">⚗️</div>
            </div>

            {/* Profile Content */}
            <div className="px-8 pb-8 -mt-16 relative">
              {/* Avatar */}
              <div className="flex items-end gap-6 mb-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-1 shadow-2xl shadow-purple-500/30">
                    <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center">
                      <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    </div>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900" />
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-bold text-white mb-1">{displayName}</h1>
                  <p className="text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user.email || 'No email linked'}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
                  <div className="text-2xl font-bold text-cyan-400">{memberDays}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Days</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
                  <div className="text-2xl font-bold text-purple-400">∞</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Access</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700/50">
                  <div className="text-2xl font-bold text-pink-400">8</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Calculators</div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">AIVerID</div>
                      <div className="text-white font-mono text-sm">{user.aiverid?.substring(0, 16) || user.id?.substring(0, 16)}...</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Member Since</div>
                      <div className="text-white text-sm">{registeredDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
          <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full" />
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🎁</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">Early Bird Member</h3>
                    <p className="text-emerald-400 text-sm font-medium">All Features Unlocked</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-3 max-w-md">
                  Thank you for being an early adopter! You have lifetime access to all VerChem features.
                  When we launch premium tiers, you&apos;ll receive exclusive Early Bird pricing.
                </p>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 rounded-full">
                <span className="text-white font-bold text-sm">FREE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/calculators', icon: '🧮', label: 'Calculators', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
            { href: '/periodic-table', icon: '⚛️', label: 'Periodic Table', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
            { href: '/tools', icon: '🔬', label: 'All Tools', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
            { href: '/support', icon: '💚', label: 'Support Us', color: 'from-pink-500/20 to-red-500/20', border: 'border-pink-500/30' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative bg-gray-900/50 hover:bg-gray-800/50 border ${item.border} rounded-xl p-5 text-center transition-all hover:scale-105 hover:shadow-xl`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-white font-medium text-sm">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Session expires: {new Date(session.expires_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
