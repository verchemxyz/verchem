import { useTranslation } from 'react-i18next';
import { getChemicalElementName, getChemicalTerm } from './chemicalTranslations';

export const useTranslations = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const translateElement = (symbol: string): string => {
    return getChemicalElementName(symbol, currentLanguage);
  };

  const translateTerm = (term: string): string => {
    return getChemicalTerm(term, currentLanguage);
  };

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(currentLanguage, options).format(value);
  };

  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
  };

  return {
    t,
    i18n,
    currentLanguage,
    translateElement,
    translateTerm,
    formatNumber,
    formatCurrency,
    formatDate,
  };
};