// VerChem Advanced Search Engine
import Fuse from 'fuse.js'
import { 
  SearchResult, 
  SearchQuery, 
  SearchFilters, 
  SearchOptions,
  CompoundSearchData,
  ElementSearchData,
  CalculatorSearchData,
  HelpSearchData,
  AdvancedQuerySyntax
} from './types'
import { COMMON_COMPOUNDS } from '../data/compounds'
import { PERIODIC_TABLE } from '../data/periodic-table'

export class VerChemSearchEngine {
  private compoundIndex!: Fuse<CompoundSearchData>
  private elementIndex!: Fuse<ElementSearchData>
  private calculatorIndex!: Fuse<CalculatorSearchData>
  private helpIndex!: Fuse<HelpSearchData>

  private compoundData!: CompoundSearchData[]
  private elementData!: ElementSearchData[]
  private calculatorData!: CalculatorSearchData[]
  private helpData!: HelpSearchData[]

  constructor() {
    this.initializeData()
    this.createIndexes()
  }

  private initializeData() {
    // Initialize compound data
    this.compoundData = COMMON_COMPOUNDS.map(compound => {
      // Handle hazards - can be string[] or object[]
      const hazardTypes = compound.hazards?.map(h =>
        typeof h === 'string' ? h : (h.type || h.ghsCode || '')
      ).filter(Boolean) || [];
      const ghsCodes = compound.hazards?.map(h =>
        typeof h === 'string' ? h : (h.ghsCode || '')
      ).filter(Boolean) || [];

      return {
        id: compound.id,
        name: compound.name,
        formula: compound.formula,
        molecularMass: compound.molecularMass ?? compound.molarMass ?? 0,
        pKa: compound.pKa,
        pKb: compound.pKb,
        smiles: (compound as { structure?: string }).structure,
        cas: compound.cas,
        meltingPoint: compound.meltingPoint,
        boilingPoint: compound.boilingPoint,
        density: compound.density,
        solubility: typeof compound.solubility === 'string' ? compound.solubility : compound.solubility?.water,
        appearance: compound.appearance,
        hazards: hazardTypes,
        ghsCodes: ghsCodes as string[],
        uses: compound.uses,
        category: 'compound' as const,
        tags: [
          compound.name.toLowerCase(),
          compound.formula.toLowerCase(),
          compound.iupacName?.toLowerCase() || '',
          ...(compound.uses || []).map(u => u.toLowerCase()),
          ...hazardTypes
        ].filter(Boolean),
        thaiName: compound.nameThai
      };
    })

    // Initialize element data
    this.elementData = PERIODIC_TABLE.map(element => ({
      atomicNumber: element.atomicNumber,
      symbol: element.symbol,
      name: element.name,
      atomicMass: element.atomicMass,
      category: element.category,
      group: element.group,
      period: element.period,
      block: element.block,
      electronConfiguration: element.electronConfiguration,
      electronegativity: element.electronegativity,
      ionizationEnergy: element.ionizationEnergy,
      meltingPoint: element.meltingPoint,
      boilingPoint: element.boilingPoint,
      density: element.density,
      discoveryYear: element.discoveryYear,
      discoverer: element.discoverer,
      applications: this.getElementApplications(element),
      tags: [
        element.name.toLowerCase(),
        element.symbol.toLowerCase(),
        element.category,
        `group-${element.group}`,
        `period-${element.period}`,
        `${element.block}-block`,
        ...(element.discoverer ? [element.discoverer.toLowerCase()] : [])
      ].filter(Boolean)
    }))

    // Initialize calculator data
    this.calculatorData = this.getCalculatorData()

    // Initialize help data
    this.helpData = this.getHelpData()
  }

  private getElementApplications(element: { symbol: string; category: string }): string[] {
    const applications: string[] = []
    
    // Categorize by element properties
    if (element.category === 'transition-metal') {
      applications.push('catalyst', 'industrial', 'alloys')
    }
    if (element.category === 'noble-gas') {
      applications.push('lighting', 'welding', 'medical')
    }
    if (element.category === 'halogen') {
      applications.push('disinfectant', 'plastics', 'pharmaceutical')
    }
    if (element.category === 'alkali-metal') {
      applications.push('batteries', 'chemicals', 'glass')
    }
    if (element.symbol === 'Si') {
      applications.push('semiconductor', 'electronics', 'solar')
    }
    if (element.symbol === 'Cu') {
      applications.push('electronics', 'wiring', 'coins')
    }
    if (element.symbol === 'Au') {
      applications.push('jewelry', 'electronics', 'investment')
    }
    if (element.symbol === 'Ag') {
      applications.push('photography', 'jewelry', 'electronics')
    }
    if (element.symbol === 'Fe') {
      applications.push('steel', 'construction', 'machinery')
    }
    if (element.symbol === 'Al') {
      applications.push('aerospace', 'packaging', 'construction')
    }
    if (element.symbol === 'C') {
      applications.push('organic', 'fuel', 'steel')
    }
    if (element.symbol === 'O') {
      applications.push('life', 'combustion', 'medical')
    }
    if (element.symbol === 'N') {
      applications.push('fertilizer', 'explosives', 'atmosphere')
    }
    
    return applications
  }

