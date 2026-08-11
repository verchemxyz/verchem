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

export interface VerifiedSession {
  userId: string
  email?: string
  tier: SubscriptionTier
  expiresAt: Date
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
    const sessionData = JSON.parse(sessionCookie.value)

    // Check expiry
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      console.info('Session expired')
      return null
    }

    // Extract user data
    // Handle both subscription_tier (from OAuth) and subscription.tier (legacy)
    const tier: SubscriptionTier =
      sessionData.user?.subscription_tier ||
      sessionData.user?.subscription?.tier ||
      'free'

    // SECURITY: a verified session MUST carry a stable user identifier. Falling
    // back to a literal 'anonymous' would collapse every such session into one
    // shared bucket — cross-user data mixing / IDOR. Reject instead of inventing.
    const userId = sessionData.user?.sub || sessionData.user?.id || sessionData.user?.aiverid
    if (typeof userId !== 'string' || userId.trim() === '') {
      console.warn('Verified session missing a stable user id - rejecting')
      return null
    }

    return {
      userId,
      email: sessionData.user?.email,
      tier,
      expiresAt: new Date(sessionData.expires_at),
    }
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

    const oauthTokens = (parsed as Record<string, unknown>).oauth_tokens
    if (typeof oauthTokens !== 'object' || oauthTokens === null || Array.isArray(oauthTokens)) {
      return {}
    }

    const record = oauthTokens as Record<string, unknown>
    const accessToken = typeof record.access_token === 'string' && record.access_token.length > 0
      ? record.access_token
      : undefined
    const refreshToken = typeof record.refresh_token === 'string' && record.refresh_token.length > 0
      ? record.refresh_token
      : undefined

    return {
      ...(accessToken ? { accessToken } : {}),
      ...(refreshToken ? { refreshToken } : {}),
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

    const sessionData = JSON.parse(sessionCookie.value)

    // Check expiry
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      return null
    }

    const tier: SubscriptionTier =
      sessionData.user?.subscription_tier ||
      sessionData.user?.subscription?.tier ||
      'free'

    return {
      userId: sessionData.user?.sub || sessionData.user?.id || 'anonymous',
      tier,
    }
  } catch {
    return null
  }
}
