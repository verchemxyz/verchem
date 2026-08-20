/**
 * Browser-safe canonical JSON used by signing, provenance hashing, and the
 * independent verifier. Object keys are sorted recursively; arrays retain
 * their declared order.
 */

export function canonicalizeJson(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonicalizeJson)

  // A null-prototype accumulator ensures keys such as "__proto__" remain
  // ordinary own properties instead of mutating Object.prototype.
  const sorted: Record<string, unknown> = Object.create(null)
  const source = value as Record<string, unknown>
  for (const key of Object.keys(source).sort()) {
    sorted[key] = canonicalizeJson(source[key])
  }
  return sorted
}

export function canonicalJsonString(value: unknown): string {
  return JSON.stringify(canonicalizeJson(value))
}
