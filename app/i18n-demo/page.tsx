'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector, TranslatedText, FormattedNumber, FormattedDate, FormattedCurrency } from '@/components/i18n';
import { getChemicalElementName, getChemicalTerm } from '@/lib/chemicalTranslations';

export default function I18nDemoPage() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const sampleElements = ['H', 'He', 'Li', 'C', 'N', 'O', 'Na', 'Cl', 'Ca'];
  const sampleTerms = ['molecularWeight', 'molarity', 'ph', 'stoichiometry', 'temperature', 'pressure'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            <TranslatedText i18nKey="app.title" />
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            <TranslatedText i18nKey="app.tagline" />
          </p>
          <div className="flex justify-center">
            <LanguageSelector />
          </div>
        </div>

        {/* Current Language Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('common.language')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('common.info')}: {currentLanguage.toUpperCase()}
          </p>
        </div>

        {/* Navigation Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Navigation Translations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['home', 'calculators', 'periodicTable', 'converter', 'help', 'about', 'settings'].map((item) => (
              <div key={item} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-sm text-gray-500 dark:text-gray-400">Key: {item}</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  <TranslatedText i18nKey={`navigation.${item}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculator Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Calculator Translations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['molecularWeight', 'molarity', 'ph', 'stoichiometry'].map((calc) => (
              <div key={calc} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  <TranslatedText i18nKey={`calculators.${calc}.title`} />
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <TranslatedText i18nKey={`calculators.${calc}.description`} />
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <TranslatedText i18nKey="common.calculate" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chemical Elements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Chemical Elements Translation
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
            {sampleElements.map((symbol) => (
              <div key={symbol} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{symbol}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {getChemicalElementName(symbol, currentLanguage)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chemical Terms */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Chemical Terms Translation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleTerms.map((term) => (
              <div key={term} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="text-sm text-gray-500 dark:text-gray-400">Key: {term}</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {getChemicalTerm(term, currentLanguage)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Number and Currency Formatting */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Number and Currency Formatting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Large Numbers</h3>
              <div className="space-y-2">
                <div>1234567.89: <FormattedNumber value={1234567.89} /></div>
                <div>0.001234: <FormattedNumber value={0.001234} /></div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Currency</h3>
              <div className="space-y-2">
                <div>USD: <FormattedCurrency value={1234.56} currency="USD" /></div>
                <div>EUR: <FormattedCurrency value={1234.56} currency="EUR" /></div>
                <div>JPY: <FormattedCurrency value={123456} currency="JPY" /></div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Date Formatting</h3>
              <div className="space-y-2">
                <div>Today: <FormattedDate value={new Date()} /></div>
                <div>Specific: <FormattedDate value="2024-12-25" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Common UI Elements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Common UI Elements
          </h2>
          <div className="flex flex-wrap gap-3">
            {['calculate', 'clear', 'reset', 'save', 'load', 'export', 'import', 'copy', 'help', 'settings'].map((action) => (
              <button
                key={action}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <TranslatedText i18nKey={`common.${action}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Error Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Error Messages
          </h2>
          <div className="space-y-3">
            {['required', 'invalidNumber', 'invalidFormula', 'outOfRange', 'positiveNumber'].map((error) => (
              <div key={error} className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
                <div className="text-sm text-red-600 dark:text-red-300">
                  <TranslatedText i18nKey={`validation.${error}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}