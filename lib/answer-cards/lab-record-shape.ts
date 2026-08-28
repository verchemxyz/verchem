import type { LabRecordEnvelope } from '@/lib/lab/types'

const SHA256 = /^sha256:[a-f0-9]{64}$/
const AIVERID_MAX = 256
const NAME_MAX = 200
const RECORD_NO = /^PR-\d{4}-\d{6}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}

function actor(value: unknown, action: 'prepare' | 'release'): boolean {
  if (!isRecord(value)) return false
  return boundedString(value.aiverid, AIVERID_MAX) &&
    boundedString(value.display_name, 120) &&
    (value.verification_level === 1 || value.verification_level === 2 ||
      value.verification_level === 3 || value.verification_level === 4) &&
    boundedString(value.at, 64) && value.action === action
}

/** Structural verification for the signed envelope; live state is checked separately by /verify. */
export function isValidLabRecordEnvelope(value: unknown): value is LabRecordEnvelope {
  if (!isRecord(value)) return false
  const allowed = new Set([
    'schema', 'org', 'record_no', 'record_id', 'template', 'preparer', 'reviewer',
    'outcome', 'deviation_reason', 'events_hash', 'events_count', 'release_manifest_hash',
  ])
  if (Object.keys(value).some((key) => !allowed.has(key))) return false
  if (value.schema !== 'verchem-lab-record/v1' || !RECORD_NO.test(String(value.record_no))) return false
  if (!boundedString(value.record_id, 128) || !isRecord(value.org) ||
    Object.keys(value.org).some((key) => key !== 'id' && key !== 'name' && key !== 'accreditation_ref') ||
    !boundedString(value.org.id, 128) || !boundedString(value.org.name, NAME_MAX) ||
    (value.org.accreditation_ref !== undefined && value.org.accreditation_ref !== null &&
      !boundedString(value.org.accreditation_ref, 120))) return false
  if (!isRecord(value.template)) return false
  const templateVersion = value.template.version
  const templateHash = value.template.spec_hash
  if (!boundedString(value.template.key, 80) || typeof templateVersion !== 'number' || !Number.isInteger(templateVersion) ||
    templateVersion < 1 || typeof templateHash !== 'string' || !SHA256.test(templateHash)) return false
  if (!actor(value.preparer, 'prepare') || !actor(value.reviewer, 'release')) return false
  if (value.outcome !== 'released' && value.outcome !== 'released_with_deviation') return false
  if (value.outcome === 'released_with_deviation') {
    if (!boundedString(value.deviation_reason, 2000)) return false
  } else if (value.deviation_reason !== null) return false
  const eventsCount = value.events_count
  return typeof value.events_hash === 'string' && SHA256.test(value.events_hash) &&
    typeof eventsCount === 'number' && Number.isInteger(eventsCount) && eventsCount > 0 && eventsCount <= 1_000_000 &&
    typeof value.release_manifest_hash === 'string' && SHA256.test(value.release_manifest_hash)
}
