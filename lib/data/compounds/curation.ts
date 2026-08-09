import { getSafetyDataStatus, type Compound } from './types'
import { calculateMolarMass, parseFormula } from './utils'

type OptionalScalarField =
  | 'nameThai'
  | 'iupacName'
  | 'subcategory'
  | 'meltingPoint'
  | 'boilingPoint'
  | 'density'
  | 'solubility'
  | 'appearance'
  | 'odor'
  | 'pKa'
  | 'pKb'

interface MergeResolution {
  case: 'A'
  canonicalGroup: string
  overrides?: Partial<Pick<Compound, 'name' | 'formula' | 'category' | 'physicalState' | OptionalScalarField>>
}

interface SplitResolution {
  case: 'B'
  reason: string
}

type CollisionResolution = MergeResolution | SplitResolution

/**
 * Human-reviewed resolution for every collision present in the 2026-08-09
 * audit. The canonical group is explicit so array order can never decide
 * which scientific identity wins.
 */
export const COMPOUND_COLLISION_RESOLUTIONS = {
  'lactic-acid': { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'carboxylic-acid' } },
  'peracetic-acid': {
    case: 'A',
    canonicalGroup: 'cleaning',
    overrides: { formula: 'C2H4O3', category: 'acid', boilingPoint: undefined, density: undefined },
  },
  'sodium-carbonate': { case: 'A', canonicalGroup: 'salts' },
  'potassium-chloride': { case: 'A', canonicalGroup: 'fertilizers', overrides: { name: 'Potassium Chloride', category: 'salt' } },
  'sodium-nitrate': { case: 'A', canonicalGroup: 'fertilizers', overrides: { category: 'salt', boilingPoint: undefined } },
  'potassium-nitrate': { case: 'A', canonicalGroup: 'fertilizers', overrides: { name: 'Potassium Nitrate', category: 'salt', boilingPoint: undefined } },
  'ammonium-nitrate': { case: 'A', canonicalGroup: 'fertilizers', overrides: { category: 'salt', boilingPoint: undefined } },
  'sodium-nitrite': { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'salt' } },
  'potassium-sulfate': { case: 'A', canonicalGroup: 'fertilizers', overrides: { name: 'Potassium Sulfate', category: 'salt' } },
  'ammonium-sulfate': { case: 'A', canonicalGroup: 'fertilizers', overrides: { category: 'salt' } },
  'sodium-benzoate': { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'salt' } },
  'potassium-alum': {
    case: 'B',
    reason: 'CAS 10043-67-1 is anhydrous KAl(SO4)2; CAS 7784-24-9 is the dodecahydrate.',
  },
  'carbon-monoxide': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'oxide' } },
  'carbon-dioxide': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'oxide' } },
  'sulfur-dioxide': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'oxide' } },
  'sulfur-trioxide': {
    case: 'A',
    canonicalGroup: 'gases',
    overrides: {
      category: 'oxide',
      physicalState: 'liquid',
      boilingPoint: 44.45,
      density: 1.92,
      appearance: 'Colorless liquid or white crystalline solid',
    },
  },
  'nitric-oxide': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'oxide' } },
  'nitrogen-dioxide': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'oxide' } },
  'nitrous-oxide': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'oxide' } },
  methane: { case: 'A', canonicalGroup: 'gases', overrides: { formula: 'CH4', category: 'hydrocarbon' } },
  ethane: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'hydrocarbon' } },
  propane: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'hydrocarbon' } },
  butane: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'hydrocarbon' } },
  pentane: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'hydrocarbon', subcategory: 'alkane' } },
  hexane: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'hydrocarbon', subcategory: 'alkane' } },
  heptane: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'hydrocarbon', subcategory: 'alkane' } },
  cyclohexane: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'hydrocarbon', subcategory: 'cycloalkane' } },
  isoprene: { case: 'A', canonicalGroup: 'petrochemicals' },
  'tert-butanol': { case: 'A', canonicalGroup: 'solvents', overrides: { formula: 'C4H10O', category: 'alcohol', subcategory: 'tertiary-alcohol' } },
  'ethylene-glycol': { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'alcohol', subcategory: 'diol' } },
  'propionic-acid': { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'carboxylic-acid' } },
  'oleic-acid': { case: 'A', canonicalGroup: 'lubricants', overrides: { category: 'carboxylic-acid', subcategory: 'fatty-acid' } },
  'tartaric-acid': { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'carboxylic-acid' } },
  benzaldehyde: { case: 'A', canonicalGroup: 'flavorsFragrances', overrides: { category: 'aldehyde' } },
  acetone: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'ketone' } },
  camphor: { case: 'A', canonicalGroup: 'flavorsFragrances', overrides: { category: 'ketone' } },
  'ethyl-formate': { case: 'A', canonicalGroup: 'flavorsFragrances', overrides: { category: 'ester' } },
  'methyl-acetate': { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'ester' } },
  'ethyl-acetate': { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'ester' } },
  'butyl-acetate': { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'ester' } },
  'isoamyl-acetate': { case: 'A', canonicalGroup: 'flavorsFragrances', overrides: { category: 'ester' } },
  'ethyl-butyrate': { case: 'A', canonicalGroup: 'flavorsFragrances', overrides: { category: 'ester' } },
  'methyl-methacrylate': { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'ester' } },
  aniline: { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'amine' } },
  hexamethylenediamine: { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'amine' } },
  toluene: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'aromatic' } },
  ethylbenzene: { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'aromatic' } },
  styrene: { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'aromatic' } },
  cumene: { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'aromatic' } },
  alanine: { case: 'A', canonicalGroup: 'aminoAcids' },
  arginine: { case: 'A', canonicalGroup: 'aminoAcids' },
  asparagine: { case: 'A', canonicalGroup: 'aminoAcids' },
  'aspartic-acid': { case: 'A', canonicalGroup: 'aminoAcids' },
  cysteine: { case: 'A', canonicalGroup: 'aminoAcids' },
  'glutamic-acid': { case: 'A', canonicalGroup: 'aminoAcids' },
  glutamine: { case: 'A', canonicalGroup: 'aminoAcids' },
  glycine: { case: 'A', canonicalGroup: 'aminoAcids' },
  histidine: { case: 'A', canonicalGroup: 'aminoAcids' },
  isoleucine: { case: 'A', canonicalGroup: 'aminoAcids' },
  leucine: { case: 'A', canonicalGroup: 'aminoAcids' },
  lysine: { case: 'A', canonicalGroup: 'aminoAcids' },
  methionine: { case: 'A', canonicalGroup: 'aminoAcids' },
  phenylalanine: { case: 'A', canonicalGroup: 'aminoAcids' },
  proline: { case: 'A', canonicalGroup: 'aminoAcids' },
  serine: { case: 'A', canonicalGroup: 'aminoAcids' },
  threonine: { case: 'A', canonicalGroup: 'aminoAcids' },
  tryptophan: { case: 'A', canonicalGroup: 'aminoAcids' },
  tyrosine: { case: 'A', canonicalGroup: 'aminoAcids' },
  valine: { case: 'A', canonicalGroup: 'aminoAcids' },
  glucose: { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'sugar' } },
  fructose: { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'sugar' } },
  sucrose: { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'sugar' } },
  ozone: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'other' } },
  'hydrogen-sulfide': { case: 'A', canonicalGroup: 'gases' },
  'sulfur-hexafluoride': { case: 'A', canonicalGroup: 'gases', overrides: { category: 'other' } },
  'carbon-tetrachloride': { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'halogenated-hydrocarbon' } },
  chloroform: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'halogenated-hydrocarbon' } },
  perchloroethylene: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'halogenated-hydrocarbon' } },
  acetonitrile: { case: 'A', canonicalGroup: 'solvents', overrides: { formula: 'C2H3N', category: 'nitrile' } },
  acrylonitrile: { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'nitrile' } },
  'vinyl-chloride': { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'halogenated-hydrocarbon' } },
  'vinyl-acetate': { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'ester' } },
  'propylene-oxide': { case: 'A', canonicalGroup: 'petrochemicals', overrides: { category: 'ether' } },
  'diethyl-ether': { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'ether' } },
  phosphine: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'other' } },
  silane: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'other' } },
  diborane: { case: 'A', canonicalGroup: 'gases', overrides: { category: 'other' } },
  'calcium-carbide': { case: 'A', canonicalGroup: 'ceramics', overrides: { category: 'other' } },
  'ammonium-perchlorate': { case: 'A', canonicalGroup: 'explosivesPyrotechnics', overrides: { category: 'salt' } },
  'sodium-chlorite': { case: 'A', canonicalGroup: 'textileChemicals', overrides: { category: 'salt' } },
  'sodium-metabisulfite': { case: 'A', canonicalGroup: 'foodAdditives', overrides: { category: 'salt' } },
  metformin: { case: 'A', canonicalGroup: 'pharmaExtended' },
  atorvastatin: { case: 'A', canonicalGroup: 'pharmaExtended' },
  omeprazole: { case: 'A', canonicalGroup: 'pharmaExtended' },
  lorazepam: { case: 'A', canonicalGroup: 'pharmaExtended' },
  sertraline: { case: 'A', canonicalGroup: 'pharmaExtended' },
  metoprolol: { case: 'A', canonicalGroup: 'pharmaExtended' },
  salbutamol: { case: 'A', canonicalGroup: 'pharmaExtended' },
  phenolphthalein: { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { category: 'reagent' } },
  'methyl-orange': { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { category: 'dye' } },
  'methyl-red': { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { category: 'dye' } },
  'congo-red': { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { category: 'dye' } },
  'crystal-violet': { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { category: 'dye' } },
  ethylene: { case: 'A', canonicalGroup: 'gases', overrides: { subcategory: 'olefin' } },
  propylene: { case: 'A', canonicalGroup: 'gases', overrides: { subcategory: 'olefin' } },
  mtbe: { case: 'A', canonicalGroup: 'solvents', overrides: { category: 'ether', subcategory: 'fuel-ether' } },
  dolomite: { case: 'A', canonicalGroup: 'minerals', overrides: { subcategory: 'carbonate-mineral', meltingPoint: undefined } },
  tocopherol: {
    case: 'B',
    reason: 'NIST identifies CAS 59-02-9 as vitamin E and CAS 10191-41-0 as dl-alpha-tocopherol.',
  },
  'sodium-lauryl-sulfate': { case: 'A', canonicalGroup: 'surfactants', overrides: { category: 'surfactant', subcategory: 'anionic-surfactant' } },
  'sodium-laureth-sulfate': { case: 'A', canonicalGroup: 'surfactants', overrides: { name: 'Sodium Laureth Sulfate (SLES)', category: 'surfactant', subcategory: 'anionic-surfactant' } },
  // NIST SRD 69 represents CAS 137-16-6 with one water of hydration.
  'sodium-lauryl-sarcosinate': {
    case: 'A',
    canonicalGroup: 'surfactants',
    overrides: {
      name: 'Sodium Lauroyl Sarcosinate Monohydrate',
      formula: 'C15H28NNaO3·H2O',
      category: 'surfactant',
    },
  },
  'decyl-glucoside': { case: 'A', canonicalGroup: 'surfactants', overrides: { category: 'surfactant' } },
  'cocamidopropyl-betaine': { case: 'A', canonicalGroup: 'surfactants', overrides: { name: 'Cocamidopropyl Betaine (CAPB)', category: 'surfactant' } },
  'sodium-cocoyl-isethionate': { case: 'A', canonicalGroup: 'surfactants', overrides: { category: 'surfactant' } },
  carmine: { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { category: 'dye' } },
  'iron-oxide-red': { case: 'A', canonicalGroup: 'dyesAndPigments' },
  'iron-oxide-yellow': { case: 'A', canonicalGroup: 'dyesAndPigments', overrides: { formula: 'FeOOH' } },
  'iron-oxide-black': { case: 'A', canonicalGroup: 'dyesAndPigments' },
  'nylon-6': { case: 'A', canonicalGroup: 'polymers', overrides: { name: 'Nylon 6 (PA6)' } },
  'nylon-66': { case: 'A', canonicalGroup: 'polymers', overrides: { name: 'Nylon 6,6 (PA66)' } },
} as const satisfies Record<string, CollisionResolution>

