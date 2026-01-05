// VerChem - Thermodynamics Calculator
// Enthalpy, Entropy, Gibbs Free Energy, and Equilibrium

/**
 * Thermodynamic Data
 */
export interface ThermodynamicData {
  compound: string
  formula: string
  deltaHf: number // Standard enthalpy of formation (kJ/mol)
  deltaGf: number // Standard Gibbs free energy of formation (kJ/mol)
  S: number // Standard entropy (J/(mol·K))
  state: 'solid' | 'liquid' | 'gas' | 'aqueous'
}

/**
 * Parse formula with state notation (e.g., "H2O(g)", "CO2(g)", "H2O(l)")
 */
function parseFormulaWithState(
  formulaWithState: string
): { formula: string; state?: ThermodynamicData['state'] } {
  const compact = formulaWithState.replace(/\s+/g, '')
  const match = compact.match(/^(.+?)\((aq|s|l|g|a)\)$/i)
  if (match) {
    const stateMap: Record<string, 'solid' | 'liquid' | 'gas' | 'aqueous'> = {
      s: 'solid',
      l: 'liquid',
      g: 'gas',
      a: 'aqueous',
      aq: 'aqueous',
    }
    const stateKey = match[2].toLowerCase()
    return {
      formula: match[1],
      state: stateMap[stateKey],
    }
  }
  return { formula: compact }
}

/**
 * Thermodynamic Calculation Result
 */
export interface ThermodynamicResult {
  deltaH: number // Enthalpy change (kJ/mol)
  deltaS: number // Entropy change (J/(mol·K))
  deltaG: number // Gibbs free energy change (kJ/mol)
  K?: number // Equilibrium constant
  spontaneous: boolean
  temperature: number // K
  steps: string[]
}

/**
 * Constants
 */
export const GAS_CONSTANT = 8.314 // J/(mol·K)
export const STANDARD_TEMPERATURE = 298.15 // K (25°C)

/**
 * Standard Thermodynamic Data for Common Compounds
 */
