// VerChem - Validation Badge Component
// Shows validation status with quality indicator

interface ValidationBadgeProps {
  quality?: 'excellent' | 'good' | 'acceptable' | 'unvalidated'
  score?: number
  tooltip?: string
}

export function ValidationBadge({
  quality = 'unvalidated',
  score,
  tooltip
}: ValidationBadgeProps) {
  const badges = {
    excellent: {
      icon: '🏆',
      text: 'Validated',
      color: 'bg-success-100 text-success-800 border-success-300 dark:bg-success-950/20 dark:text-success-400 dark:border-success-800',
      description: 'Validated against NIST/CRC standards'
    },
    good: {
      icon: '✅',
      text: 'Verified',
      color: 'bg-primary-100 text-primary-800 border-primary-300 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-800',
      description: 'Verified with reference data'
    },
    acceptable: {
      icon: '✓',
      text: 'Tested',
      color: 'bg-warning-100 text-warning-800 border-warning-300 dark:bg-warning-950/20 dark:text-warning-400 dark:border-warning-800',
      description: 'Tested for accuracy'
    },
    unvalidated: {
      icon: '⚠️',
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
      <span className="text-base">{badge.icon}</span>
      <span>{badge.text}</span>
      {score !== undefined && (
        <span className="font-bold">({score}%)</span>
      )}
    </div>
  )
}