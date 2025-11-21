import { DEFAULT_PREFERENCES, CURRENT_VERSION } from './defaults';
import { UserPreferences } from './types';

// Utility type for dynamic property access
type PreferencesRecord = Record<string, unknown>;

export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  migrate: (preferences: Record<string, unknown>) => Record<string, unknown>;
}

type LegacyPreferences = Partial<UserPreferences> & {
  theme?: unknown;
  language?: unknown;
  [key: string]: unknown;
};

const migrations: MigrationStep[] = [
  {
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    migrate: (preferences: Record<string, unknown>) => {
      const prefs = { ...preferences } as LegacyPreferences;

      // Migrate from old theme system
      if (prefs.theme && !prefs.general) {
        prefs.general = {
          ...DEFAULT_PREFERENCES.general,
          theme: prefs.theme as UserPreferences['general']['theme'],
        };
        delete prefs.theme;
      }

      // Migrate from old language system
      if (prefs.language && !prefs.general?.language) {
        if (!prefs.general) {
          prefs.general = { ...DEFAULT_PREFERENCES.general };
        }
        prefs.general.language = prefs.language as UserPreferences['general']['language'];
        delete prefs.language;
      }

      // Add new categories with defaults
      if (!prefs.accessibility) {
        prefs.accessibility = { ...DEFAULT_PREFERENCES.accessibility };
      }
      
      if (!prefs.calculator) {
        prefs.calculator = { ...DEFAULT_PREFERENCES.calculator };
      }
      
      if (!prefs.viewer3d) {
        prefs.viewer3d = { ...DEFAULT_PREFERENCES.viewer3d };
      }
      
      if (!prefs.moleculeBuilder) {
        prefs.moleculeBuilder = { ...DEFAULT_PREFERENCES.moleculeBuilder };
      }
      
      if (!prefs.export) {
        prefs.export = { ...DEFAULT_PREFERENCES.export };
      }
      
      if (!prefs.keyboard) {
        prefs.keyboard = { ...DEFAULT_PREFERENCES.keyboard };
      }
      
      if (!prefs.ui) {
        prefs.ui = { ...DEFAULT_PREFERENCES.ui };
      }
      
      if (!prefs.privacy) {
        prefs.privacy = { ...DEFAULT_PREFERENCES.privacy };
      }

      // Update version
      prefs.version = '1.0.0';
      
      return prefs as Record<string, unknown>;
    },
  },
];

export function migratePreferences(preferences: unknown): UserPreferences {
  if (!preferences || typeof preferences !== 'object') {
    return DEFAULT_PREFERENCES;
  }

  const basePreferences = preferences as Record<string, unknown>;

  const currentVersion =
    typeof basePreferences.version === 'string' ? (basePreferences.version as string) : '0.9.0';
  
  // If already on current version, return as-is
  if (currentVersion === CURRENT_VERSION) {
    return { ...DEFAULT_PREFERENCES, ...(basePreferences as Partial<UserPreferences>) };
  }

  let migratedPreferences: Record<string, unknown> = { ...basePreferences };
  let current = currentVersion;

  // Apply migrations in order
  while (current !== CURRENT_VERSION) {
    const migration = migrations.find(m => m.fromVersion === current);
    
    if (!migration) {
      console.warn(`No migration found from version ${current}, falling back to defaults`);
      return DEFAULT_PREFERENCES;
    }

    try {
      migratedPreferences = migration.migrate(migratedPreferences);
      current = migration.toVersion;
    } catch (error) {
      console.error(`Migration from ${current} failed:`, error);
      return DEFAULT_PREFERENCES;
    }
  }

  // Ensure all required fields exist
  return mergeWithDefaults(migratedPreferences);
}

function mergeWithDefaults(preferences: Record<string, unknown>): UserPreferences {
  const merged: UserPreferences = { ...DEFAULT_PREFERENCES };
  
  // Deep merge each category
  (Object.keys(DEFAULT_PREFERENCES) as (keyof UserPreferences)[]).forEach(key => {
    if (key === 'version' || key === 'lastUpdated' || key === 'userId') return;

    const defaultValue = DEFAULT_PREFERENCES[key];
    const prefValue = preferences[key as string];

    if (prefValue && typeof prefValue === 'object' && typeof defaultValue === 'object') {
      (merged as unknown as PreferencesRecord)[key] = {
        ...defaultValue,
        ...(prefValue as Record<string, unknown>),
      };
    }
  });

  // Preserve user-specific fields
  const input = preferences as Partial<UserPreferences>;
  if (input.userId) {
    merged.userId = input.userId;
  }
  
  if (input.lastUpdated) {
    merged.lastUpdated = input.lastUpdated;
  }

  merged.version = CURRENT_VERSION;

  return merged;
}

export function validatePreferences(preferences: unknown): boolean {
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }

  const prefs = preferences as UserPreferences;

  // Check required top-level structure
  const requiredCategories = [
    'general', 'accessibility', 'calculator', 'viewer3d',
    'moleculeBuilder', 'export', 'keyboard', 'ui', 'privacy'
  ];

  for (const category of requiredCategories) {
    if (!prefs[category as keyof UserPreferences] || typeof prefs[category as keyof UserPreferences] !== 'object') {
      console.warn(`Missing or invalid category: ${category}`);
      return false;
    }
  }

  // Validate specific fields
  try {
    // General settings
    if (!['light', 'dark', 'system'].includes(prefs.general.theme)) {
      return false;
    }
    
    if (!['en', 'th', 'zh', 'es', 'de', 'fr', 'ja'].includes(prefs.general.language)) {
      return false;
    }

    // Calculator settings
    if (typeof prefs.calculator.decimalPlaces !== 'number' || 
        prefs.calculator.decimalPlaces < 0 || 
        prefs.calculator.decimalPlaces > 10) {
      return false;
    }

    // Viewer 3D settings
    if (!['low', 'medium', 'high', 'ultra'].includes(prefs.viewer3d.quality)) {
      return false;
    }

    // Export settings
    if (typeof prefs.export.imageQuality !== 'number' ||
        prefs.export.imageQuality < 0 ||
        prefs.export.imageQuality > 1) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Preference validation error:', error);
    return false;
  }
}

export function getMigrationPath(fromVersion: string, toVersion: string): MigrationStep[] {
  const path: MigrationStep[] = [];
  let current = fromVersion;

  while (current !== toVersion) {
    const migration = migrations.find(m => m.fromVersion === current);
    if (!migration) break;
    
    path.push(migration);
    current = migration.toVersion;
  }

  return path;
}

export function isMigrationNeeded(version: string): boolean {
  return version !== CURRENT_VERSION;
}