export const THERMODYNAMIC_DATA: ThermodynamicData[] = [
  // Elements (reference state = 0)
  { compound: 'Hydrogen gas', formula: 'H2', deltaHf: 0, deltaGf: 0, S: 130.7, state: 'gas' },
  { compound: 'Oxygen gas', formula: 'O2', deltaHf: 0, deltaGf: 0, S: 205.2, state: 'gas' },
  { compound: 'Nitrogen gas', formula: 'N2', deltaHf: 0, deltaGf: 0, S: 191.6, state: 'gas' },
  { compound: 'Carbon (graphite)', formula: 'C', deltaHf: 0, deltaGf: 0, S: 5.7, state: 'solid' },

  // Water
  { compound: 'Water (liquid)', formula: 'H2O', deltaHf: -285.8, deltaGf: -237.1, S: 70.0, state: 'liquid' },
  { compound: 'Water (gas)', formula: 'H2O', deltaHf: -241.8, deltaGf: -228.6, S: 188.8, state: 'gas' },

  // Carbon compounds
  { compound: 'Carbon dioxide', formula: 'CO2', deltaHf: -393.5, deltaGf: -394.4, S: 213.8, state: 'gas' },
  { compound: 'Carbon monoxide', formula: 'CO', deltaHf: -110.5, deltaGf: -137.2, S: 197.7, state: 'gas' },
  { compound: 'Methane', formula: 'CH4', deltaHf: -74.6, deltaGf: -50.5, S: 186.3, state: 'gas' },
  { compound: 'Ethane', formula: 'C2H6', deltaHf: -84.0, deltaGf: -32.0, S: 229.2, state: 'gas' },
  { compound: 'Propane', formula: 'C3H8', deltaHf: -103.8, deltaGf: -23.4, S: 270.3, state: 'gas' },
  { compound: 'Ethanol', formula: 'C2H5OH', deltaHf: -277.6, deltaGf: -174.8, S: 160.7, state: 'liquid' },
  { compound: 'Glucose', formula: 'C6H12O6', deltaHf: -1273.3, deltaGf: -910.4, S: 212.1, state: 'solid' },

  // Nitrogen compounds
  { compound: 'Ammonia', formula: 'NH3', deltaHf: -45.9, deltaGf: -16.4, S: 192.8, state: 'gas' },
  { compound: 'Nitric oxide', formula: 'NO', deltaHf: 91.3, deltaGf: 87.6, S: 210.8, state: 'gas' },
  { compound: 'Nitrogen dioxide', formula: 'NO2', deltaHf: 33.2, deltaGf: 51.3, S: 240.1, state: 'gas' },

  // Sulfur compounds
  { compound: 'Sulfur dioxide', formula: 'SO2', deltaHf: -296.8, deltaGf: -300.1, S: 248.2, state: 'gas' },
  { compound: 'Sulfur trioxide', formula: 'SO3', deltaHf: -395.7, deltaGf: -371.1, S: 256.8, state: 'gas' },
  { compound: 'Hydrogen sulfide', formula: 'H2S', deltaHf: -20.6, deltaGf: -33.4, S: 205.8, state: 'gas' },

  // Acids and bases
  { compound: 'Hydrochloric acid (aq)', formula: 'HCl', deltaHf: -167.2, deltaGf: -131.2, S: 56.5, state: 'aqueous' },
  { compound: 'Sulfuric acid (aq)', formula: 'H2SO4', deltaHf: -909.3, deltaGf: -744.5, S: 20.1, state: 'aqueous' },
  { compound: 'Nitric acid (aq)', formula: 'HNO3', deltaHf: -207.4, deltaGf: -111.3, S: 146.4, state: 'aqueous' },

  // Salts
  { compound: 'Sodium chloride', formula: 'NaCl', deltaHf: -411.2, deltaGf: -384.1, S: 72.1, state: 'solid' },
  { compound: 'Calcium carbonate', formula: 'CaCO3', deltaHf: -1207.6, deltaGf: -1129.1, S: 91.7, state: 'solid' },
  { compound: 'Calcium oxide', formula: 'CaO', deltaHf: -634.9, deltaGf: -603.3, S: 38.1, state: 'solid' },
  { compound: 'Sodium hydroxide', formula: 'NaOH', deltaHf: -425.6, deltaGf: -379.5, S: 64.5, state: 'solid' },
  { compound: 'Potassium nitrate', formula: 'KNO3', deltaHf: -494.6, deltaGf: -394.7, S: 133.1, state: 'solid' },
  { compound: 'Ammonium chloride', formula: 'NH4Cl', deltaHf: -314.4, deltaGf: -202.9, S: 94.6, state: 'solid' },
  { compound: 'Sodium bicarbonate', formula: 'NaHCO3', deltaHf: -947.7, deltaGf: -851.7, S: 102.1, state: 'solid' },
  { compound: 'Sodium carbonate', formula: 'Na2CO3', deltaHf: -1130.7, deltaGf: -1046.8, S: 135.0, state: 'solid' },
  { compound: 'Calcium hydroxide', formula: 'Ca(OH)2', deltaHf: -986.2, deltaGf: -897.5, S: 83.4, state: 'solid' },
  { compound: 'Hydrogen peroxide (liquid)', formula: 'H2O2', deltaHf: -187.8, deltaGf: -120.4, S: 109.6, state: 'liquid' },
  { compound: 'Methanol', formula: 'CH3OH', deltaHf: -238.7, deltaGf: -166.2, S: 126.8, state: 'liquid' },
  { compound: 'Ethanol (gas)', formula: 'C2H5OH', deltaHf: -235.3, deltaGf: -168.5, S: 282.7, state: 'gas' },
  { compound: 'Iron(III) oxide', formula: 'Fe2O3', deltaHf: -824.2, deltaGf: -742.2, S: 87.4, state: 'solid' },
  { compound: 'Aluminum oxide', formula: 'Al2O3', deltaHf: -1675.7, deltaGf: -1582.3, S: 50.9, state: 'solid' },
  { compound: 'Copper(II) oxide', formula: 'CuO', deltaHf: -155.2, deltaGf: -129.7, S: 42.6, state: 'solid' },
  { compound: 'Copper(II) sulfate', formula: 'CuSO4', deltaHf: -769.9, deltaGf: -662.7, S: 109.6, state: 'solid' },
  { compound: 'Hydrogen chloride (g)', formula: 'HCl', deltaHf: -92.3, deltaGf: -95.3, S: 186.7, state: 'gas' },
  { compound: 'Ammonium nitrate', formula: 'NH4NO3', deltaHf: -365.6, deltaGf: -183.9, S: 151.1, state: 'solid' },
]

