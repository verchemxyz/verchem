'use client';

import React from 'react';
import { LanguageProvider } from './components/i18n';
import { PreferencesProvider } from './lib/preferences';
import { ThemeProvider } from './lib/theme-context';
import { AccessibilityProvider } from './lib/accessibility/context';
import './i18n'; // Import the i18n configuration

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AccessibilityProvider>
          <PreferencesProvider>
            {children}
          </PreferencesProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}