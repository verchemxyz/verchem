'use client'

import { useEffect, useRef, useCallback } from 'react';
import { usePreferences } from './context';
import { UserPreferences, PreferenceChangeEvent, PreferenceCategory } from './types';

/**
 * Hook to synchronize preferences with external systems
 */
export function usePreferenceSync({
  onChange,
  syncInterval = 1000,
  immediate = true,
}: {
  onChange?: (event: PreferenceChangeEvent) => void;
  syncInterval?: number;
  immediate?: boolean;
} = {}) {
  const { preferences } = usePreferences();
  const previousPrefsRef = useRef<UserPreferences | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncPreferences = useCallback(() => {
    if (!previousPrefsRef.current) {
      previousPrefsRef.current = JSON.parse(JSON.stringify(preferences));
      return;
    }

    // Detect changes
    Object.keys(preferences).forEach((categoryKey) => {
      if (categoryKey === 'version' || categoryKey === 'lastUpdated' || categoryKey === 'userId') return;
      if (!previousPrefsRef.current) return;
      
      const category = categoryKey as keyof UserPreferences;
      const currentCategory = preferences[category];
      const previousCategory = previousPrefsRef.current[category];
      
      if (
        currentCategory &&
        typeof currentCategory === 'object' &&
        previousCategory &&
        typeof previousCategory === 'object' &&
        JSON.stringify(currentCategory) !== JSON.stringify(previousCategory)
      ) {
        const currentRecord = currentCategory as Record<string, unknown>;
        const previousRecord = previousCategory as Record<string, unknown>;

        // Find specific changed properties
        Object.keys(currentRecord).forEach((key) => {
          if (currentRecord[key] !== previousRecord[key]) {
            const event: PreferenceChangeEvent = {
              category: categoryKey as PreferenceCategory,
              key,
              oldValue: previousRecord[key],
              newValue: currentRecord[key],
              timestamp: new Date().toISOString(),
            };
            
            onChange?.(event);
          }
        });
      }
    });

    previousPrefsRef.current = JSON.parse(JSON.stringify(preferences));
  }, [preferences, onChange]);

  useEffect(() => {
    if (immediate) {
      syncPreferences();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(syncPreferences, syncInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [syncPreferences, syncInterval, immediate]);
}

/**
 * Hook to persist preferences to URL parameters
 */
export function useUrlPreferencesSync({
  paramName = 'prefs',
  debounceMs = 1000,
}: {
  paramName?: string;
  debounceMs?: number;
} = {}) {
  const { preferences, updatePreferences } = usePreferences();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update URL when preferences change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const url = new URL(window.location.href);
      const prefsString = JSON.stringify(preferences);
      const encodedPrefs = btoa(prefsString); // Base64 encode
      
      url.searchParams.set(paramName, encodedPrefs);
      
      // Use replaceState to avoid adding to history
      window.history.replaceState({}, '', url.toString());
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [preferences, paramName, debounceMs]);

  // Load preferences from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const encodedPrefs = url.searchParams.get(paramName);
    
    if (encodedPrefs) {
      try {
        const prefsString = atob(encodedPrefs); // Base64 decode
        const urlPreferences = JSON.parse(prefsString);
        
        // Merge with current preferences
        updatePreferences(urlPreferences);
      } catch (error) {
        console.warn('Failed to load preferences from URL:', error);
      }
    }
  }, [paramName, updatePreferences]);
}

/**
 * Hook to sync preferences with localStorage manually
 */
export function useLocalStorageSync({
  storageKey = 'verchem-preferences',
  autoSave = true,
  autoLoad = true,
}: {
  storageKey?: string;
  autoSave?: boolean;
  autoLoad?: boolean;
} = {}) {
  const { preferences, updatePreferences } = usePreferences();

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        updatePreferences(parsed);
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
    }
  }, [storageKey, updatePreferences]);

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }, [storageKey, preferences]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadFromStorage();
    }
  }, [autoLoad, loadFromStorage]);

  // Auto-save when preferences change
  useEffect(() => {
    if (autoSave) {
      saveToStorage();
    }
  }, [autoSave, saveToStorage]);

  return {
    loadFromStorage,
    saveToStorage,
  };
}

/**
 * Hook to create preference-based computed values
 */
export function usePreferenceMemo<T>(
  factory: (preferences: UserPreferences) => T,
  deps: React.DependencyList = []
): T {
  const { preferences } = usePreferences();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => factory(preferences), [preferences, ...deps]);
}

/**
 * Hook to watch specific preference changes
 */
export function usePreferenceWatcher(
  callback: (event: PreferenceChangeEvent) => void,
  categories?: string[],
  keys?: string[]
) {
  const { preferences } = usePreferences();
  const callbackRef = useRef(callback);
  const previousPrefsRef = useRef<UserPreferences | null>(null);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!previousPrefsRef.current) {
      previousPrefsRef.current = JSON.parse(JSON.stringify(preferences));
      return;
    }

    // Check for changes in specified categories/keys
    Object.keys(preferences).forEach((categoryKey) => {
      if (categoryKey === 'version' || categoryKey === 'lastUpdated' || categoryKey === 'userId') return;

      // Filter by categories if specified
      if (categories && !categories.includes(categoryKey)) return;

      const category = categoryKey as keyof UserPreferences;
      const currentCategory = preferences[category];
      const previousCategory = previousPrefsRef.current ? previousPrefsRef.current[category] : undefined;
      
      if (
        currentCategory &&
        typeof currentCategory === 'object' &&
        previousCategory &&
        typeof previousCategory === 'object' &&
        JSON.stringify(currentCategory) !== JSON.stringify(previousCategory)
      ) {
        const currentRecord = currentCategory as Record<string, unknown>;
        const previousRecord = previousCategory as Record<string, unknown>;

        Object.keys(currentRecord).forEach((key) => {
          // Filter by keys if specified
          if (keys && !keys.includes(key)) return;

          if (currentRecord[key] !== previousRecord[key]) {
            const event: PreferenceChangeEvent = {
              category: categoryKey as PreferenceCategory,
              key,
              oldValue: previousRecord[key],
              newValue: currentRecord[key],
              timestamp: new Date().toISOString(),
            };
            
            callbackRef.current(event);
          }
        });
      }
    });

    previousPrefsRef.current = JSON.parse(JSON.stringify(preferences));
  }, [preferences, categories, keys]);
}

/**
 * Hook to create preference-based conditional rendering
 */
export function usePreferenceCondition(
  condition: (preferences: UserPreferences) => boolean,
  deps: React.DependencyList = []
): boolean {
  return usePreferenceMemo(condition, deps);
}

// Re-import React for the hooks
import React from 'react';
