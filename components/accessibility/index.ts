// Accessibility Components
export { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';
export { AccessibilityMenu } from './accessibility-menu';
export { SkipLinks, SkipLinkTarget } from './skip-links';
export { EnhancedNavigation } from './enhanced-navigation';
export { EnhancedCalculator } from './enhanced-calculator';
export { Enhanced3DViewer } from './enhanced-3d-viewer';

// Accessibility Hooks
export { useAccessibility } from '@/lib/accessibility/context';
export { useAccessibilityFeatures, useLiveRegion, useFocusManagement } from '@/lib/accessibility/use-accessibility-features';
export { useFocusManager } from '@/lib/accessibility/focus-manager';

// Accessibility Utilities
export { ARIA_LABELS, createElementLabel, createElementDescription, createCalculatorButtonLabel, createViewerControlLabel, validateARIAAttributes } from '@/lib/accessibility/aria-labels';
export { GLOBAL_SHORTCUTS, CALCULATOR_SHORTCUTS, VIEWER_3D_SHORTCUTS, MOLECULE_BUILDER_SHORTCUTS, matchesShortcut, getShortcutsByCategory, getShortcutsByContext } from '@/lib/accessibility/keyboard-shortcuts';
export { FocusManager } from '@/lib/accessibility/focus-manager';

// Context Provider
export { AccessibilityProvider } from '@/lib/accessibility/context';