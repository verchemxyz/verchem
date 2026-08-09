// VerChem - Solution Preparation Calculator
// Dilution (C1V1=C2V2), Stock Preparation, Serial Dilution,
// Concentration Unit Conversion, Mixing Solutions

// ============================================
// TYPES
// ============================================

export type ConcentrationUnit =
  | 'mol/L'
  | 'mmol/L'
  | 'g/L'
  | 'mg/L'
  | 'ug/L'
  | 'pct_wv'
  | 'pct_ww'
  | 'pct_vv'
  | 'N'
  | 'ppm'
  | 'ppb'

export interface DilutionInput {
  c1?: number
  v1?: number
  c2?: number
  v2?: number
}

export interface DilutionResult {
  c1: number
  v1: number
  c2: number
  v2: number
  solvedFor: string
}

export interface StockPrepInput {
  targetConc: number
  targetVolume: number
  /** Molar mass of the exact as-weighed reagent form, including hydrate/solvate. */
  molarMass?: number
  unit: ConcentrationUnit
  /** Solution density in g/mL at `preparationTemperatureC`. */
  solutionDensity?: number
  /** Equivalents per mole for the reaction/context that defines normality. */
  equivalentsFactor?: number
  /** Certificate-of-analysis assay/purity, expressed on `reagentPurityBasis`. */
  reagentPurityPercent: number
  reagentPurityBasis: 'mass' | 'volume'
  /** Exact material being measured, e.g. "CuSO4·5H2O" rather than "copper sulfate". */
  reagentForm: string
  /** Solvent identity. It is not inferred to be water. */
  solvent: string
  /** Temperature at which the target volume (and supplied density) applies. */
  preparationTemperatureC: number
}

export interface StockPrepResult {
  /**
   * How much solute to take. This is NOT always a mass — %v/v yields a VOLUME of
   * liquid solute. Always read it together with `amountUnit` / `measureBy`.
   */
  amount: number
  amountUnit: 'g' | 'mL'
  /** How the amount is measured out at the bench. */
  measureBy: 'mass' | 'volume'
  /**
   * Assumptions the caller must accept for this number to hold. Empty when the
   * result follows from the inputs alone.
   */
  assumptions: string[]
  workflow: 'dilution' | 'neat-material'
  model: {
    reagentForm: string
    reagentPurityPercent: number
    reagentPurityBasis: 'mass' | 'volume'
    solvent: string | null
    preparationTemperatureC: number
    molarMassBasis: 'exact-as-weighed-form' | null
    solutionDensity: number | null
    equivalentsFactor: number | null
  }
  steps: string[]
}

export interface SerialDilutionInput {
  initialConc: number
  dilutionFactor: number
  numDilutions: number
  transferVolume: number
}

export interface SerialDilutionStep {
  step: number
  concentration: number
  totalVolume: number
  transferVolume: number
  diluentVolume: number
}

export interface SerialDilutionResult {
  steps: SerialDilutionStep[]
}

export interface UnitConversionInput {
  value: number
  fromUnit: ConcentrationUnit
  toUnit: ConcentrationUnit
  molarMass?: number
  /** Density of the pure liquid solute, used for volume-fraction conversions. */
  soluteDensity?: number
  /** Density of the complete solution, used for mass-fraction conversions. */
  solutionDensity?: number
  /** Temperature at which every supplied density applies. */
  densityTemperatureC?: number
  equivalents?: number
}

export type ConcentrationBasis =
  | 'amount-concentration'
  | 'mass-concentration'
  | 'mass-fraction'
  | 'volume-fraction'

export interface ConversionRequirements {
  molarMass: boolean
  soluteDensity: boolean
  solutionDensity: boolean
  densityTemperature: boolean
  equivalents: boolean
}

export interface UnitConversionResult {
  value: number
  fromUnit: ConcentrationUnit
  toUnit: ConcentrationUnit
  convertedValue: number
  assumptions: string[]
  model: {
    fromBasis: ConcentrationBasis
    toBasis: ConcentrationBasis
    ppmPpbBasis: 'mass-fraction'
    molarMass: number | null
    soluteDensity: number | null
    solutionDensity: number | null
    densityTemperatureC: number | null
    equivalents: number | null
  }
}

export type MixingConcentrationUnit =
  | 'mol/L'
  | 'mmol/L'
  | 'g/L'
  | 'mg/L'
  | 'ug/L'
  | 'pct_wv'
  | 'N'

export type MixingVolumeBasis = 'measured-final' | 'additive-approximation'
export type MixingVolumeUnit = 'L' | 'mL'

export interface MixingInput {
  c1: number
  v1: number
  c2: number
  v2: number
  /** One shared solute/analyte identity for both solutions. */
  soluteIdentity: string
  /** One shared, volume-based concentration unit for C1 and C2. */
  concentrationUnit: MixingConcentrationUnit
  /** One explicit shared volume unit for v1, v2, and finalVolume. */
  volumeUnit: MixingVolumeUnit
  /** Required for N: the shared reaction/equivalent definition used by both inputs. */
  normalityContext?: string
  /** How the denominator volume is obtained. */
  volumeBasis: MixingVolumeBasis
  /** Required when `volumeBasis` is `measured-final`; same unit as v1/v2. */
  finalVolume?: number
  /** Explicit scope confirmation: no reaction, precipitation, volatilization, or loss. */
  noReactionOrLoss: boolean
}

