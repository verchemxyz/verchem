'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/components/i18n';
import { SearchProvider } from '@/lib/search/context';
import { ToastProvider } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/ui/theme-toggle';
import '../i18n'; // Import the i18n configuration

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SearchProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SearchProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
