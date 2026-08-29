import assert from 'node:assert/strict'

import './claim-taxonomy-badges.test'
import './claim-taxonomy-calculators.test'
import './claim-taxonomy-visuals.test'
import './scientific-claim-lint.test'

import {
  SCIENTIFIC_EVIDENCE_SCHEMA_VERSION,
  getScientificTruthLabel,
  isExperimentalObservation,
  isScientificallyValidated,
  validateScientificEvidenceEnvelope,
  type ScientificEvidenceEnvelope,
} from '@/lib/research/evidence-classification'
import { buildEvidenceBadgePresentations } from '@/lib/research/evidence-presentation'

const HASH = `sha256:${'a'.repeat(64)}`
const OTHER_HASH = `sha256:${'b'.repeat(64)}`
const CHECKED_AT = '2026-08-30T00:00:00.000Z'

function trustAxes(): Pick<ScientificEvidenceEnvelope, 'artifactIntegrity' | 'replay' | 'workflow'> {
  return {
    artifactIntegrity: {
      status: 'valid',
      artifactHash: HASH,
      algorithm: 'Ed25519',
      keyId: 'verchem-research-test-key',
      checkedAt: CHECKED_AT,
    },
    replay: {
      status: 'matched_current',
      engineRelease: 'xtb@6.7.1',
      checkedAt: CHECKED_AT,
    },
    workflow: { status: 'released', recordId: 'research-record-1' },
  }
}

