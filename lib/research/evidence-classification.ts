/**
 * Scientific evidence classification for VerChem Research.
 *
 * Scientific truth, artifact integrity, replay agreement, and workflow state
 * are deliberately independent. A valid signature never upgrades a V2
 * computation to V3, and a released workflow record never turns a simulation
 * into a V4 experimental observation.
 */

export const SCIENTIFIC_EVIDENCE_SCHEMA_VERSION = 'verchem-scientific-evidence-v1' as const

export type ScientificTruthLevel = 'V0' | 'V1' | 'V2' | 'V3' | 'V4'

interface EvidenceBase {
  schemaVersion: typeof SCIENTIFIC_EVIDENCE_SCHEMA_VERSION
  evidenceId: string
  claim: string
  /** At least one honest scope limitation is required at the runtime boundary. */
  limitations: readonly string[]
}

export interface ReferenceProvenance {
  sourceId: string
  sourceVersion: string
  recordId: string
  contentHash: string
}

export interface ComputationProvenance {
  engine: string
  engineVersion: string
  method: string
  /** Hash of the canonical engine/method/model specification. */
  methodSpecificationHash: string
  parametersHash: string
  inputHash: string
  outputHash: string
  converged: boolean
  warnings: readonly string[]
}

export interface ValidationPackage {
  packageId: string
  packageVersion: string
  property: string
  contentHash: string
  benchmarkCorpusHash: string
  /** Must equal the computation's methodSpecificationHash. */
  methodSpecificationHash: string
  applicabilityDomain: string
  applicabilityAssessmentHash: string
  applicabilityStatus: 'inside'
  status: 'passed'
}

export type ExperimentalSourceType = 'instrument' | 'laboratory-record' | 'published-dataset'

export interface ExperimentalProvenance {
  observationId: string
  sourceType: ExperimentalSourceType
  sourceId: string
  recordedAt: string
  contentHash: string
  conditionsHash: string
}

export interface SymbolicEvidence extends EvidenceBase {
  truthLevel: 'V0'
  symbolicBasis: string
}

export interface StructuralEvidence extends EvidenceBase {
  truthLevel: 'V1'
  referenceProvenance: ReferenceProvenance
}

export interface ComputedEvidence extends EvidenceBase {
  truthLevel: 'V2'
  computationProvenance: ComputationProvenance
}

export interface ValidatedComputationEvidence extends EvidenceBase {
  truthLevel: 'V3'
  computationProvenance: ComputationProvenance
  validationPackage: ValidationPackage
}

export interface ExperimentalEvidence extends EvidenceBase {
  truthLevel: 'V4'
  experimentalProvenance: ExperimentalProvenance
}

export type ScientificEvidence =
  | SymbolicEvidence
  | StructuralEvidence
  | ComputedEvidence
  | ValidatedComputationEvidence
  | ExperimentalEvidence

export type ArtifactIntegrity =
  | { status: 'unsigned' }
  | { status: 'unchecked'; artifactHash: string }
  | {
      status: 'valid'
      artifactHash: string
      algorithm: 'Ed25519'
      keyId: string
      checkedAt: string
    }
  | {
      status: 'invalid'
      artifactHash: string | null
      reason: string
      checkedAt: string
    }

export type ReplayAssessment =
  | { status: 'not_applicable' }
  | { status: 'not_checked'; reason: string }
  | { status: 'matched_current'; engineRelease: string; checkedAt: string }
  | { status: 'mismatch'; engineRelease: string; checkedAt: string; reason: string }
  | { status: 'unavailable'; reason: string }

export type EvidenceWorkflowStatus = 'draft' | 'reviewed' | 'released' | 'rejected' | 'voided'

export interface EvidenceWorkflow {
  status: EvidenceWorkflowStatus
  recordId: string | null
}

export interface ScientificEvidenceEnvelope {
  evidence: ScientificEvidence
  artifactIntegrity: ArtifactIntegrity
  replay: ReplayAssessment
  workflow: EvidenceWorkflow
}

export type EvidenceValidationIssueCode =
  | 'invalid_type'
  | 'invalid_value'
  | 'missing_evidence'
  | 'unknown_field'
  | 'forbidden_claim'

export interface EvidenceValidationIssue {
  path: string
  code: EvidenceValidationIssueCode
  message: string
}

export type EvidenceValidationResult =
  | { ok: true; value: ScientificEvidenceEnvelope }
  | { ok: false; issues: readonly EvidenceValidationIssue[] }

const TRUTH_LABELS: Readonly<Record<ScientificTruthLevel, string>> = {
  V0: 'Symbolic model',
  V1: 'Structural data',
  V2: 'Computed result',
  V3: 'Validated computation',
  V4: 'Experimental observation',
}

