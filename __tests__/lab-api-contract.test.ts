/** Lab-QC route contracts with the real handlers and an injectable recording Supabase fake. */

import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { GET as getJwks } from '@/app/.well-known/verchem-keys.json/route'
import { POST as releasePost } from '@/app/api/lab/orgs/[org]/records/[id]/release/route'
import { POST as approvePost } from '@/app/api/lab/orgs/[org]/templates/[id]/approve/route'
import { PATCH as updatePatch } from '@/app/api/lab/orgs/[org]/records/[id]/route'
import { GET as packGet } from '@/app/api/lab/records/[id]/pack.json/route'
import { GET as statusGet } from '@/app/api/lab/records/[id]/status/route'
import { buildDeterministicAnswerCard } from '@/lib/answer-cards/deterministic-card'
import { verifyCardJwsInBrowser } from '@/lib/answer-cards/browser-verifier'
import { getReleaseManifestHash } from '@/lib/answer-cards/release-manifest'
import { signCard, toSignablePayload } from '@/lib/answer-cards/signature'
import { appendEvent } from '@/lib/lab/audit-chain'
import {
  getRecordDetailHandler,
  inviteMemberHandler,
  getTemplateHandler,
  listMembersHandler,
  listOrganizationsHandler,
  listRecordsHandler,
  listTemplatesHandler,
  retireTemplateHandler,
  setLabApiDependenciesForTests,
} from '@/lib/lab/api'
import { releaseRecord } from '@/lib/lab/evidence-pack'
import { createLabRepository, createRecordShareToken, hashRecordShareToken, pendingInviteAiverid, type LabDatabaseClient, type LabDatabaseQuery, type LabDatabaseResponse } from '@/lib/supabase/lab'
import type { PrepRecord, PrepTemplate } from '@/lib/lab/types'

type Row = Record<string, unknown>
type Filter = { column: string; value: unknown; nullOnly?: boolean }

