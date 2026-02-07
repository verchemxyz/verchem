// =============================================================================
// Lab Safety & SDS Module - Comprehensive Chemical Safety Data
// VerChem - Chemistry & Environmental Engineering Platform
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface GHSPictogram {
  id: string
  code: string
  name: string
  symbol: string
  hazards: string[]
  examples: string[]
  precautions: string[]
  color: string
}

export interface CompatibilityGroup {
  id: string
  name: string
  examples: string[]
  incompatibleWith: string[]
  reason: string
  color: string
}

export interface CompatibilityResult {
  compatible: boolean
  reason: string
  severity: 'safe' | 'caution' | 'incompatible'
}

export interface EmergencyProcedure {
  id: string
  type: 'spill' | 'fire' | 'exposure' | 'ingestion' | 'inhalation' | 'eye_contact' | 'thermal_burn'
  title: string
  icon: string
  steps: string[]
  doNot: string[]
  callEmergency: boolean
}

export interface SafetyRule {
  id: string
  category: 'ppe' | 'chemical_handling' | 'equipment' | 'waste_disposal' | 'general'
  rule: string
  explanation: string
  icon: string
}

export interface HStatement {
  code: string
  text: string
  category: 'physical' | 'health' | 'environmental'
  signalWord: 'Danger' | 'Warning'
}

export interface PStatement {
  code: string
  text: string
  category: 'general' | 'prevention' | 'response' | 'storage' | 'disposal'
}

// -----------------------------------------------------------------------------
// 1. GHS Pictograms (All 9)
// -----------------------------------------------------------------------------

export const GHS_PICTOGRAMS: GHSPictogram[] = [
  {
    id: 'ghs01',
    code: 'GHS01',
    name: 'Exploding Bomb',
    symbol: '\u{1F4A5}',
    hazards: [
      'Unstable explosives',
      'Explosives, Divisions 1.1 - 1.4',
      'Self-reactive substances and mixtures, Types A & B',
      'Organic peroxides, Types A & B',
    ],
    examples: [
      'Nitroglycerin (C\u2083H\u2085N\u2083O\u2089)',
      'TNT (C\u2087H\u2085N\u2083O\u2086)',
      'Ammonium nitrate (NH\u2084NO\u2083)',
      'Picric acid (C\u2086H\u2083N\u2083O\u2087)',
      'Dibenzoyl peroxide (BPO)',
      'Acetyl peroxide',
    ],
    precautions: [
      'Keep away from heat, sparks, open flames, and hot surfaces',
      'Do not subject to grinding, shock, friction, or impact',
      'Store in a cool, well-ventilated place',
      'Wear protective gloves, eye protection, and face protection',
      'Use only non-sparking tools',
      'Keep wetted with recommended amount of water/solvent',
    ],
    color: '#e53e3e',
  },
  {
    id: 'ghs02',
    code: 'GHS02',
    name: 'Flame',
    symbol: '\u{1F525}',
    hazards: [
      'Flammable gases (Category 1)',
      'Flammable aerosols (Categories 1 & 2)',
      'Flammable liquids (Categories 1 - 3)',
      'Flammable solids (Categories 1 & 2)',
      'Self-reactive substances (Types B - F)',
      'Pyrophoric liquids & solids (Category 1)',
      'Self-heating substances (Categories 1 & 2)',
      'Substances which emit flammable gases in contact with water (Categories 1 - 3)',
      'Organic peroxides (Types B - F)',
    ],
    examples: [
      'Acetone (CH\u2083COCH\u2083)',
      'Ethanol (C\u2082H\u2085OH)',
      'Diethyl ether ((C\u2082H\u2085)\u2082O)',
      'Methanol (CH\u2083OH)',
      'Toluene (C\u2087H\u2088)',
      'Hexane (C\u2086H\u2081\u2084)',
      'Hydrogen gas (H\u2082)',
      'Propane (C\u2083H\u2088)',
      'Sodium metal (Na)',
    ],
    precautions: [
      'Keep away from heat, sparks, open flames, and hot surfaces - No smoking',
      'Keep container tightly closed',
      'Ground and bond container and receiving equipment',
      'Use explosion-proof electrical, ventilation, and lighting equipment',
      'Use only non-sparking tools',
      'Store in a cool, well-ventilated place',
      'Wear fire-resistant or flame-retardant clothing',
    ],
    color: '#dd6b20',
  },
  {
    id: 'ghs03',
    code: 'GHS03',
    name: 'Flame Over Circle',
    symbol: '\u{1F525}\u20DD',
    hazards: [
      'Oxidizing gases (Category 1)',
      'Oxidizing liquids (Categories 1 - 3)',
      'Oxidizing solids (Categories 1 - 3)',
    ],
    examples: [
      'Potassium permanganate (KMnO\u2084)',
      'Hydrogen peroxide (H\u2082O\u2082, >8%)',
      'Nitric acid, concentrated (HNO\u2083)',
      'Sodium hypochlorite (NaClO)',
      'Potassium dichromate (K\u2082Cr\u2082O\u2087)',
      'Chromium trioxide (CrO\u2083)',
      'Ammonium persulfate ((NH\u2084)\u2082S\u2082O\u2088)',
    ],
    precautions: [
      'Keep away from combustible materials, clothing, and other flammable substances',
      'Do not spray on an open flame or other ignition source',
      'Keep/store away from reducing agents and organic materials',
      'Take precautionary measures against static discharge',
      'Wear fire-resistant protective clothing',
      'In case of fire: Use water spray, fog, or CO\u2082 to extinguish',
    ],
    color: '#d69e2e',
  },
  {
    id: 'ghs04',
    code: 'GHS04',
    name: 'Gas Cylinder',
    symbol: '\u{1F5DC}',
    hazards: [
      'Compressed gases',
      'Liquefied gases',
      'Refrigerated liquefied gases',
      'Dissolved gases',
    ],
    examples: [
      'Nitrogen (N\u2082, compressed)',
      'Oxygen (O\u2082, compressed)',
      'Carbon dioxide (CO\u2082, liquid/gas)',
      'Argon (Ar, compressed)',
      'Helium (He, compressed)',
      'Acetylene (C\u2082H\u2082, dissolved)',
      'Liquid nitrogen (LN\u2082)',
      'Dry ice (solid CO\u2082)',
    ],
    precautions: [
      'Protect from sunlight and store in well-ventilated area',
      'Use a back-flow preventive device in piping',
      'Use pressure-reducing valve when connecting to lower-pressure systems',
      'Secure cylinders upright with chains or straps',
      'Keep valve protection caps in place when not in use',
      'Do not drag, roll, or slide cylinders; use a proper hand truck',
      'Wear cold-insulating gloves for cryogenic liquids',
    ],
    color: '#3182ce',
  },
  {
    id: 'ghs05',
    code: 'GHS05',
    name: 'Corrosion',
    symbol: '\u{2620}',
    hazards: [
      'Corrosive to metals (Category 1)',
      'Skin corrosion (Categories 1A - 1C)',
      'Serious eye damage (Category 1)',
    ],
    examples: [
      'Sulfuric acid (H\u2082SO\u2084)',
      'Hydrochloric acid (HCl)',
      'Sodium hydroxide (NaOH)',
      'Potassium hydroxide (KOH)',
      'Nitric acid (HNO\u2083)',
      'Phosphoric acid (H\u2083PO\u2084)',
      'Glacial acetic acid (CH\u2083COOH)',
      'Bromine (Br\u2082)',
    ],
    precautions: [
      'Do not breathe dust, fumes, gas, mist, vapors, or spray',
      'Wash hands thoroughly after handling',
      'Wear protective gloves, clothing, eye protection, and face protection',
      'Store locked up in corrosion-resistant container with a resistant inner liner',
      'Keep only in original container',
      'IF ON SKIN: Remove contaminated clothing immediately; rinse with water for 15+ minutes',
      'IF IN EYES: Rinse cautiously with water for 15-20 minutes; remove contact lenses if possible',
    ],
    color: '#9b2c2c',
  },
  {
    id: 'ghs06',
    code: 'GHS06',
    name: 'Skull and Crossbones',
    symbol: '\u2620\uFE0F',
    hazards: [
      'Acute toxicity - oral (Categories 1 - 3)',
      'Acute toxicity - dermal (Categories 1 - 3)',
      'Acute toxicity - inhalation (Categories 1 - 3)',
    ],
    examples: [
      'Sodium cyanide (NaCN)',
      'Potassium cyanide (KCN)',
      'Hydrogen cyanide (HCN)',
      'Mercury(II) chloride (HgCl\u2082)',
      'Arsenic trioxide (As\u2082O\u2083)',
      'Methyl isocyanate (CH\u2083NCO)',
      'Phosgene (COCl\u2082)',
      'Strychnine (C\u2082\u2081H\u2082\u2082N\u2082O\u2082)',
    ],
    precautions: [
      'Do not eat, drink, or smoke when using this product',
      'Wash hands and exposed skin thoroughly after handling',
      'Wear protective gloves, clothing, eye protection, face protection',
      'Use only outdoors or in a well-ventilated area',
      'Keep locked up and away from unauthorized access',
      'IF SWALLOWED: Immediately call a POISON CENTER or doctor',
      'IF ON SKIN: Wash with plenty of soap and water',
      'IF INHALED: Remove victim to fresh air; keep at rest; call POISON CENTER',
    ],
    color: '#1a1a1a',
  },
  {
    id: 'ghs07',
    code: 'GHS07',
    name: 'Exclamation Mark',
    symbol: '\u26A0\uFE0F',
    hazards: [
      'Acute toxicity - oral, dermal, inhalation (Category 4)',
      'Skin irritation (Category 2)',
      'Eye irritation (Category 2A)',
      'Skin sensitization (Category 1)',
      'Specific target organ toxicity - single exposure (Category 3) - respiratory irritation',
      'Specific target organ toxicity - single exposure (Category 3) - narcotic effects',
      'Hazardous to the ozone layer (Category 1)',
    ],
    examples: [
      'Calcium chloride (CaCl\u2082)',
      'Isopropanol (C\u2083H\u2087OH)',
      'Dichloromethane (CH\u2082Cl\u2082)',
      'Xylene (C\u2088H\u2081\u2080)',
      'Sodium carbonate (Na\u2082CO\u2083)',
      'Acetic acid, dilute (CH\u2083COOH)',
      'Copper sulfate (CuSO\u2084)',
    ],
    precautions: [
      'Avoid breathing dust, fumes, gas, mist, vapors, or spray',
      'Wash hands and exposed areas thoroughly after handling',
      'Use only outdoors or in a well-ventilated area',
      'Wear protective gloves and eye protection',
      'IF IN EYES: Rinse cautiously with water for several minutes',
      'If skin irritation occurs, get medical attention',
      'If experiencing respiratory symptoms, call a POISON CENTER',
    ],
    color: '#e53e3e',
  },
  {
    id: 'ghs08',
    code: 'GHS08',
    name: 'Health Hazard',
    symbol: '\u{2695}',
    hazards: [
      'Respiratory sensitization (Category 1)',
      'Germ cell mutagenicity (Categories 1A, 1B, 2)',
      'Carcinogenicity (Categories 1A, 1B, 2)',
      'Reproductive toxicity (Categories 1A, 1B, 2)',
      'Specific target organ toxicity - single exposure (Categories 1 & 2)',
      'Specific target organ toxicity - repeated exposure (Categories 1 & 2)',
      'Aspiration hazard (Category 1)',
    ],
    examples: [
      'Benzene (C\u2086H\u2086) - carcinogen',
      'Formaldehyde (HCHO) - carcinogen',
      'Asbestos - carcinogen',
      'Lead compounds (Pb) - reproductive toxin',
      'Cadmium compounds (Cd) - carcinogen',
      'Toluene diisocyanate (TDI) - respiratory sensitizer',
      'Hexane (C\u2086H\u2081\u2084) - neurotoxin',
      'Carbon tetrachloride (CCl\u2084) - organ toxicity',
    ],
    precautions: [
      'Obtain special instructions before use',
      'Do not handle until all safety precautions have been read and understood',
      'Use personal protective equipment as required',
      'Do not breathe dust, fumes, gas, mist, vapors, spray',
      'Do not eat, drink, or smoke when using this product',
      'IF exposed or concerned: Get medical advice/attention',
      'Store locked up with restricted access',
      'Dispose of contents/container in accordance with local regulations',
    ],
    color: '#805ad5',
  },
  {
    id: 'ghs09',
    code: 'GHS09',
    name: 'Environment',
    symbol: '\u{1F333}',
    hazards: [
      'Hazardous to the aquatic environment - acute (Category 1)',
      'Hazardous to the aquatic environment - chronic (Categories 1 & 2)',
    ],
    examples: [
      'Copper sulfate (CuSO\u2084)',
      'Zinc chloride (ZnCl\u2082)',
      'Sodium hypochlorite (NaClO)',
      'Potassium dichromate (K\u2082Cr\u2082O\u2087)',
      'Mercury compounds (Hg)',
      'Tributyltin compounds',
      'Chloroform (CHCl\u2083)',
      'Pesticides (various)',
    ],
    precautions: [
      'Avoid release to the environment',
      'Collect spillage and contain for proper disposal',
      'Do not discharge into drains, water courses, or onto the ground',
      'Dispose of contents/container according to local regulations',
      'Inform appropriate authorities in case of environmental release',
      'Use containment trays and secondary containment when storing',
    ],
    color: '#38a169',
  },
]

