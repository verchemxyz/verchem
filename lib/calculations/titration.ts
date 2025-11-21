// VerChem - Virtual Lab: Acid-Base Titration Calculator
// Simulates titration with pH curve, color changes, and equivalence point

import { WATER_ION_PRODUCT } from '@/lib/constants/physical-constants'

/**
 * Acid Types
 */
export type AcidType = 'strong' | 'weak'

const KW_25C = WATER_ION_PRODUCT[25] ?? 1.0e-14
const DEFAULT_WEAK_ACID_KA = 1.74e-5

/**
 * Acid Data
 */
export interface Acid {
  name: string
  formula: string
  concentration: number // M (molarity)
  volume: number // mL
  type: AcidType
  Ka?: number // Only for weak acids
  KaValues?: number[] // polyprotic acids
  protonCount?: number
  pKa?: number
}

/**
 * Base Data
 */
export interface Base {
  name: string
  formula: string
  concentration: number // M
  type: 'strong' | 'weak'
  Kb?: number // Only for weak bases
  pKb?: number
  hydroxideCount?: number
}

function getAcidProtonCount(acid: Acid): number {
  if (acid.protonCount && acid.protonCount > 0) {
    return acid.protonCount
  }
  if (acid.KaValues?.length) {
    return acid.KaValues.length
  }
  return 1
}

function getKaSeries(acid: Acid): number[] {
  if (acid.KaValues?.length) {
    return acid.KaValues
  }
  if (acid.Ka) {
    return [acid.Ka]
  }
  return [DEFAULT_WEAK_ACID_KA]
}

