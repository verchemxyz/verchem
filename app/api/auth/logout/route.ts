/**
 * Logout API
 *
 * SECURITY (Jan 2026 - Fixed by สมหมาย audit):
 * - Clears cookies with the SAME domain/path as login, or the deletion is a
 *   no-op for the domain-scoped production cookie.
 * - Domain/path now come from lib/auth/cookie-config (single source of truth),
 *   so logout can never drift from how the OAuth callback set them.
 * - Revokes access + refresh tokens at the AIVerID hub on a best-effort basis.
 *   Hub failure never prevents local cookie clearing.
 *
 * Last Updated: 2026-05-31
 */

import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookies } from '@/lib/auth/cookie-config'
import { getStoredOAuthTokens, type StoredOAuthTokens } from '@/lib/auth/session'

const AIVERID_REVOKE_URL = 'https://aiverid-backend-production.up.railway.app/oauth/revoke'
const AIVERID_CLIENT_ID = 'aiv_verchem_production_2025'
const REVOKE_TIMEOUT_MS = 3_000

async function revokeToken(token: string): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REVOKE_TIMEOUT_MS)

  try {
    const response = await fetch(AIVERID_REVOKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: AIVERID_CLIENT_ID,
        token,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`AIVerID revoke returned HTTP ${response.status}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function revokeStoredTokens(tokens: StoredOAuthTokens): Promise<void> {
  const availableTokens = [tokens.accessToken, tokens.refreshToken]
    .filter((token): token is string => typeof token === 'string')

  const results = await Promise.allSettled(availableTokens.map((token) => revokeToken(token)))
  const failedCount = results.filter((result) => result.status === 'rejected').length
  if (failedCount > 0) {
    console.warn(`AIVerID token revocation failed for ${failedCount} token(s)`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokens = await getStoredOAuthTokens(request)
    await revokeStoredTokens(tokens)
  } catch (error) {
    // Best effort only: never trap a user in a local session because the hub or
    // token parsing failed. Do not log bearer token values.
    console.error('AIVerID logout revocation failed:', error)
  }

  // Always clear all local cookies after the best-effort revoke attempt.
  const response = NextResponse.json({ success: true })
  clearSessionCookies(response)
  return response
}