const collisionResolutions: Readonly<Record<string, CollisionResolution>> = COMPOUND_COLLISION_RESOLUTIONS
const THREE_RECORD_COLLISIONS = new Set([
  'sodium-nitrate',
  'potassium-nitrate',
  'ethylbenzene',
  'carbon-tetrachloride',
])

interface IdentitySplit {
  sourceId: string
  casNumber: string
  replacement: Partial<Compound> & Pick<Compound, 'id' | 'name'>
}

const IDENTITY_SPLITS: readonly IdentitySplit[] = [
  {
    sourceId: 'potassium-alum',
    casNumber: '10043-67-1',
    replacement: {
      id: 'potassium-aluminum-sulfate-anhydrous',
      name: 'Potassium Aluminum Sulfate (Anhydrous)',
      nameThai: 'โพแทสเซียมอะลูมิเนียมซัลเฟตแอนไฮดรัส',
      subcategory: 'anhydrous-double-salt',
    },
  },
  {
    sourceId: 'potassium-alum',
    casNumber: '7784-24-9',
    replacement: {
      id: 'potassium-alum',
      name: 'Potassium Alum Dodecahydrate',
      subcategory: 'hydrated-double-salt',
    },
  },
  {
    sourceId: 'tocopherol',
    casNumber: '10191-41-0',
    replacement: {
      id: 'dl-alpha-tocopherol',
      name: 'dl-Alpha-Tocopherol (Vitamin E)',
      nameThai: 'ดีแอล-แอลฟา-โทโคฟีรอล',
      category: 'vitamin',
      subcategory: 'synthetic-vitamin-e',
      uses: ['E307', 'Vitamin E fortification', 'Antioxidant', 'Cosmetics'],
    },
  },
  {
    sourceId: 'tocopherol',
    casNumber: '59-02-9',
    replacement: {
      id: 'tocopherol',
      name: 'Alpha-Tocopherol (Vitamin E)',
      category: 'vitamin',
      subcategory: 'natural-vitamin-e',
    },
  },
]

