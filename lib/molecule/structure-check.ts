import type {
  CheckTypes,
  StructService,
  StructServiceOptions,
} from 'ketcher-core';

/**
 * Ketcher 3.17.2 structure-check types, kept in the same order as its
 * Structure Check dialog. The tuple also gives consumers a deterministic
 * display and request order.
 */
export const STRUCTURE_CHECK_TYPES = [
  'valence',
  'radicals',
  'pseudoatoms',
  'stereo',
  'query',
  'overlapping_atoms',
  'overlapping_bonds',
  'rgroups',
  'chiral',
  '3d',
  'chiral_flag',
] as const satisfies readonly CheckTypes[];

export type StructureCheckType = (typeof STRUCTURE_CHECK_TYPES)[number];
export type StructureCheckSeverity = 'error' | 'warning' | 'info';
export type StructureCheckStatus = 'empty' | 'clear' | 'issues' | 'error';

export interface StructureCheckTypeMetadata {
  label: string;
  severity: Exclude<StructureCheckSeverity, 'info'>;
}

/**
 * Conservative policy for coaching: chemically invalid or ambiguous
 * structure/stereochemistry is blocking, while supported special features
 * remain visible as non-blocking warnings.
 */
export const STRUCTURE_CHECK_METADATA = {
  valence: { label: 'Valence', severity: 'error' },
  radicals: { label: 'Radical', severity: 'warning' },
  pseudoatoms: { label: 'Pseudoatom', severity: 'warning' },
  stereo: { label: 'Stereochemistry', severity: 'error' },
  query: { label: 'Query', severity: 'warning' },
  overlapping_atoms: { label: 'Overlapping Atoms', severity: 'error' },
  overlapping_bonds: { label: 'Overlapping Bonds', severity: 'error' },
  rgroups: { label: 'R-Groups', severity: 'warning' },
  // Indigo's `chiral` finding reports the presence of chirality; it does not
  // mean the stereochemistry is invalid. Invalid stereo remains covered by
  // the blocking `stereo` check above.
  chiral: { label: 'Chirality', severity: 'warning' },
  '3d': { label: '3D Structure', severity: 'warning' },
  chiral_flag: { label: 'Chiral Flag', severity: 'warning' },
} as const satisfies Readonly<Record<CheckTypes, StructureCheckTypeMetadata>>;

export interface StructureCheckIssue {
  type: StructureCheckType;
  label: string;
  severity: Exclude<StructureCheckSeverity, 'info'>;
  message: string;
}

/**
 * Indigo may add diagnostic keys before Ketcher's public CheckTypes union is
 * updated. Preserve those entries without treating them as blocking errors.
 */
export interface StructureCheckDiagnostic {
  type: string;
  label: string;
  severity: 'warning' | 'info';
  message: string;
}

export interface StructureCheckSummary {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
}

export interface StructureCheckReport {
  status: StructureCheckStatus;
  checkedTypes: readonly StructureCheckType[];
  issues: readonly StructureCheckIssue[];
  diagnostics: readonly StructureCheckDiagnostic[];
  summary: StructureCheckSummary;
  hasBlockingErrors: boolean;
  error: string | null;
}

export type StructureCheckClient = Pick<StructService, 'check'>;

export interface StructureCheckRunOptions {
  types?: readonly StructureCheckType[];
  serviceOptions?: StructServiceOptions;
}

const EMPTY_SUMMARY: StructureCheckSummary = {
  errorCount: 0,
  warningCount: 0,
  infoCount: 0,
  totalCount: 0,
};

const CHECK_TYPE_ALIASES: Readonly<Record<string, StructureCheckType>> = {
  overlap_atom: 'overlapping_atoms',
  overlap_atoms: 'overlapping_atoms',
  overlapping_atom: 'overlapping_atoms',
  overlap_bond: 'overlapping_bonds',
  overlap_bonds: 'overlapping_bonds',
  overlapping_bond: 'overlapping_bonds',
  pseudoatom: 'pseudoatoms',
  radical: 'radicals',
  r_group: 'rgroups',
  r_groups: 'rgroups',
  rgroup: 'rgroups',
};

function normalizeRequestedTypes(
  types: readonly StructureCheckType[]
): readonly StructureCheckType[] {
  const requested = new Set<StructureCheckType>(types);
  return STRUCTURE_CHECK_TYPES.filter((type) => requested.has(type));
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z\d]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function normalizeMessage(message: string): string {
  return message.trim().replace(/\s+/g, ' ');
}

function isStructureCheckType(value: string): value is StructureCheckType {
  return STRUCTURE_CHECK_TYPES.some((type) => type === value);
}

function canonicalCheckType(key: string): StructureCheckType | null {
  const normalized = normalizeKey(key);
  if (isStructureCheckType(normalized)) return normalized;
  return CHECK_TYPE_ALIASES[normalized] ?? null;
}

