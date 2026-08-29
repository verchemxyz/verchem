import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    load: 'languageOnly',
    debug: false,

    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
