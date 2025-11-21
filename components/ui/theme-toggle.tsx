'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * Theme types
 */
type Theme = 'light' | 'dark'

/**
 * Theme context type
 */
interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider - Global theme management
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Respects system preference (prefers-color-scheme)
 * - Updates document root class for Tailwind dark mode
 * - Smooth transitions between themes
 *
 * @component
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('verchem-theme') as Theme | null
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

    const initialTheme = stored || systemPreference
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // Update theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('verchem-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme hook - Access theme context
 *
 * @throws {Error} If used outside ThemeProvider
 * @returns {ThemeContextType} Theme context
 *
 * @example
 * ```tsx
 * const { theme, toggleTheme } = useTheme()
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

/**
 * ThemeToggle - UI button to toggle theme
 *
 * Displays sun icon for dark mode, moon icon for light mode
 * Includes smooth rotation animation on toggle
 *
 * @component
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const context = useContext(ThemeContext)

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Gracefully handle missing provider
  if (!context) {
    return null // Don't render if no provider
  }

  const { theme, toggleTheme } = context

  // Don't render until mounted (prevents SSR/hydration issues)
  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/10"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Dark mode icon (sun) */}
      <Sun
        className={`absolute h-5 w-5 text-amber-400 transition-all duration-300 ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* Light mode icon (moon) */}
      <Moon
        className={`absolute h-5 w-5 text-slate-300 transition-all duration-300 ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* Tooltip */}
      <span className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </span>
    </button>
  )
}

/**
 * ThemeAwareCanvas - Helper to get theme-aware colors
 *
 * Returns colors that work in both light and dark modes
 *
 * @returns {object} Color palette for current theme
 */
export function useThemeColors() {
  const { theme } = useTheme()

  return React.useMemo(
    () => ({
      background: theme === 'dark' ? '#0f172a' : '#ffffff',
      text: theme === 'dark' ? '#f1f5f9' : '#0f172a',
      border: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      selected: theme === 'dark' ? '#00ffff' : '#0ea5e9',
      hover: theme === 'dark' ? '#ffff00' : '#f59e0b',
      bond: theme === 'dark' ? '#666666' : '#94a3b8',
      atom: {
        C: '#909090',
        H: '#ffffff',
        O: '#ff0d0d',
        N: '#3050f8',
        S: '#ffff30',
        P: '#ff8000',
        F: '#90e050',
        Cl: '#1ff01f',
        Br: '#a62929',
        I: '#940094',
        B: '#ffb5b5',
        Si: '#f0c8a0',
      },
    }),
    [theme]
  )
}