// -----------------------------------------------------------------------------
// 2. Chemical Compatibility Chart
// -----------------------------------------------------------------------------

export const COMPATIBILITY_GROUPS: CompatibilityGroup[] = [
  {
    id: 'strong_acids',
    name: 'Strong Acids',
    examples: ['Sulfuric acid (H\u2082SO\u2084)', 'Hydrochloric acid (HCl)', 'Nitric acid (HNO\u2083)', 'Phosphoric acid (H\u2083PO\u2084)', 'Perchloric acid (HClO\u2084)'],
    incompatibleWith: ['strong_bases', 'reactive_metals', 'flammable_solvents', 'strong_oxidizers', 'water_reactive', 'strong_reducers', 'organic_peroxides'],
    reason: 'Reacts violently with bases (exothermic neutralization), metals (hydrogen gas evolution), organics (decomposition/fire), and oxidizers (toxic gas release). Nitric acid is itself an oxidizer.',
    color: '#ef4444',
  },
  {
    id: 'strong_bases',
    name: 'Strong Bases',
    examples: ['Sodium hydroxide (NaOH)', 'Potassium hydroxide (KOH)', 'Ammonia (NH\u2083)', 'Calcium hydroxide (Ca(OH)\u2082)', 'Sodium amide (NaNH\u2082)'],
    incompatibleWith: ['strong_acids', 'reactive_metals', 'flammable_solvents', 'water_reactive', 'strong_oxidizers'],
    reason: 'Violent exothermic reactions with acids. Corrodes metals (especially aluminum, zinc). Reacts with certain organic solvents. Concentrated bases attack glass.',
    color: '#3b82f6',
  },
  {
    id: 'strong_oxidizers',
    name: 'Strong Oxidizers',
    examples: ['Potassium permanganate (KMnO\u2084)', 'Hydrogen peroxide (H\u2082O\u2082, >30%)', 'Nitric acid, conc. (HNO\u2083)', 'Chromium trioxide (CrO\u2083)', 'Perchloric acid (HClO\u2084)'],
    incompatibleWith: ['flammable_solvents', 'strong_reducers', 'strong_acids', 'organic_peroxides', 'pyrophoric'],
    reason: 'Provides oxygen to sustain combustion. Contact with organic/combustible materials can cause fire or explosion. Extremely dangerous with reducing agents.',
    color: '#f59e0b',
  },
  {
    id: 'strong_reducers',
    name: 'Strong Reducers',
    examples: ['Sodium borohydride (NaBH\u2084)', 'Lithium aluminum hydride (LiAlH\u2084)', 'Zinc dust (Zn)', 'Sodium metal (Na)', 'Magnesium ribbon (Mg)'],
    incompatibleWith: ['strong_oxidizers', 'strong_acids', 'water_reactive', 'flammable_solvents'],
    reason: 'Violent exothermic reactions with oxidizers and acids. Many are water-reactive and generate flammable hydrogen gas. LiAlH\u2084 reacts explosively with water.',
    color: '#8b5cf6',
  },
  {
    id: 'flammable_solvents',
    name: 'Flammable Solvents',
    examples: ['Ethanol (C\u2082H\u2085OH)', 'Acetone (CH\u2083COCH\u2083)', 'Diethyl ether ((C\u2082H\u2085)\u2082O)', 'Hexane (C\u2086H\u2081\u2084)', 'Toluene (C\u2087H\u2088)', 'Methanol (CH\u2083OH)'],
    incompatibleWith: ['strong_oxidizers', 'strong_acids', 'strong_bases', 'reactive_metals', 'organic_peroxides', 'pyrophoric'],
    reason: 'Ignite easily from sparks, heat, or static. Vapors can travel to ignition sources. Ethers form explosive peroxides on storage. Incompatible with oxidizers (fire/explosion risk).',
    color: '#f97316',
  },
  {
    id: 'water_reactive',
    name: 'Water-Reactive',
    examples: ['Sodium metal (Na)', 'Potassium metal (K)', 'Calcium hydride (CaH\u2082)', 'Thionyl chloride (SOCl\u2082)', 'Phosphorus pentachloride (PCl\u2085)', 'Lithium metal (Li)'],
    incompatibleWith: ['strong_acids', 'strong_bases', 'strong_reducers', 'compressed_gases'],
    reason: 'Reacts violently with water and aqueous solutions. Generates flammable hydrogen gas and/or toxic fumes. Alkali metals can explode on contact with water.',
    color: '#06b6d4',
  },
  {
    id: 'toxic_poisonous',
    name: 'Toxic / Poisonous',
    examples: ['Hydrogen cyanide (HCN)', 'Carbon monoxide (CO)', 'Phosgene (COCl\u2082)', 'Sodium cyanide (NaCN)', 'Arsenic trioxide (As\u2082O\u2083)', 'Mercury (Hg)'],
    incompatibleWith: ['strong_acids', 'strong_oxidizers'],
    reason: 'Requires special segregated storage with restricted access. Acids can liberate toxic gases from cyanide salts (deadly HCN gas). Must be stored in ventilated, locked cabinets.',
    color: '#1a1a2e',
  },
  {
    id: 'compressed_gases',
    name: 'Compressed Gases',
    examples: ['Nitrogen (N\u2082)', 'Oxygen (O\u2082)', 'Hydrogen (H\u2082)', 'Argon (Ar)', 'Acetylene (C\u2082H\u2082)', 'Carbon dioxide (CO\u2082)'],
    incompatibleWith: ['water_reactive', 'flammable_solvents'],
    reason: 'Must be secured upright and segregated from other chemicals. Flammable gases (H\u2082, C\u2082H\u2082) separated from oxidizing gases (O\u2082). Cylinder failure is an explosion risk.',
    color: '#64748b',
  },
  {
    id: 'organic_peroxides',
    name: 'Organic Peroxides',
    examples: ['tert-Butyl hydroperoxide (TBHP)', 'Benzoyl peroxide (BPO)', 'Methyl ethyl ketone peroxide (MEKP)', 'Di-tert-butyl peroxide', 'Peracetic acid'],
    incompatibleWith: ['strong_acids', 'strong_oxidizers', 'flammable_solvents', 'strong_reducers'],
    reason: 'Thermally unstable; can decompose explosively when heated, shocked, or in contact with incompatible materials. Many require refrigerated storage. Extremely dangerous with acids and metals.',
    color: '#dc2626',
  },
  {
    id: 'reactive_metals',
    name: 'Reactive Metals',
    examples: ['Sodium (Na)', 'Potassium (K)', 'Lithium (Li)', 'Magnesium (Mg)', 'Aluminum powder (Al)', 'Zinc powder (Zn)'],
    incompatibleWith: ['strong_acids', 'strong_bases', 'flammable_solvents', 'water_reactive'],
    reason: 'React with acids to produce flammable hydrogen gas. Alkali metals react violently with water. Fine metal powders are pyrophoric (ignite spontaneously in air).',
    color: '#a3a3a3',
  },
  {
    id: 'pyrophoric',
    name: 'Pyrophoric Materials',
    examples: ['tert-Butyllithium (t-BuLi)', 'Grignard reagents (RMgX)', 'Triethylaluminum (Et\u2083Al)', 'White phosphorus (P\u2084)', 'Iron pentacarbonyl (Fe(CO)\u2085)'],
    incompatibleWith: ['strong_oxidizers', 'flammable_solvents', 'water_reactive'],
    reason: 'Ignite spontaneously in air. Must be handled under inert atmosphere (N\u2082 or Ar) using Schlenk techniques. Contact with air or moisture causes immediate fire.',
    color: '#b91c1c',
  },
]

