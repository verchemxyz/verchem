// VerChem - Electrochemistry Calculator
// Redox reactions, cell potential, Nernst equation, and electrolysis

import { FARADAY_CONSTANT, GAS_CONSTANT, STP } from '@/lib/constants/physical-constants'

export interface Species {
  formula: string
  coefficient: number
}

/**
 * Half-Reaction
 */
export interface HalfReaction {
  reactants: string
  products: string
  electrons: number // Number of electrons transferred
  type: 'oxidation' | 'reduction'
  E0?: number // Standard electrode potential (V)
}

/**
 * Electrochemical Cell
 */
export interface ElectrochemicalCell {
  anode: HalfReaction // Oxidation (loses electrons)
  cathode: HalfReaction // Reduction (gains electrons)
  cellPotential: number // E°cell (V)
  spontaneous: boolean // True if E°cell > 0
  balancedEquation: string
  nernstPotential?: number // E (actual cell potential at non-standard conditions)
}

/**
 * Nernst Equation Result
 */
export interface NernstResult {
  E0: number // Standard cell potential (V)
  E: number // Actual cell potential (V)
  n: number // Electrons transferred
  Q: number // Reaction quotient
  temperature: number // Temperature (K)
  steps: string[]
}

/**
 * Electrolysis Result
 */
export interface ElectrolysisResult {
  charge: number // Total charge (C)
  moles: number // Moles of substance
  mass: number // Mass (g)
  volume?: number // Volume at STP (L, for gases)
  time: number // Time (s)
  current: number // Current (A)
  steps: string[]
}

/**
 * Constants
 */
// FARADAY_CONSTANT and GAS_CONSTANT imported from physical-constants.ts (CODATA 2018)
export const ROOM_TEMPERATURE = 298.15 // K (25°C) - Standard room temperature

/**
 * Standard Reduction Potentials (V)
 * More positive = stronger oxidizing agent (prefers to be reduced)
 * More negative = stronger reducing agent (prefers to be oxidized)
 */
export const STANDARD_REDUCTION_POTENTIALS: Record<
  string,
  { reaction: string; E0: number }
> = {
  // Strong oxidizers (positive E°)
  'F2/F-': { reaction: 'F₂ + 2e⁻ → 2F⁻', E0: 2.87 },
  'Cl2/Cl-': { reaction: 'Cl₂ + 2e⁻ → 2Cl⁻', E0: 1.36 },
  'Br2/Br-': { reaction: 'Br₂ + 2e⁻ → 2Br⁻', E0: 1.07 },
  'Ag+/Ag': { reaction: 'Ag⁺ + e⁻ → Ag', E0: 0.8 },
  'Cu2+/Cu': { reaction: 'Cu²⁺ + 2e⁻ → Cu', E0: 0.34 },
  'H+/H2': { reaction: '2H⁺ + 2e⁻ → H₂', E0: 0.0 }, // Reference

  // Weak oxidizers / Strong reducers (negative E°)
  'Pb2+/Pb': { reaction: 'Pb²⁺ + 2e⁻ → Pb', E0: -0.13 },
  'Ni2+/Ni': { reaction: 'Ni²⁺ + 2e⁻ → Ni', E0: -0.25 },
  'Fe2+/Fe': { reaction: 'Fe²⁺ + 2e⁻ → Fe', E0: -0.44 },
  'Zn2+/Zn': { reaction: 'Zn²⁺ + 2e⁻ → Zn', E0: -0.76 },
  'Al3+/Al': { reaction: 'Al³⁺ + 3e⁻ → Al', E0: -1.66 },
  'Mg2+/Mg': { reaction: 'Mg²⁺ + 2e⁻ → Mg', E0: -2.37 },
  'Na+/Na': { reaction: 'Na⁺ + e⁻ → Na', E0: -2.71 },
  'Li+/Li': { reaction: 'Li⁺ + e⁻ → Li', E0: -3.04 },

  // Additional common half-reactions
  'MnO4-/Mn2+': {
    reaction: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O',
    E0: 1.51,
  },
  'Cr2O7 2-/Cr3+': {
    reaction: 'Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O',
    E0: 1.33,
  },
  'O2/H2O': { reaction: 'O₂ + 4H⁺ + 4e⁻ → 2H₂O', E0: 1.23 },
  'I2/I-': { reaction: 'I₂ + 2e⁻ → 2I⁻', E0: 0.54 },
  'Fe3+/Fe2+': { reaction: 'Fe³⁺ + e⁻ → Fe²⁺', E0: 0.77 },
  'Sn4+/Sn2+': { reaction: 'Sn⁴⁺ + 2e⁻ → Sn²⁺', E0: 0.15 },
}

