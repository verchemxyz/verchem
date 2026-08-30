'use client';

import {
  AlertTriangle,
  Check,
  CircleDashed,
  Info,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/lab';
import type {
  StructureCoachIssue,
  StructureCoachSeverity,
  StructureCoachStatus,
} from '@/lib/molecule/structure-coach';

interface StructureCoachProps {
  status: StructureCoachStatus;
  issues: readonly StructureCoachIssue[];
  autoCheck: boolean;
  isChecking: boolean;
  isTidying: boolean;
  disabled: boolean;
  actionError: string | null;
  onCheck: () => void;
  onTidy: () => void;
  onAutoCheckChange: (enabled: boolean) => void;
}

const STATUS_CONTENT: Record<
  StructureCoachStatus,
  {
    label: string;
    detail: string;
    classes: string;
    icon: typeof CircleDashed;
  }
> = {
  empty: {
    label: 'Add a structure',
    detail: 'Draw or paste a structure to start chemistry-aware checks.',
    classes: 'border-border bg-muted text-muted-foreground',
    icon: CircleDashed,
  },
  dirty: {
    label: 'Not checked',
    detail: 'The drawing changed. Run a structural check before using it.',
    classes: 'border-warning/40 bg-warning/10 text-warning-strong',
    icon: AlertTriangle,
  },
  checking: {
    label: 'Checking…',
    detail: 'Indigo and RDKit are independently examining the current drawing.',
    classes: 'border-primary-500/40 bg-primary-500/10 text-primary-700 dark:text-primary-300',
    icon: LoaderCircle,
  },
  clear: {
    label: 'No issues detected',
    detail: 'No warnings were returned by the supported Indigo and RDKit checks.',
    classes: 'border-success/40 bg-success/10 text-success-strong',
    icon: Check,
  },
  flagged: {
    label: 'Findings to review',
    detail: 'Review the findings below. Some can describe intentional chemistry.',
    classes: 'border-warning/40 bg-warning/10 text-warning-strong',
    icon: AlertTriangle,
  },
  unavailable: {
    label: 'Check unavailable',
    detail: 'The engines could not complete this check. The drawing was not changed.',
    classes: 'border-destructive/40 bg-destructive/10 text-destructive-strong',
    icon: XCircle,
  },
};

const ISSUE_STYLES: Record<StructureCoachSeverity, string> = {
  error: 'border-destructive/35 bg-destructive/5',
  warning: 'border-warning/35 bg-warning/5',
  info: 'border-border bg-muted/50',
};

const ISSUE_LABELS: Record<StructureCoachSeverity, string> = {
  error: 'Needs review',
  warning: 'Check',
  info: 'Note',
};

const ISSUE_LABEL_STYLES: Record<StructureCoachSeverity, string> = {
  error: 'text-destructive-strong',
  warning: 'text-warning-strong',
  info: 'text-muted-foreground',
};

export default function StructureCoach({
  status,
  issues,
  autoCheck,
  isChecking,
  isTidying,
  disabled,
  actionError,
  onCheck,
  onTidy,
  onAutoCheckChange,
}: StructureCoachProps) {
  const statusContent = STATUS_CONTENT[status];
  const StatusIcon = statusContent.icon;
  const controlsDisabled = disabled || isChecking || isTidying;

  return (
    <section
      aria-labelledby="structure-coach-title"
      className="rounded-lg border border-border bg-card"
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="structure-coach-title"
              className="flex items-center gap-2 text-base font-semibold text-foreground"
            >
              <ScanSearch className="h-5 w-5 text-primary-500" aria-hidden="true" />
              Structure Coach
            </h2>
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusContent.classes}`}
            >
              <StatusIcon
                className={`h-3.5 w-3.5 ${status === 'checking' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {status === 'flagged'
                ? `${issues.length} ${issues.length === 1 ? 'finding' : 'findings'} to review`
                : statusContent.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{statusContent.detail}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={autoCheck}
            aria-label="Automatically check the structure after edits"
            onClick={() => onAutoCheckChange(!autoCheck)}
            disabled={isTidying}
            className="inline-flex min-h-[44px] items-center justify-between gap-3 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 sm:justify-start"
          >
            <span>Auto-check</span>
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 rounded-full transition-colors ${
                autoCheck ? 'bg-primary-500' : 'bg-muted-foreground/35'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  autoCheck ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCheck}
            disabled={controlsDisabled}
            aria-label="Check structure with Indigo and RDKit"
            className="gap-2 px-3 py-2 text-sm sm:px-4"
          >
            {isChecking ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
            )}
            {isChecking ? 'Checking…' : 'Check structure'}
          </Button>
          <Button
            type="button"
            onClick={onTidy}
            disabled={controlsDisabled}
            aria-label="Tidy two-dimensional structure layout"
            title="Rearranges 2D coordinates and bond spacing; does not repair chemistry"
            className="gap-2 px-3 py-2 text-sm sm:px-4"
          >
            {isTidying ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {isTidying ? 'Tidying…' : 'Tidy layout'}
          </Button>
        </div>
      </div>

      {(issues.length > 0 || actionError) && (
        <div className="border-t border-border px-4 py-4">
          {actionError && (
            <div
              role="alert"
              className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-strong"
            >
              {actionError}
            </div>
          )}

          {issues.length > 0 && (
            <div role="region" aria-labelledby="structure-findings-title">
              <h3
                id="structure-findings-title"
                className="mb-2 text-xs font-mono uppercase tracking-wider text-muted-foreground"
              >
                Findings to review
              </h3>
              <ul className="grid gap-2 md:grid-cols-2">
                {issues.map((issue) => (
                  <li
                    key={issue.id}
                    className={`min-w-0 rounded-md border p-3 ${ISSUE_STYLES[issue.severity]}`}
                  >
                    <div className="flex items-start gap-2">
                      <Info
                        className={`mt-0.5 h-4 w-4 shrink-0 ${ISSUE_LABEL_STYLES[issue.severity]}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <p className="break-words text-sm font-semibold text-foreground">
                            {issue.title}
                          </p>
                          <span
                            className={`text-[11px] font-mono uppercase tracking-wide ${ISSUE_LABEL_STYLES[issue.severity]}`}
                          >
                            {ISSUE_LABELS[issue.severity]} · {issue.source}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-border bg-muted/35 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>
          Structural checks are decision support, not proof of compound identity, safety, purity,
          or experimental validity. Tidy layout changes 2D coordinates only.
        </p>
      </div>
    </section>
  );
}