class RecordingQuery implements LabDatabaseQuery {
  private readonly filters: Filter[] = []
  private rowsLimit: number | null = null
  private columns = '*'
  private expectsOne = false
  private updateValue: Row | null = null
  private insertValue: Row | Row[] | null = null
  constructor(private readonly database: RecordingDatabase, private readonly table: string) {}
  select(columns = '*'): this { this.columns = columns; return this }
  insert(values: Row | Row[]): this { this.insertValue = values; return this }
  update(values: Row): this { this.updateValue = values; return this }
  eq(column: string, value: unknown): this { this.filters.push({ column, value }); return this }
  is(column: string, value: null): this { this.filters.push({ column, value, nullOnly: true }); return this }
  order(_column: string, _options?: { ascending?: boolean }): this { return this }
  limit(count: number): this { this.rowsLimit = count; return this }
  single(): this { this.expectsOne = true; return this }
  maybeSingle(): this { this.expectsOne = true; return this }
  then<TResult1 = LabDatabaseResponse, TResult2 = never>(
    onfulfilled?: ((value: LabDatabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
  private async execute(): Promise<LabDatabaseResponse> {
    this.database.queries.push({ table: this.table, filters: [...this.filters], update: this.updateValue, insert: this.insertValue })
    const table = this.database.tables[this.table] ?? []
    const matches = table.filter((row) => this.filters.every((filter) =>
      filter.nullOnly ? row[filter.column] === null : row[filter.column] === filter.value
    ))
    let result: Row[]
    if (this.insertValue !== null) {
      const inserted = Array.isArray(this.insertValue) ? this.insertValue : [this.insertValue]
      table.push(...inserted.map((row) => ({ ...row })))
      this.database.tables[this.table] = table
      result = inserted
    } else if (this.updateValue !== null) {
      if (this.database.zeroReleaseUpdate && this.table === 'prep_records' && this.updateValue.state === 'released') {
        result = []
      } else {
        for (const row of matches) Object.assign(row, this.updateValue)
        result = matches
      }
    } else {
      result = matches
    }
    if (this.rowsLimit !== null) result = result.slice(0, this.rowsLimit)
    const project = (row: Row): Row => {
      if (this.columns === '*') return { ...row }
      const projected: Row = {}
      for (const column of this.columns.split(',').map((entry) => entry.trim())) projected[column] = row[column]
      return projected
    }
    if (this.expectsOne) {
      return result[0] ? { data: project(result[0]), error: null } : { data: null, error: { code: 'PGRST116' } }
    }
    return { data: result.map(project), error: null }
  }
}

class RecordingDatabase implements LabDatabaseClient {
  readonly queries: Array<{ table: string; filters: Filter[]; update: Row | null; insert: Row | Row[] | null }> = []
  readonly tables: Record<string, Row[]>
  zeroReleaseUpdate = false
  constructor(rows: Record<string, Row[]>) { this.tables = rows }
  from(table: string): LabDatabaseQuery { return new RecordingQuery(this, table) }
  async rpc(name: string, parameters: Row = {}): Promise<LabDatabaseResponse> {
    this.queries.push({ table: `rpc:${name}`, filters: [], update: null, insert: null })
    if (name === 'lab_apply_transition') {
      const orgId = parameters.p_org_id
      const recordId = parameters.p_record_id
      const from = parameters.p_from
      const to = parameters.p_to
      const patch = parameters.p_patch
      const event = parameters.p_event
      if (typeof orgId !== 'string' || typeof recordId !== 'string' || typeof from !== 'string' || typeof to !== 'string' ||
          typeof patch !== 'object' || patch === null || Array.isArray(patch) ||
          typeof event !== 'object' || event === null || Array.isArray(event)) {
        return { data: null, error: { code: '22023' } }
      }
      const record = this.tables.prep_records.find((row) => row.id === recordId && row.org_id === orgId && row.state === from)
      if (!record) return { data: null, error: { code: 'P4C09' } }
      const events = this.tables.lab_events.filter((row) => row.record_id === recordId)
      const tail = events.at(-1) ?? null
      const candidate = event as Row
      if (
        candidate.record_id !== recordId ||
        candidate.prev_hash !== (tail?.hash ?? null) ||
        candidate.seq !== events.length + 1 ||
        this.tables.lab_events.some((row) => row.record_id === recordId && row.seq === candidate.seq)
      ) {
        return { data: null, error: { code: 'P4C09' } }
      }
      if (this.zeroReleaseUpdate && to === 'released') return { data: null, error: { code: 'P4C09' } }
      this.tables.lab_events.push({ org_id: orgId, ...candidate })
      Object.assign(record, patch, { state: to })
      return { data: { ...record }, error: null }
    }
    return { data: null, error: { code: 'PGRST116' } }
  }
}

const ORG_A = '00000000-0000-4000-8000-000000000001'
const ORG_B = '00000000-0000-4000-8000-000000000002'
const RECORD_ID = '00000000-0000-4000-8000-000000000010'
const TEMPLATE_ID = '00000000-0000-4000-8000-000000000020'
const PREPARER = 'TH-preparer'
const REVIEWER = 'TH-reviewer'

const template: PrepTemplate = {
  id: TEMPLATE_ID, org_id: ORG_A, key: 'cd-standard', version: 1, status: 'approved',
  spec_hash: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  created_by: PREPARER, approved_by: REVIEWER, approved_at: '2026-08-26T00:00:00.000Z', retired_at: null,
  created_at: '2026-08-26T00:00:00.000Z',
  spec: {
    schema: 'verchem-prep-template/v1', name: 'Cd standard', targetVolumeUnit: 'L',
    acceptance: { relativePercent: 0.5 }, requiredFields: ['lot', 'coa_assay'], instructions: [], citations: [],
    target: {
      targetConc: 1000, targetVolume: 0.1, unit: 'mg/L', reagentForm: 'Cd metal', solvent: 'water',
      reagentPurityPercent: 99.99, reagentPurityBasis: 'mass', preparationTemperatureC: 20,
    },
  },
}

function draft(): PrepRecord['draft'] {
  return {
    measurements: {
      reagentLot: 'LOT-01', expiry: null, balanceId: 'BAL-1', flaskId: 'FLASK-1', notes: '',
      weighedG: 0.10028, measuredMl: null, finalVolumeMl: 100, coaAssayPercent: 99.99,
      coaBasis: 'mass', temperatureC: 20,
      equipment: {
        massStandardG: 0.00005, flaskToleranceMl: 0.1, flaskCalibrationTemperatureC: 20,
        fillRepeatabilitySdMl: 0.02, temperatureHalfWidthC: 4,
        volumeExpansionCoefficientPerC: null, assayToleranceHalfWidthPercent: 0.01,
      },
      // A hostile client-supplied derived result; release must ignore it.
      as_prepared: { value: 999999 },
    } as unknown as PrepRecord['draft'] extends { measurements: infer M } ? M : never,
  }
}

function record(state: PrepRecord['state'] = 'submitted'): PrepRecord {
  return {
    id: RECORD_ID, org_id: ORG_A, template_id: TEMPLATE_ID, template_version: 1, record_no: 'PR-2026-000001',
    state, draft: draft(), signed_payload: null, signature: null, outcome: null, deviation_reason: null,
    supersedes: null, created_by: PREPARER, released_by: null, released_at: null, voided_at: null,
    void_reason: null, share_token_hash: null, created_at: '2026-08-26T00:00:00.000Z',
  }
}

function eventRows(): Row[] {
  const created = appendEvent(null, {
    record_id: RECORD_ID, seq: 1, actor: PREPARER, actor_level: 1, action: 'create', payload: {}, at: '2026-08-26T00:00:00.000Z',
  })
  const submitted = appendEvent(created, {
    record_id: RECORD_ID, seq: 2, actor: PREPARER, actor_level: 1, action: 'submit', payload: {}, at: '2026-08-26T00:01:00.000Z',
  })
  return [
    { org_id: ORG_A, ...created } as unknown as Row,
    { org_id: ORG_A, ...submitted } as unknown as Row,
  ]
}

function setup(options: { revoked?: boolean; zeroRelease?: boolean; memberOrg?: string } = {}) {
  const database = new RecordingDatabase({
    organizations: [{ id: ORG_A, name: 'Lab A', slug: 'lab-a', country: null, accreditation_ref: null, created_by: PREPARER, created_at: '2026-08-26T00:00:00.000Z' }],
    org_members: [
      { org_id: ORG_A, aiverid: PREPARER, role: 'analyst', display_name: 'Preparer', invited_email: null, invited_by: PREPARER, joined_at: '2026-08-26T00:00:00.000Z', revoked_at: null },
      { org_id: ORG_A, aiverid: REVIEWER, role: 'reviewer', display_name: 'Reviewer', invited_email: null, invited_by: PREPARER, joined_at: '2026-08-26T00:00:00.000Z', revoked_at: options.revoked ? '2026-08-26T01:00:00.000Z' : null },
    ],
    // Cloned: tests mutate the spec (requiredFields), and a shared object leaked that between them.
    prep_templates: [structuredClone(template) as unknown as Row], prep_records: [record() as unknown as Row], lab_events: eventRows(),
  })
  database.zeroReleaseUpdate = options.zeroRelease ?? false
  const repository = createLabRepository(database)
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: REVIEWER, name: 'Reviewer', verification_level: 3, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => repository,
    validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 100, resetTime: Date.now() + 60_000 }),
    clientId: () => 'contract-test',
  })
  return { database, repository }
}

