'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TestI18nPage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          i18n Test Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Language: {i18n.language}
          </h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <strong>App Title:</strong> {t('app.title')}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <strong>App Description:</strong> {t('app.description')}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <strong>Molecular Weight Calculator:</strong> {t('calculators.molecularWeight.title')}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <strong>Periodic Table:</strong> {t('navigation.periodicTable')}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Available Languages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['en', 'th', 'zh', 'es', 'de', 'fr', 'ja'].map((lang) => (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                className={`p-3 rounded border-2 transition-colors ${
                  i18n.language === lang
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{lang.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}