/**
 * Pre-computed incompatibility lookup table.
 * Built from COMPATIBILITY_GROUPS at module load time for O(1) lookups.
 */
const incompatibilityMap: Map<string, Set<string>> = new Map()

for (const group of COMPATIBILITY_GROUPS) {
  if (!incompatibilityMap.has(group.id)) {
    incompatibilityMap.set(group.id, new Set())
  }
  for (const incompId of group.incompatibleWith) {
    incompatibilityMap.get(group.id)!.add(incompId)
    // Ensure symmetry
    if (!incompatibilityMap.has(incompId)) {
      incompatibilityMap.set(incompId, new Set())
    }
    incompatibilityMap.get(incompId)!.add(group.id)
  }
}

// -----------------------------------------------------------------------------
// 3. Emergency Procedures
// -----------------------------------------------------------------------------

export const EMERGENCY_PROCEDURES: EmergencyProcedure[] = [
  {
    id: 'spill_small',
    type: 'spill',
    title: 'Chemical Spill (Small, <100 mL)',
    icon: '\u{1F4A7}',
    steps: [
      'Alert people in the immediate area of the spill.',
      'Wear appropriate PPE: safety goggles, gloves, lab coat.',
      'Confine the spill using appropriate absorbent material (vermiculite, spill pillows, or neutralizing agent).',
      'For acids: neutralize with sodium bicarbonate (NaHCO\u2083) before absorbing.',
      'For bases: neutralize with citric acid or dilute acetic acid before absorbing.',
      'For solvents: use chemical-specific absorbent pads (no paper towels).',
      'Scoop absorbed material into a labeled waste container using a plastic dustpan.',
      'Wipe the area with damp paper towels and dispose in chemical waste.',
      'Ventilate the area by opening windows or turning on the fume hood.',
      'Report the spill to your supervisor and document it in the lab incident log.',
    ],
    doNot: [
      'Do NOT use water to clean up water-reactive chemicals.',
      'Do NOT put spill waste in regular trash.',
      'Do NOT attempt to clean up unknown chemicals without consulting the SDS.',
      'Do NOT use a broom on liquid spills (spreads contamination).',
    ],
    callEmergency: false,
  },
  {
    id: 'spill_large',
    type: 'spill',
    title: 'Chemical Spill (Large, >100 mL or Hazardous)',
    icon: '\u{26A0}\uFE0F',
    steps: [
      'Alert everyone in the lab to evacuate immediately.',
      'If safe, turn off ignition sources and close fume hood sashes.',
      'Evacuate the area and close doors behind you.',
      'Pull the fire alarm if the spill involves flammable or toxic materials.',
      'Call emergency services (911 in US) and your institution\'s EH&S office.',
      'Attend to any injured or contaminated persons.',
      'Do NOT re-enter the area until cleared by emergency responders.',
      'Provide the SDS to emergency responders upon arrival.',
      'Account for all personnel who were in the lab.',
    ],
    doNot: [
      'Do NOT attempt to clean up a large spill yourself.',
      'Do NOT walk through the spill.',
      'Do NOT try to be a hero \u2014 your safety comes first.',
      'Do NOT use elevators during evacuation.',
      'Do NOT prop open doors to the contaminated area.',
    ],
    callEmergency: true,
  },
  {
    id: 'fire',
    type: 'fire',
    title: 'Chemical Fire',
    icon: '\u{1F525}',
    steps: [
      'Activate the fire alarm immediately.',
      'Alert everyone in the area to evacuate.',
      'If the fire is small (trash-can size) and you are trained, use an appropriate extinguisher:',
      '  \u2022 Class B: CO\u2082 or dry chemical for flammable liquid fires.',
      '  \u2022 Class D: Special dry powder for metal fires (Na, Mg, Li).',
      '  \u2022 NEVER use water on metal fires, oil fires, or electrical fires.',
      'If clothing catches fire: STOP, DROP, and ROLL. Use a safety shower if nearby.',
      'Evacuate via the nearest exit; do not use elevators.',
      'Close doors behind you to contain the fire.',
      'Call 911 from a safe location.',
      'Meet at the designated assembly point and account for all personnel.',
    ],
    doNot: [
      'Do NOT fight a large or spreading fire.',
      'Do NOT use water on grease fires, metal fires, or electrical fires.',
      'Do NOT open doors that feel hot to the touch.',
      'Do NOT return to the building until cleared by the fire department.',
      'Do NOT block exits or stairways.',
      'Do NOT run if your clothing is on fire.',
    ],
    callEmergency: true,
  },
  {
    id: 'skin_contact',
    type: 'exposure',
    title: 'Skin Contact / Chemical Splash',
    icon: '\u{1F9E4}',
    steps: [
      'Remove contaminated clothing immediately while rinsing.',
      'Flush the affected area with large amounts of lukewarm water for at least 15-20 minutes.',
      'Use a safety shower for large-area contamination.',
      'Do NOT use hot water (opens pores and increases absorption).',
      'For hydrofluoric acid (HF): apply calcium gluconate gel immediately after rinsing.',
      'For phenol: wipe with polyethylene glycol (PEG 400) before water rinse.',
      'Check the SDS for chemical-specific first aid.',
      'Seek medical attention, especially for strong acids, bases, or toxic chemicals.',
      'Bring the SDS or chemical label to the medical provider.',
    ],
    doNot: [
      'Do NOT apply creams, ointments, or salves unless specifically indicated by SDS.',
      'Do NOT rub or scrub the affected area.',
      'Do NOT use solvents to wash off chemicals on skin (increases absorption).',
      'Do NOT delay rinsing to remove clothing \u2014 rinse first, then remove.',
      'Do NOT underestimate chemical burns; they worsen over time.',
    ],
    callEmergency: false,
  },
  {
    id: 'eye_contact',
    type: 'eye_contact',
    title: 'Eye Contact / Chemical Splash to Eyes',
    icon: '\u{1F441}\uFE0F',
    steps: [
      'Go to the eyewash station immediately \u2014 seconds matter.',
      'Hold eyelids open and flush eyes with water for at least 15-20 minutes.',
      'Roll eyes in all directions during flushing to ensure complete coverage.',
      'Remove contact lenses as soon as possible during flushing.',
      'Flush from the nose outward so contaminated water does not enter the unaffected eye.',
      'After flushing, loosely cover eyes with sterile gauze.',
      'Seek immediate medical attention \u2014 even if pain subsides.',
      'Bring the SDS or chemical label to the medical provider.',
    ],
    doNot: [
      'Do NOT rub your eyes.',
      'Do NOT delay flushing to find the SDS.',
      'Do NOT use eye drops as a substitute for thorough flushing.',
      'Do NOT attempt to neutralize chemicals in the eye.',
      'Do NOT use warm or hot water.',
    ],
    callEmergency: false,
  },
  {
    id: 'ingestion',
    type: 'ingestion',
    title: 'Chemical Ingestion',
    icon: '\u{1F48A}',
    steps: [
      'Call Poison Control (1-800-222-1222 in US) or emergency services immediately.',
      'Identify the chemical ingested and approximate amount.',
      'If the person is conscious and alert, have them rinse their mouth with water and spit it out.',
      'If instructed by Poison Control, give water or milk to drink.',
      'Monitor the person for symptoms: nausea, vomiting, pain, difficulty breathing.',
      'If the person becomes unconscious, place in the recovery position.',
      'If the person stops breathing, begin CPR if trained.',
      'Provide the SDS to medical responders.',
      'Save any vomit for analysis if possible.',
    ],
    doNot: [
      'Do NOT induce vomiting unless specifically instructed by Poison Control.',
      'Do NOT give anything by mouth to an unconscious person.',
      'Do NOT try to neutralize the chemical (e.g., giving acid for base ingestion).',
      'Do NOT delay calling for help to look up information.',
      'Do NOT give activated charcoal without medical instruction.',
    ],
    callEmergency: true,
  },
  {
    id: 'inhalation',
    type: 'inhalation',
    title: 'Chemical Inhalation',
    icon: '\u{1F4A8}',
    steps: [
      'Move the person to fresh air immediately.',
      'If the area is filled with fumes/gas, do NOT enter without respiratory protection.',
      'Call emergency services if the person shows distress, dizziness, or unconsciousness.',
      'If the person is not breathing, begin CPR if trained (use a barrier device).',
      'Loosen tight clothing around the neck and chest.',
      'Keep the person warm, calm, and at rest.',
      'Monitor breathing and pulse; be prepared for shock.',
      'Identify the chemical inhaled and provide the SDS to responders.',
      'Even if symptoms seem mild, seek medical evaluation \u2014 some effects are delayed.',
    ],
    doNot: [
      'Do NOT enter a contaminated area without proper respiratory protection.',
      'Do NOT perform mouth-to-mouth resuscitation without a barrier device.',
      'Do NOT allow the person to exert themselves.',
      'Do NOT assume "no symptoms now" means "no problem" \u2014 pulmonary edema can be delayed 24-48 hours.',
      'Do NOT give food or water to a person who is not fully conscious.',
    ],
    callEmergency: true,
  },
  {
    id: 'thermal_chemical_burn',
    type: 'thermal_burn',
    title: 'Thermal / Chemical Burn',
    icon: '\u{1F321}\uFE0F',
    steps: [
      'For chemical burns: flush the burn area with cool running water for at least 20 minutes.',
      'For thermal burns: cool the burn under cool (not cold) running water for at least 10 minutes.',
      'Remove jewelry or clothing near the burn area (if not stuck to the skin).',
      'Cover the burn loosely with a sterile, non-stick bandage or clean cloth.',
      'For extensive burns or burns from hydrofluoric acid, alkali metals, or white phosphorus, seek emergency care immediately.',
      'For HF burns: apply calcium gluconate gel after flushing.',
      'For white phosphorus burns: keep the area submerged in water (phosphorus re-ignites in air).',
      'Monitor for signs of shock: pale skin, rapid breathing, weakness.',
      'Seek medical attention for any burn larger than the palm of the hand, or burns on the face, hands, feet, or genitals.',
    ],
    doNot: [
      'Do NOT apply ice directly to the burn.',
      'Do NOT break blisters.',
      'Do NOT apply butter, oils, toothpaste, or other home remedies.',
      'Do NOT remove clothing stuck to a burn.',
      'Do NOT use adhesive bandages on burns.',
      'Do NOT immerse large areas in cold water (risk of hypothermia).',
    ],
    callEmergency: false,
  },
]