export interface MixingResult {
  finalConc: number
  finalVolume: number
  assumptions: string[]
  model: {
    soluteIdentity: string
    concentrationUnit: MixingConcentrationUnit
    volumeUnit: MixingVolumeUnit
    normalityContext: string | null
    volumeBasis: MixingVolumeBasis
    noReactionOrLoss: true
  }
}

// ============================================
// CONSTANTS
// ============================================

/** Human-readable labels for concentration units */
export const UNIT_LABELS: Record<ConcentrationUnit, string> = {
  'mol/L': 'mol/L (M)',
  'mmol/L': 'mmol/L (mM)',
  'g/L': 'g/L',
  'mg/L': 'mg/L',
  'ug/L': '\u00B5g/L',
  'pct_wv': '% w/v',
  'pct_ww': '% w/w',
  'pct_vv': '% v/v',
  'N': 'N (Normality)',
  'ppm': 'ppm (mg/kg, mass fraction)',
  'ppb': 'ppb (\u00B5g/kg, mass fraction)',
}

/** Short labels without parenthetical descriptions */
export const UNIT_SHORT_LABELS: Record<ConcentrationUnit, string> = {
  'mol/L': 'M',
  'mmol/L': 'mM',
  'g/L': 'g/L',
  'mg/L': 'mg/L',
  'ug/L': '\u00B5g/L',
  'pct_wv': '% w/v',
  'pct_ww': '% w/w',
  'pct_vv': '% v/v',
  'N': 'N',
  'ppm': 'ppm',
  'ppb': 'ppb',
}

// ============================================
// 1. DILUTION CALCULATOR (C1V1 = C2V2)
// ============================================

/**
 * Solve for the missing variable in C1V1 = C2V2.
 * Exactly one of the four values must be undefined.
 * All concentrations are in the same unit; all volumes are in the same unit.
 */
export function solveDilution(input: DilutionInput): DilutionResult {
  const { c1, v1, c2, v2 } = input
  const missing: string[] = []

  if (c1 === undefined) missing.push('c1')
  if (v1 === undefined) missing.push('v1')
  if (c2 === undefined) missing.push('c2')
  if (v2 === undefined) missing.push('v2')

  if (missing.length !== 1) {
    throw new Error('Exactly one value must be left blank to solve.')
  }

  // Validate provided values are positive
  if (c1 !== undefined && c1 < 0) throw new Error('C1 must be non-negative.')
  if (v1 !== undefined && v1 < 0) throw new Error('V1 must be non-negative.')
  if (c2 !== undefined && c2 < 0) throw new Error('C2 must be non-negative.')
  if (v2 !== undefined && v2 < 0) throw new Error('V2 must be non-negative.')

  const solvedFor = missing[0]

  switch (solvedFor) {
    case 'c1': {
      if (v1 === 0) throw new Error('V1 cannot be zero when solving for C1.')
      const result = (c2! * v2!) / v1!
      return { c1: result, v1: v1!, c2: c2!, v2: v2!, solvedFor }
    }
    case 'v1': {
      if (c1 === 0) throw new Error('C1 cannot be zero when solving for V1.')
      const result = (c2! * v2!) / c1!
      return { c1: c1!, v1: result, c2: c2!, v2: v2!, solvedFor }
    }
    case 'c2': {
      if (v2 === 0) throw new Error('V2 cannot be zero when solving for C2.')
      const result = (c1! * v1!) / v2!
      return { c1: c1!, v1: v1!, c2: result, v2: v2!, solvedFor }
    }
    case 'v2': {
      if (c2 === 0) throw new Error('C2 cannot be zero when solving for V2.')
      const result = (c1! * v1!) / c2!
      return { c1: c1!, v1: v1!, c2: c2!, v2: result, solvedFor }
    }
    default:
      throw new Error('Unexpected solve-for variable.')
  }
}

// ============================================
// 2. STOCK SOLUTION PREPARATION
// ============================================

/** Primary references for the concentration model (not substance-specific SDS evidence). */
export const SOLUTION_PREP_REFERENCES = [
  'IUPAC Compendium of Chemical Terminology (Gold Book), DOI: 10.1351/goldbook — amount concentration, mass fraction, volume fraction, and relative molecular mass definitions.',
  'ISO 1042:1998, Laboratory glassware — One-mark volumetric flasks — volume is defined at the marked reference temperature.',
] as const

/**
 * Calculate the amount of the declared reagent form needed for a target
 * solution. Purity, hydrate/solvate form, solvent, temperature, density, and
 * normality equivalents are explicit inputs rather than hidden defaults.
 *
 * This is a material-balance calculation, not a substance-specific SOP. It does
 * not infer hazards, compatibility, heat of mixing, or a safe order of addition.
 */