const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/
const EXPERIMENTAL_SOURCE_TYPES: ReadonlySet<string> = new Set([
  'instrument',
  'laboratory-record',
  'published-dataset',
])
const WORKFLOW_STATUSES: ReadonlySet<string> = new Set([
  'draft',
  'reviewed',
  'released',
  'rejected',
  'voided',
])
const EVIDENCE_FIELDS = [
  'schemaVersion',
  'evidenceId',
  'claim',
  'limitations',
  'truthLevel',
  'symbolicBasis',
  'referenceProvenance',
  'computationProvenance',
  'validationPackage',
  'experimentalProvenance',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && HASH_PATTERN.test(value)
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
}

function addIssue(
  issues: EvidenceValidationIssue[],
  path: string,
  code: EvidenceValidationIssueCode,
  message: string
): void {
  issues.push({ path, code, message })
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  if (!isNonEmptyString(record[key])) {
    addIssue(issues, `${path}.${key}`, 'invalid_type', 'Expected a non-empty string.')
  }
}

function requireHash(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  if (!isSha256(record[key])) {
    addIssue(issues, `${path}.${key}`, 'invalid_value', 'Expected sha256:<64 lowercase hex characters>.')
  }
}

function requireTimestamp(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  if (!isIsoTimestamp(record[key])) {
    addIssue(issues, `${path}.${key}`, 'invalid_value', 'Expected a canonical ISO-8601 timestamp.')
  }
}

function forbidFields(
  record: Record<string, unknown>,
  fields: readonly string[],
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  for (const field of fields) {
    if (Object.hasOwn(record, field)) {
      addIssue(
        issues,
        `${path}.${field}`,
        'forbidden_claim',
        `Field "${field}" is not permitted for this scientific truth level.`
      )
    }
  }
}

function rejectUnknownFields(
  record: Record<string, unknown>,
  allowedFields: readonly string[],
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  const allowed = new Set(allowedFields)
  for (const field of Object.keys(record)) {
    if (!allowed.has(field)) {
      addIssue(
        issues,
        `${path}.${field}`,
        'unknown_field',
        `Field "${field}" is not part of the scientific evidence schema.`
      )
    }
  }
}

function requireNestedRecord(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: EvidenceValidationIssue[]
): Record<string, unknown> | null {
  const value = record[key]
  if (!isRecord(value)) {
    addIssue(issues, `${path}.${key}`, 'missing_evidence', `A ${key} record is required.`)
    return null
  }
  return value
}

function validateReferenceProvenance(
  record: Record<string, unknown>,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  rejectUnknownFields(record, ['sourceId', 'sourceVersion', 'recordId', 'contentHash'], path, issues)
  requireString(record, 'sourceId', path, issues)
  requireString(record, 'sourceVersion', path, issues)
  requireString(record, 'recordId', path, issues)
  requireHash(record, 'contentHash', path, issues)
}

function validateComputationProvenance(
  record: Record<string, unknown>,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  rejectUnknownFields(record, [
    'engine',
    'engineVersion',
    'method',
    'methodSpecificationHash',
    'parametersHash',
    'inputHash',
    'outputHash',
    'converged',
    'warnings',
  ], path, issues)
  requireString(record, 'engine', path, issues)
  requireString(record, 'engineVersion', path, issues)
  requireString(record, 'method', path, issues)
  requireHash(record, 'methodSpecificationHash', path, issues)
  requireHash(record, 'parametersHash', path, issues)
  requireHash(record, 'inputHash', path, issues)
  requireHash(record, 'outputHash', path, issues)
  if (typeof record.converged !== 'boolean') {
    addIssue(issues, `${path}.converged`, 'invalid_type', 'Expected a boolean convergence result.')
  }
  if (!isStringArray(record.warnings)) {
    addIssue(issues, `${path}.warnings`, 'invalid_type', 'Expected an array of non-empty warning strings.')
  }
}

function validateValidationPackage(
  record: Record<string, unknown>,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  rejectUnknownFields(record, [
    'packageId',
    'packageVersion',
    'property',
    'contentHash',
    'benchmarkCorpusHash',
    'methodSpecificationHash',
    'applicabilityDomain',
    'applicabilityAssessmentHash',
    'applicabilityStatus',
    'status',
  ], path, issues)
  requireString(record, 'packageId', path, issues)
  requireString(record, 'packageVersion', path, issues)
  requireString(record, 'property', path, issues)
  requireHash(record, 'contentHash', path, issues)
  requireHash(record, 'benchmarkCorpusHash', path, issues)
  requireHash(record, 'methodSpecificationHash', path, issues)
  requireString(record, 'applicabilityDomain', path, issues)
  requireHash(record, 'applicabilityAssessmentHash', path, issues)
  if (record.applicabilityStatus !== 'inside') {
    addIssue(issues, `${path}.applicabilityStatus`, 'forbidden_claim', 'V3 requires the input to be inside the declared applicability domain.')
  }
  if (record.status !== 'passed') {
    addIssue(issues, `${path}.status`, 'forbidden_claim', 'V3 requires a passed validation package.')
  }
}

