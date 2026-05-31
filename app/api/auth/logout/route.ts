/**
 * Logout API
 *
 * SECURITY (Jan 2026 - Fixed by สมหมาย audit):
 * - Clears cookies with the SAME domain/path as login, or the deletion is a
 *   no-op for the domain-scoped production cookie.
 * - Domain/path now come from lib/auth/cookie-config (single source of truth),
 *   so logout can never drift from how the OAuth callback set them.
 *
 * Last Updated: 2026-05-31
 */

import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookies } from '@/lib/auth/cookie-config'

export async function POST(_request: NextRequest) {
  try {
    // Clear all session cookies (verchem-session, -sig, -auth) with the
    // matching domain/path so they are actually removed.
    const response = NextResponse.json({ success: true })
    clearSessionCookies(response)
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
