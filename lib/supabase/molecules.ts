import 'server-only'

/**
 * Molecule CRUD Helpers — Server-only
 *
 * SECURITY:
 * - Uses SUPABASE_SERVICE_ROLE_KEY (server-only, never exposed to client)
 * - All user scoping enforced at app level (where aiverid_id = ...)
 * - Must ONLY be imported in API routes or server-side code
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface Molecule {
  id: string
  aiverid_id: string
  name: string
  smiles: string
  mol_block: string | null
  inchi: string | null
  inchi_key: string | null
  tags: string[] | null
  notes: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CreateMoleculeInput {
  aiverid_id: string
  name: string
  smiles: string
  mol_block?: string
  inchi?: string
  inchi_key?: string
  tags?: string[]
  notes?: string
  is_public?: boolean
}

export interface UpdateMoleculeInput {
  name?: string
  tags?: string[]
  notes?: string
  is_public?: boolean
}

/**
 * Public-safe view of a molecule (strips owner identifier).
 * Returns only molecules where is_public = true.
 */
export interface PublicMolecule {
  id: string
  name: string
  smiles: string
  mol_block: string | null
  inchi: string | null
  inchi_key: string | null
  tags: string[] | null
  notes: string | null
  is_public: true
  created_at: string
  updated_at: string
}

export async function getPublicMoleculeById(id: string): Promise<PublicMolecule | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('molecules')
    .select('id, name, smiles, mol_block, inchi, inchi_key, tags, notes, is_public, created_at, updated_at')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('getPublicMoleculeById error:', error)
    throw new Error('Database error while fetching molecule')
  }

  return data as PublicMolecule
}

export async function createMolecule(input: CreateMoleculeInput): Promise<Molecule> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('molecules')
    .insert({
      aiverid_id: input.aiverid_id,
      name: input.name,
      smiles: input.smiles,
      mol_block: input.mol_block ?? null,
      inchi: input.inchi ?? null,
      inchi_key: input.inchi_key ?? null,
      tags: input.tags ?? null,
      notes: input.notes ?? null,
      is_public: input.is_public ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('createMolecule error:', error)
    throw new Error('Database error while creating molecule')
  }

  return data as Molecule
}

export async function listMoleculesByUser(aiverid_id: string): Promise<Molecule[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('molecules')
    .select('*')
    .eq('aiverid_id', aiverid_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listMoleculesByUser error:', error)
    throw new Error('Database error while listing molecules')
  }

  return (data ?? []) as Molecule[]
}

export async function getMoleculeById(id: string): Promise<Molecule | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('molecules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // no rows
    console.error('getMoleculeById error:', error)
    throw new Error('Database error while fetching molecule')
  }

  return data as Molecule
}

export async function getMoleculeForUser(
  id: string,
  aiverid_id: string
): Promise<Molecule | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('molecules')
    .select('*')
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('getMoleculeForUser error:', error)
    throw new Error('Database error while fetching molecule')
  }

  return data as Molecule
}

export async function updateMolecule(
  id: string,
  aiverid_id: string,
  input: UpdateMoleculeInput
): Promise<Molecule | null> {
  const supabase = getSupabase()

  // SECURITY: enforce ownership before update
  const existing = await getMoleculeForUser(id, aiverid_id)
  if (!existing) return null

  const { data, error } = await supabase
    .from('molecules')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.is_public !== undefined && { is_public: input.is_public }),
    })
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)
    .select()
    .single()

  if (error) {
    console.error('updateMolecule error:', error)
    throw new Error('Database error while updating molecule')
  }

  return data as Molecule
}

export async function deleteMolecule(id: string, aiverid_id: string): Promise<boolean> {
  const supabase = getSupabase()

  // SECURITY: enforce ownership before delete
  const existing = await getMoleculeForUser(id, aiverid_id)
  if (!existing) return false

  const { error } = await supabase
    .from('molecules')
    .delete()
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)

  if (error) {
    console.error('deleteMolecule error:', error)
    throw new Error('Database error while deleting molecule')
  }

  return true
}