function validateExperimentalProvenance(
  record: Record<string, unknown>,
  path: string,
  issues: EvidenceValidationIssue[]
): void {
  rejectUnknownFields(record, [
    'observationId',
    'sourceType',
    'sourceId',
    'recordedAt',
    'contentHash',
    'conditionsHash',
  ], path, issues)
  requireString(record, 'observationId', path, issues)
  if (typeof record.sourceType !== 'string' || !EXPERIMENTAL_SOURCE_TYPES.has(record.sourceType)) {
    addIssue(issues, `${path}.sourceType`, 'invalid_value', 'Expected a supported experimental source type.')
  }
  requireString(record, 'sourceId', path, issues)
  requireTimestamp(record, 'recordedAt', path, issues)
  requireHash(record, 'contentHash', path, issues)
  requireHash(record, 'conditionsHash', path, issues)
}

function validateEvidence(record: Record<string, unknown>, issues: EvidenceValidationIssue[]): void {
  const path = 'evidence'
  rejectUnknownFields(record, EVIDENCE_FIELDS, path, issues)
  if (record.schemaVersion !== SCIENTIFIC_EVIDENCE_SCHEMA_VERSION) {
    addIssue(issues, `${path}.schemaVersion`, 'invalid_value', 'Unsupported scientific evidence schema version.')
  }
  requireString(record, 'evidenceId', path, issues)
  requireString(record, 'claim', path, issues)
  if (!isStringArray(record.limitations) || record.limitations.length === 0) {
    addIssue(issues, `${path}.limitations`, 'invalid_value', 'At least one explicit scope limitation is required.')
  }

  switch (record.truthLevel) {
    case 'V0': {
      requireString(record, 'symbolicBasis', path, issues)
      forbidFields(record, ['referenceProvenance', 'computationProvenance', 'validationPackage', 'experimentalProvenance'], path, issues)
      break
    }
    case 'V1': {
      const provenance = requireNestedRecord(record, 'referenceProvenance', path, issues)
      if (provenance) validateReferenceProvenance(provenance, `${path}.referenceProvenance`, issues)
      forbidFields(record, ['symbolicBasis', 'computationProvenance', 'validationPackage', 'experimentalProvenance'], path, issues)
      break
    }
    case 'V2': {
      const provenance = requireNestedRecord(record, 'computationProvenance', path, issues)
      if (provenance) validateComputationProvenance(provenance, `${path}.computationProvenance`, issues)
      forbidFields(record, ['symbolicBasis', 'referenceProvenance', 'validationPackage', 'experimentalProvenance'], path, issues)
      break
    }
    case 'V3': {
      const computation = requireNestedRecord(record, 'computationProvenance', path, issues)
      const validation = requireNestedRecord(record, 'validationPackage', path, issues)
      if (computation) validateComputationProvenance(computation, `${path}.computationProvenance`, issues)
      if (validation) validateValidationPackage(validation, `${path}.validationPackage`, issues)
      if (computation && validation) {
        if (computation.converged !== true) {
          addIssue(issues, `${path}.computationProvenance.converged`, 'forbidden_claim', 'A non-converged result cannot be classified as V3.')
        }
        if (computation.methodSpecificationHash !== validation.methodSpecificationHash) {
          addIssue(issues, `${path}.validationPackage.methodSpecificationHash`, 'forbidden_claim', 'The validation package does not cover this computation method specification.')
        }
      }
      forbidFields(record, ['symbolicBasis', 'referenceProvenance', 'experimentalProvenance'], path, issues)
      break
    }
    case 'V4': {
      const provenance = requireNestedRecord(record, 'experimentalProvenance', path, issues)
      if (provenance) validateExperimentalProvenance(provenance, `${path}.experimentalProvenance`, issues)
      forbidFields(record, ['symbolicBasis', 'referenceProvenance', 'computationProvenance', 'validationPackage'], path, issues)
      break
    }
    default:
      addIssue(issues, `${path}.truthLevel`, 'invalid_value', 'Expected one of V0, V1, V2, V3, or V4.')
  }
}

