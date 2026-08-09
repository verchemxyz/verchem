import {
  parseAnswerCardCursor,
  type AnswerCardCursor,
  type AnswerCardPage,
} from '@/lib/answer-cards/list-pagination'

export type AnswerCardListOutcome<TLegacy, TPage = TLegacy> =
  | { ok: true; value: TLegacy[] | AnswerCardPage<TPage> }
  | { ok: false; error: 'Invalid cursor' }

/** Select the legacy array or the explicitly opted-in cursor envelope. */
export async function resolveAnswerCardList<TLegacy, TPage = TLegacy>(
  rawCursor: string | null,
  listLegacy: () => Promise<TLegacy[]>,
  listPage: (cursor: AnswerCardCursor | null) => Promise<AnswerCardPage<TPage>>
): Promise<AnswerCardListOutcome<TLegacy, TPage>> {
  if (rawCursor === null) {
    return { ok: true, value: await listLegacy() }
  }

  const parsed = parseAnswerCardCursor(rawCursor)
  if (!parsed.valid) return { ok: false, error: 'Invalid cursor' }
  return { ok: true, value: await listPage(parsed.cursor) }
}
