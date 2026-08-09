import {
  parseAnswerCardCursor,
  type AnswerCardCursor,
  type AnswerCardPage,
} from '@/lib/answer-cards/list-pagination'

export type AnswerCardListOutcome<T> =
  | { ok: true; value: T[] | AnswerCardPage<T> }
  | { ok: false; error: 'Invalid cursor' }

/** Select the legacy array or the explicitly opted-in cursor envelope. */
export async function resolveAnswerCardList<T>(
  rawCursor: string | null,
  listLegacy: () => Promise<T[]>,
  listPage: (cursor: AnswerCardCursor | null) => Promise<AnswerCardPage<T>>
): Promise<AnswerCardListOutcome<T>> {
  if (rawCursor === null) {
    return { ok: true, value: await listLegacy() }
  }

  const parsed = parseAnswerCardCursor(rawCursor)
  if (!parsed.valid) return { ok: false, error: 'Invalid cursor' }
  return { ok: true, value: await listPage(parsed.cursor) }
}
