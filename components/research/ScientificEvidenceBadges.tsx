import type { ScientificEvidenceEnvelope } from '@/lib/research/evidence-classification'
import { buildEvidenceBadgePresentations, type EvidenceBadgeTone } from '@/lib/research/evidence-presentation'

const TONE_CLASSES: Readonly<Record<EvidenceBadgeTone, string>> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-primary-500/30 bg-primary-500/10 text-primary-600',
  success: 'border-success/30 bg-success/10 text-success-strong',
  warning: 'border-warning/30 bg-warning/10 text-warning-strong',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive-strong',
}

export function ScientificEvidenceBadges({
  envelope,
}: {
  envelope: ScientificEvidenceEnvelope
}) {
  const badges = buildEvidenceBadgePresentations(envelope)
  return (
    <ul aria-label="Scientific evidence classification" className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <li
          key={badge.axis}
          className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[11px] tabular-nums ${TONE_CLASSES[badge.tone]}`}
          title={badge.detail}
        >
          {badge.label}
        </li>
      ))}
    </ul>
  )
}