export function calculateStockPrep(input: StockPrepInput): StockPrepResult {
  const {
    targetConc,
    targetVolume,
    molarMass,
    unit,
    solutionDensity,
    equivalentsFactor,
    reagentPurityPercent,
    reagentPurityBasis,
    reagentForm,
    solvent,
    preparationTemperatureC,
  } = input

  const usesMolarMass = unit === 'mol/L' || unit === 'mmol/L' || unit === 'N'
  const usesSolutionDensity = unit === 'pct_ww' || unit === 'ppm' || unit === 'ppb'
  const expectedPurityBasis: 'mass' | 'volume' = unit === 'pct_vv' ? 'volume' : 'mass'
  const isNeatMaterial =
    (unit === 'pct_vv' && targetConc === 100) ||
    (unit === 'pct_ww' && targetConc === 100) ||
    (unit === 'ppm' && targetConc === 1e6) ||
    (unit === 'ppb' && targetConc === 1e9)

  // Finiteness first: Infinity/NaN would otherwise flow into a bench instruction.
  if (!Number.isFinite(targetConc) || targetConc <= 0) {
    throw new Error('Target concentration must be a positive, finite number.')
  }
  if (!Number.isFinite(targetVolume) || targetVolume <= 0) {
    throw new Error('Target volume must be a positive, finite number.')
  }
  if (molarMass !== undefined && (!Number.isFinite(molarMass) || molarMass <= 0)) {
    throw new Error('Molar mass must be a positive, finite number when supplied.')
  }
  if (usesMolarMass && molarMass === undefined) {
    throw new Error('Molar mass of the exact as-weighed reagent form is required for this unit.')
  }
  if (solutionDensity !== undefined && (!Number.isFinite(solutionDensity) || solutionDensity <= 0)) {
    throw new Error('Solution density must be a positive, finite number.')
  }
  if (usesSolutionDensity && solutionDensity === undefined) {
    throw new Error(`Solution density at the preparation temperature is required for exact ${UNIT_SHORT_LABELS[unit]} stock preparation.`)
  }
  if (equivalentsFactor !== undefined && (!Number.isFinite(equivalentsFactor) || equivalentsFactor <= 0)) {
    throw new Error('Equivalents factor must be a positive, finite number.')
  }
  if (unit === 'N' && equivalentsFactor === undefined) {
    throw new Error('Equivalents factor is required for normality; it cannot be assumed from the formula alone.')
  }
  if (!Number.isFinite(reagentPurityPercent) || reagentPurityPercent <= 0 || reagentPurityPercent > 100) {
    throw new Error('Reagent purity/assay must be a positive, finite percentage no greater than 100%.')
  }
  if (reagentPurityBasis !== expectedPurityBasis) {
    throw new Error(`${UNIT_SHORT_LABELS[unit]} stock preparation requires reagent purity on a ${expectedPurityBasis} basis.`)
  }
  const normalizedReagentForm = normalizeModelText(reagentForm, 'Reagent form')
  const normalizedSolvent = normalizeModelText(
    solvent,
    isNeatMaterial ? 'Solvent field (use "none" for neat material)' : 'Solvent identity',
  )
  if (!Number.isFinite(preparationTemperatureC) || preparationTemperatureC <= -273.15) {
    throw new Error('Preparation temperature must be a finite value above absolute zero.')
  }
  // Percentage units are bounded by definition. Without this, 120% v/v happily
  // produces "measure 1200 mL into a 1 L flask".
  if ((unit === 'pct_vv' || unit === 'pct_ww' || unit === 'pct_wv') && targetConc > 100) {
    throw new Error('A percentage concentration cannot exceed 100%.')
  }
  if (unit === 'ppm' && targetConc > 1e6) {
    throw new Error('Mass-fraction ppm cannot exceed 1,000,000 ppm (100%).')
  }
  if (unit === 'ppb' && targetConc > 1e9) {
    throw new Error('Mass-fraction ppb cannot exceed 1,000,000,000 ppb (100%).')
  }
  if (isNeatMaterial && reagentPurityPercent !== 100) {
    throw new Error('A 100% target cannot be prepared from a reagent whose declared assay is below 100%.')
  }

  let amount: number
  let amountUnit: 'g' | 'mL' = 'g'
  let measureBy: 'mass' | 'volume' = 'mass'
  const steps: string[] = []

  switch (unit) {
    case 'mol/L': {
      // mass = M * C * V
      const moles = targetConc * targetVolume
      amount = moles * molarMass!
      steps.push(
        `Calculate moles needed: ${targetConc} mol/L \u00D7 ${targetVolume} L = ${formatNum(moles)} mol`
      )
      steps.push(
        `Calculate mass: ${formatNum(moles)} mol \u00D7 ${molarMass} g/mol = ${formatNum(amount)} g`
      )
      break
    }
    case 'mmol/L': {
      const molesPerL = targetConc / 1000
      const moles = molesPerL * targetVolume
      amount = moles * molarMass!
      steps.push(
        `Convert to mol/L: ${targetConc} mmol/L = ${formatNum(molesPerL)} mol/L`
      )
      steps.push(
        `Calculate moles: ${formatNum(molesPerL)} mol/L \u00D7 ${targetVolume} L = ${formatNum(moles)} mol`
      )
      steps.push(
        `Calculate mass: ${formatNum(moles)} mol \u00D7 ${molarMass} g/mol = ${formatNum(amount)} g`
      )
      break
    }
    case 'g/L': {
      amount = targetConc * targetVolume
      steps.push(
        `Calculate mass: ${targetConc} g/L \u00D7 ${targetVolume} L = ${formatNum(amount)} g`
      )
      break
    }
    case 'mg/L': {
      amount = (targetConc * targetVolume) / 1000
      steps.push(
        `Calculate mass: ${targetConc} mg/L \u00D7 ${targetVolume} L = ${formatNum(targetConc * targetVolume)} mg = ${formatNum(amount)} g`
      )
      break
    }
    case 'ug/L': {
      amount = (targetConc * targetVolume) / 1e6
      steps.push(
        `Calculate mass: ${targetConc} \u00B5g/L \u00D7 ${targetVolume} L = ${formatNum(targetConc * targetVolume)} \u00B5g = ${formatNum(amount)} g`
      )
      break
    }
    case 'ppm':
    case 'ppb': {
      const solutionMass = targetVolume * 1000 * solutionDensity!
      const divisor = unit === 'ppm' ? 1e6 : 1e9
      amount = (targetConc / divisor) * solutionMass
      steps.push(`${UNIT_SHORT_LABELS[unit]} is treated as an exact mass fraction, not as mg/L or \u00B5g/L.`)
      steps.push(
        `Solution mass = ${targetVolume} L \u00D7 1000 mL/L \u00D7 ${solutionDensity} g/mL = ${formatNum(solutionMass)} g at ${preparationTemperatureC} \u00B0C`
      )
      steps.push(
        `Pure-solute mass = (${targetConc}/${formatNum(divisor)}) \u00D7 ${formatNum(solutionMass)} g = ${formatNum(amount)} g`
      )
      break
    }
    case 'pct_wv': {
      // % w/v = g per 100 mL = g per 0.1 L => g = (%w/v) * V(L) * 10
      amount = targetConc * targetVolume * 10
      steps.push(
        `% w/v means ${targetConc} g per 100 mL`
      )
      steps.push(
        `Calculate mass: ${targetConc} g/100mL \u00D7 ${targetVolume} L \u00D7 1000 mL/L \u00D7 (1/100) = ${formatNum(amount)} g`
      )
      break
    }
    case 'pct_ww': {
      // % w/w is grams of solute per 100 g of solution; density converts the
      // requested final volume into the required total solution mass.
      const solutionMass = targetVolume * 1000 * solutionDensity! // g
      amount = (targetConc / 100) * solutionMass
      steps.push(
        `% w/w means ${targetConc} g of solute per 100 g of solution`
      )
      steps.push(
        `Solution mass = ${targetVolume} L \u00D7 1000 mL/L \u00D7 ${solutionDensity} g/mL = ${formatNum(solutionMass)} g at ${preparationTemperatureC} \u00B0C`
      )
      steps.push(
        `Mass of solute = (${targetConc}/100) \u00D7 ${formatNum(solutionMass)} g = ${formatNum(amount)} g`
      )
      break
    }
    case 'pct_vv': {
      // % v/v is mL of liquid solute per 100 mL of solution. The result is a
      // VOLUME \u2014 it must never be handed to the bench as a mass.
      amount = targetConc * targetVolume * 10 // mL
      amountUnit = 'mL'
      measureBy = 'volume'
      steps.push(
        `% v/v means ${targetConc} mL of liquid solute per 100 mL of solution`
      )
      steps.push(
        `Volume of solute = ${targetConc} mL/100mL \u00D7 ${formatNum(targetVolume * 1000)} mL = ${formatNum(amount)} mL`
      )
      break
    }
    case 'N': {
      // Normality (eq/L) -> moles requires the equivalents factor of the solute.
      const eqFactor = equivalentsFactor!
      const equivalents = targetConc * targetVolume // eq
      const moles = equivalents / eqFactor
      amount = moles * molarMass!
      steps.push(
        `Normality = Molarity \u00D7 equivalents factor`
      )
      steps.push(
        `Equivalents = ${targetConc} N \u00D7 ${targetVolume} L = ${formatNum(equivalents)} eq`
      )
      steps.push(
        `Moles = ${formatNum(equivalents)} eq \u00F7 ${eqFactor} eq/mol = ${formatNum(moles)} mol`
      )
      steps.push(
        `Mass = ${formatNum(moles)} mol \u00D7 ${molarMass} g/mol = ${formatNum(amount)} g`
      )
      break
    }
    default:
      throw new Error(`Unsupported unit: ${unit}`)
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Calculated pure-solute amount is outside the finite representable range.')
  }

  const pureAmount = amount
  const purityFraction = reagentPurityPercent / 100
  amount = pureAmount / purityFraction
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Purity-corrected reagent amount is outside the finite representable range.')
  }

  const finalAmountCapacity = measureBy === 'volume'
    ? targetVolume * 1000
    : usesSolutionDensity
      ? targetVolume * 1000 * solutionDensity!
      : undefined
  if (finalAmountCapacity !== undefined && amount > finalAmountCapacity * (1 + Number.EPSILON * 8)) {
    throw new Error('The declared reagent assay cannot produce the requested fraction within the target final amount.')
  }

  steps.push(
    `Apply ${formatNum(reagentPurityPercent)}% ${reagentPurityBasis}-basis assay: ${formatNum(pureAmount)} ${amountUnit} ÷ ${formatNum(purityFraction)} = ${formatNum(amount)} ${amountUnit} of ${normalizedReagentForm}`
  )

  const assumptions = [
    `Reagent assay is applied as a ${reagentPurityBasis} fraction to the named reagent form; this is valid only when the certificate of analysis uses that same basis (IUPAC Gold Book, DOI 10.1351/goldbook, mass/volume fraction definitions).`,
    `Final volume${usesSolutionDensity ? ' and solution density' : ''} is referenced to ${formatNum(preparationTemperatureC)} °C; this is valid only at that stated temperature and no thermal correction is inferred (ISO 1042:1998).`,
    'No reaction, volatilization, transfer loss, or substance-specific volume change is modeled; this material balance is valid only when the declared solute amount is conserved and is not a chemical safety procedure (Brown, LeMay & Bursten, Chemistry: The Central Science, 15th ed., Ch. 4 and 13).',
  ]
  if (usesMolarMass) {
    assumptions.splice(
      1,
      0,
      `The supplied molar mass is for the exact as-weighed form “${normalizedReagentForm}”, including its hydrate/solvate state; this is valid only for that specified chemical entity (IUPAC Gold Book, DOI 10.1351/goldbook, relative molecular mass).`
    )
  }
  if (unit === 'N') {
    assumptions.push(
      `Normality uses the explicitly supplied factor ${formatNum(equivalentsFactor!)} eq/mol; this result is valid only for the reaction or analytical context that defines that equivalent entity (IUPAC Gold Book, DOI 10.1351/goldbook, “equivalent entity”).`
    )
  }
  if (unit === 'ppm' || unit === 'ppb') {
    assumptions.push(
      `${UNIT_SHORT_LABELS[unit]} is interpreted as a mass fraction scaled by ${unit === 'ppm' ? '10⁶ (mg/kg)' : '10⁹ (µg/kg)'}; this result is valid only when the concentration is expressed on that mass/mass basis (IUPAC Gold Book, DOI 10.1351/goldbook, “parts per million”).`
    )
  }

  // Measurement guidance follows `measureBy`, but deliberately stops short of a
  // substance-specific SOP because identity alone cannot establish compatibility,
  // PPE, heat management, or a safe order of addition.
  steps.push('')
  steps.push('Measurement boundary (not a substance-specific SOP):')
  if (measureBy === 'mass') {
    steps.push(`Weigh ${formatNum(amount)} g of ${normalizedReagentForm} using equipment appropriate to the required uncertainty.`)
  } else {
    steps.push(`Measure ${formatNum(amount)} mL of ${normalizedReagentForm}; this is a volume, not a mass, and must not be weighed.`)
  }
  if (isNeatMaterial) {
    steps.push('No solvent is added: a 100% target is a neat-material result, not a dilution workflow.')
  } else {
    steps.push(`The calculation defines a final solution volume of ${formatVolume(targetVolume)} using ${normalizedSolvent} at ${formatNum(preparationTemperatureC)} °C; it does not prescribe mixing order.`)
    if (unit === 'pct_vv') {
      steps.push('Solute and solvent volumes are not assumed additive; the target is defined by the measured final solution volume.')
    }
  }
  steps.push(`Before preparation, use the SDS and an approved protocol for ${normalizedReagentForm} in ${isNeatMaterial ? 'neat form' : normalizedSolvent}; the engine does not infer hazards or compatibility.`)

  steps.push('')
  steps.push('Model scope:')
  assumptions.forEach((assumption) => steps.push(`• ${assumption}`))

  return {
    amount,
    amountUnit,
    measureBy,
    assumptions,
    workflow: isNeatMaterial ? 'neat-material' : 'dilution',
    model: {
      reagentForm: normalizedReagentForm,
      reagentPurityPercent,
      reagentPurityBasis,
      solvent: isNeatMaterial ? null : normalizedSolvent,
      preparationTemperatureC,
      molarMassBasis: usesMolarMass ? 'exact-as-weighed-form' : null,
      solutionDensity: usesSolutionDensity ? solutionDensity! : null,
      equivalentsFactor: unit === 'N' ? equivalentsFactor! : null,
    },
    steps,
  }
}