const DEFAULT_STATE_PRIORITY: ThermodynamicData['state'][] = ['liquid', 'solid', 'gas', 'aqueous']

function resolveThermodynamicData(
  formula: string,
  state?: ThermodynamicData['state']
): ThermodynamicData | null {
  const matches = THERMODYNAMIC_DATA.filter(entry => entry.formula === formula)
  if (matches.length === 0) return null

  if (state) {
    return matches.find(entry => entry.state === state) ?? null
  }

  if (matches.length === 1) return matches[0]

  for (const candidateState of DEFAULT_STATE_PRIORITY) {
    const candidate = matches.find(entry => entry.state === candidateState)
    if (candidate) return candidate
  }

  return matches[0]
}

/**
 * Calculate ΔH°rxn (Enthalpy of Reaction)
 * ΔH°rxn = Σ(ΔH°f products) - Σ(ΔH°f reactants)
 */
export function calculateDeltaH(
  products: { formula: string; coefficient: number }[],
  reactants: { formula: string; coefficient: number }[]
): { deltaH: number; steps: string[] } | null {
  const steps: string[] = []
  steps.push('Calculating ΔH°rxn using Hess\'s Law')
  steps.push('ΔH°rxn = Σ(ΔH°f products) - Σ(ΔH°f reactants)')

  let productsSum = 0
  let reactantsSum = 0

  // Products
  steps.push('\nProducts:')
  for (const product of products) {
    const parsed = parseFormulaWithState(product.formula)
    const data = resolveThermodynamicData(parsed.formula, parsed.state)

    if (!data) {
      steps.push(`❌ Data not found for ${product.formula}`)
      return null
    }
    const contribution = data.deltaHf * product.coefficient
    productsSum += contribution
    steps.push(`  ${product.coefficient} mol × ${data.deltaHf} kJ/mol [${data.state}] = ${contribution.toFixed(2)} kJ`)
  }
  steps.push(`Products total: ${productsSum.toFixed(2)} kJ`)

  // Reactants
  steps.push('\nReactants:')
  for (const reactant of reactants) {
    const parsed = parseFormulaWithState(reactant.formula)
    const data = resolveThermodynamicData(parsed.formula, parsed.state)

    if (!data) {
      steps.push(`❌ Data not found for ${reactant.formula}`)
      return null
    }
    const contribution = data.deltaHf * reactant.coefficient
    reactantsSum += contribution
    steps.push(`  ${reactant.coefficient} mol × ${data.deltaHf} kJ/mol [${data.state}] = ${contribution.toFixed(2)} kJ`)
  }
  steps.push(`Reactants total: ${reactantsSum.toFixed(2)} kJ`)

  const deltaH = productsSum - reactantsSum
  steps.push(`\nΔH°rxn = ${productsSum.toFixed(2)} - (${reactantsSum.toFixed(2)}) = ${deltaH.toFixed(2)} kJ`)

  if (deltaH < 0) {
    steps.push('✓ Exothermic reaction (releases heat)')
  } else if (deltaH > 0) {
    steps.push('✓ Endothermic reaction (absorbs heat)')
  } else {
    steps.push('✓ Thermoneutral reaction')
  }

  return { deltaH, steps }
}

/**
 * Calculate ΔS°rxn (Entropy of Reaction)
 * ΔS°rxn = Σ(S° products) - Σ(S° reactants)
 */
