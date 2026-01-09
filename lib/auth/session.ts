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
import type { SubscriptionTier } from '@/lib/vercal/types'

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
    const sessionCookie = cookieStore.get('verchem-session')
    const signatureCookie = cookieStore.get('verchem-session-sig')

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

    return {
      userId: sessionData.user?.sub || sessionData.user?.id || sessionData.user?.aiverid || 'anonymous',
      email: sessionData.user?.email,
      tier,
      expiresAt: new Date(sessionData.expires_at),
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
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
    const sessionCookie = cookieStore.get('verchem-session')

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
