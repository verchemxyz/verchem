import 'server-only'

/**
 * Lab-QC persistence boundary.
 *
 * Every public operation takes an organization selected by an authenticated
 * membership. The small structural client interface intentionally permits a
 * recording fake in contract tests without creating a live Supabase project.
 */

import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { canonicalJsonString } from '@/lib/answer-cards/canonical-json'
import { appendEvent, verifyChain, type LabEvent } from '@/lib/lab/audit-chain'
import type { Member, RecordAction, VerificationLevel } from '@/lib/lab/prep-record'
import type {
  LabMemberRow,
  Organization,
  PrepDraft,
  PrepRecord,
  PrepTemplate,
  PrepTemplateSpec,
} from '@/lib/lab/types'

interface LabDatabaseError {
  code?: string
  message?: string
}

export interface LabDatabaseResponse {
  data: unknown
  error: LabDatabaseError | null
}

export interface LabDatabaseQuery extends PromiseLike<LabDatabaseResponse> {
  select(columns?: string): LabDatabaseQuery
  insert(values: Record<string, unknown> | Array<Record<string, unknown>>): LabDatabaseQuery
  update(values: Record<string, unknown>): LabDatabaseQuery
  eq(column: string, value: unknown): LabDatabaseQuery
  is(column: string, value: null): LabDatabaseQuery
  order(column: string, options?: { ascending?: boolean }): LabDatabaseQuery
  limit(count: number): LabDatabaseQuery
  single(): LabDatabaseQuery
  maybeSingle(): LabDatabaseQuery
}

export interface LabDatabaseClient {
  from(table: string): LabDatabaseQuery
  rpc(functionName: string, parameters?: Record<string, unknown>): PromiseLike<LabDatabaseResponse>
}

export class LabDataError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 409 | 500 = 500
  ) {
    super(message)
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabase(): LabDatabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new LabDataError('Lab database is not configured.', 500)
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as LabDatabaseClient
}

function asOne<T>(response: LabDatabaseResponse): T | null {
  if (response.error) {
    if (response.error.code === 'PGRST116') return null
    throw databaseError(response.error)
  }
  return response.data === null ? null : response.data as T
}

function asRows<T>(response: LabDatabaseResponse): T[] {
  if (response.error) throw databaseError(response.error)
  return Array.isArray(response.data) ? response.data as T[] : []
}

function databaseError(error: LabDatabaseError): LabDataError {
  if (error.code === '23505' || error.code === 'P4C09') {
    return new LabDataError('The preparation record changed before this request completed.', 409)
  }
  if (error.code === '23503' || error.code === 'PGRST116') return new LabDataError('The requested resource was not found.', 404)
  if (error.code === '23514') return new LabDataError('The requested state is not valid.', 409)
  if (error.code === '22023') return new LabDataError('The request contains invalid transition data.', 400)
  return new LabDataError('Lab database operation failed.', 500)
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLocaleLowerCase('en')
  if (normalized.length === 0 || normalized.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new LabDataError('email must be a valid email address.', 400)
  }
  return normalized
}

export function pendingInviteAiverid(email: string): `pending:${string}` {
  return `pending:${sha256(normalizeEmail(email))}`
}

function safeSlug(name: string): string {
  const slug = name
    .trim()
    .toLocaleLowerCase('en')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug)) {
    throw new LabDataError('Organization or template name cannot be converted to a valid identifier.', 400)
  }
  return slug
}

function templateSpecHash(spec: PrepTemplateSpec): `sha256:${string}` {
  return `sha256:${sha256(canonicalJsonString(spec))}`
}

function validRole(value: string): value is Member['role'] {
  return value === 'owner' || value === 'reviewer' || value === 'analyst' || value === 'viewer'
}

export interface CreateOrganizationInput {
  name: string
  slug?: string
  country?: string | null
  accreditationRef?: string | null
  createdBy: string
  displayName?: string
}

export interface InviteMemberInput {
  email: string
  role: Member['role']
  displayName?: string
  invitedBy: string
}

export interface CreateRecordInput {
  templateId: string
  templateVersion: number
  createdBy: string
  year?: number
  actorLevel: VerificationLevel
  at?: string
}

export interface AppendEventInput {
  orgId: string
  recordId: string
  actor: string
  actorLevel: VerificationLevel
  action: RecordAction
  payload: Record<string, unknown>
  at?: string
}

export type TransitionEventInput = Omit<AppendEventInput, 'orgId' | 'recordId'>