interface SourcedCompound {
  group: string
  compound: Compound
}

function normalizedCasNumbers(compound: Compound): string[] {
  return [...new Set([compound.casNumber, compound.cas].filter((value): value is string => Boolean(value)))]
}

function compositionsEqual(leftFormula: string, rightFormula: string): boolean {
  const left = parseFormula(leftFormula)
  const right = parseFormula(rightFormula)
  if (!left || !right) return leftFormula === rightFormula

  const elements = new Set([...Object.keys(left), ...Object.keys(right)])
  return [...elements].every(element => Math.abs((left[element] ?? 0) - (right[element] ?? 0)) < 1e-9)
}

function normalizeUse(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || /^(?:pH|mTOR|n-|dl-|all-rac-)/.test(trimmed)) return trimmed
  return `${trimmed[0]?.toUpperCase() ?? ''}${trimmed.slice(1)}`
}

function unionStrings(values: ReadonlyArray<readonly string[] | undefined>, normalize = (value: string) => value.trim()): string[] | undefined {
  const byLowerCase = new Map<string, string>()
  for (const list of values) {
    for (const rawValue of list ?? []) {
      const value = normalize(rawValue)
      if (value) byLowerCase.set(value.toLocaleLowerCase('en'), value)
    }
  }
  return byLowerCase.size > 0 ? [...byLowerCase.values()] : undefined
}

