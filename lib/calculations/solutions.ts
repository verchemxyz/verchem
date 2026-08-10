// VerChem - Solution Chemistry Calculations
// Molarity, pH, buffers, dilution

/**
 * Colligative property constants for water
 */
export const WATER_KB = 0.512 // °C/m - Boiling point elevation constant
export const WATER_KF = 1.86 // °C/m - Freezing point depression constant
export const WATER_NORMAL_BP = 100 // °C - Normal boiling point
export const WATER_NORMAL_FP = 0 // °C - Normal freezing point

/**
 * Fixed pH model used by the educational engine and every signed/API payload.
 * It intentionally exposes the approximation instead of presenting a
 * concentration calculation as a thermodynamic activity measurement.
 */
export const PH_MODEL_25C = {
  id: 'aqueous-ideal-dilute-25C',
  solvent: 'water',
  temperatureC: 25,
  kw: 1.0e-14,
  pKw: 14.0,
  neutralPH: 7.0,
  activityModel: 'concentration-as-activity',
  assumptions: [
    'Kw = 1.0×10^-14 and pH + pOH = 14.00 are used only for aqueous solution at 25 °C (Brown, LeMay & Bursten, Chemistry: The Central Science, 15th ed., Ch. 16).',
    'Hydrogen-ion molar concentration is substituted for hydrogen-ion activity; this is valid only for an ideal-dilute aqueous model where the activity coefficient is treated as 1 (IUPAC Gold Book, DOI 10.1351/goldbook, “pH”).',
  ],
  references: [
    'IUPAC Compendium of Chemical Terminology (Gold Book), DOI: 10.1351/goldbook — pH is defined from hydrogen-ion activity.',
    'Brown, LeMay & Bursten, Chemistry: The Central Science, 15th ed., Ch. 16 — introductory aqueous equilibrium model at 25 °C.',
  ],
} as const

export const KW_25C = PH_MODEL_25C.kw
export const NEUTRAL_PH = PH_MODEL_25C.neutralPH

/**
 * Applicability guardrail for the full weak-electrolyte equilibrium solver.
 *
 * This is an educational concentration-as-activity model, not an activity-
 * corrected thermodynamic model. Above 0.1 M, callers must supply an explicit
 * activity model instead of silently extending the ideal-dilute assumption.
 */
export const WEAK_ELECTROLYTE_MODEL_25C = {
  id: 'aqueous-ideal-dilute-monoprotic-25C',
  regime: 'ideal-dilute',
  solvent: PH_MODEL_25C.solvent,
  temperatureC: PH_MODEL_25C.temperatureC,
  kw: PH_MODEL_25C.kw,
  activityModel: PH_MODEL_25C.activityModel,
  analyteScope: 'single monoprotic weak acid or weak base without a common ion or competing equilibrium',
  concentrationRangeM: {
    minExclusive: 0,
    maxInclusive: 0.1,
  },
  equilibriumConstantRange: {
    minExclusive: 0,
    maxInclusive: 1,
  },
} as const

export type WeakElectrolyteApplicability = typeof WEAK_ELECTROLYTE_MODEL_25C

export function assertSupportedPHModelScope(
  temperatureC: number = PH_MODEL_25C.temperatureC,
  activityModel: string = PH_MODEL_25C.activityModel
): void {
  if (!Number.isFinite(temperatureC) || temperatureC !== PH_MODEL_25C.temperatureC) {
    throw new Error('This pH model supports only aqueous solutions at 25 °C; supply an activity model with temperature-dependent constants for other temperatures.')
  }
  if (activityModel !== PH_MODEL_25C.activityModel) {
    throw new Error(`Unsupported activity model: "${activityModel}". This engine supports only the declared concentration-as-activity ideal-dilute model.`)
  }
}

/**
 * Calculate molarity (M = mol/L)
 */