function getBaseHydroxideCount(base: Base): number {
  if (base.hydroxideCount && base.hydroxideCount > 0) {
    return base.hydroxideCount
  }
  // Basic estimation: look for "(OH)2" etc.
  const match = base.formula.match(/\(OH\)(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  if (base.formula.includes('OH')) {
    return 1
  }
  return 1
}

/**
 * Indicator Data
 */
export interface Indicator {
  name: string
  pKa: number
  acidColor: string // Color in acidic solution
  baseColor: string // Color in basic solution
  transitionRange: [number, number] // [low pH, high pH]
}

/**
 * Titration Point
 */
export interface TitrationPoint {
  volumeAdded: number // mL of titrant added
  pH: number
  color: string // Solution color
  percentNeutralized: number // 0-100%
}

/**
 * Titration Result
 */
export interface TitrationResult {
  points: TitrationPoint[] // All data points
  equivalencePoint: {
    volume: number // mL
    pH: number
  }
  halfEquivalencePoint?: {
    volume: number // mL
    pH: number
  }
  initialPH: number
  finalPH: number
  totalVolume: number
  steps: string[]
}

/**
 * Common Indicators
 */
export const INDICATORS: Indicator[] = [
  {
    name: 'Phenolphthalein',
    pKa: 9.3,
    acidColor: '#ffffff', // Colorless
    baseColor: '#ff1493', // Deep pink
    transitionRange: [8.3, 10.0],
  },
  {
    name: 'Methyl Orange',
    pKa: 3.7,
    acidColor: '#ff0000', // Red
    baseColor: '#ffa500', // Orange-yellow
    transitionRange: [3.1, 4.4],
  },
  {
    name: 'Methyl Red',
    pKa: 5.1,
    acidColor: '#ff0000', // Red
    baseColor: '#ffff00', // Yellow
    transitionRange: [4.4, 6.2],
  },
  {
    name: 'Bromothymol Blue',
    pKa: 7.0,
    acidColor: '#ffff00', // Yellow
    baseColor: '#0000ff', // Blue
    transitionRange: [6.0, 7.6],
  },
  {
    name: 'Litmus',
    pKa: 6.5,
    acidColor: '#ff0000', // Red
    baseColor: '#0000ff', // Blue
    transitionRange: [4.5, 8.3],
  },
]

/**
 * Common Strong Acids
 */
export const STRONG_ACIDS = [
  { name: 'Hydrochloric acid', formula: 'HCl', type: 'strong' as AcidType },
  { name: 'Nitric acid', formula: 'HNO₃', type: 'strong' as AcidType },
  { name: 'Sulfuric acid', formula: 'H₂SO₄', type: 'strong' as AcidType, protonCount: 2 },
  { name: 'Hydrobromic acid', formula: 'HBr', type: 'strong' as AcidType },
  { name: 'Perchloric acid', formula: 'HClO₄', type: 'strong' as AcidType },
]

/**
 * Common Weak Acids
 */
export const WEAK_ACIDS = [
  { name: 'Acetic acid', formula: 'CH₃COOH', type: 'weak' as AcidType, pKa: 4.76, Ka: 1.74e-5 },
  { name: 'Formic acid', formula: 'HCOOH', type: 'weak' as AcidType, pKa: 3.75, Ka: 1.78e-4 },
  { name: 'Benzoic acid', formula: 'C₆H₅COOH', type: 'weak' as AcidType, pKa: 4.20, Ka: 6.31e-5 },
  { name: 'Hydrofluoric acid', formula: 'HF', type: 'weak' as AcidType, pKa: 3.17, Ka: 6.76e-4 },
  {
    name: 'Carbonic acid',
    formula: 'H₂CO₃',
    type: 'weak' as AcidType,
    KaValues: [4.3e-7, 5.6e-11],
    protonCount: 2,
  },
  {
    name: 'Phosphoric acid',
    formula: 'H₃PO₄',
    type: 'weak' as AcidType,
    KaValues: [7.5e-3, 6.2e-8, 4.2e-13],
    protonCount: 3,
  },
  {
    name: 'Citric acid',
    formula: 'C₆H₈O₇',
    type: 'weak' as AcidType,
    KaValues: [7.4e-4, 1.7e-5, 4.0e-7],
    protonCount: 3,
  },
]

/**
 * Common Strong Bases
 */
export const STRONG_BASES = [
  { name: 'Sodium hydroxide', formula: 'NaOH', type: 'strong', hydroxideCount: 1 },
  { name: 'Potassium hydroxide', formula: 'KOH', type: 'strong', hydroxideCount: 1 },
  { name: 'Lithium hydroxide', formula: 'LiOH', type: 'strong', hydroxideCount: 1 },
  { name: 'Barium hydroxide', formula: 'Ba(OH)₂', type: 'strong', hydroxideCount: 2 },
]

/**
 * Common Weak Bases
 */
export const WEAK_BASES = [
  { name: 'Ammonia', formula: 'NH₃', type: 'weak', pKb: 4.75, Kb: 1.78e-5 },
  { name: 'Methylamine', formula: 'CH₃NH₂', type: 'weak', pKb: 3.36, Kb: 4.38e-4 },
]

/**
 * Calculate pH of strong acid solution
 */
function calculateStrongAcidPH(concentration: number, protonCount: number = 1): number {
  const effectiveConcentration = Math.max(concentration * Math.max(protonCount, 1), 1e-30)
  return -Math.log10(effectiveConcentration)
}

/**
 * Calculate pH of weak acid solution using Ka
 */
function calculateWeakAcidPH(concentration: number, Ka: number): number {
  if (concentration <= 0) return 7
  // For weak acid: pH = 0.5(pKa - log[HA])
  // Simplified: [H+] = sqrt(Ka * C)
  const H = Math.sqrt(Ka * concentration)
  return -Math.log10(H)
}

function calculatePolyproticWeakAcidPH(
  acid: Acid,
  baseVolumeAdded: number,
  baseConcentration: number,
  baseHydroxideCount: number
): number {
  const KaSeries = getKaSeries(acid)
  const acidMoles = (acid.concentration * acid.volume) / 1000
  const baseEquivalents = (baseConcentration * baseHydroxideCount * baseVolumeAdded) / 1000
  const totalVolume = (acid.volume + baseVolumeAdded) / 1000
  const stageSize = acidMoles
  const totalStages = KaSeries.length
  const maxEquivalents = stageSize * totalStages

  if (baseVolumeAdded === 0) {
    return calculateWeakAcidPH(acid.concentration, KaSeries[0])
  }

  if (stageSize === 0) {
    return 7
  }

  let stage = Math.floor(baseEquivalents / stageSize)
  if (stage < 0) stage = 0
  if (stage > totalStages) stage = totalStages
  const fractional = Math.max(0, baseEquivalents - stage * stageSize)

  if (stage >= totalStages) {
    const excessEquiv = baseEquivalents - maxEquivalents
    if (excessEquiv <= 1e-12) {
      // Exactly at final equivalence - treat as weak base (conjugate of last dissociation)
      const concentration = acidMoles / Math.max(totalVolume, 1e-9)
      const lastKa = KaSeries[KaSeries.length - 1]
      const Kb = Math.max(KW_25C / lastKa, 1e-30)
      const OH = Math.sqrt(Math.max(Kb * concentration, 1e-30))
      const pOH = -Math.log10(OH)
      return 14 - pOH
    }

    // Excess strong base
    const OH_concentration = excessEquiv / Math.max(totalVolume, 1e-9)
    const pOH = -Math.log10(Math.max(OH_concentration, 1e-30))
    return 14 - pOH
  }

  const currentKa = KaSeries[Math.min(stage, KaSeries.length - 1)]
  const pKa = -Math.log10(currentKa)

  if (fractional <= 1e-12) {
    if (stage === 0) {
      return calculateWeakAcidPH(acid.concentration, currentKa)
    }
    const prevKa = KaSeries[Math.min(stage - 1, KaSeries.length - 1)]
    const nextKa =
      stage < KaSeries.length
        ? KaSeries[Math.min(stage, KaSeries.length - 1)]
        : Math.max(KW_25C / prevKa, 1e-30)
    const prevpKa = -Math.log10(prevKa)
    const nextpKa = -Math.log10(nextKa)
    return 0.5 * (prevpKa + nextpKa)
  }

  const acidMolesRemaining = Math.max(stageSize - fractional, 1e-12)
  const conjugateMoles = Math.max(fractional, 1e-12)
  const HA = acidMolesRemaining / Math.max(totalVolume, 1e-9)
  const A = conjugateMoles / Math.max(totalVolume, 1e-9)
  return pKa + Math.log10(A / HA)
}

/**
 * Calculate pH during titration of strong acid with strong base
 */
function calculateStrongAcidStrongBasePH(
  acid: Acid,
  baseVolumeAdded: number,
  baseConcentration: number,
  baseHydroxideCount: number,
  acidProtonCount: number
): number {
  const acidMoles = (acid.concentration * acid.volume) / 1000
  const acidEquivalents = acidMoles * Math.max(acidProtonCount, 1)
  const baseEquivalents = (baseConcentration * baseHydroxideCount * baseVolumeAdded) / 1000
  const totalVolume = (acid.volume + baseVolumeAdded) / 1000

  if (baseEquivalents < acidEquivalents) {
    const excessAcid = acidEquivalents - baseEquivalents
    const H_concentration = excessAcid / Math.max(totalVolume, 1e-9)
    return -Math.log10(Math.max(H_concentration, 1e-30))
  } else if (Math.abs(baseEquivalents - acidEquivalents) <= 1e-12) {
    return 7.0
  } else {
    const excessBase = baseEquivalents - acidEquivalents
    const OH_concentration = excessBase / Math.max(totalVolume, 1e-9)
    const pOH = -Math.log10(Math.max(OH_concentration, 1e-30))
    return 14 - pOH
  }
}

/**
 * Calculate pH during titration of weak acid with strong base
 */
function calculateWeakAcidStrongBasePH(
  acid: Acid,
  baseVolumeAdded: number,
  baseConcentration: number,
  baseHydroxideCount: number
): number {
  return calculatePolyproticWeakAcidPH(acid, baseVolumeAdded, baseConcentration, baseHydroxideCount)
}

/**
 * Get indicator color at a given pH
 */
export function getIndicatorColor(indicator: Indicator, pH: number): string {
  const [lowPH, highPH] = indicator.transitionRange

  if (pH < lowPH) {
    return indicator.acidColor
  } else if (pH > highPH) {
    return indicator.baseColor
  } else {
    // Transition range - interpolate colors
    const fraction = (pH - lowPH) / (highPH - lowPH)
    return interpolateColor(indicator.acidColor, indicator.baseColor, fraction)
  }
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, fraction: number): string {
  // Simple RGB interpolation
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)

  if (!c1 || !c2) return color1

  const r = Math.round(c1.r + (c2.r - c1.r) * fraction)
  const g = Math.round(c1.g + (c2.g - c1.g) * fraction)
  const b = Math.round(c1.b + (c2.b - c1.b) * fraction)

  return rgbToHex(r, g, b)
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * Simulate complete titration
 */
export function simulateTitration(
  acid: Acid,
  base: Base,
  indicator: Indicator,
  stepSize: number = 0.5 // mL increments
): TitrationResult {
  const steps: string[] = []
  const points: TitrationPoint[] = []
  const acidProtonCount = getAcidProtonCount(acid)
  const baseHydroxideCount = getBaseHydroxideCount(base)

  steps.push('=== Acid-Base Titration Simulation ===\n')
  steps.push(`Analyte: ${acid.name} (${acid.formula})`)
  steps.push(`  Concentration: ${acid.concentration.toFixed(3)} M`)
  steps.push(`  Volume: ${acid.volume.toFixed(1)} mL`)
  steps.push(
    `  Type: ${acid.type} acid${acid.pKa ? `, pKa = ${acid.pKa.toFixed(2)}` : ''}${
      acidProtonCount > 1 ? `, ${acidProtonCount} ionizable protons` : ''
    }`
  )
  steps.push(`\nTitrant: ${base.name} (${base.formula})`)
  steps.push(`  Concentration: ${base.concentration.toFixed(3)} M`)
  steps.push(
    `  Type: ${base.type} base${baseHydroxideCount > 1 ? `, provides ${baseHydroxideCount} OH⁻` : ''}`
  )
  steps.push(`\nIndicator: ${indicator.name}`)
  steps.push(`  Transition range: pH ${indicator.transitionRange[0]}-${indicator.transitionRange[1]}`)
  steps.push(`  Acid color: ${indicator.acidColor}`)
  steps.push(`  Base color: ${indicator.baseColor}\n`)

  // Calculate equivalence point volume
  const acidMoles = (acid.concentration * acid.volume) / 1000
  const acidEquivalents = acidMoles * Math.max(acidProtonCount, 1)
  const equivalenceVolume = (acidEquivalents * 1000) / (base.concentration * baseHydroxideCount)

  steps.push(`Theoretical Equivalence Point:`)
  steps.push(`  Moles of acid = ${acidMoles.toExponential(4)} mol`)
  steps.push(`  Protons to neutralize = ${acidEquivalents.toExponential(4)} eq`)
  steps.push(`  Volume of base needed = ${equivalenceVolume.toFixed(2)} mL\n`)

  // Initial point (0 mL added)
  const initialPH =
    acid.type === 'strong'
      ? calculateStrongAcidPH(acid.concentration, acidProtonCount)
      : calculateWeakAcidStrongBasePH(acid, 0, base.concentration, baseHydroxideCount)

  points.push({
    volumeAdded: 0,
    pH: initialPH,
    color: getIndicatorColor(indicator, initialPH),
    percentNeutralized: 0,
  })

  // Titration points
  const maxVolume = equivalenceVolume * 2 // Go beyond equivalence point
  for (let volume = stepSize; volume <= maxVolume; volume += stepSize) {
    let pH: number

    if (acid.type === 'strong' && base.type === 'strong') {
      pH = calculateStrongAcidStrongBasePH(acid, volume, base.concentration, baseHydroxideCount, acidProtonCount)
    } else if (acid.type === 'weak' && base.type === 'strong') {
      pH = calculateWeakAcidStrongBasePH(acid, volume, base.concentration, baseHydroxideCount)
    } else {
      // Default to strong acid/strong base
      pH = calculateStrongAcidStrongBasePH(acid, volume, base.concentration, baseHydroxideCount, acidProtonCount)
    }

    const color = getIndicatorColor(indicator, pH)
    const baseEquivAdded = (base.concentration * baseHydroxideCount * volume) / 1000
    const percentNeutralized =
      acidEquivalents > 0 ? Math.min((baseEquivAdded / acidEquivalents) * 100, 100) : 0

    points.push({
      volumeAdded: volume,
      pH,
      color,
      percentNeutralized,
    })
  }

  // Find actual equivalence point (closest to theoretical)
  let equivalencePoint = points[0]
  let minDiff = Math.abs(points[0].volumeAdded - equivalenceVolume)

  for (const point of points) {
    const diff = Math.abs(point.volumeAdded - equivalenceVolume)
    if (diff < minDiff) {
      minDiff = diff
      equivalencePoint = point
    }
  }

  // Find half-equivalence point (for weak acid)
  let halfEquivalencePoint: { volume: number; pH: number } | undefined
  if (acid.type === 'weak') {
    const halfVolume = equivalenceVolume / 2
    let closestPoint = points[0]
    let minHalfDiff = Math.abs(points[0].volumeAdded - halfVolume)

    for (const point of points) {
      const diff = Math.abs(point.volumeAdded - halfVolume)
      if (diff < minHalfDiff) {
        minHalfDiff = diff
        closestPoint = point
      }
    }

    halfEquivalencePoint = {
      volume: closestPoint.volumeAdded,
      pH: closestPoint.pH,
    }

    steps.push(`Half-Equivalence Point:`)
    steps.push(`  Volume = ${halfEquivalencePoint.volume.toFixed(2)} mL`)
    steps.push(`  pH = ${halfEquivalencePoint.pH.toFixed(2)}`)
    steps.push(`  At half-equivalence: pH ≈ pKa = ${acid.pKa?.toFixed(2)}\n`)
  }

  steps.push(`Equivalence Point:`)
  steps.push(`  Volume = ${equivalencePoint.volumeAdded.toFixed(2)} mL`)
  steps.push(`  pH = ${equivalencePoint.pH.toFixed(2)}`)
  steps.push(`  Color: ${equivalencePoint.color}`)

  return {
    points,
    equivalencePoint: {
      volume: equivalencePoint.volumeAdded,
      pH: equivalencePoint.pH,
    },
    halfEquivalencePoint,
    initialPH,
    finalPH: points[points.length - 1].pH,
    totalVolume: acid.volume + maxVolume,
    steps,
  }
}

/**
 * Example Titrations
 */
export const EXAMPLE_TITRATIONS = [
  {
    name: 'Strong Acid + Strong Base',
    description: 'HCl titrated with NaOH - Classic titration',
    acid: {
      name: 'Hydrochloric acid',
      formula: 'HCl',
      concentration: 0.1,
      volume: 25.0,
      type: 'strong' as AcidType,
    },
    base: {
      name: 'Sodium hydroxide',
      formula: 'NaOH',
      concentration: 0.1,
      type: 'strong' as const,
    },
    indicator: INDICATORS[0], // Phenolphthalein
  },
  {
    name: 'Weak Acid + Strong Base',
    description: 'Acetic acid (vinegar) titrated with NaOH',
    acid: {
      name: 'Acetic acid',
      formula: 'CH₃COOH',
      concentration: 0.1,
      volume: 25.0,
      type: 'weak' as AcidType,
      Ka: 1.74e-5,
      pKa: 4.76,
    },
    base: {
      name: 'Sodium hydroxide',
      formula: 'NaOH',
      concentration: 0.1,
      type: 'strong' as const,
    },
    indicator: INDICATORS[0], // Phenolphthalein (good for weak acid)
  },
  {
    name: 'Strong Acid with Methyl Orange',
    description: 'HCl with methyl orange indicator',
    acid: {
      name: 'Hydrochloric acid',
      formula: 'HCl',
      concentration: 0.1,
      volume: 25.0,
      type: 'strong' as AcidType,
    },
    base: {
      name: 'Sodium hydroxide',
      formula: 'NaOH',
      concentration: 0.1,
      type: 'strong' as const,
    },
    indicator: INDICATORS[1], // Methyl Orange
  },
]
