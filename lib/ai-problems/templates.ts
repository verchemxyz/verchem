/**
 * AI Problem Generator - Problem Templates
 *
 * These templates generate chemically meaningful problems
 * that can be validated by our calculators
 *
 * Last Updated: 2025-12-02
 */

import type { ProblemCategory, DifficultyLevel, ProblemTemplate } from './types'

/**
 * Common chemicals for realistic problems
 */
export const COMMON_ACIDS = ['HCl', 'HNO3', 'H2SO4', 'HBr', 'HI', 'HClO4']
export const WEAK_ACIDS = ['CH3COOH', 'HF', 'H2CO3', 'H3PO4', 'HNO2']
export const COMMON_BASES = ['NaOH', 'KOH', 'Ca(OH)2', 'Ba(OH)2', 'LiOH']
export const WEAK_BASES = ['NH3', 'CH3NH2', 'C5H5N']
export const COMMON_COMPOUNDS = ['H2O', 'CO2', 'NaCl', 'CaCO3', 'Fe2O3', 'Al2O3']

/**
 * Ka values for weak acids
 */
export const KA_VALUES: Record<string, number> = {
  'CH3COOH': 1.8e-5,  // Acetic acid
  'HF': 6.8e-4,       // Hydrofluoric acid
  'HNO2': 4.5e-4,     // Nitrous acid
  'H2CO3': 4.3e-7,    // Carbonic acid
  'H3PO4': 7.5e-3,    // Phosphoric acid (Ka1)
  'HCN': 6.2e-10,     // Hydrogen cyanide
  'H2S': 1.0e-7,      // Hydrogen sulfide
}

/**
 * Molar masses for common compounds
 */
export const MOLAR_MASSES: Record<string, number> = {
  'H2': 2.016,
  'O2': 32.00,
  'N2': 28.02,
  'H2O': 18.02,
  'CO2': 44.01,
  'NaCl': 58.44,
  'HCl': 36.46,
  'NaOH': 40.00,
  'H2SO4': 98.08,
  'CaCO3': 100.09,
  'Fe2O3': 159.69,
  'Al2O3': 101.96,
  'C6H12O6': 180.16,
  'CH3COOH': 60.05,
  'NH3': 17.03,
}

/**
 * Problem templates by category
 */
