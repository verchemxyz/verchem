import 'server-only'

import type { NextResponse } from 'next/server'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'
import { publicApiJson } from '@/lib/api/public-contract'

/**
 * Rate limiting for the public, unauthenticated chemistry API.
 *
 * Honest about what this is: the counter lives in the memory of one serverless
 * instance, so under horizontal scale a client may get more than the stated
 * budget. It is a courtesy limit that stops a single caller from hammering one
 * instance — not a hard quota, and not a security boundary. Anything needing a
 * real quota has to count in shared storage.
 */

/** Requests per window, per client, per instance. */
export const PUBLIC_API_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 60,
} as const

/**
 * Returns a 429 response when the caller is over budget, or `null` to proceed.
 */
export function publicApiRateLimit(request: Request, _endpoint: string): NextResponse | null {
  // One budget across the whole public API, NOT one per route — keying by
  // endpoint would quietly grant 60 x (number of routes) and contradict the
  // documented figure. `_endpoint` is kept for call-site readability only.
  const result = checkRateLimit(`public-api:${getClientId(request)}`, PUBLIC_API_LIMIT)
  if (result.success) return null

  const retryAfter = Math.max(1, result.retryAfter ?? Math.ceil((result.resetTime - Date.now()) / 1000))
  return publicApiJson(
    {
      error: 'Rate limit exceeded',
      limit: `${PUBLIC_API_LIMIT.maxRequests} requests per minute`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(PUBLIC_API_LIMIT.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  )
}
