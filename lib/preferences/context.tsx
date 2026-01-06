'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserPreferences, PreferencesContextType, PreferenceChangeEvent, PreferenceCategory } from './types';
import { DEFAULT_PREFERENCES } from './defaults';
import { createPreferencesStorage } from './storage';
import { useTheme } from '../theme-context';
import { useAccessibility } from '../accessibility/context';

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

interface PreferencesProviderProps {
  children: React.ReactNode;
  storageType?: 'local' | 'session';
  encryptionEnabled?: boolean;
  autoSave?: boolean;
  onPreferenceChange?: (event: PreferenceChangeEvent) => void;
}

export function PreferencesProvider({
  children,
  storageType = 'local',
  encryptionEnabled = true,
  autoSave = true,
  onPreferenceChange,
}: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const storageRef = useRef(createPreferencesStorage(storageType, encryptionEnabled));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load preferences on mount
  useEffect(() => {
    type CleanupableStorage = {
      cleanup?: () => void;
    };

    const previousStorage = storageRef.current as unknown as CleanupableStorage;
    previousStorage.cleanup?.();

    const storage = createPreferencesStorage(storageType, encryptionEnabled);
    storageRef.current = storage;

    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const stored = await storage.getPreferences();
        
        if (stored) {
          setPreferences(stored);
        } else {
          // Save defaults if no preferences exist
          await storage.setPreferences(DEFAULT_PREFERENCES);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPreferences();

    return () => {
      const currentStorage = storage as unknown as CleanupableStorage;
      currentStorage.cleanup?.();
    };
  }, [storageType, encryptionEnabled]);

  // Sync with theme context
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(preferences.general.theme);
  }, [preferences.general.theme, setTheme]);

  // Sync with accessibility context
  const { 
    setHighContrast, 
    setReducedMotion, 
    setFontSize, 
    setScreenReaderMode 
  } = useAccessibility();
  
  useEffect(() => {
    setHighContrast(preferences.accessibility.highContrast);
    setReducedMotion(preferences.accessibility.reducedMotion);
    setFontSize(preferences.accessibility.fontSize === 'extra-large' ? 'large' : preferences.accessibility.fontSize);
    setScreenReaderMode(preferences.accessibility.screenReaderAnnouncements);
  }, [
    preferences.accessibility.highContrast,
    preferences.accessibility.reducedMotion,
    preferences.accessibility.fontSize,
    preferences.accessibility.screenReaderAnnouncements,
    setHighContrast,
    setReducedMotion,
    setFontSize,
    setScreenReaderMode
  ]);

  // Auto-save preferences
  useEffect(() => {
    if (!autoSave || !hasChanges) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void (async () => {
        try {
          await storageRef.current.setPreferences(preferences);
        } catch (error) {
          console.error('Failed to auto-save preferences:', error);
        } finally {
          setHasChanges(false);
        }
      })();
    }, 500); // Debounce for 500ms

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [preferences, autoSave, hasChanges]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'verchem-preferences' && event.newValue) {
        void storageRef.current.getPreferences().then((updated) => {
          if (updated) setPreferences(updated);
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      
      // Track changes for individual preference changes
      Object.keys(updates).forEach(category => {
        if (category === 'version' || category === 'lastUpdated' || category === 'userId') return;
        
        const categoryKey = category as PreferenceCategory;
        const oldCategory = prev[categoryKey];
        const newCategory = newPreferences[categoryKey];

        if (
          oldCategory &&
          typeof oldCategory === 'object' &&
          newCategory &&
          typeof newCategory === 'object'
        ) {
          const oldCategoryRecord = oldCategory as Record<string, unknown>;
          const newCategoryRecord = newCategory as Record<string, unknown>;

          if (JSON.stringify(oldCategoryRecord) !== JSON.stringify(newCategoryRecord)) {
            Object.keys(newCategoryRecord).forEach(key => {
              if (oldCategoryRecord[key] !== newCategoryRecord[key]) {
                const event: PreferenceChangeEvent = {
                  category: categoryKey,
                  key,
                  oldValue: oldCategoryRecord[key],
                  newValue: newCategoryRecord[key],
                  timestamp: new Date().toISOString(),
                };

                onPreferenceChange?.(event);
              }
            });
          }
        }
      });
      
      return newPreferences;
    });
    setHasChanges(true);
  }, [onPreferenceChange]);

  const updateCategory = useCallback(
    <C extends PreferenceCategory>(category: C, updates: Partial<UserPreferences[C]>) => {
      updatePreferences({
        [category]: { ...preferences[category], ...updates },
      } as Partial<UserPreferences>);
    },
    [preferences, updatePreferences]
  );

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    void storageRef.current.setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(false);
  }, []);

  const resetCategory = useCallback((category: PreferenceCategory) => {
    updatePreferences({
      [category]: DEFAULT_PREFERENCES[category],
    } as Partial<UserPreferences>);
  }, [updatePreferences]);

  const exportPreferences = useCallback(() => {
    return storageRef.current.exportPreferences();
  }, []);

  const importPreferences = useCallback(async (data: string) => {
    const success = await storageRef.current.importPreferences(data);
    if (success) {
      const imported = await storageRef.current.getPreferences();
      if (imported) {
        setPreferences(imported);
        setHasChanges(false);
      }
    }
    return success;
  }, []);

  const value: PreferencesContextType = {
    preferences,
    updatePreferences,
    updateCategory,
    resetPreferences,
    resetCategory,
    exportPreferences,
    importPreferences,
    isLoading,
    hasChanges,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export function usePreference<K extends keyof UserPreferences>(
  key: K
): [UserPreferences[K], (value: UserPreferences[K]) => void] {
  const { preferences, updatePreferences } = usePreferences();
  const setValue = useCallback(
    (value: UserPreferences[K]) => {
      updatePreferences({ [key]: value } as Partial<UserPreferences>);
    },
    [key, updatePreferences]
  );
  
  return [preferences[key], setValue];
}

export function useCategoryPreference<T>(
  category: PreferenceCategory,
  key: string
): [T, (value: T) => void] {
  const { preferences, updateCategory } = usePreferences();
  const categoryData = preferences[category] as unknown as Record<string, T>;
  const value = categoryData?.[key] as T;
  
  const setValue = useCallback(
    (newValue: T) => {
      updateCategory(category, { [key]: newValue });
    },
    [category, key, updateCategory]
  );
  
  return [value, setValue];
}
