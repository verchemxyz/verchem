export const ANSWER_CARD_PAGE_SIZE = 20 as const
const MAX_ANSWER_CARD_PAGE = 100_000

export interface AnswerCardPage<T> {
  cards: T[]
  page: number
  pageSize: typeof ANSWER_CARD_PAGE_SIZE
  hasMore: boolean
}

/** Parse the zero-based page query without allowing negative/overflow ranges. */
export function parseAnswerCardPage(raw: string | null): number | null {
  if (raw === null) return 0
  const page = Number(raw)
  return Number.isInteger(page) && page >= 0 && page <= MAX_ANSWER_CARD_PAGE
    ? page
    : null
}
