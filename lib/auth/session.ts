/**
 * Session Verification Utility
 *
 * SECURITY (Jan 2026 - Fixed by สมคิด + สมหมาย audit):
 * - All API routes MUST use this utility to verify sessions
 * - Sessions are signed with HMAC-SHA256
 * - Rejects unsigned or tampered sessions
 *
 * Last Updated: 2026-01-09
 */

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import type { SubscriptionTier } from '@/lib/vercal/types'
import { SESSION_COOKIE, SESSION_SIG_COOKIE } from '@/lib/auth/cookie-config'
import { unsealOAuthTokens } from '@/lib/auth/oauth-token-seal'
import { resolveCanonicalAiverId } from '@/lib/auth/session-identity'

export interface VerifiedSession {
  userId: string
  email?: string
  tier: SubscriptionTier
  expiresAt: Date
}

const SUBSCRIPTION_TIERS = new Set<SubscriptionTier>([
  'free',
  'student',
  'professional',
  'enterprise',
])

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function subscriptionTier(user: Record<string, unknown>): SubscriptionTier {
  const directTier = user.subscription_tier
  if (typeof directTier === 'string' && SUBSCRIPTION_TIERS.has(directTier as SubscriptionTier)) {
    return directTier as SubscriptionTier
  }

  const subscription = asRecord(user.subscription)
  const nestedTier = subscription?.tier
  return typeof nestedTier === 'string' && SUBSCRIPTION_TIERS.has(nestedTier as SubscriptionTier)
    ? nestedTier as SubscriptionTier
    : 'free'
}

/** Parse data only after its HMAC has been verified by the caller. */
export function parseVerifiedSessionPayload(
  value: unknown,
  now: Date = new Date()
): VerifiedSession | null {
  const session = asRecord(value)
  const user = asRecord(session?.user)
  if (!session || !user) return null

  const expiresAtValue = session.expires_at
  if (typeof expiresAtValue !== 'string') return null
  const expiresAt = new Date(expiresAtValue)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt < now) return null

  // Identity Standard v2.2: authorization always resolves aiverid/sub before
  // the compatibility id alias. db_id is deliberately never a candidate.
  const userId = resolveCanonicalAiverId(user)
  if (!userId) return null

  const email = typeof user.email === 'string' ? user.email : undefined
  return {
    userId,
    ...(email ? { email } : {}),
    tier: subscriptionTier(user),
    expiresAt,
  }
}

/**
 * Verify session signature using HMAC-SHA256
 * SECURITY: No default secret - SESSION_SECRET is required in production
 */
async function verifySessionSignature(value: string, signature: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET

    // In production, SESSION_SECRET is required
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: SESSION_SECRET is required in production')
        return false
      }
      // In development without secret, skip verification with warning
      console.warn('SESSION_SECRET not set - session verification skipped in development')
      return true
    }

    const enc = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(value))
    const bytes = new Uint8Array(sig)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const expectedSig = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    return expectedSig === signature
  } catch (error) {
    console.error('Session signature verification error:', error)
    return false
  }
}

/**
 * Verify and parse session from cookies
 *
 * SECURITY: This function verifies the HMAC signature before trusting session data.
 * Use this in ALL API routes that need authentication.
 *
 * @returns VerifiedSession if valid, null if invalid/expired/missing
 */
export async function verifySession(): Promise<VerifiedSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)
    const signatureCookie = cookieStore.get(SESSION_SIG_COOKIE)

    // Check for session cookie
    if (!sessionCookie?.value) {
      return null
    }

    // SECURITY: Require signature cookie
    if (!signatureCookie?.value) {
      console.warn('Session cookie without signature - possible forgery attempt')
      return null
    }

    // SECURITY: Verify HMAC signature
    const isValid = await verifySessionSignature(sessionCookie.value, signatureCookie.value)
    if (!isValid) {
      console.warn('Invalid session signature - possible forgery attempt')
      return null
    }

    // Parse session data (only after signature verification!)
    const sessionData: unknown = JSON.parse(sessionCookie.value)
    const verified = parseVerifiedSessionPayload(sessionData)
    if (!verified) {
      console.warn('Verified session has invalid expiry or canonical identity - rejecting')
      return null
    }

    return verified
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

export interface StoredOAuthTokens {
  accessToken?: string
  refreshToken?: string
}

/**
 * Read OAuth bearer tokens from a request's signed session cookie for logout.
 * Invalid, tampered, or legacy token-less sessions return an empty object; the
 * caller must still clear local cookies.
 */
export async function getStoredOAuthTokens(request: NextRequest): Promise<StoredOAuthTokens> {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)
    const signatureCookie = request.cookies.get(SESSION_SIG_COOKIE)
    if (!sessionCookie?.value || !signatureCookie?.value) return {}

    if (!await verifySessionSignature(sessionCookie.value, signatureCookie.value)) return {}

    const parsed: unknown = JSON.parse(sessionCookie.value)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const sealedTokens = (parsed as Record<string, unknown>).oauth_tokens
    if (typeof sealedTokens !== 'string') return {}

    const oauthTokens = await unsealOAuthTokens(sealedTokens)
    if (!oauthTokens) return {}

    return {
      accessToken: oauthTokens.access_token,
      ...(oauthTokens.refresh_token ? { refreshToken: oauthTokens.refresh_token } : {}),
    }
  } catch (error) {
    console.error('Failed to read OAuth tokens from session:', error)
    return {}
  }
}

/**
 * Get session without verification (for non-sensitive operations)
 * WARNING: Only use this for UI display, NOT for authorization decisions!
 */
export async function getSessionUnsafe(): Promise<{
  userId: string
  tier: SubscriptionTier
} | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE)

    if (!sessionCookie) {
      return null
    }

    const sessionData: unknown = JSON.parse(sessionCookie.value)
    const sessionRecord = asRecord(sessionData)
    const user = asRecord(sessionRecord?.user)
    if (!sessionRecord || !user) return null

    // Check expiry
    if (
      typeof sessionRecord.expires_at === 'string'
      && new Date(sessionRecord.expires_at) < new Date()
    ) {
      return null
    }

    return {
      userId: resolveCanonicalAiverId(user) ?? 'anonymous',
      tier: subscriptionTier(user),
    }
  } catch {
    return null
  }
}
