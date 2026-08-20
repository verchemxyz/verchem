import type { ProvenanceEnvelope } from './types'

const ALLOWED_KEYS = new Set([
  'schema',
  'artifact_hash',
  'dataset_edition',
  'constants_edition',
  'unit_schema',
  'engine_registry_edition',
  'sources',
  'assumptions',
  'applicability',
  'computation',
])
const SHA256_HEX = /^sha256:[a-f0-9]{64}$/
const MAX_DECLARATIONS = 64
const MAX_DECLARATION_LENGTH = 4_000

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBoundedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_DECLARATION_LENGTH
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.length <= MAX_DECLARATIONS &&
    value.every(isBoundedString)
}

export function isValidProvenanceEnvelope(value: unknown): value is ProvenanceEnvelope {
  if (!isPlainObject(value)) return false
  if (Object.keys(value).some((key) => !ALLOWED_KEYS.has(key))) return false

  return value.schema === 'verchem-provenance/v1' &&
    typeof value.artifact_hash === 'string' &&
    SHA256_HEX.test(value.artifact_hash) &&
    isBoundedString(value.dataset_edition) &&
    isBoundedString(value.constants_edition) &&
    value.unit_schema === 'verchem-explicit-units/v1' &&
    isBoundedString(value.engine_registry_edition) &&
    isStringList(value.sources) &&
    isStringList(value.assumptions) &&
    isStringList(value.applicability) &&
    (value.computation === 'deterministic' ||
      value.computation === 'ai-orchestrated-deterministic')
}
