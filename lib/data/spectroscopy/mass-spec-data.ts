// Mass Spectrometry Reference Data
// Comprehensive fragment losses, isotope patterns, common ions, and utility functions
// References: McLafferty & Turecek, NIST Mass Spectral Library

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FragmentLoss {
  id: string
  massLost: number
  fragment: string
  interpretation: string
  commonSources: string[]
  category: string
}

interface IsotopePattern {
  element: string
  symbol: string
  mPlus1: number // M+1 relative intensity percentage per atom
  mPlus2: number // M+2 relative intensity percentage per atom
  significance: string
}

interface CommonIon {
  id: string
  mz: number
  formula: string
  name: string
  source: string
  category: string
}

// ---------------------------------------------------------------------------
// Common Fragment Losses
// ---------------------------------------------------------------------------

export const FRAGMENT_LOSSES: FragmentLoss[] = [
  {
    id: 'loss-h',
    massLost: 1,
    fragment: 'H\u00B7',
    interpretation: 'Hydrogen radical loss',
    commonSources: ['Aldehydes', 'Alcohols', 'Amines'],
    category: 'radical',
  },
  {
    id: 'loss-ch3',
    massLost: 15,
    fragment: 'CH\u2083\u00B7',
    interpretation: 'Methyl radical loss',
    commonSources: ['Branched alkanes', 'Methyl ketones', 'Methyl ethers', 'Toluene derivatives'],
    category: 'radical',
  },
  {
    id: 'loss-oh',
    massLost: 17,
    fragment: 'OH\u00B7',
    interpretation: 'Hydroxyl radical loss',
    commonSources: ['Carboxylic acids', 'Alcohols', 'N-oxides'],
    category: 'radical',
  },
  {
    id: 'loss-h2o',
    massLost: 18,
    fragment: 'H\u2082O',
    interpretation: 'Dehydration',
    commonSources: ['Alcohols', 'Aldol products', 'Primary amides', 'Carboxylic acids'],
    category: 'neutral',
  },
  {
    id: 'loss-hcn',
    massLost: 27,
    fragment: 'HCN',
    interpretation: 'Loss of hydrogen cyanide',
    commonSources: ['Nitriles', 'N-heterocycles (pyridine, pyrrole)', 'Aromatic amines'],
    category: 'neutral',
  },
  {
    id: 'loss-co',
    massLost: 28,
    fragment: 'CO',
    interpretation: 'Carbon monoxide loss',
    commonSources: ['Carbonyl compounds', 'Phenols', 'Quinones', 'Aldehydes'],
    category: 'neutral',
  },
  {
    id: 'loss-c2h4',
    massLost: 28,
    fragment: 'C\u2082H\u2084',
    interpretation: 'Ethylene loss (McLafferty rearrangement)',
    commonSources: ['Ethyl esters', 'Long-chain alkyl groups', 'Propyl ketones'],
    category: 'neutral',
  },
  {
    id: 'loss-cho',
    massLost: 29,
    fragment: 'CHO\u00B7',
    interpretation: 'Formyl radical loss',
    commonSources: ['Aldehydes', 'Formate esters'],
    category: 'radical',
  },
  {
    id: 'loss-c2h5',
    massLost: 29,
    fragment: 'C\u2082H\u2085\u00B7',
    interpretation: 'Ethyl radical loss',
    commonSources: ['Ethyl-substituted compounds', 'Diethyl ethers', 'Ethyl esters'],
    category: 'radical',
  },
  {
    id: 'loss-ch2o',
    massLost: 30,
    fragment: 'CH\u2082O',
    interpretation: 'Formaldehyde loss',
    commonSources: ['Methyl esters', 'Methoxy-methylated compounds'],
    category: 'neutral',
  },
  {
    id: 'loss-och3',
    massLost: 31,
    fragment: 'OCH\u2083\u00B7',
    interpretation: 'Methoxy radical loss',
    commonSources: ['Methyl ethers', 'Methyl esters', 'Anisole derivatives'],
    category: 'radical',
  },
  {
    id: 'loss-ch3oh',
    massLost: 32,
    fragment: 'CH\u2083OH',
    interpretation: 'Methanol loss',
    commonSources: ['Methyl esters', 'Methylated sugars'],
    category: 'neutral',
  },
  {
    id: 'loss-sh',
    massLost: 33,
    fragment: 'SH\u00B7',
    interpretation: 'Thiol radical loss',
    commonSources: ['Thiols', 'Thioethers'],
    category: 'radical',
  },
  {
    id: 'loss-cl',
    massLost: 35,
    fragment: 'Cl\u00B7',
    interpretation: 'Chlorine radical loss (\u00B3\u2075Cl)',
    commonSources: ['Chloroalkanes', 'Chloroarenes', 'Chlorinated pesticides'],
    category: 'radical',
  },
  {
    id: 'loss-cl37',
    massLost: 37,
    fragment: 'Cl\u00B7',
    interpretation: 'Chlorine radical loss (\u00B3\u2077Cl isotope)',
    commonSources: ['Chloroalkanes', 'Chloroarenes', 'Chlorinated pesticides'],
    category: 'radical',
  },
  {
    id: 'loss-hcl',
    massLost: 36,
    fragment: 'HCl',
    interpretation: 'Hydrogen chloride loss',
    commonSources: ['Chloroalkanes', 'Chlorohydrins'],
    category: 'neutral',
  },
  {
    id: 'loss-c3h7',
    massLost: 43,
    fragment: 'C\u2083H\u2087\u00B7',
    interpretation: 'Propyl radical loss',
    commonSources: ['Propyl-substituted compounds', 'Long-chain alkanes'],
    category: 'radical',
  },
  {
    id: 'loss-ch3co',
    massLost: 43,
    fragment: 'CH\u2083CO\u00B7',
    interpretation: 'Acetyl radical loss',
    commonSources: ['Methyl ketones', 'Acetates', 'Acetamides'],
    category: 'radical',
  },
  {
    id: 'loss-co2',
    massLost: 44,
    fragment: 'CO\u2082',
    interpretation: 'Decarboxylation',
    commonSources: ['Carboxylic acids', 'Anhydrides', 'Esters', 'Carbonates'],
    category: 'neutral',
  },
  {
    id: 'loss-oc2h5',
    massLost: 45,
    fragment: 'OC\u2082H\u2085\u00B7',
    interpretation: 'Ethoxy radical loss',
    commonSources: ['Ethyl ethers', 'Ethyl esters', 'Diethyl ether derivatives'],
    category: 'radical',
  },
  {
    id: 'loss-no2',
    massLost: 46,
    fragment: 'NO\u2082',
    interpretation: 'Nitro group loss',
    commonSources: ['Nitroalkanes', 'Nitroarenes', 'Nitrate esters'],
    category: 'neutral',
  },
  {
    id: 'loss-c4h9',
    massLost: 57,
    fragment: 'C\u2084H\u2089\u00B7',
    interpretation: 'Butyl radical loss',
    commonSources: ['Butyl-substituted compounds', 'tert-Butyl groups', 'Long-chain alkanes'],
    category: 'radical',
  },
  {
    id: 'loss-c6h5',
    massLost: 77,
    fragment: 'C\u2086H\u2085\u00B7',
    interpretation: 'Phenyl radical loss',
    commonSources: ['Biphenyl derivatives', 'Phenyl esters', 'Diaryl compounds'],
    category: 'radical',
  },
  {
    id: 'loss-br',
    massLost: 79,
    fragment: 'Br\u00B7',
    interpretation: 'Bromine radical loss (\u2079\u2070Br)',
    commonSources: ['Bromoalkanes', 'Bromoarenes', 'Brominated flame retardants'],
    category: 'radical',
  },
  {
    id: 'loss-br81',
    massLost: 81,
    fragment: 'Br\u00B7',
    interpretation: 'Bromine radical loss (\u2078\u00B9Br isotope)',
    commonSources: ['Bromoalkanes', 'Bromoarenes', 'Brominated flame retardants'],
    category: 'radical',
  },
  {
    id: 'loss-tropylium-source',
    massLost: 91,
    fragment: 'C\u2087H\u2087\u207A',
    interpretation: 'Tropylium cation loss (from benzyl cleavage)',
    commonSources: ['Benzyl compounds', 'Toluene derivatives', 'Alkylbenzenes'],
    category: 'cation',
  },
]