// -----------------------------------------------------------------------------
// 4. Lab Safety Rules
// -----------------------------------------------------------------------------

export const SAFETY_RULES: SafetyRule[] = [
  // PPE
  {
    id: 'ppe_01',
    category: 'ppe',
    rule: 'Always wear approved safety goggles (ANSI Z87.1) when working in the lab.',
    explanation: 'Chemical splashes can cause permanent blindness within seconds. Regular eyeglasses do not provide adequate splash protection. Indirectly vented chemical splash goggles provide the best protection.',
    icon: '\u{1F97D}',
  },
  {
    id: 'ppe_02',
    category: 'ppe',
    rule: 'Wear a lab coat or protective apron at all times.',
    explanation: 'A lab coat protects your clothing and skin from splashes, spills, and contamination. Button it fully and ensure it covers your arms. Flame-resistant coats are required when working with flammables.',
    icon: '\u{1F97C}',
  },
  {
    id: 'ppe_03',
    category: 'ppe',
    rule: 'Wear appropriate chemical-resistant gloves for the chemicals in use.',
    explanation: 'Different chemicals require different glove materials. Nitrile gloves resist most solvents and acids. Butyl rubber resists ketones and esters. Always check a glove compatibility chart. Never reuse disposable gloves.',
    icon: '\u{1F9E4}',
  },
  {
    id: 'ppe_04',
    category: 'ppe',
    rule: 'Wear closed-toe shoes that fully cover the feet. No sandals, open-toe, or canvas shoes.',
    explanation: 'Feet are vulnerable to chemical spills, broken glass, and falling objects. Leather or chemical-resistant shoes provide the best protection. Canvas shoes absorb spilled chemicals.',
    icon: '\u{1F45F}',
  },
  {
    id: 'ppe_05',
    category: 'ppe',
    rule: 'Tie back long hair and secure loose clothing before working.',
    explanation: 'Long hair and loose clothing can catch fire from Bunsen burners, get caught in equipment, or dip into chemicals. Always secure them before starting work.',
    icon: '\u{2702}\uFE0F',
  },
  {
    id: 'ppe_06',
    category: 'ppe',
    rule: 'Remove jewelry, watches, and accessories that could contact chemicals.',
    explanation: 'Chemicals can get trapped under rings, watches, and bracelets, causing prolonged exposure and severe chemical burns. Metal jewelry can also conduct electricity and react with chemicals.',
    icon: '\u{1F48D}',
  },

  // Chemical Handling
  {
    id: 'chem_01',
    category: 'chemical_handling',
    rule: 'Read the Safety Data Sheet (SDS) before using any chemical for the first time.',
    explanation: 'The SDS provides critical information about hazards, handling precautions, first aid, and disposal. Sections 2 (Hazards), 4 (First Aid), 7 (Handling & Storage), and 8 (Exposure Controls) are especially important.',
    icon: '\u{1F4CB}',
  },
  {
    id: 'chem_02',
    category: 'chemical_handling',
    rule: 'Never pipette by mouth. Always use a pipette bulb or mechanical pipettor.',
    explanation: 'Mouth pipetting can lead to accidental ingestion of chemicals, many of which are toxic, carcinogenic, or corrosive. This is one of the most important lab safety rules.',
    icon: '\u{1F9EA}',
  },
  {
    id: 'chem_03',
    category: 'chemical_handling',
    rule: 'Label all containers with chemical name, concentration, date, and hazard information.',
    explanation: 'Unlabeled containers are one of the most common causes of lab accidents. Even "water" should be labeled \u2014 clear liquids include many dangerous chemicals. Use GHS-compliant labels.',
    icon: '\u{1F3F7}\uFE0F',
  },
  {
    id: 'chem_04',
    category: 'chemical_handling',
    rule: 'Never return unused chemicals to the original container.',
    explanation: 'Returned chemicals may be contaminated, leading to unexpected reactions, degradation, or false results. Dispose of excess according to waste procedures or share with a colleague.',
    icon: '\u{267B}\uFE0F',
  },
  {
    id: 'chem_05',
    category: 'chemical_handling',
    rule: 'Transport chemicals in secondary containment (a tray or bucket).',
    explanation: 'Secondary containment catches spills during transport. Especially important for acids, corrosives, and toxic chemicals. Never carry glass bottles by the neck.',
    icon: '\u{1F4E6}',
  },
  {
    id: 'chem_06',
    category: 'chemical_handling',
    rule: 'Add acid to water, never water to acid ("Do as you oughta, add acid to water").',
    explanation: 'Adding water to concentrated acid causes a violent exothermic reaction that can boil and spatter acid. Always add the more concentrated solution slowly to the less concentrated one with stirring.',
    icon: '\u{1F4A7}',
  },
  {
    id: 'chem_07',
    category: 'chemical_handling',
    rule: 'Use a fume hood for volatile, toxic, or flammable chemicals.',
    explanation: 'Fume hoods provide ventilated containment that protects you from inhaling harmful vapors. The sash should be at the marked safe height. Verify airflow before use.',
    icon: '\u{1F32C}\uFE0F',
  },
  {
    id: 'chem_08',
    category: 'chemical_handling',
    rule: 'Never heat a closed container \u2014 pressure buildup can cause an explosion.',
    explanation: 'Heating liquids in sealed vessels creates pressure from vapor expansion and gas generation. Always use vented or open systems. If refluxing, use a condenser with a proper vent.',
    icon: '\u{1F321}\uFE0F',
  },

  // Equipment
  {
    id: 'equip_01',
    category: 'equipment',
    rule: 'Inspect all glassware for cracks or chips before use.',
    explanation: 'Damaged glassware is weakened and can shatter during use, especially when heated or under vacuum. Discard cracked glassware in the designated sharps/glass waste container.',
    icon: '\u{1F52C}',
  },
  {
    id: 'equip_02',
    category: 'equipment',
    rule: 'Know the location and proper use of safety equipment: eyewash, safety shower, fire extinguisher, first aid kit, and fire blanket.',
    explanation: 'You must be able to reach the eyewash station within 10 seconds. Practice using safety equipment before you need it in an emergency. Check monthly that equipment is functional.',
    icon: '\u{1F6C1}',
  },
  {
    id: 'equip_03',
    category: 'equipment',
    rule: 'Never leave active experiments unattended.',
    explanation: 'Reactions can accelerate, overheat, or produce unexpected results. If you must step away briefly, ensure a colleague monitors the experiment and post a sign with contact information.',
    icon: '\u{1F440}',
  },
  {
    id: 'equip_04',
    category: 'equipment',
    rule: 'Allow hot glassware and equipment to cool before handling.',
    explanation: 'Hot glass looks the same as cool glass. Use tongs, heat-resistant gloves, or clamps to handle hot items. Place hot glassware on a heat-resistant surface, never directly on the benchtop.',
    icon: '\u{2668}\uFE0F',
  },
  {
    id: 'equip_05',
    category: 'equipment',
    rule: 'Use a fume hood when working with volatile or noxious substances.',
    explanation: 'Ensure the fume hood is on and operating properly before use. Keep the sash at or below the indicated safe working height. Do not store chemicals in the fume hood.',
    icon: '\u{1F4A8}',
  },

  // Waste Disposal
  {
    id: 'waste_01',
    category: 'waste_disposal',
    rule: 'Never pour chemicals down the drain without explicit authorization.',
    explanation: 'Many chemicals are hazardous to water systems, septic systems, and municipal treatment plants. Only water-soluble, non-hazardous chemicals at approved concentrations may go down the drain.',
    icon: '\u{1F6B0}',
  },
  {
    id: 'waste_02',
    category: 'waste_disposal',
    rule: 'Segregate chemical waste by compatibility: acids, bases, halogenated solvents, non-halogenated solvents, heavy metals.',
    explanation: 'Mixing incompatible wastes can cause fires, explosions, or toxic gas release. Use clearly labeled waste containers for each category. When in doubt, ask your EH&S department.',
    icon: '\u{2697}\uFE0F',
  },
  {
    id: 'waste_03',
    category: 'waste_disposal',
    rule: 'Dispose of broken glass in designated rigid containers, not regular trash.',
    explanation: 'Broken glass in regular trash can injure custodial staff. Use rigid, puncture-resistant containers labeled "Broken Glass Only." Never put contaminated glass in the regular glass waste.',
    icon: '\u{1F5D1}\uFE0F',
  },
  {
    id: 'waste_04',
    category: 'waste_disposal',
    rule: 'Label all chemical waste containers with contents, date, and hazard information.',
    explanation: 'Unknown waste is extremely expensive to identify and dispose of. Label containers immediately when waste is first added. Include all chemicals in the mixture.',
    icon: '\u{1F3F7}\uFE0F',
  },
  {
    id: 'waste_05',
    category: 'waste_disposal',
    rule: 'Never fill waste containers more than 75% full.',
    explanation: 'Overfilled containers can overflow during transport or off-gas. Leave headspace for thermal expansion and safe handling. Close containers when not actively adding waste.',
    icon: '\u{1F9EA}',
  },

  // General
  {
    id: 'gen_01',
    category: 'general',
    rule: 'No food, drinks, gum, or cosmetics in the laboratory.',
    explanation: 'Chemical contamination of food/drinks is invisible and can lead to accidental ingestion of toxic substances. Even applying lip balm or chapstick can transfer chemicals from hands to mouth.',
    icon: '\u{1F6AB}',
  },
  {
    id: 'gen_02',
    category: 'general',
    rule: 'Never work alone in the laboratory.',
    explanation: 'If an accident occurs when you are alone, there is no one to call for help, use the safety shower, or perform first aid. A buddy system is essential for lab safety.',
    icon: '\u{1F465}',
  },
  {
    id: 'gen_03',
    category: 'general',
    rule: 'Keep work areas clean and uncluttered at all times.',
    explanation: 'Clutter increases the risk of spills, cross-contamination, and accidents. Clean as you go. Return reagents to their proper storage location after use. Clear walkways and exits.',
    icon: '\u{1F9F9}',
  },
  {
    id: 'gen_04',
    category: 'general',
    rule: 'Wash hands thoroughly before leaving the laboratory.',
    explanation: 'Even with gloves, trace chemicals can contaminate your hands. Wash for at least 20 seconds with soap and water. This prevents you from transferring chemicals to food, your face, or others.',
    icon: '\u{1F9FC}',
  },
  {
    id: 'gen_05',
    category: 'general',
    rule: 'Report all accidents, injuries, spills, and near-misses to your supervisor immediately.',
    explanation: 'Even minor incidents should be documented. Near-misses help identify hazards before a serious accident occurs. Prompt reporting protects you and your colleagues.',
    icon: '\u{1F4DD}',
  },
  {
    id: 'gen_06',
    category: 'general',
    rule: 'Know the emergency exit routes and evacuation procedures.',
    explanation: 'Familiarize yourself with at least two exit routes from your lab. Know the location of the nearest fire alarm pull station. Participate in fire drills. Never block exits.',
    icon: '\u{1F6AA}',
  },
]

