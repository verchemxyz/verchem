import Link from "next/link";
import type { ReactNode } from "react";

const WIDTHS = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
} as const;

/**
 * Lab Ledger page chrome for a tool/calculator.
 * Provides: background, a back link, an optional mono "eyebrow" label,
 * H1 title, subtitle, an optional right-aligned action, and a constrained
 * <main> with vertical rhythm. NO glass header, NO rainbow title.
 *
 * Replaces the per-page glassmorphism header + `bg-clip-text` rainbow titles.
 */
export function CalcShell({
  title,
  subtitle,
  eyebrow,
  backHref = "/tools",
  backLabel = "All tools",
  action,
  maxWidth = "5xl",
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  maxWidth?: keyof typeof WIDTHS;
  children: ReactNode;
}) {
  const width = WIDTHS[maxWidth];
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className={`${width} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-500 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {eyebrow && (
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  {eyebrow}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-muted-foreground max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>
      </div>
      <main className={`${width} mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6`}>
        {children}
      </main>
    </div>
  );
}
