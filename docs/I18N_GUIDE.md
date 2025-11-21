# VerChem Internationalization (i18n) System

## Overview

VerChem now includes a comprehensive multi-language support system that supports:

- **7 Languages**: English, Thai, Chinese, Spanish, German, French, Japanese
- **RTL Support**: Ready for right-to-left languages (Arabic, Hebrew, etc.)
- **Chemical Terminology**: Accurate translations for chemical elements and terms
- **Number/Currency/Date Formatting**: Locale-specific formatting
- **Auto Language Detection**: Browser language detection with fallback
- **Persistent Preferences**: Language preference stored in localStorage

## Quick Start

### 1. Basic Usage in Components

```tsx
'use client';

import { useTranslation } from 'react-i18next';
import { TranslatedText, LanguageSelector } from '@/components/i18n';

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Using the translation hook */}
      <h1>{t('app.title')}</h1>
      
      {/* Using the TranslatedText component */}
      <p><TranslatedText i18nKey="app.description" /></p>
      
      {/* Language selector */}
      <LanguageSelector />
    </div>
  );
}
```

### 2. Using the Custom Hook

```tsx
'use client';

import { useTranslations } from '@/lib/use-translations';

export default function MyComponent() {
  const { t, translateElement, formatNumber, formatCurrency } = useTranslations();

  return (
    <div>
      <h1>{t('calculators.molecularWeight.title')}</h1>
      <p>{translateElement('H')} (Hydrogen)</p>
      <p>Price: {formatCurrency(1234.56, 'USD')}</p>
      <p>Amount: {formatNumber(1234567.89)}</p>
    </div>
  );
}
```

## Translation Keys Structure

### App Level
```json
{
  "app": {
    "title": "VerChem - Chemical Calculator",
    "description": "Professional chemical calculation tools",
    "tagline": "Accurate chemical calculations made simple"
  }
}
```

### Navigation
```json
{
  "navigation": {
    "home": "Home",
    "calculators": "Calculators",
    "periodicTable": "Periodic Table",
    "converter": "Converter",
    "help": "Help",
    "about": "About",
    "settings": "Settings"
  }
}
```

### Calculators
```json
{
  "calculators": {
    "title": "Chemical Calculators",
    "molecularWeight": {
      "title": "Molecular Weight Calculator",
      "description": "Calculate molecular weight from chemical formula",
      "formula": "Chemical Formula",
      "placeholder": "Enter formula (e.g., H2O, C6H12O6)",
      "calculate": "Calculate",
      "result": "Molecular Weight",
      "error": "Invalid chemical formula"
    }
  }
}
```

### Chemical Elements
```json
{
  "chemicalElements": {
    "H": "Hydrogen",
    "He": "Helium",
    "Li": "Lithium",
    "C": "Carbon",
    "N": "Nitrogen",
    "O": "Oxygen",
    "Na": "Sodium",
    "Cl": "Chlorine"
  }
}
```

## Components

### LanguageProvider
Wraps your app and provides language context:

```tsx
import { LanguageProvider } from '@/components/i18n';

function App() {
  return (
    <LanguageProvider>
      <YourApp />
    </LanguageProvider>
  );
}
```

### LanguageSelector
Dropdown language selector with flags and native names:

```tsx
import { LanguageSelector } from '@/components/i18n';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

### TranslatedText
Component for translating text with interpolation:

```tsx
import { TranslatedText } from '@/components/i18n';

function MyComponent() {
  return (
    <div>
      <TranslatedText i18nKey="calculators.molecularWeight.title" />
      
      {/* With interpolation */}
      <TranslatedText 
        i18nKey="welcome.message" 
        values={{ name: 'John', count: 5 }}
      />
      
      {/* With components */}
      <TranslatedText 
        i18nKey="welcome.link" 
        components={{ 
          link: <a href="/about" className="text-blue-600" /> 
        }}
      />
    </div>
  );
}
```

### Formatted Components

```tsx
import { FormattedNumber, FormattedCurrency, FormattedDate } from '@/components/i18n';