// -----------------------------------------------------------------------------
// 5. Signal Words & H/P-Statements
// -----------------------------------------------------------------------------

export const SIGNAL_WORDS = {
  Danger: {
    word: 'Danger',
    description: 'Used for more severe hazard categories. Indicates that the chemical can cause serious or life-threatening effects.',
    color: '#dc2626',
    examples: ['Fatal if swallowed', 'Causes severe skin burns', 'May cause cancer', 'Explosive'],
  },
  Warning: {
    word: 'Warning',
    description: 'Used for less severe hazard categories. Indicates that the chemical can cause harmful or irritating effects.',
    color: '#f59e0b',
    examples: ['Harmful if swallowed', 'Causes skin irritation', 'May cause drowsiness', 'Flammable liquid'],
  },
}

export const H_STATEMENTS: HStatement[] = [
  // Physical Hazards (H200 series)
  { code: 'H200', text: 'Unstable explosive', category: 'physical', signalWord: 'Danger' },
  { code: 'H201', text: 'Explosive; mass explosion hazard', category: 'physical', signalWord: 'Danger' },
  { code: 'H202', text: 'Explosive; severe projection hazard', category: 'physical', signalWord: 'Danger' },
  { code: 'H203', text: 'Explosive; fire, blast or projection hazard', category: 'physical', signalWord: 'Danger' },
  { code: 'H204', text: 'Fire or projection hazard', category: 'physical', signalWord: 'Danger' },
  { code: 'H205', text: 'May mass explode in fire', category: 'physical', signalWord: 'Danger' },
  { code: 'H220', text: 'Extremely flammable gas', category: 'physical', signalWord: 'Danger' },
  { code: 'H221', text: 'Flammable gas', category: 'physical', signalWord: 'Warning' },
  { code: 'H222', text: 'Extremely flammable aerosol', category: 'physical', signalWord: 'Danger' },
  { code: 'H223', text: 'Flammable aerosol', category: 'physical', signalWord: 'Warning' },
  { code: 'H224', text: 'Extremely flammable liquid and vapor', category: 'physical', signalWord: 'Danger' },
  { code: 'H225', text: 'Highly flammable liquid and vapor', category: 'physical', signalWord: 'Danger' },
  { code: 'H226', text: 'Flammable liquid and vapor', category: 'physical', signalWord: 'Warning' },
  { code: 'H227', text: 'Combustible liquid', category: 'physical', signalWord: 'Warning' },
  { code: 'H228', text: 'Flammable solid', category: 'physical', signalWord: 'Danger' },
  { code: 'H240', text: 'Heating may cause an explosion', category: 'physical', signalWord: 'Danger' },
  { code: 'H241', text: 'Heating may cause a fire or explosion', category: 'physical', signalWord: 'Danger' },
  { code: 'H242', text: 'Heating may cause a fire', category: 'physical', signalWord: 'Danger' },
  { code: 'H250', text: 'Catches fire spontaneously if exposed to air', category: 'physical', signalWord: 'Danger' },
  { code: 'H251', text: 'Self-heating; may catch fire', category: 'physical', signalWord: 'Danger' },
  { code: 'H252', text: 'Self-heating in large quantities; may catch fire', category: 'physical', signalWord: 'Warning' },
  { code: 'H260', text: 'In contact with water releases flammable gases which may ignite spontaneously', category: 'physical', signalWord: 'Danger' },
  { code: 'H261', text: 'In contact with water releases flammable gas', category: 'physical', signalWord: 'Danger' },
  { code: 'H270', text: 'May cause or intensify fire; oxidizer', category: 'physical', signalWord: 'Danger' },
  { code: 'H271', text: 'May cause fire or explosion; strong oxidizer', category: 'physical', signalWord: 'Danger' },
  { code: 'H272', text: 'May intensify fire; oxidizer', category: 'physical', signalWord: 'Warning' },
  { code: 'H280', text: 'Contains gas under pressure; may explode if heated', category: 'physical', signalWord: 'Warning' },
  { code: 'H281', text: 'Contains refrigerated gas; may cause cryogenic burns or injury', category: 'physical', signalWord: 'Warning' },
  { code: 'H290', text: 'May be corrosive to metals', category: 'physical', signalWord: 'Warning' },

  // Health Hazards (H300 series)
  { code: 'H300', text: 'Fatal if swallowed', category: 'health', signalWord: 'Danger' },
  { code: 'H301', text: 'Toxic if swallowed', category: 'health', signalWord: 'Danger' },
  { code: 'H302', text: 'Harmful if swallowed', category: 'health', signalWord: 'Warning' },
  { code: 'H304', text: 'May be fatal if swallowed and enters airways', category: 'health', signalWord: 'Danger' },
  { code: 'H310', text: 'Fatal in contact with skin', category: 'health', signalWord: 'Danger' },
  { code: 'H311', text: 'Toxic in contact with skin', category: 'health', signalWord: 'Danger' },
  { code: 'H312', text: 'Harmful in contact with skin', category: 'health', signalWord: 'Warning' },
  { code: 'H314', text: 'Causes severe skin burns and eye damage', category: 'health', signalWord: 'Danger' },
  { code: 'H315', text: 'Causes skin irritation', category: 'health', signalWord: 'Warning' },
  { code: 'H317', text: 'May cause an allergic skin reaction', category: 'health', signalWord: 'Warning' },
  { code: 'H318', text: 'Causes serious eye damage', category: 'health', signalWord: 'Danger' },
  { code: 'H319', text: 'Causes serious eye irritation', category: 'health', signalWord: 'Warning' },
  { code: 'H330', text: 'Fatal if inhaled', category: 'health', signalWord: 'Danger' },
  { code: 'H331', text: 'Toxic if inhaled', category: 'health', signalWord: 'Danger' },
  { code: 'H332', text: 'Harmful if inhaled', category: 'health', signalWord: 'Warning' },
  { code: 'H334', text: 'May cause allergy or asthma symptoms or breathing difficulties if inhaled', category: 'health', signalWord: 'Danger' },
  { code: 'H335', text: 'May cause respiratory irritation', category: 'health', signalWord: 'Warning' },
  { code: 'H336', text: 'May cause drowsiness or dizziness', category: 'health', signalWord: 'Warning' },
  { code: 'H340', text: 'May cause genetic defects', category: 'health', signalWord: 'Danger' },
  { code: 'H341', text: 'Suspected of causing genetic defects', category: 'health', signalWord: 'Warning' },
  { code: 'H350', text: 'May cause cancer', category: 'health', signalWord: 'Danger' },
  { code: 'H351', text: 'Suspected of causing cancer', category: 'health', signalWord: 'Warning' },
  { code: 'H360', text: 'May damage fertility or the unborn child', category: 'health', signalWord: 'Danger' },
  { code: 'H361', text: 'Suspected of damaging fertility or the unborn child', category: 'health', signalWord: 'Warning' },
  { code: 'H362', text: 'May cause harm to breast-fed children', category: 'health', signalWord: 'Warning' },
  { code: 'H370', text: 'Causes damage to organs', category: 'health', signalWord: 'Danger' },
  { code: 'H371', text: 'May cause damage to organs', category: 'health', signalWord: 'Warning' },
  { code: 'H372', text: 'Causes damage to organs through prolonged or repeated exposure', category: 'health', signalWord: 'Danger' },
  { code: 'H373', text: 'May cause damage to organs through prolonged or repeated exposure', category: 'health', signalWord: 'Warning' },

  // Environmental Hazards (H400 series)
  { code: 'H400', text: 'Very toxic to aquatic life', category: 'environmental', signalWord: 'Warning' },
  { code: 'H401', text: 'Toxic to aquatic life', category: 'environmental', signalWord: 'Warning' },
  { code: 'H402', text: 'Harmful to aquatic life', category: 'environmental', signalWord: 'Warning' },
  { code: 'H410', text: 'Very toxic to aquatic life with long lasting effects', category: 'environmental', signalWord: 'Warning' },
  { code: 'H411', text: 'Toxic to aquatic life with long lasting effects', category: 'environmental', signalWord: 'Warning' },
  { code: 'H412', text: 'Harmful to aquatic life with long lasting effects', category: 'environmental', signalWord: 'Warning' },
  { code: 'H413', text: 'May cause long lasting harmful effects to aquatic life', category: 'environmental', signalWord: 'Warning' },
  { code: 'H420', text: 'Harms public health and the environment by destroying ozone in the upper atmosphere', category: 'environmental', signalWord: 'Warning' },
]

