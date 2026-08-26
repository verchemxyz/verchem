/**
 * Lab-QC state machine + authorization matrix + audit chain.
 * Calls the real implementations (no inlined copies).
 */

import assert from 'node:assert/strict'
import {
  authorize,
  formatRecordNumber,
  isValidReason,
  releaseOutcome,
  RECORD_NUMBER_PATTERN,
  RELEASE_MIN_VERIFICATION_LEVEL,
  type Member,
  type MemberRole,
  type RecordAction,
  type RecordSnapshot,
  type RecordState,
} from '@/lib/lab/prep-record'
import {
  appendEvent,
  computeEventHash,
  verifyChain,
  type LabEvent,
  type LabEventContent,
} from '@/lib/lab/audit-chain'

type TestFn = () => void
const tests: Array<{ name: string; fn: TestFn }> = []
function test(name: string, fn: TestFn): void { tests.push({ name, fn }) }

const member = (
  role: MemberRole,
  aiverid = `TH-${role}`,
  level: 1 | 2 | 3 | 4 = 1,
  revokedAt: string | null = null
): Member => ({ aiverid, role, verificationLevel: level, revokedAt })

const record = (
  state: RecordState,
  createdBy = 'TH-analyst',
  templateStatus: RecordSnapshot['templateStatus'] = 'approved'
): RecordSnapshot => ({ state, createdBy, templateStatus })

const ROLES: MemberRole[] = ['owner', 'reviewer', 'analyst', 'viewer']
const STATES: RecordState[] = ['draft', 'submitted', 'released', 'rejected', 'voided']
const ACTIONS: RecordAction[] = ['create', 'edit', 'submit', 'withdraw', 'release', 'reject', 'void', 'view_pack']
const VALID_CTX = { reason: 'valid reason', withinAcceptance: true }

test('role × action × state matrix is total and never throws', () => {
  for (const role of ROLES) for (const state of STATES) for (const action of ACTIONS) {
    const d = authorize(action, member(role, 'TH-other', 4), record(state), VALID_CTX)
    assert.ok(typeof d.ok === 'boolean', `${role}/${state}/${action}`)
  }
})

test('viewer can only view packs of released/voided records', () => {
  for (const action of ACTIONS) {
    const d = authorize(action, member('viewer'), record('released'), VALID_CTX)
    assert.equal(d.ok, action === 'view_pack', action)
  }
  assert.equal(authorize('view_pack', member('viewer'), record('draft')).ok, false)
  assert.equal(authorize('view_pack', member('viewer'), record('voided')).ok, true)
})

test('revoked membership is forbidden for everything, including view', () => {
  for (const action of ACTIONS) {
    const d = authorize(action, member('owner', 'TH-owner', 4, '2026-08-26T00:00:00Z'), record('released'), VALID_CTX)
    assert.equal(d.ok, false)
    assert.equal(d.ok ? '' : d.code, 'forbidden')
  }
})

test('create requires an approved template', () => {
  assert.equal(authorize('create', member('analyst'), record('draft', 'x', 'draft')).ok, false)
  assert.equal(authorize('create', member('analyst'), record('draft', 'x', 'retired')).ok, false)
  const d = authorize('create', member('analyst'), record('draft', 'x', 'approved'))
  assert.ok(d.ok && d.nextState === 'draft')
})

test('only the preparer may edit/submit/withdraw', () => {
  assert.equal(authorize('edit', member('reviewer'), record('draft', 'TH-analyst')).ok, false)
  assert.equal(authorize('submit', member('owner'), record('draft', 'TH-analyst')).ok, false)
  assert.equal(authorize('withdraw', member('analyst', 'TH-analyst'), record('submitted', 'TH-analyst')).ok, true)
  assert.equal(authorize('edit', member('analyst', 'TH-analyst'), record('submitted', 'TH-analyst')).ok, false)
})