export const PROBLEM_TEMPLATES: Record<ProblemCategory, ProblemTemplate[]> = {
  'ph-solutions': [
    {
      category: 'ph-solutions',
      type: 'strong-acid-ph',
      template: 'Calculate the pH of a {concentration} M solution of {acid}.',
      variables: [
        { name: 'concentration', min: 0.001, max: 1.0, unit: 'M', decimalPlaces: 3, chemicallyMeaningful: true },
      ],
      formula: 'pH = -log[H⁺]',
      calculatorFunction: 'calculateStrongAcidPH',
    },
    {
      category: 'ph-solutions',
      type: 'strong-base-ph',
      template: 'Calculate the pH of a {concentration} M solution of {base}.',
      variables: [
        { name: 'concentration', min: 0.001, max: 1.0, unit: 'M', decimalPlaces: 3, chemicallyMeaningful: true },
      ],
      formula: 'pOH = -log[OH⁻], pH = 14 - pOH',
      calculatorFunction: 'calculateStrongBasePH',
    },
    {
      category: 'ph-solutions',
      type: 'weak-acid-ph',
      template: 'Calculate the pH of a {concentration} M solution of {acid} (Ka = {ka}).',
      variables: [
        { name: 'concentration', min: 0.01, max: 1.0, unit: 'M', decimalPlaces: 2, chemicallyMeaningful: true },
      ],
      formula: 'Ka = [H⁺][A⁻]/[HA], pH = -log[H⁺]',
      calculatorFunction: 'calculateWeakAcidPH',
    },
    {
      category: 'ph-solutions',
      type: 'dilution',
      template: 'What is the final concentration when {volume1} mL of {concentration1} M {compound} is diluted to {volume2} mL?',
      variables: [
        { name: 'volume1', min: 10, max: 100, unit: 'mL', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'concentration1', min: 0.1, max: 2.0, unit: 'M', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'volume2', min: 100, max: 1000, unit: 'mL', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: 'M₁V₁ = M₂V₂',
      calculatorFunction: 'calculateDilution',
    },
  ],

  'stoichiometry': [
    {
      category: 'stoichiometry',
      type: 'mass-to-mass',
      template: 'In the reaction {equation}, how many grams of {product} are produced from {mass} g of {reactant}?',
      variables: [
        { name: 'mass', min: 1, max: 100, unit: 'g', decimalPlaces: 1, chemicallyMeaningful: true },
      ],
      formula: 'n = m/M, use mole ratio',
      calculatorFunction: 'calculateStoichiometry',
    },
    {
      category: 'stoichiometry',
      type: 'limiting-reagent',
      template: 'When {mass1} g of {reactant1} reacts with {mass2} g of {reactant2} in the reaction {equation}, which is the limiting reagent?',
      variables: [
        { name: 'mass1', min: 1, max: 50, unit: 'g', decimalPlaces: 1, chemicallyMeaningful: true },
        { name: 'mass2', min: 1, max: 50, unit: 'g', decimalPlaces: 1, chemicallyMeaningful: true },
      ],
      formula: 'Compare moles / coefficient for each reactant',
      calculatorFunction: 'findLimitingReagent',
    },
    {
      category: 'stoichiometry',
      type: 'percent-yield',
      template: 'A reaction has a theoretical yield of {theoretical} g. If the actual yield is {actual} g, what is the percent yield?',
      variables: [
        { name: 'theoretical', min: 10, max: 100, unit: 'g', decimalPlaces: 1, chemicallyMeaningful: true },
        { name: 'actual', min: 5, max: 95, unit: 'g', decimalPlaces: 1, chemicallyMeaningful: true },
      ],
      formula: '% yield = (actual/theoretical) × 100',
      calculatorFunction: 'calculatePercentYield',
    },
  ],

  'gas-laws': [
    {
      category: 'gas-laws',
      type: 'ideal-gas-pressure',
      template: 'Calculate the pressure of {moles} mol of an ideal gas at {temperature} K in a {volume} L container.',
      variables: [
        { name: 'moles', min: 0.1, max: 5, unit: 'mol', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'temperature', min: 273, max: 500, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'volume', min: 1, max: 50, unit: 'L', decimalPlaces: 1, chemicallyMeaningful: true },
      ],
      formula: 'PV = nRT, R = 0.0821 L·atm/(mol·K)',
      calculatorFunction: 'idealGasLaw',
    },
    {
      category: 'gas-laws',
      type: 'combined-gas-law',
      template: 'A gas at {p1} atm and {t1} K occupies {v1} L. What is its volume at {p2} atm and {t2} K?',
      variables: [
        { name: 'p1', min: 0.5, max: 5, unit: 'atm', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 't1', min: 273, max: 400, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'v1', min: 1, max: 20, unit: 'L', decimalPlaces: 1, chemicallyMeaningful: true },
        { name: 'p2', min: 0.5, max: 5, unit: 'atm', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 't2', min: 273, max: 500, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: 'P₁V₁/T₁ = P₂V₂/T₂',
      calculatorFunction: 'combinedGasLaw',
    },
    {
      category: 'gas-laws',
      type: 'dalton-partial-pressure',
      template: 'A container has {n1} mol of {gas1} and {n2} mol of {gas2} at {temperature} K in {volume} L. What is the partial pressure of {gas1}?',
      variables: [
        { name: 'n1', min: 0.1, max: 2, unit: 'mol', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'n2', min: 0.1, max: 2, unit: 'mol', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'temperature', min: 273, max: 400, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'volume', min: 5, max: 50, unit: 'L', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: 'P_partial = (n_i / n_total) × P_total',
      calculatorFunction: 'daltonPartialPressure',
    },
  ],

  'thermodynamics': [
    {
      category: 'thermodynamics',
      type: 'gibbs-free-energy',
      template: 'Calculate ΔG at {temperature} K for a reaction with ΔH = {deltaH} kJ/mol and ΔS = {deltaS} J/(mol·K).',
      variables: [
        { name: 'deltaH', min: -200, max: 200, unit: 'kJ/mol', decimalPlaces: 1, chemicallyMeaningful: true },
        { name: 'deltaS', min: -300, max: 300, unit: 'J/(mol·K)', decimalPlaces: 1, chemicallyMeaningful: true },
        { name: 'temperature', min: 273, max: 500, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: 'ΔG = ΔH - TΔS',
      calculatorFunction: 'calculateGibbsFreeEnergy',
    },
    {
      category: 'thermodynamics',
      type: 'spontaneity',
      template: 'At what temperature does a reaction with ΔH = {deltaH} kJ/mol and ΔS = {deltaS} J/(mol·K) become spontaneous?',
      variables: [
        { name: 'deltaH', min: 10, max: 200, unit: 'kJ/mol', decimalPlaces: 1, chemicallyMeaningful: true },
        { name: 'deltaS', min: 10, max: 200, unit: 'J/(mol·K)', decimalPlaces: 1, chemicallyMeaningful: true },
      ],
      formula: 'T = ΔH/ΔS (when ΔG = 0)',
      calculatorFunction: 'calculateSpontaneityTemperature',
    },
  ],

  'kinetics': [
    {
      category: 'kinetics',
      type: 'first-order-half-life',
      template: 'A first-order reaction has a rate constant of {k} s⁻¹. What is its half-life?',
      variables: [
        { name: 'k', min: 0.001, max: 1, unit: 's⁻¹', decimalPlaces: 4, chemicallyMeaningful: true },
      ],
      formula: 't₁/₂ = 0.693/k',
      calculatorFunction: 'calculateHalfLife',
    },
    {
      category: 'kinetics',
      type: 'first-order-remaining',
      template: 'A first-order reaction has k = {k} s⁻¹. If the initial concentration is {c0} M, what concentration remains after {time} seconds?',
      variables: [
        { name: 'k', min: 0.01, max: 0.5, unit: 's⁻¹', decimalPlaces: 3, chemicallyMeaningful: true },
        { name: 'c0', min: 0.1, max: 2, unit: 'M', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'time', min: 1, max: 100, unit: 's', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: '[A] = [A]₀ × e^(-kt)',
      calculatorFunction: 'calculateFirstOrderConcentration',
    },
    {
      category: 'kinetics',
      type: 'arrhenius',
      template: 'A reaction has Ea = {ea} kJ/mol and A = {a} s⁻¹. What is the rate constant at {temperature} K?',
      variables: [
        { name: 'ea', min: 20, max: 150, unit: 'kJ/mol', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'a', min: 1e8, max: 1e14, unit: 's⁻¹', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'temperature', min: 273, max: 500, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: 'k = A × e^(-Ea/RT)',
      calculatorFunction: 'calculateArrhenius',
    },
  ],

  'electrochemistry': [
    {
      category: 'electrochemistry',
      type: 'cell-potential',
      template: 'Calculate the standard cell potential for a galvanic cell with {anode} (E° = {e1} V) as anode and {cathode} (E° = {e2} V) as cathode.',
      variables: [
        { name: 'e1', min: -3, max: 0, unit: 'V', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'e2', min: 0, max: 2, unit: 'V', decimalPlaces: 2, chemicallyMeaningful: true },
      ],
      formula: 'E°cell = E°cathode - E°anode',
      calculatorFunction: 'calculateCellPotential',
    },
    {
      category: 'electrochemistry',
      type: 'nernst-equation',
      template: 'Calculate the cell potential at {temperature} K when Q = {q} for a cell with E° = {e0} V and n = {n} electrons transferred.',
      variables: [
        { name: 'e0', min: 0.1, max: 2, unit: 'V', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'n', min: 1, max: 4, unit: '', decimalPlaces: 0, chemicallyMeaningful: true },
        { name: 'q', min: 0.01, max: 100, unit: '', decimalPlaces: 2, chemicallyMeaningful: true },
        { name: 'temperature', min: 273, max: 373, unit: 'K', decimalPlaces: 0, chemicallyMeaningful: true },
      ],
      formula: 'E = E° - (RT/nF)ln(Q)',
      calculatorFunction: 'calculateNernst',
    },
  ],

  'equation-balancing': [
    {
      category: 'equation-balancing',
      type: 'simple-balance',
      template: 'Balance the following equation: {equation}',
      variables: [],
      formula: 'Conservation of mass',
      calculatorFunction: 'balanceEquation',
    },
  ],

  'molar-mass': [
    {
      category: 'molar-mass',
      type: 'calculate-mass',
      template: 'Calculate the molar mass of {compound}.',
      variables: [],
      formula: 'M = Σ(atomic mass × count)',
      calculatorFunction: 'calculateMolarMass',
    },
    {
      category: 'molar-mass',
      type: 'mass-to-moles',
      template: 'How many moles are in {mass} g of {compound}?',
      variables: [
        { name: 'mass', min: 1, max: 100, unit: 'g', decimalPlaces: 1, chemicallyMeaningful: true },
      ],
      formula: 'n = m/M',
      calculatorFunction: 'massToMoles',
    },
  ],
}

/**
 * Sample equations for balancing problems
 */
export const BALANCING_EQUATIONS = [
  // Easy
  { equation: 'H2 + O2 -> H2O', difficulty: 1 as DifficultyLevel },
  { equation: 'N2 + H2 -> NH3', difficulty: 1 as DifficultyLevel },
  { equation: 'Fe + O2 -> Fe2O3', difficulty: 2 as DifficultyLevel },
  // Medium
  { equation: 'C3H8 + O2 -> CO2 + H2O', difficulty: 2 as DifficultyLevel },
  { equation: 'Al + HCl -> AlCl3 + H2', difficulty: 2 as DifficultyLevel },
  { equation: 'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2', difficulty: 3 as DifficultyLevel },
  // Hard
  { equation: 'C6H12O6 + O2 -> CO2 + H2O', difficulty: 3 as DifficultyLevel },
  { equation: 'Ca3(PO4)2 + SiO2 + C -> CaSiO3 + P4 + CO', difficulty: 4 as DifficultyLevel },
]

/**
 * Gases for gas law problems
 */
export const COMMON_GASES = ['N2', 'O2', 'CO2', 'H2', 'He', 'Ar', 'Ne', 'CH4']

/**
 * Standard electrode potentials
 */
export const ELECTRODE_POTENTIALS: Record<string, number> = {
  'Li+/Li': -3.04,
  'K+/K': -2.93,
  'Ca2+/Ca': -2.87,
  'Na+/Na': -2.71,
  'Mg2+/Mg': -2.37,
  'Al3+/Al': -1.66,
  'Zn2+/Zn': -0.76,
  'Fe2+/Fe': -0.44,
  'Ni2+/Ni': -0.26,
  'Sn2+/Sn': -0.14,
  'Pb2+/Pb': -0.13,
  'H+/H2': 0.00,
  'Cu2+/Cu': 0.34,
  'I2/I-': 0.54,
  'Ag+/Ag': 0.80,
  'Br2/Br-': 1.07,
  'Cl2/Cl-': 1.36,
  'Au3+/Au': 1.50,
  'F2/F-': 2.87,
}
