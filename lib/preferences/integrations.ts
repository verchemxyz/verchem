import { useEffect } from 'react';
import { usePreferences } from './context';
import { useTheme } from '../theme-context';
import { useAccessibility } from '../accessibility/context';

/**
 * Integration hook that syncs preferences with existing VerChem systems
 */
export function useVerChemIntegrations() {
  const { preferences } = usePreferences();
  const { setTheme } = useTheme();
  const {
    setHighContrast,
    setReducedMotion,
    setFontSize,
    setScreenReaderMode
  } = useAccessibility();

  // Sync theme preferences
  useEffect(() => {
    setTheme(preferences.general.theme);
  }, [preferences.general.theme, setTheme]);

  // Sync accessibility preferences
  useEffect(() => {
    setHighContrast(preferences.accessibility.highContrast);
  }, [preferences.accessibility.highContrast, setHighContrast]);

  useEffect(() => {
    setReducedMotion(preferences.accessibility.reducedMotion);
  }, [preferences.accessibility.reducedMotion, setReducedMotion]);

  useEffect(() => {
    // Convert extra-large to large for accessibility context
    const fontSize = preferences.accessibility.fontSize === 'extra-large'
      ? 'large'
      : preferences.accessibility.fontSize as 'small' | 'medium' | 'large';
    setFontSize(fontSize);
  }, [preferences.accessibility.fontSize, setFontSize]);

  useEffect(() => {
    setScreenReaderMode(preferences.accessibility.screenReaderAnnouncements);
  }, [preferences.accessibility.screenReaderAnnouncements, setScreenReaderMode]);

  // Sync language preferences with i18n
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const globalWindow = window as typeof window & {
        i18n?: {
          language: string;
          changeLanguage: (language: string) => void;
        };
      };

      const i18n = globalWindow.i18n;
      if (i18n) {
      
        // Change language if different from current
        if (i18n.language !== preferences.general.language) {
          i18n.changeLanguage(preferences.general.language);
        }
      }
    }
  }, [preferences.general.language]);

  // Apply calculator settings to calculation components
  useEffect(() => {
    // This would integrate with your calculator components
    // For example, setting precision, notation, etc.
    const calculatorConfig = {
      decimalPlaces: preferences.calculator.decimalPlaces,
      scientificNotation: preferences.calculator.scientificNotation,
      significantFigures: preferences.calculator.significantFigures,
      unitSystem: preferences.calculator.unitSystem,
      resultFormat: preferences.calculator.resultFormat,
    };
    
    // Dispatch custom event or update context
    window.dispatchEvent(new CustomEvent('calculator-config-changed', {
      detail: calculatorConfig
    }));
  }, [preferences.calculator]);

  // Apply 3D viewer settings
  useEffect(() => {
    const viewerConfig = {
      autoRotate: preferences.viewer3d.autoRotate,
      autoRotateSpeed: preferences.viewer3d.autoRotateSpeed,
      displayStyle: preferences.viewer3d.displayStyle,
      backgroundColor: preferences.viewer3d.backgroundColor,
      atomColors: preferences.viewer3d.atomColors,
      quality: preferences.viewer3d.quality,
      antiAliasing: preferences.viewer3d.antiAliasing,
      shadows: preferences.viewer3d.shadows,
    };
    
    window.dispatchEvent(new CustomEvent('viewer3d-config-changed', {
      detail: viewerConfig
    }));
  }, [preferences.viewer3d]);

  // Apply molecule builder settings
  useEffect(() => {
    const builderConfig = {
      gridSize: preferences.moleculeBuilder.gridSize,
      snapToGrid: preferences.moleculeBuilder.snapToGrid,
      showGrid: preferences.moleculeBuilder.showGrid,
      autoSave: preferences.moleculeBuilder.autoSave,
      validationEnabled: preferences.moleculeBuilder.validationEnabled,
      defaultAtom: preferences.moleculeBuilder.defaultAtom,
      bondType: preferences.moleculeBuilder.bondType,
      tooltips: preferences.moleculeBuilder.tooltips,
    };
    
    window.dispatchEvent(new CustomEvent('molecule-builder-config-changed', {
      detail: builderConfig
    }));
  }, [preferences.moleculeBuilder]);

  // Apply export settings
  useEffect(() => {
    const exportConfig = {
      defaultFormat: preferences.export.defaultFormat,
      imageQuality: preferences.export.imageQuality,
      resolution: preferences.export.resolution,
      transparentBackground: preferences.export.transparentBackground,
      includeWatermark: preferences.export.includeWatermark,
      watermarkText: preferences.export.watermarkText,
      colorProfile: preferences.export.colorProfile,
    };
    
    window.dispatchEvent(new CustomEvent('export-config-changed', {
      detail: exportConfig
    }));
  }, [preferences.export]);

  // Apply UI settings
  useEffect(() => {
    const uiConfig = {
      sidebarPosition: preferences.ui.sidebarPosition,
      compactMode: preferences.ui.compactMode,
      showTooltips: preferences.ui.showTooltips,
      animationSpeed: preferences.ui.animationSpeed,
      density: preferences.ui.density,
      tabPosition: preferences.ui.tabPosition,
    };
    
    // Apply CSS classes based on settings
    document.documentElement.classList.toggle('compact-mode', preferences.ui.compactMode);
    document.documentElement.classList.toggle('reduced-motion', preferences.accessibility.reducedMotion);
    document.documentElement.classList.toggle('high-contrast', preferences.accessibility.highContrast);
    
    // Set font size class
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (preferences.accessibility.fontSize !== 'medium') {
      document.documentElement.classList.add(`font-size-${preferences.accessibility.fontSize}`);
    }
    
    window.dispatchEvent(new CustomEvent('ui-config-changed', {
      detail: uiConfig
    }));
  }, [preferences.ui, preferences.accessibility]);
}