test('preparer cannot release or reject own record; reviewer can', () => {
  const own = authorize('release', member('reviewer', 'TH-analyst'), record('submitted', 'TH-analyst'), { withinAcceptance: true })
  assert.equal(own.ok, false)
  assert.equal(own.ok ? '' : own.code, 'forbidden')
  const ownReject = authorize('reject', member('reviewer', 'TH-analyst'), record('submitted', 'TH-analyst'), { reason: 'wrong lot' })
  assert.equal(ownReject.ok, false)
  const ok = authorize('release', member('reviewer'), record('submitted', 'TH-analyst'), { withinAcceptance: true })
  assert.ok(ok.ok && ok.nextState === 'released')
})

test('release: level gate, acceptance result required, deviation reason required when out of acceptance', () => {
  const low = authorize('release', member('reviewer', 'TH-reviewer', 1), record('submitted'), { withinAcceptance: true })
  assert.equal(low.ok, RELEASE_MIN_VERIFICATION_LEVEL <= 1)
  const missing = authorize('release', member('reviewer', 'TH-reviewer', 4), record('submitted'), {})
  assert.equal(missing.ok, false)
  assert.equal(missing.ok ? '' : missing.code, 'invalid')
  const dev = authorize('release', member('reviewer', 'TH-reviewer', 4), record('submitted'), { withinAcceptance: false })
  assert.equal(dev.ok, false)
  const devOk = authorize('release', member('reviewer', 'TH-reviewer', 4), record('submitted'), {
    withinAcceptance: false,
    reason: 'weighed 3.65 g, accepted by QA per SOP-12 §4',
  })
  assert.ok(devOk.ok)
  assert.equal(releaseOutcome(false), 'released_with_deviation')
  assert.equal(releaseOutcome(true), 'released')
})

test('state transitions: released only → voided; rejected/voided terminal', () => {
  assert.equal(authorize('edit', member('analyst', 'TH-analyst'), record('released', 'TH-analyst'), VALID_CTX).ok, false)
  assert.equal(authorize('release', member('owner'), record('released'), VALID_CTX).ok, false)
  assert.equal(authorize('void', member('owner'), record('released'), VALID_CTX).ok, true)
  assert.equal(authorize('void', member('owner'), record('submitted'), VALID_CTX).ok, false)
  for (const action of ACTIONS.filter((a) => a !== 'view_pack' && a !== 'create')) {
    assert.equal(authorize(action, member('owner', 'TH-other', 4), record('voided'), VALID_CTX).ok, false, action)
    assert.equal(authorize(action, member('owner', 'TH-other', 4), record('rejected'), VALID_CTX).ok, false, action)
  }
})

test('reasons: length bounds and control characters', () => {
  assert.equal(isValidReason('ok'), false)
  assert.equal(isValidReason('okay'), true)
  assert.equal(isValidReason(`bad${String.fromCharCode(7)}reason`), false)
  assert.equal(isValidReason('x'.repeat(2001)), false)
  assert.equal(authorize('void', member('owner'), record('released'), { reason: '' }).ok, false)
})

test('record number format', () => {
  assert.equal(formatRecordNumber(2026, 123), 'PR-2026-000123')
  assert.ok(RECORD_NUMBER_PATTERN.test(formatRecordNumber(2026, 999_999)))
  assert.throws(() => formatRecordNumber(2026, 0))
  assert.throws(() => formatRecordNumber(2026, 1_000_000))
  assert.throws(() => formatRecordNumber(99, 1))
})

// ---------------- audit chain ----------------

const content = (seq: number, action: RecordAction, payload: Record<string, unknown> = {}): LabEventContent => ({
  record_id: 'rec-1',
  seq,
  actor: 'TH-analyst',
  actor_level: 1,
  action,
  payload,
  at: `2026-08-26T10:0${seq}:00Z`,
})

