'use client';

import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

interface TranslatedTextProps {
  i18nKey: string;
  defaultValue?: string;
  values?: Record<string, unknown>;
  components?: Record<string, React.ReactElement>;
  ns?: string;
  className?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  i18nKey,
  defaultValue,
  values,
  components,
  ns = 'common',
  className,
}) => {
  const { t } = useTranslation(ns);

  if (components) {
    return (
      <span className={className}>
        <Trans
          i18nKey={i18nKey}
          ns={ns}
          defaults={defaultValue}
          values={values}
          components={components}
        />
      </span>
    );
  }

  return (
    <span className={className}>
      {String(t(i18nKey, defaultValue || '', { ...values }))}
    </span>
  );
};

export const T = TranslatedText;

interface NumberFormatProps {
  value: number;
  locale?: string;
  options?: Intl.NumberFormatOptions;
  className?: string;
}

export const FormattedNumber: React.FC<NumberFormatProps> = ({
  value,
  locale,
  options,
  className,
}) => {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language;
  
  const formattedValue = new Intl.NumberFormat(currentLocale, options).format(value);
  
  return <span className={className}>{formattedValue}</span>;
};

interface DateFormatProps {
  value: Date | string | number;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

export const FormattedDate: React.FC<DateFormatProps> = ({
  value,
  locale,
  options,
  className,
}) => {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language;
  
  const date = value instanceof Date ? value : new Date(value);
  const formattedValue = new Intl.DateTimeFormat(currentLocale, options).format(date);
  
  return <span className={className}>{formattedValue}</span>;
};

interface CurrencyFormatProps {
  value: number;
  currency?: string;
  locale?: string;
  className?: string;
}

export const FormattedCurrency: React.FC<CurrencyFormatProps> = ({
  value,
  currency = 'USD',
  locale,
  className,
}) => {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language;
  
  const formattedValue = new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency,
  }).format(value);
  
  return <span className={className}>{formattedValue}</span>;
};
