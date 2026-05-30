import type { ReactNode } from "react";

/**
 * Inline error banner. Reagent-red (destructive token) only — never used for
 * decoration. role="alert" for screen readers. Replaces `bg-red-50 text-red-700`.
 */
export function ErrorBanner({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`border border-destructive/40 bg-destructive/10 rounded-md p-4 ${className}`}
    >
      <div className="flex items-center gap-2 text-destructive font-semibold mb-1">
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
          />
        </svg>
        Error
      </div>
      <p className="text-sm text-destructive">{children}</p>
    </div>
  );
}