export const P_STATEMENTS: PStatement[] = [
  // General Precautionary Statements (P100 series)
  { code: 'P101', text: 'If medical advice is needed, have product container or label at hand', category: 'general' },
  { code: 'P102', text: 'Keep out of reach of children', category: 'general' },
  { code: 'P103', text: 'Read carefully and follow all instructions', category: 'general' },

  // Prevention (P200 series)
  { code: 'P201', text: 'Obtain special instructions before use', category: 'prevention' },
  { code: 'P202', text: 'Do not handle until all safety precautions have been read and understood', category: 'prevention' },
  { code: 'P210', text: 'Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking', category: 'prevention' },
  { code: 'P211', text: 'Do not spray on an open flame or other ignition source', category: 'prevention' },
  { code: 'P220', text: 'Keep away from clothing and other combustible materials', category: 'prevention' },
  { code: 'P221', text: 'Take any precaution to avoid mixing with combustibles', category: 'prevention' },
  { code: 'P222', text: 'Do not allow contact with air', category: 'prevention' },
  { code: 'P223', text: 'Do not allow contact with water', category: 'prevention' },
  { code: 'P230', text: 'Keep wetted with the specified material', category: 'prevention' },
  { code: 'P231', text: 'Handle and store contents under inert gas', category: 'prevention' },
  { code: 'P232', text: 'Protect from moisture', category: 'prevention' },
  { code: 'P233', text: 'Keep container tightly closed', category: 'prevention' },
  { code: 'P234', text: 'Keep only in original container', category: 'prevention' },
  { code: 'P235', text: 'Keep cool', category: 'prevention' },
  { code: 'P240', text: 'Ground and bond container and receiving equipment', category: 'prevention' },
  { code: 'P241', text: 'Use explosion-proof [electrical/ventilating/lighting] equipment', category: 'prevention' },
  { code: 'P242', text: 'Use non-sparking tools', category: 'prevention' },
  { code: 'P243', text: 'Take action to prevent static discharges', category: 'prevention' },
  { code: 'P244', text: 'Keep valves and fittings free from oil and grease', category: 'prevention' },
  { code: 'P250', text: 'Do not subject to grinding/shock/friction', category: 'prevention' },
  { code: 'P251', text: 'Do not pierce or burn, even after use', category: 'prevention' },
  { code: 'P260', text: 'Do not breathe dust/fume/gas/mist/vapors/spray', category: 'prevention' },
  { code: 'P261', text: 'Avoid breathing dust/fume/gas/mist/vapors/spray', category: 'prevention' },
  { code: 'P262', text: 'Do not get in eyes, on skin, or on clothing', category: 'prevention' },
  { code: 'P263', text: 'Avoid contact during pregnancy and while nursing', category: 'prevention' },
  { code: 'P264', text: 'Wash hands thoroughly after handling', category: 'prevention' },
  { code: 'P270', text: 'Do not eat, drink or smoke when using this product', category: 'prevention' },
  { code: 'P271', text: 'Use only outdoors or in a well-ventilated area', category: 'prevention' },
  { code: 'P272', text: 'Contaminated work clothing should not be allowed out of the workplace', category: 'prevention' },
  { code: 'P273', text: 'Avoid release to the environment', category: 'prevention' },
  { code: 'P280', text: 'Wear protective gloves/protective clothing/eye protection/face protection', category: 'prevention' },
  { code: 'P282', text: 'Wear cold insulating gloves and either face shield or eye protection', category: 'prevention' },
  { code: 'P283', text: 'Wear fire resistant or flame retardant clothing', category: 'prevention' },
  { code: 'P284', text: 'Wear respiratory protection', category: 'prevention' },
  { code: 'P285', text: 'In case of inadequate ventilation, wear respiratory protection', category: 'prevention' },

  // Response (P300 series)
  { code: 'P301', text: 'IF SWALLOWED:', category: 'response' },
  { code: 'P302', text: 'IF ON SKIN:', category: 'response' },
  { code: 'P303', text: 'IF ON SKIN (or hair):', category: 'response' },
  { code: 'P304', text: 'IF INHALED:', category: 'response' },
  { code: 'P305', text: 'IF IN EYES:', category: 'response' },
  { code: 'P306', text: 'IF ON CLOTHING:', category: 'response' },
  { code: 'P308', text: 'IF exposed or concerned:', category: 'response' },
  { code: 'P310', text: 'Immediately call a POISON CENTER/doctor', category: 'response' },
  { code: 'P311', text: 'Call a POISON CENTER/doctor', category: 'response' },
  { code: 'P312', text: 'Call a POISON CENTER/doctor if you feel unwell', category: 'response' },
  { code: 'P313', text: 'Get medical advice/attention', category: 'response' },
  { code: 'P314', text: 'Get medical advice/attention if you feel unwell', category: 'response' },
  { code: 'P315', text: 'Get immediate medical advice/attention', category: 'response' },
  { code: 'P320', text: 'Specific treatment is urgent (see supplemental first aid on label)', category: 'response' },
  { code: 'P321', text: 'Specific treatment (see supplemental first aid on label)', category: 'response' },
  { code: 'P330', text: 'Rinse mouth', category: 'response' },
  { code: 'P331', text: 'Do NOT induce vomiting', category: 'response' },
  { code: 'P332', text: 'If skin irritation occurs:', category: 'response' },
  { code: 'P333', text: 'If skin irritation or rash occurs:', category: 'response' },
  { code: 'P334', text: 'Immerse in cool water or wrap in wet bandages', category: 'response' },
  { code: 'P335', text: 'Brush off loose particles from skin', category: 'response' },
  { code: 'P336', text: 'Thaw frosted parts with lukewarm water. Do not rub affected area', category: 'response' },
  { code: 'P337', text: 'If eye irritation persists:', category: 'response' },
  { code: 'P338', text: 'Remove contact lenses, if present and easy to do. Continue rinsing', category: 'response' },
  { code: 'P340', text: 'Remove person to fresh air and keep comfortable for breathing', category: 'response' },
  { code: 'P342', text: 'If experiencing respiratory symptoms:', category: 'response' },
  { code: 'P351', text: 'Rinse cautiously with water for several minutes', category: 'response' },
  { code: 'P352', text: 'Wash with plenty of water', category: 'response' },
  { code: 'P353', text: 'Rinse skin with water or shower', category: 'response' },
  { code: 'P360', text: 'Rinse immediately contaminated clothing and skin with plenty of water before removing clothing', category: 'response' },
  { code: 'P361', text: 'Take off immediately all contaminated clothing', category: 'response' },
  { code: 'P362', text: 'Take off contaminated clothing', category: 'response' },
  { code: 'P363', text: 'Wash contaminated clothing before reuse', category: 'response' },
  { code: 'P370', text: 'In case of fire:', category: 'response' },
  { code: 'P371', text: 'In case of major fire and large quantities:', category: 'response' },
  { code: 'P372', text: 'Explosion risk', category: 'response' },
  { code: 'P373', text: 'DO NOT fight fire when fire reaches explosives', category: 'response' },
  { code: 'P375', text: 'Fight fire remotely due to the risk of explosion', category: 'response' },
  { code: 'P376', text: 'Stop leak if safe to do so', category: 'response' },
  { code: 'P377', text: 'Leaking gas fire: Do not extinguish, unless leak can be stopped safely', category: 'response' },
  { code: 'P378', text: 'Use appropriate media to extinguish', category: 'response' },
  { code: 'P380', text: 'Evacuate area', category: 'response' },
  { code: 'P381', text: 'In case of leakage, eliminate all ignition sources', category: 'response' },
  { code: 'P390', text: 'Absorb spillage to prevent material damage', category: 'response' },
  { code: 'P391', text: 'Collect spillage', category: 'response' },

  // Storage (P400 series)
  { code: 'P401', text: 'Store in accordance with applicable regulations', category: 'storage' },
  { code: 'P402', text: 'Store in a dry place', category: 'storage' },
  { code: 'P403', text: 'Store in a well-ventilated place', category: 'storage' },
  { code: 'P404', text: 'Store in a closed container', category: 'storage' },
  { code: 'P405', text: 'Store locked up', category: 'storage' },
  { code: 'P406', text: 'Store in a corrosive resistant container with a resistant inner liner', category: 'storage' },
  { code: 'P407', text: 'Maintain air gap between stacks or pallets', category: 'storage' },
  { code: 'P410', text: 'Protect from sunlight', category: 'storage' },
  { code: 'P411', text: 'Store at temperatures not exceeding specified temperature', category: 'storage' },
  { code: 'P412', text: 'Do not expose to temperatures exceeding 50\u00B0C / 122\u00B0F', category: 'storage' },
  { code: 'P413', text: 'Store bulk masses greater than specified weight at temperatures not exceeding specified temperature', category: 'storage' },
  { code: 'P420', text: 'Store separately', category: 'storage' },
  { code: 'P422', text: 'Store contents under specified liquid or inert gas', category: 'storage' },

  // Disposal (P500 series)
  { code: 'P501', text: 'Dispose of contents/container in accordance with local/regional/national/international regulations', category: 'disposal' },
  { code: 'P502', text: 'Refer to manufacturer or supplier for information on recovery or recycling', category: 'disposal' },
]