export function calculateDeltaS(
  products: { formula: string; coefficient: number }[],
  reactants: { formula: string; coefficient: number }[]
): { deltaS: number; steps: string[] } | null {
  const steps: string[] = []
  steps.push('Calculating ΔS°rxn')
  steps.push('ΔS°rxn = Σ(S° products) - Σ(S° reactants)')

  let productsSum = 0
  let reactantsSum = 0

  // Products
  steps.push('\nProducts:')
  for (const product of products) {
    const parsed = parseFormulaWithState(product.formula)
    const data = resolveThermodynamicData(parsed.formula, parsed.state)

    if (!data) {
      steps.push(`❌ Data not found for ${product.formula}`)
      return null
    }
    const contribution = data.S * product.coefficient
    productsSum += contribution
    steps.push(`  ${product.coefficient} mol × ${data.S} J/(mol·K) [${data.state}] = ${contribution.toFixed(2)} J/K`)
  }
  steps.push(`Products total: ${productsSum.toFixed(2)} J/K`)

  // Reactants
  steps.push('\nReactants:')
  for (const reactant of reactants) {
    const parsed = parseFormulaWithState(reactant.formula)
    const data = resolveThermodynamicData(parsed.formula, parsed.state)

    if (!data) {
      steps.push(`❌ Data not found for ${reactant.formula}`)
      return null
    }
    const contribution = data.S * reactant.coefficient
    reactantsSum += contribution
    steps.push(`  ${reactant.coefficient} mol × ${data.S} J/(mol·K) [${data.state}] = ${contribution.toFixed(2)} J/K`)
  }
  steps.push(`Reactants total: ${reactantsSum.toFixed(2)} J/K`)

  const deltaS = productsSum - reactantsSum
  steps.push(`\nΔS°rxn = ${productsSum.toFixed(2)} - ${reactantsSum.toFixed(2)} = ${deltaS.toFixed(2)} J/K`)

  if (deltaS > 0) {
    steps.push('✓ Entropy increases (more disorder)')
  } else if (deltaS < 0) {
    steps.push('✓ Entropy decreases (less disorder)')
  }

  return { deltaS, steps }
}

/**
 * Calculate ΔG°rxn (Gibbs Free Energy)
 * ΔG° = ΔH° - TΔS°
 * or ΔG°rxn = Σ(ΔG°f products) - Σ(ΔG°f reactants)
 */
export function calculateDeltaG(
  deltaH: number, // kJ/mol
  deltaS: number, // J/(mol·K)
  temperature: number = STANDARD_TEMPERATURE // K
): { deltaG: number; spontaneous: boolean; steps: string[] } {
  const steps: string[] = []
  steps.push('Calculating ΔG° using Gibbs equation')
  steps.push('ΔG° = ΔH° - TΔS°')
  steps.push(`\nGiven:`)
  steps.push(`  ΔH° = ${deltaH.toFixed(2)} kJ`)
  steps.push(`  ΔS° = ${deltaS.toFixed(2)} J/K = ${(deltaS/1000).toFixed(4)} kJ/K`)
  steps.push(`  T = ${temperature} K`)

  const deltaSinKJ = deltaS / 1000 // Convert J/K to kJ/K
  const TdeltaS = temperature * deltaSinKJ
  const deltaG = deltaH - TdeltaS

  steps.push(`\nΔG° = ${deltaH.toFixed(2)} - (${temperature} × ${deltaSinKJ.toFixed(4)})`)
  steps.push(`ΔG° = ${deltaH.toFixed(2)} - ${TdeltaS.toFixed(2)}`)
  steps.push(`ΔG° = ${deltaG.toFixed(2)} kJ`)

  const spontaneous = deltaG < 0

  if (spontaneous) {
    steps.push('\n✓ ΔG° < 0: Reaction is spontaneous')
  } else if (deltaG > 0) {
    steps.push('\n✗ ΔG° > 0: Reaction is non-spontaneous')
  } else {
    steps.push('\n✓ ΔG° = 0: Reaction is at equilibrium')
  }

  return { deltaG, spontaneous, steps }
}