// ---------------------------------------------------------------------------
// Isotope Patterns
// ---------------------------------------------------------------------------

export const ISOTOPE_PATTERNS: IsotopePattern[] = [
  {
    element: 'Carbon',
    symbol: 'C',
    mPlus1: 1.1,
    mPlus2: 0,
    significance: 'Count carbons from M+1 intensity: number of C \u2248 (M+1 %) / 1.1',
  },
  {
    element: 'Hydrogen',
    symbol: 'H',
    mPlus1: 0.015,
    mPlus2: 0,
    significance: 'Usually negligible contribution to M+1',
  },
  {
    element: 'Nitrogen',
    symbol: 'N',
    mPlus1: 0.37,
    mPlus2: 0,
    significance:
      'Nitrogen rule: odd molecular weight indicates odd number of nitrogen atoms',
  },
  {
    element: 'Oxygen',
    symbol: 'O',
    mPlus1: 0.04,
    mPlus2: 0.20,
    significance: 'Small M+2 contribution; multiple oxygens become detectable',
  },
  {
    element: 'Chlorine',
    symbol: 'Cl',
    mPlus1: 0,
    mPlus2: 32.5,
    significance:
      'Distinctive M:M+2 ratio of 3:1 for one Cl; 9:6:1 for two Cl atoms',
  },
  {
    element: 'Bromine',
    symbol: 'Br',
    mPlus1: 0,
    mPlus2: 97.3,
    significance:
      'M:M+2 \u2248 1:1 for one Br; unmistakable doublet pattern',
  },
  {
    element: 'Sulfur',
    symbol: 'S',
    mPlus1: 0.79,
    mPlus2: 4.4,
    significance:
      'M+2 peak at ~4.4% per sulfur atom; detectable even with one S',
  },
  {
    element: 'Silicon',
    symbol: 'Si',
    mPlus1: 3.4,
    mPlus2: 5.1,
    significance:
      'Strong M+1 and M+2 contributions; common in TMS derivatives',
  },
  {
    element: 'Fluorine',
    symbol: 'F',
    mPlus1: 0,
    mPlus2: 0,
    significance:
      'Monoisotopic (\u00B9\u2079F only); no isotope pattern contribution',
  },
  {
    element: 'Iodine',
    symbol: 'I',
    mPlus1: 0,
    mPlus2: 0,
    significance:
      'Monoisotopic (\u00B9\u00B2\u2077I only); no isotope pattern contribution but high mass (127)',
  },
]

