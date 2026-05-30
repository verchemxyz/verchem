'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, getLanguageByCode } from './LanguageProvider';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, changeLanguage, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = getLanguageByCode(currentLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setIsOpen(false);
  };

  if (!currentLang) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        data-language-selector-button
      >
        <GlobeAltIcon className="h-4 w-4" />
        <span className="flex items-center space-x-2">
          <span className="font-mono text-xs uppercase text-muted-foreground">{currentLang.code}</span>
          <span className="hidden sm:inline">{currentLang.nativeName}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md z-50">
          <div className="py-1">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-accent transition-colors ${
                  currentLanguage === language.code
                    ? 'bg-accent text-primary-600 dark:text-primary-500'
                    : 'text-foreground'
                }`}
              >
                <span className="font-mono text-xs uppercase text-muted-foreground w-6">{language.code}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{language.name}</div>
                </div>
                {currentLanguage === language.code && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const LanguageSelectorInline: React.FC = () => {
  const { currentLanguage, availableLanguages, changeLanguage, isLoading } = useLanguage();

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    await changeLanguage(event.target.value);
  };

  return (
    <div className="flex items-center space-x-2">
      <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        disabled={isLoading}
        className="text-sm border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {availableLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName} ({language.code.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
};
