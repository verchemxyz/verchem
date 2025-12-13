import { UserPreferences, PreferencesStorage } from './types';
import { CURRENT_VERSION } from './defaults';
import { migratePreferences } from './migrations';

const STORAGE_KEY = 'verchem-preferences';

/**
 * SECURITY NOTE (Dec 2025 - 4-AI Audit):
 *
 * This storage uses Base64 encoding (NOT encryption) for localStorage data.
 * XOR obfuscation was removed because:
 * 1. XOR with known key provides NO real security
 * 2. localStorage data is user preferences (not secrets)
 * 3. Base64 is sufficient for preventing casual inspection
 *
 * For sensitive data, use:
 * - Server-side storage with proper encryption
 * - Signed cookies (like verchem-session)
 * - Never store secrets in localStorage
 */

class ObfuscatedStorage implements PreferencesStorage {
  private storage: Storage | null;
  private encryptionEnabled: boolean;

  constructor(storage?: Storage, encryptionEnabled: boolean = true) {
    // Only access localStorage in browser environment
    this.storage = storage || (typeof window !== 'undefined' ? localStorage : null);
    this.encryptionEnabled = encryptionEnabled;
  }

  private encode(data: string): string {
    if (!this.encryptionEnabled) return data;
    // Use Base64 encoding - sufficient for user preferences
    // NOT encryption, just encoding to prevent casual inspection
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  }

  private decode(data: string): string {
    if (!this.encryptionEnabled) return data;
    try {
      return decodeURIComponent(atob(data));
    } catch {
      // Fallback: try old XOR format for migration
      return this.decodeLegacy(data);
    }
  }

  // Migration helper for old XOR-encoded data
  private decodeLegacy(data: string): string {
    try {
      const decoded = atob(data);
      const key = 'verchem-preferences-obfuscation-key';
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch {
      return data;
    }
  }

  // Legacy method names for compatibility
  private encrypt(data: string): string {
    return this.encode(data);
  }

  private decrypt(data: string): string {
    return this.decode(data);
  }

  getPreferences(): UserPreferences | null {
    if (!this.storage) return null;

    try {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const decrypted = this.decrypt(stored);
      const parsed = JSON.parse(decrypted);

      // Migrate if needed
      if (parsed.version !== CURRENT_VERSION) {
        return migratePreferences(parsed);
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return null;
    }
  }

  setPreferences(preferences: UserPreferences): void {
    if (!this.storage) return;

    try {
      const updatedPreferences = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
      };

      const serialized = JSON.stringify(updatedPreferences);
      const encrypted = this.encrypt(serialized);

      this.storage.setItem(STORAGE_KEY, encrypted);
      
      // Notify other tabs/windows
      this.broadcastChange(updatedPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  clearPreferences(): void {
    if (!this.storage) return;

    this.storage.removeItem(STORAGE_KEY);
    this.broadcastChange(null);
  }

  exportPreferences(): string {
    const preferences = this.getPreferences();
    if (!preferences) return '';
    
    return JSON.stringify(preferences, null, 2);
  }

  importPreferences(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      const migrated = migratePreferences(parsed);
      this.setPreferences(migrated);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  backupPreferences(): string {
    const preferences = this.getPreferences();
    if (!preferences) return '';
    
    const backup = {
      ...preferences,
      backupDate: new Date().toISOString(),
      backupVersion: CURRENT_VERSION,
    };
    
    return JSON.stringify(backup, null, 2);
  }

  restorePreferences(backup: string): boolean {
    try {
      const parsed = JSON.parse(backup);
      const migrated = migratePreferences(parsed);
      this.setPreferences(migrated);
      return true;
    } catch (error) {
      console.error('Failed to restore preferences:', error);
      return false;
    }
  }

  private broadcastChange(preferences: UserPreferences | null): void {
    if (typeof window === 'undefined') return;
    
    window.dispatchEvent(new CustomEvent('preferences-changed', {
      detail: { preferences }
    }));
  }
}

// Cross-tab synchronization
class CrossTabSync {
  private listeners: Set<(preferences: UserPreferences | null) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('preferences-changed', this.handleStorageChange as EventListener);
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  private handleStorageChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { preferences } = customEvent.detail;
    this.listeners.forEach(listener => listener(preferences));
  };

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      const storage = new ObfuscatedStorage();
      const preferences = storage.getPreferences();
      this.listeners.forEach(listener => listener(preferences));
    }
  };

  subscribe(listener: (preferences: UserPreferences | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('preferences-changed', this.handleStorageChange);
      window.removeEventListener('storage', this.handleStorageEvent);
    }
  }
}

// Session storage for temporary preferences
class SessionStorage implements PreferencesStorage {
  private sessionStorage: Storage;
  private crossTabSync: CrossTabSync;

  constructor() {
    this.sessionStorage = typeof window !== 'undefined' ? window.sessionStorage : ({} as Storage);
    this.crossTabSync = new CrossTabSync();
  }

  getPreferences(): UserPreferences | null {
    try {
      const stored = this.sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Failed to load session preferences:', error);
      return null;
    }
  }

  setPreferences(preferences: UserPreferences): void {
    try {
      this.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save session preferences:', error);
    }
  }

  clearPreferences(): void {
    this.sessionStorage.removeItem(STORAGE_KEY);
  }

  exportPreferences(): string {
    const preferences = this.getPreferences();
    return preferences ? JSON.stringify(preferences, null, 2) : '';
  }

  importPreferences(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.setPreferences(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import session preferences:', error);
      return false;
    }
  }

  backupPreferences(): string {
    return this.exportPreferences();
  }

  restorePreferences(backup: string): boolean {
    return this.importPreferences(backup);
  }

  subscribe(listener: (preferences: UserPreferences | null) => void): () => void {
    return this.crossTabSync.subscribe(listener);
  }

  cleanup(): void {
    this.crossTabSync.cleanup();
  }
}

// Main storage factory
export function createPreferencesStorage(
  type: 'local' | 'session' = 'local',
  encryptionEnabled: boolean = true
): PreferencesStorage {
  if (type === 'session') {
    return new SessionStorage();
  }

  // Don't pass localStorage directly - let constructor handle browser check
  return new ObfuscatedStorage(undefined, encryptionEnabled);
}

// Utility functions
export function getStorageUsage(): number {
  if (typeof window === 'undefined') return 0;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? new Blob([stored]).size : 0;
}

export function clearAllPreferences(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getStorageQuota(): number {
  return 5 * 1024 * 1024; // 5MB typical limit
}