// ---------------------------------------------------------------------------
// Common Fragment Ions (Cations)
// ---------------------------------------------------------------------------

export const COMMON_IONS: CommonIon[] = [
  {
    id: 'ion-ch3',
    mz: 15,
    formula: 'CH\u2083\u207A',
    name: 'Methyl cation',
    source: 'Methyl cleavage from any methylated compound',
    category: 'alkyl',
  },
  {
    id: 'ion-cho',
    mz: 29,
    formula: 'CHO\u207A',
    name: 'Formyl cation',
    source: 'Aldehydes and formate esters',
    category: 'carbonyl',
  },
  {
    id: 'ion-c2h5',
    mz: 29,
    formula: 'C\u2082H\u2085\u207A',
    name: 'Ethyl cation',
    source: 'Ethyl-substituted compounds',
    category: 'alkyl',
  },
  {
    id: 'ion-no',
    mz: 30,
    formula: 'NO\u207A',
    name: 'Nitrosyl cation',
    source: 'Nitro compounds, nitroso compounds',
    category: 'nitrogen',
  },
  {
    id: 'ion-c3h3',
    mz: 39,
    formula: 'C\u2083H\u2083\u207A',
    name: 'Cyclopropenyl cation',
    source: 'Aromatic fragmentation, alkynes',
    category: 'unsaturated',
  },
  {
    id: 'ion-c3h5',
    mz: 41,
    formula: 'C\u2083H\u2085\u207A',
    name: 'Allyl cation',
    source: 'Alkenes, cyclopropane ring opening',
    category: 'unsaturated',
  },
  {
    id: 'ion-ch3co',
    mz: 43,
    formula: 'CH\u2083CO\u207A',
    name: 'Acylium (acetyl) cation',
    source: 'Methyl ketones, acetates, acetamides',
    category: 'carbonyl',
  },
  {
    id: 'ion-c3h7',
    mz: 43,
    formula: 'C\u2083H\u2087\u207A',
    name: 'Propyl cation',
    source: 'Propyl-substituted compounds',
    category: 'alkyl',
  },
  {
    id: 'ion-co2h',
    mz: 45,
    formula: 'CO\u2082H\u207A',
    name: 'Carboxyl cation',
    source: 'Carboxylic acids, esters',
    category: 'carbonyl',
  },
  {
    id: 'ion-c4h3',
    mz: 51,
    formula: 'C\u2084H\u2083\u207A',
    name: 'Butatrienyl cation',
    source: 'Aromatic ring fragmentation (loss of C\u2082H\u2082 from phenyl)',
    category: 'aromatic',
  },
  {
    id: 'ion-c4h9',
    mz: 57,
    formula: 'C\u2084H\u2089\u207A',
    name: 'tert-Butyl cation',
    source: 'tert-Butyl groups, branched alkanes, long-chain hydrocarbons',
    category: 'alkyl',
  },
  {
    id: 'ion-c5h5',
    mz: 65,
    formula: 'C\u2085H\u2085\u207A',
    name: 'Cyclopentadienyl cation',
    source: 'Aromatic ring fragmentation (phenyl loses CO or C)',
    category: 'aromatic',
  },
  {
    id: 'ion-c5h9',
    mz: 69,
    formula: 'C\u2085H\u2089\u207A',
    name: 'Pentyl / neopentyl cation',
    source: 'Long-chain aliphatics, terpenes',
    category: 'alkyl',
  },
  {
    id: 'ion-c6h5',
    mz: 77,
    formula: 'C\u2086H\u2085\u207A',
    name: 'Phenyl cation',
    source: 'Monosubstituted benzenes, biphenyl fragmentation',
    category: 'aromatic',
  },
  {
    id: 'ion-pyridinium',
    mz: 80,
    formula: 'C\u2085H\u2086N\u207A',
    name: 'Pyridinium cation',
    source: 'Pyridine derivatives',
    category: 'nitrogen',
  },
  {
    id: 'ion-tropylium',
    mz: 91,
    formula: 'C\u2087H\u2087\u207A',
    name: 'Tropylium cation',
    source: 'Benzyl cleavage from toluene and alkylbenzenes',
    category: 'aromatic',
  },
  {
    id: 'ion-methyltropylium',
    mz: 105,
    formula: 'C\u2086H\u2085CO\u207A',
    name: 'Benzoyl cation',
    source: 'Aryl ketones, benzoate esters, benzamides',
    category: 'aromatic',
  },
  {
    id: 'ion-xylyl',
    mz: 105,
    formula: 'C\u2088H\u2089\u207A',
    name: 'Xylyl / methyltropylium cation',
    source: 'Xylene derivatives, dimethylbenzenes',
    category: 'aromatic',
  },
  {
    id: 'ion-naphthalene',
    mz: 128,
    formula: 'C\u2081\u2080H\u2088\u207A',
    name: 'Naphthalenyl cation',
    source: 'Naphthalene and PAH fragmentation',
    category: 'aromatic',
  },
]