/**
 * Calculate cell potential (E°cell)
 * E°cell = E°cathode - E°anode
 */
export function calculateCellPotential(
  cathodePotential: number,
  anodePotential: number,
  electronsTransferred: number = 2
): {
  cellPotential: number
  spontaneous: boolean
  deltaG: number
  electrons: number
} {
  const cellPotential = cathodePotential - anodePotential

  // ΔG° = -nFE°
  // Spontaneous if ΔG < 0, which means E° > 0
  const spontaneous = cellPotential > 0

  // Calculate free energy using the provided electron count (n)
  const deltaG = -electronsTransferred * FARADAY_CONSTANT * cellPotential // J/mol

  return {
    cellPotential,
    spontaneous,
    deltaG,
    electrons: electronsTransferred,
  }
}

/**
 * Nernst Equation
 * E = E° - (RT/nF) × ln(Q)
 * E = E° - (0.0592/n) × log₁₀(Q) at 25°C
 */
export function calculateNernstEquation(
  E0: number, // Standard cell potential (V)
  n: number, // Electrons transferred
  Q: number, // Reaction quotient
  temperature: number = ROOM_TEMPERATURE
): NernstResult {
  const steps: string[] = []
  steps.push('Calculating cell potential using Nernst equation')
  steps.push(`E° = ${E0.toFixed(3)} V`)
  steps.push(`n = ${n} electrons`)
  steps.push(`Q = ${Q}`)
  steps.push(`T = ${temperature} K`)

  // E = E° - (RT/nF) × ln(Q)
  const RT_over_nF = (GAS_CONSTANT.SI * temperature) / (n * FARADAY_CONSTANT)
  const correction = RT_over_nF * Math.log(Q)
  const E = E0 - correction

  steps.push(
    `E = E° - (RT/nF)ln(Q) = ${E0.toFixed(3)} - ${correction.toFixed(4)} = ${E.toFixed(3)} V`
  )

  // Alternative: Simplified form at 25°C
  if (Math.abs(temperature - 298.15) < 0.1) {
    const simplifiedCorrection = (0.0592 / n) * Math.log10(Q)
    steps.push(
      `At 25°C: E = E° - (0.0592/n)log₁₀(Q) = ${E0.toFixed(3)} - ${simplifiedCorrection.toFixed(4)} = ${E.toFixed(3)} V`
    )
  }

  return {
    E0,
    E,
    n,
    Q,
    temperature,
    steps,
  }
}

/**
 * Calculate electrolysis quantities using Faraday's Laws
 * Q = n × F (charge = moles of electrons × Faraday constant)
 * Q = I × t (charge = current × time)
 */
