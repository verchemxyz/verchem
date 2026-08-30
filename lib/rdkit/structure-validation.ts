/*
 * Independent RDKit-backed secondary structure validation.
 *
 * This module deliberately accepts an injected MinimalLib-shaped engine. It is
 * usable with the browser singleton and with the real Node WASM test loader,
 * without importing the client-only loading boundary.
 *
 * RDKit's public JavaScript surface does not expose structured sanitizer
 * diagnostics or a fragment-count method. A successful default `get_mol()`
 * followed by `is_valid()` is therefore the parse/sanitize gate. Advisory
 * metadata comes only from fields RDKit actually returns in `get_json()`.
 */

export interface StructureValidationMol {
  is_valid: () => boolean
  get_smiles: () => string
  get_json: () => string
  delete: () => void
}

export interface StructureValidationEngine {
  get_mol: (input: string, detailsJson?: string) => StructureValidationMol | null
}

export type StructureWarningCode =
  | 'disconnected_components'
  | 'net_formal_charge'
  | 'radical_atoms'
  | 'isotopic_atoms'
  | 'analysis_incomplete'

export interface StructureValidationWarning {
  code: StructureWarningCode
  severity: 'info'
  count: number
  message: string
}

export type StructureValidationFailureCode =
  | 'empty_input'
  | 'parse_or_sanitize_failed'

export interface InvalidStructureValidation {
  valid: false
  failureCode: StructureValidationFailureCode
  canonicalSmiles: null
  inputWasNormalized: false
  fragmentCount: 0
  atomCount: null
  netFormalCharge: null
  radicalAtomCount: null
  isotopeAtomCount: null
  analysisComplete: false
  warnings: readonly []
}

export interface ValidStructureValidation {
  valid: true
  failureCode: null
  canonicalSmiles: string
  inputWasNormalized: boolean
  fragmentCount: number
  atomCount: number | null
  netFormalCharge: number | null
  radicalAtomCount: number | null
  isotopeAtomCount: number | null
  analysisComplete: boolean
  warnings: readonly StructureValidationWarning[]
}

export type StructureValidationResult =
  | InvalidStructureValidation
  | ValidStructureValidation

interface MolJsonAtom {
  chg?: unknown
  nRad?: unknown
  isotope?: unknown
}

interface MolJsonBond {
  atoms?: unknown
}

interface MolJsonMolecule {
  atoms?: unknown
  bonds?: unknown
}

interface MolJsonDocument {
  molecules?: unknown
}

interface StructureMetadata {
  atomCount: number
  fragmentCount: number
  netFormalCharge: number
  radicalAtomCount: number
  isotopeAtomCount: number
}

const EMPTY_WARNINGS: readonly [] = Object.freeze([])

function invalidResult(
  failureCode: StructureValidationFailureCode
): InvalidStructureValidation {
  return {
    valid: false,
    failureCode,
    canonicalSmiles: null,
    inputWasNormalized: false,
    fragmentCount: 0,
    atomCount: null,
    netFormalCharge: null,
    radicalAtomCount: null,
    isotopeAtomCount: null,
    analysisComplete: false,
    warnings: EMPTY_WARNINGS,
  }
}

function finiteIntegerOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)
    ? value
    : 0
}

function parseBondAtoms(value: unknown, atomCount: number): readonly [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null
  const [left, right] = value
  if (
    typeof left !== 'number' ||
    typeof right !== 'number' ||
    !Number.isInteger(left) ||
    !Number.isInteger(right) ||
    left < 0 ||
    right < 0 ||
    left >= atomCount ||
    right >= atomCount
  ) {
    return null
  }
  return [left, right]
}

function countConnectedComponents(atomCount: number, bonds: readonly MolJsonBond[]): number | null {
  if (atomCount === 0) return 0

  const parent = Array.from({ length: atomCount }, (_, index) => index)

  const find = (start: number): number => {
    let root = start
    while (parent[root] !== root) root = parent[root]
    let current = start
    while (parent[current] !== current) {
      const next = parent[current]
      parent[current] = root
      current = next
    }
    return root
  }

  for (const bond of bonds) {
    const atoms = parseBondAtoms(bond.atoms, atomCount)
    if (!atoms) return null
    const leftRoot = find(atoms[0])
    const rightRoot = find(atoms[1])
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot
  }

  const roots = new Set<number>()
  for (let index = 0; index < atomCount; index += 1) roots.add(find(index))
  return roots.size
}

function parseStructureMetadata(json: string): StructureMetadata | null {
  let parsed: MolJsonDocument
  try {
    parsed = JSON.parse(json) as MolJsonDocument
  } catch {
    return null
  }

  if (!Array.isArray(parsed.molecules) || parsed.molecules.length !== 1) return null
  const molecule = parsed.molecules[0] as MolJsonMolecule
  if (!Array.isArray(molecule.atoms) || !Array.isArray(molecule.bonds)) return null

  const atoms = molecule.atoms as MolJsonAtom[]
  const bonds = molecule.bonds as MolJsonBond[]
  const fragmentCount = countConnectedComponents(atoms.length, bonds)
  if (fragmentCount === null) return null

  let netFormalCharge = 0
  let radicalAtomCount = 0
  let isotopeAtomCount = 0

  for (const atom of atoms) {
    const charge = finiteIntegerOrZero(atom.chg)
    const radicalElectrons = finiteIntegerOrZero(atom.nRad)
    const isotope = finiteIntegerOrZero(atom.isotope)
    netFormalCharge += charge
    if (radicalElectrons > 0) radicalAtomCount += 1
    if (isotope > 0) isotopeAtomCount += 1
  }

  return {
    atomCount: atoms.length,
    fragmentCount,
    netFormalCharge,
    radicalAtomCount,
    isotopeAtomCount,
  }
}