function validateArtifactIntegrity(record: Record<string, unknown>, issues: EvidenceValidationIssue[]): void {
  const path = 'artifactIntegrity'
  switch (record.status) {
    case 'unsigned':
      rejectUnknownFields(record, ['status'], path, issues)
      break
    case 'unchecked':
      rejectUnknownFields(record, ['status', 'artifactHash'], path, issues)
      requireHash(record, 'artifactHash', path, issues)
      break
    case 'valid':
      rejectUnknownFields(record, ['status', 'artifactHash', 'algorithm', 'keyId', 'checkedAt'], path, issues)
      requireHash(record, 'artifactHash', path, issues)
      if (record.algorithm !== 'Ed25519') {
        addIssue(issues, `${path}.algorithm`, 'invalid_value', 'Expected Ed25519 for a valid VerChem signature.')
      }
      requireString(record, 'keyId', path, issues)
      requireTimestamp(record, 'checkedAt', path, issues)
      break
    case 'invalid':
      rejectUnknownFields(record, ['status', 'artifactHash', 'reason', 'checkedAt'], path, issues)
      if (record.artifactHash !== null && !isSha256(record.artifactHash)) {
        addIssue(issues, `${path}.artifactHash`, 'invalid_value', 'Expected null or a SHA-256 artifact hash.')
      }
      requireString(record, 'reason', path, issues)
      requireTimestamp(record, 'checkedAt', path, issues)
      break
    default:
      addIssue(issues, `${path}.status`, 'invalid_value', 'Unknown artifact-integrity status.')
  }
}

function validateReplay(record: Record<string, unknown>, issues: EvidenceValidationIssue[]): void {
  const path = 'replay'
  switch (record.status) {
    case 'not_applicable':
      rejectUnknownFields(record, ['status'], path, issues)
      break
    case 'not_checked':
    case 'unavailable':
      rejectUnknownFields(record, ['status', 'reason'], path, issues)
      requireString(record, 'reason', path, issues)
      break
    case 'matched_current':
      rejectUnknownFields(record, ['status', 'engineRelease', 'checkedAt'], path, issues)
      requireString(record, 'engineRelease', path, issues)
      requireTimestamp(record, 'checkedAt', path, issues)
      break
    case 'mismatch':
      rejectUnknownFields(record, ['status', 'engineRelease', 'checkedAt', 'reason'], path, issues)
      requireString(record, 'engineRelease', path, issues)
      requireTimestamp(record, 'checkedAt', path, issues)
      requireString(record, 'reason', path, issues)
      break
    default:
      addIssue(issues, `${path}.status`, 'invalid_value', 'Unknown replay status.')
  }
}

function validateWorkflow(record: Record<string, unknown>, issues: EvidenceValidationIssue[]): void {
  const path = 'workflow'
  rejectUnknownFields(record, ['status', 'recordId'], path, issues)
  if (typeof record.status !== 'string' || !WORKFLOW_STATUSES.has(record.status)) {
    addIssue(issues, `${path}.status`, 'invalid_value', 'Unknown evidence workflow status.')
  }
  if (record.recordId !== null && !isNonEmptyString(record.recordId)) {
    addIssue(issues, `${path}.recordId`, 'invalid_type', 'Expected null or a non-empty record ID.')
  }
}

/** Validate untrusted JSON before it can drive scientific claim badges. */
export function validateScientificEvidenceEnvelope(input: unknown): EvidenceValidationResult {
  const issues: EvidenceValidationIssue[] = []
  if (!isRecord(input)) {
    return {
      ok: false,
      issues: [{ path: '$', code: 'invalid_type', message: 'Expected a scientific evidence envelope object.' }],
    }
  }

  rejectUnknownFields(input, ['evidence', 'artifactIntegrity', 'replay', 'workflow'], '$', issues)

  const evidence = input.evidence
  const artifactIntegrity = input.artifactIntegrity
  const replay = input.replay
  const workflow = input.workflow

  if (isRecord(evidence)) validateEvidence(evidence, issues)
  else addIssue(issues, 'evidence', 'missing_evidence', 'A scientific evidence record is required.')

  if (isRecord(artifactIntegrity)) validateArtifactIntegrity(artifactIntegrity, issues)
  else addIssue(issues, 'artifactIntegrity', 'invalid_type', 'An artifact-integrity assessment is required.')

  if (isRecord(replay)) validateReplay(replay, issues)
  else addIssue(issues, 'replay', 'invalid_type', 'A replay assessment is required.')

  if (isRecord(workflow)) validateWorkflow(workflow, issues)
  else addIssue(issues, 'workflow', 'invalid_type', 'A workflow assessment is required.')

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, value: input as unknown as ScientificEvidenceEnvelope }
}

export function getScientificTruthLabel(level: ScientificTruthLevel): string {
  return TRUTH_LABELS[level]
}

export function isScientificallyValidated(
  evidence: ScientificEvidence
): evidence is ValidatedComputationEvidence {
  return evidence.truthLevel === 'V3'
}

export function isExperimentalObservation(
  evidence: ScientificEvidence
): evidence is ExperimentalEvidence {
  return evidence.truthLevel === 'V4'
}
