/**
 * Molecules API — POST (create) + GET (list user's molecules)
 *
 * SECURITY:
 * - verifySession() required for all operations
 * - Input validation with max length checks
 * - aiverid_id from session (never from client input)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import {
  createMolecule,
  listMoleculesByUser,
} from '@/lib/supabase/molecules'

const MAX_SMILES_LEN = 2000
const MAX_NAME_LEN = 200
const MAX_NOTES_LEN = 2000
const MAX_MOL_BLOCK_LEN = 50000
const MAX_TAG_LEN = 50
const MAX_TAGS_COUNT = 20

function validateCreateInput(body: Record<string, unknown>) {
  const errors: string[] = []

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Name is required')
  } else if (body.name.length > MAX_NAME_LEN) {
    errors.push(`Name must be at most ${MAX_NAME_LEN} characters`)
  }

  if (typeof body.smiles !== 'string' || body.smiles.trim().length === 0) {
    errors.push('SMILES is required')
  } else if (body.smiles.length > MAX_SMILES_LEN) {
    errors.push(`SMILES must be at most ${MAX_SMILES_LEN} characters`)
  }

  if (body.mol_block !== undefined && typeof body.mol_block === 'string') {
    if (body.mol_block.length > MAX_MOL_BLOCK_LEN) {
      errors.push(`MOL block must be at most ${MAX_MOL_BLOCK_LEN} characters`)
    }
  }

  if (body.inchi !== undefined && typeof body.inchi === 'string') {
    if (body.inchi.length > MAX_SMILES_LEN) {
      errors.push(`InChI must be at most ${MAX_SMILES_LEN} characters`)
    }
  }

  if (body.inchi_key !== undefined && typeof body.inchi_key === 'string') {
    if (body.inchi_key.length > 50) {
      errors.push('InChIKey must be at most 50 characters')
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

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const errors = validateCreateInput(body)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    const molecule = await createMolecule({
      aiverid_id: session.userId,
      name: (body.name as string).trim(),
      smiles: (body.smiles as string).trim(),
      mol_block: typeof body.mol_block === 'string' ? body.mol_block : undefined,
      inchi: typeof body.inchi === 'string' ? body.inchi : undefined,
      inchi_key: typeof body.inchi_key === 'string' ? body.inchi_key : undefined,
      tags: Array.isArray(body.tags)
        ? body.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim())
        : undefined,
      notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
      is_public: typeof body.is_public === 'boolean' ? body.is_public : false,
    })

    return NextResponse.json(molecule, { status: 201 })
  } catch (err: unknown) {
    console.error('POST /api/molecules error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const molecules = await listMoleculesByUser(session.userId)
    return NextResponse.json(molecules)
  } catch (err: unknown) {
    console.error('GET /api/molecules error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
