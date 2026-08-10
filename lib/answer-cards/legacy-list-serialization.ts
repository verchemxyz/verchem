import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import {
  assessEngineReplay,
  unavailableEngineReplay,
  type EngineReplayStatus,
} from '@/lib/answer-cards/replay'
import type { CardStatus, SignablePayload, ToolCall } from '@/lib/answer-cards/types'

export interface LegacyAnswerCardListRow {
  id: string
  question: string
  status: CardStatus
  is_public: boolean
  created_at: string
  signed_payload: string
  signature: string
}

/** Exact pre-pagination list shape kept for clients that omit `cursor`. */
export interface LegacyAnswerCardSummary {
  id: string
  question: string
  status: CardStatus
  is_public: boolean
  created_at: string
  signatureValid: boolean
}

export interface ReplayAwareAnswerCardSummary extends LegacyAnswerCardSummary {
  engineReplayStatus: EngineReplayStatus
  currentEngineAgrees: boolean
}

export type CanonicalSignatureVerifier = (
  canonical: string,
  signature: string
) => Promise<boolean>

interface ParsedListFields {
  question: string
  status: CardStatus
  payload: SignablePayload | null
}

function parsedListFields(row: LegacyAnswerCardListRow): ParsedListFields {
  try {
    const raw: unknown = JSON.parse(row.signed_payload)
    if (isValidSignablePayload(raw)) {
      return { question: raw.question, status: raw.status, payload: raw }
    }
  } catch {
    // Fall through to the denormalized, explicitly untrusted display fields.
  }

  return { question: row.question, status: row.status, payload: null }
}

/** A VERIFIED claim requires replay evidence, which the legacy path omits. */
function statusWithoutReplayEvidence(status: CardStatus): CardStatus {
  return status === 'verified' ? 'unverified' : status
}

/**
 * Serialize the legacy unpaginated list without replaying calculation engines.
 *
 * Signature verification remains mandatory, and display fields still come from
 * the signed payload when its shape is valid. Replay metadata is intentionally
 * reserved for the explicitly opted-in, bounded cursor response. Consequently,
 * this path must downgrade VERIFIED instead of claiming evidence it did not run.
 */
export function summarizeLegacyAnswerCardRows(
  rows: readonly LegacyAnswerCardListRow[],
  verifySignature: CanonicalSignatureVerifier
): Promise<LegacyAnswerCardSummary[]> {
  return Promise.all(
    rows.map(async (row) => {
      const signatureValid = await verifySignature(row.signed_payload, row.signature)
      const fields = parsedListFields(row)

      return {
        id: row.id,
        question: fields.question,
        status: statusWithoutReplayEvidence(fields.status),
        is_public: row.is_public,
        created_at: row.created_at,
        signatureValid: signatureValid && fields.payload !== null,
      }
    })
  )
}

/** Serialize the bounded cursor path with an actual current-engine replay. */
export function summarizeReplayAwareAnswerCardRows(
  rows: readonly LegacyAnswerCardListRow[],
  verifySignature: CanonicalSignatureVerifier
): Promise<ReplayAwareAnswerCardSummary[]> {
  return Promise.all(
    rows.map(async (row) => {
      const signatureValid = await verifySignature(row.signed_payload, row.signature)
      const fields = parsedListFields(row)
      const engineReplay = fields.payload && signatureValid
        ? assessEngineReplay(fields.payload.tool_calls as ToolCall[])
        : unavailableEngineReplay(
            fields.payload
              ? 'Replay was not attempted because the payload signature is invalid.'
              : 'The signed payload is malformed and cannot be replayed.'
          )

      return {
        id: row.id,
        question: fields.question,
        status: fields.status,
        is_public: row.is_public,
        created_at: row.created_at,
        signatureValid: signatureValid && fields.payload !== null,
        engineReplayStatus: engineReplay.status,
        currentEngineAgrees: engineReplay.currentEngineAgrees,
      }
    })
  )
}
