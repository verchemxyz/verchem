import assert from 'node:assert/strict'

import {
  summarizeLegacyAnswerCardRows,
  summarizeReplayAwareAnswerCardRows,
  type LegacyAnswerCardListRow,
  type LegacyAnswerCardSummary,
} from '@/lib/answer-cards/legacy-list-serialization'
import { resolveAnswerCardList } from '@/lib/answer-cards/list-contract'
import {
  paginateAnswerCardRows,
  parseAnswerCardCursor,
} from '@/lib/answer-cards/list-pagination'
import {
  canonicalPayloadString,
  signCard,
  verifyCanonicalSignature,
} from '@/lib/answer-cards/signature'
import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import type { SignablePayload, ToolCall } from '@/lib/answer-cards/types'

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

function parityPayload(call: ToolCall): SignablePayload {
  return {
    question: `Parity ${call.engine_version ?? 'no-version'}`,
    status: 'verified',
    tool_calls: [call],
    explanation: 'Signed result for serializer parity.',
    audit: { clean: true, unmatched: [] },
    model: 'test-model',
    version: 'w3-v2',
    issued_at: createdAt,
  }
}

async function signedParityRow(
  id: string,
  payload: SignablePayload
): Promise<LegacyAnswerCardListRow> {
  return {
    id,
    question: 'Untrusted denormalized question',
    status: 'error',
    is_public: false,
    created_at: createdAt,
    signed_payload: canonicalPayloadString(payload),
    signature: await signCard(payload),
  }
}

async function verifySameCardSerializerParity(): Promise<void> {
  const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')
  assert.ok(tool)
  const input = { concentration: 0.1, formula: 'HCl' }
  const currentCall: ToolCall = {
    name: tool.name,
    engine: tool.engine,
    engine_version: tool.engineVersion,
    input,
    result: tool.execute(input),
    citation: tool.citation,
  }
  const noVersionCall: ToolCall = { ...currentCall }
  delete noVersionCall.engine_version

  const rows = await Promise.all([
    signedParityRow('current', parityPayload(currentCall)),
    signedParityRow('superseded', parityPayload({
      ...currentCall,
      engine_version: '1.0.0',
    })),
    signedParityRow('corrected', parityPayload({
      ...currentCall,
      result: { ok: true, value: { ...currentCall.result.value, pH: 99 } },
    })),
    signedParityRow('no-engine-version', parityPayload(noVersionCall)),
  ])
  rows.push({
    id: 'malformed-payload',
    question: 'Malformed fallback',
    status: 'verified',
    is_public: false,
    created_at: createdAt,
    signed_payload: '{',
    signature: 'invalid-signature',
  })

  const originalExecute = tool.execute
  let replayCount = 0
  tool.execute = (replayInput) => {
    replayCount += 1
    return originalExecute(replayInput)
  }

  try {
    const legacy = await summarizeLegacyAnswerCardRows(rows, verifyCanonicalSignature)
    assert.equal(replayCount, 0, 'the unbounded legacy list must never replay engines')
    const paginated = await summarizeReplayAwareAnswerCardRows(rows, verifyCanonicalSignature)
    assert.equal(replayCount, 4, 'the bounded serializer must replay each valid card exactly once')
    assert.deepEqual(
      paginated.map((card) => card.engineReplayStatus),
      ['current', 'superseded', 'corrected', 'superseded', 'unavailable']
    )

    for (const [index, legacyCard] of legacy.entries()) {
      const paginatedCard = paginated[index]!
      const legacyClaimsVerified = legacyCard.status === 'verified' && legacyCard.signatureValid
      const paginatedProvesVerified = paginatedCard.status === 'verified' &&
        paginatedCard.signatureValid &&
        paginatedCard.engineReplayStatus === 'current' &&
        paginatedCard.currentEngineAgrees
      assert.equal(
        legacyClaimsVerified && !paginatedProvesVerified,
        false,
        `${legacyCard.id}: legacy serializer made a stronger claim than replay`
      )
    }

    assert.ok(legacy.every((card) => card.status === 'unverified'))
    assert.equal(paginated[0]!.engineReplayStatus, 'current')
  } finally {
    tool.execute = originalExecute
  }
}