/**
 * Calculate Equilibrium Constant (K) from ΔG°
 * ΔG° = -RT ln(K)
 * K = e^(-ΔG°/RT)
 */
export function calculateEquilibriumConstant(
  deltaG: number, // kJ/mol
  temperature: number = STANDARD_TEMPERATURE // K
): { K: number; steps: string[] } {
  const steps: string[] = []
  steps.push('Calculating equilibrium constant (K)')
  steps.push('ΔG° = -RT ln(K)')
  steps.push('K = e^(-ΔG°/RT)')

  const R = GAS_CONSTANT / 1000 // Convert to kJ/(mol·K)
  const exponent = -deltaG / (R * temperature)
  const K = Math.exp(exponent)

  steps.push(`\nGiven:`)
  steps.push(`  ΔG° = ${deltaG.toFixed(2)} kJ/mol`)
  steps.push(`  R = ${R.toFixed(4)} kJ/(mol·K)`)
  steps.push(`  T = ${temperature} K`)

  steps.push(`\nK = e^(-${deltaG.toFixed(2)} / (${R.toFixed(4)} × ${temperature}))`)
  steps.push(`K = e^(${exponent.toFixed(4)})`)
  steps.push(`K = ${K.toExponential(4)}`)

  if (K > 1) {
    steps.push('\n✓ K > 1: Products favored at equilibrium')
  } else if (K < 1) {
    steps.push('\n✓ K < 1: Reactants favored at equilibrium')
  } else {
    steps.push('\n✓ K ≈ 1: Equal amounts of reactants and products')
  }

  return { K, steps }
}

/**
 * Complete thermodynamic analysis
 */
export function analyzeReaction(
  products: { formula: string; coefficient: number }[],
  reactants: { formula: string; coefficient: number }[],
  temperature: number = STANDARD_TEMPERATURE
): ThermodynamicResult | null {
  const allSteps: string[] = []
  allSteps.push('=== Complete Thermodynamic Analysis ===\n')

  // Calculate ΔH
  const deltaHResult = calculateDeltaH(products, reactants)
  if (!deltaHResult) return null
  allSteps.push(...deltaHResult.steps, '\n')

  // Calculate ΔS
  const deltaSResult = calculateDeltaS(products, reactants)
  if (!deltaSResult) return null
  allSteps.push(...deltaSResult.steps, '\n')

  // Calculate ΔG
  const deltaGResult = calculateDeltaG(deltaHResult.deltaH, deltaSResult.deltaS, temperature)
  allSteps.push(...deltaGResult.steps, '\n')

  // Calculate K
  const KResult = calculateEquilibriumConstant(deltaGResult.deltaG, temperature)
  allSteps.push(...KResult.steps)

  return {
    deltaH: deltaHResult.deltaH,
    deltaS: deltaSResult.deltaS,
    deltaG: deltaGResult.deltaG,
    K: KResult.K,
    spontaneous: deltaGResult.spontaneous,
    temperature,
    steps: allSteps,
  }
}

/**
 * Example reactions
 */
export const EXAMPLE_REACTIONS = [
  {
    name: 'Combustion of Methane',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    products: [
      { formula: 'CO2', coefficient: 1 },
      { formula: 'H2O', coefficient: 2 },
    ],
    reactants: [
      { formula: 'CH4', coefficient: 1 },
      { formula: 'O2', coefficient: 2 },
    ],
  },
  {
    name: 'Formation of Ammonia (Haber Process)',
    equation: 'N₂ + 3H₂ → 2NH₃',
    products: [{ formula: 'NH3', coefficient: 2 }],
    reactants: [
      { formula: 'N2', coefficient: 1 },
      { formula: 'H2', coefficient: 3 },
    ],
  },
  {
    name: 'Decomposition of Calcium Carbonate',
    equation: 'CaCO₃ → CaO + CO₂',
    products: [
      { formula: 'CaO', coefficient: 1 },
      { formula: 'CO2', coefficient: 1 },
    ],
    reactants: [{ formula: 'CaCO3', coefficient: 1 }],
  },
]
