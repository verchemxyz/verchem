/*
 * ============================================================================
 * Curated, RDKit-verified SMILES library  (VerChem Wedge W2)
 * ============================================================================
 *
 * Maps `Compound.id` → canonical SMILES for MOLECULAR (covalent) compounds
 * where substructure search is chemically meaningful.
 *
 * Scope (by design):
 *   ✅ organic molecules, pharmaceuticals, amino acids, molecular solvents
 *   ❌ ionic salts, metals/alloys, ceramics, network/mineral solids
 *      (a discrete SMILES is not meaningful — e.g. you do not
 *       substructure-search NaCl or a steel alloy)
 *
 * INTEGRITY GUARANTEE — every entry below is cross-checked against the
 * independently-sourced molecular formula in the compounds DB:
 *
 *     RDKit.get_mol(smiles) → element composition  ===  parseFormula(formula)
 *
 * The check runs in __tests__/compound-smiles-verification.test.ts using the
 * REAL RDKit WASM module (not a mock).  A typo that produces a different
 * formula fails the test.  This is the "verified even in our seed data"
 * principle of the AI-First Verified Chemistry wedge.
 *
 * NOTE: a constitutional isomer with an identical formula (e.g. swapping
 * ethanol CCO for dimethyl ether COC) is NOT caught automatically; those
 * are guarded by careful authoring of well-known textbook structures.
 *
 * SCOPE — CONSTITUTIONAL (2D) STRUCTURES ONLY:
 *   These SMILES encode connectivity, not stereochemistry. We therefore do
 *   NOT include entries that would be misrepresented without stereo/mixture
 *   data:
 *     - D-amino acids (would collapse to the same achiral SMILES as their
 *       L-enantiomer — a misleading duplicate). The L-form is kept as the
 *       representative constitutional structure.
 *     - Isomer mixtures (e.g. "Xylene (Mixed)") — the discrete o-/m-/p-xylene
 *       structures are present individually instead.
 *   This exclusion is enforced by a regression test (see
 *   compound-smiles-verification.test.ts). E/Z double-bond geometry IS encoded
 *   where it distinguishes named compounds (maleic vs fumaric, oleic, linoleic).
 * ============================================================================
 */

