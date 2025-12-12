/**
 * Rate Limiter for API Routes
 *
 * Simple in-memory rate limiting for API protection
 * SECURITY: Prevents brute-force and DoS attacks
 *
 * Last Updated: 2025-12-12
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for horizontal scaling)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * Check and update rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // If no entry or window expired, create new
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Window still active
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For with fallback to IP
 */
export function getClientId(request: Request): string {
  // Try X-Forwarded-For first (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take first IP (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Fallback: use a hash of headers to identify client
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''

  // Create a simple fingerprint (not perfect, but helps)
  return `anon-${hashCode(userAgent + acceptLanguage)}`
}

/**
 * Simple hash function for fingerprinting
 */
function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// Pre-configured rate limiters for different endpoints
export const RATE_LIMITS = {
  // AI Tutor: 10 requests per minute per user
  aiTutor: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },

  // Problem Generator: 20 requests per minute per user
  problemGenerator: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  },

  // Problem Validator: 30 requests per minute per user
  problemValidator: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },

  // General API: 100 requests per minute per user
  general: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },

  // Strict: 5 requests per minute (for sensitive endpoints)
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
} as const