// ============================================
// 3. SERIAL DILUTION CALCULATOR
// ============================================

/**
 * Calculate a serial dilution series.
 *
 * @param input.initialConc - Starting concentration (any unit)
 * @param input.dilutionFactor - Factor for each dilution (e.g., 10 for 1:10)
 * @param input.numDilutions - Number of serial dilution steps
 * @param input.transferVolume - Volume transferred to the next tube (mL)
 */
export function calculateSerialDilution(input: SerialDilutionInput): SerialDilutionResult {
  const { initialConc, dilutionFactor, numDilutions, transferVolume } = input

  if (initialConc <= 0) throw new Error('Initial concentration must be positive.')
  if (dilutionFactor <= 1) throw new Error('Dilution factor must be greater than 1.')
  if (numDilutions < 1 || numDilutions > 50) throw new Error('Number of dilutions must be between 1 and 50.')
  if (transferVolume <= 0) throw new Error('Transfer volume must be positive.')

  const diluentVolume = transferVolume * (dilutionFactor - 1)
  const totalVolume = transferVolume + diluentVolume

  const steps: SerialDilutionStep[] = []

  // Step 0: the stock
  steps.push({
    step: 0,
    concentration: initialConc,
    totalVolume: 0, // stock, no mixing
    transferVolume: transferVolume,
    diluentVolume: 0,
  })

  let currentConc = initialConc

  for (let i = 1; i <= numDilutions; i++) {
    currentConc = currentConc / dilutionFactor
    steps.push({
      step: i,
      concentration: currentConc,
      totalVolume: totalVolume,
      transferVolume: i < numDilutions ? transferVolume : 0,
      diluentVolume: diluentVolume,
    })
  }

  return { steps }
}

