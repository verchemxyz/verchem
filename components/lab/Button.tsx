import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  // Solid Oxidized Copper — the single brand action color. No gradient, no glow.
  primary: "bg-primary-500 text-primary-foreground hover:bg-primary-600",
  secondary: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
};

/**
 * Lab Ledger button. Replaces `.btn-premium`/`.glow-premium` and ad-hoc
 * `bg-blue-600`/gradient buttons. 44px min touch target + visible focus ring.
 */
export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium px-6 py-3 min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
