import { NamedReaction } from '@/lib/types/organic-chemistry'

/**
 * Intermediate Named Reactions (Organic Chemistry II)
 * 15 key reactions for second-semester organic chemistry
 */
export const INTERMEDIATE_REACTIONS: NamedReaction[] = [
  {
    id: 'grignard',
    name: 'Grignard Reaction',
    altNames: ['Grignard Reagent Addition'],
    year: 1900,
    discoverer: 'Victor Grignard',
    category: 'addition',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Aldehyde, Ketone, or Ester'],
      reagents: ['RMgBr (Grignard reagent)'],
      conditions: ['Anhydrous ether (Et₂O or THF), then H₃O⁺ workup'],
      products: ['Alcohol (1°, 2°, or 3° depending on substrate)'],
    },
    equation: 'R-MgBr + R\'CHO → R-CH(OH)-R\' (after H₃O⁺)',
    description:
      'The Grignard reagent (RMgBr) is a powerful organometallic nucleophile that adds to carbonyl compounds. Formaldehyde → 1° alcohol, aldehydes → 2° alcohol, ketones → 3° alcohol, esters → 3° alcohol (two equivalents add). Nobel Prize 1912.',
    mechanism: [
      {
        step: 1,
        description:
          'Grignard reagent preparation: An alkyl halide reacts with Mg metal in anhydrous ether to form the organomagnesium halide (R-MgBr).',
        arrowType: 'curved',
        intermediateFormula: 'R-MgBr',
        notes: 'Must be completely anhydrous — water destroys Grignard',
      },
      {
        step: 2,
        description:
          'Nucleophilic addition: The carbanion equivalent (R⁻) from the Grignard attacks the electrophilic carbonyl carbon, forming an alkoxide.',
        arrowType: 'curved',
        intermediateFormula: 'R-C(OMgBr)-R\'',
        notes: 'C-C bond forming step',
      },
      {
        step: 3,
        description:
          'Acid workup (H₃O⁺): Protonation of the magnesium alkoxide to give the free alcohol.',
        arrowType: 'curved',
        notes: 'Separate step — add acid after reaction complete',
      },
    ],
    keyPoints: [
      'Forms new C-C bond (extremely valuable!)',
      'HCHO → 1° alcohol, RCHO → 2° alcohol, R₂CO → 3° alcohol',
      'Esters: 2 equiv RMgBr add → 3° alcohol',
      'CO₂ + RMgBr → carboxylic acid (after H₃O⁺)',
      'Must be anhydrous — water, alcohols, amines all destroy Grignard',
      'Cannot have -OH, -NH, -SH, -COOH in same molecule as RMgBr',
      'Victor Grignard — Nobel Prize 1912',
    ],
    examples: [
      {
        reactant: 'Benzaldehyde + CH₃MgBr',
        product: '1-Phenylethan-1-ol',
        reagent: 'Et₂O, then H₃O⁺',
        yield: '85%',
      },
      {
        reactant: 'Acetone + PhMgBr',
        product: '2-Methyl-2-phenylpropan-2-ol',
        reagent: 'THF, then H₃O⁺',
        yield: '80%',
      },
      {
        reactant: 'CO₂ + CH₃MgBr',
        product: 'Acetic acid',
        reagent: 'Et₂O, then H₃O⁺',
        yield: '75%',
      },
    ],
    syntheticUtility:
      'One of the most important C-C bond-forming reactions in organic synthesis. Foundational tool for building carbon skeletons.',
    limitations: [
      'Extremely moisture-sensitive (must be anhydrous)',
      'Incompatible with protic functional groups (-OH, -NH, -COOH)',
      'Aryl and vinyl halides require THF (not Et₂O)',
      'Steric hindrance can slow addition to ketones',
    ],
    functionalGroups: ['alkyl-halide', 'aldehyde', 'ketone', 'alcohol'],
    tags: ['C-C bond', 'organometallic', 'Grignard', 'Nobel', 'nucleophilic addition'],
    relatedReactions: ['wittig', 'aldol'],
  },
  {
    id: 'aldol',
    name: 'Aldol Condensation',
    altNames: ['Aldol Reaction', 'Aldol Addition'],
    year: 1872,
    discoverer: 'Charles-Adolphe Wurtz',
    category: 'condensation',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Aldehyde or Ketone with α-hydrogens'],
      reagents: ['NaOH or LDA'],
      conditions: ['Base, H₂O or THF; heat for condensation'],
      products: ['β-Hydroxy carbonyl (aldol) or α,β-Unsaturated carbonyl (condensation)'],
    },
    equation: '2 RCHO → RCH(OH)CH₂CHO (aldol) → RCH=CHCHO + H₂O (condensation)',
    description:
      'An enolate (or enol) of one carbonyl compound attacks the carbonyl of another. The aldol addition product is a β-hydroxy carbonyl compound. Heating causes dehydration to the α,β-unsaturated carbonyl (aldol condensation). This forms a new C-C bond.',
    mechanism: [
      {
        step: 1,
        description:
          'Enolate formation: Base (OH⁻ or LDA) removes an α-hydrogen to form the resonance-stabilized enolate anion.',
        arrowType: 'curved',
        intermediateFormula: 'Enolate (RC⁻=CHO ↔ RC=CHO⁻)',
        notes: 'α-Hydrogen is slightly acidic (pKa ~20)',
      },
      {
        step: 2,
        description:
          'Nucleophilic addition: The enolate carbon attacks the carbonyl carbon of a second molecule, forming the aldol (β-hydroxy carbonyl).',
        arrowType: 'curved',
        intermediateFormula: 'β-Hydroxy aldehyde/ketone',
        notes: 'New C-C bond formed',
      },
      {
        step: 3,
        description:
          'Dehydration (condensation): With heat, the β-hydroxy group eliminates water through an E1cb mechanism to form the α,β-unsaturated carbonyl.',
        arrowType: 'curved',
        notes: 'Only under heating — gives conjugated enone/enal',
      },
    ],
    keyPoints: [
      'Forms C-C bond between α-carbon and carbonyl carbon',
      'Aldol addition (low T) vs aldol condensation (high T, with -H₂O)',
      'Crossed aldol: mix two different carbonyls (selectivity challenge)',
      'Directed aldol: use LDA at -78°C for kinetic enolate',
      'Intramolecular aldol: makes 5- and 6-membered rings',
      'Retro-aldol: reverse reaction (breaks C-C bond)',
      'Very common in biosynthesis (aldolase enzymes)',
    ],
    examples: [
      {
        reactant: '2 Acetaldehyde (CH₃CHO)',
        product: '3-Hydroxybutanal (aldol product)',
        reagent: 'NaOH (dilute), 5°C',
        yield: '70%',
      },
      {
        reactant: 'Benzaldehyde + Acetone',
        product: 'Dibenzalacetone',
        reagent: 'NaOH, EtOH, heat',
        yield: '85% (crossed aldol condensation)',
      },
    ],
    syntheticUtility:
      'One of the most powerful C-C bond-forming reactions. Builds β-hydroxy carbonyls and enones. Foundational in total synthesis and industrial chemistry.',
    limitations: [
      'Self-condensation competes with crossed aldol',
      'Crossed aldol requires one partner with no α-H (or use LDA)',
      'Ketone aldols are less favorable (equilibrium)',
      'Over-condensation possible with multiple α-H\'s',
    ],
    functionalGroups: ['aldehyde', 'ketone'],
    tags: ['C-C bond', 'enolate', 'condensation', 'aldol', 'retrosynthesis'],
    relatedReactions: ['claisen-condensation', 'michael-addition', 'robinson-annulation'],
  },
  {
    id: 'wittig',
    name: 'Wittig Reaction',
    altNames: ['Wittig Olefination'],
    year: 1954,
    discoverer: 'Georg Wittig',
    category: 'addition',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Aldehyde or Ketone'],
      reagents: ['Phosphonium ylide (Ph₃P=CHR)'],
      conditions: ['THF or Et₂O, RT to reflux'],
      products: ['Alkene + Ph₃P=O (triphenylphosphine oxide)'],
    },
    equation: 'R₂C=O + Ph₃P=CHR\' → R₂C=CHR\' + Ph₃P=O',
    description:
      'Converts a C=O to a C=C: the phosphorus ylide reacts with an aldehyde/ketone to give an alkene and triphenylphosphine oxide. The position of the new double bond is unambiguous (unlike elimination). Nobel Prize 1979.',
    mechanism: [
      {
        step: 1,
        description:
          'Ylide preparation: An alkyl halide reacts with PPh₃ to form a phosphonium salt. Treatment with strong base (n-BuLi) generates the ylide (Ph₃P=CHR).',
        arrowType: 'curved',
        intermediateFormula: 'Ph₃P=CHR (Wittig reagent)',
        notes: 'Ylide has carbanion character stabilized by phosphorus',
      },
      {
        step: 2,
        description:
          'The ylide carbon attacks the carbonyl carbon, forming a betaine intermediate that cyclizes to an oxaphosphetane (4-membered ring with O and P).',
        arrowType: 'curved',
        intermediateFormula: 'Oxaphosphetane (4-membered ring)',
        notes: 'Key intermediate — determines E/Z selectivity',
      },
      {
        step: 3,
        description:
          'The oxaphosphetane undergoes retro-[2+2] cycloreversion to give the alkene and triphenylphosphine oxide (strong P=O bond is the driving force).',
        arrowType: 'retro',
        notes: 'Thermodynamically driven by strong P=O bond',
      },
    ],
    keyPoints: [
      'Creates C=C exactly where C=O was — no ambiguity',
      'Non-stabilized ylides → Z-alkene (kinetic)',
      'Stabilized ylides (EWG on α-C) → E-alkene',
      'HWE modification (phosphonate esters) gives E-alkene selectively',
      'Complementary to Grignard (which gives alcohols)',
      'Georg Wittig — Nobel Prize 1979',
    ],
    examples: [
      {
        reactant: 'Cyclohexanone + Ph₃P=CH₂',
        product: 'Methylenecyclohexane',
        reagent: 'THF',
        yield: '85%',
      },
      {
        reactant: 'Benzaldehyde + Ph₃P=CHCO₂Et',
        product: 'Ethyl (E)-cinnamate',
        reagent: 'THF (stabilized ylide → E)',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Essential for total synthesis — places the C=C double bond at an exact, predetermined position. The "disconnection" approach in retrosynthesis relies heavily on Wittig.',
    limitations: [
      'Ph₃P=O byproduct difficult to separate',
      'Non-stabilized ylides are moisture-sensitive',
      'Sterically hindered ketones may give low yields',
      'E/Z selectivity can be unpredictable with some substrates',
    ],
    functionalGroups: ['aldehyde', 'ketone', 'alkene'],
    tags: ['C=C formation', 'olefination', 'ylide', 'Nobel', 'retrosynthesis'],
    relatedReactions: ['grignard', 'aldol'],
  },
  {
    id: 'diels-alder',
    name: 'Diels-Alder Reaction',
    altNames: ['[4+2] Cycloaddition'],
    year: 1928,
    discoverer: 'Otto Diels, Kurt Alder',
    category: 'cycloaddition',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Conjugated diene (4π electrons)', 'Dienophile (2π electrons)'],
      reagents: ['None (or Lewis acid catalyst)'],
      conditions: ['Heat or Lewis acid (AlCl₃)'],
      products: ['Cyclohexene derivative (6-membered ring)'],
    },
    equation: 'Diene + Dienophile → Cyclohexene',
    description:
      'A concerted [4+2] pericyclic cycloaddition: a conjugated diene (4π) reacts with a dienophile (2π) to form a new 6-membered ring with one C=C. The diene must be in s-cis conformation. Suprafacial on both components. Nobel Prize 1950.',
    mechanism: [
      {
        step: 1,
        description:
          'The diene (in s-cis conformation) and dienophile approach each other. Six electrons reorganize simultaneously: 3 π bonds break and 2 σ bonds + 1 π bond form in a concerted, synchronous process.',
        arrowType: 'curved',
        notes: 'Concerted — all bonds form/break at once. No intermediate.',
      },
    ],
    keyPoints: [
      'Concerted pericyclic reaction — no intermediates, no catalysts needed',
      'Diene MUST adopt s-cis conformation (locked s-trans dienes don\'t react)',
      'Electron-rich diene + electron-poor dienophile = fastest (normal demand)',
      'Endo rule: endo product kinetically favored (secondary orbital interactions)',
      'Stereospecific: cis-dienophile → cis substituents in product (syn addition)',
      'Retro-Diels-Alder: reverse at high temperature',
      'Otto Diels & Kurt Alder — Nobel Prize 1950',
    ],
    examples: [
      {
        reactant: '1,3-Butadiene + Ethylene',
        product: 'Cyclohexene',
        reagent: 'Heat (200°C)',
        yield: '70%',
      },
      {
        reactant: 'Cyclopentadiene + Maleic anhydride',
        product: 'Norbornene derivative (endo)',
        reagent: 'RT (very reactive pair)',
        yield: '95%',
      },
      {
        reactant: '1,3-Butadiene + Acrolein',
        product: '2-Cyclohexene-1-carboxaldehyde',
        reagent: 'AlCl₃ catalyst',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Arguably the most powerful reaction in organic synthesis. Forms 2 C-C bonds and up to 4 stereocenters in one step. Essential for building 6-membered rings in natural product synthesis.',
    limitations: [
      'Diene must be able to adopt s-cis conformation',
      'Electron-poor dienes react poorly (inverse electron demand needed)',
      'Some reactions require very high temperatures',
      'Regiochemistry can be complex with unsymmetrical partners',
    ],
    functionalGroups: ['alkene'],
    tags: ['cycloaddition', 'pericyclic', '4+2', 'ring formation', 'Nobel', 'concerted'],
    relatedReactions: ['robinson-annulation'],
  },
  {
    id: 'claisen-condensation',
    name: 'Claisen Condensation',
    altNames: ['Claisen Ester Condensation'],
    year: 1887,
    discoverer: 'Rainer Ludwig Claisen',
    category: 'condensation',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Ester with α-hydrogens (2 equivalents)'],
      reagents: ['NaOEt (sodium ethoxide) or NaOMe'],
      conditions: ['Anhydrous ethanol, reflux'],
      products: ['β-Keto ester + EtOH'],
    },
    equation: '2 RCH₂CO₂Et → RCH₂COCH(R)CO₂Et + EtOH',
    description:
      'The ester analog of the aldol reaction: an ester enolate attacks the carbonyl of another ester molecule, followed by loss of alkoxide to give a β-keto ester. Driven forward by deprotonation of the acidic α-H between the two carbonyls.',
    mechanism: [
      {
        step: 1,
        description:
          'Enolate formation: Ethoxide removes an α-hydrogen from the ester to form the ester enolate.',
        arrowType: 'curved',
        intermediateFormula: 'Ester enolate',
      },
      {
        step: 2,
        description:
          'Nucleophilic acyl substitution: The enolate attacks the carbonyl of a second ester molecule, forming a tetrahedral intermediate.',
        arrowType: 'curved',
        intermediateFormula: 'Tetrahedral intermediate',
      },
      {
        step: 3,
        description:
          'The tetrahedral intermediate collapses, expelling ethoxide to give the β-keto ester product.',
        arrowType: 'curved',
      },
      {
        step: 4,
        description:
          'Irreversible deprotonation: Ethoxide removes the acidic proton between the two carbonyls (pKa ~11). This drives the equilibrium forward.',
        arrowType: 'curved',
        notes: 'Thermodynamic driving force — need full equiv of base',
      },
    ],
    keyPoints: [
      'Ester version of aldol reaction',
      'Product: β-keto ester (1,3-dicarbonyl)',
      'Requires full equivalent of base (not catalytic) to deprotonate product',
      'Crossed Claisen: one ester must have no α-H (formate, oxalate, benzoate)',
      'Dieckmann cyclization: intramolecular Claisen (makes rings)',
      'Acetoacetic ester synthesis uses Claisen product as starting material',
    ],
    examples: [
      {
        reactant: '2 Ethyl acetate',
        product: 'Ethyl acetoacetate (acetoacetic ester)',
        reagent: 'NaOEt, EtOH, reflux',
        yield: '75%',
      },
      {
        reactant: 'Diethyl adipate (intramolecular)',
        product: '2-Carbethoxycyclopentanone (Dieckmann)',
        reagent: 'NaOEt, reflux',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Primary route to β-keto esters (1,3-dicarbonyl compounds), which are versatile synthetic intermediates for acetoacetic ester and malonic ester syntheses.',
    limitations: [
      'Ester must have 2+ α-hydrogens (to form enolate AND lose one for irreversibility)',
      'Crossed Claisen can give mixtures',
      'Requires stoichiometric base',
    ],
    functionalGroups: ['ester', 'ketone'],
    tags: ['condensation', 'enolate', 'β-keto ester', '1,3-dicarbonyl', 'Claisen'],
    relatedReactions: ['aldol', 'michael-addition'],
  },
  {
    id: 'michael-addition',
    name: 'Michael Addition',
    altNames: ['Conjugate Addition', '1,4-Addition'],
    year: 1887,
    discoverer: 'Arthur Michael',
    category: 'addition',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: [
        'Michael donor (enolate, malonate, etc.)',
        'Michael acceptor (α,β-unsaturated carbonyl)',
      ],
      reagents: ['Base (NaOEt, NaOH, or DBU)'],
      conditions: ['EtOH or THF'],
      products: ['1,5-Dicarbonyl compound'],
    },
    equation: 'Nu⁻ + CH₂=CH-C=O → Nu-CH₂-CH₂-C=O',
    description:
      'Conjugate (1,4-) addition of a stabilized nucleophile (Michael donor) to an α,β-unsaturated carbonyl (Michael acceptor). The nucleophile adds to the β-carbon rather than the carbonyl carbon, giving a 1,5-dicarbonyl relationship.',
    mechanism: [
      {
        step: 1,
        description:
          'Enolate formation: Base deprotonates the Michael donor (malonate, acetoacetate, or ketone) to form the nucleophilic enolate.',
        arrowType: 'curved',
      },
      {
        step: 2,
        description:
          'Conjugate addition: The enolate attacks the β-carbon (not the carbonyl C) of the α,β-unsaturated carbonyl, forming an enolate intermediate.',
        arrowType: 'curved',
        intermediateFormula: 'Enolate of 1,5-dicarbonyl',
        notes: '1,4-addition (to β-carbon), not 1,2-addition (to C=O)',
      },
      {
        step: 3,
        description: 'Protonation of the enolate intermediate gives the 1,5-dicarbonyl product.',
        arrowType: 'curved',
      },
    ],
    keyPoints: [
      '1,4-Addition (conjugate) vs 1,2-Addition (direct to C=O)',
      'Soft nucleophiles favor 1,4-addition (enolates, cuprates, thiols)',
      'Hard nucleophiles favor 1,2-addition (Grignard, LiAlH₄)',
      'Creates 1,5-dicarbonyl relationship (important retrosynthetic disconnection)',
      'Key step in Robinson annulation (Michael + intramolecular aldol)',
      'Common donors: malonates, cyanoacetates, nitroalkanes',
      'Common acceptors: enones, acrylates, nitroalkenes',
    ],
    examples: [
      {
        reactant: 'Diethyl malonate + Methyl vinyl ketone',
        product: 'Diethyl 2-(3-oxobutyl)malonate',
        reagent: 'NaOEt, EtOH',
        yield: '85%',
      },
      {
        reactant: 'Acetoacetic ester + Acrylonitrile',
        product: '2-Acetyl-4-cyanoglutarate',
        reagent: 'NaOEt, EtOH',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Powerful C-C bond-forming reaction. The 1,5-dicarbonyl products are ideal for further cyclization (Robinson annulation). Extremely common in total synthesis.',
    limitations: [
      'Competing 1,2-addition with hard nucleophiles',
      'Polyalkylation possible (multiple additions)',
      'Base-sensitive substrates may decompose',
    ],
    functionalGroups: ['ketone', 'ester'],
    tags: ['conjugate addition', '1,4-addition', 'enolate', '1,5-dicarbonyl', 'Michael'],
    relatedReactions: ['aldol', 'robinson-annulation', 'claisen-condensation'],
  },
  {
    id: 'friedel-crafts-alkylation',
    name: 'Friedel-Crafts Alkylation',
    altNames: ['FC Alkylation'],
    year: 1877,
    discoverer: 'Charles Friedel, James Crafts',
    category: 'substitution',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Arene (ArH)', 'Alkyl halide (RX)'],
      reagents: ['AlCl₃ (Lewis acid catalyst)'],
      conditions: ['Anhydrous, RT to reflux'],
      products: ['Alkylated arene (ArR) + HX'],
    },
    equation: 'ArH + RCl + AlCl₃ → ArR + HCl',
    description:
      'Lewis acid-catalyzed electrophilic aromatic substitution where an alkyl group is introduced onto the aromatic ring. AlCl₃ generates a carbocation (or carbocation-like) electrophile from the alkyl halide.',
    mechanism: [
      {
        step: 1,
        description:
          'AlCl₃ coordinates with the alkyl halide, generating a carbocation (or a highly polarized complex that acts like one).',
        arrowType: 'curved',
        intermediateFormula: 'R⁺ AlCl₄⁻',
        notes: '3° halides form free carbocations; 1° form polarized complexes',
      },
      {
        step: 2,
        description:
          'The electrophilic carbocation attacks the aromatic ring, forming the arenium ion (sigma complex).',
        arrowType: 'curved',
        intermediateFormula: 'Arenium ion',
      },
      {
        step: 3,
        description: 'Deprotonation restores aromaticity, giving the alkylated arene product.',
        arrowType: 'curved',
      },
    ],
    keyPoints: [
      'Polyalkylation problem: product is MORE reactive than starting material',
      'Carbocation rearrangements: 1° → 2° → 3° (can\'t make n-propylbenzene)',
      'Solution to polyalkylation: use FC acylation + Wolff-Kishner instead',
      'Does NOT work with deactivated rings (NO₂, -COR, -SO₃H)',
      'Does NOT work with NH₂ groups (coordinates to AlCl₃)',
      'Can use alkenes or alcohols instead of alkyl halides as electrophile source',
    ],
    examples: [
      {
        reactant: 'Benzene + CH₃Cl',
        product: 'Toluene (+ polyalkylation products)',
        reagent: 'AlCl₃',
        yield: '60% (mixture)',
      },
      {
        reactant: 'Benzene + (CH₃)₂C=CH₂',
        product: 'tert-Butylbenzene',
        reagent: 'AlCl₃ or H₃PO₄',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Introduces alkyl groups onto aromatic rings. Limited by polyalkylation and rearrangements — FC acylation is usually preferred.',
    limitations: [
      'Polyalkylation (product more reactive than starting material)',
      'Carbocation rearrangements (1° halides give rearranged products)',
      'Deactivated rings don\'t react',
      '-NH₂ coordinates Lewis acid, poisoning catalyst',
    ],
    functionalGroups: ['arene', 'alkyl-halide'],
    tags: ['EAS', 'Friedel-Crafts', 'alkylation', 'Lewis acid', 'carbocation'],
    relatedReactions: ['friedel-crafts-acylation', 'electrophilic-aromatic-substitution'],
  },
  {
    id: 'friedel-crafts-acylation',
    name: 'Friedel-Crafts Acylation',
    altNames: ['FC Acylation'],
    year: 1877,
    discoverer: 'Charles Friedel, James Crafts',
    category: 'substitution',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Arene (ArH)', 'Acyl chloride (RCOCl) or Anhydride'],
      reagents: ['AlCl₃ (> 1 equiv)'],
      conditions: ['Anhydrous, RT to reflux'],
      products: ['Aryl ketone (ArCOR) + HCl'],
    },
    equation: 'ArH + RCOCl + AlCl₃ → ArCOR + HCl',
    description:
      'Lewis acid-catalyzed introduction of an acyl group (C=O-R) onto an aromatic ring. Superior to FC alkylation because: (1) no rearrangements (acylium ion is resonance-stabilized), (2) no polyacylation (product is deactivated), (3) can reduce C=O later for net alkylation.',
    mechanism: [
      {
        step: 1,
        description:
          'AlCl₃ reacts with the acyl chloride to form the acylium ion (RC≡O⁺), stabilized by resonance.',
        arrowType: 'curved',
        intermediateFormula: 'RC≡O⁺ (acylium ion)',
        notes: 'No rearrangement — acylium is resonance-stabilized',
      },
      {
        step: 2,
        description: 'The acylium ion attacks the aromatic ring, forming the arenium ion.',
        arrowType: 'curved',
        intermediateFormula: 'Arenium ion',
      },
      {
        step: 3,
        description: 'Deprotonation restores aromaticity. The ketone product coordinates with AlCl₃.',
        arrowType: 'curved',
        notes: 'Need > 1 equiv AlCl₃ (product complexes with one equiv)',
      },
    ],
    keyPoints: [
      'No rearrangements (acylium ion is stable)',
      'No polyacylation (product is EWG-deactivated)',
      'Requires > 1 equiv AlCl₃ (product complexes with catalyst)',
      'Clemmensen (Zn/Hg, HCl) or Wolff-Kishner (H₂NNH₂, KOH) to reduce C=O → CH₂',
      'FC Acylation + reduction = best route to straight-chain alkylbenzenes',
      'Can use anhydrides instead of acyl chlorides',
    ],
    examples: [
      {
        reactant: 'Benzene + CH₃COCl',
        product: 'Acetophenone',
        reagent: 'AlCl₃ (1.1 equiv)',
        yield: '90%',
      },
      {
        reactant: 'Anisole + Succinic anhydride',
        product: '4-(4-Methoxyphenyl)-4-oxobutanoic acid',
        reagent: 'AlCl₃',
        yield: '85%',
      },
    ],
    syntheticUtility:
      'Preferred over FC alkylation for making alkylbenzenes (acylation + reduction). Also gives aryl ketones directly for pharmaceutical synthesis.',
    limitations: [
      'Requires > stoichiometric AlCl₃ (not truly catalytic)',
      'Deactivated rings don\'t react',
      '-NH₂ groups poison AlCl₃',
      'Generates stoichiometric aluminum waste',
    ],
    functionalGroups: ['arene', 'acyl-halide', 'ketone'],
    tags: ['EAS', 'Friedel-Crafts', 'acylation', 'acylium', 'aryl ketone'],
    relatedReactions: ['friedel-crafts-alkylation', 'wolff-kishner', 'clemmensen-reduction'],
  },
  {
    id: 'williamson-ether',
    name: 'Williamson Ether Synthesis',
    altNames: ['Williamson Synthesis'],
    year: 1850,
    discoverer: 'Alexander Williamson',
    category: 'substitution',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Alkoxide (RO⁻)', 'Primary alkyl halide (R\'X)'],
      reagents: ['NaH or Na metal (to form alkoxide)'],
      conditions: ['Anhydrous THF or DMF'],
      products: ['Ether (R-O-R\')'],
    },
    equation: 'RO⁻ + R\'X → R-O-R\' (SN2)',
    description:
      'SN2 reaction between an alkoxide nucleophile and a primary (or methyl) alkyl halide to form an ether. The key planning decision is which oxygen becomes the alkoxide and which carbon bears the halide — always make the less hindered partner the halide.',
    mechanism: [
      {
        step: 1,
        description:
          'Alkoxide formation: Treat the alcohol with NaH or Na metal to generate the alkoxide nucleophile (RO⁻).',
        arrowType: 'curved',
        intermediateFormula: 'RO⁻ Na⁺',
      },
      {
        step: 2,
        description:
          'SN2 displacement: The alkoxide attacks the primary alkyl halide from the back side, forming the ether product.',
        arrowType: 'curved',
        notes: 'Must use 1° or methyl halide to avoid E2 elimination',
      },
    ],
    keyPoints: [
      'SN2 mechanism — requires primary or methyl alkyl halide',
      'Bulky alkoxides + secondary/tertiary halides → E2 elimination instead',
      'Planning: Make the more hindered alcohol the alkoxide, less hindered the halide',
      'Good for both symmetrical and unsymmetrical ethers',
      'Intramolecular version makes epoxides (3-membered ring ethers)',
      'Tosylates (OTs) and mesylates (OMs) work as well as halides',
    ],
    examples: [
      {
        reactant: 'Sodium ethoxide + Methyl iodide',
        product: 'Methyl ethyl ether',
        reagent: 'THF',
        yield: '95%',
      },
      {
        reactant: 'Sodium phenoxide + Benzyl bromide',
        product: 'Benzyl phenyl ether',
        reagent: 'DMF',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'The standard method for ether synthesis. Simple, reliable, and works for a wide range of substrates.',
    limitations: [
      'Secondary and tertiary halides undergo E2 instead',
      'Must plan which partner is alkoxide vs halide',
      'Requires anhydrous conditions',
    ],
    functionalGroups: ['alcohol', 'alkyl-halide', 'ether'],
    tags: ['SN2', 'ether', 'alkoxide', 'Williamson'],
    relatedReactions: ['sn2', 'epoxide-opening'],
  },
  {
    id: 'jones-oxidation',
    name: 'Jones Oxidation',
    altNames: ['Chromic Acid Oxidation', 'Jones Reagent'],
    category: 'oxidation',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Primary or Secondary alcohol'],
      reagents: ['CrO₃/H₂SO₄/H₂O (Jones reagent)'],
      conditions: ['Acetone, 0°C'],
      products: [
        'Primary alcohol → Carboxylic acid',
        'Secondary alcohol → Ketone',
      ],
    },
    equation: 'RCH₂OH → RCOOH (1°); R₂CHOH → R₂C=O (2°)',
    description:
      'A strong Cr(VI) oxidation that converts primary alcohols all the way to carboxylic acids and secondary alcohols to ketones. Cannot stop at the aldehyde stage for primary alcohols (use PCC or Swern for that).',
    mechanism: [
      {
        step: 1,
        description:
          'The alcohol forms a chromate ester with CrO₃ under acidic conditions.',
        arrowType: 'curved',
        intermediateFormula: 'Chromate ester (R-O-CrO₃H)',
      },
      {
        step: 2,
        description:
          'An E2-like elimination removes the α-hydrogen and breaks the Cr-O bond, giving the carbonyl product and Cr(IV). Cr(IV) is further reduced to Cr(III) (green).',
        arrowType: 'curved',
        notes: 'Color change: orange Cr(VI) → green Cr(III)',
      },
      {
        step: 3,
        description:
          'For primary alcohols: the aldehyde intermediate is hydrated in aqueous conditions, and the hydrate is oxidized again to carboxylic acid.',
        arrowType: 'curved',
        notes: 'Aqueous conditions prevent stopping at aldehyde',
      },
    ],
    keyPoints: [
      'Primary alcohols → carboxylic acids (over-oxidation)',
      'Secondary alcohols → ketones (cannot over-oxidize)',
      'Tertiary alcohols → no reaction (no α-H)',
      'Use PCC or Swern to stop primary alcohol at aldehyde stage',
      'Orange → green color change (qualitative test)',
      'Chromium waste is toxic — environmental concern',
    ],
    examples: [
      {
        reactant: '1-Butanol',
        product: 'Butanoic acid',
        reagent: 'CrO₃/H₂SO₄/acetone',
        yield: '85%',
      },
      {
        reactant: 'Cyclohexanol',
        product: 'Cyclohexanone',
        reagent: 'Jones reagent',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Reliable oxidation of secondary alcohols to ketones. Also useful when carboxylic acid (not aldehyde) is desired from primary alcohols.',
    limitations: [
      'Cannot stop at aldehyde for primary alcohols',
      'Toxic chromium waste',
      'Acidic conditions — not compatible with acid-sensitive groups',
    ],
    functionalGroups: ['alcohol', 'ketone', 'carboxylic-acid', 'aldehyde'],
    tags: ['oxidation', 'chromium', 'Jones', 'alcohol to ketone', 'alcohol to acid'],
    relatedReactions: ['pcc-oxidation', 'swern-oxidation'],
  },
  {
    id: 'pcc-oxidation',
    name: 'PCC Oxidation',
    altNames: ['Pyridinium Chlorochromate Oxidation', 'Corey-Suggs Oxidation'],
    category: 'oxidation',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Primary or Secondary alcohol'],
      reagents: ['PCC (C₅H₅NH⁺ CrO₃Cl⁻)'],
      conditions: ['CH₂Cl₂, RT, anhydrous'],
      products: ['Primary alcohol → Aldehyde', 'Secondary alcohol → Ketone'],
    },
    equation: 'RCH₂OH → RCHO (stops at aldehyde!)',
    description:
      'A mild, selective Cr(VI) oxidant that converts primary alcohols to aldehydes (without over-oxidation to carboxylic acid) and secondary alcohols to ketones. The anhydrous conditions (CH₂Cl₂) prevent the aldehyde hydrate from forming.',
    mechanism: [
      {
        step: 1,
        description:
          'The alcohol displaces chloride from PCC to form a chromate ester.',
        arrowType: 'curved',
        intermediateFormula: 'Chromate ester',
      },
      {
        step: 2,
        description:
          'E2-like elimination gives the aldehyde (or ketone) and Cr(IV) species. Under anhydrous conditions, the aldehyde is stable and doesn\'t get further oxidized.',
        arrowType: 'curved',
        notes: 'Anhydrous CH₂Cl₂ prevents over-oxidation',
      },
    ],
    keyPoints: [
      'Stops at aldehyde for primary alcohols (key difference from Jones)',
      'Anhydrous conditions are critical (CH₂Cl₂ solvent)',
      'Also oxidizes allylic and benzylic alcohols',
      'Mild enough for sensitive substrates',
      'Alternative: Dess-Martin periodinane (DMP) — non-chromium option',
    ],
    examples: [
      {
        reactant: '1-Hexanol',
        product: 'Hexanal',
        reagent: 'PCC, CH₂Cl₂',
        yield: '90%',
      },
      {
        reactant: 'Benzyl alcohol',
        product: 'Benzaldehyde',
        reagent: 'PCC, CH₂Cl₂',
        yield: '92%',
      },
    ],
    syntheticUtility:
      'The go-to reagent when you need an aldehyde from a primary alcohol. Simple and reliable.',
    limitations: [
      'Chromium waste (toxic)',
      'Acidic — can cause some sensitive groups to react',
      'Must be anhydrous (moisture causes over-oxidation)',
      'Modern alternative: Dess-Martin periodinane (no chromium)',
    ],
    functionalGroups: ['alcohol', 'aldehyde', 'ketone'],
    tags: ['oxidation', 'PCC', 'selective', 'aldehyde', 'chromium'],
    relatedReactions: ['jones-oxidation', 'swern-oxidation'],
  },
  {
    id: 'swern-oxidation',
    name: 'Swern Oxidation',
    altNames: ['DMSO-Oxalyl Chloride Oxidation'],
    year: 1978,
    discoverer: 'Daniel Swern',
    category: 'oxidation',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Primary or Secondary alcohol'],
      reagents: ['(COCl)₂ (oxalyl chloride)', 'DMSO', 'Et₃N'],
      conditions: ['-78°C (dry ice/acetone), CH₂Cl₂'],
      products: ['Primary alcohol → Aldehyde', 'Secondary alcohol → Ketone'],
    },
    equation: 'RCH₂OH → RCHO (chromium-free!)',
    description:
      'A mild, chromium-free oxidation that converts alcohols to aldehydes/ketones. Uses activated DMSO as the oxidant. Must be performed at -78°C to avoid Pummerer rearrangement side products.',
    mechanism: [
      {
        step: 1,
        description:
          'DMSO attacks oxalyl chloride to form the activated DMSO species (chlorosulfonium ion), releasing CO, CO₂, and HCl.',
        arrowType: 'curved',
        intermediateFormula: '(CH₃)₂S⁺-Cl (activated DMSO)',
        notes: 'Must be at -78°C',
      },
      {
        step: 2,
        description:
          'The alcohol attacks the activated DMSO, displacing chloride to form an alkoxysulfonium ion.',
        arrowType: 'curved',
        intermediateFormula: 'R-O-S⁺(CH₃)₂ (alkoxysulfonium ion)',
      },
      {
        step: 3,
        description:
          'Triethylamine (Et₃N) deprotonates the α-carbon of the sulfonium, causing intramolecular elimination to give the carbonyl product and dimethyl sulfide (DMS, smelly!).',
        arrowType: 'curved',
        notes: 'DMS byproduct has strong odor',
      },
    ],
    keyPoints: [
      'Chromium-free — environmentally preferred',
      'Must be done at -78°C (side reactions at higher temperatures)',
      'Stops at aldehyde for primary alcohols',
      'Very mild — compatible with many sensitive functional groups',
      'Produces dimethyl sulfide (DMS) — horrible smell',
      'Alternatives: Dess-Martin (mild), IBX, TPAP',
    ],
    examples: [
      {
        reactant: '(S)-Citronellol',
        product: '(S)-Citronellal',
        reagent: '(COCl)₂, DMSO, Et₃N, -78°C',
        yield: '92%',
      },
    ],
    syntheticUtility:
      'Gold standard for mild oxidation in total synthesis. Compatible with most functional groups due to mild conditions.',
    limitations: [
      'Must be at -78°C (inconvenient)',
      'DMS byproduct has terrible smell',
      'Somewhat complex procedure (3 reagents, low temperature)',
    ],
    functionalGroups: ['alcohol', 'aldehyde', 'ketone'],
    tags: ['oxidation', 'Swern', 'DMSO', 'mild', 'chromium-free', 'aldehyde'],
    relatedReactions: ['pcc-oxidation', 'jones-oxidation'],
  },
  {
    id: 'nabh4-reduction',
    name: 'NaBH₄ Reduction',
    altNames: ['Sodium Borohydride Reduction'],
    category: 'reduction',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Aldehyde or Ketone'],
      reagents: ['NaBH₄'],
      conditions: ['MeOH or EtOH, 0°C to RT'],
      products: ['Primary alcohol (from aldehyde) or Secondary alcohol (from ketone)'],
    },
    equation: 'R₂C=O + NaBH₄ → R₂CHOH (after workup)',
    description:
      'A mild reducing agent that selectively reduces aldehydes and ketones to alcohols without reducing esters, amides, or carboxylic acids. Delivers hydride (H⁻) to the electrophilic carbonyl carbon.',
    mechanism: [
      {
        step: 1,
        description:
          'NaBH₄ delivers a hydride (H⁻) to the electrophilic carbonyl carbon, forming an alkoxide intermediate. One NaBH₄ can reduce up to 4 carbonyls.',
        arrowType: 'curved',
        intermediateFormula: 'R₂CHO⁻ (alkoxide)',
        notes: 'Nucleophilic addition of H⁻ to C=O',
      },
      {
        step: 2,
        description: 'Protonation of the alkoxide by the protic solvent (MeOH) gives the alcohol.',
        arrowType: 'curved',
        notes: 'Protic solvent serves as proton source',
      },
    ],
    keyPoints: [
      'Selective: reduces aldehydes/ketones only (not esters, amides, or acids)',
      'Mild: can use in protic solvents (MeOH, EtOH, even H₂O)',
      'One NaBH₄ delivers 4 hydrides (reduces 4 equivalents)',
      'Chemoselectivity: aldehyde > ketone (aldehyde reduced first)',
      'Cannot reduce C=C double bonds, esters, or amides',
      'Compare with LiAlH₄: reduces almost everything (much stronger)',
    ],
    examples: [
      {
        reactant: 'Benzaldehyde',
        product: 'Benzyl alcohol',
        reagent: 'NaBH₄, MeOH',
        yield: '95%',
      },
      {
        reactant: 'Cyclohexanone',
        product: 'Cyclohexanol',
        reagent: 'NaBH₄, EtOH',
        yield: '92%',
      },
    ],
    syntheticUtility:
      'The standard mild reducing agent for carbonyl reductions. Excellent chemoselectivity makes it the first choice when other reducible groups are present.',
    limitations: [
      'Cannot reduce esters, amides, or carboxylic acids (use LiAlH₄)',
      'Cannot reduce C=C bonds',
      'Less stereocontrol than asymmetric reductions (CBS, etc.)',
    ],
    functionalGroups: ['aldehyde', 'ketone', 'alcohol'],
    tags: ['reduction', 'NaBH4', 'hydride', 'selective', 'mild'],
    relatedReactions: ['lialh4-reduction'],
  },
  {
    id: 'lialh4-reduction',
    name: 'LiAlH₄ Reduction',
    altNames: ['Lithium Aluminum Hydride Reduction', 'LAH Reduction'],
    category: 'reduction',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Aldehyde, Ketone, Ester, Carboxylic acid, Amide, or Epoxide'],
      reagents: ['LiAlH₄'],
      conditions: ['Anhydrous Et₂O or THF, then H₃O⁺ workup'],
      products: ['Alcohol (or Amine from amides)'],
    },
    equation: 'RCOOR\' + LiAlH₄ → RCH₂OH + R\'OH (after H₃O⁺)',
    description:
      'A powerful, non-selective reducing agent that reduces virtually all C=O containing functional groups. Much stronger than NaBH₄. Must use anhydrous conditions (reacts violently with water). Reduces esters to two alcohols, acids to primary alcohols, amides to amines.',
    mechanism: [
      {
        step: 1,
        description:
          'LiAlH₄ delivers H⁻ to the carbonyl carbon. For esters and acids, the tetrahedral intermediate collapses and a second H⁻ is delivered.',
        arrowType: 'curved',
        notes: 'Two hydride deliveries for esters and acids',
      },
      {
        step: 2,
        description:
          'Aqueous acid workup (H₃O⁺) protonates the aluminum alkoxide to give the free alcohol.',
        arrowType: 'curved',
        notes: 'Careful workup — quench excess LiAlH₄ first',
      },
    ],
    keyPoints: [
      'Reduces everything: aldehydes, ketones, esters, acids, amides, epoxides',
      'Ester → 2 alcohols (RCOOR\' → RCH₂OH + R\'OH)',
      'Acid → primary alcohol (RCOOH → RCH₂OH)',
      'Amide → amine (RCONR₂ → RCH₂NR₂)',
      'MUST be anhydrous (violently reacts with H₂O, generates H₂ gas)',
      'Cannot reduce C=C or isolated C-X bonds',
      'Use DIBAL-H (-78°C) to reduce ester to aldehyde (stop midway)',
    ],
    examples: [
      {
        reactant: 'Ethyl benzoate',
        product: 'Benzyl alcohol + Ethanol',
        reagent: 'LiAlH₄, Et₂O, then H₃O⁺',
        yield: '90%',
      },
      {
        reactant: 'Benzoic acid',
        product: 'Benzyl alcohol',
        reagent: 'LiAlH₄, THF, then H₃O⁺',
        yield: '85%',
      },
      {
        reactant: 'N,N-Dimethylbenzamide',
        product: 'N,N-Dimethylbenzylamine',
        reagent: 'LiAlH₄, THF, then H₃O⁺',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'The "nuclear option" reducing agent. When you need to reduce a stubborn functional group, LiAlH₄ will almost certainly do it.',
    limitations: [
      'Not selective — reduces almost everything',
      'Violently moisture-sensitive (fire/explosion hazard with H₂O)',
      'Cannot use protic solvents',
      'Over-reduction (cannot stop at aldehyde from ester; use DIBAL-H)',
    ],
    functionalGroups: ['aldehyde', 'ketone', 'ester', 'carboxylic-acid', 'alcohol'],
    tags: ['reduction', 'LiAlH4', 'powerful', 'non-selective', 'hydride'],
    relatedReactions: ['nabh4-reduction', 'wolff-kishner'],
  },
  {
    id: 'wolff-kishner',
    name: 'Wolff-Kishner Reduction',
    altNames: ['Huang-Minlon Modification'],
    year: 1911,
    discoverer: 'Nikolai Kishner, Ludwig Wolff',
    category: 'reduction',
    difficulty: 'intermediate',
    generalScheme: {
      reactants: ['Aldehyde or Ketone'],
      reagents: ['H₂NNH₂ (hydrazine)', 'KOH'],
      conditions: ['High-boiling solvent (ethylene glycol), 200°C'],
      products: ['Alkane (C=O → CH₂)'],
    },
    equation: 'R₂C=O → R₂CH₂ (deoxygenation)',
    description:
      'Complete removal of a C=O group, replacing it with CH₂. The ketone/aldehyde is first converted to a hydrazone, then heated with strong base to lose N₂ gas. Basic conditions — complementary to Clemmensen (acidic conditions).',
    mechanism: [
      {
        step: 1,
        description:
          'The carbonyl reacts with hydrazine (H₂NNH₂) to form the hydrazone (C=NNH₂) via standard imine formation.',
        arrowType: 'curved',
        intermediateFormula: 'R₂C=NNH₂ (hydrazone)',
      },
      {
        step: 2,
        description:
          'Under strong base and high heat, the hydrazone loses N₂ through a series of proton transfers (tautomerizations) and E1cb elimination.',
        arrowType: 'curved',
        notes: 'N₂ is an excellent leaving group (very stable)',
      },
      {
        step: 3,
        description: 'The carbanion is protonated by the solvent to give the alkane product.',
        arrowType: 'curved',
        notes: 'Net result: C=O → CH₂',
      },
    ],
    keyPoints: [
      'C=O → CH₂ (complete deoxygenation)',
      'Basic conditions — use when acid-sensitive groups present',
      'Clemmensen = same transformation but acidic conditions (Zn/Hg, HCl)',
      'Essential after Friedel-Crafts acylation (ArCOR → ArCH₂R)',
      'Huang-Minlon modification: one-pot with KOH and ethylene glycol',
      'Requires high temperature (200°C)',
    ],
    examples: [
      {
        reactant: 'Acetophenone',
        product: 'Ethylbenzene',
        reagent: 'H₂NNH₂, KOH, ethylene glycol, 200°C',
        yield: '85%',
      },
      {
        reactant: 'Cyclohexanone',
        product: 'Cyclohexane',
        reagent: 'H₂NNH₂, KOH, diethylene glycol, reflux',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Pairs perfectly with FC acylation: ArH → ArCOR (FC) → ArCH₂R (W-K). This is the best route to straight-chain alkylbenzenes.',
    limitations: [
      'Requires very high temperature (200°C)',
      'Not compatible with base-sensitive groups',
      'Slow reaction (hours to days)',
    ],
    functionalGroups: ['aldehyde', 'ketone'],
    tags: ['reduction', 'deoxygenation', 'C=O to CH2', 'basic conditions', 'hydrazone'],
    relatedReactions: ['friedel-crafts-acylation'],
  },
]
