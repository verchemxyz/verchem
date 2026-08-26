import 'server-only'

import { buildDeterministicAnswerCard } from '@/lib/answer-cards/deterministic-card'
import { canonicalPayloadString, signCard, toSignablePayload } from '@/lib/answer-cards/signature'
import { getReleaseManifestHash } from '@/lib/answer-cards/release-manifest'
import { calculateAsPrepared, type AsPreparedInput, type AsPreparedResult } from './as-prepared'
import { verifyChain } from './audit-chain'
import { authorize, releaseOutcome, type Member } from './prep-record'
import { createRecordShareToken, LabDataError, LabRepository } from '@/lib/supabase/lab'
import type { LabActor, LabRecordEnvelope, PrepDraft, PrepRecord, PrepTemplate } from './types'

function isoNow(now?: string): string {
  return now ?? new Date().toISOString()
}

function ensureDraft(draft: PrepRecord['draft']): PrepDraft {
  if (!draft || typeof draft !== 'object' || !('measurements' in draft)) {
    throw new LabDataError('This submitted record has no valid stored measurements.', 400)
  }
  return draft
}

/** Rebuild the calculation input exclusively from the approved version and stored draft. */
export function toAsPreparedInput(template: PrepTemplate, draft: PrepDraft): AsPreparedInput {
  return {
    target: template.spec.target,
    targetVolumeUnit: template.spec.targetVolumeUnit,
    acceptanceRelativePercent: template.spec.acceptance.relativePercent,
    actual: draft.measurements,
  }
}

/** The registered tool deliberately uses snake_case JSON; the stored draft does not. */
export function toAsPreparedToolInput(template: PrepTemplate, draft: PrepDraft): Record<string, unknown> {
  const target = template.spec.target
  const actual = draft.measurements
  return {
    target: {
      target_conc: target.targetConc,
      target_volume: target.targetVolume,
      ...(target.molarMass === undefined ? {} : { molar_mass: target.molarMass }),
      unit: target.unit,
      ...(target.solutionDensity === undefined ? {} : { solution_density: target.solutionDensity }),
      ...(target.equivalentsFactor === undefined ? {} : { equivalents_factor: target.equivalentsFactor }),
      reagent_purity_percent: target.reagentPurityPercent,
      reagent_purity_basis: target.reagentPurityBasis,
      reagent_form: target.reagentForm,
      solvent: target.solvent,
      preparation_temperature_C: target.preparationTemperatureC,
    },
    target_volume_unit: template.spec.targetVolumeUnit,
    acceptance_relative_percent: template.spec.acceptance.relativePercent,
    actual: {
      weighed_g: actual.weighedG,
      measured_ml: actual.measuredMl,
      final_volume_ml: actual.finalVolumeMl,
      coa_assay_percent: actual.coaAssayPercent,
      coa_basis: actual.coaBasis,
      temperature_C: actual.temperatureC,
      reagent_lot: actual.reagentLot,
      expiry: actual.expiry,
      balance_id: actual.balanceId,
      flask_id: actual.flaskId,
      notes: actual.notes,
      equipment: {
        mass_standard_g: actual.equipment.massStandardG,
        flask_tolerance_ml: actual.equipment.flaskToleranceMl,
        flask_calibration_temperature_C: actual.equipment.flaskCalibrationTemperatureC,
        fill_repeatability_sd_ml: actual.equipment.fillRepeatabilitySdMl,
        temperature_half_width_C: actual.equipment.temperatureHalfWidthC,
        volume_expansion_coefficient_per_C: actual.equipment.volumeExpansionCoefficientPerC,
        assay_tolerance_half_width_percent: actual.equipment.assayToleranceHalfWidthPercent,
      },
    },
  }
}

export interface BuildLabRecordEnvelopeInput {
  org: { id: string; name: string }
  record: Pick<PrepRecord, 'id' | 'record_no'>
  template: Pick<PrepTemplate, 'key' | 'version' | 'spec_hash'>
  preparer: LabActor
  reviewer: LabActor
  outcome: LabRecordEnvelope['outcome']
  deviationReason: string | null
  eventsHash: LabRecordEnvelope['events_hash']
  eventsCount: number
  releaseManifestHash?: LabRecordEnvelope['release_manifest_hash']
}

export function buildLabRecordEnvelope(input: BuildLabRecordEnvelopeInput): LabRecordEnvelope {
  return {
    schema: 'verchem-lab-record/v1',
    org: input.org,
    record_no: input.record.record_no,
    record_id: input.record.id,
    template: {
      key: input.template.key,
      version: input.template.version,
      spec_hash: input.template.spec_hash,
    },
    preparer: input.preparer,
    reviewer: input.reviewer,
    outcome: input.outcome,
    deviation_reason: input.deviationReason,
    events_hash: input.eventsHash,
    events_count: input.eventsCount,
    release_manifest_hash: input.releaseManifestHash ?? getReleaseManifestHash(),
  }
}

export interface ReleaseRecordInput {
  orgId: string
  recordId: string
  reviewer: Member & { displayName: string }
  deviationReason?: string | null
  now?: string
}

