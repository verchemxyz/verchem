import { NextRequest, NextResponse } from 'next/server'
import { isValidOrigin } from '@/lib/auth/origin-check'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'
import {
  createDeterministicAnswerCard,
  DirectCalculationError,
} from '@/lib/answer-cards/deterministic-card'
import { SigningKeyConfigurationError } from '@/lib/answer-cards/signing-key'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 64 * 1024
const SIGNING_LIMIT = { windowMs: 60 * 1000, maxRequests: 30 }

export async function POST(request: NextRequest) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    const limit = checkRateLimit(`verified-calculation:${getClientId(request)}`, SIGNING_LIMIT)
    if (!limit.success) {
      return NextResponse.json(
        {
          error: 'Signing limit reached. Please wait before creating another artifact.',
          retryAfter: limit.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfter ?? 0) },
        }
      )
    }

    const raw = await request.text()
    if (raw.length === 0) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
    }

    let body: unknown
    try {
      body = JSON.parse(raw) as unknown
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const record = body as Record<string, unknown>
    const unknownFields = Object.keys(record).filter((key) => key !== 'tool' && key !== 'input')
    if (unknownFields.length > 0) {
      return NextResponse.json(
        { error: `Unknown request field${unknownFields.length === 1 ? '' : 's'}: ${unknownFields.join(', ')}` },
        { status: 400 }
      )
    }
    if (typeof record.tool !== 'string' || record.tool.length === 0 || record.tool.length > 120) {
      return NextResponse.json({ error: 'tool must be a non-empty string' }, { status: 400 })
    }

    const card = await createDeterministicAnswerCard(record.tool, record.input)
    return NextResponse.json(card, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    })
  } catch (error: unknown) {
    if (error instanceof DirectCalculationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.httpStatus }
      )
    }
    if (error instanceof SigningKeyConfigurationError) {
      console.error('POST /api/verified-calculation signing configuration error:', error)
      return NextResponse.json(
        { error: 'The signing service is temporarily unavailable.' },
        { status: 503 }
      )
    }

    console.error('POST /api/verified-calculation error:', error)
    return NextResponse.json({ error: 'Could not create the signed artifact.' }, { status: 500 })
  }
}