/**
 * UNECE GHS physical-hazard statements whose class is tied to a material
 * state. A conflicting code is omitted instead of guessed or copied across a
 * duplicate identity. Exact replacement classifications require reviewed,
 * substance-specific evidence.
 */
const HAZARD_CODE_STATE: Readonly<Record<string, Compound['physicalState']>> = {
  H220: 'gas',
  H221: 'gas',
  H224: 'liquid',
  H225: 'liquid',
  H226: 'liquid',
  H228: 'solid',
  H230: 'gas',
  H231: 'gas',
  H280: 'gas',
  H281: 'gas',
}

function hazardAppliesToState(
  hazard: NonNullable<Compound['hazards']>[number],
  physicalState: Compound['physicalState']
): boolean {
  const text = typeof hazard === 'string'
    ? hazard
    : `${hazard.type ?? ''} ${hazard.ghsCode ?? ''}`
  const codes = text.match(/\bH\d{3}\b/g) ?? []
  return codes.every(code => HAZARD_CODE_STATE[code] === undefined || HAZARD_CODE_STATE[code] === physicalState)
}

function mergeApplicableHazards(
  records: readonly Compound[],
  physicalState: Compound['physicalState']
): Compound['hazards'] {
  type Hazard = NonNullable<Compound['hazards']>[number]
  const hazards = new Map<string, Hazard>()

  for (const record of records) {
    for (const hazard of record.hazards ?? []) {
      if (!hazardAppliesToState(hazard, physicalState)) continue
      const key = typeof hazard === 'string'
        ? `string:${hazard.trim().toLocaleLowerCase('en')}`
        : `object:${hazard.type ?? ''}:${hazard.ghsCode ?? ''}:${hazard.severity ?? ''}`
      hazards.set(key, hazard)
    }
  }

  return hazards.size > 0 ? [...hazards.values()] : undefined
}