export const SMILES_BY_ID: Record<string, string> = {
  // --- Hydrocarbons: alkanes (id = name) ---
  methane: 'C',
  ethane: 'CC',
  propane: 'CCC',
  butane: 'CCCC',
  pentane: 'CCCCC',
  hexane: 'CCCCCC',
  heptane: 'CCCCCCC',
  octane: 'CCCCCCCC',
  nonane: 'CCCCCCCCC',
  decane: 'CCCCCCCCCC',

  // --- Hydrocarbons: alkenes (1-alkene) ---
  ethene: 'C=C',
  propene: 'CC=C',
  butene: 'CCC=C',
  pentene: 'CCCC=C',
  hexene: 'CCCCC=C',
  heptene: 'CCCCCC=C',
  octene: 'CCCCCCC=C',
  nonene: 'CCCCCCCC=C',
  decene: 'CCCCCCCCC=C',

  // --- Hydrocarbons: alkynes (1-alkyne) ---
  ethyne: 'C#C',
  propyne: 'CC#C',
  butyne: 'CCC#C',
  pentyne: 'CCCC#C',
  hexyne: 'CCCCC#C',
  heptyne: 'CCCCCC#C',
  octyne: 'CCCCCCC#C',
  nonyne: 'CCCCCCCC#C',
  decyne: 'CCCCCCCCC#C',

  cyclohexane: 'C1CCCCC1',
  isoprene: 'CC(=C)C=C',

  // --- Alcohols ---
  methanol: 'CO',
  ethanol: 'CCO',
  'propanol-1': 'CCCO',
  'propanol-2': 'CC(C)O',
  'butanol-1': 'CCCCO',
  'butanol-2': 'CCC(C)O',
  'tert-butanol': 'CC(C)(C)O',
  'pentanol-1': 'CCCCCO',
  'hexanol-1': 'CCCCCCO',
  'heptanol-1': 'CCCCCCCO',
  'octanol-1': 'CCCCCCCCO',
  'nonanol-1': 'CCCCCCCCCO',
  'decanol-1': 'CCCCCCCCCCO',
  'ethylene-glycol': 'OCCO',
  'propylene-glycol': 'CC(O)CO',
  glycerol: 'OCC(O)CO',
  'benzyl-alcohol': 'OCc1ccccc1',
  'phenethyl-alcohol': 'OCCc1ccccc1',
  cyclohexanol: 'OC1CCCCC1',
  'allyl-alcohol': 'C=CCO',

  // --- Aromatics ---
  benzene: 'c1ccccc1',
  toluene: 'Cc1ccccc1',
  ethylbenzene: 'CCc1ccccc1',
  styrene: 'C=Cc1ccccc1',
  'o-xylene': 'Cc1ccccc1C',
  'm-xylene': 'Cc1cccc(C)c1',
  'p-xylene': 'Cc1ccc(C)cc1',
  cumene: 'CC(C)c1ccccc1',
  mesitylene: 'Cc1cc(C)cc(C)c1',
  chlorobenzene: 'Clc1ccccc1',
  nitrobenzene: 'O=[N+]([O-])c1ccccc1',
  phenol: 'Oc1ccccc1',
  'p-cresol': 'Cc1ccc(O)cc1',
  naphthalene: 'c1ccc2ccccc2c1',
  anthracene: 'c1ccc2cc3ccccc3cc2c1',
  phenanthrene: 'c1ccc2c(c1)ccc1ccccc12',
  biphenyl: 'c1ccc(-c2ccccc2)cc1',
  quinoline: 'c1ccc2ncccc2c1',
  indole: 'c1ccc2[nH]ccc2c1',
  pyrrole: 'c1cc[nH]c1',
  fluorobenzene: 'Fc1ccccc1',
  bromobenzene: 'Brc1ccccc1',
  benzonitrile: 'N#Cc1ccccc1',
  resorcinol: 'Oc1cccc(O)c1',
  hydroquinone: 'Oc1ccc(O)cc1',

  // --- Carboxylic acids ---
  'propionic-acid': 'CCC(=O)O',
  'butyric-acid': 'CCCC(=O)O',
  'valeric-acid': 'CCCCC(=O)O',
  'caproic-acid': 'CCCCCC(=O)O',
  'heptanoic-acid': 'CCCCCCC(=O)O',
  'octanoic-acid': 'CCCCCCCC(=O)O',
  'nonanoic-acid': 'CCCCCCCCC(=O)O',
  'decanoic-acid': 'CCCCCCCCCC(=O)O',
  'lauric-acid': 'CCCCCCCCCCCC(=O)O',
  'myristic-acid': 'CCCCCCCCCCCCCC(=O)O',
  'palmitic-acid': 'CCCCCCCCCCCCCCCC(=O)O',
  'stearic-acid': 'CCCCCCCCCCCCCCCCCC(=O)O',
  'oleic-acid': 'CCCCCCCC/C=C\\CCCCCCCC(=O)O',
  'linoleic-acid': 'CCCCC/C=C\\C/C=C\\CCCCCCCC(=O)O',
  'benzoic-acid': 'O=C(O)c1ccccc1',
  'salicylic-acid': 'O=C(O)c1ccccc1O',
  'tartaric-acid': 'OC(=O)C(O)C(O)C(=O)O',
  'maleic-acid': 'OC(=O)/C=C\\C(=O)O',
  'fumaric-acid': 'OC(=O)/C=C/C(=O)O',
  'succinic-acid': 'OC(=O)CCC(=O)O',

  // --- Aldehydes & ketones ---
  formaldehyde: 'C=O',
  acetaldehyde: 'CC=O',
  propionaldehyde: 'CCC=O',
  butyraldehyde: 'CCCC=O',
  benzaldehyde: 'O=Cc1ccccc1',
  acetone: 'CC(C)=O',
  'methyl-ethyl-ketone': 'CCC(C)=O',
  'diethyl-ketone': 'CCC(=O)CC',
  'methyl-isobutyl-ketone': 'CC(C)CC(C)=O',
  cyclohexanone: 'O=C1CCCCC1',
  acetophenone: 'CC(=O)c1ccccc1',
  propiophenone: 'CCC(=O)c1ccccc1',
  camphor: 'CC1(C)C2CCC1(C)C(=O)C2',
  acrolein: 'C=CC=O',
  crotonaldehyde: 'CC=CC=O',
  glyoxal: 'O=CC=O',
  hydroxyacetone: 'CC(=O)CO',
  cyclopentanone: 'O=C1CCCC1',
  'heptan-2-one': 'CCCCCC(C)=O',
  'nonan-2-one': 'CCCCCCCC(C)=O',

  // --- Esters ---
  'methyl-formate': 'COC=O',
  'ethyl-formate': 'CCOC=O',
  'methyl-acetate': 'COC(C)=O',
  'ethyl-acetate': 'CCOC(C)=O',
  'propyl-acetate': 'CCCOC(C)=O',
  'butyl-acetate': 'CCCCOC(C)=O',
  'isoamyl-acetate': 'CC(C)CCOC(C)=O',
  'ethyl-butyrate': 'CCCC(=O)OCC',
  'ethyl-lactate': 'CCOC(=O)C(C)O',
  'methyl-benzoate': 'COC(=O)c1ccccc1',
  'ethyl-benzoate': 'CCOC(=O)c1ccccc1',
  'methyl-salicylate': 'COC(=O)c1ccccc1O',
  'methyl-methacrylate': 'COC(=O)C(=C)C',
  'dimethyl-phthalate': 'COC(=O)c1ccccc1C(=O)OC',
  'diethyl-phthalate': 'CCOC(=O)c1ccccc1C(=O)OCC',

  // --- Amines & amides ---
  methylamine: 'CN',
  ethylamine: 'CCN',
  propylamine: 'CCCN',
  butylamine: 'CCCCN',
  dimethylamine: 'CNC',
  trimethylamine: 'CN(C)C',
  diethylamine: 'CCNCC',
  aniline: 'Nc1ccccc1',
  pyridine: 'c1ccncc1',
  piperidine: 'C1CCNCC1',
  morpholine: 'C1COCCN1',
  benzylamine: 'NCc1ccccc1',
  hexamethylenediamine: 'NCCCCCCN',
  acetamide: 'CC(N)=O',
  urea: 'NC(N)=O',

  // --- Amino acids (neutral L-form; matches molecular formula) ---
  glycine: 'NCC(=O)O',
  alanine: 'CC(N)C(=O)O',
  valine: 'CC(C)C(N)C(=O)O',
  leucine: 'CC(C)CC(N)C(=O)O',
  isoleucine: 'CCC(C)C(N)C(=O)O',
  proline: 'OC(=O)C1CCCN1',
  phenylalanine: 'NC(Cc1ccccc1)C(=O)O',
  tryptophan: 'NC(Cc1c[nH]c2ccccc12)C(=O)O',
  tyrosine: 'NC(Cc1ccc(O)cc1)C(=O)O',
  methionine: 'CSCCC(N)C(=O)O',
  cysteine: 'NC(CS)C(=O)O',
  serine: 'NC(CO)C(=O)O',
  threonine: 'CC(O)C(N)C(=O)O',
  asparagine: 'NC(CC(N)=O)C(=O)O',
  glutamine: 'NC(CCC(N)=O)C(=O)O',
  'aspartic-acid': 'NC(CC(=O)O)C(=O)O',
  'glutamic-acid': 'NC(CCC(=O)O)C(=O)O',
  lysine: 'NCCCCC(N)C(=O)O',
  arginine: 'NC(CCCNC(N)=N)C(=O)O',
  histidine: 'NC(Cc1c[nH]cn1)C(=O)O',
  ornithine: 'NCCCC(N)C(=O)O',
  citrulline: 'NC(CCCNC(N)=O)C(=O)O',
  taurine: 'NCCS(=O)(=O)O',
  gaba: 'NCCCC(=O)O',
  'beta-alanine': 'NCCC(=O)O',
  creatine: 'CN(CC(=O)O)C(N)=N',
  homocysteine: 'NC(CCS)C(=O)O',
  // d-alanine / d-serine intentionally omitted: their achiral SMILES would
  // duplicate alanine / serine. Stereochemistry is out of scope (see header).
  'n-acetyl-cysteine': 'CC(=O)NC(CS)C(=O)O',
  hydroxyproline: 'OC1CNC(C1)C(=O)O',
  hydroxylysine: 'NCC(O)CCC(N)C(=O)O',
  'pyroglutamic-acid': 'OC(=O)C1CCC(=O)N1',
  theanine: 'CCNC(=O)CCC(N)C(=O)O',

  // --- Pharmaceuticals (well-known structures) ---
  aspirin: 'CC(=O)Oc1ccccc1C(=O)O',
  paracetamol: 'CC(=O)Nc1ccc(O)cc1',
  ibuprofen: 'CC(C)Cc1ccc(C(C)C(=O)O)cc1',
  naproxen: 'COc1ccc2cc(C(C)C(=O)O)ccc2c1',
  caffeine: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C',
  theobromine: 'Cn1cnc2c1c(=O)[nH]c(=O)n2C',
  metformin: 'CN(C)C(=N)NC(N)=N',
  lidocaine: 'CCN(CC)CC(=O)Nc1c(C)cccc1C',
  diphenhydramine: 'CN(C)CCOC(c1ccccc1)c1ccccc1',
  pseudoephedrine: 'CC(NC)C(O)c1ccccc1',
  epinephrine: 'CNCC(O)c1ccc(O)c(O)c1',
  salbutamol: 'CC(C)(C)NCC(O)c1ccc(O)c(CO)c1',
  amitriptyline: 'CN(C)CCC=C1c2ccccc2CCc2ccccc21',

  // --- Molecular solvents (extra ids beyond organic categories above) ---
  'water-solvent': 'O',
  'methanol-solvent': 'CO',
  'ethanol-solvent': 'CCO',
  '1-propanol': 'CCCO',
  '2-propanol': 'CC(C)O',
  '1-butanol': 'CCCCO',
  '2-butanol': 'CCC(C)O',
  'glycerol-solvent': 'OCC(O)CO',
  'formic-acid-solvent': 'OC=O',
  'acetic-acid-solvent': 'CC(=O)O',
  acetonitrile: 'CC#N',
  dmf: 'CN(C)C=O',
  dmso: 'CS(C)=O',
  nmp: 'CN1CCCC1=O',
  thf: 'C1CCOC1',
  '1,4-dioxane': 'C1COCCO1',
  'benzene-solvent': 'c1ccccc1',
  // 'xylene' (Xylene, Mixed) intentionally omitted — it is an isomer mixture;
  // the discrete o-/m-/p-xylene structures are in the aromatics section.
  dcm: 'ClCCl',
  chloroform: 'ClC(Cl)Cl',
  'carbon-tetrachloride': 'ClC(Cl)(Cl)Cl',
  '1,2-dichloroethane': 'ClCCCl',
  perchloroethylene: 'ClC(Cl)=C(Cl)Cl',
  'diethyl-ether': 'CCOCC',
  'diisopropyl-ether': 'CC(C)OC(C)C',
  mtbe: 'COC(C)(C)C',
  '2-methoxyethanol': 'COCCO',
  'isopropyl-acetate': 'CC(C)OC(C)=O',
}
