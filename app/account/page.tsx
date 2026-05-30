'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalcShell, Card, SectionTitle, Button } from '@/components/lab'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border border-t-primary-500 rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-destructive-strong mb-4">{error || 'Not authenticated'}</p>
          <Link href="/" className="text-primary-600 hover:text-primary-500 transition-colors">
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
    <CalcShell
      eyebrow="Account"
      title={displayName}
      subtitle={user.email || 'No email linked'}
      backHref="/"
      backLabel="Home"
      action={
        <Button variant="secondary" onClick={handleLogout}>
          Sign out
        </Button>
      }
    >
      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-foreground">{initials}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">{displayName}</h2>
            <p className="text-sm text-muted-foreground truncate">{user.email || 'No email linked'}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-medium text-success-strong">
              Active session
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-md border border-border bg-muted p-4 text-center">
            <div className="text-2xl font-bold text-foreground font-mono">{memberDays}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Days</div>
          </div>
          <div className="rounded-md border border-border bg-muted p-4 text-center">
            <div className="text-2xl font-bold text-foreground font-mono">∞</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Access</div>
          </div>
          <div className="rounded-md border border-border bg-muted p-4 text-center">
            <div className="text-2xl font-bold text-foreground font-mono">8</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Calculators</div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="rounded-md border border-border bg-muted p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AIVerID</div>
            <div className="text-foreground font-mono text-sm break-all">
              {user.aiverid?.substring(0, 16) || user.id?.substring(0, 16)}…
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Member since</div>
            <div className="text-foreground text-sm">{registeredDate}</div>
          </div>
        </div>
      </Card>

      {/* Subscription Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Early Bird Member</h3>
            <p className="text-success-strong text-sm font-medium">All features unlocked</p>
            <p className="text-muted-foreground text-sm mt-3 max-w-md">
              Thank you for being an early adopter. You have lifetime access to all VerChem features.
              When we launch premium tiers, you&apos;ll receive exclusive Early Bird pricing.
            </p>
          </div>
          <span className="rounded-md border border-success/40 bg-success/10 px-3 py-1 text-sm font-bold text-success-strong shrink-0">
            FREE
          </span>
        </div>
      </Card>

      {/* Quick Access Grid */}
      <Card className="p-6">
        <SectionTitle className="mb-4">Quick access</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { href: '/account/molecules', label: 'My Molecules' },
            { href: '/account/cards', label: 'Verified Cards' },
            { href: '/calculators', label: 'Calculators' },
            { href: '/periodic-table', label: 'Periodic Table' },
            { href: '/tools', label: 'All Tools' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-border bg-muted hover:bg-card hover:border-primary-500 p-5 text-center transition-colors"
            >
              <span className="text-foreground font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <p className="text-center text-muted-foreground text-sm">
        Session expires: {new Date(session.expires_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </CalcShell>
  )
}