export function calculateMolarity(
  moles?: number,
  volumeLiters?: number,
  massGrams?: number,
  molarMass?: number
): number {
  if (moles !== undefined && volumeLiters !== undefined) {
    if (!Number.isFinite(moles) || moles < 0) throw new Error('Moles must be a finite, non-negative number')
    if (!Number.isFinite(volumeLiters) || volumeLiters <= 0) throw new Error('Volume must be a positive, finite number')
    const result = moles / volumeLiters
    if (!Number.isFinite(result)) throw new Error('Molarity is outside the finite representable range')
    return result
  }

  if (massGrams !== undefined && molarMass !== undefined && volumeLiters !== undefined) {
    if (!Number.isFinite(massGrams) || massGrams < 0) throw new Error('Mass must be a finite, non-negative number')
    if (!Number.isFinite(molarMass) || molarMass <= 0) throw new Error('Molar mass must be a positive, finite number')
    if (!Number.isFinite(volumeLiters) || volumeLiters <= 0) throw new Error('Volume must be a positive, finite number')
    const moles = massGrams / molarMass
    const result = moles / volumeLiters
    if (!Number.isFinite(result)) throw new Error('Molarity is outside the finite representable range')
    return result
  }

  throw new Error('Insufficient parameters to calculate molarity')
}

/**
 * Calculate molality (m = mol/kg solvent)
 */
export function calculateMolality(
  moles: number,
  solventMassKg: number
): number {
  return moles / solventMassKg
}

/**
 * Calculate mass percent
 */
export function calculateMassPercent(
  soluteMass: number,
  solutionMass: number
): number {
  return (soluteMass / solutionMass) * 100
}

/**
 * Calculate exact mass-fraction ppm. By definition, 1 mg/kg = 1 ppm.
 * A volume denominator is intentionally not accepted because mg/L equals ppm
 * only under an explicit density approximation.
 */
export function calculatePPM(
  soluteMassMg: number,
  solutionMassKg: number
): number {
  if (!Number.isFinite(soluteMassMg) || soluteMassMg < 0) {
    throw new Error('Solute mass must be a non-negative, finite number.')
  }
  if (!Number.isFinite(solutionMassKg) || solutionMassKg <= 0) {
    throw new Error('Solution mass must be a positive, finite number.')
  }
  if (soluteMassMg > solutionMassKg * 1e6) {
    throw new Error('Solute mass cannot exceed total solution mass.')
  }
  const ppm = soluteMassMg / solutionMassKg
  if (!Number.isFinite(ppm)) {
    throw new Error('Mass-fraction ppm is outside the finite representable range.')
  }
  return ppm
}

/**
 * pH Calculations
 */

/**
 * Calculate the ideal-dilute 25 °C model pH from H+ molar concentration.
 * Thermodynamic pH is defined from activity; see PH_MODEL_25C.
 */
export function calculatePH(H_concentration: number): number {
  if (!Number.isFinite(H_concentration) || H_concentration <= 0) {
    throw new Error('H+ concentration must be a positive, finite number')
  }
  return -Math.log10(H_concentration)
}

/**
 * Calculate H+ concentration from pH
 */
export function calculateH_Concentration(pH: number): number {
  if (!Number.isFinite(pH)) throw new Error('pH must be finite')
  const concentration = Math.pow(10, -pH)
  if (!Number.isFinite(concentration) || concentration <= 0) {
    throw new Error('H+ concentration is outside the positive finite representable range')
  }
  return concentration
}

/**
 * Calculate pOH from OH- concentration
 */
export function calculatePOH(OH_concentration: number): number {
  if (!Number.isFinite(OH_concentration) || OH_concentration <= 0) {
    throw new Error('OH- concentration must be a positive, finite number')
  }
  return -Math.log10(OH_concentration)
}

/**
 * Calculate OH- concentration from pOH
 */
export function calculateOH_Concentration(pOH: number): number {
  if (!Number.isFinite(pOH)) throw new Error('pOH must be finite')
  const concentration = Math.pow(10, -pOH)
  if (!Number.isFinite(concentration) || concentration <= 0) {
    throw new Error('OH- concentration is outside the positive finite representable range')
  }
  return concentration
}

/**
 * Convert between pH and pOH (at 25°C)
 */
export function pHToPOH(pH: number): number {
  if (!Number.isFinite(pH)) throw new Error('pH must be finite')
  return PH_MODEL_25C.pKw - pH
}

export function pOHToPH(pOH: number): number {
  if (!Number.isFinite(pOH)) throw new Error('pOH must be finite')
  return PH_MODEL_25C.pKw - pOH
}

export type PHConversionSource = 'ph' | 'poh' | 'h-concentration' | 'oh-concentration'

export interface PHConversionResult {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
}

/**
 * Resolve pH, pOH, [H+] and [OH-] from any one of those four values using the
 * single declared 25 °C ideal-dilute model. UI and public API callers share
 * this function so neither surface can drift back to literal 14/7 constants.
 */
