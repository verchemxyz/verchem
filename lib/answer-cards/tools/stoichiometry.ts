/**
 * VerChem Verified Answer Cards — Stoichiometry Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/stoichiometry.ts
 * CRITICAL: execute() routes to engine functions directly — no reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult } from './_validate'
import { isValidStandaloneFormula } from './_formula'
import { ELEMENT_SYMBOLS } from '../elements'
import {
  calculateMolecularMass,
  calculatePercentComposition,
  calculateEmpiricalFormula,
  massToMoles,
  molesToMass,
  molesToMolecules,
  moleculesToMoles,
  molesToVolumeSTP,
  volumeSTPToMoles,
  findLimitingReagent,
  calculateTheoreticalYield,
  calculatePercentYield,
} from '@/lib/calculations/stoichiometry'
import { AVOGADRO_CONSTANT } from '@/lib/constants'
import { getElementBySymbol } from '@/lib/data/periodic-table'

/** Parse a canonical (parenthesis-free) formula into element→count, e.g. "C7H8" → {C:7,H:8} */
function parseFormulaCounts(formula: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const re = /([A-Z][a-z]?)(\d*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(formula)) !== null) {
    if (!m[1]) continue
    counts[m[1]] = (counts[m[1]] || 0) + (m[2] ? parseInt(m[2], 10) : 1)
  }
  return counts
}

/** Greatest common divisor of two non-negative integers (returns 1 for 0,0). */
function gcdInt(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 3 (Stoichiometry)'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function requirePositiveInteger(name: string, value: unknown): number | undefined {
  const n = readFiniteNumber(value)
  if (n === undefined) return undefined
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return n
}

const calculate_molecular_mass: VerifiedTool = {
  name: 'calculate_molecular_mass',
  description: 'Calculate the molar mass of a compound from its chemical formula. Use when the user asks for molecular mass, molar mass, or formula weight.',
  input_schema: {
    type: 'object',
    properties: {
      formula: { type: 'string', description: 'Chemical formula (e.g., H2O, NaCl, C6H12O6)' },
    },
    required: ['formula'],
  },
  citation: CITATION,
  engine: 'molecular-mass',
  execute: (input) => {
    if (typeof input.formula !== 'string' || input.formula.trim().length === 0) {
      return err('formula is required and must be a non-empty string')
    }
    const formula = input.formula.trim()
    if (!isValidStandaloneFormula(formula)) {
      return err(`Invalid chemical formula: "${formula}"`)
    }
    try {
      const mass = calculateMolecularMass(formula)
      if (!Number.isFinite(mass) || mass <= 0) {
        return err('Molecular mass calculation produced a non-positive result')
      }
      return finalizeResult({ formula, molar_mass: mass })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Molecular mass calculation failed')
    }
  },
}

const calculate_percent_composition: VerifiedTool = {
  name: 'calculate_percent_composition',
  description: 'Calculate the percent composition by mass of each element in a compound. Use when the user asks for mass percent of elements in a formula.',
  input_schema: {
    type: 'object',
    properties: {
      formula: { type: 'string', description: 'Chemical formula (e.g., H2O, CO2)' },
    },
    required: ['formula'],
  },
  citation: CITATION,
  engine: 'percent-composition',
  execute: (input) => {
    if (typeof input.formula !== 'string' || input.formula.trim().length === 0) {
      return err('formula is required and must be a non-empty string')
    }
    const formula = input.formula.trim()
    if (!isValidStandaloneFormula(formula)) {
      return err(`Invalid chemical formula: "${formula}"`)
    }
    try {
      const composition = calculatePercentComposition(formula)
      const keys = Object.keys(composition)
      if (keys.length === 0) {
        return err('Percent composition produced no elements')
      }
      return finalizeResult({ formula, percent_composition: composition })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Percent composition calculation failed')
    }
  },
}

