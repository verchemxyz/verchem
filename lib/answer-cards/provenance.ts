import { createHash } from 'node:crypto'
import type { ProvenanceEnvelope, ToolCall } from './types'
import { canonicalJsonString } from './canonical-json'
import { getReleaseManifestHash } from './release-manifest'
export {
  ENGINE_REGISTRY_EDITION,
  REFERENCE_CONSTANTS_EDITION,
  REFERENCE_DATASET_EDITION,
} from './release-manifest-editions'
import {
  ENGINE_REGISTRY_EDITION,
  REFERENCE_CONSTANTS_EDITION,
  REFERENCE_DATASET_EDITION,
} from './release-manifest-editions'

export const ANSWER_CARD_SCHEMA_VERSION = 'w3-v4'

export function artifactHashMaterial(toolCalls: readonly ToolCall[]): string {
  return canonicalJsonString(toolCalls)
}

export function calculateArtifactHash(toolCalls: readonly ToolCall[]): `sha256:${string}` {
  const digest = createHash('sha256')
    .update(artifactHashMaterial(toolCalls), 'utf8')
    .digest('hex')
  return `sha256:${digest}`
}

function describeDeclaredValue(value: unknown): string[] {
  if (typeof value === 'string' && value.trim().length > 0) return [value.trim()]
  if (Array.isArray(value)) {
    return value.flatMap(describeDeclaredValue)
  }
  if (value && typeof value === 'object') {
    const serialized = canonicalJsonString(value)
    return serialized === '{}' ? [] : [serialized]
  }
  return []
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))]
}

export function buildProvenanceEnvelope(
  toolCalls: readonly ToolCall[],
  computation: ProvenanceEnvelope['computation']
): ProvenanceEnvelope {
  const assumptions = unique(toolCalls.flatMap((call) =>
    describeDeclaredValue(call.result.value.assumptions)
  ))
  const applicability = unique(toolCalls.flatMap((call) =>
    describeDeclaredValue(call.result.value.applicability)
  ))

  return {
    schema: 'verchem-provenance/v1',
    artifact_hash: calculateArtifactHash(toolCalls),
    dataset_edition: REFERENCE_DATASET_EDITION,
    constants_edition: REFERENCE_CONSTANTS_EDITION,
    unit_schema: 'verchem-explicit-units/v1',
    engine_registry_edition: ENGINE_REGISTRY_EDITION,
    release_manifest_hash: getReleaseManifestHash(),
    sources: unique(toolCalls.map((call) => call.citation)),
    assumptions: assumptions.length > 0
      ? assumptions
      : ['No additional assumptions were emitted; rely on the signed inputs, result metadata, and cited engine model.'],
    applicability: applicability.length > 0
      ? applicability
      : ['Applicable only to the signed engine, declared input units, model scope, and cited reference conditions.'],
    computation,
  }
}
