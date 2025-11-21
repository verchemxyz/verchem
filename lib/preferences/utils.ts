import { UserPreferences, PreferenceCategory } from './types';
import { DEFAULT_PREFERENCES, CURRENT_VERSION, PREFERENCE_CATEGORIES } from './defaults';

// Utility type for dynamic property access
type PreferencesRecord = Record<string, unknown>;

/**
 * Export preferences as a formatted JSON string
 */
export function exportPreferencesAsJSON(preferences: UserPreferences): string {
  const exportData = {
    ...preferences,
    exportDate: new Date().toISOString(),
    exportVersion: CURRENT_VERSION,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import preferences from JSON string with validation
 */
export function importPreferencesFromJSON(jsonString: string): {
  success: boolean;
  preferences?: UserPreferences;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON format' };
    }
    
    // Check for minimum required structure
    const requiredCategories = [
      'general', 'accessibility', 'calculator', 'viewer3d',
      'moleculeBuilder', 'export', 'keyboard', 'ui', 'privacy'
    ];
    
    for (const category of requiredCategories) {
      if (!parsed[category] || typeof parsed[category] !== 'object') {
        return { success: false, error: `Missing or invalid category: ${category}` };
      }
    }
    
    // Remove export metadata if present
    delete parsed.exportDate;
    delete parsed.exportVersion;
    
    return {
      success: true,
      preferences: parsed as UserPreferences,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a backup of current preferences
 */
export function createPreferencesBackup(preferences: UserPreferences): {
  data: string;
  filename: string;
  timestamp: string;
} {
  const timestamp = new Date().toISOString();
  const filename = `verchem-preferences-backup-${timestamp.split('T')[0]}.json`;
  
  const backupData = {
    ...preferences,
    backupDate: timestamp,
    backupVersion: CURRENT_VERSION,
  };
  
  return {
    data: JSON.stringify(backupData, null, 2),
    filename,
    timestamp,
  };
}

/**
 * Download preferences as a file
 */
export function downloadPreferences(preferences: UserPreferences, filename?: string): void {
  if (typeof window === 'undefined') return;
  
  const { data, filename: defaultFilename } = createPreferencesBackup(preferences);
  const finalFilename = filename || defaultFilename;
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Get preferences differences between two sets
 */
export function getPreferencesDiff(
  current: UserPreferences,
  target: UserPreferences
): Partial<UserPreferences> {
  const diff: Partial<UserPreferences> = {};
  
  Object.keys(current).forEach((key) => {
    if (key === 'version' || key === 'lastUpdated' || key === 'userId') return;
    
    const categoryKey = key as keyof UserPreferences;
    const currentCategory = current[categoryKey];
    const targetCategory = target[categoryKey];
    
    if (
      currentCategory &&
      typeof currentCategory === 'object' &&
      targetCategory &&
      typeof targetCategory === 'object' &&
      JSON.stringify(currentCategory) !== JSON.stringify(targetCategory)
    ) {
      // Deep comparison for each property in the category
      const categoryDiff: Record<string, unknown> = {};
      const currentRecord = currentCategory as Record<string, unknown>;
      const targetRecord = targetCategory as Record<string, unknown>;
      
      Object.keys(currentRecord).forEach((prop) => {
        if (currentRecord[prop] !== targetRecord[prop]) {
          categoryDiff[prop] = targetRecord[prop];
        }
      });
      
      if (Object.keys(categoryDiff).length > 0) {
        (diff as unknown as PreferencesRecord)[categoryKey] = categoryDiff;
      }
    }
  });
  
  return diff;
}

/**
 * Merge preferences with defaults for missing properties
 */
export function mergeWithDefaults(preferences: Partial<UserPreferences>): UserPreferences {
  const merged: UserPreferences = { ...DEFAULT_PREFERENCES };
  
  Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
    if (key === 'version' || key === 'lastUpdated' || key === 'userId') return;

    const categoryKey = key as keyof UserPreferences;
    const defaultValue = DEFAULT_PREFERENCES[categoryKey];
    const prefValue = preferences[categoryKey];

    if (prefValue && typeof prefValue === 'object' && typeof defaultValue === 'object') {
      (merged as unknown as PreferencesRecord)[categoryKey] = {
        ...defaultValue,
        ...prefValue,
      };
    }
  });
  
  // Preserve user-specific fields
  if (preferences.userId) {
    merged.userId = preferences.userId;
  }
  
  if (preferences.lastUpdated) {
    merged.lastUpdated = preferences.lastUpdated;
  }
  
  return merged;
}

/**
 * Validate preferences structure and values
 */
export function validatePreferencesStructure(preferences: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!preferences || typeof preferences !== 'object') {
    errors.push('Preferences must be an object');
    return { isValid: false, errors };
  }
  
  const prefs = preferences as UserPreferences;
  
  // Check required categories
  const requiredCategories = [
    'general', 'accessibility', 'calculator', 'viewer3d',
    'moleculeBuilder', 'export', 'keyboard', 'ui', 'privacy'
  ];
  
  for (const category of requiredCategories) {
    if (!prefs[category as keyof UserPreferences]) {
      errors.push(`Missing required category: ${category}`);
      continue;
    }
    
    if (typeof prefs[category as keyof UserPreferences] !== 'object') {
      errors.push(`Category ${category} must be an object`);
    }
  }
  
  // Validate specific fields
  if (prefs.general) {
    const { theme, language } = prefs.general;
    
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      errors.push(`Invalid theme: ${theme}`);
    }
    
    if (language && !['en', 'th', 'zh', 'es', 'de', 'fr', 'ja'].includes(language)) {
      errors.push(`Invalid language: ${language}`);
    }
  }
  
  if (prefs.calculator) {
    const { decimalPlaces } = prefs.calculator;
    
    if (typeof decimalPlaces !== 'undefined' && (typeof decimalPlaces !== 'number' || decimalPlaces < 0 || decimalPlaces > 10)) {
      errors.push(`Invalid decimal places: ${decimalPlaces}`);
    }
  }
  
  if (prefs.export) {
    const { imageQuality } = prefs.export;
    
    if (typeof imageQuality !== 'undefined' && (typeof imageQuality !== 'number' || imageQuality < 0 || imageQuality > 1)) {
      errors.push(`Invalid image quality: ${imageQuality}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get a summary of preferences for display
 */
export function getPreferencesSummary(preferences: UserPreferences): {
  totalSettings: number;
  categories: Array<{
    category: string;
    settings: number;
    modified: number;
  }>;
  modifiedSettings: number;
} {
  const categories = Object.keys(PREFERENCE_CATEGORIES).map((categoryKey) => {
    const category = categoryKey as PreferenceCategory;
    const categoryData = preferences[category];
    const settings = Object.keys(categoryData).length;
    
    // Count modified settings (compared to defaults)
    const defaultCategory = DEFAULT_PREFERENCES[category];
    let modified = 0;
    
    Object.keys(categoryData).forEach((key) => {
      if (JSON.stringify(categoryData[key as keyof typeof categoryData]) !==
          JSON.stringify((defaultCategory as unknown as PreferencesRecord)[key])) {
        modified++;
      }
    });
    
    return {
      category: PREFERENCE_CATEGORIES[category].label,
      settings,
      modified,
    };
  });
  
  const totalSettings = categories.reduce((sum, cat) => sum + cat.settings, 0);
  const modifiedSettings = categories.reduce((sum, cat) => sum + cat.modified, 0);
  
  return {
    totalSettings,
    categories,
    modifiedSettings,
  };
}

/**
 * Sanitize preferences for export (remove sensitive data)
 */
export function sanitizePreferences(preferences: UserPreferences): UserPreferences {
  const sanitized = { ...preferences };
  
  // Remove user ID if present
  delete sanitized.userId;
  
  // Remove any custom keyboard bindings that might contain sensitive data
  if (sanitized.keyboard.customBindings) {
    sanitized.keyboard.customBindings = {};
  }
  
  // Remove watermark text if it's not the default
  if (sanitized.export.watermarkText !== DEFAULT_PREFERENCES.export.watermarkText) {
    sanitized.export.watermarkText = DEFAULT_PREFERENCES.export.watermarkText;
  }
  
  return sanitized;
}
