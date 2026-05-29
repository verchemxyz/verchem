import 'server-only'

/**
 * Answer Card CRUD Helpers — Server-only (W3 persistence)
 *
 * SECURITY:
 * - Uses SUPABASE_SERVICE_ROLE_KEY (server-only, never exposed to client)
 * - All user scoping enforced at app level (where aiverid_id = ...)
 * - Cards are stored with the exact canonical string that was signed; loading
 *   RE-VERIFIES the HMAC so a row tampered directly in the DB surfaces as
 *   `signatureValid: false` instead of silently displaying a VERIFIED badge.
 * - Public view strips aiverid_id (mirrors getPublicMoleculeById).
 */

import { createClient } from '@supabase/supabase-js'
import type { AnswerCard, CardStatus, ToolCall } from '@/lib/answer-cards/types'
import type { SignablePayload } from '@/lib/answer-cards/types'
import {
  canonicalPayloadString,
  verifyCanonicalSignature,
  toSignablePayload,
} from '@/lib/answer-cards/signature'

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

interface AnswerCardRow {
  id: string
  aiverid_id: string
  question: string
  status: CardStatus
  signed_payload: string
  signature: string
  is_public: boolean
  created_at: string
  updated_at: string
}

/** Lightweight row for list views (signature re-verified, payload not returned). */
export interface AnswerCardSummary {
  id: string
  question: string
  status: CardStatus
  is_public: boolean
  created_at: string
  /** false → row no longer matches its signature; list must not show VERIFIED. */
  signatureValid: boolean
}

/** Shape-guard a parsed signed_payload before trusting it as a SignablePayload. */
function isValidSignablePayload(p: unknown): p is SignablePayload {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false
  const o = p as Record<string, unknown>
  if (typeof o.question !== 'string' || typeof o.status !== 'string') return false
  if (!Array.isArray(o.tool_calls)) return false
  if (typeof o.explanation !== 'string') return false
  if (!o.audit || typeof o.audit !== 'object' || Array.isArray(o.audit)) return false
  const a = o.audit as Record<string, unknown>
  if (typeof a.clean !== 'boolean' || !Array.isArray(a.unmatched)) return false
  if (typeof o.model !== 'string' || typeof o.version !== 'string' || typeof o.issued_at !== 'string') {
    return false
  }
  return true
}

/** A card reconstructed from storage, with the result of re-verifying its HMAC. */
export interface LoadedAnswerCard {
  id: string
  card: AnswerCard
  is_public: boolean
  created_at: string
  /** false → the stored bytes no longer match the signature (tampered/corrupt). */
  signatureValid: boolean
}

/**
 * Reconstruct the display card from the SIGNED canonical string (the source of
 * truth) and re-verify the signature. The displayed content therefore is
 * exactly what was signed — no divergence from denormalized columns possible.
 */
export async function rowToVerifiedCard(row: AnswerCardRow): Promise<LoadedAnswerCard> {
  const signatureValid = await verifyCanonicalSignature(row.signed_payload, row.signature)

  let parsed: SignablePayload | null = null
  try {
    const raw = JSON.parse(row.signed_payload)
    if (isValidSignablePayload(raw)) parsed = raw
  } catch {
    parsed = null
  }

  const card: AnswerCard = parsed
    ? {
        question: parsed.question,
        status: parsed.status,
        // A card is only "verified" if its signature still holds.
        verified: parsed.status === 'verified' && signatureValid,
        tool_calls: parsed.tool_calls as ToolCall[],
        explanation: parsed.explanation,
        audit: parsed.audit,
        model: parsed.model,
        version: parsed.version,
        issued_at: parsed.issued_at,
        signature: row.signature,
      }
    : {
        // Corrupt payload — show nothing trustworthy.
        question: row.question,
        status: row.status,
        verified: false,
        tool_calls: [],
        explanation: '',
        audit: { clean: false, unmatched: [] },
        model: '',
        version: '',
        issued_at: row.created_at,
        signature: row.signature,
      }

  return {
    id: row.id,
    card,
    is_public: row.is_public,
    created_at: row.created_at,
    signatureValid: signatureValid && parsed !== null,
  }
}