export function calculateElectrolysis(
  current: number, // Current (A)
  time: number, // Time (s)
  n: number, // Electrons per mole of substance
  molarMass: number, // Molar mass (g/mol)
  isGas: boolean = false
): ElectrolysisResult {
  const steps: string[] = []
  steps.push('Calculating electrolysis quantities')
  steps.push(`Current (I) = ${current} A`)
  steps.push(`Time (t) = ${time} s`)
  steps.push(`Electrons per mole (n) = ${n}`)
  steps.push(`Molar mass (M) = ${molarMass} g/mol`)

  // Calculate total charge
  const charge = current * time // C = A × s
  steps.push(`Total charge: Q = I × t = ${current} × ${time} = ${charge} C`)

  // Calculate moles of electrons
  const molesElectrons = charge / FARADAY_CONSTANT
  steps.push(
    `Moles of electrons: n_e⁻ = Q / F = ${charge} / ${FARADAY_CONSTANT} = ${molesElectrons.toFixed(6)} mol`
  )

  // Calculate moles of substance
  const moles = molesElectrons / n
  steps.push(
    `Moles of substance: n = n_e⁻ / ${n} = ${molesElectrons.toFixed(6)} / ${n} = ${moles.toFixed(6)} mol`
  )

  // Calculate mass
  const mass = moles * molarMass
  steps.push(`Mass: m = n × M = ${moles.toFixed(6)} × ${molarMass} = ${mass.toFixed(4)} g`)

  // Calculate volume at STP for gases
  let volume: number | undefined
  if (isGas) {
    volume = moles * STP.molarVolume // L at STP (CODATA 2018: 22.413969545 L/mol)
    steps.push(`Volume at STP: V = n × ${STP.molarVolume.toFixed(6)} = ${moles.toFixed(6)} × ${STP.molarVolume.toFixed(6)} = ${volume.toFixed(4)} L`)
  }

  return {
    charge,
    moles,
    mass,
    volume,
    time,
    current,
    steps,
  }
}

/**
 * Balance redox equation (simple)
 * Note: This is a simplified version for common cases
 */
export function balanceRedoxEquation(
  oxidation: string,
  reduction: string,
  options: { acidic?: boolean } = {}
): {
  balanced: string
  steps: string[]
  reactants: Species[]
  products: Species[]
  electronCount: number
} {
  const acidic = options.acidic ?? true
  const steps: string[] = []
  steps.push('=== Balancing Redox Reaction ===')
  steps.push(`Oxidation half-reaction: ${oxidation}`)
  steps.push(`Reduction half-reaction: ${reduction}`)

  const oxidationHalf = parseHalfReaction(oxidation)
  const reductionHalf = parseHalfReaction(reduction)

  const electronLCM = lcm(oxidationHalf.electrons, reductionHalf.electrons)
  const oxidationFactor = electronLCM / oxidationHalf.electrons
  const reductionFactor = electronLCM / reductionHalf.electrons

  steps.push(
    `Electrons transferred: oxidation (${oxidationHalf.electrons}), reduction (${reductionHalf.electrons})`
  )
  steps.push(`Scale oxidation ×${oxidationFactor}, reduction ×${reductionFactor}`)

  const scaledOxidation = scaleHalfReaction(oxidationHalf, oxidationFactor)
  const scaledReduction = scaleHalfReaction(reductionHalf, reductionFactor)

  const combined = combineHalfReactions(scaledOxidation, scaledReduction)
  let reactants = combined.reactants
  let products = combined.products

  if (!acidic) {
    const converted = convertToBasicMedium(reactants, products)
    reactants = converted.reactants
    products = converted.products
    steps.push('Converted to basic medium by neutralising H⁺ with OH⁻ to form H₂O')
  }

  const balancedEquation = formatEquation(reactants, products)
  steps.push('Final balanced equation:')
  steps.push(balancedEquation)

  return {
    balanced: balancedEquation,
    steps,
    reactants,
    products,
    electronCount: electronLCM,
  }
}

/**
 * Identify oxidation states
 * Simple algorithm for common elements
 */
export function identifyOxidationState(
  element: string,
  compound: string
): number | null {
  // Simple rules
  if (element === 'O' && compound !== 'O2') return -2
  if (element === 'H' && compound !== 'H2') return +1
  if (element === 'F') return -1
  if (element === 'Cl' && compound !== 'Cl2') return -1

  // Group 1 elements
  if (['Li', 'Na', 'K'].includes(element)) return +1

  // Group 2 elements
  if (['Mg', 'Ca', 'Ba'].includes(element)) return +2

  // Aluminum
  if (element === 'Al') return +3

  return null
}

/**
 * Determine if half-reaction is oxidation or reduction
 */