// -----------------------------------------------------------------------------
// 6. Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get a GHS pictogram by code (e.g., 'GHS01')
 */
export function getGHSPictogram(code: string): GHSPictogram | undefined {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '')
  return GHS_PICTOGRAMS.find((p) => p.code === normalizedCode)
}

/**
 * Check chemical compatibility between two groups.
 * Returns compatibility status and reason.
 */
export function checkCompatibility(group1Id: string, group2Id: string): CompatibilityResult {
  if (group1Id === group2Id) {
    return { compatible: true, reason: 'Same group \u2014 compatible for storage together.', severity: 'safe' }
  }

  const set1 = incompatibilityMap.get(group1Id)
  const set2 = incompatibilityMap.get(group2Id)

  if (!set1 && !set2) {
    return { compatible: true, reason: 'No known incompatibility recorded.', severity: 'caution' }
  }

  const isIncompatible = (set1?.has(group2Id) ?? false) || (set2?.has(group1Id) ?? false)

  if (isIncompatible) {
    const g1 = COMPATIBILITY_GROUPS.find((g) => g.id === group1Id)
    const g2 = COMPATIBILITY_GROUPS.find((g) => g.id === group2Id)
    const reasons: string[] = []
    if (g1 && g1.incompatibleWith.includes(group2Id)) reasons.push(g1.reason)
    if (g2 && g2.incompatibleWith.includes(group1Id)) reasons.push(g2.reason)
    const combinedReason = reasons.length > 0 ? reasons[0] : 'These chemical groups are incompatible and must be stored separately.'
    return { compatible: false, reason: combinedReason, severity: 'incompatible' }
  }

  return { compatible: true, reason: 'No known incompatibility. Always consult SDS for specific chemicals.', severity: 'safe' }
}

