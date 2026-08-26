import type { StockPrepInput } from '@/lib/calculations/solution-prep'
import type { VerificationLevel, MemberRole, RecordState, RecordAction } from './prep-record'
import type { ActualMeasurements as EngineActualMeasurements, AsPreparedResult } from './as-prepared'

export type { VerificationLevel, MemberRole, RecordState, RecordAction }

export interface LabActor {
  aiverid: string
  display_name: string
  verification_level: VerificationLevel
  at: string
  action: 'prepare' | 'release'
}

/** Signed with Lab-QC evidence packs; its shape is intentionally browser-verifiable. */
export interface LabRecordEnvelope {
  schema: 'verchem-lab-record/v1'
  org: { id: string; name: string }
  record_no: string
  record_id: string
  template: { key: string; version: number; spec_hash: string }
  preparer: LabActor
  reviewer: LabActor
  outcome: 'released' | 'released_with_deviation'
  deviation_reason: string | null
  events_hash: `sha256:${string}`
  events_count: number
  release_manifest_hash: `sha256:${string}`
}

export interface PrepTemplateSpec {
  schema: 'verchem-prep-template/v1'
  name: string
  target: StockPrepInput
  targetVolumeUnit: 'mL' | 'L'
  acceptance: { relativePercent: number }
  requiredFields: Array<'lot' | 'coa_assay' | 'expiry' | 'balance_id' | 'flask_id' | 'temperature'>
  instructions: string[]
  citations: string[]
}

/** The bench fields retained in a draft. Derived results are deliberately absent. */
export interface PrepDraft {
  measurements: EngineActualMeasurements & {
    reagentLot: string
    expiry: string | null
    balanceId: string | null
    flaskId: string | null
    notes: string
  }
}

export interface Organization {
  id: string
  name: string
  slug: string
  country: string | null
  accreditation_ref: string | null
  created_by: string
  created_at: string
}

export interface LabMemberRow {
  org_id: string
  aiverid: string
  role: MemberRole
  display_name: string
  invited_email: string | null
  invited_by: string
  joined_at: string | null
  revoked_at: string | null
  revoked_by?: string | null
}

export interface PrepTemplate {
  id: string
  org_id: string
  key: string
  version: number
  status: 'draft' | 'approved' | 'retired'
  spec: PrepTemplateSpec
  spec_hash: `sha256:${string}`
  created_by: string
  approved_by: string | null
  approved_at: string | null
  retired_at: string | null
  created_at: string
}

export interface PrepRecord {
  id: string
  org_id: string
  template_id: string
  template_version: number
  record_no: string
  state: RecordState
  draft: PrepDraft | null
  signed_payload: string | null
  signature: string | null
  outcome: 'released' | 'released_with_deviation' | null
  deviation_reason: string | null
  supersedes: string | null
  created_by: string
  released_by: string | null
  released_at: string | null
  voided_at: string | null
  void_reason: string | null
  share_token: string | null
  created_at: string
}

export interface ReleasedRecord extends PrepRecord {
  signed_payload: string
  signature: string
  released_by: string
  released_at: string
  outcome: 'released' | 'released_with_deviation'
}

export type { AsPreparedResult }
