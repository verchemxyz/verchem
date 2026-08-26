/**
 * Lab-QC real-Postgres integration gate.
 *
 * Runs the whole prep→review→release lifecycle against a REAL Supabase
 * database (a branch or a scratch project — never production) so the SQL
 * triggers, SECURITY DEFINER functions, JSONB semantics and race behaviour
 * that the recording-fake contract tests cannot exercise are actually hit.
 *
 * Usage:
 *   LAB_GATE_SUPABASE_URL=... LAB_GATE_SERVICE_ROLE_KEY=... \
 *     node --conditions=react-server --import tsx scripts/lab-integration-check.ts
 *
 * Refuses to run unless LAB_GATE_ALLOW_PROJECT_REF matches the project ref in
 * the URL, so it can never be pointed at production by accident.
 */

import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createLabRepository, LabDataError, type LabDatabaseClient } from '@/lib/supabase/lab'
import { releaseRecord } from '@/lib/lab/evidence-pack'
import { verifyChain } from '@/lib/lab/audit-chain'
import { verifyCardSignature } from '@/lib/answer-cards/signature'
import { parseSubmittedCard } from '@/lib/answer-cards/validate-card'
import type { PrepTemplateSpec } from '@/lib/lab/types'

const url = process.env.LAB_GATE_SUPABASE_URL
const key = process.env.LAB_GATE_SERVICE_ROLE_KEY
const allowRef = process.env.LAB_GATE_ALLOW_PROJECT_REF
if (!url || !key || !allowRef) {
  console.error('Set LAB_GATE_SUPABASE_URL, LAB_GATE_SERVICE_ROLE_KEY and LAB_GATE_ALLOW_PROJECT_REF (branch/scratch project only).')
  process.exit(2)
}
const ref = new URL(url).hostname.split('.')[0]
if (ref !== allowRef) {
  console.error(`Refusing: URL project ref "${ref}" ≠ LAB_GATE_ALLOW_PROJECT_REF "${allowRef}".`)
  process.exit(2)
}

const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) as unknown as LabDatabaseClient
const repository = createLabRepository(client)
const stamp = Date.now().toString(36)
const PREPARER = `gate-preparer-${stamp}`
const REVIEWER = `gate-reviewer-${stamp}`

const spec: PrepTemplateSpec = {
  schema: 'verchem-prep-template/v1',
  name: `Gate Cd standard ${stamp}`,
  target: {
    targetConc: 1000, targetVolume: 100, unit: 'mg/L', reagentPurityPercent: 99.99, reagentPurityBasis: 'mass',
    reagentForm: 'Cd metal', solvent: 'water', preparationTemperatureC: 20,
  },
  targetVolumeUnit: 'mL',
  acceptance: { relativePercent: 0.5 },
  requiredFields: ['lot', 'coa_assay', 'balance_id'],
  instructions: [],
  citations: ['EURACHEM/CITAC QUAM:2012 A1'],
}

const measurements = {
  weighedG: 0.10028, measuredMl: null, finalVolumeMl: 100, coaAssayPercent: 99.99, coaBasis: 'mass' as const, temperatureC: 20,
  reagentLot: 'GATE-LOT', expiry: null, balanceId: 'BAL-GATE', flaskId: null, notes: '',
  equipment: {
    massStandardG: 0.00005, flaskToleranceMl: 0.1, flaskCalibrationTemperatureC: 20, fillRepeatabilitySdMl: 0.02,
    temperatureHalfWidthC: 4, volumeExpansionCoefficientPerC: null, assayToleranceHalfWidthPercent: 0.01,
  },
}

async function expectConflict(label: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run()
  } catch (error) {
    if (error instanceof LabDataError && error.status === 409) { console.log(`  ✓ ${label} → 409`); return }
    throw error
  }
  throw new Error(`${label}: expected 409, got success`)
}

