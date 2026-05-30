import type { ReactNode } from "react";

/** Responsive grid container for mode selector buttons. */
export function ModeGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * A single mode/option button. Active = copper border + ring on a neutral
 * surface (theme-safe in light & dark). Replaces the emoji-icon mode buttons
 * and the now-dead `bg-surface`/`btn-premium glow-premium` states.
 */
export function ModeButton({
  active,
  onClick,
  title,
  description,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left p-4 rounded-md border transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? "border-primary-500 bg-muted ring-1 ring-primary-500/40"
          : "border-border bg-card hover:bg-muted hover:border-primary-500/40"
      } ${className}`}
    >
      <div className={`text-sm font-semibold ${active ? "text-primary-600" : "text-foreground"}`}>
        {title}
      </div>
      {description && (
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      )}
    </button>
  );
}
