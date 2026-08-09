import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import type { CardStatus } from '@/lib/answer-cards/types'

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

export type CanonicalSignatureVerifier = (
  canonical: string,
  signature: string
) => Promise<boolean>

/**
 * Serialize the legacy unpaginated list without replaying calculation engines.
 *
 * Signature verification remains mandatory, and display fields still come from
 * the signed payload when its shape is valid. Replay metadata is intentionally
 * reserved for the explicitly opted-in, bounded cursor response.
 */
export function summarizeLegacyAnswerCardRows(
  rows: readonly LegacyAnswerCardListRow[],
  verifySignature: CanonicalSignatureVerifier
): Promise<LegacyAnswerCardSummary[]> {
  return Promise.all(
    rows.map(async (row) => {
      const signatureValid = await verifySignature(row.signed_payload, row.signature)
      let question = row.question
      let status = row.status

      try {
        const raw: unknown = JSON.parse(row.signed_payload)
        if (isValidSignablePayload(raw)) {
          question = raw.question
          status = raw.status
        }
      } catch {
        // Preserve the baseline denormalized fallback; integrity remains a separate result.
      }

      return {
        id: row.id,
        question,
        status,
        is_public: row.is_public,
        created_at: row.created_at,
        signatureValid,
      }
    })
  )
}
