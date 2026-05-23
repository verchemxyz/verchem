/**
 * Molecule Single-Item API — GET / PATCH / DELETE
 *
 * SECURITY:
 * - verifySession() required
 * - Mutations enforce aiverid_id match (no IDOR)
 * - Input validation with max length checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { isValidOrigin } from '@/lib/auth/origin-check'
import {
  getPublicMoleculeById,
  getMoleculeForUser,
  updateMolecule,
  deleteMolecule,
} from '@/lib/supabase/molecules'

import {
  validateUpdateMoleculeInput,
} from '@/lib/molecule/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Validate UUID format (defense against malformed input)
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid molecule id' }, { status: 400 })
    }

    const session = await verifySession()

    // Authenticated: try user-owned first
    if (session?.userId) {
      const owned = await getMoleculeForUser(id, session.userId)
      if (owned) return NextResponse.json(owned)
    }

    // Public fallback (for authenticated non-owner + anonymous)
    const publicMol = await getPublicMoleculeById(id)
    if (publicMol) {
      return NextResponse.json(publicMol)
    }

    // Hide existence (404) for unauthorized access to private molecules
    return NextResponse.json({ error: 'Molecule not found' }, { status: 404 })
  } catch (err: unknown) {
    console.error('GET /api/molecules/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
    }

    const errors = validateUpdateMoleculeInput(body as Record<string, unknown>)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    const record = body as Record<string, unknown>
    const input: { name?: string; tags?: string[]; notes?: string; is_public?: boolean } = {}
    if (record.name !== undefined) input.name = (record.name as string).trim()
    if (record.notes !== undefined) input.notes = (record.notes as string).trim()
    if (record.tags !== undefined) {
      input.tags = (record.tags as unknown[])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
    }
    if (record.is_public !== undefined) input.is_public = record.is_public as boolean

    const updated = await updateMolecule(id, session.userId, input)

    if (!updated) {
      return NextResponse.json({ error: 'Molecule not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('PATCH /api/molecules/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isValidOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const deleted = await deleteMolecule(id, session.userId)

    if (!deleted) {
      return NextResponse.json({ error: 'Molecule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('DELETE /api/molecules/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
