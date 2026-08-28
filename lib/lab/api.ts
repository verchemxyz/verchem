import 'server-only'

import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { canonicalJsonString } from '@/lib/answer-cards/canonical-json'
import { isValidOrigin } from '@/lib/auth/origin-check'
import { verifySession, type VerifiedSession } from '@/lib/auth/session'
import { checkRateLimit, getClientId, type RateLimitConfig } from '@/lib/rate-limit'
import { calculateStockPrep } from '@/lib/calculations/solution-prep'
import { calculateAsPrepared } from './as-prepared'
import { appendEvent, isSha256Ref, type LabEvent } from './audit-chain'
import { releaseRecord, toAsPreparedInput } from './evidence-pack'
import { authorize, type Member } from './prep-record'
import { hasValidRequiredPrepFields, missingRequiredPrepFields } from './required-fields'
import {
  createLabRepository,
  createRecordShareToken,
  hasValidRecordShareToken,
  hashRecordShareToken,
  LabDataError,
  type LabRepository,
} from '@/lib/supabase/lab'
import type { LabMemberRow, PrepDraft, PrepRecord, PrepTemplateSpec } from './types'

const LAB_WRITE_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 60 }
const LAB_READ_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 240 }
const LAB_PUBLIC_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 120 }

type LabAuthContext = {
  session: VerifiedSession
  member: Member & { displayName: string }
  orgId: string
  repository: LabRepository
}

interface LabApiDependencies {
  verifySession: () => Promise<VerifiedSession | null>
  repository: () => LabRepository
  validOrigin: (request: NextRequest) => boolean
  rateLimit: typeof checkRateLimit
  clientId: typeof getClientId
}

const productionDependencies: LabApiDependencies = {
  verifySession,
  repository: createLabRepository,
  validOrigin: isValidOrigin,
  rateLimit: checkRateLimit,
  clientId: getClientId,
}

let testDependencies: Partial<LabApiDependencies> | null = null

/** Contract tests override this boundary, then call the exported route handlers themselves. */
export function setLabApiDependenciesForTests(overrides: Partial<LabApiDependencies> | null): void {
  testDependencies = overrides
}

function dependencies(): LabApiDependencies {
  return { ...productionDependencies, ...testDependencies }
}

function responseError(error: unknown): NextResponse {
  if (error instanceof LabDataError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error('Lab-QC route error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

function isMutation(request: NextRequest): boolean {
  return request.method !== 'GET' && request.method !== 'HEAD'
}

function labMember(row: LabMemberRow, session: VerifiedSession): Member & { displayName: string } {
  return {
    aiverid: row.aiverid,
    role: row.role,
    verificationLevel: session.verification_level,
    revokedAt: row.revoked_at,
    displayName: row.display_name,
  }
}

export async function withLabAuth(
  request: NextRequest,
  orgId: string,
  handler: (context: LabAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const deps = dependencies()
    if (isMutation(request) && !deps.validOrigin(request)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
    const session = await deps.verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Rate-limit on the verified identity BEFORE any database round-trip so a
    // logged-in caller cannot turn membership lookups into a DB load vector.
    const limit = deps.rateLimit(
      `${isMutation(request) ? 'lab-write' : 'lab-read'}:${session.userId}`,
      isMutation(request) ? LAB_WRITE_LIMIT : LAB_READ_LIMIT
    )
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Lab request limit reached. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter ?? 0) } }
      )
    }
    const repository = deps.repository()
    const row = await repository.getMember(orgId, session.userId)
    if (!row) {
      const historical = await repository.getMemberHistory(orgId, session.userId)
      // A revoked member learns that their access was revoked; a user from a
      // different organization receives 404 so the org id does not become an oracle.
      return NextResponse.json(
        { error: historical?.revoked_at ? 'Membership has been revoked.' : 'Organization not found' },
        { status: historical?.revoked_at ? 403 : 404 }
      )
    }
    return await handler({ session, member: labMember(row, session), orgId, repository })
  } catch (error) {
    return responseError(error)
  }
}

async function readObjectBody(request: NextRequest): Promise<Record<string, unknown>> {
  let value: unknown
  try {
    value = await request.json()
  } catch {
    throw new LabDataError('Invalid JSON body.', 400)
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LabDataError('Body must be a JSON object.', 400)
  }
  return value as Record<string, unknown>
}

