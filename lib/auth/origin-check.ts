import 'server-only'
import { NextRequest } from 'next/server'

/**
 * Validate request originates from same site (CSRF defense-in-depth).
 * SameSite=Lax cookie already mitigates most CSRF; this adds explicit check.
 *
 * Allows:
 * - Requests with matching Origin header
 * - Requests with matching Referer header (fallback)
 * - Same-origin same-site fetches (no Origin in some browsers for same-origin GET)
 *
 * Rejects:
 * - Cross-origin POST/PATCH/DELETE attempts from third-party sites
 */
export function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Use Next.js parsed URL — handles HTTPS proxy + local HTTP dev correctly
  const expectedOrigin = request.nextUrl.origin

  // Strict: at least one of origin or referer must match
  if (origin) {
    return origin === expectedOrigin
  }
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.origin === expectedOrigin
    } catch {
      return false
    }
  }

  // Neither header present — reject for mutations (browser should send one)
  return false
}