/**
 * Get emergency procedure(s) by type.
 */
export function getEmergencyProcedure(type: string): EmergencyProcedure[] {
  return EMERGENCY_PROCEDURES.filter((p) => p.type === type || p.id === type)
}

/**
 * Search across all safety data (pictograms, rules, procedures, H/P statements).
 * Returns matching items grouped by category.
 */
export function searchSafety(query: string): {
  pictograms: GHSPictogram[]
  compatibilityGroups: CompatibilityGroup[]
  emergencyProcedures: EmergencyProcedure[]
  safetyRules: SafetyRule[]
  hStatements: HStatement[]
  pStatements: PStatement[]
} {
  const q = query.toLowerCase().trim()

  if (!q) {
    return {
      pictograms: [],
      compatibilityGroups: [],
      emergencyProcedures: [],
      safetyRules: [],
      hStatements: [],
      pStatements: [],
    }
  }

  const matchesText = (text: string) => text.toLowerCase().includes(q)
  const matchesArray = (arr: string[]) => arr.some((item) => item.toLowerCase().includes(q))

  const pictograms = GHS_PICTOGRAMS.filter(
    (p) => matchesText(p.name) || matchesText(p.code) || matchesArray(p.hazards) || matchesArray(p.examples) || matchesArray(p.precautions)
  )

  const compatibilityGroups = COMPATIBILITY_GROUPS.filter(
    (g) => matchesText(g.name) || matchesArray(g.examples) || matchesText(g.reason)
  )

  const emergencyProcedures = EMERGENCY_PROCEDURES.filter(
    (p) => matchesText(p.title) || matchesText(p.type) || matchesArray(p.steps) || matchesArray(p.doNot)
  )

  const safetyRules = SAFETY_RULES.filter(
    (r) => matchesText(r.rule) || matchesText(r.explanation) || matchesText(r.category)
  )

  const hStatements = H_STATEMENTS.filter(
    (h) => matchesText(h.code) || matchesText(h.text) || matchesText(h.category)
  )

  const pStatements = P_STATEMENTS.filter(
    (p) => matchesText(p.code) || matchesText(p.text) || matchesText(p.category)
  )

  return { pictograms, compatibilityGroups, emergencyProcedures, safetyRules, hStatements, pStatements }
}

/**
 * Get the safety category label for display.
 */
export function getSafetyCategoryLabel(category: SafetyRule['category']): string {
  const labels: Record<SafetyRule['category'], string> = {
    ppe: 'Personal Protective Equipment (PPE)',
    chemical_handling: 'Chemical Handling',
    equipment: 'Equipment & Procedures',
    waste_disposal: 'Waste Disposal',
    general: 'General Laboratory Safety',
  }
  return labels[category]
}

/**
 * Get the P-statement category label for display.
 */
export function getPStatementCategoryLabel(category: PStatement['category']): string {
  const labels: Record<PStatement['category'], string> = {
    general: 'General',
    prevention: 'Prevention',
    response: 'Response',
    storage: 'Storage',
    disposal: 'Disposal',
  }
  return labels[category]
}
