/**
 * Haptic Feedback Utilities
 * Provides tactile feedback on mobile devices using Vibration API
 *
 * Browser Support:
 * - Chrome for Android ✅
 * - Firefox for Android ✅
 * - Samsung Internet ✅
 * - iOS Safari ⚠️ (limited, only works in PWA)
 *
 * Usage:
 * - Import and call haptic functions when user interacts
 * - Automatically checks for API support
 * - Fails silently on unsupported browsers
 */

/**
 * Haptic feedback patterns (in milliseconds)
 */
export const HAPTIC_PATTERNS = {
  /** Light tap - for button presses, selections */
  light: [10],

  /** Medium tap - for important actions */
  medium: [20],

  /** Heavy tap - for confirmations, completions */
  heavy: [30],

  /** Double tap - for errors, warnings */
  double: [15, 50, 15],

  /** Success - for successful operations */
  success: [10, 30, 10, 30, 10],

  /** Error - for failed operations */
  error: [50, 100, 50],

  /** Selection - for picking items */
  selection: [5],

  /** Impact - for collisions, bond creation */
  impact: [20, 10, 20],

  /** Notification - for alerts */
  notification: [10, 50, 10, 50, 10, 50, 10],
}

/**
 * Check if Vibration API is supported
 */
export function isHapticsSupported(): boolean {
  return 'vibrate' in navigator
}

/**
 * Trigger haptic feedback with a pattern
 *
 * @param pattern - Vibration pattern (array of milliseconds)
 *
 * @example
 * ```ts
 * triggerHaptic(HAPTIC_PATTERNS.light) // Light tap
 * triggerHaptic([10, 50, 10]) // Custom pattern
 * ```
 */
export function triggerHaptic(pattern: number | number[]): void {
  if (!isHapticsSupported()) return

  try {
    navigator.vibrate(pattern)
  } catch (error) {
    // Fail silently - haptics are non-critical
    console.debug('Haptic feedback failed:', error)
  }
}

/**
 * Stop all vibrations
 */
export function stopHaptic(): void {
  if (!isHapticsSupported()) return

  try {
    navigator.vibrate(0)
  } catch (error) {
    console.debug('Stop haptic failed:', error)
  }
}

/**
 * Haptic Feedback Hooks
 * Convenient functions for common interactions
 */

/** Light tap - for buttons, selections */
export function hapticLight() {
  triggerHaptic(HAPTIC_PATTERNS.light)
}

/** Medium tap - for important actions */
export function hapticMedium() {
  triggerHaptic(HAPTIC_PATTERNS.medium)
}

/** Heavy tap - for confirmations */
export function hapticHeavy() {
  triggerHaptic(HAPTIC_PATTERNS.heavy)
}

/** Double tap - for errors/warnings */
export function hapticDouble() {
  triggerHaptic(HAPTIC_PATTERNS.double)
}

/** Success pattern */
export function hapticSuccess() {
  triggerHaptic(HAPTIC_PATTERNS.success)
}

/** Error pattern */
export function hapticError() {
  triggerHaptic(HAPTIC_PATTERNS.error)
}

/** Selection tap */
export function hapticSelection() {
  triggerHaptic(HAPTIC_PATTERNS.selection)
}

/** Impact feedback */
export function hapticImpact() {
  triggerHaptic(HAPTIC_PATTERNS.impact)
}

/** Notification pattern */
export function hapticNotification() {
  triggerHaptic(HAPTIC_PATTERNS.notification)
}

/**
 * React Hook for Haptic Feedback
 *
 * @returns Haptic feedback functions
 *
 * @example
 * ```tsx
 * const haptics = useHaptics()
 *
 * <button onClick={() => {
 *   haptics.light()
 *   // ... handle click
 * }}>
 *   Click me
 * </button>
 * ```
 */
export function useHaptics() {
  return {
    light: hapticLight,
    medium: hapticMedium,
    heavy: hapticHeavy,
    double: hapticDouble,
    success: hapticSuccess,
    error: hapticError,
    selection: hapticSelection,
    impact: hapticImpact,
    notification: hapticNotification,
    stop: stopHaptic,
    isSupported: isHapticsSupported(),
  }
}

/**
 * Molecule Builder Specific Haptics
 * Pre-configured feedback for molecule builder interactions
 */

/** Haptic for adding atom */
export function hapticAtomAdd() {
  triggerHaptic([10, 20]) // Quick double tap
}

/** Haptic for creating bond */
export function hapticBondCreate() {
  triggerHaptic([15, 10, 15]) // Impact pattern
}

/** Haptic for deleting atom/bond */
export function hapticDelete() {
  triggerHaptic([25]) // Medium tap
}

/** Haptic for selecting atom/bond */
export function hapticSelect() {
  triggerHaptic([5]) // Very light tap
}

/** Haptic for molecule stable */
export function hapticMoleculeStable() {
  triggerHaptic([10, 30, 10, 30, 10]) // Success pattern
}

/** Haptic for molecule unstable/invalid */
export function hapticMoleculeInvalid() {
  triggerHaptic([20, 50, 20]) // Error pattern
}

/** Haptic for undo/redo */
export function hapticUndoRedo() {
  triggerHaptic([8]) // Quick tap
}

/** Haptic for loading preset */
export function hapticPresetLoad() {
  triggerHaptic([15, 20, 15]) // Medium impact
}