const calculate_empirical_formula: VerifiedTool = {
  name: 'calculate_empirical_formula',
  description: 'Calculate the empirical formula from element composition data (percent or mass). Use when the user provides percent composition or mass data and asks for the simplest formula.',
  input_schema: {
    type: 'object',
    properties: {
      composition: {
        type: 'array',
        description: 'Array of {element, percent} or {element, mass} entries',
        items: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Element symbol (e.g., C, H, O)' },
            percent: { type: 'number', description: 'Mass percent of this element' },
            mass: { type: 'number', description: 'Mass of this element (alternative to percent)' },
          },
          required: ['element'],
        },
      },
    },
    required: ['composition'],
  },
  citation: CITATION,
  engine: 'empirical-formula',
  execute: (input) => {
    if (!Array.isArray(input.composition) || input.composition.length === 0) {
      return err('composition must be a non-empty array')
    }
    const composition: Record<string, number> = {}
    const seen = new Set<string>()
    for (const item of input.composition) {
      if (!item || typeof item !== 'object') {
        return err('Each composition entry must be an object')
      }
      const element = String((item as Record<string, unknown>).element ?? '').trim()
      if (element.length === 0) {
        return err('Each composition entry must have an element symbol')
      }
      if (!ELEMENT_SYMBOLS.has(element)) {
        return err(`Unknown element symbol: "${element}"`)
      }
      if (seen.has(element)) {
        return err(`Duplicate element in composition: "${element}"`)
      }
      seen.add(element)
      const itemObj = item as Record<string, unknown>
      // Reject ambiguous entry by KEY PRESENCE (before parsing): an invalid or
      // subnormal value in one field must not let the other silently win.
      if (itemObj.percent !== undefined && itemObj.mass !== undefined) {
        return err(`Provide either percent or mass for ${element}, not both`)
      }
      const percent = readFiniteNumber(itemObj.percent)
      const mass = readFiniteNumber(itemObj.mass)
      const value = percent !== undefined ? percent : mass
      if (value === undefined || value <= 0) {
        return err(`Composition value for ${element} must be a positive finite number`)
      }
      composition[element] = value
    }
    try {
      const formula = calculateEmpiricalFormula(composition)
      // Postcondition: a valid empirical formula must be non-empty AND itself a
      // valid standalone formula. Subnormal/underflow percent values can make the
      // engine return "" — never sign an empty/garbage formula as VERIFIED.
      if (formula.length === 0 || !isValidStandaloneFormula(formula)) {
        return err('Could not determine a valid empirical formula from the given composition')
      }
      // Postcondition: verify by MOLE RATIO, not mass-%. Mass-% is a poor
      // discriminator (CH vs C13H14 differ <1% by mass yet are different molecules).
      // Compute the input mole ratio and the formula's atom ratio, normalize each by
      // its minimum, and require them to match — otherwise the engine's bounded
      // multiplier search produced a rounded-wrong formula → reject (never sign it).
      const inputMoles: Record<string, number> = {}
      for (const [el, v] of Object.entries(composition)) {
        const element = getElementBySymbol(el)
        if (!element || !(element.atomicMass > 0)) {
          return err(`Cannot resolve atomic mass for element "${el}"`)
        }
        inputMoles[el] = v / element.atomicMass
      }
      const formulaCounts = parseFormulaCounts(formula)
      const inputEls = Object.keys(inputMoles).sort()
      const formulaEls = Object.keys(formulaCounts).sort()
      if (inputEls.length !== formulaEls.length || !inputEls.every((e, i) => e === formulaEls[i])) {
        return err('Derived empirical formula elements do not match the input composition')
      }
      // The input mole ratio must RESOLVE to exactly the engine's formula at some
      // supported multiplier. For each q in 1..20: scale the normalized input ratios,
      // require every value within an ABSOLUTE tolerance of an integer (a relative or
      // q-scaled tolerance grows loose at large q and mis-accepts e.g. C21H62→CH3),
      // reduce by GCD, and require an EXACT match to the engine's counts. If no q
      // reproduces the engine formula, the true ratio needs a denominator beyond the
      // supported range (C21H62, C26H27, C50H51) → reject; never sign a wrong formula.
      // The 0.015 bound is below 1/66, so it rejects every n:(n+1)-style near-miss up
      // to n=66 (C50H51, C59H60 → CH) while still admitting coarse integer-mass input
      // (C12/H2/O16 → CH2O, ~0.014 residual). Ratios needing n≥67 would require
      // unrealistic measurement precision to distinguish and are out of scope.
      const minMole = Math.min(...Object.values(inputMoles))
      const normRatios = inputEls.map((el) => inputMoles[el] / minMole)
      let matchesEngine = false
      for (let q = 1; q <= 20; q++) {
        const scaled = normRatios.map((r) => r * q)
        if (!scaled.every((c) => Math.abs(c - Math.round(c)) <= 0.015)) continue
        const intCounts = scaled.map((c) => Math.round(c))
        if (intCounts.some((c) => c <= 0)) continue
        const g = intCounts.reduce((a, b) => gcdInt(a, b))
        const reduced = intCounts.map((c) => c / g)
        if (inputEls.every((el, i) => formulaCounts[el] === reduced[i])) {
          matchesEngine = true
          break
        }
      }
      if (!matchesEngine) {
        return err('The composition does not resolve to the derived formula within the supported multiplier range (the true ratio may need a larger denominator)')
      }
      return finalizeResult({ empirical_formula: formula })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Empirical formula calculation failed')
    }
  },
}