/**
 * A POST whose fields are all optional may legitimately arrive with no body at
 * all — `fetch` sends none when the caller passes none. Releasing a record that
 * sits inside acceptance needs no deviation reason, so the release button posts
 * nothing, and demanding a JSON object there rejected the product's central
 * action with "Invalid JSON body." Only a genuinely empty body counts as absent:
 * whitespace is malformed JSON and is still refused, like any other bad body.
 */
async function readOptionalObjectBody(request: NextRequest): Promise<Record<string, unknown>> {
  const raw = await request.text()
  if (raw.length === 0) return {}
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new LabDataError('Invalid JSON body.', 400)
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LabDataError('Body must be a JSON object.', 400)
  }
  return value as Record<string, unknown>
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  const keys = Object.keys(value).filter((key) => !allowed.includes(key))
  if (keys.length > 0) throw new LabDataError(`Unknown field${keys.length === 1 ? '' : 's'}: ${keys.join(', ')}`, 400)
}

function requiredString(value: unknown, field: string, max = 2_000): string {
  if (typeof value !== 'string') throw new LabDataError(`${field} must be a string.`, 400)
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > max || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)) {
    throw new LabDataError(`${field} must be non-empty, within its maximum length, and contain no control characters.`, 400)
  }
  return trimmed
}

function optionalString(value: unknown, field: string, max: number): string | null {
  if (value === null || value === undefined) return null
  return requiredString(value, field, max)
}

/**
 * An optional text field the operator left blank. A cleared text box submits `''`,
 * which is the absence of a value, not a violation — reading it as one made the
 * whole preparation form unsavable whenever the notes box was left empty.
 */
function optionalText(value: unknown, field: string, max: number): string | null {
  if (typeof value === 'string' && value.trim().length === 0) return null
  return optionalString(value, field, max)
}

function assertDecision(decision: ReturnType<typeof authorize>): void {
  if (decision.ok) return
  throw new LabDataError(decision.reason, decision.code === 'forbidden' ? 403 : decision.code === 'conflict' ? 409 : 400)
}

function assertReviewerRole(member: Member): void {
  if (member.role === 'owner' || member.role === 'reviewer') return
  throw new LabDataError('Reviewer role is required.', 403)
}

function listLimit(value: string | null): number {
  if (value === null) return 25
  if (!/^\d{1,2}$/.test(value)) throw new LabDataError('limit must be an integer between 1 and 50.', 400)
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new LabDataError('limit must be an integer between 1 and 50.', 400)
  }
  return parsed
}

function listCursor(value: string | null): string | null {
  if (value === null) return null
  if (value.length > 64 || Number.isNaN(Date.parse(value))) {
    throw new LabDataError('cursor must be a valid record creation timestamp.', 400)
  }
  return value
}

function withoutShareTokenHash(record: PrepRecord): Omit<PrepRecord, 'share_token_hash'> {
  const { share_token_hash: _shareTokenHash, ...safeRecord } = record
  return safeRecord
}

function activeShareTokenHash(recordHash: string | null, events: LabEvent[]): string | null {
  let activeHash = recordHash
  for (const event of events) {
    if (event.action !== 'view_pack' || event.payload.operation !== 'rotate_share_token') continue
    const rotatedHash = event.payload.share_token_hash
    // A malformed rotation must fail closed instead of reviving an older token.
    activeHash = typeof rotatedHash === 'string' && /^[0-9a-f]{64}$/.test(rotatedHash)
      ? rotatedHash
      : null
  }
  return activeHash
}

function isTemplateSpec(value: unknown): value is PrepTemplateSpec {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const spec = value as Record<string, unknown>
  return spec.schema === 'verchem-prep-template/v1' && typeof spec.name === 'string' &&
    typeof spec.target === 'object' && spec.target !== null && !Array.isArray(spec.target) &&
    (spec.targetVolumeUnit === 'mL' || spec.targetVolumeUnit === 'L') &&
    typeof spec.acceptance === 'object' && spec.acceptance !== null && !Array.isArray(spec.acceptance) &&
    Object.keys(spec.acceptance).join(',') === 'relativePercent' &&
    typeof (spec.acceptance as Record<string, unknown>).relativePercent === 'number' &&
    Number.isFinite((spec.acceptance as Record<string, unknown>).relativePercent) &&
    ((spec.acceptance as Record<string, unknown>).relativePercent as number) > 0 &&
    ((spec.acceptance as Record<string, unknown>).relativePercent as number) <= 100 &&
    hasValidRequiredPrepFields(spec.requiredFields) && Array.isArray(spec.instructions) && Array.isArray(spec.citations)
}

