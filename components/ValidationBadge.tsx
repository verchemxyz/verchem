// VerChem - Validation Badge Component
// Shows validation status with quality indicator

interface ValidationBadgeProps {
  quality?: 'excellent' | 'good' | 'acceptable' | 'unvalidated'
  score?: number
  tooltip?: string
}

// Award / seal — highest validation tier
function SealIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m-7 8.66l-1.5 2.6a.5.5 0 00.62.7L8 23l1.5-1m5-1l1.5 1 2.38.96a.5.5 0 00.62-.7L17.5 20m1.5-8a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

// Check — verified / tested tiers
function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// Caution triangle — unvalidated / theoretical
function CautionIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

export function ValidationBadge({
  quality = 'unvalidated',
  score,
  tooltip
}: ValidationBadgeProps) {
  const badges = {
    excellent: {
      icon: <SealIcon />,
      text: 'Validated',
      color: 'bg-muted text-success border-success',
      description: 'Validated against NIST/CRC standards'
    },
    good: {
      icon: <CheckIcon />,
      text: 'Verified',
      color: 'bg-muted text-primary-600 border-primary-300 dark:text-primary-400 dark:border-primary-700',
      description: 'Verified with reference data'
    },
    acceptable: {
      icon: <CheckIcon />,
      text: 'Tested',
      color: 'bg-muted text-warning-strong border-warning',
      description: 'Tested for accuracy'
    },
    unvalidated: {
      icon: <CautionIcon />,
      text: 'Theoretical',
      color: 'bg-muted text-muted-foreground border-border',
      description: 'Based on theoretical calculations'
    }
  }

  const badge = badges[quality]

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}
      title={tooltip || badge.description}
    >
      {badge.icon}
      <span>{badge.text}</span>
      {score !== undefined && (
        <span className="font-bold">({score}%)</span>
      )}
    </div>
  )
}