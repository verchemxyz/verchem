export const ANSWER_CARD_PAGE_SIZE = 20 as const

const MAX_CURSOR_LENGTH = 512
const SAFE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface AnswerCardCursor {
  createdAt: string
  id: string
}

export interface AnswerCardPage<T> {
  cards: T[]
  pageSize: typeof ANSWER_CARD_PAGE_SIZE
  hasMore: boolean
  nextCursor: string | null
}

export type ParsedAnswerCardCursor =
  | { valid: true; cursor: AnswerCardCursor | null }
  | { valid: false; cursor: null }

function isValidCursorValue(value: unknown): value is [string, string] {
  if (!Array.isArray(value) || value.length !== 2) return false
  const [createdAt, id] = value
  return typeof createdAt === 'string' &&
    SAFE_TIMESTAMP.test(createdAt) &&
    Number.isFinite(Date.parse(createdAt)) &&
    typeof id === 'string' &&
    UUID.test(id)
}

/** Empty cursor opts into the first page; absent cursor keeps the legacy array contract. */
export function parseAnswerCardCursor(raw: string): ParsedAnswerCardCursor {
  if (raw === '') return { valid: true, cursor: null }
  if (raw.length > MAX_CURSOR_LENGTH) return { valid: false, cursor: null }

  try {
    const decoded: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    if (!isValidCursorValue(decoded)) return { valid: false, cursor: null }
    return { valid: true, cursor: { createdAt: decoded[0], id: decoded[1] } }
  } catch {
    return { valid: false, cursor: null }
  }
}

export function encodeAnswerCardCursor(cursor: AnswerCardCursor): string {
  if (!isValidCursorValue([cursor.createdAt, cursor.id])) {
    throw new Error('Cannot encode an invalid answer-card cursor')
  }
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url')
}

/** Values are validated before interpolation, preventing PostgREST filter injection. */
export function answerCardCursorFilter(cursor: AnswerCardCursor): string {
  if (!isValidCursorValue([cursor.createdAt, cursor.id])) {
    throw new Error('Cannot build a filter from an invalid answer-card cursor')
  }
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
}

interface CursorRow {
  id: string
  created_at: string
}

function compareNewestFirst(a: CursorRow, b: CursorRow): number {
  const timeDifference = Date.parse(b.created_at) - Date.parse(a.created_at)
  return timeDifference || b.id.localeCompare(a.id)
}

function comesAfterCursor(row: CursorRow, cursor: AnswerCardCursor): boolean {
  const rowTime = Date.parse(row.created_at)
  const cursorTime = Date.parse(cursor.createdAt)
  return rowTime < cursorTime || (rowTime === cursorTime && row.id < cursor.id)
}

/**
 * In-memory reference implementation used by the mutation golden test. The DB
 * query uses the same `(created_at DESC, id DESC)` ordering and strict cursor.
 */
export function paginateAnswerCardRows<T extends CursorRow>(
  rows: readonly T[],
  cursor: AnswerCardCursor | null
): AnswerCardPage<T> {
  const eligible = [...rows]
    .sort(compareNewestFirst)
    .filter((row) => cursor === null || comesAfterCursor(row, cursor))
  const cards = eligible.slice(0, ANSWER_CARD_PAGE_SIZE)
  const hasMore = eligible.length > ANSWER_CARD_PAGE_SIZE
  const last = cards.at(-1)

  return {
    cards,
    pageSize: ANSWER_CARD_PAGE_SIZE,
    hasMore,
    nextCursor: hasMore && last
      ? encodeAnswerCardCursor({ createdAt: last.created_at, id: last.id })
      : null,
  }
}
