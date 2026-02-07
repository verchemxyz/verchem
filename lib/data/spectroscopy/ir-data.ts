/**
 * IR Spectroscopy Absorption Database
 *
 * Comprehensive database of characteristic infrared absorption frequencies
 * for functional group identification. All data is scientifically accurate
 * and referenced from standard spectroscopy sources (Silverstein, Pavia, SDBS).
 *
 * Wavenumber ranges in cm^-1.
 */

// ---------------------------------------------------------------------------
// Types (inline until @/lib/types/spectroscopy is created)
// ---------------------------------------------------------------------------

export type IRIntensity = 'strong' | 'medium' | 'weak' | 'variable';

export type IRBandShape = 'broad' | 'sharp' | 'very broad' | 'medium' | 'two bands' | 'multiple bands';

export interface IRAbsorption {
  /** Unique identifier */
  id: string;
  /** Category key matching IR_CATEGORIES */
  category: string;
  /** Functional group label (e.g. "Alcohol O-H stretch") */
  functionalGroup: string;
  /** Bond or vibration description */
  bond: string;
  /** Vibration type */
  vibrationType: 'stretch' | 'bend' | 'wag' | 'rock' | 'scissor' | 'twist' | 'asymmetric stretch' | 'symmetric stretch';
  /** Lower bound of absorption range (cm^-1) */
  wavenumberMin: number;
  /** Upper bound of absorption range (cm^-1) */
  wavenumberMax: number;
  /** Band intensity */
  intensity: IRIntensity;
  /** Band shape / appearance */
  bandShape: IRBandShape;
  /** Number of bands typically observed */
  bandCount: number;
  /** Short note for interpretation */
  notes: string;
  /** Example compounds that show this absorption */
  examples: string[];
  /** Searchable keywords */
  keywords: string[];
}

