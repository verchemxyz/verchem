'use client';

import React from 'react';
import { LanguageProvider } from '@/components/i18n';
import { SearchProvider } from '@/lib/search/context';
import { UnitProvider } from '@/lib/units';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LanguageProvider>
      <UnitProvider>
        <SearchProvider>{children}</SearchProvider>
      </UnitProvider>
    </LanguageProvider>
  );
}
