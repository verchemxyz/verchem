import { isValidSignablePayload } from '@/lib/answer-cards/payload-shape'
import type { SignablePayload } from '@/lib/answer-cards/types'
import type { AsPreparedResult, UncertaintyTerm } from '@/lib/lab/as-prepared'

export interface SignedLabPackData {
  payload: SignablePayload
  result: AsPreparedResult
  actual: {
    reagentLot: string | null
    expiry: string | null
    balanceId: string | null
    flaskId: string | null
    notes: string | null
    coaAssayPercent: number | null
    coaBasis: string | null
    temperatureC: number | null
    finalVolumeMl: number | null
    weighedG: number | null
    measuredMl: number | null
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function isTerm(value: unknown): value is UncertaintyTerm {
  const term = record(value)
  return term !== null &&
    (term.source === 'coa_assay' || term.source === 'mass' || term.source === 'flask_calibration' || term.source === 'fill_repeatability' || term.source === 'temperature_expansion') &&
    (term.status === 'included' || term.status === 'not_included') &&
    (term.distribution === 'rectangular' || term.distribution === 'triangular' || term.distribution === 'normal' || term.distribution === null) &&
    (term.halfWidthOrSd === null || finite(term.halfWidthOrSd) !== null) &&
    (term.unit === 'g' || term.unit === 'mL' || term.unit === '%' || term.unit === null) &&
    (term.standardRelative === null || finite(term.standardRelative) !== null) &&
    typeof term.basis === 'string'
}

function asPreparedResult(value: unknown): value is AsPreparedResult {
  const result = record(value)
  const asPrepared = result && record(result.asPrepared)
  const uncertainty = result && record(result.uncertainty)
  const targetAmount = result && record(result.targetAmount)
  const actualAmount = result && record(result.actualAmount)
  return result !== null && asPrepared !== null && uncertainty !== null && targetAmount !== null && actualAmount !== null &&
    finite(asPrepared.value) !== null && typeof asPrepared.unit === 'string' &&
    finite(result.deviationPercent) !== null && typeof result.withinAcceptance === 'boolean' &&
    typeof uncertainty.available === 'boolean' &&
    (uncertainty.combinedRelative === null || finite(uncertainty.combinedRelative) !== null) &&
    (uncertainty.standard === null || finite(uncertainty.standard) !== null) &&
    (uncertainty.expandedK2 === null || finite(uncertainty.expandedK2) !== null) &&
    typeof uncertainty.unit === 'string' && typeof uncertainty.coverage === 'string' &&
    Array.isArray(uncertainty.budget) && uncertainty.budget.every(isTerm) &&
    finite(targetAmount.value) !== null && typeof targetAmount.unit === 'string' &&
    finite(actualAmount.value) !== null && typeof actualAmount.unit === 'string'
}

/** Decode only fields already covered by the stored signed payload; never recompute a certificate view. */
export function parseSignedLabPack(payloadText: string | null): SignedLabPackData | null {
  if (payloadText === null) return null
  let value: unknown
  try {
    value = JSON.parse(payloadText) as unknown
  } catch {
    return null
  }
  if (!isValidSignablePayload(value) || !value.lab_record) return null
  const toolCall = value.tool_calls.find((call) => call.name === 'calculate_as_prepared' && call.result.ok)
  const input = toolCall ? record(toolCall.input) : null
  const actual = input ? record(input.actual) : null
  if (!toolCall || !actual || !asPreparedResult(toolCall.result.value)) return null
  return {
    payload: value,
    result: toolCall.result.value,
    actual: {
      reagentLot: text(actual.reagent_lot),
      expiry: text(actual.expiry),
      balanceId: text(actual.balance_id),
      flaskId: text(actual.flask_id),
      notes: text(actual.notes),
      coaAssayPercent: finite(actual.coa_assay_percent),
      coaBasis: text(actual.coa_basis),
      temperatureC: finite(actual.temperature_C),
      finalVolumeMl: finite(actual.final_volume_ml),
      weighedG: finite(actual.weighed_g),
      measuredMl: finite(actual.measured_ml),
    },
  }
}
