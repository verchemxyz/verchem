import type { ReactNode } from "react";

/**
 * Lab Ledger surface primitive.
 * Solid, bordered, no glassmorphism, no shadow — a reagent-label card.
 * Replaces legacy `.premium-card` and the now-dead `bg-surface`.
 */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-border rounded-lg bg-card ${className}`}>
      {children}
    </div>
  );
}

/** Section heading inside a calculator page. */
export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-lg font-semibold text-foreground tracking-tight ${className}`}>
      {children}
    </h2>
  );
}