function MyComponent() {
  return (
    <div>
      <p>Number: <FormattedNumber value={1234567.89} /></p>
      <p>Currency: <FormattedCurrency value={1234.56} currency="USD" /></p>
      <p>Date: <FormattedDate value={new Date()} /></p>
      
      {/* With options */}
      <p>Scientific: <FormattedNumber value={0.001234} options={{ notation: 'scientific' }} /></p>
      <p>EUR: <FormattedCurrency value={1234.56} currency="EUR" /></p>
      <p>Long date: <FormattedDate value={new Date()} options={{ dateStyle: 'long' }} /></p>
    </div>
  );
}
```

## Chemical Translation Utilities

### Chemical Elements
```tsx
import { getChemicalElementName } from '@/lib/chemicalTranslations';

// Get element name in current language
const hydrogenName = getChemicalElementName('H', 'th'); // Returns "ไฮโดรเจน"
```

### Chemical Terms
```tsx
import { getChemicalTerm } from '@/lib/chemicalTranslations';

// Get chemical term in current language
const molarity = getChemicalTerm('molarity', 'zh'); // Returns "摩尔浓度"
```

## Adding New Languages

1. Create a new translation file in `public/locales/[language-code]/common.json`
2. Add the language to the `languages` array in `components/i18n/LanguageProvider.tsx`
3. Update the `i18n` configuration in `next-i18next.config.js`

Example for adding Arabic:

```json
// public/locales/ar/common.json
{
  "app": {
    "title": "VerChem - حاسبة كيميائية",
    "description": "أدوات حساب كيميائية احترافية",
    "tagline": "حسابات كيميائية دقيقة بسيطة"
  }
  // ... rest of translations
}
```

```tsx
// components/i18n/LanguageProvider.tsx
const languages: Language[] = [
  // ... existing languages
  { 
    code: 'ar', 
    name: 'Arabic', 
    nativeName: 'العربية', 
    flag: '🇸🇦', 
    direction: 'rtl' 
  },
];
```

## RTL (Right-to-Left) Support

The system automatically handles RTL languages:

1. Set `direction: 'rtl'` in the language configuration
2. The system will automatically apply RTL styles
3. Numbers and chemical formulas are handled correctly

```tsx
// For RTL languages, use the RTL utilities
import { isRTL, getDirection, applyRTL } from '@/lib/rtl';

function MyComponent() {
  const { i18n } = useTranslation();
  
  if (isRTL(i18n.language)) {
    // Apply RTL-specific logic
  }
}
```

## Best Practices

### 1. Use Translation Keys Consistently
```tsx
// ✅ Good
<TranslatedText i18nKey="calculators.molecularWeight.title" />

// ❌ Avoid hardcoding
<span>Molecular Weight Calculator</span>
```

### 2. Handle Missing Translations
```tsx
// ✅ Good - provide fallback
<TranslatedText 
  i18nKey="calculators.molecularWeight.title" 
  defaultValue="Molecular Weight Calculator"
/>
```

### 3. Use the Custom Hook for Complex Cases
```tsx
// ✅ Good - use the custom hook
const { translateElement, formatNumber } = useTranslations();

// ❌ Avoid mixing approaches
const elementName = getChemicalElementName('H', i18n.language);
```

### 4. Test with Different Languages
Always test your components with different languages to ensure:
- Text fits properly
- Numbers format correctly
- Chemical terms are accurate
- RTL works if applicable

## Language Detection Priority

1. **localStorage**: User's previously selected language
2. **Browser language**: Navigator.language
3. **HTML lang attribute**: `<html lang="en">`
4. **Default**: English (en)

## Performance Considerations

- Translation files are loaded on-demand
- Only the current language's translations are loaded
- Fallback language is loaded if translation is missing
- Local storage caching for language preference

## Troubleshooting

### Translations Not Loading
1. Check that translation files exist in `public/locales/[language]/`
2. Verify language code matches the file name
3. Check browser console for i18n errors

### Language Not Changing
1. Ensure `LanguageProvider` wraps your app
2. Check that `changeLanguage` is being called
3. Verify language code is valid

### Chemical Terms Wrong
1. Check `lib/chemicalTranslations.ts` for the term
2. Verify the translation is correct
3. Consider regional variations (e.g., Spain vs Mexico Spanish)

## Demo Page

Visit `/i18n-demo` to see all features in action:
- Language switching
- Translation examples
- Number/currency/date formatting
- Chemical element translations
- Chemical term translations

This comprehensive system ensures VerChem can serve chemistry students and professionals worldwide in their preferred language with accurate chemical terminology.