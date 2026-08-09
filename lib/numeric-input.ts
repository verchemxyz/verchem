export interface FiniteNumberConstraints {
  integer?: boolean
  minInclusive?: number
  minExclusive?: number
}

/**
 * Strict parser for calculator text fields. Unlike parseFloat, Number only
 * accepts a complete numeric token; the explicit blank check prevents an
 * empty field from becoming zero.
 */
export function parseRequiredFiniteNumber(
  value: string,
  label: string,
  constraints: FiniteNumberConstraints = {}
): number {
  const normalized = value.trim()
  if (normalized.length === 0) throw new Error(`${label} is required`)

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a finite number`)
  if (constraints.integer && !Number.isInteger(parsed)) {
    throw new Error(`${label} must be an integer`)
  }
  if (constraints.minInclusive !== undefined && parsed < constraints.minInclusive) {
    throw new Error(`${label} must be at least ${constraints.minInclusive}`)
  }
  if (constraints.minExclusive !== undefined && parsed <= constraints.minExclusive) {
    throw new Error(`${label} must be greater than ${constraints.minExclusive}`)
  }

  return parsed
}

export function parseOptionalFiniteNumber(
  value: string,
  label: string,
  constraints: FiniteNumberConstraints = {}
): number | undefined {
  return value.trim().length === 0
    ? undefined
    : parseRequiredFiniteNumber(value, label, constraints)
}