function request(path: string, method = 'POST', body?: unknown): NextRequest {
  return new NextRequest(`https://verchem.xyz${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json', origin: 'https://verchem.xyz' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

const tests: Array<{ name: string; fn: () => Promise<void> }> = []
function test(name: string, fn: () => Promise<void>) { tests.push({ name, fn }) }

test('IDOR is a 404 and revoked membership is a 403 before record access', async () => {
  const { database } = setup()
  const idor = await releasePost(request(`/api/lab/orgs/${ORG_B}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_B, id: RECORD_ID }) })
  assert.equal(idor.status, 404)
  assert.ok(!database.queries.some((query) => query.table === 'prep_records'), 'IDOR must not query the other org record')

  setup({ revoked: true })
  const revoked = await releasePost(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(revoked.status, 403)
})

test('new read handlers preserve tenant isolation and expose only their response contracts', async () => {
  const { database } = setup()
  database.tables.org_members[0]!.invited_email = 'preparer@example.test'

  const crossOrgTemplate = await getTemplateHandler(
    request(`/api/lab/orgs/${ORG_B}/templates/${TEMPLATE_ID}`, 'GET'),
    ORG_B,
    TEMPLATE_ID
  )
  const crossOrgRecord = await getRecordDetailHandler(
    request(`/api/lab/orgs/${ORG_B}/records/${RECORD_ID}`, 'GET'),
    ORG_B,
    RECORD_ID
  )
  assert.equal(crossOrgTemplate.status, 404)
  assert.equal(crossOrgRecord.status, 404)

  const members = await listMembersHandler(request(`/api/lab/orgs/${ORG_A}/members`, 'GET'), ORG_A)
  const memberBody = await members.json() as { members: Array<Record<string, unknown>> }
  assert.equal(members.status, 200)
  assert.ok(memberBody.members.every((member) => !Object.hasOwn(member, 'invited_email')))

  const records = await listRecordsHandler(request(`/api/lab/orgs/${ORG_A}/records`, 'GET'), ORG_A)
  const recordBody = await records.json() as { records: Array<Record<string, unknown>> }
  assert.equal(records.status, 200)
  assert.ok(recordBody.records.every((item) => !Object.hasOwn(item, 'draft')))
})