const mass_to_moles: VerifiedTool = {
  name: 'mass_to_moles',
  description: 'Convert mass to moles using molar mass. Use when the user asks to convert grams to moles.',
  input_schema: {
    type: 'object',
    properties: {
      mass: { type: 'number', description: 'Mass in grams (g)' },
      molar_mass: { type: 'number', description: 'Molar mass in g/mol' },
    },
    required: ['mass', 'molar_mass'],
  },
  citation: CITATION,
  engine: 'mass-to-moles',
  execute: (input) => {
    const mass = readFiniteNumber(input.mass)
    const molarMass = readFiniteNumber(input.molar_mass)
    if (mass === undefined || mass < 0) return err('mass must be a non-negative finite number')
    if (molarMass === undefined || molarMass <= 0) return err('molar_mass must be a positive finite number')
    try {
      const moles = massToMoles(mass, molarMass)
      return finalizeResult({ moles })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Mass-to-moles calculation failed')
    }
  },
}

const moles_to_mass: VerifiedTool = {
  name: 'moles_to_mass',
  description: 'Convert moles to mass using molar mass. Use when the user asks to convert moles to grams.',
  input_schema: {
    type: 'object',
    properties: {
      moles: { type: 'number', description: 'Amount in moles (mol)' },
      molar_mass: { type: 'number', description: 'Molar mass in g/mol' },
    },
    required: ['moles', 'molar_mass'],
  },
  citation: CITATION,
  engine: 'moles-to-mass',
  execute: (input) => {
    const moles = readFiniteNumber(input.moles)
    const molarMass = readFiniteNumber(input.molar_mass)
    if (moles === undefined || moles < 0) return err('moles must be a non-negative finite number')
    if (molarMass === undefined || molarMass <= 0) return err('molar_mass must be a positive finite number')
    try {
      const mass = molesToMass(moles, molarMass)
      return finalizeResult({ mass })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Moles-to-mass calculation failed')
    }
  },
}

const moles_to_molecules: VerifiedTool = {
  name: 'moles_to_molecules',
  description: 'Convert moles to number of molecules using Avogadro\'s constant. Use when the user asks how many molecules are in a given number of moles.',
  input_schema: {
    type: 'object',
    properties: {
      moles: { type: 'number', description: 'Amount in moles (mol)' },
    },
    required: ['moles'],
  },
  citation: CITATION,
  engine: 'moles-to-molecules',
  execute: (input) => {
    const moles = readFiniteNumber(input.moles)
    if (moles === undefined || moles < 0) return err('moles must be a non-negative finite number')
    try {
      const molecules = molesToMolecules(moles)
      return finalizeResult({ molecules, avogadro: AVOGADRO_CONSTANT })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Moles-to-molecules calculation failed')
    }
  },
}

const molecules_to_moles: VerifiedTool = {
  name: 'molecules_to_moles',
  description: 'Convert number of molecules to moles using Avogadro\'s constant. Use when the user asks how many moles are in a given number of molecules.',
  input_schema: {
    type: 'object',
    properties: {
      molecules: { type: 'number', description: 'Number of molecules' },
    },
    required: ['molecules'],
  },
  citation: CITATION,
  engine: 'molecules-to-moles',
  execute: (input) => {
    const molecules = readFiniteNumber(input.molecules)
    if (molecules === undefined || molecules < 0) return err('molecules must be a non-negative finite number')
    try {
      const moles = moleculesToMoles(molecules)
      return finalizeResult({ moles })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Molecules-to-moles calculation failed')
    }
  },
}