export class LabRepository {
  constructor(private readonly client: LabDatabaseClient = getSupabase()) {}

  async getMembership(aiverid: string): Promise<LabMemberRow[]> {
    return asRows<LabMemberRow>(await this.client
      .from('org_members')
      .select('org_id, aiverid, role, display_name, invited_email, invited_by, joined_at, revoked_at, revoked_by')
      .eq('aiverid', aiverid)
      .is('revoked_at', null)
      .order('created_at', { ascending: true }))
  }

  async getMember(orgId: string, aiverid: string): Promise<LabMemberRow | null> {
    return asOne<LabMemberRow>(await this.client
      .from('org_members')
      .select('org_id, aiverid, role, display_name, invited_email, invited_by, joined_at, revoked_at, revoked_by')
      .eq('org_id', orgId)
      .eq('aiverid', aiverid)
      .is('revoked_at', null)
      .maybeSingle())
  }

  /** Historical identity lookup for evidence packs; never use this for authorization. */
  async getMemberHistory(orgId: string, aiverid: string): Promise<LabMemberRow | null> {
    return asOne<LabMemberRow>(await this.client
      .from('org_members')
      .select('org_id, aiverid, role, display_name, invited_email, invited_by, joined_at, revoked_at, revoked_by')
      .eq('org_id', orgId)
      .eq('aiverid', aiverid)
      .maybeSingle())
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    return asOne<Organization>(await this.client
      .from('organizations')
      .select('id, name, slug, country, accreditation_ref, created_by, created_at')
      .eq('id', orgId)
      .maybeSingle())
  }

  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const name = input.name.trim()
    if (name.length === 0 || name.length > 200) throw new LabDataError('name must contain 1–200 characters.', 400)
    const slug = input.slug === undefined ? safeSlug(name) : safeSlug(input.slug)
    const country = input.country === undefined || input.country === null ? null : input.country.trim().toUpperCase()
    if (country !== null && !/^[A-Z]{2}$/.test(country)) throw new LabDataError('country must be an ISO 3166-1 alpha-2 code.', 400)
    const accreditationRef = input.accreditationRef === undefined || input.accreditationRef === null
      ? null
      : input.accreditationRef.trim()
    if (accreditationRef !== null && accreditationRef.length > 120) {
      throw new LabDataError('accreditationRef must contain at most 120 characters.', 400)
    }
    const response = await this.client.rpc('lab_create_org', {
      p_name: name,
      p_slug: slug,
      p_country: country,
      p_accreditation_ref: accreditationRef,
      p_created_by: input.createdBy,
      p_display_name: (input.displayName ?? input.createdBy).trim().slice(0, 120) || input.createdBy,
    })
    const organization = asOne<Organization>(response)
    if (!organization) throw new LabDataError('Organization creation returned no row.', 500)
    return organization
  }

  async inviteMember(orgId: string, input: InviteMemberInput): Promise<LabMemberRow> {
    if (!validRole(input.role) || input.role === 'owner') {
      throw new LabDataError('role must be reviewer, analyst, or viewer.', 400)
    }
    const email = normalizeEmail(input.email)
    const displayName = (input.displayName?.trim() || email.split('@')[0] || 'Invited member').slice(0, 120)
    const response = await this.client
      .from('org_members')
      .insert({
        org_id: orgId,
        aiverid: pendingInviteAiverid(email),
        role: input.role,
        display_name: displayName,
        invited_email: email,
        invited_by: input.invitedBy,
        joined_at: null,
      })
      .select('org_id, aiverid, role, display_name, invited_email, invited_by, joined_at, revoked_at, revoked_by')
      .single()
    const member = asOne<LabMemberRow>(await response)
    if (!member) throw new LabDataError('Member invitation returned no row.', 500)
    return member
  }

  /** Claim active pending invitations for this canonical member identity. */
  async claimPendingInvites(aiverid: string, email: string): Promise<LabMemberRow[]> {
    const normalizedEmail = normalizeEmail(email)
    const pendingId = pendingInviteAiverid(normalizedEmail)
    const response = await this.client
      .from('org_members')
      .update({ aiverid, joined_at: new Date().toISOString(), invited_email: normalizedEmail })
      .eq('aiverid', pendingId)
      .eq('invited_email', normalizedEmail)
      .is('revoked_at', null)
      .select('org_id, aiverid, role, display_name, invited_email, invited_by, joined_at, revoked_at, revoked_by')
    return asRows<LabMemberRow>(await response)
  }

  async revokeMember(orgId: string, aiverid: string, by: string): Promise<LabMemberRow | null> {
    const response = await this.client
      .from('org_members')
      .update({ revoked_at: new Date().toISOString(), revoked_by: by })
      .eq('org_id', orgId)
      .eq('aiverid', aiverid)
      .is('revoked_at', null)
      .select('org_id, aiverid, role, display_name, invited_email, invited_by, joined_at, revoked_at, revoked_by')
      .maybeSingle()
    return asOne<LabMemberRow>(await response)
  }

  async createTemplateVersion(orgId: string, spec: PrepTemplateSpec, createdBy: string): Promise<PrepTemplate> {
    if (spec.schema !== 'verchem-prep-template/v1' || spec.name.trim().length === 0 || spec.name.length > 200) {
      throw new LabDataError('spec must be a valid verchem-prep-template/v1 template with a name.', 400)
    }
    const key = safeSlug(spec.name)
    const previousRows = asRows<Pick<PrepTemplate, 'version'>>(await this.client
      .from('prep_templates')
      .select('version')
      .eq('org_id', orgId)
      .eq('key', key)
      .order('version', { ascending: false })
      .limit(1))
    const version = (previousRows[0]?.version ?? 0) + 1
    const response = await this.client
      .from('prep_templates')
      .insert({
        org_id: orgId,
        key,
        version,
        status: 'draft',
        spec,
        spec_hash: templateSpecHash(spec),
        created_by: createdBy,
      })
      .select('*')
      .single()
    const template = asOne<PrepTemplate>(await response)
    if (!template) throw new LabDataError('Template creation returned no row.', 500)
    return template
  }

  async approveTemplate(orgId: string, id: string, by: string): Promise<PrepTemplate | null> {
    const current = asOne<PrepTemplate>(await this.client
      .from('prep_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .maybeSingle())
    if (!current) return null
    if (current.created_by === by) throw new LabDataError('The template creator cannot approve their own template.', 403)
    if (current.status !== 'draft') throw new LabDataError('Only a draft template may be approved.', 409)
    const response = await this.client
      .from('prep_templates')
      .update({ status: 'approved', approved_by: by, approved_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('id', id)
      .eq('status', 'draft')
      .select('*')
      .maybeSingle()
    return asOne<PrepTemplate>(await response)
  }

  async retireTemplate(orgId: string, id: string): Promise<PrepTemplate | null> {
    const response = await this.client
      .from('prep_templates')
      .update({ status: 'retired', retired_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('id', id)
      .eq('status', 'approved')
      .select('*')
      .maybeSingle()
    return asOne<PrepTemplate>(await response)
  }

  async getApprovedTemplate(orgId: string, id: string): Promise<PrepTemplate | null> {
    return asOne<PrepTemplate>(await this.client
      .from('prep_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle())
  }

  async getTemplateForRecord(orgId: string, id: string, version: number): Promise<PrepTemplate | null> {
    return asOne<PrepTemplate>(await this.client
      .from('prep_templates')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .eq('version', version)
      .maybeSingle())
  }

  async createRecord(orgId: string, input: CreateRecordInput): Promise<PrepRecord> {
    const year = input.year ?? new Date().getUTCFullYear()
    if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new LabDataError('Record year is invalid.', 400)
    const recordId = randomUUID()
    const event = appendEvent(null, {
      record_id: recordId,
      seq: 1,
      actor: input.createdBy,
      actor_level: input.actorLevel,
      action: 'create',
      payload: { template_id: input.templateId, template_version: input.templateVersion },
      at: input.at ?? new Date().toISOString(),
    })
    const response = await this.client.rpc('lab_create_record', {
      p_org_id: orgId,
      p_template_id: input.templateId,
      p_created_by: input.createdBy,
      p_year: year,
      p_record_id: recordId,
      p_event: event,
    })
    const record = asOne<PrepRecord>(response)
    if (!record) throw new LabDataError('Record creation returned no row.', 500)
    return record
  }

  async getRecord(orgId: string, id: string): Promise<PrepRecord | null> {
    return asOne<PrepRecord>(await this.client
      .from('prep_records')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .maybeSingle())
  }

  /** Internal resolver for public status/share endpoints. Never returns a response by itself. */
  async getRecordById(id: string): Promise<PrepRecord | null> {
    return asOne<PrepRecord>(await this.client
      .from('prep_records')
      .select('*')
      .eq('id', id)
      .maybeSingle())
  }

  async getPublicRecordStatus(id: string): Promise<Pick<PrepRecord, 'state' | 'voided_at' | 'supersedes'> | null> {
    const record = asOne<Pick<PrepRecord, 'id' | 'org_id' | 'state' | 'voided_at' | 'supersedes'>>(await this.client
      .from('prep_records')
      .select('id, org_id, state, voided_at, supersedes')
      .eq('id', id)
      .maybeSingle())
    if (!record) return null
    const superseding = asRows<Pick<PrepRecord, 'id'>>(await this.client
      .from('prep_records')
      .select('id')
      .eq('org_id', record.org_id)
      .eq('supersedes', id)
      .limit(1))
    return { ...record, supersedes: superseding[0]?.id ?? null }
  }

  async updateDraft(
    orgId: string,
    id: string,
    draft: PrepDraft,
    event: LabEvent
  ): Promise<PrepRecord | null> {
    return this.transition(orgId, id, 'draft', 'draft', { draft }, event)
  }

  /** Build an event from the current chain tail; caller persists it atomically with its transition. */
  async buildLabEvent(orgId: string, recordId: string, input: TransitionEventInput): Promise<LabEvent> {
    const events = await this.listEvents(orgId, recordId)
    return appendEvent(events.at(-1) ?? null, {
      record_id: recordId,
      seq: events.length + 1,
      actor: input.actor,
      actor_level: input.actorLevel,
      action: input.action,
      payload: input.payload,
      at: input.at ?? new Date().toISOString(),
    })
  }

  /** Atomic compare-and-swap: append a validated event and transition one locked record. */
  async transition(
    orgId: string,
    id: string,
    from: PrepRecord['state'],
    to: PrepRecord['state'],
    patch: Record<string, unknown>,
    event: LabEvent
  ): Promise<PrepRecord | null> {
    return asOne<PrepRecord>(await this.client.rpc('lab_apply_transition', {
      p_org_id: orgId,
      p_record_id: id,
      p_from: from,
      p_to: to,
      p_patch: patch,
      p_event: event,
    }))
  }

  async listEvents(orgId: string, recordId: string): Promise<LabEvent[]> {
    return asRows<LabEvent>(await this.client
      .from('lab_events')
      .select('record_id, seq, actor, actor_level, action, payload, prev_hash, hash, at')
      .eq('org_id', orgId)
      .eq('record_id', recordId)
      .order('seq', { ascending: true }))
  }

  async appendLabEvent(input: AppendEventInput): Promise<LabEvent> {
    const event = await this.buildLabEvent(input.orgId, input.recordId, input)
    const response = await this.client
      .from('lab_events')
      .insert({ org_id: input.orgId, ...event })
      .select('record_id, seq, actor, actor_level, action, payload, prev_hash, hash, at')
      .single()
    const inserted = asOne<LabEvent>(await response)
    if (!inserted) throw new LabDataError('Audit event insertion returned no row.', 500)
    return inserted
  }

  async verifyRecordChain(orgId: string, recordId: string) {
    return verifyChain(await this.listEvents(orgId, recordId))
  }

  async setReleasedRecord(
    orgId: string,
    id: string,
    signedPayload: string,
    signature: string,
    outcome: 'released' | 'released_with_deviation',
    deviationReason: string | null,
    releasedBy: string,
    releasedAt: string,
    shareToken: string,
    event: LabEvent
  ): Promise<PrepRecord | null> {
    return this.transition(orgId, id, 'submitted', 'released', {
      signed_payload: signedPayload,
      signature,
      outcome,
      deviation_reason: deviationReason,
      released_by: releasedBy,
      released_at: releasedAt,
      draft: null,
      share_token_hash: hashRecordShareToken(shareToken),
    }, event)
  }
}

export function createLabRepository(client?: LabDatabaseClient): LabRepository {
  return new LabRepository(client)
}

/** A one-time random bearer token. Only its SHA-256 hash is ever persisted. */
export function createRecordShareToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRecordShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function hasValidRecordShareToken(supplied: string | null, storedHash: string | null): boolean {
  if (supplied === null || storedHash === null || !/^[A-Za-z0-9_-]{43}$/.test(supplied) || !/^[0-9a-f]{64}$/.test(storedHash)) {
    return false
  }
  try {
    return timingSafeEqual(
      Buffer.from(hashRecordShareToken(supplied), 'ascii'),
      Buffer.from(storedHash, 'ascii')
    )
  } catch {
    return false
  }
}