test('a revoked member receives 403 from every new read and retire handler', async () => {
  setup({ revoked: true })
  const requests: Array<[string, () => Promise<Response>]> = [
    ['organizations', () => listOrganizationsHandler(request('/api/lab/orgs', 'GET'))],
    ['templates', () => listTemplatesHandler(request(`/api/lab/orgs/${ORG_A}/templates`, 'GET'), ORG_A)],
    ['template detail', () => getTemplateHandler(request(`/api/lab/orgs/${ORG_A}/templates/${TEMPLATE_ID}`, 'GET'), ORG_A, TEMPLATE_ID)],
    ['records', () => listRecordsHandler(request(`/api/lab/orgs/${ORG_A}/records`, 'GET'), ORG_A)],
    ['record detail', () => getRecordDetailHandler(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}`, 'GET'), ORG_A, RECORD_ID)],
    ['members', () => listMembersHandler(request(`/api/lab/orgs/${ORG_A}/members`, 'GET'), ORG_A)],
    ['retire', () => retireTemplateHandler(request(`/api/lab/orgs/${ORG_A}/templates/${TEMPLATE_ID}/retire`, 'POST'), ORG_A, TEMPLATE_ID)],
  ]
  for (const [name, call] of requests) {
    const response = await call()
    assert.equal(response.status, 403, name)
  }
})

test('retiring a template requires reviewer role and an approved status', async () => {
  const analyst = setup()
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: PREPARER, name: 'Preparer', verification_level: 1, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => analyst.repository, validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'analyst',
  })
  const denied = await retireTemplateHandler(request(`/api/lab/orgs/${ORG_A}/templates/${TEMPLATE_ID}/retire`, 'POST'), ORG_A, TEMPLATE_ID)
  assert.equal(denied.status, 403)

  const draftTemplate = setup()
  draftTemplate.database.tables.prep_templates[0]!.status = 'draft'
  const conflict = await retireTemplateHandler(request(`/api/lab/orgs/${ORG_A}/templates/${TEMPLATE_ID}/retire`, 'POST'), ORG_A, TEMPLATE_ID)
  assert.equal(conflict.status, 409)
})

test('release recomputes stored draft, atomically seals its release event, and persists a w3-v4 lab card', async () => {
  const { database, repository } = setup()
  const response = await releasePost(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(response.status, 200, await response.clone().text())
  const body = await response.json() as { signature: string; share_token: string }
  const released = database.tables.prep_records[0]!
  const payload = JSON.parse(String(released.signed_payload)) as Record<string, unknown>
  const result = (payload.tool_calls as Array<{ result: { value: { asPrepared: { value: number } } } }>)[0]!.result.value.asPrepared.value
  assert.notEqual(result, 999999, 'derived client field must never enter a pack')
  const signedActual = (payload.tool_calls as Array<{ input: { actual: Record<string, unknown> } }>)[0]!.input.actual
  assert.equal(signedActual.reagent_lot, 'LOT-01')
  assert.equal(signedActual.balance_id, 'BAL-1')
  const lab = payload.lab_record as { events_hash: string; events_count: number }
  const events = database.tables.lab_events
  assert.equal(events.at(-1)?.action, 'release')
  assert.equal(lab.events_hash, events.at(-1)?.hash)
  assert.equal(lab.events_count, events.length)
  assert.equal((await repository.verifyRecordChain(ORG_A, RECORD_ID)).ok, true)
  assert.equal(typeof body.signature, 'string')
  assert.equal(typeof body.share_token, 'string')
  assert.equal(released.share_token_hash, hashRecordShareToken(body.share_token))
  assert.notEqual(released.share_token_hash, body.share_token)
})

test('self-approval/self-release are forbidden and release from draft conflicts', async () => {
  const selfApprove = setup()
  selfApprove.database.tables.prep_templates[0]!.created_by = REVIEWER
  const approve = await approvePost(request(`/api/lab/orgs/${ORG_A}/templates/${TEMPLATE_ID}/approve`, 'POST'), { params: Promise.resolve({ org: ORG_A, id: TEMPLATE_ID }) })
  assert.equal(approve.status, 403)

  const selfRelease = setup()
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: PREPARER, name: 'Preparer', verification_level: 1, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => selfRelease.repository, validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'self',
  })
  const releaseOwn = await releasePost(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(releaseOwn.status, 403)

  const draftRelease = setup()
  draftRelease.database.tables.prep_records[0]!.state = 'draft'
  const releaseDraft = await releasePost(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(releaseDraft.status, 409)
})

test('a lost concurrent release returns 409 and does not persist the signed card', async () => {
  const { database } = setup({ zeroRelease: true })
  const response = await releasePost(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(response.status, 409)
  assert.equal(database.tables.prep_records[0]?.signed_payload, null)
  assert.equal(database.tables.prep_records[0]?.signature, null)
  assert.equal(database.tables.prep_records[0]?.state, 'submitted')
  assert.equal(database.tables.lab_events.some((event) => event.action === 'release'), false)
})

test('the transition RPC fake rejects stale event sequences and state mismatches without mutation', async () => {
  const { database, repository } = setup()
  const initialEvents = await repository.listEvents(ORG_A, RECORD_ID)
  const stale = appendEvent(initialEvents[0]!, {
    record_id: RECORD_ID, seq: 2, actor: REVIEWER, actor_level: 3, action: 'reject', payload: { reason: 'stale' }, at: '2026-08-26T00:02:00.000Z',
  })
  await assert.rejects(
    repository.transition(ORG_A, RECORD_ID, 'submitted', 'rejected', {}, stale),
    (error: unknown) => error instanceof Error && 'status' in error && error.status === 409
  )
  assert.equal(database.tables.prep_records[0]?.state, 'submitted')
  assert.equal(database.tables.lab_events.length, initialEvents.length)

  const current = initialEvents.at(-1)!
  const fresh = appendEvent(current, {
    record_id: RECORD_ID, seq: 3, actor: REVIEWER, actor_level: 3, action: 'reject', payload: { reason: 'state mismatch' }, at: '2026-08-26T00:02:00.000Z',
  })
  await assert.rejects(
    repository.transition(ORG_A, RECORD_ID, 'draft', 'submitted', {}, fresh),
    (error: unknown) => error instanceof Error && 'status' in error && error.status === 409
  )
  assert.equal(database.tables.prep_records[0]?.state, 'submitted')
  assert.equal(database.tables.lab_events.length, initialEvents.length)
})

test('a signing configuration failure leaves no release event and keeps the record submitted', async () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalPrivateKey = process.env.CARD_SIGNING_PRIVATE_KEY
  const { database, repository } = setup()
  try {
    Reflect.set(process.env, 'NODE_ENV', 'production')
    Reflect.deleteProperty(process.env, 'CARD_SIGNING_PRIVATE_KEY')
    await assert.rejects(
      releaseRecord(repository, {
        orgId: ORG_A,
        recordId: RECORD_ID,
        reviewer: { aiverid: REVIEWER, role: 'reviewer', verificationLevel: 3, revokedAt: null, displayName: 'Reviewer' },
      }),
      /CARD_SIGNING_PRIVATE_KEY is required in production/
    )
    assert.equal(database.tables.prep_records[0]?.state, 'submitted')
    assert.equal(database.tables.lab_events.some((event) => event.action === 'release'), false)
  } finally {
    if (originalNodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
    else Reflect.set(process.env, 'NODE_ENV', originalNodeEnv)
    if (originalPrivateKey === undefined) Reflect.deleteProperty(process.env, 'CARD_SIGNING_PRIVATE_KEY')
    else Reflect.set(process.env, 'CARD_SIGNING_PRIVATE_KEY', originalPrivateKey)
  }
})

test('required template fields are enforced on draft PATCH and release', async () => {
  const { database, repository } = setup()
  const draftRecord = database.tables.prep_records[0]!
  draftRecord.state = 'draft'
  ;(database.tables.prep_templates[0]!.spec as PrepTemplate['spec']).requiredFields = ['expiry']
  const patchMeasurements = { ...(draft()!.measurements as unknown as Record<string, unknown>) }
  delete patchMeasurements.as_prepared
  delete patchMeasurements.notes
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: PREPARER, name: 'Preparer', verification_level: 1, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => repository, validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'preparer',
  })
  const patch = await updatePatch(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}`, 'PATCH', { measurements: patchMeasurements }), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(patch.status, 400)
  assert.match((await patch.json() as { error: string }).error, /expiry/)

  ;(database.tables.prep_templates[0]!.spec as PrepTemplate['spec']).requiredFields = ['temperature']
  const blankTemperature = { ...patchMeasurements, temperatureC: null }
  const temperaturePatch = await updatePatch(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}`, 'PATCH', { measurements: blankTemperature }), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(temperaturePatch.status, 400)
  assert.match((await temperaturePatch.json() as { error: string }).error, /temperature/)

  ;(database.tables.prep_templates[0]!.spec as PrepTemplate['spec']).requiredFields = ['expiry']
  draftRecord.state = 'submitted'
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: REVIEWER, name: 'Reviewer', verification_level: 3, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => repository, validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'reviewer',
  })
  const release = await releasePost(request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}/release`, 'POST', {}), { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) })
  assert.equal(release.status, 409)
  assert.match((await release.json() as { error: string }).error, /expiry/)
})

