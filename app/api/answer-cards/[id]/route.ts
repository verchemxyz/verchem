/**
 * Saved Answer Card single-item API — GET / PATCH / DELETE
 *
 * SECURITY:
 * - GET: owner sees their card; anyone sees a public card (aiverid_id stripped).
 *   Private cards 404 for non-owners (existence hidden).
 * - PATCH/DELETE: verifySession + ownership enforced in the data layer (no IDOR).
 * - Every returned card is re-verified server-side (signatureValid) so a row
 *   tampered directly in the DB cannot display a VERIFIED badge.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { isValidOrigin } from '@/lib/auth/origin-check'
import {
  getAnswerCardForUser,
  getPublicAnswerCardById,
  setAnswerCardVisibility,
  deleteAnswerCard,
} from '@/lib/supabase/answer-cards'

interface RouteParams {
  params: Promise<{ id: string }>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid card id' }, { status: 400 })
    }

    const session = await verifySession()

    // Owner view first (full access to their own card, public or not)
    if (session?.userId && session.userId !== 'anonymous') {
      const owned = await getAnswerCardForUser(id, session.userId)
      if (owned) return NextResponse.json(owned)
    }

    // Public fallback (authenticated non-owner + anonymous)
    const pub = await getPublicAnswerCardById(id)
    if (pub) return NextResponse.json(pub)

    return NextResponse.json({ error: 'Answer card not found' }, { status: 404 })
  } catch (err: unknown) {
    console.error('GET /api/answer-cards/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    const session = await verifySession()
    if (!session?.userId || session.userId === 'anonymous') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid card id' }, { status: 400 })
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
    if (typeof record.is_public !== 'boolean') {
      return NextResponse.json({ error: 'is_public (boolean) is required' }, { status: 400 })
    }

    const updated = await setAnswerCardVisibility(id, session.userId, record.is_public)
    if (!updated) {
      return NextResponse.json({ error: 'Answer card not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('PATCH /api/answer-cards/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    const session = await verifySession()
    if (!session?.userId || session.userId === 'anonymous') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid card id' }, { status: 400 })
    }

    const deleted = await deleteAnswerCard(id, session.userId)
    if (!deleted) {
      return NextResponse.json({ error: 'Answer card not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('DELETE /api/answer-cards/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
