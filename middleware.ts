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
 * Last Updated: 2025-12-03
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // SEO Landing Pages with tools
  '/tools',

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

export function middleware(request: NextRequest) {
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
    // Check for session cookie (set during OAuth callback)
    const sessionCookie = request.cookies.get('verchem-session')
    const authCookie = request.cookies.get('verchem-auth')

    // If not logged in, redirect to login
    if (!sessionCookie?.value || !authCookie?.value) {
      // Store the original URL to redirect back after login
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login_required', '1')
      loginUrl.searchParams.set('redirect', pathname)

      return NextResponse.redirect(loginUrl)
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