export function determineHalfReactionType(
  leftSide: string,
  rightSide: string
): 'oxidation' | 'reduction' {
  // If electrons are on the right side → oxidation (loses electrons)
  // If electrons are on the left side → reduction (gains electrons)

  if (rightSide.includes('e⁻') || rightSide.includes('e-')) {
    return 'oxidation'
  } else {
    return 'reduction'
  }
}

/**
 * Example electrochemical cells
 */
export const EXAMPLE_CELLS = [
  {
    name: 'Daniell Cell',
    anode: 'Zn²⁺ + 2e⁻ → Zn',
    cathode: 'Cu²⁺ + 2e⁻ → Cu',
    anodeE0: -0.76,
    cathodeE0: 0.34,
    cellE0: 1.1,
    description: 'Classic zinc-copper cell',
  },
  {
    name: 'Lead-Acid Battery',
    anode: 'Pb + SO₄²⁻ → PbSO₄ + 2e⁻',
    cathode: 'PbO₂ + 4H⁺ + SO₄²⁻ + 2e⁻ → PbSO₄ + 2H₂O',
    anodeE0: -0.35,
    cathodeE0: 1.69,
    cellE0: 2.04,
    description: 'Rechargeable battery used in cars',
  },
  {
    name: 'Hydrogen-Oxygen Fuel Cell',
    anode: '2H₂ → 4H⁺ + 4e⁻',
    cathode: 'O₂ + 4H⁺ + 4e⁻ → 2H₂O',
    anodeE0: 0.0,
    cathodeE0: 1.23,
    cellE0: 1.23,
    description: 'Clean energy fuel cell',
  },
]

/**
 * Get standard reduction potential
 */
export function getStandardPotential(halfCell: string): number | null {
  return STANDARD_REDUCTION_POTENTIALS[halfCell]?.E0 || null
}

/**
 * Get all half-reactions sorted by potential
 */
export function getAllHalfReactions(): Array<{
  name: string
  reaction: string
  E0: number
}> {
  return Object.entries(STANDARD_REDUCTION_POTENTIALS)
    .map(([name, data]) => ({
      name,
      reaction: data.reaction,
      E0: data.E0,
    }))
    .sort((a, b) => b.E0 - a.E0) // Sort by E° (highest first)
}

function parseHalfReaction(reaction: string): ParsedHalfReaction {
  const parts = reaction.split(/->|→/)
  if (parts.length !== 2) {
    throw new Error('Half-reaction must contain a single arrow (→ or ->)')
  }

  const reactants = parseSpeciesList(parts[0])
  const products = parseSpeciesList(parts[1])

  const electronsOnReactant = removeElectrons(reactants)
  const electronsOnProduct = removeElectrons(products)

  if (!electronsOnReactant && !electronsOnProduct) {
    throw new Error('Half-reactions must explicitly include electrons (e⁻)')
  }

  return {
    reactants,
    products,
    electrons: electronsOnProduct || electronsOnReactant,
    type: electronsOnProduct ? 'oxidation' : 'reduction',
  }
}

interface ParsedHalfReaction {
  reactants: Species[]
  products: Species[]
  electrons: number
  type: 'oxidation' | 'reduction'
}

function parseSpeciesList(side: string): Species[] {
  return side
    .split('+')
    .map(token => token.trim())
    .filter(Boolean)
    .map(entry => {
      const match = entry.match(/^(\d+)\s*(.+)$/)
      if (match) {
        return { coefficient: parseInt(match[1], 10), formula: normalizeSpecies(match[2]) }
      }
      return { coefficient: 1, formula: normalizeSpecies(entry) }
    })
}

function normalizeSpecies(formula: string): string {
  return formula
    .replace(/\s+/g, '')
    .replace(/[⁻−–]/g, '-')
    .replace(/⁺/g, '+')
}

function removeElectrons(list: Species[]): number {
  const index = list.findIndex(species => isElectron(species.formula))
  if (index === -1) {
    return 0
  }
  const electrons = list[index].coefficient
  list.splice(index, 1)
  return electrons
}

function isElectron(formula: string): boolean {
  const normalized = formula.toLowerCase()
  return normalized === 'e-' || normalized === 'e⁻' || normalized === 'e'
}

