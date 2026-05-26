/**
 * Answer Card API — POST
 *
 * SECURITY:
 * - isValidOrigin(request) → 403 if cross-origin
 * - verifySession() → 401 if not logged in (login-gated)
 * - Body guard: object with question string 1..1000 chars
 *
 * DAY 1: No rate-limit, no persistence, no streaming.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { isValidOrigin } from '@/lib/auth/origin-check'
import { askVerified } from '@/lib/answer-cards/orchestrator'
import { checkRateLimit, answerCardDailyConfig } from '@/lib/rate-limit'

function sanitizeQuestion(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > 1000) return null
  // Strip control characters except newlines/tabs
  const cleaned = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const record = body as Record<string, unknown>
    const question = sanitizeQuestion(record.question)
    if (question === null) {
      return NextResponse.json(
        { error: 'question must be a non-empty string between 1 and 1000 characters' },
        { status: 400 }
      )
    }

    // Day 3: tier-based DAILY rate limit (free 20, student 100, professional/enterprise unlimited)
    const rl = checkRateLimit(`answer-card:${session.userId}`, answerCardDailyConfig(session.tier))
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Daily verified-answer limit reached for your plan. Upgrade for a higher daily limit.',
          retryAfter: rl.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter ?? 0),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetTime / 1000)),
          },
        }
      )
    }

    const card = await askVerified(question)
    const successHeaders: Record<string, string> = {}
    if (Number.isFinite(rl.remaining)) {
      successHeaders['X-RateLimit-Remaining'] = String(rl.remaining)
      successHeaders['X-RateLimit-Reset'] = String(Math.ceil(rl.resetTime / 1000))
    }
    return NextResponse.json(card, { status: 200, headers: successHeaders })
  } catch (err: unknown) {
    console.error('POST /api/answer-card error:', err)

    if (err instanceof Error && err.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