function mergeApplicablePictograms(
  records: readonly Compound[],
  physicalState: Compound['physicalState']
): string[] | undefined {
  const merged = unionStrings(records.map(record => record.ghs))
  // GHS04 is specifically the gas-cylinder pictogram. Other pictograms (for
  // example the flame) can legitimately apply across several physical states.
  const applicable = merged?.filter(code => code !== 'GHS04' || physicalState === 'gas')
  return applicable && applicable.length > 0 ? applicable : undefined
}

function applyIdentitySplits(records: readonly SourcedCompound[]): SourcedCompound[] {
  const matched = new Map(IDENTITY_SPLITS.map(split => [`${split.sourceId}|${split.casNumber}`, 0]))

  const splitRecords = records.map(source => {
    const casNumbers = normalizedCasNumbers(source.compound)
    const split = IDENTITY_SPLITS.find(candidate =>
      candidate.sourceId === source.compound.id && casNumbers.includes(candidate.casNumber)
    )
    if (!split) return source

    const key = `${split.sourceId}|${split.casNumber}`
    matched.set(key, (matched.get(key) ?? 0) + 1)
    return { group: source.group, compound: { ...source.compound, ...split.replacement } }
  })

  for (const [key, count] of matched) {
    if (count !== 1) throw new Error(`Compound identity split ${key} matched ${count} records; expected exactly one.`)
  }
  return splitRecords
}

function mergeCollision(id: string, records: readonly SourcedCompound[], resolution: MergeResolution): SourcedCompound {
  const primary = records.find(record => record.group === resolution.canonicalGroup)
  if (!primary) throw new Error(`Canonical group ${resolution.canonicalGroup} is missing for duplicate ${id}.`)

  const casNumbers = new Set(records.flatMap(record => normalizedCasNumbers(record.compound)))
  if (casNumbers.size > 1) {
    throw new Error(`Duplicate ${id} has conflicting CAS numbers after identity review: ${[...casNumbers].join(', ')}.`)
  }

  const formulas = [...new Set(records.map(record => record.compound.formula))]
  if (formulas.some(formula => !compositionsEqual(formulas[0] ?? '', formula))) {
    throw new Error(`Duplicate ${id} has non-equivalent formulae after identity review: ${formulas.join(', ')}.`)
  }

  const fallback = records.reduce<Compound>((merged, record) => ({ ...merged, ...record.compound }), records[0]!.compound)
  const sourceCompounds = records.map(record => record.compound)
  const identity: Compound = {
    ...fallback,
    ...primary.compound,
    ...resolution.overrides,
    id,
  }
  const merged: Compound = {
    ...identity,
    uses: unionStrings(sourceCompounds.map(record => record.uses), normalizeUse),
    hazards: mergeApplicableHazards(sourceCompounds, identity.physicalState),
    ghs: mergeApplicablePictograms(sourceCompounds, identity.physicalState),
    componentCasNumbers: unionStrings(sourceCompounds.map(record => record.componentCasNumbers)),
  }

  return { group: resolution.canonicalGroup, compound: merged }
}

const MIXTURE_AVERAGE_IDS = new Set(['r-410a'])
const NON_STOICHIOMETRIC_IDS = new Set(['fluorocarbon-finish'])