const moles_to_volume_stp: VerifiedTool = {
  name: 'moles_to_volume_stp',
  description: 'Convert moles of an ideal gas to volume at STP. Use when the user asks for gas volume at standard temperature and pressure.',
  input_schema: {
    type: 'object',
    properties: {
      moles: { type: 'number', description: 'Amount in moles (mol)' },
    },
    required: ['moles'],
  },
  citation: CITATION,
  engine: 'moles-to-volume-stp',
  execute: (input) => {
    const moles = readFiniteNumber(input.moles)
    if (moles === undefined || moles < 0) return err('moles must be a non-negative finite number')
    try {
      const volume_L = molesToVolumeSTP(moles)
      return finalizeResult({ volume_L, note: 'ideal gas at STP' })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Volume-at-STP calculation failed')
    }
  },
}

const volume_stp_to_moles: VerifiedTool = {
  name: 'volume_stp_to_moles',
  description: 'Convert volume of an ideal gas at STP to moles. Use when the user asks for moles from a gas volume at standard temperature and pressure.',
  input_schema: {
    type: 'object',
    properties: {
      volume_L: { type: 'number', description: 'Volume in liters (L)' },
    },
    required: ['volume_L'],
  },
  citation: CITATION,
  engine: 'volume-stp-to-moles',
  execute: (input) => {
    const volume = readFiniteNumber(input.volume_L)
    if (volume === undefined || volume < 0) return err('volume_L must be a non-negative finite number')
    try {
      const moles = volumeSTPToMoles(volume)
      return finalizeResult({ moles })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Volume-to-moles-at-STP calculation failed')
    }
  },
}