  private getCalculatorData(): CalculatorSearchData[] {
    return [
      {
        id: 'stoichiometry',
        name: 'Stoichiometry Calculator',
        description: 'Calculate chemical reaction stoichiometry, limiting reagents, and yields',
        category: 'reactions',
        type: 'stoichiometry',
        inputs: [
          { name: 'reactants', type: 'string', description: 'Chemical equation or reactants' },
          { name: 'givenAmount', type: 'number', unit: 'g/mol/L', description: 'Amount of given substance' }
        ],
        outputs: [
          { name: 'products', type: 'string', description: 'Calculated products' },
          { name: 'limitingReagent', type: 'string', description: 'Limiting reagent' },
          { name: 'theoreticalYield', type: 'number', unit: 'g', description: 'Theoretical yield' }
        ],
        difficulty: 'intermediate',
        educationalLevel: ['high-school', 'college'],
        tags: ['stoichiometry', 'reactions', 'yield', 'limiting-reagent', 'chemistry-calculator'],
        url: '/stoichiometry'
      },
      {
        id: 'equation-balancer',
        name: 'Chemical Equation Balancer',
        description: 'Balance chemical equations automatically',
        category: 'reactions',
        type: 'equation-balancer',
        inputs: [
          { name: 'equation', type: 'string', description: 'Unbalanced chemical equation' }
        ],
        outputs: [
          { name: 'balancedEquation', type: 'string', description: 'Balanced chemical equation' },
          { name: 'coefficients', type: 'array', description: 'Stoichiometric coefficients' }
        ],
        difficulty: 'basic',
        educationalLevel: ['high-school', 'college'],
        tags: ['balancing', 'equations', 'coefficients', 'chemical-reactions'],
        url: '/equation-balancer'
      },
      {
        id: 'molecular-weight',
        name: 'Molecular Weight Calculator',
        description: 'Calculate molecular weights from chemical formulas',
        category: 'properties',
        type: 'molecular-weight',
        inputs: [
          { name: 'formula', type: 'string', description: 'Chemical formula' }
        ],
        outputs: [
          { name: 'molecularWeight', type: 'number', unit: 'g/mol', description: 'Molecular weight' },
          { name: 'elementalComposition', type: 'object', description: 'Percentage composition by element' }
        ],
        difficulty: 'basic',
        educationalLevel: ['middle-school', 'high-school', 'college'],
        tags: ['molecular-weight', 'formula', 'composition', 'molar-mass'],
        url: '/molecular-weight'
      },
      {
        id: 'gas-laws',
        name: 'Gas Laws Calculator',
        description: 'Calculate properties using ideal gas law and other gas laws',
        category: 'physical',
        type: 'gas-laws',
        formula: 'PV = nRT',
        inputs: [
          { name: 'pressure', type: 'number', unit: 'atm/Pa', description: 'Pressure' },
          { name: 'volume', type: 'number', unit: 'L/m³', description: 'Volume' },
          { name: 'temperature', type: 'number', unit: 'K/°C', description: 'Temperature' },
          { name: 'moles', type: 'number', unit: 'mol', description: 'Number of moles' }
        ],
        outputs: [
          { name: 'unknown', type: 'number', description: 'Calculated unknown variable' },
          { name: 'density', type: 'number', unit: 'g/L', description: 'Gas density' }
        ],
        examples: [
          'Calculate volume of 1 mole gas at STP',
          'Find pressure when volume changes from 2L to 4L'
        ],
        difficulty: 'intermediate',
        educationalLevel: ['high-school', 'college'],
        tags: ['gas-laws', 'ideal-gas', 'pressure', 'volume', 'temperature', 'moles'],
        url: '/gas-laws'
      },
      {
        id: 'thermodynamics',
        name: 'Thermodynamics Calculator',
        description: 'Calculate enthalpy, entropy, and Gibbs free energy changes',
        category: 'thermodynamics',
        type: 'thermodynamics',
        inputs: [
          { name: 'initialState', type: 'object', description: 'Initial thermodynamic state' },
          { name: 'finalState', type: 'object', description: 'Final thermodynamic state' }
        ],
        outputs: [
          { name: 'enthalpyChange', type: 'number', unit: 'kJ/mol', description: 'Enthalpy change' },
          { name: 'entropyChange', type: 'number', unit: 'J/mol·K', description: 'Entropy change' },
          { name: 'gibbsEnergy', type: 'number', unit: 'kJ/mol', description: 'Gibbs free energy change' }
        ],
        difficulty: 'advanced',
        educationalLevel: ['college', 'university'],
        tags: ['thermodynamics', 'enthalpy', 'entropy', 'gibbs-free-energy', 'spontaneity'],
        url: '/thermodynamics'
      },
      {
        id: 'kinetics',
        name: 'Chemical Kinetics Calculator',
        description: 'Calculate reaction rates, rate constants, and activation energy',
        category: 'kinetics',
        type: 'kinetics',
        inputs: [
          { name: 'concentrations', type: 'array', description: 'Reactant concentrations' },
          { name: 'time', type: 'number', unit: 's/min', description: 'Reaction time' },
          { name: 'temperature', type: 'number', unit: 'K', description: 'Temperature' }
        ],
        outputs: [
          { name: 'rate', type: 'number', unit: 'M/s', description: 'Reaction rate' },
          { name: 'rateConstant', type: 'number', description: 'Rate constant' },
          { name: 'halfLife', type: 'number', unit: 's', description: 'Half-life' }
        ],
        difficulty: 'advanced',
        educationalLevel: ['college', 'university'],
        tags: ['kinetics', 'reaction-rate', 'rate-constant', 'activation-energy', 'half-life'],
        url: '/kinetics'
      },
      {
        id: 'titration',
        name: 'Titration Calculator',
        description: 'Calculate titration curves, equivalence points, and pH',
        category: 'analytical',
        type: 'titration',
        inputs: [
          { name: 'analyte', type: 'object', description: 'Analyte concentration and volume' },
          { name: 'titrant', type: 'object', description: 'Titrant concentration' },
          { name: 'equivalencePoint', type: 'number', description: 'Expected equivalence point volume' }
        ],
        outputs: [
          { name: 'titrationCurve', type: 'array', description: 'pH vs volume data' },
          { name: 'equivalencePoint', type: 'number', unit: 'mL', description: 'Calculated equivalence point' },
          { name: 'unknownConcentration', type: 'number', unit: 'M', description: 'Calculated unknown concentration' }
        ],
        difficulty: 'intermediate',
        educationalLevel: ['high-school', 'college'],
        tags: ['titration', 'equivalence-point', 'ph', 'analytical-chemistry', 'volumetric-analysis'],
        url: '/virtual-lab/titration'
      },
      {
        id: 'electron-config',
        name: 'Electron Configuration Calculator',
        description: 'Generate electron configurations and orbital diagrams',
        category: 'atomic',
        type: 'electron-config',
        inputs: [
          { name: 'element', type: 'string', description: 'Element symbol or atomic number' }
        ],
        outputs: [
          { name: 'configuration', type: 'string', description: 'Electron configuration' },
          { name: 'orbitalDiagram', type: 'string', description: 'Orbital diagram' },
          { name: 'valenceElectrons', type: 'number', description: 'Number of valence electrons' }
        ],
        difficulty: 'basic',
        educationalLevel: ['high-school', 'college'],
        tags: ['electron-configuration', 'orbitals', 'quantum-numbers', 'valence-electrons'],
        url: '/electron-config'
      },
      {
        id: 'lewis-structure',
        name: 'Lewis Structure Generator',
        description: 'Generate Lewis structures and resonance forms',
        category: 'molecular',
        type: 'lewis-structure',
        inputs: [
          { name: 'molecule', type: 'string', description: 'Molecular formula or name' }
        ],
        outputs: [
          { name: 'lewisStructure', type: 'string', description: 'Lewis structure diagram' },
          { name: 'formalCharges', type: 'array', description: 'Formal charges on atoms' },
          { name: 'resonanceForms', type: 'array', description: 'Resonance structures' }
        ],
        difficulty: 'intermediate',
        educationalLevel: ['high-school', 'college'],
        tags: ['lewis-structure', 'resonance', 'formal-charge', 'bonding', 'molecular-structure'],
        url: '/lewis'
      },
      {
        id: 'vsepr',
        name: 'VSEPR Geometry Calculator',
        description: 'Predict molecular geometry using VSEPR theory',
        category: 'molecular',
        type: 'vsepr',
        inputs: [
          { name: 'centralAtom', type: 'string', description: 'Central atom symbol' },
          { name: 'bondedAtoms', type: 'array', description: 'Bonded atoms and lone pairs' }
        ],
        outputs: [
          { name: 'geometry', type: 'string', description: 'Molecular geometry' },
          { name: 'bondAngles', type: 'array', unit: 'degrees', description: 'Bond angles' },
          { name: 'polarity', type: 'string', description: 'Molecular polarity' }
        ],
        difficulty: 'intermediate',
        educationalLevel: ['high-school', 'college'],
        tags: ['vsepr', 'molecular-geometry', 'bond-angles', 'polarity', 'hybridization'],
        url: '/vsepr'
      }
    ]
  }

