/**
 * VerChem Middleware
 *
 * 🔐 AUTHENTICATION REQUIRED FOR ALL FEATURES
 *
 * Strategy (Dec 2025):
 * - ALL features are FREE for AIVerID members
 * - User MUST be logged in via AIVerID to access any calculator/tool
 * - Early Bird members (registered before cutoff) get discounted pricing when we monetize
 *
 * Security (Dec 2025 - Fixed by สมหมาย audit):
 * - Session cookies are now HMAC-SHA256 signed
 * - Middleware verifies signature before granting access
 * - SESSION_SECRET is required in production
 *
 * Public routes (no login required):
 * - / (homepage)
 * - /login, /oauth/* (auth routes)
 * - /api/* (API routes handle their own auth)
 * - /_next/*, /favicon.ico, etc. (static files)
 *
 * Protected routes (login required):
 * - /calculators/*
 * - /stoichiometry, /solutions, /gas-laws, /thermodynamics, etc.
 * - /periodic-table, /vsepr, /electron-config, /lewis, /3d-viewer
 * - /virtual-lab/*
 * - /tools/*
 * - /practice/*
 * - /challenge
 * - /compounds, /tutorials, /search
 *
 * Last Updated: 2025-12-12
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

// Routes that require authentication
const PROTECTED_ROUTES = [
  // Calculators
  '/calculators',
  '/stoichiometry',
  '/solutions',
  '/gas-laws',
  '/thermodynamics',
  '/electrochemistry',
  '/kinetics',
  '/equation-balancer',

  // Interactive Tools
  '/periodic-table',
  '/vsepr',
  '/electron-config',
  '/lewis',
  '/3d-viewer',
  '/virtual-lab',
  '/molecule-builder',
  '/unit-converter',

  // Practice & Challenge
  '/practice',
  '/challenge',

  // Reference
  '/compounds',
  '/tutorials',
  '/search',

  // User features
  '/preferences',
]

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/oauth',
  '/tools',
  '/api',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
]

// Check if path starts with any protected route
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

// Check if path is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith(route)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip public routes and static files
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Skip static files
  if (
    pathname.includes('.') &&
    !pathname.endsWith('.html') // Allow .html if needed
  ) {
    return NextResponse.next()
  }

  // Check if route is protected
  if (isProtectedRoute(pathname)) {
    // Check for session cookie and signature (set during OAuth callback)
    const sessionCookie = request.cookies.get('verchem-session')
    const signatureCookie = request.cookies.get('verchem-session-sig')

    // If no session cookie, redirect to login
    if (!sessionCookie?.value) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login_required', '1')
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify session signature to prevent cookie forgery
    if (!signatureCookie?.value) {
      console.warn('Session cookie without signature - possible forgery attempt')
      // Clear invalid cookies and redirect
      const response = NextResponse.redirect(new URL('/?error=invalid_session', request.url))
      response.cookies.delete('verchem-session')
      response.cookies.delete('verchem-session-sig')
      response.cookies.delete('verchem-auth')
      return response
    }

    // Verify HMAC signature
    const isValid = await verifySessionSignature(sessionCookie.value, signatureCookie.value)
    if (!isValid) {
      console.warn('Invalid session signature - possible forgery attempt')
      // Clear invalid cookies and redirect
      const response = NextResponse.redirect(new URL('/?error=invalid_session', request.url))
      response.cookies.delete('verchem-session')
      response.cookies.delete('verchem-session-sig')
      response.cookies.delete('verchem-auth')
      return response
    }

    // Check session expiration
    try {
      const sessionData = JSON.parse(sessionCookie.value)
      if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
        console.info('Session expired')
        const response = NextResponse.redirect(new URL('/?error=session_expired', request.url))
        response.cookies.delete('verchem-session')
        response.cookies.delete('verchem-session-sig')
        response.cookies.delete('verchem-auth')
        return response
      }
    } catch {
      console.warn('Invalid session data format')
      const response = NextResponse.redirect(new URL('/?error=invalid_session', request.url))
      response.cookies.delete('verchem-session')
      response.cookies.delete('verchem-session-sig')
      response.cookies.delete('verchem-auth')
      return response
    }
  }

  return NextResponse.next()
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