const find_limiting_reagent: VerifiedTool = {
  name: 'find_limiting_reagent',
  description: 'Find the limiting reagent in a chemical reaction given reactant amounts and stoichiometric coefficients. Use when the user asks which reactant runs out first.',
  input_schema: {
    type: 'object',
    properties: {
      reactants: {
        type: 'array',
        description: 'Reactants with formula, moles, and coefficient',
        items: {
          type: 'object',
          properties: {
            formula: { type: 'string' },
            moles: { type: 'number' },
            coefficient: { type: 'integer' },
          },
          required: ['formula', 'moles', 'coefficient'],
        },
      },
      products: {
        type: 'array',
        description: 'Products with formula and coefficient',
        items: {
          type: 'object',
          properties: {
            formula: { type: 'string' },
            coefficient: { type: 'integer' },
          },
          required: ['formula', 'coefficient'],
        },
      },
    },
    required: ['reactants', 'products'],
  },
  citation: CITATION,
  engine: 'limiting-reagent',
  execute: (input) => {
    if (!Array.isArray(input.reactants) || input.reactants.length === 0) {
      return err('reactants must be a non-empty array')
    }
    if (!Array.isArray(input.products) || input.products.length === 0) {
      return err('products must be a non-empty array')
    }

    try {
      const reactants: Array<{ formula: string; moles: number; coefficient: number }> = []
      for (const item of input.reactants) {
        if (!item || typeof item !== 'object') throw new Error('Each reactant must be an object')
        const r = item as Record<string, unknown>
        const formula = typeof r.formula === 'string' ? r.formula.trim() : ''
        if (formula.length === 0) throw new Error('Each reactant must have a formula')
        if (!isValidStandaloneFormula(formula)) throw new Error(`Invalid chemical formula: "${formula}"`)
        const moles = readFiniteNumber(r.moles)
        if (moles === undefined || moles < 0) throw new Error('Reactant moles must be non-negative finite numbers')
        const coefficient = requirePositiveInteger('coefficient', r.coefficient)
        if (coefficient === undefined) throw new Error('Reactant coefficient must be a positive integer')
        reactants.push({ formula, moles, coefficient })
      }

      const products: Array<{ formula: string; coefficient: number }> = []
      for (const item of input.products) {
        if (!item || typeof item !== 'object') throw new Error('Each product must be an object')
        const p = item as Record<string, unknown>
        const formula = typeof p.formula === 'string' ? p.formula.trim() : ''
        if (formula.length === 0) throw new Error('Each product must have a formula')
        if (!isValidStandaloneFormula(formula)) throw new Error(`Invalid chemical formula: "${formula}"`)
        const coefficient = requirePositiveInteger('coefficient', p.coefficient)
        if (coefficient === undefined) throw new Error('Product coefficient must be a positive integer')
        products.push({ formula, coefficient })
      }

      const result = findLimitingReagent({ reactants }, products)
      return finalizeResult({
        limiting_reagent: result.limitingReagent,
        limiting_reagent_moles: result.limitingReagentMoles,
        excess_reagents: result.excessReagents,
        moles_product_formed: result.molesProductFormed,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Limiting reagent calculation failed')
    }
  },
}

const calculate_theoretical_yield: VerifiedTool = {
  name: 'calculate_theoretical_yield',
  description: 'Calculate the theoretical yield of a product given the limiting reagent amount and stoichiometric coefficients. Use when the user asks for maximum possible product amount.',
  input_schema: {
    type: 'object',
    properties: {
      limiting_reagent_moles: { type: 'number', description: 'Moles of limiting reagent' },
      limiting_reagent_coefficient: { type: 'integer', description: 'Stoichiometric coefficient of limiting reagent' },
      product_coefficient: { type: 'integer', description: 'Stoichiometric coefficient of product' },
      product_formula: { type: 'string', description: 'Chemical formula of product' },
    },
    required: ['limiting_reagent_moles', 'limiting_reagent_coefficient', 'product_coefficient', 'product_formula'],
  },
  citation: CITATION,
  engine: 'theoretical-yield',
  execute: (input) => {
    const limitingMoles = readFiniteNumber(input.limiting_reagent_moles)
    const productFormula = typeof input.product_formula === 'string' ? input.product_formula.trim() : ''

    if (limitingMoles === undefined || limitingMoles < 0) return err('limiting_reagent_moles must be a non-negative finite number')
    if (productFormula.length === 0) return err('product_formula is required')
    if (!isValidStandaloneFormula(productFormula)) return err(`Invalid chemical formula: "${productFormula}"`)

    try {
      const limitingCoeff = requirePositiveInteger('limiting_reagent_coefficient', input.limiting_reagent_coefficient)
      const productCoeff = requirePositiveInteger('product_coefficient', input.product_coefficient)
      if (limitingCoeff === undefined) throw new Error('limiting_reagent_coefficient must be a positive integer')
      if (productCoeff === undefined) throw new Error('product_coefficient must be a positive integer')
      const result = calculateTheoreticalYield(limitingMoles, limitingCoeff, productCoeff, productFormula)
      return finalizeResult({ moles: result.moles, mass: result.mass })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Theoretical yield calculation failed')
    }
  },
}

const calculate_percent_yield: VerifiedTool = {
  name: 'calculate_percent_yield',
  description: 'Calculate percent yield from actual and theoretical yield. Use when the user asks for reaction yield percentage.',
  input_schema: {
    type: 'object',
    properties: {
      actual_yield: { type: 'number', description: 'Actual yield obtained (g or mol)' },
      theoretical_yield: { type: 'number', description: 'Theoretical yield (g or mol)' },
    },
    required: ['actual_yield', 'theoretical_yield'],
  },
  citation: CITATION,
  engine: 'percent-yield',
  execute: (input) => {
    const actual = readFiniteNumber(input.actual_yield)
    const theoretical = readFiniteNumber(input.theoretical_yield)
    if (actual === undefined || actual < 0) return err('actual_yield must be a non-negative finite number')
    if (theoretical === undefined || theoretical <= 0) return err('theoretical_yield must be a positive finite number')
    try {
      const percentYield = calculatePercentYield(actual, theoretical)
      const result: Record<string, unknown> = { percent_yield: percentYield }
      if (percentYield > 100) {
        result.note = 'Percent yield exceeds 100% — check measurements for errors'
      }
      return finalizeResult(result)
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Percent yield calculation failed')
    }
  },
}

export const stoichiometryTools: VerifiedTool[] = [
  calculate_molecular_mass,
  calculate_percent_composition,
  calculate_empirical_formula,
  mass_to_moles,
  moles_to_mass,
  moles_to_molecules,
  molecules_to_moles,
  moles_to_volume_stp,
  volume_stp_to_moles,
  find_limiting_reagent,
  calculate_theoretical_yield,
  calculate_percent_yield,
]
