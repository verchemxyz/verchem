const LEVEL_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: 'Basic',
  2: 'Verified',
  3: 'Approved',
  4: 'Certified',
}

export function VerificationLevelBadge({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted px-2 py-1 font-mono text-[11px] tabular-nums text-muted-foreground">
      AIVerID · {LEVEL_NAMES[level]} (level {level})
    </span>
  )
}
