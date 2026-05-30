import type { ReactNode } from "react";

/**
 * Centered formula display. Mono, neutral surface, graphite text.
 * Replaces the `bg-pink-50 text-pink-600` formula boxes.
 */
export function FormulaBlock({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`text-center bg-muted border border-border rounded-md py-4 px-4 ${className}`}>
      {label && (
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
          {label}
        </div>
      )}
      <div className="font-mono text-xl md:text-2xl font-semibold text-foreground break-words">
        {children}
      </div>
    </div>
  );
}
