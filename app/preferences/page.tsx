'use client';

import { PreferencesProvider } from '@/lib/preferences';
import { PreferencesDemo } from '@/components/preferences/PreferencesDemo';
import { ThemeProvider } from '@/lib/theme-context';

// Prevent static export - this page requires client-side rendering
export const dynamic = 'force-dynamic';

export default function PreferencesPage() {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <div className="container mx-auto py-8 px-4">
          <PreferencesDemo />
        </div>
      </PreferencesProvider>
    </ThemeProvider>
  );
}