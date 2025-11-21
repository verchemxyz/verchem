import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-localstorage-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'verchem-language',
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
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

    resources: {},
    
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