function humanizeCheckKey(key: string): string {
  const normalized = normalizeKey(key);
  if (!normalized) return 'Structure Diagnostic';

  return normalized
    .split('_')
    .map((word) => {
      if (word === '3d') return '3D';
      if (word === 'r') return 'R';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function isStringRecord(value: unknown): value is Readonly<Record<string, string>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === 'string');
}

function createEmptyReport(
  status: Extract<StructureCheckStatus, 'empty' | 'clear'>,
  checkedTypes: readonly StructureCheckType[]
): StructureCheckReport {
  return {
    status,
    checkedTypes,
    issues: [],
    diagnostics: [],
    summary: { ...EMPTY_SUMMARY },
    hasBlockingErrors: false,
    error: null,
  };
}

export function normalizeStructureCheckError(
  error: unknown,
  checkedTypes: readonly StructureCheckType[] = STRUCTURE_CHECK_TYPES
): StructureCheckReport {
  const normalizedTypes = normalizeRequestedTypes(checkedTypes);
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const message = normalizeMessage(rawMessage) || 'Structure check failed.';

  return {
    status: 'error',
    checkedTypes: normalizedTypes,
    issues: [],
    diagnostics: [],
    summary: { ...EMPTY_SUMMARY },
    hasBlockingErrors: false,
    error: message,
  };
}

/**
 * Converts Ketcher/Indigo's string map into stable, presentation-ready data.
 * Blank messages are omitted, aliases are canonicalized, and identical
 * type/message pairs are emitted once regardless of raw object order.
 */
export function normalizeStructureCheckResult(
  result: unknown,
  checkedTypes: readonly StructureCheckType[] = STRUCTURE_CHECK_TYPES
): StructureCheckReport {
  const normalizedTypes = normalizeRequestedTypes(checkedTypes);
  if (!isStringRecord(result)) {
    return normalizeStructureCheckError(
      'Structure check returned an invalid result.',
      normalizedTypes
    );
  }

  const issues: StructureCheckIssue[] = [];
  const diagnostics: StructureCheckDiagnostic[] = [];
  const seen = new Set<string>();

  for (const [rawType, rawMessage] of Object.entries(result)) {
    const message = normalizeMessage(rawMessage);
    if (!message) continue;

    const type = canonicalCheckType(rawType);
    const normalizedRawType = normalizeKey(rawType) || 'unknown';
    const identity = `${type ?? normalizedRawType}\u0000${message}`;
    if (seen.has(identity)) continue;
    seen.add(identity);

    if (type) {
      const metadata = STRUCTURE_CHECK_METADATA[type];
      issues.push({
        type,
        label: metadata.label,
        severity: metadata.severity,
        message,
      });
      continue;
    }

    diagnostics.push({
      type: normalizedRawType,
      label: humanizeCheckKey(rawType),
      severity: 'warning',
      message,
    });
  }

  const typeOrder = new Map<StructureCheckType, number>(
    STRUCTURE_CHECK_TYPES.map((type, index) => [type, index])
  );
  issues.sort((left, right) => {
    const typeDifference =
      (typeOrder.get(left.type) ?? Number.MAX_SAFE_INTEGER) -
      (typeOrder.get(right.type) ?? Number.MAX_SAFE_INTEGER);
    return typeDifference || left.message.localeCompare(right.message, 'en');
  });
  diagnostics.sort(
    (left, right) =>
      left.type.localeCompare(right.type, 'en') ||
      left.message.localeCompare(right.message, 'en')
  );

  if (issues.length === 0 && diagnostics.length === 0) {
    return createEmptyReport('clear', normalizedTypes);
  }

  const combined = [...issues, ...diagnostics];
  const summary: StructureCheckSummary = {
    errorCount: combined.filter((item) => item.severity === 'error').length,
    warningCount: combined.filter((item) => item.severity === 'warning').length,
    infoCount: combined.filter((item) => item.severity === 'info').length,
    totalCount: combined.length,
  };

  return {
    status: 'issues',
    checkedTypes: normalizedTypes,
    issues,
    diagnostics,
    summary,
    hasBlockingErrors: summary.errorCount > 0,
    error: null,
  };
}

/**
 * Runs Indigo through Ketcher's StructService. Callers should supply KET from
 * `await ketcher.getKet()` so the check preserves editor-specific structure
 * data such as queries, R-groups, and stereochemistry.
 */
export async function runKetcherStructureCheck(
  client: StructureCheckClient,
  struct: string,
  options: StructureCheckRunOptions = {}
): Promise<StructureCheckReport> {
  const checkedTypes = normalizeRequestedTypes(
    options.types ?? STRUCTURE_CHECK_TYPES
  );
  const normalizedStruct = struct.trim();

  if (!normalizedStruct || checkedTypes.length === 0) {
    return createEmptyReport('empty', checkedTypes);
  }

  try {
    const result = await client.check(
      {
        struct: normalizedStruct,
        types: [...checkedTypes],
      },
      options.serviceOptions
    );
    return normalizeStructureCheckResult(result, checkedTypes);
  } catch (error: unknown) {
    return normalizeStructureCheckError(error, checkedTypes);
  }
}
