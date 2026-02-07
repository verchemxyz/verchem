import { NamedReaction } from '@/lib/types/organic-chemistry'

/**
 * Introductory Named Reactions (Organic Chemistry I)
 * 15 foundational reactions every chemistry student must know
 */
export const INTRODUCTORY_REACTIONS: NamedReaction[] = [
  {
    id: 'sn2',
    name: 'SN2 Reaction',
    altNames: ['Bimolecular Nucleophilic Substitution', 'Walden Inversion'],
    category: 'substitution',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['R-LG (methyl, primary, or secondary substrate)'],
      reagents: ['Nu⁻ (strong nucleophile)'],
      conditions: ['Polar aprotic solvent (DMSO, DMF, acetone)'],
      products: ['R-Nu + LG⁻'],
    },
    equation: 'Nu⁻ + R-LG → Nu-R + LG⁻',
    description:
      'A one-step concerted mechanism where the nucleophile attacks the electrophilic carbon from the back side (180°) while the leaving group departs simultaneously. The reaction proceeds with inversion of configuration (Walden inversion) at the stereocenter.',
    mechanism: [
      {
        step: 1,
        description:
          'Nucleophile approaches the electrophilic carbon from the back side (180° to the leaving group). The C-Nu bond forms while the C-LG bond breaks simultaneously in a single transition state.',
        arrowType: 'curved',
        notes: 'Concerted — one step, no intermediate',
      },
      {
        step: 2,
        description:
          'Product forms with complete inversion of stereochemistry at the carbon center (Walden inversion). If starting material is R, product is S, and vice versa.',
        arrowType: 'curved',
        notes: 'Backside attack causes umbrella-like inversion',
      },
    ],
    keyPoints: [
      'Rate = k[substrate][nucleophile] — second order kinetics',
      'Favored with strong nucleophiles (I⁻, CN⁻, RS⁻, N₃⁻)',
      'Best with methyl > primary > secondary substrates (steric effects)',
      'Tertiary substrates do NOT undergo SN2 (too hindered)',
      'Polar aprotic solvents speed up reaction (don\'t solvate Nu⁻)',
      'Always gives inversion of configuration',
      'Good leaving groups: I⁻ > Br⁻ > Cl⁻ > F⁻ (matches bond strength)',
    ],
    examples: [
      {
        reactant: 'CH₃Br',
        product: 'CH₃I',
        reagent: 'NaI in acetone (Finkelstein)',
        yield: '95%',
      },
      {
        reactant: '(R)-2-Bromobutane',
        product: '(S)-2-Cyanobutane',
        reagent: 'NaCN in DMSO',
        yield: '85%',
      },
      {
        reactant: 'CH₃CH₂Cl',
        product: 'CH₃CH₂OH',
        reagent: 'NaOH in H₂O/DMSO',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Fundamental method for forming C-C (with CN⁻), C-O, C-N, and C-S bonds. Essential for functional group interconversion.',
    limitations: [
      'Cannot use tertiary substrates (E2 dominates)',
      'Neopentyl substrates extremely slow',
      'Competing E2 with strong, bulky bases (t-BuO⁻)',
      'Protic solvents slow the reaction by solvating nucleophile',
    ],
    functionalGroups: ['alkyl-halide'],
    tags: ['substitution', 'stereochemistry', 'inversion', 'nucleophile', 'backside attack'],
    relatedReactions: ['sn1', 'e2', 'williamson-ether'],
  },
  {
    id: 'sn1',
    name: 'SN1 Reaction',
    altNames: ['Unimolecular Nucleophilic Substitution'],
    category: 'substitution',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['R-LG (tertiary, allylic, or benzylic substrate)'],
      reagents: ['Nu: (nucleophile/solvent)'],
      conditions: ['Polar protic solvent (H₂O, MeOH, EtOH)'],
      products: ['R-Nu + LG⁻'],
    },
    equation: 'R-LG → R⁺ + LG⁻ → R-Nu',
    description:
      'A two-step mechanism: the leaving group departs first to form a planar carbocation intermediate, then the nucleophile attacks. Since the carbocation is sp²-hybridized (planar), the nucleophile can attack from either face, leading to racemization.',
    mechanism: [
      {
        step: 1,
        description:
          'Ionization: The C-LG bond breaks heterolytically. The leaving group departs with the bonding electrons, forming a carbocation. This is the rate-determining step.',
        arrowType: 'curved',
        intermediateFormula: 'R⁺ (carbocation)',
        notes: 'Slow step — determines rate',
      },
      {
        step: 2,
        description:
          'Nucleophilic capture: The nucleophile (or solvent) attacks the planar carbocation from either face, giving a mixture of retention and inversion products.',
        arrowType: 'curved',
        notes: 'Fast step — leads to racemization',
      },
    ],
    keyPoints: [
      'Rate = k[substrate] — first order kinetics (nucleophile not in rate law)',
      'Favored with tertiary > secondary substrates (carbocation stability)',
      'Polar protic solvents stabilize ions (H₂O, MeOH, EtOH)',
      'Produces racemic mixture (loss of stereochemistry)',
      'Carbocation rearrangements possible (hydride/methyl shifts)',
      'Weak nucleophiles are fine (solvent often acts as nucleophile)',
      'Competes with E1 elimination (often get mixtures)',
    ],
    examples: [
      {
        reactant: '(CH₃)₃CBr',
        product: '(CH₃)₃COH',
        reagent: 'H₂O',
        yield: '80%',
      },
      {
        reactant: '(R)-3-Bromo-3-methylhexane',
        product: '(R/S)-3-Methoxy-3-methylhexane',
        reagent: 'MeOH',
        yield: '70% (racemic)',
      },
    ],
    syntheticUtility:
      'Useful for solvolysis reactions where the solvent is the nucleophile. Common in biological systems (glycosylation).',
    limitations: [
      'Primary substrates too unstable as carbocations',
      'Carbocation rearrangements give unwanted products',
      'Always competes with E1 elimination',
      'Loss of stereochemistry (racemization)',
    ],
    functionalGroups: ['alkyl-halide'],
    tags: ['substitution', 'carbocation', 'racemization', 'solvolysis'],
    relatedReactions: ['sn2', 'e1'],
  },
  {
    id: 'e2',
    name: 'E2 Elimination',
    altNames: ['Bimolecular Elimination', 'Anti-Periplanar Elimination'],
    category: 'elimination',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['R₂CH-CR₂-LG'],
      reagents: ['Strong base (NaOEt, t-BuOK, NaOH)'],
      conditions: ['Heat, polar solvent'],
      products: ['R₂C=CR₂ + HB + LG⁻'],
    },
    equation: 'B⁻ + H-C-C-LG → C=C + BH + LG⁻',
    description:
      'A concerted one-step mechanism where the base abstracts a proton anti-periplanar to the leaving group. The C-H and C-LG bonds break simultaneously while the C=C double bond forms. Follows Zaitsev\'s rule: the more substituted alkene is the major product.',
    mechanism: [
      {
        step: 1,
        description:
          'The base abstracts a β-hydrogen that is anti-periplanar (180°) to the leaving group. Simultaneously, the C-H bond breaks, the C=C π bond forms, and the C-LG bond breaks. All in one concerted step.',
        arrowType: 'curved',
        notes: 'Anti-periplanar geometry required (H and LG on opposite sides)',
      },
    ],
    keyPoints: [
      'Rate = k[substrate][base] — second order',
      'Requires anti-periplanar geometry (H and LG at 180°)',
      'Zaitsev\'s rule: more substituted alkene is major product',
      'Hofmann\'s rule: with bulky bases (t-BuOK), less substituted alkene forms',
      'Strong, non-nucleophilic bases favor E2 over SN2',
      'Trans alkenes preferred from acyclic substrates',
      'In cyclohexanes, H and LG must both be axial (trans-diaxial)',
    ],
    examples: [
      {
        reactant: '2-Bromopentane',
        product: '2-Pentene (major) + 1-Pentene (minor)',
        reagent: 'NaOEt/EtOH, heat',
        yield: '85%',
      },
      {
        reactant: '2-Bromo-2-methylbutane',
        product: '2-Methyl-1-butene (major with t-BuOK)',
        reagent: 't-BuOK/t-BuOH, heat',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Primary method for forming alkenes from alkyl halides or tosylates. Predictable regiochemistry via Zaitsev or Hofmann rules.',
    limitations: [
      'Competes with SN2 (especially with primary substrates)',
      'Anti-periplanar requirement limits some cyclohexane substrates',
      'Regiochemistry mixtures with unsymmetrical substrates',
    ],
    functionalGroups: ['alkyl-halide', 'alkene'],
    tags: ['elimination', 'alkene formation', 'Zaitsev', 'anti-periplanar', 'base'],
    relatedReactions: ['e1', 'sn2', 'dehydration'],
  },
  {
    id: 'e1',
    name: 'E1 Elimination',
    altNames: ['Unimolecular Elimination'],
    category: 'elimination',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['R₃C-LG (tertiary substrate)'],
      reagents: ['Weak base or heat'],
      conditions: ['Polar protic solvent, heat'],
      products: ['Alkene + HB + LG⁻'],
    },
    equation: 'R₃C-LG → R₃C⁺ → alkene + H⁺',
    description:
      'A two-step mechanism where the leaving group departs first to form a carbocation, followed by deprotonation of a β-hydrogen to form the alkene. Often occurs alongside SN1.',
    mechanism: [
      {
        step: 1,
        description:
          'Ionization: The leaving group departs to form a carbocation intermediate. This is the rate-determining step (same as SN1).',
        arrowType: 'curved',
        intermediateFormula: 'R₃C⁺',
        notes: 'Slow step — identical to SN1 first step',
      },
      {
        step: 2,
        description:
          'Deprotonation: A base (often solvent) removes a β-hydrogen adjacent to the carbocation. Electrons from the C-H bond form the new C=C π bond.',
        arrowType: 'curved',
        notes: 'Fast step — Zaitsev product favored',
      },
    ],
    keyPoints: [
      'Rate = k[substrate] — first order',
      'Always competes with SN1 (same first step)',
      'Higher temperatures favor elimination over substitution',
      'Zaitsev\'s rule applies (more substituted alkene)',
      'Carbocation rearrangements possible before elimination',
      'Follows same substrate requirements as SN1 (tertiary best)',
    ],
    examples: [
      {
        reactant: '2-Bromo-2-methylpropane',
        product: '2-Methylpropene',
        reagent: 'EtOH, heat',
        yield: '60% (mixed with SN1 product)',
      },
    ],
    syntheticUtility:
      'Less synthetically useful than E2 due to competing SN1 and rearrangements. More common in biological systems.',
    limitations: [
      'Always mixed with SN1 products',
      'Carbocation rearrangements give unexpected products',
      'Poor regiocontrol compared to E2',
    ],
    functionalGroups: ['alkyl-halide', 'alkene'],
    tags: ['elimination', 'carbocation', 'unimolecular', 'Zaitsev'],
    relatedReactions: ['sn1', 'e2'],
  },
  {
    id: 'markovnikov-addition',
    name: 'Markovnikov Addition',
    altNames: ['Markownikoff Addition', 'HX Addition to Alkenes'],
    category: 'addition',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkene (C=C)'],
      reagents: ['HX (HCl, HBr, HI)'],
      conditions: ['Room temperature or mild heating'],
      products: ['Alkyl halide (Markovnikov regiochemistry)'],
    },
    equation: 'R-CH=CH₂ + HX → R-CHX-CH₃',
    description:
      'Electrophilic addition of hydrogen halides to alkenes following Markovnikov\'s rule: the hydrogen adds to the less substituted carbon (the one with more H\'s), and the halide adds to the more substituted carbon. This is because the more stable carbocation intermediate forms.',
    mechanism: [
      {
        step: 1,
        description:
          'Protonation: The π electrons of the alkene attack the H of HX, forming the more stable carbocation (Markovnikov intermediate). The proton adds to the less substituted carbon.',
        arrowType: 'curved',
        intermediateFormula: 'R-CH⁺-CH₃ (more stable carbocation)',
        notes: 'Regioselectivity determined here — more stable carbocation forms',
      },
      {
        step: 2,
        description:
          'Halide capture: The halide anion (X⁻) attacks the carbocation to form the product.',
        arrowType: 'curved',
        notes: 'Attack from either face — no stereocontrol',
      },
    ],
    keyPoints: [
      'Markovnikov\'s rule: H goes to C with more H\'s, X goes to C with fewer H\'s',
      'Modern explanation: more substituted carbocation is more stable',
      'Carbocation rearrangements possible (watch for ring expansions)',
      'Follows electrophilic addition mechanism',
      'No peroxides present (peroxides cause anti-Markovnikov with HBr)',
      'Reactivity: HI > HBr > HCl (acid strength)',
    ],
    examples: [
      {
        reactant: 'Propene (CH₃CH=CH₂)',
        product: '2-Bromopropane (CH₃CHBrCH₃)',
        reagent: 'HBr',
        yield: '90%',
      },
      {
        reactant: '1-Methylcyclohexene',
        product: '1-Bromo-1-methylcyclohexane',
        reagent: 'HBr',
        yield: '85%',
      },
    ],
    syntheticUtility:
      'Simple method to convert alkenes to alkyl halides with predictable regiochemistry. The halide product is useful for further substitution/elimination.',
    limitations: [
      'Carbocation rearrangements with certain substrates',
      'No stereocontrol (racemic at new stereocenter)',
      'With HBr + peroxides → anti-Markovnikov (radical mechanism)',
    ],
    functionalGroups: ['alkene', 'alkyl-halide'],
    tags: ['addition', 'Markovnikov', 'electrophilic', 'alkene', 'regiochemistry'],
    relatedReactions: ['anti-markovnikov-addition', 'acid-catalyzed-hydration'],
  },
  {
    id: 'anti-markovnikov-addition',
    name: 'Anti-Markovnikov Addition',
    altNames: ['Radical Addition of HBr', 'Kharasch Reaction', 'Peroxide Effect'],
    year: 1933,
    discoverer: 'Morris Kharasch',
    category: 'radical',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkene (C=C)'],
      reagents: ['HBr', 'ROOR (peroxide initiator)'],
      conditions: ['UV light or heat with peroxide'],
      products: ['Alkyl bromide (anti-Markovnikov regiochemistry)'],
    },
    equation: 'R-CH=CH₂ + HBr + ROOR → R-CH₂-CH₂Br',
    description:
      'Radical chain addition of HBr to alkenes. Peroxides generate radicals that reverse the normal Markovnikov selectivity. The bromine adds to the less substituted carbon because the more stable radical intermediate forms at the more substituted position.',
    mechanism: [
      {
        step: 1,
        description:
          'Initiation: Peroxide (ROOR) homolyzes to form alkoxy radicals (RO•). The alkoxy radical abstracts H from HBr to generate Br•.',
        arrowType: 'fishhook',
        notes: 'Fishhook arrows — one electron at a time',
      },
      {
        step: 2,
        description:
          'Propagation 1: Br• radical adds to the less substituted end of the alkene, forming the more stable (more substituted) carbon radical.',
        arrowType: 'fishhook',
        intermediateFormula: 'R-CH•-CH₂Br',
        notes: 'Regioselectivity: Br adds to less substituted C',
      },
      {
        step: 3,
        description:
          'Propagation 2: The carbon radical abstracts H from another HBr, forming the product and regenerating Br• to continue the chain.',
        arrowType: 'fishhook',
        notes: 'Chain propagation — one Br• generates thousands of products',
      },
    ],
    keyPoints: [
      'ONLY works with HBr (not HCl or HI) — thermodynamics of radical steps',
      'Requires peroxide or UV light to initiate',
      'Anti-Markovnikov: Br ends up on less substituted carbon',
      'Radical chain mechanism (initiation, propagation, termination)',
      'More stable radical = more substituted (like carbocations)',
    ],
    examples: [
      {
        reactant: 'Propene',
        product: '1-Bromopropane',
        reagent: 'HBr, ROOR',
        yield: '85%',
      },
      {
        reactant: '1-Hexene',
        product: '1-Bromohexane',
        reagent: 'HBr, (PhCO₂)₂',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Access to primary alkyl bromides from terminal alkenes — complementary regiochemistry to Markovnikov addition.',
    limitations: [
      'Only works with HBr (not HCl or HI)',
      'Must have radical initiator (peroxides or UV)',
      'Radical chain can produce some dimeric byproducts',
    ],
    functionalGroups: ['alkene', 'alkyl-halide'],
    tags: ['radical', 'anti-Markovnikov', 'HBr', 'peroxide', 'chain reaction'],
    relatedReactions: ['markovnikov-addition', 'free-radical-halogenation'],
  },
  {
    id: 'electrophilic-addition-halogen',
    name: 'Halogenation of Alkenes',
    altNames: ['Bromination of Alkenes', 'Anti Addition'],
    category: 'addition',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkene (C=C)'],
      reagents: ['X₂ (Br₂ or Cl₂)'],
      conditions: ['CH₂Cl₂ or CCl₄ (inert solvent)'],
      products: ['Vicinal dihalide (anti addition)'],
    },
    equation: 'C=C + Br₂ → BrC-CBr (anti addition)',
    description:
      'Electrophilic addition of Br₂ or Cl₂ to alkenes proceeds through a cyclic halonium ion intermediate, giving exclusively anti addition (trans product). This is one of the classic tests for unsaturation — Br₂ decolorization.',
    mechanism: [
      {
        step: 1,
        description:
          'The π electrons of the alkene attack Br₂, displacing Br⁻ and forming a cyclic bromonium ion intermediate. The three-membered ring bridges both carbons.',
        arrowType: 'curved',
        intermediateFormula: 'Bromonium ion (3-membered ring)',
        notes: 'Bromonium ion prevents rotation — locks geometry',
      },
      {
        step: 2,
        description:
          'Br⁻ attacks the bromonium ion from the back side (anti to the existing Br), opening the ring. This gives exclusively anti addition product.',
        arrowType: 'curved',
        notes: 'Anti addition — both Br\'s end up on opposite faces',
      },
    ],
    keyPoints: [
      'Anti addition (trans product only) via halonium ion intermediate',
      'Br₂ decolorization = positive test for alkenes/alkynes',
      'In water: halohydrin forms (Br + OH across double bond)',
      'More substituted alkenes react faster (more electron-rich π bond)',
      'Stereospecific: cis-alkene → (±) product, trans-alkene → meso product',
    ],
    examples: [
      {
        reactant: 'Cyclohexene',
        product: 'trans-1,2-Dibromocyclohexane',
        reagent: 'Br₂ in CCl₄',
        yield: '95%',
      },
      {
        reactant: 'cis-2-Butene',
        product: '(2R,3R) + (2S,3S)-2,3-Dibromobutane',
        reagent: 'Br₂ in CH₂Cl₂',
        yield: '92%',
      },
    ],
    syntheticUtility:
      'Classic method for introducing two halogen atoms across a double bond. Bromonium ion intermediate is key to stereocontrol.',
    limitations: [
      'Cl₂ is less selective (more reactive, side reactions)',
      'F₂ too reactive (explosive), I₂ too unreactive',
      'In protic solvents, solvent can compete as nucleophile',
    ],
    functionalGroups: ['alkene', 'alkyl-halide'],
    tags: ['addition', 'anti', 'halogenation', 'bromonium ion', 'stereospecific'],
    relatedReactions: ['markovnikov-addition'],
  },
  {
    id: 'catalytic-hydrogenation',
    name: 'Catalytic Hydrogenation',
    altNames: ['Heterogeneous Hydrogenation', 'Sabatier Reaction'],
    category: 'reduction',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkene or Alkyne'],
      reagents: ['H₂'],
      conditions: ['Metal catalyst (Pd/C, Pt, Ni), room temperature or mild heating'],
      products: ['Alkane (syn addition)'],
    },
    equation: 'C=C + H₂ → CH-CH (syn addition)',
    description:
      'Both H atoms add to the same face of the double bond (syn addition) because the reaction occurs on the surface of the metal catalyst. The alkene adsorbs onto the catalyst surface, H₂ dissociates on the metal, and both hydrogens are delivered from the same face.',
    mechanism: [
      {
        step: 1,
        description:
          'H₂ and the alkene both adsorb onto the catalyst surface. H₂ undergoes dissociative chemisorption, breaking into two metal-bound H atoms.',
        arrowType: 'curved',
        notes: 'Heterogeneous — reaction on solid surface',
      },
      {
        step: 2,
        description:
          'Both hydrogen atoms are transferred sequentially from the catalyst surface to the same face of the alkene, giving syn addition.',
        arrowType: 'curved',
        notes: 'Syn addition — both H\'s from same face',
      },
    ],
    keyPoints: [
      'Syn addition (cis product from alkyne → cis-alkene)',
      'Pd/C, Pt(PtO₂), Ni — common catalysts',
      'Lindlar\'s catalyst (Pd/CaCO₃/Pb) stops at cis-alkene from alkyne',
      'Exothermic — heat of hydrogenation measures alkene stability',
      'Functional group selectivity possible with catalyst choice',
      'Cannot stop at alkene from alkene (goes to alkane)',
    ],
    examples: [
      {
        reactant: 'Cyclohexene',
        product: 'Cyclohexane',
        reagent: 'H₂, Pd/C',
        yield: '99%',
      },
      {
        reactant: '2-Butyne',
        product: 'cis-2-Butene',
        reagent: 'H₂, Lindlar\'s catalyst',
        yield: '95%',
      },
      {
        reactant: '2-Butyne',
        product: 'Butane',
        reagent: 'H₂ (excess), Pd/C',
        yield: '99%',
      },
    ],
    syntheticUtility:
      'Essential method for reducing C=C and C≡C bonds. Lindlar\'s catalyst for partial reduction of alkynes to cis-alkenes is particularly valuable.',
    limitations: [
      'Requires H₂ gas (safety concern)',
      'Heterogeneous — difficult to control exact stoichiometry on lab scale',
      'Over-reduction possible (alkyne → alkane if catalyst too active)',
      'Some functional groups also reduced (NO₂, C=O with certain catalysts)',
    ],
    functionalGroups: ['alkene', 'alkyne'],
    tags: ['reduction', 'hydrogenation', 'syn addition', 'catalyst', 'Lindlar'],
    relatedReactions: ['birch-reduction'],
  },
  {
    id: 'acid-catalyzed-hydration',
    name: 'Acid-Catalyzed Hydration',
    altNames: ['Markovnikov Hydration'],
    category: 'addition',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkene'],
      reagents: ['H₂O', 'H₂SO₄ or H₃PO₄ (acid catalyst)'],
      conditions: ['Aqueous acid, heat'],
      products: ['Alcohol (Markovnikov regiochemistry)'],
    },
    equation: 'R-CH=CH₂ + H₂O → R-CH(OH)-CH₃',
    description:
      'Addition of water across a double bond following Markovnikov\'s rule. The OH group ends up on the more substituted carbon via carbocation intermediate. An alternative is oxymercuration-demercuration which avoids rearrangements.',
    mechanism: [
      {
        step: 1,
        description:
          'Protonation of the alkene by H₃O⁺ to form the more stable carbocation (Markovnikov orientation).',
        arrowType: 'curved',
        intermediateFormula: 'R-CH⁺-CH₃',
        notes: 'Proton adds to less substituted carbon',
      },
      {
        step: 2,
        description: 'Water acts as nucleophile, attacking the carbocation.',
        arrowType: 'curved',
        intermediateFormula: 'R-CH(OH₂⁺)-CH₃',
      },
      {
        step: 3,
        description:
          'Deprotonation of the oxonium ion by water to give the alcohol product and regenerate H₃O⁺.',
        arrowType: 'curved',
        notes: 'Acid is regenerated — catalytic',
      },
    ],
    keyPoints: [
      'Markovnikov regiochemistry (OH on more substituted C)',
      'Equilibrium reaction — Le Chatelier drives with excess water',
      'Carbocation rearrangements possible (use oxymercuration to avoid)',
      'Reverse reaction = acid-catalyzed dehydration of alcohols',
      'No stereocontrol (racemic at new stereocenter)',
    ],
    examples: [
      {
        reactant: '2-Methylpropene',
        product: '2-Methyl-2-propanol (t-butanol)',
        reagent: 'H₂O, H₂SO₄',
        yield: '80%',
      },
      {
        reactant: 'Cyclohexene',
        product: 'Cyclohexanol',
        reagent: 'H₂O, H₃PO₄',
        yield: '75%',
      },
    ],
    syntheticUtility:
      'Simple method to convert alkenes to Markovnikov alcohols. For rearrangement-free version, use oxymercuration-demercuration.',
    limitations: [
      'Carbocation rearrangements can give unwanted products',
      'Equilibrium process — requires excess water',
      'Competes with polymerization at higher concentrations',
    ],
    functionalGroups: ['alkene', 'alcohol'],
    tags: ['addition', 'hydration', 'Markovnikov', 'alcohol', 'acid-catalyzed'],
    relatedReactions: ['markovnikov-addition', 'dehydration'],
  },
  {
    id: 'fischer-esterification',
    name: 'Fischer Esterification',
    altNames: ['Fischer-Speier Esterification'],
    year: 1895,
    discoverer: 'Emil Fischer',
    category: 'condensation',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Carboxylic acid (RCOOH)', 'Alcohol (R\'OH)'],
      reagents: ['H₂SO₄ or HCl (acid catalyst)'],
      conditions: ['Heat, reflux, remove water (Dean-Stark)'],
      products: ['Ester (RCOOR\') + H₂O'],
    },
    equation: 'RCOOH + R\'OH ⇌ RCOOR\' + H₂O',
    description:
      'Acid-catalyzed condensation of a carboxylic acid with an alcohol to form an ester. The reaction is an equilibrium, so water removal (Dean-Stark trap) or excess alcohol drives it to completion.',
    mechanism: [
      {
        step: 1,
        description:
          'Protonation of the carboxylic acid carbonyl oxygen by H⁺, activating it toward nucleophilic attack.',
        arrowType: 'curved',
      },
      {
        step: 2,
        description:
          'Nucleophilic addition of the alcohol to the protonated carbonyl carbon, forming a tetrahedral intermediate.',
        arrowType: 'curved',
        intermediateFormula: 'RC(OH)(OH)(OR\')',
        notes: 'Tetrahedral intermediate',
      },
      {
        step: 3,
        description:
          'Proton transfer within the tetrahedral intermediate, protonating one of the OH groups to make it a better leaving group (water).',
        arrowType: 'curved',
      },
      {
        step: 4,
        description: 'Loss of water and deprotonation to give the ester product.',
        arrowType: 'curved',
        notes: 'Equilibrium — remove water to drive forward',
      },
    ],
    keyPoints: [
      'Equilibrium reaction — must drive forward (remove H₂O or excess alcohol)',
      'Works best with 1° and 2° alcohols (3° too bulky / undergo E1)',
      'Acid catalyst only — base would deprotonate the acid instead',
      'Dean-Stark trap or molecular sieves to remove water',
      'Reverse reaction = acid-catalyzed hydrolysis of ester',
    ],
    examples: [
      {
        reactant: 'Acetic acid + Ethanol',
        product: 'Ethyl acetate',
        reagent: 'H₂SO₄ cat., reflux',
        yield: '85%',
      },
      {
        reactant: 'Benzoic acid + Methanol',
        product: 'Methyl benzoate',
        reagent: 'HCl cat., reflux',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'One of the most common ester syntheses. Esters are used as solvents, fragrances, and pharmaceutical intermediates.',
    limitations: [
      'Equilibrium — must remove water for good yields',
      'Sterically hindered acids or alcohols give poor yields',
      'Tertiary alcohols undergo elimination instead',
      'Acid-sensitive groups may not survive conditions',
    ],
    functionalGroups: ['carboxylic-acid', 'alcohol', 'ester'],
    tags: ['condensation', 'ester', 'equilibrium', 'acid-catalyzed', 'dehydration'],
    relatedReactions: ['saponification'],
  },
  {
    id: 'saponification',
    name: 'Saponification',
    altNames: ['Base Hydrolysis of Esters', 'Ester Saponification'],
    category: 'substitution',
    subcategory: 'nucleophilic acyl substitution',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Ester (RCOOR\')'],
      reagents: ['NaOH or KOH'],
      conditions: ['Aqueous base, heat/reflux'],
      products: ['Carboxylate salt (RCOONa) + Alcohol (R\'OH)'],
    },
    equation: 'RCOOR\' + NaOH → RCOONa + R\'OH',
    description:
      'Irreversible base hydrolysis of an ester to give a carboxylate salt and an alcohol. The name comes from soap-making (saponification of fats). Unlike acid hydrolysis, this is irreversible because the carboxylate anion product is very stable.',
    mechanism: [
      {
        step: 1,
        description:
          'Hydroxide (OH⁻) attacks the electrophilic carbonyl carbon of the ester, forming a tetrahedral intermediate.',
        arrowType: 'curved',
        intermediateFormula: 'RC(O⁻)(OH)(OR\')',
        notes: 'Nucleophilic addition to carbonyl',
      },
      {
        step: 2,
        description:
          'The tetrahedral intermediate collapses, expelling the alkoxide (R\'O⁻) as leaving group to regenerate the C=O.',
        arrowType: 'curved',
        notes: 'Alkoxide is the leaving group',
      },
      {
        step: 3,
        description:
          'Fast proton transfer: alkoxide deprotonates the carboxylic acid to give the carboxylate salt. This step makes the reaction irreversible.',
        arrowType: 'curved',
        notes: 'Irreversible — carboxylate is very stable conjugate base',
      },
    ],
    keyPoints: [
      'Irreversible (unlike Fischer esterification) due to carboxylate stability',
      'Requires stoichiometric base (not catalytic)',
      'Product is a carboxylate salt — acidify to get free carboxylic acid',
      '"Saponification" literally means "soap-making" (fats + NaOH → soap)',
      'Works with all esters regardless of steric hindrance',
    ],
    examples: [
      {
        reactant: 'Ethyl acetate',
        product: 'Sodium acetate + Ethanol',
        reagent: 'NaOH (aq), reflux',
        yield: '95%',
      },
      {
        reactant: 'Tristearin (animal fat)',
        product: 'Sodium stearate (soap) + Glycerol',
        reagent: 'NaOH (aq), heat',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Fundamental method for ester hydrolysis. Essential in soap production and deprotection of ester protecting groups.',
    limitations: [
      'Requires full equivalent of base (not catalytic)',
      'Product is carboxylate salt, not free acid (must acidify)',
      'Very strong base may cause side reactions with sensitive groups',
    ],
    functionalGroups: ['ester', 'carboxylic-acid', 'alcohol'],
    tags: ['hydrolysis', 'ester', 'base', 'soap', 'irreversible'],
    relatedReactions: ['fischer-esterification'],
  },
  {
    id: 'free-radical-halogenation',
    name: 'Free Radical Halogenation',
    altNames: ['Radical Chain Halogenation'],
    category: 'radical',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkane (R-H)'],
      reagents: ['X₂ (Cl₂ or Br₂)'],
      conditions: ['UV light (hν) or heat'],
      products: ['Alkyl halide (R-X) + HX'],
    },
    equation: 'R-H + X₂ → R-X + HX',
    description:
      'Substitution of a C-H bond by C-X through a radical chain mechanism. Bromination is highly selective for tertiary C-H bonds (1600:80:1 for 3°:2°:1°), while chlorination is less selective (5:4:1).',
    mechanism: [
      {
        step: 1,
        description:
          'Initiation: X₂ homolyzes under UV light or heat to give two halogen radicals (X•).',
        arrowType: 'fishhook',
        notes: 'Homolytic cleavage — fishhook arrows',
      },
      {
        step: 2,
        description:
          'Propagation 1: X• abstracts a hydrogen from the alkane (preferentially from 3° > 2° > 1° C-H), forming HX and a carbon radical.',
        arrowType: 'fishhook',
        intermediateFormula: 'R• + HX',
        notes: 'Selectivity determined here',
      },
      {
        step: 3,
        description:
          'Propagation 2: R• reacts with X₂ to form R-X product and regenerate X• for the chain to continue.',
        arrowType: 'fishhook',
        notes: 'Chain continues until termination',
      },
    ],
    keyPoints: [
      'Three phases: initiation, propagation, termination',
      'Bromination highly selective (3° >> 2° >> 1°)',
      'Chlorination less selective — mixtures common',
      'Selectivity: Br₂ >> Cl₂ (bromine is more useful synthetically)',
      'Benzylic and allylic positions are especially reactive',
      'NBS (N-bromosuccinimide) for allylic/benzylic bromination',
    ],
    examples: [
      {
        reactant: 'Isobutane',
        product: 'tert-Butyl bromide (major)',
        reagent: 'Br₂, hν',
        yield: '97% (3° selectivity)',
      },
      {
        reactant: 'Toluene',
        product: 'Benzyl bromide',
        reagent: 'NBS, hν',
        yield: '85% (benzylic)',
      },
    ],
    syntheticUtility:
      'Simple method to functionalize unactivated C-H bonds. Bromination with Br₂ or NBS gives useful selectivity.',
    limitations: [
      'Chlorination gives mixtures of isomers (poor selectivity)',
      'Only works on sp³ C-H bonds (not aromatic)',
      'Polyhalogenation possible with excess X₂',
    ],
    functionalGroups: ['alkyl-halide'],
    tags: ['radical', 'halogenation', 'selectivity', 'NBS', 'chain reaction'],
    relatedReactions: ['anti-markovnikov-addition'],
  },
  {
    id: 'dehydration',
    name: 'Alcohol Dehydration',
    altNames: ['Acid-Catalyzed Dehydration', 'Alcohol to Alkene'],
    category: 'elimination',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alcohol (R₂CHCR₂OH)'],
      reagents: ['H₂SO₄ or H₃PO₄'],
      conditions: ['Heat (> 150°C for 1°, ~100°C for 3°)'],
      products: ['Alkene + H₂O'],
    },
    equation: 'R₂CHCR₂OH → R₂C=CR₂ + H₂O',
    description:
      'Elimination of water from an alcohol to form an alkene. Tertiary alcohols are easiest (E1 mechanism), primary alcohols require higher temperatures (E2-like). Follows Zaitsev\'s rule: more substituted alkene is the major product.',
    mechanism: [
      {
        step: 1,
        description:
          'Protonation of the alcohol hydroxyl group by the acid, converting -OH (poor leaving group) to -OH₂⁺ (good leaving group).',
        arrowType: 'curved',
      },
      {
        step: 2,
        description:
          'For 3° alcohols (E1): Loss of water to form a carbocation. For 1° alcohols (E2-like): Concerted loss of water and β-proton.',
        arrowType: 'curved',
        intermediateFormula: 'R₃C⁺ (for E1)',
        notes: '3° = E1 mechanism, 1° = E2-like',
      },
      {
        step: 3,
        description: 'Loss of a β-proton (for E1 pathway) to form the alkene.',
        arrowType: 'curved',
        notes: 'Zaitsev product — most substituted alkene',
      },
    ],
    keyPoints: [
      'Reactivity: 3° > 2° > 1° alcohols (easier with more substituted)',
      'Zaitsev\'s rule: more substituted alkene is major product',
      'Reverse of acid-catalyzed hydration (equilibrium)',
      'High temperature favors elimination (entropy)',
      'Carbocation rearrangements possible for E1 pathway',
    ],
    examples: [
      {
        reactant: '2-Methylcyclohexanol',
        product: '1-Methylcyclohexene (major)',
        reagent: 'H₂SO₄, heat',
        yield: '85%',
      },
      {
        reactant: '2-Methyl-2-butanol',
        product: '2-Methyl-2-butene (major)',
        reagent: 'H₃PO₄, 85°C',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'Simple method to prepare alkenes from readily available alcohols.',
    limitations: [
      'Carbocation rearrangements (especially with 2° alcohols)',
      'Primary alcohols require harsh conditions (high temperature)',
      'Competition with ether formation at lower temperatures',
    ],
    functionalGroups: ['alcohol', 'alkene'],
    tags: ['elimination', 'dehydration', 'alcohol', 'Zaitsev', 'E1'],
    relatedReactions: ['e1', 'e2', 'acid-catalyzed-hydration'],
  },
  {
    id: 'electrophilic-aromatic-substitution',
    name: 'Electrophilic Aromatic Substitution',
    altNames: ['EAS', 'SEAr'],
    category: 'substitution',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Arene (ArH)'],
      reagents: ['E⁺ (electrophile)'],
      conditions: ['Lewis acid catalyst (AlCl₃, FeBr₃)'],
      products: ['Substituted arene (ArE) + H⁺'],
    },
    equation: 'ArH + E⁺ → ArE + H⁺',
    description:
      'The characteristic reaction of aromatic rings: an electrophile replaces a hydrogen on the ring while preserving aromaticity. The mechanism involves formation of a non-aromatic carbocation intermediate (arenium ion/sigma complex) followed by deprotonation to restore aromaticity.',
    mechanism: [
      {
        step: 1,
        description:
          'Generation of the electrophile (E⁺), often with a Lewis acid catalyst. Example: Br₂ + FeBr₃ → Br⁺ + FeBr₄⁻.',
        arrowType: 'curved',
        notes: 'Lewis acid activates the electrophile',
      },
      {
        step: 2,
        description:
          'The π electrons of the aromatic ring attack the electrophile, forming the arenium ion (sigma complex). Aromaticity is temporarily lost.',
        arrowType: 'curved',
        intermediateFormula: 'Arenium ion (cyclohexadienyl cation)',
        notes: 'Slow step — rate determining',
      },
      {
        step: 3,
        description:
          'A base removes a proton from the sp³ carbon of the arenium ion, restoring aromaticity. This is fast because aromaticity is highly stabilizing.',
        arrowType: 'curved',
        notes: 'Fast step — aromaticity restored',
      },
    ],
    keyPoints: [
      'Substitution (not addition) to preserve aromaticity',
      'Five classic EAS reactions: halogenation, nitration, sulfonation, Friedel-Crafts alkylation/acylation',
      'Electron-donating groups (EDG): activate ring, direct ortho/para',
      'Electron-withdrawing groups (EWG): deactivate ring, direct meta',
      'Halogens: deactivating but ortho/para directing (lone pairs)',
      'Key intermediate: arenium ion (sigma complex)',
    ],
    examples: [
      {
        reactant: 'Benzene',
        product: 'Bromobenzene',
        reagent: 'Br₂, FeBr₃',
        yield: '85%',
      },
      {
        reactant: 'Toluene',
        product: 'o-Nitrotoluene + p-Nitrotoluene',
        reagent: 'HNO₃, H₂SO₄',
        yield: '90% (o+p)',
      },
      {
        reactant: 'Benzene',
        product: 'Nitrobenzene',
        reagent: 'HNO₃, H₂SO₄',
        yield: '90%',
      },
    ],
    syntheticUtility:
      'The most important reaction class for building substituted aromatic compounds. Foundation of pharmaceutical and materials chemistry.',
    limitations: [
      'Strongly deactivated rings (multiple EWG) may not react',
      'Polysubstitution can occur (especially with activated rings)',
      'Regiochemistry can give mixtures of ortho + para',
      'Some electrophiles too reactive (selectivity issues)',
    ],
    functionalGroups: ['arene'],
    tags: ['aromatic', 'EAS', 'electrophile', 'arenium ion', 'directing effects'],
    relatedReactions: [
      'friedel-crafts-alkylation',
      'friedel-crafts-acylation',
      'sandmeyer-reaction',
    ],
  },
  {
    id: 'hydroboration-oxidation',
    name: 'Hydroboration-Oxidation',
    altNames: ['Brown Hydroboration'],
    year: 1959,
    discoverer: 'Herbert C. Brown',
    category: 'addition',
    difficulty: 'introductory',
    generalScheme: {
      reactants: ['Alkene'],
      reagents: ['BH₃·THF', 'then H₂O₂/NaOH'],
      conditions: ['Step 1: 0°C to RT in THF; Step 2: H₂O₂, NaOH, H₂O'],
      products: ['Alcohol (anti-Markovnikov, syn addition)'],
    },
    equation: 'R-CH=CH₂ → (BH₃) → (H₂O₂/NaOH) → R-CH₂-CH₂OH',
    description:
      'A two-step sequence: (1) Hydroboration — BH₃ adds across the alkene with syn stereochemistry and anti-Markovnikov regiochemistry (B goes to less substituted C). (2) Oxidation — H₂O₂/NaOH replaces B with OH with retention of configuration. Nobel Prize 1979.',
    mechanism: [
      {
        step: 1,
        description:
          'Hydroboration: BH₃ adds across the alkene in a concerted, syn fashion via a 4-membered transition state. B adds to the less substituted carbon, H to the more substituted.',
        arrowType: 'curved',
        intermediateFormula: 'R-CH₂-CH₂-BH₂ (trialkylborane)',
        notes: 'Concerted, syn, anti-Markovnikov. Repeats 3x (one BH₃ + 3 alkenes)',
      },
      {
        step: 2,
        description:
          'Oxidation: H₂O₂ in base converts the C-B bond to C-OH with retention of configuration through a 1,2-alkyl migration mechanism.',
        arrowType: 'curved',
        notes: 'Retention of configuration — overall syn anti-Markovnikov',
      },
    ],
    keyPoints: [
      'Anti-Markovnikov regiochemistry (OH on less substituted C)',
      'Syn addition (both H and OH add from same face)',
      'Complementary to acid-catalyzed hydration (which gives Markovnikov)',
      'No carbocation intermediate → no rearrangements!',
      'Herbert C. Brown — Nobel Prize 1979',
      'BH₃ is electrophilic (empty p orbital on B)',
    ],
    examples: [
      {
        reactant: '1-Hexene',
        product: '1-Hexanol',
        reagent: 'BH₃·THF, then H₂O₂/NaOH',
        yield: '90%',
      },
      {
        reactant: '1-Methylcyclohexene',
        product: 'trans-2-Methylcyclohexanol',
        reagent: 'BH₃·THF, then H₂O₂/NaOH',
        yield: '85%',
      },
    ],
    syntheticUtility:
      'The go-to method for anti-Markovnikov hydration of alkenes. No rearrangements, syn selectivity, and clean regiochemistry make this invaluable.',
    limitations: [
      'Requires anhydrous conditions for hydroboration step',
      'BH₃ is air/moisture sensitive',
      'Over-addition possible (BH₃ adds to 3 alkenes)',
      'Less effective with sterically hindered alkenes (use 9-BBN or Sia₂BH)',
    ],
    functionalGroups: ['alkene', 'alcohol'],
    tags: ['addition', 'anti-Markovnikov', 'syn', 'hydroboration', 'Brown', 'Nobel'],
    relatedReactions: ['acid-catalyzed-hydration', 'markovnikov-addition'],
  },
]