export interface IRCategory {
  /** Category key */
  key: string;
  /** Display label */
  label: string;
  /** Brief description of the category */
  description: string;
  /** Hex colour for UI rendering */
  color: string;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const IR_CATEGORIES: Record<string, IRCategory> = {
  oh_stretch: {
    key: 'oh_stretch',
    label: 'O-H Stretches',
    description: 'Oxygen-hydrogen stretching vibrations found in alcohols, carboxylic acids, and phenols',
    color: '#2563EB', // blue-600
  },
  nh_stretch: {
    key: 'nh_stretch',
    label: 'N-H Stretches',
    description: 'Nitrogen-hydrogen stretching vibrations found in amines and amides',
    color: '#7C3AED', // violet-600
  },
  ch_stretch: {
    key: 'ch_stretch',
    label: 'C-H Stretches',
    description: 'Carbon-hydrogen stretching vibrations for sp3, sp2, and sp hybridised carbons',
    color: '#059669', // emerald-600
  },
  triple_bond: {
    key: 'triple_bond',
    label: 'Triple Bonds',
    description: 'Carbon-carbon and carbon-nitrogen triple bond stretches',
    color: '#DC2626', // red-600
  },
  carbonyl: {
    key: 'carbonyl',
    label: 'C=O Stretches',
    description: 'Carbonyl stretching vibrations in ketones, aldehydes, acids, esters, amides, and more',
    color: '#D97706', // amber-600
  },
  cc_double: {
    key: 'cc_double',
    label: 'C=C Stretches',
    description: 'Carbon-carbon double bond stretches in alkenes and aromatics',
    color: '#0891B2', // cyan-600
  },
  single_bond: {
    key: 'single_bond',
    label: 'Single Bond Region',
    description: 'C-O, C-N, and C-halogen stretching vibrations (fingerprint region)',
    color: '#4B5563', // gray-600
  },
  other: {
    key: 'other',
    label: 'Other Functional Groups',
    description: 'Nitro, sulfonyl, thiol, and other characteristic absorptions',
    color: '#BE185D', // pink-700
  },
};

// ---------------------------------------------------------------------------
// Absorption data
// ---------------------------------------------------------------------------

export const IR_ABSORPTIONS: IRAbsorption[] = [
  // =========================================================================
  // O-H Stretches
  // =========================================================================
  {
    id: 'oh-alcohol',
    category: 'oh_stretch',
    functionalGroup: 'Alcohol O-H stretch',
    bond: 'O-H',
    vibrationType: 'stretch',
    wavenumberMin: 3200,
    wavenumberMax: 3550,
    intensity: 'strong',
    bandShape: 'broad',
    bandCount: 1,
    notes: 'Broad absorption due to hydrogen bonding. Free (non-bonded) O-H appears as a sharp band near 3600 cm\u207B\u00B9.',
    examples: ['ethanol', 'methanol', '1-propanol', '2-butanol', 'cyclohexanol'],
    keywords: ['alcohol', 'hydroxyl', 'O-H', 'hydrogen bond', 'broad'],
  },
  {
    id: 'oh-carboxylic',
    category: 'oh_stretch',
    functionalGroup: 'Carboxylic acid O-H stretch',
    bond: 'O-H',
    vibrationType: 'stretch',
    wavenumberMin: 2500,
    wavenumberMax: 3300,
    intensity: 'strong',
    bandShape: 'very broad',
    bandCount: 1,
    notes: 'Extremely broad absorption overlapping with C-H stretches. Characteristic of carboxylic acid dimers formed via strong hydrogen bonding.',
    examples: ['acetic acid', 'benzoic acid', 'formic acid', 'oxalic acid', 'propionic acid'],
    keywords: ['carboxylic acid', 'COOH', 'O-H', 'very broad', 'dimer'],
  },
  {
    id: 'oh-phenol',
    category: 'oh_stretch',
    functionalGroup: 'Phenol O-H stretch',
    bond: 'O-H',
    vibrationType: 'stretch',
    wavenumberMin: 3200,
    wavenumberMax: 3550,
    intensity: 'medium',
    bandShape: 'broad',
    bandCount: 1,
    notes: 'Similar range to alcohols but often slightly broader. Intramolecular hydrogen bonding in ortho-substituted phenols shifts the band lower.',
    examples: ['phenol', 'catechol', 'hydroquinone', 'cresol', 'resorcinol'],
    keywords: ['phenol', 'aromatic hydroxyl', 'O-H', 'broad'],
  },

  // =========================================================================
  // N-H Stretches
  // =========================================================================
  {
    id: 'nh-primary-amine',
    category: 'nh_stretch',
    functionalGroup: 'Primary amine N-H stretch',
    bond: 'N-H',
    vibrationType: 'stretch',
    wavenumberMin: 3300,
    wavenumberMax: 3500,
    intensity: 'medium',
    bandShape: 'medium',
    bandCount: 2,
    notes: 'Two bands observed: asymmetric and symmetric N-H stretches. The two-band pattern distinguishes primary amines from secondary amines.',
    examples: ['methylamine', 'aniline', 'ethylamine', '1-butylamine', 'benzylamine'],
    keywords: ['primary amine', 'NH2', 'N-H', 'two bands', 'amine'],
  },
  {
    id: 'nh-secondary-amine',
    category: 'nh_stretch',
    functionalGroup: 'Secondary amine N-H stretch',
    bond: 'N-H',
    vibrationType: 'stretch',
    wavenumberMin: 3300,
    wavenumberMax: 3500,
    intensity: 'medium',
    bandShape: 'medium',
    bandCount: 1,
    notes: 'Only one N-H stretch band observed, weaker than primary amine. Absence of the second band distinguishes from primary amines.',
    examples: ['diethylamine', 'dimethylamine', 'piperidine', 'morpholine', 'diphenylamine'],
    keywords: ['secondary amine', 'NH', 'N-H', 'one band', 'amine'],
  },
  {
    id: 'nh-amide',
    category: 'nh_stretch',
    functionalGroup: 'Amide N-H stretch',
    bond: 'N-H',
    vibrationType: 'stretch',
    wavenumberMin: 3100,
    wavenumberMax: 3500,
    intensity: 'medium',
    bandShape: 'broad',
    bandCount: 1,
    notes: 'Primary amides show two bands (like primary amines); secondary amides show one band. Always accompanied by a strong C=O (amide I) band near 1650 cm\u207B\u00B9.',
    examples: ['acetamide', 'benzamide', 'formamide', 'urea', 'N-methylacetamide'],
    keywords: ['amide', 'CONH', 'N-H', 'amide I', 'peptide'],
  },

  // =========================================================================
  // C-H Stretches
  // =========================================================================
  {
    id: 'ch-alkane-sp3',
    category: 'ch_stretch',
    functionalGroup: 'Alkane C-H stretch (sp3)',
    bond: 'C-H',
    vibrationType: 'stretch',
    wavenumberMin: 2850,
    wavenumberMax: 2960,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 2,
    notes: 'Almost always present in organic compounds. Asymmetric stretch near 2960 cm\u207B\u00B9, symmetric stretch near 2870 cm\u207B\u00B9. Methyl and methylene groups overlap.',
    examples: ['hexane', 'cyclohexane', 'propane', 'isooctane', 'decane'],
    keywords: ['alkane', 'sp3', 'C-H', 'methyl', 'methylene', 'saturated'],
  },
  {
    id: 'ch-alkene-sp2',
    category: 'ch_stretch',
    functionalGroup: 'Alkene C-H stretch (sp2)',
    bond: '=C-H',
    vibrationType: 'stretch',
    wavenumberMin: 3020,
    wavenumberMax: 3100,
    intensity: 'medium',
    bandShape: 'medium',
    bandCount: 1,
    notes: 'Appears above 3000 cm\u207B\u00B9, distinguishing from sp3 C-H (below 3000 cm\u207B\u00B9). Useful diagnostic for unsaturation.',
    examples: ['ethylene', '1-hexene', 'cyclohexene', 'styrene', 'propylene'],
    keywords: ['alkene', 'sp2', 'C-H', 'vinyl', 'olefin', 'unsaturated'],
  },
  {
    id: 'ch-alkyne-sp',
    category: 'ch_stretch',
    functionalGroup: 'Alkyne C-H stretch (sp)',
    bond: '\u2261C-H',
    vibrationType: 'stretch',
    wavenumberMin: 3260,
    wavenumberMax: 3340,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Sharp, strong band near 3300 cm\u207B\u00B9. Only present in terminal alkynes (R-C\u2261C-H). Internal alkynes lack this absorption.',
    examples: ['acetylene', '1-octyne', 'phenylacetylene', 'propargyl alcohol', '1-hexyne'],
    keywords: ['alkyne', 'sp', 'C-H', 'terminal', 'acetylenic'],
  },
  {
    id: 'ch-aldehyde',
    category: 'ch_stretch',
    functionalGroup: 'Aldehyde C-H stretch',
    bond: 'C(=O)-H',
    vibrationType: 'stretch',
    wavenumberMin: 2720,
    wavenumberMax: 2850,
    intensity: 'medium',
    bandShape: 'two bands',
    bandCount: 2,
    notes: 'Two characteristic bands: one near 2830 cm\u207B\u00B9 and a diagnostic band near 2720 cm\u207B\u00B9 (Fermi resonance doublet). The 2720 cm\u207B\u00B9 band is highly diagnostic for aldehydes.',
    examples: ['acetaldehyde', 'benzaldehyde', 'formaldehyde', 'butanal', 'cinnamaldehyde'],
    keywords: ['aldehyde', 'CHO', 'C-H', 'Fermi resonance', 'two bands'],
  },
  {
    id: 'ch-aromatic',
    category: 'ch_stretch',
    functionalGroup: 'Aromatic C-H stretch',
    bond: 'Ar-H',
    vibrationType: 'stretch',
    wavenumberMin: 3000,
    wavenumberMax: 3100,
    intensity: 'medium',
    bandShape: 'medium',
    bandCount: 1,
    notes: 'Appears above 3000 cm\u207B\u00B9 (sp2 character). Often overlaps with alkene C-H stretches. Multiple weak bands may be observed.',
    examples: ['benzene', 'toluene', 'naphthalene', 'xylene', 'aniline'],
    keywords: ['aromatic', 'arene', 'C-H', 'benzene ring', 'phenyl'],
  },

  // =========================================================================
  // Triple Bonds
  // =========================================================================
  {
    id: 'cc-triple-alkyne',
    category: 'triple_bond',
    functionalGroup: 'Alkyne C\u2261C stretch',
    bond: 'C\u2261C',
    vibrationType: 'stretch',
    wavenumberMin: 2100,
    wavenumberMax: 2260,
    intensity: 'variable',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Medium intensity for terminal alkynes; weak or absent for symmetrical internal alkynes (IR-inactive due to no dipole change). Appears in an otherwise empty region of the spectrum.',
    examples: ['1-hexyne', '2-butyne', 'phenylacetylene', 'propargyl bromide', 'acetylene'],
    keywords: ['alkyne', 'triple bond', 'C\u2261C', 'acetylene'],
  },
  {
    id: 'cn-triple-nitrile',
    category: 'triple_bond',
    functionalGroup: 'Nitrile C\u2261N stretch',
    bond: 'C\u2261N',
    vibrationType: 'stretch',
    wavenumberMin: 2200,
    wavenumberMax: 2260,
    intensity: 'medium',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Medium to strong, sharp absorption. Conjugation with aromatic rings or C=C lowers the frequency slightly. Very diagnostic band in an otherwise clear spectral region.',
    examples: ['acetonitrile', 'benzonitrile', 'acrylonitrile', 'propionitrile', 'hydrogen cyanide'],
    keywords: ['nitrile', 'cyano', 'C\u2261N', 'CN'],
  },

  // =========================================================================
  // Carbonyl (C=O) Stretches
  // =========================================================================
  {
    id: 'co-ketone',
    category: 'carbonyl',
    functionalGroup: 'Ketone C=O stretch',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1705,
    wavenumberMax: 1725,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Strong, sharp absorption. Conjugation lowers the frequency (e.g. to ~1680 cm\u207B\u00B9 in aryl ketones). Ring strain raises it (cyclopentanone ~1745 cm\u207B\u00B9).',
    examples: ['acetone', 'cyclohexanone', 'acetophenone', '2-butanone', 'benzophenone'],
    keywords: ['ketone', 'C=O', 'carbonyl'],
  },
  {
    id: 'co-aldehyde',
    category: 'carbonyl',
    functionalGroup: 'Aldehyde C=O stretch',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1720,
    wavenumberMax: 1740,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Strong absorption. Always accompanied by aldehyde C-H stretches near 2720 and 2830 cm\u207B\u00B9. Conjugation lowers the frequency.',
    examples: ['acetaldehyde', 'benzaldehyde', 'propanal', 'butanal', 'furfural'],
    keywords: ['aldehyde', 'C=O', 'carbonyl', 'CHO'],
  },
  {
    id: 'co-carboxylic-acid',
    category: 'carbonyl',
    functionalGroup: 'Carboxylic acid C=O stretch',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1700,
    wavenumberMax: 1725,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Strong absorption. Always accompanied by a very broad O-H stretch (2500-3300 cm\u207B\u00B9). Dimer C=O appears at the lower end of the range.',
    examples: ['acetic acid', 'benzoic acid', 'formic acid', 'propionic acid', 'citric acid'],
    keywords: ['carboxylic acid', 'COOH', 'C=O', 'carbonyl', 'acid'],
  },
  {
    id: 'co-ester',
    category: 'carbonyl',
    functionalGroup: 'Ester C=O stretch',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1735,
    wavenumberMax: 1750,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Higher frequency than ketones/acids due to mesomeric effect of the alkoxy oxygen. Accompanied by strong C-O stretches in the 1000-1300 cm\u207B\u00B9 region.',
    examples: ['ethyl acetate', 'methyl benzoate', 'methyl acrylate', 'vinyl acetate', 'diethyl malonate'],
    keywords: ['ester', 'C=O', 'carbonyl', 'COOR', 'lactone'],
  },
  {
    id: 'co-amide',
    category: 'carbonyl',
    functionalGroup: 'Amide C=O stretch (Amide I)',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1630,
    wavenumberMax: 1690,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Known as the Amide I band. Lower frequency than other carbonyls due to resonance with nitrogen lone pair. Amide II band (N-H bend) appears near 1510-1570 cm\u207B\u00B9.',
    examples: ['acetamide', 'benzamide', 'N-methylformamide', 'DMF', 'nylon'],
    keywords: ['amide', 'C=O', 'carbonyl', 'CONH', 'amide I', 'peptide bond'],
  },
  {
    id: 'co-anhydride',
    category: 'carbonyl',
    functionalGroup: 'Anhydride C=O stretch',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1740,
    wavenumberMax: 1830,
    intensity: 'strong',
    bandShape: 'two bands',
    bandCount: 2,
    notes: 'Two C=O stretching bands due to symmetric and asymmetric coupling: ~1800-1830 cm\u207B\u00B9 (asymmetric) and ~1740-1775 cm\u207B\u00B9 (symmetric). Very diagnostic pattern.',
    examples: ['acetic anhydride', 'maleic anhydride', 'phthalic anhydride', 'succinic anhydride', 'propionic anhydride'],
    keywords: ['anhydride', 'C=O', 'carbonyl', 'two bands', 'acid anhydride'],
  },
  {
    id: 'co-acyl-halide',
    category: 'carbonyl',
    functionalGroup: 'Acyl halide C=O stretch',
    bond: 'C=O',
    vibrationType: 'stretch',
    wavenumberMin: 1770,
    wavenumberMax: 1815,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Highest carbonyl frequency due to the strong inductive effect of the halogen atom. Acyl chlorides are most common; fluorides absorb even higher.',
    examples: ['acetyl chloride', 'benzoyl chloride', 'oxalyl chloride', 'thionyl chloride', 'propanoyl chloride'],
    keywords: ['acyl halide', 'acid chloride', 'C=O', 'carbonyl', 'COCl'],
  },

  // =========================================================================
  // C=C Stretches
  // =========================================================================
  {
    id: 'cc-alkene',
    category: 'cc_double',
    functionalGroup: 'Alkene C=C stretch',
    bond: 'C=C',
    vibrationType: 'stretch',
    wavenumberMin: 1620,
    wavenumberMax: 1680,
    intensity: 'variable',
    bandShape: 'medium',
    bandCount: 1,
    notes: 'Variable intensity: strong for terminal and unsymmetrically substituted alkenes; weak or absent for symmetrically substituted alkenes (no dipole change). Conjugation lowers the frequency.',
    examples: ['1-hexene', 'cyclohexene', 'styrene', '1,3-butadiene', 'propylene'],
    keywords: ['alkene', 'C=C', 'double bond', 'olefin', 'vinyl'],
  },
  {
    id: 'cc-aromatic',
    category: 'cc_double',
    functionalGroup: 'Aromatic C=C stretch',
    bond: 'C=C',
    vibrationType: 'stretch',
    wavenumberMin: 1450,
    wavenumberMax: 1600,
    intensity: 'medium',
    bandShape: 'multiple bands',
    bandCount: 2,
    notes: 'Typically two or more bands near 1600 and 1475 cm\u207B\u00B9 due to ring stretching modes. A band near 1500 cm\u207B\u00B9 is often also observed. Intensity varies with substitution pattern.',
    examples: ['benzene', 'toluene', 'xylene', 'naphthalene', 'phenol'],
    keywords: ['aromatic', 'arene', 'C=C', 'benzene ring', 'ring stretch'],
  },

  // =========================================================================
  // Single Bond Region (Fingerprint)
  // =========================================================================
  {
    id: 'co-alcohol',
    category: 'single_bond',
    functionalGroup: 'Alcohol C-O stretch',
    bond: 'C-O',
    vibrationType: 'stretch',
    wavenumberMin: 1000,
    wavenumberMax: 1260,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Primary alcohols ~1050 cm\u207B\u00B9, secondary ~1100 cm\u207B\u00B9, tertiary ~1150 cm\u207B\u00B9. Always accompanied by a broad O-H stretch above 3200 cm\u207B\u00B9.',
    examples: ['ethanol', '2-propanol', 'tert-butanol', 'methanol', 'cyclohexanol'],
    keywords: ['alcohol', 'C-O', 'single bond', 'hydroxyl'],
  },
  {
    id: 'co-ester-single',
    category: 'single_bond',
    functionalGroup: 'Ester C-O stretch',
    bond: 'C-O',
    vibrationType: 'stretch',
    wavenumberMin: 1000,
    wavenumberMax: 1300,
    intensity: 'strong',
    bandShape: 'two bands',
    bandCount: 2,
    notes: 'Two strong C-O absorptions: asymmetric C-O-C stretch (~1250 cm\u207B\u00B9) and O-C-C stretch (~1050 cm\u207B\u00B9). Always accompanied by a strong C=O near 1740 cm\u207B\u00B9.',
    examples: ['ethyl acetate', 'methyl benzoate', 'dimethyl carbonate', 'vinyl acetate', 'butyl acrylate'],
    keywords: ['ester', 'C-O', 'single bond', 'C-O-C'],
  },
  {
    id: 'cn-amine',
    category: 'single_bond',
    functionalGroup: 'Amine C-N stretch',
    bond: 'C-N',
    vibrationType: 'stretch',
    wavenumberMin: 1020,
    wavenumberMax: 1250,
    intensity: 'medium',
    bandShape: 'medium',
    bandCount: 1,
    notes: 'Medium intensity, often difficult to assign definitively in the fingerprint region. Aromatic C-N absorbs near 1250-1360 cm\u207B\u00B9 (stronger).',
    examples: ['methylamine', 'triethylamine', 'aniline', 'pyridine', 'diethylamine'],
    keywords: ['amine', 'C-N', 'single bond'],
  },
  {
    id: 'c-f',
    category: 'single_bond',
    functionalGroup: 'C-F stretch',
    bond: 'C-F',
    vibrationType: 'stretch',
    wavenumberMin: 1000,
    wavenumberMax: 1400,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Very strong absorption. Fluorocarbons (e.g. PTFE) show broad, intense bands. The high electronegativity of fluorine makes this a strong absorption.',
    examples: ['fluoromethane', 'fluorobenzene', 'PTFE', 'trifluoroacetic acid', 'freon-12'],
    keywords: ['fluoride', 'C-F', 'halogen', 'fluorocarbon'],
  },
  {
    id: 'c-cl',
    category: 'single_bond',
    functionalGroup: 'C-Cl stretch',
    bond: 'C-Cl',
    vibrationType: 'stretch',
    wavenumberMin: 600,
    wavenumberMax: 800,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Strong absorption in the fingerprint region. Multiple C-Cl bonds (e.g. CHCl3) give multiple bands in this region.',
    examples: ['chloroform', 'methyl chloride', 'dichloromethane', 'chlorobenzene', 'carbon tetrachloride'],
    keywords: ['chloride', 'C-Cl', 'halogen', 'chloro'],
  },
  {
    id: 'c-br',
    category: 'single_bond',
    functionalGroup: 'C-Br stretch',
    bond: 'C-Br',
    vibrationType: 'stretch',
    wavenumberMin: 500,
    wavenumberMax: 680,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Lower frequency than C-Cl due to heavier bromine atom. Can be near the lower limit of typical IR instruments.',
    examples: ['bromoethane', 'bromobenzene', '1-bromopropane', 'bromomethane', 'dibromomethane'],
    keywords: ['bromide', 'C-Br', 'halogen', 'bromo'],
  },

  // =========================================================================
  // Other Functional Groups
  // =========================================================================
  {
    id: 'no-nitro',
    category: 'other',
    functionalGroup: 'Nitro N=O stretch',
    bond: 'N=O',
    vibrationType: 'asymmetric stretch',
    wavenumberMin: 1515,
    wavenumberMax: 1560,
    intensity: 'strong',
    bandShape: 'two bands',
    bandCount: 2,
    notes: 'Two strong bands: asymmetric stretch at 1515-1560 cm\u207B\u00B9 and symmetric stretch at 1345-1385 cm\u207B\u00B9. Very diagnostic pair for nitro groups.',
    examples: ['nitrobenzene', 'nitromethane', '2,4-dinitrotoluene', 'nitroethane', 'trinitrotoluene'],
    keywords: ['nitro', 'N=O', 'NO2', 'nitro group'],
  },
  {
    id: 'no-nitro-symmetric',
    category: 'other',
    functionalGroup: 'Nitro N=O symmetric stretch',
    bond: 'N=O',
    vibrationType: 'symmetric stretch',
    wavenumberMin: 1345,
    wavenumberMax: 1385,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Symmetric N=O stretch. Always appears together with the asymmetric stretch at 1515-1560 cm\u207B\u00B9. The pair is diagnostic for nitro groups.',
    examples: ['nitrobenzene', 'nitromethane', '2,4-dinitrotoluene', 'nitroethane', 'trinitrotoluene'],
    keywords: ['nitro', 'N=O', 'NO2', 'symmetric'],
  },
  {
    id: 'so-sulfoxide',
    category: 'other',
    functionalGroup: 'Sulfoxide S=O stretch',
    bond: 'S=O',
    vibrationType: 'stretch',
    wavenumberMin: 1030,
    wavenumberMax: 1070,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Single strong S=O absorption. Distinguishes sulfoxides from sulfones (which show two S=O bands).',
    examples: ['DMSO', 'methyl phenyl sulfoxide', 'diphenyl sulfoxide', 'alliin', 'sulindac'],
    keywords: ['sulfoxide', 'S=O', 'DMSO', 'sulfinyl'],
  },
  {
    id: 'so-sulfone-asym',
    category: 'other',
    functionalGroup: 'Sulfone S=O asymmetric stretch',
    bond: 'S=O',
    vibrationType: 'asymmetric stretch',
    wavenumberMin: 1290,
    wavenumberMax: 1350,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Asymmetric S=O stretch of sulfonyl group. Accompanied by symmetric stretch at 1120-1160 cm\u207B\u00B9. The two-band pattern is diagnostic for sulfones.',
    examples: ['dimethyl sulfone', 'sulfolane', 'dapsone', 'methyl phenyl sulfone', 'tosyl chloride'],
    keywords: ['sulfone', 'S=O', 'sulfonyl', 'SO2', 'asymmetric'],
  },
  {
    id: 'so-sulfone-sym',
    category: 'other',
    functionalGroup: 'Sulfone S=O symmetric stretch',
    bond: 'S=O',
    vibrationType: 'symmetric stretch',
    wavenumberMin: 1120,
    wavenumberMax: 1160,
    intensity: 'strong',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Symmetric S=O stretch of sulfonyl group. Always accompanied by asymmetric stretch at 1290-1350 cm\u207B\u00B9.',
    examples: ['dimethyl sulfone', 'sulfolane', 'dapsone', 'methyl phenyl sulfone', 'tosyl chloride'],
    keywords: ['sulfone', 'S=O', 'sulfonyl', 'SO2', 'symmetric'],
  },
  {
    id: 'sh-thiol',
    category: 'other',
    functionalGroup: 'Thiol S-H stretch',
    bond: 'S-H',
    vibrationType: 'stretch',
    wavenumberMin: 2550,
    wavenumberMax: 2600,
    intensity: 'weak',
    bandShape: 'sharp',
    bandCount: 1,
    notes: 'Weak but diagnostic band in a region with few other absorptions. Weaker than O-H due to lower polarity of S-H bond.',
    examples: ['ethanethiol', 'thiophenol', '1-propanethiol', 'cysteine', '2-mercaptoethanol'],
    keywords: ['thiol', 'S-H', 'mercaptan', 'sulfhydryl'],
  },
];

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Find all IR absorptions that could match a given wavenumber.
 *
 * @param wavenumber - Observed peak position in cm^-1
 * @returns Array of matching IRAbsorption records, sorted by narrowest range first (most specific match)
 */
export function identifyIRPeaks(wavenumber: number): IRAbsorption[] {
  if (wavenumber <= 0 || !Number.isFinite(wavenumber)) {
    return [];
  }

  return IR_ABSORPTIONS
    .filter(
      (absorption) =>
        wavenumber >= absorption.wavenumberMin &&
        wavenumber <= absorption.wavenumberMax
    )
    .sort(
      (a, b) =>
        (a.wavenumberMax - a.wavenumberMin) -
        (b.wavenumberMax - b.wavenumberMin)
    );
}

/**
 * Search the IR database by functional group name or keyword.
 *
 * Performs case-insensitive matching against the functionalGroup field,
 * bond field, notes, and the keywords array.
 *
 * @param query - Search string (e.g. "ketone", "C=O", "amine")
 * @returns Array of matching IRAbsorption records
 */
export function searchIRByFunctionalGroup(query: string): IRAbsorption[] {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const normalised = query.trim().toLowerCase();
  if (normalised.length === 0) {
    return [];
  }

  return IR_ABSORPTIONS.filter((absorption) => {
    // Check functional group name
    if (absorption.functionalGroup.toLowerCase().includes(normalised)) {
      return true;
    }

    // Check bond description
    if (absorption.bond.toLowerCase().includes(normalised)) {
      return true;
    }

    // Check notes
    if (absorption.notes.toLowerCase().includes(normalised)) {
      return true;
    }

    // Check keywords
    if (
      absorption.keywords.some((kw) => kw.toLowerCase().includes(normalised))
    ) {
      return true;
    }

    return false;
  });
}