  private getHelpData(): HelpSearchData[] {
    return [
      {
        id: 'getting-started',
        title: 'Getting Started with VerChem',
        content: 'Learn how to use VerChem platform for chemistry calculations and learning',
        category: 'tutorial',
        tags: ['beginner', 'tutorial', 'guide', 'introduction'],
        url: '/help/getting-started'
      },
      {
        id: 'chemical-nomenclature',
        title: 'Chemical Nomenclature Guide',
        content: 'Complete guide to naming chemical compounds and writing formulas',
        category: 'reference',
        tags: ['nomenclature', 'naming', 'formulas', 'compounds', 'ionic', 'covalent'],
        url: '/help/nomenclature'
      },
      {
        id: 'periodic-table-guide',
        title: 'How to Read the Periodic Table',
        content: 'Understanding periodic trends, groups, periods, and element properties',
        category: 'reference',
        tags: ['periodic-table', 'trends', 'groups', 'periods', 'elements'],
        url: '/help/periodic-table'
      },
      {
        id: 'stoichiometry-guide',
        title: 'Stoichiometry Made Easy',
        content: 'Step-by-step guide to solving stoichiometry problems',
        category: 'tutorial',
        tags: ['stoichiometry', 'mole-conversions', 'limiting-reagents', 'yield'],
        url: '/help/stoichiometry'
      },
      {
        id: 'chemical-bonding',
        title: 'Chemical Bonding Fundamentals',
        content: 'Understanding ionic, covalent, and metallic bonding',
        category: 'concept',
        tags: ['bonding', 'ionic', 'covalent', 'metallic', 'lewis-structures'],
        url: '/help/bonding'
      },
      {
        id: 'thermodynamics-basics',
        title: 'Thermodynamics Basics',
        content: 'Introduction to enthalpy, entropy, and Gibbs free energy',
        category: 'concept',
        tags: ['thermodynamics', 'enthalpy', 'entropy', 'gibbs-free-energy', 'spontaneity'],
        url: '/help/thermodynamics'
      },
      {
        id: 'acid-base-chemistry',
        title: 'Acid-Base Chemistry',
        content: 'Understanding pH, pKa, buffers, and acid-base reactions',
        category: 'concept',
        tags: ['acids', 'bases', 'ph', 'pka', 'buffers', 'neutralization'],
        url: '/help/acid-base'
      },
      {
        id: 'oxidation-reduction',
        title: 'Oxidation-Reduction Reactions',
        content: 'Balancing redox reactions and understanding oxidation states',
        category: 'concept',
        tags: ['redox', 'oxidation', 'reduction', 'half-reactions', 'oxidation-states'],
        url: '/help/redox'
      },
      {
        id: 'organic-chemistry-basics',
        title: 'Organic Chemistry Basics',
        content: 'Introduction to organic molecules, functional groups, and reactions',
        category: 'concept',
        tags: ['organic', 'functional-groups', 'hydrocarbons', 'isomers'],
        url: '/help/organic'
      },
      {
        id: 'lab-safety',
        title: 'Laboratory Safety Guidelines',
        content: 'Essential safety rules and procedures for chemistry laboratories',
        category: 'safety',
        tags: ['safety', 'lab-procedures', 'hazards', 'ppe', 'emergency'],
        url: '/help/safety'
      }
    ]
  }