/**
 * Integration with keyboard shortcuts system
 */
export function useKeyboardShortcutsIntegration() {
  const { preferences } = usePreferences();

  useEffect(() => {
    if (!preferences.keyboard.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for custom bindings
      const keyCombo = getKeyCombo(event);
      const customAction = preferences.keyboard.customBindings[keyCombo];
      
      if (customAction) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('keyboard-shortcut-triggered', {
          detail: { action: customAction, keyCombo }
        }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboard]);
}

/**
 * Integration with analytics system
 */
export function useAnalyticsIntegration() {
  const { preferences } = usePreferences();

  useEffect(() => {
    if (preferences.privacy.analyticsEnabled) {
      // Enable analytics
      window.dispatchEvent(new CustomEvent('analytics-enabled'));
    } else {
      // Disable analytics
      window.dispatchEvent(new CustomEvent('analytics-disabled'));
    }
  }, [preferences.privacy.analyticsEnabled]);

  // Track preference changes
  useEffect(() => {
    const handlePreferenceChange = (event: CustomEvent) => {
      if (preferences.privacy.analyticsEnabled) {
        // Track the preference change
        window.dispatchEvent(new CustomEvent('track-event', {
          detail: {
            event: 'preference_changed',
            properties: event.detail
          }
        }));
      }
    };

    window.addEventListener('preference-changed', handlePreferenceChange as EventListener);
    return () => window.removeEventListener('preference-changed', handlePreferenceChange as EventListener);
  }, [preferences.privacy.analyticsEnabled]);
}

/**
 * Integration with cloud sync system (preparation for future implementation)
 */
export function useCloudSyncIntegration() {
  const { preferences } = usePreferences();

  useEffect(() => {
    if (preferences.privacy.cloudSync) {
      // Trigger cloud sync
      window.dispatchEvent(new CustomEvent('cloud-sync-enabled'));
    } else {
      window.dispatchEvent(new CustomEvent('cloud-sync-disabled'));
    }
  }, [preferences.privacy.cloudSync]);
}

// Helper function to get key combination string
function getKeyCombo(event: KeyboardEvent): string {
  const parts = [];
  
  if (event.ctrlKey) parts.push('Ctrl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  if (event.metaKey) parts.push('Meta');
  
  if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    parts.push(event.key);
  }
  
  return parts.join('+');
}
