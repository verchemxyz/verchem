import {
  getScientificTruthLabel,
  type ArtifactIntegrity,
  type EvidenceWorkflow,
  type ReplayAssessment,
  type ScientificEvidenceEnvelope,
  type ScientificTruthLevel,
} from './evidence-classification'

export type EvidenceBadgeAxis = 'scientific-truth' | 'artifact-integrity' | 'replay' | 'workflow'
export type EvidenceBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export interface EvidenceBadgePresentation {
  axis: EvidenceBadgeAxis
  label: string
  detail: string
  tone: EvidenceBadgeTone
}

const TRUTH_TONES: Readonly<Record<ScientificTruthLevel, EvidenceBadgeTone>> = {
  V0: 'neutral',
  V1: 'info',
  V2: 'info',
  V3: 'success',
  V4: 'success',
}

function presentIntegrity(integrity: ArtifactIntegrity): EvidenceBadgePresentation {
  switch (integrity.status) {
    case 'unsigned':
      return {
        axis: 'artifact-integrity',
        label: 'Integrity · Unsigned artifact',
        detail: 'No cryptographic integrity claim has been made for this artifact.',
        tone: 'neutral',
      }
    case 'unchecked':
      return {
        axis: 'artifact-integrity',
        label: 'Integrity · Signature unchecked',
        detail: 'A signed artifact is present, but its signature has not been checked.',
        tone: 'warning',
      }
    case 'valid':
      return {
        axis: 'artifact-integrity',
        label: 'Integrity · Signature valid',
        detail: 'The artifact passed its cryptographic integrity check. This does not validate the scientific model.',
        tone: 'success',
      }
    case 'invalid':
      return {
        axis: 'artifact-integrity',
        label: 'Integrity · Signature invalid',
        detail: integrity.reason,
        tone: 'danger',
      }
  }
}

function presentReplay(replay: ReplayAssessment): EvidenceBadgePresentation {
  switch (replay.status) {
    case 'not_applicable':
      return {
        axis: 'replay',
        label: 'Replay · Not applicable',
        detail: 'This evidence item does not declare a deterministic replay check.',
        tone: 'neutral',
      }
    case 'not_checked':
      return {
        axis: 'replay',
        label: 'Replay · Not checked',
        detail: replay.reason,
        tone: 'warning',
      }
    case 'matched_current':
      return {
        axis: 'replay',
        label: 'Replay · Matched current engine',
        detail: `The current ${replay.engineRelease} release reproduced the recorded result. This does not prove model applicability.`,
        tone: 'success',
      }
    case 'mismatch':
      return {
        axis: 'replay',
        label: 'Replay · Result mismatch',
        detail: replay.reason,
        tone: 'danger',
      }
    case 'unavailable':
      return {
        axis: 'replay',
        label: 'Replay · Unavailable',
        detail: replay.reason,
        tone: 'warning',
      }
  }
}

function presentWorkflow(workflow: EvidenceWorkflow): EvidenceBadgePresentation {
  const labels: Readonly<Record<EvidenceWorkflow['status'], string>> = {
    draft: 'Draft',
    reviewed: 'Reviewed',
    released: 'Released',
    rejected: 'Rejected',
    voided: 'Voided',
  }
  const tones: Readonly<Record<EvidenceWorkflow['status'], EvidenceBadgeTone>> = {
    draft: 'neutral',
    reviewed: 'info',
    released: 'success',
    rejected: 'danger',
    voided: 'danger',
  }
  return {
    axis: 'workflow',
    label: `Workflow · ${labels[workflow.status]}`,
    detail: 'Workflow status records review and release history; it is not a scientific-validity claim.',
    tone: tones[workflow.status],
  }
}

export function buildEvidenceBadgePresentations(
  envelope: ScientificEvidenceEnvelope
): readonly EvidenceBadgePresentation[] {
  const level = envelope.evidence.truthLevel
  return [
    {
      axis: 'scientific-truth',
      label: `${level} · ${getScientificTruthLabel(level)}`,
      detail: envelope.evidence.limitations.join(' '),
      tone: TRUTH_TONES[level],
    },
    presentIntegrity(envelope.artifactIntegrity),
    presentReplay(envelope.replay),
    presentWorkflow(envelope.workflow),
  ]
}