function computationProvenance() {
  return {
    engine: 'xTB',
    engineVersion: '6.7.1',
    method: 'GFN2-xTB geometry optimization',
    methodSpecificationHash: HASH,
    parametersHash: HASH,
    inputHash: HASH,
    outputHash: OTHER_HASH,
    converged: true,
    warnings: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneRecord(value: unknown): Record<string, unknown> {
  const clone: unknown = structuredClone(value)
  assert.ok(isRecord(clone))
  return clone
}

function nestedRecord(record: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = record[key]
  assert.ok(isRecord(value))
  return value
}

const computedEnvelope: ScientificEvidenceEnvelope = {
  evidence: {
    schemaVersion: SCIENTIFIC_EVIDENCE_SCHEMA_VERSION,
    evidenceId: 'evidence-v2-water',
    truthLevel: 'V2',
    claim: 'Geometry optimization converged under the declared xTB method.',
    limitations: ['A computed geometry is not an experimental observation.'],
    computationProvenance: computationProvenance(),
  },
  ...trustAxes(),
}

const validatedEnvelope: ScientificEvidenceEnvelope = {
  ...computedEnvelope,
  evidence: {
    schemaVersion: SCIENTIFIC_EVIDENCE_SCHEMA_VERSION,
    evidenceId: 'evidence-v3-water',
    truthLevel: 'V3',
    claim: 'Geometry optimization passed the declared validation package.',
    limitations: ['Validated only inside the declared applicability domain.'],
    computationProvenance: computationProvenance(),
    validationPackage: {
      packageId: 'geometry-neutral-small-molecule',
      packageVersion: '1.0.0',
      property: 'equilibrium geometry',
      contentHash: HASH,
      benchmarkCorpusHash: OTHER_HASH,
      methodSpecificationHash: HASH,
      applicabilityDomain: 'Neutral closed-shell molecules within the declared element and size limits.',
      applicabilityAssessmentHash: OTHER_HASH,
      applicabilityStatus: 'inside',
      status: 'passed',
    },
  },
}

const experimentalEnvelope: ScientificEvidenceEnvelope = {
  evidence: {
    schemaVersion: SCIENTIFIC_EVIDENCE_SCHEMA_VERSION,
    evidenceId: 'evidence-v4-spectrum',
    truthLevel: 'V4',
    claim: 'The attached spectrum was recorded by the identified instrument.',
    limitations: ['Observation applies to the identified sample and recorded conditions.'],
    experimentalProvenance: {
      observationId: 'observation-1',
      sourceType: 'instrument',
      sourceId: 'instrument-ftir-01',
      recordedAt: CHECKED_AT,
      contentHash: HASH,
      conditionsHash: OTHER_HASH,
    },
  },
  artifactIntegrity: { status: 'unsigned' },
  replay: { status: 'not_applicable' },
  workflow: { status: 'draft', recordId: null },
}

assert.equal(validateScientificEvidenceEnvelope(computedEnvelope).ok, true)
assert.equal(validateScientificEvidenceEnvelope(validatedEnvelope).ok, true)
assert.equal(validateScientificEvidenceEnvelope(experimentalEnvelope).ok, true)

assert.equal(isScientificallyValidated(computedEnvelope.evidence), false)
assert.equal(isScientificallyValidated(validatedEnvelope.evidence), true)
assert.equal(isExperimentalObservation(validatedEnvelope.evidence), false)
assert.equal(isExperimentalObservation(experimentalEnvelope.evidence), true)

// A valid signature and a matching replay remain V2. Trust axes never promote scientific truth.
assert.equal(computedEnvelope.artifactIntegrity.status, 'valid')
assert.equal(computedEnvelope.replay.status, 'matched_current')
assert.equal(computedEnvelope.evidence.truthLevel, 'V2')

const v3WithoutValidationPackage = cloneRecord(validatedEnvelope)
const v3Evidence = nestedRecord(v3WithoutValidationPackage, 'evidence')
delete v3Evidence.validationPackage
const missingValidation = validateScientificEvidenceEnvelope(v3WithoutValidationPackage)
assert.equal(missingValidation.ok, false)
if (!missingValidation.ok) {
  assert.ok(missingValidation.issues.some((issue) => issue.path === 'evidence.validationPackage'))
}

const failedValidationPackage = cloneRecord(validatedEnvelope)
const failedEvidence = nestedRecord(failedValidationPackage, 'evidence')
const failedPackage = nestedRecord(failedEvidence, 'validationPackage')
failedPackage.status = 'failed'
const failedValidation = validateScientificEvidenceEnvelope(failedValidationPackage)
assert.equal(failedValidation.ok, false)
if (!failedValidation.ok) {
  assert.ok(failedValidation.issues.some((issue) => issue.code === 'forbidden_claim'))
}

const mismatchedMethodPackage = cloneRecord(validatedEnvelope)
const mismatchedMethodEvidence = nestedRecord(mismatchedMethodPackage, 'evidence')
const mismatchedPackage = nestedRecord(mismatchedMethodEvidence, 'validationPackage')
mismatchedPackage.methodSpecificationHash = OTHER_HASH
const methodMismatch = validateScientificEvidenceEnvelope(mismatchedMethodPackage)
assert.equal(methodMismatch.ok, false)
if (!methodMismatch.ok) {
  assert.ok(methodMismatch.issues.some((issue) => (
    issue.path === 'evidence.validationPackage.methodSpecificationHash' && issue.code === 'forbidden_claim'
  )))
}

const nonConvergedV3 = cloneRecord(validatedEnvelope)
const nonConvergedEvidence = nestedRecord(nonConvergedV3, 'evidence')
const nonConvergedComputation = nestedRecord(nonConvergedEvidence, 'computationProvenance')
nonConvergedComputation.converged = false
const nonConvergedClaim = validateScientificEvidenceEnvelope(nonConvergedV3)
assert.equal(nonConvergedClaim.ok, false)
if (!nonConvergedClaim.ok) {
  assert.ok(nonConvergedClaim.issues.some((issue) => (
    issue.path === 'evidence.computationProvenance.converged' && issue.code === 'forbidden_claim'
  )))
}

const v4WithoutExperimentalProvenance = cloneRecord(experimentalEnvelope)
const v4Evidence = nestedRecord(v4WithoutExperimentalProvenance, 'evidence')
delete v4Evidence.experimentalProvenance
const missingExperiment = validateScientificEvidenceEnvelope(v4WithoutExperimentalProvenance)
assert.equal(missingExperiment.ok, false)
if (!missingExperiment.ok) {
  assert.ok(missingExperiment.issues.some((issue) => issue.path === 'evidence.experimentalProvenance'))
}

const v2WithExperimentalClaim = cloneRecord(computedEnvelope)
const v2Evidence = nestedRecord(v2WithExperimentalClaim, 'evidence')
v2Evidence.experimentalProvenance = experimentalEnvelope.evidence.truthLevel === 'V4'
  ? experimentalEnvelope.evidence.experimentalProvenance
  : null
const forbiddenExperiment = validateScientificEvidenceEnvelope(v2WithExperimentalClaim)
assert.equal(forbiddenExperiment.ok, false)
if (!forbiddenExperiment.ok) {
  assert.ok(forbiddenExperiment.issues.some((issue) => (
    issue.path === 'evidence.experimentalProvenance' && issue.code === 'forbidden_claim'
  )))
}

const noLimitations = cloneRecord(computedEnvelope)
const unscopedEvidence = nestedRecord(noLimitations, 'evidence')
unscopedEvidence.limitations = []
const unscopedClaim = validateScientificEvidenceEnvelope(noLimitations)
assert.equal(unscopedClaim.ok, false)
if (!unscopedClaim.ok) {
  assert.ok(unscopedClaim.issues.some((issue) => issue.path === 'evidence.limitations'))
}

const smuggledClaim = cloneRecord(computedEnvelope)
const smuggledEvidence = nestedRecord(smuggledClaim, 'evidence')
smuggledEvidence.scientificallyValidated = true
const smuggledValidation = validateScientificEvidenceEnvelope(smuggledClaim)
assert.equal(smuggledValidation.ok, false)
if (!smuggledValidation.ok) {
  assert.ok(smuggledValidation.issues.some((issue) => (
    issue.path === 'evidence.scientificallyValidated' && issue.code === 'unknown_field'
  )))
}

const prototypeKeyClaim: unknown = JSON.parse(JSON.stringify(computedEnvelope).replace(
  '"evidenceId"',
  '"__proto__":{"scientificallyValidated":true},"evidenceId"'
))
const prototypeKeyValidation = validateScientificEvidenceEnvelope(prototypeKeyClaim)
assert.equal(prototypeKeyValidation.ok, false)
if (!prototypeKeyValidation.ok) {
  assert.ok(prototypeKeyValidation.issues.some((issue) => (
    issue.path === 'evidence.__proto__' && issue.code === 'unknown_field'
  )))
}

assert.equal(getScientificTruthLabel('V0'), 'Symbolic model')
assert.equal(getScientificTruthLabel('V3'), 'Validated computation')
assert.equal(getScientificTruthLabel('V4'), 'Experimental observation')

const v2Badges = buildEvidenceBadgePresentations(computedEnvelope)
assert.deepEqual(v2Badges.map((badge) => badge.axis), [
  'scientific-truth',
  'artifact-integrity',
  'replay',
  'workflow',
])
assert.equal(v2Badges[0].label, 'V2 · Computed result')
assert.equal(v2Badges[1].label, 'Integrity · Signature valid')
assert.equal(v2Badges[2].label, 'Replay · Matched current engine')
assert.equal(v2Badges[3].label, 'Workflow · Released')
assert.ok(v2Badges[1].detail.includes('does not validate the scientific model'))
assert.ok(v2Badges[2].detail.includes('does not prove model applicability'))
assert.ok(v2Badges[3].detail.includes('not a scientific-validity claim'))
assert.equal(v2Badges.some((badge) => badge.label.includes('Validated computation')), false)
assert.equal(v2Badges.some((badge) => badge.label.includes('Experimental observation')), false)

const symbolicBadges = buildEvidenceBadgePresentations({
  evidence: {
    schemaVersion: SCIENTIFIC_EVIDENCE_SCHEMA_VERSION,
    evidenceId: 'presentation-v0',
    truthLevel: 'V0',
    claim: 'A pedagogical shell occupancy model is displayed.',
    limitations: ['Positions and paths are symbolic and not to scale.'],
    symbolicBasis: 'Ground-state electron configuration.',
  },
  artifactIntegrity: { status: 'unsigned' },
  replay: { status: 'not_applicable' },
  workflow: { status: 'draft', recordId: null },
})
assert.equal(symbolicBadges[0].label, 'V0 · Symbolic model')
assert.equal(symbolicBadges[1].label, 'Integrity · Unsigned artifact')

console.log('Scientific evidence classification tests passed')
