export const SOLUTION_MODES = [
  { id: 'molarity', label: 'Molarity (M)' },
  { id: 'strong-acid-ph', label: 'Strong Acid pH' },
  { id: 'strong-base-ph', label: 'Strong Base pH' },
  { id: 'weak-acid-ph', label: 'Weak Acid pH' },
  { id: 'weak-base-ph', label: 'Weak Base pH' },
  { id: 'buffer-ph', label: 'Buffer pH' },
  { id: 'dilution', label: 'Dilution (M₁V₁=M₂V₂)' },
  { id: 'convert-from-ph', label: 'Convert from pH' },
  { id: 'convert-from-poh', label: 'Convert from pOH' },
  { id: 'convert-from-h', label: 'Convert from [H⁺]' },
  { id: 'convert-from-oh', label: 'Convert from [OH⁻]' },
] as const

export type CalculatorMode = (typeof SOLUTION_MODES)[number]['id']
export const SOLUTIONS_MODE_COUNT = SOLUTION_MODES.length
