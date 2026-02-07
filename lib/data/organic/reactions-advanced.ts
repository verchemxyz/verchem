import { NamedReaction } from '@/lib/types/organic-chemistry'

/**
 * Advanced Named Reactions (Graduate / Synthesis)
 * 10 powerful reactions for advanced organic chemistry
 */
export const ADVANCED_REACTIONS: NamedReaction[] = [
  {
    id: 'suzuki-coupling',
    name: 'Suzuki-Miyaura Coupling',
    altNames: ['Suzuki Coupling', 'Suzuki Reaction'],
    year: 1979,
    discoverer: 'Akira Suzuki',
    category: 'coupling',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Aryl/vinyl halide (or triflate)', 'Organoboron compound (R-B(OH)₂)'],
      reagents: ['Pd(PPh₃)₄ or Pd(dppf)Cl₂ catalyst', 'Base (K₂CO₃, Cs₂CO₃)'],
      conditions: ['THF/H₂O or DMF, 60-100°C'],
      products: ['Biaryl or coupled product (Ar-Ar\' or R-R\')'],
    },
    equation: 'Ar-X + Ar\'-B(OH)₂ → Ar-Ar\' + XB(OH)₂',
    description:
      'Palladium-catalyzed cross-coupling of an organoboron compound with an aryl halide. The most widely used cross-coupling reaction due to mild conditions, tolerance of many functional groups, and stability of boronic acids. Nobel Prize 2010.',
    mechanism: [
      {
        step: 1,
        description:
          'Oxidative addition: Pd(0) inserts into the Ar-X bond to form Ar-Pd(II)-X.',
        arrowType: 'curved',
        intermediateFormula: 'Ar-Pd(II)-X',
        notes: 'Pd goes from 0 to +2 oxidation state',
      },
      {
        step: 2,
        description:
          'Transmetalation: Base activates the boronic acid (forming -ate complex). The Ar\' group transfers from B to Pd, replacing X.',
        arrowType: 'curved',
        intermediateFormula: 'Ar-Pd(II)-Ar\'',
        notes: 'Base is essential — activates the boronic acid',
      },
      {
        step: 3,
        description:
          'Reductive elimination: The two aryl groups on Pd couple together, forming the Ar-Ar\' product and regenerating Pd(0) catalyst.',
        arrowType: 'curved',
        notes: 'Pd returns to 0 oxidation state — catalytic cycle complete',
      },
    ],
    keyPoints: [
      'Most popular cross-coupling reaction in pharma industry',
      'Boronic acids are air-stable, commercially available, low toxicity',
      'Reactivity: Ar-I > Ar-OTf > Ar-Br >> Ar-Cl',
      'Pd(0) catalyst: Pd(PPh₃)₄, Pd₂(dba)₃, or Pd(OAc)₂ + ligand',
      'Base required for transmetalation (K₂CO₃, Cs₂CO₃, K₃PO₄)',
      'Aqueous conditions tolerated (unique advantage)',
      'Nobel Prize 2010 (Suzuki, Heck, Negishi)',
    ],
    examples: [
      {
        reactant: '4-Bromoanisole + Phenylboronic acid',
        product: '4-Methoxybiphenyl',
        reagent: 'Pd(PPh₃)₄, K₂CO₃, THF/H₂O, 80°C',
        yield: '92%',
      },
      {
        reactant: 'Bromobenzene + 2-Thienylboronic acid',
        product: '2-Phenylthiophene',
        reagent: 'Pd(PPh₃)₄, Na₂CO₃, DME/H₂O',
        yield: '88%',
      },
    ],
    syntheticUtility:
      'The workhorse of pharmaceutical synthesis for making biaryl compounds. Used in the synthesis of countless drug molecules (e.g., losartan, valsartan).',
    limitations: [
      'Aryl chlorides less reactive (need specialized ligands/catalysts)',
      'Alkyl boronic acids can β-hydride eliminate',
      'Pd catalyst cost (though typically 0.1-5 mol%)',
      'Homocoupling byproduct possible',
    ],
    functionalGroups: ['arene', 'alkyl-halide'],
    tags: ['cross-coupling', 'Pd', 'Nobel', 'biaryl', 'boronic acid', 'Suzuki'],
    relatedReactions: ['heck-reaction', 'sonogashira'],
  },
  {
    id: 'heck-reaction',
    name: 'Heck Reaction',
    altNames: ['Mizoroki-Heck Reaction'],
    year: 1972,
    discoverer: 'Tsutomu Mizoroki, Richard Heck',
    category: 'coupling',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Aryl/vinyl halide', 'Alkene'],
      reagents: ['Pd(OAc)₂ or Pd(PPh₃)₄', 'Base (Et₃N, K₂CO₃)'],
      conditions: ['DMF, 80-120°C'],
      products: ['Substituted alkene (usually trans/E)'],
    },
    equation: 'Ar-X + CH₂=CHR → Ar-CH=CHR + HX',
    description:
      'Palladium-catalyzed coupling of an aryl halide with an alkene. Unlike Suzuki, the alkene partner is used directly (no organometallic needed). Produces substituted alkenes with high E-selectivity. Nobel Prize 2010.',
    mechanism: [
      {
        step: 1,
        description:
          'Oxidative addition: Pd(0) inserts into Ar-X bond.',
        arrowType: 'curved',
        intermediateFormula: 'Ar-Pd(II)-X',
      },
      {
        step: 2,
        description:
          'Syn migratory insertion: The alkene coordinates to Pd, then the Ar group migrates to the alkene in a syn fashion.',
        arrowType: 'curved',
        intermediateFormula: 'Ar-CH₂-CHR-Pd(II)-X',
        notes: 'Syn insertion determines regiochemistry',
      },
      {
        step: 3,
        description:
          'β-Hydride elimination: Pd and a β-H eliminate in a syn fashion to give the alkene product and H-Pd-X.',
        arrowType: 'curved',
        notes: 'Syn elimination — gives E-alkene preferentially',
      },
      {
        step: 4,
        description:
          'Base regenerates Pd(0) by removing HX from H-Pd-X.',
        arrowType: 'curved',
        notes: 'Catalytic cycle closed',
      },
    ],
    keyPoints: [
      'No organometallic coupling partner needed (just the alkene)',
      'Usually gives E (trans) alkene selectivity',
      'Intramolecular Heck forms rings efficiently',
      'Works with electron-poor alkenes (acrylates) best',
      'Nobel Prize 2010 (shared with Suzuki and Negishi)',
      'Asymmetric Heck: chiral ligands → enantioenriched products',
    ],
    examples: [
      {
        reactant: 'Iodobenzene + Methyl acrylate',
        product: 'Methyl (E)-cinnamate',
        reagent: 'Pd(OAc)₂, Et₃N, DMF, 100°C',
        yield: '85%',
      },
      {
        reactant: 'Bromobenzene + Styrene',
        product: '(E)-Stilbene',
        reagent: 'Pd(PPh₃)₄, Et₃N, DMF',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Powerful method for making substituted alkenes. Intramolecular version is a key strategy for natural product synthesis.',
    limitations: [
      'Requires aryl or vinyl halides (alkyl halides undergo β-elimination)',
      'High temperatures often needed',
      'E/Z selectivity can be an issue with internal alkenes',
    ],
    functionalGroups: ['arene', 'alkene', 'alkyl-halide'],
    tags: ['cross-coupling', 'Pd', 'Nobel', 'alkene', 'Heck'],
    relatedReactions: ['suzuki-coupling', 'sonogashira'],
  },
  {
    id: 'sonogashira',
    name: 'Sonogashira Coupling',
    altNames: ['Sonogashira-Hagihara Coupling'],
    year: 1975,
    discoverer: 'Kenkichi Sonogashira',
    category: 'coupling',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Aryl/vinyl halide', 'Terminal alkyne'],
      reagents: ['Pd(PPh₃)₂Cl₂ + CuI (co-catalyst)', 'Amine base (Et₃N, iPr₂NH)'],
      conditions: ['THF or DMF, RT to 80°C'],
      products: ['Aryl/vinyl alkyne'],
    },
    equation: 'Ar-X + HC≡CR → Ar-C≡CR + HX',
    description:
      'Palladium/copper co-catalyzed coupling of a terminal alkyne with an aryl halide. The copper acetylide intermediate undergoes transmetalation with the palladium complex. Creates sp-sp² C-C bonds.',
    mechanism: [
      {
        step: 1,
        description: 'Oxidative addition: Pd(0) inserts into Ar-X.',
        arrowType: 'curved',
        intermediateFormula: 'Ar-Pd(II)-X',
      },
      {
        step: 2,
        description:
          'Cu cycle: CuI and the amine base form a Cu(I) acetylide from the terminal alkyne (Cu-C≡CR).',
        arrowType: 'curved',
        intermediateFormula: 'Cu-C≡CR',
        notes: 'Cu co-catalyst activates the terminal alkyne',
      },
      {
        step: 3,
        description:
          'Transmetalation: The Cu acetylide transfers the alkynyl group to Pd, replacing X.',
        arrowType: 'curved',
        intermediateFormula: 'Ar-Pd(II)-C≡CR',
      },
      {
        step: 4,
        description: 'Reductive elimination: Ar and C≡CR couple, regenerating Pd(0).',
        arrowType: 'curved',
      },
    ],
    keyPoints: [
      'Two catalysts: Pd + Cu (dual catalytic cycle)',
      'Terminal alkynes only (internal alkynes do not react)',
      'Often room temperature (milder than Suzuki/Heck)',
      'Amine serves as both base and solvent',
      'Copper-free variants exist (avoid Glaser homocoupling side reaction)',
      'Key for conjugated polymer and materials synthesis',
    ],
    examples: [
      {
        reactant: 'Iodobenzene + Phenylacetylene',
        product: 'Diphenylacetylene (tolane)',
        reagent: 'Pd(PPh₃)₂Cl₂, CuI, Et₃N',
        yield: '90%',
      },
      {
        reactant: '4-Iodoanisole + TMS-acetylene',
        product: '4-(Trimethylsilylethynyl)anisole',
        reagent: 'Pd(PPh₃)₂Cl₂, CuI, iPr₂NH',
        yield: '88%',
      },
    ],
    syntheticUtility:
      'The standard method for making aryl-alkyne bonds. Essential in pharmaceutical synthesis, molecular wires, and organic electronics.',
    limitations: [
      'Glaser homocoupling of alkyne (Cu-mediated, use N₂ atmosphere)',
      'Terminal alkynes only',
      'Cu co-catalyst can cause side reactions',
    ],
    functionalGroups: ['alkyne', 'arene', 'alkyl-halide'],
    tags: ['cross-coupling', 'Pd', 'Cu', 'alkyne', 'Sonogashira'],
    relatedReactions: ['suzuki-coupling', 'heck-reaction'],
  },
  {
    id: 'olefin-metathesis',
    name: 'Olefin Metathesis',
    altNames: ['Grubbs Metathesis', 'Ring-Closing Metathesis (RCM)', 'Cross Metathesis (CM)'],
    year: 1992,
    discoverer: 'Robert Grubbs, Richard Schrock',
    category: 'rearrangement',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Two alkenes'],
      reagents: ['Grubbs catalyst (Ru-based) or Schrock catalyst (Mo-based)'],
      conditions: ['CH₂Cl₂ or toluene, RT to 40°C'],
      products: ['New alkenes (exchanged substituents) + Ethylene (gas)'],
    },
    equation: 'R¹CH=CHR² + R³CH=CHR⁴ ⇌ R¹CH=CHR³ + R²CH=CHR⁴',
    description:
      'Alkene bonds are broken and reformed — substituents on the double bonds are "scrambled." The key intermediate is a metallacyclobutane. Ring-closing metathesis (RCM) is especially powerful for making medium and large rings. Nobel Prize 2005.',
    mechanism: [
      {
        step: 1,
        description:
          'The Ru=CH₂ carbene (from Grubbs catalyst) undergoes [2+2] cycloaddition with the alkene to form a metallacyclobutane.',
        arrowType: 'curved',
        intermediateFormula: 'Metallacyclobutane (4-membered Ru ring)',
        notes: '[2+2] cycloaddition — allowed because metal is involved',
      },
      {
        step: 2,
        description:
          'Retro-[2+2] cycloreversion: the metallacyclobutane breaks in the other direction, forming a new alkene and a new Ru carbene.',
        arrowType: 'retro',
        notes: 'New C=C bond formed, ethylene released',
      },
      {
        step: 3,
        description:
          'The new Ru carbene continues the catalytic cycle with another alkene molecule. For RCM, intramolecular reaction closes the ring.',
        arrowType: 'curved',
        notes: 'Ethylene gas escapes — drives equilibrium forward',
      },
    ],
    keyPoints: [
      'Three types: RCM (ring-closing), CM (cross), ROMP (ring-opening polymerization)',
      'Grubbs 1st gen: Ru(=CHPh)(Cl)₂(PCy₃)₂ — air-tolerant',
      'Grubbs 2nd gen: NHC ligand — more active, more stable',
      'RCM: makes 5 to 20+ membered rings (amazing for macrocycles)',
      'Ethylene release drives equilibrium (Le Chatelier)',
      'Nobel Prize 2005 (Grubbs, Schrock, Chauvin)',
      'Functional group tolerance is excellent with Ru catalysts',
    ],
    examples: [
      {
        reactant: 'Diethyl diallylmalonate',
        product: 'Diethyl cyclopent-3-ene-1,1-dicarboxylate',
        reagent: 'Grubbs II (5 mol%), CH₂Cl₂',
        yield: '95% (RCM)',
      },
      {
        reactant: '1-Hexene (self CM)',
        product: '5-Decene + Ethylene',
        reagent: 'Grubbs I, toluene',
        yield: '70% (CM)',
      },
    ],
    syntheticUtility:
      'Revolutionary for ring formation, especially medium and large rings that are otherwise difficult to make. Transformed total synthesis and polymer chemistry.',
    limitations: [
      'E/Z selectivity in CM can be poor (E usually favored)',
      'Catalyst loading (1-10 mol%) can be expensive at scale',
      'Electron-poor alkenes may be sluggish',
      'Ru contamination in product (problematic for pharma)',
    ],
    functionalGroups: ['alkene'],
    tags: ['metathesis', 'Ru', 'Nobel', 'ring-closing', 'carbene', 'Grubbs'],
    relatedReactions: ['diels-alder'],
  },
  {
    id: 'sharpless-epoxidation',
    name: 'Sharpless Asymmetric Epoxidation',
    altNames: ['SAE', 'Sharpless Epoxidation'],
    year: 1980,
    discoverer: 'K. Barry Sharpless',
    category: 'oxidation',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Allylic alcohol'],
      reagents: [
        'Ti(OiPr)₄ (titanium tetraisopropoxide)',
        'TBHP (tert-butyl hydroperoxide)',
        'DET or DIPT (chiral tartrate ligand)',
      ],
      conditions: ['CH₂Cl₂, -20°C, molecular sieves'],
      products: ['Enantioenriched 2,3-epoxy alcohol (>90% ee)'],
    },
    equation: 'Allylic alcohol + TBHP → Epoxy alcohol (>90% ee)',
    description:
      'Enantioselective epoxidation of allylic alcohols using Ti(OiPr)₄, a tartrate ester ligand, and TBHP as oxidant. The mnemonic: draw the allylic alcohol with OH in the lower right — L-(+)-DIPT delivers oxygen from the top, D-(-)-DIPT from the bottom. Nobel Prize 2001.',
    mechanism: [
      {
        step: 1,
        description:
          'Ti(OiPr)₄ exchanges two isopropoxide ligands with the tartrate (DET/DIPT) and the allylic alcohol, forming a chiral Ti-peroxo complex.',
        arrowType: 'curved',
        intermediateFormula: 'Chiral Ti-peroxo complex',
        notes: 'Allylic alcohol coordinates to Ti — substrate must have OH',
      },
      {
        step: 2,
        description:
          'The peroxide oxygen is delivered to one specific face of the alkene (determined by the tartrate chirality), forming the epoxide enantioselectively.',
        arrowType: 'curved',
        notes: 'L-tartrate → top face; D-tartrate → bottom face (mnemonic)',
      },
    ],
    keyPoints: [
      'Only works with allylic alcohols (OH required for Ti coordination)',
      'Mnemonic: draw OH at lower right → L-(+)-DET attacks from top, D-(-)-DET from bottom',
      'Typically >90% ee (often >95% ee)',
      'Catalytic with molecular sieves (removes water)',
      'Kinetic resolution: racemic allylic alcohols → one enantiomer epoxidized selectively',
      'K. Barry Sharpless — Nobel Prize 2001 (also 2022 for click chemistry!)',
    ],
    examples: [
      {
        reactant: 'Geraniol (E-allylic alcohol)',
        product: '(2S,3S)-2,3-Epoxygeraniol',
        reagent: 'Ti(OiPr)₄, L-(+)-DET, TBHP, -20°C',
        yield: '90%, 95% ee',
      },
      {
        reactant: '(E)-2-Buten-1-ol',
        product: '(2S,3S)-Epoxybutan-1-ol',
        reagent: 'Ti(OiPr)₄, D-(-)-DIPT, TBHP',
        yield: '85%, 93% ee',
      },
    ],
    syntheticUtility:
      'First practical catalytic asymmetric synthesis. Epoxy alcohols are extremely versatile intermediates for total synthesis. Changed the field of asymmetric catalysis.',
    limitations: [
      'Only allylic alcohols (not simple alkenes)',
      'For non-allylic alkenes: use Jacobsen epoxidation (Mn-salen) or Shi epoxidation',
      'Sensitive to moisture (need molecular sieves)',
    ],
    functionalGroups: ['alkene', 'alcohol', 'epoxide'],
    tags: ['asymmetric', 'epoxidation', 'Nobel', 'ee', 'Sharpless', 'enantioselective'],
    relatedReactions: [],
  },
  {
    id: 'beckmann-rearrangement',
    name: 'Beckmann Rearrangement',
    altNames: ['Beckmann Reaction'],
    year: 1886,
    discoverer: 'Ernst Otto Beckmann',
    category: 'rearrangement',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Ketoxime (R₂C=NOH)'],
      reagents: ['Strong acid (H₂SO₄, PCl₅, or SOCl₂)'],
      conditions: ['Heat'],
      products: ['Amide or Lactam'],
    },
    equation: 'R₂C=NOH → R-CO-NHR\' (amide)',
    description:
      'Rearrangement of a ketoxime to an amide (or lactam from cyclic ketoximes). The group anti to the hydroxyl migrates to nitrogen. Industrially important: cyclohexanone oxime → caprolactam (nylon-6 precursor).',
    mechanism: [
      {
        step: 1,
        description:
          'Protonation or activation of the oxime OH, making it a good leaving group (H₂O).',
        arrowType: 'curved',
      },
      {
        step: 2,
        description:
          'The alkyl group anti to the departing OH migrates from carbon to nitrogen as water leaves. This is a concerted 1,2-shift.',
        arrowType: 'curved',
        intermediateFormula: 'Nitrilium ion (R-C≡N⁺-R\')',
        notes: 'Anti group migrates — stereospecific',
      },
      {
        step: 3,
        description:
          'Water attacks the nitrilium ion, followed by tautomerization to give the amide product.',
        arrowType: 'curved',
        notes: 'Nitrilium → amide via hydration',
      },
    ],
    keyPoints: [
      'Anti group migrates to nitrogen (stereospecific)',
      'Industrial: cyclohexanone oxime → ε-caprolactam → Nylon-6',
      'Cyclic ketones give lactams (ring expansion by 1 atom)',
      'Can predict which group migrates based on oxime geometry',
      'Billions of kg/year produced industrially (caprolactam)',
    ],
    examples: [
      {
        reactant: 'Cyclohexanone oxime',
        product: 'ε-Caprolactam (→ Nylon-6)',
        reagent: 'H₂SO₄ (fuming), heat',
        yield: '95% (industrial)',
      },
      {
        reactant: 'Acetophenone oxime',
        product: 'N-Phenylacetamide (acetanilide)',
        reagent: 'PCl₅, then H₂O',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Converts ketones to amides (via oxime). Industrially essential for Nylon-6 production. Also useful for ring expansion in synthesis.',
    limitations: [
      'Harsh acidic conditions required',
      'Only the anti group migrates (need correct oxime geometry)',
      'Some substrates give fragmentation instead of rearrangement',
    ],
    functionalGroups: ['ketone', 'amide'],
    tags: ['rearrangement', '1,2-shift', 'oxime', 'nylon', 'industrial', 'Beckmann'],
    relatedReactions: ['baeyer-villiger'],
  },
  {
    id: 'baeyer-villiger',
    name: 'Baeyer-Villiger Oxidation',
    altNames: ['Baeyer-Villiger Reaction'],
    year: 1899,
    discoverer: 'Adolf von Baeyer, Victor Villiger',
    category: 'oxidation',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Ketone'],
      reagents: ['mCPBA or CF₃CO₃H (peracid)'],
      conditions: ['CH₂Cl₂, RT'],
      products: ['Ester (or Lactone from cyclic ketones)'],
    },
    equation: 'R-CO-R\' + RCO₃H → R-CO-O-R\' (ester)',
    description:
      'Oxidation of a ketone to an ester (or lactone) using a peracid. An oxygen atom is inserted between the carbonyl and the adjacent carbon. The migratory aptitude determines which group migrates: 3° > 2° > 1° > methyl (also aryl migrates well).',
    mechanism: [
      {
        step: 1,
        description:
          'The peracid attacks the ketone carbonyl to form a tetrahedral intermediate (Criegee intermediate).',
        arrowType: 'curved',
        intermediateFormula: 'Criegee intermediate',
      },
      {
        step: 2,
        description:
          'The group with highest migratory aptitude migrates from carbon to oxygen as the carboxylate leaves. This is a concerted 1,2-shift.',
        arrowType: 'curved',
        notes: 'Migratory aptitude: 3° > 2° > aryl ≈ vinyl > 1° > methyl',
      },
    ],
    keyPoints: [
      'Ketone → Ester (O inserted between C=O and C)',
      'Migratory aptitude: 3° > 2° > aryl ≈ vinyl > 1° > methyl',
      'Cyclic ketones → lactones (ring expanded by one O)',
      'mCPBA is the most common peracid reagent',
      'Regioselective: the more substituted group migrates',
      'Enzymatic version: Baeyer-Villiger monooxygenases (BVMOs)',
    ],
    examples: [
      {
        reactant: 'Cyclohexanone',
        product: 'ε-Caprolactone',
        reagent: 'mCPBA, CH₂Cl₂',
        yield: '85%',
      },
      {
        reactant: '3-Methylcyclobutanone',
        product: '4-Methylbutyrolactone',
        reagent: 'mCPBA',
        yield: '90%',
      },
      {
        reactant: 'Acetophenone',
        product: 'Phenyl acetate',
        reagent: 'mCPBA (aryl migrates)',
        yield: '80%',
      },
    ],
    syntheticUtility:
      'Clean method to convert ketones to esters/lactones. Lactones from cyclic ketones are especially valuable in polymer and natural product chemistry.',
    limitations: [
      'Peracids can also epoxidize alkenes (competing reaction)',
      'Strongly electron-poor ketones are sluggish',
      'Aldehydes give formate esters (less useful)',
    ],
    functionalGroups: ['ketone', 'ester'],
    tags: ['oxidation', 'Baeyer-Villiger', 'peracid', 'lactone', 'rearrangement'],
    relatedReactions: ['beckmann-rearrangement'],
  },
  {
    id: 'robinson-annulation',
    name: 'Robinson Annulation',
    altNames: ['Robinson Ring Formation'],
    year: 1935,
    discoverer: 'Robert Robinson',
    category: 'condensation',
    difficulty: 'advanced',
    generalScheme: {
      reactants: [
        'Ketone with α-H (Michael donor)',
        'Methyl vinyl ketone (MVK, Michael acceptor)',
      ],
      reagents: ['Base (NaOH, KOH, or NaOEt)'],
      conditions: ['EtOH or MeOH, heat'],
      products: ['2-Cyclohexenone (fused ring system)'],
    },
    equation: 'Ketone + MVK → 2-Cyclohexenone',
    description:
      'A tandem Michael addition followed by intramolecular aldol condensation that constructs a new 6-membered ring fused to the existing ketone. This one-pot reaction creates one ring, two C-C bonds, and three stereocenters.',
    mechanism: [
      {
        step: 1,
        description:
          'Michael addition: The enolate of the ketone adds in a 1,4-fashion to the methyl vinyl ketone (Michael acceptor), giving a 1,5-diketone.',
        arrowType: 'curved',
        intermediateFormula: '1,5-Diketone',
        notes: 'Michael addition (see Michael reaction)',
      },
      {
        step: 2,
        description:
          'Intramolecular aldol: One of the ketone enolates attacks the other ketone carbonyl within the same molecule, forming a 6-membered ring with a β-hydroxy ketone.',
        arrowType: 'curved',
        intermediateFormula: 'β-Hydroxy ketone (aldol product)',
        notes: 'Intramolecular aldol cyclization',
      },
      {
        step: 3,
        description:
          'Dehydration: The β-hydroxy ketone loses water to form the conjugated cyclohexenone product.',
        arrowType: 'curved',
        notes: 'Aldol condensation — forms the enone',
      },
    ],
    keyPoints: [
      'Michael + Intramolecular Aldol + Dehydration = 3 steps in one pot',
      'Creates a new 6-membered ring with an enone',
      'Key retrosynthetic disconnection for cyclohexenones',
      'Hajos-Parrish: asymmetric Robinson with proline catalyst',
      'Widely used in steroid and terpene total synthesis',
      'Robert Robinson — Nobel Prize 1947 (for alkaloid chemistry)',
    ],
    examples: [
      {
        reactant: '2-Methylcyclohexanone + MVK',
        product: 'Bicyclic enone (Hajos-Parrish ketone precursor)',
        reagent: 'NaOH, EtOH, heat',
        yield: '70%',
      },
    ],
    syntheticUtility:
      'The classic method for building 6-membered rings onto existing ketones. Critical in steroid and terpene synthesis.',
    limitations: [
      'Regiochemistry can be an issue with unsymmetrical ketones',
      'Polymerization of MVK can compete',
      'Moderate yields sometimes (multiple steps)',
    ],
    functionalGroups: ['ketone'],
    tags: ['annulation', 'Michael', 'aldol', 'ring formation', 'tandem', 'Robinson'],
    relatedReactions: ['michael-addition', 'aldol'],
  },
  {
    id: 'mannich-reaction',
    name: 'Mannich Reaction',
    altNames: ['Mannich Condensation'],
    year: 1912,
    discoverer: 'Carl Mannich',
    category: 'multicomponent',
    difficulty: 'advanced',
    generalScheme: {
      reactants: [
        'Aldehyde or Ketone with α-H',
        'Formaldehyde (CH₂O)',
        'Amine (secondary, HNR₂)',
      ],
      reagents: ['Acid catalyst'],
      conditions: ['H₂O or EtOH, RT to reflux'],
      products: ['β-Amino carbonyl (Mannich base)'],
    },
    equation: 'RCOCH₃ + CH₂O + HNR₂ → RCOCH₂CH₂NR₂',
    description:
      'A three-component reaction: an enolizable carbonyl compound, formaldehyde, and an amine combine to form a β-amino carbonyl compound (Mannich base). Proceeds through an iminium ion intermediate that acts as the electrophile.',
    mechanism: [
      {
        step: 1,
        description:
          'The amine reacts with formaldehyde to form an iminium ion (an electrophilic C=N⁺).',
        arrowType: 'curved',
        intermediateFormula: 'CH₂=NR₂⁺ (iminium ion)',
        notes: 'Iminium ion is the electrophile',
      },
      {
        step: 2,
        description:
          'The enol (or enolate) of the ketone attacks the electrophilic iminium ion carbon, forming the Mannich base.',
        arrowType: 'curved',
        notes: 'C-C bond formation between α-carbon and iminium',
      },
    ],
    keyPoints: [
      'Three-component reaction (ketone + CH₂O + amine)',
      'Product: β-amino ketone (Mannich base)',
      'Mannich bases are precursors to α,β-unsaturated ketones (via Hofmann elimination)',
      'Used in pharmaceutical synthesis (tropinone, tramadol)',
      'Asymmetric Mannich: chiral catalysts give enantiopure products',
      'Related to Strecker synthesis (with CN⁻ instead of enolate)',
    ],
    examples: [
      {
        reactant: 'Acetone + CH₂O + Dimethylamine',
        product: '4-(Dimethylamino)-2-butanone',
        reagent: 'HCl cat., H₂O',
        yield: '75%',
      },
    ],
    syntheticUtility:
      'Versatile C-C bond-forming reaction. Mannich bases are key intermediates in alkaloid synthesis and pharmaceutical manufacturing.',
    limitations: [
      'Self-condensation side reactions',
      'Requires enolizable carbonyl partner',
      'Regioselectivity with unsymmetrical ketones',
    ],
    functionalGroups: ['ketone', 'aldehyde', 'amine'],
    tags: ['multicomponent', 'Mannich', 'iminium', 'amino ketone', 'MCR'],
    relatedReactions: ['aldol', 'michael-addition'],
  },
  {
    id: 'sandmeyer-reaction',
    name: 'Sandmeyer Reaction',
    altNames: ['Sandmeyer'],
    year: 1884,
    discoverer: 'Traugott Sandmeyer',
    category: 'substitution',
    difficulty: 'advanced',
    generalScheme: {
      reactants: ['Aryldiazonium salt (ArN₂⁺)'],
      reagents: ['CuX (CuCl, CuBr, CuCN)'],
      conditions: ['0-5°C (diazotization), then warm'],
      products: ['Aryl halide or nitrile (ArCl, ArBr, ArCN)'],
    },
    equation: 'ArNH₂ → ArN₂⁺ → ArX (via CuX)',
    description:
      'Conversion of an aryldiazonium salt to an aryl halide (Cl, Br) or nitrile (CN) using copper(I) salts. The diazonium salt is first prepared by treating the arylamine with NaNO₂/HCl at 0°C. Essential for introducing substituents not easily placed by direct EAS.',
    mechanism: [
      {
        step: 1,
        description:
          'Diazotization: The arylamine reacts with NaNO₂/HCl at 0-5°C to form the diazonium salt (ArN₂⁺).',
        arrowType: 'curved',
        intermediateFormula: 'ArN₂⁺ Cl⁻ (diazonium salt)',
        notes: 'Must be kept cold — diazonium salts decompose above 5°C',
      },
      {
        step: 2,
        description:
          'The Cu(I) salt mediates replacement of N₂ with X (Cl, Br, or CN). N₂ gas escapes as an excellent leaving group.',
        arrowType: 'curved',
        notes: 'Cu(I) is essential — simple halide doesn\'t work (except for I⁻)',
      },
    ],
    keyPoints: [
      'ArNH₂ → ArN₂⁺ → ArCl (CuCl), ArBr (CuBr), ArCN (CuCN)',
      'ArN₂⁺ + KI → ArI (no Cu needed — direct substitution)',
      'ArN₂⁺ + H₃PO₂ → ArH (reduction — removes NH₂ group)',
      'ArN₂⁺ + HBF₄ → ArF (Balz-Schiemann reaction)',
      'ArN₂⁺ + phenol → azo dye (diazo coupling)',
      'NH₂ is obtained from NO₂ by reduction (Fe/HCl, SnCl₂, or H₂/Pd)',
      'Key for placing substituents in positions not accessible by direct EAS',
    ],
    examples: [
      {
        reactant: 'Aniline → Diazonium salt',
        product: 'Chlorobenzene',
        reagent: 'NaNO₂/HCl (0°C), then CuCl',
        yield: '70%',
      },
      {
        reactant: 'p-Toluidine → Diazonium salt',
        product: 'p-Bromotoluene',
        reagent: 'NaNO₂/HBr (0°C), then CuBr',
        yield: '75%',
      },
      {
        reactant: 'p-Nitroaniline → Diazonium salt',
        product: 'p-Nitrobenzonitrile',
        reagent: 'NaNO₂/HCl (0°C), then CuCN',
        yield: '65%',
      },
    ],
    syntheticUtility:
      'Enables EAS reactions that would otherwise be impossible. The -NH₂ group is a versatile synthetic handle that can be converted to many different substituents via the diazonium salt.',
    limitations: [
      'Diazonium salts are unstable and potentially explosive when dry',
      'Must keep at 0-5°C',
      'Yields can be moderate (60-80%)',
      'Aliphatic diazonium salts too unstable (only aromatic)',
    ],
    functionalGroups: ['amine', 'arene', 'alkyl-halide', 'nitrile'],
    tags: ['diazonium', 'Sandmeyer', 'aromatic', 'amine to halide', 'Cu'],
    relatedReactions: ['electrophilic-aromatic-substitution'],
  },
]
