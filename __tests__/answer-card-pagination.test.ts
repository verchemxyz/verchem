import assert from 'node:assert/strict'

import {
  summarizeLegacyAnswerCardRows,
  type LegacyAnswerCardListRow,
  type LegacyAnswerCardSummary,
} from '@/lib/answer-cards/legacy-list-serialization'
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
  const signedPayload = JSON.stringify({
    question: 'Question from signed payload',
    status: 'verified',
    tool_calls: [],
    explanation: 'Verified explanation',
    audit: { clean: true, unmatched: [] },
    model: 'test-model',
    version: 'w3-v1',
    issued_at: createdAt,
  })
  const legacyRows: LegacyAnswerCardListRow[] = [
    {
      id: cards[0]!.id,
      question: 'Denormalized question',
      status: 'error',
      is_public: false,
      created_at: createdAt,
      signed_payload: signedPayload,
      signature: 'valid-signature',
    },
    {
      id: cards[1]!.id,
      question: 'Malformed payload fallback',
      status: 'partial',
      is_public: true,
      created_at: createdAt,
      signed_payload: '{',
      signature: 'invalid-signature',
    },
  ]
  let signatureVerificationCount = 0
  const legacySummaries = await summarizeLegacyAnswerCardRows(
    legacyRows,
    async (_canonical, signature) => {
      signatureVerificationCount += 1
      return signature === 'valid-signature'
    }
  )
  assert.equal(signatureVerificationCount, legacyRows.length)
  assert.deepEqual(legacySummaries, [
    {
      id: cards[0]!.id,
      question: 'Question from signed payload',
      status: 'verified',
      is_public: false,
      created_at: createdAt,
      signatureValid: true,
    },
    {
      id: cards[1]!.id,
      question: 'Malformed payload fallback',
      status: 'partial',
      is_public: true,
      created_at: createdAt,
      signatureValid: false,
    },
  ], 'legacy serialization must keep the exact pre-pagination response shape')
  assert.deepEqual(
    Object.keys(legacySummaries[0]!).sort(),
    ['created_at', 'id', 'is_public', 'question', 'signatureValid', 'status'].sort()
  )
  assert.equal('engineReplayStatus' in legacySummaries[0]!, false)
  assert.equal('currentEngineAgrees' in legacySummaries[0]!, false)

  const legacy = await resolveAnswerCardList<LegacyAnswerCardSummary, TestCard>(
    null,
    async () => legacySummaries,
    async () => { throw new Error('no-cursor request must not run the replay-aware page path') }
  )
  assert.equal(legacy.ok, true)
  if (!legacy.ok) throw new Error('Legacy list unexpectedly failed')
  assert.ok(Array.isArray(legacy.value), 'no cursor must preserve the legacy array response')
  assert.equal(legacy.value.length, 2)

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

  const microsecondRows: TestCard[] = [
    {
      id: '00000000-0000-4000-8000-ffffffffffff',
      created_at: '2026-08-10T00:00:00.000001Z',
      question: 'Older despite larger ID',
    },
    {
      id: '00000000-0000-4000-8000-000000000001',
      created_at: '2026-08-10T00:00:00.000002+00:00',
      question: 'Newer despite smaller ID',
    },
  ]
  const microsecondFirst = paginateAnswerCardRows(microsecondRows, null)
  assert.deepEqual(
    microsecondFirst.cards.map((card) => card.question),
    ['Newer despite smaller ID', 'Older despite larger ID'],
    'PostgreSQL microseconds must win before the ID tie-breaker'
  )
  const microsecondSecond = paginateAnswerCardRows(microsecondRows, {
    createdAt: microsecondRows[1]!.created_at,
    id: microsecondRows[1]!.id,
  })
  assert.deepEqual(
    microsecondSecond.cards.map((card) => card.question),
    ['Older despite larger ID'],
    'cursor comparison must not skip a row one microsecond behind'
  )

  const impossibleDateCursor = Buffer.from(JSON.stringify([
    '2026-02-30T00:00:00.000001Z',
    cards[0]!.id,
  ])).toString('base64url')
  assert.deepEqual(
    parseAnswerCardCursor(impossibleDateCursor),
    { valid: false, cursor: null },
    'cursor validation must reject impossible calendar dates'
  )

  console.log('Answer-card cursor pagination behavioral tests passed')
}

void run()
