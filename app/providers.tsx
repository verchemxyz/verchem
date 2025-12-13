'use client';

import React from 'react';
import { LanguageProvider } from '@/components/i18n';
import { SearchProvider } from '@/lib/search/context';
import '../i18n'; // Import the i18n configuration

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      <SearchProvider>{children}</SearchProvider>
    </LanguageProvider>
  );
}