// ---------------------------------------------------------------------------
// McLafferty Rearrangement Information
// ---------------------------------------------------------------------------

export const MCLAFFERTY_INFO = {
  name: 'McLafferty Rearrangement',
  description:
    'A common mass spectrometric fragmentation involving transfer of a \u03B3-hydrogen (gamma-hydrogen) to the carbonyl oxygen through a six-membered cyclic transition state, resulting in loss of a neutral alkene and formation of an enol radical cation.',
  requirements: [
    'A carbonyl group (C=O) or analogous unsaturated system (\u03B1,\u03B2-unsaturated)',
    'A \u03B3-hydrogen (hydrogen on the carbon three bonds away from the carbonyl)',
    'Ability to form a six-membered cyclic transition state',
  ],
  mechanism: [
    'The \u03B3-hydrogen migrates to the carbonyl oxygen via a six-membered ring transition state.',
    'The bond between the \u03B1-carbon and \u03B2-carbon cleaves homolytically.',
    'A neutral alkene (typically ethylene, C\u2082H\u2084) is expelled.',
    'The charge is retained on the enol radical cation fragment.',
  ],
  applicableTo: [
    'Aldehydes (loss of alkene from \u03B1-position)',
    'Ketones (loss of alkene)',
    'Carboxylic acids (loss of alkene)',
    'Esters (loss of alkene)',
    'Amides (loss of alkene)',
    'Carbonates and carbamates',
  ],
  massLost: 28, // C2H4 = ethylene is the simplest case
  diagnosticValue:
    'Highly diagnostic for carbonyl-containing compounds. The rearrangement produces an even-electron (EE+) ion, which is often the base peak. The mass of the McLafferty product ion directly indicates the portion of the molecule attached to the carbonyl.',
  example: {
    compound: '2-Hexanone (methyl butyl ketone)',
    molecularWeight: 100,
    process:
      '\u03B3-H transfer from C-5 to carbonyl oxygen, loss of propene (C\u2083H\u2086, 42 Da)',
    productIon: 58,
    productFormula: 'CH\u2082=C(OH)CH\u2083\u207A\u00B7',
    lostNeutral: 'CH\u2083CH=CH\u2082 (propene, 42 Da)',
  },
} as const

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Identify possible fragment losses given a parent ion m/z and a fragment ion m/z.
 * Returns all matching FragmentLoss entries within a tolerance of +/- 0.5 Da.
 */