test('pending invite claims bind by lowercase email hash', async () => {
  const { database, repository } = setup()
  const email = 'Member@Example.com'
  database.tables.org_members.push({
    org_id: ORG_A, aiverid: pendingInviteAiverid(email), role: 'analyst', display_name: 'Member',
    invited_email: 'member@example.com', invited_by: REVIEWER, joined_at: null, revoked_at: null,
  })
  const claimed = await repository.claimPendingInvites('TH-member', 'member@example.com')
  assert.equal(claimed.length, 1)
  assert.equal(claimed[0]?.aiverid, 'TH-member')
})

test('pack.json requires a member or valid bearer token, and status exposes only the permitted keys', async () => {
  const { database } = setup()
  database.tables.prep_records[0] = { ...database.tables.prep_records[0]!, state: 'released', draft: null, signed_payload: JSON.stringify({ question: 'q' }), signature: 'sig', share_token_hash: 'not-a-real-token' }
  const denied = await packGet(request(`/api/lab/records/${RECORD_ID}/pack.json`, 'GET'), { params: Promise.resolve({ id: RECORD_ID }) })
  assert.equal(denied.status, 200, 'member session is allowed')

  setLabApiDependenciesForTests({
    verifySession: async () => null,
    repository: () => createLabRepository(database), validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'public',
  })
  const invalid = await packGet(request(`/api/lab/records/${RECORD_ID}/pack.json?token=wrong`, 'GET'), { params: Promise.resolve({ id: RECORD_ID }) })
  assert.equal(invalid.status, 404)
  const released = database.tables.prep_records[0]!
  const shareToken = createRecordShareToken()
  released.share_token_hash = hashRecordShareToken(shareToken)
  const eventsBeforePublicView = database.tables.lab_events.length
  const publicPack = await packGet(request(`/api/lab/records/${RECORD_ID}/pack.json?token=${shareToken}`, 'GET'), { params: Promise.resolve({ id: RECORD_ID }) })
  assert.equal(publicPack.status, 200)
  assert.equal(database.tables.lab_events.length, eventsBeforePublicView, 'public pack view must not append audit events')
  const status = await statusGet(request(`/api/lab/records/${RECORD_ID}/status`, 'GET'), { params: Promise.resolve({ id: RECORD_ID }) })
  assert.deepEqual(Object.keys(await status.json()).sort(), ['state', 'superseded_by', 'voided_at'])
})

