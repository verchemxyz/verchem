import { PredictionRule, Reagent } from '@/lib/types/organic-chemistry'

/**
 * Reaction Prediction Rules
 * Maps: functional group + reagent → product functional group
 */
export const PREDICTION_RULES: PredictionRule[] = [
  // ============================================
  // Alkene Reactions
  // ============================================
  {
    fromGroup: 'alkene',
    reagent: 'HBr',
    reagentLabel: 'HBr (no peroxides)',
    toGroup: 'alkyl-halide',
    reactionName: 'Markovnikov Addition',
    mechanismType: 'Electrophilic Addition',
    explanation: 'HBr adds across the double bond with Markovnikov regiochemistry. H goes to the less substituted carbon, Br to the more substituted.',
    selectivity: 'Markovnikov — Br on more substituted C',
  },
  {
    fromGroup: 'alkene',
    reagent: 'HBr_ROOR',
    reagentLabel: 'HBr + ROOR (peroxides)',
    toGroup: 'alkyl-halide',
    reactionName: 'Anti-Markovnikov Addition',
    mechanismType: 'Radical Chain',
    explanation: 'With peroxides, HBr adds via radical mechanism. Br ends up on the less substituted carbon (anti-Markovnikov).',
    selectivity: 'Anti-Markovnikov — Br on less substituted C',
  },
  {
    fromGroup: 'alkene',
    reagent: 'H2O_H2SO4',
    reagentLabel: 'H₂O / H₂SO₄',
    toGroup: 'alcohol',
    reactionName: 'Acid-Catalyzed Hydration',
    mechanismType: 'Electrophilic Addition',
    explanation: 'Water adds across the double bond with Markovnikov regiochemistry. OH ends up on the more substituted carbon.',
    selectivity: 'Markovnikov — OH on more substituted C',
  },
  {
    fromGroup: 'alkene',
    reagent: 'BH3_H2O2',
    reagentLabel: 'BH₃·THF, then H₂O₂/NaOH',
    toGroup: 'alcohol',
    reactionName: 'Hydroboration-Oxidation',
    mechanismType: 'Concerted + Oxidation',
    explanation: 'Two-step sequence gives anti-Markovnikov, syn addition of OH. The OH ends up on the less substituted carbon.',
    selectivity: 'Anti-Markovnikov, syn — OH on less substituted C',
  },
  {
    fromGroup: 'alkene',
    reagent: 'Br2',
    reagentLabel: 'Br₂ / CCl₄',
    toGroup: 'alkyl-halide',
    reactionName: 'Halogenation of Alkenes',
    mechanismType: 'Electrophilic Addition',
    explanation: 'Br₂ adds across the double bond via a bromonium ion intermediate, giving anti addition (trans product).',
    selectivity: 'Anti addition — two Br on opposite faces',
  },
  {
    fromGroup: 'alkene',
    reagent: 'H2_Pd',
    reagentLabel: 'H₂ / Pd/C',
    toGroup: 'alkane',
    reactionName: 'Catalytic Hydrogenation',
    mechanismType: 'Heterogeneous Catalysis',
    explanation: 'Both H atoms add to the same face of the double bond (syn addition) on the metal surface.',
    selectivity: 'Syn addition',
  },
  {
    fromGroup: 'alkene',
    reagent: 'OsO4',
    reagentLabel: 'OsO₄ / NMO (or KMnO₄ cold)',
    toGroup: 'alcohol',
    mechanismType: 'Concerted [3+2]',
    explanation: 'Syn dihydroxylation: both OH groups add to the same face of the double bond, giving a cis-diol.',
    selectivity: 'Syn — cis-1,2-diol',
  },
  {
    fromGroup: 'alkene',
    reagent: 'mCPBA',
    reagentLabel: 'mCPBA',
    toGroup: 'epoxide',
    mechanismType: 'Concerted',
    explanation: 'The peracid delivers an oxygen atom to the alkene, forming a three-membered epoxide ring. Stereospecific: cis-alkene gives cis-epoxide.',
    selectivity: 'Retention of alkene geometry',
  },
  {
    fromGroup: 'alkene',
    reagent: 'O3',
    reagentLabel: 'O₃, then DMS (or Zn)',
    toGroup: 'aldehyde',
    reactionName: 'Ozonolysis',
    mechanismType: 'Concerted + Cleavage',
    explanation: 'Ozone cleaves the C=C double bond completely. Each carbon becomes a carbonyl. Reductive workup (DMS/Zn) gives aldehydes/ketones.',
    selectivity: 'Cleaves double bond into two carbonyls',
  },

  // ============================================
  // Alcohol Reactions
  // ============================================
  {
    fromGroup: 'alcohol',
    reagent: 'H2SO4_heat',
    reagentLabel: 'H₂SO₄, heat',
    toGroup: 'alkene',
    reactionName: 'Alcohol Dehydration',
    mechanismType: 'E1 or E2',
    explanation: 'Acid-catalyzed elimination of water. Follows Zaitsev\'s rule (more substituted alkene favored).',
    selectivity: 'Zaitsev — more substituted alkene',
  },
  {
    fromGroup: 'alcohol',
    reagent: 'PCC',
    reagentLabel: 'PCC / CH₂Cl₂',
    toGroup: 'aldehyde',
    reactionName: 'PCC Oxidation',
    mechanismType: 'Cr(VI) Oxidation',
    explanation: 'Mild, selective oxidation. Primary alcohols → aldehydes (stops here, no over-oxidation). Secondary → ketones.',
    selectivity: '1° → aldehyde, 2° → ketone, 3° → no reaction',
  },
  {
    fromGroup: 'alcohol',
    reagent: 'Jones',
    reagentLabel: 'CrO₃/H₂SO₄ (Jones reagent)',
    toGroup: 'carboxylic-acid',
    reactionName: 'Jones Oxidation',
    mechanismType: 'Cr(VI) Oxidation',
    explanation: 'Strong oxidation. Primary alcohols oxidized all the way to carboxylic acids (cannot stop at aldehyde). Secondary → ketones.',
    selectivity: '1° → carboxylic acid, 2° → ketone',
  },
  {
    fromGroup: 'alcohol',
    reagent: 'NaH_RX',
    reagentLabel: 'NaH, then R-X (1° halide)',
    toGroup: 'ether',
    reactionName: 'Williamson Ether Synthesis',
    mechanismType: 'SN2',
    explanation: 'The alcohol is deprotonated to form an alkoxide, which then does SN2 on a primary alkyl halide.',
  },
  {
    fromGroup: 'alcohol',
    reagent: 'SOCl2',
    reagentLabel: 'SOCl₂ / pyridine',
    toGroup: 'alkyl-halide',
    mechanismType: 'SNi or SN2',
    explanation: 'Converts alcohol to alkyl chloride. SOCl₂ activates the OH as a leaving group. With pyridine: inversion (SN2-like).',
    selectivity: 'Inversion with pyridine, retention without',
  },

  // ============================================
  // Aldehyde/Ketone Reactions
  // ============================================
  {
    fromGroup: 'aldehyde',
    reagent: 'NaBH4',
    reagentLabel: 'NaBH₄ / MeOH',
    toGroup: 'alcohol',
    reactionName: 'NaBH₄ Reduction',
    mechanismType: 'Nucleophilic Addition (H⁻)',
    explanation: 'Mild reducing agent delivers H⁻ to the carbonyl carbon. Selective for aldehydes/ketones (does not reduce esters or acids).',
  },
  {
    fromGroup: 'ketone',
    reagent: 'NaBH4',
    reagentLabel: 'NaBH₄ / MeOH',
    toGroup: 'alcohol',
    reactionName: 'NaBH₄ Reduction',
    mechanismType: 'Nucleophilic Addition (H⁻)',
    explanation: 'Reduces ketones to secondary alcohols. Selective: does not reduce esters, amides, or carboxylic acids.',
  },
  {
    fromGroup: 'aldehyde',
    reagent: 'RMgBr',
    reagentLabel: 'RMgBr (Grignard), then H₃O⁺',
    toGroup: 'alcohol',
    reactionName: 'Grignard Reaction',
    mechanismType: 'Nucleophilic Addition',
    explanation: 'Grignard reagent adds R group to aldehyde carbonyl. Aldehyde → secondary alcohol. New C-C bond formed.',
  },
  {
    fromGroup: 'ketone',
    reagent: 'RMgBr',
    reagentLabel: 'RMgBr (Grignard), then H₃O⁺',
    toGroup: 'alcohol',
    reactionName: 'Grignard Reaction',
    mechanismType: 'Nucleophilic Addition',
    explanation: 'Grignard reagent adds R group to ketone carbonyl. Ketone → tertiary alcohol. New C-C bond formed.',
  },
  {
    fromGroup: 'ketone',
    reagent: 'H2NNH2_KOH',
    reagentLabel: 'H₂NNH₂, KOH, 200°C',
    toGroup: 'alkane',
    reactionName: 'Wolff-Kishner Reduction',
    mechanismType: 'Hydrazone Decomposition',
    explanation: 'Complete removal of C=O → CH₂. Basic conditions. Complementary to Clemmensen (acidic conditions).',
    selectivity: 'Use when base-sensitive groups absent',
  },
  {
    fromGroup: 'ketone',
    reagent: 'mCPBA',
    reagentLabel: 'mCPBA (peracid)',
    toGroup: 'ester',
    reactionName: 'Baeyer-Villiger Oxidation',
    mechanismType: '1,2-Shift',
    explanation: 'Oxygen inserted between C=O and adjacent C. More substituted group migrates preferentially.',
    selectivity: 'Migratory aptitude: 3° > 2° > aryl > 1° > methyl',
  },
  {
    fromGroup: 'aldehyde',
    reagent: 'Wittig',
    reagentLabel: 'Ph₃P=CHR (Wittig reagent)',
    toGroup: 'alkene',
    reactionName: 'Wittig Reaction',
    mechanismType: 'Olefination',
    explanation: 'Converts C=O to C=C at the exact position. The alkene replaces the oxygen with complete positional control.',
  },
  {
    fromGroup: 'ketone',
    reagent: 'Wittig',
    reagentLabel: 'Ph₃P=CHR (Wittig reagent)',
    toGroup: 'alkene',
    reactionName: 'Wittig Reaction',
    mechanismType: 'Olefination',
    explanation: 'Converts C=O to C=C at the exact position. Non-stabilized ylides give Z-alkene, stabilized give E-alkene.',
  },

  // ============================================
  // Carboxylic Acid Reactions
  // ============================================
  {
    fromGroup: 'carboxylic-acid',
    reagent: 'LiAlH4',
    reagentLabel: 'LiAlH₄, then H₃O⁺',
    toGroup: 'alcohol',
    reactionName: 'LiAlH₄ Reduction',
    mechanismType: 'Nucleophilic Addition (2× H⁻)',
    explanation: 'Powerful reducing agent converts carboxylic acid all the way to primary alcohol (two hydride additions).',
  },
  {
    fromGroup: 'carboxylic-acid',
    reagent: 'ROH_H2SO4',
    reagentLabel: 'ROH / H₂SO₄ (cat.)',
    toGroup: 'ester',
    reactionName: 'Fischer Esterification',
    mechanismType: 'Nucleophilic Acyl Substitution',
    explanation: 'Acid-catalyzed condensation with alcohol. Equilibrium reaction — remove H₂O to drive forward.',
  },
  {
    fromGroup: 'carboxylic-acid',
    reagent: 'SOCl2',
    reagentLabel: 'SOCl₂',
    toGroup: 'acyl-halide',
    mechanismType: 'Nucleophilic Acyl Substitution',
    explanation: 'Converts -COOH to -COCl (acyl chloride). Activates the carboxylic acid for further reactions (amide formation, ester formation).',
  },

  // ============================================
  // Ester Reactions
  // ============================================
  {
    fromGroup: 'ester',
    reagent: 'NaOH',
    reagentLabel: 'NaOH / H₂O, heat',
    toGroup: 'carboxylic-acid',
    reactionName: 'Saponification',
    mechanismType: 'Nucleophilic Acyl Substitution',
    explanation: 'Base hydrolysis of ester → carboxylate salt + alcohol. Irreversible (carboxylate is stable). Acidify to get free acid.',
  },
  {
    fromGroup: 'ester',
    reagent: 'LiAlH4',
    reagentLabel: 'LiAlH₄, then H₃O⁺',
    toGroup: 'alcohol',
    reactionName: 'LiAlH₄ Reduction',
    mechanismType: 'Nucleophilic Addition (2× H⁻)',
    explanation: 'Reduces ester to TWO alcohols: RCH₂OH (from acid part) + R\'OH (from alcohol part). Cannot stop at aldehyde.',
  },

  // ============================================
  // Alkyl Halide Reactions
  // ============================================
  {
    fromGroup: 'alkyl-halide',
    reagent: 'NaOH',
    reagentLabel: 'NaOH / DMSO',
    toGroup: 'alcohol',
    reactionName: 'SN2 Reaction',
    mechanismType: 'SN2',
    explanation: 'Strong nucleophile (OH⁻) displaces halide via backside attack. Works best with methyl and primary substrates.',
    selectivity: 'Inversion of configuration',
  },
  {
    fromGroup: 'alkyl-halide',
    reagent: 'NaOEt_heat',
    reagentLabel: 'NaOEt / EtOH, heat',
    toGroup: 'alkene',
    reactionName: 'E2 Elimination',
    mechanismType: 'E2',
    explanation: 'Strong base removes β-hydrogen, forming alkene. Anti-periplanar geometry required. Zaitsev product (more substituted) favored.',
    selectivity: 'Zaitsev — more substituted alkene',
  },
  {
    fromGroup: 'alkyl-halide',
    reagent: 'Mg_ether',
    reagentLabel: 'Mg / anhydrous Et₂O',
    toGroup: 'alkyl-halide',
    reactionName: 'Grignard Reagent Formation',
    mechanismType: 'Oxidative Addition',
    explanation: 'Mg inserts into C-X bond to form RMgX (Grignard reagent). Must be anhydrous. Product is a powerful nucleophile/base.',
  },
  {
    fromGroup: 'alkyl-halide',
    reagent: 'NaCN',
    reagentLabel: 'NaCN / DMSO',
    toGroup: 'nitrile',
    reactionName: 'SN2 with Cyanide',
    mechanismType: 'SN2',
    explanation: 'CN⁻ is an excellent nucleophile. Displaces halide to form a nitrile, extending the carbon chain by one.',
    selectivity: 'Inversion; extends carbon chain by 1',
  },

  // ============================================
  // Amine Reactions
  // ============================================
  {
    fromGroup: 'amine',
    reagent: 'NaNO2_HCl',
    reagentLabel: 'NaNO₂ / HCl, 0°C, then CuX',
    toGroup: 'alkyl-halide',
    reactionName: 'Sandmeyer Reaction',
    mechanismType: 'Diazonium Chemistry',
    explanation: 'Aromatic amine → diazonium salt → aryl halide (with CuCl, CuBr) or nitrile (CuCN). Only works for aryl amines.',
    selectivity: 'CuCl→ArCl, CuBr→ArBr, CuCN→ArCN, KI→ArI',
  },

  // ============================================
  // Aromatic Reactions
  // ============================================
  {
    fromGroup: 'arene',
    reagent: 'Br2_FeBr3',
    reagentLabel: 'Br₂ / FeBr₃',
    toGroup: 'arene',
    reactionName: 'Electrophilic Aromatic Substitution',
    mechanismType: 'EAS',
    explanation: 'Bromination of aromatic ring. Lewis acid generates Br⁺ electrophile. EDG direct ortho/para; EWG direct meta.',
    selectivity: 'EDG → o/p; EWG → meta',
  },
  {
    fromGroup: 'arene',
    reagent: 'RCOCl_AlCl3',
    reagentLabel: 'RCOCl / AlCl₃',
    toGroup: 'ketone',
    reactionName: 'Friedel-Crafts Acylation',
    mechanismType: 'EAS',
    explanation: 'Introduces acyl group (C=O-R) onto aromatic ring. No rearrangement (unlike alkylation). Product is deactivated so no polyacylation.',
    selectivity: 'No polyacylation; no rearrangement',
  },
]