  private createIndexes() {
    // Compound index
    this.compoundIndex = new Fuse(this.compoundData, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'formula', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'cas', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    })

    // Element index
    this.elementIndex = new Fuse(this.elementData, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'symbol', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'electronConfiguration', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    })

    // Calculator index
    this.calculatorIndex = new Fuse(this.calculatorData, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'category', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    })

    // Help index
    this.helpIndex = new Fuse(this.helpData, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'tags', weight: 0.3 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true
    })
  }

  public search(query: SearchQuery): SearchResult[] {
    const { query: searchQuery, filters, options } = query
    
    if (!searchQuery.trim()) {
      return this.getFilteredResults(filters, options)
    }

    // Parse advanced query syntax
    const parsedQuery = this.parseAdvancedQuery(searchQuery)
    const effectiveFilters: SearchFilters = { ...filters }

    // Map parsed ranges onto structured filters (e.g. MW:100-200 -> molecularWeightRange)
    if (parsedQuery.ranges.length > 0) {
      parsedQuery.ranges.forEach(range => {
        const field = range.field.toLowerCase()
        if (field === 'mw' || field === 'molecularweight' || field === 'molarmass') {
          effectiveFilters.molecularWeightRange = {
            min: range.min,
            max: range.max
          }
        } else if (field === 'mp' || field === 'meltingpoint') {
          effectiveFilters.meltingPointRange = {
            min: range.min,
            max: range.max
          }
        } else if (field === 'bp' || field === 'boilingpoint') {
          effectiveFilters.boilingPointRange = {
            min: range.min,
            max: range.max
          }
        } else if (field === 'an' || field === 'atomicnumber' || field === 'z') {
          effectiveFilters.atomicNumberRange = {
            min: range.min,
            max: range.max
          }
        } else if (field === 'pka') {
          effectiveFilters.pKaRange = {
            min: range.min,
            max: range.max
          }
        } else if (field === 'pkb') {
          effectiveFilters.pKbRange = {
            min: range.min,
            max: range.max
          }
        }
      })
    }
    
    // Map field-specific filters (e.g., type:compound, category:reactions)
    if (parsedQuery.fieldFilters && parsedQuery.fieldFilters.length > 0) {
      parsedQuery.fieldFilters.forEach(filter => {
        const field = filter.field.toLowerCase()
        const value = filter.value.toLowerCase()
        
        switch (field) {
          case 'type': {
            const existing = effectiveFilters.type || []
            if (!existing.includes(value)) {
              effectiveFilters.type = [...existing, value]
            }
            break
          }
          case 'category': {
            const existing = effectiveFilters.category || []
            if (!existing.includes(value)) {
              effectiveFilters.category = [...existing, value]
            }
            break
          }
          case 'difficulty': {
            const existing = effectiveFilters.difficulty || []
            if (!existing.includes(value)) {
              effectiveFilters.difficulty = [...existing, value]
            }
            break
          }
        }
      })
    }
    
    let results: SearchResult[] = []

    // Search compounds
    if (!effectiveFilters.type || effectiveFilters.type.includes('compound')) {
      const compoundResults = this.searchCompounds(parsedQuery)
      results = results.concat(compoundResults)
    }

    // Search elements
    if (!effectiveFilters.type || effectiveFilters.type.includes('element')) {
      const elementResults = this.searchElements(parsedQuery)
      results = results.concat(elementResults)
    }

    // Search calculators
    if (!effectiveFilters.type || effectiveFilters.type.includes('calculator')) {
      const calculatorResults = this.searchCalculators(parsedQuery)
      results = results.concat(calculatorResults)
    }

    // Search help
    if (!effectiveFilters.type || effectiveFilters.type.includes('help')) {
      const helpResults = this.searchHelp(parsedQuery)
      results = results.concat(helpResults)
    }

    // Apply OR groups: each group requires at least one term match
    if (parsedQuery.orGroups && parsedQuery.orGroups.length > 0) {
      const orGroups = parsedQuery.orGroups
        .filter(group => group.length > 0)
        .map(group => group.map(term => term.toLowerCase()))

      if (orGroups.length > 0) {
        results = results.filter(result => {
          const haystack = [
            result.title,
            result.subtitle || '',
            result.description,
            result.category,
            result.tags.join(' ')
          ]
            .join(' ')
            .toLowerCase()

          // Every OR group must have at least one term present
          return orGroups.every(group =>
            group.some(term => haystack.includes(term))
          )
        })
      }
    }

    // Apply exclusion terms (NOT operator) across title/description/tags/category
    if (parsedQuery.mustExclude.length > 0) {
      const excluded = parsedQuery.mustExclude.map(term => term.toLowerCase())
      results = results.filter(result => {
        const haystack = [
          result.title,
          result.subtitle || '',
          result.description,
          result.category,
          result.tags.join(' ')
        ]
          .join(' ')
          .toLowerCase()
        return !excluded.some(term => haystack.includes(term))
      })
    }

    // Apply filters and sorting (including any ranges from the query)
    results = this.applyFilters(results, effectiveFilters)
    results = this.sortResults(results, options)

    // Apply limit and offset
    const offset = options.offset || 0
    const limit = options.limit || 20
    return results.slice(offset, offset + limit)
  }

  private parseAdvancedQuery(query: string): AdvancedQuerySyntax {
    const syntax: AdvancedQuerySyntax = {
      mustInclude: [],
      mustExclude: [],
      exactPhrases: [],
      ranges: [],
      wildcards: [],
      orGroups: [],
      fieldFilters: []
    }

    // Extract exact phrases (quoted text)
    const phraseMatches = query.match(/"([^"]+)"/g)
    if (phraseMatches) {
      syntax.exactPhrases = phraseMatches.map(match => match.slice(1, -1))
      query = query.replace(/"[^"]+"/g, '')
    }

    // Extract must exclude terms (NOT operator)
    const excludeMatches = query.match(/\bNOT\s+(\w+)/gi)
    if (excludeMatches) {
      syntax.mustExclude = excludeMatches.map(match => match.replace(/NOT\s+/i, ''))
      query = query.replace(/\bNOT\s+\w+/gi, '')
    }

    // Extract ranges (e.g., MW:100-200)
    const rangeMatches = query.match(/(\w+):(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/g)
    if (rangeMatches) {
      syntax.ranges = rangeMatches.map(match => {
        const parsed = match.match(/(\w+):(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/)
        if (!parsed) {
          return { field: '', min: undefined, max: undefined }
        }
        const [, field, min, max] = parsed
        return { field, min: parseFloat(min), max: parseFloat(max) }
      })
      query = query.replace(/(\w+):(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/g, '')
    }

    // Remaining terms: parse field filters, OR groups, and must-include terms
    const rawTerms = query.split(/\s+/).filter(term => term.trim())

    const stripParens = (term: string) =>
      term.replace(/^[()]+/, '').replace(/[()]+$/, '')

    const mustInclude: string[] = []

    let i = 0
    while (i < rawTerms.length) {
      const term = rawTerms[i]

      // Skip standalone OR tokens (handled as part of groups)
      if (term.toUpperCase() === 'OR') {
        i += 1
        continue
      }

      // Field-specific filter (e.g., type:compound, category:reactions)
      const fieldMatch = term.match(/^(\w+):(.+)$/)
      if (fieldMatch) {
        const [, field, value] = fieldMatch
        const cleanedValue = stripParens(value)
        if (cleanedValue) {
          syntax.fieldFilters.push({
            field: field.toLowerCase(),
            value: cleanedValue
          })
        }
        i += 1
        continue
      }

      // OR group: term1 OR term2 [OR term3 ...]
      if (i + 1 < rawTerms.length && rawTerms[i + 1].toUpperCase() === 'OR') {
        const group: string[] = [stripParens(term)]
        let j = i + 2

        while (j < rawTerms.length) {
          const next = rawTerms[j]
          if (next.toUpperCase() === 'OR') {
            j += 1
            continue
          }

          group.push(stripParens(next))

          if (j + 1 < rawTerms.length && rawTerms[j + 1].toUpperCase() === 'OR') {
            j += 2
          } else {
            j += 1
            break
          }
        }

        const cleanedGroup = group.filter(Boolean)
        if (cleanedGroup.length > 0) {
          syntax.orGroups.push(cleanedGroup)
        }

        i = j
        continue
      }

      // Default: must-include term
      const cleaned = stripParens(term)
      if (cleaned) {
        mustInclude.push(cleaned)
      }
      i += 1
    }

    syntax.mustInclude = mustInclude

    return syntax
  }

  private searchCompounds(
    query: AdvancedQuerySyntax
    // Future: Add filters and options for advanced filtering
  ): SearchResult[] {
    let searchQuery = query.mustInclude.join(' ')
    if (query.exactPhrases.length > 0) {
      searchQuery += ' ' + query.exactPhrases.join(' ')
    }

    const results = this.compoundIndex.search(searchQuery)
    
    return results.map(result => ({
      id: `compound-${result.item.id}`,
      type: 'compound' as const,
      title: result.item.name,
      subtitle: result.item.formula,
      description: `Molecular weight: ${result.item.molecularMass} g/mol. ${result.item.appearance || ''}`,
      category: 'Chemical Compound',
      tags: result.item.tags,
      relevance: 1 - (result.score || 0),
      data: result.item,
      url: `/compounds/${result.item.id}`,
      thumbnail: this.getCompoundThumbnail()
    }))
  }

  private searchElements(
    query: AdvancedQuerySyntax
    // Future: Add filters and options for advanced filtering
  ): SearchResult[] {
    let searchQuery = query.mustInclude.join(' ')
    if (query.exactPhrases.length > 0) {
      searchQuery += ' ' + query.exactPhrases.join(' ')
    }

    const results = this.elementIndex.search(searchQuery)
    
    return results.map(result => ({
      id: `element-${result.item.atomicNumber}`,
      type: 'element' as const,
      title: `${result.item.name} (${result.item.symbol})`,
      subtitle: `Atomic Number: ${result.item.atomicNumber}`,
      description: `Atomic mass: ${result.item.atomicMass} u. Category: ${result.item.category}`,
      category: 'Chemical Element',
      tags: result.item.tags,
      relevance: 1 - (result.score || 0),
      data: result.item,
      url: `/periodic-table?element=${result.item.atomicNumber}`,
      thumbnail: this.getElementThumbnail(result.item.symbol)
    }))
  }

  private searchCalculators(
    query: AdvancedQuerySyntax
    // Future: Add filters and options for advanced filtering
  ): SearchResult[] {
    let searchQuery = query.mustInclude.join(' ')
    if (query.exactPhrases.length > 0) {
      searchQuery += ' ' + query.exactPhrases.join(' ')
    }

    const results = this.calculatorIndex.search(searchQuery)
    
    return results.map(result => ({
      id: `calculator-${result.item.id}`,
      type: 'calculator' as const,
      title: result.item.name,
      subtitle: result.item.description,
      description: `Category: ${result.item.category}. Difficulty: ${result.item.difficulty}`,
      category: 'Calculator',
      tags: result.item.tags,
      relevance: 1 - (result.score || 0),
      data: result.item,
      url: result.item.url,
      thumbnail: this.getCalculatorThumbnail(result.item.category)
    }))
  }

  private searchHelp(
    query: AdvancedQuerySyntax
    // Future: Add filters and options for advanced filtering
  ): SearchResult[] {
    let searchQuery = query.mustInclude.join(' ')
    if (query.exactPhrases.length > 0) {
      searchQuery += ' ' + query.exactPhrases.join(' ')
    }

    const results = this.helpIndex.search(searchQuery)
    
    return results.map(result => ({
      id: `help-${result.item.id}`,
      type: 'help' as const,
      title: result.item.title,
      subtitle: result.item.content.substring(0, 100) + '...',
      description: result.item.content,
      category: 'Help & Documentation',
      tags: result.item.tags,
      relevance: 1 - (result.score || 0),
      data: result.item,
      url: result.item.url
    }))
  }

  private getFilteredResults(filters: SearchFilters, options: SearchOptions): SearchResult[] {
    let results: SearchResult[] = []

    if (!filters.type || filters.type.includes('compound')) {
      const compoundResults = this.compoundData.map(item => ({
        id: `compound-${item.id}`,
        type: 'compound' as const,
        title: item.name,
        subtitle: item.formula,
        description: `Molecular weight: ${item.molecularMass} g/mol`,
        category: 'Chemical Compound',
        tags: item.tags,
        relevance: 1,
        data: item,
        url: `/compounds/${item.id}`,
        thumbnail: this.getCompoundThumbnail()
      }))
      results = results.concat(compoundResults)
    }

    if (!filters.type || filters.type.includes('element')) {
      const elementResults = this.elementData.map(item => ({
        id: `element-${item.atomicNumber}`,
        type: 'element' as const,
        title: `${item.name} (${item.symbol})`,
        subtitle: `Atomic Number: ${item.atomicNumber}`,
        description: `Atomic mass: ${item.atomicMass} u`,
        category: 'Chemical Element',
        tags: item.tags,
        relevance: 1,
        data: item,
        url: `/periodic-table?element=${item.atomicNumber}`,
        thumbnail: this.getElementThumbnail(item.symbol)
      }))
      results = results.concat(elementResults)
    }

    if (!filters.type || filters.type.includes('calculator')) {
      const calculatorResults = this.calculatorData.map(item => ({
        id: `calculator-${item.id}`,
        type: 'calculator' as const,
        title: item.name,
        subtitle: item.description,
        description: `Category: ${item.category}`,
        category: 'Calculator',
        tags: item.tags,
        relevance: 1,
        data: item,
        url: item.url,
        thumbnail: this.getCalculatorThumbnail(item.category)
      }))
      results = results.concat(calculatorResults)
    }

    if (!filters.type || filters.type.includes('help')) {
      const helpResults = this.helpData.map(item => ({
        id: `help-${item.id}`,
        type: 'help' as const,
        title: item.title,
        subtitle: item.content.substring(0, 100) + '...',
        description: item.content,
        category: 'Help & Documentation',
        tags: item.tags,
        relevance: 1,
        data: item,
        url: item.url
      }))
      results = results.concat(helpResults)
    }

    results = this.applyFilters(results, filters)
    results = this.sortResults(results, options)

    return results
  }

  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      // Type filter
      if (filters.type && !filters.type.includes(result.type)) {
        return false
      }

      // Category filter
      if (filters.category && !filters.category.some(cat => 
        result.category.toLowerCase().includes(cat.toLowerCase())
      )) {
        return false
      }

      // Apply specific filters based on result type
      if (result.type === 'compound') {
        return this.applyCompoundFilters(result, filters)
      } else if (result.type === 'element') {
        return this.applyElementFilters(result, filters)
      } else if (result.type === 'calculator') {
        return this.applyCalculatorFilters(result, filters)
      }

      return true
    })
  }

  private applyCompoundFilters(result: SearchResult, filters: SearchFilters): boolean {
    const data = result.data as CompoundSearchData

    // Molecular weight range
    if (filters.molecularWeightRange) {
      const { min, max } = filters.molecularWeightRange
      if ((min && data.molecularMass < min) || (max && data.molecularMass > max)) {
        return false
      }
    }

    // Melting point range
    if (filters.meltingPointRange && data.meltingPoint) {
      const { min, max } = filters.meltingPointRange
      if ((min && data.meltingPoint < min) || (max && data.meltingPoint > max)) {
        return false
      }
    }

    // Boiling point range
    if (filters.boilingPointRange && data.boilingPoint) {
      const { min, max } = filters.boilingPointRange
      if ((min && data.boilingPoint < min) || (max && data.boilingPoint > max)) {
        return false
      }
    }

    // pKa range
    if (filters.pKaRange && typeof data.pKa === 'number') {
      const { min, max } = filters.pKaRange
      if ((min && data.pKa < min) || (max && data.pKa > max)) {
        return false
      }
    }

    // pKb range
    if (filters.pKbRange && typeof data.pKb === 'number') {
      const { min, max } = filters.pKbRange
      if ((min && data.pKb < min) || (max && data.pKb > max)) {
        return false
      }
    }

    // Safety filters
    if (filters.safety && data.hazards) {
      const hasMatchingHazard = filters.safety.some(safety => 
        data.hazards!.includes(safety.toLowerCase())
      )
      if (!hasMatchingHazard) return false
    }

    // GHS codes
    if (filters.ghsCodes && data.ghsCodes) {
      const hasMatchingCode = filters.ghsCodes.some(code => 
        data.ghsCodes!.includes(code)
      )
      if (!hasMatchingCode) return false
    }

    // Applications
    if (filters.applications && data.uses) {
      const hasMatchingApplication = filters.applications.some(app => 
        data.uses!.some(use => use.toLowerCase().includes(app.toLowerCase()))
      )
      if (!hasMatchingApplication) return false
    }

    return true
  }

  private applyElementFilters(result: SearchResult, filters: SearchFilters): boolean {
    const data = result.data as ElementSearchData

    // Atomic number range
    if (filters.atomicNumberRange) {
      const { min, max } = filters.atomicNumberRange
      if ((min && data.atomicNumber < min) || (max && data.atomicNumber > max)) {
        return false
      }
    }

    // Group filter
    if (filters.group && data.group) {
      if (!filters.group.includes(data.group)) {
        return false
      }
    }

    // Period filter
    if (filters.period && !filters.period.includes(data.period)) {
      return false
    }

    // Block filter
    if (filters.block && !filters.block.includes(data.block)) {
      return false
    }

    // Element category filter
    if (filters.elementCategory && !filters.elementCategory.includes(data.category)) {
      return false
    }

    return true
  }

  private applyCalculatorFilters(result: SearchResult, filters: SearchFilters): boolean {
    const data = result.data as CalculatorSearchData

    // Difficulty filter
    if (filters.difficulty && !filters.difficulty.includes(data.difficulty)) {
      return false
    }

    return true
  }

  private sortResults(results: SearchResult[], options: SearchOptions): SearchResult[] {
    const sortBy = options.sortBy || 'relevance'
    const sortOrder = options.sortOrder || 'desc'

    return results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = b.relevance - a.relevance
          break
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'molecularWeight':
          if (a.type === 'compound' && b.type === 'compound') {
            const aWeight = (a.data as CompoundSearchData).molecularMass
            const bWeight = (b.data as CompoundSearchData).molecularMass
            comparison = aWeight - bWeight
          }
          break
        case 'atomicNumber':
          if (a.type === 'element' && b.type === 'element') {
            const aNumber = (a.data as ElementSearchData).atomicNumber
            const bNumber = (b.data as ElementSearchData).atomicNumber
            comparison = aNumber - bNumber
          }
          break
        default:
          comparison = b.relevance - a.relevance
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private getCompoundThumbnail(): string {
    // Return a default compound icon
    // Future enhancement: Pass formula parameter to generate compound-specific thumbnails
    return '/icons/compound.svg'
  }

  private getElementThumbnail(symbol: string): string {
    // Return element-specific thumbnail
    return `/icons/elements/${symbol.toLowerCase()}.svg`
  }

  private getCalculatorThumbnail(category: string): string {
    // Return calculator category-specific thumbnail
    return `/icons/calculators/${category}.svg`
  }

  // Public methods for getting suggestions
  public getSuggestions(query: string, type?: string): string[] {
    if (!query.trim()) return []

    const suggestions: string[] = []
    const limit = 10

    // Compound suggestions
    if (!type || type === 'compound') {
      const compoundSuggestions = this.compoundData
        .filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.formula.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)
        .map(item => item.name)
      suggestions.push(...compoundSuggestions)
    }

    // Element suggestions
    if (!type || type === 'element') {
      const elementSuggestions = this.elementData
        .filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.symbol.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)
        .map(item => `${item.name} (${item.symbol})`)
      suggestions.push(...elementSuggestions)
    }

    // Calculator suggestions
    if (!type || type === 'calculator') {
      const calculatorSuggestions = this.calculatorData
        .filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)
        .map(item => item.name)
      suggestions.push(...calculatorSuggestions)
    }

    return [...new Set(suggestions)].slice(0, limit)
  }

  // Get popular searches
  public getPopularSearches(): string[] {
    return [
      'water',
      'sodium chloride',
      'hydrochloric acid',
      'molecular weight',
      'stoichiometry',
      'periodic table',
      'electron configuration',
      'gas laws',
      'thermodynamics',
      'titration'
    ]
  }

  // Get recent searches (would be implemented with local storage)
  public getRecentSearches(): string[] {
    // This would typically come from local storage
    return []
  }
}
