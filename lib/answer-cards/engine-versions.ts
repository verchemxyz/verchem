/**
 * Semantic releases for deterministic engines used by Verified Answer Cards.
 *
 * Stage 0 introduced the first replay-aware payload after correctness fixes
 * across the calculation stack. Historical cards did not record a per-engine
 * release, so every current engine starts at the conservative 2.0.0 epoch:
 * no legacy card may silently inherit a current VERIFIED badge. Future changes
 * bump only the affected entry.
 */

export type EngineSemanticVersion = `${number}.${number}.${number}`

const STAGE0_REPLAY_EPOCH: EngineSemanticVersion = '2.0.0'
const FULL_WEAK_EQUILIBRIUM_RELEASE: EngineSemanticVersion = '2.0.1'

export const CURRENT_ENGINE_VERSIONS = {
  'strong-acid-pH': STAGE0_REPLAY_EPOCH,
  'weak-acid-pH': FULL_WEAK_EQUILIBRIUM_RELEASE,
  'strong-base-pH': STAGE0_REPLAY_EPOCH,
  'weak-base-pH': FULL_WEAK_EQUILIBRIUM_RELEASE,
  'buffer-pH': STAGE0_REPLAY_EPOCH,
  dilution: STAGE0_REPLAY_EPOCH,
  'ideal-gas': STAGE0_REPLAY_EPOCH,
  'combined-gas': STAGE0_REPLAY_EPOCH,
  'boyles-law': STAGE0_REPLAY_EPOCH,
  'charles-law': STAGE0_REPLAY_EPOCH,
  'gay-lussac-law': STAGE0_REPLAY_EPOCH,
  'avogadro-law': STAGE0_REPLAY_EPOCH,
  'van-der-waals': STAGE0_REPLAY_EPOCH,
  'equation-balancer': STAGE0_REPLAY_EPOCH,
  'molecular-mass': STAGE0_REPLAY_EPOCH,
  'percent-composition': STAGE0_REPLAY_EPOCH,
  'empirical-formula': STAGE0_REPLAY_EPOCH,
  'mass-to-moles': STAGE0_REPLAY_EPOCH,
  'moles-to-mass': STAGE0_REPLAY_EPOCH,
  'moles-to-molecules': STAGE0_REPLAY_EPOCH,
  'molecules-to-moles': STAGE0_REPLAY_EPOCH,
  'moles-to-volume-stp': STAGE0_REPLAY_EPOCH,
  'volume-stp-to-moles': STAGE0_REPLAY_EPOCH,
  'limiting-reagent': STAGE0_REPLAY_EPOCH,
  'theoretical-yield': STAGE0_REPLAY_EPOCH,
  'percent-yield': STAGE0_REPLAY_EPOCH,
  molarity: STAGE0_REPLAY_EPOCH,
  molality: STAGE0_REPLAY_EPOCH,
  'mass-percent': STAGE0_REPLAY_EPOCH,
  ppm: STAGE0_REPLAY_EPOCH,
  'osmotic-pressure': STAGE0_REPLAY_EPOCH,
  'boiling-point-elevation': STAGE0_REPLAY_EPOCH,
  'freezing-point-depression': STAGE0_REPLAY_EPOCH,
  'stock-prep': STAGE0_REPLAY_EPOCH,
  'concentration-converter': STAGE0_REPLAY_EPOCH,
  mixing: STAGE0_REPLAY_EPOCH,
  'thermodynamics-delta-g': STAGE0_REPLAY_EPOCH,
  'thermodynamics-equilibrium-constant': STAGE0_REPLAY_EPOCH,
  'thermodynamics-reaction-analysis': STAGE0_REPLAY_EPOCH,
  'kinetics-arrhenius': STAGE0_REPLAY_EPOCH,
  'kinetics-activation-energy': STAGE0_REPLAY_EPOCH,
  'kinetics-rate-constant': STAGE0_REPLAY_EPOCH,
  'kinetics-concentration-at-time': STAGE0_REPLAY_EPOCH,
  'electrochemistry-cell-potential': STAGE0_REPLAY_EPOCH,
  'electrochemistry-nernst': STAGE0_REPLAY_EPOCH,
  'electrochemistry-electrolysis': STAGE0_REPLAY_EPOCH,
  'nuclear-radioactive-decay': STAGE0_REPLAY_EPOCH,
  'nuclear-half-life-from-decay': STAGE0_REPLAY_EPOCH,
  'nuclear-time-to-decay': STAGE0_REPLAY_EPOCH,
  'nuclear-decay-constant': STAGE0_REPLAY_EPOCH,
  'nuclear-binding-energy': STAGE0_REPLAY_EPOCH,
  'nuclear-mass-energy-equivalence': STAGE0_REPLAY_EPOCH,
  'quantum-hydrogen-energy': STAGE0_REPLAY_EPOCH,
  'quantum-hydrogen-transition': STAGE0_REPLAY_EPOCH,
  'quantum-photon-energy': STAGE0_REPLAY_EPOCH,
  'quantum-de-broglie-wavelength': STAGE0_REPLAY_EPOCH,
  'quantum-bohr-radius': STAGE0_REPLAY_EPOCH,
  'quantum-hydrogen-like-energy': STAGE0_REPLAY_EPOCH,
  'quantum-heisenberg-uncertainty': STAGE0_REPLAY_EPOCH,
  'quantum-number-validation': STAGE0_REPLAY_EPOCH,
  'electron-configuration': STAGE0_REPLAY_EPOCH,
} as const satisfies Readonly<Record<string, EngineSemanticVersion>>

export function getCurrentEngineVersion(engine: string): EngineSemanticVersion | undefined {
  return CURRENT_ENGINE_VERSIONS[engine as keyof typeof CURRENT_ENGINE_VERSIONS]
}
