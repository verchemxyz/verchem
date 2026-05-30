import { Card } from "./Card";

/**
 * Step-by-step solution list. Mono on a neutral inset surface, indentation
 * preserved (whitespace-pre-wrap). Empty strings render as spacers.
 * Replaces the `bg-surface/50` steps box.
 */
export function StepList({
  steps,
  title = "Step-by-step solution",
  className = "",
}: {
  steps: string[];
  title?: string;
  className?: string;
}) {
  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        {title}
      </h2>
      <div className="font-mono text-sm bg-muted border border-border rounded-md p-4 space-y-1 overflow-x-auto">
        {steps.map((step, i) => (
          <div
            key={i}
            className={step === "" ? "h-2" : "text-foreground whitespace-pre-wrap"}
          >
            {step === "" ? " " : step}
          </div>
        ))}
      </div>
    </Card>
  );
}
