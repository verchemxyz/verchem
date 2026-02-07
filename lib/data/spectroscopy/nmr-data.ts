// =============================================================================
// NMR Spectroscopy Data - Comprehensive 1H and 13C Chemical Shifts
// =============================================================================
// Sources: Pavia "Introduction to Spectroscopy", Silverstein "Spectrometric
// Identification of Organic Compounds", Pretsch "Structure Determination of
// Organic Compounds", SDBS (Spectral Database for Organic Compounds)
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface NMRShift {
  id: string;
  chemicalShiftMin: number;
  chemicalShiftMax: number;
  environment: string;
  description: string;
  multiplicity?: string; // for 1H only
  commonExamples: string[];
  category: string;
}

export interface NMRSolvent {
  id: string;
  name: string;
  formula: string;
  protonShift: number | null;   // ppm, null if no residual 1H peak
  carbonShift: number | null;   // ppm, null if not applicable
  boilingPoint: number | null;  // degrees C
  notes: string;
}

// -----------------------------------------------------------------------------
// 1H NMR Chemical Shifts
// -----------------------------------------------------------------------------

export const PROTON_NMR_SHIFTS: NMRShift[] = [
  {
    id: 'h-cyclopropane-tms',
    chemicalShiftMin: 0.0,
    chemicalShiftMax: 0.5,
    environment: 'Cyclopropane, TMS',
    description:
      'Protons on cyclopropane rings experience strong shielding due to ring current effects. TMS (tetramethylsilane) is the universal reference standard set to 0.00 ppm.',
    multiplicity: 'varies',
    commonExamples: ['Cyclopropane (0.22)', 'TMS (0.00)', 'Metal hydrides'],
    category: 'Shielded / Reference',
  },
  {
    id: 'h-alkyl-methyl',
    chemicalShiftMin: 0.7,
    chemicalShiftMax: 1.3,
    environment: 'R-CH3 (alkyl methyl)',
    description:
      'Methyl groups attached to sp3 carbon chains. Among the most shielded common protons. Splitting pattern depends on adjacent CH groups.',
    multiplicity: 'singlet, triplet, or doublet',
    commonExamples: [
      'Ethane CH3 (0.86)',
      'Propane CH3 (0.91)',
      'tert-Butyl (CH3)3 (0.90)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'h-alkyl-methylene',
    chemicalShiftMin: 1.2,
    chemicalShiftMax: 1.8,
    environment: 'R-CH2-R (alkyl methylene)',
    description:
      'Methylene groups within alkyl chains. Slightly deshielded compared to methyl groups due to additional alkyl substitution.',
    multiplicity: 'multiplet',
    commonExamples: [
      'Cyclohexane (1.43)',
      'n-Hexane CH2 (1.28)',
      'Decalin CH2 (1.4-1.7)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'h-alkyl-methine',
    chemicalShiftMin: 1.4,
    chemicalShiftMax: 1.7,
    environment: 'R3-CH (alkyl methine)',
    description:
      'Methine protons on tertiary sp3 carbons. Further deshielded than methylene due to three alkyl substituents.',
    multiplicity: 'multiplet',
    commonExamples: [
      'Isobutane CH (1.60)',
      'Isopentane CH (1.51)',
      'Adamantane CH (1.63)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'h-allylic',
    chemicalShiftMin: 1.5,
    chemicalShiftMax: 2.5,
    environment: 'Allylic (C=C-CH)',
    description:
      'Protons on carbon adjacent to a C=C double bond. Deshielded by the pi system through hyperconjugation. May show long-range allylic coupling (J ~ 0-3 Hz).',
    multiplicity: 'varies',
    commonExamples: [
      'Propene CH3 (1.71)',
      'Cyclohexene allylic CH2 (1.97)',
      '2-Methylpropene CH3 (1.78)',
    ],
    category: 'Unsaturated',
  },
  {
    id: 'h-alpha-carbonyl',
    chemicalShiftMin: 1.9,
    chemicalShiftMax: 2.5,
    environment: 'R-CO-CH (alpha to carbonyl)',
    description:
      'Protons alpha to a carbonyl group (C=O). The electron-withdrawing carbonyl deshields these protons. Important for identifying ketones, esters, and amides.',
    multiplicity: 'varies',
    commonExamples: [
      'Acetone CH3 (2.17)',
      'Acetic acid CH3 (2.10)',
      'Acetaldehyde CH3 (2.20)',
    ],
    category: 'Carbonyl-adjacent',
  },
  {
    id: 'h-benzylic',
    chemicalShiftMin: 2.1,
    chemicalShiftMax: 2.6,
    environment: 'Ar-CH (benzylic)',
    description:
      'Protons on carbon directly attached to an aromatic ring. Deshielded by the aromatic ring current. Benzylic protons are also relatively acidic.',
    multiplicity: 'singlet or varies',
    commonExamples: [
      'Toluene CH3 (2.36)',
      'Ethylbenzene CH2 (2.64)',
      'Xylene CH3 (2.25)',
    ],
    category: 'Aromatic-adjacent',
  },
  {
    id: 'h-alkyne-terminal',
    chemicalShiftMin: 2.1,
    chemicalShiftMax: 3.0,
    environment: 'C triple bond C-H (alkyne terminal)',
    description:
      'Terminal acetylenic protons. Despite the sp hybridization, these appear at relatively low shift due to the anisotropic shielding cone of the triple bond.',
    multiplicity: 'singlet or triplet',
    commonExamples: [
      'Acetylene (1.91)',
      'Propyne (1.80)',
      'Phenylacetylene (3.07)',
    ],
    category: 'Unsaturated',
  },
  {
    id: 'h-amine-nh',
    chemicalShiftMin: 2.5,
    chemicalShiftMax: 5.0,
    environment: 'N-H (amine, variable)',
    description:
      'Amine N-H protons are highly variable due to hydrogen bonding, concentration, temperature, and exchange rate. Often appear as broad peaks. D2O shake causes disappearance.',
    multiplicity: 'broad singlet',
    commonExamples: [
      'Primary amine R-NH2 (0.5-3.0)',
      'Secondary amine R2-NH (2.0-4.0)',
      'Amide NH (6.0-9.0)',
    ],
    category: 'Exchangeable',
  },
  {
    id: 'h-alpha-oxygen-ether',
    chemicalShiftMin: 3.2,
    chemicalShiftMax: 3.8,
    environment: 'C-O-CH (alpha to oxygen, ethers)',
    description:
      'Protons on carbon bonded to an ether oxygen. The electronegative oxygen deshields these protons significantly.',
    multiplicity: 'varies',
    commonExamples: [
      'Diethyl ether OCH2 (3.47)',
      'THF OCH2 (3.75)',
      'Anisole OCH3 (3.77)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'h-alpha-nitrogen',
    chemicalShiftMin: 3.3,
    chemicalShiftMax: 4.0,
    environment: 'N-CH (alpha to nitrogen)',
    description:
      'Protons on carbon bonded to nitrogen. Deshielded by the electronegative nitrogen atom but less than oxygen-adjacent protons.',
    multiplicity: 'varies',
    commonExamples: [
      'Trimethylamine NCH3 (2.12)',
      'Pyridine alpha-CH (8.50)',
      'Piperidine NCH2 (2.36)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'h-methoxy',
    chemicalShiftMin: 3.5,
    chemicalShiftMax: 3.9,
    environment: 'O-CH3 (methoxy)',
    description:
      'Methoxy groups appear as sharp singlets in a characteristic narrow range. Very diagnostic for methyl esters and methyl ethers.',
    multiplicity: 'singlet',
    commonExamples: [
      'Methanol OCH3 (3.49)',
      'Methyl acetate OCH3 (3.67)',
      'Anisole OCH3 (3.77)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'h-alcohol-oh',
    chemicalShiftMin: 3.5,
    chemicalShiftMax: 4.5,
    environment: 'R-OH (alcohol, variable)',
    description:
      'Hydroxyl protons are concentration- and temperature-dependent. Hydrogen bonding causes downfield shifts. D2O shake causes disappearance. May appear sharp or broad.',
    multiplicity: 'broad singlet',
    commonExamples: [
      'Methanol OH (3.40)',
      'Ethanol OH (2.61)',
      'Phenol OH (4.0-7.0)',
    ],
    category: 'Exchangeable',
  },
  {
    id: 'h-ester-och2',
    chemicalShiftMin: 3.7,
    chemicalShiftMax: 4.8,
    environment: 'O-CH2 (esters, carboxylic acids)',
    description:
      'Methylene protons bonded to ester or carboxylic acid oxygen. More deshielded than simple ether O-CH due to the additional electron withdrawal of the carbonyl.',
    multiplicity: 'varies',
    commonExamples: [
      'Ethyl acetate OCH2 (4.12)',
      'Benzyl alcohol OCH2 (4.56)',
      'Glycol HOCH2 (3.76)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'h-vinyl',
    chemicalShiftMin: 4.5,
    chemicalShiftMax: 6.5,
    environment: '=CH2, =CHR (vinyl/vinylidene)',
    description:
      'Olefinic (vinyl) protons on C=C double bonds. Deshielded by the pi bond anisotropy. Coupling constants: cis J = 6-12 Hz, trans J = 12-18 Hz, geminal J = 0-3 Hz.',
    multiplicity: 'doublet, triplet, or multiplet',
    commonExamples: [
      'Ethylene (5.25)',
      'Styrene vinyl (5.10-5.75)',
      'Cyclohexene (5.59)',
    ],
    category: 'Unsaturated',
  },
  {
    id: 'h-acetal',
    chemicalShiftMin: 5.0,
    chemicalShiftMax: 5.5,
    environment: 'O-CH-O (acetal)',
    description:
      'Protons on carbon bonded to two oxygen atoms (acetal/hemiacetal). The dual oxygen deshielding places these in a characteristic narrow range. Important in carbohydrate chemistry.',
    multiplicity: 'singlet or doublet',
    commonExamples: [
      'Dimethyl acetal (4.47)',
      'Glucose anomeric H (4.6-5.4)',
      '1,3-Dioxolane (4.75)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'h-aromatic',
    chemicalShiftMin: 6.0,
    chemicalShiftMax: 8.5,
    environment: 'Ar-H (aromatic)',
    description:
      'Aromatic ring protons strongly deshielded by ring current effect. Electron-donating groups (OH, NH2, OR) shift upfield; electron-withdrawing groups (NO2, CN, COR) shift downfield. Coupling: ortho J = 6-10 Hz, meta J = 1-3 Hz, para J = 0-1 Hz.',
    multiplicity: 'singlet, doublet, triplet, or multiplet',
    commonExamples: [
      'Benzene (7.36)',
      'Toluene ArH (7.17)',
      'Naphthalene (7.4-7.9)',
    ],
    category: 'Aromatic',
  },
  {
    id: 'h-aldehyde',
    chemicalShiftMin: 8.0,
    chemicalShiftMax: 10.0,
    environment: 'CHO (aldehyde)',
    description:
      'Aldehyde protons are strongly deshielded by both the electronegative oxygen and the C=O anisotropy. Highly diagnostic singlet or doublet. Small coupling to alpha protons (J ~ 2-3 Hz).',
    multiplicity: 'singlet or doublet',
    commonExamples: [
      'Formaldehyde (9.60)',
      'Acetaldehyde CHO (9.80)',
      'Benzaldehyde CHO (9.99)',
    ],
    category: 'Carbonyl',
  },
  {
    id: 'h-carboxylic-acid',
    chemicalShiftMin: 9.0,
    chemicalShiftMax: 11.0,
    environment: 'COOH (carboxylic acid)',
    description:
      'Carboxylic acid O-H protons are extremely deshielded due to strong intramolecular hydrogen bonding and the electron-withdrawing carbonyl. Often very broad. D2O exchangeable.',
    multiplicity: 'broad singlet',
    commonExamples: [
      'Acetic acid COOH (11.42)',
      'Benzoic acid COOH (12.0)',
      'Formic acid COOH (8.08)',
    ],
    category: 'Exchangeable',
  },
  {
    id: 'h-chelated-oh-enol',
    chemicalShiftMin: 10.0,
    chemicalShiftMax: 13.0,
    environment: 'Chelated OH, enol',
    description:
      'Strongly hydrogen-bonded hydroxyl protons such as enols of beta-diketones and chelated phenolic OH. The very strong intramolecular H-bond causes extreme downfield shift. Often sharp singlets.',
    multiplicity: 'singlet',
    commonExamples: [
      'Acetylacetone enol OH (11.5)',
      '2-Hydroxybenzaldehyde OH (11.0)',
      'Dimedone enol (11.2)',
    ],
    category: 'Exchangeable',
  },
];

// -----------------------------------------------------------------------------
// 13C NMR Chemical Shifts
// -----------------------------------------------------------------------------

export const CARBON_NMR_SHIFTS: NMRShift[] = [
  {
    id: 'c-alkyl-general',
    chemicalShiftMin: 0,
    chemicalShiftMax: 40,
    environment: 'Alkyl carbons (sp3)',
    description:
      'General range for sp3 hybridized carbons in alkyl chains. The exact shift depends on substitution pattern and nearby functional groups.',
    commonExamples: [
      'Methane (−2.3)',
      'Ethane (5.7)',
      'Cyclohexane (26.9)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'c-methyl',
    chemicalShiftMin: 10,
    chemicalShiftMax: 25,
    environment: '-CH3',
    description:
      'Primary carbon (methyl groups). Most shielded of common organic carbons. DEPT shows negative phase.',
    commonExamples: [
      'Ethane CH3 (5.7)',
      'Propane CH3 (15.8)',
      'Toluene CH3 (21.4)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'c-methylene',
    chemicalShiftMin: 15,
    chemicalShiftMax: 50,
    environment: '-CH2-',
    description:
      'Secondary carbon (methylene groups). DEPT shows negative phase. Shift increases with proximity to electron-withdrawing groups.',
    commonExamples: [
      'Cyclohexane CH2 (26.9)',
      'n-Hexane CH2 (22.7-31.6)',
      'Cycloheptane CH2 (28.4)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'c-methine',
    chemicalShiftMin: 20,
    chemicalShiftMax: 60,
    environment: '>CH-',
    description:
      'Tertiary carbon (methine). DEPT shows positive phase. More deshielded than methylene due to additional alkyl substituents.',
    commonExamples: [
      'Isobutane CH (25.4)',
      'Isopentane CH (27.8)',
      'Adamantane CH (38.2)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'c-quaternary',
    chemicalShiftMin: 25,
    chemicalShiftMax: 65,
    environment: '>C< (quaternary)',
    description:
      'Quaternary sp3 carbon. Absent in DEPT spectrum (no attached protons). Most deshielded of simple alkyl carbons.',
    commonExamples: [
      'Neopentane C (31.7)',
      'tert-Butanol C (68.9)',
      'Di-tert-butyl C (35.0)',
    ],
    category: 'Alkyl',
  },
  {
    id: 'c-alpha-nitrogen',
    chemicalShiftMin: 40,
    chemicalShiftMax: 80,
    environment: 'C-N (amines)',
    description:
      'Carbons bonded to nitrogen. The electronegative nitrogen deshields the attached carbon. Primary amines are less deshielded than tertiary.',
    commonExamples: [
      'Methylamine CH3 (26.9)',
      'Trimethylamine CH3 (47.5)',
      'Pyridine C2 (149.9)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'c-alpha-oxygen',
    chemicalShiftMin: 50,
    chemicalShiftMax: 90,
    environment: 'C-O (alcohols, ethers)',
    description:
      'Carbons bonded to oxygen. Oxygen is more electronegative than nitrogen, causing greater deshielding. Very diagnostic for identifying ether and alcohol carbons.',
    commonExamples: [
      'Methanol CH3 (49.0)',
      'Ethanol CH2 (57.8)',
      'Diethyl ether OCH2 (65.9)',
    ],
    category: 'Heteroatom-adjacent',
  },
  {
    id: 'c-alkyne',
    chemicalShiftMin: 65,
    chemicalShiftMax: 90,
    environment: 'C triple bond C (alkynes)',
    description:
      'Acetylenic carbons (sp hybridized). Despite the higher s-character, the cylindrical electron density of the triple bond provides partial shielding.',
    commonExamples: [
      'Acetylene (71.9)',
      'Propyne C1 (67.9)',
      'Propyne C2 (74.8)',
    ],
    category: 'Unsaturated',
  },
  {
    id: 'c-alkene',
    chemicalShiftMin: 100,
    chemicalShiftMax: 150,
    environment: 'C=C (alkenes)',
    description:
      'Olefinic carbons (sp2 hybridized). Deshielded by the planar pi system. Electron-donating groups cause upfield shift; electron-withdrawing groups cause downfield shift.',
    commonExamples: [
      'Ethylene (123.3)',
      'Cyclohexene (127.3)',
      'Styrene vinyl C (113.4)',
    ],
    category: 'Unsaturated',
  },
  {
    id: 'c-aromatic',
    chemicalShiftMin: 110,
    chemicalShiftMax: 160,
    environment: 'Aromatic carbons',
    description:
      'Aromatic ring carbons. Ring current and substituent effects determine exact shift. Substituted carbons without H are identified by absence in DEPT. Ipso carbons to electron-donating groups shift upfield.',
    commonExamples: [
      'Benzene (128.4)',
      'Toluene C1 (137.8)',
      'Phenol C1 (155.0)',
    ],
    category: 'Aromatic',
  },
  {
    id: 'c-carbonyl-ester-amide-acid',
    chemicalShiftMin: 160,
    chemicalShiftMax: 180,
    environment: 'C=O (esters, amides, carboxylic acids)',
    description:
      'Carbonyl carbons of esters, amides, and carboxylic acids. Resonance donation from O or N partially shields the carbonyl carbon compared to ketones/aldehydes. Absent in DEPT.',
    commonExamples: [
      'Acetic acid C=O (177.3)',
      'Methyl acetate C=O (170.7)',
      'Acetamide C=O (172.6)',
    ],
    category: 'Carbonyl',
  },
  {
    id: 'c-carbonyl-aldehyde-ketone',
    chemicalShiftMin: 190,
    chemicalShiftMax: 220,
    environment: 'C=O (aldehydes, ketones)',
    description:
      'Carbonyl carbons of aldehydes and ketones. Most deshielded common carbon environments. Aldehydes appear in DEPT (attached H); ketone carbonyls are absent. Very diagnostic.',
    commonExamples: [
      'Acetone C=O (206.7)',
      'Acetaldehyde C=O (200.0)',
      'Cyclohexanone C=O (211.2)',
    ],
    category: 'Carbonyl',
  },
];

// -----------------------------------------------------------------------------
// Common NMR Solvents
// -----------------------------------------------------------------------------

export const NMR_SOLVENTS: NMRSolvent[] = [
  {
    id: 'cdcl3',
    name: 'Chloroform-d',
    formula: 'CDCl3',
    protonShift: 7.26,
    carbonShift: 77.16,
    boilingPoint: 61,
    notes:
      'Most commonly used NMR solvent. Residual CHCl3 appears at 7.26 ppm. 13C triplet centered at 77.16 ppm (1:1:1 from deuterium coupling). Good for non-polar to moderately polar compounds.',
  },
  {
    id: 'dmso-d6',
    name: 'DMSO-d6',
    formula: '(CD3)2SO',
    protonShift: 2.50,
    carbonShift: 39.52,
    boilingPoint: 189,
    notes:
      'Excellent for polar compounds and compounds with exchangeable protons. Residual DMSO appears as quintet at 2.50 ppm. 13C septet at 39.52 ppm. Hygroscopic, absorbs water (peak at ~3.33 ppm).',
  },
  {
    id: 'd2o',
    name: 'Deuterium oxide',
    formula: 'D2O',
    protonShift: 4.79,
    carbonShift: null,
    boilingPoint: 101,
    notes:
      'Used for water-soluble compounds and to identify exchangeable protons (D2O shake). Residual HOD appears at 4.79 ppm. No useful 13C signal. pH-sensitive shift.',
  },
  {
    id: 'cd3od',
    name: 'Methanol-d4',
    formula: 'CD3OD',
    protonShift: 3.31,
    carbonShift: 49.00,
    boilingPoint: 64,
    notes:
      'Good for moderately polar compounds. Residual CHD2OD appears as quintet at 3.31 ppm. 13C septet at 49.00 ppm. Exchanges with OH, NH protons.',
  },
  {
    id: 'acetone-d6',
    name: 'Acetone-d6',
    formula: '(CD3)2CO',
    protonShift: 2.05,
    carbonShift: 29.84,
    boilingPoint: 56,
    notes:
      'Good general-purpose solvent. Residual acetone appears as quintet at 2.05 ppm. 13C: methyl septet at 29.84 ppm, carbonyl at 206.26 ppm. Low viscosity gives sharp lines.',
  },
  {
    id: 'benzene-d6',
    name: 'Benzene-d6',
    formula: 'C6D6',
    protonShift: 7.16,
    carbonShift: 128.06,
    boilingPoint: 80,
    notes:
      'Used when CDCl3 signals overlap with analyte aromatic signals. Residual C6D5H at 7.16 ppm. 13C triplet at 128.06 ppm. Useful for studying aromatic solvent-induced shifts (ASIS).',
  },
  {
    id: 'tms',
    name: 'TMS (reference)',
    formula: '(CH3)4Si',
    protonShift: 0.00,
    carbonShift: 0.00,
    boilingPoint: 27,
    notes:
      'Universal internal reference standard. All 12 protons are equivalent, giving a single sharp peak at 0.00 ppm by definition. Chemically inert, volatile, easily removed.',
  },
];

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Find all 1H NMR environments that match a given chemical shift value.
 * Returns shifts sorted by specificity (narrower range first).
 */
export function identifyProtonShift(ppm: number): NMRShift[] {
  return PROTON_NMR_SHIFTS.filter(
    (shift) => ppm >= shift.chemicalShiftMin && ppm <= shift.chemicalShiftMax
  ).sort(
    (a, b) =>
      a.chemicalShiftMax -
      a.chemicalShiftMin -
      (b.chemicalShiftMax - b.chemicalShiftMin)
  );
}

/**
 * Find all 13C NMR environments that match a given chemical shift value.
 * Returns shifts sorted by specificity (narrower range first).
 */
export function identifyCarbonShift(ppm: number): NMRShift[] {
  return CARBON_NMR_SHIFTS.filter(
    (shift) => ppm >= shift.chemicalShiftMin && ppm <= shift.chemicalShiftMax
  ).sort(
    (a, b) =>
      a.chemicalShiftMax -
      a.chemicalShiftMin -
      (b.chemicalShiftMax - b.chemicalShiftMin)
  );
}

/**
 * Search both 1H and 13C NMR shift data by environment name, description,
 * category, or examples. Case-insensitive.
 */
export function searchNMR(query: string): NMRShift[] {
  const lowerQuery = query.toLowerCase();

  const allShifts: NMRShift[] = [...PROTON_NMR_SHIFTS, ...CARBON_NMR_SHIFTS];

  return allShifts.filter((shift) => {
    const searchableText = [
      shift.environment,
      shift.description,
      shift.category,
      ...shift.commonExamples,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}