function normalizeCompound(compound: Compound): Compound {
  const casNumber = compound.casNumber ?? compound.cas
  const isRepeatUnit = /^\(.*\)n$/.test(compound.formula.replace(/\s+/g, ''))
  const calculatedMass = compound.category === 'alloy' || NON_STOICHIOMETRIC_IDS.has(compound.id)
    ? undefined
    : calculateMolarMass(compound.formula)
  const normalizedUses = unionStrings([compound.uses], normalizeUse)
  const applicableHazards = mergeApplicableHazards([compound], compound.physicalState)
  const applicableGhs = mergeApplicablePictograms([compound], compound.physicalState)
  const safetyDataStatus = getSafetyDataStatus({ hazards: applicableHazards, ghs: applicableGhs })

  if (calculatedMass !== undefined) {
    return {
      ...compound,
      uses: normalizedUses,
      hazards: applicableHazards,
      ghs: applicableGhs,
      safetyDataStatus,
      molarMass: calculatedMass,
      molecularMass: calculatedMass,
      molarMassBasis: isRepeatUnit ? 'repeat-unit' : 'formula',
      casNumber,
      cas: casNumber,
    }
  }

  if (MIXTURE_AVERAGE_IDS.has(compound.id)) {
    return {
      ...compound,
      uses: normalizedUses,
      hazards: applicableHazards,
      ghs: applicableGhs,
      safetyDataStatus,
      molecularMass: compound.molarMass,
      molarMassBasis: 'mixture-average',
      casNumber,
      cas: casNumber,
    }
  }

  return {
    ...compound,
    uses: normalizedUses,
    hazards: applicableHazards,
    ghs: applicableGhs,
    safetyDataStatus,
    molarMass: null,
    molecularMass: null,
    molarMassBasis: 'not-applicable',
    casNumber,
    cas: casNumber,
  }
}

/** Curate source arrays into one unambiguous record per public id. */
export function curateCompoundGroups(groups: Readonly<Record<string, readonly Compound[]>>): Record<string, Compound[]> {
  const sourceRecords = Object.entries(groups).flatMap(([group, compounds]) =>
    compounds.map(compound => ({ group, compound }))
  )

  const originalBuckets = new Map<string, SourcedCompound[]>()
  for (const source of sourceRecords) {
    const bucket = originalBuckets.get(source.compound.id) ?? []
    bucket.push(source)
    originalBuckets.set(source.compound.id, bucket)
  }

  const originalCollisionIds = new Set(
    [...originalBuckets].filter(([, records]) => records.length > 1).map(([id]) => id)
  )
  const reviewedIds = new Set(Object.keys(COMPOUND_COLLISION_RESOLUTIONS))
  const missingReviews = [...originalCollisionIds].filter(id => !reviewedIds.has(id))
  const staleReviews = [...reviewedIds].filter(id => !originalCollisionIds.has(id))
  if (missingReviews.length > 0 || staleReviews.length > 0) {
    throw new Error(
      `Compound collision review is out of sync. Missing: ${missingReviews.join(', ') || 'none'}; stale: ${staleReviews.join(', ') || 'none'}.`
    )
  }

  for (const id of reviewedIds) {
    const actualCount = originalBuckets.get(id)?.length ?? 0
    const expectedCount = THREE_RECORD_COLLISIONS.has(id) ? 3 : 2
    if (actualCount !== expectedCount) {
      throw new Error(
        `Reviewed collision ${id} now has ${actualCount} source records; expected ${expectedCount}. Re-audit it before updating the resolution.`
      )
    }
  }

  const splitRecords = applyIdentitySplits(sourceRecords)
  const buckets = new Map<string, SourcedCompound[]>()
  for (const source of splitRecords) {
    const bucket = buckets.get(source.compound.id) ?? []
    bucket.push(source)
    buckets.set(source.compound.id, bucket)
  }

  const curated: SourcedCompound[] = []
  for (const [id, records] of buckets) {
    if (records.length === 1) {
      curated.push(records[0]!)
      continue
    }

    const resolution = collisionResolutions[id]
    if (!resolution || resolution.case !== 'A') {
      throw new Error(`Duplicate ${id} remains after identity splits without a merge resolution.`)
    }
    curated.push(mergeCollision(id, records, resolution))
  }

  const result: Record<string, Compound[]> = Object.fromEntries(Object.keys(groups).map(group => [group, []]))
  for (const { group, compound } of curated) {
    const groupRecords = result[group]
    if (!groupRecords) throw new Error(`Curated compound ${compound.id} references unknown group ${group}.`)
    groupRecords.push(normalizeCompound(compound))
  }
  return result
}