// ============================================
// 4. CONCENTRATION UNIT CONVERTER
// ============================================

/** Return the physical basis represented by a display unit. */
export function getConcentrationBasis(unit: ConcentrationUnit): ConcentrationBasis {
  switch (unit) {
    case 'mol/L':
    case 'mmol/L':
    case 'N':
      return 'amount-concentration'
    case 'g/L':
    case 'mg/L':
    case 'ug/L':
    case 'pct_wv':
      return 'mass-concentration'
    case 'pct_ww':
    case 'ppm':
    case 'ppb':
      return 'mass-fraction'
    case 'pct_vv':
      return 'volume-fraction'
  }
}

/**
 * Derive only the physical properties actually needed to bridge two bases.
 * Same-basis conversions (for example ppm -> ppb or M -> mM) do not invent a
 * density or molar mass that cancels out algebraically.
 */
export function getConcentrationConversionRequirements(
  fromUnit: ConcentrationUnit,
  toUnit: ConcentrationUnit
): ConversionRequirements {
  const fromBasis = getConcentrationBasis(fromUnit)
  const toBasis = getConcentrationBasis(toUnit)
  const crossesBasis = fromBasis !== toBasis
  const soluteDensity = crossesBasis &&
    (fromBasis === 'volume-fraction' || toBasis === 'volume-fraction')
  const solutionDensity = crossesBasis &&
    (fromBasis === 'mass-fraction' || toBasis === 'mass-fraction')

  return {
    molarMass: crossesBasis &&
      (fromBasis === 'amount-concentration' || toBasis === 'amount-concentration'),
    soluteDensity,
    solutionDensity,
    densityTemperature: soluteDensity || solutionDensity,
    equivalents: fromUnit === 'N' || toUnit === 'N',
  }
}

