/**
 * Session Cookie Configuration — SINGLE SOURCE OF TRUTH
 *
 * Why this file exists (the prod login-loop, May 2026):
 * The OAuth callback SET the session cookies with `domain: '.verchem.xyz'` in
 * production, but `proxy.ts` CLEARED them with `response.cookies.delete(name)`
 * — which omits the domain. A Set-Cookie deletion only removes a cookie when
 * its name AND domain AND path match the original. So the domain-scoped cookie
 * was never actually deleted: any single verification failure left the stale
 * cookie in place and every subsequent protected-route click re-failed and
 * re-bounced → an inescapable redirect loop.
 *
 * Fix: set + clear go through THESE helpers so the domain/path/sameSite/secure
 * can never drift apart again ("Think System, not Instance").
 *
 * Edge-safe: this module only touches `process.env` and a `NextResponse`. No
 * `node:*`, no `next/headers`, no `server-only` — importable from middleware
 * (Edge runtime), route handlers (Node) and the standalone test runner alike.
 */

import type { NextResponse } from 'next/server'

// Cookie names — referenced everywhere instead of string literals.
export const SESSION_COOKIE = 'verchem-session'
export const SESSION_SIG_COOKIE = 'verchem-session-sig'
export const AUTH_COOKIE = 'verchem-auth'

// 7 days. Shared by the cookie maxAge and the session `expires_at` claim.
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

/**
 * Resolve the cookie domain ONCE. Both set and clear read this, so they always
 * match. Override with `SESSION_COOKIE_DOMAIN` (e.g. preview deployments on a
 * different host); falls back to the apex+www-sharing default in production.
 */
export function sessionCookieDomain(): string | undefined {
  const explicit = process.env.SESSION_COOKIE_DOMAIN?.trim()
  if (explicit) return explicit
  // Default: share cookies across apex (verchem.xyz) and www in production.
  return process.env.NODE_ENV === 'production' ? '.verchem.xyz' : undefined
}

interface SessionCookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
  domain?: string
  maxAge: number
}

function baseOptions(maxAge: number): SessionCookieOptions {
  const isProduction = process.env.NODE_ENV === 'production'
  const domain = sessionCookieDomain()
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
    ...(domain ? { domain } : {}),
  }
}

/** Options for SETTING the signed, httpOnly session cookies. */
export function sessionWriteOptions(): SessionCookieOptions {
  return baseOptions(SESSION_TTL_SECONDS)
}

/**
 * Options for the client-readable auth indicator (`verchem-auth`, httpOnly:false)
 * — lets client JS know it is logged in without calling /api/session.
 */
export function authIndicatorWriteOptions(): SessionCookieOptions {
  return { ...baseOptions(SESSION_TTL_SECONDS), httpOnly: false }
}

/** Options that delete a cookie (empty value, maxAge 0) with matching scope. */
export function sessionClearOptions(): SessionCookieOptions {
  return baseOptions(0)
}

/**
 * Serialize a cookie DELETION (empty value, Max-Age=0) for one explicit scope.
 * Used for the extra scopes below: the same cookie name under a different Domain
 * is a DISTINCT cookie, and `ResponseCookies.set()` overwrites by name, so those
 * must be emitted as appended Set-Cookie headers rather than another set().
 */
function clearCookieHeader(name: string, domain: string | undefined, httpOnly: boolean): string {
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0']
  if (domain) parts.push(`Domain=${domain}`)
  if (httpOnly) parts.push('HttpOnly')
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  parts.push('SameSite=Lax')
  return parts.join('; ')
}

/**
 * Clear ALL three session cookies on a response, using the SAME domain/path they
 * were set with — instead of `response.cookies.delete(name)`, which omits the
 * domain and silently fails to remove domain-scoped cookies (the prod login-loop).
 *
 * Defense-in-depth: also clears the cookies under OTHER scopes they may have been
 * set under previously — host-only (before a domain was configured) and the legacy
 * default `.verchem.xyz` (when SESSION_COOKIE_DOMAIN now overrides it). This makes
 * the redirect loop impossible to recreate through any future cookie-scope drift.
 */
export function clearSessionCookies(response: NextResponse): void {
  // Primary: clear the currently-configured scope through the typed cookie API.
  const opts = sessionClearOptions()
  response.cookies.set(SESSION_COOKIE, '', opts)
  response.cookies.set(SESSION_SIG_COOKIE, '', opts)
  response.cookies.set(AUTH_COOKIE, '', { ...opts, httpOnly: false })

  // Extra scopes the primary set() can't reach (distinct cookie per Domain).
  const current = sessionCookieDomain()
  const extraDomains = new Set<string | undefined>([undefined]) // host-only
  if (process.env.NODE_ENV === 'production') extraDomains.add('.verchem.xyz') // legacy default
  extraDomains.delete(current) // already handled by the primary set() above

  for (const domain of extraDomains) {
    response.headers.append('set-cookie', clearCookieHeader(SESSION_COOKIE, domain, true))
    response.headers.append('set-cookie', clearCookieHeader(SESSION_SIG_COOKIE, domain, true))
    response.headers.append('set-cookie', clearCookieHeader(AUTH_COOKIE, domain, false))
  }
}