function scaleHalfReaction(half: ParsedHalfReaction, factor: number): ParsedHalfReaction {
  const scaleList = (list: Species[]) =>
    list.map(species => ({ formula: species.formula, coefficient: species.coefficient * factor }))

  return {
    reactants: scaleList(half.reactants),
    products: scaleList(half.products),
    electrons: half.electrons * factor,
    type: half.type,
  }
}

function combineHalfReactions(
  oxidation: ParsedHalfReaction,
  reduction: ParsedHalfReaction
): { reactants: Species[]; products: Species[] } {
  const net = new Map<string, number>()
  const order: string[] = []

  const accumulate = (list: Species[], sign: number) => {
    list.forEach(species => {
      if (!order.includes(species.formula)) {
        order.push(species.formula)
      }
      net.set(species.formula, (net.get(species.formula) ?? 0) + sign * species.coefficient)
    })
  }

  accumulate(oxidation.reactants, -1)
  accumulate(oxidation.products, 1)
  accumulate(reduction.reactants, -1)
  accumulate(reduction.products, 1)

  const reactants: Species[] = []
  const products: Species[] = []

  order.forEach(formula => {
    const value = net.get(formula) ?? 0
    if (value > 0) {
      products.push({ formula, coefficient: value })
    } else if (value < 0) {
      reactants.push({ formula, coefficient: Math.abs(value) })
    }
  })

  return {
    reactants: consolidateSpecies(reactants),
    products: consolidateSpecies(products),
  }
}

function consolidateSpecies(list: Species[]): Species[] {
  const map = new Map<string, number>()
  list.forEach(species => {
    map.set(species.formula, (map.get(species.formula) ?? 0) + species.coefficient)
  })
  return Array.from(map.entries())
    .filter(([, coefficient]) => coefficient !== 0)
    .map(([formula, coefficient]) => ({ formula, coefficient }))
}

function convertToBasicMedium(reactants: Species[], products: Species[]): { reactants: Species[]; products: Species[] } {
  const clone = (list: Species[]): Species[] => list.map(item => ({ ...item }))
  const r = clone(reactants)
  const p = clone(products)

  neutralizeHPlus(r, p)
  neutralizeHPlus(p, r)
  cancelCommonSpecies(r, p)

  return {
    reactants: consolidateSpecies(r),
    products: consolidateSpecies(p),
  }
}

function neutralizeHPlus(listWithH: Species[], opposite: Species[]): void {
  const index = listWithH.findIndex(species => species.formula === 'H+')
  if (index === -1) return
  const amount = listWithH[index].coefficient
  listWithH.splice(index, 1)
  addSpecies(listWithH, 'H2O', amount)
  addSpecies(opposite, 'OH-', amount)
  cancelCommonSpecies(listWithH, opposite)
}

function addSpecies(list: Species[], formula: string, amount: number): void {
  if (amount === 0) return
  const index = list.findIndex(species => species.formula === formula)
  if (index === -1) {
    list.push({ formula, coefficient: amount })
  } else {
    list[index].coefficient += amount
  }
}

function cancelCommonSpecies(reactants: Species[], products: Species[]): void {
  reactants.forEach(reactant => {
    const match = products.find(species => species.formula === reactant.formula)
    if (!match) return
    const min = Math.min(reactant.coefficient, match.coefficient)
    reactant.coefficient -= min
    match.coefficient -= min
  })

  removeZeroCoefficients(reactants)
  removeZeroCoefficients(products)
}

function removeZeroCoefficients(list: Species[]): void {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].coefficient === 0) {
      list.splice(i, 1)
    }
  }
}

function formatEquation(reactants: Species[], products: Species[]): string {
  const formatSide = (side: Species[]) =>
    side
      .map(species => {
        const coeff = species.coefficient === 1 ? '' : species.coefficient.toString()
        return `${coeff}${species.formula}`
      })
      .join(' + ')

  return `${formatSide(reactants)} → ${formatSide(products)}`
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs((a * b) / gcd(a, b))
}