async function signedRawRow(
  id: string,
  rawPayload: unknown,
  signatureIntact: boolean
): Promise<LegacyAnswerCardListRow> {
  const signable = rawPayload as SignablePayload
  const signed_payload = canonicalPayloadString(signable)
  const validSignature = await signCard(signable)
  return {
    id,
    question: `Untrusted fallback ${id}`,
    status: 'verified',
    is_public: false,
    created_at: createdAt,
    signed_payload,
    signature: signatureIntact ? validSignature : `invalid-${validSignature}`,
  }
}

function statusClaimStrength(status: LegacyAnswerCardSummary['status']): number {
  switch (status) {
    case 'error': return 0
    case 'unverified': return 1
    case 'partial': return 2
    case 'verified': return 3
  }
}

async function verifyInvalidPayloadTrustMatrix(): Promise<void> {
  const tool = TOOL_BY_NAME.get('calculate_strong_acid_ph')
  assert.ok(tool)
  const input = { concentration: 0.1, formula: 'HCl' }
  const currentCall: ToolCall = {
    name: tool.name,
    engine: tool.engine,
    engine_version: tool.engineVersion,
    input,
    result: tool.execute(input),
    citation: tool.citation,
  }
  const validPayload = parityPayload(currentCall)

  // Pre-R2 W3 payloads signed only the question/tool input/model metadata; the
  // current deep validator intentionally rejects this historical schema.
  const oldSchemaPayload = {
    question: 'Legacy signed schema',
    verified: true,
    tool_calls: [{ name: currentCall.name, input: currentCall.input }],
    model: 'legacy-model',
    version: 'w3-v0',
    issued_at: createdAt,
  }
  const missingRegistryPayload = parityPayload({
    ...currentCall,
    name: 'retired_engine_not_in_registry',
  })

  const rows = await Promise.all([
    signedRawRow('bad-signature-parseable', validPayload, false),
    signedRawRow('intact-signature-old-schema', oldSchemaPayload, true),
    signedRawRow('bad-signature-old-schema', oldSchemaPayload, false),
    signedRawRow('missing-engine-registry', missingRegistryPayload, true),
  ])

  assert.equal(isValidSignablePayload(JSON.parse(rows[0]!.signed_payload) as unknown), true)
  assert.equal(isValidSignablePayload(JSON.parse(rows[1]!.signed_payload) as unknown), false)
  assert.equal(
    await verifyCanonicalSignature(rows[1]!.signed_payload, rows[1]!.signature),
    true,
    'the old-schema payload must have an intact HMAC before shape validation rejects it'
  )

  const legacy = await summarizeLegacyAnswerCardRows(rows, verifyCanonicalSignature)
  const paginated = await summarizeReplayAwareAnswerCardRows(rows, verifyCanonicalSignature)
  assert.deepEqual(
    paginated.map((card) => card.engineReplayStatus),
    ['unavailable', 'unavailable', 'unavailable', 'unavailable']
  )

  const expectedSignatureValidity = [false, false, false, true]
  for (const [index, row] of rows.entries()) {
    const legacyCard = legacy[index]!
    const paginatedCard = paginated[index]!
    assert.ok(
      statusClaimStrength(legacyCard.status) <= statusClaimStrength(paginatedCard.status),
      `${row.id}: legacy status is stronger than the paginated status`
    )
    assert.ok(
      Number(legacyCard.signatureValid) <= Number(paginatedCard.signatureValid),
      `${row.id}: legacy signatureValid is stronger than the paginated value`
    )
    assert.equal(legacyCard.signatureValid, expectedSignatureValidity[index], row.id)
    assert.equal(paginatedCard.signatureValid, expectedSignatureValidity[index], row.id)
  }
}

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
      status: 'unverified',
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

  await verifySameCardSerializerParity()
  await verifyInvalidPayloadTrustMatrix()

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
