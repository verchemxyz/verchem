/**
 * Logout API
 *
 * SECURITY (Jan 2026 - Fixed by สมหมาย audit):
 * - Clears cookies with same domain as login (.verchem.xyz)
 * - Must match domain from OAuth callback to properly delete
 *
 * Last Updated: 2026-01-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(_request: NextRequest) {
  try {
    await cookies() // Ensure cookies are available

    // Clear all session cookies
    const response = NextResponse.json({ success: true })

    const isProduction = process.env.NODE_ENV === 'production'

    // SECURITY: Must use same domain as login to properly delete cookies
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Delete cookie
      // Match domain from OAuth callback (critical for proper logout!)
      ...(isProduction && { domain: '.verchem.xyz' }),
    }

    response.cookies.set('verchem-session', '', cookieOptions)
    response.cookies.set('verchem-session-sig', '', cookieOptions)
    response.cookies.set('verchem-auth', '', { ...cookieOptions, httpOnly: false })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
