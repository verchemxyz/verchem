export const themeConfig = {
  light: {
    // Primary colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    // Secondary colors (purple)
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
    // Neutral colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    // Background and foreground
    background: '#ffffff',
    foreground: '#171717',
    // Card colors
    card: '#ffffff',
    'card-foreground': '#171717',
    // Popover colors
    popover: '#ffffff',
    'popover-foreground': '#171717',
    // Input colors
    input: '#ffffff',
    'input-border': '#e5e5e5',
    // Border and ring
    border: '#e5e5e5',
    ring: '#3b82f6',
    // Muted colors
    muted: '#f5f5f5',
    'muted-foreground': '#737373',
    // Accent colors
    accent: '#f5f5f5',
    'accent-foreground': '#171717',
    // Destructive colors
    destructive: '#ef4444',
    'destructive-foreground': '#ffffff',
    // Success colors
    success: '#10b981',
    'success-foreground': '#ffffff',
    // Warning colors
    warning: '#f59e0b',
    'warning-foreground': '#ffffff',
    // Info colors
    info: '#3b82f6',
    'info-foreground': '#ffffff',
  },
  dark: {
    // Primary colors
    primary: {
      50: '#172554',
      100: '#1e3a8a',
      200: '#1e40af',
      300: '#1d4ed8',
      400: '#2563eb',
      500: '#3b82f6',
      600: '#60a5fa',
      700: '#93c5fd',
      800: '#bfdbfe',
      900: '#dbeafe',
      950: '#eff6ff',
    },
    // Secondary colors (purple)
    secondary: {
      50: '#3b0764',
      100: '#581c87',
      200: '#6b21a8',
      300: '#7c3aed',
      400: '#9333ea',
      500: '#a855f7',
      600: '#c084fc',
      700: '#d8b4fe',
      800: '#e9d5ff',
      900: '#f3e8ff',
      950: '#faf5ff',
    },
    // Neutral colors
    neutral: {
      50: '#0a0a0a',
      100: '#171717',
      200: '#262626',
      300: '#404040',
      400: '#525252',
      500: '#737373',
      600: '#a3a3a3',
      700: '#d4d4d4',
      800: '#e5e5e5',
      900: '#f5f5f5',
      950: '#fafafa',
    },
    // Background and foreground
    background: '#0a0a0a',
    foreground: '#fafafa',
    // Card colors
    card: '#171717',
    'card-foreground': '#fafafa',
    // Popover colors
    popover: '#171717',
    'popover-foreground': '#fafafa',
    // Input colors
    input: '#262626',
    'input-border': '#404040',
    // Border and ring
    border: '#262626',
    ring: '#3b82f6',
    // Muted colors
    muted: '#262626',
    'muted-foreground': '#a3a3a3',
    // Accent colors
    accent: '#262626',
    'accent-foreground': '#fafafa',
    // Destructive colors
    destructive: '#dc2626',
    'destructive-foreground': '#fafafa',
    // Success colors
    success: '#059669',
    'success-foreground': '#fafafa',
    // Warning colors
    warning: '#d97706',
    'warning-foreground': '#fafafa',
    // Info colors
    info: '#2563eb',
    'info-foreground': '#fafafa',
  },
} as const;

export type ThemeColors = typeof themeConfig.light;

// Helper function to apply theme CSS variables
export function applyThemeCSS(theme: 'light' | 'dark') {
  const colors = themeConfig[theme];
  const root = document.documentElement;
  
  // Apply CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      // Handle nested color objects (primary, secondary, neutral)
      Object.entries(value).forEach(([shade, color]) => {
        root.style.setProperty(`--color-${key}-${shade}`, color as string);
      });
    } else {
      // Handle direct color values
      root.style.setProperty(`--color-${key}`, value);
    }
  });
  
  // Apply Tailwind-compatible CSS variables
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
}