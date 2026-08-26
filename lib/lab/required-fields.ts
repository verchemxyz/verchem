import type { PrepDraft } from './types'

export const REQUIRED_PREP_FIELDS = [
  'lot',
  'coa_assay',
  'expiry',
  'balance_id',
  'flask_id',
  'temperature',
] as const

export type RequiredPrepField = typeof REQUIRED_PREP_FIELDS[number]

const requiredFieldReaders: Readonly<Record<RequiredPrepField, (draft: PrepDraft) => unknown>> = {
  lot: (draft) => draft.measurements.reagentLot,
  coa_assay: (draft) => draft.measurements.coaAssayPercent,
  expiry: (draft) => draft.measurements.expiry,
  balance_id: (draft) => draft.measurements.balanceId,
  flask_id: (draft) => draft.measurements.flaskId,
  temperature: (draft) => draft.measurements.temperatureC,
}

export function isRequiredPrepField(value: unknown): value is RequiredPrepField {
  return typeof value === 'string' && (REQUIRED_PREP_FIELDS as readonly string[]).includes(value)
}

export function hasValidRequiredPrepFields(value: unknown): value is RequiredPrepField[] {
  return Array.isArray(value) &&
    value.every(isRequiredPrepField) &&
    new Set(value).size === value.length
}

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined &&
    (typeof value !== 'string' || value.trim().length > 0)
}

/** Return template field keys whose stored draft values are null, undefined, or blank. */
export function missingRequiredPrepFields(
  requiredFields: readonly RequiredPrepField[],
  draft: PrepDraft
): RequiredPrepField[] {
  return requiredFields.filter((field) => !isPresent(requiredFieldReaders[field](draft)))
}
