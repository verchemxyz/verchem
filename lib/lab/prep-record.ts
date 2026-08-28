/**
 * VerChem Lab-QC — preparation-record state machine and authorization rules.
 *
 * Pure and deterministic: no I/O, no clock. Every API route must call
 * `authorize()` with membership read from the database on the same request
 * (never from a cookie) and must persist the transition with a conditional
 * update (`WHERE state = :from`) so two concurrent releases cannot both win.
 *
 * Spec: .ai-memory/SPEC_LABQC_PREP_RELEASE.md §5 (invariants), §7 (edge cases).
 */

export type RecordState = 'draft' | 'submitted' | 'released' | 'rejected' | 'voided'
export type MemberRole = 'owner' | 'reviewer' | 'analyst' | 'viewer'
export type TemplateStatus = 'draft' | 'approved' | 'retired'
export type RecordAction =
  | 'create'
  | 'edit'
  | 'submit'
  | 'withdraw'
  | 'release'
  | 'reject'
  | 'void'
  | 'view_pack'

export type VerificationLevel = 1 | 2 | 3 | 4

/**
 * Minimum AIVerID verification level required to release a record.
 * พี่จ๊อบ 2026-08-26: level 1 for now; raise to 2 when the time is right.
 * This is the ONLY place that decision lives.
 */
export const RELEASE_MIN_VERIFICATION_LEVEL: VerificationLevel = 1

export interface Member {
  aiverid: string
  role: MemberRole
  verificationLevel: VerificationLevel
  /** ISO timestamp when membership was revoked; null when active. */
  revokedAt: string | null
}

export interface RecordSnapshot {
  state: RecordState
  /** aiverid of the preparer (record creator). */
  createdBy: string
  /** Status of the template version the record is bound to. */
  templateStatus: TemplateStatus
}

export interface ActionContext {
  /** Required for `reject` and `void`; required for `release` when out of acceptance. */
  reason?: string | null
  /** From the server-side re-computation at release time. */
  withinAcceptance?: boolean
}

export type Decision =
  | { ok: true; nextState: RecordState }
  | { ok: false; code: 'forbidden' | 'conflict' | 'invalid'; reason: string }

/** Roles allowed to initiate each action. Ownership/self-checks are applied on top. */
const ROLE_MATRIX: Readonly<Record<RecordAction, ReadonlySet<MemberRole>>> = {
  create: new Set(['owner', 'reviewer', 'analyst']),
  edit: new Set(['owner', 'reviewer', 'analyst']),
  submit: new Set(['owner', 'reviewer', 'analyst']),
  withdraw: new Set(['owner', 'reviewer', 'analyst']),
  release: new Set(['owner', 'reviewer']),
  reject: new Set(['owner', 'reviewer']),
  void: new Set(['owner', 'reviewer']),
  view_pack: new Set(['owner', 'reviewer', 'analyst', 'viewer']),
}

/** Browser-safe UI gate derived from the same role matrix enforced by `authorize()`. */
export function canCreatePreparation(role: MemberRole | null | undefined): boolean {
  return role !== null && role !== undefined && ROLE_MATRIX.create.has(role)
}

/** Legal transitions. `view_pack` and `create` do not change state. */
const TRANSITIONS: Readonly<Record<RecordAction, Readonly<Partial<Record<RecordState, RecordState>>>>> = {
  create: {},
  edit: { draft: 'draft' },
  submit: { draft: 'submitted' },
  withdraw: { submitted: 'draft' },
  release: { submitted: 'released' },
  reject: { submitted: 'rejected' },
  void: { released: 'voided' },
  view_pack: { released: 'released', voided: 'voided' },
}

const MIN_REASON_LENGTH = 3
const MAX_REASON_LENGTH = 2_000

function forbid(reason: string): Decision {
  return { ok: false, code: 'forbidden', reason }
}
function conflict(reason: string): Decision {
  return { ok: false, code: 'conflict', reason }
}
function invalid(reason: string): Decision {
  return { ok: false, code: 'invalid', reason }
}

export function isValidReason(reason: unknown): reason is string {
  if (typeof reason !== 'string') return false
  const trimmed = reason.trim()
  return trimmed.length >= MIN_REASON_LENGTH &&
    trimmed.length <= MAX_REASON_LENGTH &&
    !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmed)
}

/**
 * Decide whether `actor` may perform `action` on `record`.
 * Order of checks is deliberate: membership → role → state → self-separation → level → reason.
 * A `forbidden` never leaks whether the state would have allowed the action.
 */
export function authorize(
  action: RecordAction,
  actor: Member,
  record: RecordSnapshot,
  ctx: ActionContext = {}
): Decision {
  if (actor.revokedAt !== null) {
    return forbid('Membership has been revoked.')
  }
  if (!ROLE_MATRIX[action].has(actor.role)) {
    return forbid(`Role "${actor.role}" may not ${action.replace('_', ' ')} preparation records.`)
  }

  if (action === 'create') {
    if (record.templateStatus !== 'approved') {
      return conflict('Records can only be created from an approved template version.')
    }
    return { ok: true, nextState: 'draft' }
  }

  const nextState = TRANSITIONS[action][record.state]
  if (nextState === undefined) {
    return conflict(`Cannot ${action.replace('_', ' ')} a record in state "${record.state}".`)
  }

  const isPreparer = actor.aiverid === record.createdBy
  switch (action) {
    case 'edit':
    case 'submit':
    case 'withdraw':
      if (!isPreparer) return forbid('Only the preparer may modify or submit this record.')
      break
    case 'release':
      if (isPreparer) return forbid('The preparer cannot release their own record (reviewer separation).')
      if (actor.verificationLevel < RELEASE_MIN_VERIFICATION_LEVEL) {
        return forbid(`Releasing requires AIVerID verification level ${RELEASE_MIN_VERIFICATION_LEVEL} or higher.`)
      }
      if (ctx.withinAcceptance === undefined) {
        return invalid('Release requires the server-side acceptance result.')
      }
      if (!ctx.withinAcceptance && !isValidReason(ctx.reason)) {
        return invalid('A deviation reason (3–2000 characters) is required to release a record outside acceptance.')
      }
      break
    case 'reject':
      if (isPreparer) return forbid('The preparer cannot reject their own record; withdraw it instead.')
      if (!isValidReason(ctx.reason)) return invalid('A rejection reason (3–2000 characters) is required.')
      break
    case 'void':
      if (!isValidReason(ctx.reason)) return invalid('A void reason (3–2000 characters) is required.')
      break
    case 'view_pack':
      break
  }

  return { ok: true, nextState }
}

/** Outcome written into the evidence pack at release. */
export function releaseOutcome(withinAcceptance: boolean): 'released' | 'released_with_deviation' {
  return withinAcceptance ? 'released' : 'released_with_deviation'
}

/**
 * Org-scoped running number, e.g. `PR-2026-000123`. The caller supplies the
 * year (from the record's creation timestamp) and the next sequence from a
 * per-(org, year) counter held in a single transaction.
 */
export function formatRecordNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error('Record-number year must be a four-digit integer.')
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999_999) {
    throw new Error('Record-number sequence must be an integer in 1..999999.')
  }
  return `PR-${year}-${String(sequence).padStart(6, '0')}`
}

export const RECORD_NUMBER_PATTERN = /^PR-\d{4}-\d{6}$/