export function calculatePHConversion(
  source: PHConversionSource,
  value: number
): PHConversionResult {
  if (!Number.isFinite(value)) throw new Error('Input must be a finite number')

  let pH: number
  let pOH: number
  let H_concentration: number
  let OH_concentration: number

  switch (source) {
    case 'ph':
      pH = value
      pOH = pHToPOH(pH)
      H_concentration = calculateH_Concentration(pH)
      OH_concentration = calculateOH_Concentration(pOH)
      break
    case 'poh':
      pOH = value
      pH = pOHToPH(pOH)
      H_concentration = calculateH_Concentration(pH)
      OH_concentration = calculateOH_Concentration(pOH)
      break
    case 'h-concentration':
      H_concentration = value
      pH = calculatePH(H_concentration)
      pOH = pHToPOH(pH)
      OH_concentration = calculateOH_Concentration(pOH)
      break
    case 'oh-concentration':
      OH_concentration = value
      pOH = calculatePOH(OH_concentration)
      pH = pOHToPH(pOH)
      H_concentration = calculateH_Concentration(pH)
      break
  }

  if (
    !Number.isFinite(pH) ||
    !Number.isFinite(pOH) ||
    !Number.isFinite(H_concentration) ||
    !Number.isFinite(OH_concentration) ||
    H_concentration <= 0 ||
    OH_concentration <= 0
  ) {
    throw new Error('Input is outside the positive finite representable range')
  }

  return { pH, pOH, H_concentration, OH_concentration }
}

export interface StrongAcidOptions {
  formula?: string
  protonCount?: number
}

export interface StrongBaseOptions {
  formula?: string
  hydroxideCount?: number
}

export interface StrongSpeciesResolution {
  identity: string
  identitySource: 'recognized-formula' | 'explicit-ion-count'
  ion: 'H+' | 'OH-'
  stoichiometricFactor: number
  effectiveIonFactor: number | null
  secondDissociationKa: number | null
}

const STRONG_ACID_PROTON_COUNTS: Record<string, number> = {
  HCl: 1,
  HNO3: 1,
  HBr: 1,
  HI: 1,
  HClO4: 1,
  H2SO4: 2,
}

const STRONG_ACID_SECOND_DISSOCIATION_KA: Record<string, number> = {
  H2SO4: 1.2e-2,
}

const STRONG_BASE_HYDROXIDE_COUNTS: Record<string, number> = {
  NaOH: 1,
  KOH: 1,
  LiOH: 1,
  'Ca(OH)2': 2,
  'Ba(OH)2': 2,
}

function normalizeFormula(formula: string): string {
  const subscriptMap: Record<string, string> = {
    '₀': '0',
    '₁': '1',
    '₂': '2',
    '₃': '3',
    '₄': '4',
    '₅': '5',
    '₆': '6',
    '₇': '7',
    '₈': '8',
    '₉': '9',
  }
  const normalized = formula
    .replace(/\s+/g, '')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (match) => subscriptMap[match] ?? match)

  if (!/^[A-Za-z0-9()]+$/.test(normalized)) {
    throw new Error('Chemical formulas must use ASCII element symbols, digits, and parentheses')
  }

  return normalized
}

function solveWithWaterAutoIonization(addedConcentration: number, kw: number): number {
  if (!Number.isFinite(addedConcentration) || addedConcentration < 0) {
    throw new Error('Added ion concentration must be finite and non-negative')
  }
  // Algebraically equivalent to 0.5 × (c + sqrt(c² + 4Kw)), but this
  // arrangement avoids overflowing c² for large finite concentrations.
  const half = addedConcentration / 2
  const result = half + Math.hypot(half, Math.sqrt(kw))
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error('Ion concentration is outside the positive finite representable range')
  }
  return result
}

