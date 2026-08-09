import assert from 'node:assert/strict'

import { resolveAnswerCardList } from '@/lib/answer-cards/list-contract'
import {
  paginateAnswerCardRows,
  parseAnswerCardCursor,
} from '@/lib/answer-cards/list-pagination'

interface TestCard {
  id: string
  created_at: string
  question: string
}

const createdAt = '2026-08-10T00:00:00.000Z'
const cards: TestCard[] = Array.from({ length: 21 }, (_, index) => {
  const ordinal = index + 1
  return {
    id: `00000000-0000-4000-8000-${String(ordinal).padStart(12, '0')}`,
    created_at: createdAt,
    question: `Card ${ordinal}`,
  }
})

async function run(): Promise<void> {
  const legacy = await resolveAnswerCardList<TestCard>(
    null,
    async () => cards,
    async (cursor) => paginateAnswerCardRows(cards, cursor)
  )
  assert.equal(legacy.ok, true)
  if (!legacy.ok) throw new Error('Legacy list unexpectedly failed')
  assert.ok(Array.isArray(legacy.value), 'no cursor must preserve the legacy array response')
  assert.equal(legacy.value.length, 21)

  let currentRows = [...cards]
  const first = paginateAnswerCardRows(currentRows, null)
  assert.equal(first.cards.length, 20)
  assert.equal(first.hasMore, true)
  assert.ok(first.nextCursor)

  const deletedId = first.cards[0]!.id
  currentRows = currentRows.filter((card) => card.id !== deletedId)

  const parsed = parseAnswerCardCursor(first.nextCursor!)
  assert.equal(parsed.valid, true)
  if (!parsed.valid || parsed.cursor === null) {
    throw new Error('Generated cursor was rejected')
  }

  const second = paginateAnswerCardRows(currentRows, parsed.cursor)
  const loaded = [
    ...first.cards.filter((card) => card.id !== deletedId),
    ...second.cards,
  ]
  const expectedIds = new Set(currentRows.map((card) => card.id))
  const loadedIds = new Set(loaded.map((card) => card.id))

  assert.equal(loaded.length, 20)
  assert.equal(loadedIds.size, 20, 'cursor pagination must not duplicate a card')
  assert.deepEqual(loadedIds, expectedIds, '21 cards → delete one → load more must not skip one')
  assert.equal(second.hasMore, false)
  assert.equal(second.nextCursor, null)

  const paged = await resolveAnswerCardList<TestCard>(
    '',
    async () => { throw new Error('cursor opt-in must not call the legacy list') },
    async (cursor) => paginateAnswerCardRows(currentRows, cursor)
  )
  assert.equal(paged.ok, true)
  if (!paged.ok || Array.isArray(paged.value)) {
    throw new Error('Cursor opt-in did not return an envelope')
  }
  assert.equal(paged.value.pageSize, 20)

  const invalid = await resolveAnswerCardList<TestCard>(
    'not-a-cursor',
    async () => cards,
    async (cursor) => paginateAnswerCardRows(cards, cursor)
  )
  assert.deepEqual(invalid, { ok: false, error: 'Invalid cursor' })

  console.log('Answer-card cursor pagination behavioral tests passed')
}

void run()