function canonicalFragmentCount(canonicalSmiles: string): number {
  return canonicalSmiles.length === 0 ? 0 : canonicalSmiles.split('.').length
}

/**
 * SMILES can be safely trimmed, but MOL V2000/V3000 is line-positioned: an
 * intentionally blank title line is still part of its three-line header.
 * Trimming that leading newline shifts the counts line and makes RDKit reject
 * an otherwise valid Ketcher export.
 */
function normalizeStructureInput(input: string): string {
  const withoutByteOrderMark = input.startsWith('\uFEFF') ? input.slice(1) : input
  const trimmed = withoutByteOrderMark.trim()
  if (trimmed.length === 0) return ''

  return /\bV(?:2000|3000)\b/.test(withoutByteOrderMark)
    ? withoutByteOrderMark
    : trimmed
}

function normalizedWarnings(
  metadata: StructureMetadata | null,
  fallbackFragmentCount: number
): readonly StructureValidationWarning[] {
  const warnings: StructureValidationWarning[] = []
  const fragmentCount = metadata?.fragmentCount ?? fallbackFragmentCount

  if (fragmentCount > 1) {
    warnings.push({
      code: 'disconnected_components',
      severity: 'info',
      count: fragmentCount,
      message: `Structure contains ${fragmentCount} disconnected components. This can be valid for salts, solvates, or mixtures; confirm the intended composition.`,
    })
  }

  if (metadata && metadata.netFormalCharge !== 0) {
    const signedCharge = metadata.netFormalCharge > 0
      ? `+${metadata.netFormalCharge}`
      : String(metadata.netFormalCharge)
    warnings.push({
      code: 'net_formal_charge',
      severity: 'info',
      count: Math.abs(metadata.netFormalCharge),
      message: `Structure has net formal charge ${signedCharge}. Charged structures can be valid; confirm the intended ionization state.`,
    })
  }

  if (metadata && metadata.radicalAtomCount > 0) {
    warnings.push({
      code: 'radical_atoms',
      severity: 'info',
      count: metadata.radicalAtomCount,
      message: `Structure contains ${metadata.radicalAtomCount} atom(s) with unpaired electrons. Radicals can be valid; confirm the intended electronic state.`,
    })
  }

  if (metadata && metadata.isotopeAtomCount > 0) {
    warnings.push({
      code: 'isotopic_atoms',
      severity: 'info',
      count: metadata.isotopeAtomCount,
      message: `Structure contains ${metadata.isotopeAtomCount} isotopically specified atom(s). Isotopic labels can be valid; confirm they are intentional.`,
    })
  }

  if (!metadata) {
    warnings.push({
      code: 'analysis_incomplete',
      severity: 'info',
      count: 1,
      message: 'RDKit parsed and sanitized the structure, but detailed atom metadata was unavailable.',
    })
  }

  return warnings
}

/**
 * Parse and sanitize a structure with RDKit, then derive conservative
 * secondary metadata. Advisory warnings never convert valid salts, ions,
 * radicals, or isotopically labelled structures into invalid results.
 *
 * The returned molecule is never exposed and is deleted in `finally` on every
 * path after allocation.
 */
export function validateStructureWithRDKit(
  rdkit: StructureValidationEngine,
  input: string
): StructureValidationResult {
  const normalizedInput = normalizeStructureInput(input)
  if (normalizedInput.length === 0) return invalidResult('empty_input')

  let mol: StructureValidationMol | null = null
  try {
    // MinimalLib's default get_mol path parses and sanitizes the input.
    mol = rdkit.get_mol(normalizedInput)
    if (!mol || !mol.is_valid()) return invalidResult('parse_or_sanitize_failed')

    const canonicalSmiles = mol.get_smiles()
    if (typeof canonicalSmiles !== 'string' || canonicalSmiles.length === 0) {
      return invalidResult('parse_or_sanitize_failed')
    }

    let metadata: StructureMetadata | null = null
    try {
      metadata = parseStructureMetadata(mol.get_json())
    } catch {
      metadata = null
    }

    const fallbackFragmentCount = canonicalFragmentCount(canonicalSmiles)
    return {
      valid: true,
      failureCode: null,
      canonicalSmiles,
      inputWasNormalized: canonicalSmiles !== normalizedInput,
      fragmentCount: metadata?.fragmentCount ?? fallbackFragmentCount,
      atomCount: metadata?.atomCount ?? null,
      netFormalCharge: metadata?.netFormalCharge ?? null,
      radicalAtomCount: metadata?.radicalAtomCount ?? null,
      isotopeAtomCount: metadata?.isotopeAtomCount ?? null,
      analysisComplete: metadata !== null,
      warnings: normalizedWarnings(metadata, fallbackFragmentCount),
    }
  } catch {
    return invalidResult('parse_or_sanitize_failed')
  } finally {
    mol?.delete()
  }
}

/**
 * Try equivalent serializations of the same editor structure in priority
 * order. Cheminformatics engines can legitimately support one interchange
 * format better than another (especially salts, queries, and V3000 features),
 * so a single parse failure must not become a false-positive warning.
 */
export function validateStructureCandidatesWithRDKit(
  rdkit: StructureValidationEngine,
  inputs: readonly string[]
): StructureValidationResult {
  const candidates = [...new Set(inputs.map(normalizeStructureInput).filter(Boolean))]
  if (candidates.length === 0) return invalidResult('empty_input')

  let firstFailure: StructureValidationResult | null = null
  for (const candidate of candidates) {
    const result = validateStructureWithRDKit(rdkit, candidate)
    if (result.valid) return result
    firstFailure ??= result
  }

  return firstFailure ?? invalidResult('parse_or_sanitize_failed')
}
