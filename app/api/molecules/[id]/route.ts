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
import {
  getMoleculeForUser,
  updateMolecule,
  deleteMolecule,
} from '@/lib/supabase/molecules'

const MAX_NAME_LEN = 200
const MAX_NOTES_LEN = 2000
const MAX_TAG_LEN = 50
const MAX_TAGS_COUNT = 20

function validateUpdateInput(body: Record<string, unknown>) {
  const errors: string[] = []

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('Name must be a non-empty string')
    } else if (body.name.length > MAX_NAME_LEN) {
      errors.push(`Name must be at most ${MAX_NAME_LEN} characters`)
    }
  }

  if (body.notes !== undefined && typeof body.notes === 'string') {
    if (body.notes.length > MAX_NOTES_LEN) {
      errors.push(`Notes must be at most ${MAX_NOTES_LEN} characters`)
    }
  }

  if (body.tags !== undefined && Array.isArray(body.tags)) {
    if (body.tags.length > MAX_TAGS_COUNT) {
      errors.push(`At most ${MAX_TAGS_COUNT} tags allowed`)
    }
    for (const tag of body.tags) {
      if (typeof tag !== 'string' || tag.length > MAX_TAG_LEN) {
        errors.push(`Each tag must be at most ${MAX_TAG_LEN} characters`)
        break
      }
    }
  }

  if (body.is_public !== undefined && typeof body.is_public !== 'boolean') {
    errors.push('is_public must be a boolean')
  }

  return errors
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const molecule = await getMoleculeForUser(id, session.userId)

    if (!molecule) {
      return NextResponse.json({ error: 'Molecule not found' }, { status: 404 })
    }

    return NextResponse.json(molecule)
  } catch (err: unknown) {
    console.error('GET /api/molecules/[id] error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const errors = validateUpdateInput(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    const input: { name?: string; tags?: string[]; notes?: string; is_public?: boolean } = {}
    if (body.name !== undefined) input.name = (body.name as string).trim()
    if (body.notes !== undefined) input.notes = (body.notes as string).trim()
    if (body.tags !== undefined) {
      input.tags = (body.tags as unknown[])
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
    }
    if (body.is_public !== undefined) input.is_public = body.is_public as boolean

    const updated = await updateMolecule(id, session.userId, input)

    if (!updated) {
      return NextResponse.json({ error: 'Molecule not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('PATCH /api/molecules/[id] error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
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
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