async function main(): Promise<void> {
  console.log('1. organization + owner membership (lab_create_org)')
  const org = await repository.createOrganization({ name: `Gate Lab ${stamp}`, createdBy: REVIEWER, displayName: 'Gate Reviewer' })
  await repository.inviteMember(org.id, { email: `${PREPARER}@example.com`, role: 'analyst', invitedBy: REVIEWER })
  const claimed = await repository.claimPendingInvites(PREPARER, `${PREPARER}@example.com`)
  assert.equal(claimed.length, 1)

  console.log('2. template draft → approve (different person) → self-approve rejected')
  const template = await repository.createTemplateVersion(org.id, spec, PREPARER)
  await expectConflict('self-approve blocked at DB (CHECK)', async () => {
    try { await repository.approveTemplate(org.id, template.id, PREPARER) } catch (e) { if (e instanceof LabDataError && e.status === 403) throw new LabDataError('ok', 409); throw e }
  })
  const approved = await repository.approveTemplate(org.id, template.id, REVIEWER)
  assert.equal(approved?.status, 'approved')

  console.log('3. record create (lab_create_record + create event in one tx)')
  const record = await repository.createRecord(org.id, { templateId: template.id, templateVersion: approved!.version, createdBy: PREPARER, actorLevel: 1 })
  assert.match(record.record_no, /^PR-\d{4}-\d{6}$/)
  const events1 = await repository.listEvents(org.id, record.id)
  assert.equal(events1.length, 1); assert.equal(events1[0]!.action, 'create')

  console.log('4. edit draft (draft→draft via lab_apply_transition) + submit')
  const editEvent = await repository.buildLabEvent(org.id, record.id, { actor: PREPARER, actorLevel: 1, action: 'edit', payload: { draft_hash: 'sha256:' + '0'.repeat(64) } })
  const edited = await repository.updateDraft(org.id, record.id, { measurements }, editEvent)
  assert.ok(edited?.draft && 'measurements' in edited.draft)
  const submitEvent = await repository.buildLabEvent(org.id, record.id, { actor: PREPARER, actorLevel: 1, action: 'submit', payload: {} })
  const submitted = await repository.transition(org.id, record.id, 'draft', 'submitted', {}, submitEvent)
  assert.equal(submitted?.state, 'submitted')

  console.log('5. stale event / wrong from-state rejected by RPC')
  await expectConflict('stale seq', () => repository.transition(org.id, record.id, 'submitted', 'draft', {}, submitEvent))
  const wrongState = await repository.buildLabEvent(org.id, record.id, { actor: PREPARER, actorLevel: 1, action: 'submit', payload: {} })
  await expectConflict('wrong from-state', () => repository.transition(org.id, record.id, 'draft', 'submitted', {}, wrongState))

  console.log('6. release (server recompute, JSON-null draft → SQL NULL, share token hash, sealed chain)')
  const released = await releaseRecord(repository, { orgId: org.id, recordId: record.id, reviewer: { aiverid: REVIEWER, role: 'owner', verificationLevel: 1, revokedAt: null, displayName: 'Gate Reviewer' } })
  assert.equal(released.record.state, 'released')
  assert.equal(released.record.draft, null, 'draft must be SQL NULL after release')
  assert.equal(released.record.outcome, 'released')
  assert.match(String(released.record.share_token_hash), /^[0-9a-f]{64}$/)
  const events2 = await repository.listEvents(org.id, record.id)
  const chain = verifyChain(events2)
  assert.ok(chain.ok && chain.head === events2.at(-1)!.hash)
  const card = parseSubmittedCard({ ...JSON.parse(released.pack.payload), signature: released.pack.signature })
  assert.ok(card, 'released pack must parse as a w3-v4 card')
  assert.ok(await verifyCardSignature(JSON.parse(released.pack.payload), released.pack.signature))
  assert.equal(card.lab_record?.events_count, events2.length)
  assert.equal(card.lab_record?.events_hash, chain.head)

  console.log('7. released row immutable; second release conflicts; void allowed once')
  await expectConflict('second release', () => releaseRecord(repository, { orgId: org.id, recordId: record.id, reviewer: { aiverid: REVIEWER, role: 'owner', verificationLevel: 1, revokedAt: null, displayName: 'Gate Reviewer' } }))
  const voidEvent = await repository.buildLabEvent(org.id, record.id, { actor: REVIEWER, actorLevel: 1, action: 'void', payload: { reason: 'gate check' } })
  const voided = await repository.transition(org.id, record.id, 'released', 'voided', { voided_at: new Date().toISOString(), void_reason: 'gate check' }, voidEvent)
  assert.equal(voided?.state, 'voided')
  const status = await repository.getPublicRecordStatus(record.id)
  assert.equal(status?.state, 'voided')

  console.log('8. concurrent release race on a fresh record → exactly one winner, one release event')
  const record2 = await repository.createRecord(org.id, { templateId: template.id, templateVersion: approved!.version, createdBy: PREPARER, actorLevel: 1 })
  const e2 = await repository.buildLabEvent(org.id, record2.id, { actor: PREPARER, actorLevel: 1, action: 'edit', payload: {} })
  await repository.updateDraft(org.id, record2.id, { measurements }, e2)
  const s2 = await repository.buildLabEvent(org.id, record2.id, { actor: PREPARER, actorLevel: 1, action: 'submit', payload: {} })
  await repository.transition(org.id, record2.id, 'draft', 'submitted', {}, s2)
  const reviewer = { aiverid: REVIEWER, role: 'owner' as const, verificationLevel: 1 as const, revokedAt: null, displayName: 'Gate Reviewer' }
  const outcomes = await Promise.allSettled([
    releaseRecord(repository, { orgId: org.id, recordId: record2.id, reviewer }),
    releaseRecord(repository, { orgId: org.id, recordId: record2.id, reviewer }),
  ])
  const wins = outcomes.filter((o) => o.status === 'fulfilled').length
  assert.equal(wins, 1, `expected exactly one winner, got ${wins}`)
  const events3 = await repository.listEvents(org.id, record2.id)
  assert.equal(events3.filter((e) => e.action === 'release').length, 1, 'loser must leave no release event')
  assert.ok(verifyChain(events3).ok)

  console.log('\nLab integration gate: ALL PASSED')
}

main().catch((error: unknown) => {
  console.error('\nLab integration gate FAILED:', error)
  process.exit(1)
})
