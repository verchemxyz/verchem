import type { ReactNode } from "react";
import { Card } from "./Card";

/**
 * Calculator result display. Clean bordered card with a copper left-rule
 * accent (echoes the homepage signed-result source line). Mono value.
 * Replaces the `bg-gradient-to-br ... text-white animate-pulse-premium` card.
 *
 * NOTE: deliberately NOT a "signed/verified" panel — plain deterministic
 * results are not HMAC-signed, so no fake signature/spectrum motif here
 * (verification visuals are reserved for genuinely signed AnswerCards).
 */
export function ResultPanel({
  children,
  label = "Result",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Card className={`p-6 border-l-2 border-l-primary-500 ${className}`}>
      <div className="text-xs uppercase tracking-wider text-primary-600 mb-2 font-medium">
        {label}
      </div>
      <div className="font-mono text-2xl md:text-3xl font-bold text-foreground break-words">
        {children}
      </div>
    </Card>
  );
}