// ============================================
// Common Reagent Database
// ============================================

export const COMMON_REAGENTS: Reagent[] = [
  {
    id: 'nabh4',
    name: 'Sodium Borohydride',
    formula: 'NaBH₄',
    type: 'reducing',
    description: 'Mild, selective reducing agent for aldehydes and ketones.',
    commonUses: ['Aldehyde → 1° alcohol', 'Ketone → 2° alcohol'],
    hazards: ['Flammable', 'Reacts with water to release H₂'],
  },
  {
    id: 'lialh4',
    name: 'Lithium Aluminum Hydride',
    formula: 'LiAlH₄',
    type: 'reducing',
    description: 'Powerful, non-selective reducing agent. Reduces nearly all C=O groups.',
    commonUses: ['Ester → 2 alcohols', 'Acid → 1° alcohol', 'Amide → amine', 'Aldehyde/ketone → alcohol'],
    hazards: ['Violently reacts with water', 'Pyrophoric', 'Fire hazard'],
  },
  {
    id: 'pcc',
    name: 'Pyridinium Chlorochromate',
    formula: 'C₅H₅NH⁺CrO₃Cl⁻',
    type: 'oxidizing',
    description: 'Mild Cr(VI) oxidant. Stops at aldehyde for primary alcohols.',
    commonUses: ['1° alcohol → aldehyde', '2° alcohol → ketone'],
    hazards: ['Toxic (chromium)', 'Carcinogenic'],
  },
  {
    id: 'jones',
    name: 'Jones Reagent',
    formula: 'CrO₃/H₂SO₄/H₂O',
    type: 'oxidizing',
    description: 'Strong Cr(VI) oxidant. Over-oxidizes primary alcohols to carboxylic acids.',
    commonUses: ['1° alcohol → carboxylic acid', '2° alcohol → ketone'],
    hazards: ['Toxic (chromium)', 'Strongly acidic', 'Carcinogenic'],
  },
  {
    id: 'mcpba',
    name: 'meta-Chloroperoxybenzoic acid',
    formula: 'mCPBA',
    type: 'oxidizing',
    description: 'Peracid used for epoxidation of alkenes and Baeyer-Villiger oxidation of ketones.',
    commonUses: ['Alkene → epoxide', 'Ketone → ester/lactone (Baeyer-Villiger)'],
    hazards: ['Shock-sensitive', 'Oxidizer'],
  },
  {
    id: 'alcl3',
    name: 'Aluminum Chloride',
    formula: 'AlCl₃',
    type: 'catalyst',
    description: 'Lewis acid catalyst for Friedel-Crafts reactions and other electrophilic processes.',
    commonUses: ['Friedel-Crafts alkylation', 'Friedel-Crafts acylation', 'Diels-Alder catalyst'],
    hazards: ['Corrosive', 'Reacts violently with water', 'Fumes in air'],
  },
  {
    id: 'grubbs-ii',
    name: 'Grubbs 2nd Generation Catalyst',
    formula: 'Ru-based NHC complex',
    type: 'catalyst',
    description: 'Ruthenium carbene catalyst for olefin metathesis (RCM, CM, ROMP).',
    commonUses: ['Ring-closing metathesis', 'Cross metathesis', 'ROMP'],
    hazards: ['Expensive', 'Air-sensitive in solution'],
  },
  {
    id: 'pd-pph3-4',
    name: 'Tetrakis(triphenylphosphine)palladium(0)',
    formula: 'Pd(PPh₃)₄',
    type: 'catalyst',
    description: 'Pd(0) catalyst for cross-coupling reactions (Suzuki, Heck, Sonogashira, Stille).',
    commonUses: ['Suzuki coupling', 'Heck reaction', 'Sonogashira coupling'],
    hazards: ['Air-sensitive', 'Expensive'],
  },
  {
    id: 'bh3-thf',
    name: 'Borane-THF Complex',
    formula: 'BH₃·THF',
    type: 'reducing',
    description: 'Electrophilic boron reagent for hydroboration of alkenes.',
    commonUses: ['Hydroboration-oxidation (anti-Markovnikov hydration)'],
    hazards: ['Pyrophoric', 'Air-sensitive', 'Flammable'],
  },
  {
    id: 'socl2',
    name: 'Thionyl Chloride',
    formula: 'SOCl₂',
    type: 'other',
    description: 'Converts -OH and -COOH to chlorides. Byproducts (SO₂, HCl) are gases that escape.',
    commonUses: ['Alcohol → alkyl chloride', 'Carboxylic acid → acyl chloride'],
    hazards: ['Corrosive', 'Reacts with water', 'Toxic fumes'],
  },
]

// ============================================
// Helper Functions
// ============================================

export function predictReaction(
  functionalGroupId: string,
  reagentId: string
): PredictionRule | undefined {
  return PREDICTION_RULES.find(
    r => r.fromGroup === functionalGroupId && r.reagent === reagentId
  )
}

export function getReactionsForGroup(functionalGroupId: string): PredictionRule[] {
  return PREDICTION_RULES.filter(r => r.fromGroup === functionalGroupId)
}

export function getReagentById(id: string): Reagent | undefined {
  return COMMON_REAGENTS.find(r => r.id === id)
}