/**
 * Convert concentration without equating mass fraction ppm/ppb to mg/L/ug/L.
 * The definitions are:
 * - ppm = mg/kg solution and ppb = ug/kg solution (mass fraction)
 * - mg/L and ug/L are mass concentration
 * Bridging those bases requires the measured solution density.
 */
export function convertConcentration(input: UnitConversionInput): UnitConversionResult {
  const {
    value,
    fromUnit,
    toUnit,
    molarMass,
    soluteDensity,
    solutionDensity,
    densityTemperatureC,
    equivalents,
  } = input

  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Concentration value must be a non-negative, finite number.')
  }
  validateOptionalPositive(molarMass, 'Molar mass')
  validateOptionalPositive(soluteDensity, 'Solute density')
  validateOptionalPositive(solutionDensity, 'Solution density')
  validateOptionalPositive(equivalents, 'Equivalents factor')
  if (densityTemperatureC !== undefined &&
      (!Number.isFinite(densityTemperatureC) || densityTemperatureC <= -273.15)) {
    throw new Error('Density temperature must be a finite value above absolute zero.')
  }
  validateFractionValue(value, fromUnit, 'Source')

  const requirements = getConcentrationConversionRequirements(fromUnit, toUnit)
  if (requirements.molarMass && molarMass === undefined) {
    throw new Error('Molar mass is required to bridge amount and mass concentration.')
  }
  if (requirements.soluteDensity && soluteDensity === undefined) {
    throw new Error('Solute density is required for a % v/v conversion.')
  }
  if (requirements.solutionDensity && solutionDensity === undefined) {
    throw new Error('Solution density is required for a mass-fraction conversion.')
  }
  if (requirements.densityTemperature && densityTemperatureC === undefined) {
    throw new Error('Density temperature is required whenever a density is used.')
  }
  if (requirements.equivalents && equivalents === undefined) {
    throw new Error('Equivalents factor is required for a normality conversion.')
  }

  const fromBasis = getConcentrationBasis(fromUnit)
  const toBasis = getConcentrationBasis(toUnit)
  const basisValue = toBasisValue(value, fromUnit, equivalents)
  const targetBasisValue = fromBasis === toBasis
    ? basisValue
    : massConcentrationToBasis(
      basisToMassConcentration(
        basisValue,
        fromBasis,
        molarMass,
        soluteDensity,
        solutionDensity
      ),
      toBasis,
      molarMass,
      soluteDensity,
      solutionDensity
    )
  const convertedValue = fromBasisValue(targetBasisValue, toUnit, equivalents)

  if (!Number.isFinite(convertedValue) || convertedValue < 0) {
    throw new Error('Converted concentration is outside the finite representable range.')
  }
  validateFractionValue(convertedValue, toUnit, 'Converted')

  const assumptions: string[] = []
  if (fromUnit === 'ppm' || fromUnit === 'ppb' || toUnit === 'ppm' || toUnit === 'ppb') {
    assumptions.push(
      'ppm and ppb are interpreted as mass fractions scaled by 10⁶ (mg/kg) and 10⁹ (µg/kg), respectively; this conversion is valid only for concentrations on that mass/mass basis (IUPAC Gold Book, DOI 10.1351/goldbook, “parts per million”).'
    )
  }
  if (requirements.molarMass) {
    assumptions.push(
      `The supplied molar mass ${formatNum(molarMass!)} g/mol is the amount-to-mass conversion factor; this result is valid only for the exact chemical entity/form to which that value applies (IUPAC Gold Book, DOI 10.1351/goldbook, relative molecular mass).`
    )
  }
  if (requirements.soluteDensity) {
    assumptions.push(
      `The supplied solute density ${formatNum(soluteDensity!)} g/mL is for the pure liquid solute at ${formatNum(densityTemperatureC!)} °C; the % v/v bridge is valid only for that material and temperature (IUPAC Gold Book, DOI 10.1351/goldbook, density and volume fraction definitions).`
    )
  }
  if (requirements.solutionDensity) {
    assumptions.push(
      `The supplied solution density ${formatNum(solutionDensity!)} g/mL is for the complete solution at ${formatNum(densityTemperatureC!)} °C; the mass-fraction bridge is valid only for that solution composition and temperature (IUPAC Gold Book, DOI 10.1351/goldbook, density and mass fraction definitions).`
    )
  }
  if (requirements.equivalents) {
    assumptions.push(
      `Normality uses the explicitly supplied factor ${formatNum(equivalents!)} eq/mol; this conversion is valid only for the reaction or analytical context that defines that equivalent entity (IUPAC Gold Book, DOI 10.1351/goldbook, “equivalent entity”).`
    )
  }

  return {
    value,
    fromUnit,
    toUnit,
    convertedValue,
    assumptions,
    model: {
      fromBasis,
      toBasis,
      ppmPpbBasis: 'mass-fraction',
      molarMass: requirements.molarMass ? molarMass! : null,
      soluteDensity: requirements.soluteDensity ? soluteDensity! : null,
      solutionDensity: requirements.solutionDensity ? solutionDensity! : null,
      densityTemperatureC: requirements.densityTemperature ? densityTemperatureC! : null,
      equivalents: requirements.equivalents ? equivalents! : null,
    },
  }
}

