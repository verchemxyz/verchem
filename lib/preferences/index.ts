// Main exports
export { PreferencesProvider, usePreferences, usePreference, useCategoryPreference } from './context';
export { createPreferencesStorage, getStorageUsage, clearAllPreferences, getStorageQuota } from './storage';
export { migratePreferences, validatePreferences, getMigrationPath, isMigrationNeeded } from './migrations';

// Types
export type {
  UserPreferences,
  PreferencesStorage,
  PreferencesContextType,
  PreferenceCategory,
  PreferenceChangeEvent,
  Theme,
  Language,
  Region,
  AccessibilitySettings,
  CalculatorSettings,
  Viewer3DSettings,
  MoleculeBuilderSettings,
  ExportSettings,
  KeyboardShortcuts,
  UISettings,
  PrivacySettings,
} from './types';

// Defaults and constants
export {
  DEFAULT_PREFERENCES,
  CURRENT_VERSION,
  PREFERENCE_CATEGORIES,
  LANGUAGES,
  REGIONS,
  THEMES,
} from './defaults';

// Components (re-exported for convenience)
export { PreferencesPanel } from '@/components/preferences/PreferencesPanel';
export { QuickSettings } from '@/components/preferences/QuickSettings';
export { PreferenceToggle, PreferenceToggleGroup } from '@/components/preferences/PreferenceToggle';
export { SettingsSearch } from '@/components/preferences/SettingsSearch';

// Utility hooks
export { usePreferenceSync } from './hooks';

// Helper functions
export { exportPreferencesAsJSON, importPreferencesFromJSON } from './utils';