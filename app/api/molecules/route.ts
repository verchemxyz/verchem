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

import {
  validateCreateMoleculeInput,
} from '@/lib/molecule/validation'

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

    const errors = validateCreateMoleculeInput(body as Record<string, unknown>)
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
