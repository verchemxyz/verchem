import type { ReactNode } from "react";

/**
 * Labeled form field wrapper. The control itself should use the
 * `input-premium w-full` class (already Lab-Ledger / token-driven) or a
 * <select> with the same class. Replaces repeated `text-gray-700` labels.
 */
export function Field({
  label,
  hint,
  htmlFor,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-foreground mb-1.5"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