function toBasisValue(
  value: number,
  unit: ConcentrationUnit,
  equivalents?: number
): number {
  switch (unit) {
    case 'mol/L': return value
    case 'mmol/L': return value / 1000
    case 'N': return value / equivalents!
    case 'g/L': return value
    case 'mg/L': return value / 1000
    case 'ug/L': return value / 1e6
    case 'pct_wv': return value * 10
    case 'pct_ww': return value / 100
    case 'ppm': return value / 1e6
    case 'ppb': return value / 1e9
    case 'pct_vv': return value / 100
  }
}

function fromBasisValue(
  value: number,
  unit: ConcentrationUnit,
  equivalents?: number
): number {
  switch (unit) {
    case 'mol/L': return value
    case 'mmol/L': return value * 1000
    case 'N': return value * equivalents!
    case 'g/L': return value
    case 'mg/L': return value * 1000
    case 'ug/L': return value * 1e6
    case 'pct_wv': return value / 10
    case 'pct_ww': return value * 100
    case 'ppm': return value * 1e6
    case 'ppb': return value * 1e9
    case 'pct_vv': return value * 100
  }
}

function basisToMassConcentration(
  value: number,
  basis: ConcentrationBasis,
  molarMass?: number,
  soluteDensity?: number,
  solutionDensity?: number
): number {
  switch (basis) {
    case 'amount-concentration': return value * molarMass!
    case 'mass-concentration': return value
    case 'mass-fraction': return value * solutionDensity! * 1000
    case 'volume-fraction': return value * soluteDensity! * 1000
  }
}

function massConcentrationToBasis(
  value: number,
  basis: ConcentrationBasis,
  molarMass?: number,
  soluteDensity?: number,
  solutionDensity?: number
): number {
  switch (basis) {
    case 'amount-concentration': return value / molarMass!
    case 'mass-concentration': return value
    case 'mass-fraction': return value / (solutionDensity! * 1000)
    case 'volume-fraction': return value / (soluteDensity! * 1000)
  }
}

function validateFractionValue(
  value: number,
  unit: ConcentrationUnit,
  label: 'Source' | 'Converted'
): void {
  const upperBound = unit === 'pct_ww' || unit === 'pct_vv'
    ? 100
    : unit === 'ppm'
      ? 1e6
      : unit === 'ppb'
        ? 1e9
        : undefined
  if (upperBound !== undefined && value > upperBound * (1 + Number.EPSILON * 8)) {
    throw new Error(`${label} ${UNIT_SHORT_LABELS[unit]} concentration exceeds 100%.`)
  }
}

// ============================================
// 5. MIXING SOLUTIONS
// ============================================

