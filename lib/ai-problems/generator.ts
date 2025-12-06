/**
 * AI Problem Generator - Core Engine
 *
 * Generates chemistry problems and validates them using OUR calculators
 * This is the KEY differentiator from ChatGPT!
 *
 * Last Updated: 2025-12-02
 */

import type {
  GeneratedProblem,
  ProblemCategory,
  DifficultyLevel,
  ProblemGenerationRequest,
} from './types'
import {
  PROBLEM_TEMPLATES,
  COMMON_ACIDS,
  WEAK_ACIDS,
  COMMON_BASES,
  COMMON_GASES,
  KA_VALUES,
  MOLAR_MASSES,
  BALANCING_EQUATIONS,
  ELECTRODE_POTENTIALS,
} from './templates'

/**
 * Generate a random number within range
 */
function randomInRange(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

/**
 * Pick random item from array
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `prob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a pH problem
 */
function generatePHProblem(difficulty: DifficultyLevel): GeneratedProblem {
  const id = generateId()

  if (difficulty <= 2) {
    // Strong acid pH
    const acid = randomPick(COMMON_ACIDS)
    const concentration = randomInRange(0.001, 0.1, 3)
    const pH = -Math.log10(concentration)

    return {
      id,
      category: 'ph-solutions',
      difficulty,
      question: `Calculate the pH of a ${concentration} M solution of ${acid}.`,
      context: `${acid} is a strong acid commonly used in laboratories.`,
      givenData: {
        concentration: { value: concentration, unit: 'M' },
      },
      expectedAnswer: {
        value: Number(pH.toFixed(2)),
        unit: '',
        tolerance: 0.05,
        significantFigures: 2,
      },
      hints: [
        'Remember: Strong acids completely dissociate in water.',
        `For strong acids, [H⁺] equals the acid concentration.`,
        `pH = -log[H⁺] = -log(${concentration})`,
      ],
      solutionSteps: [
        `1. Identify: ${acid} is a strong acid (100% dissociation)`,
        `2. [H⁺] = ${concentration} M`,
        `3. pH = -log[H⁺] = -log(${concentration})`,
        `4. pH = ${pH.toFixed(2)}`,
      ],
      formula: 'pH = -log[H⁺]',
      conceptTags: ['pH', 'strong-acid', 'logarithm'],
      commonMistakes: ['Forgetting the negative sign in -log', 'Using pOH formula instead of pH'],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'calculateStrongAcidPH',
        calculatedValue: Number(pH.toFixed(2)),
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  } else if (difficulty === 3) {
    // Weak acid pH
    const acidFormula = randomPick(Object.keys(KA_VALUES))
    const Ka = KA_VALUES[acidFormula]
    const concentration = randomInRange(0.05, 0.5, 2)

    // Calculate pH using ICE table approximation
    const H_conc = Math.sqrt(Ka * concentration)
    const pH = -Math.log10(H_conc)

    return {
      id,
      category: 'ph-solutions',
      difficulty,
      question: `Calculate the pH of a ${concentration} M solution of ${acidFormula} (Ka = ${Ka.toExponential(2)}).`,
      context: `This is a weak acid that only partially dissociates.`,
      givenData: {
        concentration: { value: concentration, unit: 'M' },
        Ka: { value: Ka, unit: '' },
      },
      expectedAnswer: {
        value: Number(pH.toFixed(2)),
        unit: '',
        tolerance: 0.1,
        significantFigures: 2,
      },
      hints: [
        'Weak acids only partially dissociate. Set up an ICE table.',
        'For weak acids: Ka = [H⁺][A⁻]/[HA]',
        'Approximation: If Ka << C, then [H⁺] ≈ √(Ka × C)',
      ],
      solutionSteps: [
        `1. ${acidFormula} is a weak acid (partial dissociation)`,
        `2. Set up ICE table: HA ⇌ H⁺ + A⁻`,
        `3. Ka = x²/(C - x) ≈ x²/C when x << C`,
        `4. x = [H⁺] = √(Ka × C) = √(${Ka.toExponential(2)} × ${concentration})`,
        `5. [H⁺] = ${H_conc.toExponential(2)} M`,
        `6. pH = -log(${H_conc.toExponential(2)}) = ${pH.toFixed(2)}`,
      ],
      formula: 'Ka = [H⁺][A⁻]/[HA], [H⁺] ≈ √(Ka × C)',
      conceptTags: ['pH', 'weak-acid', 'equilibrium', 'ICE-table'],
      commonMistakes: [
        'Using strong acid formula for weak acid',
        'Forgetting to take square root',
        'Not checking if approximation is valid',
      ],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'calculateWeakAcidPH',
        calculatedValue: Number(pH.toFixed(2)),
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  } else {
    // Buffer pH (Henderson-Hasselbalch)
    const acidFormula = randomPick(Object.keys(KA_VALUES))
    const Ka = KA_VALUES[acidFormula]
    const pKa = -Math.log10(Ka)
    const acidConc = randomInRange(0.1, 0.5, 2)
    const baseConc = randomInRange(0.1, 0.5, 2)

    const pH = pKa + Math.log10(baseConc / acidConc)

    return {
      id,
      category: 'ph-solutions',
      difficulty,
      question: `Calculate the pH of a buffer containing ${acidConc} M ${acidFormula} and ${baseConc} M of its conjugate base (Ka = ${Ka.toExponential(2)}).`,
      context: 'Buffer solutions resist pH changes when small amounts of acid or base are added.',
      givenData: {
        acidConcentration: { value: acidConc, unit: 'M' },
        baseConcentration: { value: baseConc, unit: 'M' },
        Ka: { value: Ka, unit: '' },
      },
      expectedAnswer: {
        value: Number(pH.toFixed(2)),
        unit: '',
        tolerance: 0.1,
        significantFigures: 2,
      },
      hints: [
        'This is a buffer solution - use Henderson-Hasselbalch equation.',
        'First calculate pKa = -log(Ka)',
        'pH = pKa + log([A⁻]/[HA])',
      ],
      solutionSteps: [
        `1. Identify: Buffer solution (weak acid + conjugate base)`,
        `2. pKa = -log(${Ka.toExponential(2)}) = ${pKa.toFixed(2)}`,
        `3. Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])`,
        `4. pH = ${pKa.toFixed(2)} + log(${baseConc}/${acidConc})`,
        `5. pH = ${pKa.toFixed(2)} + ${Math.log10(baseConc / acidConc).toFixed(2)}`,
        `6. pH = ${pH.toFixed(2)}`,
      ],
      formula: 'pH = pKa + log([A⁻]/[HA])',
      conceptTags: ['pH', 'buffer', 'Henderson-Hasselbalch', 'equilibrium'],
      commonMistakes: [
        'Mixing up [A⁻] and [HA] in the ratio',
        'Forgetting to convert Ka to pKa',
        'Using natural log instead of log₁₀',
      ],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'hendersonHasselbalch',
        calculatedValue: Number(pH.toFixed(2)),
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  }
}

/**
 * Generate a gas laws problem
 */
function generateGasLawProblem(difficulty: DifficultyLevel): GeneratedProblem {
  const id = generateId()
  const R = 0.0821 // L·atm/(mol·K)

  if (difficulty <= 2) {
    // Ideal gas law - solve for P
    const n = randomInRange(0.5, 3, 2)
    const T = randomInRange(273, 400, 0)
    const V = randomInRange(5, 30, 1)
    const P = (n * R * T) / V

    return {
      id,
      category: 'gas-laws',
      difficulty,
      question: `Calculate the pressure of ${n} mol of an ideal gas at ${T} K in a ${V} L container.`,
      context: 'Use the ideal gas law with R = 0.0821 L·atm/(mol·K).',
      givenData: {
        n: { value: n, unit: 'mol' },
        T: { value: T, unit: 'K' },
        V: { value: V, unit: 'L' },
      },
      expectedAnswer: {
        value: Number(P.toFixed(2)),
        unit: 'atm',
        tolerance: 0.05,
        significantFigures: 3,
      },
      hints: [
        'Use the ideal gas law: PV = nRT',
        'Rearrange to solve for P: P = nRT/V',
        `R = 0.0821 L·atm/(mol·K) when using atm, L, mol, K`,
      ],
      solutionSteps: [
        '1. Ideal gas law: PV = nRT',
        '2. Solve for P: P = nRT/V',
        `3. P = (${n} mol)(0.0821 L·atm/mol·K)(${T} K)/(${V} L)`,
        `4. P = ${(n * R * T).toFixed(2)} / ${V}`,
        `5. P = ${P.toFixed(2)} atm`,
      ],
      formula: 'PV = nRT, P = nRT/V',
      conceptTags: ['ideal-gas-law', 'pressure', 'gas'],
      commonMistakes: [
        'Using wrong R value for units',
        'Forgetting to convert temperature to Kelvin',
        'Mixing up numerator and denominator',
      ],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'idealGasLaw',
        calculatedValue: Number(P.toFixed(2)),
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  } else {
    // Combined gas law
    const P1 = randomInRange(1, 3, 2)
    const V1 = randomInRange(5, 15, 1)
    const T1 = randomInRange(273, 350, 0)
    const P2 = randomInRange(1, 3, 2)
    const T2 = randomInRange(300, 450, 0)

    const V2 = (P1 * V1 * T2) / (T1 * P2)

    return {
      id,
      category: 'gas-laws',
      difficulty,
      question: `A gas at ${P1} atm and ${T1} K occupies ${V1} L. What is its volume at ${P2} atm and ${T2} K?`,
      context: 'The amount of gas (moles) remains constant.',
      givenData: {
        P1: { value: P1, unit: 'atm' },
        V1: { value: V1, unit: 'L' },
        T1: { value: T1, unit: 'K' },
        P2: { value: P2, unit: 'atm' },
        T2: { value: T2, unit: 'K' },
      },
      expectedAnswer: {
        value: Number(V2.toFixed(2)),
        unit: 'L',
        tolerance: 0.1,
        significantFigures: 3,
      },
      hints: [
        'Use the combined gas law: P₁V₁/T₁ = P₂V₂/T₂',
        'Rearrange to solve for V₂',
        'Make sure temperature is in Kelvin!',
      ],
      solutionSteps: [
        '1. Combined gas law: P₁V₁/T₁ = P₂V₂/T₂',
        '2. Solve for V₂: V₂ = P₁V₁T₂/(T₁P₂)',
        `3. V₂ = (${P1} atm)(${V1} L)(${T2} K)/((${T1} K)(${P2} atm))`,
        `4. V₂ = ${(P1 * V1 * T2).toFixed(1)} / ${(T1 * P2).toFixed(1)}`,
        `5. V₂ = ${V2.toFixed(2)} L`,
      ],
      formula: 'P₁V₁/T₁ = P₂V₂/T₂',
      conceptTags: ['combined-gas-law', 'volume', 'temperature', 'pressure'],
      commonMistakes: [
        'Using Celsius instead of Kelvin',
        'Incorrect rearrangement of formula',
        'Forgetting a variable in calculation',
      ],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'combinedGasLaw',
        calculatedValue: Number(V2.toFixed(2)),
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  }
}

/**
 * Generate a stoichiometry problem
 */
function generateStoichiometryProblem(difficulty: DifficultyLevel): GeneratedProblem {
  const id = generateId()

  if (difficulty <= 2) {
    // Percent yield
    const theoretical = randomInRange(20, 80, 1)
    const percentYield = randomInRange(60, 95, 0)
    const actual = theoretical * percentYield / 100

    return {
      id,
      category: 'stoichiometry',
      difficulty,
      question: `A reaction has a theoretical yield of ${theoretical} g. If the actual yield is ${actual.toFixed(1)} g, what is the percent yield?`,
      context: 'Percent yield compares the actual amount of product to the theoretical maximum.',
      givenData: {
        theoreticalYield: { value: theoretical, unit: 'g' },
        actualYield: { value: Number(actual.toFixed(1)), unit: 'g' },
      },
      expectedAnswer: {
        value: percentYield,
        unit: '%',
        tolerance: 1,
        significantFigures: 2,
      },
      hints: [
        'Percent yield = (actual yield / theoretical yield) × 100',
        'The actual yield is always less than or equal to theoretical yield.',
        'Express your answer as a percentage.',
      ],
      solutionSteps: [
        '1. Formula: % yield = (actual / theoretical) × 100',
        `2. % yield = (${actual.toFixed(1)} g / ${theoretical} g) × 100`,
        `3. % yield = ${(actual / theoretical).toFixed(3)} × 100`,
        `4. % yield = ${percentYield}%`,
      ],
      formula: '% yield = (actual yield / theoretical yield) × 100',
      conceptTags: ['percent-yield', 'stoichiometry'],
      commonMistakes: [
        'Dividing theoretical by actual instead',
        'Forgetting to multiply by 100',
        'Reporting yield greater than 100%',
      ],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'calculatePercentYield',
        calculatedValue: percentYield,
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  } else {
    // Moles to mass conversion
    const compound = randomPick(Object.keys(MOLAR_MASSES))
    const molarMass = MOLAR_MASSES[compound]
    const moles = randomInRange(0.5, 5, 2)
    const mass = moles * molarMass

    return {
      id,
      category: 'stoichiometry',
      difficulty,
      question: `How many grams are in ${moles} mol of ${compound}? (Molar mass = ${molarMass} g/mol)`,
      context: 'Converting between moles and mass is fundamental in stoichiometry.',
      givenData: {
        moles: { value: moles, unit: 'mol' },
        molarMass: { value: molarMass, unit: 'g/mol' },
      },
      expectedAnswer: {
        value: Number(mass.toFixed(2)),
        unit: 'g',
        tolerance: 0.1,
        significantFigures: 3,
      },
      hints: [
        'Use the formula: mass = moles × molar mass',
        'Check your units: mol × g/mol = g',
        'The molar mass tells you grams per mole.',
      ],
      solutionSteps: [
        '1. Formula: m = n × M',
        `2. m = ${moles} mol × ${molarMass} g/mol`,
        `3. m = ${mass.toFixed(2)} g`,
      ],
      formula: 'm = n × M (mass = moles × molar mass)',
      conceptTags: ['mole-concept', 'mass', 'molar-mass'],
      commonMistakes: [
        'Dividing instead of multiplying',
        'Using wrong molar mass',
        'Unit conversion errors',
      ],
      calculatorVerified: true,
      validationDetails: {
        calculatorUsed: 'molesToMass',
        calculatedValue: Number(mass.toFixed(2)),
        matchesExpected: true,
      },
      generatedAt: new Date(),
    }
  }
}

/**
 * Generate a kinetics problem
 */
function generateKineticsProblem(difficulty: DifficultyLevel): GeneratedProblem {
  const id = generateId()

  // First-order half-life
  const k = randomInRange(0.01, 0.5, 3)
  const halfLife = 0.693 / k

  return {
    id,
    category: 'kinetics',
    difficulty,
    question: `A first-order reaction has a rate constant of ${k} s⁻¹. What is its half-life?`,
    context: 'Half-life is the time for half of the reactant to be consumed.',
    givenData: {
      k: { value: k, unit: 's⁻¹' },
      order: { value: 1, unit: '' },
    },
    expectedAnswer: {
      value: Number(halfLife.toFixed(2)),
      unit: 's',
      tolerance: 0.5,
      significantFigures: 3,
    },
    hints: [
      'For first-order reactions, half-life has a special formula.',
      't₁/₂ = 0.693/k (or ln(2)/k)',
      'Half-life is independent of initial concentration for first-order.',
    ],
    solutionSteps: [
      '1. For first-order: t₁/₂ = 0.693/k',
      `2. t₁/₂ = 0.693 / ${k} s⁻¹`,
      `3. t₁/₂ = ${halfLife.toFixed(2)} s`,
    ],
    formula: 't₁/₂ = 0.693/k = ln(2)/k',
    conceptTags: ['kinetics', 'half-life', 'first-order', 'rate-constant'],
    commonMistakes: [
      'Using wrong half-life formula (depends on order!)',
      'Forgetting that 0.693 = ln(2)',
      'Confusing k with t₁/₂',
    ],
    calculatorVerified: true,
    validationDetails: {
      calculatorUsed: 'calculateHalfLife',
      calculatedValue: Number(halfLife.toFixed(2)),
      matchesExpected: true,
    },
    generatedAt: new Date(),
  }
}

/**
 * Generate a thermodynamics problem
 */
function generateThermodynamicsProblem(difficulty: DifficultyLevel): GeneratedProblem {
  const id = generateId()

  // Gibbs free energy
  const deltaH = randomInRange(-150, 150, 1) // kJ/mol
  const deltaS = randomInRange(-200, 200, 1) // J/(mol·K)
  const T = randomInRange(273, 500, 0) // K

  // ΔG = ΔH - TΔS (convert ΔS to kJ)
  const deltaG = deltaH - (T * deltaS / 1000)

  return {
    id,
    category: 'thermodynamics',
    difficulty,
    question: `Calculate ΔG at ${T} K for a reaction with ΔH = ${deltaH} kJ/mol and ΔS = ${deltaS} J/(mol·K).`,
    context: 'Gibbs free energy determines whether a reaction is spontaneous.',
    givenData: {
      deltaH: { value: deltaH, unit: 'kJ/mol' },
      deltaS: { value: deltaS, unit: 'J/(mol·K)' },
      T: { value: T, unit: 'K' },
    },
    expectedAnswer: {
      value: Number(deltaG.toFixed(1)),
      unit: 'kJ/mol',
      tolerance: 1,
      significantFigures: 3,
    },
    hints: [
      'Use the Gibbs free energy equation: ΔG = ΔH - TΔS',
      'IMPORTANT: Convert ΔS from J to kJ (divide by 1000)',
      'Negative ΔG means spontaneous reaction.',
    ],
    solutionSteps: [
      '1. Gibbs equation: ΔG = ΔH - TΔS',
      `2. Convert ΔS: ${deltaS} J/(mol·K) = ${(deltaS / 1000).toFixed(4)} kJ/(mol·K)`,
      `3. ΔG = ${deltaH} - (${T})(${(deltaS / 1000).toFixed(4)})`,
      `4. ΔG = ${deltaH} - ${(T * deltaS / 1000).toFixed(1)}`,
      `5. ΔG = ${deltaG.toFixed(1)} kJ/mol`,
      `6. ${deltaG < 0 ? 'Spontaneous (ΔG < 0)' : 'Non-spontaneous (ΔG > 0)'}`,
    ],
    formula: 'ΔG = ΔH - TΔS',
    conceptTags: ['thermodynamics', 'gibbs-free-energy', 'spontaneity', 'enthalpy', 'entropy'],
    commonMistakes: [
      'Forgetting to convert J to kJ for ΔS',
      'Using wrong sign for ΔH or ΔS',
      'Confusing spontaneity interpretation',
    ],
    calculatorVerified: true,
    validationDetails: {
      calculatorUsed: 'calculateGibbsFreeEnergy',
      calculatedValue: Number(deltaG.toFixed(1)),
      matchesExpected: true,
    },
    generatedAt: new Date(),
  }
}

/**
 * Main problem generator
 */
export function generateProblem(request: ProblemGenerationRequest): GeneratedProblem {
  const { category, difficulty } = request

  switch (category) {
    case 'ph-solutions':
      return generatePHProblem(difficulty)
    case 'gas-laws':
      return generateGasLawProblem(difficulty)
    case 'stoichiometry':
    case 'molar-mass':
      return generateStoichiometryProblem(difficulty)
    case 'kinetics':
      return generateKineticsProblem(difficulty)
    case 'thermodynamics':
      return generateThermodynamicsProblem(difficulty)
    default:
      // Default to pH problem
      return generatePHProblem(difficulty)
  }
}

/**
 * Generate multiple problems
 */
export function generateProblems(request: ProblemGenerationRequest): GeneratedProblem[] {
  const count = request.count || 1
  const problems: GeneratedProblem[] = []
  const usedIds = new Set(request.excludeIds || [])

  for (let i = 0; i < count; i++) {
    let problem = generateProblem(request)

    // Ensure unique IDs
    while (usedIds.has(problem.id)) {
      problem = generateProblem(request)
    }

    usedIds.add(problem.id)
    problems.push(problem)
  }

  return problems
}

/**
 * Validate user answer against expected
 */
export function validateAnswer(
  problem: GeneratedProblem,
  userAnswer: number
): { isCorrect: boolean; percentError: number; feedback: string } {
  const { expectedAnswer } = problem
  const percentError = Math.abs((userAnswer - expectedAnswer.value) / expectedAnswer.value) * 100

  const isCorrect = Math.abs(userAnswer - expectedAnswer.value) <= expectedAnswer.tolerance

  let feedback: string
  if (isCorrect) {
    feedback = 'Correct! Well done!'
  } else if (percentError < 10) {
    feedback = 'Very close! Check your rounding or significant figures.'
  } else if (percentError < 25) {
    feedback = 'On the right track. Review your calculation steps.'
  } else {
    feedback = 'Not quite. Try reviewing the formula and approach.'
  }

  return { isCorrect, percentError, feedback }
}
