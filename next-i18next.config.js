module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th', 'zh', 'es', 'de', 'fr', 'ja'],
    localePath: './public/locales',
    reloadOnPrerender: process.env.NODE_ENV === 'development',
  },
  fallbackLng: {
    'zh-CN': ['zh'],
    'zh-TW': ['zh'],
    'es-ES': ['es'],
    'es-MX': ['es'],
    'default': ['en']
  },
  interpolation: {
    escapeValue: false,
  },
  keySeparator: '.',
  nsSeparator: ':',
}