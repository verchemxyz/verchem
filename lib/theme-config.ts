export const themeConfig = {
  light: {
    // Primary colors - Tech Blue
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    // Secondary colors - Cyber Violet
    secondary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    // Neutral colors - Cool Grays
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    // Background and foreground
    background: '#ffffff',
    foreground: '#0f172a',
    // Card colors
    card: 'rgba(255, 255, 255, 0.9)',
    'card-foreground': '#0f172a',
    // Popover colors
    popover: '#ffffff',
    'popover-foreground': '#0f172a',
    // Input colors
    input: '#f1f5f9',
    'input-border': '#e2e8f0',
    // Border and ring
    border: '#e2e8f0',
    ring: '#0ea5e9',
    // Muted colors
    muted: '#f1f5f9',
    'muted-foreground': '#64748b',
    // Accent colors
    accent: '#f1f5f9',
    'accent-foreground': '#0f172a',
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
    info: '#0ea5e9',
    'info-foreground': '#ffffff',
  },
  dark: {
    // Primary colors (inverted) - Electric Blue
    primary: {
      50: '#082f49',
      100: '#0c4a6e',
      200: '#075985',
      300: '#0369a1',
      400: '#0284c7',
      500: '#0ea5e9',
      600: '#38bdf8',
      700: '#7dd3fc',
      800: '#bae6fd',
      900: '#e0f2fe',
      950: '#f0f9ff',
    },
    // Secondary colors (inverted) - Neon Violet
    secondary: {
      50: '#2e1065',
      100: '#4c1d95',
      200: '#5b21b6',
      300: '#6d28d9',
      400: '#7c3aed',
      500: '#8b5cf6',
      600: '#a78bfa',
      700: '#c4b5fd',
      800: '#ddd6fe',
      900: '#ede9fe',
      950: '#f5f3ff',
    },
    // Neutral colors (inverted) - Deep Space
    neutral: {
      50: '#020617',
      100: '#0f172a',
      200: '#1e293b',
      300: '#334155',
      400: '#475569',
      500: '#64748b',
      600: '#94a3b8',
      700: '#cbd5e1',
      800: '#e2e8f0',
      900: '#f1f5f9',
      950: '#f8fafc',
    },
    // Background and foreground
    background: '#020617',
    foreground: '#f8fafc',
    // Card colors
    card: 'rgba(15, 23, 42, 0.6)',
    'card-foreground': '#f8fafc',
    // Popover colors
    popover: '#0f172a',
    'popover-foreground': '#f8fafc',
    // Input colors
    input: '#1e293b',
    'input-border': '#334155',
    // Border and ring
    border: '#1e293b',
    ring: '#0ea5e9',
    // Muted colors
    muted: '#1e293b',
    'muted-foreground': '#94a3b8',
    // Accent colors
    accent: '#1e293b',
    'accent-foreground': '#f8fafc',
    // Destructive colors
    destructive: '#ef4444',
    'destructive-foreground': '#f8fafc',
    // Success colors
    success: '#10b981',
    'success-foreground': '#f8fafc',
    // Warning colors
    warning: '#f59e0b',
    'warning-foreground': '#f8fafc',
    // Info colors
    info: '#0ea5e9',
    'info-foreground': '#f8fafc',
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