const MIXING_CONCENTRATION_UNITS = new Set<MixingConcentrationUnit>([
  'mol/L', 'mmol/L', 'g/L', 'mg/L', 'ug/L', 'pct_wv', 'N',
])

export function isMixingConcentrationUnit(value: string): value is MixingConcentrationUnit {
  return MIXING_CONCENTRATION_UNITS.has(value as MixingConcentrationUnit)
}

/**
 * Material balance for two solutions of one named solute in one shared,
 * volume-based concentration unit. The final volume is either measured or is
 * explicitly labelled as an additive-volume approximation.
 */
export function calculateMixing(input: MixingInput): MixingResult {
  const {
    c1,
    v1,
    c2,
    v2,
    soluteIdentity,
    concentrationUnit,
    volumeUnit,
    normalityContext,
    volumeBasis,
    finalVolume: measuredFinalVolume,
    noReactionOrLoss,
  } = input

  for (const [name, value] of [['C1', c1], ['V1', v1], ['C2', c2], ['V2', v2]] as const) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a non-negative, finite number.`)
    }
  }
  if (v1 + v2 === 0) throw new Error('Total input volume cannot be zero.')

  const normalizedSoluteIdentity = normalizeModelText(soluteIdentity, 'Solute identity')
  if (!isMixingConcentrationUnit(concentrationUnit)) {
    throw new Error('Mixing requires one shared volume-based concentration unit (M, mM, g/L, mg/L, ug/L, % w/v, or N).')
  }
  if (volumeUnit !== 'L' && volumeUnit !== 'mL') {
    throw new Error('Mixing volume unit must be explicitly declared as L or mL.')
  }
  const normalizedNormalityContext = concentrationUnit === 'N'
    ? normalizeModelText(normalityContext!, 'Normality reaction/equivalence context')
    : null
  if (concentrationUnit !== 'N' && normalityContext !== undefined) {
    throw new Error('normalityContext is accepted only when concentrationUnit is N.')
  }
  if (noReactionOrLoss !== true) {
    throw new Error('This model requires explicit confirmation that no reaction, precipitation, volatilization, or solute loss occurs.')
  }

  let finalVolume: number
  if (volumeBasis === 'measured-final') {
    if (measuredFinalVolume === undefined || !Number.isFinite(measuredFinalVolume) || measuredFinalVolume <= 0) {
      throw new Error('A positive, finite measured final volume is required for measured-final mixing.')
    }
    finalVolume = measuredFinalVolume
  } else if (volumeBasis === 'additive-approximation') {
    if (measuredFinalVolume !== undefined) {
      throw new Error('Do not provide finalVolume when using the additive-volume approximation.')
    }
    finalVolume = v1 + v2
  } else {
    throw new Error('Volume basis must be measured-final or additive-approximation.')
  }

  const finalConc = (c1 * v1 + c2 * v2) / finalVolume
  if (!Number.isFinite(finalConc)) {
    throw new Error('Final concentration is outside the finite representable range.')
  }

  const assumptions = [
    `C×V is conserved only for the named solute “${normalizedSoluteIdentity}” in the shared ${UNIT_SHORT_LABELS[concentrationUnit]} basis, with every volume expressed in ${volumeUnit} and no reaction or loss; this scope is explicitly confirmed by the input (Brown, LeMay & Bursten, Chemistry: The Central Science, 15th ed., Ch. 4 and 13).`,
  ]
  if (normalizedNormalityContext !== null) {
    assumptions.push(
      `Both normality values use the same declared context “${normalizedNormalityContext}”; this material balance is valid only when both inputs use that identical equivalent-entity definition (IUPAC Gold Book, DOI 10.1351/goldbook, “equivalent entity”).`
    )
  }
  if (volumeBasis === 'additive-approximation') {
    assumptions.push(
      'Final volume is approximated as V1 + V2; this is valid only when contraction or expansion on mixing is negligible (Atkins & de Paula, Physical Chemistry, 11th ed., partial molar quantities).'
    )
  }

  return {
    finalConc,
    finalVolume,
    assumptions,
    model: {
      soluteIdentity: normalizedSoluteIdentity,
      concentrationUnit,
      volumeUnit,
      normalityContext: normalizedNormalityContext,
      volumeBasis,
      noReactionOrLoss: true,
    },
  }
}

// ============================================
// HELPERS
// ============================================

function validateOptionalPositive(value: number | undefined, label: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
    throw new Error(`${label} must be a positive, finite number when supplied.`)
  }
}

function normalizeModelText(value: string, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} is required.`)
  const normalized = value.trim()
  if (normalized.length === 0) throw new Error(`${label} is required.`)
  if (normalized.length > 160) throw new Error(`${label} must not exceed 160 characters.`)
  if (/[\x00-\x1F\x7F]/.test(normalized)) throw new Error(`${label} contains control characters.`)
  return normalized
}

/** Format a number to a reasonable number of significant figures */
function formatNum(n: number): string {
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 100) return n.toFixed(2)
  if (abs >= 1) return n.toFixed(4)
  if (abs >= 0.001) return n.toFixed(6)
  return n.toExponential(4)
}

/** Format volume in liters to a human-readable string */
function formatVolume(liters: number): string {
  if (liters >= 1) return `${liters} L`
  return `${liters * 1000} mL`
}