function requirePositiveIntegerFactor(value: number, label: string): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite integer`)
  }
  return value
}

function resolveStrongAcidHydrogen(
  concentration: number,
  options?: StrongAcidOptions
): { addedConcentration: number; resolved: StrongSpeciesResolution } {
  const normalized = options?.formula !== undefined ? normalizeFormula(options.formula) : ''
  const explicitCount = options?.protonCount

  if (!normalized && explicitCount === undefined) {
    throw new Error('A recognized strong-acid formula or an explicit proton_count is required')
  }

  if (explicitCount !== undefined) requirePositiveIntegerFactor(explicitCount, 'proton_count')

  if (normalized) {
    const formulaCount = STRONG_ACID_PROTON_COUNTS[normalized]
    if (formulaCount === undefined) {
      throw new Error(`"${options?.formula}" is not a recognized strong acid`)
    }
    if (explicitCount !== undefined && explicitCount !== formulaCount) {
      throw new Error(`proton_count (${explicitCount}) does not match ${normalized}; expected ${formulaCount}`)
    }

    let addedConcentration = concentration * formulaCount
    const secondDissociationKa = STRONG_ACID_SECOND_DISSOCIATION_KA[normalized] ?? null
    if (secondDissociationKa !== null && concentration > 0) {
      const Ka2 = secondDissociationKa
      const b = concentration + Ka2
      const discriminant = b * b + 4 * Ka2 * concentration
      const x = (-b + Math.sqrt(discriminant)) / 2
      addedConcentration = concentration + Math.max(0, x)
    }
    if (!Number.isFinite(addedConcentration)) throw new Error('Strong-acid ion concentration is not finite')
    return {
      addedConcentration,
      resolved: {
        identity: normalized,
        identitySource: 'recognized-formula',
        ion: 'H+',
        stoichiometricFactor: formulaCount,
        effectiveIonFactor: concentration > 0 ? addedConcentration / concentration : null,
        secondDissociationKa,
      },
    }
  }

  const protonCount = requirePositiveIntegerFactor(explicitCount as number, 'proton_count')
  const addedConcentration = concentration * protonCount
  if (!Number.isFinite(addedConcentration)) throw new Error('Strong-acid ion concentration is not finite')
  return {
    addedConcentration,
    resolved: {
      identity: `generic strong acid (${protonCount} H+ per formula unit)`,
      identitySource: 'explicit-ion-count',
      ion: 'H+',
      stoichiometricFactor: protonCount,
      effectiveIonFactor: protonCount,
      secondDissociationKa: null,
    },
  }
}

function resolveStrongBaseHydroxide(
  concentration: number,
  options?: StrongBaseOptions
): { addedConcentration: number; resolved: StrongSpeciesResolution } {
  const normalized = options?.formula !== undefined ? normalizeFormula(options.formula) : ''
  const explicitCount = options?.hydroxideCount

  if (!normalized && explicitCount === undefined) {
    throw new Error('A recognized strong-base formula or an explicit hydroxide_count is required')
  }
  if (explicitCount !== undefined) requirePositiveIntegerFactor(explicitCount, 'hydroxide_count')

  if (normalized) {
    const formulaCount = STRONG_BASE_HYDROXIDE_COUNTS[normalized]
    if (formulaCount === undefined) {
      throw new Error(`"${options?.formula}" is not a recognized strong base`)
    }
    if (explicitCount !== undefined && explicitCount !== formulaCount) {
      throw new Error(`hydroxide_count (${explicitCount}) does not match ${normalized}; expected ${formulaCount}`)
    }
    const addedConcentration = concentration * formulaCount
    if (!Number.isFinite(addedConcentration)) throw new Error('Strong-base ion concentration is not finite')
    return {
      addedConcentration,
      resolved: {
        identity: normalized,
        identitySource: 'recognized-formula',
        ion: 'OH-',
        stoichiometricFactor: formulaCount,
        effectiveIonFactor: formulaCount,
        secondDissociationKa: null,
      },
    }
  }

  const hydroxideCount = requirePositiveIntegerFactor(explicitCount as number, 'hydroxide_count')
  const addedConcentration = concentration * hydroxideCount
  if (!Number.isFinite(addedConcentration)) throw new Error('Strong-base ion concentration is not finite')
  return {
    addedConcentration,
    resolved: {
      identity: `generic strong base (${hydroxideCount} OH- per formula unit)`,
      identitySource: 'explicit-ion-count',
      ion: 'OH-',
      stoichiometricFactor: hydroxideCount,
      effectiveIonFactor: hydroxideCount,
      secondDissociationKa: null,
    },
  }
}

/**
 * Strong acid pH calculation
 */
export function calculateStrongAcidPH(
  concentration: number,
  options?: StrongAcidOptions
): {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
  resolved: StrongSpeciesResolution
} {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new Error('Concentration must be a finite, non-negative number')
  }

  const { addedConcentration, resolved } = resolveStrongAcidHydrogen(concentration, options)
  const H_concentration = solveWithWaterAutoIonization(addedConcentration, KW_25C)
  const pH = calculatePH(H_concentration)
  const OH_concentration = KW_25C / H_concentration
  const pOH = calculatePOH(OH_concentration)

  return { pH, pOH, H_concentration, OH_concentration, resolved }
}

/**
 * Strong base pH calculation
 */
export function calculateStrongBasePH(
  concentration: number,
  options?: StrongBaseOptions
): {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
  resolved: StrongSpeciesResolution
} {
  if (!Number.isFinite(concentration) || concentration < 0) {
    throw new Error('Concentration must be a finite, non-negative number')
  }

  const { addedConcentration, resolved } = resolveStrongBaseHydroxide(concentration, options)
  const OH_concentration = solveWithWaterAutoIonization(addedConcentration, KW_25C)
  const pOH = calculatePOH(OH_concentration)
  const H_concentration = KW_25C / OH_concentration
  const pH = calculatePH(H_concentration)

  return { pH, pOH, H_concentration, OH_concentration, resolved }
}

const ROOT_RELATIVE_TOLERANCE = 32 * Number.EPSILON

/**
 * Solve the full monoprotic weak-electrolyte equilibrium for the primary ion:
 * H+ for HA, or OH- for B.
 *
 * Mass balance + electroneutrality + Kw give
 *   x^3 + Kx^2 - (Kw + KC)x - KKw = 0.
 * The polynomial is scaled by sqrt(Kw), then solved with safeguarded Newton
 * iterations and a bisection fallback. The physical root is bracketed between
 * pure-water ion concentration and C + sqrt(Kw).
 */
function solveMonoproticWeakElectrolyteIon(
  concentration: number,
  equilibriumConstant: number,
  constantLabel: 'Ka' | 'Kb'
): number {
  const { maxInclusive: maxConcentration } = WEAK_ELECTROLYTE_MODEL_25C.concentrationRangeM
  if (!Number.isFinite(concentration) || concentration <= 0) {
    throw new Error('Concentration must be a positive, finite number')
  }
  if (concentration > maxConcentration) {
    throw new Error(
      `Concentration ${concentration} M is outside this ideal-dilute model (0 < C <= ${maxConcentration} M); use an activity-corrected model.`
    )
  }

  const { maxInclusive: maxEquilibriumConstant } = WEAK_ELECTROLYTE_MODEL_25C.equilibriumConstantRange
  if (!Number.isFinite(equilibriumConstant) || equilibriumConstant <= 0) {
    throw new Error(`${constantLabel} must be a positive, finite number`)
  }
  if (equilibriumConstant > maxEquilibriumConstant) {
    throw new Error(
      `${constantLabel} = ${equilibriumConstant} is outside the monoprotic weak-electrolyte model (0 < ${constantLabel} <= ${maxEquilibriumConstant}); use the appropriate strong-electrolyte model.`
    )
  }

  const waterIon = Math.sqrt(KW_25C)
  const scaledConcentration = concentration / waterIon
  const scaledConstant = equilibriumConstant / waterIon

  // y = x/sqrt(Kw): y^3 + ky^2 - (1 + kc)y - k = 0.
  const polynomial = (y: number): number =>
    y * y * y + scaledConstant * y * y -
    (1 + scaledConstant * scaledConcentration) * y - scaledConstant
  const derivative = (y: number): number =>
    3 * y * y + 2 * scaledConstant * y -
    (1 + scaledConstant * scaledConcentration)
  const residualScale = (y: number): number =>
    Math.abs(y * y * y) +
    Math.abs(scaledConstant * y * y) +
    Math.abs((1 + scaledConstant * scaledConcentration) * y) +
    Math.abs(scaledConstant)

  let lower = 1
  let upper = Math.max(2, 1 + scaledConcentration)
  let upperResidual = polynomial(upper)
  for (let expansion = 0; upperResidual <= 0 && expansion < 64; expansion += 1) {
    upper *= 2
    upperResidual = polynomial(upper)
  }
  if (!Number.isFinite(upperResidual) || upperResidual <= 0) {
    throw new Error('Unable to bracket the weak-electrolyte equilibrium root')
  }

  // Stable positive quadratic root supplies a close Newton starting point;
  // hypot adds the pure-water contribution without an approximation branch.
  const product = scaledConstant * scaledConcentration
  const quadraticIon = product === 0
    ? 0
    : (2 * product) /
      (scaledConstant + Math.hypot(scaledConstant, 2 * Math.sqrt(product)))
  let estimate = Math.min(upper, Math.max(lower, Math.hypot(1, quadraticIon)))

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const residual = polynomial(estimate)
    if (
      Number.isFinite(residual) &&
      Math.abs(residual) <= ROOT_RELATIVE_TOLERANCE * Math.max(1, residualScale(estimate))
    ) {
      return estimate * waterIon
    }

    if (residual > 0) upper = estimate
    else lower = estimate

    const slope = derivative(estimate)
    const candidate = estimate - residual / slope
    if (!Number.isFinite(candidate) || slope <= 0 || candidate <= lower || candidate >= upper) {
      break
    }
    estimate = candidate
  }

  // Guaranteed convergence fallback inside the physical bracket.
  for (let iteration = 0; iteration < 128; iteration += 1) {
    const midpoint = lower + (upper - lower) / 2
    const residual = polynomial(midpoint)
    if (residual > 0) upper = midpoint
    else lower = midpoint

    if (
      upper - lower <=
      ROOT_RELATIVE_TOLERANCE * Math.max(1, Math.abs(midpoint))
    ) {
      const ionConcentration = (lower + (upper - lower) / 2) * waterIon
      if (Number.isFinite(ionConcentration) && ionConcentration > 0) {
        return ionConcentration
      }
      break
    }
  }

  throw new Error('Weak-electrolyte equilibrium solver did not converge')
}

/** Full monoprotic weak-acid equilibrium including water autoionization. */
export function calculateWeakAcidPH(
  concentration: number,
  Ka: number
): {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
  percentIonization: number
  method: 'full-equilibrium'
  applicability: WeakElectrolyteApplicability
} {
  const H_concentration = solveMonoproticWeakElectrolyteIon(concentration, Ka, 'Ka')
  const OH_concentration = KW_25C / H_concentration
  const conjugateBaseConcentration = Math.min(
    concentration,
    Math.max(0, H_concentration - OH_concentration)
  )
  const pH = calculatePH(H_concentration)
  const pOH = calculatePOH(OH_concentration)
  const percentIonization = (conjugateBaseConcentration / concentration) * 100

  return {
    pH,
    pOH,
    H_concentration,
    OH_concentration,
    percentIonization,
    method: 'full-equilibrium',
    applicability: WEAK_ELECTROLYTE_MODEL_25C,
  }
}

/** Full monoprotic weak-base equilibrium including water autoionization. */
export function calculateWeakBasePH(
  concentration: number,
  Kb: number
): {
  pH: number
  pOH: number
  H_concentration: number
  OH_concentration: number
  percentIonization: number
  method: 'full-equilibrium'
  applicability: WeakElectrolyteApplicability
} {
  const OH_concentration = solveMonoproticWeakElectrolyteIon(concentration, Kb, 'Kb')
  const H_concentration = KW_25C / OH_concentration
  const conjugateAcidConcentration = Math.min(
    concentration,
    Math.max(0, OH_concentration - H_concentration)
  )
  const pOH = calculatePOH(OH_concentration)
  const pH = calculatePH(H_concentration)
  const percentIonization = (conjugateAcidConcentration / concentration) * 100

  return {
    pH,
    pOH,
    H_concentration,
    OH_concentration,
    percentIonization,
    method: 'full-equilibrium',
    applicability: WEAK_ELECTROLYTE_MODEL_25C,
  }
}

/**
 * Calculate pH using pKa
 */
export function calculatePHFromPKa(
  concentration: number,
  pKa: number
): number {
  const Ka = Math.pow(10, -pKa)
  const result = calculateWeakAcidPH(concentration, Ka)
  return result.pH
}

/**
 * Henderson-Hasselbalch equation (for buffers)
 */
export function hendersonHasselbalch(
  pKa: number,
  acidConcentration: number,
  baseConcentration: number
): number {
  if (!Number.isFinite(pKa)) throw new Error('pKa must be finite')
  if (!Number.isFinite(acidConcentration) || acidConcentration <= 0) {
    throw new Error('Acid concentration must be a positive, finite number')
  }
  if (!Number.isFinite(baseConcentration) || baseConcentration <= 0) {
    throw new Error('Base concentration must be a positive, finite number')
  }
  // pH = pKa + log([A-]/[HA])
  const result = pKa + Math.log10(baseConcentration / acidConcentration)
  if (!Number.isFinite(result)) throw new Error('Buffer pH is outside the finite representable range')
  return result
}

/**
 * Calculate buffer capacity
 */
export function calculateBufferCapacity(
  totalConcentration: number,
  pH: number,
  pKa: number
): number {
  // β = 2.303 × C × Ka × [H+] / (Ka + [H+])²
  const Ka = Math.pow(10, -pKa)
  const H = Math.pow(10, -pH)

  return 2.303 * totalConcentration * Ka * H / Math.pow(Ka + H, 2)
}

/**
 * Dilution calculations (M1V1 = M2V2)
 */
export interface DilutionInput {
  M1?: number // initial molarity
  V1?: number // initial volume
  M2?: number // final molarity
  V2?: number // final volume
}

export interface DilutionResult {
  M1: number
  V1: number
  M2: number
  V2: number
  volumeToAdd: number
  dilutionFactor: number
}

export function calculateDilution(input: DilutionInput): DilutionResult {
  const { M1, V1, M2, V2 } = input

  const supplied = [M1, V1, M2, V2].filter(value => value !== undefined)
  if (supplied.length !== 3) {
    throw new Error('Need exactly 3 of 4 parameters (M1, V1, M2, V2)')
  }
  for (const [label, value] of Object.entries({ M1, V1, M2, V2 })) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
      throw new Error(`${label} must be a positive, finite number`)
    }
  }

  const checked = (result: DilutionResult): DilutionResult => {
    if (Object.values(result).some(value => !Number.isFinite(value))) {
      throw new Error('Dilution result is outside the finite representable range')
    }
    return result
  }

  // Solve for missing variable
  if (M1 !== undefined && V1 !== undefined && M2 !== undefined && V2 === undefined) {
    const finalV2 = (M1 * V1) / M2
    return checked({
      M1,
      V1,
      M2,
      V2: finalV2,
      volumeToAdd: finalV2 - V1,
      dilutionFactor: M1 / M2,
    })
  }

  if (M1 !== undefined && V1 !== undefined && M2 === undefined && V2 !== undefined) {
    const finalM2 = (M1 * V1) / V2
    return checked({
      M1,
      V1,
      M2: finalM2,
      V2,
      volumeToAdd: V2 - V1,
      dilutionFactor: M1 / finalM2,
    })
  }

  if (M1 !== undefined && V1 === undefined && M2 !== undefined && V2 !== undefined) {
    const finalV1 = (M2 * V2) / M1
    return checked({
      M1,
      V1: finalV1,
      M2,
      V2,
      volumeToAdd: V2 - finalV1,
      dilutionFactor: M1 / M2,
    })
  }

  if (M1 === undefined && V1 !== undefined && M2 !== undefined && V2 !== undefined) {
    const finalM1 = (M2 * V2) / V1
    return checked({
      M1: finalM1,
      V1,
      M2,
      V2,
      volumeToAdd: V2 - V1,
      dilutionFactor: finalM1 / M2,
    })
  }

  throw new Error('Need exactly 3 of 4 parameters (M1, V1, M2, V2)')
}

/**
 * Osmotic pressure calculation (van't Hoff equation)
 */
export function calculateOsmoticPressure(
  molarity: number,
  temperature: number, // Kelvin
  vanTHoffFactor: number = 1 // i (number of particles)
): number {
  // π = iMRT
  const R = 0.08206 // L·atm/(mol·K)
  return vanTHoffFactor * molarity * R * temperature
}

/**
 * Colligative properties
 */

/**
 * Boiling point elevation
 */
export function calculateBoilingPointElevation(
  molality: number,
  Kb: number, // boiling point elevation constant
  vanTHoffFactor: number = 1
): number {
  // ΔTb = i × Kb × m
  return vanTHoffFactor * Kb * molality
}

/**
 * Freezing point depression
 */
export function calculateFreezingPointDepression(
  molality: number,
  Kf: number, // freezing point depression constant
  vanTHoffFactor: number = 1
): number {
  // ΔTf = i × Kf × m
  return vanTHoffFactor * Kf * molality
}

/**
 * Common solution preparation examples
 */
export const SOLUTION_EXAMPLES = [
  {
    name: 'Prepare 1 M NaCl solution',
    problem: 'How to prepare 500 mL of 1 M NaCl solution?',
    solution: {
      formula: 'NaCl',
      targetMolarity: 1,
      targetVolume: 0.5, // L
      steps: [
        'Calculate molar mass of NaCl: 58.44 g/mol',
        'Calculate moles needed: 1 M × 0.5 L = 0.5 mol',
        'Calculate mass needed: 0.5 mol × 58.44 g/mol = 29.22 g',
        'Procedure:',
        '1. Weigh 29.22 g of NaCl',
        '2. Add to volumetric flask',
        '3. Add water to dissolve',
        '4. Add water to 500 mL mark',
      ],
      answer: '29.22 g NaCl in 500 mL water',
    },
  },
  {
    name: 'pH of strong acid',
    problem: 'What is the pH of 0.01 M HCl?',
    solution: {
      type: 'strong-acid',
      concentration: 0.01,
      steps: [
        'HCl is a strong acid → complete dissociation',
        '[H+] = 0.01 M',
        'pH = -log[H+] = -log(0.01) = 2',
      ],
      answer: 'pH = 2',
    },
  },
  {
    name: 'Buffer preparation',
    problem: 'Prepare acetate buffer at pH 4.76',
    solution: {
      type: 'buffer',
      pKa: 4.76,
      targetPH: 4.76,
      steps: [
        'Use acetic acid (CH3COOH) and sodium acetate (CH3COONa)',
        'pKa of acetic acid = 4.76',
        'Henderson-Hasselbalch: pH = pKa + log([A-]/[HA])',
        '4.76 = 4.76 + log([A-]/[HA])',
        'log([A-]/[HA]) = 0',
        '[A-]/[HA] = 1 (equal concentrations)',
        'Mix equal molar amounts of acid and conjugate base',
      ],
      answer: 'Mix equal volumes of 0.1 M acetic acid and 0.1 M sodium acetate',
    },
  },
]

/**
 * Common Ka and Kb values
 */
export const ACID_KA_VALUES = {
  'H2SO4': 1e3, // Strong (first proton)
  'HCl': 1e7, // Strong
  'HNO3': 2.4e1, // Strong
  'H3PO4': 7.5e-3, // Weak (first proton)
  'CH3COOH': 1.8e-5, // Acetic acid
  'HF': 6.8e-4, // Hydrofluoric acid
  'HNO2': 4.0e-4, // Nitrous acid
  'H2CO3': 4.3e-7, // Carbonic acid (first proton)
  'H2S': 1.0e-7, // Hydrogen sulfide (first proton)
  'NH4+': 5.6e-10, // Ammonium
}

export const BASE_KB_VALUES = {
  'NH3': 1.8e-5, // Ammonia
  'CH3NH2': 4.4e-4, // Methylamine
  'C5H5N': 1.7e-9, // Pyridine
  'NaOH': 1e14, // Strong
  'KOH': 1e14, // Strong
  'Ca(OH)2': 1e14, // Strong
}

/**
 * Common PKa values
 */
export const PKA_VALUES = {
  'CH3COOH': 4.76, // Acetic acid
  'H3PO4': 2.12, // Phosphoric acid (first)
  'HF': 3.17, // Hydrofluoric acid
  'HNO2': 3.40, // Nitrous acid
  'H2CO3': 6.37, // Carbonic acid (first)
  'NH4+': 9.25, // Ammonium
  'H2O': 15.74, // Water (as acid)
}

/**
 * Type aliases for UI
 */
export type MolarityResult = number

export type PHResult = {
  pH: number
  pOH?: number
  H_concentration?: number
  OH_concentration?: number
  percentIonization?: number
  method?: 'full-equilibrium'
  applicability?: WeakElectrolyteApplicability
  warning?: string
  resolved?: StrongSpeciesResolution
}

/**
 * Helper arrays for UI dropdowns
 */
export const STRONG_ACIDS = Object.keys(ACID_KA_VALUES).filter(
  (acid) => ACID_KA_VALUES[acid as keyof typeof ACID_KA_VALUES] > 1
)

export const STRONG_BASES = Object.keys(BASE_KB_VALUES).filter(
  (base) => BASE_KB_VALUES[base as keyof typeof BASE_KB_VALUES] > 1e10
)

export const WEAK_ACIDS = Object.keys(ACID_KA_VALUES).filter(
  (acid) => ACID_KA_VALUES[acid as keyof typeof ACID_KA_VALUES] <= 1
)

/**
 * Alias for buffer pH calculation
 */
export const calculateBufferPH = hendersonHasselbalch
