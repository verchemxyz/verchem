// VerChem - Accessibility Utilities
// WCAG 2.1 AA Compliance Helpers
// Created: November 17, 2025 - World-Class Enhancement Sprint

/**
 * ARIA Labels for Chemistry Terms
 */
export const ARIA_LABELS = {
  // Calculators
  'equation-balancer': 'Chemical equation balancing calculator',
  'stoichiometry': 'Stoichiometry and mole conversion calculator',
  'solutions': 'Solution concentration and pH calculator',
  'gas-laws': 'Gas laws and ideal gas equation calculator',
  'thermodynamics': 'Thermodynamics and Gibbs free energy calculator',
  'kinetics': 'Chemical kinetics and reaction rate calculator',
  'electrochemistry': 'Electrochemistry and cell potential calculator',
  'electron-config': 'Electron configuration calculator',

  // Interactive Tools
  '3d-viewer': '3D molecular structure viewer',
  'molecule-builder': 'Interactive molecule builder',
  'periodic-table': 'Interactive periodic table of elements',
  'lewis': 'Lewis structure generator',
  'vsepr': 'VSEPR molecular geometry predictor',
  'virtual-lab': 'Virtual chemistry laboratory',

  // Common Actions
  'calculate': 'Calculate result',
  'clear': 'Clear all inputs',
  'reset': 'Reset to default values',
  'copy': 'Copy result to clipboard',
  'export': 'Export results',
  'help': 'Show help information',
  'close': 'Close dialog',
  'next': 'Next step',
  'previous': 'Previous step',
  'undo': 'Undo last action',
  'redo': 'Redo last action',
} as const

/**
 * ARIA Descriptions for Complex Interactions
 */
export const ARIA_DESCRIPTIONS = {
  'molecule-builder-canvas': 'Click to add atoms, drag to create bonds, right-click to delete. Use keyboard shortcuts: Ctrl+Z to undo, Ctrl+Y to redo.',
  '3d-viewer-canvas': 'Drag to rotate molecule, scroll to zoom. Click atoms to view details.',
  'periodic-table-grid': 'Use arrow keys to navigate elements, Enter to select, Escape to close details.',
  'formula-input': 'Enter chemical formula. Example: H2O, CO2, CH4. Press Enter to calculate.',
  'concentration-input': 'Enter concentration in molarity (M). Example: 0.1, 1.5, 2.0',
  'temperature-input': 'Enter temperature in Kelvin. Example: 298.15, 373.15',
  'pressure-input': 'Enter pressure in atmospheres. Example: 1.0, 2.5',
} as const

/**
 * Generate accessible label for chemical formula
 */
export function getAccessibleFormula(formula: string): string {
  // Convert subscript numbers to words
  // H2O → "H 2 O" (screen readers say "H two O")
  return formula
    .replace(/(\d+)/g, ' $1 ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

/**
 * Generate accessible label for element
 */
export function getAccessibleElement(symbol: string, name: string, atomicNumber: number): string {
  return `${name}, symbol ${symbol}, atomic number ${atomicNumber}`
}

/**
 * Announce result to screen readers
 */
export function announceResult(message: string) {
  // Create or get announcement element
  let announcer = document.getElementById('sr-announcer')

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'sr-announcer'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  }

  // Announce message
  announcer.textContent = message

  // Clear after announcement
  setTimeout(() => {
    if (announcer) announcer.textContent = ''
  }, 1000)
}

/**
 * Announce error to screen readers (assertive)
 */
export function announceError(message: string) {
  let announcer = document.getElementById('sr-error-announcer')

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'sr-error-announcer'
    announcer.setAttribute('role', 'alert')
    announcer.setAttribute('aria-live', 'assertive')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  }

  announcer.textContent = message

  setTimeout(() => {
    if (announcer) announcer.textContent = ''
  }, 1000)
}

/**
 * Check color contrast ratio (WCAG 2.1 AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    // Calculate relative luminance
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG 2.1 AA standard
 */
export function meetsWCAGAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Keyboard navigation helper
 */
export interface KeyboardNavOptions {
  onEnter?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  onSpace?: () => void
}

export function handleKeyboardNav(
  event: React.KeyboardEvent,
  options: KeyboardNavOptions
) {
  switch (event.key) {
    case 'Enter':
      options.onEnter?.()
      break
    case 'Escape':
      options.onEscape?.()
      break
    case 'ArrowUp':
      event.preventDefault()
      options.onArrowUp?.()
      break
    case 'ArrowDown':
      event.preventDefault()
      options.onArrowDown?.()
      break
    case 'ArrowLeft':
      event.preventDefault()
      options.onArrowLeft?.()
      break
    case 'ArrowRight':
      event.preventDefault()
      options.onArrowRight?.()
      break
    case 'Tab':
      if (event.shiftKey) {
        options.onShiftTab?.()
      } else {
        options.onTab?.()
      }
      break
    case ' ':
      event.preventDefault()
      options.onSpace?.()
      break
  }
}

/**
 * Focus trap for modals (WCAG 2.1 requirement)
 */
export function createFocusTrap(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

// Note: React components moved to /components/accessibility/
// for proper TypeScript compilation

/**
 * Generate unique ID for accessibility (aria-labelledby, aria-describedby)
 */
let idCounter = 0
export function generateAccessibleId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}`
}