function buildDraft(value: unknown): PrepDraft {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new LabDataError('measurements must be an object.', 400)
  }
  const measurements = value as Record<string, unknown>
  const allowed = [
    'weighedG', 'measuredMl', 'finalVolumeMl', 'coaAssayPercent', 'coaBasis', 'temperatureC', 'equipment',
    'reagentLot', 'expiry', 'balanceId', 'flaskId', 'notes',
  ]
  onlyKeys(measurements, allowed)
  // Validate the controlled-record fields before sending the full object to the pure engine.
  // Normalize all optional values so canonical signing never receives `undefined`.
  const reagentLot = requiredString(measurements.reagentLot, 'measurements.reagentLot', 160)
  const expiry = optionalText(measurements.expiry, 'measurements.expiry', 64)
  const balanceId = optionalText(measurements.balanceId, 'measurements.balanceId', 120)
  const flaskId = optionalText(measurements.flaskId, 'measurements.flaskId', 120)
  const notes = optionalText(measurements.notes, 'measurements.notes', 4_000) ?? ''
  return {
    measurements: {
      ...measurements,
      reagentLot,
      expiry,
      balanceId,
      flaskId,
      notes,
    } as unknown as PrepDraft['measurements'],
  }
}

/** sha256 over the canonical stored draft — the audit trail records WHAT was edited, not just that it was. */
function draftHash(draft: PrepDraft): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(canonicalJsonString(draft), 'utf8').digest('hex')}`
}

function assertRequiredDraftFields(template: PrepTemplateSpec, draft: PrepDraft, status: 400 | 409): void {
  const missing = missingRequiredPrepFields(template.requiredFields, draft)
  if (missing.length > 0) {
    throw new LabDataError(`Required preparation fields are missing: ${missing.join(', ')}.`, status)
  }
}

async function scopedRecord(repository: LabRepository, orgId: string, id: string): Promise<PrepRecord> {
  const record = await repository.getRecord(orgId, id)
  if (!record) throw new LabDataError('Preparation record not found.', 404)
  return record
}

export async function createOrganizationHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const deps = dependencies()
    if (!deps.validOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    const session = await deps.verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limit = deps.rateLimit(`lab-write:${session.userId}`, LAB_WRITE_LIMIT)
    if (!limit.success) return NextResponse.json({ error: 'Lab request limit reached. Please wait before trying again.' }, { status: 429 })
    const body = await readObjectBody(request)
    onlyKeys(body, ['name', 'country', 'accreditation_ref'])
    const organization = await deps.repository().createOrganization({
      name: requiredString(body.name, 'name', 200),
      country: optionalText(body.country, 'country', 2),
      accreditationRef: optionalText(body.accreditation_ref, 'accreditation_ref', 120),
      createdBy: session.userId,
      displayName: session.name,
    })
    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    return responseError(error)
  }
}

/** Lists only organizations derived from the caller's live memberships. */
export async function listOrganizationsHandler(_request: NextRequest): Promise<NextResponse> {
  try {
    const deps = dependencies()
    const session = await deps.verifySession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const limit = deps.rateLimit(`lab-read:${session.userId}`, LAB_READ_LIMIT)
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Lab request limit reached. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter ?? 0) } }
      )
    }
    const repository = deps.repository()
    // A colleague who was already signed in when the invitation was written has no
    // new OAuth callback to claim it, and would see an empty Lab with no
    // explanation until they happened to sign out. Every Lab screen loads this
    // list, so claiming here is the way in. Best-effort: a Lab database problem
    // must not turn into "you have no laboratories".
    if (session.email) {
      try {
        await repository.claimPendingInvites(session.userId, session.email, session.name)
      } catch (error) {
        console.error('Failed to claim pending Lab-QC invitations:', error)
      }
    }
    const memberships = await repository.getMembership(session.userId)
    if (memberships.length === 0) {
      const history = await repository.getMembershipHistoryForAiverid(session.userId)
      if (history.some((membership) => membership.revoked_at !== null)) {
        return NextResponse.json({ error: 'Membership has been revoked.' }, { status: 403 })
      }
    }
    const organizations = await repository.getOrganizationsByIds(memberships.map((membership) => membership.org_id))
    const roleByOrg = new Map(memberships.map((membership) => [membership.org_id, membership.role]))
    return NextResponse.json({
      organizations: organizations.map((organization) => ({
        ...organization,
        role: roleByOrg.get(organization.id) ?? 'viewer',
        member_aiverid: session.userId,
      })),
    })
  } catch (error) {
    return responseError(error)
  }
}

export async function inviteMemberHandler(request: NextRequest, orgId: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository, session }) => {
    if (member.role !== 'owner') return NextResponse.json({ error: 'Only organization owners may invite members.' }, { status: 403 })
    const body = await readObjectBody(request)
    onlyKeys(body, ['email', 'role', 'display_name'])
    if (body.role !== 'reviewer' && body.role !== 'analyst' && body.role !== 'viewer') {
      throw new LabDataError('role must be reviewer, analyst, or viewer.', 400)
    }
    // The owner's own membership row carries no invited_email, so the repository's
    // duplicate check cannot see it: an owner inviting their own address would
    // create a row that can never be claimed.
    if (typeof session.email === 'string' &&
      requiredString(body.email, 'email', 320).toLocaleLowerCase('en') === session.email.trim().toLocaleLowerCase('en')) {
      throw new LabDataError('You are already a member of this laboratory.', 409)
    }
    const invited = await repository.inviteMember(orgId, {
      email: requiredString(body.email, 'email', 320),
      role: body.role,
      displayName: optionalText(body.display_name, 'display_name', 120) ?? undefined,
      invitedBy: member.aiverid,
    })
    return NextResponse.json(invited, { status: 201 })
  })
}

export async function createTemplateHandler(request: NextRequest, orgId: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    assertReviewerRole(member)
    const body = await readObjectBody(request)
    onlyKeys(body, ['spec'])
    if (!isTemplateSpec(body.spec)) throw new LabDataError('spec must be a valid verchem-prep-template/v1 object.', 400)
    try {
      // Same normalisation the engine applies (as-prepared 1.1.0): the declared
      // unit drives a mL→L conversion before the target calculation is validated.
      calculateStockPrep(body.spec.targetVolumeUnit === 'mL'
        ? { ...body.spec.target, targetVolume: body.spec.target.targetVolume / 1000 }
        : body.spec.target)
    } catch (error) {
      throw new LabDataError(error instanceof Error ? error.message : 'Template target was rejected by the calculation engine.', 400)
    }
    const template = await repository.createTemplateVersion(orgId, body.spec, member.aiverid)
    return NextResponse.json(template, { status: 201 })
  })
}

export async function approveTemplateHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    assertReviewerRole(member)
    const template = await repository.approveTemplate(orgId, id, member.aiverid)
    if (!template) return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    return NextResponse.json(template)
  })
}

export async function retireTemplateHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    assertReviewerRole(member)
    const current = await repository.getTemplate(orgId, id)
    if (!current) return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    if (current.status !== 'approved') {
      throw new LabDataError('Only approved templates can be retired.', 409)
    }
    const template = await repository.retireTemplate(orgId, id)
    if (!template) throw new LabDataError('The template changed before this request completed.', 409)
    return NextResponse.json(template)
  })
}

export async function listTemplatesHandler(request: NextRequest, orgId: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ repository }) => {
    return NextResponse.json({ templates: await repository.listTemplates(orgId) })
  })
}

export async function getTemplateHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ repository }) => {
    const template = await repository.getTemplate(orgId, id)
    if (!template) return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    return NextResponse.json({ template })
  })
}

export async function createRecordHandler(request: NextRequest, orgId: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    const body = await readObjectBody(request)
    onlyKeys(body, ['template_id'])
    const templateId = requiredString(body.template_id, 'template_id', 128)
    const template = await repository.getApprovedTemplate(orgId, templateId)
    if (!template) return NextResponse.json({ error: 'Approved template not found.' }, { status: 409 })
    assertDecision(authorize('create', member, { state: 'draft', createdBy: member.aiverid, templateStatus: template.status }))
    const record = await repository.createRecord(orgId, {
      templateId,
      templateVersion: template.version,
      createdBy: member.aiverid,
      actorLevel: member.verificationLevel,
    })
    return NextResponse.json(record, { status: 201 })
  })
}

export async function listRecordsHandler(request: NextRequest, orgId: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ repository }) => {
    const limit = listLimit(request.nextUrl.searchParams.get('limit'))
    const cursor = listCursor(request.nextUrl.searchParams.get('cursor'))
    const records = await repository.listRecords(orgId, { cursor, limit })
    const templates = await Promise.all(records.map((record) =>
      repository.getTemplateForRecord(orgId, record.template_id, record.template_version)
    ))
    const last = records.at(-1)
    return NextResponse.json({
      records: records.map((record, index) => ({
        id: record.id,
        record_no: record.record_no,
        state: record.state,
        outcome: record.outcome,
        created_at: record.created_at,
        template_key: templates[index]?.key ?? null,
        template_name: templates[index]?.spec.name ?? null,
      })),
      next_cursor: records.length === limit && last ? last.created_at : null,
    })
  })
}

export async function getRecordDetailHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ repository }) => {
    const record = await scopedRecord(repository, orgId, id)
    const template = await repository.getTemplateForRecord(orgId, record.template_id, record.template_version)
    if (!template) throw new LabDataError('Template version not found.', 409)
    const events = await repository.listEvents(orgId, id)
    const revision = events.at(-1)?.hash
    if (!revision) throw new LabDataError('The record audit chain is unavailable.', 409)
    let preview: ReturnType<typeof calculateAsPrepared> | null = null
    let previewError: string | null = null
    if (record.draft) {
      try {
        preview = calculateAsPrepared(toAsPreparedInput(template, record.draft))
      } catch (error) {
        previewError = error instanceof Error ? error.message : 'Stored measurements could not be previewed.'
      }
    }
    return NextResponse.json({
      record: withoutShareTokenHash(record),
      template,
      preview,
      preview_error: previewError,
      revision,
      events: events.map((event) => ({
        actor: event.actor,
        action: event.action === 'view_pack' && event.payload.operation === 'rotate_share_token'
          ? 'rotate_share_token'
          : event.action,
        at: event.at,
        reason: (event.action === 'reject' || event.action === 'void') && typeof event.payload.reason === 'string'
          ? event.payload.reason
          : null,
      })),
    })
  })
}

export async function updateRecordHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    const record = await scopedRecord(repository, orgId, id)
    const template = await repository.getTemplateForRecord(orgId, record.template_id, record.template_version)
    if (!template) throw new LabDataError('Template version not found.', 409)
    assertDecision(authorize('edit', member, { state: record.state, createdBy: record.created_by, templateStatus: template.status }))
    const body = await readObjectBody(request)
    onlyKeys(body, ['measurements', 'base_revision'])
    if (!isSha256Ref(body.base_revision)) {
      throw new LabDataError('base_revision must be the current SHA-256 record revision.', 400)
    }
    const events = await repository.listEvents(orgId, id)
    const head = events.at(-1)
    if (!head || body.base_revision !== head.hash) {
      throw new LabDataError('Someone changed this record after you opened it. Reload the latest version before saving.', 409)
    }
    const draft = buildDraft(body.measurements)
    assertRequiredDraftFields(template.spec, draft, 400)
    let preview
    try {
      preview = calculateAsPrepared(toAsPreparedInput(template, draft))
    } catch (error) {
      throw new LabDataError(error instanceof Error ? error.message : 'Measurements were rejected by the calculation engine.', 400)
    }
    const event = appendEvent(head, {
      record_id: id,
      seq: head.seq + 1,
      actor: member.aiverid,
      actor_level: member.verificationLevel,
      action: 'edit',
      payload: { draft_hash: draftHash(draft) },
      at: new Date().toISOString(),
    })
    const updated = await repository.updateDraft(orgId, id, draft, event)
    if (!updated) return NextResponse.json({ error: 'Preparation record not found.' }, { status: 404 })
    return NextResponse.json({ record: updated, preview, revision: event.hash })
  })
}

export async function listMembersHandler(request: NextRequest, orgId: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    const members = await repository.listMembers(orgId)
    return NextResponse.json({
      members: members.map((row) => member.role === 'owner'
        ? { display_name: row.display_name, role: row.role, invited_email: row.invited_email, joined_at: row.joined_at }
        : { display_name: row.display_name, role: row.role }
      ),
    })
  })
}

async function recordTransitionHandler(
  request: NextRequest,
  orgId: string,
  id: string,
  action: 'submit' | 'withdraw' | 'reject' | 'void'
): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    const record = await scopedRecord(repository, orgId, id)
    const template = await repository.getTemplateForRecord(orgId, record.template_id, record.template_version)
    if (!template) throw new LabDataError('Template version not found.', 409)
    let reason: string | null = null
    if (action === 'reject' || action === 'void') {
      const body = await readObjectBody(request)
      onlyKeys(body, ['reason'])
      reason = requiredString(body.reason, 'reason', 2_000)
    }
    if (action === 'submit' && (!record.draft || typeof record.draft !== 'object' || !('measurements' in record.draft))) {
      throw new LabDataError('Record the actual measurements before submitting for review.', 409)
    }
    const decision = authorize(action, member, {
      state: record.state, createdBy: record.created_by, templateStatus: template.status,
    }, { reason })
    assertDecision(decision)
    if (!decision.ok) throw new LabDataError('Transition authorization failed.', 409)
    const patch = action === 'void'
      ? { voided_at: new Date().toISOString(), void_reason: reason }
      : {}
    const event = await repository.buildLabEvent(orgId, id, {
      actor: member.aiverid,
      actorLevel: member.verificationLevel,
      action,
      payload: reason === null ? {} : { reason },
    })
    const updated = await repository.transition(orgId, id, record.state, decision.nextState, patch, event)
    if (!updated) return NextResponse.json({ error: 'The preparation record changed before this request completed.' }, { status: 409 })
    return NextResponse.json(updated)
  })
}

export const submitRecordHandler = (request: NextRequest, orgId: string, id: string) =>
  recordTransitionHandler(request, orgId, id, 'submit')
export const withdrawRecordHandler = (request: NextRequest, orgId: string, id: string) =>
  recordTransitionHandler(request, orgId, id, 'withdraw')
export const rejectRecordHandler = (request: NextRequest, orgId: string, id: string) =>
  recordTransitionHandler(request, orgId, id, 'reject')
export const voidRecordHandler = (request: NextRequest, orgId: string, id: string) =>
  recordTransitionHandler(request, orgId, id, 'void')

export async function releaseRecordHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    const body = await readOptionalObjectBody(request)
    onlyKeys(body, ['deviation_reason'])
    const reason = optionalText(body.deviation_reason, 'deviation_reason', 2_000)
    const released = await releaseRecord(repository, {
      orgId, recordId: id, reviewer: member, deviationReason: reason,
    })
    const { share_token_hash: _shareTokenHash, ...record } = released.record
    return NextResponse.json({ record, signature: released.pack.signature, share_token: released.pack.shareToken })
  })
}

export async function rotateShareLinkHandler(request: NextRequest, orgId: string, id: string): Promise<NextResponse> {
  return withLabAuth(request, orgId, async ({ member, repository }) => {
    assertReviewerRole(member)
    const record = await scopedRecord(repository, orgId, id)
    if (record.state !== 'released' && record.state !== 'voided') {
      throw new LabDataError('A verification link can only be created for a released or voided record.', 409)
    }
    const shareToken = createRecordShareToken()
    // The applied database action constraint predates share-link rotation.
    // Record the mutation as a view_pack operation so it remains inside the
    // signed chain without rewriting an already-applied migration.
    const event = await repository.buildLabEvent(orgId, id, {
      actor: member.aiverid,
      actorLevel: member.verificationLevel,
      action: 'view_pack',
      payload: {
        operation: 'rotate_share_token',
        share_token_hash: hashRecordShareToken(shareToken),
      },
    })
    const updated = await repository.transition(orgId, id, record.state, record.state, {}, event)
    if (!updated) {
      throw new LabDataError('The preparation record changed before the verification link was created.', 409)
    }
    return NextResponse.json({ share_token: shareToken })
  })
}

export async function publicStatusHandler(request: NextRequest, id: string): Promise<NextResponse> {
  try {
    const deps = dependencies()
    const limit = deps.rateLimit(`lab-public:${deps.clientId(request)}`, LAB_PUBLIC_LIMIT)
    if (!limit.success) return NextResponse.json({ error: 'Status request limit reached.' }, { status: 429 })
    const status = await deps.repository().getPublicRecordStatus(id)
    if (!status) return NextResponse.json({ error: 'Preparation record not found.' }, { status: 404 })
    return NextResponse.json({ state: status.state, voided_at: status.voided_at, superseded_by: status.supersedes })
  } catch (error) {
    return responseError(error)
  }
}

export async function packJsonHandler(request: NextRequest, id: string): Promise<NextResponse> {
  try {
    const deps = dependencies()
    const clientId = deps.clientId(request)
    const preflight = deps.rateLimit(`lab-pack-ip:${clientId}`, LAB_PUBLIC_LIMIT)
    if (!preflight.success) return NextResponse.json({ error: 'Evidence-pack request limit reached.' }, { status: 429 })
    const repository = deps.repository()
    const record = await repository.getRecordById(id)
    if (!record || !record.signed_payload || !record.signature || (record.state !== 'released' && record.state !== 'voided')) {
      return NextResponse.json({ error: 'Evidence pack not found.' }, { status: 404 })
    }
    const suppliedToken = request.nextUrl.searchParams.get('token')
    let member: Member & { displayName: string } | null = null
    const session = await deps.verifySession()
    if (session) {
      const row = await repository.getMember(record.org_id, session.userId)
      if (row) member = labMember(row, session)
    }
    const accessEvents = await repository.listEvents(record.org_id, record.id)
    const tokenValid = suppliedToken !== null && hasValidRecordShareToken(
      suppliedToken,
      activeShareTokenHash(record.share_token_hash, accessEvents)
    )
    if (!member && !tokenValid) return NextResponse.json({ error: 'Evidence pack not found.' }, { status: 404 })
    const limitKey = member ? `lab-read:${member.aiverid}` : `lab-public:${clientId}`
    const limit = deps.rateLimit(limitKey, member ? LAB_READ_LIMIT : LAB_PUBLIC_LIMIT)
    if (!limit.success) return NextResponse.json({ error: 'Evidence-pack request limit reached.' }, { status: 429 })
    if (member) {
      // `member` predates the retry loop below; access can be revoked in the
      // window between attempts. Re-checking only `currentRecord` on retry
      // and reusing this stale membership would let a just-revoked caller's
      // second attempt still pass `authorize` and receive the pack.
      if (!session) throw new LabDataError('Evidence pack not found.', 404)
      let currentRecord = record
      let currentMember = member
      let appended = false
      for (let attempt = 0; attempt < 3 && !appended; attempt += 1) {
        const freshRow = await repository.getMember(record.org_id, currentMember.aiverid)
        if (!freshRow) {
          if (tokenValid) break // a revoked member with a valid bearer token still reads via the token path below
          throw new LabDataError('Evidence pack not found.', 404)
        }
        currentMember = labMember(freshRow, session)
        assertDecision(authorize('view_pack', currentMember, {
          state: currentRecord.state, createdBy: currentRecord.created_by, templateStatus: 'approved',
        }))
        const event = await repository.buildLabEvent(record.org_id, record.id, {
          actor: currentMember.aiverid,
          actorLevel: currentMember.verificationLevel,
          action: 'view_pack',
          payload: {},
        })
        try {
          await repository.transition(record.org_id, record.id, currentRecord.state, currentRecord.state, {}, event)
          appended = true
        } catch (error) {
          if (!(error instanceof LabDataError) || error.status !== 409 || attempt === 2) throw error
          const latest = await repository.getRecord(record.org_id, record.id)
          if (!latest || (latest.state !== 'released' && latest.state !== 'voided')) {
            throw new LabDataError('Evidence pack not found.', 404)
          }
          currentRecord = latest
        }
      }
    }
    const payload: unknown = JSON.parse(record.signed_payload)
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new LabDataError('Stored evidence pack is unavailable.', 500)
    }
    return NextResponse.json({ ...(payload as Record<string, unknown>), signature: record.signature }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return responseError(error)
  }
}