export interface CreateAnswerCardInput {
  aiverid_id: string
  card: AnswerCard
  is_public?: boolean
}

/**
 * Persist a card. The caller MUST have verified card.signature first
 * (see POST /api/answer-cards). We store the canonical string we re-derive
 * from the card so the stored bytes are exactly what the signature covers.
 */
export async function createAnswerCard(
  input: CreateAnswerCardInput
): Promise<{ id: string; created_at: string }> {
  const supabase = getSupabase()
  const signed_payload = canonicalPayloadString(toSignablePayload(input.card))

  const { data, error } = await supabase
    .from('answer_cards')
    .insert({
      aiverid_id: input.aiverid_id,
      question: input.card.question,
      status: input.card.status,
      signed_payload,
      signature: input.card.signature,
      is_public: input.is_public ?? false,
    })
    .select('id, created_at')
    .single()

  if (error) {
    console.error('createAnswerCard error:', error)
    throw new Error('Database error while saving answer card')
  }

  return data as { id: string; created_at: string }
}

export async function listAnswerCardsByUser(aiverid_id: string): Promise<AnswerCardSummary[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('answer_cards')
    .select('id, question, status, is_public, created_at, signed_payload, signature')
    .eq('aiverid_id', aiverid_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listAnswerCardsByUser error:', error)
    throw new Error('Database error while listing answer cards')
  }

  const rows = (data ?? []) as Array<
    Pick<AnswerCardRow, 'id' | 'question' | 'status' | 'is_public' | 'created_at' | 'signed_payload' | 'signature'>
  >

  // Re-verify each row so the list can't show a VERIFIED-style badge from a
  // denormalized `status` column that no longer matches the signature. The
  // signed_payload is verified but NOT returned to the client (keeps it light).
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      question: r.question,
      status: r.status,
      is_public: r.is_public,
      created_at: r.created_at,
      signatureValid: await verifyCanonicalSignature(r.signed_payload, r.signature),
    }))
  )
}

export async function getAnswerCardForUser(
  id: string,
  aiverid_id: string
): Promise<LoadedAnswerCard | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('answer_cards')
    .select('*')
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('getAnswerCardForUser error:', error)
    throw new Error('Database error while fetching answer card')
  }

  return rowToVerifiedCard(data as AnswerCardRow)
}

/**
 * Public-safe fetch: only public cards, owner identifier never read.
 */
export async function getPublicAnswerCardById(id: string): Promise<LoadedAnswerCard | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('answer_cards')
    .select('id, question, status, signed_payload, signature, is_public, created_at, updated_at')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('getPublicAnswerCardById error:', error)
    throw new Error('Database error while fetching answer card')
  }

  // aiverid_id intentionally absent from the select → never reaches the client.
  return rowToVerifiedCard({ ...(data as Omit<AnswerCardRow, 'aiverid_id'>), aiverid_id: '' } as AnswerCardRow)
}

export async function setAnswerCardVisibility(
  id: string,
  aiverid_id: string,
  is_public: boolean
): Promise<LoadedAnswerCard | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('answer_cards')
    .update({ is_public })
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('setAnswerCardVisibility error:', error)
    throw new Error('Database error while updating answer card')
  }

  return rowToVerifiedCard(data as AnswerCardRow)
}

export async function deleteAnswerCard(id: string, aiverid_id: string): Promise<boolean> {
  const supabase = getSupabase()

  // Enforce ownership: only delete a row that belongs to this user.
  const { data: existing, error: fetchError } = await supabase
    .from('answer_cards')
    .select('id')
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') return false
    console.error('deleteAnswerCard fetch error:', fetchError)
    throw new Error('Database error while deleting answer card')
  }
  if (!existing) return false

  const { error } = await supabase
    .from('answer_cards')
    .delete()
    .eq('id', id)
    .eq('aiverid_id', aiverid_id)

  if (error) {
    console.error('deleteAnswerCard error:', error)
    throw new Error('Database error while deleting answer card')
  }

  return true
}
