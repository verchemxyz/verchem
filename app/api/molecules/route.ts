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
import { isValidOrigin } from '@/lib/auth/origin-check'
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

  if (body.mol_block !== undefined) {
    if (typeof body.mol_block !== 'string') {
      errors.push('MOL block must be a string')
    } else if (body.mol_block.length > MAX_MOL_BLOCK_LEN) {
      errors.push(`MOL block must be at most ${MAX_MOL_BLOCK_LEN} characters`)
    }
  }

  if (body.inchi !== undefined) {
    if (typeof body.inchi !== 'string') {
      errors.push('InChI must be a string')
    } else if (body.inchi.length > MAX_SMILES_LEN) {
      errors.push(`InChI must be at most ${MAX_SMILES_LEN} characters`)
    }
  }

  if (body.inchi_key !== undefined) {
    if (typeof body.inchi_key !== 'string') {
      errors.push('InChIKey must be a string')
    } else if (body.inchi_key.length > 50) {
      errors.push('InChIKey must be at most 50 characters')
    }
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      errors.push('Notes must be a string')
    } else if (body.notes.length > MAX_NOTES_LEN) {
      errors.push(`Notes must be at most ${MAX_NOTES_LEN} characters`)
    }
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (body.tags.length > MAX_TAGS_COUNT) {
        errors.push(`At most ${MAX_TAGS_COUNT} tags allowed`)
      }
      for (const tag of body.tags) {
        if (typeof tag !== 'string' || tag.length > MAX_TAG_LEN) {
          errors.push(`Each tag must be a string of at most ${MAX_TAG_LEN} characters`)
          break
        }
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

    const errors = validateCreateInput(body as Record<string, unknown>)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    const record = body as Record<string, unknown>
    const molecule = await createMolecule({
      aiverid_id: session.userId,
      name: (record.name as string).trim(),
      smiles: (record.smiles as string).trim(),
      mol_block: typeof record.mol_block === 'string' ? record.mol_block : undefined,
      inchi: typeof record.inchi === 'string' ? record.inchi : undefined,
      inchi_key: typeof record.inchi_key === 'string' ? record.inchi_key : undefined,
      tags: Array.isArray(record.tags)
        ? record.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim())
        : undefined,
      notes: typeof record.notes === 'string' ? record.notes.trim() : undefined,
      is_public: typeof record.is_public === 'boolean' ? record.is_public : false,
    })

    return NextResponse.json(molecule, { status: 201 })
  } catch (err: unknown) {
    console.error('POST /api/molecules error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
