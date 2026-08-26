'use client'

import { useLanguage } from '@/components/i18n'
import { getTranslation, type Locale } from '@/lib/i18n/translations'

/** The app-wide language provider supports more locales; Lab-QC currently ships EN/TH copy. */
export function useLabTranslations() {
  const { currentLanguage } = useLanguage()
  const locale: Locale = currentLanguage === 'th' ? 'th' : 'en'
  return getTranslation(locale).lab
}
