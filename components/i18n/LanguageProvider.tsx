'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: Language[];
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n: i18nInstance } = useTranslation();
  // Keep the first client render identical to SSR. The saved/browser language is
  // restored after hydration so React never has to discard and rebuild the shell.
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
      document.documentElement.lang = lng;
      
      const language = languages.find(l => l.code === lng);
      if (language) {
        document.documentElement.dir = language.direction;
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChange);

    // React can still be hydrating streamed descendants when parent effects run.
    // Two animation frames keep the deterministic English snapshot in place until
    // hydration has committed, then restore the user's preference without a rebuild.
    let restoreFrame = 0;
    const hydrationFrame = window.requestAnimationFrame(() => {
      restoreFrame = window.requestAnimationFrame(() => {
        const storedLanguage = localStorage.getItem('verchem-language');
        const browserLanguage = navigator.language.split('-')[0];
        const preferredLanguage = [storedLanguage, browserLanguage, 'en'].find(
          (language): language is string => Boolean(language && getLanguageByCode(language))
        ) ?? 'en';

        if (i18nInstance.resolvedLanguage === preferredLanguage) {
          handleLanguageChange(preferredLanguage);
        } else {
          void i18nInstance.changeLanguage(preferredLanguage);
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(hydrationFrame);
      window.cancelAnimationFrame(restoreFrame);
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);

  const changeLanguage = async (language: string) => {
    setIsLoading(true);
    try {
      await i18nInstance.changeLanguage(language);
      localStorage.setItem('verchem-language', language);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages: languages,
    changeLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const getLanguageByCode = (code: string): Language | undefined => {
  return languages.find(lang => lang.code === code);
};

export const getCurrentLanguage = (): Language => {
  // Prefer document language when available
  if (typeof document !== 'undefined') {
    const langCode = document.documentElement.lang || i18n.language || 'en';
    const byDoc = getLanguageByCode(langCode);
    if (byDoc) return byDoc;
  }

  const fallback = getLanguageByCode(i18n.language || 'en');
  return fallback || languages[0];
};