export function identifyFragmentLoss(
  mzParent: number,
  mzFragment: number
): FragmentLoss[] {
  const massLost = mzParent - mzFragment

  if (massLost <= 0) {
    return []
  }

  const tolerance = 0.5

  return FRAGMENT_LOSSES.filter(
    (loss) => Math.abs(loss.massLost - massLost) <= tolerance
  )
}

/**
 * Identify a common ion by its m/z value.
 * Default tolerance is +/- 0.5 Da for unit-resolution mass spectrometry.
 */
export function identifyIon(mz: number, tolerance: number = 0.5): CommonIon[] {
  return COMMON_IONS.filter(
    (ion) => Math.abs(ion.mz - mz) <= tolerance
  )
}

/**
 * Predict the isotope pattern (M, M+1, M+2) for a given molecular formula.
 *
 * This uses a first-order approximation suitable for educational purposes.
 * For molecules with multiple Cl or Br atoms the binomial expansion is applied.
 *
 * @param formula Object with element counts, e.g. { C: 6, H: 12, O: 6 }
 * @returns Array of { mz, relativeIntensity } where M is normalized to 100.
 */
export function predictIsotopePattern(
  formula: {
    C?: number
    H?: number
    N?: number
    O?: number
    Cl?: number
    Br?: number
    S?: number
    Si?: number
    F?: number
    I?: number
  }
): { mz: number; relativeIntensity: number }[] {
  const nC = formula.C ?? 0
  const nH = formula.H ?? 0
  const nN = formula.N ?? 0
  const nO = formula.O ?? 0
  const nCl = formula.Cl ?? 0
  const nBr = formula.Br ?? 0
  const nS = formula.S ?? 0
  const nSi = formula.Si ?? 0
  const nF = formula.F ?? 0
  const nI = formula.I ?? 0

  // Monoisotopic molecular weight (approximate using integer masses for simplicity)
  const mMono =
    nC * 12 +
    nH * 1 +
    nN * 14 +
    nO * 16 +
    nCl * 35 +
    nBr * 79 +
    nS * 32 +
    nSi * 28 +
    nF * 19 +
    nI * 127

  // M+1 contributions (percentage relative to M = 100)
  const mPlus1 =
    nC * 1.1 +
    nH * 0.015 +
    nN * 0.37 +
    nO * 0.04 +
    nS * 0.79 +
    nSi * 3.4

  // M+2 contributions from non-halogen elements
  const mPlus2NonHalogen =
    nO * 0.20 +
    nS * 4.4 +
    nSi * 5.1

  // Halogen contributions using binomial coefficients
  // For Cl: 35Cl (75.77%) and 37Cl (24.23%), ratio 37Cl/35Cl = 0.3198 ~ 32.5% per Cl
  // For Br: 79Br (50.69%) and 81Br (49.31%), ratio 81Br/79Br = 0.9728 ~ 97.3% per Br

  // Binomial expansion for halogens
  // P(k atoms of heavy isotope out of n) = C(n,k) * p^k * (1-p)^(n-k)
  const pCl37 = 0.2423
  const pBr81 = 0.4931

  // Calculate halogen isotope distributions
  // We need M, M+2, M+4, etc. for halogens (M+1 is not relevant for Cl/Br)
  // For simplicity, we compute up to M+2 contribution from halogens

  // Chlorine contribution to M+2
  let clM = 1
  let clMPlus2 = 0
  if (nCl > 0) {
    // Probability all are 35Cl
    clM = Math.pow(1 - pCl37, nCl)
    // Probability exactly one is 37Cl (contributes to M+2)
    if (nCl >= 1) {
      clMPlus2 = nCl * Math.pow(pCl37, 1) * Math.pow(1 - pCl37, nCl - 1)
    }
  }

  // Bromine contribution to M+2
  let brM = 1
  let brMPlus2 = 0
  if (nBr > 0) {
    brM = Math.pow(1 - pBr81, nBr)
    if (nBr >= 1) {
      brMPlus2 = nBr * Math.pow(pBr81, 1) * Math.pow(1 - pBr81, nBr - 1)
    }
  }

  // Combined M intensity (before normalization)
  const combinedM = clM * brM

  // Combined M+2 from halogens:
  // Cross-terms: (all Cl light, one Br heavy) + (one Cl heavy, all Br light)
  const combinedMPlus2Halogen = clM * brMPlus2 + clMPlus2 * brM

  // Normalize so M = 100
  const mIntensity = 100
  const mPlus2Halogen = (combinedMPlus2Halogen / combinedM) * 100

  // Total M+2
  const totalMPlus2 = mPlus2NonHalogen + mPlus2Halogen

  const pattern: { mz: number; relativeIntensity: number }[] = [
    { mz: mMono, relativeIntensity: mIntensity },
  ]

  if (mPlus1 > 0.01) {
    pattern.push({
      mz: mMono + 1,
      relativeIntensity: parseFloat(mPlus1.toFixed(2)),
    })
  }

  if (totalMPlus2 > 0.01) {
    pattern.push({
      mz: mMono + 2,
      relativeIntensity: parseFloat(totalMPlus2.toFixed(2)),
    })
  }

  return pattern
}

/**
 * Apply the nitrogen rule to a molecular weight.
 *
 * The nitrogen rule states that a molecule with an odd nominal molecular weight
 * contains an odd number of nitrogen atoms, and a molecule with an even nominal
 * molecular weight contains zero or an even number of nitrogen atoms.
 *
 * This applies to compounds containing C, H, O, N, S, and halogens.
 */
export function checkNitrogenRule(molecularWeight: number): string {
  const nominalMW = Math.round(molecularWeight)

  if (nominalMW % 2 === 1) {
    return `Odd molecular weight (${nominalMW}): the molecule contains an odd number of nitrogen atoms (1, 3, 5, ...). This is consistent with amines, nitriles, amides, N-heterocycles, and other nitrogen-containing compounds.`
  }

  return `Even molecular weight (${nominalMW}): the molecule contains zero or an even number of nitrogen atoms (0, 2, 4, ...). If no nitrogen is present, the compound may be a hydrocarbon, alcohol, ether, ester, carboxylic acid, or halogenated compound.`
}
