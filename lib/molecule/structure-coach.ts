import type { StructureCheckReport } from './structure-check';
import type {
  StructureValidationResult,
  StructureWarningCode,
} from '@/lib/rdkit/structure-validation';

export type StructureCoachStatus =
  | 'empty'
  | 'dirty'
  | 'checking'
  | 'clear'
  | 'flagged'
  | 'unavailable';

export type StructureCoachSeverity = 'error' | 'warning' | 'info';

export interface StructureCoachIssue {
  id: string;
  severity: StructureCoachSeverity;
  title: string;
  message: string;
  source: 'Indigo' | 'RDKit';
}

export interface RDKitStructureCheckOutcome {
  result: StructureValidationResult | null;
  error: string | null;
}

export interface StructureCoachAnalysis {
  status: Extract<StructureCoachStatus, 'clear' | 'flagged' | 'unavailable'>;
  issues: readonly StructureCoachIssue[];
  actionError: string | null;
  hasBlockingFindings: boolean;
}

const RDKIT_WARNING_TITLES: Readonly<Record<StructureWarningCode, string>> = {
  disconnected_components: 'Disconnected components',
  net_formal_charge: 'Net formal charge',
  radical_atoms: 'Radical atoms',
  isotopic_atoms: 'Isotopic labels',
  analysis_incomplete: 'Detailed analysis incomplete',
};

function safeEngineError(engine: 'Indigo' | 'RDKit'): string {
  return `${engine} could not complete its structural check. The other engine's findings are still shown.`;
}

/**
 * Merge independent Indigo and RDKit reports without upgrading advisories into
 * claims that a structure is chemically "correct". Engine failures remain
 * visible, and only a double engine failure produces an unavailable state.
 */
export function combineStructureCoachAnalysis(
  indigo: StructureCheckReport,
  rdkit: RDKitStructureCheckOutcome
): StructureCoachAnalysis {
  const issues: StructureCoachIssue[] = [];
  const indigoUnavailable = indigo.status === 'error';
  const rdkitUnavailable = rdkit.result === null;

  for (const issue of indigo.issues) {
    issues.push({
      id: `indigo:${issue.type}:${issue.message}`,
      severity: issue.severity,
      title: issue.label,
      message: issue.message,
      source: 'Indigo',
    });
  }

  for (const diagnostic of indigo.diagnostics) {
    issues.push({
      id: `indigo:${diagnostic.type}:${diagnostic.message}`,
      severity: diagnostic.severity,
      title: diagnostic.label,
      message: diagnostic.message,
      source: 'Indigo',
    });
  }

  if (indigoUnavailable && !rdkitUnavailable) {
    issues.push({
      id: 'indigo:unavailable',
      severity: 'info',
      title: 'Indigo check unavailable',
      message: safeEngineError('Indigo'),
      source: 'Indigo',
    });
  }

  if (rdkit.result) {
    if (!rdkit.result.valid) {
      if (rdkit.result.failureCode !== 'empty_input') {
        issues.push({
          id: `rdkit:${rdkit.result.failureCode}`,
          severity: 'warning',
          title: 'Independent parse and sanitize check',
          message:
            'RDKit could not parse and sanitize this drawing. Review atom valence, bond orders, charges, and unsupported query features.',
          source: 'RDKit',
        });
      }
    } else {
      for (const warning of rdkit.result.warnings) {
        issues.push({
          id: `rdkit:${warning.code}`,
          severity: warning.severity,
          title: RDKIT_WARNING_TITLES[warning.code],
          message: warning.message,
          source: 'RDKit',
        });
      }
    }
  } else if (!indigoUnavailable) {
    issues.push({
      id: 'rdkit:unavailable',
      severity: 'info',
      title: 'RDKit check unavailable',
      message: safeEngineError('RDKit'),
      source: 'RDKit',
    });
  }

  if (indigoUnavailable && rdkitUnavailable) {
    return {
      status: 'unavailable',
      issues: [],
      actionError:
        'Neither structural engine could complete the check. The drawing was not changed; review it manually and try again.',
      hasBlockingFindings: false,
    };
  }

  return {
    status: issues.length > 0 ? 'flagged' : 'clear',
    issues,
    actionError: null,
    hasBlockingFindings: issues.some((issue) => issue.severity === 'error'),
  };
}
