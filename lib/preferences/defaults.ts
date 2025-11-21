import { UserPreferences } from './types';

export const CURRENT_VERSION = '1.0.0';

export const DEFAULT_PREFERENCES: UserPreferences = {
  version: CURRENT_VERSION,
  general: {
    theme: 'system',
    language: 'en',
    region: 'auto',
    autoDetectLanguage: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  accessibility: {
    highContrast: false,
    fontSize: 'medium',
    reducedMotion: false,
    screenReaderAnnouncements: true,
    keyboardNavigation: true,
    focusIndicators: true,
  },
  calculator: {
    decimalPlaces: 4,
    scientificNotation: false,
    significantFigures: true,
    unitSystem: 'metric',
    autoCalculate: true,
    showSteps: true,
    resultFormat: 'standard',
  },
  viewer3d: {
    autoRotate: false,
    autoRotateSpeed: 1,
    displayStyle: 'ball-stick',
    backgroundColor: '#ffffff',
    atomColors: 'cpk',
    quality: 'medium',
    antiAliasing: true,
    shadows: true,
  },
  moleculeBuilder: {
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
    autoSave: true,
    validationEnabled: true,
    defaultAtom: 'C',
    bondType: 'single',
    tooltips: true,
  },
  export: {
    defaultFormat: 'png',
    imageQuality: 0.9,
    resolution: 300,
    transparentBackground: false,
    includeWatermark: false,
    watermarkText: 'VerChem',
    colorProfile: 'sRGB',
  },
  keyboard: {
    enabled: true,
    customBindings: {},
    showHints: true,
    vimMode: false,
  },
  ui: {
    sidebarPosition: 'left',
    compactMode: false,
    showTooltips: true,
    animationSpeed: 'normal',
    density: 'comfortable',
    tabPosition: 'top',
  },
  privacy: {
    analyticsEnabled: true,
    dataSharing: false,
    cloudSync: false,
    localStorageOnly: false,
    encryptionEnabled: true,
  },
  lastUpdated: new Date().toISOString(),
};

export const PREFERENCE_CATEGORIES = {
  general: {
    label: 'General',
    description: 'Theme, language, and regional settings',
    icon: 'settings',
  },
  accessibility: {
    label: 'Accessibility',
    description: 'Visual and interaction preferences',
    icon: 'accessibility',
  },
  calculator: {
    label: 'Calculator',
    description: 'Calculation and display preferences',
    icon: 'calculator',
  },
  viewer3d: {
    label: '3D Viewer',
    description: '3D molecule viewer settings',
    icon: 'cube',
  },
  moleculeBuilder: {
    label: 'Molecule Builder',
    description: 'Building and editing preferences',
    icon: 'molecule',
  },
  export: {
    label: 'Export',
    description: 'Export and download settings',
    icon: 'download',
  },
  keyboard: {
    label: 'Keyboard',
    description: 'Keyboard shortcuts and bindings',
    icon: 'keyboard',
  },
  ui: {
    label: 'Interface',
    description: 'User interface preferences',
    icon: 'layout',
  },
  privacy: {
    label: 'Privacy',
    description: 'Privacy and data settings',
    icon: 'shield',
  },
} as const;

export const LANGUAGES = {
  en: { name: 'English', native: 'English', flag: '🇺🇸' },
  th: { name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  zh: { name: 'Chinese', native: '中文', flag: '🇨🇳' },
  es: { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  de: { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'French', native: 'Français', flag: '🇫🇷' },
  ja: { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
} as const;

export const REGIONS = {
  US: { name: 'United States', flag: '🇺🇸', currency: 'USD' },
  TH: { name: 'Thailand', flag: '🇹🇭', currency: 'THB' },
  CN: { name: 'China', flag: '🇨🇳', currency: 'CNY' },
  ES: { name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
  DE: { name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  FR: { name: 'France', flag: '🇫🇷', currency: 'EUR' },
  JP: { name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  auto: { name: 'Auto-detect', flag: '🌍', currency: 'auto' },
} as const;

export const THEMES = {
  light: { name: 'Light', icon: 'sun' },
  dark: { name: 'Dark', icon: 'moon' },
  system: { name: 'System', icon: 'computer' },
} as const;