import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './public/locales/en/common.json';
import thCommon from './public/locales/th/common.json';
import zhCommon from './public/locales/zh/common.json';
import esCommon from './public/locales/es/common.json';
import deCommon from './public/locales/de/common.json';
import frCommon from './public/locales/fr/common.json';
import jaCommon from './public/locales/ja/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  th: {
    common: thCommon,
  },
  zh: {
    common: zhCommon,
  },
  es: {
    common: esCommon,
  },
  de: {
    common: deCommon,
  },
  fr: {
    common: frCommon,
  },
  ja: {
    common: jaCommon,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'verchem-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, { 
            style: 'currency', 
            currency: getCurrencyForLocale(lng || 'en') 
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        return value;
      }
    },
    
    react: {
      useSuspense: false,
    },
  });

function getCurrencyForLocale(locale: string): string {
  const currencyMap: Record<string, string> = {
    'th': 'THB',
    'zh': 'CNY',
    'es': 'EUR',
    'de': 'EUR',
    'fr': 'EUR',
    'ja': 'JPY',
    'en': 'USD',
  };
  return currencyMap[locale] || 'USD';
}

export default i18n;
