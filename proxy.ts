/**
 * VerChem Proxy (Next.js 16 Edge Middleware)
 *
 * 🔐 AUTHENTICATION REQUIRED FOR PROTECTED ROUTES
 *
 * Strategy (Dec 2025):
 * - Local-only chemistry tools may be used without an AIVerID account
 * - Account-backed features still require AIVerID
 * - Early Bird members (registered before cutoff) get discounted pricing when we monetize
 *
 * Security (Jan 2026 - Fixed by สมคิด + สมหมาย audit):
 * - Session cookies are now HMAC-SHA256 signed
 * - Proxy verifies signature before granting access
 * - SESSION_SECRET is required in production
 *
 * Public routes (no login required) — 2026-08-11, พี่จ๊อบเคาะ Free tier:
 * - Every local-compute tool (calculators, periodic table, editors, viewers)
 * - Reference/browse surfaces (compounds, elements, organic, spectroscopy,
 *   tutorials, search, practice, challenge)
 * - /, /login, /oauth/*, /tools/*, /solutions, /api/* (routes own their auth),
 *   static files
 *
 * Protected routes (login required):
 * - /account/* (personal libraries, card history)
 * - /preferences
 * - Saving/mutation always re-verifies AIVerID at the API layer — the proxy
 *   gate is UX, never the security boundary.
 *
 * Last Updated: 2026-08-11
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_SIG_COOKIE,
  clearSessionCookies,
} from '@/lib/auth/cookie-config'
import { applyPublicApiVersionHeaders } from '@/lib/api/public-contract'

function publicRouteResponse(pathname: string): NextResponse {
  const response = NextResponse.next()
  if (pathname === '/api/chemistry/v2' || pathname.startsWith('/api/chemistry/v2/')) {
    // The proxy runs before route resolution, so framework-generated 404/405/500
    // responses carry the same v2 headers as application JSON responses.
    applyPublicApiVersionHeaders(response.headers)
  }
  return response
}

// Verify session signature using HMAC-SHA256
async function verifySessionSignature(value: string, signature: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET

    // In production, SESSION_SECRET is required
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('SESSION_SECRET is required in production')
        return false
      }
      // In development, allow without secret but log warning
      console.warn('SESSION_SECRET not set - using insecure fallback for development')
      return true // Allow in dev for easier testing
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
    console.error('Session signature verification failed:', error)
    return false
  }
}

// Routes that require authentication.
// 2026-08-11 (พี่จ๊อบเคาะ): local-compute tools and reference data are open to
// anonymous visitors per the Free tier — growth first. Identity-bound surfaces
// (saving, libraries, card history under /account and the APIs) stay gated.
const PROTECTED_ROUTES = [
  '/account',
  '/preferences',
]

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/oauth',
  '/tools',
  '/solutions',
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',

  // Calculators (local-compute — anonymous)
  '/calculators',
  '/stoichiometry',
  '/gas-laws',
  '/thermodynamics',
  '/electrochemistry',
  '/kinetics',
  '/equation-balancer',

  // Interactive tools (local-compute — anonymous)
  '/periodic-table',
  '/vsepr',
  '/electron-config',
  '/lewis',
  '/3d-viewer',
  '/virtual-lab',
  '/unit-converter',
  '/draw',

  // Practice & reference (anonymous)
  '/practice',
  '/challenge',
  '/compounds',
  '/elements',
  '/organic',
  '/spectroscopy',
  '/tutorials',
  '/search',
]

// Check if path starts with any protected route
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

// Check if path is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') return pathname === '/'
    return pathname === route || pathname.startsWith(`${route}/`)
  })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip public routes and static files
  if (isPublicRoute(pathname)) {
    return publicRouteResponse(pathname)
  }

  // Skip static files — but never inside a protected branch: a dotted segment
  // like /account/cards/x.json still resolves to a dynamic route, so the auth
  // gate must run before any static-file shortcut.
  if (
    !isProtectedRoute(pathname) &&
    pathname.includes('.') &&
    !pathname.endsWith('.html') // Allow .html if needed
  ) {
    return NextResponse.next()
  }

  // Check if route is protected
  if (isProtectedRoute(pathname)) {
    // Check for session cookie and signature (set during OAuth callback)
    const sessionCookie = request.cookies.get(SESSION_COOKIE)
    const signatureCookie = request.cookies.get(SESSION_SIG_COOKIE)

    // If no session cookie, redirect to login (clearing any orphan sig/auth
    // cookies left without their session — keeps the cookie set consistent).
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login_required', '1')
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      clearSessionCookies(response)
      return response
    }

    // Verify session signature to prevent cookie forgery
    if (!signatureCookie?.value) {
      console.warn('Session cookie without signature - possible forgery attempt')
      // Clear invalid cookies (matching domain/path) and redirect
      const response = NextResponse.redirect(new URL('/?error=invalid_session', request.url))
      clearSessionCookies(response)
      return response
    }

    // Verify HMAC signature
    const isValid = await verifySessionSignature(sessionCookie.value, signatureCookie.value)
    if (!isValid) {
      console.warn('Invalid session signature - possible forgery attempt')
      // Clear invalid cookies (matching domain/path) and redirect
      const response = NextResponse.redirect(new URL('/?error=invalid_session', request.url))
      clearSessionCookies(response)
      return response
    }

    // Check session expiration
    try {
      const sessionData = JSON.parse(sessionCookie.value)
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        console.info('Session expired')
        const response = NextResponse.redirect(new URL('/?error=session_expired', request.url))
        clearSessionCookies(response)
        return response
      }
    } catch {
      console.warn('Invalid session data format')
      const response = NextResponse.redirect(new URL('/?error=invalid_session', request.url))
      clearSessionCookies(response)
      return response
    }
  }

  return NextResponse.next()
}

// Configure which routes the proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except _next internals and the favicon. Image
     * extensions are deliberately NOT excluded here: a blanket suffix rule
     * would also skip auth for dotted paths under protected branches (e.g.
     * /account/cards/x.png resolves to a dynamic route, not a static file).
     * Real static assets return via the in-code skip above instead.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
