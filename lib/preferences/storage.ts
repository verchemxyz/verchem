import { UserPreferences, PreferencesStorage } from './types';
import { CURRENT_VERSION } from './defaults';
import { migratePreferences } from './migrations';

const STORAGE_KEY = 'verchem-preferences';
const AES_KEY_STORAGE_KEY = 'verchem-preferences-aes-key-v1';
const LEGACY_XOR_KEY = 'verchem-preferences-obfuscation-key';

type EncryptedPayloadV1 = {
  v: 1;
  alg: 'AES-GCM';
  iv: string;
  ct: string;
};

function isEncryptedPayloadV1(value: unknown): value is EncryptedPayloadV1 {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.v === 1 &&
    record.alg === 'AES-GCM' &&
    typeof record.iv === 'string' &&
    typeof record.ct === 'string'
  );
}

function hasWebCrypto(): boolean {
  const maybeCrypto = (globalThis as typeof globalThis & { crypto?: Crypto }).crypto;
  return (
    !!maybeCrypto &&
    typeof maybeCrypto.getRandomValues === 'function' &&
    !!maybeCrypto.subtle &&
    typeof maybeCrypto.subtle.encrypt === 'function' &&
    typeof maybeCrypto.subtle.decrypt === 'function'
  );
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function utf8ToBytes(text: string): Uint8Array {
  return textEncoder.encode(text);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}

function base64EncodeBytes(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64DecodeToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  // Ensure an ArrayBuffer-backed view for Web Crypto typings (TS 5.x + ArrayBufferLike).
  return new Uint8Array(bytes).buffer as ArrayBuffer;
}

function isBase64String(value: string): boolean {
  if (!value) return false;
  if (value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function encodeLegacyBase64Uri(text: string): string {
  // Legacy format: Base64(encodeURIComponent(JSON))
  return base64EncodeBytes(utf8ToBytes(encodeURIComponent(text)));
}

function tryDecodeLegacyBase64Uri(data: string): string | null {
  if (!isBase64String(data)) return null;

  try {
    const decoded = bytesToUtf8(base64DecodeToBytes(data));
    return decodeURIComponent(decoded);
  } catch {
    return null;
  }
}

function tryDecodeLegacyXorBase64(data: string): string | null {
  if (!isBase64String(data)) return null;

  try {
    const bytes = base64DecodeToBytes(data);
    let decrypted = '';
    for (let i = 0; i < bytes.length; i++) {
      decrypted += String.fromCharCode(
        bytes[i] ^ LEGACY_XOR_KEY.charCodeAt(i % LEGACY_XOR_KEY.length)
      );
    }
    return decrypted;
  } catch {
    return null;
  }
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parsePreferencesOrNull(text: string): UserPreferences | null {
  const parsed = tryParseJson(text);
  if (!parsed) return null;

  const record = parsed as { version?: unknown };
  if (record.version !== CURRENT_VERSION) {
    return migratePreferences(parsed);
  }

  return parsed as UserPreferences;
}

/**
 * AES-GCM encrypted storage (Web Crypto).
 *
 * SECURITY NOTE:
 * - Key is generated client-side and stored locally for usability.
 * - This protects against casual localStorage inspection, but is NOT suitable for secrets.
 * - XSS or malicious extensions can still read preferences and the key at runtime.
 */
class EncryptedStorage implements PreferencesStorage {
  private storage: Storage | null;
  private encryptAtRest: boolean;
  private keyCache: CryptoKey | null = null;

  constructor(storage?: Storage, encryptAtRest: boolean = true) {
    this.storage = storage || (typeof window !== 'undefined' ? localStorage : null);
    this.encryptAtRest = encryptAtRest;
  }

  private getCrypto(): Crypto {
    if (!hasWebCrypto()) {
      throw new Error('Web Crypto API is not available');
    }
    return crypto;
  }

  private async getOrCreateKey(): Promise<CryptoKey> {
    if (this.keyCache) return this.keyCache;
    if (!this.storage) throw new Error('Storage is not available');

    const existing = this.storage.getItem(AES_KEY_STORAGE_KEY);
    let rawKey: Uint8Array | null = null;

    if (existing && isBase64String(existing)) {
      try {
        rawKey = base64DecodeToBytes(existing);
      } catch {
        rawKey = null;
      }
    }

    if (!rawKey || rawKey.length !== 32) {
      rawKey = new Uint8Array(32);
      this.getCrypto().getRandomValues(rawKey);
      this.storage.setItem(AES_KEY_STORAGE_KEY, base64EncodeBytes(rawKey));
    }

    const key = await this.getCrypto().subtle.importKey(
      'raw',
      toArrayBuffer(rawKey),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.keyCache = key;
    return key;
  }

  private async encryptString(plaintext: string): Promise<string> {
    const key = await this.getOrCreateKey();
    const iv = new Uint8Array(12);
    this.getCrypto().getRandomValues(iv);

    const ciphertext = await this.getCrypto().subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(utf8ToBytes(plaintext))
    );

    const payload: EncryptedPayloadV1 = {
      v: 1,
      alg: 'AES-GCM',
      iv: base64EncodeBytes(iv),
      ct: base64EncodeBytes(new Uint8Array(ciphertext)),
    };

    return JSON.stringify(payload);
  }

  private async tryDecryptToPlaintext(stored: string): Promise<string | null> {
    const parsed = tryParseJson(stored);
    if (!isEncryptedPayloadV1(parsed)) return null;

    try {
      const key = await this.getOrCreateKey();
      const iv = base64DecodeToBytes(parsed.iv);
      const ciphertext = base64DecodeToBytes(parsed.ct);

      const plaintextBuffer = await this.getCrypto().subtle.decrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv) },
        key,
        toArrayBuffer(ciphertext)
      );

      return bytesToUtf8(new Uint8Array(plaintextBuffer));
    } catch (error) {
      console.warn('Failed to decrypt preferences:', error);
      return null;
    }
  }

  async getPreferences(): Promise<UserPreferences | null> {
    if (!this.storage) return null;

    const stored = this.storage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const decrypted = await this.tryDecryptToPlaintext(stored);
    if (decrypted) {
      return parsePreferencesOrNull(decrypted);
    }

    // Legacy formats: raw JSON, Base64(encodeURIComponent(JSON)), or XOR+Base64
    const candidates = [
      stored,
      tryDecodeLegacyBase64Uri(stored),
      tryDecodeLegacyXorBase64(stored),
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);

    for (const candidate of candidates) {
      const preferences = parsePreferencesOrNull(candidate);
      if (!preferences) continue;

      if (this.encryptAtRest) {
        // Migrate stored format → encrypted at rest (without altering the preference data)
        try {
          const encrypted = await this.encryptString(JSON.stringify(preferences));
          this.storage.setItem(STORAGE_KEY, encrypted);
        } catch (error) {
          console.warn('Failed to migrate preferences to encrypted storage:', error);
        }
      }

      return preferences;
    }

    return null;
  }

  async setPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.storage) return;

    try {
      const updatedPreferences: UserPreferences = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
      };

      const serialized = JSON.stringify(updatedPreferences);
      const stored = this.encryptAtRest ? await this.encryptString(serialized) : serialized;

      this.storage.setItem(STORAGE_KEY, stored);
      this.broadcastChange(updatedPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  async clearPreferences(): Promise<void> {
    if (!this.storage) return;

    this.storage.removeItem(STORAGE_KEY);
    this.broadcastChange(null);
  }

  async exportPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    return preferences ? JSON.stringify(preferences, null, 2) : '';
  }

  async importPreferences(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      const migrated = migratePreferences(parsed);
      await this.setPreferences(migrated);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  async backupPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    if (!preferences) return '';

    const backup = {
      ...preferences,
      backupDate: new Date().toISOString(),
      backupVersion: CURRENT_VERSION,
    };

    return JSON.stringify(backup, null, 2);
  }

  async restorePreferences(backup: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(backup);
      const migrated = migratePreferences(parsed);
      await this.setPreferences(migrated);
      return true;
    } catch (error) {
      console.error('Failed to restore preferences:', error);
      return false;
    }
  }

  private broadcastChange(preferences: UserPreferences | null): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent('preferences-changed', {
        detail: { preferences },
      })
    );
  }
}

