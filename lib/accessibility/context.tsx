'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shortcut, 
  GLOBAL_SHORTCUTS, 
  matchesShortcut,
  getShortcutsByContext,
} from './keyboard-shortcuts';

interface AccessibilityContextType {
  // Keyboard shortcuts
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut, handler: () => void) => void;
  unregisterShortcut: (shortcutKey: string) => void;
  showShortcutsDialog: boolean;
  setShowShortcutsDialog: (show: boolean) => void;
  
  // Accessibility settings
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  screenReaderMode: boolean;
  setScreenReaderMode: (enabled: boolean) => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Focus management
  focusTrapped: boolean;
  setFocusTrapped: (trapped: boolean) => void;
  focusableElements: HTMLElement[];
  setFocusableElements: (elements: HTMLElement[]) => void;
  
  // Announcements
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Context management
  currentContext: string;
  setCurrentContext: (context: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const router = useRouter();
  const [shortcuts] = useState<Shortcut[]>(GLOBAL_SHORTCUTS);
  const [shortcutHandlers, setShortcutHandlers] = useState<Map<string, () => void>>(new Map());
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  
  // Accessibility settings
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Focus management
  const [focusTrapped, setFocusTrapped] = useState(false);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  
  // Context management
  const [currentContext, setCurrentContext] = useState<string>('global');
  
  // Screen reader announcements
  const [announcement, setAnnouncement] = useState<string>('');
  const [announcementPriority, setAnnouncementPriority] = useState<'polite' | 'assertive'>('polite');
  
  // Register shortcut handler
  const registerShortcut = useCallback((shortcut: Shortcut, handler: () => void) => {
    setShortcutHandlers(prev => {
      const newMap = new Map(prev);
      newMap.set(shortcut.key, handler);
      return newMap;
    });
  }, []);
  
  // Unregister shortcut handler
  const unregisterShortcut = useCallback((shortcutKey: string) => {
    setShortcutHandlers(prev => {
      const newMap = new Map(prev);
      newMap.delete(shortcutKey);
      return newMap;
    });
  }, []);
  
  // Announce to screen reader
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);
    setAnnouncementPriority(priority);
    // Clear announcement after screen readers have time to read it
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle global shortcuts
    for (const shortcut of GLOBAL_SHORTCUTS) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        
        // Execute global shortcut handlers
        const handler = shortcutHandlers.get(shortcut.key);
        if (handler) {
          handler();
          return;
        }
        
        // Handle built-in global shortcuts
        switch (shortcut.key) {
          case 'Alt+N':
            router.push('/periodic-table');
            announceToScreenReader('Navigating to Periodic Table');
            break;
          case 'Alt+S':
            router.push('/search');
            announceToScreenReader('Navigating to Search');
            break;
          case 'Alt+3':
            router.push('/3d-viewer');
            announceToScreenReader('Navigating to 3D Viewer');
            break;
          case 'Alt+M':
            router.push('/molecule-builder');
            announceToScreenReader('Navigating to Molecule Builder');
            break;
          case 'Alt+H':
            router.push('/');
            announceToScreenReader('Navigating to Home');
            break;
          case 'Alt+T':
            router.push('/tutorials');
            announceToScreenReader('Navigating to Tutorials');
            break;
          case 'Alt+C':
            router.push('/calculators');
            announceToScreenReader('Navigating to Calculators');
            break;
          case 'Alt+E':
            // Trigger export - would need to implement export system
            announceToScreenReader('Export functionality - implementation needed');
            break;
          case 'Alt+L':
            {
              const languageButton = document.querySelector<HTMLButtonElement>('[data-language-selector-button]');
              if (languageButton) {
                languageButton.click();
                announceToScreenReader('Language menu opened');
              } else {
                announceToScreenReader('Language switcher not available on this page');
              }
            }
            break;
          case 'Ctrl+?':
            // Show help - would need to implement help system
            announceToScreenReader('Help system - implementation needed');
            break;
          case 'Ctrl+/':
            setShowShortcutsDialog(true);
            announceToScreenReader('Keyboard shortcuts dialog opened');
            break;
          case 'Escape':
            setShowShortcutsDialog(false);
            announceToScreenReader('Dialog closed');
            break;
        }
        return;
      }
    }
    
    // Handle context-specific shortcuts
    const contextShortcuts = getShortcutsByContext(currentContext);
    for (const shortcut of contextShortcuts) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        
        const handler = shortcutHandlers.get(shortcut.key);
        if (handler) {
          handler();
          announceToScreenReader(`${shortcut.description} activated`);
        }
        return;
      }
    }
  }, [currentContext, router, shortcutHandlers, announceToScreenReader]);
  
  // Handle focus trap
  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (!focusTrapped || focusableElements.length === 0) return;
    
    if (event.key === 'Tab') {
      event.preventDefault();
      
      const currentFocus = document.activeElement as HTMLElement;
      const currentIndex = focusableElements.indexOf(currentFocus);
      
      let nextIndex: number;
      if (event.shiftKey) {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      } else {
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      }
      
      focusableElements[nextIndex]?.focus();
    }
  }, [focusTrapped, focusableElements]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDownWrapper = (event: KeyboardEvent) => {
      handleKeyDown(event);
      handleFocusTrap(event);
    };
    
    document.addEventListener('keydown', handleKeyDownWrapper);
    return () => document.removeEventListener('keydown', handleKeyDownWrapper);
  }, [handleKeyDown, handleFocusTrap]);
  
  // Apply accessibility settings to document
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [highContrast, reducedMotion, fontSize]);
  
  // Apply screen reader mode
  useEffect(() => {
    if (screenReaderMode) {
      document.documentElement.setAttribute('role', 'application');
      document.documentElement.setAttribute('aria-label', 'VerChem Chemistry Platform');
    } else {
      document.documentElement.removeAttribute('role');
      document.documentElement.removeAttribute('aria-label');
    }
  }, [screenReaderMode]);
  
  const value: AccessibilityContextType = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    showShortcutsDialog,
    setShowShortcutsDialog,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    screenReaderMode,
    setScreenReaderMode,
    fontSize,
    setFontSize,
    focusTrapped,
    setFocusTrapped,
    focusableElements,
    setFocusableElements,
    announceToScreenReader,
    currentContext,
    setCurrentContext,
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Screen reader announcement live region */}
      <div
        role="status"
        aria-live={announcementPriority}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}