test('chain builds, verifies, and yields a stable head hash', () => {
  const e1 = appendEvent(null, content(1, 'create'))
  const e2 = appendEvent(e1, content(2, 'edit', { weighed_g: 3.8021 }))
  const e3 = appendEvent(e2, content(3, 'submit'))
  assert.equal(e1.prev_hash, null)
  assert.equal(e2.prev_hash, e1.hash)
  const v = verifyChain([e1, e2, e3])
  assert.ok(v.ok && v.length === 3 && v.head === e3.hash)
  assert.equal(computeEventHash(content(1, 'create'), null), e1.hash)
  assert.equal(
    computeEventHash({ ...content(1, 'create'), payload: { b: 1, a: 2 } }, null),
    computeEventHash({ ...content(1, 'create'), payload: { a: 2, b: 1 } }, null)
  )
})

test('tampering with content, order, or deletion breaks the chain at the right seq', () => {
  const e1 = appendEvent(null, content(1, 'create'))
  const e2 = appendEvent(e1, content(2, 'edit', { weighed_g: 3.8021 }))
  const e3 = appendEvent(e2, content(3, 'submit'))

  const edited: LabEvent = { ...e2, payload: { weighed_g: 3.7990 } }
  const t1 = verifyChain([e1, edited, e3])
  assert.ok(!t1.ok && t1.brokenAtSeq === 2)

  const t2 = verifyChain([e1, e3])
  assert.ok(!t2.ok && t2.brokenAtSeq === 2)

  const t3 = verifyChain([e2, e1, e3])
  assert.ok(!t3.ok && t3.brokenAtSeq === 1)

  const rehashed: LabEvent = {
    ...edited,
    hash: computeEventHash(content(2, 'edit', { weighed_g: 3.7990 }), e1.hash),
  }
  const t4 = verifyChain([e1, rehashed, e3])
  assert.ok(!t4.ok && t4.brokenAtSeq === 3, 'e3.prev_hash no longer matches')

  // actor / timestamp / action are covered by the hash, not only payload
  const actorSwap: LabEvent = { ...e2, actor: 'TH-someone-else' }
  const t5 = verifyChain([e1, actorSwap, e3])
  assert.ok(!t5.ok && t5.brokenAtSeq === 2, 'actor is hashed')
  const timeShift: LabEvent = { ...e2, at: '2026-08-27T00:00:00Z' }
  const t6 = verifyChain([e1, timeShift, e3])
  assert.ok(!t6.ok && t6.brokenAtSeq === 2, 'timestamp is hashed')
  const actionSwap: LabEvent = { ...e2, action: 'release' }
  const t7 = verifyChain([e1, actionSwap, e3])
  assert.ok(!t7.ok && t7.brokenAtSeq === 2, 'action is hashed')

  // Sealed prefix: head hash + count pin the history; appending after release
  // does not change the sealed head, and truncation is detectable by count.
  const sealedHead = e3.hash
  const sealedCount = 3
  const e4 = appendEvent(e3, content(4, 'view_pack'))
  const after = verifyChain([e1, e2, e3, e4])
  assert.ok(after.ok && after.length === 4 && after.head === e4.hash)
  assert.equal(verifyChain([e1, e2, e3].slice(0, sealedCount)).ok && [e1, e2, e3][sealedCount - 1]!.hash === sealedHead, true)
  const truncated = verifyChain([e1, e2])
  assert.ok(truncated.ok && truncated.length !== sealedCount, 'count mismatch reveals truncation')

  assert.throws(() => appendEvent(e1, content(3, 'submit')), /seq must be 2/)
  assert.throws(() => appendEvent(e1, { ...content(2, 'edit'), record_id: 'rec-2' }), /different records/)
  assert.ok(verifyChain([]).ok)
})

let failed = 0
for (const t of tests) {
  try {
    t.fn()
    console.log(`  ✓ ${t.name}`)
  } catch (error) {
    failed += 1
    console.log(`  ✗ ${t.name}`)
    console.log(error)
  }
}
console.log(`\n${tests.length - failed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
