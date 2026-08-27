/**
 * VerChem Lab-QC — append-only audit chain for preparation records.
 *
 * Each event's hash covers its own canonical content AND the previous event's
 * hash, so any edit, deletion, or reordering of history breaks verification.
 * The database additionally forbids UPDATE/DELETE on `lab_events`
 * (supabase/migrations/004_lab_qc.sql); this module is the second, portable
 * line of defence and the one auditors can re-run offline.
 *
 * THREAT MODEL (be honest about what a hash chain proves):
 *  - Proves: no event in the sealed prefix was edited, reordered, or removed
 *    after the record was released, because the release evidence pack seals
 *    both the head hash AND the event count under the Ed25519 signature.
 *  - Does NOT prove: that an attacker with database INSERT rights could not
 *    append a well-formed event AFTER release. Post-release events (void,
 *    view_pack) are operational log entries reflected through the public
 *    status endpoint; they are not part of the sealed evidence and are never
 *    presented as such. Per-event server MACs are a possible future hardening.
 *
 * Uses node:crypto (server / test runner). Contains no secrets, so it is not
 * marked `server-only` — tests exercise the real implementation. The browser
 * verifier receives the sealed prefix (`events_hash` + `events_count`) inside
 * the signed pack, never the events themselves.
 */

import { createHash } from 'node:crypto'
import { canonicalJsonString } from '@/lib/answer-cards/canonical-json'
import type { RecordAction, VerificationLevel } from './prep-record'

export type Sha256Ref = `sha256:${string}`
const SHA256_REF = /^sha256:[0-9a-f]{64}$/

export interface LabEventContent {
  record_id: string
  seq: number
  actor: string
  actor_level: VerificationLevel
  action: RecordAction
  /** JSON-safe, already validated by the caller. */
  payload: Record<string, unknown>
  /** ISO-8601 timestamp assigned by the server. */
  at: string
}

export interface LabEvent extends LabEventContent {
  prev_hash: Sha256Ref | null
  hash: Sha256Ref
}

export function isSha256Ref(value: unknown): value is Sha256Ref {
  return typeof value === 'string' && SHA256_REF.test(value)
}

/**
 * `at` is hashed, so it has to survive the database round-trip byte-for-byte.
 * `TIMESTAMPTZ` does not: PostgREST renders it `2026-08-27T15:35:29.995+00:00`
 * where `Date#toISOString()` produced `...995Z`, and Postgres drops trailing
 * zeros from the fraction (`.990` → `.99`). `lab_events.at` is therefore TEXT,
 * pinned at both the database (CHECK) and this layer to exactly the shape
 * `toISOString()` emits.
 */
export const LAB_EVENT_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export function isLabEventAt(value: unknown): value is string {
  return typeof value === 'string' && LAB_EVENT_AT_PATTERN.test(value)
}

/**
 * `payload` is stored as JSONB, which re-encodes the *text* of numbers (`1e-7`
 * is stored as `0.0000001`). That is safe here and was measured to be so: the
 * hash is computed over canonical JSON of the *parsed* value, and every JS value
 * tested — decimals, exponents, -0, NaN/Infinity (→ null), undefined keys,
 * nested objects, unicode — round-trips to an identical canonical string. Only
 * a writer that bypasses this application (raw SQL with more precision than a
 * double) could break that, which is outside the chain's threat model above.
 * `at` was the field that genuinely did not survive; see LAB_EVENT_AT_PATTERN.
 */

/** sha256 over canonical JSON of the event content plus its predecessor's hash. */
export function computeEventHash(content: LabEventContent, prevHash: Sha256Ref | null): Sha256Ref {
  const material = canonicalJsonString({ ...content, prev_hash: prevHash })
  const digest = createHash('sha256').update(material, 'utf8').digest('hex')
  return `sha256:${digest}`
}

/** Build the next event in a chain. `previous` is null only for seq 1. */
export function appendEvent(previous: LabEvent | null, content: LabEventContent): LabEvent {
  const expectedSeq = previous === null ? 1 : previous.seq + 1
  if (content.seq !== expectedSeq) {
    throw new Error(`Event seq must be ${expectedSeq}, received ${content.seq}.`)
  }
  if (previous !== null && previous.record_id !== content.record_id) {
    throw new Error('Cannot chain events across different records.')
  }
  if (!isLabEventAt(content.at)) {
    throw new Error(
      `Event 'at' must be an ISO-8601 UTC instant with millisecond precision, received "${String(content.at)}".`
    )
  }
  const prevHash = previous === null ? null : previous.hash
  return { ...content, prev_hash: prevHash, hash: computeEventHash(content, prevHash) }
}

export type ChainVerdict =
  | { ok: true; length: number; head: Sha256Ref | null }
  | { ok: false; brokenAtSeq: number; reason: string }

/**
 * Re-derive every hash in order. Returns the head hash (the value that gets
 * sealed into the evidence pack as `events_hash`).
 */
export function verifyChain(events: readonly LabEvent[]): ChainVerdict {
  let prevHash: Sha256Ref | null = null
  let recordId: string | null = null

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!
    const expectedSeq = index + 1
    if (event.seq !== expectedSeq) {
      return { ok: false, brokenAtSeq: expectedSeq, reason: `Expected seq ${expectedSeq}, found ${event.seq}.` }
    }
    if (recordId === null) recordId = event.record_id
    if (event.record_id !== recordId) {
      return { ok: false, brokenAtSeq: expectedSeq, reason: 'Event belongs to a different record.' }
    }
    if (event.prev_hash !== prevHash) {
      return { ok: false, brokenAtSeq: expectedSeq, reason: 'prev_hash does not match the preceding event.' }
    }
    if (!isSha256Ref(event.hash)) {
      return { ok: false, brokenAtSeq: expectedSeq, reason: 'Malformed hash.' }
    }
    const { prev_hash: _prev, hash, ...content } = event
    const recomputed = computeEventHash(content, prevHash)
    if (recomputed !== hash) {
      return { ok: false, brokenAtSeq: expectedSeq, reason: 'Stored hash does not match recomputed content.' }
    }
    prevHash = hash
  }

  return { ok: true, length: events.length, head: prevHash }
}