test('browser verifier accepts lab_record only on a valid w3-v4 card', async () => {
  const labRecord = {
    schema: 'verchem-lab-record/v1' as const, org: { id: ORG_A, name: 'Lab A' }, record_no: 'PR-2026-000001', record_id: RECORD_ID,
    template: { key: 'cd-standard', version: 1, spec_hash: template.spec_hash },
    preparer: { aiverid: PREPARER, display_name: 'Preparer', verification_level: 1 as const, at: '2026-08-26T00:00:00.000Z', action: 'prepare' as const },
    reviewer: { aiverid: REVIEWER, display_name: 'Reviewer', verification_level: 3 as const, at: '2026-08-26T00:01:00.000Z', action: 'release' as const },
    outcome: 'released' as const, deviation_reason: null, events_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as `sha256:${string}`, events_count: 3,
    release_manifest_hash: getReleaseManifestHash(),
  }
  const unsigned = buildDeterministicAnswerCard('calculate_strong_acid_ph', { concentration: 0.1, formula: 'HCl' }, { labRecord })
  const signature = await signCard(toSignablePayload(unsigned))
  const jwks = await (await getJwks()).json()
  const accepted = await verifyCardJwsInBrowser(signature, jwks, { fetch: async () => new Response('', { status: 503 }) })
  assert.equal(accepted.signatureAuthentic, true)
  assert.ok(accepted.payload?.lab_record)

  const legacy = { ...unsigned, version: 'w3-v3' }
  const rejected = await verifyCardJwsInBrowser(await signCard(toSignablePayload(legacy)), jwks, { fetch: async () => new Response('', { status: 503 }) })
  assert.equal(rejected.signatureAuthentic, true)
  assert.equal(rejected.payload, null)
})