/**
 * Base64/URI encoding fallback (non-cryptographic).
 *
 * NOTE: Used when Web Crypto is unavailable or when `encryptionEnabled=false`.
 */
class ObfuscatedStorage implements PreferencesStorage {
  private storage: Storage | null;
  private encodingEnabled: boolean;

  constructor(storage?: Storage, encodingEnabled: boolean = true) {
    this.storage = storage || (typeof window !== 'undefined' ? localStorage : null);
    this.encodingEnabled = encodingEnabled;
  }

  private encode(data: string): string {
    if (!this.encodingEnabled) return data;
    try {
      return encodeLegacyBase64Uri(data);
    } catch {
      return data;
    }
  }

  private decode(data: string): string {
    const decoded = tryDecodeLegacyBase64Uri(data);
    if (decoded !== null) return decoded;

    const xorDecoded = tryDecodeLegacyXorBase64(data);
    if (xorDecoded !== null) return xorDecoded;

    return data;
  }

  async getPreferences(): Promise<UserPreferences | null> {
    if (!this.storage) return null;

    try {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const decoded = this.decode(stored);
      const parsed = JSON.parse(decoded);

      if (parsed.version !== CURRENT_VERSION) {
        return migratePreferences(parsed);
      }

      return parsed as UserPreferences;
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return null;
    }
  }