export interface ReleasedEvidence {
  record: PrepRecord
  asPrepared: AsPreparedResult
  pack: { payload: string; signature: string; shareToken: string }
}

/**
 * Release workflow. The final conditional UPDATE is intentionally last: it is
 * the concurrency decision. When it affects zero rows, the in-memory pack is
 * discarded and no signed payload/signature is persisted.
 *
 * KNOWN LIMITATION (tracked for the ship gate): the release event is appended
 * before the conditional UPDATE, so if two reviewers race, the loser's
 * `release` event remains in the append-only chain even though their release
 * did not happen. Integrity is unaffected — the winner's sealed head/count
 * cover exactly the events that existed at its release, and the chain still
 * verifies — but the log shows an extra `release` entry. The proper fix is a
 * single Postgres function that appends the event and performs the state
 * transition in one transaction.
 */
export async function releaseRecord(
  repository: LabRepository,
  input: ReleaseRecordInput
): Promise<ReleasedEvidence> {
  const record = await repository.getRecord(input.orgId, input.recordId)
  if (!record) throw new LabDataError('Preparation record was not found.', 404)
  const template = await repository.getTemplateForRecord(input.orgId, record.template_id, record.template_version)
  if (!template) {
    throw new LabDataError('The approved template version for this record was not found.', 409)
  }
  const preliminary = authorize('release', input.reviewer, {
    state: record.state,
    createdBy: record.created_by,
    templateStatus: template.status,
  }, { reason: input.deviationReason, withinAcceptance: false })
  // Reject identity/state failures before touching a possibly malformed draft.
  if (!preliminary.ok && preliminary.code !== 'invalid') {
    throw new LabDataError(preliminary.reason, preliminary.code === 'forbidden' ? 403 : 409)
  }
  // Calculate before re-authorizing so acceptance is always derived from the stored draft.
  const draft = ensureDraft(record.draft)
  const asPrepared = calculateAsPrepared(toAsPreparedInput(template, draft))
  const authorized = authorize('release', input.reviewer, {
    state: record.state,
    createdBy: record.created_by,
    templateStatus: template.status,
  }, { reason: input.deviationReason, withinAcceptance: asPrepared.withinAcceptance })
  if (!authorized.ok) {
    throw new LabDataError(authorized.reason, authorized.code === 'forbidden' ? 403 : 409)
  }
  const preparerMember = await repository.getMemberHistory(input.orgId, record.created_by)
  const organization = await repository.getOrganization(input.orgId)
  if (!preparerMember || !organization) throw new LabDataError('Release evidence identity is unavailable.', 409)
  const releasedAt = isoNow(input.now)
  const outcome = releaseOutcome(asPrepared.withinAcceptance)

  // Append before signing. The sealed prefix therefore includes the release event.
  const releaseEvent = await repository.appendLabEvent({
    orgId: input.orgId,
    recordId: record.id,
    actor: input.reviewer.aiverid,
    actorLevel: input.reviewer.verificationLevel,
    action: 'release',
    payload: { outcome, deviation_reason: input.deviationReason ?? null },
    at: releasedAt,
  })
  const events = await repository.listEvents(input.orgId, record.id)
  const chain = verifyChain(events)
  if (!chain.ok || chain.head !== releaseEvent.hash || chain.length < 1) {
    throw new LabDataError('Audit chain verification failed before release.', 409)
  }
  const prepareEvent = events.find((event) => event.action === 'create' && event.actor === record.created_by)
  if (!prepareEvent) throw new LabDataError('Preparation event is unavailable for evidence issuance.', 409)

  const labRecord = buildLabRecordEnvelope({
    org: { id: organization.id, name: organization.name },
    record,
    template,
    preparer: {
      aiverid: record.created_by,
      display_name: preparerMember.display_name,
      verification_level: prepareEvent.actor_level,
      at: record.created_at,
      action: 'prepare',
    },
    reviewer: {
      aiverid: input.reviewer.aiverid,
      display_name: input.reviewer.displayName,
      verification_level: input.reviewer.verificationLevel,
      at: releasedAt,
      action: 'release',
    },
    outcome,
    deviationReason: outcome === 'released_with_deviation' ? input.deviationReason?.trim() ?? null : null,
    eventsHash: chain.head,
    eventsCount: chain.length,
  })
  const card = buildDeterministicAnswerCard('calculate_as_prepared', toAsPreparedToolInput(template, draft), {
    issuedAt: releasedAt,
    question: `${template.spec.name} — ${record.record_no}`,
    labRecord,
  })
  const signature = await signCard(toSignablePayload(card))
  const payload = canonicalPayloadString(toSignablePayload(card))
  const shareToken = createRecordShareToken(record.id)

  const released = await repository.setReleasedRecord(
    input.orgId, record.id, payload, signature, outcome,
    outcome === 'released_with_deviation' ? input.deviationReason?.trim() ?? null : null,
    input.reviewer.aiverid, releasedAt, shareToken
  )
  if (!released) {
    throw new LabDataError('The record was changed by another reviewer before release.', 409)
  }
  return { record: released, asPrepared, pack: { payload, signature, shareToken } }
}