test('a cleared optional field is blank, not invalid — an empty notes box must still save', async () => {
  const { database, repository } = setup()
  database.tables.prep_records[0]!.state = 'draft'
  const measurements = { ...(draft()!.measurements as unknown as Record<string, unknown>) }
  delete measurements.as_prepared
  Object.assign(measurements, { notes: '', expiry: '', balanceId: '', flaskId: '   ' })
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: PREPARER, name: 'Preparer', verification_level: 1, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => repository, validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'preparer',
  })
  const response = await updatePatch(
    request(`/api/lab/orgs/${ORG_A}/records/${RECORD_ID}`, 'PATCH', { measurements }),
    { params: Promise.resolve({ org: ORG_A, id: RECORD_ID }) }
  )
  assert.equal(response.status, 200)
  const stored = await response.json() as { record: PrepRecord }
  const saved = stored.record.draft?.measurements as unknown as Record<string, unknown>
  assert.equal(saved.notes, '', 'an empty note stays an empty note')
  assert.equal(saved.expiry, null)
  assert.equal(saved.balanceId, null)
  assert.equal(saved.flaskId, null)
})

test('an address already in the laboratory cannot be invited again', async () => {
  const { database, repository } = setup()
  database.tables.org_members[1]!.role = 'owner'
  database.tables.org_members.push({
    org_id: ORG_A, aiverid: pendingInviteAiverid('analyst2@example.test'), role: 'analyst',
    display_name: 'Analyst Two', invited_email: 'analyst2@example.test', invited_by: REVIEWER,
    joined_at: null, revoked_at: null,
  })
  setLabApiDependenciesForTests({
    verifySession: async () => ({ userId: REVIEWER, name: 'Owner', email: 'owner@example.test', verification_level: 3, tier: 'free', expiresAt: new Date('2099-01-01') }),
    repository: () => repository, validOrigin: () => true,
    rateLimit: () => ({ success: true, remaining: 1, resetTime: Date.now() + 1 }), clientId: () => 'owner',
  })
  const before = database.tables.org_members.length
  const duplicate = await inviteMemberHandler(request(`/api/lab/orgs/${ORG_A}/members`, 'POST', { email: 'Analyst2@Example.test', role: 'viewer' }), ORG_A)
  assert.equal(duplicate.status, 409)
  assert.match((await duplicate.json() as { error: string }).error, /already belongs to a member/i)
  assert.equal(database.tables.org_members.length, before, 'a refused invitation must not leave an unclaimable row')

  const self = await inviteMemberHandler(request(`/api/lab/orgs/${ORG_A}/members`, 'POST', { email: 'OWNER@example.test', role: 'reviewer' }), ORG_A)
  assert.equal(self.status, 409)
  assert.match((await self.json() as { error: string }).error, /already a member/i)
  assert.equal(database.tables.org_members.length, before)
})

async function run(): Promise<void> {
  let failed = 0
  for (const { name, fn } of tests) {
    try { await fn(); console.log(`  ✓ ${name}`) }
    catch (error) { failed++; console.error(`  ✗ ${name}`); console.error(error) }
    finally { setLabApiDependenciesForTests(null) }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

void run()
