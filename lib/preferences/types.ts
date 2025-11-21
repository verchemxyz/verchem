export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'th' | 'zh' | 'es' | 'de' | 'fr' | 'ja';
export type Region = 'US' | 'TH' | 'CN' | 'ES' | 'DE' | 'FR' | 'JP' | 'auto';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reducedMotion: boolean;
  screenReaderAnnouncements: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
}

export interface CalculatorSettings {
  decimalPlaces: number;
  scientificNotation: boolean;
  significantFigures: boolean;
  unitSystem: 'metric' | 'imperial' | 'si';
  autoCalculate: boolean;
  showSteps: boolean;
  resultFormat: 'standard' | 'scientific' | 'engineering';
}

export interface Viewer3DSettings {
  autoRotate: boolean;
  autoRotateSpeed: number;
  displayStyle: 'ball-stick' | 'space-fill' | 'wireframe' | 'cartoon';
  backgroundColor: string;
  atomColors: 'cpk' | 'shapely' | 'chain' | 'temperature';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  antiAliasing: boolean;
  shadows: boolean;
}

export interface MoleculeBuilderSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  autoSave: boolean;
  validationEnabled: boolean;
  defaultAtom: string;
  bondType: 'single' | 'double' | 'triple' | 'aromatic';
  tooltips: boolean;
}

export interface ExportSettings {
  defaultFormat: 'png' | 'jpg' | 'svg' | 'pdf' | 'mol' | 'sdf' | 'pdb';
  imageQuality: number;
  resolution: number;
  transparentBackground: boolean;
  includeWatermark: boolean;
  watermarkText: string;
  colorProfile: 'sRGB' | 'AdobeRGB' | 'ProPhotoRGB';
}

export interface KeyboardShortcuts {
  enabled: boolean;
  customBindings: Record<string, string>;
  showHints: boolean;
  vimMode: boolean;
}

export interface UISettings {
  sidebarPosition: 'left' | 'right' | 'auto';
  compactMode: boolean;
  showTooltips: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
  density: 'comfortable' | 'compact' | 'spacious';
  tabPosition: 'top' | 'side';
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  dataSharing: boolean;
  cloudSync: boolean;
  localStorageOnly: boolean;
  encryptionEnabled: boolean;
}

export interface UserPreferences {
  version: string;
  general: {
    theme: Theme;
    language: Language;
    region: Region;
    autoDetectLanguage: boolean;
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
  };
  accessibility: AccessibilitySettings;
  calculator: CalculatorSettings;
  viewer3d: Viewer3DSettings;
  moleculeBuilder: MoleculeBuilderSettings;
  export: ExportSettings;
  keyboard: KeyboardShortcuts;
  ui: UISettings;
  privacy: PrivacySettings;
  lastUpdated: string;
  userId?: string;
}

export interface PreferencesStorage {
  getPreferences(): UserPreferences | null;
  setPreferences(preferences: UserPreferences): void;
  clearPreferences(): void;
  exportPreferences(): string;
  importPreferences(data: string): boolean;
  backupPreferences(): string;
  restorePreferences(backup: string): boolean;
}

export interface PreferencesMigration {
  version: string;
  migrate(preferences: unknown): UserPreferences;
}

export type PreferenceCategory = 
  | 'general'
  | 'accessibility' 
  | 'calculator'
  | 'viewer3d'
  | 'moleculeBuilder'
  | 'export'
  | 'keyboard'
  | 'ui'
  | 'privacy';

export interface PreferenceChangeEvent {
  category: PreferenceCategory;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
}

export interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateCategory: <C extends PreferenceCategory>(
    category: C,
    updates: Partial<UserPreferences[C]>
  ) => void;
  resetPreferences: () => void;
  resetCategory: (category: PreferenceCategory) => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => boolean;
  isLoading: boolean;
  hasChanges: boolean;
}