  async setPreferences(preferences: UserPreferences): Promise<void> {
    if (!this.storage) return;

    try {
      const updatedPreferences: UserPreferences = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
      };

      const serialized = JSON.stringify(updatedPreferences);
      const encoded = this.encode(serialized);

      this.storage.setItem(STORAGE_KEY, encoded);
      this.broadcastChange(updatedPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  async clearPreferences(): Promise<void> {
    if (!this.storage) return;

    this.storage.removeItem(STORAGE_KEY);
    this.broadcastChange(null);
  }

  async exportPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    return preferences ? JSON.stringify(preferences, null, 2) : '';
  }

  async importPreferences(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      const migrated = migratePreferences(parsed);
      await this.setPreferences(migrated);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  async backupPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    if (!preferences) return '';

    const backup = {
      ...preferences,
      backupDate: new Date().toISOString(),
      backupVersion: CURRENT_VERSION,
    };

    return JSON.stringify(backup, null, 2);
  }

  async restorePreferences(backup: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(backup);
      const migrated = migratePreferences(parsed);
      await this.setPreferences(migrated);
      return true;
    } catch (error) {
      console.error('Failed to restore preferences:', error);
      return false;
    }
  }

  private broadcastChange(preferences: UserPreferences | null): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent('preferences-changed', {
        detail: { preferences },
      })
    );
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
    if (event.key !== STORAGE_KEY) return;

    const storage = createPreferencesStorage('local', false);
    void storage.getPreferences().then((preferences) => {
      this.listeners.forEach((listener) => listener(preferences));
    });
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

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const stored = this.sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored) as UserPreferences;
    } catch (error) {
      console.warn('Failed to load session preferences:', error);
      return null;
    }
  }

  async setPreferences(preferences: UserPreferences): Promise<void> {
    try {
      this.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save session preferences:', error);
    }
  }

  async clearPreferences(): Promise<void> {
    this.sessionStorage.removeItem(STORAGE_KEY);
  }

  async exportPreferences(): Promise<string> {
    const preferences = await this.getPreferences();
    return preferences ? JSON.stringify(preferences, null, 2) : '';
  }

  async importPreferences(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      await this.setPreferences(parsed as UserPreferences);
      return true;
    } catch (error) {
      console.error('Failed to import session preferences:', error);
      return false;
    }
  }

  async backupPreferences(): Promise<string> {
    return this.exportPreferences();
  }

  async restorePreferences(backup: string): Promise<boolean> {
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

  if (hasWebCrypto()) {
    return new EncryptedStorage(undefined, encryptionEnabled);
  }

  return new ObfuscatedStorage(undefined, encryptionEnabled);
}

// Utility functions
export function getStorageUsage(): number {
  if (typeof window === 'undefined') return 0;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  const key = localStorage.getItem(AES_KEY_STORAGE_KEY);

  const storedSize = stored ? new Blob([stored]).size : 0;
  const keySize = key ? new Blob([key]).size : 0;

  return storedSize + keySize;
}

export function clearAllPreferences(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AES_KEY_STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getStorageQuota(): number {
  return 5 * 1024 * 1024; // 5MB typical limit
}
